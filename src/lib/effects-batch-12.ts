import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 12 — Interactive UI, Data Viz & Practical Components (40)
 * 12 microinteractions (practical UI components)
 * + 10 visual (data viz & practical visuals)
 * + 10 animations (UI state animations)
 * + 8 cards (practical card patterns).
 *
 * Every class uses the `roycss-` prefix (`.roycss-{id}`).
 * Every @keyframes uses the `roy-b12-` prefix — guaranteed unique across
 * the RoyCSS library (no collisions with batches 1–11 + roycss-effects.ts).
 * Each `cssCode` is self-contained (class + pseudo-elements + @keyframes).
 *
 * Preview rendering notes:
 * - previewType "box" → outer div (Tailwind w-20 h-20) with inner 24×24 div.
 *   Effect CSS overrides width/height/background. Inner div hidden via
 *   `> div { display: none }` where needed.
 * - previewType "loader" → bare container, childCount spans optional.
 * - previewType "card" → w-36 h-24 wrapper with a `<span>{name}</span>` child.
 *   Effect CSS hides the span via `> span { display: none }` when drawing
 *   custom visuals via backgrounds.
 * - previewType "background" → full-bleed container.
 *
 * All @property custom property names are unique to this batch
 * (e.g. `--roy-b12-radial-progress`) to avoid global stylesheet collisions
 * since all effect CSS is concatenated into one <style> block.
 */
export const effectsBatch12: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════════
  // MICROINTERACTIONS — practical UI components (12)
  // ═══════════════════════════════════════════════════════════════════

  // 1 ─ Radial Progress ──────────────────────────────────────────────
  {
    id: "progress-radial-percentage",
    name: "Radial Progress",
    category: "microinteractions",
    description: "Circular progress indicator using conic-gradient and @property animated angle",
    tags: ["progress", "radial", "circular", "indicator"],
    previewType: "box",
    cssCode: `/* Radial Progress — conic-gradient ring with @property */
.roycss-progress-radial-percentage {
  --roy-b12-radial-progress: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: conic-gradient(
    #10b981 calc(var(--roy-b12-radial-progress) * 360deg),
    #1e293b 0
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: roy-b12-radial-fill 3s ease-in-out infinite;
}
.roycss-progress-radial-percentage > div { display: none; }
.roycss-progress-radial-percentage::before {
  content: "";
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
}
.roycss-progress-radial-percentage::after {
  content: "75%";
  position: absolute;
  color: #10b981;
  font-family: ui-monospace, monospace;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  animation: roy-b12-radial-label 3s steps(1) infinite;
}
@property --roy-b12-radial-progress {
  syntax: "<number>";
  initial-value: 0;
  inherits: false;
}
@keyframes roy-b12-radial-fill {
  0%   { --roy-b12-radial-progress: 0; }
  100% { --roy-b12-radial-progress: 1; }
}
@keyframes roy-b12-radial-label {
  0%, 33%  { content: "25%"; color: #f59e0b; }
  34%, 66% { content: "75%"; color: #10b981; }
  67%, 100%{ content: "100%"; color: #22c55e; }
}`,
  },

  // 2 ─ Step Indicator ───────────────────────────────────────────────
  {
    id: "progress-step-indicator",
    name: "Step Indicator",
    category: "microinteractions",
    description: "Multi-step progress with connected dots and animated fill line",
    tags: ["progress", "steps", "dots", "indicator"],
    previewType: "box",
    cssCode: `/* Step Indicator — connected dots with progress line */
.roycss-progress-step-indicator {
  width: 220px;
  height: 30px;
  position: relative;
  background:
    radial-gradient(circle at 10px 15px, #3b82f6 0 6px, #1e293b 7px 8px, transparent 9px),
    radial-gradient(circle at 110px 15px, #8b5cf6 0 6px, #1e293b 7px 8px, transparent 9px),
    radial-gradient(circle at 210px 15px, #1e293b 0 6px, #334155 7px 8px, transparent 9px);
}
.roycss-progress-step-indicator > div { display: none; }
.roycss-progress-step-indicator::before {
  content: "";
  position: absolute;
  top: 14px; left: 16px; right: 16px;
  height: 2px;
  background: #1e293b;
  border-radius: 1px;
}
.roycss-progress-step-indicator::after {
  content: "";
  position: absolute;
  top: 14px; left: 16px;
  height: 2px;
  width: 0;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 1px;
  box-shadow: 0 0 6px rgba(139,92,246,0.6);
  animation: roy-b12-step-fill 4s ease-in-out infinite;
}
@keyframes roy-b12-step-fill {
  0%, 10%   { width: 0; }
  35%, 55%  { width: 94px; }
  80%, 100% { width: 194px; }
}`,
  },

  // 3 ─ Rating Stars ─────────────────────────────────────────────────
  {
    id: "rating-stars",
    name: "Rating Stars",
    category: "microinteractions",
    description: "Star rating that animates fill from low to high using @property gradient stop",
    tags: ["rating", "stars", "review", "feedback"],
    previewType: "box",
    cssCode: `/* Rating Stars — animated gradient fill across star glyphs */
.roycss-rating-stars {
  --roy-b12-rating-fill: 0%;
  width: 200px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  letter-spacing: 4px;
  line-height: 1;
  background: linear-gradient(90deg,
    #fbbf24 var(--roy-b12-rating-fill),
    #475569 var(--roy-b12-rating-fill));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: drop-shadow(0 2px 6px rgba(251,191,36,0.35));
  animation: roy-b12-rating-cycle 4s ease-in-out infinite;
}
.roycss-rating-stars > div { display: none; }
.roycss-rating-stars::before {
  content: "★★★★★";
}
@property --roy-b12-rating-fill {
  syntax: "<percentage>";
  initial-value: 0%;
  inherits: false;
}
@keyframes roy-b12-rating-cycle {
  0%   { --roy-b12-rating-fill: 0%; }
  20%  { --roy-b12-rating-fill: 20%; }
  45%  { --roy-b12-rating-fill: 60%; }
  70%  { --roy-b12-rating-fill: 80%; }
  90%, 100% { --roy-b12-rating-fill: 100%; }
}`,
  },

  // 4 ─ Like Button Particle ─────────────────────────────────────────
  {
    id: "like-button-particle",
    name: "Like Particle Burst",
    category: "microinteractions",
    description: "Heart like button with rhythmic beat and outward particle burst",
    tags: ["like", "heart", "particle", "burst"],
    previewType: "box",
    cssCode: `/* Like Button — beating heart with particle burst */
.roycss-like-button-particle {
  width: 80px;
  height: 80px;
  position: relative;
}
.roycss-like-button-particle > div { display: none; }
.roycss-like-button-particle::before {
  content: "♥";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  color: #ef4444;
  filter: drop-shadow(0 0 10px rgba(239,68,68,0.6));
  animation: roy-b12-like-beat 1.6s ease-in-out infinite;
}
.roycss-like-button-particle::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 50%, #f87171 0 3px, transparent 4px),
    radial-gradient(circle at 80% 50%, #fbbf24 0 3px, transparent 4px),
    radial-gradient(circle at 50% 20%, #f472b6 0 3px, transparent 4px),
    radial-gradient(circle at 50% 80%, #f87171 0 3px, transparent 4px),
    radial-gradient(circle at 30% 25%, #fbbf24 0 3px, transparent 4px),
    radial-gradient(circle at 70% 25%, #f472b6 0 3px, transparent 4px),
    radial-gradient(circle at 30% 75%, #fbbf24 0 3px, transparent 4px),
    radial-gradient(circle at 70% 75%, #f472b6 0 3px, transparent 4px);
  background-repeat: no-repeat;
  opacity: 0;
  transform: scale(0.5);
  animation: roy-b12-like-burst 1.6s ease-out infinite;
}
@keyframes roy-b12-like-beat {
  0%, 60%, 100% { transform: scale(1); }
  20% { transform: scale(1.25); }
  35% { transform: scale(1.05); }
  45% { transform: scale(1.18); }
}
@keyframes roy-b12-like-burst {
  0%, 60%, 100% { transform: scale(0.4); opacity: 0; }
  20% { transform: scale(1.4); opacity: 1; }
  40% { transform: scale(2.2); opacity: 0; }
}`,
  },

  // 5 ─ Copy Feedback ────────────────────────────────────────────────
  {
    id: "copy-feedback",
    name: "Copy Feedback",
    category: "microinteractions",
    description: "Checkmark draw animation with circle pop for copy confirmation",
    tags: ["copy", "feedback", "checkmark", "confirm"],
    previewType: "box",
    cssCode: `/* Copy Feedback — checkmark pop with circle pulse */
.roycss-copy-feedback {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(16,185,129,0.12);
  border: 2px solid #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: roy-b12-copy-pop 2.4s ease-in-out infinite;
}
.roycss-copy-feedback > div { display: none; }
.roycss-copy-feedback::before {
  content: "";
  width: 26px;
  height: 13px;
  border-left: 4px solid #10b981;
  border-bottom: 4px solid #10b981;
  transform: rotate(-45deg) translate(2px, -3px);
  border-radius: 1px;
  animation: roy-b12-copy-check 2.4s ease-in-out infinite;
}
.roycss-copy-feedback::after {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid #10b981;
  opacity: 0;
  animation: roy-b12-copy-ring 2.4s ease-out infinite;
}
@keyframes roy-b12-copy-pop {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(0.92); }
  35% { transform: scale(1.05); }
}
@keyframes roy-b12-copy-check {
  0%, 25% { opacity: 0; transform: rotate(-45deg) translate(2px, -3px) scale(0.4); }
  50%, 100% { opacity: 1; transform: rotate(-45deg) translate(2px, -3px) scale(1); }
}
@keyframes roy-b12-copy-ring {
  0%, 30% { transform: scale(0.95); opacity: 0; }
  45% { opacity: 0.7; }
  70%, 100% { transform: scale(1.3); opacity: 0; }
}`,
  },

  // 6 ─ Dark Mode Toggle ─────────────────────────────────────────────
  {
    id: "toggle-dark-mode",
    name: "Dark Mode Toggle",
    category: "microinteractions",
    description: "Sun/moon morph toggle with day-to-night background transition",
    tags: ["toggle", "dark-mode", "sun", "moon"],
    previewType: "box",
    cssCode: `/* Dark Mode Toggle — sun/moon morph switch */
.roycss-toggle-dark-mode {
  width: 90px;
  height: 38px;
  border-radius: 19px;
  background: linear-gradient(90deg, #93c5fd, #3b82f6);
  border: 1px solid #60a5fa;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(59,130,246,0.25);
  animation: roy-b12-toggle-bg 4s ease-in-out infinite;
}
.roycss-toggle-dark-mode > div { display: none; }
.roycss-toggle-dark-mode::before {
  content: "";
  position: absolute;
  top: 3px; left: 3px;
  width: 30px; height: 30px;
  border-radius: 50%;
  background: radial-gradient(circle, #fde047, #f59e0b);
  box-shadow: 0 0 14px rgba(253,224,71,0.7), inset -2px -2px 4px rgba(0,0,0,0.15);
  animation: roy-b12-toggle-knob 4s ease-in-out infinite;
}
.roycss-toggle-dark-mode::after {
  content: "";
  position: absolute;
  top: 11px; right: 14px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 70% 30%, #e2e8f0, #94a3b8);
  opacity: 0;
  box-shadow: 0 0 8px rgba(148,163,184,0.5);
  animation: roy-b12-toggle-stars 4s ease-in-out infinite;
}
@keyframes roy-b12-toggle-bg {
  0%, 45% {
    background: linear-gradient(90deg, #93c5fd, #3b82f6);
    border-color: #60a5fa;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(59,130,246,0.25);
  }
  55%, 100% {
    background: linear-gradient(90deg, #1e293b, #0f172a);
    border-color: #334155;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.4);
  }
}
@keyframes roy-b12-toggle-knob {
  0%, 45% {
    left: 3px;
    background: radial-gradient(circle, #fde047, #f59e0b);
    box-shadow: 0 0 14px rgba(253,224,71,0.7), inset -2px -2px 4px rgba(0,0,0,0.15);
  }
  55%, 100% {
    left: 57px;
    background: radial-gradient(circle at 65% 35%, #e2e8f0, #94a3b8);
    box-shadow: 0 0 10px rgba(148,163,184,0.6), inset -6px -3px 0 0 #475569, inset -2px -2px 4px rgba(0,0,0,0.2);
  }
}
@keyframes roy-b12-toggle-stars {
  0%, 45% { opacity: 0; transform: scale(0.5); }
  55%, 100% { opacity: 1; transform: scale(1); }
}`,
  },

  // 7 ─ Password Strength ───────────────────────────────────────────
  {
    id: "password-strength",
    name: "Password Strength",
    category: "microinteractions",
    description: "Password strength meter with color gradient and discrete label",
    tags: ["password", "strength", "meter", "form"],
    previewType: "box",
    cssCode: `/* Password Strength — meter with color gradient and label */
.roycss-password-strength {
  width: 220px;
  height: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.roycss-password-strength > div { display: none; }
.roycss-password-strength::before {
  content: "";
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #1e293b;
  background-image: linear-gradient(90deg, #ef4444, #f59e0b 50%, #22c55e);
  background-size: 25% 100%;
  background-repeat: no-repeat;
  background-position: 0 0;
  transition: background-size 0.3s ease;
  animation: roy-b12-pw-fill 3s ease-in-out infinite;
}
.roycss-password-strength::after {
  content: "Weak";
  position: absolute;
  top: -2px; left: 0;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #94a3b8;
  animation: roy-b12-pw-label 3s steps(1) infinite;
}
@keyframes roy-b12-pw-fill {
  0%, 5% { background-size: 25% 100%; }
  35%, 60% { background-size: 55% 100%; }
  70%, 100% { background-size: 100% 100%; }
}
@keyframes roy-b12-pw-label {
  0%, 32%  { content: "Weak"; color: #ef4444; }
  33%, 65% { content: "Good"; color: #f59e0b; }
  66%, 100%{ content: "Strong"; color: #22c55e; }
}`,
  },

  // 8 ─ Upload Progress ──────────────────────────────────────────────
  {
    id: "upload-progress",
    name: "Upload Progress",
    category: "microinteractions",
    description: "File upload progress bar with label and animated fill",
    tags: ["upload", "progress", "file", "bar"],
    previewType: "box",
    cssCode: `/* Upload Progress — labeled bar with smooth fill animation */
.roycss-upload-progress {
  width: 240px;
  height: 64px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 12px 14px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}
.roycss-upload-progress > div { display: none; }
.roycss-upload-progress::before {
  content: "↑  uploading file.zip";
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #cbd5e1;
  font-weight: 500;
}
.roycss-upload-progress::after {
  content: "";
  position: absolute;
  bottom: 12px; left: 14px; right: 14px;
  height: 8px;
  border-radius: 4px;
  background: #1e293b;
  background-image: linear-gradient(90deg, #3b82f6, #8b5cf6);
  background-size: 0% 100%;
  background-repeat: no-repeat;
  animation: roy-b12-upload-fill 4s ease-in-out infinite;
}
@keyframes roy-b12-upload-fill {
  0%   { background-size: 0% 100%; }
  80%  { background-size: 100% 100%; }
  90%  { background-size: 100% 100%; background-image: linear-gradient(90deg, #10b981, #22c55e); }
  100% { background-size: 100% 100%; background-image: linear-gradient(90deg, #10b981, #22c55e); }
}`,
  },

  // 9 ─ Notification Badge ───────────────────────────────────────────
  {
    id: "notification-badge",
    name: "Notification Badge",
    category: "microinteractions",
    description: "Notification badge that counts up with expanding pulse ring",
    tags: ["notification", "badge", "count", "alert"],
    previewType: "box",
    cssCode: `/* Notification Badge — count-up with pulse ring */
.roycss-notification-badge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ui-monospace, monospace;
  font-size: 20px;
  font-weight: 700;
  color: white;
  box-shadow: 0 6px 18px rgba(239,68,68,0.5), inset 0 -3px 6px rgba(0,0,0,0.2);
  position: relative;
}
.roycss-notification-badge > div { display: none; }
.roycss-notification-badge::before {
  content: "1";
  animation: roy-b12-notif-count 4s steps(1) infinite;
}
.roycss-notification-badge::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid #ef4444;
  opacity: 0;
  animation: roy-b12-notif-ring 2s ease-out infinite;
}
@keyframes roy-b12-notif-count {
  0%, 24%  { content: "1"; }
  25%, 49% { content: "3"; }
  50%, 74% { content: "7"; }
  75%, 100%{ content: "9+"; }
}
@keyframes roy-b12-notif-ring {
  0% { transform: scale(0.95); opacity: 0.8; }
  100% { transform: scale(1.7); opacity: 0; }
}`,
  },

  // 10 ─ Skeleton Card Shimmer ───────────────────────────────────────
  {
    id: "skeleton-card-shimmer",
    name: "Skeleton Card Shimmer",
    category: "microinteractions",
    description: "Skeleton loading card with avatar, title and text shimmer sweep",
    tags: ["skeleton", "loading", "shimmer", "card"],
    previewType: "loader",
    cssCode: `/* Skeleton Card Shimmer — placeholder with shimmer sweep */
.roycss-skeleton-card-shimmer {
  width: 220px;
  height: 130px;
  background:
    radial-gradient(circle 22px at 36px 38px, #1e293b 99%, transparent 100%),
    linear-gradient(#1e293b, #1e293b) 76px 22px / 130px 12px no-repeat,
    linear-gradient(#1e293b, #1e293b) 76px 42px / 100px 10px no-repeat,
    linear-gradient(#1e293b, #1e293b) 14px 80px / 192px 10px no-repeat,
    linear-gradient(#1e293b, #1e293b) 14px 98px / 150px 10px no-repeat,
    #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}
.roycss-skeleton-card-shimmer::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg,
    transparent 30%,
    rgba(148,163,184,0.14) 50%,
    transparent 70%);
  background-size: 250% 100%;
  background-repeat: no-repeat;
  animation: roy-b12-skel-shimmer 1.6s linear infinite;
}
@keyframes roy-b12-skel-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -50% 0; }
}`,
  },

  // 11 ─ Skeleton Text Lines ─────────────────────────────────────────
  {
    id: "skeleton-text-lines",
    name: "Skeleton Text Lines",
    category: "microinteractions",
    description: "Skeleton text placeholder lines with shimmer sweep animation",
    tags: ["skeleton", "text", "placeholder", "shimmer"],
    previewType: "loader",
    cssCode: `/* Skeleton Text Lines — shimmering placeholder text bars */
.roycss-skeleton-text-lines {
  width: 220px;
  height: 110px;
  background:
    linear-gradient(#1e293b, #1e293b) 0 0 / 100% 12px no-repeat,
    linear-gradient(#1e293b, #1e293b) 0 22px / 92% 12px no-repeat,
    linear-gradient(#1e293b, #1e293b) 0 44px / 85% 12px no-repeat,
    linear-gradient(#1e293b, #1e293b) 0 66px / 60% 12px no-repeat,
    linear-gradient(#1e293b, #1e293b) 0 88px / 40% 12px no-repeat,
    transparent;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}
.roycss-skeleton-text-lines::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg,
    transparent 35%,
    rgba(148,163,184,0.18) 50%,
    transparent 65%);
  background-size: 250% 100%;
  background-repeat: no-repeat;
  animation: roy-b12-text-shimmer 1.4s linear infinite;
}
@keyframes roy-b12-text-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -50% 0; }
}`,
  },

  // 12 ─ Countdown Timer ─────────────────────────────────────────────
  {
    id: "countdown-timer",
    name: "Countdown Timer",
    category: "microinteractions",
    description: "Circular countdown with conic-gradient depleting arc and discrete number",
    tags: ["countdown", "timer", "circular", "progress"],
    previewType: "box",
    cssCode: `/* Countdown Timer — circular arc depletion with number */
.roycss-countdown-timer {
  --roy-b12-countdown-remaining: 1;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: conic-gradient(
    #3b82f6 calc(var(--roy-b12-countdown-remaining) * 360deg),
    #1e293b 0
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: roy-b12-countdown-arc 5s linear infinite;
}
.roycss-countdown-timer > div { display: none; }
.roycss-countdown-timer::before {
  content: "";
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
}
.roycss-countdown-timer::after {
  content: "5";
  position: absolute;
  color: #60a5fa;
  font-family: ui-monospace, monospace;
  font-size: 26px;
  font-weight: 700;
  animation: roy-b12-countdown-num 5s steps(1) infinite;
}
@property --roy-b12-countdown-remaining {
  syntax: "<number>";
  initial-value: 1;
  inherits: false;
}
@keyframes roy-b12-countdown-arc {
  from { --roy-b12-countdown-remaining: 1; }
  to   { --roy-b12-countdown-remaining: 0; }
}
@keyframes roy-b12-countdown-num {
  0%, 19%   { content: "5"; }
  20%, 39%  { content: "4"; }
  40%, 59%  { content: "3"; }
  60%, 79%  { content: "2"; }
  80%, 99%  { content: "1"; }
  100%      { content: "0"; }
}`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // VISUAL — data viz & practical visuals (10)
  // ═══════════════════════════════════════════════════════════════════

  // 13 ─ Bar Chart Grow ──────────────────────────────────────────────
  {
    id: "chart-bar-grow",
    name: "Bar Chart Grow",
    category: "visual",
    description: "Animated bar chart with bars growing from baseline to varying heights",
    tags: ["chart", "bar", "graph", "data-viz"],
    previewType: "box",
    cssCode: `/* Bar Chart Grow — multi-bar chart with staggered growth */
.roycss-chart-bar-grow {
  width: 220px;
  height: 140px;
  background-color: #0f172a;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  background-image:
    linear-gradient(180deg, #3b82f6, #1e40af),
    linear-gradient(180deg, #8b5cf6, #5b21b6),
    linear-gradient(180deg, #ec4899, #9d174d),
    linear-gradient(180deg, #10b981, #065f46),
    linear-gradient(180deg, #f59e0b, #92400e);
  background-position:
    16px bottom,
    56px bottom,
    96px bottom,
    136px bottom,
    176px bottom;
  background-repeat: no-repeat;
  background-size: 22px 0, 22px 0, 22px 0, 22px 0, 22px 0;
  animation: roy-b12-bars-grow 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite alternate;
}
.roycss-chart-bar-grow > div { display: none; }
.roycss-chart-bar-grow::before {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 2px;
  background: #334155;
}
.roycss-chart-bar-grow::after {
  content: "";
  position: absolute;
  left: 0; right: 0; top: 50%;
  height: 1px;
  background: #1e293b;
}
@keyframes roy-b12-bars-grow {
  0% {
    background-size: 22px 0, 22px 0, 22px 0, 22px 0, 22px 0;
  }
  100% {
    background-size: 22px 70px, 22px 105px, 22px 80px, 22px 120px, 22px 90px;
  }
}`,
  },

  // 14 ─ Line Chart Draw ─────────────────────────────────────────────
  {
    id: "chart-line-draw",
    name: "Line Chart Draw",
    category: "visual",
    description: "SVG-like line chart with polyline drawn left-to-right and data point dots",
    tags: ["chart", "line", "graph", "data-viz"],
    previewType: "box",
    cssCode: `/* Line Chart Draw — polyline reveal with data dots */
.roycss-chart-line-draw {
  width: 220px;
  height: 140px;
  background-color: #0f172a;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}
.roycss-chart-line-draw > div { display: none; }
.roycss-chart-line-draw::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(#1e293b, #1e293b) 0 50% / 100% 1px no-repeat,
    linear-gradient(#1e293b, #1e293b) 50% 0 / 1px 100% no-repeat;
}
.roycss-chart-line-draw::after {
  --roy-b12-line-reveal: 0%;
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle, #60a5fa 0 4px, transparent 5px) 8px 110px / 9px 9px no-repeat,
    radial-gradient(circle, #60a5fa 0 4px, transparent 5px) 72px 78px / 9px 9px no-repeat,
    radial-gradient(circle, #60a5fa 0 4px, transparent 5px) 136px 50px / 9px 9px no-repeat,
    radial-gradient(circle, #60a5fa 0 4px, transparent 5px) 200px 22px / 9px 9px no-repeat,
    #3b82f6;
  clip-path: polygon(
    -2% 100%, 33% 70%, 66% 40%, 102% 12%,
    102% 18%, 66% 46%, 33% 76%, -2% 100%
  );
  -webkit-mask: linear-gradient(90deg,
    #000 var(--roy-b12-line-reveal),
    transparent var(--roy-b12-line-reveal));
  mask: linear-gradient(90deg,
    #000 var(--roy-b12-line-reveal),
    transparent var(--roy-b12-line-reveal));
  animation: roy-b12-line-draw 2.5s ease-in-out infinite;
}
@property --roy-b12-line-reveal {
  syntax: "<percentage>";
  initial-value: 0%;
  inherits: false;
}
@keyframes roy-b12-line-draw {
  0%   { --roy-b12-line-reveal: 0%; }
  70%  { --roy-b12-line-reveal: 100%; }
  100% { --roy-b12-line-reveal: 100%; }
}`,
  },

  // 15 ─ Donut Chart ─────────────────────────────────────────────────
  {
    id: "chart-donut",
    name: "Donut Chart",
    category: "visual",
    description: "Donut chart with multi-color segments and counter-rotating center label",
    tags: ["chart", "donut", "graph", "data-viz"],
    previewType: "box",
    cssCode: `/* Donut Chart — rotating conic-gradient ring with centered label */
.roycss-chart-donut {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(
    #3b82f6 0deg 130deg,
    #8b5cf6 130deg 230deg,
    #ec4899 230deg 310deg,
    #10b981 310deg 360deg
  );
  position: relative;
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  animation: roy-b12-donut-spin 12s linear infinite;
}
.roycss-chart-donut > div { display: none; }
.roycss-chart-donut::before {
  content: "";
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
}
.roycss-chart-donut::after {
  content: "TOTAL";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-family: ui-monospace, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  animation: roy-b12-donut-counter 12s linear infinite;
}
@keyframes roy-b12-donut-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes roy-b12-donut-counter {
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
}`,
  },

  // 16 ─ Gauge Meter ─────────────────────────────────────────────────
  {
    id: "gauge-meter",
    name: "Gauge Meter",
    category: "visual",
    description: "Speedometer-style gauge with colored arc segments and sweeping needle",
    tags: ["gauge", "meter", "speedometer", "data-viz"],
    previewType: "box",
    cssCode: `/* Gauge Meter — semicircle arc with sweeping needle */
.roycss-gauge-meter {
  width: 180px;
  height: 110px;
  border-radius: 90px 90px 8px 8px;
  position: relative;
  background: conic-gradient(from -90deg at 50% 100%,
    #22c55e 0deg 60deg,
    #eab308 60deg 120deg,
    #ef4444 120deg 180deg,
    transparent 180deg 360deg
  );
  overflow: hidden;
}
.roycss-gauge-meter > div { display: none; }
.roycss-gauge-meter::before {
  /* inner mask creating the ring */
  content: "";
  position: absolute;
  bottom: 0; left: 30px;
  width: 120px; height: 60px;
  border-radius: 60px 60px 0 0;
  background: #0f172a;
}
.roycss-gauge-meter::after {
  /* needle */
  content: "";
  position: absolute;
  bottom: 6px; left: 50%;
  width: 4px; height: 70px;
  background: linear-gradient(180deg, #f8fafc, #cbd5e1);
  border-radius: 2px;
  transform-origin: bottom center;
  transform: translateX(-50%) rotate(-80deg);
  box-shadow: 0 0 6px rgba(0,0,0,0.6);
  animation: roy-b12-gauge-needle 4s ease-in-out infinite alternate;
}
@keyframes roy-b12-gauge-needle {
  0%   { transform: translateX(-50%) rotate(-80deg); }
  50%  { transform: translateX(-50%) rotate(20deg); }
  100% { transform: translateX(-50%) rotate(75deg); }
}`,
  },

  // 17 ─ Thermometer ─────────────────────────────────────────────────
  {
    id: "thermometer",
    name: "Thermometer",
    category: "visual",
    description: "Vertical thermometer with rising mercury column and bulb at base",
    tags: ["thermometer", "temperature", "gauge", "indicator"],
    previewType: "box",
    cssCode: `/* Thermometer — vertical tube with rising mercury and bulb */
.roycss-thermometer {
  width: 40px;
  height: 200px;
  position: relative;
  background: #1e293b;
  border-radius: 20px;
  border: 2px solid #334155;
  box-sizing: border-box;
}
.roycss-thermometer > div { display: none; }
.roycss-thermometer::before {
  /* mercury column */
  content: "";
  position: absolute;
  bottom: 0; left: 50%;
  width: 14px;
  height: 8%;
  background: linear-gradient(180deg, #f87171 0%, #ef4444 100%);
  border-radius: 7px 7px 0 0;
  transform: translateX(-50%);
  box-shadow: inset 1px 0 1px rgba(255,255,255,0.25);
  animation: roy-b12-therm-fill 3s ease-in-out infinite alternate;
}
.roycss-thermometer::after {
  /* bulb */
  content: "";
  position: absolute;
  bottom: -24px; left: 50%;
  width: 46px; height: 46px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #f87171, #b91c1c);
  transform: translateX(-50%);
  box-shadow:
    0 0 14px rgba(239,68,68,0.5),
    inset -4px -4px 8px rgba(0,0,0,0.3),
    inset 3px 3px 6px rgba(255,255,255,0.15);
}
@keyframes roy-b12-therm-fill {
  0%   { height: 8%; }
  50%  { height: 40%; background: linear-gradient(180deg, #fbbf24, #f59e0b); }
  100% { height: 75%; background: linear-gradient(180deg, #f87171, #dc2626); }
}`,
  },

  // 18 ─ Battery Level ───────────────────────────────────────────────
  {
    id: "battery-level",
    name: "Battery Level",
    category: "visual",
    description: "Battery indicator with terminal nub and animated level draining and filling",
    tags: ["battery", "power", "indicator", "device"],
    previewType: "box",
    cssCode: `/* Battery Level — battery body with animated level fill */
.roycss-battery-level {
  width: 100px;
  height: 48px;
  position: relative;
  border: 2px solid #475569;
  border-radius: 8px;
  background: #0f172a;
  box-sizing: border-box;
}
.roycss-battery-level > div { display: none; }
.roycss-battery-level::before {
  /* terminal nub */
  content: "";
  position: absolute;
  top: 14px; right: -6px;
  width: 4px; height: 16px;
  background: #475569;
  border-radius: 0 2px 2px 0;
}
.roycss-battery-level::after {
  /* level fill */
  content: "";
  position: absolute;
  top: 4px; left: 4px; bottom: 4px;
  width: 75%;
  border-radius: 4px;
  background: linear-gradient(180deg, #4ade80, #16a34a);
  box-shadow:
    inset 0 -3px 6px rgba(0,0,0,0.2),
    0 0 8px rgba(74,222,128,0.5);
  animation: roy-b12-battery-level 4s ease-in-out infinite;
}
@keyframes roy-b12-battery-level {
  0%, 10%   { width: 85%; background: linear-gradient(180deg, #4ade80, #16a34a); box-shadow: inset 0 -3px 6px rgba(0,0,0,0.2), 0 0 8px rgba(74,222,128,0.5); }
  40%, 55%  { width: 50%; background: linear-gradient(180deg, #facc15, #ca8a04); box-shadow: inset 0 -3px 6px rgba(0,0,0,0.2), 0 0 8px rgba(250,204,21,0.5); }
  75%, 90%  { width: 20%; background: linear-gradient(180deg, #f87171, #dc2626); box-shadow: inset 0 -3px 6px rgba(0,0,0,0.2), 0 0 8px rgba(239,68,68,0.5); }
  100%      { width: 85%; background: linear-gradient(180deg, #4ade80, #16a34a); box-shadow: inset 0 -3px 6px rgba(0,0,0,0.2), 0 0 8px rgba(74,222,128,0.5); }
}`,
  },

  // 19 ─ Signal Strength ─────────────────────────────────────────────
  {
    id: "signal-strength",
    name: "Signal Strength",
    category: "visual",
    description: "WiFi/signal strength bars with pulsing wave and glow",
    tags: ["signal", "wifi", "bars", "indicator"],
    previewType: "box",
    cssCode: `/* Signal Strength — ascending bars with pulse wave */
.roycss-signal-strength {
  width: 80px;
  height: 60px;
  position: relative;
  background-image:
    linear-gradient(180deg, #4ade80, #16a34a),
    linear-gradient(180deg, #4ade80, #16a34a),
    linear-gradient(180deg, #4ade80, #16a34a),
    linear-gradient(180deg, #4ade80, #16a34a);
  background-position:
    8px bottom,
    24px bottom,
    40px bottom,
    56px bottom;
  background-repeat: no-repeat;
  background-size: 12px 14px, 12px 24px, 12px 34px, 12px 44px;
  filter: drop-shadow(0 0 6px rgba(74,222,128,0.4));
  animation: roy-b12-signal-wave 1.6s ease-in-out infinite;
}
.roycss-signal-strength > div { display: none; }
@keyframes roy-b12-signal-wave {
  0%, 100% {
    background-size: 12px 8px, 12px 16px, 12px 24px, 12px 32px;
    filter: drop-shadow(0 0 4px rgba(74,222,128,0.3));
  }
  50% {
    background-size: 12px 18px, 12px 28px, 12px 38px, 12px 50px;
    filter: drop-shadow(0 0 12px rgba(74,222,128,0.8));
  }
}`,
  },

  // 20 ─ Loading Skeleton Grid ───────────────────────────────────────
  {
    id: "loading-skeleton-grid",
    name: "Skeleton Grid",
    category: "visual",
    description: "Grid of skeleton placeholder cards with shimmer sweep",
    tags: ["skeleton", "grid", "loading", "shimmer"],
    previewType: "loader",
    cssCode: `/* Skeleton Grid — 2x3 grid of placeholder cards with shimmer */
.roycss-loading-skeleton-grid {
  width: 220px;
  height: 140px;
  background-color: #0f172a;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  background-image:
    linear-gradient(#1e293b, #1e293b),
    linear-gradient(#1e293b, #1e293b),
    linear-gradient(#1e293b, #1e293b),
    linear-gradient(#1e293b, #1e293b),
    linear-gradient(#1e293b, #1e293b),
    linear-gradient(#1e293b, #1e293b);
  background-position:
    10px 10px,
    84px 10px,
    158px 10px,
    10px 80px,
    84px 80px,
    158px 80px;
  background-size:
    58px 58px,
    58px 58px,
    58px 58px,
    58px 58px,
    58px 58px,
    58px 58px;
  background-repeat: no-repeat;
}
.roycss-loading-skeleton-grid::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg,
    transparent 35%,
    rgba(148,163,184,0.15) 50%,
    transparent 65%);
  background-size: 250% 100%;
  background-repeat: no-repeat;
  animation: roy-b12-grid-shimmer 1.5s linear infinite;
}
@keyframes roy-b12-grid-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -50% 0; }
}`,
  },

  // 21 ─ Data Table Row Highlight ────────────────────────────────────
  {
    id: "data-table-row-highlight",
    name: "Table Row Highlight",
    category: "visual",
    description: "Data table with header row and a highlight bar scanning through body rows",
    tags: ["table", "row", "highlight", "data"],
    previewType: "box",
    cssCode: `/* Data Table Row Highlight — header + striped body with scanning row */
.roycss-data-table-row-highlight {
  width: 240px;
  height: 160px;
  position: relative;
  background:
    linear-gradient(#1e293b, #1e293b) 0 0 / 100% 28px no-repeat,
    linear-gradient(#0f172a, #0f172a) 0 28px / 100% 132px no-repeat,
    repeating-linear-gradient(180deg,
      transparent 0 30px,
      rgba(148,163,184,0.04) 30px 60px) 0 28px / 100% 132px no-repeat;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #1e293b;
}
.roycss-data-table-row-highlight > div { display: none; }
.roycss-data-table-row-highlight::before {
  /* column dividers */
  content: "";
  position: absolute;
  top: 28px; left: 0; right: 0; bottom: 0;
  background:
    linear-gradient(#334155, #334155) 80px 0 / 1px 100% no-repeat,
    linear-gradient(#334155, #334155) 160px 0 / 1px 100% no-repeat;
}
.roycss-data-table-row-highlight::after {
  /* scanning highlight row */
  content: "";
  position: absolute;
  left: 0; right: 0;
  top: 28px;
  height: 26px;
  background: linear-gradient(90deg,
    rgba(59,130,246,0.25),
    rgba(139,92,246,0.25));
  border-left: 3px solid #3b82f6;
  border-right: 3px solid #8b5cf6;
  animation: roy-b12-table-scan 3s ease-in-out infinite;
}
@keyframes roy-b12-table-scan {
  0%   { top: 28px; }
  100% { top: 134px; }
}`,
  },

  // 22 ─ Code Block Syntax ───────────────────────────────────────────
  {
    id: "code-block-syntax",
    name: "Code Block Syntax",
    category: "visual",
    description: "Code editor window with traffic lights and syntax-highlighted token stripes",
    tags: ["code", "editor", "syntax", "window"],
    previewType: "box",
    cssCode: `/* Code Block Syntax — editor window with colored token stripes */
.roycss-code-block-syntax {
  width: 240px;
  height: 160px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}
.roycss-code-block-syntax > div { display: none; }
.roycss-code-block-syntax::before {
  /* traffic light dots */
  content: "";
  position: absolute;
  top: 10px; left: 12px;
  width: 10px; height: 10px;
  background: #ef4444;
  border-radius: 50%;
  box-shadow: 18px 0 0 #f59e0b, 36px 0 0 #10b981;
}
.roycss-code-block-syntax::after {
  /* token stripes per line */
  content: "";
  position: absolute;
  top: 36px; left: 14px; right: 14px; bottom: 14px;
  background:
    /* line 1: keyword | ident | = | string */
    linear-gradient(#c084fc, #c084fc) 0 0 / 40px 7px no-repeat,
    linear-gradient(#60a5fa, #60a5fa) 44px 0 / 50px 7px no-repeat,
    linear-gradient(#94a3b8, #94a3b8) 98px 0 / 6px 7px no-repeat,
    linear-gradient(#10b981, #10b981) 108px 0 / 80px 7px no-repeat,
    /* line 2: keyword | ident | = | number */
    linear-gradient(#c084fc, #c084fc) 0 16px / 30px 7px no-repeat,
    linear-gradient(#60a5fa, #60a5fa) 34px 16px / 60px 7px no-repeat,
    linear-gradient(#94a3b8, #94a3b8) 98px 16px / 6px 7px no-repeat,
    linear-gradient(#fb923c, #fb923c) 108px 16px / 22px 7px no-repeat,
    /* line 3: function call */
    linear-gradient(#f472b6, #f472b6) 0 32px / 40px 7px no-repeat,
    linear-gradient(#94a3b8, #94a3b8) 42px 32px / 8px 7px no-repeat,
    linear-gradient(#60a5fa, #60a5fa) 52px 32px / 80px 7px no-repeat,
    linear-gradient(#94a3b8, #94a3b8) 134px 32px / 6px 7px no-repeat,
    /* line 4: comment */
    linear-gradient(#64748b, #64748b) 0 48px / 170px 7px no-repeat,
    /* line 5: chain */
    linear-gradient(#60a5fa, #60a5fa) 0 64px / 30px 7px no-repeat,
    linear-gradient(#94a3b8, #94a3b8) 32px 64px / 12px 7px no-repeat,
    linear-gradient(#f472b6, #f472b6) 46px 64px / 50px 7px no-repeat;
  background-repeat: no-repeat;
  animation: roy-b12-code-blink 1.5s ease-in-out infinite;
}
@keyframes roy-b12-code-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATIONS — UI state animations (10)
  // ═══════════════════════════════════════════════════════════════════

  // 23 ─ Shake Error Input ───────────────────────────────────────────
  {
    id: "shake-error-input",
    name: "Shake Error Input",
    category: "animations",
    description: "Input field with red border that shakes horizontally on validation error",
    tags: ["input", "error", "shake", "validation"],
    previewType: "box",
    cssCode: `/* Shake Error Input — horizontal shake on validation error */
.roycss-shake-error-input {
  width: 240px;
  height: 44px;
  background: #1c1010;
  border: 2px solid #ef4444;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 0 0 4px rgba(239,68,68,0.15), 0 4px 12px rgba(0,0,0,0.3);
  animation: roy-b12-shake-error 3s ease-in-out infinite;
}
.roycss-shake-error-input > div { display: none; }
.roycss-shake-error-input::before {
  content: "✉  invalid@email";
  position: absolute;
  top: 50%; left: 14px;
  transform: translateY(-50%);
  color: #fca5a5;
  font-family: ui-monospace, monospace;
  font-size: 13px;
  font-weight: 500;
}
.roycss-shake-error-input::after {
  content: "!";
  position: absolute;
  top: 50%; right: 12px;
  transform: translateY(-50%);
  width: 22px; height: 22px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ui-sans-serif, sans-serif;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 0 8px rgba(239,68,68,0.6);
}
@keyframes roy-b12-shake-error {
  0%, 70%, 100% { transform: translateX(0); }
  72% { transform: translateX(-8px); }
  74% { transform: translateX(8px); }
  76% { transform: translateX(-6px); }
  78% { transform: translateX(6px); }
  80% { transform: translateX(-4px); }
  82% { transform: translateX(4px); }
  84% { transform: translateX(0); }
}`,
  },

  // 24 ─ Pulse Attention ─────────────────────────────────────────────
  {
    id: "pulse-attention",
    name: "Pulse Attention",
    category: "animations",
    description: "Subtle attention pulse ring for call-to-action buttons",
    tags: ["pulse", "attention", "cta", "button"],
    previewType: "box",
    cssCode: `/* Pulse Attention — CTA button with expanding pulse ring */
.roycss-pulse-attention {
  width: 160px;
  height: 44px;
  border-radius: 22px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 6px 18px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.25);
}
.roycss-pulse-attention > div { display: none; }
.roycss-pulse-attention::before {
  content: "Get Started →";
  color: white;
  font-family: ui-sans-serif, sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.roycss-pulse-attention::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 22px;
  border: 2px solid #8b5cf6;
  animation: roy-b12-attention-pulse 2s ease-out infinite;
  pointer-events: none;
}
@keyframes roy-b12-attention-pulse {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.35); opacity: 0; }
}`,
  },

  // 25 ─ Bounce Notification ─────────────────────────────────────────
  {
    id: "bounce-notification",
    name: "Bounce Notification",
    category: "animations",
    description: "Toast notification that slides in from the right and bounces to settle",
    tags: ["notification", "toast", "bounce", "slide"],
    previewType: "box",
    cssCode: `/* Bounce Notification — slides in and bounces to settle */
.roycss-bounce-notification {
  width: 240px;
  height: 56px;
  background: #1e293b;
  border-left: 4px solid #10b981;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  padding: 0 14px;
  box-sizing: border-box;
  animation: roy-b12-notif-bounce 4s ease-in-out infinite;
}
.roycss-bounce-notification > div { display: none; }
.roycss-bounce-notification::before {
  content: "✓";
  width: 28px; height: 28px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  margin-right: 10px;
  flex-shrink: 0;
  box-shadow: 0 0 10px rgba(16,185,129,0.5);
}
.roycss-bounce-notification::after {
  content: "Saved successfully";
  color: #e2e8f0;
  font-family: ui-sans-serif, sans-serif;
  font-size: 13px;
  font-weight: 500;
}
@keyframes roy-b12-notif-bounce {
  0%   { transform: translateX(130%); }
  15%  { transform: translateX(-6%); }
  22%  { transform: translateX(3%); }
  28%  { transform: translateX(-1%); }
  32%  { transform: translateX(0); }
  75%  { transform: translateX(0); }
  100% { transform: translateX(130%); }
}`,
  },

  // 26 ─ Flip Card Reveal ────────────────────────────────────────────
  {
    id: "flip-card-reveal",
    name: "Flip Card Reveal",
    category: "animations",
    description: "Card that flips on Y-axis to reveal back content with 3D perspective",
    tags: ["flip", "card", "3d", "reveal"],
    previewType: "box",
    cssCode: `/* Flip Card Reveal — 3D flip between front and back faces */
.roycss-flip-card-reveal {
  width: 160px;
  height: 100px;
  position: relative;
  perspective: 800px;
  background: transparent;
}
.roycss-flip-card-reveal > div { display: none; }
.roycss-flip-card-reveal::before,
.roycss-flip-card-reveal::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 10px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.roycss-flip-card-reveal::before {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  animation: roy-b12-flip-front 4s ease-in-out infinite;
}
.roycss-flip-card-reveal::after {
  background: linear-gradient(135deg, #ec4899, #f59e0b);
  transform: rotateY(180deg);
  animation: roy-b12-flip-back 4s ease-in-out infinite;
}
@keyframes roy-b12-flip-front {
  0%, 40%  { transform: rotateY(0deg); }
  50%, 90% { transform: rotateY(180deg); }
  100%     { transform: rotateY(360deg); }
}
@keyframes roy-b12-flip-back {
  0%, 40%  { transform: rotateY(180deg); }
  50%, 90% { transform: rotateY(360deg); }
  100%     { transform: rotateY(540deg); }
}`,
  },

  // 27 ─ Expand Collapse ─────────────────────────────────────────────
  {
    id: "expand-collapse",
    name: "Expand Collapse",
    category: "animations",
    description: "Smooth height animation simulating accordion expand/collapse using keyframes",
    tags: ["expand", "collapse", "accordion", "height"],
    previewType: "box",
    cssCode: `/* Expand Collapse — smooth height animation for accordion content */
.roycss-expand-collapse {
  width: 220px;
  height: 100px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
.roycss-expand-collapse > div { display: none; }
.roycss-expand-collapse::before {
  content: "▼  Expandable section";
  display: block;
  padding: 12px 14px;
  color: #e2e8f0;
  font-family: ui-sans-serif, sans-serif;
  font-size: 13px;
  font-weight: 600;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}
.roycss-expand-collapse::after {
  content: "Hidden content reveals smoothly using CSS height keyframe animation. No JavaScript required.";
  display: block;
  padding: 10px 14px;
  color: #94a3b8;
  font-family: ui-sans-serif, sans-serif;
  font-size: 11px;
  line-height: 1.5;
  background: #1e293b;
  height: 0;
  opacity: 0;
  overflow: hidden;
  animation: roy-b12-expand-collapse 4s ease-in-out infinite;
}
@keyframes roy-b12-expand-collapse {
  0%, 30%   { height: 0; opacity: 0; }
  50%, 80%  { height: 56px; opacity: 1; }
  100%      { height: 0; opacity: 0; }
}`,
  },

  // 28 ─ Slide In Panel ──────────────────────────────────────────────
  {
    id: "slide-in-panel",
    name: "Slide In Panel",
    category: "animations",
    description: "Side panel that slides in from the right edge with backdrop dim",
    tags: ["panel", "slide", "drawer", "sidebar"],
    previewType: "box",
    cssCode: `/* Slide In Panel — drawer that slides in from the right edge */
.roycss-slide-in-panel {
  width: 240px;
  height: 160px;
  background: #0f172a;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  border: 1px solid #1e293b;
}
.roycss-slide-in-panel > div { display: none; }
.roycss-slide-in-panel::before {
  /* backdrop dim */
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(45deg,
      rgba(59,130,246,0.15) 0 12px,
      rgba(139,92,246,0.15) 12px 24px);
  animation: roy-b12-panel-backdrop 3.5s ease-in-out infinite;
}
.roycss-slide-in-panel::after {
  /* the panel */
  content: "";
  position: absolute;
  top: 0; right: 0;
  width: 55%;
  height: 100%;
  background: linear-gradient(180deg, #1e293b, #0f172a);
  border-left: 1px solid #334155;
  box-shadow: -10px 0 30px rgba(0,0,0,0.4);
  transform: translateX(100%);
  animation: roy-b12-panel-slide 3.5s ease-in-out infinite;
}
@keyframes roy-b12-panel-backdrop {
  0%, 25%   { opacity: 0; }
  45%, 75%  { opacity: 1; }
  100%      { opacity: 0; }
}
@keyframes roy-b12-panel-slide {
  0%, 25%   { transform: translateX(100%); }
  45%, 75%  { transform: translateX(0); }
  100%      { transform: translateX(100%); }
}`,
  },

  // 29 ─ Modal Backdrop Blur ─────────────────────────────────────────
  {
    id: "modal-backdrop-blur",
    name: "Modal Backdrop Blur",
    category: "animations",
    description: "Modal dialog with backdrop blur entrance and scale-in card",
    tags: ["modal", "backdrop", "blur", "dialog"],
    previewType: "box",
    cssCode: `/* Modal Backdrop Blur — backdrop blurs in as modal scales up */
.roycss-modal-backdrop-blur {
  width: 240px;
  height: 160px;
  position: relative;
  background: #1e293b;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #1e293b;
}
.roycss-modal-backdrop-blur > div { display: none; }
.roycss-modal-backdrop-blur::before {
  /* colorful backdrop */
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(45deg,
    #3b82f6 0 12px,
    #8b5cf6 12px 24px,
    #ec4899 24px 36px,
    #f59e0b 36px 48px);
  filter: blur(0px) brightness(1);
  animation: roy-b12-modal-blur 3.5s ease-in-out infinite;
}
.roycss-modal-backdrop-blur::after {
  /* modal card */
  content: "Modal";
  position: absolute;
  top: 50%; left: 50%;
  width: 60%; height: 50%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e2e8f0;
  font-family: ui-sans-serif, sans-serif;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 1px;
  transform: translate(-50%, -50%) scale(0.8);
  opacity: 0;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  animation: roy-b12-modal-card 3.5s ease-in-out infinite;
}
@keyframes roy-b12-modal-blur {
  0%, 25%   { filter: blur(0px) brightness(1); }
  45%, 75%  { filter: blur(8px) brightness(0.6); }
  100%      { filter: blur(0px) brightness(1); }
}
@keyframes roy-b12-modal-card {
  0%, 25%   { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
  45%, 75%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100%      { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
}`,
  },

  // 30 ─ Tooltip Follow ──────────────────────────────────────────────
  {
    id: "tooltip-follow",
    name: "Tooltip Follow",
    category: "animations",
    description: "Tooltip that moves around a hover target simulating cursor following",
    tags: ["tooltip", "cursor", "follow", "hint"],
    previewType: "box",
    cssCode: `/* Tooltip Follow — tooltip moves around target area */
.roycss-tooltip-follow {
  width: 240px;
  height: 100px;
  position: relative;
  background: #0f172a;
  border: 1px dashed #334155;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-tooltip-follow > div { display: none; }
.roycss-tooltip-follow::before {
  content: "Hover target";
  color: #94a3b8;
  font-family: ui-sans-serif, sans-serif;
  font-size: 14px;
  font-weight: 500;
}
.roycss-tooltip-follow::after {
  content: "Following cursor ↑";
  position: absolute;
  top: 8px; left: 20%;
  padding: 6px 10px;
  background: #1e293b;
  color: #e2e8f0;
  font-family: ui-sans-serif, sans-serif;
  font-size: 11px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid #334155;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  animation: roy-b12-tooltip-move 4s ease-in-out infinite;
}
@keyframes roy-b12-tooltip-move {
  0%   { top: 8px;  left: 15%; }
  25%  { top: 40px; left: 35%; }
  50%  { top: 15px; left: 60%; }
  75%  { top: 50px; left: 40%; }
  100% { top: 8px;  left: 15%; }
}`,
  },

  // 31 ─ Drag Handle Grip ────────────────────────────────────────────
  {
    id: "drag-handle-grip",
    name: "Drag Handle Grip",
    category: "animations",
    description: "Drag handle with 6 grip dots that subtly shake to indicate draggability",
    tags: ["drag", "handle", "grip", "sortable"],
    previewType: "box",
    cssCode: `/* Drag Handle Grip — 6-dot grip with subtle shake hint */
.roycss-drag-handle-grip {
  width: 60px;
  height: 100px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}
.roycss-drag-handle-grip > div { display: none; }
.roycss-drag-handle-grip::before {
  /* 6 grip dots in a 2x3 grid */
  content: "";
  width: 16px;
  height: 40px;
  background:
    radial-gradient(circle at 4px 5px,  #94a3b8 0 2.5px, transparent 3px),
    radial-gradient(circle at 12px 5px, #94a3b8 0 2.5px, transparent 3px),
    radial-gradient(circle at 4px 20px, #94a3b8 0 2.5px, transparent 3px),
    radial-gradient(circle at 12px 20px,#94a3b8 0 2.5px, transparent 3px),
    radial-gradient(circle at 4px 35px, #94a3b8 0 2.5px, transparent 3px),
    radial-gradient(circle at 12px 35px,#94a3b8 0 2.5px, transparent 3px);
  background-repeat: no-repeat;
  animation: roy-b12-grip-shake 1.6s ease-in-out infinite;
}
.roycss-drag-handle-grip::after {
  /* hover highlight halo */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: rgba(59,130,246,0);
  animation: roy-b12-grip-hover 1.6s ease-in-out infinite;
}
@keyframes roy-b12-grip-shake {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-2px) rotate(-2deg); }
  75% { transform: translateY(-2px) rotate(2deg); }
}
@keyframes roy-b12-grip-hover {
  0%, 100% { background: rgba(59,130,246,0); }
  50% { background: rgba(59,130,246,0.12); }
}`,
  },

  // 32 ─ Context Menu ────────────────────────────────────────────────
  {
    id: "context-menu",
    name: "Context Menu",
    category: "animations",
    description: "Right-click context menu that scales in from origin with item list",
    tags: ["context-menu", "right-click", "menu", "popup"],
    previewType: "box",
    cssCode: `/* Context Menu — popup menu that scales in from top-left */
.roycss-context-menu {
  width: 200px;
  height: 160px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  border: 1px solid #1e293b;
}
.roycss-context-menu > div { display: none; }
.roycss-context-menu::before {
  /* menu panel with item bars */
  content: "";
  position: absolute;
  top: 30px; left: 30px;
  width: 140px;
  height: 110px;
  background:
    linear-gradient(#60a5fa, #60a5fa) 10px 10px / 10px 10px no-repeat,
    linear-gradient(#e2e8f0, #e2e8f0) 26px 10px / 80px 10px no-repeat,
    linear-gradient(#94a3b8, #94a3b8) 10px 28px / 10px 10px no-repeat,
    linear-gradient(#e2e8f0, #e2e8f0) 26px 28px / 70px 10px no-repeat,
    linear-gradient(#94a3b8, #94a3b8) 10px 46px / 10px 10px no-repeat,
    linear-gradient(#e2e8f0, #e2e8f0) 26px 46px / 60px 10px no-repeat,
    linear-gradient(#334155, #334155) 10px 62px / 120px 1px no-repeat,
    linear-gradient(#94a3b8, #94a3b8) 10px 70px / 10px 10px no-repeat,
    linear-gradient(#ef4444, #ef4444) 26px 70px / 50px 10px no-repeat,
    #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  transform: scale(0.3);
  transform-origin: top left;
  opacity: 0;
  animation: roy-b12-context-appear 3.5s ease-out infinite;
}
.roycss-context-menu::after {
  content: "Right-click here";
  position: absolute;
  bottom: 12px; right: 14px;
  color: #64748b;
  font-family: ui-sans-serif, sans-serif;
  font-size: 10px;
  font-weight: 500;
  animation: roy-b12-context-hint 3.5s ease-in-out infinite;
}
@keyframes roy-b12-context-appear {
  0%, 25%   { transform: scale(0.3); opacity: 0; }
  40%, 85%  { transform: scale(1); opacity: 1; }
  100%      { transform: scale(0.3); opacity: 0; }
}
@keyframes roy-b12-context-hint {
  0%, 25%   { opacity: 1; }
  40%, 100% { opacity: 0.3; }
}`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // CARDS — practical card patterns (8)
  // ═══════════════════════════════════════════════════════════════════

  // 33 ─ Card Skeleton Loader ────────────────────────────────────────
  {
    id: "card-skeleton-loader",
    name: "Card Skeleton Loader",
    category: "cards",
    description: "Card with image, title and text placeholders showing skeleton loading state",
    tags: ["card", "skeleton", "loader", "loading"],
    previewType: "card",
    cssCode: `/* Card Skeleton Loader — full card with skeleton placeholders */
.roycss-card-skeleton-loader {
  width: 240px;
  height: 160px;
  background-color: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  background-image:
    linear-gradient(#1e293b, #1e293b) 16px 16px / 208px 60px no-repeat,
    linear-gradient(#1e293b, #1e293b) 16px 92px / 160px 12px no-repeat,
    linear-gradient(#1e293b, #1e293b) 16px 114px / 200px 8px no-repeat,
    linear-gradient(#1e293b, #1e293b) 16px 130px / 180px 8px no-repeat;
}
.roycss-card-skeleton-loader > span { display: none; }
.roycss-card-skeleton-loader::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg,
    transparent 30%,
    rgba(148,163,184,0.12) 50%,
    transparent 70%);
  background-size: 250% 100%;
  background-repeat: no-repeat;
  animation: roy-b12-card-skel-shimmer 1.5s linear infinite;
}
@keyframes roy-b12-card-skel-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -50% 0; }
}`,
  },

  // 34 ─ Card Empty State ────────────────────────────────────────────
  {
    id: "card-empty-state",
    name: "Card Empty State",
    category: "cards",
    description: "Empty state card with floating open-box illustration and helpful text",
    tags: ["card", "empty-state", "illustration", "placeholder"],
    previewType: "card",
    cssCode: `/* Card Empty State — empty box illustration with floating animation */
.roycss-card-empty-state {
  width: 240px;
  height: 180px;
  background: linear-gradient(180deg, #0f172a, #1e293b);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.roycss-card-empty-state > span { display: none; }
.roycss-card-empty-state::before {
  /* open-box illustration */
  content: "";
  width: 60px;
  height: 50px;
  margin-bottom: 14px;
  background:
    /* lid (trapezoid via clip-path on a gradient) */
    linear-gradient(135deg, #64748b, #475569),
    /* box body */
    linear-gradient(180deg, #475569, #334155);
  background-position: 0 0, 0 12px;
  background-size: 100% 12px, 100% 38px;
  background-repeat: no-repeat;
  border-radius: 3px;
  clip-path: polygon(
    10% 24%, 90% 24%, 100% 0%, 0% 0%,
    0% 0%, 0% 100%, 100% 100%, 100% 24%
  );
  animation: roy-b12-empty-float 3s ease-in-out infinite;
}
.roycss-card-empty-state::after {
  content: "No items found";
  color: #94a3b8;
  font-family: ui-sans-serif, sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
@keyframes roy-b12-empty-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(-2deg); }
}`,
  },

  // 35 ─ Card Error State ────────────────────────────────────────────
  {
    id: "card-error-state",
    name: "Card Error State",
    category: "cards",
    description: "Error state card with pulsing red circle containing an X mark",
    tags: ["card", "error-state", "alert", "failure"],
    previewType: "card",
    cssCode: `/* Card Error State — pulsing red circle with X mark */
.roycss-card-error-state {
  width: 240px;
  height: 160px;
  background: linear-gradient(180deg, #0f172a, #1c1010);
  border: 1px solid #7f1d1d;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 30px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.04);
}
.roycss-card-error-state > span { display: none; }
.roycss-card-error-state::before {
  /* circle with X drawn via crossed gradients */
  content: "";
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background:
    linear-gradient(45deg, transparent 45%, #ef4444 45% 55%, transparent 55%) 0 0 / 100% 100% no-repeat,
    linear-gradient(-45deg, transparent 45%, #ef4444 45% 55%, transparent 55%) 0 0 / 100% 100% no-repeat,
    rgba(239,68,68,0.15);
  border: 2px solid #ef4444;
  margin-bottom: 14px;
  animation: roy-b12-error-pulse 2s ease-in-out infinite;
}
.roycss-card-error-state::after {
  content: "Something went wrong";
  color: #fca5a5;
  font-family: ui-sans-serif, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
}
@keyframes roy-b12-error-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(239,68,68,0.4); }
  50% { box-shadow: 0 0 35px rgba(239,68,68,0.7); }
}`,
  },

  // 36 ─ Card Success State ──────────────────────────────────────────
  {
    id: "card-success-state",
    name: "Card Success State",
    category: "cards",
    description: "Success state card with green circle and animated checkmark reveal",
    tags: ["card", "success-state", "complete", "confirmation"],
    previewType: "card",
    cssCode: `/* Card Success State — green circle with checkmark reveal */
.roycss-card-success-state {
  width: 240px;
  height: 160px;
  background: linear-gradient(180deg, #0f172a, #052e1a);
  border: 1px solid #10b981;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 30px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.04);
}
.roycss-card-success-state > span { display: none; }
.roycss-card-success-state::before {
  /* circle */
  content: "";
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(16,185,129,0.15);
  border: 2px solid #10b981;
  margin-bottom: 14px;
  box-shadow: 0 0 20px rgba(16,185,129,0.4);
  animation: roy-b12-success-pulse 2.2s ease-in-out infinite;
}
.roycss-card-success-state::after {
  /* checkmark drawn via borders, positioned over the circle */
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  width: 22px;
  height: 11px;
  border-left: 4px solid #10b981;
  border-bottom: 4px solid #10b981;
  transform: translate(-50%, calc(-50% - 18px)) rotate(-45deg);
  animation: roy-b12-check-draw 2.2s ease-in-out infinite;
}
@keyframes roy-b12-success-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.4); }
  50% { box-shadow: 0 0 32px rgba(16,185,129,0.7); }
}
@keyframes roy-b12-check-draw {
  0%, 30%  { opacity: 0; transform: translate(-50%, calc(-50% - 18px)) rotate(-45deg) scale(0.4); }
  60%, 100%{ opacity: 1; transform: translate(-50%, calc(-50% - 18px)) rotate(-45deg) scale(1); }
}`,
  },

  // 37 ─ Card Pricing Highlight ──────────────────────────────────────
  {
    id: "card-pricing-highlight",
    name: "Pricing Card Highlight",
    category: "cards",
    description: "Pricing card with animated gradient border, plan info and Most Popular badge",
    tags: ["card", "pricing", "popular", "gradient-border"],
    previewType: "card",
    cssCode: `/* Pricing Card Highlight — animated gradient border + popular badge */
.roycss-card-pricing-highlight {
  width: 200px;
  height: 260px;
  background:
    linear-gradient(#60a5fa, #60a5fa) 50% 30px / 70px 12px no-repeat,
    linear-gradient(#e2e8f0, #e2e8f0) 50% 56px / 90px 30px no-repeat,
    linear-gradient(#94a3b8, #94a3b8) 50% 92px / 40px 8px no-repeat,
    linear-gradient(#334155, #334155) 16px 112px / 168px 1px no-repeat,
    linear-gradient(#475569, #475569) 50% 128px / 140px 8px no-repeat,
    linear-gradient(#475569, #475569) 50% 148px / 120px 8px no-repeat,
    linear-gradient(#475569, #475569) 50% 168px / 100px 8px no-repeat,
    linear-gradient(135deg, #3b82f6, #8b5cf6) 50% 200px / 168px 36px no-repeat,
    linear-gradient(180deg, #1e293b, #0f172a);
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0,0,0,0.4);
}
.roycss-card-pricing-highlight > span { display: none; }
.roycss-card-pricing-highlight::before {
  /* animated gradient border via mask cutout */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 14px;
  padding: 2px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #3b82f6);
  background-size: 300% 300%;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
  animation: roy-b12-pricing-border 4s linear infinite;
  pointer-events: none;
}
.roycss-card-pricing-highlight::after {
  /* "POPULAR" badge */
  content: "★ POPULAR";
  position: absolute;
  top: 0; right: 18px;
  padding: 4px 10px 6px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: white;
  font-family: ui-sans-serif, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 10px rgba(245,158,11,0.5);
}
@keyframes roy-b12-pricing-border {
  0%   { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}`,
  },

  // 38 ─ Card Profile Avatar ─────────────────────────────────────────
  {
    id: "card-profile-avatar",
    name: "Profile Card Avatar",
    category: "cards",
    description: "Profile card with rotating conic-gradient avatar ring and bio text bars",
    tags: ["card", "profile", "avatar", "ring"],
    previewType: "card",
    cssCode: `/* Profile Card Avatar — rotating gradient ring around avatar */
.roycss-card-profile-avatar {
  width: 200px;
  height: 240px;
  background:
    linear-gradient(#e2e8f0, #e2e8f0) 50% 124px / 100px 14px no-repeat,
    linear-gradient(#60a5fa, #60a5fa) 50% 146px / 60px 8px no-repeat,
    linear-gradient(#475569, #475569) 50% 170px / 160px 6px no-repeat,
    linear-gradient(#475569, #475569) 50% 182px / 140px 6px no-repeat,
    linear-gradient(#475569, #475569) 50% 194px / 120px 6px no-repeat,
    linear-gradient(180deg, #1e293b, #0f172a);
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  border: 1px solid #1e293b;
}
.roycss-card-profile-avatar > span { display: none; }
.roycss-card-profile-avatar::before {
  /* rotating gradient ring */
  content: "";
  position: absolute;
  top: 22px; left: 50%;
  width: 86px; height: 86px;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
    #3b82f6, #8b5cf6, #ec4899, #f59e0b, #3b82f6);
  transform: translateX(-50%);
  animation: roy-b12-avatar-spin 4s linear infinite;
}
.roycss-card-profile-avatar::after {
  /* avatar face (static, on top of ring) */
  content: "";
  position: absolute;
  top: 28px; left: 50%;
  width: 74px; height: 74px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fbbf24, #d97706);
  transform: translateX(-50%);
  box-shadow:
    inset 0 0 0 3px #1e293b,
    inset -3px -4px 8px rgba(0,0,0,0.25),
    0 4px 12px rgba(0,0,0,0.3);
}
@keyframes roy-b12-avatar-spin {
  from { transform: translateX(-50%) rotate(0deg); }
  to   { transform: translateX(-50%) rotate(360deg); }
}`,
  },

  // 39 ─ Card Notification ───────────────────────────────────────────
  {
    id: "card-notification",
    name: "Notification Card",
    category: "cards",
    description: "Notification card with icon, message lines and dismiss X button",
    tags: ["card", "notification", "dismiss", "alert"],
    previewType: "card",
    cssCode: `/* Notification Card — icon + text bars + dismiss button */
.roycss-card-notification {
  width: 240px;
  height: 80px;
  background: #1e293b;
  border-radius: 10px;
  position: relative;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  overflow: hidden;
}
.roycss-card-notification > span { display: none; }
.roycss-card-notification::before {
  /* info icon + title + body bars */
  content: "";
  position: absolute;
  top: 14px; left: 14px; right: 36px; bottom: 14px;
  background:
    radial-gradient(circle, #60a5fa 0 12px, transparent 13px) 0 6px / 24px 24px no-repeat,
    linear-gradient(#e2e8f0, #e2e8f0) 32px 4px / 160px 12px no-repeat,
    linear-gradient(#94a3b8, #94a3b8) 32px 24px / 130px 8px no-repeat;
}
.roycss-card-notification::after {
  /* dismiss X button */
  content: "✕";
  position: absolute;
  top: 10px; right: 8px;
  width: 22px; height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-family: ui-sans-serif, sans-serif;
  font-size: 13px;
  font-weight: 600;
  border-radius: 4px;
  animation: roy-b12-dismiss-pulse 2s ease-in-out infinite;
}
@keyframes roy-b12-dismiss-pulse {
  0%, 100% { background: rgba(148,163,184,0); color: #94a3b8; }
  50% { background: rgba(148,163,184,0.18); color: #e2e8f0; }
}`,
  },

  // 40 ─ Card Search Result ──────────────────────────────────────────
  {
    id: "card-search-result",
    name: "Search Result Card",
    category: "cards",
    description: "Search result card with magnifier icon, title with highlighted match, and snippet",
    tags: ["card", "search", "result", "highlight"],
    previewType: "card",
    cssCode: `/* Search Result Card — magnifier icon + highlighted match in title */
.roycss-card-search-result {
  width: 240px;
  height: 80px;
  background: #1e293b;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  border: 1px solid #334155;
}
.roycss-card-search-result > span { display: none; }
.roycss-card-search-result::before {
  /* magnifier glass icon (SVG data URI) */
  content: "";
  position: absolute;
  top: 18px; left: 14px;
  width: 22px; height: 22px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360a5fa' stroke-width='2.5' stroke-linecap='round'%3E%3Ccircle cx='10' cy='10' r='6'/%3E%3Cline x1='14.5' y1='14.5' x2='20' y2='20'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}
.roycss-card-search-result::after {
  /* title with highlighted match + url + snippet */
  content: "";
  position: absolute;
  top: 12px; left: 46px; right: 14px; bottom: 12px;
  background:
    /* title: "lorem " + highlighted "ips" + " dolor" */
    linear-gradient(#e2e8f0, #e2e8f0) 0 4px / 50px 12px no-repeat,
    linear-gradient(#fbbf24, #fbbf24) 50px 4px / 30px 12px no-repeat,
    linear-gradient(#fde68a, #fde68a) 50px 4px / 30px 12px no-repeat,
    linear-gradient(#e2e8f0, #e2e8f0) 84px 4px / 70px 12px no-repeat,
    /* url */
    linear-gradient(#60a5fa, #60a5fa) 0 22px / 110px 8px no-repeat,
    /* snippet line 1 */
    linear-gradient(#94a3b8, #94a3b8) 0 38px / 170px 6px no-repeat,
    /* snippet line 2 */
    linear-gradient(#94a3b8, #94a3b8) 0 48px / 140px 6px no-repeat;
  background-repeat: no-repeat;
  animation: roy-b12-search-glow 2s ease-in-out infinite;
}
@keyframes roy-b12-search-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.15); }
}`,
  },
];
