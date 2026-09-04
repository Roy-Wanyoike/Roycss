# RoyCSS Backend

World-class backend infrastructure for the RoyCSS project. Self-contained,
production-ready, and runs independently from the Next.js frontend.

> **Stack**: Node.js · TypeScript (strict) · Express 4 · Prisma 6 · SQLite (dev) / Postgres-ready · JWT + Refresh Tokens · Zod · In-memory LRU cache · Sliding-window rate limiter · Helmet.

---

## Why Express (not Hono)?

We considered **Hono** (modern, edge-ready, smaller surface) but chose
**Express** for this backend because:

1. **Ecosystem** — `helmet`, `cors`, `morgan`, `@types/express` are all
   battle-tested Express middleware. The team can lean on Stack Overflow
   answers from the last decade.
2. **Prisma + Express integration** — Prisma's docs use Express examples;
   no surprises.
3. **Stability** — Express 4 is in maintenance with a stable API. Express 5
   is on the way but unnecessary for our scope.
4. **No edge requirement** — This backend runs as a long-lived Node.js
   process behind Caddy/Nginx. Hono's edge advantage doesn't apply.
5. **Team familiarity** — Express is the most widely-known Node framework,
   reducing onboarding time.

If we later need edge-deployed auth proxies or route handlers that run on
Cloudflare Workers, Hono is the right tool for *those* services.

---

## Architecture

```
backend/
├── package.json              Independent package: name "roycss-backend"
├── tsconfig.json             Strict, ES2022, NodeNext, isolatedModules
├── .env.example              All env vars (with defaults) documented here
├── prisma/
│   └── schema.prisma         User · ContactMessage · EffectFavorite · Collection
└── src/
    ├── index.ts              Entry — boots server, hooks SIGINT/SIGTERM
    ├── config/
    │   ├── env.ts            Zod-validated env loader (fails fast on bad config)
    │   └── constants.ts      Derived constants (CORS, rate limits, JWT, cache TTLs)
    ├── server/
    │   ├── app.ts            Express app factory — wires all middleware + routes
    │   └── middleware/
    │       ├── cors.ts       CORS (allow localhost:3000 + configurable origins)
    │       ├── rateLimit.ts  Sliding-window in-memory limiter (per IP, per scope)
    │       ├── auth.ts       requireAuth / optionalAuth — JWT verification
    │       ├── error.ts      AppError + centralized errorHandler + asyncHandler
    │       ├── logging.ts    Request id + structured access logs (morgan + JSON)
    │       └── validate.ts   Zod body/query/params validation
    ├── modules/
    │   ├── effects/          Serves effects from ../dist/effects.json
    │   ├── recipes/          Curated recipe snapshot
    │   ├── patterns/         UX pattern snapshot
    │   ├── contact/          POST /contact → Prisma ContactMessage
    │   ├── auth/             register / login / refresh / me — JWT + bcrypt
    │   └── health/           GET /health — status, uptime, DB ping, memory
    ├── lib/
    │   ├── db.ts             Prisma singleton (mirrors src/lib/db.ts pattern)
    │   ├── cache.ts          LRU cache (max 1000, TTL, cacheWrap helper)
    │   ├── jwt.ts            sign/verify access + refresh tokens (HS256)
    │   └── logger.ts         Structured JSON logger (info/warn/error/debug)
    └── types/
        └── index.ts          Shared types (User, Effect, Recipe, Pattern, ...)
```

### Layering rule

```
routes.ts  →  service.ts  →  lib/  +  prisma
   ↑              ↑
validate.ts   error.ts (throws AppError)
```

- **routes** = Express handlers, request validation, response shape.
- **service** = business logic, caching, DB calls. Never touches `req`/`res`.
- **lib** = stateless utilities (cache, jwt, logger, db).
- Errors are always `AppError` instances → centralized `errorHandler`
  formats them into `{ error: { code, message, details? }, requestId }`.

---

## API Reference

Base URL: `http://localhost:4000/api/v1`

### Health

| Method | Path        | Description                              | Auth |
|--------|-------------|------------------------------------------|------|
| GET    | `/health`   | Status, uptime, version, DB ping, memory | –    |

### Effects

| Method | Path                  | Description                            | Auth |
|--------|-----------------------|----------------------------------------|------|
| GET    | `/effects`            | List + filter + paginate               | –    |
| GET    | `/effects/search?q=`  | Full-text search (name, desc, tags)    | –    |
| GET    | `/effects/categories` | Distinct categories present in dataset | –    |
| GET    | `/effects/tags`       | Distinct tags                          | –    |
| GET    | `/effects/:id`        | Single effect by id                    | –    |

**Query params for `/effects`**: `page`, `limit` (max 200), `category`,
`tag`, `previewType`, `sort` (`name` | `name-desc` | `category` | `id`).

### Recipes

| Method | Path            | Description                            | Auth |
|--------|-----------------|----------------------------------------|------|
| GET    | `/recipes`      | List + filter (category, difficulty)   | –    |
| GET    | `/recipes/:id`  | Single recipe by id                    | –    |

### Patterns

| Method | Path             | Description                  | Auth |
|--------|------------------|------------------------------|------|
| GET    | `/patterns`      | List + filter (category)     | –    |
| GET    | `/patterns/:id`  | Single pattern by id         | –    |

### Contact

| Method | Path       | Description                                  | Auth | Rate limit |
|--------|------------|----------------------------------------------|------|------------|
| POST   | `/contact` | Submit a contact message (saved to Prisma)   | –    | 5 / min / IP |

**Body**: `{ name, email, subject?, message }` (subject defaults to
`"General Inquiry"`; message must be ≥ 10 chars).

### Auth

| Method | Path             | Description                              | Auth | Rate limit |
|--------|------------------|------------------------------------------|------|------------|
| POST   | `/auth/register` | Create account → token pair              | –    | 10 / min / IP |
| POST   | `/auth/login`    | Email + password → token pair            | –    | 10 / min / IP |
| POST   | `/auth/refresh`  | Refresh token → new token pair           | –    | 10 / min / IP |
| GET    | `/auth/me`       | Current user                             | Bearer | 100 / min / IP (general) |

### Standard Response Shape

Success:
```json
{ "data": { ... }, "meta": { "page": 1, "limit": 24, "total": 1569, "totalPages": 66 } }
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "target": "body", "path": "email", "message": "...", "code": "invalid_string" }]
  },
  "requestId": "lx0a1b2c3d4e5f6g"
}
```

Stable error codes: `VALIDATION_ERROR`, `BAD_REQUEST`, `UNAUTHORIZED`,
`FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`,
`SERVICE_UNAVAILABLE`.

---

## Quick start

```bash
cd backend-node
cp .env.example .env          # adjust secrets for prod
bun install                    # or: npm install / pnpm install
bun run db:generate            # generate Prisma client
bun run db:push                # create SQLite dev.db with the schema
bun run dev                    # start dev server with tsx watch
```

Server starts on `http://localhost:4000`. Visit
`http://localhost:4000/api/v1` for an endpoint listing, or
`http://localhost:4000/api/v1/health` for the health check.

### Deploying to Render (blueprint)

The repo root ships `render.yaml`, a Render Blueprint that deploys this
directory as a web service (`https://<service>.onrender.com`). In the
Render dashboard: **New → Blueprint → select this repo** — Render reads
`render.yaml` and prompts for the required secrets.

What the blueprint does:

- `rootDir: backend-node` — builds from this directory.
- `buildCommand: bun install && bunx prisma generate && bunx prisma db push`
  — installs deps, generates the Prisma client, applies the schema to the
  database.
- `startCommand: bunx tsx src/index.ts` — runs the server in production
  (no dev watch script, no `.env` file; env vars come from Render).
- `healthCheckPath: /api/v1/health` — deploy is green only when this
  returns 200 (503 = database unreachable).

Required environment variables (prompted by Render, `sync: false`):

| Variable              | Value                                          |
|-----------------------|------------------------------------------------|
| `DATABASE_URL`        | SQLite path or Postgres URL (see caveat below) |
| `JWT_SECRET`          | Random string, ≥ 16 chars (32+ recommended)    |
| `JWT_REFRESH_SECRET`  | Different random string, ≥ 16 chars            |

The blueprint also pins `NODE_ENV=production`, `PORT=4000`, `BUN_VERSION`,
and `CORS_ORIGINS=https://roycss.vercel.app` (comma-separated allowlist —
production CORS rejects any origin not on the list). All other vars in
`src/config/env.ts` are optional with sane defaults.

> **SQLite persistence caveat**: Render's free tier has an ephemeral
> filesystem — the schema is applied at build time and the service boots
> healthy, but user data written at runtime (accounts, contact messages,
> favorites) is wiped on every deploy/restart. For durable data, mount a
> persistent disk at `/data` and set `DATABASE_URL=file:/data/roycss.db`
> (move `bunx prisma db push` to `preDeployCommand`), or switch to Postgres
> (see "Switch to Postgres" below) — recommended for real production use.

Generate secrets locally with `openssl rand -base64 48`.

### Building and running locally

```bash
bun run build                  # tsc → dist/
bun run start                  # node dist/index.js (NODE_ENV=production)
```

### Effects data

The effects module reads `../dist/effects.json` (produced by the parent
project's `bun run build:package` script). If the file is missing or
malformed, the backend still starts — every effects endpoint returns an
empty result with a logged warning. To regenerate the file:

```bash
cd ..                          # back to project root
bun run scripts/build-package.ts
```

---

## Environment variables

See `.env.example` for the full list with defaults. Required for prod:

| Variable              | Default (dev)                    | Notes                                            |
|-----------------------|----------------------------------|--------------------------------------------------|
| `PORT`                | `4000`                           | HTTP port                                         |
| `NODE_ENV`            | `development`                    | `production` enables strict CORS                 |
| `DATABASE_URL`        | `file:./dev.db`                  | Swap to `postgresql://...` for prod              |
| `JWT_SECRET`          | (16+ char dev default)           | Use `openssl rand -base64 64` in prod            |
| `JWT_REFRESH_SECRET`  | (16+ char dev default)           | Must differ from `JWT_SECRET`                    |
| `JWT_EXPIRES_IN`      | `15m`                            | Access token lifetime                            |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                          | Refresh token lifetime                           |
| `CORS_ORIGINS`        | `http://localhost:3000,...`      | Comma-separated allowed origins                  |
| `RATE_LIMIT_MAX_AUTH`     | `10`                        | Auth attempts per minute per IP              |
| `RATE_LIMIT_MAX_CONTACT`  | `5`                         | Contact submissions per minute per IP       |
| `EFFECTS_DATA_PATH`   | `../dist/effects.json`           | Path to the parent project's effects JSON        |

---

## Security features

- **Helmet** — security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** — strict origin allowlist in prod, permissive in dev
- **Rate limiting** — sliding-window per-IP per-scope; auth + contact scopes
- **JWT** — HS256 with separate access + refresh secrets; refresh tokens
  are typed (`type: "refresh"`) so an access-token leak can't mint refreshes
- **Password hashing** — bcryptjs with 10 rounds (bump to 12 for prod)
- **Timing-safe login** — always runs bcrypt compare, even if user doesn't
  exist, to prevent user-enumeration via response timing
- **Body size limit** — 256kb JSON / urlencoded
- **No PII in logs** — password hashes, JWTs, and contact messages are
  never logged (only email + subject for contact, only user id + email
  for auth)
- **Graceful shutdown** — SIGINT/SIGTERM close the HTTP server, then the
  Prisma connection pool, with a 10s force-exit timeout

---

## Caching

- **LRU** — max 1000 entries, with TTL per entry
- **Effects list** — cached 5 min per unique query
- **Effect detail** — cached 10 min per id
- **Recipes / Patterns list + detail** — cached 5 / 10 min respectively
- `cacheWrap(key, producer, ttlMs)` — memoize-with-TTL helper

In prod, swap `LRUCache` for a Redis-backed implementation that
implements the same interface (get/set/delete/has/clear).

---

## Extending

### Add a new module

1. `src/modules/<name>/` — create `routes.ts`, `service.ts`, `schema.ts`.
2. Wire the router in `src/server/app.ts`:
   ```ts
   app.use(`${API_PREFIX}/<name>`, <name>Router);
   ```
3. Add Zod schemas for every request shape.
4. Throw `AppError` for any expected failure.

### Switch to Postgres

1. Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`: `DATABASE_URL="postgresql://user:pass@host:5432/roycss"`
3. `bun run db:push`

### Add a protected route

```ts
import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";

router.get("/favorites", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.sub;
  // ...
}));
```

---

## Scripts

| Script         | Description                                  |
|----------------|----------------------------------------------|
| `bun run dev`  | tsx watch — hot reload on file change        |
| `bun run build`| tsc → dist/                                  |
| `bun run start`| Run the compiled dist/index.js               |
| `bun run db:generate` | `prisma generate`                     |
| `bun run db:push`     | `prisma db push` (create/apply schema)|
| `bun run typecheck`   | `tsc --noEmit` (no output, just check)|

---

## License

MIT — same as the parent RoyCSS project.
