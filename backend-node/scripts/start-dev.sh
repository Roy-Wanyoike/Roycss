#!/usr/bin/env bash
# Start the RoyCSS backend-node (Express + Prisma) in dev mode.
#
# Resolves its own location — the previous version hardcoded
# /home/z/my-project/backend-node, which broke on every other checkout
# (issue #208).
#
# Configuration comes from backend-node/.env, loaded automatically at
# boot by src/config/dotenv.ts (issue #208). Precedence follows node's
# --env-file rule: variables already present in the shell WIN over .env,
# so an ambient DATABASE_URL (sandbox default) overrides the .env
# database — run `env -u DATABASE_URL scripts/start-dev.sh` to use the
# .env value.
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BACKEND_DIR"

exec env \
  NODE_ENV=development \
  PORT=4000 \
  bun run dev > "$BACKEND_DIR/.backend.log" 2>&1
