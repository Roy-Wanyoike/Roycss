# i18n & RTL — Architecture Design

**Scope:** RoyCSS library (`src/lib/effects-batch-*.ts` — 1,569 effects across 34 batches) and the Next.js showcase at `http://localhost:3000/`.

**Goal:** Verify and enforce that every RoyCSS effect renders correctly in left-to-right (LTR) and right-to-left (RTL) writing modes, and that the showcase site supports RTL locales (Arabic `ar`, Hebrew `he`, Persian `fa`, Urdu `ur`) without layout breakage.

---

## 1. Why this matters

RoyCSS markets itself as "CSS logical properties for RTL/I18n support" and "OKLCH colors". A single physical property (e.g. `margin-left`) silently breaks the visual intent of an effect in Arabic or Hebrew — the spinner loads on the wrong side, the highlight bleeds the wrong way, the badge overlays the icon. Because effects are copy-pasted verbatim by users, a non-compliant effect propagates the bug into every downstream codebase.

This audit closes that gap with:

1. **Static analysis** of all 34 batch files for physical properties and non-OKLCH color formats.
2. **Runtime verification** with agent-browser in LTR + RTL modes.
3. **Surgical fixes** for the top 20 most-visible violations in each category, with the remainder documented for follow-up.

---

## 2. CSS logical properties mapping

The canonical mapping enforced by `tests/i18n/logical-properties-audit.ts`:

| Physical (LTR-only)        | Logical (direction-aware)      | Notes |
|----------------------------|--------------------------------|-------|
| `margin-left`              | `margin-inline-start`          | |
| `margin-right`             | `margin-inline-end`            | |
| `padding-left`             | `padding-inline-start`         | |
| `padding-right`            | `padding-inline-end`           | |
| `border-left`              | `border-inline-start`          | Includes `border-left-width`, `border-left-color`, `border-left-style` |
| `border-right`             | `border-inline-end`            | Includes width/color/style variants |
| `left:` (positioned)       | `inset-inline-start:`          | For `position: absolute/fixed/relative` |
| `right:` (positioned)      | `inset-inline-end:`            | For `position: absolute/fixed/relative` |
| `text-align: left`         | `text-align: start`            | |
| `text-align: right`        | `text-align: end`              | |
| `float: left`              | `float: inline-start`          | Wide support since Chromium 105 / Safari 15.4 |
| `float: right`             | `float: inline-end`            | |
| `translateX(±Npx)` (directional) | `translateX(Npx)` inside `[dir="rtl"] { transform: scaleX(-1) }` OR re-expressed as logical | Direction-dependent — see ADR-03 |

**Properties NOT flagged** (direction-agnostic by definition):
- `top`, `bottom` (block axis is not direction-flipped)
- `translateY`, `translateZ`
- `rotate()`, `rotateZ()` (rotations are not text-direction-aware)
- `border-top`, `border-bottom` (block axis)
- `margin-top`, `margin-bottom`, `padding-top`, `padding-bottom`
- `width`, `height`, `min-*`, `max-*`

**Special case — `transform: translateX()` inside `@keyframes`:** A spin animation that translates an element horizontally by a fixed amount is NOT direction-dependent (it's a positional animation, not a text-flow one). However, an effect that slides text *in from the side* (e.g. `translateX(-100%)` for a marquee) IS direction-dependent. The audit flags all `translateX(` occurrences and the human reviewer decides whether the effect is directional or positional.

---

## 3. RTL strategy

### 3.1 Library (effects themselves)
- Effects use **logical properties** so the browser flips them automatically when `[dir="rtl"]` is set on an ancestor.
- Effects **never** set `direction: rtl` themselves — that is the consumer's responsibility.
- Effects **may** use `:dir(rtl)` pseudo-class for genuinely asymmetric cases (e.g. a "back" arrow that needs to point right in RTL).

### 3.2 Showcase site (`src/app/`)
- `layout.tsx` sets `<html lang="en">` without `dir` — defaults to LTR.
- A future locale switcher (out of scope for this audit — see IMPLEMENTATION-PLAN.md Phase 3) will:
  1. Detect locale from `Accept-Language` header in `src/middleware.ts`.
  2. Set `<html lang="$locale" dir="$dir">` based on a static locale→direction map.
  3. Persist user override in a cookie `roycss-locale`.
- For this audit, the RTL render test sets `dir="rtl"` via `document.documentElement.dir = "rtl"` and verifies no layout breakage.

### 3.3 Locale → direction map

| Locale | Direction | Script |
|--------|-----------|--------|
| `en`   | LTR       | Latin  |
| `ar`   | RTL       | Arabic |
| `he`   | RTL       | Hebrew |
| `fa`   | RTL       | Persian (Arabic script) |
| `ur`   | RTL       | Urdu (Arabic script) |

---

## 4. Locale detection

```ts
// src/middleware.ts (proposed, not implemented in this audit)
const RTL_LOCALES = ["ar", "he", "fa", "ur", "ps", "sd", "yi", "ckb"];

export function middleware(request: NextRequest) {
  const locale = request.cookies.get("roycss-locale")?.value
    ?? parseAcceptLanguage(request.headers.get("accept-language"))
    ?? "en";
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
  // injected into <html> via a server component reading the cookie
}
```

**Fallback:** `en` / `ltr`. Locale detection MUST fail closed to LTR (never to RTL) so a misconfigured header cannot silently flip a primarily-English page.

---

## 5. Font strategy (locale-aware)

RoyCSS currently bundles Geist, Geist Mono, and Space Grotesk (all Latin-only subsets). For RTL locales:

| Locale | Recommended font stack |
|--------|------------------------|
| `ar`   | `"Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif` |
| `he`   | `"Noto Sans Hebrew", "Heebo", "Arial Hebrew", sans-serif` |
| `fa`   | `"Vazirmatn", "Noto Naskh Arabic", Tahoma, sans-serif` |
| `ur`   | `"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", serif` |

These would be loaded via `next/font/google` with `subsets: ["arabic"]` / `["hebrew"]` and exposed as `--font-arabic` / `--font-hebrew` CSS variables. The body font-family would then become a CSS variable that switches based on `[dir="rtl"]` or `[lang="ar"]` selectors.

**Out of scope for this audit** — see ADR-04 and IMPLEMENTATION-PLAN.md Phase 4.

---

## 6. Testing matrix

| Locale | Direction | Script  | Browser test | Logical-props audit | Color audit |
|--------|-----------|---------|--------------|---------------------|-------------|
| `en`   | LTR       | Latin   | ✅ baseline   | ✅                  | ✅           |
| `ar`   | RTL       | Arabic  | ✅ screenshot | (inherited)         | (inherited) |
| `he`   | RTL       | Hebrew  | ✅ screenshot | (inherited)         | (inherited) |
| `fa`   | RTL       | Persian | ⚠️ optional   | (inherited)         | (inherited) |
| `ur`   | RTL       | Urdu    | ⚠️ optional   | (inherited)         | (inherited) |

For this audit, the RTL render test exercises the LTR↔RTL flip generically (it does not switch fonts per locale). Per-locale font rendering is documented in IMPLEMENTATION-PLAN.md Phase 4 as future work.

---

## 7. Effect categories — RTL risk profile

| Category            | RTL risk | Why |
|---------------------|----------|-----|
| animations          | Low      | Mostly `transform` / `opacity` |
| hover               | Medium   | Some use `::before`/`::after` with `left:`/`right:` offsets |
| text                | Medium   | `text-align`, `text-shadow` directional offsets |
| backgrounds         | Low      | Gradients are mostly radial/symmetric |
| loaders             | Low      | Spinners are rotation-based |
| 3d-transforms       | Low      | 3D rotations are direction-agnostic |
| buttons             | Medium   | `padding-left/right` for icon+text |
| cards               | Medium   | `border-left` accent bars are common |
| borders             | **High** | `border-left` accent effects are the entire category |
| filters             | Low      | Filter functions are direction-agnostic |
| forms               | Medium   | Input padding, label alignment |
| navigation          | **High** | Side-nav uses `left: 0` / `right: 0` positioning |
| scroll              | Medium   | Scroll-snap, scroll-driven animations |
| cursor              | Low      | Cursor follow effects |
| page-transitions    | Medium   | `translateX()` slide transitions |
| glass-ui            | Low      | Backdrop-filter is symmetric |
| particles           | Low      | Random positions |
| microinteractions   | Medium   | Toggle switches, sliders |
| visual              | Medium   | Mixed |
| misc                | Low      | Catch-all |

The audit breaks down violations by category in the report.

---

## 8. Architecture diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   RoyCSS i18n/RTL audit pipeline                 │
└─────────────────────────────────────────────────────────────────┘

   src/lib/effects-batch-*.ts  (34 files, 1,569 effects)
            │
            ├──→ tests/i18n/logical-properties-audit.ts
            │       └──→ results/physical-properties.json
            │
            ├──→ tests/i18n/oklch-audit.ts
            │       └──→ results/color-violations.json
            │
            └──→ (surgical fixes applied to top-20 violations per category)
            
   http://localhost:3000/
            │
            └──→ tests/i18n/rtl-render-test.ts  (agent-browser)
                    ├──→ screenshots/ltr-home.png
                    ├──→ screenshots/rtl-home.png
                    └──→ screenshots/{effect}-ltr.png / {effect}-rtl.png
            
   All results aggregated → tests/i18n/I18N-REPORT.md
```

---

## 9. Success criteria

The audit is considered **passing** when:

1. ✅ Logical-properties audit runs to completion with no script errors.
2. ✅ OKLCH audit runs to completion with no script errors.
3. ✅ RTL render test produces both LTR and RTL screenshots and verifies `dir="rtl"` is applied to `<html>`.
4. ✅ Top 20 most-visible physical-property violations are fixed surgically (no effect rewrites).
5. ✅ Top 20 most-visible color-format violations are fixed surgically.
6. ✅ `bun run lint` returns 0 errors after fixes.
7. ✅ Showcase site loads with no new console errors in LTR or RTL mode.
8. ✅ `I18N-REPORT.md` is generated with executive summary, audit numbers, per-category breakdown, and remediation recommendations.

A "passing" audit does NOT require 0 violations across all 1,569 effects — that is a multi-week effort documented in IMPLEMENTATION-PLAN.md. The audit delivers **transparency** (we know exactly how non-compliant we are and where) plus a **down payment** (top 20 fixes per category).

---

## 10. Out of scope

- Per-locale font loading (`next/font/google` with `arabic`/`hebrew` subsets) — Phase 4.
- `<html dir>` injection via middleware — Phase 3.
- Translating UI strings in the showcase (nav labels, hero copy) — separate i18n-string audit.
- RTL-aware icon set (e.g. arrow icons that flip) — design-system work.
- BrowserStack / Sauce Labs cross-locale CI matrix — DevOps work.
