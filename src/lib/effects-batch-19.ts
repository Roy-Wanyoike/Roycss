import type { CSSEffect } from "./roycss-types";

/**
 * Batch 19 — Advanced Effects Pack (40 effects)
 * Themes: neon cyberpunk, organic motion, spatial UI, kinetic systems,
 * ambient computing, glass 5.0, retro-futurism, micro-animations,
 * container-query art, and next-gen visual styles.
 *
 * All effects use OKLCH colors, logical properties, roycss- class prefix,
 * roy- keyframe prefix, and respect prefers-reduced-motion.
 */
export const effectsBatch19: CSSEffect[] = [
  /* ───────────────────────── ANIMATIONS (6) ────────────────────────── */

  {
    id: "anim-orbit-system",
    name: "Orbit System",
    category: "animations",
    description:
      "Multiple particles orbiting a central point at different speeds — solar system aesthetic",
    tags: ["orbit", "solar", "system", "particles", "space"],
    previewType: "box",
    childCount: 3,
    cssCode: `/* Orbit System */
.roycss-anim-orbit-system {
  position: relative;
  inline-size: 80px;
  block-size: 80px;
}

.roycss-anim-orbit-system > span {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 8px;
  block-size: 8px;
  margin: -4px;
  border-radius: 50%;
  background: oklch(0.7 0.2 162);
}

.roycss-anim-orbit-system > span:nth-child(1) {
  animation: roy-orbit-1 3s linear infinite;
}
.roycss-anim-orbit-system > span:nth-child(2) {
  background: oklch(0.65 0.25 280);
  animation: roy-orbit-2 5s linear infinite;
}
.roycss-anim-orbit-system > span:nth-child(3) {
  background: oklch(0.7 0.2 30);
  animation: roy-orbit-3 7s linear infinite;
}

@keyframes roy-orbit-1 {
  from { transform: rotate(0deg) translateX(20px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
}
@keyframes roy-orbit-2 {
  from { transform: rotate(0deg) translateX(30px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(30px) rotate(-360deg); }
}
@keyframes roy-orbit-3 {
  from { transform: rotate(0deg) translateX(38px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(38px) rotate(-360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-orbit-system > span { animation: none; }
}`,
  },

  {
    id: "anim-wave-flag",
    name: "Wave Flag",
    category: "animations",
    description:
      "A rectangular element that ripples like a flag waving in the wind — organic motion",
    tags: ["wave", "flag", "ripple", "wind", "organic"],
    previewType: "background",
    cssCode: `/* Wave Flag */
.roycss-anim-wave-flag {
  inline-size: 100%;
  block-size: 100%;
  background: linear-gradient(135deg, oklch(0.6 0.2 162), oklch(0.55 0.25 200));
  border-radius: 0.5rem;
  animation: roy-wave-flag 2s ease-in-out infinite;
  transform-origin: left center;
}

@keyframes roy-wave-flag {
  0%, 100% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
  25% { transform: perspective(400px) rotateY(-5deg) skewY(2deg); }
  50% { transform: perspective(400px) rotateY(0deg) skewY(0deg); }
  75% { transform: perspective(400px) rotateY(5deg) skewY(-2deg); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-wave-flag { animation: none; }
}`,
  },

  {
    id: "anim-morph-blob",
    name: "Morph Blob",
    category: "animations",
    description:
      "An organic blob that continuously morphs its border-radius — fluid, living shape",
    tags: ["morph", "blob", "organic", "fluid", "shape"],
    previewType: "box",
    cssCode: `/* Morph Blob */
.roycss-anim-morph-blob {
  inline-size: 80px;
  block-size: 80px;
  background: linear-gradient(135deg, oklch(0.65 0.25 280), oklch(0.6 0.2 330));
  animation: roy-morph-blob 8s ease-in-out infinite;
}

@keyframes roy-morph-blob {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  50% { border-radius: 50% 50% 20% 80% / 25% 80% 20% 75%; }
  75% { border-radius: 70% 30% 50% 50% / 30% 50% 70% 70%; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-morph-blob { animation: none; border-radius: 50%; }
}`,
  },

  {
    id: "anim-gradient-rotate",
    name: "Gradient Rotate",
    category: "animations",
    description:
      "A conic gradient that rotates continuously — creates a spinning color wheel effect",
    tags: ["gradient", "conic", "rotate", "color", "wheel"],
    previewType: "box",
    cssCode: `/* Gradient Rotate */
.roycss-anim-gradient-rotate {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    oklch(0.7 0.2 0),
    oklch(0.7 0.2 60),
    oklch(0.7 0.2 120),
    oklch(0.7 0.2 180),
    oklch(0.7 0.2 240),
    oklch(0.7 0.2 300),
    oklch(0.7 0.2 360)
  );
  animation: roy-gradient-rotate 4s linear infinite;
}

@keyframes roy-gradient-rotate {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-gradient-rotate { animation: none; }
}`,
  },

  {
    id: "anim-typewriter-cursor",
    name: "Typewriter Cursor",
    category: "animations",
    description:
      "A blinking cursor that simulates a typewriter — perfect for hero text and terminals",
    tags: ["typewriter", "cursor", "blink", "terminal", "text"],
    previewType: "box",
    cssCode: `/* Typewriter Cursor */
.roycss-anim-typewriter-cursor {
  inline-size: 4px;
  block-size: 24px;
  background: oklch(0.7 0.2 162);
  animation: roy-cursor-blink 1s step-end infinite;
}

@keyframes roy-cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-typewriter-cursor { animation: none; opacity: 1; }
}`,
  },

  {
    id: "anim-pulse-dot-grid",
    name: "Pulse Dot Grid",
    category: "animations",
    description:
      "A grid of dots that pulse in a wave pattern — ambient background animation",
    tags: ["pulse", "dots", "grid", "wave", "ambient"],
    previewType: "background",
    cssCode: `/* Pulse Dot Grid */
.roycss-anim-pulse-dot-grid {
  inline-size: 100%;
  block-size: 100%;
  background-image: radial-gradient(oklch(0.6 0.2 162) 1.5px, transparent 1.5px);
  background-size: 20px 20px;
  border-radius: 1rem;
  animation: roy-pulse-dot-grid 3s ease-in-out infinite;
}

@keyframes roy-pulse-dot-grid {
  0%, 100% { background-position: 0 0; opacity: 0.6; }
  50% { background-position: 10px 10px; opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-anim-pulse-dot-grid { animation: none; }
}`,
  },

  /* ───────────────────────── TEXT (5) ────────────────────────────── */

  {
    id: "text-neon-sign",
    name: "Neon Sign",
    category: "text",
    description:
      "Text styled like a glowing neon sign with flicker animation — retro bar sign aesthetic",
    tags: ["neon", "sign", "glow", "flicker", "retro"],
    previewType: "text",
    cssCode: `/* Neon Sign */
.roycss-text-neon-sign {
  color: oklch(0.85 0.2 330);
  text-shadow:
    0 0 5px oklch(0.7 0.25 330),
    0 0 10px oklch(0.7 0.25 330),
    0 0 20px oklch(0.6 0.25 330),
    0 0 40px oklch(0.5 0.25 330);
  animation: roy-neon-flicker 3s linear infinite;
}

@keyframes roy-neon-flicker {
  0%, 100% { opacity: 1; }
  41% { opacity: 1; }
  42% { opacity: 0.8; }
  43% { opacity: 1; }
  45% { opacity: 0.3; }
  46% { opacity: 1; }
  77% { opacity: 1; }
  78% { opacity: 0.5; }
  79% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-text-neon-sign { animation: none; }
}`,
  },

  {
    id: "text-retro-outline",
    name: "Retro Outline",
    category: "text",
    description:
      "Bold outlined text with a retro 80s aesthetic — vaporwave and synthwave vibes",
    tags: ["retro", "outline", "80s", "vaporwave", "synthwave"],
    previewType: "text",
    cssCode: `/* Retro Outline */
.roycss-text-retro-outline {
  color: transparent;
  -webkit-text-stroke: 2px oklch(0.8 0.2 320);
  text-shadow: 3px 3px 0 oklch(0.5 0.25 200);
}`,
  },

  {
    id: "text-gradient-animated",
    name: "Animated Gradient Text",
    category: "text",
    description:
      "Text with a continuously flowing gradient — colors shift smoothly across the text",
    tags: ["gradient", "animated", "flowing", "color", "text"],
    previewType: "text",
    cssCode: `/* Animated Gradient Text */
.roycss-text-gradient-animated {
  background: linear-gradient(
    90deg,
    oklch(0.7 0.2 162),
    oklch(0.65 0.25 200),
    oklch(0.7 0.2 280),
    oklch(0.65 0.25 330),
    oklch(0.7 0.2 162)
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: roy-text-gradient-flow 4s linear infinite;
}

@keyframes roy-text-gradient-flow {
  to { background-position: 200% center; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-text-gradient-animated { animation: none; }
}`,
  },

  {
    id: "text-3d-extrude",
    name: "3D Extrude Text",
    category: "text",
    description:
      "Text with a 3D extruded shadow effect — pops off the page with depth",
    tags: ["3d", "extrude", "depth", "shadow", "text"],
    previewType: "text",
    cssCode: `/* 3D Extrude Text */
.roycss-text-3d-extrude {
  color: oklch(0.7 0.2 162);
  text-shadow:
    1px 1px 0 oklch(0.6 0.18 162),
    2px 2px 0 oklch(0.5 0.16 162),
    3px 3px 0 oklch(0.45 0.14 162),
    4px 4px 0 oklch(0.4 0.12 162),
    5px 5px 0 oklch(0.35 0.1 162),
    6px 6px 10px color-mix(in oklch, oklch(0.1 0.02 250) 50%, transparent);
}`,
  },

  {
    id: "text-spaced-tracking",
    name: "Spaced Tracking",
    category: "text",
    description:
      "Text with wide letter-spacing that animates to normal on hover — elegant reveal",
    tags: ["spaced", "tracking", "letterspacing", "elegant", "reveal"],
    previewType: "text",
    cssCode: `/* Spaced Tracking */
.roycss-text-spaced-tracking {
  letter-spacing: 0.5em;
  transition: letter-spacing 0.5s ease;
}

.roycss-text-spaced-tracking:hover {
  letter-spacing: 0.05em;
}`,
  },

  /* ───────────────────────── BACKGROUNDS (5) ──────────────────────── */

  {
    id: "bg-cyber-grid",
    name: "Cyber Grid",
    category: "backgrounds",
    description:
      "A futuristic cyberpunk grid background with glowing intersection points",
    tags: ["cyber", "grid", "futuristic", "glow", "cyberpunk"],
    previewType: "background",
    cssCode: `/* Cyber Grid */
.roycss-bg-cyber-grid {
  inline-size: 100%;
  block-size: 100%;
  background-color: oklch(0.1 0.02 250);
  background-image:
    linear-gradient(color-mix(in oklch, oklch(0.6 0.25 180) 30%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in oklch, oklch(0.6 0.25 180) 30%, transparent) 1px, transparent 1px);
  background-size: 30px 30px;
  border-radius: 1rem;
}`,
  },

  {
    id: "bg-gradient-conic",
    name: "Conic Gradient",
    category: "backgrounds",
    description:
      "A conic gradient that creates a pie-wheel of colors radiating from the center",
    tags: ["conic", "gradient", "pie", "wheel", "radial"],
    previewType: "background",
    cssCode: `/* Conic Gradient */
.roycss-bg-gradient-conic {
  inline-size: 100%;
  block-size: 100%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    oklch(0.7 0.2 0),
    oklch(0.7 0.2 60),
    oklch(0.7 0.2 120),
    oklch(0.7 0.2 180),
    oklch(0.7 0.2 240),
    oklch(0.7 0.2 300),
    oklch(0.7 0.2 360)
  );
  border-radius: 1rem;
}`,
  },

  {
    id: "bg-dot-pattern",
    name: "Dot Pattern",
    category: "backgrounds",
    description:
      "A clean dot pattern background — subtle, professional, and modern",
    tags: ["dots", "pattern", "clean", "professional", "background"],
    previewType: "background",
    cssCode: `/* Dot Pattern */
.roycss-bg-dot-pattern {
  inline-size: 100%;
  block-size: 100%;
  background-color: oklch(0.15 0.02 250);
  background-image: radial-gradient(
    oklch(0.5 0.05 250) 1px,
    transparent 1px
  );
  background-size: 16px 16px;
  border-radius: 1rem;
}`,
  },

  {
    id: "bg-stripe-diagonal",
    name: "Diagonal Stripes",
    category: "backgrounds",
    description:
      "Diagonal stripe pattern — classic barbershop pole or caution tape aesthetic",
    tags: ["stripes", "diagonal", "pattern", "barber", "caution"],
    previewType: "background",
    cssCode: `/* Diagonal Stripes */
.roycss-bg-stripe-diagonal {
  inline-size: 100%;
  block-size: 100%;
  background: repeating-linear-gradient(
    45deg,
    oklch(0.6 0.2 162),
    oklch(0.6 0.2 162) 10px,
    oklch(0.15 0.02 250) 10px,
    oklch(0.15 0.02 250) 20px
  );
  border-radius: 1rem;
}`,
  },

  {
    id: "bg-radial-spotlight",
    name: "Radial Spotlight",
    category: "backgrounds",
    description:
      "A radial gradient that creates a spotlight effect — focuses attention on center",
    tags: ["radial", "spotlight", "focus", "attention", "background"],
    previewType: "background",
    cssCode: `/* Radial Spotlight */
.roycss-bg-radial-spotlight {
  inline-size: 100%;
  block-size: 100%;
  background: radial-gradient(
    circle at 50% 50%,
    oklch(0.3 0.05 250) 0%,
    oklch(0.15 0.02 250) 70%,
    oklch(0.05 0.01 250) 100%
  );
  border-radius: 1rem;
}`,
  },

  /* ───────────────────────── HOVER (5) ────────────────────────────── */

  {
    id: "hover-tilt-3d",
    name: "3D Tilt Hover",
    category: "hover",
    description:
      "Element tilts in 3D space following a fixed rotation on hover — depth without JS",
    tags: ["3d", "tilt", "perspective", "hover", "depth"],
    previewType: "box",
    cssCode: `/* 3D Tilt Hover */
.roycss-hover-tilt-3d {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: linear-gradient(135deg, oklch(0.6 0.2 162), oklch(0.55 0.25 200));
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  transform-style: preserve-3d;
}

.roycss-hover-tilt-3d:hover {
  transform: perspective(500px) rotateX(15deg) rotateY(-15deg) scale(1.05);
}`,
  },

  {
    id: "hover-slide-bg",
    name: "Slide Background",
    category: "hover",
    description:
      "Background slides in from the left on hover — smooth color transition reveal",
    tags: ["slide", "background", "reveal", "hover", "transition"],
    previewType: "box",
    cssCode: `/* Slide Background */
.roycss-hover-slide-bg {
  position: relative;
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: oklch(0.25 0.03 250);
  overflow: hidden;
  transition: color 0.3s ease;
}

.roycss-hover-slide-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  background: oklch(0.6 0.2 162);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 0;
}

.roycss-hover-slide-bg:hover::before {
  transform: translateX(0);
}`,
  },

  {
    id: "hover-pop-scale",
    name: "Pop Scale",
    category: "hover",
    description:
      "Element pops up with a bouncy spring scale — playful and satisfying micro-interaction",
    tags: ["pop", "scale", "bounce", "spring", "playful"],
    previewType: "box",
    cssCode: `/* Pop Scale */
.roycss-hover-pop-scale {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: linear-gradient(135deg, oklch(0.65 0.25 280), oklch(0.6 0.2 330));
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.roycss-hover-pop-scale:hover {
  transform: scale(1.15);
}`,
  },

  {
    id: "hover-glow-pulse",
    name: "Glow Pulse Hover",
    category: "hover",
    description:
      "Element glows with a pulsing colored shadow on hover — draws attention smoothly",
    tags: ["glow", "pulse", "shadow", "hover", "attention"],
    previewType: "box",
    cssCode: `/* Glow Pulse Hover */
.roycss-hover-glow-pulse {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: oklch(0.25 0.03 250);
  border: 1px solid oklch(0.4 0.05 250);
  transition: all 0.3s ease;
}

.roycss-hover-glow-pulse:hover {
  border-color: oklch(0.6 0.2 162);
  animation: roy-hover-glow-pulse 1.5s ease-in-out infinite;
}

@keyframes roy-hover-glow-pulse {
  0%, 100% { box-shadow: 0 0 15px color-mix(in oklch, oklch(0.6 0.2 162) 30%, transparent); }
  50% { box-shadow: 0 0 30px color-mix(in oklch, oklch(0.6 0.2 162) 50%, transparent); }
}`,
  },

  {
    id: "hover-underline-grow",
    name: "Underline Grow",
    category: "hover",
    description:
      "An underline that grows from the center outward on hover — elegant link effect",
    tags: ["underline", "grow", "link", "elegant", "hover"],
    previewType: "text",
    cssCode: `/* Underline Grow */
.roycss-hover-underline-grow {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.roycss-hover-underline-grow::after {
  content: "";
  position: absolute;
  inset-block-start: 100%;
  inset-inline-start: 50%;
  inline-size: 0;
  block-size: 2px;
  background: oklch(0.6 0.2 162);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.roycss-hover-underline-grow:hover::after {
  inline-size: 100%;
}`,
  },

  /* ───────────────────────── VISUAL (5) ───────────────────────────── */

  {
    id: "vis-glassmorph-card",
    name: "Glassmorphism Card",
    category: "visual",
    description:
      "A classic glassmorphism card with layered blur, border light, and depth shadow",
    tags: ["glass", "glassmorphism", "card", "blur", "modern"],
    previewType: "card",
    cssCode: `/* Glassmorphism Card */
.roycss-vis-glassmorph-card {
  inline-size: 144px;
  block-size: 96px;
  border-radius: 1rem;
  background: color-mix(in oklch, oklch(0.9 0.02 250) 12%, transparent);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid color-mix(in oklch, white 18%, transparent);
  box-shadow:
    0 8px 32px color-mix(in oklch, oklch(0.1 0.02 250) 30%, transparent),
    inset 0 1px 1px color-mix(in oklch, white 25%, transparent);
}`,
  },

  {
    id: "vis-neumorphic",
    name: "Neumorphic Surface",
    category: "visual",
    description:
      "Soft neumorphic surface with dual shadows — extruded from the background",
    tags: ["neumorphic", "soft", "shadow", "extruded", "tactile"],
    previewType: "box",
    cssCode: `/* Neumorphic Surface */
.roycss-vis-neumorphic {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1rem;
  background: oklch(0.9 0.01 250);
  box-shadow:
    8px 8px 16px color-mix(in oklch, oklch(0.1 0.02 250) 25%, transparent),
    -8px -8px 16px color-mix(in oklch, white 60%, transparent);
}`,
  },

  {
    id: "vis-gradient-ring",
    name: "Gradient Ring",
    category: "visual",
    description:
      "A circular ring with a conic gradient border — like a progress ring or status indicator",
    tags: ["gradient", "ring", "conic", "circular", "progress"],
    previewType: "box",
    cssCode: `/* Gradient Ring */
.roycss-vis-gradient-ring {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    oklch(0.6 0.2 162),
    oklch(0.55 0.25 200),
    oklch(0.5 0.2 280),
    oklch(0.6 0.2 162)
  );
  -webkit-mask: radial-gradient(transparent 55%, black 56%);
  mask: radial-gradient(transparent 55%, black 56%);
}`,
  },

  {
    id: "vis-aurora-blur",
    name: "Aurora Blur",
    category: "visual",
    description:
      "Soft blurred aurora color blobs — ambient background decoration with depth",
    tags: ["aurora", "blur", "ambient", "blobs", "decoration"],
    previewType: "background",
    cssCode: `/* Aurora Blur */
.roycss-vis-aurora-blur {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0.1 0.02 250);
  border-radius: 1rem;
  overflow: hidden;
}

.roycss-vis-aurora-blur::before,
.roycss-vis-aurora-blur::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.5;
}

.roycss-vis-aurora-blur::before {
  inline-size: 60%;
  block-size: 60%;
  inset-block-start: 10%;
  inset-inline-start: 10%;
  background: oklch(0.6 0.2 162);
}

.roycss-vis-aurora-blur::after {
  inline-size: 50%;
  block-size: 50%;
  inset-block-end: 10%;
  inset-inline-end: 10%;
  background: oklch(0.55 0.25 280);
}`,
  },

  {
    id: "vis-claymorphism",
    name: "Claymorphism",
    category: "visual",
    description:
      "Soft clay-like 3D surface with rounded shadows — playful and tactile",
    tags: ["clay", "claymorphism", "soft", "3d", "playful"],
    previewType: "box",
    cssCode: `/* Claymorphism */
.roycss-vis-claymorphism {
  inline-size: 80px;
  block-size: 80px;
  border-radius: 1.5rem;
  background: oklch(0.85 0.05 250);
  box-shadow:
    inset 0 -4px 8px color-mix(in oklch, oklch(0.1 0.02 250) 20%, transparent),
    inset 0 4px 8px color-mix(in oklch, white 40%, transparent),
    0 8px 16px color-mix(in oklch, oklch(0.1 0.02 250) 20%, transparent);
}`,
  },

  /* ───────────────────────── LOADERS (5) ──────────────────────────── */

  {
    id: "loader-dots-bounce",
    name: "Bouncing Dots Loader",
    category: "loaders",
    description:
      "Three dots that bounce in sequence — classic loading indicator",
    tags: ["dots", "bounce", "loader", "loading", "classic"],
    previewType: "loader",
    childCount: 3,
    cssCode: `/* Bouncing Dots Loader */
.roycss-loader-dots-bounce {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.roycss-loader-dots-bounce > span {
  inline-size: 10px;
  block-size: 10px;
  border-radius: 50%;
  background: oklch(0.6 0.2 162);
  animation: roy-dots-bounce 1.4s ease-in-out infinite both;
}

.roycss-loader-dots-bounce > span:nth-child(1) { animation-delay: -0.32s; }
.roycss-loader-dots-bounce > span:nth-child(2) { animation-delay: -0.16s; }

@keyframes roy-dots-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-loader-dots-bounce > span { animation: none; }
}`,
  },

  {
    id: "loader-bars-equalizer",
    name: "Equalizer Bars Loader",
    category: "loaders",
    description:
      "Audio equalizer style bars that animate at different speeds — music app loader",
    tags: ["bars", "equalizer", "audio", "music", "loader"],
    previewType: "loader",
    childCount: 5,
    cssCode: `/* Equalizer Bars Loader */
.roycss-loader-bars-equalizer {
  display: inline-flex;
  align-items: flex-end;
  gap: 3px;
  block-size: 36px;
}

.roycss-loader-bars-equalizer > span {
  inline-size: 4px;
  block-size: 100%;
  background: oklch(0.6 0.2 162);
  border-radius: 2px;
  animation: roy-bars-eq 1s ease-in-out infinite;
}

.roycss-loader-bars-equalizer > span:nth-child(1) { animation-delay: 0s; }
.roycss-loader-bars-equalizer > span:nth-child(2) { animation-delay: 0.1s; }
.roycss-loader-bars-equalizer > span:nth-child(3) { animation-delay: 0.2s; }
.roycss-loader-bars-equalizer > span:nth-child(4) { animation-delay: 0.3s; }
.roycss-loader-bars-equalizer > span:nth-child(5) { animation-delay: 0.4s; }

@keyframes roy-bars-eq {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-loader-bars-equalizer > span { animation: none; transform: scaleY(0.5); }
}`,
  },

  {
    id: "loader-ring-spin",
    name: "Spinning Ring Loader",
    category: "loaders",
    description:
      "A clean ring spinner with a gradient arc — modern and minimal loading indicator",
    tags: ["ring", "spinner", "spin", "loader", "minimal"],
    previewType: "loader",
    cssCode: `/* Spinning Ring Loader */
.roycss-loader-ring-spin {
  inline-size: 36px;
  block-size: 36px;
  border-radius: 50%;
  border: 3px solid color-mix(in oklch, oklch(0.6 0.2 162) 20%, transparent);
  border-block-start-color: oklch(0.6 0.2 162);
  animation: roy-ring-spin 0.8s linear infinite;
}

@keyframes roy-ring-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-loader-ring-spin { animation: none; }
}`,
  },

  {
    id: "loader-pulse-circle",
    name: "Pulse Circle Loader",
    category: "loaders",
    description:
      "A circle that pulses in and out with opacity — subtle, zen-like loading indicator",
    tags: ["pulse", "circle", "zen", "subtle", "loader"],
    previewType: "loader",
    cssCode: `/* Pulse Circle Loader */
.roycss-loader-pulse-circle {
  inline-size: 36px;
  block-size: 36px;
  border-radius: 50%;
  background: oklch(0.6 0.2 162);
  animation: roy-pulse-circle 1.5s ease-in-out infinite;
}

@keyframes roy-pulse-circle {
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-loader-pulse-circle { animation: none; }
}`,
  },

  {
    id: "loader-orbit-spinner",
    name: "Orbit Spinner Loader",
    category: "loaders",
    description:
      "A satellite dot orbiting a central point — space-themed loading indicator",
    tags: ["orbit", "satellite", "space", "spinner", "loader"],
    previewType: "loader",
    cssCode: `/* Orbit Spinner Loader */
.roycss-loader-orbit-spinner {
  position: relative;
  inline-size: 36px;
  block-size: 36px;
}

.roycss-loader-orbit-spinner::before,
.roycss-loader-orbit-spinner::after {
  content: "";
  position: absolute;
  border-radius: 50%;
}

.roycss-loader-orbit-spinner::before {
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 8px;
  block-size: 8px;
  margin: -4px;
  background: oklch(0.6 0.2 162);
}

.roycss-loader-orbit-spinner::after {
  inset: 0;
  border: 2px solid transparent;
  border-block-start-color: oklch(0.6 0.2 162);
  border-radius: 50%;
  animation: roy-orbit-spin 1s linear infinite;
}

@keyframes roy-orbit-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-loader-orbit-spinner::after { animation: none; }
}`,
  },

  /* ───────────────────────── MICROINTERACTIONS (5) ────────────────── */

  {
    id: "micro-bounce-in",
    name: "Bounce In",
    category: "microinteractions",
    description:
      "Element bounces in from below with a spring — satisfying entrance animation",
    tags: ["bounce", "entrance", "spring", "in", "micro"],
    previewType: "box",
    cssCode: `/* Bounce In */
.roycss-micro-bounce-in {
  inline-size: 60px;
  block-size: 60px;
  border-radius: 1rem;
  background: linear-gradient(135deg, oklch(0.6 0.2 162), oklch(0.55 0.25 200));
  animation: roy-bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
}

@keyframes roy-bounce-in {
  0% { transform: translateY(50px); opacity: 0; }
  60% { transform: translateY(-10px); opacity: 1; }
  80% { transform: translateY(5px); }
  100% { transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-micro-bounce-in { animation: none; }
}`,
  },

  {
    id: "micro-fade-up",
    name: "Fade Up",
    category: "microinteractions",
    description:
      "Element fades in while sliding up — clean, modern entrance animation",
    tags: ["fade", "up", "slide", "entrance", "clean"],
    previewType: "box",
    cssCode: `/* Fade Up */
.roycss-micro-fade-up {
  inline-size: 60px;
  block-size: 60px;
  border-radius: 1rem;
  background: linear-gradient(135deg, oklch(0.65 0.25 280), oklch(0.6 0.2 330));
  animation: roy-fade-up 0.6s ease-out both;
}

@keyframes roy-fade-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-micro-fade-up { animation: none; }
}`,
  },

  {
    id: "micro-scale-in",
    name: "Scale In",
    category: "microinteractions",
    description:
      "Element scales in from 0 to full size with a bounce — pop-in entrance effect",
    tags: ["scale", "in", "pop", "entrance", "micro"],
    previewType: "box",
    cssCode: `/* Scale In */
.roycss-micro-scale-in {
  inline-size: 60px;
  block-size: 60px;
  border-radius: 1rem;
  background: linear-gradient(135deg, oklch(0.7 0.2 30), oklch(0.65 0.25 60));
  animation: roy-scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-scale-in {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-micro-scale-in { animation: none; }
}`,
  },

  {
    id: "micro-shake-error",
    name: "Shake Error",
    category: "microinteractions",
    description:
      "Element shakes horizontally — use for form validation errors and warnings",
    tags: ["shake", "error", "validation", "warning", "form"],
    previewType: "box",
    cssCode: `/* Shake Error */
.roycss-micro-shake-error {
  inline-size: 60px;
  block-size: 60px;
  border-radius: 1rem;
  background: oklch(0.5 0.2 25);
  animation: roy-shake-error 0.5s ease-in-out;
}

@keyframes roy-shake-error {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-micro-shake-error { animation: none; }
}`,
  },

  {
    id: "micro-pulse-attention",
    name: "Pulse Attention",
    category: "microinteractions",
    description:
      "Element pulses to draw attention without being annoying — subtle notification",
    tags: ["pulse", "attention", "notification", "subtle", "micro"],
    previewType: "box",
    cssCode: `/* Pulse Attention */
.roycss-micro-pulse-attention {
  inline-size: 60px;
  block-size: 60px;
  border-radius: 1rem;
  background: oklch(0.6 0.2 162);
  animation: roy-pulse-attention 2s ease-in-out infinite;
}

@keyframes roy-pulse-attention {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.6 0.2 162) 40%, transparent); }
  50% { box-shadow: 0 0 0 12px color-mix(in oklch, oklch(0.6 0.2 162) 0%, transparent); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-micro-pulse-attention { animation: none; }
}`,
  },

  /* ───────────────────────── CARDS (4) ────────────────────────────── */

  {
    id: "card-glass-hover",
    name: "Glass Hover Card",
    category: "cards",
    description:
      "A glassmorphism card that lifts and glows on hover — premium product card feel",
    tags: ["glass", "card", "hover", "lift", "premium"],
    previewType: "card",
    cssCode: `/* Glass Hover Card */
.roycss-card-glass-hover {
  inline-size: 144px;
  block-size: 96px;
  border-radius: 1rem;
  background: color-mix(in oklch, oklch(0.9 0.02 250) 12%, transparent);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid color-mix(in oklch, white 18%, transparent);
  transition: all 0.3s ease;
}

.roycss-card-glass-hover:hover {
  transform: translateY(-4px);
  border-color: color-mix(in oklch, oklch(0.6 0.2 162) 40%, transparent);
  box-shadow:
    0 12px 30px color-mix(in oklch, oklch(0.1 0.02 250) 30%, transparent),
    0 0 20px color-mix(in oklch, oklch(0.6 0.2 162) 20%, transparent);
}`,
  },

  {
    id: "card-gradient-border",
    name: "Gradient Border Card",
    category: "cards",
    description:
      "A card with an animated gradient border that shifts colors — eye-catching container",
    tags: ["gradient", "border", "card", "animated", "container"],
    previewType: "card",
    cssCode: `/* Gradient Border Card */
.roycss-card-gradient-border-v2 {
  position: relative;
  inline-size: 144px;
  block-size: 96px;
  border-radius: 1rem;
  background: oklch(0.15 0.02 250);
  overflow: hidden;
}

.roycss-card-gradient-border-v2::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: 1rem;
  background: conic-gradient(
    from 0deg,
    oklch(0.6 0.2 162),
    oklch(0.55 0.25 200),
    oklch(0.5 0.2 280),
    oklch(0.6 0.2 162)
  );
  z-index: -1;
  animation: roy-card-grad-border 4s linear infinite;
}

@keyframes roy-card-grad-border {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-card-gradient-border-v2::before { animation: none; }
}`,
  },

  {
    id: "card-neumorphic",
    name: "Neumorphic Card",
    category: "cards",
    description:
      "A soft neumorphic card that appears extruded from the surface — tactile and modern",
    tags: ["neumorphic", "card", "soft", "extruded", "tactile"],
    previewType: "card",
    cssCode: `/* Neumorphic Card */
.roycss-card-neumorphic {
  inline-size: 144px;
  block-size: 96px;
  border-radius: 1rem;
  background: oklch(0.9 0.01 250);
  box-shadow:
    8px 8px 16px color-mix(in oklch, oklch(0.1 0.02 250) 25%, transparent),
    -8px -8px 16px color-mix(in oklch, white 60%, transparent);
}`,
  },

  {
    id: "card-spotlight",
    name: "Spotlight Card",
    category: "cards",
    description:
      "A card with a radial spotlight effect — highlights content with a focused glow",
    tags: ["spotlight", "card", "radial", "glow", "focus"],
    previewType: "card",
    cssCode: `/* Spotlight Card */
.roycss-card-spotlight {
  position: relative;
  inline-size: 144px;
  block-size: 96px;
  border-radius: 1rem;
  background: oklch(0.15 0.02 250);
  overflow: hidden;
}

.roycss-card-spotlight::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 0%,
    color-mix(in oklch, oklch(0.6 0.2 162) 30%, transparent) 0%,
    transparent 60%
  );
}`,
  },
];
