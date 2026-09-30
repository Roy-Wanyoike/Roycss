import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 41 — Advanced Text Effects (20 effects)
 * Cinematic text treatments that go beyond basic styling: typewriters,
 * decoders, path-following text, kinetic fly-ins, RGB / scanline / VHS
 * glitches, neon signs, split-flap boards, mask reveals, image-clipped
 * fills, and layered long-shadows. All effects are pure CSS — no JS —
 * and honor prefers-reduced-motion. Whole-text effects use
 * `previewType: "text"` (single span). Per-letter effects use
 * `previewType: "loader"` with `childCount: 6` and a per-child
 * `::before { content: "…" }` to spell "RoyCSS".
 * Classes are prefixed `roycss-advtext-` and keyframes `roy-advtext-`.
 */
export const effectsBatch41: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ADVANCED TEXT EFFECTS (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. advtext-typewriter-cursor
  {
    id: "advtext-typewriter-cursor",
    name: "Typewriter Cursor",
    category: "advanced-text",
    description:
      "Text reveals one character at a time with a blinking caret at the end",
    tags: ["advanced-text", "typewriter", "cursor", "reveal", "typing"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Typewriter Cursor */
.roycss-advtext-typewriter-cursor {
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: oklch(0.929 0.013 255.51);
  white-space: nowrap;
  overflow: hidden;
  border-right: 2px solid oklch(0.754 0.139 232.66);
  width: 0;
  animation: roy-advtext-typewriter 2.4s steps(6, end) 0.3s both,
             roy-advtext-caret 0.7s step-end infinite;
}
@keyframes roy-advtext-typewriter {
  from { width: 0; }
  to   { width: 6ch; }
}
@keyframes roy-advtext-caret {
  50% { border-color: transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-typewriter-cursor {
    width: auto;
    animation: none;
    border-right-color: oklch(0.754 0.139 232.66);
  }
}`,
  },

  // 2. advtext-scramble-decrypt
  {
    id: "advtext-scramble-decrypt",
    name: "Scramble Decrypt",
    category: "advanced-text",
    description:
      "Hacker-style decode: characters blur through random values before settling",
    tags: ["advanced-text", "scramble", "decrypt", "hacker", "glitch"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Scramble Decrypt */
.roycss-advtext-scramble-decrypt {
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: oklch(0.773 0.153 163.22);
  position: relative;
  letter-spacing: 0.05em;
  animation: roy-advtext-scramble-settle 2.4s steps(8, end) infinite;
  filter: blur(0.4px);
  text-shadow: 0 0 6px rgba(52, 211, 153, 0.6);
}
@keyframes roy-advtext-scramble-settle {
  0%   { letter-spacing: 0.18em; filter: blur(1.6px); opacity: 0.4; transform: skewX(-3deg); }
  35%  { letter-spacing: 0.12em; filter: blur(0.9px); opacity: 0.7; transform: skewX(2deg); }
  65%  { letter-spacing: 0.07em; filter: blur(0.4px); opacity: 0.9; transform: skewX(-1deg); }
  85%  { letter-spacing: 0.05em; filter: blur(0.2px); opacity: 1; transform: skewX(0deg); }
  100% { letter-spacing: 0.05em; filter: blur(0); opacity: 1; transform: skewX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-scramble-decrypt { animation: none; filter: none; }
}`,
  },

  // 3. advtext-on-path
  {
    id: "advtext-on-path",
    name: "Text On Path",
    category: "advanced-text",
    description:
      "Text rides along a curved SVG-like offset-path, orbiting a closed loop",
    tags: ["advanced-text", "offset-path", "path", "curve", "orbit"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Text On Path */
.roycss-advtext-on-path {
  display: inline-block;
  font-weight: 700;
  color: oklch(0.833 0.132 321.43);
  offset-path: path("M -90,40 C -60,-30 60,-30 90,40 C 60,110 -60,110 -90,40 Z");
  offset-rotate: 0deg;
  animation: roy-advtext-on-path 9s linear infinite;
  text-shadow: 0 0 10px rgba(240, 171, 252, 0.6);
}
@keyframes roy-advtext-on-path {
  from { offset-distance: 0%; }
  to   { offset-distance: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-on-path { animation: none; offset-path: none; }
}`,
  },

  // 4. advtext-kinetic-fly
  {
    id: "advtext-kinetic-fly",
    name: "Kinetic Fly-In",
    category: "advanced-text",
    description:
      "Each letter of the word flies in from below with a staggered kinetic cascade",
    tags: ["advanced-text", "kinetic", "fly", "stagger", "entrance"],
    previewType: "loader",
    childCount: 6,
    cssCode: `/* Advanced Text: Kinetic Fly-In */
.roycss-advtext-kinetic-fly {
  display: inline-flex;
  gap: 0.04em;
  font-weight: 800;
  font-size: 2rem;
  color: oklch(0.837 0.164 84.43);
  font-family: ui-sans-serif, system-ui, sans-serif;
  perspective: 600px;
}
.roycss-advtext-kinetic-fly > span {
  display: inline-block;
  opacity: 0;
  transform: translateY(80px) rotateX(-90deg);
  animation: roy-advtext-kinetic-fly 1s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.roycss-advtext-kinetic-fly > span::before {
  content: attr(data-letter);
}
.roycss-advtext-kinetic-fly > span:nth-child(1)::before { content: "R"; }
.roycss-advtext-kinetic-fly > span:nth-child(2)::before { content: "o"; }
.roycss-advtext-kinetic-fly > span:nth-child(3)::before { content: "y"; }
.roycss-advtext-kinetic-fly > span:nth-child(4)::before { content: "C"; }
.roycss-advtext-kinetic-fly > span:nth-child(5)::before { content: "S"; }
.roycss-advtext-kinetic-fly > span:nth-child(6)::before { content: "S"; }
.roycss-advtext-kinetic-fly > span:nth-child(1) { animation-delay: 0.00s; }
.roycss-advtext-kinetic-fly > span:nth-child(2) { animation-delay: 0.08s; }
.roycss-advtext-kinetic-fly > span:nth-child(3) { animation-delay: 0.16s; }
.roycss-advtext-kinetic-fly > span:nth-child(4) { animation-delay: 0.24s; }
.roycss-advtext-kinetic-fly > span:nth-child(5) { animation-delay: 0.32s; }
.roycss-advtext-kinetic-fly > span:nth-child(6) { animation-delay: 0.40s; }
@keyframes roy-advtext-kinetic-fly {
  0%   { opacity: 0; transform: translateY(80px) rotateX(-90deg); }
  60%  { opacity: 1; transform: translateY(-10px) rotateX(15deg); }
  100% { opacity: 1; transform: translateY(0) rotateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-kinetic-fly > span { animation: none; opacity: 1; transform: none; }
}`,
  },

  // 5. advtext-fill-gradient
  {
    id: "advtext-fill-gradient",
    name: "Gradient Fill Sweep",
    category: "advanced-text",
    description:
      "Transparent text fills left-to-right with a colorful gradient sweep on load",
    tags: ["advanced-text", "gradient", "fill", "sweep", "background-clip"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Gradient Fill Sweep */
.roycss-advtext-fill-gradient {
  display: inline-block;
  font-weight: 800;
  font-size: 2rem;
  background: linear-gradient(90deg, oklch(0.645 0.215 16.44) 0%, oklch(0.769 0.165 70.08) 25%, oklch(0.696 0.149 162.48) 50%, oklch(0.715 0.126 215.22) 75%, oklch(0.606 0.219 292.72) 100%);
  background-size: 300% 100%;
  background-position: 100% 0;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  background-repeat: no-repeat;
  animation: roy-advtext-fill-sweep 2.6s cubic-bezier(0.65, 0, 0.35, 1) 0.2s both;
}
@keyframes roy-advtext-fill-sweep {
  from { background-position: 200% 0; -webkit-text-fill-color: transparent; }
  to   { background-position: 0% 0; -webkit-text-fill-color: transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-fill-gradient { animation: none; background-position: 0 0; }
}`,
  },

  // 6. advtext-3d-extruded
  {
    id: "advtext-3d-extruded",
    name: "3D Extruded Text",
    category: "advanced-text",
    description:
      "Text extruded into 3D using stacked text-shadows with subtle breathing depth",
    tags: ["advanced-text", "3d", "extruded", "depth", "text-shadow"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: 3D Extruded */
.roycss-advtext-3d-extruded {
  display: inline-block;
  font-weight: 900;
  font-size: 2.4rem;
  letter-spacing: 0.02em;
  color: oklch(0.837 0.164 84.43);
  text-shadow:
    1px 1px 0 oklch(0.666 0.157 58.32),
    2px 2px 0 oklch(0.555 0.146 49),
    3px 3px 0 oklch(0.473 0.125 46.2),
    4px 4px 0 oklch(0.414 0.105 45.9),
    5px 5px 0 oklch(0.347 0.083 48.23),
    6px 6px 0 oklch(0.286 0.062 50.58),
    7px 7px 0 oklch(0.22 0.043 50.18),
    8px 8px 12px rgba(0, 0, 0, 0.45);
  animation: roy-advtext-3d-breath 4s ease-in-out infinite;
  transform-style: preserve-3d;
}
@keyframes roy-advtext-3d-breath {
  0%, 100% { transform: perspective(400px) rotateX(0deg) scale(1); }
  50%      { transform: perspective(400px) rotateX(8deg) scale(1.04); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-3d-extruded { animation: none; transform: none; }
}`,
  },

  // 7. advtext-glitch-rgb
  {
    id: "advtext-glitch-rgb",
    name: "RGB Split Glitch",
    category: "advanced-text",
    description:
      "Cyan and magenta color channels split and shift around the text on a loop",
    tags: ["advanced-text", "glitch", "rgb", "split", "chromatic"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: RGB Split Glitch */
.roycss-advtext-glitch-rgb {
  display: inline-block;
  position: relative;
  font-weight: 800;
  font-size: 2.2rem;
  color: oklch(0.984 0.003 247.86);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.roycss-advtext-glitch-rgb::before,
.roycss-advtext-glitch-rgb::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: screen;
}
.roycss-advtext-glitch-rgb::before {
  color: oklch(0.797 0.134 211.53);
  animation: roy-advtext-glitch-r 2.6s steps(2, end) infinite;
}
.roycss-advtext-glitch-rgb::after {
  color: oklch(0.645 0.215 16.44);
  animation: roy-advtext-glitch-b 2.6s steps(2, end) infinite;
}
/* Fall back to attr() passthrough via text content when data-text missing */
.roycss-advtext-glitch-rgb::before { content: "RoyCSS"; }
.roycss-advtext-glitch-rgb::after  { content: "RoyCSS"; }
@keyframes roy-advtext-glitch-r {
  0%, 100% { transform: translate(0, 0); }
  20%      { transform: translate(-3px, 1px); }
  40%      { transform: translate(2px, -1px); }
  60%      { transform: translate(-2px, 2px); }
  80%      { transform: translate(1px, -2px); }
}
@keyframes roy-advtext-glitch-b {
  0%, 100% { transform: translate(0, 0); }
  20%      { transform: translate(3px, -1px); }
  40%      { transform: translate(-2px, 1px); }
  60%      { transform: translate(2px, -2px); }
  80%      { transform: translate(-1px, 2px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-glitch-rgb::before,
  .roycss-advtext-glitch-rgb::after { animation: none; }
}`,
  },

  // 8. advtext-glitch-scanline
  {
    id: "advtext-glitch-scanline",
    name: "Scanline Glitch",
    category: "advanced-text",
    description:
      "Horizontal scan tear slices across the text while a scanline rolls vertically",
    tags: ["advanced-text", "glitch", "scanline", "tear", "tv"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Scanline Glitch */
.roycss-advtext-glitch-scanline {
  display: inline-block;
  position: relative;
  font-weight: 800;
  font-size: 2.2rem;
  color: oklch(0.929 0.013 255.51);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  clip-path: inset(0 0 0 0);
  animation: roy-advtext-scan-tear 2.4s steps(2, end) infinite;
}
.roycss-advtext-glitch-scanline::after {
  content: "";
  position: absolute;
  left: -10%; right: -10%;
  top: 0;
  height: 8%;
  background: linear-gradient(180deg, rgba(34, 211, 238, 0.45), transparent);
  mix-blend-mode: screen;
  animation: roy-advtext-scan-roll 2.4s linear infinite;
  pointer-events: none;
}
@keyframes roy-advtext-scan-tear {
  0%, 100% { clip-path: inset(0 0 0 0); transform: translateX(0); }
  25%      { clip-path: inset(20% 0 60% 0); transform: translateX(-3px); }
  50%      { clip-path: inset(60% 0 10% 0); transform: translateX(2px); }
  75%      { clip-path: inset(40% 0 35% 0); transform: translateX(-1px); }
}
@keyframes roy-advtext-scan-roll {
  from { top: -10%; }
  to   { top: 110%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-glitch-scanline,
  .roycss-advtext-glitch-scanline::after { animation: none; }
}`,
  },

  // 9. advtext-glitch-vhs
  {
    id: "advtext-glitch-vhs",
    name: "VHS Tracking Glitch",
    category: "advanced-text",
    description:
      "VHS tracking distortion: text wobbles with hue-shifted ghosting and noise bars",
    tags: ["advanced-text", "glitch", "vhs", "tracking", "retro"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: VHS Tracking Glitch */
.roycss-advtext-glitch-vhs {
  display: inline-block;
  position: relative;
  font-weight: 700;
  font-size: 2.2rem;
  color: oklch(0.968 0.007 247.9);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  animation: roy-advtext-vhs-wobble 3s ease-in-out infinite;
  filter: saturate(1.3) contrast(1.05);
  text-shadow: 1px 0 0 rgba(255, 0, 80, 0.6), -1px 0 0 rgba(0, 200, 255, 0.6);
}
.roycss-advtext-glitch-vhs::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  background-size: 100% 3px, 100% 200%;
  mix-blend-mode: overlay;
  animation: roy-advtext-vhs-track 3s linear infinite;
  pointer-events: none;
}
@keyframes roy-advtext-vhs-wobble {
  0%, 100% { transform: translateX(0) skewX(0deg); filter: hue-rotate(0deg) saturate(1.3); }
  20%      { transform: translateX(-2px) skewX(-1deg); filter: hue-rotate(-12deg) saturate(1.4); }
  40%      { transform: translateX(2px) skewX(1deg); filter: hue-rotate(10deg) saturate(1.2); }
  60%      { transform: translateX(-1px) skewX(0deg); filter: hue-rotate(-6deg) saturate(1.3); }
  80%      { transform: translateX(1px) skewX(0.5deg); filter: hue-rotate(8deg) saturate(1.4); }
}
@keyframes roy-advtext-vhs-track {
  from { background-position: 0 0, 0 0%; }
  to   { background-position: 0 3px, 0 200%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-glitch-vhs,
  .roycss-advtext-glitch-vhs::before { animation: none; }
}`,
  },

  // 10. advtext-split-flap
  {
    id: "advtext-split-flap",
    name: "Split-Flap Board",
    category: "advanced-text",
    description:
      "Airport departure-board flip: each letter tumbles into place on its own axis",
    tags: ["advanced-text", "split-flap", "flip", "departure", "stagger"],
    previewType: "loader",
    childCount: 6,
    cssCode: `/* Advanced Text: Split-Flap Board */
.roycss-advtext-split-flap {
  display: inline-flex;
  gap: 0.15em;
  font-weight: 800;
  font-size: 2rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: oklch(0.278 0.03 256.85);
  padding: 0.25em 0.4em;
  background: oklch(0.208 0.04 265.75);
  border-radius: 0.4em;
}
.roycss-advtext-split-flap > span {
  display: inline-block;
  width: 1.1em;
  text-align: center;
  background: linear-gradient(oklch(0.837 0.164 84.43), oklch(0.666 0.157 58.32));
  border-radius: 0.15em;
  transform-origin: center top;
  backface-visibility: hidden;
  animation: roy-advtext-flip 2.4s ease-in-out infinite;
}
.roycss-advtext-split-flap > span::before { display: block; }
.roycss-advtext-split-flap > span:nth-child(1)::before { content: "R"; }
.roycss-advtext-split-flap > span:nth-child(2)::before { content: "o"; }
.roycss-advtext-split-flap > span:nth-child(3)::before { content: "y"; }
.roycss-advtext-split-flap > span:nth-child(4)::before { content: "C"; }
.roycss-advtext-split-flap > span:nth-child(5)::before { content: "S"; }
.roycss-advtext-split-flap > span:nth-child(6)::before { content: "S"; }
.roycss-advtext-split-flap > span:nth-child(1) { animation-delay: 0s; }
.roycss-advtext-split-flap > span:nth-child(2) { animation-delay: 0.18s; }
.roycss-advtext-split-flap > span:nth-child(3) { animation-delay: 0.36s; }
.roycss-advtext-split-flap > span:nth-child(4) { animation-delay: 0.54s; }
.roycss-advtext-split-flap > span:nth-child(5) { animation-delay: 0.72s; }
.roycss-advtext-split-flap > span:nth-child(6) { animation-delay: 0.90s; }
@keyframes roy-advtext-flip {
  0%, 30%   { transform: rotateX(0deg); }
  45%       { transform: rotateX(-90deg); }
  60%, 100% { transform: rotateX(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-split-flap > span { animation: none; }
}`,
  },

  // 11. advtext-marquee-modern
  {
    id: "advtext-marquee-modern",
    name: "Modern Marquee",
    category: "advanced-text",
    description:
      "Smooth horizontal marquee with fade edges and pause-on-hover for readability",
    tags: ["advanced-text", "marquee", "scroll", "fade", "hover"],
    previewType: "text",
    previewText: "RoyCSS  ✦  Pure CSS Effects  ✦  ",
    cssCode: `/* Advanced Text: Modern Marquee */
.roycss-advtext-marquee-modern {
  display: inline-block;
  position: relative;
  font-weight: 700;
  font-size: 1.5rem;
  color: oklch(0.833 0.132 321.43);
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  -webkit-mask-image: linear-gradient(90deg, transparent, oklch(0 0 0) 12%, oklch(0 0 0) 88%, transparent);
  mask-image: linear-gradient(90deg, transparent, oklch(0 0 0) 12%, oklch(0 0 0) 88%, transparent);
  padding-block: 0.25em;
}
.roycss-advtext-marquee-modern::after {
  content: attr(data-text);
  display: inline-block;
  padding-left: 2ch;
  animation: roy-advtext-marquee 9s linear infinite;
}
.roycss-advtext-marquee-modern:hover::after {
  animation-play-state: paused;
}
@keyframes roy-advtext-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-100%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-marquee-modern::after { animation: none; }
}`,
  },

  // 12. advtext-outline-draw
  {
    id: "advtext-outline-draw",
    name: "Outline Draw",
    category: "advanced-text",
    description:
      "Hollow text outline that progressively draws itself with a sweeping gradient mask",
    tags: ["advanced-text", "outline", "draw", "stroke", "mask"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Outline Draw */
.roycss-advtext-outline-draw {
  display: inline-block;
  font-weight: 900;
  font-size: 2.6rem;
  letter-spacing: 0.04em;
  color: transparent;
  -webkit-text-stroke: 2px oklch(0.855 0.125 181.07);
  background: linear-gradient(90deg, oklch(0.704 0.123 182.5) 0%, oklch(0.855 0.125 181.07) 50%, oklch(0.905 0.089 164.15) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-mask-image: linear-gradient(90deg, oklch(0 0 0) 0%, oklch(0 0 0) var(--p, 0%), transparent var(--p, 0%));
  mask-image: linear-gradient(90deg, oklch(0 0 0) 0%, oklch(0 0 0) var(--p, 0%), transparent var(--p, 0%));
  animation: roy-advtext-outline-draw 2.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes roy-advtext-outline-draw {
  0%   { --p: 0%;   -webkit-text-fill-color: transparent; }
  70%  { --p: 100%; -webkit-text-fill-color: transparent; }
  85%  { --p: 100%; -webkit-text-fill-color: oklch(0.855 0.125 181.07); }
  100% { --p: 100%; -webkit-text-fill-color: oklch(0.855 0.125 181.07); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-outline-draw {
    animation: none;
    --p: 100%;
    -webkit-text-fill-color: oklch(0.855 0.125 181.07);
  }
}`,
  },

  // 13. advtext-neon-sign
  {
    id: "advtext-neon-sign",
    name: "Neon Sign Flicker",
    category: "advanced-text",
    description:
      "Glowing neon-tube text that flickers irregularly like an aging bar sign",
    tags: ["advanced-text", "neon", "glow", "flicker", "sign"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Neon Sign Flicker */
.roycss-advtext-neon-sign {
  display: inline-block;
  font-weight: 800;
  font-size: 2.6rem;
  letter-spacing: 0.06em;
  color: oklch(1 0 89.88);
  text-shadow:
    0 0 4px oklch(1 0 89.88),
    0 0 10px oklch(1 0 89.88),
    0 0 20px oklch(0.665 0.249 357.34),
    0 0 38px oklch(0.665 0.249 357.34),
    0 0 60px oklch(0.665 0.249 357.34),
    0 0 90px oklch(0.665 0.249 357.34);
  animation: roy-advtext-neon-flicker 3.2s linear infinite;
}
@keyframes roy-advtext-neon-flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% {
    text-shadow:
      0 0 4px oklch(1 0 89.88),
      0 0 10px oklch(1 0 89.88),
      0 0 20px oklch(0.665 0.249 357.34),
      0 0 38px oklch(0.665 0.249 357.34),
      0 0 60px oklch(0.665 0.249 357.34),
      0 0 90px oklch(0.665 0.249 357.34);
    opacity: 1;
  }
  20%, 24%, 55% {
    text-shadow: none;
    opacity: 0.4;
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-neon-sign { animation: none; opacity: 1; }
}`,
  },

  // 14. advtext-gradient-animated
  {
    id: "advtext-gradient-animated",
    name: "Animated Gradient Text",
    category: "advanced-text",
    description:
      "Text fill animated by a multi-stop gradient that continuously shifts hue",
    tags: ["advanced-text", "gradient", "animated", "rainbow", "background-clip"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Animated Gradient Text */
.roycss-advtext-gradient-animated {
  display: inline-block;
  font-weight: 900;
  font-size: 2.4rem;
  background: linear-gradient(90deg, oklch(0.645 0.215 16.44), oklch(0.769 0.165 70.08), oklch(0.696 0.149 162.48), oklch(0.715 0.126 215.22), oklch(0.606 0.219 292.72), oklch(0.645 0.215 16.44));
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: roy-advtext-gradient-shift 6s linear infinite;
}
@keyframes roy-advtext-gradient-shift {
  from { background-position: 0% 0; }
  to   { background-position: 300% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-gradient-animated { animation: none; background-position: 0 0; }
}`,
  },

  // 15. advtext-shadow-layered
  {
    id: "advtext-shadow-layered",
    name: "Layered Long Shadow",
    category: "advanced-text",
    description:
      "Many stacked text-shadows create a soft, layered long shadow with breathing depth",
    tags: ["advanced-text", "shadow", "long-shadow", "layered", "depth"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Layered Long Shadow */
.roycss-advtext-shadow-layered {
  display: inline-block;
  font-weight: 900;
  font-size: 2.4rem;
  letter-spacing: 0.04em;
  color: oklch(1 0 89.88);
  background: linear-gradient(135deg, oklch(0.719 0.169 13.43), oklch(0.769 0.165 70.08));
  text-shadow:
    1px 1px 0 rgba(251, 113, 133, 0.85),
    2px 2px 0 rgba(245, 158, 11, 0.8),
    3px 3px 0 rgba(251, 113, 133, 0.75),
    4px 4px 0 rgba(245, 158, 11, 0.7),
    5px 5px 0 rgba(251, 113, 133, 0.65),
    6px 6px 0 rgba(245, 158, 11, 0.6),
    7px 7px 0 rgba(251, 113, 133, 0.55),
    8px 8px 0 rgba(245, 158, 11, 0.5),
    9px 9px 0 rgba(251, 113, 133, 0.45),
    10px 10px 14px rgba(0, 0, 0, 0.4);
  animation: roy-advtext-shadow-breathe 4.5s ease-in-out infinite;
}
@keyframes roy-advtext-shadow-breathe {
  0%, 100% { transform: translateY(0); filter: brightness(1); }
  50%      { transform: translateY(-4px); filter: brightness(1.1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-shadow-layered { animation: none; }
}`,
  },

  // 16. advtext-mask-reveal
  {
    id: "advtext-mask-reveal",
    name: "Mask Reveal",
    category: "advanced-text",
    description:
      "Text is revealed left-to-right by an animated clip-path mask wipe on loop",
    tags: ["advanced-text", "mask", "reveal", "wipe", "clip-path"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Mask Reveal */
.roycss-advtext-mask-reveal {
  display: inline-block;
  position: relative;
  font-weight: 800;
  font-size: 2.4rem;
  color: oklch(0.711 0.035 256.79);
  letter-spacing: 0.04em;
}
.roycss-advtext-mask-reveal::before {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  color: oklch(0.754 0.139 232.66);
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
  clip-path: inset(0 100% 0 0);
  animation: roy-advtext-mask-wipe 3s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
.roycss-advtext-mask-reveal::before { content: "RoyCSS"; }
@keyframes roy-advtext-mask-wipe {
  0%      { clip-path: inset(0 100% 0 0); }
  55%, 70% { clip-path: inset(0 0 0 0); }
  100%    { clip-path: inset(0 0 0 100%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-mask-reveal::before { animation: none; clip-path: inset(0 0 0 0); }
}`,
  },

  // 17. advtext-stretch-bounce
  {
    id: "advtext-stretch-bounce",
    name: "Stretch Bounce",
    category: "advanced-text",
    description:
      "Text stretches vertically and snaps back with an elastic bounce on load",
    tags: ["advanced-text", "stretch", "bounce", "elastic", "entrance"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Stretch Bounce */
.roycss-advtext-stretch-bounce {
  display: inline-block;
  font-weight: 900;
  font-size: 2.4rem;
  color: oklch(0.725 0.175 349.76);
  transform-origin: center bottom;
  animation: roy-advtext-stretch-bounce 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
@keyframes roy-advtext-stretch-bounce {
  0%   { transform: scaleY(0.2) scaleX(1.8); opacity: 0; }
  40%  { transform: scaleY(1.4) scaleX(0.8); opacity: 1; }
  55%  { transform: scaleY(0.85) scaleX(1.1); }
  70%  { transform: scaleY(1.08) scaleX(0.97); }
  85%  { transform: scaleY(0.98) scaleX(1.01); }
  100% { transform: scaleY(1) scaleX(1); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-stretch-bounce { animation: none; transform: none; }
}`,
  },

  // 18. advtext-typewriter-multi
  {
    id: "advtext-typewriter-multi",
    name: "Multi-Line Typewriter",
    category: "advanced-text",
    description:
      "Two-line typewriter reveals character by character with a soft blinking caret",
    tags: ["advanced-text", "typewriter", "multi-line", "cursor", "typing"],
    previewType: "text",
    previewText: "Hello\\nWorld",
    cssCode: `/* Advanced Text: Multi-Line Typewriter */
.roycss-advtext-typewriter-multi {
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.5rem;
  color: oklch(0.929 0.013 255.51);
  white-space: pre;
  overflow: hidden;
  border-right: 2px solid oklch(0.8 0.182 151.71);
  width: 0;
  max-width: 12ch;
  animation: roy-advtext-tw-multi 4s steps(12, end) 0.3s infinite alternate,
             roy-advtext-tw-caret 0.7s step-end infinite;
}
@keyframes roy-advtext-tw-multi {
  0%   { width: 0; }
  60%  { width: 12ch; }
  90%  { width: 12ch; }
  100% { width: 12ch; }
}
@keyframes roy-advtext-tw-caret {
  50% { border-color: transparent; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-typewriter-multi {
    width: 12ch;
    animation: none;
    border-right-color: oklch(0.8 0.182 151.71);
  }
}`,
  },

  // 19. advtext-wave-bounce
  {
    id: "advtext-wave-bounce",
    name: "Wave Bounce",
    category: "advanced-text",
    description:
      "Each letter bounces in a sequential wave pattern across the word",
    tags: ["advanced-text", "wave", "bounce", "stagger", "rhythm"],
    previewType: "loader",
    childCount: 6,
    cssCode: `/* Advanced Text: Wave Bounce */
.roycss-advtext-wave-bounce {
  display: inline-flex;
  gap: 0.04em;
  font-weight: 800;
  font-size: 2.2rem;
  color: oklch(0.797 0.134 211.53);
  font-family: ui-sans-serif, system-ui, sans-serif;
  perspective: 500px;
}
.roycss-advtext-wave-bounce > span {
  display: inline-block;
  transform-origin: center bottom;
  animation: roy-advtext-wave-bounce 1.4s ease-in-out infinite;
}
.roycss-advtext-wave-bounce > span::before { display: inline-block; }
.roycss-advtext-wave-bounce > span:nth-child(1)::before { content: "R"; }
.roycss-advtext-wave-bounce > span:nth-child(2)::before { content: "o"; }
.roycss-advtext-wave-bounce > span:nth-child(3)::before { content: "y"; }
.roycss-advtext-wave-bounce > span:nth-child(4)::before { content: "C"; }
.roycss-advtext-wave-bounce > span:nth-child(5)::before { content: "S"; }
.roycss-advtext-wave-bounce > span:nth-child(6)::before { content: "S"; }
.roycss-advtext-wave-bounce > span:nth-child(1) { animation-delay: 0.00s; }
.roycss-advtext-wave-bounce > span:nth-child(2) { animation-delay: 0.10s; }
.roycss-advtext-wave-bounce > span:nth-child(3) { animation-delay: 0.20s; }
.roycss-advtext-wave-bounce > span:nth-child(4) { animation-delay: 0.30s; }
.roycss-advtext-wave-bounce > span:nth-child(5) { animation-delay: 0.40s; }
.roycss-advtext-wave-bounce > span:nth-child(6) { animation-delay: 0.50s; }
@keyframes roy-advtext-wave-bounce {
  0%, 60%, 100% { transform: translateY(0) scale(1, 1); }
  30%           { transform: translateY(-22px) scale(0.9, 1.15); }
  45%           { transform: translateY(0) scale(1.12, 0.88); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-wave-bounce > span { animation: none; }
}`,
  },

  // 20. advtext-clip-image
  {
    id: "advtext-clip-image",
    name: "Image Clip Text",
    category: "advanced-text",
    description:
      "Text is clipped to show an image fill that pans slowly across the letters",
    tags: ["advanced-text", "clip", "image", "background-clip", "pan"],
    previewType: "text",
    previewText: "RoyCSS",
    cssCode: `/* Advanced Text: Image Clip Text */
.roycss-advtext-clip-image {
  display: inline-block;
  font-weight: 900;
  font-size: 2.6rem;
  letter-spacing: 0.04em;
  background-image:
    linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent),
    linear-gradient(135deg, oklch(0.705 0.187 47.6) 0%, oklch(0.656 0.212 354.31) 35%, oklch(0.606 0.219 292.72) 70%, oklch(0.715 0.126 215.22) 100%);
  background-size: 40px 40px, 250% 250%;
  background-position: 0 0, 0% 0%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
  animation: roy-advtext-clip-pan 8s ease-in-out infinite alternate;
}
@keyframes roy-advtext-clip-pan {
  0%   { background-position: 0 0, 0% 0%; }
  100% { background-position: 80px 80px, 100% 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-advtext-clip-image { animation: none; }
}`,
  },
];

export default effectsBatch41;
