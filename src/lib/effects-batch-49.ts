import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 49 — Glass 2.0: Advanced Glassmorphism (20)
 * Pure-CSS advanced glass effects: dynamic adaptive glass, frosted slabs,
 * edge-lit borders, refraction, distortion, layered stacks, depth shadows,
 * glass navigation/modals/cards/inputs/dropdowns/tooltips/sidebars/tab-bars/
 * hero overlays/notifications/pricing cards. All surfaces use backdrop-filter
 * blur + saturate + highlight overlays. All classes are prefixed
 * `roycss-glass2-` and keyframes `roy-glass2-`. Each effect honors
 * prefers-reduced-motion.
 */
export const effectsBatch49 = [
  // ═══════════════════════════════════════════════════════════════
  // GLASS 2.0 (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. glass2-dynamic
  {
    id: "glass2-dynamic",
    name: "Dynamic Glass",
    category: "glass-2",
    description: "Glass surface that shimmers and shifts hues dynamically",
    tags: ["glass", "dynamic", "shimmer", "backdrop", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Dynamic Glass */
.roycss-glass2-dynamic {
  position: relative;
  width: 100%; height: 100%;
  background:
    linear-gradient(135deg, oklch(0.95 0.05 220 / 0.35), oklch(0.85 0.12 280 / 0.25));
  backdrop-filter: blur(14px) saturate(180%);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  border: 1px solid oklch(1 0 0 / 0.4);
  border-radius: 18px;
  box-shadow: 0 12px 36px oklch(0 0 0 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.6);
  overflow: hidden;
  animation: roy-glass2-dynamic 8s ease-in-out infinite;
}
.roycss-glass2-dynamic::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 30%, oklch(1 0 0 / 0.25) 50%, transparent 70%);
  background-size: 200% 200%;
  animation: roy-glass2-dynamic-shimmer 4s linear infinite;
}
@keyframes roy-glass2-dynamic {
  0%, 100% { filter: hue-rotate(0deg); }
  50%      { filter: hue-rotate(40deg); }
}
@keyframes roy-glass2-dynamic-shimmer {
  from { background-position: 0% 0%; }
  to   { background-position: 200% 200%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-dynamic,
  .roycss-glass2-dynamic::before { animation: none; }
}`,
  },

  // 2. glass2-frosted
  {
    id: "glass2-frosted",
    name: "Frosted Slab",
    category: "glass-2",
    description: "Thick frosted glass with heavy blur and snow-crystal edge",
    tags: ["glass", "frosted", "blur", "thick", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Frosted Slab */
.roycss-glass2-frosted {
  position: relative;
  width: 100%; height: 100%;
  background: oklch(0.96 0.02 220 / 0.5);
  backdrop-filter: blur(28px) saturate(160%) brightness(110%);
  -webkit-backdrop-filter: blur(28px) saturate(160%) brightness(110%);
  border: 1px solid oklch(1 0 0 / 0.6);
  border-radius: 16px;
  box-shadow:
    0 16px 40px oklch(0 0 0 / 0.3),
    inset 0 2px 4px oklch(1 0 0 / 0.7),
    inset 0 -1px 2px oklch(0 0 0 / 0.1);
}
.roycss-glass2-frosted::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at 15% 15%, oklch(1 0 0 / 0.5) 0 3px, transparent 4px),
    radial-gradient(circle at 80% 20%, oklch(1 0 0 / 0.4) 0 2px, transparent 3px),
    radial-gradient(circle at 30% 70%, oklch(1 0 0 / 0.35) 0 2px, transparent 3px),
    radial-gradient(circle at 90% 85%, oklch(1 0 0 / 0.4) 0 3px, transparent 4px);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-frosted::before { display: none; }
}`,
  },

  // 3. glass2-edge-lit
  {
    id: "glass2-edge-lit",
    name: "Edge Lit",
    category: "glass-2",
    description: "Glass with luminous edge lighting that pulses around border",
    tags: ["glass", "edge", "lit", "neon", "glass-2"],
    previewType: "box",
    cssCode: `/* Glass 2.0: Edge Lit */
.roycss-glass2-edge-lit {
  position: relative;
  width: 100%; height: 100%;
  background: oklch(0.18 0.04 250 / 0.5);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: oklch(0.98 0.05 220);
  font: 800 18px/1 system-ui, sans-serif;
  letter-spacing: 0.2em;
  overflow: hidden;
}
.roycss-glass2-edge-lit::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: conic-gradient(from 0deg,
    oklch(0.85 0.22 60), oklch(0.7 0.24 280), oklch(0.85 0.22 60));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  filter: drop-shadow(0 0 8px oklch(0.85 0.22 60 / 0.7));
  animation: roy-glass2-edge-lit 4s linear infinite;
}
@keyframes roy-glass2-edge-lit {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-edge-lit::before { animation: none; }
}`,
  },

  // 4. glass2-refraction
  {
    id: "glass2-refraction",
    name: "Refraction",
    category: "glass-2",
    description: "Light refracts through glass creating a prismatic spectrum",
    tags: ["glass", "refraction", "prism", "spectrum", "glass-2"],
    previewType: "box",
    cssCode: `/* Glass 2.0: Refraction */
.roycss-glass2-refraction {
  position: relative;
  width: 100%; height: 100%;
  background:
    linear-gradient(135deg, oklch(0.96 0.02 220 / 0.35), oklch(0.88 0.05 280 / 0.3));
  backdrop-filter: blur(8px) saturate(200%) hue-rotate(10deg);
  -webkit-backdrop-filter: blur(8px) saturate(200%) hue-rotate(10deg);
  border-radius: 18px;
  border: 1px solid oklch(1 0 0 / 0.4);
  box-shadow: 0 12px 30px oklch(0 0 0 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.5);
  overflow: hidden;
}
.roycss-glass2-refraction::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg,
      transparent 40%,
      oklch(0.85 0.25 0 / 0.4) 50%,
      oklch(0.85 0.25 60 / 0.4) 55%,
      oklch(0.85 0.25 120 / 0.4) 60%,
      oklch(0.85 0.25 180 / 0.4) 65%,
      oklch(0.85 0.25 240 / 0.4) 70%,
      oklch(0.85 0.25 300 / 0.4) 75%,
      transparent 85%);
  mix-blend-mode: screen;
  animation: roy-glass2-refraction 6s ease-in-out infinite;
}
@keyframes roy-glass2-refraction {
  0%, 100% { transform: translateX(-20%); }
  50%      { transform: translateX(20%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-refraction::before { animation: none; }
}`,
  },

  // 5. glass2-distortion
  {
    id: "glass2-distortion",
    name: "Distortion Glass",
    category: "glass-2",
    description: "Glass with subtle wavy distortion across its surface",
    tags: ["glass", "distortion", "wavy", "ripple", "glass-2"],
    previewType: "box",
    cssCode: `/* Glass 2.0: Distortion Glass */
.roycss-glass2-distortion {
  position: relative;
  width: 100%; height: 100%;
  background: oklch(0.92 0.04 220 / 0.4);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border-radius: 18px;
  border: 1px solid oklch(1 0 0 / 0.45);
  box-shadow: 0 10px 30px oklch(0 0 0 / 0.25);
  overflow: hidden;
}
.roycss-glass2-distortion::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-radial-gradient(circle at 50% 50%, transparent 0 18px, oklch(1 0 0 / 0.05) 18px 20px);
  animation: roy-glass2-distortion 5s linear infinite;
}
.roycss-glass2-distortion::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, oklch(1 0 0 / 0.2), transparent 50%);
  border-radius: inherit;
}
@keyframes roy-glass2-distortion {
  from { transform: scale(1) rotate(0deg); }
  to   { transform: scale(1.05) rotate(8deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-distortion::before { animation: none; }
}`,
  },

  // 6. glass2-layered
  {
    id: "glass2-layered",
    name: "Layered Glass",
    category: "glass-2",
    description: "Multiple stacked glass layers creating depth of field",
    tags: ["glass", "layered", "stack", "depth", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Layered Glass */
.roycss-glass2-layered {
  position: relative;
  width: 100%; height: 100%;
  background: oklch(0.95 0.04 220 / 0.3);
  backdrop-filter: blur(6px) saturate(160%);
  -webkit-backdrop-filter: blur(6px) saturate(160%);
  border-radius: 18px;
  border: 1px solid oklch(1 0 0 / 0.4);
  box-shadow: 0 8px 24px oklch(0 0 0 / 0.2);
  overflow: hidden;
}
.roycss-glass2-layered::before {
  content: "";
  position: absolute;
  inset: 8%;
  background: oklch(0.85 0.1 280 / 0.35);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border-radius: 14px;
  border: 1px solid oklch(1 0 0 / 0.45);
  box-shadow: 0 6px 16px oklch(0 0 0 / 0.25);
}
.roycss-glass2-layered::after {
  content: "";
  position: absolute;
  inset: 20%;
  background: oklch(0.75 0.15 320 / 0.4);
  backdrop-filter: blur(14px) saturate(200%);
  -webkit-backdrop-filter: blur(14px) saturate(200%);
  border-radius: 10px;
  border: 1px solid oklch(1 0 0 / 0.5);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-layered::before,
  .roycss-glass2-layered::after { display: none; }
}`,
  },

  // 7. glass2-adaptive
  {
    id: "glass2-adaptive",
    name: "Adaptive Glass",
    category: "glass-2",
    description: "Glass adapts opacity and blur based on a simulated background",
    tags: ["glass", "adaptive", "opacity", "contextual", "glass-2"],
    previewType: "box",
    cssCode: `/* Glass 2.0: Adaptive Glass */
.roycss-glass2-adaptive {
  position: relative;
  width: 100%; height: 100%;
  background:
    linear-gradient(135deg, oklch(0.95 0.05 220 / 0.45), oklch(0.85 0.08 280 / 0.35));
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border-radius: 16px;
  border: 1px solid oklch(1 0 0 / 0.45);
  box-shadow: 0 8px 24px oklch(0 0 0 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.55);
  animation: roy-glass2-adaptive 6s ease-in-out infinite;
}
@keyframes roy-glass2-adaptive {
  0%, 100% {
    background: linear-gradient(135deg, oklch(0.95 0.05 220 / 0.45), oklch(0.85 0.08 280 / 0.35));
    backdrop-filter: blur(12px) saturate(180%);
  }
  50% {
    background: linear-gradient(135deg, oklch(0.85 0.08 280 / 0.6), oklch(0.7 0.15 320 / 0.5));
    backdrop-filter: blur(18px) saturate(220%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-adaptive { animation: none; }
}`,
  },

  // 8. glass2-depth
  {
    id: "glass2-depth",
    name: "Depth Glass",
    category: "glass-2",
    description: "Glass with perceived depth from layered inner shadows",
    tags: ["glass", "depth", "shadow", "inset", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Depth Glass */
.roycss-glass2-depth {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.95 0.04 220 / 0.4), oklch(0.85 0.08 280 / 0.3));
  backdrop-filter: blur(14px) saturate(180%);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  border-radius: 18px;
  border: 1px solid oklch(1 0 0 / 0.45);
  box-shadow:
    0 30px 60px oklch(0 0 0 / 0.35),
    0 12px 24px oklch(0 0 0 / 0.25),
    inset 0 2px 4px oklch(1 0 0 / 0.7),
    inset 0 -2px 6px oklch(0 0 0 / 0.15),
    inset 0 0 60px oklch(0.7 0.1 280 / 0.15);
}
.roycss-glass2-depth::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(ellipse at 30% 0%, oklch(1 0 0 / 0.4), transparent 50%),
    radial-gradient(ellipse at 70% 100%, oklch(0 0 0 / 0.2), transparent 50%);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-depth::before { display: none; }
}`,
  },

  // 9. glass2-navigation
  {
    id: "glass2-navigation",
    name: "Glass Navigation",
    category: "glass-2",
    description: "Glass navbar with strong blur and animated indicator",
    tags: ["glass", "navigation", "navbar", "blur", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Glass Navigation */
.roycss-glass2-navigation {
  position: relative;
  width: 100%; height: 56px;
  background: oklch(0.96 0.03 220 / 0.55);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 14px;
  border: 1px solid oklch(1 0 0 / 0.5);
  box-shadow: 0 8px 24px oklch(0 0 0 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.6);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 14px;
  overflow: hidden;
}
.roycss-glass2-navigation::before {
  content: "";
  position: absolute;
  width: 60px;
  height: calc(100% - 16px);
  top: 8px; left: 16px;
  background: linear-gradient(135deg, oklch(0.85 0.18 280 / 0.6), oklch(0.7 0.22 320 / 0.6));
  border-radius: 10px;
  box-shadow: 0 4px 10px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.4);
  animation: roy-glass2-navigation 4s ease-in-out infinite;
}
.roycss-glass2-navigation::after {
  content: "Home   Docs   Pricing   Blog";
  position: relative;
  color: oklch(0.18 0.04 250);
  font: 700 14px/1 system-ui, sans-serif;
  letter-spacing: 0.04em;
}
@keyframes roy-glass2-navigation {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(80px); }
  50%      { transform: translateX(160px); }
  75%      { transform: translateX(80px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-navigation::before { animation: none; }
}`,
  },

  // 10. glass2-modal
  {
    id: "glass2-modal",
    name: "Glass Modal",
    category: "glass-2",
    description: "Glass modal with deep backdrop blur and rim lighting",
    tags: ["glass", "modal", "dialog", "backdrop", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Glass Modal */
.roycss-glass2-modal {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.18 0.04 250 / 0.4), oklch(0.35 0.06 270 / 0.3));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 18px;
  display: grid;
  place-items: center;
}
.roycss-glass2-modal::before {
  content: "";
  position: absolute;
  width: 70%; height: 65%;
  background:
    linear-gradient(135deg, oklch(0.96 0.04 220 / 0.6), oklch(0.88 0.06 280 / 0.55));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 14px;
  border: 1px solid oklch(1 0 0 / 0.55);
  box-shadow:
    0 30px 60px oklch(0 0 0 / 0.5),
    0 0 0 1px oklch(0 0 0 / 0.1),
    inset 0 1px 0 oklch(1 0 0 / 0.7);
}
.roycss-glass2-modal::after {
  content: "Modal";
  position: relative;
  z-index: 2;
  color: oklch(0.95 0.05 220);
  font: 800 24px/1 system-ui, sans-serif;
  letter-spacing: 0.2em;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-modal::before { box-shadow: 0 12px 24px oklch(0 0 0 / 0.4); }
}`,
  },

  // 11. glass2-card-glow
  {
    id: "glass2-card-glow",
    name: "Glow Card",
    category: "glass-2",
    description: "Glass card with an outer animated glow halo",
    tags: ["glass", "card", "glow", "halo", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Glow Card */
.roycss-glass2-card-glow {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.96 0.04 220 / 0.45), oklch(0.88 0.06 280 / 0.35));
  backdrop-filter: blur(14px) saturate(180%);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  border-radius: 18px;
  border: 1px solid oklch(1 0 0 / 0.5);
  box-shadow: 0 0 0 1px oklch(0 0 0 / 0.05), 0 12px 30px oklch(0 0 0 / 0.25);
  display: grid;
  place-items: center;
  color: oklch(0.18 0.04 250);
  font: 800 18px/1 system-ui, sans-serif;
  letter-spacing: 0.2em;
  animation: roy-glass2-card-glow 4s ease-in-out infinite;
}
@keyframes roy-glass2-card-glow {
  0%, 100% {
    box-shadow:
      0 0 0 1px oklch(0 0 0 / 0.05),
      0 12px 30px oklch(0 0 0 / 0.25),
      0 0 20px oklch(0.85 0.22 280 / 0.5);
  }
  50% {
    box-shadow:
      0 0 0 1px oklch(0 0 0 / 0.05),
      0 12px 30px oklch(0 0 0 / 0.25),
      0 0 40px oklch(0.85 0.22 320 / 0.7);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-card-glow { animation: none; }
}`,
  },

  // 12. glass2-button-press
  {
    id: "glass2-button-press",
    name: "Press Button",
    category: "glass-2",
    description: "Glass button with deep tactile press feedback",
    tags: ["glass", "button", "press", "tactile", "glass-2"],
    previewType: "button",
    previewText: "Press",
    cssCode: `/* Glass 2.0: Press Button */
.roycss-glass2-button-press {
  display: inline-grid;
  place-items: center;
  width: 160px; height: 56px;
  background: linear-gradient(135deg, oklch(0.85 0.18 280 / 0.7), oklch(0.7 0.22 320 / 0.7));
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
  border: 1px solid oklch(1 0 0 / 0.55);
  border-radius: 14px;
  color: oklch(0.98 0 0);
  font: 800 18px/1 system-ui, sans-serif;
  letter-spacing: 0.15em;
  cursor: pointer;
  box-shadow:
    0 8px 18px oklch(0 0 0 / 0.25),
    inset 0 1px 0 oklch(1 0 0 / 0.6),
    inset 0 -2px 4px oklch(0 0 0 / 0.15);
  transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 180ms ease;
}
.roycss-glass2-button-press:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 14px 28px oklch(0 0 0 / 0.3),
    inset 0 1px 0 oklch(1 0 0 / 0.7),
    inset 0 -2px 4px oklch(0 0 0 / 0.15);
}
.roycss-glass2-button-press:active {
  transform: translateY(2px) scale(0.97);
  box-shadow:
    0 2px 6px oklch(0 0 0 / 0.2),
    inset 0 4px 8px oklch(0 0 0 / 0.25),
    inset 0 -1px 1px oklch(1 0 0 / 0.4);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-button-press,
  .roycss-glass2-button-press:hover,
  .roycss-glass2-button-press:active { transition: none; transform: none; }
}`,
  },

  // 13. glass2-input-focus
  {
    id: "glass2-input-focus",
    name: "Focus Input",
    category: "glass-2",
    description: "Glass input field that lights up on focus with rim glow",
    tags: ["glass", "input", "focus", "form", "glass-2"],
    previewType: "button",
    previewText: "Type here",
    cssCode: `/* Glass 2.0: Focus Input */
.roycss-glass2-input-focus {
  display: inline-grid;
  align-items: center;
  width: 240px; height: 48px;
  padding: 0 16px;
  background: oklch(0.96 0.03 220 / 0.4);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid oklch(1 0 0 / 0.5);
  border-radius: 12px;
  color: oklch(0.18 0.04 250);
  font: 600 15px/1 system-ui, sans-serif;
  box-shadow: inset 0 2px 4px oklch(0 0 0 / 0.1), 0 4px 10px oklch(0 0 0 / 0.15);
  transition: box-shadow 250ms ease, border-color 250ms ease, background 250ms ease;
}
.roycss-glass2-input-focus:hover {
  border-color: oklch(0.7 0.18 280 / 0.7);
  box-shadow: inset 0 2px 4px oklch(0 0 0 / 0.1), 0 4px 10px oklch(0 0 0 / 0.15),
              0 0 0 4px oklch(0.7 0.18 280 / 0.25);
}
.roycss-glass2-input-focus:focus,
.roycss-glass2-input-focus:focus-within {
  background: oklch(0.98 0.03 220 / 0.55);
  border-color: oklch(0.7 0.22 280);
  box-shadow: inset 0 2px 4px oklch(0 0 0 / 0.08),
              0 4px 12px oklch(0 0 0 / 0.2),
              0 0 0 4px oklch(0.7 0.22 280 / 0.4),
              0 0 24px oklch(0.75 0.22 280 / 0.5);
  outline: none;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-input-focus,
  .roycss-glass2-input-focus:hover,
  .roycss-glass2-input-focus:focus { transition: none; }
}`,
  },

  // 14. glass2-dropdown
  {
    id: "glass2-dropdown",
    name: "Glass Dropdown",
    category: "glass-2",
    description: "Glass dropdown menu with cascading blurred items",
    tags: ["glass", "dropdown", "menu", "blur", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Glass Dropdown */
.roycss-glass2-dropdown {
  position: relative;
  width: 220px;
  height: 240px;
  background: linear-gradient(135deg, oklch(0.96 0.04 220 / 0.55), oklch(0.88 0.06 280 / 0.45));
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border-radius: 14px;
  border: 1px solid oklch(1 0 0 / 0.55);
  box-shadow: 0 18px 40px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.7);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.roycss-glass2-dropdown::before,
.roycss-glass2-dropdown::after {
  content: "";
  height: 36px;
  border-radius: 8px;
}
.roycss-glass2-dropdown::before {
  background: oklch(0.7 0.18 280 / 0.4);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.5), 0 2px 6px oklch(0 0 0 / 0.15);
  animation: roy-glass2-dropdown 3s ease-in-out infinite;
}
.roycss-glass2-dropdown::after {
  background: oklch(0 0 0 / 0.06);
  margin-top: auto;
}
@keyframes roy-glass2-dropdown {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(36px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-dropdown::before { animation: none; }
}`,
  },

  // 15. glass2-tooltip
  {
    id: "glass2-tooltip",
    name: "Glass Tooltip",
    category: "glass-2",
    description: "Floating glass tooltip with backdrop blur and pointer",
    tags: ["glass", "tooltip", "popover", "blur", "glass-2"],
    previewType: "box",
    cssCode: `/* Glass 2.0: Glass Tooltip */
.roycss-glass2-tooltip {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.25 0.05 250), oklch(0.4 0.08 270));
  border-radius: 14px;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.roycss-glass2-tooltip::before {
  content: "Tooltip";
  position: absolute;
  padding: 8px 14px;
  background: linear-gradient(135deg, oklch(0.96 0.04 220 / 0.7), oklch(0.88 0.06 280 / 0.6));
  backdrop-filter: blur(16px) saturate(200%);
  -webkit-backdrop-filter: blur(16px) saturate(200%);
  border: 1px solid oklch(1 0 0 / 0.55);
  border-radius: 10px;
  color: oklch(0.18 0.04 250);
  font: 700 13px/1.3 system-ui, sans-serif;
  box-shadow: 0 8px 20px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.6);
  animation: roy-glass2-tooltip 4s ease-in-out infinite;
}
.roycss-glass2-tooltip::after {
  content: "";
  position: absolute;
  width: 12px; height: 12px;
  background: linear-gradient(135deg, oklch(0.96 0.04 220 / 0.7), oklch(0.88 0.06 280 / 0.6));
  border: 1px solid oklch(1 0 0 / 0.55);
  border-right: none;
  border-bottom: none;
  transform: rotate(225deg);
  border-radius: 2px 0 0 0;
  animation: roy-glass2-tooltip-arrow 4s ease-in-out infinite;
}
@keyframes roy-glass2-tooltip {
  0%, 100% { transform: translate(-30%, -20%); }
  50%      { transform: translate(20%, 30%); }
}
@keyframes roy-glass2-tooltip-arrow {
  0%, 100% { transform: translate(20%, -20%) rotate(225deg); }
  50%      { transform: translate(60%, 30%) rotate(225deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-tooltip::before,
  .roycss-glass2-tooltip::after { animation: none; }
}`,
  },

  // 16. glass2-sidebar
  {
    id: "glass2-sidebar",
    name: "Glass Sidebar",
    category: "glass-2",
    description: "Glass sidebar panel with nav items and indicator pill",
    tags: ["glass", "sidebar", "panel", "nav", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Glass Sidebar */
.roycss-glass2-sidebar {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(180deg, oklch(0.96 0.04 220 / 0.55), oklch(0.88 0.06 280 / 0.4));
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border-radius: 18px;
  border: 1px solid oklch(1 0 0 / 0.5);
  box-shadow: 0 18px 40px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.65);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.roycss-glass2-sidebar::before {
  content: "";
  position: absolute;
  top: 16px; left: 16px;
  width: calc(100% - 32px);
  height: 36px;
  background: linear-gradient(135deg, oklch(0.7 0.18 280 / 0.55), oklch(0.55 0.22 320 / 0.55));
  border-radius: 10px;
  box-shadow: 0 4px 10px oklch(0 0 0 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.5);
  animation: roy-glass2-sidebar 4s ease-in-out infinite;
}
.roycss-glass2-sidebar::after {
  content: "";
  position: absolute;
  top: 60px; left: 16px;
  width: calc(100% - 32px);
  height: 36px;
  background: oklch(0 0 0 / 0.08);
  border-radius: 10px;
  box-shadow: 0 4px 10px oklch(0 0 0 / 0.15);
}
@keyframes roy-glass2-sidebar {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(44px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-sidebar::before { animation: none; }
}`,
  },

  // 17. glass2-tab-bar
  {
    id: "glass2-tab-bar",
    name: "Tab Bar",
    category: "glass-2",
    description: "Glass tab bar with sliding indicator pill across tabs",
    tags: ["glass", "tab", "bar", "indicator", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Tab Bar */
.roycss-glass2-tab-bar {
  position: relative;
  width: 100%; height: 56px;
  background: oklch(0.96 0.04 220 / 0.55);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border-radius: 14px;
  border: 1px solid oklch(1 0 0 / 0.5);
  box-shadow: 0 8px 24px oklch(0 0 0 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.6);
  display: flex;
  align-items: center;
  padding: 8px;
  overflow: hidden;
}
.roycss-glass2-tab-bar::before {
  content: "";
  position: absolute;
  width: calc(33.33% - 8px);
  height: calc(100% - 16px);
  background: linear-gradient(135deg, oklch(0.85 0.18 280 / 0.7), oklch(0.7 0.22 320 / 0.7));
  border-radius: 10px;
  box-shadow: 0 4px 12px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.5);
  animation: roy-glass2-tab-bar 5s ease-in-out infinite;
}
.roycss-glass2-tab-bar::after {
  content: "Home  Docs  Pricing";
  position: relative;
  flex: 1;
  text-align: center;
  color: oklch(0.18 0.04 250);
  font: 700 14px/1 system-ui, sans-serif;
  letter-spacing: 0.08em;
}
@keyframes roy-glass2-tab-bar {
  0%, 100% { transform: translateX(0); }
  33%      { transform: translateX(100%); }
  66%      { transform: translateX(200%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-tab-bar::before { animation: none; }
}`,
  },

  // 18. glass2-hero-overlay
  {
    id: "glass2-hero-overlay",
    name: "Hero Overlay",
    category: "glass-2",
    description: "Glass overlay panel on a hero with cinematic shimmer",
    tags: ["glass", "hero", "overlay", "cinematic", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Hero Overlay */
.roycss-glass2-hero-overlay {
  position: relative;
  width: 100%; height: 100%;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.7 0.22 30), oklch(0.4 0.24 320) 60%, oklch(0.2 0.05 250));
  border-radius: 18px;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.roycss-glass2-hero-overlay::before {
  content: "";
  position: absolute;
  width: 70%; height: 50%;
  background: linear-gradient(135deg, oklch(0.98 0.04 220 / 0.5), oklch(0.92 0.06 280 / 0.35));
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
  border-radius: 14px;
  border: 1px solid oklch(1 0 0 / 0.5);
  box-shadow: 0 20px 50px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.65);
  background-size: 200% 200%;
  background-image:
    linear-gradient(135deg, oklch(0.98 0.04 220 / 0.5), oklch(0.92 0.06 280 / 0.35)),
    linear-gradient(135deg, transparent 30%, oklch(1 0 0 / 0.4) 50%, transparent 70%);
  animation: roy-glass2-hero-overlay 5s ease-in-out infinite;
}
.roycss-glass2-hero-overlay::after {
  content: "Hero";
  position: relative;
  z-index: 2;
  color: oklch(0.98 0 0);
  font: 900 32px/1 system-ui, sans-serif;
  letter-spacing: 0.15em;
  text-shadow: 0 4px 12px oklch(0 0 0 / 0.4);
}
@keyframes roy-glass2-hero-overlay {
  0%, 100% { background-position: 0% 0%, 0% 0%; }
  50%      { background-position: 0% 0%, 200% 200%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-hero-overlay::before { animation: none; }
}`,
  },

  // 19. glass2-notification
  {
    id: "glass2-notification",
    name: "Notification Toast",
    category: "glass-2",
    description: "Glass notification toast with sliding entrance and glow",
    tags: ["glass", "notification", "toast", "alert", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Notification Toast */
.roycss-glass2-notification {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(135deg, oklch(0.2 0.05 250), oklch(0.35 0.08 270));
  border-radius: 14px;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.roycss-glass2-notification::before {
  content: "";
  position: absolute;
  width: 80%; height: 60px;
  background: linear-gradient(135deg, oklch(0.96 0.04 220 / 0.55), oklch(0.88 0.06 280 / 0.45));
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid oklch(1 0 0 / 0.5);
  border-radius: 12px;
  box-shadow: 0 12px 30px oklch(0 0 0 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.6),
              0 0 30px oklch(0.75 0.22 140 / 0.4);
  animation: roy-glass2-notification 4s ease-in-out infinite;
}
.roycss-glass2-notification::after {
  content: "● New message";
  position: relative;
  z-index: 2;
  color: oklch(0.18 0.04 250);
  font: 700 14px/1 system-ui, sans-serif;
  letter-spacing: 0.05em;
}
@keyframes roy-glass2-notification {
  0%   { transform: translateY(-150%) scale(0.9); opacity: 0; }
  15%, 85% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-150%) scale(0.9); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-notification::before { animation: none; opacity: 1; transform: none; }
}`,
  },

  // 20. glass2-pricing-card
  {
    id: "glass2-pricing-card",
    name: "Pricing Card",
    category: "glass-2",
    description: "Glass pricing card with CTA button and featured glow",
    tags: ["glass", "pricing", "card", "cta", "glass-2"],
    previewType: "card",
    cssCode: `/* Glass 2.0: Pricing Card */
.roycss-glass2-pricing-card {
  position: relative;
  width: 100%; height: 100%;
  background: linear-gradient(160deg, oklch(0.96 0.04 220 / 0.55), oklch(0.88 0.06 280 / 0.4));
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border-radius: 18px;
  border: 1px solid oklch(1 0 0 / 0.55);
  box-shadow: 0 24px 50px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.65);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}
.roycss-glass2-pricing-card::before {
  content: "";
  position: absolute;
  top: 16px; right: 16px;
  width: 60px; height: 22px;
  background: linear-gradient(135deg, oklch(0.85 0.22 30), oklch(0.65 0.24 320));
  border-radius: 6px;
  box-shadow: 0 4px 10px oklch(0 0 0 / 0.3);
}
.roycss-glass2-pricing-card::after {
  content: "";
  position: absolute;
  bottom: 16px; left: 16px;
  width: calc(100% - 32px);
  height: 40px;
  background: linear-gradient(135deg, oklch(0.7 0.18 280 / 0.8), oklch(0.55 0.22 320 / 0.8));
  border-radius: 10px;
  box-shadow: 0 6px 14px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.5),
              0 0 24px oklch(0.75 0.22 280 / 0.45);
  animation: roy-glass2-pricing-card 3s ease-in-out infinite;
}
@keyframes roy-glass2-pricing-card {
  0%, 100% { box-shadow: 0 6px 14px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.5), 0 0 24px oklch(0.75 0.22 280 / 0.45); }
  50%      { box-shadow: 0 6px 14px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.5), 0 0 36px oklch(0.85 0.22 320 / 0.65); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-glass2-pricing-card::after { animation: none; }
}`,
  },
] as unknown as CSSEffect[];
