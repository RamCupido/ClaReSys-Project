#!/bin/bash
set -euo pipefail

systemctl enable --now docker || true

docker network create claresys || true

mkdir -p /srv/data/postgres/classroom /srv/data/kafka /srv/data/zookeeper

# DB
docker rm -f classroom-db >/dev/null 2>&1 || true
docker pull "augusto573/classroom-db:qa"
docker run -d --name classroom-db \
  --restart=always \
  --network claresys \
  -e POSTGRES_USER="${db_user}" \
  -e POSTGRES_PASSWORD="${db_password}" \
  -e POSTGRES_DB="${classroom_db_name}" \
  -v /srv/data/postgres/classroom:/var/lib/postgresql/data \
  "augusto573/classroom-db:qa"

# 2) Zookeeper + Kafka
docker rm -f zookeeper kafka >/dev/null 2>&1 || true

docker run -d --name zookeeper \
  --restart=always \
  --network claresys \
  -e ZOOKEEPER_CLIENT_PORT=2181 \
  -e ZOOKEEPER_TICK_TIME=2000 \
  -v /srv/data/zookeeper:/var/lib/zookeeper \
  -p 2181:2181 \
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
  -v /srv/data/kafka:/var/lib/kafka/data \
  -p 9092:9092 \
  confluentinc/cp-kafka:7.6.1

sleep 20

# 3) Classroom service
docker rm -f classroom-service >/dev/null 2>&1 || true
docker pull "${classroom_image}"

# Classroom service on host :80
docker rm -f classroom-service >/dev/null 2>&1 || true
docker pull "${classroom_image}"
docker run -d --name classroom-service \
  --restart=always \
  --network claresys \
  -p 80:8000 \
  -e DATABASE_URL="postgresql://${db_user}:${db_password}@classroom-db:5432/${classroom_db_name}" \
  -e KAFKA_BOOTSTRAP_SERVERS="kafka:9092" \
  -e KAFKA_TOPIC_AUDIT="${kafka_topic_audit}" \
  "${classroom_image}"
