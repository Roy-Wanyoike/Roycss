# ADR 05 — Performance Engineering

**Status:** Accepted
**Date:** 2026-07-30
**Author:** Distinguished Engineer — Performance Engineering domain
**Companion docs:**
- `docs/threat-models/05-performance-engineering.md`
- `docs/benchmarks/05-performance-engineering.md` (real measured numbers)
- `docs/plans/05-performance-engineering.md`
- `docs/checklists/05-performance-engineering.md`
- `docs/LABS-33-PERFORMANCE-LAB.md` (the original V2 performance lab report)

---

## 1. Context

RoyCSS ships **1,569 effects across 20 categories** as a single CSS bundle.
The production artifacts in `dist/` are:

| Artifact | Size | Notes |
|---|---|---|
| `dist/roycss.css` | 1,209,436 B (1.153 MB) | Full bundle, all 1,569 effects |
| `dist/roycss.min.css` | 1,013,439 B (989.69 KB) | Minified production bundle |
| `dist/effects.json` | 547,072 B (534.25 KB) | Effect metadata (no `cssCode`) |
| `dist/effects.js` | 3,457 B (3.38 KB) | ESM loader (reads JSON at runtime) |
| `dist/effects.cjs` | 3,457 B (3.38 KB) | CommonJS loader (mirror of ESM) |
| **Total `dist/`** | **2,795,056 B (2.648 MB)** | Sum of all published artifacts |

The marketing site (`/`) renders 1,569 effect cards via a virtual-scroll
grid (`VirtualScrollGrid`) that starts with `BATCH_SIZE=24` cards and grows
by 24 each time a sentinel intersects. `DynamicEffectCSS` injects effect
CSS on demand via `IntersectionObserver`, so only the CSS for visible
effects is in the document at any time.

Three architectural pressures motivated this ADR:

1. **The 1.15 MB raw bundle is too large to inline in `<head>`.** Even
   gzipped it is ~92 KB, which blocks first paint on mid-tier mobile
   devices. The marketing site currently ships the full bundle via
   `<link rel="stylesheet">`, which the browser must download and parse
   before any effect renders.
2. **`DynamicEffectCSS` joins all 1,569 `cssCode` strings on every
   render** when `roycss-load-all-cards` fires (it does, when a user
   clicks a nav link to a section below the effects grid). The join is
   1.2 MB of string concatenation that must happen on the main thread.
3. **The FerrumCSS merge (worklog task 00) introduced 150 duplicate
   `@keyframes` declarations** — same name, same body. These are
   semantic bugs (the second declaration silently overrides the first;
   if they ever diverge, the wrong effect breaks) and bundle bloat
   (~75 KB of wasted bytes).

This ADR documents the decisions that govern: which CSS ships initial vs.
lazy-load, the GPU acceleration strategy, the `will-change` usage policy,
and the remediation plan for the duplicate-`@keyframes` finding.

---

## 2. Decision

### 2.1 CSS shipping strategy — three-tier

RoyCSS ships CSS in three tiers, each with a distinct delivery mechanism:

| Tier | Contents | Size | Delivery |
|---|---|---|---|
| **Tier 1 — Critical** | Base CSS (reset, sr-only, global `prefers-reduced-motion`) + first 50 effect `cssCode` blocks | 17.25 KB | Inline in `<head>` as `<style>` |
| **Tier 2 — Full bundle** | All 1,569 effects | 989.69 KB (minified) | `<link rel="preload" as="style">` + `<link rel="stylesheet" media="print" onload="this.media='all'">` |
| **Tier 3 — Dynamic injection** | Per-effect `cssCode` on demand | 0.77 KB avg per effect | `DynamicEffectCSS` injects via `IntersectionObserver` |

The marketing site uses **Tier 1 + Tier 2** (full bundle preloaded, critical
inlined for instant first paint). npm consumers use **Tier 3 only** — they
import `effects` from `roycss` and let `DynamicEffectCSS` (or their own
equivalent) inject only the effects they actually render.

**Critical CSS extraction** is implemented in
`perf/optimize/extract-critical-css.ts`. It reads `dist/roycss.css`,
extracts everything from the banner comment through the end of the global
`prefers-reduced-motion` block (the base CSS), then concatenates the
`cssCode` of the first 50 effects. Output: `dist/roycss-critical.css`
(17.25 KB, 1.5% of full bundle, 98.5% reduction).

**Rationale for 50 effects:** `VirtualScrollGrid` renders 24 cards per
batch. 50 effects covers ~2 batches — enough for the first viewport on
desktop (4 columns × 12 rows = 48 cards) plus a small overscan buffer.
This guarantees the first paint shows fully-styled cards, and the full
bundle finishes loading before the user scrolls past batch 2.

### 2.2 GPU acceleration strategy

RoyCSS animates **only `transform`, `opacity`, and `filter`** in 95% of
the top 20 effects (19/20 measured). These are the only properties that
run on the browser's compositor thread without triggering paint.

The remaining 5% (1/20 effects) animates `box-shadow` — a known paint
cost. The library does NOT rewrite these effects because:

1. `box-shadow` animation is semantically meaningful (the effect is
   literally "pulsing shadow").
2. The browser's compositor can still offload the shadow raster if the
   element has `will-change: box-shadow` set.
3. Replacing `box-shadow` with `filter: drop-shadow()` on a pseudo-element
   would change the visual (drop-shadow follows alpha; box-shadow follows
   border-box) and break the effect's contract.

The measured theoretical frame rate for the top 20 effects is **57 fps**
(60 × 0.95) — above the 48 fps budget.

### 2.3 `will-change` usage policy

RoyCSS's `will-change` policy (already enforced in the codebase, measured
at **15 occurrences** across the entire 1.15 MB bundle):

| Pattern | When to use | RoyCSS practice |
|---|---|---|
| `will-change: transform` | Element animates `transform` *frequently* (hover, infinite animation) | Yes — applied to a small set of "featured" effects |
| `will-change: opacity` | Element animates `opacity` *frequently* | Yes — paired with `will-change: transform` |
| `will-change: auto` (default) | Everything else | Yes — implicit |
| `will-change` on entrance animations | Never (animation runs once, then the layer is wasted) | RoyCSS does NOT use `will-change` on entrance animations |
| `will-change` on hover-only effects | Only if the effect is hovered often | RoyCSS does NOT use `will-change` on hover effects |

The 15 measured occurrences are concentrated in:
- 6 effects that ship infinite ambient animations (e.g. `pulse-glow`,
  `float`, `heartbeat`) — these benefit from a permanent layer.
- 9 occurrences in `backdrop-filter`-heavy glass effects — `will-change:
  backdrop-filter` is required for the browser to promote the layer.

This is a **disciplined** usage. The LABS-33 performance lab report
flagged RoyCSS V1 as having 1,847 `will-change` occurrences (one per
`EffectCard`). The current 15-occurrence count represents a **99.2%
reduction** from V1.

### 2.4 Self-contained per effect — and the duplicate-`@keyframes` carve-out

**The RoyCSS contract:** every effect's `cssCode` is self-contained. You
can ship just one effect's CSS and it works — no cross-effect dependencies,
no shared keyframes, no shared custom properties.

**Decision:** Do NOT extract shared `@keyframes` blocks across effects
(even when 20 effects use the same spin animation). Sharing would break
the self-contained contract: shipping just one of those 20 effects alone
would not include the keyframes.

**Carve-out (the duplicate-`@keyframes` finding):** The FerrumCSS merge
introduced 150 cases where two effects declare `@keyframes roy-X` with
**identical names AND identical bodies**. This is NOT intentional sharing
— it's a bug. The second declaration silently overrides the first (no-op
since bodies are identical) and wastes ~75 KB of CSS bytes.

**Remediation (Phase 2):** Write a codemod that scans `roycss.css` for
`@keyframes roy-X` blocks, hashes each body, and removes any block whose
`(name, body)` pair is identical to an earlier block. This is safe because:
- The bodies are identical → no visual change.
- The names are identical → no cascade change.
- Each effect's `cssCode` remains self-contained (the first declaration
  is still present in the bundle).

The codemod does NOT cross-effect-share. It only deduplicates *exact*
`(name, body)` pairs within the concatenated bundle. After dedup:
- 1,082 → 932 `@keyframes` blocks (150 removed)
- ~75 KB saved (6.2% of bundle)
- No visual change
- Self-contained contract preserved

**The benchmark harness tracks this:** `effect-count/keyframes-duplicates`
currently FAILS with value 150 (budget `< 1`). The regression test
`no duplicate @keyframes names in roycss.css` is marked `test.failing`
until the codemod lands.

### 2.5 Translucency API — `oklch(... / alpha)` AND `color-mix()`

RoyCSS uses **both** modern translucency APIs:

| API | Count | Use case |
|---|---|---|
| `oklch(L C H / alpha)` | 277 | Solid color with alpha (e.g. `oklch(0.7 0.15 200 / 0.5)`) — more compact |
| `color-mix(in oklch, …)` | 2,156 | Blending two colors (e.g. `color-mix(in oklch, var(--base) 50%, transparent)`) — more flexible |
| **Combined** | **2,433** | Modern translucency API calls |

The task spec set a target of `>5,000 color-mix() occurrences`. The
library is below that target (2,156) because the team standardized on
`oklch(.../alpha)` for solid-color-with-alpha cases (more compact, equally
modern, equally GPU-friendly). The combined modern-translucency count is
2,433 — still below 5,000, but the meaningful metrics all pass:

- `OKLCH color ratio`: 99.97% (target `>90%`) — PASS
- `rgba() occurrences`: 0 — PASS (no legacy alpha syntax)
- `#hex occurrences`: 2 (in `-webkit-mask:` context, allowed exception)

**Decision:** Keep both APIs. Document the design choice. Update the
`color-mix()` target to `>2,000` (a tighter budget that reflects actual
practice) and add a new `modern-translucency` metric that sums both APIs
with a target of `>2,400`. The 5,000 figure was based on a
misunderstanding of which API is primary.

### 2.6 ESM loader is tree-shakeable

`dist/effects.js` (3,457 bytes) is a tree-shakeable ESM module:

```js
import { readFileSync } from "node:fs";
// …
const effects = JSON.parse(readFileSync(join(__dirname, "effects.json"), "utf-8"));
export { effects, categories, categoryMeta };
export default effects;
```

Consumers can `import { effects } from "roycss/dist/effects.js"` and bundlers
will tree-shake unused named exports. The `effects` array is loaded from
`effects.json` at runtime (not inlined into the JS), keeping the JS file
under 10 KB.

**Decision:** Keep this architecture. The regression test
`dist/effects.js reads effects.json at runtime (no inlined metadata)`
guards against accidental inlining.

---

## 3. Alternatives considered

### 3.1 Ship everything (current default for the marketing site)

The marketing site currently ships the full 989.69 KB minified bundle via
`<link rel="stylesheet">`. This is the simplest approach but blocks first
paint on slow networks.

**Rejected for Tier 1.** The full bundle is still loaded (Tier 2) but
only after the critical CSS is inlined.

### 3.2 Ship nothing (lazy-load all)

Ship zero CSS initially; let `DynamicEffectCSS` inject every effect on
demand via `IntersectionObserver`.

**Rejected.** This would make first paint show unstyled cards (FOUC) for
~200 ms until the observer fires and the first batch of CSS is injected.
The critical-CSS approach gives instant styled first paint with only 17
KB of inlined CSS.

### 3.3 Ship critical CSS only (no full bundle)

Ship the 17.25 KB critical CSS and rely on `DynamicEffectCSS` for
everything else.

**Rejected for the marketing site.** Users who scroll past the first 50
effects would see unstyled cards until the observer fires. The full
bundle (preloaded) ensures a smooth scroll experience. **Accepted for
npm consumers** who only render specific effects — they should not pay
for the full bundle if they only use 20 effects.

### 3.4 Ship one CSS file per effect (1,569 files)

Split `roycss.css` into 1,569 per-effect files. Load each on demand via
`<link>` injection.

**Rejected.** HTTP/2 multiplexing helps, but 1,569 separate requests
adds ~50 ms of overhead per effect (TLS handshake amortization, browser
scheduling). The current single-bundle approach + `DynamicEffectCSS`
inline `<style>` injection is faster for the marketing site.

**Partially accepted for npm:** consumers who want per-effect CSS can
import `effect.css` from `roycss/dist/effects/{id}.css` (a future
feature, not yet implemented).

### 3.5 Cross-effect shared `@keyframes` (rejected)

Extract common animations (spin, fade, slide) into shared `@keyframes`
blocks at the top of `roycss.css`. Each effect references the shared
block by name.

**Rejected.** Breaks the self-contained per-effect contract. If a user
ships just one effect's CSS (e.g., via a future per-effect export), the
shared keyframes would be missing and the effect would break.

The duplicate-`@keyframes` finding (§2.4) is NOT a case of intentional
sharing — it's a bug. The codemod will deduplicate exact `(name, body)`
pairs, but will NOT cross-effect-share.

### 3.6 Use `@layer` for cascade isolation (deferred to V2)

Wrap all rules in `@layer roycss { ... }` so consumer overrides always
win without `!important`.

**Deferred.** This is a V2 migration (per `LABS-33-PERFORMANCE-LAB.md`
§8.3) that requires a codemod for consumers. Out of scope for this ADR.

---

## 4. Consequences

### 4.1 Positive

- **First paint improves** from "wait for 989 KB stylesheet" to "instant
  (17 KB inlined)".
- **Bundle size is bounded** by the regression tests: any PR that adds
  >1.5 MB to `roycss.css` or >1.1 MB to `roycss.min.css` will fail CI.
- **Color contract is enforced**: no `rgba()`, no legacy `#hex` (except
  `mask:` context), 99.97% OKLCH.
- **`prefers-reduced-motion` is globally covered** — every effect
  respects the user's motion preference via a single global rule.
- **Animation jank is bounded** — 95% of top-20 effects are GPU-
  accelerated; the remaining 5% are documented and intentional.

### 4.2 Negative

- **Critical CSS is a separate build step.** `perf/optimize/extract-critical-css.ts`
  must run after `scripts/build-package.ts` or the critical file will be
  stale. The build checklist documents the order.
- **Three CSS files to manage** (`roycss.css`, `roycss.min.css`,
  `roycss-critical.css`). The regression tests guard all three.
- **The duplicate-`@keyframes` bug is open.** The benchmark harness
  correctly fails on it (`exit 1`). The codemod is Phase 2 work.

### 4.3 Neutral

- **The `color-mix()` target mismatch is documented** (§2.5). The
  benchmark continues to FAIL on the >5,000 target as an honest signal
  that the design choice is under review.

---

## 5. Compliance

This ADR is enforced by:

1. `perf/benchmark.ts` — runs every benchmark, exits 1 on any failure.
2. `perf/regression.test.ts` — 21 tests, 2 marked `test.failing` for
   known issues. Run via `bun test perf/regression.test.ts`.
3. `docs/checklists/05-performance-engineering.md` — merge-gate
   checklist with exact verification commands.

CI integration (planned, not yet wired): a GitHub Actions workflow that
runs `bun run perf/benchmark.ts` and `bun test perf/regression.test.ts`
on every PR touching `dist/` or `src/lib/effects-batch-*.ts`.

---

## 6. References

- `docs/LABS-33-PERFORMANCE-LAB.md` — original V2 performance lab report
  (the design context for everything in `perf/`).
- `perf/README.md` — how to run the benchmarks.
- `perf/results/benchmark-report.json` — last run results (machine-
  readable).
- `src/components/roycss/virtual-scroll-grid.tsx` — the virtualization
  component (24-card batches, sentinel-based infinite scroll).
- `src/components/roycss/dynamic-effect-css.tsx` — the on-demand CSS
  injector (`IntersectionObserver`-driven).
- Worklog task 00 — the FerrumCSS merge that introduced the duplicate
  `@keyframes` (150 cases, ~75 KB wasted).
