import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 36 — Liquid & Fluid Effects (20 effects)
 * Pure-CSS liquid-themed effects: flowing fills, morphing blobs, waves, ripples,
 * drips, and fluid gradients. Uses clip-path, border-radius animation, layered
 * gradients, and pseudo-element overlays — no JavaScript.
 * All classes are prefixed `roycss-liquid-` and keyframes `roy-liquid-`.
 */
export const effectsBatch36: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // LIQUID & FLUID (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. liquid-button-fill
  {
    id: "liquid-button-fill",
    name: "Liquid Button Fill",
    category: "liquid",
    description: "Button fills with liquid color rising from the bottom on hover",
    tags: ["liquid", "button", "fill", "hover", "wave"],
    previewType: "button",
    previewText: "Hover Me",
    cssCode: `/* Liquid: Button Fill */
.roycss-liquid-button-fill {
  position: relative;
  overflow: hidden;
  z-index: 0;
  color: oklch(0.35 0.18 220);
  background: transparent;
  border: 2px solid oklch(0.6 0.18 220);
}
.roycss-liquid-button-fill::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, oklch(0.62 0.19 220), oklch(0.55 0.2 240));
  transform: translateY(101%);
  transition: transform 0.55s cubic-bezier(0.34, 1.2, 0.64, 1);
  border-radius: 49% 51% 0 0 / 12% 12% 0 0;
}
.roycss-liquid-button-fill:hover::before {
  transform: translateY(0);
}
.roycss-liquid-button-fill:hover {
  color: oklch(0.98 0.02 220);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-button-fill::before { transition: none; }
}`,
  },

  // 2. liquid-border-flow
  {
    id: "liquid-border-flow",
    name: "Liquid Border Flow",
    category: "liquid",
    description: "Animated border that appears to flow like circulating liquid",
    tags: ["liquid", "border", "flow", "gradient", "infinite"],
    previewType: "box",
    cssCode: `/* Liquid: Border Flow */
.roycss-liquid-border-flow {
  position: relative;
  border-radius: 12px;
  background: oklch(0.18 0.02 240);
  z-index: 0;
}
.roycss-liquid-border-flow::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: -1;
  border-radius: inherit;
  background: conic-gradient(from 0deg,
    oklch(0.7 0.2 200), oklch(0.65 0.22 240), oklch(0.55 0.2 280),
    oklch(0.6 0.2 200), oklch(0.7 0.2 200));
  animation: roy-liquid-border-flow 4s linear infinite;
}
@keyframes roy-liquid-border-flow {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-border-flow::before { animation: none; }
}`,
  },

  // 3. liquid-card-wave
  {
    id: "liquid-card-wave",
    name: "Liquid Card Wave",
    category: "liquid",
    description: "Card with a continuous wave undulating across its surface",
    tags: ["liquid", "card", "wave", "surface", "infinite"],
    previewType: "card",
    cssCode: `/* Liquid: Card Wave */
.roycss-liquid-card-wave {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.25 0.05 240), oklch(0.2 0.06 260));
  border-radius: 14px;
}
.roycss-liquid-card-wave::before {
  content: "";
  position: absolute;
  left: -50%;
  right: -50%;
  bottom: -30%;
  height: 60%;
  background: radial-gradient(ellipse at center, oklch(0.6 0.18 220 / 0.55), transparent 70%);
  border-radius: 45% 55% 50% 50% / 60% 50% 50% 40%;
  animation: roy-liquid-card-wave 6s ease-in-out infinite;
}
@keyframes roy-liquid-card-wave {
  0%, 100% { transform: translateX(-15%) rotate(0deg); }
  50%      { transform: translateX(15%) rotate(8deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-card-wave::before { animation: none; }
}`,
  },

  // 4. liquid-gradient-shift
  {
    id: "liquid-gradient-shift",
    name: "Liquid Gradient Shift",
    category: "liquid",
    description: "Background gradient that shifts and flows like moving liquid",
    tags: ["liquid", "gradient", "shift", "flow", "background", "infinite"],
    previewType: "box",
    cssCode: `/* Liquid: Gradient Shift */
.roycss-liquid-gradient-shift {
  background: linear-gradient(120deg,
    oklch(0.6 0.2 200), oklch(0.62 0.22 240), oklch(0.55 0.2 280),
    oklch(0.6 0.2 320), oklch(0.6 0.2 200));
  background-size: 300% 300%;
  animation: roy-liquid-gradient-shift 8s ease-in-out infinite;
}
@keyframes roy-liquid-gradient-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-gradient-shift { animation: none; }
}`,
  },

  // 5. liquid-blob-morph
  {
    id: "liquid-blob-morph",
    name: "Liquid Blob Morph",
    category: "liquid",
    description: "Organic blob that continuously morphs via border-radius animation",
    tags: ["liquid", "blob", "morph", "organic", "border-radius", "infinite"],
    previewType: "box",
    cssCode: `/* Liquid: Blob Morph */
.roycss-liquid-blob-morph {
  background: linear-gradient(135deg, oklch(0.65 0.2 220), oklch(0.6 0.22 280));
  animation: roy-liquid-blob-morph 8s ease-in-out infinite;
}
@keyframes roy-liquid-blob-morph {
  0%, 100% { border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%; }
  25%      { border-radius: 67% 33% 41% 59% / 63% 51% 49% 37%; }
  50%      { border-radius: 38% 62% 56% 44% / 49% 62% 38% 51%; }
  75%      { border-radius: 56% 44% 33% 67% / 37% 56% 44% 63%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-blob-morph { animation: none; border-radius: 50%; }
}`,
  },

  // 6. liquid-reveal-mask
  {
    id: "liquid-reveal-mask",
    name: "Liquid Reveal Mask",
    category: "liquid",
    description: "Content revealed by a liquid mask spreading outward",
    tags: ["liquid", "reveal", "mask", "clip-path", "entrance"],
    previewType: "box",
    cssCode: `/* Liquid: Reveal Mask */
.roycss-liquid-reveal-mask {
  clip-path: circle(0% at 50% 50%);
  animation: roy-liquid-reveal-mask 1.1s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
  background: linear-gradient(135deg, oklch(0.6 0.2 220), oklch(0.55 0.22 280));
}
@keyframes roy-liquid-reveal-mask {
  0%   { clip-path: circle(0% at 50% 50%); }
  60%  { clip-path: circle(80% at 50% 50%); }
  100% { clip-path: circle(100% at 50% 50%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-reveal-mask { animation: none; clip-path: none; }
}`,
  },

  // 7. liquid-text-fill
  {
    id: "liquid-text-fill",
    name: "Liquid Text Fill",
    category: "liquid",
    description: "Text fills with an animated liquid color gradient",
    tags: ["liquid", "text", "fill", "gradient", "background-clip", "infinite"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Liquid: Text Fill */
.roycss-liquid-text-fill {
  background: linear-gradient(90deg,
    oklch(0.5 0.2 220), oklch(0.6 0.22 280), oklch(0.55 0.2 320), oklch(0.5 0.2 220));
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: roy-liquid-text-fill 4s linear infinite;
}
@keyframes roy-liquid-text-fill {
  to { background-position: 200% center; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-text-fill { animation: none; }
}`,
  },

  // 8. liquid-drop-fall
  {
    id: "liquid-drop-fall",
    name: "Liquid Drop Fall",
    category: "liquid",
    description: "Liquid drop repeatedly falls and splashes on impact",
    tags: ["liquid", "drop", "fall", "splash", "infinite"],
    previewType: "box",
    cssCode: `/* Liquid: Drop Fall */
.roycss-liquid-drop-fall {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, oklch(0.22 0.04 240), oklch(0.18 0.05 260));
  border-radius: 10px;
}
.roycss-liquid-drop-fall::before {
  content: "";
  position: absolute;
  top: -10%;
  left: 50%;
  width: 18px;
  height: 26px;
  background: oklch(0.7 0.2 220);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transform: translateX(-50%);
  animation: roy-liquid-drop-fall 2.4s ease-in infinite;
}
.roycss-liquid-drop-fall::after {
  content: "";
  position: absolute;
  bottom: 12%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: oklch(0.7 0.2 220 / 0.6);
  transform: translateX(-50%);
  animation: roy-liquid-drop-splash 2.4s ease-out infinite;
}
@keyframes roy-liquid-drop-fall {
  0%   { top: -10%; transform: translateX(-50%) scaleY(1); }
  70%  { top: 78%; transform: translateX(-50%) scaleY(1.4); }
  80%  { top: 78%; transform: translateX(-50%) scaleY(0.2); opacity: 0; }
  81%  { opacity: 0; }
  100% { opacity: 0; }
}
@keyframes roy-liquid-drop-splash {
  0%, 79% { width: 0; height: 0; opacity: 0; }
  80%     { width: 8px; height: 8px; opacity: 1; }
  100%    { width: 90px; height: 20px; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-drop-fall::before,
  .roycss-liquid-drop-fall::after { animation: none; }
}`,
  },

  // 9. liquid-surface-ripple
  {
    id: "liquid-surface-ripple",
    name: "Liquid Surface Ripple",
    category: "liquid",
    description: "Concentric ripple expands across the surface when hovered",
    tags: ["liquid", "ripple", "surface", "hover", "wave"],
    previewType: "box",
    cssCode: `/* Liquid: Surface Ripple */
.roycss-liquid-surface-ripple {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.25 0.06 220), oklch(0.2 0.05 260));
}
.roycss-liquid-surface-ripple::before,
.roycss-liquid-surface-ripple::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid oklch(0.7 0.2 220 / 0.7);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
}
.roycss-liquid-surface-ripple:hover::before {
  animation: roy-liquid-ripple 1s ease-out;
}
.roycss-liquid-surface-ripple:hover::after {
  animation: roy-liquid-ripple 1s ease-out 0.3s;
}
@keyframes roy-liquid-ripple {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(20); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-surface-ripple::before,
  .roycss-liquid-surface-ripple::after { animation: none; }
}`,
  },

  // 10. liquid-wave-loader
  {
    id: "liquid-wave-loader",
    name: "Liquid Wave Loader",
    category: "liquid",
    description: "Loading indicator with a wavy liquid surface rising and falling",
    tags: ["liquid", "wave", "loader", "loading", "infinite"],
    previewType: "loader",
    cssCode: `/* Liquid: Wave Loader */
.roycss-liquid-wave-loader {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background: oklch(0.2 0.03 240);
  box-shadow: inset 0 0 0 3px oklch(0.6 0.2 220 / 0.4);
}
.roycss-liquid-wave-loader::before,
.roycss-liquid-wave-loader::after {
  content: "";
  position: absolute;
  left: -50%;
  width: 200%;
  height: 200%;
  border-radius: 42% 58% 50% 50% / 50% 50% 58% 42%;
  background: oklch(0.6 0.2 220);
}
.roycss-liquid-wave-loader::before {
  top: 60%;
  animation: roy-liquid-wave-loader 3s ease-in-out infinite;
}
.roycss-liquid-wave-loader::after {
  top: 65%;
  background: oklch(0.7 0.2 200 / 0.55);
  animation: roy-liquid-wave-loader 3s ease-in-out -1.5s infinite reverse;
}
@keyframes roy-liquid-wave-loader {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  50%      { transform: translateX(15%) rotate(180deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-wave-loader::before,
  .roycss-liquid-wave-loader::after { animation: none; }
}`,
  },

  // 11. liquid-gradient-pour
  {
    id: "liquid-gradient-pour",
    name: "Liquid Gradient Pour",
    category: "liquid",
    description: "Gradient pours in from the top like liquid filling a container",
    tags: ["liquid", "gradient", "pour", "fill", "entrance"],
    previewType: "box",
    cssCode: `/* Liquid: Gradient Pour */
.roycss-liquid-gradient-pour {
  position: relative;
  overflow: hidden;
  background: oklch(0.18 0.02 240);
  z-index: 0;
}
.roycss-liquid-gradient-pour::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, oklch(0.62 0.2 200), oklch(0.55 0.22 260));
  transform: translateY(-101%);
  animation: roy-liquid-gradient-pour 1.4s cubic-bezier(0.34, 1.1, 0.64, 1) forwards;
}
@keyframes roy-liquid-gradient-pour {
  0%   { transform: translateY(-101%); }
  70%  { transform: translateY(8%); }
  85%  { transform: translateY(-3%); }
  100% { transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-gradient-pour::before { animation: none; transform: translateY(0); }
}`,
  },

  // 12. liquid-circle-pulse
  {
    id: "liquid-circle-pulse",
    name: "Liquid Circle Pulse",
    category: "liquid",
    description: "Circle pulses and distorts like a vibrating liquid droplet",
    tags: ["liquid", "circle", "pulse", "droplet", "infinite"],
    previewType: "box",
    cssCode: `/* Liquid: Circle Pulse */
.roycss-liquid-circle-pulse {
  width: 72px;
  height: 72px;
  background: radial-gradient(circle at 35% 35%, oklch(0.75 0.18 200), oklch(0.55 0.22 260));
  animation: roy-liquid-circle-pulse 2.4s ease-in-out infinite;
}
@keyframes roy-liquid-circle-pulse {
  0%, 100% { border-radius: 50%; transform: scale(1); }
  25%      { border-radius: 48% 52% 55% 45% / 52% 48% 52% 48%; transform: scale(1.08); }
  50%      { border-radius: 52% 48% 45% 55% / 48% 55% 45% 52%; transform: scale(0.94); }
  75%      { border-radius: 50% 50% 52% 48% / 55% 45% 50% 50%; transform: scale(1.04); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-circle-pulse { animation: none; border-radius: 50%; }
}`,
  },

  // 13. liquid-menu-slide
  {
    id: "liquid-menu-slide",
    name: "Liquid Menu Slide",
    category: "liquid",
    description: "Menu items slide in sequentially like drops of liquid",
    tags: ["liquid", "menu", "slide", "stagger", "entrance"],
    previewType: "loader",
    childCount: 5,
    cssCode: `/* Liquid: Menu Slide */
.roycss-liquid-menu-slide > * {
  opacity: 0;
  transform: translateY(-30px) scaleY(0.6);
  transform-origin: top center;
  animation: roy-liquid-menu-slide 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
}
.roycss-liquid-menu-slide > *:nth-child(1) { animation-delay: 0.05s; }
.roycss-liquid-menu-slide > *:nth-child(2) { animation-delay: 0.15s; }
.roycss-liquid-menu-slide > *:nth-child(3) { animation-delay: 0.25s; }
.roycss-liquid-menu-slide > *:nth-child(4) { animation-delay: 0.35s; }
.roycss-liquid-menu-slide > *:nth-child(5) { animation-delay: 0.45s; }
@keyframes roy-liquid-menu-slide {
  0%   { opacity: 0; transform: translateY(-30px) scaleY(0.6); }
  60%  { opacity: 1; transform: translateY(4px) scaleY(1.08); }
  100% { opacity: 1; transform: translateY(0) scaleY(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-menu-slide > * { animation: none; opacity: 1; transform: none; }
}`,
  },

  // 14. liquid-background-flow
  {
    id: "liquid-background-flow",
    name: "Liquid Background Flow",
    category: "liquid",
    description: "Background with multiple liquid gradients flowing and blending",
    tags: ["liquid", "background", "flow", "gradient", "blend", "infinite"],
    previewType: "background",
    cssCode: `/* Liquid: Background Flow */
.roycss-liquid-background-flow {
  background:
    radial-gradient(circle at 20% 30%, oklch(0.6 0.2 200 / 0.7), transparent 40%),
    radial-gradient(circle at 80% 70%, oklch(0.55 0.22 280 / 0.7), transparent 40%),
    radial-gradient(circle at 60% 20%, oklch(0.6 0.2 320 / 0.55), transparent 40%),
    linear-gradient(135deg, oklch(0.2 0.04 240), oklch(0.18 0.05 260));
  background-size: 200% 200%, 200% 200%, 200% 200%, 100% 100%;
  animation: roy-liquid-background-flow 14s ease-in-out infinite;
}
@keyframes roy-liquid-background-flow {
  0%, 100% { background-position: 0% 0%, 100% 100%, 50% 0%, 0 0; }
  33%      { background-position: 100% 50%, 0% 50%, 80% 30%, 0 0; }
  66%      { background-position: 50% 100%, 50% 0%, 20% 80%, 0 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-background-flow { animation: none; }
}`,
  },

  // 15. liquid-icon-drip
  {
    id: "liquid-icon-drip",
    name: "Liquid Icon Drip",
    category: "liquid",
    description: "Icon appears to drip and melt downward like a liquid",
    tags: ["liquid", "icon", "drip", "melt", "infinite"],
    previewType: "box",
    cssCode: `/* Liquid: Icon Drip */
.roycss-liquid-icon-drip {
  position: relative;
  width: 64px;
  height: 64px;
  background: linear-gradient(180deg, oklch(0.7 0.2 200), oklch(0.55 0.22 260));
  border-radius: 50% 50% 30% 30%;
  animation: roy-liquid-icon-drip 3s ease-in-out infinite;
}
.roycss-liquid-icon-drip::after {
  content: "";
  position: absolute;
  bottom: -18px;
  left: 50%;
  width: 12px;
  height: 18px;
  background: inherit;
  border-radius: 50% 50% 50% 50% / 30% 30% 70% 70%;
  transform: translateX(-50%);
  animation: roy-liquid-icon-drip-drop 3s ease-in infinite;
}
@keyframes roy-liquid-icon-drip {
  0%, 100% { border-radius: 50% 50% 30% 30%; transform: scaleY(1); }
  50%      { border-radius: 45% 55% 25% 35%; transform: scaleY(1.08); }
}
@keyframes roy-liquid-icon-drip-drop {
  0%, 60%   { transform: translateX(-50%) scaleY(0.6); opacity: 0; }
  70%       { transform: translateX(-50%) scaleY(1); opacity: 1; }
  100%      { transform: translateX(-50%) translateY(40px) scaleY(1.4); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-icon-drip,
  .roycss-liquid-icon-drip::after { animation: none; }
}`,
  },

  // 16. liquid-progress-wave
  {
    id: "liquid-progress-wave",
    name: "Liquid Progress Wave",
    category: "liquid",
    description: "Progress bar with a wavy liquid surface continually undulating",
    tags: ["liquid", "progress", "wave", "bar", "infinite"],
    previewType: "loader",
    cssCode: `/* Liquid: Progress Wave */
.roycss-liquid-progress-wave {
  position: relative;
  width: 100%;
  height: 36px;
  border-radius: 999px;
  overflow: hidden;
  background: oklch(0.2 0.03 240);
  box-shadow: inset 0 0 0 2px oklch(0.6 0.2 220 / 0.3);
}
.roycss-liquid-progress-wave::before,
.roycss-liquid-progress-wave::after {
  content: "";
  position: absolute;
  left: -50%;
  width: 200%;
  height: 200%;
  top: 35%;
  border-radius: 42% 58% 50% 50% / 50% 50% 58% 42%;
}
.roycss-liquid-progress-wave::before {
  background: oklch(0.6 0.2 220);
  animation: roy-liquid-progress-wave 3s linear infinite;
}
.roycss-liquid-progress-wave::after {
  background: oklch(0.7 0.18 200 / 0.5);
  top: 40%;
  animation: roy-liquid-progress-wave 3.5s linear infinite reverse;
}
@keyframes roy-liquid-progress-wave {
  0%   { transform: translateX(0) rotate(0deg); }
  100% { transform: translateX(25%) rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-progress-wave::before,
  .roycss-liquid-progress-wave::after { animation: none; }
}`,
  },

  // 17. liquid-shape-transition
  {
    id: "liquid-shape-transition",
    name: "Liquid Shape Transition",
    category: "liquid",
    description: "Shape continuously transitions through organic liquid forms",
    tags: ["liquid", "shape", "transition", "morph", "organic", "infinite"],
    previewType: "box",
    cssCode: `/* Liquid: Shape Transition */
.roycss-liquid-shape-transition {
  background: linear-gradient(135deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
  animation: roy-liquid-shape-transition 10s ease-in-out infinite;
}
@keyframes roy-liquid-shape-transition {
  0%, 100% { border-radius: 60% 40% 50% 50% / 50% 60% 40% 50%; transform: rotate(0deg); }
  25%      { border-radius: 40% 60% 60% 40% / 60% 40% 60% 40%; transform: rotate(90deg); }
  50%      { border-radius: 50% 50% 40% 60% / 40% 60% 50% 50%; transform: rotate(180deg); }
  75%      { border-radius: 60% 40% 60% 40% / 50% 50% 60% 40%; transform: rotate(270deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-shape-transition { animation: none; border-radius: 30%; }
}`,
  },

  // 18. liquid-hover-splash
  {
    id: "liquid-hover-splash",
    name: "Liquid Hover Splash",
    category: "liquid",
    description: "Splash of liquid color bursts outward on hover",
    tags: ["liquid", "splash", "hover", "burst", "ripple"],
    previewType: "box",
    cssCode: `/* Liquid: Hover Splash */
.roycss-liquid-hover-splash {
  position: relative;
  overflow: hidden;
  background: oklch(0.2 0.04 240);
  z-index: 0;
}
.roycss-liquid-hover-splash::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.62 0.2 220), oklch(0.55 0.22 280));
  transform: translate(-50%, -50%);
  transition: width 0.5s ease, height 0.5s ease;
  z-index: -1;
}
.roycss-liquid-hover-splash:hover::before {
  width: 300%;
  height: 300%;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-hover-splash::before { transition: none; }
}`,
  },

  // 19. liquid-gradient-merge
  {
    id: "liquid-gradient-merge",
    name: "Liquid Gradient Merge",
    category: "liquid",
    description: "Two gradients blend and merge like mixing liquids",
    tags: ["liquid", "gradient", "merge", "blend", "mix", "infinite"],
    previewType: "background",
    cssCode: `/* Liquid: Gradient Merge */
.roycss-liquid-gradient-merge {
  background:
    linear-gradient(90deg, oklch(0.62 0.2 200 / 0.85), transparent 50%),
    linear-gradient(270deg, oklch(0.6 0.22 320 / 0.85), transparent 50%),
    oklch(0.18 0.03 240);
  background-size: 200% 100%, 200% 100%, 100% 100%;
  background-position: 0% 0%, 100% 0%, 0 0;
  animation: roy-liquid-gradient-merge 6s ease-in-out infinite;
}
@keyframes roy-liquid-gradient-merge {
  0%, 100% { background-position: 0% 0%, 100% 0%, 0 0; }
  50%      { background-position: 80% 0%, 20% 0%, 0 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-gradient-merge { animation: none; }
}`,
  },

  // 20. liquid-underline-flow
  {
    id: "liquid-underline-flow",
    name: "Liquid Underline Flow",
    category: "liquid",
    description: "Underline flows in from the left like a stream of liquid",
    tags: ["liquid", "underline", "flow", "text", "hover"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Liquid: Underline Flow */
.roycss-liquid-underline-flow {
  position: relative;
  display: inline-block;
}
.roycss-liquid-underline-flow::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, oklch(0.62 0.2 200), oklch(0.55 0.22 280));
  border-radius: 4px;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.5s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.roycss-liquid-underline-flow:hover::after {
  transform: scaleX(1);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-liquid-underline-flow::after { transition: none; }
}`,
  },
];
