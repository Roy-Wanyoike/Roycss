# RoyCSS Backend Migration Guide

> How to move RoyCSS from the **running TypeScript modular monolith**
> (`backend/src/`, Express + Prisma + SQLite) to the **production Go target**
> (`backend/go/`, Go + PostgreSQL + Redis + Cloud Run) without breaking the
> frontend, losing data, or dropping any of the 68 domain modules.

---

## 0. Read this first

The migration is **module-by-module**, behind a **stable `/api/v1` contract**.
The frontend never changes. The database moves from SQLite to PostgreSQL
with the same relational shape. Redis is added as an acceleration layer, not
a source of truth.

**Golden rule:** at every step, the live `/` page must keep rendering. If a
step breaks the page, revert it and re-plan. The page is the contract.

---

## 1. Pre-migration: stand up the target environment

The Go target requires a host with:

- Go 1.23+
- PostgreSQL 15+
- Redis 7+
- Docker (for container builds)
- `gcloud` CLI (for Cloud Run deploys)

This sandbox has **none** of these. Run the migration on a workstation, a
GCP project, or any host with the toolchain installed.

```bash
# On the target host:
go version           # 1.23+
psql --version       # 15+
redis-cli --version  # 7+
docker --version
```

---

## 2. Git checkpoint

```bash
git checkout -b go-backend-migration
git commit -m "checkpoint: before Go backend migration"
```

Never `git reset --hard` or force-push during this migration. If a step goes
wrong, `git revert` the offending commit.

---

## 3. Provision PostgreSQL and apply migrations

```bash
# Create the database
createdb roycss

# Apply the 14 migration files in order
for f in database/sql/0*.sql; do
  psql roycss -f "$f"
  echo "applied $f"
done

# Run the seed last
psql roycss -f database/sql/999_seed.sql
```

The migration files are idempotent-safe (`CREATE EXTENSION IF NOT EXISTS`,
`CREATE TABLE IF NOT EXISTS`). They create the full relational schema:
extensions, users, organizations, projects, taxonomy, effects, components,
patterns, collections, recipes, design tokens, themes, icons, motion,
playground, favorites, marketplace, billing, usage, AI, API keys, analytics,
notifications, audit logs, search, indexes, seed.

**Verify:**
```bash
psql roycss -c "\dt" | head -40   # ~30 tables
psql roycss -c "SELECT count(*) FROM effects;"  # 1749 after seed
```

---

## 4. Migrate data from SQLite to PostgreSQL

The Prisma models (`backend/prisma/schema.prisma`, 45 models) and the SQL
migrations (`database/sql/`, 14 files) are kept conceptually in sync. The
data move is a row-by-row copy, not a transform.

```bash
# Export each SQLite table to CSV, then import into PostgreSQL.
# Example for effects:
sqlite3 db/custom.db ".mode csv" ".headers on" ".output effects.csv" "SELECT * FROM effects;"
psql roycss -c "\COPY effects FROM 'effects.csv' WITH (FORMAT csv, HEADER true);"
```

Repeat for each table that has production data worth keeping (users,
collections, projects, marketplace listings, etc.). Effects/components/
patterns/themes/tokens can also just be re-seeded from `dist/effects.json`
via `999_seed.sql`.

**Verify:**
```bash
psql roycss -c "SELECT count(*) FROM users;"
psql roycss -c "SELECT count(*) FROM effects;"   # 1749
```

---

## 5. Implement Go modules in dependency order

The 68 TS modules map 1:1 to Go packages. Implement them in this order so each
layer has its dependencies ready:

### Phase 1 — platform (must come first)
```
backend/go/pkg/database/   pgx pool + health
backend/go/pkg/redis/      go-redis client + health
backend/go/pkg/logger/     structured logging
backend/go/pkg/http/       chi router, JSON envelope, middleware
backend/go/pkg/validation/ request validation
backend/go/pkg/telemetry/  OpenTelemetry setup
```

### Phase 2 — identity
```
internal/auth         signup, login, refresh, me (JWT, bcrypt)
internal/users        profile, settings
internal/organizations  org CRUD, membership
internal/teams        team CRUD
```

### Phase 3 — registry (keystone)
```
internal/registry/effects      canonical effects source
internal/registry/components
internal/registry/patterns
internal/registry/collections
internal/registry/recipes
internal/registry/themes
internal/registry/tokens
internal/registry/icons
internal/registry/motion
```

### Phase 4 — products
```
internal/projects, internal/playground, internal/studio
internal/marketplace, internal/creators, internal/licenses, internal/purchases
internal/ai, internal/mcp, internal/cli, internal/inspector, internal/devtools
internal/accessibility, internal/analytics, internal/cloud
internal/billing, internal/subscriptions, internal/usage
internal/search, internal/notifications, internal/audit
```

### Phase 5 — the rest (68 − above)
Implement the remaining modules (academy, benchmark, blocks, blueprints,
bundle, cdn, certifications, challenges, color-space, compliance, contact,
deploy, designer, digital-twin, edge, enterprise, fallback, fleet,
generator, governance, health, initial-letter, light-dark, live,
logical-properties, mentor, observatory, open, os, pair, plugin-hub,
preview, pro-components, profiler, property-registrar, refactor,
relative-color, review, scaffold, scope, spotlight, starting-style,
storage, style-query, subgrid, sync, text-wrap, version, workspace).

### Per-module shape (unchanged from TS)
```
internal/<module>/
  handler.go       HTTP concerns only
  service.go       business logic
  repository.go    persistence (pgx)
  models.go        domain types
  dto.go           request/response shapes
  routes.go        chi sub-router mounted at /api/v1/<module>
  <module>_test.go unit + service tests
```

**Dependency direction (enforced by package boundaries):**
```
handler → service → domain → repository → pgx
```
Never `handler → pgx`, never `handler → redis`, never `handler → AI provider`.

---

## 6. Cutover per module (zero-downtime)

For each module, in order:

1. Implement the Go module with full test coverage.
2. Run the Go backend alongside the TS backend (different ports).
3. Add a feature flag / route weight that sends `<module>` traffic to Go.
4. Compare responses between TS and Go for the same requests (contract test).
5. Flip 100% to Go. Watch error rate.
6. If clean for 24h, remove the TS module's routes (keep the code for one
   release as a rollback).

**Never** remove a TS module until its Go replacement has served real traffic
cleanly for at least 24 hours.

---

## 7. Workers

Once the HTTP API is on Go, extract long-running work into `cmd/worker/`:

```
cmd/worker/main.go
jobs/
  ai/            RoyAI generation jobs
  accessibility/  audit jobs
  analytics/     aggregation jobs
  search/        re-index jobs
  marketplace/   asset processing
  notifications/ email + in-app
  exports/       bundle exports
```

Redis is the job queue. HTTP handlers enqueue (returning a job ID) and
workers dequeue. This moves expensive work off the request path.

---

## 8. Frontend compatibility check

After each module cutover, run the frontend compatibility audit:

```bash
# 1. Start Next.js (port 3000) and Go backend (port 4000)
bun run dev &
cd backend/go && go run ./cmd/api &

# 2. Open the live page
agent-browser open http://localhost:3000/
agent-browser eval "document.title"                      # must be the RoyCSS title
agent-browser eval "document.body.innerHTML.length"      # must be > 700000
agent-browser eval "Array.from(document.querySelectorAll('span')).filter(s=>s.textContent==='Live').length"  # must stay high

# 3. Spot-check each migrated module's API
curl -s http://localhost:4000/api/v1/<module>/... | jq .
```

If any of these regress, the cutover is incomplete — fix before moving to the
next module.

---

## 9. Deploy to Cloud Run

```bash
# Build the container
docker build -t gcr.io/<project>/roycss-api backend/go/

# Push
docker push gcr.io/<project>/roycss-api

# Deploy
gcloud run deploy roycss-api \
  --image gcr.io/<project>/roycss-api \
  --region us-central1 \
  --port 8080 \
  --set-env-vars DATABASE_URL=...,REDIS_URL=...,JWT_SECRET=... \
  --min-instances 1 \
  --max-instances 10 \
  --memory 512Mi

# Verify health
curl https://roycss-api-<hash>.run.app/health
```

Next.js deploys to Vercel independently. The frontend's
`NEXT_PUBLIC_API_URL` (or the Caddy `XTransformPort` gateway in dev) points
to the Cloud Run URL.

---

## 10. Rollback procedure

Every deploy must be reversible:

- **Code rollback:** `git revert <commit>` + redeploy.
- **Data rollback:** never run destructive migrations. Additive only.
  If a migration is bad, write a forward-fix migration, never `DROP TABLE`.
- **Traffic rollback:** flip the route weight back to the TS backend (keep
  it running for one release cycle).

---

## 11. What NOT to do

- ❌ `git reset --hard` or force-push.
- ❌ `DROP TABLE` or `DROP DATABASE`.
- ❌ Delete TS modules before their Go replacements are proven.
- ❌ Change the `/api/v1` contract during migration.
- ❌ Move long-running work into HTTP handlers (use workers).
- ❌ Expose PostgreSQL/Redis directly to the browser.
- ❌ Store secrets in the frontend.
- ❌ Run the Go backend and TS backend on the same port.

---

## 12. Definition of done

The migration is complete when:

- ✅ All 68 modules are implemented in Go and serving `/api/v1`.
- ✅ PostgreSQL is the authoritative database (SQLite retired).
- ✅ Redis handles caching, rate limiting, and job queues.
- ✅ Workers run as a separate `cmd/worker` binary.
- ✅ OpenAPI is generated from the Go routes.
- ✅ OpenTelemetry traces/metrics/logs flow to a managed backend.
- ✅ The live `/` page renders identically (same title, same body length,
  same Live-badge count).
- ✅ No data was lost (row counts match before/after).
- ✅ No existing feature, route, effect, or component was removed.
