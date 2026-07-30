import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 33 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch33: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // 3D-TRANSFORMS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-transform-origin-spin",
  name: "Transform Origin Spin",
  category: "3d-transforms",
  description: "An animated motion effect (transform origin spin)",
  tags: ["transform-origin-spin", "origin", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-transform-origin-spin {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.685 0.131 226.94));
  border-radius: 8px;
  transform-origin: 0% 0%;
  animation: roy-origin-spin 2s linear infinite;
}

@keyframes roy-origin-spin {

  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-slide-out-bottom",
  name: "Slide Out Bottom",
  category: "animations",
  description: "An animated motion effect (slide out bottom)",
  tags: ["slide", "transition", "slide-out-bottom", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-out-bottom {
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

{
  id: "ferrum-slide-out-top",
  name: "Slide Out Top",
  category: "animations",
  description: "An animated motion effect (slide out top)",
  tags: ["slide", "transition", "slide-out-top", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-out-top {
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

{
  id: "ferrum-slide-rotate-in",
  name: "Slide Rotate In",
  category: "animations",
  description: "An animated motion effect (slide rotate in)",
  tags: ["slide", "transition", "slide-rotate-in", "rotate", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-rotate-in {
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

{
  id: "ferrum-slot-machine",
  name: "Slot Machine",
  category: "animations",
  description: "A slot machine effect",
  tags: ["slot-machine", "machine"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slot-machine {
  position: relative;
  width: 200px;
  height: 160px;
  background: linear-gradient(180deg, oklch(0.652 0.132 81.57) 0%, oklch(0.541 0.104 84.45) 50%, oklch(0.384 0.075 75.85) 100%);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 10px 25px color-mix(in oklch, oklch(0 0 0) 40%, transparent), inset 0 2px 6px color-mix(in oklch, oklch(0.902 0.143 93.06) 40%, transparent);
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}`,
},

{
  id: "ferrum-snap-in",
  name: "Snap In",
  category: "animations",
  description: "An animated motion effect (snap in)",
  tags: ["snap-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-snap-in {
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

{
  id: "ferrum-spring-in",
  name: "Spring In",
  category: "animations",
  description: "An animated motion effect (spring in)",
  tags: ["spring-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-spring-in {
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

{
  id: "ferrum-stretch",
  name: "Stretch",
  category: "animations",
  description: "An animated motion effect (stretch)",
  tags: ["stretch", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-stretch {
  animation: roy-stretch 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
  transform-origin: center;
}

@keyframes roy-stretch {

  0%, 100% { transform: scaleY(1) scaleX(1); }
  40%      { transform: scaleY(1.4) scaleX(0.75); }
  70%      { transform: scaleY(0.85) scaleX(1.12); }

}`,
},

{
  id: "ferrum-sway",
  name: "Sway",
  category: "animations",
  description: "An animated motion effect (sway)",
  tags: ["sway", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-sway {
  animation: roy-sway 4s ease-in-out infinite;
  transform-origin: top center;
}

@keyframes roy-sway {

  0%, 100% { transform: rotate(-4deg); }
  50%      { transform: rotate(4deg); }

}`,
},

{
  id: "ferrum-swing-in",
  name: "Swing In",
  category: "animations",
  description: "An animated motion effect (swing in)",
  tags: ["swing", "motion", "swing-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-swing-in {
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

{
  id: "ferrum-vibrate",
  name: "Vibrate",
  category: "animations",
  description: "An animated motion effect (vibrate)",
  tags: ["vibrate", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-vibrate {
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

  // ═══════════════════════════════════════════════════════════════
  // TEXT
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-text-3d-cinema",
  name: "3D Cinema",
  category: "text",
  description: "A text effect that styles and animates letterforms (3d cinema)",
  tags: ["text", "typography", "text-3d-cinema", "3d", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-3d-cinema {
  display: inline-block;
  position: relative;
  font: 900 72px/1 'Arial Black', sans-serif;
  letter-spacing: 0.06em;
  color: oklch(0.973 0.051 97.64);
  padding: 30px 40px;
  background: linear-gradient(180deg, oklch(0.179 0.037 79.02) 0%, oklch(0 0 0) 100%);
  border-radius: 10px;
  text-shadow:
    1px 1px 0 oklch(0.541 0.104 84.45),
    2px 2px 0 oklch(0.541 0.104 84.45),
    3px 3px 0 oklch(0.48 0.092 85.67),
    4px 4px 0 oklch(0.48 0.092 85.67),
    5px 5px 0 oklch(0.412 0.078 85.41),
    6px 6px 0 oklch(0.412 0.078 85.41),
    7px 7px 0 oklch(0.343 0.064 86.93),
    8px 8px 0 oklch(0.343 0.064 86.93),
    9px 9px 0 oklch(0.266 0.047 88.38),
    10px 10px 0 oklch(0.266 0.047 88.38),
    11px 11px 8px color-mix(in oklch, oklch(0 0 0) 60%, transparent),
    14px 14px 20px color-mix(in oklch, oklch(0 0 0) 80%, transparent);
  background-clip: border-box;
  filter: drop-shadow(0 0 12px color-mix(in oklch, oklch(0.861 0.147 83.67) 40%, transparent));
  animation: roy-b11-text-3d-cinema-light 4s ease-in-out infinite;
}

@keyframes roy-b11-text-3d-cinema-light {

  0%, 100% { filter: drop-shadow(0 0 12px color-mix(in oklch, oklch(0.861 0.147 83.67) 40%, transparent)) brightness(1); }
  50%      { filter: drop-shadow(0 0 24px color-mix(in oklch, oklch(0.861 0.147 83.67) 70%, transparent)) brightness(1.15); }

}`,
},

{
  id: "ferrum-text-3d-shadow",
  name: "3D Shadow",
  category: "text",
  description: "A text effect that styles and animates letterforms (3d shadow)",
  tags: ["text", "typography", "text-3d-shadow", "3d"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-3d-shadow {
  color: oklch(0.982 0.018 155.83);
  text-shadow:
    1px 1px 0 oklch(0.432 0.086 166.91),
    2px 2px 0 oklch(0.508 0.105 165.61),
    3px 3px 0 oklch(0.596 0.127 163.23),
    4px 4px 0 oklch(0.696 0.149 162.48),
    5px 5px 0 color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent),
    6px 6px 10px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  font-weight: 700;
}`,
},

{
  id: "ferrum-text-blur-reveal",
  name: "Blur Reveal",
  category: "text",
  description: "A text effect that styles and animates letterforms (blur reveal)",
  tags: ["text", "typography", "text-blur-reveal", "blur", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-blur-reveal {
  color: oklch(0.696 0.149 162.48);
  font-weight: 700;
  animation: roy-blur-reveal 4s ease-in-out infinite;
}

@keyframes roy-blur-reveal {

  0%, 100% { filter: blur(8px); opacity: 0.4; }
  50% { filter: blur(0); opacity: 1; }

}`,
},

{
  id: "ferrum-text-bounce-letters",
  name: "Bounce Letters",
  category: "text",
  description: "A text effect that styles and animates letterforms (bounce letters)",
  tags: ["text", "typography", "text-bounce-letters", "bounce"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-bounce-letters {
  display: inline-flex;
  font-weight: 700;
  color: oklch(0.685 0.131 226.94);
}`,
},

{
  id: "ferrum-text-chrome",
  name: "Chrome",
  category: "text",
  description: "A text effect that styles and animates letterforms (chrome)",
  tags: ["text", "typography", "text-chrome", "chrome"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-chrome {
  background: linear-gradient(
    180deg,
    oklch(0.962 0.058 95.62) 0%,
    oklch(0.984 0.003 247.86) 25%,
    oklch(0.711 0.035 256.79) 50%,
    oklch(0.984 0.003 247.86) 75%,
    oklch(0.869 0.02 252.89) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 800;
  letter-spacing: 1px;
  filter: drop-shadow(0 2px 2px color-mix(in oklch, oklch(0 0 0) 40%, transparent));
}`,
},

{
  id: "ferrum-text-emboss",
  name: "Emboss",
  category: "text",
  description: "A text effect that styles and animates letterforms (emboss)",
  tags: ["text", "typography", "text-emboss", "emboss"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-emboss {
  display: inline-block;
  font: 900 64px/1 'Georgia', serif;
  letter-spacing: 0.05em;
  color: oklch(0.482 0.042 69.22);
  padding: 24px 36px;
  background:
    radial-gradient(ellipse 60% 40% at 30% 30%, color-mix(in oklch, oklch(0.959 0.042 84.58) 30%, transparent), transparent 60%),
    linear-gradient(135deg, oklch(0.73 0.048 79.93) 0%, oklch(0.587 0.045 81.46) 50%, oklch(0.674 0.06 84.3) 100%);
  border-radius: 8px;
  box-shadow:
    inset 4px 4px 8px color-mix(in oklch, oklch(0.984 0.027 95.33) 40%, transparent),
    inset -4px -4px 8px color-mix(in oklch, oklch(0.243 0.03 76.73) 40%, transparent),
    0 6px 20px color-mix(in oklch, oklch(0.243 0.03 76.73) 40%, transparent);
  text-shadow:
    1px 1px 1px color-mix(in oklch, oklch(0.971 0.034 88.77) 70%, transparent),
    -1px -1px 1px color-mix(in oklch, oklch(0.201 0.025 65.66) 80%, transparent),
    0 4px 6px color-mix(in oklch, oklch(0.201 0.025 65.66) 40%, transparent);
  background-clip: border-box;
}`,
},

{
  id: "ferrum-text-fire",
  name: "Fire",
  category: "text",
  description: "A text effect that styles and animates letterforms (fire)",
  tags: ["text", "typography", "text-fire", "fire", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-fire {
  font-weight: 800;
  color: oklch(0.905 0.166 98.11);
  text-shadow:
    0 -2px 4px oklch(0.945 0.124 101.54),
    0 -3px 6px oklch(0.905 0.166 98.11),
    0 -6px 10px oklch(0.861 0.173 91.94),
    0 -10px 16px oklch(0.769 0.188 70.08),
    0 -16px 24px oklch(0.646 0.194 41.12),
    0 -22px 32px oklch(0.577 0.215 27.33);
  animation: roy-fire-flicker 0.4s ease-in-out infinite alternate;
}

@keyframes roy-fire-flicker {

  from { filter: brightness(1) hue-rotate(0deg); }
  to { filter: brightness(1.15) hue-rotate(-8deg); }

}`,
},

{
  id: "ferrum-text-fire-flame",
  name: "Fire Flame",
  category: "text",
  description: "A text effect that styles and animates letterforms (fire flame)",
  tags: ["text", "typography", "text-fire-flame", "fire", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-fire-flame {
  display: inline-block;
  position: relative;
  font: 900 80px/1 'Arial Black', sans-serif;
  letter-spacing: 0.05em;
  color: oklch(1 0 0);
  padding: 30px 36px;
  background: oklch(0.121 0.025 82.32);
  border-radius: 8px;
  text-shadow:
    0 -2px 4px oklch(1 0 0),
    0 -4px 8px oklch(0.908 0.157 96.48),
    0 -8px 14px oklch(0.751 0.179 58.28),
    0 -14px 22px oklch(0.644 0.243 32.25),
    0 -22px 32px oklch(0.527 0.211 30.14),
    0 2px 4px color-mix(in oklch, oklch(0.527 0.211 30.14) 80%, transparent);
  animation: roy-b11-text-fire-flame 0.6s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 12px color-mix(in oklch, oklch(0.671 0.221 37.64) 70%, transparent));
}

@keyframes roy-b11-text-fire-flame {

  0%   { text-shadow: 0 -2px 4px oklch(1 0 0), 0 -4px 8px oklch(0.908 0.157 96.48), 0 -8px 14px oklch(0.751 0.179 58.28), 0 -14px 22px oklch(0.644 0.243 32.25), 0 -22px 32px oklch(0.527 0.211 30.14), 0 2px 4px color-mix(in oklch, oklch(0.527 0.211 30.14) 80%, transparent); transform: translateY(0); }
  100% { text-shadow: 0 -2px 6px oklch(1 0 0), 0 -6px 10px oklch(0.908 0.157 96.48), 0 -12px 18px oklch(0.751 0.179 58.28), 0 -20px 28px oklch(0.644 0.243 32.25), 0 -30px 42px oklch(0.527 0.211 30.14), 0 2px 6px color-mix(in oklch, oklch(0.527 0.211 30.14) 90%, transparent); transform: translateY(-2px); }

}`,
},

{
  id: "ferrum-text-flip",
  name: "Flip",
  category: "text",
  description: "A text effect that styles and animates letterforms (flip)",
  tags: ["text", "typography", "text-flip", "flip", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-flip {
  display: inline-block;
  font-weight: 700;
  color: oklch(0.566 0.245 278.69);
  transform-style: preserve-3d;
  perspective: 400px;
  animation: roy-text-flip 3s ease-in-out infinite;
}

@keyframes roy-text-flip {

  0%, 100% { transform: rotateX(0); }
  50% { transform: rotateX(360deg); }

}`,
},

{
  id: "ferrum-text-gradient-shift",
  name: "Gradient Shift",
  category: "text",
  description: "A text effect that styles and animates letterforms (gradient shift)",
  tags: ["text", "typography", "text-gradient-shift", "gradient", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-gradient-shift {
  background: linear-gradient(45deg, oklch(0.696 0.149 162.48), oklch(0.685 0.131 226.94), oklch(0.566 0.245 278.69), oklch(0.652 0.241 354.31), oklch(0.696 0.149 162.48));
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
  animation: roy-text-grad-shift 6s ease infinite;
}

@keyframes roy-text-grad-shift {

  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }

}`,
},

{
  id: "ferrum-text-highlight-marker",
  name: "Highlight Marker",
  category: "text",
  description: "A text effect that styles and animates letterforms (highlight marker)",
  tags: ["text", "typography", "text-highlight-marker", "highlight"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-highlight-marker {
  font-weight: 700;
  color: oklch(0.21 0.034 264.67);
  background: linear-gradient(180deg, transparent 50%, oklch(0.905 0.166 98.11) 50%);
  padding: 0 4px;
}`,
},

{
  id: "ferrum-text-holographic",
  name: "Holographic",
  category: "text",
  description: "A text effect that styles and animates letterforms (holographic)",
  tags: ["text", "typography", "text-holographic", "holographic", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-holographic {
  background: conic-gradient(
    from 0deg,
    oklch(0.741 0.2 345.28), oklch(0.893 0.167 94.55), oklch(0.774 0.148 148.57), oklch(0.776 0.112 188.54), oklch(0.709 0.159 293.54), oklch(0.741 0.2 345.28)
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
  filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(0.741 0.2 345.28) 50%, transparent));
  animation: roy-holo-shift 5s linear infinite;
}

@keyframes roy-holo-shift {

  from { background-position: 0% 0%; }
  to { background-position: 200% 200%; }

}`,
},

{
  id: "ferrum-text-mirror",
  name: "Mirror",
  category: "text",
  description: "A text effect that styles and animates letterforms (mirror)",
  tags: ["text", "typography", "text-mirror", "mirror"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-mirror {
  display: inline-flex;
  font-weight: 700;
  color: oklch(0.566 0.245 278.69);
}`,
},

{
  id: "ferrum-text-neon-glow",
  name: "Neon Glow",
  category: "text",
  description: "A text effect that styles and animates letterforms (neon glow)",
  tags: ["text", "typography", "text-neon-glow", "neon"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-neon-glow {
  color: oklch(0.696 0.149 162.48);
  text-shadow:
    0 0 7px color-mix(in oklch, oklch(0.696 0.149 162.48) 80%, transparent),
    0 0 10px color-mix(in oklch, oklch(0.696 0.149 162.48) 60%, transparent),
    0 0 21px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent),
    0 0 42px color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent),
    0 0 82px color-mix(in oklch, oklch(0.696 0.149 162.48) 10%, transparent);
}`,
},

{
  id: "ferrum-text-neon-sign",
  name: "Neon Sign",
  category: "text",
  description: "A text effect that styles and animates letterforms (neon sign)",
  tags: ["text", "typography", "text-neon-sign", "neon", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-neon-sign {
  display: inline-block;
  font: 900 72px/1 'Arial Black', sans-serif;
  letter-spacing: 0.08em;
  color: oklch(1 0 0);
  text-shadow:
    0 0 4px oklch(1 0 0),
    0 0 10px oklch(0.683 0.303 335.86),
    0 0 22px oklch(0.683 0.303 335.86),
    0 0 40px oklch(0.683 0.303 335.86),
    0 0 70px oklch(0.683 0.303 335.86),
    0 0 100px oklch(0.683 0.303 335.86);
  padding: 20px 30px;
  background: radial-gradient(ellipse at 50% 50%, oklch(0.194 0.08 297.65) 0%, oklch(0.096 0.051 300.12) 100%);
  border-radius: 12px;
  animation: roy-b11-text-neon-flicker 4s linear infinite;
}

@keyframes roy-b11-text-neon-flicker {

  0%, 18%, 22%, 25%, 53%, 57%, 100% {
    opacity: 1;
    text-shadow:
      0 0 4px oklch(1 0 0),
      0 0 10px oklch(0.683 0.303 335.86),
      0 0 22px oklch(0.683 0.303 335.86),
      0 0 40px oklch(0.683 0.303 335.86),
      0 0 70px oklch(0.683 0.303 335.86),
      0 0 100px oklch(0.683 0.303 335.86);
  }
  20%, 24%, 55% {
    opacity: 0.6;
    text-shadow: 0 0 2px oklch(1 0 0), 0 0 4px oklch(0.683 0.303 335.86);
  }

}`,
},

{
  id: "ferrum-text-outline-offset",
  name: "Outline Offset",
  category: "text",
  description: "A text effect that styles and animates letterforms (outline offset)",
  tags: ["text", "typography", "text-outline-offset", "outline"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-outline-offset {
  font-weight: 700;
  color: oklch(0.696 0.149 162.48);
  -webkit-text-stroke: 2px color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent);
  text-shadow:
    4px 4px 0 color-mix(in oklch, oklch(0.685 0.131 226.94) 50%, transparent),
    8px 8px 0 color-mix(in oklch, oklch(0.566 0.245 278.69) 40%, transparent);
}`,
},

{
  id: "ferrum-text-reflection",
  name: "Reflection",
  category: "text",
  description: "A text effect that styles and animates letterforms (reflection)",
  tags: ["text", "typography", "text-reflection", "reflection"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-reflection {
  position: relative;
  display: inline-block;
  font-weight: 700;
  color: oklch(0.685 0.131 226.94);
}`,
},

{
  id: "ferrum-text-shadow-long",
  name: "Shadow Long",
  category: "text",
  description: "A text effect that styles and animates letterforms (shadow long)",
  tags: ["text", "typography", "text-shadow-long", "shadow"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-shadow-long {
  color: oklch(0.982 0.018 155.83);
  font-weight: 700;
  text-shadow:
    1px 1px 0 oklch(0.696 0.149 162.48),
    2px 2px 0 oklch(0.596 0.127 162.48),
    3px 3px 0 oklch(0.596 0.127 163.23),
    4px 4px 0 oklch(0.508 0.105 165.61),
    5px 5px 0 oklch(0.432 0.086 166.91),
    6px 6px 0 oklch(0.378 0.073 168.94),
    7px 7px 0 oklch(0.316 0.057 174.79),
    8px 8px 0 oklch(0.273 0.05 171.23),
    9px 9px 0 oklch(0.234 0.041 173.33),
    10px 10px 12px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
}`,
},

{
  id: "ferrum-text-shadow-soft",
  name: "Shadow Soft",
  category: "text",
  description: "A text effect that styles and animates letterforms (shadow soft)",
  tags: ["text", "typography", "text-shadow-soft", "shadow"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-shadow-soft {
  color: oklch(0.984 0.003 247.86);
  font-weight: 600;
  text-shadow:
    0 1px 2px color-mix(in oklch, oklch(0 0 0) 18%, transparent),
    0 4px 12px color-mix(in oklch, oklch(0.696 0.149 162.48) 25%, transparent),
    0 8px 24px color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
}`,
},

{
  id: "ferrum-text-shimmer",
  name: "Shimmer",
  category: "text",
  description: "A text effect that styles and animates letterforms (shimmer)",
  tags: ["text", "typography", "text-shimmer", "shimmer", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-shimmer {
  background: linear-gradient(
    110deg,
    oklch(0.446 0.037 257.28) 0%,
    oklch(0.446 0.037 257.28) 35%,
    oklch(0.968 0.007 247.9) 50%,
    oklch(0.446 0.037 257.28) 65%,
    oklch(0.446 0.037 257.28) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
  animation: roy-shimmer-sweep 3s linear infinite;
}

@keyframes roy-shimmer-sweep {

  from { background-position: 200% 0; }
  to { background-position: -200% 0; }

}`,
},

{
  id: "ferrum-text-skew",
  name: "Skew",
  category: "text",
  description: "A text effect that styles and animates letterforms (skew)",
  tags: ["text", "typography", "text-skew", "skew"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-skew {
  display: inline-block;
  font-weight: 800;
  font-style: italic;
  color: oklch(0.984 0.003 247.86);
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.685 0.131 226.94));
  padding: 4px 14px;
  transform: skew(-10deg);
  letter-spacing: 2px;
  text-transform: uppercase;
  box-shadow: 4px 4px 0 color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}`,
},

{
  id: "ferrum-text-stretch",
  name: "Stretch",
  category: "text",
  description: "A text effect that styles and animates letterforms (stretch)",
  tags: ["text", "typography", "text-stretch", "stretch", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-stretch {
  font-weight: 700;
  color: oklch(0.769 0.188 70.08);
  animation: roy-text-stretch 3s ease-in-out infinite;
}

@keyframes roy-text-stretch {

  0%, 100% { letter-spacing: 0px; }
  50% { letter-spacing: 12px; }

}`,
},

{
  id: "ferrum-text-typing-cursor",
  name: "Typing Cursor",
  category: "text",
  description: "A text effect that styles and animates letterforms (typing cursor)",
  tags: ["text", "typography", "text-typing-cursor", "typing", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-typing-cursor {
  border-right: 3px solid oklch(0.696 0.149 162.48);
  animation: roy-text-blink-cursor 1s step-end infinite;
  padding-right: 4px;
}

@keyframes roy-text-blink-cursor {

  0%, 100% { border-color: oklch(0.696 0.149 162.48); }
  50% { border-color: transparent; }

}`,
},

{
  id: "ferrum-text-underline-draw",
  name: "Underline Draw",
  category: "text",
  description: "A text effect that styles and animates letterforms (underline draw)",
  tags: ["text", "typography", "text-underline-draw", "underline"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-underline-draw {
  position: relative;
  display: inline-block;
  font-weight: 700;
  color: oklch(0.696 0.149 162.48);
}`,
},

{
  id: "ferrum-text-water",
  name: "Water",
  category: "text",
  description: "A text effect that styles and animates letterforms (water)",
  tags: ["text", "typography", "text-water", "water", "animated"],
  previewType: "text",
  cssCode: `.roycss-ferrum-text-water {
  display: inline-block;
  position: relative;
  font: 900 72px/1 'Arial Black', sans-serif;
  letter-spacing: 0.08em;
  color: transparent;
  background:
    linear-gradient(180deg,
      color-mix(in oklch, oklch(1 0 0) 90%, transparent) 0%,
      color-mix(in oklch, oklch(0.898 0.062 229.91) 70%, transparent) 30%,
      color-mix(in oklch, oklch(0.731 0.117 233.39) 60%, transparent) 55%,
      color-mix(in oklch, oklch(0.505 0.144 254.88) 80%, transparent) 80%,
      color-mix(in oklch, oklch(0.289 0.097 260.21) 90%, transparent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  padding: 18px 30px;
  text-shadow:
    0 1px 0 color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    0 -1px 0 color-mix(in oklch, oklch(0.233 0.068 251.16) 60%, transparent);
  filter: drop-shadow(0 4px 6px color-mix(in oklch, oklch(0.424 0.119 249.77) 50%, transparent));
  animation: roy-b11-text-water-ripple 3s ease-in-out infinite;
}

@keyframes roy-b11-text-water-ripple {

  0%, 100% { filter: drop-shadow(0 4px 6px color-mix(in oklch, oklch(0.424 0.119 249.77) 50%, transparent)) hue-rotate(0deg); }
  50%      { filter: drop-shadow(0 4px 8px color-mix(in oklch, oklch(0.424 0.119 249.77) 70%, transparent)) hue-rotate(15deg); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-soap-bubble",
  name: "Soap Bubble",
  category: "visual",
  description: "An animated motion effect (soap bubble)",
  tags: ["soap-bubble", "bubble", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-soap-bubble {
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 28%, color-mix(in oklch, oklch(1 0 0) 95%, transparent), color-mix(in oklch, oklch(1 0 0) 5%, transparent) 18%, transparent 32%),
    radial-gradient(circle at 70% 65%, color-mix(in oklch, oklch(0.673 0.29 341.41) 35%, transparent), transparent 40%),
    radial-gradient(circle at 30% 75%, color-mix(in oklch, oklch(0.889 0.177 169.75) 35%, transparent), transparent 40%),
    radial-gradient(circle at 75% 25%, color-mix(in oklch, oklch(0.897 0.185 97.44) 30%, transparent), transparent 40%),
    conic-gradient(from 30deg,
      color-mix(in oklch, oklch(0.702 0.229 349.48) 35%, transparent),
      color-mix(in oklch, oklch(0.788 0.131 231.8) 35%, transparent),
      color-mix(in oklch, oklch(0.923 0.183 133.01) 35%, transparent),
      color-mix(in oklch, oklch(0.861 0.147 83.67) 35%, transparent),
      color-mix(in oklch, oklch(0.64 0.249 306.76) 35%, transparent),
      color-mix(in oklch, oklch(0.702 0.229 349.48) 35%, transparent));
  box-shadow:
    inset 0 0 40px color-mix(in oklch, oklch(1 0 0) 25%, transparent),
    inset -20px -25px 50px color-mix(in oklch, oklch(0.336 0.172 308.39) 25%, transparent),
    inset 15px 20px 40px color-mix(in oklch, oklch(0.73 0.16 237.36) 25%, transparent),
    0 8px 30px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 40%, transparent);
  filter: saturate(1.2);
  animation: roy-b11-soap-bubble-float 6s ease-in-out infinite;
}

@keyframes roy-b11-soap-bubble-float {

  0%, 100% { transform: translateY(0) rotate(0deg); filter: saturate(1.2) hue-rotate(0deg); }
  50%      { transform: translateY(-12px) rotate(8deg); filter: saturate(1.4) hue-rotate(40deg); }

}`,
},

{
  id: "ferrum-spiral-galaxy",
  name: "Spiral Galaxy",
  category: "visual",
  description: "A spiral galaxy effect",
  tags: ["spiral-galaxy", "galaxy"],
  previewType: "box",
  cssCode: `.roycss-ferrum-spiral-galaxy {
  position: relative;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, oklch(0.179 0.095 301.47) 0%, oklch(0.096 0.051 300.12) 70%, oklch(0 0 0) 100%);
  box-shadow: 0 0 40px color-mix(in oklch, oklch(0.579 0.244 286.54) 40%, transparent);
}`,
},

{
  id: "ferrum-stained-glass",
  name: "Stained Glass",
  category: "visual",
  description: "A stained glass effect",
  tags: ["stained-glass", "glass"],
  previewType: "box",
  cssCode: `.roycss-ferrum-stained-glass {
  position: relative;
  width: 200px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(115deg, oklch(0.218 0.0 89.88) 0 8%, transparent 8% 9%, oklch(0.218 0.0 89.88) 9% 17%, transparent 17% 18%, oklch(0.218 0.0 89.88) 18% 26%, transparent 26% 27%, oklch(0.218 0.0 89.88) 27% 35%, transparent 35% 36%, oklch(0.218 0.0 89.88) 36% 44%, transparent 44% 45%, oklch(0.218 0.0 89.88) 45% 53%, transparent 53% 54%, oklch(0.218 0.0 89.88) 54% 62%, transparent 62% 63%, oklch(0.218 0.0 89.88) 63% 71%, transparent 71% 72%, oklch(0.218 0.0 89.88) 72% 80%, transparent 80% 81%, oklch(0.218 0.0 89.88) 81% 89%, transparent 89% 90%, oklch(0.218 0.0 89.88) 90% 100%),
    linear-gradient(25deg, oklch(0.218 0.0 89.88) 0 9%, transparent 9% 10%, oklch(0.218 0.0 89.88) 10% 19%, transparent 19% 20%, oklch(0.218 0.0 89.88) 20% 29%, transparent 29% 30%, oklch(0.218 0.0 89.88) 30% 39%, transparent 39% 40%, oklch(0.218 0.0 89.88) 40% 49%, transparent 49% 50%, oklch(0.218 0.0 89.88) 50% 59%, transparent 59% 60%, oklch(0.218 0.0 89.88) 60% 69%, transparent 69% 70%, oklch(0.218 0.0 89.88) 70% 79%, transparent 79% 80%, oklch(0.218 0.0 89.88) 80% 89%, transparent 89% 90%, oklch(0.218 0.0 89.88) 90% 100%),
    radial-gradient(circle at 20% 25%, oklch(0.53 0.207 22.32) 0 22%, transparent 22%),
    radial-gradient(circle at 75% 20%, oklch(0.887 0.182 95.33) 0 18%, transparent 18%),
    radial-gradient(circle at 30% 70%, oklch(0.652 0.19 253.21) 0 24%, transparent 24%),
    radial-gradient(circle at 80% 75%, oklch(0.515 0.261 309.81) 0 20%, transparent 20%),
    radial-gradient(circle at 55% 45%, oklch(0.751 0.179 58.28) 0 18%, transparent 18%),
    radial-gradient(circle at 50% 90%, oklch(0.746 0.181 152.33) 0 16%, transparent 16%),
    linear-gradient(45deg, oklch(0.324 0.148 309.24), oklch(0.422 0.148 10.46), oklch(0.414 0.12 257.24), oklch(0.591 0.139 124.95));
  background-blend-mode: normal, normal, screen, screen, screen, screen, screen, screen, normal;
  filter: saturate(1.3) brightness(1.05);
  box-shadow: 0 0 25px color-mix(in oklch, oklch(0.863 0.133 80.39) 30%, transparent), inset 0 0 0 2px oklch(0.218 0.0 89.88);
}`,
},

{
  id: "ferrum-topographic",
  name: "Topographic",
  category: "visual",
  description: "A topographic effect",
  tags: ["topographic"],
  previewType: "box",
  cssCode: `.roycss-ferrum-topographic {
  width: 100%;
  min-height: 240px;
  background:
    repeating-radial-gradient(circle at 30% 40%,
      transparent 0,
      transparent 14px,
      color-mix(in oklch, oklch(0.466 0.084 68.78) 50%, transparent) 14px,
      color-mix(in oklch, oklch(0.466 0.084 68.78) 50%, transparent) 15px),
    repeating-radial-gradient(circle at 70% 60%,
      transparent 0,
      transparent 18px,
      color-mix(in oklch, oklch(0.396 0.077 61.8) 45%, transparent) 18px,
      color-mix(in oklch, oklch(0.396 0.077 61.8) 45%, transparent) 19px),
    repeating-radial-gradient(circle at 50% 80%,
      transparent 0,
      transparent 12px,
      color-mix(in oklch, oklch(0.325 0.072 53.1) 40%, transparent) 12px,
      color-mix(in oklch, oklch(0.325 0.072 53.1) 40%, transparent) 13px),
    radial-gradient(ellipse at 30% 40%, oklch(0.923 0.049 86.35) 0%, oklch(0.795 0.071 80.81) 50%, oklch(0.549 0.078 76.6) 100%);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}`,
},

{
  id: "ferrum-velvet-fabric",
  name: "Velvet Fabric",
  category: "visual",
  description: "A velvet fabric effect",
  tags: ["velvet-fabric", "fabric"],
  previewType: "box",
  cssCode: `.roycss-ferrum-velvet-fabric {
  position: relative;
  width: 200px;
  height: 160px;
  border-radius: 12px;
  background:
    radial-gradient(ellipse 70% 50% at 30% 30%, color-mix(in oklch, oklch(0.516 0.178 4.95) 70%, transparent), transparent 60%),
    radial-gradient(ellipse 60% 50% at 75% 70%, color-mix(in oklch, oklch(0.232 0.095 356.89) 85%, transparent), transparent 65%),
    linear-gradient(135deg, oklch(0.381 0.142 3.86) 0%, oklch(0.269 0.1 4.42) 50%, oklch(0.345 0.127 5.2) 100%);
  box-shadow:
    inset 0 0 30px color-mix(in oklch, oklch(0 0 0) 60%, transparent),
    inset 8px 10px 18px color-mix(in oklch, oklch(0.744 0.171 358.78) 25%, transparent),
    inset -8px -10px 18px color-mix(in oklch, oklch(0 0 0) 50%, transparent),
    0 10px 25px color-mix(in oklch, oklch(0.179 0.072 1.69) 50%, transparent);
}`,
},

{
  id: "ferrum-vhs-glitch",
  name: "Vhs Glitch",
  category: "visual",
  description: "A vhs glitch effect",
  tags: ["vhs-glitch", "glitch"],
  previewType: "box",
  cssCode: `.roycss-ferrum-vhs-glitch {
  width: 100%;
  min-height: 240px;
  background:
    linear-gradient(180deg, oklch(0.179 0.095 301.47) 0%, oklch(0.336 0.177 301.82) 50%, oklch(0.235 0.096 259.91) 100%);
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  filter: contrast(1.2) saturate(1.3);
}`,
},

{
  id: "ferrum-vintage-tv",
  name: "Vintage Tv",
  category: "visual",
  description: "A vintage tv effect",
  tags: ["vintage-tv", "tv"],
  previewType: "box",
  cssCode: `.roycss-ferrum-vintage-tv {
  width: 100%;
  min-height: 240px;
  background:
    radial-gradient(ellipse 90% 70% at 50% 50%, oklch(0.342 0.071 251.85) 0%, oklch(0.214 0.042 252.78) 70%, oklch(0 0 0) 100%);
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    inset 0 0 60px color-mix(in oklch, oklch(0 0 0) 80%, transparent),
    inset 0 0 120px color-mix(in oklch, oklch(0.626 0.111 250.01) 30%, transparent);
}`,
},

{
  id: "ferrum-visual-aurora-border",
  name: "Aurora Border",
  category: "visual",
  description: "A visual filter or surface effect (aurora border)",
  tags: ["visual", "effect", "visual-aurora-border", "aurora"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-aurora-border {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  background: oklch(0.182 0.046 271.58);
  border: none;
  overflow: hidden;
}`,
},

{
  id: "ferrum-visual-backdrop-blur-heavy",
  name: "Backdrop Blur Heavy",
  category: "visual",
  description: "A visual filter or surface effect (backdrop blur heavy)",
  tags: ["visual", "effect", "visual-backdrop-blur-heavy", "backdrop"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-backdrop-blur-heavy {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background:
    radial-gradient(circle at 20% 30%, oklch(0.652 0.241 354.31) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, oklch(0.685 0.131 226.94) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, oklch(0.769 0.188 70.08) 0%, transparent 50%),
    linear-gradient(135deg, oklch(0.566 0.245 278.69), oklch(0.696 0.149 162.48));
  overflow: hidden;
}`,
},

{
  id: "ferrum-visual-blend-mode-overlay",
  name: "Blend Mode Overlay",
  category: "visual",
  description: "A visual filter or surface effect (blend mode overlay)",
  tags: ["visual", "effect", "visual-blend-mode-overlay", "blend"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-blend-mode-overlay {
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
  id: "ferrum-visual-border-beam",
  name: "Border Beam",
  category: "visual",
  description: "A visual filter or surface effect (border beam)",
  tags: ["visual", "effect", "visual-border-beam", "border"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-border-beam {
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
  id: "ferrum-visual-chrome",
  name: "Chrome",
  category: "visual",
  description: "A visual filter or surface effect (chrome)",
  tags: ["visual", "effect", "visual-chrome", "chrome"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-chrome {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(
    180deg,
    oklch(0.997 0.0 89.88) 0%,
    oklch(0.835 0.011 286.16) 10%,
    oklch(0.629 0.012 286.05) 20%,
    oklch(0.885 0.011 286.18) 30%,
    oklch(0.98 0.005 286.3) 45%,
    oklch(0.708 0.012 286.1) 55%,
    oklch(0.52 0.012 285.96) 65%,
    oklch(0.86 0.011 286.17) 75%,
    oklch(0.957 0.007 286.27) 85%,
    oklch(0.76 0.011 286.13) 95%,
    oklch(0.602 0.012 286.03) 100%
  );
  overflow: hidden;
  box-shadow:
    inset 0 2px 4px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    inset 0 -2px 4px color-mix(in oklch, oklch(0 0 0) 35%, transparent);
}`,
},

{
  id: "ferrum-visual-color-shift",
  name: "Color Shift",
  category: "visual",
  description: "A visual filter or surface effect (color shift)",
  tags: ["visual", "effect", "visual-color-shift", "color", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-color-shift {
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, oklch(0.652 0.241 354.31), oklch(0.566 0.245 278.69));
  animation: roy-visual-color-shift 6s linear infinite;
}

@keyframes roy-visual-color-shift {

  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(360deg); }

}`,
},

{
  id: "ferrum-visual-foil",
  name: "Foil",
  category: "visual",
  description: "A visual filter or surface effect (foil)",
  tags: ["visual", "effect", "visual-foil", "foil", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-visual-foil {
  position: relative;
  width: 180px;
  height: 120px;
  border-radius: 14px;
  border: none;
  background:
    repeating-linear-gradient(
      45deg,
      color-mix(in oklch, oklch(1 0 0) 12%, transparent) 0px,
      color-mix(in oklch, oklch(1 0 0) 12%, transparent) 2px,
      transparent 2px,
      transparent 5px
    ),
    repeating-linear-gradient(
      -45deg,
      color-mix(in oklch, oklch(0 0 0) 12%, transparent) 0px,
      color-mix(in oklch, oklch(0 0 0) 12%, transparent) 2px,
      transparent 2px,
      transparent 5px
    ),
    linear-gradient(
      135deg,
      oklch(0.957 0.007 286.27) 0%,
      oklch(0.813 0.022 285.89) 25%,
      oklch(0.981 0.009 286.23) 50%,
      oklch(0.762 0.023 285.85) 75%,
      oklch(0.933 0.011 286.19) 100%
    );
  background-size: 8px 8px, 8px 8px, 100% 100%;
  overflow: hidden;
  animation: roy-visual-foil-hue 6s ease-in-out infinite;
  box-shadow:
    inset 0 2px 6px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    inset 0 -2px 6px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}

@keyframes roy-visual-foil-hue {

  0%, 100% { filter: hue-rotate(0deg); }
  50%      { filter: hue-rotate(70deg); }

}`,
},

];
