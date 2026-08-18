import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 40 — Immersive Background Effects (20 effects)
 * Full-bleed ambient backgrounds that transform a surface into a scene:
 * starfields, weather (rain / snow / fog / lightning), fire, smoke, water,
 * particle systems, gradient meshes, and celebratory confetti. All effects
 * are pure CSS — no SVG, no JS — and rely on layered gradients, box-shadow
 * stamping, pseudo-element overlays, and `prefers-reduced-motion` fallbacks.
 * Classes are prefixed `roycss-immersive-` and keyframes `roy-immersive-`.
 */
export const effectsBatch40: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // IMMERSIVE BACKGROUNDS (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. immersive-starfield
  {
    id: "immersive-starfield",
    name: "Parallax Starfield",
    category: "immersive",
    description:
      "Three parallax star layers drift at different speeds across a deep-space gradient",
    tags: ["immersive", "background", "stars", "space", "parallax"],
    previewType: "background",
    cssCode: `/* Immersive: Parallax Starfield */
.roycss-immersive-starfield {
  position: relative;
  background: radial-gradient(ellipse at top, #1b2735 0%, #090a0f 100%);
  overflow: hidden;
}
.roycss-immersive-starfield::before,
.roycss-immersive-starfield::after {
  content: "";
  position: absolute;
  inset: -50% 0 0 0;
  background-image:
    radial-gradient(1px 1px at 20px 30px, #fff, transparent),
    radial-gradient(1px 1px at 80px 120px, #fff, transparent),
    radial-gradient(1px 1px at 160px 80px, #cfe, transparent),
    radial-gradient(2px 2px at 240px 200px, #fff, transparent),
    radial-gradient(1px 1px at 320px 60px, #ffd, transparent),
    radial-gradient(1px 1px at 60px 220px, #fff, transparent),
    radial-gradient(2px 2px at 200px 300px, #cff, transparent);
  background-size: 400px 400px;
  background-repeat: repeat;
  animation: roy-immersive-star-drift 60s linear infinite;
  opacity: 0.85;
}
.roycss-immersive-starfield::after {
  background-size: 700px 700px;
  animation-duration: 120s;
  animation-direction: reverse;
  opacity: 0.55;
  filter: blur(0.4px);
}
@keyframes roy-immersive-star-drift {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-400px, -400px, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-starfield::before,
  .roycss-immersive-starfield::after { animation: none; }
}`,
  },

  // 2. immersive-rain
  {
    id: "immersive-rain",
    name: "Falling Rain",
    category: "immersive",
    description:
      "Thin diagonal rain streaks fall endlessly with a faint splash glow at the base",
    tags: ["immersive", "background", "rain", "weather", "water"],
    previewType: "background",
    cssCode: `/* Immersive: Falling Rain */
.roycss-immersive-rain {
  position: relative;
  background: linear-gradient(#0a0f14, #1a2a35);
  overflow: hidden;
}
.roycss-immersive-rain::before {
  content: "";
  position: absolute;
  inset: -10% 0 0 0;
  background-image:
    linear-gradient(transparent 0%, rgba(180, 220, 255, 0.55) 50%, transparent 100%);
  background-size: 2px 80px;
  background-repeat: repeat;
  background-position: 0 0, 30px 0, 60px 0, 90px 0, 120px 0, 150px 0;
  transform: skewX(-12deg);
  animation: roy-immersive-rain-fall 0.6s linear infinite;
  opacity: 0.6;
}
.roycss-immersive-rain::after {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 30%;
  background: radial-gradient(ellipse at bottom, rgba(180, 220, 255, 0.25), transparent 70%);
  animation: roy-immersive-rain-splash 0.9s ease-in-out infinite alternate;
}
@keyframes roy-immersive-rain-fall {
  from { background-position: 0 -80px, 30px -40px, 60px -10px, 90px -60px, 120px -20px, 150px -70px; }
  to   { background-position: 0 200px, 30px 240px, 60px 210px, 90px 260px, 120px 220px, 150px 270px; }
}
@keyframes roy-immersive-rain-splash {
  from { opacity: 0.15; transform: scaleY(0.9); }
  to   { opacity: 0.45; transform: scaleY(1.1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-rain::before,
  .roycss-immersive-rain::after { animation: none; }
}`,
  },

  // 3. immersive-snow-drift
  {
    id: "immersive-snow-drift",
    name: "Snow Drift",
    category: "immersive",
    description:
      "Two layers of snowflakes drift downward with gentle horizontal wind sway",
    tags: ["immersive", "background", "snow", "weather", "winter"],
    previewType: "background",
    cssCode: `/* Immersive: Snow Drift */
.roycss-immersive-snow-drift {
  position: relative;
  background: linear-gradient(#1c2530, #2a3744);
  overflow: hidden;
}
.roycss-immersive-snow-drift::before,
.roycss-immersive-snow-drift::after {
  content: "";
  position: absolute;
  inset: -20% 0 0 0;
  background-image:
    radial-gradient(2px 2px at 20px 30px, #fff, transparent),
    radial-gradient(2px 2px at 90px 110px, #fff, transparent),
    radial-gradient(3px 3px at 180px 60px, #fff, transparent),
    radial-gradient(2px 2px at 250px 180px, #fff, transparent),
    radial-gradient(3px 3px at 320px 90px, #fff, transparent),
    radial-gradient(2px 2px at 50px 240px, #fff, transparent);
  background-size: 400px 300px;
  background-repeat: repeat;
  animation: roy-immersive-snow-fall 8s linear infinite;
  opacity: 0.9;
}
.roycss-immersive-snow-drift::after {
  background-size: 600px 500px;
  animation-duration: 14s;
  animation-direction: reverse;
  opacity: 0.5;
  filter: blur(0.6px);
}
@keyframes roy-immersive-snow-fall {
  0%   { transform: translate3d(0, 0, 0); }
  50%  { transform: translate3d(40px, 150px, 0); }
  100% { transform: translate3d(-20px, 300px, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-snow-drift::before,
  .roycss-immersive-snow-drift::after { animation: none; }
}`,
  },

  // 4. immersive-fire-flame
  {
    id: "immersive-fire-flame",
    name: "Layered Flame",
    category: "immersive",
    description:
      "CSS-only flame built from layered gradients that flicker and rise from the base",
    tags: ["immersive", "background", "fire", "flame", "heat"],
    previewType: "background",
    cssCode: `/* Immersive: Layered Flame */
.roycss-immersive-fire-flame {
  position: relative;
  background: radial-gradient(ellipse at bottom, #2a0a00 0%, #000 80%);
  overflow: hidden;
}
.roycss-immersive-fire-flame::before,
.roycss-immersive-fire-flame::after {
  content: "";
  position: absolute;
  left: 50%; bottom: 0;
  width: 60%;
  height: 80%;
  transform: translateX(-50%);
  background:
    radial-gradient(ellipse at 50% 100%, #fff 0%, #ffe66d 12%, #ff8c1a 35%, #ff3d00 60%, transparent 80%);
  border-radius: 50% 50% 20% 20% / 80% 80% 20% 20%;
  filter: blur(6px);
  animation: roy-immersive-fire-flicker 0.9s ease-in-out infinite alternate;
  transform-origin: 50% 100%;
}
.roycss-immersive-fire-flame::after {
  width: 35%; height: 55%;
  background: radial-gradient(ellipse at 50% 100%, #fff 0%, #ffe066 20%, #ff5e1a 50%, transparent 75%);
  filter: blur(3px);
  animation-duration: 0.6s;
  animation-direction: alternate-reverse;
  opacity: 0.9;
}
@keyframes roy-immersive-fire-flicker {
  0%   { transform: translateX(-50%) scaleY(1) scaleX(1) skewX(-2deg); opacity: 0.85; }
  25%  { transform: translateX(-52%) scaleY(1.08) scaleX(0.95) skewX(3deg); opacity: 0.95; }
  50%  { transform: translateX(-48%) scaleY(0.94) scaleX(1.05) skewX(-4deg); opacity: 1; }
  75%  { transform: translateX(-51%) scaleY(1.05) scaleX(0.97) skewX(2deg); opacity: 0.9; }
  100% { transform: translateX(-50%) scaleY(0.98) scaleX(1.02) skewX(-1deg); opacity: 0.88; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-fire-flame::before,
  .roycss-immersive-fire-flame::after { animation: none; }
}`,
  },

  // 5. immersive-smoke-fog
  {
    id: "immersive-smoke-fog",
    name: "Drifting Smoke & Fog",
    category: "immersive",
    description:
      "Three blurred radial-gradient plumes drift and rotate to suggest drifting fog",
    tags: ["immersive", "background", "smoke", "fog", "atmosphere"],
    previewType: "background",
    cssCode: `/* Immersive: Drifting Smoke & Fog */
.roycss-immersive-smoke-fog {
  position: relative;
  background: linear-gradient(#22252a, #3a3f47);
  overflow: hidden;
}
.roycss-immersive-smoke-fog::before,
.roycss-immersive-smoke-fog::after {
  content: "";
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(circle at 20% 30%, rgba(220, 220, 230, 0.35), transparent 30%),
    radial-gradient(circle at 70% 60%, rgba(200, 200, 210, 0.3), transparent 35%),
    radial-gradient(circle at 50% 80%, rgba(180, 180, 200, 0.25), transparent 30%);
  filter: blur(18px);
  animation: roy-immersive-smoke-drift 18s ease-in-out infinite alternate;
  opacity: 0.7;
}
.roycss-immersive-smoke-fog::after {
  inset: -50%;
  background:
    radial-gradient(circle at 60% 20%, rgba(230, 230, 240, 0.3), transparent 40%),
    radial-gradient(circle at 30% 70%, rgba(190, 190, 210, 0.25), transparent 40%);
  animation-duration: 26s;
  animation-direction: alternate-reverse;
  opacity: 0.5;
}
@keyframes roy-immersive-smoke-drift {
  0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
  50%  { transform: translate3d(30px, -20px, 0) rotate(8deg); }
  100% { transform: translate3d(-20px, 25px, 0) rotate(-6deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-smoke-fog::before,
  .roycss-immersive-smoke-fog::after { animation: none; }
}`,
  },

  // 6. immersive-ocean-waves
  {
    id: "immersive-ocean-waves",
    name: "Ocean Waves",
    category: "immersive",
    description:
      "Three stacked wave layers ripple across a deep-blue gradient at staggered speeds",
    tags: ["immersive", "background", "ocean", "waves", "water"],
    previewType: "background",
    cssCode: `/* Immersive: Ocean Waves */
.roycss-immersive-ocean-waves {
  position: relative;
  background: linear-gradient(#0a3a5c 0%, #072a44 60%, #04192c 100%);
  overflow: hidden;
}
.roycss-immersive-ocean-waves::before,
.roycss-immersive-ocean-waves::after {
  content: "";
  position: absolute;
  left: -50%; right: -50%;
  bottom: 0;
  height: 45%;
  background:
    radial-gradient(circle at 25% 50%, rgba(150, 210, 240, 0.4) 0%, transparent 40%),
    radial-gradient(circle at 75% 50%, rgba(120, 190, 230, 0.4) 0%, transparent 40%);
  background-size: 200px 100px;
  background-repeat: repeat-x;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  animation: roy-immersive-wave-roll 12s linear infinite;
  opacity: 0.7;
}
.roycss-immersive-ocean-waves::after {
  height: 30%;
  background-size: 150px 80px;
  animation-duration: 8s;
  animation-direction: reverse;
  opacity: 0.55;
  filter: blur(1px);
}
@keyframes roy-immersive-wave-roll {
  from { background-position: 0 0; transform: translateX(0); }
  to   { background-position: 200px 0; transform: translateX(-50px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-ocean-waves::before,
  .roycss-immersive-ocean-waves::after { animation: none; }
}`,
  },

  // 7. immersive-matrix-rain
  {
    id: "immersive-matrix-rain",
    name: "Matrix Rain",
    category: "immersive",
    description:
      "Falling green character columns evoke the iconic Matrix digital rain",
    tags: ["immersive", "background", "matrix", "rain", "retro"],
    previewType: "background",
    cssCode: `/* Immersive: Matrix Rain */
.roycss-immersive-matrix-rain {
  position: relative;
  background: #000;
  overflow: hidden;
}
.roycss-immersive-matrix-rain::before,
.roycss-immersive-matrix-rain::after {
  content: "";
  position: absolute;
  inset: -10% 0 0 0;
  background-image:
    linear-gradient(180deg, transparent 0%, rgba(0, 255, 65, 0.05) 70%, rgba(0, 255, 65, 0.8) 95%, rgba(180, 255, 200, 0.9) 100%),
    repeating-linear-gradient(0deg, rgba(0, 255, 65, 0.7) 0 1px, transparent 1px 18px);
  background-size: 30px 100%, 30px 18px;
  background-repeat: repeat-x;
  animation: roy-immersive-matrix-fall 1.2s steps(8) infinite;
  mix-blend-mode: screen;
  opacity: 0.85;
}
.roycss-immersive-matrix-rain::after {
  background-size: 60px 100%, 60px 22px;
  animation-duration: 2s;
  animation-direction: reverse;
  opacity: 0.4;
  filter: blur(0.5px);
}
@keyframes roy-immersive-matrix-fall {
  from { background-position: 0 0, 0 0; }
  to   { background-position: 0 144px, 0 144px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-matrix-rain::before,
  .roycss-immersive-matrix-rain::after { animation: none; }
}`,
  },

  // 8. immersive-geometric-hex
  {
    id: "immersive-geometric-hex",
    name: "Hexagon Tessellation",
    category: "immersive",
    description:
      "Animated hexagon grid pulses with shifting gradient light across the surface",
    tags: ["immersive", "background", "hexagon", "geometric", "pattern"],
    previewType: "background",
    cssCode: `/* Immersive: Hexagon Tessellation */
.roycss-immersive-geometric-hex {
  position: relative;
  background: #0d1117;
  overflow: hidden;
}
.roycss-immersive-geometric-hex::before {
  content: "";
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(circle at 0 0, transparent 40%, rgba(56, 189, 248, 0.25) 41%, rgba(56, 189, 248, 0.25) 44%, transparent 45%),
    radial-gradient(circle at 60px 35px, transparent 40%, rgba(168, 85, 247, 0.25) 41%, rgba(168, 85, 247, 0.25) 44%, transparent 45%);
  background-size: 120px 70px, 120px 70px;
  animation: roy-immersive-hex-shift 16s linear infinite;
  opacity: 0.9;
}
.roycss-immersive-geometric-hex::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(34, 211, 238, 0.2), transparent 50%, rgba(236, 72, 153, 0.2));
  mix-blend-mode: overlay;
  animation: roy-immersive-hex-glow 8s ease-in-out infinite alternate;
}
@keyframes roy-immersive-hex-shift {
  from { background-position: 0 0, 0 0; }
  to   { background-position: 120px 70px, 120px 70px; }
}
@keyframes roy-immersive-hex-glow {
  from { opacity: 0.4; }
  to   { opacity: 0.9; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-geometric-hex::before,
  .roycss-immersive-geometric-hex::after { animation: none; }
}`,
  },

  // 9. immersive-topographic
  {
    id: "immersive-topographic",
    name: "Topographic Contours",
    category: "immersive",
    description:
      "Concentric contour lines flow across the surface like an animated topographic map",
    tags: ["immersive", "background", "topographic", "contour", "map"],
    previewType: "background",
    cssCode: `/* Immersive: Topographic Contours */
.roycss-immersive-topographic {
  position: relative;
  background: #0f1b14;
  overflow: hidden;
}
.roycss-immersive-topographic::before {
  content: "";
  position: absolute;
  inset: -20%;
  background:
    repeating-radial-gradient(circle at 30% 40%, rgba(134, 239, 172, 0.5) 0 1px, transparent 1px 14px),
    repeating-radial-gradient(circle at 70% 60%, rgba(94, 234, 212, 0.4) 0 1px, transparent 1px 20px),
    repeating-radial-gradient(circle at 50% 80%, rgba(168, 247, 196, 0.3) 0 1px, transparent 1px 26px);
  filter: blur(0.3px);
  animation: roy-immersive-topo-flow 30s linear infinite;
  opacity: 0.6;
}
.roycss-immersive-topographic::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.6) 100%);
}
@keyframes roy-immersive-topo-flow {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(-20px, 15px, 0) scale(1.05); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-topographic::before { animation: none; }
}`,
  },

  // 10. immersive-aurora-bg
  {
    id: "immersive-aurora-bg",
    name: "Aurora Borealis",
    category: "immersive",
    description:
      "Flowing bands of green and violet light ripple like the northern lights",
    tags: ["immersive", "background", "aurora", "northern-lights", "gradient"],
    previewType: "background",
    cssCode: `/* Immersive: Aurora Borealis */
.roycss-immersive-aurora-bg {
  position: relative;
  background: linear-gradient(#020617 0%, #0c1d3a 50%, #021024 100%);
  overflow: hidden;
}
.roycss-immersive-aurora-bg::before,
.roycss-immersive-aurora-bg::after {
  content: "";
  position: absolute;
  inset: -20% 0 30% 0;
  background:
    linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.55), rgba(168, 85, 247, 0.5), transparent),
    linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.4), transparent);
  filter: blur(40px);
  animation: roy-immersive-aurora-flow 14s ease-in-out infinite alternate;
  mix-blend-mode: screen;
  opacity: 0.7;
}
.roycss-immersive-aurora-bg::after {
  inset: -10% 0 50% 0;
  filter: blur(60px);
  animation-duration: 22s;
  animation-direction: alternate-reverse;
  opacity: 0.5;
}
@keyframes roy-immersive-aurora-flow {
  0%   { transform: translate3d(-10%, 0, 0) skewX(-12deg) scaleY(1); }
  50%  { transform: translate3d(10%, 20px, 0) skewX(8deg) scaleY(1.1); }
  100% { transform: translate3d(-5%, -10px, 0) skewX(-6deg) scaleY(0.95); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-aurora-bg::before,
  .roycss-immersive-aurora-bg::after { animation: none; }
}`,
  },

  // 11. immersive-nebula
  {
    id: "immersive-nebula",
    name: "Space Nebula",
    category: "immersive",
    description:
      "Colorful gas-cloud gradients swirl over a starfield to evoke a deep-space nebula",
    tags: ["immersive", "background", "nebula", "space", "cosmic"],
    previewType: "background",
    cssCode: `/* Immersive: Space Nebula */
.roycss-immersive-nebula {
  position: relative;
  background:
    radial-gradient(1px 1px at 50px 50px, #fff, transparent),
    radial-gradient(1px 1px at 150px 200px, #fff, transparent),
    radial-gradient(1px 1px at 250px 80px, #cfe, transparent),
    radial-gradient(2px 2px at 320px 320px, #fff, transparent),
    radial-gradient(1px 1px at 90px 280px, #ffd, transparent),
    #050414;
  background-size: 400px 400px, 400px 400px, 400px 400px, 400px 400px, 400px 400px, 100% 100%;
  background-repeat: repeat;
  overflow: hidden;
}
.roycss-immersive-nebula::before,
.roycss-immersive-nebula::after {
  content: "";
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(circle at 30% 40%, rgba(236, 72, 153, 0.55), transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(34, 211, 238, 0.45), transparent 40%),
    radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.4), transparent 40%);
  filter: blur(50px);
  mix-blend-mode: screen;
  animation: roy-immersive-nebula-swirl 24s ease-in-out infinite alternate;
  opacity: 0.85;
}
.roycss-immersive-nebula::after {
  animation-duration: 36s;
  animation-direction: alternate-reverse;
  opacity: 0.6;
}
@keyframes roy-immersive-nebula-swirl {
  0%   { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(20deg) scale(1.15); }
  100% { transform: rotate(-15deg) scale(0.95); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-nebula::before,
  .roycss-immersive-nebula::after { animation: none; }
}`,
  },

  // 12. immersive-underwater
  {
    id: "immersive-underwater",
    name: "Underwater Caustics",
    category: "immersive",
    description:
      "Animated light caustics ripple across a deep teal underwater backdrop",
    tags: ["immersive", "background", "underwater", "caustics", "water"],
    previewType: "background",
    cssCode: `/* Immersive: Underwater Caustics */
.roycss-immersive-underwater {
  position: relative;
  background: linear-gradient(#0d4a5c 0%, #072430 80%, #04161f 100%);
  overflow: hidden;
}
.roycss-immersive-underwater::before,
.roycss-immersive-underwater::after {
  content: "";
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(circle at 20% 30%, rgba(180, 240, 255, 0.4), transparent 25%),
    radial-gradient(circle at 80% 70%, rgba(140, 220, 250, 0.35), transparent 25%),
    radial-gradient(circle at 50% 50%, rgba(200, 250, 255, 0.3), transparent 30%);
  background-size: 200px 200px, 240px 240px, 300px 300px;
  background-repeat: repeat;
  filter: blur(2px);
  mix-blend-mode: screen;
  animation: roy-immersive-caustics 9s ease-in-out infinite alternate;
  opacity: 0.7;
}
.roycss-immersive-underwater::after {
  background-size: 300px 300px, 360px 360px, 400px 400px;
  animation-duration: 14s;
  animation-direction: alternate-reverse;
  opacity: 0.4;
  filter: blur(6px);
}
@keyframes roy-immersive-caustics {
  0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
  50%  { transform: translate3d(20px, -10px, 0) rotate(8deg); }
  100% { transform: translate3d(-15px, 15px, 0) rotate(-6deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-underwater::before,
  .roycss-immersive-underwater::after { animation: none; }
}`,
  },

  // 13. immersive-fireflies
  {
    id: "immersive-fireflies",
    name: "Glowing Fireflies",
    category: "immersive",
    description:
      "Tiny glowing dots flicker and drift like fireflies in a warm summer night",
    tags: ["immersive", "background", "fireflies", "glow", "particles"],
    previewType: "background",
    cssCode: `/* Immersive: Glowing Fireflies */
.roycss-immersive-fireflies {
  position: relative;
  background: linear-gradient(#0a1410 0%, #1a2a20 100%);
  overflow: hidden;
}
.roycss-immersive-fireflies::before,
.roycss-immersive-fireflies::after {
  content: "";
  position: absolute;
  inset: -10% 0 0 0;
  background-image:
    radial-gradient(2px 2px at 40px 60px, rgba(255, 245, 150, 1), transparent 70%),
    radial-gradient(2px 2px at 120px 200px, rgba(255, 235, 120, 1), transparent 70%),
    radial-gradient(3px 3px at 220px 120px, rgba(255, 250, 180, 1), transparent 70%),
    radial-gradient(2px 2px at 300px 250px, rgba(255, 240, 140, 1), transparent 70%),
    radial-gradient(2px 2px at 80px 320px, rgba(255, 245, 160, 1), transparent 70%),
    radial-gradient(3px 3px at 360px 80px, rgba(255, 255, 200, 1), transparent 70%);
  background-size: 400px 400px;
  background-repeat: repeat;
  animation: roy-immersive-fireflies-glow 4s ease-in-out infinite alternate,
             roy-immersive-fireflies-float 18s linear infinite;
  filter: blur(0.4px) drop-shadow(0 0 4px rgba(255, 240, 150, 0.8));
}
.roycss-immersive-fireflies::after {
  background-size: 600px 600px;
  animation-duration: 6s, 28s;
  animation-direction: alternate-reverse, normal;
  opacity: 0.6;
  filter: blur(1.2px) drop-shadow(0 0 8px rgba(255, 240, 150, 0.6));
}
@keyframes roy-immersive-fireflies-glow {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 1; }
}
@keyframes roy-immersive-fireflies-float {
  0%   { transform: translate3d(0, 0, 0); }
  50%  { transform: translate3d(30px, -40px, 0); }
  100% { transform: translate3d(-20px, 20px, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-fireflies::before,
  .roycss-immersive-fireflies::after { animation: none; }
}`,
  },

  // 14. immersive-cloud-drift
  {
    id: "immersive-cloud-drift",
    name: "Drifting Clouds",
    category: "immersive",
    description:
      "Soft cloud shapes drift horizontally across a calm sky gradient",
    tags: ["immersive", "background", "clouds", "sky", "weather"],
    previewType: "background",
    cssCode: `/* Immersive: Drifting Clouds */
.roycss-immersive-cloud-drift {
  position: relative;
  background: linear-gradient(#7cb9e8 0%, #c3e0f0 60%, #e8f4fb 100%);
  overflow: hidden;
}
.roycss-immersive-cloud-drift::before,
.roycss-immersive-cloud-drift::after {
  content: "";
  position: absolute;
  left: -30%; right: -30%;
  top: 15%;
  height: 50%;
  background:
    radial-gradient(ellipse at 30% 50%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.6) 20%, transparent 35%),
    radial-gradient(ellipse at 60% 60%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 25%, transparent 40%),
    radial-gradient(ellipse at 80% 40%, rgba(255, 255, 255, 0.85) 0%, transparent 30%);
  background-size: 320px 120px, 380px 140px, 280px 100px;
  background-repeat: repeat-x;
  filter: blur(4px);
  animation: roy-immersive-cloud-drift 40s linear infinite;
  opacity: 0.9;
}
.roycss-immersive-cloud-drift::after {
  top: 45%;
  height: 40%;
  filter: blur(8px);
  animation-duration: 70s;
  animation-direction: reverse;
  opacity: 0.5;
}
@keyframes roy-immersive-cloud-drift {
  from { transform: translateX(0); }
  to   { transform: translateX(-320px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-cloud-drift::before,
  .roycss-immersive-cloud-drift::after { animation: none; }
}`,
  },

  // 15. immersive-rain-bokeh
  {
    id: "immersive-rain-bokeh",
    name: "Rain Bokeh",
    category: "immersive",
    description:
      "Raindrops fall behind soft blurred bokeh circles on a moody nocturnal backdrop",
    tags: ["immersive", "background", "rain", "bokeh", "night"],
    previewType: "background",
    cssCode: `/* Immersive: Rain Bokeh */
.roycss-immersive-rain-bokeh {
  position: relative;
  background: linear-gradient(#0e1116 0%, #1a2533 100%);
  overflow: hidden;
}
.roycss-immersive-rain-bokeh::before {
  content: "";
  position: absolute;
  inset: -10% 0 0 0;
  background-image:
    linear-gradient(transparent 0%, rgba(200, 220, 255, 0.4) 50%, transparent 100%);
  background-size: 1px 60px;
  background-repeat: repeat;
  transform: skewX(-10deg);
  animation: roy-immersive-rb-fall 0.5s linear infinite;
  opacity: 0.55;
}
.roycss-immersive-rain-bokeh::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255, 220, 180, 0.35) 0%, transparent 8%),
    radial-gradient(circle at 75% 60%, rgba(180, 220, 255, 0.4) 0%, transparent 10%),
    radial-gradient(circle at 50% 80%, rgba(255, 180, 220, 0.3) 0%, transparent 7%),
    radial-gradient(circle at 90% 20%, rgba(200, 255, 220, 0.35) 0%, transparent 9%);
  background-size: 100% 100%;
  filter: blur(8px);
  animation: roy-immersive-rb-bokeh 6s ease-in-out infinite alternate;
}
@keyframes roy-immersive-rb-fall {
  from { background-position: 0 -60px; }
  to   { background-position: 0 120px; }
}
@keyframes roy-immersive-rb-bokeh {
  from { opacity: 0.5; transform: scale(1); }
  to   { opacity: 0.9; transform: scale(1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-rain-bokeh::before,
  .roycss-immersive-rain-bokeh::after { animation: none; }
}`,
  },

  // 16. immersive-lightning
  {
    id: "immersive-lightning",
    name: "Lightning Flash",
    category: "immersive",
    description:
      "Occasional lightning bolts flare across a stormy night sky with afterglow",
    tags: ["immersive", "background", "lightning", "storm", "flash"],
    previewType: "background",
    cssCode: `/* Immersive: Lightning Flash */
.roycss-immersive-lightning {
  position: relative;
  background: linear-gradient(#0a0e1a 0%, #1a2238 60%, #0a0e1a 100%);
  overflow: hidden;
}
.roycss-immersive-lightning::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(220, 235, 255, 0.9), transparent 50%);
  clip-path: polygon(48% 0, 52% 0, 54% 25%, 50% 30%, 56% 60%, 49% 65%, 53% 100%, 47% 100%, 44% 65%, 50% 60%, 42% 30%, 46% 25%);
  animation: roy-immersive-lightning-bolt 6s steps(1) infinite;
  opacity: 0;
  filter: drop-shadow(0 0 12px rgba(220, 235, 255, 0.9));
}
.roycss-immersive-lightning::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(200, 220, 255, 0.5);
  animation: roy-immersive-lightning-glow 6s steps(1) infinite;
  opacity: 0;
}
@keyframes roy-immersive-lightning-bolt {
  0%, 4%, 8%, 100% { opacity: 0; }
  5%               { opacity: 1; }
  6%               { opacity: 0; }
  7%               { opacity: 0.7; }
}
@keyframes roy-immersive-lightning-glow {
  0%, 4%, 8%, 100% { opacity: 0; }
  5%               { opacity: 0.6; }
  6%               { opacity: 0.2; }
  7%               { opacity: 0.4; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-lightning::before,
  .roycss-immersive-lightning::after { animation: none; }
}`,
  },

  // 17. immersive-dust-particles
  {
    id: "immersive-dust-particles",
    name: "Dust in Light Beam",
    category: "immersive",
    description:
      "Tiny dust motes drift through a diagonal sunbeam against a dark backdrop",
    tags: ["immersive", "background", "dust", "light", "particles"],
    previewType: "background",
    cssCode: `/* Immersive: Dust in Light Beam */
.roycss-immersive-dust-particles {
  position: relative;
  background: linear-gradient(#0a0a0a 0%, #1a1612 100%);
  overflow: hidden;
}
.roycss-immersive-dust-particles::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 230, 170, 0.18) 0%, rgba(255, 220, 150, 0.08) 30%, transparent 55%);
  filter: blur(2px);
}
.roycss-immersive-dust-particles::after {
  content: "";
  position: absolute;
  inset: -10% 0 0 0;
  background-image:
    radial-gradient(1px 1px at 40px 60px, rgba(255, 235, 180, 0.9), transparent 70%),
    radial-gradient(1px 1px at 120px 180px, rgba(255, 230, 170, 0.8), transparent 70%),
    radial-gradient(1px 1px at 220px 100px, rgba(255, 240, 200, 0.9), transparent 70%),
    radial-gradient(1px 1px at 300px 240px, rgba(255, 235, 180, 0.7), transparent 70%),
    radial-gradient(1px 1px at 80px 320px, rgba(255, 230, 170, 0.8), transparent 70%),
    radial-gradient(1px 1px at 360px 80px, rgba(255, 240, 200, 0.9), transparent 70%);
  background-size: 400px 400px;
  background-repeat: repeat;
  animation: roy-immersive-dust-float 22s linear infinite;
  opacity: 0.85;
}
@keyframes roy-immersive-dust-float {
  0%   { transform: translate3d(0, 0, 0); }
  50%  { transform: translate3d(20px, -30px, 0); }
  100% { transform: translate3d(-15px, 25px, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-dust-particles::after { animation: none; }
}`,
  },

  // 18. immersive-gradient-mesh-bg
  {
    id: "immersive-gradient-mesh-bg",
    name: "Animated Mesh Gradient",
    category: "immersive",
    description:
      "Four-color mesh gradient blobs slowly orbit each other to form a living backdrop",
    tags: ["immersive", "background", "gradient", "mesh", "colorful"],
    previewType: "background",
    cssCode: `/* Immersive: Animated Mesh Gradient */
.roycss-immersive-gradient-mesh-bg {
  position: relative;
  background: #0f0f1a;
  overflow: hidden;
}
.roycss-immersive-gradient-mesh-bg::before,
.roycss-immersive-gradient-mesh-bg::after {
  content: "";
  position: absolute;
  inset: -25%;
  background:
    radial-gradient(circle at 20% 20%, rgba(236, 72, 153, 0.7), transparent 35%),
    radial-gradient(circle at 80% 30%, rgba(34, 211, 238, 0.6), transparent 35%),
    radial-gradient(circle at 30% 80%, rgba(168, 85, 247, 0.6), transparent 35%),
    radial-gradient(circle at 70% 75%, rgba(251, 191, 36, 0.5), transparent 35%);
  filter: blur(40px);
  mix-blend-mode: screen;
  animation: roy-immersive-mesh-orbit 18s ease-in-out infinite alternate;
}
.roycss-immersive-gradient-mesh-bg::after {
  animation-duration: 26s;
  animation-direction: alternate-reverse;
  opacity: 0.6;
  filter: blur(60px);
}
@keyframes roy-immersive-mesh-orbit {
  0%   { transform: rotate(0deg) translateX(0) scale(1); }
  50%  { transform: rotate(180deg) translateX(20px) scale(1.1); }
  100% { transform: rotate(360deg) translateX(-15px) scale(0.95); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-gradient-mesh-bg::before,
  .roycss-immersive-gradient-mesh-bg::after { animation: none; }
}`,
  },

  // 19. immersive-confetti-bg
  {
    id: "immersive-confetti-bg",
    name: "Falling Confetti",
    category: "immersive",
    description:
      "Colorful confetti pieces rotate and fall across a festive backdrop",
    tags: ["immersive", "background", "confetti", "celebration", "party"],
    previewType: "background",
    cssCode: `/* Immersive: Falling Confetti */
.roycss-immersive-confetti-bg {
  position: relative;
  background: linear-gradient(#1a0d2e 0%, #2a1a4a 60%, #1a0d2e 100%);
  overflow: hidden;
}
.roycss-immersive-confetti-bg::before,
.roycss-immersive-confetti-bg::after {
  content: "";
  position: absolute;
  inset: -10% 0 0 0;
  background-image:
    linear-gradient(45deg, #f43f5e 0 8px, transparent 8px),
    linear-gradient(-45deg, #22d3ee 0 10px, transparent 10px),
    linear-gradient(90deg, #facc15 0 6px, transparent 6px),
    linear-gradient(0deg, #a855f7 0 12px, transparent 12px),
    linear-gradient(45deg, #34d399 0 7px, transparent 7px);
  background-size: 80px 80px, 120px 120px, 100px 100px, 90px 90px, 110px 110px;
  background-position: 0 0, 40px 60px, 80px 30px, 20px 90px, 60px 20px;
  background-repeat: repeat;
  animation: roy-immersive-confetti-fall 4s linear infinite;
  opacity: 0.85;
}
.roycss-immersive-confetti-bg::after {
  animation-duration: 6s;
  animation-direction: reverse;
  opacity: 0.55;
  filter: blur(0.4px);
}
@keyframes roy-immersive-confetti-fall {
  0%   { background-position: 0 0, 40px 60px, 80px 30px, 20px 90px, 60px 20px; transform: rotate(0deg); }
  100% { background-position: -80px 320px, 40px 380px, 80px 350px, 20px 410px, 60px 340px; transform: rotate(180deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-confetti-bg::before,
  .roycss-immersive-confetti-bg::after { animation: none; }
}`,
  },

  // 20. immersive-bubble-rise
  {
    id: "immersive-bubble-rise",
    name: "Rising Bubbles",
    category: "immersive",
    description:
      "Translucent bubbles rise from the bottom of an aquatic backdrop with sway",
    tags: ["immersive", "background", "bubbles", "water", "rise"],
    previewType: "background",
    cssCode: `/* Immersive: Rising Bubbles */
.roycss-immersive-bubble-rise {
  position: relative;
  background: linear-gradient(#0a4a6e 0%, #072e48 60%, #04192c 100%);
  overflow: hidden;
}
.roycss-immersive-bubble-rise::before,
.roycss-immersive-bubble-rise::after {
  content: "";
  position: absolute;
  left: 0; right: 0;
  bottom: -10%;
  height: 110%;
  background-image:
    radial-gradient(circle at 20px 80px, rgba(255, 255, 255, 0.5) 0 4px, transparent 5px),
    radial-gradient(circle at 90px 200px, rgba(255, 255, 255, 0.45) 0 6px, transparent 7px),
    radial-gradient(circle at 180px 320px, rgba(255, 255, 255, 0.55) 0 5px, transparent 6px),
    radial-gradient(circle at 260px 100px, rgba(255, 255, 255, 0.5) 0 7px, transparent 8px),
    radial-gradient(circle at 340px 280px, rgba(255, 255, 255, 0.4) 0 4px, transparent 5px);
  background-size: 400px 400px;
  background-repeat: repeat;
  animation: roy-immersive-bubble-rise 10s linear infinite;
  filter: blur(0.3px);
}
.roycss-immersive-bubble-rise::after {
  background-size: 600px 600px;
  animation-duration: 16s;
  animation-direction: reverse;
  opacity: 0.5;
  filter: blur(1.5px);
}
@keyframes roy-immersive-bubble-rise {
  0%   { transform: translate3d(0, 0, 0); }
  50%  { transform: translate3d(15px, -200px, 0); }
  100% { transform: translate3d(-10px, -400px, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-immersive-bubble-rise::before,
  .roycss-immersive-bubble-rise::after { animation: none; }
}`,
  },
];

export default effectsBatch40;
