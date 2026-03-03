# ═══════════════════════════════════════════════════════════════════
#  Biegs Frits Store — Single Container Image
#  Docker Hub: cuaresmasalhuanadev/biegsfrits-store:latest
#  Ports: Nginx (8084 public) → Node.js API (3000 internal)
# ═══════════════════════════════════════════════════════════════════

# ── Stage 1: Build Angular ──────────────────────────────────────────
FROM node:20-alpine AS angular-build

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build -- --configuration production

# ── Stage 2: Install Node.js backend deps ──────────────────────────
FROM node:20-alpine AS backend-build

WORKDIR /backend
COPY backend-node/package*.json ./
RUN npm ci --omit=dev
COPY backend-node/ .

# ── Stage 3: Final image ────────────────────────────────────────────
FROM nginx:1.25-alpine

# Install Node.js in the final image
RUN apk add --no-cache nodejs npm

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Angular build to Nginx web root
COPY --from=angular-build /frontend/dist/frontend/browser /usr/share/nginx/html

# Copy Node.js backend
RUN mkdir -p /app/backend
COPY --from=backend-build /backend /app/backend

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose public port (matches Koyeb config)
EXPOSE 8084

# Default env vars (override on Koyeb)
ENV NODE_ENV=production \
    PORT=3000 \
    MONGODB_URI="" \
    JWT_SECRET="" \
    ADMIN_EMAIL="peabodycuaresmasalhuana@yahoo.com" \
    ADMIN_WHATSAPP="+51917360503" \
    ADMIN_REFERRAL_CODE="2026@Body26feb"

ENTRYPOINT ["/docker-entrypoint.sh"]
