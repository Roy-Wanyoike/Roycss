import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 20 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch20: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-fade-in",
  name: "Fade In",
  category: "animations",
  description: "An animated motion effect (fade in)",
  tags: ["fade", "transition", "fade-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-in { animation: roy-ferrum-fade-in 0.6s ease-out both; }

@keyframes roy-ferrum-fade-in {

  from { opacity: 0; }
  to   { opacity: 1; }

}`,
},

{
  id: "ferrum-slide-in-up",
  name: "Slide In Up",
  category: "animations",
  description: "An animated motion effect (slide in up)",
  tags: ["slide", "transition", "slide-in-up", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-in-up { animation: roy-ferrum-slide-in-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes roy-ferrum-slide-in-up {

  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }

}`,
},

{
  id: "ferrum-slide-in-down",
  name: "Slide In Down",
  category: "animations",
  description: "An animated motion effect (slide in down)",
  tags: ["slide", "transition", "slide-in-down", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-in-down { animation: roy-ferrum-slide-in-down 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes roy-ferrum-slide-in-down {

  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }

}`,
},

{
  id: "ferrum-slide-in-left",
  name: "Slide In Left",
  category: "animations",
  description: "An animated motion effect (slide in left)",
  tags: ["slide", "transition", "slide-in-left", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-in-left { animation: roy-ferrum-slide-in-left 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes roy-ferrum-slide-in-left {

  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }

}`,
},

{
  id: "ferrum-slide-in-right",
  name: "Slide In Right",
  category: "animations",
  description: "An animated motion effect (slide in right)",
  tags: ["slide", "transition", "slide-in-right", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-in-right { animation: roy-ferrum-slide-in-right 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes roy-ferrum-slide-in-right {

  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);   opacity: 1; }

}`,
},

{
  id: "ferrum-zoom-in",
  name: "Zoom In",
  category: "animations",
  description: "An animated motion effect (zoom in)",
  tags: ["zoom", "scale", "zoom-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-zoom-in { animation: roy-ferrum-zoom-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes roy-ferrum-zoom-in {

  from { transform: scale(0);   opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }

}`,
},

{
  id: "ferrum-bounce-in",
  name: "Bounce In",
  category: "animations",
  description: "An animated motion effect (bounce in)",
  tags: ["bounce", "motion", "bounce-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-bounce-in { animation: roy-ferrum-bounce-in 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

@keyframes roy-ferrum-bounce-in {

  0%   { transform: scale(0.3); opacity: 0; }
  50%  { transform: scale(1.05); }
  70%  { transform: scale(0.95); }
  100% { transform: scale(1);    opacity: 1; }

}`,
},

{
  id: "ferrum-flip-in-x",
  name: "Flip In X",
  category: "animations",
  description: "An animated motion effect (flip in x)",
  tags: ["flip", "transform", "flip-in-x", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-flip-in-x {
  backface-visibility: hidden;
  animation: roy-ferrum-flip-in-x 0.6s ease-in both;
}

@keyframes roy-ferrum-flip-in-x {

  from { transform: perspective(400px) rotateX(90deg); opacity: 0; }
  40%  { transform: perspective(400px) rotateX(-10deg); }
  70%  { transform: perspective(400px) rotateX(10deg);  }
  to   { transform: perspective(400px) rotateX(0deg);   opacity: 1; }

}`,
},

{
  id: "ferrum-flip-in-y",
  name: "Flip In Y",
  category: "animations",
  description: "An animated motion effect (flip in y)",
  tags: ["flip", "transform", "flip-in-y", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-flip-in-y {
  backface-visibility: hidden;
  animation: roy-ferrum-flip-in-y 0.6s ease-in both;
}

@keyframes roy-ferrum-flip-in-y {

  from { transform: perspective(400px) rotateY(90deg); opacity: 0; }
  40%  { transform: perspective(400px) rotateY(-10deg); }
  70%  { transform: perspective(400px) rotateY(10deg);  }
  to   { transform: perspective(400px) rotateY(0deg);   opacity: 1; }

}`,
},

{
  id: "ferrum-fade-in-up",
  name: "Fade In Up",
  category: "animations",
  description: "An animated motion effect (fade in up)",
  tags: ["fade", "transition", "fade-in-up", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-in-up { animation: roy-ferrum-fade-in-up 0.5s ease-out both; }

@keyframes roy-ferrum-fade-in-up {

  from { transform: translateY(30px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }

}`,
},

{
  id: "ferrum-fade-in-down",
  name: "Fade In Down",
  category: "animations",
  description: "An animated motion effect (fade in down)",
  tags: ["fade", "transition", "fade-in-down", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-in-down { animation: roy-ferrum-fade-in-down 0.5s ease-out both; }

@keyframes roy-ferrum-fade-in-down {

  from { transform: translateY(-30px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }

}`,
},

{
  id: "ferrum-fade-in-left",
  name: "Fade In Left",
  category: "animations",
  description: "An animated motion effect (fade in left)",
  tags: ["fade", "transition", "fade-in-left", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-in-left { animation: roy-ferrum-fade-in-left 0.5s ease-out both; }

@keyframes roy-ferrum-fade-in-left {

  from { transform: translateX(-30px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }

}`,
},

{
  id: "ferrum-roll-in",
  name: "Roll In",
  category: "animations",
  description: "An animated motion effect (roll in)",
  tags: ["roll", "motion", "roll-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-roll-in { animation: roy-ferrum-roll-in 0.65s ease-out both; }

@keyframes roy-ferrum-roll-in {

  from { transform: rotateX(90deg) translateZ(-100px); opacity: 0; }
  to   { transform: rotateX(0deg)   translateZ(0);      opacity: 1; }

}`,
},

{
  id: "ferrum-light-speed-in",
  name: "Light Speed In",
  category: "animations",
  description: "An animated motion effect (light speed in)",
  tags: ["light", "motion", "light-speed-in", "speed", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-light-speed-in { animation: roy-ferrum-light-speed-in 0.6s ease-out both; }

@keyframes roy-ferrum-light-speed-in {

  0%   { transform: translateX(100%) skewX(-30deg); opacity: 0; }
  60%  { transform: skewX(20deg);                    opacity: 1; }
  80%  { transform: skewX(-5deg); }
  100% { transform: translateX(0) skewX(0deg);      opacity: 1; }

}`,
},

{
  id: "ferrum-rotate-in",
  name: "Rotate In",
  category: "animations",
  description: "An animated motion effect (rotate in)",
  tags: ["rotate", "transform", "rotate-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rotate-in { animation: roy-ferrum-rotate-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes roy-ferrum-rotate-in {

  from { transform: rotate(-200deg) scale(0); opacity: 0; }
  to   { transform: rotate(0deg)     scale(1); opacity: 1; }

}`,
},

{
  id: "ferrum-rotate-in-down-left",
  name: "Rotate In Down Left",
  category: "animations",
  description: "An animated motion effect (rotate in down left)",
  tags: ["rotate", "transform", "rotate-in-down-left", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rotate-in-down-left {
  transform-origin: left bottom;
  animation: roy-ferrum-rotate-in-down-left 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-ferrum-rotate-in-down-left {

  from { transform: rotate(-45deg) translateY(-100%); opacity: 0; }
  to   { transform: rotate(0deg)   translateY(0);      opacity: 1; }

}`,
},

{
  id: "ferrum-rotate-in-up-right",
  name: "Rotate In Up Right",
  category: "animations",
  description: "An animated motion effect (rotate in up right)",
  tags: ["rotate", "transform", "rotate-in-up-right", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rotate-in-up-right {
  transform-origin: right bottom;
  animation: roy-ferrum-rotate-in-up-right 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-ferrum-rotate-in-up-right {

  from { transform: rotate(45deg) translateY(100%); opacity: 0; }
  to   { transform: rotate(0deg)  translateY(0);     opacity: 1; }

}`,
},

{
  id: "ferrum-fade-in-scale",
  name: "Fade In Scale",
  category: "animations",
  description: "An animated motion effect (fade in scale)",
  tags: ["fade", "transition", "fade-in-scale", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-in-scale { animation: roy-ferrum-fade-in-scale 0.6s ease-out both; }

@keyframes roy-ferrum-fade-in-scale {

  from { transform: scale(0.8); filter: blur(4px); opacity: 0; }
  to   { transform: scale(1);   filter: blur(0);   opacity: 1; }

}`,
},

{
  id: "ferrum-drop-in",
  name: "Drop In",
  category: "animations",
  description: "An animated motion effect (drop in)",
  tags: ["drop", "motion", "drop-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-drop-in { animation: roy-ferrum-drop-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

@keyframes roy-ferrum-drop-in {

  0%   { transform: translateY(-300px); opacity: 0; }
  60%  { transform: translateY(20px);   opacity: 1; }
  80%  { transform: translateY(-10px); }
  100% { transform: translateY(0);     opacity: 1; }

}`,
},

{
  id: "ferrum-expand-in",
  name: "Expand In",
  category: "animations",
  description: "An animated motion effect (expand in)",
  tags: ["expand", "scale", "expand-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-expand-in { animation: roy-ferrum-expand-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

@keyframes roy-ferrum-expand-in {

  from { transform: scaleX(0) scaleY(0); opacity: 0; }
  to   { transform: scaleX(1) scaleY(1); opacity: 1; }

}`,
},

{
  id: "ferrum-fade-out",
  name: "Fade Out",
  category: "animations",
  description: "An animated motion effect (fade out)",
  tags: ["fade", "transition", "fade-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-out { animation: roy-ferrum-fade-out 0.6s ease-in both; }

@keyframes roy-ferrum-fade-out {

  from { opacity: 1; }
  to   { opacity: 0; }

}`,
},

{
  id: "ferrum-slide-out-up",
  name: "Slide Out Up",
  category: "animations",
  description: "An animated motion effect (slide out up)",
  tags: ["slide", "transition", "slide-out-up", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-out-up { animation: roy-ferrum-slide-out-up 0.5s cubic-bezier(0.55, 0, 1, 0.45) both; }

@keyframes roy-ferrum-slide-out-up {

  from { transform: translateY(0);    opacity: 1; }
  to   { transform: translateY(-100%); opacity: 0; }

}`,
},

{
  id: "ferrum-slide-out-down",
  name: "Slide Out Down",
  category: "animations",
  description: "An animated motion effect (slide out down)",
  tags: ["slide", "transition", "slide-out-down", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-out-down { animation: roy-ferrum-slide-out-down 0.5s cubic-bezier(0.55, 0, 1, 0.45) both; }

@keyframes roy-ferrum-slide-out-down {

  from { transform: translateY(0);    opacity: 1; }
  to   { transform: translateY(100%); opacity: 0; }

}`,
},

{
  id: "ferrum-slide-out-left",
  name: "Slide Out Left",
  category: "animations",
  description: "An animated motion effect (slide out left)",
  tags: ["slide", "transition", "slide-out-left", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-out-left { animation: roy-ferrum-slide-out-left 0.5s cubic-bezier(0.55, 0, 1, 0.45) both; }

@keyframes roy-ferrum-slide-out-left {

  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(-100%); opacity: 0; }

}`,
},

{
  id: "ferrum-slide-out-right",
  name: "Slide Out Right",
  category: "animations",
  description: "An animated motion effect (slide out right)",
  tags: ["slide", "transition", "slide-out-right", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-out-right { animation: roy-ferrum-slide-out-right 0.5s cubic-bezier(0.55, 0, 1, 0.45) both; }

@keyframes roy-ferrum-slide-out-right {

  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(100%); opacity: 0; }

}`,
},

{
  id: "ferrum-zoom-out",
  name: "Zoom Out",
  category: "animations",
  description: "An animated motion effect (zoom out)",
  tags: ["zoom", "scale", "zoom-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-zoom-out { animation: roy-ferrum-zoom-out 0.5s cubic-bezier(0.55, 0, 1, 0.45) both; }

@keyframes roy-ferrum-zoom-out {

  from { transform: scale(1);   opacity: 1; }
  to   { transform: scale(0);   opacity: 0; }

}`,
},

{
  id: "ferrum-flip-out-x",
  name: "Flip Out X",
  category: "animations",
  description: "An animated motion effect (flip out x)",
  tags: ["flip", "transform", "flip-out-x", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-flip-out-x {
  backface-visibility: hidden;
  animation: roy-ferrum-flip-out-x 0.6s ease-in both;
}

@keyframes roy-ferrum-flip-out-x {

  from { transform: perspective(400px) rotateX(0deg);   opacity: 1; }
  to   { transform: perspective(400px) rotateX(90deg);  opacity: 0; }

}`,
},

{
  id: "ferrum-flip-out-y",
  name: "Flip Out Y",
  category: "animations",
  description: "An animated motion effect (flip out y)",
  tags: ["flip", "transform", "flip-out-y", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-flip-out-y {
  backface-visibility: hidden;
  animation: roy-ferrum-flip-out-y 0.6s ease-in both;
}

@keyframes roy-ferrum-flip-out-y {

  from { transform: perspective(400px) rotateY(0deg);   opacity: 1; }
  to   { transform: perspective(400px) rotateY(90deg);  opacity: 0; }

}`,
},

{
  id: "ferrum-light-speed-out",
  name: "Light Speed Out",
  category: "animations",
  description: "An animated motion effect (light speed out)",
  tags: ["light", "motion", "light-speed-out", "speed", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-light-speed-out { animation: roy-ferrum-light-speed-out 0.5s ease-in both; }

@keyframes roy-ferrum-light-speed-out {

  0%   { transform: translateX(0) skewX(0deg);   opacity: 1; }
  100% { transform: translateX(100%) skewX(30deg); opacity: 0; }

}`,
},

{
  id: "ferrum-roll-out",
  name: "Roll Out",
  category: "animations",
  description: "An animated motion effect (roll out)",
  tags: ["roll", "motion", "roll-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-roll-out { animation: roy-ferrum-roll-out 0.65s ease-in both; }

@keyframes roy-ferrum-roll-out {

  from { transform: rotateX(0deg)   translateZ(0);      opacity: 1; }
  to   { transform: rotateX(90deg)  translateZ(-100px); opacity: 0; }

}`,
},

{
  id: "ferrum-rotate-out",
  name: "Rotate Out",
  category: "animations",
  description: "An animated motion effect (rotate out)",
  tags: ["rotate", "transform", "rotate-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rotate-out { animation: roy-ferrum-rotate-out 0.7s ease-in both; }

@keyframes roy-ferrum-rotate-out {

  from { transform: rotate(0deg)  scale(1); opacity: 1; }
  to   { transform: rotate(200deg) scale(0); opacity: 0; }

}`,
},

{
  id: "ferrum-fade-out-scale",
  name: "Fade Out Scale",
  category: "animations",
  description: "An animated motion effect (fade out scale)",
  tags: ["fade", "transition", "fade-out-scale", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fade-out-scale { animation: roy-ferrum-fade-out-scale 0.5s ease-in both; }

@keyframes roy-ferrum-fade-out-scale {

  from { transform: scale(1);   filter: blur(0);   opacity: 1; }
  to   { transform: scale(1.2); filter: blur(4px); opacity: 0; }

}`,
},

{
  id: "ferrum-shrink-out",
  name: "Shrink Out",
  category: "animations",
  description: "An animated motion effect (shrink out)",
  tags: ["shrink", "scale", "shrink-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-shrink-out { animation: roy-ferrum-shrink-out 0.5s ease-in both; }

@keyframes roy-ferrum-shrink-out {

  from { transform: scale(1); opacity: 1; }
  to   { transform: scale(0); opacity: 0; }

}`,
},

{
  id: "ferrum-fold-out",
  name: "Fold Out",
  category: "animations",
  description: "An animated motion effect (fold out)",
  tags: ["fold", "motion", "fold-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fold-out {
  transform-origin: left center;
  animation: roy-ferrum-fold-out 0.55s ease-in both;
}

@keyframes roy-ferrum-fold-out {

  from { transform: perspective(400px) rotateY(0deg);  opacity: 1; }
  to   { transform: perspective(400px) rotateY(90deg); opacity: 0; }

}`,
},

{
  id: "ferrum-fly-out-up",
  name: "Fly Out Up",
  category: "animations",
  description: "An animated motion effect (fly out up)",
  tags: ["fly", "motion", "fly-out-up", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fly-out-up { animation: roy-ferrum-fly-out-up 0.4s ease-in both; }

@keyframes roy-ferrum-fly-out-up {

  from { transform: translateY(0);     opacity: 1; }
  to   { transform: translateY(-200%); opacity: 0; }

}`,
},

{
  id: "ferrum-bounce",
  name: "Bounce",
  category: "animations",
  description: "An animated motion effect (bounce)",
  tags: ["bounce", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-bounce { animation: roy-ferrum-bounce 1s ease infinite; }

@keyframes roy-ferrum-bounce {

  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40%  { transform: translateY(-20px); }
  60%  { transform: translateY(-10px); }

}`,
},

{
  id: "ferrum-pulse",
  name: "Pulse",
  category: "animations",
  description: "An animated motion effect (pulse)",
  tags: ["pulse", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-pulse { animation: roy-ferrum-pulse 1.2s ease-in-out infinite; }

@keyframes roy-ferrum-pulse {

  0%   { transform: scale(1); }
  50%  { transform: scale(1.05); }
  100% { transform: scale(1); }

}`,
},

{
  id: "ferrum-shake",
  name: "Shake",
  category: "animations",
  description: "An animated motion effect (shake)",
  tags: ["shake", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-shake { animation: roy-ferrum-shake 0.6s ease-in-out infinite; }

@keyframes roy-ferrum-shake {

  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80%     { transform: translateX(6px); }

}`,
},

{
  id: "ferrum-swing",
  name: "Swing",
  category: "animations",
  description: "An animated motion effect (swing)",
  tags: ["swing", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-swing {
  transform-origin: top center;
  animation: roy-ferrum-swing 1s ease-in-out infinite;
}

@keyframes roy-ferrum-swing {

  20%  { transform: rotate(15deg); }
  40%  { transform: rotate(-10deg); }
  60%  { transform: rotate(5deg); }
  80%  { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }

}`,
},

{
  id: "ferrum-tada",
  name: "Tada",
  category: "animations",
  description: "An animated motion effect (tada)",
  tags: ["tada", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-tada { animation: roy-ferrum-tada 1s ease-in-out infinite; }

@keyframes roy-ferrum-tada {

  0%   { transform: scale(1) rotate(0deg); }
  10%, 20% { transform: scale(0.9) rotate(-3deg); }
  30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
  40%, 60%, 80%     { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); }

}`,
},

{
  id: "ferrum-wobble",
  name: "Wobble",
  category: "animations",
  description: "An animated motion effect (wobble)",
  tags: ["wobble", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-wobble { animation: roy-ferrum-wobble 0.8s ease-in-out infinite; }

@keyframes roy-ferrum-wobble {

  0%   { transform: translateX(0) rotate(0deg); }
  15%  { transform: translateX(-15px) rotate(-5deg); }
  30%  { transform: translateX(12px)  rotate(3deg); }
  45%  { transform: translateX(-8px)  rotate(-3deg); }
  60%  { transform: translateX(5px)   rotate(2deg); }
  75%  { transform: translateX(-3px)  rotate(-1deg); }
  100% { transform: translateX(0)    rotate(0deg); }

}`,
},

{
  id: "ferrum-heartbeat",
  name: "Heartbeat",
  category: "animations",
  description: "An animated motion effect (heartbeat)",
  tags: ["heartbeat", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-heartbeat { animation: roy-ferrum-heartbeat 1.3s ease-in-out infinite; }

@keyframes roy-ferrum-heartbeat {

  0%   { transform: scale(1); }
  14%  { transform: scale(1.15); }
  28%  { transform: scale(1); }
  42%  { transform: scale(1.15); }
  70%  { transform: scale(1); }

}`,
},

{
  id: "ferrum-shake-x",
  name: "Shake X",
  category: "animations",
  description: "An animated motion effect (shake x)",
  tags: ["shake", "motion", "shake-x", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-shake-x { animation: roy-ferrum-shake-x 0.5s ease-in-out infinite; }

@keyframes roy-ferrum-shake-x {

  0%, 100% { transform: translateX(0); }
  10%, 50%, 90% { transform: translateX(-8px); }
  30%, 70%     { transform: translateX(8px); }

}`,
},

{
  id: "ferrum-shake-y",
  name: "Shake Y",
  category: "animations",
  description: "An animated motion effect (shake y)",
  tags: ["shake", "motion", "shake-y", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-shake-y { animation: roy-ferrum-shake-y 0.5s ease-in-out infinite; }

@keyframes roy-ferrum-shake-y {

  0%, 100% { transform: translateY(0); }
  10%, 50%, 90% { transform: translateY(-8px); }
  30%, 70%     { transform: translateY(8px); }

}`,
},

{
  id: "ferrum-jelly",
  name: "Jelly",
  category: "animations",
  description: "An animated motion effect (jelly)",
  tags: ["jelly", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-jelly { animation: roy-ferrum-jelly 0.9s ease-in-out infinite; }

@keyframes roy-ferrum-jelly {

  0%   { transform: scale(1, 1); }
  25%  { transform: scale(1.25, 0.75); }
  50%  { transform: scale(0.9, 1.1); }
  75%  { transform: scale(1.05, 0.95); }
  100% { transform: scale(1, 1); }

}`,
},

{
  id: "ferrum-rubber-band",
  name: "Rubber Band",
  category: "animations",
  description: "An animated motion effect (rubber band)",
  tags: ["rubber", "motion", "rubber-band", "band", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rubber-band { animation: roy-ferrum-rubber-band 1s ease-in-out infinite; }

@keyframes roy-ferrum-rubber-band {

  0%   { transform: scaleX(1); }
  20%  { transform: scaleX(1.25) scaleY(0.75); }
  40%  { transform: scaleX(0.75) scaleY(1.25); }
  60%  { transform: scaleX(1.15) scaleY(0.85); }
  80%  { transform: scaleX(0.95) scaleY(1.05); }
  100% { transform: scaleX(1)    scaleY(1); }

}`,
},

{
  id: "ferrum-pulse-glow",
  name: "Pulse Glow",
  category: "animations",
  description: "An animated motion effect (pulse glow)",
  tags: ["pulse", "motion", "pulse-glow", "glow", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-pulse-glow { animation: roy-ferrum-pulse-glow 1.5s ease-in-out infinite; }

@keyframes roy-ferrum-pulse-glow {

  0%, 100% {
    box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.558 0.252 302.32) 50%, transparent);
  }
  50% {
    box-shadow: 0 0 20px 10px color-mix(in oklch, oklch(0.558 0.252 302.32) 20%, transparent);
  }

}`,
},

{
  id: "ferrum-wiggle",
  name: "Wiggle",
  category: "animations",
  description: "An animated motion effect (wiggle)",
  tags: ["wiggle", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-wiggle { animation: roy-ferrum-wiggle 0.4s ease-in-out infinite; }

@keyframes roy-ferrum-wiggle {

  0%, 100% { transform: rotate(0deg); }
  25%      { transform: rotate(5deg); }
  75%      { transform: rotate(-5deg); }

}`,
},

{
  id: "ferrum-jello",
  name: "Jello",
  category: "animations",
  description: "An animated motion effect (jello)",
  tags: ["jello", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-jello { animation: roy-ferrum-jello 1s ease-in-out infinite; }

@keyframes roy-ferrum-jello {

  0%, 100% { transform: skewX(0deg)    skewY(0deg); }
  15%      { transform: skewX(-12deg)   skewY(-12deg); }
  30%      { transform: skewX(8deg)     skewY(8deg); }
  45%      { transform: skewX(-5deg)    skewY(-5deg); }
  60%      { transform: skewX(3deg)     skewY(3deg); }
  75%      { transform: skewX(-1deg)    skewY(-1deg); }

}`,
},

{
  id: "ferrum-sonar",
  name: "Sonar",
  category: "animations",
  description: "An animated motion effect (sonar)",
  tags: ["sonar", "motion", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-sonar { animation: roy-ferrum-sonar 1.6s ease-out infinite; }

@keyframes roy-ferrum-sonar {

  0%   {
    transform: scale(1);
    opacity: 0.8;
    box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.593 0.224 277.12) 60%, transparent);
  }
  70%  {
    transform: scale(1.1);
    opacity: 0;
    box-shadow: 0 0 0 20px color-mix(in oklch, oklch(0.593 0.224 277.12) 0%, transparent);
  }
  100% {
    transform: scale(1);
    opacity: 0;
    box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.593 0.224 277.12) 0%, transparent);
  }

}`,
},

];
