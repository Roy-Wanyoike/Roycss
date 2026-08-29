# RoyCSS Security Policy

## Reporting a Vulnerability

**Email**: `security@roycss.com`

Please do **not** open a public GitHub issue for security vulnerabilities. Email us privately and include:

- **Description** of the vulnerability and the affected component (frontend, backend, WebSocket, CLI, VS Code extension, Chrome inspector)
- **Steps to reproduce** — a minimal proof of concept if possible
- **Potential impact** — what an attacker could do (XSS, RCE, data leak, auth bypass)
- **Suggested fix** (if any)

### Response Timeline

- **Acknowledgement**: within 48 hours
- **Initial assessment**: within 5 business days
- **Fix or mitigation**: target 30 days for non-critical, 7 days for critical (CVSS ≥ 9.0)
- **Public disclosure**: after a fix is released, coordinated with the reporter

## Security Measures

### Frontend

- **Content Security Policy (CSP)** headers configured in `next.config.ts` — disallows inline scripts, `eval`, and untrusted origins
- **No `eval()` or `new Function()`** in production code
- **`dangerouslySetInnerHTML`** used only for trusted in-app CSS strings (effect preview rendering) — never for user-supplied HTML
- **All user inputs validated with Zod** schemas (newsletter form, contact form, search query, AI playground prompt)
- **No third-party trackers** — no Google Analytics, no Sentry, no Segment; first-party analytics only
- **Service worker** is cache-only for static assets; no background sync that could leak request bodies
- **`http-equiv` refresh** and `<meta>` redirects disabled
- **Strict transport security** (HSTS) enforced via Caddy gateway

### Backend

- **JWT authentication** with short-lived access tokens (15 min) + refresh tokens (7 days, rotating)
- **Rate limiting** on AI endpoints — 10 requests per minute per IP (`ai-playground`, `ai-migration`, `css-doctor`)
- **CSRF protection** via origin verification (`Origin` / `Referer` header check on all mutation routes)
- **All API inputs validated with Zod schemas** — request body, query params, and path params
- **Prisma ORM** prevents SQL injection — every query is parameterized; no raw SQL in modules
- **Helmet**-style security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- **CORS** restricted to the configured `SITE_URL` and `localhost` in dev
- **No secrets in code** — all secrets (JWT signing key, DB URL) live in `backend/.env` (gitignored); `backend/.env.example` documents the shape only
- **Request body size limit** (100 KB default; AI playground allows 1 MB for prompts)
- **Logging** — structured logs via `backend/src/lib/logger.ts` with sensitive fields (passwords, tokens) redacted

### WebSocket (Roy Live)

- **Socket.io** with `cors` option restricted to the configured `SITE_URL`
- **Authentication** — every socket connection must present a valid JWT in the `auth` handshake; unauthenticated sockets are disconnected immediately
- **Rate limiting** — max 10 messages per second per socket
- **Input validation** — every emitted event is validated with Zod before broadcasting

### Dependencies

- **`bun audit`** run regularly (weekly in CI) — no high-severity vulnerabilities merged until patched
- **No unmaintained dependencies** — packages with no commits in 12 months are flagged and replaced
- **MIT license** for all packages — no GPL/AGPL dependencies
- **Lockfile committed** — `bun.lock` ensures reproducible installs; no floating versions in `package.json` `dependencies`
- **Renovate** disabled — dependency upgrades are manual and reviewed

### Supply Chain

- **VS Code extension** (`.vsix`) built from source in `scripts/build-package.ts`; published from a clean CI runner
- **Chrome inspector extension** built from source in `inspector/build.sh`; no third-party code in the packaged artifact
- **npm package** (`roycss`) built from `package.roycss.json`; `prepublishOnly` runs `bun audit` and `npx tsc --noEmit` as gates

## Threat Model Summary

| Asset | Threat | Mitigation |
| --- | --- | --- |
| User auth tokens | XSS exfiltration | CSP, httpOnly cookies for refresh tokens, short-lived access tokens |
| AI playground prompts | Prompt injection → backend RCE | Zod-validated schema, prompt sent to AI provider only, never evaluated as code |
| Effect CSS injection | XSS via malicious CSS (`url(javascript:)`) | CSS strings are authored in-repo; user-editable CSS in the playground is sandboxed via `<iframe>` `sandbox` attribute |
| WebSocket messages | Replay / forgery | JWT handshake, per-message rate limit, Zod validation |
| DB | SQL injection | Prisma parameterized queries only |

## Contact

- **Security email**: `security@roycss.com`
- **General issues**: [GitHub Issues](https://github.com/Roy-Wanyoike/roycss/issues)
- **PGP key**: available on request via the security email
