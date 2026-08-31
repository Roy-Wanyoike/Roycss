# RoyCSS Security Report

> Companion to `ROYCSS_BACKEND_ARCHITECTURE.md`. Current state (running TS
> backend) + target state (Go).

---

## 1. Threat model summary

| Asset | Threat | Control |
|---|---|---|
| User credentials | Theft, brute force | bcrypt hashing, rate-limited auth endpoints |
| JWT access tokens | Theft, replay | Short TTL (15m), refresh-token rotation, `httponly` cookie option |
| API keys | Theft, leak | Hashed at rest, shown once at creation, revocable |
| Payment state | Client-side tampering | Server-side verification only; browser never authoritative |
| RoyCSS Registry content | Drift across products | Single canonical registry module |
| Marketplace packages | Malicious code execution | Validation + sandbox; never executed in-process |
| AI provider keys | Leak via frontend | Backend-only; never exposed to browser |
| User data (PG) | Direct browser access | Browser → Next.js → backend → PG only; no direct DB |
| Audit trail | Tampering | Append-only table; no UPDATE/DELETE |

---

## 2. Authentication

### Running (TS)
- **Password hashing:** `bcryptjs` with salt rounds ≥ 10.
- **JWT:** `jsonwebtoken`, access (15m) + refresh (7d), signed with
  separate secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`), issuer/audience
  locked to `roycss-backend` / `roycss-client`.
- **Refresh rotation:** each refresh issues a new refresh token.
- **Secrets:** loaded via Zod-validated env; fail-fast on missing/short
  secrets at boot.
- **Never logged:** passwords, tokens, secrets are never written to logs.

### Target (Go)
- Same JWT scheme.
- Add: API-key auth middleware (hashed at rest, `X-API-Key` header).
- Add: OAuth-ready provider interface (Google, GitHub) for social login.

---

## 3. Authorization

### Running (TS)
- Per-route `requireAuth` middleware.
- Ownership checks on resource endpoints (TODO: finer-grained org/team
  scoping — see TODO A2).

### Target (Go)
- Role matrix: OWNER / ADMIN / MEMBER / VIEWER on org-scoped resources.
- Per-route `requireAuth` + `requireRole(role)`.
- Custom roles (future) via a role-permission table.

**Rule:** never rely on frontend authorization. Every protected endpoint
re-asserts identity and permissions server-side.

---

## 4. Input validation

- **TS:** Zod schemas on every request body, params, and query. Invalid
  input → 400 with `error.code = "VALIDATION"` and per-field details.
- **Go:** `go-playground/validator` struct tags + a thin validation
  middleware.
- SQL injection: Prisma parameterised queries (TS) / pgx parameterised
  statements (Go). No string-concatenated SQL anywhere.
- XSS: frontend renders via React (auto-escaping). Backend never returns
  HTML unless explicitly intended (effect previews are CSS-only).

---

## 5. Rate limiting

### Running (TS)
- In-memory sliding-window limiter (`src/lib/api-rate-limit.ts` +
  `backend/src/server/middleware/`).
- Tiers: `general` (100/min), `auth` (10/min), `contact` (5/min).
- Per-IP, per-route.

### Target (Go)
- Redis-backed sliding window (same tiers).
- Per-API-key limiting in addition to per-IP.
- `429` with `Retry-After` header.

---

## 6. Transport & headers

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | `frame-ancestors 'self' *; frame-src https://github.com https://*.github.com` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` |
| `Cross-Origin-Resource-Policy` | `cross-origin` |
| `Strict-Transport-Security` | set by Cloud Run / Vercel TLS termination |

CORS: configurable origins from env (`CORS_ORIGINS`), defaults to
`http://localhost:3000,http://127.0.0.1:3000`.

---

## 7. Secret management

- Secrets live in env vars (local dev) / Cloud Run secrets / Secret Manager
  (production). Never in code, never in logs, never in the frontend bundle.
- `.env` is gitignored. The sandbox `.env` contains only `DATABASE_URL` (a
  local file path) — no production secrets.
- The backend logs secret length at boot, never the secret itself.

---

## 8. Audit logging

- `backend/src/modules/audit/` + `EnterpriseAuditLog` Prisma model.
- Mutating endpoints (auth, billing, marketplace, enterprise, governance)
  write audit entries (TODO: full coverage, see TODO A6).
- Target: append-only PostgreSQL table; no `UPDATE`/`DELETE`; retention
  per compliance policy.

---

## 9. Dependency scanning

- `bun install` resolves dependencies; `npm`/`bun` audit for known CVEs.
- Target: GitHub Actions `dependabot` + `govulncheck` + Snyk/Trivy in CI.
- Frontend: `npm audit` in CI; no high-severity CVEs merged.

---

## 10. Known gaps (target)

- [ ] API-key management UI + endpoints (TODO A3).
- [ ] Org/team role enforcement on all org-scoped endpoints (TODO A2).
- [ ] CSRF tokens for cookie-based auth (currently same-origin + origin
      check — sufficient for the Bearer-token API, revisit if cookie auth
      is added).
- [ ] OpenAPI security scheme documentation (TODO A4).
- [ ] Penetration test before production GA.
