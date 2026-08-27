# ADR-002: CSS-First Effects (Zero JavaScript Runtime)

## Status

Accepted (2025-01-15)

## Context

CSS effects libraries typically include JavaScript for animations — either for orchestrating multi-step sequences, responding to scroll/input, or computing per-frame values. RoyCSS needed to differentiate from existing libraries (Animate.css, Motion One, GSAP) and from a platform that already had 64 JavaScript-driven developer tools.

The catalog targets 1,809 effects across 31 categories (animations, hover, text, backgrounds, loaders, buttons, cards, borders, haptics, structural, nature, and 20 more). Each effect must:

- Render identically in React, Vue, Svelte, Angular, Astro, and vanilla HTML
- Survive server-side rendering without hydration mismatch
- Respect `prefers-reduced-motion`
- Weigh under ~1 KB per effect
- Be copy-pasteable as a single CSS string

## Decision

**All 1,809 RoyCSS effects are pure CSS.** Zero JavaScript is required for any visual effect in the catalog. Each effect is stored as a `CSSEffect` object:

```typescript
interface CSSEffect {
  id: string;              // "animations-float-card"
  name: string;            // "Floating Card"
  category: EffectCategory; // "animations"
  description: string;     // one-line summary
  tags: string[];          // search keywords
  cssCode: string;          // the complete CSS — copy-paste ready
  previewType: PreviewType; // "box" | "text" | "button" | ...
  childCount?: number;      // optional — for grid effects
  previewText?: string;     // optional — for text effects
}
```

### Conventions

- **Class prefix**: every effect class starts with `roycss-` (e.g., `.roycss-animations-float-card`)
- **Keyframes prefix**: every `@keyframes` rule starts with `roy-` (e.g., `@keyframes roy-float`)
- **Color values**: OKLCH (e.g., `oklch(0.72 0.18 145)`) — no indigo/blue primaries
- **Reduced motion**: every effect includes `@media (prefers-reduced-motion: reduce)` to disable animation
- **GPU acceleration**: animations use `transform` and `opacity` (never `top` / `left` / `width`)

## Rationale

- **Smallest possible bundle** — CSS is ~1 KB per effect; the entire 1,809-effect catalog gzips to under 200 KB and only the requested effect is injected via `MutationObserver`
- **Framework-agnostic** — a single CSS string works in any framework or no framework; the platform ships framework adapters (`framework-adapters.ts`) but the effect code itself is identical across all of them
- **GPU-accelerated** — `transform` and `opacity` are compositor-only properties, so animations run off the main thread and never block interaction
- **No hydration cost** — server-rendered HTML already shows the correct visual state; React doesn't need to re-attach event listeners or re-run animation logic
- **prefers-reduced-motion support** — built into each effect via `@media` queries rather than requiring a JS-based motion preference check
- **Copy-pasteable** — a single CSS string is the only payload; users can paste it into any project without an npm install

## Trade-offs

- **Pro**: Zero JS, framework-agnostic, GPU-accelerated, copy-pasteable, SSR-safe
- **Con**: Some complex effects (physics simulations, real-time particle systems, audio-reactive visuals) genuinely require JavaScript — these are **not** in the CSS effects catalog; they live in separate WebGL/Canvas components under `src/components/roycss/effects/` (7 GPU scenes: `three-tubes-cursor`, `neon-tunnel`, `matrix-rain-3d`, `floating-orbs`, `aurora-borealis`, `three-wave-grid`, `particle-network`)
- **Con**: Scroll-triggered or scroll-linked effects need a small JS observer — these are documented as "scroll-driven" recipes in `src/lib/roycss-recipes.ts` rather than as standalone CSS effects
- **Con**: Effects cannot read runtime state (e.g., mouse position) without JS — the platform addresses this with custom-property bridges (`--roycss-mouse-x`) set by a single global `pointermove` listener where needed

## Alternatives Considered

1. **JavaScript animation library (e.g., Motion One, GSAP)** — rejected: would force a runtime dependency, break framework-agnostic copy-paste, and add bundle weight that contradicts the platform's value proposition.
2. **Web Animations API (WAAPI)** — rejected for the catalog (still requires JS per element); accepted as an escape hatch inside the WebGL/canvas components where JS is already present.
3. **Hybrid CSS + minimal JS runtime** — rejected: even a 2 KB JS runtime would break the "paste one CSS string" promise. The catalog stays pure-CSS; JS-driven scenes live separately and are clearly labeled.
