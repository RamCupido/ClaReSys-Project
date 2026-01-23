FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./

COPY apps/front-web/package.json apps/front-web/package.json

RUN npm ci

COPY . .

RUN npm --prefix apps/front-web run build:qa

FROM nginx:alpine
COPY --from=build /repo/apps/front-web/dist /usr/share/nginx/html

RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
EOF
