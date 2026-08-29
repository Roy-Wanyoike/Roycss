# RoyCSS — Current Architecture

> **Audit ID**: AUDIT-1
> **Date**: 2026-08-29
> **Source of truth**: `next.config.ts`, `package.json`, `backend/package.json`, `tsconfig.json`, `backend/tsconfig.json`, `Caddyfile`, `backend/src/server/app.ts`, `backend/prisma/schema.prisma`, `.github/workflows/`

---

## 1. High-level diagram

```
                         ┌───────────────────────────────────────────────┐
                         │             Caddy gateway (single ext port)    │
                         │  XTransformPort=<n> query param → :3000/:4000 │
                         └─────────────────────┬─────────────────────────┘
                                               │
              ┌────────────────────────────────┼────────────────────────────┐
              │                                │                            │
              ▼                                ▼                            ▼
   ┌───────────────────┐         ┌───────────────────────────┐     ┌────────────────────────┐
   │  Next.js 16       │         │  Express.js backend        │     │  Socket.io live-service │
   │  (port 3000)      │         │  (port 4000)              │     │  (port 3003)            │
   │  ───────────────  │         │  ──────────────────────  │     │  ────────────────────   │
   │  App Router       │         │  68 route-mounted modules │     │  in-memory room state   │
   │  Turbopack        │         │  45 Prisma models         │     │  join/leave/message     │
   │  TypeScript 5     │         │  JWT auth (bcrypt + JWT)  │     │  auto-reconnect client  │
   │  Tailwind CSS 4   │         │  Zod validation           │     └────────────────────────┘
   │  shadcn/ui (NY)   │         │  Helmet + CORS            │
   │  Zustand + Query  │         │  Pino logger              │
   │  next-themes      │         │  LRU cache                │
   │  Framer Motion    │         │  express-rate-limit       │
   │  PWA (SW + manifest) │      │  Prisma ORM               │
   └─────────┬─────────┘         └────────────┬──────────────┘
             │                                │
             │ fetch("/api/...?XTransformPort=4000")
             │                                │
             │                                ▼
             │                   ┌──────────────────────────┐
             │                   │  Prisma Client           │
             │                   │  (SQLite @dev.db)        │
             │                   │  → Postgres (Supabase)   │
             │                   │  → 45 models             │
             │                   └──────────────────────────┘
             │
             │ io("/?XTransformPort=3003")
             ▼
   (browser) — WebSocket via Caddy → :3003
```

---

## 2. Frontend — Next.js 16 + App Router + Turbopack

| Aspect | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server Components + Turbopack dev server + Standalone build output (`output: "standalone"` in `next.config.ts`) |
| **Language** | TypeScript 5 (`tsconfig.json` strict mode) | Type safety across all client + server components |
| **Bundler** | Turbopack (Next.js 16 default) | 700× faster incremental rebuilds than Webpack |
| **Styling** | Tailwind CSS 4 (`tailwind.config.ts`) + `postcss.config.mjs` | Atomic CSS, JIT, dark mode via `class` strategy |
| **UI library** | shadcn/ui (New York style) | 44 components in `src/components/ui/*.tsx` — all the Radix-based primitives |
| **Icons** | Lucide React | Tree-shakeable, consistent stroke width |
| **State (client)** | Zustand (`src/hooks/use-favorites.ts`, `src/components/roycss/auth/auth-sheet-store.ts`) | Tiny footprint, no boilerplate, persisted to `localStorage` |
| **State (server)** | TanStack Query (available) | For backend data fetching (only `/api/health` + RoyLive use it so far) |
| **Theme** | `next-themes` (light / dark / system) | Pre-hydration script in `layout.tsx` prevents FOUC |
| **Animations** | Framer Motion + 60 motion presets (`src/lib/roycss-effects.ts` motion category) | Subtle hover/focus/page transitions; `AnimationPauser` honors `prefers-reduced-motion` |
| **PWA** | manifest.json, sw.js, icons (192/512/maskable/apple-touch) | Installable, auto-update via `SwUpdateBanner` |
| **OG image** | `/api/og` (PNG, 1200×630) | Server-generated |
| **JSON-LD** | `SoftwareApplication` schema in `layout.tsx` | SEO rich results |
| **Build output** | `output: "standalone"` | Self-contained server bundle + static assets |
| **Security headers** | COOP, CORP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP frame-ancestors | In `next.config.ts` |

### Frontend file structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, theme script, JSON-LD, fonts, Toaster
│   ├── page.tsx            # Renders <RoyCSSPage />
│   ├── loading.tsx         # Next.js loading state
│   ├── error.tsx           # Next.js error boundary
│   ├── not-found.tsx       # 404
│   ├── sitemap.ts          # Auto-generated sitemap
│   ├── robots.ts           # Auto-generated robots.txt
│   ├── globals.css         # Tailwind globals
│   ├── roycss.css          # Generated effect CSS
│   ├── roymotion.css       # Motion presets CSS
│   ├── api/                # 12 Next.js API routes (proxy to backend)
│   │   ├── og/route.ts
│   │   ├── health/route.ts
│   │   ├── contact/route.ts
│   │   ├── effects/manifest/route.ts
│   │   ├── effects/[id]/css/route.ts
│   │   ├── ai-migration/route.ts
│   │   ├── ai-playground/route.ts
│   │   ├── css-doctor/route.ts
│   │   └── auth/{register,login,logout,refresh,me}/route.ts
│   └── docs/               # 28 docs pages (getting-started, concepts, guides, api)
├── components/
│   ├── ui/                 # 44 shadcn/ui primitives
│   ├── roycss/             # ~250 RoyCSS components
│   │   ├── roycss-page.tsx     # 3,020-line single-page app
│   │   ├── effect-card.tsx
│   │   ├── effect-detail-dialog.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-card.tsx
│   │   ├── auth/              # 6 auth components (login, register, user-menu, auth-context, use-require-auth, auth-sheet-store)
│   │   ├── effects/           # 9 WebGL showcase effects
│   │   ├── tools/             # 68 dev-tool studios
│   │   ├── pro/               # 62 platform product cards
│   │   └── ...                # +50 more (sheets, generators, studios, sections)
│   ├── docs/               # 8 docs components (sidebar, search, TOC, content, CodeBlock, PackageTabs)
│   └── ui-library/        # 8 showcase components (foundation, layout, forms, data-display, feedback, charts)
├── lib/
│   ├── roycss-effects.ts     # Combines batches 1-43 → 1,749 effects array
│   ├── effects-batch-{1..49}.ts  # 49 batch files (batches 44-49 are orphans kept for future expansion)
│   ├── roycss-types.ts       # EffectCategory union (29 categories), categoryMeta, CSSEffect interface
│   ├── roycss-index.ts       # Framework-agnostic public API (getClass, getCSS, search, getByCategory, getCSSForEffects)
│   ├── product-registry.ts   # 62 platform products registry
│   ├── roycss-recipes.ts     # 200+ recipes
│   ├── roycss-patterns.ts    # 80+ patterns
│   ├── roycss-collections.ts
│   ├── effect-taxonomy.ts
│   ├── effect-quality.ts     # Quality scoring heuristic (0-100 + A-F grade)
│   ├── effect-runtime.ts     # Mount/unmount contract for effects
│   ├── design-tokens.ts
│   ├── framework-adapters.ts # React/Vue/Svelte/Angular/Solid adapters
│   ├── copy-formats.ts       # 7 copy-as formats (HTML inline, CSS file, Tailwind, Vue, Svelte, JSX, styled-components)
│   ├── auth-client.ts
│   ├── auth-constants.ts
│   ├── api-security.ts
│   ├── docs-sitemap.ts
│   ├── docs-data.ts
│   ├── portfolio-data.ts
│   ├── products-catalog.ts
│   ├── constants.ts
│   ├── utils.ts              # cn() — Tailwind class merger
│   ├── db.ts                 # Frontend Prisma client (for build-time use)
│   └── proxy.ts              # XTransformPort helper
├── hooks/
│   ├── use-mobile.ts
│   ├── use-toast.ts
│   └── use-favorites.ts      # Zustand store, persisted to localStorage
└── types/
    └── roycss-global.d.ts
```

---

## 3. Backend — Express.js + Prisma + SQLite (dev) / Supabase (prod)

| Aspect | Choice | Rationale |
|---|---|---|
| **Framework** | Express.js | Minimal, flexible, huge ecosystem |
| **Language** | TypeScript 5 (`backend/tsconfig.json` strict mode) | Type safety end-to-end |
| **Runtime** | Bun (`backend/package.json`) | Fast startup, native TypeScript |
| **Database** | Prisma ORM with SQLite provider (dev) → Supabase Postgres (prod) | Schema-first migrations; `prisma db push` for dev, `prisma migrate deploy` for prod |
| **Validation** | Zod (`backend/src/modules/<name>/schema.ts`) | Type-safe runtime validation |
| **Auth** | bcrypt (password hashing) + jsonwebtoken (JWT) + `requireAuth` middleware | Standard secure auth |
| **Rate limiting** | `express-rate-limit` — `generalRateLimit` (100/min) + `authRateLimit` (10/min) | In-memory store (production: Redis) |
| **Security headers** | Helmet | CSP, HSTS, X-Frame-Options, etc. |
| **CORS** | `corsMiddleware` (configurable `CORS_ORIGINS` env) | Cross-origin API access |
| **Logging** | Pino (`backend/src/lib/logger.ts`) + `requestId` + `requestLogger` middleware | Structured JSON logs |
| **Caching** | LRU cache (`backend/src/lib/cache.ts`) | Memoize service responses |
| **HTTP proxy** | `app.set("trust proxy", 1)` | Accurate `req.ip` behind Caddy |

### Backend file structure

```
backend/
├── package.json
├── tsconfig.json
├── tsconfig.test.json
├── vitest.config.ts
├── prisma/
│   └── schema.prisma        # 45 models, SQLite provider
├── scripts/
│   ├── start-dev.sh
│   ├── smoke-new-modules.ts
│   ├── smoke-batch-1.ts
│   └── smoke-batch-3.ts
├── tests/
│   ├── integration/
│   │   ├── setup.ts
│   │   ├── auth.test.ts        # 5 tests
│   │   ├── effects.test.ts     # 6 tests
│   │   └── contact.test.ts      # 4 tests
│   └── (vitest.config.ts at backend root)
└── src/
    ├── index.ts                # Boots HTTP server on PORT (default 4000)
    ├── types/
    │   └── index.ts            # Shared types
    ├── config/
    │   ├── constants.ts        # API_PREFIX = "/api/v1"
    │   └── env.ts              # Zod-validated env vars
    ├── lib/
    │   ├── cache.ts            # LRU cache
    │   ├── db.ts               # Prisma client
    │   ├── jwt.ts              # JWT sign/verify
    │   ├── logger.ts           # Pino logger
    │   ├── llm-client.ts       # LLM client (scaffold)
    │   └── supabase.ts         # Supabase client (scaffold)
    ├── server/
    │   ├── app.ts              # createApp() — 68 route mounts + root info endpoint
    │   └── middleware/
    │       ├── auth.ts          # requireAuth (JWT verify)
    │       ├── cors.ts          # CORS allow-list
    │       ├── error.ts         # asyncHandler, notFoundHandler, errorHandler
    │       ├── logging.ts       # requestIdMiddleware, requestLogger
    │       ├── rateLimit.ts      # generalRateLimit, authRateLimit
    │       └── validate.ts      # validateBody, validateQuery, validateParams
    └── modules/                # 68 modules, each: schema.ts + routes.ts + service.ts
        ├── accessibility/
        ├── academy/
        ├── analytics/
        ├── architect/
        ├── audit-center/
        ├── auth/                # ✅ Real (bcrypt + JWT + Prisma User)
        ├── benchmark/
        ├── blocks/
        ├── blueprints/
        ├── bundle/
        ├── cdn/
        ├── certifications/
        ├── challenges/
        ├── cloud/
        ├── color-space/
        ├── compliance/
        ├── contact/             # ✅ Real (Prisma ContactMessage)
        ├── deploy/
        ├── designer/
        ├── devtools/
        ├── digital-twin/
        ├── edge/
        ├── effects/             # ✅ Real (reads dist/effects.json)
        ├── enterprise/
        ├── fallback/
        ├── fleet/
        ├── generator/
        ├── governance/
        ├── health/              # ✅ Real (service status)
        ├── icons/
        ├── initial-letter/
        ├── inspector/
        ├── light-dark/
        ├── live/
        ├── logical-properties/
        ├── marketplace/
        ├── mcp/
        ├── mentor/
        ├── motion/
        ├── observatory/
        ├── open/
        ├── os/
        ├── pair/
        ├── patterns/
        ├── plugin-hub/         # Mounted as /api/v1/plugins
        ├── preview/
        ├── pro-components/
        ├── profiler/
        ├── property-registrar/
        ├── recipes/
        ├── refactor/
        ├── registry/
        ├── relative-color/
        ├── review/
        ├── scaffold/
        ├── scope/
        ├── search/
        ├── spotlight/
        ├── starting-style/
        ├── storage/
        ├── studio/
        ├── style-query/
        ├── subgrid/
        ├── sync/
        ├── text-wrap/
        ├── themes/
        ├── version/
        └── workspace/
```

### Module anatomy (every module has the same 3-file structure)

```
backend/src/modules/<name>/
├── schema.ts     # Zod input schemas (params, query, body) + inferred types
├── routes.ts     # Express Router with router.METHOD() handlers
└── service.ts    # Pure async functions: listX, getXById, createX, updateX, deleteX
                   # Mock services return SEED_<NAME>_* arrays + have Future: comment
                   # describing exactly what's needed to swap in real impl
```

### Middleware pipeline (in order)

1. `helmet()` — secure HTTP headers
2. `corsMiddleware` — CORS allow-list
3. `express.json({ limit: "256kb" })` — JSON body parser
4. `express.urlencoded({ extended: true, limit: "256kb" })` — URL-encoded body parser
5. `requestIdMiddleware` — assigns `req.id` (cuid)
6. `requestLogger` — logs every request with method, path, status, duration, ip
7. `app.set("trust proxy", 1)` — so `req.ip` reflects real client
8. `app.use(${API_PREFIX}/health, healthRouter)` — mounted BEFORE rate limit (health checks never throttled)
9. `generalRateLimit` — 100 req/min/IP for everything else
10. 68 module routers mounted under `${API_PREFIX}/<module>`
11. `app.get(API_PREFIX, ...)` — root info endpoint listing all routes
12. `notFoundHandler` — 404 JSON response
13. `errorHandler` — centralized error handler (Zod errors → 400, auth errors → 401, etc.)

---

## 4. WebSocket — Socket.io live-service (port 3003)

| Aspect | Choice |
|---|---|
| **Library** | Socket.io (`mini-services/live-service/package.json`) |
| **Port** | 3003 (hardcoded in `mini-services/live-service/index.ts`) |
| **Transport** | WebSocket (with polling fallback) |
| **State** | In-memory `Map<roomId, Set<userId>>` — production: Redis adapter |
| **Events** | `join`, `leave`, `message`, `cursor`, `state` |
| **Auto-restart** | `bun --hot` (per dev script in `package.json`) |
| **Frontend wiring** | `io("/?XTransformPort=3003")` — never direct `io("http://localhost:3003")` |

### Why a separate service (not embedded in the Express backend)?

- Socket.io's long-lived connections don't share state well with Express's request/response model.
- Scaling the live-service horizontally requires a Redis adapter (planned for production).
- Independent deploy cycle (live-service can ship more often than the API).

---

## 5. Database — Prisma ORM with 45 models

See `ROYCSS_DATABASE_REPORT.md` for the complete model catalog. Grouped by domain:

| Domain | Models | Count |
|---|---|---|
| Identity & Auth | User, EffectFavorite, Collection, ContactMessage | 4 |
| Learning & Challenges | LearningPath, PathProgress, Challenge, ChallengeSubmission, Certification, CertificationAttempt | 6 |
| Audit & Compliance | AuditProject, AuditResult, ComplianceStandard, ComplianceScan | 4 |
| Cloud & Deploy | CloudProject, Deployment, FleetProject, PreviewBranch | 4 |
| Studio & Workspace | StudioProject, WorkspaceResource | 2 |
| Enterprise & Governance | Organization, Team, License, EnterpriseAuditLog, GovernancePolicy, GovernanceApproval | 6 |
| Marketplace & Templates | Template, TemplateReview, Blueprint | 3 |
| Blocks | Block | 1 |
| Spotlight | SpotlightItem | 1 |
| Observatory | ObservatorySite | 1 |
| Live | LiveSession, LiveMessage | 2 |
| Open Source | GoodFirstIssue, RFC, Roadmap, Contributor | 4 |
| DevTools / Perf | BenchmarkResult, BundleResult, ProfilerResult | 3 |
| Digital Twin | TwinResult | 1 |
| Theme & OS | Theme, OSDashboard | 2 |
| Search | SearchIndex | 1 |
| **Total** | | **45** |

### Prisma conventions used throughout

- `id` — `String @id @default(cuid())` (CUID for sortability + collision resistance)
- `createdAt` — `DateTime @default(now())`
- `updatedAt` — `DateTime @updatedAt`
- JSON columns — modeled as `String` with `<name>Json` suffix (SQLite doesn't support native JSON; Postgres will)
- Foreign keys — declared as `userId String` with `@relation` + `onDelete: Cascade` for owned relations
- Indexes — `@@index([field])` for foreign keys; `@@index([field1, field2])` for composite lookups
- Unique constraints — `@unique` for single-column, `@@unique([field1, field2])` for composite

---

## 6. CI/CD — GitHub Actions + Dependabot

### `.github/workflows/ci.yml` (parallel frontend + backend jobs)

**Trigger**: push to `main` + every PR targeting `main`. `concurrency: cancel-in-progress: true`.

#### Frontend job (`working-directory: .`)
1. Checkout (fetch-depth: 1)
2. `oven-sh/setup-bun@v2`
3. `bun install --frozen-lockfile`
4. `bun run lint` — ESLint
5. `bunx tsc --noEmit` — TypeScript check
6. `bunx vitest run` — 111 unit tests
7. `bun run build:package` — generates `dist/`
8. Upload `dist/` artifact (7-day retention)

#### Backend job (`working-directory: backend`, env: `DATABASE_URL=file:./test.db`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `EFFECTS_DATA_PATH=../dist/effects.json`)
1. Checkout
2. Setup Bun
3. Build parent `dist/effects.json` first (dependency of integration tests)
4. `bun install --frozen-lockfile` (in `backend/`)
5. `bun run typecheck` — `tsc --noEmit`
6. `bun run db:generate` — Prisma client
7. `bun run db:push` — push schema to throwaway `test.db`
8. `bun run typecheck:tests` — typecheck integration tests (`tsconfig.test.json`)
9. `bun run test:integration` — 15 integration tests via supertest
10. Upload coverage artifact

### `.github/workflows/deploy.yml` (gated on CI success on `main`)

**Trigger**: `workflow_run` on `CI` `completed`.

**Guard job**: only proceeds if `conclusion === 'success' && head_branch === 'main' && event in ['push', 'pull_request']`.

**Deploy jobs**:
- Frontend → Vercel (`vercel-action`) with `deployments: write` permission
- Backend → Railway/Fly.io/Render (with `prisma migrate deploy` step)

**Concurrency**: `group: deploy-${{ github.ref }}`, `cancel-in-progress: false` (queue, never cancel half-applied deploys).

### `.github/workflows/release.yml` — npm publish for the `roycss` package

### `.github/dependabot.yml`

Weekly updates for:
- npm dependencies (root + `backend/` + `vscode-extension/` + `mcp-server/` + `mini-services/live-service/`)
- GitHub Actions versions (all workflows)

---

## 7. Gateway — Caddy (single external port)

`Caddyfile` at project root routes a single external port to internal services via the `XTransformPort` query parameter:

| Pattern | Routes to |
|---|---|
| `/` (no query) | `:3000` (Next.js) |
| `/api/...?XTransformPort=4000` | `:4000` (Express backend) |
| `/?XTransformPort=3003` (WebSocket) | `:3003` (Socket.io live-service) |

**Hard rules enforced**:
- Relative paths only — never `http://localhost:3000` in client fetch
- WebSocket path is always `/` (so Caddy can forward correctly) — only the `XTransformPort` query identifies the upstream
- Direct port-based URLs are prohibited (`fetch('http://localhost:3030/api/test')` is forbidden)

---

## 8. Cross-cutting concerns

### Configuration (env vars)

`backend/src/config/env.ts` — Zod-validated env schema:

| Var | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Runtime mode |
| `PORT` | `4000` | Backend port |
| `LOG_LEVEL` | `info` | Pino log level |
| `CORS_ORIGINS` | `http://localhost:3000` | CORS allow-list (comma-separated) |
| `DATABASE_URL` | `file:./dev.db` | SQLite (dev) / Postgres URL (prod) |
| `JWT_SECRET` | (required, ≥32 chars) | JWT signing secret |
| `JWT_REFRESH_SECRET` | (required, ≥32 chars) | JWT refresh signing secret |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window |
| `RATE_LIMIT_MAX_GENERAL` | `100` | General rate limit |
| `RATE_LIMIT_MAX_AUTH` | `10` | Auth rate limit |
| `RATE_LIMIT_MAX_CONTACT` | `5` | Contact rate limit |
| `EFFECTS_DATA_PATH` | `../dist/effects.json` | Effects JSON path |
| `SUPABASE_URL` | (optional) | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | (optional) | Supabase publishable key |
| `SUPABASE_SECRET_KEY` | (optional) | Supabase secret key |
| `SUPABASE_JWKS_URL` | (optional) | Supabase JWKS URL |
| `OPENAI_API_KEY` | (optional) | OpenAI API key (for LLM modules) |
| `ANTHROPIC_API_KEY` | (optional) | Anthropic API key |
| `RESEND_API_KEY` | (optional) | Resend email API key |
| `SENTRY_DSN` | (optional) | Sentry DSN |
| `STORAGE_*` | (optional) | S3/R2/GCS object storage |
| `CDN_API_TOKEN` | (optional) | Cloudflare/Fastly/CloudFront |
| `FIGMA_TOKEN` | (optional) | Figma REST |
| `GITHUB_TOKEN` | (optional) | GitHub REST (sync module) |
| `NPM_TOKEN` | (optional) | npm publish |

### Error handling

- `asyncHandler(fn)` — wraps async route handlers to catch promise rejections
- `notFoundHandler` — returns 404 JSON `{ error: { code: "NOT_FOUND", message: ... } }`
- `errorHandler` — central handler at the end of the pipeline:
  - Zod errors → 400 `VALIDATION_ERROR` with `details[]`
  - Auth errors → 401 `UNAUTHORIZED`
  - Prisma `PrismaClientKnownRequestError` → 404 / 409 based on code
  - Everything else → 500 `INTERNAL_ERROR` (logged with stack trace in dev)

### Caching strategy

- `LRUCache` in `backend/src/lib/cache.ts` — max 1000 entries, 5-minute TTL
- Used by services that read static-ish data (effects, recipes, patterns, themes)
- Cache key: `${module}:${operation}:${JSON.stringify(args)}`
- Invalidation: explicit `cache.del(key)` on writes (when services are wired to Prisma)

### Security posture

- Helmet (CSP, HSTS, X-Frame-Options, etc.)
- bcrypt with cost factor 10 for password hashing
- JWT with separate access (15m) + refresh (7d) tokens
- `requireAuth` middleware (currently only on `/api/v1/auth/me`)
- Rate limiting on auth (10/min/IP) and contact (5/min/IP) endpoints
- Request body size limit: 256kb (JSON + URL-encoded)
- CORS allow-list (not `*`)
- Pino structured logging with `requestId` for trace correlation
- CSP report at `security/CSP.md`
- XSS scan results at `security/results/xss-report.json`
- SBOM at `security/SBOM.json`
- CSS exfiltration check at `security/results/css-exfiltration-report.json`

### Observability

- Pino logger — JSON to stdout (production: ship to Logtail / Datadog)
- `requestId` middleware — assigns a cuid to every request, propagates through logs
- `requestLogger` middleware — logs every request with method/path/status/duration/ip
- (Planned) Sentry integration via `SENTRY_DSN` env

---

## 9. Testing infrastructure

| Tier | Tool | Files | Count | Status |
|---|---|---|---|---|
| Unit | Vitest | 7 | 111 | ✅ All pass — `tests/unit/{effects,roycss-index,design-tokens,categories,framework-adapters,recipes,patterns}.test.ts` |
| Integration | Vitest + supertest | 3 | 15 | ✅ All pass — `backend/tests/integration/{auth,effects,contact}.test.ts` against isolated `backend/test.db` |
| E2E | Playwright | 10 | 58 specs | ⚠️ Specs valid; browsers not installed |
| Load | k6 | 1 | — | ⚠️ `tests/load/effects-api.k6.js` exists; not run in CI |
| A11y | axe-core + keyboard nav | 2 | — | ⚠️ Specs valid; need browser to run |
| Security | OWASP ZAP | 0 | — | ❌ Not yet implemented |
| Performance | Custom + Playwright | 6 + 7 | — | ✅ Baselines at `performance/results/*.json` + `perf/results/benchmark-report.json` |

### Test command map

```bash
# Frontend
bun run lint                          # ESLint (exit 0)
bunx tsc --noEmit                     # TypeScript check (0 errors in src/)
bunx vitest run                       # 111 unit tests
bunx playwright test                  # E2E (after `bunx playwright install --with-deps`)

# Backend
cd backend && bun run typecheck      # tsc --noEmit (exit 0)
cd backend && bun run test:integration  # 15 integration tests via supertest + vitest
```

---

## 10. Sub-projects (separate npm packages)

| Sub-project | Path | Port | Purpose |
|---|---|---|---|
| Main frontend | `.` | 3000 | Next.js 16 single-page app |
| Backend API | `backend/` | 4000 | Express + Prisma |
| Live service | `mini-services/live-service/` | 3003 | Socket.io |
| CLI | `cli/` | — | npm-published `roycss-cli` |
| MCP server | `mcp-server/` | — | npm-published `@roycss/mcp-server` |
| VS Code extension | `vscode-extension/` | — | `.vsix` artifacts shipped |

Each sub-project has its own `package.json`, lockfile, and tsconfig (where applicable). They are deployed independently.

---

## 11. Build artifacts

`scripts/build-package.ts` generates the `dist/` directory:

```
dist/
├── effects.json          # 1,749 effects (id, name, category, cssCode, etc.)
├── effects.js            # ESM bundle for npm consumers
├── effects.cjs           # CJS bundle for npm consumers
├── effects.d.ts          # TypeScript types
├── roycss.css            # All effect CSS (unminified)
├── roycss.min.css        # Minified (for production)
├── roycss.min.css.map    # Source map
├── roycss-critical.css   # Critical-path CSS only (above-the-fold)
├── roycss-fallbacks.css  # Fallback CSS for older browsers
├── motion-library.json   # 60 motion presets
├── version-manifest.json # Latest version info
├── class-index.json      # Class name → effect id mapping
└── pro-components.json   # Pro components metadata
```

`scripts/generate-effects-json.ts` regenerates `dist/effects.json` from the canonical TypeScript source — run after every effect catalog change. The backend's `effects` service reads this JSON at boot via `EFFECTS_DATA_PATH`.

---

## 12. Architectural decisions (ADRs)

The project has 7 ADRs in `docs/adr/`:
1. **ADR-001** Repository architecture (monorepo with sub-projects)
2. **ADR-002** CSS-first architecture
3. **ADR-003** State management (Zustand for client, TanStack Query for server)
4. **01** Inspector extension
5. **02** VS Code extension
6. **03** Docs site
7. **04** npm publish pipeline
8. **05** Performance engineering
9. **06** Accessibility architecture
10. **07** Security supply chain

Plus deeper ADRs in subfolders: accessibility, performance, security, i18n-rtl, npm-pipeline, documentation-viewer, quality-engineering, mcp-server-v2, vscode-extension, effect-curation, cli-platform-v2 — each with DESIGN, IMPLEMENTATION-PLAN, REVIEW-CHECKLIST, THREAT-MODEL, ADR files.

---

## 13. Tech-debt + planned migrations

| Item | Status | Plan |
|---|---|---|
| SQLite → Postgres | Pending | Change `DATABASE_URL` to Supabase URL; run `prisma migrate deploy`; JSON `String` columns can become `Json` type |
| In-memory rate limit → Redis | Pending | Swap `express-rate-limit`'s `store` for `RedisStore` |
| In-memory LRU → Redis | Pending | Replace `lru-cache` calls with `ioredis` GET/SET |
| Socket.io in-memory → Redis adapter | Pending | `io.adapter(redisAdapter({ pubClient, subClient }))` |
| localStorage JWT → httpOnly cookie | Pending | Move `localStorage.setItem('roycss_jwt', ...)` to `document.cookie` set by backend |
| 64 mock services → real Prisma services | Pending | Each `service.ts` has a `Future:` comment describing the rewrite |
| 60 product cards → fetch from backend | Pending | Wrap each demo in `useEffect(() => fetch("/api/v1/<module>?XTransformPort=4000"), [])` |
| Email sending (contact → Resend) | Pending | `RESEND_API_KEY` + nodemailer-compatible API call |
| LLM API keys (architect/designer/mentor/pair/review) | Pending | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` |
| Object storage (storage → S3/R2/GCS) | Pending | `STORAGE_*` env vars + S3 SDK |
| CDN (cdn → Cloudflare/Fastly/CloudFront) | Pending | `CDN_API_TOKEN` + provider API |
| Worker queue (BullMQ + Redis) | Pending | For long-running: accessibility, devtools, digital-twin, bundle, profiler, architect, mentor, pair, refactor, review |
| Sentry error tracking | Pending | `SENTRY_DSN` env + Sentry SDK init in `backend/src/index.ts` |
| Stripe (sponsor + paid tiers) | Pending | `STRIPE_SECRET_KEY` env + Stripe SDK |

---

## 14. Architectural strengths

1. **CSS-first** — effects are pure CSS classes (`.roycss-<id>`) with optional `@keyframes`; no JavaScript runtime required for the effects themselves.
2. **Type-safe end-to-end** — TypeScript in frontend + backend; Zod schemas at the API boundary produce inferred types consumed by route handlers.
3. **Module-per-feature** — every backend module has the same 3-file shape (`schema.ts`, `routes.ts`, `service.ts`), making it trivial to swap mock services for real ones without touching the route layer.
4. **Single source of truth for the effects catalog** — `src/lib/roycss-effects.ts` is the canonical source; `dist/effects.json` is regenerated by `scripts/generate-effects-json.ts`; the backend reads the JSON at boot.
5. **Single source of truth for the product catalog** — `src/lib/product-registry.ts` (62 entries, declarative, no JSX) drives the ProductGrid, ComponentComposer, OG image, and JSON-LD.
6. **PWA-installable** — manifest + SW + icons + start_url + theme-color all wired; install prompt component shipped.
7. **Pre-hydration theme** — prevents FOUC for the most common flash-of-wrong-theme scenario.
8. **Strict CI** — lint + typecheck + 111 unit + 15 integration tests + package build, all in parallel.
9. **Gated deploys** — deploy workflow only fires when CI succeeds on `main`; concurrency groups prevent half-applied deploys.
10. **Sub-projects are independent** — CLI, MCP server, VS Code extension, and live-service each ship on their own cadence.
