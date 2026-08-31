#!/usr/bin/env bash
# Start the RoyCSS backend-node (Express + Prisma) in detached mode.
cd /home/z/my-project/backend-node
exec env \
  NODE_ENV=development \
  PORT=4000 \
  LOG_LEVEL=info \
  CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000" \
  DATABASE_URL="file:./dev.db" \
  JWT_SECRET="dev-secret-please-change-this-to-64-char-random-string-aaaa" \
  JWT_REFRESH_SECRET="dev-refresh-secret-please-change-this-too-64-char-bbbb" \
  JWT_EXPIRES_IN="15m" \
  JWT_REFRESH_EXPIRES_IN="7d" \
  RATE_LIMIT_WINDOW_MS=60000 \
  RATE_LIMIT_MAX_GENERAL=100 \
  RATE_LIMIT_MAX_AUTH=10 \
  RATE_LIMIT_MAX_CONTACT=5 \
  EFFECTS_DATA_PATH="../dist/effects.json" \
  bun run dev > /home/z/my-project/backend-node/.backend.log 2>&1
