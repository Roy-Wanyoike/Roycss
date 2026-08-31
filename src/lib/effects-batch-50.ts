import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 50 — VFX: Text, Hover & Entrance Effects (30 effects)
 *
 * 10 text effects, 10 hover effects, 10 entrance effects — all cinematic,
 * GPU-friendly, and accessibility-aware (every effect honors
 * prefers-reduced-motion).
 *
 * Conventions:
 *   • Every class is prefixed `roycss-`
 *   • Every @keyframes symbol is prefixed `roy-vfx-` (no collisions with
 *     prior batches — all unique names)
 *   • Colors use the OKLCH color space with color-mix() compositing
 *   • Animations favor GPU-friendly properties (transform, opacity, filter,
 *     clip-path) over layout-triggering properties
 *   • No JavaScript, no external dependencies — pure CSS only
 */
export const effectsBatch50: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // TEXT EFFECTS (10)
  // ═══════════════════════════════════════════════════════════════

  // 1. vfx-glitch-text
  {
    id: "vfx-glitch-text",
    name: "VFX Glitch Text",
    category: "text",
    description:
      "Glitch text with clip-path slices and RGB channel split. Set data-text on the element to enable the chromatic duplicates.",
    tags: ["text", "glitch", "rgb", "split", "clip-path", "vfx"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* VFX Glitch Text */
.roycss-vfx-glitch-text {
  position: relative;
  display: inline-block;
  font-weight: 800;
  color: oklch(0.96 0.02 240);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.06em;
  text-shadow: 0 0 1px oklch(0.96 0.02 240);
}
.roycss-vfx-glitch-text::before,
.roycss-vfx-glitch-text::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.roycss-vfx-glitch-text::before {
  color: oklch(0.65 0.28 25);
  animation: roy-vfx-glitch-r 2.4s steps(2, end) infinite;
  clip-path: inset(0 0 60% 0);
}
.roycss-vfx-glitch-text::after {
  color: oklch(0.65 0.28 200);
  animation: roy-vfx-glitch-b 2.4s steps(2, end) infinite;
  clip-path: inset(60% 0 0 0);
}
/* Fallback content so the chromatic split shows even without data-text */
.roycss-vfx-glitch-text::before { content: "RoyCSS"; }
.roycss-vfx-glitch-text::after  { content: "RoyCSS"; }
@keyframes roy-vfx-glitch-r {
  0%, 100% { transform: translate(0, 0); }
  20%      { transform: translate(-3px, 1px); }
  40%      { transform: translate(2px, -1px); }
  60%      { transform: translate(-2px, 2px); }
  80%      { transform: translate(1px, -2px); }
}
@keyframes roy-vfx-glitch-b {
  0%, 100% { transform: translate(0, 0); }
  20%      { transform: translate(3px, -1px); }
  40%      { transform: translate(-2px, 1px); }
  60%      { transform: translate(2px, -2px); }
  80%      { transform: translate(-1px, 2px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-glitch-text::before,
  .roycss-vfx-glitch-text::after { animation: none; opacity: 0; }
}`,
  },

  // 2. vfx-neon-glow-text
  {
    id: "vfx-neon-glow-text",
    name: "VFX Neon Glow Text",
    category: "text",
    description:
      "Neon-sign text with a pulsing layered glow. Pure OKLCH light-shadows flicker like glass tubes.",
    tags: ["text", "neon", "glow", "sign", "pulse", "vfx"],
    previewType: "text",
    previewText: "NEON",
    cssCode: `/* VFX Neon Glow Text */
.roycss-vfx-neon-glow-text {
  display: inline-block;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: oklch(0.95 0.18 195);
  text-transform: uppercase;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  animation: roy-vfx-neon-glow 2.5s ease-in-out infinite;
}
@keyframes roy-vfx-neon-glow {
  0%, 100% {
    text-shadow:
      0 0 4px oklch(0.95 0.18 195),
      0 0 12px oklch(0.85 0.22 195 / 0.7),
      0 0 28px oklch(0.78 0.24 195 / 0.45),
      0 0 48px oklch(0.72 0.26 195 / 0.25);
  }
  50% {
    text-shadow:
      0 0 2px oklch(0.95 0.18 195),
      0 0 6px oklch(0.85 0.22 195 / 0.5),
      0 0 14px oklch(0.78 0.24 195 / 0.3),
      0 0 24px oklch(0.72 0.26 195 / 0.15);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-neon-glow-text { animation: none; }
}`,
  },

  // 3. vfx-gradient-text-animated
  {
    id: "vfx-gradient-text-animated",
    name: "VFX Animated Gradient Text",
    category: "text",
    description:
      "Text filled with a flowing OKLCH gradient that sweeps continuously across the letters.",
    tags: ["text", "gradient", "animated", "background-clip", "vfx"],
    previewType: "text",
    previewText: "Gradient",
    cssCode: `/* VFX Animated Gradient Text */
.roycss-vfx-gradient-text-animated {
  display: inline-block;
  font-weight: 800;
  background: linear-gradient(
    90deg,
    oklch(0.72 0.22 35) 0%,
    oklch(0.78 0.20 290) 25%,
    oklch(0.78 0.18 195) 50%,
    oklch(0.78 0.22 145) 75%,
    oklch(0.72 0.22 35) 100%
  );
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: roy-vfx-gradient-sweep 4s linear infinite;
}
@keyframes roy-vfx-gradient-sweep {
  0%   { background-position: 0% 0%; }
  100% { background-position: 250% 0%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-gradient-text-animated { animation: none; }
}`,
  },

  // 4. vfx-text-distortion
  {
    id: "vfx-text-distortion",
    name: "VFX Text Distortion",
    category: "text",
    description:
      "Text skews and stretches rhythmically using GPU-friendly transforms — no layout thrash.",
    tags: ["text", "distortion", "skew", "stretch", "vfx"],
    previewType: "text",
    previewText: "DISTORT",
    cssCode: `/* VFX Text Distortion */
.roycss-vfx-text-distortion {
  display: inline-block;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: oklch(0.92 0.10 290);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  transform-origin: center;
  animation: roy-vfx-distort 2.6s ease-in-out infinite;
}
@keyframes roy-vfx-distort {
  0%, 100% { transform: skewX(0deg)  scaleX(1)    scaleY(1); }
  20%      { transform: skewX(-12deg) scaleX(1.08) scaleY(0.92); }
  40%      { transform: skewX(8deg)   scaleX(0.94) scaleY(1.06); }
  60%      { transform: skewX(-6deg)  scaleX(1.04) scaleY(0.97); }
  80%      { transform: skewX(10deg)  scaleX(0.98) scaleY(1.03); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-text-distortion { animation: none; }
}`,
  },

  // 5. vfx-wave-text
  {
    id: "vfx-wave-text",
    name: "VFX Wave Text",
    category: "text",
    description:
      "Per-letter wave. Wrap each character in a <span> and they ride up and down in a sine wave.",
    tags: ["text", "wave", "sine", "per-letter", "stagger", "vfx"],
    previewType: "text",
    previewText: "Wave",
    cssCode: `/* VFX Wave Text — wrap each character in a <span> */
.roycss-vfx-wave-text {
  display: inline-flex;
  font-weight: 800;
  color: oklch(0.78 0.18 195);
  letter-spacing: 0.05em;
}
.roycss-vfx-wave-text > span {
  display: inline-block;
  animation: roy-vfx-wave 1.6s ease-in-out infinite;
}
.roycss-vfx-wave-text > span:nth-child(1) { animation-delay: 0s;    }
.roycss-vfx-wave-text > span:nth-child(2) { animation-delay: 0.08s; }
.roycss-vfx-wave-text > span:nth-child(3) { animation-delay: 0.16s; }
.roycss-vfx-wave-text > span:nth-child(4) { animation-delay: 0.24s; }
.roycss-vfx-wave-text > span:nth-child(5) { animation-delay: 0.32s; }
.roycss-vfx-wave-text > span:nth-child(6) { animation-delay: 0.40s; }
.roycss-vfx-wave-text > span:nth-child(7) { animation-delay: 0.48s; }
.roycss-vfx-wave-text > span:nth-child(8) { animation-delay: 0.56s; }
@keyframes roy-vfx-wave {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-0.35em); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-wave-text > span { animation: none; }
}`,
  },

  // 6. vfx-text-shadow-anim
  {
    id: "vfx-text-shadow-anim",
    name: "VFX Layered Text Shadow",
    category: "text",
    description:
      "Layered text-shadows drift and breathe in OKLCH — a soft cinematic depth without pseudo-elements.",
    tags: ["text", "shadow", "layered", "depth", "vfx"],
    previewType: "text",
    previewText: "Shadows",
    cssCode: `/* VFX Layered Text Shadow */
.roycss-vfx-text-shadow-anim {
  display: inline-block;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: oklch(0.96 0.02 240);
  animation: roy-vfx-shadow-drift 3.6s ease-in-out infinite;
}
@keyframes roy-vfx-shadow-drift {
  0% {
    text-shadow:
      1px 1px 0 oklch(0.65 0.20 35),
      2px 2px 0 oklch(0.65 0.20 35 / 0.8),
      3px 3px 0 oklch(0.65 0.20 35 / 0.6),
      4px 4px 8px oklch(0.65 0.20 35 / 0.4);
  }
  50% {
    text-shadow:
      -1px -1px 0 oklch(0.70 0.18 250),
      -2px -2px 0 oklch(0.70 0.18 250 / 0.8),
      -3px -3px 0 oklch(0.70 0.18 250 / 0.6),
      -4px -4px 12px oklch(0.70 0.18 250 / 0.4);
  }
  100% {
    text-shadow:
      1px 1px 0 oklch(0.65 0.20 35),
      2px 2px 0 oklch(0.65 0.20 35 / 0.8),
      3px 3px 0 oklch(0.65 0.20 35 / 0.6),
      4px 4px 8px oklch(0.65 0.20 35 / 0.4);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-text-shadow-anim { animation: none; }
}`,
  },

  // 7. vfx-fire-text
  {
    id: "vfx-fire-text",
    name: "VFX Fire Text",
    category: "text",
    description:
      "Text filled with a fire gradient that flickers via background-position, plus a soft ember glow.",
    tags: ["text", "fire", "flame", "gradient", "flicker", "vfx"],
    previewType: "text",
    previewText: "FIRE",
    cssCode: `/* VFX Fire Text */
.roycss-vfx-fire-text {
  display: inline-block;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: linear-gradient(
    0deg,
    oklch(0.55 0.25 30) 0%,
    oklch(0.75 0.28 50) 35%,
    oklch(0.85 0.20 75) 65%,
    oklch(0.95 0.10 90) 100%
  );
  background-size: 100% 220%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: drop-shadow(0 0 6px oklch(0.75 0.28 50 / 0.55))
          drop-shadow(0 0 14px oklch(0.65 0.28 30 / 0.35));
  animation: roy-vfx-fire-flicker 1.2s ease-in-out infinite;
}
@keyframes roy-vfx-fire-flicker {
  0%, 100% { background-position: 0% 100%; opacity: 1; }
  25%      { background-position: 0% 70%;  opacity: 0.92; }
  50%      { background-position: 0% 95%;  opacity: 1; }
  75%      { background-position: 0% 65%;  opacity: 0.88; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-fire-text { animation: none; }
}`,
  },

  // 8. vfx-liquid-text
  {
    id: "vfx-liquid-text",
    name: "VFX Liquid Text",
    category: "text",
    description:
      "Text filled with a rippling aqua gradient and a wobble transform — looks wet, like ink in water.",
    tags: ["text", "liquid", "water", "ripple", "wobble", "vfx"],
    previewType: "text",
    previewText: "liquid",
    cssCode: `/* VFX Liquid Text */
.roycss-vfx-liquid-text {
  display: inline-block;
  font-weight: 900;
  letter-spacing: 0.05em;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: linear-gradient(
    45deg,
    oklch(0.78 0.18 195) 0%,
    oklch(0.85 0.16 230) 35%,
    oklch(0.82 0.20 175) 65%,
    oklch(0.78 0.18 195) 100%
  );
  background-size: 280% 280%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: blur(0.4px);
  transform-origin: center;
  animation: roy-vfx-liquid-ripple 4.5s ease-in-out infinite;
}
@keyframes roy-vfx-liquid-ripple {
  0%, 100% {
    background-position: 0% 50%;
    transform: skewX(0deg) translateY(0);
  }
  25% {
    background-position: 50% 100%;
    transform: skewX(-3deg) translateY(-2px);
  }
  50% {
    background-position: 100% 50%;
    transform: skewX(2deg) translateY(0);
  }
  75% {
    background-position: 50% 0%;
    transform: skewX(-2deg) translateY(2px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-liquid-text { animation: none; filter: none; }
}`,
  },

  // 9. vfx-shimmer-text
  {
    id: "vfx-shimmer-text",
    name: "VFX Shimmer Text",
    category: "text",
    description:
      "A bright diagonal gradient sweeps across the text on a loop — perfect for placeholders or loaders.",
    tags: ["text", "shimmer", "sweep", "gradient", "loading", "vfx"],
    previewType: "text",
    previewText: "Shimmer",
    cssCode: `/* VFX Shimmer Text */
.roycss-vfx-shimmer-text {
  display: inline-block;
  font-weight: 800;
  letter-spacing: 0.05em;
  background: linear-gradient(
    100deg,
    oklch(0.70 0.04 240) 30%,
    oklch(0.95 0.04 240) 50%,
    oklch(0.70 0.04 240) 70%
  );
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: roy-vfx-shimmer-sweep 2.4s linear infinite;
}
@keyframes roy-vfx-shimmer-sweep {
  0%   { background-position: 130% 0%; }
  100% { background-position: -130% 0%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-shimmer-text { animation: none; }
}`,
  },

  // 10. vfx-3d-text-extrude
  {
    id: "vfx-3d-text-extrude",
    name: "VFX 3D Extruded Text",
    category: "text",
    description:
      "Multi-layer text-shadow stack creates a chunky 3D extrusion, with a subtle parallax breathe on hover.",
    tags: ["text", "3d", "extrude", "shadow", "depth", "vfx"],
    previewType: "text",
    previewText: "3D",
    cssCode: `/* VFX 3D Extruded Text */
.roycss-vfx-3d-text-extrude {
  display: inline-block;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: oklch(0.92 0.18 35);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  text-shadow:
    1px 1px 0 oklch(0.78 0.20 35),
    2px 2px 0 oklch(0.70 0.22 35),
    3px 3px 0 oklch(0.62 0.22 35),
    4px 4px 0 oklch(0.54 0.22 35),
    5px 5px 0 oklch(0.46 0.22 35),
    6px 6px 0 oklch(0.40 0.20 35),
    7px 7px 0 oklch(0.34 0.18 35),
    8px 8px 12px oklch(0.30 0.10 35 / 0.45);
  transform: perspective(500px) rotateX(8deg);
  transform-origin: center bottom;
  transition: transform 0.3s ease;
  animation: roy-vfx-3d-breathe 4s ease-in-out infinite;
}
.roycss-vfx-3d-text-extrude:hover {
  transform: perspective(500px) rotateX(0deg) translateY(-2px);
}
@keyframes roy-vfx-3d-breathe {
  0%, 100% { transform: perspective(500px) rotateX(8deg)  translateY(0); }
  50%      { transform: perspective(500px) rotateX(12deg) translateY(-1px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-3d-text-extrude {
    animation: none;
    transform: perspective(500px) rotateX(8deg);
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // HOVER EFFECTS (10)
  // ═══════════════════════════════════════════════════════════════

  // 11. vfx-magnetic-hover
  {
    id: "vfx-magnetic-hover",
    name: "VFX Magnetic Hover",
    category: "hover",
    description:
      "On hover the element glides toward the cursor with a slight scale-up — pure-CSS approximation of magnetic buttons.",
    tags: ["hover", "magnetic", "pull", "interactive", "vfx"],
    previewType: "button",
    previewText: "Magnet",
    cssCode: `/* VFX Magnetic Hover — pure CSS approximation */
.roycss-vfx-magnetic-hover {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7em 1.6em;
  border-radius: 12px;
  font-weight: 700;
  color: oklch(0.98 0.02 240);
  background: linear-gradient(135deg, oklch(0.62 0.22 145), oklch(0.58 0.22 195));
  box-shadow: 0 6px 18px oklch(0.58 0.22 175 / 0.35);
  transform: translateZ(0);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.25s ease;
  will-change: transform;
}
.roycss-vfx-magnetic-hover::before {
  content: "";
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle at center, oklch(0.85 0.22 175 / 0.35), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.roycss-vfx-magnetic-hover:hover {
  transform: translateY(-4px) scale(1.06);
  box-shadow: 0 14px 28px oklch(0.58 0.22 175 / 0.5),
              0 0 24px oklch(0.78 0.22 175 / 0.45);
}
.roycss-vfx-magnetic-hover:hover::before { opacity: 1; }
.roycss-vfx-magnetic-hover:active {
  transform: translateY(-1px) scale(1.02);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-magnetic-hover,
  .roycss-vfx-magnetic-hover::before { transition: none; }
}`,
  },

  // 12. vfx-shine-sweep
  {
    id: "vfx-shine-sweep",
    name: "VFX Shine Sweep",
    category: "hover",
    description:
      "A bright diagonal sheen sweeps across the surface on hover. Pure CSS, GPU-friendly transform on the overlay.",
    tags: ["hover", "shine", "sweep", "sheen", "interactive", "vfx"],
    previewType: "button",
    previewText: "Shine",
    cssCode: `/* VFX Shine Sweep */
.roycss-vfx-shine-sweep {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7em 1.6em;
  border-radius: 10px;
  font-weight: 700;
  color: oklch(0.98 0.02 240);
  background: linear-gradient(135deg, oklch(0.45 0.18 260), oklch(0.55 0.20 290));
  overflow: hidden;
  isolation: isolate;
}
.roycss-vfx-shine-sweep::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 30%,
    oklch(0.98 0.04 240 / 0.65) 50%,
    transparent 70%
  );
  transform: translateX(-120%);
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
  z-index: 1;
}
.roycss-vfx-shine-sweep:hover::before { transform: translateX(120%); }
.roycss-vfx-shine-sweep > * { position: relative; z-index: 2; }
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-shine-sweep::before { transition: none; }
}`,
  },

  // 13. vfx-glow-hover
  {
    id: "vfx-glow-hover",
    name: "VFX Glow Hover",
    category: "hover",
    description:
      "On hover, a layered OKLCH box-shadow blooms into a soft neon halo. Smooth, GPU-friendly.",
    tags: ["hover", "glow", "neon", "halo", "box-shadow", "vfx"],
    previewType: "button",
    previewText: "Glow",
    cssCode: `/* VFX Glow Hover */
.roycss-vfx-glow-hover {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7em 1.6em;
  border-radius: 12px;
  font-weight: 700;
  color: oklch(0.98 0.02 240);
  background: oklch(0.30 0.10 240);
  box-shadow: 0 0 0 oklch(0.85 0.22 195 / 0);
  transition: box-shadow 0.35s ease, transform 0.25s ease, background 0.35s ease;
  will-change: box-shadow, transform;
}
.roycss-vfx-glow-hover:hover {
  background: oklch(0.40 0.16 195);
  transform: translateY(-2px);
  box-shadow:
    0 0 8px  oklch(0.85 0.22 195 / 0.75),
    0 0 18px oklch(0.78 0.24 195 / 0.55),
    0 0 32px oklch(0.72 0.24 195 / 0.35),
    0 0 52px oklch(0.66 0.24 195 / 0.18);
}
.roycss-vfx-glow-hover:active { transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-glow-hover { transition: none; }
}`,
  },

  // 14. vfx-border-anim
  {
    id: "vfx-border-anim",
    name: "VFX Animated Gradient Border",
    category: "hover",
    description:
      "A conic gradient border that rotates around the element. Mask + ::before keep the inside clean.",
    tags: ["hover", "border", "gradient", "conic", "animated", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Animated Gradient Border */
.roycss-vfx-border-anim {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 120px;
  block-size: 120px;
  border-radius: 16px;
  background: oklch(0.25 0.05 240);
  isolation: isolate;
  overflow: hidden;
}
.roycss-vfx-border-anim::before {
  content: "";
  position: absolute;
  inset: -50%;
  z-index: -1;
  background: conic-gradient(
    oklch(0.78 0.22 35),
    oklch(0.78 0.22 195),
    oklch(0.78 0.22 290),
    oklch(0.78 0.22 145),
    oklch(0.78 0.22 35)
  );
  animation: roy-vfx-border-spin 4s linear infinite;
  will-change: transform;
}
.roycss-vfx-border-anim::after {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: 14px;
  background: oklch(0.25 0.05 240);
  z-index: -1;
}
.roycss-vfx-border-anim:hover::before { animation-duration: 1.2s; }
@keyframes roy-vfx-border-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-border-anim::before { animation: none; }
}`,
  },

  // 15. vfx-image-zoom-hover
  {
    id: "vfx-image-zoom-hover",
    name: "VFX Image Zoom Hover",
    category: "hover",
    description:
      "On hover the inner content scales up smoothly while a subtle vignette lifts — a clean gallery-card zoom.",
    tags: ["hover", "image", "zoom", "scale", "gallery", "vfx"],
    previewType: "card",
    cssCode: `/* VFX Image Zoom Hover */
.roycss-vfx-image-zoom-hover {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 144px;
  block-size: 96px;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.55 0.20 145), oklch(0.45 0.22 195));
  isolation: isolate;
}
.roycss-vfx-image-zoom-hover::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.85 0.18 75 / 0.6), transparent 60%),
    radial-gradient(circle at 70% 80%, oklch(0.78 0.22 290 / 0.5), transparent 60%);
  transform: scale(1);
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}
.roycss-vfx-image-zoom-hover::after {
  content: "";
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 60px oklch(0.20 0.05 240 / 0.6);
  opacity: 0;
  transition: opacity 0.4s ease;
}
.roycss-vfx-image-zoom-hover:hover::before { transform: scale(1.18); }
.roycss-vfx-image-zoom-hover:hover::after  { opacity: 1; }
.roycss-vfx-image-zoom-hover > * {
  position: relative;
  z-index: 1;
  color: oklch(0.98 0.02 240);
  font-weight: 700;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-image-zoom-hover::before,
  .roycss-vfx-image-zoom-hover::after { transition: none; }
}`,
  },

  // 16. vfx-3d-tilt-hover
  {
    id: "vfx-3d-tilt-hover",
    name: "VFX 3D Tilt Hover",
    category: "hover",
    description:
      "On hover the element tilts back in 3D with perspective and lifts slightly — pure-CSS approximation of a tilt card.",
    tags: ["hover", "3d", "tilt", "perspective", "card", "vfx"],
    previewType: "card",
    cssCode: `/* VFX 3D Tilt Hover */
.roycss-vfx-3d-tilt-hover {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 144px;
  block-size: 96px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.30 0.10 240), oklch(0.40 0.16 290));
  color: oklch(0.95 0.02 240);
  font-weight: 700;
  border: 1px solid oklch(0.55 0.18 290 / 0.4);
  transform: perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0);
  transform-style: preserve-3d;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.4s ease;
  will-change: transform;
  box-shadow: 0 4px 12px oklch(0.20 0.05 240 / 0.4);
}
.roycss-vfx-3d-tilt-hover:hover {
  transform: perspective(800px) rotateX(-12deg) rotateY(14deg) translateZ(10px);
  box-shadow:
    0 16px 28px oklch(0.20 0.05 240 / 0.5),
    -8px 8px 0 oklch(0.65 0.22 290 / 0.25);
}
.roycss-vfx-3d-tilt-hover:active {
  transform: perspective(800px) rotateX(-4deg) rotateY(4deg) translateZ(4px);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-3d-tilt-hover { transition: none; }
}`,
  },

  // 17. vfx-card-lift
  {
    id: "vfx-card-lift",
    name: "VFX Card Lift",
    category: "hover",
    description:
      "On hover the card rises with a deepening shadow and a subtle border glow — the classic card hover.",
    tags: ["hover", "card", "lift", "shadow", "interactive", "vfx"],
    previewType: "card",
    cssCode: `/* VFX Card Lift */
.roycss-vfx-card-lift {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 144px;
  block-size: 96px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.98 0.01 240), oklch(0.94 0.02 240));
  color: oklch(0.25 0.05 240);
  font-weight: 700;
  border: 1px solid oklch(0.85 0.02 240);
  box-shadow: 0 2px 8px oklch(0.20 0.05 240 / 0.12);
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.3s ease,
              border-color 0.3s ease;
  will-change: transform;
}
.roycss-vfx-card-lift:hover {
  transform: translateY(-8px);
  border-color: oklch(0.65 0.22 195 / 0.5);
  box-shadow:
    0 18px 32px oklch(0.20 0.05 240 / 0.22),
    0 0 0 1px oklch(0.65 0.22 195 / 0.15),
    0 0 22px oklch(0.78 0.22 195 / 0.18);
}
.roycss-vfx-card-lift:active { transform: translateY(-3px); }
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-card-lift { transition: none; }
}`,
  },

  // 18. vfx-spotlight-hover
  {
    id: "vfx-spotlight-hover",
    name: "VFX Spotlight Hover",
    category: "hover",
    description:
      "On hover a radial spotlight follows the element from top-left to bottom-right, illuminating the surface.",
    tags: ["hover", "spotlight", "radial", "light", "interactive", "vfx"],
    previewType: "card",
    cssCode: `/* VFX Spotlight Hover */
.roycss-vfx-spotlight-hover {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 144px;
  block-size: 96px;
  border-radius: 14px;
  background: oklch(0.22 0.04 240);
  color: oklch(0.95 0.02 240);
  font-weight: 700;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid oklch(0.40 0.10 240 / 0.5);
}
.roycss-vfx-spotlight-hover::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 70% 30%,
    oklch(0.85 0.22 195 / 0.55),
    oklch(0.78 0.22 290 / 0.25) 30%,
    transparent 60%
  );
  opacity: 0;
  transform: translate(-10%, 10%);
  transition: opacity 0.35s ease, transform 0.35s ease;
  pointer-events: none;
}
.roycss-vfx-spotlight-hover:hover::before {
  opacity: 1;
  transform: translate(0, 0);
}
.roycss-vfx-spotlight-hover > * { position: relative; z-index: 1; }
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-spotlight-hover::before { transition: none; }
}`,
  },

  // 19. vfx-liquid-hover
  {
    id: "vfx-liquid-hover",
    name: "VFX Liquid Hover",
    category: "hover",
    description:
      "On hover the element morphs its border-radius through organic curves — a gooey, fluid shape change.",
    tags: ["hover", "liquid", "morph", "border-radius", "organic", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Liquid Hover */
.roycss-vfx-liquid-hover {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 120px;
  block-size: 120px;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  background: linear-gradient(135deg, oklch(0.62 0.22 195), oklch(0.58 0.22 145));
  color: oklch(0.98 0.02 240);
  font-weight: 700;
  box-shadow: 0 8px 24px oklch(0.58 0.22 175 / 0.35);
  transition: border-radius 0.6s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.6s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.6s ease;
  will-change: border-radius, transform;
}
.roycss-vfx-liquid-hover:hover {
  border-radius: 70% 30% 30% 70% / 60% 40% 60% 40%;
  transform: rotate(-6deg) scale(1.05);
  box-shadow: 0 12px 32px oklch(0.58 0.22 175 / 0.5);
}
.roycss-vfx-liquid-hover:active {
  border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%;
  transform: rotate(0deg) scale(0.98);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-liquid-hover { transition: none; }
}`,
  },

  // 20. vfx-glitch-hover
  {
    id: "vfx-glitch-hover",
    name: "VFX Glitch Hover",
    category: "hover",
    description:
      "On hover the element snaps into a glitchy position-offset and clip-path tear — a digital distortion burst.",
    tags: ["hover", "glitch", "clip-path", "tear", "distortion", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Glitch Hover */
.roycss-vfx-glitch-hover {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 120px;
  block-size: 120px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.30 0.10 240), oklch(0.40 0.16 290));
  color: oklch(0.95 0.02 240);
  font-weight: 700;
  isolation: isolate;
  clip-path: inset(0 0 0 0);
  transition: transform 0.18s steps(2, end), clip-path 0.18s steps(2, end);
  will-change: transform, clip-path;
}
.roycss-vfx-glitch-hover::before,
.roycss-vfx-glitch-hover::after {
  content: "";
  position: absolute;
  inset: 0;
  background: inherit;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
}
.roycss-vfx-glitch-hover::before {
  background: linear-gradient(135deg, oklch(0.55 0.28 25 / 0.55), oklch(0.55 0.28 25 / 0.55));
  clip-path: inset(0 0 60% 0);
}
.roycss-vfx-glitch-hover::after {
  background: linear-gradient(135deg, oklch(0.55 0.28 200 / 0.55), oklch(0.55 0.28 200 / 0.55));
  clip-path: inset(60% 0 0 0);
}
.roycss-vfx-glitch-hover:hover {
  transform: translate(2px, -2px);
  clip-path: inset(10% 0 12% 0);
}
.roycss-vfx-glitch-hover:hover::before {
  opacity: 1;
  transform: translate(-3px, 0);
}
.roycss-vfx-glitch-hover:hover::after {
  opacity: 1;
  transform: translate(3px, 0);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-glitch-hover,
  .roycss-vfx-glitch-hover::before,
  .roycss-vfx-glitch-hover::after { transition: none; }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // ENTRANCE EFFECTS (10)
  // ═══════════════════════════════════════════════════════════════

  // 21. vfx-fade-up
  {
    id: "vfx-fade-up",
    name: "VFX Fade Up",
    category: "animations",
    description:
      "Element fades in while translating upward. The classic entrance — runs once on load.",
    tags: ["entrance", "fade", "up", "translate", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Fade Up */
.roycss-vfx-fade-up {
  animation: roy-vfx-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: transform, opacity;
}
@keyframes roy-vfx-fade-up {
  0%   { opacity: 0; transform: translateY(28px); }
  100% { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-fade-up { animation: none; opacity: 1; }
}`,
  },

  // 22. vfx-fade-down
  {
    id: "vfx-fade-down",
    name: "VFX Fade Down",
    category: "animations",
    description:
      "Element fades in while translating downward. Runs once on load.",
    tags: ["entrance", "fade", "down", "translate", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Fade Down */
.roycss-vfx-fade-down {
  animation: roy-vfx-fade-down 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: transform, opacity;
}
@keyframes roy-vfx-fade-down {
  0%   { opacity: 0; transform: translateY(-28px); }
  100% { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-fade-down { animation: none; opacity: 1; }
}`,
  },

  // 23. vfx-fade-left
  {
    id: "vfx-fade-left",
    name: "VFX Fade Left",
    category: "animations",
    description:
      "Element fades in while sliding in from the right toward the left. Runs once on load.",
    tags: ["entrance", "fade", "left", "slide", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Fade Left */
.roycss-vfx-fade-left {
  animation: roy-vfx-fade-left 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: transform, opacity;
}
@keyframes roy-vfx-fade-left {
  0%   { opacity: 0; transform: translateX(36px); }
  100% { opacity: 1; transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-fade-left { animation: none; opacity: 1; }
}`,
  },

  // 24. vfx-fade-right
  {
    id: "vfx-fade-right",
    name: "VFX Fade Right",
    category: "animations",
    description:
      "Element fades in while sliding in from the left toward the right. Runs once on load.",
    tags: ["entrance", "fade", "right", "slide", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Fade Right */
.roycss-vfx-fade-right {
  animation: roy-vfx-fade-right 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: transform, opacity;
}
@keyframes roy-vfx-fade-right {
  0%   { opacity: 0; transform: translateX(-36px); }
  100% { opacity: 1; transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-fade-right { animation: none; opacity: 1; }
}`,
  },

  // 25. vfx-scale-in
  {
    id: "vfx-scale-in",
    name: "VFX Scale In",
    category: "animations",
    description:
      "Element fades in while scaling up from 80% — a soft zoom-in entrance. Runs once on load.",
    tags: ["entrance", "scale", "zoom", "fade", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Scale In */
.roycss-vfx-scale-in {
  animation: roy-vfx-scale-in 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: transform, opacity;
}
@keyframes roy-vfx-scale-in {
  0%   { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-scale-in { animation: none; opacity: 1; }
}`,
  },

  // 26. vfx-slide-reveal
  {
    id: "vfx-slide-reveal",
    name: "VFX Slide Reveal",
    category: "animations",
    description:
      "Element reveals via an animated clip-path wipe from left to right — a clean editorial slide-in.",
    tags: ["entrance", "slide", "reveal", "clip-path", "wipe", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Slide Reveal */
.roycss-vfx-slide-reveal {
  animation: roy-vfx-slide-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: clip-path, transform;
}
@keyframes roy-vfx-slide-reveal {
  0%   {
    clip-path: inset(0 100% 0 0);
    transform: translateX(-16px);
    opacity: 0;
  }
  60%  { opacity: 1; }
  100% {
    clip-path: inset(0 0 0 0);
    transform: translateX(0);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-slide-reveal { animation: none; opacity: 1; clip-path: none; }
}`,
  },

  // 27. vfx-clip-path-reveal
  {
    id: "vfx-clip-path-reveal",
    name: "VFX Clip-Path Reveal",
    category: "animations",
    description:
      "Element appears via an expanding circular clip-path — a mask wipe from the center outward.",
    tags: ["entrance", "clip-path", "circle", "reveal", "mask", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Clip-Path Reveal */
.roycss-vfx-clip-path-reveal {
  animation: roy-vfx-clip-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: clip-path, opacity;
}
@keyframes roy-vfx-clip-reveal {
  0% {
    clip-path: circle(0% at 50% 50%);
    opacity: 0;
  }
  60% { opacity: 1; }
  100% {
    clip-path: circle(75% at 50% 50%);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-clip-path-reveal { animation: none; opacity: 1; clip-path: none; }
}`,
  },

  // 28. vfx-flip-in
  {
    id: "vfx-flip-in",
    name: "VFX Flip In",
    category: "animations",
    description:
      "Element flips in along the Y axis with a fade — a 3D card-flip entrance.",
    tags: ["entrance", "flip", "3d", "rotate-y", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Flip In */
.roycss-vfx-flip-in {
  transform-origin: center;
  animation: roy-vfx-flip-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: transform, opacity;
}
@keyframes roy-vfx-flip-in {
  0% {
    opacity: 0;
    transform: perspective(800px) rotateY(90deg) translateZ(-40px);
  }
  100% {
    opacity: 1;
    transform: perspective(800px) rotateY(0deg) translateZ(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-flip-in { animation: none; opacity: 1; }
}`,
  },

  // 29. vfx-elastic-in
  {
    id: "vfx-elastic-in",
    name: "VFX Elastic In",
    category: "animations",
    description:
      "Element springs in with an elastic cubic-bezier overshoot, scaling from 0 to 1 with a bouncy settle.",
    tags: ["entrance", "elastic", "spring", "bounce", "scale", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Elastic In */
.roycss-vfx-elastic-in {
  animation: roy-vfx-elastic-in 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
  will-change: transform, opacity;
}
@keyframes roy-vfx-elastic-in {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-12deg);
  }
  60% {
    opacity: 1;
    transform: scale(1.12) rotate(2deg);
  }
  80% {
    transform: scale(0.96) rotate(-1deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-elastic-in { animation: none; opacity: 1; }
}`,
  },

  // 30. vfx-stagger-fade
  {
    id: "vfx-stagger-fade",
    name: "VFX Stagger Fade",
    category: "animations",
    description:
      "Parent fades up; up to 8 children fade in sequentially with animation-delay — a pure-CSS staggered list entrance.",
    tags: ["entrance", "stagger", "fade", "list", "delay", "vfx"],
    previewType: "box",
    cssCode: `/* VFX Stagger Fade — apply .roycss-vfx-stagger-fade to a container; up to 8 children stagger in */
.roycss-vfx-stagger-fade {
  animation: roy-vfx-stagger-fade 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.roycss-vfx-stagger-fade > * {
  opacity: 0;
  animation: roy-vfx-stagger-child 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  will-change: transform, opacity;
}
.roycss-vfx-stagger-fade > *:nth-child(1) { animation-delay: 0.10s; }
.roycss-vfx-stagger-fade > *:nth-child(2) { animation-delay: 0.20s; }
.roycss-vfx-stagger-fade > *:nth-child(3) { animation-delay: 0.30s; }
.roycss-vfx-stagger-fade > *:nth-child(4) { animation-delay: 0.40s; }
.roycss-vfx-stagger-fade > *:nth-child(5) { animation-delay: 0.50s; }
.roycss-vfx-stagger-fade > *:nth-child(6) { animation-delay: 0.60s; }
.roycss-vfx-stagger-fade > *:nth-child(7) { animation-delay: 0.70s; }
.roycss-vfx-stagger-fade > *:nth-child(8) { animation-delay: 0.80s; }
@keyframes roy-vfx-stagger-fade {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes roy-vfx-stagger-child {
  0%   { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-stagger-fade,
  .roycss-vfx-stagger-fade > * { animation: none; opacity: 1; }
}`,
  },
];
