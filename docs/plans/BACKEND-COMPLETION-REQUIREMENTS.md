# RoyCSS — Backend Completion Requirements

> **Question answered**: "What's required for everything to be completed, especially the backend?"
>
> **TL;DR**: 64 of 68 backend modules currently return mock/seed data.
> Completing them requires ~30 new Prisma models, ~14 external service
> integrations, frontend↔backend wiring for 62 product cards, production
> infrastructure (Postgres + Redis + S3 + LLM keys + CDN), and CI/CD.

---

## 1. Current backend state

**68 modules** in `backend/src/modules/`. Real implementations:

| Module | Real? | Notes |
|---|---|---|
| `auth` | ✅ Real | bcrypt + JWT + Prisma `User` model |
| `contact` | ✅ Real | Persists to Prisma `ContactMessage` |
| `effects` | ✅ Real | Reads `dist/effects.json` (1,749 effects) |
| `accessibility` | ⚠️ Half | Real contrast-ratio; mock audits |
| other 64 | ❌ Mock | Return hardcoded `SEED_*` arrays |

The 64 mock modules are **intentional** — each `service.ts` has a
`Future:` comment documenting exactly what's needed to swap in real
implementation. The route layer (Zod validation + Express handlers) is
production-ready and won't need to change.

---

## 2. Required work, by category

### 2.1 Database schema expansion (~30 new Prisma models)

Current schema has 4 models: `User`, `EffectFavorite`, `Collection`,
`ContactMessage`. The mock services reference these missing models:

| Module | Required Prisma models |
|---|---|
| `academy` | `LearningPath`, `PathProgress` |
| `audit-center` | `AuditProject`, `AuditResult` |
| `benchmark` | `BenchmarkResult` |
| `blocks` | `Block`, `BlockSubmission` |
| `blueprints` | `Blueprint` |
| `bundle` | `BundleResult` |
| `certifications` | `Certification`, `Attempt` |
| `challenges` | `Challenge`, `Submission` |
| `cloud` | `CloudProject`, `Deployment` |
| `compliance` | `ComplianceScan`, `Standard` |
| `deploy` | `Deployment` (note: also referenced by `cloud`) |
| `digital-twin` | `TwinResult` |
| `enterprise` | `Organization`, `Team`, `License`, `AuditLog` |
| `fleet` | `FleetProject` |
| `governance` | `Approval`, `Policy`, `AuditLog` |
| `live` | `LiveSession`, `LiveMessage` |
| `marketplace` | `Template`, `Review` |
| `observatory` | `ObservatorySite` |
| `open` | `Issue`, `RFC`, `Roadmap`, `Contributor` |
| `os` | `OSDashboard` |
| `patterns` | `Pattern` (currently in TS source — could stay) |
| `preview` | `PreviewBranch` |
| `profiler` | `ProfilerResult` |
| `recipes` | `Recipe` (currently in TS source — could stay) |
| `search` | `SearchIndex` (needs Postgres FTS) |
| `spotlight` | `SpotlightItem` |
| `storage` | `StorageFile` |
| `studio` | `StudioProject` (with JSON column) |
| `themes` | `Theme` |
| `workspace` | `WorkspaceResource` |

**Effort estimate**: ~30 models × 15 lines each = ~450 lines of Prisma
schema + matching Zod schemas + ~30 service rewrites.

### 2.2 External service integrations (~14 modules)

These modules can't be "completed" with just a database — they need
real external dependencies:

| Module | External dependency | Why |
|---|---|---|
| `accessibility` | Playwright + axe-core | Headless browser audits |
| `architect` | LLM API (OpenAI/Anthropic) | AI planner |
| `cdn` | Cloudflare/Fastly/CloudFront API | Real CDN stats |
| `designer` | LLM API | Token-aware CSS generator |
| `devtools` | Playwright | Headless browser scraping |
| `digital-twin` | Headless browser farm (Lighthouse) | Real perf metrics |
| `edge` | Real edge-platform API | Edge locations |
| `generator` | Hygen or Plop | Template engine |
| `inspector` | Build step | Extract class metadata |
| `mcp` | @roycss/mcp-server connection | MCP stdio/HTTP transport |
| `mentor` | LLM API (streaming) | Chat mentor |
| `motion` | JSON build step | Source effects from build |
| `pair` | LLM with tool-calling | AI pair programming |
| `pro-components` | @roycss/pro package build | Component metadata |
| `refactor` | PostCSS / codemod | AST-based transformer |
| `review` | LLM reviewer or eslint/stylelint | Code review |
| `scaffold` | `create-*` template engine | create-next-app etc. |
| `registry` | npm registry or local verdaccio | Package registry |
| `search` | Postgres FTS or ElasticSearch | Full-text search |
| `sync` | Figma REST + GitHub REST | Design→code sync |
| `storage` | S3 / R2 / GCS | Object storage |
| `version` | CHANGELOG.md parser + semver | Release manifest |

**Effort estimate**: 22 external integrations × ~2 days each = ~44 dev-days
(many can be parallelized).

### 2.3 Frontend ↔ backend wiring (62 product cards)

Currently only **2** integrations actually call the backend:

1. `/api/health` (Next.js API route → backend)
2. Roy Live (socket.io → port 3003 via `?XTransformPort=3003`)

The other **62** platform product cards render self-contained demos.
Wiring them to fetch from their backend module via
`?XTransformPort=4000`:

```tsx
// Example wiring for Analytics Dashboard:
useEffect(() => {
  fetch("/api/v1/analytics?XTransformPort=4000")
    .then(r => r.json())
    .then(setData);
}, []);
```

**62 product cards × ~30 minutes each** = ~31 hours of wiring work.

### 2.4 Authentication expansion

- `requireAuth` middleware exists but only `auth/routes.ts` uses it
- Need to add `requireAuth` to protected routes:
  - Favorites (per-user)
  - Collections (per-user)
  - Dashboards (per-user)
  - Workspace resources (per-user)
  - Settings (per-user)
- Frontend needs:
  - Login + Register pages (currently only API endpoints exist)
  - JWT storage (httpOnly cookie preferred over localStorage)
  - Protected route wrapper
  - Token refresh flow on 401

**Effort estimate**: ~1 week for full auth flow frontend + backend.

### 2.5 Production infrastructure

| Component | Dev (current) | Production (required) |
|---|---|---|
| Database | SQLite (`dev.db`) | PostgreSQL (Neon/Supabase/Railway) |
| Cache | In-memory LRU | Redis or Upstash Redis |
| File storage | In-memory arrays | S3 / Cloudflare R2 / GCS |
| Email | None (contact form just saves to DB) | Resend or SendGrid (transactional) |
| LLM API keys | None (mocks) | OpenAI or Anthropic API key |
| CDN | Mock stats | Cloudflare/Fastly/CloudFront account |
| Figma API | Mock sync | Figma Personal Access Token |
| GitHub API | Mock sync | GitHub PAT (read org + repo scope) |
| npm publish | Mock registry | npm publish token (for @roycss/* packages) |
| WebSocket gateway | socket.io mini-service on port 3003 | Same — or push to Ably/Pusher for scale |
| Rate limit store | In-memory | Redis (for multi-instance) |
| Logging/observability | Pino to stdout | Sentry + Logtail / Datadog |
| Worker queue | None | BullMQ + Redis (or Inngest/Vercel Cron) |

**Infrastructure setup**: ~2-3 days of DevOps work (provisioning + env vars).

### 2.6 Long-running jobs (need worker queue)

Several modules would block the request thread if implemented synchronously:

| Module | Long-running op | Worker needed? |
|---|---|---|
| `accessibility` | Headless browser audit (5-30s per URL) | Yes |
| `devtools` | Page scrape + analysis (3-10s per URL) | Yes |
| `digital-twin` | Lighthouse run (30-60s per URL) | Yes |
| `bundle` | Rollup esbuild bundling (5-60s) | Yes |
| `profiler` | Performance profile (10-30s) | Yes |
| `architect` | LLM planning (5-30s) | Yes |
| `mentor` | LLM streaming (continuous) | Yes (streaming, not queue) |
| `pair` | LLM tool-calling (5-30s) | Yes |
| `refactor` | AST codemod (1-10s) | Yes |
| `review` | LLM review (5-30s) | Yes |

**Worker queue setup**: BullMQ + Redis + worker process = ~1 day setup.

### 2.7 Testing completion

| Tier | Files | Status | Work needed |
|---|---|---|---|
| Unit (Vitest) | 7 files / 111 tests | ✅ All pass | None — done |
| E2E (Playwright) | 10 files / 58 specs | ⚠️ Specs valid, not run | Install browsers (`bunx playwright install --with-deps`), configure base URL |
| Integration | None | ❌ Missing | Add tests for backend modules (DB roundtrip, Zod validation, auth) |
| Load | None | ❌ Missing | k6 or Artillery plan for /api/v1/effects |
| Security | None | ❌ Missing | OWASP ZAP scan + CSRF test + rate-limit test |
| A11y | axe-core + keyboard nav | ✅ Valid specs | Run with browser |

**Testing completion**: ~1 week.

### 2.8 CI/CD (currently none)

Need a GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml (not yet created)
name: CI
on: [push, pull_request]
jobs:
  lint: bun run lint
  typecheck: bun run typecheck
  unit-tests: bunx vitest run
  build: bun run build:package
  backend-typecheck: cd backend && bun run typecheck
  e2e: bunx playwright test (with dev server + backend up)
```

Plus deploy workflows:
- Frontend → Vercel (auto-deploy on `main` push)
- Backend → Railway / Fly.io / Render (with DB migration step)
- Database migrations → `prisma migrate deploy` on each deploy

**CI/CD setup**: ~1-2 days.

---

## 3. Total effort estimate

| Track | Effort | Parallelizable? |
|---|---|---|
| 30 Prisma models + service rewrites | ~3 weeks | Yes (split by module) |
| 14 external service integrations | ~6 weeks | Yes (split by module) |
| 62 frontend↔backend wirings | ~1 week | Yes (split by product) |
| Auth flow (frontend + protected routes) | ~1 week | After models exist |
| Production infrastructure setup | ~3 days | Mostly serial |
| Worker queue + long-running jobs | ~1 week | After infra |
| Testing (integration + load + security + e2e) | ~1 week | Yes |
| CI/CD workflows | ~2 days | Yes |

**Total**: ~10-12 weeks of focused engineering work, with significant
parallelism. A team of 3-4 engineers could complete this in ~3-4 weeks.

---

## 4. Phased delivery recommendation

### Phase A (Week 1-2): Foundation
- Postgres provisioning (swap from SQLite)
- Redis provisioning (for cache + rate-limit + worker queue)
- Expand Prisma schema to ~30 new models
- Run `prisma migrate` for production schema
- Frontend auth UI (login/register/refresh)
- Add `requireAuth` to protected routes

### Phase B (Week 3-4): Real data wiring
- Rewrite 30 mock services to use Prisma (the ones that just need DB)
- Wire 62 product cards to fetch from backend
- Add LLM API key + implement `architect`, `designer`, `mentor`, `pair`, `review` (5 modules)
- Worker queue setup (BullMQ + Redis)

### Phase C (Week 5-6): External integrations
- Playwright browser farm → `accessibility`, `devtools`, `digital-twin` (3 modules)
- Object storage (R2) → `storage` (1 module)
- CDN provider API → `cdn` (1 module)
- Figma + GitHub REST → `sync` (1 module)
- npm registry → `registry` (1 module)
- Search backend (Postgres FTS) → `search` (1 module)
- Template engines (Hygen + create-*) → `generator`, `scaffold` (2 modules)
- Codemod tooling → `refactor` (1 module)
- @roycss/mcp-server spawn → `mcp` (1 module)

### Phase D (Week 7-8): Hardening + CI/CD
- Integration tests for all backend modules
- E2E test run with Playwright browsers
- Load tests (k6 plan)
- Security tests (OWASP ZAP)
- GitHub Actions CI workflow
- Deploy workflows (frontend → Vercel, backend → Railway)
- Database migration CI check
- Secrets management

---

## 5. What you can do RIGHT NOW (no external deps)

These are the "low-hanging fruit" that don't need any external services
or new infrastructure — just engineering time:

### 5.1 Database-backed modules (need only Postgres swap)

| Module | Effort | Notes |
|---|---|---|
| `academy` | ~4h | LearningPath + Progress models |
| `audit-center` | ~6h | AuditProject + AuditResult models |
| `benchmark` | ~4h | BenchmarkResult model |
| `blocks` | ~4h | Block + Submission models |
| `blueprints` | ~4h | Blueprint model |
| `bundle` | ~4h | BundleResult model |
| `certifications` | ~6h | Certification + Attempt models |
| `challenges` | ~6h | Challenge + Submission models |
| `cloud` | ~4h | CloudProject + Deployment models |
| `compliance` | ~4h | ComplianceScan + Standard models |
| `deploy` | ~4h | Deployment model |
| `enterprise` | ~8h | 4 models (Org + Team + License + AuditLog) |
| `fleet` | ~4h | FleetProject model |
| `governance` | ~6h | Approval + Policy + AuditLog models |
| `live` | ~6h | LiveSession + LiveMessage models |
| `marketplace` | ~6h | Template + Review models |
| `observatory` | ~4h | ObservatorySite model |
| `open` | ~8h | 4 models (Issue + RFC + Roadmap + Contributor) |
| `os` | ~4h | OSDashboard model |
| `preview` | ~4h | PreviewBranch model |
| `profiler` | ~4h | ProfilerResult model |
| `spotlight` | ~4h | SpotlightItem model |
| `studio` | ~6h | StudioProject model (with JSON column) |
| `themes` | ~4h | Theme model |
| `workspace` | ~4h | WorkspaceResource model |

**Subtotal**: ~120 hours = ~3 weeks for one engineer, or ~1 week for 3 engineers in parallel.

### 5.2 Frontend↔backend wiring (62 cards × ~30min)

Can start immediately. Each card fetches from its module via
`?XTransformPort=4000`. Cards keep working with mock data if backend
is down (progressive enhancement pattern already used by
`EngineStatus`).

### 5.3 Auth flow expansion

- Add login + register pages (frontend)
- Wrap protected routes with auth check
- Implement httpOnly cookie JWT storage
- Token refresh on 401
- ~1 week

---

## 6. What BLOCKS completion (cannot do without external deps)

| Module | Blocker | Cost |
|---|---|---|
| `architect` | LLM API key | $20-100/month (OpenAI/Anthropic) |
| `designer` | LLM API key | Same |
| `mentor` | LLM API key (streaming) | Same |
| `pair` | LLM API key (tool-calling) | Same |
| `review` | LLM API key (or eslint/stylelint) | LLM $20-100 OR eslint (free) |
| `accessibility` | Playwright + browser farm | Free (open source) + ~$50/mo for hosted (Browserless) |
| `devtools` | Playwright | Free |
| `digital-twin` | Lighthouse + browser farm | Free |
| `cdn` | Cloudflare/Fastly/CloudFront account | Free tier available |
| `storage` | S3/R2/GCS | $5-20/month |
| `sync` | Figma + GitHub PAT | Free (personal tokens) |
| `registry` | npm publish token | Free |
| `search` | Postgres FTS (free) OR Elastic (free self-host) | Free if Postgres |
| `email` | Resend/SendGrid | Free tier (3k-100/mo) |
| `observability` | Sentry | Free tier |
| `worker queue` | Redis (Upstash free tier) | Free |

**Monthly cost for full production**: ~$50-200/month depending on LLM usage.

---

## 7. Honest status summary

| What's "done" | What's "pending" |
|---|---|
| ✅ 1,749 effects across 29 categories | ❌ 64 backend modules return mock data |
| ✅ 62 platform product cards (UI) | ❌ 62 product cards don't fetch from backend |
| ✅ 68 devtools | ❌ Frontend auth UI missing |
| ✅ 7 WebGL effects | ❌ ~30 Prisma models missing |
| ✅ PWA (installable) | ❌ 14 external service integrations pending |
| ✅ OG image (PNG) | ❌ Production Postgres + Redis + S3 not provisioned |
| ✅ Health endpoint | ❌ LLM API keys not configured |
| ✅ Effects API (manifest, single CSS) | ❌ Worker queue not set up |
| ✅ Effect runtime contract | ❌ Integration/load/security tests missing |
| ✅ Product registry + card + grid | ❌ CI/CD workflows missing |
| ✅ Component composer | ❌ |
| ✅ Sponsor modal (GitHub + Stripe-coming-soon) | ❌ Stripe integration not done |
| ✅ Auth backend (real) | ❌ Auth frontend (login/register UI) |
| ✅ Contact backend (real) | ❌ Email sending |
| ✅ Effects backend (real) | ❌ |
| ✅ Live socket.io service | ❌ Persisted sessions (currently in-memory) |
| ✅ Lint: 0 errors | ❌ |
| ✅ Unit tests: 111/111 pass | ❌ E2E tests not run (Playwright browsers missing) |
| ✅ DOM: 5,796 nodes (45% reduction) | ❌ |
| ✅ Hydration mismatch: gone | ❌ |

**Bottom line**: The platform is **frontend-complete and PWA-installable**.
The backend is **structurally complete** (all 68 modules exist with valid
Zod schemas + route handlers + caching) but **functionally mock** for
64 of 68 modules. Completing the backend requires ~3-4 weeks of
engineering work plus ~$50-200/month of external service costs.
