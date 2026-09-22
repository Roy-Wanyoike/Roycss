import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 22 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch22: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // BACKGROUNDS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-bg-aurora",
  name: "Aurora",
  category: "backgrounds",
  description: "A flowing aurora gradient background with shifting color bands",
  tags: ["background", "gradient", "bg-aurora", "aurora", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-aurora {
  background: linear-gradient(135deg, oklch(0.179 0.057 283.68), oklch(0.327 0.096 283.81), oklch(0.274 0.048 282.79));
  position: relative;
  overflow: hidden;
}
.roycss-ferrum-bg-aurora::before {
  content: '';
  position: absolute;
  top: -50%; inset-inline-start: -50%;
  width: 200%; height: 200%;
  background:
    radial-gradient(ellipse at center, color-mix(in oklch, oklch(0.627 0.233 303.9) 30%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 30% 50%, color-mix(in oklch, oklch(0.685 0.131 226.94) 20%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 50%, color-mix(in oklch, oklch(0.652 0.241 354.31) 20%, transparent) 0%, transparent 50%);
  animation: roy-ferrum-aurora-bg 8s ease infinite;
}

@keyframes roy-ferrum-aurora-bg {

  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(5deg); }
  66% { transform: translate(-20px, 20px) rotate(-3deg); }
  100% { transform: translate(0, 0) rotate(0deg); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-bg-aurora::before {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-bg-liquid",
  name: "Liquid",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-liquid", "liquid", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-liquid {
  background: linear-gradient(135deg, oklch(0.627 0.233 303.9), oklch(0.685 0.131 226.94), oklch(0.652 0.241 354.31), oklch(0.627 0.233 303.9));
  background-size: 200% 200%;
  animation: roy-ferrum-bg-liquid 6s ease infinite;
}

@keyframes roy-ferrum-bg-liquid {

  0% { background-position: 0% 0%; }
  25% { background-position: 100% 0%; }
  50% { background-position: 100% 100%; }
  75% { background-position: 0% 100%; }
  100% { background-position: 0% 0%; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-bg-liquid {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-bg-waves",
  name: "Waves",
  category: "backgrounds",
  description: "A wave-pattern background with rippling motion",
  tags: ["background", "gradient", "bg-waves", "waves", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-waves {
  background:
    radial-gradient(ellipse at 50% 80%, color-mix(in oklch, oklch(0.627 0.233 303.9) 15%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse at 30% 60%, color-mix(in oklch, oklch(0.685 0.131 226.94) 10%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 70%, color-mix(in oklch, oklch(0.652 0.241 354.31) 10%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 90%, color-mix(in oklch, oklch(0.627 0.233 303.9) 20%, transparent) 0%, transparent 55%),
    linear-gradient(180deg, oklch(0.179 0.057 283.68) 0%, oklch(0.255 0.093 277.48) 100%);
  background-size: 100% 200%, 80% 150%, 80% 150%, 100% 200%, 100% 100%;
  animation: roy-ferrum-bg-waves 5s ease-in-out infinite;
}

@keyframes roy-ferrum-bg-waves {

  0%, 100% { background-position: 50% 0%, 20% 50%, 80% 50%, 50% 0%, center; }
  50% { background-position: 50% 10%, 30% 40%, 70% 60%, 50% 15%, center; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-bg-waves {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-bg-plasma",
  name: "Plasma",
  category: "backgrounds",
  description: "A plasma-style background with energetic color flows",
  tags: ["background", "gradient", "bg-plasma", "plasma", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-plasma {
  background:
    radial-gradient(circle at 20% 50%, oklch(0.627 0.233 303.9) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, oklch(0.652 0.241 354.31) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, oklch(0.685 0.131 226.94) 0%, transparent 50%),
    linear-gradient(135deg, oklch(0.228 0.038 282.93), oklch(0.179 0.057 283.68));
  background-size: 100% 100%;
  animation: roy-ferrum-bg-plasma 4s linear infinite;
  filter: hue-rotate(0deg);
}

@keyframes roy-ferrum-bg-plasma {

  0% { filter: hue-rotate(0deg); background-position: 0% 0%, 100% 0%, 50% 100%, center; }
  33% { filter: hue-rotate(120deg); background-position: 100% 100%, 0% 100%, 0% 0%, center; }
  66% { filter: hue-rotate(240deg); background-position: 100% 0%, 0% 0%, 100% 100%, center; }
  100% { filter: hue-rotate(360deg); background-position: 0% 0%, 100% 0%, 50% 100%, center; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-bg-plasma {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-bg-matrix",
  name: "Matrix",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-matrix", "matrix", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-matrix {
  background-color: oklch(0.145 0.0 89.88);
  position: relative;
  overflow: hidden;
}
.roycss-ferrum-bg-matrix::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      color-mix(in oklch, oklch(0.696 0.149 162.48) 3%, transparent) 2px,
      color-mix(in oklch, oklch(0.696 0.149 162.48) 3%, transparent) 4px
    );
  animation: roy-ferrum-matrix-scroll 20s linear infinite;
}
.roycss-ferrum-bg-matrix::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 24px,
      color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent) 24px,
      color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent) 25px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 24px,
      color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent) 24px,
      color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent) 25px
    );
}

@keyframes roy-ferrum-matrix-scroll {

  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-bg-matrix::before {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-bg-starfield",
  name: "Starfield",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-starfield", "starfield", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-starfield {
  background: oklch(0.155 0.034 281.74);
  position: relative;
  overflow: hidden;
}
.roycss-ferrum-bg-starfield::before {
  content: '';
  position: absolute;
  width: 2px; height: 2px;
  background: transparent;
  box-shadow:
    25px 15px 0 0 color-mix(in oklch, oklch(1 0 0) 80%, transparent),
    80px 40px 0 0 color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    150px 10px 0 0 color-mix(in oklch, oklch(0.627 0.233 303.9) 70%, transparent),
    200px 60px 0 0 color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    50px 90px 0 0 color-mix(in oklch, oklch(0.685 0.131 226.94) 70%, transparent),
    120px 70px 0 0 color-mix(in oklch, oklch(1 0 0) 40%, transparent),
    180px 30px 0 0 color-mix(in oklch, oklch(0.652 0.241 354.31) 60%, transparent),
    30px 50px 0 0 color-mix(in oklch, oklch(1 0 0) 90%, transparent),
    90px 85px 0 0 color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    160px 95px 0 0 color-mix(in oklch, oklch(0.627 0.233 303.9) 80%, transparent),
    70px 25px 0 0 color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    220px 50px 0 0 color-mix(in oklch, oklch(0.685 0.131 226.94) 50%, transparent),
    10px 70px 0 0 color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    140px 45px 0 0 color-mix(in oklch, oklch(0.652 0.241 354.31) 60%, transparent),
    190px 80px 0 0 color-mix(in oklch, oklch(1 0 0) 40%, transparent),
    60px 100px 0 0 color-mix(in oklch, oklch(1 0 0) 80%, transparent);
  animation: roy-ferrum-starfield-move 8s linear infinite;
}

@keyframes roy-ferrum-starfield-move {

  0% { transform: translateY(0); }
  100% { transform: translateY(-100px); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-bg-starfield::before {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-bg-smoke",
  name: "Smoke",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-smoke", "smoke", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-smoke {
  background: linear-gradient(135deg, oklch(0.228 0.038 282.93), oklch(0.179 0.057 283.68));
  position: relative;
  overflow: hidden;
}
.roycss-ferrum-bg-smoke::before,
.roycss-ferrum-bg-smoke::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
}
.roycss-ferrum-bg-smoke::before {
  width: 200px; height: 200px;
  background: radial-gradient(circle, color-mix(in oklch, oklch(0.627 0.233 303.9) 50%, transparent) 0%, transparent 70%);
  top: -50px; inset-inline-start: -50px;
  animation: roy-ferrum-smoke-drift1 10s ease-in-out infinite;
}
.roycss-ferrum-bg-smoke::after {
  width: 250px; height: 250px;
  background: radial-gradient(circle, color-mix(in oklch, oklch(0.652 0.241 354.31) 40%, transparent) 0%, transparent 70%);
  bottom: -70px; inset-inline-end: -70px;
  animation: roy-ferrum-smoke-drift2 12s ease-in-out infinite;
}

@keyframes roy-ferrum-smoke-drift1 {

  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(60px, 30px) scale(1.2); }
  50% { transform: translate(20px, 60px) scale(1); }
  75% { transform: translate(80px, 20px) scale(1.1); }

}

@keyframes roy-ferrum-smoke-drift2 {

  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-50px, -40px) scale(1.15); }
  66% { transform: translate(-30px, -60px) scale(0.95); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-bg-smoke::before {
    animation: none;
  }
  .roycss-ferrum-bg-smoke::after {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-bg-circuit",
  name: "Circuit",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-circuit", "circuit", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-circuit {
  background-color: oklch(0.169 0.025 265.16);
  position: relative;
  overflow: hidden;
}
.roycss-ferrum-bg-circuit::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 19px,
      color-mix(in oklch, oklch(0.685 0.131 226.94) 12%, transparent) 19px,
      color-mix(in oklch, oklch(0.685 0.131 226.94) 12%, transparent) 20px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 39px,
      color-mix(in oklch, oklch(0.685 0.131 226.94) 12%, transparent) 39px,
      color-mix(in oklch, oklch(0.685 0.131 226.94) 12%, transparent) 40px
    );
  animation: roy-ferrum-circuit-scan 3s linear infinite;
}
.roycss-ferrum-bg-circuit::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 40px 20px, color-mix(in oklch, oklch(0.685 0.131 226.94) 25%, transparent) 3px, transparent 3px),
    radial-gradient(circle at 120px 60px, color-mix(in oklch, oklch(0.627 0.233 303.9) 25%, transparent) 3px, transparent 3px),
    radial-gradient(circle at 200px 40px, color-mix(in oklch, oklch(0.685 0.131 226.94) 25%, transparent) 3px, transparent 3px),
    radial-gradient(circle at 80px 80px, color-mix(in oklch, oklch(0.627 0.233 303.9) 25%, transparent) 3px, transparent 3px),
    radial-gradient(circle at 160px 100px, color-mix(in oklch, oklch(0.685 0.131 226.94) 25%, transparent) 3px, transparent 3px);
  animation: roy-ferrum-circuit-nodes 4s ease-in-out infinite alternate;
}

@keyframes roy-ferrum-circuit-nodes {

  0% { opacity: 0.5; }
  100% { opacity: 1; }

}

@keyframes roy-ferrum-circuit-scan {

  0% { transform: translateY(0); }
  100% { transform: translateY(20px); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-bg-circuit::before {
    animation: none;
  }
  .roycss-ferrum-bg-circuit::after {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-bg-lava",
  name: "Lava",
  category: "backgrounds",
  description: "A flowing lava-lamp background with morphing blobs",
  tags: ["background", "gradient", "bg-lava", "lava", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-lava {
  background: linear-gradient(180deg, oklch(0.193 0.069 300.44), oklch(0.179 0.057 283.68));
  position: relative;
  overflow: hidden;
}
.roycss-ferrum-bg-lava::before,
.roycss-ferrum-bg-lava::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
}
.roycss-ferrum-bg-lava::before {
  width: 80px; height: 120px;
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(0.652 0.241 354.31) 60%, transparent) 0%, color-mix(in oklch, oklch(0.627 0.233 303.9) 20%, transparent) 60%, transparent 100%);
  inset-inline-start: 30%; bottom: -20%;
  animation: roy-ferrum-lava-rise1 5s ease-in-out infinite;
}
.roycss-ferrum-bg-lava::after {
  width: 60px; height: 100px;
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(0.705 0.213 51.16) 50%, transparent) 0%, color-mix(in oklch, oklch(0.652 0.241 354.31) 20%, transparent) 60%, transparent 100%);
  inset-inline-start: 60%; bottom: -20%;
  animation: roy-ferrum-lava-rise2 6s ease-in-out infinite;
  animation-delay: -2s;
}

@keyframes roy-ferrum-lava-rise1 {

  0% { transform: translateY(0) scaleX(1) scaleY(1); opacity: 0.8; }
  25% { transform: translateY(-80px) scaleX(1.3) scaleY(0.8); opacity: 1; }
  50% { transform: translateY(-160px) scaleX(0.7) scaleY(1.2); opacity: 0.6; }
  75% { transform: translateY(-120px) scaleX(1.2) scaleY(0.9); opacity: 0.4; }
  100% { transform: translateY(0) scaleX(1) scaleY(1); opacity: 0.8; }

}

@keyframes roy-ferrum-lava-rise2 {

  0% { transform: translateY(0) scaleX(1) scaleY(1); opacity: 0.7; }
  30% { transform: translateY(-100px) scaleX(1.4) scaleY(0.7); opacity: 1; }
  60% { transform: translateY(-180px) scaleX(0.6) scaleY(1.3); opacity: 0.5; }
  80% { transform: translateY(-80px) scaleX(1.1) scaleY(1); opacity: 0.3; }
  100% { transform: translateY(0) scaleX(1) scaleY(1); opacity: 0.7; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-bg-lava::before {
    animation: none;
  }
  .roycss-ferrum-bg-lava::after {
    animation: none;
  }
}
`,
},

  // ═══════════════════════════════════════════════════════════════
  // HOVER
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-img-zoom-in",
  name: "Img Zoom In",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-zoom-in", "zoom", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-zoom-in {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-zoom-in img {
  transition: transform 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (hover: hover) {
  .roycss-ferrum-img-zoom-in:hover img {
    transform: scale(1.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-zoom-in img {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-zoom-out",
  name: "Img Zoom Out",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-zoom-out", "zoom", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-zoom-out {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-zoom-out img {
  transition: transform 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.1);
}
@media (hover: hover) {
  .roycss-ferrum-img-zoom-out:hover img {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-zoom-out img {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-pan-right",
  name: "Img Pan Right",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-pan-right", "pan", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-pan-right {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-pan-right img {
  transition: transform 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.15) translateX(-5%);
}
@media (hover: hover) {
  .roycss-ferrum-img-pan-right:hover img {
    transform: scale(1.15) translateX(5%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-pan-right img {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-pan-left",
  name: "Img Pan Left",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-pan-left", "pan", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-pan-left {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-pan-left img {
  transition: transform 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.15) translateX(5%);
}
@media (hover: hover) {
  .roycss-ferrum-img-pan-left:hover img {
    transform: scale(1.15) translateX(-5%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-pan-left img {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-blur-reveal",
  name: "Img Blur Reveal",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-blur-reveal", "blur", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-blur-reveal {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-blur-reveal img {
  transition: filter 0.5s ease, transform 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(5px);
  transform: scale(1.05);
}
@media (hover: hover) {
  .roycss-ferrum-img-blur-reveal:hover img {
    filter: blur(0);
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-blur-reveal img {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-grayscale",
  name: "Img Grayscale",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-grayscale", "grayscale", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-grayscale {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-grayscale img {
  transition: filter 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(100%);
}
@media (hover: hover) {
  .roycss-ferrum-img-grayscale:hover img {
    filter: grayscale(0%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-grayscale img {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-sepia",
  name: "Img Sepia",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-sepia", "sepia", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-sepia {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-sepia img {
  transition: filter 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: sepia(100%);
}
@media (hover: hover) {
  .roycss-ferrum-img-sepia:hover img {
    filter: sepia(0%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-sepia img {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-brightness",
  name: "Img Brightness",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-brightness", "brightness", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-brightness {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-brightness img {
  transition: filter 0.4s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.7);
}
@media (hover: hover) {
  .roycss-ferrum-img-brightness:hover img {
    filter: brightness(1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-brightness img {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-contrast",
  name: "Img Contrast",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-contrast", "contrast", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-contrast {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-contrast img {
  transition: filter 0.4s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: contrast(0.7) brightness(0.9);
}
@media (hover: hover) {
  .roycss-ferrum-img-contrast:hover img {
    filter: contrast(1.2) brightness(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-contrast img {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-rotate-zoom",
  name: "Img Rotate Zoom",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-rotate-zoom", "rotate", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-rotate-zoom {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-rotate-zoom img {
  transition: transform 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (hover: hover) {
  .roycss-ferrum-img-rotate-zoom:hover img {
    transform: scale(1.1) rotate(3deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-rotate-zoom img {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-overlay-up",
  name: "Img Overlay Up",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-overlay-up", "overlay", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-overlay-up {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-overlay-up img {
  transition: transform 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (hover: hover) {
  .roycss-ferrum-img-overlay-up:hover img {
    transform: scale(1.05);
  }
}
.roycss-ferrum-img-overlay-up::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, color-mix(in oklch, oklch(0 0 0) 70%, transparent), transparent 60%);
  opacity: 0;
  transform: translateY(100%);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
@media (hover: hover) {
  .roycss-ferrum-img-overlay-up:hover::after {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-overlay-up img {
    transition: none;
  }
  .roycss-ferrum-img-overlay-up::after {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-overlay-fade",
  name: "Img Overlay Fade",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-overlay-fade", "overlay", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-overlay-fade {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-overlay-fade img {
  transition: filter 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (hover: hover) {
  .roycss-ferrum-img-overlay-fade:hover img {
    filter: brightness(0.7);
  }
}
.roycss-ferrum-img-overlay-fade::after {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in oklch, oklch(0 0 0) 50%, transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}
@media (hover: hover) {
  .roycss-ferrum-img-overlay-fade:hover::after {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-overlay-fade img {
    transition: none;
  }
  .roycss-ferrum-img-overlay-fade::after {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-split-reveal",
  name: "Img Split Reveal",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-split-reveal", "split", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-split-reveal {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-split-reveal img {
  transition: clip-path 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  clip-path: inset(0 0 0 0);
}
@media (hover: hover) {
  .roycss-ferrum-img-split-reveal:hover img {
    clip-path: inset(0 50% 0 50%);
  }
}
.roycss-ferrum-img-split-reveal::after {
  content: attr(data-label);
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(1 0 0);
  font-size: 1.25rem;
  font-weight: 600;
  background: color-mix(in oklch, oklch(0 0 0) 60%, transparent);
  opacity: 0;
  transition: opacity 0.4s ease 0.15s;
}
@media (hover: hover) {
  .roycss-ferrum-img-split-reveal:hover::after {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-split-reveal img {
    transition: none;
  }
  .roycss-ferrum-img-split-reveal::after {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-shutter",
  name: "Img Shutter",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-shutter", "shutter", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-shutter {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-shutter img {
  transition: clip-path 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  clip-path: inset(0 0 0 0);
}
@media (hover: hover) {
  .roycss-ferrum-img-shutter:hover img {
    clip-path: inset(48% 48% 48% 48%);
  }
}
.roycss-ferrum-img-shutter::before,
.roycss-ferrum-img-shutter::after {
  content: '';
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background: color-mix(in oklch, oklch(0 0 0) 85%, transparent);
  z-index: 1;
  transition: transform 0.5s ease;
}
.roycss-ferrum-img-shutter::before {
  inset-inline-start: 0;
  transform: translateX(-100%);
}
.roycss-ferrum-img-shutter::after {
  content: '';
  inset-inline-end: 0;
  inset-inline-start: auto;
  transform: translateX(100%);
}
@media (hover: hover) {
  .roycss-ferrum-img-shutter:hover::before {
    transform: translateX(0);
  }
}
@media (hover: hover) {
  .roycss-ferrum-img-shutter:hover::after {
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-shutter img {
    transition: none;
  }
  .roycss-ferrum-img-shutter::before,
.roycss-ferrum-img-shutter::after {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-circle-reveal",
  name: "Img Circle Reveal",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-circle-reveal", "circle", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-circle-reveal {
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-img-circle-reveal img {
  transition: clip-path 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(100%) contrast(1.1);
  clip-path: circle(0% at 50% 50%);
}
@media (hover: hover) {
  .roycss-ferrum-img-circle-reveal:hover img {
    clip-path: circle(75% at 50% 50%);
    filter: grayscale(0%) contrast(1);
  }
}
.roycss-ferrum-img-circle-reveal::after {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  transition: opacity 0.4s ease;
  pointer-events: none;
}
@media (hover: hover) {
  .roycss-ferrum-img-circle-reveal:hover::after {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-circle-reveal img {
    transition: none;
  }
  .roycss-ferrum-img-circle-reveal::after {
    transition: none;
  }
}
`,
},

{
  id: "ferrum-img-tilt-3d",
  name: "Img Tilt 3D",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["img-tilt-3d", "tilt", "interactive", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-img-tilt-3d {
  overflow: hidden;
  position: relative;
  perspective: 800px;
}
.roycss-ferrum-img-tilt-3d img {
  transition: transform 0.5s ease, box-shadow 0.5s ease;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: rotateX(0) rotateY(0);
  box-shadow: 0 4px 12px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
}
@media (hover: hover) {
  .roycss-ferrum-img-tilt-3d:hover img {
    transform: rotateX(-3deg) rotateY(3deg) scale(1.03);
    box-shadow: 8px 12px 28px color-mix(in oklch, oklch(0 0 0) 35%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-img-tilt-3d img {
    transition: none;
  }
}
`,
},

  // ═══════════════════════════════════════════════════════════════
  // LOADERS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-loader-spinner",
  name: "Spinner",
  category: "loaders",
  description: "A loading indicator with cyclical motion (spinner)",
  tags: ["loader", "spinner", "loader-spinner", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-spinner {
  width: 40px; height: 40px;
  border: 4px solid color-mix(in oklch, oklch(0.627 0.233 303.9) 20%, transparent);
  border-top-color: oklch(0.627 0.233 303.9);
  border-radius: 50%;
  animation: roy-ferrum-spinner 0.8s linear infinite;
}

@keyframes roy-ferrum-spinner {

  to { transform: rotate(360deg); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-spinner {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-dots",
  name: "Dots",
  category: "loaders",
  description: "A loading indicator with cyclical motion (dots)",
  tags: ["loader", "spinner", "loader-dots", "dots", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-dots {
  display: flex; gap: 6px;
}
.roycss-ferrum-loader-dots span {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: oklch(0.627 0.233 303.9);
  animation: roy-ferrum-dots-bounce 1.2s ease-in-out infinite;
}
.roycss-ferrum-loader-dots span:nth-child(2) { animation-delay: 0.15s; }
.roycss-ferrum-loader-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes roy-ferrum-dots-bounce {

  0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-dots span {
    animation: none;
  }
  .roycss-ferrum-loader-dots span:nth-child(2) {
    animation: none;
  }
  .roycss-ferrum-loader-dots span:nth-child(3) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-bars",
  name: "Bars",
  category: "loaders",
  description: "A loading indicator with cyclical motion (bars)",
  tags: ["loader", "spinner", "loader-bars", "bars", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-bars {
  display: flex; gap: 4px; align-items: end; height: 40px;
}
.roycss-ferrum-loader-bars span {
  width: 6px;
  background: linear-gradient(to top, oklch(0.627 0.233 303.9), oklch(0.652 0.241 354.31));
  border-radius: 3px;
  animation: roy-ferrum-bars 1s ease-in-out infinite;
}
.roycss-ferrum-loader-bars span:nth-child(1) { animation-delay: 0s; }
.roycss-ferrum-loader-bars span:nth-child(2) { animation-delay: 0.1s; }
.roycss-ferrum-loader-bars span:nth-child(3) { animation-delay: 0.2s; }
.roycss-ferrum-loader-bars span:nth-child(4) { animation-delay: 0.3s; }
.roycss-ferrum-loader-bars span:nth-child(5) { animation-delay: 0.4s; }

@keyframes roy-ferrum-bars {

  0%, 100% { height: 10px; }
  50% { height: 35px; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-bars span {
    animation: none;
  }
  .roycss-ferrum-loader-bars span:nth-child(1) {
    animation: none;
  }
  .roycss-ferrum-loader-bars span:nth-child(2) {
    animation: none;
  }
  .roycss-ferrum-loader-bars span:nth-child(3) {
    animation: none;
  }
  .roycss-ferrum-loader-bars span:nth-child(4) {
    animation: none;
  }
  .roycss-ferrum-loader-bars span:nth-child(5) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-pulse",
  name: "Pulse",
  category: "loaders",
  description: "A loading indicator with cyclical motion (pulse)",
  tags: ["loader", "spinner", "loader-pulse", "pulse", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-pulse {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: oklch(0.627 0.233 303.9);
  animation: roy-ferrum-loader-pulse 1.2s ease-in-out infinite;
}

@keyframes roy-ferrum-loader-pulse {

  0%, 100% { transform: scale(0.8); opacity: 0.5; box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.627 0.233 303.9) 60%, transparent); }
  50% { transform: scale(1); opacity: 1; box-shadow: 0 0 20px 10px color-mix(in oklch, oklch(0.627 0.233 303.9) 0%, transparent); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-pulse {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-orbit",
  name: "Orbit",
  category: "loaders",
  description: "A loading indicator with cyclical motion (orbit)",
  tags: ["loader", "spinner", "loader-orbit", "orbit", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-orbit {
  width: 40px; height: 40px;
  position: relative;
  animation: roy-ferrum-orbit-spin 2s linear infinite;
}
.roycss-ferrum-loader-orbit::before {
  content: '';
  position: absolute;
  top: 0; left: 50%;
  width: 10px; height: 10px;
  margin-left: -5px;
  border-radius: 50%;
  background: oklch(0.627 0.233 303.9);
  box-shadow: 0 0 10px oklch(0.627 0.233 303.9), 0 0 20px color-mix(in oklch, oklch(0.627 0.233 303.9) 50%, transparent);
}
.roycss-ferrum-loader-orbit::after {
  content: '';
  position: absolute;
  inset: 3px;
  border: 2px dashed color-mix(in oklch, oklch(0.627 0.233 303.9) 30%, transparent);
  border-radius: 50%;
}

@keyframes roy-ferrum-orbit-spin {

  to { transform: rotate(360deg); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-orbit {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-wave",
  name: "Wave",
  category: "loaders",
  description: "A loading indicator with cyclical motion (wave)",
  tags: ["loader", "spinner", "loader-wave", "wave", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-wave {
  display: flex; gap: 4px; align-items: center; height: 40px;
}
.roycss-ferrum-loader-wave span {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: oklch(0.685 0.131 226.94);
  animation: roy-ferrum-wave 1.4s ease-in-out infinite;
}
.roycss-ferrum-loader-wave span:nth-child(1) { animation-delay: 0s; }
.roycss-ferrum-loader-wave span:nth-child(2) { animation-delay: 0.1s; }
.roycss-ferrum-loader-wave span:nth-child(3) { animation-delay: 0.2s; }
.roycss-ferrum-loader-wave span:nth-child(4) { animation-delay: 0.3s; }
.roycss-ferrum-loader-wave span:nth-child(5) { animation-delay: 0.4s; }

@keyframes roy-ferrum-wave {

  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-15px); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-wave span {
    animation: none;
  }
  .roycss-ferrum-loader-wave span:nth-child(1) {
    animation: none;
  }
  .roycss-ferrum-loader-wave span:nth-child(2) {
    animation: none;
  }
  .roycss-ferrum-loader-wave span:nth-child(3) {
    animation: none;
  }
  .roycss-ferrum-loader-wave span:nth-child(4) {
    animation: none;
  }
  .roycss-ferrum-loader-wave span:nth-child(5) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-dna",
  name: "Dna",
  category: "loaders",
  description: "A loading indicator with cyclical motion (dna)",
  tags: ["loader", "spinner", "loader-dna", "dna", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-dna {
  display: flex; gap: 2px; align-items: center; height: 50px;
}
.roycss-ferrum-loader-dna span {
  width: 8px; height: 8px;
  border-radius: 50%;
  animation: roy-ferrum-dna 1.5s ease-in-out infinite;
}
.roycss-ferrum-loader-dna span:nth-child(odd) { background: oklch(0.627 0.233 303.9); }
.roycss-ferrum-loader-dna span:nth-child(even) { background: oklch(0.652 0.241 354.31); }
.roycss-ferrum-loader-dna span:nth-child(1) { animation-delay: 0s; }
.roycss-ferrum-loader-dna span:nth-child(2) { animation-delay: 0.1s; }
.roycss-ferrum-loader-dna span:nth-child(3) { animation-delay: 0.2s; }
.roycss-ferrum-loader-dna span:nth-child(4) { animation-delay: 0.3s; }
.roycss-ferrum-loader-dna span:nth-child(5) { animation-delay: 0.4s; }
.roycss-ferrum-loader-dna span:nth-child(6) { animation-delay: 0.5s; }
.roycss-ferrum-loader-dna span:nth-child(7) { animation-delay: 0.6s; }

@keyframes roy-ferrum-dna {

  0%, 100% { transform: translateY(0) scale(0.6); opacity: 0.4; }
  50% { transform: translateY(-15px) scale(1); opacity: 1; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-dna span {
    animation: none;
  }
  .roycss-ferrum-loader-dna span:nth-child(1) {
    animation: none;
  }
  .roycss-ferrum-loader-dna span:nth-child(2) {
    animation: none;
  }
  .roycss-ferrum-loader-dna span:nth-child(3) {
    animation: none;
  }
  .roycss-ferrum-loader-dna span:nth-child(4) {
    animation: none;
  }
  .roycss-ferrum-loader-dna span:nth-child(5) {
    animation: none;
  }
  .roycss-ferrum-loader-dna span:nth-child(6) {
    animation: none;
  }
  .roycss-ferrum-loader-dna span:nth-child(7) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-circle-fade",
  name: "Circle Fade",
  category: "loaders",
  description: "A loading indicator with cyclical motion (circle fade)",
  tags: ["loader", "spinner", "loader-circle-fade", "circle", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-circle-fade {
  width: 40px; height: 40px;
  position: relative;
}
.roycss-ferrum-loader-circle-fade span {
  position: absolute;
  width: 100%; height: 100%;
  border: 3px solid transparent;
  border-top-color: oklch(0.627 0.233 303.9);
  border-radius: 50%;
  animation: roy-ferrum-circle-fade 1.2s linear infinite;
}
.roycss-ferrum-loader-circle-fade span:nth-child(2) {
  width: 70%; height: 70%;
  top: 15%; left: 15%;
  border-top-color: oklch(0.652 0.241 354.31);
  animation-delay: 0.15s;
  animation-direction: reverse;
}

@keyframes roy-ferrum-circle-fade {

  0% { transform: rotate(0deg); opacity: 1; }
  50% { opacity: 0.5; }
  100% { transform: rotate(360deg); opacity: 1; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-circle-fade span {
    animation: none;
  }
  .roycss-ferrum-loader-circle-fade span:nth-child(2) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-square-spin",
  name: "Square Spin",
  category: "loaders",
  description: "A loading indicator with cyclical motion (square spin)",
  tags: ["loader", "spinner", "loader-square-spin", "square", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-square-spin {
  width: 30px; height: 30px;
  border: 3px solid oklch(0.627 0.233 303.9);
  animation: roy-ferrum-square-spin 1.5s ease-in-out infinite;
}

@keyframes roy-ferrum-square-spin {

  0% { transform: rotate(0deg); border-radius: 0; }
  25% { transform: rotate(90deg); border-radius: 50% 0 0 0; }
  50% { transform: rotate(180deg); border-radius: 50%; }
  75% { transform: rotate(270deg); border-radius: 0 0 50% 0; }
  100% { transform: rotate(360deg); border-radius: 0; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-square-spin {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-ring",
  name: "Ring",
  category: "loaders",
  description: "A loading indicator with cyclical motion (ring)",
  tags: ["loader", "spinner", "loader-ring", "ring", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-ring {
  width: 40px; height: 40px;
  position: relative;
}
.roycss-ferrum-loader-ring span {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: roy-ferrum-ring-spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}
.roycss-ferrum-loader-ring span:nth-child(1) {
  border-top-color: oklch(0.627 0.233 303.9);
  border-bottom-color: oklch(0.627 0.233 303.9);
}
.roycss-ferrum-loader-ring span:nth-child(2) {
  border-inline-start-color: oklch(0.652 0.241 354.31);
  border-inline-end-color: oklch(0.652 0.241 354.31);
  animation-direction: reverse;
}

@keyframes roy-ferrum-ring-spin {

  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-ring span {
    animation: none;
  }
  .roycss-ferrum-loader-ring span:nth-child(2) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-cube",
  name: "Cube",
  category: "loaders",
  description: "A loading indicator with cyclical motion (cube)",
  tags: ["loader", "spinner", "loader-cube", "cube", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-cube {
  width: 40px; height: 40px;
  position: relative;
  transform-style: preserve-3d;
  animation: roy-ferrum-cube-rotate 2s linear infinite;
}
.roycss-ferrum-loader-cube span {
  position: absolute;
  width: 100%; height: 100%;
  border: 2px solid color-mix(in oklch, oklch(0.627 0.233 303.9) 60%, transparent);
  background: color-mix(in oklch, oklch(0.627 0.233 303.9) 10%, transparent);
  border-radius: 4px;
}
.roycss-ferrum-loader-cube span:nth-child(1) { transform: rotateY(0deg) translateZ(20px); }
.roycss-ferrum-loader-cube span:nth-child(2) { transform: rotateY(90deg) translateZ(20px); }
.roycss-ferrum-loader-cube span:nth-child(3) { transform: rotateY(180deg) translateZ(20px); }
.roycss-ferrum-loader-cube span:nth-child(4) { transform: rotateY(270deg) translateZ(20px); }
.roycss-ferrum-loader-cube span:nth-child(5) { transform: rotateX(90deg) translateZ(20px); }
.roycss-ferrum-loader-cube span:nth-child(6) { transform: rotateX(-90deg) translateZ(20px); }

@keyframes roy-ferrum-cube-rotate {

  0% { transform: rotateX(0deg) rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-cube {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-hourglass",
  name: "Hourglass",
  category: "loaders",
  description: "A loading indicator with cyclical motion (hourglass)",
  tags: ["loader", "spinner", "loader-hourglass", "hourglass", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-hourglass {
  width: 40px; height: 40px;
  position: relative;
  animation: roy-ferrum-hourglass-flip 2s ease-in-out infinite;
}
.roycss-ferrum-loader-hourglass span {
  position: absolute;
  left: 50%; top: 50%;
  width: 0; height: 0;
  transform: translate(-50%, -50%);
}
.roycss-ferrum-loader-hourglass span:nth-child(1) {
  border-inline-start: 16px solid transparent;
  border-inline-end: 16px solid transparent;
  border-top: 20px solid oklch(0.627 0.233 303.9);
  transform: translate(-50%, -50%) translateY(4px);
}
.roycss-ferrum-loader-hourglass span:nth-child(2) {
  border-left: 16px solid transparent;
  border-right: 16px solid transparent;
  border-bottom: 20px solid oklch(0.652 0.241 354.31);
  transform: translate(-50%, -50%) translateY(-4px);
}

@keyframes roy-ferrum-hourglass-flip {

  0%, 40% { transform: rotate(0deg) scale(1); }
  50%, 90% { transform: rotate(180deg) scale(1); }
  100% { transform: rotate(360deg) scale(1); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-hourglass {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-grid",
  name: "Grid",
  category: "loaders",
  description: "A loading indicator with cyclical motion (grid)",
  tags: ["loader", "spinner", "loader-grid", "grid", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-grid {
  display: grid;
  grid-template-columns: repeat(3, 12px);
  grid-template-rows: repeat(3, 12px);
  gap: 4px;
}
.roycss-ferrum-loader-grid span {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: oklch(0.627 0.233 303.9);
  animation: roy-ferrum-grid-pop 1.4s ease-in-out infinite;
}
.roycss-ferrum-loader-grid span:nth-child(1) { animation-delay: 0s; }
.roycss-ferrum-loader-grid span:nth-child(2) { animation-delay: 0.1s; }
.roycss-ferrum-loader-grid span:nth-child(3) { animation-delay: 0.2s; }
.roycss-ferrum-loader-grid span:nth-child(4) { animation-delay: 0.3s; }
.roycss-ferrum-loader-grid span:nth-child(5) { animation-delay: 0.4s; }
.roycss-ferrum-loader-grid span:nth-child(6) { animation-delay: 0.5s; }
.roycss-ferrum-loader-grid span:nth-child(7) { animation-delay: 0.6s; }
.roycss-ferrum-loader-grid span:nth-child(8) { animation-delay: 0.7s; }
.roycss-ferrum-loader-grid span:nth-child(9) { animation-delay: 0.8s; }

@keyframes roy-ferrum-grid-pop {

  0%, 70%, 100% { transform: scale(0.3); opacity: 0.2; }
  35% { transform: scale(1); opacity: 1; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-grid span {
    animation: none;
  }
  .roycss-ferrum-loader-grid span:nth-child(1) {
    animation: none;
  }
  .roycss-ferrum-loader-grid span:nth-child(2) {
    animation: none;
  }
  .roycss-ferrum-loader-grid span:nth-child(3) {
    animation: none;
  }
  .roycss-ferrum-loader-grid span:nth-child(4) {
    animation: none;
  }
  .roycss-ferrum-loader-grid span:nth-child(5) {
    animation: none;
  }
  .roycss-ferrum-loader-grid span:nth-child(6) {
    animation: none;
  }
  .roycss-ferrum-loader-grid span:nth-child(7) {
    animation: none;
  }
  .roycss-ferrum-loader-grid span:nth-child(8) {
    animation: none;
  }
  .roycss-ferrum-loader-grid span:nth-child(9) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-ripple",
  name: "Ripple",
  category: "loaders",
  description: "A loading indicator with cyclical motion (ripple)",
  tags: ["loader", "spinner", "loader-ripple", "ripple", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-ripple {
  width: 40px; height: 40px;
  position: relative;
}
.roycss-ferrum-loader-ripple span {
  position: absolute;
  inset: 0;
  border: 2px solid oklch(0.627 0.233 303.9);
  border-radius: 50%;
  animation: roy-ferrum-ripple-expand 1.5s ease-out infinite;
}
.roycss-ferrum-loader-ripple span:nth-child(2) { animation-delay: 0.5s; }
.roycss-ferrum-loader-ripple span:nth-child(3) { animation-delay: 1s; }

@keyframes roy-ferrum-ripple-expand {

  0% { transform: scale(0.2); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-ripple span {
    animation: none;
  }
  .roycss-ferrum-loader-ripple span:nth-child(2) {
    animation: none;
  }
  .roycss-ferrum-loader-ripple span:nth-child(3) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-typing",
  name: "Typing",
  category: "loaders",
  description: "A loading indicator with cyclical motion (typing)",
  tags: ["loader", "spinner", "loader-typing", "typing", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-typing {
  display: flex; gap: 4px; align-items: center; height: 30px;
}
.roycss-ferrum-loader-typing span {
  width: 6px;
  border-radius: 3px;
  background: oklch(0.627 0.233 303.9);
  animation: roy-ferrum-typing-bounce 1.2s ease-in-out infinite;
}
.roycss-ferrum-loader-typing span:nth-child(1) { height: 10px; animation-delay: 0s; }
.roycss-ferrum-loader-typing span:nth-child(2) { height: 20px; animation-delay: 0.15s; }
.roycss-ferrum-loader-typing span:nth-child(3) { height: 14px; animation-delay: 0.3s; }

@keyframes roy-ferrum-typing-bounce {

  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-typing span {
    animation: none;
  }
  .roycss-ferrum-loader-typing span:nth-child(1) {
    animation: none;
  }
  .roycss-ferrum-loader-typing span:nth-child(2) {
    animation: none;
  }
  .roycss-ferrum-loader-typing span:nth-child(3) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-pencil",
  name: "Pencil",
  category: "loaders",
  description: "A loading indicator with cyclical motion (pencil)",
  tags: ["loader", "spinner", "loader-pencil", "pencil", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-pencil {
  width: 8px; height: 40px;
  position: relative;
  animation: roy-ferrum-pencil-rotate 1.2s ease-in-out infinite;
  transform-origin: bottom center;
}
.roycss-ferrum-loader-pencil span {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}
.roycss-ferrum-loader-pencil span:nth-child(1) {
  width: 8px; height: 28px;
  background: linear-gradient(to top, oklch(0.769 0.188 70.08), oklch(0.837 0.164 84.43));
  border-radius: 2px 2px 0 0;
}
.roycss-ferrum-loader-pencil span:nth-child(2) {
  width: 0; height: 0;
  border-inline-start: 4px solid transparent;
  border-inline-end: 4px solid transparent;
  border-top: 10px solid oklch(0.627 0.233 303.9);
  bottom: -2px;
}

@keyframes roy-ferrum-pencil-rotate {

  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(30deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(-30deg); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-pencil {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-atom",
  name: "Atom",
  category: "loaders",
  description: "A loading indicator with cyclical motion (atom)",
  tags: ["loader", "spinner", "loader-atom", "atom", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-atom {
  width: 60px; height: 60px;
  position: relative;
}
.roycss-ferrum-loader-atom span {
  position: absolute;
  width: 100%; height: 100%;
  border: 1.5px solid color-mix(in oklch, oklch(0.627 0.233 303.9) 40%, transparent);
  border-radius: 50%;
}
.roycss-ferrum-loader-atom span::after {
  content: '';
  position: absolute;
  top: -4px; left: 50%;
  margin-left: -4px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: oklch(0.627 0.233 303.9);
}
.roycss-ferrum-loader-atom span:nth-child(1) {
  animation: roy-ferrum-atom-orbit-1 1.5s linear infinite;
}
.roycss-ferrum-loader-atom span:nth-child(2) {
  animation: roy-ferrum-atom-orbit-2 1.5s linear infinite;
}
.roycss-ferrum-loader-atom span:nth-child(3) {
  animation: roy-ferrum-atom-orbit-3 1.5s linear infinite;
}
.roycss-ferrum-loader-atom::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 10px; height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: oklch(0.652 0.241 354.31);
}

@keyframes roy-ferrum-atom-orbit-1 {

  0% { transform: rotateX(60deg) rotateY(0deg); }
  100% { transform: rotateX(60deg) rotateY(360deg); }

}

@keyframes roy-ferrum-atom-orbit-2 {

  0% { transform: rotateX(60deg) rotateY(120deg); }
  100% { transform: rotateX(60deg) rotateY(480deg); }

}

@keyframes roy-ferrum-atom-orbit-3 {

  0% { transform: rotateX(60deg) rotateY(240deg); }
  100% { transform: rotateX(60deg) rotateY(600deg); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-atom span:nth-child(1) {
    animation: none;
  }
  .roycss-ferrum-loader-atom span:nth-child(2) {
    animation: none;
  }
  .roycss-ferrum-loader-atom span:nth-child(3) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-bar-progress",
  name: "Bar Progress",
  category: "loaders",
  description: "A loading indicator with cyclical motion (bar progress)",
  tags: ["loader", "spinner", "loader-bar-progress", "bar", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-bar-progress {
  width: 80px; height: 6px;
  background: color-mix(in oklch, oklch(0.627 0.233 303.9) 15%, transparent);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}
.roycss-ferrum-loader-bar-progress span {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, oklch(0.627 0.233 303.9), oklch(0.652 0.241 354.31), oklch(0.627 0.233 303.9));
  background-size: 200% 100%;
  border-radius: 3px;
  animation: roy-ferrum-bar-progress 1.5s ease-in-out infinite;
}

@keyframes roy-ferrum-bar-progress {

  0% { transform: translateX(-100%); background-position: 0% 0; }
  50% { background-position: 100% 0; }
  100% { transform: translateX(100%); background-position: 0% 0; }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-bar-progress span {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-clock",
  name: "Clock",
  category: "loaders",
  description: "A loading indicator with cyclical motion (clock)",
  tags: ["loader", "spinner", "loader-clock", "clock", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-clock {
  width: 40px; height: 40px;
  border: 3px solid color-mix(in oklch, oklch(0.627 0.233 303.9) 30%, transparent);
  border-radius: 50%;
  position: relative;
}
.roycss-ferrum-loader-clock span {
  position: absolute;
  bottom: 50%; left: 50%;
  width: 2px; height: 14px;
  margin-left: -1px;
  background: oklch(0.627 0.233 303.9);
  border-radius: 1px;
  transform-origin: bottom center;
  animation: roy-ferrum-clock-tick 1.5s steps(12, end) infinite;
}
.roycss-ferrum-loader-clock::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 6px; height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: oklch(0.652 0.241 354.31);
}

@keyframes roy-ferrum-clock-tick {

  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-clock span {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-bounce",
  name: "Bounce",
  category: "loaders",
  description: "A loading indicator with cyclical motion (bounce)",
  tags: ["loader", "spinner", "loader-bounce", "bounce", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-bounce {
  width: 24px; height: 40px;
  position: relative;
}
.roycss-ferrum-loader-bounce span {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 24px; height: 24px;
  margin-left: -12px;
  border-radius: 50%;
  background: linear-gradient(135deg, oklch(0.627 0.233 303.9), oklch(0.652 0.241 354.31));
  animation: roy-ferrum-bounce-squash 0.6s ease-in-out infinite alternate;
  box-shadow: 0 4px 15px color-mix(in oklch, oklch(0.627 0.233 303.9) 40%, transparent);
}

@keyframes roy-ferrum-bounce-squash {

  0% { transform: translateY(0) scaleX(1) scaleY(1); }
  30% { transform: translateY(-30px) scaleX(0.95) scaleY(1.05); }
  50% { transform: translateY(-32px) scaleX(1) scaleY(1); }
  80% { transform: translateY(0) scaleX(1.15) scaleY(0.85); }
  100% { transform: translateY(0) scaleX(1.1) scaleY(0.9); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-bounce span {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-moon",
  name: "Moon",
  category: "loaders",
  description: "A loading indicator with cyclical motion (moon)",
  tags: ["loader", "spinner", "loader-moon", "moon", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-moon {
  width: 30px; height: 30px;
  position: relative;
  animation: roy-ferrum-moon-rotate 2s ease-in-out infinite;
}
.roycss-ferrum-loader-moon span {
  position: absolute;
  width: 100%; height: 100%;
  border-radius: 50%;
  background: oklch(0.627 0.233 303.9);
}
.roycss-ferrum-loader-moon span:nth-child(2) {
  background: oklch(0.179 0.057 283.68);
  animation: roy-ferrum-moon-shadow 2s ease-in-out infinite;
}

@keyframes roy-ferrum-moon-rotate {

  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(180deg); }

}

@keyframes roy-ferrum-moon-shadow {

  0%, 100% { transform: translateX(-40%); }
  50% { transform: translateX(40%); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-loader-moon {
    animation: none;
  }
  .roycss-ferrum-loader-moon span:nth-child(2) {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-loader-heartbeat",
  name: "Heartbeat",
  category: "loaders",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["loader", "spinner", "loader-heartbeat", "heartbeat", "animated"],
  previewType: "loader",
  cssCode: `/* Heartbeat Loader — a pure-CSS heart that beats */
.roycss-ferrum-loader-heartbeat {
  position: relative;
  inline-size: 30px;
  block-size: 30px;
  background: oklch(0.652 0.241 354.31);
  transform: rotate(45deg);
  animation: roy-ferrum-heartbeat-pulse 1.2s ease-in-out infinite;
}

.roycss-ferrum-loader-heartbeat::before,
.roycss-ferrum-loader-heartbeat::after {
  content: '';
  position: absolute;
  inline-size: 30px;
  block-size: 30px;
  border-radius: 50%;
  background: oklch(0.652 0.241 354.31);
}

.roycss-ferrum-loader-heartbeat::before {
  inset-block-start: -15px;
  inset-inline-start: 0;
}

.roycss-ferrum-loader-heartbeat::after {
  inset-inline-start: -15px;
  inset-block-start: 0;
}

@keyframes roy-ferrum-heartbeat-pulse {
  0%, 100% { transform: rotate(45deg) scale(1); }
  14%      { transform: rotate(45deg) scale(1.2); }
  28%      { transform: rotate(45deg) scale(1); }
  42%      { transform: rotate(45deg) scale(1.2); }
  56%      { transform: rotate(45deg) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  /* Heartbeat Loader — a pure-CSS heart that beats */
.roycss-ferrum-loader-heartbeat {
    animation: none;
  }
}
`,
},

  // ═══════════════════════════════════════════════════════════════
  // PAGE-TRANSITIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-circle-reveal-in",
  name: "Circle Reveal In",
  category: "page-transitions",
  description: "An animated motion effect (circle reveal in)",
  tags: ["circle-reveal-in", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-circle-reveal-in {
    animation: roy-ferrum-circle-reveal-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes roy-ferrum-circle-reveal-in {

    0%   { clip-path: circle(0% at 50% 50%); }
    100% { clip-path: circle(75% at 50% 50%); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-circle-reveal-in {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-circle-reveal-out",
  name: "Circle Reveal Out",
  category: "page-transitions",
  description: "An animated motion effect (circle reveal out)",
  tags: ["circle-reveal-out", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-circle-reveal-out {
    animation: roy-ferrum-circle-reveal-out 0.8s cubic-bezier(0.55, 0.06, 0.68, 0.19) forwards;
}

@keyframes roy-ferrum-circle-reveal-out {

    0%   { clip-path: circle(75% at 50% 50%); }
    100% { clip-path: circle(0% at 50% 50%); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-circle-reveal-out {
    animation: none;
  }
}
`,
},

{
  id: "ferrum-diamond-reveal",
  name: "Diamond Reveal",
  category: "page-transitions",
  description: "An animated motion effect (diamond reveal)",
  tags: ["diamond-reveal", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-diamond-reveal {
    animation: roy-ferrum-diamond-reveal 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes roy-ferrum-diamond-reveal {

    0%   { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); }
    40%  { clip-path: polygon(50% 10%, 90% 50%, 50% 90%, 10% 50%); }
    100% { clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }

}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-diamond-reveal {
    animation: none;
  }
}
`,
},

];
