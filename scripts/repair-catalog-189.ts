#!/usr/bin/env bun
/**
 * Issue #189 — catalog repair + motion/hover guards (Task 10-b, one-off).
 *
 * WHAT IT DOES (data-level, batch files stay the single source of truth):
 *
 *   1. REPAIRS — replaces the cssCode of the confirmed-broken effects from
 *      the 9-c audit (re-verified before this run):
 *        - ferrum-loader-heartbeat: 36KB malformed CSS (88 orphan declaration
 *          groups, ~60 dangling keyframes refs, foreign `.btn-*` + `.card-*` rules)
 *          → rewritten as a valid ~1KB self-contained heartbeat loader.
 *        - ferrum-text-typewriter / ferrum-curtain-in / dataviz-bubble-pulse:
 *          dangling @keyframes references resolved (keyframes defined, or the
 *          dead reference removed when fully overridden).
 *        - loader-orbit / ferrum-misc-typewriter: needed keyframes inlined so
 *          copy-paste works standalone.
 *        - hover-slide-right + page-slide-left: :hover/::before targeted a
 *          class that isn't the effect's own markup → retargeted.
 *        - 19 hover-category effects with NO :hover rule (incl. all
 *          ferrum-hover-* stubs) → real, visible :hover effects.
 *        - 19 non-hover effects with "hover" in their name and no :hover
 *          (16 ferrum-card-hover-*, ferrum-filter-grayscale-hover,
 *          ferrum-linear-shimmer-hover, cursor-fx-hover-lens) → :hover rules
 *          (they would fail the new integrity gate (b)).
 *        - 7 sub-80-char stubs fleshed out into real (small) effects.
 *        - foreign rules stripped: effects that shipped another effect's (or
 *          a nonexistent effect's) rules now keep only their own.
 *
 *   2. GUARDS (data-level, per issue #189 "GUARDS at data level"):
 *        - effects with animation/transition declarations and no
 *          prefers-reduced-motion guard get one appended, scoped to the
 *          effect's own selectors that declare motion;
 *        - hover-category effects get their top-level :hover rules wrapped
 *          in `@media (hover: hover)`.
 *
 *   Decision record (aggregator injection was considered and rejected):
 *   the a11y drift gate (tests/unit/effect-a11y.test.ts) deliberately greps
 *   the 52 batch sources on disk and fails when the generated motionSafe
 *   flags disagree with the files. Load-time injection in roycss-effects.ts
 *   would make the derived data lie about the on-disk sources. Repairing the
 *   batch files keeps catalog, derived a11y data and dist/ in lockstep —
 *   rerun gen:a11y + gen:manifest + build:package afterwards.
 *
 * USAGE:
 *   bun run scripts/repair-catalog-189.ts           (dry run — prints plan)
 *   bun run scripts/repair-catalog-189.ts --apply   (writes the batch files)
 *
 * The script verifies every replacement against the live catalog value and
 * aborts on any mismatch. Run once; commit the result.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APPLY = process.argv.includes("--apply");
const LIB_DIR = join(import.meta.dir, "..", "src", "lib");

const { effects } = await import("../src/lib/roycss-effects");

/* ════════════════════════════════════════════════════════════════
   1. REPAIRS — id → new cssCode
   ════════════════════════════════════════════════════════════════ */

const REPAIRS: Record<string, string> = {
  // ── ferrum-loader-heartbeat: full rewrite (was 36KB malformed CSS) ──
  "ferrum-loader-heartbeat": `/* Heartbeat Loader — a pure-CSS heart that beats */
.roycss-ferrum-loader-heartbeat {
  position: relative;
  inline-size: 30px;
  block-size: 30px;
  background: oklch(0.652 0.241 354.31);
  transform: rotate(45deg);
  animation: roy-ferrum-heartbeat-pulse 1.2s ease-in-out infinite;
}

.roycss-ferrum-loader-heartbeat::before,
.roycss-ferrum-loader-heartbeat::after {
  content: '';
  position: absolute;
  inline-size: 30px;
  block-size: 30px;
  border-radius: 50%;
  background: oklch(0.652 0.241 354.31);
}

.roycss-ferrum-loader-heartbeat::before {
  inset-block-start: -15px;
  inset-inline-start: 0;
}

.roycss-ferrum-loader-heartbeat::after {
  inset-inline-start: -15px;
  inset-block-start: 0;
}

@keyframes roy-ferrum-heartbeat-pulse {
  0%, 100% { transform: rotate(45deg) scale(1); }
  14%      { transform: rotate(45deg) scale(1.2); }
  28%      { transform: rotate(45deg) scale(1); }
  42%      { transform: rotate(45deg) scale(1.2); }
  56%      { transform: rotate(45deg) scale(1); }
}`,

  // ── ferrum-text-typewriter: define own keyframes, drop foreign wave rules ──
  "ferrum-text-typewriter": `/* Typewriter — types out with a blinking caret */
.roycss-ferrum-text-typewriter {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  inline-size: 0;
  border-inline-end: 2px solid oklch(0.627 0.164 271.53);
  animation:
    roy-ferrum-text-typewriter-type 3s steps(24) forwards,
    roy-ferrum-text-typewriter-cursor 0.75s step-end infinite;
}

@keyframes roy-ferrum-text-typewriter-type {
  to { inline-size: 100%; }
}

@keyframes roy-ferrum-text-typewriter-cursor {
  0%, 100% { border-inline-end-color: oklch(0.627 0.164 271.53); }
  50%      { border-inline-end-color: transparent; }
}`,

  // ── ferrum-curtain-in: self-contained keyframes, drop foreign focus-ring rules ──
  "ferrum-curtain-in": `/* Curtain In — page-open curtain sweep */
.roycss-ferrum-curtain-in {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: oklch(1 0 0);
  pointer-events: all;
}

.roycss-ferrum-curtain-in::before,
.roycss-ferrum-curtain-in::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  background: oklch(1 0 0);
}

.roycss-ferrum-curtain-in::before {
  left: 0;
  clip-path: inset(0 50% 0 0);
  animation: roy-ferrum-curtain-left 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.roycss-ferrum-curtain-in::after {
  right: 0;
  clip-path: inset(0 0 0 50%);
  animation: roy-ferrum-curtain-right 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes roy-ferrum-curtain-left {
  0%   { clip-path: inset(0 0 0 0); }
  100% { clip-path: inset(0 50% 0 0); }
}

@keyframes roy-ferrum-curtain-right {
  0%   { clip-path: inset(0 0 0 0); }
  100% { clip-path: inset(0 0 0 50%); }
}`,

  // ── dataviz-bubble-pulse: drop the dead group animation ref (fully
  //    overridden by each pseudo-element's own animation) ──
  "dataviz-bubble-pulse": `/* DataViz: Bubble Pulse */
.roycss-dataviz-bubble-pulse {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 50%;
}
.roycss-dataviz-bubble-pulse::before,
.roycss-dataviz-bubble-pulse::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  border: 2px solid #6366f1;
}
.roycss-dataviz-bubble-pulse::before {
  width: 36px;
  height: 36px;
  background: radial-gradient(circle at 30% 30%, #818cf8, #4f46e5);
  box-shadow: 0 0 16px rgba(99,102,241,0.6);
  animation: roy-dataviz-bubble-bob 2s ease-in-out infinite;
}
.roycss-dataviz-bubble-pulse::after {
  width: 36px;
  height: 36px;
  border-color: #6366f1;
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

  // ── loader-orbit: inline roy-spin so copy-paste is standalone ──
  "loader-orbit": `/* Orbit Loader */
.roycss-loader-orbit {
  inline-size: 40px;
  block-size: 40px;
  position: relative;
}

.roycss-loader-orbit::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: oklch(0.696 0.149 162.48);
  animation: roy-spin 1s linear infinite;
}

.roycss-loader-orbit::after {
  content: '';
  position: absolute;
  inset-block-start: -3px;
  inset-inline-start: 50%;
  inline-size: 8px;
  block-size: 8px;
  margin-inline-start: -4px;
  border-radius: 50%;
  background: oklch(0.696 0.149 162.48);
  box-shadow: 0 0 10px color-mix(in oklch, oklch(0.696 0.149 162.48) 50%, transparent);
  animation: roy-orbit-move 1s linear infinite;
}

@keyframes roy-spin {
  to { transform: rotate(360deg); }
}

@keyframes roy-orbit-move {
  0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
}`,

  // ── ferrum-misc-typewriter: inline its two keyframes ──
  "ferrum-misc-typewriter": `/* Misc Typewriter */
.roycss-ferrum-misc-typewriter {
  display: inline-block;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: oklch(0.696 0.149 162.48);
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid oklch(0.696 0.149 162.48);
  width: 0;
  animation:
    roy-misc-typewriter-type 2.5s steps(6) infinite,
    roy-misc-typewriter-cursor 0.6s step-end infinite;
}

@keyframes roy-misc-typewriter-type {
  0%   { width: 0; }
  50%  { width: 100%; }
  100% { width: 0; }
}

@keyframes roy-misc-typewriter-cursor {
  0%, 100% { border-right-color: oklch(0.696 0.149 162.48); }
  50%      { border-right-color: transparent; }
}`,

  // ── hover-slide-right: :hover targeted a class that doesn't exist ──
  "hover-slide-right": `/* Hover Slide Right */
.roycss-hover-slide-right {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.roycss-hover-slide-right:hover {
  transform: translateX(12px);
}`,

  // ── page-slide-left: ::before targeted a class that doesn't exist ──
  "page-slide-left": `/* Page Slide Left */
.roycss-page-slide-left {
  position: relative;
  background: linear-gradient(135deg, oklch(0.208 0.04 265.75), oklch(0.279 0.037 260.03));
  overflow: hidden;
}

.roycss-page-slide-left::before {
  content: "";
  position: absolute;
  inset: 8px;
  background: linear-gradient(135deg, oklch(0.715 0.126 215.22), oklch(0.623 0.188 259.81));
  border-radius: 6px;
  box-shadow: 0 12px 32px color-mix(in oklch, oklch(0.623 0.188 259.81) 40%, transparent);
  animation: roy-page-slide-left 3.2s ease-in-out infinite;
}

@keyframes roy-page-slide-left {
  0% { transform: translateX(100%); opacity: 0; }
  30%, 60% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(-100%); opacity: 0; }
}`,

  // ── ferrum-hover-morph: strip the foreign .roycss-ferrum-hover-shake rules ──
  "ferrum-hover-morph": `/* Hover Morph */
.roycss-ferrum-hover-morph {
  border-radius: 8px;
  transition: border-radius 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.5s ease;
}
.roycss-ferrum-hover-morph:hover {
  border-radius: 50%;
  transform: scale(0.95);
}`,

  // ── ferrum-text-blink: strip the foreign text-scramble rules ──
  "ferrum-text-blink": `/* Text Blink */
.roycss-ferrum-text-blink {
  animation: roy-ferrum-text-blink-anim 1s step-end infinite;
}

@keyframes roy-ferrum-text-blink-anim {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}`,

  // ── ferrum-text-rainbow: strip the foreign text-slide-up rules ──
  "ferrum-text-rainbow": `/* Text Rainbow */
.roycss-ferrum-text-rainbow {
  background: linear-gradient(
    90deg,
    oklch(0.628 0.258 29.23), oklch(0.744 0.181 56.46), oklch(0.968 0.211 109.77),
    oklch(0.866 0.295 142.5), oklch(0.632 0.202 254.09), oklch(0.539 0.294 296.54),
    oklch(0.648 0.263 359.98), oklch(0.628 0.258 29.23)
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: roy-ferrum-text-rainbow-anim 3s linear infinite;
}

@keyframes roy-ferrum-text-rainbow-anim {
  0%   { background-position: 0% center; }
  100% { background-position: 200% center; }
}`,

  // ── ferrum-text-reveal: strip the foreign text-bounce rules ──
  "ferrum-text-reveal": `/* Text Reveal */
.roycss-ferrum-text-reveal {
  overflow: hidden;
  display: inline-block;
}
.roycss-ferrum-text-reveal span {
  display: inline-block;
  transform: translateY(110%);
  animation: roy-ferrum-text-reveal-anim 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.roycss-ferrum-text-reveal span:nth-child(1)  { animation-delay: 0.05s; }
.roycss-ferrum-text-reveal span:nth-child(2)  { animation-delay: 0.10s; }
.roycss-ferrum-text-reveal span:nth-child(3)  { animation-delay: 0.15s; }
.roycss-ferrum-text-reveal span:nth-child(4)  { animation-delay: 0.20s; }
.roycss-ferrum-text-reveal span:nth-child(5)  { animation-delay: 0.25s; }
.roycss-ferrum-text-reveal span:nth-child(6)  { animation-delay: 0.30s; }
.roycss-ferrum-text-reveal span:nth-child(7)  { animation-delay: 0.35s; }
.roycss-ferrum-text-reveal span:nth-child(8)  { animation-delay: 0.40s; }
.roycss-ferrum-text-reveal span:nth-child(9)  { animation-delay: 0.45s; }
.roycss-ferrum-text-reveal span:nth-child(10) { animation-delay: 0.50s; }

@keyframes roy-ferrum-text-reveal-anim {
  0%   { transform: translateY(110%); }
  100% { transform: translateY(0); }
}`,

  // ── ferrum-skeleton-grid-line: strip the other effects' nth-child delay rules ──
  "ferrum-skeleton-grid-line": `/* Skeleton Grid Line */
.roycss-ferrum-skeleton-grid-line {
  height: 12px;
  border-radius: 4px;
  background-color: oklch(0.907 0.0 89.88);
  background-image: linear-gradient(
    90deg, oklch(0.907 0.0 89.88) 0%, oklch(0.955 0.0 89.88) 40%, oklch(0.979 0.0 89.88) 50%, oklch(0.955 0.0 89.88) 60%, oklch(0.907 0.0 89.88) 100%
  );
  background-size: 200% 100%;
  animation: roy-ferrum-skeleton-grid 1.8s ease-in-out infinite;
}

@keyframes roy-ferrum-skeleton-grid {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`,

  // ── ferrum-input-float-label-label: strip the foreign input :focus rule ──
  "ferrum-input-float-label-label": `/* Float Label Label */
.roycss-ferrum-input-float-label-label {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  font-size: 14px;
  color: oklch(0.683 0.0 89.88);
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: oklch(1 0 0);
  padding: 0 4px;
}

.roycss-ferrum-input-float-label:focus ~ .roycss-ferrum-input-float-label-label,
.roycss-ferrum-input-float-label:not(:placeholder-shown) ~ .roycss-ferrum-input-float-label-label {
  top: 0;
  font-size: 11px;
  color: oklch(0.579 0.247 288.24);
  transform: translateY(-50%);
}`,

  // ── 19 hover-category effects with no :hover rule → real hover effects ──
  "ferrum-hover-border-draw": `/* Hover Border Draw */
.roycss-ferrum-hover-border-draw {
  position: relative;
  box-sizing: border-box;
}
.roycss-ferrum-hover-border-draw::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid oklch(0.696 0.149 162.48);
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.4s ease;
}
.roycss-ferrum-hover-border-draw:hover::after {
  clip-path: inset(0 0 0 0);
}`,

  "ferrum-hover-color-shift": `/* Hover Color Shift */
.roycss-ferrum-hover-color-shift {
  background: linear-gradient(135deg, oklch(0.696 0.149 162.48), oklch(0.596 0.127 163.23));
  transition: all 0.4s ease;
  background-size: 200% 200%;
  background-position: 0% 50%;
}
.roycss-ferrum-hover-color-shift:hover {
  background-position: 100% 50%;
}`,

  "ferrum-hover-depth": `/* Hover Depth */
.roycss-ferrum-hover-depth {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.4s ease;
  box-shadow: 0 1px 2px color-mix(in oklch, oklch(0 0 0) 8%, transparent),
              0 2px 4px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
}
.roycss-ferrum-hover-depth:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px color-mix(in oklch, oklch(0 0 0) 18%, transparent),
              0 4px 8px color-mix(in oklch, oklch(0 0 0) 8%, transparent);
}`,

  "ferrum-hover-drop-shadow": `/* Hover Drop Shadow */
.roycss-ferrum-hover-drop-shadow {
  transition: filter 0.35s ease, transform 0.35s ease;
}
.roycss-ferrum-hover-drop-shadow:hover {
  filter: drop-shadow(0 8px 12px color-mix(in oklch, oklch(0 0 0) 35%, transparent));
  transform: translateY(-2px);
}`,

  "ferrum-hover-fade-overlay": `/* Hover Fade Overlay */
.roycss-ferrum-hover-fade-overlay {
  position: relative;
  isolation: isolate;
}
.roycss-ferrum-hover-fade-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: oklch(0.208 0.04 265.75);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}
.roycss-ferrum-hover-fade-overlay:hover::after {
  opacity: 0.85;
}`,

  "ferrum-hover-glow-border": `/* Hover Glow Border */
.roycss-ferrum-hover-glow-border {
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  transition: all 0.3s ease;
}
.roycss-ferrum-hover-glow-border:hover {
  border-color: oklch(0.696 0.149 162.48);
  box-shadow: 0 0 18px color-mix(in oklch, oklch(0.696 0.149 162.48) 55%, transparent);
}`,

  "ferrum-hover-grayscale-to-color": `/* Hover Grayscale To Color */
.roycss-ferrum-hover-grayscale-to-color {
  filter: grayscale(100%);
  transition: filter 0.5s ease;
}
.roycss-ferrum-hover-grayscale-to-color:hover {
  filter: grayscale(0);
}`,

  "ferrum-hover-hue-rotate": `/* Hover Hue Rotate */
.roycss-ferrum-hover-hue-rotate {
  transition: filter 0.3s ease;
}
.roycss-ferrum-hover-hue-rotate:hover {
  filter: hue-rotate(90deg);
}`,

  "ferrum-hover-neon-flicker": `/* Hover Neon Flicker */
.roycss-ferrum-hover-neon-flicker {
  transition: box-shadow 0.2s ease;
}
.roycss-ferrum-hover-neon-flicker:hover {
  box-shadow:
    0 0 6px oklch(0.845 0.199 91.4),
    0 0 18px oklch(0.795 0.184 86.05),
    0 0 36px oklch(0.745 0.16 81.05);
  animation: roy-ferrum-hover-neon-flicker-anim 0.9s ease-in-out infinite;
}
@keyframes roy-ferrum-hover-neon-flicker-anim {
  0%, 100% { opacity: 1; }
  45%      { opacity: 1; }
  50%      { opacity: 0.6; }
  55%      { opacity: 1; }
  70%      { opacity: 0.75; }
  75%      { opacity: 1; }
}`,

  "ferrum-hover-opacity": `/* Hover Opacity */
.roycss-ferrum-hover-opacity {
  transition: opacity 0.3s ease;
}
.roycss-ferrum-hover-opacity:hover {
  opacity: 0.55;
}`,

  "ferrum-hover-overlay-reveal": `/* Hover Overlay Reveal */
.roycss-ferrum-hover-overlay-reveal {
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}
.roycss-ferrum-hover-overlay-reveal::after {
  content: '';
  position: absolute;
  inset: 0;
  background: oklch(0.696 0.149 162.48);
  transform: translateY(100%);
  transition: transform 0.35s ease;
  z-index: -1;
}
.roycss-ferrum-hover-overlay-reveal:hover::after {
  transform: translateY(0);
}`,

  "ferrum-hover-press": `/* Hover Press */
.roycss-ferrum-hover-press {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 6px 0 oklch(0.508 0.105 165.61), 0 8px 14px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}
.roycss-ferrum-hover-press:hover {
  transform: translateY(4px);
  box-shadow: 0 2px 0 oklch(0.508 0.105 165.61), 0 4px 8px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}`,

  "ferrum-hover-push-up": `/* Hover Push Up */
.roycss-ferrum-hover-push-up {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}
.roycss-ferrum-hover-push-up:hover {
  transform: translateY(-8px);
  box-shadow: 0 14px 24px color-mix(in oklch, oklch(0 0 0) 16%, transparent);
}`,

  "ferrum-hover-scale": `/* Hover Scale */
.roycss-ferrum-hover-scale {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}
.roycss-ferrum-hover-scale:hover {
  transform: scale(1.08);
  box-shadow: 0 12px 24px color-mix(in oklch, oklch(0 0 0) 16%, transparent);
}`,

  "ferrum-hover-shadow-grow": `/* Hover Shadow Grow */
.roycss-ferrum-hover-shadow-grow {
  transition: transform 0.3s ease,
              box-shadow 0.3s ease;
  box-shadow: 0 2px 4px color-mix(in oklch, oklch(0 0 0) 6%, transparent);
}
.roycss-ferrum-hover-shadow-grow:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
}`,

  "ferrum-hover-slide-overlay": `/* Hover Slide Overlay */
.roycss-ferrum-hover-slide-overlay {
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease;
}
.roycss-ferrum-hover-slide-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: oklch(0.696 0.149 162.48);
  transform: translateX(-101%);
  transition: transform 0.35s ease;
  z-index: -1;
}
.roycss-ferrum-hover-slide-overlay:hover::after {
  transform: translateX(0);
}`,

  "ferrum-hover-tilt-rotate": `/* Hover Tilt Rotate */
.roycss-ferrum-hover-tilt-rotate {
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
  perspective: 1000px;
}
.roycss-ferrum-hover-tilt-rotate:hover {
  transform: rotateX(12deg) rotateY(-8deg);
}`,

  "ferrum-hover-underline-slide": `/* Hover Underline Slide */
.roycss-ferrum-hover-underline-slide {
  position: relative;
  display: inline-block;
  text-decoration: none;
}
.roycss-ferrum-hover-underline-slide::after {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  bottom: -2px;
  inline-size: 100%;
  block-size: 2px;
  background: oklch(0.696 0.149 162.48);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}
.roycss-ferrum-hover-underline-slide:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}`,

  "ferrum-hover-zoom-blur": `/* Hover Zoom Blur */
.roycss-ferrum-hover-zoom-blur {
  transition: transform 0.4s ease, filter 0.4s ease;
}
.roycss-ferrum-hover-zoom-blur:hover {
  transform: scale(1.1);
  filter: blur(1.5px);
}`,

  // ── 16 ferrum-card-hover-* (cards) with no :hover rule ──
  "ferrum-card-hover-border": `/* Card Hover Border */
.roycss-ferrum-card-hover-border {
  position: relative;
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 12%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: border-color 0.3s ease;
}
.roycss-ferrum-card-hover-border:hover {
  border-color: oklch(0.696 0.149 162.48);
}`,

  "ferrum-card-hover-color": `/* Card Hover Color */
.roycss-ferrum-card-hover-color {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: background 0.5s ease, color 0.5s ease, border-color 0.5s ease;
}
.roycss-ferrum-card-hover-color:hover {
  background: oklch(0.31 0.06 262);
  color: oklch(0.95 0.05 145);
  border-color: oklch(0.696 0.149 162.48);
}`,

  "ferrum-card-hover-fade": `/* Card Hover Fade */
.roycss-ferrum-card-hover-fade {
  position: relative;
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  overflow: hidden;
}
.roycss-ferrum-card-hover-fade::after {
  content: '';
  position: absolute;
  inset: 0;
  background: oklch(0.696 0.149 162.48);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.roycss-ferrum-card-hover-fade:hover::after {
  opacity: 0.25;
}`,

  "ferrum-card-hover-flip": `/* Card Hover Flip */
.roycss-ferrum-card-hover-flip {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 30%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transform-style: preserve-3d;
  transition: transform 0.7s ease, background 0.4s ease, color 0.4s ease;
}
.roycss-ferrum-card-hover-flip:hover {
  transform: rotateY(8deg) scale(1.02);
}`,

  "ferrum-card-hover-glow": `/* Card Hover Glow */
.roycss-ferrum-card-hover-glow {
  background: oklch(0.21 0.034 264.67);
  border: 1px solid color-mix(in oklch, oklch(0.696 0.149 162.48) 20%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
}
.roycss-ferrum-card-hover-glow:hover {
  box-shadow: 0 0 24px color-mix(in oklch, oklch(0.696 0.149 162.48) 45%, transparent);
  border-color: oklch(0.696 0.149 162.48);
}`,

  "ferrum-card-hover-lift": `/* Card Hover Lift */
.roycss-ferrum-card-hover-lift {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}
.roycss-ferrum-card-hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 18px 32px color-mix(in oklch, oklch(0 0 0) 35%, transparent);
  border-color: oklch(0.696 0.149 162.48);
}`,

  "ferrum-card-hover-press": `/* Card Hover Press */
.roycss-ferrum-card-hover-press {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  box-shadow: 0 12px 22px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.roycss-ferrum-card-hover-press:hover {
  transform: translateY(4px) scale(0.99);
  box-shadow: 0 4px 10px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}`,

  "ferrum-card-hover-push": `/* Card Hover Push */
.roycss-ferrum-card-hover-push {
  position: relative;
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transform-style: preserve-3d;
  transition: transform 0.35s ease;
}
.roycss-ferrum-card-hover-push:hover {
  transform: translateY(-6px);
}`,

  "ferrum-card-hover-reveal": `/* Card Hover Reveal */
.roycss-ferrum-card-hover-reveal {
  position: relative;
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  overflow: hidden;
}
.roycss-ferrum-card-hover-reveal::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  block-size: 4px;
  background: oklch(0.696 0.149 162.48);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}
.roycss-ferrum-card-hover-reveal:hover::after {
  transform: scaleX(1);
}`,

  "ferrum-card-hover-rotate": `/* Card Hover Rotate */
.roycss-ferrum-card-hover-rotate {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  perspective: 800px;
  transform-style: preserve-3d;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}
.roycss-ferrum-card-hover-rotate:hover {
  transform: rotate(-2.5deg);
  box-shadow: 0 16px 28px color-mix(in oklch, oklch(0 0 0) 30%, transparent);
}`,

  "ferrum-card-hover-skew": `/* Card Hover Skew */
.roycss-ferrum-card-hover-skew {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.35s ease, background 0.35s ease, color 0.35s ease;
}
.roycss-ferrum-card-hover-skew:hover {
  transform: skewX(-4deg);
}`,

  "ferrum-card-hover-slide": `/* Card Hover Slide */
.roycss-ferrum-card-hover-slide {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}
.roycss-ferrum-card-hover-slide:hover {
  transform: translateX(8px);
  box-shadow: -8px 12px 24px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}`,

  "ferrum-card-hover-swing": `/* Card Hover Swing */
.roycss-ferrum-card-hover-swing {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transform-origin: top center;
  transition: transform 0.3s ease;
}
.roycss-ferrum-card-hover-swing:hover {
  transform: rotate(4deg);
}`,

  "ferrum-card-hover-tada": `/* Card Hover Tada */
.roycss-ferrum-card-hover-tada {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.3s ease;
}
.roycss-ferrum-card-hover-tada:hover {
  animation: roy-ferrum-card-hover-tada-anim 0.9s ease;
}
@keyframes roy-ferrum-card-hover-tada-anim {
  0%                { transform: scale(1); }
  10%, 20%          { transform: scale(0.9) rotate(-3deg); }
  30%, 50%, 70%, 90% { transform: scale(1.08) rotate(3deg); }
  40%, 60%, 80%     { transform: scale(1.08) rotate(-3deg); }
  100%              { transform: scale(1) rotate(0); }
}`,

  "ferrum-card-hover-wobble": `/* Card Hover Wobble */
.roycss-ferrum-card-hover-wobble {
  background: oklch(0.27 0.04 260.03);
  border: 1px solid color-mix(in oklch, oklch(1 0 0) 10%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.929 0.013 255.51);
  transition: transform 0.3s ease;
}
.roycss-ferrum-card-hover-wobble:hover {
  animation: roy-ferrum-card-hover-wobble-anim 0.9s ease;
}
@keyframes roy-ferrum-card-hover-wobble-anim {
  0%   { transform: translateX(0); }
  15%  { transform: translateX(-8px) rotate(-2deg); }
  30%  { transform: translateX(6px) rotate(1.5deg); }
  45%  { transform: translateX(-4px) rotate(-1deg); }
  60%  { transform: translateX(3px) rotate(0.5deg); }
  100% { transform: translateX(0); }
}`,

  "ferrum-card-hover-zoom": `/* Card Hover Zoom */
.roycss-ferrum-card-hover-zoom {
  background: linear-gradient(135deg, oklch(0.386 0.059 188.42), oklch(0.27 0.04 260.03));
  border: 1px solid color-mix(in oklch, oklch(0.699 0.118 184.7) 25%, transparent);
  border-radius: 16px;
  padding: 24px;
  color: oklch(0.953 0.05 180.8);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}
.roycss-ferrum-card-hover-zoom:hover {
  transform: scale(1.04);
  box-shadow: 0 16px 32px color-mix(in oklch, oklch(0 0 0) 35%, transparent);
}`,

  // ── name-hover effects outside the hover category ──
  "ferrum-filter-grayscale-hover": `/* Filter Grayscale Hover */
.roycss-ferrum-filter-grayscale-hover {
  background: linear-gradient(135deg, oklch(0.667 0.217 13.9) 0%, oklch(0.56 0.235 268.65) 50%, oklch(0.667 0.217 13.9) 100%);
  filter: grayscale(1) brightness(0.85);
  transition: filter 0.5s ease;
}
.roycss-ferrum-filter-grayscale-hover:hover {
  filter: grayscale(0) brightness(1);
}`,

  "ferrum-linear-shimmer-hover": `/* Linear Shimmer Hover */
.roycss-ferrum-linear-shimmer-hover {
  position: relative;
  background: oklch(0.169 0.002 286.18);
  color: oklch(0.92 0.004 286.32);
  overflow: hidden;
  border: 1px solid oklch(0.274 0.005 286.03);
}
.roycss-ferrum-linear-shimmer-hover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, oklch(1 0 0 / 0.18) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.8s ease;
}
.roycss-ferrum-linear-shimmer-hover:hover::after {
  transform: translateX(100%);
}`,

  "cursor-fx-hover-lens": `/* Cursor-FX: Hover Lens */
.roycss-cursor-fx-hover-lens {
  position: relative;
  width: 100%; height: 100%;
  background:
    repeating-linear-gradient(45deg, oklch(0.85 0.18 30) 0 10px, oklch(0.65 0.2 200) 10px 20px);
  border-radius: 14px;
  overflow: hidden;
}
.roycss-cursor-fx-hover-lens::before {
  content: "";
  position: absolute;
  width: 120px; height: 120px;
  border-radius: 50%;
  background:
    repeating-linear-gradient(45deg, oklch(0.85 0.18 30) 0 5px, oklch(0.65 0.2 200) 5px 10px);
  background-size: 200% 200%;
  border: 4px solid oklch(1 0 0 / 0.6);
  box-shadow: 0 0 0 6px oklch(0 0 0 / 0.3), inset 0 0 20px oklch(0 0 0 / 0.4);
  animation: roy-cursor-fx-hover-lens 4s ease-in-out infinite;
}
.roycss-cursor-fx-hover-lens::after {
  content: "";
  position: absolute;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: oklch(1 0 0);
  box-shadow: 0 0 0 4px oklch(1 0 0 / 0.3);
  animation: roy-cursor-fx-hover-lens-dot 4s ease-in-out infinite;
}
.roycss-cursor-fx-hover-lens:hover::before {
  border-color: oklch(1 0 0);
  box-shadow: 0 0 0 8px oklch(1 0 0 / 0.45), inset 0 0 24px oklch(0 0 0 / 0.45);
}
@keyframes roy-cursor-fx-hover-lens {
  0%, 100% { transform: translate(-50%, -30%) scale(1); }
  50%      { transform: translate(30%, 40%)  scale(1.1); }
}
@keyframes roy-cursor-fx-hover-lens-dot {
  0%, 100% { transform: translate(20%, 30%); }
  50%      { transform: translate(140%, 130%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-cursor-fx-hover-lens::before,
  .roycss-cursor-fx-hover-lens::after { animation: none; }
}`,

  // ── 7 sub-80-char stubs fleshed out ──
  "ferrum-input-float-label-wrapper": `/* Float Label Wrapper — positioning context for the CSS-only float-label input */
.roycss-ferrum-input-float-label-wrapper {
  position: relative;
  display: block;
  inline-size: 100%;
  margin-block: 6px;
}`,

  "ferrum-accordion-trigger": `/* Accordion Trigger — visually-hidden checkbox that drives the CSS-only accordion
   (keep it focusable: opacity 0 + 1px box instead of display: none) */
.roycss-ferrum-accordion-trigger {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: 0;
  opacity: 0;
  appearance: none;
  pointer-events: none;
}`,

  "ferrum-loader-fading-dots": `/* Fading Dots Loader — three dots fading in sequence (render 3 <span> children) */
.roycss-ferrum-loader-fading-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}
.roycss-ferrum-loader-fading-dots span {
  inline-size: 10px;
  block-size: 10px;
  border-radius: 50%;
  background: oklch(0.696 0.149 162.48);
  animation: roy-ferrum-fading-dots 1.2s ease-in-out infinite;
}
.roycss-ferrum-loader-fading-dots span:nth-child(2) { animation-delay: 0.2s; }
.roycss-ferrum-loader-fading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes roy-ferrum-fading-dots {
  0%, 100% { opacity: 0.25; transform: scale(0.85); }
  50%      { opacity: 1; transform: scale(1); }
}`,

  "ferrum-loader-three-bounce": `/* Three Bounce Loader — classic tri-dot bounce (render 3 <span> children) */
.roycss-ferrum-loader-three-bounce {
  display: flex;
  align-items: center;
  gap: 8px;
}
.roycss-ferrum-loader-three-bounce span {
  inline-size: 12px;
  block-size: 12px;
  border-radius: 50%;
  background: oklch(0.696 0.149 162.48);
  animation: roy-ferrum-three-bounce 1.4s ease-in-out infinite;
}
.roycss-ferrum-loader-three-bounce span:nth-child(2) { animation-delay: 0.16s; }
.roycss-ferrum-loader-three-bounce span:nth-child(3) { animation-delay: 0.32s; }

@keyframes roy-ferrum-three-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40%           { transform: scale(1);   opacity: 1; }
}`,
};

/** Effects that need a childCount added (loader previews render spans). */
const ADD_CHILD_COUNT: Record<string, number> = {
  "ferrum-loader-fading-dots": 3,
  "ferrum-loader-three-bounce": 3,
};

/* ════════════════════════════════════════════════════════════════
   2. GUARDS — reduced-motion append + hover:hover wrap
   ════════════════════════════════════════════════════════════════ */

interface Stmt {
  head: string; // selector or at-rule prelude
  body: string; // block content (for rules: declarations)
  kind: "rule" | "at";
}

/** Split CSS into top-level statements. Safe: no braces inside strings. */
function splitTopLevel(css: string): Stmt[] {
  const out: Stmt[] = [];
  let head = "";
  let depth = 0;
  let bodyStart = -1;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (depth === 0) {
      if (ch === "{") {
        head = head.trim();
        depth = 1;
        bodyStart = i + 1;
      } else {
        head += ch;
      }
    } else {
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          out.push({
            head,
            body: css.slice(bodyStart, i),
            kind: head.startsWith("@") ? "at" : "rule",
          });
          head = "";
        }
      }
    }
  }
  const tail = head.trim();
  if (tail) out.push({ head: tail, body: "", kind: tail.startsWith("@") ? "at" : "rule" });
  return out;
}

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const MOTION_DECL = /^\s*(?:-[a-z]+-)?(animation|transition)(?:-[a-z-]+)?\s*:/;

/** Which motion properties does this declaration body disable-ably declare? */
function motionInBody(body: string): { animation: boolean; transition: boolean } {
  let animation = false;
  let transition = false;
  for (const decl of body.split(";")) {
    const m = decl.match(MOTION_DECL);
    if (m) {
      if (m[1] === "animation") animation = true;
      else transition = true;
    }
  }
  return { animation, transition };
}

/** Collect selectors of rules declaring motion (recursing into at-rule blocks, skipping keyframes). */
function collectMotionSelectors(css: string, acc: Map<string, { animation: boolean; transition: boolean }>): void {
  for (const stmt of splitTopLevel(css)) {
    if (stmt.kind === "at") {
      if (/^@(?:-[a-z]+-)?keyframes\b/.test(stmt.head)) continue; // skip keyframes bodies
      collectMotionSelectors(stmt.body, acc); // recurse into @media / @supports
      continue;
    }
    const motion = motionInBody(stripComments(stmt.body));
    if (motion.animation || motion.transition) {
      const prev = acc.get(stmt.head);
      acc.set(stmt.head, {
        animation: (prev?.animation ?? false) || motion.animation,
        transition: (prev?.transition ?? false) || motion.transition,
      });
    }
  }
}

const indent = (s: string, spaces: number) =>
  s.split("\n").map((line) => (line.trim() ? " ".repeat(spaces) + line : line)).join("\n");

/** Wrap top-level :hover rules of hover-category effects in @media (hover: hover). */
function wrapHoverRules(css: string): { css: string; wrapped: number; skippedMixed: string[] } {
  const stmts = splitTopLevel(css);
  const out: string[] = [];
  let wrapped = 0;
  const skippedMixed: string[] = [];
  for (const stmt of stmts) {
    const raw = stmt.kind === "rule" ? `${stmt.head} {${stmt.body}}` : `${stmt.head} {${stmt.body}}`;
    if (stmt.kind === "rule" && stmt.head.includes(":hover")) {
      const parts = stmt.head.split(",").map((p) => p.trim());
      if (parts.every((p) => p.includes(":hover"))) {
        out.push(`@media (hover: hover) {\n${indent(raw, 2)}\n}`);
        wrapped++;
        continue;
      }
      skippedMixed.push(stmt.head);
    }
    out.push(raw);
  }
  return { css: out.join("\n"), wrapped, skippedMixed };
}

/** Append a prefers-reduced-motion guard scoped to the effect's own motion selectors. */
function appendMotionGuard(css: string): { css: string; selectors: number } {
  if (stripComments(css).includes("prefers-reduced-motion")) return { css, selectors: 0 };
  const acc = new Map<string, { animation: boolean; transition: boolean }>();
  collectMotionSelectors(css, acc);
  if (acc.size === 0) return { css, selectors: 0 };
  const lines: string[] = ["@media (prefers-reduced-motion: reduce) {"];
  for (const [selector, motion] of acc) {
    lines.push(`  ${selector} {`);
    if (motion.animation) lines.push(`    animation: none;`);
    if (motion.transition) lines.push(`    transition: none;`);
    lines.push(`  }`);
  }
  lines.push("}");
  const block = lines.join("\n");
  return { css: css.replace(/\s*$/, "\n\n") + block + "\n", selectors: acc.size };
}

/* ════════════════════════════════════════════════════════════════
   3. FILE PLUMBING — locate + verify + replace template literals
   ════════════════════════════════════════════════════════════════ */

const BATCH_FILES = readdirSync(LIB_DIR)
  .filter((f) => /^effects-batch-\d+\.ts$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));

const fileText = new Map<string, string>(BATCH_FILES.map((f) => [f, readFileSync(join(LIB_DIR, f), "utf8")]));

/** id → file + index of the `id: "…"` marker (first occurrence). */
const idLocations = new Map<string, { file: string; index: number }>();
for (const file of BATCH_FILES) {
  const raw = fileText.get(file)!;
  for (const m of raw.matchAll(/id: "([^"]+)"/g)) {
    if (!idLocations.has(m[1])) idLocations.set(m[1], { file, index: m.index! });
  }
}

/** Cook a template-literal body the way TS does (only \\ escapes occur in these files). */
const cook = (raw: string) => raw.replace(/\\\\/g, "\\");
/** Escape a css string for a TS template literal (no backticks / ${ allowed). */
const escapeTpl = (s: string) => {
  if (s.includes("`") || s.includes("${")) throw new Error("template-literal-unsafe css");
  return s.replace(/\\/g, "\\\\");
};

/** Replace one effect's cssCode (and optionally insert childCount) inside its batch file. */
function replaceInFile(id: string, originalCss: string, nextCss: string, childCount?: number): void {
  const loc = idLocations.get(id);
  if (!loc) throw new Error(`${id}: not found in batch files`);
  const raw = fileText.get(loc.file)!;
  // Ids are unique and quoted, so the marker search can safely start from 0 —
  // earlier replacements in the same file shift indexes, never rename ids.
  const marker = raw.indexOf(`id: "${id}"`);
  if (marker === -1) throw new Error(`${id}: id marker not found`);
  const cssStart = raw.indexOf("cssCode: `", marker);
  if (cssStart === -1) throw new Error(`${id}: cssCode literal not found`);
  const contentStart = cssStart + "cssCode: `".length;
  const contentEnd = raw.indexOf("`", contentStart);
  const current = cook(raw.slice(contentStart, contentEnd));
  if (current !== originalCss) {
    // Replace only if the on-disk value still matches what we computed FROM.
    throw new Error(`${id}: on-disk cssCode does not match the catalog value (stale run?)`);
  }
  let next = raw.slice(0, contentStart) + escapeTpl(nextCss) + raw.slice(contentEnd);
  if (childCount !== undefined && !next.slice(marker, contentStart).includes("childCount")) {
    const pt = next.indexOf("previewType:", marker);
    const ptEnd = next.indexOf("\n", pt);
    // Match the entry's own indentation for the inserted field.
    const lineStart = next.lastIndexOf("\n", pt) + 1;
    const propIndent = /^[\t ]*/.exec(next.slice(lineStart, pt))![0];
    next = next.slice(0, ptEnd + 1) + `${propIndent}childCount: ${childCount},\n` + next.slice(ptEnd + 1);
  }
  fileText.set(loc.file, next);
}

/* ════════════════════════════════════════════════════════════════
   4. RUN — compute the new catalog, verify, (optionally) write
   ════════════════════════════════════════════════════════════════ */

let repaired = 0;
let guarded = 0;
let hoverWrapped = 0;
let untouched = 0;
const mixedHover: string[] = [];
const changedFiles = new Set<string>();
const perEffect: string[] = [];
/** id → [original, next, childCount] for every effect the run would change. */
const plan = new Map<string, [string, string, number | undefined]>();

for (const effect of effects) {
  const original = effect.cssCode;
  const repairedCss = REPAIRS[effect.id] ?? original;
  if (REPAIRS[effect.id]) repaired++;

  let css = repairedCss;
  if (effect.category === "hover") {
    const wrap = wrapHoverRules(css);
    css = wrap.css;
    hoverWrapped += wrap.wrapped;
    mixedHover.push(...wrap.skippedMixed.map((s) => `${effect.id}: ${s}`));
  }
  const guard = appendMotionGuard(css);
  css = guard.css;
  if (guard.selectors > 0) guarded++;

  const childCount = ADD_CHILD_COUNT[effect.id];
  if (css !== original || childCount !== undefined) {
    perEffect.push(`${effect.id}: ${original.length} -> ${css.length} chars${childCount !== undefined ? ` (+childCount:${childCount})` : ""}`);
    plan.set(effect.id, [original, css, childCount]);
    changedFiles.add(idLocations.get(effect.id)!.file);
  } else {
    untouched++;
  }
}

console.log(`Catalog: ${effects.length} effects across ${BATCH_FILES.length} batch files`);
console.log(`Repairs applied to cssCode: ${repaired}`);
console.log(`Effects changed overall: ${plan.size}`);
console.log(`  - reduced-motion guard appended: ${guarded}`);
console.log(`  - :hover rules wrapped in @media (hover: hover): ${hoverWrapped} rules`);
console.log(`Effects untouched: ${untouched}`);
console.log(`Files to write: ${changedFiles.size} ${APPLY ? "(WRITTEN)" : "(dry run — pass --apply)"}`);
if (mixedHover.length) {
  console.log(`\nMixed :hover selector lists left unwrapped (${mixedHover.length}):`);
  for (const s of mixedHover) console.log(`  ${s}`);
}
if (process.argv.includes("-v")) {
  console.log(`\nPer-effect changes:`);
  for (const line of perEffect) console.log(`  ${line}`);
}

if (APPLY) {
  // Pass 1 — verify every planned replacement against the on-disk literal.
  for (const [id, [original]] of plan) {
    const loc = idLocations.get(id)!;
    const raw = readFileSync(join(LIB_DIR, loc.file), "utf8");
    const marker = raw.indexOf(`id: "${id}"`);
    const cssStart = raw.indexOf("cssCode: `", marker);
    const contentStart = cssStart + "cssCode: `".length;
    const contentEnd = raw.indexOf("`", contentStart);
    if (cook(raw.slice(contentStart, contentEnd)) !== original) {
      throw new Error(`${id}: on-disk cssCode does not match the catalog value (stale run?)`);
    }
  }
  // Pass 2 — mutate in-memory copies and write.
  for (const [id, [original, next, childCount]] of plan) {
    replaceInFile(id, original, next, childCount);
  }
  for (const file of changedFiles) {
    writeFileSync(join(LIB_DIR, file), fileText.get(file)!, "utf8");
  }
  console.log(`\nVerified ${plan.size} replacements and wrote ${changedFiles.size} batch files.`);
}
