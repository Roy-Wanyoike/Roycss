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
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.roycss-glass-frosted span {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
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
  background: rgba(245, 247, 250, 0.65);
  backdrop-filter: blur(30px) saturate(140%);
  -webkit-backdrop-filter: blur(30px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}
.roycss-glass-acrylic span {
  color: #1e293b;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px) brightness(1.1) contrast(1.05) hue-rotate(15deg);
  -webkit-backdrop-filter: blur(8px) brightness(1.1) contrast(1.05) hue-rotate(15deg);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  box-shadow: inset 0 2px 6px rgba(255, 255, 255, 0.4),
              inset 0 -2px 6px rgba(0, 0, 0, 0.1),
              0 10px 30px rgba(0, 0, 0, 0.15);
  animation: roy-glass-liquid-refract 6s ease-in-out infinite alternate;
}
.roycss-glass-liquid span {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
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
  background: #e0e5ec;
  border-radius: 16px;
  box-shadow: 8px 8px 16px #b8bcc2, -8px -8px 16px #ffffff;
}
.roycss-glass-neumorphism span {
  color: #475569;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.8);
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
  background: #e0e5ec;
  border-radius: 16px;
  box-shadow: inset 6px 6px 12px #b8bcc2, inset -6px -6px 12px #ffffff;
}
.roycss-glass-neumorphism-inset span {
  color: #64748b;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.7);
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
  background: linear-gradient(145deg, #fef3f8, #fbcfe8);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    8px 8px 16px rgba(190, 24, 93, 0.18),
    -4px -4px 12px rgba(255, 255, 255, 0.9),
    inset 2px 2px 4px rgba(255, 255, 255, 0.7),
    inset -2px -2px 6px rgba(190, 24, 93, 0.12);
}
.roycss-glass-claymorphism span {
  color: #9d174d;
  font-weight: 600;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.6);
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
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.roycss-glass-transparent-blur span {
  color: rgba(255, 255, 255, 0.85);
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
  background: rgba(20, 20, 35, 0.55);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.roycss-glass-frosted-dark span {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
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
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.28), rgba(236, 72, 153, 0.28));
  backdrop-filter: blur(16px) saturate(220%) brightness(1.1);
  -webkit-backdrop-filter: blur(16px) saturate(220%) brightness(1.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.roycss-glass-vibrant span {
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(126, 34, 110, 0.6);
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  animation: roy-glass-border-pulse 3s ease-in-out infinite alternate;
}
.roycss-glass-border-glow span {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 0 8px rgba(0, 255, 200, 0.6);
}
@keyframes roy-glass-border-pulse {
  0%   { box-shadow: 0 0 0 1px rgba(0, 255, 200, 0.4), 0 0 16px rgba(0, 255, 200, 0.35), 0 8px 32px rgba(0, 0, 0, 0.12); }
  100% { box-shadow: 0 0 0 1px rgba(0, 180, 255, 0.6), 0 0 30px rgba(0, 180, 255, 0.6), 0 8px 32px rgba(0, 0, 0, 0.12); }
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
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
  color: rgba(255, 255, 255, 0.9);
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.roycss-glass-reflection::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -60%;
  width: 35%;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  transform: skewX(-20deg) rotate(8deg);
  animation: roy-glass-reflection-sweep 4s ease-in-out infinite;
  pointer-events: none;
}
.roycss-glass-reflection span {
  position: relative;
  z-index: 1;
  color: rgba(255, 255, 255, 0.95);
}
@keyframes roy-glass-reflection-sweep {
  0%, 100% { left: -60%; }
  50%      { left: 130%; }
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
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}
.roycss-particles-floating-dots span {
  position: absolute;
  bottom: -12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, #60a5fa 0%, #3b82f6 100%);
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.8);
  color: transparent;
  font-size: 0;
  animation: roy-particle-float-up 4s linear infinite;
}
.roycss-particles-floating-dots span:nth-child(1) { left: 8%;  animation-delay: 0s;   width: 10px; height: 10px; }
.roycss-particles-floating-dots span:nth-child(2) { left: 20%; animation-delay: 0.5s; width: 6px;  height: 6px;  }
.roycss-particles-floating-dots span:nth-child(3) { left: 32%; animation-delay: 1s;   width: 8px;  height: 8px;  }
.roycss-particles-floating-dots span:nth-child(4) { left: 44%; animation-delay: 1.5s; width: 5px;  height: 5px;  }
.roycss-particles-floating-dots span:nth-child(5) { left: 56%; animation-delay: 2s;   width: 9px;  height: 9px;  }
.roycss-particles-floating-dots span:nth-child(6) { left: 68%; animation-delay: 2.5s; width: 7px;  height: 7px;  }
.roycss-particles-floating-dots span:nth-child(7) { left: 80%; animation-delay: 3s;   width: 6px;  height: 6px;  }
.roycss-particles-floating-dots span:nth-child(8) { left: 92%; animation-delay: 3.5s; width: 8px;  height: 8px;  }
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
  background: radial-gradient(circle at center, #1a1a3e 0%, #0f0f1e 100%);
}
.roycss-particles-confetti-burst span {
  --tx: 0px;
  --ty: 0px;
  --rot: 0deg;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 10px;
  border-radius: 2px;
  color: transparent;
  font-size: 0;
  animation: roy-particle-confetti-burst 1.8s ease-out infinite;
}
.roycss-particles-confetti-burst span:nth-child(1)  { --tx: 55px;  --ty: -50px; --rot: 200deg; background: #ef4444; }
.roycss-particles-confetti-burst span:nth-child(2)  { --tx: -55px; --ty: -45px; --rot: 180deg; background: #f59e0b; }
.roycss-particles-confetti-burst span:nth-child(3)  { --tx: 60px;  --ty: 30px;  --rot: 360deg; background: #10b981; }
.roycss-particles-confetti-burst span:nth-child(4)  { --tx: -60px; --ty: 35px;  --rot: 270deg; background: #3b82f6; }
.roycss-particles-confetti-burst span:nth-child(5)  { --tx: 0px;   --ty: -60px; --rot: 180deg; background: #ec4899; }
.roycss-particles-confetti-burst span:nth-child(6)  { --tx: 40px;  --ty: -20px; --rot: 220deg; background: #8b5cf6; }
.roycss-particles-confetti-burst span:nth-child(7)  { --tx: -45px; --ty: -15px; --rot: 320deg; background: #f97316; }
.roycss-particles-confetti-burst span:nth-child(8)  { --tx: 30px;  --ty: 55px;  --rot: 250deg; background: #06b6d4; }
.roycss-particles-confetti-burst span:nth-child(9)  { --tx: -35px; --ty: 50px;  --rot: 300deg; background: #84cc16; }
.roycss-particles-confetti-burst span:nth-child(10) { --tx: 0px;   --ty: 60px;  --rot: 190deg; background: #fbbf24; }
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
  background: linear-gradient(180deg, #1e2a4a 0%, #2c3e6b 50%, #1a2540 100%);
}
.roycss-particles-snow-fall span {
  position: absolute;
  top: -12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
  color: transparent;
  font-size: 0;
  animation: roy-particle-snow-fall 5s linear infinite;
}
.roycss-particles-snow-fall span:nth-child(1) { left: 6%;  animation-delay: 0s;   width: 10px; height: 10px; }
.roycss-particles-snow-fall span:nth-child(2) { left: 20%; animation-delay: 0.8s; width: 6px;  height: 6px;  }
.roycss-particles-snow-fall span:nth-child(3) { left: 33%; animation-delay: 1.6s; width: 8px;  height: 8px;  }
.roycss-particles-snow-fall span:nth-child(4) { left: 46%; animation-delay: 2.4s; width: 5px;  height: 5px;  }
.roycss-particles-snow-fall span:nth-child(5) { left: 58%; animation-delay: 3.2s; width: 9px;  height: 9px;  }
.roycss-particles-snow-fall span:nth-child(6) { left: 70%; animation-delay: 4s;   width: 7px;  height: 7px;  }
.roycss-particles-snow-fall span:nth-child(7) { left: 82%; animation-delay: 4.5s; width: 6px;  height: 6px;  }
.roycss-particles-snow-fall span:nth-child(8) { left: 94%; animation-delay: 1.2s; width: 8px;  height: 8px;  }
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
  background: linear-gradient(180deg, #1a2533 0%, #243447 50%, #161e2a 100%);
}
.roycss-particles-rain span {
  position: absolute;
  top: -30px;
  width: 2px;
  height: 18px;
  background: linear-gradient(180deg, transparent, rgba(174, 194, 224, 0.85));
  border-radius: 2px;
  color: transparent;
  font-size: 0;
  animation: roy-particle-rain-fall 0.9s linear infinite;
}
.roycss-particles-rain span:nth-child(1) { left: 10%; animation-delay: 0s;   height: 22px; }
.roycss-particles-rain span:nth-child(2) { left: 26%; animation-delay: 0.15s; height: 16px; }
.roycss-particles-rain span:nth-child(3) { left: 42%; animation-delay: 0.3s;  height: 20px; }
.roycss-particles-rain span:nth-child(4) { left: 58%; animation-delay: 0.45s; height: 18px; }
.roycss-particles-rain span:nth-child(5) { left: 74%; animation-delay: 0.6s;  height: 24px; }
.roycss-particles-rain span:nth-child(6) { left: 90%; animation-delay: 0.75s; height: 16px; }
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
  background: linear-gradient(180deg, #0a1f0a 0%, #14281a 50%, #0a1f12 100%);
}
.roycss-particles-fireflies span {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #d4ff7f;
  box-shadow: 0 0 8px rgba(212, 255, 127, 0.9), 0 0 16px rgba(212, 255, 127, 0.5);
  color: transparent;
  font-size: 0;
  animation: roy-particle-firefly-glow 6s ease-in-out infinite;
}
.roycss-particles-fireflies span:nth-child(1) { top: 30%; left: 12%; animation-delay: 0s;   }
.roycss-particles-fireflies span:nth-child(2) { top: 60%; left: 28%; animation-delay: 1s;   }
.roycss-particles-fireflies span:nth-child(3) { top: 20%; left: 48%; animation-delay: 2s;   }
.roycss-particles-fireflies span:nth-child(4) { top: 70%; left: 62%; animation-delay: 3s;   }
.roycss-particles-fireflies span:nth-child(5) { top: 40%; left: 78%; animation-delay: 4s;   }
.roycss-particles-fireflies span:nth-child(6) { top: 55%; left: 90%; animation-delay: 1.5s; }
@keyframes roy-particle-firefly-glow {
  0%, 100% { transform: translate(0, 0); opacity: 0.2; box-shadow: 0 0 4px rgba(212, 255, 127, 0.4); }
  25%      { transform: translate(15px, -10px); opacity: 1; box-shadow: 0 0 12px rgba(212, 255, 127, 1); }
  50%      { transform: translate(-8px, -20px); opacity: 0.5; box-shadow: 0 0 6px rgba(212, 255, 127, 0.6); }
  75%      { transform: translate(12px, -30px); opacity: 1; box-shadow: 0 0 14px rgba(212, 255, 127, 1); }
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
  background: linear-gradient(180deg, #0e7490 0%, #06b6d4 50%, #0891b2 100%);
}
.roycss-particles-bubbles span {
  position: absolute;
  bottom: -20px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.15) 60%, transparent);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: transparent;
  font-size: 0;
  animation: roy-particle-bubble-rise 5s ease-in infinite;
}
.roycss-particles-bubbles span:nth-child(1) { left: 10%; animation-delay: 0s;   width: 18px; height: 18px; }
.roycss-particles-bubbles span:nth-child(2) { left: 25%; animation-delay: 0.8s; width: 12px; height: 12px; }
.roycss-particles-bubbles span:nth-child(3) { left: 40%; animation-delay: 1.6s; width: 20px; height: 20px; }
.roycss-particles-bubbles span:nth-child(4) { left: 58%; animation-delay: 2.4s; width: 14px; height: 14px; }
.roycss-particles-bubbles span:nth-child(5) { left: 75%; animation-delay: 3.2s; width: 16px; height: 16px; }
.roycss-particles-bubbles span:nth-child(6) { left: 90%; animation-delay: 4s;   width: 10px; height: 10px; }
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
  background: linear-gradient(180deg, #1a0a00 0%, #2d1100 50%, #1a0a00 100%);
}
.roycss-particles-sparks span {
  --tx: 10px;
  position: absolute;
  bottom: 10px;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 6px #f59e0b, 0 0 12px rgba(245, 158, 11, 0.6);
  color: transparent;
  font-size: 0;
  animation: roy-particle-spark-fly 1.6s ease-out infinite;
}
.roycss-particles-sparks span:nth-child(1) { --tx: -30px; margin-left: -20px; animation-delay: 0s;   }
.roycss-particles-sparks span:nth-child(2) { --tx: -15px; margin-left: -8px;  animation-delay: 0.2s; }
.roycss-particles-sparks span:nth-child(3) { --tx: 0px;   margin-left: 0;     animation-delay: 0.4s; background: #f97316; }
.roycss-particles-sparks span:nth-child(4) { --tx: 15px;  margin-left: 8px;   animation-delay: 0.6s; }
.roycss-particles-sparks span:nth-child(5) { --tx: 30px;  margin-left: 20px;  animation-delay: 0.8s; background: #ef4444; }
.roycss-particles-sparks span:nth-child(6) { --tx: -22px; margin-left: -14px; animation-delay: 1s;   }
.roycss-particles-sparks span:nth-child(7) { --tx: 22px;  margin-left: 14px;  animation-delay: 1.2s; }
.roycss-particles-sparks span:nth-child(8) { --tx: 8px;   margin-left: 4px;   animation-delay: 1.4s; background: #f97316; }
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
  background: linear-gradient(135deg, #4a3520 0%, #6b4e2e 40%, #8b6b3a 70%, #5a3f25 100%);
}
.roycss-particles-dust span {
  --tx: 30px;
  --ty: -30px;
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 240, 200, 0.7);
  box-shadow: 0 0 3px rgba(255, 240, 200, 0.4);
  color: transparent;
  font-size: 0;
  animation: roy-particle-dust-drift 8s ease-in-out infinite;
}
.roycss-particles-dust span:nth-child(1) { top: 20%; left: 10%; --tx: 40px;  --ty: -30px; animation-delay: 0s;   width: 5px; height: 5px; }
.roycss-particles-dust span:nth-child(2) { top: 50%; left: 25%; --tx: -25px; --ty: -40px; animation-delay: 1s;   width: 3px; height: 3px; }
.roycss-particles-dust span:nth-child(3) { top: 30%; left: 40%; --tx: 35px;  --ty: -20px; animation-delay: 2s;   width: 4px; height: 4px; }
.roycss-particles-dust span:nth-child(4) { top: 70%; left: 55%; --tx: -30px; --ty: -35px; animation-delay: 3s;   width: 6px; height: 6px; }
.roycss-particles-dust span:nth-child(5) { top: 40%; left: 70%; --tx: 20px;  --ty: -45px; animation-delay: 4s;   width: 3px; height: 3px; }
.roycss-particles-dust span:nth-child(6) { top: 60%; left: 85%; --tx: -40px; --ty: -25px; animation-delay: 5s;   width: 5px; height: 5px; }
.roycss-particles-dust span:nth-child(7) { top: 15%; left: 60%; --tx: 30px;  --ty: -50px; animation-delay: 2.5s; width: 4px; height: 4px; }
.roycss-particles-dust span:nth-child(8) { top: 80%; left: 30%; --tx: -20px; --ty: -40px; animation-delay: 6s;   width: 3px; height: 3px; }
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
  background: radial-gradient(ellipse at top, #1a1a4e 0%, #0a0a23 60%, #050511 100%);
}
.roycss-particles-stars-twinkle span {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #ffffff;
  color: transparent;
  font-size: 0;
  animation: roy-particle-star-twinkle 3s ease-in-out infinite;
}
.roycss-particles-stars-twinkle span:nth-child(1)  { top: 12%; left: 8%;  animation-delay: 0s;   width: 4px; height: 4px; }
.roycss-particles-stars-twinkle span:nth-child(2)  { top: 25%; left: 22%; animation-delay: 0.3s; width: 2px; height: 2px; }
.roycss-particles-stars-twinkle span:nth-child(3)  { top: 40%; left: 15%; animation-delay: 0.6s; width: 5px; height: 5px; }
.roycss-particles-stars-twinkle span:nth-child(4)  { top: 18%; left: 38%; animation-delay: 0.9s; width: 3px; height: 3px; }
.roycss-particles-stars-twinkle span:nth-child(5)  { top: 55%; left: 48%; animation-delay: 1.2s; width: 4px; height: 4px; }
.roycss-particles-stars-twinkle span:nth-child(6)  { top: 30%; left: 60%; animation-delay: 1.5s; width: 2px; height: 2px; }
.roycss-particles-stars-twinkle span:nth-child(7)  { top: 65%; left: 70%; animation-delay: 1.8s; width: 5px; height: 5px; }
.roycss-particles-stars-twinkle span:nth-child(8)  { top: 22%; left: 78%; animation-delay: 2.1s; width: 3px; height: 3px; }
.roycss-particles-stars-twinkle span:nth-child(9)  { top: 48%; left: 88%; animation-delay: 2.4s; width: 4px; height: 4px; }
.roycss-particles-stars-twinkle span:nth-child(10) { top: 72%; left: 32%; animation-delay: 2.7s; width: 2px; height: 2px; }
@keyframes roy-particle-star-twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.6); box-shadow: 0 0 2px rgba(255, 255, 255, 0.3); }
  50%      { opacity: 1; transform: scale(1.3); box-shadow: 0 0 8px rgba(255, 255, 255, 0.9); }
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
  background: linear-gradient(180deg, #2d0a00 0%, #4a1500 40%, #1a0500 100%);
}
.roycss-particles-fire span {
  position: absolute;
  bottom: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, #fde047 0%, #f97316 50%, #dc2626 100%);
  box-shadow: 0 0 10px #f97316, 0 0 20px rgba(249, 115, 22, 0.6);
  color: transparent;
  font-size: 0;
  animation: roy-particle-flame-flicker 2s ease-out infinite;
}
.roycss-particles-fire span:nth-child(1) { left: 25%; animation-delay: 0s;   width: 10px; height: 10px; }
.roycss-particles-fire span:nth-child(2) { left: 40%; animation-delay: 0.4s; width: 7px;  height: 7px;  }
.roycss-particles-fire span:nth-child(3) { left: 55%; animation-delay: 0.8s; width: 9px;  height: 9px;  }
.roycss-particles-fire span:nth-child(4) { left: 68%; animation-delay: 1.2s; width: 6px;  height: 6px;  }
.roycss-particles-fire span:nth-child(5) { left: 82%; animation-delay: 1.6s; width: 8px;  height: 8px;  }
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
  background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 50%, #0f0f0f 100%);
}
.roycss-particles-smoke span {
  --tx: 10px;
  position: absolute;
  bottom: -10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200, 200, 200, 0.4) 0%, rgba(150, 150, 150, 0.15) 60%, transparent 100%);
  filter: blur(4px);
  color: transparent;
  font-size: 0;
  animation: roy-particle-smoke-rise 5s ease-out infinite;
}
.roycss-particles-smoke span:nth-child(1) { left: 20%; --tx: 12px;  animation-delay: 0s;   }
.roycss-particles-smoke span:nth-child(2) { left: 45%; --tx: -15px; animation-delay: 1.2s; width: 28px; height: 28px; }
.roycss-particles-smoke span:nth-child(3) { left: 65%; --tx: 10px;  animation-delay: 2.4s; }
.roycss-particles-smoke span:nth-child(4) { left: 80%; --tx: -8px;  animation-delay: 3.6s; width: 20px; height: 20px; }
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
  background: radial-gradient(circle at center, #1e1b4b 0%, #0f0a2e 60%, #050314 100%);
}
.roycss-particles-orbiting::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, #fbbf24 0%, #f59e0b 50%, transparent 80%);
  box-shadow: 0 0 20px #f59e0b, 0 0 40px rgba(245, 158, 11, 0.5);
}
.roycss-particles-orbiting span {
  --r: 30px;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin: -4px;
  border-radius: 50%;
  color: transparent;
  font-size: 0;
  animation: roy-particle-orbit 4s linear infinite;
}
.roycss-particles-orbiting span:nth-child(1) { --r: 24px; background: #60a5fa; box-shadow: 0 0 6px #60a5fa; animation-duration: 3s; }
.roycss-particles-orbiting span:nth-child(2) { --r: 38px; background: #34d399; box-shadow: 0 0 6px #34d399; animation-duration: 4s; animation-direction: reverse; }
.roycss-particles-orbiting span:nth-child(3) { --r: 52px; background: #f472b6; box-shadow: 0 0 6px #f472b6; animation-duration: 5s; }
.roycss-particles-orbiting span:nth-child(4) { --r: 66px; background: #a78bfa; box-shadow: 0 0 6px #a78bfa; animation-duration: 6s; animation-direction: reverse; width: 6px; height: 6px; margin: -3px; }
.roycss-particles-orbiting span:nth-child(5) { --r: 80px; background: #facc15; box-shadow: 0 0 6px #facc15; animation-duration: 7s; width: 6px; height: 6px; margin: -3px; }
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
  width: 56px;
  height: 30px;
  background: #cbd5e1;
  border-radius: 15px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
  animation: roy-micro-toggle-bg 3s ease-in-out infinite;
}
.roycss-micro-toggle-switch > span { display: none; }
.roycss-micro-toggle-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  animation: roy-micro-toggle-slide 3s ease-in-out infinite;
}
@keyframes roy-micro-toggle-bg {
  0%, 45%   { background: #cbd5e1; }
  55%, 100% { background: #10b981; }
}
@keyframes roy-micro-toggle-slide {
  0%, 45%   { left: 3px; }
  55%, 100% { left: 29px; }
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
  width: 38px;
  height: 38px;
  background: #ffffff;
  border: 2px solid #10b981;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}
.roycss-micro-checkbox-check > span { display: none; }
.roycss-micro-checkbox-check::after {
  content: "";
  width: 16px;
  height: 8px;
  border-left: 3px solid #10b981;
  border-bottom: 3px solid #10b981;
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
  width: 38px;
  height: 38px;
  background: #ffffff;
  border: 2px solid #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
}
.roycss-micro-radio-select > span { display: none; }
.roycss-micro-radio-select::after {
  content: "";
  width: 16px;
  height: 16px;
  background: #10b981;
  border-radius: 50%;
  animation: roy-micro-radio-pulse 2s ease-in-out infinite;
}
@keyframes roy-micro-radio-pulse {
  0%, 100% { transform: scale(0.4); opacity: 0.5; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  50%      { transform: scale(1); opacity: 1; box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
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
  width: 140px;
  height: 90px;
  background: #ffffff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.roycss-micro-accordion-expand > span { display: none; }
.roycss-micro-accordion-expand::before {
  content: "Section Title";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: #6366f1;
  color: #ffffff;
  font: 600 11px/1 system-ui, sans-serif;
  z-index: 1;
}
.roycss-micro-accordion-expand::after {
  content: "Expanded content reveals here with a smooth height animation.";
  position: absolute;
  top: 30px;
  left: 0;
  right: 0;
  padding: 0 12px;
  background: #eef2ff;
  color: #475569;
  font: 9px/1.4 system-ui, sans-serif;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  animation: roy-micro-accordion-expand 3s ease-in-out infinite;
}
@keyframes roy-micro-accordion-expand {
  0%, 20%   { max-height: 0; padding-top: 0; padding-bottom: 0; opacity: 0; }
  40%, 75%  { max-height: 60px; padding-top: 8px; padding-bottom: 8px; opacity: 1; }
  95%, 100% { max-height: 0; padding-top: 0; padding-bottom: 0; opacity: 0; }
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
  width: 130px;
  height: 70px;
}
.roycss-micro-tooltip-appear > span { display: none; }
.roycss-micro-tooltip-appear::before {
  content: "Hover me";
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  background: #3b82f6;
  color: #ffffff;
  font: 600 11px/1 system-ui, sans-serif;
  border-radius: 6px;
}
.roycss-micro-tooltip-appear::after {
  content: "I'm a tooltip!";
  position: absolute;
  top: 4px;
  left: 50%;
  padding: 5px 10px;
  background: #1e293b;
  color: #ffffff;
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
  width: 150px;
  height: 80px;
  overflow: hidden;
  border-radius: 8px;
}
.roycss-micro-toast-slide > span { display: none; }
.roycss-micro-toast-slide::before {
  content: "✓  Success! Action completed.";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 10px 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  font: 600 10px/1.3 system-ui, sans-serif;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
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
  width: 120px;
  height: 90px;
}
.roycss-micro-dropdown-reveal > span { display: none; }
.roycss-micro-dropdown-reveal::before {
  content: "Menu";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 7px 12px;
  background: #6366f1;
  color: #ffffff;
  font: 600 11px/1 system-ui, sans-serif;
  border-radius: 6px;
  text-align: center;
  z-index: 1;
}
.roycss-micro-dropdown-reveal::after {
  content: "Edit\\ADelete\\AShare";
  white-space: pre;
  position: absolute;
  top: 32px;
  left: 0;
  right: 0;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font: 10px/1.7 system-ui, sans-serif;
  color: #475569;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
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
  width: 150px;
  height: 90px;
  overflow: hidden;
  border-radius: 8px;
  background: #f1f5f9;
}
.roycss-micro-modal-scale > span { display: none; }
.roycss-micro-modal-scale::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  opacity: 0;
  animation: roy-micro-modal-backdrop 3s ease-in-out infinite;
}
.roycss-micro-modal-scale::after {
  content: "Modal Dialog";
  position: absolute;
  top: 50%;
  left: 50%;
  padding: 14px 22px;
  background: #ffffff;
  color: #1e293b;
  font: 600 12px/1.2 system-ui, sans-serif;
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
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
  width: 150px;
  height: 90px;
}
.roycss-micro-fab-expand > span { display: none; }
.roycss-micro-fab-expand::before {
  content: "+";
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #ec4899, #be185d);
  color: #ffffff;
  font: 300 24px/1 system-ui, sans-serif;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(236, 72, 153, 0.4);
  animation: roy-micro-fab-rotate 3s ease-in-out infinite;
  z-index: 2;
}
.roycss-micro-fab-expand::after {
  content: "Share";
  position: absolute;
  bottom: 16px;
  right: 54px;
  padding: 5px 12px;
  background: #8b5cf6;
  color: #ffffff;
  font: 600 10px/1 system-ui, sans-serif;
  border-radius: 12px;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(20px) scale(0.5);
  transform-origin: right center;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
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
  width: 140px;
  height: 14px;
  background: #e2e8f0;
  border-radius: 7px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}
.roycss-micro-progress-fill > span { display: none; }
.roycss-micro-progress-fill::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #10b981, #34d399, #10b981);
  background-size: 200% 100%;
  border-radius: 7px;
  animation: roy-micro-progress-fill 2.5s ease-in-out infinite;
}
@keyframes roy-micro-progress-fill {
  0%   { width: 0; background-position: 200% 0; }
  50%  { width: 60%; background-position: 0 0; }
  100% { width: 100%; background-position: -200% 0; }
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
  width: 150px;
  height: 50px;
}
.roycss-micro-tab-indicator > span { display: none; }
.roycss-micro-tab-indicator::before {
  content: "Tab 1      Tab 2      Tab 3";
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  font: 600 10px/1 system-ui, sans-serif;
  color: #94a3b8;
  letter-spacing: 1px;
  text-align: left;
  padding-left: 12px;
}
.roycss-micro-tab-indicator::after {
  content: "";
  position: absolute;
  bottom: 8px;
  left: 12px;
  width: 34px;
  height: 3px;
  background: #6366f1;
  border-radius: 2px;
  animation: roy-micro-tab-slide 3.6s ease-in-out infinite;
}
@keyframes roy-micro-tab-slide {
  0%, 15%   { left: 12px; }
  35%, 50%  { left: 64px; }
  70%, 85%  { left: 116px; }
  100%      { left: 12px; }
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
  width: 64px;
  height: 64px;
  background: #f1f5f9;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.roycss-micro-badge-bounce > span { display: none; }
.roycss-micro-badge-bounce::before {
  content: "\\2709";
  font-size: 28px;
  color: #64748b;
}
.roycss-micro-badge-bounce::after {
  content: "3";
  position: absolute;
  top: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  background: #ef4444;
  color: #ffffff;
  font: 700 11px/1 system-ui, sans-serif;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
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
