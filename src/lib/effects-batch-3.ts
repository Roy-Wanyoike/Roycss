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
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 89.88);
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
  inset-block-start: -50%;
  inset-inline-start: -60%;
  inline-size: 40%;
  block-size: 200%;
  background: linear-gradient(90deg, transparent, color-mix(in oklch, oklch(1 0 89.88) 45%, transparent), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
  pointer-events: none;
}

.roycss-btn-shine-sweep:hover::after {
  inset-inline-start: 120%;
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
  color: oklch(0.696 0.149 162.48);
  border: 2px solid oklch(0.696 0.149 162.48);
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
  inset-block-end: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  block-size: 0%;
  background: oklch(0.696 0.149 162.48);
  z-index: -1;
  transition: height 0.4s ease;
}

.roycss-btn-fill-slide:hover {
  color: oklch(1 0 89.88);
}

.roycss-btn-fill-slide:hover::before {
  block-size: 100%;
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
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 89.88);
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
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 0;
  block-size: 0;
  background: color-mix(in oklch, oklch(1 0 89.88) 45%, transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: width 0.5s ease, height 0.5s ease, opacity 0.5s ease;
  pointer-events: none;
}

.roycss-btn-ripple:active::after {
  inline-size: 320px;
  block-size: 320px;
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
  color: oklch(0.696 0.149 162.48);
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
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: inherit;
  clip-path: polygon(0 0, 0 0, 0 0, 0 0);
  transition: clip-path 0.45s ease;
  z-index: -1;
}

.roycss-btn-border-draw:hover::before {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 8%, transparent);
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
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 89.88);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.roycss-btn-glow:hover {
  box-shadow: 0 0 20px color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent), 0 0 40px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
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
  background: oklch(0.637 0.208 25.33);
  color: oklch(1 0 89.88);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.3s ease;
}

.roycss-btn-pulse:hover {
  background: oklch(0.577 0.215 27.33);
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
  background: oklch(0.769 0.165 70.08);
  color: oklch(1 0 89.88);
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
  background: oklch(0.606 0.219 292.72);
  color: oklch(1 0 89.88);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 6px 0 oklch(0.491 0.241 292.58), 0 8px 14px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.roycss-btn-press:active {
  transform: translateY(6px);
  box-shadow: 0 0 0 oklch(0.491 0.241 292.58), 0 2px 6px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
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
  background: oklch(0.704 0.123 182.5);
  color: oklch(1 0 89.88);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 10px color-mix(in oklch, oklch(0.704 0.123 182.5) 25%, transparent);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.roycss-btn-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 14px 28px color-mix(in oklch, oklch(0.704 0.123 182.5) 45%, transparent);
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
  background: oklch(0.208 0.04 265.75);
  color: oklch(0.769 0.165 70.08);
  border: 2px solid oklch(0.769 0.165 70.08);
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
  inset-block-start: 0;
  inset-inline-start: -100%;
  inline-size: 100%;
  block-size: 100%;
  background: oklch(0.769 0.165 70.08);
  z-index: -1;
  transition: left 0.4s ease;
}

.roycss-btn-slide-bg:hover {
  color: oklch(0.208 0.04 265.75);
}

.roycss-btn-slide-bg:hover::before {
  inset-inline-start: 0;
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
  background: oklch(0.656 0.212 354.31);
  color: oklch(1 0 89.88);
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
  background: oklch(0.645 0.215 16.44);
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
  background: oklch(0.768 0.204 130.85);
  color: oklch(0.274 0.069 132.11);
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 5px 0 oklch(0.648 0.175 131.68), 0 7px 14px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.roycss-btn-3d-push:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 0 oklch(0.648 0.175 131.68), 0 10px 18px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}

.roycss-btn-3d-push:active {
  transform: translateY(5px);
  box-shadow: 0 0 0 oklch(0.648 0.175 131.68), 0 1px 4px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
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
  background: oklch(0.145 0 89.88);
  color: oklch(0.715 0.126 215.22);
  border: 2px solid oklch(0.715 0.126 215.22);
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 0 5px oklch(0.715 0.126 215.22), inset 0 0 5px color-mix(in oklch, oklch(0.715 0.126 215.22) 40%, transparent);
  text-shadow: 0 0 5px oklch(0.715 0.126 215.22);
  transition: all 0.3s ease;
}

.roycss-btn-neon:hover {
  color: oklch(1 0 89.88);
  box-shadow: 0 0 20px oklch(0.715 0.126 215.22), 0 0 40px oklch(0.715 0.126 215.22), inset 0 0 15px color-mix(in oklch, oklch(0.715 0.126 215.22) 60%, transparent);
  text-shadow: 0 0 10px oklch(1 0 89.88), 0 0 20px oklch(0.715 0.126 215.22);
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
  background: linear-gradient(45deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31), oklch(0.696 0.149 162.48));
  background-size: 300% 300%;
  color: oklch(1 0 89.88);
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
  color: oklch(0.645 0.215 16.44);
  border: 2px solid oklch(0.645 0.215 16.44);
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
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 0;
  block-size: 0;
  background: oklch(0.645 0.215 16.44);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: -1;
  transition: width 0.5s ease, height 0.5s ease;
}

.roycss-btn-outline-fill:hover {
  color: oklch(1 0 89.88);
}

.roycss-btn-outline-fill:hover::before {
  inline-size: 320px;
  block-size: 320px;
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
  background: oklch(0.667 0.259 322.15);
  color: oklch(1 0 89.88);
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
  inline-size: 0;
  overflow: hidden;
  transform: translateX(-8px);
  transition: opacity 0.3s ease, width 0.3s ease, transform 0.3s ease;
  font-size: 16px;
}

.roycss-btn-icon-slide:hover {
  padding-inline-start: 20px;
  padding-inline-end: 32px;
}

.roycss-btn-icon-slide:hover::after {
  opacity: 1;
  inline-size: 16px;
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
  background: oklch(0.705 0.187 47.6);
  color: oklch(1 0 89.88);
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
  background: oklch(0.646 0.194 41.12);
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
  background: oklch(0.279 0.037 260.03);
  color: oklch(0.704 0.123 182.5);
  border: 2px solid color-mix(in oklch, oklch(0.704 0.123 182.5) 35%, transparent);
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.roycss-btn-border-glow:hover {
  border-color: oklch(0.704 0.123 182.5);
  color: oklch(0.855 0.125 181.07);
  box-shadow: 0 0 18px color-mix(in oklch, oklch(0.704 0.123 182.5) 55%, transparent), inset 0 0 12px color-mix(in oklch, oklch(0.704 0.123 182.5) 20%, transparent);
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
  background: oklch(0.637 0.208 25.33);
  color: oklch(1 0 89.88);
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 5px 5px 0 oklch(0.396 0.133 25.72);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.roycss-btn-shadow-push:hover {
  transform: translate(2px, 2px);
  box-shadow: 3px 3px 0 oklch(0.396 0.133 25.72);
}

.roycss-btn-shadow-push:active {
  transform: translate(5px, 5px);
  box-shadow: 0 0 0 oklch(0.396 0.133 25.72);
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
  background: oklch(0.715 0.126 215.22);
  color: oklch(1 0 89.88);
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
  background: oklch(0.609 0.111 221.72);
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
  background: oklch(0.606 0.219 292.72);
  color: oklch(1 0 89.88);
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
  background: oklch(0.709 0.159 293.54);
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
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 89.88);
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
  background: oklch(0.596 0.127 163.23);
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
  background: oklch(0.769 0.165 70.08);
  color: oklch(1 0 89.88);
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
  background: oklch(0.666 0.157 58.32);
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
  background: oklch(0.656 0.212 354.31);
  color: oklch(1 0 89.88);
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
  background: oklch(0.592 0.218 0.58);
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
  background: oklch(0.279 0.037 260.03);
  color: oklch(0.924 0.115 95.75);
  border: 1px solid oklch(0.769 0.165 70.08);
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
  color: oklch(0.837 0.164 84.43);
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.5s ease;
  pointer-events: none;
}

.roycss-btn-sparkle::before {
  inset-block-start: -6px;
  inset-inline-start: 8%;
}

.roycss-btn-sparkle::after {
  inset-block-end: -6px;
  inset-inline-end: 8%;
}

.roycss-btn-sparkle:hover {
  color: oklch(0.837 0.164 84.43);
  box-shadow: 0 0 18px color-mix(in oklch, oklch(0.837 0.164 84.43) 55%, transparent);
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
  background: color-mix(in oklch, oklch(1 0 89.88) 8%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 15%, transparent);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
  color: oklch(0.968 0.007 247.9);
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
  background: oklch(0.208 0.04 265.75);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 8%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
}

.roycss-card-spotlight::before {
  content: '';
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 240px;
  block-size: 240px;
  background: radial-gradient(circle, color-mix(in oklch, oklch(0.696 0.149 162.48) 35%, transparent) 0%, transparent 70%);
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
  background: oklch(0.208 0.04 265.75);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
}

.roycss-card-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(var(--roy-gb-angle), oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72), oklch(0.769 0.165 70.08), oklch(0.696 0.149 162.48));
  -webkit-mask: linear-gradient(oklch(1 0 89.88) 0 0) content-box, linear-gradient(oklch(1 0 89.88) 0 0);
  mask: linear-gradient(oklch(1 0 89.88) 0 0) content-box, linear-gradient(oklch(1 0 89.88) 0 0);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}

.roycss-card-hover-lift:hover {
  transform: translateY(-10px);
  box-shadow: 0 22px 44px color-mix(in oklch, oklch(0 0 0) 45%, transparent);
  border-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 45%, transparent);
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
  background: linear-gradient(135deg, oklch(0.386 0.059 188.42), oklch(0.279 0.037 260.03));
  border: 1px solid color-mix(in oklch, oklch(0.704 0.123 182.5) 25%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.953 0.05 180.8);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.roycss-card-hover-zoom:hover {
  transform: scale(1.08);
  box-shadow: 0 16px 32px color-mix(in oklch, oklch(0.704 0.123 182.5) 30%, transparent);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transform-style: preserve-3d;
  transition: transform 0.7s ease, background 0.4s ease, color 0.4s ease;
}

.roycss-card-hover-flip:hover {
  transform: rotateY(360deg);
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  color: oklch(1 0 89.88);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  overflow: hidden;
}

.roycss-card-hover-reveal::after {
  content: '★ Featured ★';
  position: absolute;
  inset-block-end: -42px;
  inset-inline-start: 0;
  inset-inline-end: 0;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  color: oklch(1 0 89.88);
  padding: 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: bottom 0.4s ease;
}

.roycss-card-hover-reveal:hover::after {
  inset-block-end: 0;
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}

.roycss-card-hover-slide:hover {
  transform: translateX(14px);
  border-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent);
  box-shadow: -12px 0 30px color-mix(in oklch, oklch(0.696 0.149 162.48) 25%, transparent);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  overflow: hidden;
}

.roycss-card-hover-fade::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in oklch, oklch(0.696 0.149 162.48) 35%, transparent), color-mix(in oklch, oklch(0.715 0.126 215.22) 35%, transparent));
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
  background: oklch(0.208 0.04 265.75);
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
}

.roycss-card-hover-glow:hover {
  border-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 85%, transparent);
  box-shadow: 0 0 28px color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent), 0 0 56px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
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
  background: oklch(0.279 0.037 260.03);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
}

.roycss-card-hover-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid oklch(0.696 0.149 162.48);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: background 0.5s ease, color 0.5s ease, border-color 0.5s ease;
}

.roycss-card-hover-color:hover {
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  color: oklch(1 0 89.88);
  border-color: color-mix(in oklch, oklch(1 0 89.88) 30%, transparent);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  perspective: 800px;
  transform-style: preserve-3d;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.roycss-card-hover-rotate:hover {
  transform: rotateX(14deg) rotateY(-14deg);
  box-shadow: -10px 14px 30px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.35s ease, background 0.35s ease, color 0.35s ease;
}

.roycss-card-hover-skew:hover {
  transform: skew(-8deg, 2deg);
  background: linear-gradient(135deg, oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31));
  color: oklch(1 0 89.88);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transform-style: preserve-3d;
  transition: transform 0.35s ease;
}

.roycss-card-hover-push::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: oklch(0.696 0.149 162.48);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  box-shadow: 0 12px 22px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.roycss-card-hover-press:hover {
  transform: scale(0.95);
  box-shadow: 0 3px 8px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  background: oklch(0.696 0.149 162.48);
  color: oklch(1 0 89.88);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
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
  background: oklch(0.279 0.037 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
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
  inline-size: 140px;
  block-size: 80px;
  background: oklch(0.208 0.04 265.75);
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
    border-color: oklch(0.773 0.153 163.22);
    box-shadow: 0 0 18px color-mix(in oklch, oklch(0.696 0.149 162.48) 65%, transparent);
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
  inline-size: 140px;
  block-size: 80px;
  background-color: oklch(0.208 0.04 265.75);
  background-image:
    repeating-linear-gradient(90deg, oklch(0.769 0.165 70.08) 0 6px, transparent 6px 12px),
    repeating-linear-gradient(90deg, oklch(0.769 0.165 70.08) 0 6px, transparent 6px 12px),
    repeating-linear-gradient(0deg, oklch(0.769 0.165 70.08) 0 6px, transparent 6px 12px),
    repeating-linear-gradient(0deg, oklch(0.769 0.165 70.08) 0 6px, transparent 6px 12px);
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
  inline-size: 140px;
  block-size: 80px;
  background: oklch(0.208 0.04 265.75);
  background-image:
    linear-gradient(oklch(0.715 0.126 215.22), oklch(0.715 0.126 215.22)),
    linear-gradient(oklch(0.715 0.126 215.22), oklch(0.715 0.126 215.22)),
    linear-gradient(oklch(0.715 0.126 215.22), oklch(0.715 0.126 215.22)),
    linear-gradient(oklch(0.715 0.126 215.22), oklch(0.715 0.126 215.22)),
    linear-gradient(oklch(0.715 0.126 215.22), oklch(0.715 0.126 215.22)),
    linear-gradient(oklch(0.715 0.126 215.22), oklch(0.715 0.126 215.22)),
    linear-gradient(oklch(0.715 0.126 215.22), oklch(0.715 0.126 215.22)),
    linear-gradient(oklch(0.715 0.126 215.22), oklch(0.715 0.126 215.22));
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
  inline-size: 140px;
  block-size: 80px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(1 0 89.88);
  font-size: 12px;
  font-weight: 600;
}

.roycss-border-clip-path::before {
  content: '';
  position: absolute;
  inset: 3px;
  background: oklch(0.208 0.04 265.75);
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
  inline-size: 140px;
  block-size: 80px;
  background: oklch(0.208 0.04 265.75);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.929 0.013 255.51);
  font-size: 12px;
  font-weight: 600;
}

.roycss-border-gradient-animated::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 3px;
  background: linear-gradient(var(--roy-bg-angle), oklch(0.696 0.149 162.48), oklch(0.656 0.212 354.31), oklch(0.769 0.165 70.08), oklch(0.715 0.126 215.22), oklch(0.696 0.149 162.48));
  -webkit-mask: linear-gradient(oklch(1 0 89.88) 0 0) content-box, linear-gradient(oklch(1 0 89.88) 0 0);
  mask: linear-gradient(oklch(1 0 89.88) 0 0) content-box, linear-gradient(oklch(1 0 89.88) 0 0);
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
  inline-size: 140px;
  block-size: 80px;
  background: oklch(0.145 0 89.88);
  border: 2px solid oklch(0.656 0.212 354.31);
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
    border-color: oklch(0.656 0.212 354.31);
    box-shadow: 0 0 5px oklch(0.656 0.212 354.31), inset 0 0 5px oklch(0.656 0.212 354.31);
  }
  50% {
    border-color: oklch(0.725 0.175 349.76);
    box-shadow: 0 0 22px oklch(0.656 0.212 354.31), 0 0 44px oklch(0.656 0.212 354.31), inset 0 0 16px oklch(0.656 0.212 354.31);
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
  inline-size: 140px;
  block-size: 80px;
  background: oklch(0.984 0.003 247.86);
  color: oklch(0.279 0.037 260.03);
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
  inline-size: 140px;
  block-size: 80px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  border: 6px solid oklch(1 0 89.88);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(1 0 89.88);
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 5px 14px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
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
  inline-size: 140px;
  block-size: 90px;
  background: oklch(0.637 0.208 25.33);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 52% 78%, 0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(1 0 89.88);
  font-size: 12px;
  font-weight: 700;
  padding-block-end: 14px;
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
  inline-size: 140px;
  block-size: 80px;
  background: linear-gradient(135deg, oklch(0.769 0.165 70.08), oklch(0.637 0.208 25.33));
  clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 50%, 100% 100%, 0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(1 0 89.88);
  font-size: 12px;
  font-weight: 700;
  padding-inline-end: 16px;
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
  inline-size: 140px;
  block-size: 80px;
  background: oklch(0.279 0.037 260.03);
  border: 3px double oklch(0.769 0.165 70.08);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.924 0.115 95.75);
  font-size: 12px;
  font-weight: 600;
  outline: 1px solid oklch(0.769 0.165 70.08);
  outline-offset: 4px;
}

.roycss-border-frame::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid color-mix(in oklch, oklch(0.769 0.165 70.08) 45%, transparent);
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
  inline-size: 140px;
  block-size: 110px;
  background: oklch(1 0 89.88);
  padding: 8px 8px 30px;
  box-sizing: border-box;
  box-shadow: 0 6px 16px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
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
  inline-size: 140px;
  block-size: 80px;
  background: oklch(0.208 0.04 265.75);
  border: 1px solid oklch(0.696 0.149 162.48);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.845 0.13 164.98);
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 0 12px color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent), 0 0 24px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent), inset 0 0 12px color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent);
}

.roycss-border-double-glow::before {
  content: '';
  position: absolute;
  inset: -7px;
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 45%, transparent);
  border-radius: 12px;
  pointer-events: none;
  box-shadow: 0 0 10px color-mix(in oklch, oklch(0.696 0.149 162.48) 25%, transparent);
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
  inline-size: 140px;
  block-size: 80px;
  background: oklch(0.208 0.04 265.75);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.709 0.159 293.54);
  font-size: 12px;
  font-weight: 600;
}

.roycss-border-dashed-draw::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px dashed oklch(0.606 0.219 292.72);
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
  inline-size: 140px;
  block-size: 80px;
  background: oklch(0.145 0 89.88);
  border: 1px solid color-mix(in oklch, oklch(0.715 0.126 215.22) 50%, transparent);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.865 0.115 207.08);
  font-size: 12px;
  font-weight: 600;
  box-shadow:
    inset 0 0 22px color-mix(in oklch, oklch(0.715 0.126 215.22) 40%, transparent),
    inset 0 0 4px color-mix(in oklch, oklch(0.715 0.126 215.22) 70%, transparent);
}`,
  },
];
