# RoyCSS Backend TODO

> Honest, ordered backlog. Split into **sandbox-runnable now** (TypeScript
> backend, this environment) and **production target** (Go + PostgreSQL +
> Redis, requires a host with that toolchain).

---

## A. Runnable in this sandbox (TypeScript backend, `backend/src/`)

These improve the **working** modular monolith without needing Go/PG/Redis.

### A1. Registry as the single source of truth
- [ ] Add a `registry/resolve/:slug` endpoint that returns the canonical
      effect/component/pattern regardless of which product asks for it.
- [ ] Make `effects`, `components`, `patterns`, `themes`, `tokens`, `icons`,
      `motion` modules delegate reads to the registry module so there is
      exactly one code path for RoyCSS framework content.
- [ ] Version stamping: every registry item exposes `version` +
      `latestVersion`; add a `GET /api/v1/registry/packages/:id/versions`
      diff endpoint.

### A2. Authorization granularity
- [ ] Org/team scoping on `projects`, `studio`, `marketplace`, `cloud`,
      `enterprise` modules (currently the routes exist but ownership checks
      are coarse).
- [ ] Role checks: OWNER / ADMIN / MEMBER / VIEWER on organization endpoints.
- [ ] Per-route `requireAuth` + `requireRole` middleware composition.

### A3. API key management
- [ ] `POST /api/v1/auth/api-keys` — create personal + org keys, hash at rest,
      show plaintext once.
- [ ] `GET /api/v1/auth/api-keys` — list (masked).
- [ ] `DELETE /api/v1/auth/api-keys/:id` — revoke.
- [ ] API-key auth middleware (alternate to JWT for CLI/SDK/MCP clients).

### A4. OpenAPI generation
- [ ] Add an OpenAPI spec generator that walks each module's `routes.ts` and
      Zod `schema.ts` to produce `api/openapi.yaml`.
- [ ] Serve `GET /api/v1/openapi.json` and a Swagger UI at `/api/docs`.

### A5. Rate-limit tiers
- [ ] Move the in-memory sliding-window limiter behind an interface so it can
      swap to Redis in the Go target without changing call sites.
- [ ] Per-route tiers: `general` / `auth` / `contact` / `ai` / `search`.

### A6. Audit log coverage
- [ ] Write audit entries on every mutating endpoint (auth, billing,
      marketplace, enterprise, governance) to the `audit` module.
- [ ] `GET /api/v1/audit?actor=&action=&since=` query endpoint.

### A7. Background worker separation (in-process first)
- [ ] Extract accessibility audits, AI generations, and analytics
      aggregation into a job-queue abstraction (in-process today, Redis-
      backed in the Go target).
- [ ] `POST /api/v1/<module>/jobs` → returns `{ jobId }`; `GET .../jobs/:id`
      → `{ status, result }`.

### A8. Testing
- [ ] Unit tests for each `service.ts`.
- [ ] Integration tests for each `routes.ts` (supertest + a test SQLite DB).
- [ ] Contract tests that pin the `/api/v1` response shapes (these become
      the Go port's acceptance tests).

### A9. Observability
- [ ] Add a `/api/v1/health/ready` that checks DB + registry + search index.
- [ ] Emit per-route latency histograms (in-memory p50/p95/p99).
- [ ] Add a `requestId` to every log line and response header.

---

## B. Production target (Go + PostgreSQL + Redis)

These require a host with Go 1.23+, PostgreSQL 15+, Redis 7+, Docker.

### B1. Platform layer (`backend/go/pkg/`)
- [ ] `database/` — pgx pool, health, migrations runner.
- [ ] `redis/` — go-redis client, health.
- [ ] `logger/` — structured logging (slog or zerolog).
- [ ] `http/` — chi router, JSON envelope, recover, request-ID, CORS.
- [ ] `validation/` — request validation (go-playground/validator).
- [ ] `telemetry/` — OpenTelemetry traces + metrics + logs.
- [ ] `storage/` — S3-compatible object storage client.

### B2. Identity
- [ ] `internal/auth` — JWT access+refresh, bcrypt, signup/login/refresh/me.
- [ ] `internal/users` — profile, settings.
- [ ] `internal/organizations` — org CRUD, membership, roles.
- [ ] `internal/teams` — team CRUD.

### B3. RoyCSS Registry (keystone)
- [ ] `internal/registry/{effects,components,patterns,collections,recipes,
      themes,tokens,icons,motion}` — canonical reads from PostgreSQL.
- [ ] `cmd/migrate` applies `database/sql/*.sql` in order.
- [ ] Versioning + diff endpoints.

### B4. Products (port from TS modules)
- [ ] projects, playground, studio
- [ ] marketplace, creators, licenses, purchases, payouts
- [ ] ai (provider interface, sessions, generations, credits, usage)
- [ ] mcp (scoped registry reads, never raw DB)
- [ ] cli, inspector, devtools
- [ ] accessibility, analytics, cloud
- [ ] billing, subscriptions, usage (idempotent payment endpoints)
- [ ] search, notifications, audit
- [ ] The remaining 48 modules from the TS backend.

### B5. Workers (`backend/go/cmd/worker/`)
- [ ] Redis-backed job queue.
- [ ] Workers: ai, accessibility, analytics, search, marketplace,
      notifications, exports, screenshots, asset processing.

### B6. MCP server
- [ ] `internal/mcp` — controlled registry access for AI agents.
- [ ] Scoped authorization (per-tool, per-resource).
- [ ] Never expose raw DB access.

### B7. RoyCLI backend support
- [ ] API endpoints that back `roy create/add/generate/search/audit/lint/
      optimize/doctor/convert/migrate` — all consuming the same registry.

### B8. Marketplace hardening
- [ ] Package upload validation (never execute untrusted code in-process).
- [ ] Sandbox execution for previewable assets.
- [ ] License + payout flows with server-side payment verification.

### B9. Billing
- [ ] FREE / PRO / ENTERPRISE / CLOUD tiers.
- [ ] Subscriptions, invoices, payments, refunds.
- [ ] Entitlements + usage-based billing.
- [ ] Idempotent payment endpoints (stripe-style idempotency keys).

### B10. Observability
- [ ] OpenTelemetry → managed collector.
- [ ] `/health`, `/health/live`, `/health/ready`.
- [ ] p50/p95/p99 dashboards for API, DB, Redis, queue depth.

### B11. Deployment
- [ ] Dockerfile for `cmd/api` and `cmd/worker`.
- [ ] Cloud Run service + Cloud Run job (workers).
- [ ] GitHub Actions: lint, test, security scan, migrate-validate, build,
      deploy, health-check, auto-rollback on failure.
- [ ] Terraform for PG, Redis, storage, Cloud Run.

### B12. Testing
- [ ] Unit tests per Go package.
- [ ] Integration tests against a real PostgreSQL + Redis.
- [ ] Contract tests reusing the TS backend's pinned response shapes.
- [ ] Security tests (authz, injection, rate-limit, secret exposure).
- [ ] Performance tests (p50/p95/p99 for hot endpoints).
- [ ] E2E tests driving the live Next.js frontend against the Go backend.

---

## C. Frontend compatibility (never regress)

- [ ] After every backend change, browser-verify the live `/` page:
      `agent-browser open http://localhost:3000/` → title, body length,
      Live-badge count must not drop.
- [ ] After every module cutover, the 38 product cards that use
      `useBackendData` must still resolve (or gracefully fall back to Demo).
- [ ] No route, effect, component, or platform product may disappear.

---

## D. Documentation (companion reports)

These companion reports are referenced by the architecture doc and should be
expanded as the Go target is implemented:

- `ROYCSS_DATABASE_ARCHITECTURE.md` — PostgreSQL schema design (use
  `database/sql/*.sql` as the source).
- `ROYCSS_API_SPECIFICATION.md` — full `/api/v1` surface (generate from
  OpenAPI once B4 lands).
- `ROYCSS_SECURITY_REPORT.md` — authn, authz, rate-limit, secrets, audit.
- `ROYCSS_PERFORMANCE_REPORT.md` — p50/p95/p99 baselines (capture after B10).
- `ROYCSS_OBSERVABILITY.md` — logs, metrics, traces, health endpoints.
- `ROYCSS_DEPLOYMENT.md` — Docker, Cloud Run, CI/CD, rollback (use B11).
- `ROYCSS_TEST_REPORT.md` — test plan + results (capture after B12).

---

## E. Current acceptance snapshot

| Criterion | Sandbox status |
|---|---|
| Next.js `/` page renders | ✅ VLM-verified |
| Express backend running | ✅ :4000, 68 modules, /api/v1 |
| Database connected | ✅ SQLite, 45 models, schema in sync |
| Effects loaded | ✅ 1,749 |
| Search index populated | ✅ 1,749 rows |
| Health endpoints | ✅ /api/health + /api/v1/health |
| Registry module | ✅ npm-backed, LRU-cached |
| Auth routes | ✅ signup/login/refresh/me |
| Go backend | ⛔ scaffold only (no Go toolchain) |
| PostgreSQL | ⛔ 14 migrations present (no PG) |
| Redis | ⛔ target only (no Redis) |
| Workers | ⛔ in-process today (Go worker binary is B5) |
| OpenAPI | ⛔ inline (generator is A4 / B6) |
