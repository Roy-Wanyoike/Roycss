# RoyCSS Public API Reference

The public HTTP surface of the platform: the Express backend (`/api/v1/*`, `backend-node/`) and the Next.js frontend routes (`/api/*`, `src/app/api/`).

**Coverage:** 68 backend modules · 258 backend routes (GET 191, POST 60, PUT 2, DELETE 5) · 14 frontend endpoints.

> **Drift gate:** `cd backend-node && bun run api:check` walks `src/server/app.ts`, every module's `routes.ts` and `src/app/api/**` and fails when a route here is missing or stale. Regenerate the tables with `bun run api:gen` (curated prose lives in `backend-node/scripts/gen-api-md.ts` — edit there, not in API.md).

## Contents

- [Conventions](#conventions) — base URLs, envelope, errors, auth, rate limits, pagination
- [Backend modules](#backend-modules) — grouped by domain
  - [Platform core & registry](#domain-core)
  - [Auth & messaging](#domain-auth)
  - [Modern-CSS devtools](#domain-devtools)
  - [AI & code intelligence](#domain-ai)
  - [Community & learning](#domain-community)
  - [Infrastructure & operations](#domain-infra)
- [Frontend routes (Next.js)](#frontend-routes-nextjs)

## Conventions

### Base URLs

| Deployment | Base URL | Notes |
|------------|----------|-------|
| Local backend (direct) | `http://localhost:4000/api/v1` | Express, port from `PORT` |
| Local via Next proxy | `http://localhost:3000/api/v1` | same-origin proxy → backend |
| Production | `https://<backend-host>/api/v1` | Render blueprint (`render.yaml`) |

### Response envelope

Every backend module (except the noted non-envelope routes) returns:

```jsonc
// collection
{ "data": [ /* items */ ], "meta": { /* page, limit, total, totalPages | count */ } }
// single resource
{ "data": { /* resource */ } }
```

Errors always use one shape (see the [error codes](#error-codes) table):

```jsonc
{
  "error": { "code": "NOT_FOUND", "message": "Resource not found", "details": [ /* optional */ ] },
  "requestId": "req_abc123"
}
```

### Error codes

| HTTP | `error.code` | Thrown when |
|------|--------------|-------------|
| 400 | `VALIDATION_ERROR` | Zod validation failed (body/query/params). `details[]` carries `{ target, path, message, code }` per field |
| 400 | `BAD_REQUEST` | Malformed input outside schema validation |
| 401 | `UNAUTHORIZED` | Missing, malformed or invalid `Authorization: Bearer` token |
| 403 | `FORBIDDEN` | Authenticated but not permitted |
| 404 | `NOT_FOUND` | Unknown route **or** missing resource id |
| 409 | `CONFLICT` | Duplicate record (e.g. email already registered — Prisma `P2002`) |
| 429 | `RATE_LIMITED` | Sliding-window rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected failure (message + stack redacted in production) |
| 503 | `SERVICE_UNAVAILABLE` | `/health` with the DB down; contact DB write failure |

### Auth

- **Today** only `GET /api/v1/auth/me` requires `Authorization: Bearer <accessToken>`. Register/login/refresh are public (rate-limited) token-bootstrap endpoints.
- **Planned (issue #64):** mutating endpoints (POST/PUT/PATCH/DELETE) on Prisma-backed modules gain `requireAuth`. They are annotated ``Public → Bearer JWT *(#64)*`` per row below; the errors column documents today's behavior.
- **Tokens:** `POST /auth/register|login|refresh` return `{ user, accessToken (15 min), refreshToken (7 days), expiresIn }` (JWT, HS256, issuer `roycss-backend`, audience `roycss-client`).
- **Browser flow:** the frontend wraps these in httpOnly cookies (`roycss-access` / `roycss-refresh`) via `/api/auth/*` — see [Frontend routes](#frontend-routes-nextjs).

### Rate limits (per IP, sliding window)

| Scope | Limit | Applies to | Env override |
|-------|-------|------------|--------------|
| general | 100 / min | every `/api/v1` route **except** `/health` | `RATE_LIMIT_MAX_GENERAL` |
| auth | 10 / min | `/auth/register`, `/auth/login`, `/auth/refresh` | `RATE_LIMIT_MAX_AUTH` |
| contact | 5 / min | `/api/v1/contact` | `RATE_LIMIT_MAX_CONTACT` |

Window via `RATE_LIMIT_WINDOW_MS` (60 s). Responses carry `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` and `Retry-After` (on 429).

### Pagination

List endpoints accept `page` (default 1) and `limit` (default 24, max 200) and return `meta: { page, limit, total, totalPages }`. Single-resource responses omit `meta`.

### Request size / CORS

- JSON bodies are capped at **256 kB**.
- CORS: allowed origins from `CORS_ORIGINS` + localhost in dev; methods GET/POST/PUT/PATCH/DELETE/OPTIONS; credentials enabled; `X-Request-Id` exposed on every response.

## Backend modules

**API root** — index endpoint; returns a **static** route catalog compiled into `src/server/app.ts` (informational only — known to lag the real router, see the appendix).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1` | Public | — | `{ name, version, endpoints }` · 200 — static route catalog (see note below) | — |

### Platform core & registry

Catalog + registry reads that power the docs site, the package, and the integrations.

#### `health` — Liveness probe — DB connectivity, uptime, memory (mounted before the rate limiter).

> Read-only DB connectivity probe (`pingDatabase`) — mounted **before** the global rate limiter so it never throttles.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/health` | Public | — | `{ status, service, version, uptime, time, checks }` · 200 · **503 degraded** when the DB is down | 503 |

#### `effects` — Effect catalog — list/search/filter the packaged effects (from `dist/effects.json`).

> Stateless — no persistence; safe to call unauthenticated.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/effects` | Public | query: { `page?`, `limit?`, `category?`, `tag?`, `previewType?`, `sort?` } | `{ data, meta }` · 200 | 400 |
| GET | `/api/v1/effects/search` | Public | query: { `q`, `page?`, `limit?`, `category?` } | `{ data, meta }` · 200 | 400 |
| GET | `/api/v1/effects/categories` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/effects/tags` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/effects/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `recipes` — Curated recipe collection (list + detail).

> Stateless — no persistence; safe to call unauthenticated.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/recipes` | Public | query: { `page?`, `limit?`, `category?`, `difficulty?`, `tag?` } | `{ data, meta }` · 200 | 400 |
| GET | `/api/v1/recipes/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `patterns` — Pattern library (list + detail).

> Stateless — no persistence; safe to call unauthenticated.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/patterns` | Public | query: { `page?`, `limit?`, `category?`, `tag?` } | `{ data, meta }` · 200 | 400 |
| GET | `/api/v1/patterns/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `pro-components` — Pro component catalog + per-component source code.

> Stateless — no persistence; safe to call unauthenticated.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/pro-components` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/pro-components/categories` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/pro-components/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/pro-components/:id/code` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `motion` — Motion library — motion effects, presets, categories.

> Stateless — no persistence; safe to call unauthenticated.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/motion/effects` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/motion/presets` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/motion/categories` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/motion/effects/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `icons` — Icon catalog with categories and per-icon lookup.

> Stateless — no persistence; safe to call unauthenticated.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/icons` | Public | query: { `page?`, `limit?`, `category?`, `search?` } | `{ data, meta }` · 200 | 400 |
| GET | `/api/v1/icons/categories` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/icons/:name` | Public | path: `:name` | `{ data }` · 200 | 400 · 404 |

#### `blocks` — Layout block library (Prisma-backed catalog + create).

> Prisma-backed (Block). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/blocks/categories` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/blocks` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/blocks` | Public → Bearer JWT *(#64)* | body: { `name`, `category`, `industry?`, `description`, `components?`, `tags?`, `author?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/blocks/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `blueprints` — Industry architecture blueprints (list, detail, architecture, industries).

> Prisma-backed (Blueprint) — read-only surface (no mutating routes).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/blueprints/industries` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/blueprints` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/blueprints/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/blueprints/:id/architecture` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `themes` — Theme token store — Prisma CRUD, 10 seeded presets.

> Prisma-backed (Theme). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/themes` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/themes` | Public → Bearer JWT *(#64)* | body: { `name`, `primary`, `secondary`, `accent`, `background`, `foreground`, `tokens?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/themes/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| PUT | `/api/v1/themes/:id` | Public → Bearer JWT *(#64)* | body: { `name?`, `primary?`, `secondary?`, `accent?`, `background?`, `foreground?`, `tokens?` } — partial update | `{ data }` · 200 | 400 · 404 |
| DELETE | `/api/v1/themes/:id` | Public → Bearer JWT *(#64)* | path: `:id` | 204 — no body | 400 · 404 |

#### `registry` — Package registry — packages, versions, publish.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/registry/packages` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/registry/packages` | Public | body: { `name`, `description`, `author`, `version`, `license?`, `tags?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/registry/packages/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/registry/packages/:id/versions` | Public | path: `:id` | `{ data, meta }` · 200 | 400 · 404 |

#### `version` — Release metadata — current, latest, changelog, breaking changes, upgrade check.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/version/current` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/version/latest` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/version/changelog` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/version/breaking-changes` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/version/check-upgrade` | Public | body: { `current?` } | `{ data }` · 200 | 400 |

#### `search` — Cross-resource search over effects/recipes/patterns (Prisma `SearchIndex`).

> Prisma-backed (SearchIndex). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/search/recent` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/search/suggestions` | Public | query: { `q` } | `{ data, meta }` · 200 | 400 |
| GET | `/api/v1/search` | Public | query: { `q` (required), `limit?`, `types?` } — manually validated | `{ data, meta }` · 200 | 400 |
| POST | `/api/v1/search` | Public → Bearer JWT *(#64)* | body: { `query`, `types?`, `limit?` } | `{ data, meta }` · 200 | 400 |

#### `fallback` — `@supports` fallback recipes for modern CSS features.

> Stateless — no persistence; safe to call unauthenticated.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/fallback/properties` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/fallback/presets` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/fallback/properties/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

### Auth & messaging

Account lifecycle (JWT) and the contact intake form.

#### `auth` — JWT account lifecycle — register / login / refresh / me (bcrypt + Prisma `User`).

> Prisma-backed (`User`). register/login/refresh stay public by design (token bootstrap, 10/min/IP); only `GET /me` requires a Bearer token.
> Extra rate limit: **auth 10/min/IP** on register/login/refresh.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/v1/auth/register` | Public | body: { `email`, `password`, `name?` } | `{ data: { user, accessToken, refreshToken, expiresIn } }` · 201 | 400 · 409 · 429 |
| POST | `/api/v1/auth/login` | Public | body: { `email`, `password` } | `{ data: { user, accessToken, refreshToken, expiresIn } }` · 200 | 400 · 401 · 429 |
| POST | `/api/v1/auth/refresh` | Public | body: { `refreshToken` } | `{ data: { user, accessToken, refreshToken, expiresIn } }` · 200 | 400 · 401 · 429 |
| GET | `/api/v1/auth/me` | Bearer JWT | — | `{ data: user }` · 200 | 401 |

#### `contact` — Contact form intake (Prisma `ContactMessage`; 5 submissions/min/IP).

> Prisma-backed (`ContactMessage`). The POST stays public by design — anonymous form intake (rate-limited 5/min/IP).
> Extra rate limit: **contact 5/min/IP**.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/v1/contact` | Public | body: { `name`, `email`, `subject?`, `message` } | `{ ok, message, id }` · 201 — non-envelope | 400 · 429 · 503 |

### Modern-CSS devtools

Stateless generators/analyzers for modern CSS features — POST bodies in, CSS or diagnostics out.

#### `devtools` — CSS introspection — class inspection, design tokens, utilities, CSS analysis.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/devtools/inspect` | Public | query: { `url` } | `{ data }` · 200 | 400 |
| GET | `/api/v1/devtools/tokens` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/devtools/utilities` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/devtools/analyze` | Public | body: { `url`, `maxIssues?` } | `{ data }` · 200 | 400 |

#### `inspector` — CSS lint — 8 correctness/a11y rules with line-precise findings (read-only).

> Stateless — no persistence; safe to call unauthenticated.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/inspector/checks` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/inspector/analyze` | Public | query: { `css` } | `{ data, meta }` · 200 | 400 |
| GET | `/api/v1/inspector/health` | Public | — | `{ data }` · 200 | — |

#### `color-space` — Color conversion + gamut mapping (OKLCH, sRGB, Display P3).

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/v1/color-space/convert` | Public | body: { `from`, `to`, `value` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/color-space/gamut/:hex` | Public | path: `:hex` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/color-space/presets` | Public | — | `{ data, meta }` · 200 | — |

#### `style-query` — Container/style-query (`@container`) generator.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/style-query/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/style-query/generate` | Public | body: { `containerName`, `property`, `value`, `selector`, `declarations`, `fallbackDeclarations?` } | `{ data }` · 201 | 400 |

#### `scope` — `@scope` rule analysis + generation.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/scope/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/scope/analyze` | Public | body: { `root`, `limit`, `declarations`, `dom` } | `{ data }` · 201 | 400 |

#### `subgrid` — CSS subgrid layout generator.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/subgrid/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/subgrid/generate` | Public | body: { `parent`, `children` } | `{ data }` · 201 | 400 |

#### `logical-properties` — Physical ↔ logical property mapping and conversion.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/logical-properties/mapping` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/logical-properties/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/logical-properties/convert` | Public | body: { `css`, `writingMode?` } | `{ data }` · 201 | 400 |

#### `initial-letter` — `initial-letter` drop-cap generator.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/initial-letter/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/initial-letter/generate` | Public | body: { `selector`, `size`, `sink`, `dropCap`, `fontFamily`, `fontWeight`, `color`, `multiplier`, `align?` } | `{ data }` · 201 | 400 |

#### `text-wrap` — `text-wrap: balance/pretty` analysis.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/text-wrap/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/text-wrap/analyze` | Public | body: { `text`, `containerWidth`, `fontSize?`, `lineHeight?`, `properties` } | `{ data }` · 201 | 400 |

#### `property-registrar` — `@property` at-rule registration generator.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/property-registrar/syntaxes` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/property-registrar/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/property-registrar/generate` | Public | body: { `name`, `syntax`, `inherits`, `initialValue?`, `demoSelector`, `demoProperty`, `demoValue?` } | `{ data }` · 201 | 400 |

#### `relative-color` — Relative color syntax derivation (`oklch from …`).

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/relative-color/channels` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/relative-color/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/relative-color/derive` | Public | body: { `source`, `outputSpace`, `channels?` } | `{ data }` · 201 | 400 |

#### `starting-style` — `@starting-style` transition-entry generator.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/starting-style/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/starting-style/generate` | Public | body: { `selector`, `duration`, `easing`, `cubicBezier`, `properties`, `translateY`, `scaleFrom`, `allowDiscrete`, `hiddenClass?` } | `{ data }` · 201 | 400 |

#### `light-dark` — `light-dark()` color-pair generator.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/light-dark/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/light-dark/generate` | Public | body: { `selector`, `colorScheme`, `tokens`, `primarySelector`, `mutedSelector?` } | `{ data }` · 201 | 400 |

### AI & code intelligence

AI-assisted generation, review, auditing, profiling and simulation surfaces (LLM-backed or deterministic).

#### `architect` — AI architecture generator — templates and generated results.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/architect/templates` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/architect/generate` | Public | body: { `prompt`, `templateId?`, `stack?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/architect/templates/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/architect/results/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `review` — AI code review — rules, results, history.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/v1/review/code` | Public | body: { `filename`, `language`, `code`, `focus?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/review/rules` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/review/history` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/review/results/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `refactor` — CSS refactoring — transforms, framework list, results.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/refactor/frameworks` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/refactor/patterns` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/refactor/transform` | Public | body: { `sourceFramework`, `targetFramework`, `files` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/refactor/results/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `designer` — AI design generator — presets and results.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/designer/presets` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/designer/generate` | Public | body: { `prompt`, `presetId?`, `palette?`, `components?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/designer/results/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `scaffold` — Project scaffolding — scaffold types and frameworks.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/v1/scaffold/generate` | Public | body: { `name`, `projectType`, `framework`, `features?`, `language?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/scaffold/types` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/scaffold/frameworks` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/scaffold/types/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `generator` — Code/config generator — generator types and templates.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/generator/types` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/generator/generate` | Public | body: { `typeId`, `name`, `language?`, `variables?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/generator/templates/:type` | Public | path: `:type` | `{ data, meta }` · 200 | 400 · 404 |

#### `pair` — AI pair-programming chat — history and suggestions.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/v1/pair/chat` | Public | body: { `message`, `sessionId?`, `language?`, `code?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/pair/history` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/pair/suggestions` | Public | — | `{ data, meta }` · 200 | — |

#### `mentor` — AI mentor — chat, topics, progress, levels.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/v1/mentor/chat` | Public | body: { `message`, `topicId` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/mentor/topics` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/mentor/progress` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/mentor/levels` | Public | — | `{ data, meta }` · 200 | — |

#### `digital-twin` — Site simulation — create runs, results, simulations.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/digital-twin/simulations` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/digital-twin/create` | Public | body: { `url`, `devices?`, `journey?` } | `{ data }` · 202 | 400 |
| GET | `/api/v1/digital-twin/results/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `preview` — Preview branches — create, list, detail, delete (Prisma).

> Prisma-backed (PreviewBranch). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/v1/preview/create` | Public → Bearer JWT *(#64)* | body: { `branch`, `project`, `commit` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/preview/list` | Public | — | `{ data, meta }` · 200 | — |
| DELETE | `/api/v1/preview/:id` | Public → Bearer JWT *(#64)* | path: `:id` | 204 — no body | 400 · 404 |
| GET | `/api/v1/preview/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `studio` — Project studio — projects CRUD + templates (Prisma).

> Prisma-backed (StudioProject). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/studio/projects` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/studio/projects` | Public → Bearer JWT *(#64)* | body: { `name`, `description?`, `components?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/studio/templates` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/studio/projects/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| PUT | `/api/v1/studio/projects/:id` | Public → Bearer JWT *(#64)* | body: partial `UpdateStudioProjectSchema` — all fields optional | `{ data }` · 200 | 400 · 404 |
| DELETE | `/api/v1/studio/projects/:id` | Public → Bearer JWT *(#64)* | path: `:id` | 204 — no body | 400 · 404 |

#### `sync` — Design-token sync — Figma/GitHub/token imports + history.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/sync/status` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/sync/figma` | Public | body: { `fileKey`, `scope?` } | `{ data }` · 201 | 400 |
| POST | `/api/v1/sync/github` | Public | body: { `repo`, `branch?`, `message?` } | `{ data }` · 201 | 400 |
| POST | `/api/v1/sync/tokens` | Public | body: { `target`, `namespace?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/sync/history` | Public | — | `{ data, meta }` · 200 | — |

#### `profiler` — Performance profiler — start runs, results, metrics.

> Prisma-backed (ProfilerResult). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/profiler/metrics` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/profiler/results` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/profiler/start` | Public → Bearer JWT *(#64)* | body: { `url`, `sampleRate?`, `durationSec?` } | `{ data }` · 202 | 400 |
| GET | `/api/v1/profiler/results/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `benchmark` — Runtime benchmarks — run, results, comparisons.

> Prisma-backed (BenchmarkResult). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/benchmark/comparisons` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/benchmark/run` | Public → Bearer JWT *(#64)* | body: { `url`, `suite`, `runs?`, `profile?` } | `{ data }` · 202 | 400 |
| GET | `/api/v1/benchmark/results/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `bundle` — CSS bundle analysis — duplicates, dead CSS, results.

> Prisma-backed (BundleResult). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/bundle/duplicates` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/bundle/dead-css` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/bundle/analyze` | Public → Bearer JWT *(#64)* | body: { `entry`, `repo?`, `commit?` } | `{ data }` · 202 | 400 |
| GET | `/api/v1/bundle/results/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `audit-center` — Aggregated audits — projects, issues, trends.

> Prisma-backed (AuditProject, AuditResult) — read-only surface (no mutating routes).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/audit-center/projects` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/audit-center/issues` | Public | query: { `projectId`, `status` } | `{ data, meta }` · 200 | 400 |
| GET | `/api/v1/audit-center/trends` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/audit-center/projects/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `compliance` — Standards compliance scans — standards, results, reports.

> Prisma-backed (ComplianceStandard, ComplianceScan). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/v1/compliance/scan` | Public → Bearer JWT *(#64)* | body: { `url`, `standardId?`, `depth?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/compliance/standards` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/compliance/reports` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/compliance/results/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `accessibility` — Accessibility checks — page audit, rules, contrast, scan.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/accessibility/rules` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/accessibility/contrast/:fg/:bg` | Public | path: `:fg` `:bg` | `{ data }` · 200 | 400 · 404 |
| POST | `/api/v1/accessibility/scan` | Public | body: { `url`, `level?`, `maxViolations?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/accessibility/audit/:url` | Public | path: `:url` | `{ data }` · 200 | 400 · 404 |

### Community & learning

Academy, challenges, certifications, open-source program, showcase, marketplace and plugins.

#### `academy` — Learning paths + lesson progress (Prisma).

> Prisma-backed (LearningPath, PathProgress). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/academy/paths` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/academy/paths/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/academy/paths/:id/lessons` | Public | path: `:id` | `{ data, meta }` · 200 | 400 · 404 |
| POST | `/api/v1/academy/paths/:id/progress` | Public → Bearer JWT *(#64)* | body: { `lessonId`, `completed` } · path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `challenges` — Coding challenges, submissions, leaderboard.

> Prisma-backed (Challenge, ChallengeSubmission). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/challenges` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/challenges/leaderboard` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/challenges/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| POST | `/api/v1/challenges/:id/submit` | Public → Bearer JWT *(#64)* | body: { `userId`, `code`, `passed`, `timeMs?` } · path: `:id` | `{ data }` · 201 | 400 · 404 |

#### `certifications` — Certification exams + credential verification.

> Prisma-backed (Certification, CertificationAttempt). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/certifications` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/certifications/verify/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/certifications/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| POST | `/api/v1/certifications/:id/exam` | Public → Bearer JWT *(#64)* | body: { `userId`, `userName`, `answers` } · path: `:id` | `{ data }` · 201 | 400 · 404 |

#### `open` — Open-source program — issues, RFCs (+ voting), roadmap, contributors.

> Prisma-backed (GoodFirstIssue, RFC, Roadmap, Contributor). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/open/issues` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/open/rfcs` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/open/roadmap` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/open/contributors` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/open/issues/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/open/rfcs/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| POST | `/api/v1/open/rfcs/:id/vote` | Public → Bearer JWT *(#64)* | body: { `vote`, `voter?` } · path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `spotlight` — Community showcase — featured, items, submit, weekly.

> Prisma-backed (SpotlightItem). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/spotlight/featured` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/spotlight/items` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/spotlight/weekly` | Public | — | `{ data }` · 200 | — |
| POST | `/api/v1/spotlight/submit` | Public → Bearer JWT *(#64)* | body: { `title`, `type`, `author`, `url`, `description`, `thumbnail?`, `tags?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/spotlight/items/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `marketplace` — Template marketplace — list, detail, publish, reviews.

> Prisma-backed (Template, TemplateReview). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/marketplace/templates` | Public | query: { `page?`, `limit?`, `category?`, `search?`, `minRating?`, `free?` } | `{ data, meta }` · 200 | 400 |
| POST | `/api/v1/marketplace/templates` | Public → Bearer JWT *(#64)* | body: { `name`, `category`, `price`, `author`, `description`, `features?`, `thumbnail` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/marketplace/templates/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/marketplace/templates/:id/reviews` | Public | path: `:id` | `{ data, meta }` · 200 | 400 · 404 |

#### `plugins` — Plugin registry — plugins, categories, changelog (mounted at `/plugins`).

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/plugins/categories` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/plugins` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/plugins` | Public | body: { `name`, `slug`, `category`, `description`, `author?`, `version?`, `license?`, `tags?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/plugins/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/plugins/:id/changelog` | Public | path: `:id` | `{ data, meta }` · 200 | 400 · 404 |

### Infrastructure & operations

Cloud, deploys, CDN/edge/storage, fleet, workspace, enterprise, governance, analytics, observatory, RoyOS, live sessions and the MCP hub.

#### `cloud` — Roy Cloud projects + deployments (Prisma).

> Prisma-backed (CloudProject, Deployment). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/cloud/status` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/cloud/projects` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/cloud/projects` | Public → Bearer JWT *(#64)* | body: { `name`, `environment?`, `source` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/cloud/projects/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| DELETE | `/api/v1/cloud/projects/:id` | Public → Bearer JWT *(#64)* | path: `:id` | 204 — no body | 400 · 404 |
| GET | `/api/v1/cloud/storage` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/cloud/deployments` | Public | — | `{ data, meta }` · 200 | — |

#### `deploy` — Deployment orchestration — create, history, platforms, environments.

> Prisma-backed (Deployment). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| POST | `/api/v1/deploy/create` | Public → Bearer JWT *(#64)* | body: { `projectId`, `environment`, `platformId`, `branch`, `commit` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/deploy/history` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/deploy/platforms` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/deploy/environments` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/deploy/history/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `cdn` — CDN stats, resources, edges, cache purge.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/cdn/stats` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/cdn/resources` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/cdn/edges` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/cdn/purge` | Public | body: { `paths?`, `all?` } — refine: `paths` non-empty **or** `all: true` required | `{ data }` · 200 | 400 |

#### `storage` — File storage — list, upload, delete, usage.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/storage/files` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/storage/upload` | Public | body: { `name`, `type`, `size`, `mimeType` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/storage/usage` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/storage/files/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| DELETE | `/api/v1/storage/files/:id` | Public | path: `:id` | 204 — no body | 400 · 404 |

#### `edge` — Edge compute — regions, config, deploy, performance.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/edge/regions` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/edge/config` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/edge/performance` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/edge/deploy` | Public | body: { `defaultTtl?`, `cacheStrategy?`, `purgeOnDeploy?`, `customHeaders?` } | `{ data }` · 200 | 400 |

#### `fleet` — Project fleet health + scanning.

> Prisma-backed (FleetProject). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/fleet/projects` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/fleet/health` | Public | — | `{ data }` · 200 | — |
| POST | `/api/v1/fleet/scan` | Public → Bearer JWT *(#64)* | body: { `projectId` } | `{ data }` · 200 | 400 |
| GET | `/api/v1/fleet/projects/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `workspace` — Team workspace — resources, team, invites.

> Prisma-backed (WorkspaceResource). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/workspace/resources` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/workspace/team` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/workspace/invite` | Public → Bearer JWT *(#64)* | body: { `email`, `name`, `role?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/workspace/resources/:type` | Public | path: `:type` | `{ data }` · 200 | 400 · 404 |

#### `enterprise` — Organizations, teams, licenses, audit log.

> Prisma-backed (Organization, Team, License, EnterpriseAuditLog). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/enterprise/organizations` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/enterprise/organizations` | Public → Bearer JWT *(#64)* | body: { `name`, `plan?`, `seats?`, `ownerId` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/enterprise/organizations/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/enterprise/teams` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/enterprise/licenses` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/enterprise/audit-log` | Public | — | `{ data, meta }` · 200 | — |

#### `governance` — Approval workflow — approve/reject, policies, audit log.

> Prisma-backed (GovernancePolicy, GovernanceApproval). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/governance/approvals` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/governance/policies` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/governance/audit-log` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/governance/approvals/:id/approve` | Public → Bearer JWT *(#64)* | body: { `reviewer?`, `note?` } · path: `:id` | `{ data }` · 200 | 400 · 404 |
| POST | `/api/v1/governance/approvals/:id/reject` | Public → Bearer JWT *(#64)* | body: { `reviewer?`, `reason` } · path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `analytics` — Platform analytics — overview, effects, traffic, devices.

> Prisma-backed (User (read-only)) — read-only surface (no mutating routes).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/analytics/overview` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/analytics/effects` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/analytics/traffic` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/analytics/devices` | Public | — | `{ data }` · 200 | — |

#### `observatory` — Site observability — sites, alerts, trends.

> Prisma-backed (ObservatorySite) — read-only surface (no mutating routes).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/observatory/sites` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/observatory/alerts` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/observatory/sites/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/observatory/trends/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |

#### `os` — RoyOS dashboard — products, activity, quick actions.

> Prisma-backed (OSDashboard) — read-only surface (no mutating routes).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/os/dashboard` | Public | — | `{ data }` · 200 | — |
| GET | `/api/v1/os/products` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/os/activity` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/os/quick-actions` | Public | — | `{ data, meta }` · 200 | — |

#### `live` — Live collaboration sessions + messages (Prisma).

> Prisma-backed (LiveSession, LiveMessage). Mutating routes are annotated "Public → Bearer JWT *(#64)*" — they become authenticated when issue #64 (requireAuth rollout) lands.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/live/sessions` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/live/sessions` | Public → Bearer JWT *(#64)* | body: { `title`, `hostId`, `hostName?` } | `{ data }` · 201 | 400 |
| GET | `/api/v1/live/sessions/:id` | Public | path: `:id` | `{ data }` · 200 | 400 · 404 |
| GET | `/api/v1/live/sessions/:id/users` | Public | path: `:id` | `{ data, meta }` · 200 | 400 · 404 |
| POST | `/api/v1/live/sessions/:id/message` | Public → Bearer JWT *(#64)* | body: { `userId`, `content` } · path: `:id` | `{ data }` · 201 | 400 · 404 |

#### `mcp` — MCP tool hub — tools, execute, resources, prompts.

> No durable persistence — POST output is computed in-process; where an id is returned it is retrievable only for the process lifetime (reset on restart). No auth planned (no durable data).

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/v1/mcp/tools` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/mcp/resources` | Public | — | `{ data, meta }` · 200 | — |
| GET | `/api/v1/mcp/prompts` | Public | — | `{ data, meta }` · 200 | — |
| POST | `/api/v1/mcp/execute` | Public | body: { `name`, `arguments?` } | `{ data }` · 200 | 400 |
| GET | `/api/v1/mcp/tools/:name` | Public | path: `:name` | `{ data }` · 200 | 400 · 404 |

## Frontend routes (Next.js)

### Frontend API routes (`src/app/api`)

Served by the Next.js app itself (not proxied unless noted). The browser
talks to these same-origin paths only — the CSP pins `connect-src 'self'`.

| Method | Path | Auth | Request | Response | Errors |
|--------|------|------|---------|----------|--------|
| GET | `/api/health` | Public | — | `{ status, effectsCount, dbStatus, backendStatus, timestamp, version }` · 200 | — (always 200; `status: "degraded"` when the backend probe fails) |
| ANY | `/api/v1/*` | passthrough | forwarded body/headers | backend response passthrough · 503 `{ error: { code: "BACKEND_UNAVAILABLE" } }` | backend codes · 503 |
| GET | `/api/contact` | Public | — | `{ ok, message }` · 200 (usage hint) | — |
| POST | `/api/contact` | Public | body: { `name`, `email`, `subject?`, `message` } (message ≥ 10 chars; truncated to 120/160/160/5000) | `{ ok, message }` · 200 | 400 · 503 (DB write) · 500 |
| POST | `/api/auth/register` | Public | body: { `email`, `password`, `name?` } | `{ data: user }` · 200 + sets httpOnly cookies | 400 · 409 · 429 · 500 |
| POST | `/api/auth/login` | Public | body: { `email`, `password` } | `{ data: user }` · 200 + sets httpOnly cookies | 400 · 401 · 429 · 500 |
| POST | `/api/auth/logout` | Public | — | `{ data: { ok: true } }` · 200 (clears cookies) | — |
| POST | `/api/auth/refresh` | cookie | reads refresh cookie | `{ data: { ok: true } }` · 200 + rotated cookies | 401 · 500 |
| GET | `/api/auth/me` | cookie | reads access cookie (one refresh+retry on 401) | `{ data: user }` · 200 | 401 |
| POST | `/api/ai-playground` | Public | body: { `prompt` } (≤ 500 chars) | `{ css, prompt }` · 200 | 400 · 500 |
| POST | `/api/ai-migration` | Public | body: { `css` (≤ 10 000 chars), `framework?` } | `{ css, framework }` · 200 | 400 · 500 |
| POST | `/api/css-doctor` | Public | body: { `css` (≤ 10 000 chars) } | `{ score, issues[], summary }` · 200 | 400 · 500 |
| GET | `/api/effects/manifest` | Public | — | `{ count, effects[] }` · 200 (metadata only, no `cssCode`; 24 h cache) | — |
| GET | `/api/effects/:id/css` | Public | path: `:id` | `text/css` (the effect's `cssCode`) · 200 · 404 | 404 |
| GET | `/api/og` | Public | — | `image/png` (static `public/og.png`) · 200 | 404 |

Notes:

- **`/api/v1/*` proxy** (`src/app/api/v1/[...path]/route.ts`): forwards
  `GET/POST/PUT/PATCH/DELETE/OPTIONS` to `BACKEND_URL` (default
  `http://localhost:4000`), passing through the `Authorization` header,
  cookies, request body, response status, `Content-Type` and
  `Cache-Control`. When the backend is unreachable it returns
  503 `{ error: { code: "BACKEND_UNAVAILABLE", message } }`.
- **Auth cookies**: `roycss-access` (15 min) and `roycss-refresh`
  (30 days) — httpOnly, `sameSite=lax`, `secure` in production. The
  register/login/refresh/logout/me routes are a cookie shim over the
  backend's JWT endpoints (`src/lib/auth-client.ts`).
- **`/api/contact`** writes to the *frontend* Prisma
  (`ContactMessage` model, root `prisma/schema.prisma`) — distinct from
  the backend's `POST /api/v1/contact`. No rate limiter on the frontend
  copy; the backend copy is limited to 5/min/IP.
- **AI routes** (`ai-playground`, `ai-migration`, `css-doctor`) call
  the ZAI LLM SDK (`z-ai-web-dev-sdk`), `maxDuration` 30 s, and return
  `{ error: string }` on failure.

## Appendix — caveats

- `GET /api/v1` returns a **static** route catalog compiled into ``src/server/app.ts`. It is informational and can lag behind the real router (e.g. it lists planned-but-unbuilt `inspector/classes` and `inspector/scan` routes). Trust this document and `bun run api:check`, not that payload.
- Seed data: Prisma-backed modules seed demo records on first access (e.g. 10 themes, 4 cloud projects) — safe to browse anonymously, reset via `prisma db push`.
- `GET /api/v1/inspector/*` is read-only linting; the `inspector/classes`/`scan` endpoints listed by the root catalog were a planned surface that never shipped (see #57).
