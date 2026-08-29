import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 45 — Structural & Architectural Effects (20 effects)
 * Pure-CSS simulations of real-world materials and structures: brick walls,
 * paper folds, page curls, shatter, dissolve, glass cracks, marble veins,
 * honeycomb, crystal facets, ice melt, rust reveal, and more.
 * All classes are prefixed `roycss-structural-` and keyframes `roy-structural-`.
 * Each effect honors prefers-reduced-motion.
 */
export const effectsBatch45 = [
  // ═══════════════════════════════════════════════════════════════
  // STRUCTURAL & ARCHITECTURAL (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. structural-brick-reveal
  {
    id: "structural-brick-reveal",
    name: "Brick Reveal",
    category: "structural",
    description: "Bricks appear one by one in staggered rows to form a wall on hover",
    tags: ["structural", "brick", "wall", "reveal", "stagger"],
    previewType: "box",
    cssCode: `/* Structural: Brick Reveal */
.roycss-structural-brick-reveal {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2px;
  width: 100%; height: 100%;
  background: oklch(0.4 0.01 30);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-structural-brick-reveal > span {
  background: linear-gradient(135deg, oklch(0.55 0.04 30), oklch(0.46 0.05 35));
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.18), inset 0 -2px 4px oklch(0 0 0 / 0.2);
  border-radius: 2px;
  opacity: 0;
  transform: scale(0.3) rotate(-12deg);
  transition: opacity 360ms ease, transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-structural-brick-reveal:hover > span { opacity: 1; transform: scale(1) rotate(0deg); }
.roycss-structural-brick-reveal > span:nth-child(1)  { transition-delay: 0ms; }
.roycss-structural-brick-reveal > span:nth-child(2)  { transition-delay: 80ms; }
.roycss-structural-brick-reveal > span:nth-child(3)  { transition-delay: 160ms; }
.roycss-structural-brick-reveal > span:nth-child(4)  { transition-delay: 240ms; }
.roycss-structural-brick-reveal > span:nth-child(5)  { transition-delay: 40ms; }
.roycss-structural-brick-reveal > span:nth-child(6)  { transition-delay: 120ms; }
.roycss-structural-brick-reveal > span:nth-child(7)  { transition-delay: 200ms; }
.roycss-structural-brick-reveal > span:nth-child(8)  { transition-delay: 280ms; }
.roycss-structural-brick-reveal > span:nth-child(9)  { transition-delay: 80ms; }
.roycss-structural-brick-reveal > span:nth-child(10) { transition-delay: 160ms; }
.roycss-structural-brick-reveal > span:nth-child(11) { transition-delay: 240ms; }
.roycss-structural-brick-reveal > span:nth-child(12) { transition-delay: 320ms; }
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-brick-reveal > span { opacity: 1; transform: none; transition: none; }
}`,
    childCount: 12,
  },

  // 2. structural-fold-paper
  {
    id: "structural-fold-paper",
    name: "Fold Paper",
    category: "structural",
    description: "Element folds like a sheet of paper using CSS 3D transforms on hover",
    tags: ["structural", "paper", "fold", "3d", "transform"],
    previewType: "box",
    cssCode: `/* Structural: Fold Paper */
.roycss-structural-fold-paper {
  perspective: 900px;
  background: linear-gradient(135deg, oklch(0.92 0.02 80), oklch(0.82 0.04 80));
  border-radius: 8px;
  box-shadow: 0 8px 18px oklch(0 0 0 / 0.12);
  transform-style: preserve-3d;
  transition: transform 800ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.roycss-structural-fold-paper:hover {
  animation: roy-structural-fold-paper 1.4s cubic-bezier(0.6, 0, 0.4, 1) both;
}
@keyframes roy-structural-fold-paper {
  0%   { transform: perspective(900px) rotateY(0deg); }
  30%  { transform: perspective(900px) rotateY(-30deg) rotateX(15deg); }
  60%  { transform: perspective(900px) rotateY(60deg) rotateX(-10deg); }
  100% { transform: perspective(900px) rotateY(0deg) rotateX(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-fold-paper:hover { animation: none; }
}`,
  },

  // 3. structural-page-curl
  {
    id: "structural-page-curl",
    name: "Page Curl",
    category: "structural",
    description: "Corner curls upward on hover, revealing content beneath the page",
    tags: ["structural", "page", "curl", "corner", "reveal"],
    previewType: "box",
    cssCode: `/* Structural: Page Curl */
.roycss-structural-page-curl {
  position: relative;
  background: linear-gradient(135deg, oklch(0.96 0.01 80), oklch(0.86 0.02 80));
  border-radius: 8px;
  box-shadow: 0 8px 18px oklch(0 0 0 / 0.12);
  overflow: hidden;
}
.roycss-structural-page-curl::before {
  content: "";
  position: absolute;
  top: 0; right: 0;
  width: 0; height: 0;
  background: linear-gradient(225deg, oklch(0.7 0.01 80) 50%, oklch(0.55 0.01 80) 50%);
  box-shadow: 0 4px 8px oklch(0 0 0 / 0.2);
  border-bottom-left-radius: 12px;
  transition: width 500ms cubic-bezier(0.34, 1.2, 0.64, 1),
              height 500ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.roycss-structural-page-curl::after {
  content: "";
  position: absolute;
  top: 0; right: 0;
  width: 0; height: 0;
  border-style: solid;
  border-width: 0 0 0 0;
  border-color: transparent transparent oklch(0.4 0.01 80) oklch(0.6 0.01 80);
  transition: border-width 500ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.roycss-structural-page-curl:hover::before {
  width: 50px; height: 50px;
}
.roycss-structural-page-curl:hover::after {
  border-width: 0 0 50px 50px;
  border-bottom-right-radius: 8px;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-page-curl::before,
  .roycss-structural-page-curl::after { transition: none; }
  .roycss-structural-page-curl:hover::before { width: 50px; height: 50px; }
}`,
  },

  // 4. structural-shatter-break
  {
    id: "structural-shatter-break",
    name: "Shatter Break",
    category: "structural",
    description: "Element appears to shatter into pieces on hover using clip-path",
    tags: ["structural", "shatter", "break", "clip-path", "crack"],
    previewType: "box",
    cssCode: `/* Structural: Shatter Break */
.roycss-structural-shatter-break {
  background: linear-gradient(135deg, oklch(0.7 0.12 220), oklch(0.56 0.14 240));
  border-radius: 12px;
  cursor: pointer;
  transition: clip-path 600ms cubic-bezier(0.6, -0.28, 0.74, 0.05),
              filter 600ms ease,
              opacity 600ms ease;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}
.roycss-structural-shatter-break:hover {
  clip-path: polygon(
    0% 12%, 18% 4%, 32% 14%, 46% 6%, 62% 16%, 78% 8%, 92% 18%, 100% 6%,
    96% 30%, 88% 48%, 96% 64%, 90% 80%, 98% 96%, 76% 88%, 60% 96%, 44% 86%, 28% 96%, 12% 88%, 4% 96%,
    8% 78%, 2% 60%, 10% 44%, 4% 28%
  );
  filter: brightness(1.1) saturate(1.2);
  animation: roy-structural-shatter-shake 400ms ease-in-out;
}
@keyframes roy-structural-shatter-shake {
  0%, 100% { transform: translate(0, 0); }
  25%  { transform: translate(-2px, 1px); }
  50%  { transform: translate(2px, -1px); }
  75%  { transform: translate(-1px, -1px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-shatter-break:hover { animation: none; transition: none; clip-path: none; }
}`,
  },

  // 5. structural-dissolve
  {
    id: "structural-dissolve",
    name: "Dissolve",
    category: "structural",
    description: "Element dissolves into particles and noise on hover",
    tags: ["structural", "dissolve", "particles", "noise", "fade"],
    previewType: "box",
    cssCode: `/* Structural: Dissolve */
.roycss-structural-dissolve {
  background: linear-gradient(135deg, oklch(0.78 0.13 280), oklch(0.66 0.14 320));
  border-radius: 14px;
  cursor: pointer;
  transition: filter 700ms ease, opacity 700ms ease, transform 700ms ease;
}
.roycss-structural-dissolve:hover {
  animation: roy-structural-dissolve 1s ease-out both;
}
@keyframes roy-structural-dissolve {
  0%   { filter: blur(0) contrast(1); opacity: 1; transform: scale(1); }
  40%  { filter: blur(2px) contrast(1.3); opacity: 0.85; transform: scale(1.02); }
  70%  { filter: blur(8px) contrast(0.5) saturate(0.4); opacity: 0.4; transform: scale(1.04); }
  100% { filter: blur(14px) contrast(0.2) saturate(0.1); opacity: 0.1; transform: scale(1.08); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-dissolve:hover { animation: none; opacity: 0.5; }
}`,
  },

  // 6. structural-assemble
  {
    id: "structural-assemble",
    name: "Assemble",
    category: "structural",
    description: "Pieces fly in from different directions to assemble the element",
    tags: ["structural", "assemble", "fly-in", "pieces", "construction"],
    previewType: "box",
    cssCode: `/* Structural: Assemble */
.roycss-structural-assemble {
  position: relative;
  background: transparent;
  overflow: hidden;
  border-radius: 12px;
}
.roycss-structural-assemble::before,
.roycss-structural-assemble::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.78 0.13 200), oklch(0.66 0.14 220));
  border-radius: 12px;
  animation: roy-structural-assemble 1.4s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}
.roycss-structural-assemble::after {
  background: linear-gradient(135deg, oklch(0.86 0.04 200 / 0.5), oklch(0.74 0.06 220 / 0.4));
  animation-delay: 0ms;
  clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);
}
.roycss-structural-assemble::before {
  clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%);
  animation-direction: reverse;
}
@keyframes roy-structural-assemble {
  0%   { transform: translateX(-120%) skewX(-20deg); opacity: 0; }
  60%  { transform: translateX(8%) skewX(4deg); opacity: 1; }
  100% { transform: translateX(0) skewX(0deg); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-assemble::before,
  .roycss-structural-assemble::after { animation: none; transform: none; }
}`,
  },

  // 7. structural-origami-fold
  {
    id: "structural-origami-fold",
    name: "Origami Fold",
    category: "structural",
    description: "Origami-style fold animation that pleats the element on hover",
    tags: ["structural", "origami", "fold", "pleat", "3d"],
    previewType: "box",
    cssCode: `/* Structural: Origami Fold */
.roycss-structural-origami-fold {
  perspective: 700px;
  background: linear-gradient(135deg, oklch(0.9 0.02 80), oklch(0.8 0.04 80));
  border-radius: 8px;
  transform-style: preserve-3d;
  cursor: pointer;
}
.roycss-structural-origami-fold:hover {
  animation: roy-structural-origami-fold 1.6s cubic-bezier(0.6, 0.05, 0.4, 1) both;
}
@keyframes roy-structural-origami-fold {
  0%   { transform: rotateY(0deg) rotateX(0deg); }
  25%  { transform: rotateY(-25deg) rotateX(20deg) scaleY(0.9); }
  50%  { transform: rotateY(40deg) rotateX(-15deg) scaleY(1.05); }
  75%  { transform: rotateY(-15deg) rotateX(10deg) scaleY(0.95); }
  100% { transform: rotateY(0deg) rotateX(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-origami-fold:hover { animation: none; }
}`,
  },

  // 8. structural-glass-shatter
  {
    id: "structural-glass-shatter",
    name: "Glass Shatter",
    category: "structural",
    description: "Glass crack pattern animates across the surface on hover",
    tags: ["structural", "glass", "shatter", "crack", "fracture"],
    previewType: "box",
    cssCode: `/* Structural: Glass Shatter */
.roycss-structural-glass-shatter {
  position: relative;
  background: linear-gradient(135deg, oklch(0.92 0.02 220 / 0.6), oklch(0.78 0.04 220 / 0.5));
  border-radius: 12px;
  backdrop-filter: blur(6px);
  overflow: hidden;
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.6);
}
.roycss-structural-glass-shatter::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(45deg, transparent 49.5%, oklch(0.95 0 0 / 0.5) 49.7%, transparent 50.5%),
    linear-gradient(-45deg, transparent 49.5%, oklch(0.95 0 0 / 0.5) 49.7%, transparent 50.5%),
    linear-gradient(90deg, transparent 49.5%, oklch(0.95 0 0 / 0.4) 49.7%, transparent 50.5%),
    linear-gradient(15deg, transparent 49.5%, oklch(0.95 0 0 / 0.4) 49.7%, transparent 50.5%),
    linear-gradient(-15deg, transparent 49.5%, oklch(0.95 0 0 / 0.4) 49.7%, transparent 50.5%),
    linear-gradient(75deg, transparent 49.5%, oklch(0.95 0 0 / 0.3) 49.7%, transparent 50.5%);
  background-size: 60% 60%, 50% 50%, 70% 70%, 40% 40%, 55% 55%, 45% 45%;
  background-position: 30% 40%, 60% 70%, 20% 80%, 70% 20%, 40% 60%, 80% 50%;
  background-repeat: no-repeat;
  opacity: 0;
  transform: scale(0.3);
  transition: opacity 500ms ease, transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-structural-glass-shatter:hover::before {
  opacity: 1;
  transform: scale(1);
  animation: roy-structural-glass-shatter 600ms ease-out;
}
@keyframes roy-structural-glass-shatter {
  0%   { clip-path: polygon(50% 50%, 50% 50%, 50% 50%); }
  100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-glass-shatter:hover::before { animation: none; transition: none; opacity: 1; transform: scale(1); }
}`,
  },

  // 9. structural-stone-crack
  {
    id: "structural-stone-crack",
    name: "Stone Crack",
    category: "structural",
    description: "Stone cracking effect that progressively reveals fissures on hover",
    tags: ["structural", "stone", "crack", "fissure", "rock"],
    previewType: "box",
    cssCode: `/* Structural: Stone Crack */
.roycss-structural-stone-crack {
  position: relative;
  background:
    radial-gradient(circle at 20% 30%, oklch(0.6 0.01 30) 0 1px, transparent 1.5px),
    radial-gradient(circle at 70% 60%, oklch(0.55 0.01 30) 0 1.5px, transparent 2px),
    radial-gradient(circle at 45% 80%, oklch(0.58 0.01 30) 0 1px, transparent 1.5px),
    linear-gradient(135deg, oklch(0.62 0.005 30), oklch(0.5 0.008 35));
  background-size: 30px 30px, 22px 22px, 26px 26px, 100% 100%;
  border-radius: 8px;
  overflow: hidden;
}
.roycss-structural-stone-crack::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(105deg, transparent 48%, oklch(0.2 0 0 / 0.6) 49%, oklch(0.2 0 0 / 0.6) 51%, transparent 52%),
    linear-gradient(50deg, transparent 60%, oklch(0.2 0 0 / 0.5) 61%, oklch(0.2 0 0 / 0.5) 63%, transparent 64%),
    linear-gradient(-20deg, transparent 70%, oklch(0.2 0 0 / 0.4) 71%, oklch(0.2 0 0 / 0.4) 73%, transparent 74%);
  background-size: 100% 100%;
  background-position: 0 0;
  background-repeat: no-repeat;
  opacity: 0;
  transform: scaleY(0);
  transform-origin: top;
  transition: opacity 600ms ease, transform 600ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.roycss-structural-stone-crack:hover::before {
  opacity: 1;
  transform: scaleY(1);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-stone-crack:hover::before { transition: none; opacity: 1; transform: none; }
}`,
  },

  // 10. structural-metal-bend
  {
    id: "structural-metal-bend",
    name: "Metal Bend",
    category: "structural",
    description: "Sheet metal bending effect with flexed perspective on hover",
    tags: ["structural", "metal", "bend", "sheet", "flex"],
    previewType: "box",
    cssCode: `/* Structural: Metal Bend */
.roycss-structural-metal-bend {
  perspective: 900px;
  background:
    repeating-linear-gradient(90deg, oklch(0.7 0.005 250 / 0.2) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, oklch(0.74 0.005 250), oklch(0.56 0.008 250));
  border-radius: 10px;
  box-shadow: 0 8px 18px oklch(0 0 0 / 0.18), inset 0 1px 0 oklch(1 0 0 / 0.3);
  transform-style: preserve-3d;
  transition: transform 600ms cubic-bezier(0.34, 1.2, 0.64, 1),
              border-radius 600ms ease,
              box-shadow 600ms ease;
  cursor: pointer;
}
.roycss-structural-metal-bend:hover {
  transform: perspective(900px) rotateX(20deg) rotateY(-8deg) scale(1.02);
  border-radius: 30% 70% 30% 70% / 50% 50% 50% 50%;
  box-shadow: 0 16px 32px oklch(0 0 0 / 0.28), inset 0 1px 0 oklch(1 0 0 / 0.5);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-metal-bend,
  .roycss-structural-metal-bend:hover { transition: none; transform: none; }
}`,
  },

  // 11. structural-wood-grain
  {
    id: "structural-wood-grain",
    name: "Wood Grain",
    category: "structural",
    description: "Wood grain texture with flowing grain lines on hover",
    tags: ["structural", "wood", "grain", "timber", "texture"],
    previewType: "box",
    cssCode: `/* Structural: Wood Grain */
.roycss-structural-wood-grain {
  background:
    repeating-linear-gradient(90deg,
      oklch(0.5 0.04 35) 0 4px,
      oklch(0.62 0.05 35) 4px 9px,
      oklch(0.42 0.05 35) 9px 14px,
      oklch(0.58 0.04 35) 14px 22px),
    linear-gradient(135deg, oklch(0.55 0.04 35), oklch(0.42 0.05 40));
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.08), 0 6px 14px oklch(0 0 0 / 0.18);
  position: relative;
  overflow: hidden;
  transition: background-position 800ms ease;
}
.roycss-structural-wood-grain::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 100% at 30% 50%, oklch(0.4 0.05 35 / 0.4) 0 1px, transparent 2px),
    radial-gradient(ellipse 50% 90% at 70% 30%, oklch(0.4 0.05 35 / 0.3) 0 1.5px, transparent 2px);
  background-size: 80px 80px, 60px 60px;
  background-position: 0 0;
  transition: background-position 800ms ease;
  pointer-events: none;
}
.roycss-structural-wood-grain:hover::before {
  background-position: 14px 0, -8px 0;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-wood-grain::before { transition: none; }
}`,
  },

  // 12. structural-marble-vein
  {
    id: "structural-marble-vein",
    name: "Marble Vein",
    category: "structural",
    description: "Marble surface with flowing veins that subtly shift on hover",
    tags: ["structural", "marble", "vein", "stone", "luxury"],
    previewType: "box",
    cssCode: `/* Structural: Marble Vein */
.roycss-structural-marble-vein {
  background:
    linear-gradient(135deg, oklch(0.4 0.01 240 / 0.5) 49%, transparent 50%, transparent 51%, oklch(0.4 0.01 240 / 0.4) 52%),
    linear-gradient(85deg, transparent 45%, oklch(0.3 0.01 240 / 0.4) 46%, oklch(0.3 0.01 240 / 0.4) 47%, transparent 48%),
    linear-gradient(-50deg, transparent 60%, oklch(0.35 0.01 240 / 0.4) 61%, transparent 62%),
    radial-gradient(ellipse 30% 60% at 40% 50%, oklch(0.3 0.01 240 / 0.3) 0 1px, transparent 2px),
    linear-gradient(180deg, oklch(0.92 0.002 240), oklch(0.84 0.004 240));
  background-size: 70% 70%, 50% 50%, 60% 60%, 30px 30px, 100% 100%;
  background-position: 0 0, 0 0, 0 0, 0 0, 0 0;
  border-radius: 8px;
  transition: background-position 800ms ease;
}
.roycss-structural-marble-vein:hover {
  background-position: 8px 4px, -6px 6px, 4px -4px, 8px 0, 0 0;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-marble-vein { transition: none; }
}`,
  },

  // 13. structural-concrete-texture
  {
    id: "structural-concrete-texture",
    name: "Concrete Surface",
    category: "structural",
    description: "Raw concrete surface with mottled stains and aggregate speckles",
    tags: ["structural", "concrete", "surface", "aggregate", "texture"],
    previewType: "box",
    cssCode: `/* Structural: Concrete Surface */
.roycss-structural-concrete-texture {
  background:
    radial-gradient(circle at 22% 28%, oklch(0.55 0.005 240 / 0.5) 0 1px, transparent 1.5px),
    radial-gradient(circle at 70% 45%, oklch(0.5 0.005 240 / 0.45) 0 2px, transparent 2.5px),
    radial-gradient(circle at 38% 78%, oklch(0.55 0.005 240 / 0.4) 0 1px, transparent 1.5px),
    radial-gradient(ellipse 60% 40% at 50% 30%, oklch(0.62 0.005 240 / 0.4), transparent 70%),
    radial-gradient(ellipse 50% 30% at 30% 70%, oklch(0.6 0.005 240 / 0.3), transparent 70%),
    linear-gradient(145deg, oklch(0.72 0.005 240), oklch(0.6 0.008 240));
  background-size: 24px 24px, 32px 32px, 28px 28px, 100% 100%, 100% 100%, 100% 100%;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.06), 0 8px 18px oklch(0 0 0 / 0.14);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-concrete-texture { /* static texture */ }
}`,
  },

  // 14. structural-water-ripple-surface
  {
    id: "structural-water-ripple-surface",
    name: "Water Ripple Surface",
    category: "structural",
    description: "Water surface ripple that expands across the surface on hover",
    tags: ["structural", "water", "ripple", "surface", "wave"],
    previewType: "box",
    cssCode: `/* Structural: Water Ripple Surface */
.roycss-structural-water-ripple-surface {
  position: relative;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.6 0.12 220 / 0.4), transparent 40%),
    radial-gradient(circle at 70% 60%, oklch(0.5 0.12 220 / 0.4), transparent 40%),
    linear-gradient(135deg, oklch(0.7 0.1 220), oklch(0.5 0.12 240));
  border-radius: 12px;
  overflow: hidden;
}
.roycss-structural-water-ripple-surface::before,
.roycss-structural-water-ripple-surface::after {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 2px solid oklch(0.95 0.05 220 / 0.6);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
}
.roycss-structural-water-ripple-surface:hover::before {
  animation: roy-structural-water-ripple 1.8s ease-out infinite;
}
.roycss-structural-water-ripple-surface:hover::after {
  animation: roy-structural-water-ripple 1.8s ease-out 600ms infinite;
}
@keyframes roy-structural-water-ripple {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.9; border-width: 3px; }
  100% { transform: translate(-50%, -50%) scale(18); opacity: 0; border-width: 0.5px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-water-ripple-surface:hover::before,
  .roycss-structural-water-ripple-surface:hover::after { animation: none; opacity: 0; }
}`,
  },

  // 15. structural-fabric-weave
  {
    id: "structural-fabric-weave",
    name: "Fabric Weave Pattern",
    category: "structural",
    description: "Tightly woven fabric pattern with warp and weft interlacing",
    tags: ["structural", "fabric", "weave", "warp", "weft"],
    previewType: "box",
    cssCode: `/* Structural: Fabric Weave Pattern */
.roycss-structural-fabric-weave {
  background:
    repeating-linear-gradient(0deg, oklch(0.55 0.1 12 / 0.55) 0 1.5px, oklch(0.75 0.1 12 / 0.4) 1.5px 3px),
    repeating-linear-gradient(90deg, oklch(0.55 0.1 12 / 0.55) 0 1.5px, oklch(0.75 0.1 12 / 0.4) 1.5px 3px),
    linear-gradient(135deg, oklch(0.65 0.12 12), oklch(0.55 0.1 28));
  background-size: 6px 6px;
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.08), 0 6px 14px oklch(0 0 0 / 0.16);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-fabric-weave { /* static pattern */ }
}`,
  },

  // 16. structural-carbon-fiber
  {
    id: "structural-carbon-fiber",
    name: "Carbon Fiber",
    category: "structural",
    description: "Carbon fiber weave pattern with the characteristic twill sheen",
    tags: ["structural", "carbon", "fiber", "twill", "weave"],
    previewType: "box",
    cssCode: `/* Structural: Carbon Fiber */
.roycss-structural-carbon-fiber {
  background:
    linear-gradient(45deg, oklch(0.18 0 0) 25%, transparent 25%, transparent 75%, oklch(0.18 0 0) 75%),
    linear-gradient(45deg, oklch(0.18 0 0) 25%, oklch(0.3 0 0) 25%, oklch(0.3 0 0) 75%, oklch(0.18 0 0) 75%),
    linear-gradient(135deg, oklch(0.22 0 0), oklch(0.14 0 0));
  background-size: 16px 16px, 16px 16px, 100% 100%;
  background-position: 0 0, 8px 8px, 0 0;
  border-radius: 6px;
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.08), 0 8px 18px oklch(0 0 0 / 0.4);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-carbon-fiber { /* static pattern */ }
}`,
  },

  // 17. structural-honeycomb-structure
  {
    id: "structural-honeycomb-structure",
    name: "Honeycomb Structure",
    category: "structural",
    description: "Hexagonal honeycomb pattern with cells that warm up on hover",
    tags: ["structural", "honeycomb", "hexagon", "pattern", "cells"],
    previewType: "box",
    cssCode: `/* Structural: Honeycomb Structure */
.roycss-structural-honeycomb-structure {
  background:
    radial-gradient(circle at 50% 50%, oklch(0.7 0.13 80) 0 8px, transparent 9px),
    radial-gradient(circle at 0% 25%, oklch(0.7 0.13 80) 0 8px, transparent 9px),
    radial-gradient(circle at 100% 25%, oklch(0.7 0.13 80) 0 8px, transparent 9px),
    radial-gradient(circle at 0% 75%, oklch(0.7 0.13 80) 0 8px, transparent 9px),
    radial-gradient(circle at 100% 75%, oklch(0.7 0.13 80) 0 8px, transparent 9px),
    radial-gradient(circle at 25% 0%, oklch(0.7 0.13 80) 0 8px, transparent 9px),
    radial-gradient(circle at 75% 0%, oklch(0.7 0.13 80) 0 8px, transparent 9px),
    radial-gradient(circle at 25% 100%, oklch(0.7 0.13 80) 0 8px, transparent 9px),
    radial-gradient(circle at 75% 100%, oklch(0.7 0.13 80) 0 8px, transparent 9px),
    linear-gradient(135deg, oklch(0.78 0.13 75), oklch(0.6 0.13 60));
  background-size: 32px 56px;
  background-position: 0 0;
  border-radius: 6px;
  transition: filter 600ms ease;
}
.roycss-structural-honeycomb-structure:hover {
  filter: brightness(1.15) saturate(1.2);
  animation: roy-structural-honeycomb 3s linear infinite;
}
@keyframes roy-structural-honeycomb {
  0%   { background-position: 0 0; }
  100% { background-position: 32px 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-honeycomb-structure:hover { animation: none; filter: none; }
}`,
  },

  // 18. structural-crystal-facet
  {
    id: "structural-crystal-facet",
    name: "Crystal Facet",
    category: "structural",
    description: "Crystal facets reflect shifting light across geometric planes",
    tags: ["structural", "crystal", "facet", "light", "reflection"],
    previewType: "box",
    cssCode: `/* Structural: Crystal Facet */
.roycss-structural-crystal-facet {
  background:
    linear-gradient(45deg, oklch(0.92 0.05 220 / 0.6) 25%, transparent 25%, transparent 50%, oklch(0.92 0.05 220 / 0.4) 50%, oklch(0.92 0.05 220 / 0.4) 75%, transparent 75%),
    linear-gradient(-45deg, oklch(0.85 0.08 280 / 0.4) 25%, transparent 25%, transparent 50%, oklch(0.85 0.08 280 / 0.4) 50%, oklch(0.85 0.08 280 / 0.4) 75%, transparent 75%),
    linear-gradient(90deg, oklch(0.88 0.08 200 / 0.3), oklch(0.78 0.12 220 / 0.4)),
    linear-gradient(135deg, oklch(0.82 0.1 200), oklch(0.7 0.12 280));
  background-size: 40px 40px, 40px 40px, 100% 100%, 100% 100%;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.3), 0 8px 18px oklch(0 0 0 / 0.18);
  animation: roy-structural-crystal-facet 4s ease-in-out infinite;
}
@keyframes roy-structural-crystal-facet {
  0%, 100% { background-position: 0 0, 0 0, 0 0, 0 0; filter: hue-rotate(0deg) brightness(1); }
  50%      { background-position: 20px 0, -20px 0, 0 0, 0 0; filter: hue-rotate(20deg) brightness(1.1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-crystal-facet { animation: none; }
}`,
  },

  // 19. structural-ice-melt
  {
    id: "structural-ice-melt",
    name: "Ice Melt",
    category: "structural",
    description: "Ice melts with opacity and blur transition on hover, revealing what's beneath",
    tags: ["structural", "ice", "melt", "blur", "fade"],
    previewType: "box",
    cssCode: `/* Structural: Ice Melt */
.roycss-structural-ice-melt {
  position: relative;
  background: linear-gradient(135deg, oklch(0.85 0.04 220 / 0.8), oklch(0.7 0.06 220 / 0.7));
  border-radius: 12px;
  backdrop-filter: blur(4px);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.5), inset 0 -2px 8px oklch(0 0 0 / 0.1);
  transition: opacity 800ms ease, filter 800ms ease, backdrop-filter 800ms ease,
              transform 800ms cubic-bezier(0.34, 1.2, 0.64, 1);
  cursor: pointer;
}
.roycss-structural-ice-melt:hover {
  opacity: 0.3;
  filter: blur(2px);
  backdrop-filter: blur(1px);
  transform: scale(1.04) translateY(2px);
  animation: roy-structural-ice-melt-drip 1.2s ease-out infinite;
}
@keyframes roy-structural-ice-melt-drip {
  0%, 100% { box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.5), 0 0 0 oklch(0.6 0.1 220 / 0); }
  50%      { box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.5), 0 4px 12px oklch(0.6 0.1 220 / 0.4); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-ice-melt,
  .roycss-structural-ice-melt:hover { animation: none; transition: none; opacity: 0.6; filter: none; backdrop-filter: blur(2px); transform: none; }
}`,
  },

  // 20. structural-rust-texture
  {
    id: "structural-rust-texture",
    name: "Rust Texture",
    category: "structural",
    description: "Rust texture with progressive reveal of oxidation on hover",
    tags: ["structural", "rust", "oxidation", "metal", "texture"],
    previewType: "box",
    cssCode: `/* Structural: Rust Texture */
.roycss-structural-rust-texture {
  position: relative;
  background: linear-gradient(135deg, oklch(0.5 0.02 30), oklch(0.36 0.02 30));
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.1), 0 6px 14px oklch(0 0 0 / 0.18);
}
.roycss-structural-rust-texture::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 30% 40% at 25% 30%, oklch(0.42 0.13 30), transparent 70%),
    radial-gradient(ellipse 40% 30% at 70% 60%, oklch(0.4 0.14 25), transparent 70%),
    radial-gradient(ellipse 25% 35% at 45% 80%, oklch(0.45 0.12 35), transparent 70%),
    radial-gradient(ellipse 35% 25% at 85% 20%, oklch(0.38 0.14 18), transparent 70%),
    radial-gradient(circle at 22% 18%, oklch(0.3 0.04 30 / 0.5) 0 1.5px, transparent 2px),
    radial-gradient(circle at 70% 60%, oklch(0.32 0.04 30 / 0.5) 0 2px, transparent 2.5px);
  background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%, 26px 26px, 32px 32px;
  opacity: 0;
  clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
  transition: opacity 800ms ease, clip-path 800ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.roycss-structural-rust-texture:hover::before {
  opacity: 1;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-structural-rust-texture:hover::before { transition: none; opacity: 1; clip-path: none; }
}`,
  },
] as unknown as CSSEffect[];

export default effectsBatch45;
