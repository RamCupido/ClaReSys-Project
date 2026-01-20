#!/bin/bash
set -e

# Instalar docker compose como plugin (sin apt)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

docker --version
docker compose version

mkdir -p /opt/claresys
cd /opt/claresys

curl -fsSL "https://raw.githubusercontent.com/RamCupido/ClaReSys-Project/${REPO_BRANCH}/${COMPOSE_INFRA_PATH}" \
  -o docker-compose.yml

# .env del infra (ajusta nombres según tu .env actual)
cat > .env <<EOF
DB_USER=postgres
DB_PASSWORD=postgres
CLASSROOM_DB_NAME=classroom
BOOKING_DB_NAME=booking
USERS_DB_NAME=users

RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

INFRA_PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
EOF

docker compose pull
docker compose up -d
