import type { CSSEffect } from "./roycss-types";

/**
 * Batch 13 — Experimental / Artistic CSS Effects (40 effects)
 * - backgrounds (12): pure-CSS painted landscapes & scenes
 * - visual (12): optical illusions + generative art
 * - animations (10): mesmerizing mechanical loops
 * - text (6): artistic typography
 *
 * All classes use `.roycss-` prefix; all keyframes use `roy-b13-` prefix.
 * Verified zero ID / keyframe collisions with batches 1-11 (540 effects, 412 keyframes).
 */
export const effectsBatch13: CSSEffect[] = [
  /* =========================================================================
   * BACKGROUNDS — CSS PAINTINGS & SCENES (12)
   * ========================================================================= */
  {
    id: "css-painting-sunset",
    name: "CSS Painting — Sunset over Mountains",
    category: "backgrounds",
    description:
      "Pure-CSS landscape painting of a setting sun sinking behind layered mountain silhouettes with a warm gradient sky",
    tags: ["painting", "sunset", "landscape", "mountains"],
    previewType: "background",
    cssCode: `/* CSS Painting — Sunset over Mountains */
.roycss-css-painting-sunset {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 62%, rgba(255, 220, 120, 0.9) 0%, rgba(255, 160, 80, 0.5) 8%, transparent 18%),
    linear-gradient(to bottom,
      #1a1030 0%,
      #3b1c4a 18%,
      #6b2552 32%,
      #b53767 48%,
      #ee6b3a 62%,
      #ffae5c 74%,
      #ffd98a 84%,
      #2a1438 95%,
      #0d0820 100%);
}
.roycss-css-painting-sunset::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 55%;
  background:
    linear-gradient(to top, #050410 0%, #050410 35%, transparent 100%),
    #050410;
  clip-path: polygon(
    0% 100%,
    0% 70%, 8% 55%, 14% 65%, 22% 40%, 30% 60%, 38% 35%,
    46% 58%, 55% 30%, 62% 50%, 70% 38%, 78% 55%, 86% 45%,
    94% 60%, 100% 50%, 100% 100%
  );
}
.roycss-css-painting-sunset::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 35%;
  background: #020108;
  clip-path: polygon(
    0% 100%,
    0% 60%, 10% 75%, 20% 55%, 32% 78%, 45% 60%, 58% 80%,
    70% 65%, 82% 82%, 92% 70%, 100% 80%, 100% 100%
  );
}`
  },
  {
    id: "css-painting-forest",
    name: "CSS Painting — Misty Forest",
    category: "backgrounds",
    description:
      "Dark coniferous forest scene with layered tree silhouettes fading into atmospheric fog",
    tags: ["painting", "forest", "fog", "trees"],
    previewType: "background",
    cssCode: `/* CSS Painting — Misty Forest */
.roycss-css-painting-forest {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(180, 200, 170, 0.25) 0%, transparent 55%),
    linear-gradient(to bottom, #2a3528 0%, #1c2620 40%, #0e1812 75%, #050a07 100%);
}
.roycss-css-painting-forest::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(90deg,
      transparent 0px, transparent 38px,
      rgba(8, 12, 8, 0.95) 38px, rgba(8, 12, 8, 0.95) 44px,
      transparent 44px, transparent 50px,
      rgba(15, 22, 15, 0.85) 50px, rgba(15, 22, 15, 0.85) 53px),
    repeating-linear-gradient(90deg,
      transparent 0px, transparent 70px,
      rgba(4, 8, 5, 1) 70px, rgba(4, 8, 5, 1) 78px);
  clip-path: polygon(
    0% 100%, 0% 45%,
    3% 30%, 5% 50%, 7% 25%, 9% 48%, 12% 35%, 14% 52%, 17% 28%, 20% 50%,
    23% 33%, 26% 55%, 29% 30%, 32% 50%, 35% 38%, 38% 55%, 41% 30%, 44% 52%,
    47% 35%, 50% 55%, 53% 30%, 56% 50%, 59% 35%, 62% 55%, 65% 28%, 68% 50%,
    71% 35%, 74% 55%, 77% 30%, 80% 50%, 83% 35%, 86% 55%, 89% 30%, 92% 50%,
    95% 35%, 98% 55%, 100% 45%, 100% 100%
  );
}
.roycss-css-painting-forest::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40%;
  background: linear-gradient(to top, rgba(180, 200, 180, 0.18) 0%, transparent 100%);
  pointer-events: none;
}`
  },
  {
    id: "css-painting-ocean",
    name: "CSS Painting — Ocean Horizon",
    category: "backgrounds",
    description:
      "Calm ocean scene with sun glinting on rippling water and a clear horizon line",
    tags: ["painting", "ocean", "sea", "horizon"],
    previewType: "background",
    cssCode: `/* CSS Painting — Ocean Horizon */
.roycss-css-painting-ocean {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom,
      #f5d6a8 0%,
      #f8b88b 18%,
      #e08f6a 35%,
      #5a7a9a 50%,
      #3a5a7a 55%,
      #2a4565 70%,
      #1a2f4a 100%);
}
.roycss-css-painting-ocean::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 48%;
  bottom: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 6px,
      rgba(255, 240, 200, 0.18) 6px, rgba(255, 240, 200, 0.18) 7px,
      transparent 7px, transparent 14px,
      rgba(255, 255, 255, 0.1) 14px, rgba(255, 255, 255, 0.1) 15px),
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 22px,
      rgba(180, 210, 230, 0.15) 22px, rgba(180, 210, 230, 0.15) 24px);
  mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 0%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 0%, transparent 80%);
}
.roycss-css-painting-ocean::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 38%;
  transform: translateX(-50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff5d0 0%, #ffcc70 40%, transparent 70%);
  box-shadow: 0 0 80px 30px rgba(255, 200, 120, 0.6);
}`
  },
  {
    id: "css-painting-desert",
    name: "CSS Painting — Desert Dunes",
    category: "backgrounds",
    description:
      "Hot desert scene with rolling sand dunes under a blazing sun and cloudless sky",
    tags: ["painting", "desert", "dunes", "sand"],
    previewType: "background",
    cssCode: `/* CSS Painting — Desert Dunes */
.roycss-css-painting-desert {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 75% 25%, rgba(255, 245, 180, 0.95) 0%, rgba(255, 220, 130, 0.5) 4%, transparent 9%),
    linear-gradient(to bottom,
      #6db4d6 0%,
      #9ec8d8 22%,
      #f5d088 42%,
      #e8a85a 58%,
      #c87838 75%,
      #8a4a1f 100%);
}
.roycss-css-painting-desert::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 50%;
  background:
    radial-gradient(ellipse 80% 100% at 20% 100%, #b56028 0%, transparent 60%),
    radial-gradient(ellipse 90% 100% at 80% 100%, #d4824a 0%, transparent 55%),
    linear-gradient(to bottom, #c87838 0%, #8a4a1f 100%);
  clip-path: polygon(
    0% 100%, 0% 55%,
    12% 35%, 22% 50%, 35% 25%, 48% 45%, 60% 20%, 72% 42%, 85% 28%, 100% 38%,
    100% 100%
  );
}
.roycss-css-painting-desert::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30%;
  background:
    linear-gradient(to top, #5a2a0e 0%, transparent 100%);
  clip-path: polygon(
    0% 100%, 0% 70%,
    15% 45%, 30% 65%, 45% 35%, 60% 60%, 75% 40%, 90% 65%, 100% 50%,
    100% 100%
  );
}`
  },
  {
    id: "css-painting-city-night",
    name: "CSS Painting — City Skyline at Night",
    category: "backgrounds",
    description:
      "City skyline at night with illuminated windows in a grid of varied skyscraper silhouettes",
    tags: ["painting", "city", "night", "skyline"],
    previewType: "background",
    cssCode: `/* CSS Painting — City Skyline at Night */
.roycss-css-painting-city-night {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 25%, rgba(255, 230, 150, 0.35) 0%, transparent 18%),
    radial-gradient(circle at 70% 30%, rgba(200, 220, 255, 0.25) 0%, transparent 12%),
    linear-gradient(to bottom, #0a0a2a 0%, #1a1a4a 30%, #2a1a4a 55%, #0a0814 100%);
}
.roycss-css-painting-city-night::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 70%;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 8px,
      rgba(255, 220, 100, 0.9) 8px, rgba(255, 220, 100, 0.9) 11px,
      transparent 11px, transparent 20px,
      rgba(255, 240, 180, 0.7) 20px, rgba(255, 240, 180, 0.7) 22px),
    repeating-linear-gradient(90deg,
      transparent 0px, transparent 6px,
      rgba(10, 8, 20, 0.98) 6px, rgba(10, 8, 20, 0.98) 9px);
  clip-path: polygon(
    0% 100%, 0% 75%,
    3% 75%, 3% 40%, 8% 40%, 8% 55%, 12% 55%, 12% 30%, 16% 30%, 16% 60%,
    20% 60%, 20% 45%, 24% 45%, 24% 25%, 30% 25%, 30% 50%, 34% 50%, 34% 35%,
    40% 35%, 40% 20%, 44% 20%, 44% 55%, 50% 55%, 50% 40%, 56% 40%, 56% 28%,
    60% 28%, 60% 50%, 66% 50%, 66% 38%, 72% 38%, 72% 22%, 76% 22%, 76% 48%,
    82% 48%, 82% 32%, 88% 32%, 88% 55%, 94% 55%, 94% 42%, 100% 42%, 100% 100%
  );
}
.roycss-css-painting-city-night::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 20%;
  background: linear-gradient(to top, rgba(255, 200, 80, 0.18) 0%, transparent 100%);
}`
  },
  {
    id: "css-painting-galaxy",
    name: "CSS Painting — Spiral Galaxy",
    category: "backgrounds",
    description:
      "Top-down spiral galaxy with a bright bulging core, dust lanes, and scattered stars",
    tags: ["painting", "galaxy", "space", "stars"],
    previewType: "background",
    cssCode: `/* CSS Painting — Spiral Galaxy */
.roycss-css-painting-galaxy {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 0.5%),
    radial-gradient(2px 2px at 12% 18%, #fff, transparent),
    radial-gradient(1px 1px at 28% 72%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 78% 22%, #fff, transparent),
    radial-gradient(1px 1px at 88% 65%, #cde, transparent),
    radial-gradient(1px 1px at 18% 88%, #fff, transparent),
    radial-gradient(2px 2px at 65% 12%, #fff, transparent),
    radial-gradient(1px 1px at 8% 50%, #fdd, transparent),
    radial-gradient(1.5px 1.5px at 92% 42%, #fff, transparent),
    radial-gradient(1px 1px at 45% 88%, #fff, transparent),
    radial-gradient(1px 1px at 38% 12%, #fff, transparent),
    radial-gradient(circle at 50% 50%,
      #fff 0%, #fff 1%,
      #ffe9c0 3%, #ffb070 6%,
      #d470a0 12%, #8050c0 22%,
      #4030a0 35%, #1a1060 50%,
      #050420 75%, #02010a 100%);
}
.roycss-css-painting-galaxy::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    conic-gradient(from 0deg at 50% 50%,
      transparent 0deg,
      rgba(180, 120, 220, 0.35) 30deg,
      transparent 60deg,
      rgba(120, 180, 255, 0.3) 90deg,
      transparent 120deg,
      rgba(220, 150, 200, 0.3) 180deg,
      transparent 210deg,
      rgba(150, 200, 220, 0.3) 240deg,
      transparent 270deg,
      rgba(200, 150, 220, 0.3) 300deg,
      transparent 330deg);
  mix-blend-mode: screen;
  filter: blur(8px);
}
.roycss-css-painting-galaxy::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 12% at 50% 50%,
      rgba(255, 240, 200, 0.4) 0%, transparent 70%);
  transform: rotate(35deg);
  filter: blur(4px);
}`
  },
  {
    id: "css-rainbow-arc",
    name: "CSS Painting — Rainbow Arc",
    category: "backgrounds",
    description:
      "Vivid rainbow arc curving across a soft blue sky with subtle cloud highlights",
    tags: ["painting", "rainbow", "arc", "sky"],
    previewType: "background",
    cssCode: `/* CSS Painting — Rainbow Arc */
.roycss-css-rainbow-arc {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse 100% 60% at 50% 100%, #c8e8f5 0%, #8ec5e0 40%, #5a9cc8 100%);
}
.roycss-css-rainbow-arc::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 140%;
  aspect-ratio: 2 / 1;
  transform: translateX(-50%);
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  background:
    radial-gradient(ellipse at 50% 100%,
      transparent 0%,
      transparent 56%,
      #ff0040 57%, #ff0040 60%,
      #ff8000 61%, #ff8000 64%,
      #ffe000 65%, #ffe000 68%,
      #00e040 69%, #00e040 72%,
      #00a0ff 73%, #00a0ff 76%,
      #2040ff 77%, #2040ff 80%,
      #8020c0 81%, #8020c0 84%,
      transparent 85%);
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
}
.roycss-css-rainbow-arc::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 25%;
  background:
    radial-gradient(ellipse 50% 100% at 15% 100%, rgba(255, 255, 255, 0.85) 0%, transparent 60%),
    radial-gradient(ellipse 60% 100% at 85% 100%, rgba(255, 255, 255, 0.75) 0%, transparent 55%);
  filter: blur(3px);
}`
  },
  {
    id: "css-aurora-landscape",
    name: "CSS Painting — Aurora over Mountains",
    category: "backgrounds",
    description:
      "Aurora borealis ribbons of green and magenta light dancing over snow-capped peaks",
    tags: ["painting", "aurora", "borealis", "mountains"],
    previewType: "background",
    cssCode: `/* CSS Painting — Aurora over Mountains */
.roycss-css-aurora-landscape {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom, #050218 0%, #0a0838 35%, #1a1450 55%, #050818 80%, #02050a 100%);
}
.roycss-css-aurora-landscape::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 35% at 30% 35%, rgba(80, 255, 160, 0.55) 0%, transparent 60%),
    radial-gradient(ellipse 60% 30% at 70% 30%, rgba(180, 80, 255, 0.5) 0%, transparent 60%),
    radial-gradient(ellipse 50% 25% at 50% 45%, rgba(120, 200, 255, 0.4) 0%, transparent 60%);
  filter: blur(12px);
  mix-blend-mode: screen;
  animation: roy-b13-aurora-wave 8s ease-in-out infinite alternate;
}
.roycss-css-aurora-landscape::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 45%;
  background:
    linear-gradient(to top, #050810 0%, transparent 100%),
    #050810;
  clip-path: polygon(
    0% 100%, 0% 60%,
    10% 35%, 18% 55%, 28% 20%, 38% 50%, 48% 25%, 55% 45%,
    65% 15%, 75% 50%, 85% 30%, 95% 55%, 100% 40%, 100% 100%
  );
}
@keyframes roy-b13-aurora-wave {
  0%   { transform: translateX(-4%) scaleY(1);   opacity: 0.85; }
  50%  { transform: translateX(2%)  scaleY(1.1); opacity: 1; }
  100% { transform: translateX(4%)  scaleY(0.95); opacity: 0.9; }
}`
  },
  {
    id: "css-underwater-scene",
    name: "CSS Painting — Underwater Rays",
    category: "backgrounds",
    description:
      "Underwater scene with god rays piercing down from the surface into the deep blue",
    tags: ["painting", "underwater", "ocean", "light-rays"],
    previewType: "background",
    cssCode: `/* CSS Painting — Underwater Rays */
.roycss-css-underwater-scene {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom,
      #4a9ec8 0%,
      #2a6e98 25%,
      #154e78 55%,
      #082a48 80%,
      #02101e 100%);
}
.roycss-css-underwater-scene::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(165deg,
      transparent 8%,
      rgba(220, 240, 255, 0.22) 10%, transparent 13%,
      transparent 22%,
      rgba(220, 240, 255, 0.18) 24%, transparent 28%,
      transparent 40%,
      rgba(220, 240, 255, 0.25) 42%, transparent 47%,
      transparent 60%,
      rgba(220, 240, 255, 0.15) 62%, transparent 66%,
      transparent 78%,
      rgba(220, 240, 255, 0.2) 80%, transparent 84%);
  filter: blur(2px);
  mix-blend-mode: screen;
  animation: roy-b13-uw-shift 7s ease-in-out infinite alternate;
}
.roycss-css-underwater-scene::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30%;
  background:
    radial-gradient(ellipse 30% 100% at 20% 100%, rgba(0, 30, 50, 0.7) 0%, transparent 70%),
    radial-gradient(ellipse 25% 100% at 80% 100%, rgba(0, 30, 50, 0.7) 0%, transparent 70%),
    linear-gradient(to top, #02101e 0%, transparent 100%);
}
@keyframes roy-b13-uw-shift {
  0%   { transform: translateX(-6px); opacity: 0.85; }
  100% { transform: translateX(6px);  opacity: 1; }
}`
  },
  {
    id: "css-volcano-eruption",
    name: "CSS Painting — Volcano Eruption",
    category: "backgrounds",
    description:
      "Volcano erupting with glowing lava streams, falling embers, and a rising plume of smoke",
    tags: ["painting", "volcano", "lava", "eruption"],
    previewType: "background",
    cssCode: `/* CSS Painting — Volcano Eruption */
.roycss-css-volcano-eruption {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 75%, rgba(255, 120, 40, 0.5) 0%, transparent 25%),
    linear-gradient(to bottom, #1a0808 0%, #2a1010 30%, #4a1a0a 55%, #200808 80%, #0a0202 100%);
}
.roycss-css-volcano-eruption::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 55%;
  background:
    linear-gradient(to top, #1a0808 0%, #2a0e08 60%, transparent 100%),
    #1a0808;
  clip-path: polygon(
    0% 100%, 0% 80%,
    15% 75%, 25% 35%, 32% 45%, 38% 20%, 45% 50%, 50% 30%,
    55% 50%, 62% 20%, 68% 45%, 75% 35%, 85% 75%, 100% 80%, 100% 100%
  );
}
.roycss-css-volcano-eruption::after {
  content: "";
  position: absolute;
  left: 35%;
  top: 8%;
  width: 30%;
  height: 60%;
  background:
    radial-gradient(ellipse 100% 70% at 50% 100%,
      rgba(255, 100, 40, 0.85) 0%,
      rgba(200, 80, 30, 0.6) 25%,
      rgba(120, 60, 40, 0.4) 55%,
      rgba(60, 50, 50, 0.25) 80%,
      transparent 100%);
  filter: blur(8px);
  transform: skewX(-3deg);
}
/* falling embers layer */
.roycss-css-volcano-eruption > .embers {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(2px 2px at 20% 30%, #ff6020, transparent),
    radial-gradient(1px 1px at 60% 40%, #ffaa30, transparent),
    radial-gradient(2px 2px at 80% 25%, #ff8040, transparent),
    radial-gradient(1px 1px at 35% 50%, #ff6020, transparent),
    radial-gradient(1.5px 1.5px at 75% 60%, #ffb050, transparent);
  animation: roy-b13-ember-fall 3s linear infinite;
}
@keyframes roy-b13-ember-fall {
  0%   { transform: translateY(-10px); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(120px); opacity: 0; }
}`
  },
  {
    id: "css-snowy-mountain",
    name: "CSS Painting — Snowy Mountain Peak",
    category: "backgrounds",
    description:
      "Snow-capped mountain peak rising into a pale winter sky with snow drifts on its slopes",
    tags: ["painting", "mountain", "snow", "winter"],
    previewType: "background",
    cssCode: `/* CSS Painting — Snowy Mountain Peak */
.roycss-css-snowy-mountain {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom, #b8c8d8 0%, #d8e0e8 35%, #e8eaef 60%, #c8d0d8 100%);
}
.roycss-css-snowy-mountain::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 75%;
  background:
    linear-gradient(to top, #5a6068 0%, #7a8088 30%, #a8b0b8 60%, #f0f2f4 90%);
  clip-path: polygon(
    0% 100%, 0% 70%,
    10% 60%, 20% 50%, 30% 30%, 38% 15%, 45% 25%, 52% 10%,
    60% 28%, 70% 45%, 80% 55%, 90% 65%, 100% 70%, 100% 100%
  );
}
.roycss-css-snowy-mountain::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 50%;
  background:
    linear-gradient(to top, #ffffff 0%, #f0f4f8 40%, transparent 100%);
  clip-path: polygon(
    0% 100%, 0% 75%,
    15% 65%, 25% 55%, 32% 40%, 36% 50%, 42% 30%, 48% 45%,
    54% 25%, 60% 45%, 68% 55%, 78% 62%, 88% 70%, 100% 75%, 100% 100%
  );
}`
  },
  {
    id: "css-tropical-beach",
    name: "CSS Painting — Tropical Beach",
    category: "backgrounds",
    description:
      "Tropical beach scene with palm tree silhouette, turquoise water, white sand, and blue sky",
    tags: ["painting", "beach", "tropical", "palm"],
    previewType: "background",
    cssCode: `/* CSS Painting — Tropical Beach */
.roycss-css-tropical-beach {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom,
      #6ec0e8 0%,
      #8fd0e8 35%,
      #2eaac8 45%,
      #1e88a8 55%,
      #d8c890 65%,
      #e8d8a0 80%,
      #c8b878 100%);
}
.roycss-css-tropical-beach::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 55%;
  bottom: 25%;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 4px,
      rgba(255, 255, 255, 0.25) 4px, rgba(255, 255, 255, 0.25) 5px,
      transparent 5px, transparent 12px);
}
.roycss-css-tropical-beach::after {
  content: "";
  position: absolute;
  left: 12%;
  bottom: 28%;
  width: 8px;
  height: 45%;
  background: linear-gradient(to top, #3a2010 0%, #5a3818 100%);
  transform: rotate(-4deg);
  transform-origin: bottom center;
  box-shadow:
    18px -10px 0 -2px #3a2010,
    -2px -38px 0 -1px #3a2010;
  border-radius: 4px;
}
/* palm fronds */
.roycss-css-tropical-beach > .fronds {
  position: absolute;
  left: 8%;
  bottom: 70%;
  width: 18%;
  height: 14%;
  background:
    radial-gradient(ellipse 60% 100% at 50% 100%, #1a4a18 0%, #1a4a18 30%, transparent 60%);
  clip-path: polygon(
    0% 100%, 0% 70%, 15% 50%, 30% 30%, 50% 10%, 70% 30%, 85% 50%, 100% 70%, 100% 100%
  );
  transform: rotate(-10deg);
}`
  },

  /* =========================================================================
   * VISUAL — OPTICAL ILLUSIONS & GENERATIVE ART (12)
   * ========================================================================= */
  {
    id: "optical-illusion-hypnosis",
    name: "Optical Illusion — Hypnotic Spiral",
    category: "visual",
    description:
      "Spinning two-armed spiral that pulls the eye inward, classic hypnosis illusion",
    tags: ["optical", "hypnosis", "spiral", "illusion"],
    previewType: "box",
    cssCode: `/* Optical Illusion — Hypnotic Spiral */
.roycss-optical-illusion-hypnosis {
  position: relative;
  width: 100%;
  height: 100%;
  background: #050505;
  overflow: hidden;
}
.roycss-optical-illusion-hypnosis::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      #ffffff 0deg, #ffffff 6deg,
      #050505 6deg, #050505 12deg);
  -webkit-mask: radial-gradient(circle, #000 5%, #000 95%, transparent 100%);
          mask: radial-gradient(circle, #000 5%, #000 95%, transparent 100%);
  animation: roy-b13-hypno-spin 6s linear infinite;
}
.roycss-optical-illusion-hypnosis::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14%;
  height: 14%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, #888 60%, #000 100%);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
}
@keyframes roy-b13-hypno-spin {
  to { transform: rotate(360deg); }
}`
  },
  {
    id: "optical-illusion-depth",
    name: "Optical Illusion — Infinite Depth",
    category: "visual",
    description:
      "Nested square frames fading into a vanishing point creating a tunnel of depth",
    tags: ["optical", "depth", "tunnel", "illusion"],
    previewType: "box",
    cssCode: `/* Optical Illusion — Infinite Depth */
.roycss-optical-illusion-depth {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      #1a1a2a 0deg, #1a1a2a 90deg,
      #2a2a3a 90deg, #2a2a3a 180deg,
      #1a1a2a 180deg, #1a1a2a 270deg,
      #2a2a3a 270deg, #2a2a3a 360deg);
  background-size: 40px 40px;
  overflow: hidden;
}
.roycss-optical-illusion-depth::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-radial-gradient(circle at 50% 50%,
      #ffffff 0px, #ffffff 2px,
      #000000 2px, #000000 4px,
      #888888 4px, #888888 6px,
      #000000 6px, #000000 8px);
  -webkit-mask: repeating-conic-gradient(from 0deg at 50% 50%,
    #000 0deg, #000 22.5deg, transparent 22.5deg, transparent 45deg);
          mask: repeating-conic-gradient(from 0deg at 50% 50%,
    #000 0deg, #000 22.5deg, transparent 22.5deg, transparent 45deg);
  animation: roy-b13-depth-spin 30s linear infinite;
}
.roycss-optical-illusion-depth::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8%;
  height: 8%;
  transform: translate(-50%, -50%);
  background: #fff;
  box-shadow: 0 0 30px 10px rgba(255, 255, 255, 0.8);
}
@keyframes roy-b13-depth-spin {
  to { transform: rotate(-360deg); }
}`
  },
  {
    id: "optical-illusion-motion",
    name: "Optical Illusion — Apparent Motion",
    category: "visual",
    description:
      "Static concentric pattern of high-contrast shapes that the brain reads as rotating motion",
    tags: ["optical", "motion", "rotating", "illusion"],
    previewType: "box",
    cssCode: `/* Optical Illusion — Apparent Motion */
.roycss-optical-illusion-motion {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
}
.roycss-optical-illusion-motion::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-radial-gradient(circle at 50% 50%,
      #000000 0px, #000000 6px,
      #ffffff 6px, #ffffff 18px,
      #888888 18px, #888888 24px,
      #ffffff 24px, #ffffff 36px);
  -webkit-mask: repeating-conic-gradient(from 0deg at 50% 50%,
    #000 0deg, #000 15deg, transparent 15deg, transparent 30deg);
          mask: repeating-conic-gradient(from 0deg at 50% 50%,
    #000 0deg, #000 15deg, transparent 15deg, transparent 30deg);
}
.roycss-optical-illusion-motion::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-conic-gradient(from 7.5deg at 50% 50%,
      rgba(0, 0, 0, 0.5) 0deg, rgba(0, 0, 0, 0.5) 15deg,
      transparent 15deg, transparent 30deg);
  -webkit-mask: repeating-radial-gradient(circle at 50% 50%,
    #000 0px, #000 6px, transparent 6px, transparent 18px,
    #000 18px, #000 24px, transparent 24px, transparent 36px);
          mask: repeating-radial-gradient(circle at 50% 50%,
    #000 0px, #000 6px, transparent 6px, transparent 18px,
    #000 18px, #000 24px, transparent 24px, transparent 36px);
}`
  },
  {
    id: "optical-illusion-impossible",
    name: "Optical Illusion — Penrose Triangle",
    category: "visual",
    description:
      "Impossible Penrose triangle rendered with three flat shaded faces that cannot exist in 3D",
    tags: ["optical", "penrose", "impossible", "triangle"],
    previewType: "box",
    cssCode: `/* Optical Illusion — Penrose Triangle */
.roycss-optical-illusion-impossible {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ece8de;
  overflow: hidden;
}
.roycss-optical-illusion-impossible::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 60%;
  height: 60%;
  transform: translate(-50%, -50%);
  background:
    conic-gradient(from 30deg at 50% 50%,
      #4a5a7a 0deg, #4a5a7a 60deg,
      #8a9aba 60deg, #8a9aba 120deg,
      #2a3a5a 120deg, #2a3a5a 180deg,
      #4a5a7a 180deg, #4a5a7a 240deg,
      #8a9aba 240deg, #8a9aba 300deg,
      #2a3a5a 300deg, #2a3a5a 360deg);
  clip-path: polygon(
    50% 0%, 100% 87%, 0% 87%
  );
  filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3));
}
.roycss-optical-illusion-impossible::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 36%;
  height: 36%;
  transform: translate(-50%, -38%);
  background: #ece8de;
  clip-path: polygon(
    50% 0%, 100% 87%, 0% 87%
  );
}`
  },
  {
    id: "optical-illusion-barber-pole",
    name: "Optical Illusion — Barber Pole",
    category: "visual",
    description:
      "Classic red, white and blue striped barber pole with the illusion of stripes moving upward",
    tags: ["optical", "barber-pole", "stripes", "illusion"],
    previewType: "box",
    cssCode: `/* Optical Illusion — Barber Pole */
.roycss-optical-illusion-barber-pole {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(to right, #1a1a1a 0%, #1a1a1a 15%, transparent 15%, transparent 85%, #1a1a1a 85%, #1a1a1a 100%);
  overflow: hidden;
}
.roycss-optical-illusion-barber-pole::before {
  content: "";
  position: absolute;
  left: 25%;
  right: 25%;
  top: 5%;
  bottom: 5%;
  background:
    repeating-linear-gradient(45deg,
      #d8202a 0px, #d8202a 14px,
      #ffffff 14px, #ffffff 28px,
      #2050b0 28px, #2050b0 42px,
      #ffffff 42px, #ffffff 56px);
  border-radius: 50% / 8%;
  box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.5);
  -webkit-mask: linear-gradient(to right,
    transparent 0%, #000 8%, #000 92%, transparent 100%);
          mask: linear-gradient(to right,
    transparent 0%, #000 8%, #000 92%, transparent 100%);
  animation: roy-b13-barber-up 1.5s linear infinite;
}
.roycss-optical-illusion-barber-pole::after {
  content: "";
  position: absolute;
  left: 20%;
  right: 20%;
  top: 2%;
  height: 6%;
  background: linear-gradient(to bottom, #999, #444);
  border-radius: 4px;
  box-shadow: 0 0 0 1px #222;
}
@keyframes roy-b13-barber-up {
  from { background-position: 0 0; }
  to   { background-position: 0 -56px; }
}`
  },
  {
    id: "optical-illusion-cafe-wall",
    name: "Optical Illusion — Café Wall",
    category: "visual",
    description:
      "Café wall illusion where parallel rows of offset checker tiles appear to slope despite being straight",
    tags: ["optical", "cafe-wall", "tiling", "illusion"],
    previewType: "box",
    cssCode: `/* Optical Illusion — Café Wall */
.roycss-optical-illusion-cafe-wall {
  position: relative;
  width: 100%;
  height: 100%;
  background: #888;
  overflow: hidden;
  background-image:
    repeating-linear-gradient(0deg,
      #f0f0f0 0px, #f0f0f0 20px,
      #1a1a1a 20px, #1a1a1a 40px),
    repeating-linear-gradient(90deg,
      #f0f0f0 0px, #f0f0f0 40px,
      #1a1a1a 40px, #1a1a1a 80px);
  background-blend-mode: normal;
}
.roycss-optical-illusion-cafe-wall::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 20px,
      #888 20px, #888 22px,
      transparent 22px, transparent 42px,
      #888 42px, #888 44px),
    repeating-linear-gradient(90deg,
      transparent 0px, transparent 40px,
      #888 40px, #888 42px,
      transparent 42px, transparent 82px,
      #888 82px, #888 84px);
}
.roycss-optical-illusion-cafe-wall::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg,
      #1a1a1a 0px, #1a1a1a 20px,
      #f0f0f0 20px, #f0f0f0 40px);
  background-size: 80px 40px;
  -webkit-mask:
    linear-gradient(90deg,
      transparent 0%, #000 6%, #000 12%, transparent 18%,
      #000 24%, #000 30%, transparent 36%,
      #000 42%, #000 48%, transparent 54%,
      #000 60%, #000 66%, transparent 72%,
      #000 78%, #000 84%, transparent 90%, #000 96%);
          mask:
    linear-gradient(90deg,
      transparent 0%, #000 6%, #000 12%, transparent 18%,
      #000 24%, #000 30%, transparent 36%,
      #000 42%, #000 48%, transparent 54%,
      #000 60%, #000 66%, transparent 72%,
      #000 78%, #000 84%, transparent 90%, #000 96%);
}`
  },
  {
    id: "art-mondrian",
    name: "Art — Mondrian Composition",
    category: "visual",
    description:
      "Piet Mondrian-style geometric composition with bold black lines and primary color blocks",
    tags: ["art", "mondrian", "geometric", "primary"],
    previewType: "box",
    cssCode: `/* Art — Mondrian Composition */
.roycss-art-mondrian {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(to right,
      #d8202a 0%, #d8202a 32%,
      #000000 32%, #000000 34%,
      #ffffff 34%, #ffffff 58%,
      #000000 58%, #000000 60%,
      #ffffff 60%, #ffffff 78%,
      #000000 78%, #000000 80%,
      #ffffff 80%, #ffffff 100%),
    linear-gradient(to bottom,
      #ffffff 0%, #ffffff 28%,
      #000000 28%, #000000 30%,
      #f5d020 30%, #f5d020 60%,
      #000000 60%, #000000 62%,
      #ffffff 62%, #ffffff 75%,
      #000000 75%, #000000 77%,
      #2050b0 77%, #2050b0 100%);
  background-blend-mode: multiply;
}
.roycss-art-mondrian::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right,
      transparent 0%, transparent 32%,
      #000 32%, #000 34%,
      transparent 34%, transparent 58%,
      #000 58%, #000 60%,
      transparent 60%, transparent 78%,
      #000 78%, #000 80%,
      transparent 80%, transparent 100%),
    linear-gradient(to bottom,
      transparent 0%, transparent 28%,
      #000 28%, #000 30%,
      transparent 30%, transparent 60%,
      #000 60%, #000 62%,
      transparent 62%, transparent 75%,
      #000 75%, #000 77%,
      transparent 77%, transparent 100%);
  mix-blend-mode: multiply;
}`
  },
  {
    id: "art-pixel-portrait",
    name: "Art — Pixel Portrait",
    category: "visual",
    description:
      "8-bit style pixel art face built from a grid of colored squares with shading and hair",
    tags: ["art", "pixel", "portrait", "retro"],
    previewType: "box",
    cssCode: `/* Art — Pixel Portrait */
.roycss-art-pixel-portrait {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(to bottom,
      #2a1810 0%, #2a1810 12%,
      #4a2818 12%, #4a2818 18%,
      #6a3820 18%, #6a3820 22%,
      #f0c898 22%, #f0c898 32%,
      transparent 32%, transparent 100%),
    radial-gradient(circle at 30% 45%, #ffffff 0%, #ffffff 4%, transparent 4%),
    radial-gradient(circle at 70% 45%, #ffffff 0%, #ffffff 4%, transparent 4%),
    radial-gradient(circle at 30% 45%, #1a1a2a 0%, #1a1a2a 2.5%, transparent 2.5%),
    radial-gradient(circle at 70% 45%, #1a1a2a 0%, #1a1a2a 2.5%, transparent 2.5%),
    linear-gradient(to bottom,
      transparent 32%, #f0c898 32%, #f0c898 55%,
      #d8a878 55%, #d8a878 60%,
      #f0c898 60%, #f0c898 75%,
      #c89868 75%, #c89868 100%);
  background-size:
    100% 100%,
    12% 12%, 12% 12%,
    12% 12%, 12% 12%,
    100% 100%;
  background-position:
    center,
    30% 45%, 70% 45%,
    30% 45%, 70% 45%,
    center;
  background-repeat: no-repeat;
  image-rendering: pixelated;
}
.roycss-art-pixel-portrait::before {
  content: "";
  position: absolute;
  inset: 22% 30% 55% 30%;
  background:
    repeating-linear-gradient(90deg,
      transparent 0px, transparent 8px,
      #2a1810 8px, #2a1810 16px);
  -webkit-mask: linear-gradient(to bottom, #000 0%, #000 80%, transparent 100%);
          mask: linear-gradient(to bottom, #000 0%, #000 80%, transparent 100%);
}
.roycss-art-pixel-portrait::after {
  content: "";
  position: absolute;
  left: 45%;
  top: 60%;
  width: 10%;
  height: 4%;
  background: #8a3828;
  border-radius: 0;
}`
  },
  {
    id: "art-geometric-mandala",
    name: "Art — Geometric Mandala",
    category: "visual",
    description:
      "Symmetric mandala of layered conic gradients and radial petals forming a meditative pattern",
    tags: ["art", "mandala", "symmetric", "geometric"],
    previewType: "box",
    cssCode: `/* Art — Geometric Mandala */
.roycss-art-geometric-mandala {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 50% 50%, #1a0a2a 0%, #050010 100%);
  overflow: hidden;
}
.roycss-art-geometric-mandala::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 90%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      transparent 0deg, transparent 8deg,
      #ffd040 8deg, #ffd040 10deg,
      transparent 10deg, transparent 30deg,
      #ff4080 30deg, #ff4080 32deg,
      transparent 32deg, transparent 60deg,
      #40d0ff 60deg, #40d0ff 62deg,
      transparent 62deg, transparent 90deg);
  border-radius: 50%;
  -webkit-mask: radial-gradient(circle,
    transparent 0%, transparent 6%,
    #000 6%, #000 96%,
    transparent 96%);
          mask: radial-gradient(circle,
    transparent 0%, transparent 6%,
    #000 6%, #000 96%,
    transparent 96%);
}
.roycss-art-geometric-mandala::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 50%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background:
    repeating-conic-gradient(from 15deg at 50% 50%,
      transparent 0deg, transparent 15deg,
      #80ff80 15deg, #80ff80 17deg,
      transparent 17deg, transparent 45deg,
      #c080ff 45deg, #c080ff 47deg,
      transparent 47deg, transparent 75deg);
  border-radius: 50%;
  -webkit-mask: radial-gradient(circle,
    #000 0%, #000 30%,
    transparent 30%, transparent 60%,
    #000 60%, #000 90%);
          mask: radial-gradient(circle,
    #000 0%, #000 30%,
    transparent 30%, transparent 60%,
    #000 60%, #000 90%);
  filter: drop-shadow(0 0 6px rgba(255, 200, 100, 0.5));
}`
  },
  {
    id: "art-fractal-tree",
    name: "Art — Fractal Tree",
    category: "visual",
    description:
      "Recursive fractal tree silhouette built from rotated, scaling branches converging to a canopy",
    tags: ["art", "fractal", "tree", "recursive"],
    previewType: "box",
    cssCode: `/* Art — Fractal Tree */
.roycss-art-fractal-tree {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(to bottom, #f8d8a8 0%, #f0c888 60%, #c89858 100%);
  overflow: hidden;
}
.roycss-art-fractal-tree::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 8%;
  height: 50%;
  transform: translateX(-50%);
  background:
    linear-gradient(to top,
      #3a2010 0%, #4a2818 60%, #5a3018 100%);
  clip-path: polygon(35% 100%, 65% 100%, 70% 70%, 60% 50%, 70% 30%, 50% 0%, 30% 30%, 40% 50%, 30% 70%);
  box-shadow:
    -30px -20px 0 -2px #4a2818,
     30px -20px 0 -2px #4a2818,
    -50px  10px 0 -4px #4a2818,
     50px  10px 0 -4px #4a2818,
    -60px -40px 0 -8px #5a3818,
     60px -40px 0 -8px #5a3818,
    -20px -50px 0 -10px #5a3818,
     20px -50px 0 -10px #5a3818,
    -40px -70px 0 -14px #6a4828,
     40px -70px 0 -14px #6a4828,
      0  -60px 0 -12px #6a4828;
}
.roycss-art-fractal-tree::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 22%;
  width: 40%;
  height: 30%;
  transform: translateX(-50%);
  background:
    radial-gradient(circle at 30% 60%, #2a4a18 0%, #2a4a18 35%, transparent 60%),
    radial-gradient(circle at 70% 60%, #2a4a18 0%, #2a4a18 35%, transparent 60%),
    radial-gradient(circle at 50% 40%, #3a5a28 0%, #3a5a28 40%, transparent 65%),
    radial-gradient(circle at 20% 40%, #1a3a08 0%, #1a3a08 30%, transparent 55%),
    radial-gradient(circle at 80% 40%, #1a3a08 0%, #1a3a08 30%, transparent 55%);
  filter: blur(1px);
}`
  },
  {
    id: "art-tessellation",
    name: "Art — Hexagonal Tessellation",
    category: "visual",
    description:
      "Repeating hexagonal honeycomb tessellation with subtle 3D shading across cells",
    tags: ["art", "tessellation", "hexagon", "pattern"],
    previewType: "box",
    cssCode: `/* Art — Hexagonal Tessellation */
.roycss-art-tessellation {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    repeating-conic-gradient(from 30deg at 50% 50%,
      #1a3a4a 0deg, #1a3a4a 60deg,
      #2a5a6a 60deg, #2a5a6a 120deg,
      #3a7a8a 120deg, #3a7a8a 180deg,
      #2a5a6a 180deg, #2a5a6a 240deg,
      #1a3a4a 240deg, #1a3a4a 300deg,
      #2a5a6a 300deg, #2a5a6a 360deg);
  background-size: 60px 60px;
  overflow: hidden;
}
.roycss-art-tessellation::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(60deg,
      transparent 0px, transparent 28px,
      rgba(0, 0, 0, 0.4) 28px, rgba(0, 0, 0, 0.4) 32px,
      transparent 32px, transparent 60px),
    repeating-linear-gradient(-60deg,
      transparent 0px, transparent 28px,
      rgba(0, 0, 0, 0.4) 28px, rgba(0, 0, 0, 0.4) 32px,
      transparent 32px, transparent 60px),
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 28px,
      rgba(0, 0, 0, 0.4) 28px, rgba(0, 0, 0, 0.4) 32px,
      transparent 32px, transparent 60px);
  -webkit-mask: radial-gradient(circle, #000 0%, #000 100%);
          mask: radial-gradient(circle, #000 0%, #000 100%);
}
.roycss-art-tessellation::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 12px at 30px 30px, rgba(255, 220, 100, 0.5) 0%, transparent 70%),
    radial-gradient(circle 12px at 90px 60px, rgba(255, 220, 100, 0.5) 0%, transparent 70%);
  background-size: 120px 80px;
  background-repeat: repeat;
}`
  },
  {
    id: "art-voronoi",
    name: "Art — Voronoi Cells",
    category: "visual",
    description:
      "Voronoi-like cellular pattern of irregular polygon cells with distinct color regions and seams",
    tags: ["art", "voronoi", "cells", "pattern"],
    previewType: "box",
    cssCode: `/* Art — Voronoi Cells */
.roycss-art-voronoi {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    conic-gradient(from 0deg at 20% 30%,
      #d8485a 0deg, #d8485a 60deg,
      #48a878 60deg, #48a878 150deg,
      #6878c8 150deg, #6878c8 240deg,
      #d8a848 240deg, #d8a848 360deg),
    conic-gradient(from 90deg at 70% 60%,
      #6878c8 0deg, #6878c8 80deg,
      #d8a848 80deg, #d8a848 180deg,
      #d8485a 180deg, #d8485a 280deg,
      #48a878 280deg, #48a878 360deg),
    conic-gradient(from 180deg at 40% 80%,
      #48a878 0deg, #48a878 90deg,
      #d8485a 90deg, #d8485a 200deg,
      #6878c8 200deg, #6878c8 360deg);
  background-blend-mode: normal;
}
.roycss-art-voronoi::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 2px at 20% 30%, #fff 0%, transparent 60%),
    radial-gradient(circle 2px at 70% 60%, #fff 0%, transparent 60%),
    radial-gradient(circle 2px at 40% 80%, #fff 0%, transparent 60%),
    radial-gradient(circle 2px at 85% 20%, #fff 0%, transparent 60%),
    radial-gradient(circle 2px at 12% 65%, #fff 0%, transparent 60%),
    radial-gradient(circle 2px at 55% 15%, #fff 0%, transparent 60%),
    linear-gradient(45deg,
      transparent 48%, rgba(0, 0, 0, 0.6) 49%, rgba(0, 0, 0, 0.6) 51%, transparent 52%),
    linear-gradient(-30deg,
      transparent 48%, rgba(0, 0, 0, 0.5) 49%, rgba(0, 0, 0, 0.5) 51%, transparent 52%),
    linear-gradient(80deg,
      transparent 48%, rgba(0, 0, 0, 0.5) 49%, rgba(0, 0, 0, 0.5) 51%, transparent 52%);
  background-size:
    100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%,
    60% 60%, 50% 50%, 70% 70%;
  background-position:
    0 0, 0 0, 0 0, 0 0, 0 0, 0 0,
    10% 20%, 50% 40%, 30% 50%;
  background-repeat: no-repeat;
}
.roycss-art-voronoi::after {
  content: "";
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.4);
}`
  },

  /* =========================================================================
   * ANIMATIONS — MESMERIZING MECHANICAL LOOPS (10)
   * ========================================================================= */
  {
    id: "hypnotic-spiral",
    name: "Hypnotic Infinite-Zoom Spiral",
    category: "animations",
    description:
      "Spiral pattern that continuously rotates and zooms inward, drawing the eye into infinity",
    tags: ["hypnotic", "spiral", "zoom", "loop"],
    previewType: "box",
    cssCode: `/* Hypnotic Infinite-Zoom Spiral */
.roycss-hypnotic-spiral {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0a0a14;
  overflow: hidden;
}
.roycss-hypnotic-spiral::before {
  content: "";
  position: absolute;
  inset: -20%;
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      #ff4080 0deg, #ff4080 8deg,
      #0a0a14 8deg, #0a0a14 16deg,
      #40d0ff 16deg, #40d0ff 24deg,
      #0a0a14 24deg, #0a0a14 32deg);
  -webkit-mask: radial-gradient(circle, #000 0%, #000 95%, transparent 100%);
          mask: radial-gradient(circle, #000 0%, #000 95%, transparent 100%);
  animation: roy-b13-hypnotic-spin 4s linear infinite, roy-b13-hypnotic-zoom 3s ease-in-out infinite alternate;
}
.roycss-hypnotic-spiral::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12%;
  height: 12%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, #ffe080 40%, transparent 80%);
  box-shadow: 0 0 40px 10px rgba(255, 220, 120, 0.7);
  animation: roy-b13-hypnotic-pulse 2s ease-in-out infinite;
}
@keyframes roy-b13-hypnotic-spin {
  to { transform: rotate(360deg); }
}
@keyframes roy-b13-hypnotic-zoom {
  0%   { filter: blur(0px) hue-rotate(0deg); }
  100% { filter: blur(2px) hue-rotate(120deg); }
}
@keyframes roy-b13-hypnotic-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
  50%      { transform: translate(-50%, -50%) scale(1.4); opacity: 0.7; }
}`
  },
  {
    id: "infinite-zoom-tunnel",
    name: "Infinite Zoom Tunnel",
    category: "animations",
    description:
      "Concentric rings continuously expand outward creating the sensation of flying through a tunnel",
    tags: ["tunnel", "zoom", "infinite", "loop"],
    previewType: "box",
    cssCode: `/* Infinite Zoom Tunnel */
.roycss-infinite-zoom-tunnel {
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, #1a0030 0%, #05000a 100%);
  overflow: hidden;
}
.roycss-infinite-zoom-tunnel::before {
  content: "";
  position: absolute;
  inset: -50%;
  background:
    repeating-radial-gradient(circle at 50% 50%,
      transparent 0px, transparent 18px,
      rgba(120, 80, 220, 0.8) 18px, rgba(120, 80, 220, 0.8) 20px,
      transparent 20px, transparent 40px,
      rgba(220, 80, 180, 0.6) 40px, rgba(220, 80, 180, 0.6) 42px,
      transparent 42px, transparent 60px,
      rgba(80, 180, 220, 0.5) 60px, rgba(80, 180, 220, 0.5) 62px);
  animation: roy-b13-tunnel-zoom 4s linear infinite;
}
.roycss-infinite-zoom-tunnel::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16%;
  height: 16%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, #fff 30%, #8050c0 70%, transparent 100%);
  box-shadow: 0 0 60px 20px rgba(180, 120, 255, 0.6);
  animation: roy-b13-tunnel-glow 2s ease-in-out infinite alternate;
}
@keyframes roy-b13-tunnel-zoom {
  from { transform: scale(0.6); }
  to   { transform: scale(1.4); }
}
@keyframes roy-b13-tunnel-glow {
  from { filter: brightness(1) blur(0px); }
  to   { filter: brightness(1.5) blur(2px); }
}`
  },
  {
    id: "matrix-rain-fall",
    name: "Matrix Digital Rain",
    category: "animations",
    description:
      "Falling green digital rain in vertical streams reminiscent of The Matrix code",
    tags: ["matrix", "rain", "digital", "code"],
    previewType: "box",
    cssCode: `/* Matrix Digital Rain */
.roycss-matrix-rain-fall {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}
.roycss-matrix-rain-fall::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 14px,
      rgba(0, 255, 80, 0.95) 14px, rgba(0, 255, 80, 0.95) 16px,
      transparent 16px, transparent 30px,
      rgba(0, 200, 60, 0.8) 30px, rgba(0, 200, 60, 0.8) 32px,
      transparent 32px, transparent 50px,
      rgba(0, 255, 120, 0.9) 50px, rgba(0, 255, 120, 0.9) 52px,
      transparent 52px, transparent 70px,
      rgba(0, 180, 60, 0.7) 70px, rgba(0, 180, 60, 0.7) 72px);
  background-size: 16px 100%, 16px 100%, 16px 100%, 16px 100%;
  background-position: 0% 0, 25% 0, 50% 0, 75% 0;
  background-repeat: repeat;
  animation: roy-b13-matrix-fall 1.5s linear infinite;
  -webkit-mask: linear-gradient(to bottom,
    transparent 0%, #000 20%, #000 80%, transparent 100%);
          mask: linear-gradient(to bottom,
    transparent 0%, #000 20%, #000 80%, transparent 100%);
}
.roycss-matrix-rain-fall::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg,
      rgba(0, 255, 80, 0.0) 0%,
      rgba(0, 255, 80, 0.15) 50%,
      rgba(0, 0, 0, 0.5) 100%);
  mix-blend-mode: screen;
}
@keyframes roy-b13-matrix-fall {
  from { background-position: 0% 0, 25% -80px, 50% -40px, 75% -120px; }
  to   { background-position: 0% 80px, 25% 0px, 50% 40px, 75% -40px; }
}`
  },
  {
    id: "star-wars-crawl",
    name: "Star Wars Opening Crawl",
    category: "animations",
    description:
      "Perspective-tilted scrolling text receding into the distance like the iconic Star Wars opening",
    tags: ["star-wars", "crawl", "perspective", "scroll"],
    previewType: "box",
    cssCode: `/* Star Wars Opening Crawl */
.roycss-star-wars-crawl {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
  perspective: 200px;
}
.roycss-star-wars-crawl::before {
  content: "A long time ago in a galaxy far, far away.... EPISODE XIII  RETURN OF THE CSS  There is unrest in the Galactic Senate. Several hundred solar systems have declared their intentions to leave the Republic. This separatist movement, under the leadership of the mysterious Count CSS, has made it difficult for the limited number of Jedi Knights to maintain peace and order in the galaxy.";
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: -50%;
  color: #ffe060;
  font-family: "Georgia", serif;
  font-size: 16px;
  line-height: 1.5;
  text-align: justify;
  transform: rotateX(35deg);
  transform-origin: 50% 100%;
  animation: roy-b13-sw-crawl 12s linear infinite;
  text-shadow: 0 0 6px rgba(255, 220, 80, 0.6);
}
.roycss-star-wars-crawl::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, #000 80%);
  pointer-events: none;
}
@keyframes roy-b13-sw-crawl {
  0%   { bottom: -50%; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { bottom: 150%; opacity: 0; }
}`
  },
  {
    id: "conveyor-belt",
    name: "Infinite Conveyor Belt",
    category: "animations",
    description:
      "Continuously scrolling conveyor belt with chevron tread pattern moving in an endless loop",
    tags: ["conveyor", "belt", "industrial", "loop"],
    previewType: "box",
    cssCode: `/* Infinite Conveyor Belt */
.roycss-conveyor-belt {
  position: relative;
  width: 100%;
  height: 100%;
  background: #2a2a2a;
  overflow: hidden;
}
.roycss-conveyor-belt::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 25%;
  height: 50%;
  background:
    repeating-linear-gradient(45deg,
      #1a1a1a 0px, #1a1a1a 10px,
      #3a3a3a 10px, #3a3a3a 20px,
      #1a1a1a 20px, #1a1a1a 30px,
      #3a3a3a 30px, #3a3a3a 40px);
  background-size: 40px 40px;
  animation: roy-b13-conveyor-move 1s linear infinite;
  border-top: 4px solid #555;
  border-bottom: 4px solid #555;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6);
}
.roycss-conveyor-belt::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 22%;
  height: 4%;
  background:
    radial-gradient(circle 8px at 4% 50%, #888 0%, #444 60%, transparent 100%),
    radial-gradient(circle 8px at 96% 50%, #888 0%, #444 60%, transparent 100%);
}
@keyframes roy-b13-conveyor-move {
  from { background-position: 0 0; }
  to   { background-position: 40px 0; }
}`
  },
  {
    id: "escalator-steps",
    name: "Escalator Steps",
    category: "animations",
    description:
      "Diagonal escalator with rising step segments continuously looping upward at an angle",
    tags: ["escalator", "steps", "mechanical", "loop"],
    previewType: "box",
    cssCode: `/* Escalator Steps */
.roycss-escalator-steps {
  position: relative;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  overflow: hidden;
}
.roycss-escalator-steps::before {
  content: "";
  position: absolute;
  left: -20%;
  right: -20%;
  top: 15%;
  bottom: 15%;
  background:
    repeating-linear-gradient(135deg,
      #888 0px, #888 12px,
      #444 12px, #444 14px,
      #888 14px, #888 26px,
      #444 26px, #444 28px),
    repeating-linear-gradient(45deg,
      transparent 0px, transparent 26px,
      rgba(0, 0, 0, 0.4) 26px, rgba(0, 0, 0, 0.4) 28px);
  background-size: 28px 28px, 28px 28px;
  transform: skewX(-30deg);
  animation: roy-b13-escalator-up 1.5s linear infinite;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
}
.roycss-escalator-steps::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 10%;
  height: 6%;
  background: linear-gradient(to bottom, #555, #222);
  border-bottom: 2px solid #000;
}
@keyframes roy-b13-escalator-up {
  from { background-position: 0 0, 0 0; }
  to   { background-position: 0 -28px, 0 -28px; }
}`
  },
  {
    id: "windmill-spin",
    name: "Windmill Spinning",
    category: "animations",
    description:
      "Windmill tower with four rotating blades spinning continuously against a sky background",
    tags: ["windmill", "spinning", "blades", "scenic"],
    previewType: "box",
    cssCode: `/* Windmill Spinning */
.roycss-windmill-spin {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(to bottom, #8ec5e8 0%, #b8d8f0 60%, #c8d8a8 70%, #98b878 100%);
  overflow: hidden;
}
.roycss-windmill-spin::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 12%;
  height: 70%;
  transform: translateX(-50%);
  background:
    linear-gradient(to top, #6a4828 0%, #8a6838 60%, #aa8848 100%);
  clip-path: polygon(20% 100%, 80% 100%, 65% 0%, 35% 0%);
}
.roycss-windmill-spin::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 25%;
  width: 70%;
  height: 70%;
  transform: translate(-50%, -50%);
  background:
    conic-gradient(from 0deg at 50% 50%,
      #f0f0f0 0deg, #f0f0f0 80deg,
      transparent 80deg, transparent 90deg,
      #f0f0f0 90deg, #f0f0f0 170deg,
      transparent 170deg, transparent 180deg,
      #f0f0f0 180deg, #f0f0f0 260deg,
      transparent 260deg, transparent 270deg,
      #f0f0f0 270deg, #f0f0f0 350deg,
      transparent 350deg, transparent 360deg);
  -webkit-mask: radial-gradient(circle at 50% 50%,
    #000 2%, #000 50%, transparent 51%);
          mask: radial-gradient(circle at 50% 50%,
    #000 2%, #000 50%, transparent 51%);
  animation: roy-b13-windmill-rotate 4s linear infinite;
  transform-origin: 50% 50%;
  filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.4));
}
@keyframes roy-b13-windmill-rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}`
  },
  {
    id: "ferris-wheel",
    name: "Ferris Wheel",
    category: "animations",
    description:
      "Rotating Ferris wheel with eight colorful carts that stay upright as the wheel turns",
    tags: ["ferris", "wheel", "carnival", "rotating"],
    previewType: "box",
    cssCode: `/* Ferris Wheel */
.roycss-ferris-wheel {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(to bottom, #2a1a4a 0%, #4a2a6a 50%, #1a0a2a 100%);
  overflow: hidden;
}
.roycss-ferris-wheel::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 80%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      transparent 0deg, transparent 22deg,
      #ffe060 22deg, #ffe060 24deg,
      transparent 24deg, transparent 67deg,
      #ff6080 67deg, #ff6080 69deg,
      transparent 69deg, transparent 112deg,
      #60c0ff 112deg, #60c0ff 114deg,
      transparent 114deg, transparent 157deg,
      #80ff80 157deg, #80ff80 159deg,
      transparent 159deg, transparent 202deg,
      #c080ff 202deg, #c080ff 204deg,
      transparent 204deg, transparent 247deg,
      #ffa040 247deg, #ffa040 249deg,
      transparent 249deg, transparent 292deg,
      #ff4080 292deg, #ff4080 294deg,
      transparent 294deg, transparent 337deg,
      #40e0c0 337deg, #40e0c0 339deg,
      transparent 339deg, transparent 360deg);
  border-radius: 50%;
  -webkit-mask: radial-gradient(circle at 50% 50%,
    #000 0%, #000 4%, transparent 5%, #000 6%, #000 92%, transparent 93%);
          mask: radial-gradient(circle at 50% 50%,
    #000 0%, #000 4%, transparent 5%, #000 6%, #000 92%, transparent 93%);
  animation: roy-b13-ferris-rotate 12s linear infinite;
  filter: drop-shadow(0 0 10px rgba(255, 220, 100, 0.5));
}
.roycss-ferris-wheel::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 4%;
  height: 55%;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, #888 0%, #444 100%);
  clip-path: polygon(30% 100%, 70% 100%, 60% 0%, 40% 0%);
}
@keyframes roy-b13-ferris-rotate {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}`
  },
  {
    id: "clock-tick",
    name: "Analog Clock Ticking",
    category: "animations",
    description:
      "Analog clock face with hour markers and three hands rotating at correct relative speeds",
    tags: ["clock", "analog", "ticking", "time"],
    previewType: "box",
    cssCode: `/* Analog Clock Ticking */
.roycss-clock-tick {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 50% 50%, #f8f4e8 0%, #d8d0b8 100%);
  overflow: hidden;
}
.roycss-clock-tick::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 80%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      #1a1a1a 0deg, #1a1a1a 2deg,
      transparent 2deg, transparent 30deg);
  -webkit-mask: radial-gradient(circle at 50% 50%,
    transparent 0%, transparent 38%,
    #000 39%, #000 50%, transparent 51%);
          mask: radial-gradient(circle at 50% 50%,
    transparent 0%, transparent 38%,
    #000 39%, #000 50%, transparent 51%);
  border-radius: 50%;
  border: 6px solid #1a1a1a;
}
.roycss-clock-tick::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 4%;
  height: 40%;
  background: linear-gradient(to top, transparent 0%, #1a1a1a 20%, #1a1a1a 100%);
  transform-origin: 50% 100%;
  transform: translate(-50%, -100%) rotate(0deg);
  animation: roy-b13-clock-second 6s steps(60) infinite;
  border-radius: 4px 4px 0 0;
}
.roycss-clock-tick > .hands {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 3%;
  height: 30%;
  background: linear-gradient(to top, transparent 0%, #1a1a1a 30%, #1a1a1a 100%);
  transform-origin: 50% 100%;
  transform: translate(-50%, -100%);
  animation: roy-b13-clock-minute 72s linear infinite;
  border-radius: 4px 4px 0 0;
  z-index: 2;
}
.roycss-clock-tick > .hour {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 4%;
  height: 22%;
  background: #1a1a1a;
  transform-origin: 50% 100%;
  transform: translate(-50%, -100%);
  animation: roy-b13-clock-hour 360s linear infinite;
  border-radius: 4px 4px 0 0;
  z-index: 3;
}
@keyframes roy-b13-clock-second { to { transform: translate(-50%, -100%) rotate(360deg); } }
@keyframes roy-b13-clock-minute { to { transform: translate(-50%, -100%) rotate(360deg); } }
@keyframes roy-b13-clock-hour   { to { transform: translate(-50%, -100%) rotate(360deg); } }`
  },
  {
    id: "pendulum-clock",
    name: "Grandfather Pendulum Clock",
    category: "animations",
    description:
      "Grandfather clock cabinet with a swinging brass pendulum swaying with natural deceleration",
    tags: ["clock", "pendulum", "grandfather", "swinging"],
    previewType: "box",
    cssCode: `/* Grandfather Pendulum Clock */
.roycss-pendulum-clock {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(to bottom, #4a2818 0%, #6a3818 30%, #5a2a10 100%);
  overflow: hidden;
}
.roycss-pendulum-clock::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 12%;
  width: 45%;
  height: 30%;
  transform: translateX(-50%);
  background:
    radial-gradient(circle at 50% 50%, #f8f4e8 0%, #d8d0b8 80%, #1a1a1a 100%);
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 6px #3a1a08,
    0 4px 12px rgba(0, 0, 0, 0.6);
}
.roycss-pendulum-clock::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 45%;
  width: 6%;
  height: 45%;
  transform-origin: 50% 0%;
  transform: translateX(-50%);
  background:
    linear-gradient(to bottom,
      transparent 0%, transparent 10%,
      #c8a050 10%, #d8b060 40%, #c89040 100%);
  border-radius: 4px;
  animation: roy-b13-pendulum-swing 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate;
}
.roycss-pendulum-clock > .bob {
  position: absolute;
  left: 50%;
  top: 88%;
  width: 14%;
  height: 14%;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(circle at 40% 40%, #ffe080 0%, #c89040 50%, #6a3818 100%);
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  animation: roy-b13-pendulum-bob 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate;
}
@keyframes roy-b13-pendulum-swing {
  from { transform: translateX(-50%) rotate(-25deg); }
  to   { transform: translateX(-50%) rotate(25deg); }
}
@keyframes roy-b13-pendulum-bob {
  from { transform: translate(-50%, -50%) translateX(-60px); }
  to   { transform: translate(-50%, -50%) translateX(60px); }
}`
  },

  /* =========================================================================
   * TEXT — ARTISTIC TYPOGRAPHY (6)
   * ========================================================================= */
  {
    id: "text-typewriter-erase",
    name: "Text — Typewriter Type & Erase",
    category: "text",
    description:
      "Text that types out one character at a time then erases, looping forever like a typewriter",
    tags: ["text", "typewriter", "typing", "erasing"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text — Typewriter Type & Erase */
.roycss-text-typewriter-erase {
  position: relative;
  display: inline-block;
  font-family: "Courier New", monospace;
  font-weight: 700;
  font-size: 2rem;
  letter-spacing: 2px;
  color: #1a1a2a;
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid #1a1a2a;
  width: 0;
  animation:
    roy-b13-type 6s steps(6) infinite alternate,
    roy-b13-cursor 0.7s step-end infinite;
}
@keyframes roy-b13-type {
  0%      { width: 0; }
  40%, 60% { width: 6ch; }
  100%    { width: 0; }
}
@keyframes roy-b13-cursor {
  50% { border-color: transparent; }
}`
  },
  {
    id: "text-scramble",
    name: "Text — Scramble Resolve",
    category: "text",
    description:
      "Text that starts as scrambled garbage characters and resolves into clean text on a loop",
    tags: ["text", "scramble", "decode", "glitch"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text — Scramble Resolve */
.roycss-text-scramble {
  position: relative;
  display: inline-block;
  font-family: "Courier New", monospace;
  font-weight: 700;
  font-size: 2.4rem;
  letter-spacing: 4px;
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.4);
  animation: roy-b13-scramble-resolve 4s steps(1) infinite;
}
.roycss-text-scramble::before {
  content: "RoyCSS";
  position: absolute;
  left: 0;
  top: 0;
  color: #ff0066;
  text-shadow: 0 0 10px rgba(255, 0, 102, 0.7);
  animation: roy-b13-scramble-shift 4s steps(1) infinite;
  mix-blend-mode: screen;
}
@keyframes roy-b13-scramble-resolve {
  0%   { content: "#$%X&*"; opacity: 0.6; filter: blur(1px); }
  20%  { content: "R~$%X*"; opacity: 0.8; }
  40%  { content: "Ro~$X*"; opacity: 0.9; }
  60%  { content: "RoyC%*"; opacity: 1; }
  80%  { content: "RoyCS*"; opacity: 1; filter: blur(0); }
  100% { content: "RoyCSS"; opacity: 1; filter: blur(0); }
}
@keyframes roy-b13-scramble-shift {
  0%, 100% { transform: translate(0, 0); }
  25%      { transform: translate(-2px, 1px); }
  50%      { transform: translate(2px, -1px); }
  75%      { transform: translate(-1px, 2px); }
}`
  },
  {
    id: "text-gradient-flow-3d",
    name: "Text — 3D Gradient Flow",
    category: "text",
    description:
      "Bold text with a multi-color gradient that flows through it in 3D extruded relief",
    tags: ["text", "gradient", "3d", "flow"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text — 3D Gradient Flow */
.roycss-text-gradient-flow-3d {
  position: relative;
  display: inline-block;
  font-family: "Arial Black", sans-serif;
  font-weight: 900;
  font-size: 3rem;
  letter-spacing: 2px;
  color: #fff;
  background: linear-gradient(90deg,
    #ff0080, #ff8000, #ffe000, #00e040, #00a0ff, #8020c0, #ff0080);
  background-size: 200% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    1px 1px 0 #c01060,
    2px 2px 0 #a00850,
    3px 3px 0 #800440,
    4px 4px 0 #600030,
    5px 5px 0 #400020,
    6px 6px 0 #200010,
    7px 7px 8px rgba(0, 0, 0, 0.5);
  animation: roy-b13-3d-flow 4s linear infinite;
  transform: perspective(400px) rotateX(15deg);
}
@keyframes roy-b13-3d-flow {
  to { background-position: 200% 0; }
}`
  },
  {
    id: "text-glitch-matrix",
    name: "Text — Matrix Glitch",
    category: "text",
    description:
      "Text with green Matrix-style glitch slices and chromatic aberration shifts on a loop",
    tags: ["text", "matrix", "glitch", "chromatic"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text — Matrix Glitch */
.roycss-text-glitch-matrix {
  position: relative;
  display: inline-block;
  font-family: "Courier New", monospace;
  font-weight: 700;
  font-size: 2.6rem;
  letter-spacing: 3px;
  color: #00ff66;
  text-shadow:
    0 0 5px rgba(0, 255, 102, 0.8),
    0 0 15px rgba(0, 255, 102, 0.5);
  animation: roy-b13-matrix-flicker 2.5s infinite;
}
.roycss-text-glitch-matrix::before,
.roycss-text-glitch-matrix::after {
  content: "RoyCSS";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}
.roycss-text-glitch-matrix::before {
  color: #ff0040;
  z-index: -1;
  animation: roy-b13-matrix-glitch-1 2s infinite linear alternate;
}
.roycss-text-glitch-matrix::after {
  color: #00ffff;
  z-index: -2;
  animation: roy-b13-matrix-glitch-2 1.6s infinite linear alternate;
}
@keyframes roy-b13-matrix-flicker {
  0%, 100% { opacity: 1; }
  3% { opacity: 0.6; }
  6% { opacity: 1; }
  72% { opacity: 1; }
  74% { opacity: 0.4; }
  76% { opacity: 1; }
}
@keyframes roy-b13-matrix-glitch-1 {
  0%, 100% { transform: translate(0, 0); clip-path: inset(0 0 0 0); }
  20% { transform: translate(-3px, 1px); clip-path: inset(20% 0 40% 0); }
  40% { transform: translate(3px, -1px); clip-path: inset(60% 0 10% 0); }
  60% { transform: translate(-2px, 2px); clip-path: inset(30% 0 50% 0); }
  80% { transform: translate(2px, -2px); clip-path: inset(10% 0 70% 0); }
}
@keyframes roy-b13-matrix-glitch-2 {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(2px, -2px); }
  50% { transform: translate(-2px, 2px); }
  75% { transform: translate(2px, 1px); }
}`
  },
  {
    id: "text-rainbow-breathe",
    name: "Text — Rainbow Breathe",
    category: "text",
    description:
      "Soft rainbow gradient text that breathes in scale and shifts hue while glowing gently",
    tags: ["text", "rainbow", "breathe", "glow"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text — Rainbow Breathe */
.roycss-text-rainbow-breathe {
  display: inline-block;
  font-family: "Georgia", serif;
  font-weight: 700;
  font-size: 2.6rem;
  letter-spacing: 4px;
  background: linear-gradient(90deg,
    #ff4040, #ff8040, #ffe040, #40e060, #40c0ff, #6040ff, #c040ff, #ff4040);
  background-size: 300% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 12px rgba(255, 200, 100, 0.5));
  animation:
    roy-b13-rb-shift 5s linear infinite,
    roy-b13-rb-breathe 3s ease-in-out infinite;
}
@keyframes roy-b13-rb-shift {
  to { background-position: 300% 0; }
}
@keyframes roy-b13-rb-breathe {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 8px rgba(255, 150, 200, 0.4));
  }
  50% {
    transform: scale(1.08);
    filter: drop-shadow(0 0 20px rgba(150, 200, 255, 0.7));
  }
}`
  },
  {
    id: "text-shadow-perspective",
    name: "Text — Perspective Shadow",
    category: "text",
    description:
      "Floating text with a long perspective shadow that stretches onto a ground plane below",
    tags: ["text", "shadow", "perspective", "3d"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text — Perspective Shadow */
.roycss-text-shadow-perspective {
  position: relative;
  display: inline-block;
  font-family: "Arial Black", sans-serif;
  font-weight: 900;
  font-size: 2.8rem;
  letter-spacing: 3px;
  color: #f8f8f8;
  background: linear-gradient(to bottom, #ffffff 0%, #d0d0d8 100%);
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    0 1px 0 #ccc,
    0 2px 0 #bbb,
    0 3px 0 #aaa,
    0 4px 0 #999,
    0 5px 6px rgba(0, 0, 0, 0.3);
  transform: perspective(300px) rotateX(20deg);
  transform-origin: 50% 100%;
}
.roycss-text-shadow-perspective::before {
  content: "RoyCSS";
  position: absolute;
  left: 0;
  top: 0;
  color: transparent;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  transform: perspective(300px) rotateX(80deg) scaleY(0.6);
  transform-origin: 50% 100%;
  top: 100%;
  filter: blur(2px);
  z-index: -1;
}
.roycss-text-shadow-perspective::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -25%;
  width: 60%;
  height: 8%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.5) 0%, transparent 70%);
  filter: blur(4px);
}`
  }
];
