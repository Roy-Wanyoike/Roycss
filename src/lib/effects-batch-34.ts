import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 34 — FerrumCSS Imports (29 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch34: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-zoom-in-down",
  name: "Zoom In Down",
  category: "animations",
  description: "An animated motion effect (zoom in down)",
  tags: ["zoom", "scale", "zoom-in-down", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-zoom-in-down {
  animation: roy-zoom-in-down 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: center top;
}

@keyframes roy-zoom-in-down {

  from {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, -1000px, 0);
  }
  60% {
    opacity: 1;
    transform: scale3d(0.6, 0.6, 0.6) translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: scale3d(1, 1, 1) translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-zoom-in-left",
  name: "Zoom In Left",
  category: "animations",
  description: "An animated motion effect (zoom in left)",
  tags: ["zoom", "scale", "zoom-in-left", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-zoom-in-left {
  animation: roy-zoom-in-left 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: left center;
}

@keyframes roy-zoom-in-left {

  from {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(-1000px, 0, 0);
  }
  60% {
    opacity: 1;
    transform: scale3d(0.6, 0.6, 0.6) translate3d(20px, 0, 0);
  }
  to {
    opacity: 1;
    transform: scale3d(1, 1, 1) translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-zoom-in-right",
  name: "Zoom In Right",
  category: "animations",
  description: "An animated motion effect (zoom in right)",
  tags: ["zoom", "scale", "zoom-in-right", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-zoom-in-right {
  animation: roy-zoom-in-right 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: right center;
}

@keyframes roy-zoom-in-right {

  from {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(1000px, 0, 0);
  }
  60% {
    opacity: 1;
    transform: scale3d(0.6, 0.6, 0.6) translate3d(-20px, 0, 0);
  }
  to {
    opacity: 1;
    transform: scale3d(1, 1, 1) translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-zoom-in-up",
  name: "Zoom In Up",
  category: "animations",
  description: "An animated motion effect (zoom in up)",
  tags: ["zoom", "scale", "zoom-in-up", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-zoom-in-up {
  animation: roy-zoom-in-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: center bottom;
}

@keyframes roy-zoom-in-up {

  from {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, 1000px, 0);
  }
  60% {
    opacity: 1;
    transform: scale3d(0.6, 0.6, 0.6) translate3d(0, -20px, 0);
  }
  to {
    opacity: 1;
    transform: scale3d(1, 1, 1) translate3d(0, 0, 0);
  }

}`,
},

{
  id: "ferrum-zoom-out-left",
  name: "Zoom Out Left",
  category: "animations",
  description: "An animated motion effect (zoom out left)",
  tags: ["zoom", "scale", "zoom-out-left", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-zoom-out-left {
  animation: roy-zoom-out-left 0.65s cubic-bezier(0.55, 0, 0.68, 0.53) both;
  transform-origin: left center;
}

@keyframes roy-zoom-out-left {

  40% {
    opacity: 1;
    transform: scale3d(0.7, 0.7, 0.7) translate3d(20px, 0, 0);
  }
  to {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(-1000px, 0, 0);
  }

}`,
},

{
  id: "ferrum-zoom-out-up",
  name: "Zoom Out Up",
  category: "animations",
  description: "An animated motion effect (zoom out up)",
  tags: ["zoom", "scale", "zoom-out-up", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-zoom-out-up {
  animation: roy-zoom-out-up 0.65s cubic-bezier(0.55, 0, 0.68, 0.53) both;
  transform-origin: center bottom;
}

@keyframes roy-zoom-out-up {

  40% {
    opacity: 1;
    transform: scale3d(0.7, 0.7, 0.7) translate3d(0, 20px, 0);
  }
  to {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 0.1) translate3d(0, -1000px, 0);
  }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-visual-frost-blur",
  name: "Frost Blur",
  category: "visual",
  description: "A visual filter or surface effect (frost blur)",
  tags: ["visual", "effect", "visual-frost-blur", "frost"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-frost-blur {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.685 0.131 226.94) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, oklch(0.652 0.241 354.31) 0%, transparent 50%),
    linear-gradient(135deg, oklch(0.566 0.245 278.69), oklch(0.769 0.188 70.08));
  overflow: hidden;
}`,
},

{
  id: "ferrum-visual-glass-reflection",
  name: "Glass Reflection",
  category: "visual",
  description: "A visual filter or surface effect (glass reflection)",
  tags: ["visual", "effect", "visual-glass-reflection", "glass"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-glass-reflection {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background:
    radial-gradient(circle at 30% 30%, oklch(0.652 0.241 354.31) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, oklch(0.685 0.131 226.94) 0%, transparent 50%),
    linear-gradient(135deg, oklch(0.566 0.245 278.69), oklch(0.769 0.188 70.08));
  overflow: hidden;
}`,
},

{
  id: "ferrum-visual-glitch-distort",
  name: "Glitch Distort",
  category: "visual",
  description: "A visual filter or surface effect (glitch distort)",
  tags: ["visual", "effect", "visual-glitch-distort", "glitch"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-glitch-distort {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, oklch(0.652 0.241 354.31), oklch(0.566 0.245 278.69), oklch(0.685 0.131 226.94));
  overflow: hidden;
}`,
},

{
  id: "ferrum-visual-gradient-mesh",
  name: "Gradient Mesh",
  category: "visual",
  description: "A visual filter or surface effect (gradient mesh)",
  tags: ["visual", "effect", "visual-gradient-mesh", "gradient", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-gradient-mesh {
  background:
    radial-gradient(at 20% 20%, oklch(0.652 0.241 354.31) 0px, transparent 50%),
    radial-gradient(at 80% 0%,  oklch(0.769 0.188 70.08) 0px, transparent 50%),
    radial-gradient(at 0% 50%,  oklch(0.566 0.245 278.69) 0px, transparent 50%),
    radial-gradient(at 80% 80%, oklch(0.685 0.131 226.94) 0px, transparent 50%),
    radial-gradient(at 50% 100%, oklch(0.723 0.191 149.06) 0px, transparent 50%),
    oklch(0.21 0.034 264.67);
  background-size: 200% 200%;
  animation: roy-visual-gradient-mesh 10s ease-in-out infinite;
}

@keyframes roy-visual-gradient-mesh {

  0%, 100% { background-position: 0% 0%; }
  25%      { background-position: 100% 50%; }
  50%      { background-position: 50% 100%; }
  75%      { background-position: 0% 50%; }

}`,
},

{
  id: "ferrum-visual-gradient-text-animated",
  name: "Gradient Text Animated",
  category: "visual",
  description: "A text effect that styles and animates letterforms (gradient text animated)",
  tags: ["visual", "effect", "visual-gradient-text-animated", "gradient", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-gradient-text-animated {
  background: linear-gradient(
    90deg,
    oklch(0.637 0.237 25.77),
    oklch(0.769 0.188 70.08),
    oklch(0.795 0.184 86.05),
    oklch(0.723 0.191 149.06),
    oklch(0.685 0.131 226.94),
    oklch(0.623 0.188 259.81),
    oklch(0.566 0.245 278.69),
    oklch(0.652 0.241 354.31),
    oklch(0.637 0.237 25.77)
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: roy-visual-gradient-text-animated 4s linear infinite;
}

@keyframes roy-visual-gradient-text-animated {

  to { background-position: 200% center; }

}`,
},

{
  id: "ferrum-visual-holographic",
  name: "Holographic",
  category: "visual",
  description: "A visual filter or surface effect (holographic)",
  tags: ["visual", "effect", "visual-holographic", "holographic", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-holographic {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(
    115deg,
    oklch(0.645 0.26 2.47) 0%,
    oklch(0.747 0.18 57.36) 14%,
    oklch(0.917 0.192 101.41) 28%,
    oklch(0.879 0.216 155.3) 42%,
    oklch(0.804 0.146 219.52) 56%,
    oklch(0.513 0.293 288.34) 70%,
    oklch(0.678 0.297 338.33) 84%,
    oklch(0.645 0.26 2.47) 100%
  );
  background-size: 300% 300%;
  overflow: hidden;
  animation: roy-visual-holographic-shift 6s ease infinite;
}

@keyframes roy-visual-holographic-shift {

  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }

}`,
},

{
  id: "ferrum-visual-hue-rotate-loop",
  name: "Hue Rotate Loop",
  category: "visual",
  description: "A visual filter or surface effect (hue rotate loop)",
  tags: ["visual", "effect", "visual-hue-rotate-loop", "hue", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-hue-rotate-loop {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: conic-gradient(
    from 0deg,
    oklch(0.637 0.237 25.77),
    oklch(0.769 0.188 70.08),
    oklch(0.795 0.184 86.05),
    oklch(0.723 0.191 149.06),
    oklch(0.685 0.131 226.94),
    oklch(0.623 0.188 259.81),
    oklch(0.566 0.245 278.69),
    oklch(0.652 0.241 354.31),
    oklch(0.637 0.237 25.77)
  );
  animation: roy-visual-hue-rotate-loop 4s linear infinite;
}

@keyframes roy-visual-hue-rotate-loop {

  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(360deg); }

}`,
},

{
  id: "ferrum-visual-image-distortion",
  name: "Image Distortion",
  category: "visual",
  description: "A visual filter or surface effect (image distortion)",
  tags: ["visual", "effect", "visual-image-distortion", "image", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-image-distortion {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, oklch(0.769 0.188 70.08), oklch(0.652 0.241 354.31), oklch(0.566 0.245 278.69), oklch(0.685 0.131 226.94));
  animation: roy-visual-image-distortion 2.4s ease-in-out infinite;
}

@keyframes roy-visual-image-distortion {

  0%, 100% {
    filter: blur(0px);
    transform: skew(0deg, 0deg) scale(1);
  }
  20% {
    filter: blur(0.5px);
    transform: skew(2deg, 1deg) scale(1.01);
  }
  40% {
    filter: blur(1px);
    transform: skew(-2deg, -1deg) scale(0.99);
  }
  60% {
    filter: blur(0.5px);
    transform: skew(1deg, 2deg) scale(1.01);
  }
  80% {
    filter: blur(0px);
    transform: skew(-1deg, -2deg) scale(1);
  }

}`,
},

{
  id: "ferrum-visual-inner-glow",
  name: "Inner Glow",
  category: "visual",
  description: "A visual filter or surface effect (inner glow)",
  tags: ["visual", "effect", "visual-inner-glow", "inner", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-inner-glow {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: oklch(0.21 0.034 264.67);
  border: none;
  animation: roy-visual-inner-glow 2.6s ease-in-out infinite;
}

@keyframes roy-visual-inner-glow {

  0%, 100% {
    box-shadow:
      inset 0 0 20px color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent),
      inset 0 0 40px color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
  }
  50% {
    box-shadow:
      inset 0 0 50px color-mix(in oklch, oklch(0.696 0.149 162.48) 70%, transparent),
      inset 0 0 100px color-mix(in oklch, oklch(0.696 0.149 162.48) 35%, transparent);
  }

}`,
},

{
  id: "ferrum-visual-iridescent",
  name: "Iridescent",
  category: "visual",
  description: "A visual filter or surface effect (iridescent)",
  tags: ["visual", "effect", "visual-iridescent", "iridescent", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-iridescent {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: conic-gradient(
    from 0deg at 50% 50%,
    oklch(0.645 0.26 2.47),
    oklch(0.747 0.18 57.36),
    oklch(0.917 0.192 101.41),
    oklch(0.879 0.216 155.3),
    oklch(0.804 0.146 219.52),
    oklch(0.513 0.293 288.34),
    oklch(0.678 0.297 338.33),
    oklch(0.645 0.26 2.47)
  );
  animation: roy-visual-iridescent 8s linear infinite;
  overflow: hidden;
}

@keyframes roy-visual-iridescent {

  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(360deg); }

}`,
},

{
  id: "ferrum-visual-liquid-fill",
  name: "Liquid Fill",
  category: "visual",
  description: "A visual filter or surface effect (liquid fill)",
  tags: ["visual", "effect", "visual-liquid-fill", "liquid"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-liquid-fill {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: oklch(0.21 0.034 264.67);
  border: none;
  overflow: hidden;
}`,
},

{
  id: "ferrum-visual-mask-fade",
  name: "Mask Fade",
  category: "visual",
  description: "A visual filter or surface effect (mask fade)",
  tags: ["visual", "effect", "visual-mask-fade", "mask", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-mask-fade {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, oklch(0.652 0.241 354.31), oklch(0.566 0.245 278.69), oklch(0.685 0.131 226.94));
  -webkit-mask: linear-gradient(180deg, transparent 0%, oklch(0 0 0) 50%, transparent 100%) no-repeat;
  mask: linear-gradient(180deg, transparent 0%, oklch(0 0 0) 50%, transparent 100%) no-repeat;
  -webkit-mask-size: 100% 200%;
  mask-size: 100% 200%;
  animation: roy-visual-mask-fade 3s ease-in-out infinite alternate;
}

@keyframes roy-visual-mask-fade {

  from {
    -webkit-mask-position: 0% 0%;
    mask-position: 0% 0%;
  }
  to {
    -webkit-mask-position: 0% 100%;
    mask-position: 0% 100%;
  }

}`,
},

{
  id: "ferrum-visual-metallic",
  name: "Metallic",
  category: "visual",
  description: "A visual filter or surface effect (metallic)",
  tags: ["visual", "effect", "visual-metallic", "metallic"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-metallic {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background:
    linear-gradient(
      180deg,
      oklch(0.97 0.0 89.88) 0%,
      oklch(0.86 0.011 286.17) 14%,
      oklch(0.708 0.012 286.1) 28%,
      oklch(0.602 0.012 286.03) 42%,
      oklch(0.81 0.011 286.15) 58%,
      oklch(0.957 0.007 286.27) 74%,
      oklch(0.76 0.011 286.13) 88%,
      oklch(0.86 0.011 286.17) 100%
    );
  overflow: hidden;
  box-shadow:
    inset 0 2px 4px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    inset 0 -2px 4px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}`,
},

{
  id: "ferrum-visual-neon-pulse",
  name: "Neon Pulse",
  category: "visual",
  description: "A visual filter or surface effect (neon pulse)",
  tags: ["visual", "effect", "visual-neon-pulse", "neon", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-neon-pulse {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: oklch(0.147 0.011 285.01);
  border: 2px solid oklch(0.652 0.241 354.31);
  animation: roy-visual-neon-pulse 1.6s ease-in-out infinite;
}

@keyframes roy-visual-neon-pulse {

  0%, 100% {
    box-shadow:
      0 0 6px oklch(0.652 0.241 354.31),
      0 0 12px oklch(0.652 0.241 354.31),
      0 0 24px oklch(0.652 0.241 354.31),
      inset 0 0 8px oklch(0.652 0.241 354.31),
      inset 0 0 16px color-mix(in oklch, oklch(0.652 0.241 354.31) 50%, transparent);
    border-color: oklch(0.652 0.241 354.31);
  }
  50% {
    box-shadow:
      0 0 16px oklch(0.652 0.241 354.31),
      0 0 36px oklch(0.652 0.241 354.31),
      0 0 60px oklch(0.652 0.241 354.31),
      inset 0 0 18px oklch(0.652 0.241 354.31),
      inset 0 0 36px color-mix(in oklch, oklch(0.652 0.241 354.31) 75%, transparent);
    border-color: oklch(0.725 0.175 349.76);
  }

}`,
},

{
  id: "ferrum-visual-noise-overlay",
  name: "Noise Overlay",
  category: "visual",
  description: "A visual filter or surface effect (noise overlay)",
  tags: ["visual", "effect", "visual-noise-overlay", "noise"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-noise-overlay {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, oklch(0.27 0.04 260.03), oklch(0.21 0.034 264.67));
  overflow: hidden;
}`,
},

{
  id: "ferrum-visual-pixelate",
  name: "Pixelate",
  category: "visual",
  description: "A visual filter or surface effect (pixelate)",
  tags: ["visual", "effect", "visual-pixelate", "pixelate"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-pixelate {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, oklch(0.769 0.188 70.08), oklch(0.652 0.241 354.31), oklch(0.566 0.245 278.69), oklch(0.685 0.131 226.94));
  overflow: hidden;
}`,
},

{
  id: "ferrum-visual-prism",
  name: "Prism",
  category: "visual",
  description: "A visual filter or surface effect (prism)",
  tags: ["visual", "effect", "visual-prism", "prism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-prism {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: radial-gradient(circle at 50% 50%, oklch(0.228 0.038 282.93) 0%, oklch(0.147 0.011 285.01) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}`,
},

{
  id: "ferrum-visual-saturation-pulse",
  name: "Saturation Pulse",
  category: "visual",
  description: "A visual filter or surface effect (saturation pulse)",
  tags: ["visual", "effect", "visual-saturation-pulse", "saturation", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-saturation-pulse {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, oklch(0.652 0.241 354.31), oklch(0.769 0.188 70.08), oklch(0.685 0.131 226.94));
  animation: roy-visual-saturation-pulse 2.4s ease-in-out infinite;
}

@keyframes roy-visual-saturation-pulse {

  0%, 100% { filter: saturate(0); }
  50%      { filter: saturate(2.6); }

}`,
},

{
  id: "ferrum-visual-shadow-pulse",
  name: "Shadow Pulse",
  category: "visual",
  description: "A visual filter or surface effect (shadow pulse)",
  tags: ["visual", "effect", "visual-shadow-pulse", "shadow", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-shadow-pulse {
  width: 140px;
  height: 100px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.566 0.245 278.69), oklch(0.652 0.241 354.31));
  border: none;
  animation: roy-visual-shadow-pulse 2s ease-in-out infinite;
}

@keyframes roy-visual-shadow-pulse {

  0%, 100% {
    box-shadow: 0 4px 12px color-mix(in oklch, oklch(0.566 0.245 278.69) 30%, transparent);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 14px 38px color-mix(in oklch, oklch(0.652 0.241 354.31) 60%, transparent);
    transform: scale(1.04);
  }

}`,
},

{
  id: "ferrum-visual-shimmer-sweep",
  name: "Shimmer Sweep",
  category: "visual",
  description: "A visual filter or surface effect (shimmer sweep)",
  tags: ["visual", "effect", "visual-shimmer-sweep", "shimmer"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-shimmer-sweep {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, oklch(0.27 0.04 260.03), oklch(0.39 0.04 257.29));
  overflow: hidden;
}`,
},

{
  id: "ferrum-visual-spotlight-follow",
  name: "Spotlight Follow",
  category: "visual",
  description: "A visual filter or surface effect (spotlight follow)",
  tags: ["visual", "effect", "visual-spotlight-follow", "spotlight"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-spotlight-follow {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: oklch(0.147 0.011 285.01);
  border: none;
  overflow: hidden;
}`,
},

{
  id: "ferrum-water-ripple",
  name: "Water Ripple",
  category: "visual",
  description: "A water ripple effect",
  tags: ["water-ripple", "ripple"],
  previewType: "box",
  cssCode: `.roycss-ferrum-water-ripple {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.723 0.107 226.27) 0%, oklch(0.495 0.09 232.27) 70%, oklch(0.347 0.065 233.52) 100%);
  overflow: hidden;
}`,
},

{
  id: "ferrum-watercolor",
  name: "Watercolor",
  category: "visual",
  description: "A watercolor effect",
  tags: ["watercolor"],
  previewType: "box",
  cssCode: `.roycss-ferrum-watercolor {
  width: 100%;
  min-height: 240px;
  background:
    radial-gradient(ellipse 50% 40% at 25% 35%, color-mix(in oklch, oklch(0.791 0.13 2.1) 70%, transparent), transparent 60%),
    radial-gradient(ellipse 45% 35% at 70% 30%, color-mix(in oklch, oklch(0.818 0.094 251.36) 65%, transparent), transparent 65%),
    radial-gradient(ellipse 55% 40% at 60% 75%, color-mix(in oklch, oklch(0.904 0.126 90.5) 60%, transparent), transparent 60%),
    radial-gradient(ellipse 35% 30% at 30% 80%, color-mix(in oklch, oklch(0.932 0.125 144.49) 55%, transparent), transparent 65%),
    radial-gradient(ellipse 30% 25% at 85% 65%, color-mix(in oklch, oklch(0.78 0.161 313.74) 55%, transparent), transparent 65%),
    linear-gradient(135deg, oklch(0.974 0.011 84.58) 0%, oklch(0.933 0.023 84.59) 100%);
  background-blend-mode: multiply, multiply, multiply, multiply, multiply, normal;
  filter: blur(0.5px) contrast(0.95);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}`,
},

];
