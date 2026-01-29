# ============================================================
# 🚀 FRONTEND AFT-GESTIÓN - React + Vite + Auth0 + Tailwind
# ============================================================

###############################
# 1️⃣ BUILD (Node + Vite)
###############################
FROM node:20-alpine AS build
WORKDIR /app

# 🔐 Variables de build (Vite SOLO las lee en build)
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ARG VITE_API_URL
ARG VITE_MAPBOX_TOKEN

ENV VITE_AUTH0_DOMAIN=${VITE_AUTH0_DOMAIN}
ENV VITE_AUTH0_CLIENT_ID=${VITE_AUTH0_CLIENT_ID}
ENV VITE_AUTH0_AUDIENCE=${VITE_AUTH0_AUDIENCE}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_MAPBOX_TOKEN=${VITE_MAPBOX_TOKEN}

# Dependencias
COPY package*.json ./
RUN npm ci || npm install

# Código
COPY . .

# Build
RUN npm run build

###############################
# 2️⃣ RUNTIME (Nginx)
###############################
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Limpiar default
RUN rm -rf ./*

# Copiar build
COPY --from=build /app/dist .

# SPA routing (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
