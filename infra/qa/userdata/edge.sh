#!/bin/bash
set -euo pipefail
systemctl enable --now docker || true

mkdir -p /opt/nginx

cat > /opt/nginx/nginx.conf <<EOF
events { worker_connections 1024; }

http {
  include       mime.types;
  default_type  application/json;

  access_log /var/log/nginx/access.log;
  error_log  /var/log/nginx/error.log;

  proxy_connect_timeout 10s;
  proxy_send_timeout 180s;
  proxy_read_timeout 180s;
  send_timeout 180s;
  client_body_timeout 180s;
  client_header_timeout 180s;

  server {
    listen 80;

    # QA: CORS abierto (restringe en prod)
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, Origin, X-Requested-With, X-Request-Id, X-User-Id, X-User-Role' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length, Content-Type, X-Request-Id' always;

    if (\$request_method = OPTIONS) { return 204; }

    location /health {
      add_header Content-Type application/json;
      return 200 '{"status":"UP","gateway":"nginx"}';
    }

    location /api/v1/classrooms/ {
      proxy_pass http://${classroom_private_ip}:80/api/v1/classrooms/;
      proxy_set_header Host \$host;
      proxy_set_header Authorization \$http_authorization;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
      proxy_set_header X-Request-Id \$request_id;
      proxy_set_header X-User-Id \$http_x_user_id;
      proxy_set_header X-User-Role \$http_x_user_role;
    }

    location /api/v1/auth/ {
      proxy_pass http://${identity_private_ip}:80;
      proxy_set_header Host \$host;
      proxy_set_header Authorization \$http_authorization;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
      proxy_set_header X-Request-Id \$request_id;
      proxy_set_header X-User-Id \$http_x_user_id;
      proxy_set_header X-User-Role \$http_x_user_role;
    }

    location /api/v1/users/ {
      proxy_pass http://${identity_private_ip}:80;
      proxy_set_header Host \$host;
      proxy_set_header Authorization \$http_authorization;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
      proxy_set_header X-Request-Id \$request_id;
      proxy_set_header X-User-Id \$http_x_user_id;
      proxy_set_header X-User-Role \$http_x_user_role;
    }

    location /api/v1/bookings/ {
      proxy_pass http://${booking_private_ip}:80;
      proxy_set_header Host \$host;
      proxy_set_header Authorization \$http_authorization;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
      proxy_set_header X-Request-Id \$request_id;
      proxy_set_header X-User-Id \$http_x_user_id;
      proxy_set_header X-User-Role \$http_x_user_role;
    }

    location /api/v1/queries/ {
      proxy_pass http://${booking_private_ip}:80;
      proxy_set_header Host \$host;
      proxy_set_header Authorization \$http_authorization;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
      proxy_set_header X-Request-Id \$request_id;
      proxy_set_header X-User-Id \$http_x_user_id;
      proxy_set_header X-User-Role \$http_x_user_role;
    }

    location /api/v1/audit-logs {
      proxy_pass http://${ops_private_ip}:80;
      proxy_set_header Authorization \$http_authorization;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
      proxy_set_header X-Request-Id \$request_id;
      proxy_set_header X-User-Id \$http_x_user_id;
      proxy_set_header X-User-Role \$http_x_user_role;
    }

    location /api/v1/maintenance {
      proxy_pass http://${ops_private_ip}:80;
      proxy_set_header Authorization \$http_authorization;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
      proxy_set_header X-Request-Id \$request_id;
      proxy_set_header X-User-Id \$http_x_user_id;
      proxy_set_header X-User-Role \$http_x_user_role;
    }

    location /api/v1/reports {
      proxy_pass http://${ops_private_ip}:80;
      proxy_set_header Authorization \$http_authorization;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
      proxy_set_header X-Request-Id \$request_id;
      proxy_set_header X-User-Id \$http_x_user_id;
      proxy_set_header X-User-Role \$http_x_user_role;
    }
  }
}
EOF

docker rm -f api-gateway >/dev/null 2>&1 || true
docker pull "${edge_image}"
docker run -d --name api-gateway \
  --restart=always \
  -p 80:80 \
  -v /opt/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  "${edge_image}"
