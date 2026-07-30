import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 28 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch28: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // 3D-TRANSFORMS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-cube-face",
  name: "Cube Face",
  category: "3d-transforms",
  description: "A cube face effect",
  tags: ["cube-face", "face"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cube-face {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 2px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent);
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 8%, transparent);
  border-radius: 4px;
}`,
},

{
  id: "ferrum-cube-rotate",
  name: "Cube Rotate",
  category: "3d-transforms",
  description: "An animated motion effect (cube rotate)",
  tags: ["cube-rotate", "rotate", "animated", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cube-rotate {
  width: 60px;
  height: 60px;
  transform-style: preserve-3d;
  animation: roy-cube-rotate 6s linear infinite;
}

@keyframes roy-cube-rotate {

  0% { transform: rotateX(0deg) rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-door-open",
  name: "Door Open",
  category: "animations",
  description: "A 3D transform effect with perspective depth",
  tags: ["door-open", "open", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-door-open {
  perspective: 800px;
  width: 60px;
  height: 80px;
  position: relative;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  border: 2px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
  border-radius: 4px;
}`,
},

{
  id: "ferrum-fade-in-bl",
  name: "Fade In Bl",
  category: "animations",
  description: "An animated motion effect (fade in bl)",
  tags: ["fade", "transition", "fade-in-bl", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-in-bl {
  animation: roy-fade-in-bl 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-fade-in-bl {

  from {
    opacity: 0;
    transform: translate3d(-28px, 28px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-fade-in-br",
  name: "Fade In Br",
  category: "animations",
  description: "An animated motion effect (fade in br)",
  tags: ["fade", "transition", "fade-in-br", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-in-br {
  animation: roy-fade-in-br 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-fade-in-br {

  from {
    opacity: 0;
    transform: translate3d(28px, 28px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-fade-in-right",
  name: "Fade In Right",
  category: "animations",
  description: "An animated motion effect (fade in right)",
  tags: ["fade", "transition", "fade-in-right", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-in-right {
  animation: roy-fade-in-right 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-fade-in-right {

  from {
    opacity: 0;
    transform: translate3d(32px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-fade-out-down",
  name: "Fade Out Down",
  category: "animations",
  description: "An animated motion effect (fade out down)",
  tags: ["fade", "transition", "fade-out-down", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-out-down {
  animation: roy-fade-out-down 0.7s ease-in both;
}

@keyframes roy-fade-out-down {

  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(40px);
  }

}`,
},

{
  id: "ferrum-fade-out-left",
  name: "Fade Out Left",
  category: "animations",
  description: "An animated motion effect (fade out left)",
  tags: ["fade", "transition", "fade-out-left", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-out-left {
  animation: roy-fade-out-left 0.7s cubic-bezier(0.55, 0, 0.68, 0.53) both;
}

@keyframes roy-fade-out-left {

  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    transform: translate3d(-32px, 0, 0);
  }

}`,
},

{
  id: "ferrum-fade-out-right",
  name: "Fade Out Right",
  category: "animations",
  description: "An animated motion effect (fade out right)",
  tags: ["fade", "transition", "fade-out-right", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-out-right {
  animation: roy-fade-out-right 0.7s cubic-bezier(0.55, 0, 0.68, 0.53) both;
}

@keyframes roy-fade-out-right {

  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    transform: translate3d(32px, 0, 0);
  }

}`,
},

{
  id: "ferrum-fade-out-up",
  name: "Fade Out Up",
  category: "animations",
  description: "An animated motion effect (fade out up)",
  tags: ["fade", "transition", "fade-out-up", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-out-up {
  animation: roy-fade-out-up 0.7s cubic-bezier(0.55, 0, 0.68, 0.53) both;
}

@keyframes roy-fade-out-up {

  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    transform: translate3d(0, -28px, 0);
  }

}`,
},

{
  id: "ferrum-flip-x",
  name: "Flip X",
  category: "animations",
  description: "A 3D transform effect with perspective depth",
  tags: ["flip", "transform", "flip-x"],
  previewType: "box",
  cssCode: `.roycss-ferrum-flip-x {
  perspective: 800px;
  transition: transform 0.6s ease;
  transform-style: preserve-3d;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.685 0.131 226.94));
  border-radius: 12px;
}`,
},

{
  id: "ferrum-flip-y",
  name: "Flip Y",
  category: "animations",
  description: "A 3D transform effect with perspective depth",
  tags: ["flip", "transform", "flip-y"],
  previewType: "box",
  cssCode: `.roycss-ferrum-flip-y {
  perspective: 800px;
  transition: transform 0.6s ease;
  transform-style: preserve-3d;
  background: linear-gradient(135deg, oklch(0.685 0.131 226.94), oklch(0.566 0.245 278.69));
  border-radius: 12px;
}`,
},

{
  id: "ferrum-float",
  name: "Float",
  category: "animations",
  description: "An animated motion effect (float)",
  tags: ["float", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-float {
  animation: roy-float 3s ease-in-out infinite;
}

@keyframes roy-float {

  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }

}`,
},

{
  id: "ferrum-fold",
  name: "Fold",
  category: "animations",
  description: "A 3D transform effect with perspective depth",
  tags: ["fold", "motion", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fold {
  perspective: 800px;
  width: 80px;
  height: 60px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.685 0.131 226.94));
  border-radius: 6px;
  transition: transform 0.8s ease;
  transform-origin: top center;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // CARDS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-card-spotlight",
  name: "Spotlight",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-spotlight", "spotlight"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-spotlight {
  position: relative;
  overflow: hidden;
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 8%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // CURSOR
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-cursor-arrow-bounce",
  name: "Arrow Bounce",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-arrow-bounce", "arrow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-arrow-bounce {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.234 0.039 67.22), oklch(0.177 0.034 269.56));
  overflow: hidden;
}`,
},

{
  id: "ferrum-cursor-blob",
  name: "Blob",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-blob", "blob"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-blob {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.21 0.034 264.67), oklch(0.177 0.034 269.56));
  overflow: hidden;
}`,
},

{
  id: "ferrum-cursor-crosshair",
  name: "Crosshair",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-crosshair", "crosshair"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-crosshair {
  position: relative;
  background:
    linear-gradient(0deg, transparent 49.5%, color-mix(in oklch, oklch(0.711 0.035 256.79) 8%, transparent) 49.5% 50.5%, transparent 50.5%),
    linear-gradient(90deg, transparent 49.5%, color-mix(in oklch, oklch(0.711 0.035 256.79) 8%, transparent) 49.5% 50.5%, transparent 50.5%),
    radial-gradient(circle at 50% 50%, oklch(0.192 0.035 314.78), oklch(0.177 0.034 269.56));
  overflow: hidden;
}`,
},

{
  id: "ferrum-cursor-firefly",
  name: "Firefly",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-firefly", "firefly"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-firefly {
  position: relative;
  background: linear-gradient(135deg, oklch(0.173 0.034 269.46), oklch(0.203 0.06 297.11));
  overflow: hidden;
}`,
},

{
  id: "ferrum-cursor-glow-dot",
  name: "Glow Dot",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-glow-dot", "glow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-glow-dot {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.21 0.034 264.67), oklch(0.177 0.034 269.56));
  overflow: hidden;
}`,
},

{
  id: "ferrum-cursor-gradient-trail",
  name: "Gradient Trail",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-gradient-trail", "gradient"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-gradient-trail {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.203 0.06 297.11), oklch(0.177 0.034 269.56));
  overflow: hidden;
}`,
},

{
  id: "ferrum-cursor-magnetic",
  name: "Magnetic",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-magnetic", "magnetic"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-magnetic {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, oklch(0.177 0.034 269.56), oklch(0.21 0.034 264.67));
  border: 1px solid color-mix(in oklch, oklch(0.711 0.035 256.79) 25%, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition:
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}`,
},

{
  id: "ferrum-cursor-pulse-ring",
  name: "Pulse Ring",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-pulse-ring", "pulse"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-pulse-ring {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.209 0.061 305.58), oklch(0.177 0.034 269.56));
  overflow: hidden;
}`,
},

{
  id: "ferrum-cursor-ring",
  name: "Ring",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-ring", "ring"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-ring {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.194 0.039 264.9), oklch(0.177 0.034 269.56));
  overflow: hidden;
}`,
},

{
  id: "ferrum-cursor-ripple",
  name: "Ripple",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-ripple", "ripple"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-ripple {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.258 0.042 166.13), oklch(0.177 0.034 269.56));
  overflow: hidden;
}`,
},

{
  id: "ferrum-cursor-spotlight",
  name: "Spotlight",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-spotlight", "spotlight"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-spotlight {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.257 0.086 281.29));
  overflow: hidden;
}`,
},

{
  id: "ferrum-cursor-trail",
  name: "Trail",
  category: "cursor",
  description: "A custom cursor or cursor-following visual effect",
  tags: ["cursor", "pointer", "cursor-trail", "trail"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cursor-trail {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.203 0.06 297.11), oklch(0.177 0.034 269.56));
  overflow: hidden;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // FORMS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-form-checkbox-custom",
  name: "Checkbox Custom",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["form", "input", "form-checkbox-custom", "checkbox"],
  previewType: "box",
  cssCode: `.roycss-ferrum-form-checkbox-custom {
  position: relative;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}`,
},

{
  id: "ferrum-form-error-shake",
  name: "Error Shake",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["form", "input", "form-error-shake", "error", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-form-error-shake {
  position: relative;
  width: 160px;
  height: 40px;
  padding: 0 14px;
  background: color-mix(in oklch, oklch(0.637 0.237 25.77) 8%, transparent);
  border: 1px solid oklch(0.637 0.237 25.77);
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  color: oklch(0.808 0.103 19.57);
  animation: roy-form-error-shake 0.5s ease-in-out infinite;
}

@keyframes roy-form-error-shake {

  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-5px); }
  40%      { transform: translateX(5px); }
  60%      { transform: translateX(-3px); }
  80%      { transform: translateX(3px); }

}`,
},

{
  id: "ferrum-form-focus-glow",
  name: "Focus Glow",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["form", "input", "form-focus-glow", "focus"],
  previewType: "box",
  cssCode: `.roycss-ferrum-form-focus-glow {
  position: relative;
  width: 170px;
  height: 40px;
  padding: 0 14px;
  background: color-mix(in oklch, oklch(1 0 0) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 18%, transparent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 0) 55%, transparent);
  transition: all 0.3s ease;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-drawer-slide",
  name: "Drawer Slide",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["drawer-slide", "slide", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-drawer-slide {
  perspective: 800px;
  width: 80px;
  height: 60px;
  position: relative;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 8%, transparent);
  border: 2px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 25%, transparent);
  border-radius: 6px;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-clip-path-hexagon",
  name: "Clip Path Hexagon",
  category: "visual",
  description: "An animated motion effect (clip path hexagon)",
  tags: ["clip-path-hexagon", "path", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-clip-path-hexagon {
  width: 160px;
  height: 160px;
  background:
    conic-gradient(from 30deg, oklch(0.769 0.188 70.08), oklch(0.637 0.237 25.77), oklch(0.652 0.241 354.31), oklch(0.566 0.245 278.69), oklch(0.769 0.188 70.08));
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: grid;
  place-items: center;
  animation: roy-b10-cph-spin 6s linear infinite;
}

@keyframes roy-b10-cph-spin {

  to { transform: rotate(360deg); }

}`,
},

{
  id: "ferrum-clip-path-star",
  name: "Clip Path Star",
  category: "visual",
  description: "An animated motion effect (clip path star)",
  tags: ["clip-path-star", "path", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-clip-path-star {
  width: 170px;
  height: 170px;
  background: linear-gradient(135deg, oklch(0.837 0.164 84.43), oklch(0.769 0.188 70.08) 40%, oklch(0.555 0.146 49.0));
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
    50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
  );
  display: grid;
  place-items: center;
  animation: roy-b10-cps-twinkle 1.8s ease-in-out infinite;
}

@keyframes roy-b10-cps-twinkle {

  0%, 100% { filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(0.837 0.164 84.43) 50%, transparent)); transform: scale(1); }
  50%      { filter: drop-shadow(0 0 18px color-mix(in oklch, oklch(0.837 0.164 84.43) 95%, transparent)); transform: scale(1.06); }

}`,
},

{
  id: "ferrum-deep-sea",
  name: "Deep Sea",
  category: "visual",
  description: "A deep sea effect",
  tags: ["deep-sea", "sea"],
  previewType: "box",
  cssCode: `.roycss-ferrum-deep-sea {
  position: relative;
  width: 220px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(180deg, oklch(0.456 0.079 228.92) 0%, oklch(0.347 0.065 233.52) 40%, oklch(0.228 0.042 238.55) 80%, oklch(0.165 0.031 237.9) 100%);
}`,
},

{
  id: "ferrum-depth-shadow",
  name: "Depth Shadow",
  category: "visual",
  description: "A depth shadow effect",
  tags: ["depth-shadow", "shadow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-depth-shadow {
  box-shadow:
    1px 1px 0 oklch(0.432 0.086 166.91),
    2px 2px 0 oklch(0.596 0.127 163.23),
    3px 3px 0 oklch(0.508 0.105 165.61),
    4px 4px 0 oklch(0.696 0.149 162.48),
    5px 5px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent),
    6px 6px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent),
    7px 7px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent),
    8px 8px 20px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  transition: all 0.3s ease;
}`,
},

{
  id: "ferrum-filter-blur-focus",
  name: "Filter Blur Focus",
  category: "visual",
  description: "A CSS filter effect (filter blur focus)",
  tags: ["filter-blur-focus", "blur", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-blur-focus {
  background: linear-gradient(135deg, oklch(0.723 0.155 19.75) 0%, oklch(0.892 0.108 86.3) 50%, oklch(0.952 0.074 158.47) 100%);
  filter: blur(8px) saturate(1.2);
  animation: roy-filter-blur-focus 3s ease-in-out infinite;
}

@keyframes roy-filter-blur-focus {

  0%, 100% { filter: blur(8px) saturate(1.2); }
  50%      { filter: blur(0px) saturate(1.4); }

}`,
},

{
  id: "ferrum-filter-cinematic",
  name: "Filter Cinematic",
  category: "visual",
  description: "A CSS filter effect (filter cinematic)",
  tags: ["filter-cinematic", "cinematic"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-cinematic {
  background: linear-gradient(135deg, oklch(0.615 0.235 30.43) 0%, oklch(0.8 0.162 78.77) 40%, oklch(0.616 0.104 219.93) 80%, oklch(0.82 0.102 214.8) 100%);
  filter: contrast(1.25) saturate(1.3) brightness(0.92) hue-rotate(-8deg) sepia(0.18);
}`,
},

{
  id: "ferrum-filter-contrast",
  name: "Filter Contrast",
  category: "visual",
  description: "A CSS filter effect (filter contrast)",
  tags: ["filter-contrast", "contrast"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-contrast {
  background: linear-gradient(135deg, oklch(0.814 0.009 236.59) 0%, oklch(0.356 0.039 248.97) 50%, oklch(0.814 0.009 236.59) 100%);
  filter: contrast(2.4) brightness(1.05);
}`,
},

{
  id: "ferrum-filter-dramatic",
  name: "Filter Dramatic",
  category: "visual",
  description: "A CSS filter effect (filter dramatic)",
  tags: ["filter-dramatic", "dramatic"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-dramatic {
  background: linear-gradient(135deg, oklch(0.777 0.099 10.85) 0%, oklch(0.927 0.038 9.81) 30%, oklch(0.732 0.169 11.89) 60%, oklch(0.736 0.164 34.71) 100%);
  filter: contrast(1.6) saturate(1.5) brightness(0.82);
}`,
},

{
  id: "ferrum-filter-dreamy",
  name: "Filter Dreamy",
  category: "visual",
  description: "A CSS filter effect (filter dreamy)",
  tags: ["filter-dreamy", "dreamy"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-dreamy {
  background: linear-gradient(135deg, oklch(0.694 0.199 311.3) 0%, oklch(0.74 0.195 341.99) 40%, oklch(0.913 0.102 200.91) 100%);
  filter: blur(1.2px) brightness(1.18) saturate(1.4) contrast(0.92);
}`,
},

{
  id: "ferrum-filter-duotone",
  name: "Filter Duotone",
  category: "visual",
  description: "A CSS filter effect (filter duotone)",
  tags: ["filter-duotone", "duotone"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-duotone {
  background: linear-gradient(135deg, oklch(0.975 0.005 258.32) 0%, oklch(0.851 0.03 259.59) 50%, oklch(0.877 0.084 336.72) 100%);
  filter: grayscale(1) sepia(1) hue-rotate(180deg) saturate(3) contrast(1.3);
}`,
},

{
  id: "ferrum-filter-emboss",
  name: "Filter Emboss",
  category: "visual",
  description: "A CSS filter effect (filter emboss)",
  tags: ["filter-emboss", "emboss"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-emboss {
  background: linear-gradient(135deg, oklch(0.396 0.087 119.89) 0%, oklch(0.555 0.117 114.38) 50%, oklch(0.891 0.172 115.45) 100%);
  filter: grayscale(1) brightness(1.1) contrast(1.4)
    drop-shadow(2px 2px 1px color-mix(in oklch, oklch(1 0 0) 50%, transparent))
    drop-shadow(-2px -2px 1px color-mix(in oklch, oklch(0 0 0) 60%, transparent));
}`,
},

{
  id: "ferrum-filter-glitch",
  name: "Filter Glitch",
  category: "visual",
  description: "A CSS filter effect (filter glitch)",
  tags: ["filter-glitch", "glitch", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-glitch {
  background: linear-gradient(135deg, oklch(0.838 0.245 147.59) 0%, oklch(0.574 0.192 255.75) 50%, oklch(0.759 0.164 64.36) 100%);
  animation: roy-filter-glitch 1.2s steps(2, end) infinite;
}

@keyframes roy-filter-glitch {

  0%   { filter: hue-rotate(0deg) saturate(1.5); }
  20%  { filter: hue-rotate(60deg) saturate(2) contrast(1.3); }
  40%  { filter: hue-rotate(180deg) saturate(1.8) invert(0.15); }
  60%  { filter: hue-rotate(270deg) saturate(2.5) contrast(1.1); }
  80%  { filter: hue-rotate(120deg) saturate(1.6); }
  100% { filter: hue-rotate(360deg) saturate(1.5); }

}`,
},

{
  id: "ferrum-filter-grayscale-hover",
  name: "Filter Grayscale Hover",
  category: "visual",
  description: "A CSS filter effect (filter grayscale hover)",
  tags: ["filter-grayscale-hover", "grayscale"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-grayscale-hover {
  background: linear-gradient(135deg, oklch(0.667 0.217 13.9) 0%, oklch(0.56 0.235 268.65) 50%, oklch(0.667 0.217 13.9) 100%);
  filter: grayscale(1) brightness(0.85);
  transition: filter 0.5s ease;
}`,
},

{
  id: "ferrum-filter-halftone",
  name: "Filter Halftone",
  category: "visual",
  description: "A CSS filter effect (filter halftone)",
  tags: ["filter-halftone", "halftone"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-halftone {
  background:
    radial-gradient(circle, color-mix(in oklch, oklch(0 0 0) 85%, transparent) 1px, transparent 1.6px) 0 0 / 5px 5px,
    linear-gradient(135deg, oklch(0.712 0.181 22.84) 0%, oklch(0.776 0.112 188.54) 50%, oklch(0.922 0.143 97.78) 100%);
  filter: contrast(1.4) saturate(1.3);
}`,
},

{
  id: "ferrum-filter-hue-rotate",
  name: "Filter Hue Rotate",
  category: "visual",
  description: "A CSS filter effect (filter hue rotate)",
  tags: ["filter-hue-rotate", "hue", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-hue-rotate {
  background: linear-gradient(135deg, oklch(0.641 0.257 8.07) 0%, oklch(0.546 0.248 295.88) 50%, oklch(0.637 0.195 259.51) 100%);
  animation: roy-filter-hue-rotate 4s linear infinite;
}

@keyframes roy-filter-hue-rotate {

  0%   { filter: hue-rotate(0deg) saturate(1.5); }
  100% { filter: hue-rotate(360deg) saturate(1.5); }

}`,
},

{
  id: "ferrum-filter-invert",
  name: "Filter Invert",
  category: "visual",
  description: "A CSS filter effect (filter invert)",
  tags: ["filter-invert", "invert"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-invert {
  background: linear-gradient(135deg, oklch(0.701 0.201 44.77) 0%, oklch(0.615 0.246 2.02) 50%, oklch(0.701 0.201 44.77) 100%);
  filter: invert(1) hue-rotate(180deg);
}`,
},

{
  id: "ferrum-filter-saturate",
  name: "Filter Saturate",
  category: "visual",
  description: "A CSS filter effect (filter saturate)",
  tags: ["filter-saturate", "saturate"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-saturate {
  background: linear-gradient(135deg, oklch(0.583 0.161 23.52) 0%, oklch(0.308 0.116 325.06) 50%, oklch(0.583 0.161 23.52) 100%);
  filter: saturate(3.2) contrast(1.1);
}`,
},

{
  id: "ferrum-filter-sepia",
  name: "Filter Sepia",
  category: "visual",
  description: "A CSS filter effect (filter sepia)",
  tags: ["filter-sepia", "sepia"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-sepia {
  background: linear-gradient(135deg, oklch(0.779 0.149 226.02) 0%, oklch(0.909 0.165 146.32) 50%, oklch(0.977 0.044 100.28) 100%);
  filter: sepia(0.85) contrast(1.1) brightness(1.05);
}`,
},

{
  id: "ferrum-filter-vintage",
  name: "Filter Vintage",
  category: "visual",
  description: "A CSS filter effect (filter vintage)",
  tags: ["filter-vintage", "vintage"],
  previewType: "box",
  cssCode: `.roycss-ferrum-filter-vintage {
  background: linear-gradient(135deg, oklch(0.712 0.181 22.84) 0%, oklch(0.864 0.143 84.36) 40%, oklch(0.826 0.154 331.46) 80%, oklch(0.827 0.128 215.58) 100%);
  filter: sepia(0.55) saturate(0.8) contrast(0.9) brightness(0.95) hue-rotate(-10deg);
}`,
},

];
