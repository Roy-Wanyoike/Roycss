import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 26 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch26: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-blink",
  name: "Blink",
  category: "animations",
  description: "An animated motion effect (blink)",
  tags: ["blink", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-blink {
  animation: roy-blink 1.4s steps(2, start) infinite;
}

@keyframes roy-blink {

  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.15; }

}`,
},

{
  id: "ferrum-blur-in-up",
  name: "Blur In Up",
  category: "animations",
  description: "An animated motion effect (blur in up)",
  tags: ["blur", "filter", "blur-in-up", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-blur-in-up {
  animation: roy-blur-in-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-blur-in-up {

  from {
    opacity: 0;
    filter: blur(18px);
    transform: translate3d(0, 40px, 0);
  }
  to {
    opacity: 1;
    filter: blur(0px);
    transform: translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-blur-out-down",
  name: "Blur Out Down",
  category: "animations",
  description: "An animated motion effect (blur out down)",
  tags: ["blur", "filter", "blur-out-down", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-blur-out-down {
  animation: roy-blur-out-down 0.85s cubic-bezier(0.55, 0, 0.68, 0.53) both;
}

@keyframes roy-blur-out-down {

  from {
    opacity: 1;
    filter: blur(0px);
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    filter: blur(18px);
    transform: translate3d(0, 40px, 0);
  }

}`,
},

{
  id: "ferrum-book-open",
  name: "Book Open",
  category: "animations",
  description: "A 3D transform effect with perspective depth",
  tags: ["book-open", "open", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-book-open {
  perspective: 1000px;
  width: 80px;
  height: 60px;
  position: relative;
  transform-style: preserve-3d;
  background: transparent;
}`,
},

{
  id: "ferrum-bounce-in-down",
  name: "Bounce In Down",
  category: "animations",
  description: "An animated motion effect (bounce in down)",
  tags: ["bounce", "motion", "bounce-in-down", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-bounce-in-down {
  animation: roy-bounce-in-down 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

@keyframes roy-bounce-in-down {

  0% {
    opacity: 0;
    transform: translate3d(0, -3000px, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(0, 24px, 0);
  }
  75% {
    transform: translate3d(0, -12px, 0);
  }
  90% {
    transform: translate3d(0, 6px, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-bounce-in-left",
  name: "Bounce In Left",
  category: "animations",
  description: "An animated motion effect (bounce in left)",
  tags: ["bounce", "motion", "bounce-in-left", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-bounce-in-left {
  animation: roy-bounce-in-left 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

@keyframes roy-bounce-in-left {

  0% {
    opacity: 0;
    transform: translate3d(-3000px, 0, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(25px, 0, 0);
  }
  75% {
    transform: translate3d(-12px, 0, 0);
  }
  90% {
    transform: translate3d(6px, 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-bounce-in-right",
  name: "Bounce In Right",
  category: "animations",
  description: "An animated motion effect (bounce in right)",
  tags: ["bounce", "motion", "bounce-in-right", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-bounce-in-right {
  animation: roy-bounce-in-right 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

@keyframes roy-bounce-in-right {

  0% {
    opacity: 0;
    transform: translate3d(3000px, 0, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(-25px, 0, 0);
  }
  75% {
    transform: translate3d(12px, 0, 0);
  }
  90% {
    transform: translate3d(-6px, 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-bounce-in-up",
  name: "Bounce In Up",
  category: "animations",
  description: "An animated motion effect (bounce in up)",
  tags: ["bounce", "motion", "bounce-in-up", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-bounce-in-up {
  animation: roy-bounce-in-up 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

@keyframes roy-bounce-in-up {

  0% {
    opacity: 0;
    transform: translate3d(0, 3000px, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(0, -24px, 0);
  }
  75% {
    transform: translate3d(0, 12px, 0);
  }
  90% {
    transform: translate3d(0, -6px, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-bounce-out",
  name: "Bounce Out",
  category: "animations",
  description: "An animated motion effect (bounce out)",
  tags: ["bounce", "motion", "bounce-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-bounce-out {
  animation: roy-bounce-out 1s ease-in both;
}

@keyframes roy-bounce-out {

  0% { transform: scale(1); opacity: 1; }
  20% { transform: scale(0.9); }
  40%, 55% { transform: scale(1.1); opacity: 1; }
  80%, 100% { transform: scale(0.3); opacity: 0; }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // BACKGROUNDS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-bg-animated-gradient",
  name: "Animated Gradient",
  category: "backgrounds",
  description: "An animated gradient background with shifting color stops",
  tags: ["background", "gradient", "bg-animated-gradient", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-animated-gradient {
  background: linear-gradient(-45deg, oklch(0.432 0.086 166.91), oklch(0.696 0.149 162.48), oklch(0.685 0.131 226.94), oklch(0.566 0.245 278.69));
  background-size: 400% 400%;
  animation: roy-gradient-shift 8s ease infinite;
}

@keyframes roy-gradient-shift {

  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }

}`,
},

{
  id: "ferrum-bg-concentric",
  name: "Concentric",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-concentric", "concentric"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-concentric {
  background: repeating-radial-gradient(
    circle at center,
    oklch(0.696 0.149 162.48) 0,
    oklch(0.696 0.149 162.48) 8px,
    oklch(0.21 0.034 264.67) 8px,
    oklch(0.21 0.034 264.67) 16px
  );
}`,
},

{
  id: "ferrum-bg-conic-gradient",
  name: "Conic Gradient",
  category: "backgrounds",
  description: "An animated gradient background with shifting color stops",
  tags: ["background", "gradient", "bg-conic-gradient", "conic", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-conic-gradient {
  background: conic-gradient(
    from 0deg at 50% 50%,
    oklch(0.696 0.149 162.48),
    oklch(0.685 0.131 226.94),
    oklch(0.566 0.245 278.69),
    oklch(0.652 0.241 354.31),
    oklch(0.769 0.188 70.08),
    oklch(0.696 0.149 162.48)
  );
  animation: roy-conic-hue 6s linear infinite;
}

@keyframes roy-conic-hue {

  to { filter: hue-rotate(360deg); }

}`,
},

{
  id: "ferrum-bg-diagonal-stripes",
  name: "Diagonal Stripes",
  category: "backgrounds",
  description: "A diagonally-striped background with motion",
  tags: ["background", "gradient", "bg-diagonal-stripes", "diagonal", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-diagonal-stripes {
  background-color: oklch(0.21 0.034 264.67);
  background-image: repeating-linear-gradient(
    -60deg,
    oklch(0.685 0.131 226.94) 0,
    oklch(0.685 0.131 226.94) 12px,
    oklch(0.52 0.094 223.13) 12px,
    oklch(0.52 0.094 223.13) 24px
  );
  background-size: 200% 200%;
  animation: roy-diagonal-shift 6s linear infinite;
}

@keyframes roy-diagonal-shift {

  from { background-position: 0 0; }
  to { background-position: 48px 0; }

}`,
},

{
  id: "ferrum-bg-dot-pattern",
  name: "Dot Pattern",
  category: "backgrounds",
  description: "A dotted background pattern",
  tags: ["background", "gradient", "bg-dot-pattern", "dot"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-dot-pattern {
  background-color: oklch(0.21 0.034 264.67);
  background-image: radial-gradient(circle, oklch(0.696 0.149 162.48) 1px, transparent 1px);
  background-size: 24px 24px;
}`,
},

{
  id: "ferrum-bg-gradient-pulse",
  name: "Gradient Pulse",
  category: "backgrounds",
  description: "An animated gradient background with shifting color stops",
  tags: ["background", "gradient", "bg-gradient-pulse", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-gradient-pulse {
  background-color: oklch(0.21 0.034 264.67);
  background-image:
    radial-gradient(circle at 50% 50%, oklch(0.696 0.149 162.48) 0%, color-mix(in oklch, oklch(0.696 0.149 162.48) 0%, transparent) 40%),
    radial-gradient(circle at 30% 70%, oklch(0.685 0.131 226.94) 0%, color-mix(in oklch, oklch(0.685 0.131 226.94) 0%, transparent) 40%),
    radial-gradient(circle at 70% 30%, oklch(0.566 0.245 278.69) 0%, color-mix(in oklch, oklch(0.566 0.245 278.69) 0%, transparent) 40%);
  animation: roy-gradient-pulse 4s ease-in-out infinite;
}

@keyframes roy-gradient-pulse {

  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }

}`,
},

{
  id: "ferrum-bg-gradient-sweep",
  name: "Gradient Sweep",
  category: "backgrounds",
  description: "An animated gradient background with shifting color stops",
  tags: ["background", "gradient", "bg-gradient-sweep", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-gradient-sweep {
  background: linear-gradient(
    90deg,
    oklch(0.21 0.034 264.67) 0%,
    oklch(0.696 0.149 162.48) 25%,
    oklch(0.685 0.131 226.94) 50%,
    oklch(0.696 0.149 162.48) 75%,
    oklch(0.21 0.034 264.67) 100%
  );
  background-size: 200% 100%;
  animation: roy-gradient-sweep 4s linear infinite;
}

@keyframes roy-gradient-sweep {

  from { background-position: 200% 0; }
  to { background-position: -200% 0; }

}`,
},

{
  id: "ferrum-bg-grid-lines",
  name: "Grid Lines",
  category: "backgrounds",
  description: "A grid-patterned background with structural line motifs",
  tags: ["background", "gradient", "bg-grid-lines", "grid"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-grid-lines {
  background-color: oklch(0.21 0.034 264.67);
  background-image:
    linear-gradient(color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
}`,
},

{
  id: "ferrum-bg-hexagon",
  name: "Hexagon",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-hexagon", "hexagon"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-hexagon {
  background-color: oklch(0.21 0.034 264.67);
  background-image: url("data:image/svg+xml,%3Csvg width='56' height='100' viewBox='0 0 56 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 0L56 16.18V50.5L28 66.68L0 50.5V16.18L28 0z' fill='none' stroke='%2310b981' stroke-width='1' opacity='0.5'/%3E%3Cpath d='M28 33.32L56 49.5V83.82L28 100L0 83.82V49.5L28 33.32z' fill='none' stroke='%2310b981' stroke-width='1' opacity='0.5'/%3E%3C/svg%3E");
  background-size: 56px 100px;
}`,
},

{
  id: "ferrum-bg-lava-lamp",
  name: "Lava Lamp",
  category: "backgrounds",
  description: "A flowing lava-lamp background with morphing blobs",
  tags: ["background", "gradient", "bg-lava-lamp", "lava"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-lava-lamp {
  background-color: oklch(0.195 0.067 299.87);
  position: relative;
  overflow: hidden;
}`,
},

{
  id: "ferrum-bg-mesh-gradient",
  name: "Mesh Gradient",
  category: "backgrounds",
  description: "A multi-point mesh gradient background with overlapping radial color blobs",
  tags: ["background", "gradient", "bg-mesh-gradient", "mesh"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-mesh-gradient {
  background-color: oklch(0.21 0.034 264.67);
  position: relative;
  overflow: hidden;
}`,
},

{
  id: "ferrum-bg-noise",
  name: "Noise",
  category: "backgrounds",
  description: "A noise-textured background with grainy detail",
  tags: ["background", "gradient", "bg-noise", "noise"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-noise {
  position: relative;
  background-color: oklch(0.21 0.034 264.67);
}`,
},

{
  id: "ferrum-bg-plaid",
  name: "Plaid",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-plaid", "plaid"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-plaid {
  background-color: oklch(0.21 0.034 264.67);
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 18px, color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent) 18px, color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent) 20px),
    repeating-linear-gradient(90deg, transparent, transparent 18px, color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent) 18px, color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent) 20px),
    repeating-linear-gradient(45deg, transparent, transparent 24px, color-mix(in oklch, oklch(0.685 0.131 226.94) 30%, transparent) 24px, color-mix(in oklch, oklch(0.685 0.131 226.94) 30%, transparent) 26px),
    repeating-linear-gradient(-45deg, transparent, transparent 24px, color-mix(in oklch, oklch(0.685 0.131 226.94) 30%, transparent) 24px, color-mix(in oklch, oklch(0.685 0.131 226.94) 30%, transparent) 26px);
}`,
},

{
  id: "ferrum-bg-radial-rays",
  name: "Radial Rays",
  category: "backgrounds",
  description: "A radial-pulse background with concentric emanation",
  tags: ["background", "gradient", "bg-radial-rays", "radial"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-radial-rays {
  background-color: oklch(0.21 0.034 264.67);
  background-image: repeating-conic-gradient(
    from 0deg at 50% 50%,
    oklch(0.696 0.149 162.48) 0deg 4deg,
    transparent 4deg 12deg
  );
}`,
},

{
  id: "ferrum-bg-stripes",
  name: "Stripes",
  category: "backgrounds",
  description: "A diagonally-striped background with motion",
  tags: ["background", "gradient", "bg-stripes", "stripes"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-stripes {
  background: repeating-linear-gradient(
    45deg,
    oklch(0.696 0.149 162.48),
    oklch(0.696 0.149 162.48) 10px,
    oklch(0.21 0.034 264.67) 10px,
    oklch(0.21 0.034 264.67) 20px
  );
}`,
},

{
  id: "ferrum-bg-sunburst",
  name: "Sunburst",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-sunburst", "sunburst"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-sunburst {
  background-color: oklch(0.189 0.028 79.8);
  position: relative;
  overflow: hidden;
}`,
},

{
  id: "ferrum-bg-sunset",
  name: "Sunset",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-sunset", "sunset", "animated"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-sunset {
  background: linear-gradient(
    180deg,
    oklch(0.228 0.039 247.3) 0%,
    oklch(0.387 0.119 314.64) 25%,
    oklch(0.531 0.202 5.62) 50%,
    oklch(0.769 0.188 70.08) 75%,
    oklch(0.924 0.115 95.75) 100%
  );
  background-size: 100% 200%;
  animation: roy-sunset-shift 8s ease-in-out infinite;
}

@keyframes roy-sunset-shift {

  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 0% 50%; }

}`,
},

{
  id: "ferrum-bg-triangles",
  name: "Triangles",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-triangles", "triangles"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-triangles {
  background-color: oklch(0.21 0.034 264.67);
  background-image:
    linear-gradient(45deg, oklch(0.696 0.149 162.48) 25%, transparent 25%),
    linear-gradient(-45deg, oklch(0.685 0.131 226.94) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, oklch(0.685 0.131 226.94) 75%),
    linear-gradient(-45deg, transparent 75%, oklch(0.696 0.149 162.48) 75%);
  background-size: 40px 40px;
  background-position: 0 0, 0 20px, 20px -20px, -20px 0;
}`,
},

{
  id: "ferrum-bg-zigzag",
  name: "Zigzag",
  category: "backgrounds",
  description: "An animated background effect",
  tags: ["background", "gradient", "bg-zigzag", "zigzag"],
  previewType: "background",
  cssCode: `.roycss-ferrum-bg-zigzag {
  background-color: oklch(0.21 0.034 264.67);
  background-image:
    linear-gradient(135deg, oklch(0.696 0.149 162.48) 25%, transparent 25%) -10px 0,
    linear-gradient(225deg, oklch(0.696 0.149 162.48) 25%, transparent 25%) -10px 0,
    linear-gradient(315deg, oklch(0.696 0.149 162.48) 25%, transparent 25%),
    linear-gradient(45deg, oklch(0.696 0.149 162.48) 25%, transparent 25%);
  background-size: 20px 20px;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // BORDERS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-border-animated-dash",
  name: "Animated Dash",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-animated-dash", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-animated-dash {
  width: 140px;
  height: 80px;
  background: oklch(0.21 0.034 264.67);
  border: 3px dashed oklch(0.696 0.149 162.48);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.95 0.051 163.05);
  font-size: 12px;
  font-weight: 600;
  animation: roy-border-dash-glow 1.6s ease-in-out infinite;
}

@keyframes roy-border-dash-glow {

  0%, 100% {
    border-color: oklch(0.696 0.149 162.48);
    box-shadow: 0 0 5px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
  }
  50% {
    border-color: oklch(0.769 0.154 162.48);
    box-shadow: 0 0 18px color-mix(in oklch, oklch(0.696 0.149 162.48) 65%, transparent);
  }

}`,
},

{
  id: "ferrum-border-banner",
  name: "Banner",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-banner", "banner"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-banner {
  width: 140px;
  height: 80px;
  background: linear-gradient(135deg, oklch(0.769 0.188 70.08), oklch(0.637 0.237 25.77));
  clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 50%, 100% 100%, 0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(1 0 0);
  font-size: 12px;
  font-weight: 700;
  padding-right: 16px;
  box-sizing: border-box;
}`,
},

{
  id: "ferrum-border-clip-path",
  name: "Clip Path",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-clip-path", "clip"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-clip-path {
  position: relative;
  width: 140px;
  height: 80px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.685 0.131 226.94));
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(1 0 0);
  font-size: 12px;
  font-weight: 600;
}`,
},

{
  id: "ferrum-border-corner-brackets",
  name: "Corner Brackets",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-corner-brackets", "corner"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-corner-brackets {
  position: relative;
  width: 140px;
  height: 80px;
  background: oklch(0.21 0.034 264.67);
  background-image:
    linear-gradient(oklch(0.685 0.131 226.94), oklch(0.685 0.131 226.94)),
    linear-gradient(oklch(0.685 0.131 226.94), oklch(0.685 0.131 226.94)),
    linear-gradient(oklch(0.685 0.131 226.94), oklch(0.685 0.131 226.94)),
    linear-gradient(oklch(0.685 0.131 226.94), oklch(0.685 0.131 226.94)),
    linear-gradient(oklch(0.685 0.131 226.94), oklch(0.685 0.131 226.94)),
    linear-gradient(oklch(0.685 0.131 226.94), oklch(0.685 0.131 226.94)),
    linear-gradient(oklch(0.685 0.131 226.94), oklch(0.685 0.131 226.94)),
    linear-gradient(oklch(0.685 0.131 226.94), oklch(0.685 0.131 226.94));
  background-position:
    top left, top left,
    top right, top right,
    bottom left, bottom left,
    bottom right, bottom right;
  background-size:
    22px 3px, 3px 22px,
    22px 3px, 3px 22px,
    22px 3px, 3px 22px,
    22px 3px, 3px 22px;
  background-repeat: no-repeat;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.865 0.115 207.08);
  font-size: 12px;
  font-weight: 600;
}`,
},

{
  id: "ferrum-border-dashed-draw",
  name: "Dashed Draw",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-dashed-draw", "dashed"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-dashed-draw {
  position: relative;
  width: 140px;
  height: 80px;
  background: oklch(0.21 0.034 264.67);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.709 0.159 293.54);
  font-size: 12px;
  font-weight: 600;
}`,
},

{
  id: "ferrum-border-double-glow",
  name: "Double Glow",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-double-glow", "double"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-double-glow {
  position: relative;
  width: 140px;
  height: 80px;
  background: oklch(0.21 0.034 264.67);
  border: 1px solid oklch(0.696 0.149 162.48);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.826 0.124 162.48);
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 0 12px color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent), 0 0 24px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent), inset 0 0 12px color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent);
}`,
},

{
  id: "ferrum-border-frame",
  name: "Frame",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-frame", "frame"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-frame {
  position: relative;
  width: 140px;
  height: 80px;
  background: oklch(0.27 0.04 260.03);
  border: 3px double oklch(0.769 0.188 70.08);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.924 0.115 95.75);
  font-size: 12px;
  font-weight: 600;
  outline: 1px solid oklch(0.769 0.188 70.08);
  outline-offset: 4px;
}`,
},

{
  id: "ferrum-border-gradient-animated",
  name: "Gradient Animated",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-gradient-animated", "gradient"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-gradient-animated {
  position: relative;
  width: 140px;
  height: 80px;
  background: oklch(0.21 0.034 264.67);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.929 0.013 255.51);
  font-size: 12px;
  font-weight: 600;
}`,
},

{
  id: "ferrum-border-inset-glow",
  name: "Inset Glow",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-inset-glow", "inset"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-inset-glow {
  width: 140px;
  height: 80px;
  background: oklch(0.145 0.0 89.88);
  border: 1px solid color-mix(in oklch, oklch(0.685 0.131 226.94) 50%, transparent);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.865 0.115 207.08);
  font-size: 12px;
  font-weight: 600;
  box-shadow:
    inset 0 0 22px color-mix(in oklch, oklch(0.685 0.131 226.94) 40%, transparent),
    inset 0 0 4px color-mix(in oklch, oklch(0.685 0.131 226.94) 70%, transparent);
}`,
},

{
  id: "ferrum-border-marching-ants",
  name: "Marching Ants",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-marching-ants", "marching", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-marching-ants {
  width: 140px;
  height: 80px;
  background-color: oklch(0.21 0.034 264.67);
  background-image:
    repeating-linear-gradient(90deg, oklch(0.769 0.188 70.08) 0 6px, transparent 6px 12px),
    repeating-linear-gradient(90deg, oklch(0.769 0.188 70.08) 0 6px, transparent 6px 12px),
    repeating-linear-gradient(0deg, oklch(0.769 0.188 70.08) 0 6px, transparent 6px 12px),
    repeating-linear-gradient(0deg, oklch(0.769 0.188 70.08) 0 6px, transparent 6px 12px);
  background-position: 0 0, 0 100%, 0 0, 100% 0;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size: 12px 2px, 12px 2px, 2px 12px, 2px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.924 0.115 95.75);
  font-size: 12px;
  font-weight: 600;
  animation: roy-border-march 0.7s linear infinite;
}

@keyframes roy-border-march {

  to {
    background-position: 12px 0, -12px 100%, 0 -12px, 100% 12px;
  }

}`,
},

{
  id: "ferrum-border-neon-pulse",
  name: "Neon Pulse",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-neon-pulse", "neon", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-neon-pulse {
  width: 140px;
  height: 80px;
  background: oklch(0.145 0.0 89.88);
  border: 2px solid oklch(0.652 0.241 354.31);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.823 0.11 346.02);
  font-size: 12px;
  font-weight: 600;
  animation: roy-border-neon 1.5s ease-in-out infinite;
}

@keyframes roy-border-neon {

  0%, 100% {
    border-color: oklch(0.652 0.241 354.31);
    box-shadow: 0 0 5px oklch(0.652 0.241 354.31), inset 0 0 5px oklch(0.652 0.241 354.31);
  }
  50% {
    border-color: oklch(0.725 0.175 349.76);
    box-shadow: 0 0 22px oklch(0.652 0.241 354.31), 0 0 44px oklch(0.652 0.241 354.31), inset 0 0 16px oklch(0.652 0.241 354.31);
  }

}`,
},

{
  id: "ferrum-border-polaroid",
  name: "Polaroid",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-polaroid", "polaroid"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-polaroid {
  width: 140px;
  height: 110px;
  background: oklch(1 0 0);
  padding: 8px 8px 30px;
  box-sizing: border-box;
  box-shadow: 0 6px 16px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-4deg);
}`,
},

{
  id: "ferrum-border-ribbon",
  name: "Ribbon",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-ribbon", "ribbon"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-ribbon {
  width: 140px;
  height: 90px;
  background: oklch(0.637 0.237 25.77);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 52% 78%, 0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(1 0 0);
  font-size: 12px;
  font-weight: 700;
  padding-bottom: 14px;
  box-sizing: border-box;
}`,
},

{
  id: "ferrum-border-sticker",
  name: "Sticker",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-sticker", "sticker"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-sticker {
  width: 140px;
  height: 80px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.685 0.131 226.94));
  border: 6px solid oklch(1 0 0);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(1 0 0);
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 5px 14px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  transform: rotate(-3deg);
}`,
},

{
  id: "ferrum-border-torn-paper",
  name: "Torn Paper",
  category: "borders",
  description: "An animated or decorative border treatment",
  tags: ["border", "outline", "border-torn-paper", "torn"],
  previewType: "box",
  cssCode: `.roycss-ferrum-border-torn-paper {
  width: 140px;
  height: 80px;
  background: oklch(0.984 0.003 247.86);
  color: oklch(0.27 0.04 260.03);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  clip-path: polygon(
    0% 6%, 5% 0%, 12% 6%, 20% 1%, 28% 5%, 35% 0%, 42% 4%, 50% 1%, 58% 5%, 65% 0%, 72% 4%, 80% 1%, 88% 5%, 95% 0%, 100% 6%,
    100% 94%, 95% 100%, 88% 94%, 80% 99%, 72% 95%, 65% 100%, 58% 96%, 50% 99%, 42% 95%, 35% 100%, 28% 96%, 20% 99%, 12% 95%, 5% 100%, 0% 94%
  );
  filter: drop-shadow(2px 2px 4px color-mix(in oklch, oklch(0 0 0) 25%, transparent));
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // GLASS-UI
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-apple-squish-in",
  name: "Apple Squish In",
  category: "glass-ui",
  description: "An Apple-inspired motion or surface effect (apple squish in)",
  tags: ["apple", "glassmorphism", "apple-squish-in", "squish", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-squish-in {
  animation: roy-apple-squish-in 0.7s cubic-bezier(0.32, 0.72, 0, 1) both;
}

@keyframes roy-apple-squish-in {

  0% { opacity: 0; transform: translateY(60px) scale(0.8, 0.85); }
  55% { opacity: 1; transform: translateY(0) scale(1.06, 0.94); }
  78% { transform: scale(0.98, 1.02); }
  100% { transform: scale(1); }

}`,
},

{
  id: "ferrum-apple-squish-out",
  name: "Apple Squish Out",
  category: "glass-ui",
  description: "An Apple-inspired motion or surface effect (apple squish out)",
  tags: ["apple", "glassmorphism", "apple-squish-out", "squish", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-squish-out {
  animation: roy-apple-squish-out 0.55s cubic-bezier(0.32, 0.72, 0, 1) both;
}

@keyframes roy-apple-squish-out {

  0% { opacity: 1; transform: scale(1); }
  40% { opacity: 1; transform: scale(0.94, 1.05) translateY(8px); }
  100% { opacity: 0; transform: scale(0.85) translateY(60px); }

}`,
},

{
  id: "ferrum-apple-ultra-thin",
  name: "Apple Ultra Thin",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["apple", "glassmorphism", "apple-ultra-thin", "ultra"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-ultra-thin {
  background: color-mix(in oklch, oklch(1 0 0) 40%, transparent);
  backdrop-filter: blur(8px) saturate(110%);
  -webkit-backdrop-filter: blur(8px) saturate(110%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 60%, transparent);
  border-radius: 10px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 0) 50%, transparent) inset,
    0 2px 8px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
  color: oklch(0.232 0.004 286.1);
}`,
},

{
  id: "ferrum-apple-vibrancy-dark",
  name: "Apple Vibrancy Dark",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["apple", "glassmorphism", "apple-vibrancy-dark", "vibrancy"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-vibrancy-dark {
  background: color-mix(in oklch, oklch(0.236 0.004 286.11) 55%, transparent);
  backdrop-filter: blur(24px) saturate(180%) brightness(0.95);
  -webkit-backdrop-filter: blur(24px) saturate(180%) brightness(0.95);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 14px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 0) 8%, transparent) inset,
    0 10px 30px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  color: oklch(0.971 0.003 286.35);
}`,
},

{
  id: "ferrum-apple-vibrancy-light",
  name: "Apple Vibrancy Light",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["apple", "glassmorphism", "apple-vibrancy-light", "vibrancy"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-vibrancy-light {
  background: color-mix(in oklch, oklch(1 0 0) 60%, transparent);
  backdrop-filter: blur(20px) saturate(180%) brightness(1.05);
  -webkit-backdrop-filter: blur(20px) saturate(180%) brightness(1.05);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 50%, transparent);
  border-radius: 14px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 0) 70%, transparent) inset,
    0 10px 30px color-mix(in oklch, oklch(0 0 0) 10%, transparent);
  color: oklch(0.232 0.004 286.1);
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-ascii-rain",
  name: "Ascii Rain",
  category: "visual",
  description: "A ascii rain effect",
  tags: ["ascii-rain", "rain"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ascii-rain {
  width: 100%;
  min-height: 240px;
  background:
    radial-gradient(ellipse at 50% 0%, oklch(0.191 0.047 154.77) 0%, oklch(0.09 0.017 224.61) 100%);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}`,
},

{
  id: "ferrum-blueprint",
  name: "Blueprint",
  category: "visual",
  description: "A blueprint effect",
  tags: ["blueprint"],
  previewType: "box",
  cssCode: `.roycss-ferrum-blueprint {
  width: 100%;
  min-height: 240px;
  background:
    linear-gradient(0deg,
      transparent 0 calc(100% - 1px), color-mix(in oklch, oklch(0.878 0.064 245.03) 40%, transparent) calc(100% - 1px) 100%),
    linear-gradient(90deg,
      transparent 0 calc(100% - 1px), color-mix(in oklch, oklch(0.878 0.064 245.03) 40%, transparent) calc(100% - 1px) 100%),
    repeating-linear-gradient(0deg, transparent 0 19px, color-mix(in oklch, oklch(0.878 0.064 245.03) 18%, transparent) 19px 20px),
    repeating-linear-gradient(90deg, transparent 0 19px, color-mix(in oklch, oklch(0.878 0.064 245.03) 18%, transparent) 19px 20px),
    repeating-linear-gradient(0deg, transparent 0 99px, color-mix(in oklch, oklch(0.878 0.064 245.03) 35%, transparent) 99px 100px),
    repeating-linear-gradient(90deg, transparent 0 99px, color-mix(in oklch, oklch(0.878 0.064 245.03) 35%, transparent) 99px 100px),
    oklch(0.366 0.116 256.33);
  background-size: 20px 20px, 20px 20px, 20px 20px, 20px 20px, 100px 100px, 100px 100px, 100% 100%;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  color: oklch(0.92 0.041 246.02);
}`,
},

];
