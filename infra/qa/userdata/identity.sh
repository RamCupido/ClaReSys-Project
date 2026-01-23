#!/bin/bash
set -euo pipefail
systemctl enable --now docker || true
docker network create claresys || true

mkdir -p /srv/data/postgres/users

# users-db (con init.sql embebido en la imagen augusto573/users-db:qa)
docker rm -f users-db >/dev/null 2>&1 || true
docker pull "${users_db_image}"
docker run -d --name users-db \
  --restart=always \
  --network claresys \
  -e POSTGRES_USER="${db_user}" \
  -e POSTGRES_PASSWORD="${db_password}" \
  -e POSTGRES_DB="${users_db_name}" \
  -v /srv/data/postgres/users:/var/lib/postgresql/data \
  "${users_db_image}"

sleep 10

# auth-service (NO exponemos puerto al host; irá por el "router" nginx interno)
docker rm -f auth-service >/dev/null 2>&1 || true
docker pull "${auth_image}"
docker run -d --name auth-service \
  --restart=always \
  --network claresys \
  -e DATABASE_URL="postgresql://${db_user}:${db_password}@users-db:5432/${users_db_name}" \
  -e DB_USER="${db_user}" \
  -e DB_PASSWORD="${db_password}" \
  -e USERS_DB_HOST="users-db" \
  -e USERS_DB_PORT="5432" \
  -e USERS_DB_NAME="${users_db_name}" \
  "${auth_image}"

# user-service
docker rm -f user-service >/dev/null 2>&1 || true
docker pull "${user_image}"
docker run -d --name user-service \
  --restart=always \
  --network claresys \
  -e DATABASE_URL="postgresql://${db_user}:${db_password}@users-db:5432/${users_db_name}" \
  -e DB_USER="${db_user}" \
  -e DB_PASSWORD="${db_password}" \
  -e USERS_DB_HOST="users-db" \
  -e USERS_DB_PORT="5432" \
  -e USERS_DB_NAME="${users_db_name}" \
  "${user_image}"

# Nginx interno para exponer auth + users por un único puerto 80 hacia EDGE
docker rm -f identity-gateway >/dev/null 2>&1 || true

cat > /opt/identity-nginx.conf <<'EOF'
events { worker_connections 1024; }
http {
  server {
    listen 80;

    location /health {
      add_header Content-Type application/json;
      return 200 '{"status":"ok","service":"identity-gateway"}';
    }

    location /api/v1/auth/ {
      proxy_pass http://auth-service:8000;
      proxy_set_header Host $host;
      proxy_set_header Authorization $http_authorization;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Request-Id $request_id;
    }

    location /api/v1/users/ {
      proxy_pass http://user-service:8000;
      proxy_set_header Host $host;
      proxy_set_header Authorization $http_authorization;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Request-Id $request_id;
    }
  }
}
EOF

docker run -d --name identity-gateway \
  --restart=always \
  --network claresys \
  -p 80:80 \
  -v /opt/identity-nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine
