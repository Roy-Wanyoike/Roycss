import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 31 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch31: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-natural-drop",
  name: "Natural Drop",
  category: "animations",
  description: "An animated motion effect (natural drop)",
  tags: ["natural-drop", "drop", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-natural-drop {
  animation: roy-natural-drop 1s cubic-bezier(0.45, 0, 0.55, 1) both;
}

@keyframes roy-natural-drop {

  0% { transform: translateY(-200%) scaleY(0.9); opacity: 0; }
  45% { transform: translateY(0) scaleY(1.1); opacity: 1; }
  55% { transform: translateY(0) scaleY(0.85); }
  65% { transform: translateY(-30%) scaleY(1.05); }
  80% { transform: translateY(0) scaleY(0.95); }
  90% { transform: translateY(-8%) scaleY(1.02); }
  100% { transform: translateY(0) scaleY(1); }

}`,
},

{
  id: "ferrum-origami-fold",
  name: "Origami Fold",
  category: "animations",
  description: "A origami fold effect",
  tags: ["origami-fold", "fold"],
  previewType: "box",
  cssCode: `.roycss-ferrum-origami-fold {
  position: relative;
  width: 200px;
  height: 180px;
  background: oklch(0.985 0.0 89.88);
  clip-path: polygon(
    50% 0%, 100% 35%, 75% 100%, 25% 100%, 0% 35%);
}`,
},

{
  id: "ferrum-paper-flip",
  name: "Paper Flip",
  category: "animations",
  description: "A 3D transform effect with perspective depth",
  tags: ["paper-flip", "flip", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-paper-flip {
  position: relative;
  width: 180px;
  height: 220px;
  perspective: 1200px;
  background: transparent;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // MICROINTERACTIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-micro-tooltip-appear",
  name: "Micro Tooltip Appear",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro tooltip appear)",
  tags: ["micro-tooltip-appear", "tooltip"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-tooltip-appear {
  position: relative;
  width: 130px;
  height: 70px;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // MISC
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-misc-hologram",
  name: "Misc Hologram",
  category: "misc",
  description: "A decorative visual effect (misc hologram)",
  tags: ["misc-hologram", "hologram", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-hologram {
  position: relative;
  width: 80px;
  height: 80px;
  background: linear-gradient(115deg,
    oklch(0.641 0.257 8.07) 0%, oklch(0.546 0.248 295.88) 25%, oklch(0.637 0.195 259.51) 50%, oklch(0.882 0.203 158.76) 75%, oklch(0.839 0.171 83.34) 100%);
  background-size: 400% 100%;
  border-radius: 16px;
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 30%, transparent);
  box-shadow: 0 0 22px color-mix(in oklch, oklch(0.546 0.248 295.88) 45%, transparent);
  animation: roy-misc-hologram 4s linear infinite;
}

@keyframes roy-misc-hologram {

  0%   { background-position: 0% 0%; }
  100% { background-position: 400% 0%; }

}`,
},

{
  id: "ferrum-misc-pulse-ring-expand",
  name: "Misc Pulse Ring Expand",
  category: "misc",
  description: "A decorative visual effect (misc pulse ring expand)",
  tags: ["misc-pulse-ring-expand", "pulse"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-pulse-ring-expand {
  position: relative;
  width: 80px;
  height: 80px;
  background: transparent;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}`,
},

{
  id: "ferrum-misc-ripple-click",
  name: "Misc Ripple Click",
  category: "misc",
  description: "A decorative visual effect (misc ripple click)",
  tags: ["misc-ripple-click", "ripple"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-ripple-click {
  position: relative;
  width: 80px;
  height: 80px;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
}`,
},

{
  id: "ferrum-misc-scan-line",
  name: "Misc Scan Line",
  category: "misc",
  description: "A decorative visual effect (misc scan line)",
  tags: ["misc-scan-line", "scan"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-scan-line {
  position: relative;
  background:
    repeating-linear-gradient(0deg, color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent) 0 2px, transparent 2px 4px),
    linear-gradient(180deg, oklch(0.201 0.025 167.64), oklch(0.258 0.029 172.78));
  overflow: hidden;
}`,
},

{
  id: "ferrum-misc-shimmer-overlay",
  name: "Misc Shimmer Overlay",
  category: "misc",
  description: "A decorative visual effect (misc shimmer overlay)",
  tags: ["misc-shimmer-overlay", "shimmer"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-shimmer-overlay {
  position: relative;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.769 0.154 162.48));
  border-radius: 16px;
  overflow: hidden;
}`,
},

{
  id: "ferrum-misc-typewriter",
  name: "Misc Typewriter",
  category: "misc",
  description: "A decorative visual effect (misc typewriter)",
  tags: ["misc-typewriter", "typewriter", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-typewriter {
  display: inline-block;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: oklch(0.696 0.149 162.48);
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid oklch(0.696 0.149 162.48);
  width: 0;
  animation:
    roy-misc-typewriter-type 2.5s steps(6) infinite,
    roy-misc-typewriter-cursor 0.6s step-end infinite;
}`,
},

{
  id: "ferrum-misc-vhs-effect",
  name: "Misc Vhs Effect",
  category: "misc",
  description: "A decorative visual effect (misc vhs effect)",
  tags: ["misc-vhs-effect", "vhs"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-vhs-effect {
  position: relative;
  background:
    repeating-linear-gradient(0deg, color-mix(in oklch, oklch(0 0 0) 18%, transparent) 0 2px, transparent 2px 4px),
    linear-gradient(135deg, oklch(0.236 0.106 304.47), oklch(0.468 0.154 296.01));
  overflow: hidden;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-nav-accordion",
  name: "Accordion",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["navigation", "menu", "nav-accordion", "accordion"],
  previewType: "box",
  cssCode: `.roycss-ferrum-nav-accordion {
  position: relative;
  width: 180px;
  height: 34px;
  background: color-mix(in oklch, oklch(1 0 0) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 12%, transparent);
  border-radius: 8px;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 0) 80%, transparent);
  overflow: hidden;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.3s ease;
}`,
},

{
  id: "ferrum-nav-breadcrumb",
  name: "Breadcrumb",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["navigation", "menu", "nav-breadcrumb", "breadcrumb"],
  previewType: "box",
  cssCode: `.roycss-ferrum-nav-breadcrumb {
  position: relative;
  width: 240px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 11px/1 system-ui, sans-serif;
  letter-spacing: 0.05em;
}`,
},

{
  id: "ferrum-nav-dropdown",
  name: "Dropdown",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["navigation", "menu", "nav-dropdown", "dropdown"],
  previewType: "box",
  cssCode: `.roycss-ferrum-nav-dropdown {
  position: relative;
  width: 180px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: color-mix(in oklch, oklch(1 0 0) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 12%, transparent);
  border-radius: 8px;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 0) 80%, transparent);
  overflow: hidden;
  transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.3s ease;
}`,
},

{
  id: "ferrum-nav-menu-fade",
  name: "Menu Fade",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["navigation", "menu", "nav-menu-fade"],
  previewType: "box",
  cssCode: `.roycss-ferrum-nav-menu-fade {
  position: relative;
  width: 220px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, oklch(1 0 0) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 10px;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 0) 70%, transparent);
  overflow: hidden;
  letter-spacing: 0.15em;
}`,
},

{
  id: "ferrum-nav-menu-scale",
  name: "Menu Scale",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["navigation", "menu", "nav-menu-scale"],
  previewType: "box",
  cssCode: `.roycss-ferrum-nav-menu-scale {
  position: relative;
  width: 220px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, oklch(1 0 0) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 10px;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 0) 70%, transparent);
  letter-spacing: 0.15em;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}`,
},

{
  id: "ferrum-nav-menu-slide",
  name: "Menu Slide",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["navigation", "menu", "nav-menu-slide"],
  previewType: "box",
  cssCode: `.roycss-ferrum-nav-menu-slide {
  position: relative;
  width: 220px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, oklch(1 0 0) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 10px;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 0) 70%, transparent);
  overflow: hidden;
  letter-spacing: 0.15em;
}`,
},

{
  id: "ferrum-nav-pagination",
  name: "Pagination",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["navigation", "menu", "nav-pagination", "pagination"],
  previewType: "box",
  cssCode: `.roycss-ferrum-nav-pagination {
  position: relative;
  width: 200px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 0) 60%, transparent);
  letter-spacing: 0.3em;
}`,
},

{
  id: "ferrum-nav-progress-indicator",
  name: "Progress Indicator",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["navigation", "menu", "nav-progress-indicator", "progress"],
  previewType: "box",
  cssCode: `.roycss-ferrum-nav-progress-indicator {
  position: relative;
  width: 120px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}`,
},

{
  id: "ferrum-nav-stepper",
  name: "Stepper",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["navigation", "menu", "nav-stepper", "stepper"],
  previewType: "box",
  cssCode: `.roycss-ferrum-nav-stepper {
  position: relative;
  width: 220px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}`,
},

{
  id: "ferrum-nav-tabs-underline",
  name: "Tabs Underline",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["navigation", "menu", "nav-tabs-underline", "tabs"],
  previewType: "box",
  cssCode: `.roycss-ferrum-nav-tabs-underline {
  position: relative;
  width: 200px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 0) 60%, transparent);
  letter-spacing: 0.12em;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // PAGE-TRANSITIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-page-circle-reveal",
  name: "Circle Reveal",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-circle-reveal", "circle"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-circle-reveal {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  overflow: hidden;
}`,
},

{
  id: "ferrum-page-cube",
  name: "Cube",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-cube", "cube", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-cube {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  overflow: hidden;
  perspective: 700px;
}`,
},

{
  id: "ferrum-page-curtain",
  name: "Curtain",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-curtain", "curtain"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-curtain {
  position: relative;
  background: linear-gradient(135deg, oklch(0.541 0.247 293.01), oklch(0.592 0.218 0.58));
  overflow: hidden;
}`,
},

{
  id: "ferrum-page-dissolve",
  name: "Dissolve",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-dissolve", "dissolve"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-dissolve {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  overflow: hidden;
}`,
},

{
  id: "ferrum-page-fade",
  name: "Fade",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-fade", "fade"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-fade {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  overflow: hidden;
}`,
},

{
  id: "ferrum-page-flip",
  name: "Flip",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-flip", "flip", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-flip {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  overflow: hidden;
  perspective: 800px;
}`,
},

{
  id: "ferrum-page-liquid",
  name: "Liquid",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-liquid", "liquid"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-liquid {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  overflow: hidden;
}`,
},

{
  id: "ferrum-page-mask-reveal",
  name: "Mask Reveal",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-mask-reveal", "mask"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-mask-reveal {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  overflow: hidden;
}`,
},

{
  id: "ferrum-page-shutter",
  name: "Shutter",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-shutter", "shutter"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-shutter {
  position: relative;
  background: linear-gradient(135deg, oklch(0.769 0.188 70.08), oklch(0.637 0.237 25.77));
  overflow: hidden;
}`,
},

{
  id: "ferrum-page-slide-left",
  name: "Slide Left",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-slide-left", "slide"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-slide-left {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  overflow: hidden;
}`,
},

{
  id: "ferrum-page-slide-up",
  name: "Slide Up",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-slide-up", "slide"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-slide-up {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  overflow: hidden;
}`,
},

{
  id: "ferrum-page-zoom",
  name: "Zoom",
  category: "page-transitions",
  description: "A full-page or view transition animation",
  tags: ["page", "transition", "page-zoom", "zoom"],
  previewType: "box",
  cssCode: `.roycss-ferrum-page-zoom {
  position: relative;
  background: linear-gradient(135deg, oklch(0.21 0.034 264.67), oklch(0.27 0.04 260.03));
  overflow: hidden;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // PARTICLES
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-misc-bubbles",
  name: "Misc Bubbles",
  category: "particles",
  description: "A decorative visual effect (misc bubbles)",
  tags: ["misc-bubbles", "bubbles", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-bubbles {
  background:
    radial-gradient(circle at 20% 100%, color-mix(in oklch, oklch(1 0 0) 70%, transparent) 0 4px, transparent 5px) 0 0 / 60px 60px,
    radial-gradient(circle at 50% 100%, color-mix(in oklch, oklch(1 0 0) 50%, transparent) 0 6px, transparent 7px) 0 0 / 80px 80px,
    radial-gradient(circle at 80% 100%, color-mix(in oklch, oklch(1 0 0) 60%, transparent) 0 3px, transparent 4px) 0 0 / 50px 50px,
    linear-gradient(180deg, oklch(0.616 0.104 219.93), oklch(0.82 0.102 214.8));
  background-repeat: repeat;
  animation: roy-misc-bubbles 4s linear infinite;
}

@keyframes roy-misc-bubbles {

  from { background-position: 0 0, 0 0, 0 0, 0 0; }
  to   { background-position: 0 -60px, 0 -80px, 0 -50px, 0 0; }

}`,
},

{
  id: "ferrum-misc-confetti",
  name: "Misc Confetti",
  category: "particles",
  description: "A decorative visual effect (misc confetti)",
  tags: ["misc-confetti", "confetti", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-confetti {
  background:
    radial-gradient(circle at 15% 0%, oklch(0.712 0.181 22.84) 0 3px, transparent 4px) 0 0 / 40px 40px,
    radial-gradient(circle at 45% 0%, oklch(0.864 0.143 84.36) 0 3px, transparent 4px) 0 0 / 55px 55px,
    radial-gradient(circle at 75% 0%, oklch(0.827 0.128 215.58) 0 3px, transparent 4px) 0 0 / 45px 45px,
    radial-gradient(circle at 30% 0%, oklch(0.767 0.15 168.19) 0 3px, transparent 4px) 0 0 / 60px 60px,
    radial-gradient(circle at 90% 0%, oklch(0.826 0.154 331.46) 0 3px, transparent 4px) 0 0 / 50px 50px,
    linear-gradient(135deg, oklch(0.228 0.038 282.93), oklch(0.254 0.057 266.71));
  background-repeat: repeat;
  animation: roy-misc-confetti 2.5s linear infinite;
}

@keyframes roy-misc-confetti {

  from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0; }
  to   { background-position: 0 40px, 0 55px, 0 45px, 0 60px, 0 50px, 0 0; }

}`,
},

{
  id: "ferrum-misc-fireflies",
  name: "Misc Fireflies",
  category: "particles",
  description: "A decorative visual effect (misc fireflies)",
  tags: ["misc-fireflies", "fireflies", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-fireflies {
  background:
    radial-gradient(circle at 20% 30%, color-mix(in oklch, oklch(0.943 0.162 124.78) 90%, transparent) 0 2px, transparent 5px) 0 0 / 100px 100px,
    radial-gradient(circle at 70% 60%, color-mix(in oklch, oklch(0.943 0.162 124.78) 70%, transparent) 0 2.5px, transparent 6px) 0 0 / 130px 130px,
    radial-gradient(circle at 40% 80%, color-mix(in oklch, oklch(0.943 0.162 124.78) 80%, transparent) 0 1.5px, transparent 4px) 0 0 / 90px 90px,
    linear-gradient(180deg, oklch(0.179 0.057 283.68), oklch(0.327 0.096 283.81), oklch(0.274 0.048 282.79));
  background-repeat: repeat;
  animation: roy-misc-fireflies 5s ease-in-out infinite alternate;
}

@keyframes roy-misc-fireflies {

  0%   { background-position: 0 0, 0 0, 0 0, 0 0; filter: brightness(0.6); }
  50%  { filter: brightness(1.5); }
  100% { background-position: 20px -15px, -25px 10px, 15px 20px, 0 0; filter: brightness(0.85); }

}`,
},

{
  id: "ferrum-misc-fireworks",
  name: "Misc Fireworks",
  category: "particles",
  description: "A decorative visual effect (misc fireworks)",
  tags: ["misc-fireworks", "fireworks"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-fireworks {
  position: relative;
  background: linear-gradient(180deg, oklch(0.163 0.051 279.14), oklch(0.255 0.093 277.48));
  overflow: hidden;
}`,
},

{
  id: "ferrum-misc-rain",
  name: "Misc Rain",
  category: "particles",
  description: "A decorative visual effect (misc rain)",
  tags: ["misc-rain", "rain", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-rain {
  background:
    linear-gradient(105deg, transparent 0 48%, color-mix(in oklch, oklch(0.809 0.048 258.37) 60%, transparent) 48% 50%, transparent 50% 100%) 0 0 / 15px 30px,
    linear-gradient(105deg, transparent 0 49%, color-mix(in oklch, oklch(0.809 0.048 258.37) 35%, transparent) 49% 50%, transparent 50% 100%) 0 0 / 25px 40px,
    linear-gradient(180deg, oklch(0.279 0.037 249.26), oklch(0.356 0.039 248.97));
  background-repeat: repeat;
  animation: roy-misc-rain 0.6s linear infinite;
}

@keyframes roy-misc-rain {

  from { background-position: 0 0, 0 0, 0 0; }
  to   { background-position: 5px 30px, 7px 40px, 0 0; }

}`,
},

{
  id: "ferrum-misc-snow",
  name: "Misc Snow",
  category: "particles",
  description: "A decorative visual effect (misc snow)",
  tags: ["misc-snow", "snow", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-snow {
  background:
    radial-gradient(circle at 10% 0%, oklch(1 0 0) 0 2px, transparent 3px) 0 0 / 30px 30px,
    radial-gradient(circle at 60% 0%, oklch(1 0 0) 0 1.5px, transparent 2px) 0 0 / 45px 45px,
    radial-gradient(circle at 80% 0%, oklch(1 0 0) 0 2.5px, transparent 3px) 0 0 / 35px 35px,
    radial-gradient(circle at 30% 0%, color-mix(in oklch, oklch(1 0 0) 70%, transparent) 0 1px, transparent 2px) 0 0 / 25px 25px,
    linear-gradient(180deg, oklch(0.232 0.026 226.41), oklch(0.332 0.036 222.19), oklch(0.421 0.052 228.22));
  background-repeat: repeat;
  animation: roy-misc-snow 3s linear infinite;
}

@keyframes roy-misc-snow {

  from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0; }
  to   { background-position: 5px 30px, -3px 45px, 2px 35px, -2px 25px, 0 0; }

}`,
},

{
  id: "ferrum-misc-sparkles",
  name: "Misc Sparkles",
  category: "particles",
  description: "A decorative visual effect (misc sparkles)",
  tags: ["misc-sparkles", "sparkles", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-sparkles {
  background:
    radial-gradient(circle at 15% 25%, oklch(1 0 0) 0 1px, transparent 2px) 0 0 / 50px 50px,
    radial-gradient(circle at 65% 75%, oklch(1 0 0) 0 1.5px, transparent 2.5px) 0 0 / 70px 70px,
    radial-gradient(circle at 85% 15%, oklch(1 0 0) 0 1px, transparent 2px) 0 0 / 40px 40px,
    radial-gradient(circle at 35% 85%, oklch(1 0 0) 0 2px, transparent 3px) 0 0 / 60px 60px,
    linear-gradient(135deg, oklch(0.163 0.051 279.14), oklch(0.255 0.093 277.48));
  background-repeat: repeat;
  animation: roy-misc-sparkles 1.8s ease-in-out infinite alternate;
}

@keyframes roy-misc-sparkles {

  0%   { opacity: 0.4; filter: brightness(0.8); }
  100% { opacity: 1; filter: brightness(1.6); }

}`,
},

{
  id: "ferrum-misc-wave",
  name: "Misc Wave",
  category: "particles",
  description: "A decorative visual effect (misc wave)",
  tags: ["misc-wave", "wave", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-misc-wave {
  background:
    linear-gradient(90deg, transparent 0%, color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent) 50%, transparent 100%) 0 30% / 40px 4px repeat-x,
    linear-gradient(90deg, transparent 0%, color-mix(in oklch, oklch(0.699 0.118 184.7) 50%, transparent) 50%, transparent 100%) 0 50% / 30px 3px repeat-x,
    linear-gradient(90deg, transparent 0%, color-mix(in oklch, oklch(0.769 0.154 162.48) 50%, transparent) 50%, transparent 100%) 0 70% / 50px 4px repeat-x,
    linear-gradient(180deg, oklch(0.265 0.051 233.41), oklch(0.332 0.065 233.43));
  animation: roy-misc-wave 1.5s linear infinite;
}

@keyframes roy-misc-wave {

  from { background-position: 0 30%, 0 50%, 0 70%, 0 0; }
  to   { background-position: 40px 30%, -30px 50%, 50px 70%, 0 0; }

}`,
},

{
  id: "ferrum-particles-bubbles",
  name: "Particles Bubbles",
  category: "particles",
  description: "A particles bubbles effect",
  tags: ["particles-bubbles", "bubbles"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-bubbles {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.52 0.094 223.13) 0%, oklch(0.685 0.131 226.94) 50%, oklch(0.609 0.111 221.72) 100%);
}`,
},

{
  id: "ferrum-particles-confetti-burst",
  name: "Particles Confetti Burst",
  category: "particles",
  description: "A particles confetti burst effect",
  tags: ["particles-confetti-burst", "confetti"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-confetti-burst {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: radial-gradient(circle at center, oklch(0.24 0.067 280.09) 0%, oklch(0.177 0.031 282.81) 100%);
}`,
},

{
  id: "ferrum-particles-dust",
  name: "Particles Dust",
  category: "particles",
  description: "A particles dust effect",
  tags: ["particles-dust", "dust"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-dust {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(135deg, oklch(0.347 0.045 65.44) 0%, oklch(0.447 0.061 67.94) 40%, oklch(0.549 0.078 76.6) 70%, oklch(0.392 0.055 64.02) 100%);
}`,
},

{
  id: "ferrum-particles-fire",
  name: "Particles Fire",
  category: "particles",
  description: "A particles fire effect",
  tags: ["particles-fire", "fire"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-fire {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.204 0.062 41.56) 0%, oklch(0.28 0.086 40.87) 40%, oklch(0.153 0.044 45.08) 100%);
}`,
},

{
  id: "ferrum-particles-fireflies",
  name: "Particles Fireflies",
  category: "particles",
  description: "A particles fireflies effect",
  tags: ["particles-fireflies", "fireflies"],
  previewType: "box",
  cssCode: `.roycss-ferrum-particles-fireflies {
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  background: linear-gradient(180deg, oklch(0.215 0.048 143.69) 0%, oklch(0.255 0.037 152.63) 50%, oklch(0.217 0.037 154.55) 100%);
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-molten-lava",
  name: "Molten Lava",
  category: "visual",
  description: "A molten lava effect",
  tags: ["molten-lava", "lava"],
  previewType: "box",
  cssCode: `.roycss-ferrum-molten-lava {
  position: relative;
  width: 220px;
  height: 160px;
  border-radius: 14px;
  overflow: hidden;
  background: oklch(0.163 0.033 33.34);
  box-shadow: 0 0 30px color-mix(in oklch, oklch(0.671 0.221 37.64) 45%, transparent), inset 0 0 40px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}`,
},

{
  id: "ferrum-morph-blob",
  name: "Morph Blob",
  category: "visual",
  description: "An animated motion effect (morph blob)",
  tags: ["morph-blob", "blob", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-morph-blob {
  position: relative;
  width: 180px;
  height: 180px;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.74 0.198 346.4), oklch(0.626 0.189 281.17) 70%);
  box-shadow: 0 12px 40px color-mix(in oklch, oklch(0.579 0.244 286.54) 50%, transparent);
  animation: roy-b11-morph-blob 8s ease-in-out infinite;
}

@keyframes roy-b11-morph-blob {

  0%, 100% {
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    transform: rotate(0deg) scale(1);
    background: radial-gradient(circle at 30% 30%, oklch(0.74 0.198 346.4), oklch(0.626 0.189 281.17) 70%);
  }
  25% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
    transform: rotate(90deg) scale(1.05);
    background: radial-gradient(circle at 70% 30%, oklch(0.626 0.189 281.17), oklch(0.8 0.182 151.71) 70%);
  }
  50% {
    border-radius: 50% 50% 20% 80% / 25% 80% 20% 75%;
    transform: rotate(180deg) scale(0.95);
    background: radial-gradient(circle at 50% 70%, oklch(0.8 0.182 151.71), oklch(0.837 0.164 84.43) 70%);
  }
  75% {
    border-radius: 70% 30% 50% 50% / 30% 50% 50% 70%;
    transform: rotate(270deg) scale(1.05);
    background: radial-gradient(circle at 30% 70%, oklch(0.837 0.164 84.43), oklch(0.74 0.198 346.4) 70%);
  }

}`,
},

{
  id: "ferrum-neon-sign",
  name: "Neon Sign",
  category: "visual",
  description: "A neon sign effect",
  tags: ["neon-sign", "sign"],
  previewType: "box",
  cssCode: `.roycss-ferrum-neon-sign {
  position: relative;
  width: 200px;
  height: 160px;
  border-radius: 12px;
  background: radial-gradient(ellipse at 50% 50%, oklch(0.194 0.08 297.65) 0%, oklch(0.096 0.051 300.12) 100%);
  display: grid;
  place-items: center;
  overflow: hidden;
}`,
},

{
  id: "ferrum-oil-slick",
  name: "Oil Slick",
  category: "visual",
  description: "A oil slick effect",
  tags: ["oil-slick", "slick"],
  previewType: "box",
  cssCode: `.roycss-ferrum-oil-slick {
  position: relative;
  width: 220px;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 60%, oklch(0.158 0.012 260.62) 0%, oklch(0.107 0.019 262.03) 100%);
}`,
},

];
