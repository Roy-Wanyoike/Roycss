# RoyCSS Accessibility — Review Checklist

> 20 review items mapped to specific WCAG 2.1 AA criteria. Use during code review and periodic audits. Each item links to the criterion, the axe rule (if any), the manual check, and the pass condition.

---

## Perceivable

### 1. ★ 1.1.1 Non-text Content — All images have alt text
- **Axe rule:** `image-alt`
- **Manual check:** `grep -rn '<img' src/components` → every `<img>` has `alt="…"` (empty `alt=""` allowed for decorative).
- **Pass condition:** 0 missing `alt` attributes.
- **RoyCSS status:** ✓ Pass — confirmed in `tests/a11y/results/axe-results.json` (`image-alt` inapplicable: no `<img>` elements on the audited page).

### 2. ★ 1.3.1 Info and Relationships — Semantic landmarks present
- **Axe rule:** `region`, `landmark-one-main`
- **Manual check:** Open the page in axe DevTools; verify `<header>`, `<nav>`, `<main>`, `<section aria-label="…">`, `<footer>` are present and labelled.
- **Pass condition:** `region` rule reports 0 violations.
- **RoyCSS status:** ✓ Pass after Steps 3 + 3b of `IMPLEMENTATION-PLAN.md` (all 7 `<section>` elements now have `aria-label`).

### 3. ★ 1.3.1 Info and Relationships — Heading hierarchy is sequential
- **Axe rule:** `heading-order`
- **Manual check:** Tab through the page; the heading outline should be `h1` → `h2` → `h3` with no skipped levels.
- **Pass condition:** `heading-order` rule reports 0 violations.
- **RoyCSS status:** ✓ Pass.

### 4. ★ 1.4.1 Use of Color — Links distinguishable without color
- **Axe rule:** `link-in-text-block`
- **Manual check:** Find every `<a>` inside a paragraph of text; verify it has underline or other non-color styling.
- **Pass condition:** `link-in-text-block` rule reports 0 violations.
- **RoyCSS status:** ✓ Pass after Step 2 of `IMPLEMENTATION-PLAN.md`.

### 5. ★ 1.4.3 Contrast (Minimum) — Text contrast ≥4.5:1 (≥3:1 large)
- **Axe rule:** `color-contrast`
- **Manual check:** Run `tests/a11y/visual-checks.ts`; verify body, muted, primary, and link text against the resolved background.
- **Pass condition:** All sampled elements meet AA threshold.
- **RoyCSS status:** ✓ Pass (existing `a11y/results/contrast.json` + new `tests/a11y/results/visual-checks.json`).

### 6. ★ 1.4.11 Non-text Contrast — UI component boundaries ≥3:1
- **Axe rule:** `color-contrast` (partial)
- **Manual check:** Inspect button borders, focus indicators, form input borders; verify they contrast ≥3:1 against adjacent colors.
- **Pass condition:** No `color-contrast` violations on UI components.
- **RoyCSS status:** ✓ Pass.

### 7. ★ 1.4.10 Reflow — No horizontal scroll at 320 CSS px
- **Axe rule:** (none — manual)
- **Manual check:** Resize browser to 320 × 800 px; verify no horizontal scrollbar appears; verify no content is clipped.
- **Pass condition:** `document.documentElement.scrollWidth <= window.innerWidth + 0` at 320 px.
- **RoyCSS status:** ✓ Pass (page uses responsive Tailwind utilities; no fixed-width content > 320 px).

### 8. ★ 1.4.12 Text Spacing — No loss of content when spacing is overridden
- **Axe rule:** (none — manual)
- **Manual check:** Apply the WCAG 1.4.12 bookmarklet (line-height 1.5, paragraph spacing 2x, letter-spacing 0.12em, word-spacing 0.16em); verify no text is clipped or overlaps.
- **Pass condition:** No loss of content or functionality.
- **RoyCSS status:** ✓ Pass (no `!important` overrides on text-related properties; no fixed heights on text containers).

---

## Operable

### 9. ★ 2.1.1 Keyboard — All interactions reachable via keyboard
- **Axe rule:** (none — `keyboard-nav.ts` covers this)
- **Manual check:** Run `tests/a11y/keyboard-nav.ts`; verify every interactive element receives focus during a 80-press Tab walk.
- **Pass condition:** `results/keyboard-nav.json` reports `allReachable: true`.
- **RoyCSS status:** ✓ Pass.

### 10. ★ 2.1.2 No Keyboard Trap — Focus can leave every component
- **Axe rule:** (none — `keyboard-nav.ts` covers this for overlays)
- **Manual check:** Open each overlay (Search, Dialog, Sheet); Tab through; verify Escape closes and focus returns to the trigger.
- **Pass condition:** `results/keyboard-nav.json` reports `escapeClosesOverlays: true`.
- **RoyCSS status:** ✓ Pass (Radix UI provides the trap; test verifies).

### 11. ★ 2.4.1 Bypass Blocks — Skip link present and functional
- **Axe rule:** `bypass`
- **Manual check:** Press Tab once on page load; verify the skip link is the first focusable element and activates on Enter.
- **Pass condition:** Skip link present, target exists, focus moves on activation.
- **RoyCSS status:** ✓ Pass — see ADR-04.

### 12. ★ 2.4.3 Focus Order — Tab order matches reading order
- **Axe rule:** `focus-order-semantics` (incomplete)
- **Manual check:** Tab through the page; verify the order is logical (top-to-bottom, left-to-right in LTR).
- **Pass condition:** No element appears out of expected order.
- **RoyCSS status:** ✓ Pass (no positive `tabindex` values in the codebase; DOM order matches visual order).

### 13. ★ 2.4.4 Link Purpose (In Context) — Link text is descriptive
- **Axe rule:** `link-name`
- **Manual check:** Inspect every `<a>`; verify the link text or `aria-label` describes the destination (no "click here").
- **Pass condition:** `link-name` rule reports 0 violations.
- **RoyCSS status:** ✓ Pass — icon-only links all have `aria-label` (e.g. `aria-label="GitHub repository"`).

### 14. ★ 2.4.6 Headings and Labels — Heading text is descriptive
- **Axe rule:** (none — manual)
- **Manual check:** Read every heading; verify it describes its section (no empty headings, no generic "Section").
- **Pass condition:** All headings are non-empty and descriptive.
- **RoyCSS status:** ✓ Pass.

### 15. ★ 2.4.7 Focus Visible — Focus indicator is visible
- **Axe rule:** (none — `keyboard-nav.ts` covers this)
- **Manual check:** Tab through; verify every interactive element shows the `:focus-visible` outline (`2px solid var(--primary)` with `2px` offset).
- **Pass condition:** `results/keyboard-nav.json` reports `focusVisibleOnAll: true`.
- **RoyCSS status:** ✓ Pass — global rule in `globals.css`.

### 16. ★ 2.5.3 Label in Name — Accessible name matches visible label
- **Axe rule:** `label-content-name-mismatch`
- **Manual check:** For every interactive element with both visible text and an `aria-label`, verify the `aria-label` starts with the visible text.
- **Pass condition:** 0 `label-content-name-mismatch` violations.
- **RoyCSS status:** ✓ Pass.

---

## Understandable

### 17. ★ 3.1.1 Language of Page — `<html lang>` is set
- **Axe rule:** `html-has-lang`
- **Manual check:** Inspect `<html>` tag; verify `lang="en"` (or appropriate code).
- **Pass condition:** `html-has-lang` and `valid-lang` rules pass.
- **RoyCSS status:** ✓ Pass — `<html lang="en">` in `layout.tsx`.

### 18. ★ 3.2.2 On Input — No unexpected context change on input
- **Axe rule:** (none — manual)
- **Manual check:** Interact with every form control; verify no navigation or modal opens without an explicit submit.
- **Pass condition:** No unexpected context changes.
- **RoyCSS status:** ✓ Pass — contact form requires explicit submit; search overlay opens on button click, not on input.

### 19. ★ 3.3.2 Labels or Instructions — Form inputs have labels
- **Axe rule:** `label`, `form-field-multiple-labels`
- **Manual check:** Inspect every `<input>`, `<textarea>`, `<select>`; verify it has a `<label>` or `aria-label`.
- **Pass condition:** 0 `label` violations.
- **RoyCSS status:** ✓ Pass — contact form uses shadcn `<Label>`; search inputs use `aria-label`.

---

## Robust

### 20. ★ 4.1.2 Name, Role, Value — No nested interactive controls
- **Axe rule:** `nested-interactive`
- **Manual check:** Inspect every `role="button"` / `role="link"` element; verify it does not contain focusable descendants.
- **Pass condition:** 0 `nested-interactive` violations.
- **RoyCSS status:** ✓ Pass after Step 1 of `IMPLEMENTATION-PLAN.md`. Pattern codified in ADR-05.

---

## Bonus — Motion & Animation (WCAG 2.2.2 + 2.5.4)

### B1. ★ 2.2.2 Pause, Stop, Hide — Auto-moving content has a pause control
- **Manual check:** Verify the Featured Carousel has a visible pause button; verify `prefers-reduced-motion: reduce` disables all non-essential animation.
- **Pass condition:** Carousel pause button works; global reduced-motion rule is active.
- **RoyCSS status:** ✓ Pass — carousel has pause button (line ~728 of `roycss-page.tsx`); global rule in `globals.css`.

### B2. ★ 2.5.4 Motion Actuation — Tilt/parallax disabled by reduced-motion
- **Manual check:** Enable `prefers-reduced-motion: reduce` in DevTools; verify the 3D sphere, parallax blobs, and tilt cards are static.
- **Pass condition:** No motion-triggered functionality is essential; all motion is decorative.
- **RoyCSS status:** ✓ Pass — all motion is decorative; reduced-motion overrides in `globals.css` and per-component.
