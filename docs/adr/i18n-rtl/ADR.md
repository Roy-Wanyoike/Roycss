# ADRs — i18n & RTL

**Status legend:** ✅ Accepted · 🟡 Proposed · 🔴 Superseded

---

## ADR-01: Use CSS logical properties, not physical properties

**Status:** ✅ Accepted
**Date:** 2026-01-15

### Context
RoyCSS ships 1,569 effects as raw CSS strings inside `CSSEffect.cssCode`. Users copy-paste these into their own projects. If an effect uses `margin-left: 8px` to offset an icon from its label, the effect breaks in Arabic/Hebrew where the icon should be on the right.

Two options:
- **A. Physical properties + `:dir(rtl)` overrides.** Each effect writes `margin-left: 8px` and then adds `.roycss-foo:dir(rtl) { margin-left: 0; margin-right: 8px; }`.
- **B. Logical properties.** Each effect writes `margin-inline-start: 8px` and the browser handles the flip.

### Decision
**Option B — logical properties.**

### Consequences
- **Pros:** Single source of truth per effect. Smaller CSS. Correct in all writing modes including future ones (e.g. vertical-rl for Japanese). Zero runtime JS.
- **Cons:** Older browsers (pre-Chromium 87, pre-Safari 15) don't support `inset-inline-start` / `margin-inline-start`. RoyCSS already requires modern browsers per its other features (container queries, `color-mix()`, OKLCH), so this is consistent.
- **Tradeoff accepted:** Effects that genuinely need different *visual* layout in RTL (e.g. a "play" triangle that should mirror) may still use `:dir(rtl)` on top of logical properties — see ADR-03.

### Enforcement
`tests/i18n/logical-properties-audit.ts` scans every `effects-batch-*.ts` for the physical properties enumerated in DESIGN.md §2 and fails the audit on any new occurrence.

---

## ADR-02: `dir` attribute strategy — single source of truth on `<html>`

**Status:** ✅ Accepted
**Date:** 2026-01-15

### Context
The showcase site (`src/app/layout.tsx`) currently sets `<html lang="en">` with no `dir` attribute (defaults to `ltr`). When the future locale switcher lands, where should `dir` be set?

Options:
- **A. `<html dir="...">`** — set once at the root.
- **B. `<body dir="...">`** — set on body, slightly more local.
- **C. Per-section `dir="..."`** — each major section sets its own.
- **D. CSS-only** — use `[dir="rtl"]` selectors without a `dir` attribute, relying on `direction: rtl` from CSS.

### Decision
**Option A — `<html dir="...">`.**

### Rationale
- `<html dir>` is the **HTML spec recommendation** (WHATWG). It cascades to every descendant and also sets the default `direction` CSS property.
- It's readable by `:dir()` pseudo-class, `[dir]` attribute selectors, and screen readers.
- Setting it at the root avoids the common bug where a section sets `dir="rtl"` but a child element with `position: fixed` escapes to the viewport and inherits the wrong direction.
- It also flips the default `text-align` and the default scroll position of horizontally-scrollable regions.
- Option D fails because `:dir()` requires the attribute to be set anyway — CSS `direction: rtl` is not equivalent to `dir="rtl"` for `:dir()` matching.

### Consequences
- The middleware (Phase 3) sets `dir` based on the resolved locale before the page is rendered.
- A client-side locale switcher updates `document.documentElement.dir` and `document.documentElement.lang` together — they MUST stay in sync.
- Some third-party Radix components read `dir` from a React context, not the DOM — the future `ThemeProvider` will need to provide `dir` via context too.

---

## ADR-03: RTL-specific effects — when to use `:dir(rtl)` instead of logical properties

**Status:** ✅ Accepted
**Date:** 2026-01-15

### Context
Some effects are visually directional in a way that logical properties alone cannot capture:

1. **A "back" arrow icon** that points left in LTR should point right in RTL. Logical properties flip the *position*, not the *shape*. `transform: scaleX(-1)` under `:dir(rtl)` is the right tool.
2. **A slide-in page transition** from `translateX(-100%)` to `translateX(0)`. Under RTL, the visual "from the left" becomes "from the right", which means `translateX(100%)` to `translateX(0)`. Logical properties don't help here — `translateX` is a transform, not a directional CSS property.
3. **A progress bar that fills from the start edge.** `width: 50%` with `margin-inline-start: 0` fills from the left in LTR and from the right in RTL — that's correct via logical properties alone. But a progress bar with a *stripe pattern* that should appear to move toward the start edge needs `:dir(rtl)` to flip the stripe animation direction.

### Decision
**Two-tier policy:**

1. **Default:** Use logical properties. The browser handles the flip.
2. **Exception:** When an effect is visually directional (shape, transform-direction, animation-direction), add a `:dir(rtl)` override block. Document the override with a comment `/* RTL: flip arrow direction */`.

### Consequences
- The logical-properties audit flags `translateX(` in `cssCode` for **human review**, not automatic failure. The reviewer decides: is this a positional animation (OK) or a directional one (needs `:dir(rtl)` override)?
- Effects that need `:dir(rtl)` overrides are tagged in their `tags[]` array with `"rtl-aware"` so consumers can find them.
- The audit's "violation" count for `translateX(` is therefore an **upper bound** on real RTL bugs, not an exact count.

---

## ADR-04: Locale-aware fonts via `next/font` subsets

**Status:** 🟡 Proposed
**Date:** 2026-01-15

### Context
RoyCSS currently bundles only Latin fonts (Geist, Geist Mono, Space Grotesk). For Arabic, Hebrew, Persian, Urdu users, the browser falls back to a system font (Tahoma on Windows, Geeza Pro on macOS). The fallback works but:
- Renders at a different x-height than the Latin fonts, causing baseline misalignment in mixed-direction text.
- Lacks the design intent of the Latin fonts (Space Grotesk's geometric character).
- Does not include Nastaliq script for Urdu (which has its own calligraphic tradition).

### Decision (proposed)
**Load Noto Sans Arabic, Noto Sans Hebrew, and Vazirmatn via `next/font/google` with appropriate `subsets`, and expose them as CSS variables that activate under `[dir="rtl"]` or `[lang="..."]` selectors.**

```ts
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
});
```

```css
html[lang="ar"], html[lang="fa"], html[lang="ur"] {
  --font-body: var(--font-arabic), var(--font-geist-sans), sans-serif;
}
html[lang="he"] {
  --font-body: var(--font-hebrew), var(--font-geist-sans), sans-serif;
}
```

### Consequences
- Bundle size grows by ~80 KB per font (woff2, subset). Three fonts = ~240 KB. Acceptable for a showcase site; would need subsetting optimization for production library use.
- `next/font` handles the `<link rel="preload">` and font-display swap automatically.
- Mixed-direction text (e.g. an English brand name inside an Arabic paragraph) will use the Latin font for the English characters automatically — this is per-glyph fallback, not per-element.

### Out of scope
This audit does not implement ADR-04. It is documented here so a future font-loading task has a decision to reference.

---

## ADR-05: OKLCH as the only color format in `cssCode`

**Status:** ✅ Accepted
**Date:** 2026-01-15

### Context
RoyCSS markets itself as "OKLCH colors" for perceptual uniformity and wide-gamut support. Three places colors appear:
1. **`cssCode` strings in effects** — what the audit checks.
2. **Tailwind theme in `tailwind.config.ts`** — uses Tailwind v4's OKLCH-based palette by default.
3. **Inline styles in React components** — out of scope for this audit (would be a separate component-level audit).

Options for `cssCode`:
- **A. Hex only** (`#10b981`). Simplest. Loses perceptual uniformity. Cannot express colors outside sRGB.
- **B. Mixed** — allow any valid CSS color. Most flexible. Loses the marketing claim.
- **C. OKLCH only, with `color-mix(in oklch, ...)` for opacity.** Strictest. Matches the marketing claim.

### Decision
**Option C — OKLCH only.** All non-OKLCH colors (`#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`) are violations.

### Consequences
- The OKLCH audit (`tests/i18n/oklch-audit.ts`) flags any `#hex`, `rgb(`, `rgba(`, `hsl(`, `hsla(` token in `cssCode`.
- For opacity, effects use `color-mix(in oklch, oklch(...) 50%, transparent)` rather than `oklch(... / 0.5)`. Both are valid; `color-mix` is more widely supported and is the existing convention in RoyCSS.
- Effects that need to reference Tailwind CSS variables (e.g. `var(--color-primary)`) are still allowed — the audit only checks for explicit color literals.

### Why this is in an i18n/RTL audit
Strictly speaking, color format is an i18n-adjacent concern (wide-gamut support matters more for non-Western design traditions that use richer palettes), but it's bundled into this audit because the marketing claim "OKLCH colors + RTL support" is a single product promise and should be verified together.
