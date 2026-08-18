import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 6
 * 36 effects: 12 scroll + 12 cursor + 12 page-transitions
 * Every class is prefixed `roycss-` and every keyframe is prefixed `roy-`.
 *
 * Because scroll/cursor/page-transition effects normally depend on runtime
 * input (scroll position, mouse coordinates, navigation events), each effect
 * here is shipped as a self-contained CSS animation/transition that visually
 * demonstrates the effect in a static preview. The `scroll-reveal-up` effect
 * additionally ships the semantic `.is-visible` toggle pattern for real use.
 */
export const effectsBatch6: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // SCROLL (12)
  // ═══════════════════════════════════════════════════════════════

  // 1. scroll-reveal-up
  {
    id: "scroll-reveal-up",
    name: "Scroll Reveal Up",
    category: "scroll",
    description:
      "Element slides up and fades in when scrolled into view via the .is-visible toggle pattern",
    tags: ["scroll", "reveal", "fade", "slide"],
    previewType: "box",
    cssCode: `/* Scroll Reveal Up — toggle .is-visible when the element enters the viewport */
.roycss-scroll-reveal-up {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s ease, transform 0.6s ease;
  will-change: opacity, transform;
}

.roycss-scroll-reveal-up.is-visible {
  opacity: 1;
  transform: translateY(0);
}`,
  },

  // 2. scroll-reveal-left
  {
    id: "scroll-reveal-left",
    name: "Scroll Reveal Left",
    category: "scroll",
    description:
      "Element slides in from the left and fades — loops to demo the reveal motion",
    tags: ["scroll", "reveal", "slide", "fade"],
    previewType: "box",
    cssCode: `/* Scroll Reveal Left */
.roycss-scroll-reveal-left {
  animation: roy-scroll-reveal-left 2.6s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-reveal-left {
  0% { opacity: 0; transform: translateX(-60px); }
  25%, 70% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(-60px); }
}`,
  },

  // 3. scroll-reveal-right
  {
    id: "scroll-reveal-right",
    name: "Scroll Reveal Right",
    category: "scroll",
    description:
      "Element slides in from the right and fades — loops to demo the reveal motion",
    tags: ["scroll", "reveal", "slide", "fade"],
    previewType: "box",
    cssCode: `/* Scroll Reveal Right */
.roycss-scroll-reveal-right {
  animation: roy-scroll-reveal-right 2.6s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-reveal-right {
  0% { opacity: 0; transform: translateX(60px); }
  25%, 70% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(60px); }
}`,
  },

  // 4. scroll-reveal-scale
  {
    id: "scroll-reveal-scale",
    name: "Scroll Reveal Scale",
    category: "scroll",
    description:
      "Element scales up from 0.6 and fades in — loops to demo the scroll-reveal motion",
    tags: ["scroll", "reveal", "scale", "fade"],
    previewType: "box",
    cssCode: `/* Scroll Reveal Scale */
.roycss-scroll-reveal-scale {
  animation: roy-scroll-reveal-scale 2.6s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-reveal-scale {
  0% { opacity: 0; transform: scale(0.6); }
  25%, 70% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.6); }
}`,
  },

  // 5. scroll-reveal-rotate
  {
    id: "scroll-reveal-rotate",
    name: "Scroll Reveal Rotate",
    category: "scroll",
    description:
      "Element rotates from -15deg and fades in — loops to demo the scroll-reveal motion",
    tags: ["scroll", "reveal", "rotate", "fade"],
    previewType: "box",
    cssCode: `/* Scroll Reveal Rotate */
.roycss-scroll-reveal-rotate {
  animation: roy-scroll-reveal-rotate 2.6s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-reveal-rotate {
  0% { opacity: 0; transform: rotate(-15deg) scale(0.85); }
  25%, 70% { opacity: 1; transform: rotate(0deg) scale(1); }
  100% { opacity: 0; transform: rotate(-15deg) scale(0.85); }
}`,
  },

  // 6. scroll-progress-bar
  {
    id: "scroll-progress-bar",
    name: "Scroll Progress Bar",
    category: "scroll",
    description:
      "A horizontal progress bar that fills based on scroll position — animates 0 to 100% to demo",
    tags: ["scroll", "progress", "bar", "indicator"],
    previewType: "box",
    cssCode: `/* Scroll Progress Bar */
.roycss-scroll-progress-bar {
  position: relative;
  inline-size: 100%;
  block-size: 8px;
  background: color-mix(in oklch, oklch(0.711 0.035 256.79) 25%, transparent);
  border-radius: 999px;
  overflow: hidden;
}

.roycss-scroll-progress-bar::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  inline-size: 0;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22), oklch(0.585 0.204 277.12));
  border-radius: inherit;
  box-shadow: 0 0 12px color-mix(in oklch, oklch(0.797 0.134 211.53) 50%, transparent);
  animation: roy-scroll-progress-fill 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes roy-scroll-progress-fill {
  0% { inline-size: 0; }
  70%, 100% { inline-size: 100%; }
}`,
  },

  // 7. scroll-indicator
  {
    id: "scroll-indicator",
    name: "Scroll Indicator",
    category: "scroll",
    description:
      "A bouncing scroll-down mouse indicator with an animated wheel and arrow",
    tags: ["scroll", "indicator", "bounce", "arrow"],
    previewType: "box",
    cssCode: `/* Scroll Indicator */
.roycss-scroll-indicator {
  position: relative;
  inline-size: 28px;
  block-size: 46px;
  border: 2px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 65%, transparent);
  border-radius: 14px;
  background: transparent;
}

.roycss-scroll-indicator::before {
  content: "";
  position: absolute;
  inset-block-start: 8px;
  inset-inline-start: 50%;
  inline-size: 4px;
  block-size: 8px;
  margin-inline-start: -2px;
  background: oklch(0.696 0.149 162.48);
  border-radius: 2px;
  animation: roy-scroll-indicator-wheel 1.8s ease-in-out infinite;
}

.roycss-scroll-indicator::after {
  content: "";
  position: absolute;
  inset-block-end: 6px;
  inset-inline-start: 50%;
  inline-size: 7px;
  block-size: 7px;
  margin-inline-start: -3.5px;
  border-inline-end: 2px solid oklch(0.696 0.149 162.48);
  border-block-end: 2px solid oklch(0.696 0.149 162.48);
  transform: rotate(45deg);
  animation: roy-scroll-indicator-arrow 1.8s ease-in-out infinite;
}

@keyframes roy-scroll-indicator-wheel {
  0% { transform: translateY(0); opacity: 1; }
  70%, 100% { transform: translateY(14px); opacity: 0; }
}

@keyframes roy-scroll-indicator-arrow {
  0%, 100% { opacity: 0; transform: rotate(45deg) translate(-3px, -3px); }
  50% { opacity: 1; transform: rotate(45deg) translate(0, 0); }
}`,
  },

  // 8. scroll-parallax-slow
  {
    id: "scroll-parallax-slow",
    name: "Scroll Parallax Slow",
    category: "scroll",
    description:
      "Parallax layer that drifts slower than the scroll — blobs float across a grid backdrop",
    tags: ["scroll", "parallax", "drift", "background"],
    previewType: "background",
    cssCode: `/* Scroll Parallax Slow */
.roycss-scroll-parallax-slow {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
}

.roycss-scroll-parallax-slow::before {
  content: "";
  position: absolute;
  inline-size: 90px;
  block-size: 90px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -45px 0 0 -45px;
  background: radial-gradient(circle at 30% 30%, oklch(0.585 0.204 277.12), oklch(0.715 0.126 215.22) 70%);
  filter: blur(2px);
  animation: roy-scroll-parallax-drift 6s ease-in-out infinite;
}

.roycss-scroll-parallax-slow::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0 18px,
    color-mix(in oklch, oklch(0.711 0.035 256.79) 8%, transparent) 18px 19px
  );
  animation: roy-scroll-parallax-grid 6s linear infinite;
}

@keyframes roy-scroll-parallax-drift {
  0%, 100% { transform: translate(-25px, -30px) scale(1.1); }
  50% { transform: translate(25px, 30px) scale(1); }
}

@keyframes roy-scroll-parallax-grid {
  0% { background-position: 0 0; }
  100% { background-position: 0 60px; }
}`,
  },

  // 9. scroll-sticky-header
  {
    id: "scroll-sticky-header",
    name: "Scroll Sticky Header",
    category: "scroll",
    description:
      "Header that sticks and shrinks on scroll — animates between expanded and compact states",
    tags: ["scroll", "sticky", "header", "shrink"],
    previewType: "card",
    cssCode: `/* Scroll Sticky Header */
.roycss-scroll-sticky-header {
  display: flex;
  align-items: center;
  block-size: 64px;
  padding: 0 22px;
  background: linear-gradient(90deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
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
    block-size: 64px;
    font-size: 18px;
    padding: 0 22px;
    background: linear-gradient(90deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
    box-shadow: 0 6px 20px color-mix(in oklch, oklch(0.129 0.041 264.7) 40%, transparent);
  }
  50%, 85% {
    block-size: 36px;
    font-size: 13px;
    padding: 0 14px;
    background: linear-gradient(90deg, oklch(0.129 0.041 264.7), oklch(0.208 0.04 265.75));
    box-shadow: 0 10px 26px color-mix(in oklch, oklch(0.129 0.041 264.7) 70%, transparent);
    letter-spacing: 0.04em;
  }
  100% {
    block-size: 64px;
    font-size: 18px;
    padding: 0 22px;
  }
}`,
  },

  // 10. scroll-fade-out
  {
    id: "scroll-fade-out",
    name: "Scroll Fade Out",
    category: "scroll",
    description:
      "Element fades and drifts upward as it scrolls out of view — loops to demo the exit motion",
    tags: ["scroll", "fade", "exit", "slide"],
    previewType: "box",
    cssCode: `/* Scroll Fade Out */
.roycss-scroll-fade-out {
  animation: roy-scroll-fade-out 2.6s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-fade-out {
  0%, 25% { opacity: 1; transform: translateY(0); }
  75%, 100% { opacity: 0; transform: translateY(-32px); }
}`,
  },

  // 11. scroll-zoom-in
  {
    id: "scroll-zoom-in",
    name: "Scroll Zoom In",
    category: "scroll",
    description:
      "Element zooms in as it scrolls into view — scales between 0.85 and 1.05 to demo the zoom",
    tags: ["scroll", "zoom", "scale", "reveal"],
    previewType: "box",
    cssCode: `/* Scroll Zoom In */
.roycss-scroll-zoom-in {
  animation: roy-scroll-zoom-in 2.8s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes roy-scroll-zoom-in {
  0% { opacity: 0.4; transform: scale(0.8); }
  40%, 60% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.4; transform: scale(0.8); }
}`,
  },

  // 12. scroll-horizontal
  {
    id: "scroll-horizontal",
    name: "Scroll Horizontal Indicator",
    category: "scroll",
    description:
      "Horizontal scroll indicator with an animated knob sliding along a track",
    tags: ["scroll", "horizontal", "indicator", "track"],
    previewType: "box",
    cssCode: `/* Scroll Horizontal Indicator */
.roycss-scroll-horizontal {
  position: relative;
  inline-size: 100%;
  block-size: 6px;
  background: color-mix(in oklch, oklch(0.711 0.035 256.79) 25%, transparent);
  border-radius: 999px;
  overflow: hidden;
}

.roycss-scroll-horizontal::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, color-mix(in oklch, oklch(0.769 0.165 70.08) 25%, transparent), transparent);
  background-size: 80px 100%;
  animation: roy-scroll-horizontal-sheen 1.6s linear infinite;
}

.roycss-scroll-horizontal::after {
  content: "";
  position: absolute;
  inset-block-start: -3px;
  inset-inline-start: 0;
  inline-size: 24px;
  block-size: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, oklch(0.769 0.165 70.08), oklch(0.637 0.208 25.33));
  box-shadow: 0 0 12px color-mix(in oklch, oklch(0.769 0.165 70.08) 60%, transparent);
  animation: roy-scroll-horizontal-move 2.8s ease-in-out infinite;
}

@keyframes roy-scroll-horizontal-sheen {
  0% { background-position: -80px 0; }
  100% { background-position: 100% 0; }
}

@keyframes roy-scroll-horizontal-move {
  0%, 100% { inset-inline-start: 0; }
  50% { inset-inline-start: calc(100% - 24px); }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // CURSOR (12)
  // ═══════════════════════════════════════════════════════════════

  // 1. cursor-glow-dot
  {
    id: "cursor-glow-dot",
    name: "Cursor Glow Dot",
    category: "cursor",
    description:
      "A glowing dot that orbits in a soft path — simulates a glow following the cursor",
    tags: ["cursor", "glow", "dot", "follow"],
    previewType: "background",
    cssCode: `/* Cursor Glow Dot */
.roycss-cursor-glow-dot {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.21 0.032 264.66), oklch(0.177 0.034 269.56));
  overflow: hidden;
}

.roycss-cursor-glow-dot::before {
  content: "";
  position: absolute;
  inline-size: 10px;
  block-size: 10px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -5px 0 0 -5px;
  background: oklch(0.797 0.134 211.53);
  box-shadow:
    0 0 12px 4px color-mix(in oklch, oklch(0.797 0.134 211.53) 85%, transparent),
    0 0 28px 8px color-mix(in oklch, oklch(0.797 0.134 211.53) 40%, transparent);
  animation: roy-cursor-glow-orbit 3s linear infinite;
}

@keyframes roy-cursor-glow-orbit {
  0% { transform: translate(-22px, -10px); }
  25% { transform: translate(0, -20px); }
  50% { transform: translate(22px, -10px); }
  75% { transform: translate(0, 12px); }
  100% { transform: translate(-22px, -10px); }
}`,
  },

  // 2. cursor-trail
  {
    id: "cursor-trail",
    name: "Cursor Trail",
    category: "cursor",
    description:
      "A comet-like dot with a fading multi-dot trail that sweeps across the canvas",
    tags: ["cursor", "trail", "comet", "follow"],
    previewType: "background",
    cssCode: `/* Cursor Trail */
.roycss-cursor-trail {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.203 0.06 297.11), oklch(0.177 0.034 269.56));
  overflow: hidden;
}

.roycss-cursor-trail::before {
  content: "";
  position: absolute;
  inline-size: 9px;
  block-size: 9px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -4.5px 0 0 -4.5px;
  background: oklch(0.725 0.175 349.76);
  box-shadow:
    0 0 10px 2px color-mix(in oklch, oklch(0.725 0.175 349.76) 70%, transparent),
    -10px 5px 0 -1px color-mix(in oklch, oklch(0.725 0.175 349.76) 80%, transparent),
    -20px 10px 0 -2px color-mix(in oklch, oklch(0.725 0.175 349.76) 55%, transparent),
    -30px 15px 0 -3px color-mix(in oklch, oklch(0.725 0.175 349.76) 35%, transparent),
    -40px 20px 0 -3px color-mix(in oklch, oklch(0.725 0.175 349.76) 18%, transparent);
  animation: roy-cursor-trail-sweep 3.2s ease-in-out infinite;
}

@keyframes roy-cursor-trail-sweep {
  0%, 100% { transform: translate(-26px, -8px); }
  50% { transform: translate(26px, 8px); }
}`,
  },

  // 3. cursor-blob
  {
    id: "cursor-blob",
    name: "Cursor Blob",
    category: "cursor",
    description:
      "A morphing gradient blob that drifts and reshapes — follows the cursor with elastic motion",
    tags: ["cursor", "blob", "morph", "follow"],
    previewType: "background",
    cssCode: `/* Cursor Blob */
.roycss-cursor-blob {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.21 0.032 264.66), oklch(0.177 0.034 269.56));
  overflow: hidden;
}

.roycss-cursor-blob::before {
  content: "";
  position: absolute;
  inline-size: 44px;
  block-size: 44px;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -22px 0 0 -22px;
  background: linear-gradient(135deg, oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31));
  filter: blur(3px);
  border-radius: 60% 40% 50% 50% / 50% 60% 40% 50%;
  animation:
    roy-cursor-blob-morph 4s ease-in-out infinite,
    roy-cursor-blob-drift 5s ease-in-out infinite;
}

@keyframes roy-cursor-blob-morph {
  0%, 100% { border-radius: 60% 40% 50% 50% / 50% 60% 40% 50%; }
  33% { border-radius: 40% 60% 60% 40% / 60% 40% 50% 50%; }
  66% { border-radius: 50% 50% 40% 60% / 40% 50% 60% 50%; }
}

@keyframes roy-cursor-blob-drift {
  0%, 100% { transform: translate(-16px, -10px); }
  25% { transform: translate(10px, -16px); }
  50% { transform: translate(16px, 12px); }
  75% { transform: translate(-12px, 14px); }
}`,
  },

  // 4. cursor-ring
  {
    id: "cursor-ring",
    name: "Cursor Ring",
    category: "cursor",
    description:
      "An expanding ring with a small dot — simulates a cursor ring follower that pulses outward",
    tags: ["cursor", "ring", "pulse", "follow"],
    previewType: "background",
    cssCode: `/* Cursor Ring */
.roycss-cursor-ring {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.194 0.039 264.9), oklch(0.177 0.034 269.56));
  overflow: hidden;
}

.roycss-cursor-ring::before {
  content: "";
  position: absolute;
  inline-size: 14px;
  block-size: 14px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -7px 0 0 -7px;
  border: 2px solid oklch(0.797 0.134 211.53);
  animation:
    roy-cursor-ring-orbit 3s linear infinite,
    roy-cursor-ring-pulse 1.6s ease-out infinite;
}

.roycss-cursor-ring::after {
  content: "";
  position: absolute;
  inline-size: 6px;
  block-size: 6px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -3px 0 0 -3px;
  background: oklch(0.797 0.134 211.53);
  box-shadow: 0 0 10px 2px color-mix(in oklch, oklch(0.797 0.134 211.53) 80%, transparent);
  animation: roy-cursor-ring-orbit 3s linear infinite;
}

@keyframes roy-cursor-ring-orbit {
  0% { transform: translate(-20px, -10px); }
  50% { transform: translate(20px, 10px); }
  100% { transform: translate(-20px, -10px); }
}

@keyframes roy-cursor-ring-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.797 0.134 211.53) 60%, transparent); }
  100% { box-shadow: 0 0 0 16px color-mix(in oklch, oklch(0.797 0.134 211.53) 0%, transparent); }
}`,
  },

  // 5. cursor-ripple
  {
    id: "cursor-ripple",
    name: "Cursor Ripple",
    category: "cursor",
    description:
      "Concentric ripples expanding outward from the cursor position — two staggered rings",
    tags: ["cursor", "ripple", "ring", "expand"],
    previewType: "background",
    cssCode: `/* Cursor Ripple */
.roycss-cursor-ripple {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.258 0.042 166.13), oklch(0.177 0.034 269.56));
  overflow: hidden;
}

.roycss-cursor-ripple::before,
.roycss-cursor-ripple::after {
  content: "";
  position: absolute;
  inline-size: 16px;
  block-size: 16px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -8px 0 0 -8px;
  border: 2px solid oklch(0.696 0.149 162.48);
  animation: roy-cursor-ripple-expand 1.8s ease-out infinite;
}

.roycss-cursor-ripple::after {
  animation-delay: 0.9s;
  border-color: oklch(0.773 0.153 163.22);
}

@keyframes roy-cursor-ripple-expand {
  0% { transform: scale(0.4); opacity: 1; }
  100% { transform: scale(3.8); opacity: 0; }
}`,
  },

  // 6. cursor-spotlight
  {
    id: "cursor-spotlight",
    name: "Cursor Spotlight",
    category: "cursor",
    description:
      "A soft radial spotlight that follows the cursor — drifts across a dark surface with a glowing core",
    tags: ["cursor", "spotlight", "glow", "follow"],
    previewType: "background",
    cssCode: `/* Cursor Spotlight */
.roycss-cursor-spotlight {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.257 0.086 281.29));
  overflow: hidden;
}

.roycss-cursor-spotlight::before {
  content: "";
  position: absolute;
  inline-size: 130px;
  block-size: 130px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -65px 0 0 -65px;
  background: radial-gradient(circle, color-mix(in oklch, oklch(0.797 0.134 211.53) 45%, transparent), color-mix(in oklch, oklch(0.797 0.134 211.53) 15%, transparent) 40%, transparent 70%);
  pointer-events: none;
  animation: roy-cursor-spotlight-move 4.5s ease-in-out infinite;
}

.roycss-cursor-spotlight::after {
  content: "";
  position: absolute;
  inline-size: 9px;
  block-size: 9px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -4.5px 0 0 -4.5px;
  background: oklch(0.865 0.115 207.08);
  box-shadow: 0 0 14px 3px color-mix(in oklch, oklch(0.797 0.134 211.53) 85%, transparent);
  animation: roy-cursor-spotlight-move 4.5s ease-in-out infinite;
}

@keyframes roy-cursor-spotlight-move {
  0%, 100% { transform: translate(-34px, -18px); }
  25% { transform: translate(24px, -24px); }
  50% { transform: translate(34px, 18px); }
  75% { transform: translate(-24px, 22px); }
}`,
  },

  // 7. cursor-magnetic
  {
    id: "cursor-magnetic",
    name: "Cursor Magnetic",
    category: "cursor",
    description:
      "Magnetic attraction effect — the label gravitates toward the cursor and scales on hover",
    tags: ["cursor", "magnetic", "hover", "attract"],
    previewType: "box",
    cssCode: `/* Cursor Magnetic — hover to feel the magnetic pull */
.roycss-cursor-magnetic {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, oklch(0.177 0.034 269.56), oklch(0.21 0.032 264.66));
  border: 1px solid color-mix(in oklch, oklch(0.711 0.035 256.79) 25%, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition:
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.roycss-cursor-magnetic::before {
  content: "Hover";
  color: oklch(0.711 0.035 256.79);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition:
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    color 0.3s ease;
}

.roycss-cursor-magnetic:hover {
  transform: scale(1.1);
  border-color: color-mix(in oklch, oklch(0.797 0.134 211.53) 60%, transparent);
  box-shadow: 0 0 24px color-mix(in oklch, oklch(0.797 0.134 211.53) 35%, transparent);
}

.roycss-cursor-magnetic:hover::before {
  transform: translateY(-5px) scale(1.12);
  color: oklch(0.797 0.134 211.53);
}`,
  },

  // 8. cursor-crosshair
  {
    id: "cursor-crosshair",
    name: "Cursor Crosshair",
    category: "cursor",
    description:
      "An animated crosshair with glowing horizontal and vertical bars that drift together",
    tags: ["cursor", "crosshair", "target", "follow"],
    previewType: "background",
    cssCode: `/* Cursor Crosshair */
.roycss-cursor-crosshair {
  position: relative;
  background:
    linear-gradient(0deg, transparent 49.5%, color-mix(in oklch, oklch(0.711 0.035 256.79) 8%, transparent) 49.5% 50.5%, transparent 50.5%),
    linear-gradient(90deg, transparent 49.5%, color-mix(in oklch, oklch(0.711 0.035 256.79) 8%, transparent) 49.5% 50.5%, transparent 50.5%),
    radial-gradient(circle at 50% 50%, oklch(0.192 0.035 314.78), oklch(0.177 0.034 269.56));
  overflow: hidden;
}

.roycss-cursor-crosshair::before,
.roycss-cursor-crosshair::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  background: oklch(0.645 0.215 16.44);
  box-shadow: 0 0 10px color-mix(in oklch, oklch(0.645 0.215 16.44) 85%, transparent);
  animation: roy-cursor-crosshair-move 3s ease-in-out infinite;
}

.roycss-cursor-crosshair::before {
  inline-size: 26px;
  block-size: 2px;
  margin: -1px 0 0 -13px;
}

.roycss-cursor-crosshair::after {
  inline-size: 2px;
  block-size: 26px;
  margin: -13px 0 0 -1px;
}

@keyframes roy-cursor-crosshair-move {
  0%, 100% { transform: translate(-22px, -12px); }
  50% { transform: translate(22px, 14px); }
}`,
  },

  // 9. cursor-arrow-bounce
  {
    id: "cursor-arrow-bounce",
    name: "Cursor Arrow Bounce",
    category: "cursor",
    description:
      "A bouncing pointer arrow with a pulsing target ring — simulates an active cursor indicator",
    tags: ["cursor", "arrow", "bounce", "pointer"],
    previewType: "background",
    cssCode: `/* Cursor Arrow Bounce */
.roycss-cursor-arrow-bounce {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.234 0.039 67.22), oklch(0.177 0.034 269.56));
  overflow: hidden;
}

.roycss-cursor-arrow-bounce::before {
  content: "";
  position: absolute;
  inline-size: 0;
  block-size: 0;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  border-inline-start: 9px solid transparent;
  border-block-start: 15px solid oklch(0.769 0.165 70.08);
  filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(0.769 0.165 70.08) 75%, transparent));
  transform-origin: 0 0;
  animation: roy-cursor-arrow-bounce 1.4s ease-in-out infinite;
}

.roycss-cursor-arrow-bounce::after {
  content: "";
  position: absolute;
  inline-size: 26px;
  block-size: 26px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -13px 0 0 -13px;
  border: 1.5px dashed color-mix(in oklch, oklch(0.769 0.165 70.08) 55%, transparent);
  animation: roy-cursor-arrow-ring 1.4s ease-out infinite;
}

@keyframes roy-cursor-arrow-bounce {
  0%, 100% { transform: translate(-16px, -16px); }
  50% { transform: translate(16px, 16px); }
}

@keyframes roy-cursor-arrow-ring {
  0% { transform: scale(0.6); opacity: 0.85; }
  100% { transform: scale(1.7); opacity: 0; }
}`,
  },

  // 10. cursor-pulse-ring
  {
    id: "cursor-pulse-ring",
    name: "Cursor Pulse Ring",
    category: "cursor",
    description:
      "A pulsing ring that orbits with a glowing dot — simulates a sonar pulse around the cursor",
    tags: ["cursor", "pulse", "ring", "sonar"],
    previewType: "background",
    cssCode: `/* Cursor Pulse Ring */
.roycss-cursor-pulse-ring {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.209 0.061 305.58), oklch(0.177 0.034 269.56));
  overflow: hidden;
}

.roycss-cursor-pulse-ring::before {
  content: "";
  position: absolute;
  inline-size: 9px;
  block-size: 9px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -4.5px 0 0 -4.5px;
  background: oklch(0.627 0.233 303.9);
  box-shadow: 0 0 12px 3px color-mix(in oklch, oklch(0.627 0.233 303.9) 85%, transparent);
  animation: roy-cursor-pulse-dot 3s ease-in-out infinite;
}

.roycss-cursor-pulse-ring::after {
  content: "";
  position: absolute;
  inline-size: 26px;
  block-size: 26px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -13px 0 0 -13px;
  border: 2px solid oklch(0.627 0.233 303.9);
  animation: roy-cursor-pulse-ring 3s ease-in-out infinite;
}

@keyframes roy-cursor-pulse-dot {
  0%, 100% { transform: translate(-16px, -10px); }
  50% { transform: translate(16px, 10px); }
}

@keyframes roy-cursor-pulse-ring {
  0%, 100% { transform: translate(-16px, -10px) scale(1); opacity: 0.7; }
  50% { transform: translate(16px, 10px) scale(1.7); opacity: 0; }
}`,
  },

  // 11. cursor-gradient-trail
  {
    id: "cursor-gradient-trail",
    name: "Cursor Gradient Trail",
    category: "cursor",
    description:
      "A spinning gradient arc with an orbiting dot — simulates a colorful trail swirling around the cursor",
    tags: ["cursor", "gradient", "trail", "spin"],
    previewType: "background",
    cssCode: `/* Cursor Gradient Trail */
.roycss-cursor-gradient-trail {
  position: relative;
  background: radial-gradient(circle at 50% 50%, oklch(0.203 0.06 297.11), oklch(0.177 0.034 269.56));
  overflow: hidden;
}

.roycss-cursor-gradient-trail::before {
  content: "";
  position: absolute;
  inline-size: 76px;
  block-size: 76px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -38px 0 0 -38px;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    color-mix(in oklch, oklch(0.725 0.175 349.76) 90%, transparent) 60deg,
    color-mix(in oklch, oklch(0.797 0.134 211.53) 90%, transparent) 120deg,
    transparent 180deg,
    transparent 360deg
  );
  filter: blur(2px);
  animation: roy-cursor-gradient-spin 2.4s linear infinite;
}

.roycss-cursor-gradient-trail::after {
  content: "";
  position: absolute;
  inline-size: 10px;
  block-size: 10px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -5px 0 0 -5px;
  background: oklch(0.797 0.134 211.53);
  box-shadow: 0 0 12px 3px color-mix(in oklch, oklch(0.797 0.134 211.53) 85%, transparent);
  animation: roy-cursor-gradient-orbit 3s linear infinite;
}

@keyframes roy-cursor-gradient-spin {
  to { transform: rotate(360deg); }
}

@keyframes roy-cursor-gradient-orbit {
  0% { transform: rotate(0deg) translateX(22px); }
  100% { transform: rotate(360deg) translateX(22px); }
}`,
  },

  // 12. cursor-firefly
  {
    id: "cursor-firefly",
    name: "Cursor Firefly",
    category: "cursor",
    description:
      "Two firefly-like glowing dots drifting and pulsing in brightness — a calming cursor companion",
    tags: ["cursor", "firefly", "glow", "drift"],
    previewType: "background",
    cssCode: `/* Cursor Firefly */
.roycss-cursor-firefly {
  position: relative;
  background: linear-gradient(135deg, oklch(0.173 0.034 269.46), oklch(0.203 0.06 297.11));
  overflow: hidden;
}

.roycss-cursor-firefly::before {
  content: "";
  position: absolute;
  inline-size: 7px;
  block-size: 7px;
  border-radius: 50%;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  margin: -3.5px 0 0 -3.5px;
  background: oklch(0.905 0.166 98.11);
  box-shadow:
    0 0 8px 2px color-mix(in oklch, oklch(0.905 0.166 98.11) 95%, transparent),
    0 0 22px 6px color-mix(in oklch, oklch(0.905 0.166 98.11) 40%, transparent);
  animation:
    roy-cursor-firefly-drift 5s ease-in-out infinite,
    roy-cursor-firefly-glow 1.4s ease-in-out infinite;
}

.roycss-cursor-firefly::after {
  content: "";
  position: absolute;
  inline-size: 5px;
  block-size: 5px;
  border-radius: 50%;
  inset-block-start: 32%;
  inset-inline-start: 30%;
  background: oklch(0.945 0.124 101.54);
  box-shadow:
    0 0 7px 1px color-mix(in oklch, oklch(0.945 0.124 101.54) 85%, transparent),
    0 0 16px 4px color-mix(in oklch, oklch(0.945 0.124 101.54) 35%, transparent);
  animation:
    roy-cursor-firefly-drift2 6s ease-in-out infinite,
    roy-cursor-firefly-glow 1.8s ease-in-out 0.5s infinite;
}

@keyframes roy-cursor-firefly-drift {
  0%, 100% { transform: translate(-26px, -14px); }
  25% { transform: translate(16px, -22px); }
  50% { transform: translate(26px, 16px); }
  75% { transform: translate(-16px, 20px); }
}

@keyframes roy-cursor-firefly-drift2 {
  0%, 100% { transform: translate(22px, 18px); }
  33% { transform: translate(-22px, 10px); }
  66% { transform: translate(8px, -20px); }
}

@keyframes roy-cursor-firefly-glow {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // PAGE-TRANSITIONS (12)
  // ═══════════════════════════════════════════════════════════════

  // 1. page-fade
  {
    id: "page-fade",
    name: "Page Fade",
    category: "page-transitions",
    description:
      "Full-page fade transition — the incoming page fades in and out in a soft loop",
    tags: ["page", "transition", "fade", "opacity"],
    previewType: "background",
    cssCode: `/* Page Fade */
.roycss-page-fade {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
}

.roycss-page-fade::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, oklch(0.585 0.204 277.12), oklch(0.656 0.212 354.31));
  border-radius: 6px;
  box-shadow: 0 12px 32px color-mix(in oklch, oklch(0.585 0.204 277.12) 40%, transparent);
  animation: roy-page-fade 2.8s ease-in-out infinite;
}

@keyframes roy-page-fade {
  0% { opacity: 0; }
  30%, 60% { opacity: 1; }
  100% { opacity: 0; }
}`,
  },

  // 2. page-slide-left
  {
    id: "page-slide-left",
    name: "Page Slide Left",
    category: "page-transitions",
    description:
      "Page slides in from the right and exits to the left — a horizontal pan transition loop",
    tags: ["page", "transition", "slide", "horizontal"],
    previewType: "background",
    cssCode: `/* Page Slide Left */
.roycss-page-slide-left {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
}

.roycss-page-slide-inset-inline-start::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, oklch(0.715 0.126 215.22), oklch(0.623 0.188 259.81));
  border-radius: 6px;
  box-shadow: 0 12px 32px color-mix(in oklch, oklch(0.623 0.188 259.81) 40%, transparent);
  animation: roy-page-slide-left 3.2s ease-in-out infinite;
}

@keyframes roy-page-slide-left {
  0% { transform: translateX(100%); opacity: 0; }
  30%, 60% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(-100%); opacity: 0; }
}`,
  },

  // 3. page-slide-up
  {
    id: "page-slide-up",
    name: "Page Slide Up",
    category: "page-transitions",
    description:
      "Page slides up from the bottom and exits through the top — a vertical pan transition loop",
    tags: ["page", "transition", "slide", "vertical"],
    previewType: "background",
    cssCode: `/* Page Slide Up */
.roycss-page-slide-up {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
}

.roycss-page-slide-up::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.768 0.204 130.85));
  border-radius: 6px;
  box-shadow: 0 12px 32px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
  animation: roy-page-slide-up 3.2s ease-in-out infinite;
}

@keyframes roy-page-slide-up {
  0% { transform: translateY(100%); opacity: 0; }
  30%, 60% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-100%); opacity: 0; }
}`,
  },

  // 4. page-curtain
  {
    id: "page-curtain",
    name: "Page Curtain",
    category: "page-transitions",
    description:
      "Curtain reveal transition — two dark panels slide apart to unveil the colorful page beneath",
    tags: ["page", "transition", "curtain", "reveal"],
    previewType: "background",
    cssCode: `/* Page Curtain */
.roycss-page-curtain {
  position: relative;
  background: linear-gradient(135deg, oklch(0.541 0.247 293.01), oklch(0.592 0.218 0.58));
  overflow: hidden;
}

.roycss-page-curtain::before,
.roycss-page-curtain::after {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-block-end: 0;
  inline-size: 50%;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
}

.roycss-page-curtain::before {
  inset-inline-start: 0;
  border-inline-end: 1px solid color-mix(in oklch, oklch(1 0 89.88) 12%, transparent);
  animation: roy-page-curtain-left 3.4s ease-in-out infinite;
}

.roycss-page-curtain::after {
  inset-inline-end: 0;
  border-inline-start: 1px solid color-mix(in oklch, oklch(1 0 89.88) 12%, transparent);
  animation: roy-page-curtain-right 3.4s ease-in-out infinite;
}

@keyframes roy-page-curtain-left {
  0%, 25% { transform: translateX(0); }
  50%, 75% { transform: translateX(-100%); }
  100% { transform: translateX(0); }
}

@keyframes roy-page-curtain-right {
  0%, 25% { transform: translateX(0); }
  50%, 75% { transform: translateX(100%); }
  100% { transform: translateX(0); }
}`,
  },

  // 5. page-zoom
  {
    id: "page-zoom",
    name: "Page Zoom",
    category: "page-transitions",
    description:
      "Page zooms in from the center and scales out — a focal zoom transition loop",
    tags: ["page", "transition", "zoom", "scale"],
    previewType: "background",
    cssCode: `/* Page Zoom */
.roycss-page-zoom {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
}

.roycss-page-zoom::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, oklch(0.769 0.165 70.08), oklch(0.637 0.208 25.33));
  border-radius: 6px;
  box-shadow: 0 12px 32px color-mix(in oklch, oklch(0.637 0.208 25.33) 40%, transparent);
  animation: roy-page-zoom 2.8s ease-in-out infinite;
}

@keyframes roy-page-zoom {
  0% { transform: scale(0); opacity: 0; }
  30%, 60% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}`,
  },

  // 6. page-flip
  {
    id: "page-flip",
    name: "Page Flip",
    category: "page-transitions",
    description:
      "3D page flip transition — the page rotates on its vertical axis like a turning book page",
    tags: ["page", "transition", "flip", "3d"],
    previewType: "background",
    cssCode: `/* Page Flip */
.roycss-page-flip {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
  perspective: 800px;
}

.roycss-page-flip::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, oklch(0.769 0.165 70.08), oklch(0.637 0.208 25.33));
  border-radius: 6px;
  box-shadow: 0 12px 32px color-mix(in oklch, oklch(0.769 0.165 70.08) 40%, transparent);
  backface-visibility: hidden;
  transform-origin: left center;
  animation: roy-page-flip 3.4s ease-in-out infinite;
}

@keyframes roy-page-flip {
  0%, 10% { transform: rotateY(0deg); opacity: 1; }
  40% { transform: rotateY(-90deg); opacity: 0.4; }
  50% { transform: rotateY(-180deg); opacity: 0; }
  60% { transform: rotateY(-180deg); opacity: 0; }
  90%, 100% { transform: rotateY(-360deg); opacity: 1; }
}`,
  },

  // 7. page-circle-reveal
  {
    id: "page-circle-reveal",
    name: "Page Circle Reveal",
    category: "page-transitions",
    description:
      "Circular mask reveal transition — the page appears through an expanding circle clip-path",
    tags: ["page", "transition", "circle", "mask"],
    previewType: "background",
    cssCode: `/* Page Circle Reveal */
.roycss-page-circle-reveal {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
}

.roycss-page-circle-reveal::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72));
  border-radius: 6px;
  box-shadow: 0 12px 32px color-mix(in oklch, oklch(0.606 0.219 292.72) 40%, transparent);
  clip-path: circle(0% at 50% 50%);
  animation: roy-page-circle-reveal 3s ease-in-out infinite;
}

@keyframes roy-page-circle-reveal {
  0% { clip-path: circle(0% at 50% 50%); opacity: 0; }
  30%, 60% { clip-path: circle(75% at 50% 50%); opacity: 1; }
  100% { clip-path: circle(0% at 50% 50%); opacity: 0; }
}`,
  },

  // 8. page-mask-reveal
  {
    id: "page-mask-reveal",
    name: "Page Mask Reveal",
    category: "page-transitions",
    description:
      "Mask wipe transition — the page is revealed left-to-right via an animated inset clip-path",
    tags: ["page", "transition", "mask", "wipe"],
    previewType: "background",
    cssCode: `/* Page Mask Reveal */
.roycss-page-mask-reveal {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
}

.roycss-page-mask-reveal::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72));
  border-radius: 6px;
  box-shadow: 0 12px 32px color-mix(in oklch, oklch(0.656 0.212 354.31) 40%, transparent);
  clip-path: inset(0 100% 0 0);
  animation: roy-page-mask-reveal 3s ease-in-out infinite;
}

@keyframes roy-page-mask-reveal {
  0% { clip-path: inset(0 100% 0 0); opacity: 0; }
  30%, 60% { clip-path: inset(0 0 0 0); opacity: 1; }
  100% { clip-path: inset(0 0 0 100%); opacity: 0; }
}`,
  },

  // 9. page-cube
  {
    id: "page-cube",
    name: "Page Cube",
    category: "page-transitions",
    description:
      "3D cube rotation transition — the page face rotates in 3D space with perspective depth",
    tags: ["page", "transition", "cube", "3d"],
    previewType: "background",
    cssCode: `/* Page Cube */
.roycss-page-cube {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
  perspective: 700px;
}

.roycss-page-cube::before {
  content: "";
  position: absolute;
  inset: 12px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22));
  border-radius: 6px;
  box-shadow: 0 12px 32px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
  animation: roy-page-cube 3.6s ease-in-out infinite;
}

@keyframes roy-page-cube {
  0% { transform: rotateY(0deg) scale(1); }
  25% { transform: rotateY(-90deg) scale(0.88); }
  50% { transform: rotateY(-180deg) scale(1); }
  75% { transform: rotateY(-270deg) scale(0.88); }
  100% { transform: rotateY(-360deg) scale(1); }
}`,
  },

  // 10. page-liquid
  {
    id: "page-liquid",
    name: "Page Liquid",
    category: "page-transitions",
    description:
      "Liquid morph transition — the page dissolves through morphing border-radius and blur",
    tags: ["page", "transition", "liquid", "morph"],
    previewType: "background",
    cssCode: `/* Page Liquid */
.roycss-page-liquid {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
}

.roycss-page-liquid::before {
  content: "";
  position: absolute;
  inset: 10px;
  background: linear-gradient(135deg, oklch(0.656 0.212 354.31), oklch(0.606 0.219 292.72));
  filter: blur(0px);
  animation: roy-page-liquid 3.4s ease-in-out infinite;
}

@keyframes roy-page-liquid {
  0%, 100% {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: scale(1) rotate(0deg);
    opacity: 1;
    filter: blur(0px);
  }
  40% {
    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
    transform: scale(0.75) rotate(45deg);
    opacity: 0.5;
    filter: blur(5px);
  }
  60% {
    border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
    transform: scale(0.55) rotate(90deg);
    opacity: 0.2;
    filter: blur(10px);
  }
}`,
  },

  // 11. page-shutter
  {
    id: "page-shutter",
    name: "Page Shutter",
    category: "page-transitions",
    description:
      "Camera shutter transition — a dark iris expands from center to cover, then reopens",
    tags: ["page", "transition", "shutter", "iris"],
    previewType: "background",
    cssCode: `/* Page Shutter */
.roycss-page-shutter {
  position: relative;
  background: linear-gradient(135deg, oklch(0.769 0.165 70.08), oklch(0.637 0.208 25.33));
  overflow: hidden;
}

.roycss-page-shutter::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  border-radius: 50%;
  transform: scale(0);
  animation: roy-page-shutter 3.2s ease-in-out infinite;
}

.roycss-page-shutter::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 10px;
  block-size: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: oklch(0.905 0.166 98.11);
  box-shadow: 0 0 14px 3px color-mix(in oklch, oklch(0.905 0.166 98.11) 85%, transparent);
  opacity: 0;
  animation: roy-page-shutter-aperture 3.2s ease-in-out infinite;
}

@keyframes roy-page-shutter {
  0%, 100% { transform: scale(0); }
  40%, 60% { transform: scale(1.5); }
}

@keyframes roy-page-shutter-aperture {
  0%, 35%, 65%, 100% { opacity: 0; transform: scale(0.4); }
  45%, 55% { opacity: 1; transform: scale(1.2); }
}`,
  },

  // 12. page-dissolve
  {
    id: "page-dissolve",
    name: "Page Dissolve",
    category: "page-transitions",
    description:
      "Dissolve transition — the page blurs and fades out, then re-condenses into view",
    tags: ["page", "transition", "dissolve", "blur"],
    previewType: "background",
    cssCode: `/* Page Dissolve */
.roycss-page-dissolve {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
}

.roycss-page-dissolve::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72));
  border-radius: 6px;
  box-shadow: 0 12px 32px color-mix(in oklch, oklch(0.797 0.134 211.53) 40%, transparent);
  animation: roy-page-dissolve 3.2s ease-in-out infinite;
}

@keyframes roy-page-dissolve {
  0%, 100% { opacity: 1; filter: blur(0px); transform: scale(1); }
  50% { opacity: 0; filter: blur(22px); transform: scale(1.06); }
}`,
  },
];
