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
  width: 140px;
  height: 18px;
  background: #1a0303;
  border: 2px solid #5a0a0a;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 0 1px #2a0606, 0 4px 10px rgba(0, 0, 0, 0.5);
}
.roycss-game-health-bar::before {
  content: "";
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: 78%;
  background: linear-gradient(to bottom, #ff6464 0%, #e02020 45%, #a00808 100%);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(255, 40, 40, 0.8), inset 0 1px 0 rgba(255, 200, 200, 0.6), inset 0 -2px 4px rgba(80, 0, 0, 0.6);
  animation: roy-b15-health-pulse 1.6s ease-in-out infinite;
}
.roycss-game-health-bar::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0, transparent 13px, rgba(0, 0, 0, 0.45) 13px, rgba(0, 0, 0, 0.45) 15px);
  pointer-events: none;
}
@keyframes roy-b15-health-pulse {
  0%, 100% { width: 78%; filter: brightness(1); }
  45% { width: 70%; filter: brightness(1.25); }
  50% { width: 70%; filter: brightness(0.7); }
  55% { width: 70%; filter: brightness(1.3); }
  60% { width: 78%; filter: brightness(1); }
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
  width: 140px;
  height: 18px;
  background: #02101a;
  border: 2px solid #0a3a5a;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 0 1px #05202e, 0 4px 10px rgba(0, 0, 0, 0.5);
}
.roycss-game-mana-bar::before {
  content: "";
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: 85%;
  background: linear-gradient(to bottom, #5ad6ff 0%, #1e90ff 45%, #0a4a9c 100%);
  border-radius: 2px;
  box-shadow: 0 0 12px rgba(60, 180, 255, 0.85), inset 0 1px 0 rgba(200, 240, 255, 0.7), inset 0 -2px 4px rgba(0, 30, 80, 0.7);
}
.roycss-game-mana-bar::after {
  content: "";
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: 85%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%);
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
  width: 160px;
  height: 14px;
  background: #1a1404;
  border: 2px solid #6a4a10;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 210, 80, 0.2);
}
.roycss-game-exp-bar::before {
  content: "";
  position: absolute;
  top: 1px;
  bottom: 1px;
  left: 1px;
  width: 62%;
  background: linear-gradient(to bottom, #ffe680 0%, #ffb020 50%, #b06800 100%);
  border-radius: 6px;
  box-shadow: 0 0 10px rgba(255, 190, 60, 0.7), inset 0 1px 0 rgba(255, 250, 220, 0.8);
}
.roycss-game-exp-bar::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -40%;
  width: 40%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.85) 50%, transparent 100%);
  transform: skewX(-20deg);
  animation: roy-b15-exp-shine 2.6s ease-in-out infinite;
}
@keyframes roy-b15-exp-shine {
  0%, 100% { left: -40%; }
  50%, 60% { left: 100%; }
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
  width: 80px;
  height: 96px;
  position: relative;
  background: linear-gradient(135deg, #c0c8d8 0%, #6a7388 40%, #3a4458 70%, #1a2230 100%);
  clip-path: polygon(50% 0%, 100% 12%, 100% 55%, 50% 100%, 0% 55%, 0% 12%);
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.5), inset 0 -8px 14px rgba(0, 0, 0, 0.6);
  animation: roy-b15-shield-pulse 2.4s ease-in-out infinite;
}
.roycss-game-shield-icon::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, #4a90ff 0%, #1a4090 50%, #0a1e4a 100%);
  clip-path: polygon(50% 0%, 100% 12%, 100% 55%, 50% 100%, 0% 55%, 0% 12%);
  box-shadow: inset 0 1px 0 rgba(180, 220, 255, 0.6);
}
.roycss-game-shield-icon::after {
  content: "";
  position: absolute;
  top: 28%;
  left: 50%;
  width: 14px;
  height: 40px;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, #ffe080, #c08020);
  clip-path: polygon(35% 0%, 65% 0%, 65% 55%, 80% 55%, 50% 100%, 20% 55%, 35% 55%);
  filter: drop-shadow(0 0 4px rgba(255, 200, 80, 0.7));
}
@keyframes roy-b15-shield-pulse {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(80, 160, 255, 0.5)); }
  50% { filter: drop-shadow(0 0 16px rgba(120, 200, 255, 0.9)); }
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
  width: 60px;
  height: 120px;
  position: relative;
  transform-origin: 50% 95%;
  animation: roy-b15-sword-sway 3s ease-in-out infinite;
}
.roycss-game-sword-icon::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  width: 8px;
  height: 80px;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, #ffffff 0%, #d8dde6 30%, #9aa0b0 70%, #5a606e 100%);
  clip-path: polygon(50% 0%, 100% 8%, 100% 100%, 0% 100%, 0% 8%);
  box-shadow: 0 0 4px rgba(200, 220, 255, 0.6);
}
.roycss-game-sword-icon::after {
  content: "";
  position: absolute;
  top: 78px;
  left: 50%;
  width: 40px;
  height: 8px;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, #ffe080, #b07010 60%, #6a4010);
  border-radius: 2px;
  box-shadow: 0 8px 0 -1px #6a3010, 0 8px 0 #4a2010, 0 18px 0 -3px #8a4a18;
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
  width: 64px;
  height: 64px;
  position: relative;
  transform-style: preserve-3d;
  animation: roy-b15-coin-spin 2.4s linear infinite;
}
.roycss-game-coin-spin::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff6c8 0%, #ffd640 35%, #c08010 70%, #6a4008 100%);
  box-shadow: 0 0 18px rgba(255, 200, 60, 0.6), inset 0 2px 4px rgba(255, 255, 220, 0.7), inset 0 -3px 6px rgba(80, 40, 0, 0.6);
}
.roycss-game-coin-spin::after {
  content: "★";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: #8a4a08;
  text-shadow: 0 1px 0 rgba(255, 240, 180, 0.7), 0 -1px 0 rgba(80, 40, 0, 0.5);
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
  width: 56px;
  height: 80px;
  position: relative;
  background: linear-gradient(to bottom, transparent 0%, transparent 18%, #2a0606 18%, #2a0606 100%);
  clip-path: polygon(40% 0%, 60% 0%, 60% 22%, 80% 35%, 80% 100%, 20% 100%, 20% 35%, 40% 22%);
}
.roycss-game-potion-bubble::before {
  content: "";
  position: absolute;
  top: 35%;
  left: 20%;
  right: 20%;
  bottom: 8%;
  background: linear-gradient(to bottom, #ff6060 0%, #e02020 40%, #800a0a 100%);
  border-radius: 4px 4px 14px 14px;
  box-shadow: inset 0 2px 0 rgba(255, 180, 180, 0.6), inset 0 -4px 6px rgba(40, 0, 0, 0.7), 0 0 14px rgba(255, 60, 60, 0.5);
  animation: roy-b15-potion-wave 2s ease-in-out infinite;
}
.roycss-game-potion-bubble::after {
  content: "";
  position: absolute;
  top: 42%;
  left: 30%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 200, 200, 0.85);
  box-shadow: 12px -8px 0 -1px rgba(255, 220, 220, 0.7), 6px 12px 0 -2px rgba(255, 200, 200, 0.6), -8px 16px 0 -2px rgba(255, 180, 180, 0.5);
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
  width: 110px;
  height: 80px;
  position: relative;
  background: linear-gradient(to bottom, #8a4a18 0%, #6a3008 50%, #4a1c04 100%);
  border-radius: 4px 4px 6px 6px;
  box-shadow: inset 0 2px 0 rgba(255, 200, 140, 0.3), inset 0 -6px 8px rgba(0, 0, 0, 0.6), 0 6px 14px rgba(0, 0, 0, 0.5);
  animation: roy-b15-chest-aura 2.2s ease-in-out infinite;
}
.roycss-game-chest-glow::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 30%;
  background: linear-gradient(to bottom, #a05a20 0%, #6a3008 100%);
  border-radius: 6px 6px 0 0;
  border-bottom: 2px solid #2a1004;
  box-shadow: inset 0 2px 0 rgba(255, 200, 140, 0.4);
}
.roycss-game-chest-glow::after {
  content: "";
  position: absolute;
  top: 22%;
  left: 50%;
  width: 16px;
  height: 20px;
  transform: translateX(-50%);
  background: linear-gradient(to bottom, #ffe080, #c08010 60%, #6a4008);
  border-radius: 3px 3px 8px 8px;
  box-shadow: 0 0 12px rgba(255, 200, 60, 0.9), inset 0 1px 0 rgba(255, 250, 200, 0.7);
}
@keyframes roy-b15-chest-aura {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(255, 180, 60, 0.4)); }
  50% { filter: drop-shadow(0 0 18px rgba(255, 220, 100, 0.85)); }
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
  width: 110px;
  height: 110px;
  border-radius: 50%;
  position: relative;
  background: radial-gradient(circle, rgba(20, 60, 30, 0.6) 0%, rgba(8, 24, 12, 0.95) 80%);
  border: 2px solid #2a6a3a;
  box-shadow: 0 0 0 2px #050a06, 0 0 14px rgba(60, 200, 100, 0.3), inset 0 0 20px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}
.roycss-game-minimap::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, transparent 8%, transparent 9%, rgba(60, 200, 100, 0.2) 9%, rgba(60, 200, 100, 0.2) 10%, transparent 10%),
    radial-gradient(circle at 50% 50%, transparent 24%, rgba(60, 200, 100, 0.18) 24%, rgba(60, 200, 100, 0.18) 25%, transparent 25%),
    radial-gradient(circle at 50% 50%, transparent 40%, rgba(60, 200, 100, 0.15) 40%, rgba(60, 200, 100, 0.15) 41%, transparent 41%),
    linear-gradient(0deg, transparent 49.5%, rgba(60, 200, 100, 0.25) 49.5%, rgba(60, 200, 100, 0.25) 50.5%, transparent 50.5%),
    linear-gradient(90deg, transparent 49.5%, rgba(60, 200, 100, 0.25) 49.5%, rgba(60, 200, 100, 0.25) 50.5%, transparent 50.5%);
  border-radius: 50%;
}
.roycss-game-minimap::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50%;
  height: 50%;
  transform-origin: top left;
  background: conic-gradient(from 0deg, rgba(80, 255, 120, 0.55) 0deg, transparent 60deg);
  border-radius: 0 0 0 100%;
  animation: roy-b15-minimap-sweep 3s linear infinite;
  box-shadow: 0 0 4px rgba(80, 255, 120, 0.8);
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
  width: 80px;
  height: 80px;
  position: relative;
  background:
    linear-gradient(90deg, transparent 48%, #00ff88 48%, #00ff88 52%, transparent 52%) center / 100% 2px no-repeat,
    linear-gradient(0deg, transparent 48%, #00ff88 48%, #00ff88 52%, transparent 52%) center / 2px 100% no-repeat;
  filter: drop-shadow(0 0 4px rgba(0, 255, 140, 0.8));
  animation: roy-b15-crosshair-pulse 1.4s ease-in-out infinite;
}
.roycss-game-crosshair::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #00ff88;
  box-shadow: 0 0 6px rgba(0, 255, 140, 1);
}
.roycss-game-crosshair::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  transform: translate(-50%, -50%);
  border: 1.5px solid rgba(0, 255, 140, 0.45);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0, 255, 140, 0.4), inset 0 0 8px rgba(0, 255, 140, 0.25);
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
  width: 120px;
  height: 60px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 38px;
  font-weight: 900;
  font-style: italic;
  color: #ffe040;
  text-shadow:
    0 0 0 #000,
    -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px 2px 0 #000,
    2px 2px 0 #000,
    -2px 0 0 #000,
    2px 0 0 #000,
    0 -2px 0 #000,
    0 2px 0 #000,
    0 0 12px rgba(255, 200, 40, 0.9),
    0 0 20px rgba(255, 120, 0, 0.7);
  animation: roy-b15-combo-punch 0.6s ease-in-out infinite;
}
.roycss-game-combo-counter::before {
  content: "x12";
}
.roycss-game-combo-counter::after {
  content: "COMBO";
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-style: normal;
  letter-spacing: 3px;
  color: #ff6020;
  text-shadow: 0 0 6px rgba(255, 100, 30, 0.8), 1px 1px 0 #000;
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
  width: 120px;
  height: 120px;
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
  background: radial-gradient(circle at 35% 30%, #fff4a8 0%, #ffd020 40%, #c08010 75%, #6a4008 100%);
  box-shadow: 0 0 16px rgba(255, 200, 60, 0.7), inset 0 2px 4px rgba(255, 250, 200, 0.7), inset 0 -4px 8px rgba(80, 40, 0, 0.6);
}
.roycss-game-achievement-badge::after {
  content: "★";
  position: absolute;
  font-size: 50px;
  color: #8a4a08;
  text-shadow: 0 1px 0 rgba(255, 240, 180, 0.7), 0 -1px 0 rgba(80, 40, 0, 0.5);
  z-index: 2;
  animation: roy-b15-ach-shine 2.4s linear infinite;
}
@keyframes roy-b15-ach-pop {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(10deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes roy-b15-ach-shine {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(255, 220, 80, 0.6)); }
  50% { filter: drop-shadow(0 0 14px rgba(255, 240, 120, 1)); }
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, #1a0530 0%, #4a0e5c 30%, #b01870 55%, #ff4090 70%, #ffaa50 82%, #2a0a40 100%);
}
.roycss-retro-grid-sun::before {
  content: "";
  position: absolute;
  top: 18%;
  left: 50%;
  width: 140px;
  height: 140px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: linear-gradient(to bottom, #ffe040 0%, #ff6020 50%, #c01060 100%);
  box-shadow: 0 0 60px rgba(255, 120, 60, 0.7);
  background-image:
    linear-gradient(to bottom, transparent 0%, transparent 45%, #1a0530 45%, #1a0530 50%, transparent 50%, transparent 60%, #1a0530 60%, #1a0530 65%, transparent 65%, transparent 75%, #1a0530 75%, #1a0530 80%, transparent 80%);
}
.roycss-retro-grid-sun::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background:
    linear-gradient(to bottom, transparent 0%, #1a0530 30%, #0a0218 100%),
    repeating-linear-gradient(90deg, rgba(255, 60, 200, 0.5) 0, rgba(255, 60, 200, 0.5) 1px, transparent 1px, transparent 32px),
    repeating-linear-gradient(0deg, rgba(255, 60, 200, 0.5) 0, rgba(255, 60, 200, 0.5) 1px, transparent 1px, transparent 24px);
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, #2a0840 0%, #6a1a80 30%, #ff3080 55%, #ff6040 70%, #4a0a60 100%);
}
.roycss-retro-synthwave::before {
  content: "";
  position: absolute;
  top: 20%;
  left: 50%;
  width: 120px;
  height: 120px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: linear-gradient(to bottom, #ffe060 0%, #ff60a0 60%, #c020a0 100%);
  box-shadow: 0 0 50px rgba(255, 80, 180, 0.7);
  background-image:
    linear-gradient(to bottom, transparent 0%, transparent 35%, #2a0840 35%, #2a0840 38%, transparent 38%, transparent 48%, #2a0840 48%, #2a0840 52%, transparent 52%, transparent 62%, #2a0840 62%, #2a0840 67%, transparent 67%, transparent 78%, #2a0840 78%, #2a0840 84%, transparent 84%);
}
.roycss-retro-synthwave::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 45%;
  background:
    linear-gradient(to bottom, transparent 0%, #1a0428 40%, #05000f 100%),
    repeating-linear-gradient(90deg, rgba(0, 240, 255, 0.6) 0, rgba(0, 240, 255, 0.6) 1px, transparent 1px, transparent 28px),
    repeating-linear-gradient(0deg, rgba(255, 60, 200, 0.6) 0, rgba(255, 60, 200, 0.6) 1px, transparent 1px, transparent 22px);
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(to bottom,
      #4a7ce0 0%, #4a7ce0 18%,
      #5e8ee8 18%, #5e8ee8 38%,
      #82a8f0 38%, #82a8f0 60%,
      #b0c8f5 60%, #b0c8f5 78%,
      #d8e4fa 78%, #d8e4fa 100%);
  image-rendering: pixelated;
}
.roycss-retro-pixel-sky::before {
  content: "";
  position: absolute;
  top: 8%;
  right: 12%;
  width: 50px;
  height: 50px;
  background: #fff8a0;
  box-shadow:
    -8px 0 0 #fff8a0, 8px 0 0 #fff8a0,
    0 -8px 0 #fff8a0, 0 8px 0 #fff8a0,
    -8px -8px 0 #fff8a0, 8px -8px 0 #fff8a0,
    -8px 8px 0 #fff8a0, 8px 8px 0 #fff8a0,
    -16px 0 0 #fff8a0, 16px 0 0 #fff8a0,
    0 -16px 0 #fff8a0, 0 16px 0 #fff8a0,
    -24px 0 0 #fff8a0, 24px 0 0 #fff8a0,
    -16px 16px 0 #ffe060, 16px 16px 0 #ffe060,
    -24px 16px 0 #ffe060, 24px 16px 0 #ffe060,
    -32px 16px 0 #ffe060, 32px 16px 0 #ffe060;
}
.roycss-retro-pixel-sky::after {
  content: "";
  position: absolute;
  top: 28%;
  left: 12%;
  width: 16px;
  height: 16px;
  background: #ffffff;
  box-shadow:
    16px 0 0 #ffffff, 32px 0 0 #ffffff,
    -16px 0 0 #ffffff, 48px 0 0 #ffffff,
    0 16px 0 #ffffff, 16px 16px 0 #ffffff, 32px 16px 0 #ffffff,
    200px -8px 0 #ffffff, 216px -8px 0 #ffffff, 232px -8px 0 #ffffff,
    208px 8px 0 #ffffff, 224px 8px 0 #ffffff, 240px 8px 0 #ffffff, 256px 8px 0 #ffffff;
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #001a08 0%, #000800 75%, #000200 100%);
  font-family: "Courier New", monospace;
}
.roycss-retro-terminal::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0, 0, 0, 0.4) 2px, rgba(0, 0, 0, 0.4) 4px),
    radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.7) 100%);
  pointer-events: none;
  animation: roy-b15-term-flicker 0.15s steps(2) infinite;
}
.roycss-retro-terminal::after {
  content: "> _";
  position: absolute;
  top: 14px;
  left: 16px;
  color: #00ff66;
  font-size: 14px;
  text-shadow: 0 0 6px rgba(0, 255, 100, 0.9), 0 0 12px rgba(0, 255, 100, 0.5);
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #2a1a08 0%, #4a3018 50%, #2a1a08 100%);
}
.roycss-retro-cassette::before {
  content: "";
  position: absolute;
  top: 20%;
  left: 10%;
  right: 10%;
  height: 55%;
  background: linear-gradient(to bottom, #d8b878 0%, #b89048 50%, #8a6428 100%);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 230, 180, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.4);
}
.roycss-retro-cassette::after {
  content: "";
  position: absolute;
  top: 30%;
  left: 50%;
  width: 30px;
  height: 30px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, #1a1008 25%, #4a3018 30%, #2a1808 60%);
  border: 2px solid #2a1808;
  box-shadow:
    -90px 0 0 -2px #1a1008,
    -90px 0 0 0 #4a3018,
    -90px 0 0 2px #2a1808;
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #0a0030 0%, #000010 80%);
}
.roycss-retro-arcade::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(2px 2px at 20% 30%, #ffffff, transparent),
    radial-gradient(1px 1px at 60% 20%, #88aaff, transparent),
    radial-gradient(2px 2px at 80% 60%, #ffffff, transparent),
    radial-gradient(1px 1px at 30% 70%, #ffaa88, transparent),
    radial-gradient(1px 1px at 50% 50%, #aaff88, transparent),
    radial-gradient(2px 2px at 75% 30%, #ffffff, transparent),
    radial-gradient(1px 1px at 15% 80%, #88ffff, transparent),
    radial-gradient(1px 1px at 90% 85%, #ffffff, transparent);
  background-size: 100% 100%;
}
.roycss-retro-arcade::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(0, 0, 0, 0.5) 3px, rgba(0, 0, 0, 0.5) 4px),
    radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.8) 100%);
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 40%, rgba(180, 220, 140, 0.15) 0%, transparent 12%),
    radial-gradient(circle at 70% 70%, rgba(180, 220, 140, 0.15) 0%, transparent 14%),
    repeating-linear-gradient(90deg, transparent 0, transparent 24px, rgba(180, 140, 60, 0.4) 24px, rgba(180, 140, 60, 0.4) 26px, transparent 26px, transparent 60px),
    repeating-linear-gradient(0deg, transparent 0, transparent 24px, rgba(180, 140, 60, 0.4) 24px, rgba(180, 140, 60, 0.4) 26px, transparent 26px, transparent 60px),
    linear-gradient(135deg, #0a3a18 0%, #084018 50%, #062810 100%);
}
.roycss-tech-circuit-board::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 24px 24px, #d4a040 0, #d4a040 2px, transparent 2px),
    radial-gradient(circle at 84px 84px, #d4a040 0, #d4a040 2px, transparent 2px),
    radial-gradient(circle at 144px 24px, #d4a040 0, #d4a040 2px, transparent 2px);
  background-size: 180px 180px;
  opacity: 0.8;
}
.roycss-tech-circuit-board::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 30% 40%, #00ff80 0, #00ff80 2px, transparent 2px),
    radial-gradient(circle at 70% 70%, #00ff80 0, #00ff80 2px, transparent 2px);
  background-size: 180px 180px;
  filter: drop-shadow(0 0 4px rgba(0, 255, 120, 0.9));
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000000;
}
.roycss-tech-matrix-code::before {
  content: "";
  position: absolute;
  inset: -20%;
  background:
    repeating-linear-gradient(0deg,
      rgba(0, 255, 60, 0.9) 0, rgba(0, 255, 60, 0.9) 12px,
      rgba(0, 200, 50, 0.7) 12px, rgba(0, 200, 50, 0.7) 24px,
      rgba(0, 140, 30, 0.5) 24px, rgba(0, 140, 30, 0.5) 36px,
      rgba(0, 80, 20, 0.3) 36px, rgba(0, 80, 20, 0.3) 48px,
      transparent 48px, transparent 80px);
  background-size: 22px 100%;
  filter: blur(0.6px) drop-shadow(0 0 4px rgba(0, 255, 80, 0.6));
  animation: roy-b15-matrix-rain 1.6s linear infinite;
}
.roycss-tech-matrix-code::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.8) 100%),
    repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0, 0, 0, 0.35) 2px, rgba(0, 0, 0, 0.35) 3px);
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(ellipse at center, rgba(0, 200, 220, 0.18) 0%, rgba(0, 80, 100, 0.4) 50%, rgba(0, 20, 40, 0.9) 100%);
}
.roycss-tech-hologram-grid::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(90deg, rgba(0, 240, 255, 0.4) 0, rgba(0, 240, 255, 0.4) 1px, transparent 1px, transparent 24px),
    repeating-linear-gradient(0deg, rgba(0, 240, 255, 0.4) 0, rgba(0, 240, 255, 0.4) 1px, transparent 1px, transparent 24px);
  transform: perspective(400px) rotateX(50deg);
  transform-origin: center bottom;
  mask-image: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.9) 40%, rgba(0, 0, 0, 0.4) 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.9) 40%, rgba(0, 0, 0, 0.4) 100%);
}
.roycss-tech-hologram-grid::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(0, 240, 255, 0.08) 3px, rgba(0, 240, 255, 0.08) 4px);
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
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(circle, #0a2010 0%, #050a05 80%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-tech-scan-radar::before {
  content: "";
  position: absolute;
  width: 86%;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle, transparent 0%, transparent 24%, rgba(60, 200, 100, 0.3) 24%, rgba(60, 200, 100, 0.3) 25%, transparent 25%),
    radial-gradient(circle, transparent 0%, transparent 49%, rgba(60, 200, 100, 0.3) 49%, rgba(60, 200, 100, 0.3) 50%, transparent 50%),
    radial-gradient(circle, transparent 0%, transparent 74%, rgba(60, 200, 100, 0.3) 74%, rgba(60, 200, 100, 0.3) 75%, transparent 75%),
    linear-gradient(0deg, transparent 49.5%, rgba(60, 200, 100, 0.4) 49.5%, rgba(60, 200, 100, 0.4) 50.5%, transparent 50.5%),
    linear-gradient(90deg, transparent 49.5%, rgba(60, 200, 100, 0.4) 49.5%, rgba(60, 200, 100, 0.4) 50.5%, transparent 50.5%);
  border: 2px solid rgba(60, 200, 100, 0.6);
  box-shadow: 0 0 24px rgba(60, 200, 100, 0.3), inset 0 0 30px rgba(0, 60, 20, 0.6);
}
.roycss-tech-scan-radar::after {
  content: "";
  position: absolute;
  width: 86%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(80, 255, 120, 0.7) 0deg, rgba(80, 255, 120, 0.2) 40deg, transparent 70deg, transparent 360deg);
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
  width: 16px;
  height: 24px;
  position: relative;
  background: #4a8aff;
  box-shadow:
    /* head */
    -4px -10px 0 #4a8aff, 4px -10px 0 #4a8aff,
    0 -14px 0 #4a8aff,
    /* arms */
    -8px -2px 0 #4a8aff, 8px -2px 0 #4a8aff,
    /* legs */
    -4px 8px 0 #2a4488, 4px 8px 0 #2a4488;
  animation: roy-b15-walk-bounce 0.4s ease-in-out infinite;
}
.roycss-game-pixel-walk::before {
  content: "";
  position: absolute;
  bottom: -10px;
  left: -16px;
  right: -16px;
  height: 4px;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.5) 0%, transparent 70%);
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
  width: 40px;
  height: 40px;
  position: relative;
  background: radial-gradient(circle at 35% 30%, #ff8060 0%, #e04020 60%, #a02010 100%);
  border-radius: 8px;
  box-shadow: inset 0 2px 0 rgba(255, 200, 180, 0.5), inset 0 -4px 6px rgba(80, 10, 0, 0.6);
  animation: roy-b15-mario-jump 1.2s cubic-bezier(0.3, 0, 0.4, 1) infinite;
}
.roycss-game-mario-jump::before {
  content: "";
  position: absolute;
  bottom: -10px;
  left: -10px;
  right: -10px;
  height: 6px;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.4) 0%, transparent 70%);
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
  width: 60px;
  height: 50px;
  position: relative;
  background: radial-gradient(ellipse at 50% 30%, #80ff80 0%, #40c040 50%, #208020 100%);
  border-radius: 50% 50% 12px 12px / 70% 70% 12px 12px;
  box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.4), inset 0 -8px 12px rgba(0, 60, 0, 0.6), 0 0 14px rgba(80, 220, 80, 0.5);
  animation: roy-b15-enemy-bob 1.6s ease-in-out infinite;
}
.roycss-game-enemy-bob::before {
  content: "";
  position: absolute;
  top: 35%;
  left: 25%;
  width: 8px;
  height: 8px;
  background: #000;
  border-radius: 50%;
  box-shadow: 22px 0 0 #000, 1px -1px 0 1px #fff, 23px -1px 0 1px #fff;
}
.roycss-game-enemy-bob::after {
  content: "";
  position: absolute;
  bottom: -6px;
  left: -8px;
  right: -8px;
  height: 6px;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.5) 0%, transparent 70%);
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
  width: 24px;
  height: 24px;
  position: relative;
  background: radial-gradient(circle at 60% 40%, #ffff80 0%, #ff8020 40%, #c02000 80%, #400000 100%);
  border-radius: 50%;
  box-shadow: 0 0 14px rgba(255, 120, 30, 0.9), 0 0 28px rgba(255, 60, 0, 0.6);
  animation: roy-b15-projectile-fly 1.6s ease-in-out infinite;
}
.roycss-game-projectile::before {
  content: "";
  position: absolute;
  top: 50%;
  right: 50%;
  width: 50px;
  height: 4px;
  transform: translateY(-50%);
  background: linear-gradient(to left, rgba(255, 180, 60, 0.9) 0%, rgba(255, 80, 0, 0.6) 40%, transparent 100%);
  border-radius: 4px;
  filter: blur(1px);
}
.roycss-game-projectile::after {
  content: "";
  position: absolute;
  top: 50%;
  right: 60%;
  width: 6px;
  height: 6px;
  transform: translateY(-50%);
  background: #ffe080;
  border-radius: 50%;
  box-shadow: -8px 2px 0 -1px rgba(255, 160, 40, 0.7), -16px -2px 0 -2px rgba(255, 100, 0, 0.5), -24px 4px 0 -3px rgba(255, 60, 0, 0.3);
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
  width: 50px;
  height: 50px;
  position: relative;
}
.roycss-game-explosion::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, #ffffff 0%, #ffe040 25%, #ff6020 55%, #c01000 80%, transparent 100%);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255, 120, 30, 0.9), 0 0 40px rgba(255, 60, 0, 0.6);
  animation: roy-b15-explosion-core 1s ease-out infinite;
}
.roycss-game-explosion::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  transform: translate(-50%, -50%);
  background: transparent;
  border-radius: 50%;
  box-shadow:
    -28px -18px 0 -2px #ff8020,
    28px -18px 0 -2px #ff8020,
    -28px 18px 0 -2px #ff8020,
    28px 18px 0 -2px #ff8020,
    -34px 0 0 -3px #c04000,
    34px 0 0 -3px #c04000,
    0 -30px 0 -2px #ff6020,
    0 30px 0 -2px #ff6020;
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
  width: 60px;
  height: 60px;
  position: relative;
}
.roycss-game-level-up::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, #ffffff 0%, #ffe080 30%, #ffb020 60%, transparent 100%);
  box-shadow: 0 0 30px rgba(255, 220, 80, 0.9);
  animation: roy-b15-levelup-core 1.4s ease-out infinite;
}
.roycss-game-level-up::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 220, 80, 0.8);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 220, 80, 0.6);
  animation: roy-b15-levelup-ring 1.4s ease-out infinite;
}
@keyframes roy-b15-levelup-core {
  0% { transform: scale(0.4); opacity: 1; }
  40% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}
@keyframes roy-b15-levelup-ring {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; border-width: 3px; }
  100% { transform: translate(-50%, -50%) scale(4); opacity: 0; border-width: 1px; }
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
  width: 100px;
  height: 70px;
  position: relative;
  background: linear-gradient(135deg, #1a3050 0%, #0a1830 100%);
  border: 2px solid #4a7090;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #050a14, 0 6px 14px rgba(0, 0, 0, 0.5);
  animation: roy-b15-screen-shake 0.4s linear infinite;
}
.roycss-game-screen-shake::before {
  content: "HIT!";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ff4040;
  font-family: "Impact", "Arial Black", sans-serif;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 2px;
  text-shadow:
    -1px -1px 0 #000, 1px -1px 0 #000,
    -1px 1px 0 #000, 1px 1px 0 #000,
    0 0 8px rgba(255, 60, 60, 0.9);
  animation: roy-b15-screen-flash 0.2s steps(2) infinite;
}
.roycss-game-screen-shake::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 4px;
  box-shadow: inset 0 0 14px rgba(255, 60, 60, 0.5);
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
  width: 160px;
  height: 22px;
  background: #1a0a02;
  border: 3px solid #6a4010;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 0 1px #2a1404;
}
.roycss-game-loading-bar::before {
  content: "";
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: 70%;
  background:
    repeating-linear-gradient(90deg, #ffb020 0, #ffb020 14px, #b06010 14px, #b06010 16px);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(255, 180, 40, 0.8), inset 0 1px 0 rgba(255, 240, 180, 0.7);
  animation: roy-b15-loading-fill 2s ease-in-out infinite;
}
.roycss-game-loading-bar::after {
  content: "";
  position: absolute;
  top: 2px;
  bottom: 2px;
  right: 2px;
  width: 4px;
  background: #ffe080;
  box-shadow: 0 0 10px rgba(255, 240, 120, 1), 0 0 20px rgba(255, 200, 40, 0.7);
  animation: roy-b15-loading-edge 2s ease-in-out infinite;
}
@keyframes roy-b15-loading-fill {
  0% { width: 5%; }
  50% { width: 75%; }
  100% { width: 5%; }
}
@keyframes roy-b15-loading-edge {
  0% { right: 80%; opacity: 0.8; }
  50% { right: 8%; opacity: 1; }
  100% { right: 80%; opacity: 0.8; }
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
  color: #00ff66;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(0, 255, 100, 0.8), 0 0 14px rgba(0, 255, 100, 0.4);
  position: relative;
  padding-right: 14px;
}
.roycss-game-cursor-blink::after {
  content: "_";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  color: #00ff66;
  text-shadow: 0 0 8px rgba(0, 255, 100, 0.9);
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
  width: 50px;
  height: 50px;
  position: relative;
  background: radial-gradient(circle at 35% 30%, #80ffa0 0%, #40c060 50%, #208040 100%);
  border-radius: 50%;
  box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.4), inset 0 -6px 10px rgba(0, 60, 0, 0.6), 0 0 14px rgba(80, 220, 100, 0.6);
  animation: roy-b15-float-bob 2.4s ease-in-out infinite;
}
.roycss-game-float-bobble::before {
  content: "";
  position: absolute;
  top: 22%;
  left: 28%;
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  filter: blur(1px);
}
.roycss-game-float-bobble::after {
  content: "";
  position: absolute;
  bottom: -16px;
  left: -10px;
  right: -10px;
  height: 8px;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.5) 0%, transparent 70%);
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
  color: #ffe040;
  text-transform: uppercase;
  text-shadow:
    0 4px 0 #c08010,
    0 6px 0 #6a4008,
    4px 8px 0 #000000,
    -2px -2px 0 #000000,
    2px -2px 0 #000000,
    -2px 2px 0 #000000,
    2px 2px 0 #000000;
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
  font-smooth: never;
  filter: drop-shadow(0 0 6px rgba(255, 200, 40, 0.5));
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
  color: #ffffff;
  text-transform: uppercase;
  text-shadow:
    0 0 4px #ffffff,
    0 0 10px #ff40c0,
    0 0 20px #ff40c0,
    0 0 36px #ff1080,
    0 0 60px #c00080,
    0 0 80px #800060;
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
  color: #00ff66;
  text-shadow:
    0 0 4px #00ff66,
    0 0 8px #00cc44,
    0 0 16px rgba(0, 255, 80, 0.6),
    0 0 26px rgba(0, 200, 60, 0.4);
  position: relative;
  animation: roy-b15-term-green-flicker 4s linear infinite;
}
.roycss-text-terminal-green::after {
  content: "";
  position: absolute;
  inset: -4px -8px;
  background: repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0, 0, 0, 0.4) 2px, rgba(0, 0, 0, 0.4) 3px);
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
  color: #00ffe0;
  text-transform: uppercase;
  position: relative;
  text-shadow: 0 0 8px rgba(0, 255, 220, 0.6);
}
.roycss-text-glitch-cyberpunk::before {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  color: #ff0080;
  text-shadow: 0 0 8px rgba(255, 0, 140, 0.6);
  clip-path: polygon(0 0, 100% 0, 100% 30%, 0 30%);
  animation: roy-b15-glitch-top 2s steps(8) infinite;
}
.roycss-text-glitch-cyberpunk::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  color: #ffe000;
  text-shadow: 0 0 8px rgba(255, 220, 0, 0.6);
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
  color: #f0e0b0;
  letter-spacing: 0.5px;
  padding: 14px 18px;
  background: linear-gradient(to bottom, rgba(60, 40, 20, 0.92) 0%, rgba(40, 24, 10, 0.95) 100%);
  border: 2px solid #c0a060;
  border-radius: 6px;
  box-shadow:
    inset 0 2px 0 rgba(255, 220, 140, 0.3),
    inset 0 -2px 6px rgba(0, 0, 0, 0.6),
    0 4px 0 #4a3010,
    0 6px 14px rgba(0, 0, 0, 0.5);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
  position: relative;
}
.roycss-text-rpg-dialogue::before {
  content: "▶";
  position: absolute;
  bottom: 8px;
  right: 14px;
  color: #ffe080;
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
  color: #ffe040;
  text-shadow:
    -2px 0 0 #000,
    2px 0 0 #000,
    0 -2px 0 #000,
    0 2px 0 #000,
    -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px 2px 0 #000,
    2px 2px 0 #000,
    4px 4px 0 #6a4008,
    6px 6px 0 #2a1804,
    0 0 16px rgba(255, 200, 40, 0.7);
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
  color: #ffffff;
  text-shadow:
    3px 0 0 #4a2080,
    3px 3px 0 #4a2080,
    0 3px 0 #4a2080,
    6px 6px 0 #2a1050,
    6px 6px 0 #2a1050,
    9px 9px 0 #100428,
    9px 9px 0 #100428;
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
  font-smooth: never;
  filter: drop-shadow(0 0 8px rgba(120, 80, 220, 0.4));
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
  color: #80f0ff;
  text-shadow:
    0 0 4px #80f0ff,
    0 0 10px #40c0e0,
    0 0 20px rgba(0, 200, 220, 0.6),
    -1px 0 0 rgba(255, 0, 120, 0.5),
    1px 0 0 rgba(0, 255, 200, 0.5);
  position: relative;
  animation: roy-b15-holo-flicker 3s linear infinite;
}
.roycss-text-hologram-scan::before {
  content: "";
  position: absolute;
  inset: -4px -8px;
  background: repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(0, 240, 255, 0.18) 3px, rgba(0, 240, 255, 0.18) 4px);
  pointer-events: none;
  animation: roy-b15-holo-scan 2s linear infinite;
  mix-blend-mode: screen;
}
.roycss-text-hologram-scan::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(0, 255, 220, 0.8);
  box-shadow: 0 0 8px rgba(0, 255, 220, 0.9);
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
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}`
  }
];
