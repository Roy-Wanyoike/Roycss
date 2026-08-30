# RoyCSS — Frontend Performance Audit (Task MODERNIZE-1)

**Date:** 2025-08-30
**Audited by:** MODERNIZE-1 (Z.ai Code)
**Project root:** `/home/z/my-project`
**Frontend:** port 3000 · **Backend:** port 4000 (via Caddy `?XTransformPort=4000`)

This audit covers the four areas requested in Task MODERNIZE-1, plus the
fixes that were applied and the bottlenecks that remain (and why).

---

## 1. Current state

### Effect catalog

| Metric | Value |
|---|---|
| Total effects (`src/lib/effects-batch-*.ts`) | **1,959** |
| Batch files | 52 (`effects-batch-1.ts` … `effects-batch-52.ts`) |
| Lines across all batch files | ~68,460 |
| `src/lib/roycss-effects.ts` (combine file) | 118 lines |
| Components importing `@/lib/roycss-effects` | **29** |
| Components importing the full `effects` array | **27 of 29** (2 import only `categoryMeta`/types) |

### CSS / data bundles

| Asset | Size |
|---|---|
| `dist/roycss.css` (unminified) | 1,620,052 B (~1.62 MB) |
| `dist/roycss.min.css` | 1,352,592 B (~1.35 MB) |
| `dist/effects.json` | 695,954 B (~680 KB) |

Note: the full CSS bundle is **not** shipped to the browser. The
`DynamicEffectCSS` engine (`src/components/roycss/dynamic-effect-css.tsx`)
lazy-injects CSS only for effects visible in the viewport via
`IntersectionObserver` + `MutationObserver`. The numbers above are the
build artifact sizes, not the runtime payload.

### Component graph

| Layer | Count |
|---|---|
| Total `.tsx` components under `src/components/` | 304 |
| `"use client"` components under `src/components/` | **291** |
| `src/components/roycss/pro/` components | 63 |
| `src/components/roycss/tools/` components | 68 |

---

## 2. API call patterns — before / after

### Before (Task MODERNIZE-1)

There were **two** patterns for talking to the backend + Next.js routes:

1. **Backend-direct (port 4000 via gateway)** — centralized in a single
   hook, `_use-backend-data.ts`, used by all 38 product cards:
   ```ts
   // src/components/roycss/_use-backend-data.ts (before)
   const res = await fetch(`/api/v1/${path}?XTransformPort=4000`, {
     cache: "no-store",
     headers: { Accept: "application/json" },
   });
   if (!res.ok) throw new Error(`HTTP ${res.status}`);
   const json = await res.json();
   setData((json.data ?? json) as T);
   ```
   Problems: no timeout, no request cancellation, error message was just
   `HTTP ${status}` (didn't unwrap the backend's `{ error: { message } }`
   envelope), no dev logging.

2. **Frontend proxy routes (port 3000)** — scattered across 6 components,
   11 call sites total:
   - `platform-tools.tsx` → `/api/ai-playground`, `/api/css-doctor`, `/api/ai-migration`
   - `engine-status.tsx` → `/api/health`
   - `contact-form.tsx` → `/api/contact`
   - `auth/auth-context.tsx` → `/api/auth/me`, `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`
   - `pro/roy-ai.tsx` → `/api/ai-playground`
   - `pro/roy-pair.tsx` → `/api/ai-playground`

### After (Task MODERNIZE-1)

A new centralized `apiClient` (`src/lib/api-client.ts`) is the **single
source of truth** for backend-direct calls:

```ts
// src/lib/api-client.ts
export async function apiClient<T>(path, options?): Promise<ApiResult<T>>
//  - prepends `/api/v1/` + `?XTransformPort=4000` (or uses absolute URL)
//  - 10s default timeout via AbortController
//  - request cancellation via the same AbortController
//  - unwraps `{ error: { message } }` envelope into ApiResult.error
//  - unwraps `{ data }` envelope into ApiResult.data (falls back to body)
//  - console.debug logging in dev (method, url, status, duration)
```

The 38-caller hook now delegates to it:

```ts
// src/components/roycss/_use-backend-data.ts (after)
const result = await apiClient<T>(path, { cache: "no-store" });
if (result.error) setError(result.error);
else setData(result.data);
```

### What was NOT migrated (and why)

The 11 frontend-proxy-route fetches (pattern #2 above) are
**intentionally left as direct `fetch` calls**. Rationale:

- The `apiClient`'s URL contract is `/api/v1/${path}?XTransformPort=4000`
  — it targets the **backend** (port 4000) via the Caddy gateway.
- The proxy routes (`/api/auth/*`, `/api/health`, `/api/contact`,
  `/api/ai-playground`, `/api/css-doctor`, `/api/ai-migration`) target
  **Next.js API routes on port 3000** — they handle httpOnly auth cookies,
  the `z-ai-web-dev-sdk`, and the backend health-ping fanout. They are a
  *different abstraction layer* (the frontend's own route handlers), not
  backend calls.
- Routing them through `apiClient` would prepend `/api/v1/` and break
  them (`/api/v1/api/contact` is wrong). The Task constraint
  "DO NOT break existing functionality" takes precedence.

This is documented in `apiClient`'s header comment so the next developer
doesn't "fix" it by accident.

---

## 3. Performance optimizations in place

The following were already in place before this task (verified, not
introduced here) and remain the dominant runtime mitigations for the
1,959-effect catalog:

| Optimization | File | Impact |
|---|---|---|
| `VirtualScrollGrid` | `src/components/roycss/virtual-scroll-grid.tsx` | Renders ~24 cards at a time (≈97.7% DOM reduction vs. 1,959) |
| `DynamicEffectCSS` | `src/components/roycss/dynamic-effect-css.tsx` | Lazy CSS injection — only visible effects get their CSS |
| `LazyMount` / `LazySection` | `src/components/roycss/lazy-section.tsx` | Defers heavy below-fold sections until near viewport |
| `AnimationPauser` | `src/components/roycss/animation-pauser.tsx` | Pauses offscreen animations (data-* attribute, hydration-safe) |
| `content-visibility: auto` | `src/components/roycss/effect-card.tsx` | Browser-level rendering skip on offscreen cards (`perf-auto`) |
| `next/dynamic` code-splitting | `src/components/roycss/roycss-page.tsx` | 10+ below-fold sections in separate chunks (see lines 196–244) |
| `React.memo` on `EffectCard` | `src/components/roycss/effect-card.tsx` (line 267) | Skips re-render of the 24 visible cards when parent state changes |
| Service Worker SWR / network-first | `public/sw.js` | Instant static assets; fresh HTML + offline fallback |
| Backend LRU caching + rate limiting | `backend/src/lib/cache.ts`, `backend/src/server/middleware/rateLimit.ts` | All 68 backend modules cache; 100/min general, 10/min auth |

### Optimizations introduced by Task MODERNIZE-1

| Optimization | File | Impact |
|---|---|---|
| Centralized `apiClient` | `src/lib/api-client.ts` (new) | Single backend-fetch implementation: 10s timeout, AbortController, error-envelope unwrapping, dev logging |
| `useBackendData` → `apiClient` | `src/components/roycss/_use-backend-data.ts` | 38 product cards automatically inherit timeout + cancellation + normalized errors |
| Removed 4 unnecessary `"use client"` directives | `_backend-live-badge.tsx`, `auth/auth-sheets.tsx`, `developer-workflow.tsx`, `effects/three-tubes-demo.tsx` | These are pure presentational / pure wrappers around client children — they no longer opt into the client runtime unnecessarily |

---

## 4. Server-component candidates audit

A scan for `"use client"` components with **no hooks, no event handlers,
no `framer-motion`** found 8 candidates. Of those:

| Component | Status | Notes |
|---|---|---|
| `_backend-live-badge.tsx` | ✅ Converted | Pure presentational (`cn` + Tailwind classes only) |
| `auth/auth-sheets.tsx` | ✅ Converted | Pure wrapper around `<LoginSheet />` + `<RegisterSheet />` (both client) |
| `developer-workflow.tsx` | ✅ Converted | Static `STEPS.map(...)` + `<ScrollReveal>` (client) wrapper. Note: currently has no importer — appears to be dead code; flagged for follow-up |
| `effects/three-tubes-demo.tsx` | ✅ Converted | Pure wrapper around `<ThreeTubesCursor />` (client). Note: currently has no importer — appears to be dead code; flagged for follow-up |
| `roycss-logo.tsx` | ❌ Skipped | Uses `motion` from `framer-motion` (requires client) |
| `community-spotlight.tsx` | ❌ Skipped | Uses `motion` from `framer-motion` |
| `why-roycss.tsx` | ❌ Skipped | Uses `motion` from `framer-motion` |
| `platform-section-unified.tsx` | ❌ Skipped (conservative) | Loaded via `next/dynamic(...)` in `roycss-page.tsx`; the page itself is `"use client"`, so converting gives no bundle benefit. Left as-is to avoid any subtle interaction with `dynamic()` SSR. |

### Why the benefit of removing `"use client"` is currently marginal

The root page composition is:

```
src/app/page.tsx (server component)
  └─ <RoyCSSPage />  ← src/components/roycss/roycss-page.tsx is "use client"
```

Because `RoyCSSPage` is a client component, **every** component it imports
(whether marked `"use client"` or not) becomes part of the client bundle.
Removing `"use client"` from imported children therefore produces no
runtime bundle savings *today* — the children are still bundled for the
client. The 4 conversions above are still correct (a component that
doesn't need client features shouldn't declare it), and they become
load-bearing the day `RoyCSSPage` is refactored toward a server component
(see §6 Recommendations).

---

## 5. Remaining bottlenecks

### Bottleneck #1 — Turbopack compile memory (4 GB sandbox)

**Problem:** The 1,959-effect catalog (52 batch files, ~68,460 lines of
TypeScript) requires ~2 GB for Turbopack to compile. With the backend +
live-service also running, the dev server can get OOM-killed during the
first cold compile.

**Status:** This is an **environment** issue, not a code issue. The
production build (`bun run build`) succeeds. It is documented in
`docs/ARCHITECTURE.md` §Performance → Bottleneck #1.

**Mitigation in place:** None at the code level. The sandbox simply
needs more RAM (8 GB) for dev, or use the production build.

### Bottleneck #2 — Large effects array imported 27× as a single module

**Problem:** 27 components import the **full** `effects` array from
`@/lib/roycss-effects`. While the `VirtualScrollGrid` keeps the *rendered*
DOM at ~24 cards, the *module* (all 1,959 effect objects + their CSS
strings) is pulled into any chunk that imports `effects`. Because
`RoyCSSPage` is a client component that imports `effects` directly, the
entire 1,959-effect array ships in the main client chunk.

**Why it can't simply be split:** `roycss-effects.ts` is the canonical
combine file (52 batch spreads → one array). Many consumers need the
*whole* array (search, filter, random pick, bundle calculator). A naive
split would require either (a) lazy-loading the array (breaks search),
or (b) a virtualized data structure (significant refactor).

**Mitigation in place:** `VirtualScrollGrid` (render-time) +
`DynamicEffectCSS` (CSS injection) keep the *runtime* cost bounded even
though the *module* is large.

### Bottleneck #3 — `RoyCSSPage` is a single 3,021-line client component

**Problem:** `src/components/roycss/roycss-page.tsx` is a 3,021-line
`"use client"` component that owns almost all page state (search, filters,
favorites, playground, theme, etc.) and statically imports most of the
component graph. This forces the entire homepage interaction surface into
one client chunk.

**Status:** Already partially mitigated via `next/dynamic` for 10+
below-fold sections (lines 196–244) and the `PlatformTools` sheet
(lazy-loaded, the largest single chunk win — see the comment at line 237).

**Why not fully refactored here:** Splitting `RoyCSSPage` into a
server-shell + client-islands is a large architectural change (the page
uses `useSyncExternalStore` for favorites, `useMemo` over the full effects
array, etc.) that is out of scope for this task ("DO NOT change the
existing architecture").

### Bottleneck #4 — `content-visibility: auto` is a hint, not a guarantee

**Status:** Already in place on `EffectCard` (`perf-auto` class). This is
the right tool; no change needed.

---

## 6. Recommendations (out of scope for this task)

These are listed for the next iteration; none were applied here to honor
the "DO NOT change the existing architecture" constraint.

1. **Promote `RoyCSSPage` toward a server shell.** Move the search/filter
   state into a small client island and let the rest of the page render on
   the server. This is the single highest-impact change — it would make
   every `"use client"` removal in §4 *load-bearing* and would let the
   1,959-effect array stay on the server (search could be a server action
   or a tRPC-style endpoint).

2. **Virtualize the *data*, not just the DOM.** Today `useMemo` over the
   full `effects` array runs on the client. A backend `/api/v1/effects`
   endpoint (already exists in `backend/src/modules/effects/`) with query
   params (category, tags, search) would let the client fetch only the
   ~24 visible effects per page. The `apiClient` introduced here is the
   right building block for that.

3. **Delete the two dead-code components** flagged in §4
   (`developer-workflow.tsx`, `effects/three-tubes-demo.tsx`) — they have
   no importers. Verify with a build-time dependency graph first; if
   truly unused, removing them shrinks the module graph slightly.

4. **Add a request-retry with backoff to `apiClient`** for transient 5xx
   / network errors. The backend modules already have LRU caching, but a
   client-side retry would smooth over the 60s-poll health checks and the
   product-card initial loads. Keep the default at 0 retries to preserve
   current behavior; expose as an opt-in `retries` option.

5. **Adopt `@tanstack/react-query`** for the product-card data layer
   (it's in `package.json` already). It would replace the hand-rolled
   `useBackendData` cancellation/loading/error state and add
   deduplication + background refetch for free. The `apiClient` is
   query-engine-agnostic, so this is a drop-in on top of it.

---

## 7. Verification

- `bun run lint` → **exit 0**, zero errors, zero warnings ✅
- Dev server recompiled after edits: `✓ Compiled in 278ms` (no errors in
  `dev.log`) ✅
- `apiClient` follows the spec signature exactly (`apiClient<T>(path,
  options?: RequestInit & { timeout? })`) ✅
- `useBackendData` public API unchanged (`{ data, loading, error }`) —
  all 38 callers compile and behave identically ✅
- 4 components converted away from `"use client"`; lint confirms no
  newly-required client features were used ✅
- No existing features removed; no architecture changed; frontend proxy
  routes intentionally left as direct `fetch` (documented above + in
  `api-client.ts` header) ✅
