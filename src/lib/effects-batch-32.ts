import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 32 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch32: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // 3D-TRANSFORMS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-perspective-tilt",
  name: "Perspective Tilt",
  category: "3d-transforms",
  description: "A 3D transform effect with perspective depth",
  tags: ["perspective-tilt", "tilt", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-perspective-tilt {
  transform-style: preserve-3d;
  transform: perspective(800px) rotateX(5deg) rotateY(-5deg);
  transition: transform 0.4s ease;
  box-shadow: 8px 8px 20px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
}`,
},

{
  id: "ferrum-scale-3d",
  name: "Scale 3D",
  category: "3d-transforms",
  description: "A 3D transform effect with perspective depth",
  tags: ["scale-3d", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scale-3d {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.432 0.086 166.91));
  border-radius: 8px;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
  box-shadow: 0 4px 10px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}`,
},

{
  id: "ferrum-scale-compress",
  name: "Scale Compress",
  category: "3d-transforms",
  description: "An animated motion effect (scale compress)",
  tags: ["scale-compress", "compress", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scale-compress {
  animation: roy-scale-compress 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transform-origin: center;
}

@keyframes roy-scale-compress {

  0% {
    opacity: 0;
    transform: scaleY(0.2) scaleX(1.4);
  }
  60% {
    opacity: 1;
    transform: scaleY(1.15) scaleX(0.9);
  }
  100% {
    transform: scaleY(1) scaleX(1);
  }

}`,
},

{
  id: "ferrum-scale-expand",
  name: "Scale Expand",
  category: "3d-transforms",
  description: "An animated motion effect (scale expand)",
  tags: ["scale-expand", "expand", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scale-expand {
  animation: roy-scale-expand 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: center;
}

@keyframes roy-scale-expand {

  0% {
    opacity: 0;
    transform: scaleX(0.2) scaleY(0.6);
  }
  55% {
    opacity: 1;
    transform: scaleX(1.1) scaleY(0.85);
  }
  100% {
    transform: scaleX(1) scaleY(1);
  }

}`,
},

{
  id: "ferrum-skew-3d",
  name: "Skew 3D",
  category: "3d-transforms",
  description: "A 3D transform effect with perspective depth",
  tags: ["skew-3d", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skew-3d {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, oklch(0.685 0.131 226.94), oklch(0.566 0.245 278.69));
  border-radius: 8px;
  transform: perspective(800px) skew(-15deg, 5deg);
  transition: transform 0.5s ease;
  box-shadow: 6px 6px 12px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-pendulum",
  name: "Pendulum",
  category: "animations",
  description: "An animated motion effect (pendulum)",
  tags: ["pendulum", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-pendulum {
  animation: roy-pendulum 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  transform-origin: top center;
}

@keyframes roy-pendulum {

  0%   { transform: rotate(28deg); }
  50%  { transform: rotate(-28deg); }
  100% { transform: rotate(28deg); }

}`,
},

{
  id: "ferrum-pendulum-swing-spring",
  name: "Pendulum Swing Spring",
  category: "animations",
  description: "An animated motion effect (pendulum swing spring)",
  tags: ["pendulum-swing-spring", "swing", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-pendulum-swing-spring {
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

}`,
},

{
  id: "ferrum-pop-in",
  name: "Pop In",
  category: "animations",
  description: "An animated motion effect (pop in)",
  tags: ["pop-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-pop-in {
  animation: roy-pop-in 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
}

@keyframes roy-pop-in {

  0% {
    opacity: 0;
    transform: scale3d(0, 0, 0);
  }
  60% {
    opacity: 1;
    transform: scale3d(1.2, 1.2, 1.2);
  }
  100% {
    transform: scale3d(1, 1, 1);
  }

}`,
},

{
  id: "ferrum-pop-out",
  name: "Pop Out",
  category: "animations",
  description: "An animated motion effect (pop out)",
  tags: ["pop-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-pop-out {
  animation: roy-pop-out 0.5s cubic-bezier(0.32, -0.28, 0.82, 0.11) both;
}

@keyframes roy-pop-out {

  0% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
  50% {
    opacity: 0.7;
    transform: scale3d(1.2, 1.2, 1.2);
  }
  100% {
    opacity: 0;
    transform: scale3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-pulse-soft",
  name: "Pulse Soft",
  category: "animations",
  description: "An animated motion effect (pulse soft)",
  tags: ["pulse", "motion", "pulse-soft", "soft", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-pulse-soft {
  animation: roy-pulse-soft 2.5s ease-in-out infinite;
}

@keyframes roy-pulse-soft {

  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }

}`,
},

{
  id: "ferrum-rotate-3d",
  name: "Rotate 3D",
  category: "animations",
  description: "An animated motion effect (rotate 3d)",
  tags: ["rotate", "transform", "rotate-3d", "3d", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rotate-3d {
  transform-style: preserve-3d;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.566 0.245 278.69));
  border-radius: 12px;
  animation: roy-rotate-3d 4s linear infinite;
}

@keyframes roy-rotate-3d {

  0% { transform: perspective(800px) rotate3d(1, 1, 1, 0deg); }
  100% { transform: perspective(800px) rotate3d(1, 1, 1, 360deg); }

}`,
},

{
  id: "ferrum-rotate-spin",
  name: "Rotate Spin",
  category: "animations",
  description: "An animated motion effect (rotate spin)",
  tags: ["rotate", "transform", "rotate-spin", "spin", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rotate-spin {
  animation: roy-rotate-spin 2s linear infinite;
}

@keyframes roy-rotate-spin {

  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }

}`,
},

{
  id: "ferrum-rotate-x",
  name: "Rotate X",
  category: "animations",
  description: "An animated motion effect (rotate x)",
  tags: ["rotate", "transform", "rotate-x", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rotate-x {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.685 0.131 226.94));
  border-radius: 8px;
  transform-style: preserve-3d;
  animation: roy-rotate-x 3s linear infinite;
}

@keyframes roy-rotate-x {

  0% { transform: perspective(800px) rotateX(0deg); }
  100% { transform: perspective(800px) rotateX(360deg); }

}`,
},

{
  id: "ferrum-rotate-y",
  name: "Rotate Y",
  category: "animations",
  description: "An animated motion effect (rotate y)",
  tags: ["rotate", "transform", "rotate-y", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rotate-y {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, oklch(0.652 0.241 354.31), oklch(0.566 0.245 278.69));
  border-radius: 8px;
  transform-style: preserve-3d;
  animation: roy-rotate-y 3s linear infinite;
}

@keyframes roy-rotate-y {

  0% { transform: perspective(800px) rotateY(0deg); }
  100% { transform: perspective(800px) rotateY(360deg); }

}`,
},

{
  id: "ferrum-roulette-spin",
  name: "Roulette Spin",
  category: "animations",
  description: "An animated motion effect (roulette spin)",
  tags: ["roulette-spin", "spin", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-roulette-spin {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background:
    repeating-conic-gradient(from 0deg,
      oklch(0.53 0.207 22.32) 0deg 15deg,
      oklch(0.218 0.0 89.88) 15deg 30deg,
      oklch(0.53 0.207 22.32) 30deg 45deg,
      oklch(0.218 0.0 89.88) 45deg 60deg,
      oklch(0.53 0.207 22.32) 60deg 75deg,
      oklch(0.218 0.0 89.88) 75deg 90deg,
      oklch(0.53 0.207 22.32) 90deg 105deg,
      oklch(0.218 0.0 89.88) 105deg 120deg,
      oklch(0.53 0.207 22.32) 120deg 135deg,
      oklch(0.218 0.0 89.88) 135deg 150deg,
      oklch(0.53 0.207 22.32) 150deg 165deg,
      oklch(0.218 0.0 89.88) 165deg 180deg,
      oklch(0.53 0.207 22.32) 180deg 195deg,
      oklch(0.218 0.0 89.88) 195deg 210deg,
      oklch(0.53 0.207 22.32) 210deg 225deg,
      oklch(0.218 0.0 89.88) 225deg 240deg,
      oklch(0.53 0.207 22.32) 240deg 255deg,
      oklch(0.218 0.0 89.88) 255deg 270deg,
      oklch(0.53 0.207 22.32) 270deg 285deg,
      oklch(0.218 0.0 89.88) 285deg 300deg,
      oklch(0.53 0.207 22.32) 300deg 315deg,
      oklch(0.218 0.0 89.88) 315deg 330deg,
      oklch(0.53 0.207 22.32) 330deg 345deg,
      oklch(0.218 0.0 89.88) 345deg 360deg);
  border: 8px solid oklch(0.541 0.104 84.45);
  box-shadow: 0 0 0 4px oklch(0.864 0.159 94.47), 0 12px 30px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
  animation: roy-b11-roulette-spin 4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
}

@keyframes roy-b11-roulette-spin {

  0%   { transform: rotate(0deg); }
  100% { transform: rotate(720deg); }

}`,
},

{
  id: "ferrum-rubber-snap-back",
  name: "Rubber Snap Back",
  category: "animations",
  description: "An animated motion effect (rubber snap back)",
  tags: ["rubber", "motion", "rubber-snap-back", "snap", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rubber-snap-back {
  animation: roy-rubber-snap 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-rubber-snap {

  0% { transform: scaleX(1); }
  25% { transform: scaleX(1.4) scaleY(0.7); }
  45% { transform: scaleX(0.85) scaleY(1.15); }
  65% { transform: scaleX(1.08) scaleY(0.95); }
  85% { transform: scaleX(0.98) scaleY(1.01); }
  100% { transform: scaleX(1) scaleY(1); }

}`,
},

{
  id: "ferrum-scale-grow",
  name: "Scale Grow",
  category: "animations",
  description: "An animated motion effect (scale grow)",
  tags: ["scale-grow", "grow", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scale-grow {
  animation: roy-scale-grow 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-scale-grow {

  0% {
    opacity: 0;
    transform: scale(0);
  }
  70% {
    opacity: 1;
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
  }

}`,
},

{
  id: "ferrum-scale-shrink",
  name: "Scale Shrink",
  category: "animations",
  description: "An animated motion effect (scale shrink)",
  tags: ["scale-shrink", "shrink", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scale-shrink {
  animation: roy-scale-shrink 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-scale-shrink {

  0% {
    opacity: 0;
    transform: scale(1.8);
  }
  70% {
    opacity: 1;
    transform: scale(0.92);
  }
  100% {
    transform: scale(1);
  }

}`,
},

{
  id: "ferrum-slide-diagonal",
  name: "Slide Diagonal",
  category: "animations",
  description: "An animated motion effect (slide diagonal)",
  tags: ["slide", "transition", "slide-diagonal", "diagonal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-diagonal {
  animation: roy-slide-diagonal 3s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
}

@keyframes roy-slide-diagonal {

  0% {
    transform: translate3d(-30px, 30px, 0) rotate(-3deg);
  }
  100% {
    transform: translate3d(30px, -30px, 0) rotate(3deg);
  }

}`,
},

{
  id: "ferrum-slide-in-bottom",
  name: "Slide In Bottom",
  category: "animations",
  description: "An animated motion effect (slide in bottom)",
  tags: ["slide", "transition", "slide-in-bottom", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-in-bottom {
  animation: roy-slide-in-bottom 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes roy-slide-in-bottom {

  from {
    transform: translate3d(0, 100%, 0);
    visibility: visible;
  }
  to {
    transform: translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-slide-in-top",
  name: "Slide In Top",
  category: "animations",
  description: "An animated motion effect (slide in top)",
  tags: ["slide", "transition", "slide-in-top", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-in-top {
  animation: roy-slide-in-top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes roy-slide-in-top {

  from {
    transform: translate3d(0, -100%, 0);
    visibility: visible;
  }
  to {
    transform: translate3d(0, 0, 0);
  }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // PARTICLES
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-particles-floating-dots",
  name: "Particles Floating Dots",
  category: "particles",
  description: "A particles floating dots effect",
  tags: ["particles-floating-dots", "floating"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-floating-dots {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67) 0%, oklch(0.27 0.04 260.03) 50%, oklch(0.21 0.034 264.67) 100%);
}`,
},

{
  id: "ferrum-particles-orbiting",
  name: "Particles Orbiting",
  category: "particles",
  description: "A particles orbiting effect",
  tags: ["particles-orbiting", "orbiting"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-orbiting {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: radial-gradient(circle at center, oklch(0.257 0.086 281.29) 0%, oklch(0.179 0.069 283.28) 60%, oklch(0.118 0.042 286.2) 100%);
}`,
},

{
  id: "ferrum-particles-rain",
  name: "Particles Rain",
  category: "particles",
  description: "A particles rain effect",
  tags: ["particles-rain", "rain"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-rain {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.261 0.031 254.76) 0%, oklch(0.32 0.04 253.23) 50%, oklch(0.233 0.026 258.32) 100%);
}`,
},

{
  id: "ferrum-particles-smoke",
  name: "Particles Smoke",
  category: "particles",
  description: "A particles smoke effect",
  tags: ["particles-smoke", "smoke"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-smoke {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.218 0.0 89.88) 0%, oklch(0.297 0.0 89.88) 50%, oklch(0.168 0.0 89.88) 100%);
}`,
},

{
  id: "ferrum-particles-snow-fall",
  name: "Particles Snow Fall",
  category: "particles",
  description: "A particles snow fall effect",
  tags: ["particles-snow-fall", "snow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-snow-fall {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.292 0.061 267.08) 0%, oklch(0.372 0.081 266.12) 50%, oklch(0.269 0.053 266.15) 100%);
}`,
},

{
  id: "ferrum-particles-sparks",
  name: "Particles Sparks",
  category: "particles",
  description: "A particles sparks effect",
  tags: ["particles-sparks", "sparks"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-sparks {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.166 0.038 61.83) 0%, oklch(0.217 0.055 52.73) 50%, oklch(0.166 0.038 61.83) 100%);
}`,
},

{
  id: "ferrum-particles-stars-twinkle",
  name: "Particles Stars Twinkle",
  category: "particles",
  description: "A particles stars twinkle effect",
  tags: ["particles-stars-twinkle", "stars"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-stars-twinkle {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: radial-gradient(ellipse at top, oklch(0.255 0.093 277.48) 0%, oklch(0.163 0.051 279.14) 60%, oklch(0.124 0.029 281.33) 100%);
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // SCROLL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-scroll-driven-blur",
  name: "Driven Blur",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-driven-blur", "driven", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-driven-blur {
  animation: roy-scroll-blur linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}

@keyframes roy-scroll-blur {

  0% { filter: blur(12px); opacity: 0; transform: scale(1.05); }
  100% { filter: blur(0); opacity: 1; transform: scale(1); }

}`,
},

{
  id: "ferrum-scroll-driven-color",
  name: "Driven Color",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-driven-color", "driven", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-driven-color {
  animation: roy-scroll-color linear both;
  animation-timeline: view();
  animation-range: entry 0% exit 100%;
}

@keyframes roy-scroll-color {

  0% { background: oklch(0.567 0.159 275.21); color: oklch(1 0 0); }
  50% { background: oklch(0.566 0.245 278.69); color: oklch(1 0 0); }
  100% { background: oklch(0.652 0.241 354.31); color: oklch(1 0 0); }

}`,
},

{
  id: "ferrum-scroll-driven-fade",
  name: "Driven Fade",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-driven-fade", "driven", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-driven-fade {
  animation: roy-scroll-fade linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 40%;
}

@keyframes roy-scroll-fade {

  0% { opacity: 0; }
  100% { opacity: 1; }

}`,
},

{
  id: "ferrum-scroll-driven-progress-ring",
  name: "Driven Progress Ring",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-driven-progress-ring", "driven", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-driven-progress-ring {
  position: relative;
  border-radius: 50%;
  background:
    conic-gradient(oklch(0.567 0.159 275.21) 0deg, oklch(0.567 0.159 275.21) 0deg, oklch(0.274 0.005 286.03) 0deg, oklch(0.274 0.005 286.03) 360deg);
  animation: roy-scroll-ring linear both;
  animation-timeline: scroll(root);
  animation-range: 0 100%;
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

}`,
},

{
  id: "ferrum-scroll-driven-rotate",
  name: "Driven Rotate",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-driven-rotate", "driven", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-driven-rotate {
  animation: roy-scroll-rotate linear both;
  animation-timeline: view();
  animation-range: entry 0% exit 100%;
}

@keyframes roy-scroll-rotate {

  0% { transform: rotate(-45deg); }
  100% { transform: rotate(45deg); }

}`,
},

{
  id: "ferrum-scroll-driven-scale",
  name: "Driven Scale",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-driven-scale", "driven", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-driven-scale {
  animation: roy-scroll-scale linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}

@keyframes roy-scroll-scale {

  0% { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }

}`,
},

{
  id: "ferrum-scroll-driven-sticky",
  name: "Driven Sticky",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-driven-sticky", "driven", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-driven-sticky {
  position: sticky;
  top: 0;
  background: oklch(0.21 0.006 285.89);
  color: oklch(0.985 0.0 89.88);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 8px;
  animation: roy-scroll-sticky linear both;
  animation-timeline: scroll(root);
  animation-range: 0 100px;
}

@keyframes roy-scroll-sticky {

  0% { box-shadow: 0 0 0 color-mix(in oklch, oklch(0 0 0) 0%, transparent); }
  100% { box-shadow: 0 8px 24px color-mix(in oklch, oklch(0 0 0) 40%, transparent); border-color: oklch(0.37 0.012 285.81); }

}`,
},

{
  id: "ferrum-scroll-driven-translate",
  name: "Driven Translate",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-driven-translate", "driven", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-driven-translate {
  animation: roy-scroll-translate linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 60%;
}

@keyframes roy-scroll-translate {

  0% { transform: translateX(-80px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }

}`,
},

{
  id: "ferrum-scroll-fade-out",
  name: "Fade Out",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-fade-out", "fade", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-fade-out {
  animation: roy-scroll-fade-out 2.6s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-fade-out {

  0%, 25% { opacity: 1; transform: translateY(0); }
  75%, 100% { opacity: 0; transform: translateY(-32px); }

}`,
},

{
  id: "ferrum-scroll-horizontal",
  name: "Horizontal",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-horizontal", "horizontal"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-horizontal {
  position: relative;
  width: 100%;
  height: 6px;
  background: color-mix(in oklch, oklch(0.711 0.035 256.79) 25%, transparent);
  border-radius: 999px;
  overflow: hidden;
}`,
},

{
  id: "ferrum-scroll-indicator",
  name: "Indicator",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-indicator", "indicator"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-indicator {
  position: relative;
  width: 28px;
  height: 46px;
  border: 2px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 65%, transparent);
  border-radius: 14px;
  background: transparent;
}`,
},

{
  id: "ferrum-scroll-parallax-slow",
  name: "Parallax Slow",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-parallax-slow", "parallax"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-parallax-slow {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
}`,
},

{
  id: "ferrum-scroll-progress-bar",
  name: "Progress Bar",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-progress-bar", "progress"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-progress-bar {
  position: relative;
  width: 100%;
  height: 8px;
  background: color-mix(in oklch, oklch(0.711 0.035 256.79) 25%, transparent);
  border-radius: 999px;
  overflow: hidden;
}`,
},

{
  id: "ferrum-scroll-reveal-left",
  name: "Reveal Left",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-reveal-left", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-reveal-left {
  animation: roy-scroll-reveal-left 2.6s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-reveal-left {

  0% { opacity: 0; transform: translateX(-60px); }
  25%, 70% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(-60px); }

}`,
},

{
  id: "ferrum-scroll-reveal-right",
  name: "Reveal Right",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-reveal-right", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-reveal-right {
  animation: roy-scroll-reveal-right 2.6s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-reveal-right {

  0% { opacity: 0; transform: translateX(60px); }
  25%, 70% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-scroll-reveal-rotate",
  name: "Reveal Rotate",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-reveal-rotate", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-reveal-rotate {
  animation: roy-scroll-reveal-rotate 2.6s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-reveal-rotate {

  0% { opacity: 0; transform: rotate(-15deg) scale(0.85); }
  25%, 70% { opacity: 1; transform: rotate(0deg) scale(1); }
  100% { opacity: 0; transform: rotate(-15deg) scale(0.85); }

}`,
},

{
  id: "ferrum-scroll-reveal-scale",
  name: "Reveal Scale",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-reveal-scale", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-reveal-scale {
  animation: roy-scroll-reveal-scale 2.6s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-reveal-scale {

  0% { opacity: 0; transform: scale(0.6); }
  25%, 70% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.6); }

}`,
},

{
  id: "ferrum-scroll-reveal-up",
  name: "Reveal Up",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-reveal-up", "reveal"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-reveal-up {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s ease, transform 0.6s ease;
  will-change: opacity, transform;
}`,
},

{
  id: "ferrum-scroll-sticky-header",
  name: "Sticky Header",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-sticky-header", "sticky", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-sticky-header {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 22px;
  background: linear-gradient(90deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  border: 1px solid color-mix(in oklch, oklch(0.711 0.035 256.79) 30%, transparent);
  border-radius: 10px;
  color: oklch(0.929 0.013 255.51);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: 0 6px 20px color-mix(in oklch, oklch(0.129 0.041 264.7) 40%, transparent);
  animation: roy-scroll-sticky-shrink 3.2s ease-in-out infinite;
}

@keyframes roy-scroll-sticky-shrink {

  0%, 35% {
    height: 64px;
    font-size: 18px;
    padding: 0 22px;
    background: linear-gradient(90deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
    box-shadow: 0 6px 20px color-mix(in oklch, oklch(0.129 0.041 264.7) 40%, transparent);
  }
  50%, 85% {
    height: 36px;
    font-size: 13px;
    padding: 0 14px;
    background: linear-gradient(90deg, oklch(0.129 0.041 264.7), oklch(0.21 0.034 264.67));
    box-shadow: 0 10px 26px color-mix(in oklch, oklch(0.129 0.041 264.7) 70%, transparent);
    letter-spacing: 0.04em;
  }
  100% {
    height: 64px;
    font-size: 18px;
    padding: 0 22px;
  }

}`,
},

{
  id: "ferrum-scroll-timeline-spin",
  name: "Timeline Spin",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-timeline-spin", "timeline", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-timeline-spin {
  width: 140px;
  height: 140px;
  border-radius: 24px;
  background:
    conic-gradient(from 0deg, oklch(0.652 0.241 354.31), oklch(0.566 0.245 278.69), oklch(0.685 0.131 226.94), oklch(0.696 0.149 162.48), oklch(0.652 0.241 354.31));
  display: grid;
  place-items: center;
  color: oklch(1 0 0);
  font: 700 12px/1.2 system-ui, sans-serif;
  letter-spacing: 0.15em;
  text-align: center;
  animation: roy-b10-sts-spin 1s linear;
  animation-timeline: scroll(root block);
  /* When scroll-timeline unsupported, fall back to infinite auto-spin */
}

@keyframes roy-b10-sts-spin {

  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-pixel-art",
  name: "Pixel Art",
  category: "visual",
  description: "A pixel art effect",
  tags: ["pixel-art", "art"],
  previewType: "box",
  cssCode: `.roycss-ferrum-pixel-art {
  width: 100%;
  min-height: 240px;
  background:
    conic-gradient(from 0deg at 50% 50%,
      oklch(0.634 0.254 17.63) 0deg 45deg,
      oklch(0.789 0.171 69.64) 45deg 90deg,
      oklch(0.93 0.189 103.28) 90deg 135deg,
      oklch(0.798 0.257 144.26) 135deg 180deg,
      oklch(0.718 0.16 242.66) 180deg 225deg,
      oklch(0.592 0.059 300.27) 225deg 270deg,
      oklch(0.742 0.172 359.48) 270deg 315deg,
      oklch(0.634 0.254 17.63) 315deg 360deg);
  background-size: 32px 32px;
  image-rendering: pixelated;
  position: relative;
  border-radius: 0;
  filter: contrast(1.1) saturate(1.3);
}`,
},

{
  id: "ferrum-prism-rainbow",
  name: "Prism Rainbow",
  category: "visual",
  description: "A prism rainbow effect",
  tags: ["prism-rainbow", "rainbow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-prism-rainbow {
  position: relative;
  width: 220px;
  height: 160px;
  background: oklch(0.15 0.021 283.53);
  overflow: hidden;
  border-radius: 8px;
}`,
},

];
