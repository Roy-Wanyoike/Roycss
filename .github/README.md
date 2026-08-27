# RoyCSS — CI/CD Documentation

This folder holds the GitHub Actions workflows, Dependabot config, and
deployment automation for the RoyCSS platform.

## Workflows

| File | Trigger | Purpose |
|---|---|---|
| [`workflows/ci.yml`](./workflows/ci.yml) | `push` to `main`, `pull_request` to `main` | Lint, typecheck, unit tests, package build (frontend) + typecheck, Prisma generate, integration tests (backend) |
| [`workflows/deploy.yml`](./workflows/deploy.yml) | After `ci.yml` succeeds on `main` | Frontend → Vercel, Backend → Railway (with `prisma migrate deploy`), then a `/api/v1/health` smoke check |
| [`workflows/release.yml`](./workflows/release.yml) | Tag push matching `v*` | Publish `roycss` package to npm with provenance (sigstore SLSA L3) |

## What CI runs on every PR

Both jobs run in parallel:

### Frontend job (root project)
1. `bun install --frozen-lockfile` — install with the committed lockfile
2. `bun run lint` — ESLint flat-config (`eslint.config.mjs`)
3. `bun run typecheck` — `tsc --noEmit`
4. `bunx vitest run` — 7 unit-test files / 111 tests in `tests/unit/**`
5. `bun run build:package` — build `dist/effects.json` + `dist/roycss.css` + `dist/effects.js`

### Backend job (`backend/`)
1. `bun install --frozen-lockfile`
2. `bun run db:generate` — generate Prisma client from `prisma/schema.prisma`
3. `DATABASE_URL="file:./test.db" bun run db:push --skip-generate` — create the test DB
4. `bun run typecheck` — `tsc --noEmit`
5. `bun run test:integration` — supertest-based integration tests against the Express app

A PR is mergeable only when both jobs pass.

## How to run integration tests locally

The backend integration tests live in [`backend/tests/integration/`](../../backend/tests/integration/).
They boot the Express app via `createApp()` and exercise the HTTP surface
using `supertest` — no port binding, no separate process to manage.

```bash
cd backend

# Run only the integration tests (uses a throwaway SQLite DB at prisma/test.db)
bun run test:integration

# Run all backend tests (currently: integration only — add unit tests under
# tests/unit/ and they'll be picked up too)
bun run test
```

The `test:integration` script sets `DATABASE_URL="file:./test.db"` so the
test DB is isolated from the dev DB (`dev.db`). The setup file
([`setup.ts`](../../backend/tests/integration/setup.ts)) wipes and recreates
the test DB on every run, so the tests are idempotent — you can re-run
them as many times as you like without hitting "user already exists"
errors.

**Required env vars** (the CI workflow sets these; locally they're in
`backend/.env`):
- `DATABASE_URL` — overridden to `file:./test.db` by the script
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — must each be ≥16 characters
- `JWT_EXPIRES_IN` (default `15m`), `JWT_REFRESH_EXPIRES_IN` (default `7d`)

If `JWT_SECRET` is missing, the test run fails fast at module-load time
with a clear "JWT_SECRET must be at least 16 characters" error.

## How to run load tests locally

The k6 load test plan lives in [`tests/load/`](../../tests/load/). It
hits the effects list endpoint at 50 virtual users for 30 seconds and
checks for HTTP 200 + sub-200ms response times.

### Prerequisites
1. The backend must be running locally on port 4000:
   ```bash
   cd backend && bun run dev
   ```
2. Install k6 — pick one option:
   - macOS: `brew install k6`
   - Linux: see https://k6.io/docs/getting-started/installation/
   - Docker: `docker pull grafana/k6:latest` then run via `docker run --rm --network host -i grafana/k6:latest run - < tests/load/effects-api.k6.js`

### Running
```bash
# From the project root:
k6 run tests/load/effects-api.k6.js
```

### What it measures
- `vus: 50` — 50 concurrent virtual users
- `duration: 30s` — ramp-up + steady-state for 30 seconds
- `http_req_duration` — end-to-end response time (p95, p99 reported)
- `http_req_failed` — fraction of non-2xx responses

The baseline target is **p95 < 200ms**. If p95 exceeds that, the
backend's LRU cache (`src/lib/cache.ts`) needs tuning or the effects
list endpoint needs to be paginated more aggressively.

## Required secrets for deployment

The deploy workflow (`.github/workflows/deploy.yml`) needs the following
secrets configured in the repo's **Settings → Secrets and variables →
Actions** page. None of these are needed for CI to run — only for prod
deploys.

| Secret | Where to get it | Used by |
|---|---|---|
| `VERCEL_TOKEN` | https://vercel.com/account/tokens | `vercel pull/build/deploy` |
| `VERCEL_ORG_ID` | `vercel link` locally, then copy from `.vercel/project.json` | `vercel` CLI env |
| `VERCEL_PROJECT_ID` | same as above | `vercel` CLI env |
| `RAILWAY_TOKEN` | https://docs.railway.app/reference/public-api#tokens | `bervProject/railway-deploy` |
| `RAILWAY_SERVICE_ID` | Railway service settings page | `bervProject/railway-deploy` |
| `RAILWAY_ENVIRONMENT` | e.g. `production` (optional, defaults to service's prod env) | `bervProject/railway-deploy` |
| `RAILWAY_SERVICE_DOMAIN` | Railway service settings page (the public URL) | post-deploy health-check curl |
| `DATABASE_URL` | Production Postgres connection string | `prisma migrate deploy` |
| `NPM_TOKEN` | https://www.npmjs.com/settings/USERNAME/tokens (publish automation) | `release.yml` — npm publish |

## Dependabot

Configured in [`dependabot.yml`](./dependabot.yml):

- **Root npm packages** — weekly, patch + minor grouped into one PR
- **Backend npm packages** — weekly, patch + minor grouped into one PR
- **GitHub Actions versions** — monthly (the actions ecosystem moves slowly)

Major version bumps (e.g. Next.js 16 → 17, Prisma 6 → 7) always open
their own PRs so they can be reviewed for breaking changes.

## Conventions

- **All workflows use Bun** — no `npm` or `yarn` anywhere. The CI
  caches the Bun toolchain via `oven-sh/setup-bun@v2`.
- **All test scripts use Vitest** — matches the existing root-level
  unit test setup (`vitest.config.ts`).
- **All HTTP assertions use supertest** — no port binding, no race
  conditions on the test runner.
- **Integration tests use a separate SQLite DB** (`prisma/test.db`)
  — never the dev DB (`dev.db`) — and the setup file wipes it between
  runs.
- **Deploy is gated by CI success** — `workflow_run` with
  `workflows: ["CI"]` + `types: [completed]` ensures a deploy only
  fires after CI goes green on `main`.
