# ─────────────────────────────────────────────────────────────────────────
# RoyCSS backend — production image (audit F-03 / F-04)
#
# Build context: backend-node/ — the Railway service must be configured
# with root directory `backend-node` (true today: `COPY package.json bun.lock`
# resolves to the backend manifest, not the repo-root one).
#
# Environment comes from Railway env vars at RUNTIME. The old CMD loaded a
# gitignored `--env-file=.env` that never existed inside the image; it also
# ran `bun run dev` (tsx watch + permissive dev CORS + pretty logs). This
# image runs the compiled `dist/` server under NODE_ENV=production.
#
# Schema is NOT initialized here: CI runs `prisma migrate deploy` against
# the Railway DATABASE_URL BEFORE this revision starts serving traffic
# (see .github/workflows/deploy.yml). Migrations are still copied into the
# image so `bunx prisma migrate deploy` works from inside the container in
# a pinch (the prisma CLI is a devDependency, so use `bunx --package prisma
# prisma migrate deploy` with the toolchain available, or prefer CI).
# ─────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder — full toolchain, generate Prisma client, compile TS ──
FROM oven/bun:1.1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN bunx prisma generate \
 && bun run build \
 && test -f dist/index.js

# ── Stage 2: runtime — production deps only, no toolchain ─────────────────
FROM oven/bun:1.1 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Production dependencies only. Dev-only toolchain (typescript, vitest,
# playwright/lighthouse browser tooling — F-19) never reaches this layer;
# the modules that can use browser tooling degrade gracefully by design.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Prisma client generated in the builder (the prisma CLI is a devDep, and
# the generated client embeds the query engine for this exact base image).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Compiled server + schema/migrations for reference and emergency use.
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Run as the image's non-root user.
RUN chown -R bun:bun /app
USER bun

EXPOSE 4000

# `node` is not present in oven/bun — run the compiled server with bun.
# Health endpoint: GET /api/v1/health (Railway healthcheck path).
CMD ["bun", "dist/index.js"]
