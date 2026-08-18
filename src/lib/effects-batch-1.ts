import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 1
 * 80 effects: 30 animations, 25 hover, 25 text
 * Every class is prefixed `roycss-` and every keyframe is prefixed `roy-`.
 */
export const effectsBatch1: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS (30)
  // ═══════════════════════════════════════════════════════════════

  // 1. pulse-glow (existing)
  {
    id: "pulse-glow",
    name: "Pulse Glow",
    category: "animations",
    description: "A smooth pulsing glow effect that draws attention to elements",
    tags: ["glow", "pulse", "attention", "animate"],
    previewType: "box",
    cssCode: `/* Pulse Glow */
.roycss-pulse-glow {
  animation: roy-pulse-glow 2s ease-in-out infinite;
}

@keyframes roy-pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent),
                0 0 10px color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  }
  50% {
    box-shadow: 0 0 20px color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent),
                0 0 40px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent),
                0 0 60px color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  }
}`,
  },

  // 2. bounce-in (existing)
  {
    id: "bounce-in",
    name: "Bounce In",
    category: "animations",
    description: "Elements spring into view with an elastic bounce effect",
    tags: ["bounce", "spring", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Bounce In */
.roycss-bounce-in {
  animation: roy-bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
}

@keyframes roy-bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}`,
  },

  // 3. fade-in-up (existing)
  {
    id: "fade-in-up",
    name: "Fade In Up",
    category: "animations",
    description: "Elements gracefully fade in while sliding upward",
    tags: ["fade", "slide", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Fade In Up */
.roycss-fade-in-up {
  animation: roy-fade-in-up 0.6s ease-out both;
}

@keyframes roy-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
  },

  // 4. rotate-spin (existing)
  {
    id: "rotate-spin",
    name: "Rotate Spin",
    category: "animations",
    description: "Continuous smooth rotation with configurable speed",
    tags: ["rotate", "spin", "infinite", "animate"],
    previewType: "box",
    cssCode: `/* Rotate Spin */
.roycss-rotate-spin {
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

  // 5. shake (existing)
  {
    id: "shake",
    name: "Shake",
    category: "animations",
    description: "A vigorous shake animation perfect for error states or alerts",
    tags: ["shake", "error", "alert", "animate"],
    previewType: "box",
    cssCode: `/* Shake */
.roycss-shake {
  animation: roy-shake 0.5s ease-in-out;
}

@keyframes roy-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}`,
  },

  // 6. float (existing)
  {
    id: "float",
    name: "Float",
    category: "animations",
    description: "A gentle floating motion that gives elements a weightless feel",
    tags: ["float", "gentle", "hover", "animate"],
    previewType: "box",
    cssCode: `/* Float */
.roycss-float {
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

  // 7. jello (existing)
  {
    id: "jello",
    name: "Jello",
    category: "animations",
    description: "A fun wobbly jello-like animation with skew transforms",
    tags: ["jello", "wobble", "fun", "skew"],
    previewType: "box",
    cssCode: `/* Jello */
.roycss-jello {
  animation: roy-jello 0.9s ease both;
}

@keyframes roy-jello {
  0% { transform: scale3d(1, 1, 1); }
  30% { transform: scale3d(1.25, 0.75, 1); }
  40% { transform: scale3d(0.75, 1.25, 1); }
  50% { transform: scale3d(1.15, 0.85, 1); }
  65% { transform: scale3d(0.95, 1.05, 1); }
  75% { transform: scale3d(1.05, 0.95, 1); }
  100% { transform: scale3d(1, 1, 1); }
}`,
  },

  // 8. heartbeat (existing)
  {
    id: "heartbeat",
    name: "Heartbeat",
    category: "animations",
    description: "A rhythmic pulsing animation mimicking a heartbeat",
    tags: ["heartbeat", "pulse", "rhythm", "animate"],
    previewType: "box",
    cssCode: `/* Heartbeat */
.roycss-heartbeat {
  animation: roy-heartbeat 1.5s ease-in-out infinite;
}

@keyframes roy-heartbeat {
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.15); }
  28% { transform: scale(1); }
  42% { transform: scale(1.15); }
  70% { transform: scale(1); }
}`,
  },

  // 9. wobble
  {
    id: "wobble",
    name: "Wobble",
    category: "animations",
    description: "A playful wobble animation that sways side to side with rotation",
    tags: ["wobble", "sway", "playful", "animate"],
    previewType: "box",
    cssCode: `/* Wobble */
.roycss-wobble {
  animation: roy-wobble 1s ease-in-out infinite;
}

@keyframes roy-wobble {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  15% { transform: translateX(-10px) rotate(-5deg); }
  30% { transform: translateX(10px) rotate(5deg); }
  45% { transform: translateX(-8px) rotate(-3deg); }
  60% { transform: translateX(8px) rotate(3deg); }
  75% { transform: translateX(-5px) rotate(-2deg); }
}`,
  },

  // 10. tada
  {
    id: "tada",
    name: "Tada",
    category: "animations",
    description: "A celebratory scaling and rotating animation that announces an element",
    tags: ["tada", "celebrate", "scale", "rotate"],
    previewType: "box",
    cssCode: `/* Tada */
.roycss-tada {
  animation: roy-tada 1s ease infinite;
}

@keyframes roy-tada {
  0%, 100% { transform: scale(1) rotate(0); }
  10%, 20% { transform: scale(0.9) rotate(-3deg); }
  30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
  40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
}`,
  },

  // 11. swing
  {
    id: "swing",
    name: "Swing",
    category: "animations",
    description: "A pendulum-like swing animation around the top center pivot",
    tags: ["swing", "pendulum", "rotate", "animate"],
    previewType: "box",
    cssCode: `/* Swing */
.roycss-swing {
  transform-origin: top center;
  animation: roy-swing 1.2s ease-in-out infinite;
}

@keyframes roy-swing {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(15deg); }
  40% { transform: rotate(-10deg); }
  60% { transform: rotate(5deg); }
  80% { transform: rotate(-5deg); }
}`,
  },

  // 12. head-shake
  {
    id: "head-shake",
    name: "Head Shake",
    category: "animations",
    description: "A horizontal head-shake gesture with subtle rotation",
    tags: ["shake", "head", "horizontal", "no"],
    previewType: "box",
    cssCode: `/* Head Shake */
.roycss-head-shake {
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

  // 13. rubber-band
  {
    id: "rubber-band",
    name: "Rubber Band",
    category: "animations",
    description: "An elastic stretch animation that snaps like a rubber band",
    tags: ["rubber", "elastic", "stretch", "animate"],
    previewType: "box",
    cssCode: `/* Rubber Band */
.roycss-rubber-band {
  animation: roy-rubber-band 1s ease infinite;
}

@keyframes roy-rubber-band {
  0%, 100% { transform: scale3d(1, 1, 1); }
  30% { transform: scale3d(1.25, 0.75, 1); }
  40% { transform: scale3d(0.75, 1.25, 1); }
  50% { transform: scale3d(1.15, 0.85, 1); }
  65% { transform: scale3d(0.95, 1.05, 1); }
  75% { transform: scale3d(1.05, 0.95, 1); }
}`,
  },

  // 14. slide-in-left
  {
    id: "slide-in-left",
    name: "Slide In Left",
    category: "animations",
    description: "Element enters the viewport sliding in from the left edge",
    tags: ["slide", "left", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Slide In Left */
.roycss-slide-in-left {
  animation: roy-slide-in-left 0.7s ease-out both;
}

@keyframes roy-slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}`,
  },

  // 15. slide-in-right
  {
    id: "slide-in-right",
    name: "Slide In Right",
    category: "animations",
    description: "Element enters the viewport sliding in from the right edge",
    tags: ["slide", "right", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Slide In Right */
.roycss-slide-in-right {
  animation: roy-slide-in-right 0.7s ease-out both;
}

@keyframes roy-slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}`,
  },

  // 16. zoom-in
  {
    id: "zoom-in",
    name: "Zoom In",
    category: "animations",
    description: "Element scales up from zero into focus with a smooth fade",
    tags: ["zoom", "scale", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Zoom In */
.roycss-zoom-in {
  animation: roy-zoom-in 0.6s ease-out both;
}

@keyframes roy-zoom-in {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}`,
  },

  // 17. flip-in-x
  {
    id: "flip-in-x",
    name: "Flip In X",
    category: "animations",
    description: "Element flips into view around its horizontal X axis",
    tags: ["flip", "3d", "rotate", "entrance"],
    previewType: "box",
    cssCode: `/* Flip In X */
.roycss-flip-in-x {
  backface-visibility: visible;
  animation: roy-flip-in-x 0.9s ease-in both;
}

@keyframes roy-flip-in-x {
  from {
    transform: perspective(400px) rotate3d(1, 0, 0, 90deg);
    opacity: 0;
  }
  40% {
    transform: perspective(400px) rotate3d(1, 0, 0, -20deg);
  }
  60% {
    transform: perspective(400px) rotate3d(1, 0, 0, 10deg);
    opacity: 1;
  }
  80% {
    transform: perspective(400px) rotate3d(1, 0, 0, -5deg);
  }
  to {
    transform: perspective(400px);
  }
}`,
  },

  // 18. flip-in-y
  {
    id: "flip-in-y",
    name: "Flip In Y",
    category: "animations",
    description: "Element flips into view around its vertical Y axis like a card",
    tags: ["flip", "3d", "card", "entrance"],
    previewType: "box",
    cssCode: `/* Flip In Y */
.roycss-flip-in-y {
  backface-visibility: visible;
  animation: roy-flip-in-y 0.9s ease-in both;
}

@keyframes roy-flip-in-y {
  from {
    transform: perspective(400px) rotate3d(0, 1, 0, 90deg);
    opacity: 0;
  }
  40% {
    transform: perspective(400px) rotate3d(0, 1, 0, -20deg);
  }
  60% {
    transform: perspective(400px) rotate3d(0, 1, 0, 10deg);
    opacity: 1;
  }
  80% {
    transform: perspective(400px) rotate3d(0, 1, 0, -5deg);
  }
  to {
    transform: perspective(400px);
  }
}`,
  },

  // 19. light-speed-in
  {
    id: "light-speed-in",
    name: "Light Speed In",
    category: "animations",
    description: "Element streaks in from the left with a skew and decelerates",
    tags: ["light", "speed", "skew", "entrance"],
    previewType: "box",
    cssCode: `/* Light Speed In */
.roycss-light-speed-in {
  animation: roy-light-speed-in 0.9s ease-out both;
}

@keyframes roy-light-speed-in {
  from {
    transform: translate3d(-100%, 0, 0) skewX(-30deg);
    opacity: 0;
  }
  60% {
    transform: skewX(20deg);
    opacity: 1;
  }
  80% {
    transform: skewX(-5deg);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 20. roll-in
  {
    id: "roll-in",
    name: "Roll In",
    category: "animations",
    description: "Element rolls into view from the left with a rotation",
    tags: ["roll", "rotate", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Roll In */
.roycss-roll-in {
  animation: roy-roll-in 0.9s ease-out both;
}

@keyframes roy-roll-in {
  from {
    opacity: 0;
    transform: translateX(-100%) rotate(-120deg);
  }
  to {
    opacity: 1;
    transform: translateX(0) rotate(0);
  }
}`,
  },

  // 21. jack-in-box
  {
    id: "jack-in-box",
    name: "Jack In The Box",
    category: "animations",
    description: "Element springs out like a jack-in-the-box with a celebratory spin",
    tags: ["spring", "scale", "rotate", "entrance"],
    previewType: "box",
    cssCode: `/* Jack In The Box */
.roycss-jack-in-box {
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

  // 22. bounce-out
  {
    id: "bounce-out",
    name: "Bounce Out",
    category: "animations",
    description: "Element bounces away and exits the viewport with energy",
    tags: ["bounce", "exit", "leave", "animate"],
    previewType: "box",
    cssCode: `/* Bounce Out */
.roycss-bounce-out {
  animation: roy-bounce-out 1s ease-in both;
}

@keyframes roy-bounce-out {
  0% { transform: scale(1); opacity: 1; }
  20% { transform: scale(0.9); }
  40%, 55% { transform: scale(1.1); opacity: 1; }
  80%, 100% { transform: scale(0.3); opacity: 0; }
}`,
  },

  // 23. fade-out-down
  {
    id: "fade-out-down",
    name: "Fade Out Down",
    category: "animations",
    description: "Element fades out while sliding downward out of view",
    tags: ["fade", "slide", "exit", "animate"],
    previewType: "box",
    cssCode: `/* Fade Out Down */
.roycss-fade-out-down {
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

  // 24. rotate-out
  {
    id: "rotate-out",
    name: "Rotate Out",
    category: "animations",
    description: "Element rotates clockwise while fading out of view",
    tags: ["rotate", "exit", "fade", "animate"],
    previewType: "box",
    cssCode: `/* Rotate Out */
.roycss-rotate-out {
  transform-origin: center;
  animation: roy-rotate-out 0.8s ease-in both;
}

@keyframes roy-rotate-out {
  from {
    opacity: 1;
    transform: rotate(0);
  }
  to {
    opacity: 0;
    transform: rotate(200deg);
  }
}`,
  },

  // 25. zoom-out
  {
    id: "zoom-out",
    name: "Zoom Out",
    category: "animations",
    description: "Element scales up briefly then shrinks to nothing as it exits",
    tags: ["zoom", "scale", "exit", "animate"],
    previewType: "box",
    cssCode: `/* Zoom Out */
.roycss-zoom-out {
  animation: roy-zoom-out 0.8s ease-in both;
}

@keyframes roy-zoom-out {
  0% {
    opacity: 1;
    transform: scale(0);
  }
  40%, 50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(0.3);
  }
}`,
  },

  // 26. roll-out
  {
    id: "roll-out",
    name: "Roll Out",
    category: "animations",
    description: "Element rolls off to the right with a rotation as it exits",
    tags: ["roll", "rotate", "exit", "animate"],
    previewType: "box",
    cssCode: `/* Roll Out */
.roycss-roll-out {
  animation: roy-roll-out 0.9s ease-in both;
}

@keyframes roy-roll-out {
  from {
    opacity: 1;
    transform: translateX(0) rotate(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%) rotate(120deg);
  }
}`,
  },

  // 27. flash
  {
    id: "flash",
    name: "Flash",
    category: "animations",
    description: "Element opacity flashes twice to grab instant attention",
    tags: ["flash", "opacity", "attention", "animate"],
    previewType: "box",
    cssCode: `/* Flash */
.roycss-flash {
  animation: roy-flash 1.2s ease-in-out infinite;
}

@keyframes roy-flash {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0; }
}`,
  },

  // 28. pulse-soft
  {
    id: "pulse-soft",
    name: "Pulse Soft",
    category: "animations",
    description: "A subtle gentle pulse that breathes opacity without motion",
    tags: ["pulse", "soft", "subtle", "animate"],
    previewType: "box",
    cssCode: `/* Pulse Soft */
.roycss-pulse-soft {
  animation: roy-pulse-soft 2.5s ease-in-out infinite;
}

@keyframes roy-pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}`,
  },

  // 29. wiggle
  {
    id: "wiggle",
    name: "Wiggle",
    category: "animations",
    description: "A small playful wiggle with rotation back and forth",
    tags: ["wiggle", "rotate", "playful", "animate"],
    previewType: "box",
    cssCode: `/* Wiggle */
.roycss-wiggle {
  animation: roy-wiggle 0.8s ease-in-out infinite;
}

@keyframes roy-wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}`,
  },

  // 30. breathe
  {
    id: "breathe",
    name: "Breathe",
    category: "animations",
    description: "A slow meditative scaling animation that mimics calm breathing",
    tags: ["breathe", "scale", "calm", "animate"],
    previewType: "box",
    cssCode: `/* Breathe */
.roycss-breathe {
  animation: roy-breathe 4s ease-in-out infinite;
}

@keyframes roy-breathe {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.08); opacity: 1; }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // HOVER EFFECTS (25)
  // ═══════════════════════════════════════════════════════════════

  // 1. hover-scale (existing)
  {
    id: "hover-scale",
    name: "Scale Up",
    category: "hover",
    description: "Smooth scale transformation on hover with a subtle shadow boost",
    tags: ["scale", "grow", "hover", "zoom"],
    previewType: "box",
    cssCode: `/* Hover Scale Up */
.roycss-hover-scale {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.roycss-hover-scale:hover {
  transform: scale(1.08);
  box-shadow: 0 10px 30px -5px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
}`,
  },

  // 2. hover-underline-slide (existing, class updated to match id)
  {
    id: "hover-underline-slide",
    name: "Underline Slide",
    category: "hover",
    description: "An animated underline that slides in from left on hover",
    tags: ["underline", "slide", "text", "hover"],
    previewType: "text",
    cssCode: `/* Hover Underline Slide */
.roycss-hover-underline-slide {
  position: relative;
  display: inline-block;
  text-decoration: none;
}

.roycss-hover-underline-slide::after {
  content: '';
  position: absolute;
  inset-block-end: -2px;
  inset-inline-start: 0;
  inline-size: 0;
  block-size: 2px;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.704 0.123 182.5));
  transition: width 0.3s ease;
}

.roycss-hover-underline-slide:hover::after {
  inline-size: 100%;
}`,
  },

  // 3. hover-glow-border (existing)
  {
    id: "hover-glow-border",
    name: "Glow Border",
    category: "hover",
    description: "A glowing border effect that illuminates on hover",
    tags: ["glow", "border", "hover", "neon"],
    previewType: "box",
    cssCode: `/* Hover Glow Border */
.roycss-hover-glow-border {
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  transition: all 0.3s ease;
}

.roycss-hover-glow-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.704 0.123 182.5), oklch(0.715 0.126 215.22));
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: blur(8px);
}

.roycss-hover-glow-border:hover::before {
  opacity: 1;
}

.roycss-hover-glow-border:hover {
  border-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent);
  box-shadow: 0 0 20px color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
}`,
  },

  // 4. hover-shadow-grow (existing)
  {
    id: "hover-shadow-grow",
    name: "Shadow Grow",
    category: "hover",
    description: "Box shadow expands and intensifies on hover",
    tags: ["shadow", "depth", "hover", "elevation"],
    previewType: "box",
    cssCode: `/* Hover Shadow Grow */
.roycss-hover-shadow-grow {
  transition: transform 0.3s ease,
              box-shadow 0.3s ease;
  box-shadow: 0 2px 4px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
}

.roycss-hover-shadow-grow:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px color-mix(in oklch, oklch(0 0 0) 12%, transparent),
              0 4px 8px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
}`,
  },

  // 5. hover-color-shift (existing)
  {
    id: "hover-color-shift",
    name: "Color Shift",
    category: "hover",
    description: "Smooth background color transition between states",
    tags: ["color", "transition", "hover", "gradient"],
    previewType: "box",
    cssCode: `/* Hover Color Shift */
.roycss-hover-color-shift {
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.596 0.127 163.23));
  transition: all 0.4s ease;
  background-size: 200% 200%;
  background-position: 0% 50%;
}

.roycss-hover-color-shift:hover {
  background: linear-gradient(135deg, oklch(0.769 0.165 70.08), oklch(0.637 0.208 25.33));
  background-size: 200% 200%;
  background-position: 100% 50%;
}`,
  },

  // 6. hover-tilt-rotate (existing)
  {
    id: "hover-tilt-rotate",
    name: "Tilt Rotate",
    category: "hover",
    description: "Subtle 3D tilt rotation on hover for depth",
    tags: ["rotate", "tilt", "3d", "hover"],
    previewType: "box",
    cssCode: `/* Hover Tilt Rotate */
.roycss-hover-tilt-rotate {
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.roycss-hover-tilt-rotate:hover {
  transform: rotateY(8deg) rotateX(-5deg) scale(1.02);
}`,
  },

  // 7. hover-zoom-blur
  {
    id: "hover-zoom-blur",
    name: "Zoom Blur",
    category: "hover",
    description: "Element scales up slightly while a soft blur blooms on hover",
    tags: ["zoom", "blur", "filter", "hover"],
    previewType: "box",
    cssCode: `/* Hover Zoom Blur */
.roycss-hover-zoom-blur {
  transition: transform 0.4s ease, filter 0.4s ease;
}

.roycss-hover-zoom-blur:hover {
  transform: scale(1.12);
  filter: blur(0.6px) brightness(1.1);
}`,
  },

  // 8. hover-overlay-reveal
  {
    id: "hover-overlay-reveal",
    name: "Overlay Reveal",
    category: "hover",
    description: "A colored overlay slides up from the bottom on hover",
    tags: ["overlay", "reveal", "slide", "hover"],
    previewType: "box",
    cssCode: `/* Hover Overlay Reveal */
.roycss-hover-overlay-reveal {
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}

.roycss-hover-overlay-reveal::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, color-mix(in oklch, oklch(0.696 0.149 162.48) 85%, transparent) 100%);
  transform: translateY(100%);
  transition: transform 0.4s ease;
  z-index: 0;
}

.roycss-hover-overlay-reveal:hover::before {
  transform: translateY(0);
}

.roycss-hover-overlay-reveal > * {
  position: relative;
  z-index: 1;
}`,
  },

  // 9. hover-push-up
  {
    id: "hover-push-up",
    name: "Push Up",
    category: "hover",
    description: "Element lifts up while a shadow grows beneath it like it's floating",
    tags: ["push", "lift", "float", "hover"],
    previewType: "box",
    cssCode: `/* Hover Push Up */
.roycss-hover-push-up {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.roycss-hover-push-up:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px -10px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
}`,
  },

  // 10. hover-slide-overlay
  {
    id: "hover-slide-overlay",
    name: "Slide Overlay",
    category: "hover",
    description: "A diagonal overlay wipes across the element on hover",
    tags: ["slide", "overlay", "diagonal", "hover"],
    previewType: "box",
    cssCode: `/* Hover Slide Overlay */
.roycss-hover-slide-overlay {
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}

.roycss-hover-slide-overlay::before {
  content: '';
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: -100%;
  inline-size: 100%;
  block-size: 100%;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  transition: left 0.4s ease;
  z-index: 0;
}

.roycss-hover-slide-overlay:hover::before {
  inset-inline-start: 0;
}

.roycss-hover-slide-overlay:hover {
  color: oklch(1 0 89.88);
}

.roycss-hover-slide-overlay > * {
  position: relative;
  z-index: 1;
}`,
  },

  // 11. hover-fade-overlay
  {
    id: "hover-fade-overlay",
    name: "Fade Overlay",
    category: "hover",
    description: "A semi-transparent overlay fades in over the element on hover",
    tags: ["fade", "overlay", "opacity", "hover"],
    previewType: "box",
    cssCode: `/* Hover Fade Overlay */
.roycss-hover-fade-overlay {
  position: relative;
  isolation: isolate;
}

.roycss-hover-fade-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 35%, transparent);
  opacity: 0;
  transition: opacity 0.35s ease;
  border-radius: inherit;
  z-index: 0;
}

.roycss-hover-fade-overlay:hover::after {
  opacity: 1;
}`,
  },

  // 12. hover-grayscale-to-color
  {
    id: "hover-grayscale-to-color",
    name: "Grayscale to Color",
    category: "hover",
    description: "Element starts desaturated and bursts into full color on hover",
    tags: ["grayscale", "color", "filter", "hover"],
    previewType: "box",
    cssCode: `/* Hover Grayscale to Color */
.roycss-hover-grayscale-to-color {
  filter: grayscale(100%);
  transition: filter 0.5s ease;
}

.roycss-hover-grayscale-to-color:hover {
  filter: grayscale(0%);
}`,
  },

  // 13. hover-hue-rotate
  {
    id: "hover-hue-rotate",
    name: "Hue Rotate",
    category: "hover",
    description: "Continuous hue rotation creates a rainbow cycling effect on hover",
    tags: ["hue", "rainbow", "filter", "hover"],
    previewType: "box",
    cssCode: `/* Hover Hue Rotate */
.roycss-hover-hue-rotate {
  transition: filter 0.3s ease;
}

.roycss-hover-hue-rotate:hover {
  animation: roy-hue-cycle 2s linear infinite;
}

@keyframes roy-hue-cycle {
  from { filter: hue-rotate(0deg); }
  to { filter: hue-rotate(360deg); }
}`,
  },

  // 14. hover-drop-shadow
  {
    id: "hover-drop-shadow",
    name: "Drop Shadow",
    category: "hover",
    description: "A colored drop shadow filter blooms around the element on hover",
    tags: ["drop-shadow", "filter", "glow", "hover"],
    previewType: "box",
    cssCode: `/* Hover Drop Shadow */
.roycss-hover-drop-shadow {
  transition: filter 0.35s ease, transform 0.35s ease;
}

.roycss-hover-drop-shadow:hover {
  transform: translateY(-3px);
  filter: drop-shadow(0 8px 14px color-mix(in oklch, oklch(0.696 0.149 162.48) 55%, transparent));
}`,
  },

  // 15. hover-skew
  {
    id: "hover-skew",
    name: "Skew",
    category: "hover",
    description: "Element skews diagonally on hover for a dynamic tilt",
    tags: ["skew", "tilt", "transform", "hover"],
    previewType: "box",
    cssCode: `/* Hover Skew */
.roycss-hover-skew {
  transition: transform 0.3s ease;
}

.roycss-hover-skew:hover {
  transform: skew(-12deg, 4deg);
}`,
  },

  // 16. hover-flip
  {
    id: "hover-flip",
    name: "Flip",
    category: "hover",
    description: "Element performs a 3D vertical flip on hover",
    tags: ["flip", "3d", "rotate", "hover"],
    previewType: "box",
    cssCode: `/* Hover Flip */
.roycss-hover-flip {
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
  perspective: 800px;
}

.roycss-hover-flip:hover {
  transform: rotateY(180deg);
}`,
  },

  // 17. hover-rotate
  {
    id: "hover-rotate",
    name: "Rotate",
    category: "hover",
    description: "Element spins 90 degrees on hover for a snappy rotation",
    tags: ["rotate", "spin", "transform", "hover"],
    previewType: "box",
    cssCode: `/* Hover Rotate */
.roycss-hover-rotate {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.roycss-hover-rotate:hover {
  transform: rotate(90deg);
}`,
  },

  // 18. hover-scale-down
  {
    id: "hover-scale-down",
    name: "Scale Down",
    category: "hover",
    description: "Element shrinks slightly on hover creating a press-into-bg effect",
    tags: ["scale", "shrink", "press", "hover"],
    previewType: "box",
    cssCode: `/* Hover Scale Down */
.roycss-hover-scale-down {
  transition: transform 0.3s ease;
}

.roycss-hover-scale-down:hover {
  transform: scale(0.9);
}`,
  },

  // 19. hover-opacity
  {
    id: "hover-opacity",
    name: "Opacity Fade",
    category: "hover",
    description: "Element dims to translucent on hover to indicate non-focus",
    tags: ["opacity", "fade", "dim", "hover"],
    previewType: "box",
    cssCode: `/* Hover Opacity Fade */
.roycss-hover-opacity {
  transition: opacity 0.3s ease;
}

.roycss-hover-opacity:hover {
  opacity: 0.45;
}`,
  },

  // 20. hover-border-draw
  {
    id: "hover-border-draw",
    name: "Border Draw",
    category: "hover",
    description: "A border draws itself around the element clockwise on hover",
    tags: ["border", "draw", "outline", "hover"],
    previewType: "box",
    cssCode: `/* Hover Border Draw */
.roycss-hover-border-draw {
  position: relative;
  box-sizing: border-box;
}

.roycss-hover-border-draw::before,
.roycss-hover-border-draw::after {
  content: '';
  position: absolute;
  border: 2px solid oklch(0.696 0.149 162.48);
  box-sizing: border-box;
  transition: width 0.3s ease, height 0.3s ease;
  inline-size: 0;
  block-size: 0;
}

.roycss-hover-border-draw::before {
  inset-block-start: 0;
  inset-inline-start: 0;
  border-inline-end: none;
  border-block-end: none;
}

.roycss-hover-border-draw::after {
  inset-block-end: 0;
  inset-inline-end: 0;
  border-inline-start: none;
  border-block-start: none;
}

.roycss-hover-border-draw:hover::before,
.roycss-hover-border-draw:hover::after {
  inline-size: 100%;
  block-size: 100%;
}`,
  },

  // 21. hover-neon-flicker
  {
    id: "hover-neon-flicker",
    name: "Neon Flicker",
    category: "hover",
    description: "Element glows with a flickering neon light on hover",
    tags: ["neon", "flicker", "glow", "hover"],
    previewType: "box",
    cssCode: `/* Hover Neon Flicker */
.roycss-hover-neon-flicker {
  transition: box-shadow 0.2s ease;
}

.roycss-hover-neon-flicker:hover {
  animation: roy-neon-flicker 1.2s infinite;
}

@keyframes roy-neon-flicker {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    box-shadow:
      0 0 4px oklch(0.696 0.149 162.48),
      0 0 11px oklch(0.696 0.149 162.48),
      0 0 19px oklch(0.696 0.149 162.48),
      0 0 40px oklch(0.596 0.127 162.48),
      0 0 80px oklch(0.596 0.127 162.48);
  }
  20%, 24%, 55% {
    box-shadow: none;
  }
}`,
  },

  // 22. hover-depth
  {
    id: "hover-depth",
    name: "Depth Lift",
    category: "hover",
    description: "Element lifts with multi-layered shadows giving real 3D depth",
    tags: ["depth", "shadow", "3d", "hover"],
    previewType: "box",
    cssCode: `/* Hover Depth Lift */
.roycss-hover-depth {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.4s ease;
  box-shadow: 0 1px 2px color-mix(in oklch, oklch(0 0 0) 8%, transparent),
              0 2px 4px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
}

.roycss-hover-depth:hover {
  transform: translateY(-6px);
  box-shadow:
    0 4px 8px color-mix(in oklch, oklch(0.696 0.149 162.48) 12%, transparent),
    0 12px 24px color-mix(in oklch, oklch(0.696 0.149 162.48) 18%, transparent),
    0 24px 48px color-mix(in oklch, oklch(0.696 0.149 162.48) 12%, transparent);
}`,
  },

  // 23. hover-press
  {
    id: "hover-press",
    name: "Press Down",
    category: "hover",
    description: "Element presses down into the surface like a physical button",
    tags: ["press", "button", "down", "hover"],
    previewType: "button",
    previewText: "Press Me",
    cssCode: `/* Hover Press Down */
.roycss-hover-press {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 6px 0 oklch(0.508 0.105 165.61), 0 8px 14px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}

.roycss-hover-press:hover {
  transform: translateY(3px);
  box-shadow: 0 3px 0 oklch(0.508 0.105 165.61), 0 5px 10px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}`,
  },

  // 24. hover-slide-right
  {
    id: "hover-slide-right",
    name: "Slide Right",
    category: "hover",
    description: "Element nudges to the right on hover with an arrow-like motion",
    tags: ["slide", "right", "nudge", "hover"],
    previewType: "button",
    previewText: "Slide →",
    cssCode: `/* Hover Slide Right */
.roycss-hover-slide-right {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.roycss-hover-slide-inset-inline-end:hover {
  transform: translateX(12px);
}`,
  },

  // 25. hover-bounce
  {
    id: "hover-bounce",
    name: "Bounce",
    category: "hover",
    description: "Element performs a springy bounce when hovered",
    tags: ["bounce", "spring", "playful", "hover"],
    previewType: "box",
    cssCode: `/* Hover Bounce */
.roycss-hover-bounce:hover {
  animation: roy-hover-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes roy-hover-bounce {
  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-18px); }
  60% { transform: translateY(-4px); }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // TEXT EFFECTS (25)
  // ═══════════════════════════════════════════════════════════════

  // 1. text-gradient (existing)
  {
    id: "text-gradient",
    name: "Gradient Text",
    category: "text",
    description: "Text filled with a vibrant multi-color gradient",
    tags: ["gradient", "text", "colorful", "typography"],
    previewType: "text",
    cssCode: `/* Gradient Text */
.roycss-text-gradient {
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48) 0%, oklch(0.704 0.123 182.5) 40%, oklch(0.715 0.126 215.22) 70%, oklch(0.606 0.219 292.72) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
}`,
  },

  // 2. text-neon-glow (existing)
  {
    id: "text-neon-glow",
    name: "Neon Glow Text",
    category: "text",
    description: "Text with a vivid neon glow effect, like a neon sign",
    tags: ["neon", "glow", "text", "light"],
    previewType: "text",
    cssCode: `/* Neon Glow Text */
.roycss-text-neon-glow {
  color: oklch(0.696 0.149 162.48);
  text-shadow:
    0 0 7px color-mix(in oklch, oklch(0.696 0.149 162.48) 80%, transparent),
    0 0 10px color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent),
    0 0 21px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent),
    0 0 42px color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent),
    0 0 82px color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
}`,
  },

  // 3. text-stroke (existing)
  {
    id: "text-stroke",
    name: "Text Stroke",
    category: "text",
    description: "Outlined text with a transparent fill for a modern look",
    tags: ["stroke", "outline", "text", "hollow"],
    previewType: "text",
    cssCode: `/* Text Stroke */
.roycss-text-stroke {
  -webkit-text-stroke: 2px oklch(0.696 0.149 162.48);
  color: transparent;
  font-weight: 700;
}`,
  },

  // 4. text-typing-cursor (existing, class updated to match id)
  {
    id: "text-typing-cursor",
    name: "Typing Cursor",
    category: "text",
    description: "A blinking cursor effect that follows text",
    tags: ["typing", "cursor", "blink", "text"],
    previewType: "text",
    cssCode: `/* Typing Cursor */
.roycss-text-typing-cursor {
  border-inline-end: 3px solid oklch(0.696 0.149 162.48);
  animation: roy-text-blink-cursor 1s step-end infinite;
  padding-inline-end: 4px;
}

@keyframes roy-text-blink-cursor {
  0%, 100% { border-color: oklch(0.696 0.149 162.48); }
  50% { border-color: transparent; }
}`,
  },

  // 5. text-glitch (existing)
  {
    id: "text-glitch",
    name: "Glitch Text",
    category: "text",
    description: "A cyberpunk-inspired glitch effect with color channel splitting",
    tags: ["glitch", "cyberpunk", "distort", "text"],
    previewType: "text",
    cssCode: `/* Glitch Text */
.roycss-text-glitch {
  position: relative;
  font-weight: 700;
}

.roycss-text-glitch::before,
.roycss-text-glitch::after {
  content: attr(data-text);
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  block-size: 100%;
}

.roycss-text-glitch::before {
  animation: roy-glitch-1 2s infinite linear alternate-reverse;
  clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
  color: oklch(0.637 0.208 25.33);
}

.roycss-text-glitch::after {
  animation: roy-glitch-2 3s infinite linear alternate-reverse;
  clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
  color: oklch(0.715 0.126 215.22);
}

@keyframes roy-glitch-1 {
  0% { transform: translate(0); }
  20% { transform: translate(-3px, 3px); }
  40% { transform: translate(-3px, -3px); }
  60% { transform: translate(3px, 3px); }
  80% { transform: translate(3px, -3px); }
  100% { transform: translate(0); }
}

@keyframes roy-glitch-2 {
  0% { transform: translate(0); }
  20% { transform: translate(3px, -3px); }
  40% { transform: translate(3px, 3px); }
  60% { transform: translate(-3px, -3px); }
  80% { transform: translate(-3px, 3px); }
  100% { transform: translate(0); }
}`,
  },

  // 6. text-3d-shadow (existing)
  {
    id: "text-3d-shadow",
    name: "3D Text Shadow",
    category: "text",
    description: "Multiple layered shadows creating a 3D extrusion effect",
    tags: ["3d", "shadow", "text", "depth"],
    previewType: "text",
    cssCode: `/* 3D Text Shadow */
.roycss-text-3d-shadow {
  color: oklch(0.982 0.018 155.83);
  text-shadow:
    1px 1px 0 oklch(0.432 0.086 166.91),
    2px 2px 0 oklch(0.508 0.105 165.61),
    3px 3px 0 oklch(0.596 0.127 163.23),
    4px 4px 0 oklch(0.696 0.149 162.48),
    5px 5px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent),
    6px 6px 10px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  font-weight: 700;
}`,
  },

  // 7. text-rainbow
  {
    id: "text-rainbow",
    name: "Rainbow Text",
    category: "text",
    description: "Animated rainbow gradient that flows horizontally across text",
    tags: ["rainbow", "animated", "gradient", "text"],
    previewType: "text",
    cssCode: `/* Rainbow Text */
.roycss-text-rainbow {
  background: linear-gradient(
    90deg,
    oklch(0.637 0.208 25.33), oklch(0.769 0.165 70.08), oklch(0.795 0.162 86.05), oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31), oklch(0.637 0.208 25.33)
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
  animation: roy-rainbow-flow 4s linear infinite;
}

@keyframes roy-rainbow-flow {
  from { background-position: 0% center; }
  to { background-position: 200% center; }
}`,
  },

  // 8. text-shimmer
  {
    id: "text-shimmer",
    name: "Shimmer Text",
    category: "text",
    description: "A glossy shimmer sweeps across the text like a moving highlight",
    tags: ["shimmer", "shine", "glossy", "text"],
    previewType: "text",
    cssCode: `/* Shimmer Text */
.roycss-text-shimmer {
  background: linear-gradient(
    110deg,
    oklch(0.446 0.037 257.28) 0%,
    oklch(0.446 0.037 257.28) 35%,
    oklch(0.968 0.007 247.9) 50%,
    oklch(0.446 0.037 257.28) 65%,
    oklch(0.446 0.037 257.28) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
  animation: roy-shimmer-sweep 3s linear infinite;
}

@keyframes roy-shimmer-sweep {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}`,
  },

  // 9. text-gradient-shift
  {
    id: "text-gradient-shift",
    name: "Gradient Shift",
    category: "text",
    description: "Text with a smoothly morphing multi-color gradient background",
    tags: ["gradient", "shift", "morph", "text"],
    previewType: "text",
    cssCode: `/* Gradient Shift Text */
.roycss-text-gradient-shift {
  background: linear-gradient(45deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31), oklch(0.696 0.149 162.48));
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
  animation: roy-text-grad-shift 6s ease infinite;
}

@keyframes roy-text-grad-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}`,
  },

  // 10. text-blur-reveal
  {
    id: "text-blur-reveal",
    name: "Blur Reveal",
    category: "text",
    description: "Text starts blurred and continuously focuses in and out",
    tags: ["blur", "reveal", "focus", "text"],
    previewType: "text",
    cssCode: `/* Blur Reveal Text */
.roycss-text-blur-reveal {
  color: oklch(0.696 0.149 162.48);
  font-weight: 700;
  animation: roy-blur-reveal 4s ease-in-out infinite;
}

@keyframes roy-blur-reveal {
  0%, 100% { filter: blur(8px); opacity: 0.4; }
  50% { filter: blur(0); opacity: 1; }
}`,
  },

  // 11. text-wave
  {
    id: "text-wave",
    name: "Wave Text",
    category: "text",
    description: "Letters ride up and down in a continuous sine wave",
    tags: ["wave", "sine", "animated", "text"],
    previewType: "text",
    previewText: "Wave",
    cssCode: `/* Wave Text */
.roycss-text-wave {
  display: inline-flex;
  font-weight: 700;
  color: oklch(0.696 0.149 162.48);
}

.roycss-text-wave > span {
  animation: roy-wave 1.5s ease-in-out infinite;
  display: inline-block;
}

.roycss-text-wave > span:nth-child(1) { animation-delay: 0s; }
.roycss-text-wave > span:nth-child(2) { animation-delay: 0.1s; }
.roycss-text-wave > span:nth-child(3) { animation-delay: 0.2s; }
.roycss-text-wave > span:nth-child(4) { animation-delay: 0.3s; }
.roycss-text-wave > span:nth-child(5) { animation-delay: 0.4s; }
.roycss-text-wave > span:nth-child(6) { animation-delay: 0.5s; }

@keyframes roy-wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}`,
  },

  // 12. text-bounce-letters
  {
    id: "text-bounce-letters",
    name: "Bounce Letters",
    category: "text",
    description: "Each letter bounces independently in a staggered rhythm",
    tags: ["bounce", "letters", "stagger", "text"],
    previewType: "text",
    previewText: "Bounce",
    cssCode: `/* Bounce Letters Text */
.roycss-text-bounce-letters {
  display: inline-flex;
  font-weight: 700;
  color: oklch(0.715 0.126 215.22);
}

.roycss-text-bounce-letters > span {
  display: inline-block;
  animation: roy-bounce-letters 1.6s ease-in-out infinite;
}

.roycss-text-bounce-letters > span:nth-child(1) { animation-delay: 0s; }
.roycss-text-bounce-letters > span:nth-child(2) { animation-delay: 0.1s; }
.roycss-text-bounce-letters > span:nth-child(3) { animation-delay: 0.2s; }
.roycss-text-bounce-letters > span:nth-child(4) { animation-delay: 0.3s; }
.roycss-text-bounce-letters > span:nth-child(5) { animation-delay: 0.4s; }
.roycss-text-bounce-letters > span:nth-child(6) { animation-delay: 0.5s; }

@keyframes roy-bounce-letters {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-14px); }
  60% { transform: translateY(-6px); }
}`,
  },

  // 13. text-flip
  {
    id: "text-flip",
    name: "Flip Text",
    category: "text",
    description: "Text continuously flips on its X axis like a rotating sign",
    tags: ["flip", "3d", "rotate", "text"],
    previewType: "text",
    cssCode: `/* Flip Text */
.roycss-text-flip {
  display: inline-block;
  font-weight: 700;
  color: oklch(0.606 0.219 292.72);
  transform-style: preserve-3d;
  perspective: 400px;
  animation: roy-text-flip 3s ease-in-out infinite;
}

@keyframes roy-text-flip {
  0%, 100% { transform: rotateX(0); }
  50% { transform: rotateX(360deg); }
}`,
  },

  // 14. text-stretch
  {
    id: "text-stretch",
    name: "Stretch Text",
    category: "text",
    description: "Letter spacing expands and contracts for a stretching effect",
    tags: ["stretch", "letterspacing", "animated", "text"],
    previewType: "text",
    cssCode: `/* Stretch Text */
.roycss-text-stretch {
  font-weight: 700;
  color: oklch(0.769 0.165 70.08);
  animation: roy-text-stretch 3s ease-in-out infinite;
}

@keyframes roy-text-stretch {
  0%, 100% { letter-spacing: 0px; }
  50% { letter-spacing: 12px; }
}`,
  },

  // 15. text-underline-draw
  {
    id: "text-underline-draw",
    name: "Underline Draw",
    category: "text",
    description: "An animated underline draws itself from left to right continuously",
    tags: ["underline", "draw", "animated", "text"],
    previewType: "text",
    cssCode: `/* Underline Draw Text */
.roycss-text-underline-draw {
  position: relative;
  display: inline-block;
  font-weight: 700;
  color: oklch(0.696 0.149 162.48);
}

.roycss-text-underline-draw::after {
  content: '';
  position: absolute;
  inset-block-end: -4px;
  inset-inline-start: 0;
  block-size: 3px;
  inline-size: 100%;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  transform: scaleX(0);
  transform-origin: left center;
  animation: roy-underline-draw 2.5s ease-in-out infinite;
}

@keyframes roy-underline-draw {
  0% { transform: scaleX(0); transform-origin: left; }
  50% { transform: scaleX(1); transform-origin: left; }
  50.01% { transform-origin: right; }
  100% { transform: scaleX(0); transform-origin: right; }
}`,
  },

  // 16. text-highlight-marker
  {
    id: "text-highlight-marker",
    name: "Marker Highlight",
    category: "text",
    description: "Text appears highlighted by a yellow marker stroke behind it",
    tags: ["highlight", "marker", "underline", "text"],
    previewType: "text",
    cssCode: `/* Marker Highlight Text */
.roycss-text-highlight-marker {
  font-weight: 700;
  color: oklch(0.208 0.04 265.75);
  background: linear-gradient(180deg, transparent 50%, oklch(0.905 0.166 98.11) 50%);
  padding: 0 4px;
}`,
  },

  // 17. text-shadow-long
  {
    id: "text-shadow-long",
    name: "Long Shadow",
    category: "text",
    description: "A long diagonal shadow extends from text for dramatic depth",
    tags: ["shadow", "long", "depth", "text"],
    previewType: "text",
    cssCode: `/* Long Shadow Text */
.roycss-text-shadow-long {
  color: oklch(0.982 0.018 155.83);
  font-weight: 700;
  text-shadow:
    1px 1px 0 oklch(0.696 0.149 162.48),
    2px 2px 0 oklch(0.596 0.127 162.48),
    3px 3px 0 oklch(0.596 0.127 163.23),
    4px 4px 0 oklch(0.508 0.105 165.61),
    5px 5px 0 oklch(0.432 0.086 166.91),
    6px 6px 0 oklch(0.378 0.073 168.94),
    7px 7px 0 oklch(0.316 0.057 174.79),
    8px 8px 0 oklch(0.273 0.05 171.23),
    9px 9px 0 oklch(0.234 0.041 173.33),
    10px 10px 12px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
}`,
  },

  // 18. text-shadow-soft
  {
    id: "text-shadow-soft",
    name: "Soft Shadow",
    category: "text",
    description: "A gentle blurred shadow gives text a soft floating appearance",
    tags: ["shadow", "soft", "blur", "text"],
    previewType: "text",
    cssCode: `/* Soft Shadow Text */
.roycss-text-shadow-soft {
  color: oklch(0.984 0.003 247.86);
  font-weight: 600;
  text-shadow:
    0 1px 2px color-mix(in oklch, oklch(0 0 0) 18%, transparent),
    0 4px 12px color-mix(in oklch, oklch(0.696 0.149 162.48) 25%, transparent),
    0 8px 24px color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
}`,
  },

  // 19. text-outline-offset
  {
    id: "text-outline-offset",
    name: "Outline Offset",
    category: "text",
    description: "Text with an outline drawn at an offset creating a ghosted echo",
    tags: ["outline", "offset", "echo", "text"],
    previewType: "text",
    cssCode: `/* Outline Offset Text */
.roycss-text-outline-offset {
  font-weight: 700;
  color: oklch(0.696 0.149 162.48);
  -webkit-text-stroke: 2px color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent);
  text-shadow:
    4px 4px 0 color-mix(in oklch, oklch(0.715 0.126 215.22) 50%, transparent),
    8px 8px 0 color-mix(in oklch, oklch(0.606 0.219 292.72) 40%, transparent);
}`,
  },

  // 20. text-holographic
  {
    id: "text-holographic",
    name: "Holographic",
    category: "text",
    description: "Text shifts through iridescent holographic colors with conic gradient",
    tags: ["holographic", "iridescent", "gradient", "text"],
    previewType: "text",
    cssCode: `/* Holographic Text */
.roycss-text-holographic {
  background: conic-gradient(
    from 0deg,
    oklch(0.741 0.2 345.28), oklch(0.893 0.167 94.55), oklch(0.774 0.148 148.57), oklch(0.776 0.112 188.54), oklch(0.709 0.159 293.54), oklch(0.741 0.2 345.28)
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
  filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(0.741 0.2 345.28) 50%, transparent));
  animation: roy-holo-shift 5s linear infinite;
}

@keyframes roy-holo-shift {
  from { background-position: 0% 0%; }
  to { background-position: 200% 200%; }
}`,
  },

  // 21. text-chrome
  {
    id: "text-chrome",
    name: "Chrome Text",
    category: "text",
    description: "Metallic chrome finish with reflective gradient layers",
    tags: ["chrome", "metal", "shiny", "text"],
    previewType: "text",
    cssCode: `/* Chrome Text */
.roycss-text-chrome {
  background: linear-gradient(
    180deg,
    oklch(0.962 0.058 95.62) 0%,
    oklch(0.984 0.003 247.86) 25%,
    oklch(0.711 0.035 256.79) 50%,
    oklch(0.984 0.003 247.86) 75%,
    oklch(0.869 0.02 252.89) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 800;
  letter-spacing: 1px;
  filter: drop-shadow(0 2px 2px color-mix(in oklch, oklch(0 0 0) 40%, transparent));
}`,
  },

  // 22. text-fire
  {
    id: "text-fire",
    name: "Fire Text",
    category: "text",
    description: "Text glows with warm flickering fire colors",
    tags: ["fire", "flame", "warm", "text"],
    previewType: "text",
    cssCode: `/* Fire Text */
.roycss-text-fire {
  font-weight: 800;
  color: oklch(0.905 0.166 98.11);
  text-shadow:
    0 -2px 4px oklch(0.945 0.124 101.54),
    0 -3px 6px oklch(0.905 0.166 98.11),
    0 -6px 10px oklch(0.861 0.173 91.94),
    0 -10px 16px oklch(0.769 0.165 70.08),
    0 -16px 24px oklch(0.646 0.194 41.12),
    0 -22px 32px oklch(0.577 0.215 27.33);
  animation: roy-fire-flicker 0.4s ease-in-out infinite alternate;
}

@keyframes roy-fire-flicker {
  from { filter: brightness(1) hue-rotate(0deg); }
  to { filter: brightness(1.15) hue-rotate(-8deg); }
}`,
  },

  // 23. text-reflection
  {
    id: "text-reflection",
    name: "Reflection",
    category: "text",
    description: "Text with a soft mirrored reflection beneath it",
    tags: ["reflection", "mirror", "glossy", "text"],
    previewType: "text",
    cssCode: `/* Reflection Text */
.roycss-text-reflection {
  position: relative;
  display: inline-block;
  font-weight: 700;
  color: oklch(0.715 0.126 215.22);
}

.roycss-text-reflection::after {
  content: attr(data-text);
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 100%;
  transform: scaleY(-1);
  transform-origin: top;
  background: linear-gradient(180deg, color-mix(in oklch, oklch(0.715 0.126 215.22) 50%, transparent) 0%, transparent 70%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  opacity: 0.6;
  pointer-events: none;
}`,
  },

  // 24. text-mirror
  {
    id: "text-mirror",
    name: "Mirror Text",
    category: "text",
    description: "Text is split with a vertical mirrored duplicate side by side",
    tags: ["mirror", "flip", "symmetry", "text"],
    previewType: "text",
    cssCode: `/* Mirror Text */
.roycss-text-mirror {
  display: inline-flex;
  font-weight: 700;
  color: oklch(0.606 0.219 292.72);
}

.roycss-text-mirror::after {
  content: attr(data-text);
  transform: scaleX(-1);
  margin-inline-start: 0.5ch;
  background: linear-gradient(90deg, oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}`,
  },

  // 25. text-skew
  {
    id: "text-skew",
    name: "Skew Text",
    category: "text",
    description: "Text is statically skewed into a fast italic-forward stance",
    tags: ["skew", "italic", "fast", "text"],
    previewType: "text",
    cssCode: `/* Skew Text */
.roycss-text-skew {
  display: inline-block;
  font-weight: 800;
  font-style: italic;
  color: oklch(0.984 0.003 247.86);
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  padding: 4px 14px;
  transform: skew(-10deg);
  letter-spacing: 2px;
  text-transform: uppercase;
  box-shadow: 4px 4px 0 color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}`,
  },
];
