# ========================================================================
# Build stage
# ========================================================================
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-/api/v1}

RUN npm run build

# ========================================================================
# Runtime stage - Nginx
# ========================================================================
FROM nginx:1.27-alpine AS runtime

# Valores por defecto (el compose los sobreescribe según el entorno)
ENV NGINX_PORT=80 \
    BACKEND_UPSTREAM=backend:8080

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Plantilla nginx (envsubst del entrypoint oficial sustituye NGINX_PORT / BACKEND_UPSTREAM)
COPY nginx.template.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
