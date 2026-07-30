import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 21 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch21: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-flash",
  name: "Flash",
  category: "animations",
  description: "An animated motion effect (flash)",
  tags: ["flash", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-flash { animation: roy-ferrum-flash 1.2s ease-in-out infinite; }

@keyframes roy-ferrum-flash {

  0%, 100% { opacity: 1; }
  25%      { opacity: 0; }
  50%      { opacity: 1; }
  75%      { opacity: 0; }

}`,
},

{
  id: "ferrum-strobe",
  name: "Strobe",
  category: "animations",
  description: "An animated motion effect (strobe)",
  tags: ["strobe", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-strobe { animation: roy-ferrum-strobe 0.6s step-end infinite; }

@keyframes roy-ferrum-strobe {

  0%, 100% { opacity: 1; }
  25%      { opacity: 0; }
  50%      { opacity: 1; }
  75%      { opacity: 0; }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // BACKGROUNDS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-bg-gradient-shift",
  name: "Gradient Shift",
  category: "backgrounds",
  description: "An animated gradient background with shifting color stops",
  tags: ["background", "gradient", "bg-gradient-shift", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-gradient-shift {
  background: linear-gradient(-45deg, oklch(0.627 0.233 303.9), oklch(0.652 0.241 354.31), oklch(0.705 0.213 51.16), oklch(0.685 0.131 226.94));
  background-size: 400% 400%;
  animation: roy-ferrum-bg-gradient-shift 8s ease infinite;
}

@keyframes roy-ferrum-bg-gradient-shift {

  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }

}`,
},

{
  id: "ferrum-bg-mesh",
  name: "Mesh",
  category: "backgrounds",
  description: "A multi-point mesh gradient background with overlapping radial color blobs",
  tags: ["background", "gradient", "bg-mesh", "mesh", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-mesh {
  background:
    radial-gradient(at 40% 20%, oklch(0.627 0.233 303.9) 0px, transparent 50%),
    radial-gradient(at 80% 0%, oklch(0.652 0.241 354.31) 0px, transparent 50%),
    radial-gradient(at 0% 50%, oklch(0.685 0.131 226.94) 0px, transparent 50%),
    radial-gradient(at 80% 50%, oklch(0.705 0.213 51.16) 0px, transparent 50%),
    radial-gradient(at 0% 100%, oklch(0.696 0.149 162.48) 0px, transparent 50%),
    radial-gradient(at 80% 100%, oklch(0.637 0.237 25.77) 0px, transparent 50%);
  background-color: oklch(0.228 0.038 282.93);
  background-size: 200% 200%;
  animation: roy-ferrum-mesh-bg 10s ease infinite;
}

@keyframes roy-ferrum-mesh-bg {

  0% { background-position: 0% 0%, 100% 0%, 0% 50%, 100% 50%, 0% 100%, 100% 100%; }
  50% { background-position: 100% 0%, 0% 50%, 100% 50%, 0% 100%, 100% 100%, 0% 0%; }
  100% { background-position: 0% 0%, 100% 0%, 0% 50%, 100% 50%, 0% 100%, 100% 100%; }

}`,
},

{
  id: "ferrum-bg-dots",
  name: "Dots",
  category: "backgrounds",
  description: "A dotted background pattern",
  tags: ["background", "gradient", "bg-dots", "dots"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-dots {
  background-color: oklch(0.228 0.038 282.93);
  background-image: radial-gradient(oklch(0.627 0.233 303.9) 1.5px, transparent 1.5px);
  background-size: 20px 20px;
}`,
},

{
  id: "ferrum-bg-striped",
  name: "Striped",
  category: "backgrounds",
  description: "A diagonally-striped background with motion",
  tags: ["background", "gradient", "bg-striped", "striped", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-striped {
  background: repeating-linear-gradient(
    -45deg,
    oklch(0.228 0.038 282.93),
    oklch(0.228 0.038 282.93) 10px,
    oklch(0.27 0.091 293.53) 10px,
    oklch(0.27 0.091 293.53) 20px
  );
  background-size: 28.28px 28.28px;
  animation: roy-ferrum-bg-stripes-move 1s linear infinite;
}

@keyframes roy-ferrum-bg-stripes-move {

  0% { background-position: 0 0; }
  100% { background-position: 28.28px 0; }

}`,
},

{
  id: "ferrum-bg-checkerboard",
  name: "Checkerboard",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-checkerboard", "checkerboard"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-checkerboard {
  background-color: oklch(0.228 0.038 282.93);
  background-image:
    linear-gradient(45deg, oklch(0.27 0.091 293.53) 25%, transparent 25%, transparent 75%, oklch(0.27 0.091 293.53) 75%),
    linear-gradient(45deg, oklch(0.27 0.091 293.53) 25%, transparent 25%, transparent 75%, oklch(0.27 0.091 293.53) 75%);
  background-size: 40px 40px;
  background-position: 0 0, 20px 20px;
}`,
},

{
  id: "ferrum-bg-radial-pulse",
  name: "Radial Pulse",
  category: "backgrounds",
  description: "A radial-pulse background with concentric emanation",
  tags: ["background", "gradient", "bg-radial-pulse", "radial", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-radial-pulse {
  background: radial-gradient(circle at center, oklch(0.627 0.233 303.9) 0%, oklch(0.327 0.096 283.81) 50%, oklch(0.179 0.057 283.68) 100%);
  background-size: 100% 100%;
  animation: roy-ferrum-bg-radial-pulse 3s ease-in-out infinite;
}

@keyframes roy-ferrum-bg-radial-pulse {

  0%, 100% { background-size: 100% 100%; }
  50% { background-size: 150% 150%; }

}`,
},

{
  id: "ferrum-bg-noise-texture",
  name: "Noise Texture",
  category: "backgrounds",
  description: "A noise-textured background with grainy detail",
  tags: ["background", "gradient", "bg-noise-texture", "noise"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-noise-texture {
  background-color: oklch(0.228 0.038 282.93);
  position: relative;
}
.roycss-ferrum-bg-noise-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
  pointer-events: none;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // HOVER
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-hover-glow",
  name: "Glow",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-glow", "glow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-glow {
  transition: box-shadow 0.3s ease;
}
.roycss-ferrum-hover-glow:hover {
  box-shadow: 0 0 15px color-mix(in oklch, oklch(0.876 0.228 152.55) 60%, transparent), 0 0 30px color-mix(in oklch, oklch(0.876 0.228 152.55) 30%, transparent), 0 0 45px color-mix(in oklch, oklch(0.876 0.228 152.55) 15%, transparent);
}`,
},

{
  id: "ferrum-hover-scale-up",
  name: "Scale Up",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-scale-up", "scale"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-scale-up {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-ferrum-hover-scale-up:hover {
  transform: scale(1.1);
}`,
},

{
  id: "ferrum-hover-scale-down",
  name: "Scale Down",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-scale-down", "scale"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-scale-down {
  transition: transform 0.3s ease;
}
.roycss-ferrum-hover-scale-down:hover {
  transform: scale(0.9);
}`,
},

{
  id: "ferrum-hover-rotate",
  name: "Rotate",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-rotate", "rotate"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-rotate {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-ferrum-hover-rotate:hover {
  transform: rotate(10deg);
}`,
},

{
  id: "ferrum-hover-skew",
  name: "Skew",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-skew", "skew"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-skew {
  transition: transform 0.3s ease;
}
.roycss-ferrum-hover-skew:hover {
  transform: skewX(-5deg);
}`,
},

{
  id: "ferrum-hover-border-glow",
  name: "Border Glow",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-border-glow", "border"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-border-glow {
  border: 2px solid transparent;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.roycss-ferrum-hover-border-glow:hover {
  border-color: oklch(0.905 0.155 194.77);
  box-shadow: 0 0 12px color-mix(in oklch, oklch(0.905 0.155 194.77) 50%, transparent), inset 0 0 12px color-mix(in oklch, oklch(0.905 0.155 194.77) 10%, transparent);
}`,
},

{
  id: "ferrum-hover-shadow-lift",
  name: "Shadow Lift",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-shadow-lift", "shadow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-shadow-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.roycss-ferrum-hover-shadow-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}`,
},

{
  id: "ferrum-hover-float",
  name: "Float",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-float", "float"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-float {
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}
.roycss-ferrum-hover-float:hover {
  transform: translateY(-8px);
  box-shadow: 0 14px 28px color-mix(in oklch, oklch(0 0 0) 12%, transparent);
}`,
},

{
  id: "ferrum-hover-tilt",
  name: "Tilt",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-tilt", "tilt", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-tilt {
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
}
.roycss-ferrum-hover-tilt:hover {
  transform: perspective(600px) rotateX(5deg) rotateY(-5deg);
}`,
},

{
  id: "ferrum-hover-ripple",
  name: "Ripple",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-ripple", "ripple"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-ripple {
  position: relative;
  overflow: hidden;
}
.roycss-ferrum-hover-ripple::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: color-mix(in oklch, oklch(1 0 0) 25%, transparent);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease, opacity 0.6s ease;
  z-index: 1;
}
.roycss-ferrum-hover-ripple:hover::before {
  width: 300%;
  height: 300%;
  opacity: 0;
}`,
},

{
  id: "ferrum-hover-underline-grow",
  name: "Underline Grow",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-underline-grow", "underline"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-underline-grow {
  position: relative;
}
.roycss-ferrum-hover-underline-grow::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, oklch(0.627 0.164 271.53), oklch(0.501 0.138 304.73));
  transition: width 0.35s ease, left 0.35s ease;
}
.roycss-ferrum-hover-underline-grow:hover::after {
  width: 100%;
  left: 0;
}`,
},

{
  id: "ferrum-hover-overlay-slide",
  name: "Overlay Slide",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-overlay-slide", "overlay"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-overlay-slide {
  position: relative;
  overflow: hidden;
}
.roycss-ferrum-hover-overlay-slide::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: color-mix(in oklch, oklch(0 0 0) 45%, transparent);
  transition: left 0.4s ease;
  z-index: 1;
}
.roycss-ferrum-hover-overlay-slide:hover::before {
  left: 0;
}`,
},

{
  id: "ferrum-hover-bg-slide",
  name: "Bg Slide",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-bg-slide", "bg"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-bg-slide {
  position: relative;
  overflow: hidden;
  z-index: 1;
}
.roycss-ferrum-hover-bg-slide::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0;
  background: linear-gradient(to top, oklch(0.627 0.164 271.53), oklch(0.501 0.138 304.73));
  transition: height 0.4s ease;
  z-index: -1;
}
.roycss-ferrum-hover-bg-slide:hover::before {
  height: 100%;
}`,
},

{
  id: "ferrum-hover-shrink-border",
  name: "Shrink Border",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-shrink-border", "shrink"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-shrink-border {
  box-shadow: 0 0 0 3px oklch(0.627 0.164 271.53);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.roycss-ferrum-hover-shrink-border:hover {
  box-shadow: 0 0 0 1px oklch(0.627 0.164 271.53);
  transform: scale(1.02);
}`,
},

{
  id: "ferrum-hover-expand",
  name: "Expand",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-expand", "expand"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-expand {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.roycss-ferrum-hover-expand:hover {
  transform: scale(1.05);
  box-shadow: 0 0 0 5px color-mix(in oklch, oklch(0.627 0.164 271.53) 25%, transparent);
}`,
},

{
  id: "ferrum-hover-neon-pulse",
  name: "Neon Pulse",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-neon-pulse", "neon"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-neon-pulse {
  border: 2px solid transparent;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, text-shadow 0.3s ease;
}
.roycss-ferrum-hover-neon-pulse:hover {
  border-color: oklch(0.866 0.295 142.5);
  box-shadow: 0 0 8px oklch(0.866 0.295 142.5), 0 0 20px oklch(0.866 0.295 142.5), 0 0 40px oklch(0.866 0.295 142.5), 0 0 80px color-mix(in oklch, oklch(0.866 0.295 142.5) 40%, transparent);
  text-shadow: 0 0 8px oklch(0.866 0.295 142.5), 0 0 20px oklch(0.866 0.295 142.5);
}`,
},

{
  id: "ferrum-hover-fill",
  name: "Fill",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-fill", "fill"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-fill {
  position: relative;
  overflow: hidden;
  z-index: 1;
  transition: color 0.35s ease;
}
.roycss-ferrum-hover-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: oklch(0.627 0.164 271.53);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1);
  z-index: -1;
}
.roycss-ferrum-hover-fill:hover::before {
  transform: scaleX(1);
}
.roycss-ferrum-hover-fill:hover {
  color: oklch(1 0 0);
}`,
},

{
  id: "ferrum-hover-swipe",
  name: "Swipe",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-swipe", "swipe"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-swipe {
  position: relative;
  overflow: hidden;
  z-index: 1;
  transition: color 0.35s ease;
}
.roycss-ferrum-hover-swipe::before {
  content: '';
  position: absolute;
  top: 0;
  left: -110%;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, oklch(0.795 0.172 323.15), oklch(0.673 0.193 16.23));
  transform: skewX(-15deg);
  transition: left 0.5s cubic-bezier(0.65, 0, 0.35, 1);
  z-index: -1;
}
.roycss-ferrum-hover-swipe:hover::before {
  left: 0;
}
.roycss-ferrum-hover-swipe:hover {
  color: oklch(1 0 0);
}`,
},

{
  id: "ferrum-hover-shadow",
  name: "Shadow",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-shadow", "shadow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-shadow {
  transition: box-shadow 0.4s ease;
}
.roycss-ferrum-hover-shadow:hover {
  box-shadow:
    0 1px 2px color-mix(in oklch, oklch(0 0 0) 7%, transparent),
    0 2px 4px color-mix(in oklch, oklch(0 0 0) 7%, transparent),
    0 4px 8px color-mix(in oklch, oklch(0 0 0) 7%, transparent),
    0 8px 16px color-mix(in oklch, oklch(0 0 0) 7%, transparent),
    0 16px 32px color-mix(in oklch, oklch(0 0 0) 7%, transparent),
    0 32px 64px color-mix(in oklch, oklch(0 0 0) 7%, transparent);
}`,
},

{
  id: "ferrum-hover-blur",
  name: "Blur",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-blur", "blur"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-blur {
  transition: filter 0.3s ease;
}
.roycss-ferrum-hover-blur:hover {
  filter: blur(2px) brightness(1.2) contrast(1.1);
}`,
},

{
  id: "ferrum-hover-skew-reverse",
  name: "Skew Reverse",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-skew-reverse", "skew"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-skew-reverse {
  transform: skewX(10deg);
  transition: transform 0.35s ease;
}
.roycss-ferrum-hover-skew-reverse:hover {
  transform: skewX(-10deg);
}`,
},

{
  id: "ferrum-hover-flip",
  name: "Flip",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-flip", "flip", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-flip {
  perspective: 800px;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  transition: transform 0.6s ease;
}
.roycss-ferrum-hover-flip:hover {
  transform: rotateY(180deg);
  background: linear-gradient(135deg, oklch(0.627 0.164 271.53), oklch(0.501 0.138 304.73));
  color: oklch(1 0 0);
}`,
},

{
  id: "ferrum-hover-slide-right",
  name: "Slide Right",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-slide-right", "slide"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-slide-right {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.roycss-ferrum-hover-slide-right:hover {
  transform: translateX(8px);
  box-shadow: -4px 2px 12px color-mix(in oklch, oklch(0 0 0) 18%, transparent);
}`,
},

{
  id: "ferrum-hover-slide-up",
  name: "Slide Up",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-slide-up", "slide"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-slide-up {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.roycss-ferrum-hover-slide-up:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 14px color-mix(in oklch, oklch(0 0 0) 18%, transparent);
}`,
},

{
  id: "ferrum-hover-morph",
  name: "Morph",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-morph", "morph", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-morph {
  border-radius: 8px;
  transition: border-radius 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.5s ease;
}
.roycss-ferrum-hover-morph:hover {
  border-radius: 50%;
  transform: scale(0.95);
}

.roycss-ferrum-hover-shake:hover {
  animation: roy-ferrum-hover-shake-anim 0.5s ease;
}

@keyframes roy-ferrum-hover-shake-anim {

  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }

}`,
},

{
  id: "ferrum-hover-glow-text",
  name: "Glow Text",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-glow-text", "glow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-glow-text {
  transition: text-shadow 0.3s ease, color 0.3s ease;
}
.roycss-ferrum-hover-glow-text:hover {
  text-shadow: 0 0 8px oklch(0.905 0.155 194.77), 0 0 16px oklch(0.905 0.155 194.77), 0 0 32px oklch(0.905 0.155 194.77), 0 0 64px color-mix(in oklch, oklch(0.905 0.155 194.77) 40%, transparent);
  color: oklch(1 0 0);
}`,
},

{
  id: "ferrum-hover-3d-lift",
  name: "3D Lift",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-3d-lift", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-3d-lift {
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  transform-style: preserve-3d;
}
.roycss-ferrum-hover-3d-lift:hover {
  transform: perspective(800px) rotateX(3deg) translateY(-8px);
  box-shadow:
    0 20px 40px color-mix(in oklch, oklch(0 0 0) 20%, transparent),
    0 0 12px color-mix(in oklch, oklch(0.627 0.164 271.53) 15%, transparent);
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // TEXT
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-text-gradient",
  name: "Gradient",
  category: "text",
  description: "A text effect that styles and animates letterforms (gradient)",
  tags: ["text", "typography", "text-gradient", "gradient"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-gradient {
  background: linear-gradient(135deg, oklch(0.627 0.164 271.53), oklch(0.501 0.138 304.73), oklch(0.795 0.172 323.15));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}`,
},

{
  id: "ferrum-text-shadow-pop",
  name: "Shadow Pop",
  category: "text",
  description: "A text effect that styles and animates letterforms (shadow pop)",
  tags: ["text", "typography", "text-shadow-pop", "shadow", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-shadow-pop {
  animation: roy-ferrum-text-shadow-pop-anim 0.5s ease both;
}

@keyframes roy-ferrum-text-shadow-pop-anim {

  0% {
    text-shadow: 0 0 0 color-mix(in oklch, oklch(0 0 0) 30%, transparent);
    transform: scale(1);
  }
  50% {
    text-shadow: 4px 4px 0 color-mix(in oklch, oklch(0.627 0.164 271.53) 40%, transparent);
    transform: scale(1.06);
  }
  100% {
    text-shadow: 3px 3px 0 color-mix(in oklch, oklch(0 0 0) 20%, transparent);
    transform: scale(1);
  }

}`,
},

{
  id: "ferrum-text-stroke",
  name: "Stroke",
  category: "text",
  description: "A text effect that styles and animates letterforms (stroke)",
  tags: ["text", "typography", "text-stroke", "stroke"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-stroke {
  -webkit-text-stroke: 2px oklch(0.627 0.164 271.53);
  -webkit-text-fill-color: transparent;
}`,
},

{
  id: "ferrum-text-glow",
  name: "Glow",
  category: "text",
  description: "A text effect that styles and animates letterforms (glow)",
  tags: ["text", "typography", "text-glow", "glow", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-glow {
  animation: roy-ferrum-text-glow-anim 2s ease-in-out infinite alternate;
}

@keyframes roy-ferrum-text-glow-anim {

  0% { text-shadow: 0 0 5px oklch(0.627 0.164 271.53), 0 0 10px oklch(0.627 0.164 271.53); }
  100% { text-shadow: 0 0 10px oklch(0.627 0.164 271.53), 0 0 20px oklch(0.627 0.164 271.53), 0 0 40px oklch(0.501 0.138 304.73); }

}`,
},

{
  id: "ferrum-text-typewriter",
  name: "Typewriter",
  category: "text",
  description: "A text effect that styles and animates letterforms (typewriter)",
  tags: ["text", "typography", "text-typewriter", "typewriter", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-typewriter {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid oklch(0.627 0.164 271.53);
  width: 0;
  animation:
    roy-ferrum-text-typewriter-type 3s steps(24) forwards,
    roy-ferrum-text-typewriter-cursor 0.75s step-end infinite;
}

.roycss-ferrum-text-wave span {
  display: inline-block;
  animation: roy-ferrum-text-wave-anim 1.4s ease-in-out infinite;
}
.roycss-ferrum-text-wave span:nth-child(2)  { animation-delay: 0.1s; }
.roycss-ferrum-text-wave span:nth-child(3)  { animation-delay: 0.2s; }
.roycss-ferrum-text-wave span:nth-child(4)  { animation-delay: 0.3s; }
.roycss-ferrum-text-wave span:nth-child(5)  { animation-delay: 0.4s; }
.roycss-ferrum-text-wave span:nth-child(6)  { animation-delay: 0.5s; }
.roycss-ferrum-text-wave span:nth-child(7)  { animation-delay: 0.6s; }
.roycss-ferrum-text-wave span:nth-child(8)  { animation-delay: 0.7s; }
.roycss-ferrum-text-wave span:nth-child(9)  { animation-delay: 0.8s; }
.roycss-ferrum-text-wave span:nth-child(10) { animation-delay: 0.9s; }
.roycss-ferrum-text-wave span:nth-child(11) { animation-delay: 1.0s; }
.roycss-ferrum-text-wave span:nth-child(12) { animation-delay: 1.1s; }

@keyframes roy-ferrum-text-wave-anim {

  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }

}`,
},

{
  id: "ferrum-text-blur-in",
  name: "Blur In",
  category: "text",
  description: "A text effect that styles and animates letterforms (blur in)",
  tags: ["text", "typography", "text-blur-in", "blur", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-blur-in {
  animation: roy-ferrum-text-blur-in-anim 1.2s ease forwards;
}

@keyframes roy-ferrum-text-blur-in-anim {

  0% { filter: blur(12px); opacity: 0; }
  100% { filter: blur(0); opacity: 1; }

}`,
},

{
  id: "ferrum-text-highlight",
  name: "Highlight",
  category: "text",
  description: "A text effect that styles and animates letterforms (highlight)",
  tags: ["text", "typography", "text-highlight", "highlight", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-highlight {
  background: linear-gradient(to right, color-mix(in oklch, oklch(0.627 0.164 271.53) 30%, transparent) 50%, transparent 50%);
  background-size: 200% 100%;
  background-position: 100% 0;
  display: inline;
  animation: roy-ferrum-text-highlight-anim 1.5s ease forwards;
}

@keyframes roy-ferrum-text-highlight-anim {

  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }

}`,
},

{
  id: "ferrum-text-underline-slide",
  name: "Underline Slide",
  category: "text",
  description: "A text effect that styles and animates letterforms (underline slide)",
  tags: ["text", "typography", "text-underline-slide", "underline", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-underline-slide {
  position: relative;
  display: inline-block;
}
.roycss-ferrum-text-underline-slide::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: oklch(0.627 0.164 271.53);
  transform: scaleX(0);
  transform-origin: right;
  animation: roy-ferrum-text-underline-slide-anim 0.8s ease forwards 0.3s;
}

@keyframes roy-ferrum-text-underline-slide-anim {

  0% { transform: scaleX(0); transform-origin: right; }
  100% { transform: scaleX(1); transform-origin: left; }

}`,
},

{
  id: "ferrum-text-blink",
  name: "Blink",
  category: "text",
  description: "A text effect that styles and animates letterforms (blink)",
  tags: ["text", "typography", "text-blink", "blink", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-blink {
  animation: roy-ferrum-text-blink-anim 1s step-end infinite;
}

.roycss-ferrum-text-scramble span {
  display: inline-block;
  opacity: 0;
  animation: roy-ferrum-text-scramble-anim 0.35s ease forwards;
}
.roycss-ferrum-text-scramble span:nth-child(1)  { animation-delay: 0.04s; }
.roycss-ferrum-text-scramble span:nth-child(2)  { animation-delay: 0.08s; }
.roycss-ferrum-text-scramble span:nth-child(3)  { animation-delay: 0.12s; }
.roycss-ferrum-text-scramble span:nth-child(4)  { animation-delay: 0.16s; }
.roycss-ferrum-text-scramble span:nth-child(5)  { animation-delay: 0.20s; }
.roycss-ferrum-text-scramble span:nth-child(6)  { animation-delay: 0.24s; }
.roycss-ferrum-text-scramble span:nth-child(7)  { animation-delay: 0.28s; }
.roycss-ferrum-text-scramble span:nth-child(8)  { animation-delay: 0.32s; }
.roycss-ferrum-text-scramble span:nth-child(9)  { animation-delay: 0.36s; }
.roycss-ferrum-text-scramble span:nth-child(10) { animation-delay: 0.40s; }
.roycss-ferrum-text-scramble span:nth-child(11) { animation-delay: 0.44s; }
.roycss-ferrum-text-scramble span:nth-child(12) { animation-delay: 0.48s; }
.roycss-ferrum-text-scramble span:nth-child(13) { animation-delay: 0.52s; }
.roycss-ferrum-text-scramble span:nth-child(14) { animation-delay: 0.56s; }
.roycss-ferrum-text-scramble span:nth-child(15) { animation-delay: 0.60s; }
.roycss-ferrum-text-scramble span:nth-child(16) { animation-delay: 0.64s; }

@keyframes roy-ferrum-text-blink-anim {

  0%, 100% { opacity: 1; }
  50% { opacity: 0; }

}

@keyframes roy-ferrum-text-scramble-anim {

  0%   { opacity: 0; transform: translateY(-8px); }
  25%  { opacity: 0.6; transform: translateY(2px); }
  50%  { opacity: 0.2; transform: translateY(-4px); }
  75%  { opacity: 0.8; transform: translateY(1px); }
  100% { opacity: 1; transform: translateY(0); }

}`,
},

{
  id: "ferrum-text-3d",
  name: "3D",
  category: "text",
  description: "A text effect that styles and animates letterforms (3d)",
  tags: ["text", "typography", "text-3d", "3d"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-3d {
  color: oklch(0.387 0.0 89.88);
  text-shadow:
    1px 1px 0 oklch(0.907 0.0 89.88),
    2px 2px 0 oklch(0.858 0.0 89.88),
    3px 3px 0 oklch(0.808 0.0 89.88),
    4px 4px 0 oklch(0.757 0.0 89.88),
    5px 5px 0 oklch(0.706 0.0 89.88),
    6px 6px 0 oklch(0.653 0.0 89.88),
    7px 7px 5px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}`,
},

{
  id: "ferrum-text-neon-flicker",
  name: "Neon Flicker",
  category: "text",
  description: "A text effect that styles and animates letterforms (neon flicker)",
  tags: ["text", "typography", "text-neon-flicker", "neon", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-neon-flicker {
  color: oklch(1 0 0);
  animation: roy-ferrum-text-neon-flicker-anim 4s infinite alternate;
}

@keyframes roy-ferrum-text-neon-flicker-anim {

  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    text-shadow:
      0 0 4px oklch(0.968 0.211 109.77),
      0 0 11px oklch(0.968 0.211 109.77),
      0 0 19px oklch(0.968 0.211 109.77),
      0 0 40px oklch(0.683 0.303 335.86),
      0 0 80px oklch(0.683 0.303 335.86);
  }
  20%, 24%, 55% {
    text-shadow: none;
  }

}`,
},

{
  id: "ferrum-text-rainbow",
  name: "Rainbow",
  category: "text",
  description: "A text effect that styles and animates letterforms (rainbow)",
  tags: ["text", "typography", "text-rainbow", "rainbow", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-rainbow {
  background: linear-gradient(
    90deg,
    oklch(0.628 0.258 29.23), oklch(0.744 0.181 56.46), oklch(0.968 0.211 109.77),
    oklch(0.866 0.295 142.5), oklch(0.632 0.202 254.09), oklch(0.539 0.294 296.54),
    oklch(0.648 0.263 359.98), oklch(0.628 0.258 29.23)
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: roy-ferrum-text-rainbow-anim 3s linear infinite;
}

.roycss-ferrum-text-slide-up span {
  display: inline-block;
  opacity: 0;
  transform: translateY(100%);
  animation: roy-ferrum-text-slide-up-anim 0.5s ease forwards;
}
.roycss-ferrum-text-slide-up span:nth-child(1)  { animation-delay: 0.05s; }
.roycss-ferrum-text-slide-up span:nth-child(2)  { animation-delay: 0.10s; }
.roycss-ferrum-text-slide-up span:nth-child(3)  { animation-delay: 0.15s; }
.roycss-ferrum-text-slide-up span:nth-child(4)  { animation-delay: 0.20s; }
.roycss-ferrum-text-slide-up span:nth-child(5)  { animation-delay: 0.25s; }
.roycss-ferrum-text-slide-up span:nth-child(6)  { animation-delay: 0.30s; }
.roycss-ferrum-text-slide-up span:nth-child(7)  { animation-delay: 0.35s; }
.roycss-ferrum-text-slide-up span:nth-child(8)  { animation-delay: 0.40s; }
.roycss-ferrum-text-slide-up span:nth-child(9)  { animation-delay: 0.45s; }
.roycss-ferrum-text-slide-up span:nth-child(10) { animation-delay: 0.50s; }
.roycss-ferrum-text-slide-up span:nth-child(11) { animation-delay: 0.55s; }
.roycss-ferrum-text-slide-up span:nth-child(12) { animation-delay: 0.60s; }

@keyframes roy-ferrum-text-rainbow-anim {

  0%   { background-position: 0% center; }
  100% { background-position: 200% center; }

}

@keyframes roy-ferrum-text-slide-up-anim {

  0% {
    opacity: 0;
    transform: translateY(100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }

}`,
},

{
  id: "ferrum-text-glitch",
  name: "Glitch",
  category: "text",
  description: "A text effect that styles and animates letterforms (glitch)",
  tags: ["text", "typography", "text-glitch", "glitch", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-glitch {
  position: relative;
  display: inline-block;
}
.roycss-ferrum-text-glitch::before,
.roycss-ferrum-text-glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.roycss-ferrum-text-glitch::before {
  color: oklch(0.968 0.211 109.77);
  animation: roy-ferrum-text-glitch-1 2s infinite linear alternate-reverse;
}
.roycss-ferrum-text-glitch::after {
  color: oklch(0.905 0.155 194.77);
  animation: roy-ferrum-text-glitch-2 2s infinite linear alternate-reverse;
}

@keyframes roy-ferrum-text-glitch-1 {

  0%   { clip-path: inset(20% 0 60% 0); transform: translate(-3px, 0); }
  20%  { clip-path: inset(60% 0 10% 0); transform: translate(3px, 0); }
  40%  { clip-path: inset(40% 0 30% 0); transform: translate(-2px, 0); }
  60%  { clip-path: inset(70% 0 5% 0);  transform: translate(2px, 0); }
  80%  { clip-path: inset(10% 0 70% 0); transform: translate(-3px, 0); }
  100% { clip-path: inset(50% 0 20% 0); transform: translate(3px, 0); }

}

@keyframes roy-ferrum-text-glitch-2 {

  0%   { clip-path: inset(70% 0 10% 0); transform: translate(3px, 0); }
  20%  { clip-path: inset(10% 0 70% 0); transform: translate(-3px, 0); }
  40%  { clip-path: inset(50% 0 20% 0); transform: translate(2px, 0); }
  60%  { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 0); }
  80%  { clip-path: inset(60% 0 10% 0); transform: translate(3px, 0); }
  100% { clip-path: inset(30% 0 40% 0); transform: translate(-3px, 0); }

}`,
},

{
  id: "ferrum-text-reveal",
  name: "Reveal",
  category: "text",
  description: "A text effect that styles and animates letterforms (reveal)",
  tags: ["text", "typography", "text-reveal", "reveal", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-reveal {
  overflow: hidden;
  display: inline-block;
}
.roycss-ferrum-text-reveal span {
  display: inline-block;
  transform: translateY(110%);
  animation: roy-ferrum-text-reveal-anim 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.roycss-ferrum-text-reveal span:nth-child(1)  { animation-delay: 0.05s; }
.roycss-ferrum-text-reveal span:nth-child(2)  { animation-delay: 0.10s; }
.roycss-ferrum-text-reveal span:nth-child(3)  { animation-delay: 0.15s; }
.roycss-ferrum-text-reveal span:nth-child(4)  { animation-delay: 0.20s; }
.roycss-ferrum-text-reveal span:nth-child(5)  { animation-delay: 0.25s; }
.roycss-ferrum-text-reveal span:nth-child(6)  { animation-delay: 0.30s; }
.roycss-ferrum-text-reveal span:nth-child(7)  { animation-delay: 0.35s; }
.roycss-ferrum-text-reveal span:nth-child(8)  { animation-delay: 0.40s; }
.roycss-ferrum-text-reveal span:nth-child(9)  { animation-delay: 0.45s; }
.roycss-ferrum-text-reveal span:nth-child(10) { animation-delay: 0.50s; }

.roycss-ferrum-text-bounce span {
  display: inline-block;
  animation: roy-ferrum-text-bounce-anim 0.6s ease;
  animation-fill-mode: both;
}
.roycss-ferrum-text-bounce span:nth-child(1)  { animation-delay: 0.00s; }
.roycss-ferrum-text-bounce span:nth-child(2)  { animation-delay: 0.06s; }
.roycss-ferrum-text-bounce span:nth-child(3)  { animation-delay: 0.12s; }
.roycss-ferrum-text-bounce span:nth-child(4)  { animation-delay: 0.18s; }
.roycss-ferrum-text-bounce span:nth-child(5)  { animation-delay: 0.24s; }
.roycss-ferrum-text-bounce span:nth-child(6)  { animation-delay: 0.30s; }
.roycss-ferrum-text-bounce span:nth-child(7)  { animation-delay: 0.36s; }
.roycss-ferrum-text-bounce span:nth-child(8)  { animation-delay: 0.42s; }
.roycss-ferrum-text-bounce span:nth-child(9)  { animation-delay: 0.48s; }
.roycss-ferrum-text-bounce span:nth-child(10) { animation-delay: 0.54s; }
.roycss-ferrum-text-bounce span:nth-child(11) { animation-delay: 0.60s; }
.roycss-ferrum-text-bounce span:nth-child(12) { animation-delay: 0.66s; }

@keyframes roy-ferrum-text-bounce-anim {

  0%   { transform: translateY(0); }
  25%  { transform: translateY(-16px); }
  50%  { transform: translateY(0); }
  70%  { transform: translateY(-6px); }
  100% { transform: translateY(0); }

}

@keyframes roy-ferrum-text-reveal-anim {

  0% {
    transform: translateY(110%);
  }
  100% {
    transform: translateY(0);
  }

}`,
},

];
