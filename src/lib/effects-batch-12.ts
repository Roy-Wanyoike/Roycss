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
  inline-size: 100px;
  block-size: 100px;
  border-radius: 50%;
  background: conic-gradient(
    oklch(0.696 0.149 162.48) calc(var(--roy-b12-radial-progress) * 360deg),
    oklch(0.279 0.037 260.03) 0
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
  inline-size: 78px;
  block-size: 78px;
  border-radius: 50%;
  background: oklch(0.208 0.04 265.75);
  box-shadow: inset 0 0 0 1px color-mix(in oklch, oklch(1 0 89.88) 6%, transparent);
}
.roycss-progress-radial-percentage::after {
  content: "75%";
  position: absolute;
  color: oklch(0.696 0.149 162.48);
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
  0%, 33%  { content: "25%"; color: oklch(0.769 0.165 70.08); }
  34%, 66% { content: "75%"; color: oklch(0.696 0.149 162.48); }
  67%, 100%{ content: "100%"; color: oklch(0.723 0.192 149.58); }
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
  inline-size: 220px;
  block-size: 30px;
  position: relative;
  background:
    radial-gradient(circle at 10px 15px, oklch(0.623 0.188 259.81) 0 6px, oklch(0.279 0.037 260.03) 7px 8px, transparent 9px),
    radial-gradient(circle at 110px 15px, oklch(0.606 0.219 292.72) 0 6px, oklch(0.279 0.037 260.03) 7px 8px, transparent 9px),
    radial-gradient(circle at 210px 15px, oklch(0.279 0.037 260.03) 0 6px, oklch(0.372 0.039 257.29) 7px 8px, transparent 9px);
}
.roycss-progress-step-indicator > div { display: none; }
.roycss-progress-step-indicator::before {
  content: "";
  position: absolute;
  inset-block-start: 14px; inset-inline-start: 16px; inset-inline-end: 16px;
  block-size: 2px;
  background: oklch(0.279 0.037 260.03);
  border-radius: 1px;
}
.roycss-progress-step-indicator::after {
  content: "";
  position: absolute;
  inset-block-start: 14px; inset-inline-start: 16px;
  block-size: 2px;
  inline-size: 0;
  background: linear-gradient(90deg, oklch(0.623 0.188 259.81), oklch(0.606 0.219 292.72));
  border-radius: 1px;
  box-shadow: 0 0 6px color-mix(in oklch, oklch(0.606 0.219 292.72) 60%, transparent);
  animation: roy-b12-step-fill 4s ease-in-out infinite;
}
@keyframes roy-b12-step-fill {
  0%, 10%   { inline-size: 0; }
  35%, 55%  { inline-size: 94px; }
  80%, 100% { inline-size: 194px; }
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
  inline-size: 200px;
  block-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  letter-spacing: 4px;
  line-block-size: 1;
  background: linear-gradient(90deg,
    oklch(0.837 0.164 84.43) var(--roy-b12-rating-fill),
    oklch(0.446 0.037 257.28) var(--roy-b12-rating-fill));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: drop-shadow(0 2px 6px color-mix(in oklch, oklch(0.837 0.164 84.43) 35%, transparent));
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
  inline-size: 80px;
  block-size: 80px;
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
  color: oklch(0.637 0.208 25.33);
  filter: drop-shadow(0 0 10px color-mix(in oklch, oklch(0.637 0.208 25.33) 60%, transparent));
  animation: roy-b12-like-beat 1.6s ease-in-out infinite;
}
.roycss-like-button-particle::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 50%, oklch(0.711 0.166 22.22) 0 3px, transparent 4px),
    radial-gradient(circle at 80% 50%, oklch(0.837 0.164 84.43) 0 3px, transparent 4px),
    radial-gradient(circle at 50% 20%, oklch(0.725 0.175 349.76) 0 3px, transparent 4px),
    radial-gradient(circle at 50% 80%, oklch(0.711 0.166 22.22) 0 3px, transparent 4px),
    radial-gradient(circle at 30% 25%, oklch(0.837 0.164 84.43) 0 3px, transparent 4px),
    radial-gradient(circle at 70% 25%, oklch(0.725 0.175 349.76) 0 3px, transparent 4px),
    radial-gradient(circle at 30% 75%, oklch(0.837 0.164 84.43) 0 3px, transparent 4px),
    radial-gradient(circle at 70% 75%, oklch(0.725 0.175 349.76) 0 3px, transparent 4px);
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
  inline-size: 80px;
  block-size: 80px;
  border-radius: 50%;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 12%, transparent);
  border: 2px solid oklch(0.696 0.149 162.48);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: roy-b12-copy-pop 2.4s ease-in-out infinite;
}
.roycss-copy-feedback > div { display: none; }
.roycss-copy-feedback::before {
  content: "";
  inline-size: 26px;
  block-size: 13px;
  border-inline-start: 4px solid oklch(0.696 0.149 162.48);
  border-block-end: 4px solid oklch(0.696 0.149 162.48);
  transform: rotate(-45deg) translate(2px, -3px);
  border-radius: 1px;
  animation: roy-b12-copy-check 2.4s ease-in-out infinite;
}
.roycss-copy-feedback::after {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid oklch(0.696 0.149 162.48);
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
  inline-size: 90px;
  block-size: 38px;
  border-radius: 19px;
  background: linear-gradient(90deg, oklch(0.809 0.096 251.81), oklch(0.623 0.188 259.81));
  border: 1px solid oklch(0.714 0.143 254.62);
  position: relative;
  box-shadow: inset 0 1px 3px color-mix(in oklch, oklch(0 0 0) 20%, transparent), 0 4px 12px color-mix(in oklch, oklch(0.623 0.188 259.81) 25%, transparent);
  animation: roy-b12-toggle-bg 4s ease-in-out infinite;
}
.roycss-toggle-dark-mode > div { display: none; }
.roycss-toggle-dark-mode::before {
  content: "";
  position: absolute;
  inset-block-start: 3px; inset-inline-start: 3px;
  inline-size: 30px; block-size: 30px;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.905 0.166 98.11), oklch(0.769 0.165 70.08));
  box-shadow: 0 0 14px color-mix(in oklch, oklch(0.905 0.166 98.11) 70%, transparent), inset -2px -2px 4px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  animation: roy-b12-toggle-knob 4s ease-in-out infinite;
}
.roycss-toggle-dark-mode::after {
  content: "";
  position: absolute;
  inset-block-start: 11px; inset-inline-end: 14px;
  inline-size: 14px; block-size: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 70% 30%, oklch(0.929 0.013 255.51), oklch(0.711 0.035 256.79));
  opacity: 0;
  box-shadow: 0 0 8px color-mix(in oklch, oklch(0.711 0.035 256.79) 50%, transparent);
  animation: roy-b12-toggle-stars 4s ease-in-out infinite;
}
@keyframes roy-b12-toggle-bg {
  0%, 45% {
    background: linear-gradient(90deg, oklch(0.809 0.096 251.81), oklch(0.623 0.188 259.81));
    border-color: oklch(0.714 0.143 254.62);
    box-shadow: inset 0 1px 3px color-mix(in oklch, oklch(0 0 0) 20%, transparent), 0 4px 12px color-mix(in oklch, oklch(0.623 0.188 259.81) 25%, transparent);
  }
  55%, 100% {
    background: linear-gradient(90deg, oklch(0.279 0.037 260.03), oklch(0.208 0.04 265.75));
    border-color: oklch(0.372 0.039 257.29);
    box-shadow: inset 0 1px 3px color-mix(in oklch, oklch(0 0 0) 40%, transparent), 0 4px 12px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  }
}
@keyframes roy-b12-toggle-knob {
  0%, 45% {
    inset-inline-start: 3px;
    background: radial-gradient(circle, oklch(0.905 0.166 98.11), oklch(0.769 0.165 70.08));
    box-shadow: 0 0 14px color-mix(in oklch, oklch(0.905 0.166 98.11) 70%, transparent), inset -2px -2px 4px color-mix(in oklch, oklch(0 0 0) 15%, transparent);
  }
  55%, 100% {
    inset-inline-start: 57px;
    background: radial-gradient(circle at 65% 35%, oklch(0.929 0.013 255.51), oklch(0.711 0.035 256.79));
    box-shadow: 0 0 10px color-mix(in oklch, oklch(0.711 0.035 256.79) 60%, transparent), inset -6px -3px 0 0 oklch(0.446 0.037 257.28), inset -2px -2px 4px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
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
  inline-size: 220px;
  block-size: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.roycss-password-strength > div { display: none; }
.roycss-password-strength::before {
  content: "";
  inline-size: 100%;
  block-size: 8px;
  border-radius: 4px;
  background: oklch(0.279 0.037 260.03);
  background-image: linear-gradient(90deg, oklch(0.637 0.208 25.33), oklch(0.769 0.165 70.08) 50%, oklch(0.723 0.192 149.58));
  background-size: 25% 100%;
  background-repeat: no-repeat;
  background-position: 0 0;
  transition: background-size 0.3s ease;
  animation: roy-b12-pw-fill 3s ease-in-out infinite;
}
.roycss-password-strength::after {
  content: "Weak";
  position: absolute;
  inset-block-start: -2px; inset-inline-start: 0;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: oklch(0.711 0.035 256.79);
  animation: roy-b12-pw-label 3s steps(1) infinite;
}
@keyframes roy-b12-pw-fill {
  0%, 5% { background-size: 25% 100%; }
  35%, 60% { background-size: 55% 100%; }
  70%, 100% { background-size: 100% 100%; }
}
@keyframes roy-b12-pw-label {
  0%, 32%  { content: "Weak"; color: oklch(0.637 0.208 25.33); }
  33%, 65% { content: "Good"; color: oklch(0.769 0.165 70.08); }
  66%, 100%{ content: "Strong"; color: oklch(0.723 0.192 149.58); }
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
  inline-size: 240px;
  block-size: 64px;
  background: oklch(0.208 0.04 265.75);
  border: 1px solid oklch(0.279 0.037 260.03);
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
  color: oklch(0.869 0.02 252.89);
  font-weight: 500;
}
.roycss-upload-progress::after {
  content: "";
  position: absolute;
  inset-block-end: 12px; inset-inline-start: 14px; inset-inline-end: 14px;
  block-size: 8px;
  border-radius: 4px;
  background: oklch(0.279 0.037 260.03);
  background-image: linear-gradient(90deg, oklch(0.623 0.188 259.81), oklch(0.606 0.219 292.72));
  background-size: 0% 100%;
  background-repeat: no-repeat;
  animation: roy-b12-upload-fill 4s ease-in-out infinite;
}
@keyframes roy-b12-upload-fill {
  0%   { background-size: 0% 100%; }
  80%  { background-size: 100% 100%; }
  90%  { background-size: 100% 100%; background-image: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.723 0.192 149.58)); }
  100% { background-size: 100% 100%; background-image: linear-gradient(90deg, oklch(0.696 0.149 162.48), oklch(0.723 0.192 149.58)); }
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
  inline-size: 64px;
  block-size: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, oklch(0.637 0.208 25.33), oklch(0.577 0.215 27.33));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ui-monospace, monospace;
  font-size: 20px;
  font-weight: 700;
  color: white;
  box-shadow: 0 6px 18px color-mix(in oklch, oklch(0.637 0.208 25.33) 50%, transparent), inset 0 -3px 6px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
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
  border: 2px solid oklch(0.637 0.208 25.33);
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
  inline-size: 220px;
  block-size: 130px;
  background:
    radial-gradient(circle 22px at 36px 38px, oklch(0.279 0.037 260.03) 99%, transparent 100%),
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 76px 22px / 130px 12px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 76px 42px / 100px 10px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 14px 80px / 192px 10px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 14px 98px / 150px 10px no-repeat,
    oklch(0.208 0.04 265.75);
  border: 1px solid oklch(0.279 0.037 260.03);
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
    color-mix(in oklch, oklch(0.711 0.035 256.79) 14%, transparent) 50%,
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
  inline-size: 220px;
  block-size: 110px;
  background:
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 0 0 / 100% 12px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 0 22px / 92% 12px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 0 44px / 85% 12px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 0 66px / 60% 12px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 0 88px / 40% 12px no-repeat,
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
    color-mix(in oklch, oklch(0.711 0.035 256.79) 18%, transparent) 50%,
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
  inline-size: 100px;
  block-size: 100px;
  border-radius: 50%;
  background: conic-gradient(
    oklch(0.623 0.188 259.81) calc(var(--roy-b12-countdown-remaining) * 360deg),
    oklch(0.279 0.037 260.03) 0
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
  inline-size: 80px;
  block-size: 80px;
  border-radius: 50%;
  background: oklch(0.208 0.04 265.75);
  box-shadow: inset 0 0 0 1px color-mix(in oklch, oklch(1 0 89.88) 6%, transparent);
}
.roycss-countdown-timer::after {
  content: "5";
  position: absolute;
  color: oklch(0.714 0.143 254.62);
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
  inline-size: 220px;
  block-size: 140px;
  background-color: oklch(0.208 0.04 265.75);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  background-image:
    linear-gradient(180deg, oklch(0.623 0.188 259.81), oklch(0.424 0.181 265.64)),
    linear-gradient(180deg, oklch(0.606 0.219 292.72), oklch(0.432 0.211 292.76)),
    linear-gradient(180deg, oklch(0.656 0.212 354.31), oklch(0.459 0.17 3.82)),
    linear-gradient(180deg, oklch(0.696 0.149 162.48), oklch(0.432 0.086 166.91)),
    linear-gradient(180deg, oklch(0.769 0.165 70.08), oklch(0.473 0.125 46.2));
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
  inset-inline-start: 0; inset-inline-end: 0; inset-block-end: 0;
  block-size: 2px;
  background: oklch(0.372 0.039 257.29);
}
.roycss-chart-bar-grow::after {
  content: "";
  position: absolute;
  inset-inline-start: 0; inset-inline-end: 0; inset-block-start: 50%;
  block-size: 1px;
  background: oklch(0.279 0.037 260.03);
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
  inline-size: 220px;
  block-size: 140px;
  background-color: oklch(0.208 0.04 265.75);
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
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 0 50% / 100% 1px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 50% 0 / 1px 100% no-repeat;
}
.roycss-chart-line-draw::after {
  --roy-b12-line-reveal: 0%;
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle, oklch(0.714 0.143 254.62) 0 4px, transparent 5px) 8px 110px / 9px 9px no-repeat,
    radial-gradient(circle, oklch(0.714 0.143 254.62) 0 4px, transparent 5px) 72px 78px / 9px 9px no-repeat,
    radial-gradient(circle, oklch(0.714 0.143 254.62) 0 4px, transparent 5px) 136px 50px / 9px 9px no-repeat,
    radial-gradient(circle, oklch(0.714 0.143 254.62) 0 4px, transparent 5px) 200px 22px / 9px 9px no-repeat,
    oklch(0.623 0.188 259.81);
  clip-path: polygon(
    -2% 100%, 33% 70%, 66% 40%, 102% 12%,
    102% 18%, 66% 46%, 33% 76%, -2% 100%
  );
  -webkit-mask: linear-gradient(90deg,
    oklch(0 0 0) var(--roy-b12-line-reveal),
    transparent var(--roy-b12-line-reveal));
  mask: linear-gradient(90deg,
    oklch(0 0 0) var(--roy-b12-line-reveal),
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
  inline-size: 140px;
  block-size: 140px;
  border-radius: 50%;
  background: conic-gradient(
    oklch(0.623 0.188 259.81) 0deg 130deg,
    oklch(0.606 0.219 292.72) 130deg 230deg,
    oklch(0.656 0.212 354.31) 230deg 310deg,
    oklch(0.696 0.149 162.48) 310deg 360deg
  );
  position: relative;
  box-shadow: 0 6px 20px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  animation: roy-b12-donut-spin 12s linear infinite;
}
.roycss-chart-donut > div { display: none; }
.roycss-chart-donut::before {
  content: "";
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  background: oklch(0.208 0.04 265.75);
  box-shadow: inset 0 0 0 1px color-mix(in oklch, oklch(1 0 89.88) 6%, transparent);
}
.roycss-chart-donut::after {
  content: "TOTAL";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.711 0.035 256.79);
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
  inline-size: 180px;
  block-size: 110px;
  border-radius: 90px 90px 8px 8px;
  position: relative;
  background: conic-gradient(from -90deg at 50% 100%,
    oklch(0.723 0.192 149.58) 0deg 60deg,
    oklch(0.795 0.162 86.05) 60deg 120deg,
    oklch(0.637 0.208 25.33) 120deg 180deg,
    transparent 180deg 360deg
  );
  overflow: hidden;
}
.roycss-gauge-meter > div { display: none; }
.roycss-gauge-meter::before {
  /* inner mask creating the ring */
  content: "";
  position: absolute;
  inset-block-end: 0; inset-inline-start: 30px;
  inline-size: 120px; block-size: 60px;
  border-radius: 60px 60px 0 0;
  background: oklch(0.208 0.04 265.75);
}
.roycss-gauge-meter::after {
  /* needle */
  content: "";
  position: absolute;
  inset-block-end: 6px; inset-inline-start: 50%;
  inline-size: 4px; block-size: 70px;
  background: linear-gradient(180deg, oklch(0.984 0.003 247.86), oklch(0.869 0.02 252.89));
  border-radius: 2px;
  transform-origin: bottom center;
  transform: translateX(-50%) rotate(-80deg);
  box-shadow: 0 0 6px color-mix(in oklch, oklch(0 0 0) 60%, transparent);
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
  inline-size: 40px;
  block-size: 200px;
  position: relative;
  background: oklch(0.279 0.037 260.03);
  border-radius: 20px;
  border: 2px solid oklch(0.372 0.039 257.29);
  box-sizing: border-box;
}
.roycss-thermometer > div { display: none; }
.roycss-thermometer::before {
  /* mercury column */
  content: "";
  position: absolute;
  inset-block-end: 0; inset-inline-start: 50%;
  inline-size: 14px;
  block-size: 8%;
  background: linear-gradient(180deg, oklch(0.711 0.166 22.22) 0%, oklch(0.637 0.208 25.33) 100%);
  border-radius: 7px 7px 0 0;
  transform: translateX(-50%);
  box-shadow: inset 1px 0 1px color-mix(in oklch, oklch(1 0 89.88) 25%, transparent);
  animation: roy-b12-therm-fill 3s ease-in-out infinite alternate;
}
.roycss-thermometer::after {
  /* bulb */
  content: "";
  position: absolute;
  inset-block-end: -24px; inset-inline-start: 50%;
  inline-size: 46px; block-size: 46px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, oklch(0.711 0.166 22.22), oklch(0.505 0.19 27.52));
  transform: translateX(-50%);
  box-shadow:
    0 0 14px color-mix(in oklch, oklch(0.637 0.208 25.33) 50%, transparent),
    inset -4px -4px 8px color-mix(in oklch, oklch(0 0 0) 30%, transparent),
    inset 3px 3px 6px color-mix(in oklch, oklch(1 0 89.88) 15%, transparent);
}
@keyframes roy-b12-therm-fill {
  0%   { block-size: 8%; }
  50%  { block-size: 40%; background: linear-gradient(180deg, oklch(0.837 0.164 84.43), oklch(0.769 0.165 70.08)); }
  100% { block-size: 75%; background: linear-gradient(180deg, oklch(0.711 0.166 22.22), oklch(0.577 0.215 27.33)); }
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
  inline-size: 100px;
  block-size: 48px;
  position: relative;
  border: 2px solid oklch(0.446 0.037 257.28);
  border-radius: 8px;
  background: oklch(0.208 0.04 265.75);
  box-sizing: border-box;
}
.roycss-battery-level > div { display: none; }
.roycss-battery-level::before {
  /* terminal nub */
  content: "";
  position: absolute;
  inset-block-start: 14px; inset-inline-end: -6px;
  inline-size: 4px; block-size: 16px;
  background: oklch(0.446 0.037 257.28);
  border-radius: 0 2px 2px 0;
}
.roycss-battery-level::after {
  /* level fill */
  content: "";
  position: absolute;
  inset-block-start: 4px; inset-inline-start: 4px; inset-block-end: 4px;
  inline-size: 75%;
  border-radius: 4px;
  background: linear-gradient(180deg, oklch(0.8 0.182 151.71), oklch(0.627 0.17 149.21));
  box-shadow:
    inset 0 -3px 6px color-mix(in oklch, oklch(0 0 0) 20%, transparent),
    0 0 8px color-mix(in oklch, oklch(0.8 0.182 151.71) 50%, transparent);
  animation: roy-b12-battery-level 4s ease-in-out infinite;
}
@keyframes roy-b12-battery-level {
  0%, 10%   { inline-size: 85%; background: linear-gradient(180deg, oklch(0.8 0.182 151.71), oklch(0.627 0.17 149.21)); box-shadow: inset 0 -3px 6px color-mix(in oklch, oklch(0 0 0) 20%, transparent), 0 0 8px color-mix(in oklch, oklch(0.8 0.182 151.71) 50%, transparent); }
  40%, 55%  { inline-size: 50%; background: linear-gradient(180deg, oklch(0.861 0.173 91.94), oklch(0.681 0.142 75.83)); box-shadow: inset 0 -3px 6px color-mix(in oklch, oklch(0 0 0) 20%, transparent), 0 0 8px color-mix(in oklch, oklch(0.861 0.173 91.94) 50%, transparent); }
  75%, 90%  { inline-size: 20%; background: linear-gradient(180deg, oklch(0.711 0.166 22.22), oklch(0.577 0.215 27.33)); box-shadow: inset 0 -3px 6px color-mix(in oklch, oklch(0 0 0) 20%, transparent), 0 0 8px color-mix(in oklch, oklch(0.637 0.208 25.33) 50%, transparent); }
  100%      { inline-size: 85%; background: linear-gradient(180deg, oklch(0.8 0.182 151.71), oklch(0.627 0.17 149.21)); box-shadow: inset 0 -3px 6px color-mix(in oklch, oklch(0 0 0) 20%, transparent), 0 0 8px color-mix(in oklch, oklch(0.8 0.182 151.71) 50%, transparent); }
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
  inline-size: 80px;
  block-size: 60px;
  position: relative;
  background-image:
    linear-gradient(180deg, oklch(0.8 0.182 151.71), oklch(0.627 0.17 149.21)),
    linear-gradient(180deg, oklch(0.8 0.182 151.71), oklch(0.627 0.17 149.21)),
    linear-gradient(180deg, oklch(0.8 0.182 151.71), oklch(0.627 0.17 149.21)),
    linear-gradient(180deg, oklch(0.8 0.182 151.71), oklch(0.627 0.17 149.21));
  background-position:
    8px bottom,
    24px bottom,
    40px bottom,
    56px bottom;
  background-repeat: no-repeat;
  background-size: 12px 14px, 12px 24px, 12px 34px, 12px 44px;
  filter: drop-shadow(0 0 6px color-mix(in oklch, oklch(0.8 0.182 151.71) 40%, transparent));
  animation: roy-b12-signal-wave 1.6s ease-in-out infinite;
}
.roycss-signal-strength > div { display: none; }
@keyframes roy-b12-signal-wave {
  0%, 100% {
    background-size: 12px 8px, 12px 16px, 12px 24px, 12px 32px;
    filter: drop-shadow(0 0 4px color-mix(in oklch, oklch(0.8 0.182 151.71) 30%, transparent));
  }
  50% {
    background-size: 12px 18px, 12px 28px, 12px 38px, 12px 50px;
    filter: drop-shadow(0 0 12px color-mix(in oklch, oklch(0.8 0.182 151.71) 80%, transparent));
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
  inline-size: 220px;
  block-size: 140px;
  background-color: oklch(0.208 0.04 265.75);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  background-image:
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)),
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)),
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)),
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)),
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)),
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03));
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
    color-mix(in oklch, oklch(0.711 0.035 256.79) 15%, transparent) 50%,
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
  inline-size: 240px;
  block-size: 160px;
  position: relative;
  background:
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 0 0 / 100% 28px no-repeat,
    linear-gradient(oklch(0.208 0.04 265.75), oklch(0.208 0.04 265.75)) 0 28px / 100% 132px no-repeat,
    repeating-linear-gradient(180deg,
      transparent 0 30px,
      color-mix(in oklch, oklch(0.711 0.035 256.79) 4%, transparent) 30px 60px) 0 28px / 100% 132px no-repeat;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid oklch(0.279 0.037 260.03);
}
.roycss-data-table-row-highlight > div { display: none; }
.roycss-data-table-row-highlight::before {
  /* column dividers */
  content: "";
  position: absolute;
  inset-block-start: 28px; inset-inline-start: 0; inset-inline-end: 0; inset-block-end: 0;
  background:
    linear-gradient(oklch(0.372 0.039 257.29), oklch(0.372 0.039 257.29)) 80px 0 / 1px 100% no-repeat,
    linear-gradient(oklch(0.372 0.039 257.29), oklch(0.372 0.039 257.29)) 160px 0 / 1px 100% no-repeat;
}
.roycss-data-table-row-highlight::after {
  /* scanning highlight row */
  content: "";
  position: absolute;
  inset-inline-start: 0; inset-inline-end: 0;
  inset-block-start: 28px;
  block-size: 26px;
  background: linear-gradient(90deg,
    color-mix(in oklch, oklch(0.623 0.188 259.81) 25%, transparent),
    color-mix(in oklch, oklch(0.606 0.219 292.72) 25%, transparent));
  border-inline-start: 3px solid oklch(0.623 0.188 259.81);
  border-inline-end: 3px solid oklch(0.606 0.219 292.72);
  animation: roy-b12-table-scan 3s ease-in-out infinite;
}
@keyframes roy-b12-table-scan {
  0%   { inset-block-start: 28px; }
  100% { inset-block-start: 134px; }
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
  inline-size: 240px;
  block-size: 160px;
  background: oklch(0.208 0.04 265.75);
  border: 1px solid oklch(0.279 0.037 260.03);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}
.roycss-code-block-syntax > div { display: none; }
.roycss-code-block-syntax::before {
  /* traffic light dots */
  content: "";
  position: absolute;
  inset-block-start: 10px; inset-inline-start: 12px;
  inline-size: 10px; block-size: 10px;
  background: oklch(0.637 0.208 25.33);
  border-radius: 50%;
  box-shadow: 18px 0 0 oklch(0.769 0.165 70.08), 36px 0 0 oklch(0.696 0.149 162.48);
}
.roycss-code-block-syntax::after {
  /* token stripes per line */
  content: "";
  position: absolute;
  inset-block-start: 36px; inset-inline-start: 14px; inset-inline-end: 14px; inset-block-end: 14px;
  background:
    /* line 1: keyword | ident | = | string */
    linear-gradient(oklch(0.722 0.177 305.5), oklch(0.722 0.177 305.5)) 0 0 / 40px 7px no-repeat,
    linear-gradient(oklch(0.714 0.143 254.62), oklch(0.714 0.143 254.62)) 44px 0 / 50px 7px no-repeat,
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 98px 0 / 6px 7px no-repeat,
    linear-gradient(oklch(0.696 0.149 162.48), oklch(0.696 0.149 162.48)) 108px 0 / 80px 7px no-repeat,
    /* line 2: keyword | ident | = | number */
    linear-gradient(oklch(0.722 0.177 305.5), oklch(0.722 0.177 305.5)) 0 16px / 30px 7px no-repeat,
    linear-gradient(oklch(0.714 0.143 254.62), oklch(0.714 0.143 254.62)) 34px 16px / 60px 7px no-repeat,
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 98px 16px / 6px 7px no-repeat,
    linear-gradient(oklch(0.758 0.159 55.93), oklch(0.758 0.159 55.93)) 108px 16px / 22px 7px no-repeat,
    /* line 3: function call */
    linear-gradient(oklch(0.725 0.175 349.76), oklch(0.725 0.175 349.76)) 0 32px / 40px 7px no-repeat,
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 42px 32px / 8px 7px no-repeat,
    linear-gradient(oklch(0.714 0.143 254.62), oklch(0.714 0.143 254.62)) 52px 32px / 80px 7px no-repeat,
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 134px 32px / 6px 7px no-repeat,
    /* line 4: comment */
    linear-gradient(oklch(0.554 0.041 257.42), oklch(0.554 0.041 257.42)) 0 48px / 170px 7px no-repeat,
    /* line 5: chain */
    linear-gradient(oklch(0.714 0.143 254.62), oklch(0.714 0.143 254.62)) 0 64px / 30px 7px no-repeat,
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 32px 64px / 12px 7px no-repeat,
    linear-gradient(oklch(0.725 0.175 349.76), oklch(0.725 0.175 349.76)) 46px 64px / 50px 7px no-repeat;
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
  inline-size: 240px;
  block-size: 44px;
  background: oklch(0.19 0.02 19.14);
  border: 2px solid oklch(0.637 0.208 25.33);
  border-radius: 8px;
  position: relative;
  box-shadow: 0 0 0 4px color-mix(in oklch, oklch(0.637 0.208 25.33) 15%, transparent), 0 4px 12px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  animation: roy-b12-shake-error 3s ease-in-out infinite;
}
.roycss-shake-error-input > div { display: none; }
.roycss-shake-error-input::before {
  content: "✉  invalid@email";
  position: absolute;
  inset-block-start: 50%; inset-inline-start: 14px;
  transform: translateY(-50%);
  color: oklch(0.808 0.103 19.57);
  font-family: ui-monospace, monospace;
  font-size: 13px;
  font-weight: 500;
}
.roycss-shake-error-input::after {
  content: "!";
  position: absolute;
  inset-block-start: 50%; inset-inline-end: 12px;
  transform: translateY(-50%);
  inline-size: 22px; block-size: 22px;
  background: oklch(0.637 0.208 25.33);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ui-sans-serif, sans-serif;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 0 8px color-mix(in oklch, oklch(0.637 0.208 25.33) 60%, transparent);
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
  inline-size: 160px;
  block-size: 44px;
  border-radius: 22px;
  background: linear-gradient(135deg, oklch(0.623 0.188 259.81), oklch(0.606 0.219 292.72));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 6px 18px color-mix(in oklch, oklch(0.623 0.188 259.81) 40%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 25%, transparent);
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
  border: 2px solid oklch(0.606 0.219 292.72);
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
  inline-size: 240px;
  block-size: 56px;
  background: oklch(0.279 0.037 260.03);
  border-inline-start: 4px solid oklch(0.696 0.149 162.48);
  border-radius: 8px;
  position: relative;
  box-shadow: 0 10px 30px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  display: flex;
  align-items: center;
  padding: 0 14px;
  box-sizing: border-box;
  animation: roy-b12-notif-bounce 4s ease-in-out infinite;
}
.roycss-bounce-notification > div { display: none; }
.roycss-bounce-notification::before {
  content: "✓";
  inline-size: 28px; block-size: 28px;
  background: oklch(0.696 0.149 162.48);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  margin-inline-end: 10px;
  flex-shrink: 0;
  box-shadow: 0 0 10px color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent);
}
.roycss-bounce-notification::after {
  content: "Saved successfully";
  color: oklch(0.929 0.013 255.51);
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
  inline-size: 160px;
  block-size: 100px;
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
  box-shadow: 0 8px 24px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
}
.roycss-flip-card-reveal::before {
  background: linear-gradient(135deg, oklch(0.623 0.188 259.81), oklch(0.606 0.219 292.72));
  animation: roy-b12-flip-front 4s ease-in-out infinite;
}
.roycss-flip-card-reveal::after {
  background: linear-gradient(135deg, oklch(0.656 0.212 354.31), oklch(0.769 0.165 70.08));
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
  inline-size: 220px;
  block-size: 100px;
  background: oklch(0.279 0.037 260.03);
  border: 1px solid oklch(0.372 0.039 257.29);
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
  color: oklch(0.929 0.013 255.51);
  font-family: ui-sans-serif, sans-serif;
  font-size: 13px;
  font-weight: 600;
  background: oklch(0.208 0.04 265.75);
  border-block-end: 1px solid oklch(0.372 0.039 257.29);
}
.roycss-expand-collapse::after {
  content: "Hidden content reveals smoothly using CSS height keyframe animation. No JavaScript required.";
  display: block;
  padding: 10px 14px;
  color: oklch(0.711 0.035 256.79);
  font-family: ui-sans-serif, sans-serif;
  font-size: 11px;
  line-block-size: 1.5;
  background: oklch(0.279 0.037 260.03);
  block-size: 0;
  opacity: 0;
  overflow: hidden;
  animation: roy-b12-expand-collapse 4s ease-in-out infinite;
}
@keyframes roy-b12-expand-collapse {
  0%, 30%   { block-size: 0; opacity: 0; }
  50%, 80%  { block-size: 56px; opacity: 1; }
  100%      { block-size: 0; opacity: 0; }
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
  inline-size: 240px;
  block-size: 160px;
  background: oklch(0.208 0.04 265.75);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  border: 1px solid oklch(0.279 0.037 260.03);
}
.roycss-slide-in-panel > div { display: none; }
.roycss-slide-in-panel::before {
  /* backdrop dim */
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(45deg,
      color-mix(in oklch, oklch(0.623 0.188 259.81) 15%, transparent) 0 12px,
      color-mix(in oklch, oklch(0.606 0.219 292.72) 15%, transparent) 12px 24px);
  animation: roy-b12-panel-backdrop 3.5s ease-in-out infinite;
}
.roycss-slide-in-panel::after {
  /* the panel */
  content: "";
  position: absolute;
  inset-block-start: 0; inset-inline-end: 0;
  inline-size: 55%;
  block-size: 100%;
  background: linear-gradient(180deg, oklch(0.279 0.037 260.03), oklch(0.208 0.04 265.75));
  border-inline-start: 1px solid oklch(0.372 0.039 257.29);
  box-shadow: -10px 0 30px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
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
  inline-size: 240px;
  block-size: 160px;
  position: relative;
  background: oklch(0.279 0.037 260.03);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid oklch(0.279 0.037 260.03);
}
.roycss-modal-backdrop-blur > div { display: none; }
.roycss-modal-backdrop-blur::before {
  /* colorful backdrop */
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(45deg,
    oklch(0.623 0.188 259.81) 0 12px,
    oklch(0.606 0.219 292.72) 12px 24px,
    oklch(0.656 0.212 354.31) 24px 36px,
    oklch(0.769 0.165 70.08) 36px 48px);
  filter: blur(0px) brightness(1);
  animation: roy-b12-modal-blur 3.5s ease-in-out infinite;
}
.roycss-modal-backdrop-blur::after {
  /* modal card */
  content: "Modal";
  position: absolute;
  inset-block-start: 50%; inset-inline-start: 50%;
  inline-size: 60%; block-size: 50%;
  background: oklch(0.208 0.04 265.75);
  border: 1px solid oklch(0.372 0.039 257.29);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.929 0.013 255.51);
  font-family: ui-sans-serif, sans-serif;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 1px;
  transform: translate(-50%, -50%) scale(0.8);
  opacity: 0;
  box-shadow: 0 20px 50px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
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
  inline-size: 240px;
  block-size: 100px;
  position: relative;
  background: oklch(0.208 0.04 265.75);
  border: 1px dashed oklch(0.372 0.039 257.29);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-tooltip-follow > div { display: none; }
.roycss-tooltip-follow::before {
  content: "Hover target";
  color: oklch(0.711 0.035 256.79);
  font-family: ui-sans-serif, sans-serif;
  font-size: 14px;
  font-weight: 500;
}
.roycss-tooltip-follow::after {
  content: "Following cursor ↑";
  position: absolute;
  inset-block-start: 8px; inset-inline-start: 20%;
  padding: 6px 10px;
  background: oklch(0.279 0.037 260.03);
  color: oklch(0.929 0.013 255.51);
  font-family: ui-sans-serif, sans-serif;
  font-size: 11px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid oklch(0.372 0.039 257.29);
  white-space: nowrap;
  box-shadow: 0 4px 12px color-mix(in oklch, oklch(0 0 0) 50%, transparent);
  animation: roy-b12-tooltip-move 4s ease-in-out infinite;
}
@keyframes roy-b12-tooltip-move {
  0%   { inset-block-start: 8px;  inset-inline-start: 15%; }
  25%  { inset-block-start: 40px; inset-inline-start: 35%; }
  50%  { inset-block-start: 15px; inset-inline-start: 60%; }
  75%  { inset-block-start: 50px; inset-inline-start: 40%; }
  100% { inset-block-start: 8px;  inset-inline-start: 15%; }
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
  inline-size: 60px;
  block-size: 100px;
  background: oklch(0.279 0.037 260.03);
  border: 1px solid oklch(0.372 0.039 257.29);
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
  inline-size: 16px;
  block-size: 40px;
  background:
    radial-gradient(circle at 4px 5px,  oklch(0.711 0.035 256.79) 0 2.5px, transparent 3px),
    radial-gradient(circle at 12px 5px, oklch(0.711 0.035 256.79) 0 2.5px, transparent 3px),
    radial-gradient(circle at 4px 20px, oklch(0.711 0.035 256.79) 0 2.5px, transparent 3px),
    radial-gradient(circle at 12px 20px,oklch(0.711 0.035 256.79) 0 2.5px, transparent 3px),
    radial-gradient(circle at 4px 35px, oklch(0.711 0.035 256.79) 0 2.5px, transparent 3px),
    radial-gradient(circle at 12px 35px,oklch(0.711 0.035 256.79) 0 2.5px, transparent 3px);
  background-repeat: no-repeat;
  animation: roy-b12-grip-shake 1.6s ease-in-out infinite;
}
.roycss-drag-handle-grip::after {
  /* hover highlight halo */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: color-mix(in oklch, oklch(0.623 0.188 259.81) 0%, transparent);
  animation: roy-b12-grip-hover 1.6s ease-in-out infinite;
}
@keyframes roy-b12-grip-shake {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-2px) rotate(-2deg); }
  75% { transform: translateY(-2px) rotate(2deg); }
}
@keyframes roy-b12-grip-hover {
  0%, 100% { background: color-mix(in oklch, oklch(0.623 0.188 259.81) 0%, transparent); }
  50% { background: color-mix(in oklch, oklch(0.623 0.188 259.81) 12%, transparent); }
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
  inline-size: 200px;
  block-size: 160px;
  background: linear-gradient(135deg, oklch(0.279 0.037 260.03) 0%, oklch(0.208 0.04 265.75) 100%);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  border: 1px solid oklch(0.279 0.037 260.03);
}
.roycss-context-menu > div { display: none; }
.roycss-context-menu::before {
  /* menu panel with item bars */
  content: "";
  position: absolute;
  inset-block-start: 30px; inset-inline-start: 30px;
  inline-size: 140px;
  block-size: 110px;
  background:
    linear-gradient(oklch(0.714 0.143 254.62), oklch(0.714 0.143 254.62)) 10px 10px / 10px 10px no-repeat,
    linear-gradient(oklch(0.929 0.013 255.51), oklch(0.929 0.013 255.51)) 26px 10px / 80px 10px no-repeat,
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 10px 28px / 10px 10px no-repeat,
    linear-gradient(oklch(0.929 0.013 255.51), oklch(0.929 0.013 255.51)) 26px 28px / 70px 10px no-repeat,
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 10px 46px / 10px 10px no-repeat,
    linear-gradient(oklch(0.929 0.013 255.51), oklch(0.929 0.013 255.51)) 26px 46px / 60px 10px no-repeat,
    linear-gradient(oklch(0.372 0.039 257.29), oklch(0.372 0.039 257.29)) 10px 62px / 120px 1px no-repeat,
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 10px 70px / 10px 10px no-repeat,
    linear-gradient(oklch(0.637 0.208 25.33), oklch(0.637 0.208 25.33)) 26px 70px / 50px 10px no-repeat,
    oklch(0.279 0.037 260.03);
  border: 1px solid oklch(0.372 0.039 257.29);
  border-radius: 6px;
  box-shadow: 0 10px 30px color-mix(in oklch, oklch(0 0 0) 60%, transparent);
  transform: scale(0.3);
  transform-origin: top left;
  opacity: 0;
  animation: roy-b12-context-appear 3.5s ease-out infinite;
}
.roycss-context-menu::after {
  content: "Right-click here";
  position: absolute;
  inset-block-end: 12px; inset-inline-end: 14px;
  color: oklch(0.554 0.041 257.42);
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
  inline-size: 240px;
  block-size: 160px;
  background-color: oklch(0.208 0.04 265.75);
  border: 1px solid oklch(0.279 0.037 260.03);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  background-image:
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 16px 16px / 208px 60px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 16px 92px / 160px 12px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 16px 114px / 200px 8px no-repeat,
    linear-gradient(oklch(0.279 0.037 260.03), oklch(0.279 0.037 260.03)) 16px 130px / 180px 8px no-repeat;
}
.roycss-card-skeleton-loader > span { display: none; }
.roycss-card-skeleton-loader::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg,
    transparent 30%,
    color-mix(in oklch, oklch(0.711 0.035 256.79) 12%, transparent) 50%,
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
  inline-size: 240px;
  block-size: 180px;
  background: linear-gradient(180deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  border: 1px solid oklch(0.372 0.039 257.29);
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
  inline-size: 60px;
  block-size: 50px;
  margin-block-end: 14px;
  background:
    /* lid (trapezoid via clip-path on a gradient) */
    linear-gradient(135deg, oklch(0.554 0.041 257.42), oklch(0.446 0.037 257.28)),
    /* box body */
    linear-gradient(180deg, oklch(0.446 0.037 257.28), oklch(0.372 0.039 257.29));
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
  color: oklch(0.711 0.035 256.79);
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
  inline-size: 240px;
  block-size: 160px;
  background: linear-gradient(180deg, oklch(0.208 0.04 265.75), oklch(0.19 0.02 19.14));
  border: 1px solid oklch(0.396 0.133 25.72);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 30px color-mix(in oklch, oklch(0.637 0.208 25.33) 20%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 4%, transparent);
}
.roycss-card-error-state > span { display: none; }
.roycss-card-error-state::before {
  /* circle with X drawn via crossed gradients */
  content: "";
  inline-size: 56px;
  block-size: 56px;
  border-radius: 50%;
  background:
    linear-gradient(45deg, transparent 45%, oklch(0.637 0.208 25.33) 45% 55%, transparent 55%) 0 0 / 100% 100% no-repeat,
    linear-gradient(-45deg, transparent 45%, oklch(0.637 0.208 25.33) 45% 55%, transparent 55%) 0 0 / 100% 100% no-repeat,
    color-mix(in oklch, oklch(0.637 0.208 25.33) 15%, transparent);
  border: 2px solid oklch(0.637 0.208 25.33);
  margin-block-end: 14px;
  animation: roy-b12-error-pulse 2s ease-in-out infinite;
}
.roycss-card-error-state::after {
  content: "Something went wrong";
  color: oklch(0.808 0.103 19.57);
  font-family: ui-sans-serif, sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
}
@keyframes roy-b12-error-pulse {
  0%, 100% { box-shadow: 0 0 20px color-mix(in oklch, oklch(0.637 0.208 25.33) 40%, transparent); }
  50% { box-shadow: 0 0 35px color-mix(in oklch, oklch(0.637 0.208 25.33) 70%, transparent); }
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
  inline-size: 240px;
  block-size: 160px;
  background: linear-gradient(180deg, oklch(0.208 0.04 265.75), oklch(0.267 0.058 157.13));
  border: 1px solid oklch(0.696 0.149 162.48);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 0 30px color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent), inset 0 1px 0 color-mix(in oklch, oklch(1 0 89.88) 4%, transparent);
}
.roycss-card-success-state > span { display: none; }
.roycss-card-success-state::before {
  /* circle */
  content: "";
  inline-size: 64px;
  block-size: 64px;
  border-radius: 50%;
  background: color-mix(in oklch, oklch(0.696 0.149 162.48) 15%, transparent);
  border: 2px solid oklch(0.696 0.149 162.48);
  margin-block-end: 14px;
  box-shadow: 0 0 20px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent);
  animation: roy-b12-success-pulse 2.2s ease-in-out infinite;
}
.roycss-card-success-state::after {
  /* checkmark drawn via borders, positioned over the circle */
  content: "";
  position: absolute;
  inset-block-start: 50%; inset-inline-start: 50%;
  inline-size: 22px;
  block-size: 11px;
  border-inline-start: 4px solid oklch(0.696 0.149 162.48);
  border-block-end: 4px solid oklch(0.696 0.149 162.48);
  transform: translate(-50%, calc(-50% - 18px)) rotate(-45deg);
  animation: roy-b12-check-draw 2.2s ease-in-out infinite;
}
@keyframes roy-b12-success-pulse {
  0%, 100% { box-shadow: 0 0 20px color-mix(in oklch, oklch(0.696 0.149 162.48) 40%, transparent); }
  50% { box-shadow: 0 0 32px color-mix(in oklch, oklch(0.696 0.149 162.48) 70%, transparent); }
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
  inline-size: 200px;
  block-size: 260px;
  background:
    linear-gradient(oklch(0.714 0.143 254.62), oklch(0.714 0.143 254.62)) 50% 30px / 70px 12px no-repeat,
    linear-gradient(oklch(0.929 0.013 255.51), oklch(0.929 0.013 255.51)) 50% 56px / 90px 30px no-repeat,
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 50% 92px / 40px 8px no-repeat,
    linear-gradient(oklch(0.372 0.039 257.29), oklch(0.372 0.039 257.29)) 16px 112px / 168px 1px no-repeat,
    linear-gradient(oklch(0.446 0.037 257.28), oklch(0.446 0.037 257.28)) 50% 128px / 140px 8px no-repeat,
    linear-gradient(oklch(0.446 0.037 257.28), oklch(0.446 0.037 257.28)) 50% 148px / 120px 8px no-repeat,
    linear-gradient(oklch(0.446 0.037 257.28), oklch(0.446 0.037 257.28)) 50% 168px / 100px 8px no-repeat,
    linear-gradient(135deg, oklch(0.623 0.188 259.81), oklch(0.606 0.219 292.72)) 50% 200px / 168px 36px no-repeat,
    linear-gradient(180deg, oklch(0.279 0.037 260.03), oklch(0.208 0.04 265.75));
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 30px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
}
.roycss-card-pricing-highlight > span { display: none; }
.roycss-card-pricing-highlight::before {
  /* animated gradient border via mask cutout */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 14px;
  padding: 2px;
  background: linear-gradient(135deg, oklch(0.623 0.188 259.81), oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31), oklch(0.769 0.165 70.08), oklch(0.623 0.188 259.81));
  background-size: 300% 300%;
  -webkit-mask: linear-gradient(oklch(0 0 0) 0 0) content-box, linear-gradient(oklch(0 0 0) 0 0);
  -webkit-mask-composite: xor;
          mask: linear-gradient(oklch(0 0 0) 0 0) content-box, linear-gradient(oklch(0 0 0) 0 0);
          mask-composite: exclude;
  animation: roy-b12-pricing-border 4s linear infinite;
  pointer-events: none;
}
.roycss-card-pricing-highlight::after {
  /* "POPULAR" badge */
  content: "★ POPULAR";
  position: absolute;
  inset-block-start: 0; inset-inline-end: 18px;
  padding: 4px 10px 6px;
  background: linear-gradient(135deg, oklch(0.769 0.165 70.08), oklch(0.637 0.208 25.33));
  color: white;
  font-family: ui-sans-serif, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 10px color-mix(in oklch, oklch(0.769 0.165 70.08) 50%, transparent);
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
  inline-size: 200px;
  block-size: 240px;
  background:
    linear-gradient(oklch(0.929 0.013 255.51), oklch(0.929 0.013 255.51)) 50% 124px / 100px 14px no-repeat,
    linear-gradient(oklch(0.714 0.143 254.62), oklch(0.714 0.143 254.62)) 50% 146px / 60px 8px no-repeat,
    linear-gradient(oklch(0.446 0.037 257.28), oklch(0.446 0.037 257.28)) 50% 170px / 160px 6px no-repeat,
    linear-gradient(oklch(0.446 0.037 257.28), oklch(0.446 0.037 257.28)) 50% 182px / 140px 6px no-repeat,
    linear-gradient(oklch(0.446 0.037 257.28), oklch(0.446 0.037 257.28)) 50% 194px / 120px 6px no-repeat,
    linear-gradient(180deg, oklch(0.279 0.037 260.03), oklch(0.208 0.04 265.75));
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  border: 1px solid oklch(0.279 0.037 260.03);
}
.roycss-card-profile-avatar > span { display: none; }
.roycss-card-profile-avatar::before {
  /* rotating gradient ring */
  content: "";
  position: absolute;
  inset-block-start: 22px; inset-inline-start: 50%;
  inline-size: 86px; block-size: 86px;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
    oklch(0.623 0.188 259.81), oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31), oklch(0.769 0.165 70.08), oklch(0.623 0.188 259.81));
  transform: translateX(-50%);
  animation: roy-b12-avatar-spin 4s linear infinite;
}
.roycss-card-profile-avatar::after {
  /* avatar face (static, on top of ring) */
  content: "";
  position: absolute;
  inset-block-start: 28px; inset-inline-start: 50%;
  inline-size: 74px; block-size: 74px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, oklch(0.837 0.164 84.43), oklch(0.666 0.157 58.32));
  transform: translateX(-50%);
  box-shadow:
    inset 0 0 0 3px oklch(0.279 0.037 260.03),
    inset -3px -4px 8px color-mix(in oklch, oklch(0 0 0) 25%, transparent),
    0 4px 12px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
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
  inline-size: 240px;
  block-size: 80px;
  background: oklch(0.279 0.037 260.03);
  border-radius: 10px;
  position: relative;
  border-inline-start: 4px solid oklch(0.623 0.188 259.81);
  box-shadow: 0 8px 24px color-mix(in oklch, oklch(0 0 0) 40%, transparent);
  overflow: hidden;
}
.roycss-card-notification > span { display: none; }
.roycss-card-notification::before {
  /* info icon + title + body bars */
  content: "";
  position: absolute;
  inset-block-start: 14px; inset-inline-start: 14px; inset-inline-end: 36px; inset-block-end: 14px;
  background:
    radial-gradient(circle, oklch(0.714 0.143 254.62) 0 12px, transparent 13px) 0 6px / 24px 24px no-repeat,
    linear-gradient(oklch(0.929 0.013 255.51), oklch(0.929 0.013 255.51)) 32px 4px / 160px 12px no-repeat,
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 32px 24px / 130px 8px no-repeat;
}
.roycss-card-notification::after {
  /* dismiss X button */
  content: "✕";
  position: absolute;
  inset-block-start: 10px; inset-inline-end: 8px;
  inline-size: 22px; block-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.711 0.035 256.79);
  font-family: ui-sans-serif, sans-serif;
  font-size: 13px;
  font-weight: 600;
  border-radius: 4px;
  animation: roy-b12-dismiss-pulse 2s ease-in-out infinite;
}
@keyframes roy-b12-dismiss-pulse {
  0%, 100% { background: color-mix(in oklch, oklch(0.711 0.035 256.79) 0%, transparent); color: oklch(0.711 0.035 256.79); }
  50% { background: color-mix(in oklch, oklch(0.711 0.035 256.79) 18%, transparent); color: oklch(0.929 0.013 255.51); }
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
  inline-size: 240px;
  block-size: 80px;
  background: oklch(0.279 0.037 260.03);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  border: 1px solid oklch(0.372 0.039 257.29);
}
.roycss-card-search-result > span { display: none; }
.roycss-card-search-result::before {
  /* magnifier glass icon (SVG data URI) */
  content: "";
  position: absolute;
  inset-block-start: 18px; inset-inline-start: 14px;
  inline-size: 22px; block-size: 22px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360a5fa' stroke-width='2.5' stroke-linecap='round'%3E%3Ccircle cx='10' cy='10' r='6'/%3E%3Cline x1='14.5' y1='14.5' x2='20' y2='20'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}
.roycss-card-search-result::after {
  /* title with highlighted match + url + snippet */
  content: "";
  position: absolute;
  inset-block-start: 12px; inset-inline-start: 46px; inset-inline-end: 14px; inset-block-end: 12px;
  background:
    /* title: "lorem " + highlighted "ips" + " dolor" */
    linear-gradient(oklch(0.929 0.013 255.51), oklch(0.929 0.013 255.51)) 0 4px / 50px 12px no-repeat,
    linear-gradient(oklch(0.837 0.164 84.43), oklch(0.837 0.164 84.43)) 50px 4px / 30px 12px no-repeat,
    linear-gradient(oklch(0.924 0.115 95.75), oklch(0.924 0.115 95.75)) 50px 4px / 30px 12px no-repeat,
    linear-gradient(oklch(0.929 0.013 255.51), oklch(0.929 0.013 255.51)) 84px 4px / 70px 12px no-repeat,
    /* url */
    linear-gradient(oklch(0.714 0.143 254.62), oklch(0.714 0.143 254.62)) 0 22px / 110px 8px no-repeat,
    /* snippet line 1 */
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 0 38px / 170px 6px no-repeat,
    /* snippet line 2 */
    linear-gradient(oklch(0.711 0.035 256.79), oklch(0.711 0.035 256.79)) 0 48px / 140px 6px no-repeat;
  background-repeat: no-repeat;
  animation: roy-b12-search-glow 2s ease-in-out infinite;
}
@keyframes roy-b12-search-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.15); }
}`,
  },
];
