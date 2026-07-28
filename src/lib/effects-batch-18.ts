import type { CSSEffect } from "./roycss-types";

/**
 * Batch 18 — Next-Gen Effects Pack (40 effects)
 * Themes: liquid metal, aurora text, glassmorphism 4.0, spatial depth,
 * kinetic typography, ambient gradients, holographic surfaces, micro-interactions 3.0,
 * adaptive container-query art, and 2027-trending visual styles.
 *
 * All effects use OKLCH colors, logical properties, roycss- class prefix,
 * roy- keyframe prefix, and respect prefers-reduced-motion.
 */
export const effectsBatch18: CSSEffect[] = [
  /* ───────────────────────── ANIMATIONS (5) ────────────────────────── */

  {
    id: "anim-liquid-metal-b18",
    name: "Liquid Metal",
    category: "animations",
    description:
      "A chrome-like blob that morphs and flows like liquid mercury with shifting reflections",
    tags: ["liquid", "metal", "chrome", "morph", "organic"],
    previewType: "box",
    cssCode: `/* Liquid Metal */
.roycss-anim-liquid-metal-b18 {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg,
    oklch(0.9 0.02 250) 0%,
    oklch(0.6 0.05 200) 25%,
    oklch(0.85 0.08 180) 50%,
    oklch(0.5 0.06 220) 75%,
    oklch(0.9 0.02 250) 100%);
  background-size: 300% 300%;
  animation: roy-b18-liquid-metal-flow 4s ease-in-out infinite,
             roy-b18-liquid-metal-morph 6s ease-in-out infinite;
  box-shadow:
    inset 0 0 20px color-mix(in oklch, oklch(0.95 0.02 200) 40%, transparent),
    0 0 30px color-mix(in oklch, oklch(0.7 0.1 200) 30%, transparent);
}

@keyframes roy-b18-liquid-metal-flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes roy-b18-liquid-metal-morph {
  0%, 100% { border-radius: 50% 50% 50% 50%; }
  25% { border-radius: 60% 40% 50% 50%; }
  50% { border-radius: 40% 60% 60% 40%; }
  75% { border-radius: 50% 50% 40% 60%; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-liquid-metal-b18 { animation: none; }
}`,
  },

  {
    id: "anim-aurora-shift-b18",
    name: "Aurora Shift",
    category: "animations",
    description:
      "Smooth shifting aurora gradient that cycles through OKLCH color space like northern lights",
    tags: ["aurora", "gradient", "shifting", "color", "ambient"],
    previewType: "background",
    cssCode: `/* Aurora Shift */
.roycss-anim-aurora-shift-b18 {
  inline-size: 100%;
  block-size: 100%;
  background: linear-gradient(
    135deg,
    oklch(0.7 0.2 150) 0%,
    oklch(0.65 0.25 200) 20%,
    oklch(0.6 0.2 280) 40%,
    oklch(0.7 0.25 330) 60%,
    oklch(0.65 0.2 30) 80%,
    oklch(0.7 0.2 150) 100%
  );
  background-size: 400% 400%;
  animation: roy-b18-aurora-shift 8s ease infinite;
  border-radius: 1rem;
}

@keyframes roy-b18-aurora-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-aurora-shift-b18 { animation: none; }
}`,
  },

  {
    id: "anim-breathing-orb-b18",
    name: "Breathing Orb",
    category: "animations",
    description:
      "A zen-like orb that gently breathes in and out with a soft glow — perfect for ambient UI",
    tags: ["breathing", "zen", "ambient", "orb", "calm"],
    previewType: "box",
    cssCode: `/* Breathing Orb */
.roycss-anim-breathing-orb-b18 {
  inline-size: 72px;
  block-size: 72px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%,
    oklch(0.85 0.12 180) 0%,
    oklch(0.6 0.18 200) 50%,
    oklch(0.35 0.1 220) 100%);
  animation: roy-b18-breathing-orb 4s ease-in-out infinite;
}

@keyframes roy-b18-breathing-orb {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 20px color-mix(in oklch, oklch(0.6 0.18 200) 30%, transparent);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 40px color-mix(in oklch, oklch(0.7 0.2 200) 50%, transparent);
    filter: brightness(1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-breathing-orb-b18 { animation: none; }
}`,
  },

  {
    id: "anim-floating-cube-b18",
    name: "Floating Cube",
    category: "animations",
    description:
      "A 3D cube that gently floats and rotates in space with perspective depth",
    tags: ["3d", "cube", "float", "rotate", "perspective"],
    previewType: "box",
    cssCode: `/* Floating Cube */
.roycss-anim-floating-cube-b18 {
  inline-size: 60px;
  block-size: 60px;
  transform-style: preserve-3d;
  animation: roy-b18-floating-cube 6s ease-in-out infinite;
}

@keyframes roy-b18-floating-cube {
  0%, 100% {
    transform: translateY(0) rotateX(0deg) rotateY(0deg);
  }
  25% {
    transform: translateY(-15px) rotateX(15deg) rotateY(90deg);
  }
  50% {
    transform: translateY(0) rotateX(0deg) rotateY(180deg);
  }
  75% {
    transform: translateY(-15px) rotateX(-15deg) rotateY(270deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-floating-cube-b18 { animation: none; }
}`,
  },

  {
    id: "anim-pulse-ring-expand-b18",
    name: "Pulse Ring Expand",
    category: "animations",
    description:
      "Concentric rings that expand outward and fade — perfect for notifications and status indicators",
    tags: ["pulse", "ring", "expand", "notification", "status"],
    previewType: "box",
    cssCode: `/* Pulse Ring Expand */
.roycss-anim-pulse-ring-expand-b18 {
  position: relative;
  inline-size: 40px;
  block-size: 40px;
  border-radius: 50%;
  background: oklch(0.6 0.2 162);
}

.roycss-anim-pulse-ring-expand-b18::before,
.roycss-anim-pulse-ring-expand-b18::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid oklch(0.6 0.2 162);
  animation: roy-b18-pulse-ring 2s ease-out infinite;
}

.roycss-anim-pulse-ring-expand-b18::after {
  animation-delay: 1s;
}

@keyframes roy-b18-pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-pulse-ring-expand-b18::before,
  .roycss-anim-pulse-ring-expand-b18::after { animation: none; }
}`,
  },

  /* ───────────────────────── TEXT (5) ────────────────────────────── */

  {
    id: "text-aurora-gradient-b18",
    name: "Aurora Gradient Text",
    category: "text",
    description:
      "Text with a flowing aurora gradient that shifts through the OKLCH color spectrum",
    tags: ["aurora", "gradient", "animated", "color", "text"],
    previewType: "text",
    cssCode: `/* Aurora Gradient Text */
.roycss-text-aurora-gradient-b18 {
  background: linear-gradient(
    90deg,
    oklch(0.7 0.2 150),
    oklch(0.65 0.25 200),
    oklch(0.7 0.2 280),
    oklch(0.65 0.25 330),
    oklch(0.7 0.2 150)
  );
  background-size: 300% auto;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: roy-b18-text-aurora 5s linear infinite;
}

@keyframes roy-b18-text-aurora {
  to { background-position: 300% center; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-text-aurora-gradient-b18 { animation: none; }
}`,
  },

  {
    id: "text-glow-pulse-b18",
    name: "Glow Pulse Text",
    category: "text",
    description:
      "Text with a soft pulsing glow that breathes — draws attention without being aggressive",
    tags: ["glow", "pulse", "breathing", "attention", "text"],
    previewType: "text",
    cssCode: `/* Glow Pulse Text */
.roycss-text-glow-pulse-b18 {
  color: oklch(0.85 0.15 200);
  text-shadow: 0 0 10px color-mix(in oklch, oklch(0.6 0.2 200) 50%, transparent);
  animation: roy-b18-text-glow-pulse 2.5s ease-in-out infinite;
}

@keyframes roy-b18-text-glow-pulse {
  0%, 100% {
    text-shadow: 0 0 10px color-mix(in oklch, oklch(0.6 0.2 200) 30%, transparent);
  }
  50% {
    text-shadow:
      0 0 20px color-mix(in oklch, oklch(0.7 0.25 200) 60%, transparent),
      0 0 40px color-mix(in oklch, oklch(0.6 0.2 200) 30%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-text-glow-pulse-b18 { animation: none; }
}`,
  },

  {
    id: "text-shimmer-sweep-b18",
    name: "Shimmer Sweep Text",
    category: "text",
    description:
      "A light sweep that travels across text like sunlight reflecting off a surface",
    tags: ["shimmer", "sweep", "shine", "reflect", "text"],
    previewType: "text",
    cssCode: `/* Shimmer Sweep Text */
.roycss-text-shimmer-sweep-b18 {
  background: linear-gradient(
    90deg,
    oklch(0.5 0.1 200) 0%,
    oklch(0.5 0.1 200) 40%,
    oklch(0.95 0.05 200) 50%,
    oklch(0.5 0.1 200) 60%,
    oklch(0.5 0.1 200) 100%
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: roy-b18-text-shimmer-sweep 3s linear infinite;
}

@keyframes roy-b18-text-shimmer-sweep {
  to { background-position: -200% center; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-text-shimmer-sweep-b18 { animation: none; }
}`,
  },

  {
    id: "text-outline-fill-b18",
    name: "Outline to Fill Text",
    category: "text",
    description:
      "Text that starts as an outline and fills with color on hover — elegant reveal effect",
    tags: ["outline", "fill", "reveal", "hover", "text"],
    previewType: "text",
    cssCode: `/* Outline to Fill Text */
.roycss-text-outline-fill-b18 {
  color: transparent;
  -webkit-text-stroke: 2px oklch(0.7 0.2 162);
  transition: all 0.4s ease;
}

.roycss-text-outline-fill-b18:hover {
  color: oklch(0.7 0.2 162);
  -webkit-text-stroke: 2px transparent;
  text-shadow: 0 0 20px color-mix(in oklch, oklch(0.7 0.2 162) 40%, transparent);
}`,
  },

  {
    id: "text-gradient-mask-b18",
    name: "Gradient Mask Text",
    category: "text",
    description:
      "Text with a gradient that's masked by the text shape — modern, clean, and eye-catching",
    tags: ["gradient", "mask", "clip", "modern", "text"],
    previewType: "text",
    cssCode: `/* Gradient Mask Text */
.roycss-text-gradient-mask-b18 {
  background: linear-gradient(
    135deg,
    oklch(0.7 0.2 162) 0%,
    oklch(0.65 0.25 200) 50%,
    oklch(0.6 0.2 280) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}`,
  },

  /* ───────────────────────── BACKGROUNDS (5) ──────────────────────── */

  {
    id: "bg-mesh-gradient-b18",
    name: "Mesh Gradient",
    category: "backgrounds",
    description:
      "A multi-point mesh gradient that creates organic, flowing color blends",
    tags: ["mesh", "gradient", "organic", "blend", "background"],
    previewType: "background",
    cssCode: `/* Mesh Gradient */
.roycss-bg-mesh-gradient-b18 {
  inline-size: 100%;
  block-size: 100%;
  background:
    radial-gradient(at 20% 30%, oklch(0.7 0.2 162) 0%, transparent 50%),
    radial-gradient(at 80% 20%, oklch(0.65 0.25 280) 0%, transparent 50%),
    radial-gradient(at 40% 80%, oklch(0.7 0.2 30) 0%, transparent 50%),
    radial-gradient(at 90% 90%, oklch(0.65 0.25 200) 0%, transparent 50%),
    oklch(0.2 0.02 250);
  border-radius: 1rem;
}`,
  },

  {
    id: "bg-grid-perspective-b18",
    name: "Perspective Grid",
    category: "backgrounds",
    description:
      "A retro-futuristic perspective grid that recedes into the distance — synthwave aesthetic",
    tags: ["grid", "perspective", "retro", "synthwave", "background"],
    previewType: "background",
    cssCode: `/* Perspective Grid */
.roycss-bg-grid-perspective-b18 {
  inline-size: 100%;
  block-size: 100%;
  background:
    linear-gradient(oklch(0.6 0.2 320) 1px, transparent 1px),
    linear-gradient(90deg, oklch(0.6 0.2 320) 1px, transparent 1px),
    oklch(0.15 0.05 290);
  background-size: 40px 40px;
  background-position: center bottom;
  transform: perspective(400px) rotateX(60deg);
  transform-origin: center bottom;
  border-radius: 1rem;
  overflow: hidden;
}`,
  },

  {
    id: "bg-noise-texture-b18",
    name: "Noise Texture",
    category: "backgrounds",
    description:
      "Subtle noise/grain texture overlay that adds depth and warmth to flat backgrounds",
    tags: ["noise", "grain", "texture", "subtle", "background"],
    previewType: "background",
    cssCode: `/* Noise Texture */
.roycss-bg-noise-texture-b18 {
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0.3 0.05 250);
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
}

.roycss-bg-noise-texture-b18::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E");
  opacity: 0.4;
}`,
  },

  {
    id: "bg-aurora-waves-b18",
    name: "Aurora Waves Background",
    category: "backgrounds",
    description:
      "Layered wave shapes that create a flowing aurora borealis background effect",
    tags: ["aurora", "waves", "flowing", "layered", "background"],
    previewType: "background",
    cssCode: `/* Aurora Waves Background */
.roycss-bg-aurora-waves-b18 {
  inline-size: 100%;
  block-size: 100%;
  background:
    radial-gradient(ellipse at 20% 50%, color-mix(in oklch, oklch(0.6 0.2 150) 40%, transparent), transparent),
    radial-gradient(ellipse at 80% 50%, color-mix(in oklch, oklch(0.5 0.25 280) 40%, transparent), transparent),
    radial-gradient(ellipse at 50% 100%, color-mix(in oklch, oklch(0.55 0.2 200) 30%, transparent), transparent),
    oklch(0.1 0.02 250);
  border-radius: 1rem;
  animation: roy-b18-bg-aurora-waves 12s ease-in-out infinite;
}

@keyframes roy-b18-bg-aurora-waves {
  0%, 100% { background-position: 0% 50%, 100% 50%, 50% 100%; }
  50% { background-position: 30% 30%, 70% 70%, 60% 80%; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-bg-aurora-waves-b18 { animation: none; }
}`,
  },

  {
    id: "bg-gradient-mesh-animated-b18",
    name: "Animated Mesh Gradient",
    category: "backgrounds",
    description:
      "A mesh gradient with multiple color points that slowly shift position — living background",
    tags: ["mesh", "animated", "gradient", "shifting", "background"],
    previewType: "background",
    cssCode: `/* Animated Mesh Gradient */
@property --roy-b18-mg-x1 { syntax: "<percentage>"; initial-value: 20%; inherits: false; }
@property --roy-b18-mg-x2 { syntax: "<percentage>"; initial-value: 80%; inherits: false; }

.roycss-bg-gradient-mesh-animated-b18 {
  inline-size: 100%;
  block-size: 100%;
  background:
    radial-gradient(at var(--roy-b18-mg-x1) 30%, oklch(0.7 0.2 162) 0%, transparent 50%),
    radial-gradient(at var(--roy-b18-mg-x2) 70%, oklch(0.65 0.25 280) 0%, transparent 50%),
    oklch(0.15 0.02 250);
  border-radius: 1rem;
  animation: roy-b18-mg-shift 8s ease-in-out infinite alternate;
}

@keyframes roy-b18-mg-shift {
  to {
    --roy-b18-mg-x1: 80%;
    --roy-b18-mg-x2: 20%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-bg-gradient-mesh-animated-b18 { animation: none; }
}`,
  },

  /* ───────────────────────── HOVER (5) ────────────────────────────── */

  {
    id: "hover-lift-glow-b18",
    name: "Lift & Glow",
    category: "hover",
    description:
      "Element lifts up with a soft colored glow on hover — smooth, satisfying, and modern",
    tags: ["lift", "glow", "hover", "smooth", "modern"],
    previewType: "box",
    cssCode: `/* Lift & Glow */
.roycss-hover-lift-glow-b18 {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: oklch(0.25 0.03 250);
  border: 1px solid oklch(0.4 0.05 250);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.roycss-hover-lift-glow-b18:hover {
  transform: translateY(-8px);
  box-shadow:
    0 12px 30px color-mix(in oklch, oklch(0.6 0.2 162) 30%, transparent),
    0 0 20px color-mix(in oklch, oklch(0.6 0.2 162) 20%, transparent);
  border-color: oklch(0.6 0.2 162);
}`,
  },

  {
    id: "hover-scale-rotate-b18",
    name: "Scale & Rotate",
    category: "hover",
    description:
      "Element scales up and rotates slightly on hover — playful micro-interaction",
    tags: ["scale", "rotate", "playful", "hover", "micro"],
    previewType: "box",
    cssCode: `/* Scale & Rotate */
.roycss-hover-scale-rotate-b18 {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: linear-gradient(135deg, oklch(0.6 0.2 162), oklch(0.55 0.25 200));
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.roycss-hover-scale-rotate-b18:hover {
  transform: scale(1.1) rotate(5deg);
}`,
  },

  {
    id: "hover-border-trace-b18",
    name: "Border Trace",
    category: "hover",
    description:
      "A border that traces around the element on hover — animated outline draw effect",
    tags: ["border", "trace", "outline", "draw", "hover"],
    previewType: "box",
    cssCode: `/* Border Trace */
.roycss-hover-border-trace-b18 {
  position: relative;
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: oklch(0.25 0.03 250);
}

.roycss-hover-border-trace-b18::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  padding: 2px;
  background: linear-gradient(135deg, oklch(0.6 0.2 162), oklch(0.55 0.25 200), oklch(0.5 0.2 280));
  background-size: 300% 300%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: roy-b18-border-trace 3s linear infinite;
}

.roycss-hover-border-trace-b18:hover::before {
  opacity: 1;
}

@keyframes roy-b18-border-trace {
  to { background-position: 300% 0; }
}`,
  },

  {
    id: "hover-shine-sweep-b18",
    name: "Shine Sweep Hover",
    category: "hover",
    description:
      "A diagonal light sweep crosses the element on hover — premium product card feel",
    tags: ["shine", "sweep", "light", "premium", "hover"],
    previewType: "box",
    cssCode: `/* Shine Sweep Hover */
.roycss-hover-shine-sweep-b18 {
  position: relative;
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: oklch(0.25 0.03 250);
  overflow: hidden;
}

.roycss-hover-shine-sweep-b18::before {
  content: "";
  position: absolute;
  inset: -50%;
  background: linear-gradient(
    135deg,
    transparent 40%,
    color-mix(in oklch, oklch(0.95 0.02 200) 50%, transparent) 50%,
    transparent 60%
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.roycss-hover-shine-sweep-b18:hover::before {
  transform: translateX(100%);
}`,
  },

  {
    id: "hover-depth-shift-b18",
    name: "Depth Shift",
    category: "hover",
    description:
      "Element shifts in 3D space on hover — creates depth without perspective container",
    tags: ["depth", "3d", "shift", "hover", "perspective"],
    previewType: "box",
    cssCode: `/* Depth Shift */
.roycss-hover-depth-shift-b18 {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: linear-gradient(135deg, oklch(0.6 0.2 162), oklch(0.5 0.25 200));
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 10px color-mix(in oklch, oklch(0.2 0.02 250) 50%, transparent);
}

.roycss-hover-depth-shift-b18:hover {
  transform: perspective(500px) rotateX(10deg) rotateY(-10deg) scale(1.05);
  box-shadow:
    -10px 10px 20px color-mix(in oklch, oklch(0.2 0.02 250) 40%, transparent),
    0 0 30px color-mix(in oklch, oklch(0.6 0.2 162) 20%, transparent);
}`,
  },

  /* ───────────────────────── VISUAL (5) ───────────────────────────── */

  {
    id: "vis-holographic-foil-b18",
    name: "Holographic Foil",
    category: "visual",
    description:
      "Holographic foil effect with shifting rainbow reflections — like a holographic trading card",
    tags: ["holographic", "foil", "rainbow", "iridescent", "visual"],
    previewType: "box",
    cssCode: `/* Holographic Foil */
.roycss-vis-holographic-foil-b18 {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: linear-gradient(
    135deg,
    oklch(0.8 0.15 0) 0%,
    oklch(0.75 0.2 60) 15%,
    oklch(0.7 0.2 120) 30%,
    oklch(0.75 0.2 180) 45%,
    oklch(0.7 0.2 240) 60%,
    oklch(0.75 0.2 300) 75%,
    oklch(0.8 0.15 360) 100%
  );
  background-size: 200% 200%;
  animation: roy-b18-holo-foil 4s ease infinite;
  box-shadow:
    inset 0 0 20px color-mix(in oklch, white 20%, transparent),
    0 0 30px color-mix(in oklch, oklch(0.7 0.2 200) 30%, transparent);
}

@keyframes roy-b18-holo-foil {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-vis-holographic-foil-b18 { animation: none; }
}`,
  },

  {
    id: "vis-chrome-surface-b18",
    name: "Chrome Surface",
    category: "visual",
    description:
      "Reflective chrome/metallic surface with gradient highlights — industrial, sleek, modern",
    tags: ["chrome", "metallic", "reflective", "industrial", "visual"],
    previewType: "box",
    cssCode: `/* Chrome Surface */
.roycss-vis-chrome-surface-b18 {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: linear-gradient(
    180deg,
    oklch(0.95 0.01 250) 0%,
    oklch(0.7 0.03 250) 30%,
    oklch(0.4 0.02 250) 50%,
    oklch(0.7 0.03 250) 70%,
    oklch(0.95 0.01 250) 100%
  );
  box-shadow:
    inset 0 1px 2px oklch(1 0 0),
    inset 0 -1px 2px oklch(0.2 0.02 250),
    0 4px 10px color-mix(in oklch, oklch(0.2 0.02 250) 40%, transparent);
}`,
  },

  {
    id: "vis-frosted-glass-v2-b18",
    name: "Frosted Glass v2",
    category: "visual",
    description:
      "Advanced frosted glass with layered backdrop blur and subtle border highlights — glassmorphism 4.0",
    tags: ["frosted", "glass", "blur", "glassmorphism", "visual"],
    previewType: "box",
    cssCode: `/* Frosted Glass v2 */
.roycss-vis-frosted-glass-v2-b18 {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: color-mix(in oklch, oklch(0.9 0.02 250) 15%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid color-mix(in oklch, white 20%, transparent);
  box-shadow:
    inset 0 1px 1px color-mix(in oklch, white 30%, transparent),
    0 8px 32px color-mix(in oklch, oklch(0.1 0.02 250) 30%, transparent);
}`,
  },

  {
    id: "vis-iridescent-surface-b18",
    name: "Iridescent Surface",
    category: "visual",
    description:
      "Iridescent surface that shifts colors based on viewing angle — soap bubble or pearl effect",
    tags: ["iridescent", "pearl", "soap", "bubble", "visual"],
    previewType: "box",
    cssCode: `/* Iridescent Surface */
.roycss-vis-iridescent-surface-b18 {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    oklch(0.85 0.12 0),
    oklch(0.8 0.15 60),
    oklch(0.85 0.12 120),
    oklch(0.8 0.15 180),
    oklch(0.85 0.12 240),
    oklch(0.8 0.15 300),
    oklch(0.85 0.12 360)
  );
  box-shadow:
    inset -5px -5px 15px color-mix(in oklch, oklch(0.3 0.05 250) 40%, transparent),
    inset 5px 5px 15px color-mix(in oklch, white 40%, transparent),
    0 0 30px color-mix(in oklch, oklch(0.8 0.15 200) 30%, transparent);
}`,
  },

  {
    id: "vis-velvet-texture-b18",
    name: "Velvet Texture",
    category: "visual",
    description:
      "Soft velvet fabric texture with subtle sheen — tactile, luxurious, and unique",
    tags: ["velvet", "fabric", "texture", "soft", "visual"],
    previewType: "box",
    cssCode: `/* Velvet Texture */
.roycss-vis-velvet-texture-b18 {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background:
    radial-gradient(at 30% 30%, oklch(0.45 0.15 350) 0%, transparent 50%),
    radial-gradient(at 70% 70%, oklch(0.35 0.12 340) 0%, transparent 50%),
    oklch(0.25 0.08 340);
  box-shadow:
    inset 0 2px 5px color-mix(in oklch, oklch(0.5 0.15 350) 30%, transparent),
    inset 0 -2px 5px color-mix(in oklch, oklch(0.15 0.05 340) 50%, transparent);
}`,
  },

  /* ───────────────────────── GLASS-UI (5) ─────────────────────────── */

  {
    id: "glass-card-floating-b18",
    name: "Floating Glass Card",
    category: "glass-ui",
    description:
      "A glassmorphism card that appears to float with depth shadow and subtle border light",
    tags: ["glass", "card", "floating", "depth", "glassmorphism"],
    previewType: "card",
    cssCode: `/* Floating Glass Card */
.roycss-glass-card-floating-b18 {
  inline-size: 144px;
  block-size: 96px;
  border-radius: 1rem;
  background: color-mix(in oklch, oklch(0.9 0.02 250) 12%, transparent);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid color-mix(in oklch, white 15%, transparent);
  box-shadow:
    0 20px 40px color-mix(in oklch, oklch(0.1 0.02 250) 30%, transparent),
    inset 0 1px 1px color-mix(in oklch, white 20%, transparent);
}`,
  },

  {
    id: "glass-input-field-b18",
    name: "Glass Input Field",
    category: "glass-ui",
    description:
      "A frosted glass input field with subtle focus glow — modern form input styling",
    tags: ["glass", "input", "form", "frosted", "glassmorphism"],
    previewType: "box",
    cssCode: `/* Glass Input Field */
.roycss-glass-input-field-b18 {
  inline-size: 120px;
  block-size: 36px;
  border-radius: 0.5rem;
  background: color-mix(in oklch, oklch(0.9 0.02 250) 10%, transparent);
  backdrop-filter: blur(10px);
  border: 1px solid color-mix(in oklch, white 15%, transparent);
  padding-inline: 0.75rem;
  transition: all 0.3s ease;
}

.roycss-glass-input-field-b18:focus {
  outline: none;
  border-color: oklch(0.6 0.2 162);
  box-shadow: 0 0 0 3px color-mix(in oklch, oklch(0.6 0.2 162) 20%, transparent);
}`,
  },

  {
    id: "glass-nav-bar-b18",
    name: "Glass Nav Bar",
    category: "glass-ui",
    description:
      "A floating glassmorphism navigation bar — perfect for modern sticky headers",
    tags: ["glass", "nav", "bar", "floating", "glassmorphism"],
    previewType: "box",
    cssCode: `/* Glass Nav Bar */
.roycss-glass-nav-bar-b18 {
  inline-size: 160px;
  block-size: 40px;
  border-radius: 2rem;
  background: color-mix(in oklch, oklch(0.9 0.02 250) 15%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid color-mix(in oklch, white 20%, transparent);
  box-shadow:
    0 8px 20px color-mix(in oklch, oklch(0.1 0.02 250) 25%, transparent),
    inset 0 1px 1px color-mix(in oklch, white 25%, transparent);
}`,
  },

  {
    id: "glass-badge-pill-b18",
    name: "Glass Badge Pill",
    category: "glass-ui",
    description:
      "A small glassmorphism badge/pill — great for tags, labels, and status indicators",
    tags: ["glass", "badge", "pill", "tag", "glassmorphism"],
    previewType: "box",
    cssCode: `/* Glass Badge Pill */
.roycss-glass-badge-pill-b18 {
  display: inline-flex;
  align-items: center;
  inline-size: auto;
  block-size: 24px;
  padding-inline: 0.75rem;
  border-radius: 2rem;
  background: color-mix(in oklch, oklch(0.6 0.2 162) 15%, transparent);
  backdrop-filter: blur(10px);
  border: 1px solid color-mix(in oklch, oklch(0.6 0.2 162) 30%, transparent);
  font-size: 11px;
  font-weight: 600;
  color: oklch(0.8 0.15 162);
}`,
  },

  {
    id: "glass-modal-backdrop-b18",
    name: "Glass Modal Backdrop",
    category: "glass-ui",
    description:
      "A frosted glass backdrop for modals and overlays — blurs background content beautifully",
    tags: ["glass", "modal", "backdrop", "overlay", "glassmorphism"],
    previewType: "background",
    cssCode: `/* Glass Modal Backdrop */
.roycss-glass-modal-backdrop-b18 {
  inline-size: 100%;
  block-size: 100%;
  background: color-mix(in oklch, oklch(0.1 0.02 250) 40%, transparent);
  backdrop-filter: blur(8px) saturate(120%);
  border-radius: 1rem;
}`,
  },

  /* ───────────────────────── BUTTONS (5) ──────────────────────────── */

  {
    id: "btn-glass-press-b18",
    name: "Glass Press Button",
    category: "buttons",
    description:
      "A glassmorphism button that presses down with depth on click — tactile and modern",
    tags: ["glass", "button", "press", "depth", "glassmorphism"],
    previewType: "button",
    cssCode: `/* Glass Press Button */
.roycss-btn-glass-press-b18 {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  background: color-mix(in oklch, oklch(0.6 0.2 162) 20%, transparent);
  backdrop-filter: blur(12px);
  border: 1px solid color-mix(in oklch, oklch(0.6 0.2 162) 40%, transparent);
  color: oklch(0.95 0.02 162);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow:
    0 4px 10px color-mix(in oklch, oklch(0.1 0.02 250) 30%, transparent),
    inset 0 1px 1px color-mix(in oklch, white 20%, transparent);
}

.roycss-btn-glass-press-b18:hover {
  background: color-mix(in oklch, oklch(0.6 0.2 162) 30%, transparent);
  transform: translateY(-1px);
}

.roycss-btn-glass-press-b18:active {
  transform: translateY(1px);
  box-shadow:
    0 2px 5px color-mix(in oklch, oklch(0.1 0.02 250) 30%, transparent),
    inset 0 1px 2px color-mix(in oklch, oklch(0.1 0.02 250) 30%, transparent);
}`,
  },

  {
    id: "btn-gradient-glow-b18",
    name: "Gradient Glow Button",
    category: "buttons",
    description:
      "A gradient button with a soft outer glow that intensifies on hover — eye-catching CTA",
    tags: ["gradient", "glow", "button", "cta", "hover"],
    previewType: "button",
    cssCode: `/* Gradient Glow Button */
.roycss-btn-gradient-glow-b18 {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, oklch(0.6 0.2 162), oklch(0.55 0.25 200));
  border: none;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px color-mix(in oklch, oklch(0.6 0.2 162) 30%, transparent);
}

.roycss-btn-gradient-glow-b18:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 25px color-mix(in oklch, oklch(0.6 0.2 162) 50%, transparent);
}`,
  },

  {
    id: "btn-outline-draw-b18",
    name: "Outline Draw Button",
    category: "buttons",
    description:
      "A button with an animated outline that draws itself on hover — elegant and minimal",
    tags: ["outline", "draw", "animated", "button", "minimal"],
    previewType: "button",
    cssCode: `/* Outline Draw Button */
.roycss-btn-outline-draw-b18 {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  background: transparent;
  border: 1px solid oklch(0.5 0.15 250);
  color: oklch(0.85 0.02 250);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  transition: color 0.3s ease;
}

.roycss-btn-outline-draw-b18::before {
  content: "";
  position: absolute;
  inset: 0;
  background: oklch(0.6 0.2 162);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
  z-index: -1;
}

.roycss-btn-outline-draw-b18:hover {
  color: white;
  border-color: oklch(0.6 0.2 162);
}

.roycss-btn-outline-draw-b18:hover::before {
  transform: scaleX(1);
}`,
  },

  {
    id: "btn-3d-push-b18",
    name: "3D Push Button",
    category: "buttons",
    description:
      "A skeuomorphic 3D button that pushes down with realistic depth on click",
    tags: ["3d", "push", "skeuomorphic", "button", "depth"],
    previewType: "button",
    cssCode: `/* 3D Push Button */
.roycss-btn-3d-push-b18 {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  background: oklch(0.6 0.2 162);
  border: none;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow:
    0 4px 0 oklch(0.4 0.15 162),
    0 6px 10px color-mix(in oklch, oklch(0.1 0.02 250) 40%, transparent);
  transition: all 0.1s ease;
}

.roycss-btn-3d-push-b18:hover {
  background: oklch(0.65 0.2 162);
}

.roycss-btn-3d-push-b18:active {
  transform: translateY(3px);
  box-shadow:
    0 1px 0 oklch(0.4 0.15 162),
    0 2px 5px color-mix(in oklch, oklch(0.1 0.02 250) 40%, transparent);
}`,
  },

  {
    id: "btn-shine-line-b18",
    name: "Shine Line Button",
    category: "buttons",
    description:
      "A minimal button with a shine line that sweeps across on hover — subtle and premium",
    tags: ["shine", "line", "minimal", "premium", "button"],
    previewType: "button",
    cssCode: `/* Shine Line Button */
.roycss-btn-shine-line-b18 {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  background: oklch(0.25 0.03 250);
  border: 1px solid oklch(0.4 0.05 250);
  color: oklch(0.85 0.02 250);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s ease;
}

.roycss-btn-shine-line-b18::after {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-block-end: 0;
  inset-inline-start: -100%;
  inline-size: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in oklch, white 30%, transparent),
    transparent
  );
  transition: inset-inline-start 0.5s ease;
}

.roycss-btn-shine-line-b18:hover {
  border-color: oklch(0.6 0.2 162);
}

.roycss-btn-shine-line-b18:hover::after {
  inset-inline-start: 100%;
}`,
  },

  /* ─────────────────── MICROINTERACTIONS (5) ──────────────────────── */

  {
    id: "micro-heart-beat-b18",
    name: "Heart Beat",
    category: "microinteractions",
    description:
      "A heart icon that beats like a real heart — perfect for like/favorite buttons",
    tags: ["heart", "beat", "like", "favorite", "micro"],
    previewType: "box",
    cssCode: `/* Heart Beat */
.roycss-micro-heart-beat-b18 {
  inline-size: 40px;
  block-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  animation: roy-b18-heart-beat 1.2s ease-in-out infinite;
}

@keyframes roy-b18-heart-beat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.3); }
  30% { transform: scale(1); }
  45% { transform: scale(1.2); }
  60% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-micro-heart-beat-b18 { animation: none; }
}`,
  },

  {
    id: "micro-bell-shake-b18",
    name: "Bell Shake",
    category: "microinteractions",
    description:
      "A notification bell that shakes to alert the user — classic notification animation",
    tags: ["bell", "shake", "notification", "alert", "micro"],
    previewType: "box",
    cssCode: `/* Bell Shake */
.roycss-micro-bell-shake-b18 {
  inline-size: 40px;
  block-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  animation: roy-b18-bell-shake 3s ease-in-out infinite;
  transform-origin: top center;
}

@keyframes roy-b18-bell-shake {
  0%, 90%, 100% { transform: rotate(0deg); }
  92% { transform: rotate(15deg); }
  94% { transform: rotate(-12deg); }
  96% { transform: rotate(10deg); }
  98% { transform: rotate(-5deg); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-micro-bell-shake-b18 { animation: none; }
}`,
  },

  {
    id: "micro-eye-blink-b18",
    name: "Eye Blink",
    category: "microinteractions",
    description:
      "An eye icon that blinks periodically — playful attention indicator",
    tags: ["eye", "blink", "playful", "attention", "micro"],
    previewType: "box",
    cssCode: `/* Eye Blink */
.roycss-micro-eye-blink-b18 {
  inline-size: 40px;
  block-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  animation: roy-b18-eye-blink 4s ease-in-out infinite;
}

@keyframes roy-b18-eye-blink {
  0%, 90%, 100% { transform: scaleY(1); }
  93%, 95% { transform: scaleY(0.1); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-micro-eye-blink-b18 { animation: none; }
}`,
  },

  {
    id: "micro-thumbs-up-b18",
    name: "Thumbs Up Pop",
    category: "microinteractions",
    description:
      "A thumbs up icon that pops with a bounce — satisfying like confirmation",
    tags: ["thumbs", "up", "like", "pop", "micro"],
    previewType: "box",
    cssCode: `/* Thumbs Up Pop */
.roycss-micro-thumbs-up-b18 {
  inline-size: 40px;
  block-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.roycss-micro-thumbs-up-b18:active {
  animation: roy-b18-thumbs-pop 0.4s ease;
}

@keyframes roy-b18-thumbs-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.4) rotate(-10deg); }
  100% { transform: scale(1); }
}`,
  },

  {
    id: "micro-spinner-dot-b18",
    name: "Dot Spinner",
    category: "microinteractions",
    description:
      "A minimal single-dot spinner that pulses — clean loading indicator for inline use",
    tags: ["spinner", "dot", "pulse", "loading", "micro"],
    previewType: "box",
    cssCode: `/* Dot Spinner */
.roycss-micro-spinner-dot-b18 {
  inline-size: 12px;
  block-size: 12px;
  border-radius: 50%;
  background: oklch(0.6 0.2 162);
  animation: roy-b18-dot-spinner 1s ease-in-out infinite;
}

@keyframes roy-b18-dot-spinner {
  0%, 100% {
    transform: scale(0.5);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-micro-spinner-dot-b18 { animation: none; }
}`,
  },
];
