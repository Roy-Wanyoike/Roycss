import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 7
 * 36 effects: 12 glass-ui, 12 particles, 12 microinteractions
 *
 * Every class is prefixed `roycss-` and every keyframe is prefixed `roy-`.
 * Each `cssCode` is complete and self-contained (class + any @keyframes).
 * Particle effects use `.roycss-{id} span` for child particle elements with
 * staggered `:nth-child()` animations; set `childCount` to render N spans.
 */
export const effectsBatch7: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // GLASS-UI (12) — glassmorphism, neumorphism, claymorphism, surfaces
  // ═══════════════════════════════════════════════════════════════

  // 1. glass-frosted
  {
    id: "glass-frosted",
    name: "Frosted Glass",
    category: "glass-ui",
    description: "Classic frosted glass with backdrop blur, saturation boost and soft inner highlight",
    tags: ["glass", "frosted", "blur", "modern"],
    previewType: "card",
    cssCode: `/* Frosted Glass */
.roycss-glass-frosted {
  background: color-mix(in oklch, oklch(1 0 89.88) 12%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 20%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 30%, transparent);
}
.roycss-glass-frosted span {
  color: color-mix(in oklch, oklch(1 0 89.88) 90%, transparent);
  text-shadow: 0 1px 2px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}`,
  },

  // 2. glass-acrylic
  {
    id: "glass-acrylic",
    name: "Acrylic Glass",
    category: "glass-ui",
    description: "Acrylic material effect — more opaque than frosted glass with subtle blur and texture",
    tags: ["acrylic", "glass", "opaque", "material"],
    previewType: "card",
    cssCode: `/* Acrylic Glass */
.roycss-glass-acrylic {
  background: color-mix(in oklch, oklch(0.975 0.005 258.32) 65%, transparent);
  backdrop-filter: blur(30px) saturate(140%);
  -webkit-backdrop-filter: blur(30px) saturate(140%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 50%, transparent);
  border-radius: 12px;
  box-shadow: 0 2px 8px color-mix(in oklch, oklch(0 0 0) 8%, transparent), inset 0 0 0 1px color-mix(in oklch, oklch(1 0 89.88) 20%, transparent);
}
.roycss-glass-acrylic span {
  color: oklch(0.279 0.037 260.03);
  text-shadow: 0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
}`,
  },

  // 3. glass-liquid
  {
    id: "glass-liquid",
    name: "Liquid Glass",
    category: "glass-ui",
    description: "Liquid glass with refraction-like distortion that subtly shifts hue and blur over time",
    tags: ["liquid", "glass", "refraction", "distort"],
    previewType: "card",
    cssCode: `/* Liquid Glass */
.roycss-glass-liquid {
  background: color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  backdrop-filter: blur(8px) brightness(1.1) contrast(1.05) hue-rotate(15deg);
  -webkit-backdrop-filter: blur(8px) brightness(1.1) contrast(1.05) hue-rotate(15deg);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 30%, transparent);
  border-radius: 24px;
  box-shadow: inset 0 2px 6px color-mix(in oklch, oklch(1 0 89.88) 40%, transparent),
              inset 0 -2px 6px color-mix(in oklch, oklch(0 0 0) 10%, transparent),
              0 10px 30px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  animation: roy-glass-liquid-refract 6s ease-in-out infinite alternate;
}
.roycss-glass-liquid span {
  color: color-mix(in oklch, oklch(1 0 89.88) 95%, transparent);
  text-shadow: 0 1px 4px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
}
@keyframes roy-glass-liquid-refract {
  0%   { backdrop-filter: blur(8px) brightness(1.1) contrast(1.05) hue-rotate(0deg); }
  100% { backdrop-filter: blur(14px) brightness(1.15) contrast(1.1) hue-rotate(25deg); }
}`,
  },

  // 4. glass-neumorphism
  {
    id: "glass-neumorphism",
    name: "Neumorphism",
    category: "glass-ui",
    description: "Soft neumorphic raised surface with dual light and dark shadows for a 3D pop-out look",
    tags: ["neumorphism", "soft", "raised", "ui"],
    previewType: "card",
    cssCode: `/* Neumorphism (raised) */
.roycss-glass-neumorphism {
  background: oklch(0.92 0.011 256.7);
  border-radius: 16px;
  box-shadow: 8px 8px 16px oklch(0.794 0.01 258.34), -8px -8px 16px oklch(1 0 89.88);
}
.roycss-glass-neumorphism span {
  color: oklch(0.446 0.037 257.28);
  text-shadow: 1px 1px 1px color-mix(in oklch, oklch(1 0 89.88) 80%, transparent);
}`,
  },

  // 5. glass-neumorphism-inset
  {
    id: "glass-neumorphism-inset",
    name: "Neumorphism Inset",
    category: "glass-ui",
    description: "Inset neumorphic surface that appears pressed into the background with concave shadows",
    tags: ["neumorphism", "inset", "pressed", "concave"],
    previewType: "card",
    cssCode: `/* Neumorphism (inset / pressed) */
.roycss-glass-neumorphism-inset {
  background: oklch(0.92 0.011 256.7);
  border-radius: 16px;
  box-shadow: inset 6px 6px 12px oklch(0.794 0.01 258.34), inset -6px -6px 12px oklch(1 0 89.88);
}
.roycss-glass-neumorphism-inset span {
  color: oklch(0.554 0.041 257.42);
  text-shadow: 1px 1px 1px color-mix(in oklch, oklch(1 0 89.88) 70%, transparent);
}`,
  },

  // 6. glass-claymorphism
  {
    id: "glass-claymorphism",
    name: "Claymorphism",
    category: "glass-ui",
    description: "Claymorphism with rounded puffy edges, layered highlights and soft inner shadow for a clay look",
    tags: ["claymorphism", "clay", "puffy", "rounded"],
    previewType: "card",
    cssCode: `/* Claymorphism */
.roycss-glass-claymorphism {
  background: linear-gradient(145deg, oklch(0.974 0.013 347.94), oklch(0.899 0.059 343.23));
  border-radius: 28px;
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
  box-shadow:
    8px 8px 16px color-mix(in oklch, oklch(0.525 0.199 3.96) 18%, transparent),
    -4px -4px 12px color-mix(in oklch, oklch(1 0 89.88) 90%, transparent),
    inset 2px 2px 4px color-mix(in oklch, oklch(1 0 89.88) 70%, transparent),
    inset -2px -2px 6px color-mix(in oklch, oklch(0.525 0.199 3.96) 12%, transparent);
}
.roycss-glass-claymorphism span {
  color: oklch(0.459 0.17 3.82);
  font-weight: 600;
  text-shadow: 1px 1px 1px color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
}`,
  },

  // 7. glass-transparent-blur
  {
    id: "glass-transparent-blur",
    name: "Transparent Blur",
    category: "glass-ui",
    description: "Minimal transparent blur overlay with the lightest touch of frost and a hairline border",
    tags: ["transparent", "blur", "minimal", "overlay"],
    previewType: "card",
    cssCode: `/* Transparent Blur */
.roycss-glass-transparent-blur {
  background: color-mix(in oklch, oklch(1 0 89.88) 5%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 10px;
  box-shadow: 0 4px 16px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
}
.roycss-glass-transparent-blur span {
  color: color-mix(in oklch, oklch(1 0 89.88) 85%, transparent);
}`,
  },

  // 8. glass-frosted-dark
  {
    id: "glass-frosted-dark",
    name: "Dark Frosted Glass",
    category: "glass-ui",
    description: "Dark mode frosted glass with deep translucent background and subtle top-edge highlight",
    tags: ["dark", "frosted", "glass", "night"],
    previewType: "card",
    cssCode: `/* Dark Frosted Glass */
.roycss-glass-frosted-dark {
  background: color-mix(in oklch, oklch(0.199 0.03 283.36) 55%, transparent);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 8%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 40%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
}
.roycss-glass-frosted-dark span {
  color: color-mix(in oklch, oklch(1 0 89.88) 90%, transparent);
  text-shadow: 0 1px 3px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}`,
  },

  // 9. glass-vibrant
  {
    id: "glass-vibrant",
    name: "Vibrant Glass",
    category: "glass-ui",
    description: "Vibrant colored glass with saturation boost and a purple-pink gradient tint",
    tags: ["vibrant", "color", "glass", "saturate"],
    previewType: "card",
    cssCode: `/* Vibrant Glass */
.roycss-glass-vibrant {
  background: linear-gradient(135deg, color-mix(in oklch, oklch(0.627 0.233 303.9) 28%, transparent), color-mix(in oklch, oklch(0.656 0.212 354.31) 28%, transparent));
  backdrop-filter: blur(16px) saturate(220%) brightness(1.1);
  -webkit-backdrop-filter: blur(16px) saturate(220%) brightness(1.1);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 25%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0.627 0.233 303.9) 30%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 35%, transparent);
}
.roycss-glass-vibrant span {
  color: oklch(1 0 89.88);
  text-shadow: 0 1px 4px color-mix(in oklch, oklch(0.426 0.153 335.81) 60%, transparent);
}`,
  },

  // 10. glass-border-glow
  {
    id: "glass-border-glow",
    name: "Glowing Border Glass",
    category: "glass-ui",
    description: "Glass panel with an animated glowing border that pulses between cyan and blue",
    tags: ["glow", "border", "glass", "animated"],
    previewType: "card",
    cssCode: `/* Glowing Border Glass */
.roycss-glass-border-glow {
  position: relative;
  background: color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 20%, transparent);
  border-radius: 16px;
  animation: roy-glass-border-pulse 3s ease-in-out infinite alternate;
}
.roycss-glass-border-glow span {
  color: color-mix(in oklch, oklch(1 0 89.88) 95%, transparent);
  text-shadow: 0 0 8px color-mix(in oklch, oklch(0.889 0.177 169.75) 60%, transparent);
}
@keyframes roy-glass-border-pulse {
  0%   { box-shadow: 0 0 0 1px color-mix(in oklch, oklch(0.889 0.177 169.75) 40%, transparent), 0 0 16px color-mix(in oklch, oklch(0.889 0.177 169.75) 35%, transparent), 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent); }
  100% { box-shadow: 0 0 0 1px color-mix(in oklch, oklch(0.73 0.16 237.36) 60%, transparent), 0 0 30px color-mix(in oklch, oklch(0.73 0.16 237.36) 60%, transparent), 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent); }
}`,
  },

  // 11. glass-noise-overlay
  {
    id: "glass-noise-overlay",
    name: "Noise Texture Glass",
    category: "glass-ui",
    description: "Frosted glass with a subtle SVG noise texture overlaid for a granular, tactile feel",
    tags: ["noise", "texture", "glass", "grain"],
    previewType: "card",
    cssCode: `/* Noise Texture Glass */
.roycss-glass-noise-overlay {
  position: relative;
  background: color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 15%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent);
}
.roycss-glass-noise-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.1;
  pointer-events: none;
  mix-blend-mode: overlay;
}
.roycss-glass-noise-overlay span {
  position: relative;
  z-index: 1;
  color: color-mix(in oklch, oklch(1 0 89.88) 90%, transparent);
}`,
  },

  // 12. glass-reflection
  {
    id: "glass-reflection",
    name: "Light Reflection Glass",
    category: "glass-ui",
    description: "Glass panel with a diagonal light reflection streak that sweeps across periodically",
    tags: ["reflection", "shine", "glass", "sweep"],
    previewType: "card",
    cssCode: `/* Light Reflection Glass */
.roycss-glass-reflection {
  position: relative;
  overflow: hidden;
  background: color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 20%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 30%, transparent);
}
.roycss-glass-reflection::before {
  content: "";
  position: absolute;
  inset-block-start: -50%;
  inset-inline-start: -60%;
  inline-size: 35%;
  block-size: 200%;
  background: linear-gradient(90deg, transparent, color-mix(in oklch, oklch(1 0 89.88) 55%, transparent), transparent);
  transform: skewX(-20deg) rotate(8deg);
  animation: roy-glass-reflection-sweep 4s ease-in-out infinite;
  pointer-events: none;
}
.roycss-glass-reflection span {
  position: relative;
  z-index: 1;
  color: color-mix(in oklch, oklch(1 0 89.88) 95%, transparent);
}
@keyframes roy-glass-reflection-sweep {
  0%, 100% { inset-inline-start: -60%; }
  50%      { inset-inline-start: 130%; }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // PARTICLES (12) — environmental particle systems with childCount
  // ═══════════════════════════════════════════════════════════════

  // 1. particles-floating-dots
  {
    id: "particles-floating-dots",
    name: "Floating Dots",
    category: "particles",
    description: "Glowing blue dots rising upward at staggered intervals over a deep night gradient",
    tags: ["dots", "floating", "rise", "glow"],
    previewType: "background",
    childCount: 8,
    cssCode: `/* Floating Dots */
.roycss-particles-floating-dots {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75) 0%, oklch(0.279 0.037 260.03) 50%, oklch(0.208 0.04 265.75) 100%);
}
.roycss-particles-floating-dots span {
  position: absolute;
  inset-block-end: -12px;
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.714 0.143 254.62) 0%, oklch(0.623 0.188 259.81) 100%);
  box-shadow: 0 0 8px color-mix(in oklch, oklch(0.714 0.143 254.62) 80%, transparent);
  color: transparent;
  font-size: 0;
  animation: roy-particle-float-up 4s linear infinite;
}
.roycss-particles-floating-dots span:nth-child(1) { inset-inline-start: 8%;  animation-delay: 0s;   inline-size: 10px; block-size: 10px; }
.roycss-particles-floating-dots span:nth-child(2) { inset-inline-start: 20%; animation-delay: 0.5s; inline-size: 6px;  block-size: 6px;  }
.roycss-particles-floating-dots span:nth-child(3) { inset-inline-start: 32%; animation-delay: 1s;   inline-size: 8px;  block-size: 8px;  }
.roycss-particles-floating-dots span:nth-child(4) { inset-inline-start: 44%; animation-delay: 1.5s; inline-size: 5px;  block-size: 5px;  }
.roycss-particles-floating-dots span:nth-child(5) { inset-inline-start: 56%; animation-delay: 2s;   inline-size: 9px;  block-size: 9px;  }
.roycss-particles-floating-dots span:nth-child(6) { inset-inline-start: 68%; animation-delay: 2.5s; inline-size: 7px;  block-size: 7px;  }
.roycss-particles-floating-dots span:nth-child(7) { inset-inline-start: 80%; animation-delay: 3s;   inline-size: 6px;  block-size: 6px;  }
.roycss-particles-floating-dots span:nth-child(8) { inset-inline-start: 92%; animation-delay: 3.5s; inline-size: 8px;  block-size: 8px;  }
@keyframes roy-particle-float-up {
  0%   { transform: translateY(0) scale(0); opacity: 0; }
  10%  { opacity: 1; transform: translateY(-10px) scale(1); }
  90%  { opacity: 1; }
  100% { transform: translateY(-210px) scale(0.3); opacity: 0; }
}`,
  },

  // 2. particles-confetti-burst
  {
    id: "particles-confetti-burst",
    name: "Confetti Burst",
    category: "particles",
    description: "Colorful confetti pieces bursting outward from center in all directions, rotating as they fly",
    tags: ["confetti", "burst", "celebration", "color"],
    previewType: "background",
    childCount: 10,
    cssCode: `/* Confetti Burst */
.roycss-particles-confetti-burst {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: radial-gradient(circle at center, oklch(0.24 0.067 280.09) 0%, oklch(0.177 0.031 282.81) 100%);
}
.roycss-particles-confetti-burst span {
  --tx: 0px;
  --ty: 0px;
  --rot: 0deg;
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 8px;
  block-size: 10px;
  border-radius: 2px;
  color: transparent;
  font-size: 0;
  animation: roy-particle-confetti-burst 1.8s ease-out infinite;
}
.roycss-particles-confetti-burst span:nth-child(1)  { --tx: 55px;  --ty: -50px; --rot: 200deg; background: oklch(0.637 0.208 25.33); }
.roycss-particles-confetti-burst span:nth-child(2)  { --tx: -55px; --ty: -45px; --rot: 180deg; background: oklch(0.769 0.165 70.08); }
.roycss-particles-confetti-burst span:nth-child(3)  { --tx: 60px;  --ty: 30px;  --rot: 360deg; background: oklch(0.696 0.149 162.48); }
.roycss-particles-confetti-burst span:nth-child(4)  { --tx: -60px; --ty: 35px;  --rot: 270deg; background: oklch(0.623 0.188 259.81); }
.roycss-particles-confetti-burst span:nth-child(5)  { --tx: 0px;   --ty: -60px; --rot: 180deg; background: oklch(0.656 0.212 354.31); }
.roycss-particles-confetti-burst span:nth-child(6)  { --tx: 40px;  --ty: -20px; --rot: 220deg; background: oklch(0.606 0.219 292.72); }
.roycss-particles-confetti-burst span:nth-child(7)  { --tx: -45px; --ty: -15px; --rot: 320deg; background: oklch(0.705 0.187 47.6); }
.roycss-particles-confetti-burst span:nth-child(8)  { --tx: 30px;  --ty: 55px;  --rot: 250deg; background: oklch(0.715 0.126 215.22); }
.roycss-particles-confetti-burst span:nth-child(9)  { --tx: -35px; --ty: 50px;  --rot: 300deg; background: oklch(0.768 0.204 130.85); }
.roycss-particles-confetti-burst span:nth-child(10) { --tx: 0px;   --ty: 60px;  --rot: 190deg; background: oklch(0.837 0.164 84.43); }
@keyframes roy-particle-confetti-burst {
  0%   { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1) rotate(var(--rot)); opacity: 0; }
}`,
  },

  // 3. particles-snow-fall
  {
    id: "particles-snow-fall",
    name: "Snow Fall",
    category: "particles",
    description: "Gentle snowflakes of varying sizes drifting downward with a subtle horizontal sway",
    tags: ["snow", "winter", "fall", "cold"],
    previewType: "background",
    childCount: 8,
    cssCode: `/* Snow Fall */
.roycss-particles-snow-fall {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.292 0.061 267.08) 0%, oklch(0.372 0.081 266.12) 50%, oklch(0.269 0.053 266.15) 100%);
}
.roycss-particles-snow-fall span {
  position: absolute;
  inset-block-start: -12px;
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  background: oklch(1 0 89.88);
  box-shadow: 0 0 4px color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
  color: transparent;
  font-size: 0;
  animation: roy-particle-snow-fall 5s linear infinite;
}
.roycss-particles-snow-fall span:nth-child(1) { inset-inline-start: 6%;  animation-delay: 0s;   inline-size: 10px; block-size: 10px; }
.roycss-particles-snow-fall span:nth-child(2) { inset-inline-start: 20%; animation-delay: 0.8s; inline-size: 6px;  block-size: 6px;  }
.roycss-particles-snow-fall span:nth-child(3) { inset-inline-start: 33%; animation-delay: 1.6s; inline-size: 8px;  block-size: 8px;  }
.roycss-particles-snow-fall span:nth-child(4) { inset-inline-start: 46%; animation-delay: 2.4s; inline-size: 5px;  block-size: 5px;  }
.roycss-particles-snow-fall span:nth-child(5) { inset-inline-start: 58%; animation-delay: 3.2s; inline-size: 9px;  block-size: 9px;  }
.roycss-particles-snow-fall span:nth-child(6) { inset-inline-start: 70%; animation-delay: 4s;   inline-size: 7px;  block-size: 7px;  }
.roycss-particles-snow-fall span:nth-child(7) { inset-inline-start: 82%; animation-delay: 4.5s; inline-size: 6px;  block-size: 6px;  }
.roycss-particles-snow-fall span:nth-child(8) { inset-inline-start: 94%; animation-delay: 1.2s; inline-size: 8px;  block-size: 8px;  }
@keyframes roy-particle-snow-fall {
  0%   { transform: translate(0, -10px); opacity: 0; }
  10%  { opacity: 0.9; }
  50%  { transform: translate(15px, 100px); }
  90%  { opacity: 0.9; }
  100% { transform: translate(-10px, 210px); opacity: 0; }
}`,
  },

  // 4. particles-rain
  {
    id: "particles-rain",
    name: "Rain Streaks",
    category: "particles",
    description: "Thin diagonal rain streaks falling fast over a moody stormy night sky",
    tags: ["rain", "storm", "streak", "weather"],
    previewType: "background",
    childCount: 6,
    cssCode: `/* Rain Streaks */
.roycss-particles-rain {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.261 0.031 254.76) 0%, oklch(0.32 0.04 253.23) 50%, oklch(0.233 0.026 258.32) 100%);
}
.roycss-particles-rain span {
  position: absolute;
  inset-block-start: -30px;
  inline-size: 2px;
  block-size: 18px;
  background: linear-gradient(180deg, transparent, color-mix(in oklch, oklch(0.809 0.048 258.37) 85%, transparent));
  border-radius: 2px;
  color: transparent;
  font-size: 0;
  animation: roy-particle-rain-fall 0.9s linear infinite;
}
.roycss-particles-rain span:nth-child(1) { inset-inline-start: 10%; animation-delay: 0s;   block-size: 22px; }
.roycss-particles-rain span:nth-child(2) { inset-inline-start: 26%; animation-delay: 0.15s; block-size: 16px; }
.roycss-particles-rain span:nth-child(3) { inset-inline-start: 42%; animation-delay: 0.3s;  block-size: 20px; }
.roycss-particles-rain span:nth-child(4) { inset-inline-start: 58%; animation-delay: 0.45s; block-size: 18px; }
.roycss-particles-rain span:nth-child(5) { inset-inline-start: 74%; animation-delay: 0.6s;  block-size: 24px; }
.roycss-particles-rain span:nth-child(6) { inset-inline-start: 90%; animation-delay: 0.75s; block-size: 16px; }
@keyframes roy-particle-rain-fall {
  0%   { transform: translate(0, -30px); opacity: 0; }
  10%  { opacity: 0.8; }
  100% { transform: translate(-20px, 230px); opacity: 0; }
}`,
  },

  // 5. particles-fireflies
  {
    id: "particles-fireflies",
    name: "Fireflies",
    category: "particles",
    description: "Glowing yellow-green fireflies drifting slowly and pulsing in brightness over a dark forest",
    tags: ["fireflies", "glow", "night", "drift"],
    previewType: "background",
    childCount: 6,
    cssCode: `/* Fireflies */
.roycss-particles-fireflies {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.215 0.048 143.69) 0%, oklch(0.255 0.037 152.63) 50%, oklch(0.217 0.037 154.55) 100%);
}
.roycss-particles-fireflies span {
  position: absolute;
  inline-size: 5px;
  block-size: 5px;
  border-radius: 50%;
  background: oklch(0.943 0.162 124.78);
  box-shadow: 0 0 8px color-mix(in oklch, oklch(0.943 0.162 124.78) 90%, transparent), 0 0 16px color-mix(in oklch, oklch(0.943 0.162 124.78) 50%, transparent);
  color: transparent;
  font-size: 0;
  animation: roy-particle-firefly-glow 6s ease-in-out infinite;
}
.roycss-particles-fireflies span:nth-child(1) { inset-block-start: 30%; inset-inline-start: 12%; animation-delay: 0s;   }
.roycss-particles-fireflies span:nth-child(2) { inset-block-start: 60%; inset-inline-start: 28%; animation-delay: 1s;   }
.roycss-particles-fireflies span:nth-child(3) { inset-block-start: 20%; inset-inline-start: 48%; animation-delay: 2s;   }
.roycss-particles-fireflies span:nth-child(4) { inset-block-start: 70%; inset-inline-start: 62%; animation-delay: 3s;   }
.roycss-particles-fireflies span:nth-child(5) { inset-block-start: 40%; inset-inline-start: 78%; animation-delay: 4s;   }
.roycss-particles-fireflies span:nth-child(6) { inset-block-start: 55%; inset-inline-start: 90%; animation-delay: 1.5s; }
@keyframes roy-particle-firefly-glow {
  0%, 100% { transform: translate(0, 0); opacity: 0.2; box-shadow: 0 0 4px color-mix(in oklch, oklch(0.943 0.162 124.78) 40%, transparent); }
  25%      { transform: translate(15px, -10px); opacity: 1; box-shadow: 0 0 12px color-mix(in oklch, oklch(0.943 0.162 124.78) 100%, transparent); }
  50%      { transform: translate(-8px, -20px); opacity: 0.5; box-shadow: 0 0 6px color-mix(in oklch, oklch(0.943 0.162 124.78) 60%, transparent); }
  75%      { transform: translate(12px, -30px); opacity: 1; box-shadow: 0 0 14px color-mix(in oklch, oklch(0.943 0.162 124.78) 100%, transparent); }
}`,
  },

  // 6. particles-bubbles
  {
    id: "particles-bubbles",
    name: "Rising Bubbles",
    category: "particles",
    description: "Translucent bubbles with highlight glints rising upward through a teal aquatic gradient",
    tags: ["bubbles", "water", "rise", "aquatic"],
    previewType: "background",
    childCount: 6,
    cssCode: `/* Rising Bubbles */
.roycss-particles-bubbles {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.52 0.094 223.13) 0%, oklch(0.715 0.126 215.22) 50%, oklch(0.609 0.111 221.72) 100%);
}
.roycss-particles-bubbles span {
  position: absolute;
  inset-block-end: -20px;
  inline-size: 16px;
  block-size: 16px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, color-mix(in oklch, oklch(1 0 89.88) 90%, transparent), color-mix(in oklch, oklch(1 0 89.88) 15%, transparent) 60%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 30%, transparent);
  color: transparent;
  font-size: 0;
  animation: roy-particle-bubble-rise 5s ease-in infinite;
}
.roycss-particles-bubbles span:nth-child(1) { inset-inline-start: 10%; animation-delay: 0s;   inline-size: 18px; block-size: 18px; }
.roycss-particles-bubbles span:nth-child(2) { inset-inline-start: 25%; animation-delay: 0.8s; inline-size: 12px; block-size: 12px; }
.roycss-particles-bubbles span:nth-child(3) { inset-inline-start: 40%; animation-delay: 1.6s; inline-size: 20px; block-size: 20px; }
.roycss-particles-bubbles span:nth-child(4) { inset-inline-start: 58%; animation-delay: 2.4s; inline-size: 14px; block-size: 14px; }
.roycss-particles-bubbles span:nth-child(5) { inset-inline-start: 75%; animation-delay: 3.2s; inline-size: 16px; block-size: 16px; }
.roycss-particles-bubbles span:nth-child(6) { inset-inline-start: 90%; animation-delay: 4s;   inline-size: 10px; block-size: 10px; }
@keyframes roy-particle-bubble-rise {
  0%   { transform: translate(0, 0) scale(0.5); opacity: 0; }
  10%  { opacity: 0.85; transform: translate(0, -10px) scale(1); }
  50%  { transform: translate(10px, -100px) scale(1); }
  100% { transform: translate(-8px, -210px) scale(0.7); opacity: 0; }
}`,
  },

  // 7. particles-sparks
  {
    id: "particles-sparks",
    name: "Sparks",
    category: "particles",
    description: "Bright orange-yellow sparks shooting upward and fading like embers from a fire",
    tags: ["sparks", "embers", "fire", "shoot"],
    previewType: "background",
    childCount: 8,
    cssCode: `/* Sparks */
.roycss-particles-sparks {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.166 0.038 61.83) 0%, oklch(0.217 0.055 52.73) 50%, oklch(0.166 0.038 61.83) 100%);
}
.roycss-particles-sparks span {
  --tx: 10px;
  position: absolute;
  inset-block-end: 10px;
  inset-inline-start: 50%;
  inline-size: 4px;
  block-size: 4px;
  border-radius: 50%;
  background: oklch(0.837 0.164 84.43);
  box-shadow: 0 0 6px oklch(0.769 0.165 70.08), 0 0 12px color-mix(in oklch, oklch(0.769 0.165 70.08) 60%, transparent);
  color: transparent;
  font-size: 0;
  animation: roy-particle-spark-fly 1.6s ease-out infinite;
}
.roycss-particles-sparks span:nth-child(1) { --tx: -30px; margin-inline-start: -20px; animation-delay: 0s;   }
.roycss-particles-sparks span:nth-child(2) { --tx: -15px; margin-inline-start: -8px;  animation-delay: 0.2s; }
.roycss-particles-sparks span:nth-child(3) { --tx: 0px;   margin-inline-start: 0;     animation-delay: 0.4s; background: oklch(0.705 0.187 47.6); }
.roycss-particles-sparks span:nth-child(4) { --tx: 15px;  margin-inline-start: 8px;   animation-delay: 0.6s; }
.roycss-particles-sparks span:nth-child(5) { --tx: 30px;  margin-inline-start: 20px;  animation-delay: 0.8s; background: oklch(0.637 0.208 25.33); }
.roycss-particles-sparks span:nth-child(6) { --tx: -22px; margin-inline-start: -14px; animation-delay: 1s;   }
.roycss-particles-sparks span:nth-child(7) { --tx: 22px;  margin-inline-start: 14px;  animation-delay: 1.2s; }
.roycss-particles-sparks span:nth-child(8) { --tx: 8px;   margin-inline-start: 4px;   animation-delay: 1.4s; background: oklch(0.705 0.187 47.6); }
@keyframes roy-particle-spark-fly {
  0%   { transform: translate(0, 0) scale(0); opacity: 1; }
  20%  { transform: translate(calc(var(--tx) * 0.4), -40px) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), -160px) scale(0.2); opacity: 0; }
}`,
  },

  // 8. particles-dust
  {
    id: "particles-dust",
    name: "Dust Motes",
    category: "particles",
    description: "Tiny translucent dust motes drifting slowly in random directions through warm light",
    tags: ["dust", "motes", "drift", "ambient"],
    previewType: "background",
    childCount: 8,
    cssCode: `/* Dust Motes */
.roycss-particles-dust {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(135deg, oklch(0.347 0.045 65.44) 0%, oklch(0.447 0.061 67.94) 40%, oklch(0.549 0.078 76.6) 70%, oklch(0.392 0.055 64.02) 100%);
}
.roycss-particles-dust span {
  --tx: 30px;
  --ty: -30px;
  position: absolute;
  inline-size: 4px;
  block-size: 4px;
  border-radius: 50%;
  background: color-mix(in oklch, oklch(0.957 0.054 89.91) 70%, transparent);
  box-shadow: 0 0 3px color-mix(in oklch, oklch(0.957 0.054 89.91) 40%, transparent);
  color: transparent;
  font-size: 0;
  animation: roy-particle-dust-drift 8s ease-in-out infinite;
}
.roycss-particles-dust span:nth-child(1) { inset-block-start: 20%; inset-inline-start: 10%; --tx: 40px;  --ty: -30px; animation-delay: 0s;   inline-size: 5px; block-size: 5px; }
.roycss-particles-dust span:nth-child(2) { inset-block-start: 50%; inset-inline-start: 25%; --tx: -25px; --ty: -40px; animation-delay: 1s;   inline-size: 3px; block-size: 3px; }
.roycss-particles-dust span:nth-child(3) { inset-block-start: 30%; inset-inline-start: 40%; --tx: 35px;  --ty: -20px; animation-delay: 2s;   inline-size: 4px; block-size: 4px; }
.roycss-particles-dust span:nth-child(4) { inset-block-start: 70%; inset-inline-start: 55%; --tx: -30px; --ty: -35px; animation-delay: 3s;   inline-size: 6px; block-size: 6px; }
.roycss-particles-dust span:nth-child(5) { inset-block-start: 40%; inset-inline-start: 70%; --tx: 20px;  --ty: -45px; animation-delay: 4s;   inline-size: 3px; block-size: 3px; }
.roycss-particles-dust span:nth-child(6) { inset-block-start: 60%; inset-inline-start: 85%; --tx: -40px; --ty: -25px; animation-delay: 5s;   inline-size: 5px; block-size: 5px; }
.roycss-particles-dust span:nth-child(7) { inset-block-start: 15%; inset-inline-start: 60%; --tx: 30px;  --ty: -50px; animation-delay: 2.5s; inline-size: 4px; block-size: 4px; }
.roycss-particles-dust span:nth-child(8) { inset-block-start: 80%; inset-inline-start: 30%; --tx: -20px; --ty: -40px; animation-delay: 6s;   inline-size: 3px; block-size: 3px; }
@keyframes roy-particle-dust-drift {
  0%, 100% { transform: translate(0, 0); opacity: 0; }
  20%      { opacity: 0.7; }
  80%      { opacity: 0.7; }
  100%     { transform: translate(var(--tx), var(--ty)); opacity: 0; }
}`,
  },

  // 9. particles-stars-twinkle
  {
    id: "particles-stars-twinkle",
    name: "Twinkling Stars",
    category: "particles",
    description: "Stars of varying sizes twinkling in place with scale and brightness pulses across a night sky",
    tags: ["stars", "twinkle", "night", "sky"],
    previewType: "background",
    childCount: 10,
    cssCode: `/* Twinkling Stars */
.roycss-particles-stars-twinkle {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: radial-gradient(ellipse at top, oklch(0.255 0.093 277.48) 0%, oklch(0.163 0.051 279.14) 60%, oklch(0.124 0.029 281.33) 100%);
}
.roycss-particles-stars-twinkle span {
  position: absolute;
  inline-size: 3px;
  block-size: 3px;
  border-radius: 50%;
  background: oklch(1 0 89.88);
  color: transparent;
  font-size: 0;
  animation: roy-particle-star-twinkle 3s ease-in-out infinite;
}
.roycss-particles-stars-twinkle span:nth-child(1)  { inset-block-start: 12%; inset-inline-start: 8%;  animation-delay: 0s;   inline-size: 4px; block-size: 4px; }
.roycss-particles-stars-twinkle span:nth-child(2)  { inset-block-start: 25%; inset-inline-start: 22%; animation-delay: 0.3s; inline-size: 2px; block-size: 2px; }
.roycss-particles-stars-twinkle span:nth-child(3)  { inset-block-start: 40%; inset-inline-start: 15%; animation-delay: 0.6s; inline-size: 5px; block-size: 5px; }
.roycss-particles-stars-twinkle span:nth-child(4)  { inset-block-start: 18%; inset-inline-start: 38%; animation-delay: 0.9s; inline-size: 3px; block-size: 3px; }
.roycss-particles-stars-twinkle span:nth-child(5)  { inset-block-start: 55%; inset-inline-start: 48%; animation-delay: 1.2s; inline-size: 4px; block-size: 4px; }
.roycss-particles-stars-twinkle span:nth-child(6)  { inset-block-start: 30%; inset-inline-start: 60%; animation-delay: 1.5s; inline-size: 2px; block-size: 2px; }
.roycss-particles-stars-twinkle span:nth-child(7)  { inset-block-start: 65%; inset-inline-start: 70%; animation-delay: 1.8s; inline-size: 5px; block-size: 5px; }
.roycss-particles-stars-twinkle span:nth-child(8)  { inset-block-start: 22%; inset-inline-start: 78%; animation-delay: 2.1s; inline-size: 3px; block-size: 3px; }
.roycss-particles-stars-twinkle span:nth-child(9)  { inset-block-start: 48%; inset-inline-start: 88%; animation-delay: 2.4s; inline-size: 4px; block-size: 4px; }
.roycss-particles-stars-twinkle span:nth-child(10) { inset-block-start: 72%; inset-inline-start: 32%; animation-delay: 2.7s; inline-size: 2px; block-size: 2px; }
@keyframes roy-particle-star-twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.6); box-shadow: 0 0 2px color-mix(in oklch, oklch(1 0 89.88) 30%, transparent); }
  50%      { opacity: 1; transform: scale(1.3); box-shadow: 0 0 8px color-mix(in oklch, oklch(1 0 89.88) 90%, transparent); }
}`,
  },

  // 10. particles-fire
  {
    id: "particles-fire",
    name: "Fire Embers",
    category: "particles",
    description: "Glowing fire embers rising and flickering from the bottom with warm orange-red hues",
    tags: ["fire", "embers", "flame", "warm"],
    previewType: "background",
    childCount: 5,
    cssCode: `/* Fire Embers */
.roycss-particles-fire {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.204 0.062 41.56) 0%, oklch(0.28 0.086 40.87) 40%, oklch(0.153 0.044 45.08) 100%);
}
.roycss-particles-fire span {
  position: absolute;
  inset-block-end: 5px;
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.905 0.166 98.11) 0%, oklch(0.705 0.187 47.6) 50%, oklch(0.577 0.215 27.33) 100%);
  box-shadow: 0 0 10px oklch(0.705 0.187 47.6), 0 0 20px color-mix(in oklch, oklch(0.705 0.187 47.6) 60%, transparent);
  color: transparent;
  font-size: 0;
  animation: roy-particle-flame-flicker 2s ease-out infinite;
}
.roycss-particles-fire span:nth-child(1) { inset-inline-start: 25%; animation-delay: 0s;   inline-size: 10px; block-size: 10px; }
.roycss-particles-fire span:nth-child(2) { inset-inline-start: 40%; animation-delay: 0.4s; inline-size: 7px;  block-size: 7px;  }
.roycss-particles-fire span:nth-child(3) { inset-inline-start: 55%; animation-delay: 0.8s; inline-size: 9px;  block-size: 9px;  }
.roycss-particles-fire span:nth-child(4) { inset-inline-start: 68%; animation-delay: 1.2s; inline-size: 6px;  block-size: 6px;  }
.roycss-particles-fire span:nth-child(5) { inset-inline-start: 82%; animation-delay: 1.6s; inline-size: 8px;  block-size: 8px;  }
@keyframes roy-particle-flame-flicker {
  0%   { transform: translate(0, 0) scale(0.5); opacity: 0; }
  15%  { opacity: 1; transform: translate(3px, -15px) scale(1); }
  50%  { transform: translate(-4px, -60px) scale(0.9); opacity: 0.9; }
  100% { transform: translate(6px, -140px) scale(0.2); opacity: 0; }
}`,
  },

  // 11. particles-smoke
  {
    id: "particles-smoke",
    name: "Rising Smoke",
    category: "particles",
    description: "Large translucent gray smoke wisps rising and expanding as they fade into the air",
    tags: ["smoke", "wisps", "rise", "fade"],
    previewType: "background",
    childCount: 4,
    cssCode: `/* Rising Smoke */
.roycss-particles-smoke {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.218 0 89.88) 0%, oklch(0.297 0 89.88) 50%, oklch(0.168 0 89.88) 100%);
}
.roycss-particles-smoke span {
  --tx: 10px;
  position: absolute;
  inset-block-end: -10px;
  inline-size: 24px;
  block-size: 24px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in oklch, oklch(0.833 0 89.88) 40%, transparent) 0%, color-mix(in oklch, oklch(0.673 0 89.88) 15%, transparent) 60%, transparent 100%);
  filter: blur(4px);
  color: transparent;
  font-size: 0;
  animation: roy-particle-smoke-rise 5s ease-out infinite;
}
.roycss-particles-smoke span:nth-child(1) { inset-inline-start: 20%; --tx: 12px;  animation-delay: 0s;   }
.roycss-particles-smoke span:nth-child(2) { inset-inline-start: 45%; --tx: -15px; animation-delay: 1.2s; inline-size: 28px; block-size: 28px; }
.roycss-particles-smoke span:nth-child(3) { inset-inline-start: 65%; --tx: 10px;  animation-delay: 2.4s; }
.roycss-particles-smoke span:nth-child(4) { inset-inline-start: 80%; --tx: -8px;  animation-delay: 3.6s; inline-size: 20px; block-size: 20px; }
@keyframes roy-particle-smoke-rise {
  0%   { transform: translate(0, 0) scale(0.4); opacity: 0; }
  20%  { opacity: 0.7; }
  100% { transform: translate(var(--tx), -180px) scale(2.2); opacity: 0; }
}`,
  },

  // 12. particles-orbiting
  {
    id: "particles-orbiting",
    name: "Orbiting Particles",
    category: "particles",
    description: "Colored particles orbiting a central glowing core at different radii and speeds",
    tags: ["orbit", "particles", "spin", "cosmic"],
    previewType: "background",
    childCount: 5,
    cssCode: `/* Orbiting Particles */
.roycss-particles-orbiting {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: radial-gradient(circle at center, oklch(0.257 0.086 281.29) 0%, oklch(0.179 0.069 283.28) 60%, oklch(0.118 0.042 286.2) 100%);
}
.roycss-particles-orbiting::before {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 16px;
  block-size: 16px;
  margin: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.837 0.164 84.43) 0%, oklch(0.769 0.165 70.08) 50%, transparent 80%);
  box-shadow: 0 0 20px oklch(0.769 0.165 70.08), 0 0 40px color-mix(in oklch, oklch(0.769 0.165 70.08) 50%, transparent);
}
.roycss-particles-orbiting span {
  --r: 30px;
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 8px;
  block-size: 8px;
  margin: -4px;
  border-radius: 50%;
  color: transparent;
  font-size: 0;
  animation: roy-particle-orbit 4s linear infinite;
}
.roycss-particles-orbiting span:nth-child(1) { --r: 24px; background: oklch(0.714 0.143 254.62); box-shadow: 0 0 6px oklch(0.714 0.143 254.62); animation-duration: 3s; }
.roycss-particles-orbiting span:nth-child(2) { --r: 38px; background: oklch(0.773 0.153 163.22); box-shadow: 0 0 6px oklch(0.773 0.153 163.22); animation-duration: 4s; animation-direction: reverse; }
.roycss-particles-orbiting span:nth-child(3) { --r: 52px; background: oklch(0.725 0.175 349.76); box-shadow: 0 0 6px oklch(0.725 0.175 349.76); animation-duration: 5s; }
.roycss-particles-orbiting span:nth-child(4) { --r: 66px; background: oklch(0.709 0.159 293.54); box-shadow: 0 0 6px oklch(0.709 0.159 293.54); animation-duration: 6s; animation-direction: reverse; inline-size: 6px; block-size: 6px; margin: -3px; }
.roycss-particles-orbiting span:nth-child(5) { --r: 80px; background: oklch(0.861 0.173 91.94); box-shadow: 0 0 6px oklch(0.861 0.173 91.94); animation-duration: 7s; inline-size: 6px; block-size: 6px; margin: -3px; }
@keyframes roy-particle-orbit {
  from { transform: rotate(0deg) translateX(var(--r)) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(var(--r)) rotate(-360deg); }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // MICROINTERACTIONS (12) — small component animations (looping demos)
  // ═══════════════════════════════════════════════════════════════

  // 1. micro-toggle-switch
  {
    id: "micro-toggle-switch",
    name: "Toggle Switch",
    category: "microinteractions",
    description: "Animated toggle switch that slides its knob and shifts background color on a loop",
    tags: ["toggle", "switch", "slide", "knob"],
    previewType: "card",
    cssCode: `/* Toggle Switch */
.roycss-micro-toggle-switch {
  position: relative;
  inline-size: 56px;
  block-size: 30px;
  background: oklch(0.869 0.02 252.89);
  border-radius: 15px;
  box-shadow: inset 0 2px 4px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  animation: roy-micro-toggle-bg 3s ease-in-out infinite;
}
.roycss-micro-toggle-switch > span { display: none; }
.roycss-micro-toggle-switch::after {
  content: "";
  position: absolute;
  inset-block-start: 3px;
  inset-inline-start: 3px;
  inline-size: 24px;
  block-size: 24px;
  background: oklch(1 0 89.88);
  border-radius: 50%;
  box-shadow: 0 2px 6px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  animation: roy-micro-toggle-slide 3s ease-in-out infinite;
}
@keyframes roy-micro-toggle-bg {
  0%, 45%   { background: oklch(0.869 0.02 252.89); }
  55%, 100% { background: oklch(0.696 0.149 162.48); }
}
@keyframes roy-micro-toggle-slide {
  0%, 45%   { inset-inline-start: 3px; }
  55%, 100% { inset-inline-start: 29px; }
}`,
  },

  // 2. micro-checkbox-check
  {
    id: "micro-checkbox-check",
    name: "Checkbox Check",
    category: "microinteractions",
    description: "Checkbox with an animated checkmark that draws in and erases on a repeating loop",
    tags: ["checkbox", "check", "draw", "form"],
    previewType: "card",
    cssCode: `/* Checkbox Check */
.roycss-micro-checkbox-check {
  position: relative;
  inline-size: 38px;
  block-size: 38px;
  background: oklch(1 0 89.88);
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
}
.roycss-micro-checkbox-check > span { display: none; }
.roycss-micro-checkbox-check::after {
  content: "";
  inline-size: 16px;
  block-size: 8px;
  border-inline-start: 3px solid oklch(0.696 0.149 162.48);
  border-block-end: 3px solid oklch(0.696 0.149 162.48);
  transform: rotate(-45deg) scale(0);
  transform-origin: bottom left;
  animation: roy-micro-check-draw 2.5s ease-in-out infinite;
}
@keyframes roy-micro-check-draw {
  0%, 5%   { transform: rotate(-45deg) scale(0); }
  10%, 35% { transform: rotate(-45deg) scale(1); }
  80%      { transform: rotate(-45deg) scale(1); }
  95%, 100% { transform: rotate(-45deg) scale(0); }
}`,
  },

  // 3. micro-radio-select
  {
    id: "micro-radio-select",
    name: "Radio Select",
    category: "microinteractions",
    description: "Radio button with an inner dot that pulses and emits a ripple ring to show selection",
    tags: ["radio", "select", "pulse", "form"],
    previewType: "card",
    cssCode: `/* Radio Select */
.roycss-micro-radio-select {
  position: relative;
  inline-size: 38px;
  block-size: 38px;
  background: oklch(1 0 89.88);
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
}
.roycss-micro-radio-select > span { display: none; }
.roycss-micro-radio-select::after {
  content: "";
  inline-size: 16px;
  block-size: 16px;
  background: oklch(0.696 0.149 162.48);
  border-radius: 50%;
  animation: roy-micro-radio-pulse 2s ease-in-out infinite;
}
@keyframes roy-micro-radio-pulse {
  0%, 100% { transform: scale(0.4); opacity: 0.5; box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent); }
  50%      { transform: scale(1); opacity: 1; box-shadow: 0 0 0 8px color-mix(in oklch, oklch(0.696 0.149 162.48) 0%, transparent); }
}`,
  },

  // 4. micro-accordion-expand
  {
    id: "micro-accordion-expand",
    name: "Accordion Expand",
    category: "microinteractions",
    description: "Accordion section that expands to reveal content and collapses again in a smooth height loop",
    tags: ["accordion", "expand", "collapse", "height"],
    previewType: "card",
    cssCode: `/* Accordion Expand */
.roycss-micro-accordion-expand {
  position: relative;
  inline-size: 140px;
  block-size: 90px;
  background: oklch(1 0 89.88);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px color-mix(in oklch, oklch(0 0 0) 10%, transparent);
}
.roycss-micro-accordion-expand > span { display: none; }
.roycss-micro-accordion-expand::before {
  content: "Section Title";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  padding: 8px 12px;
  background: oklch(0.585 0.204 277.12);
  color: oklch(1 0 89.88);
  font: 600 11px/1 system-ui, sans-serif;
  z-index: 1;
}
.roycss-micro-accordion-expand::after {
  content: "Expanded content reveals here with a smooth height animation.";
  position: absolute;
  inset-block-start: 30px;
  inset-inline-start: 0;
  inset-inline-end: 0;
  padding: 0 12px;
  background: oklch(0.962 0.018 272.31);
  color: oklch(0.446 0.037 257.28);
  font: 9px/1.4 system-ui, sans-serif;
  overflow: hidden;
  max-block-size: 0;
  opacity: 0;
  animation: roy-micro-accordion-expand 3s ease-in-out infinite;
}
@keyframes roy-micro-accordion-expand {
  0%, 20%   { max-block-size: 0; padding-block-start: 0; padding-block-end: 0; opacity: 0; }
  40%, 75%  { max-block-size: 60px; padding-block-start: 8px; padding-block-end: 8px; opacity: 1; }
  95%, 100% { max-block-size: 0; padding-block-start: 0; padding-block-end: 0; opacity: 0; }
}`,
  },

  // 5. micro-tooltip-appear
  {
    id: "micro-tooltip-appear",
    name: "Tooltip Appear",
    category: "microinteractions",
    description: "Tooltip that fades and slides in above a trigger element, then disappears on a loop",
    tags: ["tooltip", "fade", "slide", "appear"],
    previewType: "card",
    cssCode: `/* Tooltip Appear */
.roycss-micro-tooltip-appear {
  position: relative;
  inline-size: 130px;
  block-size: 70px;
}
.roycss-micro-tooltip-appear > span { display: none; }
.roycss-micro-tooltip-appear::before {
  content: "Hover me";
  position: absolute;
  inset-block-end: 4px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  background: oklch(0.623 0.188 259.81);
  color: oklch(1 0 89.88);
  font: 600 11px/1 system-ui, sans-serif;
  border-radius: 6px;
}
.roycss-micro-tooltip-appear::after {
  content: "I'm a tooltip!";
  position: absolute;
  inset-block-start: 4px;
  inset-inline-start: 50%;
  padding: 5px 10px;
  background: oklch(0.279 0.037 260.03);
  color: oklch(1 0 89.88);
  font: 10px/1 system-ui, sans-serif;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
  animation: roy-micro-tooltip-appear 2.5s ease-in-out infinite;
}
@keyframes roy-micro-tooltip-appear {
  0%, 30%   { opacity: 0; transform: translateX(-50%) translateY(8px); }
  45%, 75%  { opacity: 1; transform: translateX(-50%) translateY(0); }
  90%, 100% { opacity: 0; transform: translateX(-50%) translateY(8px); }
}`,
  },

  // 6. micro-toast-slide
  {
    id: "micro-toast-slide",
    name: "Toast Slide",
    category: "microinteractions",
    description: "Success toast notification that slides in from the top, holds, then slides back out on a loop",
    tags: ["toast", "notification", "slide", "success"],
    previewType: "card",
    cssCode: `/* Toast Slide */
.roycss-micro-toast-slide {
  position: relative;
  inline-size: 150px;
  block-size: 80px;
  overflow: hidden;
  border-radius: 8px;
}
.roycss-micro-toast-slide > span { display: none; }
.roycss-micro-toast-slide::before {
  content: "✓  Success! Action completed.";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  padding: 10px 12px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.596 0.127 163.23));
  color: oklch(1 0 89.88);
  font: 600 10px/1.3 system-ui, sans-serif;
  border-radius: 6px;
  box-shadow: 0 4px 12px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
  transform: translateY(-100%);
  animation: roy-micro-toast-slide 3s ease-in-out infinite;
}
@keyframes roy-micro-toast-slide {
  0%, 10%   { transform: translateY(-100%); }
  20%, 75%  { transform: translateY(0); }
  90%, 100% { transform: translateY(-100%); }
}`,
  },

  // 7. micro-dropdown-reveal
  {
    id: "micro-dropdown-reveal",
    name: "Dropdown Reveal",
    category: "microinteractions",
    description: "Dropdown menu that scales open to reveal stacked menu items, then closes on a loop",
    tags: ["dropdown", "menu", "reveal", "scale"],
    previewType: "card",
    cssCode: `/* Dropdown Reveal */
.roycss-micro-dropdown-reveal {
  position: relative;
  inline-size: 120px;
  block-size: 90px;
}
.roycss-micro-dropdown-reveal > span { display: none; }
.roycss-micro-dropdown-reveal::before {
  content: "Menu";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  padding: 7px 12px;
  background: oklch(0.585 0.204 277.12);
  color: oklch(1 0 89.88);
  font: 600 11px/1 system-ui, sans-serif;
  border-radius: 6px;
  text-align: center;
  z-index: 1;
}
.roycss-micro-dropdown-reveal::after {
  content: "Edit\\ADelete\\AShare";
  white-space: pre;
  position: absolute;
  inset-block-start: 32px;
  inset-inline-start: 0;
  inset-inline-end: 0;
  padding: 6px 12px;
  background: oklch(1 0 89.88);
  border: 1px solid oklch(0.929 0.013 255.51);
  border-radius: 6px;
  font: 10px/1.7 system-ui, sans-serif;
  color: oklch(0.446 0.037 257.28);
  box-shadow: 0 6px 16px color-mix(in oklch, oklch(0 0 0) 12%, transparent);
  transform: scaleY(0);
  transform-origin: top;
  opacity: 0;
  animation: roy-micro-dropdown-reveal 3s ease-in-out infinite;
}
@keyframes roy-micro-dropdown-reveal {
  0%, 20%   { transform: scaleY(0); opacity: 0; }
  40%, 75%  { transform: scaleY(1); opacity: 1; }
  90%, 100% { transform: scaleY(0); opacity: 0; }
}`,
  },

  // 8. micro-modal-scale
  {
    id: "micro-modal-scale",
    name: "Modal Scale",
    category: "microinteractions",
    description: "Modal dialog that scales in with a spring overshoot over a fading backdrop, then dismisses",
    tags: ["modal", "dialog", "scale", "backdrop"],
    previewType: "card",
    cssCode: `/* Modal Scale */
.roycss-micro-modal-scale {
  position: relative;
  inline-size: 150px;
  block-size: 90px;
  overflow: hidden;
  border-radius: 8px;
  background: oklch(0.968 0.007 247.9);
}
.roycss-micro-modal-scale > span { display: none; }
.roycss-micro-modal-scale::before {
  content: "";
  position: absolute;
  inset: 0;
  background: color-mix(in oklch, oklch(0.208 0.04 265.75) 55%, transparent);
  opacity: 0;
  animation: roy-micro-modal-backdrop 3s ease-in-out infinite;
}
.roycss-micro-modal-scale::after {
  content: "Modal Dialog";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  padding: 14px 22px;
  background: oklch(1 0 89.88);
  color: oklch(0.279 0.037 260.03);
  font: 600 12px/1.2 system-ui, sans-serif;
  border-radius: 10px;
  box-shadow: 0 20px 40px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  transform: translate(-50%, -50%) scale(0);
  animation: roy-micro-modal-scale 3s ease-in-out infinite;
}
@keyframes roy-micro-modal-backdrop {
  0%, 15%   { opacity: 0; }
  30%, 75%  { opacity: 1; }
  90%, 100% { opacity: 0; }
}
@keyframes roy-micro-modal-scale {
  0%, 15%   { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
  30%       { transform: translate(-50%, -50%) scale(1.06); opacity: 1; }
  40%, 75%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  90%, 100% { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
}`,
  },

  // 9. micro-fab-expand
  {
    id: "micro-fab-expand",
    name: "FAB Expand",
    category: "microinteractions",
    description: "Floating action button that rotates into an X while a menu item expands out beside it",
    tags: ["fab", "expand", "menu", "rotate"],
    previewType: "card",
    cssCode: `/* FAB Expand */
.roycss-micro-fab-expand {
  position: relative;
  inline-size: 150px;
  block-size: 90px;
}
.roycss-micro-fab-expand > span { display: none; }
.roycss-micro-fab-expand::before {
  content: "+";
  position: absolute;
  inset-block-end: 8px;
  inset-inline-end: 8px;
  inline-size: 38px;
  block-size: 38px;
  background: linear-gradient(135deg, oklch(0.656 0.212 354.31), oklch(0.525 0.199 3.96));
  color: oklch(1 0 89.88);
  font: 300 24px/1 system-ui, sans-serif;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px color-mix(in oklch, oklch(0.656 0.212 354.31) 40%, transparent);
  animation: roy-micro-fab-rotate 3s ease-in-out infinite;
  z-index: 2;
}
.roycss-micro-fab-expand::after {
  content: "Share";
  position: absolute;
  inset-block-end: 16px;
  inset-inline-end: 54px;
  padding: 5px 12px;
  background: oklch(0.606 0.219 292.72);
  color: oklch(1 0 89.88);
  font: 600 10px/1 system-ui, sans-serif;
  border-radius: 12px;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(20px) scale(0.5);
  transform-origin: right center;
  box-shadow: 0 4px 12px color-mix(in oklch, oklch(0.606 0.219 292.72) 40%, transparent);
  animation: roy-micro-fab-expand 3s ease-in-out infinite;
}
@keyframes roy-micro-fab-rotate {
  0%, 30%   { transform: rotate(0deg); }
  50%, 75%  { transform: rotate(45deg); }
  95%, 100% { transform: rotate(0deg); }
}
@keyframes roy-micro-fab-expand {
  0%, 30%   { opacity: 0; transform: translateX(20px) scale(0.5); }
  50%, 75%  { opacity: 1; transform: translateX(0) scale(1); }
  95%, 100% { opacity: 0; transform: translateX(20px) scale(0.5); }
}`,
  },

  // 10. micro-progress-fill
  {
    id: "micro-progress-fill",
    name: "Progress Fill",
    category: "microinteractions",
    description: "Progress bar that fills from zero to full with a shimmering gradient sweep, then repeats",
    tags: ["progress", "bar", "fill", "shimmer"],
    previewType: "card",
    cssCode: `/* Progress Fill */
.roycss-micro-progress-fill {
  position: relative;
  inline-size: 140px;
  block-size: 14px;
  background: oklch(0.929 0.013 255.51);
  border-radius: 7px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px color-mix(in oklch, oklch(0 0 0) 10%, transparent);
}
.roycss-micro-progress-fill > span { display: none; }
.roycss-micro-progress-fill::after {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  block-size: 100%;
  inline-size: 0;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.773 0.153 163.22), oklch(0.696 0.149 162.48));
  background-size: 200% 100%;
  border-radius: 7px;
  animation: roy-micro-progress-fill 2.5s ease-in-out infinite;
}
@keyframes roy-micro-progress-fill {
  0%   { inline-size: 0; background-position: 200% 0; }
  50%  { inline-size: 60%; background-position: 0 0; }
  100% { inline-size: 100%; background-position: -200% 0; }
}`,
  },

  // 11. micro-tab-indicator
  {
    id: "micro-tab-indicator",
    name: "Tab Indicator",
    category: "microinteractions",
    description: "Tab bar with an underline indicator that slides between three tab positions on a loop",
    tags: ["tab", "indicator", "underline", "slide"],
    previewType: "card",
    cssCode: `/* Tab Indicator */
.roycss-micro-tab-indicator {
  position: relative;
  inline-size: 150px;
  block-size: 50px;
}
.roycss-micro-tab-indicator > span { display: none; }
.roycss-micro-tab-indicator::before {
  content: "Tab 1      Tab 2      Tab 3";
  position: absolute;
  inset-block-start: 12px;
  inset-inline-start: 0;
  inset-inline-end: 0;
  font: 600 10px/1 system-ui, sans-serif;
  color: oklch(0.711 0.035 256.79);
  letter-spacing: 1px;
  text-align: start;
  padding-inline-start: 12px;
}
.roycss-micro-tab-indicator::after {
  content: "";
  position: absolute;
  inset-block-end: 8px;
  inset-inline-start: 12px;
  inline-size: 34px;
  block-size: 3px;
  background: oklch(0.585 0.204 277.12);
  border-radius: 2px;
  animation: roy-micro-tab-slide 3.6s ease-in-out infinite;
}
@keyframes roy-micro-tab-slide {
  0%, 15%   { inset-inline-start: 12px; }
  35%, 50%  { inset-inline-start: 64px; }
  70%, 85%  { inset-inline-start: 116px; }
  100%      { inset-inline-start: 12px; }
}`,
  },

  // 12. micro-badge-bounce
  {
    id: "micro-badge-bounce",
    name: "Badge Bounce",
    category: "microinteractions",
    description: "Notification badge with a number that bounces in with spring overshoot on a repeating loop",
    tags: ["badge", "notification", "bounce", "spring"],
    previewType: "card",
    cssCode: `/* Badge Bounce */
.roycss-micro-badge-bounce {
  position: relative;
  inline-size: 64px;
  block-size: 64px;
  background: oklch(0.968 0.007 247.9);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px color-mix(in oklch, oklch(0 0 0) 8%, transparent);
}
.roycss-micro-badge-bounce > span { display: none; }
.roycss-micro-badge-bounce::before {
  content: "\\2709";
  font-size: 28px;
  color: oklch(0.554 0.041 257.42);
}
.roycss-micro-badge-bounce::after {
  content: "3";
  position: absolute;
  inset-block-start: -6px;
  inset-inline-end: -6px;
  inline-size: 24px;
  block-size: 24px;
  background: oklch(0.637 0.208 25.33);
  color: oklch(1 0 89.88);
  font: 700 11px/1 system-ui, sans-serif;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid oklch(1 0 89.88);
  transform: scale(0);
  animation: roy-micro-badge-bounce 2.2s ease-in-out infinite;
}
@keyframes roy-micro-badge-bounce {
  0%        { transform: scale(0); opacity: 0; }
  10%       { transform: scale(1.35); opacity: 1; }
  20%       { transform: scale(0.85); }
  30%, 80%  { transform: scale(1); opacity: 1; }
  95%, 100% { transform: scale(0); opacity: 0; }
}`,
  },
];
