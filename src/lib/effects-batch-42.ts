import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 42 — Status & State Transition Effects (20 effects)
 * Pure-CSS status indicators and state transitions: skeletons, success/error
 * feedback, online/offline pulses, sync, loading, toggles, and toasts.
 * All classes are prefixed `roycss-state-` and keyframes `roy-state-`.
 * Each effect honors prefers-reduced-motion.
 */
export const effectsBatch42: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // STATUS & STATE (20)
  // ═══════════════════════════════════════════════════════════════

  // 1. state-skeleton-shimmer-gradient
  {
    id: "state-skeleton-shimmer-gradient",
    name: "Skeleton Shimmer Gradient",
    category: "status-state",
    description: "Gradient shimmer sweeping across a skeleton placeholder",
    tags: ["status-state", "skeleton", "loading", "shimmer", "gradient", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Skeleton Shimmer Gradient */
.roycss-state-skeleton-shimmer-gradient {
  background: linear-gradient(90deg,
    oklch(0.92 0.005 250) 0%,
    oklch(0.96 0.01 250) 45%,
    oklch(0.99 0.01 250) 50%,
    oklch(0.96 0.01 250) 55%,
    oklch(0.92 0.005 250) 100%);
  background-size: 220% 100%;
  animation: roy-state-skeleton-shimmer-gradient 1.6s ease-in-out infinite;
}
@keyframes roy-state-skeleton-shimmer-gradient {
  0%   { background-position: 200% 0; }
  100% { background-position: -120% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-skeleton-shimmer-gradient { animation: none; background-position: 0 0; }
}`,
  },

  // 2. state-skeleton-pulse
  {
    id: "state-skeleton-pulse",
    name: "Skeleton Pulse",
    category: "status-state",
    description: "Skeleton placeholder that pulses opacity in a breathing rhythm",
    tags: ["status-state", "skeleton", "loading", "pulse", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Skeleton Pulse */
.roycss-state-skeleton-pulse {
  background: oklch(0.92 0.005 250);
  animation: roy-state-skeleton-pulse 1.4s ease-in-out infinite;
}
@keyframes roy-state-skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-skeleton-pulse { animation: none; opacity: 1; }
}`,
  },

  // 3. state-skeleton-wave
  {
    id: "state-skeleton-wave",
    name: "Skeleton Wave",
    category: "status-state",
    description: "Skeleton with a diagonal wave shimmer sweeping across",
    tags: ["status-state", "skeleton", "loading", "wave", "shimmer", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Skeleton Wave */
.roycss-state-skeleton-wave {
  position: relative;
  background: oklch(0.92 0.005 250);
  overflow: hidden;
}
.roycss-state-skeleton-wave::before {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%) skewX(-18deg);
  background: linear-gradient(90deg, transparent, oklch(0.99 0.01 250), transparent);
  animation: roy-state-skeleton-wave 1.7s ease-in-out infinite;
}
@keyframes roy-state-skeleton-wave {
  0%   { transform: translateX(-100%) skewX(-18deg); }
  100% { transform: translateX(200%) skewX(-18deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-skeleton-wave::before { animation: none; display: none; }
}`,
  },

  // 4. state-skeleton-dot
  {
    id: "state-skeleton-dot",
    name: "Skeleton Dot Pattern",
    category: "status-state",
    description: "Skeleton placeholder with animated dot pattern shimmer",
    tags: ["status-state", "skeleton", "loading", "dots", "pattern", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Skeleton Dot Pattern */
.roycss-state-skeleton-dot {
  background-color: oklch(0.92 0.005 250);
  background-image: radial-gradient(oklch(0.78 0.01 250) 1.4px, transparent 1.6px);
  background-size: 14px 14px;
  animation: roy-state-skeleton-dot 1.2s linear infinite;
}
@keyframes roy-state-skeleton-dot {
  0%   { background-position: 0 0; }
  100% { background-position: 14px 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-skeleton-dot { animation: none; background-position: 0 0; }
}`,
  },

  // 5. state-success-checkmark
  {
    id: "state-success-checkmark",
    name: "Success Checkmark Draw",
    category: "status-state",
    description: "Checkmark that draws itself with a subtle celebratory glow",
    tags: ["status-state", "success", "checkmark", "draw", "celebration", "svg-path"],
    previewType: "box",
    cssCode: `/* Status: Success Checkmark */
.roycss-state-success-checkmark {
  position: relative;
  background: oklch(0.95 0.05 150);
  border-radius: 50%;
  animation: roy-state-success-checkmark-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.roycss-state-success-checkmark::before {
  content: "";
  position: absolute;
  left: 28%;
  top: 46%;
  width: 36%;
  height: 18%;
  border-right: 4px solid oklch(0.55 0.18 150);
  border-bottom: 4px solid oklch(0.55 0.18 150);
  transform: rotate(45deg) translate(-10%, -10%) scale(0);
  transform-origin: left top;
  animation: roy-state-success-checkmark-draw 0.5s 0.35s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}
@keyframes roy-state-success-checkmark-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); }
}
@keyframes roy-state-success-checkmark-draw {
  0%   { transform: rotate(45deg) translate(-10%, -10%) scale(0); opacity: 0; }
  40%  { opacity: 1; }
  100% { transform: rotate(45deg) translate(0, 0) scale(1); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-success-checkmark,
  .roycss-state-success-checkmark::before { animation: none; transform: rotate(45deg) scale(1); opacity: 1; }
}`,
  },

  // 6. state-success-confetti
  {
    id: "state-success-confetti",
    name: "Success Confetti Burst",
    category: "status-state",
    description: "Confetti pieces burst outward from center on success",
    tags: ["status-state", "success", "confetti", "burst", "celebration"],
    previewType: "box",
    childCount: 6,
    cssCode: `/* Status: Success Confetti Burst */
.roycss-state-success-confetti {
  position: relative;
  background: oklch(0.97 0.02 200);
  border-radius: 8px;
}
.roycss-state-success-confetti > span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  opacity: 0;
  animation: roy-state-success-confetti 1.4s ease-out infinite;
}
.roycss-state-success-confetti > span:nth-child(1) { background: oklch(0.65 0.22 25);  --dx:  60px; --dy: -55px; animation-delay: 0s; }
.roycss-state-success-confetti > span:nth-child(2) { background: oklch(0.65 0.22 145); --dx: -55px; --dy: -50px; animation-delay: 0.08s; }
.roycss-state-success-confetti > span:nth-child(3) { background: oklch(0.65 0.22 265); --dx:  70px; --dy:  10px; animation-delay: 0.16s; }
.roycss-state-success-confetti > span:nth-child(4) { background: oklch(0.7 0.18 90);  --dx: -60px; --dy:  20px; animation-delay: 0.24s; }
.roycss-state-success-confetti > span:nth-child(5) { background: oklch(0.7 0.18 320); --dx:  30px; --dy:  60px; animation-delay: 0.32s; }
.roycss-state-success-confetti > span:nth-child(6) { background: oklch(0.7 0.18 200); --dx: -35px; --dy:  55px; animation-delay: 0.4s; }
@keyframes roy-state-success-confetti {
  0%   { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0.6); opacity: 1; }
  70%  { opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) rotate(540deg) scale(1.1); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-success-confetti > span { animation: none; opacity: 0; }
}`,
  },

  // 7. state-error-shake
  {
    id: "state-error-shake",
    name: "Error Shake",
    category: "status-state",
    description: "Form field shakes horizontally to signal a validation error",
    tags: ["status-state", "error", "shake", "validation", "feedback", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Error Shake */
.roycss-state-error-shake {
  background: oklch(0.95 0.05 25);
  border: 2px solid oklch(0.6 0.22 25);
  border-radius: 6px;
  animation: roy-state-error-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite;
}
@keyframes roy-state-error-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-error-shake { animation: none; transform: none; }
}`,
  },

  // 8. state-error-flash
  {
    id: "state-error-flash",
    name: "Error Flash",
    category: "status-state",
    description: "Element briefly flashes red to signal an error state",
    tags: ["status-state", "error", "flash", "feedback", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Error Flash */
.roycss-state-error-flash {
  background: oklch(0.92 0.01 250);
  border-radius: 6px;
  animation: roy-state-error-flash 1.6s ease-out infinite;
}
@keyframes roy-state-error-flash {
  0%, 70%, 100% { background-color: oklch(0.92 0.01 250); box-shadow: none; }
  5%            { background-color: oklch(0.7 0.22 25); box-shadow: 0 0 0 4px oklch(0.7 0.22 25 / 0.35); }
  20%           { background-color: oklch(0.92 0.01 250); box-shadow: none; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-error-flash { animation: none; background-color: oklch(0.92 0.01 250); }
}`,
  },

  // 9. state-offline-pulse
  {
    id: "state-offline-pulse",
    name: "Offline Pulse",
    category: "status-state",
    description: "Red status dot with expanding ring indicating offline state",
    tags: ["status-state", "offline", "pulse", "dot", "indicator", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Offline Pulse */
.roycss-state-offline-pulse {
  position: relative;
  width: 16px;
  height: 16px;
  margin: auto;
  background: oklch(0.6 0.22 25);
  border-radius: 50%;
  box-shadow: 0 0 0 0 oklch(0.6 0.22 25 / 0.55);
  animation: roy-state-offline-pulse 1.8s ease-out infinite;
}
@keyframes roy-state-offline-pulse {
  0%   { box-shadow: 0 0 0 0 oklch(0.6 0.22 25 / 0.55); }
  70%  { box-shadow: 0 0 0 14px oklch(0.6 0.22 25 / 0); }
  100% { box-shadow: 0 0 0 0 oklch(0.6 0.22 25 / 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-offline-pulse { animation: none; box-shadow: none; }
}`,
  },

  // 10. state-online-pulse
  {
    id: "state-online-pulse",
    name: "Online Pulse",
    category: "status-state",
    description: "Green status dot with expanding ring indicating online state",
    tags: ["status-state", "online", "pulse", "dot", "indicator", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Online Pulse */
.roycss-state-online-pulse {
  position: relative;
  width: 16px;
  height: 16px;
  margin: auto;
  background: oklch(0.6 0.2 150);
  border-radius: 50%;
  box-shadow: 0 0 0 0 oklch(0.6 0.2 150 / 0.55);
  animation: roy-state-online-pulse 2s ease-out infinite;
}
@keyframes roy-state-online-pulse {
  0%   { box-shadow: 0 0 0 0 oklch(0.6 0.2 150 / 0.55); }
  70%  { box-shadow: 0 0 0 16px oklch(0.6 0.2 150 / 0); }
  100% { box-shadow: 0 0 0 0 oklch(0.6 0.2 150 / 0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-online-pulse { animation: none; box-shadow: none; }
}`,
  },

  // 11. state-sync-spin
  {
    id: "state-sync-spin",
    name: "Sync Spin",
    category: "status-state",
    description: "Two curved arrows rotating to indicate data synchronization",
    tags: ["status-state", "sync", "spin", "rotate", "arrows", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Sync Spin */
.roycss-state-sync-spin {
  position: relative;
  width: 48px;
  height: 48px;
  margin: auto;
  border: 4px solid oklch(0.9 0.04 230);
  border-top-color: oklch(0.55 0.2 230);
  border-right-color: transparent;
  border-radius: 50%;
  animation: roy-state-sync-spin 1s linear infinite;
}
.roycss-state-sync-spin::before {
  content: "";
  position: absolute;
  inset: 6px;
  border: 4px solid transparent;
  border-bottom-color: oklch(0.55 0.2 230);
  border-left-color: oklch(0.55 0.2 230);
  border-radius: 50%;
  animation: roy-state-sync-spin-reverse 1s linear infinite;
}
@keyframes roy-state-sync-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes roy-state-sync-spin-reverse {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-sync-spin,
  .roycss-state-sync-spin::before { animation: none; }
}`,
  },

  // 12. state-upload-progress
  {
    id: "state-upload-progress",
    name: "Upload Progress",
    category: "status-state",
    description: "Indeterminate upload bar with a moving highlight stripe",
    tags: ["status-state", "upload", "progress", "bar", "indeterminate", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Upload Progress */
.roycss-state-upload-progress {
  position: relative;
  width: 100%;
  height: 14px;
  margin: auto;
  background: oklch(0.92 0.01 250);
  border-radius: 7px;
  overflow: hidden;
}
.roycss-state-upload-progress::before {
  content: "";
  position: absolute;
  inset: 0;
  width: 40%;
  background: linear-gradient(90deg, oklch(0.55 0.2 230), oklch(0.65 0.22 200));
  border-radius: 7px;
  animation: roy-state-upload-progress 1.6s ease-in-out infinite;
}
.roycss-state-upload-progress::after {
  content: "";
  position: absolute;
  inset: 0;
  width: 40%;
  background: repeating-linear-gradient(45deg,
    oklch(1 0 0 / 0.18) 0 8px,
    oklch(1 0 0 / 0) 8px 16px);
  border-radius: 7px;
  animation: roy-state-upload-progress 1.6s ease-in-out infinite;
}
@keyframes roy-state-upload-progress {
  0%   { left: -40%; }
  100% { left: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-upload-progress::before,
  .roycss-state-upload-progress::after { animation: none; left: 0; }
}`,
  },

  // 13. state-connection-bars
  {
    id: "state-connection-bars",
    name: "Connection Bars",
    category: "status-state",
    description: "WiFi/signal strength bars that animate in sequence",
    tags: ["status-state", "connection", "wifi", "signal", "bars", "infinite"],
    previewType: "box",
    childCount: 4,
    cssCode: `/* Status: Connection Bars */
.roycss-state-connection-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 100%;
}
.roycss-state-connection-bars > span {
  width: 8px;
  background: oklch(0.55 0.2 230);
  border-radius: 2px;
  opacity: 0.3;
  animation: roy-state-connection-bars 1.6s ease-in-out infinite;
}
.roycss-state-connection-bars > span:nth-child(1) { height: 25%; animation-delay: 0s; }
.roycss-state-connection-bars > span:nth-child(2) { height: 50%; animation-delay: 0.2s; }
.roycss-state-connection-bars > span:nth-child(3) { height: 75%; animation-delay: 0.4s; }
.roycss-state-connection-bars > span:nth-child(4) { height: 100%; animation-delay: 0.6s; }
@keyframes roy-state-connection-bars {
  0%, 100% { opacity: 0.3; transform: scaleY(1); }
  30%, 70% { opacity: 1; transform: scaleY(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-connection-bars > span { animation: none; opacity: 1; }
}`,
  },

  // 14. state-loading-dots
  {
    id: "state-loading-dots",
    name: "Loading Dots",
    category: "status-state",
    description: "Three classic bouncing dots loading animation",
    tags: ["status-state", "loading", "dots", "bounce", "classic", "infinite"],
    previewType: "box",
    childCount: 3,
    cssCode: `/* Status: Loading Dots */
.roycss-state-loading-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
}
.roycss-state-loading-dots > span {
  width: 12px;
  height: 12px;
  background: oklch(0.55 0.2 230);
  border-radius: 50%;
  animation: roy-state-loading-dots 1.2s ease-in-out infinite;
}
.roycss-state-loading-dots > span:nth-child(1) { animation-delay: 0s; }
.roycss-state-loading-dots > span:nth-child(2) { animation-delay: 0.18s; }
.roycss-state-loading-dots > span:nth-child(3) { animation-delay: 0.36s; }
@keyframes roy-state-loading-dots {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%           { transform: translateY(-14px); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-loading-dots > span { animation: none; opacity: 1; transform: none; }
}`,
  },

  // 15. state-loading-spinner
  {
    id: "state-loading-spinner",
    name: "Loading Spinner Fade",
    category: "status-state",
    description: "Clean spinner ring with a fading tail segment",
    tags: ["status-state", "loading", "spinner", "fade", "ring", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Loading Spinner Fade */
.roycss-state-loading-spinner {
  position: relative;
  width: 48px;
  height: 48px;
  margin: auto;
  border: 4px solid oklch(0.9 0.01 250);
  border-top-color: oklch(0.55 0.2 230);
  border-radius: 50%;
  animation: roy-state-loading-spinner 0.9s linear infinite;
}
.roycss-state-loading-spinner::before {
  content: "";
  position: absolute;
  inset: -4px;
  border: 4px solid transparent;
  border-top-color: oklch(0.55 0.2 230 / 0.35);
  border-radius: 50%;
  animation: roy-state-loading-spinner-fade 0.9s linear infinite reverse;
}
@keyframes roy-state-loading-spinner {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes roy-state-loading-spinner-fade {
  0%   { transform: rotate(0deg); opacity: 0.2; }
  50%  { opacity: 0.6; }
  100% { transform: rotate(360deg); opacity: 0.2; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-loading-spinner,
  .roycss-state-loading-spinner::before { animation: none; }
}`,
  },

  // 16. state-loading-bar
  {
    id: "state-loading-bar",
    name: "Indeterminate Loading Bar",
    category: "status-state",
    description: "Indeterminate progress bar that sweeps back and forth",
    tags: ["status-state", "loading", "bar", "indeterminate", "progress", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Indeterminate Loading Bar */
.roycss-state-loading-bar {
  position: relative;
  width: 100%;
  height: 6px;
  margin: auto;
  background: oklch(0.92 0.01 250);
  border-radius: 3px;
  overflow: hidden;
}
.roycss-state-loading-bar::before {
  content: "";
  position: absolute;
  top: 0;
  left: -35%;
  width: 35%;
  height: 100%;
  background: oklch(0.55 0.2 230);
  border-radius: 3px;
  animation: roy-state-loading-bar 1.4s ease-in-out infinite;
}
@keyframes roy-state-loading-bar {
  0%   { left: -35%; }
  50%  { left: 100%; }
  100% { left: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-loading-bar::before { animation: none; left: 0; width: 50%; }
}`,
  },

  // 17. state-toggle-switch
  {
    id: "state-toggle-switch",
    name: "Toggle Switch",
    category: "status-state",
    description: "Smooth toggle switch that animates between on and off states",
    tags: ["status-state", "toggle", "switch", "slide", "on-off", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Toggle Switch */
.roycss-state-toggle-switch {
  position: relative;
  width: 64px;
  height: 32px;
  margin: auto;
  border-radius: 16px;
  background: oklch(0.9 0.01 250);
  animation: roy-state-toggle-track 2s ease-in-out infinite;
}
.roycss-state-toggle-switch::before {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: oklch(1 0 0);
  box-shadow: 0 2px 6px oklch(0 0 0 / 0.2);
  animation: roy-state-toggle-knob 2s ease-in-out infinite;
}
@keyframes roy-state-toggle-track {
  0%, 45%   { background: oklch(0.9 0.01 250); }
  55%, 100% { background: oklch(0.55 0.2 150); }
}
@keyframes roy-state-toggle-knob {
  0%, 45%   { left: 3px; }
  55%, 100% { left: 35px; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-toggle-switch,
  .roycss-state-toggle-switch::before { animation: none; }
}`,
  },

  // 18. state-checkbox-check
  {
    id: "state-checkbox-check",
    name: "Checkbox Check",
    category: "status-state",
    description: "Checkbox that animates the checkmark drawing on and off",
    tags: ["status-state", "checkbox", "checkmark", "draw", "toggle", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Checkbox Check */
.roycss-state-checkbox-check {
  position: relative;
  width: 36px;
  height: 36px;
  margin: auto;
  border-radius: 6px;
  animation: roy-state-checkbox-bg 2s steps(1, end) infinite;
}
.roycss-state-checkbox-check::before {
  content: "";
  position: absolute;
  left: 28%;
  top: 48%;
  width: 36%;
  height: 18%;
  border-right: 3px solid oklch(1 0 0);
  border-bottom: 3px solid oklch(1 0 0);
  transform: rotate(45deg) scale(0);
  transform-origin: left top;
  animation: roy-state-checkbox-draw 2s ease-in-out infinite;
}
@keyframes roy-state-checkbox-bg {
  0%, 45%   { background: oklch(0.9 0.01 250); }
  50%, 100% { background: oklch(0.55 0.2 230); }
}
@keyframes roy-state-checkbox-draw {
  0%, 45%   { transform: rotate(45deg) scale(0); }
  55%, 90%  { transform: rotate(45deg) scale(1); }
  100%      { transform: rotate(45deg) scale(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-checkbox-check,
  .roycss-state-checkbox-check::before { animation: none; }
  .roycss-state-checkbox-check { background: oklch(0.55 0.2 230); }
  .roycss-state-checkbox-check::before { transform: rotate(45deg) scale(1); }
}`,
  },

  // 19. state-radio-select
  {
    id: "state-radio-select",
    name: "Radio Select",
    category: "status-state",
    description: "Radio button with inner dot that scales in on selection",
    tags: ["status-state", "radio", "select", "dot", "scale", "infinite"],
    previewType: "box",
    cssCode: `/* Status: Radio Select */
.roycss-state-radio-select {
  position: relative;
  width: 32px;
  height: 32px;
  margin: auto;
  border-radius: 50%;
  border: 2px solid oklch(0.55 0.2 230);
  animation: roy-state-radio-ring 2s ease-in-out infinite;
}
.roycss-state-radio-select::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: oklch(0.55 0.2 230);
  transform: translate(-50%, -50%) scale(0);
  animation: roy-state-radio-dot 2s ease-in-out infinite;
}
@keyframes roy-state-radio-ring {
  0%, 100% { border-color: oklch(0.55 0.2 230); }
  50%      { border-color: oklch(0.6 0.22 200); }
}
@keyframes roy-state-radio-dot {
  0%, 40%   { transform: translate(-50%, -50%) scale(0); }
  55%, 90%  { transform: translate(-50%, -50%) scale(1); }
  100%      { transform: translate(-50%, -50%) scale(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-radio-select,
  .roycss-state-radio-select::before { animation: none; }
  .roycss-state-radio-select::before { transform: translate(-50%, -50%) scale(1); }
}`,
  },

  // 20. state-toast-slide
  {
    id: "state-toast-slide",
    name: "Toast Slide In",
    category: "status-state",
    description: "Toast notification that slides in, holds, and slides out",
    tags: ["status-state", "toast", "notification", "slide", "in-out", "feedback"],
    previewType: "box",
    cssCode: `/* Status: Toast Slide In */
.roycss-state-toast-slide {
  position: relative;
  background: linear-gradient(135deg, oklch(0.3 0.02 230), oklch(0.22 0.02 230));
  color: oklch(0.98 0 0);
  border-radius: 8px;
  border-left: 4px solid oklch(0.6 0.2 150);
  animation: roy-state-toast-slide 3s ease-in-out infinite;
}
@keyframes roy-state-toast-slide {
  0%        { transform: translateX(120%); opacity: 0; }
  10%, 75%  { transform: translateX(0); opacity: 1; }
  90%, 100% { transform: translateX(120%); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-state-toast-slide { animation: none; transform: none; opacity: 1; }
}`,
  },
];
