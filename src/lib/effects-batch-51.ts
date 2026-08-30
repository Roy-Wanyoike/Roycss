import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 51 — VFX: Background + Glass + Border Effects (30 effects)
 *
 * 12 background effects, 10 glass/modern UI effects, 8 border effects — all
 * GPU-friendly, OKLCH-coloured, and accessibility-aware (every effect honors
 * `prefers-reduced-motion`).
 *
 * Conventions:
 *   • Every class is prefixed `roycss-`
 *   • Every @keyframes symbol is prefixed `roy-vfx-` and namespaced by family
 *     (`roy-vfx-bg-*` for backgrounds, `roy-vfx-glass-*` for glass-ui,
 *     `roy-vfx-bd-*` for borders) — no collisions with prior batches.
 *   • Colors use the OKLCH color space (with `color-mix(in oklch, …)` where
 *     blending is required).
 *   • Animations favor GPU-friendly properties (transform, opacity, filter,
 *     clip-path, background-position) over layout-triggering properties.
 *   • No JavaScript, no external dependencies — pure CSS only.
 *
 * NOTE on IDs: `vfx-electric-border` and `vfx-laser-border` already exist in
 * batch-52 under the `visual` category. To preserve the constraint of no
 * duplicate IDs across the corpus (and to keep batch-52 untouched), the two
 * border effects in this batch use the `-2` suffix: `vfx-electric-border-2`
 * and `vfx-laser-border-2`. This matches the existing `-2` suffix pattern
 * used elsewhere in this batch (`vfx-frosted-glass-2`, `vfx-neon-glass-2`,
 * `vfx-holographic-card-2`, `vfx-gradient-border-2`, `vfx-glow-border-2`,
 * `vfx-animated-border-2`).
 */
export const effectsBatch51: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // BACKGROUND EFFECTS (12) — category: "backgrounds"
  // ═══════════════════════════════════════════════════════════════

  // 1. vfx-animated-gradient-bg
  {
    id: "vfx-animated-gradient-bg",
    name: "VFX Animated Gradient Background",
    category: "backgrounds",
    description:
      "Flowing OKLCH gradient background that pans continuously via background-position. Sized at 200% so the sweep never seams.",
    tags: ["background", "gradient", "animated", "oklch", "sweep", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Animated Gradient Background */
.roycss-vfx-animated-gradient-bg {
  background:
    linear-gradient(
      135deg,
      oklch(0.72 0.22 35) 0%,
      oklch(0.70 0.20 290) 25%,
      oklch(0.74 0.18 195) 50%,
      oklch(0.72 0.22 145) 75%,
      oklch(0.72 0.22 35) 100%
    );
  background-size: 200% 200%;
  background-position: 0% 0%;
  animation: roy-vfx-bg-gradient-shift 8s ease-in-out infinite;
}
@keyframes roy-vfx-bg-gradient-shift {
  0%   { background-position: 0% 0%; }
  25%  { background-position: 100% 0%; }
  50%  { background-position: 100% 100%; }
  75%  { background-position: 0% 100%; }
  100% { background-position: 0% 0%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-animated-gradient-bg { animation: none; }
}`,
  },

  // 2. vfx-aurora-bg
  {
    id: "vfx-aurora-bg",
    name: "VFX Aurora Background",
    category: "backgrounds",
    description:
      "Aurora borealis with three blurred OKLCH gradient layers drifting at different speeds. Pure backdrop-filter-free blend.",
    tags: ["background", "aurora", "blur", "gradient", "drift", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Aurora Background */
.roycss-vfx-aurora-bg {
  position: relative;
  background: oklch(0.10 0.04 250);
  overflow: hidden;
}
.roycss-vfx-aurora-bg::before,
.roycss-vfx-aurora-bg::after,
.roycss-vfx-aurora-bg > .roycss-vfx-aurora-layer {
  content: "";
  position: absolute;
  inset: -25%;
  pointer-events: none;
  filter: blur(48px);
  opacity: 0.7;
  mix-blend-mode: screen;
}
.roycss-vfx-aurora-bg::before {
  background:
    radial-gradient(closest-side, oklch(0.72 0.24 195), transparent 70%);
  animation: roy-vfx-bg-aurora-1 14s ease-in-out infinite;
}
.roycss-vfx-aurora-bg::after {
  background:
    radial-gradient(closest-side, oklch(0.72 0.24 145), transparent 70%);
  animation: roy-vfx-bg-aurora-2 18s ease-in-out infinite;
}
.roycss-vfx-aurora-bg > .roycss-vfx-aurora-layer {
  background:
    radial-gradient(closest-side, oklch(0.70 0.24 290), transparent 70%);
  animation: roy-vfx-bg-aurora-3 22s ease-in-out infinite;
}
@keyframes roy-vfx-bg-aurora-1 {
  0%, 100% { transform: translate(-12%, -8%) scale(1); }
  50%      { transform: translate(20%, 18%)  scale(1.18); }
}
@keyframes roy-vfx-bg-aurora-2 {
  0%, 100% { transform: translate(15%, 12%)  scale(1.1); }
  50%      { transform: translate(-18%, -10%) scale(0.9); }
}
@keyframes roy-vfx-bg-aurora-3 {
  0%, 100% { transform: translate(-6%, 14%)  scale(1.05); }
  50%      { transform: translate(10%, -16%) scale(1.22); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-aurora-bg::before,
  .roycss-vfx-aurora-bg::after,
  .roycss-vfx-aurora-bg > .roycss-vfx-aurora-layer { animation: none; }
}`,
  },

  // 3. vfx-mesh-gradient-bg
  {
    id: "vfx-mesh-gradient-bg",
    name: "VFX Mesh Gradient Background",
    category: "backgrounds",
    description:
      "Mesh gradient built from 4 OKLCH radial gradients layered with screen blending. Soft, painterly, and GPU-friendly.",
    tags: ["background", "mesh", "gradient", "radial", "screen-blend", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Mesh Gradient Background */
.roycss-vfx-mesh-gradient-bg {
  background-color: oklch(0.18 0.06 290);
  background-image:
    radial-gradient(at 18% 22%, oklch(0.72 0.24 35)   0px, transparent 50%),
    radial-gradient(at 82% 18%, oklch(0.72 0.24 195)  0px, transparent 50%),
    radial-gradient(at 22% 82%, oklch(0.72 0.24 290)  0px, transparent 50%),
    radial-gradient(at 80% 84%, oklch(0.72 0.24 145)  0px, transparent 50%);
  background-blend-mode: screen, screen, screen, screen;
  background-size: 200% 200%;
  animation: roy-vfx-bg-mesh-shift 18s ease-in-out infinite;
}
@keyframes roy-vfx-bg-mesh-shift {
  0%   { background-position: 0% 0%, 100% 0%, 0% 100%, 100% 100%; }
  50%  { background-position: 20% 30%, 80% 20%, 30% 80%, 70% 70%; }
  100% { background-position: 0% 0%, 100% 0%, 0% 100%, 100% 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-mesh-gradient-bg { animation: none; }
}`,
  },

  // 4. vfx-gradient-blob-anim
  {
    id: "vfx-gradient-blob-anim",
    name: "VFX Gradient Blob Morph",
    category: "backgrounds",
    description:
      "Animated gradient blob that morphs its border-radius and translates softly — a liquid gradient that never sits still.",
    tags: ["background", "blob", "gradient", "morph", "border-radius", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Gradient Blob Morph */
.roycss-vfx-gradient-blob-anim {
  position: relative;
  background:
    linear-gradient(
      135deg,
      oklch(0.72 0.22 195) 0%,
      oklch(0.72 0.24 290) 50%,
      oklch(0.72 0.22 35) 100%
    );
  border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%;
  filter: blur(2px);
  animation: roy-vfx-bg-blob-morph 12s ease-in-out infinite;
}
@keyframes roy-vfx-bg-blob-morph {
  0%, 100% {
    border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%;
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    border-radius: 58% 42% 38% 62% / 63% 37% 63% 37%;
    transform: translate(4%, -6%) rotate(120deg);
  }
  66% {
    border-radius: 37% 63% 56% 44% / 47% 52% 48% 53%;
    transform: translate(-4%, 5%) rotate(240deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-gradient-blob-anim { animation: none; }
}`,
  },

  // 5. vfx-moving-blob
  {
    id: "vfx-moving-blob",
    name: "VFX Moving Blob",
    category: "backgrounds",
    description:
      "A solid OKLCH blob that travels along a figure-eight path with scale breathing. Great for hero sections behind content.",
    tags: ["background", "blob", "moving", "transform", "path", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Moving Blob */
.roycss-vfx-moving-blob {
  position: relative;
  background: oklch(0.18 0.04 250);
  overflow: hidden;
}
.roycss-vfx-moving-blob::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40%;
  aspect-ratio: 1 / 1;
  background:
    radial-gradient(closest-side, oklch(0.78 0.22 35), transparent 70%);
  border-radius: 50%;
  filter: blur(20px);
  transform: translate(-50%, -50%);
  animation: roy-vfx-bg-blob-move 14s linear infinite;
  pointer-events: none;
}
@keyframes roy-vfx-bg-blob-move {
  0%   { transform: translate(-120%, -50%) scale(1); }
  25%  { transform: translate(-20%, -150%) scale(1.15); }
  50%  { transform: translate(80%, -50%)  scale(0.9); }
  75%  { transform: translate(-20%, 50%)  scale(1.1); }
  100% { transform: translate(-120%, -50%) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-moving-blob::before { animation: none; }
}`,
  },

  // 6. vfx-noise-grain
  {
    id: "vfx-noise-grain",
    name: "VFX Noise Grain Overlay",
    category: "backgrounds",
    description:
      "Animated film-grain overlay using an inline SVG fractal-noise data URI. Adds organic texture without an external image asset.",
    tags: ["background", "noise", "grain", "svg", "overlay", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Noise Grain Overlay */
.roycss-vfx-noise-grain {
  position: relative;
  background: oklch(0.18 0.04 250);
}
.roycss-vfx-noise-grain::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.18;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>");
  background-repeat: repeat;
  animation: roy-vfx-bg-grain 0.6s steps(6, end) infinite;
}
@keyframes roy-vfx-bg-grain {
  0%   { transform: translate(0, 0); }
  16%  { transform: translate(-5%, 3%); }
  33%  { transform: translate(4%, -4%); }
  50%  { transform: translate(-3%, 5%); }
  66%  { transform: translate(5%, 2%); }
  83%  { transform: translate(-4%, -3%); }
  100% { transform: translate(0, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-noise-grain::after { animation: none; opacity: 0.12; }
}`,
  },

  // 7. vfx-grid-bg-anim
  {
    id: "vfx-grid-bg-anim",
    name: "VFX Animated Perspective Grid",
    category: "backgrounds",
    description:
      "Perspective grid that pans toward the viewer — synthwave horizon feel. Built from repeating-linear-gradient lines and a transform on a wrapper.",
    tags: ["background", "grid", "perspective", "synthwave", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Animated Perspective Grid */
.roycss-vfx-grid-bg-anim {
  position: relative;
  background: oklch(0.10 0.06 290);
  overflow: hidden;
  perspective: 400px;
}
.roycss-vfx-grid-bg-anim::before {
  content: "";
  position: absolute;
  inset: -50% 0 0 0;
  background-image:
    repeating-linear-gradient(0deg,
      transparent 0,
      transparent 38px,
      oklch(0.78 0.20 195 / 0.55) 38px,
      oklch(0.78 0.20 195 / 0.55) 40px),
    repeating-linear-gradient(90deg,
      transparent 0,
      transparent 38px,
      oklch(0.78 0.20 195 / 0.35) 38px,
      oklch(0.78 0.20 195 / 0.35) 40px);
  background-size: 100% 100%, 100% 100%;
  transform-origin: 50% 0%;
  transform: rotateX(72deg);
  animation: roy-vfx-bg-grid-pan 4s linear infinite;
}
@keyframes roy-vfx-bg-grid-pan {
  0%   { background-position: 0 0, 0 0; }
  100% { background-position: 0 40px, 0 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-grid-bg-anim::before { animation: none; }
}`,
  },

  // 8. vfx-dot-pattern-bg
  {
    id: "vfx-dot-pattern-bg",
    name: "VFX Dot Pattern Background",
    category: "backgrounds",
    description:
      "Crisp OKLCH dot matrix built from a single radial-gradient repeated across the surface. Lightweight and print-style.",
    tags: ["background", "dots", "pattern", "radial-gradient", "matrix", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Dot Pattern Background */
.roycss-vfx-dot-pattern-bg {
  background-color: oklch(0.16 0.04 250);
  background-image:
    radial-gradient(oklch(0.86 0.06 240) 1.4px, transparent 1.6px);
  background-size: 22px 22px;
  background-position: 0 0;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-dot-pattern-bg { /* static — no motion to disable */ }
}`,
  },

  // 9. vfx-cyberpunk-bg
  {
    id: "vfx-cyberpunk-bg",
    name: "VFX Cyberpunk Grid Background",
    category: "backgrounds",
    description:
      "Cyberpunk neon grid with glowing OKLCH horizon lines and a pulsing magenta glow. Synthwave city under a static skyline.",
    tags: ["background", "cyberpunk", "neon", "grid", "synthwave", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Cyberpunk Grid Background */
.roycss-vfx-cyberpunk-bg {
  position: relative;
  background:
    linear-gradient(oklch(0.10 0.10 290) 0%, oklch(0.18 0.16 320) 70%, oklch(0.10 0.10 290) 100%);
  overflow: hidden;
}
.roycss-vfx-cyberpunk-bg::before {
  content: "";
  position: absolute;
  inset: 50% 0 0 0;
  background-image:
    repeating-linear-gradient(90deg,
      transparent 0,
      transparent 38px,
      oklch(0.85 0.20 195 / 0.7) 38px,
      oklch(0.85 0.20 195 / 0.7) 40px),
    repeating-linear-gradient(0deg,
      transparent 0,
      transparent 38px,
      oklch(0.85 0.20 320 / 0.5) 38px,
      oklch(0.85 0.20 320 / 0.5) 40px);
  background-size: 100% 100%, 100% 100%;
  transform-origin: 50% 0%;
  transform: perspective(420px) rotateX(70deg);
  animation: roy-vfx-bg-cyber-grid 3.5s linear infinite;
  filter: drop-shadow(0 0 6px oklch(0.85 0.20 195 / 0.6));
}
@keyframes roy-vfx-bg-cyber-grid {
  0%   { background-position: 0 0, 0 0; }
  100% { background-position: 0 40px, 0 40px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-cyberpunk-bg::before { animation: none; }
}`,
  },

  // 10. vfx-spotlight-bg
  {
    id: "vfx-spotlight-bg",
    name: "VFX Spotlight Background",
    category: "backgrounds",
    description:
      "Soft OKLCH spotlight that breathes on a dark stage. Use as a hero backdrop — pure radial-gradient, no JS tracking required.",
    tags: ["background", "spotlight", "radial", "glow", "hero", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Spotlight Background */
.roycss-vfx-spotlight-bg {
  background:
    radial-gradient(circle at 50% 40%,
      oklch(0.92 0.08 240) 0%,
      oklch(0.30 0.08 240) 28%,
      oklch(0.12 0.04 250) 70%);
  animation: roy-vfx-bg-spotlight-breathe 6s ease-in-out infinite;
}
@keyframes roy-vfx-bg-spotlight-breathe {
  0%, 100% {
    background-size: 100% 100%;
    filter: brightness(1) saturate(1);
  }
  50% {
    background-size: 130% 130%;
    filter: brightness(1.15) saturate(1.18);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-spotlight-bg { animation: none; }
}`,
  },

  // 11. vfx-radial-glow
  {
    id: "vfx-radial-glow",
    name: "VFX Radial Glow Pulse",
    category: "backgrounds",
    description:
      "Centered OKLCH radial glow that pulses outward — a soft halo that scales and brightens on a calm rhythm.",
    tags: ["background", "radial", "glow", "pulse", "halo", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Radial Glow Pulse */
.roycss-vfx-radial-glow {
  position: relative;
  background: oklch(0.10 0.04 250);
  overflow: hidden;
}
.roycss-vfx-radial-glow::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%,
      oklch(0.85 0.20 35 / 0.55) 0%,
      oklch(0.70 0.20 35 / 0.18) 25%,
      transparent 60%);
  animation: roy-vfx-bg-glow-pulse 4s ease-in-out infinite;
}
@keyframes roy-vfx-bg-glow-pulse {
  0%, 100% { transform: scale(0.85); opacity: 0.6; }
  50%      { transform: scale(1.15); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-radial-glow::before { animation: none; }
}`,
  },

  // 12. vfx-holographic-bg
  {
    id: "vfx-holographic-bg",
    name: "VFX Holographic Background",
    category: "backgrounds",
    description:
      "Holographic conic-gradient that rotates its hue continuously — a sticker-foil shimmer on a dark base.",
    tags: ["background", "holographic", "conic", "hue-rotate", "iridescent", "vfx"],
    previewType: "background",
    cssCode: `/* VFX Holographic Background */
.roycss-vfx-holographic-bg {
  background:
    conic-gradient(
      from 0deg,
      oklch(0.80 0.18 35),
      oklch(0.80 0.18 145),
      oklch(0.80 0.18 195),
      oklch(0.80 0.18 290),
      oklch(0.80 0.18 35)
    );
  background-blend-mode: normal;
  animation: roy-vfx-bg-holo-rotate 10s linear infinite;
  filter: saturate(1.3) contrast(1.05);
}
@keyframes roy-vfx-bg-holo-rotate {
  0%   { filter: saturate(1.3) contrast(1.05) hue-rotate(0deg); }
  100% { filter: saturate(1.3) contrast(1.05) hue-rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-holographic-bg { animation: none; }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // GLASS & MODERN UI (10) — category: "glass-ui"
  // ═══════════════════════════════════════════════════════════════

  // 13. vfx-frosted-glass-2
  {
    id: "vfx-frosted-glass-2",
    name: "VFX Frosted Glass v2",
    category: "glass-ui",
    description:
      "Frosted glass panel with backdrop-filter blur and an OKLCH translucent tint. Lightweight, modern, no animation.",
    tags: ["glass", "frosted", "backdrop-filter", "blur", "panel", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Frosted Glass v2 */
.roycss-vfx-frosted-glass-2 {
  background: oklch(0.95 0.02 240 / 0.18);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid oklch(0.95 0.02 240 / 0.28);
  box-shadow:
    0 1px 0 oklch(1 0 0 / 0.18) inset,
    0 12px 40px oklch(0.10 0.04 250 / 0.35);
  border-radius: 16px;
  color: oklch(0.98 0.01 240);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-frosted-glass-2 { /* static */ }
}`,
  },

  // 14. vfx-neon-glass-2
  {
    id: "vfx-neon-glass-2",
    name: "VFX Neon Glass v2",
    category: "glass-ui",
    description:
      "Glass panel with a pulsing neon rim glow and backdrop-filter frost. Magenta-cyan duotone that breathes.",
    tags: ["glass", "neon", "glow", "backdrop-filter", "pulse", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Neon Glass v2 */
.roycss-vfx-neon-glass-2 {
  background: oklch(0.20 0.10 290 / 0.32);
  backdrop-filter: blur(14px) saturate(1.6);
  -webkit-backdrop-filter: blur(14px) saturate(1.6);
  border: 1px solid oklch(0.80 0.22 320 / 0.6);
  border-radius: 14px;
  box-shadow:
    0 0 8px oklch(0.80 0.22 320 / 0.55),
    0 0 22px oklch(0.70 0.22 195 / 0.45),
    0 0 50px oklch(0.70 0.22 320 / 0.25);
  color: oklch(0.96 0.06 320);
  animation: roy-vfx-glass-neon-pulse 2.6s ease-in-out infinite;
}
@keyframes roy-vfx-glass-neon-pulse {
  0%, 100% {
    box-shadow:
      0 0 8px oklch(0.80 0.22 320 / 0.55),
      0 0 22px oklch(0.70 0.22 195 / 0.45),
      0 0 50px oklch(0.70 0.22 320 / 0.25);
  }
  50% {
    box-shadow:
      0 0 6px oklch(0.80 0.22 320 / 0.4),
      0 0 14px oklch(0.70 0.22 195 / 0.3),
      0 0 32px oklch(0.70 0.22 320 / 0.15);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-neon-glass-2 { animation: none; }
}`,
  },

  // 15. vfx-holographic-card-2
  {
    id: "vfx-holographic-card-2",
    name: "VFX Holographic Card v2",
    category: "glass-ui",
    description:
      "Iridescent holographic card with an OKLCH conic sheen that drifts across the surface. Best on dark backgrounds.",
    tags: ["glass", "holographic", "iridescent", "card", "sheen", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Holographic Card v2 */
.roycss-vfx-holographic-card-2 {
  position: relative;
  background:
    linear-gradient(135deg,
      oklch(0.30 0.10 290 / 0.6),
      oklch(0.30 0.10 195 / 0.5));
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  border: 1px solid oklch(0.90 0.08 240 / 0.25);
  border-radius: 18px;
  overflow: hidden;
  color: oklch(0.98 0.02 240);
  box-shadow: 0 18px 50px oklch(0.10 0.04 250 / 0.4);
}
.roycss-vfx-holographic-card-2::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    conic-gradient(from 180deg at 50% 50%,
      oklch(0.85 0.18 35 / 0.32),
      oklch(0.85 0.18 145 / 0.32),
      oklch(0.85 0.18 195 / 0.32),
      oklch(0.85 0.18 290 / 0.32),
      oklch(0.85 0.18 35 / 0.32));
  mix-blend-mode: color-dodge;
  animation: roy-vfx-glass-holo-shift 9s linear infinite;
  pointer-events: none;
}
@keyframes roy-vfx-glass-holo-shift {
  0%   { transform: translate(-10%, -10%) rotate(0deg); }
  100% { transform: translate(10%, 10%)  rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-holographic-card-2::before { animation: none; }
}`,
  },

  // 16. vfx-metallic-surface
  {
    id: "vfx-metallic-surface",
    name: "VFX Metallic Surface",
    category: "glass-ui",
    description:
      "Brushed-metal surface with an OKLCH linear-gradient and a moving specular highlight. Stainless-steel feel.",
    tags: ["glass", "metallic", "metal", "shine", "specular", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Metallic Surface */
.roycss-vfx-metallic-surface {
  position: relative;
  background:
    linear-gradient(180deg,
      oklch(0.78 0.02 240) 0%,
      oklch(0.55 0.02 240) 22%,
      oklch(0.84 0.02 240) 50%,
      oklch(0.42 0.02 240) 78%,
      oklch(0.72 0.02 240) 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.4),
    inset 0 -1px 0 oklch(0 0 0 / 0.25),
    0 8px 24px oklch(0.10 0.04 250 / 0.3);
  color: oklch(0.10 0.04 250);
}
.roycss-vfx-metallic-surface::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(110deg,
      transparent 30%,
      oklch(1 0 0 / 0.35) 45%,
      transparent 60%);
  transform: translateX(-100%);
  animation: roy-vfx-glass-metal-shine 5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes roy-vfx-glass-metal-shine {
  0%, 60%   { transform: translateX(-100%); }
  100%      { transform: translateX(100%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-metallic-surface::after { animation: none; opacity: 0; }
}`,
  },

  // 17. vfx-chrome-effect
  {
    id: "vfx-chrome-effect",
    name: "VFX Chrome Effect",
    category: "glass-ui",
    description:
      "Chrome reflection with a vertical OKLCH gradient that mimics a polished silver bar. Pure static gradient — no animation needed.",
    tags: ["glass", "chrome", "metal", "reflection", "polished", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Chrome Effect */
.roycss-vfx-chrome-effect {
  background:
    linear-gradient(180deg,
      oklch(0.95 0.01 240) 0%,
      oklch(0.50 0.02 240) 18%,
      oklch(0.98 0.01 240) 38%,
      oklch(0.40 0.02 240) 55%,
      oklch(0.88 0.02 240) 72%,
      oklch(0.30 0.02 240) 100%);
  border-radius: 10px;
  border: 1px solid oklch(0.80 0.02 240 / 0.4);
  box-shadow:
    inset 0 1px 0 oklch(1 0 0 / 0.5),
    inset 0 -1px 0 oklch(0 0 0 / 0.3),
    0 6px 18px oklch(0.10 0.04 250 / 0.25);
  color: oklch(0.10 0.04 250);
  text-shadow: 0 1px 0 oklch(1 0 0 / 0.45);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-chrome-effect { /* static */ }
}`,
  },

  // 18. vfx-soft-shadow
  {
    id: "vfx-soft-shadow",
    name: "VFX Soft Shadow",
    category: "glass-ui",
    description:
      "Layered soft shadows via multiple box-shadows in OKLCH — a calm elevated card with no harsh edges.",
    tags: ["glass", "shadow", "soft", "elevation", "card", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Soft Shadow */
.roycss-vfx-soft-shadow {
  background: oklch(0.98 0.01 240);
  border-radius: 14px;
  border: 1px solid oklch(0.88 0.02 240 / 0.7);
  box-shadow:
    0 1px 2px oklch(0.20 0.04 250 / 0.04),
    0 4px 8px oklch(0.20 0.04 250 / 0.06),
    0 12px 24px oklch(0.20 0.04 250 / 0.08),
    0 28px 56px oklch(0.20 0.04 250 / 0.10);
  color: oklch(0.20 0.04 250);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-soft-shadow { /* static */ }
}`,
  },

  // 19. vfx-inner-shadow
  {
    id: "vfx-inner-shadow",
    name: "VFX Inner Shadow",
    category: "glass-ui",
    description:
      "Neumorphic-style inset shadow — a recessed OKLCH surface that looks pressed into the page. Pairs with soft-shadow siblings.",
    tags: ["glass", "inner", "shadow", "inset", "neumorphic", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Inner Shadow */
.roycss-vfx-inner-shadow {
  background: oklch(0.92 0.02 240);
  border-radius: 16px;
  border: 1px solid oklch(0.85 0.02 240);
  box-shadow:
    inset 2px 2px 6px oklch(0.40 0.04 250 / 0.35),
    inset -2px -2px 6px oklch(1 0 0 / 0.85);
  color: oklch(0.25 0.04 250);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-inner-shadow { /* static */ }
}`,
  },

  // 20. vfx-glow-border-anim
  {
    id: "vfx-glow-border-anim",
    name: "VFX Glow Border Animated",
    category: "glass-ui",
    description:
      "Border that glows with a rotating OKLCH conic-gradient mask. The hue cycles around the element's perimeter.",
    tags: ["glass", "glow", "border", "animated", "conic", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Glow Border Animated */
.roycss-vfx-glow-border-anim {
  position: relative;
  background: oklch(0.14 0.04 250);
  border-radius: 14px;
  color: oklch(0.96 0.02 240);
  z-index: 0;
}
.roycss-vfx-glow-border-anim::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background:
    conic-gradient(from 0deg,
      oklch(0.80 0.22 35),
      oklch(0.80 0.22 195),
      oklch(0.80 0.22 290),
      oklch(0.80 0.22 145),
      oklch(0.80 0.22 35));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  animation: roy-vfx-glass-glow-rotate 6s linear infinite;
  filter: drop-shadow(0 0 6px oklch(0.80 0.22 195 / 0.6));
  pointer-events: none;
}
@keyframes roy-vfx-glass-glow-rotate {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-glow-border-anim::before { animation: none; }
}`,
  },

  // 21. vfx-animated-border-2
  {
    id: "vfx-animated-border-2",
    name: "VFX Animated Border v2",
    category: "glass-ui",
    description:
      "Conic-gradient border that spins around the element. Masked to a 2px rim, with a soft outer glow.",
    tags: ["glass", "border", "animated", "conic", "spin", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Animated Border v2 */
.roycss-vfx-animated-border-2 {
  position: relative;
  background: oklch(0.16 0.04 250);
  border-radius: 12px;
  color: oklch(0.96 0.02 240);
}
.roycss-vfx-animated-border-2::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background:
    conic-gradient(from 0deg,
      oklch(0.85 0.22 35),
      oklch(0.85 0.22 290),
      oklch(0.85 0.22 195),
      oklch(0.85 0.22 35));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  animation: roy-vfx-glass-border-spin 4s linear infinite;
  pointer-events: none;
}
@keyframes roy-vfx-glass-border-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-animated-border-2::before { animation: none; }
}`,
  },

  // 22. vfx-iridescent-surface
  {
    id: "vfx-iridescent-surface",
    name: "VFX Iridescent Surface",
    category: "glass-ui",
    description:
      "Iridescent OKLCH gradient surface that shifts hue continuously. Soap-bubble rainbow that never repeats a frame.",
    tags: ["glass", "iridescent", "rainbow", "hue-rotate", "soap", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Iridescent Surface */
.roycss-vfx-iridescent-surface {
  background:
    linear-gradient(135deg,
      oklch(0.78 0.20 35),
      oklch(0.78 0.20 145),
      oklch(0.78 0.20 195),
      oklch(0.78 0.20 290));
  background-size: 200% 200%;
  border-radius: 14px;
  border: 1px solid oklch(1 0 0 / 0.25);
  box-shadow: 0 10px 30px oklch(0.20 0.04 250 / 0.25);
  color: oklch(0.10 0.04 250);
  animation: roy-vfx-glass-iridescent 8s linear infinite;
}
@keyframes roy-vfx-glass-iridescent {
  0%   { background-position: 0% 0%;   filter: hue-rotate(0deg); }
  50%  { background-position: 100% 100%; filter: hue-rotate(180deg); }
  100% { background-position: 0% 0%;   filter: hue-rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-iridescent-surface { animation: none; }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // BORDER EFFECTS (8) — category: "borders"
  // ═══════════════════════════════════════════════════════════════

  // 23. vfx-gradient-border-2
  {
    id: "vfx-gradient-border-2",
    name: "VFX Gradient Border v2",
    category: "borders",
    description:
      "Gradient border via border-image with an OKLCH linear-gradient slice. Crisp 3px rim, no pseudo-elements required.",
    tags: ["border", "gradient", "border-image", "oklch", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Gradient Border v2 */
.roycss-vfx-gradient-border-2 {
  border: 3px solid transparent;
  border-image:
    linear-gradient(135deg,
      oklch(0.80 0.22 35),
      oklch(0.80 0.22 195),
      oklch(0.80 0.22 290)) 1;
  border-radius: 10px;
  background: oklch(0.96 0.01 240);
  color: oklch(0.20 0.04 250);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-gradient-border-2 { /* static */ }
}`,
  },

  // 24. vfx-glow-border-2
  {
    id: "vfx-glow-border-2",
    name: "VFX Glow Border v2",
    category: "borders",
    description:
      "Border with a soft pulsing OKLCH outer glow via box-shadow. Calm breathing rhythm, perfect for focus states.",
    tags: ["border", "glow", "pulse", "box-shadow", "oklch", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Glow Border v2 */
.roycss-vfx-glow-border-2 {
  background: oklch(0.14 0.04 250);
  color: oklch(0.96 0.02 240);
  border: 2px solid oklch(0.80 0.22 195);
  border-radius: 12px;
  animation: roy-vfx-bd-glow-pulse 2.4s ease-in-out infinite;
}
@keyframes roy-vfx-bd-glow-pulse {
  0%, 100% {
    box-shadow:
      0 0 6px oklch(0.80 0.22 195 / 0.5),
      0 0 18px oklch(0.80 0.22 195 / 0.3);
  }
  50% {
    box-shadow:
      0 0 12px oklch(0.80 0.22 195 / 0.85),
      0 0 36px oklch(0.80 0.22 195 / 0.55);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-glow-border-2 { animation: none; }
}`,
  },

  // 25. vfx-neon-border
  {
    id: "vfx-neon-border",
    name: "VFX Neon Border",
    category: "borders",
    description:
      "Neon-sign border that flickers like an old glass tube — a soft OKLCH magenta glow with subtle brightness jitter.",
    tags: ["border", "neon", "flicker", "glow", "sign", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Neon Border */
.roycss-vfx-neon-border {
  background: oklch(0.10 0.04 250);
  color: oklch(0.96 0.04 320);
  border: 2px solid oklch(0.80 0.24 320);
  border-radius: 10px;
  animation: roy-vfx-bd-neon-flicker 3.6s linear infinite;
}
@keyframes roy-vfx-bd-neon-flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% {
    box-shadow:
      0 0 4px oklch(0.85 0.24 320),
      0 0 12px oklch(0.75 0.24 320 / 0.65),
      0 0 30px oklch(0.70 0.24 320 / 0.4);
    opacity: 1;
  }
  20%, 24%, 55% {
    box-shadow: 0 0 2px oklch(0.85 0.24 320 / 0.6);
    opacity: 0.85;
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-neon-border { animation: none; }
}`,
  },

  // 26. vfx-electric-border-2 (renamed from spec's vfx-electric-border
  //     because that ID already exists in batch-52 under the visual category)
  {
    id: "vfx-electric-border-2",
    name: "VFX Electric Border v2",
    category: "borders",
    description:
      "Electric border with a flowing OKLCH gradient that races around the rim via conic-gradient rotation. High-voltage feel.",
    tags: ["border", "electric", "flowing", "conic", "animated", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Electric Border v2 */
.roycss-vfx-electric-border-2 {
  position: relative;
  background: oklch(0.12 0.04 250);
  color: oklch(0.96 0.02 240);
  border-radius: 12px;
  z-index: 0;
}
.roycss-vfx-electric-border-2::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background:
    conic-gradient(from 0deg,
      oklch(0.85 0.24 35),
      oklch(0.85 0.24 195),
      oklch(0.85 0.24 290),
      oklch(0.85 0.24 35));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  animation: roy-vfx-bd-electric-flow 3s linear infinite;
  filter: drop-shadow(0 0 4px oklch(0.85 0.24 35 / 0.7));
  pointer-events: none;
}
@keyframes roy-vfx-bd-electric-flow {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-electric-border-2::before { animation: none; }
}`,
  },

  // 27. vfx-laser-border-2 (renamed from spec's vfx-laser-border
  //     because that ID already exists in batch-52 under the visual category)
  {
    id: "vfx-laser-border-2",
    name: "VFX Laser Border v2",
    category: "borders",
    description:
      "Thin glowing laser line that races around the perimeter in OKLCH cyan, leaving a brief afterglow trail.",
    tags: ["border", "laser", "thin", "glow", "trace", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Laser Border v2 */
.roycss-vfx-laser-border-2 {
  position: relative;
  background: oklch(0.10 0.04 250);
  color: oklch(0.96 0.04 195);
  border-radius: 10px;
  border: 1px solid oklch(0.30 0.10 195 / 0.4);
}
.roycss-vfx-laser-border-2::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background:
    conic-gradient(from 0deg,
      transparent 0deg,
      oklch(0.95 0.18 195) 30deg,
      oklch(0.95 0.18 195 / 0.6) 60deg,
      transparent 90deg,
      transparent 360deg);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  animation: roy-vfx-bd-laser-spin 2.5s linear infinite;
  filter: drop-shadow(0 0 3px oklch(0.95 0.18 195 / 0.8));
  pointer-events: none;
}
@keyframes roy-vfx-bd-laser-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-laser-border-2::before { animation: none; }
}`,
  },

  // 28. vfx-dashed-anim
  {
    id: "vfx-dashed-anim",
    name: "VFX Animated Dashed Border",
    category: "borders",
    description:
      "Marching-ants dashed border built from repeating-linear-gradient, animated via background-position. The CSS-only analog of SVG stroke-dashoffset animation.",
    tags: ["border", "dashed", "marching-ants", "animated", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Animated Dashed Border */
.roycss-vfx-dashed-anim {
  --roy-dash-color: oklch(0.80 0.22 195);
  --roy-dash-gap:   oklch(0.30 0.06 250);
  position: relative;
  background: oklch(0.96 0.01 240);
  color: oklch(0.20 0.04 250);
  border-radius: 10px;
  padding: 14px;
  background-image:
    repeating-linear-gradient(0deg,
      var(--roy-dash-color) 0,
      var(--roy-dash-color) 8px,
      var(--roy-dash-gap)   8px,
      var(--roy-dash-gap)   16px),
    repeating-linear-gradient(90deg,
      var(--roy-dash-color) 0,
      var(--roy-dash-color) 8px,
      var(--roy-dash-gap)   8px,
      var(--roy-dash-gap)   16px),
    repeating-linear-gradient(180deg,
      var(--roy-dash-color) 0,
      var(--roy-dash-color) 8px,
      var(--roy-dash-gap)   8px,
      var(--roy-dash-gap)   16px),
    repeating-linear-gradient(270deg,
      var(--roy-dash-color) 0,
      var(--roy-dash-color) 8px,
      var(--roy-dash-gap)   8px,
      var(--roy-dash-gap)   16px);
  background-size: 16px 1px, 1px 16px, 16px 1px, 1px 16px;
  background-position:
    0 0,
    100% 0,
    0 100%,
    0 0;
  background-repeat: no-repeat;
  animation: roy-vfx-bd-dash-march 0.8s linear infinite;
}
@keyframes roy-vfx-bd-dash-march {
  0%   {
    background-position:
      0 0,
      100% 0,
      0 100%,
      0 0;
  }
  100% {
    background-position:
      16px 0,
      calc(100% - 16px) 0,
      16px 100%,
      0 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-dashed-anim { animation: none; }
}`,
  },

  // 29. vfx-corner-border
  {
    id: "vfx-corner-border",
    name: "VFX Corner Border",
    category: "borders",
    description:
      "Bracket-style corner border built with clip-path on two pseudo-elements. Sci-fi HUD framing with a soft OKLCH glow.",
    tags: ["border", "corner", "bracket", "clip-path", "hud", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Corner Border */
.roycss-vfx-corner-border {
  position: relative;
  background: oklch(0.10 0.04 250);
  color: oklch(0.96 0.02 240);
  border-radius: 6px;
  padding: 18px;
}
.roycss-vfx-corner-border::before,
.roycss-vfx-corner-border::after {
  content: "";
  position: absolute;
  width: 22px;
  height: 22px;
  border: 2px solid oklch(0.80 0.22 195);
  pointer-events: none;
  filter: drop-shadow(0 0 4px oklch(0.80 0.22 195 / 0.6));
}
.roycss-vfx-corner-border::before {
  top: 6px;
  left: 6px;
  border-right: 0;
  border-bottom: 0;
  border-top-left-radius: 4px;
}
.roycss-vfx-corner-border::after {
  bottom: 6px;
  right: 6px;
  border-left: 0;
  border-top: 0;
  border-bottom-right-radius: 4px;
  animation: roy-vfx-bd-corner-glow 3s ease-in-out infinite;
}
@keyframes roy-vfx-bd-corner-glow {
  0%, 100% { opacity: 1; filter: drop-shadow(0 0 4px oklch(0.80 0.22 195 / 0.6)); }
  50%      { opacity: 0.6; filter: drop-shadow(0 0 10px oklch(0.80 0.22 195 / 0.9)); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-corner-border::after { animation: none; }
}`,
  },

  // 30. vfx-double-border
  {
    id: "vfx-double-border",
    name: "VFX Double Border",
    category: "borders",
    description:
      "Double-border effect combining a 2px border with a 1px outline offset by 4px in OKLCH — a clean layered frame with no pseudo-elements.",
    tags: ["border", "double", "outline", "layered", "frame", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Double Border */
.roycss-vfx-double-border {
  background: oklch(0.96 0.01 240);
  color: oklch(0.20 0.04 250);
  border: 2px solid oklch(0.72 0.18 195);
  border-radius: 12px;
  outline: 1px solid oklch(0.72 0.18 290 / 0.6);
  outline-offset: 4px;
  box-shadow:
    0 0 0 1px oklch(0.72 0.18 35 / 0.25),
    0 8px 24px oklch(0.10 0.04 250 / 0.18);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-double-border { /* static */ }
}`,
  },
];
