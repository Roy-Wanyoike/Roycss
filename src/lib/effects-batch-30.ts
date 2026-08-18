import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 30 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch30: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // LOADERS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-loader-bouncing-grid",
  name: "Bouncing Grid",
  category: "loaders",
  description: "A loading indicator with cyclical motion (bouncing grid)",
  tags: ["loader", "spinner", "loader-bouncing-grid", "bouncing"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-bouncing-grid {
  width: 42px;
  height: 42px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 3px;
}`,
},

{
  id: "ferrum-loader-chasing-dots",
  name: "Chasing Dots",
  category: "loaders",
  description: "A loading indicator with cyclical motion (chasing dots)",
  tags: ["loader", "spinner", "loader-chasing-dots", "chasing", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-chasing-dots {
  width: 40px;
  height: 40px;
  position: relative;
  animation: roy-chasing-rotate 2s infinite linear;
}

@keyframes roy-chasing-rotate {

  100% { transform: rotate(360deg); }

}`,
},

{
  id: "ferrum-loader-circle-notch",
  name: "Circle Notch",
  category: "loaders",
  description: "A loading indicator with cyclical motion (circle notch)",
  tags: ["loader", "spinner", "loader-circle-notch", "circle", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-circle-notch {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 4px solid oklch(0.696 0.149 162.48);
  border-top-color: transparent;
  border-left-color: transparent;
  animation: roy-circle-notch 0.9s linear infinite;
}

@keyframes roy-circle-notch {

  0% { transform: rotate(0deg); }
  60% { transform: rotate(280deg); }
  100% { transform: rotate(360deg); }

}`,
},

{
  id: "ferrum-loader-dual-ring",
  name: "Dual Ring",
  category: "loaders",
  description: "A loading indicator with cyclical motion (dual ring)",
  tags: ["loader", "spinner", "loader-dual-ring", "dual", "animated"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-dual-ring {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 4px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
  border-top-color: oklch(0.696 0.149 162.48);
  border-bottom-color: oklch(0.685 0.131 226.94);
  animation: roy-dual-ring-spin 1.2s linear infinite;
}

@keyframes roy-dual-ring-spin {

  to { transform: rotate(360deg); }

}`,
},

{
  id: "ferrum-loader-fading-dots",
  name: "Fading Dots",
  category: "loaders",
  description: "A loading indicator with cyclical motion (fading dots)",
  tags: ["loader", "spinner", "loader-fading-dots", "fading"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-fading-dots {
  width: 80px;
  text-align: center;
}`,
},

{
  id: "ferrum-loader-folding-cube",
  name: "Folding Cube",
  category: "loaders",
  description: "A loading indicator with cyclical motion (folding cube)",
  tags: ["loader", "spinner", "loader-folding-cube", "folding"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-folding-cube {
  width: 40px;
  height: 40px;
  position: relative;
  transform: rotateZ(45deg);
}`,
},

{
  id: "ferrum-loader-indeterminate",
  name: "Indeterminate",
  category: "loaders",
  description: "A loading indicator with cyclical motion (indeterminate)",
  tags: ["loader", "spinner", "loader-indeterminate", "indeterminate"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-indeterminate {
  width: 200px;
  height: 4px;
  background-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}`,
},

{
  id: "ferrum-loader-line-scale",
  name: "Line Scale",
  category: "loaders",
  description: "A loading indicator with cyclical motion (line scale)",
  tags: ["loader", "spinner", "loader-line-scale", "line"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-line-scale {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 40px;
}`,
},

{
  id: "ferrum-loader-pacman",
  name: "Pacman",
  category: "loaders",
  description: "A loading indicator with cyclical motion (pacman)",
  tags: ["loader", "spinner", "loader-pacman", "pacman"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-pacman {
  position: relative;
  width: 60px;
  height: 40px;
}`,
},

{
  id: "ferrum-loader-progress-bar",
  name: "Progress Bar",
  category: "loaders",
  description: "A loading indicator with cyclical motion (progress bar)",
  tags: ["loader", "spinner", "loader-progress-bar", "progress"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-progress-bar {
  width: 200px;
  height: 8px;
  background-color: color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}`,
},

{
  id: "ferrum-loader-pulse-ring",
  name: "Pulse Ring",
  category: "loaders",
  description: "A loading indicator with cyclical motion (pulse ring)",
  tags: ["loader", "spinner", "loader-pulse-ring", "pulse"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-pulse-ring {
  width: 40px;
  height: 40px;
  position: relative;
}`,
},

{
  id: "ferrum-loader-skeleton",
  name: "Skeleton",
  category: "loaders",
  description: "A loading indicator with cyclical motion (skeleton)",
  tags: ["loader", "spinner", "loader-skeleton", "skeleton"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-skeleton {
  width: 200px;
  height: 12px;
  background-color: color-mix(in oklch, oklch(1 0 0) 6%, transparent);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}`,
},

{
  id: "ferrum-loader-three-bounce",
  name: "Three Bounce",
  category: "loaders",
  description: "A loading indicator with cyclical motion (three bounce)",
  tags: ["loader", "spinner", "loader-three-bounce", "three"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-three-bounce {
  width: 80px;
  text-align: center;
}`,
},

{
  id: "ferrum-loader-whale",
  name: "Whale",
  category: "loaders",
  description: "A loading indicator with cyclical motion (whale)",
  tags: ["loader", "spinner", "loader-whale", "whale"],
  previewType: "loader",
  cssCode: `.roycss-ferrum-loader-whale {
  width: 50px;
  height: 40px;
  position: relative;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // MICROINTERACTIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-micro-accordion-expand",
  name: "Micro Accordion Expand",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro accordion expand)",
  tags: ["micro-accordion-expand", "accordion"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-accordion-expand {
  position: relative;
  width: 140px;
  height: 90px;
  background: oklch(1 0 0);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px color-mix(in oklch, oklch(0 0 0) 10%, transparent);
}`,
},

{
  id: "ferrum-micro-badge-bounce",
  name: "Micro Badge Bounce",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro badge bounce)",
  tags: ["micro-badge-bounce", "badge"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-badge-bounce {
  position: relative;
  width: 64px;
  height: 64px;
  background: oklch(0.968 0.007 247.9);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px color-mix(in oklch, oklch(0 0 0) 8%, transparent);
}`,
},

{
  id: "ferrum-micro-checkbox-check",
  name: "Micro Checkbox Check",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro checkbox check)",
  tags: ["micro-checkbox-check", "checkbox"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-checkbox-check {
  position: relative;
  width: 38px;
  height: 38px;
  background: oklch(1 0 0);
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
}`,
},

{
  id: "ferrum-micro-dropdown-reveal",
  name: "Micro Dropdown Reveal",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro dropdown reveal)",
  tags: ["micro-dropdown-reveal", "dropdown"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-dropdown-reveal {
  position: relative;
  width: 120px;
  height: 90px;
}`,
},

{
  id: "ferrum-micro-fab-expand",
  name: "Micro Fab Expand",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro fab expand)",
  tags: ["micro-fab-expand", "fab"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-fab-expand {
  position: relative;
  width: 150px;
  height: 90px;
}`,
},

{
  id: "ferrum-micro-modal-scale",
  name: "Micro Modal Scale",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro modal scale)",
  tags: ["micro-modal-scale", "modal"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-modal-scale {
  position: relative;
  width: 150px;
  height: 90px;
  overflow: hidden;
  border-radius: 8px;
  background: oklch(0.968 0.007 247.9);
}`,
},

{
  id: "ferrum-micro-progress-fill",
  name: "Micro Progress Fill",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro progress fill)",
  tags: ["micro-progress-fill", "progress"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-progress-fill {
  position: relative;
  width: 140px;
  height: 14px;
  background: oklch(0.929 0.013 255.51);
  border-radius: 7px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px color-mix(in oklch, oklch(0 0 0) 10%, transparent);
}`,
},

{
  id: "ferrum-micro-radio-select",
  name: "Micro Radio Select",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro radio select)",
  tags: ["micro-radio-select", "radio"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-radio-select {
  position: relative;
  width: 38px;
  height: 38px;
  background: oklch(1 0 0);
  border: 2px solid oklch(0.696 0.149 162.48);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
}`,
},

{
  id: "ferrum-micro-tab-indicator",
  name: "Micro Tab Indicator",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro tab indicator)",
  tags: ["micro-tab-indicator", "tab"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-tab-indicator {
  position: relative;
  width: 150px;
  height: 50px;
}`,
},

{
  id: "ferrum-micro-toast-slide",
  name: "Micro Toast Slide",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro toast slide)",
  tags: ["micro-toast-slide", "toast"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-toast-slide {
  position: relative;
  width: 150px;
  height: 80px;
  overflow: hidden;
  border-radius: 8px;
}`,
},

{
  id: "ferrum-micro-toggle-switch",
  name: "Micro Toggle Switch",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (micro toggle switch)",
  tags: ["micro-toggle-switch", "toggle", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-micro-toggle-switch {
  position: relative;
  width: 56px;
  height: 30px;
  background: oklch(0.869 0.02 252.89);
  border-radius: 15px;
  box-shadow: inset 0 2px 4px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  animation: roy-micro-toggle-bg 3s ease-in-out infinite;
}

@keyframes roy-micro-toggle-bg {

  0%, 45%   { background: oklch(0.869 0.02 252.89); }
  55%, 100% { background: oklch(0.696 0.149 162.48); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-linear-dark-surface",
  name: "Linear Dark Surface",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear dark surface)",
  tags: ["linear-dark-surface", "dark"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-dark-surface {
  background: linear-gradient(180deg, oklch(0.21 0.006 285.89) 0%, oklch(0.169 0.002 286.18) 100%);
  color: oklch(0.92 0.004 286.32);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 12px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 0) 4%, transparent) inset,
    0 4px 16px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}`,
},

{
  id: "ferrum-linear-depth-shadow",
  name: "Linear Depth Shadow",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear depth shadow)",
  tags: ["linear-depth-shadow", "depth"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-depth-shadow {
  background: oklch(0.21 0.006 285.89);
  color: oklch(0.985 0.0 89.88);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 12px;
  box-shadow: 0 1px 2px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  transition: box-shadow 0.4s ease, transform 0.4s ease;
}`,
},

{
  id: "ferrum-linear-glow-border",
  name: "Linear Glow Border",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear glow border)",
  tags: ["linear-glow-border", "glow"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-glow-border {
  position: relative;
  background: oklch(0.179 0.004 285.98);
  color: oklch(0.985 0.0 89.88);
  border-radius: 12px;
  z-index: 0;
}`,
},

{
  id: "ferrum-linear-gradient-mesh-bg",
  name: "Linear Gradient Mesh Bg",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear gradient mesh bg)",
  tags: ["linear-gradient-mesh-bg", "gradient", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-gradient-mesh-bg {
  background-color: oklch(0.145 0.002 286.13);
  background-image:
    radial-gradient(at 20% 20%, color-mix(in oklch, oklch(0.567 0.159 275.21) 35%, transparent) 0px, transparent 50%),
    radial-gradient(at 80% 10%, color-mix(in oklch, oklch(0.566 0.245 278.69) 30%, transparent) 0px, transparent 50%),
    radial-gradient(at 70% 80%, color-mix(in oklch, oklch(0.652 0.241 354.31) 25%, transparent) 0px, transparent 50%),
    radial-gradient(at 10% 90%, color-mix(in oklch, oklch(0.623 0.188 259.81) 25%, transparent) 0px, transparent 50%);
  background-size: 200% 200%;
  animation: roy-mesh-drift 18s ease-in-out infinite;
}

@keyframes roy-mesh-drift {

  0%, 100% { background-position: 0% 0%, 100% 0%, 100% 100%, 0% 100%; }
  50% { background-position: 30% 30%, 70% 20%, 60% 70%, 20% 80%; }

}`,
},

{
  id: "ferrum-linear-gradient-sweep",
  name: "Linear Gradient Sweep",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear gradient sweep)",
  tags: ["linear-gradient-sweep", "gradient"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-gradient-sweep {
  position: relative;
  background: oklch(0.21 0.006 285.89);
  color: oklch(0.985 0.0 89.88);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 8px;
  overflow: hidden;
  z-index: 0;
}`,
},

{
  id: "ferrum-linear-icon-bounce",
  name: "Linear Icon Bounce",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear icon bounce)",
  tags: ["linear-icon-bounce", "icon"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-icon-bounce {
  background: oklch(0.21 0.006 285.89);
  color: oklch(0.985 0.0 89.88);
  border: 1px solid oklch(0.274 0.005 286.03);
  border-radius: 8px;
  transition: background-color 0.25s ease, border-color 0.25s ease;
}`,
},

{
  id: "ferrum-linear-magnetic-pull",
  name: "Linear Magnetic Pull",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear magnetic pull)",
  tags: ["linear-magnetic-pull", "magnetic"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-magnetic-pull {
  background: oklch(0.567 0.159 275.21);
  color: oklch(1 0 0);
  border-radius: 8px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}`,
},

{
  id: "ferrum-linear-noise-overlay",
  name: "Linear Noise Overlay",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear noise overlay)",
  tags: ["linear-noise-overlay", "noise"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-noise-overlay {
  position: relative;
  background: oklch(0.145 0.002 286.13);
  color: oklch(0.92 0.004 286.32);
  border: 1px solid oklch(0.219 0.006 285.91);
  border-radius: 10px;
  overflow: hidden;
}`,
},

{
  id: "ferrum-linear-shimmer-hover",
  name: "Linear Shimmer Hover",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear shimmer hover)",
  tags: ["linear-shimmer-hover", "shimmer"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-shimmer-hover {
  position: relative;
  background: oklch(0.169 0.002 286.18);
  color: oklch(0.92 0.004 286.32);
  overflow: hidden;
  border: 1px solid oklch(0.274 0.005 286.03);
}`,
},

{
  id: "ferrum-linear-spotlight",
  name: "Linear Spotlight",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear spotlight)",
  tags: ["linear-spotlight", "spotlight"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-spotlight {
  position: relative;
  background: oklch(0.16 0.004 285.92);
  color: oklch(0.92 0.004 286.32);
  border: 1px solid oklch(0.241 0.008 285.82);
  border-radius: 12px;
  overflow: hidden;
}`,
},

{
  id: "ferrum-linear-text-glow",
  name: "Linear Text Glow",
  category: "visual",
  description: "A Linear-inspired design-system effect (linear text glow)",
  tags: ["linear-text-glow", "text"],
  previewType: "box",
  cssCode: `.roycss-ferrum-linear-text-glow {
  color: oklch(0.712 0.013 286.07);
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}`,
},

{
  id: "ferrum-liquid-drop",
  name: "Liquid Drop",
  category: "visual",
  description: "A liquid drop effect",
  tags: ["liquid-drop", "drop"],
  previewType: "box",
  cssCode: `.roycss-ferrum-liquid-drop {
  position: relative;
  width: 180px;
  height: 200px;
  background: linear-gradient(180deg, oklch(0.495 0.09 232.27) 0%, oklch(0.347 0.065 233.52) 100%);
  overflow: hidden;
  border-radius: 8px;
}`,
},

{
  id: "ferrum-liquid-metal",
  name: "Liquid Metal",
  category: "visual",
  description: "An animated motion effect (liquid metal)",
  tags: ["liquid-metal", "metal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-liquid-metal {
  position: relative;
  width: 200px;
  height: 160px;
  border-radius: 50% 50% 45% 55% / 60% 55% 45% 40%;
  background:
    radial-gradient(ellipse 60% 40% at 30% 25%, color-mix(in oklch, oklch(1 0 0) 95%, transparent), transparent 60%),
    radial-gradient(ellipse 50% 35% at 70% 70%, color-mix(in oklch, oklch(0.603 0.026 258.37) 60%, transparent), transparent 65%),
    linear-gradient(125deg,
      oklch(0.89 0.011 256.7) 0%,
      oklch(0.972 0.005 258.32) 12%,
      oklch(0.652 0.016 260.72) 26%,
      oklch(0.944 0.008 253.85) 40%,
      oklch(0.505 0.021 261.29) 52%,
      oklch(0.85 0.012 259.82) 66%,
      oklch(0.382 0.017 262.29) 78%,
      oklch(0.756 0.016 260.73) 90%,
      oklch(0.55 0.029 264.67) 100%);
  background-size: 200% 200%;
  box-shadow:
    inset -8px -10px 20px color-mix(in oklch, oklch(0 0 0) 45%, transparent),
    inset 8px 10px 18px color-mix(in oklch, oklch(1 0 0) 55%, transparent),
    0 14px 30px color-mix(in oklch, oklch(0 0 0) 35%, transparent);
  filter: contrast(1.15) saturate(0.85);
  animation: roy-b11-liquid-metal-flow 7s ease-in-out infinite;
}

@keyframes roy-b11-liquid-metal-flow {

  0%, 100% { background-position: 0% 0%; border-radius: 50% 50% 45% 55% / 60% 55% 45% 40%; }
  33%      { background-position: 100% 50%; border-radius: 55% 45% 50% 50% / 45% 55% 50% 50%; }
  66%      { background-position: 50% 100%; border-radius: 45% 55% 60% 40% / 55% 45% 60% 40%; }

}`,
},

{
  id: "ferrum-material-container-transform",
  name: "Material Container Transform",
  category: "visual",
  description: "A Material Design motion or surface effect (material container transform)",
  tags: ["material-container-transform", "container", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-container-transform {
  animation: roy-mat-container 0.6s cubic-bezier(0.2, 0, 0, 1) both;
  transform-origin: center;
}

@keyframes roy-mat-container {

  0% { opacity: 0; transform: scaleX(0.2) scaleY(0.1); border-radius: 32px; }
  40% { opacity: 1; transform: scaleX(1.05) scaleY(0.7); border-radius: 18px; }
  100% { opacity: 1; transform: scale(1); border-radius: 8px; }

}`,
},

{
  id: "ferrum-material-elevation-1",
  name: "Material Elevation 1",
  category: "visual",
  description: "A Material Design motion or surface effect (material elevation 1)",
  tags: ["material-elevation-1", "elevation"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-elevation-1 {
  background: oklch(0.992 0.006 333.98);
  color: oklch(0.225 0.008 297.21);
  border-radius: 12px;
  box-shadow:
    0px 1px 2px color-mix(in oklch, oklch(0 0 0) 30%, transparent),
    0px 1px 3px 1px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
}`,
},

{
  id: "ferrum-material-elevation-3",
  name: "Material Elevation 3",
  category: "visual",
  description: "A Material Design motion or surface effect (material elevation 3)",
  tags: ["material-elevation-3", "elevation"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-elevation-3 {
  background: oklch(0.992 0.006 333.98);
  color: oklch(0.225 0.008 297.21);
  border-radius: 16px;
  box-shadow:
    0px 1px 3px color-mix(in oklch, oklch(0 0 0) 30%, transparent),
    0px 4px 8px 3px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
}`,
},

{
  id: "ferrum-material-elevation-5",
  name: "Material Elevation 5",
  category: "visual",
  description: "A Material Design motion or surface effect (material elevation 5)",
  tags: ["material-elevation-5", "elevation"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-elevation-5 {
  background: oklch(0.992 0.006 333.98);
  color: oklch(0.225 0.008 297.21);
  border-radius: 28px;
  box-shadow:
    0px 1px 3px color-mix(in oklch, oklch(0 0 0) 30%, transparent),
    0px 14px 28px 5px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}`,
},

{
  id: "ferrum-material-emphasized",
  name: "Material Emphasized",
  category: "visual",
  description: "A Material Design motion or surface effect (material emphasized)",
  tags: ["material-emphasized", "emphasized", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-emphasized {
  animation: roy-mat-emphasized 0.5s cubic-bezier(0.2, 0, 0, 1) both;
}

@keyframes roy-mat-emphasized {

  0% { opacity: 0; transform: scale(0.85); }
  100% { opacity: 1; transform: scale(1); }

}`,
},

{
  id: "ferrum-material-emphasized-decel",
  name: "Material Emphasized Decel",
  category: "visual",
  description: "A Material Design motion or surface effect (material emphasized decel)",
  tags: ["material-emphasized-decel", "emphasized", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-emphasized-decel {
  animation: roy-mat-emph-decel 0.45s cubic-bezier(0.05, 0.7, 0.1, 1) both;
}

@keyframes roy-mat-emph-decel {

  0% { opacity: 0; transform: translateY(24px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }

}`,
},

{
  id: "ferrum-material-fab-scale",
  name: "Material Fab Scale",
  category: "visual",
  description: "A Material Design motion or surface effect (material fab scale)",
  tags: ["material-fab-scale", "fab", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-fab-scale {
  animation: roy-mat-fab-scale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  border-radius: 16px;
  background: oklch(0.496 0.13 293.71);
  color: oklch(1 0 0);
}

@keyframes roy-mat-fab-scale {

  0% { opacity: 0; transform: scale(0) rotate(-45deg); }
  60% { opacity: 1; transform: scale(1.1) rotate(5deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }

}`,
},

{
  id: "ferrum-material-spring-down",
  name: "Material Spring Down",
  category: "visual",
  description: "A Material Design motion or surface effect (material spring down)",
  tags: ["material-spring-down", "spring", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-spring-down {
  animation: roy-mat-spring-down 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-mat-spring-down {

  0% { opacity: 1; transform: translateY(0) scale(1); }
  40% { opacity: 1; transform: translateY(12px) scale(1.04, 0.96); }
  100% { opacity: 0; transform: translateY(80px) scale(0.7); }

}`,
},

{
  id: "ferrum-material-spring-up",
  name: "Material Spring Up",
  category: "visual",
  description: "A Material Design motion or surface effect (material spring up)",
  tags: ["material-spring-up", "spring", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-spring-up {
  animation: roy-mat-spring-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-mat-spring-up {

  0% { opacity: 0; transform: translateY(40px) scale(0.8); }
  60% { opacity: 1; transform: translateY(-8px) scale(1.05); }
  100% { opacity: 1; transform: translateY(0) scale(1); }

}`,
},

{
  id: "ferrum-material-state-layer",
  name: "Material State Layer",
  category: "visual",
  description: "A Material Design motion or surface effect (material state layer)",
  tags: ["material-state-layer", "state"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-state-layer {
  position: relative;
  background: oklch(0.496 0.13 293.71);
  color: oklch(1 0 0);
}`,
},

{
  id: "ferrum-material-state-layer-surface",
  name: "Material State Layer Surface",
  category: "visual",
  description: "A Material Design motion or surface effect (material state layer surface)",
  tags: ["material-state-layer-surface", "state"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-state-layer-surface {
  position: relative;
  background: oklch(0.225 0.008 297.21);
  color: oklch(0.915 0.008 332.13);
  border-radius: 12px;
  overflow: hidden;
}`,
},

{
  id: "ferrum-material-surface-tint",
  name: "Material Surface Tint",
  category: "visual",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["material-surface-tint", "surface", "glassmorphism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-material-surface-tint {
  position: relative;
  background: color-mix(in oklch, oklch(0.496 0.13 293.71) 8%, transparent);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid color-mix(in oklch, oklch(0.496 0.13 293.71) 15%, transparent);
  border-radius: 16px;
  color: oklch(0.225 0.008 297.21);
  box-shadow:
    0 1px 2px color-mix(in oklch, oklch(0 0 0) 10%, transparent),
    0 4px 12px color-mix(in oklch, oklch(0.496 0.13 293.71) 8%, transparent);
}`,
},

];
