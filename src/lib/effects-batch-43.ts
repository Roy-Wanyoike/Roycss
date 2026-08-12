import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 43 — Audio-Reactive Visual Effects (20 effects)
 * Pure-CSS simulations of audio-reactive visuals: equalizers, waveforms,
 * vinyl, ripples, VU meters, spectrum analyzers, and beat pulses.
 * No JavaScript, no real audio — every motion is a CSS keyframe illusion.
 * All classes are prefixed `roycss-audio-` and keyframes `roy-audio-`.
 * Each effect honors prefers-reduced-motion.
 */
export const effectsBatch43: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // AUDIO-REACTIVE (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. audio-equalizer-bars
  {
    id: "audio-equalizer-bars",
    name: "Equalizer Bars",
    category: "audio",
    description: "Vertical bars simulating frequency response with staggered heights",
    tags: ["audio", "equalizer", "bars", "frequency", "music", "infinite"],
    previewType: "box",
    childCount: 5,
    cssCode: `/* Audio: Equalizer Bars */
.roycss-audio-equalizer-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 100%;
}
.roycss-audio-equalizer-bars > span {
  width: 8px;
  background: linear-gradient(to top, oklch(0.55 0.22 230), oklch(0.7 0.22 200));
  border-radius: 2px;
  animation: roy-audio-equalizer-bars 1s ease-in-out infinite;
}
.roycss-audio-equalizer-bars > span:nth-child(1) { animation-delay: 0s;   animation-duration: 0.9s; }
.roycss-audio-equalizer-bars > span:nth-child(2) { animation-delay: 0.2s; animation-duration: 1.1s; }
.roycss-audio-equalizer-bars > span:nth-child(3) { animation-delay: 0.4s; animation-duration: 0.8s; }
.roycss-audio-equalizer-bars > span:nth-child(4) { animation-delay: 0.1s; animation-duration: 1.2s; }
.roycss-audio-equalizer-bars > span:nth-child(5) { animation-delay: 0.3s; animation-duration: 1s; }
@keyframes roy-audio-equalizer-bars {
  0%, 100% { height: 25%; }
  50%      { height: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-equalizer-bars > span { animation: none; height: 60%; }
}`,
  },

  // 2. audio-vinyl-spin
  {
    id: "audio-vinyl-spin",
    name: "Vinyl Spin",
    category: "audio",
    description: "Rotating vinyl record with concentric grooves and a tone arm",
    tags: ["audio", "vinyl", "record", "spin", "rotate", "grooves", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Vinyl Spin */
.roycss-audio-vinyl-spin {
  position: relative;
  width: 100px;
  height: 100px;
  margin: auto;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, oklch(0.7 0.18 25) 0 14%, oklch(0.1 0 0) 14% 16%, oklch(0.15 0 0) 16% 100%),
    repeating-radial-gradient(circle, oklch(0.15 0 0) 0 1px, oklch(0.12 0 0) 1px 3px);
  animation: roy-audio-vinyl-spin 3s linear infinite;
}
.roycss-audio-vinyl-spin::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: oklch(0.3 0 0);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
.roycss-audio-vinyl-spin::after {
  content: "";
  position: absolute;
  top: -8px;
  right: -6px;
  width: 50%;
  height: 4px;
  background: oklch(0.4 0 0);
  transform-origin: right center;
  transform: rotate(35deg);
  border-radius: 2px;
}
@keyframes roy-audio-vinyl-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-vinyl-spin { animation: none; }
}`,
  },

  // 3. audio-wave-pulse
  {
    id: "audio-wave-pulse",
    name: "Sound Wave Pulse",
    category: "audio",
    description: "Concentric circles expanding outward like sound waves from a source",
    tags: ["audio", "wave", "pulse", "ripple", "concentric", "sound", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Sound Wave Pulse */
.roycss-audio-wave-pulse {
  position: relative;
  width: 40px;
  height: 40px;
  margin: auto;
  border-radius: 50%;
  background: oklch(0.55 0.2 230);
}
.roycss-audio-wave-pulse::before,
.roycss-audio-wave-pulse::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid oklch(0.55 0.2 230 / 0.6);
  animation: roy-audio-wave-pulse 2s ease-out infinite;
}
.roycss-audio-wave-pulse::after { animation-delay: 1s; }
@keyframes roy-audio-wave-pulse {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(3.5); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-wave-pulse::before,
  .roycss-audio-wave-pulse::after { animation: none; opacity: 0; }
}`,
  },

  // 4. audio-speaker-vibrate
  {
    id: "audio-speaker-vibrate",
    name: "Speaker Vibrate",
    category: "audio",
    description: "Speaker cone that pulses and vibrates as if emitting sound",
    tags: ["audio", "speaker", "vibrate", "pulse", "cone", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Speaker Vibrate */
.roycss-audio-speaker-vibrate {
  position: relative;
  width: 80px;
  height: 80px;
  margin: auto;
  background: linear-gradient(135deg, oklch(0.3 0.02 230), oklch(0.22 0.02 230));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: roy-audio-speaker-vibrate 0.4s ease-in-out infinite;
}
.roycss-audio-speaker-vibrate::before {
  content: "";
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.2 0 0) 0 30%, oklch(0.45 0.04 230) 30% 60%, oklch(0.25 0.02 230) 60% 100%);
  animation: roy-audio-speaker-cone 0.4s ease-in-out infinite;
}
.roycss-audio-speaker-vibrate::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;
  border: 2px solid oklch(0.6 0.2 230 / 0.5);
  animation: roy-audio-speaker-ring 1.2s ease-out infinite;
}
@keyframes roy-audio-speaker-vibrate {
  0%, 100% { transform: translate(0, 0); }
  25%      { transform: translate(-1px, 1px); }
  75%      { transform: translate(1px, -1px); }
}
@keyframes roy-audio-speaker-cone {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(0.92); }
}
@keyframes roy-audio-speaker-ring {
  0%   { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.5); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-speaker-vibrate,
  .roycss-audio-speaker-vibrate::before,
  .roycss-audio-speaker-vibrate::after { animation: none; }
}`,
  },

  // 5. audio-waveform-sine
  {
    id: "audio-waveform-sine",
    name: "Sine Waveform",
    category: "audio",
    description: "Animated sine wave that flows horizontally like an audio signal",
    tags: ["audio", "waveform", "sine", "wave", "signal", "infinite"],
    previewType: "background",
    cssCode: `/* Audio: Sine Waveform */
.roycss-audio-waveform-sine {
  background:
    radial-gradient(ellipse 20% 50% at 20% 50%, oklch(0.6 0.2 230 / 0.5), transparent 70%),
    radial-gradient(ellipse 20% 50% at 60% 50%, oklch(0.6 0.2 230 / 0.5), transparent 70%),
    radial-gradient(ellipse 20% 50% at 100% 50%, oklch(0.6 0.2 230 / 0.5), transparent 70%);
  background-size: 60% 100%, 60% 100%, 60% 100%;
  background-repeat: no-repeat;
  background-position: 0 50%, 0 50%, 0 50%;
  animation: roy-audio-waveform-sine 2s linear infinite;
}
.roycss-audio-waveform-sine::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'><path d='M0 50 Q 25 0 50 50 T 100 50 T 150 50 T 200 50' fill='none' stroke='oklch(0.55 0.2 230)' stroke-width='3'/></svg>");
  background-size: 60% 100%;
  background-repeat: repeat-x;
  background-position: 0 50%;
  animation: roy-audio-waveform-sine-flow 2s linear infinite;
}
@keyframes roy-audio-waveform-sine {
  0%   { background-position: 0% 50%, 0% 50%, 0% 50%; }
  100% { background-position: 100% 50%, 100% 50%, 100% 50%; }
}
@keyframes roy-audio-waveform-sine-flow {
  0%   { background-position-x: 0%; }
  100% { background-position-x: 60%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-waveform-sine,
  .roycss-audio-waveform-sine::before { animation: none; }
}`,
  },

  // 6. audio-waveform-square
  {
    id: "audio-waveform-square",
    name: "Square Waveform",
    category: "audio",
    description: "Animated square wave that scrolls horizontally like a digital signal",
    tags: ["audio", "waveform", "square", "wave", "signal", "digital", "infinite"],
    previewType: "background",
    cssCode: `/* Audio: Square Waveform */
.roycss-audio-waveform-square {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'><path d='M0 80 L 0 20 L 50 20 L 50 80 L 100 80 L 100 20 L 150 20 L 150 80 L 200 80 L 200 20' fill='none' stroke='oklch(0.55 0.2 25)' stroke-width='3'/></svg>");
  background-size: 50% 100%;
  background-repeat: repeat-x;
  background-position: 0 50%;
  background-color: oklch(0.96 0.01 250);
  animation: roy-audio-waveform-square 1.5s linear infinite;
}
@keyframes roy-audio-waveform-square {
  0%   { background-position-x: 0%; }
  100% { background-position-x: 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-waveform-square { animation: none; }
}`,
  },

  // 7. audio-note-float
  {
    id: "audio-note-float",
    name: "Floating Music Notes",
    category: "audio",
    description: "Musical notes floating upward and fading like an audio visualization",
    tags: ["audio", "note", "music", "float", "fade", "rising", "infinite"],
    previewType: "box",
    childCount: 4,
    cssCode: `/* Audio: Floating Music Notes */
.roycss-audio-note-float {
  position: relative;
  background: oklch(0.97 0.02 250);
  border-radius: 8px;
  overflow: hidden;
}
.roycss-audio-note-float > span {
  position: absolute;
  bottom: -20%;
  font-size: 24px;
  line-height: 1;
  color: oklch(0.55 0.2 230);
  opacity: 0;
  animation: roy-audio-note-float 3s ease-out infinite;
}
.roycss-audio-note-float > span:nth-child(1) { left: 15%; animation-delay: 0s; }
.roycss-audio-note-float > span:nth-child(2) { left: 45%; animation-delay: 0.75s; }
.roycss-audio-note-float > span:nth-child(3) { left: 70%; animation-delay: 1.5s; }
.roycss-audio-note-float > span:nth-child(4) { left: 30%; animation-delay: 2.25s; }
@keyframes roy-audio-note-float {
  0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(-260px) rotate(20deg); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-note-float > span { animation: none; opacity: 0; }
}`,
  },

  // 8. audio-visualizer-circle
  {
    id: "audio-visualizer-circle",
    name: "Circular Visualizer",
    category: "audio",
    description: "Circular audio visualizer with pulsing concentric rings",
    tags: ["audio", "visualizer", "circular", "pulse", "ring", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Circular Visualizer */
.roycss-audio-visualizer-circle {
  position: relative;
  width: 80px;
  height: 80px;
  margin: auto;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.55 0.2 230) 0 30%, transparent 30%);
  animation: roy-audio-visualizer-circle-core 1s ease-in-out infinite;
}
.roycss-audio-visualizer-circle::before,
.roycss-audio-visualizer-circle::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid oklch(0.6 0.2 230);
  animation: roy-audio-visualizer-circle-ring 1.5s ease-out infinite;
}
.roycss-audio-visualizer-circle::after { animation-delay: 0.75s; }
@keyframes roy-audio-visualizer-circle-core {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(0.85); }
}
@keyframes roy-audio-visualizer-circle-ring {
  0%   { transform: scale(1); opacity: 0.8; border-width: 3px; }
  100% { transform: scale(2); opacity: 0; border-width: 1px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-visualizer-circle,
  .roycss-audio-visualizer-circle::before,
  .roycss-audio-visualizer-circle::after { animation: none; }
  .roycss-audio-visualizer-circle::before,
  .roycss-audio-visualizer-circle::after { opacity: 0; }
}`,
  },

  // 9. audio-beat-pulse
  {
    id: "audio-beat-pulse",
    name: "Beat Pulse",
    category: "audio",
    description: "Element pulses on a simulated musical beat with overshoot",
    tags: ["audio", "beat", "pulse", "bass", "rhythm", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Beat Pulse */
.roycss-audio-beat-pulse {
  background: linear-gradient(135deg, oklch(0.6 0.22 25), oklch(0.55 0.22 320));
  border-radius: 8px;
  animation: roy-audio-beat-pulse 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
@keyframes roy-audio-beat-pulse {
  0%, 60%, 100% { transform: scale(1); box-shadow: 0 0 0 0 oklch(0.6 0.22 25 / 0.5); }
  10%           { transform: scale(1.12); box-shadow: 0 0 0 16px oklch(0.6 0.22 25 / 0); }
  20%           { transform: scale(1); }
  35%           { transform: scale(1.06); box-shadow: 0 0 0 10px oklch(0.6 0.22 25 / 0); }
  45%           { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-beat-pulse { animation: none; transform: none; box-shadow: none; }
}`,
  },

  // 10. audio-frequency-bars
  {
    id: "audio-frequency-bars",
    name: "Frequency Spectrum",
    category: "audio",
    description: "Full frequency spectrum bars with mirrored top and bottom halves",
    tags: ["audio", "frequency", "spectrum", "bars", "mirror", "infinite"],
    previewType: "box",
    childCount: 7,
    cssCode: `/* Audio: Frequency Spectrum */
.roycss-audio-frequency-bars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 100%;
}
.roycss-audio-frequency-bars > span {
  width: 6px;
  background: linear-gradient(to top,
    oklch(0.6 0.22 25) 0%,
    oklch(0.6 0.22 90) 40%,
    oklch(0.7 0.2 0) 50%,
    oklch(0.6 0.22 90) 60%,
    oklch(0.6 0.22 25) 100%);
  border-radius: 2px;
  animation: roy-audio-frequency-bars 1.2s ease-in-out infinite;
}
.roycss-audio-frequency-bars > span:nth-child(1) { animation-delay: 0s;   animation-duration: 1.4s; }
.roycss-audio-frequency-bars > span:nth-child(2) { animation-delay: 0.1s; animation-duration: 0.9s; }
.roycss-audio-frequency-bars > span:nth-child(3) { animation-delay: 0.2s; animation-duration: 1.1s; }
.roycss-audio-frequency-bars > span:nth-child(4) { animation-delay: 0.3s; animation-duration: 0.8s; }
.roycss-audio-frequency-bars > span:nth-child(5) { animation-delay: 0.15s; animation-duration: 1.2s; }
.roycss-audio-frequency-bars > span:nth-child(6) { animation-delay: 0.25s; animation-duration: 1s; }
.roycss-audio-frequency-bars > span:nth-child(7) { animation-delay: 0.05s; animation-duration: 1.3s; }
@keyframes roy-audio-frequency-bars {
  0%, 100% { height: 20%; }
  50%      { height: 90%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-frequency-bars > span { animation: none; height: 50%; }
}`,
  },

  // 11. audio-ripple-effect
  {
    id: "audio-ripple-effect",
    name: "Sound Ripple",
    category: "audio",
    description: "Ripple expanding from a sound source with multiple staggered rings",
    tags: ["audio", "ripple", "sound", "source", "expanding", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Sound Ripple Effect */
.roycss-audio-ripple-effect {
  position: relative;
  width: 40px;
  height: 40px;
  margin: auto;
  border-radius: 50%;
  background: oklch(0.55 0.2 230);
}
.roycss-audio-ripple-effect::before,
.roycss-audio-ripple-effect::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid oklch(0.55 0.2 230);
  animation: roy-audio-ripple-effect 2.4s ease-out infinite;
}
.roycss-audio-ripple-effect::after { animation-delay: 0.8s; }
@keyframes roy-audio-ripple-effect {
  0%   { transform: scale(1); opacity: 0.7; border-width: 4px; }
  50%  { opacity: 0.3; border-width: 2px; }
  100% { transform: scale(4); opacity: 0; border-width: 1px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-ripple-effect::before,
  .roycss-audio-ripple-effect::after { animation: none; opacity: 0; }
}`,
  },

  // 12. audio-vu-meter
  {
    id: "audio-vu-meter",
    name: "VU Meter",
    category: "audio",
    description: "Classic VU meter with needle that sweeps across the scale",
    tags: ["audio", "vu-meter", "needle", "gauge", "volume", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: VU Meter */
.roycss-audio-vu-meter {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right,
    oklch(0.7 0.2 150) 0% 60%,
    oklch(0.85 0.18 90) 60% 85%,
    oklch(0.65 0.22 25) 85% 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-audio-vu-meter::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: oklch(0.15 0 0);
  transform-origin: top left;
  animation: roy-audio-vu-meter 1.6s ease-in-out infinite;
}
.roycss-audio-vu-meter::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg,
    oklch(0 0 0 / 0.1) 0 1px,
    transparent 1px 12px);
}
@keyframes roy-audio-vu-meter {
  0%   { transform: rotate(0deg); left: 5%; }
  40%  { transform: rotate(0deg); left: 70%; }
  55%  { transform: rotate(0deg); left: 92%; }
  70%  { transform: rotate(0deg); left: 45%; }
  100% { transform: rotate(0deg); left: 5%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-vu-meter::before { animation: none; left: 50%; }
}`,
  },

  // 13. audio-cassette-spin
  {
    id: "audio-cassette-spin",
    name: "Cassette Tape Spin",
    category: "audio",
    description: "Cassette tape with two reels rotating in opposite directions",
    tags: ["audio", "cassette", "tape", "reel", "spin", "retro", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Cassette Tape Spin */
.roycss-audio-cassette-spin {
  position: relative;
  width: 120px;
  height: 70px;
  margin: auto;
  background: linear-gradient(135deg, oklch(0.3 0.04 230), oklch(0.22 0.04 230));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.roycss-audio-cassette-spin::before,
.roycss-audio-cassette-spin::after {
  content: "";
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background:
    radial-gradient(circle, oklch(0.85 0 0) 0 12%, transparent 12% 18%, oklch(0.5 0 0) 18% 70%, oklch(0.2 0 0) 70% 100%),
    conic-gradient(from 0deg, oklch(0.7 0 0), oklch(0.4 0 0), oklch(0.7 0 0), oklch(0.4 0 0), oklch(0.7 0 0), oklch(0.4 0 0), oklch(0.7 0 0), oklch(0.4 0 0));
  animation: roy-audio-cassette-spin 1.5s linear infinite;
}
.roycss-audio-cassette-spin::after { animation-direction: reverse; }
@keyframes roy-audio-cassette-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-cassette-spin::before,
  .roycss-audio-cassette-spin::after { animation: none; }
}`,
  },

  // 14. audio-headphone-bounce
  {
    id: "audio-headphone-bounce",
    name: "Headphone Bounce",
    category: "audio",
    description: "Headphone icon bouncing rhythmically on a simulated beat",
    tags: ["audio", "headphone", "bounce", "beat", "rhythm", "icon", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Headphone Bounce */
.roycss-audio-headphone-bounce {
  position: relative;
  width: 60px;
  height: 60px;
  margin: auto;
  border-radius: 50% 50% 0 0 / 80% 80% 0 0;
  border: 5px solid oklch(0.4 0.04 230);
  border-bottom: none;
  background: transparent;
  animation: roy-audio-headphone-bounce 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}
.roycss-audio-headphone-bounce::before,
.roycss-audio-headphone-bounce::after {
  content: "";
  position: absolute;
  bottom: -5px;
  width: 14px;
  height: 22px;
  background: oklch(0.4 0.04 230);
  border-radius: 4px;
}
.roycss-audio-headphone-bounce::before { left: -5px; }
.roycss-audio-headphone-bounce::after  { right: -5px; }
@keyframes roy-audio-headphone-bounce {
  0%, 100% { transform: translateY(0) scale(1, 1); }
  30%      { transform: translateY(-8px) scale(1.05, 0.95); }
  60%      { transform: translateY(0) scale(0.95, 1.05); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-headphone-bounce { animation: none; transform: none; }
}`,
  },

  // 15. audio-sound-icon-wave
  {
    id: "audio-sound-icon-wave",
    name: "Sound Icon Waves",
    category: "audio",
    description: "Speaker icon with animated concentric sound waves emanating outward",
    tags: ["audio", "sound", "icon", "speaker", "waves", "volume", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Sound Icon Waves */
.roycss-audio-sound-icon-wave {
  position: relative;
  width: 50px;
  height: 50px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.roycss-audio-sound-icon-wave::before {
  content: "";
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 10px 0 10px 18px;
  border-color: transparent transparent transparent oklch(0.4 0.04 230);
  flex-shrink: 0;
}
.roycss-audio-sound-icon-wave::after {
  content: "";
  position: absolute;
  left: 18px;
  top: 50%;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid oklch(0.55 0.2 230);
  border-left-color: transparent;
  border-bottom-color: transparent;
  transform: translateY(-50%) rotate(45deg);
  animation: roy-audio-sound-icon-wave 1.4s ease-in-out infinite;
}
@keyframes roy-audio-sound-icon-wave {
  0%, 100% { opacity: 0; transform: translateY(-50%) rotate(45deg) scale(0.6); }
  50%      { opacity: 1; transform: translateY(-50%) rotate(45deg) scale(1.1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-sound-icon-wave::after { animation: none; opacity: 1; transform: translateY(-50%) rotate(45deg) scale(1); }
}`,
  },

  // 16. audio-mic-pulse
  {
    id: "audio-mic-pulse",
    name: "Mic Pulse",
    category: "audio",
    description: "Microphone pulsing with a recording ring while in active recording",
    tags: ["audio", "mic", "microphone", "pulse", "recording", "ring", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Mic Pulse */
.roycss-audio-mic-pulse {
  position: relative;
  width: 40px;
  height: 56px;
  margin: auto;
  background: oklch(0.6 0.22 25);
  border-radius: 20px;
  animation: roy-audio-mic-pulse-glow 1.2s ease-in-out infinite;
}
.roycss-audio-mic-pulse::before {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  width: 24px;
  height: 12px;
  border: 3px solid oklch(0.6 0.22 25);
  border-top: none;
  border-radius: 0 0 24px 24px;
  transform: translateX(-50%);
}
.roycss-audio-mic-pulse::after {
  content: "";
  position: absolute;
  inset: -10px;
  border-radius: 28px;
  border: 2px solid oklch(0.6 0.22 25);
  animation: roy-audio-mic-pulse-ring 1.2s ease-out infinite;
}
@keyframes roy-audio-mic-pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 oklch(0.6 0.22 25 / 0.5); }
  50%      { box-shadow: 0 0 12px 4px oklch(0.6 0.22 25 / 0.4); }
}
@keyframes roy-audio-mic-pulse-ring {
  0%   { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1.4); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-mic-pulse,
  .roycss-audio-mic-pulse::after { animation: none; }
  .roycss-audio-mic-pulse::after { opacity: 0; }
}`,
  },

  // 17. audio-play-to-pause
  {
    id: "audio-play-to-pause",
    name: "Play to Pause Morph",
    category: "audio",
    description: "Play triangle that morphs into a pause bar and back",
    tags: ["audio", "play", "pause", "morph", "media", "toggle", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Play to Pause Morph */
.roycss-audio-play-to-pause {
  position: relative;
  width: 60px;
  height: 60px;
  margin: auto;
  background: oklch(0.55 0.2 230);
  border-radius: 50%;
  animation: roy-audio-play-to-pause-bg 2s ease-in-out infinite;
}
.roycss-audio-play-to-pause::before,
.roycss-audio-play-to-pause::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 8px;
  height: 26px;
  background: oklch(1 0 0);
  transform-origin: center;
  animation: roy-audio-play-to-pause-bar 2s ease-in-out infinite;
}
.roycss-audio-play-to-pause::before { left: 22px; transform: translateY(-50%) scaleY(0); }
.roycss-audio-play-to-pause::after  { left: 32px; transform: translateY(-50%) scaleY(0); animation-delay: 0s; }
@keyframes roy-audio-play-to-pause-bg {
  0%, 45%   { background: oklch(0.55 0.2 230); }
  55%, 100% { background: oklch(0.55 0.2 230); }
}
@keyframes roy-audio-play-to-pause-bar {
  0%, 45%   { transform: translateY(-50%) scaleY(0); }
  50%       { transform: translateY(-50%) scaleY(0); }
  55%, 95%  { transform: translateY(-50%) scaleY(1); }
  100%      { transform: translateY(-50%) scaleY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-play-to-pause,
  .roycss-audio-play-to-pause::before,
  .roycss-audio-play-to-pause::after { animation: none; }
  .roycss-audio-play-to-pause::before,
  .roycss-audio-play-to-pause::after { transform: translateY(-50%) scaleY(1); }
}`,
  },

  // 18. audio-volume-knob
  {
    id: "audio-volume-knob",
    name: "Volume Knob",
    category: "audio",
    description: "Volume knob that rotates back and forth like a user adjusting volume",
    tags: ["audio", "volume", "knob", "rotate", "dial", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Volume Knob */
.roycss-audio-volume-knob {
  position: relative;
  width: 64px;
  height: 64px;
  margin: auto;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, oklch(0.45 0.04 230), oklch(0.25 0.02 230));
  box-shadow: inset 0 -3px 6px oklch(0 0 0 / 0.3), 0 4px 10px oklch(0 0 0 / 0.2);
  animation: roy-audio-volume-knob 2.4s ease-in-out infinite;
}
.roycss-audio-volume-knob::before {
  content: "";
  position: absolute;
  top: 6px;
  left: 50%;
  width: 4px;
  height: 18px;
  background: oklch(0.95 0 0);
  border-radius: 2px;
  transform: translateX(-50%);
}
@keyframes roy-audio-volume-knob {
  0%, 100% { transform: rotate(-120deg); }
  50%      { transform: rotate(120deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-volume-knob { animation: none; transform: rotate(0deg); }
}`,
  },

  // 19. audio-spectrum-gradient
  {
    id: "audio-spectrum-gradient",
    name: "Spectrum Gradient",
    category: "audio",
    description: "Spectrum analyzer with gradient bars that shift through the rainbow",
    tags: ["audio", "spectrum", "gradient", "analyzer", "bars", "rainbow", "infinite"],
    previewType: "box",
    childCount: 8,
    cssCode: `/* Audio: Spectrum Gradient */
.roycss-audio-spectrum-gradient {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  height: 100%;
}
.roycss-audio-spectrum-gradient > span {
  width: 7px;
  background: linear-gradient(to top,
    oklch(0.6 0.22 25),
    oklch(0.7 0.22 90),
    oklch(0.65 0.22 145),
    oklch(0.6 0.22 200),
    oklch(0.65 0.22 280));
  border-radius: 2px;
  animation: roy-audio-spectrum-gradient 1.4s ease-in-out infinite;
}
.roycss-audio-spectrum-gradient > span:nth-child(1) { animation-delay: 0s;    animation-duration: 1.2s; }
.roycss-audio-spectrum-gradient > span:nth-child(2) { animation-delay: 0.1s;  animation-duration: 0.9s; }
.roycss-audio-spectrum-gradient > span:nth-child(3) { animation-delay: 0.2s;  animation-duration: 1.1s; }
.roycss-audio-spectrum-gradient > span:nth-child(4) { animation-delay: 0.05s; animation-duration: 1.3s; }
.roycss-audio-spectrum-gradient > span:nth-child(5) { animation-delay: 0.15s; animation-duration: 1s; }
.roycss-audio-spectrum-gradient > span:nth-child(6) { animation-delay: 0.25s; animation-duration: 1.4s; }
.roycss-audio-spectrum-gradient > span:nth-child(7) { animation-delay: 0.1s;  animation-duration: 0.95s; }
.roycss-audio-spectrum-gradient > span:nth-child(8) { animation-delay: 0.2s;  animation-duration: 1.15s; }
@keyframes roy-audio-spectrum-gradient {
  0%, 100% { height: 20%; }
  50%      { height: 95%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-spectrum-gradient > span { animation: none; height: 50%; }
}`,
  },

  // 20. audio-bass-drop
  {
    id: "audio-bass-drop",
    name: "Bass Drop Impact",
    category: "audio",
    description: "Element implodes then explodes outward simulating a bass drop impact",
    tags: ["audio", "bass", "drop", "impact", "explode", "implode", "infinite"],
    previewType: "box",
    cssCode: `/* Audio: Bass Drop Impact */
.roycss-audio-bass-drop {
  position: relative;
  background: radial-gradient(circle, oklch(0.55 0.22 25), oklch(0.3 0.04 320));
  border-radius: 50%;
  animation: roy-audio-bass-drop 2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}
.roycss-audio-bass-drop::before,
.roycss-audio-bass-drop::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid oklch(0.6 0.22 25);
  animation: roy-audio-bass-drop-ring 2s ease-out infinite;
}
.roycss-audio-bass-drop::after { animation-delay: 0.1s; }
@keyframes roy-audio-bass-drop {
  0%, 100% { transform: scale(1); }
  20%      { transform: scale(0.7); }
  40%      { transform: scale(1.25); }
  60%      { transform: scale(0.95); }
  80%      { transform: scale(1.05); }
}
@keyframes roy-audio-bass-drop-ring {
  0%, 30%  { transform: scale(0.6); opacity: 0; }
  40%      { opacity: 0.8; }
  100%     { transform: scale(2.2); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-audio-bass-drop,
  .roycss-audio-bass-drop::before,
  .roycss-audio-bass-drop::after { animation: none; }
  .roycss-audio-bass-drop::before,
  .roycss-audio-bass-drop::after { opacity: 0; }
}`,
  },
];
