import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 8 — Visual Effects (28)
 * Advanced CSS visual effects: holographic, metallic, chrome, border-beam,
 * aurora borders, prism, foil, iridescent, glitch, neon, frost, shimmer, etc.
 *
 * Every class name uses the `roycss-` prefix.
 * Every @keyframes uses the `roy-` prefix and is unique within this file
 * (all start with `roy-visual-` to guarantee no collisions with batches 1–4).
 * Each `cssCode` is self-contained (class + any @keyframes / @property).
 *
 * Preview rendering notes:
 * - previewType "box" → outer div has Tailwind w-20 h-20 bg-gradient-to-br;
 *   our CSS overrides width/height/background so the surface effect is visible.
 *   The injected inner 6×6 div is hidden via `> div { display: none }` where
 *   it would otherwise intrude on the visual.
 * - previewType "text" → single span with text; used for gradient-text.
 * - previewType "background" → full-bleed div; used for gradient-mesh.
 */
export const effectsBatch8: CSSEffect[] = [
  // 1 ─ Border Beam ───────────────────────────────────────────────
  {
    id: "visual-border-beam",
    name: "Border Beam",
    category: "visual",
    description: "A glowing beam of light traveling around the element border",
    tags: ["border", "beam", "glow", "light"],
    previewType: "box",
    cssCode: `/* Border Beam */
@property --roy-vbb-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.roycss-visual-border-beam {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: #0f172a;
  border: none;
  overflow: hidden;
}

.roycss-visual-border-beam > div { display: none; }

.roycss-visual-border-beam::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 2px;
  background: conic-gradient(
    from var(--roy-vbb-angle),
    transparent 0deg,
    #10b981 30deg,
    #34d399 50deg,
    transparent 90deg,
    transparent 360deg
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: roy-visual-border-beam 3s linear infinite;
}

.roycss-visual-border-beam::after {
  content: 'BEAM';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #34d399;
  font: 700 13px/1 system-ui, sans-serif;
  letter-spacing: 0.25em;
  text-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
}

@keyframes roy-visual-border-beam {
  to { --roy-vbb-angle: 360deg; }
}`,
  },

  // 2 ─ Aurora Border ─────────────────────────────────────────────
  {
    id: "visual-aurora-border",
    name: "Aurora Border",
    category: "visual",
    description: "Animated aurora-colored gradient border that shifts through neon hues",
    tags: ["aurora", "border", "gradient", "neon"],
    previewType: "box",
    cssCode: `/* Aurora Border */
.roycss-visual-aurora-border {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: #0b1026;
  border: none;
  overflow: hidden;
}

.roycss-visual-aurora-border > div { display: none; }

.roycss-visual-aurora-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(
    120deg,
    #22d3ee 0%,
    #a855f7 25%,
    #ec4899 50%,
    #22d3ee 75%,
    #a855f7 100%
  );
  background-size: 300% 300%;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: roy-visual-aurora-border 6s ease infinite;
}

.roycss-visual-aurora-border::after {
  content: 'AURORA';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #e0e7ff;
  font: 600 13px/1 system-ui, sans-serif;
  letter-spacing: 0.25em;
}

@keyframes roy-visual-aurora-border {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`,
  },

  // 3 ─ Inner Glow ────────────────────────────────────────────────
  {
    id: "visual-inner-glow",
    name: "Inner Glow",
    category: "visual",
    description: "Pulsing inset glow that radiates from inside the surface",
    tags: ["inner", "glow", "inset", "pulse"],
    previewType: "box",
    cssCode: `/* Inner Glow */
.roycss-visual-inner-glow {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: #0f172a;
  border: none;
  animation: roy-visual-inner-glow 2.6s ease-in-out infinite;
}

.roycss-visual-inner-glow > div { display: none; }

@keyframes roy-visual-inner-glow {
  0%, 100% {
    box-shadow:
      inset 0 0 20px rgba(16, 185, 129, 0.3),
      inset 0 0 40px rgba(16, 185, 129, 0.1);
  }
  50% {
    box-shadow:
      inset 0 0 50px rgba(16, 185, 129, 0.7),
      inset 0 0 100px rgba(16, 185, 129, 0.35);
  }
}`,
  },

  // 4 ─ Shadow Pulse ──────────────────────────────────────────────
  {
    id: "visual-shadow-pulse",
    name: "Shadow Pulse",
    category: "visual",
    description: "A colored drop shadow that breathes in and out around the element",
    tags: ["shadow", "pulse", "breath", "glow"],
    previewType: "box",
    cssCode: `/* Shadow Pulse */
.roycss-visual-shadow-pulse {
  width: 140px;
  height: 100px;
  border-radius: 14px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border: none;
  animation: roy-visual-shadow-pulse 2s ease-in-out infinite;
}

.roycss-visual-shadow-pulse > div { display: none; }

@keyframes roy-visual-shadow-pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 14px 38px rgba(236, 72, 153, 0.6);
    transform: scale(1.04);
  }
}`,
  },

  // 5 ─ Holographic ───────────────────────────────────────────────
  {
    id: "visual-holographic",
    name: "Holographic Surface",
    category: "visual",
    description: "Iridescent holographic surface with shifting rainbow gradient and shine sweep",
    tags: ["holographic", "iridescent", "rainbow", "shine"],
    previewType: "box",
    cssCode: `/* Holographic Surface */
.roycss-visual-holographic {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(
    115deg,
    #ff0080 0%,
    #ff8a00 14%,
    #ffe600 28%,
    #00ff96 42%,
    #00d4ff 56%,
    #6f00ff 70%,
    #ff00d4 84%,
    #ff0080 100%
  );
  background-size: 300% 300%;
  overflow: hidden;
  animation: roy-visual-holographic-shift 6s ease infinite;
}

.roycss-visual-holographic > div { display: none; }

.roycss-visual-holographic::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 30%,
    rgba(255, 255, 255, 0.5) 50%,
    transparent 70%
  );
  background-size: 200% 100%;
  animation: roy-visual-holographic-shine 3s linear infinite;
}

@keyframes roy-visual-holographic-shift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

@keyframes roy-visual-holographic-shine {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}`,
  },

  // 6 ─ Metallic ──────────────────────────────────────────────────
  {
    id: "visual-metallic",
    name: "Brushed Metallic",
    category: "visual",
    description: "Brushed metal surface with vertical highlights and a sweeping light streak",
    tags: ["metallic", "metal", "brushed", "steel"],
    previewType: "box",
    cssCode: `/* Brushed Metallic Surface */
.roycss-visual-metallic {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background:
    linear-gradient(
      180deg,
      #f5f5f5 0%,
      #d0d0d8 14%,
      #a0a0a8 28%,
      #808088 42%,
      #c0c0c8 58%,
      #f0f0f5 74%,
      #b0b0b8 88%,
      #d0d0d8 100%
    );
  overflow: hidden;
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.7),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
}

.roycss-visual-metallic > div { display: none; }

.roycss-visual-metallic::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06) 0px,
    rgba(0, 0, 0, 0.06) 1px,
    rgba(255, 255, 255, 0.06) 2px
  );
  mix-blend-mode: overlay;
}

.roycss-visual-metallic::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  animation: roy-visual-metallic 4s ease-in-out infinite;
}

@keyframes roy-visual-metallic {
  0%, 100% { left: -100%; }
  50%      { left: 200%; }
}`,
  },

  // 7 ─ Chrome ────────────────────────────────────────────────────
  {
    id: "visual-chrome",
    name: "Chrome Surface",
    category: "visual",
    description: "Mirror-like chrome reflective surface with multi-stop gradients and moving highlight",
    tags: ["chrome", "reflective", "mirror", "metal"],
    previewType: "box",
    cssCode: `/* Chrome Reflective Surface */
.roycss-visual-chrome {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(
    180deg,
    #fefefe 0%,
    #c8c8d0 10%,
    #888890 20%,
    #d8d8e0 30%,
    #f8f8fc 45%,
    #a0a0a8 55%,
    #686870 65%,
    #d0d0d8 75%,
    #f0f0f5 85%,
    #b0b0b8 95%,
    #808088 100%
  );
  overflow: hidden;
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.7),
    inset 0 -2px 4px rgba(0, 0, 0, 0.35);
}

.roycss-visual-chrome > div { display: none; }

.roycss-visual-chrome::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.85),
    transparent
  );
  animation: roy-visual-chrome 5s ease-in-out infinite;
}

@keyframes roy-visual-chrome {
  0%, 100% { left: -50%; }
  50%      { left: 100%; }
}`,
  },

  // 8 ─ Liquid Fill ───────────────────────────────────────────────
  {
    id: "visual-liquid-fill",
    name: "Liquid Fill",
    category: "visual",
    description: "Animated liquid waves rising and falling inside the container",
    tags: ["liquid", "water", "wave", "fill"],
    previewType: "box",
    cssCode: `/* Liquid Fill */
.roycss-visual-liquid-fill {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: #0f172a;
  border: none;
  overflow: hidden;
}

.roycss-visual-liquid-fill > div { display: none; }

.roycss-visual-liquid-fill::before,
.roycss-visual-liquid-fill::after {
  content: '';
  position: absolute;
  left: -50%;
  width: 200%;
  height: 50%;
  bottom: 0;
  background-repeat: repeat-x;
  background-size: 100px 40px;
}

.roycss-visual-liquid-fill::before {
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40' preserveAspectRatio='none'%3E%3Cpath d='M0,20 Q25,0 50,20 T100,20 L100,40 L0,40 Z' fill='%2306b6d4'/%3E%3C/svg%3E");
  animation: roy-visual-liquid-wave 2.4s linear infinite;
}

.roycss-visual-liquid-fill::after {
  bottom: 4px;
  height: 46%;
  opacity: 0.55;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40' preserveAspectRatio='none'%3E%3Cpath d='M0,20 Q25,40 50,20 T100,20 L100,40 L0,40 Z' fill='%2322d3ee'/%3E%3C/svg%3E");
  animation: roy-visual-liquid-wave 1.8s linear infinite reverse;
}

@keyframes roy-visual-liquid-wave {
  from { transform: translateX(0); }
  to   { transform: translateX(100px); }
}`,
  },

  // 9 ─ Gradient Text Animated ────────────────────────────────────
  {
    id: "visual-gradient-text-animated",
    name: "Animated Gradient Text",
    category: "visual",
    description: "A flowing rainbow gradient that animates continuously through the text",
    tags: ["gradient", "text", "animated", "rainbow"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Animated Gradient Text */
.roycss-visual-gradient-text-animated {
  background: linear-gradient(
    90deg,
    #ef4444,
    #f59e0b,
    #eab308,
    #22c55e,
    #06b6d4,
    #3b82f6,
    #8b5cf6,
    #ec4899,
    #ef4444
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: roy-visual-gradient-text-animated 4s linear infinite;
}

@keyframes roy-visual-gradient-text-animated {
  to { background-position: 200% center; }
}`,
  },

  // 10 ─ Gradient Mesh ────────────────────────────────────────────
  {
    id: "visual-gradient-mesh",
    name: "Animated Mesh Gradient",
    category: "visual",
    description: "A flowing multi-color mesh gradient that drifts organically across the surface",
    tags: ["mesh", "gradient", "background", "flowing"],
    previewType: "background",
    cssCode: `/* Animated Mesh Gradient */
.roycss-visual-gradient-mesh {
  background:
    radial-gradient(at 20% 20%, #ec4899 0px, transparent 50%),
    radial-gradient(at 80% 0%,  #f59e0b 0px, transparent 50%),
    radial-gradient(at 0% 50%,  #8b5cf6 0px, transparent 50%),
    radial-gradient(at 80% 80%, #06b6d4 0px, transparent 50%),
    radial-gradient(at 50% 100%, #22c55e 0px, transparent 50%),
    #0f172a;
  background-size: 200% 200%;
  animation: roy-visual-gradient-mesh 10s ease-in-out infinite;
}

@keyframes roy-visual-gradient-mesh {
  0%, 100% { background-position: 0% 0%; }
  25%      { background-position: 100% 50%; }
  50%      { background-position: 50% 100%; }
  75%      { background-position: 0% 50%; }
}`,
  },

  // 11 ─ Image Distortion ─────────────────────────────────────────
  {
    id: "visual-image-distortion",
    name: "Distortion Wobble",
    category: "visual",
    description: "A wobble distortion effect using blur and skew transforms that ripples the surface",
    tags: ["distortion", "wobble", "skew", "blur"],
    previewType: "box",
    cssCode: `/* Distortion Wobble */
.roycss-visual-image-distortion {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6, #06b6d4);
  animation: roy-visual-image-distortion 2.4s ease-in-out infinite;
}

.roycss-visual-image-distortion > div { display: none; }

@keyframes roy-visual-image-distortion {
  0%, 100% {
    filter: blur(0px);
    transform: skew(0deg, 0deg) scale(1);
  }
  20% {
    filter: blur(0.5px);
    transform: skew(2deg, 1deg) scale(1.01);
  }
  40% {
    filter: blur(1px);
    transform: skew(-2deg, -1deg) scale(0.99);
  }
  60% {
    filter: blur(0.5px);
    transform: skew(1deg, 2deg) scale(1.01);
  }
  80% {
    filter: blur(0px);
    transform: skew(-1deg, -2deg) scale(1);
  }
}`,
  },

  // 12 ─ Pixelate ─────────────────────────────────────────────────
  {
    id: "visual-pixelate",
    name: "Pixelate Grid",
    category: "visual",
    description: "A pixel grid overlay that breathes between chunky and fine resolutions",
    tags: ["pixelate", "pixel", "grid", "retro"],
    previewType: "box",
    cssCode: `/* Pixelate Grid */
.roycss-visual-pixelate {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6, #06b6d4);
  overflow: hidden;
}

.roycss-visual-pixelate > div { display: none; }

.roycss-visual-pixelate::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.25) 50%, transparent 50%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.25) 50%, transparent 50%);
  background-size: 12px 12px, 12px 12px;
  mix-blend-mode: overlay;
  animation: roy-visual-pixelate 1.4s steps(4) infinite;
}

@keyframes roy-visual-pixelate {
  0%   { background-size: 12px 12px, 12px 12px; }
  25%  { background-size: 6px 6px, 6px 6px; }
  50%  { background-size: 24px 24px, 24px 24px; }
  75%  { background-size: 4px 4px, 4px 4px; }
  100% { background-size: 12px 12px, 12px 12px; }
}`,
  },

  // 13 ─ Frost Blur ───────────────────────────────────────────────
  {
    id: "visual-frost-blur",
    name: "Frost Blur",
    category: "visual",
    description: "Heavy frosted glass overlay with crystalline pattern over a vibrant surface",
    tags: ["frost", "blur", "glass", "crystal"],
    previewType: "box",
    cssCode: `/* Frost Blur Overlay */
.roycss-visual-frost-blur {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background:
    radial-gradient(circle at 30% 30%, #06b6d4 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, #ec4899 0%, transparent 50%),
    linear-gradient(135deg, #8b5cf6, #f59e0b);
  overflow: hidden;
}

.roycss-visual-frost-blur > div { display: none; }

.roycss-visual-frost-blur::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  border-radius: inherit;
}

.roycss-visual-frost-blur::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.08) 0px,
      rgba(255, 255, 255, 0.08) 1px,
      transparent 1px,
      transparent 3px
    ),
    repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.08) 0px,
      rgba(255, 255, 255, 0.08) 1px,
      transparent 1px,
      transparent 3px
    );
  border-radius: inherit;
  mix-blend-mode: overlay;
}`,
  },

  // 14 ─ Spotlight Follow ─────────────────────────────────────────
  {
    id: "visual-spotlight-follow",
    name: "Spotlight Follow",
    category: "visual",
    description: "A radial spotlight that moves across the dark surface in a looping path",
    tags: ["spotlight", "radial", "follow", "light"],
    previewType: "box",
    cssCode: `/* Spotlight Follow */
@property --roy-vsf-x {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 20%;
}
@property --roy-vsf-y {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 30%;
}

.roycss-visual-spotlight-follow {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: #0a0a0f;
  border: none;
  overflow: hidden;
}

.roycss-visual-spotlight-follow > div { display: none; }

.roycss-visual-spotlight-follow::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle 70px at var(--roy-vsf-x) var(--roy-vsf-y),
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.1) 40%,
    transparent 70%
  );
  animation: roy-visual-spotlight-follow 5s ease-in-out infinite;
}

@keyframes roy-visual-spotlight-follow {
  0%   { --roy-vsf-x: 20%; --roy-vsf-y: 30%; }
  25%  { --roy-vsf-x: 80%; --roy-vsf-y: 30%; }
  50%  { --roy-vsf-x: 80%; --roy-vsf-y: 70%; }
  75%  { --roy-vsf-x: 20%; --roy-vsf-y: 70%; }
  100% { --roy-vsf-x: 20%; --roy-vsf-y: 30%; }
}`,
  },

  // 15 ─ Mask Fade ────────────────────────────────────────────────
  {
    id: "visual-mask-fade",
    name: "Mask Fade Reveal",
    category: "visual",
    description: "A mask-image gradient that sweeps vertically to reveal and fade the surface",
    tags: ["mask", "fade", "reveal", "gradient"],
    previewType: "box",
    cssCode: `/* Mask Fade Reveal */
.roycss-visual-mask-fade {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4);
  -webkit-mask: linear-gradient(180deg, transparent 0%, #000 50%, transparent 100%) no-repeat;
  mask: linear-gradient(180deg, transparent 0%, #000 50%, transparent 100%) no-repeat;
  -webkit-mask-size: 100% 200%;
  mask-size: 100% 200%;
  animation: roy-visual-mask-fade 3s ease-in-out infinite alternate;
}

.roycss-visual-mask-fade > div { display: none; }

@keyframes roy-visual-mask-fade {
  from {
    -webkit-mask-position: 0% 0%;
    mask-position: 0% 0%;
  }
  to {
    -webkit-mask-position: 0% 100%;
    mask-position: 0% 100%;
  }
}`,
  },

  // 16 ─ Blend Mode Overlay ───────────────────────────────────────
  {
    id: "visual-blend-mode-overlay",
    name: "Blend Mode Overlay",
    category: "visual",
    description: "Two colored blobs with screen blend mode that drift across a dark surface",
    tags: ["blend", "screen", "color", "overlay"],
    previewType: "box",
    cssCode: `/* Blend Mode Overlay */
.roycss-visual-blend-mode-overlay {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  overflow: hidden;
}

.roycss-visual-blend-mode-overlay > div { display: none; }

.roycss-visual-blend-mode-overlay::before,
.roycss-visual-blend-mode-overlay::after {
  content: '';
  position: absolute;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  filter: blur(22px);
  mix-blend-mode: screen;
}

.roycss-visual-blend-mode-overlay::before {
  top: -25px;
  left: -25px;
  background: #ec4899;
  animation: roy-visual-blend-mode-1 5s ease-in-out infinite alternate;
}

.roycss-visual-blend-mode-overlay::after {
  bottom: -25px;
  right: -25px;
  background: #06b6d4;
  animation: roy-visual-blend-mode-2 5s ease-in-out infinite alternate;
}

@keyframes roy-visual-blend-mode-1 {
  0%   { transform: translate(0, 0); }
  100% { transform: translate(90px, 70px); }
}

@keyframes roy-visual-blend-mode-2 {
  0%   { transform: translate(0, 0); }
  100% { transform: translate(-90px, -70px); }
}`,
  },

  // 17 ─ Backdrop Blur Heavy ──────────────────────────────────────
  {
    id: "visual-backdrop-blur-heavy",
    name: "Heavy Backdrop Blur",
    category: "visual",
    description: "An extreme backdrop-blur frosted panel floating over a vivid gradient",
    tags: ["backdrop", "blur", "frost", "glass"],
    previewType: "box",
    cssCode: `/* Heavy Backdrop Blur */
.roycss-visual-backdrop-blur-heavy {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background:
    radial-gradient(circle at 20% 30%, #ec4899 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, #06b6d4 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, #f59e0b 0%, transparent 50%),
    linear-gradient(135deg, #8b5cf6, #10b981);
  overflow: hidden;
}

.roycss-visual-backdrop-blur-heavy > div { display: none; }

.roycss-visual-backdrop-blur-heavy::before {
  content: '';
  position: absolute;
  inset: 15px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 10px;
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}`,
  },

  // 18 ─ Color Shift ──────────────────────────────────────────────
  {
    id: "visual-color-shift",
    name: "Color Shift",
    category: "visual",
    description: "A smooth continuous hue-rotation cycling through the entire color spectrum",
    tags: ["color", "shift", "hue", "cycle"],
    previewType: "box",
    cssCode: `/* Color Shift */
.roycss-visual-color-shift {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  animation: roy-visual-color-shift 6s linear infinite;
}

.roycss-visual-color-shift > div { display: none; }

@keyframes roy-visual-color-shift {
  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(360deg); }
}`,
  },

  // 19 ─ Hue Rotate Loop ──────────────────────────────────────────
  {
    id: "visual-hue-rotate-loop",
    name: "Hue Rotate Loop",
    category: "visual",
    description: "A vivid rainbow conic gradient with continuous hue rotation looping forever",
    tags: ["hue", "rotate", "rainbow", "loop"],
    previewType: "box",
    cssCode: `/* Hue Rotate Loop */
.roycss-visual-hue-rotate-loop {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: conic-gradient(
    from 0deg,
    #ef4444,
    #f59e0b,
    #eab308,
    #22c55e,
    #06b6d4,
    #3b82f6,
    #8b5cf6,
    #ec4899,
    #ef4444
  );
  animation: roy-visual-hue-rotate-loop 4s linear infinite;
}

.roycss-visual-hue-rotate-loop > div { display: none; }

@keyframes roy-visual-hue-rotate-loop {
  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(360deg); }
}`,
  },

  // 20 ─ Saturation Pulse ─────────────────────────────────────────
  {
    id: "visual-saturation-pulse",
    name: "Saturation Pulse",
    category: "visual",
    description: "Filter saturation pulsing between grayscale and oversaturated on a gradient",
    tags: ["saturation", "pulse", "filter", "vivid"],
    previewType: "box",
    cssCode: `/* Saturation Pulse */
.roycss-visual-saturation-pulse {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #ec4899, #f59e0b, #06b6d4);
  animation: roy-visual-saturation-pulse 2.4s ease-in-out infinite;
}

.roycss-visual-saturation-pulse > div { display: none; }

@keyframes roy-visual-saturation-pulse {
  0%, 100% { filter: saturate(0); }
  50%      { filter: saturate(2.6); }
}`,
  },

  // 21 ─ Glass Reflection ─────────────────────────────────────────
  {
    id: "visual-glass-reflection",
    name: "Glass Reflection",
    category: "visual",
    description: "Frosted glass surface with a diagonal light reflection sweeping across it",
    tags: ["glass", "reflection", "light", "frost"],
    previewType: "box",
    cssCode: `/* Glass Reflection */
.roycss-visual-glass-reflection {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background:
    radial-gradient(circle at 30% 30%, #ec4899 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, #06b6d4 0%, transparent 50%),
    linear-gradient(135deg, #8b5cf6, #f59e0b);
  overflow: hidden;
}

.roycss-visual-glass-reflection > div { display: none; }

.roycss-visual-glass-reflection::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: inherit;
}

.roycss-visual-glass-reflection::after {
  content: '';
  position: absolute;
  top: -100%;
  left: -50%;
  width: 50%;
  height: 300%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.7),
    transparent
  );
  transform: rotate(25deg);
  animation: roy-visual-glass-reflection 3.2s ease-in-out infinite;
}

@keyframes roy-visual-glass-reflection {
  0%, 100% { left: -50%; }
  50%      { left: 120%; }
}`,
  },

  // 22 ─ Noise Overlay ────────────────────────────────────────────
  {
    id: "visual-noise-overlay",
    name: "Animated Noise Overlay",
    category: "visual",
    description: "Animated film grain / fractal noise overlay that jitters across the surface",
    tags: ["noise", "grain", "film", "static"],
    previewType: "box",
    cssCode: `/* Animated Noise Overlay */
.roycss-visual-noise-overlay {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  overflow: hidden;
}

.roycss-visual-noise-overlay > div { display: none; }

.roycss-visual-noise-overlay::before {
  content: '';
  position: absolute;
  inset: -10px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  opacity: 0.55;
  mix-blend-mode: screen;
  animation: roy-visual-noise-overlay 0.6s steps(4) infinite;
}

.roycss-visual-noise-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.25), transparent 60%);
  mix-blend-mode: overlay;
}

@keyframes roy-visual-noise-overlay {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-6px, 4px); }
  50%  { transform: translate(5px, -5px); }
  75%  { transform: translate(-4px, -4px); }
  100% { transform: translate(0, 0); }
}`,
  },

  // 23 ─ Shimmer Sweep ────────────────────────────────────────────
  {
    id: "visual-shimmer-sweep",
    name: "Shimmer Sweep",
    category: "visual",
    description: "A diagonal shimmering light band sweeping across a dark surface",
    tags: ["shimmer", "sweep", "light", "shine"],
    previewType: "box",
    cssCode: `/* Shimmer Sweep */
.roycss-visual-shimmer-sweep {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #1e293b, #334155);
  overflow: hidden;
}

.roycss-visual-shimmer-sweep > div { display: none; }

.roycss-visual-shimmer-sweep::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    100deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 35%,
    rgba(255, 255, 255, 0.55) 50%,
    rgba(255, 255, 255, 0.08) 65%,
    transparent 100%
  );
  animation: roy-visual-shimmer-sweep 2.6s ease-in-out infinite;
}

.roycss-visual-shimmer-sweep::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(16, 185, 129, 0.15) 50%, transparent 60%);
  mix-blend-mode: overlay;
}

@keyframes roy-visual-shimmer-sweep {
  0%   { left: -100%; }
  100% { left: 100%; }
}`,
  },

  // 24 ─ Iridescent ───────────────────────────────────────────────
  {
    id: "visual-iridescent",
    name: "Iridescent Shimmer",
    category: "visual",
    description: "Iridescent rainbow shimmer with rotating conic gradient and overlay stripes",
    tags: ["iridescent", "rainbow", "shimmer", "pearl"],
    previewType: "box",
    cssCode: `/* Iridescent Shimmer */
.roycss-visual-iridescent {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: conic-gradient(
    from 0deg at 50% 50%,
    #ff0080,
    #ff8a00,
    #ffe600,
    #00ff96,
    #00d4ff,
    #6f00ff,
    #ff00d4,
    #ff0080
  );
  animation: roy-visual-iridescent 8s linear infinite;
  overflow: hidden;
}

.roycss-visual-iridescent > div { display: none; }

.roycss-visual-iridescent::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0px,
    rgba(255, 255, 255, 0.12) 4px,
    transparent 4px,
    transparent 8px
  );
  mix-blend-mode: overlay;
}

.roycss-visual-iridescent::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.35) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: roy-visual-iridescent-shine 3s linear infinite;
}

@keyframes roy-visual-iridescent {
  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(360deg); }
}

@keyframes roy-visual-iridescent-shine {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}`,
  },

  // 25 ─ Neon Pulse ───────────────────────────────────────────────
  {
    id: "visual-neon-pulse",
    name: "Neon Pulse",
    category: "visual",
    description: "A neon pink glow that pulses in and out around the border",
    tags: ["neon", "pulse", "glow", "pink"],
    previewType: "box",
    cssCode: `/* Neon Pulse */
.roycss-visual-neon-pulse {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: #0a0a0f;
  border: 2px solid #ec4899;
  animation: roy-visual-neon-pulse 1.6s ease-in-out infinite;
}

.roycss-visual-neon-pulse > div { display: none; }

@keyframes roy-visual-neon-pulse {
  0%, 100% {
    box-shadow:
      0 0 6px #ec4899,
      0 0 12px #ec4899,
      0 0 24px #ec4899,
      inset 0 0 8px #ec4899,
      inset 0 0 16px rgba(236, 72, 153, 0.5);
    border-color: #ec4899;
  }
  50% {
    box-shadow:
      0 0 16px #ec4899,
      0 0 36px #ec4899,
      0 0 60px #ec4899,
      inset 0 0 18px #ec4899,
      inset 0 0 36px rgba(236, 72, 153, 0.75);
    border-color: #f472b6;
  }
}`,
  },

  // 26 ─ Glitch Distort ───────────────────────────────────────────
  {
    id: "visual-glitch-distort",
    name: "Glitch Distort",
    category: "visual",
    description: "RGB channel-split glitch with stepped clip-path distortion layers",
    tags: ["glitch", "distort", "rgb", "split"],
    previewType: "box",
    cssCode: `/* Glitch Distort */
.roycss-visual-glitch-distort {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4);
  overflow: hidden;
}

.roycss-visual-glitch-distort > div { display: none; }

.roycss-visual-glitch-distort::before,
.roycss-visual-glitch-distort::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  mix-blend-mode: screen;
}

.roycss-visual-glitch-distort::before {
  background: linear-gradient(135deg, #ff003c, #ff003c, #06b6d4);
  animation: roy-visual-glitch-1 1.5s steps(2) infinite;
}

.roycss-visual-glitch-distort::after {
  background: linear-gradient(135deg, #00fff0, #ec4899, #00fff0);
  animation: roy-visual-glitch-2 1.7s steps(2) infinite;
}

@keyframes roy-visual-glitch-1 {
  0%, 100% { clip-path: inset(0 0 95% 0);  transform: translate(0); }
  20%      { clip-path: inset(20% 0 60% 0); transform: translate(-4px, 2px); }
  40%      { clip-path: inset(50% 0 30% 0); transform: translate(4px, -2px); }
  60%      { clip-path: inset(70% 0 10% 0); transform: translate(-3px, 1px); }
  80%      { clip-path: inset(10% 0 80% 0); transform: translate(3px, -3px); }
}

@keyframes roy-visual-glitch-2 {
  0%, 100% { clip-path: inset(95% 0 0 0);  transform: translate(0); }
  25%      { clip-path: inset(40% 0 30% 0); transform: translate(4px, -2px); }
  50%      { clip-path: inset(60% 0 10% 0); transform: translate(-4px, 2px); }
  75%      { clip-path: inset(20% 0 60% 0); transform: translate(3px, -3px); }
}`,
  },

  // 27 ─ Prism ────────────────────────────────────────────────────
  {
    id: "visual-prism",
    name: "Prism Split",
    category: "visual",
    description: "A rotating triangular prism splitting white light into a rainbow conic spectrum",
    tags: ["prism", "rainbow", "split", "spectrum"],
    previewType: "box",
    cssCode: `/* Prism Split */
.roycss-visual-prism {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0a0a0f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.roycss-visual-prism > div { display: none; }

.roycss-visual-prism::before,
.roycss-visual-prism::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90px;
  height: 90px;
  background: conic-gradient(
    from 0deg,
    #ef4444,
    #f59e0b,
    #eab308,
    #22c55e,
    #06b6d4,
    #3b82f6,
    #8b5cf6,
    #ec4899,
    #ef4444
  );
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  transform-origin: 50% 60%;
}

.roycss-visual-prism::before {
  filter: blur(2px);
  animation: roy-visual-prism 4s linear infinite;
}

.roycss-visual-prism::after {
  filter: blur(10px);
  opacity: 0.55;
  animation: roy-visual-prism 4s linear infinite reverse;
}

@keyframes roy-visual-prism {
  from { transform: translate(-50%, -55%) rotate(0deg); }
  to   { transform: translate(-50%, -55%) rotate(360deg); }
}`,
  },

  // 28 ─ Foil ─────────────────────────────────────────────────────
  {
    id: "visual-foil",
    name: "Foil Mylar",
    category: "visual",
    description: "Crinkled metallic foil / mylar balloon effect with diagonal creases and moving shine",
    tags: ["foil", "mylar", "metallic", "crinkle"],
    previewType: "box",
    cssCode: `/* Foil Mylar */
.roycss-visual-foil {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background:
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.12) 0px,
      rgba(255, 255, 255, 0.12) 2px,
      transparent 2px,
      transparent 5px
    ),
    repeating-linear-gradient(
      -45deg,
      rgba(0, 0, 0, 0.12) 0px,
      rgba(0, 0, 0, 0.12) 2px,
      transparent 2px,
      transparent 5px
    ),
    linear-gradient(
      135deg,
      #f0f0f5 0%,
      #c0c0d0 25%,
      #f8f8ff 50%,
      #b0b0c0 75%,
      #e8e8f0 100%
    );
  background-size: 8px 8px, 8px 8px, 100% 100%;
  overflow: hidden;
  animation: roy-visual-foil-hue 6s ease-in-out infinite;
  box-shadow:
    inset 0 2px 6px rgba(255, 255, 255, 0.7),
    inset 0 -2px 6px rgba(0, 0, 0, 0.25);
}

.roycss-visual-foil > div { display: none; }

.roycss-visual-foil::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    60deg,
    transparent 30%,
    rgba(255, 255, 255, 0.7) 50%,
    transparent 70%
  );
  background-size: 200% 100%;
  animation: roy-visual-foil-shine 3s linear infinite;
}

@keyframes roy-visual-foil-hue {
  0%, 100% { filter: hue-rotate(0deg); }
  50%      { filter: hue-rotate(70deg); }
}

@keyframes roy-visual-foil-shine {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}`,
  },
];
