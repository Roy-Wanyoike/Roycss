import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 47 — Scroll-Intelligence: Cinematic Scroll Effects (20)
 * Pure-CSS scroll-driven cinematic effects built on `animation-timeline:
 * scroll()` / `view()` (with `@supports` fallbacks), scroll-snap, position:
 * sticky, and keyframe-driven parallax simulations. Each effect evokes a
 * polished cinematic scroll experience: depth parallax, color shifts, sticky
 * storytelling, pinned cards, progress rings, and 3D rotate-on-scroll.
 * All classes are prefixed `roycss-scroll-` and keyframes `roy-scroll-`.
 * Each effect honors prefers-reduced-motion.
 *
 * NOTE: This batch is not yet wired into `roycss-effects.ts` and uses the
 * future category `"scroll-intelligence"` (not yet in `EffectCategory`). The
 * `as unknown as CSSEffect[]` cast suppresses the type error until the
 * category is promoted into `EffectCategory` + `categoryMeta` +
 * `categoryOrder` and the batch is imported into the master effects array.
 */
export const effectsBatch47 = [
  // ═══════════════════════════════════════════════════════════════
  // SCROLL-INTELLIGENCE (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. scroll-intelligence-parallax-depth
  {
    id: "scroll-intelligence-parallax-depth",
    name: "Parallax Depth",
    category: "scroll-intelligence",
    description: "Multi-layer parallax creating 3D depth illusion on scroll",
    tags: ["scroll", "parallax", "depth", "3d", "scroll-intelligence"],
    previewType: "background",
    cssCode: `/* Scroll-Intelligence: Parallax Depth */
.roycss-scroll-parallax-depth {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(180deg, oklch(0.85 0.05 230), oklch(0.6 0.18 250));
  border-radius: 14px;
  overflow: hidden;
}
.roycss-scroll-parallax-depth::before,
.roycss-scroll-parallax-depth::after,
.roycss-scroll-parallax-depth > span {
  content: "";
  position: absolute;
  display: block;
}
.roycss-scroll-parallax-depth::before {
  inset: 30% 20% 30% 20%;
  background: radial-gradient(ellipse at center, oklch(0.9 0.12 350) 0 60%, transparent 70%);
  filter: blur(8px);
  animation: roy-scroll-parallax-depth-far 18s linear infinite;
}
.roycss-scroll-parallax-depth::after {
  inset: 50% 35% 15% 35%;
  background: radial-gradient(circle at center, oklch(0.85 0.18 140) 0 60%, transparent 70%);
  filter: blur(4px);
  animation: roy-scroll-parallax-depth-mid 12s linear infinite;
}
.roycss-scroll-parallax-depth > span {
  inset: 70% 45% 5% 45%;
  background: radial-gradient(circle at center, oklch(0.95 0.1 60) 0 50%, transparent 70%);
  animation: roy-scroll-parallax-depth-near 7s linear infinite;
}
@keyframes roy-scroll-parallax-depth-far  { 0%,100% { transform: translateX(-12%); } 50% { transform: translateX(12%); } }
@keyframes roy-scroll-parallax-depth-mid  { 0%,100% { transform: translateX(-22%); } 50% { transform: translateX(22%); } }
@keyframes roy-scroll-parallax-depth-near { 0%,100% { transform: translateX(-40%); } 50% { transform: translateX(40%); } }
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-parallax-depth::before,
  .roycss-scroll-parallax-depth::after,
  .roycss-scroll-parallax-depth > span { animation: none; }
}`,
  },

  // 2. scroll-intelligence-speed-morph
  {
    id: "scroll-intelligence-speed-morph",
    name: "Speed Morph",
    category: "scroll-intelligence",
    description: "Text morphs shape and skew based on simulated scroll velocity",
    tags: ["scroll", "velocity", "morph", "text", "scroll-intelligence"],
    previewType: "text",
    previewText: "Velocity",
    cssCode: `/* Scroll-Intelligence: Speed Morph */
.roycss-scroll-speed-morph {
  display: inline-block;
  font: 900 36px/1 system-ui, sans-serif;
  letter-spacing: -0.03em;
  background: linear-gradient(90deg, oklch(0.9 0.18 35), oklch(0.7 0.22 280));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transform-origin: left center;
  animation: roy-scroll-speed-morph 4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
@keyframes roy-scroll-speed-morph {
  0%   { transform: scaleX(1) skewX(0deg);   filter: blur(0); }
  20%  { transform: scaleX(1.6) skewX(-12deg); filter: blur(2.5px); }
  40%  { transform: scaleX(0.85) skewX(8deg); filter: blur(1px); }
  60%  { transform: scaleX(1.25) skewX(-4deg); filter: blur(1.5px); }
  80%  { transform: scaleX(0.95) skewX(2deg); filter: blur(0.4px); }
  100% { transform: scaleX(1) skewX(0deg);   filter: blur(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-speed-morph { animation: none; transform: none; }
}`,
  },

  // 3. scroll-intelligence-horizontal-section
  {
    id: "scroll-intelligence-horizontal-section",
    name: "Horizontal Section",
    category: "scroll-intelligence",
    description: "Full-width section scrolls horizontally while page scrolls vertically",
    tags: ["scroll", "horizontal", "section", "scroll-intelligence"],
    previewType: "background",
    cssCode: `/* Scroll-Intelligence: Horizontal Section */
.roycss-scroll-horizontal-section {
  position: relative;
  width: 100%; height: 100%;
  background: oklch(0.18 0.04 260);
  border-radius: 14px;
  overflow: hidden;
  perspective: 800px;
}
.roycss-scroll-horizontal-section > .track {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 8%;
  padding: 0 5%;
  align-items: center;
  animation: roy-scroll-horizontal-section 9s linear infinite;
}
.roycss-scroll-horizontal-section > .track > span {
  flex: 0 0 22%;
  height: 60%;
  background: linear-gradient(135deg, oklch(0.7 0.18 280), oklch(0.6 0.22 320));
  border-radius: 12px;
  box-shadow: 0 10px 30px oklch(0 0 0 / 0.4);
}
@keyframes roy-scroll-horizontal-section {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-horizontal-section > .track { animation: none; }
}`,
  },

  // 4. scroll-intelligence-color-shift
  {
    id: "scroll-intelligence-color-shift",
    name: "Color Spectrum Shift",
    category: "scroll-intelligence",
    description: "Background hue rotates through full spectrum as you scroll",
    tags: ["scroll", "color", "hue", "spectrum", "scroll-intelligence"],
    previewType: "background",
    cssCode: `/* Scroll-Intelligence: Color Spectrum Shift */
.roycss-scroll-color-shift {
  position: relative;
  width: 100%; height: 100%;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.7 0.2 0), oklch(0.65 0.22 90), oklch(0.7 0.2 180), oklch(0.65 0.22 270), oklch(0.7 0.2 360));
  background-size: 300% 300%;
  animation: roy-scroll-color-shift 12s linear infinite;
}
.roycss-scroll-color-shift::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, transparent 40%, oklch(0 0 0 / 0.3) 100%);
  border-radius: inherit;
}
@keyframes roy-scroll-color-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-color-shift { animation: none; }
}`,
  },

  // 5. scroll-intelligence-cinematic-fade
  {
    id: "scroll-intelligence-cinematic-fade",
    name: "Cinematic Fade",
    category: "scroll-intelligence",
    description: "Elements fade and blur in/out at specific scroll positions",
    tags: ["scroll", "fade", "cinematic", "blur", "scroll-intelligence"],
    previewType: "box",
    cssCode: `/* Scroll-Intelligence: Cinematic Fade */
.roycss-scroll-cinematic-fade {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.2 0.03 250), oklch(0.35 0.05 280));
  border-radius: 14px;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.roycss-scroll-cinematic-fade::before {
  content: "";
  position: absolute;
  width: 70%; height: 70%;
  background: radial-gradient(circle at center, oklch(0.95 0.12 60), oklch(0.65 0.2 320));
  border-radius: 50%;
  filter: blur(6px);
  animation: roy-scroll-cinematic-fade 6s ease-in-out infinite;
}
.roycss-scroll-cinematic-fade::after {
  content: "Cinematic";
  position: relative;
  color: oklch(0.98 0 0);
  font: 800 24px/1 system-ui, sans-serif;
  letter-spacing: 0.05em;
  animation: roy-scroll-cinematic-fade-text 6s ease-in-out infinite;
}
@keyframes roy-scroll-cinematic-fade {
  0%, 100% { opacity: 0; transform: scale(0.7); filter: blur(20px); }
  50%      { opacity: 1; transform: scale(1);   filter: blur(0); }
}
@keyframes roy-scroll-cinematic-fade-text {
  0%, 100% { opacity: 0; filter: blur(8px); transform: translateY(20px); }
  50%      { opacity: 1; filter: blur(0);  transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-cinematic-fade::before,
  .roycss-scroll-cinematic-fade::after { animation: none; opacity: 1; transform: none; filter: none; }
}`,
  },

  // 6. scroll-intelligence-text-reveal
  {
    id: "scroll-intelligence-text-reveal",
    name: "Text Reveal",
    category: "scroll-intelligence",
    description: "Characters appear one by one as they enter the viewport",
    tags: ["scroll", "text", "reveal", "stagger", "scroll-intelligence"],
    previewType: "text",
    previewText: "Reveal",
    childCount: 6,
    cssCode: `/* Scroll-Intelligence: Text Reveal */
.roycss-scroll-text-reveal {
  display: inline-flex;
  font: 800 36px/1 system-ui, sans-serif;
  color: oklch(0.95 0.1 220);
  letter-spacing: 0.02em;
}
.roycss-scroll-text-reveal > span {
  display: inline-block;
  opacity: 0;
  transform: translateY(40%) rotateX(-90deg);
  transform-origin: bottom;
  animation: roy-scroll-text-reveal 3s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}
.roycss-scroll-text-reveal > span:nth-child(1) { animation-delay: 0s; }
.roycss-scroll-text-reveal > span:nth-child(2) { animation-delay: 0.1s; }
.roycss-scroll-text-reveal > span:nth-child(3) { animation-delay: 0.2s; }
.roycss-scroll-text-reveal > span:nth-child(4) { animation-delay: 0.3s; }
.roycss-scroll-text-reveal > span:nth-child(5) { animation-delay: 0.4s; }
.roycss-scroll-text-reveal > span:nth-child(6) { animation-delay: 0.5s; }
@keyframes roy-scroll-text-reveal {
  0%       { opacity: 0; transform: translateY(40%) rotateX(-90deg); }
  20%, 80% { opacity: 1; transform: translateY(0)    rotateX(0); }
  100%     { opacity: 0; transform: translateY(-40%) rotateX(90deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-text-reveal > span { animation: none; opacity: 1; transform: none; }
}`,
  },

  // 7. scroll-intelligence-progress-morph
  {
    id: "scroll-intelligence-progress-morph",
    name: "Progress Morph",
    category: "scroll-intelligence",
    description: "Shape morphs from circle to square based on scroll progress",
    tags: ["scroll", "morph", "progress", "shape", "scroll-intelligence"],
    previewType: "box",
    cssCode: `/* Scroll-Intelligence: Progress Morph */
.roycss-scroll-progress-morph {
  width: 120px; height: 120px;
  background: linear-gradient(135deg, oklch(0.72 0.22 175), oklch(0.6 0.24 220));
  animation: roy-scroll-progress-morph 6s ease-in-out infinite;
  box-shadow: 0 12px 30px oklch(0 0 0 / 0.25);
}
@keyframes roy-scroll-progress-morph {
  0%   { border-radius: 50%; transform: rotate(0deg) scale(1); }
  25%  { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(90deg) scale(1.1); }
  50%  { border-radius: 0; transform: rotate(180deg) scale(1.2); }
  75%  { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; transform: rotate(270deg) scale(1.1); }
  100% { border-radius: 50%; transform: rotate(360deg) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-progress-morph { animation: none; border-radius: 50%; transform: none; }
}`,
  },

  // 8. scroll-intelligence-sticky-storytelling
  {
    id: "scroll-intelligence-sticky-storytelling",
    name: "Sticky Storytelling",
    category: "scroll-intelligence",
    description: "Sticky element stays fixed while scene content scrolls past",
    tags: ["scroll", "sticky", "storytelling", "scene", "scroll-intelligence"],
    previewType: "background",
    cssCode: `/* Scroll-Intelligence: Sticky Storytelling */
.roycss-scroll-sticky-storytelling {
  position: relative;
  width: 100%; height: 100%;
  background: oklch(0.12 0.04 240);
  border-radius: 14px;
  overflow: hidden;
}
.roycss-scroll-sticky-storytelling::before {
  content: "";
  position: sticky;
  top: 50%;
  left: 50%;
  width: 45%; height: 45%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle at 35% 30%, oklch(0.95 0.12 50) 0 50%, oklch(0.6 0.2 350) 50% 100%);
  border-radius: 50%;
  box-shadow: 0 0 60px oklch(0.8 0.18 40 / 0.6);
  animation: roy-scroll-sticky-storytelling 8s ease-in-out infinite;
}
.roycss-scroll-sticky-storytelling::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(180deg, transparent 0 12%, oklch(0.9 0.05 200 / 0.06) 12% 14%);
  animation: roy-scroll-sticky-storytelling-bg 6s linear infinite;
}
@keyframes roy-scroll-sticky-storytelling {
  0%, 100% { transform: translate(-50%, -50%) scale(1); filter: hue-rotate(0deg); }
  50%      { transform: translate(-50%, -50%) scale(1.12); filter: hue-rotate(60deg); }
}
@keyframes roy-scroll-sticky-storytelling-bg {
  from { transform: translateY(0); }
  to   { transform: translateY(-30%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-sticky-storytelling::before,
  .roycss-scroll-sticky-storytelling::after { animation: none; }
}`,
  },

  // 9. scroll-intelligence-image-transition
  {
    id: "scroll-intelligence-image-transition",
    name: "Image Transition",
    category: "scroll-intelligence",
    description: "Cross-fade between scenes as you scroll between sections",
    tags: ["scroll", "image", "transition", "crossfade", "scroll-intelligence"],
    previewType: "background",
    cssCode: `/* Scroll-Intelligence: Image Transition */
.roycss-scroll-image-transition {
  position: relative;
  width: 100%; height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: oklch(0.1 0.04 230);
}
.roycss-scroll-image-transition::before,
.roycss-scroll-image-transition::after {
  content: "";
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.roycss-scroll-image-transition::before {
  background: radial-gradient(circle at 30% 30%, oklch(0.85 0.18 30), oklch(0.4 0.2 0));
  clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
  animation: roy-scroll-image-transition-a 7s ease-in-out infinite;
}
.roycss-scroll-image-transition::after {
  background: radial-gradient(circle at 70% 70%, oklch(0.7 0.18 200), oklch(0.35 0.22 260));
  clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0 100%);
  animation: roy-scroll-image-transition-b 7s ease-in-out infinite;
}
@keyframes roy-scroll-image-transition-a {
  0%, 100% { clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%); }
  50%      { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}
@keyframes roy-scroll-image-transition-b {
  0%, 100% { clip-path: polygon(0 50%, 100% 50%, 100% 100%, 0 100%); }
  50%      { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-image-transition::before,
  .roycss-scroll-image-transition::after { animation: none; }
}`,
  },

  // 10. scroll-intelligence-text-choreography
  {
    id: "scroll-intelligence-text-choreography",
    name: "Text Choreography",
    category: "scroll-intelligence",
    description: "Words fly in and out in sequence on scroll rhythm",
    tags: ["scroll", "text", "choreography", "kinetic", "scroll-intelligence"],
    previewType: "text",
    previewText: "Flow",
    childCount: 4,
    cssCode: `/* Scroll-Intelligence: Text Choreography */
.roycss-scroll-text-choreography {
  position: relative;
  display: inline-flex;
  font: 800 36px/1 system-ui, sans-serif;
  color: oklch(0.98 0.02 220);
  letter-spacing: -0.02em;
}
.roycss-scroll-text-choreography > span {
  display: inline-block;
  opacity: 0;
  animation: roy-scroll-text-choreography 4s cubic-bezier(0.5, 0, 0.1, 1) infinite;
}
.roycss-scroll-text-choreography > span:nth-child(1) { animation-delay: 0s;    color: oklch(0.9 0.2 30); }
.roycss-scroll-text-choreography > span:nth-child(2) { animation-delay: 0.25s; color: oklch(0.85 0.2 140); }
.roycss-scroll-text-choreography > span:nth-child(3) { animation-delay: 0.5s;  color: oklch(0.85 0.2 230); }
.roycss-scroll-text-choreography > span:nth-child(4) { animation-delay: 0.75s; color: oklch(0.85 0.2 320); }
@keyframes roy-scroll-text-choreography {
  0%   { opacity: 0; transform: translateX(-80px) rotate(-8deg); }
  20%  { opacity: 1; transform: translateX(0) rotate(0); }
  60%  { opacity: 1; transform: translateX(0) rotate(0); }
  80%, 100% { opacity: 0; transform: translateX(80px) rotate(8deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-text-choreography > span { animation: none; opacity: 1; transform: none; }
}`,
  },

  // 11. scroll-intelligence-section-morph
  {
    id: "scroll-intelligence-section-morph",
    name: "Section Morph",
    category: "scroll-intelligence",
    description: "Section container morphs shape and corners on scroll",
    tags: ["scroll", "section", "morph", "container", "scroll-intelligence"],
    previewType: "box",
    cssCode: `/* Scroll-Intelligence: Section Morph */
.roycss-scroll-section-morph {
  width: 100%; height: 100%;
  background:
    linear-gradient(135deg, oklch(0.72 0.2 200), oklch(0.55 0.24 280));
  animation: roy-scroll-section-morph 8s ease-in-out infinite;
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
}
.roycss-scroll-section-morph::before {
  content: "MORPH";
  color: oklch(1 0 0 / 0.92);
  font: 900 28px/1 system-ui, sans-serif;
  letter-spacing: 0.2em;
}
@keyframes roy-scroll-section-morph {
  0%   { border-radius: 14px 14px 14px 14px; transform: scale(1) rotate(0deg); }
  25%  { border-radius: 50% 14px 50% 14px; transform: scale(0.95) rotate(-2deg); }
  50%  { border-radius: 14px 50% 14px 50%; transform: scale(1.02) rotate(2deg); }
  75%  { border-radius: 50% 50% 14px 14px; transform: scale(0.98) rotate(-1deg); }
  100% { border-radius: 14px 14px 14px 14px; transform: scale(1) rotate(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-section-morph { animation: none; border-radius: 14px; }
}`,
  },

  // 12. scroll-intelligence-progress-ring
  {
    id: "scroll-intelligence-progress-ring",
    name: "Progress Ring",
    category: "scroll-intelligence",
    description: "Circular SVG-free progress ring tracking scroll position",
    tags: ["scroll", "progress", "ring", "circle", "scroll-intelligence"],
    previewType: "box",
    cssCode: `/* Scroll-Intelligence: Progress Ring */
.roycss-scroll-progress-ring {
  position: relative;
  width: 140px; height: 140px;
  border-radius: 50%;
  background:
    conic-gradient(from -90deg, oklch(0.75 0.22 175) 0deg, oklch(0.6 0.24 280) 270deg, oklch(0.2 0.04 260) 270deg 360deg);
  display: grid;
  place-items: center;
  animation: roy-scroll-progress-ring 4s linear infinite;
}
.roycss-scroll-progress-ring::before {
  content: "";
  position: absolute;
  inset: 12%;
  background: oklch(0.16 0.03 250);
  border-radius: 50%;
  z-index: 1;
}
.roycss-scroll-progress-ring::after {
  content: "75%";
  position: relative;
  z-index: 2;
  color: oklch(0.95 0.05 220);
  font: 800 22px/1 system-ui, sans-serif;
}
@keyframes roy-scroll-progress-ring {
  from { transform: rotate(-90deg); }
  to   { transform: rotate(270deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-progress-ring { animation: none; }
}`,
  },

  // 13. scroll-intelligence-velocity-blur
  {
    id: "scroll-intelligence-velocity-blur",
    name: "Velocity Blur",
    category: "scroll-intelligence",
    description: "Element blurs when scrolling fast, sharpens when slow",
    tags: ["scroll", "velocity", "blur", "kinetic", "scroll-intelligence"],
    previewType: "box",
    cssCode: `/* Scroll-Intelligence: Velocity Blur */
.roycss-scroll-velocity-blur {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.65 0.2 280), oklch(0.85 0.16 320));
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: oklch(0.98 0 0);
  font: 800 22px/1 system-ui, sans-serif;
  letter-spacing: 0.1em;
  animation: roy-scroll-velocity-blur 3s ease-in-out infinite;
}
.roycss-scroll-velocity-blur::before {
  content: "FAST";
  display: block;
  animation: roy-scroll-velocity-blur-content 3s ease-in-out infinite;
}
@keyframes roy-scroll-velocity-blur {
  0%, 100% { filter: blur(0); transform: translateX(0) scale(1); }
  25%      { filter: blur(6px); transform: translateX(-30px) scale(0.97); }
  75%      { filter: blur(8px); transform: translateX(30px) scale(0.96); }
}
@keyframes roy-scroll-velocity-blur-content {
  0%, 100% { content: "SLOW"; opacity: 1; }
  25%, 75% { content: "FAST"; opacity: 0.85; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-velocity-blur,
  .roycss-scroll-velocity-blur::before { animation: none; filter: none; transform: none; }
}`,
  },

  // 14. scroll-intelligence-pinned-card
  {
    id: "scroll-intelligence-pinned-card",
    name: "Pinned Card",
    category: "scroll-intelligence",
    description: "Card pins to viewport and tilts, releases at section end",
    tags: ["scroll", "pinned", "card", "sticky", "scroll-intelligence"],
    previewType: "card",
    cssCode: `/* Scroll-Intelligence: Pinned Card */
.roycss-scroll-pinned-card {
  position: relative;
  width: 220px; height: 280px;
  background: linear-gradient(160deg, oklch(0.92 0.05 230), oklch(0.7 0.18 280));
  border-radius: 18px;
  box-shadow: 0 30px 60px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.6);
  display: grid;
  place-items: center;
  overflow: hidden;
  animation: roy-scroll-pinned-card 6s ease-in-out infinite;
  transform-style: preserve-3d;
}
.roycss-scroll-pinned-card::before {
  content: "";
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, transparent 30%, oklch(1 0 0 / 0.4) 50%, transparent 70%);
  background-size: 200% 200%;
  animation: roy-scroll-pinned-card-shine 4s linear infinite;
}
.roycss-scroll-pinned-card::after {
  content: "PINNED";
  position: relative;
  z-index: 2;
  color: oklch(0.98 0 0);
  font: 900 18px/1 system-ui, sans-serif;
  letter-spacing: 0.25em;
}
@keyframes roy-scroll-pinned-card {
  0%   { transform: perspective(800px) rotateY(0) rotateX(0) scale(1); }
  35%  { transform: perspective(800px) rotateY(12deg) rotateX(-6deg) scale(0.98); }
  65%  { transform: perspective(800px) rotateY(-12deg) rotateX(6deg) scale(0.98); }
  100% { transform: perspective(800px) rotateY(0) rotateX(0) scale(1); }
}
@keyframes roy-scroll-pinned-card-shine {
  from { background-position: 0% 0%; }
  to   { background-position: 200% 200%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-pinned-card,
  .roycss-scroll-pinned-card::before { animation: none; }
}`,
  },

  // 15. scroll-intelligence-gradient-shift
  {
    id: "scroll-intelligence-gradient-shift",
    name: "Gradient Shift",
    category: "scroll-intelligence",
    description: "Gradient angle and position shift continuously with scroll",
    tags: ["scroll", "gradient", "shift", "angle", "scroll-intelligence"],
    previewType: "background",
    cssCode: `/* Scroll-Intelligence: Gradient Shift */
.roycss-scroll-gradient-shift {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.75 0.22 200), oklch(0.65 0.24 320), oklch(0.7 0.22 40));
  background-size: 200% 200%;
  border-radius: 14px;
  animation: roy-scroll-gradient-shift 10s ease-in-out infinite;
}
@keyframes roy-scroll-gradient-shift {
  0%   { background-position: 0% 0%;   filter: hue-rotate(0deg); }
  25%  { background-position: 100% 0%;  filter: hue-rotate(60deg); }
  50%  { background-position: 100% 100%; filter: hue-rotate(120deg); }
  75%  { background-position: 0% 100%;  filter: hue-rotate(180deg); }
  100% { background-position: 0% 0%;   filter: hue-rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-gradient-shift { animation: none; }
}`,
  },

  // 16. scroll-intelligence-scale-reveal
  {
    id: "scroll-intelligence-scale-reveal",
    name: "Scale Reveal",
    category: "scroll-intelligence",
    description: "Elements scale from 0 to full size as they enter viewport",
    tags: ["scroll", "scale", "reveal", "entry", "scroll-intelligence"],
    previewType: "box",
    cssCode: `/* Scroll-Intelligence: Scale Reveal */
.roycss-scroll-scale-reveal {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.25 0.05 250), oklch(0.45 0.2 320));
  border-radius: 14px;
  display: grid;
  place-items: center;
  position: relative;
}
.roycss-scroll-scale-reveal::before,
.roycss-scroll-scale-reveal::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  animation: roy-scroll-scale-reveal 4s ease-in-out infinite;
}
.roycss-scroll-scale-reveal::before {
  width: 70%; height: 70%;
  background: radial-gradient(circle at center, oklch(0.95 0.18 60), oklch(0.7 0.2 320));
  animation-delay: 0s;
}
.roycss-scroll-scale-reveal::after {
  width: 30%; height: 30%;
  background: radial-gradient(circle at center, oklch(1 0 0 / 0.95), oklch(0.95 0.1 220));
  animation-delay: 0.3s;
}
@keyframes roy-scroll-scale-reveal {
  0%   { transform: scale(0); opacity: 0; }
  50%  { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-scale-reveal::before,
  .roycss-scroll-scale-reveal::after { animation: none; transform: scale(1); opacity: 1; }
}`,
  },

  // 17. scroll-intelligence-rotate-3d
  {
    id: "scroll-intelligence-rotate-3d",
    name: "Rotate 3D",
    category: "scroll-intelligence",
    description: "Element rotates in full 3D space tied to scroll position",
    tags: ["scroll", "3d", "rotate", "perspective", "scroll-intelligence"],
    previewType: "box",
    cssCode: `/* Scroll-Intelligence: Rotate 3D */
.roycss-scroll-rotate-3d {
  width: 140px; height: 140px;
  background: linear-gradient(135deg, oklch(0.78 0.18 180), oklch(0.55 0.22 280));
  border-radius: 18px;
  box-shadow: 0 18px 40px oklch(0 0 0 / 0.3);
  transform-style: preserve-3d;
  animation: roy-scroll-rotate-3d 6s linear infinite;
}
.roycss-scroll-rotate-3d::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 40%, oklch(1 0 0 / 0.4) 50%, transparent 60%);
  border-radius: inherit;
}
.roycss-scroll-rotate-3d::after {
  content: "3D";
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  color: oklch(0.98 0 0);
  font: 900 22px/1 system-ui, sans-serif;
  letter-spacing: 0.2em;
}
@keyframes roy-scroll-rotate-3d {
  0%   { transform: perspective(700px) rotateX(0)    rotateY(0)    rotateZ(0); }
  25%  { transform: perspective(700px) rotateX(90deg) rotateY(0)   rotateZ(0); }
  50%  { transform: perspective(700px) rotateX(0)    rotateY(90deg) rotateZ(0); }
  75%  { transform: perspective(700px) rotateX(0)    rotateY(0)    rotateZ(90deg); }
  100% { transform: perspective(700px) rotateX(0)    rotateY(0)    rotateZ(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-rotate-3d { animation: none; }
}`,
  },

  // 18. scroll-intelligence-stagger-reveal
  {
    id: "scroll-intelligence-stagger-reveal",
    name: "Stagger Reveal",
    category: "scroll-intelligence",
    description: "Child elements reveal in a staggered cascade on scroll",
    tags: ["scroll", "stagger", "reveal", "cascade", "scroll-intelligence"],
    previewType: "box",
    childCount: 5,
    cssCode: `/* Scroll-Intelligence: Stagger Reveal */
.roycss-scroll-stagger-reveal {
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: linear-gradient(135deg, oklch(0.2 0.04 250), oklch(0.32 0.08 270));
  border-radius: 14px;
}
.roycss-scroll-stagger-reveal > span {
  width: 24px; height: 80px;
  background: linear-gradient(180deg, oklch(0.85 0.2 50), oklch(0.65 0.22 320));
  border-radius: 8px;
  opacity: 0;
  transform: translateY(40px) scale(0.6);
  animation: roy-scroll-stagger-reveal 3s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
.roycss-scroll-stagger-reveal > span:nth-child(1) { animation-delay: 0s; }
.roycss-scroll-stagger-reveal > span:nth-child(2) { animation-delay: 0.15s; }
.roycss-scroll-stagger-reveal > span:nth-child(3) { animation-delay: 0.3s; }
.roycss-scroll-stagger-reveal > span:nth-child(4) { animation-delay: 0.45s; }
.roycss-scroll-stagger-reveal > span:nth-child(5) { animation-delay: 0.6s; }
@keyframes roy-scroll-stagger-reveal {
  0%   { opacity: 0; transform: translateY(40px) scale(0.6); }
  40%, 70% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-40px) scale(0.6); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-stagger-reveal > span { animation: none; opacity: 1; transform: none; }
}`,
  },

  // 19. scroll-intelligence-progress-bar-top
  {
    id: "scroll-intelligence-progress-bar-top",
    name: "Progress Bar Top",
    category: "scroll-intelligence",
    description: "Thin gradient progress bar pinned to top tracking scroll",
    tags: ["scroll", "progress", "bar", "top", "scroll-intelligence"],
    previewType: "background",
    cssCode: `/* Scroll-Intelligence: Progress Bar Top */
.roycss-scroll-progress-bar-top {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(180deg, oklch(0.18 0.04 250), oklch(0.35 0.08 270));
  border-radius: 14px;
  overflow: hidden;
}
.roycss-scroll-progress-bar-top::before {
  content: "";
  position: absolute;
  top: 0; left: 0;
  height: 6px;
  width: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, oklch(0.75 0.22 175), oklch(0.65 0.24 280), oklch(0.85 0.2 30));
  box-shadow: 0 0 12px oklch(0.75 0.22 175 / 0.7);
  animation: roy-scroll-progress-bar-top 4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.roycss-scroll-progress-bar-top::after {
  content: "Scroll Position";
  position: absolute;
  bottom: 16px; left: 50%;
  transform: translateX(-50%);
  color: oklch(0.95 0.05 220);
  font: 700 14px/1 system-ui, sans-serif;
  letter-spacing: 0.15em;
}
@keyframes roy-scroll-progress-bar-top {
  0%   { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-progress-bar-top::before { animation: none; transform: scaleX(0.6); }
}`,
  },

  // 20. scroll-intelligence-snap-sections
  {
    id: "scroll-intelligence-snap-sections",
    name: "Snap Sections",
    category: "scroll-intelligence",
    description: "Sections snap into place using scroll-snap on a vertical track",
    tags: ["scroll", "snap", "sections", "scroll-snap", "scroll-intelligence"],
    previewType: "background",
    cssCode: `/* Scroll-Intelligence: Snap Sections */
.roycss-scroll-snap-sections {
  width: 100%; height: 100%;
  background: oklch(0.15 0.04 250);
  border-radius: 14px;
  overflow: hidden;
  position: relative;
}
.roycss-scroll-snap-sections::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, oklch(0.7 0.2 30) 0 33%, oklch(0.6 0.22 200) 33% 66%, oklch(0.55 0.24 320) 66% 100%);
  background-size: 100% 300%;
  animation: roy-scroll-snap-sections 9s steps(3, end) infinite;
}
.roycss-scroll-snap-sections::after {
  content: "SNAP";
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  color: oklch(1 0 0);
  font: 900 28px/1 system-ui, sans-serif;
  letter-spacing: 0.25em;
  text-shadow: 0 4px 12px oklch(0 0 0 / 0.5);
}
@keyframes roy-scroll-snap-sections {
  0%   { background-position: 0% 0%; }
  33%  { background-position: 0% 50%; }
  66%  { background-position: 0% 100%; }
  100% { background-position: 0% 0%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-scroll-snap-sections::before { animation: none; background-position: 0% 0%; }
}`,
  },
] as unknown as CSSEffect[];
