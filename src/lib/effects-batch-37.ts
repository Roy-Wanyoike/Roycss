import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 37 — Shape Morphing Effects (20 effects)
 * Pure-CSS shape-shifting: clip-path, border-radius, transform, and gradient
 * morphs. Each effect uses hold-and-transition keyframes so shapes evolve
 * smoothly between forms. No JavaScript.
 * All classes are prefixed `roycss-morph-` and keyframes `roy-morph-`.
 */
export const effectsBatch37: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // SHAPE MORPHING (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. morph-shape-cycle
  {
    id: "morph-shape-cycle",
    name: "Shape Cycle",
    category: "morphing",
    description: "Element cycles through circle, triangle, square, and pentagon forms",
    tags: ["morphing", "shape", "cycle", "clip-path", "circle", "triangle", "infinite"],
    previewType: "box",
    cssCode: `/* Morphing: Shape Cycle */
.roycss-morph-shape-cycle {
  background: linear-gradient(135deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
  animation: roy-morph-shape-cycle 8s ease-in-out infinite;
}
@keyframes roy-morph-shape-cycle {
  0%, 18%   { clip-path: circle(50%); }
  25%, 43%  { clip-path: polygon(50% 0%, 100% 100%, 0% 100%); }
  50%, 68%  { clip-path: inset(0%); }
  75%, 93%  { clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); }
  100%      { clip-path: circle(50%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-shape-cycle { animation: none; clip-path: none; }
}`,
  },

  // 2. morph-blob-organic
  {
    id: "morph-blob-organic",
    name: "Organic Blob",
    category: "morphing",
    description: "Organic blob that continuously shifts through asymmetric shapes",
    tags: ["morphing", "blob", "organic", "border-radius", "asymmetric", "infinite"],
    previewType: "box",
    cssCode: `/* Morphing: Organic Blob */
.roycss-morph-blob-organic {
  background: linear-gradient(135deg, oklch(0.65 0.2 200), oklch(0.55 0.22 320));
  animation: roy-morph-blob-organic 10s ease-in-out infinite;
}
@keyframes roy-morph-blob-organic {
  0%, 100% { border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%; transform: rotate(0deg); }
  25%      { border-radius: 67% 33% 41% 59% / 63% 51% 49% 37%; transform: rotate(90deg); }
  50%      { border-radius: 38% 62% 56% 44% / 49% 62% 38% 51%; transform: rotate(180deg); }
  75%      { border-radius: 56% 44% 33% 67% / 37% 56% 44% 63%; transform: rotate(270deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-blob-organic { animation: none; border-radius: 40%; }
}`,
  },

  // 3. morph-button-state
  {
    id: "morph-button-state",
    name: "Button State Morph",
    category: "morphing",
    description: "Button morphs smoothly between idle, hover, and active states",
    tags: ["morphing", "button", "state", "hover", "active"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Morphing: Button State */
.roycss-morph-button-state {
  background: oklch(0.55 0.18 220);
  color: oklch(0.98 0.01 220);
  border: none;
  border-radius: 8px;
  transition: all 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.roycss-morph-button-state:hover {
  background: oklch(0.6 0.2 260);
  border-radius: 24px;
  transform: scale(1.05);
  letter-spacing: 0.04em;
}
.roycss-morph-button-state:active {
  background: oklch(0.5 0.22 200);
  border-radius: 4px;
  transform: scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-button-state,
  .roycss-morph-button-state:hover,
  .roycss-morph-button-state:active {
    transition: none;
    transform: none;
  }
}`,
  },

  // 4. morph-card-expand
  {
    id: "morph-card-expand",
    name: "Card Expand",
    category: "morphing",
    description: "Card smoothly expands to a larger size with depth on hover",
    tags: ["morphing", "card", "expand", "grow", "hover", "scale"],
    previewType: "card",
    cssCode: `/* Morphing: Card Expand */
.roycss-morph-card-expand {
  background: linear-gradient(135deg, oklch(0.28 0.05 240), oklch(0.22 0.06 260));
  border-radius: 14px;
  transition: transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1),
              box-shadow 0.5s ease,
              border-radius 0.5s ease;
}
.roycss-morph-card-expand:hover {
  transform: scale(1.12);
  border-radius: 22px;
  box-shadow: 0 24px 60px -12px oklch(0.5 0.2 240 / 0.55);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-card-expand,
  .roycss-morph-card-expand:hover {
    transition: none;
    transform: none;
  }
}`,
  },

  // 5. morph-icon-transform
  {
    id: "morph-icon-transform",
    name: "Icon Transform",
    category: "morphing",
    description: "Hamburger menu icon morphs into an X when hovered",
    tags: ["morphing", "icon", "menu", "hamburger", "transform", "hover"],
    previewType: "box",
    cssCode: `/* Morphing: Icon Transform */
.roycss-morph-icon-transform {
  position: relative;
  width: 48px;
  height: 36px;
  background: transparent;
}
.roycss-morph-icon-transform,
.roycss-morph-icon-transform::before,
.roycss-morph-icon-transform::after {
  display: block;
}
.roycss-morph-icon-transform::before,
.roycss-morph-icon-transform::after {
  content: "";
  position: absolute;
  left: 0;
  width: 100%;
  height: 4px;
  background: oklch(0.7 0.2 220);
  border-radius: 2px;
  transition: transform 0.4s cubic-bezier(0.68, -0.4, 0.27, 1.4),
              top 0.3s ease;
}
.roycss-morph-icon-transform::before { top: 6px; }
.roycss-morph-icon-transform::after  { top: 26px; }
.roycss-morph-icon-transform:hover::before {
  top: 16px;
  transform: rotate(45deg);
}
.roycss-morph-icon-transform:hover::after {
  top: 16px;
  transform: rotate(-45deg);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-icon-transform::before,
  .roycss-morph-icon-transform::after { transition: none; }
}`,
  },

  // 6. morph-circle-square
  {
    id: "morph-circle-square",
    name: "Circle Square Morph",
    category: "morphing",
    description: "Smooth continuous morph between a circle and a square",
    tags: ["morphing", "circle", "square", "border-radius", "infinite"],
    previewType: "box",
    cssCode: `/* Morphing: Circle Square */
.roycss-morph-circle-square {
  background: linear-gradient(135deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
  animation: roy-morph-circle-square 4s ease-in-out infinite;
}
@keyframes roy-morph-circle-square {
  0%, 100% { border-radius: 50%; }
  50%      { border-radius: 8%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-circle-square { animation: none; border-radius: 50%; }
}`,
  },

  // 7. morph-text-glow
  {
    id: "morph-text-glow",
    name: "Text Glow Morph",
    category: "morphing",
    description: "Text morphs through varying glow intensities continuously",
    tags: ["morphing", "text", "glow", "intensity", "infinite"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Morphing: Text Glow */
.roycss-morph-text-glow {
  color: oklch(0.85 0.18 220);
  animation: roy-morph-text-glow 3s ease-in-out infinite;
}
@keyframes roy-morph-text-glow {
  0%, 100% { text-shadow: 0 0 4px oklch(0.7 0.2 220 / 0.4); }
  50%      { text-shadow: 0 0 14px oklch(0.7 0.2 220 / 0.9),
                       0 0 28px oklch(0.6 0.22 280 / 0.6); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-text-glow { animation: none; }
}`,
  },

  // 8. morph-border-radius
  {
    id: "morph-border-radius",
    name: "Border Radius Morph",
    category: "morphing",
    description: "Border-radius animates through a sequence of organic values",
    tags: ["morphing", "border-radius", "organic", "shape", "infinite"],
    previewType: "box",
    cssCode: `/* Morphing: Border Radius */
.roycss-morph-border-radius {
  background: linear-gradient(135deg, oklch(0.6 0.2 200), oklch(0.55 0.22 280));
  animation: roy-morph-border-radius 6s ease-in-out infinite;
}
@keyframes roy-morph-border-radius {
  0%, 100% { border-radius: 50% 30% 70% 40% / 40% 60% 30% 50%; }
  25%      { border-radius: 30% 70% 40% 60% / 70% 30% 60% 40%; }
  50%      { border-radius: 60% 40% 50% 50% / 30% 70% 40% 60%; }
  75%      { border-radius: 40% 60% 30% 70% / 60% 40% 70% 30%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-border-radius { animation: none; border-radius: 16px; }
}`,
  },

  // 9. morph-flip-3d
  {
    id: "morph-flip-3d",
    name: "3D Flip Morph",
    category: "morphing",
    description: "Element flips in 3D to reveal a contrasting back face on hover",
    tags: ["morphing", "3d", "flip", "rotateY", "hover", "transform"],
    previewType: "box",
    cssCode: `/* Morphing: 3D Flip */
.roycss-morph-flip-3d {
  position: relative;
  width: 96px;
  height: 96px;
  perspective: 800px;
  background: transparent;
}
.roycss-morph-flip-3d::before,
.roycss-morph-flip-3d::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;
  backface-visibility: hidden;
  transition: transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1);
}
.roycss-morph-flip-3d::before {
  background: linear-gradient(135deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
}
.roycss-morph-flip-3d::after {
  background: linear-gradient(135deg, oklch(0.6 0.22 320), oklch(0.55 0.2 40));
  transform: rotateY(180deg);
}
.roycss-morph-flip-3d:hover::before { transform: rotateY(180deg); }
.roycss-morph-flip-3d:hover::after  { transform: rotateY(360deg); }
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-flip-3d::before,
  .roycss-morph-flip-3d::after { transition: none; }
}`,
  },

  // 10. morph-progress-shape
  {
    id: "morph-progress-shape",
    name: "Progress Shape Morph",
    category: "morphing",
    description: "Progress indicator morphs from circle to bar to checkmark",
    tags: ["morphing", "progress", "circle", "bar", "checkmark", "infinite"],
    previewType: "loader",
    cssCode: `/* Morphing: Progress Shape */
.roycss-morph-progress-shape {
  position: relative;
  width: 64px;
  height: 64px;
  background: transparent;
  animation: roy-morph-progress-shape 6s ease-in-out infinite;
}
.roycss-morph-progress-shape::before,
.roycss-morph-progress-shape::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 4px solid oklch(0.6 0.2 220);
  box-sizing: border-box;
}
.roycss-morph-progress-shape::before {
  border-radius: 50%;
  border-top-color: transparent;
  border-right-color: transparent;
  animation: roy-morph-progress-before 6s ease-in-out infinite;
}
.roycss-morph-progress-shape::after {
  border-radius: 0;
  border-color: transparent;
  width: 0;
  height: 0;
  inset: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  animation: roy-morph-progress-after 6s ease-in-out infinite;
}
@keyframes roy-morph-progress-shape {
  0%, 30%, 100% { width: 64px; height: 64px; }
  50%, 70%      { width: 160px; height: 16px; }
}
@keyframes roy-morph-progress-before {
  0%, 30%  { transform: rotate(0deg); border-radius: 50%; opacity: 1; }
  35%, 70% { transform: rotate(0deg); border-radius: 999px; opacity: 1; }
  75%, 100%{ opacity: 0; }
}
@keyframes roy-morph-progress-after {
  0%, 70%   { width: 0; height: 0; opacity: 0; }
  80%, 100% { width: 28px; height: 16px; opacity: 1;
              border-color: transparent oklch(0.7 0.2 150) transparent transparent;
              border-style: solid; border-width: 0 6px 6px 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-progress-shape,
  .roycss-morph-progress-shape::before,
  .roycss-morph-progress-shape::after { animation: none; }
}`,
  },

  // 11. morph-hover-grow
  {
    id: "morph-hover-grow",
    name: "Hover Grow Morph",
    category: "morphing",
    description: "Element grows organically with shifting border-radius on hover",
    tags: ["morphing", "hover", "grow", "organic", "border-radius"],
    previewType: "box",
    cssCode: `/* Morphing: Hover Grow */
.roycss-morph-hover-grow {
  background: linear-gradient(135deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
  border-radius: 24px;
  transition: transform 0.5s cubic-bezier(0.34, 1.3, 0.64, 1),
              border-radius 0.5s ease;
}
.roycss-morph-hover-grow:hover {
  transform: scale(1.15);
  border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-hover-grow,
  .roycss-morph-hover-grow:hover {
    transition: none;
    transform: none;
  }
}`,
  },

  // 12. morph-rotate-transform
  {
    id: "morph-rotate-transform",
    name: "Rotate Scale Morph",
    category: "morphing",
    description: "Continuous rotation combined with pulsing scale morph",
    tags: ["morphing", "rotate", "scale", "transform", "infinite"],
    previewType: "box",
    cssCode: `/* Morphing: Rotate Transform */
.roycss-morph-rotate-transform {
  background: linear-gradient(135deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
  animation: roy-morph-rotate-transform 4s ease-in-out infinite;
}
@keyframes roy-morph-rotate-transform {
  0%   { transform: rotate(0deg) scale(1); border-radius: 16px; }
  25%  { transform: rotate(90deg) scale(1.15); border-radius: 50%; }
  50%  { transform: rotate(180deg) scale(0.9); border-radius: 8px; }
  75%  { transform: rotate(270deg) scale(1.1); border-radius: 50%; }
  100% { transform: rotate(360deg) scale(1); border-radius: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-rotate-transform { animation: none; }
}`,
  },

  // 13. morph-color-shift
  {
    id: "morph-color-shift",
    name: "Color Spectrum Shift",
    category: "morphing",
    description: "Element smoothly morphs through the full color spectrum",
    tags: ["morphing", "color", "spectrum", "shift", "hue", "infinite"],
    previewType: "box",
    cssCode: `/* Morphing: Color Shift */
.roycss-morph-color-shift {
  background: oklch(0.6 0.2 200);
  animation: roy-morph-color-shift 6s linear infinite;
}
@keyframes roy-morph-color-shift {
  0%   { background: oklch(0.6 0.2 30); }
  20%  { background: oklch(0.6 0.2 90); }
  40%  { background: oklch(0.6 0.2 150); }
  60%  { background: oklch(0.6 0.2 210); }
  80%  { background: oklch(0.6 0.2 280); }
  100% { background: oklch(0.6 0.2 330); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-color-shift { animation: none; }
}`,
  },

  // 14. morph-size-pulse
  {
    id: "morph-size-pulse",
    name: "Size Pulse Morph",
    category: "morphing",
    description: "Size pulses rhythmically with a morphing border-radius",
    tags: ["morphing", "size", "pulse", "border-radius", "infinite"],
    previewType: "box",
    cssCode: `/* Morphing: Size Pulse */
.roycss-morph-size-pulse {
  background: linear-gradient(135deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
  animation: roy-morph-size-pulse 3s ease-in-out infinite;
}
@keyframes roy-morph-size-pulse {
  0%, 100% { transform: scale(1); border-radius: 24px; }
  50%      { transform: scale(1.2); border-radius: 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-size-pulse { animation: none; }
}`,
  },

  // 15. morph-shape-reveal
  {
    id: "morph-shape-reveal",
    name: "Shape Reveal",
    category: "morphing",
    description: "Content revealed by a morphing clip-path expanding outward",
    tags: ["morphing", "shape", "reveal", "clip-path", "entrance"],
    previewType: "box",
    cssCode: `/* Morphing: Shape Reveal */
.roycss-morph-shape-reveal {
  clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%);
  background: linear-gradient(135deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
  animation: roy-morph-shape-reveal 1.2s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}
@keyframes roy-morph-shape-reveal {
  0%   { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); }
  50%  { clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
  100% { clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-shape-reveal { animation: none; clip-path: none; }
}`,
  },

  // 16. morph-card-to-modal
  {
    id: "morph-card-to-modal",
    name: "Card To Modal",
    category: "morphing",
    description: "Card morphs to a larger modal-like size with elevation on hover",
    tags: ["morphing", "card", "modal", "expand", "elevation", "hover"],
    previewType: "card",
    cssCode: `/* Morphing: Card To Modal */
.roycss-morph-card-to-modal {
  background: linear-gradient(135deg, oklch(0.28 0.05 240), oklch(0.22 0.06 260));
  border-radius: 16px;
  transform-origin: center center;
  transition: transform 0.55s cubic-bezier(0.34, 1.2, 0.64, 1),
              border-radius 0.55s ease,
              box-shadow 0.55s ease;
}
.roycss-morph-card-to-modal:hover {
  transform: scale(1.25);
  border-radius: 28px;
  box-shadow: 0 30px 80px -10px oklch(0.2 0.05 240 / 0.7);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-card-to-modal,
  .roycss-morph-card-to-modal:hover {
    transition: none;
    transform: none;
  }
}`,
  },

  // 17. morph-icon-to-text
  {
    id: "morph-icon-to-text",
    name: "Icon To Text",
    category: "morphing",
    description: "Icon morphs into a text label that slides out on hover",
    tags: ["morphing", "icon", "text", "label", "expand", "hover"],
    previewType: "button",
    previewText: "★",
    cssCode: `/* Morphing: Icon To Text */
.roycss-morph-icon-to-text {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 14px;
  background: oklch(0.55 0.18 220);
  color: oklch(0.98 0.01 220);
  border-radius: 20px;
  overflow: hidden;
  white-space: nowrap;
}
.roycss-morph-icon-to-text::after {
  content: "RoyCSS";
  max-width: 0;
  margin-left: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-width 0.5s cubic-bezier(0.34, 1.2, 0.64, 1),
              opacity 0.3s ease,
              margin-left 0.5s ease;
}
.roycss-morph-icon-to-text:hover::after {
  max-width: 120px;
  margin-left: 8px;
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-icon-to-text::after { transition: none; }
}`,
  },

  // 18. morph-gradient-morph
  {
    id: "morph-gradient-morph",
    name: "Gradient Morph",
    category: "morphing",
    description: "Background gradient morphs continuously between color stops",
    tags: ["morphing", "gradient", "color", "morph", "background", "infinite"],
    previewType: "box",
    cssCode: `/* Morphing: Gradient Morph */
.roycss-morph-gradient-morph {
  background: linear-gradient(135deg,
    oklch(0.62 0.2 200), oklch(0.55 0.22 280), oklch(0.6 0.2 320), oklch(0.62 0.2 200));
  background-size: 400% 400%;
  animation: roy-morph-gradient-morph 8s ease infinite;
}
@keyframes roy-morph-gradient-morph {
  0%   { background-position: 0% 50%; }
  25%  { background-position: 50% 0%; }
  50%  { background-position: 100% 50%; }
  75%  { background-position: 50% 100%; }
  100% { background-position: 0% 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-gradient-morph { animation: none; }
}`,
  },

  // 19. morph-clip-path
  {
    id: "morph-clip-path",
    name: "Clip Path Morph",
    category: "morphing",
    description: "Clip-path morphs through star, hexagon, and arrow shapes",
    tags: ["morphing", "clip-path", "star", "hexagon", "arrow", "infinite"],
    previewType: "box",
    cssCode: `/* Morphing: Clip Path */
.roycss-morph-clip-path {
  background: linear-gradient(135deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
  animation: roy-morph-clip-path 8s ease-in-out infinite;
}
@keyframes roy-morph-clip-path {
  0%, 18%   { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
  25%, 43%  { clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); }
  50%, 68%  { clip-path: polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%); }
  75%, 93%  { clip-path: polygon(50% 0%, 90% 50%, 50% 100%, 10% 50%); }
  100%      { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-clip-path { animation: none; clip-path: none; }
}`,
  },

  // 20. morph-hover-distort
  {
    id: "morph-hover-distort",
    name: "Hover Distort",
    category: "morphing",
    description: "Element distorts and morphs its shape dramatically on hover",
    tags: ["morphing", "hover", "distort", "skew", "stretch", "border-radius"],
    previewType: "box",
    cssCode: `/* Morphing: Hover Distort */
.roycss-morph-hover-distort {
  background: linear-gradient(135deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
  border-radius: 16px;
  transition: transform 0.5s cubic-bezier(0.34, 1.5, 0.64, 1),
              border-radius 0.5s ease,
              filter 0.5s ease;
}
.roycss-morph-hover-distort:hover {
  transform: skewX(-15deg) scaleY(1.2) scaleX(0.85);
  border-radius: 50% 20% 50% 20% / 20% 50% 20% 50%;
  filter: hue-rotate(60deg);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-morph-hover-distort,
  .roycss-morph-hover-distort:hover {
    transition: none;
    transform: none;
    filter: none;
  }
}`,
  },
];
