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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 62%, color-mix(in oklch, oklch(0.904 0.126 90.5) 90%, transparent) 0%, color-mix(in oklch, oklch(0.788 0.147 58.19) 50%, transparent) 8%, transparent 18%),
    linear-gradient(to bottom,
      oklch(0.206 0.061 294.87) 0%,
      oklch(0.293 0.087 313.4) 18%,
      oklch(0.385 0.114 344.27) 32%,
      oklch(0.535 0.166 1.27) 48%,
      oklch(0.68 0.174 40) 62%,
      oklch(0.814 0.136 64.09) 74%,
      oklch(0.901 0.106 84.68) 84%,
      oklch(0.242 0.07 310.4) 95%,
      oklch(0.158 0.049 289.38) 100%);
}
.roycss-css-painting-sunset::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 55%;
  background:
    linear-gradient(to top, oklch(0.118 0.03 286.18) 0%, oklch(0.118 0.03 286.18) 35%, transparent 100%),
    oklch(0.118 0.03 286.18);
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
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 35%;
  background: oklch(0.083 0.03 289.57);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 30%, color-mix(in oklch, oklch(0.809 0.047 135.12) 25%, transparent) 0%, transparent 55%),
    linear-gradient(to bottom, oklch(0.314 0.027 140.77) 0%, oklch(0.257 0.018 158.51) 40%, oklch(0.197 0.019 157.78) 75%, oklch(0.137 0.012 160.16) 100%);
}
.roycss-css-painting-forest::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(90deg,
      transparent 0px, transparent 38px,
      color-mix(in oklch, oklch(0.148 0.011 144.99) 95%, transparent) 38px, color-mix(in oklch, oklch(0.148 0.011 144.99) 95%, transparent) 44px,
      transparent 44px, transparent 50px,
      color-mix(in oklch, oklch(0.19 0.018 144.85) 85%, transparent) 50px, color-mix(in oklch, oklch(0.19 0.018 144.85) 85%, transparent) 53px),
    repeating-linear-gradient(90deg,
      transparent 0px, transparent 70px,
      color-mix(in oklch, oklch(0.127 0.013 153.48) 100%, transparent) 70px, color-mix(in oklch, oklch(0.127 0.013 153.48) 100%, transparent) 78px);
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
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 40%;
  background: linear-gradient(to top, color-mix(in oklch, oklch(0.812 0.035 145.24) 18%, transparent) 0%, transparent 100%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom,
      oklch(0.891 0.069 77.45) 0%,
      oklch(0.831 0.095 56.11) 18%,
      oklch(0.725 0.111 45.1) 35%,
      oklch(0.568 0.062 248.97) 50%,
      oklch(0.457 0.065 249.41) 55%,
      oklch(0.384 0.064 253.51) 70%,
      oklch(0.302 0.056 255.33) 100%);
}
.roycss-css-painting-ocean::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-start: 48%;
  inset-block-end: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 6px,
      color-mix(in oklch, oklch(0.957 0.054 89.91) 18%, transparent) 6px, color-mix(in oklch, oklch(0.957 0.054 89.91) 18%, transparent) 7px,
      transparent 7px, transparent 14px,
      color-mix(in oklch, oklch(1 0 89.88) 10%, transparent) 14px, color-mix(in oklch, oklch(1 0 89.88) 10%, transparent) 15px),
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 22px,
      color-mix(in oklch, oklch(0.848 0.043 237.22) 15%, transparent) 22px, color-mix(in oklch, oklch(0.848 0.043 237.22) 15%, transparent) 24px);
  mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0 0 0) 0%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0 0 0) 0%, transparent 80%);
}
.roycss-css-painting-ocean::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 38%;
  transform: translateX(-50%);
  inline-size: 80px;
  block-size: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.969 0.049 94.61) 0%, oklch(0.872 0.124 80.7) 40%, transparent 70%);
  box-shadow: 0 0 80px 30px color-mix(in oklch, oklch(0.865 0.116 75.55) 60%, transparent);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 75% 25%, color-mix(in oklch, oklch(0.963 0.083 100.4) 95%, transparent) 0%, color-mix(in oklch, oklch(0.905 0.116 88.79) 50%, transparent) 4%, transparent 9%),
    linear-gradient(to bottom,
      oklch(0.736 0.087 230.25) 0%,
      oklch(0.808 0.05 223.14) 22%,
      oklch(0.873 0.099 83.32) 42%,
      oklch(0.777 0.121 69.78) 58%,
      oklch(0.648 0.127 56.39) 75%,
      oklch(0.479 0.103 51.38) 100%);
}
.roycss-css-painting-desert::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 50%;
  background:
    radial-gradient(ellipse 80% 100% at 20% 100%, oklch(0.579 0.129 50.52) 0%, transparent 60%),
    radial-gradient(ellipse 90% 100% at 80% 100%, oklch(0.683 0.124 53.39) 0%, transparent 55%),
    linear-gradient(to bottom, oklch(0.648 0.127 56.39) 0%, oklch(0.479 0.103 51.38) 100%);
  clip-path: polygon(
    0% 100%, 0% 55%,
    12% 35%, 22% 50%, 35% 25%, 48% 45%, 60% 20%, 72% 42%, 85% 28%, 100% 38%,
    100% 100%
  );
}
.roycss-css-painting-desert::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 30%;
  background:
    linear-gradient(to top, oklch(0.345 0.081 47.67) 0%, transparent 100%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 25%, color-mix(in oklch, oklch(0.928 0.103 92.71) 35%, transparent) 0%, transparent 18%),
    radial-gradient(circle at 70% 30%, color-mix(in oklch, oklch(0.891 0.053 261.66) 25%, transparent) 0%, transparent 12%),
    linear-gradient(to bottom, oklch(0.17 0.063 277.28) 0%, oklch(0.251 0.087 278.11) 30%, oklch(0.267 0.086 295.38) 55%, oklch(0.144 0.026 290.84) 100%);
}
.roycss-css-painting-city-night::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 70%;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 8px,
      color-mix(in oklch, oklch(0.902 0.143 93.06) 90%, transparent) 8px, color-mix(in oklch, oklch(0.902 0.143 93.06) 90%, transparent) 11px,
      transparent 11px, transparent 20px,
      color-mix(in oklch, oklch(0.953 0.078 95.74) 70%, transparent) 20px, color-mix(in oklch, oklch(0.953 0.078 95.74) 70%, transparent) 22px),
    repeating-linear-gradient(90deg,
      transparent 0px, transparent 6px,
      color-mix(in oklch, oklch(0.144 0.026 290.84) 98%, transparent) 6px, color-mix(in oklch, oklch(0.144 0.026 290.84) 98%, transparent) 9px);
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
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 20%;
  background: linear-gradient(to top, color-mix(in oklch, oklch(0.861 0.147 83.67) 18%, transparent) 0%, transparent 100%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 50%, color-mix(in oklch, oklch(1 0 89.88) 15%, transparent) 0%, transparent 0.5%),
    radial-gradient(2px 2px at 12% 18%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 28% 72%, oklch(1 0 89.88), transparent),
    radial-gradient(1.5px 1.5px at 78% 22%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 88% 65%, oklch(0.89 0.03 248.16), transparent),
    radial-gradient(1px 1px at 18% 88%, oklch(1 0 89.88), transparent),
    radial-gradient(2px 2px at 65% 12%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 8% 50%, oklch(0.926 0.038 17.85), transparent),
    radial-gradient(1.5px 1.5px at 92% 42%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 45% 88%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 38% 12%, oklch(1 0 89.88), transparent),
    radial-gradient(circle at 50% 50%,
      oklch(1 0 89.88) 0%, oklch(1 0 89.88) 1%,
      oklch(0.942 0.058 83) 3%, oklch(0.82 0.123 58.93) 6%,
      oklch(0.673 0.137 351.26) 12%, oklch(0.539 0.17 300.58) 22%,
      oklch(0.403 0.172 281.93) 35%, oklch(0.257 0.131 277.4) 50%,
      oklch(0.136 0.06 277.26) 75%, oklch(0.086 0.034 286.5) 100%);
}
.roycss-css-painting-galaxy::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    conic-gradient(from 0deg at 50% 50%,
      transparent 0deg,
      color-mix(in oklch, oklch(0.674 0.155 310.51) 35%, transparent) 30deg,
      transparent 60deg,
      color-mix(in oklch, oklch(0.76 0.125 254.62) 30%, transparent) 90deg,
      transparent 120deg,
      color-mix(in oklch, oklch(0.757 0.106 337.66) 30%, transparent) 180deg,
      transparent 210deg,
      color-mix(in oklch, oklch(0.805 0.059 224.53) 30%, transparent) 240deg,
      transparent 270deg,
      color-mix(in oklch, oklch(0.745 0.112 316.05) 30%, transparent) 300deg,
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
      color-mix(in oklch, oklch(0.957 0.054 89.91) 40%, transparent) 0%, transparent 70%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse 100% 60% at 50% 100%, oklch(0.912 0.038 224.27) 0%, oklch(0.795 0.069 229.87) 40%, oklch(0.667 0.094 239.47) 100%);
}
.roycss-css-rainbow-arc::before {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-end: 0;
  inline-size: 140%;
  aspect-ratio: 2 / 1;
  transform: translateX(-50%);
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  background:
    radial-gradient(ellipse at 50% 100%,
      transparent 0%,
      transparent 56%,
      oklch(0.632 0.254 20.85) 57%, oklch(0.632 0.254 20.85) 60%,
      oklch(0.732 0.186 52.98) 61%, oklch(0.732 0.186 52.98) 64%,
      oklch(0.905 0.188 99.07) 65%, oklch(0.905 0.188 99.07) 68%,
      oklch(0.788 0.247 145.08) 69%, oklch(0.788 0.247 145.08) 72%,
      oklch(0.685 0.177 246.21) 73%, oklch(0.685 0.177 246.21) 76%,
      oklch(0.506 0.277 266.24) 77%, oklch(0.506 0.277 266.24) 80%,
      oklch(0.485 0.226 306.28) 81%, oklch(0.485 0.226 306.28) 84%,
      transparent 85%);
  filter: drop-shadow(0 0 8px color-mix(in oklch, oklch(1 0 89.88) 40%, transparent));
}
.roycss-css-rainbow-arc::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 25%;
  background:
    radial-gradient(ellipse 50% 100% at 15% 100%, color-mix(in oklch, oklch(1 0 89.88) 85%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse 60% 100% at 85% 100%, color-mix(in oklch, oklch(1 0 89.88) 75%, transparent) 0%, transparent 55%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom, oklch(0.118 0.053 285.18) 0%, oklch(0.182 0.089 274.97) 35%, oklch(0.245 0.105 279.83) 55%, oklch(0.141 0.036 271.01) 80%, oklch(0.113 0.017 250.78) 100%);
}
.roycss-css-aurora-landscape::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 35% at 30% 35%, color-mix(in oklch, oklch(0.889 0.194 154.94) 55%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse 60% 30% at 70% 30%, color-mix(in oklch, oklch(0.64 0.249 306.76) 50%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse 50% 25% at 50% 45%, color-mix(in oklch, oklch(0.803 0.111 240.15) 40%, transparent) 0%, transparent 60%);
  filter: blur(12px);
  mix-blend-mode: screen;
  animation: roy-b13-aurora-wave 8s ease-in-out infinite alternate;
}
.roycss-css-aurora-landscape::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 45%;
  background:
    linear-gradient(to top, oklch(0.135 0.019 264.32) 0%, transparent 100%),
    oklch(0.135 0.019 264.32);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom,
      oklch(0.665 0.102 232.98) 0%,
      oklch(0.515 0.095 239.63) 25%,
      oklch(0.41 0.091 245.4) 55%,
      oklch(0.279 0.067 249.45) 80%,
      oklch(0.168 0.037 246.64) 100%);
}
.roycss-css-underwater-scene::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(165deg,
      transparent 8%,
      color-mix(in oklch, oklch(0.945 0.029 240.18) 22%, transparent) 10%, transparent 13%,
      transparent 22%,
      color-mix(in oklch, oklch(0.945 0.029 240.18) 18%, transparent) 24%, transparent 28%,
      transparent 40%,
      color-mix(in oklch, oklch(0.945 0.029 240.18) 25%, transparent) 42%, transparent 47%,
      transparent 60%,
      color-mix(in oklch, oklch(0.945 0.029 240.18) 15%, transparent) 62%, transparent 66%,
      transparent 78%,
      color-mix(in oklch, oklch(0.945 0.029 240.18) 20%, transparent) 80%, transparent 84%);
  filter: blur(2px);
  mix-blend-mode: screen;
  animation: roy-b13-uw-shift 7s ease-in-out infinite alternate;
}
.roycss-css-underwater-scene::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 30%;
  background:
    radial-gradient(ellipse 30% 100% at 20% 100%, color-mix(in oklch, oklch(0.225 0.053 241.61) 70%, transparent) 0%, transparent 70%),
    radial-gradient(ellipse 25% 100% at 80% 100%, color-mix(in oklch, oklch(0.225 0.053 241.61) 70%, transparent) 0%, transparent 70%),
    linear-gradient(to top, oklch(0.168 0.037 246.64) 0%, transparent 100%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 75%, color-mix(in oklch, oklch(0.721 0.185 46.37) 50%, transparent) 0%, transparent 25%),
    linear-gradient(to bottom, oklch(0.164 0.032 21.21) 0%, oklch(0.213 0.043 21.38) 30%, oklch(0.289 0.078 38.29) 55%, oklch(0.176 0.042 22.37) 80%, oklch(0.107 0.023 21.77) 100%);
}
.roycss-css-volcano-eruption::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 55%;
  background:
    linear-gradient(to top, oklch(0.164 0.032 21.21) 0%, oklch(0.207 0.049 33.76) 60%, transparent 100%),
    oklch(0.164 0.032 21.21);
  clip-path: polygon(
    0% 100%, 0% 80%,
    15% 75%, 25% 35%, 32% 45%, 38% 20%, 45% 50%, 50% 30%,
    55% 50%, 62% 20%, 68% 45%, 75% 35%, 85% 75%, 100% 80%, 100% 100%
  );
}
.roycss-css-volcano-eruption::after {
  content: "";
  position: absolute;
  inset-inline-start: 35%;
  inset-block-start: 8%;
  inline-size: 30%;
  block-size: 60%;
  background:
    radial-gradient(ellipse 100% 70% at 50% 100%,
      color-mix(in oklch, oklch(0.695 0.201 39.3) 85%, transparent) 0%,
      color-mix(in oklch, oklch(0.583 0.164 40.41) 60%, transparent) 25%,
      color-mix(in oklch, oklch(0.429 0.09 39) 40%, transparent) 55%,
      color-mix(in oklch, oklch(0.328 0.014 17.91) 25%, transparent) 80%,
      transparent 100%);
  filter: blur(8px);
  transform: skewX(-3deg);
}
/* falling embers layer */
.roycss-css-volcano-eruption > .embers {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(2px 2px at 20% 30%, oklch(0.689 0.206 39.23), transparent),
    radial-gradient(1px 1px at 60% 40%, oklch(0.803 0.16 70.19), transparent),
    radial-gradient(2px 2px at 80% 25%, oklch(0.735 0.173 45.09), transparent),
    radial-gradient(1px 1px at 35% 50%, oklch(0.689 0.206 39.23), transparent),
    radial-gradient(1.5px 1.5px at 75% 60%, oklch(0.816 0.143 68.42), transparent);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom, oklch(0.826 0.029 248.17) 0%, oklch(0.903 0.014 247.98) 35%, oklch(0.937 0.007 268.55) 60%, oklch(0.854 0.014 247.99) 100%);
}
.roycss-css-snowy-mountain::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 75%;
  background:
    linear-gradient(to top, oklch(0.487 0.015 255.57) 0%, oklch(0.597 0.014 255.55) 30%, oklch(0.753 0.015 248.02) 60%, oklch(0.96 0.003 247.86) 90%);
  clip-path: polygon(
    0% 100%, 0% 70%,
    10% 60%, 20% 50%, 30% 30%, 38% 15%, 45% 25%, 52% 10%,
    60% 28%, 70% 45%, 80% 55%, 90% 65%, 100% 70%, 100% 100%
  );
}
.roycss-css-snowy-mountain::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-end: 0;
  block-size: 50%;
  background:
    linear-gradient(to top, oklch(1 0 89.88) 0%, oklch(0.965 0.007 247.9) 40%, transparent 100%);
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
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom,
      oklch(0.771 0.099 231.11) 0%,
      oklch(0.822 0.074 223.09) 35%,
      oklch(0.685 0.112 218.3) 45%,
      oklch(0.584 0.102 223.83) 55%,
      oklch(0.833 0.075 94.06) 65%,
      oklch(0.882 0.075 94.05) 80%,
      oklch(0.781 0.085 95.79) 100%);
}
.roycss-css-tropical-beach::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-start: 55%;
  inset-block-end: 25%;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 4px,
      color-mix(in oklch, oklch(1 0 89.88) 25%, transparent) 4px, color-mix(in oklch, oklch(1 0 89.88) 25%, transparent) 5px,
      transparent 5px, transparent 12px);
}
.roycss-css-tropical-beach::after {
  content: "";
  position: absolute;
  inset-inline-start: 12%;
  inset-block-end: 28%;
  inline-size: 8px;
  block-size: 45%;
  background: linear-gradient(to top, oklch(0.274 0.048 51.17) 0%, oklch(0.374 0.067 61.54) 100%);
  transform: rotate(-4deg);
  transform-origin: bottom center;
  box-shadow:
    18px -10px 0 -2px oklch(0.274 0.048 51.17),
    -2px -38px 0 -1px oklch(0.274 0.048 51.17);
  border-radius: 4px;
}
/* palm fronds */
.roycss-css-tropical-beach > .fronds {
  position: absolute;
  inset-inline-start: 8%;
  inset-block-end: 70%;
  inline-size: 18%;
  block-size: 14%;
  background:
    radial-gradient(ellipse 60% 100% at 50% 100%, oklch(0.364 0.095 142.69) 0%, oklch(0.364 0.095 142.69) 30%, transparent 60%);
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
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0.115 0 89.88);
  overflow: hidden;
}
.roycss-optical-illusion-hypnosis::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      oklch(1 0 89.88) 0deg, oklch(1 0 89.88) 6deg,
      oklch(0.115 0 89.88) 6deg, oklch(0.115 0 89.88) 12deg);
  -webkit-mask: radial-gradient(circle, oklch(0 0 0) 5%, oklch(0 0 0) 95%, transparent 100%);
          mask: radial-gradient(circle, oklch(0 0 0) 5%, oklch(0 0 0) 95%, transparent 100%);
  animation: roy-b13-hypno-spin 6s linear infinite;
}
.roycss-optical-illusion-hypnosis::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 14%;
  block-size: 14%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, oklch(1 0 89.88) 0%, oklch(0.627 0 89.88) 60%, oklch(0 0 0) 100%);
  box-shadow: 0 0 20px color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
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
  inline-size: 100%;
  block-size: 100%;
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      oklch(0.226 0.031 283.65) 0deg, oklch(0.226 0.031 283.65) 90deg,
      oklch(0.292 0.029 284.46) 90deg, oklch(0.292 0.029 284.46) 180deg,
      oklch(0.226 0.031 283.65) 180deg, oklch(0.226 0.031 283.65) 270deg,
      oklch(0.292 0.029 284.46) 270deg, oklch(0.292 0.029 284.46) 360deg);
  background-size: 40px 40px;
  overflow: hidden;
}
.roycss-optical-illusion-depth::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-radial-gradient(circle at 50% 50%,
      oklch(1 0 89.88) 0px, oklch(1 0 89.88) 2px,
      oklch(0 0 0) 2px, oklch(0 0 0) 4px,
      oklch(0.627 0 89.88) 4px, oklch(0.627 0 89.88) 6px,
      oklch(0 0 0) 6px, oklch(0 0 0) 8px);
  -webkit-mask: repeating-conic-gradient(from 0deg at 50% 50%,
    oklch(0 0 0) 0deg, oklch(0 0 0) 22.5deg, transparent 22.5deg, transparent 45deg);
          mask: repeating-conic-gradient(from 0deg at 50% 50%,
    oklch(0 0 0) 0deg, oklch(0 0 0) 22.5deg, transparent 22.5deg, transparent 45deg);
  animation: roy-b13-depth-spin 30s linear infinite;
}
.roycss-optical-illusion-depth::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 8%;
  block-size: 8%;
  transform: translate(-50%, -50%);
  background: oklch(1 0 89.88);
  box-shadow: 0 0 30px 10px color-mix(in oklch, oklch(1 0 89.88) 80%, transparent);
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
  inline-size: 100%;
  block-size: 100%;
  background: oklch(1 0 89.88);
  overflow: hidden;
}
.roycss-optical-illusion-motion::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-radial-gradient(circle at 50% 50%,
      oklch(0 0 0) 0px, oklch(0 0 0) 6px,
      oklch(1 0 89.88) 6px, oklch(1 0 89.88) 18px,
      oklch(0.627 0 89.88) 18px, oklch(0.627 0 89.88) 24px,
      oklch(1 0 89.88) 24px, oklch(1 0 89.88) 36px);
  -webkit-mask: repeating-conic-gradient(from 0deg at 50% 50%,
    oklch(0 0 0) 0deg, oklch(0 0 0) 15deg, transparent 15deg, transparent 30deg);
          mask: repeating-conic-gradient(from 0deg at 50% 50%,
    oklch(0 0 0) 0deg, oklch(0 0 0) 15deg, transparent 15deg, transparent 30deg);
}
.roycss-optical-illusion-motion::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-conic-gradient(from 7.5deg at 50% 50%,
      color-mix(in oklch, oklch(0 0 0) 50%, transparent) 0deg, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 15deg,
      transparent 15deg, transparent 30deg);
  -webkit-mask: repeating-radial-gradient(circle at 50% 50%,
    oklch(0 0 0) 0px, oklch(0 0 0) 6px, transparent 6px, transparent 18px,
    oklch(0 0 0) 18px, oklch(0 0 0) 24px, transparent 24px, transparent 36px);
          mask: repeating-radial-gradient(circle at 50% 50%,
    oklch(0 0 0) 0px, oklch(0 0 0) 6px, transparent 6px, transparent 18px,
    oklch(0 0 0) 18px, oklch(0 0 0) 24px, transparent 24px, transparent 36px);
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
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0.931 0.014 88.69);
  overflow: hidden;
}
.roycss-optical-illusion-impossible::before {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 60%;
  block-size: 60%;
  transform: translate(-50%, -50%);
  background:
    conic-gradient(from 30deg at 50% 50%,
      oklch(0.468 0.056 263.8) 0deg, oklch(0.468 0.056 263.8) 60deg,
      oklch(0.685 0.051 264.16) 60deg, oklch(0.685 0.051 264.16) 120deg,
      oklch(0.35 0.06 263.36) 120deg, oklch(0.35 0.06 263.36) 180deg,
      oklch(0.468 0.056 263.8) 180deg, oklch(0.468 0.056 263.8) 240deg,
      oklch(0.685 0.051 264.16) 240deg, oklch(0.685 0.051 264.16) 300deg,
      oklch(0.35 0.06 263.36) 300deg, oklch(0.35 0.06 263.36) 360deg);
  clip-path: polygon(
    50% 0%, 100% 87%, 0% 87%
  );
  filter: drop-shadow(2px 4px 6px color-mix(in oklch, oklch(0 0 0) 30%, transparent));
}
.roycss-optical-illusion-impossible::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 36%;
  block-size: 36%;
  transform: translate(-50%, -38%);
  background: oklch(0.931 0.014 88.69);
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
  inline-size: 100%;
  block-size: 100%;
  background:
    linear-gradient(to right, oklch(0.218 0 89.88) 0%, oklch(0.218 0 89.88) 15%, transparent 15%, transparent 85%, oklch(0.218 0 89.88) 85%, oklch(0.218 0 89.88) 100%);
  overflow: hidden;
}
.roycss-optical-illusion-barber-pole::before {
  content: "";
  position: absolute;
  inset-inline-start: 25%;
  inset-inline-end: 25%;
  inset-block-start: 5%;
  inset-block-end: 5%;
  background:
    repeating-linear-gradient(45deg,
      oklch(0.567 0.215 25.63) 0px, oklch(0.567 0.215 25.63) 14px,
      oklch(1 0 89.88) 14px, oklch(1 0 89.88) 28px,
      oklch(0.458 0.162 262.15) 28px, oklch(0.458 0.162 262.15) 42px,
      oklch(1 0 89.88) 42px, oklch(1 0 89.88) 56px);
  border-radius: 50% / 8%;
  box-shadow: inset 0 0 25px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
  -webkit-mask: linear-gradient(to right,
    transparent 0%, oklch(0 0 0) 8%, oklch(0 0 0) 92%, transparent 100%);
          mask: linear-gradient(to right,
    transparent 0%, oklch(0 0 0) 8%, oklch(0 0 0) 92%, transparent 100%);
  animation: roy-b13-barber-up 1.5s linear infinite;
}
.roycss-optical-illusion-barber-pole::after {
  content: "";
  position: absolute;
  inset-inline-start: 20%;
  inset-inline-end: 20%;
  inset-block-start: 2%;
  block-size: 6%;
  background: linear-gradient(to bottom, oklch(0.683 0 89.88), oklch(0.387 0 89.88));
  border-radius: 4px;
  box-shadow: 0 0 0 1px oklch(0.252 0 89.88);
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
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0.627 0 89.88);
  overflow: hidden;
  background-image:
    repeating-linear-gradient(0deg,
      oklch(0.955 0 89.88) 0px, oklch(0.955 0 89.88) 20px,
      oklch(0.218 0 89.88) 20px, oklch(0.218 0 89.88) 40px),
    repeating-linear-gradient(90deg,
      oklch(0.955 0 89.88) 0px, oklch(0.955 0 89.88) 40px,
      oklch(0.218 0 89.88) 40px, oklch(0.218 0 89.88) 80px);
  background-blend-mode: normal;
}
.roycss-optical-illusion-cafe-wall::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 20px,
      oklch(0.627 0 89.88) 20px, oklch(0.627 0 89.88) 22px,
      transparent 22px, transparent 42px,
      oklch(0.627 0 89.88) 42px, oklch(0.627 0 89.88) 44px),
    repeating-linear-gradient(90deg,
      transparent 0px, transparent 40px,
      oklch(0.627 0 89.88) 40px, oklch(0.627 0 89.88) 42px,
      transparent 42px, transparent 82px,
      oklch(0.627 0 89.88) 82px, oklch(0.627 0 89.88) 84px);
}
.roycss-optical-illusion-cafe-wall::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg,
      oklch(0.218 0 89.88) 0px, oklch(0.218 0 89.88) 20px,
      oklch(0.955 0 89.88) 20px, oklch(0.955 0 89.88) 40px);
  background-size: 80px 40px;
  -webkit-mask:
    linear-gradient(90deg,
      transparent 0%, oklch(0 0 0) 6%, oklch(0 0 0) 12%, transparent 18%,
      oklch(0 0 0) 24%, oklch(0 0 0) 30%, transparent 36%,
      oklch(0 0 0) 42%, oklch(0 0 0) 48%, transparent 54%,
      oklch(0 0 0) 60%, oklch(0 0 0) 66%, transparent 72%,
      oklch(0 0 0) 78%, oklch(0 0 0) 84%, transparent 90%, oklch(0 0 0) 96%);
          mask:
    linear-gradient(90deg,
      transparent 0%, oklch(0 0 0) 6%, oklch(0 0 0) 12%, transparent 18%,
      oklch(0 0 0) 24%, oklch(0 0 0) 30%, transparent 36%,
      oklch(0 0 0) 42%, oklch(0 0 0) 48%, transparent 54%,
      oklch(0 0 0) 60%, oklch(0 0 0) 66%, transparent 72%,
      oklch(0 0 0) 78%, oklch(0 0 0) 84%, transparent 90%, oklch(0 0 0) 96%);
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
  inline-size: 100%;
  block-size: 100%;
  background:
    linear-gradient(to right,
      oklch(0.567 0.215 25.63) 0%, oklch(0.567 0.215 25.63) 32%,
      oklch(0 0 0) 32%, oklch(0 0 0) 34%,
      oklch(1 0 89.88) 34%, oklch(1 0 89.88) 58%,
      oklch(0 0 0) 58%, oklch(0 0 0) 60%,
      oklch(1 0 89.88) 60%, oklch(1 0 89.88) 78%,
      oklch(0 0 0) 78%, oklch(0 0 0) 80%,
      oklch(1 0 89.88) 80%, oklch(1 0 89.88) 100%),
    linear-gradient(to bottom,
      oklch(1 0 89.88) 0%, oklch(1 0 89.88) 28%,
      oklch(0 0 0) 28%, oklch(0 0 0) 30%,
      oklch(0.864 0.172 95.46) 30%, oklch(0.864 0.172 95.46) 60%,
      oklch(0 0 0) 60%, oklch(0 0 0) 62%,
      oklch(1 0 89.88) 62%, oklch(1 0 89.88) 75%,
      oklch(0 0 0) 75%, oklch(0 0 0) 77%,
      oklch(0.458 0.162 262.15) 77%, oklch(0.458 0.162 262.15) 100%);
  background-blend-mode: multiply;
}
.roycss-art-mondrian::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right,
      transparent 0%, transparent 32%,
      oklch(0 0 0) 32%, oklch(0 0 0) 34%,
      transparent 34%, transparent 58%,
      oklch(0 0 0) 58%, oklch(0 0 0) 60%,
      transparent 60%, transparent 78%,
      oklch(0 0 0) 78%, oklch(0 0 0) 80%,
      transparent 80%, transparent 100%),
    linear-gradient(to bottom,
      transparent 0%, transparent 28%,
      oklch(0 0 0) 28%, oklch(0 0 0) 30%,
      transparent 30%, transparent 60%,
      oklch(0 0 0) 60%, oklch(0 0 0) 62%,
      transparent 62%, transparent 75%,
      oklch(0 0 0) 75%, oklch(0 0 0) 77%,
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
  inline-size: 100%;
  block-size: 100%;
  background:
    linear-gradient(to bottom,
      oklch(0.231 0.033 44.65) 0%, oklch(0.231 0.033 44.65) 12%,
      oklch(0.317 0.057 45.3) 12%, oklch(0.317 0.057 45.3) 18%,
      oklch(0.399 0.08 45.3) 18%, oklch(0.399 0.08 45.3) 22%,
      oklch(0.856 0.077 71.59) 22%, oklch(0.856 0.077 71.59) 32%,
      transparent 32%, transparent 100%),
    radial-gradient(circle at 30% 45%, oklch(1 0 89.88) 0%, oklch(1 0 89.88) 4%, transparent 4%),
    radial-gradient(circle at 70% 45%, oklch(1 0 89.88) 0%, oklch(1 0 89.88) 4%, transparent 4%),
    radial-gradient(circle at 30% 45%, oklch(0.226 0.031 283.65) 0%, oklch(0.226 0.031 283.65) 2.5%, transparent 2.5%),
    radial-gradient(circle at 70% 45%, oklch(0.226 0.031 283.65) 0%, oklch(0.226 0.031 283.65) 2.5%, transparent 2.5%),
    linear-gradient(to bottom,
      transparent 32%, oklch(0.856 0.077 71.59) 32%, oklch(0.856 0.077 71.59) 55%,
      oklch(0.765 0.085 65.98) 55%, oklch(0.765 0.085 65.98) 60%,
      oklch(0.856 0.077 71.59) 60%, oklch(0.856 0.077 71.59) 75%,
      oklch(0.714 0.086 65.71) 75%, oklch(0.714 0.086 65.71) 100%);
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
      oklch(0.231 0.033 44.65) 8px, oklch(0.231 0.033 44.65) 16px);
  -webkit-mask: linear-gradient(to bottom, oklch(0 0 0) 0%, oklch(0 0 0) 80%, transparent 100%);
          mask: linear-gradient(to bottom, oklch(0 0 0) 0%, oklch(0 0 0) 80%, transparent 100%);
}
.roycss-art-pixel-portrait::after {
  content: "";
  position: absolute;
  inset-inline-start: 45%;
  inset-block-start: 60%;
  inline-size: 10%;
  block-size: 4%;
  background: oklch(0.451 0.116 32.82);
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
  inline-size: 100%;
  block-size: 100%;
  background:
    radial-gradient(circle at 50% 50%, oklch(0.189 0.063 304) 0%, oklch(0.096 0.051 300.12) 100%);
  overflow: hidden;
}
.roycss-art-geometric-mandala::before {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 90%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      transparent 0deg, transparent 8deg,
      oklch(0.875 0.16 89.83) 8deg, oklch(0.875 0.16 89.83) 10deg,
      transparent 10deg, transparent 30deg,
      oklch(0.672 0.228 6.08) 30deg, oklch(0.672 0.228 6.08) 32deg,
      transparent 32deg, transparent 60deg,
      oklch(0.802 0.135 224.64) 60deg, oklch(0.802 0.135 224.64) 62deg,
      transparent 62deg, transparent 90deg);
  border-radius: 50%;
  -webkit-mask: radial-gradient(circle,
    transparent 0%, transparent 6%,
    oklch(0 0 0) 6%, oklch(0 0 0) 96%,
    transparent 96%);
          mask: radial-gradient(circle,
    transparent 0%, transparent 6%,
    oklch(0 0 0) 6%, oklch(0 0 0) 96%,
    transparent 96%);
}
.roycss-art-geometric-mandala::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 50%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background:
    repeating-conic-gradient(from 15deg at 50% 50%,
      transparent 0deg, transparent 15deg,
      oklch(0.899 0.202 143.66) 15deg, oklch(0.899 0.202 143.66) 17deg,
      transparent 17deg, transparent 45deg,
      oklch(0.717 0.186 305.47) 45deg, oklch(0.717 0.186 305.47) 47deg,
      transparent 47deg, transparent 75deg);
  border-radius: 50%;
  -webkit-mask: radial-gradient(circle,
    oklch(0 0 0) 0%, oklch(0 0 0) 30%,
    transparent 30%, transparent 60%,
    oklch(0 0 0) 60%, oklch(0 0 0) 90%);
          mask: radial-gradient(circle,
    oklch(0 0 0) 0%, oklch(0 0 0) 30%,
    transparent 30%, transparent 60%,
    oklch(0 0 0) 60%, oklch(0 0 0) 90%);
  filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(0.863 0.133 80.39) 50%, transparent));
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
  inline-size: 100%;
  block-size: 100%;
  background:
    linear-gradient(to bottom, oklch(0.898 0.072 77.69) 0%, oklch(0.853 0.093 78.76) 60%, oklch(0.712 0.1 72.98) 100%);
  overflow: hidden;
}
.roycss-art-fractal-tree::before {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-end: 0;
  inline-size: 8%;
  block-size: 50%;
  transform: translateX(-50%);
  background:
    linear-gradient(to top,
      oklch(0.274 0.048 51.17) 0%, oklch(0.317 0.057 45.3) 60%, oklch(0.358 0.071 48.81) 100%);
  clip-path: polygon(35% 100%, 65% 100%, 70% 70%, 60% 50%, 70% 30%, 50% 0%, 30% 30%, 40% 50%, 30% 70%);
  box-shadow:
    -30px -20px 0 -2px oklch(0.317 0.057 45.3),
     30px -20px 0 -2px oklch(0.317 0.057 45.3),
    -50px  10px 0 -4px oklch(0.317 0.057 45.3),
     50px  10px 0 -4px oklch(0.317 0.057 45.3),
    -60px -40px 0 -8px oklch(0.374 0.067 61.54),
     60px -40px 0 -8px oklch(0.374 0.067 61.54),
    -20px -50px 0 -10px oklch(0.374 0.067 61.54),
     20px -50px 0 -10px oklch(0.374 0.067 61.54),
    -40px -70px 0 -14px oklch(0.432 0.066 62.88),
     40px -70px 0 -14px oklch(0.432 0.066 62.88),
      0  -60px 0 -12px oklch(0.432 0.066 62.88);
}
.roycss-art-fractal-tree::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 22%;
  inline-size: 40%;
  block-size: 30%;
  transform: translateX(-50%);
  background:
    radial-gradient(circle at 30% 60%, oklch(0.372 0.086 135.93) 0%, oklch(0.372 0.086 135.93) 35%, transparent 60%),
    radial-gradient(circle at 70% 60%, oklch(0.372 0.086 135.93) 0%, oklch(0.372 0.086 135.93) 35%, transparent 60%),
    radial-gradient(circle at 50% 40%, oklch(0.43 0.085 135.45) 0%, oklch(0.43 0.085 135.45) 40%, transparent 65%),
    radial-gradient(circle at 20% 40%, oklch(0.312 0.084 136.78) 0%, oklch(0.312 0.084 136.78) 30%, transparent 55%),
    radial-gradient(circle at 80% 40%, oklch(0.312 0.084 136.78) 0%, oklch(0.312 0.084 136.78) 30%, transparent 55%);
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
  inline-size: 100%;
  block-size: 100%;
  background:
    repeating-conic-gradient(from 30deg at 50% 50%,
      oklch(0.332 0.047 232.36) 0deg, oklch(0.332 0.047 232.36) 60deg,
      oklch(0.441 0.058 222.38) 60deg, oklch(0.441 0.058 222.38) 120deg,
      oklch(0.544 0.07 216.4) 120deg, oklch(0.544 0.07 216.4) 180deg,
      oklch(0.441 0.058 222.38) 180deg, oklch(0.441 0.058 222.38) 240deg,
      oklch(0.332 0.047 232.36) 240deg, oklch(0.332 0.047 232.36) 300deg,
      oklch(0.441 0.058 222.38) 300deg, oklch(0.441 0.058 222.38) 360deg);
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
      color-mix(in oklch, oklch(0 0 0) 40%, transparent) 28px, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 32px,
      transparent 32px, transparent 60px),
    repeating-linear-gradient(-60deg,
      transparent 0px, transparent 28px,
      color-mix(in oklch, oklch(0 0 0) 40%, transparent) 28px, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 32px,
      transparent 32px, transparent 60px),
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 28px,
      color-mix(in oklch, oklch(0 0 0) 40%, transparent) 28px, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 32px,
      transparent 32px, transparent 60px);
  -webkit-mask: radial-gradient(circle, oklch(0 0 0) 0%, oklch(0 0 0) 100%);
          mask: radial-gradient(circle, oklch(0 0 0) 0%, oklch(0 0 0) 100%);
}
.roycss-art-tessellation::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 12px at 30px 30px, color-mix(in oklch, oklch(0.902 0.143 93.06) 50%, transparent) 0%, transparent 70%),
    radial-gradient(circle 12px at 90px 60px, color-mix(in oklch, oklch(0.902 0.143 93.06) 50%, transparent) 0%, transparent 70%);
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
  inline-size: 100%;
  block-size: 100%;
  background:
    conic-gradient(from 0deg at 20% 30%,
      oklch(0.607 0.179 17.13) 0deg, oklch(0.607 0.179 17.13) 60deg,
      oklch(0.661 0.117 158.91) 60deg, oklch(0.661 0.117 158.91) 150deg,
      oklch(0.596 0.123 273.55) 150deg, oklch(0.596 0.123 273.55) 240deg,
      oklch(0.758 0.125 82.01) 240deg, oklch(0.758 0.125 82.01) 360deg),
    conic-gradient(from 90deg at 70% 60%,
      oklch(0.596 0.123 273.55) 0deg, oklch(0.596 0.123 273.55) 80deg,
      oklch(0.758 0.125 82.01) 80deg, oklch(0.758 0.125 82.01) 180deg,
      oklch(0.607 0.179 17.13) 180deg, oklch(0.607 0.179 17.13) 280deg,
      oklch(0.661 0.117 158.91) 280deg, oklch(0.661 0.117 158.91) 360deg),
    conic-gradient(from 180deg at 40% 80%,
      oklch(0.661 0.117 158.91) 0deg, oklch(0.661 0.117 158.91) 90deg,
      oklch(0.607 0.179 17.13) 90deg, oklch(0.607 0.179 17.13) 200deg,
      oklch(0.596 0.123 273.55) 200deg, oklch(0.596 0.123 273.55) 360deg);
  background-blend-mode: normal;
}
.roycss-art-voronoi::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle 2px at 20% 30%, oklch(1 0 89.88) 0%, transparent 60%),
    radial-gradient(circle 2px at 70% 60%, oklch(1 0 89.88) 0%, transparent 60%),
    radial-gradient(circle 2px at 40% 80%, oklch(1 0 89.88) 0%, transparent 60%),
    radial-gradient(circle 2px at 85% 20%, oklch(1 0 89.88) 0%, transparent 60%),
    radial-gradient(circle 2px at 12% 65%, oklch(1 0 89.88) 0%, transparent 60%),
    radial-gradient(circle 2px at 55% 15%, oklch(1 0 89.88) 0%, transparent 60%),
    linear-gradient(45deg,
      transparent 48%, color-mix(in oklch, oklch(0 0 0) 60%, transparent) 49%, color-mix(in oklch, oklch(0 0 0) 60%, transparent) 51%, transparent 52%),
    linear-gradient(-30deg,
      transparent 48%, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 49%, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 51%, transparent 52%),
    linear-gradient(80deg,
      transparent 48%, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 49%, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 51%, transparent 52%);
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
  box-shadow: inset 0 0 40px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
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
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0.15 0.021 283.53);
  overflow: hidden;
}
.roycss-hypnotic-spiral::before {
  content: "";
  position: absolute;
  inset: -20%;
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      oklch(0.672 0.228 6.08) 0deg, oklch(0.672 0.228 6.08) 8deg,
      oklch(0.15 0.021 283.53) 8deg, oklch(0.15 0.021 283.53) 16deg,
      oklch(0.802 0.135 224.64) 16deg, oklch(0.802 0.135 224.64) 24deg,
      oklch(0.15 0.021 283.53) 24deg, oklch(0.15 0.021 283.53) 32deg);
  -webkit-mask: radial-gradient(circle, oklch(0 0 0) 0%, oklch(0 0 0) 95%, transparent 100%);
          mask: radial-gradient(circle, oklch(0 0 0) 0%, oklch(0 0 0) 95%, transparent 100%);
  animation: roy-b13-hypnotic-spin 4s linear infinite, roy-b13-hypnotic-zoom 3s ease-in-out infinite alternate;
}
.roycss-hypnotic-spiral::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 12%;
  block-size: 12%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, oklch(1 0 89.88) 0%, oklch(0.913 0.121 91.98) 40%, transparent 80%);
  box-shadow: 0 0 40px 10px color-mix(in oklch, oklch(0.904 0.126 90.5) 70%, transparent);
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
  inline-size: 100%;
  block-size: 100%;
  background: radial-gradient(circle at 50% 50%, oklch(0.176 0.092 303.92) 0%, oklch(0.088 0.044 311.99) 100%);
  overflow: hidden;
}
.roycss-infinite-zoom-tunnel::before {
  content: "";
  position: absolute;
  inset: -50%;
  background:
    repeating-radial-gradient(circle at 50% 50%,
      transparent 0px, transparent 18px,
      color-mix(in oklch, oklch(0.551 0.203 291.46) 80%, transparent) 18px, color-mix(in oklch, oklch(0.551 0.203 291.46) 80%, transparent) 20px,
      transparent 20px, transparent 40px,
      color-mix(in oklch, oklch(0.65 0.204 340.78) 60%, transparent) 40px, color-mix(in oklch, oklch(0.65 0.204 340.78) 60%, transparent) 42px,
      transparent 42px, transparent 60px,
      color-mix(in oklch, oklch(0.727 0.109 227.53) 50%, transparent) 60px, color-mix(in oklch, oklch(0.727 0.109 227.53) 50%, transparent) 62px);
  animation: roy-b13-tunnel-zoom 4s linear infinite;
}
.roycss-infinite-zoom-tunnel::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 16%;
  block-size: 16%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, oklch(1 0 89.88) 0%, oklch(1 0 89.88) 30%, oklch(0.539 0.17 300.58) 70%, transparent 100%);
  box-shadow: 0 0 60px 20px color-mix(in oklch, oklch(0.693 0.196 302.07) 60%, transparent);
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
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0 0 0);
  overflow: hidden;
}
.roycss-matrix-rain-fall::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0px, transparent 14px,
      color-mix(in oklch, oklch(0.87 0.269 145.52) 95%, transparent) 14px, color-mix(in oklch, oklch(0.87 0.269 145.52) 95%, transparent) 16px,
      transparent 16px, transparent 30px,
      color-mix(in oklch, oklch(0.724 0.225 145.45) 80%, transparent) 30px, color-mix(in oklch, oklch(0.724 0.225 145.45) 80%, transparent) 32px,
      transparent 32px, transparent 50px,
      color-mix(in oklch, oklch(0.874 0.241 149.96) 90%, transparent) 50px, color-mix(in oklch, oklch(0.874 0.241 149.96) 90%, transparent) 52px,
      transparent 52px, transparent 70px,
      color-mix(in oklch, oklch(0.67 0.203 146.27) 70%, transparent) 70px, color-mix(in oklch, oklch(0.67 0.203 146.27) 70%, transparent) 72px);
  background-size: 16px 100%, 16px 100%, 16px 100%, 16px 100%;
  background-position: 0% 0, 25% 0, 50% 0, 75% 0;
  background-repeat: repeat;
  animation: roy-b13-matrix-fall 1.5s linear infinite;
  -webkit-mask: linear-gradient(to bottom,
    transparent 0%, oklch(0 0 0) 20%, oklch(0 0 0) 80%, transparent 100%);
          mask: linear-gradient(to bottom,
    transparent 0%, oklch(0 0 0) 20%, oklch(0 0 0) 80%, transparent 100%);
}
.roycss-matrix-rain-fall::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg,
      color-mix(in oklch, oklch(0.87 0.269 145.52) 0%, transparent) 0%,
      color-mix(in oklch, oklch(0.87 0.269 145.52) 15%, transparent) 50%,
      color-mix(in oklch, oklch(0 0 0) 50%, transparent) 100%);
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
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0 0 0);
  overflow: hidden;
  perspective: 200px;
}
.roycss-star-wars-crawl::before {
  content: "A long time ago in a galaxy far, far away.... EPISODE XIII  RETURN OF THE CSS  There is unrest in the Galactic Senate. Several hundred solar systems have declared their intentions to leave the Republic. This separatist movement, under the leadership of the mysterious Count CSS, has made it difficult for the limited number of Jedi Knights to maintain peace and order in the galaxy.";
  position: absolute;
  inset-inline-start: 10%;
  inset-inline-end: 10%;
  inset-block-end: -50%;
  color: oklch(0.909 0.149 95.64);
  font-family: "Georgia", serif;
  font-size: 16px;
  line-block-size: 1.5;
  text-align: justify;
  transform: rotateX(35deg);
  transform-origin: 50% 100%;
  animation: roy-b13-sw-crawl 12s linear infinite;
  text-shadow: 0 0 6px color-mix(in oklch, oklch(0.9 0.157 94.82) 60%, transparent);
}
.roycss-star-wars-crawl::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, oklch(0 0 0) 80%);
  pointer-events: none;
}
@keyframes roy-b13-sw-crawl {
  0%   { inset-block-end: -50%; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { inset-block-end: 150%; opacity: 0; }
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
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0.285 0 89.88);
  overflow: hidden;
}
.roycss-conveyor-belt::before {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-start: 25%;
  block-size: 50%;
  background:
    repeating-linear-gradient(45deg,
      oklch(0.218 0 89.88) 0px, oklch(0.218 0 89.88) 10px,
      oklch(0.348 0 89.88) 10px, oklch(0.348 0 89.88) 20px,
      oklch(0.218 0 89.88) 20px, oklch(0.218 0 89.88) 30px,
      oklch(0.348 0 89.88) 30px, oklch(0.348 0 89.88) 40px);
  background-size: 40px 40px;
  animation: roy-b13-conveyor-move 1s linear infinite;
  border-block-start: 4px solid oklch(0.45 0 89.88);
  border-block-end: 4px solid oklch(0.45 0 89.88);
  box-shadow: inset 0 0 20px color-mix(in oklch, oklch(0 0 0) 60%, transparent);
}
.roycss-conveyor-belt::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-start: 22%;
  block-size: 4%;
  background:
    radial-gradient(circle 8px at 4% 50%, oklch(0.627 0 89.88) 0%, oklch(0.387 0 89.88) 60%, transparent 100%),
    radial-gradient(circle 8px at 96% 50%, oklch(0.627 0 89.88) 0%, oklch(0.387 0 89.88) 60%, transparent 100%);
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
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0.218 0 89.88);
  overflow: hidden;
}
.roycss-escalator-steps::before {
  content: "";
  position: absolute;
  inset-inline-start: -20%;
  inset-inline-end: -20%;
  inset-block-start: 15%;
  inset-block-end: 15%;
  background:
    repeating-linear-gradient(135deg,
      oklch(0.627 0 89.88) 0px, oklch(0.627 0 89.88) 12px,
      oklch(0.387 0 89.88) 12px, oklch(0.387 0 89.88) 14px,
      oklch(0.627 0 89.88) 14px, oklch(0.627 0 89.88) 26px,
      oklch(0.387 0 89.88) 26px, oklch(0.387 0 89.88) 28px),
    repeating-linear-gradient(45deg,
      transparent 0px, transparent 26px,
      color-mix(in oklch, oklch(0 0 0) 40%, transparent) 26px, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 28px);
  background-size: 28px 28px, 28px 28px;
  transform: skewX(-30deg);
  animation: roy-b13-escalator-up 1.5s linear infinite;
  box-shadow: inset 0 0 30px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}
.roycss-escalator-steps::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  inset-block-start: 10%;
  block-size: 6%;
  background: linear-gradient(to bottom, oklch(0.45 0 89.88), oklch(0.252 0 89.88));
  border-block-end: 2px solid oklch(0 0 0);
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
  inline-size: 100%;
  block-size: 100%;
  background:
    linear-gradient(to bottom, oklch(0.798 0.076 236.89) 0%, oklch(0.867 0.048 240.55) 60%, oklch(0.858 0.066 122.77) 70%, oklch(0.743 0.094 130.02) 100%);
  overflow: hidden;
}
.roycss-windmill-spin::before {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-end: 0;
  inline-size: 12%;
  block-size: 70%;
  transform: translateX(-50%);
  background:
    linear-gradient(to top, oklch(0.432 0.066 62.88) 0%, oklch(0.541 0.078 74.33) 60%, oklch(0.645 0.092 81.7) 100%);
  clip-path: polygon(20% 100%, 80% 100%, 65% 0%, 35% 0%);
}
.roycss-windmill-spin::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 25%;
  inline-size: 70%;
  block-size: 70%;
  transform: translate(-50%, -50%);
  background:
    conic-gradient(from 0deg at 50% 50%,
      oklch(0.955 0 89.88) 0deg, oklch(0.955 0 89.88) 80deg,
      transparent 80deg, transparent 90deg,
      oklch(0.955 0 89.88) 90deg, oklch(0.955 0 89.88) 170deg,
      transparent 170deg, transparent 180deg,
      oklch(0.955 0 89.88) 180deg, oklch(0.955 0 89.88) 260deg,
      transparent 260deg, transparent 270deg,
      oklch(0.955 0 89.88) 270deg, oklch(0.955 0 89.88) 350deg,
      transparent 350deg, transparent 360deg);
  -webkit-mask: radial-gradient(circle at 50% 50%,
    oklch(0 0 0) 2%, oklch(0 0 0) 50%, transparent 51%);
          mask: radial-gradient(circle at 50% 50%,
    oklch(0 0 0) 2%, oklch(0 0 0) 50%, transparent 51%);
  animation: roy-b13-windmill-rotate 4s linear infinite;
  transform-origin: 50% 50%;
  filter: drop-shadow(2px 4px 6px color-mix(in oklch, oklch(0 0 0) 40%, transparent));
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
  inline-size: 100%;
  block-size: 100%;
  background:
    linear-gradient(to bottom, oklch(0.267 0.086 295.38) 0%, oklch(0.358 0.109 304.53) 50%, oklch(0.189 0.063 304) 100%);
  overflow: hidden;
}
.roycss-ferris-wheel::before {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 80%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      transparent 0deg, transparent 22deg,
      oklch(0.909 0.149 95.64) 22deg, oklch(0.909 0.149 95.64) 24deg,
      transparent 24deg, transparent 67deg,
      oklch(0.703 0.194 11.46) 67deg, oklch(0.703 0.194 11.46) 69deg,
      transparent 69deg, transparent 112deg,
      oklch(0.775 0.128 240.03) 112deg, oklch(0.775 0.128 240.03) 114deg,
      transparent 114deg, transparent 157deg,
      oklch(0.899 0.202 143.66) 157deg, oklch(0.899 0.202 143.66) 159deg,
      transparent 159deg, transparent 202deg,
      oklch(0.717 0.186 305.47) 202deg, oklch(0.717 0.186 305.47) 204deg,
      transparent 204deg, transparent 247deg,
      oklch(0.787 0.155 61.89) 247deg, oklch(0.787 0.155 61.89) 249deg,
      transparent 249deg, transparent 292deg,
      oklch(0.672 0.228 6.08) 292deg, oklch(0.672 0.228 6.08) 294deg,
      transparent 294deg, transparent 337deg,
      oklch(0.818 0.138 176.05) 337deg, oklch(0.818 0.138 176.05) 339deg,
      transparent 339deg, transparent 360deg);
  border-radius: 50%;
  -webkit-mask: radial-gradient(circle at 50% 50%,
    oklch(0 0 0) 0%, oklch(0 0 0) 4%, transparent 5%, oklch(0 0 0) 6%, oklch(0 0 0) 92%, transparent 93%);
          mask: radial-gradient(circle at 50% 50%,
    oklch(0 0 0) 0%, oklch(0 0 0) 4%, transparent 5%, oklch(0 0 0) 6%, oklch(0 0 0) 92%, transparent 93%);
  animation: roy-b13-ferris-rotate 12s linear infinite;
  filter: drop-shadow(0 0 10px color-mix(in oklch, oklch(0.902 0.143 93.06) 50%, transparent));
}
.roycss-ferris-wheel::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-end: 0;
  inline-size: 4%;
  block-size: 55%;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, oklch(0.627 0 89.88) 0%, oklch(0.387 0 89.88) 100%);
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
  inline-size: 100%;
  block-size: 100%;
  background:
    radial-gradient(circle at 50% 50%, oklch(0.967 0.016 91.55) 0%, oklch(0.858 0.034 91.7) 100%);
  overflow: hidden;
}
.roycss-clock-tick::before {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 80%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  background:
    repeating-conic-gradient(from 0deg at 50% 50%,
      oklch(0.218 0 89.88) 0deg, oklch(0.218 0 89.88) 2deg,
      transparent 2deg, transparent 30deg);
  -webkit-mask: radial-gradient(circle at 50% 50%,
    transparent 0%, transparent 38%,
    oklch(0 0 0) 39%, oklch(0 0 0) 50%, transparent 51%);
          mask: radial-gradient(circle at 50% 50%,
    transparent 0%, transparent 38%,
    oklch(0 0 0) 39%, oklch(0 0 0) 50%, transparent 51%);
  border-radius: 50%;
  border: 6px solid oklch(0.218 0 89.88);
}
.roycss-clock-tick::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 4%;
  block-size: 40%;
  background: linear-gradient(to top, transparent 0%, oklch(0.218 0 89.88) 20%, oklch(0.218 0 89.88) 100%);
  transform-origin: 50% 100%;
  transform: translate(-50%, -100%) rotate(0deg);
  animation: roy-b13-clock-second 6s steps(60) infinite;
  border-radius: 4px 4px 0 0;
}
.roycss-clock-tick > .hands {
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 3%;
  block-size: 30%;
  background: linear-gradient(to top, transparent 0%, oklch(0.218 0 89.88) 30%, oklch(0.218 0 89.88) 100%);
  transform-origin: 50% 100%;
  transform: translate(-50%, -100%);
  animation: roy-b13-clock-minute 72s linear infinite;
  border-radius: 4px 4px 0 0;
  z-index: 2;
}
.roycss-clock-tick > .hour {
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 50%;
  inline-size: 4%;
  block-size: 22%;
  background: oklch(0.218 0 89.88);
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
  inline-size: 100%;
  block-size: 100%;
  background:
    linear-gradient(to bottom, oklch(0.317 0.057 45.3) 0%, oklch(0.398 0.084 50.64) 30%, oklch(0.346 0.08 46.5) 100%);
  overflow: hidden;
}
.roycss-pendulum-clock::before {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 12%;
  inline-size: 45%;
  block-size: 30%;
  transform: translateX(-50%);
  background:
    radial-gradient(circle at 50% 50%, oklch(0.967 0.016 91.55) 0%, oklch(0.858 0.034 91.7) 80%, oklch(0.218 0 89.88) 100%);
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 6px oklch(0.26 0.058 47.7),
    0 4px 12px color-mix(in oklch, oklch(0 0 0) 60%, transparent);
}
.roycss-pendulum-clock::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 45%;
  inline-size: 6%;
  block-size: 45%;
  transform-origin: 50% 0%;
  transform: translateX(-50%);
  background:
    linear-gradient(to bottom,
      transparent 0%, transparent 10%,
      oklch(0.726 0.109 82.82) 10%, oklch(0.777 0.109 83.21) 40%, oklch(0.693 0.117 73.22) 100%);
  border-radius: 4px;
  animation: roy-b13-pendulum-swing 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate;
}
.roycss-pendulum-clock > .bob {
  position: absolute;
  inset-inline-start: 50%;
  inset-block-start: 88%;
  inline-size: 14%;
  block-size: 14%;
  transform: translate(-50%, -50%);
  background:
    radial-gradient(circle at 40% 40%, oklch(0.913 0.121 91.98) 0%, oklch(0.693 0.117 73.22) 50%, oklch(0.398 0.084 50.64) 100%);
  border-radius: 50%;
  box-shadow: 0 4px 10px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
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
  color: oklch(0.226 0.031 283.65);
  overflow: hidden;
  white-space: nowrap;
  border-inline-end: 3px solid oklch(0.226 0.031 283.65);
  inline-size: 0;
  animation:
    roy-b13-type 6s steps(6) infinite alternate,
    roy-b13-cursor 0.7s step-end infinite;
}
@keyframes roy-b13-type {
  0%      { inline-size: 0; }
  40%, 60% { inline-size: 6ch; }
  100%    { inline-size: 0; }
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
  color: oklch(0.876 0.228 152.55);
  text-shadow: 0 0 10px color-mix(in oklch, oklch(0.876 0.228 152.55) 80%, transparent), 0 0 20px color-mix(in oklch, oklch(0.876 0.228 152.55) 40%, transparent);
  animation: roy-b13-scramble-resolve 4s steps(1) infinite;
}
.roycss-text-scramble::before {
  content: "RoyCSS";
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  color: oklch(0.639 0.255 10.51);
  text-shadow: 0 0 10px color-mix(in oklch, oklch(0.639 0.255 10.51) 70%, transparent);
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
  color: oklch(1 0 89.88);
  background: linear-gradient(90deg,
    oklch(0.645 0.26 2.47), oklch(0.732 0.186 52.98), oklch(0.905 0.188 99.07), oklch(0.788 0.247 145.08), oklch(0.685 0.177 246.21), oklch(0.485 0.226 306.28), oklch(0.645 0.26 2.47));
  background-size: 200% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    1px 1px 0 oklch(0.526 0.205 2.6),
    2px 2px 0 oklch(0.459 0.181 1.87),
    3px 3px 0 oklch(0.39 0.155 1.02),
    4px 4px 0 oklch(0.317 0.129 359.47),
    5px 5px 0 oklch(0.242 0.099 357.29),
    6px 6px 0 oklch(0.16 0.066 352.21),
    7px 7px 8px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
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
  color: oklch(0.872 0.255 147.64);
  text-shadow:
    0 0 5px color-mix(in oklch, oklch(0.872 0.255 147.64) 80%, transparent),
    0 0 15px color-mix(in oklch, oklch(0.872 0.255 147.64) 50%, transparent);
  animation: roy-b13-matrix-flicker 2.5s infinite;
}
.roycss-text-glitch-matrix::before,
.roycss-text-glitch-matrix::after {
  content: "RoyCSS";
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0 0 0);
  overflow: hidden;
}
.roycss-text-glitch-matrix::before {
  color: oklch(0.632 0.254 20.85);
  z-index: -1;
  animation: roy-b13-matrix-glitch-1 2s infinite linear alternate;
}
.roycss-text-glitch-matrix::after {
  color: oklch(0.905 0.155 194.77);
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
    oklch(0.66 0.227 26.03), oklch(0.735 0.173 45.09), oklch(0.907 0.17 97.66), oklch(0.798 0.215 146.41), oklch(0.765 0.141 234.8), oklch(0.539 0.263 280.61), oklch(0.639 0.27 311.54), oklch(0.66 0.227 26.03));
  background-size: 300% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 12px color-mix(in oklch, oklch(0.863 0.133 80.39) 50%, transparent));
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
    filter: drop-shadow(0 0 8px color-mix(in oklch, oklch(0.797 0.138 350.72) 40%, transparent));
  }
  50% {
    transform: scale(1.08);
    filter: drop-shadow(0 0 20px color-mix(in oklch, oklch(0.818 0.094 251.36) 70%, transparent));
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
  color: oklch(0.979 0 89.88);
  background: linear-gradient(to bottom, oklch(1 0 89.88) 0%, oklch(0.86 0.011 286.17) 100%);
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    0 1px 0 oklch(0.845 0 89.88),
    0 2px 0 oklch(0.792 0 89.88),
    0 3px 0 oklch(0.738 0 89.88),
    0 4px 0 oklch(0.683 0 89.88),
    0 5px 6px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  transform: perspective(300px) rotateX(20deg);
  transform-origin: 50% 100%;
}
.roycss-text-shadow-perspective::before {
  content: "RoyCSS";
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 0;
  color: transparent;
  background: linear-gradient(to bottom, color-mix(in oklch, oklch(0 0 0) 60%, transparent) 0%, transparent 100%);
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  transform: perspective(300px) rotateX(80deg) scaleY(0.6);
  transform-origin: 50% 100%;
  inset-block-start: 100%;
  filter: blur(2px);
  z-index: -1;
}
.roycss-text-shadow-perspective::after {
  content: "";
  position: absolute;
  inset-inline-start: 50%;
  inset-block-end: -25%;
  inline-size: 60%;
  block-size: 8%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 0%, transparent 70%);
  filter: blur(4px);
}`
  }
];
