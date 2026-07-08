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
  width: 100%;
  height: 8px;
  background: rgba(148, 163, 184, 0.25);
  border-radius: 999px;
  overflow: hidden;
}

.roycss-scroll-progress-bar::after {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 0;
  background: linear-gradient(90deg, #10b981, #06b6d4, #6366f1);
  border-radius: inherit;
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.5);
  animation: roy-scroll-progress-fill 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes roy-scroll-progress-fill {
  0% { width: 0; }
  70%, 100% { width: 100%; }
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
  width: 28px;
  height: 46px;
  border: 2px solid rgba(16, 185, 129, 0.65);
  border-radius: 14px;
  background: transparent;
}

.roycss-scroll-indicator::before {
  content: "";
  position: absolute;
  top: 8px;
  left: 50%;
  width: 4px;
  height: 8px;
  margin-left: -2px;
  background: #10b981;
  border-radius: 2px;
  animation: roy-scroll-indicator-wheel 1.8s ease-in-out infinite;
}

.roycss-scroll-indicator::after {
  content: "";
  position: absolute;
  bottom: 6px;
  left: 50%;
  width: 7px;
  height: 7px;
  margin-left: -3.5px;
  border-right: 2px solid #10b981;
  border-bottom: 2px solid #10b981;
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

.roycss-scroll-parallax-slow::before {
  content: "";
  position: absolute;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -45px 0 0 -45px;
  background: radial-gradient(circle at 30% 30%, #6366f1, #06b6d4 70%);
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
    rgba(148, 163, 184, 0.08) 18px 19px
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
  height: 64px;
  padding: 0 22px;
  background: linear-gradient(90deg, #0f172a, #1e293b);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: 0 6px 20px rgba(2, 6, 23, 0.4);
  animation: roy-scroll-sticky-shrink 3.2s ease-in-out infinite;
}

@keyframes roy-scroll-sticky-shrink {
  0%, 35% {
    height: 64px;
    font-size: 18px;
    padding: 0 22px;
    background: linear-gradient(90deg, #0f172a, #1e293b);
    box-shadow: 0 6px 20px rgba(2, 6, 23, 0.4);
  }
  50%, 85% {
    height: 36px;
    font-size: 13px;
    padding: 0 14px;
    background: linear-gradient(90deg, #020617, #0f172a);
    box-shadow: 0 10px 26px rgba(2, 6, 23, 0.7);
    letter-spacing: 0.04em;
  }
  100% {
    height: 64px;
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
  width: 100%;
  height: 6px;
  background: rgba(148, 163, 184, 0.25);
  border-radius: 999px;
  overflow: hidden;
}

.roycss-scroll-horizontal::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.25), transparent);
  background-size: 80px 100%;
  animation: roy-scroll-horizontal-sheen 1.6s linear infinite;
}

.roycss-scroll-horizontal::after {
  content: "";
  position: absolute;
  top: -3px;
  left: 0;
  width: 24px;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #f59e0b, #ef4444);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.6);
  animation: roy-scroll-horizontal-move 2.8s ease-in-out infinite;
}

@keyframes roy-scroll-horizontal-sheen {
  0% { background-position: -80px 0; }
  100% { background-position: 100% 0; }
}

@keyframes roy-scroll-horizontal-move {
  0%, 100% { left: 0; }
  50% { left: calc(100% - 24px); }
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
  background: radial-gradient(circle at 50% 50%, #111827, #0b1020);
  overflow: hidden;
}

.roycss-cursor-glow-dot::before {
  content: "";
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -5px 0 0 -5px;
  background: #22d3ee;
  box-shadow:
    0 0 12px 4px rgba(34, 211, 238, 0.85),
    0 0 28px 8px rgba(34, 211, 238, 0.4);
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
  background: radial-gradient(circle at 50% 50%, #1a0f2e, #0b1020);
  overflow: hidden;
}

.roycss-cursor-trail::before {
  content: "";
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -4.5px 0 0 -4.5px;
  background: #f472b6;
  box-shadow:
    0 0 10px 2px rgba(244, 114, 182, 0.7),
    -10px 5px 0 -1px rgba(244, 114, 182, 0.8),
    -20px 10px 0 -2px rgba(244, 114, 182, 0.55),
    -30px 15px 0 -3px rgba(244, 114, 182, 0.35),
    -40px 20px 0 -3px rgba(244, 114, 182, 0.18);
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
  background: radial-gradient(circle at 50% 50%, #111827, #0b1020);
  overflow: hidden;
}

.roycss-cursor-blob::before {
  content: "";
  position: absolute;
  width: 44px;
  height: 44px;
  top: 50%;
  left: 50%;
  margin: -22px 0 0 -22px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
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
  background: radial-gradient(circle at 50% 50%, #0c1426, #0b1020);
  overflow: hidden;
}

.roycss-cursor-ring::before {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -7px 0 0 -7px;
  border: 2px solid #22d3ee;
  animation:
    roy-cursor-ring-orbit 3s linear infinite,
    roy-cursor-ring-pulse 1.6s ease-out infinite;
}

.roycss-cursor-ring::after {
  content: "";
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -3px 0 0 -3px;
  background: #22d3ee;
  box-shadow: 0 0 10px 2px rgba(34, 211, 238, 0.8);
  animation: roy-cursor-ring-orbit 3s linear infinite;
}

@keyframes roy-cursor-ring-orbit {
  0% { transform: translate(-20px, -10px); }
  50% { transform: translate(20px, 10px); }
  100% { transform: translate(-20px, -10px); }
}

@keyframes roy-cursor-ring-pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.6); }
  100% { box-shadow: 0 0 0 16px rgba(34, 211, 238, 0); }
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
  background: radial-gradient(circle at 50% 50%, #0c2a1f, #0b1020);
  overflow: hidden;
}

.roycss-cursor-ripple::before,
.roycss-cursor-ripple::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -8px 0 0 -8px;
  border: 2px solid #10b981;
  animation: roy-cursor-ripple-expand 1.8s ease-out infinite;
}

.roycss-cursor-ripple::after {
  animation-delay: 0.9s;
  border-color: #34d399;
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
  background: linear-gradient(135deg, #0f172a, #1e1b4b);
  overflow: hidden;
}

.roycss-cursor-spotlight::before {
  content: "";
  position: absolute;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -65px 0 0 -65px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.45), rgba(34, 211, 238, 0.15) 40%, transparent 70%);
  pointer-events: none;
  animation: roy-cursor-spotlight-move 4.5s ease-in-out infinite;
}

.roycss-cursor-spotlight::after {
  content: "";
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -4.5px 0 0 -4.5px;
  background: #67e8f9;
  box-shadow: 0 0 14px 3px rgba(34, 211, 238, 0.85);
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
  background: linear-gradient(135deg, #0b1020, #111827);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 10px;
  cursor: pointer;
  transition:
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.roycss-cursor-magnetic::before {
  content: "Hover";
  color: #94a3b8;
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
  border-color: rgba(34, 211, 238, 0.6);
  box-shadow: 0 0 24px rgba(34, 211, 238, 0.35);
}

.roycss-cursor-magnetic:hover::before {
  transform: translateY(-5px) scale(1.12);
  color: #22d3ee;
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
    linear-gradient(0deg, transparent 49.5%, rgba(148, 163, 184, 0.08) 49.5% 50.5%, transparent 50.5%),
    linear-gradient(90deg, transparent 49.5%, rgba(148, 163, 184, 0.08) 49.5% 50.5%, transparent 50.5%),
    radial-gradient(circle at 50% 50%, #1a0f1f, #0b1020);
  overflow: hidden;
}

.roycss-cursor-crosshair::before,
.roycss-cursor-crosshair::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  background: #f43f5e;
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.85);
  animation: roy-cursor-crosshair-move 3s ease-in-out infinite;
}

.roycss-cursor-crosshair::before {
  width: 26px;
  height: 2px;
  margin: -1px 0 0 -13px;
}

.roycss-cursor-crosshair::after {
  width: 2px;
  height: 26px;
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
  background: radial-gradient(circle at 50% 50%, #2a1a08, #0b1020);
  overflow: hidden;
}

.roycss-cursor-arrow-bounce::before {
  content: "";
  position: absolute;
  width: 0;
  height: 0;
  top: 50%;
  left: 50%;
  border-left: 9px solid transparent;
  border-top: 15px solid #f59e0b;
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.75));
  transform-origin: 0 0;
  animation: roy-cursor-arrow-bounce 1.4s ease-in-out infinite;
}

.roycss-cursor-arrow-bounce::after {
  content: "";
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -13px 0 0 -13px;
  border: 1.5px dashed rgba(245, 158, 11, 0.55);
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
  background: radial-gradient(circle at 50% 50%, #1f0f2e, #0b1020);
  overflow: hidden;
}

.roycss-cursor-pulse-ring::before {
  content: "";
  position: absolute;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -4.5px 0 0 -4.5px;
  background: #a855f7;
  box-shadow: 0 0 12px 3px rgba(168, 85, 247, 0.85);
  animation: roy-cursor-pulse-dot 3s ease-in-out infinite;
}

.roycss-cursor-pulse-ring::after {
  content: "";
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -13px 0 0 -13px;
  border: 2px solid #a855f7;
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
  background: radial-gradient(circle at 50% 50%, #1a0f2e, #0b1020);
  overflow: hidden;
}

.roycss-cursor-gradient-trail::before {
  content: "";
  position: absolute;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -38px 0 0 -38px;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(244, 114, 182, 0.9) 60deg,
    rgba(34, 211, 238, 0.9) 120deg,
    transparent 180deg,
    transparent 360deg
  );
  filter: blur(2px);
  animation: roy-cursor-gradient-spin 2.4s linear infinite;
}

.roycss-cursor-gradient-trail::after {
  content: "";
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -5px 0 0 -5px;
  background: #22d3ee;
  box-shadow: 0 0 12px 3px rgba(34, 211, 238, 0.85);
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
  background: linear-gradient(135deg, #0a0f1f, #1a0f2e);
  overflow: hidden;
}

.roycss-cursor-firefly::before {
  content: "";
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  margin: -3.5px 0 0 -3.5px;
  background: #fde047;
  box-shadow:
    0 0 8px 2px rgba(253, 224, 71, 0.95),
    0 0 22px 6px rgba(253, 224, 71, 0.4);
  animation:
    roy-cursor-firefly-drift 5s ease-in-out infinite,
    roy-cursor-firefly-glow 1.4s ease-in-out infinite;
}

.roycss-cursor-firefly::after {
  content: "";
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  top: 32%;
  left: 30%;
  background: #fef08a;
  box-shadow:
    0 0 7px 1px rgba(254, 240, 138, 0.85),
    0 0 16px 4px rgba(254, 240, 138, 0.35);
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
  overflow: hidden;
}

.roycss-page-fade::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  border-radius: 6px;
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
  overflow: hidden;
}

.roycss-page-slide-left::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  border-radius: 6px;
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
  overflow: hidden;
}

.roycss-page-slide-up::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, #10b981, #84cc16);
  border-radius: 6px;
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
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
  background: linear-gradient(135deg, #7c3aed, #db2777);
  overflow: hidden;
}

.roycss-page-curtain::before,
.roycss-page-curtain::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

.roycss-page-curtain::before {
  left: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  animation: roy-page-curtain-left 3.4s ease-in-out infinite;
}

.roycss-page-curtain::after {
  right: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
  overflow: hidden;
}

.roycss-page-zoom::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border-radius: 6px;
  box-shadow: 0 12px 32px rgba(239, 68, 68, 0.4);
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
  overflow: hidden;
  perspective: 800px;
}

.roycss-page-flip::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  border-radius: 6px;
  box-shadow: 0 12px 32px rgba(245, 158, 11, 0.4);
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
  overflow: hidden;
}

.roycss-page-circle-reveal::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  border-radius: 6px;
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.4);
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
  overflow: hidden;
}

.roycss-page-mask-reveal::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  border-radius: 6px;
  box-shadow: 0 12px 32px rgba(236, 72, 153, 0.4);
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
  overflow: hidden;
  perspective: 700px;
}

.roycss-page-cube::before {
  content: "";
  position: absolute;
  inset: 12px;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  border-radius: 6px;
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
  overflow: hidden;
}

.roycss-page-liquid::before {
  content: "";
  position: absolute;
  inset: 10px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
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
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  overflow: hidden;
}

.roycss-page-shutter::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  border-radius: 50%;
  transform: scale(0);
  animation: roy-page-shutter 3.2s ease-in-out infinite;
}

.roycss-page-shutter::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: #fde047;
  box-shadow: 0 0 14px 3px rgba(253, 224, 71, 0.85);
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
  background: linear-gradient(135deg, #0f172a, #1e293b);
  overflow: hidden;
}

.roycss-page-dissolve::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  border-radius: 6px;
  box-shadow: 0 12px 32px rgba(34, 211, 238, 0.4);
  animation: roy-page-dissolve 3.2s ease-in-out infinite;
}

@keyframes roy-page-dissolve {
  0%, 100% { opacity: 1; filter: blur(0px); transform: scale(1); }
  50% { opacity: 0; filter: blur(22px); transform: scale(1.06); }
}`,
  },
];
