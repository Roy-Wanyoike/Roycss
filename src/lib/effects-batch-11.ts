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
  width: 200px;
  height: 160px;
  border-radius: 50% 50% 45% 55% / 60% 55% 45% 40%;
  background:
    radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,255,255,0.95), transparent 60%),
    radial-gradient(ellipse 50% 35% at 70% 70%, rgba(120,130,145,0.6), transparent 65%),
    linear-gradient(125deg,
      #d6dbe2 0%,
      #f4f6f9 12%,
      #8a909a 26%,
      #e9edf2 40%,
      #5e6571 52%,
      #c9ced6 66%,
      #3e434c 78%,
      #aab0ba 90%,
      #6b7280 100%);
  background-size: 200% 200%;
  box-shadow:
    inset -8px -10px 20px rgba(0,0,0,0.45),
    inset 8px 10px 18px rgba(255,255,255,0.55),
    0 14px 30px rgba(0,0,0,0.35);
  filter: contrast(1.15) saturate(0.85);
  animation: roy-b11-liquid-metal-flow 7s ease-in-out infinite;
}
.roycss-liquid-metal > div { display: none; }

.roycss-liquid-metal::before {
  content: '';
  position: absolute;
  top: 12%; left: 18%;
  width: 45%; height: 22%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(255,255,255,0.85), transparent 70%);
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
  width: 220px;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 60%, #0a0d12 0%, #02040a 100%);
}
.roycss-oil-slick > div { display: none; }

.roycss-oil-slick::before {
  content: '';
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(circle at 25% 35%, rgba(255,0,128,0.55), transparent 28%),
    radial-gradient(circle at 65% 25%, rgba(0,200,255,0.55), transparent 30%),
    radial-gradient(circle at 75% 65%, rgba(180,255,80,0.55), transparent 26%),
    radial-gradient(circle at 35% 75%, rgba(255,200,0,0.55), transparent 30%),
    radial-gradient(circle at 50% 50%, rgba(200,0,255,0.5), transparent 32%),
    conic-gradient(from 0deg at 50% 50%,
      #ff006e, #ffbe0b, #8338ec, #3a86ff, #06ffa5, #ff006e);
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
    radial-gradient(ellipse 80% 30% at 50% 15%, rgba(255,255,255,0.12), transparent 70%),
    repeating-linear-gradient(90deg, transparent 0 14px, rgba(0,0,0,0.08) 14px 15px);
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
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), rgba(255,255,255,0.05) 18%, transparent 32%),
    radial-gradient(circle at 70% 65%, rgba(255,0,200,0.35), transparent 40%),
    radial-gradient(circle at 30% 75%, rgba(0,255,200,0.35), transparent 40%),
    radial-gradient(circle at 75% 25%, rgba(255,220,0,0.3), transparent 40%),
    conic-gradient(from 30deg,
      rgba(255,80,180,0.35),
      rgba(80,200,255,0.35),
      rgba(180,255,120,0.35),
      rgba(255,200,80,0.35),
      rgba(180,80,255,0.35),
      rgba(255,80,180,0.35));
  box-shadow:
    inset 0 0 40px rgba(255,255,255,0.25),
    inset -20px -25px 50px rgba(80,0,120,0.25),
    inset 15px 20px 40px rgba(0,180,255,0.25),
    0 8px 30px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.4);
  filter: saturate(1.2);
  animation: roy-b11-soap-bubble-float 6s ease-in-out infinite;
}
.roycss-soap-bubble > div { display: none; }

.roycss-soap-bubble::before {
  content: '';
  position: absolute;
  top: 14%; left: 22%;
  width: 18%; height: 14%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(255,255,255,0.95), transparent 70%);
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
  width: 220px;
  height: 160px;
  border-radius: 14px;
  overflow: hidden;
  background: #1a0805;
  box-shadow: 0 0 30px rgba(255,80,0,0.45), inset 0 0 40px rgba(0,0,0,0.5);
}
.roycss-molten-lava > div { display: none; }

.roycss-molten-lava::before {
  content: '';
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(ellipse 30% 20% at 25% 30%, #fff0a0 0%, #ff8c00 18%, #ff3000 32%, transparent 50%),
    radial-gradient(ellipse 40% 25% at 70% 60%, #ffec80 0%, #ff6b00 20%, #c81000 38%, transparent 55%),
    radial-gradient(ellipse 25% 18% at 50% 80%, #ffe055 0%, #ff5500 22%, #8b0000 40%, transparent 55%),
    radial-gradient(ellipse 20% 15% at 85% 30%, #ffd040 0%, #ff7000 25%, transparent 45%);
  filter: blur(2px);
  animation: roy-b11-molten-lava-flow 5s ease-in-out infinite alternate;
}

.roycss-molten-lava::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(20deg, transparent 0 24px, rgba(0,0,0,0.5) 24px 26px),
    repeating-linear-gradient(-55deg, transparent 0 34px, rgba(0,0,0,0.4) 34px 36px),
    radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%);
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
  width: 200px;
  height: 160px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(ellipse 50% 40% at 25% 20%, rgba(255,255,255,0.7), transparent 60%),
    radial-gradient(ellipse 40% 30% at 75% 75%, rgba(150,210,255,0.5), transparent 60%),
    linear-gradient(135deg, #d4ebf7 0%, #a8d4ec 35%, #6fa8c8 70%, #cfe8f5 100%);
  box-shadow:
    inset 8px 12px 25px rgba(255,255,255,0.6),
    inset -8px -12px 25px rgba(40,90,140,0.4),
    0 10px 30px rgba(80,140,180,0.4);
  border: 1px solid rgba(255,255,255,0.7);
  backdrop-filter: blur(2px);
}
.roycss-frozen-ice > div { display: none; }

.roycss-frozen-ice::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, transparent 49.6%, rgba(255,255,255,0.65) 49.8%, rgba(255,255,255,0.65) 50.2%, transparent 50.4%),
    linear-gradient(75deg, transparent 49.6%, rgba(180,220,255,0.5) 49.8%, rgba(180,220,255,0.5) 50.2%, transparent 50.4%),
    linear-gradient(160deg, transparent 49.6%, rgba(255,255,255,0.4) 49.8%, rgba(255,255,255,0.4) 50.2%, transparent 50.4%),
    linear-gradient(20deg, transparent 39.6%, rgba(180,220,255,0.35) 39.8%, rgba(180,220,255,0.35) 40.2%, transparent 40.4%);
  filter: drop-shadow(0 0 1px rgba(255,255,255,0.5));
  animation: roy-b11-frozen-ice-sparkle 4s ease-in-out infinite;
}

.roycss-frozen-ice::after {
  content: '';
  position: absolute;
  top: 8%; left: 12%;
  width: 30%; height: 12%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(255,255,255,0.85), transparent 70%);
  filter: blur(1px);
}

@keyframes roy-b11-frozen-ice-sparkle {
  0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 1px rgba(255,255,255,0.5)); }
  50%      { opacity: 1; filter: drop-shadow(0 0 4px rgba(255,255,255,0.9)); }
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
  width: 200px;
  height: 160px;
  border-radius: 8px;
  background:
    radial-gradient(ellipse 30% 25% at 20% 25%, #fff7d0, transparent 55%),
    radial-gradient(ellipse 25% 20% at 75% 70%, #c8951c, transparent 60%),
    radial-gradient(ellipse 20% 18% at 65% 30%, #ffe98a, transparent 55%),
    radial-gradient(ellipse 28% 22% at 30% 75%, #b8821a, transparent 60%),
    linear-gradient(115deg,
      #b8821a 0%,
      #fff3b0 12%,
      #d4a017 28%,
      #ffe98a 42%,
      #a87614 58%,
      #fff3b0 72%,
      #c8951c 88%,
      #8b5a0f 100%);
  background-size: 220% 220%, 200% 200%, 200% 200%, 200% 200%, 200% 200%;
  box-shadow:
    inset 0 0 20px rgba(0,0,0,0.25),
    inset 6px 8px 14px rgba(255,245,200,0.4),
    0 8px 22px rgba(80,50,0,0.4);
  filter: contrast(1.1) saturate(1.2);
  animation: roy-b11-gold-leaf-shimmer 6s ease-in-out infinite;
}
.roycss-gold-leaf > div { display: none; }

.roycss-gold-leaf::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(35deg, transparent 0 8px, rgba(0,0,0,0.12) 8px 9px),
    repeating-linear-gradient(-50deg, transparent 0 14px, rgba(255,240,180,0.15) 14px 15px);
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
  width: 200px;
  height: 160px;
  border-radius: 12px;
  background:
    radial-gradient(ellipse 70% 50% at 30% 30%, rgba(180,40,90,0.7), transparent 60%),
    radial-gradient(ellipse 60% 50% at 75% 70%, rgba(60,0,30,0.85), transparent 65%),
    linear-gradient(135deg, #7a0e3a 0%, #4a0520 50%, #6a0c30 100%);
  box-shadow:
    inset 0 0 30px rgba(0,0,0,0.6),
    inset 8px 10px 18px rgba(255,120,170,0.25),
    inset -8px -10px 18px rgba(0,0,0,0.5),
    0 10px 25px rgba(40,0,15,0.5);
}
.roycss-velvet-fabric > div { display: none; }

.roycss-velvet-fabric::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(135deg,
      transparent 0 1px,
      rgba(255,150,200,0.18) 1px 2px,
      transparent 2px 3px,
      rgba(0,0,0,0.25) 3px 4px);
  mix-blend-mode: overlay;
  border-radius: inherit;
  animation: roy-b11-velvet-sheen 5s ease-in-out infinite;
}

.roycss-velvet-fabric::after {
  content: '';
  position: absolute;
  top: 20%; left: 15%;
  width: 60%; height: 30%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(255,180,210,0.45), transparent 70%);
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
  width: 200px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(115deg, #1a1a1a 0 8%, transparent 8% 9%, #1a1a1a 9% 17%, transparent 17% 18%, #1a1a1a 18% 26%, transparent 26% 27%, #1a1a1a 27% 35%, transparent 35% 36%, #1a1a1a 36% 44%, transparent 44% 45%, #1a1a1a 45% 53%, transparent 53% 54%, #1a1a1a 54% 62%, transparent 62% 63%, #1a1a1a 63% 71%, transparent 71% 72%, #1a1a1a 72% 80%, transparent 80% 81%, #1a1a1a 81% 89%, transparent 89% 90%, #1a1a1a 90% 100%),
    linear-gradient(25deg, #1a1a1a 0 9%, transparent 9% 10%, #1a1a1a 10% 19%, transparent 19% 20%, #1a1a1a 20% 29%, transparent 29% 30%, #1a1a1a 30% 39%, transparent 39% 40%, #1a1a1a 40% 49%, transparent 49% 50%, #1a1a1a 50% 59%, transparent 59% 60%, #1a1a1a 60% 69%, transparent 69% 70%, #1a1a1a 70% 79%, transparent 79% 80%, #1a1a1a 80% 89%, transparent 89% 90%, #1a1a1a 90% 100%),
    radial-gradient(circle at 20% 25%, #c8102e 0 22%, transparent 22%),
    radial-gradient(circle at 75% 20%, #ffd700 0 18%, transparent 18%),
    radial-gradient(circle at 30% 70%, #1e90ff 0 24%, transparent 24%),
    radial-gradient(circle at 80% 75%, #9400d3 0 20%, transparent 20%),
    radial-gradient(circle at 55% 45%, #ff8c00 0 18%, transparent 18%),
    radial-gradient(circle at 50% 90%, #2ecc71 0 16%, transparent 16%),
    linear-gradient(45deg, #4a0e6b, #8b1a3a, #1a4a8b, #6b8b1a);
  background-blend-mode: normal, normal, screen, screen, screen, screen, screen, screen, normal;
  filter: saturate(1.3) brightness(1.05);
  box-shadow: 0 0 25px rgba(255,200,100,0.3), inset 0 0 0 2px #1a1a1a;
}
.roycss-stained-glass > div { display: none; }

.roycss-stained-glass::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,240,180,0.4), transparent 70%);
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
  width: 200px;
  height: 160px;
  border-radius: 12px;
  background: radial-gradient(ellipse at 50% 50%, #1a0833 0%, #050010 100%);
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
  color: #fff;
  text-shadow:
    0 0 4px #fff,
    0 0 12px #ff00de,
    0 0 24px #ff00de,
    0 0 44px #ff00de,
    0 0 80px #ff00de;
  animation: roy-b11-neon-flicker 3.5s linear infinite;
}

.roycss-neon-sign::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 50% 30% at 50% 50%, rgba(255,0,222,0.35), transparent 70%);
  pointer-events: none;
  animation: roy-b11-neon-glow 3.5s linear infinite;
}

@keyframes roy-b11-neon-flicker {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 64%, 100% {
    opacity: 1;
    text-shadow: 0 0 4px #fff, 0 0 12px #ff00de, 0 0 24px #ff00de, 0 0 44px #ff00de, 0 0 80px #ff00de;
  }
  20%, 24%, 55%, 65% {
    opacity: 0.4;
    text-shadow: 0 0 2px #fff, 0 0 4px #ff00de;
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
  width: 200px;
  height: 180px;
  background: #fafafa;
  clip-path: polygon(
    50% 0%, 100% 35%, 75% 100%, 25% 100%, 0% 35%);
}
.roycss-origami-fold > div { display: none; }

.roycss-origami-fold::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, transparent 49.5%, #c8102e 49.5% 50.5%, transparent 50.5%),
    linear-gradient(45deg,  transparent 49.5%, #1a1a1a 49.5% 50.5%, transparent 50.5%),
    linear-gradient(90deg,  transparent 49.5%, #c8102e 49.5% 50.5%, transparent 50.5%),
    linear-gradient(0deg,   transparent 49.5%, #1a1a1a 49.5% 50.5%, transparent 50.5%),
    conic-gradient(from 0deg at 50% 50%,
      #ff6b6b 0deg 72deg,
      #ffa94d 72deg 144deg,
      #ffd43b 144deg 216deg,
      #69db7c 216deg 288deg,
      #74c0fc 288deg 360deg);
  clip-path: inherit;
  filter: saturate(1.1);
}

.roycss-origami-fold::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, rgba(255,255,255,0.4) 0%, transparent 50%),
    linear-gradient(295deg, rgba(0,0,0,0.25) 0%, transparent 50%);
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
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, #4fb3d9 0%, #1d6a8c 70%, #0d3f56 100%);
  overflow: hidden;
}
.roycss-water-ripple > div { display: none; }

.roycss-water-ripple::before,
.roycss-water-ripple::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.7);
  transform: translate(-50%, -50%);
  animation: roy-b11-water-ripple 3s ease-out infinite;
}

.roycss-water-ripple::after {
  animation-delay: 1.5s;
}

@keyframes roy-b11-water-ripple {
  0%   { width: 20px; height: 20px; opacity: 1; border-width: 2px; }
  100% { width: 220px; height: 220px; opacity: 0; border-width: 0.5px; }
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
  width: 220px;
  height: 160px;
  background: #0a0a14;
  overflow: hidden;
  border-radius: 8px;
}
.roycss-prism-rainbow > div { display: none; }

.roycss-prism-rainbow::before {
  content: '';
  position: absolute;
  top: 50%; left: 8%;
  width: 0; height: 0;
  border-left: 30px solid rgba(255,255,255,0.85);
  border-top: 28px solid transparent;
  border-bottom: 28px solid transparent;
  transform: translateY(-50%) skewY(-12deg);
  filter: drop-shadow(0 0 6px rgba(255,255,255,0.6));
}

.roycss-prism-rainbow::after {
  content: '';
  position: absolute;
  top: 0; left: 28%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg,
    #ff0000 0%, #ff7f00 14%, #ffff00 28%,
    #00ff00 42%, #0000ff 57%, #4b0082 71%, #9400d3 85%, transparent 100%);
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
  width: 220px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(180deg, #87ceeb 0%, #ffd89b 60%, #ff6b35 100%);
}
.roycss-heat-haze > div { display: none; }

.roycss-heat-haze::before {
  content: '';
  position: absolute;
  inset: -10% -10% 0 -10%;
  background:
    repeating-linear-gradient(0deg,
      rgba(255,255,255,0.08) 0px,
      rgba(255,255,255,0.08) 4px,
      transparent 4px,
      transparent 12px);
  filter: blur(3px);
  mix-blend-mode: overlay;
  animation: roy-b11-heat-haze-warp 3s ease-in-out infinite;
}

.roycss-heat-haze::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 30%;
  background: linear-gradient(0deg, rgba(255,80,0,0.4), transparent);
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
  width: 220px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(180deg, #1a5f7a 0%, #0d3f56 40%, #061f2e 80%, #02101a 100%);
}
.roycss-deep-sea > div { display: none; }

.roycss-deep-sea::before {
  content: '';
  position: absolute;
  top: -20%; left: 0;
  width: 100%; height: 80%;
  background:
    linear-gradient(165deg, rgba(180,230,255,0.25) 0%, transparent 35%),
    linear-gradient(195deg, rgba(180,230,255,0.2) 0%, transparent 40%),
    linear-gradient(175deg, rgba(180,230,255,0.18) 0%, transparent 30%);
  filter: blur(8px);
  mix-blend-mode: screen;
  animation: roy-b11-deep-sea-rays 7s ease-in-out infinite;
}

.roycss-deep-sea::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 2px at 20% 30%, rgba(255,255,255,0.7), transparent),
    radial-gradient(circle 1.5px at 60% 70%, rgba(255,255,255,0.5), transparent),
    radial-gradient(circle 2.5px at 80% 20%, rgba(255,255,255,0.6), transparent),
    radial-gradient(circle 1px at 35% 85%, rgba(255,255,255,0.5), transparent),
    radial-gradient(circle 1.5px at 75% 55%, rgba(255,255,255,0.55), transparent),
    radial-gradient(circle 1px at 15% 65%, rgba(255,255,255,0.4), transparent);
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
  width: 240px;
  height: 180px;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, #0a0f24 0%, #061226 60%, #02060f 100%);
}
.roycss-northern-lights > div { display: none; }

.roycss-northern-lights::before {
  content: '';
  position: absolute;
  top: -30%; left: -20%;
  width: 140%; height: 100%;
  background:
    radial-gradient(ellipse 60% 40% at 30% 50%, rgba(80,255,180,0.55), transparent 60%),
    radial-gradient(ellipse 50% 35% at 60% 40%, rgba(120,200,255,0.45), transparent 60%),
    radial-gradient(ellipse 55% 30% at 75% 55%, rgba(180,80,255,0.45), transparent 60%),
    radial-gradient(ellipse 40% 25% at 20% 60%, rgba(80,255,200,0.4), transparent 60%);
  filter: blur(20px);
  mix-blend-mode: screen;
  animation: roy-b11-aurora-wave 8s ease-in-out infinite;
}

.roycss-northern-lights::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 35%;
  background:
    radial-gradient(circle 1px at 10% 50%, #fff, transparent),
    radial-gradient(circle 1px at 25% 30%, #fff, transparent),
    radial-gradient(circle 1px at 40% 70%, #fff, transparent),
    radial-gradient(circle 1px at 60% 40%, #fff, transparent),
    radial-gradient(circle 1px at 75% 60%, #fff, transparent),
    radial-gradient(circle 1px at 90% 35%, #fff, transparent),
    linear-gradient(0deg, #0a1428 30%, transparent 100%);
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
  width: 100%;
  min-height: 240px;
  background:
    repeating-linear-gradient(35deg,
      #8b1a1a 0 20px, #c84040 20px 38px, #5a0808 38px 60px,
      #d4604a 60px 80px, #6b1414 80px 102px),
    repeating-linear-gradient(-25deg,
      #2a4d8a 0 24px, #4a7bc8 24px 48px, #1a2d55 48px 72px),
    linear-gradient(135deg, #c84040 0%, #2a4d8a 50%, #8b1a1a 100%);
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
    radial-gradient(circle at 20% 30%, rgba(255,200,80,0.35), transparent 30%),
    radial-gradient(circle at 75% 70%, rgba(255,255,180,0.25), transparent 35%),
    radial-gradient(circle at 50% 50%, rgba(0,0,0,0.3), transparent 60%);
  mix-blend-mode: overlay;
  border-radius: inherit;
}

.roycss-painting-oil::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(90deg, transparent 0 3px, rgba(0,0,0,0.08) 3px 4px),
    repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.06) 3px 4px);
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
  width: 100%;
  min-height: 240px;
  background:
    radial-gradient(ellipse 50% 40% at 25% 35%, rgba(255,150,180,0.7), transparent 60%),
    radial-gradient(ellipse 45% 35% at 70% 30%, rgba(150,200,255,0.65), transparent 65%),
    radial-gradient(ellipse 55% 40% at 60% 75%, rgba(255,220,120,0.6), transparent 60%),
    radial-gradient(ellipse 35% 30% at 30% 80%, rgba(180,255,180,0.55), transparent 65%),
    radial-gradient(ellipse 30% 25% at 85% 65%, rgba(220,150,255,0.55), transparent 65%),
    linear-gradient(135deg, #faf6ee 0%, #f0e8d8 100%);
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
    repeating-radial-gradient(circle at 30% 40%, transparent 0 3px, rgba(180,120,80,0.05) 3px 4px),
    repeating-radial-gradient(circle at 70% 60%, transparent 0 4px, rgba(80,40,20,0.04) 4px 5px);
  mix-blend-mode: multiply;
}

.roycss-watercolor::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 20% 8% at 50% 50%, rgba(80,40,20,0.15), transparent 70%);
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
  width: 100%;
  min-height: 240px;
  background:
    repeating-linear-gradient(45deg,
      transparent 0 2px,
      rgba(40,40,40,0.35) 2px 2.4px,
      transparent 2.4px 5px),
    repeating-linear-gradient(-45deg,
      transparent 0 2px,
      rgba(40,40,40,0.25) 2px 2.4px,
      transparent 2.4px 5px),
    repeating-linear-gradient(90deg,
      transparent 0 3px,
      rgba(40,40,40,0.12) 3px 3.4px,
      transparent 3.4px 7px),
    linear-gradient(180deg, #f5f0e6 0%, #ebe5d5 100%);
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
    radial-gradient(ellipse 50% 40% at 50% 50%, rgba(40,40,40,0.18), transparent 65%),
    radial-gradient(circle at 25% 30%, rgba(40,40,40,0.25), transparent 8%),
    radial-gradient(circle at 75% 60%, rgba(40,40,40,0.2), transparent 10%);
  mix-blend-mode: multiply;
}

.roycss-pencil-sketch::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg, transparent 0 1px, rgba(255,255,255,0.04) 1px 2px);
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
  width: 100%;
  min-height: 240px;
  background:
    radial-gradient(ellipse 90% 70% at 50% 50%, #1a3a5c 0%, #0a1a2c 70%, #000 100%);
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    inset 0 0 60px rgba(0,0,0,0.8),
    inset 0 0 120px rgba(80,140,200,0.3);
}

.roycss-vintage-tv::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0 2px,
      rgba(0,0,0,0.35) 2px 3px),
    radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%);
  mix-blend-mode: multiply;
}

.roycss-vintage-tv::after {
  content: '';
  position: absolute;
  top: -20%; left: -20%;
  width: 140%; height: 140%;
  background:
    radial-gradient(ellipse 30% 20% at 30% 30%, rgba(255,255,255,0.15), transparent 70%),
    repeating-linear-gradient(0deg,
      transparent 0 1px,
      rgba(255,255,255,0.04) 1px 2px);
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
  width: 100%;
  min-height: 240px;
  background:
    radial-gradient(ellipse 60% 50% at 30% 30%, #f4a261 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 70% 70%, #e76f51 0%, transparent 60%),
    linear-gradient(135deg, #264653 0%, #2a9d8f 50%, #e9c46a 100%);
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
    radial-gradient(circle 1px at 10% 20%, rgba(255,255,255,0.5), transparent),
    radial-gradient(circle 1px at 30% 60%, rgba(0,0,0,0.5), transparent),
    radial-gradient(circle 1px at 50% 30%, rgba(255,255,255,0.4), transparent),
    radial-gradient(circle 1px at 70% 80%, rgba(0,0,0,0.4), transparent),
    radial-gradient(circle 1px at 85% 25%, rgba(255,255,255,0.6), transparent),
    radial-gradient(circle 1px at 15% 75%, rgba(0,0,0,0.5), transparent),
    radial-gradient(circle 1px at 90% 60%, rgba(255,255,255,0.4), transparent),
    radial-gradient(circle 1px at 45% 90%, rgba(0,0,0,0.4), transparent),
    radial-gradient(circle 1px at 60% 15%, rgba(255,255,255,0.5), transparent),
    radial-gradient(circle 1px at 25% 45%, rgba(0,0,0,0.3), transparent);
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
    radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%);
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
  width: 100%;
  min-height: 240px;
  background:
    linear-gradient(180deg, #1a0033 0%, #4a0080 50%, #001a4a 100%);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  filter: contrast(1.2) saturate(1.3);
}

.roycss-vhs-glitch::before {
  content: 'PLAY ▶';
  position: absolute;
  top: 12px; left: 16px;
  color: rgba(255,80,80,0.8);
  font: 700 16px/1 'Courier New', monospace;
  text-shadow: 2px 0 0 rgba(80,255,255,0.8), -2px 0 0 rgba(255,255,80,0.8);
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
      rgba(255,255,255,0.04) 3px 4px),
    linear-gradient(0deg,
      transparent 0 30%,
      rgba(255,0,0,0.15) 30% 32%,
      transparent 32% 50%,
      rgba(0,255,255,0.15) 50% 51%,
      transparent 51% 70%,
      rgba(255,0,255,0.12) 70% 71%,
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
  width: 100%;
  min-height: 240px;
  background:
    conic-gradient(from 0deg at 50% 50%,
      #ff004d 0deg 45deg,
      #ffa300 45deg 90deg,
      #ffec27 90deg 135deg,
      #00e436 135deg 180deg,
      #29adff 180deg 225deg,
      #83769c 225deg 270deg,
      #ff77a8 270deg 315deg,
      #ff004d 315deg 360deg);
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
    repeating-linear-gradient(0deg, transparent 0 15px, rgba(0,0,0,0.25) 15px 16px),
    repeating-linear-gradient(90deg, transparent 0 15px, rgba(0,0,0,0.25) 15px 16px);
  mix-blend-mode: multiply;
}

.roycss-pixel-art::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 8px at 25% 25%, #000 0 6px, transparent 6px 8px),
    radial-gradient(circle 8px at 75% 25%, #000 0 6px, transparent 6px 8px),
    radial-gradient(ellipse 30px 12px at 50% 70%, #000 0 28px, transparent 28px 30px);
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
  width: 100%;
  min-height: 240px;
  background:
    radial-gradient(ellipse at 50% 0%, #001a0a 0%, #000305 100%);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.roycss-ascii-rain::before {
  content: '0 1 0 1 1 0 1 0 0 1 1 0 1 0 1 1 0 0 1 0\\A 1 0 1 0 0 1 0 1 1 0 1 0 0 1 0 1 1 0 0 1\\A 0 1 1 0 1 0 0 1 1 0 1 0 1 0 0 1 1 0 1 0\\A 1 0 0 1 0 1 1 0 0 1 0 1 1 0 1 0 0 1 0 1\\A 0 1 0 1 1 0 1 0 0 1 1 0 1 0 1 1 0 0 1 0\\A 1 0 1 0 0 1 0 1 1 0 1 0 0 1 0 1 1 0 0 1\\A 0 1 1 0 1 0 0 1 1 0 1 0 1 0 0 1 1 0 1 0\\A 1 0 0 1 0 1 1 0 0 1 0 1 1 0 1 0 0 1 0 1';
  white-space: pre;
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  color: #00ff66;
  font: 12px/1.4 'Courier New', monospace;
  letter-spacing: 0.2em;
  text-shadow: 0 0 6px rgba(0,255,100,0.8);
  opacity: 0.85;
  animation: roy-b11-ascii-rain-fall 4s linear infinite;
  overflow: hidden;
}

.roycss-ascii-rain::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0,30,10,0.3) 0%, transparent 40%, transparent 60%, rgba(0,30,10,0.6) 100%),
    repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.3) 2px 3px);
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
  width: 100%;
  min-height: 240px;
  background:
    linear-gradient(0deg,
      transparent 0 calc(100% - 1px), rgba(180,220,255,0.4) calc(100% - 1px) 100%),
    linear-gradient(90deg,
      transparent 0 calc(100% - 1px), rgba(180,220,255,0.4) calc(100% - 1px) 100%),
    repeating-linear-gradient(0deg, transparent 0 19px, rgba(180,220,255,0.18) 19px 20px),
    repeating-linear-gradient(90deg, transparent 0 19px, rgba(180,220,255,0.18) 19px 20px),
    repeating-linear-gradient(0deg, transparent 0 99px, rgba(180,220,255,0.35) 99px 100px),
    repeating-linear-gradient(90deg, transparent 0 99px, rgba(180,220,255,0.35) 99px 100px),
    #0a3d7a;
  background-size: 20px 20px, 20px 20px, 20px 20px, 20px 20px, 100px 100px, 100px 100px, 100% 100%;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  color: #cfe8ff;
}

.roycss-blueprint::before {
  content: '';
  position: absolute;
  top: 30px; left: 30px;
  width: 140px; height: 100px;
  border: 1.5px solid #cfe8ff;
  background:
    linear-gradient(45deg, transparent 49%, rgba(207,232,255,0.4) 49% 51%, transparent 51%);
  box-shadow:
    0 0 0 8px rgba(0,0,0,0.1),
    inset 0 0 0 5px rgba(0,0,0,0.2);
}

.roycss-blueprint::after {
  content: 'DWG-001\\A SCALE 1:50\\A REV. A';
  white-space: pre;
  position: absolute;
  bottom: 16px; right: 20px;
  color: #cfe8ff;
  font: 11px/1.5 'Courier New', monospace;
  letter-spacing: 0.15em;
  text-align: right;
  text-shadow: 0 0 4px rgba(0,100,200,0.6);
  border: 1px solid #cfe8ff;
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
  width: 100%;
  min-height: 240px;
  background:
    repeating-radial-gradient(circle at 30% 40%,
      transparent 0,
      transparent 14px,
      rgba(120,80,30,0.5) 14px,
      rgba(120,80,30,0.5) 15px),
    repeating-radial-gradient(circle at 70% 60%,
      transparent 0,
      transparent 18px,
      rgba(100,60,20,0.45) 18px,
      rgba(100,60,20,0.45) 19px),
    repeating-radial-gradient(circle at 50% 80%,
      transparent 0,
      transparent 12px,
      rgba(80,40,10,0.4) 12px,
      rgba(80,40,10,0.4) 13px),
    radial-gradient(ellipse at 30% 40%, #f4e4c1 0%, #d4b888 50%, #8b6b3a 100%);
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
      rgba(60,30,0,0.3) 22px 23px),
    repeating-linear-gradient(45deg,
      transparent 0 80px,
      rgba(60,30,0,0.05) 80px 81px);
  mix-blend-mode: multiply;
}

.roycss-topographic::after {
  content: '▲ 1245m';
  position: absolute;
  top: 30%; left: 28%;
  color: #5a3010;
  font: 700 11px/1 'Courier New', monospace;
  letter-spacing: 0.1em;
  text-shadow: 0 0 2px rgba(255,240,200,0.7);
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
  width: 180px;
  height: 180px;
  background:
    radial-gradient(circle at 30% 30%, #ff6ec4, #7873f5 70%);
  box-shadow: 0 12px 40px rgba(120,80,255,0.5);
  animation: roy-b11-morph-blob 8s ease-in-out infinite;
}
.roycss-morph-blob > div { display: none; }

@keyframes roy-b11-morph-blob {
  0%, 100% {
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    transform: rotate(0deg) scale(1);
    background: radial-gradient(circle at 30% 30%, #ff6ec4, #7873f5 70%);
  }
  25% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
    transform: rotate(90deg) scale(1.05);
    background: radial-gradient(circle at 70% 30%, #7873f5, #4ade80 70%);
  }
  50% {
    border-radius: 50% 50% 20% 80% / 25% 80% 20% 75%;
    transform: rotate(180deg) scale(0.95);
    background: radial-gradient(circle at 50% 70%, #4ade80, #fbbf24 70%);
  }
  75% {
    border-radius: 70% 30% 50% 50% / 30% 50% 50% 70%;
    transform: rotate(270deg) scale(1.05);
    background: radial-gradient(circle at 30% 70%, #fbbf24, #ff6ec4 70%);
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
  width: 180px;
  height: 200px;
  background: linear-gradient(180deg, #1d6a8c 0%, #0d3f56 100%);
  overflow: hidden;
  border-radius: 8px;
}
.roycss-liquid-drop > div { display: none; }

.roycss-liquid-drop::before {
  content: '';
  position: absolute;
  top: -10%;
  left: 50%;
  width: 24px;
  height: 32px;
  background: linear-gradient(180deg, #88e0ff, #4fb3d9);
  border-radius: 50% 50% 50% 50% / 70% 70% 30% 30%;
  transform: translateX(-50%);
  box-shadow: inset -3px -3px 6px rgba(0,0,0,0.2), inset 3px 3px 6px rgba(255,255,255,0.5);
  animation: roy-b11-liquid-drop-fall 2.4s ease-in infinite;
}

.roycss-liquid-drop::after {
  content: '';
  position: absolute;
  bottom: 30%;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: transparent;
  transform: translateX(-50%);
  animation: roy-b11-liquid-drop-splash 2.4s ease-out infinite;
}

@keyframes roy-b11-liquid-drop-fall {
  0%   { top: -15%; transform: translateX(-50%) scaleY(1); }
  60%  { top: 65%; transform: translateX(-50%) scaleY(1.4); }
  70%  { top: 70%; transform: translateX(-50%) scaleY(0.4) scaleX(1.6); opacity: 1; }
  75%  { top: 72%; transform: translateX(-50%) scaleY(0.1) scaleX(2); opacity: 0.4; }
  100% { top: 72%; transform: translateX(-50%) scaleY(0.1) scaleX(2); opacity: 0; }
}

@keyframes roy-b11-liquid-drop-splash {
  0%, 68% { width: 4px; height: 4px; opacity: 0; border: 0 solid rgba(136,224,255,0.8); background: transparent; }
  72%     { width: 30px; height: 30px; opacity: 1; border: 2px solid rgba(136,224,255,0.9); border-radius: 50%; background: transparent; }
  100%    { width: 120px; height: 120px; opacity: 0; border: 0.5px solid rgba(136,224,255,0.2); border-radius: 50%; background: transparent; }
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
  width: 180px;
  height: 220px;
  perspective: 1200px;
  background: transparent;
}
.roycss-paper-flip > div { display: none; }

.roycss-paper-flip::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #fafafa 0%, #e8e8e8 100%);
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  transform-origin: left center;
  transform-style: preserve-3d;
  backface-visibility: visible;
}

.roycss-paper-flip::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0,0,0,0.15) 0%, transparent 10%),
    repeating-linear-gradient(0deg, transparent 0 24px, rgba(100,100,100,0.15) 24px 25px, transparent 25px 48px),
    linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  border: 1px solid #ccc;
  border-radius: 4px;
  transform-origin: left center;
  transform-style: preserve-3d;
  backface-visibility: visible;
  animation: roy-b11-paper-flip 3.5s ease-in-out infinite;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

@keyframes roy-b11-paper-flip {
  0%, 20%   { transform: rotateY(0deg); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
  50%       { transform: rotateY(-160deg); box-shadow: -12px 8px 24px rgba(0,0,0,0.3); }
  80%, 100% { transform: rotateY(-360deg); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
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
  width: 200px;
  height: 220px;
  perspective: 1000px;
}
.roycss-card-shuffle > div { display: none; }

.roycss-card-shuffle::before,
.roycss-card-shuffle::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 70px;
  height: 100px;
  border-radius: 6px;
  background:
    linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  border: 1.5px solid #ccc;
  box-shadow: 0 4px 10px rgba(0,0,0,0.25);
  transform: translate(-50%, -50%);
}

.roycss-card-shuffle::before {
  background:
    radial-gradient(circle at 50% 50%, #c8102e 0 20%, transparent 20%),
    linear-gradient(45deg, transparent 48%, #1a1a1a 48% 52%, transparent 52%),
    linear-gradient(-45deg, transparent 48%, #1a1a1a 48% 52%, transparent 52%),
    #fff;
  background-size: 30px 30px, 100% 100%, 100% 100%, 100% 100%;
  animation: roy-b11-card-shuffle-a 2.4s ease-in-out infinite;
  z-index: 2;
}

.roycss-card-shuffle::after {
  background:
    radial-gradient(circle at 50% 50%, #1a1a1a 0 20%, transparent 20%),
    #fff;
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
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background:
    repeating-conic-gradient(from 0deg,
      #c8102e 0deg 15deg,
      #1a1a1a 15deg 30deg,
      #c8102e 30deg 45deg,
      #1a1a1a 45deg 60deg,
      #c8102e 60deg 75deg,
      #1a1a1a 75deg 90deg,
      #c8102e 90deg 105deg,
      #1a1a1a 105deg 120deg,
      #c8102e 120deg 135deg,
      #1a1a1a 135deg 150deg,
      #c8102e 150deg 165deg,
      #1a1a1a 165deg 180deg,
      #c8102e 180deg 195deg,
      #1a1a1a 195deg 210deg,
      #c8102e 210deg 225deg,
      #1a1a1a 225deg 240deg,
      #c8102e 240deg 255deg,
      #1a1a1a 255deg 270deg,
      #c8102e 270deg 285deg,
      #1a1a1a 285deg 300deg,
      #c8102e 300deg 315deg,
      #1a1a1a 315deg 330deg,
      #c8102e 330deg 345deg,
      #1a1a1a 345deg 360deg);
  border: 8px solid #8b6914;
  box-shadow: 0 0 0 4px #f4d03f, 0 12px 30px rgba(0,0,0,0.5);
  animation: roy-b11-roulette-spin 4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
}
.roycss-roulette-spin > div { display: none; }

.roycss-roulette-spin::before {
  content: '';
  position: absolute;
  inset: 32%;
  border-radius: 50%;
  background: radial-gradient(circle, #f4d03f 0%, #8b6914 70%, #5a3d0a 100%);
  box-shadow: inset 0 0 8px rgba(0,0,0,0.6);
}

.roycss-roulette-spin::after {
  content: '▲';
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  color: #f4d03f;
  font-size: 22px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
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
  width: 200px;
  height: 160px;
  background: linear-gradient(180deg, #b8860b 0%, #8b6914 50%, #5a3d0a 100%);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4), inset 0 2px 6px rgba(255,220,100,0.4);
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}
.roycss-slot-machine > div { display: none; }

.roycss-slot-machine::before,
.roycss-slot-machine::after {
  content: '';
  width: 48px;
  height: 100px;
  border-radius: 6px;
  background:
    repeating-linear-gradient(0deg,
      #1a1a1a 0 28px,
      #fff 28px 56px,
      #c8102e 56px 84px,
      #ffd700 84px 112px,
      #1a1a1a 112px 140px,
      #fff 140px 168px,
      #c8102e 168px 196px);
  background-size: 100% 196px;
  border: 2px solid #f4d03f;
  box-shadow: inset 0 0 8px rgba(0,0,0,0.6);
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
  width: 200px;
  height: 200px;
  background: transparent;
}
.roycss-fortune-teller > div { display: none; }

.roycss-fortune-teller::before,
.roycss-fortune-teller::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 140px;
  height: 140px;
  transform: translate(-50%, -50%) rotate(45deg);
  background:
    conic-gradient(from 0deg,
      #ff6b6b 0deg 90deg,
      #4ecdc4 90deg 180deg,
      #ffe66d 180deg 270deg,
      #a78bfa 270deg 360deg);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  filter: drop-shadow(0 6px 12px rgba(0,0,0,0.3));
}

.roycss-fortune-teller::before {
  animation: roy-b11-fortune-teller-a 3s ease-in-out infinite;
}

.roycss-fortune-teller::after {
  background:
    conic-gradient(from 45deg,
      #ff6b6b 0deg 90deg,
      #a78bfa 90deg 180deg,
      #ffe66d 180deg 270deg,
      #4ecdc4 270deg 360deg);
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
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  background: #000;
  box-shadow: 0 0 0 6px #8b6914, 0 12px 30px rgba(0,0,0,0.5);
}
.roycss-kaleidoscope > div { display: none; }

.roycss-kaleidoscope::before {
  content: '';
  position: absolute;
  inset: -25%;
  background:
    conic-gradient(from 0deg at 50% 50%,
      #ff006e 0deg 60deg,
      #fb5607 60deg 120deg,
      #ffbe0b 120deg 180deg,
      #8338ec 180deg 240deg,
      #3a86ff 240deg 300deg,
      #06ffa5 300deg 360deg);
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
      rgba(255,255,255,0.5) 30deg 33deg,
      transparent 33deg 90deg,
      rgba(255,255,255,0.5) 90deg 93deg,
      transparent 93deg 150deg,
      rgba(255,255,255,0.5) 150deg 153deg,
      transparent 153deg 210deg,
      rgba(255,255,255,0.5) 210deg 213deg,
      transparent 213deg 270deg,
      rgba(255,255,255,0.5) 270deg 273deg,
      transparent 273deg 330deg,
      rgba(255,255,255,0.5) 330deg 333deg,
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
  width: 220px;
  height: 160px;
}
.roycss-infinity-loop > div { display: none; }

.roycss-infinity-loop::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 200px;
  height: 90px;
  transform: translate(-50%, -50%);
  border: 4px solid rgba(120,200,255,0.25);
  border-radius: 50%;
  box-shadow:
    0 0 12px rgba(120,200,255,0.3),
    inset 0 0 12px rgba(120,200,255,0.2);
}

.roycss-infinity-loop::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff, #4fb3ff 60%, transparent);
  box-shadow: 0 0 20px #4fb3ff, 0 0 40px #4fb3ff;
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
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, #1a0033 0%, #050010 70%, #000 100%);
  box-shadow: 0 0 40px rgba(120,80,255,0.4);
}
.roycss-spiral-galaxy > div { display: none; }

.roycss-spiral-galaxy::before {
  content: '';
  position: absolute;
  inset: -25%;
  background:
    conic-gradient(from 0deg at 50% 50%,
      transparent 0deg 20deg,
      rgba(180,140,255,0.55) 25deg 40deg,
      transparent 40deg 110deg,
      rgba(255,200,255,0.45) 115deg 135deg,
      transparent 135deg 200deg,
      rgba(180,140,255,0.5) 205deg 225deg,
      transparent 225deg 290deg,
      rgba(255,200,255,0.4) 295deg 315deg,
      transparent 315deg 360deg);
  filter: blur(6px);
  mix-blend-mode: screen;
  animation: roy-b11-spiral-galaxy-spin 12s linear infinite;
}

.roycss-spiral-galaxy::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 30px; height: 30px;
  margin: -15px 0 0 -15px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, #fff8e0 30%, #ffcf66 60%, transparent 80%);
  box-shadow: 0 0 20px #fff, 0 0 40px #ffcf66, 0 0 80px rgba(255,200,100,0.5);
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
  color: #fff;
  text-shadow:
    0 0 4px #fff,
    0 0 10px #ff00de,
    0 0 22px #ff00de,
    0 0 40px #ff00de,
    0 0 70px #ff00de,
    0 0 100px #ff00de;
  padding: 20px 30px;
  background: radial-gradient(ellipse at 50% 50%, #1a0833 0%, #050010 100%);
  border-radius: 12px;
  animation: roy-b11-text-neon-flicker 4s linear infinite;
}

@keyframes roy-b11-text-neon-flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% {
    opacity: 1;
    text-shadow:
      0 0 4px #fff,
      0 0 10px #ff00de,
      0 0 22px #ff00de,
      0 0 40px #ff00de,
      0 0 70px #ff00de,
      0 0 100px #ff00de;
  }
  20%, 24%, 55% {
    opacity: 0.6;
    text-shadow: 0 0 2px #fff, 0 0 4px #ff00de;
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
  color: #6e5a44;
  padding: 24px 36px;
  background:
    radial-gradient(ellipse 60% 40% at 30% 30%, rgba(255,240,210,0.3), transparent 60%),
    linear-gradient(135deg, #b8a586 0%, #8a7a5e 50%, #a8946c 100%);
  border-radius: 8px;
  box-shadow:
    inset 4px 4px 8px rgba(255,250,230,0.4),
    inset -4px -4px 8px rgba(40,30,15,0.4),
    0 6px 20px rgba(40,30,15,0.4);
  text-shadow:
    1px 1px 1px rgba(255,245,220,0.7),
    -1px -1px 1px rgba(30,20,10,0.8),
    0 4px 6px rgba(30,20,10,0.4);
  background-clip: border-box;
}

.roycss-text-emboss::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(45deg, transparent 0 2px, rgba(60,40,20,0.06) 2px 3px);
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
      rgba(255,255,255,0.9) 0%,
      rgba(180,230,255,0.7) 30%,
      rgba(80,180,230,0.6) 55%,
      rgba(30,100,180,0.8) 80%,
      rgba(10,40,90,0.9) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  padding: 18px 30px;
  text-shadow:
    0 1px 0 rgba(255,255,255,0.5),
    0 -1px 0 rgba(0,30,60,0.6);
  filter: drop-shadow(0 4px 6px rgba(0,80,140,0.5));
  animation: roy-b11-text-water-ripple 3s ease-in-out infinite;
}

.roycss-text-water::before {
  content: 'WATER';
  position: absolute;
  top: 4px; left: 30px;
  font: inherit;
  letter-spacing: inherit;
  color: transparent;
  background:
    linear-gradient(180deg,
      rgba(255,255,255,0.5) 0%,
      rgba(180,230,255,0.2) 50%,
      transparent 100%);
  -webkit-background-clip: text;
  background-clip: text;
  transform: scaleY(-1) translateY(-100%);
  opacity: 0.4;
  filter: blur(1px);
  pointer-events: none;
}

@keyframes roy-b11-text-water-ripple {
  0%, 100% { filter: drop-shadow(0 4px 6px rgba(0,80,140,0.5)) hue-rotate(0deg); }
  50%      { filter: drop-shadow(0 4px 8px rgba(0,80,140,0.7)) hue-rotate(15deg); }
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
  color: #fff;
  padding: 30px 36px;
  background: #0a0500;
  border-radius: 8px;
  text-shadow:
    0 -2px 4px #fff,
    0 -4px 8px #ffe055,
    0 -8px 14px #ff8c00,
    0 -14px 22px #ff3000,
    0 -22px 32px #c81000,
    0 2px 4px rgba(200,16,0,0.8);
  animation: roy-b11-text-fire-flame 0.6s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 12px rgba(255,80,0,0.7));
}

.roycss-text-fire-flame::before {
  content: 'FIRE';
  position: absolute;
  top: -10px; left: 36px;
  font: inherit;
  letter-spacing: inherit;
  color: transparent;
  background: linear-gradient(0deg, #ff3000 0%, #ffe055 50%, #fff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  opacity: 0.6;
  filter: blur(4px);
  animation: roy-b11-text-fire-flame-flicker 0.4s ease-in-out infinite alternate;
}

@keyframes roy-b11-text-fire-flame {
  0%   { text-shadow: 0 -2px 4px #fff, 0 -4px 8px #ffe055, 0 -8px 14px #ff8c00, 0 -14px 22px #ff3000, 0 -22px 32px #c81000, 0 2px 4px rgba(200,16,0,0.8); transform: translateY(0); }
  100% { text-shadow: 0 -2px 6px #fff, 0 -6px 10px #ffe055, 0 -12px 18px #ff8c00, 0 -20px 28px #ff3000, 0 -30px 42px #c81000, 0 2px 6px rgba(200,16,0,0.9); transform: translateY(-2px); }
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
  color: #fff7d0;
  padding: 30px 40px;
  background: linear-gradient(180deg, #1a0f00 0%, #000 100%);
  border-radius: 10px;
  text-shadow:
    1px 1px 0 #8b6914,
    2px 2px 0 #8b6914,
    3px 3px 0 #75590f,
    4px 4px 0 #75590f,
    5px 5px 0 #5e470c,
    6px 6px 0 #5e470c,
    7px 7px 0 #473608,
    8px 8px 0 #473608,
    9px 9px 0 #2f2406,
    10px 10px 0 #2f2406,
    11px 11px 8px rgba(0,0,0,0.6),
    14px 14px 20px rgba(0,0,0,0.8);
  background-clip: border-box;
  filter: drop-shadow(0 0 12px rgba(255,200,80,0.4));
  animation: roy-b11-text-3d-cinema-light 4s ease-in-out infinite;
}

.roycss-text-3d-cinema::before {
  content: 'CINEMA';
  position: absolute;
  top: 30px; left: 40px;
  font: inherit;
  letter-spacing: inherit;
  color: transparent;
  background: linear-gradient(180deg, #fff 0%, #ffe98a 40%, #d4a017 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-stroke: 1px rgba(255,200,80,0.3);
  pointer-events: none;
}

@keyframes roy-b11-text-3d-cinema-light {
  0%, 100% { filter: drop-shadow(0 0 12px rgba(255,200,80,0.4)) brightness(1); }
  50%      { filter: drop-shadow(0 0 24px rgba(255,200,80,0.7)) brightness(1.15); }
}`,
  },
];
