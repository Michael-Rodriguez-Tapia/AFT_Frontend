# ============================================================
# 🚀 FRONTEND AFT-GESTIÓN - React + Vite + Auth0 + Tailwind
# ============================================================

###############################
# 1️⃣ ETAPA DE BUILD (Node + Vite)
###############################
FROM node:20-bullseye AS build
WORKDIR /app

# Recibir variables desde docker-compose
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ARG VITE_API_URL
ARG VITE_MAPBOX_TOKEN

# Exportarlas para Vite (obligatorio)
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build


###############################
# 2️⃣ ETAPA DE PRODUCCIÓN (Nginx)
###############################
FROM nginx:stable-alpine AS production
WORKDIR /usr/share/nginx/html

# Limpiar archivos default
RUN rm -rf ./*

# Copiar build
COPY --from=build /app/dist .

# Copiar config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
