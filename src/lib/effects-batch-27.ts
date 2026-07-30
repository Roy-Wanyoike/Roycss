import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 27 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch27: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-bounce-rotate",
  name: "Bounce Rotate",
  category: "animations",
  description: "An animated motion effect (bounce rotate)",
  tags: ["bounce", "motion", "bounce-rotate", "rotate", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-bounce-rotate {
  animation: roy-bounce-rotate 1.1s cubic-bezier(0.28, 1.42, 0.55, 1) both;
}

@keyframes roy-bounce-rotate {

  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-180deg);
  }
  40% {
    opacity: 1;
    transform: scale(1.15) rotate(20deg);
  }
  60% {
    transform: scale(0.92) rotate(-10deg);
  }
  80% {
    transform: scale(1.04) rotate(4deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }

}`,
},

{
  id: "ferrum-breathe",
  name: "Breathe",
  category: "animations",
  description: "An animated motion effect (breathe)",
  tags: ["breathe", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-breathe {
  animation: roy-breathe 4s ease-in-out infinite;
}

@keyframes roy-breathe {

  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.08); opacity: 1; }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // BUTTONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-btn-3d-push",
  name: "3D Push",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-3d-push", "3d"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-3d-push {
  position: relative;
  background: oklch(0.768 0.178 130.36);
  color: oklch(0.274 0.069 132.11);
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 5px 0 oklch(0.648 0.175 131.68), 0 7px 14px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}`,
},

{
  id: "ferrum-btn-arrow-slide",
  name: "Arrow Slide",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-arrow-slide", "arrow"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-arrow-slide {
  background: oklch(0.705 0.213 51.16);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: gap 0.3s ease, background 0.3s ease;
}`,
},

{
  id: "ferrum-btn-border-draw",
  name: "Border Draw",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-border-draw", "border"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-border-draw {
  position: relative;
  background: transparent;
  color: oklch(0.696 0.149 162.48);
  border: 2px solid transparent;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  z-index: 1;
}`,
},

{
  id: "ferrum-btn-border-glow",
  name: "Border Glow",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-border-glow", "border"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-border-glow {
  background: oklch(0.27 0.04 260.03);
  color: oklch(0.699 0.118 184.7);
  border: 2px solid color-mix(in oklch, oklch(0.699 0.118 184.7) 35%, transparent);
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}`,
},

{
  id: "ferrum-btn-bounce",
  name: "Bounce",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-bounce", "bounce"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-bounce {
  background: oklch(0.769 0.188 70.08);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}`,
},

{
  id: "ferrum-btn-expand",
  name: "Expand",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-expand", "expand"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-expand {
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0;
  transition: all 0.4s ease;
}`,
},

{
  id: "ferrum-btn-fill-slide",
  name: "Fill Slide",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-fill-slide", "fill"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-fill-slide {
  position: relative;
  overflow: hidden;
  z-index: 1;
  background: transparent;
  color: oklch(0.696 0.149 162.48);
  border: 2px solid oklch(0.696 0.149 162.48);
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: color 0.4s ease;
}`,
},

{
  id: "ferrum-btn-flip",
  name: "Flip",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-flip", "flip", "3d"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-flip {
  background: oklch(0.652 0.241 354.31);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transform-style: preserve-3d;
  transition: transform 0.6s ease, background 0.3s ease;
}`,
},

{
  id: "ferrum-btn-glow",
  name: "Glow",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-glow", "glow"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-glow {
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}`,
},

{
  id: "ferrum-btn-gradient",
  name: "Gradient",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-gradient", "gradient", "animated"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-gradient {
  background: linear-gradient(45deg, oklch(0.696 0.149 162.48), oklch(0.685 0.131 226.94), oklch(0.566 0.245 278.69), oklch(0.652 0.241 354.31), oklch(0.696 0.149 162.48));
  background-size: 300% 300%;
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  animation: roy-btn-gradient 5s ease infinite;
  transition: transform 0.3s ease;
}

@keyframes roy-btn-gradient {

  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }

}`,
},

{
  id: "ferrum-btn-icon-slide",
  name: "Icon Slide",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-icon-slide", "icon"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-icon-slide {
  background: oklch(0.66 0.235 323.04);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 0;
  transition: padding 0.3s ease, gap 0.3s ease;
}`,
},

{
  id: "ferrum-btn-lift",
  name: "Lift",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-lift", "lift"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-lift {
  background: oklch(0.699 0.118 184.7);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 10px color-mix(in oklch, oklch(0.699 0.118 184.7) 25%, transparent);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}`,
},

{
  id: "ferrum-btn-liquid",
  name: "Liquid",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-liquid", "liquid"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-liquid {
  background: oklch(0.685 0.131 226.94);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: border-radius 0.4s ease, background 0.4s ease;
}`,
},

{
  id: "ferrum-btn-morph",
  name: "Morph",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-morph", "morph"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-morph {
  background: oklch(0.566 0.245 278.69);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}`,
},

{
  id: "ferrum-btn-neon",
  name: "Neon",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-neon", "neon"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-neon {
  background: oklch(0.145 0.0 89.88);
  color: oklch(0.685 0.131 226.94);
  border: 2px solid oklch(0.685 0.131 226.94);
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 0 5px oklch(0.685 0.131 226.94), inset 0 0 5px color-mix(in oklch, oklch(0.685 0.131 226.94) 40%, transparent);
  text-shadow: 0 0 5px oklch(0.685 0.131 226.94);
  transition: all 0.3s ease;
}`,
},

{
  id: "ferrum-btn-outline-fill",
  name: "Outline Fill",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-outline-fill", "outline"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-outline-fill {
  position: relative;
  background: transparent;
  color: oklch(0.645 0.246 16.44);
  border: 2px solid oklch(0.645 0.246 16.44);
  padding: 10px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  z-index: 1;
  transition: color 0.4s ease;
}`,
},

{
  id: "ferrum-btn-press",
  name: "Press",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-press", "press"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-press {
  background: oklch(0.566 0.245 278.69);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 6px 0 oklch(0.491 0.241 292.58), 0 8px 14px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}`,
},

{
  id: "ferrum-btn-pulse",
  name: "Pulse",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-pulse", "pulse"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-pulse {
  background: oklch(0.637 0.237 25.77);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.3s ease;
}`,
},

{
  id: "ferrum-btn-ripple",
  name: "Ripple",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-ripple", "ripple"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-ripple {
  position: relative;
  overflow: hidden;
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}`,
},

{
  id: "ferrum-btn-rotate",
  name: "Rotate",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-rotate", "rotate"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-rotate {
  background: oklch(0.769 0.188 70.08);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.3s ease, background 0.3s ease;
}`,
},

{
  id: "ferrum-btn-shadow-push",
  name: "Shadow Push",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-shadow-push", "shadow"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-shadow-push {
  background: oklch(0.637 0.237 25.77);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 5px 5px 0 oklch(0.396 0.133 25.72);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}`,
},

{
  id: "ferrum-btn-shine-sweep",
  name: "Shine Sweep",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-shine-sweep", "shine"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-shine-sweep {
  position: relative;
  overflow: hidden;
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}`,
},

{
  id: "ferrum-btn-skew",
  name: "Skew",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-skew", "skew"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-skew {
  background: oklch(0.652 0.241 354.31);
  color: oklch(1 0 0);
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.3s ease, background 0.3s ease;
}`,
},

{
  id: "ferrum-btn-slide-bg",
  name: "Slide Bg",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-slide-bg", "slide"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-slide-bg {
  position: relative;
  overflow: hidden;
  background: oklch(0.21 0.034 264.67);
  color: oklch(0.769 0.188 70.08);
  border: 2px solid oklch(0.769 0.188 70.08);
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  z-index: 1;
  transition: color 0.4s ease;
}`,
},

{
  id: "ferrum-btn-sparkle",
  name: "Sparkle",
  category: "buttons",
  description: "A button effect with interactive feedback on hover or click",
  tags: ["button", "interactive", "btn-sparkle", "sparkle"],
  previewType: "button",
  cssCode: `.roycss-ferrum-btn-sparkle {
  position: relative;
  background: oklch(0.27 0.04 260.03);
  color: oklch(0.924 0.115 95.75);
  border: 1px solid oklch(0.769 0.188 70.08);
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: color 0.3s ease, box-shadow 0.3s ease;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // CARDS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-card-flip",
  name: "Flip",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-flip", "flip", "3d"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-flip {
  perspective: 1000px;
  width: 200px;
  height: 120px;
}`,
},

{
  id: "ferrum-card-flip-back",
  name: "Flip Back",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-flip-back", "flip"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-flip-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}`,
},

{
  id: "ferrum-card-flip-inner",
  name: "Flip Inner",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-flip-inner", "flip", "3d"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}`,
},

{
  id: "ferrum-card-glassmorphism",
  name: "Glassmorphism",
  category: "cards",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["card", "container", "card-glassmorphism", "glassmorphism"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-glassmorphism {
  background: color-mix(in oklch, oklch(1 0 0) 8%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 15%, transparent);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
  color: oklch(0.968 0.007 247.9);
}`,
},

{
  id: "ferrum-card-gradient-border",
  name: "Gradient Border",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-gradient-border", "gradient"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-gradient-border {
  position: relative;
  background: oklch(0.21 0.034 264.67);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
}`,
},

{
  id: "ferrum-card-hover-border",
  name: "Hover Border",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-border", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-border {
  position: relative;
  background: oklch(0.27 0.04 260.03);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
}`,
},

{
  id: "ferrum-card-hover-color",
  name: "Hover Color",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-color", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-color {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: background 0.5s ease, color 0.5s ease, border-color 0.5s ease;
}`,
},

{
  id: "ferrum-card-hover-fade",
  name: "Hover Fade",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-fade", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-fade {
  position: relative;
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  overflow: hidden;
}`,
},

{
  id: "ferrum-card-hover-flip",
  name: "Hover Flip",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-flip", "hover", "3d"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-flip {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transform-style: preserve-3d;
  transition: transform 0.7s ease, background 0.4s ease, color 0.4s ease;
}`,
},

{
  id: "ferrum-card-hover-glow",
  name: "Hover Glow",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-glow", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-glow {
  background: oklch(0.21 0.034 264.67);
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
}`,
},

{
  id: "ferrum-card-hover-lift",
  name: "Hover Lift",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-lift", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-lift {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}`,
},

{
  id: "ferrum-card-hover-press",
  name: "Hover Press",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-press", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-press {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  box-shadow: 0 12px 22px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}`,
},

{
  id: "ferrum-card-hover-push",
  name: "Hover Push",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-push", "hover", "3d"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-push {
  position: relative;
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transform-style: preserve-3d;
  transition: transform 0.35s ease;
}`,
},

{
  id: "ferrum-card-hover-reveal",
  name: "Hover Reveal",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-reveal", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-reveal {
  position: relative;
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  overflow: hidden;
}`,
},

{
  id: "ferrum-card-hover-rotate",
  name: "Hover Rotate",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-rotate", "hover", "3d"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-rotate {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  perspective: 800px;
  transform-style: preserve-3d;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}`,
},

{
  id: "ferrum-card-hover-skew",
  name: "Hover Skew",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-skew", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-skew {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.35s ease, background 0.35s ease, color 0.35s ease;
}`,
},

{
  id: "ferrum-card-hover-slide",
  name: "Hover Slide",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-slide", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-slide {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}`,
},

{
  id: "ferrum-card-hover-swing",
  name: "Hover Swing",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-swing", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-swing {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transform-origin: top center;
  transition: transform 0.3s ease;
}`,
},

{
  id: "ferrum-card-hover-tada",
  name: "Hover Tada",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-tada", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-tada {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.3s ease;
}`,
},

{
  id: "ferrum-card-hover-wobble",
  name: "Hover Wobble",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-wobble", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-wobble {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.3s ease;
}`,
},

{
  id: "ferrum-card-hover-zoom",
  name: "Hover Zoom",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-hover-zoom", "hover"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-hover-zoom {
  background: linear-gradient(135deg, oklch(0.386 0.059 188.42), oklch(0.27 0.04 260.03));
  border: 1px solid color-mix(in oklch, oklch(0.699 0.118 184.7) 25%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.953 0.05 180.8);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}`,
},

{
  id: "ferrum-card-neon",
  name: "Neon",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-neon", "neon", "animated"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-neon {
  background: oklch(0.21 0.034 264.67);
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.95 0.051 163.05);
  animation: roy-card-neon 2s ease-in-out infinite alternate;
}

@keyframes roy-card-neon {

  from {
    box-shadow: 0 0 5px color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent), inset 0 0 5px color-mix(in oklch, oklch(0.696 0.149 162.48) 5%, transparent);
  }
  to {
    box-shadow: 0 0 22px color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent), 0 0 44px color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent), inset 0 0 22px color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  }

}`,
},

{
  id: "ferrum-card-shuffle",
  name: "Shuffle",
  category: "cards",
  description: "A card-style container with interactive or animated surface treatment",
  tags: ["card", "container", "card-shuffle", "shuffle", "3d"],
  previewType: "card",
  cssCode: `.roycss-ferrum-card-shuffle {
  position: relative;
  width: 200px;
  height: 220px;
  perspective: 1000px;
}`,
},

];
