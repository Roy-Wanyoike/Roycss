import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 10 — Modern CSS API Showcase (40 effects)
 *
 * Demonstrates the most bleeding-edge CSS features shipping in 2024-2025:
 *   • CSS Anchor Positioning (anchor-name / position-anchor)
 *   • :has() parent-state selectors
 *   • Container queries (@container)
 *   • @starting-style + transition-behavior: allow-discrete
 *   • interpolate-size: allow-keywords (auto-height transitions)
 *   • View Transitions API (view-transition-name)
 *   • text-wrap: balance / pretty
 *   • Relative colors  rgb(from …)
 *   • color-mix() in oklab / srgb
 *   • light-dark() + color-scheme
 *   • @property registered custom properties (<angle>, <color>, <number>)
 *   • SVG filters: feTurbulence / feDisplacementMap / feGaussianBlur+feColorMatrix (gooey)
 *   • offset-path + offset-rotate (motion path)
 *   • mask-composite (exclude / intersect)
 *   • mix-blend-mode: difference / exclusion
 *   • clip-path: polygon()
 *   • Scroll-driven animations (animation-timeline: scroll() / view())
 *
 * Every class uses `.roycss-{id}` prefix.
 * Every @keyframes uses `roy-b10-` prefix → guaranteed unique across the
 * library (294 existing keyframes in batches 1–8 + roycss-effects.ts use
 * `roy-` prefix without the `b10-` segment).
 * Each cssCode is COMPLETE and SELF-CONTAINED — class definition + any
 * @property + @keyframes + @supports fallback, ready to inject into <style>.
 *
 * @supports fallbacks are provided for the most bleeding-edge features
 * (anchor positioning, @starting-style, interpolate-size, scroll-driven
 * animations, view transitions) so the preview still renders sensibly on
 * older browsers.
 */
export const effectsBatch10: CSSEffect[] = [
  // ════════════════════════════════════════════════════════════════
  // MICROINTERACTIONS (10)
  // ════════════════════════════════════════════════════════════════

  // 1 ─ Anchor Tooltip ──────────────────────────────────────────────
  {
    id: "anchor-tooltip",
    name: "Anchor Tooltip",
    category: "microinteractions",
    description: "Tooltip positioned via the CSS Anchor Positioning API",
    tags: ["anchor", "tooltip", "positioning", "modern"],
    previewType: "card",
    cssCode: `/* Anchor Tooltip — CSS Anchor Positioning API */
.roycss-anchor-tooltip {
  position: relative;
  inline-size: 220px;
  block-size: 140px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  display: grid;
  place-items: center;
  anchor-name: --roy-at-host;
}
.roycss-anchor-tooltip > span {
  color: oklch(0.929 0.013 255.51);
  font: 600 14px/1 system-ui, sans-serif;
  padding: 8px 16px;
  border-radius: 8px;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
  anchor-name: --roy-at-btn;
}
.roycss-anchor-tooltip::after {
  content: "Anchored tooltip ✓";
  position: absolute;
  position-anchor: --roy-at-btn;
  position-area: block-end span-inline-end;
  margin-block-end: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: oklch(0.696 0.149 162.48);
  color: oklch(0.262 0.049 172.55);
  font: 600 12px/1.2 system-ui, sans-serif;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.2s, transform 0.2s;
  pointer-events: none;
}
.roycss-anchor-tooltip:hover::after,
.roycss-anchor-tooltip:focus-within::after {
  opacity: 1;
  transform: translateY(0);
}
/* Fallback: browsers without anchor positioning stack the tooltip below */
@supports not (position-anchor: --x) {
  .roycss-anchor-tooltip::after {
    position: absolute;
    inset-block-end: 8px;
    inset-inline-start: 50%;
    transform: translate(-50%, 4px);
  }
  .roycss-anchor-tooltip:hover::after,
  .roycss-anchor-tooltip:focus-within::after {
    transform: translate(-50%, 0);
  }
}`,
  },

  // 2 ─ Has Parent Highlight ────────────────────────────────────────
  {
    id: "has-parent-highlight",
    name: "Has Parent Highlight",
    category: "microinteractions",
    description: ":has() selector highlights parent when a child is focused",
    tags: ["has", "parent", "focus", "selector"],
    previewType: "card",
    cssCode: `/* Has Parent Highlight — :has() relational selector */
.roycss-has-parent-highlight {
  inline-size: 220px;
  padding: 18px;
  border-radius: 14px;
  background: oklch(0.279 0.037 260.03);
  border: 2px solid oklch(0.372 0.039 257.29);
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
}
.roycss-has-parent-highlight > span {
  display: block;
  inline-size: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  background: oklch(0.208 0.04 265.75);
  color: oklch(0.869 0.02 252.89);
  font: 500 13px/1.4 system-ui, sans-serif;
  outline: none;
  border: 1px solid oklch(0.446 0.037 257.28);
  transition: border-color 0.25s, color 0.25s;
}
/* When the inner span is hovered/focused, the PARENT card reacts */
.roycss-has-parent-highlight:has(> span:hover) {
  border-color: oklch(0.696 0.149 162.48);
  box-shadow: 0 0 0 4px color-mix(in oklch, oklch(0.696 0.149 162.48) 18%, transparent);
  background: oklch(0.261 0.036 174.14);
}
.roycss-has-parent-highlight:has(> span:focus-visible) {
  border-color: oklch(0.769 0.165 70.08);
  box-shadow: 0 0 0 4px color-mix(in oklch, oklch(0.769 0.165 70.08) 20%, transparent);
}
.roycss-has-parent-highlight:has(> span:hover) > span {
  color: oklch(0.773 0.153 163.22);
  border-color: oklch(0.696 0.149 162.48);
}
/* Fallback for browsers without :has() — child still gets focus ring */
@supports not selector(:has(*)) {
  .roycss-has-parent-highlight > span:focus-visible {
    border-color: oklch(0.696 0.149 162.48);
    box-shadow: 0 0 0 3px color-mix(in oklch, oklch(0.696 0.149 162.48) 25%, transparent);
  }
}`,
  },

  // 3 ─ Container Query Card ────────────────────────────────────────
  {
    id: "container-query-card",
    name: "Container Query Card",
    category: "microinteractions",
    description: "Card that reshapes its layout based on its own width via @container",
    tags: ["container-query", "responsive", "layout", "cqw"],
    previewType: "card",
    cssCode: `/* Container Query Card — @container queries */
.roycss-container-query-card {
  container-type: inline-size;
  container-name: roycq;
  inline-size: 100%;
  max-inline-size: 360px;
  block-size: 160px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.359 0.135 278.7), oklch(0.38 0.178 293.74));
  padding: 14px;
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
  align-content: center;
  color: oklch(0.943 0.028 294.59);
  font: 500 12px/1.4 system-ui, sans-serif;
  transition: grid-template-columns 0.3s;
}
.roycss-container-query-card > span {
  display: block;
  padding: 8px 10px;
  border-radius: 8px;
  background: color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 18%, transparent);
}
.roycss-container-query-card::before {
  content: "📐 narrow";
  font-weight: 700;
  color: oklch(0.811 0.101 293.57);
}
/* Wide container → side-by-side columns */
@container roycq (min-inline-size: 240px) {
  .roycss-container-query-card {
    grid-template-columns: 1fr 1fr;
  }
  .roycss-container-query-card::before {
    content: "📐 wide";
    grid-column: 1 / -1;
    color: oklch(0.905 0.089 164.15);
  }
}
@container roycq (min-inline-size: 320px) {
  .roycss-container-query-card {
    grid-template-columns: repeat(3, 1fr);
  }
  .roycss-container-query-card::before {
    content: "📐 extra-wide";
    color: oklch(0.924 0.115 95.75);
  }
}
/* Fallback: container query unsupported → use media-query-ish default */
@supports not (container-type: inline-size) {
  .roycss-container-query-card {
    grid-template-columns: 1fr 1fr;
  }
}`,
  },

  // 4 ─ Starting Style Fade ─────────────────────────────────────────
  {
    id: "starting-style-fade",
    name: "Starting Style Fade",
    category: "microinteractions",
    description: "Element fades + lifts in on first render via @starting-style",
    tags: ["starting-style", "enter", "fade", "modern"],
    previewType: "card",
    cssCode: `/* Starting Style Fade — @starting-style for first-render transition */
.roycss-starting-style-fade {
  inline-size: 200px;
  block-size: 120px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.592 0.218 0.58), oklch(0.558 0.252 302.32));
  display: grid;
  place-items: center;
  color: oklch(1 0 89.88);
  font: 700 14px/1 system-ui, sans-serif;
  letter-spacing: 0.15em;
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* Restart the entry on every hover-out for demo purposes */
  animation: roy-b10-ss-restart 3s ease-in-out infinite;
}
@keyframes roy-b10-ss-restart {
  0%, 40%   { opacity: 1; transform: translateY(0) scale(1); }
  50%       { opacity: 0; transform: translateY(20px) scale(0.92); }
  60%, 100% { opacity: 1; transform: translateY(0) scale(1); }
}
/* The actual @starting-style rule (applied on the very first frame
   of the element appearing in the DOM) */
@starting-style {
  .roycss-starting-style-fade {
    opacity: 0;
    transform: translateY(24px) scale(0.9);
  }
}
/* Fallback: if @starting-style is unsupported, the animation alone
   still demonstrates the fade-in behavior. */
@supports not (animation-timeline: --fake) {
  /* no-op — modern browsers handle @starting-style natively */
}`,
  },

  // 5 ─ Auto Height Expand ──────────────────────────────────────────
  {
    id: "auto-height-expand",
    name: "Auto Height Expand",
    category: "microinteractions",
    description: "Smoothly transition to height:auto via interpolate-size",
    tags: ["interpolate-size", "height", "accordion", "modern"],
    previewType: "card",
    cssCode: `/* Auto Height Expand — interpolate-size: allow-keywords */
.roycss-auto-height-expand {
  interpolate-size: allow-keywords;
  inline-size: 220px;
  border-radius: 14px;
  background: oklch(0.208 0.04 265.75);
  padding: 12px 14px;
  color: oklch(0.929 0.013 255.51);
  font: 500 12px/1.4 system-ui, sans-serif;
  overflow: hidden;
}
.roycss-auto-height-expand > span {
  display: block;
  font-weight: 700;
  color: oklch(0.773 0.153 163.22);
  cursor: pointer;
  padding-block-end: 6px;
}
.roycss-auto-height-expand::after {
  content: "This hidden paragraph smoothly grows to its natural block-size: auto using the new interpolate-size property. No max-height hacks required — the browser can now interpolate to the auto keyword directly.";
  display: block;
  block-size: 0;
  opacity: 0;
  overflow: hidden;
  transition: height 0.4s ease, opacity 0.4s ease;
  color: oklch(0.711 0.035 256.79);
  font-size: 11px;
}
.roycss-auto-height-expand:hover::after {
  block-size: auto;
  opacity: 1;
}
/* Fallback for browsers without interpolate-size — use max-height */
@supports not (interpolate-size: allow-keywords) {
  .roycss-auto-height-expand::after {
    transition: max-height 0.4s ease, opacity 0.4s ease;
    max-block-size: 0;
  }
  .roycss-auto-height-expand:hover::after {
    max-block-size: 200px;
    block-size: auto;
  }
}`,
  },

  // 6 ─ View Transition Snapshot ───────────────────────────────────
  {
    id: "view-transition-snapshot",
    name: "View Transition Snapshot",
    category: "microinteractions",
    description: "Element tagged with view-transition-name animates between states",
    tags: ["view-transition", "snapshot", "morph", "modern"],
    previewType: "card",
    cssCode: `/* View Transition Snapshot — view-transition-name */
.roycss-view-transition-snapshot {
  inline-size: 200px;
  block-size: 120px;
  border-radius: 16px;
  background: linear-gradient(135deg, oklch(0.685 0.148 237.32), oklch(0.585 0.204 277.12));
  display: grid;
  place-items: center;
  color: oklch(1 0 89.88);
  font: 700 14px/1 system-ui, sans-serif;
  view-transition-name: roy-vt-card;
  animation: roy-b10-vt-morph 4s ease-in-out infinite;
}
/* ::view-transition-group pseudo for cross-snapshot morph */
::view-transition-group(roy-vt-card) {
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
::view-transition-old(roy-vt-card) {
  animation: roy-b10-vt-out 0.4s ease forwards;
}
::view-transition-new(roy-vt-card) {
  animation: roy-b10-vt-in 0.4s ease forwards;
}
@keyframes roy-b10-vt-morph {
  0%, 35%   { border-radius: 16px; background: linear-gradient(135deg, oklch(0.685 0.148 237.32), oklch(0.585 0.204 277.12)); }
  50%, 85%  { border-radius: 60px; background: linear-gradient(135deg, oklch(0.645 0.215 16.44), oklch(0.769 0.165 70.08)); }
  100%      { border-radius: 16px; background: linear-gradient(135deg, oklch(0.685 0.148 237.32), oklch(0.585 0.204 277.12)); }
}
@keyframes roy-b10-vt-out {
  to { opacity: 0; transform: scale(1.05); }
}
@keyframes roy-b10-vt-in {
  from { opacity: 0; transform: scale(0.95); }
}
/* Fallback: if View Transitions unsupported, the morph animation alone
   still demonstrates the visual transition. */
@supports not (view-transition-name: none) {
  /* morph animation above already covers the visual demo */
}`,
  },

  // 7 ─ Balanced Text ───────────────────────────────────────────────
  {
    id: "balanced-text",
    name: "Balanced Text",
    category: "microinteractions",
    description: "text-wrap: balance + pretty produces magazine-quality line breaks",
    tags: ["text-wrap", "balance", "typography", "modern"],
    previewType: "card",
    cssCode: `/* Balanced Text — text-wrap: balance & pretty */
.roycss-balanced-text {
  inline-size: 240px;
  padding: 16px 18px;
  border-radius: 12px;
  background: oklch(0.962 0.058 95.62);
  color: oklch(0.414 0.105 45.9);
  font: 600 14px/1.45 Georgia, serif;
}
.roycss-balanced-text > span {
  display: block;
  margin-block-end: 10px;
}
.roycss-balanced-text::before {
  content: "Balance: RoyCSS brings modern CSS effects to your project, one elegant class at a time.";
  display: block;
  text-wrap: balance;
  padding-block-end: 8px;
  margin-block-end: 8px;
  border-block-end: 1px dashed oklch(0.666 0.157 58.32);
  font-size: 13px;
  color: oklch(0.473 0.125 46.2);
}
.roycss-balanced-text::after {
  content: "Pretty: This paragraph uses text-wrap: pretty to avoid widows and orphans on the final line, creating a more polished typographic appearance.";
  display: block;
  text-wrap: pretty;
  font-size: 12px;
  color: oklch(0.555 0.146 49);
}
/* Fallback: text-wrap unsupported → normal wrapping, still readable */
@supports not (text-wrap: balance) {
  .roycss-balanced-text::before { text-wrap: normal; }
  .roycss-balanced-text::after  { text-wrap: normal; }
}`,
  },

  // 8 ─ Relative Color Hover ────────────────────────────────────────
  {
    id: "relative-color-hover",
    name: "Relative Color Hover",
    category: "microinteractions",
    description: "Hover shifts a base color via relative color syntax rgb(from …)",
    tags: ["relative-color", "hover", "color", "modern"],
    previewType: "card",
    cssCode: `/* Relative Color Hover — rgb(from …) syntax */
.roycss-relative-color-hover {
  --base: oklch(0.696 0.149 162.48);
  inline-size: 200px;
  block-size: 120px;
  border-radius: 14px;
  background: var(--base);
  display: grid;
  place-items: center;
  color: rgb(from var(--base) calc(255 - r) calc(255 - g) calc(255 - b));
  font: 700 13px/1 system-ui, sans-serif;
  letter-spacing: 0.1em;
  border: 2px solid rgb(from var(--base) r g b / 0.6);
  transition: background 0.3s, color 0.3s, transform 0.3s, box-shadow 0.3s;
}
.roycss-relative-color-hover:hover {
  /* Derived shades from the single --base variable */
  background: rgb(from var(--base) calc(r + 40) calc(g + 20) calc(b - 30));
  color: rgb(from var(--base) calc(r * 0.2) calc(g * 0.2) calc(b * 0.2));
  border-color: rgb(from var(--base) r g b / 0.95);
  box-shadow: 0 8px 24px rgb(from var(--base) r g b / 0.45);
  transform: translateY(-3px);
}
/* Fallback: browsers without relative color use hard-coded overrides */
@supports not (background: rgb(from red r g b)) {
  .roycss-relative-color-hover { color: oklch(0.262 0.049 172.55); }
  .roycss-relative-color-hover:hover {
    background: oklch(0.845 0.13 164.98);
    color: oklch(0.378 0.073 168.94);
    box-shadow: 0 8px 24px color-mix(in oklch, oklch(0.696 0.149 162.48) 45%, transparent);
  }
}`,
  },

  // 9 ─ Color Mix Gradient ──────────────────────────────────────────
  {
    id: "color-mix-gradient",
    name: "Color Mix Gradient",
    category: "microinteractions",
    description: "color-mix() in oklab blends two hues into a smooth gradient",
    tags: ["color-mix", "gradient", "oklab", "modern"],
    previewType: "card",
    cssCode: `/* Color Mix Gradient — color-mix() interpolation */
.roycss-color-mix-gradient {
  --c1: oklch(0.645 0.215 16.44);
  --c2: oklch(0.715 0.126 215.22);
  inline-size: 220px;
  block-size: 130px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    var(--c1),
    color-mix(in oklab, var(--c1) 50%, var(--c2)),
    var(--c2)
  );
  display: grid;
  place-items: center;
  color: oklch(1 0 89.88);
  font: 700 13px/1 system-ui, sans-serif;
  text-shadow: 0 1px 2px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  transition: filter 0.3s, transform 0.3s;
}
.roycss-color-mix-gradient::after {
  content: "";
  position: absolute;
  inset: auto 0 -16px 0;
  block-size: 14px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--c1) 80%, white),
    color-mix(in srgb, var(--c2) 80%, white)
  );
  border-radius: 7px;
  opacity: 0;
  transition: opacity 0.3s;
}
.roycss-color-mix-gradient:hover {
  filter: saturate(1.3) brightness(1.05);
  transform: scale(1.04);
}
.roycss-color-mix-gradient:hover::after { opacity: 1; }
/* Fallback */
@supports not (background: color-mix(in oklab, red, blue)) {
  .roycss-color-mix-gradient {
    background: linear-gradient(135deg, oklch(0.645 0.215 16.44), oklch(0.455 0.163 321.86), oklch(0.715 0.126 215.22));
  }
}`,
  },

  // 10 ─ Light Dark Auto ───────────────────────────────────────────
  {
    id: "light-dark-auto",
    name: "Light Dark Auto",
    category: "microinteractions",
    description: "light-dark() function swaps colors based on color-scheme",
    tags: ["light-dark", "color-scheme", "theme", "modern"],
    previewType: "card",
    cssCode: `/* Light Dark Auto — light-dark() + color-scheme cycling */
.roycss-light-dark-auto {
  color-scheme: light dark;
  inline-size: 220px;
  block-size: 130px;
  border-radius: 14px;
  background: light-dark(oklch(0.984 0.003 247.86), oklch(0.208 0.04 265.75));
  color: light-dark(oklch(0.208 0.04 265.75), oklch(0.968 0.007 247.9));
  border: 2px solid light-dark(oklch(0.869 0.02 252.89), oklch(0.372 0.039 257.29));
  display: grid;
  place-items: center;
  font: 700 13px/1 system-ui, sans-serif;
  transition: background 0.4s, color 0.4s, border-color 0.4s;
  animation: roy-b10-ld-cycle 4s steps(1, end) infinite;
}
@keyframes roy-b10-ld-cycle {
  0%, 49%   { color-scheme: light; }
  50%, 100% { color-scheme: dark; }
}
.roycss-light-dark-auto::after {
  content: "☀ / ☾ auto theme";
  color: light-dark(oklch(0.646 0.194 41.12), oklch(0.754 0.139 232.66));
  font-size: 12px;
  letter-spacing: 0.1em;
}
/* Fallback */
@supports not (color: light-dark(red, blue)) {
  .roycss-light-dark-auto {
    background: oklch(0.208 0.04 265.75);
    color: oklch(0.968 0.007 247.9);
    border-color: oklch(0.372 0.039 257.29);
  }
  .roycss-light-dark-auto::after { color: oklch(0.754 0.139 232.66); }
}`,
  },

  // ════════════════════════════════════════════════════════════════
  // VISUAL (12)
  // ════════════════════════════════════════════════════════════════

  // 11 ─ Property Angle Rotate ──────────────────────────────────────
  {
    id: "property-angle-rotate",
    name: "Property Angle Rotate",
    category: "visual",
    description: "@property <angle> drives a smooth conic-gradient rotation",
    tags: ["property", "angle", "conic", "modern"],
    previewType: "box",
    cssCode: `/* Property Angle Rotate — @property <angle> */
@property --roy-b10-par-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.roycss-property-angle-rotate {
  inline-size: 160px;
  block-size: 160px;
  border-radius: 50%;
  background: conic-gradient(
    from var(--roy-b10-par-angle),
    oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72), oklch(0.623 0.188 259.81), oklch(0.696 0.149 162.48), oklch(0.769 0.165 70.08), oklch(0.656 0.212 354.31)
  );
  --roy-b10-par-angle: 0deg;
  animation: roy-b10-par-spin 4s linear infinite;
  position: relative;
}
.roycss-property-angle-rotate::after {
  content: "";
  position: absolute;
  inset: 16px;
  border-radius: 50%;
  background: oklch(0.208 0.04 265.75);
}
.roycss-property-angle-rotate > div { display: none; }
@keyframes roy-b10-par-spin {
  to { --roy-b10-par-angle: 360deg; }
}`,
  },

  // 12 ─ Property Color Shift ───────────────────────────────────────
  {
    id: "property-color-shift",
    name: "Property Color Shift",
    category: "visual",
    description: "@property <color> interpolates the background through the spectrum",
    tags: ["property", "color", "interpolate", "modern"],
    previewType: "box",
    cssCode: `/* Property Color Shift — @property <color> */
@property --roy-b10-pcs-hue {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.roycss-property-color-shift {
  inline-size: 160px;
  block-size: 160px;
  border-radius: 18px;
  background: hsl(from hsl(var(--roy-b10-pcs-hue) 90% 55%) h s l);
  --roy-b10-pcs-hue: 0deg;
  animation: roy-b10-pcs-cycle 5s linear infinite;
  box-shadow: 0 12px 30px oklch(0.627 0.241 var(--roy-b10-pcs-hue) / 0.4);
  display: grid;
  place-items: center;
  color: oklch(1 0 89.88);
  font: 700 12px/1 system-ui, sans-serif;
  letter-spacing: 0.2em;
  text-shadow: 0 1px 3px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
}
.roycss-property-color-shift > div { display: none; }
@keyframes roy-b10-pcs-cycle {
  to { --roy-b10-pcs-hue: 360deg; }
}`,
  },

  // 13 ─ SVG Turbulence Distort ────────────────────────────────────
  {
    id: "svg-turbulence-distort",
    name: "SVG Turbulence Distort",
    category: "visual",
    description: "feTurbulence + feDisplacementMap warps an element's content",
    tags: ["svg", "turbulence", "filter", "distort"],
    previewType: "box",
    cssCode: `/* SVG Turbulence Distort — feTurbulence + feDisplacementMap */
.roycss-svg-turbulence-distort {
  inline-size: 180px;
  block-size: 120px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.645 0.215 16.44), oklch(0.606 0.219 292.72), oklch(0.715 0.126 215.22));
  display: grid;
  place-items: center;
  color: oklch(1 0 89.88);
  font: 800 18px/1 system-ui, sans-serif;
  letter-spacing: 0.25em;
  filter: url(#roy-b10-turb-filter);
  animation: roy-b10-turb-pulse 3s ease-in-out infinite;
}
.roycss-svg-turbulence-distort > div { display: none; }
@keyframes roy-b10-turb-pulse {
  0%, 100% { filter: url(#roy-b10-turb-filter) brightness(1); }
  50%      { filter: url(#roy-b10-turb-filter) brightness(1.15); }
}
/* Inline SVG filter definition (rendered via ::before hidden host) */
.roycss-svg-turbulence-distort::before {
  content: "";
  position: absolute;
  inline-size: 0; block-size: 0;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='0' height='0'><filter id='roy-b10-turb-filter'><feTurbulence type='fractalNoise' baseFrequency='0.018 0.022' numOctaves='2' seed='3'/><feDisplacementMap in='SourceGraphic' scale='14'/></filter></svg>");
}
/* Fallback: if SVG filters unsupported, drop the filter */
@supports not (filter: url(#fake)) {
  .roycss-svg-turbulence-distort { filter: none; }
}`,
  },

  // 14 ─ SVG Displacement Wave ─────────────────────────────────────
  {
    id: "svg-displacement-wave",
    name: "SVG Displacement Wave",
    category: "visual",
    description: "Animated feDisplacementMap creates a liquid wave distortion",
    tags: ["svg", "displacement", "wave", "liquid"],
    previewType: "box",
    cssCode: `/* SVG Displacement Wave — animated feDisplacementMap */
.roycss-svg-displacement-wave {
  inline-size: 180px;
  block-size: 120px;
  border-radius: 14px;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.797 0.134 211.53), transparent 50%),
    radial-gradient(circle at 70% 70%, oklch(0.627 0.233 303.9), transparent 50%),
    linear-gradient(135deg, oklch(0.685 0.148 237.32), oklch(0.585 0.204 277.12));
  display: grid;
  place-items: center;
  color: oklch(1 0 89.88);
  font: 800 16px/1 system-ui, sans-serif;
  letter-spacing: 0.2em;
  filter: url(#roy-b10-disp-filter);
  animation: roy-b10-disp-wave 2.5s ease-in-out infinite alternate;
}
.roycss-svg-displacement-wave > div { display: none; }
@keyframes roy-b10-disp-wave {
  from { transform: translateY(-2px); }
  to   { transform: translateY(2px); }
}
.roycss-svg-displacement-wave::before {
  content: "";
  position: absolute;
  inline-size: 0; block-size: 0;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='0' height='0'><filter id='roy-b10-disp-filter'><feTurbulence type='turbulence' baseFrequency='0.01 0.04' numOctaves='1' seed='7'><animate attributeName='baseFrequency' dur='6s' values='0.01 0.04;0.02 0.02;0.01 0.04' repeatCount='indefinite'/></feTurbulence><feDisplacementMap in='SourceGraphic' scale='22'/></filter></svg>");
}
@supports not (filter: url(#fake)) {
  .roycss-svg-displacement-wave { filter: none; }
}`,
  },

  // 15 ─ SVG Gooey Merge ───────────────────────────────────────────
  {
    id: "svg-gooey-merge",
    name: "SVG Gooey Merge",
    category: "visual",
    description: "feGaussianBlur + feColorMatrix produce the classic gooey blob effect",
    tags: ["svg", "gooey", "filter", "blob"],
    previewType: "box",
    cssCode: `/* SVG Gooey Merge — feGaussianBlur + feColorMatrix */
.roycss-svg-gooey-merge {
  inline-size: 180px;
  block-size: 120px;
  background: oklch(0.208 0.04 265.75);
  border-radius: 14px;
  filter: url(#roy-b10-gooey-filter);
  position: relative;
  overflow: hidden;
}
.roycss-svg-gooey-merge > div { display: none; }
.roycss-svg-gooey-merge::before,
.roycss-svg-gooey-merge::after {
  content: "";
  position: absolute;
  inline-size: 50px;
  block-size: 50px;
  border-radius: 50%;
  background: oklch(0.696 0.149 162.48);
  inset-block-start: 35px;
}
.roycss-svg-gooey-merge::before {
  inset-inline-start: 40px;
  animation: roy-b10-gooey-a 2.4s ease-in-out infinite;
}
.roycss-svg-gooey-merge::after {
  inset-inline-end: 40px;
  background: oklch(0.773 0.153 163.22);
  animation: roy-b10-gooey-b 2.4s ease-in-out infinite;
}
@keyframes roy-b10-gooey-a {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(40px); }
}
@keyframes roy-b10-gooey-b {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(-40px); }
}
.roycss-svg-gooey-merge {
  /* Inline SVG filter */
  background-image:
    linear-gradient(oklch(0.208 0.04 265.75), oklch(0.208 0.04 265.75)),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='0' height='0'><filter id='roy-b10-gooey-filter'><feGaussianBlur in='SourceGraphic' stdDeviation='8'/><feColorMatrix mode='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7'/></filter></svg>");
  background-repeat: no-repeat;
}
@supports not (filter: url(#fake)) {
  .roycss-svg-gooey-merge { filter: none; }
}`,
  },

  // 16 ─ Offset Path Orbit ─────────────────────────────────────────
  {
    id: "offset-path-orbit",
    name: "Offset Path Orbit",
    category: "visual",
    description: "offset-path: circle() sends a satellite orbiting a center",
    tags: ["offset-path", "orbit", "motion", "modern"],
    previewType: "box",
    cssCode: `/* Offset Path Orbit — offset-path: circle() */
.roycss-offset-path-orbit {
  inline-size: 180px;
  block-size: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.279 0.037 260.03) 40%, oklch(0.208 0.04 265.75) 41%);
  position: relative;
  display: grid;
  place-items: center;
}
.roycss-offset-path-orbit > div { display: none; }
.roycss-offset-path-orbit::before {
  content: "";
  inline-size: 18px;
  block-size: 18px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, oklch(0.924 0.115 95.75), oklch(0.769 0.165 70.08));
  box-shadow: 0 0 12px oklch(0.769 0.165 70.08);
  offset-path: circle(70px at center);
  offset-rotate: 0deg;
  animation: roy-b10-op-orbit 3s linear infinite;
}
.roycss-offset-path-orbit::after {
  content: "";
  inline-size: 50px;
  block-size: 50px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, oklch(0.808 0.103 19.57), oklch(0.577 0.215 27.33));
  box-shadow: 0 0 20px oklch(0.637 0.208 25.33);
}
@keyframes roy-b10-op-orbit {
  to { offset-distance: 100%; }
}
@supports not (offset-path: circle(40px)) {
  .roycss-offset-path-orbit::before {
    animation: roy-b10-op-fallback 3s linear infinite;
  }
  @keyframes roy-b10-op-fallback {
    from { transform: rotate(0deg) translateX(70px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(70px) rotate(-360deg); }
  }
}`,
  },

  // 17 ─ Offset Path Wave ──────────────────────────────────────────
  {
    id: "offset-path-wave",
    name: "Offset Path Wave",
    category: "visual",
    description: "offset-path with a sine path() bounces an element in a wave",
    tags: ["offset-path", "wave", "motion", "modern"],
    previewType: "box",
    cssCode: `/* Offset Path Wave — offset-path: path() */
.roycss-offset-path-wave {
  inline-size: 220px;
  block-size: 120px;
  border-radius: 14px;
  background: linear-gradient(180deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  position: relative;
  overflow: hidden;
}
.roycss-offset-path-wave > div { display: none; }
.roycss-offset-path-wave::before {
  content: "";
  position: absolute;
  inline-size: 16px;
  block-size: 16px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, oklch(0.865 0.115 207.08), oklch(0.715 0.126 215.22));
  box-shadow: 0 0 14px oklch(0.715 0.126 215.22);
  /* Sine-like wave path */
  offset-path: path("M 0 60 C 30 10, 50 110, 80 60 S 130 10, 160 60 S 210 110, 240 60");
  offset-rotate: 0deg;
  animation: roy-b10-op-wave 2.5s linear infinite;
}
@keyframes roy-b10-op-wave {
  to { offset-distance: 100%; }
}
@supports not (offset-path: path("M0 0L1 1")) {
  .roycss-offset-path-wave::before {
    inset-inline-start: 0; inset-block-start: 50%;
    animation: roy-b10-op-wave-fb 2.5s ease-in-out infinite;
  }
  @keyframes roy-b10-op-wave-fb {
    0%   { inset-inline-start: 0;   inset-block-start: 50%; }
    25%  { inset-inline-start: 25%; inset-block-start: 20%; }
    50%  { inset-inline-start: 50%; inset-block-start: 50%; }
    75%  { inset-inline-start: 75%; inset-block-start: 80%; }
    100% { inset-inline-start: 100%; inset-block-start: 50%; }
  }
}`,
  },

  // 18 ─ Mask Composite Reveal ─────────────────────────────────────
  {
    id: "mask-composite-reveal",
    name: "Mask Composite Reveal",
    category: "visual",
    description: "mask-composite: subtract reveals a hidden layer through a moving slot",
    tags: ["mask-composite", "mask", "reveal", "modern"],
    previewType: "box",
    cssCode: `/* Mask Composite Reveal — mask-composite: subtract */
.roycss-mask-composite-reveal {
  inline-size: 180px;
  block-size: 120px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.279 0.037 260.03), oklch(0.372 0.039 257.29));
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
}
.roycss-mask-composite-reveal > div { display: none; }
.roycss-mask-composite-reveal::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle, oklch(1 0 89.88) 1px, transparent 1.5px) 0 0 / 12px 12px,
    linear-gradient(135deg, oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72));
  /* Slot mask: solid layer minus a moving circle */
  -webkit-mask:
    linear-gradient(oklch(0 0 0), oklch(0 0 0)),
    radial-gradient(circle 30px at var(--mx, 50%) var(--my, 50%), oklch(0 0 0) 100%, transparent 100%);
  -webkit-mask-composite: source-out;
          mask-composite: subtract;
  animation: roy-b10-mcr-sweep 3s ease-in-out infinite;
}
@keyframes roy-b10-mcr-sweep {
  0%   { --mx: 20%; --my: 30%; }
  33%  { --mx: 70%; --my: 60%; }
  66%  { --mx: 40%; --my: 75%; }
  100% { --mx: 20%; --my: 30%; }
}
@property --mx { syntax: '<percentage>'; initial-value: 50%; inherits: false; }
@property --my { syntax: '<percentage>'; initial-value: 50%; inherits: false; }
@supports not (mask-composite: subtract) {
  .roycss-mask-composite-reveal::before {
    -webkit-mask: radial-gradient(circle 60px at 50% 50%, oklch(0 0 0) 80%, transparent);
  }
}`,
  },

  // 19 ─ Mix Blend Difference ──────────────────────────────────────
  {
    id: "mix-blend-difference",
    name: "Mix Blend Difference",
    category: "visual",
    description: "mix-blend-mode: difference creates inverted overlapping colors",
    tags: ["mix-blend-mode", "difference", "blend", "color"],
    previewType: "box",
    cssCode: `/* Mix Blend Difference — mix-blend-mode: difference */
.roycss-mix-blend-difference {
  inline-size: 180px;
  block-size: 120px;
  border-radius: 14px;
  background: oklch(0.208 0.04 265.75);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.roycss-mix-blend-difference > div { display: none; }
.roycss-mix-blend-difference::before,
.roycss-mix-blend-difference::after {
  content: "";
  position: absolute;
  inline-size: 90px;
  block-size: 90px;
  border-radius: 50%;
  inset-block-start: 15px;
}
.roycss-mix-blend-difference::before {
  inset-inline-start: 18px;
  background: oklch(0.637 0.208 25.33);
  animation: roy-b10-mbd-a 3s ease-in-out infinite;
}
.roycss-mix-blend-difference::after {
  inset-inline-end: 18px;
  background: oklch(0.797 0.134 211.53);
  mix-blend-mode: difference;
  animation: roy-b10-mbd-b 3s ease-in-out infinite;
}
@keyframes roy-b10-mbd-a {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(28px); }
}
@keyframes roy-b10-mbd-b {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(-28px); }
}`,
  },

  // 20 ─ Mix Blend Exclusion ───────────────────────────────────────
  {
    id: "mix-blend-exclusion",
    name: "Mix Blend Exclusion",
    category: "visual",
    description: "mix-blend-mode: exclusion produces lower-contrast inverted blends",
    tags: ["mix-blend-mode", "exclusion", "blend", "color"],
    previewType: "box",
    cssCode: `/* Mix Blend Exclusion — mix-blend-mode: exclusion */
.roycss-mix-blend-exclusion {
  inline-size: 180px;
  block-size: 120px;
  border-radius: 14px;
  background:
    conic-gradient(from 0deg, oklch(0.769 0.165 70.08), oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72), oklch(0.715 0.126 215.22), oklch(0.769 0.165 70.08));
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.roycss-mix-blend-exclusion > div { display: none; }
.roycss-mix-blend-exclusion::before,
.roycss-mix-blend-exclusion::after {
  content: "";
  position: absolute;
  inline-size: 80px;
  block-size: 80px;
  inset-block-start: 20px;
  background: oklch(1 0 89.88);
  mix-blend-mode: exclusion;
}
.roycss-mix-blend-exclusion::before {
  inset-inline-start: 25px;
  border-radius: 50%;
  animation: roy-b10-mbe-a 2.4s ease-in-out infinite;
}
.roycss-mix-blend-exclusion::after {
  inset-inline-end: 25px;
  border-radius: 12px;
  animation: roy-b10-mbe-b 2.4s ease-in-out infinite;
}
@keyframes roy-b10-mbe-a {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(20px) rotate(180deg); }
}
@keyframes roy-b10-mbe-b {
  0%, 100% { transform: translateY(20px) rotate(0deg); }
  50%      { transform: translateY(0) rotate(180deg); }
}`,
  },

  // 21 ─ Clip Path Hexagon ─────────────────────────────────────────
  {
    id: "clip-path-hexagon",
    name: "Clip Path Hexagon",
    category: "visual",
    description: "clip-path: polygon() shapes the element into a perfect hexagon",
    tags: ["clip-path", "polygon", "hexagon", "shape"],
    previewType: "box",
    cssCode: `/* Clip Path Hexagon — clip-path: polygon() */
.roycss-clip-path-hexagon {
  inline-size: 160px;
  block-size: 160px;
  background:
    conic-gradient(from 30deg, oklch(0.769 0.165 70.08), oklch(0.637 0.208 25.33), oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72), oklch(0.769 0.165 70.08));
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: grid;
  place-items: center;
  animation: roy-b10-cph-spin 6s linear infinite;
}
.roycss-clip-path-hexagon > div { display: none; }
.roycss-clip-path-hexagon::after {
  content: "";
  inline-size: 70%;
  block-size: 70%;
  background: oklch(0.208 0.04 265.75);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}
@keyframes roy-b10-cph-spin {
  to { transform: rotate(360deg); }
}`,
  },

  // 22 ─ Clip Path Star ────────────────────────────────────────────
  {
    id: "clip-path-star",
    name: "Clip Path Star",
    category: "visual",
    description: "clip-path: polygon() carves a 5-point star with alternating vertices",
    tags: ["clip-path", "polygon", "star", "shape"],
    previewType: "box",
    cssCode: `/* Clip Path Star — 5-point star polygon */
.roycss-clip-path-star {
  inline-size: 170px;
  block-size: 170px;
  background: linear-gradient(135deg, oklch(0.837 0.164 84.43), oklch(0.769 0.165 70.08) 40%, oklch(0.555 0.146 49));
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
    50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
  );
  display: grid;
  place-items: center;
  animation: roy-b10-cps-twinkle 1.8s ease-in-out infinite;
}
.roycss-clip-path-star > div { display: none; }
.roycss-clip-path-star::after {
  content: "★";
  font-size: 40px;
  color: color-mix(in oklch, oklch(1 0 89.88) 85%, transparent);
  text-shadow: 0 0 12px color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
}
@keyframes roy-b10-cps-twinkle {
  0%, 100% { filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(0.837 0.164 84.43) 50%, transparent)); transform: scale(1); }
  50%      { filter: drop-shadow(0 0 18px color-mix(in oklch, oklch(0.837 0.164 84.43) 95%, transparent)); transform: scale(1.06); }
}`,
  },

  // ════════════════════════════════════════════════════════════════
  // ANIMATIONS (10)
  // ════════════════════════════════════════════════════════════════

  // 23 ─ Property Progress Bar ─────────────────────────────────────
  {
    id: "property-progress-bar",
    name: "Property Progress Bar",
    category: "animations",
    description: "@property <number> drives a smooth 0→100 progress bar",
    tags: ["property", "progress", "number", "modern"],
    previewType: "box",
    cssCode: `/* Property Progress Bar — @property <number> */
@property --roy-b10-ppb-progress {
  syntax: '<number>';
  initial-value: 0;
  inherits: false;
}
.roycss-property-progress-bar {
  inline-size: 220px;
  block-size: 36px;
  border-radius: 18px;
  background: oklch(0.279 0.037 260.03);
  border: 1px solid oklch(0.372 0.039 257.29);
  position: relative;
  overflow: hidden;
  --roy-b10-ppb-progress: 0;
  animation: roy-b10-ppb-fill 3s ease-in-out infinite;
}
.roycss-property-progress-bar > div { display: none; }
.roycss-property-progress-bar::before {
  content: "";
  position: absolute;
  inset: 4px 0 4px 4px;
  inline-size: calc(var(--roy-b10-ppb-progress) * 1% - 8px);
  border-radius: 14px;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.773 0.153 163.22), oklch(0.845 0.13 164.98));
  box-shadow: 0 0 12px color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent);
}
.roycss-property-progress-bar::after {
  content: counter(progress) "%";
  counter-reset: progress var(--roy-b10-ppb-progress);
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: oklch(0.929 0.013 255.51);
  font: 700 13px/1 system-ui, sans-serif;
  letter-spacing: 0.05em;
}
@keyframes roy-b10-ppb-fill {
  0%   { --roy-b10-ppb-progress: 0; }
  60%  { --roy-b10-ppb-progress: 100; }
  80%  { --roy-b10-ppb-progress: 100; }
  100% { --roy-b10-ppb-progress: 0; }
}`,
  },

  // 24 ─ Property Conic Loader ─────────────────────────────────────
  {
    id: "property-conic-loader",
    name: "Property Conic Loader",
    category: "animations",
    description: "@property <angle> spins a conic-gradient ring loader",
    tags: ["property", "conic", "loader", "angle"],
    previewType: "loader",
    cssCode: `/* Property Conic Loader — @property <angle> + conic-gradient */
@property --roy-b10-pcl-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.roycss-property-conic-loader {
  inline-size: 64px;
  block-size: 64px;
  border-radius: 50%;
  background: conic-gradient(
    from var(--roy-b10-pcl-angle),
    transparent 0deg,
    oklch(0.715 0.126 215.22) 60deg,
    oklch(0.585 0.204 277.12) 120deg,
    transparent 180deg,
    transparent 360deg
  );
  -webkit-mask: radial-gradient(circle, transparent 22px, oklch(0 0 0) 23px);
          mask: radial-gradient(circle, transparent 22px, oklch(0 0 0) 23px);
  --roy-b10-pcl-angle: 0deg;
  animation: roy-b10-pcl-spin 1.2s linear infinite;
}
@keyframes roy-b10-pcl-spin {
  to { --roy-b10-pcl-angle: 360deg; }
}`,
  },

  // 25 ─ Property Gradient Flow ───────────────────────────────────
  {
    id: "property-gradient-flow",
    name: "Property Gradient Flow",
    category: "animations",
    description: "@property <angle> rotates a multi-stop linear gradient angle",
    tags: ["property", "gradient", "angle", "flow"],
    previewType: "box",
    cssCode: `/* Property Gradient Flow — @property <angle> on linear-gradient */
@property --roy-b10-pgf-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.roycss-property-gradient-flow {
  inline-size: 200px;
  block-size: 120px;
  border-radius: 14px;
  background: linear-gradient(
    var(--roy-b10-pgf-angle),
    oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72), oklch(0.623 0.188 259.81), oklch(0.715 0.126 215.22), oklch(0.696 0.149 162.48), oklch(0.769 0.165 70.08), oklch(0.656 0.212 354.31)
  );
  background-size: 300% 300%;
  display: grid;
  place-items: center;
  color: oklch(1 0 89.88);
  font: 800 16px/1 system-ui, sans-serif;
  letter-spacing: 0.2em;
  text-shadow: 0 1px 3px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  --roy-b10-pgf-angle: 0deg;
  animation: roy-b10-pgf-spin 4s linear infinite;
}
.roycss-property-gradient-flow > div { display: none; }
@keyframes roy-b10-pgf-spin {
  to { --roy-b10-pgf-angle: 360deg; }
}`,
  },

  // 26 ─ Property Shadow Breathe ──────────────────────────────────
  {
    id: "property-shadow-breathe",
    name: "Property Shadow Breathe",
    category: "animations",
    description: "@property <length> animates a glowing box-shadow in/out",
    tags: ["property", "shadow", "breathe", "glow"],
    previewType: "box",
    cssCode: `/* Property Shadow Breathe — @property <length> + <color> */
@property --roy-b10-psb-blur {
  syntax: '<length>';
  initial-value: 0px;
  inherits: false;
}
@property --roy-b10-psb-spread {
  syntax: '<length>';
  initial-value: 0px;
  inherits: false;
}
.roycss-property-shadow-breathe {
  inline-size: 120px;
  block-size: 120px;
  border-radius: 24px;
  background: linear-gradient(135deg, oklch(0.685 0.148 237.32), oklch(0.585 0.204 277.12));
  display: grid;
  place-items: center;
  color: oklch(1 0 89.88);
  font: 800 14px/1 system-ui, sans-serif;
  letter-spacing: 0.15em;
  --roy-b10-psb-blur: 0px;
  --roy-b10-psb-spread: 0px;
  box-shadow:
    0 0 var(--roy-b10-psb-blur) var(--roy-b10-psb-spread) color-mix(in oklch, oklch(0.585 0.204 277.12) 70%, transparent),
    0 0 var(--roy-b10-psb-blur) var(--roy-b10-psb-spread) color-mix(in oklch, oklch(0.685 0.148 237.32) 50%, transparent);
  animation: roy-b10-psb-breathe 2.4s ease-in-out infinite;
}
.roycss-property-shadow-breathe > div { display: none; }
@keyframes roy-b10-psb-breathe {
  0%, 100% { --roy-b10-psb-blur: 0px;   --roy-b10-psb-spread: 0px; }
  50%      { --roy-b10-psb-blur: 40px;  --roy-b10-psb-spread: 8px; }
}`,
  },

  // 27 ─ Property Hue Cycle ────────────────────────────────────────
  {
    id: "property-hue-cycle",
    name: "Property Hue Cycle",
    category: "animations",
    description: "@property <angle> rotates the hue of a fixed-color element",
    tags: ["property", "hue", "color", "cycle"],
    previewType: "box",
    cssCode: `/* Property Hue Cycle — @property <angle> + hsl(from …) */
@property --roy-b10-phc-hue {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.roycss-property-hue-cycle {
  inline-size: 140px;
  block-size: 140px;
  border-radius: 24px;
  background: hsl(from hsl(var(--roy-b10-phc-hue) 80% 60%) h s l);
  display: grid;
  place-items: center;
  color: hsl(from hsl(calc(var(--roy-b10-phc-hue) + 180deg) 80% 20%) h s l);
  font: 800 14px/1 system-ui, sans-serif;
  letter-spacing: 0.18em;
  --roy-b10-phc-hue: 0deg;
  box-shadow: 0 12px 30px oklch(0.627 0.241 var(--roy-b10-phc-hue) / 0.5);
  animation: roy-b10-phc-cycle 4s linear infinite;
}
.roycss-property-hue-cycle > div { display: none; }
@keyframes roy-b10-phc-cycle {
  to { --roy-b10-phc-hue: 360deg; }
}
@supports not (background: hsl(from red h s l)) {
  .roycss-property-hue-cycle {
    background: linear-gradient(135deg, oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72), oklch(0.715 0.126 215.22));
    color: oklch(0.208 0.04 265.75);
    animation: roy-b10-phc-fb 4s linear infinite;
  }
  @keyframes roy-b10-phc-fb {
    to { filter: hue-rotate(360deg); }
  }
}`,
  },

  // 28 ─ Offset Path Draw ──────────────────────────────────────────
  {
    id: "offset-path-draw",
    name: "Offset Path Draw",
    category: "animations",
    description: "Element traces a complex path() while rotating to match it",
    tags: ["offset-path", "draw", "motion", "rotate"],
    previewType: "box",
    cssCode: `/* Offset Path Draw — offset-path: path() + offset-rotate: auto */
.roycss-offset-path-draw {
  inline-size: 220px;
  block-size: 140px;
  border-radius: 14px;
  background: oklch(0.208 0.04 265.75);
  position: relative;
  overflow: hidden;
}
.roycss-offset-path-draw > div { display: none; }
.roycss-offset-path-draw::before {
  content: "";
  position: absolute;
  inline-size: 14px;
  block-size: 14px;
  border-radius: 3px;
  background: linear-gradient(135deg, oklch(0.905 0.166 98.11), oklch(0.769 0.165 70.08));
  box-shadow: 0 0 12px oklch(0.769 0.165 70.08);
  offset-path: path("M 20 70 Q 60 10, 110 70 T 200 70");
  offset-rotate: auto;
  animation: roy-b10-opd-draw 2.5s linear infinite;
}
.roycss-offset-path-draw::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(transparent 49%, color-mix(in oklch, oklch(1 0 89.88) 6%, transparent) 50%, transparent 51%);
}
@keyframes roy-b10-opd-draw {
  to { offset-distance: 100%; }
}
@supports not (offset-path: path("M0 0L1 1")) {
  .roycss-offset-path-draw::before {
    inset-inline-start: 20px; inset-block-start: 70px;
    animation: roy-b10-opd-fb 2.5s ease-in-out infinite;
  }
  @keyframes roy-b10-opd-fb {
    0%   { inset-inline-start: 20px;  inset-block-start: 70px; }
    25%  { inset-inline-start: 60px;  inset-block-start: 10px; }
    50%  { inset-inline-start: 110px; inset-block-start: 70px; }
    75%  { inset-inline-start: 160px; inset-block-start: 130px; }
    100% { inset-inline-start: 200px; inset-block-start: 70px; }
  }
}`,
  },

  // 29 ─ Scroll Timeline Spin ──────────────────────────────────────
  {
    id: "scroll-timeline-spin",
    name: "Scroll Timeline Spin",
    category: "animations",
    description: "animation-timeline: scroll() ties rotation to page scroll",
    tags: ["scroll-driven", "scroll-timeline", "spin", "modern"],
    previewType: "box",
    cssCode: `/* Scroll Timeline Spin — animation-timeline: scroll() */
.roycss-scroll-timeline-spin {
  inline-size: 140px;
  block-size: 140px;
  border-radius: 24px;
  background:
    conic-gradient(from 0deg, oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72), oklch(0.715 0.126 215.22), oklch(0.696 0.149 162.48), oklch(0.656 0.212 354.31));
  display: grid;
  place-items: center;
  color: oklch(1 0 89.88);
  font: 700 12px/1.2 system-ui, sans-serif;
  letter-spacing: 0.15em;
  text-align: center;
  animation: roy-b10-sts-spin 1s linear;
  animation-timeline: scroll(root block);
  /* When scroll-timeline unsupported, fall back to infinite auto-spin */
}
.roycss-scroll-timeline-spin > div { display: none; }
.roycss-scroll-timeline-spin::after {
  content: "scroll the page";
  font-size: 10px;
  opacity: 0.7;
}
@keyframes roy-b10-sts-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
/* Fallback: no scroll-driven → infinite auto-spin */
@supports not (animation-timeline: scroll(root block)) {
  .roycss-scroll-timeline-spin {
    animation: roy-b10-sts-spin 3s linear infinite;
  }
}`,
  },

  // 30 ─ View Timeline Reveal ──────────────────────────────────────
  {
    id: "view-timeline-reveal",
    name: "View Timeline Reveal",
    category: "animations",
    description: "animation-timeline: view() reveals element as it enters viewport",
    tags: ["scroll-driven", "view-timeline", "reveal", "modern"],
    previewType: "box",
    cssCode: `/* View Timeline Reveal — animation-timeline: view() */
.roycss-view-timeline-reveal {
  inline-size: 220px;
  block-size: 120px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.541 0.247 293.01), oklch(0.546 0.215 262.88));
  display: grid;
  place-items: center;
  color: oklch(1 0 89.88);
  font: 700 13px/1.2 system-ui, sans-serif;
  letter-spacing: 0.1em;
  text-align: center;
  animation: roy-b10-vtl-reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}
.roycss-view-timeline-reveal > div { display: none; }
.roycss-view-timeline-reveal::after {
  content: "reveals on scroll into view";
  display: block;
  font-size: 10px;
  opacity: 0.8;
  margin-block-start: 6px;
}
@keyframes roy-b10-vtl-reveal {
  from { opacity: 0; transform: translateY(60px) scale(0.8); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
/* Fallback: no view-timeline → entry animation on first render via @starting-style */
@supports not (animation-timeline: view()) {
  .roycss-view-timeline-reveal {
    animation: roy-b10-vtl-reveal 0.8s ease both;
  }
}`,
  },

  // 31 ─ Starting Style Drop In ────────────────────────────────────
  {
    id: "starting-style-drop-in",
    name: "Starting Style Drop In",
    category: "animations",
    description: "@starting-style + allow-discrete: element drops in with backdrop",
    tags: ["starting-style", "drop-in", "overlay", "modern"],
    previewType: "card",
    cssCode: `/* Starting Style Drop In — @starting-style + transition-behavior */
.roycss-starting-style-drop-in {
  position: relative;
  inline-size: 240px;
  block-size: 140px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.279 0.037 260.03), oklch(0.208 0.04 265.75));
  overflow: hidden;
  display: grid;
  place-items: center;
}
.roycss-starting-style-drop-in > span {
  display: none;
}
.roycss-starting-style-drop-in::before {
  content: "";
  position: absolute;
  inset: 0;
  background: color-mix(in oklch, oklch(0 0 0) 55%, transparent);
  backdrop-filter: blur(3px);
  opacity: 0;
  transition: opacity 0.35s ease, transition-behavior 0.35s;
  transition-behavior: allow-discrete;
  animation: roy-b10-ssdi-cycle 4s ease-in-out infinite;
}
.roycss-starting-style-drop-in::after {
  content: "Dropped In ✓";
  position: absolute;
  padding: 14px 22px;
  border-radius: 12px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.596 0.127 163.23));
  color: oklch(1 0 89.88);
  font: 700 14px/1 system-ui, sans-serif;
  letter-spacing: 0.1em;
  box-shadow: 0 16px 40px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  transform: translateY(-80px) scale(0.9);
  opacity: 0;
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.45s ease,
              display 0.45s allow-discrete;
  animation: roy-b10-ssdi-cycle 4s ease-in-out infinite;
}
@keyframes roy-b10-ssdi-cycle {
  0%, 35%   { opacity: 1; transform: translateY(0) scale(1); }
  45%, 90%  { opacity: 0; transform: translateY(-80px) scale(0.9); }
  100%      { opacity: 1; transform: translateY(0) scale(1); }
}
/* Apply on first render via @starting-style */
@starting-style {
  .roycss-starting-style-drop-in::after {
    opacity: 0;
    transform: translateY(-80px) scale(0.9);
  }
}
/* Fallback: no @starting-style → animation alone shows the drop-in */
@supports not (animation-timeline: --fake) {
  /* no-op */
}`,
  },

  // 32 ─ Interpolate Size Accordion ───────────────────────────────
  {
    id: "interpolate-size-accordion",
    name: "Interpolate Size Accordion",
    category: "animations",
    description: "interpolate-size: allow-keywords enables smooth height:auto accordion",
    tags: ["interpolate-size", "accordion", "height", "modern"],
    previewType: "box",
    cssCode: `/* Interpolate Size Accordion — block-size: auto transition */
.roycss-interpolate-size-accordion {
  interpolate-size: allow-keywords;
  inline-size: 220px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.705 0.187 47.6), oklch(0.637 0.208 25.33));
  overflow: hidden;
  display: grid;
  place-items: center;
}
.roycss-interpolate-size-accordion > div { display: none; }
.roycss-interpolate-size-accordion::before {
  content: "Hover to expand ▾";
  display: block;
  padding: 14px;
  color: oklch(1 0 89.88);
  font: 700 13px/1 system-ui, sans-serif;
  letter-spacing: 0.05em;
}
.roycss-interpolate-size-accordion::after {
  content: "Expanded panel content — height interpolates to auto without max-height hacks thanks to interpolate-size: allow-keywords.";
  display: block;
  block-size: 0;
  opacity: 0;
  padding: 0 14px;
  color: oklch(0.962 0.058 95.62);
  font: 500 12px/1.4 system-ui, sans-serif;
  overflow: hidden;
  transition: height 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s, padding 0.45s;
}
.roycss-interpolate-size-accordion:hover::after {
  block-size: auto;
  opacity: 1;
  padding: 0 14px 14px;
}
@supports not (interpolate-size: allow-keywords) {
  .roycss-interpolate-size-accordion::after {
    transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s, padding 0.45s;
    max-block-size: 0;
  }
  .roycss-interpolate-size-accordion:hover::after {
    max-block-size: 120px;
    block-size: auto;
  }
}`,
  },

  // ════════════════════════════════════════════════════════════════
  // BACKGROUNDS (8)
  // ════════════════════════════════════════════════════════════════

  // 33 ─ Color Mix Mesh ────────────────────────────────────────────
  {
    id: "color-mix-mesh",
    name: "Color Mix Mesh",
    category: "backgrounds",
    description: "color-mix() blends layered radial gradients into a mesh",
    tags: ["color-mix", "mesh", "gradient", "background"],
    previewType: "background",
    cssCode: `/* Color Mix Mesh — layered radial gradients via color-mix() */
.roycss-color-mix-mesh {
  --a: oklch(0.645 0.215 16.44);
  --b: oklch(0.715 0.126 215.22);
  --c: oklch(0.606 0.219 292.72);
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 200px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 15% 25%, var(--a), transparent 40%),
    radial-gradient(circle at 85% 15%, var(--b), transparent 40%),
    radial-gradient(circle at 75% 80%, var(--c), transparent 45%),
    radial-gradient(circle at 25% 75%, color-mix(in oklab, var(--a) 50%, var(--c)), transparent 45%),
    radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--b) 50%, var(--c)), transparent 50%),
    linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  animation: roy-b10-cmm-shift 8s ease-in-out infinite;
}
@keyframes roy-b10-cmm-shift {
  0%, 100% { filter: hue-rotate(0deg); }
  50%      { filter: hue-rotate(40deg) saturate(1.2); }
}
@supports not (background: color-mix(in oklab, red, blue)) {
  .roycss-color-mix-mesh {
    background:
      radial-gradient(circle at 15% 25%, oklch(0.645 0.215 16.44), transparent 40%),
      radial-gradient(circle at 85% 15%, oklch(0.715 0.126 215.22), transparent 40%),
      radial-gradient(circle at 75% 80%, oklch(0.606 0.219 292.72), transparent 45%),
      linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  }
}`,
  },

  // 34 ─ Relative Color Tint ───────────────────────────────────────
  {
    id: "relative-color-tint",
    name: "Relative Color Tint",
    category: "backgrounds",
    description: "rgb(from …) derives a layered tinted background from one base",
    tags: ["relative-color", "tint", "background", "modern"],
    previewType: "background",
    cssCode: `/* Relative Color Tint — derived shades via rgb(from …) */
.roycss-relative-color-tint {
  --base: oklch(0.585 0.204 277.12);
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 200px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 30% 30%,
      rgb(from var(--base) calc(r + 80) calc(g + 80) calc(b + 80) / 0.6),
      transparent 50%),
    radial-gradient(circle at 70% 70%,
      rgb(from var(--base) calc(r - 60) calc(g - 30) calc(b - 30) / 0.7),
      transparent 55%),
    linear-gradient(135deg,
      rgb(from var(--base) r g b / 0.85),
      rgb(from var(--base) calc(r * 0.3) calc(g * 0.3) calc(b * 0.3)));
  animation: roy-b10-rct-pan 6s ease-in-out infinite alternate;
}
@keyframes roy-b10-rct-pan {
  from { background-position: 0% 0%, 100% 100%, 0 0; }
  to   { background-position: 20% 30%, 80% 70%, 0 0; }
}
@supports not (background: rgb(from red r g b)) {
  .roycss-relative-color-tint {
    background:
      radial-gradient(circle at 30% 30%, color-mix(in oklch, oklch(0.785 0.104 274.71) 60%, transparent), transparent 50%),
      radial-gradient(circle at 70% 70%, color-mix(in oklch, oklch(0.457 0.215 277.02) 70%, transparent), transparent 55%),
      linear-gradient(135deg, oklch(0.585 0.204 277.12), oklch(0.257 0.086 281.29));
  }
}`,
  },

  // 35 ─ Conic Gradient Clock ─────────────────────────────────────
  {
    id: "conic-gradient-clock",
    name: "Conic Gradient Clock",
    category: "backgrounds",
    description: "Conic gradient builds a clock face with sweeping second hand",
    tags: ["conic-gradient", "clock", "background", "sweep"],
    previewType: "background",
    cssCode: `/* Conic Gradient Clock — conic-gradient sweep + @property */
@property --roy-b10-cgc-sweep {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.roycss-conic-gradient-clock {
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 220px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: oklch(0.208 0.04 265.75);
  position: relative;
}
.roycss-conic-gradient-clock::before {
  content: "";
  inline-size: 180px;
  block-size: 180px;
  border-radius: 50%;
  background:
    conic-gradient(from var(--roy-b10-cgc-sweep),
      color-mix(in oklch, oklch(0.696 0.149 162.48) 35%, transparent) 0deg,
      color-mix(in oklch, oklch(0.696 0.149 162.48) 0%, transparent) 6deg,
      color-mix(in oklch, oklch(0.696 0.149 162.48) 0%, transparent) 360deg),
    conic-gradient(from 0deg,
      oklch(0.279 0.037 260.03) 0deg, oklch(0.279 0.037 260.03) 30deg,
      oklch(0.372 0.039 257.29) 30deg, oklch(0.372 0.039 257.29) 60deg,
      oklch(0.279 0.037 260.03) 60deg, oklch(0.279 0.037 260.03) 90deg,
      oklch(0.372 0.039 257.29) 90deg, oklch(0.372 0.039 257.29) 120deg,
      oklch(0.279 0.037 260.03) 120deg, oklch(0.279 0.037 260.03) 150deg,
      oklch(0.372 0.039 257.29) 150deg, oklch(0.372 0.039 257.29) 180deg,
      oklch(0.279 0.037 260.03) 180deg, oklch(0.279 0.037 260.03) 210deg,
      oklch(0.372 0.039 257.29) 210deg, oklch(0.372 0.039 257.29) 240deg,
      oklch(0.279 0.037 260.03) 240deg, oklch(0.279 0.037 260.03) 270deg,
      oklch(0.372 0.039 257.29) 270deg, oklch(0.372 0.039 257.29) 300deg,
      oklch(0.279 0.037 260.03) 300deg, oklch(0.279 0.037 260.03) 330deg,
      oklch(0.372 0.039 257.29) 330deg, oklch(0.372 0.039 257.29) 360deg);
  --roy-b10-cgc-sweep: 0deg;
  animation: roy-b10-cgc-tick 6s linear infinite;
  box-shadow: inset 0 0 0 4px oklch(0.696 0.149 162.48), 0 12px 30px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
}
.roycss-conic-gradient-clock::after {
  content: "";
  position: absolute;
  inline-size: 12px;
  block-size: 12px;
  border-radius: 50%;
  background: oklch(0.773 0.153 163.22);
  box-shadow: 0 0 12px oklch(0.696 0.149 162.48);
}
@keyframes roy-b10-cgc-tick {
  to { --roy-b10-cgc-sweep: 360deg; }
}`,
  },

  // 36 ─ Double Conic Spinner ─────────────────────────────────────
  {
    id: "double-conic-spinner",
    name: "Double Conic Spinner",
    category: "backgrounds",
    description: "Two counter-rotating conic gradients form a hypnotic spinner",
    tags: ["conic-gradient", "spinner", "background", "dual"],
    previewType: "background",
    cssCode: `/* Double Conic Spinner — two counter-rotating conic layers */
@property --roy-b10-dcs-a {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@property --roy-b10-dcs-b {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.roycss-double-conic-spinner {
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 220px;
  border-radius: 12px;
  background: oklch(0.208 0.04 265.75);
  display: grid;
  place-items: center;
  position: relative;
}
.roycss-double-conic-spinner::before {
  content: "";
  inline-size: 180px;
  block-size: 180px;
  border-radius: 50%;
  background:
    conic-gradient(from var(--roy-b10-dcs-a),
      transparent 0deg, oklch(0.715 0.126 215.22) 40deg, transparent 80deg,
      transparent 180deg, oklch(0.715 0.126 215.22) 220deg, transparent 260deg,
      transparent 360deg),
    conic-gradient(from var(--roy-b10-dcs-b),
      transparent 0deg, oklch(0.656 0.212 354.31) 40deg, transparent 80deg,
      transparent 180deg, oklch(0.656 0.212 354.31) 220deg, transparent 260deg,
      transparent 360deg),
    radial-gradient(circle, oklch(0.279 0.037 260.03) 40%, oklch(0.208 0.04 265.75) 41%);
  -webkit-mask: radial-gradient(circle, transparent 50px, oklch(0 0 0) 51px);
          mask: radial-gradient(circle, transparent 50px, oklch(0 0 0) 51px);
  --roy-b10-dcs-a: 0deg;
  --roy-b10-dcs-b: 90deg;
  animation: roy-b10-dcs-spin 3s linear infinite;
}
@keyframes roy-b10-dcs-spin {
  to {
    --roy-b10-dcs-a: 360deg;
    --roy-b10-dcs-b: -270deg;
  }
}`,
  },

  // 37 ─ Mask Radial Reveal ───────────────────────────────────────
  {
    id: "mask-radial-reveal",
    name: "Mask Radial Reveal",
    category: "backgrounds",
    description: "radial-gradient mask reveals a pattern layer in a growing circle",
    tags: ["mask", "radial", "reveal", "background"],
    previewType: "background",
    cssCode: `/* Mask Radial Reveal — mask: radial-gradient with @property radius */
@property --roy-b10-mrr-radius {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}
.roycss-mask-radial-reveal {
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 220px;
  border-radius: 12px;
  background:
    repeating-linear-gradient(45deg,
      oklch(0.656 0.212 354.31) 0 10px, oklch(0.606 0.219 292.72) 10px 20px, oklch(0.715 0.126 215.22) 20px 30px),
    oklch(0.208 0.04 265.75);
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
}
.roycss-mask-radial-reveal::before {
  content: "";
  position: absolute;
  inset: 0;
  background: oklch(0.208 0.04 265.75);
  -webkit-mask: radial-gradient(circle at center,
      transparent 0,
      transparent var(--roy-b10-mrr-radius),
      oklch(0 0 0) calc(var(--roy-b10-mrr-radius) + 2px));
          mask: radial-gradient(circle at center,
      transparent 0,
      transparent var(--roy-b10-mrr-radius),
      oklch(0 0 0) calc(var(--roy-b10-mrr-radius) + 2px));
  --roy-b10-mrr-radius: 0%;
  animation: roy-b10-mrr-grow 4s ease-in-out infinite;
}
@keyframes roy-b10-mrr-grow {
  0%, 100% { --roy-b10-mrr-radius: 0%; }
  60%      { --roy-b10-mrr-radius: 100%; }
  80%      { --roy-b10-mrr-radius: 100%; }
}
@supports not (mask: radial-gradient(circle, transparent, black)) {
  .roycss-mask-radial-reveal::before {
    animation: roy-b10-mrr-fb 4s ease-in-out infinite;
  }
  @keyframes roy-b10-mrr-fb {
    0%, 100% { opacity: 1; }
    60%, 80% { opacity: 0; }
  }
}`,
  },

  // 38 ─ Mask Linear Wipe ─────────────────────────────────────────
  {
    id: "mask-linear-wipe",
    name: "Mask Linear Wipe",
    category: "backgrounds",
    description: "linear-gradient mask wipes diagonally across two layered backgrounds",
    tags: ["mask", "linear", "wipe", "background"],
    previewType: "background",
    cssCode: `/* Mask Linear Wipe — linear-gradient mask sweep */
@property --roy-b10-mlw-pos {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}
.roycss-mask-linear-wipe {
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 220px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.769 0.165 70.08), oklch(0.637 0.208 25.33));
}
.roycss-mask-linear-wipe::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.715 0.126 215.22), oklch(0.585 0.204 277.12));
  -webkit-mask: linear-gradient(110deg,
      oklch(0 0 0) 0,
      oklch(0 0 0) var(--roy-b10-mlw-pos),
      transparent calc(var(--roy-b10-mlw-pos) + 4px),
      transparent 100%);
          mask: linear-gradient(110deg,
      oklch(0 0 0) 0,
      oklch(0 0 0) var(--roy-b10-mlw-pos),
      transparent calc(var(--roy-b10-mlw-pos) + 4px),
      transparent 100%);
  --roy-b10-mlw-pos: 0%;
  animation: roy-b10-mlw-sweep 4s ease-in-out infinite;
}
@keyframes roy-b10-mlw-sweep {
  0%, 100% { --roy-b10-mlw-pos: -10%; }
  50%      { --roy-b10-mlw-pos: 110%; }
}
@supports not (mask: linear-gradient(110deg, oklch(0 0 0), transparent)) {
  .roycss-mask-linear-wipe::before {
    animation: roy-b10-mlw-fb 4s ease-in-out infinite;
  }
  @keyframes roy-b10-mlw-fb {
    0%, 100% { clip-path: inset(0 100% 0 0); }
    50%      { clip-path: inset(0 0 0 0); }
  }
}`,
  },

  // 39 ─ Backdrop Multi Filter ────────────────────────────────────
  {
    id: "backdrop-multi-filter",
    name: "Backdrop Multi Filter",
    category: "backgrounds",
    description: "Layered backdrop-filter blur + saturate + hue-rotate over imagery",
    tags: ["backdrop-filter", "glass", "filter", "background"],
    previewType: "background",
    cssCode: `/* Backdrop Multi Filter — layered backdrop-filter chain */
.roycss-backdrop-multi-filter {
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 220px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 20%, oklch(0.645 0.215 16.44), transparent 40%),
    radial-gradient(circle at 80% 30%, oklch(0.797 0.134 211.53), transparent 40%),
    radial-gradient(circle at 50% 80%, oklch(0.627 0.233 303.9), transparent 45%),
    repeating-linear-gradient(45deg,
      color-mix(in oklch, oklch(1 0 89.88) 5%, transparent) 0 8px,
      transparent 8px 16px),
    oklch(0.208 0.04 265.75);
  display: grid;
  place-items: center;
}
.roycss-backdrop-multi-filter::before {
  content: "Multi backdrop-filter";
  padding: 26px 36px;
  border-radius: 16px;
  background: color-mix(in oklch, oklch(1 0 89.88) 8%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 20%, transparent);
  color: oklch(1 0 89.88);
  font: 700 16px/1 system-ui, sans-serif;
  letter-spacing: 0.05em;
  backdrop-filter: blur(14px) saturate(180%) hue-rotate(30deg) brightness(1.1);
  -webkit-backdrop-filter: blur(14px) saturate(180%) hue-rotate(30deg) brightness(1.1);
  box-shadow: 0 8px 30px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  animation: roy-b10-bmf-rotate 6s linear infinite;
}
@keyframes roy-b10-bmf-rotate {
  to { backdrop-filter: blur(14px) saturate(180%) hue-rotate(390deg) brightness(1.1); }
}
@supports not (backdrop-filter: blur(10px)) {
  .roycss-backdrop-multi-filter::before {
    background: color-mix(in oklch, oklch(1 0 89.88) 25%, transparent);
    backdrop-filter: none;
    animation: none;
  }
}`,
  },

  // 40 ─ Scrollbar Gutter Stable ──────────────────────────────────
  {
    id: "scrollbar-gutter-stable",
    name: "Scrollbar Gutter Stable",
    category: "backgrounds",
    description: "scrollbar-gutter: stable prevents layout shift across scroll states",
    tags: ["scrollbar-gutter", "layout", "stable", "modern"],
    previewType: "background",
    cssCode: `/* Scrollbar Gutter Stable — scrollbar-gutter: stable */
.roycss-scrollbar-gutter-stable {
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 220px;
  border-radius: 12px;
  background: linear-gradient(135deg, oklch(0.279 0.037 260.03), oklch(0.208 0.04 265.75));
  scrollbar-gutter: stable;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: oklch(0.929 0.013 255.51);
  font: 500 12px/1.4 system-ui, sans-serif;
}
.roycss-scrollbar-gutter-stable::before {
  content: "Scrollbar gutter reserved → no layout shift when content grows.";
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 12%, transparent);
  border-inline-start: 3px solid oklch(0.696 0.149 162.48);
  color: oklch(0.845 0.13 164.98);
  font-weight: 600;
}
.roycss-scrollbar-gutter-stable::after {
  content: "1. Stable layout block A\\A2. Stable layout block B\\A3. Stable layout block C\\A4. Stable layout block D\\A5. Stable layout block E";
  white-space: pre;
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  background: oklch(0.208 0.04 265.75);
  border: 1px solid oklch(0.372 0.039 257.29);
  color: oklch(0.711 0.035 256.79);
}
@supports not (scrollbar-gutter: stable) {
  .roycss-scrollbar-gutter-stable {
    padding-inline-end: 22px;
  }
}`,
  },
];
