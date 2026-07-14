import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 2 — 70 effects across 3 categories:
 *   - 25 backgrounds (6 existing + 19 new)
 *   - 25 loaders      (5 existing + 20 new)
 *   - 20 3D transforms (4 existing + 16 new)
 *
 * Every CSS class is prefixed with `roycss-` and every keyframe with `roy-`.
 * Each `cssCode` is self-contained (class definition + any @keyframes).
 */
export const effectsBatch2: CSSEffect[] = [
  // ─── BACKGROUNDS (25) ───────────────────────────────────────────
  {
    id: "bg-animated-gradient",
    name: "Animated Gradient",
    category: "backgrounds",
    description: "A slowly morphing gradient background with shifting colors",
    tags: ["gradient", "animated", "background", "morph"],
    previewType: "background",
    cssCode: `/* Animated Gradient Background */
.roycss-bg-animated-gradient {
  background: linear-gradient(-45deg, oklch(0.432 0.086 166.91), oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72));
  background-size: 400% 400%;
  animation: roy-gradient-shift 8s ease infinite;
}

@keyframes roy-gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`,
  },
  {
    id: "bg-dot-pattern",
    name: "Dot Grid Pattern",
    category: "backgrounds",
    description: "A clean dot grid pattern for structured backgrounds",
    tags: ["dots", "grid", "pattern", "background"],
    previewType: "background",
    cssCode: `/* Dot Grid Pattern */
.roycss-bg-dot-pattern {
  background-color: oklch(0.208 0.04 265.75);
  background-image: radial-gradient(circle, oklch(0.696 0.149 162.48) 1px, transparent 1px);
  background-size: 24px 24px;
}`,
  },
  {
    id: "bg-mesh-gradient",
    name: "Mesh Gradient",
    category: "backgrounds",
    description: "A modern mesh gradient with multiple blurred color spots",
    tags: ["mesh", "gradient", "modern", "background"],
    previewType: "background",
    cssCode: `/* Mesh Gradient Background */
.roycss-bg-mesh-gradient {
  background-color: oklch(0.208 0.04 265.75);
  position: relative;
  overflow: hidden;
}

.roycss-bg-mesh-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(at 20% 30%, color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent) 0, transparent 50%),
    radial-gradient(at 80% 20%, color-mix(in oklch, oklch(0.715 0.126 215.22) 25%, transparent) 0, transparent 50%),
    radial-gradient(at 50% 80%, color-mix(in oklch, oklch(0.606 0.219 292.72) 20%, transparent) 0, transparent 50%);
  filter: blur(60px);
}`,
  },
  {
    id: "bg-grid-lines",
    name: "Grid Lines",
    category: "backgrounds",
    description: "Subtle intersecting grid lines for technical layouts",
    tags: ["grid", "lines", "technical", "background"],
    previewType: "background",
    cssCode: `/* Grid Lines Background */
.roycss-bg-grid-lines {
  background-color: oklch(0.208 0.04 265.75);
  background-image:
    linear-gradient(color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
}`,
  },
  {
    id: "bg-noise",
    name: "Noise Texture",
    category: "backgrounds",
    description: "A subtle noise/grain texture overlay for visual depth",
    tags: ["noise", "grain", "texture", "background"],
    previewType: "background",
    cssCode: `/* Noise Texture Background */
.roycss-bg-noise {
  position: relative;
  background-color: oklch(0.208 0.04 265.75);
}

.roycss-bg-noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E");
  background-repeat: repeat;
  pointer-events: none;
  z-index: 1;
}`,
  },
  {
    id: "bg-aurora",
    name: "Aurora",
    category: "backgrounds",
    description: "An ethereal aurora borealis effect with flowing lights",
    tags: ["aurora", "northern lights", "flow", "background"],
    previewType: "background",
    cssCode: `/* Aurora Background */
.roycss-bg-aurora {
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75) 0%, oklch(0.228 0.039 247.3) 100%);
  position: relative;
  overflow: hidden;
}

.roycss-bg-aurora::before {
  content: '';
  position: absolute;
  inset-block-start: -50%;
  inset-inline-start: -50%;
  inline-size: 200%;
  block-size: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent) 60deg,
    transparent 120deg,
    color-mix(in oklch, oklch(0.715 0.126 215.22) 10%, transparent) 180deg,
    transparent 240deg,
    color-mix(in oklch, oklch(0.606 0.219 292.72) 10%, transparent) 300deg,
    transparent 360deg
  );
  animation: roy-aurora 12s linear infinite;
}

@keyframes roy-aurora {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "bg-stripes",
    name: "Diagonal Stripes",
    category: "backgrounds",
    description: "Classic diagonal stripe pattern with configurable colors",
    tags: ["stripes", "diagonal", "pattern", "background"],
    previewType: "background",
    cssCode: `/* Diagonal Stripes Background */
.roycss-bg-stripes {
  background: repeating-linear-gradient(
    45deg,
    oklch(0.696 0.149 162.48),
    oklch(0.696 0.149 162.48) 10px,
    oklch(0.208 0.04 265.75) 10px,
    oklch(0.208 0.04 265.75) 20px
  );
}`,
  },
  {
    id: "bg-diagonal-stripes",
    name: "Animated Diagonal Stripes",
    category: "backgrounds",
    description: "Diagonal cyan stripes that scroll infinitely for a moving backdrop",
    tags: ["stripes", "animated", "diagonal", "background"],
    previewType: "background",
    cssCode: `/* Animated Diagonal Stripes Background */
.roycss-bg-diagonal-stripes {
  background-color: oklch(0.208 0.04 265.75);
  background-image: repeating-linear-gradient(
    -60deg,
    oklch(0.715 0.126 215.22) 0,
    oklch(0.715 0.126 215.22) 12px,
    oklch(0.52 0.094 223.13) 12px,
    oklch(0.52 0.094 223.13) 24px
  );
  background-size: 200% 200%;
  animation: roy-diagonal-shift 6s linear infinite;
}

@keyframes roy-diagonal-shift {
  from { background-position: 0 0; }
  to { background-position: 48px 0; }
}`,
  },
  {
    id: "bg-checkerboard",
    name: "Checkerboard",
    category: "backgrounds",
    description: "A two-tone checkerboard pattern built from layered linear gradients",
    tags: ["checkerboard", "pattern", "tiles", "background"],
    previewType: "background",
    cssCode: `/* Checkerboard Background */
.roycss-bg-checkerboard {
  background-color: oklch(0.208 0.04 265.75);
  background-image:
    linear-gradient(45deg, oklch(0.696 0.149 162.48) 25%, transparent 25%),
    linear-gradient(-45deg, oklch(0.696 0.149 162.48) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, oklch(0.696 0.149 162.48) 75%),
    linear-gradient(-45deg, transparent 75%, oklch(0.696 0.149 162.48) 75%);
  background-size: 32px 32px;
  background-position: 0 0, 0 16px, 16px -16px, -16px 0;
}`,
  },
  {
    id: "bg-hexagon",
    name: "Hexagon Honeycomb",
    category: "backgrounds",
    description: "A tiled hexagon honeycomb outline pattern using an inline SVG",
    tags: ["hexagon", "honeycomb", "pattern", "background"],
    previewType: "background",
    cssCode: `/* Hexagon Honeycomb Background */
.roycss-bg-hexagon {
  background-color: oklch(0.208 0.04 265.75);
  background-image: url("data:image/svg+xml,%3Csvg width='56' height='100' viewBox='0 0 56 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 0L56 16.18V50.5L28 66.68L0 50.5V16.18L28 0z' fill='none' stroke='%2310b981' stroke-width='1' opacity='0.5'/%3E%3Cpath d='M28 33.32L56 49.5V83.82L28 100L0 83.82V49.5L28 33.32z' fill='none' stroke='%2310b981' stroke-width='1' opacity='0.5'/%3E%3C/svg%3E");
  background-size: 56px 100px;
}`,
  },
  {
    id: "bg-triangles",
    name: "Triangle Mosaic",
    category: "backgrounds",
    description: "Four-color triangle mosaic pattern from layered 45deg gradients",
    tags: ["triangles", "mosaic", "geometric", "background"],
    previewType: "background",
    cssCode: `/* Triangle Mosaic Background */
.roycss-bg-triangles {
  background-color: oklch(0.208 0.04 265.75);
  background-image:
    linear-gradient(45deg, oklch(0.696 0.149 162.48) 25%, transparent 25%),
    linear-gradient(-45deg, oklch(0.715 0.126 215.22) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, oklch(0.715 0.126 215.22) 75%),
    linear-gradient(-45deg, transparent 75%, oklch(0.696 0.149 162.48) 75%);
  background-size: 40px 40px;
  background-position: 0 0, 0 20px, 20px -20px, -20px 0;
}`,
  },
  {
    id: "bg-zigzag",
    name: "Zigzag",
    category: "backgrounds",
    description: "A sharp zigzag pattern generated from four opposing gradients",
    tags: ["zigzag", "pattern", "geometric", "background"],
    previewType: "background",
    cssCode: `/* Zigzag Background */
.roycss-bg-zigzag {
  background-color: oklch(0.208 0.04 265.75);
  background-image:
    linear-gradient(135deg, oklch(0.696 0.149 162.48) 25%, transparent 25%) -10px 0,
    linear-gradient(225deg, oklch(0.696 0.149 162.48) 25%, transparent 25%) -10px 0,
    linear-gradient(315deg, oklch(0.696 0.149 162.48) 25%, transparent 25%),
    linear-gradient(45deg, oklch(0.696 0.149 162.48) 25%, transparent 25%);
  background-size: 20px 20px;
}`,
  },
  {
    id: "bg-waves",
    name: "Wave Pattern",
    category: "backgrounds",
    description: "Layered sine-like waves rendered from an inline SVG for smooth curves",
    tags: ["waves", "pattern", "svg", "background"],
    previewType: "background",
    cssCode: `/* Wave Pattern Background */
.roycss-bg-waves {
  background-color: oklch(0.228 0.039 247.3);
  background-image: url("data:image/svg+xml,%3Csvg width='120' height='40' viewBox='0 0 120 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q 30 0 60 20 T 120 20' stroke='%2310b981' stroke-width='1.5' fill='none' opacity='0.55'/%3E%3Cpath d='M0 30 Q 30 10 60 30 T 120 30' stroke='%2306b6d4' stroke-width='1.5' fill='none' opacity='0.45'/%3E%3C/svg%3E");
  background-size: 120px 40px;
}`,
  },
  {
    id: "bg-concentric",
    name: "Concentric Rings",
    category: "backgrounds",
    description: "Expanding concentric rings produced by a repeating radial gradient",
    tags: ["concentric", "rings", "radial", "background"],
    previewType: "background",
    cssCode: `/* Concentric Rings Background */
.roycss-bg-concentric {
  background: repeating-radial-gradient(
    circle at center,
    oklch(0.696 0.149 162.48) 0,
    oklch(0.696 0.149 162.48) 8px,
    oklch(0.208 0.04 265.75) 8px,
    oklch(0.208 0.04 265.75) 16px
  );
}`,
  },
  {
    id: "bg-radial-rays",
    name: "Radial Rays",
    category: "backgrounds",
    description: "Thin radiating rays from a central point via repeating conic gradient",
    tags: ["rays", "radial", "conic", "background"],
    previewType: "background",
    cssCode: `/* Radial Rays Background */
.roycss-bg-radial-rays {
  background-color: oklch(0.208 0.04 265.75);
  background-image: repeating-conic-gradient(
    from 0deg at 50% 50%,
    oklch(0.696 0.149 162.48) 0deg 4deg,
    transparent 4deg 12deg
  );
}`,
  },
  {
    id: "bg-sunburst",
    name: "Sunburst",
    category: "backgrounds",
    description: "A warm rotating sunburst formed from a conic gradient on a pseudo-element",
    tags: ["sunburst", "conic", "warm", "background"],
    previewType: "background",
    cssCode: `/* Sunburst Background */
.roycss-bg-sunburst {
  background-color: oklch(0.189 0.028 79.8);
  position: relative;
  overflow: hidden;
}

.roycss-bg-sunburst::before {
  content: '';
  position: absolute;
  inset-block-start: -50%;
  inset-inline-start: -50%;
  inline-size: 200%;
  block-size: 200%;
  background: repeating-conic-gradient(
    from 0deg at 50% 50%,
    oklch(0.837 0.164 84.43) 0deg 6deg,
    oklch(0.769 0.165 70.08) 6deg 12deg
  );
  animation: roy-sunburst-rotate 20s linear infinite;
}

@keyframes roy-sunburst-rotate {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "bg-plaid",
    name: "Plaid",
    category: "backgrounds",
    description: "Tartan-style plaid built by crossing four repeating gradient layers",
    tags: ["plaid", "tartan", "pattern", "background"],
    previewType: "background",
    cssCode: `/* Plaid Background */
.roycss-bg-plaid {
  background-color: oklch(0.208 0.04 265.75);
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 18px, color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent) 18px, color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent) 20px),
    repeating-linear-gradient(90deg, transparent, transparent 18px, color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent) 18px, color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent) 20px),
    repeating-linear-gradient(45deg, transparent, transparent 24px, color-mix(in oklch, oklch(0.715 0.126 215.22) 30%, transparent) 24px, color-mix(in oklch, oklch(0.715 0.126 215.22) 30%, transparent) 26px),
    repeating-linear-gradient(-45deg, transparent, transparent 24px, color-mix(in oklch, oklch(0.715 0.126 215.22) 30%, transparent) 24px, color-mix(in oklch, oklch(0.715 0.126 215.22) 30%, transparent) 26px);
}`,
  },
  {
    id: "bg-conic-gradient",
    name: "Conic Gradient Hue Cycle",
    category: "backgrounds",
    description: "A vivid conic gradient whose hue continuously cycles around the wheel",
    tags: ["conic", "gradient", "hue", "animated"],
    previewType: "background",
    cssCode: `/* Conic Gradient Hue Cycle Background */
.roycss-bg-conic-gradient {
  background: conic-gradient(
    from 0deg at 50% 50%,
    oklch(0.696 0.149 162.48),
    oklch(0.715 0.126 215.22),
    oklch(0.606 0.219 292.72),
    oklch(0.656 0.212 354.31),
    oklch(0.769 0.165 70.08),
    oklch(0.696 0.149 162.48)
  );
  animation: roy-conic-hue 6s linear infinite;
}

@keyframes roy-conic-hue {
  to { filter: hue-rotate(360deg); }
}`,
  },
  {
    id: "bg-starfield",
    name: "Starfield",
    category: "backgrounds",
    description: "A deep-space starfield with multiple white pinpoints softly twinkling",
    tags: ["stars", "space", "twinkle", "background"],
    previewType: "background",
    cssCode: `/* Starfield Background */
.roycss-bg-starfield {
  background-color: oklch(0.135 0.019 264.32);
  background-image:
    radial-gradient(2px 2px at 20px 30px, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 40px 70px, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 90px 40px, oklch(1 0 89.88), transparent),
    radial-gradient(2px 2px at 130px 80px, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 160px 30px, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 50px 120px, oklch(1 0 89.88), transparent),
    radial-gradient(2px 2px at 180px 100px, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 220px 60px, oklch(1 0 89.88), transparent);
  background-size: 250px 150px;
  animation: roy-starfield-twinkle 3s ease-in-out infinite alternate;
}

@keyframes roy-starfield-twinkle {
  from { opacity: 0.6; }
  to { opacity: 1; }
}`,
  },
  {
    id: "bg-gradient-sweep",
    name: "Gradient Sweep",
    category: "backgrounds",
    description: "A colored gradient band sweeping left to right across a dark canvas",
    tags: ["sweep", "gradient", "animated", "background"],
    previewType: "background",
    cssCode: `/* Gradient Sweep Background */
.roycss-bg-gradient-sweep {
  background: linear-gradient(
    90deg,
    oklch(0.208 0.04 265.75) 0%,
    oklch(0.696 0.149 162.48) 25%,
    oklch(0.715 0.126 215.22) 50%,
    oklch(0.696 0.149 162.48) 75%,
    oklch(0.208 0.04 265.75) 100%
  );
  background-size: 200% 100%;
  animation: roy-gradient-sweep 4s linear infinite;
}

@keyframes roy-gradient-sweep {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}`,
  },
  {
    id: "bg-gradient-pulse",
    name: "Gradient Pulse",
    category: "backgrounds",
    description: "Three radial color blobs that softly pulse on a dark base",
    tags: ["pulse", "radial", "glow", "background"],
    previewType: "background",
    cssCode: `/* Gradient Pulse Background */
.roycss-bg-gradient-pulse {
  background-color: oklch(0.208 0.04 265.75);
  background-image:
    radial-gradient(circle at 50% 50%, oklch(0.696 0.149 162.48) 0%, color-mix(in oklch, oklch(0.696 0.149 162.48) 0%, transparent) 40%),
    radial-gradient(circle at 30% 70%, oklch(0.715 0.126 215.22) 0%, color-mix(in oklch, oklch(0.715 0.126 215.22) 0%, transparent) 40%),
    radial-gradient(circle at 70% 30%, oklch(0.606 0.219 292.72) 0%, color-mix(in oklch, oklch(0.606 0.219 292.72) 0%, transparent) 40%);
  animation: roy-gradient-pulse 4s ease-in-out infinite;
}

@keyframes roy-gradient-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}`,
  },
  {
    id: "bg-lava-lamp",
    name: "Lava Lamp",
    category: "backgrounds",
    description: "Two glowing blurred blobs drifting past each other like a lava lamp",
    tags: ["lava", "blob", "animated", "background"],
    previewType: "background",
    cssCode: `/* Lava Lamp Background */
.roycss-bg-lava-lamp {
  background-color: oklch(0.195 0.067 299.87);
  position: relative;
  overflow: hidden;
}

.roycss-bg-lava-lamp::before,
.roycss-bg-lava-lamp::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(30px);
}

.roycss-bg-lava-lamp::before {
  inline-size: 120px;
  block-size: 120px;
  background: radial-gradient(circle, oklch(0.656 0.212 354.31), transparent);
  inset-block-start: 15%;
  inset-inline-start: 15%;
  animation: roy-lava-1 6s ease-in-out infinite alternate;
}

.roycss-bg-lava-lamp::after {
  inline-size: 150px;
  block-size: 150px;
  background: radial-gradient(circle, oklch(0.769 0.165 70.08), transparent);
  inset-block-end: 15%;
  inset-inline-end: 15%;
  animation: roy-lava-2 7s ease-in-out infinite alternate;
}

@keyframes roy-lava-1 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(40px, -30px) scale(1.3); }
}

@keyframes roy-lava-2 {
  0% { transform: translate(0, 0) scale(1.2); }
  100% { transform: translate(-30px, 40px) scale(0.9); }
}`,
  },
  {
    id: "bg-plasma",
    name: "Plasma",
    category: "backgrounds",
    description: "A flowing plasma field where three color blobs drift on a violet base",
    tags: ["plasma", "flow", "animated", "background"],
    previewType: "background",
    cssCode: `/* Plasma Background */
.roycss-bg-plasma {
  background-color: oklch(0.208 0.04 265.75);
  background-image:
    radial-gradient(circle at 20% 30%, color-mix(in oklch, oklch(0.606 0.219 292.72) 40%, transparent) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, color-mix(in oklch, oklch(0.656 0.212 354.31) 40%, transparent) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent) 0%, transparent 50%),
    linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.195 0.067 299.87));
  background-size: 150% 150%, 150% 150%, 200% 200%, 100% 100%;
  animation: roy-plasma-flow 12s ease-in-out infinite;
}

@keyframes roy-plasma-flow {
  0%, 100% { background-position: 0% 0%, 100% 100%, 50% 50%, 0 0; }
  33% { background-position: 50% 30%, 50% 0%, 0% 100%, 0 0; }
  66% { background-position: 100% 100%, 0% 50%, 100% 0%, 0 0; }
}`,
  },
  {
    id: "bg-smoke",
    name: "Smoke",
    category: "backgrounds",
    description: "Wispy white smoke clouds drifting across a dark backdrop",
    tags: ["smoke", "drift", "blur", "background"],
    previewType: "background",
    cssCode: `/* Smoke Background */
.roycss-bg-smoke {
  background-color: oklch(0.208 0.04 265.75);
  position: relative;
  overflow: hidden;
}

.roycss-bg-smoke::before {
  content: '';
  position: absolute;
  inset-block-start: -50%;
  inset-inline-start: -50%;
  inline-size: 200%;
  block-size: 200%;
  background:
    radial-gradient(ellipse at 30% 50%, color-mix(in oklch, oklch(1 0 89.88) 6%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, color-mix(in oklch, oklch(1 0 89.88) 4%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 40%, color-mix(in oklch, oklch(1 0 89.88) 5%, transparent) 0%, transparent 50%);
  filter: blur(20px);
  animation: roy-smoke-drift 15s ease-in-out infinite;
}

@keyframes roy-smoke-drift {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(20px, -20px) rotate(5deg); }
}`,
  },
  {
    id: "bg-sunset",
    name: "Sunset",
    category: "backgrounds",
    description: "A warm dusk-to-dawn sunset gradient that gently breathes vertically",
    tags: ["sunset", "warm", "gradient", "background"],
    previewType: "background",
    cssCode: `/* Sunset Background */
.roycss-bg-sunset {
  background: linear-gradient(
    180deg,
    oklch(0.228 0.039 247.3) 0%,
    oklch(0.387 0.119 314.64) 25%,
    oklch(0.531 0.202 5.62) 50%,
    oklch(0.769 0.165 70.08) 75%,
    oklch(0.924 0.115 95.75) 100%
  );
  background-size: 100% 200%;
  animation: roy-sunset-shift 8s ease-in-out infinite;
}

@keyframes roy-sunset-shift {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 0% 50%; }
}`,
  },

  // ─── LOADERS (25) ───────────────────────────────────────────────
  {
    id: "loader-spinner",
    name: "Ring Spinner",
    category: "loaders",
    description: "A clean circular spinner with a trailing arc",
    tags: ["spinner", "loader", "loading", "circle"],
    previewType: "loader",
    cssCode: `/* Ring Spinner */
.roycss-loader-spinner {
  inline-size: 40px;
  block-size: 40px;
  border: 3px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent);
  border-top-color: oklch(0.696 0.149 162.48);
  border-radius: 50%;
  animation: roy-spin 0.8s linear infinite;
}

@keyframes roy-spin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "loader-dots",
    name: "Bouncing Dots",
    category: "loaders",
    description: "Three dots bouncing in sequence for a playful loading state",
    tags: ["dots", "bounce", "loader", "loading"],
    previewType: "loader",
    childCount: 3,
    cssCode: `/* Bouncing Dots Loader */
.roycss-loader-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.roycss-loader-dots span {
  inline-size: 10px;
  block-size: 10px;
  border-radius: 50%;
  background: oklch(0.696 0.149 162.48);
  animation: roy-bounce-dots 1.4s ease-in-out infinite;
}

.roycss-loader-dots span:nth-child(2) { animation-delay: 0.16s; }
.roycss-loader-dots span:nth-child(3) { animation-delay: 0.32s; }

@keyframes roy-bounce-dots {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}`,
  },
  {
    id: "loader-bars",
    name: "Equalizer Bars",
    category: "loaders",
    description: "Audio equalizer-style bars that animate at different speeds",
    tags: ["bars", "equalizer", "loader", "loading"],
    previewType: "loader",
    childCount: 5,
    cssCode: `/* Equalizer Bars Loader */
.roycss-loader-bars {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  block-size: 32px;
}

.roycss-loader-bars span {
  inline-size: 4px;
  border-radius: 2px;
  background: oklch(0.696 0.149 162.48);
  animation: roy-eq-bar 1.2s ease-in-out infinite;
}

.roycss-loader-bars span:nth-child(1) { animation-delay: 0s; }
.roycss-loader-bars span:nth-child(2) { animation-delay: 0.1s; }
.roycss-loader-bars span:nth-child(3) { animation-delay: 0.2s; }
.roycss-loader-bars span:nth-child(4) { animation-delay: 0.3s; }
.roycss-loader-bars span:nth-child(5) { animation-delay: 0.4s; }

@keyframes roy-eq-bar {
  0%, 100% { block-size: 8px; }
  50% { block-size: 28px; }
}`,
  },
  {
    id: "loader-orbit",
    name: "Orbit",
    category: "loaders",
    description: "A satellite orbiting around a center point",
    tags: ["orbit", "satellite", "loader", "loading"],
    previewType: "loader",
    cssCode: `/* Orbit Loader */
.roycss-loader-orbit {
  inline-size: 40px;
  block-size: 40px;
  position: relative;
}

.roycss-loader-orbit::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: oklch(0.696 0.149 162.48);
  animation: roy-spin 1s linear infinite;
}

.roycss-loader-orbit::after {
  content: '';
  position: absolute;
  inset-block-start: -3px;
  inset-inline-start: 50%;
  inline-size: 8px;
  block-size: 8px;
  margin-inline-start: -4px;
  border-radius: 50%;
  background: oklch(0.696 0.149 162.48);
  box-shadow: 0 0 10px color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent);
  animation: roy-orbit-move 1s linear infinite;
}

@keyframes roy-orbit-move {
  0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
}`,
  },
  {
    id: "loader-pulse-ring",
    name: "Pulse Ring",
    category: "loaders",
    description: "Expanding concentric rings that fade out",
    tags: ["pulse", "ring", "expand", "loader"],
    previewType: "loader",
    cssCode: `/* Pulse Ring Loader */
.roycss-loader-pulse-ring {
  inline-size: 40px;
  block-size: 40px;
  position: relative;
}

.roycss-loader-pulse-ring::before,
.roycss-loader-pulse-ring::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid oklch(0.696 0.149 162.48);
  animation: roy-pulse-ring 1.5s ease-out infinite;
}

.roycss-loader-pulse-ring::after {
  animation-delay: 0.5s;
}

@keyframes roy-pulse-ring {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}`,
  },
  {
    id: "loader-dual-ring",
    name: "Dual Ring",
    category: "loaders",
    description: "A spinner with contrasting top and bottom arcs creating a dual-color ring",
    tags: ["dual", "ring", "spinner", "loader"],
    previewType: "loader",
    cssCode: `/* Dual Ring Loader */
.roycss-loader-dual-ring {
  inline-size: 48px;
  block-size: 48px;
  border-radius: 50%;
  border: 4px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
  border-top-color: oklch(0.696 0.149 162.48);
  border-bottom-color: oklch(0.715 0.126 215.22);
  animation: roy-dual-ring-spin 1.2s linear infinite;
}

@keyframes roy-dual-ring-spin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "loader-cube",
    name: "3D Cube Loader",
    category: "loaders",
    description: "A continuously rotating 3D cube built from six child span faces",
    tags: ["cube", "3d", "rotate", "loader"],
    previewType: "loader",
    childCount: 6,
    cssCode: `/* 3D Cube Loader */
.roycss-loader-cube {
  inline-size: 40px;
  block-size: 40px;
  position: relative;
  transform-style: preserve-3d;
  animation: roy-loader-cube-rotate 4s linear infinite;
}

.roycss-loader-cube span {
  position: absolute;
  inline-size: 40px;
  block-size: 40px;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 70%, transparent);
  border: 1px solid oklch(0.696 0.149 162.48);
  display: block;
}

.roycss-loader-cube span:nth-child(1) { transform: rotateY(0deg) translateZ(20px); }
.roycss-loader-cube span:nth-child(2) { transform: rotateY(90deg) translateZ(20px); }
.roycss-loader-cube span:nth-child(3) { transform: rotateY(180deg) translateZ(20px); }
.roycss-loader-cube span:nth-child(4) { transform: rotateY(-90deg) translateZ(20px); }
.roycss-loader-cube span:nth-child(5) { transform: rotateX(90deg) translateZ(20px); }
.roycss-loader-cube span:nth-child(6) { transform: rotateX(-90deg) translateZ(20px); }

@keyframes roy-loader-cube-rotate {
  0% { transform: perspective(400px) rotateX(0deg) rotateY(0deg); }
  100% { transform: perspective(400px) rotateX(360deg) rotateY(360deg); }
}`,
  },
  {
    id: "loader-folding-cube",
    name: "Folding Cube",
    category: "loaders",
    description: "Four cube panels that fold inward and outward in sequence",
    tags: ["cube", "folding", "3d", "loader"],
    previewType: "loader",
    childCount: 4,
    cssCode: `/* Folding Cube Loader */
.roycss-loader-folding-cube {
  inline-size: 40px;
  block-size: 40px;
  position: relative;
  transform: rotateZ(45deg);
}

.roycss-loader-folding-cube span {
  float: inline-start;
  inline-size: 50%;
  block-size: 50%;
  position: relative;
  transform: scale(1.1);
}

.roycss-loader-folding-cube span::before {
  content: '';
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  block-size: 100%;
  background-color: oklch(0.696 0.149 162.48);
  animation: roy-fold-cube 2.4s infinite linear both;
  transform-origin: 100% 100%;
}

.roycss-loader-folding-cube span:nth-child(2) { transform: scale(1.1) rotateZ(90deg); }
.roycss-loader-folding-cube span:nth-child(3) { transform: scale(1.1) rotateZ(180deg); }
.roycss-loader-folding-cube span:nth-child(4) { transform: scale(1.1) rotateZ(270deg); }
.roycss-loader-folding-cube span:nth-child(2)::before { animation-delay: 0.3s; }
.roycss-loader-folding-cube span:nth-child(3)::before { animation-delay: 0.6s; }
.roycss-loader-folding-cube span:nth-child(4)::before { animation-delay: 0.9s; }

@keyframes roy-fold-cube {
  0%, 10% { transform: perspective(140px) rotateX(-180deg); opacity: 0; }
  25%, 75% { transform: perspective(140px) rotateX(0deg); opacity: 1; }
  90%, 100% { transform: perspective(140px) rotateY(180deg); opacity: 0; }
}`,
  },
  {
    id: "loader-chasing-dots",
    name: "Chasing Dots",
    category: "loaders",
    description: "Two dots chasing each other around a circular orbit",
    tags: ["chasing", "dots", "orbit", "loader"],
    previewType: "loader",
    childCount: 2,
    cssCode: `/* Chasing Dots Loader */
.roycss-loader-chasing-dots {
  inline-size: 40px;
  block-size: 40px;
  position: relative;
  animation: roy-chasing-rotate 2s infinite linear;
}

.roycss-loader-chasing-dots span {
  inline-size: 60%;
  block-size: 60%;
  display: inline-block;
  position: absolute;
  inset-block-start: 0;
  background-color: oklch(0.696 0.149 162.48);
  border-radius: 100%;
  animation: roy-chasing-bounce 2s infinite ease-in-out;
}

.roycss-loader-chasing-dots span:nth-child(2) {
  inset-block-start: auto;
  inset-block-end: 0;
  animation-delay: -1s;
}

@keyframes roy-chasing-rotate {
  100% { transform: rotate(360deg); }
}

@keyframes roy-chasing-bounce {
  0%, 100% { transform: scale(0); }
  50% { transform: scale(1); }
}`,
  },
  {
    id: "loader-fading-dots",
    name: "Fading Dots",
    category: "loaders",
    description: "Five dots that pop in and fade out in a rolling wave",
    tags: ["dots", "fade", "wave", "loader"],
    previewType: "loader",
    childCount: 5,
    cssCode: `/* Fading Dots Loader */
.roycss-loader-fading-dots {
  inline-size: 80px;
  text-align: center;
}

.roycss-loader-fading-dots span {
  display: inline-block;
  inline-size: 12px;
  block-size: 12px;
  margin: 0 2px;
  background-color: oklch(0.696 0.149 162.48);
  border-radius: 50%;
  animation: roy-fading-dots 1.4s ease-in-out infinite both;
}

.roycss-loader-fading-dots span:nth-child(1) { animation-delay: -0.48s; }
.roycss-loader-fading-dots span:nth-child(2) { animation-delay: -0.32s; }
.roycss-loader-fading-dots span:nth-child(3) { animation-delay: -0.16s; }
.roycss-loader-fading-dots span:nth-child(4) { animation-delay: 0s; }
.roycss-loader-fading-dots span:nth-child(5) { animation-delay: 0.16s; }

@keyframes roy-fading-dots {
  0%, 80%, 100% { transform: scale(0); opacity: 0; }
  40% { transform: scale(1); opacity: 1; }
}`,
  },
  {
    id: "loader-grid",
    name: "Grid Pulse",
    category: "loaders",
    description: "A 3x3 grid of squares that ripple inward from the corners",
    tags: ["grid", "pulse", "ripple", "loader"],
    previewType: "loader",
    childCount: 9,
    cssCode: `/* Grid Pulse Loader */
.roycss-loader-grid {
  inline-size: 40px;
  block-size: 40px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 4px;
}

.roycss-loader-grid span {
  background-color: oklch(0.696 0.149 162.48);
  border-radius: 2px;
  animation: roy-grid-fade 1.2s ease-in-out infinite;
}

.roycss-loader-grid span:nth-child(1) { animation-delay: 0.4s; }
.roycss-loader-grid span:nth-child(2) { animation-delay: 0.5s; }
.roycss-loader-grid span:nth-child(3) { animation-delay: 0.6s; }
.roycss-loader-grid span:nth-child(4) { animation-delay: 0.3s; }
.roycss-loader-grid span:nth-child(5) { animation-delay: 0.4s; }
.roycss-loader-grid span:nth-child(6) { animation-delay: 0.5s; }
.roycss-loader-grid span:nth-child(7) { animation-delay: 0.2s; }
.roycss-loader-grid span:nth-child(8) { animation-delay: 0.3s; }
.roycss-loader-grid span:nth-child(9) { animation-delay: 0.4s; }

@keyframes roy-grid-fade {
  0%, 70%, 100% { transform: scale(1); opacity: 1; }
  35% { transform: scale(0); opacity: 0; }
}`,
  },
  {
    id: "loader-ripple",
    name: "Ripple",
    category: "loaders",
    description: "Two expanding circular ripples radiating outward from the center",
    tags: ["ripple", "expand", "circle", "loader"],
    previewType: "loader",
    childCount: 2,
    cssCode: `/* Ripple Loader */
.roycss-loader-ripple {
  position: relative;
  inline-size: 64px;
  block-size: 64px;
}

.roycss-loader-ripple span {
  position: absolute;
  border: 4px solid oklch(0.696 0.149 162.48);
  opacity: 1;
  border-radius: 50%;
  animation: roy-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
}

.roycss-loader-ripple span:nth-child(2) { animation-delay: -0.5s; }

@keyframes roy-ripple {
  0% { inset-block-start: 28px; inset-inline-start: 28px; inline-size: 0; block-size: 0; opacity: 1; }
  100% { inset-block-start: 0; inset-inline-start: 0; inline-size: 56px; block-size: 56px; opacity: 0; }
}`,
  },
  {
    id: "loader-square-spin",
    name: "Square Spin",
    category: "loaders",
    description: "A single square that flips along both axes through 3D space",
    tags: ["square", "spin", "3d", "loader"],
    previewType: "loader",
    cssCode: `/* Square Spin Loader */
.roycss-loader-square-spin {
  inline-size: 40px;
  block-size: 40px;
  background-color: oklch(0.696 0.149 162.48);
  border-radius: 4px;
  animation: roy-square-spin 3s ease-in-out infinite;
}

@keyframes roy-square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}`,
  },
  {
    id: "loader-bouncing-grid",
    name: "Bouncing Grid",
    category: "loaders",
    description: "A 3x3 grid of circular dots scaling in a diagonal wave",
    tags: ["grid", "bounce", "dots", "loader"],
    previewType: "loader",
    childCount: 9,
    cssCode: `/* Bouncing Grid Loader */
.roycss-loader-bouncing-grid {
  inline-size: 42px;
  block-size: 42px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 3px;
}

.roycss-loader-bouncing-grid span {
  background-color: oklch(0.715 0.126 215.22);
  border-radius: 50%;
  animation: roy-bouncing-grid 1.5s ease-in-out infinite;
}

.roycss-loader-bouncing-grid span:nth-child(1) { animation-delay: 0s; }
.roycss-loader-bouncing-grid span:nth-child(2) { animation-delay: 0.1s; }
.roycss-loader-bouncing-grid span:nth-child(3) { animation-delay: 0.2s; }
.roycss-loader-bouncing-grid span:nth-child(4) { animation-delay: 0.1s; }
.roycss-loader-bouncing-grid span:nth-child(5) { animation-delay: 0.2s; }
.roycss-loader-bouncing-grid span:nth-child(6) { animation-delay: 0.3s; }
.roycss-loader-bouncing-grid span:nth-child(7) { animation-delay: 0.2s; }
.roycss-loader-bouncing-grid span:nth-child(8) { animation-delay: 0.3s; }
.roycss-loader-bouncing-grid span:nth-child(9) { animation-delay: 0.4s; }

@keyframes roy-bouncing-grid {
  0%, 100% { transform: scale(0.7); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
}`,
  },
  {
    id: "loader-line-scale",
    name: "Line Scale",
    category: "loaders",
    description: "Five vertical lines scaling vertically in a left-to-right wave",
    tags: ["lines", "scale", "wave", "loader"],
    previewType: "loader",
    childCount: 5,
    cssCode: `/* Line Scale Loader */
.roycss-loader-line-scale {
  display: flex;
  gap: 4px;
  align-items: center;
  block-size: 40px;
}

.roycss-loader-line-scale span {
  inline-size: 4px;
  block-size: 32px;
  background-color: oklch(0.696 0.149 162.48);
  border-radius: 2px;
  animation: roy-line-scale 1s ease-in-out infinite;
}

.roycss-loader-line-scale span:nth-child(1) { animation-delay: -0.4s; }
.roycss-loader-line-scale span:nth-child(2) { animation-delay: -0.3s; }
.roycss-loader-line-scale span:nth-child(3) { animation-delay: -0.2s; }
.roycss-loader-line-scale span:nth-child(4) { animation-delay: -0.1s; }
.roycss-loader-line-scale span:nth-child(5) { animation-delay: 0s; }

@keyframes roy-line-scale {
  0%, 40%, 100% { transform: scaleY(0.4); }
  20% { transform: scaleY(1); }
}`,
  },
  {
    id: "loader-pacman",
    name: "Pacman",
    category: "loaders",
    description: "A chomping pacman character next to three static dots",
    tags: ["pacman", "chomp", "retro", "loader"],
    previewType: "loader",
    cssCode: `/* Pacman Loader */
.roycss-loader-pacman {
  position: relative;
  inline-size: 60px;
  block-size: 40px;
}

.roycss-loader-pacman::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  inline-size: 40px;
  block-size: 40px;
  background: oklch(0.769 0.165 70.08);
  border-radius: 50%;
  clip-path: polygon(100% 35%, 50% 50%, 100% 65%, 50% 100%, 0% 50%, 50% 0%);
  animation: roy-pacman-chomp 0.4s ease-in-out infinite alternate;
}

.roycss-loader-pacman::after {
  content: '';
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: 0;
  inline-size: 4px;
  block-size: 4px;
  background: oklch(0.696 0.149 162.48);
  border-radius: 50%;
  box-shadow:
    -10px 0 0 oklch(0.696 0.149 162.48),
    -20px 0 0 oklch(0.696 0.149 162.48);
  transform: translateY(-50%);
}

@keyframes roy-pacman-chomp {
  from { clip-path: polygon(100% 35%, 50% 50%, 100% 65%, 50% 100%, 0% 50%, 50% 0%); }
  to { clip-path: polygon(100% 50%, 50% 50%, 100% 50%, 50% 100%, 0% 50%, 50% 0%); }
}`,
  },
  {
    id: "loader-circle-fade",
    name: "Circle Fade",
    category: "loaders",
    description: "Eight dots arranged in a circle with a faded tail that spins as a unit",
    tags: ["circle", "fade", "dots", "loader"],
    previewType: "loader",
    cssCode: `/* Circle Fade Loader */
.roycss-loader-circle-fade {
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  background: transparent;
  box-shadow:
    0 -20px 0 0 oklch(0.696 0.149 162.48),
    14px -14px 0 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 85%, transparent),
    20px 0 0 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 65%, transparent),
    14px 14px 0 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 45%, transparent),
    0 20px 0 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent),
    -14px 14px 0 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 45%, transparent),
    -20px 0 0 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 65%, transparent),
    -14px -14px 0 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 85%, transparent);
  animation: roy-circle-fade-spin 2s linear infinite;
}

@keyframes roy-circle-fade-spin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "loader-circle-notch",
    name: "Circle Notch",
    category: "loaders",
    description: "A half-circle notch that swings around with an asymmetric ease",
    tags: ["notch", "circle", "swing", "loader"],
    previewType: "loader",
    cssCode: `/* Circle Notch Loader */
.roycss-loader-circle-notch {
  inline-size: 40px;
  block-size: 40px;
  border-radius: 50%;
  border: 4px solid oklch(0.696 0.149 162.48);
  border-top-color: transparent;
  border-inline-start-color: transparent;
  animation: roy-circle-notch 0.9s linear infinite;
}

@keyframes roy-circle-notch {
  0% { transform: rotate(0deg); }
  60% { transform: rotate(280deg); }
  100% { transform: rotate(360deg); }
}`,
  },
  {
    id: "loader-three-bounce",
    name: "Three Bounce",
    category: "loaders",
    description: "Three larger dots that scale and fade in a rolling bounce",
    tags: ["bounce", "dots", "loader", "loading"],
    previewType: "loader",
    childCount: 3,
    cssCode: `/* Three Bounce Loader */
.roycss-loader-three-bounce {
  inline-size: 80px;
  text-align: center;
}

.roycss-loader-three-bounce span {
  display: inline-block;
  inline-size: 18px;
  block-size: 18px;
  margin: 0 3px;
  border-radius: 50%;
  background-color: oklch(0.696 0.149 162.48);
  animation: roy-three-bounce 1.4s ease-in-out infinite both;
}

.roycss-loader-three-bounce span:nth-child(1) { animation-delay: -0.32s; }
.roycss-loader-three-bounce span:nth-child(2) { animation-delay: -0.16s; }

@keyframes roy-three-bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}`,
  },
  {
    id: "loader-progress-bar",
    name: "Progress Bar",
    category: "loaders",
    description: "An indeterminate progress bar with a sweeping gradient fill",
    tags: ["progress", "bar", "indeterminate", "loader"],
    previewType: "loader",
    cssCode: `/* Progress Bar Loader */
.roycss-loader-progress-bar {
  inline-size: 200px;
  block-size: 8px;
  background-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.roycss-loader-progress-bar::before {
  content: '';
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  block-size: 100%;
  inline-size: 40%;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  border-radius: 4px;
  animation: roy-progress-bar 2s ease-in-out infinite;
}

@keyframes roy-progress-bar {
  0% { inset-inline-start: -40%; }
  50% { inset-inline-start: 50%; }
  100% { inset-inline-start: 100%; }
}`,
  },
  {
    id: "loader-indeterminate",
    name: "Indeterminate Bar",
    category: "loaders",
    description: "Material-style indeterminate bar with two overlapping sliding segments",
    tags: ["indeterminate", "material", "bar", "loader"],
    previewType: "loader",
    cssCode: `/* Indeterminate Bar Loader */
.roycss-loader-indeterminate {
  inline-size: 200px;
  block-size: 4px;
  background-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.roycss-loader-indeterminate::before,
.roycss-loader-indeterminate::after {
  content: '';
  position: absolute;
  inset-block-start: 0;
  inset-block-end: 0;
  inline-size: 40%;
  background-color: oklch(0.696 0.149 162.48);
  border-radius: 2px;
}

.roycss-loader-indeterminate::before {
  animation: roy-indeterminate 2s linear infinite;
}

.roycss-loader-indeterminate::after {
  animation: roy-indeterminate-short 2s linear infinite;
  animation-delay: 1s;
}

@keyframes roy-indeterminate {
  0% { inset-inline-start: -40%; }
  100% { inset-inline-start: 100%; }
}

@keyframes roy-indeterminate-short {
  0% { inset-inline-start: -40%; }
  50% { inset-inline-start: 60%; }
  100% { inset-inline-start: 100%; }
}`,
  },
  {
    id: "loader-skeleton",
    name: "Skeleton Shimmer",
    category: "loaders",
    description: "A skeleton placeholder bar with a sweeping shimmer highlight",
    tags: ["skeleton", "shimmer", "placeholder", "loader"],
    previewType: "loader",
    cssCode: `/* Skeleton Shimmer Loader */
.roycss-loader-skeleton {
  inline-size: 200px;
  block-size: 12px;
  background-color: color-mix(in oklch, oklch(1 0 89.88) 6%, transparent);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.roycss-loader-skeleton::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in oklch, oklch(1 0 89.88) 10%, transparent),
    transparent
  );
  animation: roy-skeleton-shimmer 1.5s infinite;
}

@keyframes roy-skeleton-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}`,
  },
  {
    id: "loader-typing",
    name: "Typing Indicator",
    category: "loaders",
    description: "Three dots bobbing up and down inside a chat-style pill bubble",
    tags: ["typing", "chat", "dots", "loader"],
    previewType: "loader",
    childCount: 3,
    cssCode: `/* Typing Indicator Loader */
.roycss-loader-typing {
  display: flex;
  gap: 4px;
  align-items: center;
  background-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  padding: 8px 12px;
  border-radius: 16px;
}

.roycss-loader-typing span {
  inline-size: 6px;
  block-size: 6px;
  border-radius: 50%;
  background-color: oklch(0.696 0.149 162.48);
  animation: roy-typing 1.4s infinite ease-in-out;
}

.roycss-loader-typing span:nth-child(1) { animation-delay: 0s; }
.roycss-loader-typing span:nth-child(2) { animation-delay: 0.2s; }
.roycss-loader-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes roy-typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}`,
  },
  {
    id: "loader-whale",
    name: "Whale Spout",
    category: "loaders",
    description: "A stylized whale bobbing with a pulsing water spout above it",
    tags: ["whale", "spout", "playful", "loader"],
    previewType: "loader",
    cssCode: `/* Whale Spout Loader */
.roycss-loader-whale {
  inline-size: 50px;
  block-size: 40px;
  position: relative;
}

.roycss-loader-whale::before {
  content: '';
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  block-size: 18px;
  background: oklch(0.715 0.126 215.22);
  border-radius: 50% 50% 8px 8px / 100% 100% 8px 8px;
  animation: roy-whale-float 1.5s ease-in-out infinite;
}

.roycss-loader-whale::after {
  content: '';
  position: absolute;
  inset-block-end: 16px;
  inset-inline-start: 50%;
  inline-size: 4px;
  block-size: 18px;
  background: linear-gradient(to top, oklch(0.715 0.126 215.22), transparent);
  border-radius: 2px;
  transform: translateX(-50%) scaleY(0);
  transform-origin: bottom center;
  animation: roy-whale-spout 1.5s ease-in-out infinite;
}

@keyframes roy-whale-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes roy-whale-spout {
  0%, 100% { transform: translateX(-50%) scaleY(0); opacity: 0; }
  50% { transform: translateX(-50%) scaleY(1); opacity: 1; }
}`,
  },
  {
    id: "loader-clock",
    name: "Clock",
    category: "loaders",
    description: "A clock face with hour and minute hands spinning at different speeds",
    tags: ["clock", "hands", "time", "loader"],
    previewType: "loader",
    cssCode: `/* Clock Loader */
.roycss-loader-clock {
  position: relative;
  inline-size: 40px;
  block-size: 40px;
  border-radius: 50%;
  border: 3px solid oklch(0.696 0.149 162.48);
  background: transparent;
}

.roycss-loader-clock::before,
.roycss-loader-clock::after {
  content: '';
  position: absolute;
  inset-block-end: 50%;
  inset-inline-start: 50%;
  inline-size: 2px;
  background: oklch(0.696 0.149 162.48);
  transform-origin: bottom center;
  border-radius: 2px;
  margin-inline-start: -1px;
}

.roycss-loader-clock::before {
  block-size: 12px;
  animation: roy-clock-hour 4s linear infinite;
}

.roycss-loader-clock::after {
  block-size: 16px;
  animation: roy-clock-minute 1s linear infinite;
}

@keyframes roy-clock-hour {
  to { transform: rotate(360deg); }
}

@keyframes roy-clock-minute {
  to { transform: rotate(360deg); }
}`,
  },

  // ─── 3D TRANSFORMS (20) ────────────────────────────────────────
  {
    id: "card-flip",
    name: "Card Flip",
    category: "3d-transforms",
    description: "A full 3D card flip revealing content on the back",
    tags: ["flip", "card", "3d", "transform"],
    previewType: "card",
    cssCode: `/* Card Flip */
.roycss-card-flip {
  perspective: 1000px;
  inline-size: 200px;
  block-size: 120px;
}

.roycss-card-flip-inner {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.roycss-card-flip:hover .roycss-card-flip-inner {
  transform: rotateY(180deg);
}

.roycss-card-flip-front,
.roycss-card-flip-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.roycss-card-flip-back {
  transform: rotateY(180deg);
}`,
  },
  {
    id: "perspective-tilt",
    name: "Perspective Tilt",
    category: "3d-transforms",
    description: "Dynamic perspective shift creating depth on interaction",
    tags: ["perspective", "tilt", "3d", "depth"],
    previewType: "box",
    cssCode: `/* Perspective Tilt */
.roycss-perspective-tilt {
  transform-style: preserve-3d;
  transform: perspective(800px) rotateX(5deg) rotateY(-5deg);
  transition: transform 0.4s ease;
  box-shadow: 8px 8px 20px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
}

.roycss-perspective-tilt:hover {
  transform: perspective(800px) rotateX(-5deg) rotateY(5deg);
}`,
  },
  {
    id: "cube-rotate",
    name: "Cube Rotate",
    category: "3d-transforms",
    description: "A 3D cube that continuously rotates showing all faces",
    tags: ["cube", "rotate", "3d", "transform"],
    previewType: "box",
    cssCode: `/* Cube Rotate */
.roycss-cube-rotate {
  inline-size: 60px;
  block-size: 60px;
  transform-style: preserve-3d;
  animation: roy-cube-rotate 6s linear infinite;
}

@keyframes roy-cube-rotate {
  0% { transform: rotateX(0deg) rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

.roycss-cube-face {
  position: absolute;
  inline-size: 60px;
  block-size: 60px;
  border: 2px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent);
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 8%, transparent);
  border-radius: 4px;
}`,
  },
  {
    id: "depth-shadow",
    name: "Depth Shadow Layers",
    category: "3d-transforms",
    description: "Layered shadows creating a 3D depth extrusion effect",
    tags: ["shadow", "depth", "layers", "3d"],
    previewType: "box",
    cssCode: `/* Depth Shadow Layers */
.roycss-depth-shadow {
  box-shadow:
    1px 1px 0 oklch(0.432 0.086 166.91),
    2px 2px 0 oklch(0.596 0.127 163.23),
    3px 3px 0 oklch(0.508 0.105 165.61),
    4px 4px 0 oklch(0.696 0.149 162.48),
    5px 5px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent),
    6px 6px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent),
    7px 7px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent),
    8px 8px 20px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  transition: all 0.3s ease;
}

.roycss-depth-shadow:hover {
  transform: translate(-2px, -2px);
  box-shadow:
    3px 3px 0 oklch(0.432 0.086 166.91),
    4px 4px 0 oklch(0.596 0.127 163.23),
    5px 5px 0 oklch(0.508 0.105 165.61),
    6px 6px 0 oklch(0.696 0.149 162.48),
    7px 7px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent),
    8px 8px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent),
    9px 9px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent),
    10px 10px 30px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
}`,
  },
  {
    id: "flip-x",
    name: "Flip X",
    category: "3d-transforms",
    description: "Card that flips around the horizontal X axis on hover",
    tags: ["flip", "x-axis", "3d", "hover"],
    previewType: "box",
    cssCode: `/* Flip X */
.roycss-flip-x {
  perspective: 800px;
  transition: transform 0.6s ease;
  transform-style: preserve-3d;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  border-radius: 12px;
}

.roycss-flip-x:hover {
  transform: rotateX(180deg);
}`,
  },
  {
    id: "flip-y",
    name: "Flip Y",
    category: "3d-transforms",
    description: "Card that flips around the vertical Y axis on hover",
    tags: ["flip", "y-axis", "3d", "hover"],
    previewType: "box",
    cssCode: `/* Flip Y */
.roycss-flip-y {
  perspective: 800px;
  transition: transform 0.6s ease;
  transform-style: preserve-3d;
  background: linear-gradient(135deg, oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72));
  border-radius: 12px;
}

.roycss-flip-y:hover {
  transform: rotateY(180deg);
}`,
  },
  {
    id: "rotate-3d",
    name: "Rotate 3D",
    category: "3d-transforms",
    description: "Continuous rotation around a diagonal 3D axis using rotate3d",
    tags: ["rotate", "3d", "axis", "continuous"],
    previewType: "box",
    cssCode: `/* Rotate 3D */
.roycss-rotate-3d {
  transform-style: preserve-3d;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.606 0.219 292.72));
  border-radius: 12px;
  animation: roy-rotate-3d 4s linear infinite;
}

@keyframes roy-rotate-3d {
  0% { transform: perspective(800px) rotate3d(1, 1, 1, 0deg); }
  100% { transform: perspective(800px) rotate3d(1, 1, 1, 360deg); }
}`,
  },
  {
    id: "book-open",
    name: "Book Open",
    category: "3d-transforms",
    description: "Two book covers that swing open like a book on hover",
    tags: ["book", "open", "cover", "3d"],
    previewType: "box",
    cssCode: `/* Book Open */
.roycss-book-open {
  perspective: 1000px;
  inline-size: 80px;
  block-size: 60px;
  position: relative;
  transform-style: preserve-3d;
  background: transparent;
}

.roycss-book-open::before,
.roycss-book-open::after {
  content: '';
  position: absolute;
  inset-block-start: 0;
  inline-size: 50%;
  block-size: 100%;
  transition: transform 0.8s ease;
  border-radius: 2px 8px 8px 2px;
}

.roycss-book-open::before {
  inset-inline-start: 0;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  transform-origin: right center;
}

.roycss-book-open::after {
  inset-inline-end: 0;
  transform-origin: left center;
  background: linear-gradient(225deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  border-radius: 8px 2px 2px 8px;
}

.roycss-book-open:hover::before {
  transform: rotateY(-160deg);
}

.roycss-book-open:hover::after {
  transform: rotateY(160deg);
}`,
  },
  {
    id: "door-open",
    name: "Door Open",
    category: "3d-transforms",
    description: "A door panel that swings open on its left hinge when hovered",
    tags: ["door", "hinge", "open", "3d"],
    previewType: "box",
    cssCode: `/* Door Open */
.roycss-door-open {
  perspective: 800px;
  inline-size: 60px;
  block-size: 80px;
  position: relative;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  border: 2px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
  border-radius: 4px;
}

.roycss-door-open::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.432 0.086 166.91));
  border-radius: 4px;
  transform-origin: left center;
  transition: transform 0.8s ease;
}

.roycss-door-open:hover::before {
  transform: rotateY(-80deg);
}`,
  },
  {
    id: "drawer-slide",
    name: "Drawer Slide",
    category: "3d-transforms",
    description: "A drawer that slides out and tilts forward in 3D on hover",
    tags: ["drawer", "slide", "tilt", "3d"],
    previewType: "box",
    cssCode: `/* Drawer Slide */
.roycss-drawer-slide {
  perspective: 800px;
  inline-size: 80px;
  block-size: 60px;
  position: relative;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 8%, transparent);
  border: 2px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 25%, transparent);
  border-radius: 6px;
}

.roycss-drawer-slide::before {
  content: '';
  position: absolute;
  inset-block-start: 25%;
  inset-inline-start: 10%;
  inline-size: 80%;
  block-size: 50%;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  border-radius: 3px;
  box-shadow: 0 4px 10px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top center;
}

.roycss-drawer-slide:hover::before {
  transform: translateY(-50%) rotateX(60deg);
}`,
  },
  {
    id: "fold",
    name: "Fold",
    category: "3d-transforms",
    description: "A panel that folds flat backward along its top edge on hover",
    tags: ["fold", "collapse", "rotate", "3d"],
    previewType: "box",
    cssCode: `/* Fold */
.roycss-fold {
  perspective: 800px;
  inline-size: 80px;
  block-size: 60px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  border-radius: 6px;
  transition: transform 0.8s ease;
  transform-origin: top center;
}

.roycss-fold:hover {
  transform: rotateX(90deg);
}`,
  },
  {
    id: "accordion-3d",
    name: "3D Accordion",
    category: "3d-transforms",
    description: "Two panels that fan outward in opposite 3D directions on hover",
    tags: ["accordion", "panels", "fan", "3d"],
    previewType: "box",
    cssCode: `/* 3D Accordion */
.roycss-accordion-3d {
  perspective: 800px;
  inline-size: 80px;
  block-size: 60px;
  position: relative;
  transform-style: preserve-3d;
}

.roycss-accordion-3d::before,
.roycss-accordion-3d::after {
  content: '';
  position: absolute;
  inset-inline-start: 50%;
  inline-size: 60px;
  block-size: 16px;
  margin-inline-start: -30px;
  border-radius: 3px;
  transition: transform 0.6s ease;
}

.roycss-accordion-3d::before {
  inset-block-start: 8px;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  transform-origin: bottom center;
}

.roycss-accordion-3d::after {
  inset-block-end: 8px;
  background: linear-gradient(90deg, oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72));
  transform-origin: top center;
}

.roycss-accordion-3d:hover::before {
  transform: rotateX(-55deg);
}

.roycss-accordion-3d:hover::after {
  transform: rotateX(55deg);
}`,
  },
  {
    id: "3d-book",
    name: "3D Book",
    category: "3d-transforms",
    description: "A standing hardcover book with a spine and bookmark tilting on hover",
    tags: ["book", "spine", "standing", "3d"],
    previewType: "box",
    cssCode: `/* 3D Book */
.roycss-3d-book {
  perspective: 800px;
  inline-size: 60px;
  block-size: 80px;
  position: relative;
  transform-style: preserve-3d;
  transform: rotateY(-25deg);
  transition: transform 0.6s ease;
}

.roycss-3d-book::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.432 0.086 166.91));
  border-radius: 2px 6px 6px 2px;
  box-shadow:
    -5px 5px 0 oklch(0.508 0.105 165.61),
    -10px 10px 20px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}

.roycss-3d-book::after {
  content: '';
  position: absolute;
  inset-block-start: 4px;
  inset-inline-start: 4px;
  inline-size: calc(100% - 12px);
  block-size: 4px;
  background: oklch(0.769 0.165 70.08);
  border-radius: 1px;
}

.roycss-3d-book:hover {
  transform: rotateY(-45deg);
}`,
  },
  {
    id: "3d-poster",
    name: "3D Poster",
    category: "3d-transforms",
    description: "A floating poster card that tilts to the opposite angle on hover",
    tags: ["poster", "card", "tilt", "3d"],
    previewType: "box",
    cssCode: `/* 3D Poster */
.roycss-3d-poster {
  perspective: 1000px;
  inline-size: 80px;
  block-size: 100px;
  background:
    linear-gradient(135deg, color-mix(in oklch, oklch(1 0 89.88) 10%, transparent), transparent),
    linear-gradient(135deg, oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31));
  border-radius: 6px;
  box-shadow:
    0 10px 30px color-mix(in oklch, oklch(0.606 0.219 292.72) 40%, transparent),
    0 0 0 1px color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  transform: perspective(1000px) rotateY(-15deg) rotateX(5deg);
  transition: transform 0.5s ease;
}

.roycss-3d-poster:hover {
  transform: perspective(1000px) rotateY(15deg) rotateX(-5deg);
}`,
  },
  {
    id: "3d-gallery",
    name: "3D Gallery",
    category: "3d-transforms",
    description: "A two-panel 3D gallery frame that continuously rotates on the Y axis",
    tags: ["gallery", "panels", "rotate", "3d"],
    previewType: "box",
    cssCode: `/* 3D Gallery */
.roycss-3d-gallery {
  perspective: 1000px;
  inline-size: 80px;
  block-size: 60px;
  position: relative;
  transform-style: preserve-3d;
  animation: roy-3d-gallery-rotate 8s linear infinite;
}

.roycss-3d-gallery::before,
.roycss-3d-gallery::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 6px;
}

.roycss-3d-gallery::before {
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  transform: rotateY(0deg) translateZ(20px);
}

.roycss-3d-gallery::after {
  background: linear-gradient(135deg, oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72));
  transform: rotateY(90deg) translateZ(20px);
}

@keyframes roy-3d-gallery-rotate {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}`,
  },
  {
    id: "transform-origin-spin",
    name: "Transform Origin Spin",
    category: "3d-transforms",
    description: "A panel that spins around its top-left corner rather than its center",
    tags: ["transform-origin", "spin", "corner", "3d"],
    previewType: "box",
    cssCode: `/* Transform Origin Spin */
.roycss-transform-origin-spin {
  inline-size: 60px;
  block-size: 60px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  border-radius: 8px;
  transform-origin: 0% 0%;
  animation: roy-origin-spin 2s linear infinite;
}

@keyframes roy-origin-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`,
  },
  {
    id: "scale-3d",
    name: "Scale 3D",
    category: "3d-transforms",
    description: "A panel that scales up and lifts toward the viewer on hover",
    tags: ["scale", "lift", "depth", "3d"],
    previewType: "box",
    cssCode: `/* Scale 3D */
.roycss-scale-3d {
  inline-size: 60px;
  block-size: 60px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.432 0.086 166.91));
  border-radius: 8px;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
  box-shadow: 0 4px 10px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}

.roycss-scale-3d:hover {
  transform: perspective(800px) scale3d(1.2, 1.2, 1.2) translateZ(40px);
}`,
  },
  {
    id: "skew-3d",
    name: "Skew 3D",
    category: "3d-transforms",
    description: "A skewed panel that flips its skew and gains a Y rotation on hover",
    tags: ["skew", "perspective", "flip", "3d"],
    previewType: "box",
    cssCode: `/* Skew 3D */
.roycss-skew-3d {
  inline-size: 60px;
  block-size: 60px;
  background: linear-gradient(135deg, oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72));
  border-radius: 8px;
  transform: perspective(800px) skew(-15deg, 5deg);
  transition: transform 0.5s ease;
  box-shadow: 6px 6px 12px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}

.roycss-skew-3d:hover {
  transform: perspective(800px) skew(15deg, -5deg) rotateY(20deg);
}`,
  },
  {
    id: "rotate-x",
    name: "Rotate X",
    category: "3d-transforms",
    description: "A panel that continuously tumbles end-over-end around the X axis",
    tags: ["rotate", "x-axis", "tumble", "3d"],
    previewType: "box",
    cssCode: `/* Rotate X */
.roycss-rotate-x {
  inline-size: 60px;
  block-size: 60px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  border-radius: 8px;
  transform-style: preserve-3d;
  animation: roy-rotate-x 3s linear infinite;
}

@keyframes roy-rotate-x {
  0% { transform: perspective(800px) rotateX(0deg); }
  100% { transform: perspective(800px) rotateX(360deg); }
}`,
  },
  {
    id: "rotate-y",
    name: "Rotate Y",
    category: "3d-transforms",
    description: "A panel that continuously spins around its vertical Y axis",
    tags: ["rotate", "y-axis", "spin", "3d"],
    previewType: "box",
    cssCode: `/* Rotate Y */
.roycss-rotate-y {
  inline-size: 60px;
  block-size: 60px;
  background: linear-gradient(135deg, oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72));
  border-radius: 8px;
  transform-style: preserve-3d;
  animation: roy-rotate-y 3s linear infinite;
}

@keyframes roy-rotate-y {
  0% { transform: perspective(800px) rotateY(0deg); }
  100% { transform: perspective(800px) rotateY(360deg); }
}`,
  },
];
