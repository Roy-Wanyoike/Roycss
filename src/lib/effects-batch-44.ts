import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 44 — CSS Haptics & Tactile Feedback (20 effects)
 * Pure-CSS simulations of tactile/physical feedback: pressure, surface tension,
 * rubber, weight, textures, spring-loaded motion, vibration, friction, velvet,
 * glass taps, and magnetic pull. Every motion is a CSS keyframe illusion.
 * All classes are prefixed `roycss-haptics-` and keyframes `roy-haptics-`.
 * Each effect honors prefers-reduced-motion.
 */
export const effectsBatch44 = [
  // ═══════════════════════════════════════════════════════════════
  // HAPTICS & TACTILE FEEDBACK (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. haptics-pressure-press
  {
    id: "haptics-pressure-press",
    name: "Pressure Press",
    category: "haptics",
    description: "Element deforms with deepening inset shadow and scale as if physically pressed",
    tags: ["haptics", "press", "tactile", "physical", "deform"],
    previewType: "box",
    cssCode: `/* Haptics: Pressure Press */
.roycss-haptics-pressure-press {
  background: linear-gradient(145deg, oklch(0.85 0.05 220), oklch(0.75 0.06 220));
  border-radius: 14px;
  box-shadow: 0 10px 24px oklch(0 0 0 / 0.18), inset 0 0 0 oklch(0 0 0 / 0);
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease;
  cursor: pointer;
}
.roycss-haptics-pressure-press:hover {
  transform: scale(0.94);
  box-shadow: 0 4px 8px oklch(0 0 0 / 0.12), inset 0 6px 14px oklch(0 0 0 / 0.28);
}
.roycss-haptics-pressure-press:active {
  transform: scale(0.9);
  box-shadow: 0 1px 2px oklch(0 0 0 / 0.1), inset 0 10px 22px oklch(0 0 0 / 0.42);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-pressure-press,
  .roycss-haptics-pressure-press:hover,
  .roycss-haptics-pressure-press:active {
    transform: none;
    box-shadow: 0 10px 24px oklch(0 0 0 / 0.18);
  }
}`,
  },

  // 2. haptics-surface-tension
  {
    id: "haptics-surface-tension",
    name: "Surface Tension",
    category: "haptics",
    description: "Liquid-like ripple with surface-tension behavior emanates on hover",
    tags: ["haptics", "surface-tension", "ripple", "liquid", "hover"],
    previewType: "box",
    cssCode: `/* Haptics: Surface Tension */
.roycss-haptics-surface-tension {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.78 0.12 200), oklch(0.6 0.18 220));
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
}
.roycss-haptics-surface-tension::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.95 0.05 200 / 0.65), transparent 60%);
  transform: scale(0);
  opacity: 0;
  transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms ease;
}
.roycss-haptics-surface-tension:hover::before {
  transform: scale(2.4);
  opacity: 1;
  animation: roy-haptics-surface-tension 1.6s ease-out infinite;
}
@keyframes roy-haptics-surface-tension {
  0%   { transform: scale(0.4); opacity: 0.85; border-radius: 50%; }
  60%  { border-radius: 40% 60% 50% 50% / 50% 50% 40% 60%; }
  100% { transform: scale(2.6); opacity: 0; border-radius: 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-surface-tension:hover::before {
    animation: none;
    transform: scale(1.6);
    opacity: 0.5;
  }
}`,
  },

  // 3. haptics-rubber-stretch
  {
    id: "haptics-rubber-stretch",
    name: "Rubber Stretch",
    category: "haptics",
    description: "Element stretches like rubber when hovered and snaps back on release",
    tags: ["haptics", "rubber", "stretch", "elastic", "snap"],
    previewType: "box",
    cssCode: `/* Haptics: Rubber Stretch */
.roycss-haptics-rubber-stretch {
  background: linear-gradient(135deg, oklch(0.82 0.13 12), oklch(0.72 0.16 28));
  border-radius: 22px;
  transition: transform 380ms cubic-bezier(0.68, -0.6, 0.32, 1.6),
              border-radius 380ms cubic-bezier(0.68, -0.6, 0.32, 1.6);
  cursor: grab;
}
.roycss-haptics-rubber-stretch:hover {
  transform: scaleX(1.18) scaleY(0.86);
  border-radius: 36% 64% 36% 64% / 50% 50% 50% 50%;
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
              border-radius 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
.roycss-haptics-rubber-stretch:active {
  transform: scaleX(1.32) scaleY(0.7);
  border-radius: 50% 50% 30% 70% / 60% 40% 60% 40%;
  transition: transform 120ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-rubber-stretch,
  .roycss-haptics-rubber-stretch:hover,
  .roycss-haptics-rubber-stretch:active {
    transform: none;
    border-radius: 22px;
  }
}`,
  },

  // 4. haptics-weight-settle
  {
    id: "haptics-weight-settle",
    name: "Weight Settle",
    category: "haptics",
    description: "Heavy element settles with bounce and squash on load, like a heavy weight",
    tags: ["haptics", "weight", "settle", "bounce", "squash", "load"],
    previewType: "box",
    cssCode: `/* Haptics: Weight Settle */
.roycss-haptics-weight-settle {
  background: linear-gradient(160deg, oklch(0.42 0.02 240), oklch(0.28 0.03 240));
  border-radius: 12px;
  animation: roy-haptics-weight-settle 1.4s cubic-bezier(0.5, 1.4, 0.5, 1) both;
}
@keyframes roy-haptics-weight-settle {
  0%   { transform: translateY(-340px) scaleY(1.1); opacity: 0; }
  45%  { transform: translateY(0) scaleY(0.7); opacity: 1; }
  55%  { transform: translateY(-44px) scaleY(1.08); }
  72%  { transform: translateY(0) scaleY(0.9); }
  85%  { transform: translateY(-12px) scaleY(1.02); }
  100% { transform: translateY(0) scaleY(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-weight-settle { animation: none; transform: none; }
}`,
  },

  // 5. haptics-light-float
  {
    id: "haptics-light-float",
    name: "Light Float",
    category: "haptics",
    description: "Element gently floats up and down as if resting on water",
    tags: ["haptics", "float", "buoyancy", "water", "ambient"],
    previewType: "box",
    cssCode: `/* Haptics: Light Float */
.roycss-haptics-light-float {
  background: radial-gradient(circle at 30% 30%, oklch(0.88 0.1 200), oklch(0.7 0.13 220));
  border-radius: 50%;
  box-shadow: 0 14px 32px oklch(0.4 0.15 220 / 0.3);
  animation: roy-haptics-light-float 4.5s ease-in-out infinite;
}
@keyframes roy-haptics-light-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  30%      { transform: translateY(-12px) rotate(-2deg); }
  65%      { transform: translateY(8px) rotate(1.5deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-light-float { animation: none; }
}`,
  },

  // 6. haptics-texture-concrete
  {
    id: "haptics-texture-concrete",
    name: "Concrete Texture",
    category: "haptics",
    description: "Directional grain and noise that shifts on hover, evoking raw concrete",
    tags: ["haptics", "texture", "concrete", "grain", "noise"],
    previewType: "box",
    cssCode: `/* Haptics: Concrete Texture */
.roycss-haptics-texture-concrete {
  background:
    repeating-linear-gradient(45deg, oklch(0.72 0.005 240 / 0.6) 0 2px, transparent 2px 5px),
    repeating-linear-gradient(-45deg, oklch(0.6 0.01 240 / 0.5) 0 1.5px, transparent 1.5px 4px),
    linear-gradient(145deg, oklch(0.74 0.005 240), oklch(0.62 0.008 240));
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.06), 0 8px 20px oklch(0 0 0 / 0.12);
  position: relative;
  overflow: hidden;
  transition: background-position 700ms ease;
}
.roycss-haptics-texture-concrete::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 22% 18%, oklch(0.55 0.01 240 / 0.5) 0 1px, transparent 1px),
    radial-gradient(circle at 70% 60%, oklch(0.55 0.01 240 / 0.45) 0 1.5px, transparent 1.5px),
    radial-gradient(circle at 40% 88%, oklch(0.55 0.01 240 / 0.4) 0 1px, transparent 1px);
  background-size: 22px 22px, 32px 32px, 26px 26px;
  background-position: 0 0, 0 0, 0 0;
  transition: background-position 700ms ease;
  pointer-events: none;
}
.roycss-haptics-texture-concrete:hover::before {
  background-position: 18px -10px, -14px 12px, 8px -8px;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-texture-concrete::before { transition: none; }
}`,
  },

  // 7. haptics-texture-metal
  {
    id: "haptics-texture-metal",
    name: "Brushed Metal",
    category: "haptics",
    description: "Brushed metal surface with a sweeping light reflection on hover",
    tags: ["haptics", "texture", "metal", "brushed", "reflection"],
    previewType: "box",
    cssCode: `/* Haptics: Brushed Metal */
.roycss-haptics-texture-metal {
  position: relative;
  background:
    repeating-linear-gradient(90deg, oklch(0.7 0.005 250 / 0.18) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, oklch(0.78 0.005 250), oklch(0.58 0.008 250));
  border-radius: 10px;
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.4), inset 0 -2px 6px oklch(0 0 0 / 0.2), 0 8px 20px oklch(0 0 0 / 0.18);
  overflow: hidden;
}
.roycss-haptics-texture-metal::after {
  content: "";
  position: absolute;
  top: 0; left: -60%;
  width: 40%; height: 100%;
  background: linear-gradient(110deg, transparent, oklch(1 0 0 / 0.6) 50%, transparent);
  transform: skewX(-20deg);
  transition: left 700ms ease;
}
.roycss-haptics-texture-metal:hover::after {
  left: 120%;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-texture-metal::after { transition: none; left: -60%; }
}`,
  },

  // 8. haptics-texture-fabric
  {
    id: "haptics-texture-fabric",
    name: "Fabric Weave",
    category: "haptics",
    description: "Fabric weave texture with subtle horizontal drift on hover",
    tags: ["haptics", "texture", "fabric", "weave", "cloth"],
    previewType: "box",
    cssCode: `/* Haptics: Fabric Weave */
.roycss-haptics-texture-fabric {
  background:
    repeating-linear-gradient(0deg, oklch(0.55 0.1 12 / 0.55) 0 2px, oklch(0.7 0.12 12 / 0.4) 2px 4px),
    repeating-linear-gradient(90deg, oklch(0.55 0.1 12 / 0.55) 0 2px, oklch(0.7 0.12 12 / 0.4) 2px 4px),
    linear-gradient(135deg, oklch(0.68 0.12 12), oklch(0.58 0.1 28));
  border-radius: 8px;
  background-size: 8px 8px;
  transition: background-position 1.2s ease;
  background-position: 0 0;
}
.roycss-haptics-texture-fabric:hover {
  background-position: 8px 4px, 4px 8px, 0 0;
  animation: roy-haptics-fabric-shimmer 3s linear infinite;
}
@keyframes roy-haptics-fabric-shimmer {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.08); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-texture-fabric:hover { animation: none; transition: none; }
}`,
  },

  // 9. haptics-texture-leather
  {
    id: "haptics-texture-leather",
    name: "Leather Grain",
    category: "haptics",
    description: "Leather grain texture with pebbled surface and warm tone",
    tags: ["haptics", "texture", "leather", "grain", "pebbled"],
    previewType: "box",
    cssCode: `/* Haptics: Leather Grain */
.roycss-haptics-texture-leather {
  background:
    radial-gradient(circle at 25% 25%, oklch(0.45 0.05 35) 0 2px, transparent 2.5px),
    radial-gradient(circle at 75% 35%, oklch(0.4 0.05 35) 0 1.5px, transparent 2px),
    radial-gradient(circle at 45% 75%, oklch(0.42 0.05 35) 0 2px, transparent 2.5px),
    radial-gradient(circle at 85% 80%, oklch(0.38 0.06 35) 0 1.5px, transparent 2px),
    linear-gradient(135deg, oklch(0.5 0.06 30), oklch(0.36 0.06 35));
  background-size: 18px 18px, 22px 22px, 16px 16px, 20px 20px, 100% 100%;
  border-radius: 6px;
  box-shadow: inset 0 0 8px oklch(0 0 0 / 0.3), 0 6px 14px oklch(0 0 0 / 0.2);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-texture-leather { /* static texture — no animation to disable */ }
}`,
  },

  // 10. haptics-spring-loaded
  {
    id: "haptics-spring-loaded",
    name: "Spring Loaded",
    category: "haptics",
    description: "Element springs in from the side with oscillating overshoot",
    tags: ["haptics", "spring", "oscillate", "entrance", "load"],
    previewType: "box",
    cssCode: `/* Haptics: Spring Loaded */
.roycss-haptics-spring-loaded {
  background: linear-gradient(135deg, oklch(0.78 0.13 160), oklch(0.66 0.14 180));
  border-radius: 14px;
  animation: roy-haptics-spring-loaded 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes roy-haptics-spring-loaded {
  0%   { transform: translateX(-360px); opacity: 0; }
  55%  { transform: translateX(24px); opacity: 1; }
  68%  { transform: translateX(-14px); }
  80%  { transform: translateX(6px); }
  90%  { transform: translateX(-2px); }
  100% { transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-spring-loaded { animation: none; transform: none; }
}`,
  },

  // 11. haptics-elastic-recoil
  {
    id: "haptics-elastic-recoil",
    name: "Elastic Recoil",
    category: "haptics",
    description: "Element recoils back after being pushed, with elastic overshoot",
    tags: ["haptics", "elastic", "recoil", "push", "spring-back"],
    previewType: "box",
    cssCode: `/* Haptics: Elastic Recoil */
.roycss-haptics-elastic-recoil {
  background: linear-gradient(135deg, oklch(0.82 0.12 280), oklch(0.7 0.16 320));
  border-radius: 50%;
  cursor: pointer;
  transition: transform 200ms cubic-bezier(0.5, 0, 0.75, 0);
}
.roycss-haptics-elastic-recoil:hover {
  transform: translateX(40px) scale(0.9);
  transition: transform 180ms cubic-bezier(0.5, 0, 0.75, 0);
}
.roycss-haptics-elastic-recoil:active {
  animation: roy-haptics-elastic-recoil 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes roy-haptics-elastic-recoil {
  0%   { transform: translateX(40px) scale(0.9); }
  40%  { transform: translateX(-30px) scale(1.08); }
  70%  { transform: translateX(10px) scale(0.96); }
  100% { transform: translateX(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-elastic-recoil,
  .roycss-haptics-elastic-recoil:hover,
  .roycss-haptics-elastic-recoil:active { animation: none; transform: none; transition: none; }
}`,
  },

  // 12. haptics-bounce-impact
  {
    id: "haptics-bounce-impact",
    name: "Bounce Impact",
    category: "haptics",
    description: "Element bounces as if struck by an impact, with secondary decay",
    tags: ["haptics", "bounce", "impact", "force", "decay"],
    previewType: "box",
    cssCode: `/* Haptics: Bounce Impact */
.roycss-haptics-bounce-impact {
  background: linear-gradient(135deg, oklch(0.78 0.15 50), oklch(0.66 0.18 30));
  border-radius: 12px;
  cursor: pointer;
}
.roycss-haptics-bounce-impact:hover {
  animation: roy-haptics-bounce-impact 900ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes roy-haptics-bounce-impact {
  0%   { transform: translateY(0) scale(1); }
  20%  { transform: translateY(-50px) scaleY(1.1) scaleX(0.92); }
  40%  { transform: translateY(0) scaleY(0.86) scaleX(1.12); }
  55%  { transform: translateY(-22px) scaleY(1.05); }
  70%  { transform: translateY(0) scaleY(0.95) scaleX(1.04); }
  85%  { transform: translateY(-6px); }
  100% { transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-bounce-impact:hover { animation: none; }
}`,
  },

  // 13. haptics-mass-drop
  {
    id: "haptics-mass-drop",
    name: "Mass Drop",
    category: "haptics",
    description: "Element drops with weight — fast ease-in and squash on landing",
    tags: ["haptics", "mass", "drop", "weight", "squash"],
    previewType: "box",
    cssCode: `/* Haptics: Mass Drop */
.roycss-haptics-mass-drop {
  background: linear-gradient(160deg, oklch(0.5 0.04 240), oklch(0.34 0.05 240));
  border-radius: 14px;
  animation: roy-haptics-mass-drop 1.1s cubic-bezier(0.55, 0, 1, 0.45) both;
}
@keyframes roy-haptics-mass-drop {
  0%   { transform: translateY(-300px) scaleY(1.05); opacity: 0; }
  60%  { opacity: 1; }
  78%  { transform: translateY(0) scaleY(0.62) scaleX(1.18); }
  86%  { transform: translateY(-26px) scaleY(1.04) scaleX(0.97); }
  93%  { transform: translateY(0) scaleY(0.92) scaleX(1.04); }
  100% { transform: translateY(0) scaleY(1) scaleX(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-mass-drop { animation: none; transform: none; }
}`,
  },

  // 14. haptics-vibration-hum
  {
    id: "haptics-vibration-hum",
    name: "Vibration Hum",
    category: "haptics",
    description: "Subtle continuous vibration on hover, like a device buzzing",
    tags: ["haptics", "vibration", "hum", "buzz", "hover"],
    previewType: "box",
    cssCode: `/* Haptics: Vibration Hum */
.roycss-haptics-vibration-hum {
  background: linear-gradient(135deg, oklch(0.82 0.12 280), oklch(0.7 0.14 320));
  border-radius: 14px;
  cursor: pointer;
}
.roycss-haptics-vibration-hum:hover {
  animation: roy-haptics-vibration-hum 90ms linear infinite;
}
@keyframes roy-haptics-vibration-hum {
  0%   { transform: translate(0, 0) rotate(0deg); }
  20%  { transform: translate(-0.7px, 0.5px) rotate(-0.4deg); }
  40%  { transform: translate(0.7px, -0.5px) rotate(0.4deg); }
  60%  { transform: translate(-0.5px, -0.7px) rotate(-0.2deg); }
  80%  { transform: translate(0.5px, 0.7px) rotate(0.3deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-vibration-hum:hover { animation: none; }
}`,
  },

  // 15. haptics-friction-grip
  {
    id: "haptics-friction-grip",
    name: "Friction Grip",
    category: "haptics",
    description: "Element grips the surface on hover — slight scale down with shadow",
    tags: ["haptics", "friction", "grip", "press", "hover"],
    previewType: "box",
    cssCode: `/* Haptics: Friction Grip */
.roycss-haptics-friction-grip {
  background: linear-gradient(145deg, oklch(0.78 0.1 200), oklch(0.66 0.12 210));
  border-radius: 12px;
  box-shadow: 0 8px 18px oklch(0 0 0 / 0.16);
  transition: transform 320ms cubic-bezier(0.34, 1.2, 0.64, 1),
              box-shadow 320ms ease,
              filter 320ms ease;
  cursor: pointer;
}
.roycss-haptics-friction-grip:hover {
  transform: scale(0.96);
  box-shadow: 0 2px 6px oklch(0 0 0 / 0.24), inset 0 3px 8px oklch(0 0 0 / 0.18);
  filter: saturate(1.1) brightness(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-friction-grip,
  .roycss-haptics-friction-grip:hover {
    transition: none;
    transform: none;
    filter: none;
    box-shadow: 0 8px 18px oklch(0 0 0 / 0.16);
  }
}`,
  },

  // 16. haptics-soft-press
  {
    id: "haptics-soft-press",
    name: "Soft Press",
    category: "haptics",
    description: "Soft depress effect with shadow expansion, like pressing foam",
    tags: ["haptics", "soft", "press", "depress", "foam"],
    previewType: "box",
    cssCode: `/* Haptics: Soft Press */
.roycss-haptics-soft-press {
  background: linear-gradient(145deg, oklch(0.86 0.04 220), oklch(0.74 0.05 220));
  border-radius: 18px;
  box-shadow: 0 14px 26px oklch(0 0 0 / 0.12), inset 0 -3px 8px oklch(0 0 0 / 0.08);
  transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 360ms ease,
              border-radius 360ms ease;
  cursor: pointer;
}
.roycss-haptics-soft-press:hover {
  transform: scale(0.97) translateY(2px);
  box-shadow: 0 20px 40px oklch(0 0 0 / 0.18), inset 0 -8px 18px oklch(0 0 0 / 0.18);
  border-radius: 22px;
}
.roycss-haptics-soft-press:active {
  transform: scale(0.92) translateY(4px);
  box-shadow: 0 4px 10px oklch(0 0 0 / 0.18), inset 0 -14px 26px oklch(0 0 0 / 0.28);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-soft-press,
  .roycss-haptics-soft-press:hover,
  .roycss-haptics-soft-press:active {
    transition: none;
    transform: none;
    border-radius: 18px;
    box-shadow: 0 14px 26px oklch(0 0 0 / 0.12);
  }
}`,
  },

  // 17. haptics-snap-back
  {
    id: "haptics-snap-back",
    name: "Snap Back",
    category: "haptics",
    description: "Element drifts away on hover then snaps back to origin on release",
    tags: ["haptics", "snap", "drift", "spring-back", "release"],
    previewType: "box",
    cssCode: `/* Haptics: Snap Back */
.roycss-haptics-snap-back {
  background: linear-gradient(135deg, oklch(0.78 0.13 12), oklch(0.66 0.16 28));
  border-radius: 14px;
  transition: transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: grab;
}
.roycss-haptics-snap-back:hover {
  transform: translate(28px, -22px) rotate(6deg);
  transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
}
.roycss-haptics-snap-back:active {
  cursor: grabbing;
  animation: roy-haptics-snap-back 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes roy-haptics-snap-back {
  0%   { transform: translate(28px, -22px) rotate(6deg); }
  35%  { transform: translate(-14px, 12px) rotate(-4deg); }
  65%  { transform: translate(6px, -4px) rotate(1.5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-snap-back,
  .roycss-haptics-snap-back:hover,
  .roycss-haptics-snap-back:active { transition: none; animation: none; transform: none; }
}`,
  },

  // 18. haptics-velvet-touch
  {
    id: "haptics-velvet-touch",
    name: "Velvet Touch",
    category: "haptics",
    description: "Soft, luxurious hover with velvet-like deep shadow and warmth",
    tags: ["haptics", "velvet", "soft", "luxury", "hover"],
    previewType: "box",
    cssCode: `/* Haptics: Velvet Touch */
.roycss-haptics-velvet-touch {
  background: linear-gradient(135deg, oklch(0.42 0.13 350), oklch(0.32 0.16 360));
  border-radius: 16px;
  box-shadow: 0 6px 14px oklch(0.3 0.12 350 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.12);
  transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 600ms ease,
              filter 600ms ease;
  cursor: pointer;
}
.roycss-haptics-velvet-touch:hover {
  transform: translateY(-4px);
  box-shadow: 0 26px 50px oklch(0.34 0.16 350 / 0.6),
              0 12px 20px oklch(0.4 0.18 360 / 0.5),
              inset 0 1px 0 oklch(1 0 0 / 0.18);
  filter: brightness(1.1) saturate(1.1);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-velvet-touch,
  .roycss-haptics-velvet-touch:hover { transition: none; transform: none; filter: none; }
}`,
  },

  // 19. haptics-glass-tap
  {
    id: "haptics-glass-tap",
    name: "Glass Tap",
    category: "haptics",
    description: "Tap creates a glass-like concentric ripple that shimmers outward",
    tags: ["haptics", "glass", "tap", "ripple", "shimmer"],
    previewType: "box",
    cssCode: `/* Haptics: Glass Tap */
.roycss-haptics-glass-tap {
  position: relative;
  background: linear-gradient(145deg, oklch(0.92 0.02 220 / 0.7), oklch(0.78 0.04 220 / 0.6));
  border-radius: 16px;
  backdrop-filter: blur(8px);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.6), 0 10px 22px oklch(0 0 0 / 0.1);
  overflow: hidden;
  cursor: pointer;
}
.roycss-haptics-glass-tap::before,
.roycss-haptics-glass-tap::after {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 8px; height: 8px;
  border-radius: 50%;
  border: 2px solid oklch(0.95 0.05 200 / 0.6);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  pointer-events: none;
}
.roycss-haptics-glass-tap:hover::before {
  animation: roy-haptics-glass-tap 900ms ease-out infinite;
}
.roycss-haptics-glass-tap:hover::after {
  animation: roy-haptics-glass-tap 900ms ease-out 300ms infinite;
}
@keyframes roy-haptics-glass-tap {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.9; border-width: 3px; }
  100% { transform: translate(-50%, -50%) scale(20); opacity: 0; border-width: 0.5px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-glass-tap:hover::before,
  .roycss-haptics-glass-tap:hover::after { animation: none; opacity: 0; }
}`,
  },

  // 20. haptics-magnetic-pull
  {
    id: "haptics-magnetic-pull",
    name: "Magnetic Pull",
    category: "haptics",
    description: "Element subtly shifts toward the cursor direction with a magnetic feel",
    tags: ["haptics", "magnetic", "pull", "cursor", "hover"],
    previewType: "box",
    cssCode: `/* Haptics: Magnetic Pull */
.roycss-haptics-magnetic-pull {
  background: linear-gradient(135deg, oklch(0.78 0.13 200), oklch(0.66 0.16 220));
  border-radius: 50%;
  box-shadow: 0 8px 22px oklch(0 0 0 / 0.16);
  transition: transform 280ms cubic-bezier(0.34, 1.2, 0.64, 1),
              box-shadow 280ms ease;
  animation: roy-haptics-magnetic-idle 4s ease-in-out infinite;
  cursor: pointer;
}
.roycss-haptics-magnetic-pull:hover {
  transform: translate(10px, -8px) scale(1.05);
  box-shadow: 0 14px 32px oklch(0 0 0 / 0.22);
  animation: roy-haptics-magnetic-pull 2.4s ease-in-out infinite;
}
@keyframes roy-haptics-magnetic-pull {
  0%, 100% { transform: translate(10px, -8px) scale(1.05); }
  25%      { transform: translate(14px, -10px) scale(1.06); }
  50%      { transform: translate(6px, -4px) scale(1.04); }
  75%      { transform: translate(12px, -8px) scale(1.05); }
}
@keyframes roy-haptics-magnetic-idle {
  0%, 100% { transform: translate(0, 0); }
  50%      { transform: translate(2px, -2px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-haptics-magnetic-pull,
  .roycss-haptics-magnetic-pull:hover { animation: none; transition: none; transform: none; }
}`,
  },
] as unknown as CSSEffect[];

export default effectsBatch44;
