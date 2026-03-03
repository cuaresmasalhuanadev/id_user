# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Remove dev files
RUN rm -f .env .env.example

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
