# Stage 1: build the React app into static files.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Vite inlines VITE_* values at build time. Railway passes service variables
# to the build when they are declared here as ARG.
# VITE_API_URL is fixed to /api: nginx forwards it to the game API (see API_UPSTREAM).
ARG VITE_CHATBOT_API_URL
ENV VITE_CHATBOT_API_URL=$VITE_CHATBOT_API_URL \
    VITE_API_URL=/api

RUN npm run build

# Stage 2: serve the static files with nginx.
FROM nginx:1.27-alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Railway sets these at runtime. nginx listens on PORT, and forwards /api/ to API_UPSTREAM,
# for example https://your-api.up.railway.app (no trailing slash).
ENV PORT=8080
# API_UPSTREAM has no default: nginx will not start without it.
EXPOSE 8080
