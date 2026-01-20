FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./

COPY apps/front-web/package.json apps/front-web/package.json

RUN npm ci

COPY . .

RUN npm --prefix apps/front-web run build

FROM nginx:alpine
COPY --from=build /repo/apps/front-web/dist /usr/share/nginx/html

# SPA fallback (React Router)
RUN printf "server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files \$uri \$uri/ /index.html;\n\
  }\n\
}\n" > /etc/nginx/conf.d/default.conf
