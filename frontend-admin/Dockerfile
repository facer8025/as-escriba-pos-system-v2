FROM node:22-alpine AS build

WORKDIR /app

# Cache de dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Build
COPY . .
RUN npm run build

# Nginx (template con envsubst: NGINX_PORT / BACKEND_UPSTREAM)
FROM nginx:1.27-alpine

# Valores por defecto (el compose los sobreescribe según el entorno)
ENV NGINX_PORT=80 \
    BACKEND_UPSTREAM=backend:8080

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.template.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
