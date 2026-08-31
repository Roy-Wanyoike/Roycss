# RoyCSS API Specification

> Companion to `ROYCSS_BACKEND_ARCHITECTURE.md`. The `/api/v1` contract is
> **identical** across the running TypeScript backend and the Go target, so
> the frontend does not change during migration.

---

## 1. Conventions

- **Prefix:** `/api/v1`
- **Envelopes:**
  - List: `{ "data": [...], "meta": { "count": N, "cursor": "..." } }`
  - Single: `{ "data": {...} }`
  - Error: `{ "error": { "code": "...", "message": "...", "details": {...} } }`
- **Pagination:** cursor-based for large collections (`?cursor=&limit=`).
  Default limit 20, max 100. Never returns unlimited records.
- **IDs:** `cuid` (SQLite/Prisma today) / `UUID` (PostgreSQL target).
- **Content type:** `application/json` for all request/response bodies.
- **Auth:** `Authorization: Bearer <jwt>` for protected routes.
  API keys via `X-API-Key` header for CLI/SDK/MCP clients.
- **Validation:** Zod (TS) / validator+struct tags (Go) on every body/param.

---

## 2. Health & system

```
GET  /api/v1/health            → { status, service, version, uptime, checks:{database,memory} }
GET  /api/v1/health/live       → { status: "ok" }            (liveness, target)
GET  /api/v1/health/ready      → { status, checks:{db,redis,registry,search} }  (readiness, target)
GET  /api/v1/openapi.json       → OpenAPI document (TODO A4/B6)
```

---

## 3. Auth & identity

```
POST /api/v1/auth/signup       { email, password, name } → { user, accessToken, refreshToken }
POST /api/v1/auth/login         { email, password }      → { user, accessToken, refreshToken }
POST /api/v1/auth/refresh       { refreshToken }          → { accessToken, refreshToken }
GET  /api/v1/auth/me            (Bearer)                 → { user }
POST /api/v1/auth/logout       (Bearer)                 → 204

# API keys (TODO A3)
POST /api/v1/auth/api-keys     (Bearer) { name, scopes } → { id, key (shown once) }
GET  /api/v1/auth/api-keys      (Bearer)                 → { data: [{ id, name, masked, scopes, createdAt }] }
DELETE /api/v1/auth/api-keys/:id (Bearer)               → 204

GET  /api/v1/users/me           (Bearer)                 → { user }
PATCH /api/v1/users/me         (Bearer) { name }        → { user }

# Organizations & teams (target: full CRUD)
GET  /api/v1/organizations      (Bearer)
POST /api/v1/organizations      (Bearer) { name, slug }
GET  /api/v1/organizations/:id  (Bearer)
PATCH /api/v1/organizations/:id (Bearer)
GET  /api/v1/organizations/:id/teams
POST /api/v1/organizations/:id/teams
```

---

## 4. RoyCSS Registry (canonical source of truth)

```
GET  /api/v1/registry/packages            → { data: [RegistryPackage], meta:{count} }
POST /api/v1/registry/packages            { name, description, ... }  → { data: RegistryPackage }   (NPM_TOKEN required to publish for real)
GET  /api/v1/registry/packages/:id         → { data: RegistryPackage }
GET  /api/v1/registry/packages/:id/versions → { data: [PackageVersion] }
```

Each registry package covers: effects, components, patterns, collections,
recipes, themes, tokens, icons, motion.

---

## 5. Content (consumers of the registry)

```
GET  /api/v1/effects                  ?category=&tag=&cursor=&limit=  → { data:[Effect], meta }
GET  /api/v1/effects/:slug                                             → { data: Effect }
GET  /api/v1/components                                                 → { data:[Component] }
GET  /api/v1/patterns                                                  → { data:[Pattern] }
GET  /api/v1/collections                                                → { data:[Collection] }
GET  /api/v1/recipes                                                   → { data:[Recipe] }
GET  /api/v1/themes                                                    → { data:[Theme] }
GET  /api/v1/tokens                                                    → { data:[Token] }
GET  /api/v1/icons                                                     → { data:[Icon] }
GET  /api/v1/motion                                                    → { data:[Motion] }
```

---

## 6. Projects & studio

```
GET  /api/v1/projects         (Bearer) ?visibility=
POST /api/v1/projects         (Bearer) { name, visibility }
GET  /api/v1/projects/:id     (Bearer)
PATCH /api/v1/projects/:id   (Bearer)
DELETE /api/v1/projects/:id  (Bearer)

GET  /api/v1/playground       (Bearer)        → saved playgrounds
POST /api/v1/playground       (Bearer) { html, css, js }
GET  /api/v1/studio           (Bearer)        → studio projects
POST /api/v1/studio          (Bearer) { name, layout }
```

---

## 7. Marketplace

```
GET  /api/v1/marketplace/products   ?type=&category=&cursor=
GET  /api/v1/marketplace/products/:slug
POST /api/v1/marketplace/products   (Bearer, creator) { name, type, price, license }
GET  /api/v1/marketplace/creators/:id
GET  /api/v1/marketplace/purchases  (Bearer)
POST /api/v1/marketplace/purchases  (Bearer) { productId }  (idempotent)
GET  /api/v1/marketplace/reviews?productId=
POST /api/v1/marketplace/reviews   (Bearer) { productId, rating, body }
```

Product types: components, templates, themes, plugins, collections,
animations, icon packs, design systems. Uploaded packages are validated
and sandboxed — never executed in-process.

---

## 8. AI, MCP, CLI

```
POST /api/v1/ai/sessions        (Bearer) { model }       → { sessionId }
POST /api/v1/ai/sessions/:id/messages  (Bearer) { prompt } → { message } (may enqueue)
GET  /api/v1/ai/usage           (Bearer)                 → { credits, used, limit }

# MCP — scoped registry reads for AI agents, never raw DB
POST /api/v1/mcp/tools/:tool/invoke (API key) { args }

# CLI — backs `roy search/generate/audit/lint/...`
GET  /api/v1/cli/effects?query=
POST /api/v1/cli/scaffold   (API key) { template, name }
```

---

## 9. Accessibility, analytics, cloud, devtools, inspector

```
POST /api/v1/accessibility/audit   (Bearer) { url, html } → { jobId }   (async)
GET  /api/v1/accessibility/jobs/:id (Bearer)              → { status, result }

GET  /api/v1/analytics/projects/:id   (Bearer)           → { metrics }
POST /api/v1/analytics/events         (Bearer) { event }  → 204

GET  /api/v1/cloud/projects           (Bearer)
POST /api/v1/cloud/deploy             (Bearer) { projectId, target }

GET  /api/v1/devtools/inspect         (Bearer) { url }
GET  /api/v1/inspector/profile        (Bearer) { url }
```

---

## 10. Billing & usage

```
GET  /api/v1/billing/plans                     → { data: [Plan] }
POST /api/v1/billing/subscriptions   (Bearer) { planId }   (idempotent)
GET  /api/v1/billing/subscriptions   (Bearer)
GET  /api/v1/billing/invoices        (Bearer)
POST /api/v1/billing/refunds        (Bearer) { invoiceId } (idempotent)

GET  /api/v1/usage                  (Bearer) ?since=        → { data: [UsageEvent], total }
```

Payment state is **always** verified server-side. The browser never reports
its own payment status.

---

## 11. Search, notifications, audit

```
GET  /api/v1/search ?q=&type=&cursor=   → { data:[Result], meta }
GET  /api/v1/notifications  (Bearer)    → { data:[Notification] }
POST /api/v1/notifications/:id/read (Bearer)
GET  /api/v1/audit ?actor=&action=&since= (Bearer, admin) → { data:[AuditEntry] }
```

---

## 12. Status codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | No content (delete/logout) |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (authz) |
| 404 | Not found |
| 409 | Conflict (duplicate, stale version) |
| 422 | Semantic error (unprocessable) |
| 429 | Rate limited |
| 500 | Server error (logged with requestId) |

Every error response includes `error.code` (machine-readable) and
`error.message` (human-readable). `requestId` is echoed in the response
header `X-Request-Id` for correlation with logs.
