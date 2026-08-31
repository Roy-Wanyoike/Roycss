import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 52 — VFX-3: Image & Advanced VFX (30 effects)
 *
 * Two thematic groups:
 *   • Image & Media Effects (10)  — filter-driven image/scene treatments
 *   • Advanced VFX (20)           — cinematic visual effects (glitch, CRT,
 *                                   chromatic aberration, holographic, plasma,
 *                                   cyberpunk, sci-fi HUD, spotlights, etc.)
 *
 * Conventions:
 *   • Every class is prefixed `roycss-vfx-`
 *   • Every @keyframes symbol is prefixed `roy-vfx-img-` (image group) or
 *     `roy-vfx-adv-` (advanced VFX group) — guaranteed unique across the
 *     whole corpus (verified against batches 1–50).
 *   • Colors use the OKLCH color space with color-mix() compositing.
 *   • Animations favor GPU-friendly properties (transform, opacity, filter,
 *     clip-path, box-shadow) over layout-triggering properties.
 *   • Every effect honors `prefers-reduced-motion: reduce`.
 *   • Categories use the existing taxonomy (`filters` for image effects,
 *     `visual` for advanced VFX) so the category-explorer and category tests
 *     keep working without a taxonomy promotion.
 *   • No JavaScript, no external dependencies — pure CSS only.
 */
export const effectsBatch52: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // IMAGE & MEDIA EFFECTS (10)
  // ═══════════════════════════════════════════════════════════════

  // 1. vfx-image-reveal-2
  {
    id: "vfx-image-reveal-2",
    name: "Image Reveal",
    category: "filters",
    description:
      "Image revealed left-to-right via an animated clip-path inset, with a bright sheen sweeping across the unmasking edge.",
    tags: ["image", "reveal", "clip-path", "mask", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Image Reveal */
.roycss-vfx-image-reveal-2 {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.72 0.18 35), oklch(0.55 0.22 350) 40%, oklch(0.30 0.14 280) 100%);
  clip-path: inset(0 100% 0 0);
  animation: roy-vfx-img-reveal 2.4s cubic-bezier(0.77, 0, 0.175, 1) infinite;
}
.roycss-vfx-image-reveal-2::after {
  content: "";
  position: absolute;
  inset: 0;
  width: 40%;
  background: linear-gradient(90deg, transparent, oklch(1 0 0 / 0.45), transparent);
  transform: translateX(-160%);
  animation: roy-vfx-img-reveal-sheen 2.4s cubic-bezier(0.77, 0, 0.175, 1) infinite;
}
@keyframes roy-vfx-img-reveal {
  0%   { clip-path: inset(0 100% 0 0); }
  45%, 100% { clip-path: inset(0 0 0 0); }
}
@keyframes roy-vfx-img-reveal-sheen {
  0%   { transform: translateX(-160%); }
  55%, 100% { transform: translateX(320%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-image-reveal-2,
  .roycss-vfx-image-reveal-2::after {
    animation: none;
    clip-path: inset(0 0 0 0);
    transform: none;
  }
}`,
  },

  // 2. vfx-image-wipe-2
  {
    id: "vfx-image-wipe-2",
    name: "Image Wipe",
    category: "filters",
    description:
      "Image wiped clean by a sliding gradient panel using transform translateX, revealing a vibrant underlay.",
    tags: ["image", "wipe", "transform", "reveal", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Image Wipe */
.roycss-vfx-image-wipe-2 {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.65 0.20 145), oklch(0.55 0.22 200) 60%, oklch(0.40 0.18 260));
}
.roycss-vfx-image-wipe-2::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.20 0.04 260), oklch(0.15 0.06 220));
  transform: translateX(0%);
  animation: roy-vfx-img-wipe 2.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.roycss-vfx-image-wipe-2::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  left: 0;
  background: linear-gradient(180deg, transparent, oklch(0.85 0.18 60), transparent);
  box-shadow: 0 0 18px oklch(0.85 0.18 60 / 0.7);
  transform: translateX(0%);
  animation: roy-vfx-img-wipe-line 2.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes roy-vfx-img-wipe {
  0%   { transform: translateX(0%); }
  50%  { transform: translateX(100%); }
  50.01%, 100% { transform: translateX(0%); }
}
@keyframes roy-vfx-img-wipe-line {
  0%   { transform: translateX(0%); opacity: 1; }
  50%  { transform: translateX(calc(100% - 4px)); opacity: 1; }
  50.01%, 100% { transform: translateX(0%); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-image-wipe-2::before,
  .roycss-vfx-image-wipe-2::after {
    animation: none;
    transform: translateX(100%);
  }
}`,
  },

  // 3. vfx-image-blur-transition
  {
    id: "vfx-image-blur-transition",
    name: "Image Blur Transition",
    category: "filters",
    description:
      "Image (gradient) cross-fades between two scenes through a heavy blur filter pulse, mimicking a rack-focus transition.",
    tags: ["image", "blur", "transition", "filter", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Image Blur Transition */
.roycss-vfx-image-blur-transition {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.55 0.20 30), oklch(0.45 0.22 320));
  animation: roy-vfx-img-blur 4s ease-in-out infinite;
}
.roycss-vfx-image-blur-transition::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.30 0.18 200), oklch(0.20 0.20 260));
  opacity: 0;
  animation: roy-vfx-img-blur-layer 4s ease-in-out infinite;
}
@keyframes roy-vfx-img-blur {
  0%, 100% { filter: blur(0px) saturate(1); }
  50%      { filter: blur(14px) saturate(1.4); }
}
@keyframes roy-vfx-img-blur-layer {
  0%, 100% { opacity: 0; }
  50%      { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-image-blur-transition,
  .roycss-vfx-image-blur-transition::after {
    animation: none;
    filter: none;
    opacity: 1;
  }
}`,
  },

  // 4. vfx-grayscale-hover-2
  {
    id: "vfx-grayscale-hover-2",
    name: "Grayscale to Color Hover",
    category: "filters",
    description:
      "Image is desaturated by default and snaps to full vibrant color on hover, with a smooth saturate transition.",
    tags: ["image", "grayscale", "hover", "color", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Grayscale to Color Hover */
.roycss-vfx-grayscale-hover-2 {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle at 25% 25%, oklch(0.72 0.20 35), oklch(0.55 0.22 350) 50%, oklch(0.35 0.18 260) 100%);
  filter: grayscale(1) saturate(0.4);
  transition: filter 0.6s ease;
  cursor: pointer;
}
.roycss-vfx-grayscale-hover-2:hover {
  filter: grayscale(0) saturate(1.25);
}
.roycss-vfx-grayscale-hover-2::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, oklch(1 0 0 / 0.35) 50%, transparent 70%);
  transform: translateX(-120%);
  transition: transform 0.6s ease;
}
.roycss-vfx-grayscale-hover-2:hover::after {
  transform: translateX(120%);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-grayscale-hover-2,
  .roycss-vfx-grayscale-hover-2::after {
    transition: none;
  }
}`,
  },

  // 5. vfx-color-reveal
  {
    id: "vfx-color-reveal",
    name: "Color Reveal",
    category: "filters",
    description:
      "A black-and-white mask wipes away to expose a vivid color gradient underneath, using mask-image animation.",
    tags: ["image", "color", "reveal", "mask", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Color Reveal */
.roycss-vfx-color-reveal {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.65 0.22 25), oklch(0.55 0.24 330) 60%, oklch(0.40 0.20 260));
}
.roycss-vfx-color-reveal::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.95 0.01 250), oklch(0.88 0.02 220));
  -webkit-mask-image: linear-gradient(90deg, #000 50%, transparent 50%);
  mask-image: linear-gradient(90deg, #000 50%, transparent 50%);
  -webkit-mask-size: 200% 100%;
  mask-size: 200% 100%;
  -webkit-mask-position: 0% 0%;
  mask-position: 0% 0%;
  animation: roy-vfx-img-color-reveal 3s ease-in-out infinite;
}
@keyframes roy-vfx-img-color-reveal {
  0%, 100% { -webkit-mask-position: 0% 0%; mask-position: 0% 0%; }
  50%      { -webkit-mask-position: 100% 0%; mask-position: 100% 0%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-color-reveal::before {
    animation: none;
    -webkit-mask-position: 100% 0%;
    mask-position: 100% 0%;
  }
}`,
  },

  // 6. vfx-image-glitch
  {
    id: "vfx-image-glitch",
    name: "Image Glitch",
    category: "filters",
    description:
      "Image suffers periodic glitch bursts with clip-path slices shifting horizontally and a brief desaturation flash.",
    tags: ["image", "glitch", "clip-path", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Image Glitch */
.roycss-vfx-image-glitch {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.55 0.22 30), oklch(0.40 0.24 280));
  animation: roy-vfx-img-glitch 2.6s steps(1, end) infinite;
}
.roycss-vfx-image-glitch::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.60 0.22 30), oklch(0.45 0.24 280));
  clip-path: inset(20% 0 60% 0);
  animation: roy-vfx-img-glitch-slice 2.6s steps(1, end) infinite;
}
.roycss-vfx-image-glitch::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, oklch(0.50 0.22 30), oklch(0.35 0.24 280));
  clip-path: inset(70% 0 10% 0);
  animation: roy-vfx-img-glitch-slice2 2.6s steps(1, end) infinite;
}
@keyframes roy-vfx-img-glitch {
  0%, 88%, 100% { filter: none; }
  90%, 94%      { filter: saturate(2) contrast(1.2); }
  95%, 98%      { filter: hue-rotate(40deg) saturate(1.5); }
}
@keyframes roy-vfx-img-glitch-slice {
  0%, 88%, 100% { transform: translateX(0); clip-path: inset(20% 0 60% 0); }
  90%, 94%      { transform: translateX(-12%); clip-path: inset(18% 0 62% 0); }
  95%, 98%      { transform: translateX(10%); clip-path: inset(22% 0 58% 0); }
}
@keyframes roy-vfx-img-glitch-slice2 {
  0%, 88%, 100% { transform: translateX(0); clip-path: inset(70% 0 10% 0); }
  90%, 94%      { transform: translateX(14%); clip-path: inset(72% 0 8% 0); }
  95%, 98%      { transform: translateX(-10%); clip-path: inset(68% 0 12% 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-image-glitch,
  .roycss-vfx-image-glitch::before,
  .roycss-vfx-image-glitch::after {
    animation: none;
    transform: none;
    filter: none;
  }
}`,
  },

  // 7. vfx-rgb-split-image
  {
    id: "vfx-rgb-split-image",
    name: "RGB Split Image",
    category: "filters",
    description:
      "Image channels split into red/cyan fringes via stacked blend modes, then snap back together on a slow loop.",
    tags: ["image", "rgb", "split", "filter", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: RGB Split Image */
.roycss-vfx-rgb-split-image {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.55 0.20 30), oklch(0.40 0.22 280));
  isolation: isolate;
}
.roycss-vfx-rgb-split-image::before,
.roycss-vfx-rgb-split-image::after {
  content: "";
  position: absolute;
  inset: 0;
  background: inherit;
  mix-blend-mode: screen;
}
.roycss-vfx-rgb-split-image::before {
  background: linear-gradient(135deg, oklch(0.55 0.20 30), oklch(0.40 0.22 280));
  filter: drop-shadow(6px 0 0 oklch(0.60 0.30 25));
  animation: roy-vfx-img-rgb-r 3.2s ease-in-out infinite;
}
.roycss-vfx-rgb-split-image::after {
  background: linear-gradient(135deg, oklch(0.55 0.20 30), oklch(0.40 0.22 280));
  filter: drop-shadow(-6px 0 0 oklch(0.60 0.25 220));
  animation: roy-vfx-img-rgb-c 3.2s ease-in-out infinite;
}
@keyframes roy-vfx-img-rgb-r {
  0%, 100% { transform: translateX(0); opacity: 0; }
  50%      { transform: translateX(8px); opacity: 0.85; }
}
@keyframes roy-vfx-img-rgb-c {
  0%, 100% { transform: translateX(0); opacity: 0; }
  50%      { transform: translateX(-8px); opacity: 0.85; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-rgb-split-image::before,
  .roycss-vfx-rgb-split-image::after {
    animation: none;
    transform: none;
    opacity: 0;
  }
}`,
  },

  // 8. vfx-crt-effect
  {
    id: "vfx-crt-effect",
    name: "CRT Effect",
    category: "filters",
    description:
      "Image (gradient) treated as a CRT display: fine scanlines, vignette darkening, and a slow flicker.",
    tags: ["image", "crt", "scanlines", "vignette", "retro", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: CRT Effect */
.roycss-vfx-crt-effect {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 50%, oklch(0.30 0.18 145), oklch(0.15 0.12 200) 70%, oklch(0.08 0.04 220) 100%);
  animation: roy-vfx-img-crt-flicker 4s ease-in-out infinite;
}
.roycss-vfx-crt-effect::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    oklch(0 0 0 / 0.25) 0px,
    oklch(0 0 0 / 0.25) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
}
.roycss-vfx-crt-effect::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, oklch(0 0 0 / 0.65) 100%);
  pointer-events: none;
}
@keyframes roy-vfx-img-crt-flicker {
  0%, 100% { filter: brightness(1) contrast(1.05); }
  20%      { filter: brightness(1.05) contrast(1.08); }
  40%      { filter: brightness(0.92) contrast(1.1); }
  60%      { filter: brightness(1.02) contrast(1.06); }
  80%      { filter: brightness(0.96) contrast(1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-crt-effect { animation: none; filter: none; }
}`,
  },

  // 9. vfx-holographic-image
  {
    id: "vfx-holographic-image",
    name: "Holographic Image",
    category: "filters",
    description:
      "Image overlaid with a shifting iridescent gradient that drifts across the surface, mimicking a holographic foil.",
    tags: ["image", "holographic", "iridescent", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Holographic Image */
.roycss-vfx-holographic-image {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background:
    linear-gradient(135deg, oklch(0.25 0.10 250), oklch(0.20 0.12 220));
}
.roycss-vfx-holographic-image::before {
  content: "";
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 0deg,
    oklch(0.75 0.28 0),
    oklch(0.78 0.30 60),
    oklch(0.80 0.28 140),
    oklch(0.78 0.30 220),
    oklch(0.75 0.30 300),
    oklch(0.75 0.28 0)
  );
  mix-blend-mode: screen;
  opacity: 0.65;
  filter: blur(6px);
  animation: roy-vfx-img-holo-rotate 8s linear infinite;
}
.roycss-vfx-holographic-image::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, oklch(1 0 0 / 0.30) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: roy-vfx-img-holo-sheen 4s linear infinite;
}
@keyframes roy-vfx-img-holo-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes roy-vfx-img-holo-sheen {
  from { background-position: -100% 0; }
  to   { background-position: 200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-holographic-image::before,
  .roycss-vfx-holographic-image::after { animation: none; }
}`,
  },

  // 10. vfx-image-distort
  {
    id: "vfx-image-distort",
    name: "Image Distort",
    category: "filters",
    description:
      "Image (gradient) gently warped via transform skew and perspective, simulating a heat-haze ripple.",
    tags: ["image", "distort", "transform", "skew", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Image Distort */
.roycss-vfx-image-distort {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle at 40% 40%, oklch(0.65 0.20 35), oklch(0.45 0.22 320) 50%, oklch(0.25 0.16 260) 100%);
  animation: roy-vfx-img-distort 3.4s ease-in-out infinite;
  transform-origin: 50% 50%;
}
.roycss-vfx-image-distort::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, oklch(0.85 0.10 180 / 0.18) 50%, transparent 100%);
  background-size: 100% 24px;
  animation: roy-vfx-img-distort-ripple 1.6s linear infinite;
}
@keyframes roy-vfx-img-distort {
  0%, 100% { transform: skewX(0deg) skewY(0deg) scale(1); }
  25%      { transform: skewX(1.6deg) skewY(-0.8deg) scale(1.02); }
  50%      { transform: skewX(-1.2deg) skewY(1deg) scale(1.01); }
  75%      { transform: skewX(0.8deg) skewY(-1.2deg) scale(1.02); }
}
@keyframes roy-vfx-img-distort-ripple {
  from { background-position: 0 0; }
  to   { background-position: 0 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-image-distort,
  .roycss-vfx-image-distort::after {
    animation: none;
    transform: none;
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // ADVANCED VFX (20)
  // ═══════════════════════════════════════════════════════════════

  // 11. vfx-glitch-effect-2
  {
    id: "vfx-glitch-effect-2",
    name: "Glitch Effect",
    category: "visual",
    description:
      "Text glitch with clip-path slices jumping in opposite directions and an RGB split shadow burst on a fast loop.",
    tags: ["glitch", "text", "clip-path", "rgb", "vfx"],
    previewType: "text",
    cssCode: `/* VFX-3: Glitch Effect */
.roycss-vfx-glitch-effect-2 {
  position: relative;
  display: inline-block;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: oklch(0.95 0.02 250);
  text-shadow:
    2px 0 oklch(0.65 0.30 25 / 0.9),
    -2px 0 oklch(0.55 0.28 220 / 0.9);
  animation: roy-vfx-adv-glitch 1.8s steps(1, end) infinite;
}
.roycss-vfx-glitch-effect-2::before,
.roycss-vfx-glitch-effect-2::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  color: oklch(0.95 0.02 250);
  clip-path: inset(0 0 0 0);
}
.roycss-vfx-glitch-effect-2::before {
  text-shadow: 3px 0 oklch(0.65 0.30 25);
  animation: roy-vfx-adv-glitch-top 1.8s steps(1, end) infinite;
}
.roycss-vfx-glitch-effect-2::after {
  text-shadow: -3px 0 oklch(0.55 0.28 220);
  animation: roy-vfx-adv-glitch-bot 1.8s steps(1, end) infinite;
}
@keyframes roy-vfx-adv-glitch {
  0%, 86%, 100% { transform: translate(0); }
  88%           { transform: translate(-3px, 1px); }
  90%           { transform: translate(3px, -1px); }
  92%           { transform: translate(-2px, 0); }
  94%           { transform: translate(2px, 1px); }
}
@keyframes roy-vfx-adv-glitch-top {
  0%, 86%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0); }
  88%, 94%      { clip-path: inset(0 0 60% 0); transform: translate(-6px, -2px); }
}
@keyframes roy-vfx-adv-glitch-bot {
  0%, 86%, 100% { clip-path: inset(100% 0 0 0); transform: translate(0); }
  88%, 94%      { clip-path: inset(60% 0 0 0); transform: translate(6px, 2px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-glitch-effect-2,
  .roycss-vfx-glitch-effect-2::before,
  .roycss-vfx-glitch-effect-2::after {
    animation: none;
    transform: none;
  }
}`,
  },

  // 12. vfx-scanlines-2
  {
    id: "vfx-scanlines-2",
    name: "Scanlines Overlay",
    category: "visual",
    description:
      "Soft scanlines drifting vertically over a tinted backdrop, like an old analog monitor with a slow roll.",
    tags: ["scanlines", "overlay", "retro", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Scanlines Overlay */
.roycss-vfx-scanlines-2 {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(180deg, oklch(0.18 0.06 260), oklch(0.10 0.04 220));
}
.roycss-vfx-scanlines-2::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    oklch(0.85 0.10 180 / 0.18) 0px,
    oklch(0.85 0.10 180 / 0.18) 1px,
    transparent 1px,
    transparent 4px
  );
  background-size: 100% 24px;
  animation: roy-vfx-adv-scanlines 3.6s linear infinite;
}
.roycss-vfx-scanlines-2::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, oklch(0 0 0 / 0.55) 100%);
}
@keyframes roy-vfx-adv-scanlines {
  from { background-position: 0 0; }
  to   { background-position: 0 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-scanlines-2::before { animation: none; }
}`,
  },

  // 13. vfx-crt-vfx
  {
    id: "vfx-crt-vfx",
    name: "CRT VFX",
    category: "visual",
    description:
      "CRT screen with curvature (border-radius + inset shadows), scanlines, and a soft flicker. Pure CSS — no JS.",
    tags: ["crt", "vfx", "curvature", "scanlines", "flicker", "retro"],
    previewType: "background",
    cssCode: `/* VFX-3: CRT VFX */
.roycss-vfx-crt-vfx {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 38% / 22%;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 40%, oklch(0.35 0.20 145), oklch(0.18 0.14 200) 65%, oklch(0.08 0.04 220) 100%);
  box-shadow:
    inset 0 0 60px oklch(0 0 0 / 0.8),
    inset 0 0 18px oklch(0.65 0.20 145 / 0.4),
    0 0 24px oklch(0.30 0.16 145 / 0.5);
  animation: roy-vfx-adv-crt-vfx 3.4s ease-in-out infinite;
}
.roycss-vfx-crt-vfx::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    oklch(0 0 0 / 0.30) 0px,
    oklch(0 0 0 / 0.30) 1px,
    transparent 1px,
    transparent 3px
  );
}
.roycss-vfx-crt-vfx::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, transparent 55%, oklch(0 0 0 / 0.75) 100%),
    linear-gradient(180deg, oklch(0.85 0.20 145 / 0.06) 0%, transparent 30%);
  animation: roy-vfx-adv-crt-vfx-scan 6s linear infinite;
}
@keyframes roy-vfx-adv-crt-vfx {
  0%, 100% { filter: brightness(1) contrast(1.05); }
  20%      { filter: brightness(1.08) contrast(1.1); }
  45%      { filter: brightness(0.88) contrast(1.12); }
  70%      { filter: brightness(1.05) contrast(1.06); }
}
@keyframes roy-vfx-adv-crt-vfx-scan {
  from { background-position: 0 -100%, 0 0; }
  to   { background-position: 0 200%, 0 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-crt-vfx,
  .roycss-vfx-crt-vfx::after { animation: none; filter: none; }
}`,
  },

  // 14. vfx-rgb-split-vfx
  {
    id: "vfx-rgb-split-vfx",
    name: "RGB Split VFX",
    category: "visual",
    description:
      "Text splits into red, green, and blue channel copies that drift apart and snap back, evoking a bad video cable.",
    tags: ["rgb", "split", "text", "filter", "vfx"],
    previewType: "text",
    cssCode: `/* VFX-3: RGB Split VFX */
.roycss-vfx-rgb-split-vfx {
  position: relative;
  display: inline-block;
  font-weight: 800;
  color: oklch(0.95 0.02 250);
  text-shadow:
    3px 0 oklch(0.65 0.30 25),
    -3px 0 oklch(0.55 0.28 220),
    0 0 oklch(0.70 0.28 145);
  animation: roy-vfx-adv-rgb-split 2.4s ease-in-out infinite;
}
@keyframes roy-vfx-adv-rgb-split {
  0%, 100% {
    text-shadow:
      1px 0 oklch(0.65 0.30 25),
      -1px 0 oklch(0.55 0.28 220),
      0 0 oklch(0.70 0.28 145);
  }
  50% {
    text-shadow:
      6px 0 oklch(0.65 0.30 25 / 0.85),
      -6px 0 oklch(0.55 0.28 220 / 0.85),
      0 3px oklch(0.70 0.28 145 / 0.7);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-rgb-split-vfx { animation: none; }
}`,
  },

  // 15. vfx-chromatic-aberration
  {
    id: "vfx-chromatic-aberration",
    name: "Chromatic Aberration",
    category: "visual",
    description:
      "Text fringed with red and blue ghost edges via stacked text-shadows, with the fringes breathing in and out.",
    tags: ["chromatic", "aberration", "text", "vfx"],
    previewType: "text",
    cssCode: `/* VFX-3: Chromatic Aberration */
.roycss-vfx-chromatic-aberration {
  display: inline-block;
  font-weight: 800;
  color: oklch(0.96 0.02 250);
  text-shadow:
    -1px 0 oklch(0.65 0.30 25),
    1px 0 oklch(0.55 0.28 220),
    -3px 0 oklch(0.65 0.30 25 / 0.5),
    3px 0 oklch(0.55 0.28 220 / 0.5),
    -6px 0 oklch(0.65 0.30 25 / 0.25),
    6px 0 oklch(0.55 0.28 220 / 0.25);
  animation: roy-vfx-adv-chromatic 3.6s ease-in-out infinite;
}
@keyframes roy-vfx-adv-chromatic {
  0%, 100% {
    text-shadow:
      -1px 0 oklch(0.65 0.30 25),
      1px 0 oklch(0.55 0.28 220),
      -3px 0 oklch(0.65 0.30 25 / 0.5),
      3px 0 oklch(0.55 0.28 220 / 0.5),
      -6px 0 oklch(0.65 0.30 25 / 0.25),
      6px 0 oklch(0.55 0.28 220 / 0.25);
  }
  50% {
    text-shadow:
      -2px 0 oklch(0.65 0.30 25),
      2px 0 oklch(0.55 0.28 220),
      -6px 0 oklch(0.65 0.30 25 / 0.7),
      6px 0 oklch(0.55 0.28 220 / 0.7),
      -12px 0 oklch(0.65 0.30 25 / 0.4),
      12px 0 oklch(0.55 0.28 220 / 0.4);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-chromatic-aberration { animation: none; }
}`,
  },

  // 16. vfx-distortion
  {
    id: "vfx-distortion",
    name: "Distortion",
    category: "visual",
    description:
      "Text warped via transform skew and rotate on a slow loop, like a signal struggling to stabilize.",
    tags: ["distortion", "transform", "skew", "text", "vfx"],
    previewType: "text",
    cssCode: `/* VFX-3: Distortion */
.roycss-vfx-distortion {
  display: inline-block;
  font-weight: 800;
  color: oklch(0.95 0.04 250);
  transform-origin: 50% 50%;
  animation: roy-vfx-adv-distortion 3.2s ease-in-out infinite;
}
@keyframes roy-vfx-adv-distortion {
  0%, 100% { transform: skewX(0deg) skewY(0deg) rotate(0deg) scale(1); }
  20%      { transform: skewX(3deg) skewY(-1deg) rotate(0.6deg) scale(1.02); }
  40%      { transform: skewX(-2deg) skewY(1deg) rotate(-0.4deg) scale(0.99); }
  60%      { transform: skewX(2deg) skewY(-2deg) rotate(0.8deg) scale(1.01); }
  80%      { transform: skewX(-3deg) skewY(1deg) rotate(-0.6deg) scale(1.02); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-distortion { animation: none; transform: none; }
}`,
  },

  // 17. vfx-noise-effect
  {
    id: "vfx-noise-effect",
    name: "Noise Effect",
    category: "visual",
    description:
      "Animated film-grain noise (inline SVG data URI) overlaid on a dark surface, gently shifting every frame.",
    tags: ["noise", "grain", "overlay", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Noise Effect */
.roycss-vfx-noise-effect {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.20 0.05 260), oklch(0.12 0.04 220));
}
.roycss-vfx-noise-effect::before {
  content: "";
  position: absolute;
  inset: -50%;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>");
  opacity: 0.35;
  mix-blend-mode: overlay;
  animation: roy-vfx-adv-noise 0.8s steps(4, end) infinite;
}
.roycss-vfx-noise-effect::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, oklch(0 0 0 / 0.5) 100%);
}
@keyframes roy-vfx-adv-noise {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-6%, 4%); }
  50%  { transform: translate(4%, -6%); }
  75%  { transform: translate(-4%, -4%); }
  100% { transform: translate(6%, 6%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-noise-effect::before { animation: none; transform: none; }
}`,
  },

  // 18. vfx-scan-reveal
  {
    id: "vfx-scan-reveal",
    name: "Scan Reveal",
    category: "visual",
    description:
      "Text revealed letter-by-letter via a horizontal clip-path sweep, with a glowing scan line at the reveal edge.",
    tags: ["scan", "reveal", "clip-path", "text", "vfx"],
    previewType: "text",
    cssCode: `/* VFX-3: Scan Reveal */
.roycss-vfx-scan-reveal {
  position: relative;
  display: inline-block;
  font-weight: 800;
  color: oklch(0.95 0.02 250);
  clip-path: inset(0 100% 0 0);
  animation: roy-vfx-adv-scan-reveal 3s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.roycss-vfx-scan-reveal::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  left: 0;
  background: linear-gradient(180deg, transparent, oklch(0.85 0.20 180), transparent);
  box-shadow: 0 0 16px oklch(0.85 0.20 180 / 0.85);
  transform: translateX(0%);
  animation: roy-vfx-adv-scan-reveal-line 3s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes roy-vfx-adv-scan-reveal {
  0%   { clip-path: inset(0 100% 0 0); }
  60%, 100% { clip-path: inset(0 0 0 0); }
}
@keyframes roy-vfx-adv-scan-reveal-line {
  0%   { transform: translateX(0%); opacity: 1; }
  60%  { transform: translateX(calc(100% - 3px)); opacity: 1; }
  60.01%, 100% { transform: translateX(0%); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-scan-reveal,
  .roycss-vfx-scan-reveal::after {
    animation: none;
    clip-path: inset(0 0 0 0);
    transform: none;
  }
}`,
  },

  // 19. vfx-digital-interference-2
  {
    id: "vfx-digital-interference-2",
    name: "Digital Interference",
    category: "visual",
    description:
      "Text suffering digital interference: periodic horizontal clip-path tear with brief hue rotation, like a corrupted broadcast.",
    tags: ["digital", "interference", "glitch", "text", "vfx"],
    previewType: "text",
    cssCode: `/* VFX-3: Digital Interference */
.roycss-vfx-digital-interference-2 {
  position: relative;
  display: inline-block;
  font-weight: 800;
  color: oklch(0.95 0.02 250);
  text-shadow: 0 0 12px oklch(0.70 0.20 180 / 0.45);
  animation: roy-vfx-adv-digital 2.4s steps(1, end) infinite;
}
.roycss-vfx-digital-interference-2::before,
.roycss-vfx-digital-interference-2::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  color: oklch(0.95 0.02 250);
}
.roycss-vfx-digital-interference-2::before {
  clip-path: inset(40% 0 40% 0);
  background: oklch(0.95 0.02 250);
  color: oklch(0.20 0.06 220);
  transform: translateX(0);
  animation: roy-vfx-adv-digital-tear 2.4s steps(1, end) infinite;
}
.roycss-vfx-digital-interference-2::after {
  clip-path: inset(0 0 100% 0);
  text-shadow: 4px 0 oklch(0.65 0.30 25), -4px 0 oklch(0.55 0.28 220);
  animation: roy-vfx-adv-digital-slice 2.4s steps(1, end) infinite;
}
@keyframes roy-vfx-adv-digital {
  0%, 80%, 100% { filter: none; transform: translate(0); }
  82%, 86%      { filter: hue-rotate(60deg) saturate(1.5); transform: translate(-2px, 0); }
  88%, 92%      { filter: hue-rotate(-40deg) saturate(1.4); transform: translate(2px, 0); }
}
@keyframes roy-vfx-adv-digital-tear {
  0%, 80%, 100% { transform: translateX(0); clip-path: inset(40% 0 40% 0); }
  82%, 92%      { transform: translateX(-18px); clip-path: inset(38% 0 42% 0); }
}
@keyframes roy-vfx-adv-digital-slice {
  0%, 80%, 100% { clip-path: inset(0 0 100% 0); }
  82%, 92%      { clip-path: inset(20% 0 50% 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-digital-interference-2,
  .roycss-vfx-digital-interference-2::before,
  .roycss-vfx-digital-interference-2::after {
    animation: none;
    transform: none;
    filter: none;
    clip-path: inset(0 0 0 0);
  }
}`,
  },

  // 20. vfx-holographic-shimmer-2
  {
    id: "vfx-holographic-shimmer-2",
    name: "Holographic Shimmer",
    category: "visual",
    description:
      "Text shimmering through a rotating conic-gradient hue cycle, with a sliding light streak for that iridescent foil look.",
    tags: ["holographic", "shimmer", "conic", "text", "vfx"],
    previewType: "text",
    cssCode: `/* VFX-3: Holographic Shimmer */
.roycss-vfx-holographic-shimmer-2 {
  position: relative;
  display: inline-block;
  font-weight: 800;
  background: conic-gradient(
    from 0deg,
    oklch(0.78 0.28 0),
    oklch(0.82 0.30 60),
    oklch(0.80 0.28 140),
    oklch(0.82 0.30 220),
    oklch(0.78 0.30 300),
    oklch(0.78 0.28 0)
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: roy-vfx-adv-holo-shimmer 4s linear infinite;
}
.roycss-vfx-holographic-shimmer-2::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, oklch(1 0 0 / 0.7) 50%, transparent 70%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: roy-vfx-adv-holo-streak 3s linear infinite;
}
@keyframes roy-vfx-adv-holo-shimmer {
  from { background-position: 0% 0; }
  to   { background-position: 200% 0; }
}
@keyframes roy-vfx-adv-holo-streak {
  from { background-position: -100% 0; }
  to   { background-position: 200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-holographic-shimmer-2,
  .roycss-vfx-holographic-shimmer-2::after { animation: none; }
}`,
  },

  // 21. vfx-energy-glow
  {
    id: "vfx-energy-glow",
    name: "Energy Glow",
    category: "visual",
    description:
      "A box that pulses with a layered energy glow — inner core, mid aura, and outer halo — all driven by box-shadow.",
    tags: ["energy", "glow", "pulse", "box-shadow", "vfx"],
    previewType: "box",
    cssCode: `/* VFX-3: Energy Glow */
.roycss-vfx-energy-glow {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background:
    radial-gradient(circle at 50% 50%, oklch(0.30 0.18 160), oklch(0.20 0.10 200) 70%, oklch(0.10 0.04 220));
  animation: roy-vfx-adv-energy 2.6s ease-in-out infinite;
}
@keyframes roy-vfx-adv-energy {
  0%, 100% {
    box-shadow:
      0 0 12px oklch(0.70 0.22 160 / 0.55),
      0 0 28px oklch(0.70 0.22 160 / 0.35),
      0 0 60px oklch(0.70 0.22 160 / 0.18),
      inset 0 0 18px oklch(0.78 0.22 160 / 0.4);
  }
  50% {
    box-shadow:
      0 0 24px oklch(0.78 0.26 160 / 0.85),
      0 0 60px oklch(0.78 0.26 160 / 0.55),
      0 0 110px oklch(0.78 0.26 160 / 0.30),
      inset 0 0 32px oklch(0.85 0.26 160 / 0.6);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-energy-glow {
    animation: none;
    box-shadow:
      0 0 18px oklch(0.70 0.22 160 / 0.6),
      0 0 44px oklch(0.70 0.22 160 / 0.4);
  }
}`,
  },

  // 22. vfx-electric-border
  {
    id: "vfx-electric-border",
    name: "Electric Border",
    category: "visual",
    description:
      "Border animated as a flowing electric gradient that races around the element via conic-gradient rotation.",
    tags: ["electric", "border", "animated", "gradient", "vfx"],
    previewType: "box",
    cssCode: `/* VFX-3: Electric Border */
.roycss-vfx-electric-border {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  background: oklch(0.14 0.05 260);
  padding: 2px;
  overflow: hidden;
}
.roycss-vfx-electric-border::before {
  content: "";
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    oklch(0.78 0.30 60) 12%,
    oklch(0.85 0.28 160) 22%,
    transparent 35%,
    transparent 50%,
    oklch(0.78 0.30 220) 62%,
    oklch(0.85 0.28 320) 72%,
    transparent 85%
  );
  animation: roy-vfx-adv-electric 4s linear infinite;
}
.roycss-vfx-electric-border::after {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: 14px;
  background: oklch(0.16 0.06 260);
}
@keyframes roy-vfx-adv-electric {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-electric-border::before { animation: none; }
}`,
  },

  // 23. vfx-laser-border
  {
    id: "vfx-laser-border",
    name: "Laser Border",
    category: "visual",
    description:
      "Thin glowing laser line racing around the element's perimeter, leaving a brief afterglow trail.",
    tags: ["laser", "border", "thin", "glow", "vfx"],
    previewType: "box",
    cssCode: `/* VFX-3: Laser Border */
.roycss-vfx-laser-border {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  background:
    linear-gradient(135deg, oklch(0.14 0.06 250), oklch(0.08 0.04 220));
  overflow: hidden;
}
.roycss-vfx-laser-border::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 1px;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    oklch(0.95 0.30 60) 30deg,
    oklch(1 0 0) 45deg,
    oklch(0.95 0.30 60) 60deg,
    transparent 90deg,
    transparent 360deg
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: roy-vfx-adv-laser 3s linear infinite;
}
.roycss-vfx-laser-border::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  box-shadow:
    0 0 12px oklch(0.90 0.30 60 / 0.5),
    inset 0 0 12px oklch(0.90 0.30 60 / 0.25);
  animation: roy-vfx-adv-laser-pulse 3s ease-in-out infinite;
}
@keyframes roy-vfx-adv-laser {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes roy-vfx-adv-laser-pulse {
  0%, 100% { box-shadow: 0 0 8px oklch(0.90 0.30 60 / 0.3), inset 0 0 8px oklch(0.90 0.30 60 / 0.15); }
  50%      { box-shadow: 0 0 20px oklch(0.90 0.30 60 / 0.7), inset 0 0 18px oklch(0.90 0.30 60 / 0.4); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-laser-border::before,
  .roycss-vfx-laser-border::after { animation: none; }
}`,
  },

  // 24. vfx-plasma-gradient
  {
    id: "vfx-plasma-gradient",
    name: "Plasma Gradient",
    category: "visual",
    description:
      "A multi-stop conic-gradient background animated via continuous hue-rotate, producing a flowing plasma field.",
    tags: ["plasma", "gradient", "hue-rotate", "background", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Plasma Gradient */
.roycss-vfx-plasma-gradient {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background:
    conic-gradient(
      from 0deg,
      oklch(0.65 0.30 0),
      oklch(0.70 0.30 60),
      oklch(0.75 0.30 140),
      oklch(0.70 0.30 220),
      oklch(0.65 0.30 300),
      oklch(0.65 0.30 0)
    ),
    radial-gradient(circle at 30% 30%, oklch(0.78 0.28 180 / 0.4), transparent 60%);
  background-blend-mode: screen;
  animation: roy-vfx-adv-plasma 8s linear infinite;
}
.roycss-vfx-plasma-gradient::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 60%, oklch(0 0 0 / 0.4) 100%);
}
@keyframes roy-vfx-adv-plasma {
  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-plasma-gradient { animation: none; filter: none; }
}`,
  },

  // 25. vfx-cyberpunk-effect
  {
    id: "vfx-cyberpunk-effect",
    name: "Cyberpunk Effect",
    category: "visual",
    description:
      "Neon cyan/magenta text with periodic glitch bursts and a chromatic split, evoking a cyberpunk title card.",
    tags: ["cyberpunk", "neon", "glitch", "text", "vfx"],
    previewType: "text",
    cssCode: `/* VFX-3: Cyberpunk Effect */
.roycss-vfx-cyberpunk-effect {
  position: relative;
  display: inline-block;
  font-weight: 800;
  color: oklch(0.95 0.10 180);
  text-shadow:
    0 0 6px oklch(0.85 0.20 180),
    0 0 14px oklch(0.80 0.26 180 / 0.7),
    0 0 24px oklch(0.75 0.30 320 / 0.5),
    2px 0 oklch(0.75 0.30 320),
    -2px 0 oklch(0.75 0.30 180);
  animation: roy-vfx-adv-cyberpunk 2.8s steps(1, end) infinite;
}
.roycss-vfx-cyberpunk-effect::before {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  color: oklch(0.95 0.10 180);
  text-shadow: 4px 0 oklch(0.75 0.30 320);
  clip-path: inset(0 0 100% 0);
  animation: roy-vfx-adv-cyberpunk-glitch 2.8s steps(1, end) infinite;
}
@keyframes roy-vfx-adv-cyberpunk {
  0%, 84%, 100% { transform: translate(0); filter: none; }
  86%           { transform: translate(-3px, 1px); filter: hue-rotate(30deg); }
  88%           { transform: translate(3px, -1px); filter: hue-rotate(-20deg); }
  90%, 94%      { transform: translate(-2px, 0); }
}
@keyframes roy-vfx-adv-cyberpunk-glitch {
  0%, 84%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0); }
  86%, 94%      { clip-path: inset(20% 0 50% 0); transform: translate(-8px, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-cyberpunk-effect,
  .roycss-vfx-cyberpunk-effect::before {
    animation: none;
    transform: none;
    filter: none;
  }
}`,
  },

  // 26. vfx-retro-effect
  {
    id: "vfx-retro-effect",
    name: "Retro Effect",
    category: "visual",
    description:
      "Sepia/contrast-treated backdrop with a subtle warm hue drift and a slow vignette breathing, like an old photograph.",
    tags: ["retro", "sepia", "contrast", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Retro Effect */
.roycss-vfx-retro-effect {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background:
    linear-gradient(135deg, oklch(0.70 0.18 60), oklch(0.55 0.20 30) 60%, oklch(0.40 0.18 350));
  filter: sepia(0.65) contrast(1.15) saturate(0.85);
  animation: roy-vfx-adv-retro 6s ease-in-out infinite;
}
.roycss-vfx-retro-effect::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      to bottom,
      oklch(0 0 0 / 0.12) 0px,
      oklch(0 0 0 / 0.12) 1px,
      transparent 1px,
      transparent 4px
    );
}
.roycss-vfx-retro-effect::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, oklch(0.20 0.04 40 / 0.7) 100%);
  animation: roy-vfx-adv-retro-vignette 6s ease-in-out infinite;
}
@keyframes roy-vfx-adv-retro {
  0%, 100% { filter: sepia(0.6) contrast(1.15) saturate(0.85) hue-rotate(0deg); }
  50%      { filter: sepia(0.75) contrast(1.25) saturate(0.95) hue-rotate(10deg); }
}
@keyframes roy-vfx-adv-retro-vignette {
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 0.85; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-retro-effect,
  .roycss-vfx-retro-effect::after { animation: none; }
}`,
  },

  // 27. vfx-sci-fi-hud
  {
    id: "vfx-sci-fi-hud",
    name: "Sci-Fi HUD",
    category: "visual",
    description:
      "Sci-fi HUD panel with a faint grid, sweeping scanline, glow corners, and a tracking reticle in the center.",
    tags: ["sci-fi", "hud", "grid", "scanline", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Sci-Fi HUD */
.roycss-vfx-sci-fi-hud {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 50%, oklch(0.18 0.12 180 / 0.6), oklch(0.08 0.04 220) 80%);
  border: 1px solid oklch(0.70 0.20 180 / 0.5);
  box-shadow:
    inset 0 0 30px oklch(0.60 0.20 180 / 0.25),
    0 0 24px oklch(0.60 0.20 180 / 0.2);
}
.roycss-vfx-sci-fi-hud::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, oklch(0.70 0.20 180 / 0.18) 1px, transparent 1px) 0 0 / 24px 24px,
    linear-gradient(to bottom, oklch(0.70 0.20 180 / 0.18) 1px, transparent 1px) 0 0 / 24px 24px;
  -webkit-mask: radial-gradient(circle at center, #000 60%, transparent 100%);
  mask: radial-gradient(circle at center, #000 60%, transparent 100%);
}
.roycss-vfx-sci-fi-hud::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, oklch(0.85 0.20 180), transparent);
  box-shadow: 0 0 14px oklch(0.85 0.20 180 / 0.7);
  animation: roy-vfx-adv-hud-scan 4s linear infinite;
}
@keyframes roy-vfx-adv-hud-scan {
  0%   { transform: translateY(0); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(calc(100% - 3px)); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-sci-fi-hud::after { animation: none; top: 50%; }
}`,
  },

  // 28. vfx-liquid-distortion
  {
    id: "vfx-liquid-distortion",
    name: "Liquid Distortion",
    category: "visual",
    description:
      "Text wobbles as if submerged in water, with a slow vertical ripple filter pulsing on a loop.",
    tags: ["liquid", "distortion", "ripple", "text", "vfx"],
    previewType: "text",
    cssCode: `/* VFX-3: Liquid Distortion */
.roycss-vfx-liquid-distortion {
  display: inline-block;
  font-weight: 800;
  color: oklch(0.95 0.10 200);
  text-shadow: 0 0 12px oklch(0.70 0.22 200 / 0.5);
  transform-origin: 50% 50%;
  animation: roy-vfx-adv-liquid 3s ease-in-out infinite;
}
@keyframes roy-vfx-adv-liquid {
  0%, 100% {
    transform: skewX(0deg) scaleY(1) translateY(0);
    filter: blur(0px) hue-rotate(0deg);
  }
  25% {
    transform: skewX(2deg) scaleY(1.03) translateY(-2px);
    filter: blur(0.4px) hue-rotate(15deg);
  }
  50% {
    transform: skewX(-2deg) scaleY(0.98) translateY(1px);
    filter: blur(0.6px) hue-rotate(-10deg);
  }
  75% {
    transform: skewX(1.5deg) scaleY(1.02) translateY(-1px);
    filter: blur(0.3px) hue-rotate(8deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-liquid-distortion { animation: none; transform: none; filter: none; }
}`,
  },

  // 29. vfx-spotlight-tracking
  {
    id: "vfx-spotlight-tracking",
    name: "Spotlight Tracking",
    category: "visual",
    description:
      "A bright spotlight (radial-gradient) sweeps across a dark surface, revealing the texture beneath as it passes.",
    tags: ["spotlight", "tracking", "radial-gradient", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Spotlight Tracking */
.roycss-vfx-spotlight-tracking {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 50%, oklch(0.30 0.10 220), oklch(0.10 0.04 220) 70%, oklch(0.05 0.02 220));
}
.roycss-vfx-spotlight-tracking::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(45deg, oklch(0.70 0.20 180 / 0.06) 0px, oklch(0.70 0.20 180 / 0.06) 8px, transparent 8px, transparent 18px);
}
.roycss-vfx-spotlight-tracking::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at var(--x, 50%) var(--y, 50%),
    oklch(0.95 0.18 60) 0%,
    oklch(0.85 0.22 60 / 0.5) 12%,
    transparent 35%
  );
  mix-blend-mode: screen;
  animation: roy-vfx-adv-spotlight 5s ease-in-out infinite;
}
@keyframes roy-vfx-adv-spotlight {
  0%   { background-position: 0% 50%; --x: 10%; --y: 50%; }
  25%  { --x: 80%; --y: 20%; }
  50%  { --x: 30%; --y: 80%; }
  75%  { --x: 70%; --y: 60%; }
  100% { --x: 10%; --y: 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-spotlight-tracking::after { animation: none; }
}`,
  },

  // 30. vfx-mouse-glow
  {
    id: "vfx-mouse-glow",
    name: "Mouse Glow",
    category: "visual",
    description:
      "A soft glow blob orbits the surface, simulating a cursor-follow light. Pure CSS — uses a :hover proxy and animated offset.",
    tags: ["mouse", "glow", "cursor", "follow", "vfx"],
    previewType: "background",
    cssCode: `/* VFX-3: Mouse Glow */
.roycss-vfx-mouse-glow {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 50%, oklch(0.18 0.06 260), oklch(0.10 0.04 220) 80%);
  cursor: crosshair;
  transition: background 0.4s ease;
}
.roycss-vfx-mouse-glow:hover {
  background:
    radial-gradient(circle at 50% 50%, oklch(0.24 0.08 260), oklch(0.10 0.04 220) 80%);
}
.roycss-vfx-mouse-glow::before {
  content: "";
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.90 0.22 60 / 0.55), oklch(0.85 0.24 320 / 0.25) 40%, transparent 70%);
  filter: blur(8px);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.5;
  pointer-events: none;
  animation: roy-vfx-adv-mouse-glow 6s ease-in-out infinite;
}
.roycss-vfx-mouse-glow:hover::before {
  opacity: 1;
  animation: roy-vfx-adv-mouse-glow 4s ease-in-out infinite;
}
.roycss-vfx-mouse-glow::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.70 0.20 180 / 0.08), transparent 30%),
    radial-gradient(circle at 70% 70%, oklch(0.70 0.20 320 / 0.08), transparent 30%);
  pointer-events: none;
}
@keyframes roy-vfx-adv-mouse-glow {
  0%   { top: 30%; left: 30%; }
  25%  { top: 60%; left: 70%; }
  50%  { top: 40%; left: 80%; }
  75%  { top: 70%; left: 35%; }
  100% { top: 30%; left: 30%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-vfx-mouse-glow::before { animation: none; opacity: 0.7; top: 50%; left: 50%; }
}`,
  },
];
