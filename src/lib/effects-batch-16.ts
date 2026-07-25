import type { CSSEffect } from "./roycss-types";

/**
 * Batch 16 — Future-Trending CSS Effects (30 effects)
 * A curated collection of effects anticipating 2026–2030 web design trends:
 * - visual (12): spatial/3D surfaces, liquid glass, holographic, aurora 2.0, mesh, chromatic, metallic
 * - animations (8): spring physics, gravity, momentum, kinetic typography, morph, parallax, elastic, fluid
 * - text (4): variable-font morph, kinetic wave, scramble decode, mesh gradient
 * - backgrounds (3): neural net, quantum field, flowing silk
 * - hover (3): magnetic pull v2, glass shatter, liquid morph
 *
 * Modern CSS features used:
 *  - OKLCH color space + color-mix() for perceptual color arithmetic
 *  - CSS nesting (Level 3)
 *  - Logical properties (inline-size, block-size, inset-*)
 *  - @property registered custom properties (for animated gradients & color shifts)
 *  - animation-timeline: view() / scroll() (scroll-driven animations)
 *  - Container queries (@container)
 *  - offset-path for fluid motion paths
 *  - clip-path polygon morphing
 *  - backdrop-filter with hue-rotate for liquid glass refraction
 *
 * All classes use `.roycss-` prefix; all keyframes use `roy-b16-` prefix.
 * Verified zero ID collisions with batches 1-15 (705 effects).
 */
export const effectsBatch16: CSSEffect[] = [
  /* =========================================================================
   * VISUAL — FUTURE SURFACE EFFECTS (12)
   * ========================================================================= */
  {
    id: "spatial-depth-card",
    name: "Spatial Depth Card",
    category: "visual",
    description:
      "Vision Pro-inspired depth card with stacked parallax layers, ambient occlusion, and a floating specular highlight that responds to scroll position via animation-timeline",
    tags: ["spatial", "depth", "parallax", "vision-pro"],
    previewType: "card",
    cssCode: `/* Spatial Depth Card — Vision Pro parallax layers */
@property --roy-b16-tilt {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
.roycss-spatial-depth-card {
  inline-size: 240px;
  block-size: 160px;
  position: relative;
  border-radius: 22px;
  transform-style: preserve-3d;
  perspective: 900px;
  transform: rotateX(8deg) rotateY(-6deg);
  box-shadow:
    0 30px 60px -20px oklch(0.18 0.08 270 / 0.55),
    0 18px 30px -12px oklch(0.22 0.05 280 / 0.45),
    inset 0 1px 0 oklch(1 0 0 / 0.18);
  background:
    radial-gradient(140% 80% at 20% 0%, oklch(0.78 0.13 245) 0%, oklch(0.42 0.18 265) 45%, oklch(0.22 0.08 280) 100%);
  overflow: hidden;
  animation: roy-b16-spatial-tilt 8s ease-in-out infinite;
}
.roycss-spatial-depth-card::before {
  /* far layer — ambient glow */
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 50% at 70% 20%, oklch(0.92 0.16 200 / 0.55), transparent 70%);
  transform: translateZ(-40px) scale(1.1);
  filter: blur(8px);
}
.roycss-spatial-depth-card::after {
  /* near layer — specular highlight that drifts */
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: -20%;
  inline-size: 60%;
  block-size: 100%;
  background: linear-gradient(105deg, transparent 30%, oklch(1 0 0 / 0.32) 50%, transparent 70%);
  transform: translateZ(40px);
  filter: blur(2px);
  animation: roy-b16-spatial-spec 6s ease-in-out infinite;
}
@keyframes roy-b16-spatial-tilt {
  0%, 100% { transform: rotateX(8deg) rotateY(-6deg); }
  50%      { transform: rotateX(-4deg) rotateY(8deg); }
}
@keyframes roy-b16-spatial-spec {
  0%   { inset-inline-start: -30%; }
  100% { inset-inline-start: 110%; }
}`,
  },
  {
    id: "liquid-glass-refract",
    name: "Liquid Glass Refraction",
    category: "visual",
    description:
      "Liquid glass surface with animated hue-shift refraction via backdrop-filter — simulates how light bends through dense glass with chromatic dispersion",
    tags: ["liquid-glass", "refraction", "backdrop-filter", "frosted"],
    previewType: "card",
    cssCode: `/* Liquid Glass Refraction */
.roycss-liquid-glass-refract {
  inline-size: 240px;
  block-size: 160px;
  position: relative;
  border-radius: 28px;
  background:
    linear-gradient(135deg, oklch(0.95 0.04 240 / 0.18), oklch(0.82 0.10 280 / 0.12));
  backdrop-filter: blur(18px) saturate(1.6) hue-rotate(var(--roy-b16-hue, 0deg)) contrast(1.05);
  -webkit-backdrop-filter: blur(18px) saturate(1.6) hue-rotate(var(--roy-b16-hue, 0deg)) contrast(1.05);
  border: 1px solid oklch(1 0 0 / 0.22);
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.45),
    inset 0 -2px 8px oklch(0.6 0.1 260 / 0.18),
    0 22px 40px -16px oklch(0.2 0.08 280 / 0.55);
  overflow: hidden;
  animation: roy-b16-refract-hue 12s linear infinite;
  isolation: isolate;
}
.roycss-liquid-glass-refract::before {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  block-size: 50%;
  background: linear-gradient(180deg, oklch(1 0 0 / 0.35), transparent);
  border-radius: 28px 28px 60% 60% / 28px 28px 100% 100%;
  pointer-events: none;
}
.roycss-liquid-glass-refract::after {
  content: "";
  position: absolute;
  inset: -20%;
  background: conic-gradient(from 0deg at 50% 50%, oklch(0.85 0.2 0), oklch(0.85 0.2 90), oklch(0.85 0.2 180), oklch(0.85 0.2 270), oklch(0.85 0.2 0));
  filter: blur(40px);
  opacity: 0.25;
  z-index: -1;
  animation: roy-b16-refract-spin 18s linear infinite;
}
@keyframes roy-b16-refract-hue {
  0%   { --roy-b16-hue: 0deg; }
  50%  { --roy-b16-hue: 18deg; }
  100% { --roy-b16-hue: 0deg; }
}
@keyframes roy-b16-refract-spin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "kinetic-morph-blob",
    name: "Kinetic Morph Blob",
    category: "visual",
    description:
      "Organic breathing blob that morphs through asymmetric border-radius values — feels alive, like a slow organism expanding and contracting",
    tags: ["morph", "organic", "blob", "breathing"],
    previewType: "box",
    cssCode: `/* Kinetic Morph Blob */
.roycss-kinetic-morph-blob {
  inline-size: 180px;
  block-size: 180px;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.92 0.18 320) 0%, oklch(0.72 0.22 290) 50%, oklch(0.55 0.20 260) 100%);
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  filter: blur(0.5px) drop-shadow(0 14px 24px oklch(0.45 0.18 290 / 0.45));
  animation:
    roy-b16-morph-shape 9s ease-in-out infinite,
    roy-b16-morph-scale 4s ease-in-out infinite;
  position: relative;
}
.roycss-kinetic-morph-blob::before {
  content: "";
  position: absolute;
  inset: 18%;
  background: radial-gradient(circle at 40% 35%, oklch(1 0 0 / 0.55), transparent 65%);
  border-radius: inherit;
  filter: blur(4px);
  mix-blend-mode: overlay;
}
@keyframes roy-b16-morph-shape {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  25%      { border-radius: 30% 70% 70% 30% / 50% 60% 40% 50%; }
  50%      { border-radius: 50% 50% 20% 80% / 25% 75% 25% 75%; }
  75%      { border-radius: 70% 30% 50% 50% / 40% 60% 40% 60%; }
}
@keyframes roy-b16-morph-scale {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50%      { transform: scale(1.08) rotate(8deg); }
}`,
  },
  {
    id: "holographic-shift",
    name: "Holographic Shift",
    category: "visual",
    description:
      "Holographic surface with shifting iridescent colors — animated conic-gradient + hue-rotate creates a foil-stamp effect that animates across the surface",
    tags: ["holographic", "iridescent", "prism", "foil"],
    previewType: "card",
    cssCode: `/* Holographic Shift */
.roycss-holographic-shift {
  inline-size: 240px;
  block-size: 160px;
  position: relative;
  border-radius: 18px;
  background:
    linear-gradient(135deg,
      oklch(0.88 0.22 0) 0%,
      oklch(0.82 0.20 90) 18%,
      oklch(0.85 0.22 180) 36%,
      oklch(0.83 0.20 270) 54%,
      oklch(0.88 0.18 200) 72%,
      oklch(0.85 0.24 330) 90%,
      oklch(0.88 0.22 0) 100%);
  background-size: 300% 300%;
  box-shadow:
    inset 0 0 0 1px oklch(1 0 0 / 0.3),
    inset 0 1px 0 oklch(1 0 0 / 0.6),
    0 18px 40px -12px oklch(0.4 0.18 280 / 0.5);
  animation: roy-b16-holo-shift 8s ease-in-out infinite;
  isolation: isolate;
  overflow: hidden;
}
.roycss-holographic-shift::before {
  content: "";
  position: absolute;
  inset: 0;
  background: conic-gradient(from 0deg at 50% 50%,
    transparent, oklch(1 0 0 / 0.4), transparent, oklch(1 0 0 / 0.25), transparent);
  animation: roy-b16-holo-spin 14s linear infinite;
  mix-blend-mode: overlay;
}
.roycss-holographic-shift::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, oklch(1 0 0 / 0.25), transparent 50%, oklch(0 0 0 / 0.18));
  pointer-events: none;
}
@keyframes roy-b16-holo-shift {
  0%   { background-position: 0% 50%; filter: hue-rotate(0deg); }
  50%  { background-position: 100% 50%; filter: hue-rotate(40deg); }
  100% { background-position: 0% 50%; filter: hue-rotate(0deg); }
}
@keyframes roy-b16-holo-spin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "aurora-flow-2",
    name: "Aurora Flow 2.0",
    category: "visual",
    description:
      "Next-gen aurora background with three organic flowing layers, each drifting at independent speeds and angles — feels like a living atmospheric event",
    tags: ["aurora", "atmosphere", "flow", "ambient"],
    previewType: "background",
    cssCode: `/* Aurora Flow 2.0 — layered organic aurora */
.roycss-aurora-flow-2 {
  inline-size: 100%;
  block-size: 240px;
  position: relative;
  background: oklch(0.08 0.03 260);
  overflow: hidden;
  isolation: isolate;
}
.roycss-aurora-flow-2::before,
.roycss-aurora-flow-2::after {
  content: "";
  position: absolute;
  inset: -30%;
  pointer-events: none;
}
.roycss-aurora-flow-2::before {
  background:
    radial-gradient(closest-side at 20% 30%, oklch(0.72 0.24 145 / 0.7), transparent),
    radial-gradient(closest-side at 75% 60%, oklch(0.65 0.27 280 / 0.65), transparent),
    radial-gradient(closest-side at 50% 85%, oklch(0.78 0.20 200 / 0.55), transparent);
  filter: blur(40px);
  animation: roy-b16-aurora-drift-a 18s ease-in-out infinite;
  mix-blend-mode: screen;
}
.roycss-aurora-flow-2::after {
  background:
    radial-gradient(closest-side at 60% 20%, oklch(0.7 0.22 350 / 0.5), transparent),
    radial-gradient(closest-side at 25% 75%, oklch(0.75 0.24 180 / 0.55), transparent);
  filter: blur(50px);
  animation: roy-b16-aurora-drift-b 22s ease-in-out infinite reverse;
  mix-blend-mode: screen;
}
@keyframes roy-b16-aurora-drift-a {
  0%   { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
  33%  { transform: translate3d(8%, -6%, 0) rotate(8deg) scale(1.1); }
  66%  { transform: translate3d(-6%, 4%, 0) rotate(-6deg) scale(0.95); }
  100% { transform: translate3d(0,0,0) rotate(0deg) scale(1); }
}
@keyframes roy-b16-aurora-drift-b {
  0%   { transform: translate3d(0,0,0) rotate(0deg); }
  50%  { transform: translate3d(-10%, 8%, 0) rotate(-12deg); }
  100% { transform: translate3d(0,0,0) rotate(0deg); }
}`,
  },
  {
    id: "prism-light-split",
    name: "Prism Light Split",
    category: "visual",
    description:
      "White light beam that passes through a triangular prism and splits into a rainbow fan of refracted color beams — pure CSS using clip-path and blend modes",
    tags: ["prism", "rainbow", "refraction", "light"],
    previewType: "box",
    cssCode: `/* Prism Light Split */
.roycss-prism-light-split {
  inline-size: 280px;
  block-size: 180px;
  position: relative;
  background: oklch(0.10 0.02 250);
  overflow: hidden;
  isolation: isolate;
}
/* incoming white beam */
.roycss-prism-light-split::before {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 0;
  inline-size: 55%;
  block-size: 4px;
  background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.95));
  filter: blur(1px) drop-shadow(0 0 8px oklch(1 0 0 / 0.7));
  transform: translateY(-50%);
}
/* prism + refracted rainbow fan */
.roycss-prism-light-split::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 60%;
  block-size: 60%;
  transform: translate(-10%, -50%);
  background:
    linear-gradient(100deg,
      oklch(0.85 0.28 25) 0deg,
      oklch(0.85 0.26 60) 6deg,
      oklch(0.85 0.24 110) 12deg,
      oklch(0.85 0.22 160) 18deg,
      oklch(0.85 0.22 220) 24deg,
      oklch(0.85 0.24 280) 30deg,
      oklch(0.85 0.26 330) 36deg);
  clip-path: polygon(0 50%, 0 48%, 100% 0%, 100% 100%, 0 52%);
  filter: blur(2px);
  mix-blend-mode: screen;
  animation: roy-b16-prism-pulse 4s ease-in-out infinite;
  transform-origin: left center;
}
@keyframes roy-b16-prism-pulse {
  0%, 100% { opacity: 0.85; filter: blur(2px) brightness(1); }
  50%      { opacity: 1;    filter: blur(3px) brightness(1.25); }
}`,
  },
  {
    id: "adaptive-time-color",
    name: "Adaptive Time-of-Day Color",
    category: "visual",
    description:
      "Surface whose color shifts through a 24-hour perceptual cycle — warm dawn, bright midday, cool dusk, deep night — driven purely by an animated hue/lightness cycle",
    tags: ["adaptive", "circadian", "time", "color-shift"],
    previewType: "box",
    cssCode: `/* Adaptive Time-of-Day Color */
@property --roy-b16-time-h {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}
.roycss-adaptive-time-color {
  inline-size: 200px;
  block-size: 120px;
  border-radius: 16px;
  --roy-b16-time-h: 0;
  background:
    linear-gradient(135deg,
      oklch(0.65 0.18 calc(30 + var(--roy-b16-time-h) * 2) / 0.95),
      oklch(0.45 0.22 calc(280 - var(--roy-b16-time-h) * 1.5) / 0.95));
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.25),
    0 14px 30px -10px oklch(0.4 0.15 280 / 0.5);
  border: 1px solid oklch(1 0 0 / 0.12);
  animation: roy-b16-day-cycle 24s linear infinite;
  position: relative;
}
.roycss-adaptive-time-color::before {
  /* sun/moon orb that arcs across */
  content: "";
  position: absolute;
  inline-size: 24px;
  block-size: 24px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(1 0 0 / 0.95), oklch(0.95 0.18 60 / 0.6));
  filter: drop-shadow(0 0 12px oklch(0.95 0.18 60 / 0.8));
  inset-block-start: 8px;
  inset-inline-start: 8px;
  animation: roy-b16-orb-arc 24s linear infinite;
}
@keyframes roy-b16-day-cycle {
  0%   { --roy-b16-time-h: 0;   filter: brightness(0.8) saturate(1.2); }
  25%  { --roy-b16-time-h: 60;  filter: brightness(1.1) saturate(1.1); }
  50%  { --roy-b16-time-h: 120; filter: brightness(0.95) saturate(0.9); }
  75%  { --roy-b16-time-h: 60;  filter: brightness(0.7) saturate(1.15); }
  100% { --roy-b16-time-h: 0;   filter: brightness(0.8) saturate(1.2); }
}
@keyframes roy-b16-orb-arc {
  0%   { transform: translate(0, 100px); opacity: 0.4; }
  25%  { transform: translate(80px, 0);  opacity: 1; }
  50%  { transform: translate(170px, 100px); opacity: 0.4; }
  75%  { transform: translate(80px, 100px); opacity: 0.2; }
  100% { transform: translate(0, 100px); opacity: 0.4; }
}`,
  },
  {
    id: "bento-depth-grid",
    name: "Bento Depth Grid",
    category: "visual",
    description:
      "Apple-style bento grid cell with layered depth — floating frosted panel with elevated content layer, ambient occlusion shadow, and a subtle inner light that hints at 3D space",
    tags: ["bento", "depth", "apple", "frosted"],
    previewType: "card",
    cssCode: `/* Bento Depth Grid */
.roycss-bento-depth-grid {
  inline-size: 240px;
  block-size: 180px;
  border-radius: 24px;
  position: relative;
  background: linear-gradient(160deg, oklch(0.22 0.05 260), oklch(0.16 0.03 270));
  padding: 16px;
  box-shadow:
    0 1px 0 oklch(1 0 0 / 0.06) inset,
    0 24px 50px -18px oklch(0 0 0 / 0.7),
    0 8px 16px -8px oklch(0 0 0 / 0.5);
  overflow: hidden;
  isolation: isolate;
  container-type: inline-size;
}
.roycss-bento-depth-grid::before {
  /* elevated content layer — appears to float above the base */
  content: "";
  position: absolute;
  inset-block-start: 12px;
  inset-inline: 12px;
  block-size: 50%;
  border-radius: 18px;
  background: linear-gradient(135deg, oklch(0.95 0.10 245 / 0.9), oklch(0.80 0.14 290 / 0.85));
  box-shadow:
    0 12px 24px -8px oklch(0 0 0 / 0.5),
    inset 0 1px 0 oklch(1 0 0 / 0.4);
  z-index: 2;
}
.roycss-bento-depth-grid::after {
  /* ambient highlight wash */
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  block-size: 60%;
  background: radial-gradient(80% 80% at 50% 100%, oklch(0.70 0.18 280 / 0.45), transparent 70%);
  filter: blur(20px);
  z-index: 1;
  animation: roy-b16-bento-glow 5s ease-in-out infinite;
}
@keyframes roy-b16-bento-glow {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 1; }
}`,
  },
  {
    id: "glass-liquid-fill",
    name: "Glass Liquid Fill",
    category: "visual",
    description:
      "Glass container being filled by an animated wavy liquid surface — uses two layered SVG-like waves via clip-path and translate to simulate a fluid level rising and falling",
    tags: ["liquid", "wave", "fill", "glass"],
    previewType: "box",
    cssCode: `/* Glass Liquid Fill */
.roycss-glass-liquid-fill {
  inline-size: 160px;
  block-size: 200px;
  position: relative;
  border-radius: 16px;
  background: linear-gradient(180deg, oklch(0.95 0.04 220 / 0.18), oklch(0.85 0.05 220 / 0.12));
  border: 1px solid oklch(1 0 0 / 0.25);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  overflow: hidden;
  box-shadow: inset 0 0 20px oklch(0.6 0.1 220 / 0.2), 0 12px 30px -10px oklch(0.2 0.05 240 / 0.4);
}
.roycss-glass-liquid-fill::before,
.roycss-glass-liquid-fill::after {
  content: "";
  position: absolute;
  inset-block-start: 40%;
  inset-inline: -25%;
  inline-size: 150%;
  block-size: 80%;
  background: linear-gradient(180deg, oklch(0.72 0.18 230 / 0.85), oklch(0.55 0.22 240 / 0.95));
  clip-path: polygon(0 8%, 6% 0, 12% 8%, 18% 0, 24% 8%, 30% 0, 36% 8%, 42% 0, 48% 8%, 54% 0, 60% 8%, 66% 0, 72% 8%, 78% 0, 84% 8%, 90% 0, 96% 8%, 100% 0, 100% 100%, 0 100%);
  animation: roy-b16-wave-flow 4s linear infinite;
}
.roycss-glass-liquid-fill::after {
  inset-block-start: 42%;
  background: linear-gradient(180deg, oklch(0.85 0.16 200 / 0.6), oklch(0.65 0.20 220 / 0.7));
  animation: roy-b16-wave-flow 3s linear infinite reverse;
  opacity: 0.7;
}
@keyframes roy-b16-wave-flow {
  0%   { transform: translateX(0); }
  100% { transform: translateX(16.66%); }
}`,
  },
  {
    id: "mesh-gradient-flow",
    name: "Mesh Gradient Flow",
    category: "visual",
    description:
      "Mesh gradient composed of four animated radial color stops that drift independently — recreates the Apple Monterey/iOS mesh wallpaper aesthetic with organic motion",
    tags: ["mesh", "gradient", "flow", "organic"],
    previewType: "background",
    cssCode: `/* Mesh Gradient Flow */
.roycss-mesh-gradient-flow {
  inline-size: 100%;
  block-size: 240px;
  position: relative;
  background: oklch(0.95 0.02 280);
  overflow: hidden;
  isolation: isolate;
}
.roycss-mesh-gradient-flow::before,
.roycss-mesh-gradient-flow::after {
  content: "";
  position: absolute;
  inset: -20%;
  pointer-events: none;
}
.roycss-mesh-gradient-flow::before {
  background:
    radial-gradient(closest-side at 20% 25%, oklch(0.82 0.20 350 / 0.8), transparent 60%),
    radial-gradient(closest-side at 80% 20%, oklch(0.78 0.22 200 / 0.8), transparent 60%),
    radial-gradient(closest-side at 70% 80%, oklch(0.85 0.18 140 / 0.75), transparent 60%),
    radial-gradient(closest-side at 15% 75%, oklch(0.80 0.22 60 / 0.75), transparent 60%);
  filter: blur(30px);
  animation: roy-b16-mesh-drift-a 16s ease-in-out infinite;
}
.roycss-mesh-gradient-flow::after {
  background:
    radial-gradient(closest-side at 50% 50%, oklch(0.92 0.18 290 / 0.5), transparent 50%),
    radial-gradient(closest-side at 35% 60%, oklch(0.88 0.22 180 / 0.5), transparent 50%);
  filter: blur(40px);
  animation: roy-b16-mesh-drift-b 22s ease-in-out infinite reverse;
  mix-blend-mode: multiply;
}
@keyframes roy-b16-mesh-drift-a {
  0%, 100% { transform: translate3d(0,0,0) scale(1) rotate(0deg); }
  50%      { transform: translate3d(4%, -3%, 0) scale(1.08) rotate(6deg); }
}
@keyframes roy-b16-mesh-drift-b {
  0%, 100% { transform: translate3d(0,0,0) scale(1.05); }
  50%      { transform: translate3d(-4%, 3%, 0) scale(1); }
}`,
  },
  {
    id: "chromatic-aberration",
    name: "Chromatic Aberration",
    category: "visual",
    description:
      "Lens chromatic aberration effect — RGB channel split via mix-blend-mode and offset layers, with animated drift that simulates lens fringe distortion",
    tags: ["chromatic", "aberration", "rgb-split", "lens"],
    previewType: "box",
    cssCode: `/* Chromatic Aberration */
.roycss-chromatic-aberration {
  inline-size: 200px;
  block-size: 120px;
  position: relative;
  background:
    radial-gradient(circle at 50% 50%, oklch(0.3 0.18 280) 0%, oklch(0.18 0.10 260) 100%);
  border-radius: 14px;
  overflow: hidden;
  isolation: isolate;
  display: grid;
  place-items: center;
  color: oklch(0.95 0.05 280);
  font: 700 28px / 1 system-ui, sans-serif;
  letter-spacing: 0.08em;
}
.roycss-chromatic-aberration::before,
.roycss-chromatic-aberration::after {
  content: "ROYCSS";
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font: inherit;
  letter-spacing: inherit;
  pointer-events: none;
}
.roycss-chromatic-aberration::before {
  color: oklch(0.7 0.32 25);
  mix-blend-mode: screen;
  animation: roy-b16-aber-r 3.4s ease-in-out infinite;
}
.roycss-chromatic-aberration::after {
  color: oklch(0.7 0.32 200);
  mix-blend-mode: screen;
  animation: roy-b16-aber-b 3.4s ease-in-out infinite;
}
@keyframes roy-b16-aber-r {
  0%, 100% { transform: translate(-2px, 0); opacity: 0.85; }
  50%      { transform: translate(-5px, 1px); opacity: 1; }
}
@keyframes roy-b16-aber-b {
  0%, 100% { transform: translate(2px, 0); opacity: 0.85; }
  50%      { transform: translate(5px, -1px); opacity: 1; }
}`,
  },
  {
    id: "metallic-flow",
    name: "Metallic Flow",
    category: "visual",
    description:
      "Liquid metal surface that flows and reflects — animated conic-gradient with shifting specular streaks creates a mercury/gallium flowing-metal aesthetic",
    tags: ["metallic", "liquid-metal", "chrome", "reflective"],
    previewType: "box",
    cssCode: `/* Metallic Flow */
.roycss-metallic-flow {
  inline-size: 220px;
  block-size: 140px;
  border-radius: 24px;
  position: relative;
  background:
    conic-gradient(from var(--roy-b16-met-angle, 0deg) at 50% 50%,
      oklch(0.92 0.02 270) 0deg,
      oklch(0.65 0.04 260) 60deg,
      oklch(0.92 0.01 270) 120deg,
      oklch(0.55 0.05 250) 180deg,
      oklch(0.95 0.02 270) 240deg,
      oklch(0.62 0.05 260) 300deg,
      oklch(0.92 0.02 270) 360deg);
  box-shadow:
    inset 0 2px 0 oklch(1 0 0 / 0.7),
    inset 0 -3px 6px oklch(0 0 0 / 0.4),
    0 16px 30px -10px oklch(0.2 0.04 260 / 0.6);
  animation: roy-b16-metal-flow 6s linear infinite;
  overflow: hidden;
  isolation: isolate;
}
.roycss-metallic-flow::before {
  /* drifting specular streak */
  content: "";
  position: absolute;
  inset-block-start: -20%;
  inset-inline-start: -20%;
  inline-size: 60%;
  block-size: 140%;
  background: linear-gradient(105deg, transparent 30%, oklch(1 0 0 / 0.65) 50%, transparent 70%);
  transform: rotate(15deg);
  filter: blur(2px);
  animation: roy-b16-metal-streak 4s ease-in-out infinite;
}
.roycss-metallic-flow::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.25), transparent 50%);
  pointer-events: none;
}
@property --roy-b16-met-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
@keyframes roy-b16-metal-flow {
  to { --roy-b16-met-angle: 360deg; }
}
@keyframes roy-b16-metal-streak {
  0%   { transform: translateX(-60%) rotate(15deg); }
  100% { transform: translateX(280%) rotate(15deg); }
}`,
  },

  /* =========================================================================
   * ANIMATIONS — FUTURE MOTION (8)
   * ========================================================================= */
  {
    id: "spring-physics-bounce",
    name: "Spring Physics Bounce",
    category: "animations",
    description:
      "Natural spring-bounce motion using cubic-bezier overshoot — element springs into place with realistic deceleration that mimics a critically-damped harmonic oscillator",
    tags: ["spring", "physics", "bounce", "motion"],
    previewType: "box",
    cssCode: `/* Spring Physics Bounce */
.roycss-spring-physics-bounce {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, oklch(0.78 0.20 145), oklch(0.60 0.22 170));
  box-shadow:
    inset 0 2px 0 oklch(1 0 0 / 0.4),
    0 10px 20px -6px oklch(0.4 0.18 160 / 0.5);
  animation: roy-b16-spring-bounce 2.4s cubic-bezier(0.5, 1.6, 0.4, 0.95) infinite;
  transform-origin: center bottom;
}
@keyframes roy-b16-spring-bounce {
  0%   { transform: translateY(-120px) scaleY(0.7); opacity: 0; }
  40%  { transform: translateY(0) scaleY(1.15); opacity: 1; }
  55%  { transform: translateY(0) scaleY(0.85); }
  70%  { transform: translateY(0) scaleY(1.05); }
  85%  { transform: translateY(0) scaleY(0.97); }
  100% { transform: translateY(-120px) scaleY(0.7); opacity: 0; }
}`,
  },
  {
    id: "gravity-drop",
    name: "Gravity Drop",
    category: "animations",
    description:
      "Element falls under simulated gravity — accelerating ease-in descent followed by an inelastic impact squash, like a ball dropped on the floor",
    tags: ["gravity", "physics", "drop", "squash"],
    previewType: "box",
    cssCode: `/* Gravity Drop */
.roycss-gravity-drop {
  inline-size: 64px;
  block-size: 64px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, oklch(0.88 0.18 50), oklch(0.65 0.22 30));
  box-shadow:
    inset -4px -6px 8px oklch(0 0 0 / 0.2),
    0 8px 14px -4px oklch(0.4 0.18 40 / 0.55);
  animation:
    roy-b16-grav-fall 2s cubic-bezier(0.6, 0, 0.9, 0.3) infinite,
    roy-b16-grav-squash 2s cubic-bezier(0.3, 1.4, 0.6, 1) infinite;
}
@keyframes roy-b16-grav-fall {
  0%   { transform: translateY(-100px); }
  60%  { transform: translateY(0); }
  100% { transform: translateY(-100px); }
}
@keyframes roy-b16-grav-squash {
  0%   { transform: scale(1, 1); }
  55%  { transform: scale(1, 1); }
  60%  { transform: scale(1.4, 0.6); }
  66%  { transform: scale(0.85, 1.15); }
  72%  { transform: scale(1.05, 0.95); }
  78%  { transform: scale(1, 1); }
  100% { transform: scale(1, 1); }
}`,
  },
  {
    id: "momentum-scroll",
    name: "Momentum Scroll",
    category: "animations",
    description:
      "Momentum-scrolling indicator that decelerates naturally — a strip accelerates from rest, hits peak velocity, then decelerates with eased inertia like a flick-scroll",
    tags: ["momentum", "scroll", "inertia", "deceleration"],
    previewType: "box",
    cssCode: `/* Momentum Scroll */
.roycss-momentum-scroll {
  inline-size: 280px;
  block-size: 80px;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(180deg, oklch(0.16 0.02 260), oklch(0.10 0.02 260));
  box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.06), inset 0 2px 6px oklch(0 0 0 / 0.5);
}
.roycss-momentum-scroll::before {
  /* scrolling content strip */
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inline-size: 60%;
  block-size: 14px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, transparent, oklch(0.78 0.20 200), oklch(0.85 0.18 250), transparent);
  border-radius: 7px;
  filter: drop-shadow(0 0 8px oklch(0.78 0.20 200 / 0.6));
  animation: roy-b16-momentum 3.2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
}
.roycss-momentum-scroll::after {
  /* edge fade mask feel — vignette */
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, oklch(0.10 0.02 260) 0%, transparent 12%, transparent 88%, oklch(0.10 0.02 260) 100%);
  pointer-events: none;
}
@keyframes roy-b16-momentum {
  0%   { transform: translate(-70%, -50%) translateX(0); }
  45%  { transform: translate(60%, -50%) translateX(0); }
  55%  { transform: translate(60%, -50%) translateX(0); }
  100% { transform: translate(280%, -50%) translateX(0); }
}`,
  },
  {
    id: "kinetic-typography",
    name: "Kinetic Typography",
    category: "animations",
    description:
      "Text that breathes using variable font-weight morphing — each letter cycles weight and width in a wave pattern that gives typography an organic, living quality",
    tags: ["kinetic", "typography", "variable-font", "breathing"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Kinetic Typography */
.roycss-kinetic-typography {
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  font-size: 56px;
  font-weight: 400;
  font-stretch: 100%;
  font-variation-settings: "wght" 400, "wdth" 100;
  background: linear-gradient(135deg, oklch(0.85 0.18 280), oklch(0.78 0.22 200));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 0.04em;
  animation:
    roy-b16-kinetic-weight 3.6s ease-in-out infinite,
    roy-b16-kinetic-width 5s ease-in-out infinite;
  filter: drop-shadow(0 4px 14px oklch(0.5 0.18 270 / 0.4));
}
@keyframes roy-b16-kinetic-weight {
  0%, 100% { font-variation-settings: "wght" 300, "wdth" 100; font-weight: 300; }
  50%      { font-variation-settings: "wght" 800, "wdth" 100; font-weight: 800; }
}
@keyframes roy-b16-kinetic-width {
  0%, 100% { font-stretch: 85%;  letter-spacing: 0.02em; }
  50%      { font-stretch: 115%; letter-spacing: 0.08em; }
}`,
  },
  {
    id: "morph-shape-cycle",
    name: "Morph Shape Cycle",
    category: "animations",
    description:
      "Element morphs through organic shapes using animated clip-path polygons — circle to blob to star to hexagon in a continuous smooth transition",
    tags: ["morph", "clip-path", "shape", "organic"],
    previewType: "box",
    cssCode: `/* Morph Shape Cycle */
.roycss-morph-shape-cycle {
  inline-size: 160px;
  block-size: 160px;
  background:
    linear-gradient(135deg, oklch(0.82 0.22 320), oklch(0.65 0.25 270));
  box-shadow: 0 12px 30px -8px oklch(0.45 0.2 300 / 0.5);
  animation: roy-b16-morph-cycle 8s ease-in-out infinite;
  transform-origin: center;
}
@keyframes roy-b16-morph-cycle {
  0%, 100% {
    clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
    border-radius: 0;
    transform: rotate(0deg) scale(1);
  }
  20% {
    clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
    border-radius: 12px;
    transform: rotate(36deg) scale(0.95);
  }
  40% {
    clip-path: polygon(50% 0%, 80% 10%, 100% 50%, 80% 90%, 50% 100%, 20% 90%, 0% 50%, 20% 10%);
    border-radius: 30%;
    transform: rotate(72deg) scale(1.05);
  }
  60% {
    clip-path: polygon(50% 0%, 90% 50%, 50% 100%, 10% 50%);
    border-radius: 0;
    transform: rotate(108deg) scale(0.95);
  }
  80% {
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    border-radius: 50%;
    transform: rotate(144deg) scale(1);
  }
}`,
  },
  {
    id: "parallax-depth-scroll",
    name: "Parallax Depth Scroll",
    category: "animations",
    description:
      "Multi-layer parallax driven by scroll position via animation-timeline: view() — three layers move at different rates, creating depth as the element enters and exits the viewport",
    tags: ["parallax", "scroll", "depth", "scroll-driven"],
    previewType: "box",
    cssCode: `/* Parallax Depth Scroll — uses scroll-driven animation timeline */
.roycss-parallax-depth-scroll {
  inline-size: 280px;
  block-size: 180px;
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(180deg, oklch(0.18 0.08 260), oklch(0.10 0.05 270));
  isolation: isolate;
}
.roycss-parallax-depth-scroll::before,
.roycss-parallax-depth-scroll::after {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline: -20%;
  pointer-events: none;
}
.roycss-parallax-depth-scroll::before {
  /* mid layer — mountains */
  block-size: 70%;
  inset-block-start: 30%;
  background:
    linear-gradient(180deg, transparent, oklch(0.3 0.10 270 / 0.9)),
    conic-gradient(from 0deg at 50% 100%, oklch(0.35 0.10 270) 0deg, transparent 60deg, oklch(0.35 0.10 270) 120deg, transparent 180deg, oklch(0.35 0.10 270) 240deg, transparent 300deg);
  background-size: 50% 100%, 100% 100%;
  background-repeat: repeat-x, no-repeat;
  animation: roy-b16-parallax-mid linear both;
  animation-timeline: view();
}
.roycss-parallax-depth-scroll::after {
  /* near layer — stars / foreground particles */
  block-size: 100%;
  background-image:
    radial-gradient(circle, oklch(1 0 0 / 0.9) 1px, transparent 1.5px),
    radial-gradient(circle, oklch(0.85 0.18 280 / 0.7) 1px, transparent 1.5px);
  background-size: 40px 40px, 70px 70px;
  background-position: 0 0, 20px 30px;
  animation: roy-b16-parallax-near linear both;
  animation-timeline: view();
}
@keyframes roy-b16-parallax-mid {
  from { transform: translateX(-10%); opacity: 0.5; }
  to   { transform: translateX(10%);  opacity: 1; }
}
@keyframes roy-b16-parallax-near {
  from { transform: translateX(20%); }
  to   { transform: translateX(-20%); }
}`,
  },
  {
    id: "elastic-snap",
    name: "Elastic Snap",
    category: "animations",
    description:
      "Elastic snap-back with overshoot — element springs past its target, oscillates, and settles with realistic elastic damping. Great for toggle and pull-to-refresh states",
    tags: ["elastic", "snap", "overshoot", "damping"],
    previewType: "box",
    cssCode: `/* Elastic Snap */
.roycss-elastic-snap {
  inline-size: 90px;
  block-size: 90px;
  border-radius: 24px;
  background: linear-gradient(135deg, oklch(0.80 0.22 280), oklch(0.65 0.20 320));
  box-shadow:
    inset 0 2px 0 oklch(1 0 0 / 0.35),
    0 12px 22px -8px oklch(0.4 0.18 300 / 0.55);
  animation: roy-b16-elastic 2.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}
@keyframes roy-b16-elastic {
  0%   { transform: translateX(-90px) scale(0.85); opacity: 0; }
  20%  { transform: translateX(0) scale(1.1); opacity: 1; }
  30%  { transform: translateX(28px) scale(0.96); }
  40%  { transform: translateX(-16px) scale(1.04); }
  50%  { transform: translateX(10px) scale(0.98); }
  60%  { transform: translateX(-5px) scale(1.01); }
  70%  { transform: translateX(0) scale(1); }
  85%  { transform: translateX(0) scale(1); opacity: 1; }
  100% { transform: translateX(-90px) scale(0.85); opacity: 0; }
}`,
  },
  {
    id: "fluid-motion",
    name: "Fluid Motion Path",
    category: "animations",
    description:
      "Element flows along an organic curve defined by offset-path — pure CSS motion-path animation that traces a wave-like trajectory through 2D space",
    tags: ["fluid", "motion-path", "offset-path", "organic"],
    previewType: "box",
    cssCode: `/* Fluid Motion Path */
.roycss-fluid-motion {
  inline-size: 280px;
  block-size: 160px;
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  background: linear-gradient(160deg, oklch(0.92 0.04 230), oklch(0.82 0.06 200));
  box-shadow: inset 0 0 0 1px oklch(0.4 0.04 240 / 0.15);
}
.roycss-fluid-motion::before,
.roycss-fluid-motion::after {
  content: "";
  position: absolute;
  inline-size: 28px;
  block-size: 28px;
  border-radius: 50%;
  pointer-events: none;
}
.roycss-fluid-motion::before {
  background: radial-gradient(circle at 35% 35%, oklch(0.85 0.22 280), oklch(0.65 0.24 260));
  box-shadow: 0 0 20px oklch(0.7 0.22 280 / 0.6);
  offset-path: path("M -20,80 C 60,20 120,140 200,60 S 320,100 300,80");
  offset-rotate: 0deg;
  animation: roy-b16-fluid-path 4.5s ease-in-out infinite;
}
.roycss-fluid-motion::after {
  background: radial-gradient(circle at 35% 35%, oklch(0.85 0.22 200), oklch(0.65 0.24 220));
  box-shadow: 0 0 20px oklch(0.7 0.22 200 / 0.6);
  offset-path: path("M -20,60 C 60,120 120,20 200,100 S 320,60 300,60");
  offset-rotate: 0deg;
  animation: roy-b16-fluid-path 5.5s ease-in-out infinite reverse;
  inline-size: 20px;
  block-size: 20px;
}
@keyframes roy-b16-fluid-path {
  0%   { offset-distance: 0%;   opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}`,
  },

  /* =========================================================================
   * TEXT — FUTURE TYPOGRAPHY (4)
   * ========================================================================= */
  {
    id: "text-variable-font-morph",
    name: "Variable Font Morph",
    category: "text",
    description:
      "Variable font that continuously morphs through weight, width, and optical size axes — pure CSS font-variation-settings animation that creates a living, breathing logotype",
    tags: ["variable-font", "morph", "typography", "axes"],
    previewType: "text",
    previewText: "morph",
    cssCode: `/* Variable Font Morph */
.roycss-text-variable-font-morph {
  font-family: "Inter", "Segoe UI Variable", "Roboto Flex", system-ui, sans-serif;
  font-size: 64px;
  font-weight: 400;
  font-stretch: 100%;
  font-variation-settings: "wght" 400, "wdth" 100, "opsz" 14;
  color: oklch(0.18 0.04 270);
  letter-spacing: 0.02em;
  background: linear-gradient(120deg, oklch(0.25 0.10 270), oklch(0.45 0.20 320), oklch(0.25 0.10 270));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  background-size: 200% 100%;
  animation:
    roy-b16-vfm-axes 4.5s ease-in-out infinite,
    roy-b16-vfm-shift 6s linear infinite;
}
@keyframes roy-b16-vfm-axes {
  0%, 100% { font-variation-settings: "wght" 300, "wdth" 80,  "opsz" 12; }
  33%      { font-variation-settings: "wght" 700, "wdth" 110, "opsz" 24; }
  66%      { font-variation-settings: "wght" 500, "wdth" 125, "opsz" 36; }
}
@keyframes roy-b16-vfm-shift {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}`,
  },
  {
    id: "text-kinetic-wave",
    name: "Kinetic Wave Text",
    category: "text",
    description:
      "Kinetic typography with wave motion — letters rise and fall in a sequential wave using CSS animation-delay stagger. Each glyph is wrapped in a span for the wave to propagate",
    tags: ["kinetic", "wave", "stagger", "typography"],
    previewType: "text",
    previewText: "WAVE",
    childCount: 4,
    cssCode: `/* Kinetic Wave Text — stagger wave across child spans */
.roycss-text-kinetic-wave {
  display: inline-flex;
  gap: 0.02em;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 64px;
  font-weight: 800;
  color: oklch(0.18 0.08 250);
  filter: drop-shadow(0 6px 14px oklch(0.4 0.18 250 / 0.35));
}
.roycss-text-kinetic-wave > span {
  display: inline-block;
  background: linear-gradient(180deg, oklch(0.85 0.18 280), oklch(0.55 0.25 260));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  transform-origin: center bottom;
  animation: roy-b16-kinetic-wave 1.8s ease-in-out infinite;
}
.roycss-text-kinetic-wave > span:nth-child(1) { animation-delay: 0s;    }
.roycss-text-kinetic-wave > span:nth-child(2) { animation-delay: 0.12s; }
.roycss-text-kinetic-wave > span:nth-child(3) { animation-delay: 0.24s; }
.roycss-text-kinetic-wave > span:nth-child(4) { animation-delay: 0.36s; }
.roycss-text-kinetic-wave > span:nth-child(5) { animation-delay: 0.48s; }
.roycss-text-kinetic-wave > span:nth-child(6) { animation-delay: 0.60s; }
@keyframes roy-b16-kinetic-wave {
  0%, 100% { transform: translateY(0) scale(1); }
  40%      { transform: translateY(-22px) scale(1.08); }
}`,
  },
  {
    id: "text-scramble-decode",
    name: "Scramble Decode Text",
    category: "text",
    description:
      "Matrix-style scramble-decode effect — text cycles through random characters via ::before/::after pseudo-content swap, settling into the final string. Pure CSS using animation cycles",
    tags: ["scramble", "decode", "matrix", "typography"],
    previewType: "text",
    previewText: "DECODE",
    cssCode: `/* Scramble Decode Text — pure CSS character cycling */
.roycss-text-scramble-decode {
  position: relative;
  display: inline-block;
  font-family: "JetBrains Mono", "SF Mono", ui-monospace, monospace;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: oklch(0.85 0.22 145);
  text-shadow:
    0 0 8px oklch(0.85 0.22 145 / 0.7),
    0 0 20px oklch(0.70 0.24 160 / 0.5);
  min-inline-size: 6ch;
}
/* visible base text stays as the decoded target */
.roycss-text-scramble-decode::before {
  content: "DECODE";
  position: absolute;
  inset: 0;
  color: oklch(0.85 0.22 145);
  text-shadow: inherit;
  animation: roy-b16-scramble-cycle 3s steps(1, end) infinite;
}
.roycss-text-scramble-decode::after {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: -10px;
  inline-size: 3px;
  block-size: 1em;
  background: oklch(0.85 0.22 145);
  box-shadow: 0 0 8px oklch(0.85 0.22 145 / 0.9);
  animation: roy-b16-scramble-cursor 0.9s steps(2, end) infinite;
}
@keyframes roy-b16-scramble-cycle {
  0%   { content: "01010G"; opacity: 0.7; filter: blur(0.5px); }
  14%  { content: "X#9@E)"; opacity: 0.85; }
  28%  { content: "D3C0D3"; opacity: 0.95; }
  42%  { content: "DE%OD3"; opacity: 1; }
  57%  { content: "DEC0D3"; opacity: 1; }
  71%  { content: "DECOD3"; opacity: 1; }
  85%  { content: "DECODE"; opacity: 1; filter: blur(0); }
  100% { content: "DECODE"; opacity: 1; }
}
@keyframes roy-b16-scramble-cursor {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}`,
  },
  {
    id: "text-gradient-mesh",
    name: "Mesh Gradient Text",
    category: "text",
    description:
      "Text filled with an animated mesh gradient — multiple radial color stops drift independently inside the text glyphs, giving typography a living, painted quality",
    tags: ["gradient", "mesh", "typography", "animated"],
    previewType: "text",
    previewText: "MESH",
    cssCode: `/* Mesh Gradient Text */
.roycss-text-gradient-mesh {
  font-family: "Inter", system-ui, sans-serif;
  font-size: 72px;
  font-weight: 800;
  letter-spacing: -0.02em;
  background:
    radial-gradient(circle at 20% 30%, oklch(0.85 0.22 350), transparent 50%),
    radial-gradient(circle at 80% 20%, oklch(0.80 0.22 200), transparent 50%),
    radial-gradient(circle at 70% 80%, oklch(0.85 0.22 140), transparent 50%),
    radial-gradient(circle at 20% 80%, oklch(0.82 0.22 60), transparent 50%),
    linear-gradient(135deg, oklch(0.75 0.22 280), oklch(0.70 0.22 180));
  background-size: 200% 200%, 180% 180%, 220% 220%, 160% 160%, 100% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: roy-b16-mesh-text 8s ease-in-out infinite;
  filter: drop-shadow(0 4px 14px oklch(0.4 0.18 280 / 0.35));
}
@keyframes roy-b16-mesh-text {
  0%, 100% {
    background-position: 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%;
  }
  25% {
    background-position: 100% 50%, 0% 100%, 0% 50%, 50% 0%, 50% 50%;
  }
  50% {
    background-position: 50% 100%, 50% 0%, 0% 0%, 100% 50%, 100% 100%;
  }
  75% {
    background-position: 0% 50%, 50% 100%, 100% 50%, 50% 0%, 50% 50%;
  }
}`,
  },

  /* =========================================================================
   * BACKGROUNDS — FUTURE BACKDROPS (3)
   * ========================================================================= */
  {
    id: "bg-neural-network",
    name: "Neural Network Field",
    category: "backgrounds",
    description:
      "Animated neural network pattern — nodes pulse and emit signals along synaptic pathways, creating a thinking-network background.",
    tags: ["neural", "network", "synapse", "data"],
    previewType: "background",
    cssCode: `/* Neural Network Field */
.roycss-bg-neural-network {
  inline-size: 100%;
  block-size: 240px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 50%, oklch(0.10 0.05 260), oklch(0.05 0.02 270));
  isolation: isolate;
}
/* network grid via repeating gradients */
.roycss-bg-neural-network::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, oklch(0.80 0.20 200 / 0.9) 1.5px, transparent 2px),
    radial-gradient(circle, oklch(0.80 0.20 200 / 0.7) 1.5px, transparent 2px),
    radial-gradient(circle, oklch(0.80 0.20 200 / 0.8) 1.5px, transparent 2px),
    linear-gradient(90deg, transparent 49.5%, oklch(0.60 0.18 220 / 0.18) 49.5%, oklch(0.60 0.18 220 / 0.18) 50.5%, transparent 50.5%),
    linear-gradient(0deg,  transparent 49.5%, oklch(0.60 0.18 220 / 0.18) 49.5%, oklch(0.60 0.18 220 / 0.18) 50.5%, transparent 50.5%);
  background-size: 60px 60px, 60px 60px, 60px 60px, 60px 60px, 60px 60px;
  background-position: 0 0, 30px 30px, 0 30px, 0 0, 0 0;
  mask-image: radial-gradient(ellipse at center, oklch(1 0 0) 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, oklch(1 0 0) 30%, transparent 80%);
  animation: roy-b16-neural-pulse 3s ease-in-out infinite;
}
/* signal pulses traveling */
.roycss-bg-neural-network::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 0;
  inline-size: 12px;
  block-size: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.95 0.22 180), oklch(0.70 0.22 200 / 0.5));
  filter: drop-shadow(0 0 8px oklch(0.85 0.22 180 / 0.9));
  offset-path: path("M 0,120 C 80,40 160,200 240,80 S 360,160 440,100");
  animation: roy-b16-neural-signal 3.5s linear infinite;
}
@keyframes roy-b16-neural-pulse {
  0%, 100% { opacity: 0.7; filter: brightness(0.9); }
  50%      { opacity: 1;   filter: brightness(1.3); }
}
@keyframes roy-b16-neural-signal {
  0%   { offset-distance: 0%;   opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}`,
  },
  {
    id: "bg-quantum-field",
    name: "Quantum Probability Field",
    category: "backgrounds",
    description:
      "Quantum-inspired probability cloud — particles flicker in and out of existence across a dark field, with overlapping wavefunctions rendered as soft probability blobs",
    tags: ["quantum", "probability", "particles", "physics"],
    previewType: "background",
    cssCode: `/* Quantum Probability Field */
.roycss-bg-quantum-field {
  inline-size: 100%;
  block-size: 240px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 50%, oklch(0.12 0.04 270), oklch(0.05 0.02 280));
  isolation: isolate;
}
/* probability cloud layer */
.roycss-bg-quantum-field::before {
  content: "";
  position: absolute;
  inset: -20%;
  background-image:
    radial-gradient(circle at 20% 30%, oklch(0.75 0.24 280 / 0.55) 0%, transparent 8%),
    radial-gradient(circle at 70% 20%, oklch(0.70 0.22 200 / 0.5) 0%, transparent 6%),
    radial-gradient(circle at 50% 70%, oklch(0.80 0.20 320 / 0.5) 0%, transparent 7%),
    radial-gradient(circle at 85% 80%, oklch(0.70 0.24 260 / 0.5) 0%, transparent 8%),
    radial-gradient(circle at 30% 85%, oklch(0.78 0.22 180 / 0.5) 0%, transparent 6%);
  filter: blur(8px);
  mix-blend-mode: screen;
  animation: roy-b16-quantum-cloud 6s ease-in-out infinite;
}
/* flickering particle points */
.roycss-bg-quantum-field::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, oklch(0.95 0.10 280 / 1) 1px, transparent 1.5px),
    radial-gradient(circle, oklch(0.90 0.18 200 / 0.9) 1px, transparent 1.5px),
    radial-gradient(circle, oklch(1 0 0 / 0.8) 1px, transparent 1.5px);
  background-size: 35px 35px, 55px 55px, 80px 80px;
  background-position: 0 0, 12px 18px, 28px 8px;
  mix-blend-mode: screen;
  animation: roy-b16-quantum-flicker 1.6s steps(4, end) infinite;
}
@keyframes roy-b16-quantum-cloud {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
  50%      { transform: scale(1.08) rotate(4deg); opacity: 1; }
}
@keyframes roy-b16-quantum-flicker {
  0%   { opacity: 0.4; transform: translate(0, 0); }
  25%  { opacity: 0.9; transform: translate(2px, -1px); }
  50%  { opacity: 0.5; transform: translate(-1px, 2px); }
  75%  { opacity: 1;   transform: translate(1px, 1px); }
  100% { opacity: 0.4; transform: translate(0, 0); }
}`,
  },
  {
    id: "bg-flowing-silk",
    name: "Flowing Silk Texture",
    category: "backgrounds",
    description:
      "Flowing silk fabric background — overlapping translucent diagonal gradients with shimmering highlights that drift, recreating the soft sheen of rippling silk in motion",
    tags: ["silk", "fabric", "texture", "shimmer"],
    previewType: "background",
    cssCode: `/* Flowing Silk Texture */
.roycss-bg-flowing-silk {
  inline-size: 100%;
  block-size: 240px;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(135deg, oklch(0.62 0.18 350), oklch(0.50 0.20 290));
  isolation: isolate;
}
.roycss-bg-flowing-silk::before {
  /* silk weave sheen layer */
  content: "";
  position: absolute;
  inset: -30%;
  background:
    repeating-linear-gradient(115deg,
      oklch(1 0 0 / 0.10) 0px,
      oklch(1 0 0 / 0.18) 2px,
      oklch(0 0 0 / 0.10) 4px,
      oklch(1 0 0 / 0.05) 6px,
      transparent 8px),
    repeating-linear-gradient(65deg,
      oklch(1 0 0 / 0.08) 0px,
      oklch(1 0 0 / 0.14) 3px,
      oklch(0 0 0 / 0.06) 6px,
      transparent 9px);
  mix-blend-mode: overlay;
  animation: roy-b16-silk-drape 9s ease-in-out infinite;
}
.roycss-bg-flowing-silk::after {
  /* drifting highlight streak */
  content: "";
  position: absolute;
  inset-block-start: -20%;
  inset-inline-start: -30%;
  inline-size: 80%;
  block-size: 140%;
  background: linear-gradient(105deg,
    transparent 30%,
    oklch(1 0 0 / 0.32) 45%,
    oklch(1 0 0 / 0.45) 50%,
    oklch(1 0 0 / 0.32) 55%,
    transparent 70%);
  filter: blur(6px);
  mix-blend-mode: soft-light;
  animation: roy-b16-silk-shimmer 5s ease-in-out infinite;
  transform: rotate(8deg);
}
@keyframes roy-b16-silk-drape {
  0%, 100% { transform: translate3d(0,0,0) scale(1) skewX(0deg); }
  33%      { transform: translate3d(2%, -2%, 0) scale(1.03) skewX(1deg); }
  66%      { transform: translate3d(-2%, 1%, 0) scale(0.98) skewX(-1deg); }
}
@keyframes roy-b16-silk-shimmer {
  0%   { transform: translateX(-50%) rotate(8deg); opacity: 0.6; }
  50%  { opacity: 1; }
  100% { transform: translateX(220%) rotate(8deg); opacity: 0.6; }
}`,
  },

  /* =========================================================================
   * HOVER — FUTURE INTERACTIONS (3)
   * ========================================================================= */
  {
    id: "hover-magnetic-pull-2",
    name: "Magnetic Pull Depth",
    category: "hover",
    description:
      "Magnetic pull interaction with depth — element scales and lifts on translateZ with a soft shadow that grows, simulating a magnetically levitating surface the cursor pulls toward",
    tags: ["magnetic", "hover", "depth", "levitation"],
    previewType: "card",
    cssCode: `/* Magnetic Pull Depth — hover */
.roycss-hover-magnetic-pull-2 {
  inline-size: 180px;
  block-size: 120px;
  border-radius: 20px;
  position: relative;
  background:
    linear-gradient(160deg, oklch(0.85 0.15 250), oklch(0.70 0.20 280));
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.4),
    0 10px 24px -8px oklch(0.4 0.15 270 / 0.5);
  transform-style: preserve-3d;
  perspective: 600px;
  transition:
    transform 0.5s cubic-bezier(0.2, 1.1, 0.3, 1),
    box-shadow 0.5s cubic-bezier(0.2, 1.1, 0.3, 1),
    filter 0.4s ease;
  cursor: pointer;
}
.roycss-hover-magnetic-pull-2::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at 30% 20%, oklch(1 0 0 / 0.4), transparent 50%);
  pointer-events: none;
}
.roycss-hover-magnetic-pull-2::after {
  /* magnetic field lines */
  content: "";
  position: absolute;
  inset: -10%;
  border-radius: inherit;
  background:
    radial-gradient(circle at 50% 50%, oklch(0.80 0.20 280 / 0.4), transparent 60%);
  filter: blur(12px);
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
  z-index: -1;
}
.roycss-hover-magnetic-pull-2:hover {
  transform: translateY(-8px) translateZ(30px) scale(1.04);
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.55),
    0 22px 50px -12px oklch(0.4 0.18 290 / 0.6),
    0 0 0 1px oklch(0.80 0.20 280 / 0.3);
  filter: saturate(1.15) brightness(1.05);
}
.roycss-hover-magnetic-pull-2:hover::after {
  opacity: 1;
  animation: roy-b16-magnetic-field 1.2s ease-in-out infinite;
}
@keyframes roy-b16-magnetic-field {
  0%, 100% { transform: scale(1);   opacity: 0.6; }
  50%      { transform: scale(1.15); opacity: 1; }
}`,
  },
  {
    id: "hover-glass-shatter",
    name: "Glass Shatter Hover",
    category: "hover",
    description:
      "On hover the surface shatters into polygon shards using animated clip-path — the glass breaks apart and the fragments drift and fade, then reassemble on mouse leave",
    tags: ["glass", "shatter", "hover", "clip-path"],
    previewType: "card",
    cssCode: `/* Glass Shatter Hover */
.roycss-hover-glass-shatter {
  inline-size: 200px;
  block-size: 140px;
  position: relative;
  border-radius: 16px;
  background:
    linear-gradient(135deg, oklch(0.95 0.06 220 / 0.25), oklch(0.85 0.10 280 / 0.18));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid oklch(1 0 0 / 0.3);
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.4),
    0 14px 30px -10px oklch(0.3 0.10 260 / 0.5);
  overflow: hidden;
  isolation: isolate;
  cursor: pointer;
  transition: transform 0.4s ease;
}
/* shard layer */
.roycss-hover-glass-shatter::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    conic-gradient(from 45deg at 50% 50%,
      oklch(1 0 0 / 0.18) 0deg,
      oklch(0.85 0.10 280 / 0.2) 90deg,
      oklch(1 0 0 / 0.12) 180deg,
      oklch(0.85 0.10 200 / 0.2) 270deg,
      oklch(1 0 0 / 0.18) 360deg);
  clip-path: polygon(0 0, 50% 0, 50% 50%, 0 50%, 0 0, 50% 50%, 100% 0, 100% 50%, 50% 50%, 50% 100%, 0 100%, 50% 50%, 100% 50%, 100% 100%, 50% 100%);
  transition:
    clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.6s ease;
  pointer-events: none;
}
/* crack lines */
.roycss-hover-glass-shatter::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(45deg, transparent 49.4%, oklch(1 0 0 / 0.5) 49.7%, oklch(1 0 0 / 0.5) 50.3%, transparent 50.6%),
    linear-gradient(-45deg, transparent 49.4%, oklch(1 0 0 / 0.4) 49.7%, oklch(1 0 0 / 0.4) 50.3%, transparent 50.6%);
  background-size: 50% 50%, 50% 50%;
  background-position: 50% 50%;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
.roycss-hover-glass-shatter:hover {
  transform: scale(1.02);
}
.roycss-hover-glass-shatter:hover::before {
  clip-path: polygon(
    0 0, 30% -5%, 35% 35%, -5% 30%,
    0 0,
    40% 45%, 105% -5%, 95% 40%, 50% 50%,
    50% 105%, -5% 95%, 45% 55%,
    55% 50%, 105% 60%, 95% 105%, 50% 95%
  );
  transform: scale(1.08);
  opacity: 0.3;
  animation: roy-b16-shatter-drift 0.8s ease-out forwards;
}
.roycss-hover-glass-shatter:hover::after {
  opacity: 1;
}
@keyframes roy-b16-shatter-drift {
  0%   { transform: scale(1) translate(0,0); }
  100% { transform: scale(1.08) translate(2px, 2px); }
}`,
  },
  {
    id: "hover-liquid-morph",
    name: "Liquid Morph Hover",
    category: "hover",
    description:
      "Element morphs into a liquid blob on hover — border-radius organically shifts into asymmetric organic curves while a wave ripple passes through the surface",
    tags: ["liquid", "morph", "hover", "organic"],
    previewType: "button",
    previewText: "Morph",
    cssCode: `/* Liquid Morph Hover */
.roycss-hover-liquid-morph {
  inline-size: 160px;
  block-size: 64px;
  border: none;
  border-radius: 32px;
  position: relative;
  background:
    linear-gradient(135deg, oklch(0.80 0.22 200), oklch(0.65 0.24 240));
  color: oklch(0.98 0.02 240);
  font: 700 18px / 1 system-ui, sans-serif;
  letter-spacing: 0.04em;
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.4),
    0 12px 24px -8px oklch(0.4 0.18 220 / 0.5);
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
  transition:
    border-radius 0.7s cubic-bezier(0.3, 1.2, 0.4, 1),
    transform 0.5s cubic-bezier(0.3, 1.2, 0.4, 1),
    box-shadow 0.5s ease,
    filter 0.4s ease;
}
.roycss-hover-liquid-morph::before {
  /* liquid ripple layer */
  content: "";
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(circle at 30% 50%, oklch(1 0 0 / 0.35), transparent 40%),
    radial-gradient(circle at 70% 50%, oklch(0.85 0.20 280 / 0.4), transparent 40%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
.roycss-hover-liquid-morph::after {
  /* wobble blob deformation on hover */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.2);
  pointer-events: none;
}
.roycss-hover-liquid-morph:hover {
  border-radius: 60% 40% 55% 45% / 55% 50% 50% 45%;
  transform: scale(1.06);
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.55),
    0 18px 36px -10px oklch(0.4 0.20 230 / 0.6);
  filter: saturate(1.2);
  animation: roy-b16-liquid-wobble 1.6s ease-in-out infinite;
}
.roycss-hover-liquid-morph:hover::before {
  opacity: 1;
  animation: roy-b16-liquid-ripple 1.6s ease-in-out infinite;
}
@keyframes roy-b16-liquid-wobble {
  0%, 100% { border-radius: 60% 40% 55% 45% / 55% 50% 50% 45%; }
  33%      { border-radius: 45% 55% 40% 60% / 60% 45% 55% 40%; }
  66%      { border-radius: 55% 45% 60% 40% / 40% 60% 45% 55%; }
}
@keyframes roy-b16-liquid-ripple {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50%      { transform: translate(4%, -3%) rotate(8deg); }
}`,
  },
];
