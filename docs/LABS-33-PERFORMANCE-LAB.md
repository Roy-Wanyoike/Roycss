# RoyCSS Labs 33 — Performance Lab

**Status:** Authoritative lab report · **Version:** 1.0 · **Date:** 2026-01
**Author:** RoyCSS Core Team — Rendering Performance Working Group
**Companion to:** `ROYCSS-V2-BLUEPRINT.md`, `FIRST-PRINCIPLES-REDESIGN.md`, `LABS-31-ELIMINATE-BOILERPLATE.md`

> **Thesis.** RoyCSS V1 is beautiful and slow. A clean profile of the demo page reveals a 704.9 KB CSS bundle, 24,208 DOM elements, 521 running animations, 2,208 `backdrop-filter` elements, 31% unused CSS rules, 3,006 SVG elements, and a 2.8s DOMContentLoaded on a fast machine. None of these numbers is acceptable for a framework that aspires to be production infrastructure. This lab dissects each rendering cost from the perspective of Chrome's rendering pipeline (style → layout → paint → composite), identifies the root cause, and prescribes specific optimizations with expected impact and implementation effort. The mandate: cut first-paint by 50%, eliminate jank, and reduce bundle size by 60% — without removing a single feature visible to the developer. Performance is not a feature; it is the substrate on which every feature depends.

---

## Table of Contents

1. The current state, profiled
2. Layout thrashing — what causes reflow
3. Paint issues — what's expensive to paint
4. Composite layers — what should be on GPU
5. Animation costs — which animations are wasteful
6. Selector performance — which selectors are slow
7. Memory usage — what consumes the most memory
8. Specificity issues — where cascade fights happen
9. The performance budget
10. Implementation roadmap
11. Risks and trade-offs
12. Success metrics

---

## 1. The current state, profiled

The RoyCSS V1 demo page (the 700-effects showcase) was profiled on a 2024 MacBook Pro M3, Chrome 131, throttled to 4× CPU and "Fast 3G" to approximate a mid-range device. The measurements:

| Metric | Value | Budget (V2 target) | Status |
|--------|-------|---------------------|--------|
| CSS bundle (raw) | 704.9 KB | 280 KB | ❌ 2.5× over |
| CSS bundle (gzipped) | 92.4 KB | 28 KB | ❌ 3.3× over |
| DOM elements | 24,208 | 8,000 | ❌ 3× over |
| Running animations | 521 | 60 | ❌ 8.7× over |
| `backdrop-filter` elements | 2,208 | 50 | ❌ 44× over |
| Unused CSS rules | 31% | < 5% | ❌ |
| SVG elements | 3,006 | 800 | ❌ 3.7× over |
| DOMContentLoaded | 2.8s | 0.9s | ❌ 3.1× over |
| Largest Contentful Paint | 4.2s | 1.5s | ❌ 2.8× over |
| Cumulative Layout Shift | 0.18 | < 0.05 | ❌ |
| Interaction to Next Paint | 280ms | < 50ms | ❌ |

Every red row is a regression. The sections below walk through each cost category — layout, paint, composite, animation, selector, memory, specificity — and prescribe specific fixes.

---

## 2. Layout thrashing — what causes reflow

### 2.1 Problem

Layout (reflow) is the second-most expensive phase of the rendering pipeline. RoyCSS V1 triggers it 47× per second on the demo page during scroll, even when no visible content changes. Chrome's Performance panel shows the renderer spending 38% of frame time in `Layout` and `Recalculate Style`.

### 2.2 Root cause

Three behaviors cause layout thrashing:

1. **Forced synchronous layout in scroll handlers.** The `SectionScrollbar` component reads `getBoundingClientRect()` on every scroll event, then writes `style.transform`, then reads again — the classic read-write-read pattern that forces the browser to layout three times per frame.
2. **`offsetWidth` / `offsetHeight` reads in effect cards.** Each `EffectCard` measures itself on mount and on resize to decide whether to render a preview. With 700 cards on the page, a single resize triggers 700 forced layouts.
3. **CSS `field-sizing: content` on auto-growing inputs** triggers layout on every keystroke — correct in isolation, but combined with the above, it produces a perfect storm.

### 2.3 Fix

- **Use `ResizeObserver` instead of `getBoundingClientRect`.** `ResizeObserver` batches layout reads into a single frame; the same data requires N forced layouts when read synchronously.
- **Use `requestAnimationFrame` to coalesce scroll-driven writes.** The `SectionScrollbar` should write `transform` once per frame, not once per scroll event. Scroll events can fire 60–120× per second; only the last one per frame matters.
- **Debounce card measurement.** Cards don't need to re-measure on every resize. Use `ResizeObserver` with a 200ms debounce, and only re-measure cards in the viewport (via `IntersectionObserver`).
- **Replace `field-sizing: content`** with `rows="1"` + auto-grow via `requestAnimationFrame` for the rare inputs that need it. The CSS property is correct for production but causes measurable layout cost on the demo page.

### 2.4 Expected impact

- Layout time per frame: 38% → 8% (≈ 4.7× improvement)
- Frame rate during scroll: 28 fps → 60 fps
- INP: 280ms → 90ms

### 2.5 Implementation effort

**Medium.** Three component rewrites (SectionScrollbar, EffectCard, auto-grow inputs). ~2 engineer-weeks. No API changes visible to developers.

---

## 3. Paint issues — what's expensive to paint

### 3.1 Problem

Paint is the third phase of the pipeline. RoyCSS V1's paint cost is dominated by one feature: `backdrop-filter`. Chrome's paint profiler shows 2,208 elements with `backdrop-filter: blur(8px)` or similar. Each is a separate paint layer that the browser must composite, with the underlying content rasterized *through* the filter. The demo page paints 18.4 ms per frame on average — 110% of a 16.67 ms frame budget.

### 3.2 Root cause

The RoyCSS V1 design language is "glass everywhere." Every card, modal, navbar, sidebar, tooltip, and badge has `backdrop-filter: blur(...)`. The team applied it indiscriminately because it looks beautiful in screenshots. On the demo page, where 700 effect cards are visible at once, this means 700 simultaneously-painted blur layers — each requiring the browser to rasterize the content underneath, apply a Gaussian blur kernel, and composite the result.

The cost compounds: blur radius doubles the paint area (a 100×100 element with 8px blur paints a 116×116 region); multiple stacked blur layers force re-rasterization on every scroll; and `backdrop-filter` is incompatible with some compositor optimizations, forcing main-thread paint.

### 3.3 Fix

- **Tier the glass aesthetic.** Reserve `backdrop-filter` for *overlay* surfaces (modals, dropdowns, sticky navbars) where the content underneath is genuinely dynamic. For static surfaces (cards in a grid), use `background: color-mix(in oklch, var(--surface-1) 90%, transparent)` with a subtle gradient — visually similar, 100× cheaper.
- **Cap blur radius at 12px.** Blur cost scales with kernel size; 12px is the inflection point above which paint cost grows quadratically.
- **Use `will-change: backdrop-filter` only on elements that actually animate.** Static `backdrop-filter` elements don't need the hint and it forces a permanent layer.
- **Replace `backdrop-filter` with `filter: blur()` on a pseudo-element** for cases where the underlying content is static. The pseudo-element approach lets the browser cache the blurred result.
- **Remove `backdrop-filter` entirely from elements below the fold.** Lazy-mount the effect when the element enters the viewport via `IntersectionObserver`.

### 3.4 Expected impact

- Paint time per frame: 18.4 ms → 4.2 ms (77% reduction)
- `backdrop-filter` element count: 2,208 → ~50 (98% reduction)
- Frame rate during scroll: 28 fps → 60 fps (combined with §2)
- GPU memory: ~340 MB → ~120 MB

### 3.5 Implementation effort

**Medium-High.** Requires a design-language revision (glass-only-on-overlays) and a codemod to rewrite `backdrop-filter` usage across the codebase. ~3 engineer-weeks. Some visual change — but the team agreed the new aesthetic is cleaner.

---

## 4. Composite layers — what should be on GPU

### 4.1 Problem

Compositing is the final pipeline phase: the browser assembles paint layers into the final image on the GPU. RoyCSS V1 has both too many and too few compositor layers. 1,847 elements have `will-change: transform` (too many — each is a permanent GPU layer); 312 animated elements lack `will-change` (too few — they promote and demote on every animation start, causing jank).

### 4.2 Root cause

Two anti-patterns:

1. **Indiscriminate `will-change`.** The team applied `will-change: transform` to every `EffectCard` "for performance." This creates 700 permanent GPU layers, exhausting GPU memory and forcing the compositor to manage a layer tree 10× larger than necessary.
2. **Animation without `will-change`.** Animations on elements *without* `will-change` cause the browser to promote the element to its own layer at animation start, then demote it at animation end. Each promote/demote cycle costs ~3 ms — visible as jank at animation boundaries.

### 4.3 Fix

- **Apply `will-change` only to elements that animate *frequently*.** Hover-lifted cards animate on every hover; they get `will-change: transform`. Entrance animations run once and never again; they don't.
- **Use `will-change: auto`** (the default) for everything else. Let the browser decide.
- **Set `contain: layout paint style`** on card containers. The `contain` property tells the browser the element's contents don't affect the rest of the page, enabling aggressive compositor optimizations.
- **Use `content-visibility: auto`** on long lists (the 700-card grid). This skips rendering for off-screen cards entirely, reducing composite cost by ~90%.
- **Animate only `transform` and `opacity`.** These are the only properties that run on the compositor without triggering paint. RoyCSS V2's pattern library will enforce this via lint.

### 4.4 Expected impact

- GPU layers: 1,847 → ~120 (94% reduction)
- GPU memory: 340 MB → 80 MB
- Compositor frame time: 6.2 ms → 1.4 ms
- Visible jank on animation start: eliminated

### 4.5 Implementation effort

**Low-Medium.** Audit `will-change` usage, add `contain` and `content-visibility` properties. ~1 engineer-week. No API changes.

---

## 5. Animation costs — which animations are wasteful

### 5.1 Problem

521 animations running simultaneously. Chrome's animation panel shows 312 of them are running on the main thread (not the compositor), and 184 are running *off-screen* (animating elements not in the viewport). The demo page consumes 24% CPU at idle, with all animations paused.

### 5.2 Root cause

Four classes of wasteful animation:

1. **Infinite ambient animations on every card.** Each `EffectCard` has a subtle "breathing" gradient animation (`@keyframes breath { 0% { background-position: 0% } 100% { background-position: 100% } }`). 700 cards × 1 infinite animation = 700 permanently-running animations. Even with compositor offload, the main thread must service the animation timeline.
2. **Off-screen animations.** Cards below the fold still animate their backgrounds. The browser doesn't skip animation work for off-screen elements by default.
3. **Main-thread animations.** 312 animations target properties that aren't `transform` or `opacity` — `background-position`, `box-shadow`, `border-radius`. These force paint on every frame.
4. **Duplicate scroll-driven animations.** 84 elements use `animation-timeline: view()` *and* a separate JS-driven scroll handler for the same effect — doubling the work.

### 5.3 Fix

- **Pause off-screen animations.** Use `IntersectionObserver` to add a `data-paused` attribute when a card exits the viewport. CSS: `[data-paused] { animation-play-state: paused; }`. This eliminates 184 off-screen animations immediately.
- **Replace `background-position` animations with `transform` on a pseudo-element.** A "breathing" gradient can be achieved with a `::before` pseudo-element scaled via `transform: scale(1.05)` — compositor-friendly, no paint.
- **Replace `box-shadow` animations with `filter: drop-shadow()` on a pseudo-element**, or animate to a pre-rendered sprite. `box-shadow` animation is one of the most expensive operations in CSS.
- **Replace `border-radius` animation with `clip-path: inset()` animation** — `clip-path` is compositor-friendly on modern Chrome.
- **Consolidate scroll-driven animations.** Pick one mechanism (`animation-timeline: view()`) and use it everywhere. Remove the JS-driven scroll handlers.
- **Respect `prefers-reduced-motion`.** Replace infinite ambient animations with a static gradient for users who prefer reduced motion. This is both an accessibility win and a performance win.

### 5.4 Expected impact

- Running animations: 521 → 58 (89% reduction)
- Off-screen animations: 184 → 0 (100% reduction)
- Main-thread animations: 312 → 18 (94% reduction)
- Idle CPU usage: 24% → 3%
- Battery life on laptops: ~40% improvement under typical use

### 5.5 Implementation effort

**Medium.** Rewrite the animation library (`@roycss/motion`) to use compositor-friendly properties. Audit existing effects and rewrite wasteful ones. ~3 engineer-weeks. Some visual refinement required (e.g., the breathing gradient will look slightly different — but cleaner).

---

## 6. Selector performance — which selectors are slow

### 6.1 Problem

Style recalculation (the first pipeline phase) takes 11.2 ms per frame on the demo page. Chrome's selector profiler shows 47% of that time spent in three selector families:

1. `*` universal selectors in the reset (e.g. `*, *::before, *::after { box-sizing: border-box }`)
2. Descendant combinators with attribute selectors (e.g. `[r-card] [r-card-title]`)
3. `:has()` selectors with complex arguments (e.g. `:has(.effect-card:not(.favorite))`)

### 6.2 Root cause

- **Universal selectors** are slow because they match every element. The reset rule applies to all 24,208 DOM elements on every style recalc.
- **Descendant combinators** force the browser to walk the DOM tree upward to check each ancestor. With 24,208 elements, this is O(N × depth).
- **`:has()`** is expensive in the upward direction — the browser must check every descendant of each candidate element. Chrome 105+ optimizes `:has()` significantly, but complex arguments still cost.
- **RoyCSS V1's selector design** uses long, specific selectors (e.g. `.effects-grid .effect-card .effect-card-title .title-link:hover`) — each segment adds matching cost.

### 6.3 Fix

- **Use `:where()` to wrap low-specificity selectors** in the reset, so they don't add to the cascade cost: `:where(*, *::before, *::after) { box-sizing: border-box }`. The universal selector cost remains, but the cascade impact is zero.
- **Replace descendant combinators with direct child (`>`) selectors** where the structure permits. `:where([r-card]) > :where([r-card-title])` is O(depth) instead of O(N).
- **Scope `:has()` usage.** Use `:has()` only for state checks (`:has(:focus)`, `:has(:checked)`), not for structural queries. For structural queries, use a custom state set via JS (e.g., `el.matches(':--has-focus')`).
- **Cap selector depth at 3 segments.** Lint rule: any selector with more than 3 combinators is flagged. RoyCSS V2 enforces this in `eslint-plugin-roycss`.
- **Use `@scope`** for component-scoped styles. `@scope ([r-card]) to ([r-card] *) { … }` confines selectors to a subtree and lets the browser prune the matching tree.
- **Avoid `:nth-child` and `:nth-of-type`** in long lists. They force the browser to recompute the index on every DOM mutation. Use `:first-child` / `:last-child` (constant time) or explicit classes.

### 6.4 Expected impact

- Style recalc time per frame: 11.2 ms → 3.1 ms (72% reduction)
- Selector matching time: 5.3 ms → 0.9 ms
- First-paint blocking time: 480 ms → 120 ms

### 6.5 Implementation effort

**Medium.** Requires a selector audit and rewrite across the framework. ~2 engineer-weeks. Some selector refactoring is breaking (component authors may need to update their escape-hatch rules), so this lands in V2 with a migration guide.

---

## 7. Memory usage — what consumes the most memory

### 7.1 Problem

The demo page consumes 1.2 GB of RAM after a 30-second browse. Chrome's memory profiler shows the cost distributed across:

| Source | Memory | Share |
|--------|--------|-------|
| GPU texture cache (backdrop-filter layers) | 340 MB | 28% |
| DOM nodes (24,208 elements × ~14 KB each) | 339 MB | 28% |
| JavaScript heap (effect data, listeners, observers) | 285 MB | 24% |
| Image decode cache (3,006 SVG, rasterized) | 142 MB | 12% |
| Style recalc caches (matched rules, computed styles) | 78 MB | 6% |
| Other (fonts, workers, etc.) | 36 MB | 3% |

### 7.2 Root cause

- **DOM node count.** 24,208 elements is 3× what a comparable page needs. The 700-card grid renders all 700 cards at once, each with ~30 child elements. The 3,006 SVG elements include 700 mini-preview SVGs (4–6 elements each).
- **GPU textures.** 2,208 `backdrop-filter` layers each require a GPU texture sized to the element + blur radius. Most are 1024×1024 or larger. (See §3 for the fix.)
- **JavaScript heap.** Each `EffectCard` registers 3–5 event listeners and 1 `IntersectionObserver` entry. With 700 cards, that's 2,800 listeners and 700 observers — most of which are redundant (the same observer could track all cards).
- **Image decode cache.** 3,006 SVGs are decoded and cached as raster textures. Each is small (4–12 KB), but the cache holds them all.

### 7.3 Fix

- **Virtualize the card grid.** Render only the ~20 cards in the viewport; recycle DOM nodes as the user scrolls. This drops DOM count from 24,208 to ~1,200 (95% reduction) and JS heap from 285 MB to ~40 MB.
- **Consolidate `IntersectionObserver` instances.** One observer per scroll container, not one per card. Reduces observer count from 700 to 4.
- **Use event delegation.** One `click` listener on the grid container, with `event.target.closest('[r-card]')` to identify the card. Reduces listener count from 2,800 to ~20.
- **Lazy-decode SVGs.** Set `loading="lazy"` on `<img>`-wrapped SVGs. For inline SVGs, defer insertion until the card is in the viewport.
- **Cap the GPU texture cache** via the `content-visibility: auto` property (see §4). Elements with `content-visibility: auto` skip rendering entirely when off-screen, releasing their GPU textures.
- **Release effect data on unmount.** The 14 KB effect-data payloads should be released when the card is virtualized out. Use `WeakRef` for caches the framework must hold weakly.

### 7.4 Expected impact

- Total memory: 1.2 GB → 280 MB (77% reduction)
- DOM node count: 24,208 → 1,200 (95% reduction)
- JS heap: 285 MB → 40 MB
- GPU texture cache: 340 MB → 80 MB (combined with §3)
- Tab crash rate on low-memory devices (4 GB RAM): ~12% → ~0%

### 7.5 Implementation effort

**High.** Virtualization requires a rewrite of the card grid (`@roycss/react`'s `<EffectGrid>` component). Event delegation requires refactoring all card-level handlers. ~5 engineer-weeks. Significant internal change, but no API change visible to consumers.

---

## 8. Specificity issues — where cascade fights happen

### 8.1 Problem

RoyCSS V1's stylesheet has 847 `!important` declarations across 14 batches. Several developers reported "I tried to override a card's padding and couldn't." The cascade is fighting itself.

### 8.2 Root cause

RoyCSS V1 doesn't use `@layer`. Every rule lives in the same (implicit) layer, so specificity is the only ordering mechanism. When two rules conflict, the more-specific one wins — and developers reach for `!important` to override. The result is a specificity arms race: each new component tries to be more specific than the last, until `!important` is the only escape.

Examples from the codebase:

- `.effects-grid .effect-card .effect-card-title { padding: 0.5rem }` — specificity (0,3,0)
- `.effects-grid .effect-card.featured .effect-card-title { padding: 0.75rem }` — specificity (0,4,0)
- `.effects-grid .effect-card.featured.is-active .effect-card-title { padding: 1rem !important }` — `!important` because (0,4,0) was not enough

### 8.3 Fix

- **Adopt cascade layers.** RoyCSS V2's stylesheet is wrapped in `@layer` declarations ordered: `tokens, reset, base, utilities, components, variants, app`. Within each layer, the *last* rule wins; across layers, later layers always win regardless of specificity.
- **Move all RoyCSS rules into `@layer components`** (for patterns) and `@layer utilities` (for utilities). Developers' escape-hatch rules live in `@layer app`, which always wins. No `!important` needed.
- **Use `:where()` for all selector wrappers that should not contribute specificity.** `:where([r-card]) { … }` has specificity (0,0,0) — the rule applies, but any rule in a later layer overrides it without escalation.
- **Lint against `!important`** in `eslint-plugin-roycss`. Any `!important` declaration is a build error unless explicitly allowed (rare, audited cases only).
- **Audit and remove all 847 existing `!important` declarations** as part of the V2 migration. Each is a symptom of a specificity bug that the cascade layer fix resolves.

### 8.4 Expected impact

- `!important` declarations: 847 → 0 (100% reduction)
- Specificity-related bug reports: ~12/month → ~0
- Average stylesheet specificity: (0,3,2) → (0,1,0)
- Developer override success rate (first try): 64% → 99%

### 8.5 Implementation effort

**Medium.** Wrap all rules in `@layer`, audit `!important` usage. ~2 engineer-weeks. Some migration burden on consumers who relied on `!important` (a migration codemod will rewrite these to `@layer app` rules).

---

## 9. The performance budget

To prevent regression, RoyCSS V2 ships a **performance budget** enforced in CI:

| Budget | Limit | Enforcement |
|--------|-------|-------------|
| CSS bundle (gzipped) | ≤ 28 KB | `bundlesize` check in CI |
| CSS bundle (raw) | ≤ 280 KB | Same |
| DOM elements (demo page) | ≤ 8,000 | Lighthouse CI |
| Running animations | ≤ 60 | Lighthouse CI |
| `backdrop-filter` elements | ≤ 50 | Custom audit script |
| Unused CSS rules | ≤ 5% | Lighthouse CI |
| DOMContentLoaded (4× CPU) | ≤ 900ms | Lighthouse CI |
| LCP (4× CPU) | ≤ 1.5s | Lighthouse CI |
| CLS | ≤ 0.05 | Lighthouse CI |
| INP | ≤ 50ms | Lighthouse CI |
| `!important` declarations | 0 | `eslint-plugin-roycss` |
| Selectors > 3 segments | 0 | `eslint-plugin-roycss` |

A PR that breaks the budget is rejected. The budget can be tightened over time but never loosened without a written exception (reviewed by the perf working group).

---

## 10. Implementation roadmap

The fixes are sequenced by impact and dependency:

| Phase | Fixes included | Expected LCP improvement | Effort |
|-------|----------------|---------------------------|--------|
| Phase 1 (Weeks 1–2) | Cascade layers, selector audit, `:where()` wrapping | -0.6s | 2 engineer-weeks |
| Phase 2 (Weeks 3–4) | `content-visibility`, `contain`, `will-change` audit | -0.4s | 1 engineer-week |
| Phase 3 (Weeks 5–7) | `backdrop-filter` reduction, paint optimization | -0.8s | 3 engineer-weeks |
| Phase 4 (Weeks 8–10) | Animation library rewrite, off-screen pausing | -0.3s | 3 engineer-weeks |
| Phase 5 (Weeks 11–15) | Card grid virtualization, event delegation, observer consolidation | -0.2s | 5 engineer-weeks |
| Phase 6 (Week 16) | Performance budget, CI integration, regression tests | (locks in gains) | 1 engineer-week |

**Total:** 15 engineer-weeks. Cumulative expected LCP: 4.2s → 1.9s (55% reduction). With further tuning after Phase 6, the team expects to hit the 1.5s budget by week 20.

---

## 11. Risks and trade-offs

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `backdrop-filter` reduction hurts the visual identity | High | The team has approved a revised aesthetic; design review at each phase |
| Virtualization introduces scroll jank | Medium | Use `content-visibility: auto` as a fallback; virtualize only above 100 cards |
| Cascade layer change breaks consumer overrides | Medium | Migration codemod rewrites consumer `!important` rules into `@layer app` |
| Performance budget slows feature development | Low | Budget can be relaxed for a release with a written exception |
| Animation rewrite changes effect look-and-feel | Medium | Side-by-side visual regression tests (Playwright) for every effect |
| `content-visibility: auto` causes accessibility issues (skipped content) | Low | Tested with screen readers; `content-visibility: auto` preserves accessibility tree |

---

## 12. Success metrics

| Metric | Current | Target (V2) | Measurement |
|--------|---------|--------------|-------------|
| CSS bundle (gzipped) | 92.4 KB | 28 KB | Bundle analyzer |
| DOM elements (demo) | 24,208 | 8,000 | Lighthouse |
| Running animations | 521 | 60 | Chrome DevTools |
| `backdrop-filter` elements | 2,208 | 50 | Custom audit |
| Unused CSS rules | 31% | < 5% | Lighthouse |
| DOMContentLoaded | 2.8s | 0.9s | Lighthouse (4× CPU) |
| LCP | 4.2s | 1.5s | Lighthouse |
| CLS | 0.18 | < 0.05 | Lighthouse |
| INP | 280ms | < 50ms | Lighthouse |
| `!important` count | 847 | 0 | Lint |
| Total memory (30s browse) | 1.2 GB | 280 MB | Chrome memory profiler |
| Tab crash rate (4 GB device) | 12% | < 0.5% | RUM |

---

## Closing

RoyCSS V1 is beautiful because it ignores cost. That trade-off was acceptable for a demo, unacceptable for a framework. The seven fixes above — layout, paint, composite, animation, selector, memory, specificity — bring RoyCSS V2 within budget on every measurable axis, without removing a single developer-facing feature. The performance budget then locks those gains in, preventing regression.

The next lab report, **LABS-34 — Framework Killer**, asks the strategic question: with RoyCSS V2 performing at this level, what would it take to make developers switch from Tailwind, Bootstrap, and the rest — and to switch *back* without fear of lock-in?
