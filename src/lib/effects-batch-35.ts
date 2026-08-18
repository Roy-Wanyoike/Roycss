import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 35 — Physics-Based Motion (20 effects)
 * Pure-CSS simulations of real-world physics: springs, elasticity, gravity,
 * inertia, buoyancy, momentum, and impact. Each effect uses physics-grade
 * cubic-bezier easing (overshoot / damping) and honors prefers-reduced-motion.
 * All classes are prefixed `roycss-physics-` and keyframes `roy-physics-`.
 */
export const effectsBatch35: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // PHYSICS MOTION (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. physics-spring-bounce
  {
    id: "physics-spring-bounce",
    name: "Spring Bounce",
    category: "physics",
    description: "Element overshoots its target and springs back with damping",
    tags: ["physics", "spring", "bounce", "damping", "overshoot", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Spring Bounce */
.roycss-physics-spring-bounce {
  animation: roy-physics-spring-bounce 1.1s cubic-bezier(0.5, 1.6, 0.4, 1) both;
}
@keyframes roy-physics-spring-bounce {
  0%   { transform: translateY(-220px) scale(0.92, 1.08); opacity: 0; }
  55%  { transform: translateY(0) scale(1.06, 0.94); opacity: 1; }
  72%  { transform: translateY(-34px) scale(0.98, 1.02); }
  86%  { transform: translateY(0) scale(1.02, 0.98); }
  100% { transform: translateY(0) scale(1, 1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-spring-bounce { animation: none; transform: none; opacity: 1; }
}`,
  },

  // 2. physics-elastic-stretch
  {
    id: "physics-elastic-stretch",
    name: "Elastic Stretch",
    category: "physics",
    description: "Element stretches elastically when hovered, then snaps back",
    tags: ["physics", "elastic", "stretch", "hover", "snap"],
    previewType: "box",
    cssCode: `/* Physics: Elastic Stretch */
.roycss-physics-elastic-stretch {
  transition: transform 0.55s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-origin: bottom center;
}
.roycss-physics-elastic-stretch:hover {
  transform: scaleY(1.35) scaleX(0.82);
  transition: transform 0.18s cubic-bezier(0.5, 0, 0.75, 0);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-elastic-stretch,
  .roycss-physics-elastic-stretch:hover {
    transition: none;
    transform: none;
  }
}`,
  },

  // 3. physics-gravity-drop
  {
    id: "physics-gravity-drop",
    name: "Gravity Drop",
    category: "physics",
    description: "Element falls with accelerating ease-in and squashes on landing",
    tags: ["physics", "gravity", "drop", "squash", "landing", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Gravity Drop */
.roycss-physics-gravity-drop {
  animation: roy-physics-gravity-drop 0.9s cubic-bezier(0.55, 0.085, 0.68, 0.53) both;
}
@keyframes roy-physics-gravity-drop {
  0%   { transform: translateY(-260px); opacity: 0; }
  60%  { transform: translateY(0); opacity: 1; }
  70%  { transform: translateY(0) scale(1.18, 0.62); }
  82%  { transform: translateY(-26px) scale(0.96, 1.04); }
  91%  { transform: translateY(0) scale(1.06, 0.94); }
  100% { transform: translateY(0) scale(1, 1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-gravity-drop { animation: none; transform: none; opacity: 1; }
}`,
  },

  // 4. physics-pendulum-swing
  {
    id: "physics-pendulum-swing",
    name: "Pendulum Swing",
    category: "physics",
    description: "Realistic pendulum with progressively decreasing amplitude",
    tags: ["physics", "pendulum", "swing", "damping", "decay", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Pendulum Swing */
.roycss-physics-pendulum-swing {
  transform-origin: top center;
  animation: roy-physics-pendulum-swing 2.6s ease-out infinite;
}
@keyframes roy-physics-pendulum-swing {
  0%   { transform: rotate(0deg); }
  12%  { transform: rotate(42deg); }
  24%  { transform: rotate(-34deg); }
  36%  { transform: rotate(27deg); }
  48%  { transform: rotate(-21deg); }
  60%  { transform: rotate(15deg); }
  72%  { transform: rotate(-10deg); }
  84%  { transform: rotate(6deg); }
  92%  { transform: rotate(-3deg); }
  100% { transform: rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-pendulum-swing { animation: none; transform: none; }
}`,
  },

  // 5. physics-magnetic-pull
  {
    id: "physics-magnetic-pull",
    name: "Magnetic Pull",
    category: "physics",
    description: "Element subtly shifts toward the cursor direction on hover",
    tags: ["physics", "magnetic", "pull", "hover", "cursor"],
    previewType: "box",
    cssCode: `/* Physics: Magnetic Pull */
.roycss-physics-magnetic-pull {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-physics-magnetic-pull:hover {
  transform: translate(14px, -10px) rotate(2deg);
}
.roycss-physics-magnetic-pull:active {
  transform: translate(0, 0) rotate(0deg);
  transition: transform 0.12s ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-magnetic-pull,
  .roycss-physics-magnetic-pull:hover,
  .roycss-physics-magnetic-pull:active {
    transition: none;
    transform: none;
  }
}`,
  },

  // 6. physics-rubber-band
  {
    id: "physics-rubber-band",
    name: "Rubber Band",
    category: "physics",
    description: "Element stretches like rubber when pulled and snaps back on release",
    tags: ["physics", "rubber", "stretch", "elastic", "hover"],
    previewType: "box",
    cssCode: `/* Physics: Rubber Band */
.roycss-physics-rubber-band {
  transition: transform 0.6s cubic-bezier(0.68, -0.6, 0.32, 1.6);
  transform-origin: left center;
}
.roycss-physics-rubber-band:hover {
  transform: scaleX(1.45) scaleY(0.7);
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.6, 0.4);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-rubber-band,
  .roycss-physics-rubber-band:hover {
    transition: none;
    transform: none;
  }
}`,
  },

  // 7. physics-bounce-chain
  {
    id: "physics-bounce-chain",
    name: "Bounce Chain",
    category: "physics",
    description: "Sequential bounce animation cascading across child elements",
    tags: ["physics", "bounce", "chain", "stagger", "sequence", "children"],
    previewType: "loader",
    childCount: 5,
    cssCode: `/* Physics: Bounce Chain */
.roycss-physics-bounce-chain > * {
  animation: roy-physics-bounce-chain 1.1s cubic-bezier(0.5, 1.6, 0.4, 1) infinite;
  transform-origin: center bottom;
}
.roycss-physics-bounce-chain > *:nth-child(1) { animation-delay: 0s; }
.roycss-physics-bounce-chain > *:nth-child(2) { animation-delay: 0.12s; }
.roycss-physics-bounce-chain > *:nth-child(3) { animation-delay: 0.24s; }
.roycss-physics-bounce-chain > *:nth-child(4) { animation-delay: 0.36s; }
.roycss-physics-bounce-chain > *:nth-child(5) { animation-delay: 0.48s; }
@keyframes roy-physics-bounce-chain {
  0%, 70%, 100% { transform: translateY(0) scale(1, 1); }
  35%           { transform: translateY(-44px) scale(0.92, 1.08); }
  50%           { transform: translateY(0) scale(1.12, 0.88); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-bounce-chain > * { animation: none; transform: none; }
}`,
  },

  // 8. physics-inertia-slide
  {
    id: "physics-inertia-slide",
    name: "Inertia Slide",
    category: "physics",
    description: "Element slides and decelerates as if moving across a friction surface",
    tags: ["physics", "inertia", "slide", "friction", "deceleration", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Inertia Slide */
.roycss-physics-inertia-slide {
  animation: roy-physics-inertia-slide 1.4s cubic-bezier(0.08, 0.6, 0.18, 1) both;
}
@keyframes roy-physics-inertia-slide {
  0%   { transform: translateX(-360px); opacity: 0; }
  30%  { transform: translateX(28px); opacity: 1; }
  50%  { transform: translateX(-12px); }
  70%  { transform: translateX(6px); }
  85%  { transform: translateX(-2px); }
  100% { transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-inertia-slide { animation: none; transform: none; opacity: 1; }
}`,
  },

  // 9. physics-weight-settle
  {
    id: "physics-weight-settle",
    name: "Weight Settle",
    category: "physics",
    description: "Heavy element settles into place with a slight bounce and squash",
    tags: ["physics", "weight", "settle", "heavy", "squash", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Weight Settle */
.roycss-physics-weight-settle {
  animation: roy-physics-weight-settle 1s cubic-bezier(0.55, 0.085, 0.68, 0.53) both;
}
@keyframes roy-physics-weight-settle {
  0%   { transform: translateY(-180px); opacity: 0; }
  55%  { transform: translateY(0) scale(1.14, 0.7); opacity: 1; }
  70%  { transform: translateY(0) scale(0.96, 1.08); }
  82%  { transform: translateY(0) scale(1.03, 0.95); }
  100% { transform: translateY(0) scale(1, 1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-weight-settle { animation: none; transform: none; opacity: 1; }
}`,
  },

  // 10. physics-float-buoyancy
  {
    id: "physics-float-buoyancy",
    name: "Float Buoyancy",
    category: "physics",
    description: "Element gently floats up and down as if bobbing on water",
    tags: ["physics", "float", "buoyancy", "water", "bob", "infinite"],
    previewType: "box",
    cssCode: `/* Physics: Float Buoyancy */
.roycss-physics-float-buoyancy {
  animation: roy-physics-float-buoyancy 3.2s ease-in-out infinite;
}
@keyframes roy-physics-float-buoyancy {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50%      { transform: translateY(-14px) rotate(2deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-float-buoyancy { animation: none; transform: none; }
}`,
  },

  // 11. physics-spring-loaded
  {
    id: "physics-spring-loaded",
    name: "Spring Loaded",
    category: "physics",
    description: "Element springs in from the side with damped oscillation",
    tags: ["physics", "spring", "loaded", "oscillation", "side", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Spring Loaded */
.roycss-physics-spring-loaded {
  animation: roy-physics-spring-loaded 1.2s cubic-bezier(0.5, 1.8, 0.4, 0.95) both;
}
@keyframes roy-physics-spring-loaded {
  0%   { transform: translateX(-300px); opacity: 0; }
  40%  { transform: translateX(48px); opacity: 1; }
  55%  { transform: translateX(-22px); }
  70%  { transform: translateX(12px); }
  85%  { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-spring-loaded { animation: none; transform: none; opacity: 1; }
}`,
  },

  // 12. physics-elastic-recoil
  {
    id: "physics-elastic-recoil",
    name: "Elastic Recoil",
    category: "physics",
    description: "Element recoils backward after being pushed, then springs forward",
    tags: ["physics", "elastic", "recoil", "push", "hover", "spring"],
    previewType: "box",
    cssCode: `/* Physics: Elastic Recoil */
.roycss-physics-elastic-recoil {
  transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.roycss-physics-elastic-recoil:hover {
  transform: translateX(-22px) rotate(-3deg);
  transition: transform 0.1s ease-out;
}
.roycss-physics-elastic-recoil:active {
  transform: translateX(18px) rotate(2deg);
  transition: transform 0.08s ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-elastic-recoil,
  .roycss-physics-elastic-recoil:hover,
  .roycss-physics-elastic-recoil:active {
    transition: none;
    transform: none;
  }
}`,
  },

  // 13. physics-bounce-drop
  {
    id: "physics-bounce-drop",
    name: "Bounce Drop",
    category: "physics",
    description: "Element bounces like a rubber ball each time it is dropped",
    tags: ["physics", "bounce", "ball", "drop", "gravity", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Bounce Drop */
.roycss-physics-bounce-drop {
  animation: roy-physics-bounce-drop 1.5s cubic-bezier(0.5, 0.05, 0.95, 0.3) both;
}
@keyframes roy-physics-bounce-drop {
  0%   { transform: translateY(-200px); opacity: 0; }
  10%  { transform: translateY(0); opacity: 1; }
  20%  { transform: translateY(-90px); }
  30%  { transform: translateY(0) scale(1.1, 0.9); }
  38%  { transform: translateY(-50px) scale(0.96, 1.04); }
  46%  { transform: translateY(0) scale(1.05, 0.95); }
  54%  { transform: translateY(-22px); }
  62%  { transform: translateY(0) scale(1.02, 0.98); }
  72%  { transform: translateY(-8px); }
  82%  { transform: translateY(0); }
  100% { transform: translateY(0) scale(1, 1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-bounce-drop { animation: none; transform: none; opacity: 1; }
}`,
  },

  // 14. physics-wobble-jelly
  {
    id: "physics-wobble-jelly",
    name: "Wobble Jelly",
    category: "physics",
    description: "Jelly-like wobble deformation when the element is hovered",
    tags: ["physics", "wobble", "jelly", "jiggle", "hover", "deform"],
    previewType: "box",
    cssCode: `/* Physics: Wobble Jelly */
.roycss-physics-wobble-jelly {
  transition: transform 0.3s ease-out;
}
.roycss-physics-wobble-jelly:hover {
  animation: roy-physics-wobble-jelly 0.9s ease-in-out;
}
@keyframes roy-physics-wobble-jelly {
  0%, 100% { transform: skewX(0deg) scaleY(1); }
  20%      { transform: skewX(-12deg) scaleY(0.85); }
  40%      { transform: skewX(8deg) scaleY(1.12); }
  60%      { transform: skewX(-5deg) scaleY(0.94); }
  80%      { transform: skewX(2deg) scaleY(1.04); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-wobble-jelly,
  .roycss-physics-wobble-jelly:hover {
    transition: none;
    animation: none;
    transform: none;
  }
}`,
  },

  // 15. physics-shake-impact
  {
    id: "physics-shake-impact",
    name: "Shake Impact",
    category: "physics",
    description: "Element shakes sharply as if struck by a sudden impact",
    tags: ["physics", "shake", "impact", "hit", "vibrate", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Shake Impact */
.roycss-physics-shake-impact {
  animation: roy-physics-shake-impact 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
@keyframes roy-physics-shake-impact {
  0%, 100%   { transform: translate(0, 0) rotate(0deg); }
  10%        { transform: translate(-12px, 4px) rotate(-2deg); }
  20%        { transform: translate(14px, -4px) rotate(2deg); }
  30%        { transform: translate(-10px, 3px) rotate(-1.5deg); }
  40%        { transform: translate(10px, -3px) rotate(1.5deg); }
  50%        { transform: translate(-7px, 2px) rotate(-1deg); }
  60%        { transform: translate(6px, -2px) rotate(1deg); }
  70%        { transform: translate(-4px, 1px) rotate(-0.5deg); }
  80%        { transform: translate(3px, -1px) rotate(0.5deg); }
  90%        { transform: translate(-1px, 0) rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-shake-impact { animation: none; transform: none; }
}`,
  },

  // 16. physics-spring-up
  {
    id: "physics-spring-up",
    name: "Spring Up",
    category: "physics",
    description: "Element springs upward from below and settles into place",
    tags: ["physics", "spring", "upward", "rise", "settle", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Spring Up */
.roycss-physics-spring-up {
  animation: roy-physics-spring-up 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes roy-physics-spring-up {
  0%   { transform: translateY(180px); opacity: 0; }
  50%  { transform: translateY(-24px); opacity: 1; }
  70%  { transform: translateY(8px); }
  85%  { transform: translateY(-3px); }
  100% { transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-spring-up { animation: none; transform: none; opacity: 1; }
}`,
  },

  // 17. physics-elastic-fade
  {
    id: "physics-elastic-fade",
    name: "Elastic Fade",
    category: "physics",
    description: "Fade-in combined with an elastic scale overshoot",
    tags: ["physics", "elastic", "fade", "scale", "overshoot", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Elastic Fade */
.roycss-physics-elastic-fade {
  animation: roy-physics-elastic-fade 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
}
@keyframes roy-physics-elastic-fade {
  0%   { opacity: 0; transform: scale(0.6); }
  60%  { opacity: 1; transform: scale(1.15); }
  78%  { transform: scale(0.92); }
  90%  { transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-elastic-fade { animation: none; transform: none; opacity: 1; }
}`,
  },

  // 18. physics-gravity-tilt
  {
    id: "physics-gravity-tilt",
    name: "Gravity Tilt",
    category: "physics",
    description: "Element tilts slowly as if being pulled by gravity, then rights itself",
    tags: ["physics", "gravity", "tilt", "lean", "pull", "infinite"],
    previewType: "box",
    cssCode: `/* Physics: Gravity Tilt */
.roycss-physics-gravity-tilt {
  transform-origin: bottom right;
  animation: roy-physics-gravity-tilt 4s ease-in-out infinite;
}
@keyframes roy-physics-gravity-tilt {
  0%, 100% { transform: rotate(0deg) translateY(0); }
  25%      { transform: rotate(7deg) translateY(2px); }
  50%      { transform: rotate(0deg) translateY(0); }
  75%      { transform: rotate(-5deg) translateY(1px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-gravity-tilt { animation: none; transform: none; }
}`,
  },

  // 19. physics-momentum-spin
  {
    id: "physics-momentum-spin",
    name: "Momentum Spin",
    category: "physics",
    description: "Spin that starts fast with momentum and gradually comes to a stop",
    tags: ["physics", "momentum", "spin", "rotate", "deceleration", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Momentum Spin */
.roycss-physics-momentum-spin {
  animation: roy-physics-momentum-spin 2.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes roy-physics-momentum-spin {
  0%   { transform: rotate(0deg); }
  20%  { transform: rotate(540deg); }
  40%  { transform: rotate(820deg); }
  55%  { transform: rotate(960deg); }
  70%  { transform: rotate(1020deg); }
  85%  { transform: rotate(1050deg); }
  100% { transform: rotate(1060deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-momentum-spin { animation: none; transform: none; }
}`,
  },

  // 20. physics-bounce-settle
  {
    id: "physics-bounce-settle",
    name: "Bounce Settle",
    category: "physics",
    description: "Multiple bounces with progressively decreasing bounce height",
    tags: ["physics", "bounce", "settle", "decay", "damping", "animate"],
    previewType: "box",
    cssCode: `/* Physics: Bounce Settle */
.roycss-physics-bounce-settle {
  animation: roy-physics-bounce-settle 1.6s cubic-bezier(0.5, 0.05, 0.95, 0.3) both;
}
@keyframes roy-physics-bounce-settle {
  0%   { transform: translateY(-200px); opacity: 0; }
  8%   { transform: translateY(0); opacity: 1; }
  16%  { transform: translateY(-110px); }
  24%  { transform: translateY(0); }
  32%  { transform: translateY(-70px); }
  40%  { transform: translateY(0); }
  48%  { transform: translateY(-42px); }
  56%  { transform: translateY(0); }
  64%  { transform: translateY(-24px); }
  72%  { transform: translateY(0); }
  80%  { transform: translateY(-12px); }
  88%  { transform: translateY(0); }
  94%  { transform: translateY(-4px); }
  100% { transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-physics-bounce-settle { animation: none; transform: none; opacity: 1; }
}`,
  },
];
