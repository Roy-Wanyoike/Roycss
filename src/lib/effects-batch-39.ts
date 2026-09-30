import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 39 — Data Visualization Effects (20 effects)
 * Pure-CSS indicators, gauges, and chart fragments: odometers, rings,
 * sparklines, gauges, heatmaps, timelines, count-ups, skeletons.
 * All classes are prefixed `roycss-dataviz-` and keyframes `roy-dataviz-`.
 * Every effect ships a `prefers-reduced-motion: reduce` fallback.
 *
 * Color conformance (issue #273): the original indigo/blue cluster
 * (#6366f1 / #4f46e5 / #818cf8 / #93c5fd and their rgba() alpha forms)
 * violated CONTRIBUTING rule 7 ("Use OKLCH colors — no indigo or blue as
 * primary. Reference src/lib/design-tokens.ts"). INTENTIONAL EXCEPTION to
 * hue-preserving conversion: the cluster is remapped to the nearest
 * design-token hue that is not blue and keeps the dataviz series
 * distinguishable — the ACCENT token hue, 200 (design-tokens.ts →
 * accent: oklch(0.72 0.15 200)). Each color's OKLab L/C is preserved from
 * the original hex, so the palette's lightness/chroma structure (series
 * value ramps, contrast) is unchanged — only the hue family moves
 * indigo→cyan. Mapping produced by scripts/migrate-hex-oklch.ts:
 *   #6366f1 (0.585 0.204 277.12) → oklch(0.585 0.204 200)
 *   #4f46e5 (0.511 0.230 276.97) → oklch(0.511 0.23 200)
 *   #818cf8 (0.680 0.158 276.93) → oklch(0.68 0.158 200)
 *   #93c5fd (0.809 0.096 251.81) → oklch(0.809 0.096 200)
 *   rgba(99,102,241,a)           → oklch(0.585 0.204 200 / a)
 * All other hex colors in this file are straight hue-preserving sRGB→oklch
 * conversions (e.g. #10b981 → oklch(0.696 0.149 162.48), the primary token).
 */
export const effectsBatch39: CSSEffect[] = [
  // 1. dataviz-counter-roll
  {
    id: "dataviz-counter-roll",
    name: "Counter Roll",
    category: "data-viz",
    description: "Odometer-style number that rolls vertical digits into place on load",
    tags: ["data-viz", "counter", "odometer", "number", "animate"],
    previewType: "box",
    previewText: "0",
    cssCode: `/* DataViz: Counter Roll */
.roycss-dataviz-counter-roll {
  position: relative;
  display: inline-block;
  font-family: ui-monospace, "Courier New", monospace;
  font-weight: 700;
  font-size: 2rem;
  color: oklch(0.208 0.04 265.75);
  background: linear-gradient(180deg, oklch(0.984 0.003 247.86) 0%, oklch(0.929 0.013 255.51) 100%);
  padding: 0.2em 0.5em;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.15);
  height: 1.4em;
  line-height: 1.4;
  width: 1.2em;
  text-align: center;
}
.roycss-dataviz-counter-roll::before {
  content: "0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9";
  position: absolute;
  left: 0; right: 0;
  top: 0;
  white-space: pre;
  animation: roy-dataviz-roll 2.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes roy-dataviz-roll {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-12.6em); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-counter-roll::before { animation: none; transform: translateY(-9em); }
}`,
  },

  // 2. dataviz-progress-ring
  {
    id: "dataviz-progress-ring",
    name: "Progress Ring",
    category: "data-viz",
    description: "Circular progress ring that animates its stroke-dashoffset fill from empty to full",
    tags: ["data-viz", "progress", "ring", "circular", "loader"],
    previewType: "loader",
    cssCode: `/* DataViz: Progress Ring */
.roycss-dataviz-progress-ring {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background:
    conic-gradient(oklch(0.696 0.149 162.48) 0deg, oklch(0.696 0.149 162.48) 252deg, oklch(0.929 0.013 255.51) 252deg, oklch(0.929 0.013 255.51) 360deg);
  animation: roy-dataviz-ring-fill 1.8s ease-out both;
  display: flex;
  align-items: center;
  justify-content: center;
}
.roycss-dataviz-progress-ring::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: oklch(1 0 89.88);
  border-radius: 50%;
  z-index: 1;
}
.roycss-dataviz-progress-ring::after {
  content: "70%";
  position: relative;
  z-index: 2;
  font-family: ui-monospace, monospace;
  font-weight: 700;
  color: oklch(0.696 0.149 162.48);
  font-size: 1rem;
}
@keyframes roy-dataviz-ring-fill {
  0%   { background: conic-gradient(oklch(0.696 0.149 162.48) 0deg, oklch(0.696 0.149 162.48) 0deg, oklch(0.929 0.013 255.51) 0deg, oklch(0.929 0.013 255.51) 360deg); }
  100% { background: conic-gradient(oklch(0.696 0.149 162.48) 0deg, oklch(0.696 0.149 162.48) 252deg, oklch(0.929 0.013 255.51) 252deg, oklch(0.929 0.013 255.51) 360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-progress-ring { animation: none; }
}`,
  },

  // 3. dataviz-progress-semi
  {
    id: "dataviz-progress-semi",
    name: "Semi-Circle Progress",
    category: "data-viz",
    description: "Semi-circle progress gauge that sweeps its arc from left to right",
    tags: ["data-viz", "progress", "semicircle", "gauge", "arc"],
    previewType: "loader",
    cssCode: `/* DataViz: Semi-Circle Progress */
.roycss-dataviz-progress-semi {
  position: relative;
  width: 100px;
  height: 50px;
  overflow: hidden;
}
.roycss-dataviz-progress-semi::before {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 12px solid oklch(0.929 0.013 255.51);
  border-bottom: none;
  border-left-color: transparent;
  border-right-color: transparent;
  box-sizing: border-box;
  clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
}
.roycss-dataviz-progress-semi::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 12px solid oklch(0.585 0.204 200);
  border-bottom: none;
  border-left-color: transparent;
  border-right-color: transparent;
  box-sizing: border-box;
  clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
  transform-origin: 50% 50%;
  animation: roy-dataviz-semi-fill 2s ease-out both;
}
@keyframes roy-dataviz-semi-fill {
  0%   { transform: rotate(-180deg); }
  100% { transform: rotate(-54deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-progress-semi::after { animation: none; transform: rotate(-54deg); }
}`,
  },

  // 4. dataviz-bar-grow
  {
    id: "dataviz-bar-grow",
    name: "Bar Grow",
    category: "data-viz",
    description: "Vertical bar chart columns that grow upward from zero baseline on load",
    tags: ["data-viz", "bar", "chart", "grow", "animate"],
    previewType: "box",
    cssCode: `/* DataViz: Bar Grow */
.roycss-dataviz-bar-grow {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 100%;
  padding: 12px;
  background: oklch(0.984 0.003 247.86);
  border-radius: 6px;
}
.roycss-dataviz-bar-grow::before,
.roycss-dataviz-bar-grow::after {
  content: "";
  width: 14px;
  background: linear-gradient(180deg, oklch(0.696 0.149 162.48) 0%, oklch(0.596 0.127 163.23) 100%);
  border-radius: 3px 3px 0 0;
  transform-origin: bottom;
  animation: roy-dataviz-bar-grow 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  box-shadow: 0 -2px 4px rgba(16, 185, 129, 0.3);
}
.roycss-dataviz-bar-grow::before {
  height: 70%;
  animation-delay: 0s;
}
.roycss-dataviz-bar-grow::after {
  height: 45%;
  animation-delay: 0.15s;
  background: linear-gradient(180deg, oklch(0.585 0.204 200) 0%, oklch(0.511 0.23 200) 100%);
  box-shadow: 0 -2px 4px oklch(0.585 0.204 200 / 0.3);
}
@keyframes roy-dataviz-bar-grow {
  0%   { transform: scaleY(0); }
  100% { transform: scaleY(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-bar-grow::before,
  .roycss-dataviz-bar-grow::after { animation: none; transform: none; }
}`,
  },

  // 5. dataviz-bar-horizontal
  {
    id: "dataviz-bar-horizontal",
    name: "Horizontal Bars",
    category: "data-viz",
    description: "Horizontal bars that grow from left to right with staggered easing",
    tags: ["data-viz", "bar", "horizontal", "grow", "chart"],
    previewType: "box",
    cssCode: `/* DataViz: Horizontal Bars */
.roycss-dataviz-bar-horizontal {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: oklch(0.984 0.003 247.86);
  border-radius: 6px;
  height: 100%;
}
.roycss-dataviz-bar-horizontal::before,
.roycss-dataviz-bar-horizontal::after {
  content: "";
  height: 12px;
  border-radius: 6px;
  transform-origin: left;
  animation: roy-dataviz-hbar-grow 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.roycss-dataviz-bar-horizontal::before {
  width: 85%;
  background: linear-gradient(90deg, oklch(0.696 0.149 162.48) 0%, oklch(0.773 0.153 163.22) 100%);
  animation-delay: 0s;
}
.roycss-dataviz-bar-horizontal::after {
  width: 60%;
  background: linear-gradient(90deg, oklch(0.769 0.165 70.08) 0%, oklch(0.837 0.164 84.43) 100%);
  animation-delay: 0.18s;
}
@keyframes roy-dataviz-hbar-grow {
  0%   { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-bar-horizontal::before,
  .roycss-dataviz-bar-horizontal::after { animation: none; transform: none; }
}`,
  },

  // 6. dataviz-pie-reveal
  {
    id: "dataviz-pie-reveal",
    name: "Pie Reveal",
    category: "data-viz",
    description: "Donut chart segments that sweep in sequentially using conic gradient rotation",
    tags: ["data-viz", "pie", "donut", "chart", "reveal"],
    previewType: "loader",
    cssCode: `/* DataViz: Pie Reveal */
.roycss-dataviz-pie-reveal {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: conic-gradient(
    oklch(0.696 0.149 162.48) 0deg 130deg,
    oklch(0.585 0.204 200) 130deg 240deg,
    oklch(0.769 0.165 70.08) 240deg 320deg,
    oklch(0.637 0.208 25.33) 320deg 360deg
  );
  animation: roy-dataviz-pie-reveal 1.6s ease-out both;
  mask: radial-gradient(circle, transparent 22px, oklch(0 0 0) 23px);
  -webkit-mask: radial-gradient(circle, transparent 22px, oklch(0 0 0) 23px);
}
@keyframes roy-dataviz-pie-reveal {
  0%   { transform: rotate(-90deg) scale(0.6); opacity: 0; }
  60%  { transform: rotate(0deg) scale(1.05); opacity: 1; }
  100% { transform: rotate(0deg) scale(1); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-pie-reveal { animation: none; }
}`,
  },

  // 7. dataviz-sparkline-draw
  {
    id: "dataviz-sparkline-draw",
    name: "Sparkline Draw",
    category: "data-viz",
    description: "Sparkline that draws itself along an SVG-like path using stroke-dashoffset",
    tags: ["data-viz", "sparkline", "line", "draw", "chart"],
    previewType: "background",
    cssCode: `/* DataViz: Sparkline Draw */
.roycss-dataviz-sparkline-draw {
  position: relative;
  height: 100%;
  background: linear-gradient(180deg, oklch(0.984 0.003 247.86) 0%, oklch(0.962 0.018 272.31) 100%);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-dataviz-sparkline-draw::before {
  content: "";
  position: absolute;
  left: 0; right: 0;
  top: 30%;
  height: 4px;
  background:
    linear-gradient(90deg,
      transparent 0%, transparent 5%,
      oklch(0.585 0.204 200) 5%, oklch(0.585 0.204 200) 12%,
      transparent 12%, transparent 22%,
      oklch(0.585 0.204 200) 22%, oklch(0.585 0.204 200) 35%,
      transparent 35%, transparent 45%,
      oklch(0.585 0.204 200) 45%, oklch(0.585 0.204 200) 60%,
      transparent 60%, transparent 72%,
      oklch(0.585 0.204 200) 72%, oklch(0.585 0.204 200) 88%,
      transparent 88%);
  transform-origin: left center;
  transform: scaleX(0);
  animation: roy-dataviz-sparkline 1.6s ease-out 0.2s forwards;
  filter: drop-shadow(0 1px 2px oklch(0.585 0.204 200 / 0.4));
}
.roycss-dataviz-sparkline-draw::after {
  content: "";
  position: absolute;
  left: 0; right: 0;
  top: 30%;
  height: 4px;
  background: linear-gradient(90deg, transparent 0%, oklch(0.585 0.204 200) 50%, transparent 100%);
  opacity: 0.15;
}
@keyframes roy-dataviz-sparkline {
  0%   { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-sparkline-draw::before { animation: none; transform: scaleX(1); }
}`,
  },

  // 8. dataviz-stat-pulse
  {
    id: "dataviz-stat-pulse",
    name: "Stat Pulse",
    category: "data-viz",
    description: "Statistic number that pulses and glows when its value updates",
    tags: ["data-viz", "stat", "pulse", "glow", "number"],
    previewType: "text",
    previewText: "+24.5%",
    cssCode: `/* DataViz: Stat Pulse */
.roycss-dataviz-stat-pulse {
  font-family: ui-monospace, monospace;
  font-weight: 800;
  font-size: 1.6rem;
  color: oklch(0.696 0.149 162.48);
  background: oklch(0.982 0.018 155.83);
  padding: 0.3em 0.6em;
  border-radius: 6px;
  animation: roy-dataviz-stat-pulse 2s ease-in-out infinite;
}
@keyframes roy-dataviz-stat-pulse {
  0%, 100% {
    transform: scale(1);
    text-shadow: 0 0 0 rgba(16, 185, 129, 0);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
  20% {
    transform: scale(1.08);
    text-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.25);
  }
  40% {
    transform: scale(1);
    text-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-stat-pulse { animation: none; }
}`,
  },

  // 9. dataviz-data-flow
  {
    id: "dataviz-data-flow",
    name: "Data Flow",
    category: "data-viz",
    description: "Animated dashed flow line connecting data points with marching ants",
    tags: ["data-viz", "flow", "line", "dashed", "connect"],
    previewType: "box",
    cssCode: `/* DataViz: Data Flow */
.roycss-dataviz-data-flow {
  position: relative;
  height: 100%;
  background: oklch(0.984 0.003 247.86);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-dataviz-data-flow::before {
  content: "";
  position: absolute;
  left: 12px; right: 12px;
  top: 50%;
  height: 3px;
  background-image: linear-gradient(90deg, oklch(0.585 0.204 200) 50%, transparent 50%);
  background-size: 14px 3px;
  background-repeat: repeat-x;
  animation: roy-dataviz-flow-march 0.7s linear infinite;
}
.roycss-dataviz-data-flow::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  top: 50%;
  height: 14px;
  transform: translateY(-50%);
  background:
    radial-gradient(circle at 0% 50%, oklch(0.585 0.204 200) 4px, transparent 5px),
    radial-gradient(circle at 50% 50%, oklch(0.696 0.149 162.48) 4px, transparent 5px),
    radial-gradient(circle at 100% 50%, oklch(0.769 0.165 70.08) 4px, transparent 5px);
}
@keyframes roy-dataviz-flow-march {
  0%   { background-position: 0 0; }
  100% { background-position: 14px 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-data-flow::before { animation: none; }
}`,
  },

  // 10. dataviz-gauge-needle
  {
    id: "dataviz-gauge-needle",
    name: "Gauge Needle",
    category: "data-viz",
    description: "Speedometer-style gauge with a needle that sweeps to its target value",
    tags: ["data-viz", "gauge", "needle", "speedometer", "meter"],
    previewType: "loader",
    cssCode: `/* DataViz: Gauge Needle */
.roycss-dataviz-gauge-needle {
  position: relative;
  width: 100px;
  height: 60px;
  overflow: hidden;
}
.roycss-dataviz-gauge-needle::before {
  content: "";
  position: absolute;
  left: 0; bottom: 0;
  width: 100px;
  height: 100px;
  border-radius: 100px 100px 0 0;
  border: 12px solid;
  border-color: oklch(0.637 0.208 25.33) oklch(0.769 0.165 70.08) oklch(0.929 0.013 255.51) oklch(0.929 0.013 255.51);
  border-bottom: none;
  box-sizing: border-box;
  transform: rotate(0deg);
}
.roycss-dataviz-gauge-needle::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 4px;
  height: 38px;
  margin-left: -2px;
  background: oklch(0.208 0.04 265.75);
  border-radius: 2px;
  transform-origin: bottom center;
  animation: roy-dataviz-gauge-sweep 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  box-shadow: 0 0 4px rgba(0,0,0,0.3);
}
@keyframes roy-dataviz-gauge-sweep {
  0%   { transform: rotate(-90deg); }
  100% { transform: rotate(36deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-gauge-needle::after { animation: none; transform: rotate(36deg); }
}`,
  },

  // 11. dataviz-heatmap-cell
  {
    id: "dataviz-heatmap-cell",
    name: "Heatmap Cell",
    category: "data-viz",
    description: "Single heatmap cell that transitions from cool to warm color on load",
    tags: ["data-viz", "heatmap", "cell", "color", "transition"],
    previewType: "box",
    cssCode: `/* DataViz: Heatmap Cell */
.roycss-dataviz-heatmap-cell {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  background: oklch(0.951 0.025 236.82);
  animation: roy-dataviz-heat 2.4s ease-in-out infinite;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
  position: relative;
}
.roycss-dataviz-heatmap-cell::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 6px;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%);
  pointer-events: none;
}
@keyframes roy-dataviz-heat {
  0%   { background: oklch(0.951 0.025 236.82); }
  25%  { background: oklch(0.809 0.096 200); }
  50%  { background: oklch(0.837 0.164 84.43); }
  75%  { background: oklch(0.705 0.187 47.6); }
  100% { background: oklch(0.577 0.215 27.33); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-heatmap-cell { animation: none; background: oklch(0.837 0.164 84.43); }
}`,
  },

  // 12. dataviz-timeline-progress
  {
    id: "dataviz-timeline-progress",
    name: "Timeline Progress",
    category: "data-viz",
    description: "Horizontal timeline with a progress line that draws across milestones",
    tags: ["data-viz", "timeline", "progress", "line", "milestone"],
    previewType: "box",
    cssCode: `/* DataViz: Timeline Progress */
.roycss-dataviz-timeline-progress {
  position: relative;
  height: 100%;
  background: oklch(0.984 0.003 247.86);
  border-radius: 6px;
  padding: 24px 16px;
}
.roycss-dataviz-timeline-progress::before {
  content: "";
  position: absolute;
  left: 16px; right: 16px;
  top: 50%;
  height: 3px;
  background: oklch(0.929 0.013 255.51);
  border-radius: 2px;
  transform: translateY(-50%);
}
.roycss-dataviz-timeline-progress::after {
  content: "";
  position: absolute;
  left: 16px;
  top: 50%;
  width: 60%;
  height: 3px;
  background: linear-gradient(90deg, oklch(0.585 0.204 200) 0%, oklch(0.696 0.149 162.48) 100%);
  border-radius: 2px;
  transform: translateY(-50%);
  transform-origin: left center;
  animation: roy-dataviz-timeline-draw 1.6s ease-out both;
  box-shadow: 0 0 8px oklch(0.585 0.204 200 / 0.4);
}
@keyframes roy-dataviz-timeline-draw {
  0%   { width: 0; }
  100% { width: 60%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-timeline-progress::after { animation: none; }
}`,
  },

  // 13. dataviz-count-up
  {
    id: "dataviz-count-up",
    name: "Count Up",
    category: "data-viz",
    description: "Integer counter that animates from 0 to target using @property and CSS counter",
    tags: ["data-viz", "count", "number", "counter", "animate"],
    previewType: "text",
    previewText: "",
    cssCode: `/* DataViz: Count Up */
@property --roy-dataviz-count {
  syntax: "<integer>";
  initial-value: 0;
  inherits: false;
}
.roycss-dataviz-count-up {
  --roy-dataviz-count: 0;
  counter-reset: count var(--roy-dataviz-count);
  font-family: ui-monospace, monospace;
  font-weight: 800;
  font-size: 2rem;
  color: oklch(0.585 0.204 200);
  background: oklch(0.962 0.018 272.31);
  padding: 0.2em 0.5em;
  border-radius: 6px;
  animation: roy-dataviz-count-up 2s ease-out both;
}
.roycss-dataviz-count-up::before {
  content: counter(count);
}
@keyframes roy-dataviz-count-up {
  0%   { --roy-dataviz-count: 0; }
  100% { --roy-dataviz-count: 1284; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-count-up { animation: none; --roy-dataviz-count: 1284; }
}`,
  },

  // 14. dataviz-percentage-bar
  {
    id: "dataviz-percentage-bar",
    name: "Percentage Bar",
    category: "data-viz",
    description: "Indeterminate percentage bar with animated diagonal stripes scrolling",
    tags: ["data-viz", "percentage", "bar", "stripes", "loader"],
    previewType: "loader",
    cssCode: `/* DataViz: Percentage Bar */
.roycss-dataviz-percentage-bar {
  position: relative;
  width: 100%;
  height: 24px;
  background: oklch(0.929 0.013 255.51);
  border-radius: 12px;
  overflow: hidden;
}
.roycss-dataviz-percentage-bar::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 65%;
  background:
    repeating-linear-gradient(
      45deg,
      oklch(0.585 0.204 200) 0px,
      oklch(0.585 0.204 200) 10px,
      oklch(0.511 0.23 200) 10px,
      oklch(0.511 0.23 200) 20px
    );
  background-size: 28px 28px;
  border-radius: 12px 0 0 12px;
  animation: roy-dataviz-pct-stripes 0.8s linear infinite, roy-dataviz-pct-fill 1.6s ease-out both;
  box-shadow: inset 0 -2px 0 rgba(0,0,0,0.15);
}
.roycss-dataviz-percentage-bar::after {
  content: "65%";
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: oklch(1 0 89.88);
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}
@keyframes roy-dataviz-pct-stripes {
  0%   { background-position: 0 0; }
  100% { background-position: 28px 0; }
}
@keyframes roy-dataviz-pct-fill {
  0%   { width: 0; }
  100% { width: 65%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-percentage-bar::before { animation: none; width: 65%; }
}`,
  },

  // 15. dataviz-radial-progress
  {
    id: "dataviz-radial-progress",
    name: "Radial Progress",
    category: "data-viz",
    description: "Radial progress with a rotating conic gradient sweep and center cutout",
    tags: ["data-viz", "radial", "progress", "conic", "rotate"],
    previewType: "loader",
    cssCode: `/* DataViz: Radial Progress */
.roycss-dataviz-radial-progress {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, oklch(0.585 0.204 200), oklch(0.606 0.219 292.72), oklch(0.656 0.212 354.31), oklch(0.769 0.165 70.08), oklch(0.585 0.204 200));
  animation: roy-dataviz-radial-spin 1.4s linear infinite;
}
.roycss-dataviz-radial-progress::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: oklch(1 0 89.88);
  border-radius: 50%;
}
.roycss-dataviz-radial-progress::after {
  content: "⋯";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ui-monospace, monospace;
  font-size: 1.2rem;
  font-weight: 700;
  color: oklch(0.585 0.204 200);
}
@keyframes roy-dataviz-radial-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-radial-progress { animation: none; }
}`,
  },

  // 16. dataviz-stacked-bar
  {
    id: "dataviz-stacked-bar",
    name: "Stacked Bar",
    category: "data-viz",
    description: "Stacked bar chart segments that fill in sequence from bottom to top",
    tags: ["data-viz", "stacked", "bar", "chart", "segments"],
    previewType: "box",
    cssCode: `/* DataViz: Stacked Bar */
.roycss-dataviz-stacked-bar {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  padding: 14px;
  background: oklch(0.984 0.003 247.86);
  border-radius: 6px;
}
.roycss-dataviz-stacked-bar::before,
.roycss-dataviz-stacked-bar::after {
  content: "";
  display: block;
  border-radius: 0;
  transform-origin: bottom;
}
.roycss-dataviz-stacked-bar::before {
  height: 30%;
  background: linear-gradient(180deg, oklch(0.637 0.208 25.33) 0%, oklch(0.577 0.215 27.33) 100%);
  animation: roy-dataviz-stack-grow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}
.roycss-dataviz-stacked-bar::after {
  height: 50%;
  background: linear-gradient(180deg, oklch(0.696 0.149 162.48) 0%, oklch(0.596 0.127 163.23) 100%);
  animation: roy-dataviz-stack-grow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0s both;
  box-shadow: 0 -2px 4px rgba(16, 185, 129, 0.2);
}
@keyframes roy-dataviz-stack-grow {
  0%   { transform: scaleY(0); }
  100% { transform: scaleY(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-stacked-bar::before,
  .roycss-dataviz-stacked-bar::after { animation: none; transform: none; }
}`,
  },

  // 17. dataviz-line-chart-draw
  {
    id: "dataviz-line-chart-draw",
    name: "Line Chart Draw",
    category: "data-viz",
    description: "Trending line chart that draws itself across the canvas with a moving dot",
    tags: ["data-viz", "line", "chart", "draw", "trend"],
    previewType: "background",
    cssCode: `/* DataViz: Line Chart Draw */
.roycss-dataviz-line-chart-draw {
  position: relative;
  height: 100%;
  background:
    linear-gradient(180deg, oklch(0.984 0.003 247.86) 0%, oklch(0.962 0.018 272.31) 100%),
    repeating-linear-gradient(0deg, transparent 0, transparent 19px, oklch(0.585 0.204 200 / 0.08) 19px, oklch(0.585 0.204 200 / 0.08) 20px);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-dataviz-line-chart-draw::before {
  content: "";
  position: absolute;
  left: 6%; right: 6%;
  top: 60%;
  height: 4px;
  background: linear-gradient(90deg,
    oklch(0.585 0.204 200) 0%, oklch(0.585 0.204 200) 25%,
    transparent 25%, transparent 40%,
    oklch(0.585 0.204 200) 40%, oklch(0.585 0.204 200) 65%,
    transparent 65%, transparent 78%,
    oklch(0.585 0.204 200) 78%, oklch(0.585 0.204 200) 100%);
  transform-origin: left center;
  transform: scaleX(0);
  animation: roy-dataviz-line-draw 1.8s ease-out 0.2s forwards;
  filter: drop-shadow(0 2px 4px oklch(0.585 0.204 200 / 0.4));
}
.roycss-dataviz-line-chart-draw::after {
  content: "";
  position: absolute;
  left: 6%;
  top: 60%;
  width: 10px;
  height: 10px;
  margin-top: -3px;
  margin-left: -5px;
  background: oklch(1 0 89.88);
  border: 3px solid oklch(0.585 0.204 200);
  border-radius: 50%;
  box-shadow: 0 0 12px oklch(0.585 0.204 200 / 0.6);
  animation: roy-dataviz-line-dot 1.8s ease-out 0.2s both;
}
@keyframes roy-dataviz-line-draw {
  0%   { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
@keyframes roy-dataviz-line-dot {
  0%   { left: 6%; top: 60%; }
  40%  { left: 35%; top: 60%; }
  65%  { left: 60%; top: 30%; }
  100% { left: 94%; top: 30%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-line-chart-draw::before,
  .roycss-dataviz-line-chart-draw::after { animation: none; transform: scaleX(1); }
}`,
  },

  // 18. dataviz-area-chart-fill
  {
    id: "dataviz-area-chart-fill",
    name: "Area Chart Fill",
    category: "data-viz",
    description: "Area chart that fills from the bottom up with a clipped gradient sweep",
    tags: ["data-viz", "area", "chart", "fill", "gradient"],
    previewType: "background",
    cssCode: `/* DataViz: Area Chart Fill */
.roycss-dataviz-area-chart-fill {
  position: relative;
  height: 100%;
  background: oklch(0.984 0.003 247.86);
  border-radius: 6px;
  overflow: hidden;
}
.roycss-dataviz-area-chart-fill::before {
  content: "";
  position: absolute;
  left: 0; right: 0;
  bottom: 0;
  height: 100%;
  background:
    linear-gradient(180deg, oklch(0.585 0.204 200 / 0.5) 0%, oklch(0.585 0.204 200 / 0.15) 60%, oklch(0.585 0.204 200 / 0.05) 100%);
  clip-path: polygon(
    0% 100%, 0% 60%, 15% 50%, 30% 70%, 45% 30%, 60% 45%, 75% 20%, 90% 35%, 100% 15%, 100% 100%
  );
  transform-origin: bottom;
  transform: scaleY(0);
  animation: roy-dataviz-area-fill 1.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.roycss-dataviz-area-chart-fill::after {
  content: "";
  position: absolute;
  left: 0; right: 0;
  top: 0;
  height: 100%;
  background:
    repeating-linear-gradient(0deg, transparent 0, transparent 19px, oklch(0.585 0.204 200 / 0.06) 19px, oklch(0.585 0.204 200 / 0.06) 20px);
  pointer-events: none;
}
@keyframes roy-dataviz-area-fill {
  0%   { transform: scaleY(0); }
  100% { transform: scaleY(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-area-chart-fill::before { animation: none; transform: none; }
}`,
  },

  // 19. dataviz-bubble-pulse
  {
    id: "dataviz-bubble-pulse",
    name: "Bubble Pulse",
    category: "data-viz",
    description: "Data bubble that pulses outward with concentric rings to indicate activity",
    tags: ["data-viz", "bubble", "pulse", "activity", "ring"],
    previewType: "box",
    cssCode: `/* DataViz: Bubble Pulse */
.roycss-dataviz-bubble-pulse {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: oklch(0.984 0.003 247.86);
  border-radius: 50%;
}
.roycss-dataviz-bubble-pulse::before,
.roycss-dataviz-bubble-pulse::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  border: 2px solid oklch(0.585 0.204 200);
}
.roycss-dataviz-bubble-pulse::before {
  width: 36px;
  height: 36px;
  background: radial-gradient(circle at 30% 30%, oklch(0.68 0.158 200), oklch(0.511 0.23 200));
  box-shadow: 0 0 16px oklch(0.585 0.204 200 / 0.6);
  animation: roy-dataviz-bubble-bob 2s ease-in-out infinite;
}
.roycss-dataviz-bubble-pulse::after {
  width: 36px;
  height: 36px;
  border-color: oklch(0.585 0.204 200);
  animation: roy-dataviz-bubble-ring 2s ease-out infinite;
}
@keyframes roy-dataviz-bubble-bob {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.12); }
}
@keyframes roy-dataviz-bubble-ring {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.4); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-bubble-pulse::before,
  .roycss-dataviz-bubble-pulse::after { animation: none; }
  .roycss-dataviz-bubble-pulse::after { opacity: 0; }
}`,
  },

  // 20. dataviz-loading-skeleton
  {
    id: "dataviz-loading-skeleton",
    name: "Loading Skeleton",
    category: "data-viz",
    description: "Skeleton placeholder with shimmering diagonal highlight sweeping across",
    tags: ["data-viz", "skeleton", "loader", "shimmer", "placeholder"],
    previewType: "box",
    cssCode: `/* DataViz: Loading Skeleton */
.roycss-dataviz-loading-skeleton {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: oklch(1 0 89.88);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid oklch(0.929 0.013 255.51);
}
.roycss-dataviz-loading-skeleton::before,
.roycss-dataviz-loading-skeleton::after {
  content: "";
  border-radius: 4px;
  background: linear-gradient(90deg, oklch(0.929 0.013 255.51) 25%, oklch(0.968 0.007 247.9) 50%, oklch(0.929 0.013 255.51) 75%);
  background-size: 200% 100%;
  animation: roy-dataviz-shimmer 1.6s ease-in-out infinite;
}
.roycss-dataviz-loading-skeleton::before {
  height: 14px;
  width: 80%;
}
.roycss-dataviz-loading-skeleton::after {
  height: 14px;
  width: 55%;
}
@keyframes roy-dataviz-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-dataviz-loading-skeleton::before,
  .roycss-dataviz-loading-skeleton::after { animation: none; background: oklch(0.929 0.013 255.51); }
}`,
  },
];
