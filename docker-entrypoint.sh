#!/bin/sh
set -e

# Start Node.js backend in background
echo "[Entrypoint] Starting Node.js API on port 3000..."
node /app/backend/server.js &

# Start Nginx in foreground
echo "[Entrypoint] Starting Nginx on port 8084..."
nginx -g "daemon off;"
