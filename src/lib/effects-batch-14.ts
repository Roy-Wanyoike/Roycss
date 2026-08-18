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
  background: linear-gradient(to bottom, oklch(0.33 0.045 23.94) 0%, oklch(0.471 0.112 50.85) 60%, oklch(0.272 0.048 45.86) 100%);
}
.roycss-seasonal-falling-leaves span {
  position: absolute;
  inset-block-start: -20px;
  inline-size: 14px;
  block-size: 14px;
  background: oklch(0.666 0.157 58.32);
  border-radius: 0 100% 0 100%;
  color: transparent;
  font-size: 0;
  animation: roy-b14-leaf-fall 5s linear infinite;
}
.roycss-seasonal-falling-leaves span:nth-child(1) { inset-inline-start: 8%;  animation-delay: 0s;   background: oklch(0.577 0.215 27.33); transform-origin: center; }
.roycss-seasonal-falling-leaves span:nth-child(2) { inset-inline-start: 28%; animation-delay: 0.8s; background: oklch(0.769 0.165 70.08); }
.roycss-seasonal-falling-leaves span:nth-child(3) { inset-inline-start: 48%; animation-delay: 1.6s; background: oklch(0.555 0.146 49); }
.roycss-seasonal-falling-leaves span:nth-child(4) { inset-inline-start: 68%; animation-delay: 2.4s; background: oklch(0.577 0.215 27.33); }
.roycss-seasonal-falling-leaves span:nth-child(5) { inset-inline-start: 85%; animation-delay: 3.2s; background: oklch(0.769 0.165 70.08); }
.roycss-seasonal-falling-leaves span:nth-child(6) { inset-inline-start: 18%; animation-delay: 1.2s; background: oklch(0.473 0.125 46.2); }
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
  background: linear-gradient(to bottom, oklch(0.346 0.074 256.04) 0%, oklch(0.435 0.091 255.18) 50%, oklch(0.333 0.077 257.1) 100%);
}
.roycss-seasonal-snowfall-gentle span {
  position: absolute;
  inset-block-start: -10px;
  inline-size: 6px;
  block-size: 6px;
  border-radius: 50%;
  background: oklch(1 0 89.88);
  box-shadow: 0 0 4px color-mix(in oklch, oklch(1 0 89.88) 80%, transparent);
  color: transparent;
  font-size: 0;
  animation: roy-b14-snow-drift 6s linear infinite;
}
.roycss-seasonal-snowfall-gentle span:nth-child(1) { inset-inline-start: 6%;  inline-size: 8px; block-size: 8px; animation-delay: 0s;   animation-duration: 5s; }
.roycss-seasonal-snowfall-gentle span:nth-child(2) { inset-inline-start: 18%; inline-size: 4px; block-size: 4px; animation-delay: 0.7s; animation-duration: 7s; }
.roycss-seasonal-snowfall-gentle span:nth-child(3) { inset-inline-start: 30%; inline-size: 7px; block-size: 7px; animation-delay: 1.4s; animation-duration: 6s; }
.roycss-seasonal-snowfall-gentle span:nth-child(4) { inset-inline-start: 42%; inline-size: 5px; block-size: 5px; animation-delay: 2.1s; animation-duration: 8s; }
.roycss-seasonal-snowfall-gentle span:nth-child(5) { inset-inline-start: 54%; inline-size: 9px; block-size: 9px; animation-delay: 2.8s; animation-duration: 5.5s; }
.roycss-seasonal-snowfall-gentle span:nth-child(6) { inset-inline-start: 66%; inline-size: 4px; block-size: 4px; animation-delay: 3.5s; animation-duration: 7.5s; }
.roycss-seasonal-snowfall-gentle span:nth-child(7) { inset-inline-start: 78%; inline-size: 6px; block-size: 6px; animation-delay: 4.2s; animation-duration: 6.5s; }
.roycss-seasonal-snowfall-gentle span:nth-child(8) { inset-inline-start: 90%; inline-size: 5px; block-size: 5px; animation-delay: 4.9s; animation-duration: 6s; }
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
  background: linear-gradient(to bottom, oklch(0.615 0.049 160.82) 0%, oklch(0.497 0.047 161.62) 60%, oklch(0.382 0.042 164.39) 100%);
}
.roycss-seasonal-rain-spring span {
  position: absolute;
  inset-block-start: -30px;
  inline-size: 2px;
  block-size: 14px;
  background: linear-gradient(to bottom, transparent, color-mix(in oklch, oklch(0.883 0.026 229.16) 85%, transparent));
  border-radius: 1px;
  color: transparent;
  font-size: 0;
  animation: roy-b14-rain-drop 1.2s linear infinite;
}
.roycss-seasonal-rain-spring span:nth-child(1)  { inset-inline-start: 5%;  animation-delay: 0s;    animation-duration: 1s; }
.roycss-seasonal-rain-spring span:nth-child(2)  { inset-inline-start: 14%; animation-delay: 0.2s;  animation-duration: 1.3s; }
.roycss-seasonal-rain-spring span:nth-child(3)  { inset-inline-start: 23%; animation-delay: 0.5s;  animation-duration: 0.9s; }
.roycss-seasonal-rain-spring span:nth-child(4)  { inset-inline-start: 32%; animation-delay: 0.7s;  animation-duration: 1.1s; }
.roycss-seasonal-rain-spring span:nth-child(5)  { inset-inline-start: 41%; animation-delay: 0.1s;  animation-duration: 1.4s; }
.roycss-seasonal-rain-spring span:nth-child(6)  { inset-inline-start: 50%; animation-delay: 0.4s;  animation-duration: 1s; }
.roycss-seasonal-rain-spring span:nth-child(7)  { inset-inline-start: 59%; animation-delay: 0.6s;  animation-duration: 1.2s; }
.roycss-seasonal-rain-spring span:nth-child(8)  { inset-inline-start: 68%; animation-delay: 0.9s;  animation-duration: 0.95s; }
.roycss-seasonal-rain-spring span:nth-child(9)  { inset-inline-start: 77%; animation-delay: 0.3s;  animation-duration: 1.15s; }
.roycss-seasonal-rain-spring span:nth-child(10) { inset-inline-start: 86%; animation-delay: 0.8s;  animation-duration: 1.25s; }
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
  background: linear-gradient(to bottom, oklch(0.944 0.033 349.06) 0%, oklch(0.874 0.077 353.75) 50%, oklch(0.808 0.124 354.57) 100%);
}
.roycss-seasonal-petals-blossom span {
  position: absolute;
  inset-block-start: -20px;
  inline-size: 12px;
  block-size: 12px;
  background: oklch(0.731 0.182 359.15);
  border-radius: 150% 0 150% 0;
  color: transparent;
  font-size: 0;
  animation: roy-b14-petal-drift 6s linear infinite;
}
.roycss-seasonal-petals-blossom span:nth-child(1) { inset-inline-start: 5%;  animation-delay: 0s;   background: oklch(0.781 0.142 357.56); }
.roycss-seasonal-petals-blossom span:nth-child(2) { inset-inline-start: 20%; animation-delay: 0.8s; background: oklch(0.731 0.182 359.15); }
.roycss-seasonal-petals-blossom span:nth-child(3) { inset-inline-start: 35%; animation-delay: 1.6s; background: oklch(0.847 0.096 353.94); }
.roycss-seasonal-petals-blossom span:nth-child(4) { inset-inline-start: 50%; animation-delay: 2.4s; background: oklch(0.703 0.202 3.08); }
.roycss-seasonal-petals-blossom span:nth-child(5) { inset-inline-start: 65%; animation-delay: 3.2s; background: oklch(0.781 0.142 357.56); }
.roycss-seasonal-petals-blossom span:nth-child(6) { inset-inline-start: 80%; animation-delay: 4s;   background: oklch(0.731 0.182 359.15); }
.roycss-seasonal-petals-blossom span:nth-child(7) { inset-inline-start: 12%; animation-delay: 4.8s; background: oklch(0.847 0.096 353.94); }
.roycss-seasonal-petals-blossom span:nth-child(8) { inset-inline-start: 72%; animation-delay: 5.4s; background: oklch(0.703 0.202 3.08); }
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
  background: radial-gradient(ellipse at center, oklch(0.174 0.07 276.31) 0%, oklch(0.078 0.054 264.05) 100%);
}
.roycss-seasonal-fireworks-newyear span {
  --tx: 0px;
  --ty: 0px;
  position: absolute;
  inset-block-start: 40%;
  inset-inline-start: 50%;
  inline-size: 5px;
  block-size: 5px;
  border-radius: 50%;
  color: transparent;
  font-size: 0;
  animation: roy-b14-fw-burst 2s ease-out infinite;
}
.roycss-seasonal-fireworks-newyear span:nth-child(1) { --tx: 50px;  --ty: -50px; background: oklch(0.837 0.164 84.43); box-shadow: 0 0 6px oklch(0.837 0.164 84.43); animation-delay: 0s; }
.roycss-seasonal-fireworks-newyear span:nth-child(2) { --tx: -55px; --ty: -45px; background: oklch(0.637 0.208 25.33); box-shadow: 0 0 6px oklch(0.637 0.208 25.33); animation-delay: 0.1s; }
.roycss-seasonal-fireworks-newyear span:nth-child(3) { --tx: 60px;  --ty: 35px;  background: oklch(0.696 0.149 162.48); box-shadow: 0 0 6px oklch(0.696 0.149 162.48); animation-delay: 0.2s; }
.roycss-seasonal-fireworks-newyear span:nth-child(4) { --tx: -50px; --ty: 40px;  background: oklch(0.623 0.188 259.81); box-shadow: 0 0 6px oklch(0.623 0.188 259.81); animation-delay: 0.3s; }
.roycss-seasonal-fireworks-newyear span:nth-child(5) { --tx: 0px;   --ty: -65px; background: oklch(0.656 0.212 354.31); box-shadow: 0 0 6px oklch(0.656 0.212 354.31); animation-delay: 0.4s; }
.roycss-seasonal-fireworks-newyear span:nth-child(6) { --tx: 45px;  --ty: -20px; background: oklch(0.606 0.219 292.72); box-shadow: 0 0 6px oklch(0.606 0.219 292.72); animation-delay: 0.5s; }
.roycss-seasonal-fireworks-newyear span:nth-child(7) { --tx: -40px; --ty: -15px; background: oklch(0.705 0.187 47.6); box-shadow: 0 0 6px oklch(0.705 0.187 47.6); animation-delay: 0.6s; }
.roycss-seasonal-fireworks-newyear span:nth-child(8) { --tx: 35px;  --ty: 55px;  background: oklch(0.715 0.126 215.22); box-shadow: 0 0 6px oklch(0.715 0.126 215.22); animation-delay: 0.7s; }
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
  background: linear-gradient(to bottom, oklch(0.914 0.047 1.69) 0%, oklch(0.844 0.091 2.81) 60%, oklch(0.769 0.144 4.69) 100%);
}
.roycss-seasonal-hearts-valentine span {
  position: absolute;
  inset-block-end: -25px;
  inline-size: 14px;
  block-size: 14px;
  background: oklch(0.586 0.222 17.58);
  color: transparent;
  font-size: 0;
  transform: rotate(-45deg);
  animation: roy-b14-heart-rise 5s ease-in infinite;
}
.roycss-seasonal-hearts-valentine span::before,
.roycss-seasonal-hearts-valentine span::after {
  content: "";
  position: absolute;
  inline-size: 14px;
  block-size: 14px;
  border-radius: 50%;
  background: inherit;
}
.roycss-seasonal-hearts-valentine span::before { inset-block-start: -7px; inset-inline-start: 0; }
.roycss-seasonal-hearts-valentine span::after  { inset-inline-start: 7px;  inset-block-start: 0; }
.roycss-seasonal-hearts-valentine span:nth-child(1) { inset-inline-start: 8%;  animation-delay: 0s;   background: oklch(0.586 0.222 17.58); }
.roycss-seasonal-hearts-valentine span:nth-child(2) { inset-inline-start: 22%; animation-delay: 0.6s; background: oklch(0.645 0.215 16.44); transform: rotate(-45deg) scale(0.8); }
.roycss-seasonal-hearts-valentine span:nth-child(3) { inset-inline-start: 36%; animation-delay: 1.2s; background: oklch(0.656 0.212 354.31); }
.roycss-seasonal-hearts-valentine span:nth-child(4) { inset-inline-start: 50%; animation-delay: 1.8s; background: oklch(0.586 0.222 17.58); transform: rotate(-45deg) scale(1.1); }
.roycss-seasonal-hearts-valentine span:nth-child(5) { inset-inline-start: 62%; animation-delay: 2.4s; background: oklch(0.645 0.215 16.44); }
.roycss-seasonal-hearts-valentine span:nth-child(6) { inset-inline-start: 74%; animation-delay: 3s;   background: oklch(0.656 0.212 354.31); transform: rotate(-45deg) scale(0.9); }
.roycss-seasonal-hearts-valentine span:nth-child(7) { inset-inline-start: 86%; animation-delay: 3.6s; background: oklch(0.586 0.222 17.58); }
.roycss-seasonal-hearts-valentine span:nth-child(8) { inset-inline-start: 16%; animation-delay: 4.2s; background: oklch(0.645 0.215 16.44); transform: rotate(-45deg) scale(1); }
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
  background: linear-gradient(to bottom, oklch(0.815 0.082 225.75) 0%, oklch(0.773 0.127 231.11) 50%, oklch(0.734 0.145 234.62) 100%);
}
.roycss-seasonal-bubbles-summer span {
  position: absolute;
  inset-block-end: -20px;
  inline-size: 14px;
  block-size: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, color-mix(in oklch, oklch(1 0 89.88) 90%, transparent), color-mix(in oklch, oklch(1 0 89.88) 20%, transparent) 50%, color-mix(in oklch, oklch(0.818 0.094 251.36) 10%, transparent));
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
  color: transparent;
  font-size: 0;
  animation: roy-b14-bubble-rise 6s ease-in infinite;
}
.roycss-seasonal-bubbles-summer span:nth-child(1) { inset-inline-start: 8%;  inline-size: 18px; block-size: 18px; animation-delay: 0s; }
.roycss-seasonal-bubbles-summer span:nth-child(2) { inset-inline-start: 20%; inline-size: 10px; block-size: 10px; animation-delay: 0.7s; }
.roycss-seasonal-bubbles-summer span:nth-child(3) { inset-inline-start: 32%; inline-size: 16px; block-size: 16px; animation-delay: 1.4s; }
.roycss-seasonal-bubbles-summer span:nth-child(4) { inset-inline-start: 44%; inline-size: 8px;  block-size: 8px;  animation-delay: 2.1s; }
.roycss-seasonal-bubbles-summer span:nth-child(5) { inset-inline-start: 56%; inline-size: 20px; block-size: 20px; animation-delay: 2.8s; }
.roycss-seasonal-bubbles-summer span:nth-child(6) { inset-inline-start: 68%; inline-size: 12px; block-size: 12px; animation-delay: 3.5s; }
.roycss-seasonal-bubbles-summer span:nth-child(7) { inset-inline-start: 80%; inline-size: 14px; block-size: 14px; animation-delay: 4.2s; }
.roycss-seasonal-bubbles-summer span:nth-child(8) { inset-inline-start: 92%; inline-size: 9px;  block-size: 9px;  animation-delay: 4.9s; }
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
  background: radial-gradient(ellipse at 50% 80%, oklch(0.324 0.064 64.67) 0%, oklch(0.175 0.029 58.39) 50%, oklch(0 0 0) 100%);
}
.roycss-seasonal-sparks-diwali span {
  --tx: 0px;
  --ty: 0px;
  position: absolute;
  inset-block-end: 30%;
  inset-inline-start: 50%;
  inline-size: 3px;
  block-size: 3px;
  border-radius: 50%;
  background: oklch(0.837 0.164 84.43);
  box-shadow: 0 0 6px oklch(0.837 0.164 84.43), 0 0 12px oklch(0.769 0.165 70.08);
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
  background: linear-gradient(to bottom, oklch(0.973 0.069 103.19) 0%, oklch(0.924 0.115 95.75) 50%, oklch(0.879 0.153 91.61) 100%);
}
.roycss-seasonal-pollen-spring span {
  position: absolute;
  inline-size: 3px;
  block-size: 3px;
  border-radius: 50%;
  background: oklch(0.861 0.173 91.94);
  box-shadow: 0 0 3px color-mix(in oklch, oklch(0.861 0.173 91.94) 70%, transparent);
  color: transparent;
  font-size: 0;
  animation: roy-b14-pollen-float 8s ease-in-out infinite;
}
.roycss-seasonal-pollen-spring span:nth-child(1)  { inset-block-start: 20%; inset-inline-start: -10px; animation-delay: 0s; }
.roycss-seasonal-pollen-spring span:nth-child(2)  { inset-block-start: 35%; inset-inline-start: -10px; animation-delay: 0.8s; }
.roycss-seasonal-pollen-spring span:nth-child(3)  { inset-block-start: 50%; inset-inline-start: -10px; animation-delay: 1.6s; }
.roycss-seasonal-pollen-spring span:nth-child(4)  { inset-block-start: 65%; inset-inline-start: -10px; animation-delay: 2.4s; }
.roycss-seasonal-pollen-spring span:nth-child(5)  { inset-block-start: 25%; inset-inline-start: -10px; animation-delay: 3.2s; }
.roycss-seasonal-pollen-spring span:nth-child(6)  { inset-block-start: 45%; inset-inline-start: -10px; animation-delay: 4s; }
.roycss-seasonal-pollen-spring span:nth-child(7)  { inset-block-start: 75%; inset-inline-start: -10px; animation-delay: 4.8s; }
.roycss-seasonal-pollen-spring span:nth-child(8)  { inset-block-start: 15%; inset-inline-start: -10px; animation-delay: 5.6s; }
.roycss-seasonal-pollen-spring span:nth-child(9)  { inset-block-start: 55%; inset-inline-start: -10px; animation-delay: 6.4s; }
.roycss-seasonal-pollen-spring span:nth-child(10) { inset-block-start: 80%; inset-inline-start: -10px; animation-delay: 7.2s; }
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
    radial-gradient(1px 1px at 20% 30%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 60% 70%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 80% 20%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 30% 80%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 90% 50%, oklch(1 0 89.88), transparent),
    linear-gradient(to bottom, oklch(0.182 0.046 271.58) 0%, oklch(0.24 0.067 280.09) 50%, oklch(0.131 0.043 278.66) 100%);
}
.roycss-seasonal-meteor-shower span {
  position: absolute;
  inset-block-start: -20px;
  inset-inline-start: -50px;
  inline-size: 3px;
  block-size: 3px;
  background: oklch(1 0 89.88);
  border-radius: 50%;
  box-shadow: 0 0 6px oklch(1 0 89.88);
  color: transparent;
  font-size: 0;
  animation: roy-b14-meteor-streak 3s linear infinite;
}
.roycss-seasonal-meteor-shower span::before {
  content: "";
  position: absolute;
  inset-block-start: 1px;
  inset-inline-end: 0;
  inline-size: 60px;
  block-size: 1px;
  background: linear-gradient(to left, oklch(1 0 89.88), transparent);
  transform-origin: right center;
}
.roycss-seasonal-meteor-shower span:nth-child(1) { inset-block-start: 5%;  animation-delay: 0s;   animation-duration: 2.5s; }
.roycss-seasonal-meteor-shower span:nth-child(2) { inset-block-start: 20%; animation-delay: 0.8s; animation-duration: 3s; }
.roycss-seasonal-meteor-shower span:nth-child(3) { inset-block-start: 40%; animation-delay: 1.6s; animation-duration: 2.8s; }
.roycss-seasonal-meteor-shower span:nth-child(4) { inset-block-start: 60%; animation-delay: 2.4s; animation-duration: 3.2s; }
.roycss-seasonal-meteor-shower span:nth-child(5) { inset-block-start: 80%; animation-delay: 3.2s; animation-duration: 2.6s; }
.roycss-seasonal-meteor-shower span:nth-child(6) { inset-block-start: 15%; animation-delay: 4s;   animation-duration: 3.4s; }
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.23 0.063 263.86) 0%, oklch(0.305 0.07 261.27) 50%, oklch(0.373 0.086 265.39) 100%);
}
.roycss-seasonal-christmas-tree::before {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 25%;
  background: linear-gradient(to top, oklch(1 0 89.88) 0%, oklch(0.93 0.033 272.79) 60%, transparent 100%);
  border-radius: 50% 50% 0 0 / 30% 30% 0 0;
}
.roycss-seasonal-christmas-tree::after {
  content: "";
  position: absolute;
  inset-block-end: 20%;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 0;
  block-size: 0;
  border-inline-start: 80px solid transparent;
  border-inline-end: 80px solid transparent;
  border-block-end: 200px solid oklch(0.527 0.137 150.07);
  box-shadow:
    0 -60px 0 -20px oklch(0.627 0.17 149.21),
    0 -120px 0 -45px oklch(0.723 0.192 149.58);
  background:
    radial-gradient(circle at 40% 30%, oklch(0.837 0.164 84.43) 4px, transparent 5px),
    radial-gradient(circle at 60% 50%, oklch(0.637 0.208 25.33) 4px, transparent 5px),
    radial-gradient(circle at 30% 70%, oklch(0.623 0.188 259.81) 4px, transparent 5px),
    radial-gradient(circle at 70% 80%, oklch(0.656 0.212 354.31) 4px, transparent 5px);
}
.roycss-seasonal-christmas-tree > .star {
  position: absolute;
  inset-block-start: 8%;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 20px;
  block-size: 20px;
  background: oklch(0.837 0.164 84.43);
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  filter: drop-shadow(0 0 8px oklch(0.837 0.164 84.43));
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: radial-gradient(ellipse at center, oklch(0.263 0.065 306.93) 0%, oklch(0.131 0.027 306.06) 80%);
}
.roycss-seasonal-pumpkin-jackolantern::before {
  content: "";
  position: absolute;
  inset-block-end: 15%;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 180px;
  block-size: 140px;
  background:
    radial-gradient(ellipse at 30% 50%, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 0%, transparent 35%),
    radial-gradient(ellipse at 70% 50%, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 0%, transparent 35%),
    linear-gradient(to right, oklch(0.555 0.146 49) 0%, oklch(0.646 0.194 41.12) 30%, oklch(0.705 0.187 47.6) 50%, oklch(0.646 0.194 41.12) 70%, oklch(0.555 0.146 49) 100%);
  border-radius: 50% 50% 45% 45% / 55% 55% 45% 45%;
  box-shadow: 0 0 60px color-mix(in oklch, oklch(0.705 0.187 47.6) 50%, transparent);
}
.roycss-seasonal-pumpkin-jackolantern::after {
  content: "";
  position: absolute;
  inset-block-end: 18%;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 160px;
  block-size: 100px;
  background:
    radial-gradient(ellipse at 25% 30%, oklch(0.837 0.164 84.43) 0%, oklch(0.837 0.164 84.43) 12px, transparent 13px),
    radial-gradient(ellipse at 75% 30%, oklch(0.837 0.164 84.43) 0%, oklch(0.837 0.164 84.43) 12px, transparent 13px),
    radial-gradient(ellipse at 50% 70%, oklch(0.837 0.164 84.43) 0%, oklch(0.837 0.164 84.43) 25px, transparent 26px);
  filter: drop-shadow(0 0 8px oklch(0.837 0.164 84.43));
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse 30px 40px at 20% 30%, oklch(0.899 0.059 343.23) 0%, oklch(0.899 0.059 343.23) 70%, transparent 71%),
    radial-gradient(ellipse 30px 40px at 70% 60%, oklch(0.925 0.081 155.99) 0%, oklch(0.925 0.081 155.99) 70%, transparent 71%),
    radial-gradient(ellipse 30px 40px at 40% 80%, oklch(0.882 0.057 254.13) 0%, oklch(0.882 0.057 254.13) 70%, transparent 71%),
    radial-gradient(ellipse 30px 40px at 90% 25%, oklch(0.945 0.124 101.54) 0%, oklch(0.945 0.124 101.54) 70%, transparent 71%),
    radial-gradient(ellipse 30px 40px at 10% 70%, oklch(0.894 0.055 293.28) 0%, oklch(0.894 0.055 293.28) 70%, transparent 71%),
    linear-gradient(135deg, oklch(0.974 0.013 347.94) 0%, oklch(0.982 0.018 155.83) 50%, oklch(0.97 0.014 254.6) 100%);
  background-size: 180px 180px;
}
.roycss-seasonal-easter-egg::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(45deg, transparent 0px, transparent 6px, color-mix(in oklch, oklch(0.656 0.212 354.31) 15%, transparent) 6px, color-mix(in oklch, oklch(0.656 0.212 354.31) 15%, transparent) 8px),
    repeating-linear-gradient(-45deg, transparent 0px, transparent 6px, color-mix(in oklch, oklch(0.623 0.188 259.81) 15%, transparent) 6px, color-mix(in oklch, oklch(0.623 0.188 259.81) 15%, transparent) 8px);
}
.roycss-seasonal-easter-egg::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 3px at 25% 25%, color-mix(in oklch, oklch(1 0 89.88) 60%, transparent), transparent),
    radial-gradient(circle 3px at 75% 75%, color-mix(in oklch, oklch(1 0 89.88) 60%, transparent), transparent),
    radial-gradient(circle 3px at 50% 50%, color-mix(in oklch, oklch(1 0 89.88) 60%, transparent), transparent);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 25% 25%, oklch(0.586 0.222 17.58) 6px, transparent 7px),
    radial-gradient(circle at 75% 75%, oklch(0.586 0.222 17.58) 6px, transparent 7px),
    radial-gradient(circle at 75% 25%, oklch(0.656 0.212 354.31) 5px, transparent 6px),
    radial-gradient(circle at 25% 75%, oklch(0.656 0.212 354.31) 5px, transparent 6px),
    linear-gradient(135deg, oklch(0.97 0.016 358.03) 0%, oklch(0.943 0.031 357.83) 50%, oklch(0.904 0.054 359.42) 100%);
  background-size: 80px 80px;
}
.roycss-seasonal-heart-valentine::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, oklch(0.514 0.198 16.93) 8px, transparent 9px);
  background-size: 80px 80px;
  background-position: 40px 40px;
}
.roycss-seasonal-heart-valentine::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(45deg, transparent 0px, transparent 40px, color-mix(in oklch, oklch(0.586 0.222 17.58) 5%, transparent) 40px, color-mix(in oklch, oklch(0.586 0.222 17.58) 5%, transparent) 42px);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(1px 1px at 10% 20%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 25% 60%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 50% 25%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 75% 70%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 90% 35%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 35% 85%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 60% 90%, oklch(1 0 89.88), transparent),
    radial-gradient(circle at 22% 35%, color-mix(in oklch, oklch(0.837 0.164 84.43) 50%, transparent) 0%, transparent 8%),
    radial-gradient(circle at 75% 30%, color-mix(in oklch, oklch(0.637 0.208 25.33) 50%, transparent) 0%, transparent 8%),
    radial-gradient(circle at 50% 55%, color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent) 0%, transparent 8%),
    radial-gradient(circle at 30% 70%, color-mix(in oklch, oklch(0.623 0.188 259.81) 50%, transparent) 0%, transparent 8%),
    radial-gradient(circle at 85% 75%, color-mix(in oklch, oklch(0.656 0.212 354.31) 50%, transparent) 0%, transparent 8%),
    linear-gradient(to bottom, oklch(0.131 0.043 278.66) 0%, oklch(0.184 0.064 277.97) 50%, oklch(0.131 0.043 278.66) 100%);
}
.roycss-seasonal-firework-sky::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 2px at 22% 35%, oklch(0.837 0.164 84.43), transparent),
    radial-gradient(circle 2px at 75% 30%, oklch(0.637 0.208 25.33), transparent),
    radial-gradient(circle 2px at 50% 55%, oklch(0.696 0.149 162.48), transparent),
    radial-gradient(circle 2px at 30% 70%, oklch(0.623 0.188 259.81), transparent),
    radial-gradient(circle 2px at 85% 75%, oklch(0.656 0.212 354.31), transparent);
  animation: roy-b14-fw-twinkle 2s ease-in-out infinite;
}
.roycss-seasonal-firework-sky::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 1px at 15% 45%, color-mix(in oklch, oklch(1 0 89.88) 60%, transparent), transparent),
    radial-gradient(circle 1px at 65% 15%, color-mix(in oklch, oklch(1 0 89.88) 60%, transparent), transparent),
    radial-gradient(circle 1px at 45% 65%, color-mix(in oklch, oklch(1 0 89.88) 60%, transparent), transparent);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom,
      oklch(0.905 0.166 98.11) 0%,
      oklch(0.758 0.159 55.93) 20%,
      oklch(0.705 0.187 47.6) 40%,
      oklch(0.577 0.215 27.33) 60%,
      oklch(0.408 0.116 38.17) 85%,
      oklch(0.266 0.076 36.26) 100%);
}
.roycss-seasonal-autumn-gradient::before {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 40%;
  background: oklch(0.163 0.042 45.01);
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
  inset-block-start: 25%;
  inset-inline-start: 30%;
  inline-size: 80px;
  block-size: 80px;
  background: radial-gradient(circle, color-mix(in oklch, oklch(0.945 0.124 101.54) 70%, transparent) 0%, transparent 60%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.856 0.041 239.08) 0%, oklch(0.921 0.024 234.43) 40%, oklch(0.972 0.009 232.36) 70%, oklch(1 0 89.88) 100%);
}
.roycss-seasonal-winter-snow-scene::before {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 50%;
  background:
    radial-gradient(ellipse 30px 50px at 15% 70%, oklch(0.527 0.137 150.07) 0%, oklch(0.527 0.137 150.07) 60%, transparent 61%),
    radial-gradient(ellipse 30px 50px at 80% 75%, oklch(0.448 0.108 151.33) 0%, oklch(0.448 0.108 151.33) 60%, transparent 61%),
    linear-gradient(to top, oklch(1 0 89.88) 0%, oklch(0.972 0.009 232.36) 50%, transparent 100%);
  clip-path: polygon(
    0% 100%, 0% 60%, 10% 55%, 20% 70%, 35% 45%, 50% 65%, 65% 40%, 80% 60%, 100% 50%, 100% 100%
  );
}
.roycss-seasonal-winter-snow-scene::after {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 30%;
  background: linear-gradient(to top, oklch(1 0 89.88) 0%, oklch(0.95 0.014 238.01) 60%, transparent 100%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.815 0.082 225.75) 0%, oklch(0.885 0.051 230.93) 40%, oklch(0.92 0.053 158.85) 65%, oklch(0.871 0.136 154.45) 100%);
}
.roycss-seasonal-spring-meadow::before {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 55%;
  background:
    radial-gradient(circle 4px at 20% 50%, oklch(0.837 0.164 84.43), transparent),
    radial-gradient(circle 4px at 35% 65%, oklch(0.656 0.212 354.31), transparent),
    radial-gradient(circle 4px at 55% 55%, oklch(0.837 0.164 84.43), transparent),
    radial-gradient(circle 4px at 70% 70%, oklch(0.656 0.212 354.31), transparent),
    radial-gradient(circle 4px at 85% 60%, oklch(0.837 0.164 84.43), transparent),
    radial-gradient(circle 4px at 25% 80%, oklch(0.656 0.212 354.31), transparent),
    radial-gradient(circle 4px at 50% 85%, oklch(0.837 0.164 84.43), transparent),
    radial-gradient(circle 4px at 80% 85%, oklch(0.656 0.212 354.31), transparent),
    linear-gradient(to top, oklch(0.723 0.192 149.58) 0%, oklch(0.8 0.182 151.71) 60%, transparent 100%);
  clip-path: polygon(
    0% 100%, 0% 50%, 15% 40%, 30% 55%, 50% 35%, 70% 50%, 85% 40%, 100% 55%, 100% 100%
  );
}
.roycss-seasonal-spring-meadow::after {
  content: "";
  position: absolute;
  inset-block-start: 15%;
  inset-inline-start: 70%;
  inline-size: 70px;
  block-size: 70px;
  background: radial-gradient(circle, oklch(0.962 0.058 95.62) 0%, oklch(0.924 0.115 95.75) 50%, transparent 70%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 30%, oklch(1 0 89.88) 0%, oklch(1 0 89.88) 8%, transparent 9%),
    conic-gradient(from 0deg at 50% 50%,
      oklch(0.637 0.208 25.33) 0deg, oklch(0.637 0.208 25.33) 60deg,
      oklch(1 0 89.88) 60deg, oklch(1 0 89.88) 120deg,
      oklch(0.623 0.188 259.81) 120deg, oklch(0.623 0.188 259.81) 180deg,
      oklch(1 0 89.88) 180deg, oklch(1 0 89.88) 240deg,
      oklch(0.837 0.164 84.43) 240deg, oklch(0.837 0.164 84.43) 300deg,
      oklch(1 0 89.88) 300deg, oklch(1 0 89.88) 360deg),
    oklch(0.973 0.069 103.19);
  background-size: 100px 100px, 80px 80px, 100% 100%;
  background-position: 30px 30px, 30px 30px, 0 0;
  background-repeat: repeat, repeat, repeat;
}
.roycss-seasonal-summer-beach-ball::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 80% 20%, color-mix(in oklch, oklch(1 0 89.88) 40%, transparent) 0%, transparent 30%),
    radial-gradient(circle at 20% 80%, color-mix(in oklch, oklch(1 0 89.88) 40%, transparent) 0%, transparent 30%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 75% 25%, oklch(0.962 0.058 95.62) 0%, oklch(0.924 0.115 95.75) 4%, transparent 12%),
    radial-gradient(circle at 75% 25%, color-mix(in oklch, oklch(1 0 89.88) 10%, transparent) 0%, transparent 20%),
    linear-gradient(to bottom, oklch(0.193 0.069 300.44) 0%, oklch(0.263 0.065 306.93) 40%, oklch(0.193 0.069 300.44) 70%, oklch(0.131 0.027 306.06) 100%);
}
.roycss-seasonal-halloween-spooky::before {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 50%;
  background:
    linear-gradient(to top,
      color-mix(in oklch, oklch(0.395 0.07 306.43) 40%, transparent) 0%,
      color-mix(in oklch, oklch(0.395 0.07 306.43) 30%, transparent) 30%,
      transparent 100%);
  filter: blur(8px);
  animation: roy-b14-fog-drift 12s ease-in-out infinite alternate;
}
.roycss-seasonal-halloween-spooky::after {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 40%;
  background: oklch(0.131 0.027 306.06);
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
  inline-size: 120px;
  block-size: 120px;
  background: transparent;
}
.roycss-seasonal-snowflake-crystal::before,
.roycss-seasonal-snowflake-crystal::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 100px;
  block-size: 4px;
  background: linear-gradient(to right, transparent 0%, oklch(0.951 0.025 236.82) 20%, oklch(1 0 89.88) 50%, oklch(0.951 0.025 236.82) 80%, transparent 100%);
  border-radius: 2px;
  transform-origin: center;
  box-shadow: 0 0 8px color-mix(in oklch, oklch(1 0 89.88) 80%, transparent);
}
.roycss-seasonal-snowflake-crystal::before {
  transform: translate(-50%, -50%) rotate(0deg);
}
.roycss-seasonal-snowflake-crystal::after {
  transform: translate(-50%, -50%) rotate(60deg);
  box-shadow:
    0 0 8px color-mix(in oklch, oklch(1 0 89.88) 80%, transparent),
    -50px 0 0 -2px oklch(1 0 89.88),
    -42px -8px 0 -2px oklch(1 0 89.88),
    -42px 8px 0 -2px oklch(1 0 89.88),
    50px 0 0 -2px oklch(1 0 89.88),
    42px -8px 0 -2px oklch(1 0 89.88),
    42px 8px 0 -2px oklch(1 0 89.88);
}
.roycss-seasonal-snowflake-crystal {
  background:
    linear-gradient(to right, transparent 0%, oklch(0.951 0.025 236.82) 20%, oklch(1 0 89.88) 50%, oklch(0.951 0.025 236.82) 80%, transparent 100%),
    transparent;
  background-size: 100px 4px, 100% 100%;
  background-position: center center, center;
  background-repeat: no-repeat;
  animation: roy-b14-snowflake-shimmer 3s ease-in-out infinite;
}
@keyframes roy-b14-snowflake-shimmer {
  0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 4px color-mix(in oklch, oklch(1 0 89.88) 50%, transparent)); }
  50% { opacity: 1; filter: drop-shadow(0 0 12px color-mix(in oklch, oklch(1 0 89.88) 90%, transparent)); }
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
  inline-size: 120px;
  block-size: 100px;
  background:
    radial-gradient(ellipse at 30% 50%, color-mix(in oklch, oklch(0 0 0) 30%, transparent) 0%, transparent 35%),
    radial-gradient(ellipse at 70% 50%, color-mix(in oklch, oklch(0 0 0) 30%, transparent) 0%, transparent 35%),
    radial-gradient(ellipse at center, oklch(0.705 0.187 47.6) 0%, oklch(0.646 0.194 41.12) 60%, oklch(0.47 0.143 37.3) 100%);
  border-radius: 50% 50% 45% 45% / 55% 55% 45% 45%;
  box-shadow:
    0 0 30px color-mix(in oklch, oklch(0.705 0.187 47.6) 60%, transparent),
    0 0 60px color-mix(in oklch, oklch(0.646 0.194 41.12) 40%, transparent),
    inset 0 -20px 30px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  animation: roy-b14-pumpkin-glow-pulse 2s ease-in-out infinite;
}
.roycss-seasonal-pumpkin-glow::before {
  content: "";
  position: absolute;
  inset-block-start: -18px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 12px;
  block-size: 22px;
  background: linear-gradient(to bottom, oklch(0.448 0.108 151.33) 0%, oklch(0.393 0.09 152.54) 100%);
  border-radius: 4px 4px 2px 2px;
}
.roycss-seasonal-pumpkin-glow::after {
  content: "";
  position: absolute;
  inset-block-start: 35%;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 60px;
  block-size: 30px;
  background:
    radial-gradient(ellipse at 25% 50%, oklch(0.837 0.164 84.43) 0%, oklch(0.837 0.164 84.43) 8px, transparent 9px),
    radial-gradient(ellipse at 75% 50%, oklch(0.837 0.164 84.43) 0%, oklch(0.837 0.164 84.43) 8px, transparent 9px),
    radial-gradient(ellipse at 50% 80%, oklch(0.837 0.164 84.43) 0%, oklch(0.837 0.164 84.43) 14px, transparent 15px);
  filter: drop-shadow(0 0 6px oklch(0.837 0.164 84.43));
}
@keyframes roy-b14-pumpkin-glow-pulse {
  0%, 100% { box-shadow: 0 0 30px color-mix(in oklch, oklch(0.705 0.187 47.6) 60%, transparent), 0 0 60px color-mix(in oklch, oklch(0.646 0.194 41.12) 40%, transparent), inset 0 -20px 30px color-mix(in oklch, oklch(0 0 0) 40%, transparent); }
  50% { box-shadow: 0 0 45px color-mix(in oklch, oklch(0.705 0.187 47.6) 90%, transparent), 0 0 90px color-mix(in oklch, oklch(0.646 0.194 41.12) 60%, transparent), inset 0 -20px 30px color-mix(in oklch, oklch(0 0 0) 40%, transparent); }
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
  inline-size: 100%;
  block-size: 80px;
  background: transparent;
}
.roycss-seasonal-christmas-lights::before {
  content: "";
  position: absolute;
  inset-block-start: 10px;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 2px;
  background: oklch(0.278 0.03 256.85);
  border-radius: 1px;
}
.roycss-seasonal-christmas-lights span {
  position: absolute;
  inset-block-start: 12px;
  inline-size: 14px;
  block-size: 22px;
  border-radius: 50% 50% 40% 40% / 60% 60% 40% 40%;
  color: transparent;
  font-size: 0;
  animation: roy-b14-light-blink 1.5s ease-in-out infinite;
}
.roycss-seasonal-christmas-lights span::before {
  content: "";
  position: absolute;
  inset-block-start: -4px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 8px;
  block-size: 4px;
  background: oklch(0.373 0.031 259.73);
  border-radius: 2px 2px 0 0;
}
.roycss-seasonal-christmas-lights span:nth-child(1) { inset-inline-start: 10%;  background: oklch(0.637 0.208 25.33); box-shadow: 0 0 10px oklch(0.637 0.208 25.33); animation-delay: 0s; }
.roycss-seasonal-christmas-lights span:nth-child(2) { inset-inline-start: 25%;  background: oklch(0.723 0.192 149.58); box-shadow: 0 0 10px oklch(0.723 0.192 149.58); animation-delay: 0.25s; }
.roycss-seasonal-christmas-lights span:nth-child(3) { inset-inline-start: 40%;  background: oklch(0.623 0.188 259.81); box-shadow: 0 0 10px oklch(0.623 0.188 259.81); animation-delay: 0.5s; }
.roycss-seasonal-christmas-lights span:nth-child(4) { inset-inline-start: 55%;  background: oklch(0.837 0.164 84.43); box-shadow: 0 0 10px oklch(0.837 0.164 84.43); animation-delay: 0.75s; }
.roycss-seasonal-christmas-lights span:nth-child(5) { inset-inline-start: 70%;  background: oklch(0.656 0.212 354.31); box-shadow: 0 0 10px oklch(0.656 0.212 354.31); animation-delay: 1s; }
.roycss-seasonal-christmas-lights span:nth-child(6) { inset-inline-start: 85%;  background: oklch(0.627 0.233 303.9); box-shadow: 0 0 10px oklch(0.627 0.233 303.9); animation-delay: 1.25s; }
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
  inline-size: 100px;
  block-size: 100px;
  background: transparent;
}
.roycss-seasonal-heart-pulse-valentine::before,
.roycss-seasonal-heart-pulse-valentine::after {
  content: "";
  position: absolute;
  inset-block-start: 20px;
  inset-inline-start: 18px;
  inline-size: 50px;
  block-size: 80px;
  background: oklch(0.586 0.222 17.58);
  border-radius: 50px 50px 0 0;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
  box-shadow: 0 0 30px color-mix(in oklch, oklch(0.586 0.222 17.58) 80%, transparent);
  animation: roy-b14-heart-pulse 1.2s ease-in-out infinite;
}
.roycss-seasonal-heart-pulse-valentine::after {
  inset-inline-start: 68px;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
}
@keyframes roy-b14-heart-pulse {
  0%, 100% { transform: rotate(-45deg) scale(1); box-shadow: 0 0 30px color-mix(in oklch, oklch(0.586 0.222 17.58) 80%, transparent); }
  15% { transform: rotate(-45deg) scale(1.15); box-shadow: 0 0 50px color-mix(in oklch, oklch(0.586 0.222 17.58) 100%, transparent); }
  30% { transform: rotate(-45deg) scale(1); }
  45% { transform: rotate(-45deg) scale(1.1); box-shadow: 0 0 45px color-mix(in oklch, oklch(0.586 0.222 17.58) 90%, transparent); }
}
.roycss-seasonal-heart-pulse-valentine::after {
  animation-name: roy-b14-heart-pulse-right;
}
@keyframes roy-b14-heart-pulse-right {
  0%, 100% { transform: rotate(45deg) scale(1); box-shadow: 0 0 30px color-mix(in oklch, oklch(0.586 0.222 17.58) 80%, transparent); }
  15% { transform: rotate(45deg) scale(1.15); box-shadow: 0 0 50px color-mix(in oklch, oklch(0.586 0.222 17.58) 100%, transparent); }
  30% { transform: rotate(45deg) scale(1); }
  45% { transform: rotate(45deg) scale(1.1); box-shadow: 0 0 45px color-mix(in oklch, oklch(0.586 0.222 17.58) 90%, transparent); }
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
  inline-size: 160px;
  block-size: 160px;
  background: radial-gradient(ellipse at center, oklch(0.174 0.07 276.31) 0%, oklch(0.131 0.043 278.66) 100%);
  border-radius: 8px;
  overflow: hidden;
}
.roycss-seasonal-firework-burst::before {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 140px;
  block-size: 140px;
  transform: translate(-50%, -50%);
  background:
    conic-gradient(from 0deg,
      oklch(0.837 0.164 84.43) 0deg, transparent 8deg, transparent 22deg,
      oklch(0.637 0.208 25.33) 30deg, transparent 38deg, transparent 52deg,
      oklch(0.696 0.149 162.48) 60deg, transparent 68deg, transparent 82deg,
      oklch(0.623 0.188 259.81) 90deg, transparent 98deg, transparent 112deg,
      oklch(0.656 0.212 354.31) 120deg, transparent 128deg, transparent 142deg,
      oklch(0.837 0.164 84.43) 150deg, transparent 158deg, transparent 172deg,
      oklch(0.637 0.208 25.33) 180deg, transparent 188deg, transparent 202deg,
      oklch(0.696 0.149 162.48) 210deg, transparent 218deg, transparent 232deg,
      oklch(0.623 0.188 259.81) 240deg, transparent 248deg, transparent 262deg,
      oklch(0.656 0.212 354.31) 270deg, transparent 278deg, transparent 292deg,
      oklch(0.837 0.164 84.43) 300deg, transparent 308deg, transparent 322deg,
      oklch(0.637 0.208 25.33) 330deg, transparent 338deg, transparent 352deg,
      transparent 360deg);
  border-radius: 50%;
  filter: blur(0.5px);
  animation: roy-b14-fw-expand 1.6s ease-out infinite;
}
.roycss-seasonal-firework-burst::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 8px;
  block-size: 8px;
  background: oklch(1 0 89.88);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 12px oklch(1 0 89.88);
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
  inline-size: 100px;
  block-size: 120px;
  background: color-mix(in oklch, oklch(1 0 89.88) 95%, transparent);
  border-radius: 50% 50% 0 0;
  box-shadow: 0 0 20px color-mix(in oklch, oklch(1 0 89.88) 50%, transparent);
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
  inset-block-start: 40px;
  inset-inline-start: 25px;
  inline-size: 14px;
  block-size: 18px;
  background: oklch(0.278 0.03 256.85);
  border-radius: 50%;
  box-shadow: 36px 0 0 oklch(0.278 0.03 256.85);
}
.roycss-seasonal-ghost-float::after {
  content: "";
  position: absolute;
  inset-block-start: 70px;
  inset-inline-start: 42px;
  inline-size: 14px;
  block-size: 8px;
  background: oklch(0.278 0.03 256.85);
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
  inline-size: 120px;
  block-size: 80px;
  background: transparent;
  animation: roy-b14-bat-fly-across 4s linear infinite;
}
.roycss-seasonal-bat-fly::before {
  content: "";
  position: absolute;
  inset-block-start: 30px;
  inset-inline-start: 50px;
  inline-size: 20px;
  block-size: 18px;
  background: oklch(0.131 0.027 306.06);
  border-radius: 50%;
  box-shadow:
    -20px -8px 0 -4px oklch(0.131 0.027 306.06),
    -35px -12px 0 -6px oklch(0.131 0.027 306.06),
    20px -8px 0 -4px oklch(0.131 0.027 306.06),
    35px -12px 0 -6px oklch(0.131 0.027 306.06);
}
.roycss-seasonal-bat-fly::after {
  content: "";
  position: absolute;
  inset-block-start: 25px;
  inset-inline-start: 20px;
  inline-size: 80px;
  block-size: 30px;
  background:
    radial-gradient(ellipse 40px 12px at 20% 50%, oklch(0.131 0.027 306.06) 0%, oklch(0.131 0.027 306.06) 50%, transparent 51%),
    radial-gradient(ellipse 40px 12px at 80% 50%, oklch(0.131 0.027 306.06) 0%, oklch(0.131 0.027 306.06) 50%, transparent 51%);
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
  inline-size: 120px;
  block-size: 120px;
  background: transparent;
  animation: roy-b14-hat-tilt 4s ease-in-out infinite;
}
.roycss-seasonal-witch-hat::before {
  content: "";
  position: absolute;
  inset-block-end: 10px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 0;
  block-size: 0;
  border-inline-start: 40px solid transparent;
  border-inline-end: 40px solid transparent;
  border-block-end: 90px solid oklch(0.131 0.027 306.06);
  filter: drop-shadow(0 -20px 0 -10px oklch(0.236 0.095 288.84));
}
.roycss-seasonal-witch-hat::after {
  content: "";
  position: absolute;
  inset-block-end: 8px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 100px;
  block-size: 18px;
  background:
    linear-gradient(to bottom, oklch(0.438 0.198 303.72) 0%, oklch(0.38 0.178 293.74) 50%, oklch(0.438 0.198 303.72) 100%);
  border-radius: 50% 50% 4px 4px / 30% 30% 4px 4px;
  box-shadow:
    inset 0 0 0 4px oklch(0.837 0.164 84.43),
    inset 0 0 0 6px oklch(0.438 0.198 303.72);
}
.roycss-seasonal-witch-hat {
  background:
    radial-gradient(ellipse 10px 6px at 50% 22%, oklch(0.837 0.164 84.43) 0%, oklch(0.837 0.164 84.43) 60%, transparent 61%);
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
  inline-size: 120px;
  block-size: 120px;
  background: radial-gradient(circle, oklch(0.962 0.058 95.62) 0%, oklch(0.837 0.164 84.43) 40%, oklch(0.769 0.165 70.08) 80%, oklch(0.705 0.187 47.6) 100%);
  border-radius: 50%;
  box-shadow:
    0 0 30px color-mix(in oklch, oklch(0.837 0.164 84.43) 80%, transparent),
    0 0 60px color-mix(in oklch, oklch(0.769 0.165 70.08) 50%, transparent),
    0 0 90px color-mix(in oklch, oklch(0.705 0.187 47.6) 30%, transparent);
}
.roycss-seasonal-sun-summer::before,
.roycss-seasonal-sun-summer::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 160px;
  block-size: 160px;
  transform: translate(-50%, -50%);
  background:
    conic-gradient(from 0deg,
      transparent 0deg, transparent 8deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 9deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 21deg,
      transparent 22deg, transparent 38deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 39deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 51deg,
      transparent 52deg, transparent 68deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 69deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 81deg,
      transparent 82deg, transparent 98deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 99deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 111deg,
      transparent 112deg, transparent 128deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 129deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 141deg,
      transparent 142deg, transparent 158deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 159deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 171deg,
      transparent 172deg, transparent 188deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 189deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 201deg,
      transparent 202deg, transparent 218deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 219deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 231deg,
      transparent 232deg, transparent 248deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 249deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 261deg,
      transparent 262deg, transparent 278deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 279deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 291deg,
      transparent 292deg, transparent 308deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 309deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 321deg,
      transparent 322deg, transparent 338deg,
      color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 339deg, color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent) 351deg,
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
  inline-size: 140px;
  block-size: 140px;
  background: radial-gradient(ellipse at center, oklch(0.193 0.069 300.44) 0%, oklch(0.131 0.043 278.66) 100%);
  border-radius: 8px;
  overflow: hidden;
}
.roycss-seasonal-moon-halloween::before {
  content: "";
  position: absolute;
  inset-block-start: 20px;
  inset-inline-start: 30px;
  inline-size: 70px;
  block-size: 70px;
  background: radial-gradient(circle, oklch(0.962 0.058 95.62) 0%, oklch(0.924 0.115 95.75) 60%, oklch(0.837 0.164 84.43) 100%);
  border-radius: 50%;
  box-shadow: 0 0 25px color-mix(in oklch, oklch(0.945 0.124 101.54) 70%, transparent), 0 0 50px color-mix(in oklch, oklch(0.837 0.164 84.43) 40%, transparent);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 30% 5%, 50% 30%, 45% 60%, 25% 85%, 0 95%);
}
.roycss-seasonal-moon-halloween::after {
  content: "";
  position: absolute;
  inset-block-start: 40px;
  inset-inline-end: 20px;
  inline-size: 18px;
  block-size: 6px;
  background: oklch(0.131 0.027 306.06);
  border-radius: 50%;
  box-shadow:
    -30px 15px 0 -1px oklch(0.131 0.027 306.06),
    -30px 15px 0 0 transparent,
    -45px 8px 0 -2px oklch(0.131 0.027 306.06);
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
  inline-size: 200px;
  block-size: 100px;
  background: linear-gradient(to bottom, oklch(0.174 0.07 276.31) 0%, oklch(0.24 0.067 280.09) 60%, oklch(0.263 0.065 306.93) 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-sleigh-fly::before {
  content: "";
  position: absolute;
  inset-block-start: 40px;
  inset-inline-start: -50px;
  inline-size: 60px;
  block-size: 20px;
  background:
    radial-gradient(circle 4px at 10% 50%, oklch(0.577 0.215 27.33), transparent),
    radial-gradient(circle 4px at 30% 50%, oklch(0.577 0.215 27.33), transparent),
    radial-gradient(ellipse 30px 8px at 70% 50%, oklch(0.408 0.116 38.17) 0%, oklch(0.408 0.116 38.17) 60%, transparent 61%);
  animation: roy-b14-sleigh-fly-across 4s linear infinite;
}
.roycss-seasonal-sleigh-fly::after {
  content: "";
  position: absolute;
  inset-block-start: 38px;
  inset-inline-start: -50px;
  inline-size: 20px;
  block-size: 10px;
  background: oklch(0.278 0.03 256.85);
  border-radius: 50%;
  box-shadow:
    15px 0 0 -1px oklch(0.278 0.03 256.85),
    30px 0 0 -1px oklch(0.278 0.03 256.85),
    45px -2px 0 -1px oklch(0.278 0.03 256.85);
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
  inline-size: 100px;
  block-size: 120px;
  background: color-mix(in oklch, oklch(1 0 89.88) 95%, transparent);
  border-radius: 50% 50% 0 0;
  box-shadow: 0 0 25px color-mix(in oklch, oklch(0.891 0.053 261.66) 60%, transparent);
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
  inset-block-start: 40px;
  inset-inline-start: 30px;
  inline-size: 12px;
  block-size: 16px;
  background: oklch(0.278 0.03 256.85);
  border-radius: 50%;
  box-shadow: 28px 0 0 oklch(0.278 0.03 256.85);
}
.roycss-seasonal-ghost-wobble::after {
  content: "";
  position: absolute;
  inset-block-start: 70px;
  inset-inline-start: 42px;
  inline-size: 16px;
  block-size: 8px;
  background: oklch(0.278 0.03 256.85);
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
  inline-size: 100px;
  block-size: 90px;
  background:
    radial-gradient(ellipse at 30% 50%, color-mix(in oklch, oklch(0 0 0) 30%, transparent) 0%, transparent 35%),
    radial-gradient(ellipse at 70% 50%, color-mix(in oklch, oklch(0 0 0) 30%, transparent) 0%, transparent 35%),
    radial-gradient(ellipse at center, oklch(0.705 0.187 47.6) 0%, oklch(0.646 0.194 41.12) 60%, oklch(0.47 0.143 37.3) 100%);
  border-radius: 50% 50% 45% 45% / 55% 55% 45% 45%;
  box-shadow: inset 0 -15px 25px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  animation: roy-b14-pumpkin-bounce-anim 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  transform-origin: bottom center;
}
.roycss-seasonal-pumpkin-bounce::before {
  content: "";
  position: absolute;
  inset-block-start: -16px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 10px;
  block-size: 18px;
  background: linear-gradient(to bottom, oklch(0.448 0.108 151.33) 0%, oklch(0.393 0.09 152.54) 100%);
  border-radius: 4px 4px 2px 2px;
}
.roycss-seasonal-pumpkin-bounce::after {
  content: "";
  position: absolute;
  inset-block-start: 30%;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 50px;
  block-size: 25px;
  background:
    radial-gradient(ellipse at 25% 50%, oklch(0.837 0.164 84.43) 0%, oklch(0.837 0.164 84.43) 6px, transparent 7px),
    radial-gradient(ellipse at 75% 50%, oklch(0.837 0.164 84.43) 0%, oklch(0.837 0.164 84.43) 6px, transparent 7px),
    radial-gradient(ellipse at 50% 80%, oklch(0.837 0.164 84.43) 0%, oklch(0.837 0.164 84.43) 12px, transparent 13px);
  filter: drop-shadow(0 0 4px oklch(0.837 0.164 84.43));
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
  inline-size: 120px;
  block-size: 140px;
  background: linear-gradient(to bottom, oklch(0.856 0.041 239.08) 0%, oklch(0.946 0.022 234.99) 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-snowman-build::before {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 80px;
  block-size: 80px;
  background:
    radial-gradient(circle at 50% 90%, oklch(1 0 89.88) 0%, oklch(1 0 89.88) 35%, transparent 36%),
    radial-gradient(circle at 50% 55%, oklch(1 0 89.88) 0%, oklch(1 0 89.88) 25%, transparent 26%),
    radial-gradient(circle at 50% 25%, oklch(1 0 89.88) 0%, oklch(1 0 89.88) 18%, transparent 19%);
  animation: roy-b14-snowman-appear 3s ease-out infinite;
}
.roycss-seasonal-snowman-build::after {
  content: "";
  position: absolute;
  inset-block-end: 30px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  inline-size: 30px;
  block-size: 30px;
  background:
    radial-gradient(circle 3px at 35% 40%, oklch(0.278 0.03 256.85), transparent),
    radial-gradient(circle 3px at 65% 40%, oklch(0.278 0.03 256.85), transparent),
    radial-gradient(ellipse 6px 3px at 50% 55%, oklch(0.705 0.187 47.6), transparent);
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
  inline-size: 200px;
  block-size: 100px;
  background: linear-gradient(to bottom, oklch(0.871 0.136 154.45) 0%, oklch(0.8 0.182 151.71) 50%, oklch(0.723 0.192 149.58) 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-egg-roll::before {
  content: "";
  position: absolute;
  inset-block-end: 20px;
  inset-inline-start: 20px;
  inline-size: 50px;
  block-size: 65px;
  background:
    linear-gradient(to bottom,
      oklch(0.656 0.212 354.31) 0%, oklch(0.656 0.212 354.31) 20%,
      oklch(0.945 0.124 101.54) 20%, oklch(0.945 0.124 101.54) 40%,
      oklch(0.623 0.188 259.81) 40%, oklch(0.623 0.188 259.81) 60%,
      oklch(0.945 0.124 101.54) 60%, oklch(0.945 0.124 101.54) 80%,
      oklch(0.696 0.149 162.48) 80%, oklch(0.696 0.149 162.48) 100%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  box-shadow: inset -5px -5px 10px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
  animation: roy-b14-egg-roll-across 3s linear infinite;
}
.roycss-seasonal-egg-roll::after {
  content: "";
  position: absolute;
  inset-block-end: 18px;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 4px;
  background: linear-gradient(to right, transparent, oklch(0.448 0.108 151.33), transparent);
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
  inline-size: 100px;
  block-size: 100px;
  background: transparent;
}
.roycss-seasonal-heart-beat::before,
.roycss-seasonal-heart-beat::after {
  content: "";
  position: absolute;
  inset-block-start: 15px;
  inset-inline-start: 18px;
  inline-size: 50px;
  block-size: 80px;
  background: oklch(0.514 0.198 16.93);
  border-radius: 50px 50px 0 0;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
  animation: roy-b14-heart-beat-thump 1.4s ease-in-out infinite;
}
.roycss-seasonal-heart-beat::after {
  inset-inline-start: 68px;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
  animation-name: roy-b14-heart-beat-thump-right;
}
@keyframes roy-b14-heart-beat-thump {
  0%, 100% { transform: rotate(-45deg) scale(1); background: oklch(0.514 0.198 16.93); }
  10% { transform: rotate(-45deg) scale(1.18); background: oklch(0.586 0.222 17.58); }
  20% { transform: rotate(-45deg) scale(1); }
  30% { transform: rotate(-45deg) scale(1.1); background: oklch(0.645 0.215 16.44); }
  40% { transform: rotate(-45deg) scale(1); }
}
@keyframes roy-b14-heart-beat-thump-right {
  0%, 100% { transform: rotate(45deg) scale(1); background: oklch(0.514 0.198 16.93); }
  10% { transform: rotate(45deg) scale(1.18); background: oklch(0.586 0.222 17.58); }
  20% { transform: rotate(45deg) scale(1); }
  30% { transform: rotate(45deg) scale(1.1); background: oklch(0.645 0.215 16.44); }
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
  inline-size: 160px;
  block-size: 160px;
  background: radial-gradient(ellipse at center, oklch(0.174 0.07 276.31) 0%, oklch(0.131 0.043 278.66) 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-firework-launch::before {
  content: "";
  position: absolute;
  inset-block-end: 10px;
  inset-inline-start: 50%;
  inline-size: 6px;
  block-size: 14px;
  background: oklch(0.837 0.164 84.43);
  border-radius: 3px 3px 0 0;
  box-shadow:
    0 -3px 0 oklch(0.637 0.208 25.33),
    0 -6px 0 oklch(0.705 0.187 47.6),
    0 -9px 0 oklch(0.837 0.164 84.43),
    0 6px 8px 2px color-mix(in oklch, oklch(0.837 0.164 84.43) 60%, transparent);
  transform: translateX(-50%);
  animation: roy-b14-rocket-launch 2.5s ease-in infinite;
}
.roycss-seasonal-firework-launch::after {
  content: "";
  position: absolute;
  inset-block-start: 20%;
  inset-inline-start: 50%;
  inline-size: 100px;
  block-size: 100px;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(circle 3px at 50% 50%, oklch(0.837 0.164 84.43), transparent),
    radial-gradient(circle 3px at 30% 30%, oklch(0.637 0.208 25.33), transparent),
    radial-gradient(circle 3px at 70% 30%, oklch(0.656 0.212 354.31), transparent),
    radial-gradient(circle 3px at 30% 70%, oklch(0.623 0.188 259.81), transparent),
    radial-gradient(circle 3px at 70% 70%, oklch(0.696 0.149 162.48), transparent),
    radial-gradient(circle 3px at 80% 50%, oklch(0.837 0.164 84.43), transparent),
    radial-gradient(circle 3px at 20% 50%, oklch(0.627 0.233 303.9), transparent),
    radial-gradient(circle 3px at 50% 20%, oklch(0.705 0.187 47.6), transparent),
    radial-gradient(circle 3px at 50% 80%, oklch(0.715 0.126 215.22), transparent);
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
  inline-size: 160px;
  block-size: 160px;
  background: linear-gradient(to bottom, oklch(0.33 0.045 23.94) 0%, oklch(0.471 0.112 50.85) 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-leaf-swirl::before {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 18px;
  block-size: 18px;
  background: oklch(0.577 0.215 27.33);
  border-radius: 0 100% 0 100%;
  transform: translate(-50%, -50%);
  animation: roy-b14-leaf-swirl-anim 3s ease-in-out infinite;
}
.roycss-seasonal-leaf-swirl::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 14px;
  block-size: 14px;
  background: oklch(0.769 0.165 70.08);
  border-radius: 0 100% 0 100%;
  transform: translate(-50%, -50%);
  animation: roy-b14-leaf-swirl-anim 3s ease-in-out infinite;
  animation-delay: 1.5s;
}
@keyframes roy-b14-leaf-swirl-anim {
  0%   { transform: translate(-50%, -50%) rotate(0deg); opacity: 1; background: oklch(0.577 0.215 27.33); }
  25%  { transform: translate(calc(-50% + 30px), calc(-50% - 20px)) rotate(90deg); background: oklch(0.705 0.187 47.6); }
  50%  { transform: translate(calc(-50% + 20px), calc(-50% + 30px)) rotate(180deg); background: oklch(0.769 0.165 70.08); }
  75%  { transform: translate(calc(-50% - 30px), calc(-50% + 20px)) rotate(270deg); background: oklch(0.555 0.146 49); }
  100% { transform: translate(-50%, -50%) rotate(360deg); opacity: 1; background: oklch(0.577 0.215 27.33); }
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
  inline-size: 200px;
  block-size: 160px;
  background: linear-gradient(to bottom, oklch(0.346 0.074 256.04) 0%, oklch(0.435 0.091 255.18) 60%, oklch(0.333 0.077 257.1) 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-seasonal-snow-accumulate::before {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 10%;
  inline-size: 4px;
  block-size: 4px;
  background: oklch(1 0 89.88);
  border-radius: 50%;
  box-shadow:
    20px 20px 0 oklch(1 0 89.88),
    40px 5px 0 oklch(1 0 89.88),
    60px 30px 0 oklch(1 0 89.88),
    80px 10px 0 oklch(1 0 89.88),
    100px 25px 0 oklch(1 0 89.88),
    120px 5px 0 oklch(1 0 89.88),
    140px 35px 0 oklch(1 0 89.88),
    160px 15px 0 oklch(1 0 89.88);
  animation: roy-b14-snow-fall-down 2.5s linear infinite;
}
.roycss-seasonal-snow-accumulate::after {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 0;
  background:
    linear-gradient(to top, oklch(1 0 89.88) 0%, oklch(0.972 0.009 232.36) 60%, transparent 100%);
  border-radius: 50% 50% 0 0 / 20px 20px 0 0;
  animation: roy-b14-snow-pile-grow 5s ease-out infinite;
}
@keyframes roy-b14-snow-fall-down {
  0%   { transform: translateY(0); opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(160px); opacity: 0; }
}
@keyframes roy-b14-snow-pile-grow {
  0%   { block-size: 0; }
  100% { block-size: 40px; }
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
  inline-size: 120px;
  block-size: 120px;
  background: radial-gradient(circle, oklch(0.962 0.058 95.62) 0%, oklch(0.837 0.164 84.43) 40%, oklch(0.769 0.165 70.08) 80%, oklch(0.705 0.187 47.6) 100%);
  border-radius: 50%;
  box-shadow: 0 0 30px color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent), 0 0 60px color-mix(in oklch, oklch(0.769 0.165 70.08) 40%, transparent);
  animation: roy-b14-sun-core-pulse 2s ease-in-out infinite;
}
.roycss-seasonal-sun-rotate::before,
.roycss-seasonal-sun-rotate::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 160px;
  block-size: 160px;
  transform: translate(-50%, -50%);
  background:
    conic-gradient(from 0deg,
      transparent 0deg, transparent 10deg,
      oklch(0.837 0.164 84.43) 11deg, oklch(0.837 0.164 84.43) 19deg,
      transparent 20deg, transparent 35deg,
      oklch(0.837 0.164 84.43) 36deg, oklch(0.837 0.164 84.43) 44deg,
      transparent 45deg, transparent 60deg,
      oklch(0.837 0.164 84.43) 61deg, oklch(0.837 0.164 84.43) 69deg,
      transparent 70deg, transparent 85deg,
      oklch(0.837 0.164 84.43) 86deg, oklch(0.837 0.164 84.43) 94deg,
      transparent 95deg, transparent 110deg,
      oklch(0.837 0.164 84.43) 111deg, oklch(0.837 0.164 84.43) 119deg,
      transparent 120deg, transparent 135deg,
      oklch(0.837 0.164 84.43) 136deg, oklch(0.837 0.164 84.43) 144deg,
      transparent 145deg, transparent 160deg,
      oklch(0.837 0.164 84.43) 161deg, oklch(0.837 0.164 84.43) 169deg,
      transparent 170deg, transparent 185deg,
      oklch(0.837 0.164 84.43) 186deg, oklch(0.837 0.164 84.43) 194deg,
      transparent 195deg, transparent 210deg,
      oklch(0.837 0.164 84.43) 211deg, oklch(0.837 0.164 84.43) 219deg,
      transparent 220deg, transparent 235deg,
      oklch(0.837 0.164 84.43) 236deg, oklch(0.837 0.164 84.43) 244deg,
      transparent 245deg, transparent 260deg,
      oklch(0.837 0.164 84.43) 261deg, oklch(0.837 0.164 84.43) 269deg,
      transparent 270deg, transparent 285deg,
      oklch(0.837 0.164 84.43) 286deg, oklch(0.837 0.164 84.43) 294deg,
      transparent 295deg, transparent 310deg,
      oklch(0.837 0.164 84.43) 311deg, oklch(0.837 0.164 84.43) 319deg,
      transparent 320deg, transparent 335deg,
      oklch(0.837 0.164 84.43) 336deg, oklch(0.837 0.164 84.43) 344deg,
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
  0%, 100% { box-shadow: 0 0 30px color-mix(in oklch, oklch(0.837 0.164 84.43) 70%, transparent), 0 0 60px color-mix(in oklch, oklch(0.769 0.165 70.08) 40%, transparent); }
  50% { box-shadow: 0 0 45px color-mix(in oklch, oklch(0.837 0.164 84.43) 100%, transparent), 0 0 80px color-mix(in oklch, oklch(0.769 0.165 70.08) 60%, transparent); }
}`,
  },
];
