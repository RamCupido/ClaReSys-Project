#!/bin/bash
set -e

mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

docker --version
docker compose version

mkdir -p /opt/claresys
cd /opt/claresys

curl -fsSL "https://raw.githubusercontent.com/RamCupido/ClaReSys-Project/${REPO_BRANCH}/${COMPOSE_APP_PATH}" \
  -o docker-compose.yml

cat > .env <<EOF
ENV=dev

POSTGRES_HOST=${INFRA_PRIVATE_IP}
POSTGRES_PORT=5432

MONGO_HOST=${INFRA_PRIVATE_IP}
MONGO_PORT=27017

REDIS_HOST=${INFRA_PRIVATE_IP}
REDIS_PORT=6379

RABBITMQ_HOST=${INFRA_PRIVATE_IP}
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

KAFKA_BROKERS=${INFRA_PRIVATE_IP}:9092

# JWT_SECRET=...
# JWT_ALGORITHM=HS256
EOF

docker compose pull
docker compose up -d
