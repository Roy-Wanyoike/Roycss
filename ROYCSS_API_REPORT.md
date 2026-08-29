# RoyCSS — API Report

> **Audit ID**: AUDIT-1
> **Date**: 2026-08-29
> **Source of truth**: `backend/src/server/app.ts` (68 route mounts) + `backend/src/modules/<name>/routes.ts` (one Router per module)
> **Base URL**: `https://roycss.space-z.ai` (production) — relative paths only via the Caddy gateway
> **API prefix**: `/api/v1`
> **Gateway routing**: client uses `fetch("/api/v1/<module>?XTransformPort=4000")` — never `fetch("http://localhost:4000/...")`
> **Total endpoints**: ~270 across 68 modules

---

## 1. Conventions

### Request / response shape

All API responses use the standard envelope:

```json
{
  "data": <T | T[]>,
  "meta": { "count": number, "page"?: number, "limit"?: number, "total"?: number, "totalPages"?: number }
}
```

For paginated endpoints, `meta` includes `page`, `limit`, `total`, `totalPages`.

### Error responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_ERROR",
    "message": "string",
    "details": [{ "target": "body"|"query"|"params", "path": "field", "message": "string", "code": "zod_error_code" }]
  }
}
```

| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod schema rejection (body/query/params) |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 404 | `NOT_FOUND` | Resource not found or route not matched |
| 429 | `RATE_LIMITED` | Rate limit exceeded (`retry-after` header set) |
| 500 | `INTERNAL_ERROR` | Uncaught exception (stack trace logged in dev) |

### Auth

- **Public endpoints**: all `GET` endpoints, `POST /api/v1/contact`, `POST /api/v1/auth/{register,login,refresh}`
- **Authenticated endpoints**: `GET /api/v1/auth/me` (only one currently — `requireAuth` middleware exists but is only applied to one route)
- **Header**: `Authorization: Bearer <accessToken>`
- **Refresh**: `POST /api/v1/auth/refresh` with body `{ "refreshToken": "..." }` returns a new access + refresh pair

### Rate limits

| Tier | Limit | Window | Applied to |
|---|---|---|---|
| General | 100 req/min/IP | 60s | All endpoints except `/api/v1/health` |
| Auth | 10 req/min/IP | 60s | `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh` |
| Contact | 5 req/min/IP | 60s | `/api/v1/contact` |

Response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers. On exceed: HTTP 429 with `Retry-After` header.

---

## 2. Module index (68 modules, ~270 endpoints)

Modules listed in mount order from `app.ts`. The `health` module is mounted BEFORE the global rate limiter so it never gets throttled.

| # | Module | Mount path | Endpoints | Status |
|---|---|---|---|---|
| 1 | `health` | `/api/v1/health` | 1 | ✅ Real |
| 2 | `effects` | `/api/v1/effects` | 5 | ✅ Real |
| 3 | `recipes` | `/api/v1/recipes` | 2 | ✅ Real |
| 4 | `patterns` | `/api/v1/patterns` | 2 | ✅ Real |
| 5 | `contact` | `/api/v1/contact` | 1 | ✅ Real |
| 6 | `auth` | `/api/v1/auth` | 4 | ✅ Real |
| 7 | `themes` | `/api/v1/themes` | 5 | 🔶 Mock |
| 8 | `icons` | `/api/v1/icons` | 3 | 🔶 Mock |
| 9 | `academy` | `/api/v1/academy` | 4 | 🔶 Mock |
| 10 | `marketplace` | `/api/v1/marketplace` | 4 | 🔶 Mock |
| 11 | `analytics` | `/api/v1/analytics` | 4 | 🔶 Mock |
| 12 | `cloud` | `/api/v1/cloud` | 7 | 🔶 Mock |
| 13 | `devtools` | `/api/v1/devtools` | 4 | 🔶 Mock |
| 14 | `motion` | `/api/v1/motion` | 4 | 🔶 Mock |
| 15 | `enterprise` | `/api/v1/enterprise` | 6 | 🔶 Mock |
| 16 | `inspector` | `/api/v1/inspector` | 4 | 🔶 Mock |
| 17 | `studio` | `/api/v1/studio` | 6 | 🔶 Mock |
| 18 | `pro-components` | `/api/v1/pro-components` | 4 | 🔶 Mock |
| 19 | `mcp` | `/api/v1/mcp` | 5 | 🔶 Mock |
| 20 | `compliance` | `/api/v1/compliance` | 4 | 🔶 Mock |
| 21 | `audit-center` | `/api/v1/audit-center` | 4 | 🔶 Mock |
| 22 | `fleet` | `/api/v1/fleet` | 4 | 🔶 Mock |
| 23 | `workspace` | `/api/v1/workspace` | 4 | 🔶 Mock |
| 24 | `deploy` | `/api/v1/deploy` | 5 | 🔶 Mock |
| 25 | `preview` | `/api/v1/preview` | 4 | 🔶 Mock |
| 26 | `cdn` | `/api/v1/cdn` | 4 | 🔶 Mock |
| 27 | `storage` | `/api/v1/storage` | 5 | 🔶 Mock |
| 28 | `edge` | `/api/v1/edge` | 4 | 🔶 Mock |
| 29 | `mentor` | `/api/v1/mentor` | 4 | 🔶 Mock |
| 30 | `challenges` | `/api/v1/challenges` | 4 | 🔶 Mock |
| 31 | `certifications` | `/api/v1/certifications` | 4 | 🔶 Mock |
| 32 | `accessibility` | `/api/v1/accessibility` | 4 | ⚠️ Half (real contrast-ratio; mock audits) |
| 33 | `architect` | `/api/v1/architect` | 4 | 🔶 Mock |
| 34 | `review` | `/api/v1/review` | 4 | 🔶 Mock |
| 35 | `refactor` | `/api/v1/refactor` | 4 | 🔶 Mock |
| 36 | `pair` | `/api/v1/pair` | 3 | 🔶 Mock |
| 37 | `designer` | `/api/v1/designer` | 3 | 🔶 Mock |
| 38 | `scaffold` | `/api/v1/scaffold` | 4 | 🔶 Mock |
| 39 | `generator` | `/api/v1/generator` | 3 | 🔶 Mock |
| 40 | `sync` | `/api/v1/sync` | 5 | 🔶 Mock |
| 41 | `version` | `/api/v1/version` | 5 | 🔶 Mock |
| 42 | `registry` | `/api/v1/registry` | 4 | 🔶 Mock |
| 43 | `governance` | `/api/v1/governance` | 5 | 🔶 Mock |
| 44 | `open` | `/api/v1/open` | 7 | 🔶 Mock |
| 45 | `spotlight` | `/api/v1/spotlight` | 5 | 🔶 Mock |
| 46 | `profiler` | `/api/v1/profiler` | 4 | 🔶 Mock |
| 47 | `bundle` | `/api/v1/bundle` | 4 | 🔶 Mock |
| 48 | `observatory` | `/api/v1/observatory` | 4 | 🔶 Mock |
| 49 | `os` | `/api/v1/os` | 4 | 🔶 Mock |
| 50 | `digital-twin` | `/api/v1/digital-twin` | 3 | 🔶 Mock |
| 51 | `live` | `/api/v1/live` | 5 | 🔶 Mock (in-memory via socket.io) |
| 52 | `benchmark` | `/api/v1/benchmark` | 3 | 🔶 Mock |
| 53 | `blocks` | `/api/v1/blocks` | 4 | 🔶 Mock |
| 54 | `blueprints` | `/api/v1/blueprints` | 4 | 🔶 Mock |
| 55 | `plugin-hub` | `/api/v1/plugins` | 5 | 🔶 Mock (module folder is `plugin-hub`, mounted as `/plugins`) |
| 56 | `search` | `/api/v1/search` | 4 | 🔶 Mock |
| 57 | `color-space` | `/api/v1/color-space` | 3 | 🔶 Mock |
| 58 | `style-query` | `/api/v1/style-query` | 2 | 🔶 Mock |
| 59 | `scope` | `/api/v1/scope` | 2 | 🔶 Mock |
| 60 | `subgrid` | `/api/v1/subgrid` | 2 | 🔶 Mock |
| 61 | `fallback` | `/api/v1/fallback` | 3 | 🔶 Mock |
| 62 | `logical-properties` | `/api/v1/logical-properties` | 3 | 🔶 Mock |
| 63 | `initial-letter` | `/api/v1/initial-letter` | 2 | 🔶 Mock |
| 64 | `text-wrap` | `/api/v1/text-wrap` | 2 | 🔶 Mock |
| 65 | `property-registrar` | `/api/v1/property-registrar` | 3 | 🔶 Mock |
| 66 | `relative-color` | `/api/v1/relative-color` | 3 | 🔶 Mock |
| 67 | `starting-style` | `/api/v1/starting-style` | 2 | 🔶 Mock |
| 68 | `light-dark` | `/api/v1/light-dark` | 2 | 🔶 Mock |

**Status legend**: ✅ Real (backed by Prisma or real data file) · ⚠️ Half (some endpoints real, some mock) · 🔶 Mock (returns hardcoded `SEED_*` arrays; route layer + Zod still production-ready)

---

## 3. Endpoint catalog (per module)

Each subsection lists every endpoint registered in the module's `routes.ts`. Descriptions are derived from the JSDoc header in each `routes.ts` file.

### 1. health — `/api/v1/health`

> Service status (uptime, version, DB connection). Mounted BEFORE the global rate limiter so it can always be polled.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Server status, uptime, version, and DB connection status |

### 2. effects — `/api/v1/effects`

> The 1,749-effect catalog. Reads `dist/effects.json` at boot.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/effects` | List + filter + paginate. Query: `category`, `tag`, `previewType`, `page`, `limit`, `sort` |
| `GET` | `/api/v1/effects/search?q=...` | Full-text search across id/name/description/tags |
| `GET` | `/api/v1/effects/categories` | Distinct categories with counts |
| `GET` | `/api/v1/effects/tags` | Distinct tags with counts |
| `GET` | `/api/v1/effects/:id` | Single effect by id |

### 3. recipes — `/api/v1/recipes`

> RoyCSS recipes (200+). Reads from `src/lib/roycss-recipes.ts`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/recipes` | List + filter (category, difficulty, tag) + paginate |
| `GET` | `/api/v1/recipes/:id` | Single recipe by id |

### 4. patterns — `/api/v1/patterns`

> RoyCSS patterns (80+). Reads from `src/lib/roycss-patterns.ts`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/patterns` | List + filter (category, tag) + paginate |
| `GET` | `/api/v1/patterns/:id` | Single pattern by id |

### 5. contact — `/api/v1/contact`

> Contact form. Persists to Prisma `ContactMessage`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/contact` | Submit a contact message (body: `{ name, email, subject, message }`) |

### 6. auth — `/api/v1/auth`

> JWT auth (bcrypt + jsonwebtoken). Rate-limited to 10/min/IP.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create a new account. Body: `{ name?, email, password }` → `{ user, accessToken, refreshToken, expiresIn }` |
| `POST` | `/api/v1/auth/login` | Email + password → `{ user, accessToken, refreshToken, expiresIn }` |
| `POST` | `/api/v1/auth/refresh` | Refresh token → new `{ user, accessToken, refreshToken, expiresIn }` pair |
| `GET` | `/api/v1/auth/me` | Current user (requires `Authorization: Bearer <accessToken>`) |

### 7. themes — `/api/v1/themes`

> Theme presets. Has Prisma `Theme` model — service currently returns SEED data.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/themes` | List all themes |
| `POST` | `/api/v1/themes` | Create a new theme |
| `GET` | `/api/v1/themes/:id` | Single theme by id |
| `PUT` | `/api/v1/themes/:id` | Update a theme |
| `DELETE` | `/api/v1/themes/:id` | Delete a theme |

### 8. icons — `/api/v1/icons`

> Curated icon pack (480 icons). Static.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/icons` | List with optional `?category=` and `?search=` filters |
| `GET` | `/api/v1/icons/categories` | Distinct categories with counts |
| `GET` | `/api/v1/icons/:name` | Single icon by name |

### 9. academy — `/api/v1/academy`

> Learning paths. Has Prisma `LearningPath` + `PathProgress` models.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/academy/paths` | List learning paths (summaries) |
| `GET` | `/api/v1/academy/paths/:id` | Single path with full lesson list |
| `GET` | `/api/v1/academy/paths/:id/lessons` | Lessons for a path |
| `POST` | `/api/v1/academy/paths/:id/progress` | Mark lesson progress |

### 10. marketplace — `/api/v1/marketplace`

> Community templates. Has Prisma `Template` + `TemplateReview` models.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/marketplace/templates` | List with `?q=`, `?category=`, `?rating=`, `?free=` filters |
| `GET` | `/api/v1/marketplace/templates/:id` | Single template by id |
| `POST` | `/api/v1/marketplace/templates` | Publish a new template |
| `GET` | `/api/v1/marketplace/templates/:id/reviews` | Reviews for a template |

### 11. analytics — `/api/v1/analytics`

> Usage analytics dashboard.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/analytics/overview` | Top-line KPIs (totalUsers, activeEffects, apiCalls, avgResponseTime) |
| `GET` | `/api/v1/analytics/effects` | Top 10 effects by usage |
| `GET` | `/api/v1/analytics/traffic` | Traffic time-series |
| `GET` | `/api/v1/analytics/devices` | Device breakdown |

### 12. cloud — `/api/v1/cloud`

> Cloud project management. Has Prisma `CloudProject` + `Deployment` models.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/cloud/status` | Cloud service status |
| `GET` | `/api/v1/cloud/projects` | User's cloud projects |
| `POST` | `/api/v1/cloud/projects` | Create a new cloud project |
| `GET` | `/api/v1/cloud/projects/:id` | Single project by id |
| `DELETE` | `/api/v1/cloud/projects/:id` | Delete a cloud project |
| `GET` | `/api/v1/cloud/storage` | Storage usage summary |
| `GET` | `/api/v1/cloud/deployments` | Deployment history |

### 13. devtools — `/api/v1/devtools`

> Inspector-style tools for analyzing external sites. Needs Playwright.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/devtools/inspect` | Inspect a URL (`?url=...`) → CSS classes found |
| `GET` | `/api/v1/devtools/tokens` | Design token catalog |
| `GET` | `/api/v1/devtools/utilities` | RoyCSS utility class catalog |
| `POST` | `/api/v1/devtools/analyze` | Run a deep analysis on a URL |

### 14. motion — `/api/v1/motion`

> Motion presets (60 presets).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/motion/effects` | List all motion effects |
| `GET` | `/api/v1/motion/effects/:id` | Single motion effect |
| `GET` | `/api/v1/motion/presets` | Motion preset catalog |
| `GET` | `/api/v1/motion/categories` | Motion categories |

### 15. enterprise — `/api/v1/enterprise`

> Org / team / license management. Has Prisma `Organization`, `Team`, `License`, `EnterpriseAuditLog` models.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/enterprise/organizations` | List all organizations |
| `POST` | `/api/v1/enterprise/organizations` | Create a new organization |
| `GET` | `/api/v1/enterprise/organizations/:id` | Single organization |
| `GET` | `/api/v1/enterprise/teams` | List teams across organizations |
| `GET` | `/api/v1/enterprise/licenses` | List license keys |
| `GET` | `/api/v1/enterprise/audit-log` | Enterprise audit log |

### 16. inspector — `/api/v1/inspector`

> RoyCSS class inspector. Reads `dist/class-index.json`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/inspector/classes` | List all RoyCSS classes (`roycss-*`) |
| `GET` | `/api/v1/inspector/classes/:name` | Single class details |
| `GET` | `/api/v1/inspector/effects` | List all effects |
| `POST` | `/api/v1/inspector/scan` | Scan a DOM tree for RoyCSS class usage |

### 17. studio — `/api/v1/studio`

> Visual builder projects. Has Prisma `StudioProject` model (with JSON column).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/studio/projects` | User's visual-builder projects |
| `POST` | `/api/v1/studio/projects` | Create a new project |
| `GET` | `/api/v1/studio/projects/:id` | Single project |
| `PUT` | `/api/v1/studio/projects/:id` | Update a project |
| `DELETE` | `/api/v1/studio/projects/:id` | Delete a project |
| `GET` | `/api/v1/studio/templates` | Studio template catalog |

### 18. pro-components — `/api/v1/pro-components`

> Pro components catalog. Reads `dist/pro-components.json`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/pro-components` | List all pro components |
| `GET` | `/api/v1/pro-components/categories` | Component categories with counts |
| `GET` | `/api/v1/pro-components/:id` | Single component by id |
| `GET` | `/api/v1/pro-components/:id/code` | Component code (JSX + CSS) |

### 19. mcp — `/api/v1/mcp`

> Model Context Protocol server bridge.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/mcp/tools` | List all MCP tools |
| `GET` | `/api/v1/mcp/tools/:name` | Single tool details |
| `POST` | `/api/v1/mcp/execute` | Execute a tool |
| `GET` | `/api/v1/mcp/resources` | List MCP resources |
| `GET` | `/api/v1/mcp/prompts` | List MCP prompts |

### 20. compliance — `/api/v1/compliance`

> WCAG / GDPR / SOC2 compliance. Has Prisma `ComplianceStandard` + `ComplianceScan` models.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/compliance/scan` | Run a compliance scan against a URL |
| `GET` | `/api/v1/compliance/standards` | List all compliance standards |
| `GET` | `/api/v1/compliance/results/:id` | Single scan result |
| `GET` | `/api/v1/compliance/reports` | Compliance report history |

### 21. audit-center — `/api/v1/audit-center`

> Central audit center for accessibility + performance. Has Prisma `AuditProject` + `AuditResult` models.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/audit-center/projects` | List all monitored projects |
| `GET` | `/api/v1/audit-center/projects/:id` | Single project with category scores |
| `GET` | `/api/v1/audit-center/issues` | Aggregated issues across projects |
| `GET` | `/api/v1/audit-center/trends` | Trend graphs |

### 22. fleet — `/api/v1/fleet`

> Multi-site fleet management. Has Prisma `FleetProject` model.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/fleet/projects` | List all monitored fleet projects |
| `GET` | `/api/v1/fleet/projects/:id` | Single fleet project |
| `POST` | `/api/v1/fleet/scan` | Trigger a fleet-wide scan |
| `GET` | `/api/v1/fleet/health` | Fleet-wide health summary |

### 23. workspace — `/api/v1/workspace`

> Team workspace with RBAC. Has Prisma `WorkspaceResource` model.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/workspace/resources` | List all resource types (with items) |
| `GET` | `/api/v1/workspace/resources/:type` | Resources of a specific type |
| `GET` | `/api/v1/workspace/team` | List team members |
| `POST` | `/api/v1/workspace/invite` | Invite a user to the workspace |

### 24. deploy — `/api/v1/deploy`

> One-click deploys. Has Prisma `Deployment` model (shared with `cloud`).

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/deploy/create` | Create a new deployment |
| `GET` | `/api/v1/deploy/history` | Deployment history |
| `GET` | `/api/v1/deploy/history/:id` | Single deployment |
| `GET` | `/api/v1/deploy/platforms` | Supported platforms (Vercel, Railway, Fly.io, etc.) |
| `GET` | `/api/v1/deploy/environments` | Environments (dev, staging, prod) |

### 25. preview — `/api/v1/preview`

> Preview branch deployments. Has Prisma `PreviewBranch` model.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/preview/create` | Spin up a new preview branch |
| `GET` | `/api/v1/preview/list` | List all preview branches |
| `GET` | `/api/v1/preview/:id` | Single preview branch |
| `DELETE` | `/api/v1/preview/:id` | Tear down a preview branch |

### 26. cdn — `/api/v1/cdn`

> CDN distribution. Needs Cloudflare/Fastly/CloudFront API.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/cdn/stats` | Top-line CDN metrics (requests, bandwidth, hit rate) |
| `GET` | `/api/v1/cdn/resources` | List CDN-tracked resources |
| `GET` | `/api/v1/cdn/edges` | Edge location list |
| `POST` | `/api/v1/cdn/purge` | Purge the cache for a URL or pattern |

### 27. storage — `/api/v1/storage`

> Object storage. Needs S3/R2/GCS.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/storage/files` | List stored files |
| `GET` | `/api/v1/storage/files/:id` | Single file metadata |
| `POST` | `/api/v1/storage/upload` | Record a new file upload (presigned URL flow) |
| `DELETE` | `/api/v1/storage/files/:id` | Delete a file |
| `GET` | `/api/v1/storage/usage` | Storage usage summary |

### 28. edge — `/api/v1/edge`

> Edge runtime. Needs edge-platform API.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/edge/regions` | List all edge regions |
| `GET` | `/api/v1/edge/config` | Current edge config (TTL, cache strategy) |
| `POST` | `/api/v1/edge/deploy` | Deploy a function to the edge |
| `GET` | `/api/v1/edge/performance` | Edge performance metrics |

### 29. mentor — `/api/v1/mentor`

> AI mentor. Needs LLM API (streaming).

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/mentor/chat` | Send a chat message to the mentor |
| `GET` | `/api/v1/mentor/topics` | List all mentor topics |
| `GET` | `/api/v1/mentor/progress` | User's mentor progress |
| `GET` | `/api/v1/mentor/levels` | Mentor skill levels |

### 30. challenges — `/api/v1/challenges`

> Daily CSS challenges. Has Prisma `Challenge` + `ChallengeSubmission` models.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/challenges` | List all challenges |
| `GET` | `/api/v1/challenges/:id` | Single challenge by id |
| `POST` | `/api/v1/challenges/:id/submit` | Submit a solution |
| `GET` | `/api/v1/challenges/leaderboard` | Global leaderboard |

### 31. certifications — `/api/v1/certifications`

> RoyCSS certifications. Has Prisma `Certification` + `CertificationAttempt` models.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/certifications` | List all certifications |
| `GET` | `/api/v1/certifications/:id` | Single certification by id |
| `POST` | `/api/v1/certifications/:id/exam` | Start an exam attempt |
| `GET` | `/api/v1/certifications/verify/:id` | Verify a certification by verify code |

### 32. accessibility — `/api/v1/accessibility`

> Accessibility suite (WCAG 2.2 AA). Half-real: contrast-ratio is computed; audits are mock (need Playwright).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/accessibility/audit/:url` | Mock audit for the given URL (returns pre-computed violations) |
| `GET` | `/api/v1/accessibility/rules` | WCAG rules catalog |
| `GET` | `/api/v1/accessibility/contrast/:fg/:bg` | **Real** — compute WCAG contrast ratio between two hex colors |
| `POST` | `/api/v1/accessibility/scan` | Run a deep scan (mock — needs Playwright + axe-core) |

### 33. architect — `/api/v1/architect`

> AI page-architecture generator. Needs LLM API.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/architect/generate` | Kick off an architecture generation (mock) |
| `GET` | `/api/v1/architect/templates` | List all architecture templates |
| `GET` | `/api/v1/architect/templates/:id` | Single template |
| `GET` | `/api/v1/architect/results/:id` | Fetch a generation result by id |

### 34. review — `/api/v1/review`

> AI code review. Needs LLM or eslint/stylelint.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/review/code` | Submit code for review (mock) |
| `GET` | `/api/v1/review/results/:id` | Single review result by id |
| `GET` | `/api/v1/review/rules` | Review rules catalog |
| `GET` | `/api/v1/review/history` | Review history |

### 35. refactor — `/api/v1/refactor`

> AI refactor engine. Needs PostCSS / codemod.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/refactor/transform` | Submit code for refactoring |
| `GET` | `/api/v1/refactor/frameworks` | Source frameworks catalog (Tailwind, Bootstrap, Radix) |
| `GET` | `/api/v1/refactor/patterns` | Refactor patterns |
| `GET` | `/api/v1/refactor/results/:id` | Single refactor result |

### 36. pair — `/api/v1/pair`

> AI pair programmer. Needs LLM with tool-calling.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/pair/chat` | Send a message to Roy Pair (mock) |
| `GET` | `/api/v1/pair/history` | List all chat sessions |
| `GET` | `/api/v1/pair/suggestions` | Suggested next prompts |

### 37. designer — `/api/v1/designer`

> AI design token generator. Needs LLM.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/designer/generate` | Kick off a design generation (mock) |
| `GET` | `/api/v1/designer/results/:id` | Single design result by id |
| `GET` | `/api/v1/designer/presets` | Design presets |

### 38. scaffold — `/api/v1/scaffold`

> Project scaffolds. Needs `create-*` template engine.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/scaffold/generate` | Generate a project scaffold (mock) |
| `GET` | `/api/v1/scaffold/types` | List all project types |
| `GET` | `/api/v1/scaffold/types/:id` | Single project type details |
| `GET` | `/api/v1/scaffold/frameworks` | Supported framework list |

### 39. generator — `/api/v1/generator`

> Code generators. Needs Hygen or Plop.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/generator/generate` | Generate code (mock) |
| `GET` | `/api/v1/generator/types` | List all generation types |
| `GET` | `/api/v1/generator/templates/:type` | Templates for a generation type |

### 40. sync — `/api/v1/sync`

> Design → code sync. Needs Figma + GitHub REST.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/sync/status` | List all integration statuses |
| `POST` | `/api/v1/sync/figma` | Pull design tokens from Figma (mock) |
| `POST` | `/api/v1/sync/github` | Sync code to a GitHub repo (mock) |
| `POST` | `/api/v1/sync/tokens` | Apply a token set |
| `GET` | `/api/v1/sync/history` | Sync history |

### 41. version — `/api/v1/version`

> Versioned release explorer.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/version/current` | Get the current platform version |
| `GET` | `/api/v1/version/latest` | Get the latest available version |
| `GET` | `/api/v1/version/changelog` | Full changelog |
| `GET` | `/api/v1/version/breaking-changes` | Breaking changes between versions |
| `POST` | `/api/v1/version/check-upgrade` | Check if an upgrade is available |

### 42. registry — `/api/v1/registry`

> Private npm registry. Needs npm registry or local verdaccio.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/registry/packages` | List all packages |
| `GET` | `/api/v1/registry/packages/:id` | Single package |
| `POST` | `/api/v1/registry/packages` | Publish a new package |
| `GET` | `/api/v1/registry/packages/:id/versions` | Version list for a package |

### 43. governance — `/api/v1/governance`

> Design system governance. Has Prisma `GovernancePolicy` + `GovernanceApproval` models.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/governance/approvals` | List all pending + decided approvals |
| `POST` | `/api/v1/governance/approvals/:id/approve` | Approve a pending approval |
| `POST` | `/api/v1/governance/approvals/:id/reject` | Reject a pending approval |
| `GET` | `/api/v1/governance/policies` | List all policies |
| `GET` | `/api/v1/governance/audit-log` | Governance audit log |

### 44. open — `/api/v1/open`

> Open-source mirror. Has Prisma `GoodFirstIssue`, `RFC`, `Roadmap`, `Contributor` models.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/open/issues` | List all open issues |
| `GET` | `/api/v1/open/issues/:id` | Single issue by id |
| `GET` | `/api/v1/open/rfcs` | List all RFCs |
| `GET` | `/api/v1/open/rfcs/:id` | Single RFC by id |
| `POST` | `/api/v1/open/rfcs/:id/vote` | Vote on an RFC |
| `GET` | `/api/v1/open/roadmap` | Project roadmap |
| `GET` | `/api/v1/open/contributors` | Top contributors |

### 45. spotlight — `/api/v1/spotlight`

> Community spotlight. Has Prisma `SpotlightItem` model.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/spotlight/featured` | List featured spotlight items |
| `GET` | `/api/v1/spotlight/items` | List all spotlight items |
| `GET` | `/api/v1/spotlight/items/:id` | Single spotlight item |
| `POST` | `/api/v1/spotlight/submit` | Submit a new spotlight item |
| `GET` | `/api/v1/spotlight/weekly` | Weekly spotlight digest |

### 46. profiler — `/api/v1/profiler`

> Runtime CSS profiler. Has Prisma `ProfilerResult` model.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/profiler/start` | Start a new profiling session |
| `GET` | `/api/v1/profiler/results/:id` | Fetch a profiling result by id |
| `GET` | `/api/v1/profiler/results` | List all results (recent first) |
| `GET` | `/api/v1/profiler/metrics` | Profiler metric catalog |

### 47. bundle — `/api/v1/bundle`

> Bundle analyzer. Has Prisma `BundleResult` model.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/bundle/analyze` | Analyze a bundle (returns a result id) |
| `GET` | `/api/v1/bundle/results/:id` | Fetch a bundle analysis result |
| `GET` | `/api/v1/bundle/duplicates` | Duplicate selector report |
| `GET` | `/api/v1/bundle/dead-css` | Dead CSS report |

### 48. observatory — `/api/v1/observatory`

> Production CSS observability. Has Prisma `ObservatorySite` model.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/observatory/sites` | List all monitored sites |
| `GET` | `/api/v1/observatory/sites/:id` | Single monitored site by id |
| `GET` | `/api/v1/observatory/alerts` | Active alerts |
| `GET` | `/api/v1/observatory/trends/:id` | Trend graph for a site |

### 49. os — `/api/v1/os`

> RoyOS dashboard. Has Prisma `OSDashboard` model.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/os/dashboard` | The Roy OS dashboard layout |
| `GET` | `/api/v1/os/products` | List all product tiles |
| `GET` | `/api/v1/os/activity` | Recent activity feed |
| `GET` | `/api/v1/os/quick-actions` | Quick-action shortcuts |

### 50. digital-twin — `/api/v1/digital-twin`

> Production frontend digital twin. Has Prisma `TwinResult` model. Needs Lighthouse.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/digital-twin/create` | Create a digital twin simulation |
| `GET` | `/api/v1/digital-twin/results/:id` | Fetch a simulation result by id |
| `GET` | `/api/v1/digital-twin/simulations` | List all simulations |

### 51. live — `/api/v1/live`

> Live collaboration. Has Prisma `LiveSession` + `LiveMessage` models (currently in-memory via socket.io on port 3003).

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/live/sessions` | Create a live collaboration session |
| `GET` | `/api/v1/live/sessions` | List all sessions |
| `GET` | `/api/v1/live/sessions/:id` | Fetch a live session by id |
| `GET` | `/api/v1/live/sessions/:id/users` | List users in a session |
| `POST` | `/api/v1/live/sessions/:id/message` | Send a message in a session |

### 52. benchmark — `/api/v1/benchmark`

> Headless benchmarks. Has Prisma `BenchmarkResult` model.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/benchmark/run` | Run a benchmark suite |
| `GET` | `/api/v1/benchmark/results/:id` | Fetch a benchmark result by id |
| `GET` | `/api/v1/benchmark/comparisons` | Cross-browser / device comparison matrix |

### 53. blocks — `/api/v1/blocks`

> Application blocks marketplace. Has Prisma `Block` model.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/blocks` | List all application blocks |
| `GET` | `/api/v1/blocks/:id` | Single block by id |
| `GET` | `/api/v1/blocks/categories` | Block categories with counts |
| `POST` | `/api/v1/blocks` | Submit a new block |

### 54. blueprints — `/api/v1/blueprints`

> Page-level blueprints. Has Prisma `Blueprint` model.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/blueprints` | List all blueprints |
| `GET` | `/api/v1/blueprints/:id` | Single blueprint by id |
| `GET` | `/api/v1/blueprints/:id/architecture` | Architecture graph for a blueprint |
| `GET` | `/api/v1/blueprints/industries` | Industry filter list |

### 55. plugin-hub — `/api/v1/plugins`

> Plugin hub (VS Code / Figma / browser). Note: module folder is `plugin-hub`, mounted as `/plugins`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/plugins` | List all plugins |
| `GET` | `/api/v1/plugins/:id` | Single plugin by id |
| `POST` | `/api/v1/plugins` | Publish a new plugin |
| `GET` | `/api/v1/plugins/:id/changelog` | Plugin changelog |
| `GET` | `/api/v1/plugins/categories` | Plugin categories |

### 56. search — `/api/v1/search`

> Cross-resource search. Has Prisma `SearchIndex` model (needs Postgres FTS).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/search` | Perform a search query (`?q=neon&limit=20&types=effects`) |
| `POST` | `/api/v1/search` | Perform a search query (body: `{ query, types, limit }`) |
| `GET` | `/api/v1/search/recent` | Recent search queries |
| `GET` | `/api/v1/search/suggestions` | Autocomplete suggestions |

### 57. color-space — `/api/v1/color-space`

> Color space converter (sRGB / Display-P3 / Rec2020 / OKLCH).

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/color-space/convert` | Convert a color between spaces |
| `GET` | `/api/v1/color-space/gamut/:hex` | Check whether a hex color is in sRGB gamut |
| `GET` | `/api/v1/color-space/presets` | Color-space presets |

### 58. style-query — `/api/v1/style-query`

> @container style() query builder.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/style-query/generate` | Build a @container style() query CSS block |
| `GET` | `/api/v1/style-query/presets` | 3 style-query presets |

### 59. scope — `/api/v1/scope`

> @scope rule analyzer.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/scope/analyze` | Analyze a @scope rule against a DOM tree |
| `GET` | `/api/v1/scope/presets` | 4 scope presets |

### 60. subgrid — `/api/v1/subgrid`

> Subgrid CSS generator.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/subgrid/generate` | Generate subgrid CSS from parent + child config |
| `GET` | `/api/v1/subgrid/presets` | 4 subgrid presets |

### 61. fallback — `/api/v1/fallback`

> CSS fallback chains for modern properties.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/fallback/properties` | List all 20 modern properties (summary form) |
| `GET` | `/api/v1/fallback/properties/:id` | Single property's full fallback chain |
| `GET` | `/api/v1/fallback/presets` | Fallback presets |

### 62. logical-properties — `/api/v1/logical-properties`

> Physical → logical properties mapper.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/logical-properties/mapping` | Full physical → logical mapping table (28 entries) |
| `POST` | `/api/v1/logical-properties/convert` | Convert physical CSS to logical |
| `GET` | `/api/v1/logical-properties/presets` | Logical-property presets |

### 63. initial-letter — `/api/v1/initial-letter`

> ::first-letter drop-cap generator.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/initial-letter/generate` | Generate ::first-letter CSS for a drop cap |
| `GET` | `/api/v1/initial-letter/presets` | 6 drop-cap presets |

### 64. text-wrap — `/api/v1/text-wrap`

> text-wrap: balance / pretty analyzer.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/text-wrap/analyze` | Analyze text wrapping for given properties + sample text |
| `GET` | `/api/v1/text-wrap/presets` | 6 text-wrap presets |

### 65. property-registrar — `/api/v1/property-registrar`

> @property (CSS Houdini) generator.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/property-registrar/generate` | Generate a @property rule |
| `GET` | `/api/v1/property-registrar/syntaxes` | List all 11 CSS syntax strings with descriptions |
| `GET` | `/api/v1/property-registrar/presets` | @property presets |

### 66. relative-color — `/api/v1/relative-color`

> relative-color() builder.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/relative-color/derive` | Derive a color from source + output space + calc expressions |
| `GET` | `/api/v1/relative-color/channels` | 14-channel reference table (r,g,b,h,s,l,c,a,b,alpha,w,x,y,z) |
| `GET` | `/api/v1/relative-color/presets` | Relative-color presets |

### 67. starting-style — `/api/v1/starting-style`

> @starting-style transition generator.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/starting-style/generate` | Generate @starting-style CSS (base + hidden + @starting-style) |
| `GET` | `/api/v1/starting-style/presets` | 4 starting-style presets |

### 68. light-dark — `/api/v1/light-dark`

> light-dark() CSS function generator.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/light-dark/generate` | Generate light-dark() CSS from color-scheme + 5 tokens |
| `GET` | `/api/v1/light-dark/presets` | 4 light-dark presets |

---

## 4. Root info endpoint

`GET /api/v1` returns a JSON document listing every endpoint registered in the app (used as a self-documenting API surface for client codegen and the docs site):

```json
{
  "name": "roycss-backend",
  "version": "1.0.0",
  "endpoints": [
    "GET    /api/v1/health",
    "GET    /api/v1/effects",
    "GET    /api/v1/effects/:id",
    ...
  ]
}
```

(See lines 188–506 of `backend/src/server/app.ts` for the full hardcoded list — kept in sync with the actual route mounts.)

---

## 5. Frontend API routes (Next.js 16 — `/api/*`)

The Next.js app exposes 12 API routes that proxy to the backend (or generate content server-side):

| Method | Path | Proxies to / Purpose |
|---|---|---|
| `GET` | `/api/og` | Server-generated 1200×630 PNG OG image |
| `GET` | `/api/health` | Proxies to `GET /api/v1/health?XTransformPort=4000` |
| `POST` | `/api/contact` | Proxies to `POST /api/v1/contact?XTransformPort=4000` |
| `GET` | `/api/effects/manifest` | Returns the full effects JSON (same as `dist/effects.json`) |
| `GET` | `/api/effects/[id]/css` | Single effect's CSS |
| `POST` | `/api/auth/register` | Proxies to `POST /api/v1/auth/register?XTransformPort=4000` |
| `POST` | `/api/auth/login` | Proxies to `POST /api/v1/auth/login?XTransformPort=4000` |
| `POST` | `/api/auth/logout` | Clears the auth cookie (client-side) |
| `POST` | `/api/auth/refresh` | Proxies to `POST /api/v1/auth/refresh?XTransformPort=4000` |
| `GET` | `/api/auth/me` | Proxies to `GET /api/v1/auth/me?XTransformPort=4000` (with Authorization header) |
| `POST` | `/api/ai-migration` | AI migration helper (server-side) |
| `POST` | `/api/ai-playground` | AI playground helper (server-side) |
| `POST` | `/api/css-doctor` | CSS doctor helper (server-side) |

---

## 6. WebSocket events (Socket.io — port 3003)

The `RoyLive` product connects via `io("/?XTransformPort=3003")`. Events:

| Direction | Event | Payload | Notes |
|---|---|---|---|
| Client → Server | `join` | `{ roomId, userId, userName }` | Join a live session |
| Client → Server | `leave` | `{ roomId, userId }` | Leave a session |
| Client → Server | `message` | `{ roomId, userId, content }` | Send a chat message |
| Client → Server | `cursor` | `{ roomId, userId, x, y }` | Broadcast cursor position |
| Server → Client | `state` | `{ roomId, users: [{userId, userName}], messages: [...] }` | Initial state on join |
| Server → Client | `user-joined` | `{ userId, userName }` | A new user joined |
| Server → Client | `user-left` | `{ userId }` | A user left |
| Server → Client | `message` | `{ userId, content, timestamp }` | New message broadcast |
| Server → Client | `cursor` | `{ userId, x, y }` | Cursor broadcast |

State is in-memory (`Map<roomId, Set<userId>>`); production should use a Redis adapter for multi-instance.

---

## 7. Verification

Per AUDIT-3 (worklog entry): **64 / 64 sampled endpoints returned HTTP 200** against the running backend on port 4000. All endpoints are reachable through the Caddy gateway via `XTransformPort=4000`.

Run your own smoke test:

```bash
# Backend (port 4000) — direct
curl -s http://localhost:4000/api/v1/health | jq .

# Backend via Caddy gateway
curl -s "https://roycss.space-z.ai/api/v1/health?XTransformPort=4000" | jq .

# Frontend (port 3000)
curl -s http://localhost:3000/api/health | jq .
```
