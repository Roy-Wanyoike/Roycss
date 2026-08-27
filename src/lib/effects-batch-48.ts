import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 48 — Cursor-FX: Cursor & Pointer Effects (20)
 * Pure-CSS cursor and pointer-driven effects: glow trails, spotlights,
 * magnetic attraction, distortion, image previews, gradient follow, ripple
 * clicks, 3D tilt, particle emit, blur regions, color pickers, tooltips,
 * glow rings, inversion regions, and elastic snap. Each effect is driven by
 * :hover, :focus-within, or auto-running keyframe simulations of pointer
 * motion. All classes are prefixed `roycss-cursor-fx-` and keyframes
 * `roy-cursor-fx-`. Each effect honors prefers-reduced-motion.
 */
export const effectsBatch48: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // CURSOR-FX (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. cursor-fx-glow-trail
  {
    id: "cursor-fx-glow-trail",
    name: "Glow Trail",
    category: "cursor-fx",
    description: "Glowing comet-like trail follows an animated cursor path",
    tags: ["cursor", "glow", "trail", "comet", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Glow Trail */
.roycss-cursor-fx-glow-trail {
  position: relative;
  width: 100%; height: 100%;
  background: oklch(0.1 0.04 250);
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-glow-trail::before,
.roycss-cursor-fx-glow-trail::after {
  content: "";
  position: absolute;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(1 0 0 / 0.95), oklch(0.85 0.22 60 / 0.6) 40%, transparent 70%);
  filter: blur(1px);
}
.roycss-cursor-fx-glow-trail::before {
  offset-path: path("M 20 80 Q 120 -20 220 80 T 420 80");
  animation: roy-cursor-fx-glow-trail 3s linear infinite;
}
.roycss-cursor-fx-glow-trail::after {
  width: 60px; height: 60px;
  background: radial-gradient(circle, oklch(0.9 0.22 60 / 0.5), transparent 60%);
  filter: blur(8px);
  offset-path: path("M 20 80 Q 120 -20 220 80 T 420 80");
  animation: roy-cursor-fx-glow-trail 3s linear infinite;
  animation-delay: -0.1s;
}
@keyframes roy-cursor-fx-glow-trail {
  from { offset-distance: 0%;   opacity: 1; }
  to   { offset-distance: 100%; opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-glow-trail::before,
  .roycss-cursor-fx-glow-trail::after { animation: none; opacity: 0.7; }
}`,
  },

  // 2. cursor-fx-spotlight
  {
    id: "cursor-fx-spotlight",
    name: "Spotlight",
    category: "cursor-fx",
    description: "Spotlight reveals hidden content near a moving cursor",
    tags: ["cursor", "spotlight", "reveal", "mask", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Spotlight */
.roycss-cursor-fx-spotlight {
  position: relative;
  width: 100%; height: 100%;
  background:
    linear-gradient(135deg, oklch(0.18 0.04 250), oklch(0.32 0.06 270)),
    radial-gradient(circle at center, oklch(0.85 0.22 60), oklch(0.65 0.24 320));
  background-blend-mode: multiply;
  border-radius: 14px;
  overflow: hidden;
  color: oklch(0.96 0 0);
}
.roycss-cursor-fx-spotlight::before {
  content: "";
  position: absolute;
  width: 140px; height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, transparent 0 38%, oklch(0.2 0.04 250) 42%, oklch(0.2 0.04 250 / 0.9) 100%);
  mix-blend-mode: multiply;
  pointer-events: none;
  animation: roy-cursor-fx-spotlight 4s ease-in-out infinite;
}
.roycss-cursor-fx-spotlight::after {
  content: "Hidden Text";
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  color: oklch(1 0 0);
  font: 800 24px/1 system-ui, sans-serif;
  letter-spacing: 0.1em;
  opacity: 0.4;
}
@keyframes roy-cursor-fx-spotlight {
  0%   { transform: translate(10%, 80%); }
  25%  { transform: translate(80%, 10%); }
  50%  { transform: translate(60%, 90%); }
  75%  { transform: translate(10%, 30%); }
  100% { transform: translate(10%, 80%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-spotlight::before { animation: none; transform: translate(40%, 40%); }
}`,
  },

  // 3. cursor-fx-magnetic-attraction
  {
    id: "cursor-fx-magnetic-attraction",
    name: "Magnetic Attraction",
    category: "cursor-fx",
    description: "Element magnetically attracts toward an orbiting cursor",
    tags: ["cursor", "magnetic", "attraction", "pull", "cursor-fx"],
    previewType: "box",
    cssCode: `/* Cursor-FX: Magnetic Attraction */
.roycss-cursor-fx-magnetic-attraction {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.25 0.05 250), oklch(0.4 0.08 270));
  border-radius: 14px;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.roycss-cursor-fx-magnetic-attraction::before {
  content: "";
  position: absolute;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: oklch(0.95 0.05 60);
  box-shadow: 0 0 20px oklch(0.9 0.18 60 / 0.8);
  animation: roy-cursor-fx-magnetic-attraction-cursor 5s linear infinite;
}
.roycss-cursor-fx-magnetic-attraction::after {
  content: "";
  width: 80px; height: 80px;
  border-radius: 18px;
  background: linear-gradient(135deg, oklch(0.78 0.2 180), oklch(0.6 0.22 320));
  box-shadow: 0 8px 24px oklch(0 0 0 / 0.3);
  animation: roy-cursor-fx-magnetic-attraction-card 5s linear infinite;
}
@keyframes roy-cursor-fx-magnetic-attraction-cursor {
  0%   { transform: translate(-60px, -40px); }
  50%  { transform: translate(80px, 60px); }
  100% { transform: translate(-60px, -40px); }
}
@keyframes roy-cursor-fx-magnetic-attraction-card {
  0%, 100% { transform: translate(-20px, -15px); }
  50%      { transform: translate(30px, 20px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-magnetic-attraction::before,
  .roycss-cursor-fx-magnetic-attraction::after { animation: none; }
}`,
  },

  // 4. cursor-fx-distortion
  {
    id: "cursor-fx-distortion",
    name: "Distortion",
    category: "cursor-fx",
    description: "Background distorts and warps near the moving cursor",
    tags: ["cursor", "distortion", "warp", "displace", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Distortion */
.roycss-cursor-fx-distortion {
  position: relative;
  width: 100%; height: 100%;
  background:
    repeating-linear-gradient(0deg, oklch(0.65 0.22 200) 0 14px, oklch(0.5 0.24 280) 14px 28px);
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-distortion::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, transparent 0 60px, oklch(0.85 0.2 30 / 0.6) 65px, transparent 75px);
  mix-blend-mode: screen;
  animation: roy-cursor-fx-distortion 5s ease-in-out infinite;
}
.roycss-cursor-fx-distortion::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, transparent 0 50px, oklch(0.7 0.22 320 / 0.4) 55px, transparent 70px);
  filter: blur(4px);
  mix-blend-mode: overlay;
  animation: roy-cursor-fx-distortion 5s ease-in-out infinite;
}
@keyframes roy-cursor-fx-distortion {
  0%, 100% { background-position: 30% 50%; transform: translateX(0); }
  25%      { background-position: 70% 30%; transform: translateX(20px) scaleY(1.05); }
  50%      { background-position: 60% 80%; transform: translateX(-15px) scaleY(0.95); }
  75%      { background-position: 20% 60%; transform: translateX(10px) scaleY(1.02); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-distortion::before,
  .roycss-cursor-fx-distortion::after { animation: none; }
}`,
  },

  // 5. cursor-fx-text-replacement
  {
    id: "cursor-fx-text-replacement",
    name: "Text Replacement",
    category: "cursor-fx",
    description: "Cursor swaps the displayed text on hover via ::before",
    tags: ["cursor", "text", "replacement", "hover", "cursor-fx"],
    previewType: "text",
    previewText: "Hover",
    cssCode: `/* Cursor-FX: Text Replacement */
.roycss-cursor-fx-text-replacement {
  display: inline-block;
  position: relative;
  font: 800 36px/1 system-ui, sans-serif;
  color: oklch(0.95 0.1 220);
  cursor: pointer;
}
.roycss-cursor-fx-text-replacement::before {
  content: "Hover";
  display: block;
}
.roycss-cursor-fx-text-replacement::after {
  content: "Clicked!";
  position: absolute;
  inset: 0;
  display: block;
  color: oklch(0.85 0.22 30);
  opacity: 0;
  transform: translateY(0);
  transition: opacity 0.4s, transform 0.4s;
}
.roycss-cursor-fx-text-replacement:hover::before {
  opacity: 0;
  transform: translateY(-12px);
  transition: opacity 0.4s, transform 0.4s;
}
.roycss-cursor-fx-text-replacement:hover::after {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-text-replacement::before,
  .roycss-cursor-fx-text-replacement::after,
  .roycss-cursor-fx-text-replacement:hover::before,
  .roycss-cursor-fx-text-replacement:hover::after { transition: none; transform: none; }
}`,
  },

  // 6. cursor-fx-image-preview
  {
    id: "cursor-fx-image-preview",
    name: "Image Preview",
    category: "cursor-fx",
    description: "Floating image preview follows an animated cursor path",
    tags: ["cursor", "image", "preview", "follow", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Image Preview */
.roycss-cursor-fx-image-preview {
  position: relative;
  width: 100%; height: 100%;
  background:
    repeating-linear-gradient(45deg, oklch(0.3 0.05 250) 0 12px, oklch(0.22 0.04 260) 12px 24px);
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-image-preview::before {
  content: "";
  position: absolute;
  width: 90px; height: 90px;
  border-radius: 10px;
  background:
    linear-gradient(135deg, oklch(0.85 0.22 30), oklch(0.65 0.24 320));
  box-shadow: 0 12px 30px oklch(0 0 0 / 0.45), 0 0 0 3px oklch(1 0 0 / 0.6);
  animation: roy-cursor-fx-image-preview 5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.roycss-cursor-fx-image-preview::after {
  content: "";
  position: absolute;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: oklch(1 0 0);
  box-shadow: 0 0 0 4px oklch(1 0 0 / 0.4);
  animation: roy-cursor-fx-image-preview-dot 5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes roy-cursor-fx-image-preview {
  0%, 100% { transform: translate(-180px, -60px) rotate(-6deg); }
  50%      { transform: translate(60px, 40px)   rotate(6deg); }
}
@keyframes roy-cursor-fx-image-preview-dot {
  0%, 100% { transform: translate(-100px, -90px); }
  50%      { transform: translate(140px, 10px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-image-preview::before,
  .roycss-cursor-fx-image-preview::after { animation: none; }
}`,
  },

  // 7. cursor-fx-gradient-follow
  {
    id: "cursor-fx-gradient-follow",
    name: "Gradient Follow",
    category: "cursor-fx",
    description: "Soft gradient highlight follows the cursor position",
    tags: ["cursor", "gradient", "follow", "highlight", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Gradient Follow */
.roycss-cursor-fx-gradient-follow {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.18 0.04 250), oklch(0.32 0.08 270));
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-gradient-follow::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, oklch(0.95 0.18 60 / 0.55), oklch(0.7 0.22 320 / 0.3) 30%, transparent 60%);
  animation: roy-cursor-fx-gradient-follow 5s ease-in-out infinite;
}
.roycss-cursor-fx-gradient-follow::after {
  content: "FOLLOW";
  position: absolute;
  bottom: 16px; left: 50%;
  transform: translateX(-50%);
  color: oklch(0.96 0.05 220);
  font: 800 18px/1 system-ui, sans-serif;
  letter-spacing: 0.3em;
}
@keyframes roy-cursor-fx-gradient-follow {
  0%   { background: radial-gradient(circle at 10% 20%, oklch(0.95 0.18 60 / 0.55), oklch(0.7 0.22 320 / 0.3) 30%, transparent 60%); }
  33%  { background: radial-gradient(circle at 80% 30%, oklch(0.85 0.22 140 / 0.55), oklch(0.6 0.24 220 / 0.3) 30%, transparent 60%); }
  66%  { background: radial-gradient(circle at 50% 80%, oklch(0.95 0.18 320 / 0.55), oklch(0.7 0.22 30 / 0.3) 30%, transparent 60%); }
  100% { background: radial-gradient(circle at 10% 20%, oklch(0.95 0.18 60 / 0.55), oklch(0.7 0.22 320 / 0.3) 30%, transparent 60%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-gradient-follow::before { animation: none; }
}`,
  },

  // 8. cursor-fx-border-follow
  {
    id: "cursor-fx-border-follow",
    name: "Border Follow",
    category: "cursor-fx",
    description: "Highlighted border segment travels around the perimeter",
    tags: ["cursor", "border", "follow", "highlight", "cursor-fx"],
    previewType: "box",
    cssCode: `/* Cursor-FX: Border Follow */
.roycss-cursor-fx-border-follow {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.25 0.05 250), oklch(0.4 0.08 270));
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: oklch(0.95 0.1 220);
  font: 800 18px/1 system-ui, sans-serif;
  letter-spacing: 0.2em;
  overflow: hidden;
}
.roycss-cursor-fx-border-follow::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background:
    conic-gradient(from 0deg,
      transparent 0deg 80deg,
      oklch(0.85 0.22 60) 90deg,
      transparent 100deg 360deg);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  animation: roy-cursor-fx-border-follow 4s linear infinite;
}
@keyframes roy-cursor-fx-border-follow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-border-follow::before { animation: none; }
}`,
  },

  // 9. cursor-fx-hover-lens
  {
    id: "cursor-fx-hover-lens",
    name: "Hover Lens",
    category: "cursor-fx",
    description: "Magnifying lens zooms content where the cursor hovers",
    tags: ["cursor", "lens", "magnify", "zoom", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Hover Lens */
.roycss-cursor-fx-hover-lens {
  position: relative;
  width: 100%; height: 100%;
  background:
    repeating-linear-gradient(45deg, oklch(0.85 0.18 30) 0 10px, oklch(0.65 0.2 200) 10px 20px);
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-hover-lens::before {
  content: "";
  position: absolute;
  width: 120px; height: 120px;
  border-radius: 50%;
  background:
    repeating-linear-gradient(45deg, oklch(0.85 0.18 30) 0 5px, oklch(0.65 0.2 200) 5px 10px);
  background-size: 200% 200%;
  border: 4px solid oklch(1 0 0 / 0.6);
  box-shadow: 0 0 0 6px oklch(0 0 0 / 0.3), inset 0 0 20px oklch(0 0 0 / 0.4);
  animation: roy-cursor-fx-hover-lens 4s ease-in-out infinite;
}
.roycss-cursor-fx-hover-lens::after {
  content: "";
  position: absolute;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: oklch(1 0 0);
  box-shadow: 0 0 0 4px oklch(1 0 0 / 0.3);
  animation: roy-cursor-fx-hover-lens-dot 4s ease-in-out infinite;
}
@keyframes roy-cursor-fx-hover-lens {
  0%, 100% { transform: translate(-50%, -30%) scale(1); }
  50%      { transform: translate(30%, 40%)  scale(1.1); }
}
@keyframes roy-cursor-fx-hover-lens-dot {
  0%, 100% { transform: translate(20%, 30%); }
  50%      { transform: translate(140%, 130%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-hover-lens::before,
  .roycss-cursor-fx-hover-lens::after { animation: none; }
}`,
  },

  // 10. cursor-fx-spotlight-card
  {
    id: "cursor-fx-spotlight-card",
    name: "Spotlight Card",
    category: "cursor-fx",
    description: "Card with radial spotlight that tracks the cursor position",
    tags: ["cursor", "spotlight", "card", "radial", "cursor-fx"],
    previewType: "card",
    cssCode: `/* Cursor-FX: Spotlight Card */
.roycss-cursor-fx-spotlight-card {
  position: relative;
  width: 220px; height: 280px;
  border-radius: 18px;
  background: linear-gradient(135deg, oklch(0.22 0.04 250), oklch(0.4 0.08 270));
  box-shadow: 0 18px 40px oklch(0 0 0 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.15);
  overflow: hidden;
  display: grid;
  place-items: center;
  color: oklch(0.95 0.05 220);
  font: 800 18px/1 system-ui, sans-serif;
  letter-spacing: 0.15em;
}
.roycss-cursor-fx-spotlight-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 30%, oklch(0.95 0.18 60 / 0.35), transparent 50%);
  animation: roy-cursor-fx-spotlight-card 5s ease-in-out infinite;
}
.roycss-cursor-fx-spotlight-card::after {
  content: "CARD";
  position: relative;
  z-index: 2;
}
@keyframes roy-cursor-fx-spotlight-card {
  0%   { background: radial-gradient(circle at 15% 25%, oklch(0.95 0.18 60 / 0.45), transparent 50%); }
  33%  { background: radial-gradient(circle at 80% 20%, oklch(0.85 0.22 140 / 0.45), transparent 50%); }
  66%  { background: radial-gradient(circle at 50% 80%, oklch(0.95 0.18 320 / 0.45), transparent 50%); }
  100% { background: radial-gradient(circle at 15% 25%, oklch(0.95 0.18 60 / 0.45), transparent 50%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-spotlight-card::before { animation: none; }
}`,
  },

  // 11. cursor-fx-ripple-click
  {
    id: "cursor-fx-ripple-click",
    name: "Ripple Click",
    category: "cursor-fx",
    description: "Ripple emanates outward from each simulated click position",
    tags: ["cursor", "ripple", "click", "wave", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Ripple Click */
.roycss-cursor-fx-ripple-click {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.2 0.04 250), oklch(0.32 0.06 270));
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-ripple-click::before,
.roycss-cursor-fx-ripple-click::after {
  content: "";
  position: absolute;
  width: 30px; height: 30px;
  border-radius: 50%;
  border: 3px solid oklch(0.95 0.18 60);
  box-shadow: 0 0 18px oklch(0.95 0.18 60 / 0.5);
  animation: roy-cursor-fx-ripple-click 3s ease-out infinite;
}
.roycss-cursor-fx-ripple-click::after {
  border-color: oklch(0.85 0.22 320);
  box-shadow: 0 0 18px oklch(0.85 0.22 320 / 0.5);
  animation-delay: 1.5s;
}
@keyframes roy-cursor-fx-ripple-click {
  0%   { transform: scale(0);   opacity: 1; top: 50%; left: 50%; }
  100% { transform: scale(8);   opacity: 0; top: 50%; left: 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-ripple-click::before,
  .roycss-cursor-fx-ripple-click::after { animation: none; opacity: 0.5; }
}`,
  },

  // 12. cursor-fx-tilt-3d
  {
    id: "cursor-fx-tilt-3d",
    name: "Tilt 3D",
    category: "cursor-fx",
    description: "Card tilts in 3D space following cursor position",
    tags: ["cursor", "tilt", "3d", "perspective", "cursor-fx"],
    previewType: "card",
    cssCode: `/* Cursor-FX: Tilt 3D */
.roycss-cursor-fx-tilt-3d {
  width: 200px; height: 240px;
  background: linear-gradient(135deg, oklch(0.78 0.2 180), oklch(0.55 0.22 320));
  border-radius: 18px;
  box-shadow: 0 18px 40px oklch(0 0 0 / 0.35);
  display: grid;
  place-items: center;
  color: oklch(0.98 0 0);
  font: 900 20px/1 system-ui, sans-serif;
  letter-spacing: 0.2em;
  transform-style: preserve-3d;
  animation: roy-cursor-fx-tilt-3d 5s ease-in-out infinite;
}
.roycss-cursor-fx-tilt-3d::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, transparent 40%, oklch(1 0 0 / 0.4) 50%, transparent 60%);
  background-size: 200% 200%;
  animation: roy-cursor-fx-tilt-3d-shine 5s ease-in-out infinite;
}
@keyframes roy-cursor-fx-tilt-3d {
  0%   { transform: perspective(800px) rotateX(-15deg) rotateY(15deg); }
  25%  { transform: perspective(800px) rotateX(15deg)  rotateY(-15deg); }
  50%  { transform: perspective(800px) rotateX(-10deg) rotateY(-20deg); }
  75%  { transform: perspective(800px) rotateX(20deg)  rotateY(10deg); }
  100% { transform: perspective(800px) rotateX(-15deg) rotateY(15deg); }
}
@keyframes roy-cursor-fx-tilt-3d-shine {
  0%, 100% { background-position: 0% 0%; }
  50%      { background-position: 100% 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-tilt-3d,
  .roycss-cursor-fx-tilt-3d::before { animation: none; }
}`,
  },

  // 13. cursor-fx-particle-emit
  {
    id: "cursor-fx-particle-emit",
    name: "Particle Emit",
    category: "cursor-fx",
    description: "Particles emit and scatter from a moving cursor point",
    tags: ["cursor", "particle", "emit", "scatter", "cursor-fx"],
    previewType: "background",
    childCount: 6,
    cssCode: `/* Cursor-FX: Particle Emit */
.roycss-cursor-fx-particle-emit {
  position: relative;
  width: 100%; height: 100%;
  background: radial-gradient(circle at center, oklch(0.18 0.05 250), oklch(0.1 0.04 230));
  border-radius: 14px;
  overflow: hidden;
  display: grid;
  place-items: center;
}
.roycss-cursor-fx-particle-emit > span {
  position: absolute;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: oklch(0.95 0.2 60);
  box-shadow: 0 0 10px oklch(0.95 0.2 60 / 0.8);
  animation: roy-cursor-fx-particle-emit 2s ease-out infinite;
}
.roycss-cursor-fx-particle-emit > span:nth-child(1) { animation-delay: 0s;   --tx: 60px;  --ty: -40px; }
.roycss-cursor-fx-particle-emit > span:nth-child(2) { animation-delay: 0.25s; --tx: -50px; --ty: -60px; }
.roycss-cursor-fx-particle-emit > span:nth-child(3) { animation-delay: 0.5s;  --tx: 70px;  --ty: 50px;  }
.roycss-cursor-fx-particle-emit > span:nth-child(4) { animation-delay: 0.75s; --tx: -60px; --ty: 30px;  }
.roycss-cursor-fx-particle-emit > span:nth-child(5) { animation-delay: 1s;    --tx: 10px;  --ty: -80px; }
.roycss-cursor-fx-particle-emit > span:nth-child(6) { animation-delay: 1.25s; --tx: -30px; --ty: 70px;  }
@keyframes roy-cursor-fx-particle-emit {
  0%   { transform: translate(0, 0) scale(1);   opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-particle-emit > span { animation: none; opacity: 0.4; }
}`,
  },

  // 14. cursor-fx-blur-background
  {
    id: "cursor-fx-blur-background",
    name: "Blur Background",
    category: "cursor-fx",
    description: "Background blurs under a sharp cursor region",
    tags: ["cursor", "blur", "background", "region", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Blur Background */
.roycss-cursor-fx-blur-background {
  position: relative;
  width: 100%; height: 100%;
  background:
    repeating-linear-gradient(45deg, oklch(0.8 0.22 30) 0 12px, oklch(0.6 0.24 320) 12px 24px);
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-blur-background::before {
  content: "";
  position: absolute;
  inset: 0;
  background: inherit;
  filter: blur(8px);
  opacity: 0.6;
  animation: roy-cursor-fx-blur-background 4s ease-in-out infinite;
}
.roycss-cursor-fx-blur-background::after {
  content: "";
  position: absolute;
  width: 100px; height: 100px;
  border-radius: 50%;
  border: 3px solid oklch(1 0 0 / 0.7);
  box-shadow: 0 0 0 6px oklch(0 0 0 / 0.3);
  background:
    repeating-linear-gradient(45deg, oklch(0.8 0.22 30) 0 12px, oklch(0.6 0.24 320) 12px 24px);
  animation: roy-cursor-fx-blur-background-ring 4s ease-in-out infinite;
}
@keyframes roy-cursor-fx-blur-background {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 0.4; }
}
@keyframes roy-cursor-fx-blur-background-ring {
  0%, 100% { transform: translate(-30%, -20%); }
  50%      { transform: translate(30%, 30%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-blur-background::before,
  .roycss-cursor-fx-blur-background::after { animation: none; }
}`,
  },

  // 15. cursor-fx-color-picker
  {
    id: "cursor-fx-color-picker",
    name: "Color Picker",
    category: "cursor-fx",
    description: "Element samples and shows color from a moving cursor position",
    tags: ["cursor", "color", "picker", "sample", "cursor-fx"],
    previewType: "box",
    cssCode: `/* Cursor-FX: Color Picker */
.roycss-cursor-fx-color-picker {
  position: relative;
  width: 100%; height: 100%;
  background:
    conic-gradient(from 0deg,
      oklch(0.75 0.25 0), oklch(0.75 0.25 60),
      oklch(0.75 0.25 120), oklch(0.75 0.25 180),
      oklch(0.75 0.25 240), oklch(0.75 0.25 300),
      oklch(0.75 0.25 360));
  border-radius: 14px;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.roycss-cursor-fx-color-picker::before {
  content: "";
  position: absolute;
  width: 30px; height: 30px;
  border-radius: 50%;
  border: 4px solid oklch(1 0 0);
  box-shadow: 0 0 0 4px oklch(0 0 0 / 0.4), 0 0 20px oklch(0 0 0 / 0.3);
  animation: roy-cursor-fx-color-picker-cursor 6s linear infinite;
}
.roycss-cursor-fx-color-picker::after {
  content: "#FF9500";
  position: relative;
  z-index: 2;
  padding: 6px 14px;
  background: oklch(0 0 0 / 0.7);
  color: oklch(1 0 0);
  font: 700 14px/1.2 ui-monospace, monospace;
  border-radius: 8px;
  animation: roy-cursor-fx-color-picker-label 6s steps(6, end) infinite;
}
@keyframes roy-cursor-fx-color-picker-cursor {
  0%   { transform: translate(-160%, -80%); }
  16%  { transform: translate(120%, -100%); }
  33%  { transform: translate(180%, 20%); }
  50%  { transform: translate(60%, 120%); }
  66%  { transform: translate(-120%, 100%); }
  83%  { transform: translate(-180%, -20%); }
  100% { transform: translate(-160%, -80%); }
}
@keyframes roy-cursor-fx-color-picker-label {
  0%   { content: "#FF3030"; }
  16%  { content: "#FFD030"; }
  33%  { content: "#30FF30"; }
  50%  { content: "#30C0FF"; }
  66%  { content: "#6030FF"; }
  83%  { content: "#FF30C0"; }
  100% { content: "#FF3030"; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-color-picker::before,
  .roycss-cursor-fx-color-picker::after { animation: none; }
}`,
  },

  // 16. cursor-fx-zoom-region
  {
    id: "cursor-fx-zoom-region",
    name: "Zoom Region",
    category: "cursor-fx",
    description: "Circular region zooms content where the cursor hovers",
    tags: ["cursor", "zoom", "region", "magnify", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Zoom Region */
.roycss-cursor-fx-zoom-region {
  position: relative;
  width: 100%; height: 100%;
  background:
    repeating-linear-gradient(0deg, oklch(0.7 0.22 200) 0 8px, oklch(0.55 0.24 280) 8px 16px);
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-zoom-region::before {
  content: "";
  position: absolute;
  width: 140px; height: 140px;
  border-radius: 50%;
  background:
    repeating-linear-gradient(0deg, oklch(0.7 0.22 200) 0 4px, oklch(0.55 0.24 280) 4px 8px);
  background-size: 200% 200%;
  border: 4px solid oklch(1 0 0 / 0.7);
  box-shadow: 0 0 0 6px oklch(0 0 0 / 0.3), inset 0 0 30px oklch(0 0 0 / 0.4);
  animation: roy-cursor-fx-zoom-region 5s ease-in-out infinite;
}
.roycss-cursor-fx-zoom-region::after {
  content: "ZOOM";
  position: absolute;
  bottom: 16px; right: 20px;
  color: oklch(1 0 0);
  font: 800 16px/1 system-ui, sans-serif;
  letter-spacing: 0.25em;
  text-shadow: 0 2px 6px oklch(0 0 0 / 0.5);
}
@keyframes roy-cursor-fx-zoom-region {
  0%, 100% { transform: translate(-30%, -10%) scale(1); background-position: 0% 0%; }
  50%      { transform: translate(30%, 30%) scale(1.05); background-position: 100% 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-zoom-region::before { animation: none; }
}`,
  },

  // 17. cursor-fx-tooltip-follow
  {
    id: "cursor-fx-tooltip-follow",
    name: "Tooltip Follow",
    category: "cursor-fx",
    description: "Tooltip smoothly follows an animated cursor with delay",
    tags: ["cursor", "tooltip", "follow", "smooth", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Tooltip Follow */
.roycss-cursor-fx-tooltip-follow {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.25 0.05 250), oklch(0.4 0.08 270));
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-tooltip-follow::before {
  content: "";
  position: absolute;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: oklch(1 0 0);
  box-shadow: 0 0 0 4px oklch(1 0 0 / 0.4);
  animation: roy-cursor-fx-tooltip-follow-cursor 4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
.roycss-cursor-fx-tooltip-follow::after {
  content: "Tooltip";
  position: absolute;
  padding: 4px 10px;
  background: oklch(0.1 0.04 250);
  color: oklch(0.98 0 0);
  font: 700 12px/1.4 system-ui, sans-serif;
  border-radius: 6px;
  box-shadow: 0 6px 14px oklch(0 0 0 / 0.4);
  animation: roy-cursor-fx-tooltip-follow-tip 4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
  animation-delay: 0.15s;
}
@keyframes roy-cursor-fx-tooltip-follow-cursor {
  0%   { transform: translate(-180px, -60px); }
  50%  { transform: translate(60px, 60px); }
  100% { transform: translate(-180px, -60px); }
}
@keyframes roy-cursor-fx-tooltip-follow-tip {
  0%   { transform: translate(-180px, -90px); }
  50%  { transform: translate(60px, 30px); }
  100% { transform: translate(-180px, -90px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-tooltip-follow::before,
  .roycss-cursor-fx-tooltip-follow::after { animation: none; }
}`,
  },

  // 18. cursor-fx-glow-ring
  {
    id: "cursor-fx-glow-ring",
    name: "Glow Ring",
    category: "cursor-fx",
    description: "Pulsing glow ring sits at the cursor position",
    tags: ["cursor", "glow", "ring", "pulse", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Glow Ring */
.roycss-cursor-fx-glow-ring {
  position: relative;
  width: 100%; height: 100%;
  background: oklch(0.1 0.04 250);
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-glow-ring::before {
  content: "";
  position: absolute;
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 3px solid oklch(0.95 0.18 60);
  box-shadow:
    0 0 0 6px oklch(0.95 0.18 60 / 0.3),
    0 0 30px oklch(0.95 0.18 60 / 0.6);
  animation: roy-cursor-fx-glow-ring-move 5s ease-in-out infinite,
             roy-cursor-fx-glow-ring-pulse 1.5s ease-in-out infinite;
}
@keyframes roy-cursor-fx-glow-ring-move {
  0%, 100% { transform: translate(-180px, -60px); }
  50%      { transform: translate(60px, 60px); }
}
@keyframes roy-cursor-fx-glow-ring-pulse {
  0%, 100% { width: 40px; height: 40px; opacity: 1; }
  50%      { width: 60px; height: 60px; opacity: 0.7; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-glow-ring::before { animation: none; }
}`,
  },

  // 19. cursor-fx-invert-region
  {
    id: "cursor-fx-invert-region",
    name: "Invert Region",
    category: "cursor-fx",
    description: "Color inversion circular region follows the cursor",
    tags: ["cursor", "invert", "region", "color", "cursor-fx"],
    previewType: "background",
    cssCode: `/* Cursor-FX: Invert Region */
.roycss-cursor-fx-invert-region {
  position: relative;
  width: 100%; height: 100%;
  background:
    repeating-conic-gradient(from 0deg at 50% 50%, oklch(0.85 0.22 30) 0deg 30deg, oklch(0.65 0.24 320) 30deg 60deg);
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-invert-region::before {
  content: "";
  position: absolute;
  width: 120px; height: 120px;
  border-radius: 50%;
  background: inherit;
  filter: invert(1) hue-rotate(180deg);
  border: 3px solid oklch(1 0 0 / 0.7);
  box-shadow: 0 0 0 6px oklch(0 0 0 / 0.3);
  animation: roy-cursor-fx-invert-region 5s ease-in-out infinite;
}
.roycss-cursor-fx-invert-region::after {
  content: "INVERT";
  position: absolute;
  bottom: 16px; left: 50%;
  transform: translateX(-50%);
  color: oklch(0.95 0 0);
  font: 800 16px/1 system-ui, sans-serif;
  letter-spacing: 0.3em;
  text-shadow: 0 2px 6px oklch(0 0 0 / 0.6);
  filter: invert(0);
}
@keyframes roy-cursor-fx-invert-region {
  0%, 100% { transform: translate(-30%, -10%); }
  50%      { transform: translate(30%, 30%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-invert-region::before { animation: none; }
}`,
  },

  // 20. cursor-fx-elastic-snap
  {
    id: "cursor-fx-elastic-snap",
    name: "Elastic Snap",
    category: "cursor-fx",
    description: "Elements elastically snap toward the cursor and bounce back",
    tags: ["cursor", "elastic", "snap", "spring", "cursor-fx"],
    previewType: "box",
    childCount: 5,
    cssCode: `/* Cursor-FX: Elastic Snap */
.roycss-cursor-fx-elastic-snap {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.2 0.04 250), oklch(0.35 0.08 270));
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-elastic-snap > span {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, oklch(0.85 0.18 60), oklch(0.65 0.22 320));
  box-shadow: 0 6px 14px oklch(0 0 0 / 0.3);
  animation: roy-cursor-fx-elastic-snap 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
.roycss-cursor-fx-elastic-snap > span:nth-child(1) { animation-delay: 0s; }
.roycss-cursor-fx-elastic-snap > span:nth-child(2) { animation-delay: 0.1s; }
.roycss-cursor-fx-elastic-snap > span:nth-child(3) { animation-delay: 0.2s; }
.roycss-cursor-fx-elastic-snap > span:nth-child(4) { animation-delay: 0.3s; }
.roycss-cursor-fx-elastic-snap > span:nth-child(5) { animation-delay: 0.4s; }
@keyframes roy-cursor-fx-elastic-snap {
  0%   { transform: translateY(0) scale(1); }
  30%  { transform: translateY(-30px) scale(1.25); }
  55%  { transform: translateY(8px) scale(0.9); }
  80%  { transform: translateY(-4px) scale(1.05); }
  100% { transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-elastic-snap > span { animation: none; }
}`,
  },
];
