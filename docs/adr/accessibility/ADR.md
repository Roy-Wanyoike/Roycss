# RoyCSS Accessibility — Architecture Decision Records

> Status: Accepted · Decisions taken during the `accessibility-audit` task (2026-07-30).

---

## ADR-01: axe-core as the primary automated a11y test engine

**Date:** 2026-07-30 · **Status:** Accepted

### Context

RoyCSS needs an automated accessibility test that runs in CI and fails fast on regressions. Three credible options exist:

1. **axe-core** (Deque) — a JS library injected into a real browser; ~100 rules; WCAG 2.0/2.1/2.2 tags; runs against the live DOM.
2. **Pa11y** — a CLI wrapper around HTML CodeSniffer; can run against URLs; ~100 rules but less actively maintained.
3. **Lighthouse Accessibility** — runs in CI/CD via `lighthouse-ci`; ~40 a11y audits; bundled with performance/SEO; uses axe-core under the hood.

### Decision

**Use axe-core directly**, driven by `agent-browser` (or Playwright, if added later) inside `tests/a11y/axe-audit.ts`.

### Rationale

- **Rule coverage.** axe-core's `wcag2a` + `wcag2aa` + `best-practice` tag set gives 87 rules out of the box. Pa11y/HTML CodeSniffer coverage is narrower (~60 rules). Lighthouse exposes only ~40.
- **Result fidelity.** axe runs against the post-hydration React DOM. Pa11y's default mode fetches raw HTML and misses client-rendered content (which is exactly what fails most often in a Next.js app).
- **Already a dependency.** `axe-core@^4.12.1` is in `devDependencies` — no new install.
- **JSON output.** axe returns a structured `{ violations, passes, incomplete, inapplicable }` object that maps cleanly to our severity categorisation. Lighthouse wraps axe output in its own scoring scheme and makes raw violations harder to extract.
- **No network dependency.** We vendor `axe.min.js` at `public/__axe.min.js` and inject via `<script src>`. No CDN, no internet egress in CI.
- **Trade-off accepted:** axe-core is only as good as the browser it runs in. We pin Chrome (via agent-browser) and accept that Safari/VoiceOver-specific issues may slip through.

### Consequences

- ✅ Single audit script (`tests/a11y/axe-audit.ts`) works for both local dev and CI.
- ✅ JSON results in `tests/a11y/results/axe-results.json` can be diffed across PRs.
- ❌ Manual AT testing still required for the ~60% of WCAG axe cannot verify (heading order, focus order, screen-reader announcements, reduced-motion behaviour).
- ❌ We do not get a "score" the way Lighthouse gives us — we get a raw pass/fail per rule. Acceptable: scores are marketing, not engineering.

---

## ADR-02: Focus trap strategy — delegate to Radix UI

**Date:** 2026-07-30 · **Status:** Accepted

### Context

RoyCSS ships three overlays:

1. **Effect Detail Dialog** (`<EffectDetailDialog>`, built on `@radix-ui/react-dialog`).
2. **Favorites Sheet** (`<FavoritesSheet>`, built on `@radix-ui/react-dialog` via `vaul`/shadcn `<Sheet>`).
3. **Search Overlay** (`<SearchOverlay>`, built on a custom Radix `<Dialog>` shell).

Each overlay must, per WCAG 2.4.3 + 2.1.2:
- Trap Tab/Shift+Tab inside itself while open.
- Move focus to the first focusable element on open.
- Restore focus to the trigger on close.
- Close on Escape.

### Options considered

| Option | Effort | Risk |
|--------|--------|------|
| A. Build a custom `useFocusTrap()` hook with `focusin`/`focusout` listeners | High | High — edge cases with iframes, shadow DOM, disabled elements |
| B. Use `react-focus-lock` (third-party) | Medium | Medium — another dependency; last release 2023 |
| C. Delegate to Radix UI's built-in `FocusTrap` | Low | Low — already used by `<Dialog>`/`<Sheet>`; battle-tested |

### Decision

**Option C — delegate to Radix.** Do not introduce a custom focus-trap hook.

### Rationale

- Radix `<Dialog>` already implements focus trap, escape handling, and focus restoration — the RoyCSS components just need to use `<DialogContent>` / `<SheetContent>` correctly.
- A custom hook would duplicate Radix behaviour and risk subtle regressions (e.g. focus being lost to a portalled element outside the trap).
- shadcn/ui's `<Dialog>` and `<Sheet>` wrappers set `aria-modal="true"` and `role="dialog"` automatically — no manual ARIA needed.
- The `keyboard-nav.ts` test verifies the trap behaviour end-to-end by Tab-walking and asserting the active element stays inside the overlay.

### Consequences

- ✅ Zero custom focus-trap code to maintain.
- ✅ Escape-to-close + focus restoration work out of the box.
- ⚠️ If a future overlay is **not** built on Radix, it must use the same primitives or implement an equivalent trap. The `keyboard-nav.ts` test catches regressions.
- ❌ Radix's trap is not perfect for screen readers that don't move focus with Tab (e.g. some JAWS QuickNav keys); manual AT testing is still required for Tier-1 AT.

---

## ADR-03: Reduced-motion implementation — CSS-first, with component opt-outs

**Date:** 2026-07-30 · **Status:** Accepted

### Context

RoyCSS ships many animations: hero blobs, 3D sphere, marquee, carousel auto-rotate, Framer Motion reveals, card hover lifts. WCAG 2.2.2 (Pause, Stop, Hide) and 2.5.4 (Motion Actuation) require that users who prefer reduced motion can use the site without nausea or distraction.

### Options considered

1. **JS-first:** Use Framer Motion's `useReducedMotion()` hook in every animated component.
2. **CSS-first:** Single global `@media (prefers-reduced-motion: reduce)` rule in `globals.css` that nukes `animation-duration` and `transition-duration`.
3. **Hybrid:** Global CSS rule + component-level opt-outs for animations that need different fallback behaviour (e.g. tilt → static; carousel → still auto-rotates but slower, with pause control).

### Decision

**Option 3 — Hybrid.** The global rule is the safety net; components add `prefers-reduced-motion` overrides where a static fallback is more appropriate than a near-instant animation.

### Rationale

- The global rule (already in `globals.css` since the project's first commit) kills 95% of motion at zero per-component cost.
- Some animations degrade badly when reduced to 0.01 ms — e.g. the 3D sphere becomes a single static frame, which is the intended fallback. The CSS already scopes these:
  ```css
  .roycss-sphere-3d { animation: roycss-sphere-spin 22s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .roycss-sphere-3d { animation: none; }
  }
  ```
- Scroll-driven parallax (`animation-timeline: scroll()`) is gated behind `@media (prefers-reduced-motion: no-preference)` so it never loads under reduced motion.
- Framer Motion components pass `useReducedMotion()` to motion props where a JS-side fallback is needed (e.g. `<ScrollReveal>` falls back to `initial={false}`).
- The **Carousel pause button** is the manual-control escape hatch required by 2.2.2 — it works regardless of `prefers-reduced-motion`.

### Consequences

- ✅ One CSS rule covers most cases; component overrides are localised.
- ✅ No JS bundle cost for users on reduced-motion (parallax doesn't mount).
- ⚠️ Every new animated component MUST be checked against reduced-motion. The `REVIEW-CHECKLIST.md` item 17 codifies this.
- ❌ The global `!important` nuke can hide genuine intent (e.g. a developer adding `transition: opacity 0.5s` for a fade-in sees it become 0.01 ms). This is the intended behaviour — if a fade is essential, the developer must add a `prefers-reduced-motion: reduce` override.

---

## ADR-04: Skip-link placement — first focusable, targets `<main id="effects">`

**Date:** 2026-07-30 · **Status:** Accepted

### Context

The RoyCSS page is a single long scroll with a sticky nav, hero, marquee, featured carousel, ~30 effect cards (virtualised), recipes, patterns, platform section, contact form, FAQ, and footer. A keyboard user Tab-ing through the entire page would take 100+ Tab presses to reach the main content. WCAG 2.4.1 (Bypass Blocks) requires a mechanism to skip repetitive content.

### Options considered

1. **Skip link → `<main id="main">`** at the very top of the page.
2. **Skip link → `<section id="effects">`** (the actual primary content).
3. **Multiple skip links** (skip to nav, skip to effects, skip to footer).

### Decision

**Option 2 — single skip link, first focusable element, targets `#effects` (the `<main>` element).**

### Rationale

- The page's primary content is the effects grid. The hero and nav are promotional/chrome.
- `<main id="effects">` already has `id="effects"` so the existing anchor link works without DOM changes.
- Multiple skip links increase cognitive load and clutter the first Tab stop; one well-targeted link is sufficient for a single-page site.
- The skip link is visually hidden via `sr-only` and revealed on focus via `focus:not-sr-only focus:absolute focus:top-4 focus:left-4 …` — passes 2.4.1 and the WAI tutorial pattern.

### Consequences

- ✅ Keyboard users skip 30+ nav elements with one Tab + Enter.
- ✅ Visual design is unaffected (skip link is invisible until focused).
- ⚠️ The skip link text "Skip to effects" assumes the user knows what "effects" means. Acceptable for a domain-specific site; if RoyCSS ever pivots to a general audience, the copy should be revisited.
- ❌ If `<main>` ever loses its `id="effects"`, the skip link breaks silently. The `keyboard-nav.ts` test asserts the link exists and its target resolves — catches this regression.

---

## ADR-05: ARIA vs semantic HTML — semantic-first, ARIA as polyfill

**Date:** 2026-07-30 · **Status:** Accepted

### Context

The first axiom of WAI-ARIA is *"No ARIA is better than bad ARIA."* RoyCSS's first a11y audit surfaced a textbook violation: a `<div role="button" tabindex="0">` wrapping an inner `<button>` ("Learn more"), producing a **nested-interactive** failure (axe rule `nested-interactive`, WCAG 4.1.2). The fix could be:

1. Add `aria-hidden="true"` and `tabindex="-1"` to the inner button (treat it as decoration).
2. Remove `role="button"` + `tabindex` from the outer div; let only the inner button be interactive.
3. Convert the outer div to a `<button>` and replace the inner button with a `<span>`.

### Decision

**Option 2 — remove the ARIA polyfill from the outer container; keep the native `<button>` as the sole interactive control.** Document this as the canonical RoyCSS pattern.

### Rationale

- The outer `div` had `role="button"` purely as a polyfill for "the whole card is clickable". That polyfill is what caused the violation.
- The inner `<button>` already provides the keyboard contract (Enter/Space activation) and the AT role. The outer div can keep its `onClick` for mouse convenience without claiming to be a button.
- ARIA's first rule: *"If you can use a native HTML element or attribute with the semantics and behaviour you require already built-in, instead of re-purposing an element and adding an ARIA role, state or property to do so, then do so."*
- The mouse user loses nothing: clicking anywhere on the card still toggles expansion (the onClick stays). The keyboard user gains a single, predictable button.

### Pattern codified for RoyCSS

```tsx
// ❌ Don't
<div role="button" tabIndex={0} onClick={toggle} onKeyDown={…}>
  …content…
  <button onClick={toggle}>Learn more</button>
</div>

// ✓ Do
<div onClick={toggle} className="… cursor-pointer …">
  …content…
  <button onClick={toggle} className="…">Learn more</button>
</div>
```

### Consequences

- ✅ axe `nested-interactive` violation disappears.
- ✅ Tab order is unambiguous (one Tab = one button).
- ✅ Screen readers announce one button, not two nested ones.
- ⚠️ Clicking the card body outside the button still works (mouse convenience), but is now a "bonus" interaction — the documented contract is the button.
- ❌ Developers may be tempted to re-add `role="button"` to the outer div "for clarity". The `REVIEW-CHECKLIST.md` item 6 catches this in code review.
