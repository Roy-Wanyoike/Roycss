import type { CSSEffect } from "./roycss-types";

/**
 * Batch 9 — Material 3 / Apple HIG / Linear.app inspired effects (50 effects)
 * Categories: animations (15), hover (10), visual (10), scroll (8), glass-ui (7)
 */
export const effectsBatch9: CSSEffect[] = [
  // =========================================================================
  // ANIMATIONS (15) — Material/Apple-inspired spring physics
  // =========================================================================
  {
    id: "material-spring-up",
    name: "Material Spring Up",
    category: "animations",
    description: "Google Material 3 inspired spring entrance with physics-based overshoot",
    tags: ["material", "spring", "physics", "entrance"],
    previewType: "box",
    cssCode: `/* Material Spring Up */
.roycss-material-spring-up {
  animation: roy-mat-spring-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-mat-spring-up {
  0% { opacity: 0; transform: translateY(40px) scale(0.8); }
  60% { opacity: 1; transform: translateY(-8px) scale(1.05); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}`
  },
  {
    id: "material-spring-down",
    name: "Material Spring Down",
    category: "animations",
    description: "Material 3 spring exit animation with overshoot downward settle",
    tags: ["material", "spring", "exit", "physics"],
    previewType: "box",
    cssCode: `/* Material Spring Down */
.roycss-material-spring-down {
  animation: roy-mat-spring-down 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-mat-spring-down {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  40% { opacity: 1; transform: translateY(12px) scale(1.04, 0.96); }
  100% { opacity: 0; transform: translateY(80px) scale(0.7); }
}`
  },
  {
    id: "material-emphasized",
    name: "Material Emphasized",
    category: "animations",
    description: "Material 3 emphasized easing standard motion with subtle scale",
    tags: ["material", "emphasized", "motion", "standard"],
    previewType: "box",
    cssCode: `/* Material Emphasized */
.roycss-material-emphasized {
  animation: roy-mat-emphasized 0.5s cubic-bezier(0.2, 0, 0, 1) both;
}

@keyframes roy-mat-emphasized {
  0% { opacity: 0; transform: scale(0.85); }
  100% { opacity: 1; transform: scale(1); }
}`
  },
  {
    id: "material-emphasized-decel",
    name: "Material Emphasized Decelerate",
    category: "animations",
    description: "Material 3 emphasized decelerate curve for entering elements",
    tags: ["material", "decelerate", "entrance", "easing"],
    previewType: "box",
    cssCode: `/* Material Emphasized Decelerate */
.roycss-material-emphasized-decel {
  animation: roy-mat-emph-decel 0.45s cubic-bezier(0.05, 0.7, 0.1, 1) both;
}

@keyframes roy-mat-emph-decel {
  0% { opacity: 0; transform: translateY(24px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}`
  },
  {
    id: "material-container-transform",
    name: "Material Container Transform",
    category: "animations",
    description: "Material 3 container transform pattern expanding from a small source",
    tags: ["material", "container", "transform", "expand"],
    previewType: "box",
    cssCode: `/* Material Container Transform */
.roycss-material-container-transform {
  animation: roy-mat-container 0.6s cubic-bezier(0.2, 0, 0, 1) both;
  transform-origin: center;
}

@keyframes roy-mat-container {
  0% { opacity: 0; transform: scaleX(0.2) scaleY(0.1); border-radius: 32px; }
  40% { opacity: 1; transform: scaleX(1.05) scaleY(0.7); border-radius: 18px; }
  100% { opacity: 1; transform: scale(1); border-radius: 8px; }
}`
  },
  {
    id: "apple-squish-in",
    name: "Apple Squish In",
    category: "animations",
    description: "Apple HIG squishy entrance mimicking iOS sheet presentation",
    tags: ["apple", "squish", "ios", "entrance"],
    previewType: "box",
    cssCode: `/* Apple Squish In */
.roycss-apple-squish-in {
  animation: roy-apple-squish-in 0.7s cubic-bezier(0.32, 0.72, 0, 1) both;
}

@keyframes roy-apple-squish-in {
  0% { opacity: 0; transform: translateY(60px) scale(0.8, 0.85); }
  55% { opacity: 1; transform: translateY(0) scale(1.06, 0.94); }
  78% { transform: scale(0.98, 1.02); }
  100% { transform: scale(1); }
}`
  },
  {
    id: "apple-squish-out",
    name: "Apple Squish Out",
    category: "animations",
    description: "Apple HIG squishy dismissal mimicking iOS sheet dismissal",
    tags: ["apple", "squish", "ios", "exit"],
    previewType: "box",
    cssCode: `/* Apple Squish Out */
.roycss-apple-squish-out {
  animation: roy-apple-squish-out 0.55s cubic-bezier(0.32, 0.72, 0, 1) both;
}

@keyframes roy-apple-squish-out {
  0% { opacity: 1; transform: scale(1); }
  40% { opacity: 1; transform: scale(0.94, 1.05) translateY(8px); }
  100% { opacity: 0; transform: scale(0.85) translateY(60px); }
}`
  },
  {
    id: "apple-flip-spring",
    name: "Apple Flip Spring",
    category: "animations",
    description: "Apple style card flip with spring overshoot on rotateY",
    tags: ["apple", "flip", "spring", "3d"],
    previewType: "card",
    cssCode: `/* Apple Flip Spring */
.roycss-apple-flip-spring {
  perspective: 1000px;
  animation: roy-apple-flip-spring 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transform-style: preserve-3d;
}

@keyframes roy-apple-flip-spring {
  0% { opacity: 0; transform: rotateY(-90deg) scale(0.85); }
  60% { opacity: 1; transform: rotateY(12deg) scale(1.04); }
  100% { transform: rotateY(0) scale(1); }
}`
  },
  {
    id: "apple-elastic-scale",
    name: "Apple Elastic Scale",
    category: "animations",
    description: "Apple elastic scale with bouncy overshoot settling into rest",
    tags: ["apple", "elastic", "scale", "bounce"],
    previewType: "box",
    cssCode: `/* Apple Elastic Scale */
.roycss-apple-elastic-scale {
  animation: roy-apple-elastic 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
}

@keyframes roy-apple-elastic {
  0% { transform: scale(0); opacity: 0; }
  35% { transform: scale(1.25); opacity: 1; }
  55% { transform: scale(0.88); }
  75% { transform: scale(1.08); }
  100% { transform: scale(1); }
}`
  },
  {
    id: "apple-bounce-settle",
    name: "Apple Bounce Settle",
    category: "animations",
    description: "iOS notification style bounce with damped settle oscillation",
    tags: ["apple", "bounce", "settle", "notification"],
    previewType: "box",
    cssCode: `/* Apple Bounce Settle */
.roycss-apple-bounce-settle {
  animation: roy-apple-bounce-settle 1.2s cubic-bezier(0.28, 0.84, 0.42, 1) both;
}

@keyframes roy-apple-bounce-settle {
  0% { transform: translateY(-120%); opacity: 0; }
  15% { transform: translateY(0); opacity: 1; }
  30% { transform: translateY(-22%); }
  45% { transform: translateY(0); }
  60% { transform: translateY(-8%); }
  75% { transform: translateY(0); }
  88% { transform: translateY(-2%); }
  100% { transform: translateY(0); }
}`
  },
  {
    id: "natural-drop",
    name: "Natural Drop",
    category: "animations",
    description: "Gravity-driven drop with realistic bounce decay",
    tags: ["gravity", "drop", "bounce", "physics"],
    previewType: "box",
    cssCode: `/* Natural Drop */
.roycss-natural-drop {
  animation: roy-natural-drop 1s cubic-bezier(0.45, 0, 0.55, 1) both;
}

@keyframes roy-natural-drop {
  0% { transform: translateY(-200%) scaleY(0.9); opacity: 0; }
  45% { transform: translateY(0) scaleY(1.1); opacity: 1; }
  55% { transform: translateY(0) scaleY(0.85); }
  65% { transform: translateY(-30%) scaleY(1.05); }
  80% { transform: translateY(0) scaleY(0.95); }
  90% { transform: translateY(-8%) scaleY(1.02); }
  100% { transform: translateY(0) scaleY(1); }
}`
  },
  {
    id: "pendulum-swing-spring",
    name: "Pendulum Swing Spring",
    category: "animations",
    description: "Pendulum swing with spring damping oscillation around pivot",
    tags: ["pendulum", "swing", "spring", "oscillate"],
    previewType: "box",
    cssCode: `/* Pendulum Swing Spring */
.roycss-pendulum-swing-spring {
  transform-origin: top center;
  animation: roy-pendulum-spring 1.6s cubic-bezier(0.4, 0, 0.6, 1) both;
}

@keyframes roy-pendulum-spring {
  0% { transform: rotate(0deg); }
  15% { transform: rotate(45deg); }
  30% { transform: rotate(-32deg); }
  45% { transform: rotate(22deg); }
  60% { transform: rotate(-14deg); }
  75% { transform: rotate(8deg); }
  88% { transform: rotate(-3deg); }
  100% { transform: rotate(0deg); }
}`
  },
  {
    id: "rubber-snap-back",
    name: "Rubber Snap Back",
    category: "animations",
    description: "Rubber deformation that snaps back with spring overshoot",
    tags: ["rubber", "snap", "elastic", "overshoot"],
    previewType: "box",
    cssCode: `/* Rubber Snap Back */
.roycss-rubber-snap-back {
  animation: roy-rubber-snap 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-rubber-snap {
  0% { transform: scaleX(1); }
  25% { transform: scaleX(1.4) scaleY(0.7); }
  45% { transform: scaleX(0.85) scaleY(1.15); }
  65% { transform: scaleX(1.08) scaleY(0.95); }
  85% { transform: scaleX(0.98) scaleY(1.01); }
  100% { transform: scaleX(1) scaleY(1); }
}`
  },
  {
    id: "material-state-layer",
    name: "Material State Layer",
    category: "animations",
    description: "Material 3 state layer overlay fade for interaction feedback",
    tags: ["material", "state-layer", "ripple", "feedback"],
    previewType: "box",
    cssCode: `/* Material State Layer */
.roycss-material-state-layer {
  position: relative;
  background: oklch(0.496 0.13 293.71);
  color: oklch(1 0 89.88);
}
.roycss-material-state-layer::after {
  content: "";
  position: absolute;
  inset: 0;
  background: oklch(1 0 89.88);
  opacity: 0;
  animation: roy-mat-state-layer 1.6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes roy-mat-state-layer {
  0%, 100% { opacity: 0; }
  20% { opacity: 0.08; }
  50% { opacity: 0.12; }
  80% { opacity: 0.05; }
}`
  },
  {
    id: "material-fab-scale",
    name: "Material FAB Scale",
    category: "animations",
    description: "Material Floating Action Button scale-in entrance with spring",
    tags: ["material", "fab", "scale", "entrance"],
    previewType: "button",
    cssCode: `/* Material FAB Scale */
.roycss-material-fab-scale {
  animation: roy-mat-fab-scale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  border-radius: 16px;
  background: oklch(0.496 0.13 293.71);
  color: oklch(1 0 89.88);
}

@keyframes roy-mat-fab-scale {
  0% { opacity: 0; transform: scale(0) rotate(-45deg); }
  60% { opacity: 1; transform: scale(1.1) rotate(5deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}`
  },

  // =========================================================================
  // HOVER (10) — Linear-inspired interactions
  // =========================================================================
  {
    id: "linear-shimmer-hover",
    name: "Linear Shimmer Hover",
    category: "hover",
    description: "Linear.app style shimmer sweep across element on hover",
    tags: ["linear", "shimmer", "hover", "sweep"],
    previewType: "card",
    cssCode: `/* Linear Shimmer Hover */
.roycss-linear-shimmer-hover {
  position: relative;
  background: oklch(0.169 0.002 286.18);
  color: oklch(0.92 0.004 286.32);
  overflow: hidden;
  border: 1px solid oklch(0.274 0.005 286.03);
}
.roycss-linear-shimmer-hover::before {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: -150%;
  inline-size: 100%;
  block-size: 100%;
  background: linear-gradient(
    100deg,
    transparent 20%,
    color-mix(in oklch, oklch(1 0 89.88) 12%, transparent) 50%,
    transparent 80%
  );
  transform: skewX(-20deg);
  transition: left 0.7s ease;
}
.roycss-linear-shimmer-hover:hover::before {
  inset-inline-start: 150%;
}`
  },
  {
    id: "linear-glow-border",
    name: "Linear Glow Border",
    category: "hover",
    description: "Animated gradient border glow on hover, Linear-inspired",
    tags: ["linear", "glow", "border", "hover"],
    previewType: "card",
    cssCode: `/* Linear Glow Border */
.roycss-linear-glow-border {
  position: relative;
  background: oklch(0.179 0.004 285.98);
  color: oklch(0.985 0 89.88);
  border-radius: 12px;
  z-index: 0;
}
.roycss-linear-glow-border::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, oklch(0.567 0.159 275.21), oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31), oklch(0.567 0.159 275.21));
  background-size: 300% 300%;
  -webkit-mask: linear-gradient(oklch(0 0 0) 0 0) content-box, linear-gradient(oklch(0 0 0) 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: roy-linear-glow 3s linear infinite paused;
  z-index: -1;
}
.roycss-linear-glow-border:hover::before {
  opacity: 1;
  animation-play-state: running;
}

@keyframes roy-linear-glow {
  0% { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}`
  },
  {
    id: "linear-spotlight",
    name: "Linear Spotlight",
    category: "hover",
    description: "Mouse-follow radial spotlight gradient on hover, Linear style",
    tags: ["linear", "spotlight", "mouse", "radial"],
    previewType: "card",
    cssCode: `/* Linear Spotlight */
.roycss-linear-spotlight {
  position: relative;
  background: oklch(0.16 0.004 285.92);
  color: oklch(0.92 0.004 286.32);
  border: 1px solid oklch(0.241 0.008 285.82);
  border-radius: 12px;
  overflow: hidden;
}
.roycss-linear-spotlight::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    300px circle at var(--mx, 50%) var(--my, 50%),
    color-mix(in oklch, oklch(0.567 0.159 275.21) 18%, transparent),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.roycss-linear-spotlight:hover::before {
  opacity: 1;
}
.roycss-linear-spotlight:hover {
  border-color: oklch(0.37 0.012 285.81);
  transition: border-color 0.3s ease;
}`
  },
  {
    id: "linear-magnetic-pull",
    name: "Linear Magnetic Pull",
    category: "hover",
    description: "Element subtly translates toward cursor like magnetic pull",
    tags: ["linear", "magnetic", "cursor", "pull"],
    previewType: "button",
    cssCode: `/* Linear Magnetic Pull */
.roycss-linear-magnetic-pull {
  background: oklch(0.567 0.159 275.21);
  color: oklch(1 0 89.88);
  border-radius: 8px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}
.roycss-linear-magnetic-pull:hover {
  transform: translateX(6px) translateY(-4px);
}
.roycss-linear-magnetic-pull:active {
  transform: translateX(3px) translateY(-2px) scale(0.96);
  transition: transform 0.1s ease;
}`
  },
  {
    id: "linear-noise-overlay",
    name: "Linear Noise Overlay",
    category: "hover",
    description: "Subtle SVG noise texture overlay revealed on hover",
    tags: ["linear", "noise", "texture", "overlay"],
    previewType: "card",
    cssCode: `/* Linear Noise Overlay */
.roycss-linear-noise-overlay {
  position: relative;
  background: oklch(0.145 0.002 286.13);
  color: oklch(0.92 0.004 286.32);
  border: 1px solid oklch(0.219 0.006 285.91);
  border-radius: 10px;
  overflow: hidden;
}
.roycss-linear-noise-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
  opacity: 0;
  mix-blend-mode: overlay;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
.roycss-linear-noise-overlay:hover::after {
  opacity: 0.35;
}`
  },
  {
    id: "linear-gradient-sweep",
    name: "Linear Gradient Sweep",
    category: "hover",
    description: "Diagonal gradient color sweep filling element on hover",
    tags: ["linear", "gradient", "sweep", "fill"],
    previewType: "button",
    cssCode: `/* Linear Gradient Sweep */
.roycss-linear-gradient-sweep {
  position: relative;
  background: oklch(0.21 0.006 285.89);
  color: oklch(0.985 0 89.88);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 8px;
  overflow: hidden;
  z-index: 0;
}
.roycss-linear-gradient-sweep::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.567 0.159 275.21), oklch(0.606 0.219 292.72) 50%, oklch(0.656 0.212 354.31));
  transform: translateY(100%);
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}
.roycss-linear-gradient-sweep:hover::before {
  transform: translateY(0);
}
.roycss-linear-gradient-sweep:hover {
  border-color: transparent;
}`
  },
  {
    id: "linear-depth-shadow",
    name: "Linear Depth Shadow",
    category: "hover",
    description: "Multi-layered depth shadow expansion on hover, Linear style",
    tags: ["linear", "depth", "shadow", "layered"],
    previewType: "card",
    cssCode: `/* Linear Depth Shadow */
.roycss-linear-depth-shadow {
  background: oklch(0.21 0.006 285.89);
  color: oklch(0.985 0 89.88);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 12px;
  box-shadow: 0 1px 2px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  transition: box-shadow 0.4s ease, transform 0.4s ease;
}
.roycss-linear-depth-shadow:hover {
  box-shadow:
    0 2px 4px color-mix(in oklch, oklch(0 0 0) 30%, transparent),
    0 8px 16px color-mix(in oklch, oklch(0 0 0) 40%, transparent),
    0 16px 32px color-mix(in oklch, oklch(0.567 0.159 275.21) 15%, transparent);
  transform: translateY(-2px);
}`
  },
  {
    id: "linear-card-lift",
    name: "Linear Card Lift",
    category: "hover",
    description: "Card lift with subtle scale and elevated shadow on hover",
    tags: ["linear", "card", "lift", "hover"],
    previewType: "card",
    cssCode: `/* Linear Card Lift */
.roycss-linear-card-lift {
  background: oklch(0.21 0.006 285.89);
  color: oklch(0.985 0 89.88);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 14px;
  box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.567 0.159 275.21) 0%, transparent);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.35s ease;
}
.roycss-linear-card-lift:hover {
  transform: translateY(-6px) scale(1.015);
  box-shadow: 0 18px 40px -12px color-mix(in oklch, oklch(0.567 0.159 275.21) 40%, transparent);
  border-color: oklch(0.37 0.012 285.81);
}`
  },
  {
    id: "linear-text-glow",
    name: "Linear Text Glow",
    category: "hover",
    description: "Subtle text glow with gradient color shift on hover",
    tags: ["linear", "text", "glow", "gradient"],
    previewType: "text",
    previewText: "Linear Glow",
    cssCode: `/* Linear Text Glow */
.roycss-linear-text-glow {
  color: oklch(0.712 0.013 286.07);
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}
.roycss-linear-text-glow:hover {
  color: oklch(0.985 0 89.88);
  text-shadow:
    0 0 14px color-mix(in oklch, oklch(0.567 0.159 275.21) 60%, transparent),
    0 0 30px color-mix(in oklch, oklch(0.606 0.219 292.72) 30%, transparent);
}`
  },
  {
    id: "linear-icon-bounce",
    name: "Linear Icon Bounce",
    category: "hover",
    description: "Icon/element bounces with spring overshoot on hover",
    tags: ["linear", "icon", "bounce", "spring"],
    previewType: "button",
    cssCode: `/* Linear Icon Bounce */
.roycss-linear-icon-bounce {
  background: oklch(0.21 0.006 285.89);
  color: oklch(0.985 0 89.88);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 8px;
  transition: background-color 0.25s ease, border-color 0.25s ease;
}
.roycss-linear-icon-bounce::before {
  content: "\\2192";
  display: inline-block;
  margin-inline-end: 6px;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-linear-icon-bounce:hover {
  background: oklch(0.274 0.005 286.03);
  border-color: oklch(0.37 0.012 285.81);
}
.roycss-linear-icon-bounce:hover::before {
  transform: translateX(6px) scale(1.2);
}`
  },

  // =========================================================================
  // VISUAL (10) — Linear shimmer, Apple frosted, Material elevation
  // =========================================================================
  {
    id: "linear-aurora-glow",
    name: "Linear Aurora Glow",
    category: "visual",
    description: "Soft animated aurora gradient glow, Linear.app inspired",
    tags: ["linear", "aurora", "glow", "gradient"],
    previewType: "background",
    cssCode: `/* Linear Aurora Glow */
.roycss-linear-aurora-glow {
  position: relative;
  background: oklch(0.145 0.002 286.13);
  overflow: hidden;
}
.roycss-linear-aurora-glow::before,
.roycss-linear-aurora-glow::after {
  content: "";
  position: absolute;
  inline-size: 60%;
  block-size: 60%;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: roy-aurora-float 10s ease-in-out infinite;
}
.roycss-linear-aurora-glow::before {
  background: radial-gradient(circle, oklch(0.567 0.159 275.21), transparent 70%);
  inset-block-start: -20%;
  inset-inline-start: -10%;
}
.roycss-linear-aurora-glow::after {
  background: radial-gradient(circle, oklch(0.606 0.219 292.72), transparent 70%);
  inset-block-end: -20%;
  inset-inline-end: -10%;
  animation-delay: -5s;
}

@keyframes roy-aurora-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}`
  },
  {
    id: "linear-gradient-mesh-bg",
    name: "Linear Gradient Mesh BG",
    category: "visual",
    description: "Multi-point radial gradient mesh background, Linear style",
    tags: ["linear", "gradient", "mesh", "background"],
    previewType: "background",
    cssCode: `/* Linear Gradient Mesh BG */
.roycss-linear-gradient-mesh-bg {
  background-color: oklch(0.145 0.002 286.13);
  background-image:
    radial-gradient(at 20% 20%, color-mix(in oklch, oklch(0.567 0.159 275.21) 35%, transparent) 0px, transparent 50%),
    radial-gradient(at 80% 10%, color-mix(in oklch, oklch(0.606 0.219 292.72) 30%, transparent) 0px, transparent 50%),
    radial-gradient(at 70% 80%, color-mix(in oklch, oklch(0.656 0.212 354.31) 25%, transparent) 0px, transparent 50%),
    radial-gradient(at 10% 90%, color-mix(in oklch, oklch(0.623 0.188 259.81) 25%, transparent) 0px, transparent 50%);
  background-size: 200% 200%;
  animation: roy-mesh-drift 18s ease-in-out infinite;
}

@keyframes roy-mesh-drift {
  0%, 100% { background-position: 0% 0%, 100% 0%, 100% 100%, 0% 100%; }
  50% { background-position: 30% 30%, 70% 20%, 60% 70%, 20% 80%; }
}`
  },
  {
    id: "apple-frosted-vibrancy",
    name: "Apple Frosted Vibrancy",
    category: "visual",
    description: "Apple macOS vibrancy material with strong backdrop saturation",
    tags: ["apple", "frosted", "vibrancy", "backdrop"],
    previewType: "card",
    cssCode: `/* Apple Frosted Vibrancy */
.roycss-apple-frosted-vibrancy {
  background: color-mix(in oklch, oklch(1 0 89.88) 55%, transparent);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 40%, transparent);
  border-radius: 14px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 60%, transparent) inset,
    0 10px 30px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  color: oklch(0.232 0.004 286.1);
}`
  },
  {
    id: "apple-material-thin",
    name: "Apple Material Thin",
    category: "visual",
    description: "Apple thin material translucency with light backdrop blur",
    tags: ["apple", "material", "thin", "translucent"],
    previewType: "card",
    cssCode: `/* Apple Material Thin */
.roycss-apple-material-thin {
  background: color-mix(in oklch, oklch(0.986 0.003 286.35) 50%, transparent);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 50%, transparent);
  border-radius: 12px;
  box-shadow: 0 4px 16px color-mix(in oklch, oklch(0 0 0) 8%, transparent);
  color: oklch(0.232 0.004 286.1);
}`
  },
  {
    id: "apple-material-thick",
    name: "Apple Material Thick",
    category: "visual",
    description: "Apple thick material translucency with heavy blur and tint",
    tags: ["apple", "material", "thick", "translucent"],
    previewType: "card",
    cssCode: `/* Apple Material Thick */
.roycss-apple-material-thick {
  background: color-mix(in oklch, oklch(0.971 0.003 286.35) 75%, transparent);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 30%, transparent);
  border-radius: 16px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) inset,
    0 20px 50px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
  color: oklch(0.232 0.004 286.1);
}`
  },
  {
    id: "material-elevation-1",
    name: "Material Elevation 1",
    category: "visual",
    description: "Material 3 elevation level 1 shadow for subtle raised surfaces",
    tags: ["material", "elevation", "shadow", "surface"],
    previewType: "card",
    cssCode: `/* Material Elevation 1 */
.roycss-material-elevation-1 {
  background: oklch(0.992 0.006 333.98);
  color: oklch(0.225 0.008 297.21);
  border-radius: 12px;
  box-shadow:
    0px 1px 2px color-mix(in oklch, oklch(0 0 0) 30%, transparent),
    0px 1px 3px 1px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
}`
  },
  {
    id: "material-elevation-3",
    name: "Material Elevation 3",
    category: "visual",
    description: "Material 3 elevation level 3 shadow for prominent raised surfaces",
    tags: ["material", "elevation", "shadow", "raised"],
    previewType: "card",
    cssCode: `/* Material Elevation 3 */
.roycss-material-elevation-3 {
  background: oklch(0.992 0.006 333.98);
  color: oklch(0.225 0.008 297.21);
  border-radius: 16px;
  box-shadow:
    0px 1px 3px color-mix(in oklch, oklch(0 0 0) 30%, transparent),
    0px 4px 8px 3px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
}`
  },
  {
    id: "material-elevation-5",
    name: "Material Elevation 5",
    category: "visual",
    description: "Material 3 elevation level 5 shadow for floating dialog surfaces",
    tags: ["material", "elevation", "shadow", "floating"],
    previewType: "card",
    cssCode: `/* Material Elevation 5 */
.roycss-material-elevation-5 {
  background: oklch(0.992 0.006 333.98);
  color: oklch(0.225 0.008 297.21);
  border-radius: 28px;
  box-shadow:
    0px 1px 3px color-mix(in oklch, oklch(0 0 0) 30%, transparent),
    0px 14px 28px 5px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}`
  },
  {
    id: "material-state-layer-surface",
    name: "Material State Layer Surface",
    category: "visual",
    description: "Material 3 surface with persistent 8% state layer tint overlay",
    tags: ["material", "state-layer", "surface", "tint"],
    previewType: "card",
    cssCode: `/* Material State Layer Surface */
.roycss-material-state-layer-surface {
  position: relative;
  background: oklch(0.225 0.008 297.21);
  color: oklch(0.915 0.008 332.13);
  border-radius: 12px;
  overflow: hidden;
}
.roycss-material-state-layer-surface::after {
  content: "";
  position: absolute;
  inset: 0;
  background: oklch(0.835 0.095 298.02);
  opacity: 0.08;
  pointer-events: none;
}`
  },
  {
    id: "linear-dark-surface",
    name: "Linear Dark Surface",
    category: "visual",
    description: "Linear.app signature dark surface with subtle inner highlight",
    tags: ["linear", "dark", "surface", "highlight"],
    previewType: "card",
    cssCode: `/* Linear Dark Surface */
.roycss-linear-dark-surface {
  background: linear-gradient(180deg, oklch(0.21 0.006 285.89) 0%, oklch(0.169 0.002 286.18) 100%);
  color: oklch(0.92 0.004 286.32);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 12px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 4%, transparent) inset,
    0 4px 16px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}`
  },

  // =========================================================================
  // SCROLL (8) — scroll-driven animations with @supports fallbacks
  // =========================================================================
  {
    id: "scroll-driven-fade",
    name: "Scroll Driven Fade",
    category: "scroll",
    description: "View-timeline driven fade-in with infinite loop fallback",
    tags: ["scroll", "fade", "timeline", "view"],
    previewType: "box",
    cssCode: `/* Scroll Driven Fade */
.roycss-scroll-driven-fade {
  animation: roy-scroll-fade linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}

@keyframes roy-scroll-fade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@supports not (animation-timeline: view()) {
  .roycss-scroll-driven-fade {
    animation: roy-scroll-fade-fallback 2s ease-in-out infinite alternate;
  }
  @keyframes roy-scroll-fade-fallback {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
}`
  },
  {
    id: "scroll-driven-scale",
    name: "Scroll Driven Scale",
    category: "scroll",
    description: "View-timeline driven scale-up with infinite loop fallback",
    tags: ["scroll", "scale", "timeline", "view"],
    previewType: "box",
    cssCode: `/* Scroll Driven Scale */
.roycss-scroll-driven-scale {
  animation: roy-scroll-scale linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}

@keyframes roy-scroll-scale {
  0% { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@supports not (animation-timeline: view()) {
  .roycss-scroll-driven-scale {
    animation: roy-scroll-scale-fallback 2.4s ease-in-out infinite alternate;
  }
  @keyframes roy-scroll-scale-fallback {
    0% { transform: scale(0.6); opacity: 0.4; }
    100% { transform: scale(1); opacity: 1; }
  }
}`
  },
  {
    id: "scroll-driven-rotate",
    name: "Scroll Driven Rotate",
    category: "scroll",
    description: "View-timeline driven rotation with infinite loop fallback",
    tags: ["scroll", "rotate", "timeline", "view"],
    previewType: "box",
    cssCode: `/* Scroll Driven Rotate */
.roycss-scroll-driven-rotate {
  animation: roy-scroll-rotate linear both;
  animation-timeline: view();
  animation-range: entry 0% exit 100%;
}

@keyframes roy-scroll-rotate {
  0% { transform: rotate(-45deg); }
  100% { transform: rotate(45deg); }
}

@supports not (animation-timeline: view()) {
  .roycss-scroll-driven-rotate {
    animation: roy-scroll-rotate-fallback 3s ease-in-out infinite alternate;
  }
  @keyframes roy-scroll-rotate-fallback {
    0% { transform: rotate(-45deg); }
    100% { transform: rotate(45deg); }
  }
}`
  },
  {
    id: "scroll-driven-translate",
    name: "Scroll Driven Translate",
    category: "scroll",
    description: "View-timeline driven horizontal translate with fallback loop",
    tags: ["scroll", "translate", "timeline", "view"],
    previewType: "box",
    cssCode: `/* Scroll Driven Translate */
.roycss-scroll-driven-translate {
  animation: roy-scroll-translate linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 60%;
}

@keyframes roy-scroll-translate {
  0% { transform: translateX(-80px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@supports not (animation-timeline: view()) {
  .roycss-scroll-driven-translate {
    animation: roy-scroll-translate-fallback 2.5s ease-in-out infinite alternate;
  }
  @keyframes roy-scroll-translate-fallback {
    0% { transform: translateX(-80px); opacity: 0.4; }
    100% { transform: translateX(0); opacity: 1; }
  }
}`
  },
  {
    id: "scroll-driven-blur",
    name: "Scroll Driven Blur",
    category: "scroll",
    description: "View-timeline driven blur-to-sharp focus with fallback loop",
    tags: ["scroll", "blur", "focus", "timeline"],
    previewType: "box",
    cssCode: `/* Scroll Driven Blur */
.roycss-scroll-driven-blur {
  animation: roy-scroll-blur linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}

@keyframes roy-scroll-blur {
  0% { filter: blur(12px); opacity: 0; transform: scale(1.05); }
  100% { filter: blur(0); opacity: 1; transform: scale(1); }
}

@supports not (animation-timeline: view()) {
  .roycss-scroll-driven-blur {
    animation: roy-scroll-blur-fallback 2.6s ease-in-out infinite alternate;
  }
  @keyframes roy-scroll-blur-fallback {
    0% { filter: blur(12px); opacity: 0.4; transform: scale(1.05); }
    100% { filter: blur(0); opacity: 1; transform: scale(1); }
  }
}`
  },
  {
    id: "scroll-driven-color",
    name: "Scroll Driven Color",
    category: "scroll",
    description: "View-timeline driven background color shift with fallback loop",
    tags: ["scroll", "color", "timeline", "view"],
    previewType: "box",
    cssCode: `/* Scroll Driven Color */
.roycss-scroll-driven-color {
  animation: roy-scroll-color linear both;
  animation-timeline: view();
  animation-range: entry 0% exit 100%;
}

@keyframes roy-scroll-color {
  0% { background: oklch(0.567 0.159 275.21); color: oklch(1 0 89.88); }
  50% { background: oklch(0.606 0.219 292.72); color: oklch(1 0 89.88); }
  100% { background: oklch(0.656 0.212 354.31); color: oklch(1 0 89.88); }
}

@supports not (animation-timeline: view()) {
  .roycss-scroll-driven-color {
    animation: roy-scroll-color-fallback 4s ease-in-out infinite alternate;
  }
  @keyframes roy-scroll-color-fallback {
    0% { background: oklch(0.567 0.159 275.21); color: oklch(1 0 89.88); }
    50% { background: oklch(0.606 0.219 292.72); color: oklch(1 0 89.88); }
    100% { background: oklch(0.656 0.212 354.31); color: oklch(1 0 89.88); }
  }
}`
  },
  {
    id: "scroll-driven-sticky",
    name: "Scroll Driven Sticky",
    category: "scroll",
    description: "Sticky header with scroll-timeline driven shadow on scroll",
    tags: ["scroll", "sticky", "header", "timeline"],
    previewType: "box",
    cssCode: `/* Scroll Driven Sticky */
.roycss-scroll-driven-sticky {
  position: sticky;
  inset-block-start: 0;
  background: oklch(0.21 0.006 285.89);
  color: oklch(0.985 0 89.88);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 8px;
  animation: roy-scroll-sticky linear both;
  animation-timeline: scroll(root);
  animation-range: 0 100px;
}

@keyframes roy-scroll-sticky {
  0% { box-shadow: 0 0 0 color-mix(in oklch, oklch(0 0 0) 0%, transparent); }
  100% { box-shadow: 0 8px 24px color-mix(in oklch, oklch(0 0 0) 40%, transparent); border-color: oklch(0.37 0.012 285.81); }
}

@supports not (animation-timeline: scroll()) {
  .roycss-scroll-driven-sticky {
    animation: roy-scroll-sticky-fallback 2s ease-in-out infinite alternate;
  }
  @keyframes roy-scroll-sticky-fallback {
    0% { box-shadow: 0 0 0 color-mix(in oklch, oklch(0 0 0) 0%, transparent); border-color: oklch(0.274 0.005 286.03); }
    100% { box-shadow: 0 8px 24px color-mix(in oklch, oklch(0 0 0) 40%, transparent); border-color: oklch(0.37 0.012 285.81); }
  }
}`
  },
  {
    id: "scroll-driven-progress-ring",
    name: "Scroll Driven Progress Ring",
    category: "scroll",
    description: "SVG-like progress ring driven by scroll-timeline with fallback",
    tags: ["scroll", "progress", "ring", "timeline"],
    previewType: "box",
    cssCode: `/* Scroll Driven Progress Ring */
.roycss-scroll-driven-progress-ring {
  position: relative;
  border-radius: 50%;
  background:
    conic-gradient(oklch(0.567 0.159 275.21) 0deg, oklch(0.567 0.159 275.21) 0deg, oklch(0.274 0.005 286.03) 0deg, oklch(0.274 0.005 286.03) 360deg);
  animation: roy-scroll-ring linear both;
  animation-timeline: scroll(root);
  animation-range: 0 100%;
}
.roycss-scroll-driven-progress-ring::after {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: oklch(0.145 0.002 286.13);
}

@keyframes roy-scroll-ring {
  0% {
    background:
      conic-gradient(oklch(0.567 0.159 275.21) 0deg, oklch(0.567 0.159 275.21) 0deg, oklch(0.274 0.005 286.03) 0deg, oklch(0.274 0.005 286.03) 360deg);
  }
  100% {
    background:
      conic-gradient(oklch(0.567 0.159 275.21) 0deg, oklch(0.567 0.159 275.21) 360deg, oklch(0.274 0.005 286.03) 360deg, oklch(0.274 0.005 286.03) 360deg);
  }
}

@supports not (animation-timeline: scroll()) {
  .roycss-scroll-driven-progress-ring {
    animation: roy-scroll-ring-fallback 2s linear infinite alternate;
  }
  @keyframes roy-scroll-ring-fallback {
    0% {
      background:
        conic-gradient(oklch(0.567 0.159 275.21) 0deg, oklch(0.567 0.159 275.21) 0deg, oklch(0.274 0.005 286.03) 0deg, oklch(0.274 0.005 286.03) 360deg);
    }
    100% {
      background:
        conic-gradient(oklch(0.567 0.159 275.21) 0deg, oklch(0.567 0.159 275.21) 360deg, oklch(0.274 0.005 286.03) 360deg, oklch(0.274 0.005 286.03) 360deg);
    }
  }
}`
  },

  // =========================================================================
  // GLASS-UI (7) — Apple vibrancy, Material surface tones
  // =========================================================================
  {
    id: "apple-vibrancy-light",
    name: "Apple Vibrancy Light",
    category: "glass-ui",
    description: "Apple light vibrancy material with strong saturation boost",
    tags: ["apple", "vibrancy", "light", "glass"],
    previewType: "card",
    cssCode: `/* Apple Vibrancy Light */
.roycss-apple-vibrancy-light {
  background: color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
  backdrop-filter: blur(20px) saturate(180%) brightness(1.05);
  -webkit-backdrop-filter: blur(20px) saturate(180%) brightness(1.05);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 50%, transparent);
  border-radius: 14px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 70%, transparent) inset,
    0 10px 30px color-mix(in oklch, oklch(0 0 0) 10%, transparent);
  color: oklch(0.232 0.004 286.1);
}`
  },
  {
    id: "apple-vibrancy-dark",
    name: "Apple Vibrancy Dark",
    category: "glass-ui",
    description: "Apple dark vibrancy material with deep blur and saturate",
    tags: ["apple", "vibrancy", "dark", "glass"],
    previewType: "card",
    cssCode: `/* Apple Vibrancy Dark */
.roycss-apple-vibrancy-dark {
  background: color-mix(in oklch, oklch(0.236 0.004 286.11) 55%, transparent);
  backdrop-filter: blur(24px) saturate(180%) brightness(0.95);
  -webkit-backdrop-filter: blur(24px) saturate(180%) brightness(0.95);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 14px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 8%, transparent) inset,
    0 10px 30px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  color: oklch(0.971 0.003 286.35);
}`
  },
  {
    id: "apple-sidebar-material",
    name: "Apple Sidebar Material",
    category: "glass-ui",
    description: "Apple macOS sidebar material translucency with vertical gradient",
    tags: ["apple", "sidebar", "material", "translucent"],
    previewType: "card",
    cssCode: `/* Apple Sidebar Material */
.roycss-apple-sidebar-material {
  background: linear-gradient(
    180deg,
    color-mix(in oklch, oklch(0.971 0.003 286.35) 70%, transparent) 0%,
    color-mix(in oklch, oklch(0.941 0.007 286.27) 60%, transparent) 100%
  );
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border: 1px solid color-mix(in oklch, oklch(0 0 0) 6%, transparent);
  border-radius: 12px;
  box-shadow:
    inset 1px 0 0 color-mix(in oklch, oklch(1 0 89.88) 50%, transparent),
    0 6px 20px color-mix(in oklch, oklch(0 0 0) 10%, transparent);
  color: oklch(0.232 0.004 286.1);
}`
  },
  {
    id: "material-surface-tint",
    name: "Material Surface Tint",
    category: "glass-ui",
    description: "Material 3 surface tint color overlay with backdrop blur",
    tags: ["material", "surface", "tint", "m3"],
    previewType: "card",
    cssCode: `/* Material Surface Tint */
.roycss-material-surface-tint {
  position: relative;
  background: color-mix(in oklch, oklch(0.496 0.13 293.71) 8%, transparent);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid color-mix(in oklch, oklch(0.496 0.13 293.71) 15%, transparent);
  border-radius: 16px;
  color: oklch(0.225 0.008 297.21);
  box-shadow:
    0 1px 2px color-mix(in oklch, oklch(0 0 0) 10%, transparent),
    0 4px 12px color-mix(in oklch, oklch(0.496 0.13 293.71) 8%, transparent);
}`
  },
  {
    id: "apple-ultra-thin",
    name: "Apple Ultra Thin",
    category: "glass-ui",
    description: "Apple ultra-thin material with minimal blur for subtle separation",
    tags: ["apple", "ultra-thin", "material", "subtle"],
    previewType: "card",
    cssCode: `/* Apple Ultra Thin */
.roycss-apple-ultra-thin {
  background: color-mix(in oklch, oklch(1 0 89.88) 40%, transparent);
  backdrop-filter: blur(8px) saturate(110%);
  -webkit-backdrop-filter: blur(8px) saturate(110%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
  border-radius: 10px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) inset,
    0 2px 8px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
  color: oklch(0.232 0.004 286.1);
}`
  },
  {
    id: "glass-prism",
    name: "Glass Prism",
    category: "glass-ui",
    description: "Glass surface with prism-like rainbow border refraction",
    tags: ["glass", "prism", "rainbow", "refraction"],
    previewType: "card",
    cssCode: `/* Glass Prism */
.roycss-glass-prism {
  position: relative;
  background: color-mix(in oklch, oklch(1 0 89.88) 15%, transparent);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-radius: 16px;
  color: oklch(1 0 89.88);
}
.roycss-glass-prism::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(
    135deg,
    oklch(0.645 0.26 2.47), oklch(0.751 0.179 58.28), oklch(0.917 0.192 101.41), oklch(0.81 0.214 151.77), oklch(0.721 0.163 239.29), oklch(0.514 0.285 284.29), oklch(0.645 0.26 2.47)
  );
  background-size: 300% 300%;
  -webkit-mask: linear-gradient(oklch(0 0 0) 0 0) content-box, linear-gradient(oklch(0 0 0) 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: roy-prism-shift 6s linear infinite;
  opacity: 0.7;
  pointer-events: none;
}

@keyframes roy-prism-shift {
  0% { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}`
  },
  {
    id: "glass-depth-layer",
    name: "Glass Depth Layer",
    category: "glass-ui",
    description: "Multi-layered glass with stacked depth shadows and inner glow",
    tags: ["glass", "depth", "layered", "shadow"],
    previewType: "card",
    cssCode: `/* Glass Depth Layer */
.roycss-glass-depth-layer {
  position: relative;
  background: color-mix(in oklch, oklch(1 0 89.88) 18%, transparent);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 30%, transparent);
  border-radius: 18px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) inset,
    0 -1px 0 color-mix(in oklch, oklch(0 0 0) 5%, transparent) inset,
    0 2px 4px color-mix(in oklch, oklch(0 0 0) 8%, transparent),
    0 8px 16px color-mix(in oklch, oklch(0 0 0) 12%, transparent),
    0 20px 40px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  color: oklch(0.232 0.004 286.1);
}`
  }
];
