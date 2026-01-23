#!/bin/bash
set -euo pipefail
systemctl enable --now docker || true
docker network create claresys || true

# Herramienta para wait TCP (AL2023)
dnf install -y nc || true

mkdir -p /srv/data/postgres/booking /srv/data/redis /srv/data/rabbitmq /srv/data/kafka /srv/data/zookeeper

# Permisos Kafka (Confluent corre como uid=1000)
chown -R 1000:1000 /srv/data/kafka
chmod -R 775 /srv/data/kafka

# Zookeeper / Rabbit / Redis: permisos amplios para QA
chmod -R 777 /srv/data/zookeeper /srv/data/rabbitmq /srv/data/redis

# --- booking-db ---
docker rm -f booking-db >/dev/null 2>&1 || true
docker pull "${booking_db_image}"
docker run -d --name booking-db \
  --restart=always \
  --network claresys \
  -e POSTGRES_USER="${db_user}" \
  -e POSTGRES_PASSWORD="${db_password}" \
  -e POSTGRES_DB="${booking_db_name}" \
  -v /srv/data/postgres/booking:/var/lib/postgresql/data \
  "${booking_db_image}"

# --- redis ---
docker rm -f redis >/dev/null 2>&1 || true
docker run -d --name redis \
  --restart=always \
  --network claresys \
  -v /srv/data/redis:/data \
  redis:7-alpine

# --- rabbitmq ---
docker rm -f rabbitmq >/dev/null 2>&1 || true
docker run -d --name rabbitmq \
  --restart=always \
  --network claresys \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  -v /srv/data/rabbitmq:/var/lib/rabbitmq \
  rabbitmq:3-alpine

# --- zookeeper + kafka ---
docker rm -f zookeeper kafka >/dev/null 2>&1 || true

docker run -d --name zookeeper \
  --restart=always \
  --network claresys \
  -e ZOOKEEPER_CLIENT_PORT=2181 \
  -e ZOOKEEPER_TICK_TIME=2000 \
  -v /srv/data/zookeeper:/var/lib/zookeeper \
  confluentinc/cp-zookeeper:7.6.1

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

# Espera activa a Kafka (evita NoBrokersAvailable)
echo "Waiting for Kafka kafka:9092..."
for i in {1..60}; do
  if nc -z kafka 9092; then
    echo "Kafka is ready"
    break
  fi
  sleep 2
done

# --- timetable-engine (gRPC :50051 interno) ---
docker rm -f timetable-engine >/dev/null 2>&1 || true
docker pull "${timetable_image}"
docker run -d --name timetable-engine \
  --restart=always \
  --network claresys \
  "${timetable_image}"

# --- booking-command (HTTP :8000 interno) ---
docker rm -f booking-command >/dev/null 2>&1 || true
docker pull "${booking_command_image}"
docker run -d --name booking-command \
  --restart=always \
  --network claresys \
  -e DATABASE_URL="postgresql://${db_user}:${db_password}@booking-db:5432/${booking_db_name}" \
  -e DB_USER="${db_user}" \
  -e DB_PASSWORD="${db_password}" \
  -e BOOKING_DB_HOST="booking-db" \
  -e BOOKING_DB_PORT="5432" \
  -e BOOKING_DB_NAME="${booking_db_name}" \
  -e CLASSROOM_SERVICE_URL="http://${classroom_private_ip}:80" \
  -e CLASSROOM_SERVICE_HOST="${classroom_private_ip}" \
  -e CLASSROOM_SERVICE_PORT="80" \
  -e TIMETABLE_SERVICE_HOST="timetable-engine" \
  -e TIMETABLE_SERVICE_PORT="50051" \
  -e RABBITMQ_HOST="rabbitmq" \
  -e RABBITMQ_PORT="5672" \
  -e KAFKA_BOOTSTRAP_SERVERS="kafka:9092" \
  -e KAFKA_TOPIC_AUDIT="audit.logs" \
  -e SECRET_KEY="${secret_key}" \
  "${booking_command_image}"

# --- booking-query (HTTP :8000 interno) ---
docker rm -f booking-query >/dev/null 2>&1 || true
docker pull "${booking_query_image}"
docker run -d --name booking-query \
  --restart=always \
  --network claresys \
  -e INTERNAL_API_KEY="${internal_api_key}" \
  -e BOOKING_COMMAND_URL="http://booking-command:8000" \
  -e REDIS_HOST="redis" \
  -e REDIS_PORT="6379" \
  -e RABBITMQ_HOST="rabbitmq" \
  -e RABBITMQ_PORT="5672" \
  -e RABBITMQ_USER="guest" \
  -e RABBITMQ_PASSWORD="guest" \
  -e KAFKA_BOOTSTRAP_SERVERS="kafka:9092" \
  -e KAFKA_TOPIC_AUDIT="audit.logs" \
  "${booking_query_image}"

# --- gateway interno: expone todo por :80 al EDGE ---
docker rm -f booking-gateway >/dev/null 2>&1 || true

cat > /opt/booking-nginx.conf <<'EOF'
events { worker_connections 1024; }
http {
  server {
    listen 80;

    location /health {
      add_header Content-Type application/json;
      return 200 '{"status":"ok","service":"booking-gateway"}';
    }

    location /api/v1/bookings/ {
      proxy_pass http://booking-command:8000;
      proxy_set_header Host $host;
      proxy_set_header Authorization $http_authorization;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Request-Id $request_id;
      proxy_set_header X-User-Id $http_x_user_id;
      proxy_set_header X-User-Role $http_x_user_role;
    }

    location /api/v1/queries/ {
      proxy_pass http://booking-query:8000;
      proxy_set_header Host $host;
      proxy_set_header Authorization $http_authorization;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Request-Id $request_id;
      proxy_set_header X-User-Id $http_x_user_id;
      proxy_set_header X-User-Role $http_x_user_role;
    }
  }
}
EOF

docker run -d --name booking-gateway \
  --restart=always \
  --network claresys \
  -p 80:80 \
  -v /opt/booking-nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine
