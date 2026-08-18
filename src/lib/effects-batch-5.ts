import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 5
 * 50 directional animation variants: fade, slide, zoom, bounce, blur, scale, and attention/entrance effects.
 * Every class is prefixed `roycss-` and every keyframe is prefixed `roy-`.
 * Each cssCode block is COMPLETE and SELF-CONTAINED (class definition + @keyframes).
 */
export const effectsBatch5: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // FADE VARIANTS (10)
  // ═══════════════════════════════════════════════════════════════

  // 1. fade-in
  {
    id: "fade-in",
    name: "Fade In",
    category: "animations",
    description: "Simple opacity fade in from transparent to fully visible",
    tags: ["fade", "opacity", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Fade In */
.roycss-fade-in {
  animation: roy-fade-in 0.6s ease-out both;
}

@keyframes roy-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}`,
  },

  // 2. fade-in-down
  {
    id: "fade-in-down",
    name: "Fade In Down",
    category: "animations",
    description: "Fade in while descending from above into final position",
    tags: ["fade", "opacity", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Fade In Down */
.roycss-fade-in-down {
  animation: roy-fade-in-down 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-fade-in-down {
  from {
    opacity: 0;
    transform: translate3d(0, -28px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 3. fade-in-left
  {
    id: "fade-in-left",
    name: "Fade In Left",
    category: "animations",
    description: "Fade in while sliding in from the left edge",
    tags: ["fade", "opacity", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Fade In Left */
.roycss-fade-in-left {
  animation: roy-fade-in-left 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-fade-in-left {
  from {
    opacity: 0;
    transform: translate3d(-32px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 4. fade-in-right
  {
    id: "fade-in-right",
    name: "Fade In Right",
    category: "animations",
    description: "Fade in while sliding in from the right edge",
    tags: ["fade", "opacity", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Fade In Right */
.roycss-fade-in-right {
  animation: roy-fade-in-right 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-fade-in-right {
  from {
    opacity: 0;
    transform: translate3d(32px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 5. fade-out
  {
    id: "fade-out",
    name: "Fade Out",
    category: "animations",
    description: "Simple opacity fade out from visible to transparent",
    tags: ["fade", "opacity", "exit", "animate"],
    previewType: "box",
    cssCode: `/* Fade Out */
.roycss-fade-out {
  animation: roy-fade-out 0.6s ease-in both;
}

@keyframes roy-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}`,
  },

  // 6. fade-out-up
  {
    id: "fade-out-up",
    name: "Fade Out Up",
    category: "animations",
    description: "Fade out while ascending upward out of view",
    tags: ["fade", "opacity", "translate", "exit"],
    previewType: "box",
    cssCode: `/* Fade Out Up */
.roycss-fade-out-up {
  animation: roy-fade-out-up 0.7s cubic-bezier(0.55, 0, 0.68, 0.53) both;
}

@keyframes roy-fade-out-up {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    transform: translate3d(0, -28px, 0);
  }
}`,
  },

  // 7. fade-out-left
  {
    id: "fade-out-left",
    name: "Fade Out Left",
    category: "animations",
    description: "Fade out while sliding toward the left edge",
    tags: ["fade", "opacity", "translate", "exit"],
    previewType: "box",
    cssCode: `/* Fade Out Left */
.roycss-fade-out-left {
  animation: roy-fade-out-left 0.7s cubic-bezier(0.55, 0, 0.68, 0.53) both;
}

@keyframes roy-fade-out-left {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    transform: translate3d(-32px, 0, 0);
  }
}`,
  },

  // 8. fade-out-right
  {
    id: "fade-out-right",
    name: "Fade Out Right",
    category: "animations",
    description: "Fade out while sliding toward the right edge",
    tags: ["fade", "opacity", "translate", "exit"],
    previewType: "box",
    cssCode: `/* Fade Out Right */
.roycss-fade-out-right {
  animation: roy-fade-out-right 0.7s cubic-bezier(0.55, 0, 0.68, 0.53) both;
}

@keyframes roy-fade-out-right {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    transform: translate3d(32px, 0, 0);
  }
}`,
  },

  // 9. fade-in-bl (bottom-left)
  {
    id: "fade-in-bl",
    name: "Fade In Bottom-Left",
    category: "animations",
    description: "Diagonal fade-in entering from the bottom-left corner",
    tags: ["fade", "opacity", "diagonal", "entrance"],
    previewType: "box",
    cssCode: `/* Fade In Bottom-Left */
.roycss-fade-in-bl {
  animation: roy-fade-in-bl 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-fade-in-bl {
  from {
    opacity: 0;
    transform: translate3d(-28px, 28px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 10. fade-in-br (bottom-right)
  {
    id: "fade-in-br",
    name: "Fade In Bottom-Right",
    category: "animations",
    description: "Diagonal fade-in entering from the bottom-right corner",
    tags: ["fade", "opacity", "diagonal", "entrance"],
    previewType: "box",
    cssCode: `/* Fade In Bottom-Right */
.roycss-fade-in-br {
  animation: roy-fade-in-br 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-fade-in-br {
  from {
    opacity: 0;
    transform: translate3d(28px, 28px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // SLIDE VARIANTS (8)
  // ═══════════════════════════════════════════════════════════════

  // 11. slide-in-top
  {
    id: "slide-in-top",
    name: "Slide In Top",
    category: "animations",
    description: "Slide in from the top edge, fully off-screen to position",
    tags: ["slide", "translate", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Slide In Top */
.roycss-slide-in-top {
  animation: roy-slide-in-top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes roy-slide-in-top {
  from {
    transform: translate3d(0, -100%, 0);
    visibility: visible;
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 12. slide-in-bottom
  {
    id: "slide-in-bottom",
    name: "Slide In Bottom",
    category: "animations",
    description: "Slide in from the bottom edge, fully off-screen to position",
    tags: ["slide", "translate", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Slide In Bottom */
.roycss-slide-in-bottom {
  animation: roy-slide-in-bottom 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes roy-slide-in-bottom {
  from {
    transform: translate3d(0, 100%, 0);
    visibility: visible;
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 13. slide-out-top
  {
    id: "slide-out-top",
    name: "Slide Out Top",
    category: "animations",
    description: "Slide out upward, completely exiting through the top edge",
    tags: ["slide", "translate", "exit", "animate"],
    previewType: "box",
    cssCode: `/* Slide Out Top */
.roycss-slide-out-top {
  animation: roy-slide-out-top 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) both;
}

@keyframes roy-slide-out-top {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    visibility: hidden;
    transform: translate3d(0, -100%, 0);
  }
}`,
  },

  // 14. slide-out-bottom
  {
    id: "slide-out-bottom",
    name: "Slide Out Bottom",
    category: "animations",
    description: "Slide out downward, completely exiting through the bottom edge",
    tags: ["slide", "translate", "exit", "animate"],
    previewType: "box",
    cssCode: `/* Slide Out Bottom */
.roycss-slide-out-bottom {
  animation: roy-slide-out-bottom 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) both;
}

@keyframes roy-slide-out-bottom {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    visibility: hidden;
    transform: translate3d(0, 100%, 0);
  }
}`,
  },

  // 15. slide-out-left
  {
    id: "slide-out-left",
    name: "Slide Out Left",
    category: "animations",
    description: "Slide out leftward, completely exiting through the left edge",
    tags: ["slide", "translate", "exit", "animate"],
    previewType: "box",
    cssCode: `/* Slide Out Left */
.roycss-slide-out-left {
  animation: roy-slide-out-left 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) both;
}

@keyframes roy-slide-out-left {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    visibility: hidden;
    transform: translate3d(-100%, 0, 0);
  }
}`,
  },

  // 16. slide-out-right
  {
    id: "slide-out-right",
    name: "Slide Out Right",
    category: "animations",
    description: "Slide out rightward, completely exiting through the right edge",
    tags: ["slide", "translate", "exit", "animate"],
    previewType: "box",
    cssCode: `/* Slide Out Right */
.roycss-slide-out-right {
  animation: roy-slide-out-right 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) both;
}

@keyframes roy-slide-out-right {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    visibility: hidden;
    transform: translate3d(100%, 0, 0);
  }
}`,
  },

  // 17. slide-diagonal
  {
    id: "slide-diagonal",
    name: "Slide Diagonal",
    category: "animations",
    description: "Continuous diagonal slide that loops across the preview area",
    tags: ["slide", "diagonal", "loop", "animate"],
    previewType: "box",
    cssCode: `/* Slide Diagonal */
.roycss-slide-diagonal {
  animation: roy-slide-diagonal 3s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
}

@keyframes roy-slide-diagonal {
  0% {
    transform: translate3d(-30px, 30px, 0) rotate(-3deg);
  }
  100% {
    transform: translate3d(30px, -30px, 0) rotate(3deg);
  }
}`,
  },

  // 18. slide-rotate-in
  {
    id: "slide-rotate-in",
    name: "Slide Rotate In",
    category: "animations",
    description: "Combined slide and rotate entrance with a finishing spin",
    tags: ["slide", "rotate", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Slide Rotate In */
.roycss-slide-rotate-in {
  animation: roy-slide-rotate-in 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-slide-rotate-in {
  0% {
    opacity: 0;
    transform: translate3d(60px, 0, 0) rotate(180deg);
  }
  60% {
    opacity: 1;
    transform: translate3d(-8px, 0, 0) rotate(-12deg);
  }
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // ZOOM VARIANTS (6)
  // ═══════════════════════════════════════════════════════════════

  // 19. zoom-in-left
  {
    id: "zoom-in-left",
    name: "Zoom In Left",
    category: "animations",
    description: "Scale up from zero while sliding in from the left",
    tags: ["zoom", "scale", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Zoom In Left */
.roycss-zoom-in-left {
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

  // 20. zoom-in-right
  {
    id: "zoom-in-right",
    name: "Zoom In Right",
    category: "animations",
    description: "Scale up from zero while sliding in from the right",
    tags: ["zoom", "scale", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Zoom In Right */
.roycss-zoom-in-right {
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

  // 21. zoom-in-up
  {
    id: "zoom-in-up",
    name: "Zoom In Up",
    category: "animations",
    description: "Scale up from zero while rising from below",
    tags: ["zoom", "scale", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Zoom In Up */
.roycss-zoom-in-up {
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

  // 22. zoom-in-down
  {
    id: "zoom-in-down",
    name: "Zoom In Down",
    category: "animations",
    description: "Scale up from zero while dropping from above",
    tags: ["zoom", "scale", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Zoom In Down */
.roycss-zoom-in-down {
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

  // 23. zoom-out-left
  {
    id: "zoom-out-left",
    name: "Zoom Out Left",
    category: "animations",
    description: "Shrink and exit diagonally toward the left edge",
    tags: ["zoom", "scale", "translate", "exit"],
    previewType: "box",
    cssCode: `/* Zoom Out Left */
.roycss-zoom-out-left {
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

  // 24. zoom-out-up
  {
    id: "zoom-out-up",
    name: "Zoom Out Up",
    category: "animations",
    description: "Shrink and exit diagonally upward out of view",
    tags: ["zoom", "scale", "translate", "exit"],
    previewType: "box",
    cssCode: `/* Zoom Out Up */
.roycss-zoom-out-up {
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
  // BOUNCE VARIANTS (5)
  // ═══════════════════════════════════════════════════════════════

  // 25. bounce-in-left
  {
    id: "bounce-in-left",
    name: "Bounce In Left",
    category: "animations",
    description: "Elastic bounce entrance traveling in from the left",
    tags: ["bounce", "spring", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Bounce In Left */
.roycss-bounce-in-left {
  animation: roy-bounce-in-left 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

@keyframes roy-bounce-in-left {
  0% {
    opacity: 0;
    transform: translate3d(-3000px, 0, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(25px, 0, 0);
  }
  75% {
    transform: translate3d(-12px, 0, 0);
  }
  90% {
    transform: translate3d(6px, 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 26. bounce-in-right
  {
    id: "bounce-in-right",
    name: "Bounce In Right",
    category: "animations",
    description: "Elastic bounce entrance traveling in from the right",
    tags: ["bounce", "spring", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Bounce In Right */
.roycss-bounce-in-right {
  animation: roy-bounce-in-right 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

@keyframes roy-bounce-in-right {
  0% {
    opacity: 0;
    transform: translate3d(3000px, 0, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(-25px, 0, 0);
  }
  75% {
    transform: translate3d(12px, 0, 0);
  }
  90% {
    transform: translate3d(-6px, 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 27. bounce-in-up
  {
    id: "bounce-in-up",
    name: "Bounce In Up",
    category: "animations",
    description: "Elastic bounce entrance rising upward from below",
    tags: ["bounce", "spring", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Bounce In Up */
.roycss-bounce-in-up {
  animation: roy-bounce-in-up 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

@keyframes roy-bounce-in-up {
  0% {
    opacity: 0;
    transform: translate3d(0, 3000px, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(0, -24px, 0);
  }
  75% {
    transform: translate3d(0, 12px, 0);
  }
  90% {
    transform: translate3d(0, -6px, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 28. bounce-in-down
  {
    id: "bounce-in-down",
    name: "Bounce In Down",
    category: "animations",
    description: "Elastic bounce entrance dropping downward from above",
    tags: ["bounce", "spring", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Bounce In Down */
.roycss-bounce-in-down {
  animation: roy-bounce-in-down 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

@keyframes roy-bounce-in-down {
  0% {
    opacity: 0;
    transform: translate3d(0, -3000px, 0);
  }
  60% {
    opacity: 1;
    transform: translate3d(0, 24px, 0);
  }
  75% {
    transform: translate3d(0, -12px, 0);
  }
  90% {
    transform: translate3d(0, 6px, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 29. bounce-rotate
  {
    id: "bounce-rotate",
    name: "Bounce Rotate",
    category: "animations",
    description: "Bouncing entrance combined with a playful rotation",
    tags: ["bounce", "rotate", "spring", "animate"],
    previewType: "box",
    cssCode: `/* Bounce Rotate */
.roycss-bounce-rotate {
  animation: roy-bounce-rotate 1.1s cubic-bezier(0.28, 1.42, 0.55, 1) both;
}

@keyframes roy-bounce-rotate {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-180deg);
  }
  40% {
    opacity: 1;
    transform: scale(1.15) rotate(20deg);
  }
  60% {
    transform: scale(0.92) rotate(-10deg);
  }
  80% {
    transform: scale(1.04) rotate(4deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // BLUR VARIANTS (4)
  // ═══════════════════════════════════════════════════════════════

  // 30. blur-in
  {
    id: "blur-in",
    name: "Blur In",
    category: "animations",
    description: "Element fades in while a heavy blur resolves into focus",
    tags: ["blur", "filter", "opacity", "entrance"],
    previewType: "box",
    cssCode: `/* Blur In */
.roycss-blur-in {
  animation: roy-blur-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-blur-in {
  from {
    opacity: 0;
    filter: blur(24px);
    transform: scale(1.05);
  }
  to {
    opacity: 1;
    filter: blur(0px);
    transform: scale(1);
  }
}`,
  },

  // 31. blur-in-up
  {
    id: "blur-in-up",
    name: "Blur In Up",
    category: "animations",
    description: "Blurred element rises from below while resolving into focus",
    tags: ["blur", "filter", "translate", "entrance"],
    previewType: "box",
    cssCode: `/* Blur In Up */
.roycss-blur-in-up {
  animation: roy-blur-in-up 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes roy-blur-in-up {
  from {
    opacity: 0;
    filter: blur(18px);
    transform: translate3d(0, 40px, 0);
  }
  to {
    opacity: 1;
    filter: blur(0px);
    transform: translate3d(0, 0, 0);
  }
}`,
  },

  // 32. blur-out
  {
    id: "blur-out",
    name: "Blur Out",
    category: "animations",
    description: "Element blurs out of focus while fading away",
    tags: ["blur", "filter", "opacity", "exit"],
    previewType: "box",
    cssCode: `/* Blur Out */
.roycss-blur-out {
  animation: roy-blur-out 0.8s cubic-bezier(0.55, 0, 0.68, 0.53) both;
}

@keyframes roy-blur-out {
  from {
    opacity: 1;
    filter: blur(0px);
    transform: scale(1);
  }
  to {
    opacity: 0;
    filter: blur(24px);
    transform: scale(0.95);
  }
}`,
  },

  // 33. blur-out-down
  {
    id: "blur-out-down",
    name: "Blur Out Down",
    category: "animations",
    description: "Element blurs and descends out of view",
    tags: ["blur", "filter", "translate", "exit"],
    previewType: "box",
    cssCode: `/* Blur Out Down */
.roycss-blur-out-down {
  animation: roy-blur-out-down 0.85s cubic-bezier(0.55, 0, 0.68, 0.53) both;
}

@keyframes roy-blur-out-down {
  from {
    opacity: 1;
    filter: blur(0px);
    transform: translate3d(0, 0, 0);
  }
  to {
    opacity: 0;
    filter: blur(18px);
    transform: translate3d(0, 40px, 0);
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // SCALE VARIANTS (4)
  // ═══════════════════════════════════════════════════════════════

  // 34. scale-grow
  {
    id: "scale-grow",
    name: "Scale Grow",
    category: "animations",
    description: "Element grows from nothing with a slight overshoot",
    tags: ["scale", "grow", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Scale Grow */
.roycss-scale-grow {
  animation: roy-scale-grow 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-scale-grow {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  70% {
    opacity: 1;
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
  }
}`,
  },

  // 35. scale-shrink
  {
    id: "scale-shrink",
    name: "Scale Shrink",
    category: "animations",
    description: "Element starts oversized and shrinks into its final size",
    tags: ["scale", "shrink", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Scale Shrink */
.roycss-scale-shrink {
  animation: roy-scale-shrink 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes roy-scale-shrink {
  0% {
    opacity: 0;
    transform: scale(1.8);
  }
  70% {
    opacity: 1;
    transform: scale(0.92);
  }
  100% {
    transform: scale(1);
  }
}`,
  },

  // 36. scale-expand
  {
    id: "scale-expand",
    name: "Scale Expand",
    category: "animations",
    description: "Width and height expand independently to fill out the element",
    tags: ["scale", "expand", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Scale Expand */
.roycss-scale-expand {
  animation: roy-scale-expand 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: center;
}

@keyframes roy-scale-expand {
  0% {
    opacity: 0;
    transform: scaleX(0.2) scaleY(0.6);
  }
  55% {
    opacity: 1;
    transform: scaleX(1.1) scaleY(0.85);
  }
  100% {
    transform: scaleX(1) scaleY(1);
  }
}`,
  },

  // 37. scale-compress
  {
    id: "scale-compress",
    name: "Scale Compress",
    category: "animations",
    description: "Element springs in from a vertically compressed state",
    tags: ["scale", "compress", "spring", "entrance"],
    previewType: "box",
    cssCode: `/* Scale Compress */
.roycss-scale-compress {
  animation: roy-scale-compress 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  transform-origin: center;
}

@keyframes roy-scale-compress {
  0% {
    opacity: 0;
    transform: scaleY(0.2) scaleX(1.4);
  }
  60% {
    opacity: 1;
    transform: scaleY(1.15) scaleX(0.9);
  }
  100% {
    transform: scaleY(1) scaleX(1);
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // OTHER DIRECTIONAL / ATTENTION (13)
  // ═══════════════════════════════════════════════════════════════

  // 38. swing-in
  {
    id: "swing-in",
    name: "Swing In",
    category: "animations",
    description: "Element swings in from above with a pendulum-like motion",
    tags: ["swing", "rotate", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Swing In */
.roycss-swing-in {
  animation: roy-swing-in 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
  transform-origin: top center;
}

@keyframes roy-swing-in {
  0% {
    opacity: 0;
    transform: rotate3d(0, 0, 1, -90deg);
  }
  40% {
    opacity: 1;
    transform: rotate3d(0, 0, 1, 25deg);
  }
  60% {
    transform: rotate3d(0, 0, 1, -15deg);
  }
  80% {
    transform: rotate3d(0, 0, 1, 8deg);
  }
  100% {
    transform: rotate3d(0, 0, 1, 0deg);
  }
}`,
  },

  // 39. drop-in
  {
    id: "drop-in",
    name: "Drop In",
    category: "animations",
    description: "Element falls from above and bounces on landing",
    tags: ["drop", "fall", "bounce", "entrance"],
    previewType: "box",
    cssCode: `/* Drop In */
.roycss-drop-in {
  animation: roy-drop-in 1s cubic-bezier(0.645, 0.045, 0.355, 1) both;
  transform-origin: center bottom;
}

@keyframes roy-drop-in {
  0% {
    opacity: 0;
    transform: translate3d(0, -300px, 0) scaleY(0.6);
  }
  50% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scaleY(1.1);
  }
  65% {
    transform: translate3d(0, -20px, 0) scaleY(0.95);
  }
  80% {
    transform: translate3d(0, 0, 0) scaleY(1.04);
  }
  100% {
    transform: translate3d(0, 0, 0) scaleY(1);
  }
}`,
  },

  // 40. pop-in
  {
    id: "pop-in",
    name: "Pop In",
    category: "animations",
    description: "Snappy scale pop entrance with a quick overshoot",
    tags: ["pop", "scale", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Pop In */
.roycss-pop-in {
  animation: roy-pop-in 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
}

@keyframes roy-pop-in {
  0% {
    opacity: 0;
    transform: scale3d(0, 0, 0);
  }
  60% {
    opacity: 1;
    transform: scale3d(1.2, 1.2, 1.2);
  }
  100% {
    transform: scale3d(1, 1, 1);
  }
}`,
  },

  // 41. pop-out
  {
    id: "pop-out",
    name: "Pop Out",
    category: "animations",
    description: "Snappy scale pop exit with a final shrink to nothing",
    tags: ["pop", "scale", "exit", "animate"],
    previewType: "box",
    cssCode: `/* Pop Out */
.roycss-pop-out {
  animation: roy-pop-out 0.5s cubic-bezier(0.32, -0.28, 0.82, 0.11) both;
}

@keyframes roy-pop-out {
  0% {
    opacity: 1;
    transform: scale3d(1, 1, 1);
  }
  50% {
    opacity: 0.7;
    transform: scale3d(1.2, 1.2, 1.2);
  }
  100% {
    opacity: 0;
    transform: scale3d(0, 0, 0);
  }
}`,
  },

  // 42. blink
  {
    id: "blink",
    name: "Blink",
    category: "animations",
    description: "Continuous opacity blink that flashes on and off",
    tags: ["blink", "opacity", "loop", "attention"],
    previewType: "box",
    cssCode: `/* Blink */
.roycss-blink {
  animation: roy-blink 1.4s steps(2, start) infinite;
}

@keyframes roy-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.15; }
}`,
  },

  // 43. vibrate
  {
    id: "vibrate",
    name: "Vibrate",
    category: "animations",
    description: "Rapid tiny translates that simulate a phone vibration",
    tags: ["vibrate", "shake", "loop", "attention"],
    previewType: "box",
    cssCode: `/* Vibrate */
.roycss-vibrate {
  animation: roy-vibrate 0.32s linear infinite;
}

@keyframes roy-vibrate {
  0%   { transform: translate3d(0, 0, 0); }
  10%  { transform: translate3d(-2px, 1px, 0); }
  20%  { transform: translate3d(2px, -1px, 0); }
  30%  { transform: translate3d(-2px, -1px, 0); }
  40%  { transform: translate3d(2px, 1px, 0); }
  50%  { transform: translate3d(-1px, 2px, 0); }
  60%  { transform: translate3d(1px, -2px, 0); }
  70%  { transform: translate3d(-2px, 1px, 0); }
  80%  { transform: translate3d(2px, -1px, 0); }
  90%  { transform: translate3d(-1px, 1px, 0); }
  100% { transform: translate3d(0, 0, 0); }
}`,
  },

  // 44. jiggle
  {
    id: "jiggle",
    name: "Jiggle",
    category: "animations",
    description: "Quick rotational jiggle loop that wiggles side to side",
    tags: ["jiggle", "rotate", "loop", "attention"],
    previewType: "box",
    cssCode: `/* Jiggle */
.roycss-jiggle {
  animation: roy-jiggle 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
  transform-origin: center;
}

@keyframes roy-jiggle {
  0%, 100% { transform: rotate(0deg); }
  20%      { transform: rotate(-7deg); }
  40%      { transform: rotate(6deg); }
  60%      { transform: rotate(-4deg); }
  80%      { transform: rotate(3deg); }
}`,
  },

  // 45. sway
  {
    id: "sway",
    name: "Sway",
    category: "animations",
    description: "Gentle continuous sway as if moved by a soft breeze",
    tags: ["sway", "rotate", "loop", "ambient"],
    previewType: "box",
    cssCode: `/* Sway */
.roycss-sway {
  animation: roy-sway 4s ease-in-out infinite;
  transform-origin: top center;
}

@keyframes roy-sway {
  0%, 100% { transform: rotate(-4deg); }
  50%      { transform: rotate(4deg); }
}`,
  },

  // 46. pendulum
  {
    id: "pendulum",
    name: "Pendulum",
    category: "animations",
    description: "Pendulum swing that decelerates at each end of the arc",
    tags: ["pendulum", "swing", "loop", "ambient"],
    previewType: "box",
    cssCode: `/* Pendulum */
.roycss-pendulum {
  animation: roy-pendulum 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  transform-origin: top center;
}

@keyframes roy-pendulum {
  0%   { transform: rotate(28deg); }
  50%  { transform: rotate(-28deg); }
  100% { transform: rotate(28deg); }
}`,
  },

  // 47. snap-in
  {
    id: "snap-in",
    name: "Snap In",
    category: "animations",
    description: "Quick snap entrance that slams into place and settles",
    tags: ["snap", "spring", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Snap In */
.roycss-snap-in {
  animation: roy-snap-in 0.55s cubic-bezier(0.16, 1.32, 0.5, 1) both;
  transform-origin: center;
}

@keyframes roy-snap-in {
  0% {
    opacity: 0;
    transform: scale(1.6) translate3d(40px, -20px, 0);
  }
  55% {
    opacity: 1;
    transform: scale(0.85) translate3d(-4px, 2px, 0);
  }
  75% {
    transform: scale(1.06) translate3d(2px, -1px, 0);
  }
  100% {
    transform: scale(1) translate3d(0, 0, 0);
  }
}`,
  },

  // 48. stretch
  {
    id: "stretch",
    name: "Stretch",
    category: "animations",
    description: "Vertical stretch spring loop that elongates and compresses",
    tags: ["stretch", "scale", "loop", "ambient"],
    previewType: "box",
    cssCode: `/* Stretch */
.roycss-stretch {
  animation: roy-stretch 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
  transform-origin: center;
}

@keyframes roy-stretch {
  0%, 100% { transform: scaleY(1) scaleX(1); }
  40%      { transform: scaleY(1.4) scaleX(0.75); }
  70%      { transform: scaleY(0.85) scaleX(1.12); }
}`,
  },

  // 49. spring-in
  {
    id: "spring-in",
    name: "Spring In",
    category: "animations",
    description: "Bouncy spring entrance that overshoots and oscillates to rest",
    tags: ["spring", "bounce", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Spring In */
.roycss-spring-in {
  animation: roy-spring-in 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
  transform-origin: center bottom;
}

@keyframes roy-spring-in {
  0% {
    opacity: 0;
    transform: translate3d(0, 200px, 0) scale(0.5);
  }
  35% {
    opacity: 1;
    transform: translate3d(0, -30px, 0) scale(1.1);
  }
  55% {
    transform: translate3d(0, 10px, 0) scale(0.95);
  }
  75% {
    transform: translate3d(0, -4px, 0) scale(1.02);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}`,
  },

  // 50. dissolve
  {
    id: "dissolve",
    name: "Dissolve",
    category: "animations",
    description: "Element dissolves into particles via scale, blur, and opacity",
    tags: ["dissolve", "blur", "scale", "exit"],
    previewType: "box",
    cssCode: `/* Dissolve */
.roycss-dissolve {
  animation: roy-dissolve 1s cubic-bezier(0.55, 0, 0.45, 1) both;
}

@keyframes roy-dissolve {
  0% {
    opacity: 1;
    filter: blur(0px);
    transform: scale(1);
  }
  40% {
    opacity: 0.7;
    filter: blur(4px);
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    filter: blur(20px);
    transform: scale(0.7);
  }
}`,
  },
];
