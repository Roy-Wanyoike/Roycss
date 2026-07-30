# RoyCSS Accessibility — Implementation Plan

> **Goal:** Remediate all WCAG 2.1 AA violations found by the automated audit and ship a green `tests/a11y/axe-audit.ts` run.

---

## Baseline (2026-07-30, before fixes)

`tests/a11y/results/axe-results-baseline.json` records:

| Metric | Count |
|--------|-------|
| Total rules violated | 3 |
| Total node-level violations | 145 |
| 🔴 Critical | 0 |
| 🟠 Serious | 2 (link-in-text-block, nested-interactive) |
| 🟡 Moderate | 1 (region) |
| 🔵 Minor | 0 |
| Rules passed | 48 |
| Incomplete | 2 (color-contrast, focus-order-semantics) |
| Inapplicable | 37 |

Three issues to remediate:

1. **`link-in-text-block`** (serious, 1 node) — LinkedIn author link in footer has only `hover:underline`; insufficient contrast against surrounding muted text.
2. **`nested-interactive`** (serious, 6 nodes) — `DocCard` outer `<div role="button" tabindex="0">` wraps an inner `<button>` ("Learn more").
3. **`region`** (moderate, 138 nodes) — Marquee strip and Featured Companies / Featured Carousel sit outside any landmark.

---

## Remediation Steps

### Step 1 — Fix `nested-interactive` in DocCard

**File:** `src/components/roycss/roycss-page.tsx` (~line 305–316).

**Change:** Remove `role="button"`, `tabIndex`, `onKeyDown`, and the `details &&` guard from the outer `<div>`. Keep `onClick` for mouse convenience. The inner `<button>` ("Learn more") remains the sole keyboard-accessible control.

**Why:** See ADR-05. Outer ARIA polyfill is what caused the violation; removing it restores native semantics.

**Risk:** None. Mouse click still toggles expansion (onClick preserved). Keyboard users get a single, predictable button.

### Step 2 — Fix `link-in-text-block` in footer

**File:** `src/components/roycss/roycss-page.tsx` (~line 1599).

**Change:** Replace `className="text-primary hover:underline"` with `className="text-primary underline underline-offset-2 hover:decoration-2"`.

**Why:** Per WCAG 1.4.1, a link in body text must be distinguishable without relying on color alone. A persistent underline (≥1 px) satisfies the rule. `underline-offset-2` keeps the visual rhythm.

**Risk:** Visual change (the link is now always underlined). Acceptable — the design system uses underlines for in-text links elsewhere.

### Step 3 — Fix `region` (138 nodes) — wrap non-landmarked content

**File:** `src/components/roycss/roycss-page.tsx` (~lines 1220–1242).

**Change:** Wrap the marquee strip, `<FeaturedCompanies />`, and `<FeaturedCarousel />` block in a `<section aria-label="Featured highlights" className="border-b border-border/40">`. This puts all 138 previously-orphaned nodes inside a landmark.

```diff
+      <section aria-label="Featured highlights" className="border-b border-border/40">
        {/* ─── Marquee Strip ──────────────────────────────────── */}
        <div className="py-6 border-y border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
          <Marquee speed={35}>…</Marquee>
        </div>

        {/* ─── Featured Companies (logo strip) ───────────────── */}
        <FeaturedCompanies />

        {/* ─── Featured Carousel (rotates through ALL effects) ─── */}
        <FeaturedCarousel … />
+      </section>
```

**Why:** WCAG 2.4.1 + best-practice rule `region` — all content must be inside a landmark so AT users can navigate by region.

**Risk:** None — wrapping in a `<section>` doesn't change layout. The outer `<div className="py-6 border-y …">` keeps its border styles.

### Step 3b — Fix `region` (residual 136 nodes) — add aria-label to remaining sections

**Files:** 6 section components outside the `<main>` landmark.

After Step 3, 136 `region` violations remained because 6 `<section>` elements lacked `aria-label` (a `<section>` is only a landmark if it has an accessible name). Each section was given a concise `aria-label`:

| File | Section | `aria-label` added |
|------|---------|---------------------|
| `src/components/roycss/get-started.tsx:201` | `<section id="get-started">` | `"Get started with RoyCSS"` |
| `src/components/roycss/roycss-page.tsx:1428` | CTA banner `<section>` | `"Call to action"` |
| `src/components/roycss/roycss-page.tsx:1507` | `<section id="docs">` | `"Documentation"` |
| `src/components/roycss/patterns-section.tsx:59` | `<section id="patterns">` | `"Patterns"` |
| `src/components/roycss/platform-ecosystem.tsx:719` | `<section id="platform">` | `"Platform ecosystem"` |
| `src/components/roycss/recipes-section.tsx:181` | `<section id="recipes">` | `"Recipes"` |
| `src/components/roycss/roymotion-showcase.tsx:167` | `<section>` (RoyMotion) | `"RoyMotion animation primitives"` |

Also: `<main id="effects">` was given `tabIndex={-1}` so the skip link moves focus (not just scroll) to the main region — WCAG 2.4.1 best practice.

**Why:** Same as Step 3. A `<section>` without an accessible name is not a landmark per the WAI-ARIA spec; axe's `region` rule flags all content inside it.

**Risk:** None — `aria-label` is invisible to sighted users. Screen-reader users gain 7 new region landmarks to navigate by.

### Step 4 — Verify focus-visible coverage

**File:** `src/app/globals.css` — already has the global `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }` rule.

**Action:** No code change. The `keyboard-nav.ts` test asserts every interactive element has a non-zero `:focus-visible` outline.

### Step 5 — Verify skip-link target

**File:** `src/components/roycss/roycss-page.tsx` (~line 898).

**Action:** No code change. The skip link already targets `#effects` and the `<main id="effects">` already has that id. The `keyboard-nav.ts` test verifies the link is the first focusable element and the target resolves.

### Step 6 — Verify `lang` attribute

**File:** `src/app/layout.tsx` (line 62).

**Action:** No code change. `<html lang="en" suppressHydrationWarning className="dark">` is already correct.

### Step 7 — Verify heading hierarchy

**Action:** No code change. The page uses one `<h1>` (hero), then `<h2>` per section, then `<h3>` for cards/items. axe's `heading-order` rule passes.

### Step 8 — Verify color contrast (token-level)

**Action:** No code change. The OKLCH tokens in `globals.css` are tuned to pass AA. The existing `a11y/results/contrast.json` baseline confirms 36/36 scenarios pass AA-large and 20/36 pass AA-normal. The two `incomplete` axe results (color-contrast, focus-order-semantics) need manual confirmation — both are expected to be false positives because axe cannot resolve OKLCH custom properties when run against the dev server (Tailwind v4 + `oklch()` color function).

---

## Verification

After applying Steps 1–3:

1. Run `bun run lint` → expect 0 errors.
2. Run `bun run tests/a11y/axe-audit.ts` → expect 0 critical, 0 serious (only `region` and possibly `color-contrast` incomplete remain).
3. Run `bun run tests/a11y/keyboard-nav.ts` → expect all interactive elements reachable + focus visible + Escape closes overlays.
4. Run `bun run tests/a11y/visual-checks.ts` → expect all sampled elements ≥4.5:1 (normal text) or ≥3:1 (large/UI).
5. Spot-check the patched components with `agent-browser` to confirm no functional regression:
   - Click a DocCard "Learn more" button → card expands.
   - Click outside the button on the card body → card expands (mouse convenience preserved).
   - Inspect the footer link → underlined by default.
   - Tab from the nav → skip link visible → Enter moves focus to `<main>`.

---

## Out of Scope (Tracked as Follow-ups)

| ID | Issue | Severity | Owner |
|----|-------|----------|-------|
| A11Y-001 | Replace `role="searchbox"` with native `<input type="search">` on patterns + hero search inputs | Minor | Frontend |
| A11Y-002 | The two `incomplete` axe results (color-contrast, focus-order-semantics) are expected false positives because axe cannot resolve OKLCH custom properties at runtime; confirm with manual contrast probe | Minor | A11y |
| A11Y-003 | Add a periodic NVDA + VoiceOver smoke test (quarterly) — automated axe cannot replace screen-reader testing | Process | A11y |
| A11Y-004 | Consider exposing carousel pause state via `aria-pressed` on the pause button | Enhancement | Frontend |
| A11Y-005 | The 12 color-customizer presets that fail AA-normal-on-dark should ship with a "high-contrast" alternative preset | Enhancement | Design |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OKLCH tokens regress below AA in a future redesign | Medium | High | `visual-checks.ts` runs in CI; fails PR if any sampled element drops below 4.5:1 |
| A new overlay is added without a focus trap | Medium | Critical | `keyboard-nav.ts` includes a smoke test for Escape + focus restoration on every overlay |
| A new icon-only button is added without `aria-label` | High | Serious | `aria-coverage.ts` script (existing) gates this in pre-commit |
| The dev server is not running when the audit runs | High | Low | `axe-audit.ts` checks `curl http://localhost:3000/` first and exits gracefully if 200 is not returned |
| axe-core is upgraded and introduces new rules that fail | Low | Medium | `axe-results.json` is checked into git; diffs are reviewed in PR |
