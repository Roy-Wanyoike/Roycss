import type { CSSEffect } from "./roycss-types";

/**
 * Batch 14 — Seasonal / Holiday / Themed CSS Effects (40 effects)
 * - particles (10): seasonal particle systems (leaves, snow, rain, petals, fireworks, hearts, bubbles, sparks, pollen, meteors)
 * - backgrounds (10): themed scene backgrounds (Christmas tree, jack-o'-lantern, Easter egg, etc.)
 * - visual (10): themed object visuals (snowflake crystal, glowing pumpkin, witch hat, summer sun, etc.)
 * - animations (10): themed keyframe animations (sleigh fly, ghost wobble, pumpkin bounce, snowman build, etc.)
 *
 * All classes use `.roycss-{id}` prefix; all keyframes use `roy-b14-` prefix.
 * Verified zero ID/keyframe collisions with batches 1-13 (620 existing effects).
 */
export const effectsBatch14: CSSEffect[] = [
  /* =========================================================================
   * PARTICLES — SEASONAL PARTICLE SYSTEMS (10)
   * ========================================================================= */

  // 1. seasonal-falling-leaves
  {
    id: "seasonal-falling-leaves",
    name: "Falling Leaves",
    category: "particles",
    description:
      "Autumn leaves in warm reds, oranges, and browns falling and swaying with rotation over a dark forest floor",
    tags: ["autumn", "leaves", "fall", "seasonal"],
    previewType: "background",
    childCount: 6,
    cssCode: `/* Falling Leaves */
.roycss-seasonal-falling-leaves {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(to bottom, #4a2c2a 0%, #8b4513 60%, #3a1f12 100%);
}
.roycss-seasonal-falling-leaves span {
  position: absolute;
  top: -20px;
  width: 14px;
  height: 14px;
  background: #d97706;
  border-radius: 0 100% 0 100%;
  color: transparent;
  font-size: 0;
  animation: roy-b14-leaf-fall 5s linear infinite;
}
.roycss-seasonal-falling-leaves span:nth-child(1) { left: 8%;  animation-delay: 0s;   background: #dc2626; transform-origin: center; }
.roycss-seasonal-falling-leaves span:nth-child(2) { left: 28%; animation-delay: 0.8s; background: #f59e0b; }
.roycss-seasonal-falling-leaves span:nth-child(3) { left: 48%; animation-delay: 1.6s; background: #b45309; }
.roycss-seasonal-falling-leaves span:nth-child(4) { left: 68%; animation-delay: 2.4s; background: #dc2626; }
.roycss-seasonal-falling-leaves span:nth-child(5) { left: 85%; animation-delay: 3.2s; background: #f59e0b; }
.roycss-seasonal-falling-leaves span:nth-child(6) { left: 18%; animation-delay: 1.2s; background: #92400e; }
@keyframes roy-b14-leaf-fall {
  0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
  25%  { transform: translateY(60px) translateX(15px) rotate(180deg); }
  50%  { transform: translateY(120px) translateX(-10px) rotate(360deg); }
  75%  { transform: translateY(180px) translateX(20px) rotate(540deg); }
  100% { transform: translateY(240px) translateX(0) rotate(720deg); opacity: 0; }
}`,
  },

  // 2. seasonal-snowfall-gentle
  {
    id: "seasonal-snowfall-gentle",
    name: "Gentle Snowfall",
    category: "particles",
    description:
      "Soft white snowflakes of varying sizes drifting downward with subtle horizontal sway over a deep winter blue",
    tags: ["winter", "snow", "snowflakes", "cold"],
    previewType: "background",
    childCount: 8,
    cssCode: `/* Gentle Snowfall */
.roycss-seasonal-snowfall-gentle {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(to bottom, #1e3a5f 0%, #2c5282 50%, #1a365d 100%);
}
.roycss-seasonal-snowfall-gentle span {
  position: absolute;
  top: -10px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
  color: transparent;
  font-size: 0;
  animation: roy-b14-snow-drift 6s linear infinite;
}
.roycss-seasonal-snowfall-gentle span:nth-child(1) { left: 6%;  width: 8px; height: 8px; animation-delay: 0s;   animation-duration: 5s; }
.roycss-seasonal-snowfall-gentle span:nth-child(2) { left: 18%; width: 4px; height: 4px; animation-delay: 0.7s; animation-duration: 7s; }
.roycss-seasonal-snowfall-gentle span:nth-child(3) { left: 30%; width: 7px; height: 7px; animation-delay: 1.4s; animation-duration: 6s; }
.roycss-seasonal-snowfall-gentle span:nth-child(4) { left: 42%; width: 5px; height: 5px; animation-delay: 2.1s; animation-duration: 8s; }
.roycss-seasonal-snowfall-gentle span:nth-child(5) { left: 54%; width: 9px; height: 9px; animation-delay: 2.8s; animation-duration: 5.5s; }
.roycss-seasonal-snowfall-gentle span:nth-child(6) { left: 66%; width: 4px; height: 4px; animation-delay: 3.5s; animation-duration: 7.5s; }
.roycss-seasonal-snowfall-gentle span:nth-child(7) { left: 78%; width: 6px; height: 6px; animation-delay: 4.2s; animation-duration: 6.5s; }
.roycss-seasonal-snowfall-gentle span:nth-child(8) { left: 90%; width: 5px; height: 5px; animation-delay: 4.9s; animation-duration: 6s; }
@keyframes roy-b14-snow-drift {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  10%  { opacity: 1; }
  25%  { transform: translateY(60px) translateX(8px); }
  50%  { transform: translateY(120px) translateX(-6px); }
  75%  { transform: translateY(180px) translateX(10px); }
  90%  { opacity: 1; }
  100% { transform: translateY(240px) translateX(0); opacity: 0; }
}`,
  },

  // 3. seasonal-rain-spring
  {
    id: "seasonal-rain-spring",
    name: "Spring Rain Shower",
    category: "particles",
    description:
      "Thin diagonal raindrops falling at speed against a misty spring green sky",
    tags: ["spring", "rain", "shower", "drizzle"],
    previewType: "background",
    childCount: 10,
    cssCode: `/* Spring Rain Shower */
.roycss-seasonal-rain-spring {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(to bottom, #6b8e7b 0%, #4a6b5a 60%, #2d4a3d 100%);
}
.roycss-seasonal-rain-spring span {
  position: absolute;
  top: -30px;
  width: 2px;
  height: 14px;
  background: linear-gradient(to bottom, transparent, rgba(200, 220, 230, 0.85));
  border-radius: 1px;
  color: transparent;
  font-size: 0;
  animation: roy-b14-rain-drop 1.2s linear infinite;
}
.roycss-seasonal-rain-spring span:nth-child(1)  { left: 5%;  animation-delay: 0s;    animation-duration: 1s; }
.roycss-seasonal-rain-spring span:nth-child(2)  { left: 14%; animation-delay: 0.2s;  animation-duration: 1.3s; }
.roycss-seasonal-rain-spring span:nth-child(3)  { left: 23%; animation-delay: 0.5s;  animation-duration: 0.9s; }
.roycss-seasonal-rain-spring span:nth-child(4)  { left: 32%; animation-delay: 0.7s;  animation-duration: 1.1s; }
.roycss-seasonal-rain-spring span:nth-child(5)  { left: 41%; animation-delay: 0.1s;  animation-duration: 1.4s; }
.roycss-seasonal-rain-spring span:nth-child(6)  { left: 50%; animation-delay: 0.4s;  animation-duration: 1s; }
.roycss-seasonal-rain-spring span:nth-child(7)  { left: 59%; animation-delay: 0.6s;  animation-duration: 1.2s; }
.roycss-seasonal-rain-spring span:nth-child(8)  { left: 68%; animation-delay: 0.9s;  animation-duration: 0.95s; }
.roycss-seasonal-rain-spring span:nth-child(9)  { left: 77%; animation-delay: 0.3s;  animation-duration: 1.15s; }
.roycss-seasonal-rain-spring span:nth-child(10) { left: 86%; animation-delay: 0.8s;  animation-duration: 1.25s; }
@keyframes roy-b14-rain-drop {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(260px) translateX(-30px); opacity: 0; }
}`,
  },

  // 4. seasonal-petals-blossom
  {
    id: "seasonal-petals-blossom",
    name: "Cherry Blossom Petals",
    category: "particles",
    description:
      "Pink cherry blossom petals drifting diagonally with gentle rotation over a soft pink sky",
    tags: ["spring", "cherry", "blossom", "petals"],
    previewType: "background",
    childCount: 8,
    cssCode: `/* Cherry Blossom Petals */
.roycss-seasonal-petals-blossom {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(to bottom, #ffe4f0 0%, #ffc1d9 50%, #ff9ec5 100%);
}
.roycss-seasonal-petals-blossom span {
  position: absolute;
  top: -20px;
  width: 12px;
  height: 12px;
  background: #ff6fa5;
  border-radius: 150% 0 150% 0;
  color: transparent;
  font-size: 0;
  animation: roy-b14-petal-drift 6s linear infinite;
}
.roycss-seasonal-petals-blossom span:nth-child(1) { left: 5%;  animation-delay: 0s;   background: #ff8fb8; }
.roycss-seasonal-petals-blossom span:nth-child(2) { left: 20%; animation-delay: 0.8s; background: #ff6fa5; }
.roycss-seasonal-petals-blossom span:nth-child(3) { left: 35%; animation-delay: 1.6s; background: #ffb3d1; }
.roycss-seasonal-petals-blossom span:nth-child(4) { left: 50%; animation-delay: 2.4s; background: #ff5c93; }
.roycss-seasonal-petals-blossom span:nth-child(5) { left: 65%; animation-delay: 3.2s; background: #ff8fb8; }
.roycss-seasonal-petals-blossom span:nth-child(6) { left: 80%; animation-delay: 4s;   background: #ff6fa5; }
.roycss-seasonal-petals-blossom span:nth-child(7) { left: 12%; animation-delay: 4.8s; background: #ffb3d1; }
.roycss-seasonal-petals-blossom span:nth-child(8) { left: 72%; animation-delay: 5.4s; background: #ff5c93; }
@keyframes roy-b14-petal-drift {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  10%  { opacity: 1; }
  25%  { transform: translate(20px, 60px) rotate(90deg); }
  50%  { transform: translate(-10px, 120px) rotate(180deg); }
  75%  { transform: translate(25px, 180px) rotate(270deg); }
  90%  { opacity: 1; }
  100% { transform: translate(0, 240px) rotate(360deg); opacity: 0; }
}`,
  },

  // 5. seasonal-fireworks-newyear
  {
    id: "seasonal-fireworks-newyear",
    name: "New Year Fireworks",
    category: "particles",
    description:
      "Multi-colored firework sparks bursting outward from random points against a midnight black sky",
    tags: ["fireworks", "newyear", "celebration", "burst"],
    previewType: "background",
    childCount: 8,
    cssCode: `/* New Year Fireworks */
.roycss-seasonal-fireworks-newyear {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: radial-gradient(ellipse at center, #0a0a2e 0%, #000010 100%);
}
.roycss-seasonal-fireworks-newyear span {
  --tx: 0px;
  --ty: 0px;
  position: absolute;
  top: 40%;
  left: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  color: transparent;
  font-size: 0;
  animation: roy-b14-fw-burst 2s ease-out infinite;
}
.roycss-seasonal-fireworks-newyear span:nth-child(1) { --tx: 50px;  --ty: -50px; background: #fbbf24; box-shadow: 0 0 6px #fbbf24; animation-delay: 0s; }
.roycss-seasonal-fireworks-newyear span:nth-child(2) { --tx: -55px; --ty: -45px; background: #ef4444; box-shadow: 0 0 6px #ef4444; animation-delay: 0.1s; }
.roycss-seasonal-fireworks-newyear span:nth-child(3) { --tx: 60px;  --ty: 35px;  background: #10b981; box-shadow: 0 0 6px #10b981; animation-delay: 0.2s; }
.roycss-seasonal-fireworks-newyear span:nth-child(4) { --tx: -50px; --ty: 40px;  background: #3b82f6; box-shadow: 0 0 6px #3b82f6; animation-delay: 0.3s; }
.roycss-seasonal-fireworks-newyear span:nth-child(5) { --tx: 0px;   --ty: -65px; background: #ec4899; box-shadow: 0 0 6px #ec4899; animation-delay: 0.4s; }
.roycss-seasonal-fireworks-newyear span:nth-child(6) { --tx: 45px;  --ty: -20px; background: #8b5cf6; box-shadow: 0 0 6px #8b5cf6; animation-delay: 0.5s; }
.roycss-seasonal-fireworks-newyear span:nth-child(7) { --tx: -40px; --ty: -15px; background: #f97316; box-shadow: 0 0 6px #f97316; animation-delay: 0.6s; }
.roycss-seasonal-fireworks-newyear span:nth-child(8) { --tx: 35px;  --ty: 55px;  background: #06b6d4; box-shadow: 0 0 6px #06b6d4; animation-delay: 0.7s; }
@keyframes roy-b14-fw-burst {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  60%  { opacity: 1; }
  100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.4); opacity: 0; }
}`,
  },

  // 6. seasonal-hearts-valentine
  {
    id: "seasonal-hearts-valentine",
    name: "Valentine Hearts",
    category: "particles",
    description:
      "Floating red and pink hearts rising upward with gentle sway against a soft rose background",
    tags: ["valentine", "hearts", "love", "romance"],
    previewType: "background",
    childCount: 8,
    cssCode: `/* Valentine Hearts */
.roycss-seasonal-hearts-valentine {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(to bottom, #ffd6e0 0%, #ffb3c6 60%, #ff8aa8 100%);
}
.roycss-seasonal-hearts-valentine span {
  position: absolute;
  bottom: -25px;
  width: 14px;
  height: 14px;
  background: #e11d48;
  color: transparent;
  font-size: 0;
  transform: rotate(-45deg);
  animation: roy-b14-heart-rise 5s ease-in infinite;
}
.roycss-seasonal-hearts-valentine span::before,
.roycss-seasonal-hearts-valentine span::after {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: inherit;
}
.roycss-seasonal-hearts-valentine span::before { top: -7px; left: 0; }
.roycss-seasonal-hearts-valentine span::after  { left: 7px;  top: 0; }
.roycss-seasonal-hearts-valentine span:nth-child(1) { left: 8%;  animation-delay: 0s;   background: #e11d48; }
.roycss-seasonal-hearts-valentine span:nth-child(2) { left: 22%; animation-delay: 0.6s; background: #f43f5e; transform: rotate(-45deg) scale(0.8); }
.roycss-seasonal-hearts-valentine span:nth-child(3) { left: 36%; animation-delay: 1.2s; background: #ec4899; }
.roycss-seasonal-hearts-valentine span:nth-child(4) { left: 50%; animation-delay: 1.8s; background: #e11d48; transform: rotate(-45deg) scale(1.1); }
.roycss-seasonal-hearts-valentine span:nth-child(5) { left: 62%; animation-delay: 2.4s; background: #f43f5e; }
.roycss-seasonal-hearts-valentine span:nth-child(6) { left: 74%; animation-delay: 3s;   background: #ec4899; transform: rotate(-45deg) scale(0.9); }
.roycss-seasonal-hearts-valentine span:nth-child(7) { left: 86%; animation-delay: 3.6s; background: #e11d48; }
.roycss-seasonal-hearts-valentine span:nth-child(8) { left: 16%; animation-delay: 4.2s; background: #f43f5e; transform: rotate(-45deg) scale(1); }
@keyframes roy-b14-heart-rise {
  0%   { transform: translateY(0) rotate(-45deg) scale(1); opacity: 0; }
  10%  { opacity: 1; }
  50%  { transform: translateY(-120px) rotate(-45deg) translateX(15px) scale(1.1); }
  90%  { opacity: 1; }
  100% { transform: translateY(-240px) rotate(-45deg) translateX(-10px) scale(0.5); opacity: 0; }
}`,
  },

  // 7. seasonal-bubbles-summer
  {
    id: "seasonal-bubbles-summer",
    name: "Summer Bubbles",
    category: "particles",
    description:
      "Translucent soap bubbles of varying sizes rising upward with a wobble over a sunny summer sky",
    tags: ["summer", "bubbles", "soap", "play"],
    previewType: "background",
    childCount: 8,
    cssCode: `/* Summer Bubbles */
.roycss-seasonal-bubbles-summer {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(to bottom, #87ceeb 0%, #4fc3f7 50%, #29b6f6 100%);
}
.roycss-seasonal-bubbles-summer span {
  position: absolute;
  bottom: -20px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.2) 50%, rgba(150,200,255,0.1));
  border: 1px solid rgba(255, 255, 255, 0.6);
  color: transparent;
  font-size: 0;
  animation: roy-b14-bubble-rise 6s ease-in infinite;
}
.roycss-seasonal-bubbles-summer span:nth-child(1) { left: 8%;  width: 18px; height: 18px; animation-delay: 0s; }
.roycss-seasonal-bubbles-summer span:nth-child(2) { left: 20%; width: 10px; height: 10px; animation-delay: 0.7s; }
.roycss-seasonal-bubbles-summer span:nth-child(3) { left: 32%; width: 16px; height: 16px; animation-delay: 1.4s; }
.roycss-seasonal-bubbles-summer span:nth-child(4) { left: 44%; width: 8px;  height: 8px;  animation-delay: 2.1s; }
.roycss-seasonal-bubbles-summer span:nth-child(5) { left: 56%; width: 20px; height: 20px; animation-delay: 2.8s; }
.roycss-seasonal-bubbles-summer span:nth-child(6) { left: 68%; width: 12px; height: 12px; animation-delay: 3.5s; }
.roycss-seasonal-bubbles-summer span:nth-child(7) { left: 80%; width: 14px; height: 14px; animation-delay: 4.2s; }
.roycss-seasonal-bubbles-summer span:nth-child(8) { left: 92%; width: 9px;  height: 9px;  animation-delay: 4.9s; }
@keyframes roy-b14-bubble-rise {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  10%  { opacity: 1; }
  25%  { transform: translateY(-60px) translateX(8px); }
  50%  { transform: translateY(-120px) translateX(-6px); }
  75%  { transform: translateY(-180px) translateX(10px); }
  90%  { opacity: 1; }
  100% { transform: translateY(-240px) translateX(0); opacity: 0; }
}`,
  },

  // 8. seasonal-sparks-diwali
  {
    id: "seasonal-sparks-diwali",
    name: "Diwali Sparks",
    category: "particles",
    description:
      "Golden sparkler sparks shooting outward and falling like a Diwali sparkler against a dark festive night",
    tags: ["diwali", "sparks", "sparkler", "festival"],
    previewType: "background",
    childCount: 10,
    cssCode: `/* Diwali Sparks */
.roycss-seasonal-sparks-diwali {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: radial-gradient(ellipse at 50% 80%, #4a2c0a 0%, #1a0d04 50%, #000000 100%);
}
.roycss-seasonal-sparks-diwali span {
  --tx: 0px;
  --ty: 0px;
  position: absolute;
  bottom: 30%;
  left: 50%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 6px #fbbf24, 0 0 12px #f59e0b;
  color: transparent;
  font-size: 0;
  animation: roy-b14-spark-fly 1.5s ease-out infinite;
}
.roycss-seasonal-sparks-diwali span:nth-child(1)  { --tx: 30px;  --ty: -55px; animation-delay: 0s; }
.roycss-seasonal-sparks-diwali span:nth-child(2)  { --tx: -35px; --ty: -50px; animation-delay: 0.1s; }
.roycss-seasonal-sparks-diwali span:nth-child(3)  { --tx: 45px;  --ty: -30px; animation-delay: 0.2s; }
.roycss-seasonal-sparks-diwali span:nth-child(4)  { --tx: -45px; --ty: -35px; animation-delay: 0.3s; }
.roycss-seasonal-sparks-diwali span:nth-child(5)  { --tx: 55px;  --ty: -10px; animation-delay: 0.4s; }
.roycss-seasonal-sparks-diwali span:nth-child(6)  { --tx: -50px; --ty: -15px; animation-delay: 0.5s; }
.roycss-seasonal-sparks-diwali span:nth-child(7)  { --tx: 35px;  --ty: 20px;  animation-delay: 0.6s; }
.roycss-seasonal-sparks-diwali span:nth-child(8)  { --tx: -40px; --ty: 25px;  animation-delay: 0.7s; }
.roycss-seasonal-sparks-diwali span:nth-child(9)  { --tx: 0px;   --ty: -60px; animation-delay: 0.8s; }
.roycss-seasonal-sparks-diwali span:nth-child(10) { --tx: 0px;   --ty: 30px;  animation-delay: 0.9s; }
@keyframes roy-b14-spark-fly {
  0%   { transform: translate(-50%, 0) scale(1); opacity: 1; }
  70%  { opacity: 1; }
  100% { transform: translate(calc(-50% + var(--tx)), var(--ty)) scale(0.2); opacity: 0; }
}`,
  },

  // 9. seasonal-pollen-spring
  {
    id: "seasonal-pollen-spring",
    name: "Spring Pollen Dust",
    category: "particles",
    description:
      "Tiny golden pollen specks floating horizontally with a slow vertical drift in warm spring air",
    tags: ["spring", "pollen", "dust", "floating"],
    previewType: "background",
    childCount: 10,
    cssCode: `/* Spring Pollen Dust */
.roycss-seasonal-pollen-spring {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(to bottom, #fef9c3 0%, #fde68a 50%, #fcd34d 100%);
}
.roycss-seasonal-pollen-spring span {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #facc15;
  box-shadow: 0 0 3px rgba(250, 204, 21, 0.7);
  color: transparent;
  font-size: 0;
  animation: roy-b14-pollen-float 8s ease-in-out infinite;
}
.roycss-seasonal-pollen-spring span:nth-child(1)  { top: 20%; left: -10px; animation-delay: 0s; }
.roycss-seasonal-pollen-spring span:nth-child(2)  { top: 35%; left: -10px; animation-delay: 0.8s; }
.roycss-seasonal-pollen-spring span:nth-child(3)  { top: 50%; left: -10px; animation-delay: 1.6s; }
.roycss-seasonal-pollen-spring span:nth-child(4)  { top: 65%; left: -10px; animation-delay: 2.4s; }
.roycss-seasonal-pollen-spring span:nth-child(5)  { top: 25%; left: -10px; animation-delay: 3.2s; }
.roycss-seasonal-pollen-spring span:nth-child(6)  { top: 45%; left: -10px; animation-delay: 4s; }
.roycss-seasonal-pollen-spring span:nth-child(7)  { top: 75%; left: -10px; animation-delay: 4.8s; }
.roycss-seasonal-pollen-spring span:nth-child(8)  { top: 15%; left: -10px; animation-delay: 5.6s; }
.roycss-seasonal-pollen-spring span:nth-child(9)  { top: 55%; left: -10px; animation-delay: 6.4s; }
.roycss-seasonal-pollen-spring span:nth-child(10) { top: 80%; left: -10px; animation-delay: 7.2s; }
@keyframes roy-b14-pollen-float {
  0%   { transform: translate(0, 0); opacity: 0; }
  10%  { opacity: 0.9; }
  25%  { transform: translate(60px, -10px); }
  50%  { transform: translate(120px, 15px); }
  75%  { transform: translate(180px, -8px); }
  90%  { opacity: 0.9; }
  100% { transform: translate(260px, 5px); opacity: 0; }
}`,
  },

  // 10. seasonal-meteor-shower
  {
    id: "seasonal-meteor-shower",
    name: "Meteor Shower",
    category: "particles",
    description:
      "Bright meteor streaks with glowing tails racing diagonally across a deep starry night sky",
    tags: ["meteor", "shooting-star", "night", "space"],
    previewType: "background",
    childCount: 6,
    cssCode: `/* Meteor Shower */
.roycss-seasonal-meteor-shower {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background:
    radial-gradient(1px 1px at 20% 30%, #ffffff, transparent),
    radial-gradient(1px 1px at 60% 70%, #ffffff, transparent),
    radial-gradient(1px 1px at 80% 20%, #ffffff, transparent),
    radial-gradient(1px 1px at 30% 80%, #ffffff, transparent),
    radial-gradient(1px 1px at 90% 50%, #ffffff, transparent),
    linear-gradient(to bottom, #0b1026 0%, #1a1a3e 50%, #050518 100%);
}
.roycss-seasonal-meteor-shower span {
  position: absolute;
  top: -20px;
  left: -50px;
  width: 3px;
  height: 3px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 6px #ffffff;
  color: transparent;
  font-size: 0;
  animation: roy-b14-meteor-streak 3s linear infinite;
}
.roycss-seasonal-meteor-shower span::before {
  content: "";
  position: absolute;
  top: 1px;
  right: 0;
  width: 60px;
  height: 1px;
  background: linear-gradient(to left, #ffffff, transparent);
  transform-origin: right center;
}
.roycss-seasonal-meteor-shower span:nth-child(1) { top: 5%;  animation-delay: 0s;   animation-duration: 2.5s; }
.roycss-seasonal-meteor-shower span:nth-child(2) { top: 20%; animation-delay: 0.8s; animation-duration: 3s; }
.roycss-seasonal-meteor-shower span:nth-child(3) { top: 40%; animation-delay: 1.6s; animation-duration: 2.8s; }
.roycss-seasonal-meteor-shower span:nth-child(4) { top: 60%; animation-delay: 2.4s; animation-duration: 3.2s; }
.roycss-seasonal-meteor-shower span:nth-child(5) { top: 80%; animation-delay: 3.2s; animation-duration: 2.6s; }
.roycss-seasonal-meteor-shower span:nth-child(6) { top: 15%; animation-delay: 4s;   animation-duration: 3.4s; }
@keyframes roy-b14-meteor-streak {
  0%   { transform: translate(0, 0); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translate(360px, 240px); opacity: 0; }
}`,
  },

  /* =========================================================================
   * BACKGROUNDS — THEMED SCENE BACKGROUNDS (10)
   * ========================================================================= */

  // 11. seasonal-christmas-tree
  {
    id: "seasonal-christmas-tree",
    name: "Christmas Tree Scene",
    category: "backgrounds",
    description:
      "Pure-CSS Christmas tree with layered triangular tiers, glowing colored lights, and a star topper on a snowy night",
    tags: ["christmas", "tree", "lights", "winter"],
    previewType: "background",
    cssCode: `/* Christmas Tree Scene */
.roycss-seasonal-christmas-tree {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, #0d1b3a 0%, #1a2e52 50%, #2a3e6e 100%);
}
.roycss-seasonal-christmas-tree::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 25%;
  background: linear-gradient(to top, #ffffff 0%, #e0e7ff 60%, transparent 100%);
  border-radius: 50% 50% 0 0 / 30% 30% 0 0;
}
.roycss-seasonal-christmas-tree::after {
  content: "";
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 80px solid transparent;
  border-right: 80px solid transparent;
  border-bottom: 200px solid #15803d;
  box-shadow:
    0 -60px 0 -20px #16a34a,
    0 -120px 0 -45px #22c55e;
  background:
    radial-gradient(circle at 40% 30%, #fbbf24 4px, transparent 5px),
    radial-gradient(circle at 60% 50%, #ef4444 4px, transparent 5px),
    radial-gradient(circle at 30% 70%, #3b82f6 4px, transparent 5px),
    radial-gradient(circle at 70% 80%, #ec4899 4px, transparent 5px);
}
.roycss-seasonal-christmas-tree > .star {
  position: absolute;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: #fbbf24;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  filter: drop-shadow(0 0 8px #fbbf24);
}`,
  },

  // 12. seasonal-pumpkin-jackolantern
  {
    id: "seasonal-pumpkin-jackolantern",
    name: "Jack-o'-Lantern",
    category: "backgrounds",
    description:
      "Halloween jack-o'-lantern with carved glowing eyes and mouth over a dark spooky backdrop",
    tags: ["halloween", "pumpkin", "jack-o-lantern", "spooky"],
    previewType: "background",
    cssCode: `/* Jack-o'-Lantern */
.roycss-seasonal-pumpkin-jackolantern {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #2d1b3d 0%, #0a0510 80%);
}
.roycss-seasonal-pumpkin-jackolantern::before {
  content: "";
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  height: 140px;
  background:
    radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.4) 0%, transparent 35%),
    radial-gradient(ellipse at 70% 50%, rgba(0,0,0,0.4) 0%, transparent 35%),
    linear-gradient(to right, #b45309 0%, #ea580c 30%, #f97316 50%, #ea580c 70%, #b45309 100%);
  border-radius: 50% 50% 45% 45% / 55% 55% 45% 45%;
  box-shadow: 0 0 60px rgba(249, 115, 22, 0.5);
}
.roycss-seasonal-pumpkin-jackolantern::after {
  content: "";
  position: absolute;
  bottom: 18%;
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 100px;
  background:
    radial-gradient(ellipse at 25% 30%, #fbbf24 0%, #fbbf24 12px, transparent 13px),
    radial-gradient(ellipse at 75% 30%, #fbbf24 0%, #fbbf24 12px, transparent 13px),
    radial-gradient(ellipse at 50% 70%, #fbbf24 0%, #fbbf24 25px, transparent 26px);
  filter: drop-shadow(0 0 8px #fbbf24);
}`,
  },

  // 13. seasonal-easter-egg
  {
    id: "seasonal-easter-egg",
    name: "Easter Egg Pattern",
    category: "backgrounds",
    description:
      "Colorful Easter egg pattern with zig-zag and polka dot decorations on a soft pastel background",
    tags: ["easter", "egg", "pastel", "pattern"],
    previewType: "background",
    cssCode: `/* Easter Egg Pattern */
.roycss-seasonal-easter-egg {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse 30px 40px at 20% 30%, #fbcfe8 0%, #fbcfe8 70%, transparent 71%),
    radial-gradient(ellipse 30px 40px at 70% 60%, #bbf7d0 0%, #bbf7d0 70%, transparent 71%),
    radial-gradient(ellipse 30px 40px at 40% 80%, #bfdbfe 0%, #bfdbfe 70%, transparent 71%),
    radial-gradient(ellipse 30px 40px at 90% 25%, #fef08a 0%, #fef08a 70%, transparent 71%),
    radial-gradient(ellipse 30px 40px at 10% 70%, #ddd6fe 0%, #ddd6fe 70%, transparent 71%),
    linear-gradient(135deg, #fef3f8 0%, #f0fdf4 50%, #eff6ff 100%);
  background-size: 180px 180px;
}
.roycss-seasonal-easter-egg::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(45deg, transparent 0px, transparent 6px, rgba(236, 72, 153, 0.15) 6px, rgba(236, 72, 153, 0.15) 8px),
    repeating-linear-gradient(-45deg, transparent 0px, transparent 6px, rgba(59, 130, 246, 0.15) 6px, rgba(59, 130, 246, 0.15) 8px);
}
.roycss-seasonal-easter-egg::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 3px at 25% 25%, rgba(255,255,255,0.6), transparent),
    radial-gradient(circle 3px at 75% 75%, rgba(255,255,255,0.6), transparent),
    radial-gradient(circle 3px at 50% 50%, rgba(255,255,255,0.6), transparent);
  background-size: 90px 90px;
}`,
  },

  // 14. seasonal-heart-valentine
  {
    id: "seasonal-heart-valentine",
    name: "Valentine Heart Pattern",
    category: "backgrounds",
    description:
      "Repeating heart pattern in shades of red and pink on a soft romantic rose background",
    tags: ["valentine", "heart", "pattern", "love"],
    previewType: "background",
    cssCode: `/* Valentine Heart Pattern */
.roycss-seasonal-heart-valentine {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 25% 25%, #e11d48 6px, transparent 7px),
    radial-gradient(circle at 75% 75%, #e11d48 6px, transparent 7px),
    radial-gradient(circle at 75% 25%, #ec4899 5px, transparent 6px),
    radial-gradient(circle at 25% 75%, #ec4899 5px, transparent 6px),
    linear-gradient(135deg, #fff1f5 0%, #ffe4ec 50%, #ffd1de 100%);
  background-size: 80px 80px;
}
.roycss-seasonal-heart-valentine::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, #be123c 8px, transparent 9px);
  background-size: 80px 80px;
  background-position: 40px 40px;
}
.roycss-seasonal-heart-valentine::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(45deg, transparent 0px, transparent 40px, rgba(225, 29, 72, 0.05) 40px, rgba(225, 29, 72, 0.05) 42px);
}`,
  },

  // 15. seasonal-firework-sky
  {
    id: "seasonal-firework-sky",
    name: "Firework Night Sky",
    category: "backgrounds",
    description:
      "Deep night sky filled with multiple firework blooms in various colors and tiny scattered stars",
    tags: ["fireworks", "night", "sky", "celebration"],
    previewType: "background",
    cssCode: `/* Firework Night Sky */
.roycss-seasonal-firework-sky {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(1px 1px at 10% 20%, #ffffff, transparent),
    radial-gradient(1px 1px at 25% 60%, #ffffff, transparent),
    radial-gradient(1px 1px at 50% 25%, #ffffff, transparent),
    radial-gradient(1px 1px at 75% 70%, #ffffff, transparent),
    radial-gradient(1px 1px at 90% 35%, #ffffff, transparent),
    radial-gradient(1px 1px at 35% 85%, #ffffff, transparent),
    radial-gradient(1px 1px at 60% 90%, #ffffff, transparent),
    radial-gradient(circle at 22% 35%, rgba(251, 191, 36, 0.5) 0%, transparent 8%),
    radial-gradient(circle at 75% 30%, rgba(239, 68, 68, 0.5) 0%, transparent 8%),
    radial-gradient(circle at 50% 55%, rgba(16, 185, 129, 0.5) 0%, transparent 8%),
    radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.5) 0%, transparent 8%),
    radial-gradient(circle at 85% 75%, rgba(236, 72, 153, 0.5) 0%, transparent 8%),
    linear-gradient(to bottom, #050518 0%, #0d0d2e 50%, #050518 100%);
}
.roycss-seasonal-firework-sky::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 2px at 22% 35%, #fbbf24, transparent),
    radial-gradient(circle 2px at 75% 30%, #ef4444, transparent),
    radial-gradient(circle 2px at 50% 55%, #10b981, transparent),
    radial-gradient(circle 2px at 30% 70%, #3b82f6, transparent),
    radial-gradient(circle 2px at 85% 75%, #ec4899, transparent);
  animation: roy-b14-fw-twinkle 2s ease-in-out infinite;
}
.roycss-seasonal-firework-sky::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 1px at 15% 45%, rgba(255,255,255,0.6), transparent),
    radial-gradient(circle 1px at 65% 15%, rgba(255,255,255,0.6), transparent),
    radial-gradient(circle 1px at 45% 65%, rgba(255,255,255,0.6), transparent);
  background-size: 100px 100px;
}
@keyframes roy-b14-fw-twinkle {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}`,
  },

  // 16. seasonal-autumn-gradient
  {
    id: "seasonal-autumn-gradient",
    name: "Autumn Gradient Scene",
    category: "backgrounds",
    description:
      "Warm autumn scene with a gradient sky in oranges and reds over a silhouette of bare trees and falling leaf accents",
    tags: ["autumn", "gradient", "warm", "scene"],
    previewType: "background",
    cssCode: `/* Autumn Gradient Scene */
.roycss-seasonal-autumn-gradient {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom,
      #fde047 0%,
      #fb923c 20%,
      #f97316 40%,
      #dc2626 60%,
      #7c2d12 85%,
      #431407 100%);
}
.roycss-seasonal-autumn-gradient::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: #1c0701;
  clip-path: polygon(
    0% 100%,
    0% 70%, 5% 75%, 8% 30%, 12% 78%, 15% 50%, 18% 80%, 22% 25%, 25% 75%,
    28% 40%, 32% 78%, 36% 20%, 40% 75%, 44% 45%, 48% 80%, 52% 30%, 56% 76%,
    60% 50%, 64% 78%, 68% 25%, 72% 75%, 76% 40%, 80% 78%, 84% 35%, 88% 76%,
    92% 45%, 96% 80%, 100% 50%, 100% 100%
  );
}
.roycss-seasonal-autumn-gradient::after {
  content: "";
  position: absolute;
  top: 25%;
  left: 30%;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(254, 240, 138, 0.7) 0%, transparent 60%);
  border-radius: 50%;
  filter: blur(2px);
}`,
  },

  // 17. seasonal-winter-snow-scene
  {
    id: "seasonal-winter-snow-scene",
    name: "Winter Snow Scene",
    category: "backgrounds",
    description:
      "Snowy winter landscape with layered snow-covered hills, distant pine trees, and a pale blue sky",
    tags: ["winter", "snow", "landscape", "cold"],
    previewType: "background",
    cssCode: `/* Winter Snow Scene */
.roycss-seasonal-winter-snow-scene {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, #b8d4e8 0%, #d6e8f3 40%, #f0f7fb 70%, #ffffff 100%);
}
.roycss-seasonal-winter-snow-scene::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background:
    radial-gradient(ellipse 30px 50px at 15% 70%, #15803d 0%, #15803d 60%, transparent 61%),
    radial-gradient(ellipse 30px 50px at 80% 75%, #166534 0%, #166534 60%, transparent 61%),
    linear-gradient(to top, #ffffff 0%, #f0f7fb 50%, transparent 100%);
  clip-path: polygon(
    0% 100%, 0% 60%, 10% 55%, 20% 70%, 35% 45%, 50% 65%, 65% 40%, 80% 60%, 100% 50%, 100% 100%
  );
}
.roycss-seasonal-winter-snow-scene::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(to top, #ffffff 0%, #e6f0f7 60%, transparent 100%);
  clip-path: polygon(
    0% 100%, 0% 70%, 15% 60%, 30% 80%, 45% 50%, 60% 75%, 75% 55%, 90% 75%, 100% 65%, 100% 100%
  );
}`,
  },

  // 18. seasonal-spring-meadow
  {
    id: "seasonal-spring-meadow",
    name: "Spring Meadow",
    category: "backgrounds",
    description:
      "Fresh spring meadow with rolling green hills, scattered yellow and pink flowers, and a clear sky",
    tags: ["spring", "meadow", "flowers", "green"],
    previewType: "background",
    cssCode: `/* Spring Meadow */
.roycss-seasonal-spring-meadow {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, #87ceeb 0%, #b8e0f5 40%, #c8f0d8 65%, #86efac 100%);
}
.roycss-seasonal-spring-meadow::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 55%;
  background:
    radial-gradient(circle 4px at 20% 50%, #fbbf24, transparent),
    radial-gradient(circle 4px at 35% 65%, #ec4899, transparent),
    radial-gradient(circle 4px at 55% 55%, #fbbf24, transparent),
    radial-gradient(circle 4px at 70% 70%, #ec4899, transparent),
    radial-gradient(circle 4px at 85% 60%, #fbbf24, transparent),
    radial-gradient(circle 4px at 25% 80%, #ec4899, transparent),
    radial-gradient(circle 4px at 50% 85%, #fbbf24, transparent),
    radial-gradient(circle 4px at 80% 85%, #ec4899, transparent),
    linear-gradient(to top, #22c55e 0%, #4ade80 60%, transparent 100%);
  clip-path: polygon(
    0% 100%, 0% 50%, 15% 40%, 30% 55%, 50% 35%, 70% 50%, 85% 40%, 100% 55%, 100% 100%
  );
}
.roycss-seasonal-spring-meadow::after {
  content: "";
  position: absolute;
  top: 15%;
  left: 70%;
  width: 70px;
  height: 70px;
  background: radial-gradient(circle, #fef3c7 0%, #fde68a 50%, transparent 70%);
  border-radius: 50%;
  filter: blur(1px);
}`,
  },

  // 19. seasonal-summer-beach-ball
  {
    id: "seasonal-summer-beach-ball",
    name: "Beach Ball Pattern",
    category: "backgrounds",
    description:
      "Repeating colorful beach ball pattern with six colored segments on a sunny yellow background",
    tags: ["summer", "beach", "ball", "pattern"],
    previewType: "background",
    cssCode: `/* Beach Ball Pattern */
.roycss-seasonal-summer-beach-ball {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 30%, #ffffff 0%, #ffffff 8%, transparent 9%),
    conic-gradient(from 0deg at 50% 50%,
      #ef4444 0deg, #ef4444 60deg,
      #ffffff 60deg, #ffffff 120deg,
      #3b82f6 120deg, #3b82f6 180deg,
      #ffffff 180deg, #ffffff 240deg,
      #fbbf24 240deg, #fbbf24 300deg,
      #ffffff 300deg, #ffffff 360deg),
    #fef9c3;
  background-size: 100px 100px, 80px 80px, 100% 100%;
  background-position: 30px 30px, 30px 30px, 0 0;
  background-repeat: repeat, repeat, repeat;
}
.roycss-seasonal-summer-beach-ball::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 30%),
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.4) 0%, transparent 30%);
}`,
  },

  // 20. seasonal-halloween-spooky
  {
    id: "seasonal-halloween-spooky",
    name: "Halloween Spooky Night",
    category: "backgrounds",
    description:
      "Spooky foggy Halloween night with a full moon, drifting fog layers, and silhouetted dead trees",
    tags: ["halloween", "spooky", "fog", "moon"],
    previewType: "background",
    cssCode: `/* Halloween Spooky Night */
.roycss-seasonal-halloween-spooky {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 75% 25%, #fef3c7 0%, #fde68a 4%, transparent 12%),
    radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 20%),
    linear-gradient(to bottom, #1a0a2e 0%, #2d1b3d 40%, #1a0a2e 70%, #0a0510 100%);
}
.roycss-seasonal-halloween-spooky::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background:
    linear-gradient(to top,
      rgba(80, 60, 100, 0.4) 0%,
      rgba(80, 60, 100, 0.3) 30%,
      transparent 100%);
  filter: blur(8px);
  animation: roy-b14-fog-drift 12s ease-in-out infinite alternate;
}
.roycss-seasonal-halloween-spooky::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: #0a0510;
  clip-path: polygon(
    0% 100%,
    0% 60%, 4% 70%, 6% 20%, 8% 75%, 12% 30%, 16% 70%, 20% 60%, 24% 15%, 28% 75%,
    32% 50%, 36% 70%, 40% 25%, 44% 75%, 48% 55%, 52% 70%, 56% 20%, 60% 75%,
    64% 45%, 68% 70%, 72% 30%, 76% 75%, 80% 50%, 84% 70%, 88% 25%, 92% 75%,
    96% 55%, 100% 70%, 100% 100%
  );
}
@keyframes roy-b14-fog-drift {
  0%   { transform: translateX(-20px); }
  100% { transform: translateX(20px); }
}`,
  },

  /* =========================================================================
   * VISUAL — THEMED OBJECT VISUALS (10)
   * ========================================================================= */

  // 21. seasonal-snowflake-crystal
  {
    id: "seasonal-snowflake-crystal",
    name: "Snowflake Crystal",
    category: "visual",
    description:
      "Detailed six-pointed CSS snowflake with radial arms and branch details, gently shimmering",
    tags: ["snowflake", "crystal", "winter", "ice"],
    previewType: "box",
    cssCode: `/* Snowflake Crystal */
.roycss-seasonal-snowflake-crystal {
  position: relative;
  width: 120px;
  height: 120px;
  background: transparent;
}
.roycss-seasonal-snowflake-crystal::before,
.roycss-seasonal-snowflake-crystal::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 4px;
  background: linear-gradient(to right, transparent 0%, #e0f2fe 20%, #ffffff 50%, #e0f2fe 80%, transparent 100%);
  border-radius: 2px;
  transform-origin: center;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}
.roycss-seasonal-snowflake-crystal::before {
  transform: translate(-50%, -50%) rotate(0deg);
}
.roycss-seasonal-snowflake-crystal::after {
  transform: translate(-50%, -50%) rotate(60deg);
  box-shadow:
    0 0 8px rgba(255, 255, 255, 0.8),
    -50px 0 0 -2px #ffffff,
    -42px -8px 0 -2px #ffffff,
    -42px 8px 0 -2px #ffffff,
    50px 0 0 -2px #ffffff,
    42px -8px 0 -2px #ffffff,
    42px 8px 0 -2px #ffffff;
}
.roycss-seasonal-snowflake-crystal {
  background:
    linear-gradient(to right, transparent 0%, #e0f2fe 20%, #ffffff 50%, #e0f2fe 80%, transparent 100%),
    transparent;
  background-size: 100px 4px, 100% 100%;
  background-position: center center, center;
  background-repeat: no-repeat;
  animation: roy-b14-snowflake-shimmer 3s ease-in-out infinite;
}
@keyframes roy-b14-snowflake-shimmer {
  0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 4px rgba(255,255,255,0.5)); }
  50% { opacity: 1; filter: drop-shadow(0 0 12px rgba(255,255,255,0.9)); }
}`,
  },

  // 22. seasonal-pumpkin-glow
  {
    id: "seasonal-pumpkin-glow",
    name: "Glowing Pumpkin",
    category: "visual",
    description:
      "Orange Halloween pumpkin with vertical ribs, a green stem, and an eerie inner glow",
    tags: ["halloween", "pumpkin", "glow", "orange"],
    previewType: "box",
    cssCode: `/* Glowing Pumpkin */
.roycss-seasonal-pumpkin-glow {
  position: relative;
  width: 120px;
  height: 100px;
  background:
    radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.3) 0%, transparent 35%),
    radial-gradient(ellipse at 70% 50%, rgba(0,0,0,0.3) 0%, transparent 35%),
    radial-gradient(ellipse at center, #f97316 0%, #ea580c 60%, #9a3412 100%);
  border-radius: 50% 50% 45% 45% / 55% 55% 45% 45%;
  box-shadow:
    0 0 30px rgba(249, 115, 22, 0.6),
    0 0 60px rgba(234, 88, 12, 0.4),
    inset 0 -20px 30px rgba(0, 0, 0, 0.4);
  animation: roy-b14-pumpkin-glow-pulse 2s ease-in-out infinite;
}
.roycss-seasonal-pumpkin-glow::before {
  content: "";
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 22px;
  background: linear-gradient(to bottom, #166534 0%, #14532d 100%);
  border-radius: 4px 4px 2px 2px;
}
.roycss-seasonal-pumpkin-glow::after {
  content: "";
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 30px;
  background:
    radial-gradient(ellipse at 25% 50%, #fbbf24 0%, #fbbf24 8px, transparent 9px),
    radial-gradient(ellipse at 75% 50%, #fbbf24 0%, #fbbf24 8px, transparent 9px),
    radial-gradient(ellipse at 50% 80%, #fbbf24 0%, #fbbf24 14px, transparent 15px);
  filter: drop-shadow(0 0 6px #fbbf24);
}
@keyframes roy-b14-pumpkin-glow-pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(249, 115, 22, 0.6), 0 0 60px rgba(234, 88, 12, 0.4), inset 0 -20px 30px rgba(0, 0, 0, 0.4); }
  50% { box-shadow: 0 0 45px rgba(249, 115, 22, 0.9), 0 0 90px rgba(234, 88, 12, 0.6), inset 0 -20px 30px rgba(0, 0, 0, 0.4); }
}`,
  },

  // 23. seasonal-christmas-lights
  {
    id: "seasonal-christmas-lights",
    name: "Christmas Lights String",
    category: "visual",
    description:
      "String of multicolored Christmas lights with bulb shapes hanging from a wire, each blinking on a staggered rhythm",
    tags: ["christmas", "lights", "bulbs", "string"],
    previewType: "box",
    childCount: 6,
    cssCode: `/* Christmas Lights String */
.roycss-seasonal-christmas-lights {
  position: relative;
  width: 100%;
  height: 80px;
  background: transparent;
}
.roycss-seasonal-christmas-lights::before {
  content: "";
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  height: 2px;
  background: #1f2937;
  border-radius: 1px;
}
.roycss-seasonal-christmas-lights span {
  position: absolute;
  top: 12px;
  width: 14px;
  height: 22px;
  border-radius: 50% 50% 40% 40% / 60% 60% 40% 40%;
  color: transparent;
  font-size: 0;
  animation: roy-b14-light-blink 1.5s ease-in-out infinite;
}
.roycss-seasonal-christmas-lights span::before {
  content: "";
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 4px;
  background: #374151;
  border-radius: 2px 2px 0 0;
}
.roycss-seasonal-christmas-lights span:nth-child(1) { left: 10%;  background: #ef4444; box-shadow: 0 0 10px #ef4444; animation-delay: 0s; }
.roycss-seasonal-christmas-lights span:nth-child(2) { left: 25%;  background: #22c55e; box-shadow: 0 0 10px #22c55e; animation-delay: 0.25s; }
.roycss-seasonal-christmas-lights span:nth-child(3) { left: 40%;  background: #3b82f6; box-shadow: 0 0 10px #3b82f6; animation-delay: 0.5s; }
.roycss-seasonal-christmas-lights span:nth-child(4) { left: 55%;  background: #fbbf24; box-shadow: 0 0 10px #fbbf24; animation-delay: 0.75s; }
.roycss-seasonal-christmas-lights span:nth-child(5) { left: 70%;  background: #ec4899; box-shadow: 0 0 10px #ec4899; animation-delay: 1s; }
.roycss-seasonal-christmas-lights span:nth-child(6) { left: 85%;  background: #a855f7; box-shadow: 0 0 10px #a855f7; animation-delay: 1.25s; }
@keyframes roy-b14-light-blink {
  0%, 100% { opacity: 1; filter: brightness(1.2); }
  50% { opacity: 0.4; filter: brightness(0.7); }
}`,
  },

  // 24. seasonal-heart-pulse-valentine
  {
    id: "seasonal-heart-pulse-valentine",
    name: "Pulsing Valentine Heart",
    category: "visual",
    description:
      "Red Valentine heart shape with a glowing aura that pulses in a steady heartbeat rhythm",
    tags: ["valentine", "heart", "pulse", "love"],
    previewType: "box",
    cssCode: `/* Pulsing Valentine Heart */
.roycss-seasonal-heart-pulse-valentine {
  position: relative;
  width: 100px;
  height: 100px;
  background: transparent;
}
.roycss-seasonal-heart-pulse-valentine::before,
.roycss-seasonal-heart-pulse-valentine::after {
  content: "";
  position: absolute;
  top: 20px;
  left: 18px;
  width: 50px;
  height: 80px;
  background: #e11d48;
  border-radius: 50px 50px 0 0;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
  box-shadow: 0 0 30px rgba(225, 29, 72, 0.8);
  animation: roy-b14-heart-pulse 1.2s ease-in-out infinite;
}
.roycss-seasonal-heart-pulse-valentine::after {
  left: 68px;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
}
@keyframes roy-b14-heart-pulse {
  0%, 100% { transform: rotate(-45deg) scale(1); box-shadow: 0 0 30px rgba(225, 29, 72, 0.8); }
  15% { transform: rotate(-45deg) scale(1.15); box-shadow: 0 0 50px rgba(225, 29, 72, 1); }
  30% { transform: rotate(-45deg) scale(1); }
  45% { transform: rotate(-45deg) scale(1.1); box-shadow: 0 0 45px rgba(225, 29, 72, 0.9); }
}
.roycss-seasonal-heart-pulse-valentine::after {
  animation-name: roy-b14-heart-pulse-right;
}
@keyframes roy-b14-heart-pulse-right {
  0%, 100% { transform: rotate(45deg) scale(1); box-shadow: 0 0 30px rgba(225, 29, 72, 0.8); }
  15% { transform: rotate(45deg) scale(1.15); box-shadow: 0 0 50px rgba(225, 29, 72, 1); }
  30% { transform: rotate(45deg) scale(1); }
  45% { transform: rotate(45deg) scale(1.1); box-shadow: 0 0 45px rgba(225, 29, 72, 0.9); }
}`,
  },

  // 25. seasonal-firework-burst
  {
    id: "seasonal-firework-burst",
    name: "Firework Burst",
    category: "visual",
    description:
      "Single radial firework burst with multi-colored spokes expanding outward, on a dark backdrop",
    tags: ["firework", "burst", "explosion", "celebration"],
    previewType: "box",
    cssCode: `/* Firework Burst */
.roycss-seasonal-firework-burst {
  position: relative;
  width: 160px;
  height: 160px;
  background: radial-gradient(ellipse at center, #0a0a2e 0%, #050518 100%);
  border-radius: 8px;
  overflow: hidden;
}
.roycss-seasonal-firework-burst::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
  transform: translate(-50%, -50%);
  background:
    conic-gradient(from 0deg,
      #fbbf24 0deg, transparent 8deg, transparent 22deg,
      #ef4444 30deg, transparent 38deg, transparent 52deg,
      #10b981 60deg, transparent 68deg, transparent 82deg,
      #3b82f6 90deg, transparent 98deg, transparent 112deg,
      #ec4899 120deg, transparent 128deg, transparent 142deg,
      #fbbf24 150deg, transparent 158deg, transparent 172deg,
      #ef4444 180deg, transparent 188deg, transparent 202deg,
      #10b981 210deg, transparent 218deg, transparent 232deg,
      #3b82f6 240deg, transparent 248deg, transparent 262deg,
      #ec4899 270deg, transparent 278deg, transparent 292deg,
      #fbbf24 300deg, transparent 308deg, transparent 322deg,
      #ef4444 330deg, transparent 338deg, transparent 352deg,
      transparent 360deg);
  border-radius: 50%;
  filter: blur(0.5px);
  animation: roy-b14-fw-expand 1.6s ease-out infinite;
}
.roycss-seasonal-firework-burst::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 12px #ffffff;
  animation: roy-b14-fw-core 1.6s ease-out infinite;
}
@keyframes roy-b14-fw-expand {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  60%  { opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}
@keyframes roy-b14-fw-core {
  0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
  50%  { transform: translate(-50%, -50%) scale(1.5); }
  100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
}`,
  },

  // 26. seasonal-ghost-float
  {
    id: "seasonal-ghost-float",
    name: "Floating Ghost",
    category: "visual",
    description:
      "Cute spooky white ghost with black eyes floating gently up and down with a wavy bottom edge",
    tags: ["halloween", "ghost", "spooky", "float"],
    previewType: "box",
    cssCode: `/* Floating Ghost */
.roycss-seasonal-ghost-float {
  position: relative;
  width: 100px;
  height: 120px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50% 50% 0 0;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  clip-path: polygon(
    0% 100%, 5% 80%, 10% 100%, 15% 80%, 20% 100%,
    25% 80%, 30% 100%, 35% 80%, 40% 100%, 45% 80%,
    50% 100%, 55% 80%, 60% 100%, 65% 80%, 70% 100%,
    75% 80%, 80% 100%, 85% 80%, 90% 100%, 95% 80%, 100% 100%
  );
  animation: roy-b14-ghost-float-up 3s ease-in-out infinite;
}
.roycss-seasonal-ghost-float::before {
  content: "";
  position: absolute;
  top: 40px;
  left: 25px;
  width: 14px;
  height: 18px;
  background: #1f2937;
  border-radius: 50%;
  box-shadow: 36px 0 0 #1f2937;
}
.roycss-seasonal-ghost-float::after {
  content: "";
  position: absolute;
  top: 70px;
  left: 42px;
  width: 14px;
  height: 8px;
  background: #1f2937;
  border-radius: 0 0 14px 14px;
}
@keyframes roy-b14-ghost-float-up {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}`,
  },

  // 27. seasonal-bat-fly
  {
    id: "seasonal-bat-fly",
    name: "Flying Bat",
    category: "visual",
    description:
      "Black bat silhouette with outstretched wings flapping while flying across the box",
    tags: ["halloween", "bat", "fly", "silhouette"],
    previewType: "box",
    cssCode: `/* Flying Bat */
.roycss-seasonal-bat-fly {
  position: relative;
  width: 120px;
  height: 80px;
  background: transparent;
  animation: roy-b14-bat-fly-across 4s linear infinite;
}
.roycss-seasonal-bat-fly::before {
  content: "";
  position: absolute;
  top: 30px;
  left: 50px;
  width: 20px;
  height: 18px;
  background: #0a0510;
  border-radius: 50%;
  box-shadow:
    -20px -8px 0 -4px #0a0510,
    -35px -12px 0 -6px #0a0510,
    20px -8px 0 -4px #0a0510,
    35px -12px 0 -6px #0a0510;
}
.roycss-seasonal-bat-fly::after {
  content: "";
  position: absolute;
  top: 25px;
  left: 20px;
  width: 80px;
  height: 30px;
  background:
    radial-gradient(ellipse 40px 12px at 20% 50%, #0a0510 0%, #0a0510 50%, transparent 51%),
    radial-gradient(ellipse 40px 12px at 80% 50%, #0a0510 0%, #0a0510 50%, transparent 51%);
  animation: roy-b14-bat-wing-flap 0.4s ease-in-out infinite;
}
@keyframes roy-b14-bat-wing-flap {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.4); }
}
@keyframes roy-b14-bat-fly-across {
  0%   { transform: translateX(-30px) translateY(0); }
  25%  { transform: translateX(20px) translateY(-10px); }
  50%  { transform: translateX(60px) translateY(0); }
  75%  { transform: translateX(20px) translateY(10px); }
  100% { transform: translateX(-30px) translateY(0); }
}`,
  },

  // 28. seasonal-witch-hat
  {
    id: "seasonal-witch-hat",
    name: "Witch Hat",
    category: "visual",
    description:
      "Classic black witch's pointed hat with a purple band and golden buckle, slightly tilting",
    tags: ["halloween", "witch", "hat", "magic"],
    previewType: "box",
    cssCode: `/* Witch Hat */
.roycss-seasonal-witch-hat {
  position: relative;
  width: 120px;
  height: 120px;
  background: transparent;
  animation: roy-b14-hat-tilt 4s ease-in-out infinite;
}
.roycss-seasonal-witch-hat::before {
  content: "";
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 40px solid transparent;
  border-right: 40px solid transparent;
  border-bottom: 90px solid #0a0510;
  filter: drop-shadow(0 -20px 0 -10px #1f1147);
}
.roycss-seasonal-witch-hat::after {
  content: "";
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 18px;
  background:
    linear-gradient(to bottom, #6b21a8 0%, #4c1d95 50%, #6b21a8 100%);
  border-radius: 50% 50% 4px 4px / 30% 30% 4px 4px;
  box-shadow:
    inset 0 0 0 4px #fbbf24,
    inset 0 0 0 6px #6b21a8;
}
.roycss-seasonal-witch-hat {
  background:
    radial-gradient(ellipse 10px 6px at 50% 22%, #fbbf24 0%, #fbbf24 60%, transparent 61%);
}
@keyframes roy-b14-hat-tilt {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}`,
  },

  // 29. seasonal-sun-summer
  {
    id: "seasonal-sun-summer",
    name: "Summer Sun with Rays",
    category: "visual",
    description:
      "Bright yellow summer sun with radiating triangular rays and a glowing corona",
    tags: ["summer", "sun", "rays", "bright"],
    previewType: "box",
    cssCode: `/* Summer Sun with Rays */
.roycss-seasonal-sun-summer {
  position: relative;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, #fef3c7 0%, #fbbf24 40%, #f59e0b 80%, #f97316 100%);
  border-radius: 50%;
  box-shadow:
    0 0 30px rgba(251, 191, 36, 0.8),
    0 0 60px rgba(245, 158, 11, 0.5),
    0 0 90px rgba(249, 115, 22, 0.3);
}
.roycss-seasonal-sun-summer::before,
.roycss-seasonal-sun-summer::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 160px;
  transform: translate(-50%, -50%);
  background:
    conic-gradient(from 0deg,
      transparent 0deg, transparent 8deg,
      rgba(251, 191, 36, 0.7) 9deg, rgba(251, 191, 36, 0.7) 21deg,
      transparent 22deg, transparent 38deg,
      rgba(251, 191, 36, 0.7) 39deg, rgba(251, 191, 36, 0.7) 51deg,
      transparent 52deg, transparent 68deg,
      rgba(251, 191, 36, 0.7) 69deg, rgba(251, 191, 36, 0.7) 81deg,
      transparent 82deg, transparent 98deg,
      rgba(251, 191, 36, 0.7) 99deg, rgba(251, 191, 36, 0.7) 111deg,
      transparent 112deg, transparent 128deg,
      rgba(251, 191, 36, 0.7) 129deg, rgba(251, 191, 36, 0.7) 141deg,
      transparent 142deg, transparent 158deg,
      rgba(251, 191, 36, 0.7) 159deg, rgba(251, 191, 36, 0.7) 171deg,
      transparent 172deg, transparent 188deg,
      rgba(251, 191, 36, 0.7) 189deg, rgba(251, 191, 36, 0.7) 201deg,
      transparent 202deg, transparent 218deg,
      rgba(251, 191, 36, 0.7) 219deg, rgba(251, 191, 36, 0.7) 231deg,
      transparent 232deg, transparent 248deg,
      rgba(251, 191, 36, 0.7) 249deg, rgba(251, 191, 36, 0.7) 261deg,
      transparent 262deg, transparent 278deg,
      rgba(251, 191, 36, 0.7) 279deg, rgba(251, 191, 36, 0.7) 291deg,
      transparent 292deg, transparent 308deg,
      rgba(251, 191, 36, 0.7) 309deg, rgba(251, 191, 36, 0.7) 321deg,
      transparent 322deg, transparent 338deg,
      rgba(251, 191, 36, 0.7) 339deg, rgba(251, 191, 36, 0.7) 351deg,
      transparent 352deg, transparent 360deg);
  border-radius: 50%;
  filter: blur(0.5px);
}
.roycss-seasonal-sun-summer::after {
  animation: roy-b14-sun-pulse 3s ease-in-out infinite;
}
@keyframes roy-b14-sun-pulse {
  0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
}`,
  },

  // 30. seasonal-moon-halloween
  {
    id: "seasonal-moon-halloween",
    name: "Crescent Moon with Bats",
    category: "visual",
    description:
      "Pale yellow crescent moon glowing in a dark sky with two tiny bat silhouettes flying past",
    tags: ["halloween", "moon", "crescent", "bats"],
    previewType: "box",
    cssCode: `/* Crescent Moon with Bats */
.roycss-seasonal-moon-halloween {
  position: relative;
  width: 140px;
  height: 140px;
  background: radial-gradient(ellipse at center, #1a0a2e 0%, #050518 100%);
  border-radius: 8px;
  overflow: hidden;
}
.roycss-seasonal-moon-halloween::before {
  content: "";
  position: absolute;
  top: 20px;
  left: 30px;
  width: 70px;
  height: 70px;
  background: radial-gradient(circle, #fef3c7 0%, #fde68a 60%, #fbbf24 100%);
  border-radius: 50%;
  box-shadow: 0 0 25px rgba(254, 240, 138, 0.7), 0 0 50px rgba(251, 191, 36, 0.4);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 30% 5%, 50% 30%, 45% 60%, 25% 85%, 0 95%);
}
.roycss-seasonal-moon-halloween::after {
  content: "";
  position: absolute;
  top: 40px;
  right: 20px;
  width: 18px;
  height: 6px;
  background: #0a0510;
  border-radius: 50%;
  box-shadow:
    -30px 15px 0 -1px #0a0510,
    -30px 15px 0 0 transparent,
    -45px 8px 0 -2px #0a0510;
  animation: roy-b14-moon-bat-fly 5s linear infinite;
}
@keyframes roy-b14-moon-bat-fly {
  0%   { transform: translate(20px, -10px); opacity: 0; }
  10%  { opacity: 1; }
  50%  { transform: translate(-50px, 10px); opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translate(-120px, -5px); opacity: 0; }
}`,
  },

  /* =========================================================================
   * ANIMATIONS — THEMED KEYFRAME ANIMATIONS (10)
   * ========================================================================= */

  // 31. seasonal-sleigh-fly
  {
    id: "seasonal-sleigh-fly",
    name: "Santa's Sleigh Flying",
    category: "animations",
    description:
      "Santa's sleigh silhouette with reindeer flying across the night sky with a trailing gift sparkle",
    tags: ["christmas", "sleigh", "santa", "fly"],
    previewType: "box",
    cssCode: `/* Santa's Sleigh Flying */
.roycss-seasonal-sleigh-fly {
  position: relative;
  width: 200px;
  height: 100px;
  background: linear-gradient(to bottom, #0a0a2e 0%, #1a1a3e 60%, #2d1b3d 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-sleigh-fly::before {
  content: "";
  position: absolute;
  top: 40px;
  left: -50px;
  width: 60px;
  height: 20px;
  background:
    radial-gradient(circle 4px at 10% 50%, #dc2626, transparent),
    radial-gradient(circle 4px at 30% 50%, #dc2626, transparent),
    radial-gradient(ellipse 30px 8px at 70% 50%, #7c2d12 0%, #7c2d12 60%, transparent 61%);
  animation: roy-b14-sleigh-fly-across 4s linear infinite;
}
.roycss-seasonal-sleigh-fly::after {
  content: "";
  position: absolute;
  top: 38px;
  left: -50px;
  width: 20px;
  height: 10px;
  background: #1f2937;
  border-radius: 50%;
  box-shadow:
    15px 0 0 -1px #1f2937,
    30px 0 0 -1px #1f2937,
    45px -2px 0 -1px #1f2937;
  animation: roy-b14-sleigh-fly-across 4s linear infinite;
}
@keyframes roy-b14-sleigh-fly-across {
  0%   { transform: translateX(0) translateY(0); }
  25%  { transform: translateX(60px) translateY(-8px); }
  50%  { transform: translateX(120px) translateY(0); }
  75%  { transform: translateX(180px) translateY(-12px); }
  100% { transform: translateX(260px) translateY(-5px); }
}`,
  },

  // 32. seasonal-ghost-wobble
  {
    id: "seasonal-ghost-wobble",
    name: "Ghost Wobble",
    category: "animations",
    description:
      "Cute ghost wobbling side to side with its arms swaying and a soft spooky glow",
    tags: ["halloween", "ghost", "wobble", "spooky"],
    previewType: "box",
    cssCode: `/* Ghost Wobble */
.roycss-seasonal-ghost-wobble {
  position: relative;
  width: 100px;
  height: 120px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50% 50% 0 0;
  box-shadow: 0 0 25px rgba(200, 220, 255, 0.6);
  clip-path: polygon(
    0% 100%, 8% 80%, 16% 100%, 24% 80%, 32% 100%,
    40% 80%, 48% 100%, 56% 80%, 64% 100%,
    72% 80%, 80% 100%, 88% 80%, 96% 100%, 100% 80%
  );
  animation: roy-b14-ghost-wobble-sway 2s ease-in-out infinite;
  transform-origin: bottom center;
}
.roycss-seasonal-ghost-wobble::before {
  content: "";
  position: absolute;
  top: 40px;
  left: 30px;
  width: 12px;
  height: 16px;
  background: #1f2937;
  border-radius: 50%;
  box-shadow: 28px 0 0 #1f2937;
}
.roycss-seasonal-ghost-wobble::after {
  content: "";
  position: absolute;
  top: 70px;
  left: 42px;
  width: 16px;
  height: 8px;
  background: #1f2937;
  border-radius: 0 0 16px 16px;
}
@keyframes roy-b14-ghost-wobble-sway {
  0%, 100% { transform: rotate(-8deg) translateY(0); }
  50% { transform: rotate(8deg) translateY(-5px); }
}`,
  },

  // 33. seasonal-pumpkin-bounce
  {
    id: "seasonal-pumpkin-bounce",
    name: "Bouncing Pumpkin",
    category: "animations",
    description:
      "Halloween pumpkin bouncing up and down with squash-and-stretch deformation on landing",
    tags: ["halloween", "pumpkin", "bounce", "squash"],
    previewType: "box",
    cssCode: `/* Bouncing Pumpkin */
.roycss-seasonal-pumpkin-bounce {
  position: relative;
  width: 100px;
  height: 90px;
  background:
    radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.3) 0%, transparent 35%),
    radial-gradient(ellipse at 70% 50%, rgba(0,0,0,0.3) 0%, transparent 35%),
    radial-gradient(ellipse at center, #f97316 0%, #ea580c 60%, #9a3412 100%);
  border-radius: 50% 50% 45% 45% / 55% 55% 45% 45%;
  box-shadow: inset 0 -15px 25px rgba(0, 0, 0, 0.4);
  animation: roy-b14-pumpkin-bounce-anim 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  transform-origin: bottom center;
}
.roycss-seasonal-pumpkin-bounce::before {
  content: "";
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 18px;
  background: linear-gradient(to bottom, #166534 0%, #14532d 100%);
  border-radius: 4px 4px 2px 2px;
}
.roycss-seasonal-pumpkin-bounce::after {
  content: "";
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 25px;
  background:
    radial-gradient(ellipse at 25% 50%, #fbbf24 0%, #fbbf24 6px, transparent 7px),
    radial-gradient(ellipse at 75% 50%, #fbbf24 0%, #fbbf24 6px, transparent 7px),
    radial-gradient(ellipse at 50% 80%, #fbbf24 0%, #fbbf24 12px, transparent 13px);
  filter: drop-shadow(0 0 4px #fbbf24);
}
@keyframes roy-b14-pumpkin-bounce-anim {
  0%, 100% { transform: translateY(0) scaleY(0.85) scaleX(1.1); }
  10% { transform: translateY(0) scaleY(0.7) scaleX(1.2); }
  30% { transform: translateY(-50px) scaleY(1.1) scaleX(0.9); }
  60% { transform: translateY(-50px) scaleY(1.05) scaleX(0.95); }
  80% { transform: translateY(0) scaleY(0.85) scaleX(1.1); }
}`,
  },

  // 34. seasonal-snowman-build
  {
    id: "seasonal-snowman-build",
    name: "Snowman Build",
    category: "animations",
    description:
      "Snowman appearing piece by piece with three stacked snowballs, carrot nose, and button eyes",
    tags: ["winter", "snowman", "build", "snow"],
    previewType: "box",
    cssCode: `/* Snowman Build */
.roycss-seasonal-snowman-build {
  position: relative;
  width: 120px;
  height: 140px;
  background: linear-gradient(to bottom, #b8d4e8 0%, #e0f0fa 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-snowman-build::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 80px;
  background:
    radial-gradient(circle at 50% 90%, #ffffff 0%, #ffffff 35%, transparent 36%),
    radial-gradient(circle at 50% 55%, #ffffff 0%, #ffffff 25%, transparent 26%),
    radial-gradient(circle at 50% 25%, #ffffff 0%, #ffffff 18%, transparent 19%);
  animation: roy-b14-snowman-appear 3s ease-out infinite;
}
.roycss-seasonal-snowman-build::after {
  content: "";
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 30px;
  background:
    radial-gradient(circle 3px at 35% 40%, #1f2937, transparent),
    radial-gradient(circle 3px at 65% 40%, #1f2937, transparent),
    radial-gradient(ellipse 6px 3px at 50% 55%, #f97316, transparent);
  animation: roy-b14-snowman-face 3s ease-out infinite;
}
@keyframes roy-b14-snowman-appear {
  0%   { opacity: 0; transform: translateX(-50%) scale(0.5); }
  33%  { opacity: 1; transform: translateX(-50%) scale(0.7); }
  66%  { opacity: 1; transform: translateX(-50%) scale(0.9); }
  100% { opacity: 1; transform: translateX(-50%) scale(1); }
}
@keyframes roy-b14-snowman-face {
  0%, 60% { opacity: 0; }
  100% { opacity: 1; }
}`,
  },

  // 35. seasonal-egg-roll
  {
    id: "seasonal-egg-roll",
    name: "Easter Egg Roll",
    category: "animations",
    description:
      "Colorful striped Easter egg rolling across a green meadow with full rotation",
    tags: ["easter", "egg", "roll", "spring"],
    previewType: "box",
    cssCode: `/* Easter Egg Roll */
.roycss-seasonal-egg-roll {
  position: relative;
  width: 200px;
  height: 100px;
  background: linear-gradient(to bottom, #86efac 0%, #4ade80 50%, #22c55e 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-egg-roll::before {
  content: "";
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 50px;
  height: 65px;
  background:
    linear-gradient(to bottom,
      #ec4899 0%, #ec4899 20%,
      #fef08a 20%, #fef08a 40%,
      #3b82f6 40%, #3b82f6 60%,
      #fef08a 60%, #fef08a 80%,
      #10b981 80%, #10b981 100%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  box-shadow: inset -5px -5px 10px rgba(0,0,0,0.2);
  animation: roy-b14-egg-roll-across 3s linear infinite;
}
.roycss-seasonal-egg-roll::after {
  content: "";
  position: absolute;
  bottom: 18px;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, transparent, #166534, transparent);
  opacity: 0.4;
}
@keyframes roy-b14-egg-roll-across {
  0%   { transform: translateX(0) rotate(0deg); }
  100% { transform: translateX(130px) rotate(360deg); }
}`,
  },

  // 36. seasonal-heart-beat
  {
    id: "seasonal-heart-beat",
    name: "Valentine Heart Beat",
    category: "animations",
    description:
      "Valentine heart beating with a realistic two-thump cardiac rhythm and color flash",
    tags: ["valentine", "heart", "beat", "love"],
    previewType: "box",
    cssCode: `/* Valentine Heart Beat */
.roycss-seasonal-heart-beat {
  position: relative;
  width: 100px;
  height: 100px;
  background: transparent;
}
.roycss-seasonal-heart-beat::before,
.roycss-seasonal-heart-beat::after {
  content: "";
  position: absolute;
  top: 15px;
  left: 18px;
  width: 50px;
  height: 80px;
  background: #be123c;
  border-radius: 50px 50px 0 0;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
  animation: roy-b14-heart-beat-thump 1.4s ease-in-out infinite;
}
.roycss-seasonal-heart-beat::after {
  left: 68px;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
  animation-name: roy-b14-heart-beat-thump-right;
}
@keyframes roy-b14-heart-beat-thump {
  0%, 100% { transform: rotate(-45deg) scale(1); background: #be123c; }
  10% { transform: rotate(-45deg) scale(1.18); background: #e11d48; }
  20% { transform: rotate(-45deg) scale(1); }
  30% { transform: rotate(-45deg) scale(1.1); background: #f43f5e; }
  40% { transform: rotate(-45deg) scale(1); }
}
@keyframes roy-b14-heart-beat-thump-right {
  0%, 100% { transform: rotate(45deg) scale(1); background: #be123c; }
  10% { transform: rotate(45deg) scale(1.18); background: #e11d48; }
  20% { transform: rotate(45deg) scale(1); }
  30% { transform: rotate(45deg) scale(1.1); background: #f43f5e; }
  40% { transform: rotate(45deg) scale(1); }
}`,
  },

  // 37. seasonal-firework-launch
  {
    id: "seasonal-firework-launch",
    name: "Firework Launch & Explode",
    category: "animations",
    description:
      "Firework rocket launching from bottom, leaving a trail, then exploding into colored sparks at the top",
    tags: ["firework", "rocket", "launch", "explode"],
    previewType: "box",
    cssCode: `/* Firework Launch & Explode */
.roycss-seasonal-firework-launch {
  position: relative;
  width: 160px;
  height: 160px;
  background: radial-gradient(ellipse at center, #0a0a2e 0%, #050518 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-firework-launch::before {
  content: "";
  position: absolute;
  bottom: 10px;
  left: 50%;
  width: 6px;
  height: 14px;
  background: #fbbf24;
  border-radius: 3px 3px 0 0;
  box-shadow:
    0 -3px 0 #ef4444,
    0 -6px 0 #f97316,
    0 -9px 0 #fbbf24,
    0 6px 8px 2px rgba(251, 191, 36, 0.6);
  transform: translateX(-50%);
  animation: roy-b14-rocket-launch 2.5s ease-in infinite;
}
.roycss-seasonal-firework-launch::after {
  content: "";
  position: absolute;
  top: 20%;
  left: 50%;
  width: 100px;
  height: 100px;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(circle 3px at 50% 50%, #fbbf24, transparent),
    radial-gradient(circle 3px at 30% 30%, #ef4444, transparent),
    radial-gradient(circle 3px at 70% 30%, #ec4899, transparent),
    radial-gradient(circle 3px at 30% 70%, #3b82f6, transparent),
    radial-gradient(circle 3px at 70% 70%, #10b981, transparent),
    radial-gradient(circle 3px at 80% 50%, #fbbf24, transparent),
    radial-gradient(circle 3px at 20% 50%, #a855f7, transparent),
    radial-gradient(circle 3px at 50% 20%, #f97316, transparent),
    radial-gradient(circle 3px at 50% 80%, #06b6d4, transparent);
  filter: blur(0.5px);
  animation: roy-b14-rocket-explode 2.5s ease-out infinite;
}
@keyframes roy-b14-rocket-launch {
  0%   { transform: translateX(-50%) translateY(0); opacity: 1; }
  70%  { transform: translateX(-50%) translateY(-110px); opacity: 1; }
  75%  { transform: translateX(-50%) translateY(-115px); opacity: 0; }
  100% { transform: translateX(-50%) translateY(-115px); opacity: 0; }
}
@keyframes roy-b14-rocket-explode {
  0%, 70% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  75% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
  90% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
}`,
  },

  // 38. seasonal-leaf-swirl
  {
    id: "seasonal-leaf-swirl",
    name: "Leaf Swirl",
    category: "animations",
    description:
      "Single autumn leaf swirling in circular wind pattern with rotation and color shift",
    tags: ["autumn", "leaf", "swirl", "wind"],
    previewType: "box",
    cssCode: `/* Leaf Swirl */
.roycss-seasonal-leaf-swirl {
  position: relative;
  width: 160px;
  height: 160px;
  background: linear-gradient(to bottom, #4a2c2a 0%, #8b4513 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-leaf-swirl::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  background: #dc2626;
  border-radius: 0 100% 0 100%;
  transform: translate(-50%, -50%);
  animation: roy-b14-leaf-swirl-anim 3s ease-in-out infinite;
}
.roycss-seasonal-leaf-swirl::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  background: #f59e0b;
  border-radius: 0 100% 0 100%;
  transform: translate(-50%, -50%);
  animation: roy-b14-leaf-swirl-anim 3s ease-in-out infinite;
  animation-delay: 1.5s;
}
@keyframes roy-b14-leaf-swirl-anim {
  0%   { transform: translate(-50%, -50%) rotate(0deg); opacity: 1; background: #dc2626; }
  25%  { transform: translate(calc(-50% + 30px), calc(-50% - 20px)) rotate(90deg); background: #f97316; }
  50%  { transform: translate(calc(-50% + 20px), calc(-50% + 30px)) rotate(180deg); background: #f59e0b; }
  75%  { transform: translate(calc(-50% - 30px), calc(-50% + 20px)) rotate(270deg); background: #b45309; }
  100% { transform: translate(-50%, -50%) rotate(360deg); opacity: 1; background: #dc2626; }
}`,
  },

  // 39. seasonal-snow-accumulate
  {
    id: "seasonal-snow-accumulate",
    name: "Snow Accumulation",
    category: "animations",
    description:
      "Snow falling from above and accumulating into a growing snowdrift at the bottom of the scene",
    tags: ["winter", "snow", "accumulate", "drift"],
    previewType: "box",
    cssCode: `/* Snow Accumulation */
.roycss-seasonal-snow-accumulate {
  position: relative;
  width: 200px;
  height: 160px;
  background: linear-gradient(to bottom, #1e3a5f 0%, #2c5282 60%, #1a365d 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-snow-accumulate::before {
  content: "";
  position: absolute;
  top: 0;
  left: 10%;
  width: 4px;
  height: 4px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow:
    20px 20px 0 #ffffff,
    40px 5px 0 #ffffff,
    60px 30px 0 #ffffff,
    80px 10px 0 #ffffff,
    100px 25px 0 #ffffff,
    120px 5px 0 #ffffff,
    140px 35px 0 #ffffff,
    160px 15px 0 #ffffff;
  animation: roy-b14-snow-fall-down 2.5s linear infinite;
}
.roycss-seasonal-snow-accumulate::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0;
  background:
    linear-gradient(to top, #ffffff 0%, #f0f7fb 60%, transparent 100%);
  border-radius: 50% 50% 0 0 / 20px 20px 0 0;
  animation: roy-b14-snow-pile-grow 5s ease-out infinite;
}
@keyframes roy-b14-snow-fall-down {
  0%   { transform: translateY(0); opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(160px); opacity: 0; }
}
@keyframes roy-b14-snow-pile-grow {
  0%   { height: 0; }
  100% { height: 40px; }
}`,
  },

  // 40. seasonal-sun-rotate
  {
    id: "seasonal-sun-rotate",
    name: "Summer Sun Rotate",
    category: "animations",
    description:
      "Summer sun with surrounding triangular rays slowly rotating while the core glows and pulses",
    tags: ["summer", "sun", "rotate", "rays"],
    previewType: "box",
    cssCode: `/* Summer Sun Rotate */
.roycss-seasonal-sun-rotate {
  position: relative;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, #fef3c7 0%, #fbbf24 40%, #f59e0b 80%, #f97316 100%);
  border-radius: 50%;
  box-shadow: 0 0 30px rgba(251, 191, 36, 0.7), 0 0 60px rgba(245, 158, 11, 0.4);
  animation: roy-b14-sun-core-pulse 2s ease-in-out infinite;
}
.roycss-seasonal-sun-rotate::before,
.roycss-seasonal-sun-rotate::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 160px;
  height: 160px;
  transform: translate(-50%, -50%);
  background:
    conic-gradient(from 0deg,
      transparent 0deg, transparent 10deg,
      #fbbf24 11deg, #fbbf24 19deg,
      transparent 20deg, transparent 35deg,
      #fbbf24 36deg, #fbbf24 44deg,
      transparent 45deg, transparent 60deg,
      #fbbf24 61deg, #fbbf24 69deg,
      transparent 70deg, transparent 85deg,
      #fbbf24 86deg, #fbbf24 94deg,
      transparent 95deg, transparent 110deg,
      #fbbf24 111deg, #fbbf24 119deg,
      transparent 120deg, transparent 135deg,
      #fbbf24 136deg, #fbbf24 144deg,
      transparent 145deg, transparent 160deg,
      #fbbf24 161deg, #fbbf24 169deg,
      transparent 170deg, transparent 185deg,
      #fbbf24 186deg, #fbbf24 194deg,
      transparent 195deg, transparent 210deg,
      #fbbf24 211deg, #fbbf24 219deg,
      transparent 220deg, transparent 235deg,
      #fbbf24 236deg, #fbbf24 244deg,
      transparent 245deg, transparent 260deg,
      #fbbf24 261deg, #fbbf24 269deg,
      transparent 270deg, transparent 285deg,
      #fbbf24 286deg, #fbbf24 294deg,
      transparent 295deg, transparent 310deg,
      #fbbf24 311deg, #fbbf24 319deg,
      transparent 320deg, transparent 335deg,
      #fbbf24 336deg, #fbbf24 344deg,
      transparent 345deg, transparent 360deg);
  border-radius: 50%;
}
.roycss-seasonal-sun-rotate::before {
  animation: roy-b14-sun-rays-rotate 12s linear infinite;
}
.roycss-seasonal-sun-rotate::after {
  animation: roy-b14-sun-rays-rotate 8s linear infinite reverse;
  opacity: 0.5;
}
@keyframes roy-b14-sun-rays-rotate {
  0%   { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes roy-b14-sun-core-pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.7), 0 0 60px rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 45px rgba(251, 191, 36, 1), 0 0 80px rgba(245, 158, 11, 0.6); }
}`,
  },
];
