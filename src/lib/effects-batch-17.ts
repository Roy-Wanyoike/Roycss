import type { CSSEffect } from "./roycss-types";

/**
 * Batch 17 — Future-Trending Effects (30 effects)
 * Themes: bioluminescent UI, neumorphism 2.0, glass 3.0, cyberpunk 2026,
 * organic motion, OKLCH color science, ambient computing, spatial audio,
 * storytelling UI, micro-interactions 2.0, adaptive container-query art.
 */
export const effectsBatch17: CSSEffect[] = [
  /* ───────────────────────────── VISUAL (10) ───────────────────────────── */
  {
    id: "bio-luminescent-glow",
    name: "Bioluminescent Glow",
    category: "visual",
    description:
      "Organic deep-sea creature glow that pulses with life using animated OKLCH hues",
    tags: ["bio", "luminescent", "organic", "glow"],
    previewType: "box",
    cssCode: `/* Bioluminescent Glow */
@property --roy-bio-hue {
  syntax: "<number>";
  initial-value: 180;
  inherits: false;
}
.roycss-bio-luminescent-glow {
  background: radial-gradient(circle at 50% 55%,
    oklch(0.92 0.22 calc(var(--roy-bio-hue) + 30)) 0%,
    oklch(0.65 0.24 var(--roy-bio-hue)) 35%,
    oklch(0.25 0.15 calc(var(--roy-bio-hue) - 15)) 75%,
    oklch(0.1 0.05 calc(var(--roy-bio-hue) - 30)) 100%);
  border-radius: 50%;
  box-shadow:
    0 0 60px oklch(0.7 0.28 var(--roy-bio-hue) / 0.8),
    0 0 120px oklch(0.6 0.24 var(--roy-bio-hue) / 0.5),
    0 0 200px oklch(0.5 0.2 var(--roy-bio-hue) / 0.3),
    inset 0 0 50px oklch(0.95 0.18 calc(var(--roy-bio-hue) + 40) / 0.7),
    inset -10px -20px 40px oklch(0.3 0.2 calc(var(--roy-bio-hue) - 30) / 0.4);
  animation: roy-bio-pulse 4.5s ease-in-out infinite;
}
@keyframes roy-bio-pulse {
  0%, 100% {
    --roy-bio-hue: 175;
    filter: brightness(0.85) saturate(0.95);
  }
  50% {
    --roy-bio-hue: 215;
    filter: brightness(1.45) saturate(1.2);
  }
}`,
  },
  {
    id: "neu-soft-raised",
    name: "Neumorphism Soft Raised",
    category: "visual",
    description:
      "Neumorphism 2.0 raised surface with multi-layer depth shadows and subtle highlight",
    tags: ["neumorphism", "soft-ui", "raised", "depth"],
    previewType: "box",
    cssCode: `/* Neumorphism Soft Raised */
.roycss-neu-soft-raised {
  background: oklch(0.92 0.012 250);
  border-radius: 1.5rem;
  box-shadow:
    0 2px 4px oklch(0.4 0.02 250 / 0.12),
    0 6px 12px oklch(0.4 0.02 250 / 0.16),
    0 14px 28px oklch(0.4 0.02 250 / 0.18),
    0 28px 56px oklch(0.4 0.02 250 / 0.1),
    inset 0 1px 0 oklch(1 0 0 / 0.7),
    inset 0 -1px 0 oklch(0.5 0.02 250 / 0.12),
    inset 1px 0 0 oklch(1 0 0 / 0.25),
    inset -1px 0 0 oklch(0.5 0.02 250 / 0.08);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}
.roycss-neu-soft-raised:hover {
  transform: translateY(-3px) scale(1.015);
  box-shadow:
    0 4px 8px oklch(0.4 0.02 250 / 0.16),
    0 12px 24px oklch(0.4 0.02 250 / 0.22),
    0 24px 48px oklch(0.4 0.02 250 / 0.24),
    0 48px 96px oklch(0.4 0.02 250 / 0.14),
    inset 0 1px 0 oklch(1 0 0 / 0.85),
    inset 0 -1px 0 oklch(0.5 0.02 250 / 0.14);
}
.roycss-neu-soft-raised:active {
  transform: translateY(1px) scale(0.99);
  box-shadow:
    0 1px 2px oklch(0.4 0.02 250 / 0.1),
    inset 0 2px 4px oklch(0.5 0.02 250 / 0.18),
    inset 0 -1px 0 oklch(1 0 0 / 0.5);
}`,
  },
  {
    id: "neu-soft-inset",
    name: "Neumorphism Soft Inset",
    category: "visual",
    description:
      "Neumorphism 2.0 pressed-in inset surface with realistic concave depth",
    tags: ["neumorphism", "soft-ui", "inset", "concave"],
    previewType: "box",
    cssCode: `/* Neumorphism Soft Inset */
.roycss-neu-soft-inset {
  background: linear-gradient(145deg,
    oklch(0.88 0.012 250),
    oklch(0.94 0.012 250));
  border-radius: 1.5rem;
  box-shadow:
    inset 5px 5px 14px oklch(0.4 0.02 250 / 0.35),
    inset -5px -5px 14px oklch(1 0 0 / 0.75),
    inset 0 0 0 1px oklch(0.5 0.02 250 / 0.04),
    0 1px 0 oklch(1 0 0 / 0.5);
  transition: box-shadow 0.3s ease;
}
.roycss-neu-soft-inset:hover {
  box-shadow:
    inset 7px 7px 18px oklch(0.4 0.02 250 / 0.45),
    inset -7px -7px 18px oklch(1 0 0 / 0.85),
    inset 0 0 0 1px oklch(0.5 0.02 250 / 0.06),
    0 1px 0 oklch(1 0 0 / 0.6);
}`,
  },
  {
    id: "glass-tinted-depth",
    name: "Glass Tinted Depth",
    category: "visual",
    description:
      "Glassmorphism 3.0 with tinted hue, frosted blur, saturated colors, and depth shadow",
    tags: ["glass", "glassmorphism", "tinted", "depth"],
    previewType: "card",
    cssCode: `/* Glass Tinted Depth */
.roycss-glass-tinted-depth {
  background:
    linear-gradient(135deg,
      oklch(0.85 0.15 250 / 0.18),
      oklch(0.7 0.18 320 / 0.12)),
    color-mix(in oklch, oklch(0.6 0.18 240) 12%, transparent);
  backdrop-filter: blur(24px) saturate(180%) brightness(1.05);
  -webkit-backdrop-filter: blur(24px) saturate(180%) brightness(1.05);
  border-radius: 1rem;
  border: 1px solid oklch(1 0 0 / 0.22);
  box-shadow:
    0 12px 32px oklch(0.25 0.12 250 / 0.3),
    0 4px 12px oklch(0.25 0.12 250 / 0.2),
    0 1px 0 oklch(1 0 0 / 0.5),
    inset 0 1px 0 oklch(1 0 0 / 0.45),
    inset 0 -1px 0 oklch(0 0 0 / 0.08),
    inset 1px 0 0 oklch(1 0 0 / 0.15),
    inset -1px 0 0 oklch(0 0 0 / 0.05);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.4s ease;
}
.roycss-glass-tinted-depth:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow:
    0 24px 64px oklch(0.25 0.12 250 / 0.4),
    0 8px 24px oklch(0.25 0.12 250 / 0.25),
    0 1px 0 oklch(1 0 0 / 0.6),
    inset 0 1px 0 oklch(1 0 0 / 0.55);
}`,
  },
  {
    id: "cyber-grid-perspective",
    name: "Cyber Grid Perspective",
    category: "visual",
    description:
      "Synthwave perspective grid floor receding into the horizon with scrolling motion",
    tags: ["cyberpunk", "synthwave", "grid", "perspective"],
    previewType: "box",
    cssCode: `/* Cyber Grid Perspective */
.roycss-cyber-grid-perspective {
  background-image:
    linear-gradient(oklch(0.95 0.45 320 / 0.7) 1px, transparent 1px),
    linear-gradient(90deg, oklch(0.95 0.45 320 / 0.7) 1px, transparent 1px);
  background-size: 48px 48px, 48px 48px;
  background-color: oklch(0.08 0.18 295);
  background-position: 0 0, 0 0;
  transform: perspective(380px) rotateX(62deg);
  transform-origin: center bottom;
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
  animation: roy-cyber-grid-scroll 1.6s linear infinite;
}
.roycss-cyber-grid-perspective::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 50% 0%,
      oklch(0.8 0.35 25 / 0.55),
      transparent 70%),
    linear-gradient(0deg,
      oklch(0.08 0.18 295) 0%,
      transparent 35%,
      transparent 60%,
      oklch(0.08 0.18 295 / 0.7) 100%);
  pointer-events: none;
}
@keyframes roy-cyber-grid-scroll {
  from { background-position: 0 0, 0 0; }
  to { background-position: 0 48px, 0 48px; }
}`,
  },
  {
    id: "holographic-iridescent",
    name: "Holographic Iridescent",
    category: "visual",
    description:
      "Animated iridescent holographic surface using rotating OKLCH conic gradient",
    tags: ["holographic", "iridescent", "oklch", "conic"],
    previewType: "card",
    cssCode: `/* Holographic Iridescent */
@property --roy-holo-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
.roycss-holographic-iridescent {
  background: conic-gradient(
    from var(--roy-holo-angle),
    oklch(0.82 0.24 0),
    oklch(0.82 0.24 50),
    oklch(0.82 0.24 120),
    oklch(0.82 0.24 180),
    oklch(0.82 0.24 240),
    oklch(0.82 0.24 300),
    oklch(0.82 0.24 340),
    oklch(0.82 0.24 360));
  border-radius: 1rem;
  filter: saturate(1.4) brightness(1.08) contrast(1.05);
  box-shadow:
    0 12px 36px oklch(0.4 0.3 280 / 0.5),
    inset 0 1px 0 oklch(1 0 0 / 0.4),
    inset 0 0 24px oklch(1 0 0 / 0.15);
  animation: roy-holo-spin 6s linear infinite;
}
.roycss-holographic-iridescent::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    oklch(1 0 0 / 0.35) 0%,
    transparent 35%,
    transparent 65%,
    oklch(0 0 0 / 0.15) 100%);
  border-radius: inherit;
  pointer-events: none;
}
@keyframes roy-holo-spin {
  to { --roy-holo-angle: 360deg; }
}`,
  },
  {
    id: "ambient-breathing-surface",
    name: "Ambient Breathing Surface",
    category: "visual",
    description:
      "Surface that subtly breathes like a living organism, scaling and glowing softly",
    tags: ["ambient", "breathing", "organic", "alive"],
    previewType: "box",
    cssCode: `/* Ambient Breathing Surface */
@property --roy-breath {
  syntax: "<number>";
  initial-value: 0;
  inherits: false;
}
.roycss-ambient-breathing-surface {
  background: radial-gradient(circle at 50% 50%,
    oklch(0.85 0.18 200) 0%,
    oklch(0.7 0.22 220) 50%,
    oklch(0.45 0.2 245) 100%);
  border-radius: 1.25rem;
  box-shadow:
    0 0 calc(20px + var(--roy-breath) * 40px) oklch(0.6 0.22 220 / 0.45),
    0 0 calc(40px + var(--roy-breath) * 80px) oklch(0.5 0.2 240 / 0.25),
    0 8px 32px oklch(0.3 0.12 240 / 0.35),
    inset 0 1px 0 oklch(1 0 0 / 0.5);
  transform: scale(calc(1 + var(--roy-breath) * 0.025));
  filter: brightness(calc(1 + var(--roy-breath) * 0.18));
  animation: roy-breath-cycle 6.5s ease-in-out infinite;
}
@keyframes roy-breath-cycle {
  0%, 100% { --roy-breath: 0; }
  50% { --roy-breath: 1; }
}`,
  },
  {
    id: "oklch-gamut-ring",
    name: "OKLCH Gamut Ring",
    category: "visual",
    description:
      "Animated visualization ring showing the full OKLCH color hue gamut at constant chroma",
    tags: ["oklch", "color-science", "gamut", "ring"],
    previewType: "box",
    cssCode: `/* OKLCH Gamut Ring */
.roycss-oklch-gamut-ring {
  background: conic-gradient(
    from 0deg,
    oklch(0.75 0.24 0),
    oklch(0.75 0.24 30),
    oklch(0.75 0.24 60),
    oklch(0.75 0.24 90),
    oklch(0.75 0.24 120),
    oklch(0.75 0.24 150),
    oklch(0.75 0.24 180),
    oklch(0.75 0.24 210),
    oklch(0.75 0.24 240),
    oklch(0.75 0.24 270),
    oklch(0.75 0.24 300),
    oklch(0.75 0.24 330),
    oklch(0.75 0.24 360));
  border-radius: 50%;
  -webkit-mask: radial-gradient(circle,
    transparent 0,
    transparent 48%,
    black 50%,
    black 100%);
  mask: radial-gradient(circle,
    transparent 0,
    transparent 48%,
    black 50%,
    black 100%);
  filter: saturate(1.35) brightness(1.05);
  animation: roy-gamut-spin 14s linear infinite;
  box-shadow: 0 0 60px oklch(0.7 0.2 200 / 0.3);
}
@keyframes roy-gamut-spin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "tactile-press-depth",
    name: "Tactile Press Depth",
    category: "visual",
    description:
      "Tactile button with realistic depth that physically depresses on press for haptic feel",
    tags: ["tactile", "button", "depth", "haptic"],
    previewType: "button",
    previewText: "Press Me",
    cssCode: `/* Tactile Press Depth */
.roycss-tactile-press-depth {
  background: linear-gradient(180deg,
    oklch(0.72 0.16 250) 0%,
    oklch(0.6 0.18 250) 100%);
  color: oklch(0.98 0.02 250);
  font-weight: 700;
  border: none;
  border-radius: 0.85rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  box-shadow:
    0 8px 0 oklch(0.38 0.16 250),
    0 14px 28px oklch(0.3 0.1 250 / 0.4),
    0 6px 12px oklch(0.3 0.1 250 / 0.25),
    inset 0 1px 0 oklch(1 0 0 / 0.45),
    inset 0 -1px 0 oklch(0.3 0.1 250 / 0.4);
  transition: transform 0.08s ease, box-shadow 0.08s ease, filter 0.15s ease;
}
.roycss-tactile-press-depth:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
  box-shadow:
    0 9px 0 oklch(0.38 0.16 250),
    0 16px 32px oklch(0.3 0.1 250 / 0.5),
    0 7px 14px oklch(0.3 0.1 250 / 0.3),
    inset 0 1px 0 oklch(1 0 0 / 0.5),
    inset 0 -1px 0 oklch(0.3 0.1 250 / 0.4);
}
.roycss-tactile-press-depth:active {
  transform: translateY(8px);
  filter: brightness(0.95);
  box-shadow:
    0 0 0 oklch(0.38 0.16 250),
    0 2px 8px oklch(0.3 0.1 250 / 0.35),
    inset 0 1px 0 oklch(1 0 0 / 0.3),
    inset 0 -1px 0 oklch(0.3 0.1 250 / 0.5);
}`,
  },
  {
    id: "organic-noise-grain",
    name: "Organic Noise Grain",
    category: "visual",
    description:
      "Animated film grain overlay that breathes and shifts color like living noise",
    tags: ["noise", "grain", "film", "organic"],
    previewType: "box",
    cssCode: `/* Organic Noise Grain */
.roycss-organic-noise-grain {
  position: relative;
  background:
    radial-gradient(circle at 30% 40%,
      oklch(0.45 0.25 280 / 0.4),
      transparent 55%),
    radial-gradient(circle at 70% 60%,
      oklch(0.4 0.28 200 / 0.4),
      transparent 55%),
    oklch(0.12 0.05 250);
  border-radius: 0.75rem;
  overflow: hidden;
}
.roycss-organic-noise-grain::before,
.roycss-organic-noise-grain::after {
  content: "";
  position: absolute;
  inset: -50%;
  pointer-events: none;
}
.roycss-organic-noise-grain::before {
  background-image: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.65 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.35;
  mix-blend-mode: overlay;
  animation: roy-grain-shift 0.6s steps(5) infinite;
}
.roycss-organic-noise-grain::after {
  background: conic-gradient(from 0deg,
    oklch(0.6 0.3 280 / 0.18),
    oklch(0.6 0.3 200 / 0.18),
    oklch(0.6 0.3 320 / 0.18),
    oklch(0.6 0.3 280 / 0.18));
  animation: roy-grain-color 9s linear infinite;
  mix-blend-mode: screen;
}
@keyframes roy-grain-shift {
  0% { transform: translate(0, 0); }
  20% { transform: translate(-6%, 4%); }
  40% { transform: translate(4%, -6%); }
  60% { transform: translate(-3%, -3%); }
  80% { transform: translate(5%, 5%); }
  100% { transform: translate(0, 0); }
}
@keyframes roy-grain-color {
  to { transform: rotate(360deg); }
}`,
  },

  /* ───────────────────────────── ANIMATIONS (8) ───────────────────────────── */
  {
    id: "leaf-fall-spiral",
    name: "Leaf Fall Spiral",
    category: "animations",
    description:
      "Leaf falling with graceful spiral motion, rotating and translating on a curved path",
    tags: ["leaf", "spiral", "fall", "organic"],
    previewType: "box",
    cssCode: `/* Leaf Fall Spiral */
.roycss-leaf-fall-spiral {
  width: 28px;
  height: 28px;
  background:
    radial-gradient(ellipse at 30% 30%,
      oklch(0.78 0.22 130) 0%,
      oklch(0.55 0.25 140) 60%,
      oklch(0.35 0.2 145) 100%);
  border-radius: 0 100% 0 100%;
  transform-origin: center;
  box-shadow:
    inset -2px -2px 4px oklch(0.3 0.15 140 / 0.5),
    0 2px 6px oklch(0.3 0.1 140 / 0.3);
  position: relative;
  top: 0;
  animation: roy-leaf-spiral 5.5s linear infinite;
}
@keyframes roy-leaf-spiral {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 0;
  }
  8% { opacity: 1; }
  20% {
    transform: translate(35px, 18px) rotate(140deg) scale(0.96);
  }
  40% {
    transform: translate(-25px, 38px) rotate(280deg) scale(0.92);
  }
  60% {
    transform: translate(30px, 58px) rotate(420deg) scale(0.88);
  }
  80% {
    transform: translate(-20px, 78px) rotate(560deg) scale(0.84);
  }
  92% { opacity: 1; }
  100% {
    transform: translate(0, 100px) rotate(720deg) scale(0.8);
    opacity: 0;
  }
}`,
  },
  {
    id: "water-ripple-expand",
    name: "Water Ripple Expand",
    category: "animations",
    description:
      "Concentric water ripples expanding outward and fading, like a stone dropped in a pond",
    tags: ["water", "ripple", "expand", "wave"],
    previewType: "box",
    cssCode: `/* Water Ripple Expand */
.roycss-water-ripple-expand {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle,
    oklch(0.7 0.18 220 / 0.65) 0%,
    oklch(0.5 0.22 240 / 0.35) 60%,
    oklch(0.3 0.15 250 / 0.15) 100%);
  box-shadow:
    inset 0 0 20px oklch(0.85 0.15 200 / 0.4),
    0 0 30px oklch(0.5 0.2 230 / 0.3);
}
.roycss-water-ripple-expand::before,
.roycss-water-ripple-expand::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px solid oklch(0.8 0.18 210 / 0.7);
  border-radius: 50%;
  animation: roy-ripple-out 2.4s ease-out infinite;
}
.roycss-water-ripple-expand::after {
  animation-delay: 1.2s;
}
@keyframes roy-ripple-out {
  0% {
    transform: scale(1);
    opacity: 1;
    border-width: 3px;
  }
  60% { opacity: 0.5; }
  100% {
    transform: scale(3.2);
    opacity: 0;
    border-width: 1px;
  }
}`,
  },
  {
    id: "wind-sway-organic",
    name: "Wind Sway Organic",
    category: "animations",
    description:
      "Organic stalk swaying in the wind with natural asymmetric motion and subtle skew",
    tags: ["wind", "sway", "organic", "motion"],
    previewType: "box",
    cssCode: `/* Wind Sway Organic */
.roycss-wind-sway-organic {
  width: 36px;
  height: 90px;
  background: linear-gradient(180deg,
    oklch(0.55 0.25 140) 0%,
    oklch(0.4 0.22 135) 50%,
    oklch(0.3 0.18 130) 100%);
  border-radius: 50% 50% 6px 6px / 75% 75% 6px 6px;
  transform-origin: bottom center;
  box-shadow:
    inset -3px 0 6px oklch(0.2 0.1 130 / 0.4),
    inset 3px 0 4px oklch(0.7 0.2 140 / 0.3),
    0 4px 12px oklch(0.2 0.1 130 / 0.3);
  animation: roy-wind-sway 3.4s ease-in-out infinite;
}
.roycss-wind-sway-organic::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 18px;
  background: radial-gradient(circle at 35% 35%,
    oklch(0.85 0.28 350),
    oklch(0.6 0.3 10) 70%,
    oklch(0.4 0.25 15));
  border-radius: 50%;
  box-shadow: 0 0 12px oklch(0.7 0.3 350 / 0.6);
}
@keyframes roy-wind-sway {
  0%, 100% { transform: rotate(-5deg) skewX(-2deg); }
  25% { transform: rotate(7deg) skewX(3deg); }
  45% { transform: rotate(-3deg) skewX(-1deg); }
  70% { transform: rotate(6deg) skewX(2deg); }
  85% { transform: rotate(-2deg) skewX(-1deg); }
}`,
  },
  {
    id: "scroll-cinematic-zoom",
    name: "Scroll Cinematic Zoom",
    category: "scroll",
    description:
      "Cinematic dolly-zoom on scroll using animation-timeline: view() — element scales and blurs",
    tags: ["scroll", "cinematic", "zoom", "timeline"],
    previewType: "card",
    cssCode: `/* Scroll Cinematic Zoom — uses scroll-driven animations */
.roycss-scroll-cinematic-zoom {
  background:
    radial-gradient(circle at 50% 50%,
      oklch(0.55 0.28 290),
      oklch(0.3 0.2 300) 60%,
      oklch(0.1 0.1 310) 100%);
  border-radius: 1rem;
  border: 1px solid oklch(0.7 0.2 290 / 0.3);
  box-shadow:
    0 20px 60px oklch(0.2 0.15 300 / 0.5),
    inset 0 1px 0 oklch(1 0 0 / 0.15);
  animation: roy-cinematic-zoom linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}
@keyframes roy-cinematic-zoom {
  0% {
    transform: scale(0.6);
    opacity: 0;
    filter: blur(24px) saturate(0.6);
  }
  40% {
    transform: scale(0.85);
    opacity: 0.7;
    filter: blur(8px) saturate(0.85);
  }
  100% {
    transform: scale(1);
    opacity: 1;
    filter: blur(0) saturate(1);
  }
}
@supports not (animation-timeline: view()) {
  .roycss-scroll-cinematic-zoom {
    animation: roy-cinematic-fallback 4s ease-in-out infinite alternate;
  }
  @keyframes roy-cinematic-fallback {
    0% { transform: scale(0.85); opacity: 0.7; filter: blur(6px); }
    100% { transform: scale(1); opacity: 1; filter: blur(0); }
  }
}`,
  },
  {
    id: "ambient-pulse-live",
    name: "Ambient Pulse Live",
    category: "animations",
    description:
      "Ambient pulse rings expanding outward to make the UI feel alive and broadcasting",
    tags: ["ambient", "pulse", "alive", "broadcast"],
    previewType: "box",
    cssCode: `/* Ambient Pulse Live */
.roycss-ambient-pulse-live {
  background: radial-gradient(circle at 35% 35%,
    oklch(0.85 0.22 25),
    oklch(0.6 0.28 15) 60%,
    oklch(0.4 0.25 10));
  border-radius: 50%;
  box-shadow:
    0 0 0 0 oklch(0.75 0.28 20 / 0.6),
    inset 0 0 20px oklch(0.95 0.15 30 / 0.5);
  position: relative;
  animation: roy-ambient-core 2s ease-in-out infinite;
}
.roycss-ambient-pulse-live::before,
.roycss-ambient-pulse-live::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid oklch(0.75 0.28 20 / 0.6);
  animation: roy-ambient-pulse 2.4s ease-out infinite;
}
.roycss-ambient-pulse-live::after {
  animation-delay: 1.2s;
}
@keyframes roy-ambient-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
    border-width: 3px;
  }
  100% {
    transform: scale(2.6);
    opacity: 0;
    border-width: 1px;
  }
}
@keyframes roy-ambient-core {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.25); }
}`,
  },
  {
    id: "haptic-bump",
    name: "Haptic Bump",
    category: "animations",
    description:
      "Subtle haptic-feel micro-bump animation that simulates device vibration feedback",
    tags: ["haptic", "bump", "micro", "feedback"],
    previewType: "box",
    cssCode: `/* Haptic Bump */
.roycss-haptic-bump {
  background: linear-gradient(180deg,
    oklch(0.7 0.18 250),
    oklch(0.55 0.2 250));
  border-radius: 0.6rem;
  box-shadow:
    0 4px 12px oklch(0.3 0.1 250 / 0.3),
    inset 0 1px 0 oklch(1 0 0 / 0.4);
  animation: roy-haptic-bump 2.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes roy-haptic-bump {
  0%, 88%, 100% { transform: translate(0, 0); }
  90% { transform: translate(2px, -3px); }
  92% { transform: translate(-2px, 2px); }
  94% { transform: translate(2px, -1px); }
  96% { transform: translate(-1px, 1px); }
  98% { transform: translate(1px, 0); }
}`,
  },
  {
    id: "data-flow-stream",
    name: "Data Flow Stream",
    category: "animations",
    description:
      "Animated data packets flowing through a stream with marching dashes and glow trail",
    tags: ["data", "flow", "stream", "dash"],
    previewType: "box",
    cssCode: `/* Data Flow Stream */
.roycss-data-flow-stream {
  background:
    repeating-linear-gradient(90deg,
      oklch(0.65 0.28 180) 0,
      oklch(0.65 0.28 180) 12px,
      transparent 12px,
      transparent 32px),
    linear-gradient(90deg,
      oklch(0.1 0.05 200),
      oklch(0.15 0.1 195));
  background-size: 32px 100%, 100% 100%;
  background-repeat: repeat-x, no-repeat;
  border-radius: 0.5rem;
  border: 1px solid oklch(0.4 0.2 180 / 0.4);
  box-shadow:
    0 0 20px oklch(0.5 0.25 180 / 0.4),
    inset 0 0 12px oklch(0.4 0.2 180 / 0.3);
  animation: roy-data-flow 0.9s linear infinite;
}
@keyframes roy-data-flow {
  from { background-position: 0 0, 0 0; }
  to { background-position: 32px 0, 0 0; }
}`,
  },
  {
    id: "breathing-gradient",
    name: "Breathing Gradient",
    category: "animations",
    description:
      "Gradient that breathes by shifting position, hue, and brightness in a slow organic cycle",
    tags: ["gradient", "breathing", "organic", "shift"],
    previewType: "box",
    cssCode: `/* Breathing Gradient */
.roycss-breathing-gradient {
  background: linear-gradient(135deg,
    oklch(0.55 0.28 280),
    oklch(0.55 0.28 200),
    oklch(0.55 0.28 320),
    oklch(0.55 0.28 30));
  background-size: 250% 250%;
  border-radius: 1rem;
  box-shadow:
    0 12px 36px oklch(0.3 0.2 280 / 0.4),
    inset 0 1px 0 oklch(1 0 0 / 0.3);
  animation: roy-grad-breathe 8s ease-in-out infinite;
}
@keyframes roy-grad-breathe {
  0%, 100% {
    background-position: 0% 50%;
    filter: hue-rotate(0deg) brightness(1) saturate(1);
  }
  50% {
    background-position: 100% 50%;
    filter: hue-rotate(60deg) brightness(1.15) saturate(1.2);
  }
}`,
  },

  /* ───────────────────────────── BACKGROUNDS (5) ───────────────────────────── */
  {
    id: "bg-synthwave-sun",
    name: "Synthwave Sun",
    category: "backgrounds",
    description:
      "Retro synthwave sun with horizontal scanlines cutting through its lower half",
    tags: ["synthwave", "retro", "sun", "scanline"],
    previewType: "background",
    cssCode: `/* Synthwave Sun */
.roycss-bg-synthwave-sun {
  background:
    linear-gradient(180deg,
      oklch(0.82 0.28 35) 0%,
      oklch(0.78 0.32 5) 35%,
      oklch(0.6 0.32 340) 65%,
      oklch(0.35 0.28 320) 100%);
  border-radius: 50% 50% 0 0 / 75% 75% 0 0;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 0 80px oklch(0.7 0.3 15 / 0.6),
    0 0 160px oklch(0.5 0.3 340 / 0.4);
}
.roycss-bg-synthwave-sun::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg,
    transparent 0 7px,
    oklch(0.08 0.18 295 / 0.85) 7px 10px);
  -webkit-mask: linear-gradient(180deg,
    transparent 25%,
    black 50%,
    black 85%,
    transparent 100%);
  mask: linear-gradient(180deg,
    transparent 25%,
    black 50%,
    black 85%,
    transparent 100%);
  animation: roy-sun-scan 3.5s linear infinite;
}
.roycss-bg-synthwave-sun::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 25%,
    oklch(1 0.1 50 / 0.4),
    transparent 40%);
  pointer-events: none;
}
@keyframes roy-sun-scan {
  from { background-position: 0 0; }
  to { background-position: 0 10px; }
}`,
  },
  {
    id: "bg-bioluminescent-deep",
    name: "Bioluminescent Deep Sea",
    category: "backgrounds",
    description:
      "Deep sea bioluminescent background with twinkling organisms and ambient glow pools",
    tags: ["bioluminescent", "deep-sea", "twinkle", "ambient"],
    previewType: "background",
    cssCode: `/* Bioluminescent Deep Sea */
.roycss-bg-bioluminescent-deep {
  background:
    radial-gradient(circle at 20% 70%,
      oklch(0.55 0.25 200 / 0.55) 0%,
      transparent 25%),
    radial-gradient(circle at 80% 30%,
      oklch(0.5 0.3 280 / 0.45) 0%,
      transparent 30%),
    radial-gradient(circle at 50% 50%,
      oklch(0.4 0.22 180 / 0.35) 0%,
      transparent 40%),
    radial-gradient(circle at 70% 80%,
      oklch(0.45 0.28 220 / 0.4) 0%,
      transparent 30%),
    linear-gradient(180deg,
      oklch(0.08 0.08 240) 0%,
      oklch(0.04 0.05 250) 100%);
  border-radius: 0.5rem;
  position: relative;
  overflow: hidden;
}
.roycss-bg-bioluminescent-deep::before,
.roycss-bg-bioluminescent-deep::after {
  content: "";
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: oklch(0.9 0.3 180);
  box-shadow:
    20px 40px 0 oklch(0.85 0.3 200),
    60px 90px 0 oklch(0.85 0.3 180),
    120px 60px 0 oklch(0.85 0.3 220),
    180px 110px 0 oklch(0.85 0.3 200),
    240px 30px 0 oklch(0.85 0.3 180),
    300px 80px 0 oklch(0.85 0.3 220),
    360px 130px 0 oklch(0.85 0.3 200),
    50px 150px 0 oklch(0.85 0.3 180);
  animation: roy-bio-twinkle 3s ease-in-out infinite alternate;
  filter: blur(0.5px);
}
.roycss-bg-bioluminescent-deep::after {
  animation-delay: -1.5s;
  box-shadow:
    40px 20px 0 oklch(0.9 0.3 200),
    100px 70px 0 oklch(0.9 0.3 180),
    160px 100px 0 oklch(0.9 0.3 220),
    220px 50px 0 oklch(0.9 0.3 200),
    280px 90px 0 oklch(0.9 0.3 180),
    340px 40px 0 oklch(0.9 0.3 220),
    80px 130px 0 oklch(0.9 0.3 200),
    200px 160px 0 oklch(0.9 0.3 180);
}
@keyframes roy-bio-twinkle {
  0% { opacity: 0.3; transform: translateY(0) scale(1); }
  100% { opacity: 1; transform: translateY(-6px) scale(1.4); }
}`,
  },
  {
    id: "bg-neural-mesh",
    name: "Neural Mesh",
    category: "backgrounds",
    description:
      "Neural network mesh with pulsing nodes that fire in synchronized rhythm",
    tags: ["neural", "network", "mesh", "pulse"],
    previewType: "background",
    cssCode: `/* Neural Mesh */
.roycss-bg-neural-mesh {
  background:
    radial-gradient(circle at 20% 30%,
      oklch(0.85 0.3 200) 0 3px,
      transparent 4px),
    radial-gradient(circle at 70% 20%,
      oklch(0.75 0.3 220) 0 3px,
      transparent 4px),
    radial-gradient(circle at 50% 50%,
      oklch(0.9 0.3 180) 0 4px,
      transparent 5px),
    radial-gradient(circle at 30% 75%,
      oklch(0.75 0.3 220) 0 3px,
      transparent 4px),
    radial-gradient(circle at 80% 80%,
      oklch(0.85 0.3 200) 0 3px,
      transparent 4px),
    radial-gradient(circle at 10% 60%,
      oklch(0.7 0.3 240) 0 2px,
      transparent 3px),
    radial-gradient(circle at 90% 50%,
      oklch(0.7 0.3 240) 0 2px,
      transparent 3px),
    linear-gradient(135deg,
      oklch(0.1 0.05 250),
      oklch(0.15 0.1 220));
  border-radius: 0.5rem;
  position: relative;
  overflow: hidden;
  animation: roy-neural-glow 3s ease-in-out infinite;
}
.roycss-bg-neural-mesh::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(45deg,
      transparent 49.4%,
      oklch(0.5 0.25 200 / 0.25) 49.4% 50.6%,
      transparent 50.6%),
    linear-gradient(-45deg,
      transparent 49.4%,
      oklch(0.5 0.25 220 / 0.2) 49.4% 50.6%,
      transparent 50.6%),
    linear-gradient(90deg,
      transparent 49.5%,
      oklch(0.5 0.25 200 / 0.15) 49.5% 50.5%,
      transparent 50.5%);
  background-size: 100% 100%;
  pointer-events: none;
}
@keyframes roy-neural-glow {
  0%, 100% { filter: brightness(0.9) saturate(1); }
  50% { filter: brightness(1.35) saturate(1.5); }
}`,
  },
  {
    id: "bg-cyber-rain",
    name: "Cyber Rain",
    category: "backgrounds",
    description:
      "Cyberpunk rain of thin neon streaks falling with magenta horizon glow reflection",
    tags: ["cyberpunk", "rain", "neon", "streaks"],
    previewType: "background",
    cssCode: `/* Cyber Rain */
.roycss-bg-cyber-rain {
  background-image: repeating-linear-gradient(180deg,
    oklch(0.88 0.4 180 / 0.75) 0px,
    oklch(0.88 0.4 180 / 0.75) 2px,
    transparent 2px,
    transparent 42px);
  background-size: 2px 42px;
  background-color: oklch(0.07 0.12 280);
  background-position: 0 0;
  border-radius: 0.5rem;
  position: relative;
  overflow: hidden;
  animation: roy-cyber-rain-fall 0.55s linear infinite;
}
.roycss-bg-cyber-rain::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 30% at 50% 100%,
      oklch(0.55 0.32 320 / 0.55),
      transparent 60%),
    radial-gradient(ellipse 40% 20% at 20% 100%,
      oklch(0.45 0.3 200 / 0.4),
      transparent 60%),
    radial-gradient(ellipse 40% 20% at 80% 100%,
      oklch(0.45 0.3 200 / 0.4),
      transparent 60%);
  pointer-events: none;
}
.roycss-bg-cyber-rain::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(180deg,
    oklch(0.95 0.5 320 / 0.5) 0px,
    oklch(0.95 0.5 320 / 0.5) 1px,
    transparent 1px,
    transparent 50px);
  background-size: 2px 50px;
  animation: roy-cyber-rain-pink 0.7s linear infinite;
  mix-blend-mode: screen;
  opacity: 0.6;
}
@keyframes roy-cyber-rain-fall {
  from { background-position: 0 0; }
  to { background-position: 0 42px; }
}
@keyframes roy-cyber-rain-pink {
  from { background-position: 0 0; }
  to { background-position: 0 50px; }
}`,
  },
  {
    id: "bg-aurora-borealis-2",
    name: "Aurora Borealis 2.0",
    category: "backgrounds",
    description:
      "Multi-layer aurora borealis with flowing curtains, hue rotation, and depth",
    tags: ["aurora", "borealis", "flowing", "atmosphere"],
    previewType: "background",
    cssCode: `/* Aurora Borealis 2.0 */
.roycss-bg-aurora-borealis-2 {
  background:
    radial-gradient(ellipse 80% 50% at 30% 30%,
      oklch(0.6 0.3 150 / 0.6),
      transparent 60%),
    radial-gradient(ellipse 60% 40% at 70% 40%,
      oklch(0.55 0.3 200 / 0.55),
      transparent 60%),
    radial-gradient(ellipse 50% 30% at 50% 60%,
      oklch(0.5 0.35 280 / 0.45),
      transparent 60%),
    radial-gradient(ellipse 70% 40% at 80% 70%,
      oklch(0.55 0.32 170 / 0.4),
      transparent 60%),
    linear-gradient(180deg,
      oklch(0.04 0.04 250),
      oklch(0.1 0.1 230));
  background-size: 200% 200%, 220% 200%, 180% 200%, 240% 200%, 100% 100%;
  background-position: 0% 0%, 100% 50%, 50% 100%, 0% 80%, 0 0;
  border-radius: 0.5rem;
  position: relative;
  overflow: hidden;
  animation: roy-aurora-flow 14s ease-in-out infinite;
}
.roycss-bg-aurora-borealis-2::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle 1px at 15% 12%, oklch(0.95 0.05 60) 100%, transparent),
    radial-gradient(circle 1px at 35% 8%, oklch(0.95 0.05 60) 100%, transparent),
    radial-gradient(circle 1px at 60% 15%, oklch(0.95 0.05 60) 100%, transparent),
    radial-gradient(circle 1px at 85% 10%, oklch(0.95 0.05 60) 100%, transparent),
    radial-gradient(circle 1px at 25% 20%, oklch(0.95 0.05 60) 100%, transparent);
  opacity: 0.7;
  pointer-events: none;
}
@keyframes roy-aurora-flow {
  0%, 100% {
    background-position: 0% 0%, 100% 50%, 50% 100%, 0% 80%, 0 0;
    filter: hue-rotate(0deg) brightness(1);
  }
  33% {
    background-position: 50% 30%, 50% 0%, 100% 50%, 60% 60%, 0 0;
    filter: hue-rotate(25deg) brightness(1.1);
  }
  66% {
    background-position: 100% 50%, 0% 100%, 0% 50%, 100% 40%, 0 0;
    filter: hue-rotate(-15deg) brightness(1.05);
  }
}`,
  },

  /* ───────────────────────────── TEXT (4) ───────────────────────────── */
  {
    id: "text-cyber-glitch-2",
    name: "Cyber Glitch 2.0",
    category: "text",
    description:
      "Cyberpunk glitch text with RGB split, scanline overlay, and chromatic aberration jumps",
    tags: ["text", "cyberpunk", "glitch", "rgb"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Cyber Glitch 2.0 — requires data-text attribute */
.roycss-text-cyber-glitch-2 {
  position: relative;
  color: oklch(0.92 0.15 200);
  font-family: "Courier New", monospace;
  font-weight: 900;
  font-size: 48px;
  letter-spacing: 2px;
  text-shadow:
    2px 0 oklch(0.75 0.3 0),
    -2px 0 oklch(0.75 0.3 220);
  animation: roy-glitch-2-main 3s infinite;
}
.roycss-text-cyber-glitch-2::before,
.roycss-text-cyber-glitch-2::after {
  content: attr(data-text);
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  pointer-events: none;
}
.roycss-text-cyber-glitch-2::before {
  color: oklch(0.75 0.32 0);
  text-shadow: 0 0 8px oklch(0.7 0.3 0 / 0.7);
  animation: roy-glitch-2-red 2s infinite linear alternate;
  clip-path: inset(0 0 55% 0);
}
.roycss-text-cyber-glitch-2::after {
  color: oklch(0.75 0.32 220);
  text-shadow: 0 0 8px oklch(0.7 0.3 220 / 0.7);
  animation: roy-glitch-2-blue 2.4s infinite linear alternate;
  clip-path: inset(55% 0 0 0);
  background: repeating-linear-gradient(0deg,
    transparent 0 3px,
    oklch(0 0 0 / 0.15) 3px 4px);
  -webkit-background-clip: text;
  background-clip: text;
}
@keyframes roy-glitch-2-red {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-3px, 1px); }
  40% { transform: translate(3px, -1px); }
  60% { transform: translate(-2px, -1px); }
  80% { transform: translate(2px, 1px); }
}
@keyframes roy-glitch-2-blue {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(3px, -1px); }
  40% { transform: translate(-3px, 1px); }
  60% { transform: translate(2px, 1px); }
  80% { transform: translate(-2px, -1px); }
}
@keyframes roy-glitch-2-main {
  0%, 90%, 100% { transform: translate(0); filter: none; }
  92% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
  94% { transform: translate(2px, -1px); filter: hue-rotate(180deg); }
  96% { transform: translate(-1px, 0); filter: hue-rotate(270deg) invert(0.1); }
}`,
  },
  {
    id: "text-neon-flicker-2",
    name: "Neon Flicker 2.0",
    category: "text",
    description:
      "Neon sign with realistic flicker, electric buzz pulse, and subtle intermittent outages",
    tags: ["neon", "flicker", "sign", "electric"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Neon Flicker 2.0 */
.roycss-text-neon-flicker-2 {
  color: oklch(0.95 0.2 195);
  font-family: "Arial Black", sans-serif;
  font-weight: 900;
  font-size: 52px;
  letter-spacing: 3px;
  text-transform: uppercase;
  text-shadow:
    0 0 4px oklch(0.85 0.25 195),
    0 0 11px oklch(0.8 0.3 195),
    0 0 19px oklch(0.7 0.32 195),
    0 0 40px oklch(0.6 0.35 195),
    0 0 80px oklch(0.5 0.4 195);
  animation: roy-neon-2-flicker 3.2s infinite,
             roy-neon-2-buzz 0.08s infinite;
}
@keyframes roy-neon-2-flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% {
    opacity: 1;
    text-shadow:
      0 0 4px oklch(0.85 0.25 195),
      0 0 11px oklch(0.8 0.3 195),
      0 0 19px oklch(0.7 0.32 195),
      0 0 40px oklch(0.6 0.35 195),
      0 0 80px oklch(0.5 0.4 195);
  }
  20%, 24%, 55% {
    opacity: 0.4;
    text-shadow:
      0 0 2px oklch(0.85 0.25 195 / 0.5);
  }
  30%, 50% {
    opacity: 0.85;
    text-shadow:
      0 0 4px oklch(0.85 0.25 195),
      0 0 8px oklch(0.8 0.3 195 / 0.7);
  }
}
@keyframes roy-neon-2-buzz {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(0.3px, 0); }
}`,
  },
  {
    id: "text-typewriter-stream",
    name: "Typewriter Stream",
    category: "text",
    description:
      "Streaming typewriter text with blinking caret that types and retypes endlessly",
    tags: ["text", "typewriter", "stream", "cursor"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Typewriter Stream — single-line streaming text */
.roycss-text-typewriter-stream {
  display: inline-block;
  color: oklch(0.85 0.18 150);
  font-family: "Courier New", monospace;
  font-weight: 700;
  font-size: 32px;
  letter-spacing: 1px;
  overflow: hidden;
  white-space: nowrap;
  border-inline-end: 3px solid oklch(0.8 0.25 150);
  width: 0;
  animation:
    roy-type-stream 6s steps(11) infinite,
    roy-caret-stream 0.7s step-end infinite;
  text-shadow:
    0 0 8px oklch(0.7 0.25 150 / 0.6),
    0 0 16px oklch(0.6 0.3 150 / 0.3);
}
@keyframes roy-type-stream {
  0% { width: 0; }
  40% { width: 11ch; }
  60% { width: 11ch; }
  100% { width: 0; }
}
@keyframes roy-caret-stream {
  0%, 100% { border-inline-end-color: oklch(0.8 0.25 150); }
  50% { border-inline-end-color: transparent; }
}`,
  },
  {
    id: "text-depth-layered",
    name: "Layered Depth Text",
    category: "text",
    description:
      "3D extruded text with multiple layered shadows creating realistic depth and dimension",
    tags: ["text", "depth", "extrude", "3d"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Layered Depth Text */
.roycss-text-depth-layered {
  position: relative;
  display: inline-block;
  color: oklch(0.85 0.2 35);
  font-family: "Impact", "Arial Black", sans-serif;
  font-weight: 900;
  font-size: 64px;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow:
    1px 1px 0 oklch(0.7 0.22 30),
    2px 2px 0 oklch(0.65 0.22 28),
    3px 3px 0 oklch(0.6 0.22 26),
    4px 4px 0 oklch(0.55 0.22 24),
    5px 5px 0 oklch(0.5 0.22 22),
    6px 6px 0 oklch(0.45 0.22 20),
    7px 7px 0 oklch(0.4 0.22 18),
    8px 8px 0 oklch(0.35 0.22 16),
    9px 9px 0 oklch(0.3 0.2 14),
    10px 10px 0 oklch(0.25 0.18 12),
    11px 11px 0 oklch(0.2 0.16 10),
    12px 12px 0 oklch(0.15 0.14 8),
    13px 13px 6px oklch(0 0 0 / 0.4);
  background: linear-gradient(180deg,
    oklch(0.95 0.15 45) 0%,
    oklch(0.75 0.22 35) 50%,
    oklch(0.55 0.25 25) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px oklch(0 0 0 / 0.3));
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-text-depth-layered:hover {
  transform: perspective(500px) rotateX(20deg) translateZ(20px);
}`,
  },

  /* ───────────────────────────── MICROINTERACTIONS (3) ───────────────────────────── */
  {
    id: "micro-satisfying-check",
    name: "Satisfying Check",
    category: "microinteractions",
    description:
      "Checkmark that draws in with a bounce, shrink, and gentle overshoot — deeply satisfying",
    tags: ["micro", "checkmark", "satisfying", "bounce"],
    previewType: "box",
    cssCode: `/* Satisfying Checkmark */
.roycss-micro-satisfying-check {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%,
    oklch(0.85 0.25 150),
    oklch(0.55 0.3 155));
  box-shadow:
    0 8px 20px oklch(0.3 0.2 150 / 0.4),
    inset 0 2px 4px oklch(1 0 0 / 0.4),
    inset 0 -3px 6px oklch(0.3 0.15 150 / 0.4);
  animation: roy-check-pop 2.4s ease-in-out infinite;
}
.roycss-micro-satisfying-check::before {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  width: 26px;
  height: 13px;
  transform: translate(-50%, -65%) rotate(-45deg);
  border-inline-end: 4px solid oklch(0.98 0.05 150);
  border-block-end: 4px solid oklch(0.98 0.05 150);
  border-end-end-radius: 2px;
  transform-origin: center;
  filter: drop-shadow(0 1px 2px oklch(0 0 0 / 0.3));
  animation: roy-check-draw 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes roy-check-pop {
  0%, 40% {
    transform: scale(0.85);
    filter: brightness(0.9);
  }
  50% {
    transform: scale(1.15);
    filter: brightness(1.2);
  }
  60% {
    transform: scale(0.95);
  }
  70% {
    transform: scale(1.02);
  }
  80%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
}
@keyframes roy-check-draw {
  0%, 40% {
    width: 0;
    height: 0;
    opacity: 0;
  }
  50% {
    width: 8px;
    height: 4px;
    opacity: 1;
  }
  65% {
    width: 30px;
    height: 15px;
    opacity: 1;
  }
  75% {
    width: 24px;
    height: 12px;
  }
  85%, 100% {
    width: 26px;
    height: 13px;
    opacity: 1;
  }
}`,
  },
  {
    id: "micro-toggle-liquid",
    name: "Liquid Toggle",
    category: "microinteractions",
    description:
      "Toggle switch where the indicator morphs and flows like liquid when activated",
    tags: ["micro", "toggle", "liquid", "morph"],
    previewType: "box",
    cssCode: `/* Liquid Toggle — checkbox driven */
.roycss-micro-toggle-liquid {
  position: relative;
  display: inline-block;
  width: 70px;
  height: 36px;
  border-radius: 18px;
  background: oklch(0.3 0.05 250);
  box-shadow:
    inset 0 4px 8px oklch(0 0 0 / 0.3),
    inset 0 -2px 4px oklch(1 0 0 / 0.05),
    0 2px 8px oklch(0 0 0 / 0.2);
  cursor: pointer;
  transition: background 0.5s cubic-bezier(0.65, 0, 0.35, 1);
}
.roycss-micro-toggle-liquid::before {
  content: "";
  position: absolute;
  inset-block-start: 4px;
  inset-inline-start: 4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg,
    oklch(0.95 0.05 0),
    oklch(0.7 0.2 25));
  box-shadow:
    0 2px 6px oklch(0 0 0 / 0.3),
    inset 0 1px 0 oklch(1 0 0 / 0.5);
  transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55),
              border-radius 0.4s ease,
              background 0.4s ease;
  animation: roy-liquid-idle 2s ease-in-out infinite;
}
.roycss-micro-toggle-liquid:hover::before {
  border-radius: 30% 70% 70% 30% / 50%;
  transform: translateX(2px) scale(1.05);
}
.roycss-micro-toggle-liquid:active::before {
  border-radius: 50% 50% 30% 70% / 60% 40%;
  transform: translateX(15px) scale(1.1);
  background: linear-gradient(135deg,
    oklch(0.85 0.2 150),
    oklch(0.6 0.25 160));
}
@keyframes roy-liquid-idle {
  0%, 100% { border-radius: 50%; }
  50% { border-radius: 45% 55% 50% 50% / 50% 50% 55% 45%; }
}
.roycss-micro-toggle-liquid:active {
  background: oklch(0.4 0.2 150);
}`,
  },
  {
    id: "micro-pull-refresh",
    name: "Pull to Refresh",
    category: "microinteractions",
    description:
      "Pull-to-refresh indicator with elastic resistance and a spinner that engages on release",
    tags: ["micro", "pull", "refresh", "elastic"],
    previewType: "box",
    cssCode: `/* Pull to Refresh — animated indicator */
.roycss-micro-pull-refresh {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg,
    oklch(0.7 0.2 250),
    oklch(0.55 0.22 250));
  box-shadow:
    0 6px 16px oklch(0.3 0.1 250 / 0.35),
    inset 0 1px 0 oklch(1 0 0 / 0.4),
    inset 0 -2px 4px oklch(0.3 0.1 250 / 0.3);
  animation: roy-pull-cycle 3s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
.roycss-micro-pull-refresh::before {
  content: "";
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 3px solid oklch(0.95 0.05 250);
  border-block-start-color: transparent;
  border-inline-end-color: transparent;
  animation: roy-pull-spin 0.8s linear infinite;
  animation-delay: 1.2s;
  opacity: 0;
}
.roycss-micro-pull-refresh::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  width: 10px;
  height: 10px;
  transform: translate(-50%, -75%) rotate(45deg);
  border-inline-end: 3px solid oklch(0.95 0.05 250);
  border-block-end: 3px solid oklch(0.95 0.05 250);
  opacity: 1;
  animation: roy-pull-arrow 3s ease-in-out infinite;
}
@keyframes roy-pull-cycle {
  0%, 100% {
    transform: translateY(-20px) scale(0.6);
    filter: brightness(0.9);
  }
  20% {
    transform: translateY(0) scale(1.15);
    filter: brightness(1.2);
  }
  35% {
    transform: translateY(-2px) scale(0.95);
  }
  45% {
    transform: translateY(0) scale(1);
  }
  60% {
    transform: translateY(0) scale(1);
    filter: brightness(1);
  }
}
@keyframes roy-pull-arrow {
  0%, 40%, 80%, 100% { opacity: 1; transform: translate(-50%, -75%) rotate(45deg) scale(1); }
  50% { opacity: 0; transform: translate(-50%, -75%) rotate(45deg) scale(0.5); }
  90% { opacity: 0; }
}
@keyframes roy-pull-spin {
  0% { opacity: 0; transform: rotate(0); }
  10%, 80% { opacity: 1; }
  100% { opacity: 0; transform: rotate(720deg); }
}`,
  },
];
