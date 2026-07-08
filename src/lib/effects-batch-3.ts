import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 3
 * 60 effects: 25 buttons, 20 cards, 15 borders
 * Every class is prefixed `roycss-` and every keyframe is prefixed `roy-`.
 * Each `cssCode` is complete and self-contained (class + any @keyframes / @property).
 */
export const effectsBatch3: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // BUTTONS (25)
  // ═══════════════════════════════════════════════════════════════

  // 1. btn-shine-sweep (existing — enhanced with base button styling)
  {
    id: "btn-shine-sweep",
    name: "Shine Sweep",
    category: "buttons",
    description: "A sweeping shine/highlight that glides across the button on hover",
    tags: ["shine", "sweep", "button", "glide"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Shine Sweep Button */
.roycss-btn-shine-sweep {
  position: relative;
  overflow: hidden;
  background: #10b981;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.roycss-btn-shine-sweep::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -60%;
  width: 40%;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
  pointer-events: none;
}

.roycss-btn-shine-sweep:hover::after {
  left: 120%;
}`,
  },

  // 2. btn-fill-slide (existing — enhanced with base button styling)
  {
    id: "btn-fill-slide",
    name: "Fill Slide",
    category: "buttons",
    description: "Background fills up from the bottom on hover, inverting the text color",
    tags: ["fill", "slide", "button", "background"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Fill Slide Button */
.roycss-btn-fill-slide {
  position: relative;
  overflow: hidden;
  z-index: 1;
  background: transparent;
  color: #10b981;
  border: 2px solid #10b981;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: color 0.4s ease;
}

.roycss-btn-fill-slide::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0%;
  background: #10b981;
  z-index: -1;
  transition: height 0.4s ease;
}

.roycss-btn-fill-slide:hover {
  color: #fff;
}

.roycss-btn-fill-slide:hover::before {
  height: 100%;
}`,
  },

  // 3. btn-ripple (existing — rewritten as CSS-only ripple)
  {
    id: "btn-ripple",
    name: "Ripple Click",
    category: "buttons",
    description: "A radial ripple emanates from the button center on click — pure CSS, no JS",
    tags: ["ripple", "click", "button", "material"],
    previewType: "button",
    previewText: "Click Me",
    cssCode: `/* Ripple Button (CSS-only) */
.roycss-btn-ripple {
  position: relative;
  overflow: hidden;
  background: #10b981;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.roycss-btn-ripple::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: width 0.5s ease, height 0.5s ease, opacity 0.5s ease;
  pointer-events: none;
}

.roycss-btn-ripple:active::after {
  width: 320px;
  height: 320px;
  opacity: 1;
  transition: 0s;
}`,
  },

  // 4. btn-border-draw (existing — enhanced with base button styling)
  {
    id: "btn-border-draw",
    name: "Border Draw",
    category: "buttons",
    description: "An animated border that draws itself around the button on hover",
    tags: ["border", "draw", "animate", "button"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Border Draw Button */
.roycss-btn-border-draw {
  position: relative;
  background: transparent;
  color: #10b981;
  border: 2px solid transparent;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  z-index: 1;
}

.roycss-btn-border-draw::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid #10b981;
  border-radius: inherit;
  clip-path: polygon(0 0, 0 0, 0 0, 0 0);
  transition: clip-path 0.45s ease;
  z-index: -1;
}

.roycss-btn-border-draw:hover::before {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  background: rgba(16, 185, 129, 0.08);
}`,
  },

  // 5. btn-glow
  {
    id: "btn-glow",
    name: "Glow Button",
    category: "buttons",
    description: "A button with a soft pulsing emerald glow that blooms on hover",
    tags: ["glow", "pulse", "button", "hover"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Glow Button */
.roycss-btn-glow {
  background: #10b981;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.roycss-btn-glow:hover {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.3);
}`,
  },

  // 6. btn-pulse
  {
    id: "btn-pulse",
    name: "Pulse Button",
    category: "buttons",
    description: "Button rhythmically pulses in scale while hovered, drawing the eye",
    tags: ["pulse", "scale", "button", "hover"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Pulse Button */
.roycss-btn-pulse {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.3s ease;
}

.roycss-btn-pulse:hover {
  background: #dc2626;
  animation: roy-btn-pulse 0.8s ease-in-out infinite;
}

@keyframes roy-btn-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}`,
  },

  // 7. btn-bounce
  {
    id: "btn-bounce",
    name: "Bounce Button",
    category: "buttons",
    description: "Button bounces up and down playfully when hovered",
    tags: ["bounce", "vertical", "button", "hover"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Bounce Button */
.roycss-btn-bounce {
  background: #f59e0b;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.roycss-btn-bounce:hover {
  animation: roy-btn-bounce 0.7s ease;
}

@keyframes roy-btn-bounce {
  0%, 100% { transform: translateY(0); }
  20% { transform: translateY(-12px); }
  40% { transform: translateY(0); }
  60% { transform: translateY(-6px); }
  80% { transform: translateY(0); }
}`,
  },

  // 8. btn-press
  {
    id: "btn-press",
    name: "3D Press",
    category: "buttons",
    description: "Chunky 3D button that physically depresses on click with a solid shadow base",
    tags: ["press", "3d", "button", "click"],
    previewType: "button",
    previewText: "Press Me",
    cssCode: `/* 3D Press Button */
.roycss-btn-press {
  background: #8b5cf6;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 6px 0 #6d28d9, 0 8px 14px rgba(0, 0, 0, 0.25);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.roycss-btn-press:active {
  transform: translateY(6px);
  box-shadow: 0 0 0 #6d28d9, 0 2px 6px rgba(0, 0, 0, 0.25);
}`,
  },

  // 9. btn-lift
  {
    id: "btn-lift",
    name: "Lift Button",
    category: "buttons",
    description: "Button gently lifts off the surface with an enlarged colored shadow on hover",
    tags: ["lift", "shadow", "button", "hover"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Lift Button */
.roycss-btn-lift {
  background: #14b8a6;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 10px rgba(20, 184, 166, 0.25);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.roycss-btn-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 14px 28px rgba(20, 184, 166, 0.45);
}`,
  },

  // 10. btn-slide-bg
  {
    id: "btn-slide-bg",
    name: "Slide Background",
    category: "buttons",
    description: "Solid background panel slides in horizontally from the left on hover",
    tags: ["slide", "background", "button", "horizontal"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Slide Background Button */
.roycss-btn-slide-bg {
  position: relative;
  overflow: hidden;
  background: #0f172a;
  color: #f59e0b;
  border: 2px solid #f59e0b;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  z-index: 1;
  transition: color 0.4s ease;
}

.roycss-btn-slide-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: #f59e0b;
  z-index: -1;
  transition: left 0.4s ease;
}

.roycss-btn-slide-bg:hover {
  color: #0f172a;
}

.roycss-btn-slide-bg:hover::before {
  left: 0;
}`,
  },

  // 11. btn-flip
  {
    id: "btn-flip",
    name: "Flip Button",
    category: "buttons",
    description: "Button does a full 3D Y-axis flip on hover, swapping to a new color",
    tags: ["flip", "3d", "button", "rotate"],
    previewType: "button",
    previewText: "Flip Me",
    cssCode: `/* Flip Button */
.roycss-btn-flip {
  background: #ec4899;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transform-style: preserve-3d;
  transition: transform 0.6s ease, background 0.3s ease;
}

.roycss-btn-flip:hover {
  transform: rotateY(360deg);
  background: #f43f5e;
}`,
  },

  // 12. btn-3d-push
  {
    id: "btn-3d-push",
    name: "3D Push",
    category: "buttons",
    description: "Lime button with a thick base that pushes down on hover and depresses on click",
    tags: ["3d", "push", "button", "depth"],
    previewType: "button",
    previewText: "Push Me",
    cssCode: `/* 3D Push Button */
.roycss-btn-3d-push {
  position: relative;
  background: #84cc16;
  color: #1a2e05;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 5px 0 #65a30d, 0 7px 14px rgba(0, 0, 0, 0.25);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.roycss-btn-3d-push:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 0 #65a30d, 0 10px 18px rgba(0, 0, 0, 0.3);
}

.roycss-btn-3d-push:active {
  transform: translateY(5px);
  box-shadow: 0 0 0 #65a30d, 0 1px 4px rgba(0, 0, 0, 0.2);
}`,
  },

  // 13. btn-neon
  {
    id: "btn-neon",
    name: "Neon Button",
    category: "buttons",
    description: "Cyberpunk cyan neon outline with matching glow and text-shadow on hover",
    tags: ["neon", "cyberpunk", "button", "glow"],
    previewType: "button",
    previewText: "NEON",
    cssCode: `/* Neon Button */
.roycss-btn-neon {
  background: #0a0a0a;
  color: #06b6d4;
  border: 2px solid #06b6d4;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 0 5px #06b6d4, inset 0 0 5px rgba(6, 182, 212, 0.4);
  text-shadow: 0 0 5px #06b6d4;
  transition: all 0.3s ease;
}

.roycss-btn-neon:hover {
  color: #fff;
  box-shadow: 0 0 20px #06b6d4, 0 0 40px #06b6d4, inset 0 0 15px rgba(6, 182, 212, 0.6);
  text-shadow: 0 0 10px #fff, 0 0 20px #06b6d4;
}`,
  },

  // 14. btn-gradient
  {
    id: "btn-gradient",
    name: "Animated Gradient",
    category: "buttons",
    description: "Button with a multi-color animated gradient background that flows continuously",
    tags: ["gradient", "animated", "button", "colorful"],
    previewType: "button",
    previewText: "Gradient",
    cssCode: `/* Animated Gradient Button */
.roycss-btn-gradient {
  background: linear-gradient(45deg, #10b981, #06b6d4, #8b5cf6, #ec4899, #10b981);
  background-size: 300% 300%;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  animation: roy-btn-gradient 5s ease infinite;
  transition: transform 0.3s ease;
}

.roycss-btn-gradient:hover {
  transform: scale(1.06);
}

@keyframes roy-btn-gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`,
  },

  // 15. btn-outline-fill
  {
    id: "btn-outline-fill",
    name: "Radial Fill",
    category: "buttons",
    description: "A pill-shaped outline button that fills from the center outward on hover",
    tags: ["outline", "radial", "fill", "pill"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Radial Fill Button */
.roycss-btn-outline-fill {
  position: relative;
  background: transparent;
  color: #f43f5e;
  border: 2px solid #f43f5e;
  padding: 10px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  z-index: 1;
  transition: color 0.4s ease;
}

.roycss-btn-outline-fill::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: #f43f5e;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
  transition: width 0.5s ease, height 0.5s ease;
}

.roycss-btn-outline-fill:hover {
  color: #fff;
}

.roycss-btn-outline-fill:hover::before {
  width: 320px;
  height: 320px;
}`,
  },

  // 16. btn-icon-slide
  {
    id: "btn-icon-slide",
    name: "Icon Slide-In",
    category: "buttons",
    description: "An arrow icon slides in from the left and the button grows to make room on hover",
    tags: ["icon", "arrow", "slide", "button"],
    previewType: "button",
    previewText: "Learn More",
    cssCode: `/* Icon Slide-In Button */
.roycss-btn-icon-slide {
  background: #d946ef;
  color: #fff;
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
}

.roycss-btn-icon-slide::after {
  content: '→';
  display: inline-block;
  opacity: 0;
  width: 0;
  overflow: hidden;
  transform: translateX(-8px);
  transition: opacity 0.3s ease, width 0.3s ease, transform 0.3s ease;
  font-size: 16px;
}

.roycss-btn-icon-slide:hover {
  padding-left: 20px;
  padding-right: 32px;
}

.roycss-btn-icon-slide:hover::after {
  opacity: 1;
  width: 16px;
  transform: translateX(0);
}`,
  },

  // 17. btn-arrow-slide
  {
    id: "btn-arrow-slide",
    name: "Arrow Slide",
    category: "buttons",
    description: "Trailing arrow nudges rightward as the gap grows on hover",
    tags: ["arrow", "slide", "button", "nudge"],
    previewType: "button",
    previewText: "Get Started",
    cssCode: `/* Arrow Slide Button */
.roycss-btn-arrow-slide {
  background: #f97316;
  color: #fff;
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
}

.roycss-btn-arrow-slide::after {
  content: '→';
  display: inline-block;
  transition: transform 0.3s ease;
}

.roycss-btn-arrow-slide:hover {
  gap: 16px;
  background: #ea580c;
}

.roycss-btn-arrow-slide:hover::after {
  transform: translateX(4px);
}`,
  },

  // 18. btn-border-glow
  {
    id: "btn-border-glow",
    name: "Border Glow",
    category: "buttons",
    description: "Dark button whose teal border ignites with an inner + outer glow on hover",
    tags: ["border", "glow", "teal", "button"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Border Glow Button */
.roycss-btn-border-glow {
  background: #1e293b;
  color: #14b8a6;
  border: 2px solid rgba(20, 184, 166, 0.35);
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.roycss-btn-border-glow:hover {
  border-color: #14b8a6;
  color: #5eead4;
  box-shadow: 0 0 18px rgba(20, 184, 166, 0.55), inset 0 0 12px rgba(20, 184, 166, 0.2);
}`,
  },

  // 19. btn-shadow-push
  {
    id: "btn-shadow-push",
    name: "Shadow Push",
    category: "buttons",
    description: "Retro hard-shadow button that pushes into its shadow on hover and click",
    tags: ["shadow", "retro", "push", "button"],
    previewType: "button",
    previewText: "Push Me",
    cssCode: `/* Shadow Push Button */
.roycss-btn-shadow-push {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 5px 5px 0 #7f1d1d;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.roycss-btn-shadow-push:hover {
  transform: translate(2px, 2px);
  box-shadow: 3px 3px 0 #7f1d1d;
}

.roycss-btn-shadow-push:active {
  transform: translate(5px, 5px);
  box-shadow: 0 0 0 #7f1d1d;
}`,
  },

  // 20. btn-liquid
  {
    id: "btn-liquid",
    name: "Liquid Button",
    category: "buttons",
    description: "Pill button morphs to a squarer radius and wobbles like liquid on hover",
    tags: ["liquid", "wobble", "morph", "button"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Liquid Button */
.roycss-btn-liquid {
  background: #06b6d4;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: border-radius 0.4s ease, background 0.4s ease;
}

.roycss-btn-liquid:hover {
  border-radius: 8px;
  background: #0891b2;
  animation: roy-btn-liquid 0.6s ease;
}

@keyframes roy-btn-liquid {
  0%, 100% { transform: skew(0); }
  25% { transform: skew(-4deg); }
  75% { transform: skew(4deg); }
}`,
  },

  // 21. btn-morph
  {
    id: "btn-morph",
    name: "Morph Button",
    category: "buttons",
    description: "Button morphs into a circular pill and rotates slightly on hover",
    tags: ["morph", "shape", "circle", "button"],
    previewType: "button",
    previewText: "Morph",
    cssCode: `/* Morph Button */
.roycss-btn-morph {
  background: #8b5cf6;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.roycss-btn-morph:hover {
  border-radius: 50%;
  padding: 18px 28px;
  transform: rotate(8deg);
  background: #a78bfa;
}`,
  },

  // 22. btn-expand
  {
    id: "btn-expand",
    name: "Expand Button",
    category: "buttons",
    description: "Button grows in horizontal padding and letter-spacing on hover for emphasis",
    tags: ["expand", "spacing", "button", "hover"],
    previewType: "button",
    previewText: "EXPLORE",
    cssCode: `/* Expand Button */
.roycss-btn-expand {
  background: #10b981;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0;
  transition: all 0.4s ease;
}

.roycss-btn-expand:hover {
  padding: 10px 38px;
  letter-spacing: 4px;
  background: #059669;
}`,
  },

  // 23. btn-rotate
  {
    id: "btn-rotate",
    name: "Rotate Button",
    category: "buttons",
    description: "Button tilts with a slight counter-rotation and scale-up on hover",
    tags: ["rotate", "tilt", "scale", "button"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Rotate Button */
.roycss-btn-rotate {
  background: #f59e0b;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.3s ease, background 0.3s ease;
}

.roycss-btn-rotate:hover {
  transform: rotate(-4deg) scale(1.06);
  background: #d97706;
}`,
  },

  // 24. btn-skew
  {
    id: "btn-skew",
    name: "Skew Button",
    category: "buttons",
    description: "Button shears horizontally into a parallelogram on hover",
    tags: ["skew", "shear", "button", "hover"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Skew Button */
.roycss-btn-skew {
  background: #ec4899;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.3s ease, background 0.3s ease;
}

.roycss-btn-skew:hover {
  transform: skewX(-15deg);
  background: #db2777;
}`,
  },

  // 25. btn-sparkle
  {
    id: "btn-sparkle",
    name: "Sparkle Button",
    category: "buttons",
    description: "Dark starlit button with sparkles that twinkle into the corners on hover",
    tags: ["sparkle", "twinkle", "stars", "button"],
    previewType: "button",
    previewText: "Sparkle",
    cssCode: `/* Sparkle Button */
.roycss-btn-sparkle {
  position: relative;
  background: #1e293b;
  color: #fde68a;
  border: 1px solid #f59e0b;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: color 0.3s ease, box-shadow 0.3s ease;
}

.roycss-btn-sparkle::before,
.roycss-btn-sparkle::after {
  content: '✦';
  position: absolute;
  color: #fbbf24;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.5s ease;
  pointer-events: none;
}

.roycss-btn-sparkle::before {
  top: -6px;
  left: 8%;
}

.roycss-btn-sparkle::after {
  bottom: -6px;
  right: 8%;
}

.roycss-btn-sparkle:hover {
  color: #fbbf24;
  box-shadow: 0 0 18px rgba(251, 191, 36, 0.55);
}

.roycss-btn-sparkle:hover::before {
  opacity: 1;
  transform: translateY(-10px) rotate(180deg);
}

.roycss-btn-sparkle:hover::after {
  opacity: 1;
  transform: translateY(10px) rotate(-180deg);
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // CARDS (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. card-glassmorphism (existing — enhanced with base card styling)
  {
    id: "card-glassmorphism",
    name: "Glassmorphism",
    category: "cards",
    description: "Frosted glass card with backdrop blur, translucent layers and subtle border",
    tags: ["glass", "frosted", "blur", "card"],
    previewType: "card",
    cssCode: `/* Glassmorphism Card */
.roycss-card-glassmorphism {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  color: #f1f5f9;
}`,
  },

  // 2. card-neon (existing — enhanced with base card styling)
  {
    id: "card-neon",
    name: "Neon Card",
    category: "cards",
    description: "Card with a pulsing emerald neon border that breathes in and out",
    tags: ["neon", "glow", "border", "card"],
    previewType: "card",
    cssCode: `/* Neon Card */
.roycss-card-neon {
  background: #0f172a;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 16px;
  padding: 24px;
  color: #d1fae5;
  animation: roy-card-neon 2s ease-in-out infinite alternate;
}

@keyframes roy-card-neon {
  from {
    box-shadow: 0 0 5px rgba(16, 185, 129, 0.1), inset 0 0 5px rgba(16, 185, 129, 0.05);
  }
  to {
    box-shadow: 0 0 22px rgba(16, 185, 129, 0.5), 0 0 44px rgba(16, 185, 129, 0.2), inset 0 0 22px rgba(16, 185, 129, 0.1);
  }
}`,
  },

  // 3. card-spotlight (existing — enhanced with base card styling, CSS-only spotlight)
  {
    id: "card-spotlight",
    name: "Spotlight Card",
    category: "cards",
    description: "A radial spotlight glow appears at the card center on hover",
    tags: ["spotlight", "light", "glow", "card"],
    previewType: "card",
    cssCode: `/* Spotlight Card */
.roycss-card-spotlight {
  position: relative;
  overflow: hidden;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
}

.roycss-card-spotlight::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.6);
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.4s ease;
  pointer-events: none;
}

.roycss-card-spotlight:hover::before {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}`,
  },

  // 4. card-gradient-border (existing — enhanced with @property so it animates)
  {
    id: "card-gradient-border",
    name: "Gradient Border",
    category: "cards",
    description: "Card with a rainbow gradient border that rotates continuously around the edge",
    tags: ["gradient", "border", "animated", "card"],
    previewType: "card",
    cssCode: `/* Gradient Border Card */
@property --roy-gb-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.roycss-card-gradient-border {
  position: relative;
  background: #0f172a;
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
}

.roycss-card-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(var(--roy-gb-angle), #10b981, #06b6d4, #8b5cf6, #f59e0b, #10b981);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: roy-card-gb-rotate 4s linear infinite;
  pointer-events: none;
}

@keyframes roy-card-gb-rotate {
  to { --roy-gb-angle: 360deg; }
}`,
  },

  // 5. card-hover-lift
  {
    id: "card-hover-lift",
    name: "Hover Lift Card",
    category: "cards",
    description: "Card lifts off the surface with a deepening shadow and accent border on hover",
    tags: ["lift", "hover", "shadow", "card"],
    previewType: "card",
    cssCode: `/* Hover Lift Card */
.roycss-card-hover-lift {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}

.roycss-card-hover-lift:hover {
  transform: translateY(-10px);
  box-shadow: 0 22px 44px rgba(0, 0, 0, 0.45);
  border-color: rgba(16, 185, 129, 0.45);
}`,
  },

  // 6. card-hover-zoom
  {
    id: "card-hover-zoom",
    name: "Hover Zoom Card",
    category: "cards",
    description: "Card scales up smoothly toward the viewer on hover",
    tags: ["zoom", "scale", "hover", "card"],
    previewType: "card",
    cssCode: `/* Hover Zoom Card */
.roycss-card-hover-zoom {
  background: linear-gradient(135deg, #134e4a, #1e293b);
  border: 1px solid rgba(20, 184, 166, 0.25);
  border-radius: 16px;
  padding: 24px;
  color: #ccfbf1;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.roycss-card-hover-zoom:hover {
  transform: scale(1.08);
  box-shadow: 0 16px 32px rgba(20, 184, 166, 0.3);
}`,
  },

  // 7. card-hover-flip
  {
    id: "card-hover-flip",
    name: "Hover Flip Card",
    category: "cards",
    description: "Card performs a full 3D Y-axis flip on hover, swapping its color theme",
    tags: ["flip", "3d", "rotate", "card"],
    previewType: "card",
    cssCode: `/* Hover Flip Card */
.roycss-card-hover-flip {
  background: #1e293b;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  transform-style: preserve-3d;
  transition: transform 0.7s ease, background 0.4s ease, color 0.4s ease;
}

.roycss-card-hover-flip:hover {
  transform: rotateY(360deg);
  background: linear-gradient(135deg, #10b981, #06b6d4);
  color: #fff;
}`,
  },

  // 8. card-hover-reveal
  {
    id: "card-hover-reveal",
    name: "Reveal Banner Card",
    category: "cards",
    description: "A colored banner slides up from the bottom of the card on hover",
    tags: ["reveal", "banner", "slide", "card"],
    previewType: "card",
    cssCode: `/* Reveal Banner Card */
.roycss-card-hover-reveal {
  position: relative;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  overflow: hidden;
}

.roycss-card-hover-reveal::after {
  content: '★ Featured ★';
  position: absolute;
  bottom: -42px;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, #10b981, #06b6d4);
  color: #fff;
  padding: 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: bottom 0.4s ease;
}

.roycss-card-hover-reveal:hover::after {
  bottom: 0;
}`,
  },

  // 9. card-hover-slide
  {
    id: "card-hover-slide",
    name: "Slide Card",
    category: "cards",
    description: "Card slides to the right with a colored side-shadow on hover",
    tags: ["slide", "horizontal", "hover", "card"],
    previewType: "card",
    cssCode: `/* Slide Card */
.roycss-card-hover-slide {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}

.roycss-card-hover-slide:hover {
  transform: translateX(14px);
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: -12px 0 30px rgba(16, 185, 129, 0.25);
}`,
  },

  // 10. card-hover-fade
  {
    id: "card-hover-fade",
    name: "Fade Overlay Card",
    category: "cards",
    description: "A colored gradient overlay fades in over the card on hover",
    tags: ["fade", "overlay", "gradient", "card"],
    previewType: "card",
    cssCode: `/* Fade Overlay Card */
.roycss-card-hover-fade {
  position: relative;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  overflow: hidden;
}

.roycss-card-hover-fade::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(6, 182, 212, 0.35));
  opacity: 0;
  transition: opacity 0.45s ease;
  pointer-events: none;
}

.roycss-card-hover-fade:hover::before {
  opacity: 1;
}`,
  },

  // 11. card-hover-glow
  {
    id: "card-hover-glow",
    name: "Glow Card",
    category: "cards",
    description: "Card emits an emerald halo on hover with a brighter accent border",
    tags: ["glow", "halo", "hover", "card"],
    previewType: "card",
    cssCode: `/* Glow Card */
.roycss-card-hover-glow {
  background: #0f172a;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
}

.roycss-card-hover-glow:hover {
  border-color: rgba(16, 185, 129, 0.85);
  box-shadow: 0 0 28px rgba(16, 185, 129, 0.5), 0 0 56px rgba(16, 185, 129, 0.3);
}`,
  },

  // 12. card-hover-border
  {
    id: "card-hover-border",
    name: "Border Draw Card",
    category: "cards",
    description: "A solid accent border draws itself around the card on hover",
    tags: ["border", "draw", "animate", "card"],
    previewType: "card",
    cssCode: `/* Border Draw Card */
.roycss-card-hover-border {
  position: relative;
  background: #1e293b;
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
}

.roycss-card-hover-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid #10b981;
  border-radius: inherit;
  clip-path: polygon(0 0, 0 0, 0 0, 0 0);
  transition: clip-path 0.5s ease;
  pointer-events: none;
}

.roycss-card-hover-border:hover::before {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}`,
  },

  // 13. card-hover-color
  {
    id: "card-hover-color",
    name: "Color Shift Card",
    category: "cards",
    description: "Card background smoothly transitions to a vibrant gradient on hover",
    tags: ["color", "shift", "gradient", "card"],
    previewType: "card",
    cssCode: `/* Color Shift Card */
.roycss-card-hover-color {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  transition: background 0.5s ease, color 0.5s ease, border-color 0.5s ease;
}

.roycss-card-hover-color:hover {
  background: linear-gradient(135deg, #10b981, #06b6d4);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}`,
  },

  // 14. card-hover-rotate
  {
    id: "card-hover-rotate",
    name: "3D Rotate Card",
    category: "cards",
    description: "Card tilts in 3D space on hover using rotateX and rotateY for perspective",
    tags: ["rotate", "3d", "tilt", "card"],
    previewType: "card",
    cssCode: `/* 3D Rotate Card */
.roycss-card-hover-rotate {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  perspective: 800px;
  transform-style: preserve-3d;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.roycss-card-hover-rotate:hover {
  transform: rotateX(14deg) rotateY(-14deg);
  box-shadow: -10px 14px 30px rgba(0, 0, 0, 0.4);
}`,
  },

  // 15. card-hover-skew
  {
    id: "card-hover-skew",
    name: "Skew Card",
    category: "cards",
    description: "Card shears diagonally and shifts to a pink-violet gradient on hover",
    tags: ["skew", "shear", "gradient", "card"],
    previewType: "card",
    cssCode: `/* Skew Card */
.roycss-card-hover-skew {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  transition: transform 0.35s ease, background 0.35s ease, color 0.35s ease;
}

.roycss-card-hover-skew:hover {
  transform: skew(-8deg, 2deg);
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: #fff;
}`,
  },

  // 16. card-hover-push
  {
    id: "card-hover-push",
    name: "Depth Push Card",
    category: "cards",
    description: "Card pops forward in 3D while a shadow layer pushes back, creating depth",
    tags: ["push", "depth", "3d", "card"],
    previewType: "card",
    cssCode: `/* Depth Push Card */
.roycss-card-hover-push {
  position: relative;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  transform-style: preserve-3d;
  transition: transform 0.35s ease;
}

.roycss-card-hover-push::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: #10b981;
  transform: translateZ(-30px);
  transition: transform 0.35s ease;
  pointer-events: none;
}

.roycss-card-hover-push:hover {
  transform: translateZ(25px);
}

.roycss-card-hover-push:hover::before {
  transform: translateZ(-55px);
}`,
  },

  // 17. card-hover-press
  {
    id: "card-hover-press",
    name: "Press Card",
    category: "cards",
    description: "Card squishes down and switches to emerald on hover, like a button press",
    tags: ["press", "squish", "scale", "card"],
    previewType: "card",
    cssCode: `/* Press Card */
.roycss-card-hover-press {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.roycss-card-hover-press:hover {
  transform: scale(0.95);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  background: #10b981;
  color: #fff;
}`,
  },

  // 18. card-hover-swing
  {
    id: "card-hover-swing",
    name: "Swing Card",
    category: "cards",
    description: "Card swings back and forth from its top edge on hover",
    tags: ["swing", "pendulum", "animate", "card"],
    previewType: "card",
    cssCode: `/* Swing Card */
.roycss-card-hover-swing {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  transform-origin: top center;
  transition: transform 0.3s ease;
}

.roycss-card-hover-swing:hover {
  animation: roy-card-hover-swing 0.9s ease;
}

@keyframes roy-card-hover-swing {
  20% { transform: rotate(9deg); }
  40% { transform: rotate(-7deg); }
  60% { transform: rotate(5deg); }
  80% { transform: rotate(-3deg); }
  100% { transform: rotate(0deg); }
}`,
  },

  // 19. card-hover-wobble
  {
    id: "card-hover-wobble",
    name: "Wobble Card",
    category: "cards",
    description: "Card wobbles side-to-side with rotation on hover",
    tags: ["wobble", "shake", "animate", "card"],
    previewType: "card",
    cssCode: `/* Wobble Card */
.roycss-card-hover-wobble {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  transition: transform 0.3s ease;
}

.roycss-card-hover-wobble:hover {
  animation: roy-card-hover-wobble 0.85s ease;
}

@keyframes roy-card-hover-wobble {
  0%, 100% { transform: translateX(0) rotate(0); }
  15% { transform: translateX(-9px) rotate(-3deg); }
  30% { transform: translateX(8px) rotate(3deg); }
  45% { transform: translateX(-6px) rotate(-2deg); }
  60% { transform: translateX(5px) rotate(2deg); }
  75% { transform: translateX(-3px) rotate(-1deg); }
}`,
  },

  // 20. card-hover-tada
  {
    id: "card-hover-tada",
    name: "Tada Card",
    category: "cards",
    description: "Card does an animated tada — scaling and wiggling with excitement on hover",
    tags: ["tada", "celebrate", "animate", "card"],
    previewType: "card",
    cssCode: `/* Tada Card */
.roycss-card-hover-tada {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #e2e8f0;
  transition: transform 0.3s ease;
}

.roycss-card-hover-tada:hover {
  animation: roy-card-hover-tada 0.95s ease;
}

@keyframes roy-card-hover-tada {
  0% { transform: scale(1); }
  10%, 20% { transform: scale(0.9) rotate(-3deg); }
  30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
  40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1) rotate(0); }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // BORDERS (15)
  // ═══════════════════════════════════════════════════════════════

  // 1. border-animated-dash
  {
    id: "border-animated-dash",
    name: "Animated Dash",
    category: "borders",
    description: "Dashed emerald border whose color and glow pulse on a loop",
    tags: ["dash", "pulse", "glow", "border"],
    previewType: "box",
    cssCode: `/* Animated Dash Border */
.roycss-border-animated-dash {
  width: 140px;
  height: 80px;
  background: #0f172a;
  border: 3px dashed #10b981;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1fae5;
  font-size: 12px;
  font-weight: 600;
  animation: roy-border-dash-glow 1.6s ease-in-out infinite;
}

@keyframes roy-border-dash-glow {
  0%, 100% {
    border-color: #10b981;
    box-shadow: 0 0 5px rgba(16, 185, 129, 0.3);
  }
  50% {
    border-color: #34d399;
    box-shadow: 0 0 18px rgba(16, 185, 129, 0.65);
  }
}`,
  },

  // 2. border-marching-ants
  {
    id: "border-marching-ants",
    name: "Marching Ants",
    category: "borders",
    description: "Classic selection-rectangle marching ants — dashes march around the perimeter",
    tags: ["marching", "ants", "selection", "border"],
    previewType: "box",
    cssCode: `/* Marching Ants Border */
.roycss-border-marching-ants {
  width: 140px;
  height: 80px;
  background-color: #0f172a;
  background-image:
    repeating-linear-gradient(90deg, #f59e0b 0 6px, transparent 6px 12px),
    repeating-linear-gradient(90deg, #f59e0b 0 6px, transparent 6px 12px),
    repeating-linear-gradient(0deg, #f59e0b 0 6px, transparent 6px 12px),
    repeating-linear-gradient(0deg, #f59e0b 0 6px, transparent 6px 12px);
  background-position: 0 0, 0 100%, 0 0, 100% 0;
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size: 12px 2px, 12px 2px, 2px 12px, 2px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fde68a;
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

  // 3. border-corner-brackets
  {
    id: "border-corner-brackets",
    name: "Corner Brackets",
    category: "borders",
    description: "Four cyan corner brackets frame the box like a camera viewfinder",
    tags: ["corner", "brackets", "viewfinder", "border"],
    previewType: "box",
    cssCode: `/* Corner Brackets Border */
.roycss-border-corner-brackets {
  position: relative;
  width: 140px;
  height: 80px;
  background: #0f172a;
  background-image:
    linear-gradient(#06b6d4, #06b6d4),
    linear-gradient(#06b6d4, #06b6d4),
    linear-gradient(#06b6d4, #06b6d4),
    linear-gradient(#06b6d4, #06b6d4),
    linear-gradient(#06b6d4, #06b6d4),
    linear-gradient(#06b6d4, #06b6d4),
    linear-gradient(#06b6d4, #06b6d4),
    linear-gradient(#06b6d4, #06b6d4);
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
  color: #67e8f9;
  font-size: 12px;
  font-weight: 600;
}`,
  },

  // 4. border-clip-path
  {
    id: "border-clip-path",
    name: "Clip-Path Border",
    category: "borders",
    description: "Angled notched corners created purely with clip-path and a gradient fill",
    tags: ["clip-path", "angled", "notch", "border"],
    previewType: "box",
    cssCode: `/* Clip-Path Angled Border */
.roycss-border-clip-path {
  position: relative;
  width: 140px;
  height: 80px;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.roycss-border-clip-path::before {
  content: '';
  position: absolute;
  inset: 3px;
  background: #0f172a;
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
}`,
  },

  // 5. border-gradient-animated
  {
    id: "border-gradient-animated",
    name: "Animated Gradient Border",
    category: "borders",
    description: "A rotating rainbow gradient ring that flows around the box continuously",
    tags: ["gradient", "animated", "rotate", "border"],
    previewType: "box",
    cssCode: `/* Animated Gradient Border */
@property --roy-bg-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.roycss-border-gradient-animated {
  position: relative;
  width: 140px;
  height: 80px;
  background: #0f172a;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
}

.roycss-border-gradient-animated::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 3px;
  background: linear-gradient(var(--roy-bg-angle), #10b981, #ec4899, #f59e0b, #06b6d4, #10b981);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: roy-border-gradient 4s linear infinite;
  pointer-events: none;
}

@keyframes roy-border-gradient {
  to { --roy-bg-angle: 360deg; }
}`,
  },

  // 6. border-neon-pulse
  {
    id: "border-neon-pulse",
    name: "Neon Pulse Border",
    category: "borders",
    description: "Pink neon border with a synchronized inner and outer glow that pulses",
    tags: ["neon", "pulse", "glow", "border"],
    previewType: "box",
    cssCode: `/* Neon Pulse Border */
.roycss-border-neon-pulse {
  width: 140px;
  height: 80px;
  background: #0a0a0a;
  border: 2px solid #ec4899;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f9a8d4;
  font-size: 12px;
  font-weight: 600;
  animation: roy-border-neon 1.5s ease-in-out infinite;
}

@keyframes roy-border-neon {
  0%, 100% {
    border-color: #ec4899;
    box-shadow: 0 0 5px #ec4899, inset 0 0 5px #ec4899;
  }
  50% {
    border-color: #f472b6;
    box-shadow: 0 0 22px #ec4899, 0 0 44px #ec4899, inset 0 0 16px #ec4899;
  }
}`,
  },

  // 7. border-torn-paper
  {
    id: "border-torn-paper",
    name: "Torn Paper",
    category: "borders",
    description: "Ragged torn-paper edge created with a jagged clip-path polygon",
    tags: ["torn", "paper", "jagged", "border"],
    previewType: "box",
    cssCode: `/* Torn Paper Border */
.roycss-border-torn-paper {
  width: 140px;
  height: 80px;
  background: #f8fafc;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  clip-path: polygon(
    0% 6%, 5% 0%, 12% 6%, 20% 1%, 28% 5%, 35% 0%, 42% 4%, 50% 1%, 58% 5%, 65% 0%, 72% 4%, 80% 1%, 88% 5%, 95% 0%, 100% 6%,
    100% 94%, 95% 100%, 88% 94%, 80% 99%, 72% 95%, 65% 100%, 58% 96%, 50% 99%, 42% 95%, 35% 100%, 28% 96%, 20% 99%, 12% 95%, 5% 100%, 0% 94%
  );
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.25));
}`,
  },

  // 8. border-sticker
  {
    id: "border-sticker",
    name: "Sticker Border",
    category: "borders",
    description: "Thick white border with a drop shadow and slight tilt — like a sticker",
    tags: ["sticker", "white", "tilt", "border"],
    previewType: "box",
    cssCode: `/* Sticker Border */
.roycss-border-sticker {
  width: 140px;
  height: 80px;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  border: 6px solid #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.3);
  transform: rotate(-3deg);
}`,
  },

  // 9. border-ribbon
  {
    id: "border-ribbon",
    name: "Ribbon Banner",
    category: "borders",
    description: "Banner ribbon with a downward notch at the bottom-center",
    tags: ["ribbon", "banner", "notch", "border"],
    previewType: "box",
    cssCode: `/* Ribbon Banner Border */
.roycss-border-ribbon {
  width: 140px;
  height: 90px;
  background: #ef4444;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 52% 78%, 0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding-bottom: 14px;
  box-sizing: border-box;
}`,
  },

  // 10. border-banner
  {
    id: "border-banner",
    name: "Pennant Banner",
    category: "borders",
    description: "Pennant-shaped banner with a triangular notch cut from the right edge",
    tags: ["pennant", "banner", "arrow", "border"],
    previewType: "box",
    cssCode: `/* Pennant Banner Border */
.roycss-border-banner {
  width: 140px;
  height: 80px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 50%, 100% 100%, 0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding-right: 16px;
  box-sizing: border-box;
}`,
  },

  // 11. border-frame
  {
    id: "border-frame",
    name: "Decorative Frame",
    category: "borders",
    description: "Ornate amber double-line frame with an outer outline and inner accent border",
    tags: ["frame", "decorative", "double", "border"],
    previewType: "box",
    cssCode: `/* Decorative Frame Border */
.roycss-border-frame {
  position: relative;
  width: 140px;
  height: 80px;
  background: #1e293b;
  border: 3px double #f59e0b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fde68a;
  font-size: 12px;
  font-weight: 600;
  outline: 1px solid #f59e0b;
  outline-offset: 4px;
}

.roycss-border-frame::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid rgba(245, 158, 11, 0.45);
  border-radius: 2px;
  pointer-events: none;
}`,
  },

  // 12. border-polaroid
  {
    id: "border-polaroid",
    name: "Polaroid Frame",
    category: "borders",
    description: "Classic instant-photo polaroid frame with extra-thick bottom margin and tilt",
    tags: ["polaroid", "photo", "frame", "border"],
    previewType: "box",
    cssCode: `/* Polaroid Frame Border */
.roycss-border-polaroid {
  width: 140px;
  height: 110px;
  background: #fff;
  padding: 8px 8px 30px;
  box-sizing: border-box;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-4deg);
}`,
  },

  // 13. border-double-glow
  {
    id: "border-double-glow",
    name: "Double Glow Ring",
    category: "borders",
    description: "Two concentric emerald rings each with their own glow halo",
    tags: ["double", "ring", "glow", "border"],
    previewType: "box",
    cssCode: `/* Double Glow Ring Border */
.roycss-border-double-glow {
  position: relative;
  width: 140px;
  height: 80px;
  background: #0f172a;
  border: 1px solid #10b981;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6ee7b7;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.5), 0 0 24px rgba(16, 185, 129, 0.3), inset 0 0 12px rgba(16, 185, 129, 0.2);
}

.roycss-border-double-glow::before {
  content: '';
  position: absolute;
  inset: -7px;
  border: 1px solid rgba(16, 185, 129, 0.45);
  border-radius: 12px;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
}`,
  },

  // 14. border-dashed-draw
  {
    id: "border-dashed-draw",
    name: "Dashed Draw",
    category: "borders",
    description: "A violet dashed border that draws itself around the box on hover",
    tags: ["dashed", "draw", "hover", "border"],
    previewType: "box",
    cssCode: `/* Dashed Draw Border */
.roycss-border-dashed-draw {
  position: relative;
  width: 140px;
  height: 80px;
  background: #0f172a;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  font-size: 12px;
  font-weight: 600;
}

.roycss-border-dashed-draw::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px dashed #8b5cf6;
  border-radius: inherit;
  clip-path: polygon(0 0, 0 0, 0 0, 0 0);
  transition: clip-path 0.6s ease;
  pointer-events: none;
}

.roycss-border-dashed-draw:hover::before {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}`,
  },

  // 15. border-inset-glow
  {
    id: "border-inset-glow",
    name: "Inset Glow",
    category: "borders",
    description: "Dark box with a cyan glow that radiates inward from the border edges",
    tags: ["inset", "glow", "cyan", "border"],
    previewType: "box",
    cssCode: `/* Inset Glow Border */
.roycss-border-inset-glow {
  width: 140px;
  height: 80px;
  background: #0a0a0a;
  border: 1px solid rgba(6, 182, 212, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #67e8f9;
  font-size: 12px;
  font-weight: 600;
  box-shadow:
    inset 0 0 22px rgba(6, 182, 212, 0.4),
    inset 0 0 4px rgba(6, 182, 212, 0.7);
}`,
  },
];
