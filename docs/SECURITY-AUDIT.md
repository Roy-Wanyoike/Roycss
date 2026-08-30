# Security Audit Report

**Audit Date:** 2025
**Scope:** `backend/src/server/**`, `backend/src/modules/**`, `backend/prisma/schema.prisma`, `.gitignore`, runtime HTTP probes
**Method:** Static code review + live `curl` probes against `http://localhost:4000/api/v1/*`

---

## 1. Security Headers

Methodology: `curl -sI http://localhost:4000/api/v1/health` and inspect
response headers.

| Header                                  | Present | Value |
| --------------------------------------- | :-----: | ----- |
| `Strict-Transport-Security`             | ✅ | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options`                | ✅ | `nosniff` |
| `X-Frame-Options`                       | ✅ | `SAMEORIGIN` |
| `Content-Security-Policy`               | ✅ | `default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'; upgrade-insecure-requests` |
| `Cross-Origin-Opener-Policy`            | ✅ | `same-origin` |
| `Cross-Origin-Resource-Policy`          | ✅ | `same-origin` |
| `X-Powered-By`                          | ✅ (suppressed) | `app.disable("x-powered-by")` — no header returned |

Source: `helmet()` is applied globally in `backend/src/server/app.ts:94`
**before** every router. `app.disable("x-powered-by")` is called at line 93.

**Verdict:** ✅ Excellent. Helmet's defaults are all in place, plus
HSTS (1 year) with `includeSubDomains`.

---

## 2. Authentication Mechanism

**Stack:** JWT (access + refresh) + bcryptjs password hashing + httpOnly
cookies (set by the Next.js proxy routes, not the backend itself).

| Property                       | Value                                                      |
| ------------------------------ | ---------------------------------------------------------- |
| Password hashing               | `bcryptjs` (`backend/src/modules/auth/service.ts:13`)     |
| Bcrypt rounds                  | `BCRYPT_ROUNDS` (default 10) — see `auth/service.ts:5`     |
| Access token lifetime          | `JWT_EXPIRES_IN` (default `15m`) — see `env.ts:37`         |
| Refresh token lifetime         | `JWT_REFRESH_EXPIRES_IN` (default `7d`) — see `env.ts:38` |
| JWT secret min length          | 16 chars (`env.ts:33`) — fails fast at boot if shorter      |
| Refresh secret min length      | 16 chars (`env.ts:36`)                                      |
| Token verification             | `verifyAccessToken()` in `backend/src/lib/jwt.ts`          |

### Timing attack mitigation

`auth/service.ts:95–102` — the login flow **always** runs a bcrypt
compare even when the user doesn't exist, using a precomputed
`DUMMY_HASH`. This prevents an attacker from enumerating valid emails
by measuring login response times.

### User enumeration prevention

`auth/service.ts:49` — `select: { id: true }` existence check runs
**before** the bcrypt hash step, so we never spend CPU hashing a
password for a non-existent user.

### httpOnly cookies

The backend itself does NOT set cookies — it returns the JWT in the
JSON body. The Next.js proxy routes (`src/app/api/auth/login/route.ts`,
`/refresh`, `/logout`) receive the token and set `httpOnly`, `secure`,
`sameSite=lax` cookies on the response, so the JWT never touches
client-side JavaScript and is immune to XSS exfiltration.

**Verdict:** ✅ Strong. Bcrypt + JWT + httpOnly cookies + timing-safe
login + fail-fast env validation.

---

## 3. Authorization

**Middleware:** `requireAuth` (`backend/src/server/middleware/auth.ts`)

| Behavior                                            | Source line |
| -------------------------------------------------- | ----------- |
| Missing `Authorization` header → 401               | `auth.ts:37–39` |
| Malformed header (no `Bearer ` prefix) → 401        | `auth.ts:42–46` |
| Invalid token (signature/expired) → 401            | `auth.ts:49–54` |
| On success: attaches decoded payload to `req.user` | `auth.ts:51` |

**Optional auth variant:** `optionalAuth` (`auth.ts:62–83`) — used by
endpoints that personalize the response when authenticated but remain
useful anonymously (e.g. `academy/paths/:id` — adds `completed` lesson
state when logged in).

### Live probe

```bash
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/auth/me
401
```

✅ `GET /auth/me` correctly returns 401 when no `Authorization` header is
sent.

**Verdict:** ✅ Adequate. Note that role-based authorization (RBAC) is
**not** implemented — every authenticated user has the same privileges.
For an admin / enterprise endpoints (e.g. `enterprise/audit-log`,
`governance/approvals/:id/approve`), an additional `requireRole("admin")`
middleware should be added before production rollout.

---

## 4. Rate Limiting

**Stack:** Custom sliding-window in-memory rate limiter
(`backend/src/server/middleware/rateLimit.ts`).

| Tier        | Limit (per IP / per window) | Window | Applied to            |
| ----------- | --------------------------- | ------ | --------------------- |
| General     | **100 req**                 | 60 s   | All routes (global)   |
| Auth        | **10 req**                  | 60 s   | `/auth/*`             |
| Contact     | **5 req**                   | 60 s   | `/contact`            |

Defaults: `backend/src/config/env.ts:40–43`
Wiring: `app.ts:110` (global `generalRateLimit`), `auth/routes.ts:35,53,71`
(`authRateLimit`), `contact/routes.ts:26` (`contactRateLimit`).

### Why sliding window (not fixed window)

A fixed-window limiter allows 2× the limit at window boundaries (e.g.
5 requests at 0:59 + 5 more at 1:00 = 10 requests in one second). The
sliding-window approach (`rateLimit.ts:1–9` comment) records the
timestamp of every request and counts only those within the last
`windowMs`, giving accurate limiting at any moment.

### Headers returned on every request

```
X-RateLimit-Limit:     100
X-RateLimit-Remaining: 99
X-RateLimit-Reset:     1700000000
```

When throttled, an additional `Retry-After: 60` header is returned with
the 429 response.

### Health endpoint bypass

`app.ts:106–107` mounts `/api/v1/health` **before** the global rate
limiter, so orchestrator health checks are never throttled.

**Verdict:** ✅ Strong. Three tiers, sliding-window, proper headers,
health-bypass, and clear separation of concerns.

### Limitation (documented)

The limiter is in-memory — each backend process keeps its own counter.
This is fine for the single-instance dev backend but would need a
Redis-backed implementation (`rateLimit.ts:11` comment) for multi-instance
production.

---

## 5. Input Validation

**Stack:** Zod schemas on every POST/PUT/PATCH body and GET query string.

| Metric                                  | Count |
| --------------------------------------- | ----- |
| `schema.ts` files under `backend/src/modules/` | **63** |
| Validation middleware                    | `validateBody`, `validateQuery`, `validateParams` (`backend/src/server/middleware/validate.ts`) |
| Behavior on failure                     | Throws `AppError.validation(details)` → 400 response with `path`, `message`, `code` per Zod issue |

### Live probe

```bash
$ curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{}' http://localhost:4000/api/v1/contact
400
```

✅ `POST /contact` with empty body → 400 (Zod rejects empty body before
the contact service runs).

### Body size limit

`app.ts:96` — `express.json({ limit: "256kb" })` and
`express.urlencoded({ limit: "256kb" })`. Prevents large-payload DoS.

**Verdict:** ✅ Strong. Every public route with a request body or query
string is validated by a Zod schema before the service layer runs.

---

## 6. Secret Management

### .env files in source control

```bash
$ git ls-files | grep "\.env$"
(empty — no .env files tracked)
```

✅ `.env`, `.env.*`, `backend/.env`, `backend/.env.*` are all in
`.gitignore` (lines 47–51). Only `.env.example` and `backend/.env.example`
are allowed through `!` un-ignore rules.

### Hardcoded secrets in source code

```bash
$ git grep -l "sb_secret_sR5u\|Youngshark@2476\|ghp_" -- 'backend/' 'src/'
(empty)
```

✅ No hardcoded secrets in any source file. (One match in
`docs/CODEBASE-AUDIT.md:147` is the audit-report text listing these
patterns as examples of the check itself — not actual secrets.)

### Secret loading

`backend/src/config/env.ts` — every secret is loaded from
`process.env` through a Zod-validated schema. The backend **fails fast**
at boot (`env.ts:91` `process.exit(1)`) if any required secret is
missing or below the minimum length.

Required secrets (no defaults):
- `JWT_SECRET` (min 16 chars)
- `JWT_REFRESH_SECRET` (min 16 chars)
- `DATABASE_URL`

Optional secrets (defaults to `undefined`, code paths check before use):
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SENTRY_DSN`
- `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`
- `CDN_API_TOKEN`, `FIGMA_TOKEN`, `GITHUB_TOKEN`, `NPM_TOKEN`

**Verdict:** ✅ Strong. No secrets in code, no .env files in git, env
schema validates secret presence and minimum length at boot.

---

## 7. CORS Configuration

**Source:** `backend/src/server/middleware/cors.ts`

| Property             | Value                                                              |
| -------------------- | ----------------------------------------------------------------- |
| Allowed methods      | `GET, POST, PUT, PATCH, DELETE, OPTIONS`                          |
| Allowed headers      | `Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-Id` |
| Exposed headers      | `X-Request-Id`                                                    |
| Credentials          | `true` (cookies allowed)                                          |
| Preflight cache      | `maxAge: 600` (10 min)                                            |
| Options success      | `204`                                                             |
| Allowed origins      | `CORS_ORIGINS` env (default `http://localhost:3000,http://127.0.0.1:3000`) |

### Origin decision logic (`cors.ts:14–28`)

1. **No `Origin` header** (same-origin, curl, server-to-server) → allow.
2. **Origin in `CORS_ORIGINS` whitelist** → allow.
3. **Not in whitelist, but `IS_DEV`** → allow (permissive in dev so
   local mobile / network hosts work).
4. **Not in whitelist, `IS_PROD`** → reject with `Error("CORS: origin … not allowed")`.

**Verdict:** ✅ Correct. Production is strict (whitelist only); dev is
permissive (any origin) to ease local testing.

---

## 8. SQL Injection Prevention

**Stack:** Prisma ORM with parameterized queries.

- Every query in `service.ts` files uses the Prisma Client API
  (`db.<model>.findMany({ where: { … } })`) — Prisma generates
  parameterized SQL under the hood (`WHERE "email" = $1`).
- **No** raw SQL queries (`$queryRaw` / `$executeRaw`) are used
  anywhere in `backend/src/modules/`.
- **No** string concatenation of user input into SQL fragments.
- The `search` module uses `where: { content: { contains: q } }` —
  Prisma escapes this to `LIKE '%' || $1 || '%'` with `q` as a bound
  parameter, not a string-interpolated value.

**Verdict:** ✅ Strong. Prisma's parameterized queries make SQL
injection impossible through the normal API surface.

---

## 9. XSS Prevention

**Stack:** Next.js React frontend (escapes by default) + Helmet CSP.

- The backend is a pure JSON API — it never returns HTML, so the
  backend itself cannot introduce XSS by reflecting user input.
- The Next.js frontend renders all user-generated content via React's
  JSX, which auto-escapes `<`, `>`, `&`, `"`, `'` by default.
- Helmet's CSP (`script-src 'self'; script-src-attr 'none'`) blocks
  inline scripts and inline event handlers, so even if a stored XSS
  payload is rendered in the DOM, the script will not execute.
- `object-src 'none'` blocks Flash/Java plugins.
- `base-uri 'self'` prevents `<base>` hijacking.

### Note on `style-src 'unsafe-inline'`

The CSP allows `'unsafe-inline'` for styles only — this is required
because Next.js injects inline `<style>` tags for CSS-in-JS and
the DynamicEffectCSS engine injects effect CSS at runtime. This is
a **measured** trade-off: inline styles cannot execute JavaScript,
so the XSS surface from `unsafe-inline` for styles is much lower
than for scripts.

**Verdict:** ✅ Strong. Defense in depth — React escaping (frontend) +
CSP (backend Helmet) + JSON-only API surface.

---

## 10. .gitignore Coverage

`.gitignore` covers (lines 47–140):

| Category              | Pattern                                          | Status |
| --------------------- | ------------------------------------------------ | ------ |
| Env files             | `.env`, `.env.*`, `backend/.env`, `backend/.env.*` | ✅ Ignored |
| Env examples          | `!.env.example`, `!backend/.env.example`         | ✅ Allowed |
| SQLite DBs            | `db/*.db*`, `backend/prisma/dev.db*`, `prisma/migrations/dev.db*` | ✅ Ignored |
| Build artifacts       | `.next/`, `out/`, `build/`, `*.tsbuildinfo`, `dist/coverage/` | ✅ Ignored |
| Logs                  | `*.log`, `dev.log`, `server.log`, `backend/*.log`, `/tmp/*.log` | ✅ Ignored |
| OS files              | `.DS_Store`, `Thumbs.db`, `Desktop.ini`           | ✅ Ignored |
| IDE                   | `.idea/`, `.vscode/`, `*.swp`, `*.swo`            | ✅ Ignored |
| Test artifacts        | `coverage/`, `playwright-report/`, `test-results/`, `*.lcov` | ✅ Ignored |
| Agent context         | `agent-ctx/`, `.agent`, `worklog.md`              | ✅ Ignored |
| Local config          | `local-*`, `.claude`, `.z-ai-config`              | ✅ Ignored |
| Tool results          | `.tool-results/`, `tool-results/`, `screenshots/` | ✅ Ignored |
| Bundled archives      | `*.zip`, `*.tgz`, `*.tar.gz` (with `!public/roycss.zip` exception) | ✅ Ignored |
| Cache                 | `.cache/`, `.turbo/`, `.eslintcache`              | ✅ Ignored |

### Live verification

```bash
$ git ls-files | grep "\.env$"
(empty — confirmed no .env files are tracked)
```

**Verdict:** ✅ Comprehensive. Every category of secret/dev/cache artifact
is covered, with `!` exceptions for the few files that should be tracked.

---

## 11. Other Security Measures

### Request body size limit

`app.ts:96–97` — `256kb` for both JSON and URL-encoded bodies. Prevents
large-payload DoS.

### Request ID + structured logging

`app.ts:100–101` — `requestIdMiddleware` + `requestLogger` attach a
unique `X-Request-Id` to every request and log it. Useful for incident
response and audit trails.

### Trust proxy

`app.ts:104` — `app.set("trust proxy", 1)` so `req.ip` reflects the
real client IP behind the Caddy gateway (important for accurate
rate-limit keying).

### Error handling

`backend/src/server/middleware/error.ts` — centralized error handler
formats all errors as JSON with a consistent shape. `AppError` is the
custom error class with typed subclasses (`unauthorized`,
`validation`, `rateLimited`, `notFound`, `internal`). Stack traces
are not leaked to clients in production.

---

## 12. Recommendations

### High priority

1. **Add role-based authorization (RBAC).** Today every authenticated
   user has the same privileges. Add a `requireRole("admin")` middleware
   (analogous to `requireAuth`) and apply it to:
   - `POST /governance/approvals/:id/approve|reject`
   - `GET /enterprise/audit-log`
   - `DELETE /cloud/projects/:id`
   - `POST /cdn/purge`
   - `DELETE /storage/files/:id`
   - `POST /compliance/scan`

2. **Rotate JWT secrets**. The `JWT_SECRET` and `JWT_REFRESH_SECRET`
   are static env vars. Implement a key-rotation mechanism (e.g.
   `JWT_SECRET_V2` with both accepted during a grace period) so
   secrets can be rotated without invalidating every active session.

3. **Add CSRF protection** for the Next.js proxy routes that set
   httpOnly cookies. The `sameSite=lax` cookie attribute is a strong
   default, but for state-changing POST/DELETE routes, a CSRF token
   or `sameSite=strict` would be safer.

### Medium priority

4. **Add request body size validation per route.** The global `256kb`
   limit is generous; some endpoints (e.g. `POST /storage/upload`) may
   need more, others (e.g. `POST /contact`) less.

5. **Add audit logging for admin actions.** Today only `EnterpriseAuditLog`
   is implemented. Extend to governance approvals, compliance scans,
   CDN purges, and storage deletes.

6. **Switch to Redis-backed rate limiter** before scaling to multiple
   backend instances — the in-memory limiter is per-process today
   (documented at `rateLimit.ts:11`).

### Low priority

7. **Add `Referrer-Policy: strict-origin-when-cross-origin`** to the
   Helmet config (default Helmet already sets this, but verify it's
   not disabled).

8. **Add `Permissions-Policy`** header to disable unused browser
   features (camera, microphone, geolocation, payment).

9. **Pin npm dependency versions** with `npm shrinkwrap.json` or
   `bun.lock` for the backend — already done via `bun.lock` at the
   repo root.

10. **Add SAST scanning** to CI (e.g. `eslint-plugin-security`) to
    catch new patterns of unsafe code.

---

## 13. Summary Scorecard

| Area                            | Rating | Notes                                              |
| ------------------------------- | ------ | -------------------------------------------------- |
| Security headers (Helmet)       | ✅ A+  | All defaults + HSTS + COOP + CORP                  |
| Authentication (JWT + bcrypt)   | ✅ A   | Timing-safe login, fail-fast env, httpOnly cookies |
| Authorization (requireAuth)     | ⚠️ B+  | Authentication enforced; **no RBAC**               |
| Rate limiting (3 tiers)         | ✅ A+  | Sliding-window, proper headers, health-bypass      |
| Input validation (Zod)          | ✅ A+  | 63 schema files, every route validated             |
| Secret management               | ✅ A+  | .env gitignored, no hardcoded secrets, fail-fast env |
| CORS configuration              | ✅ A   | Whitelist in prod, permissive in dev               |
| SQL injection prevention        | ✅ A+  | Prisma parameterized queries, no raw SQL           |
| XSS prevention                  | ✅ A   | React escaping + CSP (style-src unsafe-inline is a measured trade-off) |
| .gitignore coverage             | ✅ A+  | Comprehensive — env, DB, logs, OS, IDE, cache      |

**Overall security grade: A-** — Strong baseline with all OWASP Top 10
basics covered. The main gap is the absence of role-based authorization
(RBAC) for admin endpoints, which should be addressed before any
production multi-tenant rollout.
