import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 11 — Creative / Experimental CSS Art (40)
 * 15 visual (material & nature) + 10 backgrounds (artistic textures)
 * + 10 animations (creative motion) + 5 text (creative typography).
 *
 * Every class uses the `roycss-` prefix (`.roycss-{id}`).
 * Every @keyframes uses the `roy-b11-` prefix — guaranteed unique across
 * the RoyCSS library (no collisions with batches 1–8 + roycss-effects.ts).
 * Each `cssCode` is self-contained (class + pseudo-elements + @keyframes).
 *
 * Preview rendering notes:
 * - previewType "box" → outer div (Tailwind w-20 h-20); CSS overrides
 *   width/height/background so the surface/material is visible. The inner
 *   injected 6×6 div is hidden via `> div { display: none }` where needed.
 * - previewType "background" → full-bleed preview container.
 * - previewType "text" → single span with previewText.
 * - previewType "loader" → container; childCount spans may be rendered.
 */
export const effectsBatch11: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════════
  // VISUAL — material & nature (15)
  // ═══════════════════════════════════════════════════════════════════

  // 1 ─ Liquid Metal ───────────────────────────────────────────────
  {
    id: "liquid-metal",
    name: "Liquid Metal",
    category: "visual",
    description: "Mercury-like liquid metal surface with flowing reflective gradients",
    tags: ["liquid", "metal", "chrome", "reflective"],
    previewType: "box",
    cssCode: `/* Liquid Metal — flowing reflective chrome surface */
.roycss-liquid-metal {
  position: relative;
  inline-size: 200px;
  block-size: 160px;
  border-radius: 50% 50% 45% 55% / 60% 55% 45% 40%;
  background:
    radial-gradient(ellipse 60% 40% at 30% 25%, color-mix(in oklch, oklch(1 0 89.88) 95%, transparent), transparent 60%),
    radial-gradient(ellipse 50% 35% at 70% 70%, color-mix(in oklch, oklch(0.603 0.026 258.37) 60%, transparent), transparent 65%),
    linear-gradient(125deg,
      oklch(0.89 0.011 256.7) 0%,
      oklch(0.972 0.005 258.32) 12%,
      oklch(0.652 0.016 260.72) 26%,
      oklch(0.944 0.008 253.85) 40%,
      oklch(0.505 0.021 261.29) 52%,
      oklch(0.85 0.012 259.82) 66%,
      oklch(0.382 0.017 262.29) 78%,
      oklch(0.756 0.016 260.73) 90%,
      oklch(0.551 0.023 264.36) 100%);
  background-size: 200% 200%;
  box-shadow:
    inset -8px -10px 20px color-mix(in oklch, oklch(0 0 0) 45%, transparent),
    inset 8px 10px 18px color-mix(in oklch, oklch(1 0 89.88) 55%, transparent),
    0 14px 30px color-mix(in oklch, oklch(0 0 0) 35%, transparent);
  filter: contrast(1.15) saturate(0.85);
  animation: roy-b11-liquid-metal-flow 7s ease-in-out infinite;
}
.roycss-liquid-metal > div { display: none; }

.roycss-liquid-metal::before {
  content: '';
  position: absolute;
  inset-block-start: 12%; inset-inline-start: 18%;
  inline-size: 45%; block-size: 22%;
  border-radius: 50%;
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(1 0 89.88) 85%, transparent), transparent 70%);
  filter: blur(2px);
  animation: roy-b11-liquid-metal-shine 5s ease-in-out infinite;
}

@keyframes roy-b11-liquid-metal-flow {
  0%, 100% { background-position: 0% 0%; border-radius: 50% 50% 45% 55% / 60% 55% 45% 40%; }
  33%      { background-position: 100% 50%; border-radius: 55% 45% 50% 50% / 45% 55% 50% 50%; }
  66%      { background-position: 50% 100%; border-radius: 45% 55% 60% 40% / 55% 45% 60% 40%; }
}
@keyframes roy-b11-liquid-metal-shine {
  0%, 100% { transform: translate(0,0) scale(1); opacity: 0.85; }
  50%      { transform: translate(60px, 30px) scale(1.3); opacity: 0.4; }
}`,
  },

  // 2 ─ Oil Slick ─────────────────────────────────────────────────
  {
    id: "oil-slick",
    name: "Oil Slick",
    category: "visual",
    description: "Iridescent oil slick with swirling rainbow refractions on dark water",
    tags: ["oil", "iridescent", "rainbow", "slick"],
    previewType: "box",
    cssCode: `/* Oil Slick — iridescent swirl on water */
.roycss-oil-slick {
  position: relative;
  inline-size: 220px;
  block-size: 160px;
  border-radius: 16px;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 60%, oklch(0.158 0.012 260.62) 0%, oklch(0.107 0.019 262.03) 100%);
}
.roycss-oil-slick > div { display: none; }

.roycss-oil-slick::before {
  content: '';
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(circle at 25% 35%, color-mix(in oklch, oklch(0.645 0.26 2.47) 55%, transparent), transparent 28%),
    radial-gradient(circle at 65% 25%, color-mix(in oklch, oklch(0.776 0.149 226.59) 55%, transparent), transparent 30%),
    radial-gradient(circle at 75% 65%, color-mix(in oklch, oklch(0.919 0.214 129.95) 55%, transparent), transparent 26%),
    radial-gradient(circle at 35% 75%, color-mix(in oklch, oklch(0.857 0.175 88.49) 55%, transparent), transparent 30%),
    radial-gradient(circle at 50% 50%, color-mix(in oklch, oklch(0.622 0.306 315.34) 50%, transparent), transparent 32%),
    conic-gradient(from 0deg at 50% 50%,
      oklch(0.641 0.257 8.07), oklch(0.839 0.171 83.34), oklch(0.546 0.248 295.88), oklch(0.637 0.195 259.51), oklch(0.882 0.203 158.76), oklch(0.641 0.257 8.07));
  background-size: 180% 180%;
  filter: blur(8px) saturate(1.4);
  mix-blend-mode: screen;
  animation: roy-b11-oil-slick-swirl 12s linear infinite;
}

.roycss-oil-slick::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 30% at 50% 15%, color-mix(in oklch, oklch(1 0 89.88) 12%, transparent), transparent 70%),
    repeating-linear-gradient(90deg, transparent 0 14px, color-mix(in oklch, oklch(0 0 0) 8%, transparent) 14px 15px);
  pointer-events: none;
}

@keyframes roy-b11-oil-slick-swirl {
  0%   { transform: rotate(0deg)   scale(1.2); background-position: 0% 0%; }
  50%  { transform: rotate(180deg) scale(1.4); background-position: 100% 100%; }
  100% { transform: rotate(360deg) scale(1.2); background-position: 0% 0%; }
}`,
  },

  // 3 ─ Soap Bubble ───────────────────────────────────────────────
  {
    id: "soap-bubble",
    name: "Soap Bubble",
    category: "visual",
    description: "Translucent iridescent soap bubble with shifting film colors",
    tags: ["soap", "bubble", "iridescent", "translucent"],
    previewType: "box",
    cssCode: `/* Soap Bubble — iridescent film sphere */
.roycss-soap-bubble {
  position: relative;
  inline-size: 180px;
  block-size: 180px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 28%, color-mix(in oklch, oklch(1 0 89.88) 95%, transparent), color-mix(in oklch, oklch(1 0 89.88) 5%, transparent) 18%, transparent 32%),
    radial-gradient(circle at 70% 65%, color-mix(in oklch, oklch(0.673 0.29 341.41) 35%, transparent), transparent 40%),
    radial-gradient(circle at 30% 75%, color-mix(in oklch, oklch(0.889 0.177 169.75) 35%, transparent), transparent 40%),
    radial-gradient(circle at 75% 25%, color-mix(in oklch, oklch(0.897 0.185 97.44) 30%, transparent), transparent 40%),
    conic-gradient(from 30deg,
      color-mix(in oklch, oklch(0.702 0.229 349.48) 35%, transparent),
      color-mix(in oklch, oklch(0.788 0.131 231.8) 35%, transparent),
      color-mix(in oklch, oklch(0.923 0.183 133.01) 35%, transparent),
      color-mix(in oklch, oklch(0.861 0.147 83.67) 35%, transparent),
      color-mix(in oklch, oklch(0.64 0.249 306.76) 35%, transparent),
      color-mix(in oklch, oklch(0.702 0.229 349.48) 35%, transparent));
  box-shadow:
    inset 0 0 40px color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    inset -20px -25px 50px color-mix(in oklch, oklch(0.336 0.172 308.39) 25%, transparent),
    inset 15px 20px 40px color-mix(in oklch, oklch(0.73 0.16 237.36) 25%, transparent),
    0 8px 30px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 40%, transparent);
  filter: saturate(1.2);
  animation: roy-b11-soap-bubble-float 6s ease-in-out infinite;
}
.roycss-soap-bubble > div { display: none; }

.roycss-soap-bubble::before {
  content: '';
  position: absolute;
  inset-block-start: 14%; inset-inline-start: 22%;
  inline-size: 18%; block-size: 14%;
  border-radius: 50%;
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(1 0 89.88) 95%, transparent), transparent 70%);
  filter: blur(1px);
}

@keyframes roy-b11-soap-bubble-float {
  0%, 100% { transform: translateY(0) rotate(0deg); filter: saturate(1.2) hue-rotate(0deg); }
  50%      { transform: translateY(-12px) rotate(8deg); filter: saturate(1.4) hue-rotate(40deg); }
}`,
  },

  // 4 ─ Molten Lava ───────────────────────────────────────────────
  {
    id: "molten-lava",
    name: "Molten Lava",
    category: "visual",
    description: "Glowing molten lava surface with flowing crust cracks",
    tags: ["lava", "molten", "fire", "cracks"],
    previewType: "box",
    cssCode: `/* Molten Lava — glowing crust over molten core */
.roycss-molten-lava {
  position: relative;
  inline-size: 220px;
  block-size: 160px;
  border-radius: 14px;
  overflow: hidden;
  background: oklch(0.163 0.033 33.34);
  box-shadow: 0 0 30px color-mix(in oklch, oklch(0.671 0.221 37.64) 45%, transparent), inset 0 0 40px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}
.roycss-molten-lava > div { display: none; }

.roycss-molten-lava::before {
  content: '';
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(ellipse 30% 20% at 25% 30%, oklch(0.949 0.101 98.88) 0%, oklch(0.751 0.179 58.28) 18%, oklch(0.644 0.243 32.25) 32%, transparent 50%),
    radial-gradient(ellipse 40% 25% at 70% 60%, oklch(0.937 0.131 99.53) 0%, oklch(0.702 0.2 45.1) 20%, oklch(0.527 0.211 30.14) 38%, transparent 55%),
    radial-gradient(ellipse 25% 18% at 50% 80%, oklch(0.908 0.157 96.48) 0%, oklch(0.676 0.217 38.8) 22%, oklch(0.4 0.164 29.23) 40%, transparent 55%),
    radial-gradient(ellipse 20% 15% at 85% 30%, oklch(0.875 0.16 89.83) 0%, oklch(0.709 0.197 46.81) 25%, transparent 45%);
  filter: blur(2px);
  animation: roy-b11-molten-lava-flow 5s ease-in-out infinite alternate;
}

.roycss-molten-lava::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(20deg, transparent 0 24px, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 24px 26px),
    repeating-linear-gradient(-55deg, transparent 0 34px, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 34px 36px),
    radial-gradient(ellipse at 50% 50%, transparent 30%, color-mix(in oklch, oklch(0 0 0) 60%, transparent) 100%);
  mix-blend-mode: multiply;
  opacity: 0.85;
}

@keyframes roy-b11-molten-lava-flow {
  0%   { transform: translate(0,0) scale(1); filter: blur(2px) hue-rotate(-8deg) brightness(1); }
  100% { transform: translate(-12px,8px) scale(1.08); filter: blur(2px) hue-rotate(8deg) brightness(1.25); }
}`,
  },

  // 5 ─ Frozen Ice ────────────────────────────────────────────────
  {
    id: "frozen-ice",
    name: "Frozen Ice",
    category: "visual",
    description: "Translucent frozen ice block with crystalline fracture patterns",
    tags: ["ice", "frozen", "crystal", "winter"],
    previewType: "box",
    cssCode: `/* Frozen Ice — crystalline translucent block */
.roycss-frozen-ice {
  position: relative;
  inline-size: 200px;
  block-size: 160px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(ellipse 50% 40% at 25% 20%, color-mix(in oklch, oklch(1 0 89.88) 70%, transparent), transparent 60%),
    radial-gradient(ellipse 40% 30% at 75% 75%, color-mix(in oklch, oklch(0.839 0.088 241.5) 50%, transparent), transparent 60%),
    linear-gradient(135deg, oklch(0.927 0.029 230.3) 0%, oklch(0.847 0.057 232.14) 35%, oklch(0.704 0.076 233.95) 70%, oklch(0.917 0.032 230.27) 100%);
  box-shadow:
    inset 8px 12px 25px color-mix(in oklch, oklch(1 0 89.88) 60%, transparent),
    inset -8px -12px 25px color-mix(in oklch, oklch(0.458 0.098 250.82) 40%, transparent),
    0 10px 30px color-mix(in oklch, oklch(0.616 0.087 239.49) 40%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 70%, transparent);
  backdrop-filter: blur(2px);
}
.roycss-frozen-ice > div { display: none; }

.roycss-frozen-ice::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, transparent 49.6%, color-mix(in oklch, oklch(1 0 89.88) 65%, transparent) 49.8%, color-mix(in oklch, oklch(1 0 89.88) 65%, transparent) 50.2%, transparent 50.4%),
    linear-gradient(75deg, transparent 49.6%, color-mix(in oklch, oklch(0.878 0.064 245.03) 50%, transparent) 49.8%, color-mix(in oklch, oklch(0.878 0.064 245.03) 50%, transparent) 50.2%, transparent 50.4%),
    linear-gradient(160deg, transparent 49.6%, color-mix(in oklch, oklch(1 0 89.88) 40%, transparent) 49.8%, color-mix(in oklch, oklch(1 0 89.88) 40%, transparent) 50.2%, transparent 50.4%),
    linear-gradient(20deg, transparent 39.6%, color-mix(in oklch, oklch(0.878 0.064 245.03) 35%, transparent) 39.8%, color-mix(in oklch, oklch(0.878 0.064 245.03) 35%, transparent) 40.2%, transparent 40.4%);
  filter: drop-shadow(0 0 1px color-mix(in oklch, oklch(1 0 89.88) 50%, transparent));
  animation: roy-b11-frozen-ice-sparkle 4s ease-in-out infinite;
}

.roycss-frozen-ice::after {
  content: '';
  position: absolute;
  inset-block-start: 8%; inset-inline-start: 12%;
  inline-size: 30%; block-size: 12%;
  border-radius: 50%;
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(1 0 89.88) 85%, transparent), transparent 70%);
  filter: blur(1px);
}

@keyframes roy-b11-frozen-ice-sparkle {
  0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 1px color-mix(in oklch, oklch(1 0 89.88) 50%, transparent)); }
  50%      { opacity: 1; filter: drop-shadow(0 0 4px color-mix(in oklch, oklch(1 0 89.88) 90%, transparent)); }
}`,
  },

  // 6 ─ Gold Leaf ─────────────────────────────────────────────────
  {
    id: "gold-leaf",
    name: "Gold Leaf",
    category: "visual",
    description: "Crumpled gold leaf with rich metallic sheen and texture",
    tags: ["gold", "leaf", "metallic", "foil"],
    previewType: "box",
    cssCode: `/* Gold Leaf — crumpled metallic foil */
.roycss-gold-leaf {
  position: relative;
  inline-size: 200px;
  block-size: 160px;
  border-radius: 8px;
  background:
    radial-gradient(ellipse 30% 25% at 20% 25%, oklch(0.973 0.051 97.64), transparent 55%),
    radial-gradient(ellipse 25% 20% at 75% 70%, oklch(0.7 0.137 82.62), transparent 60%),
    radial-gradient(ellipse 20% 18% at 65% 30%, oklch(0.932 0.118 96.68), transparent 55%),
    radial-gradient(ellipse 28% 22% at 30% 75%, oklch(0.645 0.127 77.49), transparent 60%),
    linear-gradient(115deg,
      oklch(0.645 0.127 77.49) 0%,
      oklch(0.958 0.086 99.2) 12%,
      oklch(0.735 0.146 84.27) 28%,
      oklch(0.932 0.118 96.68) 42%,
      oklch(0.602 0.12 77.51) 58%,
      oklch(0.958 0.086 99.2) 72%,
      oklch(0.7 0.137 82.62) 88%,
      oklch(0.51 0.104 70.73) 100%);
  background-size: 220% 220%, 200% 200%, 200% 200%, 200% 200%, 200% 200%;
  box-shadow:
    inset 0 0 20px color-mix(in oklch, oklch(0 0 0) 25%, transparent),
    inset 6px 8px 14px color-mix(in oklch, oklch(0.967 0.059 96.92) 40%, transparent),
    0 8px 22px color-mix(in oklch, oklch(0.345 0.074 72.83) 40%, transparent);
  filter: contrast(1.1) saturate(1.2);
  animation: roy-b11-gold-leaf-shimmer 6s ease-in-out infinite;
}
.roycss-gold-leaf > div { display: none; }

.roycss-gold-leaf::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(35deg, transparent 0 8px, color-mix(in oklch, oklch(0 0 0) 12%, transparent) 8px 9px),
    repeating-linear-gradient(-50deg, transparent 0 14px, color-mix(in oklch, oklch(0.953 0.078 95.74) 15%, transparent) 14px 15px);
  mix-blend-mode: overlay;
  border-radius: inherit;
}

@keyframes roy-b11-gold-leaf-shimmer {
  0%, 100% { background-position: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%; }
  50%      { background-position: 100% 100%, 50% 50%, 80% 30%, 30% 70%, 50% 50%; }
}`,
  },

  // 7 ─ Velvet Fabric ─────────────────────────────────────────────
  {
    id: "velvet-fabric",
    name: "Velvet Fabric",
    category: "visual",
    description: "Deep velvet fabric with shifting nap sheen",
    tags: ["velvet", "fabric", "sheen", "texture"],
    previewType: "box",
    cssCode: `/* Velvet Fabric — deep pile with shifting nap */
.roycss-velvet-fabric {
  position: relative;
  inline-size: 200px;
  block-size: 160px;
  border-radius: 12px;
  background:
    radial-gradient(ellipse 70% 50% at 30% 30%, color-mix(in oklch, oklch(0.516 0.178 4.95) 70%, transparent), transparent 60%),
    radial-gradient(ellipse 60% 50% at 75% 70%, color-mix(in oklch, oklch(0.232 0.095 356.89) 85%, transparent), transparent 65%),
    linear-gradient(135deg, oklch(0.381 0.142 3.86) 0%, oklch(0.269 0.1 4.42) 50%, oklch(0.345 0.127 5.2) 100%);
  box-shadow:
    inset 0 0 30px color-mix(in oklch, oklch(0 0 0) 60%, transparent),
    inset 8px 10px 18px color-mix(in oklch, oklch(0.744 0.171 358.78) 25%, transparent),
    inset -8px -10px 18px color-mix(in oklch, oklch(0 0 0) 50%, transparent),
    0 10px 25px color-mix(in oklch, oklch(0.179 0.072 1.69) 50%, transparent);
}
.roycss-velvet-fabric > div { display: none; }

.roycss-velvet-fabric::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(135deg,
      transparent 0 1px,
      color-mix(in oklch, oklch(0.797 0.138 350.72) 18%, transparent) 1px 2px,
      transparent 2px 3px,
      color-mix(in oklch, oklch(0 0 0) 25%, transparent) 3px 4px);
  mix-blend-mode: overlay;
  border-radius: inherit;
  animation: roy-b11-velvet-sheen 5s ease-in-out infinite;
}

.roycss-velvet-fabric::after {
  content: '';
  position: absolute;
  inset-block-start: 20%; inset-inline-start: 15%;
  inline-size: 60%; block-size: 30%;
  border-radius: 50%;
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(0.849 0.094 353.59) 45%, transparent), transparent 70%);
  filter: blur(8px);
  animation: roy-b11-velvet-sheen 5s ease-in-out infinite reverse;
}

@keyframes roy-b11-velvet-sheen {
  0%, 100% { transform: translateX(-10%); opacity: 0.55; }
  50%      { transform: translateX(20%); opacity: 0.9; }
}`,
  },

  // 8 ─ Stained Glass ─────────────────────────────────────────────
  {
    id: "stained-glass",
    name: "Stained Glass",
    category: "visual",
    description: "Colorful stained-glass window with dark lead seams",
    tags: ["stained", "glass", "lead", "colorful"],
    previewType: "box",
    cssCode: `/* Stained Glass — colorful panels divided by lead seams */
.roycss-stained-glass {
  position: relative;
  inline-size: 200px;
  block-size: 180px;
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(115deg, oklch(0.218 0 89.88) 0 8%, transparent 8% 9%, oklch(0.218 0 89.88) 9% 17%, transparent 17% 18%, oklch(0.218 0 89.88) 18% 26%, transparent 26% 27%, oklch(0.218 0 89.88) 27% 35%, transparent 35% 36%, oklch(0.218 0 89.88) 36% 44%, transparent 44% 45%, oklch(0.218 0 89.88) 45% 53%, transparent 53% 54%, oklch(0.218 0 89.88) 54% 62%, transparent 62% 63%, oklch(0.218 0 89.88) 63% 71%, transparent 71% 72%, oklch(0.218 0 89.88) 72% 80%, transparent 80% 81%, oklch(0.218 0 89.88) 81% 89%, transparent 89% 90%, oklch(0.218 0 89.88) 90% 100%),
    linear-gradient(25deg, oklch(0.218 0 89.88) 0 9%, transparent 9% 10%, oklch(0.218 0 89.88) 10% 19%, transparent 19% 20%, oklch(0.218 0 89.88) 20% 29%, transparent 29% 30%, oklch(0.218 0 89.88) 30% 39%, transparent 39% 40%, oklch(0.218 0 89.88) 40% 49%, transparent 49% 50%, oklch(0.218 0 89.88) 50% 59%, transparent 59% 60%, oklch(0.218 0 89.88) 60% 69%, transparent 69% 70%, oklch(0.218 0 89.88) 70% 79%, transparent 79% 80%, oklch(0.218 0 89.88) 80% 89%, transparent 89% 90%, oklch(0.218 0 89.88) 90% 100%),
    radial-gradient(circle at 20% 25%, oklch(0.53 0.207 22.32) 0 22%, transparent 22%),
    radial-gradient(circle at 75% 20%, oklch(0.887 0.182 95.33) 0 18%, transparent 18%),
    radial-gradient(circle at 30% 70%, oklch(0.652 0.19 253.21) 0 24%, transparent 24%),
    radial-gradient(circle at 80% 75%, oklch(0.515 0.261 309.81) 0 20%, transparent 20%),
    radial-gradient(circle at 55% 45%, oklch(0.751 0.179 58.28) 0 18%, transparent 18%),
    radial-gradient(circle at 50% 90%, oklch(0.746 0.181 152.33) 0 16%, transparent 16%),
    linear-gradient(45deg, oklch(0.324 0.148 309.24), oklch(0.422 0.148 10.46), oklch(0.414 0.12 257.24), oklch(0.591 0.139 124.95));
  background-blend-mode: normal, normal, screen, screen, screen, screen, screen, screen, normal;
  filter: saturate(1.3) brightness(1.05);
  box-shadow: 0 0 25px color-mix(in oklch, oklch(0.863 0.133 80.39) 30%, transparent), inset 0 0 0 2px oklch(0.218 0 89.88);
}
.roycss-stained-glass > div { display: none; }

.roycss-stained-glass::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 40% at 50% 100%, color-mix(in oklch, oklch(0.953 0.078 95.74) 40%, transparent), transparent 70%);
  mix-blend-mode: screen;
  animation: roy-b11-stained-glass-light 8s ease-in-out infinite;
}

@keyframes roy-b11-stained-glass-light {
  0%, 100% { opacity: 0.7; transform: translateY(0); }
  50%      { opacity: 1; transform: translateY(-8%); }
}`,
  },

  // 9 ─ Neon Sign ─────────────────────────────────────────────────
  {
    id: "neon-sign",
    name: "Neon Sign",
    category: "visual",
    description: "Glowing neon tube sign with flicker and electric buzz",
    tags: ["neon", "sign", "glow", "tube"],
    previewType: "box",
    cssCode: `/* Neon Sign — glowing tube sign with flicker */
.roycss-neon-sign {
  position: relative;
  inline-size: 200px;
  block-size: 160px;
  border-radius: 12px;
  background: radial-gradient(ellipse at 50% 50%, oklch(0.194 0.08 297.65) 0%, oklch(0.096 0.051 300.12) 100%);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.roycss-neon-sign > div { display: none; }

.roycss-neon-sign::before {
  content: 'NEON';
  position: absolute;
  font: 900 56px/1 'Arial Black', sans-serif;
  letter-spacing: 0.1em;
  color: oklch(1 0 89.88);
  text-shadow:
    0 0 4px oklch(1 0 89.88),
    0 0 12px oklch(0.683 0.303 335.86),
    0 0 24px oklch(0.683 0.303 335.86),
    0 0 44px oklch(0.683 0.303 335.86),
    0 0 80px oklch(0.683 0.303 335.86);
  animation: roy-b11-neon-flicker 3.5s linear infinite;
}

.roycss-neon-sign::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 50% 30% at 50% 50%, color-mix(in oklch, oklch(0.683 0.303 335.86) 35%, transparent), transparent 70%);
  pointer-events: none;
  animation: roy-b11-neon-glow 3.5s linear infinite;
}

@keyframes roy-b11-neon-flicker {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 64%, 100% {
    opacity: 1;
    text-shadow: 0 0 4px oklch(1 0 89.88), 0 0 12px oklch(0.683 0.303 335.86), 0 0 24px oklch(0.683 0.303 335.86), 0 0 44px oklch(0.683 0.303 335.86), 0 0 80px oklch(0.683 0.303 335.86);
  }
  20%, 24%, 55%, 65% {
    opacity: 0.4;
    text-shadow: 0 0 2px oklch(1 0 89.88), 0 0 4px oklch(0.683 0.303 335.86);
  }
}
@keyframes roy-b11-neon-glow {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 64%, 100% { opacity: 0.85; }
  20%, 24%, 55%, 65% { opacity: 0.2; }
}`,
  },

  // 10 ─ Origami Fold ─────────────────────────────────────────────
  {
    id: "origami-fold",
    name: "Origami Fold",
    category: "visual",
    description: "Folded paper crane effect with crisp polygonal facets",
    tags: ["origami", "paper", "fold", "geometric"],
    previewType: "box",
    cssCode: `/* Origami Fold — polygonal paper facets */
.roycss-origami-fold {
  position: relative;
  inline-size: 200px;
  block-size: 180px;
  background: oklch(0.985 0 89.88);
  clip-path: polygon(
    50% 0%, 100% 35%, 75% 100%, 25% 100%, 0% 35%);
}
.roycss-origami-fold > div { display: none; }

.roycss-origami-fold::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, transparent 49.5%, oklch(0.53 0.207 22.32) 49.5% 50.5%, transparent 50.5%),
    linear-gradient(45deg,  transparent 49.5%, oklch(0.218 0 89.88) 49.5% 50.5%, transparent 50.5%),
    linear-gradient(90deg,  transparent 49.5%, oklch(0.53 0.207 22.32) 49.5% 50.5%, transparent 50.5%),
    linear-gradient(0deg,   transparent 49.5%, oklch(0.218 0 89.88) 49.5% 50.5%, transparent 50.5%),
    conic-gradient(from 0deg at 50% 50%,
      oklch(0.712 0.181 22.84) 0deg 72deg,
      oklch(0.803 0.146 64.6) 72deg 144deg,
      oklch(0.883 0.165 92.22) 144deg 216deg,
      oklch(0.802 0.168 147.32) 216deg 288deg,
      oklch(0.782 0.115 243.83) 288deg 360deg);
  clip-path: inherit;
  filter: saturate(1.1);
}

.roycss-origami-fold::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, color-mix(in oklch, oklch(1 0 89.88) 40%, transparent) 0%, transparent 50%),
    linear-gradient(295deg, color-mix(in oklch, oklch(0 0 0) 25%, transparent) 0%, transparent 50%);
  clip-path: inherit;
  mix-blend-mode: overlay;
  animation: roy-b11-origami-fold-rotate 8s ease-in-out infinite;
}

@keyframes roy-b11-origami-fold-rotate {
  0%, 100% { filter: hue-rotate(0deg) brightness(1); }
  50%      { filter: hue-rotate(40deg) brightness(1.1); }
}`,
  },

  // 11 ─ Water Ripple ─────────────────────────────────────────────
  {
    id: "water-ripple",
    name: "Water Ripple",
    category: "visual",
    description: "Concentric expanding water ripples from a drop point",
    tags: ["water", "ripple", "concentric", "drop"],
    previewType: "box",
    cssCode: `/* Water Ripple — expanding concentric rings */
.roycss-water-ripple {
  position: relative;
  inline-size: 200px;
  block-size: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.723 0.107 226.27) 0%, oklch(0.495 0.09 232.27) 70%, oklch(0.347 0.065 233.52) 100%);
  overflow: hidden;
}
.roycss-water-ripple > div { display: none; }

.roycss-water-ripple::before,
.roycss-water-ripple::after {
  content: '';
  position: absolute;
  inset-block-start: 50%; inset-inline-start: 50%;
  inline-size: 20px; block-size: 20px;
  border-radius: 50%;
  border: 2px solid color-mix(in oklch, oklch(1 0 89.88) 70%, transparent);
  transform: translate(-50%, -50%);
  animation: roy-b11-water-ripple 3s ease-out infinite;
}

.roycss-water-ripple::after {
  animation-delay: 1.5s;
}

@keyframes roy-b11-water-ripple {
  0%   { inline-size: 20px; block-size: 20px; opacity: 1; border-inline-size: 2px; }
  100% { inline-size: 220px; block-size: 220px; opacity: 0; border-inline-size: 0.5px; }
}`,
  },

  // 12 ─ Prism Rainbow ────────────────────────────────────────────
  {
    id: "prism-rainbow",
    name: "Prism Rainbow",
    category: "visual",
    description: "Light splitting through a glass prism into a rainbow spectrum",
    tags: ["prism", "rainbow", "spectrum", "light"],
    previewType: "box",
    cssCode: `/* Prism Rainbow — light splitting into spectrum */
.roycss-prism-rainbow {
  position: relative;
  inline-size: 220px;
  block-size: 160px;
  background: oklch(0.15 0.021 283.53);
  overflow: hidden;
  border-radius: 8px;
}
.roycss-prism-rainbow > div { display: none; }

.roycss-prism-rainbow::before {
  content: '';
  position: absolute;
  inset-block-start: 50%; inset-inline-start: 8%;
  inline-size: 0; block-size: 0;
  border-inline-start: 30px solid color-mix(in oklch, oklch(1 0 89.88) 85%, transparent);
  border-block-start: 28px solid transparent;
  border-block-end: 28px solid transparent;
  transform: translateY(-50%) skewY(-12deg);
  filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(1 0 89.88) 60%, transparent));
}

.roycss-prism-rainbow::after {
  content: '';
  position: absolute;
  inset-block-start: 0; inset-inline-start: 28%;
  inline-size: 60%; block-size: 100%;
  background: linear-gradient(90deg,
    oklch(0.628 0.258 29.23) 0%, oklch(0.73 0.186 52.57) 14%, oklch(0.968 0.211 109.77) 28%,
    oklch(0.866 0.295 142.5) 42%, oklch(0.452 0.313 264.05) 57%, oklch(0.339 0.179 301.68) 71%, oklch(0.515 0.261 309.81) 85%, transparent 100%);
  filter: blur(6px);
  mix-blend-mode: screen;
  opacity: 0.85;
  transform: skewX(-18deg) translateX(-10%);
  animation: roy-b11-prism-rainbow-shift 5s ease-in-out infinite;
}

@keyframes roy-b11-prism-rainbow-shift {
  0%, 100% { transform: skewX(-18deg) translateX(-10%); filter: blur(6px) brightness(1); }
  50%      { transform: skewX(-22deg) translateX(8%); filter: blur(8px) brightness(1.2); }
}`,
  },

  // 13 ─ Heat Haze ────────────────────────────────────────────────
  {
    id: "heat-haze",
    name: "Heat Haze",
    category: "visual",
    description: "Shimmering heat-haze distortion rising from a hot surface",
    tags: ["heat", "haze", "shimmer", "distortion"],
    previewType: "box",
    cssCode: `/* Heat Haze — rising shimmer distortion */
.roycss-heat-haze {
  position: relative;
  inline-size: 220px;
  block-size: 180px;
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(180deg, oklch(0.815 0.082 225.75) 0%, oklch(0.901 0.089 78.42) 60%, oklch(0.705 0.193 39.23) 100%);
}
.roycss-heat-haze > div { display: none; }

.roycss-heat-haze::before {
  content: '';
  position: absolute;
  inset: -10% -10% 0 -10%;
  background:
    repeating-linear-gradient(0deg,
      color-mix(in oklch, oklch(1 0 89.88) 8%, transparent) 0px,
      color-mix(in oklch, oklch(1 0 89.88) 8%, transparent) 4px,
      transparent 4px,
      transparent 12px);
  filter: blur(3px);
  mix-blend-mode: overlay;
  animation: roy-b11-heat-haze-warp 3s ease-in-out infinite;
}

.roycss-heat-haze::after {
  content: '';
  position: absolute;
  inset-block-end: 0; inset-inline-start: 0;
  inline-size: 100%; block-size: 30%;
  background: linear-gradient(0deg, color-mix(in oklch, oklch(0.671 0.221 37.64) 40%, transparent), transparent);
  mix-blend-mode: multiply;
}

@keyframes roy-b11-heat-haze-warp {
  0%, 100% { transform: translateX(0) skewX(0deg); filter: blur(3px); }
  25%      { transform: translateX(-6px) skewX(3deg); filter: blur(4px); }
  50%      { transform: translateX(4px) skewX(-3deg); filter: blur(2px); }
  75%      { transform: translateX(-3px) skewX(2deg); filter: blur(3px); }
}`,
  },

  // 14 ─ Deep Sea ─────────────────────────────────────────────────
  {
    id: "deep-sea",
    name: "Deep Sea",
    category: "visual",
    description: "Deep underwater abyss with caustic light rays piercing the depths",
    tags: ["deep", "sea", "underwater", "caustics"],
    previewType: "box",
    cssCode: `/* Deep Sea — underwater abyss with caustic rays */
.roycss-deep-sea {
  position: relative;
  inline-size: 220px;
  block-size: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(180deg, oklch(0.456 0.079 228.92) 0%, oklch(0.347 0.065 233.52) 40%, oklch(0.228 0.042 238.55) 80%, oklch(0.165 0.031 237.9) 100%);
}
.roycss-deep-sea > div { display: none; }

.roycss-deep-sea::before {
  content: '';
  position: absolute;
  inset-block-start: -20%; inset-inline-start: 0;
  inline-size: 100%; block-size: 80%;
  background:
    linear-gradient(165deg, color-mix(in oklch, oklch(0.898 0.062 229.91) 25%, transparent) 0%, transparent 35%),
    linear-gradient(195deg, color-mix(in oklch, oklch(0.898 0.062 229.91) 20%, transparent) 0%, transparent 40%),
    linear-gradient(175deg, color-mix(in oklch, oklch(0.898 0.062 229.91) 18%, transparent) 0%, transparent 30%);
  filter: blur(8px);
  mix-blend-mode: screen;
  animation: roy-b11-deep-sea-rays 7s ease-in-out infinite;
}

.roycss-deep-sea::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 2px at 20% 30%, color-mix(in oklch, oklch(1 0 89.88) 70%, transparent), transparent),
    radial-gradient(circle 1.5px at 60% 70%, color-mix(in oklch, oklch(1 0 89.88) 50%, transparent), transparent),
    radial-gradient(circle 2.5px at 80% 20%, color-mix(in oklch, oklch(1 0 89.88) 60%, transparent), transparent),
    radial-gradient(circle 1px at 35% 85%, color-mix(in oklch, oklch(1 0 89.88) 50%, transparent), transparent),
    radial-gradient(circle 1.5px at 75% 55%, color-mix(in oklch, oklch(1 0 89.88) 55%, transparent), transparent),
    radial-gradient(circle 1px at 15% 65%, color-mix(in oklch, oklch(1 0 89.88) 40%, transparent), transparent);
  animation: roy-b11-deep-sea-bubbles 6s linear infinite;
}

@keyframes roy-b11-deep-sea-rays {
  0%, 100% { transform: translateX(0) skewX(0deg); opacity: 0.7; }
  50%      { transform: translateX(8px) skewX(-3deg); opacity: 1; }
}
@keyframes roy-b11-deep-sea-bubbles {
  0%   { transform: translateY(0); opacity: 0.8; }
  100% { transform: translateY(-30px); opacity: 0; }
}`,
  },

  // 15 ─ Northern Lights ──────────────────────────────────────────
  {
    id: "northern-lights",
    name: "Northern Lights",
    category: "visual",
    description: "Aurora borealis with undulating ribbons of green and violet light",
    tags: ["aurora", "northern", "lights", "borealis"],
    previewType: "box",
    cssCode: `/* Northern Lights — aurora borealis ribbons */
.roycss-northern-lights {
  position: relative;
  inline-size: 240px;
  block-size: 180px;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, oklch(0.177 0.044 271.23) 0%, oklch(0.184 0.045 259.27) 60%, oklch(0.121 0.025 256.33) 100%);
}
.roycss-northern-lights > div { display: none; }

.roycss-northern-lights::before {
  content: '';
  position: absolute;
  inset-block-start: -30%; inset-inline-start: -20%;
  inline-size: 140%; block-size: 100%;
  background:
    radial-gradient(ellipse 60% 40% at 30% 50%, color-mix(in oklch, oklch(0.893 0.177 160.52) 55%, transparent), transparent 60%),
    radial-gradient(ellipse 50% 35% at 60% 40%, color-mix(in oklch, oklch(0.803 0.111 240.15) 45%, transparent), transparent 60%),
    radial-gradient(ellipse 55% 30% at 75% 55%, color-mix(in oklch, oklch(0.64 0.249 306.76) 45%, transparent), transparent 60%),
    radial-gradient(ellipse 40% 25% at 20% 60%, color-mix(in oklch, oklch(0.898 0.161 167.61) 40%, transparent), transparent 60%);
  filter: blur(20px);
  mix-blend-mode: screen;
  animation: roy-b11-aurora-wave 8s ease-in-out infinite;
}

.roycss-northern-lights::after {
  content: '';
  position: absolute;
  inset-block-end: 0; inset-inline-start: 0;
  inline-size: 100%; block-size: 35%;
  background:
    radial-gradient(circle 1px at 10% 50%, oklch(1 0 89.88), transparent),
    radial-gradient(circle 1px at 25% 30%, oklch(1 0 89.88), transparent),
    radial-gradient(circle 1px at 40% 70%, oklch(1 0 89.88), transparent),
    radial-gradient(circle 1px at 60% 40%, oklch(1 0 89.88), transparent),
    radial-gradient(circle 1px at 75% 60%, oklch(1 0 89.88), transparent),
    radial-gradient(circle 1px at 90% 35%, oklch(1 0 89.88), transparent),
    linear-gradient(0deg, oklch(0.194 0.043 262.93) 30%, transparent 100%);
}

@keyframes roy-b11-aurora-wave {
  0%, 100% { transform: translateX(-10%) translateY(0) skewX(0deg); opacity: 0.85; }
  33%      { transform: translateX(5%) translateY(-8%) skewX(-6deg); opacity: 1; }
  66%      { transform: translateX(-5%) translateY(5%) skewX(4deg); opacity: 0.95; }
}`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // BACKGROUNDS — artistic textures (10)
  // ═══════════════════════════════════════════════════════════════════

  // 16 ─ Painting Oil ─────────────────────────────────────────────
  {
    id: "painting-oil",
    name: "Oil Painting",
    category: "backgrounds",
    description: "Thick oil paint texture with visible brush strokes",
    tags: ["oil", "painting", "brush", "texture"],
    previewType: "background",
    cssCode: `/* Oil Painting — thick brush stroke texture */
.roycss-painting-oil {
  inline-size: 100%;
  min-block-size: 240px;
  background:
    repeating-linear-gradient(35deg,
      oklch(0.416 0.148 26.59) 0 20px, oklch(0.567 0.173 24.5) 20px 38px, oklch(0.301 0.113 27.53) 38px 60px,
      oklch(0.628 0.151 32.43) 60px 80px, oklch(0.347 0.121 26.21) 80px 102px),
    repeating-linear-gradient(-25deg,
      oklch(0.427 0.109 260.69) 0 24px, oklch(0.585 0.13 259.1) 24px 48px, oklch(0.304 0.076 263.41) 48px 72px),
    linear-gradient(135deg, oklch(0.567 0.173 24.5) 0%, oklch(0.427 0.109 260.69) 50%, oklch(0.416 0.148 26.59) 100%);
  background-blend-mode: overlay, overlay, normal;
  filter: contrast(1.2) saturate(1.3);
  position: relative;
  border-radius: 8px;
}

.roycss-painting-oil::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, color-mix(in oklch, oklch(0.861 0.147 83.67) 35%, transparent), transparent 30%),
    radial-gradient(circle at 75% 70%, color-mix(in oklch, oklch(0.983 0.094 108.02) 25%, transparent), transparent 35%),
    radial-gradient(circle at 50% 50%, color-mix(in oklch, oklch(0 0 0) 30%, transparent), transparent 60%);
  mix-blend-mode: overlay;
  border-radius: inherit;
}

.roycss-painting-oil::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(90deg, transparent 0 3px, color-mix(in oklch, oklch(0 0 0) 8%, transparent) 3px 4px),
    repeating-linear-gradient(0deg, transparent 0 3px, color-mix(in oklch, oklch(1 0 89.88) 6%, transparent) 3px 4px);
  mix-blend-mode: overlay;
  border-radius: inherit;
}`,
  },

  // 17 ─ Watercolor ───────────────────────────────────────────────
  {
    id: "watercolor",
    name: "Watercolor",
    category: "backgrounds",
    description: "Soft bleeding watercolor wash on textured paper",
    tags: ["watercolor", "wash", "soft", "paint"],
    previewType: "background",
    cssCode: `/* Watercolor — soft bleeding wash on paper */
.roycss-watercolor {
  inline-size: 100%;
  min-block-size: 240px;
  background:
    radial-gradient(ellipse 50% 40% at 25% 35%, color-mix(in oklch, oklch(0.791 0.13 2.1) 70%, transparent), transparent 60%),
    radial-gradient(ellipse 45% 35% at 70% 30%, color-mix(in oklch, oklch(0.818 0.094 251.36) 65%, transparent), transparent 65%),
    radial-gradient(ellipse 55% 40% at 60% 75%, color-mix(in oklch, oklch(0.904 0.126 90.5) 60%, transparent), transparent 60%),
    radial-gradient(ellipse 35% 30% at 30% 80%, color-mix(in oklch, oklch(0.932 0.125 144.49) 55%, transparent), transparent 65%),
    radial-gradient(ellipse 30% 25% at 85% 65%, color-mix(in oklch, oklch(0.78 0.161 313.74) 55%, transparent), transparent 65%),
    linear-gradient(135deg, oklch(0.974 0.011 84.58) 0%, oklch(0.933 0.023 84.59) 100%);
  background-blend-mode: multiply, multiply, multiply, multiply, multiply, normal;
  filter: blur(0.5px) contrast(0.95);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.roycss-watercolor::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-radial-gradient(circle at 30% 40%, transparent 0 3px, color-mix(in oklch, oklch(0.626 0.093 53.89) 5%, transparent) 3px 4px),
    repeating-radial-gradient(circle at 70% 60%, transparent 0 4px, color-mix(in oklch, oklch(0.326 0.067 45.91) 4%, transparent) 4px 5px);
  mix-blend-mode: multiply;
}

.roycss-watercolor::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 20% 8% at 50% 50%, color-mix(in oklch, oklch(0.326 0.067 45.91) 15%, transparent), transparent 70%);
  mix-blend-mode: multiply;
}`,
  },

  // 18 ─ Pencil Sketch ────────────────────────────────────────────
  {
    id: "pencil-sketch",
    name: "Pencil Sketch",
    category: "backgrounds",
    description: "Cross-hatched pencil sketch on off-white paper",
    tags: ["pencil", "sketch", "hatching", "graphite"],
    previewType: "background",
    cssCode: `/* Pencil Sketch — cross-hatched graphite */
.roycss-pencil-sketch {
  inline-size: 100%;
  min-block-size: 240px;
  background:
    repeating-linear-gradient(45deg,
      transparent 0 2px,
      color-mix(in oklch, oklch(0.277 0 89.88) 35%, transparent) 2px 2.4px,
      transparent 2.4px 5px),
    repeating-linear-gradient(-45deg,
      transparent 0 2px,
      color-mix(in oklch, oklch(0.277 0 89.88) 25%, transparent) 2px 2.4px,
      transparent 2.4px 5px),
    repeating-linear-gradient(90deg,
      transparent 0 3px,
      color-mix(in oklch, oklch(0.277 0 89.88) 12%, transparent) 3px 3.4px,
      transparent 3.4px 7px),
    linear-gradient(180deg, oklch(0.956 0.014 84.58) 0%, oklch(0.922 0.022 89.8) 100%);
  background-blend-mode: multiply, multiply, multiply, normal;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.roycss-pencil-sketch::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 50% 40% at 50% 50%, color-mix(in oklch, oklch(0.277 0 89.88) 18%, transparent), transparent 65%),
    radial-gradient(circle at 25% 30%, color-mix(in oklch, oklch(0.277 0 89.88) 25%, transparent), transparent 8%),
    radial-gradient(circle at 75% 60%, color-mix(in oklch, oklch(0.277 0 89.88) 20%, transparent), transparent 10%);
  mix-blend-mode: multiply;
}

.roycss-pencil-sketch::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg, transparent 0 1px, color-mix(in oklch, oklch(1 0 89.88) 4%, transparent) 1px 2px);
  mix-blend-mode: overlay;
}`,
  },

  // 19 ─ Vintage TV ───────────────────────────────────────────────
  {
    id: "vintage-tv",
    name: "Vintage TV",
    category: "backgrounds",
    description: "CRT television screen with scanlines, curvature and static glow",
    tags: ["vintage", "crt", "tv", "scanlines"],
    previewType: "background",
    cssCode: `/* Vintage TV — CRT screen with scanlines */
.roycss-vintage-tv {
  inline-size: 100%;
  min-block-size: 240px;
  background:
    radial-gradient(ellipse 90% 70% at 50% 50%, oklch(0.342 0.071 251.85) 0%, oklch(0.214 0.042 252.78) 70%, oklch(0 0 0) 100%);
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    inset 0 0 60px color-mix(in oklch, oklch(0 0 0) 80%, transparent),
    inset 0 0 120px color-mix(in oklch, oklch(0.626 0.111 250.01) 30%, transparent);
}

.roycss-vintage-tv::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0 2px,
      color-mix(in oklch, oklch(0 0 0) 35%, transparent) 2px 3px),
    radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, color-mix(in oklch, oklch(0 0 0) 60%, transparent) 100%);
  mix-blend-mode: multiply;
}

.roycss-vintage-tv::after {
  content: '';
  position: absolute;
  inset-block-start: -20%; inset-inline-start: -20%;
  inline-size: 140%; block-size: 140%;
  background:
    radial-gradient(ellipse 30% 20% at 30% 30%, color-mix(in oklch, oklch(1 0 89.88) 15%, transparent), transparent 70%),
    repeating-linear-gradient(0deg,
      transparent 0 1px,
      color-mix(in oklch, oklch(1 0 89.88) 4%, transparent) 1px 2px);
  animation: roy-b11-vintage-tv-static 0.15s steps(2) infinite;
}

@keyframes roy-b11-vintage-tv-static {
  0%   { transform: translate(0, 0); }
  50%  { transform: translate(-2px, 1px); }
  100% { transform: translate(1px, -1px); }
}`,
  },

  // 20 ─ Film Grain ───────────────────────────────────────────────
  {
    id: "film-grain",
    name: "Film Grain",
    category: "backgrounds",
    description: "Animated photographic film grain over a warm cinematic still",
    tags: ["film", "grain", "cinematic", "noise"],
    previewType: "background",
    cssCode: `/* Film Grain — animated cinematic grain */
.roycss-film-grain {
  inline-size: 100%;
  min-block-size: 240px;
  background:
    radial-gradient(ellipse 60% 50% at 30% 30%, oklch(0.781 0.127 57.86) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 70% 70%, oklch(0.678 0.156 35.18) 0%, transparent 60%),
    linear-gradient(135deg, oklch(0.375 0.044 226.2) 0%, oklch(0.63 0.101 183.03) 50%, oklch(0.834 0.117 87.43) 100%);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  filter: contrast(1.1) saturate(0.9);
}

.roycss-film-grain::before {
  content: '';
  position: absolute;
  inset: -50%;
  background-image:
    radial-gradient(circle 1px at 10% 20%, color-mix(in oklch, oklch(1 0 89.88) 50%, transparent), transparent),
    radial-gradient(circle 1px at 30% 60%, color-mix(in oklch, oklch(0 0 0) 50%, transparent), transparent),
    radial-gradient(circle 1px at 50% 30%, color-mix(in oklch, oklch(1 0 89.88) 40%, transparent), transparent),
    radial-gradient(circle 1px at 70% 80%, color-mix(in oklch, oklch(0 0 0) 40%, transparent), transparent),
    radial-gradient(circle 1px at 85% 25%, color-mix(in oklch, oklch(1 0 89.88) 60%, transparent), transparent),
    radial-gradient(circle 1px at 15% 75%, color-mix(in oklch, oklch(0 0 0) 50%, transparent), transparent),
    radial-gradient(circle 1px at 90% 60%, color-mix(in oklch, oklch(1 0 89.88) 40%, transparent), transparent),
    radial-gradient(circle 1px at 45% 90%, color-mix(in oklch, oklch(0 0 0) 40%, transparent), transparent),
    radial-gradient(circle 1px at 60% 15%, color-mix(in oklch, oklch(1 0 89.88) 50%, transparent), transparent),
    radial-gradient(circle 1px at 25% 45%, color-mix(in oklch, oklch(0 0 0) 30%, transparent), transparent);
  background-size: 80px 80px, 90px 90px, 100px 100px, 70px 70px, 110px 110px, 85px 85px, 95px 95px, 75px 75px, 105px 105px, 80px 80px;
  mix-blend-mode: overlay;
  opacity: 0.7;
  animation: roy-b11-film-grain-shift 0.4s steps(4) infinite;
}

.roycss-film-grain::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 100%);
  pointer-events: none;
}

@keyframes roy-b11-film-grain-shift {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-15px, 10px); }
  50%  { transform: translate(10px, -12px); }
  75%  { transform: translate(-8px, -8px); }
  100% { transform: translate(0, 0); }
}`,
  },

  // 21 ─ VHS Glitch ───────────────────────────────────────────────
  {
    id: "vhs-glitch",
    name: "VHS Glitch",
    category: "backgrounds",
    description: "VHS tape distortion with chromatic aberration and tracking errors",
    tags: ["vhs", "glitch", "chromatic", "retro"],
    previewType: "background",
    cssCode: `/* VHS Glitch — chromatic aberration and tracking noise */
.roycss-vhs-glitch {
  inline-size: 100%;
  min-block-size: 240px;
  background:
    linear-gradient(180deg, oklch(0.179 0.095 301.47) 0%, oklch(0.336 0.177 301.82) 50%, oklch(0.235 0.096 259.91) 100%);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  filter: contrast(1.2) saturate(1.3);
}

.roycss-vhs-glitch::before {
  content: 'PLAY ▶';
  position: absolute;
  inset-block-start: 12px; inset-inline-start: 16px;
  color: color-mix(in oklch, oklch(0.676 0.212 24.81) 80%, transparent);
  font: 700 16px/1 'Courier New', monospace;
  text-shadow: 2px 0 0 color-mix(in oklch, oklch(0.914 0.139 195) 80%, transparent), -2px 0 0 color-mix(in oklch, oklch(0.971 0.186 109.42) 80%, transparent);
  letter-spacing: 0.2em;
  animation: roy-b11-vhs-glitch-text 2s steps(20) infinite;
}

.roycss-vhs-glitch::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0 3px,
      color-mix(in oklch, oklch(1 0 89.88) 4%, transparent) 3px 4px),
    linear-gradient(0deg,
      transparent 0 30%,
      color-mix(in oklch, oklch(0.628 0.258 29.23) 15%, transparent) 30% 32%,
      transparent 32% 50%,
      color-mix(in oklch, oklch(0.905 0.155 194.77) 15%, transparent) 50% 51%,
      transparent 51% 70%,
      color-mix(in oklch, oklch(0.702 0.322 328.36) 12%, transparent) 70% 71%,
      transparent 71%);
  mix-blend-mode: screen;
  animation: roy-b11-vhs-glitch-track 1.5s steps(6) infinite;
}

@keyframes roy-b11-vhs-glitch-track {
  0%   { transform: translateY(0); }
  20%  { transform: translateY(-10px); }
  40%  { transform: translateY(15px); }
  60%  { transform: translateY(-5px); }
  80%  { transform: translateY(8px); }
  100% { transform: translateY(0); }
}
@keyframes roy-b11-vhs-glitch-text {
  0%, 90%, 100% { transform: translate(0); }
  92%           { transform: translate(-3px, 1px); }
  94%           { transform: translate(2px, -1px); }
  96%           { transform: translate(-1px, 0); }
}`,
  },

  // 22 ─ Pixel Art ────────────────────────────────────────────────
  {
    id: "pixel-art",
    name: "Pixel Art",
    category: "backgrounds",
    description: "Retro 8-bit pixel grid pattern with sharp blocky colors",
    tags: ["pixel", "8bit", "retro", "grid"],
    previewType: "background",
    cssCode: `/* Pixel Art — 8-bit blocky grid */
.roycss-pixel-art {
  inline-size: 100%;
  min-block-size: 240px;
  background:
    conic-gradient(from 0deg at 50% 50%,
      oklch(0.634 0.254 17.63) 0deg 45deg,
      oklch(0.789 0.171 69.64) 45deg 90deg,
      oklch(0.93 0.189 103.28) 90deg 135deg,
      oklch(0.798 0.257 144.26) 135deg 180deg,
      oklch(0.718 0.16 242.66) 180deg 225deg,
      oklch(0.592 0.059 300.27) 225deg 270deg,
      oklch(0.742 0.172 359.48) 270deg 315deg,
      oklch(0.634 0.254 17.63) 315deg 360deg);
  background-size: 32px 32px;
  image-rendering: pixelated;
  position: relative;
  border-radius: 0;
  filter: contrast(1.1) saturate(1.3);
}

.roycss-pixel-art::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent 0 15px, color-mix(in oklch, oklch(0 0 0) 25%, transparent) 15px 16px),
    repeating-linear-gradient(90deg, transparent 0 15px, color-mix(in oklch, oklch(0 0 0) 25%, transparent) 15px 16px);
  mix-blend-mode: multiply;
}

.roycss-pixel-art::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 8px at 25% 25%, oklch(0 0 0) 0 6px, transparent 6px 8px),
    radial-gradient(circle 8px at 75% 25%, oklch(0 0 0) 0 6px, transparent 6px 8px),
    radial-gradient(ellipse 30px 12px at 50% 70%, oklch(0 0 0) 0 28px, transparent 28px 30px);
}`,
  },

  // 23 ─ ASCII Rain ───────────────────────────────────────────────
  {
    id: "ascii-rain",
    name: "ASCII Rain",
    category: "backgrounds",
    description: "Matrix-style falling ASCII character rain in green phosphor",
    tags: ["ascii", "rain", "matrix", "digital"],
    previewType: "background",
    cssCode: `/* ASCII Rain — Matrix digital rain */
.roycss-ascii-rain {
  inline-size: 100%;
  min-block-size: 240px;
  background:
    radial-gradient(ellipse at 50% 0%, oklch(0.191 0.047 154.77) 0%, oklch(0.09 0.017 224.61) 100%);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.roycss-ascii-rain::before {
  content: '0 1 0 1 1 0 1 0 0 1 1 0 1 0 1 1 0 0 1 0\\A 1 0 1 0 0 1 0 1 1 0 1 0 0 1 0 1 1 0 0 1\\A 0 1 1 0 1 0 0 1 1 0 1 0 1 0 0 1 1 0 1 0\\A 1 0 0 1 0 1 1 0 0 1 0 1 1 0 1 0 0 1 0 1\\A 0 1 0 1 1 0 1 0 0 1 1 0 1 0 1 1 0 0 1 0\\A 1 0 1 0 0 1 0 1 1 0 1 0 0 1 0 1 1 0 0 1\\A 0 1 1 0 1 0 0 1 1 0 1 0 1 0 0 1 1 0 1 0\\A 1 0 0 1 0 1 1 0 0 1 0 1 1 0 1 0 0 1 0 1';
  white-space: pre;
  position: absolute;
  inset-block-start: 0; inset-inline-start: 0;
  inline-size: 100%; block-size: 100%;
  color: oklch(0.872 0.255 147.64);
  font: 12px/1.4 'Courier New', monospace;
  letter-spacing: 0.2em;
  text-shadow: 0 0 6px color-mix(in oklch, oklch(0.872 0.256 147.41) 80%, transparent);
  opacity: 0.85;
  animation: roy-b11-ascii-rain-fall 4s linear infinite;
  overflow: hidden;
}

.roycss-ascii-rain::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, color-mix(in oklch, oklch(0.206 0.054 151.99) 30%, transparent) 0%, transparent 40%, transparent 60%, color-mix(in oklch, oklch(0.206 0.054 151.99) 60%, transparent) 100%),
    repeating-linear-gradient(0deg, transparent 0 2px, color-mix(in oklch, oklch(0 0 0) 30%, transparent) 2px 3px);
  mix-blend-mode: multiply;
  pointer-events: none;
}

@keyframes roy-b11-ascii-rain-fall {
  0%   { transform: translateY(-30%); }
  100% { transform: translateY(30%); }
}`,
  },

  // 24 ─ Blueprint ────────────────────────────────────────────────
  {
    id: "blueprint",
    name: "Blueprint",
    category: "backgrounds",
    description: "Engineering blueprint with grid, annotations and dimension lines",
    tags: ["blueprint", "engineering", "grid", "technical"],
    previewType: "background",
    cssCode: `/* Blueprint — engineering technical drawing */
.roycss-blueprint {
  inline-size: 100%;
  min-block-size: 240px;
  background:
    linear-gradient(0deg,
      transparent 0 calc(100% - 1px), color-mix(in oklch, oklch(0.878 0.064 245.03) 40%, transparent) calc(100% - 1px) 100%),
    linear-gradient(90deg,
      transparent 0 calc(100% - 1px), color-mix(in oklch, oklch(0.878 0.064 245.03) 40%, transparent) calc(100% - 1px) 100%),
    repeating-linear-gradient(0deg, transparent 0 19px, color-mix(in oklch, oklch(0.878 0.064 245.03) 18%, transparent) 19px 20px),
    repeating-linear-gradient(90deg, transparent 0 19px, color-mix(in oklch, oklch(0.878 0.064 245.03) 18%, transparent) 19px 20px),
    repeating-linear-gradient(0deg, transparent 0 99px, color-mix(in oklch, oklch(0.878 0.064 245.03) 35%, transparent) 99px 100px),
    repeating-linear-gradient(90deg, transparent 0 99px, color-mix(in oklch, oklch(0.878 0.064 245.03) 35%, transparent) 99px 100px),
    oklch(0.366 0.116 256.33);
  background-size: 20px 20px, 20px 20px, 20px 20px, 20px 20px, 100px 100px, 100px 100px, 100% 100%;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  color: oklch(0.92 0.041 246.02);
}

.roycss-blueprint::before {
  content: '';
  position: absolute;
  inset-block-start: 30px; inset-inline-start: 30px;
  inline-size: 140px; block-size: 100px;
  border: 1.5px solid oklch(0.92 0.041 246.02);
  background:
    linear-gradient(45deg, transparent 49%, color-mix(in oklch, oklch(0.92 0.041 246.02) 40%, transparent) 49% 51%, transparent 51%);
  box-shadow:
    0 0 0 8px color-mix(in oklch, oklch(0 0 0) 10%, transparent),
    inset 0 0 0 5px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
}

.roycss-blueprint::after {
  content: 'DWG-001\\A SCALE 1:50\\A REV. A';
  white-space: pre;
  position: absolute;
  inset-block-end: 16px; inset-inline-end: 20px;
  color: oklch(0.92 0.041 246.02);
  font: 11px/1.5 'Courier New', monospace;
  letter-spacing: 0.15em;
  text-align: end;
  text-shadow: 0 0 4px color-mix(in oklch, oklch(0.515 0.174 255.79) 60%, transparent);
  border: 1px solid oklch(0.92 0.041 246.02);
  padding: 6px 10px;
}`,
  },

  // 25 ─ Topographic ──────────────────────────────────────────────
  {
    id: "topographic",
    name: "Topographic",
    category: "backgrounds",
    description: "Topographic map contour lines over elevation terrain",
    tags: ["topographic", "contour", "map", "terrain"],
    previewType: "background",
    cssCode: `/* Topographic — contour map lines */
.roycss-topographic {
  inline-size: 100%;
  min-block-size: 240px;
  background:
    repeating-radial-gradient(circle at 30% 40%,
      transparent 0,
      transparent 14px,
      color-mix(in oklch, oklch(0.466 0.084 68.78) 50%, transparent) 14px,
      color-mix(in oklch, oklch(0.466 0.084 68.78) 50%, transparent) 15px),
    repeating-radial-gradient(circle at 70% 60%,
      transparent 0,
      transparent 18px,
      color-mix(in oklch, oklch(0.396 0.077 61.8) 45%, transparent) 18px,
      color-mix(in oklch, oklch(0.396 0.077 61.8) 45%, transparent) 19px),
    repeating-radial-gradient(circle at 50% 80%,
      transparent 0,
      transparent 12px,
      color-mix(in oklch, oklch(0.325 0.072 53.1) 40%, transparent) 12px,
      color-mix(in oklch, oklch(0.325 0.072 53.1) 40%, transparent) 13px),
    radial-gradient(ellipse at 30% 40%, oklch(0.923 0.049 86.35) 0%, oklch(0.795 0.071 80.81) 50%, oklch(0.549 0.078 76.6) 100%);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.roycss-topographic::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-radial-gradient(circle at 80% 20%,
      transparent 0 22px,
      color-mix(in oklch, oklch(0.271 0.063 61.1) 30%, transparent) 22px 23px),
    repeating-linear-gradient(45deg,
      transparent 0 80px,
      color-mix(in oklch, oklch(0.271 0.063 61.1) 5%, transparent) 80px 81px);
  mix-blend-mode: multiply;
}

.roycss-topographic::after {
  content: '▲ 1245m';
  position: absolute;
  inset-block-start: 30%; inset-inline-start: 28%;
  color: oklch(0.357 0.075 54.3);
  font: 700 11px/1 'Courier New', monospace;
  letter-spacing: 0.1em;
  text-shadow: 0 0 2px color-mix(in oklch, oklch(0.957 0.054 89.91) 70%, transparent);
}`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATIONS — creative motion (10)
  // ═══════════════════════════════════════════════════════════════════

  // 26 ─ Morph Blob ───────────────────────────────────────────────
  {
    id: "morph-blob",
    name: "Morph Blob",
    category: "animations",
    description: "Organic blob that continuously morphs its shape",
    tags: ["morph", "blob", "organic", "shape"],
    previewType: "box",
    cssCode: `/* Morph Blob — continuously morphing organic shape */
.roycss-morph-blob {
  position: relative;
  inline-size: 180px;
  block-size: 180px;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.74 0.198 346.4), oklch(0.626 0.189 281.17) 70%);
  box-shadow: 0 12px 40px color-mix(in oklch, oklch(0.579 0.244 286.54) 50%, transparent);
  animation: roy-b11-morph-blob 8s ease-in-out infinite;
}
.roycss-morph-blob > div { display: none; }

@keyframes roy-b11-morph-blob {
  0%, 100% {
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    transform: rotate(0deg) scale(1);
    background: radial-gradient(circle at 30% 30%, oklch(0.74 0.198 346.4), oklch(0.626 0.189 281.17) 70%);
  }
  25% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
    transform: rotate(90deg) scale(1.05);
    background: radial-gradient(circle at 70% 30%, oklch(0.626 0.189 281.17), oklch(0.8 0.182 151.71) 70%);
  }
  50% {
    border-radius: 50% 50% 20% 80% / 25% 80% 20% 75%;
    transform: rotate(180deg) scale(0.95);
    background: radial-gradient(circle at 50% 70%, oklch(0.8 0.182 151.71), oklch(0.837 0.164 84.43) 70%);
  }
  75% {
    border-radius: 70% 30% 50% 50% / 30% 50% 50% 70%;
    transform: rotate(270deg) scale(1.05);
    background: radial-gradient(circle at 30% 70%, oklch(0.837 0.164 84.43), oklch(0.74 0.198 346.4) 70%);
  }
}`,
  },

  // 27 ─ Liquid Drop ──────────────────────────────────────────────
  {
    id: "liquid-drop",
    name: "Liquid Drop",
    category: "animations",
    description: "A liquid drop falls, splashes and reforms in a loop",
    tags: ["liquid", "drop", "splash", "loop"],
    previewType: "box",
    cssCode: `/* Liquid Drop — falling drop with splash */
.roycss-liquid-drop {
  position: relative;
  inline-size: 180px;
  block-size: 200px;
  background: linear-gradient(180deg, oklch(0.495 0.09 232.27) 0%, oklch(0.347 0.065 233.52) 100%);
  overflow: hidden;
  border-radius: 8px;
}
.roycss-liquid-drop > div { display: none; }

.roycss-liquid-drop::before {
  content: '';
  position: absolute;
  inset-block-start: -10%;
  inset-inline-start: 50%;
  inline-size: 24px;
  block-size: 32px;
  background: linear-gradient(180deg, oklch(0.862 0.095 222.67), oklch(0.723 0.107 226.27));
  border-radius: 50% 50% 50% 50% / 70% 70% 30% 30%;
  transform: translateX(-50%);
  box-shadow: inset -3px -3px 6px color-mix(in oklch, oklch(0 0 0) 20%, transparent), inset 3px 3px 6px color-mix(in oklch, oklch(1 0 89.88) 50%, transparent);
  animation: roy-b11-liquid-drop-fall 2.4s ease-in infinite;
}

.roycss-liquid-drop::after {
  content: '';
  position: absolute;
  inset-block-end: 30%;
  inset-inline-start: 50%;
  inline-size: 4px;
  block-size: 4px;
  border-radius: 50%;
  background: transparent;
  transform: translateX(-50%);
  animation: roy-b11-liquid-drop-splash 2.4s ease-out infinite;
}

@keyframes roy-b11-liquid-drop-fall {
  0%   { inset-block-start: -15%; transform: translateX(-50%) scaleY(1); }
  60%  { inset-block-start: 65%; transform: translateX(-50%) scaleY(1.4); }
  70%  { inset-block-start: 70%; transform: translateX(-50%) scaleY(0.4) scaleX(1.6); opacity: 1; }
  75%  { inset-block-start: 72%; transform: translateX(-50%) scaleY(0.1) scaleX(2); opacity: 0.4; }
  100% { inset-block-start: 72%; transform: translateX(-50%) scaleY(0.1) scaleX(2); opacity: 0; }
}

@keyframes roy-b11-liquid-drop-splash {
  0%, 68% { inline-size: 4px; block-size: 4px; opacity: 0; border: 0 solid color-mix(in oklch, oklch(0.862 0.095 222.67) 80%, transparent); background: transparent; }
  72%     { inline-size: 30px; block-size: 30px; opacity: 1; border: 2px solid color-mix(in oklch, oklch(0.862 0.095 222.67) 90%, transparent); border-radius: 50%; background: transparent; }
  100%    { inline-size: 120px; block-size: 120px; opacity: 0; border: 0.5px solid color-mix(in oklch, oklch(0.862 0.095 222.67) 20%, transparent); border-radius: 50%; background: transparent; }
}`,
  },

  // 28 ─ Paper Flip ───────────────────────────────────────────────
  {
    id: "paper-flip",
    name: "Paper Flip",
    category: "animations",
    description: "A page flips in 3D like a book page turning",
    tags: ["paper", "flip", "page", "3d"],
    previewType: "box",
    cssCode: `/* Paper Flip — 3D page-turn animation */
.roycss-paper-flip {
  position: relative;
  inline-size: 180px;
  block-size: 220px;
  perspective: 1200px;
  background: transparent;
}
.roycss-paper-flip > div { display: none; }

.roycss-paper-flip::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.985 0 89.88) 0%, oklch(0.931 0 89.88) 100%);
  border: 1px solid oklch(0.845 0 89.88);
  border-radius: 4px;
  box-shadow: 0 8px 24px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  transform-origin: left center;
  transform-style: preserve-3d;
  backface-visibility: visible;
}

.roycss-paper-flip::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, color-mix(in oklch, oklch(0 0 0) 15%, transparent) 0%, transparent 10%),
    repeating-linear-gradient(0deg, transparent 0 24px, color-mix(in oklch, oklch(0.503 0 89.88) 15%, transparent) 24px 25px, transparent 25px 48px),
    linear-gradient(135deg, oklch(1 0 89.88) 0%, oklch(0.955 0 89.88) 100%);
  border: 1px solid oklch(0.845 0 89.88);
  border-radius: 4px;
  transform-origin: left center;
  transform-style: preserve-3d;
  backface-visibility: visible;
  animation: roy-b11-paper-flip 3.5s ease-in-out infinite;
  box-shadow: 0 8px 24px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
}

@keyframes roy-b11-paper-flip {
  0%, 20%   { transform: rotateY(0deg); box-shadow: 0 8px 24px color-mix(in oklch, oklch(0 0 0) 20%, transparent); }
  50%       { transform: rotateY(-160deg); box-shadow: -12px 8px 24px color-mix(in oklch, oklch(0 0 0) 30%, transparent); }
  80%, 100% { transform: rotateY(-360deg); box-shadow: 0 8px 24px color-mix(in oklch, oklch(0 0 0) 20%, transparent); }
}`,
  },

  // 29 ─ Card Shuffle ─────────────────────────────────────────────
  {
    id: "card-shuffle",
    name: "Card Shuffle",
    category: "animations",
    description: "Playing cards shuffle and fan out repeatedly",
    tags: ["card", "shuffle", "fan", "play"],
    previewType: "box",
    cssCode: `/* Card Shuffle — fanning playing cards */
.roycss-card-shuffle {
  position: relative;
  inline-size: 200px;
  block-size: 220px;
  perspective: 1000px;
}
.roycss-card-shuffle > div { display: none; }

.roycss-card-shuffle::before,
.roycss-card-shuffle::after {
  content: '';
  position: absolute;
  inset-block-start: 50%; inset-inline-start: 50%;
  inline-size: 70px;
  block-size: 100px;
  border-radius: 6px;
  background:
    linear-gradient(135deg, oklch(1 0 89.88) 0%, oklch(0.955 0 89.88) 100%);
  border: 1.5px solid oklch(0.845 0 89.88);
  box-shadow: 0 4px 10px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
  transform: translate(-50%, -50%);
}

.roycss-card-shuffle::before {
  background:
    radial-gradient(circle at 50% 50%, oklch(0.53 0.207 22.32) 0 20%, transparent 20%),
    linear-gradient(45deg, transparent 48%, oklch(0.218 0 89.88) 48% 52%, transparent 52%),
    linear-gradient(-45deg, transparent 48%, oklch(0.218 0 89.88) 48% 52%, transparent 52%),
    oklch(1 0 89.88);
  background-size: 30px 30px, 100% 100%, 100% 100%, 100% 100%;
  animation: roy-b11-card-shuffle-a 2.4s ease-in-out infinite;
  z-index: 2;
}

.roycss-card-shuffle::after {
  background:
    radial-gradient(circle at 50% 50%, oklch(0.218 0 89.88) 0 20%, transparent 20%),
    oklch(1 0 89.88);
  animation: roy-b11-card-shuffle-b 2.4s ease-in-out infinite;
  z-index: 1;
}

@keyframes roy-b11-card-shuffle-a {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg) translateX(0); }
  25%      { transform: translate(-50%, -50%) rotate(-18deg) translateX(10px); }
  50%      { transform: translate(-50%, -50%) rotate(-12deg) translateX(-30px); }
  75%      { transform: translate(-50%, -50%) rotate(-22deg) translateX(20px); }
}
@keyframes roy-b11-card-shuffle-b {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg) translateX(0); }
  25%      { transform: translate(-50%, -50%) rotate(14deg) translateX(-10px); }
  50%      { transform: translate(-50%, -50%) rotate(8deg) translateX(30px); }
  75%      { transform: translate(-50%, -50%) rotate(18deg) translateX(-20px); }
}`,
  },

  // 30 ─ Roulette Spin ────────────────────────────────────────────
  {
    id: "roulette-spin",
    name: "Roulette Spin",
    category: "animations",
    description: "Roulette wheel spinning with alternating red and black pockets",
    tags: ["roulette", "spin", "wheel", "casino"],
    previewType: "box",
    cssCode: `/* Roulette Spin — spinning casino wheel */
.roycss-roulette-spin {
  position: relative;
  inline-size: 200px;
  block-size: 200px;
  border-radius: 50%;
  background:
    repeating-conic-gradient(from 0deg,
      oklch(0.53 0.207 22.32) 0deg 15deg,
      oklch(0.218 0 89.88) 15deg 30deg,
      oklch(0.53 0.207 22.32) 30deg 45deg,
      oklch(0.218 0 89.88) 45deg 60deg,
      oklch(0.53 0.207 22.32) 60deg 75deg,
      oklch(0.218 0 89.88) 75deg 90deg,
      oklch(0.53 0.207 22.32) 90deg 105deg,
      oklch(0.218 0 89.88) 105deg 120deg,
      oklch(0.53 0.207 22.32) 120deg 135deg,
      oklch(0.218 0 89.88) 135deg 150deg,
      oklch(0.53 0.207 22.32) 150deg 165deg,
      oklch(0.218 0 89.88) 165deg 180deg,
      oklch(0.53 0.207 22.32) 180deg 195deg,
      oklch(0.218 0 89.88) 195deg 210deg,
      oklch(0.53 0.207 22.32) 210deg 225deg,
      oklch(0.218 0 89.88) 225deg 240deg,
      oklch(0.53 0.207 22.32) 240deg 255deg,
      oklch(0.218 0 89.88) 255deg 270deg,
      oklch(0.53 0.207 22.32) 270deg 285deg,
      oklch(0.218 0 89.88) 285deg 300deg,
      oklch(0.53 0.207 22.32) 300deg 315deg,
      oklch(0.218 0 89.88) 315deg 330deg,
      oklch(0.53 0.207 22.32) 330deg 345deg,
      oklch(0.218 0 89.88) 345deg 360deg);
  border: 8px solid oklch(0.541 0.104 84.45);
  box-shadow: 0 0 0 4px oklch(0.864 0.159 94.47), 0 12px 30px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
  animation: roy-b11-roulette-spin 4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
}
.roycss-roulette-spin > div { display: none; }

.roycss-roulette-spin::before {
  content: '';
  position: absolute;
  inset: 32%;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.864 0.159 94.47) 0%, oklch(0.541 0.104 84.45) 70%, oklch(0.384 0.075 75.85) 100%);
  box-shadow: inset 0 0 8px color-mix(in oklch, oklch(0 0 0) 60%, transparent);
}

.roycss-roulette-spin::after {
  content: '▲';
  position: absolute;
  inset-block-start: -16px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  color: oklch(0.864 0.159 94.47);
  font-size: 22px;
  text-shadow: 0 2px 4px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}

@keyframes roy-b11-roulette-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(720deg); }
}`,
  },

  // 31 ─ Slot Machine ─────────────────────────────────────────────
  {
    id: "slot-machine",
    name: "Slot Machine",
    category: "animations",
    description: "Slot machine reels spinning with cherries, lemons and bells",
    tags: ["slot", "machine", "casino", "reels"],
    previewType: "box",
    cssCode: `/* Slot Machine — spinning reels */
.roycss-slot-machine {
  position: relative;
  inline-size: 200px;
  block-size: 160px;
  background: linear-gradient(180deg, oklch(0.652 0.132 81.57) 0%, oklch(0.541 0.104 84.45) 50%, oklch(0.384 0.075 75.85) 100%);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 10px 25px color-mix(in oklch, oklch(0 0 0) 40%, transparent), inset 0 2px 6px color-mix(in oklch, oklch(0.902 0.143 93.06) 40%, transparent);
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}
.roycss-slot-machine > div { display: none; }

.roycss-slot-machine::before,
.roycss-slot-machine::after {
  content: '';
  inline-size: 48px;
  block-size: 100px;
  border-radius: 6px;
  background:
    repeating-linear-gradient(0deg,
      oklch(0.218 0 89.88) 0 28px,
      oklch(1 0 89.88) 28px 56px,
      oklch(0.53 0.207 22.32) 56px 84px,
      oklch(0.887 0.182 95.33) 84px 112px,
      oklch(0.218 0 89.88) 112px 140px,
      oklch(1 0 89.88) 140px 168px,
      oklch(0.53 0.207 22.32) 168px 196px);
  background-size: 100% 196px;
  border: 2px solid oklch(0.864 0.159 94.47);
  box-shadow: inset 0 0 8px color-mix(in oklch, oklch(0 0 0) 60%, transparent);
  overflow: hidden;
  animation: roy-b11-slot-machine-spin 1.2s linear infinite;
}

.roycss-slot-machine::after {
  animation-duration: 1.6s;
  animation-delay: -0.4s;
}

@keyframes roy-b11-slot-machine-spin {
  0%   { background-position: 0 0; }
  100% { background-position: 0 -196px; }
}`,
  },

  // 32 ─ Fortune Teller ───────────────────────────────────────────
  {
    id: "fortune-teller",
    name: "Fortune Teller",
    category: "animations",
    description: "Origami fortune teller (cootie catcher) opening and closing",
    tags: ["origami", "fortune", "teller", "cootie"],
    previewType: "box",
    cssCode: `/* Fortune Teller — opening/closing origami cootie catcher */
.roycss-fortune-teller {
  position: relative;
  inline-size: 200px;
  block-size: 200px;
  background: transparent;
}
.roycss-fortune-teller > div { display: none; }

.roycss-fortune-teller::before,
.roycss-fortune-teller::after {
  content: '';
  position: absolute;
  inset-block-start: 50%; inset-inline-start: 50%;
  inline-size: 140px;
  block-size: 140px;
  transform: translate(-50%, -50%) rotate(45deg);
  background:
    conic-gradient(from 0deg,
      oklch(0.712 0.181 22.84) 0deg 90deg,
      oklch(0.776 0.112 188.54) 90deg 180deg,
      oklch(0.922 0.143 97.78) 180deg 270deg,
      oklch(0.709 0.159 293.54) 270deg 360deg);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  filter: drop-shadow(0 6px 12px color-mix(in oklch, oklch(0 0 0) 30%, transparent));
}

.roycss-fortune-teller::before {
  animation: roy-b11-fortune-teller-a 3s ease-in-out infinite;
}

.roycss-fortune-teller::after {
  background:
    conic-gradient(from 45deg,
      oklch(0.712 0.181 22.84) 0deg 90deg,
      oklch(0.709 0.159 293.54) 90deg 180deg,
      oklch(0.922 0.143 97.78) 180deg 270deg,
      oklch(0.776 0.112 188.54) 270deg 360deg);
  animation: roy-b11-fortune-teller-b 3s ease-in-out infinite;
  z-index: -1;
}

@keyframes roy-b11-fortune-teller-a {
  0%, 100% { transform: translate(-50%, -50%) rotate(45deg) scale(1); opacity: 1; }
  50%      { transform: translate(-50%, -50%) rotate(45deg) scale(0.7); opacity: 0.7; }
}
@keyframes roy-b11-fortune-teller-b {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg) scale(0.8); opacity: 0.5; }
  50%      { transform: translate(-50%, -50%) rotate(0deg) scale(1.1); opacity: 1; }
}`,
  },

  // 33 ─ Kaleidoscope ─────────────────────────────────────────────
  {
    id: "kaleidoscope",
    name: "Kaleidoscope",
    category: "animations",
    description: "Rotating kaleidoscope with mirrored colorful patterns",
    tags: ["kaleidoscope", "symmetry", "rotate", "colorful"],
    previewType: "box",
    cssCode: `/* Kaleidoscope — mirrored rotating pattern */
.roycss-kaleidoscope {
  position: relative;
  inline-size: 200px;
  block-size: 200px;
  border-radius: 50%;
  overflow: hidden;
  background: oklch(0 0 0);
  box-shadow: 0 0 0 6px oklch(0.541 0.104 84.45), 0 12px 30px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}
.roycss-kaleidoscope > div { display: none; }

.roycss-kaleidoscope::before {
  content: '';
  position: absolute;
  inset: -25%;
  background:
    conic-gradient(from 0deg at 50% 50%,
      oklch(0.641 0.257 8.07) 0deg 60deg,
      oklch(0.671 0.212 39.04) 60deg 120deg,
      oklch(0.839 0.171 83.34) 120deg 180deg,
      oklch(0.546 0.248 295.88) 180deg 240deg,
      oklch(0.637 0.195 259.51) 240deg 300deg,
      oklch(0.882 0.203 158.76) 300deg 360deg);
  mix-blend-mode: screen;
  filter: blur(4px) saturate(1.5);
  animation: roy-b11-kaleidoscope-spin 8s linear infinite;
}

.roycss-kaleidoscope::after {
  content: '';
  position: absolute;
  inset: -25%;
  background:
    conic-gradient(from 60deg at 50% 50%,
      transparent 0deg 30deg,
      color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) 30deg 33deg,
      transparent 33deg 90deg,
      color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) 90deg 93deg,
      transparent 93deg 150deg,
      color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) 150deg 153deg,
      transparent 153deg 210deg,
      color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) 210deg 213deg,
      transparent 213deg 270deg,
      color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) 270deg 273deg,
      transparent 273deg 330deg,
      color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) 330deg 333deg,
      transparent 333deg 360deg);
  animation: roy-b11-kaleidoscope-spin 6s linear infinite reverse;
  mix-blend-mode: overlay;
}

@keyframes roy-b11-kaleidoscope-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`,
  },

  // 34 ─ Infinity Loop ────────────────────────────────────────────
  {
    id: "infinity-loop",
    name: "Infinity Loop",
    category: "animations",
    description: "A glowing particle traveling along an infinity symbol path",
    tags: ["infinity", "loop", "path", "glow"],
    previewType: "box",
    cssCode: `/* Infinity Loop — particle tracing an infinity path */
.roycss-infinity-loop {
  position: relative;
  inline-size: 220px;
  block-size: 160px;
}
.roycss-infinity-loop > div { display: none; }

.roycss-infinity-loop::before {
  content: '';
  position: absolute;
  inset-block-start: 50%; inset-inline-start: 50%;
  inline-size: 200px;
  block-size: 90px;
  transform: translate(-50%, -50%);
  border: 4px solid color-mix(in oklch, oklch(0.803 0.111 240.15) 25%, transparent);
  border-radius: 50%;
  box-shadow:
    0 0 12px color-mix(in oklch, oklch(0.803 0.111 240.15) 30%, transparent),
    inset 0 0 12px color-mix(in oklch, oklch(0.803 0.111 240.15) 20%, transparent);
}

.roycss-infinity-loop::after {
  content: '';
  position: absolute;
  inset-block-start: 50%; inset-inline-start: 50%;
  inline-size: 16px;
  block-size: 16px;
  margin: -8px 0 0 -8px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(1 0 89.88), oklch(0.74 0.144 244.63) 60%, transparent);
  box-shadow: 0 0 20px oklch(0.74 0.144 244.63), 0 0 40px oklch(0.74 0.144 244.63);
  offset-path: path('M 100 80 C 100 20, 20 20, 100 80 C 180 140, 100 140, 100 80');
  offset-rotate: 0deg;
  animation: roy-b11-infinity-loop-trace 3s linear infinite;
}

@keyframes roy-b11-infinity-loop-trace {
  0%   { offset-distance: 0%; }
  100% { offset-distance: 100%; }
}`,
  },

  // 35 ─ Spiral Galaxy ────────────────────────────────────────────
  {
    id: "spiral-galaxy",
    name: "Spiral Galaxy",
    category: "animations",
    description: "Spiral galaxy with rotating arms of stars around a bright core",
    tags: ["galaxy", "spiral", "stars", "cosmic"],
    previewType: "box",
    cssCode: `/* Spiral Galaxy — rotating cosmic arms */
.roycss-spiral-galaxy {
  position: relative;
  inline-size: 220px;
  block-size: 220px;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, oklch(0.179 0.095 301.47) 0%, oklch(0.096 0.051 300.12) 70%, oklch(0 0 0) 100%);
  box-shadow: 0 0 40px color-mix(in oklch, oklch(0.579 0.244 286.54) 40%, transparent);
}
.roycss-spiral-galaxy > div { display: none; }

.roycss-spiral-galaxy::before {
  content: '';
  position: absolute;
  inset: -25%;
  background:
    conic-gradient(from 0deg at 50% 50%,
      transparent 0deg 20deg,
      color-mix(in oklch, oklch(0.725 0.165 298.22) 55%, transparent) 25deg 40deg,
      transparent 40deg 110deg,
      color-mix(in oklch, oklch(0.898 0.094 326.33) 45%, transparent) 115deg 135deg,
      transparent 135deg 200deg,
      color-mix(in oklch, oklch(0.725 0.165 298.22) 50%, transparent) 205deg 225deg,
      transparent 225deg 290deg,
      color-mix(in oklch, oklch(0.898 0.094 326.33) 40%, transparent) 295deg 315deg,
      transparent 315deg 360deg);
  filter: blur(6px);
  mix-blend-mode: screen;
  animation: roy-b11-spiral-galaxy-spin 12s linear infinite;
}

.roycss-spiral-galaxy::after {
  content: '';
  position: absolute;
  inset-block-start: 50%; inset-inline-start: 50%;
  inline-size: 30px; block-size: 30px;
  margin: -15px 0 0 -15px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(1 0 89.88) 0%, oklch(0.978 0.032 93.51) 30%, oklch(0.876 0.134 84.75) 60%, transparent 80%);
  box-shadow: 0 0 20px oklch(1 0 89.88), 0 0 40px oklch(0.876 0.134 84.75), 0 0 80px color-mix(in oklch, oklch(0.863 0.133 80.39) 50%, transparent);
}

@keyframes roy-b11-spiral-galaxy-spin {
  0%   { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(360deg) scale(1); }
}`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // TEXT — creative typography (5)
  // ═══════════════════════════════════════════════════════════════════

  // 36 ─ Text Neon Sign ───────────────────────────────────────────
  {
    id: "text-neon-sign",
    name: "Text Neon Sign",
    category: "text",
    description: "Glowing neon tube text in electric pink with subtle flicker",
    tags: ["neon", "text", "glow", "tube"],
    previewType: "text",
    previewText: "NEON",
    cssCode: `/* Text Neon Sign — glowing tube letters */
.roycss-text-neon-sign {
  display: inline-block;
  font: 900 72px/1 'Arial Black', sans-serif;
  letter-spacing: 0.08em;
  color: oklch(1 0 89.88);
  text-shadow:
    0 0 4px oklch(1 0 89.88),
    0 0 10px oklch(0.683 0.303 335.86),
    0 0 22px oklch(0.683 0.303 335.86),
    0 0 40px oklch(0.683 0.303 335.86),
    0 0 70px oklch(0.683 0.303 335.86),
    0 0 100px oklch(0.683 0.303 335.86);
  padding: 20px 30px;
  background: radial-gradient(ellipse at 50% 50%, oklch(0.194 0.08 297.65) 0%, oklch(0.096 0.051 300.12) 100%);
  border-radius: 12px;
  animation: roy-b11-text-neon-flicker 4s linear infinite;
}

@keyframes roy-b11-text-neon-flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% {
    opacity: 1;
    text-shadow:
      0 0 4px oklch(1 0 89.88),
      0 0 10px oklch(0.683 0.303 335.86),
      0 0 22px oklch(0.683 0.303 335.86),
      0 0 40px oklch(0.683 0.303 335.86),
      0 0 70px oklch(0.683 0.303 335.86),
      0 0 100px oklch(0.683 0.303 335.86);
  }
  20%, 24%, 55% {
    opacity: 0.6;
    text-shadow: 0 0 2px oklch(1 0 89.88), 0 0 4px oklch(0.683 0.303 335.86);
  }
}`,
  },

  // 37 ─ Text Emboss ──────────────────────────────────────────────
  {
    id: "text-emboss",
    name: "Text Emboss",
    category: "text",
    description: "Deeply embossed metallic text engraved into a stone surface",
    tags: ["emboss", "engraved", "stone", "3d"],
    previewType: "text",
    previewText: "EMBOSS",
    cssCode: `/* Text Emboss — engraved stone typography */
.roycss-text-emboss {
  display: inline-block;
  font: 900 64px/1 'Georgia', serif;
  letter-spacing: 0.05em;
  color: oklch(0.482 0.042 69.22);
  padding: 24px 36px;
  background:
    radial-gradient(ellipse 60% 40% at 30% 30%, color-mix(in oklch, oklch(0.959 0.042 84.58) 30%, transparent), transparent 60%),
    linear-gradient(135deg, oklch(0.73 0.048 79.93) 0%, oklch(0.587 0.045 81.46) 50%, oklch(0.674 0.06 84.3) 100%);
  border-radius: 8px;
  box-shadow:
    inset 4px 4px 8px color-mix(in oklch, oklch(0.984 0.027 95.33) 40%, transparent),
    inset -4px -4px 8px color-mix(in oklch, oklch(0.243 0.03 76.73) 40%, transparent),
    0 6px 20px color-mix(in oklch, oklch(0.243 0.03 76.73) 40%, transparent);
  text-shadow:
    1px 1px 1px color-mix(in oklch, oklch(0.971 0.034 88.77) 70%, transparent),
    -1px -1px 1px color-mix(in oklch, oklch(0.201 0.025 65.66) 80%, transparent),
    0 4px 6px color-mix(in oklch, oklch(0.201 0.025 65.66) 40%, transparent);
  background-clip: border-box;
}

.roycss-text-emboss::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(45deg, transparent 0 2px, color-mix(in oklch, oklch(0.296 0.044 64.71) 6%, transparent) 2px 3px);
  pointer-events: none;
}`,
  },

  // 38 ─ Text Water ───────────────────────────────────────────────
  {
    id: "text-water",
    name: "Text Water",
    category: "text",
    description: "Transparent water text with rippling caustics and reflection",
    tags: ["water", "text", "ripple", "transparent"],
    previewType: "text",
    previewText: "WATER",
    cssCode: `/* Text Water — transparent rippling water letters */
.roycss-text-water {
  display: inline-block;
  position: relative;
  font: 900 72px/1 'Arial Black', sans-serif;
  letter-spacing: 0.08em;
  color: transparent;
  background:
    linear-gradient(180deg,
      color-mix(in oklch, oklch(1 0 89.88) 90%, transparent) 0%,
      color-mix(in oklch, oklch(0.898 0.062 229.91) 70%, transparent) 30%,
      color-mix(in oklch, oklch(0.731 0.117 233.39) 60%, transparent) 55%,
      color-mix(in oklch, oklch(0.505 0.144 254.88) 80%, transparent) 80%,
      color-mix(in oklch, oklch(0.289 0.097 260.21) 90%, transparent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  padding: 18px 30px;
  text-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 50%, transparent),
    0 -1px 0 color-mix(in oklch, oklch(0.233 0.068 251.16) 60%, transparent);
  filter: drop-shadow(0 4px 6px color-mix(in oklch, oklch(0.424 0.119 249.77) 50%, transparent));
  animation: roy-b11-text-water-ripple 3s ease-in-out infinite;
}

.roycss-text-water::before {
  content: 'WATER';
  position: absolute;
  inset-block-start: 4px; inset-inline-start: 30px;
  font: inherit;
  letter-spacing: inherit;
  color: transparent;
  background:
    linear-gradient(180deg,
      color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) 0%,
      color-mix(in oklch, oklch(0.898 0.062 229.91) 20%, transparent) 50%,
      transparent 100%);
  -webkit-background-clip: text;
  background-clip: text;
  transform: scaleY(-1) translateY(-100%);
  opacity: 0.4;
  filter: blur(1px);
  pointer-events: none;
}

@keyframes roy-b11-text-water-ripple {
  0%, 100% { filter: drop-shadow(0 4px 6px color-mix(in oklch, oklch(0.424 0.119 249.77) 50%, transparent)) hue-rotate(0deg); }
  50%      { filter: drop-shadow(0 4px 8px color-mix(in oklch, oklch(0.424 0.119 249.77) 70%, transparent)) hue-rotate(15deg); }
}`,
  },

  // 39 ─ Text Fire Flame ──────────────────────────────────────────
  {
    id: "text-fire-flame",
    name: "Text Fire Flame",
    category: "text",
    description: "Text engulfed in animated flames rising upward",
    tags: ["fire", "flame", "text", "animated"],
    previewType: "text",
    previewText: "FIRE",
    cssCode: `/* Text Fire Flame — burning letterforms */
.roycss-text-fire-flame {
  display: inline-block;
  position: relative;
  font: 900 80px/1 'Arial Black', sans-serif;
  letter-spacing: 0.05em;
  color: oklch(1 0 89.88);
  padding: 30px 36px;
  background: oklch(0.121 0.025 82.32);
  border-radius: 8px;
  text-shadow:
    0 -2px 4px oklch(1 0 89.88),
    0 -4px 8px oklch(0.908 0.157 96.48),
    0 -8px 14px oklch(0.751 0.179 58.28),
    0 -14px 22px oklch(0.644 0.243 32.25),
    0 -22px 32px oklch(0.527 0.211 30.14),
    0 2px 4px color-mix(in oklch, oklch(0.527 0.211 30.14) 80%, transparent);
  animation: roy-b11-text-fire-flame 0.6s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 12px color-mix(in oklch, oklch(0.671 0.221 37.64) 70%, transparent));
}

.roycss-text-fire-flame::before {
  content: 'FIRE';
  position: absolute;
  inset-block-start: -10px; inset-inline-start: 36px;
  font: inherit;
  letter-spacing: inherit;
  color: transparent;
  background: linear-gradient(0deg, oklch(0.644 0.243 32.25) 0%, oklch(0.908 0.157 96.48) 50%, oklch(1 0 89.88) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  opacity: 0.6;
  filter: blur(4px);
  animation: roy-b11-text-fire-flame-flicker 0.4s ease-in-out infinite alternate;
}

@keyframes roy-b11-text-fire-flame {
  0%   { text-shadow: 0 -2px 4px oklch(1 0 89.88), 0 -4px 8px oklch(0.908 0.157 96.48), 0 -8px 14px oklch(0.751 0.179 58.28), 0 -14px 22px oklch(0.644 0.243 32.25), 0 -22px 32px oklch(0.527 0.211 30.14), 0 2px 4px color-mix(in oklch, oklch(0.527 0.211 30.14) 80%, transparent); transform: translateY(0); }
  100% { text-shadow: 0 -2px 6px oklch(1 0 89.88), 0 -6px 10px oklch(0.908 0.157 96.48), 0 -12px 18px oklch(0.751 0.179 58.28), 0 -20px 28px oklch(0.644 0.243 32.25), 0 -30px 42px oklch(0.527 0.211 30.14), 0 2px 6px color-mix(in oklch, oklch(0.527 0.211 30.14) 90%, transparent); transform: translateY(-2px); }
}
@keyframes roy-b11-text-fire-flame-flicker {
  0%   { transform: scaleY(1) translateY(0); opacity: 0.5; }
  100% { transform: scaleY(1.15) translateY(-4px); opacity: 0.75; }
}`,
  },

  // 40 ─ Text 3D Cinema ───────────────────────────────────────────
  {
    id: "text-3d-cinema",
    name: "Text 3D Cinema",
    category: "text",
    description: "Cinematic 3D text with long extruded shadow and golden lighting",
    tags: ["3d", "cinema", "text", "shadow"],
    previewType: "text",
    previewText: "CINEMA",
    cssCode: `/* Text 3D Cinema — extruded golden 3D typography */
.roycss-text-3d-cinema {
  display: inline-block;
  position: relative;
  font: 900 72px/1 'Arial Black', sans-serif;
  letter-spacing: 0.06em;
  color: oklch(0.973 0.051 97.64);
  padding: 30px 40px;
  background: linear-gradient(180deg, oklch(0.179 0.037 79.02) 0%, oklch(0 0 0) 100%);
  border-radius: 10px;
  text-shadow:
    1px 1px 0 oklch(0.541 0.104 84.45),
    2px 2px 0 oklch(0.541 0.104 84.45),
    3px 3px 0 oklch(0.48 0.092 85.67),
    4px 4px 0 oklch(0.48 0.092 85.67),
    5px 5px 0 oklch(0.412 0.078 85.41),
    6px 6px 0 oklch(0.412 0.078 85.41),
    7px 7px 0 oklch(0.343 0.064 86.93),
    8px 8px 0 oklch(0.343 0.064 86.93),
    9px 9px 0 oklch(0.266 0.047 88.38),
    10px 10px 0 oklch(0.266 0.047 88.38),
    11px 11px 8px color-mix(in oklch, oklch(0 0 0) 60%, transparent),
    14px 14px 20px color-mix(in oklch, oklch(0 0 0) 80%, transparent);
  background-clip: border-box;
  filter: drop-shadow(0 0 12px color-mix(in oklch, oklch(0.861 0.147 83.67) 40%, transparent));
  animation: roy-b11-text-3d-cinema-light 4s ease-in-out infinite;
}

.roycss-text-3d-cinema::before {
  content: 'CINEMA';
  position: absolute;
  inset-block-start: 30px; inset-inline-start: 40px;
  font: inherit;
  letter-spacing: inherit;
  color: transparent;
  background: linear-gradient(180deg, oklch(1 0 89.88) 0%, oklch(0.932 0.118 96.68) 40%, oklch(0.735 0.146 84.27) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-stroke: 1px color-mix(in oklch, oklch(0.861 0.147 83.67) 30%, transparent);
  pointer-events: none;
}

@keyframes roy-b11-text-3d-cinema-light {
  0%, 100% { filter: drop-shadow(0 0 12px color-mix(in oklch, oklch(0.861 0.147 83.67) 40%, transparent)) brightness(1); }
  50%      { filter: drop-shadow(0 0 24px color-mix(in oklch, oklch(0.861 0.147 83.67) 70%, transparent)) brightness(1.15); }
}`,
  },
];
