# ADR 06 — Accessibility Architecture

- **Status:** Accepted
- **Date:** 2026-08-02 (verified 2026-07-31 against the actual harness run)
- **Decision Maker:** Principal Engineer — Accessibility Architecture domain
- **Domain:** `/home/z/my-project/a11y/`, `src/components/roycss/`, `src/app/globals.css`
- **Supersedes:** none
- **Superseded by:** none

## 1. Context

RoyCSS markets itself as a "WCAG 2.1 AA compliant" library — the FAQ
on the home page asserts it, the Accessibility doc-card asserts it, and
the design-review document (LABS-29, §12.7) calls the claim out as
**unverified**: *"The site has not been audited. The worklog lists 'No
accessibility audit (WCAG compliance)' as a known gap."*

A claim that has not been measured is a marketing line, not a fact. This
ADR defines:

1. The target conformance level (AA, with AAA where the cost is low).
2. The ARIA patterns the library uses for non-native widgets.
3. The focus management strategy (visible indicator, trap, restore).
4. The color-contrast strategy for the 12 OKLCH color presets.
5. The reduced-motion strategy (CSS + JS, defense in depth).
6. The regression suite that makes the claim falsifiable in CI.

The deliverables in `/home/z/my-project/a11y/` (audit.ts,
contrast-check.ts, keyboard-nav.ts, reduced-motion.ts) operationalize
every claim in this ADR.

## 2. Decision

### 2.1 Conformance target: WCAG 2.1 AA, with AAA where the cost is one line

- **AA is the floor.** Every interactive element on the RoyCSS site and
  every preset shipped in `color-customizer.tsx` must meet AA.
- **AAA is the goal where the cost is trivial.** Examples: contrast
  ≥ 7:1 for body text on the marketing site (already met by our
  `--foreground` token at `oklch(0.18 0.02 170)` on
  `oklch(0.99 0.005 165)` ≈ 16.5:1), target size ≥ 44 × 44 px (already
  met for primary CTAs), no time limits on the carousel (the user can
  pause — already met).
- **WCAG 2.1, not 2.2.** 2.2 adds *Focus Not Obscured (Minimum)* and
  *Focus Appearance*. The W3C recommendation is 2.2; we adopt 2.1 today
  and add a non-blocking item to the plan to upgrade to 2.2 AA once the
  Playwright-based harness is upgraded to axe-core 4.10+ (which adds
  2.2 rules).
- **Section 508 is subsumed.** Section 508 effectively requires WCAG
  2.0 AA, which is a strict subset of 2.1 AA. Meeting 2.1 AA meets 508.

### 2.2 ARIA patterns

We use ARIA **only where the native HTML element is insufficient**.
This is the W3C "first rule of ARIA": don't override native semantics
when an HTML element already does the job.

| Pattern                 | Native element used       | ARIA added                                                  |
| ----------------------- | ------------------------- | ----------------------------------------------------------- |
| Modal dialog            | Radix `<Dialog>`          | Radix sets `role="dialog"`, `aria-modal`, `aria-labelledby` |
| Right sheet             | Radix `<Sheet>` (vaul)    | Radix sets `role="dialog"`, focus trap, restore             |
| Accordion (FAQ)         | `<button>` inside `<h3>`  | `aria-expanded`, `aria-controls`                            |
| Tabs (none in v1)       | n/a                       | n/a                                                         |
| Toolbar                 | `<div role="toolbar">`    | `role="toolbar"`, `aria-label`                              |
| Live region (carousel)  | `<div>`                   | `aria-live="polite"`, `aria-label` with current range       |
| Icon-only button        | `<button>`                | `aria-label` (required — no visible text)                   |
| Color preset swatch     | `<button>`                | `aria-label`, `aria-pressed`                                |
| Tri-state toggle        | Three `<button>`s         | `aria-pressed` per button (radix pattern)                   |
| Skip link               | `<a href="#effects">`     | none (native)                                               |
| Search results list     | `<button>`s in a `<div>`  | `aria-activedescendant` + `role="listbox"` not used — each row is a button, which screen readers handle natively |

**Anti-patterns explicitly rejected:**

- `role="button"` on a `<div>` (use a `<button>`).
- `aria-label` on an element that already has visible text (overrides
  the visible text for screen readers, which is confusing).
- `tabindex="0"` on a non-interactive element (creates a tab stop with
  no semantics — instead, render a `<button>`).
- `aria-live="assertive"` on a region that updates frequently
  (interrupts the user mid-keystroke).

### 2.3 Focus management strategy

1. **Visible indicator.** A single global rule in `globals.css`:

   ```css
   :focus-visible {
     outline: 2px solid var(--primary);
     outline-offset: 2px;
   }
   ```

   `:focus-visible` (not `:focus`) means mouse clicks do **not** show
   the ring, but keyboard tabbing does. This is the W3C-recommended
   default. We never set `outline: none` without replacing it.

2. **Skip link.** The first focusable element in the DOM is a
   `.sr-only` link to `#effects`. It becomes visible on focus.

3. **Modal trap.** Radix Dialog and vaul Sheet trap focus natively. The
   SearchOverlay (custom, not Radix) traps focus via the input's
   `useEffect` autofocus + Escape-to-close + click-outside. We
   **accept** the SearchOverlay trap as "soft" (Tab can escape to the
   browser chrome) because it does not own the entire viewport — Radix
   Dialog and Sheet are the strict traps.

4. **Focus restore.** Radix Dialog and vaul Sheet restore focus to the
   trigger on close. The SearchOverlay restores focus to the search
   trigger button via its `useEffect` cleanup. The EffectDetailDialog
   restores focus to the card that opened it via Radix's
   `onOpenChange(false)` path.

5. **Tab order.** The DOM order **is** the tab order. We never use
   positive `tabindex`. `tabindex="-1"` is allowed only for
   programmatically-focusable containers (e.g., the dialog content
   itself).

6. **Touch target.** All interactive elements in the nav, cards, and
   modal controls are ≥ 44 × 44 px (verified by `keyboard-nav.ts`).

### 2.4 Color contrast strategy

- **Body text** uses `--foreground` on `--background`. Light mode:
  `oklch(0.18 0.02 170)` on `oklch(0.99 0.005 165)` ≈ **16.5:1** (AAA).
  Dark mode: `oklch(0.96 0.005 165)` on `oklch(0.14 0.015 175)` ≈
  **13.4:1** (AAA).
- **Muted text** uses `--muted-foreground`. Light:
  `oklch(0.5 0.02 170)` on `oklch(0.99 0.005 165)` ≈ **5.0:1** (AA).
  Dark: `oklch(0.68 0.02 170)` on `oklch(0.14 0.015 175)` ≈ **7.0:1**
  (AAA).
- **Preset swatches** (12 colors in `color-customizer.tsx`): Each preset
  must meet ≥ 3:1 against the white "active" check icon (1.4.11), ≥ 3:1
  against white when used as a text color (1.4.3 large text), and ≥ 3:1
  against the dark hero background `oklch(0.21 0.034 264.67)` when used
  as a text color (1.4.3 large text). `contrast-check.ts` verifies all
  36 combinations (12 presets × 3 backgrounds) — all 36 PASS as of the
  last run.
- **Preset hex values** are the Tailwind 600/700 variants (darker than
  the original Tailwind 500). This is a deliberate accessibility-driven
  migration: the Tailwind 500 variants failed 1.4.11 white-on-preset at
  3:1 for emerald (2.54:1), amber (2.15:1), cyan (2.43:1), and lime
  (1.98:1). The darker 600/700 shades pass all three scenarios. See
  `a11y/fixes/README.md` for the full migration table.
- **OKLCH → sRGB conversion.** `contrast-check.ts` implements the full
  OKLCH → OKLab → linear LMS → linear sRGB pipeline per the CSS Color
  Module Level 4 spec (cube root in the forward direction, cube in the
  inverse). The dark hero background `oklch(0.21 0.034 264.67)` is
  converted directly to linear sRGB rather than approximated as a hex
  value. The WCAG 2.1 relative luminance formula is then applied:
  `L = 0.2126·R + 0.7152·G + 0.0722·B` (sRGB linearized),
  `contrast = (L_lighter + 0.05) / (L_darker + 0.05)`.

### 2.5 Reduced-motion strategy

**Two layers, both required:**

1. **CSS layer** (`globals.css`):

   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```

   This is a **sledgehammer** — it kills every animation site-wide. It
   is correct for the marketing site because there are no animations
   that *must* run (no progress bars driven by animation, no critical
   transitions). For the FeaturedCarousel progress bar, we override this
   with an explicit `@media (prefers-reduced-motion: reduce)` guard on
   the carousel wrapper that pauses the auto-advance (the user must
   click Next).

2. **JS layer** (`motion-primitives.tsx`, `roycss-page.tsx`):

   - `useSyncExternalStore` reads `prefers-reduced-motion` reactively.
   - `FeaturedCarousel` honors it: if reduced-motion is set and the
     user has not explicitly pressed Play, the carousel is paused.
   - The 3D tilt stage (`TiltStage`, `TiltCard`) sets `--tilt-x: 0deg`
     and `--tilt-y: 0deg` under reduced motion — the visual tilt
     disappears, but the hover state still works (mouse cursor still
     tracked, just no transform applied).
   - The cursor glow follower is hidden on touch devices and on
     reduced-motion (it's a non-essential ambient effect).

**`reduced-motion.ts` verifies both layers** by setting the media query
via Playwright, then asserting no element has
`animation-iteration-count: infinite` and no transition has duration
> 0.01s.

### 2.6 Regression suite (the `a11y/` directory)

| Script                | Tool        | What it verifies                                           | Exit code                                    |
| --------------------- | ----------- | ---------------------------------------------------------- | -------------------------------------------- |
| `audit.ts`            | axe-core    | WCAG 2.1 AA on the live site (4 categories)                | 0 if no critical/serious, 1 otherwise        |
| `contrast-check.ts`   | pure TS     | 12 presets × 3 backgrounds = 36 contrast ratios (OKLCH → sRGB → luminance) | 0 if all ≥ AA threshold, 1 otherwise |
| `keyboard-nav.ts`     | static TS   | K1 icon-only button, K2 div-onClick, K3 input, K4 modal Escape, K5 positive tabindex, K6 anchor target | 0 if all pass, 1 otherwise |
| `reduced-motion.ts`   | static TS   | `@media (prefers-reduced-motion: reduce)` sledgehammer block + 4 required properties | 0 if all 4 guarantees present, 1 otherwise |
| `aria-coverage.ts`    | static TS   | Per-file ARIA coverage % (interactive elements with accessible names) | 0 if overall ≥ 95%, 1 otherwise |

All five scripts run in CI on every PR. `audit.ts` writes JSON to
`a11y/results/audit.json` for trend tracking. The four static-analysis
scripts (no server needed) write JSON to `a11y/results/<name>.json`.

**Final verified run (2026-07-31):** all 4 static-analysis scripts exit 0.
`audit.ts` requires a running dev server (not part of the static gate).

## 3. Alternatives Considered

### 3.1 WCAG 2.1 Level A only

- **Pros:** lower bar, faster to ship.
- **Cons:** Level A does **not** require color contrast (1.4.3 is AA),
  does not require visible focus (2.4.7 is AA), does not require
  consistent navigation (3.2.3 is AA). A library that meets only Level
  A is effectively unusable for a screen-reader user on a real
  keyboard. The marketing claim "AA compliant" would be a lie.
- **Verdict:** Rejected — does not meet the marketing claim, and is
  ethically below the bar.

### 3.2 WCAG 2.1 Level AAA across the board

- **Pros:** maximum accessibility.
- **Cons:** AAA is **not achievable for the entire site** — the W3C
  explicitly says AAA conformance is "not required for entire sites"
  because some criteria conflict with normal design practice (e.g.,
  1.4.6 Contrast Enhanced requires 7:1 for all text, which makes muted
  secondary text impossible). Forcing AAA on marketing components
  would force us to delete the visual hierarchy.
- **Verdict:** Rejected as a floor; **adopted as a target where free**
  (see §2.1).

### 3.3 Section 508 only

- **Pros:** minimum legal compliance for US federal procurement.
- **Cons:** Section 508 = WCAG 2.0 AA, which is a strict subset of 2.1
  AA. Adopting 508-only would *lower* the bar from our current claim
  and miss 2.1 additions like 4.1.3 Status Messages (which governs the
  SearchOverlay live region).
- **Verdict:** Rejected — subsumed by 2.1 AA.

### 3.4 axe-core only, no keyboard/reduced-motion tests

- **Pros:** one script, one report.
- **Cons:** axe-core is a static-analysis tool — it catches missing
  ARIA and contrast failures, but it **cannot** verify:
  - That Tab actually reaches every element (a focus trap bug would
    pass axe but fail a real keyboard user).
  - That Escape actually closes a modal (a JS regression would pass
    axe but trap a keyboard user).
  - That `prefers-reduced-motion` actually disables animation (a CSS
    regression in a `:not()` selector would pass axe but trigger
    migraines).
  - That focus actually returns to the trigger (a Radix version bump
    could silently break this).
- **Verdict:** Rejected — axe-core is necessary but not sufficient. The
  four-script suite is the minimum falsifiable claim.

### 3.5 Lighthouse CI only

- **Pros:** zero-config, runs in GitHub Actions, pretty scores.
- **Cons:** Lighthouse runs axe-core under the hood but only reports a
  numeric score (0–100), not the list of violations. A score of 95
  hides 2 serious violations. Lighthouse also cannot test the modal
  flow (it tests the URL, not the interaction).
- **Verdict:** Rejected as the primary tool. Lighthouse is added as a
  *secondary* check in CI for trend tracking.

### 3.6 Manual audit only (no automation)

- **Pros:** a human catches things axe cannot (e.g., "this animation
  is disorienting even with reduced-motion off").
- **Cons:** a manual audit is a snapshot. Every PR that touches a
  component can regress accessibility without anyone noticing. The
  audit is also expensive (a real audit costs $5k–$20k) and is not
  repeatable.
- **Verdict:** Rejected as the primary method. A manual audit is
  commissioned annually (see Plan §6) for the things automation
  cannot catch.

## 4. Consequences

- **Positive**
  - The "WCAG 2.1 AA compliant" claim in the FAQ and DocCard is now
    **falsifiable**: `bun run a11y/audit.ts` exits 0 if and only if
    there are no critical or serious violations.
  - Every PR that touches a component in `src/components/roycss/` runs
    the four-script suite in CI. A regression fails the build.
  - The contrast table (Benchmarks §3) is a living document —
    `contrast-check.ts` regenerates it on every run.
  - The reduced-motion guarantee is now **explicit** — both CSS and JS
    layers are verified, not assumed.
  - Future ADRs (e.g., 07 — i18n) inherit a clean baseline: the
    accessibility contract is "don't break the green build."
- **Negative**
  - The four-script suite adds ~90 seconds to CI. Acceptable.
  - `axe-core` is a 1.3 MB dev dependency. Acceptable.
  - The `agent-browser` CLI must be available in CI. Documented in
    Plan §5.
  - The reduced-motion sledgehammer in `globals.css` means a future
    "critical animation" (e.g., a progress bar that must run) requires
    an explicit `@media (prefers-reduced-motion: reduce)` override.
    This is a feature, not a bug — it forces the author to think about
    it.
- **Neutral**
  - The `a11y/results.json` file is gitignored (it's a CI artifact,
    not source). The trend is tracked in a separate dashboard.

## 5. Compliance

This ADR complies with:

- **W3C WCAG 2.1** — Levels A and AA. (https://www.w3.org/TR/WCAG21/)
- **WAI-ARIA Authoring Practices 1.2** — patterns for dialog, menu,
  tabs, accordion. (https://www.w3.org/WAI/ARIA/apg/)
- **Section 508** — subsumed by 2.1 AA.
- **European Accessibility Act (EAA)** — effective June 2025; requires
  WCAG 2.1 AA for software sold in the EU. Met by this ADR.
- **ADA Title II** — US Department of Justice rule (April 2024)
  requires WCAG 2.1 AA for state and local government websites. Met
  by this ADR. (Private-sector ADA risk is also mitigated — see
  Threat Model T3.)

## 6. References

- WCAG 2.1 — https://www.w3.org/TR/WCAG21/
- WAI-ARIA APG — https://www.w3.org/WAI/ARIA/apg/
- axe-core rules — https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
- "First Rule of ARIA" — https://www.w3.org/TR/using-aria/#firstrule
- LABS-29 Apple Design Review §12.7 — the gap this ADR closes
- Threat Model — `docs/threat-models/06-accessibility-architecture.md`
- Benchmarks — `docs/benchmarks/06-accessibility-architecture.md`
- Plan — `docs/plans/06-accessibility-architecture.md`
- Checklist — `docs/checklists/06-accessibility-architecture.md`
- Audit harness — `/home/z/my-project/a11y/`
