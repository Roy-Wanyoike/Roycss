import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 29 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch29: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-fortune-teller",
  name: "Fortune Teller",
  category: "animations",
  description: "A fortune teller effect",
  tags: ["fortune-teller", "teller"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fortune-teller {
  position: relative;
  width: 200px;
  height: 200px;
  background: transparent;
}`,
},

{
  id: "ferrum-head-shake",
  name: "Head Shake",
  category: "animations",
  description: "An animated motion effect (head shake)",
  tags: ["head-shake", "shake", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-head-shake {
  animation: roy-head-shake 1s ease-in-out;
}

@keyframes roy-head-shake {

  0%, 100% { transform: translateX(0); }
  6.5% { transform: translateX(-6px) rotateY(-9deg); }
  18.5% { transform: translateX(5px) rotateY(7deg); }
  31.5% { transform: translateX(-3px) rotateY(-5deg); }
  43.5% { transform: translateX(2px) rotateY(3deg); }
  50% { transform: translateX(0); }

}`,
},

{
  id: "ferrum-jack-in-box",
  name: "Jack In Box",
  category: "animations",
  description: "An animated motion effect (jack in box)",
  tags: ["jack-in-box", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-jack-in-box {
  animation: roy-jack-in-box 1s ease both;
}

@keyframes roy-jack-in-box {

  from {
    opacity: 0;
    transform: scale(0.1) rotate(30deg);
    transform-origin: center bottom;
  }
  50% {
    transform: rotate(-10deg);
  }
  70% {
    transform: rotate(3deg);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }

}`,
},

{
  id: "ferrum-jiggle",
  name: "Jiggle",
  category: "animations",
  description: "An animated motion effect (jiggle)",
  tags: ["jiggle", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-jiggle {
  animation: roy-jiggle 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
  transform-origin: center;
}

@keyframes roy-jiggle {

  0%, 100% { transform: rotate(0deg); }
  20%      { transform: rotate(-7deg); }
  40%      { transform: rotate(6deg); }
  60%      { transform: rotate(-4deg); }
  80%      { transform: rotate(3deg); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // FORMS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-form-label-float",
  name: "Label Float",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["form", "input", "form-label-float", "label"],
  previewType: "box",
  cssCode: `.roycss-ferrum-form-label-float {
  position: relative;
  width: 170px;
  height: 48px;
  background: color-mix(in oklch, oklch(1 0 0) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 18%, transparent);
  border-radius: 10px;
  transition: all 0.3s ease;
}`,
},

{
  id: "ferrum-form-placeholder-shimmer",
  name: "Placeholder Shimmer",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["form", "input", "form-placeholder-shimmer", "placeholder"],
  previewType: "box",
  cssCode: `.roycss-ferrum-form-placeholder-shimmer {
  position: relative;
  width: 180px;
  height: 40px;
  padding: 0 14px;
  background: color-mix(in oklch, oklch(1 0 0) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 18%, transparent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  overflow: hidden;
}`,
},

{
  id: "ferrum-form-radio-custom",
  name: "Radio Custom",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["form", "input", "form-radio-custom", "radio"],
  previewType: "box",
  cssCode: `.roycss-ferrum-form-radio-custom {
  position: relative;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}`,
},

{
  id: "ferrum-form-search-expand",
  name: "Search Expand",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["form", "input", "form-search-expand", "search"],
  previewType: "box",
  cssCode: `.roycss-ferrum-form-search-expand {
  position: relative;
  width: 56px;
  height: 40px;
  background: color-mix(in oklch, oklch(1 0 0) 5%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 18%, transparent);
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  font: 12px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 0) 60%, transparent);
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.4s ease;
}`,
},

{
  id: "ferrum-form-success-check",
  name: "Success Check",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["form", "input", "form-success-check", "success"],
  previewType: "box",
  cssCode: `.roycss-ferrum-form-success-check {
  position: relative;
  width: 160px;
  height: 40px;
  padding: 0 14px 0 38px;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  border: 1px solid oklch(0.696 0.149 162.48);
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  color: oklch(0.826 0.124 162.48);
}`,
},

{
  id: "ferrum-form-toggle-switch",
  name: "Toggle Switch",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["form", "input", "form-toggle-switch", "toggle"],
  previewType: "box",
  cssCode: `.roycss-ferrum-form-toggle-switch {
  position: relative;
  width: 54px;
  height: 28px;
  background: color-mix(in oklch, oklch(1 0 0) 8%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 20%, transparent);
  border-radius: 14px;
  transition: background 0.3s ease, border-color 0.3s ease;
}`,
},

{
  id: "ferrum-form-underline-draw",
  name: "Underline Draw",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["form", "input", "form-underline-draw", "underline"],
  previewType: "box",
  cssCode: `.roycss-ferrum-form-underline-draw {
  position: relative;
  width: 180px;
  height: 40px;
  padding: 0 4px;
  background: transparent;
  border: none;
  border-bottom: 2px solid color-mix(in oklch, oklch(1 0 0) 18%, transparent);
  display: flex;
  align-items: center;
  font: 13px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 0) 70%, transparent);
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // GLASS-UI
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-glass-acrylic",
  name: "Acrylic",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-acrylic", "acrylic"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-acrylic {
  background: color-mix(in oklch, oklch(0.975 0.005 258.32) 65%, transparent);
  backdrop-filter: blur(30px) saturate(140%);
  -webkit-backdrop-filter: blur(30px) saturate(140%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 50%, transparent);
  border-radius: 12px;
  box-shadow: 0 2px 8px color-mix(in oklch, oklch(0 0 0) 8%, transparent), inset 0 0 0 1px color-mix(in oklch, oklch(1 0 0) 20%, transparent);
}`,
},

{
  id: "ferrum-glass-border-glow",
  name: "Border Glow",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-border-glow", "border", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-border-glow {
  position: relative;
  background: color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 20%, transparent);
  border-radius: 16px;
  animation: roy-glass-border-pulse 3s ease-in-out infinite alternate;
}

@keyframes roy-glass-border-pulse {

  0%   { box-shadow: 0 0 0 1px color-mix(in oklch, oklch(0.889 0.177 169.75) 40%, transparent), 0 0 16px color-mix(in oklch, oklch(0.889 0.177 169.75) 35%, transparent), 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent); }
  100% { box-shadow: 0 0 0 1px color-mix(in oklch, oklch(0.73 0.16 237.36) 60%, transparent), 0 0 30px color-mix(in oklch, oklch(0.73 0.16 237.36) 60%, transparent), 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent); }

}`,
},

{
  id: "ferrum-glass-claymorphism",
  name: "Claymorphism",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-claymorphism", "claymorphism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-claymorphism {
  background: linear-gradient(145deg, oklch(0.974 0.013 347.94), oklch(0.899 0.059 343.23));
  border-radius: 28px;
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 60%, transparent);
  box-shadow:
    8px 8px 16px color-mix(in oklch, oklch(0.525 0.199 3.96) 18%, transparent),
    -4px -4px 12px color-mix(in oklch, oklch(1 0 0) 90%, transparent),
    inset 2px 2px 4px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    inset -2px -2px 6px color-mix(in oklch, oklch(0.525 0.199 3.96) 12%, transparent);
}`,
},

{
  id: "ferrum-glass-depth-layer",
  name: "Depth Layer",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-depth-layer", "depth"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-depth-layer {
  position: relative;
  background: color-mix(in oklch, oklch(1 0 0) 18%, transparent);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 30%, transparent);
  border-radius: 18px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 0) 50%, transparent) inset,
    0 -1px 0 color-mix(in oklch, oklch(0 0 0) 5%, transparent) inset,
    0 2px 4px color-mix(in oklch, oklch(0 0 0) 8%, transparent),
    0 8px 16px color-mix(in oklch, oklch(0 0 0) 12%, transparent),
    0 20px 40px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  color: oklch(0.232 0.004 286.1);
}`,
},

{
  id: "ferrum-glass-frosted",
  name: "Frosted",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-frosted", "frosted"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-frosted {
  background: color-mix(in oklch, oklch(1 0 0) 12%, transparent);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 20%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 0) 30%, transparent);
}`,
},

{
  id: "ferrum-glass-frosted-dark",
  name: "Frosted Dark",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-frosted-dark", "frosted"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-frosted-dark {
  background: color-mix(in oklch, oklch(0.199 0.03 283.36) 55%, transparent);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 8%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 40%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 0) 10%, transparent);
}`,
},

{
  id: "ferrum-glass-liquid",
  name: "Liquid",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-liquid", "liquid", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-liquid {
  background: color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  backdrop-filter: blur(8px) brightness(1.1) contrast(1.05) hue-rotate(15deg);
  -webkit-backdrop-filter: blur(8px) brightness(1.1) contrast(1.05) hue-rotate(15deg);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 30%, transparent);
  border-radius: 24px;
  box-shadow: inset 0 2px 6px color-mix(in oklch, oklch(1 0 0) 40%, transparent),
              inset 0 -2px 6px color-mix(in oklch, oklch(0 0 0) 10%, transparent),
              0 10px 30px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  animation: roy-glass-liquid-refract 6s ease-in-out infinite alternate;
}

@keyframes roy-glass-liquid-refract {

  0%   { backdrop-filter: blur(8px) brightness(1.1) contrast(1.05) hue-rotate(0deg); }
  100% { backdrop-filter: blur(14px) brightness(1.15) contrast(1.1) hue-rotate(25deg); }

}`,
},

{
  id: "ferrum-glass-neumorphism",
  name: "Neumorphism",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-neumorphism", "neumorphism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-neumorphism {
  background: oklch(0.92 0.011 256.7);
  border-radius: 16px;
  box-shadow: 8px 8px 16px oklch(0.794 0.01 258.34), -8px -8px 16px oklch(1 0 0);
}`,
},

{
  id: "ferrum-glass-neumorphism-inset",
  name: "Neumorphism Inset",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-neumorphism-inset", "neumorphism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-neumorphism-inset {
  background: oklch(0.92 0.011 256.7);
  border-radius: 16px;
  box-shadow: inset 6px 6px 12px oklch(0.794 0.01 258.34), inset -6px -6px 12px oklch(1 0 0);
}`,
},

{
  id: "ferrum-glass-noise-overlay",
  name: "Noise Overlay",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-noise-overlay", "noise"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-noise-overlay {
  position: relative;
  background: color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 15%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent);
}`,
},

{
  id: "ferrum-glass-prism",
  name: "Prism",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-prism", "prism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-prism {
  position: relative;
  background: color-mix(in oklch, oklch(1 0 0) 15%, transparent);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-radius: 16px;
  color: oklch(1 0 0);
}`,
},

{
  id: "ferrum-glass-reflection",
  name: "Reflection",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-reflection", "reflection"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-reflection {
  position: relative;
  overflow: hidden;
  background: color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 20%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 12%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 0) 30%, transparent);
}`,
},

{
  id: "ferrum-glass-transparent-blur",
  name: "Transparent Blur",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-transparent-blur", "transparent"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-transparent-blur {
  background: color-mix(in oklch, oklch(1 0 0) 5%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 10px;
  box-shadow: 0 4px 16px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
}`,
},

{
  id: "ferrum-glass-vibrant",
  name: "Vibrant",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["glass", "glassmorphism", "glass-vibrant", "vibrant"],
  previewType: "box",
  cssCode: `.roycss-ferrum-glass-vibrant {
  background: linear-gradient(135deg, color-mix(in oklch, oklch(0.627 0.233 303.9) 28%, transparent), color-mix(in oklch, oklch(0.652 0.241 354.31) 28%, transparent));
  backdrop-filter: blur(16px) saturate(220%) brightness(1.1);
  -webkit-backdrop-filter: blur(16px) saturate(220%) brightness(1.1);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 25%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0.627 0.233 303.9) 30%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 0) 35%, transparent);
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // HOVER
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-hover-border-draw",
  name: "Border Draw",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-border-draw", "border"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-border-draw {
  position: relative;
  box-sizing: border-box;
}`,
},

{
  id: "ferrum-hover-color-shift",
  name: "Color Shift",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-color-shift", "color"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-color-shift {
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.596 0.127 163.23));
  transition: all 0.4s ease;
  background-size: 200% 200%;
  background-position: 0% 50%;
}`,
},

{
  id: "ferrum-hover-depth",
  name: "Depth",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-depth", "depth"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-depth {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.4s ease;
  box-shadow: 0 1px 2px color-mix(in oklch, oklch(0 0 0) 8%, transparent),
              0 2px 4px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
}`,
},

{
  id: "ferrum-hover-drop-shadow",
  name: "Drop Shadow",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-drop-shadow", "drop"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-drop-shadow {
  transition: filter 0.35s ease, transform 0.35s ease;
}`,
},

{
  id: "ferrum-hover-fade-overlay",
  name: "Fade Overlay",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-fade-overlay", "fade"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-fade-overlay {
  position: relative;
  isolation: isolate;
}`,
},

{
  id: "ferrum-hover-glow-border",
  name: "Glow Border",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-glow-border", "glow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-glow-border {
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  transition: all 0.3s ease;
}`,
},

{
  id: "ferrum-hover-grayscale-to-color",
  name: "Grayscale To Color",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-grayscale-to-color", "grayscale"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-grayscale-to-color {
  filter: grayscale(100%);
  transition: filter 0.5s ease;
}`,
},

{
  id: "ferrum-hover-hue-rotate",
  name: "Hue Rotate",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-hue-rotate", "hue"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-hue-rotate {
  transition: filter 0.3s ease;
}`,
},

{
  id: "ferrum-hover-neon-flicker",
  name: "Neon Flicker",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-neon-flicker", "neon"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-neon-flicker {
  transition: box-shadow 0.2s ease;
}`,
},

{
  id: "ferrum-hover-opacity",
  name: "Opacity",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-opacity", "opacity"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-opacity {
  transition: opacity 0.3s ease;
}`,
},

{
  id: "ferrum-hover-overlay-reveal",
  name: "Overlay Reveal",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-overlay-reveal", "overlay"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-overlay-reveal {
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}`,
},

{
  id: "ferrum-hover-press",
  name: "Press",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-press", "press"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-press {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 6px 0 oklch(0.508 0.105 165.61), 0 8px 14px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}`,
},

{
  id: "ferrum-hover-push-up",
  name: "Push Up",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-push-up", "push"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-push-up {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}`,
},

{
  id: "ferrum-hover-scale",
  name: "Scale",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-scale", "scale"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-scale {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}`,
},

{
  id: "ferrum-hover-shadow-grow",
  name: "Shadow Grow",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-shadow-grow", "shadow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-shadow-grow {
  transition: transform 0.3s ease,
              box-shadow 0.3s ease;
  box-shadow: 0 2px 4px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
}`,
},

{
  id: "ferrum-hover-slide-overlay",
  name: "Slide Overlay",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-slide-overlay", "slide"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-slide-overlay {
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}`,
},

{
  id: "ferrum-hover-tilt-rotate",
  name: "Tilt Rotate",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-tilt-rotate", "tilt", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-tilt-rotate {
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
  perspective: 1000px;
}`,
},

{
  id: "ferrum-hover-underline-slide",
  name: "Underline Slide",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-underline-slide", "underline"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-underline-slide {
  position: relative;
  display: inline-block;
  text-decoration: none;
}`,
},

{
  id: "ferrum-hover-zoom-blur",
  name: "Zoom Blur",
  category: "hover",
  description: "A hover-triggered effect that responds to pointer interaction",
  tags: ["hover", "interactive", "hover-zoom-blur", "zoom"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hover-zoom-blur {
  transition: transform 0.4s ease, filter 0.4s ease;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-frozen-ice",
  name: "Frozen Ice",
  category: "visual",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["frozen-ice", "ice", "glassmorphism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-frozen-ice {
  position: relative;
  width: 200px;
  height: 160px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(ellipse 50% 40% at 25% 20%, color-mix(in oklch, oklch(1 0 0) 70%, transparent), transparent 60%),
    radial-gradient(ellipse 40% 30% at 75% 75%, color-mix(in oklch, oklch(0.839 0.088 241.5) 50%, transparent), transparent 60%),
    linear-gradient(135deg, oklch(0.927 0.029 230.3) 0%, oklch(0.847 0.057 232.14) 35%, oklch(0.704 0.076 233.95) 70%, oklch(0.917 0.032 230.27) 100%);
  box-shadow:
    inset 8px 12px 25px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    inset -8px -12px 25px color-mix(in oklch, oklch(0.458 0.098 250.82) 40%, transparent),
    0 10px 30px color-mix(in oklch, oklch(0.616 0.087 239.49) 40%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 70%, transparent);
  backdrop-filter: blur(2px);
}`,
},

{
  id: "ferrum-gold-leaf",
  name: "Gold Leaf",
  category: "visual",
  description: "An animated motion effect (gold leaf)",
  tags: ["gold-leaf", "leaf", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-gold-leaf {
  position: relative;
  width: 200px;
  height: 160px;
  border-radius: 8px;
  background:
    radial-gradient(ellipse 30% 25% at 20% 25%, oklch(0.973 0.051 97.64), transparent 55%),
    radial-gradient(ellipse 25% 20% at 75% 70%, oklch(0.7 0.137 82.62), transparent 60%),
    radial-gradient(ellipse 20% 18% at 65% 30%, oklch(0.932 0.118 96.68), transparent 55%),
    radial-gradient(ellipse 28% 22% at 30% 75%, oklch(0.645 0.127 77.49), transparent 60%),
    linear-gradient(115deg,
      oklch(0.645 0.127 77.49) 0%,
      oklch(0.958 0.086 99.2) 12%,
      oklch(0.735 0.146 84.27) 28%,
      oklch(0.932 0.118 96.68) 42%,
      oklch(0.602 0.12 77.51) 58%,
      oklch(0.958 0.086 99.2) 72%,
      oklch(0.7 0.137 82.62) 88%,
      oklch(0.51 0.104 70.73) 100%);
  background-size: 220% 220%, 200% 200%, 200% 200%, 200% 200%, 200% 200%;
  box-shadow:
    inset 0 0 20px color-mix(in oklch, oklch(0 0 0) 25%, transparent),
    inset 6px 8px 14px color-mix(in oklch, oklch(0.967 0.059 96.92) 40%, transparent),
    0 8px 22px color-mix(in oklch, oklch(0.345 0.074 72.83) 40%, transparent);
  filter: contrast(1.1) saturate(1.2);
  animation: roy-b11-gold-leaf-shimmer 6s ease-in-out infinite;
}

@keyframes roy-b11-gold-leaf-shimmer {

  0%, 100% { background-position: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%; }
  50%      { background-position: 100% 100%, 50% 50%, 80% 30%, 30% 70%, 50% 50%; }

}`,
},

{
  id: "ferrum-heat-haze",
  name: "Heat Haze",
  category: "visual",
  description: "A heat haze effect",
  tags: ["heat-haze", "haze"],
  previewType: "box",
  cssCode: `.roycss-ferrum-heat-haze {
  position: relative;
  width: 220px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(180deg, oklch(0.815 0.082 225.75) 0%, oklch(0.901 0.089 78.42) 60%, oklch(0.705 0.193 39.23) 100%);
}`,
},

{
  id: "ferrum-kaleidoscope",
  name: "Kaleidoscope",
  category: "visual",
  description: "A kaleidoscope effect",
  tags: ["kaleidoscope"],
  previewType: "box",
  cssCode: `.roycss-ferrum-kaleidoscope {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  background: oklch(0 0 0);
  box-shadow: 0 0 0 6px oklch(0.541 0.104 84.45), 0 12px 30px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}`,
},

{
  id: "ferrum-linear-aurora-glow",
  name: "Linear Aurora Glow",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear aurora glow)",
  tags: ["linear-aurora-glow", "aurora"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-aurora-glow {
  position: relative;
  background: oklch(0.145 0.002 286.13);
  overflow: hidden;
}`,
},

{
  id: "ferrum-linear-card-lift",
  name: "Linear Card Lift",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear card lift)",
  tags: ["linear-card-lift", "card"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-card-lift {
  background: oklch(0.21 0.006 285.89);
  color: oklch(0.985 0.0 89.88);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 14px;
  box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.567 0.159 275.21) 0%, transparent);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.35s ease;
}`,
},

];
