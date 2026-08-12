import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 38 — Retro & Nostalgic Effects (20 effects)
 * Pure-CSS love letters to the 70s–90s: CRT, VHS, LCD, arcade neon,
 * synthwave grids, cassette reels, floppy disks, dial-up, film grain.
 * All classes are prefixed `roycss-retro-` and keyframes `roy-retro-`.
 * Every effect ships a `prefers-reduced-motion: reduce` fallback.
 */
export const effectsBatch38: CSSEffect[] = [
  // 1. retro-crt-scanlines
  {
    id: "retro-crt-scanlines",
    name: "CRT Scanlines",
    category: "retro",
    description: "Retro CRT monitor scanline overlay with subtle phosphor curvature and rolling bar",
    tags: ["retro", "crt", "scanlines", "nostalgic", "monitor"],
    previewType: "box",
    cssCode: `/* Retro: CRT Scanlines */
.roycss-retro-crt-scanlines {
  position: relative;
  background: radial-gradient(ellipse at center, #0c3a2a 0%, #021510 100%);
  color: #7dffb0;
  border-radius: 16px;
  overflow: hidden;
  font-family: ui-monospace, monospace;
  text-shadow: 0 0 4px #7dffb0, 0 0 10px rgba(125,255,176,0.6);
}
.roycss-retro-crt-scanlines::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0,0,0,0) 0px,
    rgba(0,0,0,0) 2px,
    rgba(0,0,0,0.35) 3px,
    rgba(0,0,0,0.35) 4px
  );
  pointer-events: none;
  animation: roy-retro-crt-scan 6s linear infinite;
}
.roycss-retro-crt-scanlines::after {
  content: "";
  position: absolute;
  left: 0; right: 0;
  height: 28%;
  top: -28%;
  background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(125,255,176,0.18) 50%, rgba(255,255,255,0) 100%);
  animation: roy-retro-crt-roll 5s linear infinite;
  pointer-events: none;
}
@keyframes roy-retro-crt-scan {
  0%   { background-position: 0 0; }
  100% { background-position: 0 100px; }
}
@keyframes roy-retro-crt-roll {
  0%   { top: -28%; }
  100% { top: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-crt-scanlines::before,
  .roycss-retro-crt-scanlines::after { animation: none; }
}`,
  },

  // 2. retro-vhs-tracking
  {
    id: "retro-vhs-tracking",
    name: "VHS Tracking",
    category: "retro",
    description: "VHS horizontal tracking distortion lines with chromatic color bleed and jitter",
    tags: ["retro", "vhs", "tracking", "glitch", "nostalgic"],
    previewType: "box",
    cssCode: `/* Retro: VHS Tracking */
.roycss-retro-vhs-tracking {
  position: relative;
  background: #0a0a0f;
  color: #f4f4f8;
  border-radius: 4px;
  overflow: hidden;
  font-family: ui-monospace, monospace;
  text-shadow: 2px 0 #ff0050, -2px 0 #00d4ff;
  animation: roy-retro-vhs-jitter 0.18s steps(2) infinite;
}
.roycss-retro-vhs-tracking::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(255,255,255,0) 0px,
      rgba(255,255,255,0) 6px,
      rgba(255,255,255,0.08) 7px,
      rgba(255,255,255,0) 8px
    ),
    linear-gradient(180deg, rgba(0,212,255,0.08) 0%, transparent 30%, transparent 70%, rgba(255,0,80,0.08) 100%);
  pointer-events: none;
  animation: roy-retro-vhs-scan 3s linear infinite;
}
.roycss-retro-vhs-tracking::after {
  content: "";
  position: absolute;
  left: 0; right: 0;
  top: 40%;
  height: 14px;
  background: rgba(255,255,255,0.18);
  filter: blur(2px);
  animation: roy-retro-vhs-bar 2.6s ease-in-out infinite;
  pointer-events: none;
}
@keyframes roy-retro-vhs-jitter {
  0%   { transform: translate(0,0); }
  50%  { transform: translate(-0.5px, 0.5px); }
  100% { transform: translate(0.5px, -0.5px); }
}
@keyframes roy-retro-vhs-scan {
  0%   { background-position: 0 0, 0 0; }
  100% { background-position: 0 60px, 0 0; }
}
@keyframes roy-retro-vhs-bar {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50%      { transform: translateY(-30px); opacity: 0.9; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-vhs-tracking,
  .roycss-retro-vhs-tracking::before,
  .roycss-retro-vhs-tracking::after { animation: none; }
}`,
  },

  // 3. retro-pixel-art-transition
  {
    id: "retro-pixel-art-transition",
    name: "Pixel Art Transition",
    category: "retro",
    description: "Pixelated in-and-out transition using image-rendering: pixelated and stepped scale",
    tags: ["retro", "pixel", "8bit", "transition", "animate"],
    previewType: "box",
    cssCode: `/* Retro: Pixel Art Transition */
.roycss-retro-pixel-art-transition {
  background: linear-gradient(135deg, #ff71ce, #01cdfe, #05ffa1, #b967ff);
  border-radius: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  animation: roy-retro-pixel 2.4s steps(8) infinite;
}
@keyframes roy-retro-pixel {
  0%   { transform: scale(1) translateZ(0); filter: contrast(1); }
  25%  { transform: scale(1.4) translateZ(0); filter: contrast(1.8) saturate(1.5); }
  50%  { transform: scale(0.6) translateZ(0); filter: contrast(2.2) saturate(2); }
  75%  { transform: scale(1.4) translateZ(0); filter: contrast(1.8) saturate(1.5); }
  100% { transform: scale(1) translateZ(0); filter: contrast(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-pixel-art-transition { animation: none; transform: none; filter: none; }
}`,
  },

  // 4. retro-lcd-display
  {
    id: "retro-lcd-display",
    name: "LCD Display",
    category: "retro",
    description: "Segmented LCD display font effect with green-grey phosphor segments and ghost digits",
    tags: ["retro", "lcd", "display", "segmented", "nostalgic"],
    previewType: "text",
    previewText: "08:42",
    cssCode: `/* Retro: LCD Display */
.roycss-retro-lcd-display {
  background: linear-gradient(180deg, #9ba78d 0%, #828c74 100%);
  color: rgba(28, 38, 22, 0.92);
  font-family: ui-monospace, "Courier New", monospace;
  font-weight: 700;
  letter-spacing: 0.15em;
  border-radius: 6px;
  padding: 0.4em 0.6em;
  text-shadow: 0 1px 0 rgba(255,255,255,0.3);
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.2);
  position: relative;
}
.roycss-retro-lcd-display::before {
  content: "88:88";
  position: absolute;
  inset: 0.4em 0.6em;
  color: rgba(28, 38, 22, 0.12);
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-lcd-display { animation: none; }
}`,
  },

  // 5. retro-typewriter-ribbon
  {
    id: "retro-typewriter-ribbon",
    name: "Typewriter Ribbon",
    category: "retro",
    description: "Faded ribbon-worn typewriter text with uneven ink density and ghost impression",
    tags: ["retro", "typewriter", "ribbon", "ink", "text"],
    previewType: "text",
    previewText: "Dear Reader",
    cssCode: `/* Retro: Typewriter Ribbon */
.roycss-retro-typewriter-ribbon {
  font-family: "Courier New", ui-monospace, monospace;
  color: #2a1d10;
  background: #f1e7d2;
  padding: 0.5em 0.8em;
  letter-spacing: 0.05em;
  text-shadow:
    0.5px 0 0 rgba(60,40,20,0.6),
    -0.5px 0 0 rgba(120,80,40,0.4),
    1px 0 1px rgba(40,25,10,0.3);
  border-radius: 2px;
  position: relative;
}
.roycss-retro-typewriter-ribbon::before {
  content: attr(data-text);
  position: absolute;
  left: 0.8em;
  top: 0.5em;
  color: rgba(80, 50, 20, 0.18);
  transform: translate(2px, 1px);
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-typewriter-ribbon { animation: none; }
}`,
  },

  // 6. retro-polaroid-frame
  {
    id: "retro-polaroid-frame",
    name: "Polaroid Frame",
    category: "retro",
    description: "Polaroid photo card with thick white border, slight tilt, and soft shadow",
    tags: ["retro", "polaroid", "photo", "frame", "card"],
    previewType: "card",
    cssCode: `/* Retro: Polaroid Frame */
.roycss-retro-polaroid-frame {
  background: #fbf8f1;
  padding: 14px 14px 48px;
  border-radius: 4px;
  box-shadow:
    0 1px 1px rgba(0,0,0,0.1),
    0 10px 24px rgba(0,0,0,0.18),
    0 18px 40px rgba(0,0,0,0.08);
  transform: rotate(-3deg);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}
.roycss-retro-polaroid-frame::before {
  content: "";
  display: block;
  width: 100%;
  height: 120px;
  background:
    linear-gradient(135deg, rgba(255,140,180,0.5), rgba(140,200,255,0.5)),
    radial-gradient(circle at 30% 30%, rgba(255,220,120,0.7), transparent 60%),
    linear-gradient(180deg, #6b5a4a 0%, #b08d6a 100%);
  background-blend-mode: screen, screen, normal;
  filter: saturate(0.85) contrast(0.95);
}
.roycss-retro-polaroid-frame::after {
  content: "▚ 1987";
  position: absolute;
  bottom: 14px;
  left: 0; right: 0;
  text-align: center;
  font-family: "Courier New", monospace;
  font-size: 0.7rem;
  color: #5a4636;
  letter-spacing: 0.1em;
}
.roycss-retro-polaroid-frame:hover {
  transform: rotate(0deg) scale(1.04);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-polaroid-frame { transition: none; transform: rotate(-3deg); }
}`,
  },

  // 7. retro-film-grain
  {
    id: "retro-film-grain",
    name: "Film Grain",
    category: "retro",
    description: "Animated film grain noise overlay for cinematic retro footage aesthetic",
    tags: ["retro", "film", "grain", "noise", "cinematic"],
    previewType: "background",
    cssCode: `/* Retro: Film Grain */
.roycss-retro-film-grain {
  position: relative;
  background:
    radial-gradient(circle at 30% 20%, #5a3a1a 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, #2a1a0a 0%, transparent 50%),
    linear-gradient(135deg, #3a2a1a 0%, #1a1208 100%);
  color: #f4e8c8;
  overflow: hidden;
}
.roycss-retro-film-grain::before {
  content: "";
  position: absolute;
  inset: -50%;
  background-image:
    radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
    radial-gradient(rgba(0,0,0,0.18) 1px, transparent 1px);
  background-size: 3px 3px, 5px 5px;
  background-position: 0 0, 1px 2px;
  animation: roy-retro-grain 0.4s steps(4) infinite;
  pointer-events: none;
  mix-blend-mode: overlay;
}
@keyframes roy-retro-grain {
  0%   { transform: translate(0,0); }
  25%  { transform: translate(-5px, 3px); }
  50%  { transform: translate(4px, -4px); }
  75%  { transform: translate(-3px, -2px); }
  100% { transform: translate(2px, 4px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-film-grain::before { animation: none; }
}`,
  },

  // 8. retro-neon-flicker
  {
    id: "retro-neon-flicker",
    name: "Neon Flicker",
    category: "retro",
    description: "Neon sign that flickers and buzzes intermittently like a faulty motel sign",
    tags: ["retro", "neon", "flicker", "sign", "glow"],
    previewType: "text",
    previewText: "OPEN",
    cssCode: `/* Retro: Neon Flicker */
.roycss-retro-neon-flicker {
  color: #fff;
  background: #0a0510;
  font-family: "Arial Black", sans-serif;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-shadow:
    0 0 6px #ff2d95,
    0 0 14px #ff2d95,
    0 0 30px #ff2d95,
    0 0 60px #ff007a,
    0 0 90px #ff007a;
  animation: roy-retro-neon-flicker 3.2s infinite;
}
@keyframes roy-retro-neon-flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% {
    text-shadow:
      0 0 6px #ff2d95,
      0 0 14px #ff2d95,
      0 0 30px #ff2d95,
      0 0 60px #ff007a,
      0 0 90px #ff007a;
    opacity: 1;
  }
  20%, 24%, 55% {
    text-shadow: none;
    opacity: 0.35;
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-neon-flicker { animation: none; opacity: 1; }
}`,
  },

  // 9. retro-cassette-reel
  {
    id: "retro-cassette-reel",
    name: "Cassette Reel",
    category: "retro",
    description: "Spinning cassette tape reel with two counter-rotating hubs and tape window",
    tags: ["retro", "cassette", "reel", "tape", "spinner"],
    previewType: "loader",
    cssCode: `/* Retro: Cassette Reel */
.roycss-retro-cassette-reel {
  position: relative;
  width: 80px;
  height: 80px;
  background: linear-gradient(180deg, #d4a017 0%, #8a6210 100%);
  border-radius: 8px;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.3), 0 4px 10px rgba(0,0,0,0.3);
}
.roycss-retro-cassette-reel::before,
.roycss-retro-cassette-reel::after {
  content: "";
  position: absolute;
  top: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background:
    radial-gradient(circle, #1a1a1a 30%, #3a3a3a 32%, #1a1a1a 50%, #3a3a3a 52%, #1a1a1a 70%);
  border: 2px solid #2a2a2a;
  box-shadow: inset 0 0 0 4px rgba(255,255,255,0.1);
}
.roycss-retro-cassette-reel::before {
  left: 8px;
  animation: roy-retro-reel-spin 1.6s linear infinite;
}
.roycss-retro-cassette-reel::after {
  right: 8px;
  animation: roy-retro-reel-spin 1.6s linear infinite reverse;
}
@keyframes roy-retro-reel-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-cassette-reel::before,
  .roycss-retro-cassette-reel::after { animation: none; }
}`,
  },

  // 10. retro-gameboy-ui
  {
    id: "retro-gameboy-ui",
    name: "Game Boy UI",
    category: "retro",
    description: "Four-color DMG Game Boy green palette with dithered border and A/B button styling",
    tags: ["retro", "gameboy", "8bit", "palette", "nintendo"],
    previewType: "box",
    cssCode: `/* Retro: Game Boy UI */
.roycss-retro-gameboy-ui {
  background: #9bbc0f;
  color: #0f380f;
  border: 4px solid #0f380f;
  border-radius: 4px;
  padding: 12px;
  font-family: ui-monospace, monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  box-shadow:
    inset 0 0 0 2px #306230,
    4px 4px 0 #0f380f;
  position: relative;
}
.roycss-retro-gameboy-ui::before {
  content: "▶ PRESS START";
  display: block;
  font-size: 0.9rem;
  margin-bottom: 6px;
  text-shadow: 1px 1px 0 #8bac0f;
}
.roycss-retro-gameboy-ui::after {
  content: "";
  display: block;
  width: 14px;
  height: 14px;
  background: #0f380f;
  border-radius: 50%;
  box-shadow: 20px 0 0 #0f380f, -2px 2px 0 #306230, 22px 2px 0 #306230;
  margin-top: 8px;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-gameboy-ui { animation: none; }
}`,
  },

  // 11. retro-arcade-glow
  {
    id: "retro-arcade-glow",
    name: "Arcade Glow",
    category: "retro",
    description: "80s arcade cabinet marquee text with layered neon glow and pulsing intensity",
    tags: ["retro", "arcade", "neon", "glow", "80s"],
    previewType: "text",
    previewText: "INSERT COIN",
    cssCode: `/* Retro: Arcade Glow */
.roycss-retro-arcade-glow {
  color: #fff;
  background: #0a0014;
  font-family: "Arial Black", sans-serif;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-shadow:
    0 0 4px #fff,
    0 0 10px #fff,
    0 0 20px #ff00ff,
    0 0 40px #ff00ff,
    0 0 60px #ff00ff,
    0 0 80px #ff00ff;
  animation: roy-retro-arcade-pulse 1.6s ease-in-out infinite;
}
@keyframes roy-retro-arcade-pulse {
  0%, 100% {
    text-shadow:
      0 0 4px #fff,
      0 0 10px #fff,
      0 0 20px #ff00ff,
      0 0 40px #ff00ff,
      0 0 60px #ff00ff,
      0 0 80px #ff00ff;
  }
  50% {
    text-shadow:
      0 0 6px #fff,
      0 0 14px #fff,
      0 0 28px #00ffff,
      0 0 52px #00ffff,
      0 0 80px #00ffff,
      0 0 110px #00ffff;
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-arcade-glow { animation: none; }
}`,
  },

  // 12. retro-vhs-glitch
  {
    id: "retro-vhs-glitch",
    name: "VHS Glitch",
    category: "retro",
    description: "VHS tape glitch distortion with horizontal slices and color channel split",
    tags: ["retro", "vhs", "glitch", "distortion", "tape"],
    previewType: "box",
    cssCode: `/* Retro: VHS Glitch */
.roycss-retro-vhs-glitch {
  position: relative;
  background: #1a0a2a;
  color: #f0f0f5;
  font-family: ui-monospace, monospace;
  overflow: hidden;
  border-radius: 4px;
  animation: roy-retro-vhs-glitch-shift 2s infinite;
}
.roycss-retro-vhs-glitch::before {
  content: "▌▚▞▌▚▞ SIGNAL LOST";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #ff0050 0%, transparent 2%, transparent 98%, #00d4ff 100%);
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.2em;
  text-shadow: 2px 0 #ff0050, -2px 0 #00d4ff;
  clip-path: polygon(0 30%, 100% 30%, 100% 45%, 0 45%, 0 60%, 100% 60%, 100% 75%, 0 75%);
  animation: roy-retro-vhs-glitch-clip 0.6s steps(3) infinite;
}
@keyframes roy-retro-vhs-glitch-shift {
  0%, 100% { transform: translateX(0); }
  10%      { transform: translateX(-3px); }
  20%      { transform: translateX(4px); }
  30%      { transform: translateX(-1px); }
  40%      { transform: translateX(2px); }
}
@keyframes roy-retro-vhs-glitch-clip {
  0%   { clip-path: polygon(0 20%, 100% 20%, 100% 35%, 0 35%, 0 55%, 100% 55%, 100% 70%, 0 70%); }
  33%  { clip-path: polygon(0 40%, 100% 40%, 100% 50%, 0 50%, 0 65%, 100% 65%, 100% 80%, 0 80%); }
  66%  { clip-path: polygon(0 10%, 100% 10%, 100% 25%, 0 25%, 0 45%, 100% 45%, 100% 90%, 0 90%); }
  100% { clip-path: polygon(0 30%, 100% 30%, 100% 45%, 0 45%, 0 60%, 100% 60%, 100% 75%, 0 75%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-vhs-glitch,
  .roycss-retro-vhs-glitch::before { animation: none; }
}`,
  },

  // 13. retro-8bit-border
  {
    id: "retro-8bit-border",
    name: "8-Bit Border",
    category: "retro",
    description: "Pixelated 8-bit style stepped border with corner notches and chunky shadow",
    tags: ["retro", "8bit", "pixel", "border", "frame"],
    previewType: "box",
    cssCode: `/* Retro: 8-Bit Border */
.roycss-retro-8bit-border {
  background: #2d1b4e;
  color: #ffd700;
  font-family: ui-monospace, monospace;
  font-weight: 700;
  padding: 14px;
  position: relative;
  border: 4px solid #ffd700;
  box-shadow:
    0 0 0 4px #2d1b4e,
    0 0 0 8px #ffd700,
    8px 8px 0 8px #1a0f2e;
  clip-path: polygon(
    0 8px, 8px 8px, 8px 0,
    calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px)
  );
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-8bit-border { animation: none; }
}`,
  },

  // 14. retro-synthwave-grid
  {
    id: "retro-synthwave-grid",
    name: "Synthwave Grid",
    category: "retro",
    description: "Synthwave perspective grid background with horizon glow and animated floor lines",
    tags: ["retro", "synthwave", "grid", "retrowave", "80s"],
    previewType: "background",
    cssCode: `/* Retro: Synthwave Grid */
.roycss-retro-synthwave-grid {
  position: relative;
  background:
    linear-gradient(180deg, #1a0033 0%, #2d0a4e 40%, #ff2d95 60%, #ff6b3d 70%, #1a0033 70.5%, #0a0014 100%);
  overflow: hidden;
}
.roycss-retro-synthwave-grid::before {
  content: "";
  position: absolute;
  left: -50%; right: -50%;
  bottom: 0;
  height: 50%;
  background-image:
    linear-gradient(to right, rgba(255, 45, 149, 0.6) 1px, transparent 1px),
    linear-gradient(to top, rgba(255, 45, 149, 0.6) 1px, transparent 1px);
  background-size: 40px 40px;
  transform: perspective(280px) rotateX(60deg);
  transform-origin: bottom;
  animation: roy-retro-synth-grid 1.4s linear infinite;
}
.roycss-retro-synthwave-grid::after {
  content: "";
  position: absolute;
  left: 50%; top: 60%;
  width: 120px; height: 120px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, #ffe066 0%, #ff6b3d 40%, transparent 70%);
  border-radius: 50%;
  filter: blur(2px);
}
@keyframes roy-retro-synth-grid {
  0%   { background-position: 0 0; }
  100% { background-position: 0 40px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-synthwave-grid::before { animation: none; }
}`,
  },

  // 15. retro-retrowave-sun
  {
    id: "retro-retrowave-sun",
    name: "Retrowave Sun",
    category: "retro",
    description: "Retrowave sun with horizontal scanline cuts and gradient pink-to-yellow glow",
    tags: ["retro", "retrowave", "sun", "synthwave", "80s"],
    previewType: "background",
    cssCode: `/* Retro: Retrowave Sun */
.roycss-retro-retrowave-sun {
  position: relative;
  background: linear-gradient(180deg, #1a0033 0%, #4a0a6e 50%, #2d0a4e 100%);
  overflow: hidden;
}
.roycss-retro-retrowave-sun::before {
  content: "";
  position: absolute;
  left: 50%; top: 45%;
  width: 140px; height: 140px;
  transform: translate(-50%, -50%);
  background: linear-gradient(180deg, #ffe066 0%, #ff6b3d 35%, #ff2d95 65%, #8a1a8a 100%);
  border-radius: 50%;
  box-shadow: 0 0 60px rgba(255, 107, 61, 0.7), 0 0 100px rgba(255, 45, 149, 0.5);
}
.roycss-retro-retrowave-sun::after {
  content: "";
  position: absolute;
  left: 50%; top: 45%;
  width: 140px; height: 140px;
  transform: translate(-50%, -50%);
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 14px,
    #1a0033 14px,
    #1a0033 18px,
    transparent 18px,
    transparent 28px,
    #1a0033 28px,
    #1a0033 34px,
    transparent 34px,
    transparent 48px,
    #1a0033 48px,
    #1a0033 56px,
    transparent 56px,
    transparent 76px,
    #1a0033 76px,
    #1a0033 90px
  );
  border-radius: 50%;
  mix-blend-mode: multiply;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-retrowave-sun::before,
  .roycss-retro-retrowave-sun::after { animation: none; }
}`,
  },

  // 16. retro-dial-up-loader
  {
    id: "retro-dial-up-loader",
    name: "Dial-Up Loader",
    category: "retro",
    description: "Dial-up modem loading animation with pulsing connection dots and handshake rhythm",
    tags: ["retro", "dial-up", "modem", "loader", "90s"],
    previewType: "loader",
    cssCode: `/* Retro: Dial-Up Loader */
.roycss-retro-dial-up-loader {
  position: relative;
  width: 64px;
  height: 64px;
  border: 3px solid #2a2a2a;
  border-top-color: #00ff7f;
  border-radius: 50%;
  background: #0a0a0a;
  animation: roy-retro-dial-spin 1.4s linear infinite;
}
.roycss-retro-dial-up-loader::before {
  content: "";
  position: absolute;
  inset: 10px;
  border: 2px dashed #ff8800;
  border-radius: 50%;
  animation: roy-retro-dial-pulse 0.7s ease-in-out infinite alternate;
}
.roycss-retro-dial-up-loader::after {
  content: "";
  position: absolute;
  inset: 22px;
  background: #00ff7f;
  border-radius: 50%;
  box-shadow: 0 0 12px #00ff7f;
  animation: roy-retro-dial-blink 0.4s steps(2) infinite;
}
@keyframes roy-retro-dial-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes roy-retro-dial-pulse {
  0%   { transform: scale(0.85); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes roy-retro-dial-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.2; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-dial-up-loader,
  .roycss-retro-dial-up-loader::before,
  .roycss-retro-dial-up-loader::after { animation: none; }
}`,
  },

  // 17. retro-floppy-disk-save
  {
    id: "retro-floppy-disk-save",
    name: "Floppy Disk Save",
    category: "retro",
    description: "Floppy disk save icon that wiggles and reveals a saving state on hover",
    tags: ["retro", "floppy", "save", "disk", "icon"],
    previewType: "box",
    cssCode: `/* Retro: Floppy Disk Save */
.roycss-retro-floppy-disk-save {
  width: 70px;
  height: 70px;
  background: linear-gradient(180deg, #1a1a2a 0%, #0a0a14 100%);
  border-radius: 4px;
  border: 2px solid #2a2a3a;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roycss-retro-floppy-disk-save::before {
  content: "";
  position: absolute;
  top: 4px;
  left: 12px; right: 12px;
  height: 22px;
  background: #8a8a8a;
  border-radius: 2px 2px 0 0;
  box-shadow: inset 0 -4px 0 #5a5a5a;
}
.roycss-retro-floppy-disk-save::after {
  content: "";
  position: absolute;
  top: 30px;
  left: 14px; right: 14px;
  bottom: 6px;
  background: linear-gradient(180deg, #d4d4d4 0%, #a8a8a8 100%);
  border-radius: 2px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}
.roycss-retro-floppy-disk-save:hover {
  animation: roy-retro-floppy-wiggle 0.5s ease-in-out;
}
@keyframes roy-retro-floppy-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25%      { transform: rotate(-8deg) scale(1.05); }
  75%      { transform: rotate(8deg) scale(1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-floppy-disk-save:hover { animation: none; transition: none; }
}`,
  },

  // 18. retro-tv-static
  {
    id: "retro-tv-static",
    name: "TV Static",
    category: "retro",
    description: "Old TV static noise effect with shifting grain and phosphor flicker",
    tags: ["retro", "tv", "static", "noise", "nostalgic"],
    previewType: "background",
    cssCode: `/* Retro: TV Static */
.roycss-retro-tv-static {
  position: relative;
  background: #0a0a0a;
  overflow: hidden;
  border-radius: 8px;
}
.roycss-retro-tv-static::before {
  content: "";
  position: absolute;
  inset: -50%;
  background-image:
    repeating-conic-gradient(
      from 0deg at 50% 50%,
      #ffffff 0deg, #888888 1deg, #ffffff 2deg, #444444 3deg,
      #cccccc 4deg, #222222 5deg, #eeeeee 6deg, #555555 7deg
    );
  background-size: 4px 4px;
  animation: roy-retro-tv-static 0.18s steps(6) infinite;
  opacity: 0.65;
  mix-blend-mode: screen;
}
.roycss-retro-tv-static::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
  animation: roy-retro-tv-flicker 0.4s steps(2) infinite;
}
@keyframes roy-retro-tv-static {
  0%   { transform: translate(0,0); background-position: 0 0; }
  20%  { transform: translate(-4px, 2px); background-position: 4px -2px; }
  40%  { transform: translate(3px, -3px); background-position: -3px 3px; }
  60%  { transform: translate(-2px, 4px); background-position: 2px -4px; }
  80%  { transform: translate(4px, 1px); background-position: -4px 2px; }
  100% { transform: translate(-3px, -2px); background-position: 3px 4px; }
}
@keyframes roy-retro-tv-flicker {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.85; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-tv-static::before,
  .roycss-retro-tv-static::after { animation: none; }
}`,
  },

  // 19. retro-tape-deck-buttons
  {
    id: "retro-tape-deck-buttons",
    name: "Tape Deck Buttons",
    category: "retro",
    description: "Tape deck transport buttons that depress on hover with mechanical feedback",
    tags: ["retro", "tape", "deck", "button", "press"],
    previewType: "button",
    previewText: "▶ ■ ⏸",
    cssCode: `/* Retro: Tape Deck Buttons */
.roycss-retro-tape-deck-buttons {
  display: inline-flex;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
  border-radius: 4px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.5);
  color: #c8c8c8;
  font-family: ui-monospace, monospace;
  font-size: 1.1rem;
  letter-spacing: 0.4em;
  cursor: pointer;
  transition: transform 0.1s ease-out, box-shadow 0.1s ease-out, color 0.1s;
}
.roycss-retro-tape-deck-buttons:hover {
  color: #ff6b00;
  text-shadow: 0 0 6px rgba(255, 107, 0, 0.6);
  transform: translateY(1px);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.3);
}
.roycss-retro-tape-deck-buttons:active {
  transform: translateY(3px);
  box-shadow: inset 0 4px 6px rgba(0,0,0,0.8);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-tape-deck-buttons,
  .roycss-retro-tape-deck-buttons:hover,
  .roycss-retro-tape-deck-buttons:active {
    transition: none;
    transform: none;
  }
}`,
  },

  // 20. retro-coin-insert
  {
    id: "retro-coin-insert",
    name: "Coin Insert",
    category: "retro",
    description: "Arcade coin insert animation that drops and spins into the slot with a shine",
    tags: ["retro", "arcade", "coin", "insert", "slot"],
    previewType: "box",
    cssCode: `/* Retro: Coin Insert */
.roycss-retro-coin-insert {
  position: relative;
  width: 80px;
  height: 80px;
  background: linear-gradient(180deg, #1a1a2e 0%, #0a0a14 100%);
  border-radius: 8px;
  overflow: hidden;
}
.roycss-retro-coin-insert::before {
  content: "★";
  position: absolute;
  left: 50%;
  top: -40px;
  width: 36px;
  height: 36px;
  margin-left: -18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 35% 35%, #fff5b0 0%, #ffd700 30%, #c8a000 70%, #8a6a00 100%);
  color: #8a6a00;
  font-size: 1.1rem;
  font-weight: 900;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
  animation: roy-retro-coin-drop 1.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) infinite;
}
.roycss-retro-coin-insert::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 14px;
  width: 40px;
  height: 4px;
  margin-left: -20px;
  background: #000;
  border-radius: 2px;
  box-shadow: inset 0 1px 2px rgba(255,255,255,0.1);
}
@keyframes roy-retro-coin-drop {
  0% {
    top: -40px;
    transform: rotateY(0deg) scale(1);
    opacity: 1;
  }
  60% {
    top: 60%;
    transform: rotateY(720deg) scale(0.8);
    opacity: 1;
  }
  75% {
    top: 60%;
    transform: rotateY(720deg) scale(0.3, 0.6);
    opacity: 0.6;
  }
  85% {
    top: 70%;
    transform: rotateY(720deg) scale(0.1, 0.1);
    opacity: 0;
  }
  100% {
    top: -40px;
    transform: rotateY(0deg) scale(1);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-retro-coin-insert::before { animation: none; top: 40%; }
}`,
  },
];
