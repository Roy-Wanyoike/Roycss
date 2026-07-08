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
  background: linear-gradient(135deg, #ff6b6b 0%, #feca57 40%, #ff9ff3 80%, #48dbfb 100%);
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
  background: linear-gradient(135deg, #f12711 0%, #f5af19 40%, #2193b0 80%, #6dd5ed 100%);
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
  background: linear-gradient(135deg, #ee9ca7 0%, #ffdde1 30%, #ff758c 60%, #ff7e5f 100%);
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
  background: linear-gradient(135deg, #c471f5 0%, #fa71cd 40%, #89f7fe 100%);
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
  background: linear-gradient(135deg, #00f260 0%, #0575e6 50%, #f7971e 100%);
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 50%, #fbc2eb 100%);
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
    radial-gradient(circle, rgba(0,0,0,0.85) 1px, transparent 1.6px) 0 0 / 5px 5px,
    linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 50%, #ffe66d 100%);
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
  background: linear-gradient(135deg, #414d0b 0%, #727a17 50%, #d7e850 100%);
  filter: grayscale(1) brightness(1.1) contrast(1.4)
    drop-shadow(2px 2px 1px rgba(255,255,255,0.5))
    drop-shadow(-2px -2px 1px rgba(0,0,0,0.6));
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
  background: linear-gradient(135deg, #f7797d 0%, #fbd786 50%, #c6ffdd 100%);
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
  background: linear-gradient(135deg, #fc466b 0%, #3f5efb 50%, #fc466b 100%);
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
  background: linear-gradient(135deg, #00c9ff 0%, #92fe9d 50%, #fef9d7 100%);
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
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%);
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
  background: linear-gradient(135deg, #ff6a00 0%, #ee0979 50%, #ff6a00 100%);
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
  background: linear-gradient(135deg, #c94b4b 0%, #4b134f 50%, #c94b4b 100%);
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
  background: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 50%, #bdc3c7 100%);
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
  width: 170px;
  height: 40px;
  padding: 0 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.55);
  transition: all 0.3s ease;
}
.roycss-form-focus-glow > span { display: none; }
.roycss-form-focus-glow::before { content: "you@example.com"; }
.roycss-form-focus-glow::after {
  content: "";
  position: absolute;
  right: 14px;
  top: 50%;
  width: 12px;
  height: 12px;
  margin-top: -6px;
  background: linear-gradient(135deg, #10b981, #34d399);
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.4);
  transition: all 0.3s ease;
}
.roycss-form-focus-glow:hover {
  border-color: #10b981;
  background: rgba(16,185,129,0.06);
  color: #ecfdf5;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.18), 0 0 24px rgba(16,185,129,0.35);
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
  width: 170px;
  height: 48px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 10px;
  transition: all 0.3s ease;
}
.roycss-form-label-float > span { display: none; }
.roycss-form-label-float::before {
  content: "Full name";
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font: 13px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.5);
  transition: all 0.25s ease;
  pointer-events: none;
}
.roycss-form-label-float::after {
  content: "Roy Wanyoike";
  position: absolute;
  left: 14px;
  top: 24px;
  font: 12px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.85);
}
.roycss-form-label-float:hover {
  border-color: #10b981;
  background: rgba(16,185,129,0.05);
}
.roycss-form-label-float:hover::before {
  top: 9px;
  font-size: 9px;
  color: #10b981;
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
  width: 180px;
  height: 40px;
  padding: 0 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.18);
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
    rgba(255,255,255,0.3) 0%,
    rgba(255,255,255,0.95) 50%,
    rgba(255,255,255,0.3) 100%);
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
  width: 160px;
  height: 40px;
  padding: 0 14px;
  background: rgba(239,68,68,0.08);
  border: 1px solid #ef4444;
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  color: #fca5a5;
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
  width: 160px;
  height: 40px;
  padding: 0 14px 0 38px;
  background: rgba(16,185,129,0.1);
  border: 1px solid #10b981;
  border-radius: 10px;
  display: flex;
  align-items: center;
  font: 12px/1 system-ui, sans-serif;
  color: #6ee7b7;
}
.roycss-form-success-check > div { display: none; }
.roycss-form-success-check::before { content: "Submitted!"; }
.roycss-form-success-check::after {
  content: "";
  position: absolute;
  left: 14px;
  top: 50%;
  width: 16px;
  height: 8px;
  margin-top: -4px;
  border-left: 2px solid #10b981;
  border-bottom: 2px solid #10b981;
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
  width: 54px;
  height: 28px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 14px;
  transition: background 0.3s ease, border-color 0.3s ease;
}
.roycss-form-toggle-switch > div {
  width: 22px !important;
  height: 22px !important;
  margin: 0 !important;
  background: #fff !important;
  border-radius: 50% !important;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.roycss-form-toggle-switch:hover {
  background: #10b981;
  border-color: #10b981;
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
  width: 32px;
  height: 32px;
  background: transparent;
  border: 2px solid #10b981;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-form-checkbox-custom > div { display: none; }
.roycss-form-checkbox-custom::after {
  content: "";
  width: 14px;
  height: 7px;
  border-left: 2px solid #10b981;
  border-bottom: 2px solid #10b981;
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
  width: 32px;
  height: 32px;
  background: transparent;
  border: 2px solid #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-form-radio-custom > div { display: none; }
.roycss-form-radio-custom::after {
  content: "";
  width: 14px;
  height: 14px;
  background: #10b981;
  border-radius: 50%;
  transform: scale(0.4);
  animation: roy-form-radio 0.9s ease-in-out infinite alternate;
}
@keyframes roy-form-radio {
  0%   { transform: scale(0.5); box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
  100% { transform: scale(1); box-shadow: 0 0 0 4px rgba(16,185,129,0); }
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
  width: 56px;
  height: 40px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  font: 12px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.6);
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.4s ease;
}
.roycss-form-search-expand > span { display: none; }
.roycss-form-search-expand::before {
  content: "";
  width: 14px;
  height: 14px;
  border: 2px solid #10b981;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 6px 6px 0 -1px #10b981;
  transform: rotate(-45deg);
}
.roycss-form-search-expand::after {
  content: "Search docs...";
  margin-left: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s 0.2s ease;
}
.roycss-form-search-expand:hover {
  width: 200px;
  border-color: #10b981;
  background: rgba(16,185,129,0.05);
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
  width: 180px;
  height: 40px;
  padding: 0 4px;
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(255,255,255,0.18);
  display: flex;
  align-items: center;
  font: 13px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.7);
}
.roycss-form-underline-draw > span { display: none; }
.roycss-form-underline-draw::before { content: "@username"; }
.roycss-form-underline-draw::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #10b981, #34d399, #10b981);
  transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.roycss-form-underline-draw:hover {
  color: #ecfdf5;
}
.roycss-form-underline-draw:hover::after { width: 100%; }`,
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
  width: 220px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  font: 11px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.7);
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
  left: 0; right: 0;
  top: 100%;
  text-align: center;
  color: #10b981;
  transition: top 0.4s cubic-bezier(0.65, 0, 0.35, 1);
}
.roycss-nav-menu-slide:hover::before { transform: translateY(-100%); }
.roycss-nav-menu-slide:hover::after  { top: 50%; transform: translateY(-50%); }`,
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
  width: 220px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  font: 11px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.7);
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
  color: #10b981;
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
  width: 220px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  font: 11px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.15em;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-nav-menu-scale > span { display: none; }
.roycss-nav-menu-scale::before { content: "HOME  ABOUT  SERVICES  CONTACT"; }
.roycss-nav-menu-scale::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid #10b981;
  border-radius: 10px;
  opacity: 0;
  transform: scale(0.94);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-nav-menu-scale:hover {
  background: rgba(16,185,129,0.08);
  color: #10b981;
  transform: scale(1.06);
  letter-spacing: 0.22em;
}
.roycss-nav-menu-scale:hover::after {
  opacity: 1;
  transform: scale(1);
  box-shadow: 0 0 22px rgba(16,185,129,0.35);
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
  width: 180px;
  height: 34px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  font: 11px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.8);
  overflow: hidden;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.3s ease;
}
.roycss-nav-accordion > span { display: none; }
.roycss-nav-accordion::before {
  content: "▸  Menu Item";
  display: block;
  padding: 11px 14px;
  color: rgba(255,255,255,0.8);
  transition: color 0.3s ease;
}
.roycss-nav-accordion::after {
  content: "Sub 1  ·  Sub 2  ·  Sub 3";
  display: block;
  padding: 0 14px 10px 28px;
  color: rgba(16,185,129,0.75);
  font-size: 10px;
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.roycss-nav-accordion:hover {
  height: 70px;
  border-color: rgba(16,185,129,0.4);
}
.roycss-nav-accordion:hover::before {
  content: "▾  Menu Item";
  color: #10b981;
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
  width: 200px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 11px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.6);
  letter-spacing: 0.12em;
}
.roycss-nav-tabs-underline > span { display: none; }
.roycss-nav-tabs-underline::before { content: "TAB 1     TAB 2     TAB 3"; }
.roycss-nav-tabs-underline::after {
  content: "";
  position: absolute;
  left: 24px;
  bottom: 0;
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 1px;
  animation: roy-nav-tabs-underline 3s ease-in-out infinite;
}
@keyframes roy-nav-tabs-underline {
  0%, 100% { left: 24px; }
  33%      { left: 80px; }
  66%      { left: 136px; }
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
  width: 240px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 11px/1 system-ui, sans-serif;
  letter-spacing: 0.05em;
}
.roycss-nav-breadcrumb > span { display: none; }
.roycss-nav-breadcrumb::before {
  content: "Home  ›  Shop  ›  Electronics  ›  Phones";
  color: rgba(255,255,255,0.5);
}
.roycss-nav-breadcrumb::after {
  content: "";
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 40px;
  height: 2px;
  background: #10b981;
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
  width: 200px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 11px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.6);
  letter-spacing: 0.3em;
}
.roycss-nav-pagination > span { display: none; }
.roycss-nav-pagination::before { content: "‹   1   2   3   4   5   ›"; }
.roycss-nav-pagination::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border: 1.5px solid #10b981;
  border-radius: 50%;
  background: rgba(16,185,129,0.15);
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
  width: 220px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-nav-stepper > span { display: none; }
.roycss-nav-stepper::before {
  content: "";
  width: 180px;
  height: 4px;
  border-radius: 2px;
  background:
    linear-gradient(90deg, #10b981 0 66%, rgba(255,255,255,0.2) 66% 100%),
    repeating-linear-gradient(90deg,
      transparent 0 42px,
      rgba(255,255,255,0.6) 42px 46px,
      transparent 46px 88px,
      rgba(255,255,255,0.6) 88px 92px,
      transparent 92px 134px,
      rgba(255,255,255,0.6) 134px 138px,
      transparent 138px 180px);
}
.roycss-nav-stepper::after {
  content: "Step 3 of 4";
  position: absolute;
  bottom: 4px;
  font: 10px/1 system-ui, sans-serif;
  color: #10b981;
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
  width: 120px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.roycss-nav-progress-indicator > div { display: none; }
.roycss-nav-progress-indicator::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  box-shadow:
    16px 0 0 rgba(255,255,255,0.25),
    32px 0 0 rgba(255,255,255,0.25),
    48px 0 0 rgba(255,255,255,0.25),
    64px 0 0 rgba(255,255,255,0.25);
  animation: roy-nav-progress 1.6s steps(5, end) infinite;
}
@keyframes roy-nav-progress {
  0%   { background: #10b981; box-shadow:
    16px 0 0 rgba(255,255,255,0.25),
    32px 0 0 rgba(255,255,255,0.25),
    48px 0 0 rgba(255,255,255,0.25),
    64px 0 0 rgba(255,255,255,0.25); }
  20%  { background: rgba(255,255,255,0.25); box-shadow:
    16px 0 0 #10b981,
    32px 0 0 rgba(255,255,255,0.25),
    48px 0 0 rgba(255,255,255,0.25),
    64px 0 0 rgba(255,255,255,0.25); }
  40%  { background: rgba(255,255,255,0.25); box-shadow:
    16px 0 0 rgba(255,255,255,0.25),
    32px 0 0 #10b981,
    48px 0 0 rgba(255,255,255,0.25),
    64px 0 0 rgba(255,255,255,0.25); }
  60%  { background: rgba(255,255,255,0.25); box-shadow:
    16px 0 0 rgba(255,255,255,0.25),
    32px 0 0 rgba(255,255,255,0.25),
    48px 0 0 #10b981,
    64px 0 0 rgba(255,255,255,0.25); }
  80%, 100% { background: rgba(255,255,255,0.25); box-shadow:
    16px 0 0 rgba(255,255,255,0.25),
    32px 0 0 rgba(255,255,255,0.25),
    48px 0 0 rgba(255,255,255,0.25),
    64px 0 0 #10b981; }
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
  width: 180px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  font: 11px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.8);
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
  top: 34px;
  left: 0;
  right: 0;
  padding: 6px 14px 10px;
  background: rgba(16,185,129,0.08);
  color: #6ee7b7;
  font-size: 10px;
  line-height: 1.7;
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.roycss-nav-dropdown:hover {
  height: 86px;
  border-color: rgba(16,185,129,0.4);
}
.roycss-nav-dropdown:hover::before { color: #10b981; }
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
    radial-gradient(circle at 15% 0%, #ff6b6b 0 3px, transparent 4px) 0 0 / 40px 40px,
    radial-gradient(circle at 45% 0%, #feca57 0 3px, transparent 4px) 0 0 / 55px 55px,
    radial-gradient(circle at 75% 0%, #48dbfb 0 3px, transparent 4px) 0 0 / 45px 45px,
    radial-gradient(circle at 30% 0%, #1dd1a1 0 3px, transparent 4px) 0 0 / 60px 60px,
    radial-gradient(circle at 90% 0%, #ff9ff3 0 3px, transparent 4px) 0 0 / 50px 50px,
    linear-gradient(135deg, #1a1a2e, #16213e);
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
    radial-gradient(circle at 10% 0%, #fff 0 2px, transparent 3px) 0 0 / 30px 30px,
    radial-gradient(circle at 60% 0%, #fff 0 1.5px, transparent 2px) 0 0 / 45px 45px,
    radial-gradient(circle at 80% 0%, #fff 0 2.5px, transparent 3px) 0 0 / 35px 35px,
    radial-gradient(circle at 30% 0%, rgba(255,255,255,0.7) 0 1px, transparent 2px) 0 0 / 25px 25px,
    linear-gradient(180deg, #0f2027, #203a43, #2c5364);
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
    linear-gradient(105deg, transparent 0 48%, rgba(174,194,224,0.6) 48% 50%, transparent 50% 100%) 0 0 / 15px 30px,
    linear-gradient(105deg, transparent 0 49%, rgba(174,194,224,0.35) 49% 50%, transparent 50% 100%) 0 0 / 25px 40px,
    linear-gradient(180deg, #1a2a3a, #2c3e50);
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
    radial-gradient(circle at 20% 100%, rgba(255,255,255,0.7) 0 4px, transparent 5px) 0 0 / 60px 60px,
    radial-gradient(circle at 50% 100%, rgba(255,255,255,0.5) 0 6px, transparent 7px) 0 0 / 80px 80px,
    radial-gradient(circle at 80% 100%, rgba(255,255,255,0.6) 0 3px, transparent 4px) 0 0 / 50px 50px,
    linear-gradient(180deg, #2193b0, #6dd5ed);
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
    radial-gradient(circle at 20% 30%, rgba(212,255,127,0.9) 0 2px, transparent 5px) 0 0 / 100px 100px,
    radial-gradient(circle at 70% 60%, rgba(212,255,127,0.7) 0 2.5px, transparent 6px) 0 0 / 130px 130px,
    radial-gradient(circle at 40% 80%, rgba(212,255,127,0.8) 0 1.5px, transparent 4px) 0 0 / 90px 90px,
    linear-gradient(180deg, #0f0c29, #302b63, #24243e);
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
    radial-gradient(circle at 15% 25%, #fff 0 1px, transparent 2px) 0 0 / 50px 50px,
    radial-gradient(circle at 65% 75%, #fff 0 1.5px, transparent 2.5px) 0 0 / 70px 70px,
    radial-gradient(circle at 85% 15%, #fff 0 1px, transparent 2px) 0 0 / 40px 40px,
    radial-gradient(circle at 35% 85%, #fff 0 2px, transparent 3px) 0 0 / 60px 60px,
    linear-gradient(135deg, #0a0a23, #1a1a4e);
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
  background: linear-gradient(180deg, #0a0a23, #1a1a4e);
  overflow: hidden;
}
.roycss-misc-fireworks::before {
  content: "";
  position: absolute;
  top: 30%;
  left: 30%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  box-shadow:
    0 0 0 2px #ff6b6b,
    0 -20px 0 -1px #ff6b6b, 0 20px 0 -1px #ff6b6b,
    -20px 0 0 -1px #ff6b6b, 20px 0 0 -1px #ff6b6b,
    -14px -14px 0 -1px #ff6b6b, 14px 14px 0 -1px #ff6b6b,
    -14px 14px 0 -1px #ff6b6b, 14px -14px 0 -1px #ff6b6b;
  animation: roy-misc-firework1 2s ease-out infinite;
}
.roycss-misc-fireworks::after {
  content: "";
  position: absolute;
  top: 60%;
  left: 70%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  box-shadow:
    0 0 0 2px #feca57,
    0 -16px 0 -1px #feca57, 0 16px 0 -1px #feca57,
    -16px 0 0 -1px #feca57, 16px 0 0 -1px #feca57,
    -11px -11px 0 -1px #feca57, 11px 11px 0 -1px #feca57,
    -11px 11px 0 -1px #feca57, 11px -11px 0 -1px #feca57;
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
  width: 80px;
  height: 80px;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.3);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
}
.roycss-misc-ripple-click > div { display: none; }
.roycss-misc-ripple-click::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  background: #10b981;
  border-radius: 50%;
  transform: scale(0);
}
.roycss-misc-ripple-click::after {
  content: "Click";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font: 11px/1 system-ui, sans-serif;
  color: #10b981;
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
    linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.6) 50%, transparent 100%) 0 30% / 40px 4px repeat-x,
    linear-gradient(90deg, transparent 0%, rgba(20,184,166,0.5) 50%, transparent 100%) 0 50% / 30px 3px repeat-x,
    linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.5) 50%, transparent 100%) 0 70% / 50px 4px repeat-x,
    linear-gradient(180deg, #04293a, #063b52);
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
  width: 80px;
  height: 80px;
  background: transparent;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-misc-pulse-ring-expand > div {
  width: 16px !important;
  height: 16px !important;
  background: #10b981 !important;
  border-radius: 50% !important;
  box-shadow: 0 0 12px #10b981;
}
.roycss-misc-pulse-ring-expand::before,
.roycss-misc-pulse-ring-expand::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid #10b981;
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
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #10b981, #34d399);
  border-radius: 16px;
  overflow: hidden;
}
.roycss-misc-shimmer-overlay > div { display: none; }
.roycss-misc-shimmer-overlay::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,0.6), transparent);
  transform: skewX(-20deg);
  animation: roy-misc-shimmer 2.5s ease-in-out infinite;
}
.roycss-misc-shimmer-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.25) 100%);
  pointer-events: none;
}
@keyframes roy-misc-shimmer {
  0%        { left: -100%; }
  60%, 100% { left: 200%; }
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
    repeating-linear-gradient(0deg, rgba(16,185,129,0.06) 0 2px, transparent 2px 4px),
    linear-gradient(180deg, #0a1a14, #142822);
  overflow: hidden;
}
.roycss-misc-scan-line > span { color: rgba(16,185,129,0.5) !important; }
.roycss-misc-scan-line::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(180deg, transparent, rgba(16,185,129,0.9), transparent);
  box-shadow: 0 0 20px rgba(16,185,129,0.7);
  animation: roy-misc-scan 2.5s ease-in-out infinite;
}
.roycss-misc-scan-line::after {
  content: "SCAN";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font: bold 14px/1 'Courier New', monospace;
  color: rgba(16,185,129,0.4);
  letter-spacing: 0.4em;
}
@keyframes roy-misc-scan {
  0%, 100% { top: 0; }
  50%      { top: 100%; }
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
  width: 80px;
  height: 80px;
  background: linear-gradient(115deg,
    #ff006e 0%, #8338ec 25%, #3a86ff 50%, #06ffa5 75%, #ffbe0b 100%);
  background-size: 400% 100%;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow: 0 0 22px rgba(131,56,236,0.45);
  animation: roy-misc-hologram 4s linear infinite;
}
.roycss-misc-hologram > div { display: none; }
.roycss-misc-hologram::before {
  content: "HOLO";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font: bold 14px/1 system-ui, sans-serif;
  color: rgba(255,255,255,0.95);
  letter-spacing: 0.3em;
  text-shadow: 0 0 8px rgba(255,255,255,0.8);
}
.roycss-misc-hologram::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg,
    rgba(255,255,255,0.12) 0 1px,
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
    repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 4px),
    linear-gradient(135deg, #2a0845, #6441a5);
  overflow: hidden;
}
.roycss-misc-vhs-effect > span { color: rgba(255,255,255,0.9) !important; }
.roycss-misc-vhs-effect::before {
  content: "▶ REC";
  position: absolute;
  top: 10px;
  left: 12px;
  font: 12px/1 'Courier New', monospace;
  color: rgba(255,80,80,0.95);
  letter-spacing: 0.18em;
  z-index: 2;
}
.roycss-misc-vhs-effect::after {
  content: "";
  position: absolute;
  top: -50%;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg,
    transparent,
    rgba(255,255,255,0.18) 40%,
    rgba(255,255,255,0.32) 50%,
    rgba(255,255,255,0.18) 60%,
    transparent);
  animation: roy-misc-vhs 3s linear infinite;
  z-index: 1;
}
@keyframes roy-misc-vhs {
  0%   { top: -50%; }
  100% { top: 100%; }
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
  color: #10b981;
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid #10b981;
  width: 0;
  animation:
    roy-misc-typewriter-type 2.5s steps(6) infinite,
    roy-misc-typewriter-cursor 0.6s step-end infinite;
}
@keyframes roy-misc-typewriter-type {
  0%, 90%, 100% { width: 0; }
  40%, 60%      { width: 6ch; }
}
@keyframes roy-misc-typewriter-cursor {
  0%, 100% { border-color: #10b981; }
  50%      { border-color: transparent; }
}`,
  },
];
