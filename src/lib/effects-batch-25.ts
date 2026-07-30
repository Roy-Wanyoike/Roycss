import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 25 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch25: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // 3D-TRANSFORMS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-3d-book",
  name: "3D Book",
  category: "3d-transforms",
  description: "A 3D transform effect with perspective and depth",
  tags: ["3d", "transform", "3d-book", "book"],
  previewType: "box",
  cssCode: `.roycss-ferrum-3d-book {
  perspective: 800px;
  width: 60px;
  height: 80px;
  position: relative;
  transform-style: preserve-3d;
  transform: rotateY(-25deg);
  transition: transform 0.6s ease;
}`,
},

{
  id: "ferrum-3d-gallery",
  name: "3D Gallery",
  category: "3d-transforms",
  description: "A 3D transform effect with perspective and depth",
  tags: ["3d", "transform", "3d-gallery", "gallery", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-3d-gallery {
  perspective: 1000px;
  width: 80px;
  height: 60px;
  position: relative;
  transform-style: preserve-3d;
  animation: roy-3d-gallery-rotate 8s linear infinite;
}

@keyframes roy-3d-gallery-rotate {

  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }

}`,
},

{
  id: "ferrum-3d-poster",
  name: "3D Poster",
  category: "3d-transforms",
  description: "A 3D transform effect with perspective and depth",
  tags: ["3d", "transform", "3d-poster", "poster"],
  previewType: "box",
  cssCode: `.roycss-ferrum-3d-poster {
  perspective: 1000px;
  width: 80px;
  height: 100px;
  background:
    linear-gradient(135deg, color-mix(in oklch, oklch(1 0 0) 10%, transparent), transparent),
    linear-gradient(135deg, oklch(0.566 0.245 278.69), oklch(0.652 0.241 354.31));
  border-radius: 6px;
  box-shadow:
    0 10px 30px color-mix(in oklch, oklch(0.566 0.245 278.69) 40%, transparent),
    0 0 0 1px color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  transform: perspective(1000px) rotateY(-15deg) rotateX(5deg);
  transition: transform 0.5s ease;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-fade-through",
  name: "Fade Through",
  category: "animations",
  description: "An animated motion effect (fade through)",
  tags: ["fade", "transition", "fade-through", "through", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-through {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: oklch(1 0 0);
  animation: roy-ferrum-fade-through 0.6s ease-in-out;
  pointer-events: all;
}

@keyframes roy-ferrum-fade-through {

  0% { opacity: 0; }
  40% { opacity: 1; }
  60% { opacity: 1; }
  100% { opacity: 0; }

}`,
},

{
  id: "ferrum-zoom-fade",
  name: "Zoom Fade",
  category: "animations",
  description: "An animated motion effect (zoom fade)",
  tags: ["zoom", "scale", "zoom-fade", "fade", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-zoom-fade {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: oklch(1 0 0);
  opacity: 0;
  transform: scale(0.92);
  animation: roy-ferrum-zoom-fade 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  pointer-events: all;
}

@keyframes roy-ferrum-zoom-fade {

  0% { opacity: 0; transform: scale(0.92); }
  100% { opacity: 1; transform: scale(1); }

}`,
},

{
  id: "ferrum-flip-transition",
  name: "Flip Transition",
  category: "animations",
  description: "An animated motion effect (flip transition)",
  tags: ["flip", "transform", "flip-transition", "transition", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-flip-transition {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: oklch(1 0 0);
  transform: perspective(1200px) rotateY(-90deg);
  transform-origin: left center;
  animation: roy-ferrum-flip-transition 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  pointer-events: all;
  backface-visibility: hidden;
}

@keyframes roy-ferrum-flip-transition {

  0% { transform: perspective(1200px) rotateY(-90deg); }
  100% { transform: perspective(1200px) rotateY(0deg); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // GLASS-UI
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-apple-bounce-settle",
  name: "Apple Bounce Settle",
  category: "glass-ui",
  description: "An Apple-inspired motion or surface effect (apple bounce settle)",
  tags: ["apple", "glassmorphism", "apple-bounce-settle", "bounce", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-bounce-settle {
  animation: roy-apple-bounce-settle 1.2s cubic-bezier(0.28, 0.84, 0.42, 1) both;
}

@keyframes roy-apple-bounce-settle {

  0% { transform: translateY(-120%); opacity: 0; }
  15% { transform: translateY(0); opacity: 1; }
  30% { transform: translateY(-22%); }
  45% { transform: translateY(0); }
  60% { transform: translateY(-8%); }
  75% { transform: translateY(0); }
  88% { transform: translateY(-2%); }
  100% { transform: translateY(0); }

}`,
},

{
  id: "ferrum-apple-elastic-scale",
  name: "Apple Elastic Scale",
  category: "glass-ui",
  description: "An Apple-inspired motion or surface effect (apple elastic scale)",
  tags: ["apple", "glassmorphism", "apple-elastic-scale", "elastic", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-elastic-scale {
  animation: roy-apple-elastic 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
}

@keyframes roy-apple-elastic {

  0% { transform: scale(0); opacity: 0; }
  35% { transform: scale(1.25); opacity: 1; }
  55% { transform: scale(0.88); }
  75% { transform: scale(1.08); }
  100% { transform: scale(1); }

}`,
},

{
  id: "ferrum-apple-flip-spring",
  name: "Apple Flip Spring",
  category: "glass-ui",
  description: "An Apple-inspired motion or surface effect (apple flip spring)",
  tags: ["apple", "glassmorphism", "apple-flip-spring", "flip", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-flip-spring {
  perspective: 1000px;
  animation: roy-apple-flip-spring 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transform-style: preserve-3d;
}

@keyframes roy-apple-flip-spring {

  0% { opacity: 0; transform: rotateY(-90deg) scale(0.85); }
  60% { opacity: 1; transform: rotateY(12deg) scale(1.04); }
  100% { transform: rotateY(0) scale(1); }

}`,
},

{
  id: "ferrum-apple-frosted-vibrancy",
  name: "Apple Frosted Vibrancy",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["apple", "glassmorphism", "apple-frosted-vibrancy", "frosted"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-frosted-vibrancy {
  background: color-mix(in oklch, oklch(1 0 0) 55%, transparent);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 40%, transparent);
  border-radius: 14px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 0) 60%, transparent) inset,
    0 10px 30px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  color: oklch(0.232 0.004 286.1);
}`,
},

{
  id: "ferrum-apple-material-thick",
  name: "Apple Material Thick",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["apple", "glassmorphism", "apple-material-thick", "material"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-material-thick {
  background: color-mix(in oklch, oklch(0.971 0.003 286.35) 75%, transparent);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 30%, transparent);
  border-radius: 16px;
  box-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 0) 50%, transparent) inset,
    0 20px 50px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
  color: oklch(0.232 0.004 286.1);
}`,
},

{
  id: "ferrum-apple-material-thin",
  name: "Apple Material Thin",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["apple", "glassmorphism", "apple-material-thin", "material"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-material-thin {
  background: color-mix(in oklch, oklch(0.986 0.003 286.35) 50%, transparent);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 50%, transparent);
  border-radius: 12px;
  box-shadow: 0 4px 16px color-mix(in oklch, oklch(0 0 0) 8%, transparent);
  color: oklch(0.232 0.004 286.1);
}`,
},

{
  id: "ferrum-apple-sidebar-material",
  name: "Apple Sidebar Material",
  category: "glass-ui",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["apple", "glassmorphism", "apple-sidebar-material", "sidebar"],
  previewType: "box",
  cssCode: `.roycss-ferrum-apple-sidebar-material {
  background: linear-gradient(
    180deg,
    color-mix(in oklch, oklch(0.971 0.003 286.35) 70%, transparent) 0%,
    color-mix(in oklch, oklch(0.941 0.007 286.27) 60%, transparent) 100%
  );
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border: 1px solid color-mix(in oklch, oklch(0 0 0) 6%, transparent);
  border-radius: 12px;
  box-shadow:
    inset 1px 0 0 color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    0 6px 20px color-mix(in oklch, oklch(0 0 0) 10%, transparent);
  color: oklch(0.232 0.004 286.1);
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // MICROINTERACTIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-icon-spin",
  name: "Spin",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (spin)",
  tags: ["icon", "animation", "icon-spin", "spin", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-spin {
  animation: roy-ferrum-icon-spin 1s linear infinite;
}

@keyframes roy-ferrum-icon-spin {

  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }

}`,
},

{
  id: "ferrum-icon-bounce",
  name: "Bounce",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (bounce)",
  tags: ["icon", "animation", "icon-bounce", "bounce", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-bounce {
  animation: roy-ferrum-icon-bounce 0.8s ease infinite;
}

@keyframes roy-ferrum-icon-bounce {

  0%, 100% { transform: translateY(0); }
  20% { transform: translateY(-30%); }
  40% { transform: translateY(0); }
  55% { transform: translateY(-15%); }
  70% { transform: translateY(0); }
  82% { transform: translateY(-6%); }

}`,
},

{
  id: "ferrum-icon-pulse",
  name: "Pulse",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (pulse)",
  tags: ["icon", "animation", "icon-pulse", "pulse", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-pulse {
  animation: roy-ferrum-icon-pulse 1s ease-in-out infinite;
}

@keyframes roy-ferrum-icon-pulse {

  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }

}`,
},

{
  id: "ferrum-icon-shake",
  name: "Shake",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (shake)",
  tags: ["icon", "animation", "icon-shake", "shake", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-shake {
  animation: roy-ferrum-icon-shake 0.6s ease-in-out;
}

@keyframes roy-ferrum-icon-shake {

  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-25%); }
  30% { transform: translateX(20%); }
  45% { transform: translateX(-15%); }
  60% { transform: translateX(10%); }
  75% { transform: translateX(-5%); }

}`,
},

{
  id: "ferrum-icon-flip",
  name: "Flip",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (flip)",
  tags: ["icon", "animation", "icon-flip", "flip", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-flip {
  animation: roy-ferrum-icon-flip 0.6s ease-in-out;
  backface-visibility: hidden;
}

@keyframes roy-ferrum-icon-flip {

  0% { transform: perspective(400px) rotateY(0); }
  100% { transform: perspective(400px) rotateY(360deg); }

}`,
},

{
  id: "ferrum-icon-swing",
  name: "Swing",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (swing)",
  tags: ["icon", "animation", "icon-swing", "swing", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-swing {
  animation: roy-ferrum-icon-swing 0.8s ease-in-out;
  transform-origin: top center;
}

@keyframes roy-ferrum-icon-swing {

  0% { transform: rotate(0deg); }
  20% { transform: rotate(15deg); }
  40% { transform: rotate(-10deg); }
  60% { transform: rotate(5deg); }
  80% { transform: rotate(-2deg); }
  100% { transform: rotate(0deg); }

}`,
},

{
  id: "ferrum-icon-tada",
  name: "Tada",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (tada)",
  tags: ["icon", "animation", "icon-tada", "tada", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-tada {
  animation: roy-ferrum-icon-tada 1s ease;
}

@keyframes roy-ferrum-icon-tada {

  0% { transform: scale(1) rotate(0deg); }
  10%, 20% { transform: scale(0.9) rotate(-3deg); }
  30%, 50%, 70%, 90% { transform: scale(1.15) rotate(3deg); }
  40%, 60%, 80% { transform: scale(1.15) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); }

}`,
},

{
  id: "ferrum-icon-wobble",
  name: "Wobble",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (wobble)",
  tags: ["icon", "animation", "icon-wobble", "wobble", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-wobble {
  animation: roy-ferrum-icon-wobble 0.8s ease;
}

@keyframes roy-ferrum-icon-wobble {

  0% { transform: translateX(0) rotate(0deg); }
  15% { transform: translateX(-25%) rotate(-5deg); }
  30% { transform: translateX(20%) rotate(3deg); }
  45% { transform: translateX(-15%) rotate(-3deg); }
  60% { transform: translateX(10%) rotate(2deg); }
  75% { transform: translateX(-5%) rotate(-1deg); }
  100% { transform: translateX(0) rotate(0deg); }

}`,
},

{
  id: "ferrum-icon-fade-in",
  name: "Fade In",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (fade in)",
  tags: ["icon", "animation", "icon-fade-in", "fade", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-fade-in {
  animation: roy-ferrum-icon-fade-in 0.5s ease forwards;
}

@keyframes roy-ferrum-icon-fade-in {

  0% { opacity: 0; }
  100% { opacity: 1; }

}`,
},

{
  id: "ferrum-icon-drop-in",
  name: "Drop In",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (drop in)",
  tags: ["icon", "animation", "icon-drop-in", "drop", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-drop-in {
  animation: roy-ferrum-icon-drop-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes roy-ferrum-icon-drop-in {

  0% { opacity: 0; transform: translateY(-40px); }
  60% { opacity: 1; transform: translateY(5px); }
  80% { transform: translateY(-3px); }
  100% { opacity: 1; transform: translateY(0); }

}`,
},

{
  id: "ferrum-icon-rubber-band",
  name: "Rubber Band",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (rubber band)",
  tags: ["icon", "animation", "icon-rubber-band", "rubber", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-rubber-band {
  animation: roy-ferrum-icon-rubber-band 0.8s ease;
}

@keyframes roy-ferrum-icon-rubber-band {

  0% { transform: scaleX(1) scaleY(1); }
  30% { transform: scaleX(1.25) scaleY(0.75); }
  40% { transform: scaleX(0.75) scaleY(1.25); }
  50% { transform: scaleX(1.15) scaleY(0.85); }
  65% { transform: scaleX(0.95) scaleY(1.05); }
  75% { transform: scaleX(1.05) scaleY(0.95); }
  100% { transform: scaleX(1) scaleY(1); }

}`,
},

{
  id: "ferrum-icon-beat",
  name: "Beat",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (beat)",
  tags: ["icon", "animation", "icon-beat", "beat", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-icon-beat {
  animation: roy-ferrum-icon-beat 1s ease-in-out infinite;
}

@keyframes roy-ferrum-icon-beat {

  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.2); }
  28% { transform: scale(1); }
  42% { transform: scale(1.2); }
  70% { transform: scale(1); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // MISC
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-skip-link",
  name: "Skip Link",
  category: "misc",
  description: "A skip link effect",
  tags: ["skip-link", "link"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: 99999;
  background: oklch(0.488 0.217 264.38);
  color: oklch(1 0 0);
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0 0 8px 0;
  text-decoration: none;
  transition: none;
}

.roycss-ferrum-skip-link:focus {
  left: 0;
  top: 0;
  width: auto;
  height: auto;
  overflow: auto;
  padding: 12px 24px;
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-skip-link {
    transition: none;
  }
}`,
},

{
  id: "ferrum-reduced-motion-fade",
  name: "Reduced Motion Fade",
  category: "misc",
  description: "An animated motion effect (reduced motion fade)",
  tags: ["reduced-motion-fade", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-reduced-motion-fade {
  opacity: 0;
  animation: roy-ferrum-rm-fade 0.5s ease forwards;
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-reduced-motion-fade {
    animation: none;
    opacity: 1;
  }
}

@keyframes roy-ferrum-rm-fade {

  0% { opacity: 0; }
  100% { opacity: 1; }

}`,
},

{
  id: "ferrum-reduced-motion-slide",
  name: "Reduced Motion Slide",
  category: "misc",
  description: "An animated motion effect (reduced motion slide)",
  tags: ["reduced-motion-slide", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-reduced-motion-slide {
  transform: translateY(20px);
  opacity: 0;
  animation: roy-ferrum-rm-slide 0.5s ease forwards;
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-reduced-motion-slide {
    animation: none;
    transform: none;
    opacity: 1;
  }
}

@keyframes roy-ferrum-rm-slide {

  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }

}`,
},

{
  id: "ferrum-high-contrast-border",
  name: "High Contrast Border",
  category: "misc",
  description: "A high contrast border effect",
  tags: ["high-contrast-border", "contrast"],
  previewType: "box",
  cssCode: `.roycss-ferrum-high-contrast-border {
  border: 3px solid oklch(0 0 0);
  min-height: 1px;
  min-width: 1px;
}

@media (prefers-contrast: high) {
  .roycss-ferrum-high-contrast-border {
    border-width: 4px;
    border-color: oklch(1 0 0);
    outline: 3px solid oklch(0 0 0);
    outline-offset: -1px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-high-contrast-border {
    transition: none;
  }
}`,
},

{
  id: "ferrum-sr-only",
  name: "Sr Only",
  category: "misc",
  description: "A sr only effect",
  tags: ["sr-only", "only"],
  previewType: "box",
  cssCode: `.roycss-ferrum-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.roycss-ferrum-sr-only.focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}`,
},

{
  id: "ferrum-motion-safe-bounce",
  name: "Motion Safe Bounce",
  category: "misc",
  description: "An animated motion effect (motion safe bounce)",
  tags: ["motion-safe-bounce", "safe", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-motion-safe-bounce {
  animation: roy-ferrum-ms-bounce 0.6s ease;
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-motion-safe-bounce {
    animation: none;
    transform: none;
  }
}

@keyframes roy-ferrum-ms-bounce {

  0%, 100% { transform: translateY(0); }
  30% { transform: translateY(-15px); }
  50% { transform: translateY(-8px); }
  70% { transform: translateY(-3px); }

}`,
},

{
  id: "ferrum-motion-safe-pulse",
  name: "Motion Safe Pulse",
  category: "misc",
  description: "An animated motion effect (motion safe pulse)",
  tags: ["motion-safe-pulse", "safe", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-motion-safe-pulse {
  animation: roy-ferrum-ms-pulse 1s ease-in-out 2;
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-motion-safe-pulse {
    animation: none;
    transform: none;
}
}

@keyframes roy-ferrum-ms-pulse {

  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-accordion-3d",
  name: "3D",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["accordion", "navigation", "accordion-3d", "3d"],
  previewType: "box",
  cssCode: `.roycss-ferrum-accordion-3d {
  perspective: 800px;
  width: 80px;
  height: 60px;
  position: relative;
  transform-style: preserve-3d;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // PAGE-TRANSITIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-slide-over-left",
  name: "Slide Over Left",
  category: "page-transitions",
  description: "An animated motion effect (slide over left)",
  tags: ["slide", "transition", "slide-over-left", "over", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-over-left {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: oklch(1 0 0);
  transform: translateX(100%);
  animation: roy-ferrum-slide-over-left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: all;
}

@keyframes roy-ferrum-slide-over-left {

  0% { transform: translateX(100%); }
  100% { transform: translateX(0); }

}`,
},

{
  id: "ferrum-slide-over-right",
  name: "Slide Over Right",
  category: "page-transitions",
  description: "An animated motion effect (slide over right)",
  tags: ["slide", "transition", "slide-over-right", "over", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-over-right {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: oklch(1 0 0);
  transform: translateX(-100%);
  animation: roy-ferrum-slide-over-right 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: all;
}

@keyframes roy-ferrum-slide-over-right {

  0% { transform: translateX(-100%); }
  100% { transform: translateX(0); }

}`,
},

{
  id: "ferrum-slide-over-up",
  name: "Slide Over Up",
  category: "page-transitions",
  description: "An animated motion effect (slide over up)",
  tags: ["slide", "transition", "slide-over-up", "over", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-over-up {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: oklch(1 0 0);
  transform: translateY(100%);
  animation: roy-ferrum-slide-over-up 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: all;
}

@keyframes roy-ferrum-slide-over-up {

  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }

}`,
},

{
  id: "ferrum-dissolve",
  name: "Dissolve",
  category: "page-transitions",
  description: "An animated motion effect (dissolve)",
  tags: ["dissolve", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-dissolve {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: oklch(1 0 0);
  opacity: 0;
  filter: blur(20px);
  animation: roy-ferrum-dissolve 0.65s ease-out forwards;
  pointer-events: all;
}

@keyframes roy-ferrum-dissolve {

  0% { opacity: 0; filter: blur(20px); }
  100% { opacity: 1; filter: blur(0px); }

}`,
},

{
  id: "ferrum-curtain-in",
  name: "Curtain In",
  category: "page-transitions",
  description: "An animated motion effect (curtain in)",
  tags: ["curtain-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-curtain-in {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: oklch(1 0 0);
  pointer-events: all;
}

.roycss-ferrum-curtain-in::before,
.roycss-ferrum-curtain-in::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  background: oklch(1 0 0);
  animation: roy-ferrum-curtain-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.roycss-ferrum-curtain-in::before {
  left: 0;
  clip-path: inset(0 50% 0 0);
  animation-name: roy-ferrum-curtain-left;
}

.roycss-ferrum-curtain-in::after {
  right: 0;
  clip-path: inset(0 0 0 50%);
  animation-name: roy-ferrum-curtain-right;
}

.roycss-ferrum-focus-visible-ring:focus-visible {
  outline: 3px solid oklch(0.546 0.215 262.88);
  outline-offset: 2px;
  border-radius: 4px;
  transition: outline-color 0.15s ease;
}

.roycss-ferrum-focus-visible-ring:focus:not(:focus-visible) {
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .roycss-ferrum-focus-visible-ring:focus-visible {
    transition: none;
  }
}

@keyframes roy-ferrum-curtain-left {

  0% { clip-path: inset(0 0 0 0); }
  100% { clip-path: inset(0 50% 0 0); }

}

@keyframes roy-ferrum-curtain-right {

  0% { clip-path: inset(0 0 0 0); }
  100% { clip-path: inset(0 0 0 50%); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-preset-glassmorphism",
  name: "Preset Glassmorphism",
  category: "visual",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["preset-glassmorphism", "glassmorphism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-glassmorphism {
  background: color-mix(in oklch, oklch(1 0 0) 15%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 25%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 8%, transparent);
}`,
},

{
  id: "ferrum-preset-neumorphism",
  name: "Preset Neumorphism",
  category: "visual",
  description: "A preset design-system style (preset neumorphism)",
  tags: ["preset-neumorphism", "neumorphism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-neumorphism {
  background: oklch(0.92 0.011 256.7);
  border-radius: 16px;
  border: none;
  box-shadow:
    8px 8px 16px oklch(0.756 0.034 258.37),
    -8px -8px 16px oklch(1 0 0);
}`,
},

{
  id: "ferrum-preset-claymorphism",
  name: "Preset Claymorphism",
  category: "visual",
  description: "A preset design-system style (preset claymorphism)",
  tags: ["preset-claymorphism", "claymorphism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-claymorphism {
  background: oklch(0.725 0.138 21.03);
  border-radius: 32px;
  border: none;
  box-shadow:
    inset -6px -6px 12px color-mix(in oklch, oklch(0 0 0) 15%, transparent),
    inset 6px 6px 12px color-mix(in oklch, oklch(1 0 0) 35%, transparent),
    8px 8px 20px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
}`,
},

{
  id: "ferrum-preset-brutalism",
  name: "Preset Brutalism",
  category: "visual",
  description: "A preset design-system style (preset brutalism)",
  tags: ["preset-brutalism", "brutalism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-brutalism {
  background: oklch(0.968 0.211 109.77);
  border: 4px solid oklch(0 0 0);
  border-radius: 0;
  box-shadow: 8px 8px 0 oklch(0 0 0);
  font-weight: 900;
  text-transform: uppercase;
}`,
},

{
  id: "ferrum-preset-retro-pixel",
  name: "Preset Retro Pixel",
  category: "visual",
  description: "A preset design-system style (preset retro pixel)",
  tags: ["preset-retro-pixel", "retro"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-retro-pixel {
  background: oklch(0.315 0.07 281.57);
  border: none;
  border-radius: 0;
  color: oklch(0.902 0.152 94.64);
  font-family: 'Courier New', Courier, monospace;
  box-shadow:
    4px 0 0 0 oklch(0.315 0.07 281.57), -4px 0 0 0 oklch(0.315 0.07 281.57),
    0 4px 0 0 oklch(0.315 0.07 281.57), 0 -4px 0 0 oklch(0.315 0.07 281.57),
    4px 4px 0 0 oklch(0.315 0.07 281.57), -4px 4px 0 0 oklch(0.315 0.07 281.57),
    4px -4px 0 0 oklch(0.315 0.07 281.57), -4px -4px 0 0 oklch(0.315 0.07 281.57);
  outline: 4px solid oklch(0.902 0.152 94.64);
}`,
},

{
  id: "ferrum-preset-cyberpunk",
  name: "Preset Cyberpunk",
  category: "visual",
  description: "A preset design-system style (preset cyberpunk)",
  tags: ["preset-cyberpunk", "cyberpunk"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-cyberpunk {
  background: oklch(0.149 0.017 284.13);
  border: 2px solid oklch(0.87 0.148 202.88);
  border-radius: 4px;
  box-shadow:
    0 0 8px color-mix(in oklch, oklch(0.87 0.148 202.88) 40%, transparent),
    0 0 20px color-mix(in oklch, oklch(0.87 0.148 202.88) 15%, transparent),
    inset 0 0 12px color-mix(in oklch, oklch(0.87 0.148 202.88) 5%, transparent);
  color: oklch(0.87 0.148 202.88);
}`,
},

{
  id: "ferrum-preset-minimalism",
  name: "Preset Minimalism",
  category: "visual",
  description: "A preset design-system style (preset minimalism)",
  tags: ["preset-minimalism", "minimalism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-minimalism {
  background: oklch(1 0 0);
  border: 1px solid oklch(0.928 0.006 264.53);
  border-radius: 8px;
  box-shadow: 0 1px 3px color-mix(in oklch, oklch(0 0 0) 4%, transparent);
  color: oklch(0.39 0.04 257.29);
}`,
},

{
  id: "ferrum-preset-elevation",
  name: "Preset Elevation",
  category: "visual",
  description: "A preset design-system style (preset elevation)",
  tags: ["preset-elevation", "elevation"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-elevation {
  background: oklch(1 0 0);
  border: none;
  border-radius: 12px;
  box-shadow:
    0 1px 2px color-mix(in oklch, oklch(0 0 0) 7%, transparent),
    0 4px 8px color-mix(in oklch, oklch(0 0 0) 5%, transparent),
    0 12px 24px color-mix(in oklch, oklch(0 0 0) 4%, transparent),
    0 20px 40px color-mix(in oklch, oklch(0 0 0) 3%, transparent);
}`,
},

{
  id: "ferrum-preset-gradient-border",
  name: "Preset Gradient Border",
  category: "visual",
  description: "A preset design-system style (preset gradient border)",
  tags: ["preset-gradient-border", "gradient"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-gradient-border {
  position: relative;
  background: oklch(1 0 0);
  border-radius: 12px;
  border: none;
}
.roycss-ferrum-preset-gradient-border::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 14px;
  background: linear-gradient(135deg, oklch(0.627 0.164 271.53) 0%, oklch(0.501 0.138 304.73) 50%, oklch(0.795 0.172 323.15) 100%);
  z-index: -1;
}`,
},

{
  id: "ferrum-preset-dark-glass",
  name: "Preset Dark Glass",
  category: "visual",
  description: "A glassmorphic surface effect with backdrop blur and translucency",
  tags: ["preset-dark-glass", "dark", "glassmorphism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-dark-glass {
  background: color-mix(in oklch, oklch(0 0 0) 35%, transparent);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  box-shadow: 0 8px 32px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  color: oklch(0.967 0.003 264.54);
}`,
},

{
  id: "ferrum-preset-soft-ui",
  name: "Preset Soft UI",
  category: "visual",
  description: "A preset design-system style (preset soft ui)",
  tags: ["preset-soft-ui", "soft"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-soft-ui {
  --soft-bg: oklch(0.941 0.008 253.85);
  --soft-shadow-dark: oklch(0.844 0.009 258.34);
  --soft-shadow-light: oklch(1 0 0);
  background: var(--soft-bg);
  border: none;
  border-radius: 20px;
  box-shadow:
    6px 6px 14px var(--soft-shadow-dark),
    -6px -6px 14px var(--soft-shadow-light),
    inset 2px 2px 4px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    inset -2px -2px 4px color-mix(in oklch, oklch(0 0 0) 4%, transparent);
}`,
},

{
  id: "ferrum-preset-neobrutalism",
  name: "Preset Neobrutalism",
  category: "visual",
  description: "A preset design-system style (preset neobrutalism)",
  tags: ["preset-neobrutalism", "neobrutalism"],
  previewType: "box",
  cssCode: `.roycss-ferrum-preset-neobrutalism {
  background: oklch(0.962 0.058 95.62);
  border: 3px solid oklch(0.27 0.04 260.03);
  border-radius: 8px;
  box-shadow: 6px 6px 0 oklch(0.27 0.04 260.03);
  color: oklch(0.27 0.04 260.03);
  font-weight: 700;
}`,
},

];
