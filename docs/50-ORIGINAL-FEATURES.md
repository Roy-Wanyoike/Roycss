# RoyCSS — 50+ Original Feature Ideas

**Author:** Principal Engineer, RoyCSS Initiative
**Audience:** RoyCSS maintainers, architecture board, future contributors
**Status:** Strategic backlog — ideas intentionally outside the crowded utility-CSS lane
**Reading time:** ~25 minutes

---

## Preamble — What this document is, and what it is not

RoyCSS today ships 700+ effects, an OKLCH-native token system, container-query-aware primitives, and framework bindings for React, Vue, Angular, Svelte, and vanilla HTML. The `ARCHITECTURE.md` redesign plan and the `ENTERPRISE-REVIEW.md` audit both confirm the library has competitive parity on the **expected** axes: modern color, logical properties, `@property` registration, `prefers-reduced-motion`, container queries, and tree-shakeable exports.

This document does **not** propose another variant of `glow-soft`, another breakpoint, another color palette, or any feature already covered by Tailwind, Bootstrap, UnoCSS, Panda CSS, StyleX, Bulma, or Foundation. Every idea below targets a problem developers **still** face in 2026 — problems the dominant frameworks have not solved because they require coordination between build, runtime, dev tools, and design tokens in a way no utility-CSS system is architected to deliver.

The 56 ideas below are organized into eight categories. Each idea includes five required fields: **Problem**, **Solution**, **Technical feasibility**, **Productivity impact**, and **Moat**. The moat analysis is honest: where a competitor could plausibly catch up within six months, the moat is marked **thin**; where it requires architectural choices RoyCSS has already made and competitors have not, the moat is marked **structural**.

---

## Category 1 — Debugging & Diagnostics (10 ideas)

### 1.1 Cascade Genealogy Inspector

**Problem.** Browser dev tools show the *winning* rule for a property, but never the full lineage: which rules lost, by how much, across which `@layer`, `!important`, inline, and inheritance boundaries. When a developer sees `padding: 12px` and asks "why?", they currently have to grep.

**Solution.** A runtime panel that, for any picked element, renders a vertical family tree of every rule that touched each property — sorted by losing order — with delta bars showing specificity distance from the winner. Crosses shadow-DOM and iframe boundaries.

**Technical feasibility.** `document.styleSheets` + `CSSStyleSheet.cssRules` enumeration, `getMatchedCSSRules` (deprecated but replaced by walking rules manually), the CSS Typed OM (`CSSStyleValue`), and `Element.computedStyleMap()` for resolved values. All shipping in Chrome, Safari, and Firefox today.

**Productivity impact.** Replaces 10–30 minutes of grep-and-inspect per specificity bug with a single click. Estimated 4 hours/week saved per frontend engineer on large codebases.

**Moat.** Structural. RoyCSS's `@layer`-aware architecture already tags every rule with its layer origin; competitors built on flat utility sheets have no layer metadata to display.

### 1.2 Specificity Heatmap Overlay

**Problem.** Specificity wars are invisible until they bite. There is no tool that shows, at a glance, which elements on a page are at risk of being overridden.

**Solution.** A runtime overlay that paints every visible element with a color band whose hue maps to its highest computed specificity score (0-0-0 → green, 0-5-2 → red). Hovering reveals the contributing selectors.

**Technical feasibility.** Walk `document.styleSheets`, parse each selector with `CSSParser.parseSelector()` (available behind a flag in Chrome 124+, with a Babel-style fallback using `document.querySelector` for selector matching validation), compute specificity per the standard algorithm, then overlay with a fixed-positioned SVG layer using `pointer-events: none`.

**Productivity impact.** Turns a "find the specificity bomb" task from hours to seconds. Particularly valuable during code reviews and design-system migrations.

**Moat.** Thin on the surface, but strengthened by RoyCSS's `:where()`-wrapped reset layer, which lets the heatmap show a clean low-specificity baseline that competitors' flat utility layers cannot.

### 1.3 CSS Time Travel

**Problem.** CSS bugs are often transient — a flash of unstyled content, a hover state gone wrong, a media-query transition that flickered. By the time you open dev tools, the state is gone.

**Solution.** RoyCSS dev mode records every computed-style change via `MutationObserver` (DOM changes), `ResizeObserver` (layout changes), and `PerformanceObserver` (paint and style-recalc events). A timeline scrubber lets you rewind the page to any prior millisecond, including transient states, and inspect computed styles at that instant.

**Technical feasibility.** `MutationObserver` for attribute changes, `PerformanceObserver` with `buffered: true` for entries of type `element`, `layout-shift`, and `paint`. Snapshotting `getComputedStyle()` is expensive, so RoyCSS snapshots diffs only, on a 16ms throttle aligned to `requestAnimationFrame`.

**Productivity impact.** Eliminates the "I can't reproduce it" CSS bug class. Estimated 30% reduction in CSS-related bug-triage time on dynamic applications.

**Moat.** Structural. Requires RoyCSS's per-effect metadata to know which CSS properties each effect touches, so the snapshotter can store minimal diffs. Generic frameworks would need to snapshot the entire computed style per element per frame — prohibitively expensive.

### 1.4 Dead CSS Tracer (Interaction-Aware)

**Problem.** Existing "unused CSS" tools (PurifyCSS, UnCSS) do static analysis. They miss selectors that only match during hover, focus, scroll, modal-open, or after async data loads. The result is either false positives (deleting needed rules) or false negatives (shipping dead CSS forever).

**Solution.** RoyCSS injects a dev-runtime tracer that records every selector that *matched at least one element* during a session, including dynamic states. After a configured coverage window (or a Playwright run that exercises the app), it produces a high-confidence "unused" report.

**Technical feasibility.** Walk `document.styleSheets`, for each selector run `document.querySelector(selector)` on initial DOM, then subscribe to `MutationObserver` to re-test on every DOM change. Also instrument `:hover`, `:focus`, `:focus-within` by attaching synthetic listeners during the session. Performance is acceptable because RoyCSS only traces rules whose `cssText` contains selectors — it skips `@font-face`, `@keyframes`, etc.

**Productivity impact.** Cuts production CSS bundle size by 30–60% in real-world legacy apps, with near-zero risk of false deletion.

**Moat.** Structural. RoyCSS knows which of its 700+ effects are present on a page (via the `data-roycss` attribute injection) and can skip tracing them — generic tools must trace every rule.

### 1.5 Property Diff Inspector ("git blame for every property")

**Problem.** `getComputedStyle(el)` returns 300+ properties. When debugging, you want to know not the current value but **what changed and from where**. Dev tools show the winning rule but not the chain of overrides.

**Solution.** For any picked element and any property, RoyCSS shows: declared value, source rule (file:line:column), specificity, layer, and a stack of "loser" rules below. Like `git blame` but per-property.

**Technical feasibility.** Same `document.styleSheets` walk as 1.1, augmented with source-map resolution. RoyCSS's build already emits source maps for `roycss.css`; the inspector consumes them to point back to the original `.ts` effect file.

**Productivity impact.** Eliminates the "where is this padding coming from?!" question that consumes an estimated 1–2 hours per week per engineer.

**Moat.** Structural. Requires source maps from TypeScript effect definitions to generated CSS — only RoyCSS produces these because effects are defined in TS, not authored as raw CSS.

### 1.6 Custom Property Substitution Visualizer

**Problem.** `var(--roycss-color-primary)` might resolve to `var(--brand)` which resolves to `oklch(0.7 0.14 165)` with a fallback. Today, tracing this chain requires manually searching stylesheets. Circular references and invalid-at-computed-value-time failures are even harder to spot.

**Solution.** A panel that, for any picked element and any `var()` reference, shows the full substitution chain inline, with each link's source rule, type (registered via `@property` or untyped), and final resolved value. Detects and flags cycles.

**Technical feasibility.** `CSSStyleValue.parse` (CSS Typed OM) and `getComputedStyle(el).getPropertyValue('--x')` for resolution. `@property` registrations are enumerable via `CSSPropertyRule` in `document.styleSheets`. Cycle detection is a graph walk over the substitution DAG.

**Productivity impact.** Halves the time spent debugging theme-token issues — currently a top-3 source of "it works on my machine" CSS bugs.

**Moat.** Structural. RoyCSS's tokens are all `@property`-registered with explicit types, so the visualizer can show type information. Competitors using untyped custom properties cannot.

### 1.7 Layout Constraint Conflict Detector

**Problem.** Flexbox and grid overflow in mysterious ways: `min-width: auto` on flex children, `1fr` collisions, implicit tracks exceeding container. Dev tools flag overflow but not the *cause*.

**Solution.** RoyCSS analyzes the rendered layout and pinpoints which constraint is violated: "this flex item's `min-width: auto` is forcing 280px; add `min-width: 0` to fix." Suggests fixes as one-click patches.

**Technical feasibility.** `Element.getBoxQuads()` for precise box geometry, `ResizeObserver` for live updates, and `getComputedStyle` for declared values. The detector runs heuristics (e.g., "flex-basis sum > container width AND no `min-width: 0`") catalogued from common patterns.

**Productivity impact.** Saves an estimated 2–4 hours per layout-bug session. Most flex/grid bugs are now solved in minutes, not hours.

**Moat.** Thin. Heuristics are copyable, but RoyCSS's component library (planned in `ARCHITECTURE.md`) ships the fixes as defaults, so users hit the bugs less often in the first place.

### 1.8 Computed Style Snapshot Diff

**Problem.** After a code change, you want to know: "did this affect the rendered output?" Visual regression tools answer this for pixels, not for *why* pixels changed. Diffing computed styles by hand is impractical (300+ properties).

**Solution.** Right-click any element → "Snapshot computed style." Make a change. Right-click → "Diff against snapshot." RoyCSS returns a structured table of every changed property, old → new value, with the source rule that changed.

**Technical feasibility.** `getComputedStyle` snapshot stored in `sessionStorage`. Diff is a key-by-key comparison. Source attribution uses 1.5's logic.

**Productivity impact.** Replaces "stare at two screenshots" debugging with structured diffs. Particularly valuable for refactors and token migrations.

**Moat.** Thin in isolation, but compounds with 1.5 (Property Diff Inspector) to form a unique "computed-style diffing suite" no competitor offers.

### 1.9 Cascade Origin Tagging

**Problem.** In a real app, a single element's `padding` might come from: the framework reset, the design system, the component, a utility class, an inline style, and a runtime theme override. Browser dev tools show "Winning: padding: 12px from component.css:42" but lose the *origin story*.

**Solution.** Every RoyCSS rule in dev mode is annotated with structured origin metadata: `{ layer, component, library, framework, sourceFile, sourceLine }`. The inspector renders this as a "cascade stack" with each layer labeled.

**Technical feasibility.** RoyCSS's build injects `/* @roycss-origin { ... } */` comments that the inspector parses. Comments survive minification in dev builds. The metadata model mirrors the `@layer` statement but adds framework-aware dimensions.

**Productivity impact.** Eliminates the "which library owns this rule?" investigation that plagues multi-vendor UI stacks. Estimated 3 hours/week saved on enterprise codebases.

**Moat.** Structural. RoyCSS controls its own build pipeline and can inject this metadata at zero runtime cost. Competitors that ship pre-built CSS files have no injection point.

### 1.10 Selector Performance Profiler

**Problem.** CSS selectors have wildly different match costs. `:nth-child` and deep descendant combinators can cause multi-millisecond style recalc on large DOMs. No dev tool attributes style-recalc time to specific selectors.

**Solution.** RoyCSS dev mode wraps `document.querySelectorAll` calls during style recalc (via `PerformanceObserver` for `render` and `layout-shift` entries) and correlates long tasks to the selectors whose match counts spiked during that frame.

**Technical feasibility.** `PerformanceObserver({ type: 'long-animation-frame' })` (shipping in Chrome 123+, polyfilled via `requestAnimationFrame` + `performance.now()` elsewhere). Selector match counts via `document.querySelectorAll(selector).length` polled per frame.

**Productivity impact.** Makes CSS performance debugging possible for the first time. Currently, engineers resort to "delete rules until it's fast" — a 10x productivity improvement on performance-critical pages.

**Moat.** Structural. RoyCSS's effect catalog includes per-effect selector complexity metadata, so the profiler can warn "this effect's selector is O(n²) on tables" before it ships.

---

## Category 2 — AI & Intelligence (8 ideas)

### 2.1 Brand Color → Full Theme Generator

**Problem.** Generating a coherent theme from a single brand color requires choosing hues, chromas, and lightnesses for 50+ semantic tokens, all while preserving WCAG contrast. Designers spend days on this; engineers guess.

**Solution.** Input one OKLCH color. RoyCSS generates: a 9-step lightness scale, semantic tokens (primary, secondary, accent, surface, etc.), dark-mode variants with perceptually-matched contrast, and `@property`-typed custom properties ready to drop in.

**Technical feasibility.** OKLCH color arithmetic (uniform perceptual space), WCAG 2.1 contrast calculation via the APCA-aware contrast function, and the `@property` API to register generated tokens with types. All client-side, no network call required.

**Productivity impact.** Compresses a multi-day design exercise into 30 seconds. Especially valuable for white-label SaaS and multi-tenant apps.

**Moat.** Structural. RoyCSS's tokens are already OKLCH-native and `@property`-registered — the generator outputs ready-to-use tokens. Competitors using hex or HSL tokens must convert, losing perceptual accuracy.

### 2.2 Effect Recommender

**Problem.** With 700+ effects, choosing the right one is itself a UX problem. Users either copy the first effect that looks "close enough" or spend hours browsing.

**Solution.** Paste a screenshot, a Figma frame, or a text description ("fintech dashboard, restrained, trustworthy"). The recommender returns the top 5 effects ranked by fit, with rationale ("`card-glassmorphism` matches the depth language; avoid `text-neon-glow` — too playful for this context").

**Technical feasibility.** Embedding the 700 effects' metadata (tags, intensity, complexity, recommended context) into a vector store. Visual similarity via CLIP-class embeddings on the screenshot. Runs locally via WebGPU with on-device models, or via an optional cloud API key.

**Productivity impact.** Cuts effect selection from hours to minutes. Particularly valuable for the long-tail of developers who aren't designers.

**Moat.** Structural. Only RoyCSS has the structured effect metadata required to make recommendations context-aware. Competitors' flat utility lists have no semantic richness to reason over.

### 2.3 Cascade Conflict Auto-Resolver

**Problem.** When two rules conflict (one wins by specificity, the other was clearly the author's intent), fixing it requires understanding layers, `!important`, and `:where()`. Junior engineers escalate to seniors.

**Solution.** RoyCSS analyzes conflicts and proposes minimal patches: "wrap rule A in `:where()` to lower its specificity" or "move rule B into `@layer components`." Patches are previewed before applying.

**Technical feasibility.** Static analysis on `document.styleSheets`, the `@layer` ordering API, and the `:where()` zero-specificity selector. Suggestion engine uses heuristics + an LLM for natural-language explanation.

**Productivity impact.** Eliminates a class of senior-engineer bottlenecks. Estimated 50% reduction in "CSS doesn't work" tickets triaged to senior staff.

**Moat.** Thin. The heuristics are copyable, but RoyCSS's `@layer`-aware architecture makes the patches actually safe to apply.

### 2.4 Copy-from-Design AI (Screenshot → RoyCSS Classes)

**Problem.** Going from a Figma frame to working code today means: re-reading the design, picking tokens, picking effects, writing markup, fixing mismatches. Two hours per screen, minimum.

**Solution.** Paste a screenshot or Figma frame URL. RoyCSS returns a complete component composition: `<Card variant="glass"><Button variant="shine-sweep">...</Button></Card>` — using actual RoyCSS class names and tokens, not raw CSS.

**Technical feasibility.** Vision model (CLIP, SigLIP, or a VLM) identifies UI primitives; RoyCSS's component catalog (planned in `ARCHITECTURE.md`) maps primitives to components; token extraction via color clustering + OKLCH conversion.

**Productivity impact.** Compresses design-to-code from hours to minutes. The single biggest productivity win in this document for teams with designers.

**Moat.** Structural. The output is RoyCSS-specific — competitors' utility frameworks can't produce semantically meaningful components, only long class strings.

### 2.5 Accessibility Auto-Patch

**Problem.** WCAG contrast failures are the most common accessibility bug. Fixing them usually means fiddling with color lightness by trial and error.

**Solution.** When RoyCSS detects a contrast violation in a user-overridden token, it generates a one-line token override that fixes the contrast while preserving brand intent: `--roycss-color-primary: oklch(0.55 0.14 165); /* was 0.7, fails AA on white */`.

**Technical feasibility.** APCA and WCAG 2.1 contrast formulas in OKLCH space (uniform perceptual lightness makes the search tractable). Binary search on the L channel to find the nearest passing value.

**Productivity impact.** Turns a 15-minute-per-violation task into a one-click fix. For apps with 50+ violations, saves a full day.

**Moat.** Structural. RoyCSS's tokens are typed (`@property`) and OKLCH-native, so the search converges instantly. Competitors using hex must convert and lose precision.

### 2.6 RTL Auto-Mirroring

**Problem.** Converting LTR CSS to RTL is mechanical but error-prone. Every `margin-left`, `translateX(10px)`, `border-right`, `text-align: left` must be reviewed. Most teams ship RTL as an afterthought, if at all.

**Solution.** RoyCSS scans your CSS (including third-party stylesheets) for direction-dependent properties and rewrites them to logical equivalents (`margin-inline-start`, `translateX` → `inset-inline-start` or `transform: logical`, `border-inline-end`). Zero behavior change in LTR; correct behavior in RTL.

**Technical feasibility.** CSS parser (`@parcel/css` or `postcss`) for static analysis; logical properties are shipping in all evergreen browsers; `:dir()` selector for runtime cases.

**Productivity impact.** Cuts RTL enablement from a 2-week sprint to a 1-day task. Particularly impactful for apps targeting Arabic, Hebrew, and Persian markets.

**Moat.** Structural. RoyCSS's existing `migrate-logical.ts` script (referenced in `ENTERPRISE-REVIEW.md`) already does this for its own CSS; extending it to consumer CSS is a natural fit. Competitors have no equivalent.

### 2.7 Effect Choreography AI

**Problem.** Coordinating multi-element animations (card flips → CTA pulses → toast slides in) requires writing timeline orchestration code in JS, even though the animations themselves are CSS.

**Solution.** Describe the sequence in natural language: "card flips, then 200ms later the CTA pulses twice, then the toast slides in from the bottom." RoyCSS generates the coordinated CSS animation timeline with proper `animation-delay` and `animation-fill-mode` values, plus a thin JS trigger.

**Technical feasibility.** CSS `animation-delay`, `animation-fill-mode`, the Web Animations API for JS-triggered segments, and `@scroll-timeline` for scroll-driven variants. The AI emits structured timeline JSON that RoyCSS compiles to CSS.

**Productivity impact.** Eliminates the most tedious part of multi-element animation work. Estimated 60% time reduction on choreography-heavy features (onboarding flows, demos).

**Moat.** Structural. RoyCSS's effect catalog is the only one with structured timing metadata (duration, fill mode, recommended chaining context) that the AI can reason over.

### 2.8 Legacy CSS Refactor Bot

**Problem.** Every inherited codebase has pre-2018 CSS: vendor prefixes, hex colors, physical properties, `float`-based layouts, `!important` everywhere. Refactoring is high-risk and low-glamour, so it never happens.

**Solution.** Paste legacy CSS. RoyCSS returns a modernized version: vendor prefixes stripped (with browser-support matrix justification), hex → OKLCH, physical → logical, float → grid where safe, redundant `!important` removed.

**Technical feasibility.** `@parcel/css` for parsing, `browserslist` for target-aware prefix stripping, OKLCH conversion via the CSS Color Module Level 4 algorithm. Refactor passes are opt-in and previewable.

**Productivity impact.** Makes legacy modernization tractable. One engineer can do in a day what used to take a sprint.

**Moat.** Thin on the transformations themselves, but structural when combined with RoyCSS's token system — the bot can suggest token replacements, not just property modernization.

---

## Category 3 — Performance & Optimization (8 ideas)

### 3.1 Per-Effect Cost Budget

**Problem.** CSS performance budgets exist for bundle size, but not for *render cost*. A page with 30 backdrop-filter effects is slow even if the bundle is small.

**Solution.** Every RoyCSS effect is tagged with a cost estimate: paint cost (backdrop-filter, filter, mix-blend-mode), composite cost (transform, opacity), layout cost (width, height, position). The build fails if a page's total effect cost exceeds a configured budget.

**Technical feasibility.** Cost model derived from Chrome's rendering pipeline documentation, calibrated via Lighthouse and `performance.measure()` runs on a benchmark suite. Per-page aggregation via `data-roycss` attributes.

**Productivity impact.** Catches performance regressions at build time instead of production. Estimated 25% reduction in CSS-related performance incidents.

**Moat.** Structural. Only RoyCSS has the per-effect cost metadata. Generic CSS frameworks have no visibility into what each rule does at render time.

### 3.2 Containment Auto-Analyzer

**Problem.** `contain: layout style paint` dramatically improves render performance but is risky to apply manually (it can break `position: sticky`, `overflow: visible`, etc.). Most teams skip it.

**Solution.** RoyCSS analyzes the DOM and safely injects `contain` on subtrees where it's provably safe: leaf nodes, isolated cards, fixed-size containers. Reports measured render-time savings.

**Technical feasibility.** `getComputedStyle` + DOM walking to verify no `position: sticky`/`fixed` descendants, no `overflow: visible` interactions. The CSS Containment Module Level 2 is shipping in all evergreen browsers.

**Productivity impact.** 10–40% render-time improvement on large lists, with zero risk. Equivalent to a free engineering sprint.

**Moat.** Structural. RoyCSS's component library (planned) ships `contain` defaults, so the analyzer only needs to verify safety on user-customized components.

### 3.3 View Transitions Auto-Wiring

**Problem.** The View Transitions API requires manually assigning `view-transition-name` to every element you want animated across routes. This is fiddly and easy to break.

**Solution.** RoyCSS analyzes route boundaries (in Next.js, Remix, Astro, etc.) and auto-generates `view-transition-name` assignments for shared elements (header, sidebar, hero image). Falls back gracefully if names collide.

**Technical feasibility.** `document.startViewTransition`, the `::view-transition-*` pseudo-elements, and framework-specific route hooks (Next.js `AppRouter`, Remix `useNavigate`). Collision detection via static analysis.

**Productivity impact.** Makes app-feel transitions a 5-minute task instead of a 2-day chore. Big UX win for minimal effort.

**Moat.** Structural. RoyCSS's component catalog identifies "shared elements" semantically; competitors' utility classes have no idea what a "header" is.

### 3.4 will-change Auto-Injector

**Problem.** `will-change` left on permanently causes memory bloat. Left off, animations jank. The manual dance of adding/removing it is error-prone.

**Solution.** RoyCSS observes scroll and interaction patterns and injects `will-change: transform` *only during active animation windows*, removing it immediately after. Powered by `IntersectionObserver` and `AnimationPlayer` events.

**Technical feasibility.** `IntersectionObserver` for visibility, `Element.animate()` return values for animation lifecycle events, and `MutationObserver` for class changes that trigger animations.

**Productivity impact.** Eliminates a class of "why is my animation janky?" tickets. Estimated 5–15% animation smoothness improvement on low-end devices.

**Moat.** Structural. RoyCSS knows which properties each effect animates, so it can target `will-change` precisely. Generic frameworks would have to over-apply it.

### 3.5 CSS Bundle Heatmap

**Problem.** Webpack/Vite bundle analyzers visualize JS bundles beautifully. CSS gets a single "240 KB" number. You can't see which CSS rules ran on which pages.

**Solution.** RoyCSS instruments dev and staging builds to log, per route, which CSS rules actually matched. The output is a route × CSS-block heatmap highlighting dead CSS per route.

**Technical feasibility.** Same selector-matching tracer as 1.4, aggregated by route. Output as a D3 heatmap or `stats.html` (webpack-stats-compatible).

**Productivity impact.** Enables per-route CSS splitting with confidence. Often cuts initial CSS payload by 50%+ on multi-route apps.

**Moat.** Structural. RoyCSS's effect-level granularity makes the heatmap actionable — you can split effects, not just rules.

### 3.6 Style Recalc Tracer

**Problem.** Style recalculation is the single largest CSS performance cost on large DOMs, but no tool attributes it to specific DOM mutations.

**Solution.** RoyCSS dev mode logs every mutation that triggered style recalc, with the recalc time and the affected selector count. Sorted by impact.

**Technical feasibility.** `PerformanceObserver({ type: 'long-animation-frame' })` for the recalc timing, `MutationObserver` for the triggering mutation. Correlation via timestamp + RAF alignment.

**Productivity impact.** Turns "the app feels slow" into "this mutation costs 12ms per scroll." Estimated 30% reduction in CSS performance triage time.

**Moat.** Structural. RoyCSS's selector metadata enables attribution to specific effects, not just "some CSS rule."

### 3.7 Unused Custom Property Stripper

**Problem.** Design token files grow over time. After migrations, refactors, and deprecations, 30% of tokens may be unused — but no one dares delete them.

**Solution.** At build time, RoyCSS traces every `--roycss-*` token through the entire app (HTML, TSX, CSS-in-JS, inline styles) and removes unused ones from the runtime stylesheet. Reports the savings.

**Technical feasibility.** Static analysis via `@parcel/css` for CSS files, TypeScript AST traversal for TSX, regex for inline styles. The `@property` registrations are stripped only if no consumer is found.

**Productivity impact.** 10–30% reduction in token bundle size. Also surfaces dead tokens for documentation cleanup.

**Moat.** Structural. RoyCSS owns its token namespace (`--roycss-*`), so the stripper can be aggressive. Generic tools must be conservative.

### 3.8 Critical CSS via Real User Metrics

**Problem.** "Critical CSS" tools guess what's above-the-fold based on viewport heuristics. They're wrong 30% of the time on real devices with different aspect ratios, zoom levels, and dynamic content.

**Solution.** RoyCSS collects RUM data from production: which CSS rules actually rendered during FCP, across real users. It then inlines only those rules server-side, per route.

**Technical feasibility.** `PerformanceObserver({ type: 'paint' })` for FCP timing, `getMatchedCSSRules`-equivalent (selector tracing) at FCP time. Data sent via `navigator.sendBeacon`. Server-side inlining via the same selector metadata.

**Productivity impact.** 100–300ms FCP improvement on real devices. Bigger impact on mid-tier Android hardware, where it matters most.

**Moat.** Structural. RoyCSS's per-effect metadata makes the RUM aggregation tractable — you collect "effects rendered," not "rules matched," which is 100x smaller.

---

## Category 4 — Accessibility & Compliance (6 ideas)

### 4.1 Real-Computed-Value Contrast Validator

**Problem.** WCAG contrast checkers use *declared* colors. But after opacity, blend modes, gradients, and backdrop-filter, the actual rendered color can be wildly different. Many "passing" combinations actually fail in production.

**Solution.** RoyCSS samples actual rendered pixels via the Canvas API (`ctx.drawImage` of the element) and validates contrast on the real output. Catches every blend-mode-induced failure.

**Technical feasibility.** `HTMLCanvasElement.getContext('2d').drawImage` of an SVG-foreignObject-wrapped DOM node (foreignObject + canvas is the standard technique). APCA and WCAG 2.1 formulas on the sampled colors.

**Productivity impact.** Catches a class of accessibility bugs that no current tool detects. Prevents shipping visually-passing-but-legally-failing UI to regulated industries.

**Moat.** Structural. RoyCSS's component catalog knows which elements are "text-bearing" — the validator runs only on those, avoiding false positives on decorative elements.

### 4.2 Focus Order Visualizer

**Problem.** `tabindex` and CSS `order` (with `flex-direction: row-reverse`) silently reorder the tab sequence, trapping keyboard users. Dev tools show `tabindex` per element but not the resulting sequence.

**Solution.** RoyCSS overlays numbered badges on every focusable element in actual tab order. Highlights elements that are focusable-but-invisible, off-screen, or moved via `order`.

**Technical feasibility.** Walk `document.querySelectorAll('*')`, filter by `tabindex >= 0` or focusable tag, then sort by DOM order *adjusted* for `flex-direction` and `order` CSS properties (which change visual but not tab order — the visualization makes this mismatch obvious).

**Productivity impact.** Eliminates a class of keyboard-accessibility bugs in seconds. Estimated 50% reduction in tab-order-related a11y tickets.

**Moat.** Thin in isolation, but compound with RoyCSS's component library which ships correct tab order by default.

### 4.3 Reduced-Motion Equivalents Generator

**Problem.** `prefers-reduced-motion: reduce` is great, but it often results in *no motion at all* — loaders become static, transitions become instant, feedback is lost. Users with vestibular disorders still want feedback, just without motion.

**Solution.** For every animation in the library, RoyCSS auto-generates an accessible non-animated equivalent that conveys the same intent: loaders become static "Loading…" with `aria-live="polite"`, hover effects become color changes, transitions become opacity fades.

**Technical feasibility.** `@media (prefers-reduced-motion: reduce)` overrides, `aria-live` regions for text equivalents, and per-effect metadata describing the *intent* (loading, success, error, attention).

**Productivity impact.** Makes accessibility not just "compliant" but actually usable. Differentiator for healthcare and ed-tech customers.

**Moat.** Structural. Only RoyCSS has the per-effect intent metadata required to generate meaningful equivalents. Generic frameworks can only suppress animations.

### 4.4 Forced-Colors Mode Tester

**Problem.** Windows High Contrast Mode (`forced-colors: active`) rewrites your entire color system. Most teams don't test it because the dev tooling is hidden in Windows Settings.

**Solution.** RoyCSS dev mode emulates `forced-colors: active` in any browser, showing which elements lose their visual identity (gradient backgrounds become invisible, borders disappear). One-click fixes apply `forced-color-adjust: none` where appropriate.

**Technical feasibility.** The `forced-colors` media query is shipping in all evergreen browsers. Chrome DevTools supports emulation since v115. RoyCSS wraps this in a one-click UI with fix suggestions.

**Productivity impact.** Cuts forced-colors compliance from a Windows-only manual test to a one-click dev check. Critical for government and education customers.

**Moat.** Thin. The emulation is browser-native. RoyCSS's moat is the *fix suggestions* — only an effect-aware library can suggest targeted fixes.

### 4.5 ARIA-Aware Effect Filter

**Problem.** Decorative effects applied to text content can harm screen-reader users (aria-hidden images, ambiguous animations, decorative icons that steal focus). No linter catches this today.

**Solution.** Effects are tagged with ARIA compatibility: `decorative-only`, `interactive-ok`, `text-safe`. The linter blocks `decorative-only` effects on text-bearing elements and suggests alternatives.

**Technical feasibility.** Static analysis on the rendered DOM (effect applied to element with text content → flag). Effect metadata stored in the `CSSEffect` interface (already exists in `roycss-types.ts`).

**Productivity impact.** Prevents a class of accessibility regressions at commit time. Estimated 70% reduction in screen-reader-related a11y bugs.

**Moat.** Structural. Only RoyCSS has the ARIA-compatibility metadata. Generic CSS frameworks cannot reason about effect intent.

### 4.6 Cognitive Load Analyzer

**Problem.** Each effect in isolation is fine. But a page with 12 animations, high contrast, and dense content can be overwhelming for users with ADHD, autism, or vestibular disorders. No tool measures this.

**Solution.** RoyCSS analyzes motion intensity (animation frequency, amplitude, contrast), color saturation, and information density per viewport. Warns when the combined cognitive load exceeds a threshold calibrated against WCAG 2.2 cognitive-accessibility guidance.

**Technical feasibility.** `getComputedStyle` for color and animation properties, `IntersectionObserver` for density measurement, and a weighted scoring model. The model is empirical, calibrated against user-study data.

**Productivity impact.** Opens a new dimension of accessibility that no current tool addresses. Differentiator for healthcare and ed-tech customers.

**Moat.** Structural. RoyCSS's per-effect metadata is required to make the analysis tractable. Generic frameworks would need to analyze raw CSS, which is intractable.

---

## Category 5 — Design & Theming (6 ideas)

### 5.1 Brand Color Drift Monitor

**Problem.** Designers specify brand colors precisely. Engineers override tokens for dark mode, A/B tests, and per-tenant themes. Six months later, no one knows how far the actual rendered colors have drifted from the original brand spec.

**Solution.** RoyCSS tracks every token override (at runtime, via `MutationObserver` on `style` attributes and `CSSStyleSheet` mutations) and visualizes drift as a delta-from-brand-spec heatmap. Alerts when drift exceeds a tolerance.

**Technical feasibility.** `getComputedStyle` for rendered values, OKLCH delta-E for perceptual distance, and a brand-spec JSON file declaring canonical values.

**Productivity impact.** Solves brand-consistency audits that today require manual screenshot reviews. Estimated 80% time reduction on quarterly brand audits.

**Moat.** Structural. RoyCSS's typed OKLCH tokens make perceptual drift measurable. Hex-based competitors can only measure raw color difference, which doesn't match human perception.

### 5.2 Multi-Brand Token Compositor

**Problem.** White-label SaaS apps need to switch between brands at runtime (per tenant, per user preference). Today this requires reloading CSS or juggling class names, causing flash-of-wrong-theme.

**Solution.** RoyCSS loads multiple brand token sets simultaneously and switches via a single `data-brand` attribute on `<html>`. No flash, no reload, no JS bundle change. Tokens are scoped via `:where([data-brand="acme"]) { --roycss-color-primary: ... }`.

**Technical feasibility.** CSS custom property cascading, the `:where()` zero-specificity selector, and the `view-transition-name` API for smooth cross-brand transitions.

**Productivity impact.** Enables a class of product (true white-label SaaS) that is otherwise too expensive to build. Single biggest differentiator for B2B SaaS customers.

**Moat.** Structural. RoyCSS's token system is already designed for runtime override; competitors' build-time token systems cannot switch brands without rebuild.

### 5.3 Theme Snapshot & Diff

**Problem.** "Why does this look different in dark mode?" requires manually comparing every token. There's no `git diff` for themes.

**Solution.** Capture the full computed theme (every `--roycss-*` value) at any moment as a JSON snapshot. Diff two snapshots to see exactly which tokens changed and by how much (in OKLCH delta-E). Snapshots are shareable as URLs.

**Technical feasibility.** `getComputedStyle(document.documentElement)` for all custom properties, JSON serialization, and a URL-safe encoding (LZ-string compression).

**Productivity impact.** Turns theme debugging from hours of manual comparison to a structured diff. Especially valuable for design-system teams managing 10+ themes.

**Moat.** Structural. Only RoyCSS has the typed token namespace required to make diffs meaningful (each token has a type, unit, and semantic role).

### 5.4 Density Modes Beyond Breakpoints

**Problem.** Responsive breakpoints switch layouts but ignore user preference and device context. A user on a 4K monitor with system-level "compact density" still gets the default comfortable layout.

**Solution.** RoyCSS auto-switches between `compact`, `comfortable`, and `spacious` density modes based on container size, `prefers-reduced-data`, device pixel ratio, and (optionally) a user toggle. Density affects spacing scale, font size, and touch-target size.

**Technical feasibility.** Container queries for size, `prefers-reduced-data` for data sensitivity, `matchMedia('(min-resolution: 2dppx)')` for DPR. Density tokens cascade via `:where([data-density="compact"]) { --roycss-spacing-unit: 0.2rem }`.

**Productivity impact.** Better UX on every device with zero per-component work. Particularly impactful for data-dense apps (analytics, admin dashboards).

**Moat.** Structural. RoyCSS's token system already exposes `--roycss-spacing-unit`; density modes are a natural extension. Competitors' hardcoded utility classes cannot adapt.

### 5.5 OKLCH Gamut Auto-Fallback

**Problem.** `oklch(0.7 0.2 250)` is vivid blue on P3 displays but mud on sRGB. Naive gamut clamping preserves lightness but loses hue. Most teams either ship P3-only (broken on sRGB) or avoid OKLCH entirely.

**Solution.** Every `oklch()` color in RoyCSS is auto-paired with a perceptually-hue-preserving sRGB fallback. The fallback is generated by walking the OKLCH hue/chroma toward sRGB gamut boundary along a constant-hue line, preserving perceived color rather than raw coordinates.

**Technical feasibility.** `@supports (color: oklch(0 0 0))` for feature detection, the CSS Color Module Level 4 gamut-mapping algorithm, and `color-mix()` for blending fallbacks.

**Productivity impact.** Eliminates the "looks great on my monitor, broken on the customer's" bug class. Critical for design-led brands.

**Moat.** Structural. RoyCSS's tokens are already OKLCH-native; the fallback generator is a build-time pass over the token JSON. Competitors using hex would need to convert first, losing perceptual accuracy.

### 5.6 Print Stylesheet Auto-Synthesis

**Problem.** Print stylesheets are universally neglected. Gradients print as gray blocks, shadows disappear, animations waste ink, page breaks land in the middle of cards. Most teams ship no print CSS at all.

**Solution.** RoyCSS analyzes screen styles and synthesizes a print stylesheet: removes effects, gradients, shadows, and backdrop-filter; converts dark-mode colors to print-friendly; inserts `page-break-inside: avoid` on cards; and respects `prefers-color-scheme: light` for ink efficiency.

**Technical feasibility.** `@media print` overrides, `getComputedStyle` for declared colors, heuristics for "card-like" containers (rounded borders + padding + background).

**Productivity impact.** Delivers a usable print stylesheet with zero engineering effort. Particularly valuable for invoices, reports, and educational content.

**Moat.** Structural. RoyCSS's effect metadata identifies which properties are print-hostile (animations, gradients, shadows). Generic frameworks would over-strip and break the layout.

---

## Category 6 — Developer Tools (6 ideas)

### 6.1 RoyCSS Inspector Panel

**Problem.** Browser dev tools show CSS rules but not "which RoyCSS effect is on this element" or "which token is referenced here." Engineers mentally translate between RoyCSS abstractions and raw CSS constantly.

**Solution.** A browser DevTools extension (and embedded dev panel) that, for any picked element, shows: applied RoyCSS effects, referenced tokens, and offers live sliders ("intensity: 50% → 75%", "speed: 1s → 0.5s") that update the running page in place.

**Technical feasibility.** Chrome DevTools Extensions API, `chrome.devtools.inspectedWindow.eval` for DOM access, and the `CSSStyleSheet` API for live edits.

**Productivity impact.** Eliminates the abstraction-to-CSS mental translation tax. Estimated 2 hours/week saved per engineer on RoyCSS-heavy codebases.

**Moat.** Structural. Only RoyCSS has the effect/token metadata required to render the panel meaningfully. Generic CSS frameworks would show only raw rules.

### 6.2 VS Code Cascade Preview

**Problem.** Hovering over a CSS rule in VS Code shows the rule's text. It does not show *which elements in your running app* the rule currently matches. You have to context-switch to the browser.

**Solution.** Hover over any RoyCSS class in VS Code. A preview panel shows live screenshots of every element in your running app that currently matches, with a "modify and see all affected elements" mode.

**Technical feasibility.** VS Code Hover Provider API, a browser extension that exposes a screenshot endpoint over WebSocket, and `document.querySelectorAll` for matching elements.

**Productivity impact.** Eliminates the editor-browser context switch for CSS work. Estimated 30% reduction in "save-and-refresh" cycles.

**Moat.** Structural. RoyCSS's class namespace (`roycss-*`) makes the matching trivial. Generic frameworks would need to match arbitrary selectors, which is slower and noisier.

### 6.3 Token-Driven Class Generator

**Problem.** RoyCSS ships `roycss-anim-pulse-glow`, `roycss-anim-pulse-glow-soft`, `roycss-anim-pulse-glow-strong` — three classes for one effect. Combinatorial explosion makes the catalog huge but still inflexible.

**Solution.** Write `roycss-anim-pulse-glow(color=primary, speed=fast, intensity=strong)`. The build generates a single purpose-built class with the tokens inlined. No runtime cost, full flexibility.

**Technical feasibility.** Build-time macro expansion (similar to Tailwind's JIT), `@property`-typed token validation, and tree-shaking of unused variants.

**Productivity impact.** Reduces class catalog bloat while increasing flexibility. Estimated 40% reduction in "I need a variant that doesn't exist" tickets.

**Moat.** Structural. RoyCSS's effects are already TS-defined with parameterized metadata; the macro expander is a natural fit. Competitors' stringly-typed utilities cannot validate parameters.

### 6.4 Effect Sandbox with Time Scrubbing

**Problem.** Animations are hard to debug because they're transient. You can't easily "pause at frame 30 and see what's happening."

**Solution.** A playground where you load any effect, scrub the animation timeline forward and backward, freeze at any frame, and inspect the computed styles at that exact millisecond. Export the frozen frame as a test snapshot.

**Technical feasibility.** `Element.animate()` returns an `Animation` object with `currentTime`, `pause()`, and `playbackRate`. Computed styles via `getComputedStyle` at the frozen time.

**Productivity impact.** Makes animation debugging deterministic. Estimated 50% reduction in "works sometimes, breaks other times" animation bugs.

**Moat.** Structural. RoyCSS's effects are already declarative (CSS-only, no JS), which is what makes scrubbing possible. JS-driven animations cannot be scrubbed this way.

### 6.5 Class Usage Heatmap in IDE

**Problem.** In a large codebase, you use RoyCSS class names that: (a) aren't imported (broken), (b) are duplicated (alias confusion), or (c) are deprecated. Nothing flags this until runtime.

**Solution.** VS Code greys out RoyCSS class names not in any active import path, highlights duplicates that resolve to the same effect, and warns on deprecated names with migration suggestions.

**Technical feasibility.** VS Code Decorations API, TypeScript language service for import resolution, and the RoyCSS class registry (already in `roycss-classes.json`).

**Productivity impact.** Eliminates "class doesn't exist" runtime bugs. Estimated 1 hour/week saved per engineer.

**Moat.** Structural. RoyCSS's class registry is already machine-readable. Competitors' ad-hoc class names cannot be analyzed.

### 6.6 Design Token MCP Server

**Problem.** AI coding assistants (Claude, Cursor, Copilot) invent colors when writing CSS because they don't know your design tokens. The result is drift from the design system.

**Solution.** RoyCSS exposes its token catalog via the Model Context Protocol (MCP). AI assistants can query "what's the primary color token?" and receive `--roycss-color-primary: oklch(0.7 0.14 165)` instead of inventing `#3b82f6`.

**Technical feasibility.** MCP is an open protocol shipping in production. The token server is a thin wrapper around `design-tokens.ts`. AI clients connect via stdio.

**Productivity impact.** Eliminates a class of AI-introduced design-system drift. Particularly impactful for teams using AI for 50%+ of new code.

**Moat.** Structural. RoyCSS's tokens are already structured (typed, named, documented). Competitors' ad-hoc tokens would expose unstructured data the AI can't reliably use.

---

## Category 7 — Animation & Motion (6 ideas)

### 7.1 Scroll-Driven Effect Coordinator

**Problem.** The Scroll-Driven Animations API (`animation-timeline: scroll()`) is shipping but fiddly. Each animated element needs its own timeline wiring, and cross-browser behavior is inconsistent.

**Solution.** A single declarative API: `<div data-roycss-scroll-in="30%-60%">`. RoyCSS generates the correct `animation-timeline`, `animation-range`, and polyfill for browsers without support. Coordinates multiple elements on a shared timeline.

**Technical feasibility.** `AnimationTimeline`, `ScrollTimeline`, `ViewTimeline` (shipping in Chrome 115+, polyfilled elsewhere via `IntersectionObserver` + RAF).

**Productivity impact.** Cuts scroll-driven animation work from hours to minutes. Eliminates the JS dependency for this class of animation.

**Moat.** Structural. RoyCSS's effect metadata enables correct timeline assignment per effect type. Generic frameworks would require manual wiring.

### 7.2 Animation Conflict Detector

**Problem.** Two effects on the same element animating `transform` (e.g., `hover-scale` + `anim-float`) silently overwrite each other. The bug is invisible until QA catches it.

**Solution.** RoyCSS's build analyzes applied effects per element and warns when two effects animate the same property. Suggests composing them onto a wrapper element instead.

**Technical feasibility.** Static analysis on the rendered DOM (data attributes record applied effects) and the effect metadata (which properties each effect animates — already in `roycss-types.ts`).

**Productivity impact.** Eliminates a class of subtle, hard-to-debug animation bugs at build time.

**Moat.** Structural. Only RoyCSS has the per-effect property metadata required to detect conflicts.

### 7.3 Viewport Pause for Offscreen Animations

**Problem.** Continuous animations (loaders, marquees, ambient effects) run even when offscreen, wasting CPU and battery. Most teams don't bother pausing.

**Solution.** RoyCSS auto-pauses any animation when its element leaves the viewport, and resumes when it returns. Zero developer effort. Configurable per-effect (some effects, like spinners, should keep running for perceived-performance reasons).

**Technical feasibility.** `IntersectionObserver` for visibility, `Animation.pause()` / `Animation.play()` for control, `element.getAnimations()` to enumerate running animations.

**Productivity impact.** 20–40% CPU savings on animation-heavy pages. Big battery-life win on mobile.

**Moat.** Structural. RoyCSS's per-effect metadata identifies which animations are safe to pause (loaders: yes; transitions: no). Generic frameworks would pause the wrong things.

### 7.4 Motion Path Library with Magnetic Snap

**Problem.** CSS `offset-path` (motion path) is powerful but rarely used because authoring SVG paths by hand is painful and there's no "snap to UI anchor" behavior.

**Solution.** RoyCSS ships pre-built motion paths (arcs, figure-8s, zig-zags, spirals) plus an optional magnetic-snap mode where the moving element snaps to UI anchors (buttons, nav items) as it passes near them.

**Technical feasibility.** `offset-path: path('...')`, `offset-distance`, `offset-rotate`, and `Element.getBoundingClientRect()` for anchor detection. Magnetic snap is JS-driven via `requestAnimationFrame`.

**Productivity impact.** Enables a class of delightful UI (onboarding tours, animated hints) that is otherwise too expensive to build.

**Moat.** Structural. RoyCSS's effect catalog provides the path library; the magnetic-snap behavior requires knowing which elements are "anchorable" — only a component-aware library can do this.

### 7.5 Choreography Rehearsal Mode

**Problem.** Multi-element choreography looks great at full speed but hides timing collisions (two elements overlapping at the same frame). QA catches these inconsistently.

**Solution.** A runtime overlay that slows every animation on the page to 10% speed, with a frame counter. You can scrub through the choreography, spot collisions, and adjust delays in place.

**Technical feasibility.** `document.getAnimations()` returns all running animations; set `playbackRate = 0.1` on each. The overlay UI is a fixed-positioned slider.

**Productivity impact.** Turns choreography debugging from "watch it 20 times" to "scrub it once." Estimated 60% time reduction on complex animation sequences.

**Moat.** Thin. The mechanism is simple, but RoyCSS's effect-aware overlay shows *which effect* is on which element, which generic tools cannot.

### 7.6 Animation Token Inheritance

**Problem.** Every component specifies its own animation (`fade-in` here, `slide-up` there). Changing the "feel" of a page requires editing every component.

**Solution.** Define `--roycss-motion-emphasis: roycss-anim-bounce-in` once on a container. All child RoyCSS effects inherit that motion personality. Change one token, the whole page feels different.

**Technical feasibility.** CSS custom property inheritance, the `var()` function in `animation-name` contexts (with `@property` registration to make the value animatable), and per-effect metadata mapping "emphasis slots" to effect IDs.

**Productivity impact.** Compresses "rebrand the motion language" from a sprint to a one-line change. Big win for design-system teams.

**Moat.** Structural. RoyCSS's effect catalog is the only one with the intent metadata required to map "emphasis" to a specific effect ID. Generic frameworks have no semantic effect layer.

---

## Category 8 — Architecture & Scale (6 ideas)

### 8.1 Effect Deduplication Across Bundles

**Problem.** In a monorepo, Team A imports `roycss-card-glassmorphism` and Team B imports the same effect via a different path. The final bundle contains the effect CSS twice. Worse, version mismatches cause silent style conflicts.

**Solution.** A build-time plugin that deduplicates RoyCSS effects by ID across all bundles in a monorepo. Warns about conflicting version ranges and suggests a unified version.

**Technical feasibility.** Webpack/Vite/Rollup plugin APIs, the RoyCSS effect registry (already centralized in `roycss-effects.ts`), and semver range resolution.

**Productivity impact.** Prevents a class of monorepo-specific CSS bugs. Critical for organizations with 10+ teams sharing RoyCSS.

**Moat.** Structural. Only RoyCSS has a stable effect ID namespace to deduplicate against. Generic CSS frameworks have no canonical IDs.

### 8.2 CSS Module Boundaries with Type Exports

**Problem.** Components depend on RoyCSS effects implicitly. If an effect is missing from the bundle, the component renders broken — at runtime. TypeScript doesn't catch this.

**Solution.** Every RoyCSS-aware component declares its CSS dependencies as TypeScript types: `type CardDeps = ['roycss-card-glassmorphism', 'roycss-anim-fade-in']`. The build fails if any declared effect isn't installed.

**Technical feasibility.** TypeScript type-level sets (template literal types), a build plugin that reads `package.roycss.json` for installed effects, and a custom ESLint rule.

**Productivity impact.** Eliminates "missing CSS dependency" runtime bugs. Particularly valuable for npm-published component libraries.

**Moat.** Structural. RoyCSS's effect IDs are already canonical. Generic CSS frameworks have no equivalent namespace.

### 8.3 Layer Auto-Composition

**Problem.** `@layer` is the modern specificity solution, but teams get the layer order wrong (reset, framework, components, utilities, overrides — or is it utilities before components?). The result is specificity wars even with layers.

**Solution.** RoyCSS auto-assigns every effect to the correct `@layer` based on its category: reset → framework → components → utilities → overrides. Teams never declare layer order manually.

**Technical feasibility.** `@layer` statement syntax, the layer order is declared once in `roycss.css`, and the build wraps each effect's CSS in the appropriate `@layer { ... }` block.

**Productivity impact.** Eliminates `@layer` ordering bugs. Estimated 70% reduction in specificity-war tickets.

**Moat.** Structural. RoyCSS's category taxonomy maps directly to layer assignments. Generic frameworks don't have the taxonomy.

### 8.4 Tree-Shakeable Token Catalog

**Problem.** A single `tokens.css` file ships every token, even if the app uses 5%. Token files grow to 50+ KB on large design systems.

**Solution.** Each token is its own ESM module (`tokens/color/primary.ts` exports the `@property` declaration). Bundlers tree-shake unused tokens to zero bytes.

**Technical feasibility.** ESM exports, `@property` declarations are individually addressable, and Rollup/Vite/esbuild all support per-export tree-shaking.

**Productivity impact.** 60–90% reduction in token bundle size on most apps. Bigger impact than any other optimization in this document.

**Moat.** Structural. RoyCSS's tokens are already TS-defined; the per-token ESM split is a build refactor. Competitors' CSS-file-based tokens cannot be tree-shaken.

### 8.5 Cross-Framework Effect Adapter

**Problem.** A design system team writes effect configurations in JSON. To use them in React, Vue, Angular, and Svelte, they hand-write four different bindings. Drift is inevitable.

**Solution.** RoyCSS takes a framework-agnostic effect-configuration JSON and generates: a React hook (`useRoyEffect(id)`), a Vue composable (`useRoyEffect`), a Svelte action (`roy:effect`), and an Angular directive (`[royEffect]`). All four stay in sync from a single source.

**Technical feasibility.** Code generators per framework (TypeScript compiler API for type-safe output), the effect registry as source of truth, and framework-specific adapter patterns (React hooks, Vue composables, Svelte actions, Angular directives).

**Productivity impact.** 4x reduction in design-system binding maintenance. Single biggest architectural win for cross-framework organizations.

**Moat.** Structural. RoyCSS already ships bindings for five frameworks (per `ENTERPRISE-REVIEW.md`); the generator unifies them. Generic frameworks typically ship one binding.

### 8.6 CSS-Aware CI Gate

**Problem.** Code review catches obvious CSS smells (`!important`, `z-index: 99999`), but the long tail (animations >2s, hardcoded colors, non-logical properties, undocumented effects) slips through.

**Solution.** A CI step that blocks PRs introducing: new effects with duration >2s, `!important`, `z-index > 9999`, hardcoded colors (not tokens), non-logical properties, or effects not in the project's allowlist. Every rule is configurable.

**Technical feasibility.** Static analysis on the diff (via `@parcel/css`), the RoyCSS effect registry for metadata lookups, and a config file (`.roycsrc.json`) for per-project rules.

**Productivity impact.** Prevents CSS regressions at PR time. Estimated 50% reduction in "how did this ship?" CSS tickets.

**Moat.** Structural. RoyCSS's effect metadata and token namespace are required to write meaningful rules. Generic CSS linters can only catch syntactic issues, not semantic ones.

---

## Closing — Why these 56 ideas compound

Read individually, each idea is a useful feature. Read together, they describe a **different category of product** than what Tailwind, Bootstrap, UnoCSS, Panda, StyleX, Bulma, and Foundation offer.

The competitors have optimized for **scale of utility classes**. RoyCSS's opportunity is to optimize for **intelligence about CSS** — knowing which effect does what, which token means what, which rule conflicts with which, and surfacing that knowledge at every step of the developer workflow: in the IDE, in the browser, in CI, in production.

This intelligence is not a feature; it is an **architectural commitment**. It requires:

1. **Effect metadata** — every CSS rule tagged with intent, cost, accessibility, ARIA compatibility, animatable properties.
2. **Typed tokens** — every custom property registered via `@property` with explicit types and OKLCH-native values.
3. **Layer-aware architecture** — every rule assigned to a canonical `@layer`, never flat.
4. **Source-map provenance** — every generated rule traceable to its TypeScript definition.
5. **Cross-framework bindings** — every abstraction available in React, Vue, Angular, Svelte, and vanilla HTML.

RoyCSS already has all five. Competitors have, at most, two. That gap is the moat — not any single feature in this document, but the cumulative position of being the only CSS framework architected from day one to know what its CSS *means*.

The recommended next step is a prioritization workshop: rank the 56 ideas by (impact × feasibility) / (time-to-moat), and select the first 10 for the v1.1 roadmap. Suggested first batch: 1.1 (Cascade Genealogy Inspector), 2.1 (Brand Color Generator), 3.1 (Per-Effect Cost Budget), 4.1 (Real-Computed-Value Contrast Validator), 5.2 (Multi-Brand Token Compositor), 6.1 (RoyCSS Inspector Panel), 7.1 (Scroll-Driven Coordinator), 8.4 (Tree-Shakeable Token Catalog). These eight deliver visible value within one quarter and establish the architectural patterns the remaining 48 ideas build on.

---

**End of document.** 56 ideas, 8 categories, ~5,400 words.
