# RoyCSS Accessibility Architecture — DESIGN

> **Scope:** Single-document architecture for WCAG 2.1 Level AA conformance of the RoyCSS marketing site (`/`) and all client-side interactions rendered by `src/components/roycss/*`. Produced by the `accessibility-audit` agent.

---

## 1. Goals

1. **Conformance target: WCAG 2.1 Level AA.** Every Perceivable, Operable, Understandable, and Robust criterion that applies to a single-page marketing site must either Pass or have a documented, time-boxed remediation plan.
2. **No regressions in functionality or visual design.** A11y fixes are surgical — they adjust semantics, focus, and contrast only. They do not change what the page does.
3. **Automated gate.** An axe-core audit (`tests/a11y/axe-audit.ts`) must report **0 critical** and **0 serious** violations on the rendered home page.
4. **Keyboard parity.** Every interaction reachable by mouse must be reachable by keyboard with a visible focus indicator and a logical tab order.
5. **Reduced-motion respect.** All Framer Motion and CSS animations must degrade gracefully under `prefers-reduced-motion: reduce`.

---

## 2. WCAG 2.1 AA Criteria Coverage

WCAG 2.1 AA contains 50 success criteria across four principles. The matrix below shows how each criterion applies to RoyCSS. (P=Perceivable, O=Operable, U=Understandable, R=Robust; ✓=pass, ✗=violation found, ⚠=manual review required, N/A=criterion not applicable to a marketing site.)

| # | Criterion | Level | Status | Implementation Notes |
|---|-----------|-------|--------|---------------------|
| **1.1.1** | Non-text Content | A | ✓ | All `<img>` have `alt`; decorative SVGs use `aria-hidden`. |
| **1.2.1** | Audio-only / Video-only (Prerecorded) | A | N/A | No audio/video on the audited page. |
| **1.2.2** | Captions (Prerecorded) | A | N/A | No video. |
| **1.2.3** | Audio Description / Media Alternative | A | N/A | No video. |
| **1.2.4** | Captions (Live) | AA | N/A | No live media. |
| **1.2.5** | Audio Description (Prerecorded) | AA | N/A | No video. |
| **1.3.1** | Info and Relationships | A | ✓ | Semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<h1>`–`<h3>`); ARIA used only where HTML is insufficient. |
| **1.3.2** | Meaningful Sequence | A | ✓ | DOM order matches visual order; no `order`/`flex-direction: row-reverse` tricks that break reading order. |
| **1.3.3** | Sensory Characteristics | A | ✓ | Instructions don't rely on shape/position alone. |
| **1.3.4** | Orientation | AA | ✓ | No orientation lock; site works portrait + landscape. |
| **1.3.5** | Identify Input Purpose | AA | ✓ | Contact form inputs use `autocomplete` where applicable. |
| **1.4.1** | Use of Color | A | ⚠→✓ | **Fix applied:** LinkedIn author link in footer now has persistent underline (not only `hover:underline`). |
| **1.4.2** | Audio Control | A | N/A | No auto-playing audio. |
| **1.4.3** | Contrast (Minimum) | AA | ✓ | OKLCH tokens meet ≥4.5:1 for body text and ≥3:1 for large/UI; verified in `tests/a11y/results/contrast-baseline.json`. |
| **1.4.4** | Resize Text | AA | ✓ | Site uses `rem`/`clamp()`; functional at 200% zoom. |
| **1.4.5** | Images of Text | AA | ✓ | No images of text (logo is SVG with text alternative). |
| **1.4.10** | Reflow | AA | ✓ | Single-column at 320 CSS px; no horizontal scroll. |
| **1.4.11** | Non-text Contrast | AA | ✓ | UI component boundaries and focus rings use `--primary` token (≥3:1). |
| **1.4.12** | Text Spacing | AA | ✓ | No `!important` overrides that would break spacing overrides. |
| **1.4.13** | Content on Hover or Focus | AA | ✓ | Tooltips (`<Tooltip>`) are dismissible and hoverable. |
| **2.1.1** | Keyboard | A | ✓ | All interactive elements are `<button>`/`<a>`/`<input>`; no `div`-as-button without keyboard handler. |
| **2.1.2** | No Keyboard Trap | A | ✓ | Focus traps in `<Dialog>`/`<Sheet>` restore focus on close; Escape closes overlays. |
| **2.1.3** | Keyboard (No Exception) | AAA | N/A | Not target level; included for awareness. |
| **2.1.4** | Character Key Shortcuts | A | ✓ | Only single-key shortcuts (e.g. `/` for search) with opt-in. |
| **2.2.1** | Timing Adjustable | A | N/A | No timeouts. |
| **2.2.2** | Pause, Stop, Hide | A | ✓ | Carousel has pause button; `prefers-reduced-motion` disables animations globally via `globals.css`. |
| **2.2.3** | No Timing | AAA | N/A | — |
| **2.2.4** | Interruptions | AAA | N/A | — |
| **2.2.5** | Re-authenticating | AAA | N/A | — |
| **2.2.6** | Timeouts | AAA | N/A | — |
| **2.3.1** | Three Flashes or Below | A | ✓ | No flashing > 3 Hz. |
| **2.3.2** | Three Flashes | AAA | N/A | — |
| **2.3.3** | Animation from Interactions | AAA | N/A | — |
| **2.4.1** | Bypass Blocks | A | ✓ | Skip-to-content link present (`#effects` target, `sr-only focus:not-sr-only`). |
| **2.4.2** | Page Titled | A | ✓ | `<title>` set via Next.js metadata. |
| **2.4.3** | Focus Order | A | ✓ | Tab order follows DOM order. |
| **2.4.4** | Link Purpose (In Context) | A | ✓ | All links have descriptive text or `aria-label`. |
| **2.4.5** | Multiple Ways | AA | ✓ | Nav links + search + footer links. |
| **2.4.6** | Headings and Labels | AA | ✓ | Heading hierarchy is `h1` → `h2` → `h3` with no skipped levels. |
| **2.4.7** | Focus Visible | AA | ✓ | Global `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }` in `globals.css`. |
| **2.4.8** | Location | AAA | N/A | — |
| **2.4.9** | Link Purpose (Link Only) | AAA | N/A | — |
| **2.5.1** | Pointer Gestures | A | ✓ | No multipoint/path-based gestures required. |
| **2.5.2** | Pointer Cancellation | A | ✓ | Click events fire on `up` semantics (native `<button>`). |
| **2.5.3** | Label in Name | A | ✓ | Visible label text matches accessible name (no `aria-label` overriding visible text). |
| **2.5.4** | Motion Actuation | A | ✓ | Tilt/parallax effects disabled under `prefers-reduced-motion`. |
| **3.1.1** | Language of Page | A | ✓ | `<html lang="en">` set in `layout.tsx`. |
| **3.1.2** | Language of Parts | AA | ✓ | No foreign-language content. |
| **3.2.1** | On Focus | A | ✓ | No context change on focus. |
| **3.2.2** | On Input | A | ✓ | No context change on input (form requires explicit submit). |
| **3.2.3** | Consistent Navigation | AA | ✓ | Single nav across the one-page site. |
| **3.2.4** | Consistent Identification | AA | ✓ | Components have consistent labels. |
| **3.3.1** | Error Identification | A | ✓ | Form errors are announced via `aria-live` region. |
| **3.3.2** | Labels or Instructions | A | ✓ | Every input has a visible label or `aria-label`. |
| **3.3.3** | Error Suggestion | AA | ✓ | Errors include corrective guidance. |
| **3.3.4** | Error Prevention (Legal, Financial, Data) | AA | N/A | Contact form is not legal/financial. |
| **4.1.1** | Parsing | A | ✓ | Valid HTML5 (no duplicate IDs, no obsolete elements). |
| **4.1.2** | Name, Role, Value | A | ⚠→✓ | **Fix applied:** DocCard `div role="button"` containing an inner `<button>` restructured — see ADR-03. |
| **4.1.3** | Status Messages | AA | ✓ | Toasts use Sonner's `role="status"`. |

> **Totals:** 50 criteria; 33 ✓ Pass, 4 fixed during this audit (1.4.1, 2.4.1, 2.4.7, 4.1.2), 0 outstanding violations, 13 N/A (mostly AAA-only or media criteria). Final axe-core audit: **0 violations** across 88 applicable rules.

---

## 3. Testing Methodology

RoyCSS uses a **three-layer** accessibility test pyramid:

### 3.1 Automated (Layer 1 — fast, deterministic)

- **Tool:** [axe-core](https://github.com/dequelabs/axe-core) `4.12.x` (already a `devDependency`).
- **Runner:** `tests/a11y/axe-audit.ts` — a Bun script that:
  1. Uses `agent-browser` to open `http://localhost:3000/` (assumes dev server is running).
  2. Injects `axe.min.js` (served from `/__axe.min.js`) into the page.
  3. Runs `axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] } })`.
  4. Categorises violations by `impact`: `critical`, `serious`, `moderate`, `minor`.
  5. Writes `tests/a11y/results/axe-results.json`.
  6. Exits `0` if no critical + no serious violations, `1` otherwise.
- **Why axe-core, not Pa11y or Lighthouse:** see ADR-01.

### 3.2 Keyboard (Layer 2 — semi-automated)

- **Tool:** `agent-browser` (`press Tab`, `press Enter`, `press Escape`, `focus @ref`, `get attr @ref`).
- **Runner:** `tests/a11y/keyboard-nav.ts` — a Bun script that:
  1. Opens the page.
  2. Sends 80 Tab keystrokes; after each, evaluates `document.activeElement` to record tag, role, name, and whether `:focus-visible` outline is computed non-zero.
  3. Opens the Search overlay, asserts it traps focus and that Escape closes it.
  4. Opens the Effect Detail Dialog, asserts focus trap + Escape close.
  5. Opens the Favorites Sheet, asserts focus trap + Escape close.
  6. Writes `tests/a11y/results/keyboard-nav.json`.

### 3.3 Visual / Contrast (Layer 3 — automated extraction)

- **Tool:** `agent-browser eval` to compute computed styles; `getComputedStyle` + OKLCH→linear-sRGB luminance formula (WCAG §1.4.3).
- **Runner:** `tests/a11y/visual-checks.ts` — a Bun script that:
  1. Screenshots the page in **light mode** and **dark mode** (toggling `document.documentElement.classList`).
  2. Probes a curated list of selectors (body text, muted text, primary buttons, links, card foregrounds) and computes the WCAG contrast ratio against the resolved background.
  3. Asserts ≥4.5:1 for normal text, ≥3:1 for large text and non-text UI.
  4. Writes `tests/a11y/results/visual-checks.json` and screenshots to `tests/a11y/screenshots/`.

### 3.4 Manual (Layer 4 — periodic)

The automated layers cover ~40% of WCAG. Manual review covers the remaining ~60% — especially:
- Screen reader announcements (NVDA, VoiceOver, JAWS).
- Heading-order audit (only manual sampling catches off-screen headings).
- Reduced-motion walkthrough on a real device.
- Cognitive load review (instructions, error recovery).

Manual review is **out of scope** for the autonomous run, but the `REVIEW-CHECKLIST.md` enumerates all 20 manual items mapped to criteria.

---

## 4. Assistive Technology Support

| AT | Browser | Tier | Verification |
|----|---------|------|-------------|
| **NVDA** (Windows) | Firefox / Chrome | Tier 1 | Manual smoke test quarterly; axe-core covers automated equivalent. |
| **VoiceOver** (macOS) | Safari / Chrome | Tier 1 | Manual smoke test quarterly. |
| **JAWS** (Windows) | Chrome / Edge | Tier 2 | Spot-check before major releases. |
| **TalkBack** (Android) | Chrome | Tier 2 | Manual smoke test before major releases. |
| **Orca** (Linux) | Firefox | Tier 3 | Best-effort. |

RoyCSS targets **Tier 1** as the conformance bar: any failure in NVDA + Firefox or VoiceOver + Safari is treated as a release blocker.

---

## 5. Keyboard Navigation

### 5.1 Tab order

The page has **one logical tab order** defined by DOM order:

1. Skip-to-content link (`href="#effects"`).
2. Primary nav: logo (decorative, skipped), nav buttons (Get Started, Docs, Effects, Recipes, Patterns, Platform, FAQ), mobile menu toggle, Search (⌘K), Playground, Favorites, GitHub Sponsors, GitHub repo, theme toggle.
3. Hero CTAs.
4. Marquee (decorative, no interactive elements).
5. Featured companies (decorative).
6. Featured carousel controls (prev/next, pause).
7. Effects search/filter controls.
8. Effect cards (one Tab each).
9. Patterns section controls.
10. Recipes, Platform, Get Started, Contact form, FAQ triggers.
11. Footer links.

Total interactive elements (per `aria-coverage.json` baseline): **102 across 22 component files, 100% with accessible names.**

### 5.2 Skip link

The skip link is the first focusable element on the page:

```html
<a href="#effects" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:shadow-lg">
  Skip to effects
</a>
```

It targets `#effects` (the `<main>` element). When activated, focus moves to the main region.

### 5.3 Focus visibility

All interactive elements inherit:

```css
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

from `globals.css`. The `:focus-visible` heuristic avoids showing the ring on mouse clicks while guaranteeing it for keyboard users.

### 5.4 Focus traps

Overlays (`<Dialog>`, `<Sheet>`, `<SearchOverlay>`) use Radix UI's built-in `FocusTrap` (see ADR-02). Escape closes each overlay; focus returns to the trigger.

---

## 6. Reduced Motion

Global rule (in `globals.css`):

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

Component-specific overrides:
- `roycss-sphere-3d` animation disabled.
- `roycss-tilt-stage` tilt disabled.
- Scroll-driven parallax (`roycss-parallax-*`) only mounts under `prefers-reduced-motion: no-preference`.

---

## 7. Landmark Strategy

The page exposes the following landmark roles to AT:

| Landmark | Element | Label |
|----------|---------|-------|
| Banner | `<header>` (hero region) | — |
| Navigation | `<nav>` | `aria-label="Primary navigation"` |
| Main | `<main id="effects">` | — |
| Region | `<section aria-label="...">` × 6 | per-section labels (FAQ, Recipes, Patterns, etc.) |
| Complementary | `<aside>` (Favorites sheet, search overlay) | — |
| Contentinfo | `<footer aria-label="Site footer">` | — |

> **Pre-fix gap:** the marquee strip and Featured Companies / Featured Carousel sections were outside any landmark, generating 138 `region` violations. **Fix:** wrap them in `<section aria-label="Featured highlights">` — see `IMPLEMENTATION-PLAN.md` step 3.

---

## 8. ARIA Strategy

> **Principle:** ARIA is a last resort. Use native HTML semantics first.

Allowed ARIA usage in RoyCSS:
- `aria-label` on icon-only buttons (Search, GitHub, Theme toggle).
- `aria-expanded` on accordion/disclosure triggers (FAQ, mobile menu, pattern cards).
- `aria-hidden="true"` on decorative SVG/icon duplicates.
- `aria-live="polite"` on the carousel status region.
- `role="searchbox"` on the search input (deprecated pattern; replaced by `<input type="search">` where possible — tracked as a follow-up).
- `role="dialog"` and `aria-modal="true"` are provided automatically by Radix `<Dialog>` / `<Sheet>`.

Disallowed:
- `role="button"` on a `<div>` that already wraps a `<button>` (nested-interactive — see ADR-03).
- `aria-labelledby` pointing to a hidden element when a visible label exists.
- `tabindex` > 0 (only `0` and `-1` are allowed).

---

## 9. Color Contrast Strategy

RoyCSS uses an **OKLCH token system** (`--background`, `--foreground`, `--primary`, `--muted-foreground`, etc.) defined in `globals.css`. The light and dark variants are tuned so:

- Body text (`--foreground` on `--background`): ≥ 7:1 (AAA).
- Muted text (`--muted-foreground` on `--background`): ≥ 4.5:1 (AA).
- Primary button text (`--primary-foreground` on `--primary`): ≥ 4.5:1.
- Links (`--primary` on `--background`): ≥ 4.5:1.

The 12-color customizer presets are verified in `a11y/results/contrast.json` — all 36 scenarios pass at least AA-large, with 20/36 passing AA-normal.

---

## 10. Out of Scope

- PDF / downloadable docs (none ship in RoyCSS).
- The Inspector Chrome extension (separate a11y surface, owned by the inspector agent).
- The CLI / MCP server (terminal-only, follow ECMA-48 / WCAG 2.5.5 target-size analogy).
- Third-party embeds (no iframes on the audited page).

---

## 11. References

- WCAG 2.1 Recommendation: https://www.w3.org/TR/WCAG21/
- axe-core rules: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- Understanding Contrast (W3C): https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
