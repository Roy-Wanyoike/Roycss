# Backend Performance Audit Report

**Audit Date:** 2025 — backend on port `4000` (Express + Prisma + SQLite)
**Scope:** `backend/src/modules/**/service.ts`, `backend/prisma/schema.prisma`, runtime endpoint latency
**Method:** Static grep analysis + live `curl` probes against `http://localhost:4000/api/v1/*`

---

## 1. Response Times (live probes)

All probes measured with `curl --max-time 8 -w "%{time_total}"` against the running
backend. The backend has in-memory LRU caching (TTL: 1–30 min depending on module)
fronting every read endpoint, so warm cache hits return in ~1–2 ms.

| Endpoint                          | HTTP | Latency (ms) |
| --------------------------------- | ---- | ------------ |
| `GET /api/v1/health`              | 200  | **2**        |
| `GET /api/v1/effects`             | 200  | **2**        |
| `GET /api/v1/effects?limit=5`     | 200  | **2**        |
| `GET /api/v1/academy/paths`       | 200  | **1**        |
| `GET /api/v1/blocks`              | 200  | **1**        |
| `GET /api/v1/themes`              | 200  | **1**        |
| `GET /api/v1/analytics/overview`  | 200  | **1**        |

**Verdict:** ✅ All public read endpoints respond in ≤ 2 ms (cache-warm).
The `health` endpoint is mounted **before** the global rate limiter, so it is
never throttled — important for orchestrator probes.

---

## 2. N+1 Query Check

Methodology: ripgrep for `for … { … await db\.<method>(` (multi-line) across
every `service.ts` under `backend/src/modules/`.

| Pattern matched                         | File:line                              | Severity | Note                                                                                   |
| --------------------------------------- | -------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `for (i … BATCH) { await db.searchIndex.createMany }` | `search/service.ts:58–70`              | ✅ Safe  | Batched `createMany` inserts (NOT a per-row query).                                   |
| `for (issue of SEED_ISSUES) { in-memory only }`      | `audit-center/service.ts:271–285`     | ✅ Safe  | Pure JS grouping; the only DB write is a single `createMany` after the loop.          |
| `for (r of rows) { in-memory only }`                 | `workspace/service.ts:311–323`         | ✅ Safe  | Pure JS `Map` grouping; no DB I/O inside the loop.                                     |
| `for (id of ids) { completedSet.add(id) }`            | `academy/service.ts:161–165`           | ✅ Safe  | In-memory `Set` build; the parent query already selected all rows in one shot.         |

**Verdict:** ✅ No N+1 patterns found. Every `for` + `await db.*` pairing is
either a batched `createMany`, an in-memory grouping, or a `Set` population.
All list endpoints read their rows in a single `findMany` and then transform
in JS.

---

## 3. Pagination Coverage

Methodology: ripgrep `findMany\(` vs `take:` across every module.

| Metric                         | Count |
| ------------------------------ | ----- |
| Total `findMany` calls         | **41**|
| Total `take:` clauses          | **2** |

### Endpoints that paginate (`take` / `skip` at the SQL layer)

| Module  | Endpoint                | Mechanism |
| ------- | ----------------------- | --------- |
| search  | `POST /search`          | `take: limit` (`search/service.ts:139`) |
| search  | `GET /search/suggestions` | `take: 10` (`search/service.ts:204`) |

### Endpoints that paginate in-memory (after `findMany`)

| Module   | Endpoint           | Mechanism |
| -------- | ------------------ | --------- |
| effects  | `GET /effects`     | `paginate()` helper slices array (`effects/service.ts:252–268`) — uses `PAGINATION.maxLimit = 200` ceiling. |

### Endpoints that DO NOT paginate (return all rows)

Most of the platform-surface modules (`academy/paths`, `blocks`, `themes`,
`marketplace/templates`, `enterprise/organizations`, `open/issues`,
`governance/policies`, `compliance/standards`, `fleet/projects`, etc.) call
`findMany` without `take` and return the full row set.

**Risk assessment:** Low today — every one of these tables is seeded with
≤ 30 demo rows, so `findMany` returns 1–30 rows per call. As the dataset
grows in production, these endpoints will start returning 100+ rows per call
and should add `take`/`skip` pagination.

**Verdict:** ⚠️ Acceptable for demo scale. The only module that currently
enforces SQL-level pagination is `search`. The `effects` module paginates
in-memory after a single `findMany` (because effects are loaded from a
static JSON file, not the DB — so the in-memory approach is correct there).

---

## 4. Large Response Payload Check

Methodology: ripgrep for `select: {` in every `service.ts` to identify
queries that project a subset of columns.

| File:line                              | Projection                                  |
| -------------------------------------- | ------------------------------------------- |
| `auth/service.ts:49`                   | `select: { id: true }` (existence check)    |
| `auth/service.ts:65`                   | `select: { id, email, name, createdAt }`    |
| `auth/service.ts:86`                   | `select: { id, email, name, passwordHash }` (login) |
| `auth/service.ts:131`                  | `select: { id, email, name, createdAt }`    |
| `auth/service.ts:152`                  | `select: { id, email, name, createdAt }`    |
| `contact/service.ts:32`                | `select: { id: true }` (existence check)    |
| `search/service.ts:203`                | `select: { title: true }` (suggestions)     |

Most other `findMany` calls return full rows (no `select`). This is fine
because every table is small (seeded demo data), and the JSON columns
(e.g. `summaryJson`, `violationsJson`) are required by the API response.

**Verdict:** ⚠️ Acceptable for demo scale. Add `select` projections when
migrating to production with larger tables that have many columns.

---

## 5. Caching

Every read endpoint goes through `cacheWrap(key, fn, TTL)` — an LRU cache
(`backend/src/lib/cache.ts`, max 1000 entries). TTLs are defined per-
endpoint in `backend/src/config/constants.ts` (lines 42–240):

- **1 min** — `cloudStatus`, `fleetHealth`, `cdnStats`, `osActivity`, `observatorySites`, `observatoryAlerts`, `syncStatus`, `versionCurrent`, `versionLatest`, `liveSession*`
- **5 min** — `effectsList`, `recipesList`, `patternsList`, `pathsList`, `templatesList`, `analytics`, `enterpriseOrganizations`, `auditProjects`, `fleetProjects`, `deployHistory`, `previewList`, `storageFiles`, `storageUsage`, `edgePerformance`, `mentorProgress`, `challengeLeaderboard`, `searchQuery`, `searchRecent`, `complianceResults`, `governanceApprovals`, `governanceAuditLog`, `profilerResults`, `twinSimulations`, `bundleResultDetail`, `designerResult`, `reviewResult`, `reviewHistory`, `pairHistory`, `refactorResult`, `architectResult`, `versionBreakingChanges`, `openRfcs`, `openRfcDetail`, `spotlightItems`, `spotlightFeatured`, `liveSession*`
- **10 min** — `effectDetail`, `recipeDetail`, `patternDetail`, `themesList`, `themeDetail`, `iconsList`, `iconDetail`, `motionEffects`, `inspectorClasses`, `studioTemplates`, `proComponents`, `mcpTools`, `challengesList`, `certificationsList`, `a11yRules`, `reviewRules`, `refactorFrameworks`, `pairSuggestions`, `designerPresets`, `scaffoldTypes`, `generatorTypes`, `versionChangelog`, `registryPackages`, `governancePolicies`, `profilerMetrics`, `bundleDuplicates`, `bundleDeadCss`, `pluginsList`
- **30 min** — `openRoadmap`, `openContributors`, `spotlightWeekly`, `benchmarkComparisons`, `blockCategories`, `blueprintsList`, `blueprintIndustries`, `blueprintArchitecture`, `pluginCategories`, `osProducts`, `osQuickActions`, `colorSpacePresets`, `styleQueryPresets`, `scopePresets`, `subgridPresets`, `fallbackProperties`, `logicalMapping`, `logicalPresets`, `initialLetterPresets`, `textWrapPresets`, `propertyRegistrarSyntaxes`, `propertyRegistrarPresets`, `relativeColorChannels`, `relativeColorPresets`, `startingStylePresets`, `lightDarkPresets`

**Verdict:** ✅ Excellent. Caching is the primary reason every endpoint
returns in 1–2 ms.

---

## 6. Database Schema Health

| Metric                              | Count |
| ----------------------------------- | ----- |
| Models (`model …`)                  | **45**|
| `@@index` declarations              | **41**|
| `@@unique` declarations             | **5** |
| `@relation` (field-level FK)        | **2** |

### Index coverage — ✅ Good

41 `@@index` declarations across 45 models. Hot paths covered:

- `User(email)` — login lookup
- `ContactMessage(email)`, `ContactMessage(createdAt)` — admin inbox queries
- `EffectFavorite(userId, effectId)` unique constraint + individual indexes
- `PathProgress(userId, pathId)` unique constraint + individual indexes
- `ChallengeSubmission(userId, challengeId)` + `(challengeId)`
- `TemplateReview(templateId, userId)` unique + `TemplateReview(templateId)`
- `EnterpriseAuditLog(orgId, createdAt)` — chronological audit pagination
- `LiveMessage(sessionId, createdAt)` — chat history window queries
- `GovernanceApproval(policyId, userId)`
- `Template(category)`, `Block(category)`, `Blueprint(category)`, `SpotlightItem(type)`, `SearchIndex(type)` — category filters

### Unique constraints — ✅ Adequate

5 `@@unique` declarations:

- `User.email` (single-column `@unique`)
- `EffectFavorite(userId, effectId)`
- `PathProgress(userId, pathId)`
- `Team(orgId, slug)`
- `TemplateReview(templateId, userId)`
- `OSDashboard(userId)`

### Referential integrity — ⚠️ Limited

Only **2** field-level `@relation` directives in the entire schema (both on
`User` — `EffectFavorite.user` and `Collection.user`). Every other "FK-like"
column (`userId String`, `projectId String`, `templateId String`, `orgId String`,
etc.) is a **plain `String` column with no foreign-key constraint**.

This means:

- ✅ No Prisma migration friction when seeding in any order
- ✅ No cascade-delete errors when deleting parent rows out of order
- ⚠️ No referential integrity at the DB level — orphan rows can accumulate
- ⚠️ Cannot use Prisma's nested `include`/`select` for relations (e.g. cannot
  auto-join `Template → TemplateReview` in one query; must fetch separately
  and join in JS)
- ⚠️ Cannot rely on `onDelete: Cascade` for cleanup — must delete children
  explicitly

**Verdict:** ⚠️ This is acceptable for the demo/seeded nature of the platform
but is the single biggest schema-debt finding. Production hardening would
benefit from adding explicit `@relation` directives and enforcing FK
constraints, or migrating to Postgres with proper FK constraints.

---

## 7. Connection Pooling

- **Provider:** SQLite (file-based, no network hop)
- **`DATABASE_URL`:** `file:./prisma/dev.db` (SQLite file path, not a
  connection string with pool parameters)
- **Pooling:** Prisma's SQLite driver uses a single connection per process
  by default (no `connection_limit` / `pool` settings applicable to SQLite)
- **WAL mode:** Default (not explicitly set)

**Verdict:** ✅ N/A for SQLite. When migrating to Postgres/MySQL, set
`?connection_limit=10&pool_timeout=10` on `DATABASE_URL` and use PgBouncer
in front.

---

## 8. Recommendations

### High priority

1. **Add SQL-level pagination to high-growth endpoints.** Today only `search`
   uses `take`/`skip`. As the dataset grows, add `take` + `skip` (or cursor
   pagination) to: `enterprise/audit-log`, `live/messages`, `audit-center/
   issues`, `open/issues`, `compliance/scans`, `governance/approvals`.
2. **Add `@relation` directives** for the 10 most important FK-style columns
   (`AuditResult.projectId`, `Deployment.projectId`, `TemplateReview.templateId`,
   `LiveMessage.sessionId`, `ChallengeSubmission.challengeId`, etc.) so
   Prisma can use `include`/`select` for nested reads and the DB enforces
   referential integrity.
3. **Add `select` projections** to `findMany` calls in modules that have
   wide tables (e.g. `EnterpriseAuditLog`, `LiveMessage`, `AuditResult` —
   these have JSON blobs that can be large).

### Medium priority

4. **Add `@@index` on `createdAt`** to tables that are likely to be queried
   chronologically in production: `AuditResult`, `Deployment`, `CloudProject`,
   `StudioProject`, `PreviewBranch`. Currently only `ContactMessage`,
   `EnterpriseAuditLog`, and `LiveMessage` have `createdAt` indexed.
5. **Set SQLite WAL mode** explicitly via a `prisma/migrations` seed script
   or `PRAGMA journal_mode = WAL` — improves concurrency for read-heavy
   workloads.
6. **Add `cursor` pagination** to chat endpoints (`live/messages`) instead
   of returning all messages — messages accumulate fast in a real session.

### Low priority

7. **Replace in-memory rate limiter** with a Redis-backed one before scaling
   to multi-instance production (see comment at
   `backend/src/server/middleware/rateLimit.ts:11`).
8. **Add `compression` middleware** (gzip) for responses > 1 KB — Express
   does not compress by default. Most JSON responses here are small (< 2 KB)
   so the gain is minor today.
9. **Add `etag` headers** for cacheable GET responses — Express has built-in
   `etag` support; ensure it's not disabled.

---

## 9. Summary

| Area              | Rating | Notes                                                |
| ----------------- | ------ | ---------------------------------------------------- |
| Response latency  | ✅ A+  | 1–2 ms cache-warm across all public read endpoints   |
| N+1 queries       | ✅ A+  | Zero N+1 patterns; all reads are single `findMany`   |
| Pagination        | ⚠️ B-  | Only `search` uses SQL pagination; rest rely on small table sizes |
| Payload size      | ⚠️ B   | `select` projections used in `auth` + `contact`; most other modules return full rows |
| Caching           | ✅ A+  | LRU (1000 entries) + per-endpoint TTLs (1–30 min)    |
| Schema health     | ⚠️ B-  | 45 models, 41 indexes, 5 uniques, **only 2 relations** |
| Connection pool   | ✅ N/A | SQLite (single connection per process)               |

**Overall backend performance grade: A-** — Excellent for demo scale,
with clear upgrade paths documented for production growth.
