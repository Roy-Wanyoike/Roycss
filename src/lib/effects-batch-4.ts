import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 4
 * - 15 filter effects (CSS filter property on gradient backgrounds)
 * - 10 form effects (inputs, toggles, validation states)
 * - 10 navigation effects (menus, tabs, breadcrumbs, pagination)
 * - 15 misc effects (confetti, snow, fireworks, hologram, etc.)
 *
 * All class names use the `roycss-` prefix.
 * All keyframe names use the `roy-` prefix and are unique per effect.
 * Each cssCode block is self-contained (class + any @keyframes it needs).
 */
export const effectsBatch4: CSSEffect[] = [
  /* ═════════════════════════════════════════════════════════════
   *  FILTERS (15) — applied to colorful gradient backgrounds
   * ═════════════════════════════════════════════════════════════ */

  {
    id: "filter-vintage",
    name: "Vintage Filter",
    category: "filters",
    description: "A warm vintage photo filter with sepia, reduced saturation and slight contrast drop",
    tags: ["vintage", "sepia", "photo", "warm"],
    previewType: "background",
    cssCode: `/* Vintage Filter */
.roycss-filter-vintage {
  background: linear-gradient(135deg, oklch(0.712 0.181 22.84) 0%, oklch(0.864 0.143 84.36) 40%, oklch(0.826 0.154 331.46) 80%, oklch(0.827 0.128 215.58) 100%);
  filter: sepia(0.55) saturate(0.8) contrast(0.9) brightness(0.95) hue-rotate(-10deg);
}`,
  },
  {
    id: "filter-cinematic",
    name: "Cinematic Filter",
    category: "filters",
    description: "Teal & orange cinematic color grade with boosted contrast and saturation",
    tags: ["cinematic", "teal", "orange", "movie"],
    previewType: "background",
    cssCode: `/* Cinematic Filter */
.roycss-filter-cinematic {
  background: linear-gradient(135deg, oklch(0.615 0.235 30.43) 0%, oklch(0.8 0.162 78.77) 40%, oklch(0.616 0.104 219.93) 80%, oklch(0.82 0.102 214.8) 100%);
  filter: contrast(1.25) saturate(1.3) brightness(0.92) hue-rotate(-8deg) sepia(0.18);
}`,
  },
  {
    id: "filter-dramatic",
    name: "Dramatic Filter",
    category: "filters",
    description: "High-contrast dramatic grade with deepened shadows and punched saturation",
    tags: ["dramatic", "contrast", "moody", "bold"],
    previewType: "background",
    cssCode: `/* Dramatic Filter */
.roycss-filter-dramatic {
  background: linear-gradient(135deg, oklch(0.777 0.099 10.85) 0%, oklch(0.927 0.038 9.81) 30%, oklch(0.732 0.169 11.89) 60%, oklch(0.736 0.164 34.71) 100%);
  filter: contrast(1.6) saturate(1.5) brightness(0.82);
}`,
  },
  {
    id: "filter-dreamy",
    name: "Dreamy Filter",
    category: "filters",
    description: "Soft dreamy haze with a slight blur, lifted brightness and gentle saturation",
    tags: ["dreamy", "soft", "blur", "haze"],
    previewType: "background",
    cssCode: `/* Dreamy Filter */
.roycss-filter-dreamy {
  background: linear-gradient(135deg, oklch(0.694 0.199 311.3) 0%, oklch(0.74 0.195 341.99) 40%, oklch(0.913 0.102 200.91) 100%);
  filter: blur(1.2px) brightness(1.18) saturate(1.4) contrast(0.92);
}`,
  },
  {
    id: "filter-glitch",
    name: "Glitch Filter",
    category: "filters",
    description: "Animated hue-rotate glitch that cycles colors in stepped jumps",
    tags: ["glitch", "animated", "hue", "rgb"],
    previewType: "background",
    cssCode: `/* Glitch Filter */
.roycss-filter-glitch {
  background: linear-gradient(135deg, oklch(0.838 0.245 147.59) 0%, oklch(0.574 0.192 255.75) 50%, oklch(0.759 0.164 64.36) 100%);
  animation: roy-filter-glitch 1.2s steps(2, end) infinite;
}
@keyframes roy-filter-glitch {
  0%   { filter: hue-rotate(0deg) saturate(1.5); }
  20%  { filter: hue-rotate(60deg) saturate(2) contrast(1.3); }
  40%  { filter: hue-rotate(180deg) saturate(1.8) invert(0.15); }
  60%  { filter: hue-rotate(270deg) saturate(2.5) contrast(1.1); }
  80%  { filter: hue-rotate(120deg) saturate(1.6); }
  100% { filter: hue-rotate(360deg) saturate(1.5); }
}`,
  },
  {
    id: "filter-duotone",
    name: "Duotone Filter",
    category: "filters",
    description: "Two-tone color wash produced by stacking grayscale, sepia and hue rotation",
    tags: ["duotone", "two-tone", "monochrome", "color"],
    previewType: "background",
    cssCode: `/* Duotone Filter */
.roycss-filter-duotone {
  background: linear-gradient(135deg, oklch(0.975 0.005 258.32) 0%, oklch(0.851 0.03 259.59) 50%, oklch(0.877 0.084 336.72) 100%);
  filter: grayscale(1) sepia(1) hue-rotate(180deg) saturate(3) contrast(1.3);
}`,
  },
  {
    id: "filter-halftone",
    name: "Halftone Filter",
    category: "filters",
    description: "Comic-book halftone dot pattern layered over a vibrant gradient with contrast boost",
    tags: ["halftone", "dots", "comic", "print"],
    previewType: "background",
    cssCode: `/* Halftone Filter */
.roycss-filter-halftone {
  background:
    radial-gradient(circle, color-mix(in oklch, oklch(0 0 0) 85%, transparent) 1px, transparent 1.6px) 0 0 / 5px 5px,
    linear-gradient(135deg, oklch(0.712 0.181 22.84) 0%, oklch(0.776 0.112 188.54) 50%, oklch(0.922 0.143 97.78) 100%);
  filter: contrast(1.4) saturate(1.3);
}`,
  },
  {
    id: "filter-emboss",
    name: "Emboss Filter",
    category: "filters",
    description: "Emossed metal look via grayscale plus opposing drop-shadows for fake depth",
    tags: ["emboss", "metal", "relief", "3d"],
    previewType: "background",
    cssCode: `/* Emboss Filter */
.roycss-filter-emboss {
  background: linear-gradient(135deg, oklch(0.396 0.087 119.89) 0%, oklch(0.555 0.117 114.38) 50%, oklch(0.891 0.172 115.45) 100%);
  filter: grayscale(1) brightness(1.1) contrast(1.4)
    drop-shadow(2px 2px 1px color-mix(in oklch, oklch(1 0 89.88) 50%, transparent))
    drop-shadow(-2px -2px 1px color-mix(in oklch, oklch(0 0 0) 60%, transparent));
}`,
  },
  {
    id: "filter-blur-focus",
    name: "Blur To Focus",
    category: "filters",
    description: "Cinematic rack-focus animation that breathes from heavy blur to tack sharp",
    tags: ["blur", "focus", "rack", "animated"],
    previewType: "background",
    cssCode: `/* Blur To Focus */
.roycss-filter-blur-focus {
  background: linear-gradient(135deg, oklch(0.723 0.155 19.75) 0%, oklch(0.892 0.108 86.3) 50%, oklch(0.952 0.074 158.47) 100%);
  filter: blur(8px) saturate(1.2);
  animation: roy-filter-blur-focus 3s ease-in-out infinite;
}
@keyframes roy-filter-blur-focus {
  0%, 100% { filter: blur(8px) saturate(1.2); }
  50%      { filter: blur(0px) saturate(1.4); }
}`,
  },
  {
    id: "filter-grayscale-hover",
    name: "Grayscale Hover",
    category: "filters",
    description: "Starts desaturated and bursts back to full color with smooth transition on hover",
    tags: ["grayscale", "hover", "color", "transition"],
    previewType: "background",
    cssCode: `/* Grayscale Hover */
.roycss-filter-grayscale-hover {
  background: linear-gradient(135deg, oklch(0.667 0.217 13.9) 0%, oklch(0.56 0.235 268.65) 50%, oklch(0.667 0.217 13.9) 100%);
  filter: grayscale(1) brightness(0.85);
  transition: filter 0.5s ease;
}
.roycss-filter-grayscale-hover:hover {
  filter: grayscale(0) brightness(1) saturate(1.3);
}`,
  },
  {
    id: "filter-sepia",
    name: "Sepia Filter",
    category: "filters",
    description: "Strong sepia wash that turns any scene into an old photograph",
    tags: ["sepia", "old", "photo", "warm"],
    previewType: "background",
    cssCode: `/* Sepia Filter */
.roycss-filter-sepia {
  background: linear-gradient(135deg, oklch(0.779 0.149 226.02) 0%, oklch(0.909 0.165 146.32) 50%, oklch(0.977 0.044 100.28) 100%);
  filter: sepia(0.85) contrast(1.1) brightness(1.05);
}`,
  },
  {
    id: "filter-hue-rotate",
    name: "Hue Rotate Loop",
    category: "filters",
    description: "Continuously rotates hue through the entire color wheel on a vivid gradient",
    tags: ["hue", "rotate", "rainbow", "animated"],
    previewType: "background",
    cssCode: `/* Hue Rotate Loop */
.roycss-filter-hue-rotate {
  background: linear-gradient(135deg, oklch(0.641 0.257 8.07) 0%, oklch(0.546 0.248 295.88) 50%, oklch(0.637 0.195 259.51) 100%);
  animation: roy-filter-hue-rotate 4s linear infinite;
}
@keyframes roy-filter-hue-rotate {
  0%   { filter: hue-rotate(0deg) saturate(1.5); }
  100% { filter: hue-rotate(360deg) saturate(1.5); }
}`,
  },
  {
    id: "filter-invert",
    name: "Invert Filter",
    category: "filters",
    description: "Full color invert paired with a 180° hue-rotate for a believable negative",
    tags: ["invert", "negative", "invert-color", "dark"],
    previewType: "background",
    cssCode: `/* Invert Filter */
.roycss-filter-invert {
  background: linear-gradient(135deg, oklch(0.701 0.201 44.77) 0%, oklch(0.615 0.246 2.02) 50%, oklch(0.701 0.201 44.77) 100%);
  filter: invert(1) hue-rotate(180deg);
}`,
  },
  {
    id: "filter-saturate",
    name: "Hyper Saturate",
    category: "filters",
    description: "Pushes saturation to 3× for an over-the-top punchy, acid-bright look",
    tags: ["saturate", "vivid", "neon", "punchy"],
    previewType: "background",
    cssCode: `/* Hyper Saturate */
.roycss-filter-saturate {
  background: linear-gradient(135deg, oklch(0.583 0.161 23.52) 0%, oklch(0.308 0.116 325.06) 50%, oklch(0.583 0.161 23.52) 100%);
  filter: saturate(3.2) contrast(1.1);
}`,
  },
  {
    id: "filter-contrast",
    name: "Extreme Contrast",
    category: "filters",
    description: "Cranks contrast past 2× to crush shadows and highlights for graphic punch",
    tags: ["contrast", "graphic", "crush", "bold"],
    previewType: "background",
    cssCode: `/* Extreme Contrast */
.roycss-filter-contrast {
  background: linear-gradient(135deg, oklch(0.814 0.009 236.59) 0%, oklch(0.356 0.039 248.97) 50%, oklch(0.814 0.009 236.59) 100%);
  filter: contrast(2.4) brightness(1.05);
}`,
  },

  /* ═════════════════════════════════════════════════════════════
   *  FORMS (10) — inputs, toggles, validation states
   * ═════════════════════════════════════════════════════════════ */

  {
    id: "form-focus-glow",
    name: "Focus Glow Input",
    category: "forms",
    description: "Email-style input that lights up with an emerald halo and reveal-dot on focus/hover",
    tags: ["input", "focus", "glow", "email"],
    previewType: "card",
    cssCode: `/* Focus Glow Input */
.roycss-form-focus-glow {
  position: relative;
  inline-size: 170px;
  block-size: 40px;
  padding: 0 14px;
  background: color-mix(in oklch, oklch(1 0 89.88) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 18%, transparent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 55%, transparent);
  transition: all 0.3s ease;
}
.roycss-form-focus-glow > span { display: none; }
.roycss-form-focus-glow::before { content: "you@example.com"; }
.roycss-form-focus-glow::after {
  content: "";
  position: absolute;
  inset-inline-end: 14px;
  inset-block-start: 50%;
  inline-size: 12px;
  block-size: 12px;
  margin-block-start: -6px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.773 0.153 163.22));
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.4);
  transition: all 0.3s ease;
}
.roycss-form-focus-glow:hover {
  border-color: oklch(0.696 0.149 162.48);
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent);
  color: oklch(0.979 0.021 166.11);
  box-shadow: 0 0 0 3px color-mix(in oklch, oklch(0.696 0.149 162.48) 18%, transparent), 0 0 24px color-mix(in oklch, oklch(0.696 0.149 162.48) 35%, transparent);
}
.roycss-form-focus-glow:hover::after {
  opacity: 1;
  transform: scale(1);
}`,
  },
  {
    id: "form-label-float",
    name: "Floating Label",
    category: "forms",
    description: "Label that sits centered like a placeholder, then floats up small and green on focus",
    tags: ["label", "float", "input", "material"],
    previewType: "card",
    cssCode: `/* Floating Label */
.roycss-form-label-float {
  position: relative;
  inline-size: 170px;
  block-size: 48px;
  background: color-mix(in oklch, oklch(1 0 89.88) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 18%, transparent);
  border-radius: 10px;
  transition: all 0.3s ease;
}
.roycss-form-label-float > span { display: none; }
.roycss-form-label-float::before {
  content: "Full name";
  position: absolute;
  inset-inline-start: 14px;
  inset-block-start: 50%;
  transform: translateY(-50%);
  font: 13px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 50%, transparent);
  transition: all 0.25s ease;
  pointer-events: none;
}
.roycss-form-label-float::after {
  content: "Roy Wanyoike";
  position: absolute;
  inset-inline-start: 14px;
  inset-block-start: 24px;
  font: 12px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 85%, transparent);
}
.roycss-form-label-float:hover {
  border-color: oklch(0.696 0.149 162.48);
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 5%, transparent);
}
.roycss-form-label-float:hover::before {
  inset-block-start: 9px;
  font-size: 9px;
  color: oklch(0.696 0.149 162.48);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}`,
  },
  {
    id: "form-placeholder-shimmer",
    name: "Shimmer Placeholder",
    category: "forms",
    description: "Placeholder text with a sweeping highlight that flows left-to-right forever",
    tags: ["placeholder", "shimmer", "input", "animated"],
    previewType: "card",
    cssCode: `/* Shimmer Placeholder */
.roycss-form-placeholder-shimmer {
  position: relative;
  inline-size: 180px;
  block-size: 40px;
  padding: 0 14px;
  background: color-mix(in oklch, oklch(1 0 89.88) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 18%, transparent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  overflow: hidden;
}
.roycss-form-placeholder-shimmer > span { display: none; }
.roycss-form-placeholder-shimmer::before {
  content: "Start typing...";
  background: linear-gradient(90deg,
    color-mix(in oklch, oklch(1 0 89.88) 30%, transparent) 0%,
    color-mix(in oklch, oklch(1 0 89.88) 95%, transparent) 50%,
    color-mix(in oklch, oklch(1 0 89.88) 30%, transparent) 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: roy-form-shimmer 2s linear infinite;
}
@keyframes roy-form-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`,
  },
  {
    id: "form-error-shake",
    name: "Error Shake",
    category: "forms",
    description: "Red-bordered invalid input that jitters side-to-side with a warning glyph",
    tags: ["error", "shake", "invalid", "validation"],
    previewType: "box",
    cssCode: `/* Error Shake */
.roycss-form-error-shake {
  position: relative;
  inline-size: 160px;
  block-size: 40px;
  padding: 0 14px;
  background: color-mix(in oklch, oklch(0.637 0.208 25.33) 8%, transparent);
  border: 1px solid oklch(0.637 0.208 25.33);
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  color: oklch(0.808 0.103 19.57);
  animation: roy-form-error-shake 0.5s ease-in-out infinite;
}
.roycss-form-error-shake > div { display: none; }
.roycss-form-error-shake::before { content: "⚠  Invalid email"; }
@keyframes roy-form-error-shake {
  0%, 100% { transform: translateX(0); }
  20%      { transform: translateX(-5px); }
  40%      { transform: translateX(5px); }
  60%      { transform: translateX(-3px); }
  80%      { transform: translateX(3px); }
}`,
  },
  {
    id: "form-success-check",
    name: "Success Checkmark",
    category: "forms",
    description: "Green validated field with an animated checkmark that pops in with a spring",
    tags: ["success", "checkmark", "valid", "animation"],
    previewType: "box",
    cssCode: `/* Success Checkmark */
.roycss-form-success-check {
  position: relative;
  inline-size: 160px;
  block-size: 40px;
  padding: 0 14px 0 38px;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  border: 1px solid oklch(0.696 0.149 162.48);
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  color: oklch(0.845 0.13 164.98);
}
.roycss-form-success-check > div { display: none; }
.roycss-form-success-check::before { content: "Submitted!"; }
.roycss-form-success-check::after {
  content: "";
  position: absolute;
  inset-inline-start: 14px;
  inset-block-start: 50%;
  inline-size: 16px;
  block-size: 8px;
  margin-block-start: -4px;
  border-inline-start: 2px solid oklch(0.696 0.149 162.48);
  border-block-end: 2px solid oklch(0.696 0.149 162.48);
  transform: rotate(-45deg) scale(0);
  animation: roy-form-check 0.6s 0.2s ease-out forwards;
}
@keyframes roy-form-check {
  0%   { transform: rotate(-45deg) scale(0); }
  60%  { transform: rotate(-45deg) scale(1.4); }
  100% { transform: rotate(-45deg) scale(1); }
}`,
  },
  {
    id: "form-toggle-switch",
    name: "Toggle Switch",
    category: "forms",
    description: "iOS-style toggle with a spring-loaded knob that slides and turns green when on",
    tags: ["toggle", "switch", "ios", "knob"],
    previewType: "box",
    cssCode: `/* Toggle Switch */
.roycss-form-toggle-switch {
  position: relative;
  inline-size: 54px;
  block-size: 28px;
  background: color-mix(in oklch, oklch(1 0 89.88) 8%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 20%, transparent);
  border-radius: 14px;
  transition: background 0.3s ease, border-color 0.3s ease;
}
.roycss-form-toggle-switch > div {
  inline-size: 22px !important;
  block-size: 22px !important;
  margin: 0 !important;
  background: oklch(1 0 89.88) !important;
  border-radius: 50% !important;
  position: absolute;
  inset-block-start: 2px;
  inset-inline-start: 2px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}
.roycss-form-toggle-switch:hover {
  background: oklch(0.696 0.149 162.48);
  border-color: oklch(0.696 0.149 162.48);
}
.roycss-form-toggle-switch:hover > div {
  transform: translateX(26px);
}`,
  },
  {
    id: "form-checkbox-custom",
    name: "Custom Checkbox",
    category: "forms",
    description: "Squared checkbox border that springs a checkmark into view on render",
    tags: ["checkbox", "check", "custom", "form"],
    previewType: "box",
    cssCode: `/* Custom Checkbox */
.roycss-form-checkbox-custom {
  position: relative;
  inline-size: 32px;
  block-size: 32px;
  background: transparent;
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-form-checkbox-custom > div { display: none; }
.roycss-form-checkbox-custom::after {
  content: "";
  inline-size: 14px;
  block-size: 7px;
  border-inline-start: 2px solid oklch(0.696 0.149 162.48);
  border-block-end: 2px solid oklch(0.696 0.149 162.48);
  transform: rotate(-45deg) translate(1px, -1px) scale(0);
  animation: roy-form-checkbox 0.5s 0.2s ease-out forwards;
}
@keyframes roy-form-checkbox {
  0%   { transform: rotate(-45deg) translate(1px, -1px) scale(0); }
  60%  { transform: rotate(-45deg) translate(1px, -1px) scale(1.3); }
  100% { transform: rotate(-45deg) translate(1px, -1px) scale(1); }
}`,
  },
  {
    id: "form-radio-custom",
    name: "Custom Radio",
    category: "forms",
    description: "Circular radio with an inner dot that pulses softly to draw the eye",
    tags: ["radio", "circle", "custom", "form"],
    previewType: "box",
    cssCode: `/* Custom Radio */
.roycss-form-radio-custom {
  position: relative;
  inline-size: 32px;
  block-size: 32px;
  background: transparent;
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-form-radio-custom > div { display: none; }
.roycss-form-radio-custom::after {
  content: "";
  inline-size: 14px;
  block-size: 14px;
  background: oklch(0.696 0.149 162.48);
  border-radius: 50%;
  transform: scale(0.4);
  animation: roy-form-radio 0.9s ease-in-out infinite alternate;
}
@keyframes roy-form-radio {
  0%   { transform: scale(0.5); box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent); }
  100% { transform: scale(1); box-shadow: 0 0 0 4px color-mix(in oklch, oklch(0.696 0.149 162.48) 0%, transparent); }
}`,
  },
  {
    id: "form-search-expand",
    name: "Search Expand",
    category: "forms",
    description: "Compact search icon that smoothly widens into a full search field on hover",
    tags: ["search", "expand", "input", "icon"],
    previewType: "card",
    cssCode: `/* Search Expand */
.roycss-form-search-expand {
  position: relative;
  inline-size: 56px;
  block-size: 40px;
  background: color-mix(in oklch, oklch(1 0 89.88) 5%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 18%, transparent);
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  font: 12px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.4s ease;
}
.roycss-form-search-expand > span { display: none; }
.roycss-form-search-expand::before {
  content: "";
  inline-size: 14px;
  block-size: 14px;
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 6px 6px 0 -1px oklch(0.696 0.149 162.48);
  transform: rotate(-45deg);
}
.roycss-form-search-expand::after {
  content: "Search docs...";
  margin-inline-start: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s 0.2s ease;
}
.roycss-form-search-expand:hover {
  inline-size: 200px;
  border-color: oklch(0.696 0.149 162.48);
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 5%, transparent);
}
.roycss-form-search-expand:hover::after { opacity: 1; }`,
  },
  {
    id: "form-underline-draw",
    name: "Underline Draw",
    category: "forms",
    description: "Borderless input with a gradient underline that draws across on focus",
    tags: ["underline", "draw", "input", "line"],
    previewType: "card",
    cssCode: `/* Underline Draw */
.roycss-form-underline-draw {
  position: relative;
  inline-size: 180px;
  block-size: 40px;
  padding: 0 4px;
  background: transparent;
  border: none;
  border-block-end: 2px solid color-mix(in oklch, oklch(1 0 89.88) 18%, transparent);
  display: flex;
  align-items: center;
  font: 13px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 70%, transparent);
}
.roycss-form-underline-draw > span { display: none; }
.roycss-form-underline-draw::before { content: "@username"; }
.roycss-form-underline-draw::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-block-end: -2px;
  inline-size: 0;
  block-size: 2px;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.773 0.153 163.22), oklch(0.696 0.149 162.48));
  transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.roycss-form-underline-draw:hover {
  color: oklch(0.979 0.021 166.11);
}
.roycss-form-underline-draw:hover::after { inline-size: 100%; }`,
  },

  /* ═════════════════════════════════════════════════════════════
   *  NAVIGATION (10) — menus, tabs, breadcrumbs, pagination
   * ═════════════════════════════════════════════════════════════ */

  {
    id: "nav-menu-slide",
    name: "Menu Slide",
    category: "navigation",
    description: "Menu row that slides up and out while a green arrow-led replacement slides in from below",
    tags: ["menu", "slide", "hover", "nav"],
    previewType: "card",
    cssCode: `/* Menu Slide */
.roycss-nav-menu-slide {
  position: relative;
  inline-size: 220px;
  block-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, oklch(1 0 89.88) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 10px;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 70%, transparent);
  overflow: hidden;
  letter-spacing: 0.15em;
}
.roycss-nav-menu-slide > span { display: none; }
.roycss-nav-menu-slide::before {
  content: "HOME   ABOUT   WORK   BLOG";
  transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1);
}
.roycss-nav-menu-slide::after {
  content: "→ HOME   ABOUT   WORK   BLOG";
  position: absolute;
  inset-inline-start: 0; inset-inline-end: 0;
  inset-block-start: 100%;
  text-align: center;
  color: oklch(0.696 0.149 162.48);
  transition: top 0.4s cubic-bezier(0.65, 0, 0.35, 1);
}
.roycss-nav-menu-slide:hover::before { transform: translateY(-100%); }
.roycss-nav-menu-slide:hover::after  { inset-block-start: 50%; transform: translateY(-50%); }`,
  },
  {
    id: "nav-menu-fade",
    name: "Menu Fade Scale",
    category: "navigation",
    description: "Menu crossfades and scales out while a highlighted copy scales in",
    tags: ["menu", "fade", "scale", "nav"],
    previewType: "card",
    cssCode: `/* Menu Fade Scale */
.roycss-nav-menu-fade {
  position: relative;
  inline-size: 220px;
  block-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, oklch(1 0 89.88) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 10px;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 70%, transparent);
  overflow: hidden;
  letter-spacing: 0.15em;
}
.roycss-nav-menu-fade > span { display: none; }
.roycss-nav-menu-fade::before {
  content: "DASHBOARD   PROJECTS   TEAM";
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.roycss-nav-menu-fade::after {
  content: "▸ DASHBOARD   PROJECTS   TEAM";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.696 0.149 162.48);
  opacity: 0;
  transform: scale(0.92);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.roycss-nav-menu-fade:hover::before {
  opacity: 0;
  transform: scale(1.1);
}
.roycss-nav-menu-fade:hover::after {
  opacity: 1;
  transform: scale(1);
}`,
  },
  {
    id: "nav-menu-scale",
    name: "Menu Scale",
    category: "navigation",
    description: "Whole menu scales up slightly with letter-spacing widening and an inner glow ring",
    tags: ["menu", "scale", "glow", "nav"],
    previewType: "card",
    cssCode: `/* Menu Scale */
.roycss-nav-menu-scale {
  position: relative;
  inline-size: 220px;
  block-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, oklch(1 0 89.88) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 10%, transparent);
  border-radius: 10px;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 70%, transparent);
  letter-spacing: 0.15em;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-nav-menu-scale > span { display: none; }
.roycss-nav-menu-scale::before { content: "HOME  ABOUT  SERVICES  CONTACT"; }
.roycss-nav-menu-scale::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid oklch(0.696 0.149 162.48);
  border-radius: 10px;
  opacity: 0;
  transform: scale(0.94);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-nav-menu-scale:hover {
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 8%, transparent);
  color: oklch(0.696 0.149 162.48);
  transform: scale(1.06);
  letter-spacing: 0.22em;
}
.roycss-nav-menu-scale:hover::after {
  opacity: 1;
  transform: scale(1);
  box-shadow: 0 0 22px color-mix(in oklch, oklch(0.696 0.149 162.48) 35%, transparent);
}`,
  },
  {
    id: "nav-accordion",
    name: "Accordion Menu",
    category: "navigation",
    description: "Collapsed menu header that expands downward to reveal sub-items on hover",
    tags: ["accordion", "expand", "menu", "dropdown"],
    previewType: "card",
    cssCode: `/* Accordion Menu */
.roycss-nav-accordion {
  position: relative;
  inline-size: 180px;
  block-size: 34px;
  background: color-mix(in oklch, oklch(1 0 89.88) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 12%, transparent);
  border-radius: 8px;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 80%, transparent);
  overflow: hidden;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.3s ease;
}
.roycss-nav-accordion > span { display: none; }
.roycss-nav-accordion::before {
  content: "▸  Menu Item";
  display: block;
  padding: 11px 14px;
  color: color-mix(in oklch, oklch(1 0 89.88) 80%, transparent);
  transition: color 0.3s ease;
}
.roycss-nav-accordion::after {
  content: "Sub 1  ·  Sub 2  ·  Sub 3";
  display: block;
  padding: 0 14px 10px 28px;
  color: color-mix(in oklch, oklch(0.696 0.149 162.48) 75%, transparent);
  font-size: 10px;
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.roycss-nav-accordion:hover {
  block-size: 70px;
  border-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
}
.roycss-nav-accordion:hover::before {
  content: "▾  Menu Item";
  color: oklch(0.696 0.149 162.48);
}
.roycss-nav-accordion:hover::after {
  opacity: 1;
  transform: translateY(0);
}`,
  },
  {
    id: "nav-tabs-underline",
    name: "Tabs Underline",
    category: "navigation",
    description: "Three-tab row with a green gradient underline that slides between them on a loop",
    tags: ["tabs", "underline", "slider", "nav"],
    previewType: "card",
    cssCode: `/* Tabs Underline */
.roycss-nav-tabs-underline {
  position: relative;
  inline-size: 200px;
  block-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
  letter-spacing: 0.12em;
}
.roycss-nav-tabs-underline > span { display: none; }
.roycss-nav-tabs-underline::before { content: "TAB 1     TAB 2     TAB 3"; }
.roycss-nav-tabs-underline::after {
  content: "";
  position: absolute;
  inset-inline-start: 24px;
  inset-block-end: 0;
  inline-size: 40px;
  block-size: 2px;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.773 0.153 163.22));
  border-radius: 1px;
  animation: roy-nav-tabs-underline 3s ease-in-out infinite;
}
@keyframes roy-nav-tabs-underline {
  0%, 100% { inset-inline-start: 24px; }
  33%      { inset-inline-start: 80px; }
  66%      { inset-inline-start: 136px; }
}`,
  },
  {
    id: "nav-breadcrumb",
    name: "Breadcrumb Path",
    category: "navigation",
    description: "Chevron-separated breadcrumb with a moving accent underline tracking the trail",
    tags: ["breadcrumb", "path", "chevron", "nav"],
    previewType: "card",
    cssCode: `/* Breadcrumb Path */
.roycss-nav-breadcrumb {
  position: relative;
  inline-size: 240px;
  block-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 11px/1 system-ui, sans-serif;
  letter-spacing: 0.05em;
}
.roycss-nav-breadcrumb > span { display: none; }
.roycss-nav-breadcrumb::before {
  content: "Home  ›  Shop  ›  Electronics  ›  Phones";
  color: color-mix(in oklch, oklch(1 0 89.88) 50%, transparent);
}
.roycss-nav-breadcrumb::after {
  content: "";
  position: absolute;
  inset-block-end: 2px;
  inset-inline-start: 50%;
  inline-size: 40px;
  block-size: 2px;
  background: oklch(0.696 0.149 162.48);
  border-radius: 1px;
  transform: translateX(-50%);
  animation: roy-nav-breadcrumb 3s ease-in-out infinite;
}
@keyframes roy-nav-breadcrumb {
  0%, 100% { transform: translateX(-180%); }
  50%      { transform: translateX(80%); }
}`,
  },
  {
    id: "nav-pagination",
    name: "Pagination Pulse",
    category: "navigation",
    description: "Numbered pagination with a ring marker that steps through each page on a loop",
    tags: ["pagination", "pages", "ring", "nav"],
    previewType: "card",
    cssCode: `/* Pagination Pulse */
.roycss-nav-pagination {
  position: relative;
  inline-size: 200px;
  block-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 60%, transparent);
  letter-spacing: 0.3em;
}
.roycss-nav-pagination > span { display: none; }
.roycss-nav-pagination::before { content: "‹   1   2   3   4   5   ›"; }
.roycss-nav-pagination::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 18px;
  block-size: 18px;
  margin: -9px 0 0 -9px;
  border: 1.5px solid oklch(0.696 0.149 162.48);
  border-radius: 50%;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
  animation: roy-nav-pagination 3.5s steps(5, end) infinite;
}
@keyframes roy-nav-pagination {
  0%   { transform: translateX(-44px); }
  20%  { transform: translateX(-22px); }
  40%  { transform: translateX(0); }
  60%  { transform: translateX(22px); }
  80%, 100% { transform: translateX(44px); }
}`,
  },
  {
    id: "nav-stepper",
    name: "Stepper Progress",
    category: "navigation",
    description: "Four-step progress indicator with a glowing dot traversing the connecting line",
    tags: ["stepper", "steps", "progress", "nav"],
    previewType: "card",
    cssCode: `/* Stepper Progress */
.roycss-nav-stepper {
  position: relative;
  inline-size: 220px;
  block-size: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-nav-stepper > span { display: none; }
.roycss-nav-stepper::before {
  content: "";
  inline-size: 180px;
  block-size: 4px;
  border-radius: 2px;
  background:
    linear-gradient(90deg, oklch(0.696 0.149 162.48) 0 66%, color-mix(in oklch, oklch(1 0 89.88) 20%, transparent) 66% 100%),
    repeating-linear-gradient(90deg,
      transparent 0 42px,
      color-mix(in oklch, oklch(1 0 89.88) 60%, transparent) 42px 46px,
      transparent 46px 88px,
      color-mix(in oklch, oklch(1 0 89.88) 60%, transparent) 88px 92px,
      transparent 92px 134px,
      color-mix(in oklch, oklch(1 0 89.88) 60%, transparent) 134px 138px,
      transparent 138px 180px);
}
.roycss-nav-stepper::after {
  content: "Step 3 of 4";
  position: absolute;
  inset-block-end: 4px;
  font: 10px/1 system-ui, sans-serif;
  color: oklch(0.696 0.149 162.48);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}`,
  },
  {
    id: "nav-progress-indicator",
    name: "Progress Dots",
    category: "navigation",
    description: "Carousel-style dots where each dot lights up green in sequence",
    tags: ["dots", "carousel", "progress", "nav"],
    previewType: "box",
    cssCode: `/* Progress Dots */
.roycss-nav-progress-indicator {
  position: relative;
  inline-size: 120px;
  block-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.roycss-nav-progress-indicator > div { display: none; }
.roycss-nav-progress-indicator::before {
  content: "";
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  background: color-mix(in oklch, oklch(1 0 89.88) 25%, transparent);
  box-shadow:
    16px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    32px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    48px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    64px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent);
  animation: roy-nav-progress 1.6s steps(5, end) infinite;
}
@keyframes roy-nav-progress {
  0%   { background: oklch(0.696 0.149 162.48); box-shadow:
    16px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    32px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    48px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    64px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent); }
  20%  { background: color-mix(in oklch, oklch(1 0 89.88) 25%, transparent); box-shadow:
    16px 0 0 oklch(0.696 0.149 162.48),
    32px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    48px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    64px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent); }
  40%  { background: color-mix(in oklch, oklch(1 0 89.88) 25%, transparent); box-shadow:
    16px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    32px 0 0 oklch(0.696 0.149 162.48),
    48px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    64px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent); }
  60%  { background: color-mix(in oklch, oklch(1 0 89.88) 25%, transparent); box-shadow:
    16px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    32px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    48px 0 0 oklch(0.696 0.149 162.48),
    64px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent); }
  80%, 100% { background: color-mix(in oklch, oklch(1 0 89.88) 25%, transparent); box-shadow:
    16px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    32px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    48px 0 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent),
    64px 0 0 oklch(0.696 0.149 162.48); }
}`,
  },
  {
    id: "nav-dropdown",
    name: "Dropdown Reveal",
    category: "navigation",
    description: "Trigger that expands a panel of menu items downward with a stagger on hover",
    tags: ["dropdown", "menu", "reveal", "nav"],
    previewType: "card",
    cssCode: `/* Dropdown Reveal */
.roycss-nav-dropdown {
  position: relative;
  inline-size: 180px;
  block-size: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: color-mix(in oklch, oklch(1 0 89.88) 4%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 12%, transparent);
  border-radius: 8px;
  font: 11px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 80%, transparent);
  overflow: hidden;
  transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.3s ease;
}
.roycss-nav-dropdown > span { display: none; }
.roycss-nav-dropdown::before {
  content: "Select option    ▾";
  white-space: nowrap;
}
.roycss-nav-dropdown::after {
  content: "↳ First choice\\A ↳ Second choice\\A ↳ Third choice";
  white-space: pre;
  position: absolute;
  inset-block-start: 34px;
  inset-inline-start: 0;
  inset-inline-end: 0;
  padding: 6px 14px 10px;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 8%, transparent);
  color: oklch(0.845 0.13 164.98);
  font-size: 10px;
  line-block-size: 1.7;
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.roycss-nav-dropdown:hover {
  block-size: 86px;
  border-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
}
.roycss-nav-dropdown:hover::before { color: oklch(0.696 0.149 162.48); }
.roycss-nav-dropdown:hover::after {
  opacity: 1;
  transform: translateY(0);
}`,
  },

  /* ═════════════════════════════════════════════════════════════
   *  MISC (15) — particles, atmospheres, FX overlays
   * ═════════════════════════════════════════════════════════════ */

  {
    id: "misc-confetti",
    name: "Confetti Rain",
    category: "misc",
    description: "Falling confetti dots in five colors drifting down at different speeds over a dark base",
    tags: ["confetti", "party", "celebration", "particles"],
    previewType: "background",
    cssCode: `/* Confetti Rain */
.roycss-misc-confetti {
  background:
    radial-gradient(circle at 15% 0%, oklch(0.712 0.181 22.84) 0 3px, transparent 4px) 0 0 / 40px 40px,
    radial-gradient(circle at 45% 0%, oklch(0.864 0.143 84.36) 0 3px, transparent 4px) 0 0 / 55px 55px,
    radial-gradient(circle at 75% 0%, oklch(0.827 0.128 215.58) 0 3px, transparent 4px) 0 0 / 45px 45px,
    radial-gradient(circle at 30% 0%, oklch(0.767 0.15 168.19) 0 3px, transparent 4px) 0 0 / 60px 60px,
    radial-gradient(circle at 90% 0%, oklch(0.826 0.154 331.46) 0 3px, transparent 4px) 0 0 / 50px 50px,
    linear-gradient(135deg, oklch(0.228 0.038 282.93), oklch(0.254 0.057 266.71));
  background-repeat: repeat;
  animation: roy-misc-confetti 2.5s linear infinite;
}
@keyframes roy-misc-confetti {
  from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0; }
  to   { background-position: 0 40px, 0 55px, 0 45px, 0 60px, 0 50px, 0 0; }
}`,
  },
  {
    id: "misc-snow",
    name: "Snowfall",
    category: "misc",
    description: "White snowflakes of varying sizes drifting downward with subtle horizontal sway",
    tags: ["snow", "winter", "particles", "cold"],
    previewType: "background",
    cssCode: `/* Snowfall */
.roycss-misc-snow {
  background:
    radial-gradient(circle at 10% 0%, oklch(1 0 89.88) 0 2px, transparent 3px) 0 0 / 30px 30px,
    radial-gradient(circle at 60% 0%, oklch(1 0 89.88) 0 1.5px, transparent 2px) 0 0 / 45px 45px,
    radial-gradient(circle at 80% 0%, oklch(1 0 89.88) 0 2.5px, transparent 3px) 0 0 / 35px 35px,
    radial-gradient(circle at 30% 0%, color-mix(in oklch, oklch(1 0 89.88) 70%, transparent) 0 1px, transparent 2px) 0 0 / 25px 25px,
    linear-gradient(180deg, oklch(0.232 0.026 226.41), oklch(0.332 0.036 222.19), oklch(0.421 0.052 228.22));
  background-repeat: repeat;
  animation: roy-misc-snow 3s linear infinite;
}
@keyframes roy-misc-snow {
  from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0; }
  to   { background-position: 5px 30px, -3px 45px, 2px 35px, -2px 25px, 0 0; }
}`,
  },
  {
    id: "misc-rain",
    name: "Rain Streaks",
    category: "misc",
    description: "Diagonal light-blue rain streaks falling fast over a stormy night sky",
    tags: ["rain", "storm", "weather", "particles"],
    previewType: "background",
    cssCode: `/* Rain Streaks */
.roycss-misc-rain {
  background:
    linear-gradient(105deg, transparent 0 48%, color-mix(in oklch, oklch(0.809 0.048 258.37) 60%, transparent) 48% 50%, transparent 50% 100%) 0 0 / 15px 30px,
    linear-gradient(105deg, transparent 0 49%, color-mix(in oklch, oklch(0.809 0.048 258.37) 35%, transparent) 49% 50%, transparent 50% 100%) 0 0 / 25px 40px,
    linear-gradient(180deg, oklch(0.279 0.037 249.26), oklch(0.356 0.039 248.97));
  background-repeat: repeat;
  animation: roy-misc-rain 0.6s linear infinite;
}
@keyframes roy-misc-rain {
  from { background-position: 0 0, 0 0, 0 0; }
  to   { background-position: 5px 30px, 7px 40px, 0 0; }
}`,
  },
  {
    id: "misc-bubbles",
    name: "Rising Bubbles",
    category: "misc",
    description: "Translucent bubbles floating upward through a teal aquatic gradient",
    tags: ["bubbles", "water", "float", "particles"],
    previewType: "background",
    cssCode: `/* Rising Bubbles */
.roycss-misc-bubbles {
  background:
    radial-gradient(circle at 20% 100%, color-mix(in oklch, oklch(1 0 89.88) 70%, transparent) 0 4px, transparent 5px) 0 0 / 60px 60px,
    radial-gradient(circle at 50% 100%, color-mix(in oklch, oklch(1 0 89.88) 50%, transparent) 0 6px, transparent 7px) 0 0 / 80px 80px,
    radial-gradient(circle at 80% 100%, color-mix(in oklch, oklch(1 0 89.88) 60%, transparent) 0 3px, transparent 4px) 0 0 / 50px 50px,
    linear-gradient(180deg, oklch(0.616 0.104 219.93), oklch(0.82 0.102 214.8));
  background-repeat: repeat;
  animation: roy-misc-bubbles 4s linear infinite;
}
@keyframes roy-misc-bubbles {
  from { background-position: 0 0, 0 0, 0 0, 0 0; }
  to   { background-position: 0 -60px, 0 -80px, 0 -50px, 0 0; }
}`,
  },
  {
    id: "misc-fireflies",
    name: "Fireflies",
    category: "misc",
    description: "Glowing yellow-green fireflies drifting and pulsing in brightness over a dark forest",
    tags: ["fireflies", "glow", "night", "particles"],
    previewType: "background",
    cssCode: `/* Fireflies */
.roycss-misc-fireflies {
  background:
    radial-gradient(circle at 20% 30%, color-mix(in oklch, oklch(0.943 0.162 124.78) 90%, transparent) 0 2px, transparent 5px) 0 0 / 100px 100px,
    radial-gradient(circle at 70% 60%, color-mix(in oklch, oklch(0.943 0.162 124.78) 70%, transparent) 0 2.5px, transparent 6px) 0 0 / 130px 130px,
    radial-gradient(circle at 40% 80%, color-mix(in oklch, oklch(0.943 0.162 124.78) 80%, transparent) 0 1.5px, transparent 4px) 0 0 / 90px 90px,
    linear-gradient(180deg, oklch(0.179 0.057 283.68), oklch(0.327 0.096 283.81), oklch(0.274 0.048 282.79));
  background-repeat: repeat;
  animation: roy-misc-fireflies 5s ease-in-out infinite alternate;
}
@keyframes roy-misc-fireflies {
  0%   { background-position: 0 0, 0 0, 0 0, 0 0; filter: brightness(0.6); }
  50%  { filter: brightness(1.5); }
  100% { background-position: 20px -15px, -25px 10px, 15px 20px, 0 0; filter: brightness(0.85); }
}`,
  },
  {
    id: "misc-sparkles",
    name: "Twinkling Sparkles",
    category: "misc",
    description: "Star-like sparkles scattered across a deep night sky, twinkling in unison",
    tags: ["sparkles", "stars", "twinkle", "particles"],
    previewType: "background",
    cssCode: `/* Twinkling Sparkles */
.roycss-misc-sparkles {
  background:
    radial-gradient(circle at 15% 25%, oklch(1 0 89.88) 0 1px, transparent 2px) 0 0 / 50px 50px,
    radial-gradient(circle at 65% 75%, oklch(1 0 89.88) 0 1.5px, transparent 2.5px) 0 0 / 70px 70px,
    radial-gradient(circle at 85% 15%, oklch(1 0 89.88) 0 1px, transparent 2px) 0 0 / 40px 40px,
    radial-gradient(circle at 35% 85%, oklch(1 0 89.88) 0 2px, transparent 3px) 0 0 / 60px 60px,
    linear-gradient(135deg, oklch(0.163 0.051 279.14), oklch(0.255 0.093 277.48));
  background-repeat: repeat;
  animation: roy-misc-sparkles 1.8s ease-in-out infinite alternate;
}
@keyframes roy-misc-sparkles {
  0%   { opacity: 0.4; filter: brightness(0.8); }
  100% { opacity: 1; filter: brightness(1.6); }
}`,
  },
  {
    id: "misc-fireworks",
    name: "Fireworks Burst",
    category: "misc",
    description: "Two exploding firework bursts that scale out and fade repeatedly in red and gold",
    tags: ["fireworks", "explosion", "celebration", "bursts"],
    previewType: "background",
    cssCode: `/* Fireworks Burst */
.roycss-misc-fireworks {
  position: relative;
  background: linear-gradient(180deg, oklch(0.163 0.051 279.14), oklch(0.255 0.093 277.48));
  overflow: hidden;
}
.roycss-misc-fireworks::before {
  content: "";
  position: absolute;
  inset-block-start: 30%;
  inset-inline-start: 30%;
  inline-size: 4px;
  block-size: 4px;
  border-radius: 50%;
  box-shadow:
    0 0 0 2px oklch(0.712 0.181 22.84),
    0 -20px 0 -1px oklch(0.712 0.181 22.84), 0 20px 0 -1px oklch(0.712 0.181 22.84),
    -20px 0 0 -1px oklch(0.712 0.181 22.84), 20px 0 0 -1px oklch(0.712 0.181 22.84),
    -14px -14px 0 -1px oklch(0.712 0.181 22.84), 14px 14px 0 -1px oklch(0.712 0.181 22.84),
    -14px 14px 0 -1px oklch(0.712 0.181 22.84), 14px -14px 0 -1px oklch(0.712 0.181 22.84);
  animation: roy-misc-firework1 2s ease-out infinite;
}
.roycss-misc-fireworks::after {
  content: "";
  position: absolute;
  inset-block-start: 60%;
  inset-inline-start: 70%;
  inline-size: 4px;
  block-size: 4px;
  border-radius: 50%;
  box-shadow:
    0 0 0 2px oklch(0.864 0.143 84.36),
    0 -16px 0 -1px oklch(0.864 0.143 84.36), 0 16px 0 -1px oklch(0.864 0.143 84.36),
    -16px 0 0 -1px oklch(0.864 0.143 84.36), 16px 0 0 -1px oklch(0.864 0.143 84.36),
    -11px -11px 0 -1px oklch(0.864 0.143 84.36), 11px 11px 0 -1px oklch(0.864 0.143 84.36),
    -11px 11px 0 -1px oklch(0.864 0.143 84.36), 11px -11px 0 -1px oklch(0.864 0.143 84.36);
  animation: roy-misc-firework2 2s ease-out 1s infinite;
}
@keyframes roy-misc-firework1 {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(2.6); opacity: 0; }
}
@keyframes roy-misc-firework2 {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(2.6); opacity: 0; }
}`,
  },
  {
    id: "misc-ripple-click",
    name: "Ripple Click",
    category: "misc",
    description: "Material-style ripple that explodes outward from center on hover",
    tags: ["ripple", "click", "material", "wave"],
    previewType: "box",
    cssCode: `/* Ripple Click */
.roycss-misc-ripple-click {
  position: relative;
  inline-size: 80px;
  block-size: 80px;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
}
.roycss-misc-ripple-click > div { display: none; }
.roycss-misc-ripple-click::before {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 8px;
  block-size: 8px;
  margin: -4px 0 0 -4px;
  background: oklch(0.696 0.149 162.48);
  border-radius: 50%;
  transform: scale(0);
}
.roycss-misc-ripple-click::after {
  content: "Click";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
  font: 11px/1 system-ui, sans-serif;
  color: oklch(0.696 0.149 162.48);
  z-index: 1;
}
.roycss-misc-ripple-click:hover::before {
  animation: roy-misc-ripple 0.8s ease-out;
}
@keyframes roy-misc-ripple {
  0%   { transform: scale(0); opacity: 1; }
  100% { transform: scale(12); opacity: 0; }
}`,
  },
  {
    id: "misc-wave",
    name: "Wave Lines",
    category: "misc",
    description: "Horizontal wave bands drifting sideways to mimic an audio equalizer or ocean surface",
    tags: ["wave", "audio", "equalizer", "motion"],
    previewType: "background",
    cssCode: `/* Wave Lines */
.roycss-misc-wave {
  background:
    linear-gradient(90deg, transparent 0%, color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent) 50%, transparent 100%) 0 30% / 40px 4px repeat-x,
    linear-gradient(90deg, transparent 0%, color-mix(in oklch, oklch(0.704 0.123 182.5) 50%, transparent) 50%, transparent 100%) 0 50% / 30px 3px repeat-x,
    linear-gradient(90deg, transparent 0%, color-mix(in oklch, oklch(0.773 0.153 163.22) 50%, transparent) 50%, transparent 100%) 0 70% / 50px 4px repeat-x,
    linear-gradient(180deg, oklch(0.265 0.051 233.41), oklch(0.332 0.065 233.43));
  animation: roy-misc-wave 1.5s linear infinite;
}
@keyframes roy-misc-wave {
  from { background-position: 0 30%, 0 50%, 0 70%, 0 0; }
  to   { background-position: 40px 30%, -30px 50%, 50px 70%, 0 0; }
}`,
  },
  {
    id: "misc-pulse-ring-expand",
    name: "Pulse Ring Expand",
    category: "misc",
    description: "Central dot emitting concentric rings that scale outward and fade like sonar pings",
    tags: ["pulse", "ring", "sonar", "expand"],
    previewType: "box",
    cssCode: `/* Pulse Ring Expand */
.roycss-misc-pulse-ring-expand {
  position: relative;
  inline-size: 80px;
  block-size: 80px;
  background: transparent;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-misc-pulse-ring-expand > div {
  inline-size: 16px !important;
  block-size: 16px !important;
  background: oklch(0.696 0.149 162.48) !important;
  border-radius: 50% !important;
  box-shadow: 0 0 12px oklch(0.696 0.149 162.48);
}
.roycss-misc-pulse-ring-expand::before,
.roycss-misc-pulse-ring-expand::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 16px;
  block-size: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: 50%;
  animation: roy-misc-pulse-ring 2s ease-out infinite;
}
.roycss-misc-pulse-ring-expand::after { animation-delay: 1s; }
@keyframes roy-misc-pulse-ring {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(5); opacity: 0; }
}`,
  },
  {
    id: "misc-shimmer-overlay",
    name: "Shimmer Overlay",
    category: "misc",
    description: "Diagonal light sweep traveling across a colored panel like a loading shimmer",
    tags: ["shimmer", "sweep", "loading", "shine"],
    previewType: "box",
    cssCode: `/* Shimmer Overlay */
.roycss-misc-shimmer-overlay {
  position: relative;
  inline-size: 80px;
  block-size: 80px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.773 0.153 163.22));
  border-radius: 16px;
  overflow: hidden;
}
.roycss-misc-shimmer-overlay > div { display: none; }
.roycss-misc-shimmer-overlay::before {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: -100%;
  inline-size: 60%;
  block-size: 100%;
  background: linear-gradient(105deg, transparent, color-mix(in oklch, oklch(1 0 89.88) 60%, transparent), transparent);
  transform: skewX(-20deg);
  animation: roy-misc-shimmer 2.5s ease-in-out infinite;
}
.roycss-misc-shimmer-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, transparent 0%, color-mix(in oklch, oklch(0 0 0) 25%, transparent) 100%);
  pointer-events: none;
}
@keyframes roy-misc-shimmer {
  0%        { inset-inline-start: -100%; }
  60%, 100% { inset-inline-start: 200%; }
}`,
  },
  {
    id: "misc-scan-line",
    name: "Scan Line",
    category: "misc",
    description: "CRT-style scan grid with a bright horizontal beam sweeping vertically",
    tags: ["scan", "crt", "beam", "tech"],
    previewType: "background",
    cssCode: `/* Scan Line */
.roycss-misc-scan-line {
  position: relative;
  background:
    repeating-linear-gradient(0deg, color-mix(in oklch, oklch(0.696 0.149 162.48) 6%, transparent) 0 2px, transparent 2px 4px),
    linear-gradient(180deg, oklch(0.201 0.025 167.64), oklch(0.258 0.029 172.78));
  overflow: hidden;
}
.roycss-misc-scan-line > span { color: color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent) !important; }
.roycss-misc-scan-line::before {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 4px;
  background: linear-gradient(180deg, transparent, color-mix(in oklch, oklch(0.696 0.149 162.48) 90%, transparent), transparent);
  box-shadow: 0 0 20px color-mix(in oklch, oklch(0.696 0.149 162.48) 70%, transparent);
  animation: roy-misc-scan 2.5s ease-in-out infinite;
}
.roycss-misc-scan-line::after {
  content: "SCAN";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
  font: bold 14px/1 'Courier New', monospace;
  color: color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
  letter-spacing: 0.4em;
}
@keyframes roy-misc-scan {
  0%, 100% { inset-block-start: 0; }
  50%      { inset-block-start: 100%; }
}`,
  },
  {
    id: "misc-hologram",
    name: "Hologram Card",
    category: "misc",
    description: "Shifting iridescent rainbow surface with scan-lines and glowing label",
    tags: ["hologram", "iridescent", "rainbow", "holographic"],
    previewType: "box",
    cssCode: `/* Hologram Card */
.roycss-misc-hologram {
  position: relative;
  inline-size: 80px;
  block-size: 80px;
  background: linear-gradient(115deg,
    oklch(0.641 0.257 8.07) 0%, oklch(0.546 0.248 295.88) 25%, oklch(0.637 0.195 259.51) 50%, oklch(0.882 0.203 158.76) 75%, oklch(0.839 0.171 83.34) 100%);
  background-size: 400% 100%;
  border-radius: 16px;
  border: 1px solid color-mix(in oklch, oklch(1 0 89.88) 30%, transparent);
  box-shadow: 0 0 22px color-mix(in oklch, oklch(0.546 0.248 295.88) 45%, transparent);
  animation: roy-misc-hologram 4s linear infinite;
}
.roycss-misc-hologram > div { display: none; }
.roycss-misc-hologram::before {
  content: "HOLO";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
  font: bold 14px/1 system-ui, sans-serif;
  color: color-mix(in oklch, oklch(1 0 89.88) 95%, transparent);
  letter-spacing: 0.3em;
  text-shadow: 0 0 8px color-mix(in oklch, oklch(1 0 89.88) 80%, transparent);
}
.roycss-misc-hologram::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg,
    color-mix(in oklch, oklch(1 0 89.88) 12%, transparent) 0 1px,
    transparent 1px 3px);
  border-radius: 16px;
  pointer-events: none;
}
@keyframes roy-misc-hologram {
  0%   { background-position: 0% 0%; }
  100% { background-position: 400% 0%; }
}`,
  },
  {
    id: "misc-vhs-effect",
    name: "VHS Tracking",
    category: "misc",
    description: "Retro VHS look with scanlines, a moving tracking distortion band and a PLAY badge",
    tags: ["vhs", "retro", "tracking", "glitch"],
    previewType: "background",
    cssCode: `/* VHS Tracking */
.roycss-misc-vhs-effect {
  position: relative;
  background:
    repeating-linear-gradient(0deg, color-mix(in oklch, oklch(0 0 0) 18%, transparent) 0 2px, transparent 2px 4px),
    linear-gradient(135deg, oklch(0.236 0.106 304.47), oklch(0.468 0.154 296.01));
  overflow: hidden;
}
.roycss-misc-vhs-effect > span { color: color-mix(in oklch, oklch(1 0 89.88) 90%, transparent) !important; }
.roycss-misc-vhs-effect::before {
  content: "▶ REC";
  position: absolute;
  inset-block-start: 10px;
  inset-inline-start: 12px;
  font: 12px/1 'Courier New', monospace;
  color: color-mix(in oklch, oklch(0.676 0.212 24.81) 95%, transparent);
  letter-spacing: 0.18em;
  z-index: 2;
}
.roycss-misc-vhs-effect::after {
  content: "";
  position: absolute;
  inset-block-start: -50%;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 50%;
  background: linear-gradient(180deg,
    transparent,
    color-mix(in oklch, oklch(1 0 89.88) 18%, transparent) 40%,
    color-mix(in oklch, oklch(1 0 89.88) 32%, transparent) 50%,
    color-mix(in oklch, oklch(1 0 89.88) 18%, transparent) 60%,
    transparent);
  animation: roy-misc-vhs 3s linear infinite;
  z-index: 1;
}
@keyframes roy-misc-vhs {
  0%   { inset-block-start: -50%; }
  100% { inset-block-start: 100%; }
}`,
  },
  {
    id: "misc-typewriter",
    name: "Typewriter",
    category: "misc",
    description: "Text that types itself out character by character with a blinking cursor",
    tags: ["typewriter", "typing", "cursor", "text"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Typewriter */
.roycss-misc-typewriter {
  display: inline-block;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: oklch(0.696 0.149 162.48);
  overflow: hidden;
  white-space: nowrap;
  border-inline-end: 3px solid oklch(0.696 0.149 162.48);
  inline-size: 0;
  animation:
    roy-misc-typewriter-type 2.5s steps(6) infinite,
    roy-misc-typewriter-cursor 0.6s step-end infinite;
}
@keyframes roy-misc-typewriter-type {
  0%, 90%, 100% { inline-size: 0; }
  40%, 60%      { inline-size: 6ch; }
}
@keyframes roy-misc-typewriter-cursor {
  0%, 100% { border-color: oklch(0.696 0.149 162.48); }
  50%      { border-color: transparent; }
}`,
  },
];
