# i18n & RTL Review Checklist

15 items. Each item has: **What**, **Why**, **How to verify**, **Pass criteria**.

---

## 1. Logical properties — margins

**What:** No `margin-left` or `margin-right` in any `effects-batch-*.ts` `cssCode`.
**Why:** These are the most common physical-property violations and the most visible in RTL.
**How:** `bun run tests/i18n/logical-properties-audit.ts` → `results/physical-properties.json` → filter `property` ∈ `{margin-left, margin-right}`.
**Pass:** 0 new violations introduced (top 20 fixed; remainder documented).

---

## 2. Logical properties — padding

**What:** No `padding-left` or `padding-right`.
**Why:** Padding affects internal spacing of buttons, cards, inputs — breaks icon+text alignment in RTL.
**How:** Same audit, filter `property` ∈ `{padding-left, padding-right}`.
**Pass:** 0 new violations.

---

## 3. Logical properties — borders

**What:** No `border-left` / `border-right` (including `-width`, `-color`, `-style` variants).
**Why:** Border-accent effects (cards, callouts) are a top use case; a left-accent bar in Arabic should be a right-accent bar.
**How:** Same audit, filter `property` starts with `border-left` or `border-right`.
**Pass:** 0 new violations.

---

## 4. Logical properties — positioned offsets

**What:** No bare `left:` or `right:` declarations (used for `position: absolute/fixed/relative`).
**Why:** Side-nav, tooltips, popovers — flipping these in RTL is essential.
**How:** Same audit, filter `property` ∈ `{left, right}`. Note: `left`/`right` inside `translateX()` or `@keyframes` selectors are flagged for human review per ADR-03.
**Pass:** 0 new violations; flagged `translateX(` cases reviewed and either fixed or annotated `/* RTL: positional, no flip needed */`.

---

## 5. Logical properties — text alignment

**What:** No `text-align: left` / `text-align: right`.
**Why:** `text-align: start` / `end` are direction-aware and have universal browser support.
**How:** Same audit, filter `property` ∈ `{text-align: left, text-align: right}`.
**Pass:** 0 violations.

---

## 6. Logical properties — float

**What:** No `float: left` / `float: right`.
**Why:** `float: inline-start` / `inline-end` are direction-aware (Chromium 105+, Safari 15.4+).
**How:** Same audit, filter `property` ∈ `{float: left, float: right}`.
**Pass:** 0 violations.

---

## 7. OKLCH colors — no hex literals

**What:** No `#rgb`, `#rrggbb`, `#rrggbbaa`, `#rrrrggggbbbb` color literals in `cssCode`.
**Why:** Marketing claim is "OKLCH colors". Hex literals also cannot express wide-gamut colors.
**How:** `bun run tests/i18n/oklch-audit.ts` → `results/color-violations.json` → filter `format === "hex"`.
**Pass:** 0 new violations (top 20 fixed; remainder documented).

---

## 8. OKLCH colors — no `rgb()` / `rgba()`

**What:** No `rgb(...)` or `rgba(...)` function calls.
**Why:** Same as #7. Use `oklch(... / alpha)` or `color-mix(in oklch, oklch(...) N%, transparent)`.
**How:** Same audit, filter `format ∈ {rgb, rgba}`.
**Pass:** 0 new violations.

---

## 9. OKLCH colors — no `hsl()` / `hsla()`

**What:** No `hsl(...)` or `hsla(...)` function calls.
**Why:** HSL is not perceptually uniform (yellow at 50% lightness is much brighter than blue at 50% lightness). OKLCH is.
**How:** Same audit, filter `format ∈ {hsl, hsla}`.
**Pass:** 0 violations.

---

## 10. `<html dir>` attribute

**What:** The showcase site's `<html>` element has a `dir` attribute (either `ltr` or `rtl`, never absent).
**Why:** `dir` is the HTML-spec way to declare text direction; it cascades and is read by `:dir()` and screen readers.
**How:** `curl http://localhost:3000/ | rg '<html[^>]*dir='` — or agent-browser `document.documentElement.dir`.
**Pass:** `dir` is non-empty. (In this audit, the RTL render test sets it via JS for testing; production middleware is Phase 3 future work.)

---

## 11. `<html lang>` attribute

**What:** `<html lang="...">` is set to a valid BCP-47 tag.
**Why:** Required for screen readers, hyphenation, font fallback, and search engines.
**How:** `curl http://localhost:3000/ | rg '<html[^>]*lang='`.
**Pass:** `lang` is set (currently `en`; per-locale is Phase 3 future work).

---

## 12. RTL render test — no layout breakage

**What:** When `dir="rtl"` is applied to `<html>`, the page renders without horizontal overflow, overlapping elements, or off-screen content.
**Why:** Catch hidden LTR assumptions in CSS (e.g. `left: 0` on a positioned element that should be `right: 0` in RTL).
**How:** `tests/i18n/rtl-render-test.ts` — agent-browser takes LTR + RTL screenshots, checks `document.documentElement.scrollWidth <= window.innerWidth + 5`.
**Pass:** No horizontal overflow; VLM or manual review confirms no overlap.

---

## 13. RTL render test — text direction reversed

**What:** After setting `dir="rtl"`, block-level text is right-aligned and inline text flows right-to-left.
**Why:** Confirms the `dir` attribute actually took effect.
**How:** `tests/i18n/rtl-render-test.ts` — agent-browser reads `getComputedStyle(document.body).direction` and asserts it equals `"rtl"`. Also checks a known text element's bounding box left edge is greater than 50% of viewport width.
**Pass:** `direction: rtl` computed style; text visually right-aligned in screenshot.

---

## 14. Five specific effects render in both directions

**What:** Five RoyCSS effects are applied to a test `<div>` in both LTR and RTL modes and screenshotted.
**Why:** Per-effect verification that logical properties are actually working.
**How:** `tests/i18n/rtl-render-test.ts` — applies `roycss-pulse-glow`, `roycss-hover-lift`, `roycss-card-glow`, `roycss-border-accent`, `roycss-text-shimmer` (or whichever 5 are present in the runtime DOM) and screenshots each in both directions.
**Pass:** Screenshots exist for all 5 effects × 2 directions (10 files); no effect throws a console error.

---

## 15. No new console errors in RTL mode

**What:** Loading the showcase site in RTL mode introduces no new console errors vs LTR mode.
**Why:** Catch JS that assumes LTR (e.g. `element.getBoundingClientRect().left` used for positioning logic).
**How:** `tests/i18n/rtl-render-test.ts` — agent-browser captures `console.error` and `pageerror` events in both modes and diffs them.
**Pass:** No new errors in RTL that aren't also present in LTR.

---

## Sign-off

Reviewer: ____________________  Date: __________

For each item, mark ✅ Pass / ❌ Fail / ⚠️ N/A (with note).

| # | Item | Status | Note |
|---|------|--------|------|
| 1 | Margins | | |
| 2 | Padding | | |
| 3 | Borders | | |
| 4 | Position offsets | | |
| 5 | Text align | | |
| 6 | Float | | |
| 7 | No hex | | |
| 8 | No rgb/rgba | | |
| 9 | No hsl/hsla | | |
| 10 | `<html dir>` | | |
| 11 | `<html lang>` | | |
| 12 | RTL no breakage | | |
| 13 | RTL direction reversed | | |
| 14 | 5 effects × 2 dirs | | |
| 15 | No new console errors | | |
