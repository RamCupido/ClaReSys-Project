#!/bin/bash
set -euo pipefail
systemctl enable --now docker || true
docker network create claresys || true

mkdir -p /srv/data/mongo /srv/data/rabbitmq /srv/data/kafka /srv/data/zookeeper /srv/data/emqx

chmod -R 777 /srv/data/mongo /srv/data/rabbitmq /srv/data/kafka /srv/data/zookeeper /srv/data/emqx

# --- MongoDB ---
docker rm -f mongodb >/dev/null 2>&1 || true
docker run -d --name mongodb \
  --restart=always \
  --network claresys \
  -e MONGO_INITDB_ROOT_USERNAME="${mongo_user}" \
  -e MONGO_INITDB_ROOT_PASSWORD="${mongo_password}" \
  -v /srv/data/mongo:/data/db \
  mongo:7

# --- RabbitMQ ---
docker rm -f rabbitmq >/dev/null 2>&1 || true
docker run -d --name rabbitmq \
  --restart=always \
  --network claresys \
  -e RABBITMQ_DEFAULT_USER="${rabbit_user}" \
  -e RABBITMQ_DEFAULT_PASS="${rabbit_password}" \
  -v /srv/data/rabbitmq:/var/lib/rabbitmq \
  rabbitmq:3-alpine

# --- Zookeeper + Kafka (para audit-log si consume) ---
docker rm -f zookeeper kafka >/dev/null 2>&1 || true

docker run -d --name zookeeper \
  --restart=always \
  --network claresys \
  -e ZOOKEEPER_CLIENT_PORT=2181 \
  -e ZOOKEEPER_TICK_TIME=2000 \
  -v /srv/data/zookeeper:/var/lib/zookeeper \
  confluentinc/cp-zookeeper:7.6.1

# Kafka necesita carpeta writable por uid 1000
chown -R 1000:1000 /srv/data/kafka || true
chmod -R 775 /srv/data/kafka || true

docker run -d --name kafka \
  --restart=always \
  --network claresys \
  -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
  -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  -e KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1 \
  -e KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1 \
  -e KAFKA_LOG_DIRS=/var/lib/kafka/data \
  -v /srv/data/kafka:/var/lib/kafka/data \
  confluentinc/cp-kafka:7.6.1

sleep 20

# --- EMQX ---
docker rm -f emqx >/dev/null 2>&1 || true
docker run -d --name emqx \
  --restart=always \
  --network claresys \
  -e EMQX_ALLOW_ANONYMOUS=true \
  -v /srv/data/emqx:/opt/emqx/data \
  emqx/emqx:5.3.0

# ---------------------------
# Servicios OPS
# ---------------------------
MONGO_URI="mongodb://${mongo_user}:${mongo_password}@mongodb:27017/${mongo_db}?authSource=admin"

# audit-log-service
docker rm -f audit-log-service >/dev/null 2>&1 || true
docker pull "${audit_image}"
docker run -d --name audit-log-service \
  --restart=always \
  --network claresys \
  -e MONGO_URI="$MONGO_URI" \
  -e MONGO_DB="${mongo_db}" \
  -e KAFKA_BOOTSTRAP_SERVERS="kafka:9092" \
  -e KAFKA_TOPIC_AUDIT="audit.logs" \
  "${audit_image}"

# maintenance-service
docker rm -f maintenance-service >/dev/null 2>&1 || true
docker pull "${maintenance_image}"
docker run -d --name maintenance-service \
  --restart=always \
  --network claresys \
  -e MONGO_URI="$MONGO_URI" \
  -e MONGO_DB="${mongo_db}" \
  -e MONGO_COLLECTION="maintenance_tickets" \
  -e RABBITMQ_HOST="rabbitmq" \
  -e RABBITMQ_PORT="5672" \
  -e RABBITMQ_USER="${rabbit_user}" \
  -e RABBITMQ_PASSWORD="${rabbit_password}" \
  -e RABBITMQ_EXCHANGE="${rabbit_exchange_domain}" \
  "${maintenance_image}"

# reporting-service
# Apunta a booking-gateway (instancia booking en :80) y classroom (instancia classroom en :80)
docker rm -f reporting-service >/dev/null 2>&1 || true
docker pull "${reporting_image}"
docker run -d --name reporting-service \
  --restart=always \
  --network claresys \
  -e BOOKING_QUERY_BASE_URL="http://${booking_private_ip}:80" \
  -e CLASSROOM_SERVICE_BASE_URL="http://${classroom_private_ip}:80" \
  -e MAINTENANCE_SERVICE_BASE_URL="http://maintenance-service:8000" \
  -e REQUEST_TIMEOUT_SECONDS="${request_timeout_seconds}" \
  "${reporting_image}"

# notification-service (sin endpoints; solo consume eventos y envía emails)
docker rm -f notification-service >/dev/null 2>&1 || true
docker pull "${notification_image}"
docker run -d --name notification-service \
  --restart=always \
  --network claresys \
  -e USER_SERVICE_BASE_URL="http://${booking_private_ip}:80/api/v1/users" \
  -e RABBITMQ_HOST="rabbitmq" \
  -e RABBITMQ_PORT="5672" \
  -e SMTP_HOST="${smtp_host}" \
  -e SMTP_PORT="${smtp_port}" \
  -e SMTP_USER="${smtp_user}" \
  -e SMTP_PASSWORD="${smtp_password}" \
  -e SMTP_USE_TLS=true \
  -e SMTP_USE_SSL=false \
  -e SMTP_DEBUG=true \
  -e FROM_EMAIL="${from_email}" \
  -e FROM_NAME="${from_name}" \
  "${notification_image}"

# mqtt-bridge (consume Rabbit y publica en EMQX)
docker rm -f mqtt-bridge >/dev/null 2>&1 || true
docker pull "${mqtt_bridge_image}"
docker run -d --name mqtt-bridge \
  --restart=always \
  --network claresys \
  -e RABBITMQ_HOST="rabbitmq" \
  -e RABBITMQ_PORT="5672" \
  -e RABBITMQ_EXCHANGE="booking_events" \
  -e RABBITMQ_QUEUE="mqtt.bridge" \
  -e RABBITMQ_BINDING_KEYS="booking.*" \
  -e MQTT_HOST="emqx" \
  -e MQTT_PORT="1883" \
  -e MQTT_TOPIC_PREFIX="${mqtt_topic_prefix}" \
  -e MQTT_TLS="false" \
  "${mqtt_bridge_image}"

# ---------------------------
# ops-gateway interno (1 solo puerto 80)
# ---------------------------
docker rm -f ops-gateway >/dev/null 2>&1 || true

cat > /opt/ops-nginx.conf <<'EOF'
events { worker_connections 1024; }
http {
  server {
    listen 80;

    location /health {
      add_header Content-Type application/json;
      return 200 '{"status":"ok","service":"ops-gateway"}';
    }

    location /api/v1/audit-logs {
      proxy_pass http://audit-log-service:8000;
      proxy_set_header Authorization $http_authorization;
    }

    location /api/v1/maintenance {
      proxy_pass http://maintenance-service:8000;
      proxy_set_header Authorization $http_authorization;
    }

    location /api/v1/reports {
      proxy_pass http://reporting-service:8000;
      proxy_set_header Authorization $http_authorization;
    }
  }
}
EOF

docker run -d --name ops-gateway \
  --restart=always \
  --network claresys \
  -p 80:80 \
  -v /opt/ops-nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine
