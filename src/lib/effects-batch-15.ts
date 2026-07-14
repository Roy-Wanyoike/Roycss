import type { CSSEffect } from "./roycss-types";

/**
 * Batch 15 — Game / Retro / Tech CSS Effects (40 effects)
 * - visual (12): game UI elements (bars, icons, HUD)
 * - backgrounds (10): retro 80s + sci-fi tech backgrounds
 * - animations (10): game character + retro motion animations
 * - text (8): retro/game typography
 *
 * All classes use `.roycss-` prefix; all keyframes use `roy-b15-` prefix.
 * Verified zero ID / keyframe collisions with batches 1-13 (620 effects, 500 keyframes).
 */
export const effectsBatch15: CSSEffect[] = [
  /* =========================================================================
   * VISUAL — GAME UI ELEMENTS (12)
   * ========================================================================= */
  {
    id: "game-health-bar",
    name: "Game Health Bar",
    category: "visual",
    description:
      "Video game style health bar with animated red fill, segmented tick marks, and pulsing glow that simulates damage flicker",
    tags: ["game", "health", "bar", "hud"],
    previewType: "box",
    cssCode: `/* Game Health Bar */
.roycss-game-health-bar {
  inline-size: 140px;
  block-size: 18px;
  background: oklch(0.148 0.045 24.52);
  border: 2px solid oklch(0.302 0.112 27.17);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 0 1px oklch(0.193 0.061 24.87), 0 4px 10px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}
.roycss-game-health-bar::before {
  content: "";
  position: absolute;
  inset-block-start: 2px;
  inset-block-end: 2px;
  inset-inline-start: 2px;
  inline-size: 78%;
  background: linear-gradient(to bottom, oklch(0.702 0.19 23.33) 0%, oklch(0.581 0.222 27.81) 45%, oklch(0.446 0.179 28.69) 100%);
  border-radius: 2px;
  box-shadow: 0 0 10px color-mix(in oklch, oklch(0.642 0.244 27.69) 80%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(0.881 0.063 18.42) 60%, transparent), inset 0 -2px 4px color-mix(in oklch, oklch(0.271 0.111 29.23) 60%, transparent);
  animation: roy-b15-health-pulse 1.6s ease-in-out infinite;
}
.roycss-game-health-bar::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0, transparent 13px, color-mix(in oklch, oklch(0 0 0) 45%, transparent) 13px, color-mix(in oklch, oklch(0 0 0) 45%, transparent) 15px);
  pointer-events: none;
}
@keyframes roy-b15-health-pulse {
  0%, 100% { inline-size: 78%; filter: brightness(1); }
  45% { inline-size: 70%; filter: brightness(1.25); }
  50% { inline-size: 70%; filter: brightness(0.7); }
  55% { inline-size: 70%; filter: brightness(1.3); }
  60% { inline-size: 78%; filter: brightness(1); }
}`
  },
  {
    id: "game-mana-bar",
    name: "Game Mana Bar",
    category: "visual",
    description:
      "Blue mana / energy bar with flowing shimmer wave and glowing cyan edge that pulses like arcane energy",
    tags: ["game", "mana", "bar", "magic"],
    previewType: "box",
    cssCode: `/* Game Mana Bar */
.roycss-game-mana-bar {
  inline-size: 140px;
  block-size: 18px;
  background: oklch(0.165 0.031 237.9);
  border: 2px solid oklch(0.335 0.075 243.71);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 0 1px oklch(0.231 0.042 234.97), 0 4px 10px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
}
.roycss-game-mana-bar::before {
  content: "";
  position: absolute;
  inset-block-start: 2px;
  inset-block-end: 2px;
  inset-inline-start: 2px;
  inline-size: 85%;
  background: linear-gradient(to bottom, oklch(0.822 0.123 223.27) 0%, oklch(0.652 0.19 253.21) 45%, oklch(0.424 0.147 257.84) 100%);
  border-radius: 2px;
  box-shadow: 0 0 12px color-mix(in oklch, oklch(0.737 0.15 241.15) 85%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(0.932 0.046 222.57) 70%, transparent), inset 0 -2px 4px color-mix(in oklch, oklch(0.251 0.099 259.32) 70%, transparent);
}
.roycss-game-mana-bar::after {
  content: "";
  position: absolute;
  inset-block-start: 2px;
  inset-block-end: 2px;
  inset-inline-start: 2px;
  inline-size: 85%;
  background: linear-gradient(90deg, transparent 0%, color-mix(in oklch, oklch(1 0 89.88) 55%, transparent) 50%, transparent 100%);
  background-size: 60px 100%;
  border-radius: 2px;
  animation: roy-b15-mana-flow 2.2s linear infinite;
}
@keyframes roy-b15-mana-flow {
  0% { background-position: -60px 0; }
  100% { background-position: 160px 0; }
}`
  },
  {
    id: "game-exp-bar",
    name: "Game Experience Bar",
    category: "visual",
    description:
      "XP experience bar with golden gradient fill, traveling shine sweep, and beveled metallic frame",
    tags: ["game", "experience", "xp", "bar"],
    previewType: "box",
    cssCode: `/* Game Experience Bar */
.roycss-game-exp-bar {
  inline-size: 160px;
  block-size: 14px;
  background: oklch(0.194 0.031 90.38);
  border: 2px solid oklch(0.434 0.083 77.16);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px color-mix(in oklch, oklch(0 0 0) 70%, transparent), 0 0 0 1px color-mix(in oklch, oklch(0.88 0.152 89.49) 20%, transparent);
}
.roycss-game-exp-bar::before {
  content: "";
  position: absolute;
  inset-block-start: 1px;
  inset-block-end: 1px;
  inset-inline-start: 1px;
  inline-size: 62%;
  background: linear-gradient(to bottom, oklch(0.925 0.125 95.92) 0%, oklch(0.813 0.165 75.04) 50%, oklch(0.585 0.132 64.59) 100%);
  border-radius: 6px;
  box-shadow: 0 0 10px color-mix(in oklch, oklch(0.84 0.156 80.27) 70%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(0.981 0.039 99.3) 80%, transparent);
}
.roycss-game-exp-bar::after {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-block-end: 0;
  inset-inline-start: -40%;
  inline-size: 40%;
  background: linear-gradient(90deg, transparent 0%, color-mix(in oklch, oklch(1 0 89.88) 85%, transparent) 50%, transparent 100%);
  transform: skewX(-20deg);
  animation: roy-b15-exp-shine 2.6s ease-in-out infinite;
}
@keyframes roy-b15-exp-shine {
  0%, 100% { inset-inline-start: -40%; }
  50%, 60% { inset-inline-start: 100%; }
}`
  },
  {
    id: "game-shield-icon",
    name: "Game Shield Icon",
    category: "visual",
    description:
      "Heraldic shield shape rendered with pure CSS, pulsing protection aura and metallic gradient face",
    tags: ["game", "shield", "icon", "defense"],
    previewType: "box",
    cssCode: `/* Game Shield Icon */
.roycss-game-shield-icon {
  inline-size: 80px;
  block-size: 96px;
  position: relative;
  background: linear-gradient(135deg, oklch(0.832 0.024 264.44) 0%, oklch(0.556 0.034 266.95) 40%, oklch(0.386 0.037 264) 70%, oklch(0.251 0.029 261.39) 100%);
  clip-path: polygon(50% 0%, 100% 12%, 100% 55%, 50% 100%, 0% 55%, 0% 12%);
  box-shadow: inset 0 2px 0 color-mix(in oklch, oklch(1 0 89.88) 50%, transparent), inset 0 -8px 14px color-mix(in oklch, oklch(0 0 0) 60%, transparent);
  animation: roy-b15-shield-pulse 2.4s ease-in-out infinite;
}
.roycss-game-shield-icon::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, oklch(0.663 0.179 259.31) 0%, oklch(0.396 0.14 262.67) 50%, oklch(0.25 0.086 263.18) 100%);
  clip-path: polygon(50% 0%, 100% 12%, 100% 55%, 50% 100%, 0% 55%, 0% 12%);
  box-shadow: inset 0 1px 0 color-mix(in oklch, oklch(0.878 0.064 245.03) 60%, transparent);
}
.roycss-game-shield-icon::after {
  content: "";
  position: absolute;
  inset-block-start: 28%;
  inset-inline-start: 50%;
  inline-size: 14px;
  block-size: 40px;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, oklch(0.913 0.121 91.98), oklch(0.651 0.13 71.23));
  clip-path: polygon(35% 0%, 65% 0%, 65% 55%, 80% 55%, 50% 100%, 20% 55%, 35% 55%);
  filter: drop-shadow(0 0 4px color-mix(in oklch, oklch(0.861 0.147 83.67) 70%, transparent));
}
@keyframes roy-b15-shield-pulse {
  0%, 100% { filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(0.699 0.161 254.31) 50%, transparent)); }
  50% { filter: drop-shadow(0 0 16px color-mix(in oklch, oklch(0.803 0.111 240.15) 90%, transparent)); }
}`
  },
  {
    id: "game-sword-icon",
    name: "Game Sword Icon",
    category: "visual",
    description:
      "CSS sword shape with steel blade, golden crossguard, leather grip and jeweled pommel, idle swing animation",
    tags: ["game", "sword", "icon", "weapon"],
    previewType: "box",
    cssCode: `/* Game Sword Icon */
.roycss-game-sword-icon {
  inline-size: 60px;
  block-size: 120px;
  position: relative;
  transform-origin: 50% 95%;
  animation: roy-b15-sword-sway 3s ease-in-out infinite;
}
.roycss-game-sword-icon::before {
  content: "";
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 50%;
  inline-size: 8px;
  block-size: 80px;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, oklch(1 0 89.88) 0%, oklch(0.896 0.013 262.38) 30%, oklch(0.706 0.024 269.34) 70%, oklch(0.489 0.024 267.07) 100%);
  clip-path: polygon(50% 0%, 100% 8%, 100% 100%, 0% 100%, 0% 8%);
  box-shadow: 0 0 4px color-mix(in oklch, oklch(0.891 0.053 261.66) 60%, transparent);
}
.roycss-game-sword-icon::after {
  content: "";
  position: absolute;
  inset-block-start: 78px;
  inset-inline-start: 50%;
  inline-size: 40px;
  block-size: 8px;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, oklch(0.913 0.121 91.98), oklch(0.6 0.126 69.03) 60%, oklch(0.413 0.084 64.27));
  border-radius: 2px;
  box-shadow: 0 8px 0 -1px oklch(0.383 0.093 46.13), 0 8px 0 oklch(0.3 0.069 40.77), 0 18px 0 -3px oklch(0.478 0.106 53.98);
}
@keyframes roy-b15-sword-sway {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}`
  },
  {
    id: "game-coin-spin",
    name: "Game Coin Spin",
    category: "visual",
    description:
      "Spinning gold coin with 3D rotation, embossed star face, and shimmering metallic edge",
    tags: ["game", "coin", "spin", "3d"],
    previewType: "box",
    cssCode: `/* Game Coin Spin */
.roycss-game-coin-spin {
  inline-size: 64px;
  block-size: 64px;
  position: relative;
  transform-style: preserve-3d;
  animation: roy-b15-coin-spin 2.4s linear infinite;
}
.roycss-game-coin-spin::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, oklch(0.969 0.06 98.18) 0%, oklch(0.887 0.163 92.9) 35%, oklch(0.65 0.135 73.03) 70%, oklch(0.412 0.087 66.56) 100%);
  box-shadow: 0 0 18px color-mix(in oklch, oklch(0.859 0.159 85.88) 60%, transparent), inset 0 2px 4px color-mix(in oklch, oklch(0.991 0.045 107.2) 70%, transparent), inset 0 -3px 6px color-mix(in oklch, oklch(0.324 0.077 58.54) 60%, transparent);
}
.roycss-game-coin-spin::after {
  content: "★";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: oklch(0.478 0.111 57.74);
  text-shadow: 0 1px 0 color-mix(in oklch, oklch(0.953 0.078 95.74) 70%, transparent), 0 -1px 0 color-mix(in oklch, oklch(0.324 0.077 58.54) 50%, transparent);
}
@keyframes roy-b15-coin-spin {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}`
  },
  {
    id: "game-potion-bubble",
    name: "Game Potion Bubble",
    category: "visual",
    description:
      "Red health potion flask with bubbling liquid surface, glass shine highlight, and floating bubble particles",
    tags: ["game", "potion", "bubble", "hud"],
    previewType: "box",
    cssCode: `/* Game Potion Bubble */
.roycss-game-potion-bubble {
  inline-size: 56px;
  block-size: 80px;
  position: relative;
  background: linear-gradient(to bottom, transparent 0%, transparent 18%, oklch(0.193 0.061 24.87) 18%, oklch(0.193 0.061 24.87) 100%);
  clip-path: polygon(40% 0%, 60% 0%, 60% 22%, 80% 35%, 80% 100%, 20% 100%, 20% 35%, 40% 22%);
}
.roycss-game-potion-bubble::before {
  content: "";
  position: absolute;
  inset-block-start: 35%;
  inset-inline-start: 20%;
  inset-inline-end: 20%;
  inset-block-end: 8%;
  background: linear-gradient(to bottom, oklch(0.696 0.194 23.61) 0%, oklch(0.581 0.222 27.81) 40%, oklch(0.382 0.149 28.17) 100%);
  border-radius: 4px 4px 14px 14px;
  box-shadow: inset 0 2px 0 color-mix(in oklch, oklch(0.841 0.088 19.07) 60%, transparent), inset 0 -4px 6px color-mix(in oklch, oklch(0.174 0.071 29.23) 70%, transparent), 0 0 14px color-mix(in oklch, oklch(0.656 0.23 26.33) 50%, transparent);
  animation: roy-b15-potion-wave 2s ease-in-out infinite;
}
.roycss-game-potion-bubble::after {
  content: "";
  position: absolute;
  inset-block-start: 42%;
  inset-inline-start: 30%;
  inline-size: 6px;
  block-size: 6px;
  border-radius: 50%;
  background: color-mix(in oklch, oklch(0.881 0.063 18.42) 85%, transparent);
  box-shadow: 12px -8px 0 -1px color-mix(in oklch, oklch(0.924 0.039 17.88) 70%, transparent), 6px 12px 0 -2px color-mix(in oklch, oklch(0.881 0.063 18.42) 60%, transparent), -8px 16px 0 -2px color-mix(in oklch, oklch(0.841 0.088 19.07) 50%, transparent);
  animation: roy-b15-potion-bubble-up 2.6s ease-in infinite;
}
@keyframes roy-b15-potion-wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
@keyframes roy-b15-potion-bubble-up {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-18px); opacity: 0; }
}`
  },
  {
    id: "game-chest-glow",
    name: "Game Chest Glow",
    category: "visual",
    description:
      "Treasure chest with wooden plank body, iron bands, golden lock, and pulsing golden aura leaking from inside",
    tags: ["game", "chest", "treasure", "loot"],
    previewType: "box",
    cssCode: `/* Game Chest Glow */
.roycss-game-chest-glow {
  inline-size: 110px;
  block-size: 80px;
  position: relative;
  background: linear-gradient(to bottom, oklch(0.478 0.106 53.98) 0%, oklch(0.382 0.096 49.1) 50%, oklch(0.292 0.078 44.77) 100%);
  border-radius: 4px 4px 6px 6px;
  box-shadow: inset 0 2px 0 color-mix(in oklch, oklch(0.868 0.099 68.36) 30%, transparent), inset 0 -6px 8px color-mix(in oklch, oklch(0 0 0) 60%, transparent), 0 6px 14px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
  animation: roy-b15-chest-aura 2.2s ease-in-out infinite;
}
.roycss-game-chest-glow::before {
  content: "";
  position: absolute;
  inset-block-start: -1px;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 30%;
  background: linear-gradient(to bottom, oklch(0.539 0.115 55.86) 0%, oklch(0.382 0.096 49.1) 100%);
  border-radius: 6px 6px 0 0;
  border-block-end: 2px solid oklch(0.21 0.049 45.9);
  box-shadow: inset 0 2px 0 color-mix(in oklch, oklch(0.868 0.099 68.36) 40%, transparent);
}
.roycss-game-chest-glow::after {
  content: "";
  position: absolute;
  inset-block-start: 22%;
  inset-inline-start: 50%;
  inline-size: 16px;
  block-size: 20px;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, oklch(0.913 0.121 91.98), oklch(0.65 0.135 73.03) 60%, oklch(0.412 0.087 66.56));
  border-radius: 3px 3px 8px 8px;
  box-shadow: 0 0 12px color-mix(in oklch, oklch(0.859 0.159 85.88) 90%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(0.977 0.064 102.77) 70%, transparent);
}
@keyframes roy-b15-chest-aura {
  0%, 100% { filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(0.822 0.154 74.42) 40%, transparent)); }
  50% { filter: drop-shadow(0 0 18px color-mix(in oklch, oklch(0.902 0.143 93.06) 85%, transparent)); }
}`
  },
  {
    id: "game-minimap",
    name: "Game Minimap",
    category: "visual",
    description:
      "Circular minimap with topographic tint, rotating sweep radar, hostile red blip and friendly green blip markers",
    tags: ["game", "minimap", "radar", "hud"],
    previewType: "box",
    cssCode: `/* Game Minimap */
.roycss-game-minimap {
  inline-size: 110px;
  block-size: 110px;
  border-radius: 50%;
  position: relative;
  background: radial-gradient(circle, color-mix(in oklch, oklch(0.319 0.069 149.13) 60%, transparent) 0%, color-mix(in oklch, oklch(0.19 0.033 150.56) 95%, transparent) 80%);
  border: 2px solid oklch(0.47 0.101 149.21);
  box-shadow: 0 0 0 2px oklch(0.136 0.014 151.49), 0 0 14px color-mix(in oklch, oklch(0.736 0.184 148.81) 30%, transparent), inset 0 0 20px color-mix(in oklch, oklch(0 0 0) 70%, transparent);
  overflow: hidden;
}
.roycss-game-minimap::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, transparent 8%, transparent 9%, color-mix(in oklch, oklch(0.736 0.184 148.81) 20%, transparent) 9%, color-mix(in oklch, oklch(0.736 0.184 148.81) 20%, transparent) 10%, transparent 10%),
    radial-gradient(circle at 50% 50%, transparent 24%, color-mix(in oklch, oklch(0.736 0.184 148.81) 18%, transparent) 24%, color-mix(in oklch, oklch(0.736 0.184 148.81) 18%, transparent) 25%, transparent 25%),
    radial-gradient(circle at 50% 50%, transparent 40%, color-mix(in oklch, oklch(0.736 0.184 148.81) 15%, transparent) 40%, color-mix(in oklch, oklch(0.736 0.184 148.81) 15%, transparent) 41%, transparent 41%),
    linear-gradient(0deg, transparent 49.5%, color-mix(in oklch, oklch(0.736 0.184 148.81) 25%, transparent) 49.5%, color-mix(in oklch, oklch(0.736 0.184 148.81) 25%, transparent) 50.5%, transparent 50.5%),
    linear-gradient(90deg, transparent 49.5%, color-mix(in oklch, oklch(0.736 0.184 148.81) 25%, transparent) 49.5%, color-mix(in oklch, oklch(0.736 0.184 148.81) 25%, transparent) 50.5%, transparent 50.5%);
  border-radius: 50%;
}
.roycss-game-minimap::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 50%;
  block-size: 50%;
  transform-origin: top left;
  background: conic-gradient(from 0deg, color-mix(in oklch, oklch(0.883 0.228 147.32) 55%, transparent) 0deg, transparent 60deg);
  border-radius: 0 0 0 100%;
  animation: roy-b15-minimap-sweep 3s linear infinite;
  box-shadow: 0 0 4px color-mix(in oklch, oklch(0.883 0.228 147.32) 80%, transparent);
}
@keyframes roy-b15-minimap-sweep {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`
  },
  {
    id: "game-crosshair",
    name: "Game Crosshair",
    category: "visual",
    description:
      "FPS targeting crosshair with four tick marks, center dot, and pulsing red confirm glow on hover",
    tags: ["game", "crosshair", "fps", "target"],
    previewType: "box",
    cssCode: `/* Game Crosshair */
.roycss-game-crosshair {
  inline-size: 80px;
  block-size: 80px;
  position: relative;
  background:
    linear-gradient(90deg, transparent 48%, oklch(0.876 0.228 152.55) 48%, oklch(0.876 0.228 152.55) 52%, transparent 52%) center / 100% 2px no-repeat,
    linear-gradient(0deg, transparent 48%, oklch(0.876 0.228 152.55) 48%, oklch(0.876 0.228 152.55) 52%, transparent 52%) center / 2px 100% no-repeat;
  filter: drop-shadow(0 0 4px color-mix(in oklch, oklch(0.877 0.224 153.29) 80%, transparent));
  animation: roy-b15-crosshair-pulse 1.4s ease-in-out infinite;
}
.roycss-game-crosshair::before {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 6px;
  block-size: 6px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: oklch(0.876 0.228 152.55);
  box-shadow: 0 0 6px color-mix(in oklch, oklch(0.877 0.224 153.29) 100%, transparent);
}
.roycss-game-crosshair::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 50px;
  block-size: 50px;
  transform: translate(-50%, -50%);
  border: 1.5px solid color-mix(in oklch, oklch(0.877 0.224 153.29) 45%, transparent);
  border-radius: 50%;
  box-shadow: 0 0 8px color-mix(in oklch, oklch(0.877 0.224 153.29) 40%, transparent), inset 0 0 8px color-mix(in oklch, oklch(0.877 0.224 153.29) 25%, transparent);
}
@keyframes roy-b15-crosshair-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.75; }
}`
  },
  {
    id: "game-combo-counter",
    name: "Game Combo Counter",
    category: "visual",
    description:
      "Combo hit counter with bold yellow numeral, pulsing scale punch, and rising combo glow that intensifies",
    tags: ["game", "combo", "counter", "hud"],
    previewType: "box",
    cssCode: `/* Game Combo Counter */
.roycss-game-combo-counter {
  inline-size: 120px;
  block-size: 60px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 38px;
  font-weight: 900;
  font-style: italic;
  color: oklch(0.907 0.17 97.66);
  text-shadow:
    0 0 0 oklch(0 0 0),
    -2px -2px 0 oklch(0 0 0),
    2px -2px 0 oklch(0 0 0),
    -2px 2px 0 oklch(0 0 0),
    2px 2px 0 oklch(0 0 0),
    -2px 0 0 oklch(0 0 0),
    2px 0 0 oklch(0 0 0),
    0 -2px 0 oklch(0 0 0),
    0 2px 0 oklch(0 0 0),
    0 0 12px color-mix(in oklch, oklch(0.858 0.167 87.29) 90%, transparent),
    0 0 20px color-mix(in oklch, oklch(0.72 0.191 49.76) 70%, transparent);
  animation: roy-b15-combo-punch 0.6s ease-in-out infinite;
}
.roycss-game-combo-counter::before {
  content: "x12";
}
.roycss-game-combo-counter::after {
  content: "COMBO";
  position: absolute;
  inset-block-end: 6px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-style: normal;
  letter-spacing: 3px;
  color: oklch(0.689 0.206 39.23);
  text-shadow: 0 0 6px color-mix(in oklch, oklch(0.694 0.203 40.67) 80%, transparent), 1px 1px 0 oklch(0 0 0);
  animation: roy-b15-combo-flash 0.6s ease-in-out infinite alternate;
}
@keyframes roy-b15-combo-punch {
  0%, 100% { transform: scale(1) rotate(-3deg); }
  50% { transform: scale(1.12) rotate(-3deg); }
}
@keyframes roy-b15-combo-flash {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}`
  },
  {
    id: "game-achievement-badge",
    name: "Game Achievement Badge",
    category: "visual",
    description:
      "Achievement unlocked badge with golden star medallion, ribbon banner, rotating shine sweep, and pop-in scale",
    tags: ["game", "achievement", "badge", "unlock"],
    previewType: "box",
    cssCode: `/* Game Achievement Badge */
.roycss-game-achievement-badge {
  inline-size: 120px;
  block-size: 120px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: roy-b15-ach-pop 0.8s ease-out both;
}
.roycss-game-achievement-badge::before {
  content: "";
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, oklch(0.959 0.096 100.97) 0%, oklch(0.874 0.173 91.58) 40%, oklch(0.65 0.135 73.03) 75%, oklch(0.412 0.087 66.56) 100%);
  box-shadow: 0 0 16px color-mix(in oklch, oklch(0.859 0.159 85.88) 70%, transparent), inset 0 2px 4px color-mix(in oklch, oklch(0.977 0.064 102.77) 70%, transparent), inset 0 -4px 8px color-mix(in oklch, oklch(0.324 0.077 58.54) 60%, transparent);
}
.roycss-game-achievement-badge::after {
  content: "★";
  position: absolute;
  font-size: 50px;
  color: oklch(0.478 0.111 57.74);
  text-shadow: 0 1px 0 color-mix(in oklch, oklch(0.953 0.078 95.74) 70%, transparent), 0 -1px 0 color-mix(in oklch, oklch(0.324 0.077 58.54) 50%, transparent);
  z-index: 2;
  animation: roy-b15-ach-shine 2.4s linear infinite;
}
@keyframes roy-b15-ach-pop {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(10deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes roy-b15-ach-shine {
  0%, 100% { filter: drop-shadow(0 0 4px color-mix(in oklch, oklch(0.9 0.157 94.82) 60%, transparent)); }
  50% { filter: drop-shadow(0 0 14px color-mix(in oklch, oklch(0.944 0.142 102.24) 100%, transparent)); }
}`
  },

  /* =========================================================================
   * BACKGROUNDS — RETRO & TECH (10)
   * ========================================================================= */
  {
    id: "retro-grid-sun",
    name: "Retro Grid Sun",
    category: "backgrounds",
    description:
      "80s retro grid floor with vanishing-point perspective lines, layered pink/cyan gradient sky, and glowing sun disc",
    tags: ["retro", "grid", "80s", "synthwave"],
    previewType: "background",
    cssCode: `/* Retro Grid Sun */
.roycss-retro-grid-sun {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.186 0.081 301.44) 0%, oklch(0.312 0.134 316.76) 30%, oklch(0.506 0.196 352.2) 55%, oklch(0.676 0.232 0.48) 70%, oklch(0.805 0.144 64.53) 82%, oklch(0.233 0.097 307.34) 100%);
}
.roycss-retro-grid-sun::before {
  content: "";
  position: absolute;
  inset-block-start: 18%;
  inset-inline-start: 50%;
  inline-size: 140px;
  block-size: 140px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: linear-gradient(to bottom, oklch(0.907 0.17 97.66) 0%, oklch(0.689 0.206 39.23) 50%, oklch(0.526 0.205 2.6) 100%);
  box-shadow: 0 0 60px color-mix(in oklch, oklch(0.723 0.18 42.59) 70%, transparent);
  background-image:
    linear-gradient(to bottom, transparent 0%, transparent 45%, oklch(0.186 0.081 301.44) 45%, oklch(0.186 0.081 301.44) 50%, transparent 50%, transparent 60%, oklch(0.186 0.081 301.44) 60%, oklch(0.186 0.081 301.44) 65%, transparent 65%, transparent 75%, oklch(0.186 0.081 301.44) 75%, oklch(0.186 0.081 301.44) 80%, transparent 80%);
}
.roycss-retro-grid-sun::after {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 50%;
  background:
    linear-gradient(to bottom, transparent 0%, oklch(0.186 0.081 301.44) 30%, oklch(0.127 0.053 299.49) 100%),
    repeating-linear-gradient(90deg, color-mix(in oklch, oklch(0.694 0.261 342.23) 50%, transparent) 0, color-mix(in oklch, oklch(0.694 0.261 342.23) 50%, transparent) 1px, transparent 1px, transparent 32px),
    repeating-linear-gradient(0deg, color-mix(in oklch, oklch(0.694 0.261 342.23) 50%, transparent) 0, color-mix(in oklch, oklch(0.694 0.261 342.23) 50%, transparent) 1px, transparent 1px, transparent 24px);
  transform: perspective(280px) rotateX(60deg);
  transform-origin: bottom;
}`
  },
  {
    id: "retro-synthwave",
    name: "Retro Synthwave Sunset",
    category: "backgrounds",
    description:
      "Synthwave neon sunset with horizontal scanline sun, distant mountain silhouette, and animated grid floor",
    tags: ["retro", "synthwave", "neon", "sunset"],
    previewType: "background",
    cssCode: `/* Retro Synthwave Sunset */
.roycss-retro-synthwave {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, oklch(0.231 0.1 307.81) 0%, oklch(0.399 0.167 317.69) 30%, oklch(0.661 0.241 4.49) 55%, oklch(0.692 0.2 33.25) 70%, oklch(0.312 0.141 314.93) 100%);
}
.roycss-retro-synthwave::before {
  content: "";
  position: absolute;
  inset-block-start: 20%;
  inset-inline-start: 50%;
  inline-size: 120px;
  block-size: 120px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: linear-gradient(to bottom, oklch(0.909 0.149 95.64) 0%, oklch(0.711 0.201 358.6) 60%, oklch(0.559 0.226 338.31) 100%);
  box-shadow: 0 0 50px color-mix(in oklch, oklch(0.702 0.229 349.48) 70%, transparent);
  background-image:
    linear-gradient(to bottom, transparent 0%, transparent 35%, oklch(0.231 0.1 307.81) 35%, oklch(0.231 0.1 307.81) 38%, transparent 38%, transparent 48%, oklch(0.231 0.1 307.81) 48%, oklch(0.231 0.1 307.81) 52%, transparent 52%, transparent 62%, oklch(0.231 0.1 307.81) 62%, oklch(0.231 0.1 307.81) 67%, transparent 67%, transparent 78%, oklch(0.231 0.1 307.81) 78%, oklch(0.231 0.1 307.81) 84%, transparent 84%);
}
.roycss-retro-synthwave::after {
  content: "";
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 45%;
  background:
    linear-gradient(to bottom, transparent 0%, oklch(0.176 0.073 309.31) 40%, oklch(0.094 0.05 301.85) 100%),
    repeating-linear-gradient(90deg, color-mix(in oklch, oklch(0.87 0.148 202.88) 60%, transparent) 0, color-mix(in oklch, oklch(0.87 0.148 202.88) 60%, transparent) 1px, transparent 1px, transparent 28px),
    repeating-linear-gradient(0deg, color-mix(in oklch, oklch(0.694 0.261 342.23) 60%, transparent) 0, color-mix(in oklch, oklch(0.694 0.261 342.23) 60%, transparent) 1px, transparent 1px, transparent 22px);
  transform: perspective(260px) rotateX(62deg);
  transform-origin: bottom;
  animation: roy-b15-synth-grid 1.4s linear infinite;
}
@keyframes roy-b15-synth-grid {
  0% { background-position: 0 0, 0 0, 0 0; }
  100% { background-position: 0 0, 0 0, 0 22px; }
}`
  },
  {
    id: "retro-pixel-sky",
    name: "Retro Pixel Sky",
    category: "backgrounds",
    description:
      "8-bit pixel art sky with blocky clouds, pixelated sun, and stepped color bands evoking NES-era backgrounds",
    tags: ["retro", "pixel", "8bit", "sky"],
    previewType: "background",
    cssCode: `/* Retro Pixel Sky */
.roycss-retro-pixel-sky {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom,
      oklch(0.602 0.161 262.57) 0%, oklch(0.602 0.161 262.57) 18%,
      oklch(0.654 0.145 261.95) 18%, oklch(0.654 0.145 261.95) 38%,
      oklch(0.733 0.113 262.59) 38%, oklch(0.733 0.113 262.59) 60%,
      oklch(0.83 0.069 262.9) 60%, oklch(0.83 0.069 262.9) 78%,
      oklch(0.917 0.033 262.69) 78%, oklch(0.917 0.033 262.69) 100%);
  image-rendering: pixelated;
}
.roycss-retro-pixel-sky::before {
  content: "";
  position: absolute;
  inset-block-start: 8%;
  inset-inline-end: 12%;
  inline-size: 50px;
  block-size: 50px;
  background: oklch(0.965 0.109 104.33);
  box-shadow:
    -8px 0 0 oklch(0.965 0.109 104.33), 8px 0 0 oklch(0.965 0.109 104.33),
    0 -8px 0 oklch(0.965 0.109 104.33), 0 8px 0 oklch(0.965 0.109 104.33),
    -8px -8px 0 oklch(0.965 0.109 104.33), 8px -8px 0 oklch(0.965 0.109 104.33),
    -8px 8px 0 oklch(0.965 0.109 104.33), 8px 8px 0 oklch(0.965 0.109 104.33),
    -16px 0 0 oklch(0.965 0.109 104.33), 16px 0 0 oklch(0.965 0.109 104.33),
    0 -16px 0 oklch(0.965 0.109 104.33), 0 16px 0 oklch(0.965 0.109 104.33),
    -24px 0 0 oklch(0.965 0.109 104.33), 24px 0 0 oklch(0.965 0.109 104.33),
    -16px 16px 0 oklch(0.909 0.149 95.64), 16px 16px 0 oklch(0.909 0.149 95.64),
    -24px 16px 0 oklch(0.909 0.149 95.64), 24px 16px 0 oklch(0.909 0.149 95.64),
    -32px 16px 0 oklch(0.909 0.149 95.64), 32px 16px 0 oklch(0.909 0.149 95.64);
}
.roycss-retro-pixel-sky::after {
  content: "";
  position: absolute;
  inset-block-start: 28%;
  inset-inline-start: 12%;
  inline-size: 16px;
  block-size: 16px;
  background: oklch(1 0 89.88);
  box-shadow:
    16px 0 0 oklch(1 0 89.88), 32px 0 0 oklch(1 0 89.88),
    -16px 0 0 oklch(1 0 89.88), 48px 0 0 oklch(1 0 89.88),
    0 16px 0 oklch(1 0 89.88), 16px 16px 0 oklch(1 0 89.88), 32px 16px 0 oklch(1 0 89.88),
    200px -8px 0 oklch(1 0 89.88), 216px -8px 0 oklch(1 0 89.88), 232px -8px 0 oklch(1 0 89.88),
    208px 8px 0 oklch(1 0 89.88), 224px 8px 0 oklch(1 0 89.88), 240px 8px 0 oklch(1 0 89.88), 256px 8px 0 oklch(1 0 89.88);
}`
  },
  {
    id: "retro-terminal",
    name: "Retro Terminal CRT",
    category: "backgrounds",
    description:
      "Green phosphor CRT terminal screen with scanlines, vignette, faint flicker, and a glowing prompt cursor",
    tags: ["retro", "terminal", "crt", "green"],
    previewType: "background",
    cssCode: `/* Retro Terminal CRT */
.roycss-retro-terminal {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: radial-gradient(ellipse at center, oklch(0.191 0.05 152.04) 0%, oklch(0.116 0.04 142.5) 75%, oklch(0.073 0.025 142.5) 100%);
  font-family: "Courier New", monospace;
}
.roycss-retro-terminal::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent 0, transparent 2px, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 2px, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 4px),
    radial-gradient(ellipse at center, transparent 40%, color-mix(in oklch, oklch(0 0 0) 70%, transparent) 100%);
  pointer-events: none;
  animation: roy-b15-term-flicker 0.15s steps(2) infinite;
}
.roycss-retro-terminal::after {
  content: "> _";
  position: absolute;
  inset-block-start: 14px;
  inset-inline-start: 16px;
  color: oklch(0.872 0.255 147.64);
  font-size: 14px;
  text-shadow: 0 0 6px color-mix(in oklch, oklch(0.872 0.256 147.41) 90%, transparent), 0 0 12px color-mix(in oklch, oklch(0.872 0.256 147.41) 50%, transparent);
  animation: roy-b15-term-cursor 1s steps(2) infinite;
}
@keyframes roy-b15-term-flicker {
  0% { opacity: 1; }
  100% { opacity: 0.96; }
}
@keyframes roy-b15-term-cursor {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.4; }
}`
  },
  {
    id: "retro-cassette",
    name: "Retro Cassette Tape",
    category: "backgrounds",
    description:
      "Cassette tape pattern with two spinning reels, label window, and tan plastic body evoking the mixtape era",
    tags: ["retro", "cassette", "tape", "80s"],
    previewType: "background",
    cssCode: `/* Retro Cassette Tape */
.roycss-retro-cassette {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, oklch(0.234 0.039 67.22) 0%, oklch(0.335 0.053 62.08) 50%, oklch(0.234 0.039 67.22) 100%);
}
.roycss-retro-cassette::before {
  content: "";
  position: absolute;
  inset-block-start: 20%;
  inset-inline-start: 10%;
  inset-inline-end: 10%;
  block-size: 55%;
  background: linear-gradient(to bottom, oklch(0.796 0.09 83.94) 0%, oklch(0.676 0.102 80.27) 50%, oklch(0.531 0.091 75.75) 100%);
  border-radius: 8px;
  box-shadow: 0 4px 12px color-mix(in oklch, oklch(0 0 0) 60%, transparent), inset 0 2px 0 color-mix(in oklch, oklch(0.933 0.07 84.43) 40%, transparent), inset 0 -2px 0 color-mix(in oklch, oklch(0 0 0) 40%, transparent);
}
.roycss-retro-cassette::after {
  content: "";
  position: absolute;
  inset-block-start: 30%;
  inset-inline-start: 50%;
  inline-size: 30px;
  block-size: 30px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.184 0.023 59.82) 25%, oklch(0.335 0.053 62.08) 30%, oklch(0.229 0.039 60.62) 60%);
  border: 2px solid oklch(0.229 0.039 60.62);
  box-shadow:
    -90px 0 0 -2px oklch(0.184 0.023 59.82),
    -90px 0 0 0 oklch(0.335 0.053 62.08),
    -90px 0 0 2px oklch(0.229 0.039 60.62);
  animation: roy-b15-cassette-spin 4s linear infinite;
}
@keyframes roy-b15-cassette-spin {
  0% { transform: translateX(-50%) rotate(0deg); }
  100% { transform: translateX(-50%) rotate(360deg); }
}`
  },
  {
    id: "retro-arcade",
    name: "Retro Arcade Screen",
    category: "backgrounds",
    description:
      "Arcade machine CRT screen with neon space invader silhouette, starfield dots, and heavy scanline overlay",
    tags: ["retro", "arcade", "space", "neon"],
    previewType: "background",
    cssCode: `/* Retro Arcade Screen */
.roycss-retro-arcade {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: radial-gradient(ellipse at center, oklch(0.153 0.091 281.56) 0%, oklch(0.078 0.054 264.05) 80%);
}
.roycss-retro-arcade::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(2px 2px at 20% 30%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 60% 20%, oklch(0.748 0.129 266.73), transparent),
    radial-gradient(2px 2px at 80% 60%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 30% 70%, oklch(0.813 0.111 42.56), transparent),
    radial-gradient(1px 1px at 50% 50%, oklch(0.919 0.174 137.37), transparent),
    radial-gradient(2px 2px at 75% 30%, oklch(1 0 89.88), transparent),
    radial-gradient(1px 1px at 15% 80%, oklch(0.931 0.108 195.46), transparent),
    radial-gradient(1px 1px at 90% 85%, oklch(1 0 89.88), transparent);
  background-size: 100% 100%;
}
.roycss-retro-arcade::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent 0, transparent 3px, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 3px, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 4px),
    radial-gradient(ellipse at center, transparent 50%, color-mix(in oklch, oklch(0 0 0) 80%, transparent) 100%);
  pointer-events: none;
}`
  },
  {
    id: "tech-circuit-board",
    name: "Tech Circuit Board",
    category: "backgrounds",
    description:
      "PCB circuit board with green substrate, golden copper traces, solder pads, and pulsing electrical signal dots",
    tags: ["tech", "circuit", "pcb", "electronics"],
    previewType: "background",
    cssCode: `/* Tech Circuit Board */
.roycss-tech-circuit-board {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 40%, color-mix(in oklch, oklch(0.847 0.114 130.13) 15%, transparent) 0%, transparent 12%),
    radial-gradient(circle at 70% 70%, color-mix(in oklch, oklch(0.847 0.114 130.13) 15%, transparent) 0%, transparent 14%),
    repeating-linear-gradient(90deg, transparent 0, transparent 24px, color-mix(in oklch, oklch(0.663 0.109 82.12) 40%, transparent) 24px, color-mix(in oklch, oklch(0.663 0.109 82.12) 40%, transparent) 26px, transparent 26px, transparent 60px),
    repeating-linear-gradient(0deg, transparent 0, transparent 24px, color-mix(in oklch, oklch(0.663 0.109 82.12) 40%, transparent) 24px, color-mix(in oklch, oklch(0.663 0.109 82.12) 40%, transparent) 26px, transparent 26px, transparent 60px),
    linear-gradient(135deg, oklch(0.308 0.078 148.82) 0%, oklch(0.327 0.087 148) 50%, oklch(0.245 0.059 149.6) 100%);
}
.roycss-tech-circuit-board::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 24px 24px, oklch(0.737 0.127 79.61) 0, oklch(0.737 0.127 79.61) 2px, transparent 2px),
    radial-gradient(circle at 84px 84px, oklch(0.737 0.127 79.61) 0, oklch(0.737 0.127 79.61) 2px, transparent 2px),
    radial-gradient(circle at 144px 24px, oklch(0.737 0.127 79.61) 0, oklch(0.737 0.127 79.61) 2px, transparent 2px);
  background-size: 180px 180px;
  opacity: 0.8;
}
.roycss-tech-circuit-board::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 40%, oklch(0.875 0.234 151.18) 0, oklch(0.875 0.234 151.18) 2px, transparent 2px),
    radial-gradient(circle at 70% 70%, oklch(0.875 0.234 151.18) 0, oklch(0.875 0.234 151.18) 2px, transparent 2px);
  background-size: 180px 180px;
  filter: drop-shadow(0 0 4px color-mix(in oklch, oklch(0.874 0.241 149.96) 90%, transparent));
  animation: roy-b15-circuit-pulse 1.8s ease-in-out infinite;
}
@keyframes roy-b15-circuit-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}`
  },
  {
    id: "tech-matrix-code",
    name: "Tech Matrix Code Rain",
    category: "backgrounds",
    description:
      "Matrix digital rain with cascading green katakana-style glyphs falling at varying speeds and brightness levels",
    tags: ["tech", "matrix", "code", "rain"],
    previewType: "background",
    cssCode: `/* Tech Matrix Code Rain */
.roycss-tech-matrix-code {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: oklch(0 0 0);
}
.roycss-tech-matrix-code::before {
  content: "";
  position: absolute;
  inset: -20%;
  background:
    repeating-linear-gradient(0deg,
      color-mix(in oklch, oklch(0.868 0.28 144.17) 90%, transparent) 0, color-mix(in oklch, oklch(0.868 0.28 144.17) 90%, transparent) 12px,
      color-mix(in oklch, oklch(0.723 0.231 144.56) 70%, transparent) 12px, color-mix(in oklch, oklch(0.723 0.231 144.56) 70%, transparent) 24px,
      color-mix(in oklch, oklch(0.556 0.178 144.34) 50%, transparent) 24px, color-mix(in oklch, oklch(0.556 0.178 144.34) 50%, transparent) 36px,
      color-mix(in oklch, oklch(0.375 0.115 145.8) 30%, transparent) 36px, color-mix(in oklch, oklch(0.375 0.115 145.8) 30%, transparent) 48px,
      transparent 48px, transparent 80px);
  background-size: 22px 100%;
  filter: blur(0.6px) drop-shadow(0 0 4px color-mix(in oklch, oklch(0.87 0.269 145.52) 60%, transparent));
  animation: roy-b15-matrix-rain 1.6s linear infinite;
}
.roycss-tech-matrix-code::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, transparent 30%, color-mix(in oklch, oklch(0 0 0) 80%, transparent) 100%),
    repeating-linear-gradient(0deg, transparent 0, transparent 2px, color-mix(in oklch, oklch(0 0 0) 35%, transparent) 2px, color-mix(in oklch, oklch(0 0 0) 35%, transparent) 3px);
}
@keyframes roy-b15-matrix-rain {
  0% { background-position: 0 0; }
  100% { background-position: 0 80px; }
}`
  },
  {
    id: "tech-hologram-grid",
    name: "Tech Hologram Grid",
    category: "backgrounds",
    description:
      "Sci-fi cyan hologram projection grid with curved surface, glowing scanlines, and faint data column shimmer",
    tags: ["tech", "hologram", "grid", "scifi"],
    previewType: "background",
    cssCode: `/* Tech Hologram Grid */
.roycss-tech-hologram-grid {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse at center, color-mix(in oklch, oklch(0.761 0.131 207.5) 18%, transparent) 0%, color-mix(in oklch, oklch(0.4 0.074 222.02) 40%, transparent) 50%, color-mix(in oklch, oklch(0.187 0.05 247.94) 90%, transparent) 100%);
}
.roycss-tech-hologram-grid::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(90deg, color-mix(in oklch, oklch(0.87 0.148 202.88) 40%, transparent) 0, color-mix(in oklch, oklch(0.87 0.148 202.88) 40%, transparent) 1px, transparent 1px, transparent 24px),
    repeating-linear-gradient(0deg, color-mix(in oklch, oklch(0.87 0.148 202.88) 40%, transparent) 0, color-mix(in oklch, oklch(0.87 0.148 202.88) 40%, transparent) 1px, transparent 1px, transparent 24px);
  transform: perspective(400px) rotateX(50deg);
  transform-origin: center bottom;
  mask-image: linear-gradient(to bottom, transparent 0%, color-mix(in oklch, oklch(0 0 0) 90%, transparent) 40%, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, color-mix(in oklch, oklch(0 0 0) 90%, transparent) 40%, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 100%);
}
.roycss-tech-hologram-grid::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent 0, transparent 3px, color-mix(in oklch, oklch(0.87 0.148 202.88) 8%, transparent) 3px, color-mix(in oklch, oklch(0.87 0.148 202.88) 8%, transparent) 4px);
  animation: roy-b15-hologram-scan 4s linear infinite;
}
@keyframes roy-b15-hologram-scan {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}`
  },
  {
    id: "tech-scan-radar",
    name: "Tech Scan Radar",
    category: "backgrounds",
    description:
      "Radar scope display with concentric range rings, crosshair axes, sweeping green beam, and persistent target blips",
    tags: ["tech", "radar", "scan", "military"],
    previewType: "background",
    cssCode: `/* Tech Scan Radar */
.roycss-tech-scan-radar {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  background: radial-gradient(circle, oklch(0.22 0.042 150.52) 0%, oklch(0.136 0.016 144.61) 80%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-tech-scan-radar::before {
  content: "";
  position: absolute;
  inline-size: 86%;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle, transparent 0%, transparent 24%, color-mix(in oklch, oklch(0.736 0.184 148.81) 30%, transparent) 24%, color-mix(in oklch, oklch(0.736 0.184 148.81) 30%, transparent) 25%, transparent 25%),
    radial-gradient(circle, transparent 0%, transparent 49%, color-mix(in oklch, oklch(0.736 0.184 148.81) 30%, transparent) 49%, color-mix(in oklch, oklch(0.736 0.184 148.81) 30%, transparent) 50%, transparent 50%),
    radial-gradient(circle, transparent 0%, transparent 74%, color-mix(in oklch, oklch(0.736 0.184 148.81) 30%, transparent) 74%, color-mix(in oklch, oklch(0.736 0.184 148.81) 30%, transparent) 75%, transparent 75%),
    linear-gradient(0deg, transparent 49.5%, color-mix(in oklch, oklch(0.736 0.184 148.81) 40%, transparent) 49.5%, color-mix(in oklch, oklch(0.736 0.184 148.81) 40%, transparent) 50.5%, transparent 50.5%),
    linear-gradient(90deg, transparent 49.5%, color-mix(in oklch, oklch(0.736 0.184 148.81) 40%, transparent) 49.5%, color-mix(in oklch, oklch(0.736 0.184 148.81) 40%, transparent) 50.5%, transparent 50.5%);
  border: 2px solid color-mix(in oklch, oklch(0.736 0.184 148.81) 60%, transparent);
  box-shadow: 0 0 24px color-mix(in oklch, oklch(0.736 0.184 148.81) 30%, transparent), inset 0 0 30px color-mix(in oklch, oklch(0.311 0.089 148.55) 60%, transparent);
}
.roycss-tech-scan-radar::after {
  content: "";
  position: absolute;
  inline-size: 86%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(from 0deg, color-mix(in oklch, oklch(0.883 0.228 147.32) 70%, transparent) 0deg, color-mix(in oklch, oklch(0.883 0.228 147.32) 20%, transparent) 40deg, transparent 70deg, transparent 360deg);
  animation: roy-b15-radar-sweep 3.2s linear infinite;
}
@keyframes roy-b15-radar-sweep {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`
  },

  /* =========================================================================
   * ANIMATIONS — GAME & RETRO MOTION (10)
   * ========================================================================= */
  {
    id: "game-pixel-walk",
    name: "Game Pixel Walk",
    category: "animations",
    description:
      "Blocky pixel-art character walking cycle with bouncing body, swinging arms and legs rendered via box-shadows",
    tags: ["game", "pixel", "walk", "animation"],
    previewType: "box",
    cssCode: `/* Game Pixel Walk */
.roycss-game-pixel-walk {
  inline-size: 16px;
  block-size: 24px;
  position: relative;
  background: oklch(0.651 0.186 261.28);
  box-shadow:
    /* head */
    -4px -10px 0 oklch(0.651 0.186 261.28), 4px -10px 0 oklch(0.651 0.186 261.28),
    0 -14px 0 oklch(0.651 0.186 261.28),
    /* arms */
    -8px -2px 0 oklch(0.651 0.186 261.28), 8px -2px 0 oklch(0.651 0.186 261.28),
    /* legs */
    -4px 8px 0 oklch(0.405 0.118 265.66), 4px 8px 0 oklch(0.405 0.118 265.66);
  animation: roy-b15-walk-bounce 0.4s ease-in-out infinite;
}
.roycss-game-pixel-walk::before {
  content: "";
  position: absolute;
  inset-block-end: -10px;
  inset-inline-start: -16px;
  inset-inline-end: -16px;
  block-size: 4px;
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 0%, transparent 70%);
  animation: roy-b15-walk-shadow 0.4s ease-in-out infinite;
}
@keyframes roy-b15-walk-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes roy-b15-walk-shadow {
  0%, 100% { transform: scaleX(1); opacity: 0.5; }
  50% { transform: scaleX(0.85); opacity: 0.3; }
}`
  },
  {
    id: "game-mario-jump",
    name: "Game Mario Jump",
    category: "animations",
    description:
      "Platformer jump arc with squash on takeoff, stretched body mid-air, and squash landing impact with dust puff",
    tags: ["game", "mario", "jump", "platformer"],
    previewType: "box",
    cssCode: `/* Game Mario Jump */
.roycss-game-mario-jump {
  inline-size: 40px;
  block-size: 40px;
  position: relative;
  background: radial-gradient(circle at 35% 30%, oklch(0.739 0.162 35.25) 0%, oklch(0.604 0.202 33.04) 60%, oklch(0.46 0.166 30.86) 100%);
  border-radius: 8px;
  box-shadow: inset 0 2px 0 color-mix(in oklch, oklch(0.876 0.069 40.91) 50%, transparent), inset 0 -4px 6px color-mix(in oklch, oklch(0.28 0.103 33.11) 60%, transparent);
  animation: roy-b15-mario-jump 1.2s cubic-bezier(0.3, 0, 0.4, 1) infinite;
}
.roycss-game-mario-jump::before {
  content: "";
  position: absolute;
  inset-block-end: -10px;
  inset-inline-start: -10px;
  inset-inline-end: -10px;
  block-size: 6px;
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 0%, transparent 70%);
  animation: roy-b15-mario-shadow 1.2s cubic-bezier(0.3, 0, 0.4, 1) infinite;
}
@keyframes roy-b15-mario-jump {
  0% { transform: translateY(0) scale(1, 1); }
  10% { transform: translateY(0) scale(1.15, 0.75); }
  20% { transform: translateY(-40px) scale(0.85, 1.2); }
  50% { transform: translateY(-80px) scale(0.9, 1.1); }
  75% { transform: translateY(-40px) scale(0.85, 1.2); }
  90% { transform: translateY(0) scale(1.2, 0.7); }
  100% { transform: translateY(0) scale(1, 1); }
}
@keyframes roy-b15-mario-shadow {
  0%, 100% { transform: scaleX(1); opacity: 0.5; }
  50% { transform: scaleX(0.4); opacity: 0.2; }
}`
  },
  {
    id: "game-enemy-bob",
    name: "Game Enemy Bob",
    category: "animations",
    description:
      "Classic RPG slime enemy bobbing up and down with squish deformation and wobbling eyes",
    tags: ["game", "enemy", "slime", "bob"],
    previewType: "box",
    cssCode: `/* Game Enemy Bob */
.roycss-game-enemy-bob {
  inline-size: 60px;
  block-size: 50px;
  position: relative;
  background: radial-gradient(ellipse at 50% 30%, oklch(0.899 0.202 143.66) 0%, oklch(0.712 0.201 143.09) 50%, oklch(0.526 0.158 142.92) 100%);
  border-radius: 50% 50% 12px 12px / 70% 70% 12px 12px;
  box-shadow: inset 0 4px 0 color-mix(in oklch, oklch(1 0 89.88) 40%, transparent), inset 0 -8px 12px color-mix(in oklch, oklch(0.309 0.105 142.5) 60%, transparent), 0 0 14px color-mix(in oklch, oklch(0.79 0.217 143.17) 50%, transparent);
  animation: roy-b15-enemy-bob 1.6s ease-in-out infinite;
}
.roycss-game-enemy-bob::before {
  content: "";
  position: absolute;
  inset-block-start: 35%;
  inset-inline-start: 25%;
  inline-size: 8px;
  block-size: 8px;
  background: oklch(0 0 0);
  border-radius: 50%;
  box-shadow: 22px 0 0 oklch(0 0 0), 1px -1px 0 1px oklch(1 0 89.88), 23px -1px 0 1px oklch(1 0 89.88);
}
.roycss-game-enemy-bob::after {
  content: "";
  position: absolute;
  inset-block-end: -6px;
  inset-inline-start: -8px;
  inset-inline-end: -8px;
  block-size: 6px;
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 0%, transparent 70%);
}
@keyframes roy-b15-enemy-bob {
  0%, 100% { transform: translateY(0) scaleY(1) scaleX(1); }
  25% { transform: translateY(-6px) scaleY(1.08) scaleX(0.95); }
  50% { transform: translateY(0) scaleY(0.92) scaleX(1.06); }
  75% { transform: translateY(-6px) scaleY(1.08) scaleX(0.95); }
}`
  },
  {
    id: "game-projectile",
    name: "Game Projectile",
    category: "animations",
    description:
      "Magic fireball projectile flying horizontally with trailing tail particles and pulsing glow",
    tags: ["game", "projectile", "fireball", "magic"],
    previewType: "box",
    cssCode: `/* Game Projectile */
.roycss-game-projectile {
  inline-size: 24px;
  block-size: 24px;
  position: relative;
  background: radial-gradient(circle at 60% 40%, oklch(0.975 0.149 108.88) 0%, oklch(0.733 0.182 50.75) 40%, oklch(0.52 0.197 32.02) 80%, oklch(0.233 0.096 29.23) 100%);
  border-radius: 50%;
  box-shadow: 0 0 14px color-mix(in oklch, oklch(0.721 0.187 47.68) 90%, transparent), 0 0 28px color-mix(in oklch, oklch(0.653 0.235 33.88) 60%, transparent);
  animation: roy-b15-projectile-fly 1.6s ease-in-out infinite;
}
.roycss-game-projectile::before {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: 50%;
  inline-size: 50px;
  block-size: 4px;
  transform: translateY(-50%);
  background: linear-gradient(to left, color-mix(in oklch, oklch(0.822 0.154 74.42) 90%, transparent) 0%, color-mix(in oklch, oklch(0.671 0.221 37.64) 60%, transparent) 40%, transparent 100%);
  border-radius: 4px;
  filter: blur(1px);
}
.roycss-game-projectile::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: 60%;
  inline-size: 6px;
  block-size: 6px;
  transform: translateY(-50%);
  background: oklch(0.913 0.121 91.98);
  border-radius: 50%;
  box-shadow: -8px 2px 0 -1px color-mix(in oklch, oklch(0.785 0.165 65.58) 70%, transparent), -16px -2px 0 -2px color-mix(in oklch, oklch(0.693 0.206 42.88) 50%, transparent), -24px 4px 0 -3px color-mix(in oklch, oklch(0.653 0.235 33.88) 30%, transparent);
}
@keyframes roy-b15-projectile-fly {
  0% { transform: translateX(-60px) scale(0.9); }
  50% { transform: translateX(60px) scale(1.05); }
  100% { transform: translateX(-60px) scale(0.9); }
}`
  },
  {
    id: "game-explosion",
    name: "Game Explosion",
    category: "animations",
    description:
      "Pixel-art explosion burst with expanding rings, scattering debris particles, and bright flash core",
    tags: ["game", "explosion", "burst", "pixel"],
    previewType: "box",
    cssCode: `/* Game Explosion */
.roycss-game-explosion {
  inline-size: 50px;
  block-size: 50px;
  position: relative;
}
.roycss-game-explosion::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, oklch(1 0 89.88) 0%, oklch(0.907 0.17 97.66) 25%, oklch(0.689 0.206 39.23) 55%, oklch(0.512 0.204 30.22) 80%, transparent 100%);
  border-radius: 50%;
  box-shadow: 0 0 20px color-mix(in oklch, oklch(0.721 0.187 47.68) 90%, transparent), 0 0 40px color-mix(in oklch, oklch(0.653 0.235 33.88) 60%, transparent);
  animation: roy-b15-explosion-core 1s ease-out infinite;
}
.roycss-game-explosion::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 8px;
  block-size: 8px;
  transform: translate(-50%, -50%);
  background: transparent;
  border-radius: 50%;
  box-shadow:
    -28px -18px 0 -2px oklch(0.733 0.182 50.75),
    28px -18px 0 -2px oklch(0.733 0.182 50.75),
    -28px 18px 0 -2px oklch(0.733 0.182 50.75),
    28px 18px 0 -2px oklch(0.733 0.182 50.75),
    -34px 0 0 -3px oklch(0.549 0.174 39.51),
    34px 0 0 -3px oklch(0.549 0.174 39.51),
    0 -30px 0 -2px oklch(0.689 0.206 39.23),
    0 30px 0 -2px oklch(0.689 0.206 39.23);
  animation: roy-b15-explosion-debris 1s ease-out infinite;
}
@keyframes roy-b15-explosion-core {
  0% { transform: scale(0.3); opacity: 1; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes roy-b15-explosion-debris {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
}`
  },
  {
    id: "game-level-up",
    name: "Game Level Up",
    category: "animations",
    description:
      "Level up shine burst with expanding golden rings, rising star particles, and pulsing central glow",
    tags: ["game", "level-up", "shine", "celebration"],
    previewType: "box",
    cssCode: `/* Game Level Up */
.roycss-game-level-up {
  inline-size: 60px;
  block-size: 60px;
  position: relative;
}
.roycss-game-level-up::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(1 0 89.88) 0%, oklch(0.913 0.121 91.98) 30%, oklch(0.813 0.165 75.04) 60%, transparent 100%);
  box-shadow: 0 0 30px color-mix(in oklch, oklch(0.9 0.157 94.82) 90%, transparent);
  animation: roy-b15-levelup-core 1.4s ease-out infinite;
}
.roycss-game-level-up::after {
  content: "";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 16px;
  block-size: 16px;
  transform: translate(-50%, -50%);
  border: 2px solid color-mix(in oklch, oklch(0.9 0.157 94.82) 80%, transparent);
  border-radius: 50%;
  box-shadow: 0 0 8px color-mix(in oklch, oklch(0.9 0.157 94.82) 60%, transparent);
  animation: roy-b15-levelup-ring 1.4s ease-out infinite;
}
@keyframes roy-b15-levelup-core {
  0% { transform: scale(0.4); opacity: 1; }
  40% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}
@keyframes roy-b15-levelup-ring {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; border-inline-size: 3px; }
  100% { transform: translate(-50%, -50%) scale(4); opacity: 0; border-inline-size: 1px; }
}`
  },
  {
    id: "game-screen-shake",
    name: "Game Screen Shake",
    category: "animations",
    description:
      "Screen shake impact effect with rapid multi-direction jitter, simulating hit feedback or explosion recoil",
    tags: ["game", "shake", "impact", "feedback"],
    previewType: "box",
    cssCode: `/* Game Screen Shake */
.roycss-game-screen-shake {
  inline-size: 100px;
  block-size: 70px;
  position: relative;
  background: linear-gradient(135deg, oklch(0.308 0.064 257.75) 0%, oklch(0.212 0.051 260.48) 100%);
  border: 2px solid oklch(0.53 0.066 244.92);
  border-radius: 4px;
  box-shadow: 0 0 0 1px oklch(0.144 0.024 260.16), 0 6px 14px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
  animation: roy-b15-screen-shake 0.4s linear infinite;
}
.roycss-game-screen-shake::before {
  content: "HIT!";
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
  color: oklch(0.66 0.227 26.03);
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 2px;
  text-shadow:
    -1px -1px 0 oklch(0 0 0), 1px -1px 0 oklch(0 0 0),
    -1px 1px 0 oklch(0 0 0), 1px 1px 0 oklch(0 0 0),
    0 0 8px color-mix(in oklch, oklch(0.656 0.23 26.33) 90%, transparent);
  animation: roy-b15-screen-flash 0.2s steps(2) infinite;
}
.roycss-game-screen-shake::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 4px;
  box-shadow: inset 0 0 14px color-mix(in oklch, oklch(0.656 0.23 26.33) 50%, transparent);
  animation: roy-b15-screen-glow 0.4s ease-in-out infinite;
}
@keyframes roy-b15-screen-shake {
  0% { transform: translate(0, 0); }
  20% { transform: translate(-3px, 2px); }
  40% { transform: translate(3px, -2px); }
  60% { transform: translate(-2px, -3px); }
  80% { transform: translate(2px, 3px); }
  100% { transform: translate(0, 0); }
}
@keyframes roy-b15-screen-flash {
  0% { opacity: 1; }
  100% { opacity: 0.5; }
}
@keyframes roy-b15-screen-glow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}`
  },
  {
    id: "game-loading-bar",
    name: "Game Loading Bar",
    category: "animations",
    description:
      "Retro loading bar with segmented amber blocks filling one-by-one, bouncing edge glow, and chunky pixel frame",
    tags: ["game", "loading", "retro", "progress"],
    previewType: "box",
    cssCode: `/* Game Loading Bar */
.roycss-game-loading-bar {
  inline-size: 160px;
  block-size: 22px;
  background: oklch(0.167 0.034 53.76);
  border: 3px solid oklch(0.413 0.084 64.27);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px color-mix(in oklch, oklch(0 0 0) 80%, transparent), 0 0 0 1px oklch(0.219 0.045 55.68);
}
.roycss-game-loading-bar::before {
  content: "";
  position: absolute;
  inset-block-start: 2px;
  inset-block-end: 2px;
  inset-inline-start: 2px;
  inline-size: 70%;
  background:
    repeating-linear-gradient(90deg, oklch(0.813 0.165 75.04) 0, oklch(0.813 0.165 75.04) 14px, oklch(0.571 0.132 57.4) 14px, oklch(0.571 0.132 57.4) 16px);
  border-radius: 2px;
  box-shadow: 0 0 8px color-mix(in oklch, oklch(0.821 0.163 76.61) 80%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(0.953 0.078 95.74) 70%, transparent);
  animation: roy-b15-loading-fill 2s ease-in-out infinite;
}
.roycss-game-loading-bar::after {
  content: "";
  position: absolute;
  inset-block-start: 2px;
  inset-block-end: 2px;
  inset-inline-end: 2px;
  inline-size: 4px;
  background: oklch(0.913 0.121 91.98);
  box-shadow: 0 0 10px color-mix(in oklch, oklch(0.944 0.142 102.24) 100%, transparent), 0 0 20px color-mix(in oklch, oklch(0.858 0.167 87.29) 70%, transparent);
  animation: roy-b15-loading-edge 2s ease-in-out infinite;
}
@keyframes roy-b15-loading-fill {
  0% { inline-size: 5%; }
  50% { inline-size: 75%; }
  100% { inline-size: 5%; }
}
@keyframes roy-b15-loading-edge {
  0% { inset-inline-end: 80%; opacity: 0.8; }
  50% { inset-inline-end: 8%; opacity: 1; }
  100% { inset-inline-end: 80%; opacity: 0.8; }
}`
  },
  {
    id: "game-cursor-blink",
    name: "Game Cursor Blink",
    category: "animations",
    description:
      "Retro text adventure cursor that blinks in classic 50% duty cycle, paired with prompt chevron",
    tags: ["game", "cursor", "blink", "retro"],
    previewType: "text",
    previewText: "> RoyCSS",
    cssCode: `/* Game Cursor Blink */
.roycss-game-cursor-blink {
  font-family: "Courier New", monospace;
  font-size: 22px;
  font-weight: 700;
  color: oklch(0.872 0.255 147.64);
  letter-spacing: 1px;
  text-shadow: 0 0 8px color-mix(in oklch, oklch(0.872 0.256 147.41) 80%, transparent), 0 0 14px color-mix(in oklch, oklch(0.872 0.256 147.41) 40%, transparent);
  position: relative;
  padding-inline-end: 14px;
}
.roycss-game-cursor-blink::after {
  content: "_";
  position: absolute;
  inset-inline-end: 0;
  inset-block-start: 50%;
  transform: translateY(-50%);
  color: oklch(0.872 0.255 147.64);
  text-shadow: 0 0 8px color-mix(in oklch, oklch(0.872 0.256 147.41) 90%, transparent);
  animation: roy-b15-cursor-blink 1s steps(2) infinite;
}
@keyframes roy-b15-cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}`
  },
  {
    id: "game-float-bobble",
    name: "Game Float Bobble",
    category: "animations",
    description:
      "RPG floating item bobble with slow vertical drift, subtle rotation sway, and pulsing drop shadow",
    tags: ["game", "float", "bobble", "rpg"],
    previewType: "box",
    cssCode: `/* Game Float Bobble */
.roycss-game-float-bobble {
  inline-size: 50px;
  block-size: 50px;
  position: relative;
  background: radial-gradient(circle at 35% 30%, oklch(0.904 0.173 149.93) 0%, oklch(0.716 0.176 148.21) 50%, oklch(0.53 0.131 149.95) 100%);
  border-radius: 50%;
  box-shadow: inset 0 4px 0 color-mix(in oklch, oklch(1 0 89.88) 40%, transparent), inset 0 -6px 10px color-mix(in oklch, oklch(0.309 0.105 142.5) 60%, transparent), 0 0 14px color-mix(in oklch, oklch(0.793 0.202 145.82) 60%, transparent);
  animation: roy-b15-float-bob 2.4s ease-in-out infinite;
}
.roycss-game-float-bobble::before {
  content: "";
  position: absolute;
  inset-block-start: 22%;
  inset-inline-start: 28%;
  inline-size: 12px;
  block-size: 12px;
  background: color-mix(in oklch, oklch(1 0 89.88) 70%, transparent);
  border-radius: 50%;
  filter: blur(1px);
}
.roycss-game-float-bobble::after {
  content: "";
  position: absolute;
  inset-block-end: -16px;
  inset-inline-start: -10px;
  inset-inline-end: -10px;
  block-size: 8px;
  background: radial-gradient(ellipse, color-mix(in oklch, oklch(0 0 0) 50%, transparent) 0%, transparent 70%);
  animation: roy-b15-float-shadow 2.4s ease-in-out infinite;
}
@keyframes roy-b15-float-bob {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50% { transform: translateY(-14px) rotate(4deg); }
}
@keyframes roy-b15-float-shadow {
  0%, 100% { transform: scaleX(1); opacity: 0.5; }
  50% { transform: scaleX(0.6); opacity: 0.25; }
}`
  },

  /* =========================================================================
   * TEXT — RETRO / GAME TYPOGRAPHY (8)
   * ========================================================================= */
  {
    id: "text-pixel-font",
    name: "Text Pixel Font",
    category: "text",
    description:
      "Pixelated blocky text with crisp edges, image-rendering pixelated, hard drop shadow, and 8-bit color palette",
    tags: ["text", "pixel", "8bit", "retro"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text Pixel Font */
.roycss-text-pixel-font {
  font-family: "Courier New", monospace;
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 4px;
  color: oklch(0.907 0.17 97.66);
  text-transform: uppercase;
  text-shadow:
    0 4px 0 oklch(0.65 0.135 73.03),
    0 6px 0 oklch(0.412 0.087 66.56),
    4px 8px 0 oklch(0 0 0),
    -2px -2px 0 oklch(0 0 0),
    2px -2px 0 oklch(0 0 0),
    -2px 2px 0 oklch(0 0 0),
    2px 2px 0 oklch(0 0 0);
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
  font-smooth: never;
  filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(0.858 0.167 87.29) 50%, transparent));
}`
  },
  {
    id: "text-arcade-neon",
    name: "Text Arcade Neon",
    category: "text",
    description:
      "Arcade neon sign lettering with glowing pink/cyan tube glow, multi-layer text shadow, and flicker animation",
    tags: ["text", "arcade", "neon", "sign"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text Arcade Neon */
.roycss-text-arcade-neon {
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 4px;
  color: oklch(1 0 89.88);
  text-transform: uppercase;
  text-shadow:
    0 0 4px oklch(1 0 89.88),
    0 0 10px oklch(0.693 0.253 344.73),
    0 0 20px oklch(0.693 0.253 344.73),
    0 0 36px oklch(0.648 0.257 2.81),
    0 0 60px oklch(0.533 0.223 349.29),
    0 0 80px oklch(0.402 0.172 342.9);
  animation: roy-b15-arcade-flicker 3s linear infinite;
}
@keyframes roy-b15-arcade-flicker {
  0%, 92%, 100% { opacity: 1; }
  93% { opacity: 0.6; }
  94% { opacity: 1; }
  95% { opacity: 0.4; }
  96% { opacity: 1; }
}`
  },
  {
    id: "text-terminal-green",
    name: "Text Terminal Green",
    category: "text",
    description:
      "Green phosphor terminal text with monospace font, scanline overlay, and CRT glow bloom",
    tags: ["text", "terminal", "green", "crt"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text Terminal Green */
.roycss-text-terminal-green {
  font-family: "Courier New", "Lucida Console", monospace;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 2px;
  color: oklch(0.872 0.255 147.64);
  text-shadow:
    0 0 4px oklch(0.872 0.255 147.64),
    0 0 8px oklch(0.736 0.224 146.14),
    0 0 16px color-mix(in oklch, oklch(0.87 0.269 145.52) 60%, transparent),
    0 0 26px color-mix(in oklch, oklch(0.724 0.225 145.45) 40%, transparent);
  position: relative;
  animation: roy-b15-term-green-flicker 4s linear infinite;
}
.roycss-text-terminal-green::after {
  content: "";
  position: absolute;
  inset: -4px -8px;
  background: repeating-linear-gradient(0deg, transparent 0, transparent 2px, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 2px, color-mix(in oklch, oklch(0 0 0) 40%, transparent) 3px);
  pointer-events: none;
  mix-blend-mode: multiply;
}
@keyframes roy-b15-term-green-flicker {
  0%, 96%, 100% { opacity: 1; }
  97% { opacity: 0.85; }
  98% { opacity: 1; }
}`
  },
  {
    id: "text-glitch-cyberpunk",
    name: "Text Glitch Cyberpunk",
    category: "text",
    description:
      "Cyberpunk glitch text with split RGB channels, horizontal slice displacement, and jagged digital distortion",
    tags: ["text", "glitch", "cyberpunk", "distort"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text Glitch Cyberpunk */
.roycss-text-glitch-cyberpunk {
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 3px;
  color: oklch(0.896 0.163 179.66);
  text-transform: uppercase;
  position: relative;
  text-shadow: 0 0 8px color-mix(in oklch, oklch(0.895 0.165 177.88) 60%, transparent);
}
.roycss-text-glitch-cyberpunk::before {
  content: attr(data-text);
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  color: oklch(0.645 0.26 2.47);
  text-shadow: 0 0 8px color-mix(in oklch, oklch(0.649 0.264 358.73) 60%, transparent);
  clip-path: polygon(0 0, 100% 0, 100% 30%, 0 30%);
  animation: roy-b15-glitch-top 2s steps(8) infinite;
}
.roycss-text-glitch-cyberpunk::after {
  content: attr(data-text);
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  color: oklch(0.905 0.188 99.07);
  text-shadow: 0 0 8px color-mix(in oklch, oklch(0.897 0.185 97.44) 60%, transparent);
  clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
  animation: roy-b15-glitch-bottom 1.7s steps(8) infinite;
}
@keyframes roy-b15-glitch-top {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-4px, -2px); }
  40% { transform: translate(3px, 1px); }
  60% { transform: translate(-2px, 0); }
  80% { transform: translate(2px, -1px); }
}
@keyframes roy-b15-glitch-bottom {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(3px, 2px); }
  50% { transform: translate(-3px, -1px); }
  75% { transform: translate(2px, 1px); }
}`
  },
  {
    id: "text-rpg-dialogue",
    name: "Text RPG Dialogue",
    category: "text",
    description:
      "RPG dialogue box text with bordered parchment style, indented speaker name, and slow typewriter reveal feel",
    tags: ["text", "rpg", "dialogue", "game"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text RPG Dialogue */
.roycss-text-rpg-dialogue {
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 22px;
  font-weight: 600;
  color: oklch(0.908 0.065 91.81);
  letter-spacing: 0.5px;
  padding: 14px 18px;
  background: linear-gradient(to bottom, color-mix(in oklch, oklch(0.296 0.044 64.71) 92%, transparent) 0%, color-mix(in oklch, oklch(0.226 0.035 60.76) 95%, transparent) 100%);
  border: 2px solid oklch(0.721 0.091 83.65);
  border-radius: 6px;
  box-shadow:
    inset 0 2px 0 color-mix(in oklch, oklch(0.907 0.106 86.69) 30%, transparent),
    inset 0 -2px 6px color-mix(in oklch, oklch(0 0 0) 60%, transparent),
    0 4px 0 oklch(0.333 0.059 68.61),
    0 6px 14px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
  text-shadow: 1px 1px 0 color-mix(in oklch, oklch(0 0 0) 80%, transparent);
  position: relative;
}
.roycss-text-rpg-dialogue::before {
  content: "▶";
  position: absolute;
  inset-block-end: 8px;
  inset-inline-end: 14px;
  color: oklch(0.913 0.121 91.98);
  font-size: 14px;
  animation: roy-b15-rpg-arrow 0.8s steps(2) infinite;
}
@keyframes roy-b15-rpg-arrow {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(3px); opacity: 0.5; }
}`
  },
  {
    id: "text-score-counter",
    name: "Text Score Counter",
    category: "text",
    description:
      "Arcade score counter with bold italic yellow numerals, dark hard outline, and subtle bounce increment feel",
    tags: ["text", "score", "arcade", "counter"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text Score Counter */
.roycss-text-score-counter {
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 42px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 3px;
  color: oklch(0.907 0.17 97.66);
  text-shadow:
    -2px 0 0 oklch(0 0 0),
    2px 0 0 oklch(0 0 0),
    0 -2px 0 oklch(0 0 0),
    0 2px 0 oklch(0 0 0),
    -2px -2px 0 oklch(0 0 0),
    2px -2px 0 oklch(0 0 0),
    -2px 2px 0 oklch(0 0 0),
    2px 2px 0 oklch(0 0 0),
    4px 4px 0 oklch(0.412 0.087 66.56),
    6px 6px 0 oklch(0.228 0.044 66.83),
    0 0 16px color-mix(in oklch, oklch(0.858 0.167 87.29) 70%, transparent);
  animation: roy-b15-score-bounce 1.4s ease-in-out infinite;
}
@keyframes roy-b15-score-bounce {
  0%, 90%, 100% { transform: translateY(0) scale(1); }
  93% { transform: translateY(-4px) scale(1.08); }
  96% { transform: translateY(0) scale(1); }
}`
  },
  {
    id: "text-8bit-shadow",
    name: "Text 8-bit Shadow",
    category: "text",
    description:
      "8-bit retro text with chunky layered hard shadow steps, no anti-aliasing, and pixel-art color palette",
    tags: ["text", "8bit", "shadow", "retro"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text 8-bit Shadow */
.roycss-text-8bit-shadow {
  font-family: "Courier New", monospace;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: oklch(1 0 89.88);
  text-shadow:
    3px 0 0 oklch(0.361 0.151 298.38),
    3px 3px 0 oklch(0.361 0.151 298.38),
    0 3px 0 oklch(0.361 0.151 298.38),
    6px 6px 0 oklch(0.256 0.109 296.34),
    6px 6px 0 oklch(0.256 0.109 296.34),
    9px 9px 0 oklch(0.16 0.071 293.12),
    9px 9px 0 oklch(0.16 0.071 293.12);
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
  font-smooth: never;
  filter: drop-shadow(0 0 8px color-mix(in oklch, oklch(0.551 0.203 291.46) 40%, transparent));
}`
  },
  {
    id: "text-hologram-scan",
    name: "Text Hologram Scan",
    category: "text",
    description:
      "Sci-fi hologram text with cyan glow, traveling scanline overlay, chromatic split, and flicker distortion",
    tags: ["text", "hologram", "scifi", "scan"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Text Hologram Scan */
.roycss-text-hologram-scan {
  font-family: "Orbitron", "Impact", sans-serif;
  font-size: 38px;
  font-weight: 800;
  letter-spacing: 4px;
  color: oklch(0.894 0.105 206.86);
  text-shadow:
    0 0 4px oklch(0.894 0.105 206.86),
    0 0 10px oklch(0.752 0.118 218.19),
    0 0 20px color-mix(in oklch, oklch(0.761 0.131 207.5) 60%, transparent),
    -1px 0 0 color-mix(in oklch, oklch(0.643 0.258 4.97) 50%, transparent),
    1px 0 0 color-mix(in oklch, oklch(0.889 0.177 169.75) 50%, transparent);
  position: relative;
  animation: roy-b15-holo-flicker 3s linear infinite;
}
.roycss-text-hologram-scan::before {
  content: "";
  position: absolute;
  inset: -4px -8px;
  background: repeating-linear-gradient(0deg, transparent 0, transparent 3px, color-mix(in oklch, oklch(0.87 0.148 202.88) 18%, transparent) 3px, color-mix(in oklch, oklch(0.87 0.148 202.88) 18%, transparent) 4px);
  pointer-events: none;
  animation: roy-b15-holo-scan 2s linear infinite;
  mix-blend-mode: screen;
}
.roycss-text-hologram-scan::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-inline-end: 0;
  block-size: 2px;
  background: color-mix(in oklch, oklch(0.895 0.165 177.88) 80%, transparent);
  box-shadow: 0 0 8px color-mix(in oklch, oklch(0.895 0.165 177.88) 90%, transparent);
  animation: roy-b15-holo-bar 1.6s linear infinite;
  pointer-events: none;
}
@keyframes roy-b15-holo-flicker {
  0%, 100% { opacity: 1; }
  90% { opacity: 1; }
  91% { opacity: 0.4; }
  92% { opacity: 1; }
  93% { opacity: 0.7; }
  94% { opacity: 1; }
}
@keyframes roy-b15-holo-scan {
  0% { background-position: 0 0; }
  100% { background-position: 0 4px; }
}
@keyframes roy-b15-holo-bar {
  0% { inset-block-start: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { inset-block-start: 100%; opacity: 0; }
}`
  }
];
