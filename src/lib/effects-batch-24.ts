import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 24 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch24: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-ease-linear",
  name: "Ease Linear",
  category: "animations",
  description: "An easing-curve motion preset (ease linear)",
  tags: ["ease-linear", "linear", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-linear {
  animation: roy-ferrum-ease-linear-move 1s linear both;
}

@keyframes roy-ferrum-ease-linear-move {

  from { opacity: 0; transform: translateX(0); }
  to { opacity: 1; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-ease-in-quad",
  name: "Ease In Quad",
  category: "animations",
  description: "An easing-curve motion preset (ease in quad)",
  tags: ["ease-in-quad", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-in-quad {
  animation: roy-ferrum-ease-in-quad-move 1s cubic-bezier(0.55, 0.085, 0.68, 0.53) both;
}

@keyframes roy-ferrum-ease-in-quad-move {

  from { opacity: 0; transform: translateX(0); }
  to { opacity: 1; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-ease-out-quad",
  name: "Ease Out Quad",
  category: "animations",
  description: "An easing-curve motion preset (ease out quad)",
  tags: ["ease-out-quad", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-out-quad {
  animation: roy-ferrum-ease-out-quad-move 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes roy-ferrum-ease-out-quad-move {

  from { opacity: 0; transform: translateX(0); }
  to { opacity: 1; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-ease-in-out-quad",
  name: "Ease In Out Quad",
  category: "animations",
  description: "An easing-curve motion preset (ease in out quad)",
  tags: ["ease-in-out-quad", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-in-out-quad {
  animation: roy-ferrum-ease-in-out-quad-move 1s cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
}

@keyframes roy-ferrum-ease-in-out-quad-move {

  from { opacity: 0; transform: translateX(0); }
  to { opacity: 1; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-ease-in-cubic",
  name: "Ease In Cubic",
  category: "animations",
  description: "An easing-curve motion preset (ease in cubic)",
  tags: ["ease-in-cubic", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-in-cubic {
  animation: roy-ferrum-ease-in-cubic-move 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) both;
}

@keyframes roy-ferrum-ease-in-cubic-move {

  from { opacity: 0; transform: translateX(0); }
  to { opacity: 1; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-ease-out-cubic",
  name: "Ease Out Cubic",
  category: "animations",
  description: "An easing-curve motion preset (ease out cubic)",
  tags: ["ease-out-cubic", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-out-cubic {
  animation: roy-ferrum-ease-out-cubic-move 1s cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

@keyframes roy-ferrum-ease-out-cubic-move {

  from { opacity: 0; transform: translateX(0); }
  to { opacity: 1; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-ease-in-out-cubic",
  name: "Ease In Out Cubic",
  category: "animations",
  description: "An easing-curve motion preset (ease in out cubic)",
  tags: ["ease-in-out-cubic", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-in-out-cubic {
  animation: roy-ferrum-ease-in-out-cubic-move 1s cubic-bezier(0.645, 0.045, 0.355, 1) both;
}

@keyframes roy-ferrum-ease-in-out-cubic-move {

  from { opacity: 0; transform: translateX(0); }
  to { opacity: 1; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-ease-in-back",
  name: "Ease In Back",
  category: "animations",
  description: "An easing-curve motion preset (ease in back)",
  tags: ["ease-in-back", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-in-back {
  animation: roy-ferrum-ease-in-back-move 1s cubic-bezier(0.6, -0.28, 0.735, 0.045) both;
}

@keyframes roy-ferrum-ease-in-back-move {

  from { opacity: 0; transform: translateX(0); }
  to { opacity: 1; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-ease-out-back",
  name: "Ease Out Back",
  category: "animations",
  description: "An easing-curve motion preset (ease out back)",
  tags: ["ease-out-back", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-out-back {
  animation: roy-ferrum-ease-out-back-move 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes roy-ferrum-ease-out-back-move {

  from { opacity: 0; transform: translateX(0); }
  to { opacity: 1; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-ease-in-out-back",
  name: "Ease In Out Back",
  category: "animations",
  description: "An easing-curve motion preset (ease in out back)",
  tags: ["ease-in-out-back", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-in-out-back {
  animation: roy-ferrum-ease-in-out-back-move 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
}

@keyframes roy-ferrum-ease-in-out-back-move {

  from { opacity: 0; transform: translateX(0); }
  to { opacity: 1; transform: translateX(60px); }

}`,
},

{
  id: "ferrum-ease-elastic-out",
  name: "Ease Elastic Out",
  category: "animations",
  description: "An easing-curve motion preset (ease elastic out)",
  tags: ["ease-elastic-out", "elastic", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-elastic-out {
  animation: roy-ferrum-ease-elastic-out-move 1s ease-out both;
}

@keyframes roy-ferrum-ease-elastic-out-move {

  0% {
    opacity: 0;
    transform: translateX(0) scaleX(1);
  }
  40% {
    opacity: 1;
    transform: translateX(60px) scaleX(1.1);
  }
  55% {
    transform: translateX(60px) scaleX(0.95);
  }
  70% {
    transform: translateX(60px) scaleX(1.02);
  }
  85% {
    transform: translateX(60px) scaleX(0.99);
  }
  100% {
    opacity: 1;
    transform: translateX(60px) scaleX(1);
  }

}`,
},

{
  id: "ferrum-ease-bounce-out",
  name: "Ease Bounce Out",
  category: "animations",
  description: "An easing-curve motion preset (ease bounce out)",
  tags: ["ease-bounce-out", "bounce", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ease-bounce-out {
  animation: roy-ferrum-ease-bounce-out-move 1s ease-out both;
}

@keyframes roy-ferrum-ease-bounce-out-move {

  0% {
    opacity: 0;
    transform: translateX(0) translateY(0);
  }
  20% {
    opacity: 1;
    transform: translateX(60px) translateY(0);
  }
  40% {
    transform: translateX(60px) translateY(-20px);
  }
  55% {
    transform: translateX(60px) translateY(0);
  }
  68% {
    transform: translateX(60px) translateY(-10px);
  }
  78% {
    transform: translateX(60px) translateY(0);
  }
  88% {
    transform: translateX(60px) translateY(-4px);
  }
  100% {
    opacity: 1;
    transform: translateX(60px) translateY(0);
  }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // MICROINTERACTIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-status-pulse-green",
  name: "Status Pulse Green",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (status pulse green)",
  tags: ["status-pulse-green", "pulse", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-status-pulse-green {
  position: relative;
  width: 14px;
  height: 14px;
}
.roycss-ferrum-status-pulse-green::before {
  content: '';
  position: absolute;
  inset: 0;
  background: oklch(0.723 0.191 149.06);
  border-radius: 50%;
  z-index: 1;
}
.roycss-ferrum-status-pulse-green::after {
  content: '';
  position: absolute;
  inset: 0;
  background: oklch(0.723 0.191 149.06);
  border-radius: 50%;
  animation: roy-ferrum-pulse-ring-green 1.5s ease-out infinite;
}

@keyframes roy-ferrum-pulse-ring-green {

  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }

}`,
},

{
  id: "ferrum-status-pulse-red",
  name: "Status Pulse Red",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (status pulse red)",
  tags: ["status-pulse-red", "pulse", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-status-pulse-red {
  position: relative;
  width: 14px;
  height: 14px;
}
.roycss-ferrum-status-pulse-red::before {
  content: '';
  position: absolute;
  inset: 0;
  background: oklch(0.637 0.237 25.77);
  border-radius: 50%;
  z-index: 1;
}
.roycss-ferrum-status-pulse-red::after {
  content: '';
  position: absolute;
  inset: 0;
  background: oklch(0.637 0.237 25.77);
  border-radius: 50%;
  animation: roy-ferrum-pulse-ring-red 1.5s ease-out infinite;
}

@keyframes roy-ferrum-pulse-ring-red {

  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }

}`,
},

{
  id: "ferrum-status-pulse-yellow",
  name: "Status Pulse Yellow",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (status pulse yellow)",
  tags: ["status-pulse-yellow", "pulse", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-status-pulse-yellow {
  position: relative;
  width: 14px;
  height: 14px;
}
.roycss-ferrum-status-pulse-yellow::before {
  content: '';
  position: absolute;
  inset: 0;
  background: oklch(0.795 0.184 86.05);
  border-radius: 50%;
  z-index: 1;
}
.roycss-ferrum-status-pulse-yellow::after {
  content: '';
  position: absolute;
  inset: 0;
  background: oklch(0.795 0.184 86.05);
  border-radius: 50%;
  animation: roy-ferrum-pulse-ring-yellow 1.5s ease-out infinite;
}

@keyframes roy-ferrum-pulse-ring-yellow {

  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }

}`,
},

{
  id: "ferrum-status-breathing-blue",
  name: "Status Breathing Blue",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (status breathing blue)",
  tags: ["status-breathing-blue", "breathing", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-status-breathing-blue {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: oklch(0.623 0.188 259.81);
  animation: roy-ferrum-breathe-blue 3s ease-in-out infinite;
}

@keyframes roy-ferrum-breathe-blue {

  0%, 100% {
    box-shadow: 0 0 4px 1px color-mix(in oklch, oklch(0.623 0.188 259.81) 30%, transparent);
    background: oklch(0.623 0.188 259.81);
  }
  50% {
    box-shadow: 0 0 16px 6px color-mix(in oklch, oklch(0.623 0.188 259.81) 50%, transparent), 0 0 32px 12px color-mix(in oklch, oklch(0.623 0.188 259.81) 15%, transparent);
    background: oklch(0.714 0.143 254.62);
  }

}`,
},

{
  id: "ferrum-status-progress-ring",
  name: "Status Progress Ring",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (status progress ring)",
  tags: ["status-progress-ring", "progress", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-status-progress-ring {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: conic-gradient(
    oklch(0.623 0.188 259.81) 0deg,
    oklch(0.623 0.188 259.81) 270deg,
    color-mix(in oklch, oklch(0.623 0.188 259.81) 15%, transparent) 270deg,
    color-mix(in oklch, oklch(0.623 0.188 259.81) 15%, transparent) 360deg
  );
  animation: roy-ferrum-progress-spin 2s linear infinite;
}
.roycss-ferrum-status-progress-ring::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: oklch(0.27 0.04 260.03);
}

@keyframes roy-ferrum-progress-spin {

  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }

}`,
},

{
  id: "ferrum-status-loading-bar",
  name: "Status Loading Bar",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (status loading bar)",
  tags: ["status-loading-bar", "loading", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-status-loading-bar {
  position: relative;
  width: 120px;
  height: 4px;
  background: color-mix(in oklch, oklch(0.623 0.188 259.81) 20%, transparent);
  border-radius: 4px;
  overflow: hidden;
  animation: roy-ferrum-loading-bg-pulse 2s ease-in-out infinite;
}
.roycss-ferrum-status-loading-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, oklch(0.623 0.188 259.81), transparent);
  border-radius: 4px;
  animation: roy-ferrum-loading-slide 1.5s ease-in-out infinite;
}

@keyframes roy-ferrum-loading-bg-pulse {

  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }

}

@keyframes roy-ferrum-loading-slide {

  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }

}`,
},

{
  id: "ferrum-status-notification-badge",
  name: "Status Notification Badge",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (status notification badge)",
  tags: ["status-notification-badge", "notification", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-status-notification-badge {
  position: relative;
  width: 20px;
  height: 20px;
  background: oklch(0.637 0.237 25.77);
  border-radius: 50%;
  animation: roy-ferrum-badge-bounce 1.5s ease-in-out infinite;
}
.roycss-ferrum-status-notification-badge::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid oklch(0.637 0.237 25.77);
  border-radius: 50%;
  animation: roy-ferrum-badge-ring 1.5s ease-out infinite;
}

@keyframes roy-ferrum-badge-bounce {

  0%, 100% { transform: scale(1); }
  30% { transform: scale(1.25); }
  50% { transform: scale(0.95); }
  70% { transform: scale(1.1); }

}

@keyframes roy-ferrum-badge-ring {

  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }

}`,
},

{
  id: "ferrum-status-dot-bounce",
  name: "Status Dot Bounce",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (status dot bounce)",
  tags: ["status-dot-bounce", "dot", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-status-dot-bounce {
  position: relative;
  width: 40px;
  height: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.roycss-ferrum-status-dot-bounce::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  background: oklch(0.623 0.188 259.81);
  border-radius: 50%;
  box-shadow:
    14px 0 0 0 oklch(0.623 0.188 259.81),
    28px 0 0 0 oklch(0.623 0.188 259.81);
  animation: roy-ferrum-dot-bounce 1.4s ease-in-out infinite;
}

@keyframes roy-ferrum-dot-bounce {

  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }

}`,
},

{
  id: "ferrum-status-signal-wave",
  name: "Status Signal Wave",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (status signal wave)",
  tags: ["status-signal-wave", "signal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-status-signal-wave {
  position: relative;
  width: 24px;
  height: 24px;
}
.roycss-ferrum-status-signal-wave::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  background: oklch(0.723 0.191 149.06);
  border-radius: 50%;
  z-index: 1;
}
.roycss-ferrum-status-signal-wave::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border: 2px solid oklch(0.723 0.191 149.06);
  border-radius: 50%;
  animation: roy-ferrum-signal-expand 2s ease-out infinite;
}

@keyframes roy-ferrum-signal-expand {

  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }

}`,
},

{
  id: "ferrum-status-heartbeat",
  name: "Status Heartbeat",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (status heartbeat)",
  tags: ["status-heartbeat", "heartbeat", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-status-heartbeat {
  position: relative;
  width: 20px;
  height: 18px;
}
.roycss-ferrum-status-heartbeat::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 10px;
  height: 16px;
  background: oklch(0.637 0.237 25.77);
  border-radius: 10px 10px 0 0;
  transform: translateX(-50%) rotate(-45deg);
  transform-origin: 0 100%;
  animation: roy-ferrum-heart-beat 1.5s ease-in-out infinite;
}
.roycss-ferrum-status-heartbeat::after {
  content: '';
  position: absolute;
  top: 0;
  right: 50%;
  width: 10px;
  height: 16px;
  background: oklch(0.637 0.237 25.77);
  border-radius: 10px 10px 0 0;
  transform: translateX(50%) rotate(45deg);
  transform-origin: 100% 100%;
  animation: roy-ferrum-heart-beat 1.5s ease-in-out infinite;
}

@keyframes roy-ferrum-heart-beat {

  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.2); }
  56% { transform: scale(1); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // PARTICLES
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-rain",
  name: "Rain",
  category: "particles",
  description: "An animated motion effect (rain)",
  tags: ["rain", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-rain {
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.228 0.038 282.93) 0%, oklch(0.254 0.057 266.71) 50%, oklch(0.325 0.088 255.11) 100%);
}
.roycss-ferrum-rain::before,
.roycss-ferrum-rain::after {
  content: '';
  position: absolute;
  top: -100%;
  width: 2px;
  height: 80px;
  background: linear-gradient(to bottom, transparent, color-mix(in oklch, oklch(0.809 0.048 258.37) 50%, transparent), transparent);
  border-radius: 0 0 2px 2px;
}
.roycss-ferrum-rain::before {
  left: 15%;
  box-shadow:
    80px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 40%, transparent),
    160px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 30%, transparent),
    240px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 50%, transparent),
    320px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 20%, transparent),
    400px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 40%, transparent),
    480px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 30%, transparent),
    560px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 50%, transparent),
    640px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 20%, transparent),
    720px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 40%, transparent),
    800px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 30%, transparent);
  animation: roy-ferrum-rain-fall 0.7s linear infinite;
}
.roycss-ferrum-rain::after {
  left: 45%;
  box-shadow:
    60px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 30%, transparent),
    140px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 50%, transparent),
    220px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 20%, transparent),
    300px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 40%, transparent),
    380px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 30%, transparent),
    460px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 50%, transparent),
    540px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 20%, transparent),
    620px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 40%, transparent),
    700px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 30%, transparent),
    780px 0 color-mix(in oklch, oklch(0.809 0.048 258.37) 50%, transparent);
  animation: roy-ferrum-rain-fall 0.9s linear infinite;
  animation-delay: -0.3s;
}

@keyframes roy-ferrum-rain-fall {

  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }

}`,
},

{
  id: "ferrum-snow",
  name: "Snow",
  category: "particles",
  description: "An animated motion effect (snow)",
  tags: ["snow", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-snow {
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.372 0.081 266.12) 0%, oklch(0.536 0.09 256.23) 40%, oklch(0.628 0.064 249.62) 100%);
}
.roycss-ferrum-snow::before,
.roycss-ferrum-snow::after {
  content: '';
  position: absolute;
  top: -5%;
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  opacity: 0.9;
  box-shadow:
    30px 15px 0 1px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    70px 40px 0 2px color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    120px 10px 0 0px color-mix(in oklch, oklch(1 0 0) 80%, transparent),
    180px 60px 0 1px color-mix(in oklch, oklch(1 0 0) 40%, transparent),
    240px 25px 0 2px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    300px 50px 0 0px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    370px 5px 0 1px color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    440px 35px 0 2px color-mix(in oklch, oklch(1 0 0) 30%, transparent),
    520px 55px 0 0px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    600px 20px 0 1px color-mix(in oklch, oklch(1 0 0) 80%, transparent);
}
.roycss-ferrum-snow::before {
  left: 10%;
  animation: roy-ferrum-snow-fall 4s linear infinite;
}
.roycss-ferrum-snow::after {
  left: 55%;
  box-shadow:
    40px 30px 0 1px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    90px 10px 0 2px color-mix(in oklch, oklch(1 0 0) 40%, transparent),
    150px 45px 0 0px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    210px 20px 0 1px color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    280px 55px 0 2px color-mix(in oklch, oklch(1 0 0) 30%, transparent),
    350px 15px 0 0px color-mix(in oklch, oklch(1 0 0) 80%, transparent),
    420px 40px 0 1px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    500px 8px 0 2px color-mix(in oklch, oklch(1 0 0) 40%, transparent),
    570px 50px 0 0px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    650px 28px 0 1px color-mix(in oklch, oklch(1 0 0) 50%, transparent);
  animation: roy-ferrum-snow-fall 5s linear infinite;
  animation-delay: -2s;
}

@keyframes roy-ferrum-snow-fall {

  0% { transform: translateY(-10%) translateX(0); opacity: 1; }
  50% { transform: translateY(50vh) translateX(20px); opacity: 0.8; }
  100% { transform: translateY(100vh) translateX(-10px); opacity: 0; }

}`,
},

{
  id: "ferrum-lightning",
  name: "Lightning",
  category: "particles",
  description: "An animated motion effect (lightning)",
  tags: ["lightning", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-lightning {
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.228 0.038 282.93) 0%, oklch(0.308 0.041 283.72) 100%);
}
.roycss-ferrum-lightning::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, color-mix(in oklch, oklch(1 0 0) 90%, transparent) 0%, color-mix(in oklch, oklch(0.851 0.076 284.67) 40%, transparent) 30%, transparent 70%);
  opacity: 0;
  animation: roy-ferrum-lightning-flash 6s ease-in-out infinite;
}
.roycss-ferrum-lightning::after {
  content: '';
  position: absolute;
  top: 0;
  left: 48%;
  width: 4%;
  height: 100%;
  background: linear-gradient(to bottom,
    transparent 5%,
    color-mix(in oklch, oklch(0.798 0.106 283.75) 90%, transparent) 10%,
    transparent 12%,
    color-mix(in oklch, oklch(0.851 0.076 284.67) 70%, transparent) 20%,
    transparent 22%,
    color-mix(in oklch, oklch(0.798 0.106 283.75) 80%, transparent) 35%,
    transparent 37%,
    color-mix(in oklch, oklch(0.851 0.076 284.67) 60%, transparent) 50%,
    transparent 52%,
    color-mix(in oklch, oklch(0.798 0.106 283.75) 70%, transparent) 65%,
    transparent 67%,
    color-mix(in oklch, oklch(0.851 0.076 284.67) 50%, transparent) 80%,
    transparent 82%
  );
  opacity: 0;
  animation: roy-ferrum-lightning-flash 6s ease-in-out infinite;
  animation-delay: 0.05s;
}

@keyframes roy-ferrum-lightning-flash {

  0%, 88%, 92%, 96%, 100% { opacity: 0; }
  89% { opacity: 0.8; }
  91% { opacity: 0.1; }
  93% { opacity: 0.6; }
  95% { opacity: 0; }

}`,
},

{
  id: "ferrum-clouds",
  name: "Clouds",
  category: "particles",
  description: "An animated motion effect (clouds)",
  tags: ["clouds", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-clouds {
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.815 0.082 225.75) 0%, oklch(0.85 0.047 232.38) 60%, oklch(0.919 0.024 223.69) 100%);
}
.roycss-ferrum-clouds::before {
  content: '';
  position: absolute;
  top: 15%;
  left: -150px;
  width: 180px;
  height: 60px;
  background: color-mix(in oklch, oklch(1 0 0) 90%, transparent);
  border-radius: 50px;
  box-shadow:
    -25px -20px 0 10px color-mix(in oklch, oklch(1 0 0) 90%, transparent),
    30px -15px 0 15px color-mix(in oklch, oklch(1 0 0) 85%, transparent),
    70px -10px 0 5px color-mix(in oklch, oklch(1 0 0) 90%, transparent),
    -60px -5px 0 8px color-mix(in oklch, oklch(1 0 0) 80%, transparent);
  animation: roy-ferrum-cloud-drift-1 20s linear infinite;
}
.roycss-ferrum-clouds::after {
  content: '';
  position: absolute;
  top: 35%;
  left: -120px;
  width: 140px;
  height: 45px;
  background: color-mix(in oklch, oklch(1 0 0) 75%, transparent);
  border-radius: 40px;
  box-shadow:
    -20px -18px 0 8px color-mix(in oklch, oklch(1 0 0) 75%, transparent),
    25px -12px 0 12px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    60px -8px 0 4px color-mix(in oklch, oklch(1 0 0) 75%, transparent);
  animation: roy-ferrum-cloud-drift-2 25s linear infinite;
}

@keyframes roy-ferrum-cloud-drift-1 {

  0% { transform: translateX(-120%); }
  100% { transform: translateX(calc(100vw + 50%)); }

}

@keyframes roy-ferrum-cloud-drift-2 {

  0% { transform: translateX(calc(100vw + 30%)); }
  100% { transform: translateX(-150%); }

}`,
},

{
  id: "ferrum-fireflies",
  name: "Fireflies",
  category: "particles",
  description: "An animated motion effect (fireflies)",
  tags: ["fireflies", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fireflies {
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.205 0.032 145.94) 0%, oklch(0.281 0.046 144.21) 50%, oklch(0.205 0.032 145.94) 100%);
}
.roycss-ferrum-fireflies::before,
.roycss-ferrum-fireflies::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  background: oklch(0.955 0.173 117.22);
  border-radius: 50%;
  box-shadow:
    0 0 6px 2px color-mix(in oklch, oklch(0.955 0.173 117.22) 60%, transparent),
    0 0 12px 4px color-mix(in oklch, oklch(0.955 0.173 117.22) 30%, transparent);
}
.roycss-ferrum-fireflies::before {
  top: 30%;
  left: 20%;
  box-shadow:
    0 0 6px 2px color-mix(in oklch, oklch(0.955 0.173 117.22) 60%, transparent),
    0 0 12px 4px color-mix(in oklch, oklch(0.955 0.173 117.22) 30%, transparent),
    120px 40px 0 1px color-mix(in oklch, oklch(0.955 0.173 117.22) 80%, transparent),
    120px 40px 6px 3px color-mix(in oklch, oklch(0.955 0.173 117.22) 40%, transparent),
    250px -30px 0 0px color-mix(in oklch, oklch(0.955 0.173 117.22) 60%, transparent),
    250px -30px 6px 2px color-mix(in oklch, oklch(0.955 0.173 117.22) 30%, transparent),
    400px 60px 0 1px color-mix(in oklch, oklch(0.955 0.173 117.22) 70%, transparent),
    400px 60px 6px 3px color-mix(in oklch, oklch(0.955 0.173 117.22) 35%, transparent),
    550px -10px 0 0px color-mix(in oklch, oklch(0.955 0.173 117.22) 50%, transparent),
    550px -10px 6px 2px color-mix(in oklch, oklch(0.955 0.173 117.22) 25%, transparent);
  animation: roy-ferrum-firefly-1 6s ease-in-out infinite;
}
.roycss-ferrum-fireflies::after {
  top: 55%;
  left: 40%;
  box-shadow:
    0 0 6px 2px color-mix(in oklch, oklch(0.955 0.173 117.22) 50%, transparent),
    0 0 12px 4px color-mix(in oklch, oklch(0.955 0.173 117.22) 25%, transparent),
    100px -50px 0 1px color-mix(in oklch, oklch(0.955 0.173 117.22) 70%, transparent),
    100px -50px 6px 3px color-mix(in oklch, oklch(0.955 0.173 117.22) 35%, transparent),
    220px 30px 0 0px color-mix(in oklch, oklch(0.955 0.173 117.22) 60%, transparent),
    220px 30px 6px 2px color-mix(in oklch, oklch(0.955 0.173 117.22) 30%, transparent),
    380px -40px 0 1px color-mix(in oklch, oklch(0.955 0.173 117.22) 80%, transparent),
    380px -40px 6px 3px color-mix(in oklch, oklch(0.955 0.173 117.22) 40%, transparent),
    500px 50px 0 0px color-mix(in oklch, oklch(0.955 0.173 117.22) 50%, transparent),
    500px 50px 6px 2px color-mix(in oklch, oklch(0.955 0.173 117.22) 25%, transparent);
  animation: roy-ferrum-firefly-2 8s ease-in-out infinite;
}

@keyframes roy-ferrum-firefly-1 {

  0%, 100% { transform: translate(0, 0); opacity: 0.2; }
  20% { transform: translate(30px, -40px); opacity: 1; }
  40% { transform: translate(-20px, -60px); opacity: 0.3; }
  60% { transform: translate(40px, -20px); opacity: 0.9; }
  80% { transform: translate(-10px, -50px); opacity: 0.4; }

}

@keyframes roy-ferrum-firefly-2 {

  0%, 100% { transform: translate(0, 0); opacity: 0.5; }
  25% { transform: translate(-35px, -25px); opacity: 0.2; }
  50% { transform: translate(20px, -55px); opacity: 1; }
  75% { transform: translate(-15px, -35px); opacity: 0.3; }

}`,
},

{
  id: "ferrum-ocean-waves",
  name: "Ocean Waves",
  category: "particles",
  description: "An animated motion effect (ocean waves)",
  tags: ["ocean-waves", "waves", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ocean-waves {
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.342 0.071 251.85) 0%, oklch(0.489 0.101 247.65) 40%, oklch(0.63 0.132 246.61) 100%);
}
.roycss-ferrum-ocean-waves::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: -50%;
  width: 200%;
  height: 50%;
  background: radial-gradient(ellipse at 25% 100%, color-mix(in oklch, oklch(0.63 0.132 246.61) 60%, transparent) 0%, transparent 50%),
              radial-gradient(ellipse at 75% 100%, color-mix(in oklch, oklch(0.63 0.132 246.61) 40%, transparent) 0%, transparent 50%);
  border-radius: 40% 40% 0 0 / 30% 30% 0 0;
  animation: roy-ferrum-wave-1 5s ease-in-out infinite;
}
.roycss-ferrum-ocean-waves::after {
  content: '';
  position: absolute;
  bottom: -5%;
  left: -50%;
  width: 200%;
  height: 45%;
  background: radial-gradient(ellipse at 30% 100%, color-mix(in oklch, oklch(0.489 0.101 247.65) 70%, transparent) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 100%, color-mix(in oklch, oklch(0.489 0.101 247.65) 50%, transparent) 0%, transparent 50%);
  border-radius: 45% 45% 0 0 / 25% 25% 0 0;
  animation: roy-ferrum-wave-2 6s ease-in-out infinite;
}

@keyframes roy-ferrum-wave-1 {

  0%, 100% { transform: translateX(0) translateY(0); }
  50% { transform: translateX(-25%) translateY(5px); }

}

@keyframes roy-ferrum-wave-2 {

  0%, 100% { transform: translateX(0) translateY(0); }
  50% { transform: translateX(25%) translateY(-5px); }

}`,
},

{
  id: "ferrum-sunset",
  name: "Sunset",
  category: "particles",
  description: "An animated motion effect (sunset)",
  tags: ["sunset", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-sunset {
  position: relative;
  overflow: hidden;
  animation: roy-ferrum-sunset-glow 8s ease-in-out infinite;
  background: linear-gradient(to bottom,
    oklch(0.189 0.085 299.1) 0%, oklch(0.306 0.093 334.48) 20%, oklch(0.583 0.161 23.52) 45%,
    oklch(0.752 0.16 67.74) 65%, oklch(0.674 0.216 33.01) 80%, oklch(0.593 0.221 1.13) 100%);
}
.roycss-ferrum-sunset::before {
  content: '';
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, oklch(0.961 0.107 103.06) 0%, oklch(0.8 0.162 78.77) 40%, color-mix(in oklch, oklch(0.8 0.162 78.77) 0%, transparent) 70%);
  border-radius: 50%;
  box-shadow: 0 0 60px 30px color-mix(in oklch, oklch(0.8 0.162 78.77) 30%, transparent), 0 0 120px 60px color-mix(in oklch, oklch(0.674 0.216 33.01) 15%, transparent);
}
.roycss-ferrum-sunset::after {
  content: '';
  position: absolute;
  bottom: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  height: 20%;
  background: linear-gradient(to bottom, color-mix(in oklch, oklch(0.142 0.066 295.8) 0%, transparent) 0%, color-mix(in oklch, oklch(0.142 0.066 295.8) 70%, transparent) 100%);
}

@keyframes roy-ferrum-sunset-glow {

  0%, 100% {
    background: linear-gradient(to bottom,
      oklch(0.189 0.085 299.1) 0%, oklch(0.306 0.093 334.48) 20%, oklch(0.583 0.161 23.52) 45%,
      oklch(0.752 0.16 67.74) 65%, oklch(0.674 0.216 33.01) 80%, oklch(0.593 0.221 1.13) 100%);
  }
  50% {
    background: linear-gradient(to bottom,
      oklch(0.142 0.066 295.8) 0%, oklch(0.236 0.106 304.47) 20%, oklch(0.468 0.154 296.01) 35%,
      oklch(0.662 0.173 12.65) 55%, oklch(0.8 0.162 78.77) 75%, oklch(0.615 0.235 30.43) 100%);
  }

}`,
},

{
  id: "ferrum-northern-lights",
  name: "Northern Lights",
  category: "particles",
  description: "An animated motion effect (northern lights)",
  tags: ["northern-lights", "lights", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-northern-lights {
  position: relative;
  overflow: hidden;
  animation: roy-ferrum-aurora-shift 10s ease-in-out infinite;
  background: oklch(0.187 0.05 247.94);
}
.roycss-ferrum-northern-lights::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 120% 40% at 30% 30%, color-mix(in oklch, oklch(0.739 0.152 166.94) 15%, transparent) 0%, transparent 100%),
    radial-gradient(ellipse 100% 30% at 70% 25%, color-mix(in oklch, oklch(0.443 0.244 294.36) 10%, transparent) 0%, transparent 100%),
    radial-gradient(ellipse 80% 35% at 50% 40%, color-mix(in oklch, oklch(0.631 0.127 231.01) 12%, transparent) 0%, transparent 100%);
  animation: roy-ferrum-aurora-shift 10s ease-in-out infinite;
  animation-delay: -3s;
}

@keyframes roy-ferrum-aurora-shift {

  0%, 100% {
    background: linear-gradient(135deg,
      oklch(0.187 0.05 247.94) 0%,
      color-mix(in oklch, oklch(0.449 0.086 172.77) 40%, transparent) 20%,
      color-mix(in oklch, oklch(0.739 0.152 166.94) 30%, transparent) 35%,
      color-mix(in oklch, oklch(0.443 0.244 294.36) 20%, transparent) 50%,
      color-mix(in oklch, oklch(0.594 0.132 160.96) 30%, transparent) 65%,
      oklch(0.187 0.05 247.94) 100%);
  }
  33% {
    background: linear-gradient(120deg,
      oklch(0.187 0.05 247.94) 0%,
      color-mix(in oklch, oklch(0.332 0.199 281.82) 30%, transparent) 25%,
      color-mix(in oklch, oklch(0.798 0.153 173.25) 40%, transparent) 40%,
      color-mix(in oklch, oklch(0.515 0.174 255.79) 30%, transparent) 55%,
      color-mix(in oklch, oklch(0.399 0.226 290.1) 20%, transparent) 70%,
      oklch(0.187 0.05 247.94) 100%);
  }
  66% {
    background: linear-gradient(150deg,
      oklch(0.187 0.05 247.94) 0%,
      color-mix(in oklch, oklch(0.68 0.152 160.63) 30%, transparent) 15%,
      color-mix(in oklch, oklch(0.487 0.263 297.84) 30%, transparent) 30%,
      color-mix(in oklch, oklch(0.742 0.144 171.55) 40%, transparent) 50%,
      color-mix(in oklch, oklch(0.455 0.173 258.54) 30%, transparent) 70%,
      oklch(0.187 0.05 247.94) 100%);
  }

}`,
},

{
  id: "ferrum-fog",
  name: "Fog",
  category: "particles",
  description: "An animated motion effect (fog)",
  tags: ["fog", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-fog {
  position: relative;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.691 0.026 242.51) 0%, oklch(0.819 0.021 238.73) 50%, oklch(0.773 0.023 235.1) 100%);
}
.roycss-ferrum-fog::before {
  content: '';
  position: absolute;
  top: 0;
  left: -10%;
  width: 120%;
  height: 60%;
  background: radial-gradient(ellipse at 20% 50%, color-mix(in oklch, oklch(1 0 0) 50%, transparent) 0%, transparent 60%),
              radial-gradient(ellipse at 60% 60%, color-mix(in oklch, oklch(1 0 0) 40%, transparent) 0%, transparent 50%),
              radial-gradient(ellipse at 90% 40%, color-mix(in oklch, oklch(1 0 0) 35%, transparent) 0%, transparent 55%);
  animation: roy-ferrum-fog-drift-1 8s ease-in-out infinite;
}
.roycss-ferrum-fog::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -10%;
  width: 120%;
  height: 55%;
  background: radial-gradient(ellipse at 30% 50%, color-mix(in oklch, oklch(1 0 0) 45%, transparent) 0%, transparent 55%),
              radial-gradient(ellipse at 70% 40%, color-mix(in oklch, oklch(1 0 0) 50%, transparent) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 70%, color-mix(in oklch, oklch(1 0 0) 30%, transparent) 0%, transparent 50%);
  animation: roy-ferrum-fog-drift-2 10s ease-in-out infinite;
}

@keyframes roy-ferrum-fog-drift-1 {

  0%, 100% { transform: translateX(-5%); opacity: 0.5; }
  50% { transform: translateX(5%); opacity: 0.8; }

}

@keyframes roy-ferrum-fog-drift-2 {

  0%, 100% { transform: translateX(5%); opacity: 0.4; }
  50% { transform: translateX(-8%); opacity: 0.7; }

}`,
},

{
  id: "ferrum-stars-twinkle",
  name: "Stars Twinkle",
  category: "particles",
  description: "An animated motion effect (stars twinkle)",
  tags: ["stars-twinkle", "twinkle", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-stars-twinkle {
  position: relative;
  overflow: hidden;
  background: oklch(0.155 0.034 281.74);
}
.roycss-ferrum-stars-twinkle::before,
.roycss-ferrum-stars-twinkle::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  box-shadow:
    40px 20px 0 0 color-mix(in oklch, oklch(1 0 0) 80%, transparent),
    100px 60px 0 1px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    170px 15px 0 0 color-mix(in oklch, oklch(1 0 0) 90%, transparent),
    230px 80px 0 0px color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    300px 30px 0 1px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    380px 70px 0 0px color-mix(in oklch, oklch(1 0 0) 80%, transparent),
    450px 10px 0 0px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    520px 55px 0 1px color-mix(in oklch, oklch(1 0 0) 90%, transparent),
    590px 40px 0 0px color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    670px 25px 0 1px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    740px 65px 0 0px color-mix(in oklch, oklch(1 0 0) 80%, transparent),
    810px 45px 0 0px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    880px 5px 0 1px color-mix(in oklch, oklch(1 0 0) 90%, transparent),
    950px 75px 0 0px color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    1020px 35px 0 0px color-mix(in oklch, oklch(1 0 0) 70%, transparent);
}
.roycss-ferrum-stars-twinkle::before {
  top: 10%;
  left: 5%;
  animation: roy-ferrum-twinkle-1 3s ease-in-out infinite;
}
.roycss-ferrum-stars-twinkle::after {
  top: 40%;
  left: 8%;
  box-shadow:
    50px 40px 0 1px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    120px 10px 0 0px color-mix(in oklch, oklch(1 0 0) 90%, transparent),
    190px 55px 0 0px color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    260px 25px 0 1px color-mix(in oklch, oklch(1 0 0) 80%, transparent),
    330px 65px 0 0px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    410px 5px 0 0px color-mix(in oklch, oklch(1 0 0) 90%, transparent),
    480px 50px 0 1px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    560px 20px 0 0px color-mix(in oklch, oklch(1 0 0) 80%, transparent),
    630px 70px 0 0px color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    700px 35px 0 1px color-mix(in oklch, oklch(1 0 0) 90%, transparent),
    780px 15px 0 0px color-mix(in oklch, oklch(1 0 0) 60%, transparent),
    850px 60px 0 0px color-mix(in oklch, oklch(1 0 0) 80%, transparent),
    930px 30px 0 1px color-mix(in oklch, oklch(1 0 0) 70%, transparent),
    1000px 50px 0 0px color-mix(in oklch, oklch(1 0 0) 50%, transparent),
    1070px 10px 0 0px color-mix(in oklch, oklch(1 0 0) 90%, transparent);
  animation: roy-ferrum-twinkle-2 4s ease-in-out infinite;
}

@keyframes roy-ferrum-twinkle-1 {

  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }

}

@keyframes roy-ferrum-twinkle-2 {

  0%, 100% { opacity: 0.6; }
  30% { opacity: 0.2; }
  70% { opacity: 1; }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // SCROLL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-scroll-fade-up",
  name: "Fade Up",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-fade-up", "fade", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-fade-up {
  animation: roy-ferrum-scroll-fade-up 0.7s ease-out both;
}

@keyframes roy-ferrum-scroll-fade-up {

  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }

}`,
},

{
  id: "ferrum-scroll-fade-left",
  name: "Fade Left",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-fade-left", "fade", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-fade-left {
  animation: roy-ferrum-scroll-fade-left 0.7s ease-out both;
}

@keyframes roy-ferrum-scroll-fade-left {

  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }

}`,
},

{
  id: "ferrum-scroll-fade-right",
  name: "Fade Right",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-fade-right", "fade", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-fade-right {
  animation: roy-ferrum-scroll-fade-right 0.7s ease-out both;
}

@keyframes roy-ferrum-scroll-fade-right {

  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }

}`,
},

{
  id: "ferrum-scroll-zoom-in",
  name: "Zoom In",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-zoom-in", "zoom", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-zoom-in {
  animation: roy-ferrum-scroll-zoom-in 0.6s ease-out both;
}

@keyframes roy-ferrum-scroll-zoom-in {

  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }

}`,
},

{
  id: "ferrum-scroll-slide-stagger",
  name: "Slide Stagger",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-slide-stagger", "slide", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-slide-stagger {
  animation: roy-ferrum-scroll-slide-stagger 0.8s ease-out both;
  animation-delay: 0.1s;
}

@keyframes roy-ferrum-scroll-slide-stagger {

  from {
    opacity: 0;
    transform: translateY(30px);
  }
  60% {
    opacity: 0.8;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }

}`,
},

{
  id: "ferrum-scroll-flip-in",
  name: "Flip In",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-flip-in", "flip", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-flip-in {
  animation: roy-ferrum-scroll-flip-in 0.7s ease-out both;
  backface-visibility: visible;
}

@keyframes roy-ferrum-scroll-flip-in {

  from {
    opacity: 0;
    transform: perspective(400px) rotateY(90deg);
  }
  to {
    opacity: 1;
    transform: perspective(400px) rotateY(0deg);
  }

}`,
},

{
  id: "ferrum-scroll-rotate-in",
  name: "Rotate In",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-rotate-in", "rotate", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-rotate-in {
  animation: roy-ferrum-scroll-rotate-in 0.8s ease-out both;
}

@keyframes roy-ferrum-scroll-rotate-in {

  from {
    opacity: 0;
    transform: rotate(-200deg) scale(0.6);
  }
  to {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }

}`,
},

{
  id: "ferrum-scroll-scale-bounce",
  name: "Scale Bounce",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-scale-bounce", "scale", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-scale-bounce {
  animation: roy-ferrum-scroll-scale-bounce 0.8s ease-out both;
}

@keyframes roy-ferrum-scroll-scale-bounce {

  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }

}`,
},

{
  id: "ferrum-scroll-blur-clear",
  name: "Blur Clear",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-blur-clear", "blur", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-blur-clear {
  animation: roy-ferrum-scroll-blur-clear 0.7s ease-out both;
}

@keyframes roy-ferrum-scroll-blur-clear {

  from {
    opacity: 0;
    filter: blur(10px);
    transform: scale(1.05);
  }
  to {
    opacity: 1;
    filter: blur(0px);
    transform: scale(1);
  }

}`,
},

{
  id: "ferrum-scroll-clip-reveal",
  name: "Clip Reveal",
  category: "scroll",
  description: "A scroll-triggered or scroll-linked visual effect",
  tags: ["scroll", "scrolling", "scroll-clip-reveal", "clip", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-scroll-clip-reveal {
  animation: roy-ferrum-scroll-clip-reveal 0.7s ease-out both;
}

@keyframes roy-ferrum-scroll-clip-reveal {

  from {
    opacity: 0;
    clip-path: circle(0% at 50% 50%);
  }
  to {
    opacity: 1;
    clip-path: circle(75% at 50% 50%);
  }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-sepia-in",
  name: "Sepia In",
  category: "visual",
  description: "An animated motion effect (sepia in)",
  tags: ["sepia-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-sepia-in {
  animation: roy-ferrum-sepia-in 1.2s ease-out both;
}

@keyframes roy-ferrum-sepia-in {

  0% { filter: sepia(1); }
  100% { filter: sepia(0); }

}`,
},

{
  id: "ferrum-sepia-out",
  name: "Sepia Out",
  category: "visual",
  description: "An animated motion effect (sepia out)",
  tags: ["sepia-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-sepia-out {
  animation: roy-ferrum-sepia-out 1.2s ease-in both;
}

@keyframes roy-ferrum-sepia-out {

  0% { filter: sepia(0); }
  100% { filter: sepia(1); }

}`,
},

{
  id: "ferrum-saturate-pulse",
  name: "Saturate Pulse",
  category: "visual",
  description: "An animated motion effect (saturate pulse)",
  tags: ["saturate-pulse", "pulse", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-saturate-pulse {
  animation: roy-ferrum-saturate-pulse 2s ease-in-out infinite;
}

@keyframes roy-ferrum-saturate-pulse {

  0%, 100% { filter: saturate(1); }
  50% { filter: saturate(2.5); }

}`,
},

{
  id: "ferrum-hue-rotate",
  name: "Hue Rotate",
  category: "visual",
  description: "An animated motion effect (hue rotate)",
  tags: ["hue-rotate", "rotate", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hue-rotate {
  animation: roy-ferrum-hue-rotate 4s linear infinite;
}

@keyframes roy-ferrum-hue-rotate {

  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }

}`,
},

{
  id: "ferrum-invert-flash",
  name: "Invert Flash",
  category: "visual",
  description: "An animated motion effect (invert flash)",
  tags: ["invert-flash", "flash", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-invert-flash {
  animation: roy-ferrum-invert-flash 2s ease-in-out infinite;
}

@keyframes roy-ferrum-invert-flash {

  0%, 40%, 60%, 100% { filter: invert(0); }
  45%, 55% { filter: invert(1); }

}`,
},

{
  id: "ferrum-brightness-pulse",
  name: "Brightness Pulse",
  category: "visual",
  description: "An animated motion effect (brightness pulse)",
  tags: ["brightness-pulse", "pulse", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-brightness-pulse {
  animation: roy-ferrum-brightness-pulse 2.5s ease-in-out infinite;
}

@keyframes roy-ferrum-brightness-pulse {

  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.4); }

}`,
},

{
  id: "ferrum-contrast-switch",
  name: "Contrast Switch",
  category: "visual",
  description: "An animated motion effect (contrast switch)",
  tags: ["contrast-switch", "switch", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-contrast-switch {
  animation: roy-ferrum-contrast-switch 3s ease-in-out infinite;
}

@keyframes roy-ferrum-contrast-switch {

  0%, 45%, 55%, 100% { filter: contrast(1); }
  50% { filter: contrast(1.8); }

}`,
},

{
  id: "ferrum-vintage",
  name: "Vintage",
  category: "visual",
  description: "An animated motion effect (vintage)",
  tags: ["vintage", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-vintage {
  animation: roy-ferrum-vintage 4s ease-in-out infinite;
}

@keyframes roy-ferrum-vintage {

  0%, 100% {
    filter: sepia(0.5) contrast(1.1) brightness(0.95);
  }
  50% {
    filter: sepia(0.7) contrast(1.15) brightness(0.85);
  }

}`,
},

];
