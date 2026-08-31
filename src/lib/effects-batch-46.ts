import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 46 — Time & Nature Effects (20 effects)
 * Pure-CSS ambient nature and time-of-day effects: day-night skies, cloud
 * drift, sunrise gradients, plant growth, water reflections, fireflies,
 * seasonal theming, rain, snow, leaves, thunder, fog, spring bloom, ocean
 * tide, desert dunes, auroras, morning mist, rainbows, tornadoes, and
 * volcanic eruptions. All classes are prefixed `roycss-nature-` and keyframes
 * `roy-nature-`. Each effect honors prefers-reduced-motion.
 *
 * NOTE: This batch is not yet wired into `roycss-effects.ts` and uses the
 * future category `"nature"` (not yet in `EffectCategory`). The `as unknown
 * as CSSEffect[]` cast suppresses the type error until the category is
 * promoted into `EffectCategory` + `categoryMeta` + `categoryOrder` and the
 * batch is imported into the master effects array.
 */
export const effectsBatch46 = [
  // ═══════════════════════════════════════════════════════════════
  // TIME & NATURE (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. nature-day-night
  {
    id: "nature-day-night",
    name: "Day to Night",
    category: "backgrounds",
    description: "Background transitions from a blue day sky to a starry night",
    tags: ["nature", "day-night", "sky", "stars", "cycle"],
    previewType: "background",
    cssCode: `/* Nature: Day to Night */
.roycss-nature-day-night {
  position: relative;
  background: linear-gradient(180deg, oklch(0.7 0.15 240), oklch(0.55 0.18 220) 60%, oklch(0.45 0.12 200));
  border-radius: 12px;
  overflow: hidden;
  animation: roy-nature-day-night 12s ease-in-out infinite;
}
.roycss-nature-day-night::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 25% 30%, oklch(1 0 0 / 0.9) 0 1px, transparent 1.5px),
    radial-gradient(circle at 60% 50%, oklch(1 0 0 / 0.7) 0 1px, transparent 1.5px),
    radial-gradient(circle at 80% 20%, oklch(1 0 0 / 0.8) 0 1.5px, transparent 2px),
    radial-gradient(circle at 45% 70%, oklch(1 0 0 / 0.7) 0 1px, transparent 1.5px),
    radial-gradient(circle at 15% 80%, oklch(1 0 0 / 0.6) 0 1px, transparent 1.5px);
  background-size: 100% 100%;
  opacity: 0;
  animation: roy-nature-day-night-stars 12s ease-in-out infinite;
}
@keyframes roy-nature-day-night {
  0%, 100% { background: linear-gradient(180deg, oklch(0.7 0.15 240), oklch(0.55 0.18 220) 60%, oklch(0.45 0.12 200)); }
  50%      { background: linear-gradient(180deg, oklch(0.12 0.04 250), oklch(0.16 0.06 260) 50%, oklch(0.08 0.02 240)); }
}
@keyframes roy-nature-day-night-stars {
  0%, 100% { opacity: 0; }
  50%      { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-day-night,
  .roycss-nature-day-night::before { animation: none; }
}`,
  },

  // 2. nature-cloud-drift
  {
    id: "nature-cloud-drift",
    name: "Cloud Drift",
    category: "backgrounds",
    description: "Realistic cloud shapes drift slowly across a sky background",
    tags: ["nature", "cloud", "drift", "sky", "weather"],
    previewType: "background",
    cssCode: `/* Nature: Cloud Drift */
.roycss-nature-cloud-drift {
  position: relative;
  background: linear-gradient(180deg, oklch(0.65 0.12 230), oklch(0.85 0.05 220) 60%, oklch(0.78 0.04 200));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-cloud-drift::before,
.roycss-nature-cloud-drift::after {
  content: "";
  position: absolute;
  width: 60%; height: 30%;
  background:
    radial-gradient(ellipse 50% 100% at 30% 50%, oklch(1 0 0 / 0.95) 0 50%, transparent 70%),
    radial-gradient(ellipse 40% 90% at 60% 40%, oklch(1 0 0 / 0.9) 0 50%, transparent 70%),
    radial-gradient(ellipse 35% 80% at 80% 60%, oklch(1 0 0 / 0.85) 0 50%, transparent 70%);
  filter: blur(2px);
  top: 20%;
  left: -60%;
  animation: roy-nature-cloud-drift 18s linear infinite;
}
.roycss-nature-cloud-drift::after {
  width: 45%; height: 22%;
  top: 55%;
  opacity: 0.7;
  animation-duration: 26s;
  animation-delay: -8s;
}
@keyframes roy-nature-cloud-drift {
  0%   { left: -60%; }
  100% { left: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-cloud-drift::before,
  .roycss-nature-cloud-drift::after { animation: none; left: 10%; }
}`,
  },

  // 3. nature-sunrise-gradient
  {
    id: "nature-sunrise-gradient",
    name: "Sunrise Gradient",
    category: "backgrounds",
    description: "Animated sky gradient mimicking the warm hues of a sunrise",
    tags: ["nature", "sunrise", "sky", "gradient", "warm"],
    previewType: "background",
    cssCode: `/* Nature: Sunrise Gradient */
.roycss-nature-sunrise-gradient {
  background: linear-gradient(180deg,
    oklch(0.78 0.16 30) 0%,
    oklch(0.82 0.18 50) 25%,
    oklch(0.88 0.13 70) 50%,
    oklch(0.85 0.08 200) 75%,
    oklch(0.7 0.12 230) 100%);
  background-size: 100% 200%;
  border-radius: 12px;
  animation: roy-nature-sunrise-gradient 8s ease-in-out infinite;
}
@keyframes roy-nature-sunrise-gradient {
  0%, 100% { background-position: 0% 0%; }
  50%      { background-position: 0% 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-sunrise-gradient { animation: none; }
}`,
  },

  // 4. nature-plant-growth
  {
    id: "nature-plant-growth",
    name: "Plant Growth",
    category: "backgrounds",
    description: "Element grows upward like a sprouting plant from the bottom",
    tags: ["nature", "plant", "growth", "sprout", "organic"],
    previewType: "box",
    cssCode: `/* Nature: Plant Growth */
.roycss-nature-plant-growth {
  background: linear-gradient(180deg, oklch(0.7 0.16 140), oklch(0.55 0.18 150));
  border-radius: 14px 14px 8px 8px;
  transform-origin: bottom center;
  animation: roy-nature-plant-growth 2.4s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}
@keyframes roy-nature-plant-growth {
  0%   { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
  40%  { transform: scaleY(0.4); opacity: 0.6; }
  70%  { transform: scaleY(1.05); opacity: 1; }
  85%  { transform: scaleY(0.97); }
  100% { transform: scaleY(1); transform-origin: bottom; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-plant-growth { animation: none; transform: none; }
}`,
  },

  // 5. nature-water-reflection
  {
    id: "nature-water-reflection",
    name: "Water Reflection",
    category: "backgrounds",
    description: "Mirrored element below with subtle wave distortion on the surface",
    tags: ["nature", "water", "reflection", "mirror", "wave"],
    previewType: "box",
    cssCode: `/* Nature: Water Reflection */
.roycss-nature-water-reflection {
  position: relative;
  background: linear-gradient(180deg, oklch(0.7 0.12 220) 50%, oklch(0.4 0.1 240) 50%);
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-water-reflection::before {
  content: "";
  position: absolute;
  top: 50%; left: 0; right: 0; height: 50%;
  background: linear-gradient(180deg, oklch(0.85 0.08 220 / 0.4), oklch(0.3 0.1 240 / 0.6));
  filter: blur(0.5px);
  transform: scaleY(-1);
  opacity: 0.6;
}
.roycss-nature-water-reflection::after {
  content: "";
  position: absolute;
  top: 50%; left: 0; right: 0; height: 50%;
  background:
    repeating-linear-gradient(90deg, transparent 0 12px, oklch(1 0 0 / 0.12) 12px 14px);
  animation: roy-nature-water-reflection 4s linear infinite;
}
@keyframes roy-nature-water-reflection {
  0%   { background-position: 0 0; transform: scaleX(1); }
  50%  { transform: scaleX(1.02); }
  100% { background-position: 30px 0; transform: scaleX(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-water-reflection::after { animation: none; }
}`,
  },

  // 6. nature-firefly-ambient
  {
    id: "nature-firefly-ambient",
    name: "Firefly Ambient",
    category: "backgrounds",
    description: "Small dots randomly glow and float, simulating fireflies at dusk",
    tags: ["nature", "firefly", "ambient", "glow", "particles"],
    previewType: "background",
    cssCode: `/* Nature: Firefly Ambient */
.roycss-nature-firefly-ambient {
  position: relative;
  background: linear-gradient(180deg, oklch(0.1 0.05 250), oklch(0.18 0.08 280));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-firefly-ambient::before,
.roycss-nature-firefly-ambient::after {
  content: "";
  position: absolute;
  width: 100%; height: 100%;
  background:
    radial-gradient(circle at 15% 30%, oklch(0.9 0.18 100) 0 1.5px, transparent 2.5px),
    radial-gradient(circle at 70% 20%, oklch(0.9 0.18 100) 0 1px, transparent 2px),
    radial-gradient(circle at 40% 70%, oklch(0.9 0.18 100) 0 1.5px, transparent 2.5px),
    radial-gradient(circle at 85% 80%, oklch(0.9 0.18 100) 0 1px, transparent 2px),
    radial-gradient(circle at 25% 85%, oklch(0.9 0.18 100) 0 1.2px, transparent 2.2px),
    radial-gradient(circle at 60% 50%, oklch(0.9 0.18 100) 0 1px, transparent 2px);
  animation: roy-nature-firefly-glow 3s ease-in-out infinite alternate;
}
.roycss-nature-firefly-ambient::after {
  background:
    radial-gradient(circle at 35% 40%, oklch(0.95 0.16 90) 0 1px, transparent 2px),
    radial-gradient(circle at 80% 60%, oklch(0.95 0.16 90) 0 1.2px, transparent 2.2px),
    radial-gradient(circle at 20% 70%, oklch(0.95 0.16 90) 0 1px, transparent 2px),
    radial-gradient(circle at 55% 25%, oklch(0.95 0.16 90) 0 1.5px, transparent 2.5px);
  animation: roy-nature-firefly-float 6s ease-in-out infinite alternate;
}
@keyframes roy-nature-firefly-glow {
  0%   { opacity: 0.3; transform: translate(0, 0); }
  50%  { opacity: 1; }
  100% { opacity: 0.5; transform: translate(8px, -10px); }
}
@keyframes roy-nature-firefly-float {
  0%   { opacity: 0.4; transform: translate(0, 0); }
  100% { opacity: 0.9; transform: translate(-12px, 8px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-firefly-ambient::before,
  .roycss-nature-firefly-ambient::after { animation: none; opacity: 0.8; }
}`,
  },

  // 7. nature-seasons-switcher
  {
    id: "nature-seasons-switcher",
    name: "Seasons Switcher",
    category: "backgrounds",
    description: "Component cycles through spring, summer, autumn, and winter themes",
    tags: ["nature", "seasons", "spring", "summer", "autumn", "winter", "cycle"],
    previewType: "background",
    cssCode: `/* Nature: Seasons Switcher */
.roycss-nature-seasons-switcher {
  background: linear-gradient(135deg, oklch(0.78 0.13 140), oklch(0.65 0.12 160));
  background-size: 400% 400%;
  border-radius: 12px;
  animation: roy-nature-seasons-switcher 16s ease-in-out infinite;
}
@keyframes roy-nature-seasons-switcher {
  0%      { background: linear-gradient(135deg, oklch(0.78 0.13 140), oklch(0.65 0.12 160)); }
  25%     { background: linear-gradient(135deg, oklch(0.85 0.14 220), oklch(0.72 0.16 240)); }
  50%     { background: linear-gradient(135deg, oklch(0.7 0.16 40), oklch(0.55 0.18 30)); }
  75%     { background: linear-gradient(135deg, oklch(0.92 0.02 240), oklch(0.82 0.04 220)); }
  100%    { background: linear-gradient(135deg, oklch(0.78 0.13 140), oklch(0.65 0.12 160)); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-seasons-switcher { animation: none; }
}`,
  },

  // 8. nature-rain-drops
  {
    id: "nature-rain-drops",
    name: "Rain Drops",
    category: "backgrounds",
    description: "Rain drops falling on a surface with subtle streaking motion",
    tags: ["nature", "rain", "drops", "falling", "weather"],
    previewType: "background",
    cssCode: `/* Nature: Rain Drops */
.roycss-nature-rain-drops {
  position: relative;
  background: linear-gradient(180deg, oklch(0.4 0.06 240), oklch(0.3 0.06 250));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-rain-drops::before,
.roycss-nature-rain-drops::after {
  content: "";
  position: absolute;
  inset: -10% 0;
  background:
    repeating-linear-gradient(80deg, transparent 0 14px, oklch(0.8 0.04 220 / 0.45) 14px 15px, transparent 15px 28px),
    repeating-linear-gradient(80deg, transparent 0 36px, oklch(0.85 0.04 220 / 0.35) 36px 36.5px, transparent 36.5px 60px);
  background-size: 60px 60px, 80px 80px;
  animation: roy-nature-rain-drops 0.7s linear infinite;
}
.roycss-nature-rain-drops::after {
  background:
    repeating-linear-gradient(80deg, transparent 0 22px, oklch(0.85 0.04 220 / 0.4) 22px 22.5px, transparent 22.5px 44px);
  background-size: 70px 70px;
  animation-duration: 0.5s;
  animation-delay: -0.2s;
}
@keyframes roy-nature-rain-drops {
  0%   { transform: translateY(-60px); }
  100% { transform: translateY(60px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-rain-drops::before,
  .roycss-nature-rain-drops::after { animation: none; opacity: 0.3; }
}`,
  },

  // 9. nature-snow-falling
  {
    id: "nature-snow-falling",
    name: "Snow Falling",
    category: "backgrounds",
    description: "Gentle snowfall with multiple snowflake layers drifting down",
    tags: ["nature", "snow", "snowfall", "winter", "weather"],
    previewType: "background",
    cssCode: `/* Nature: Snow Falling */
.roycss-nature-snow-falling {
  position: relative;
  background: linear-gradient(180deg, oklch(0.7 0.04 230), oklch(0.85 0.02 220));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-snow-falling::before,
.roycss-nature-snow-falling::after {
  content: "";
  position: absolute;
  inset: -10% 0;
  background:
    radial-gradient(circle at 10% 0%, oklch(1 0 0 / 0.95) 0 2px, transparent 2.5px),
    radial-gradient(circle at 35% 0%, oklch(1 0 0 / 0.85) 0 1.5px, transparent 2px),
    radial-gradient(circle at 60% 0%, oklch(1 0 0 / 0.9) 0 2px, transparent 2.5px),
    radial-gradient(circle at 85% 0%, oklch(1 0 0 / 0.8) 0 1.5px, transparent 2px),
    radial-gradient(circle at 22% 0%, oklch(1 0 0 / 0.85) 0 1px, transparent 1.5px),
    radial-gradient(circle at 72% 0%, oklch(1 0 0 / 0.9) 0 1px, transparent 1.5px);
  background-size: 80px 80px, 100px 100px, 90px 90px, 110px 110px, 60px 60px, 70px 70px;
  background-repeat: repeat;
  animation: roy-nature-snow-falling 6s linear infinite;
}
.roycss-nature-snow-falling::after {
  background-size: 60px 60px, 80px 80px, 70px 70px, 90px 90px, 50px 50px, 60px 60px;
  animation-duration: 9s;
  animation-delay: -3s;
  opacity: 0.7;
}
@keyframes roy-nature-snow-falling {
  0%   { transform: translateY(-60px); background-position: 0 0; }
  100% { transform: translateY(60px); background-position: 14px 60px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-snow-falling::before,
  .roycss-nature-snow-falling::after { animation: none; opacity: 0.5; }
}`,
  },

  // 10. nature-autumn-leaves
  {
    id: "nature-autumn-leaves",
    name: "Autumn Leaves",
    category: "backgrounds",
    description: "Falling autumn leaves with swaying motion and warm colors",
    tags: ["nature", "autumn", "leaves", "fall", "season"],
    previewType: "background",
    cssCode: `/* Nature: Autumn Leaves */
.roycss-nature-autumn-leaves {
  position: relative;
  background: linear-gradient(180deg, oklch(0.7 0.08 60), oklch(0.55 0.1 40));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-autumn-leaves::before,
.roycss-nature-autumn-leaves::after {
  content: "";
  position: absolute;
  inset: -20% 0;
  background:
    radial-gradient(ellipse 8px 12px at 10% 0%, oklch(0.6 0.18 35) 0 6px, transparent 7px),
    radial-gradient(ellipse 6px 10px at 30% 0%, oklch(0.65 0.18 25) 0 5px, transparent 6px),
    radial-gradient(ellipse 10px 14px at 50% 0%, oklch(0.55 0.17 45) 0 7px, transparent 8px),
    radial-gradient(ellipse 7px 11px at 75% 0%, oklch(0.62 0.18 30) 0 6px, transparent 7px),
    radial-gradient(ellipse 9px 13px at 90% 0%, oklch(0.58 0.18 40) 0 7px, transparent 8px);
  background-size: 110px 110px, 130px 130px, 120px 120px, 100px 100px, 115px 115px;
  animation: roy-nature-autumn-leaves 7s linear infinite;
}
.roycss-nature-autumn-leaves::after {
  background-size: 90px 90px, 110px 110px, 100px 100px, 80px 80px, 95px 95px;
  animation-duration: 9s;
  animation-delay: -3s;
  opacity: 0.7;
}
@keyframes roy-nature-autumn-leaves {
  0%   { transform: translate(0, -80px) rotate(0deg); }
  50%  { transform: translate(20px, 30px) rotate(180deg); }
  100% { transform: translate(-10px, 80px) rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-autumn-leaves::before,
  .roycss-nature-autumn-leaves::after { animation: none; opacity: 0.5; }
}`,
  },

  // 11. nature-thunder-flash
  {
    id: "nature-thunder-flash",
    name: "Thunder Flash",
    category: "backgrounds",
    description: "Occasional lightning flash with brightening sky on a stormy backdrop",
    tags: ["nature", "thunder", "lightning", "flash", "storm"],
    previewType: "background",
    cssCode: `/* Nature: Thunder Flash */
.roycss-nature-thunder-flash {
  position: relative;
  background: linear-gradient(180deg, oklch(0.2 0.06 250), oklch(0.12 0.04 240));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-thunder-flash::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.85 0.04 220 / 0.9), transparent 60%);
  opacity: 0;
  animation: roy-nature-thunder-flash 4s ease-out infinite;
}
.roycss-nature-thunder-flash::after {
  content: "";
  position: absolute;
  top: 0; left: 50%;
  width: 2px; height: 60%;
  background: linear-gradient(180deg, oklch(0.95 0.02 220 / 0.9), transparent);
  transform: translateX(-50%) scaleY(0);
  transform-origin: top;
  animation: roy-nature-thunder-bolt 4s ease-out infinite;
  filter: drop-shadow(0 0 8px oklch(0.85 0.04 220 / 0.9));
}
@keyframes roy-nature-thunder-flash {
  0%, 88%, 92%, 100% { opacity: 0; }
  90%                { opacity: 1; }
  91%                { opacity: 0.4; }
}
@keyframes roy-nature-thunder-bolt {
  0%, 88%, 100% { transform: translateX(-50%) scaleY(0); }
  90%           { transform: translateX(-50%) scaleY(1); }
  92%           { transform: translateX(-50%) scaleY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-thunder-flash::before,
  .roycss-nature-thunder-flash::after { animation: none; opacity: 0; }
}`,
  },

  // 12. nature-fog-drift
  {
    id: "nature-fog-drift",
    name: "Fog Drift",
    category: "backgrounds",
    description: "Drifting fog layers that slowly move across the surface",
    tags: ["nature", "fog", "mist", "drift", "weather"],
    previewType: "background",
    cssCode: `/* Nature: Fog Drift */
.roycss-nature-fog-drift {
  position: relative;
  background: linear-gradient(180deg, oklch(0.55 0.05 220), oklch(0.45 0.06 240));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-fog-drift::before,
.roycss-nature-fog-drift::after {
  content: "";
  position: absolute;
  inset: -10% -20%;
  background:
    radial-gradient(ellipse 40% 25% at 30% 60%, oklch(0.85 0.02 220 / 0.4), transparent 70%),
    radial-gradient(ellipse 35% 22% at 70% 40%, oklch(0.85 0.02 220 / 0.45), transparent 70%),
    radial-gradient(ellipse 45% 28% at 50% 80%, oklch(0.85 0.02 220 / 0.4), transparent 70%);
  filter: blur(8px);
  animation: roy-nature-fog-drift 12s linear infinite;
}
.roycss-nature-fog-drift::after {
  animation-duration: 18s;
  animation-direction: reverse;
  opacity: 0.7;
}
@keyframes roy-nature-fog-drift {
  0%   { transform: translateX(-20%); }
  100% { transform: translateX(20%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-fog-drift::before,
  .roycss-nature-fog-drift::after { animation: none; opacity: 0.5; }
}`,
  },

  // 13. nature-spring-bloom
  {
    id: "nature-spring-bloom",
    name: "Spring Bloom",
    category: "backgrounds",
    description: "Flowers bloom into full petals with a soft scaling animation",
    tags: ["nature", "spring", "bloom", "flower", "petals"],
    previewType: "box",
    cssCode: `/* Nature: Spring Bloom */
.roycss-nature-spring-bloom {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.9 0.1 350), oklch(0.78 0.13 140));
  border-radius: 50%;
  animation: roy-nature-spring-bloom 2.4s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}
.roycss-nature-spring-bloom::before,
.roycss-nature-spring-bloom::after {
  content: "";
  position: absolute;
  inset: 20%;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.85 0.16 60), oklch(0.7 0.18 30));
  animation: roy-nature-spring-bloom-petals 2.4s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}
.roycss-nature-spring-bloom::after {
  inset: 35%;
  background: radial-gradient(circle, oklch(0.95 0.18 50), oklch(0.78 0.16 80));
  animation-delay: 200ms;
}
@keyframes roy-nature-spring-bloom {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); }
}
@keyframes roy-nature-spring-bloom-petals {
  0%   { transform: scale(0) rotate(0deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(40deg); opacity: 1; }
  100% { transform: scale(1) rotate(30deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-spring-bloom,
  .roycss-nature-spring-bloom::before,
  .roycss-nature-spring-bloom::after { animation: none; transform: none; }
}`,
  },

  // 14. nature-ocean-tide
  {
    id: "nature-ocean-tide",
    name: "Ocean Tide",
    category: "backgrounds",
    description: "Tide coming in and out with a wave cresting motion",
    tags: ["nature", "ocean", "tide", "wave", "water"],
    previewType: "background",
    cssCode: `/* Nature: Ocean Tide */
.roycss-nature-ocean-tide {
  position: relative;
  background: linear-gradient(180deg, oklch(0.7 0.14 220), oklch(0.4 0.12 240));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-ocean-tide::before,
.roycss-nature-ocean-tide::after {
  content: "";
  position: absolute;
  bottom: 0; left: -10%; right: -10%;
  height: 50%;
  background:
    radial-gradient(ellipse 30% 100% at 30% 100%, oklch(0.78 0.1 200 / 0.8), transparent 70%),
    radial-gradient(ellipse 35% 100% at 70% 100%, oklch(0.85 0.08 200 / 0.7), transparent 70%),
    linear-gradient(180deg, transparent, oklch(0.45 0.14 220 / 0.8));
  animation: roy-nature-ocean-tide 5s ease-in-out infinite;
}
.roycss-nature-ocean-tide::after {
  height: 35%;
  animation-duration: 7s;
  animation-delay: -2s;
  opacity: 0.7;
}
@keyframes roy-nature-ocean-tide {
  0%, 100% { transform: translateY(20%) scaleX(1); }
  50%      { transform: translateY(-8%) scaleX(1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-ocean-tide::before,
  .roycss-nature-ocean-tide::after { animation: none; }
}`,
  },

  // 15. nature-desert-dune
  {
    id: "nature-desert-dune",
    name: "Desert Dune",
    category: "backgrounds",
    description: "Sand dune shifting effect with warm gradient layers sliding",
    tags: ["nature", "desert", "dune", "sand", "warm"],
    previewType: "background",
    cssCode: `/* Nature: Desert Dune */
.roycss-nature-desert-dune {
  position: relative;
  background: linear-gradient(180deg, oklch(0.85 0.13 60), oklch(0.7 0.14 50) 50%, oklch(0.55 0.15 40));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-desert-dune::before,
.roycss-nature-desert-dune::after {
  content: "";
  position: absolute;
  bottom: 0; left: -10%; right: -10%;
  height: 50%;
  background:
    radial-gradient(ellipse 50% 100% at 50% 100%, oklch(0.6 0.16 40), transparent 70%),
    radial-gradient(ellipse 40% 100% at 80% 100%, oklch(0.55 0.16 35), transparent 70%);
  animation: roy-nature-desert-dune 8s ease-in-out infinite;
}
.roycss-nature-desert-dune::after {
  height: 35%;
  animation-duration: 12s;
  animation-delay: -3s;
  opacity: 0.6;
}
@keyframes roy-nature-desert-dune {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(-8%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-desert-dune::before,
  .roycss-nature-desert-dune::after { animation: none; }
}`,
  },

  // 16. nature-aurora-sky
  {
    id: "nature-aurora-sky",
    name: "Aurora Sky",
    category: "backgrounds",
    description: "Aurora borealis with shifting green and violet ribbons in the sky",
    tags: ["nature", "aurora", "borealis", "sky", "northern-lights"],
    previewType: "background",
    cssCode: `/* Nature: Aurora Sky */
.roycss-nature-aurora-sky {
  position: relative;
  background: linear-gradient(180deg, oklch(0.08 0.04 250), oklch(0.16 0.06 240));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-aurora-sky::before,
.roycss-nature-aurora-sky::after {
  content: "";
  position: absolute;
  inset: -20% -10%;
  background:
    radial-gradient(ellipse 50% 30% at 30% 30%, oklch(0.7 0.22 150 / 0.6), transparent 70%),
    radial-gradient(ellipse 40% 25% at 70% 50%, oklch(0.6 0.25 280 / 0.5), transparent 70%),
    radial-gradient(ellipse 45% 28% at 50% 70%, oklch(0.65 0.22 170 / 0.55), transparent 70%);
  filter: blur(12px);
  animation: roy-nature-aurora-sky 10s ease-in-out infinite;
}
.roycss-nature-aurora-sky::after {
  animation-duration: 14s;
  animation-direction: reverse;
  opacity: 0.7;
}
@keyframes roy-nature-aurora-sky {
  0%, 100% { transform: translate(0, 0) skewX(0deg); }
  50%      { transform: translate(8%, -4%) skewX(6deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-aurora-sky::before,
  .roycss-nature-aurora-sky::after { animation: none; opacity: 0.6; }
}`,
  },

  // 17. nature-mist-morning
  {
    id: "nature-mist-morning",
    name: "Morning Mist",
    category: "backgrounds",
    description: "Morning mist rising slowly with warm dawn light behind it",
    tags: ["nature", "mist", "morning", "dawn", "warm"],
    previewType: "background",
    cssCode: `/* Nature: Morning Mist */
.roycss-nature-mist-morning {
  position: relative;
  background: linear-gradient(180deg, oklch(0.85 0.1 60), oklch(0.7 0.08 80) 50%, oklch(0.55 0.06 200));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-mist-morning::before,
.roycss-nature-mist-morning::after {
  content: "";
  position: absolute;
  inset: -10% -20%;
  background:
    radial-gradient(ellipse 50% 20% at 30% 70%, oklch(0.95 0.02 60 / 0.55), transparent 70%),
    radial-gradient(ellipse 40% 18% at 70% 80%, oklch(0.92 0.04 80 / 0.5), transparent 70%),
    radial-gradient(ellipse 55% 22% at 50% 60%, oklch(0.9 0.03 60 / 0.45), transparent 70%);
  filter: blur(10px);
  animation: roy-nature-mist-morning 14s ease-in-out infinite;
}
.roycss-nature-mist-morning::after {
  animation-duration: 18s;
  animation-direction: reverse;
  opacity: 0.7;
}
@keyframes roy-nature-mist-morning {
  0%, 100% { transform: translateY(10%); }
  50%      { transform: translateY(-6%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-mist-morning::before,
  .roycss-nature-mist-morning::after { animation: none; }
}`,
  },

  // 18. nature-rainbow-arc
  {
    id: "nature-rainbow-arc",
    name: "Rainbow Arc",
    category: "backgrounds",
    description: "Rainbow arc appears on hover with a sweeping multi-color reveal",
    tags: ["nature", "rainbow", "arc", "color", "hover"],
    previewType: "box",
    cssCode: `/* Nature: Rainbow Arc */
.roycss-nature-rainbow-arc {
  position: relative;
  background: linear-gradient(180deg, oklch(0.75 0.1 220), oklch(0.6 0.12 240));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-rainbow-arc::before {
  content: "";
  position: absolute;
  bottom: 0; left: 50%;
  width: 0; height: 0;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  background:
    radial-gradient(ellipse at center,
      transparent 60%,
      oklch(0.7 0.25 0 / 0.7) 62% 66%,
      oklch(0.75 0.23 40 / 0.7) 66% 70%,
      oklch(0.78 0.22 80 / 0.7) 70% 74%,
      oklch(0.72 0.2 140 / 0.7) 74% 78%,
      oklch(0.7 0.22 200 / 0.7) 78% 82%,
      oklch(0.68 0.24 280 / 0.7) 82% 86%,
      oklch(0.65 0.22 320 / 0.7) 86% 90%,
      transparent 92%);
  transform: translateX(-50%) scale(0);
  transform-origin: bottom center;
  transition: transform 800ms cubic-bezier(0.34, 1.2, 0.64, 1);
  opacity: 0;
}
.roycss-nature-rainbow-arc:hover::before {
  width: 140%; height: 140%;
  transform: translateX(-50%) scale(1);
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-rainbow-arc:hover::before { transition: none; opacity: 1; transform: translateX(-50%) scale(1); width: 140%; height: 140%; }
}`,
  },

  // 19. nature-tornado-spin
  {
    id: "nature-tornado-spin",
    name: "Tornado Spin",
    category: "backgrounds",
    description: "Spinning vortex effect with rotating layers and a tapering shape",
    tags: ["nature", "tornado", "vortex", "spin", "storm"],
    previewType: "background",
    cssCode: `/* Nature: Tornado Spin */
.roycss-nature-tornado-spin {
  position: relative;
  background: linear-gradient(180deg, oklch(0.4 0.06 240), oklch(0.3 0.05 250));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-tornado-spin::before,
.roycss-nature-tornado-spin::after {
  content: "";
  position: absolute;
  top: 10%; left: 50%;
  width: 60%; height: 80%;
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      oklch(0.7 0.06 220 / 0.6) 0deg 12deg,
      transparent 12deg 30deg);
  clip-path: polygon(20% 0, 80% 0, 100% 100%, 0% 100%);
  transform: translateX(-50%);
  animation: roy-nature-tornado-spin 1.5s linear infinite;
  filter: blur(1px);
}
.roycss-nature-tornado-spin::after {
  width: 40%;
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      oklch(0.85 0.04 220 / 0.5) 0deg 15deg,
      transparent 15deg 30deg);
  animation-duration: 0.9s;
  animation-direction: reverse;
  opacity: 0.7;
}
@keyframes roy-nature-tornado-spin {
  0%   { transform: translateX(-50%) rotate(0deg); }
  100% { transform: translateX(-50%) rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-tornado-spin::before,
  .roycss-nature-tornado-spin::after { animation: none; opacity: 0.4; }
}`,
  },

  // 20. nature-volcano-erupt
  {
    id: "nature-volcano-erupt",
    name: "Volcano Erupt",
    category: "backgrounds",
    description: "Volcanic eruption with rising particles and a glowing crater",
    tags: ["nature", "volcano", "eruption", "lava", "particles"],
    previewType: "background",
    cssCode: `/* Nature: Volcano Erupt */
.roycss-nature-volcano-erupt {
  position: relative;
  background: linear-gradient(180deg, oklch(0.1 0.04 30), oklch(0.2 0.06 30) 50%, oklch(0.05 0.02 30));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-nature-volcano-erupt::before {
  content: "";
  position: absolute;
  bottom: 0; left: 50%;
  width: 40%; height: 30%;
  background: radial-gradient(ellipse at top, oklch(0.7 0.22 30), oklch(0.4 0.2 20));
  border-radius: 50% 50% 0 0;
  transform: translateX(-50%);
  box-shadow: 0 -8px 24px oklch(0.7 0.22 30 / 0.6);
}
.roycss-nature-volcano-erupt::after {
  content: "";
  position: absolute;
  bottom: 30%; left: 50%;
  width: 80%; height: 70%;
  background:
    radial-gradient(circle at 30% 100%, oklch(0.8 0.22 40) 0 3px, transparent 4px),
    radial-gradient(circle at 50% 90%, oklch(0.7 0.22 30) 0 4px, transparent 5px),
    radial-gradient(circle at 70% 95%, oklch(0.75 0.22 35) 0 3px, transparent 4px),
    radial-gradient(circle at 40% 80%, oklch(0.8 0.22 50) 0 2px, transparent 3px),
    radial-gradient(circle at 60% 75%, oklch(0.7 0.22 30) 0 2.5px, transparent 3.5px);
  background-size: 100% 100%;
  transform: translateX(-50%);
  animation: roy-nature-volcano-erupt 1.6s ease-out infinite;
  filter: drop-shadow(0 0 4px oklch(0.7 0.22 40 / 0.7));
}
@keyframes roy-nature-volcano-erupt {
  0%   { transform: translate(-50%, 0) scale(0.6); opacity: 0.9; }
  60%  { opacity: 1; }
  100% { transform: translate(-50%, -60%) scale(1.2); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nature-volcano-erupt::before,
  .roycss-nature-volcano-erupt::after { animation: none; }
  .roycss-nature-volcano-erupt::after { opacity: 0.5; }
}`,
  },
] as unknown as CSSEffect[];

export default effectsBatch46;
