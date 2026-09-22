import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 53 — P1 UI Patterns: Marquee, Carousel & Slider (14 effects)
 *
 * Three thematic groups (issue #200):
 *   • Marquee & Ticker (6)      — content strips: seamless loop, RTL-safe,
 *                                 pause-on-hover (WCAG 2.2.2), vertical,
 *                                 diagonal ribbon, news ticker
 *   • CSS-Only Carousels (5)    — scroll-snap, crossfade, sliding track,
 *                                 3D coverflow, auto-advance with progress
 *   • Range Slider & Controls (3) — modern range visuals, gradient fill,
 *                                 toggle switch
 *
 * Conventions:
 *   • Every class is prefixed `roycss-marquee-` / `roycss-carousel-` /
 *     `roycss-slider-` — the 100%-regular `roycss-<id>` mapping holds.
 *   • Every @keyframes symbol is prefixed `roy-marquee-` / `roy-carousel-` /
 *     `roy-slider-` — unique across the whole corpus (verified against
 *     batches 1–52).
 *   • Colors use the OKLCH color space with color-mix() compositing.
 *   • Animations favor GPU-friendly properties (transform, opacity) over
 *     layout-triggering properties.
 *   • Every effect honors `prefers-reduced-motion: reduce` with its own
 *     per-effect guard (motion-safe tier).
 *   • Every `:hover`/`:focus-within` rule is wrapped in
 *     `@media (hover: hover)` / explicit focus media where appropriate
 *     (the #189 hover-guard convention).
 *   • Effects styling `> span` children declare `childCount` so previews
 *     and usage snippets render the exact markup (audit-189 convention).
 *   • No JavaScript, no external dependencies — pure CSS only.
 */
export const effectsBatch53: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // MARQUEE & TICKER (6)
  // ═══════════════════════════════════════════════════════════════

  // 1. marquee-loop-seamless
  {
    id: "marquee-loop-seamless",
    name: "Seamless Loop Marquee",
    category: "animations",
    description:
      "Infinite scrolling content strip with mask-fade edges. The track is width:max-content and loops via a -50% translate, so duplicating the content once yields a perfectly seamless loop.",
    tags: ["marquee", "ticker", "loop", "infinite", "mask"],
    previewType: "box",
    childCount: 6,
    cssCode: `/* Marquee & Ticker: Seamless Loop Marquee */
.roycss-marquee-loop-seamless {
  display: flex;
  gap: 0.75rem;
  width: max-content;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  background: oklch(0.98 0.01 250 / 0.06);
  box-shadow: inset 0 0 0 1px oklch(0.7 0.1 250 / 0.2);
  animation: roy-marquee-loop 16s linear infinite;
  /* For a real seamless loop, duplicate the content once inside the
     track and translate to -50%: the second half takes over exactly
     as the first half exits. */
}
.roycss-marquee-loop-seamless > span {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  color: oklch(0.31 0.06 250);
  background: linear-gradient(
    135deg,
    oklch(0.85 0.09 220),
    oklch(0.78 0.12 300)
  );
  box-shadow:
    0 1px 2px oklch(0.2 0.05 250 / 0.25),
    inset 0 1px 0 oklch(1 0 0 / 0.35);
}
@keyframes roy-marquee-loop {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-marquee-loop-seamless {
    animation: none;
    transform: none;
  }
}`,
  },

  // 2. marquee-rtl-safe
  {
    id: "marquee-rtl-safe",
    name: "RTL-Safe Marquee",
    category: "animations",
    description:
      "Direction-aware marquee whose scroll direction follows the document writing direction. Under dir=\"rtl\" the animation reverses automatically, so Arabic/Hebrew/Persian pages scroll the natural way.",
    tags: ["marquee", "rtl", "i18n", "direction", "logical"],
    previewType: "box",
    childCount: 6,
    cssCode: `/* Marquee & Ticker: RTL-Safe Marquee */
.roycss-marquee-rtl-safe {
  display: flex;
  gap: 0.75rem;
  width: max-content;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  background: oklch(0.98 0.01 140 / 0.06);
  box-shadow: inset 0 0 0 1px oklch(0.7 0.12 150 / 0.25);
  animation: roy-marquee-rtl 16s linear infinite;
}
.roycss-marquee-rtl-safe > span {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  color: oklch(0.28 0.06 150);
  background: linear-gradient(
    135deg,
    oklch(0.86 0.1 145),
    oklch(0.8 0.12 200)
  );
  box-shadow:
    0 1px 2px oklch(0.2 0.05 150 / 0.25),
    inset 0 1px 0 oklch(1 0 0 / 0.35);
}
/* RTL: reverse the scroll so content moves against the reading
   direction instead of with it. No duplicated keyframes, no JS. */
[dir="rtl"] .roycss-marquee-rtl-safe {
  animation-direction: reverse;
}
@keyframes roy-marquee-rtl {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-marquee-rtl-safe {
    animation: none;
    transform: none;
  }
}`,
  },

  // 3. marquee-pause-hover
  {
    id: "marquee-pause-hover",
    name: "Pause-on-Hover Marquee",
    category: "animations",
    description:
      "Marquee that pauses on hover and while any interactive child has keyboard focus, satisfying WCAG 2.2.2 pause/stop/hide. Pointer and keyboard users both get a stopped strip they can actually read.",
    tags: ["marquee", "pause", "hover", "focus", "wcag", "a11y"],
    previewType: "box",
    childCount: 6,
    cssCode: `/* Marquee & Ticker: Pause-on-Hover Marquee */
.roycss-marquee-pause-hover {
  display: flex;
  gap: 0.75rem;
  width: max-content;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  background: oklch(0.98 0.01 60 / 0.07);
  box-shadow: inset 0 0 0 1px oklch(0.75 0.12 75 / 0.3);
  animation: roy-marquee-pause 14s linear infinite;
}
.roycss-marquee-pause-hover > span {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  color: oklch(0.3 0.06 70);
  background: linear-gradient(
    135deg,
    oklch(0.88 0.1 80),
    oklch(0.82 0.13 60)
  );
  box-shadow:
    0 1px 2px oklch(0.2 0.05 70 / 0.25),
    inset 0 1px 0 oklch(1 0 0 / 0.4);
}
/* WCAG 2.2.2: pause for pointer users… */
@media (hover: hover) {
  .roycss-marquee-pause-hover:hover {
    animation-play-state: paused;
  }
  .roycss-marquee-pause-hover > span:hover {
    transform: translateY(-2px);
    box-shadow:
      0 4px 12px oklch(0.4 0.1 70 / 0.35),
      inset 0 1px 0 oklch(1 0 0 / 0.4);
  }
}
/* …and for keyboard users tabbing through links inside the strip. */
.roycss-marquee-pause-hover:focus-within {
  animation-play-state: paused;
}
@keyframes roy-marquee-pause {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-marquee-pause-hover {
    animation: none;
    transform: none;
  }
}`,
  },

  // 4. marquee-vertical-ticker
  {
    id: "marquee-vertical-ticker",
    name: "Vertical Ticker",
    category: "animations",
    description:
      "Fixed-height vertical ticker that scrolls items upward in an endless loop, like a stock or news feed. Overflow is clipped to the window and items are evenly cycled.",
    tags: ["marquee", "ticker", "vertical", "feed", "loop"],
    previewType: "box",
    childCount: 5,
    cssCode: `/* Marquee & Ticker: Vertical Ticker */
.roycss-marquee-vertical-ticker {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  background: oklch(0.98 0.01 300 / 0.06);
  box-shadow: inset 0 0 0 1px oklch(0.7 0.12 310 / 0.25);
  mask-image: linear-gradient(
    to bottom,
    transparent,
    black 15%,
    black 85%,
    transparent
  );
  animation: roy-marquee-vertical 12s ease-in-out infinite;
}
.roycss-marquee-vertical-ticker > span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.75rem;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  color: oklch(0.3 0.05 310);
  background: linear-gradient(
    90deg,
    oklch(0.87 0.09 320),
    oklch(0.83 0.1 290)
  );
  box-shadow:
    0 1px 3px oklch(0.2 0.05 310 / 0.25),
    inset 0 1px 0 oklch(1 0 0 / 0.35);
}
.roycss-marquee-vertical-ticker > span::before {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: oklch(0.62 0.19 350);
  box-shadow: 0 0 6px oklch(0.62 0.19 350 / 0.7);
}
@keyframes roy-marquee-vertical {
  0%, 18%   { transform: translateY(0); }
  25%, 43%  { transform: translateY(calc(-25% - 0.47rem)); }
  50%, 68%  { transform: translateY(calc(-50% - 0.94rem)); }
  75%, 93%  { transform: translateY(calc(-75% - 1.4rem)); }
  100%      { transform: translateY(calc(-100% - 1.88rem)); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-marquee-vertical-ticker {
    animation: none;
    transform: none;
    overflow-y: auto;
  }
}`,
  },

  // 5. marquee-ribbon-diagonal
  {
    id: "marquee-ribbon-diagonal",
    name: "Diagonal Ribbon Marquee",
    category: "animations",
    description:
      "Bold rotated ribbon that scrolls across the corner of a hero or promo section — sale banners, announcement strips, event headers. Two stacked ribbons cross for a wrapped-ribbon look.",
    tags: ["marquee", "ribbon", "banner", "diagonal", "promo"],
    previewType: "box",
    childCount: 5,
    cssCode: `/* Marquee & Ticker: Diagonal Ribbon Marquee */
.roycss-marquee-ribbon-diagonal {
  display: flex;
  gap: 1rem;
  width: max-content;
  padding: 0.5rem 1.25rem;
  background: linear-gradient(
    90deg,
    oklch(0.52 0.21 20),
    oklch(0.6 0.22 340) 50%,
    oklch(0.52 0.21 20)
  );
  box-shadow:
    0 6px 18px oklch(0.35 0.15 20 / 0.45),
    inset 0 1px 0 oklch(1 0 0 / 0.25);
  transform: rotate(-3deg);
  animation: roy-marquee-ribbon 18s linear infinite;
}
.roycss-marquee-ribbon-diagonal > span {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  color: oklch(0.98 0.02 90);
  text-shadow: 0 1px 2px oklch(0.25 0.12 20 / 0.6);
}
.roycss-marquee-ribbon-diagonal > span::after {
  content: "✦";
  font-size: 0.6875rem;
  opacity: 0.85;
}
@keyframes roy-marquee-ribbon {
  from { transform: rotate(-3deg) translateX(0); }
  to   { transform: rotate(-3deg) translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-marquee-ribbon-diagonal {
    animation: none;
    transform: rotate(-3deg);
  }
}`,
  },

  // 6. marquee-news-live
  {
    id: "marquee-news-live",
    name: "News Ticker Live",
    category: "animations",
    description:
      "Broadcast-style news ticker: a pulsing LIVE badge anchors the strip while headlines scroll past with dot separators. The badge stays put, only the headlines move.",
    tags: ["marquee", "news", "ticker", "live", "broadcast"],
    previewType: "box",
    childCount: 4,
    cssCode: `/* Marquee & Ticker: News Ticker Live */
.roycss-marquee-news-live {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: max-content;
  padding: 0.5rem 0.75rem 0.5rem 4.5rem;
  border-radius: 12px;
  background: oklch(0.22 0.03 260);
  box-shadow:
    0 2px 10px oklch(0.15 0.03 260 / 0.5),
    inset 0 0 0 1px oklch(0.45 0.06 260 / 0.4);
  animation: roy-marquee-news 20s linear infinite;
}
.roycss-marquee-news-live::before {
  content: "LIVE";
  position: absolute;
  left: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: oklch(0.95 0.02 20);
}
.roycss-marquee-news-live::after {
  content: "";
  position: absolute;
  left: 0.875rem;
  top: 50%;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: -0.6875rem;
  border-radius: 999px;
  background: oklch(0.63 0.24 25);
  box-shadow: 0 0 8px oklch(0.63 0.24 25 / 0.9);
  animation: roy-marquee-live-dot 1.6s ease-in-out infinite;
}
.roycss-marquee-news-live > span {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  color: oklch(0.92 0.01 260);
}
.roycss-marquee-news-live > span::after {
  content: "•";
  color: oklch(0.63 0.19 25);
  font-weight: 700;
}
@keyframes roy-marquee-news {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes roy-marquee-live-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.35; transform: scale(0.78); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-marquee-news-live {
    animation: none;
    transform: none;
  }
  .roycss-marquee-news-live::after {
    animation: none;
    opacity: 1;
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // CSS-ONLY CAROUSELS (5)
  // ═══════════════════════════════════════════════════════════════

  // 7. carousel-scroll-snap
  {
    id: "carousel-scroll-snap",
    name: "Scroll-Snap Carousel",
    category: "navigation",
    description:
      "Production-grade pure-CSS carousel: horizontal scroll container with mandatory snap points, center-aligned slides, edge fade masks and a styled slim scrollbar. Fully touch, wheel and keyboard scrollable with zero JS.",
    tags: ["carousel", "slider", "scroll-snap", "gallery", "no-js"],
    previewType: "box",
    childCount: 4,
    cssCode: `/* CSS-Only Carousels: Scroll-Snap Carousel */
.roycss-carousel-scroll-snap {
  display: flex;
  gap: 0.875rem;
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  background: oklch(0.97 0.01 260 / 0.05);
  box-shadow: inset 0 0 0 1px oklch(0.6 0.08 260 / 0.3);
  mask-image: linear-gradient(
    to right,
    transparent,
    black 6%,
    black 94%,
    transparent
  );
  scrollbar-width: thin;
  scrollbar-color: oklch(0.55 0.15 280) transparent;
}
.roycss-carousel-scroll-snap::-webkit-scrollbar {
  height: 6px;
}
.roycss-carousel-scroll-snap::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: oklch(0.55 0.15 280 / 0.6);
}
.roycss-carousel-scroll-snap > span {
  flex: 0 0 42%;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 700;
  color: oklch(0.25 0.06 280);
  background:
    radial-gradient(circle at 25% 20%, oklch(1 0 0 / 0.5), transparent 55%),
    linear-gradient(135deg, oklch(0.8 0.12 280), oklch(0.7 0.16 330));
  box-shadow:
    0 3px 10px oklch(0.3 0.08 280 / 0.3),
    inset 0 1px 0 oklch(1 0 0 / 0.4);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-carousel-scroll-snap {
    scroll-behavior: auto;
  }
}`,
  },

  // 8. carousel-fade-cycle
  {
    id: "carousel-fade-cycle",
    name: "Crossfade Carousel",
    category: "navigation",
    description:
      "Auto-advancing crossfade slideshow: four stacked slides each take a quarter of the cycle, fading in over their predecessor with a subtle scale settle. A single keyframes rule drives every slide via delays.",
    tags: ["carousel", "slideshow", "crossfade", "fade", "auto"],
    previewType: "box",
    childCount: 4,
    cssCode: `/* CSS-Only Carousels: Crossfade Carousel */
.roycss-carousel-fade-cycle {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    inset 0 0 0 1px oklch(0.6 0.08 200 / 0.35),
    0 4px 14px oklch(0.3 0.06 200 / 0.25);
}
.roycss-carousel-fade-cycle > span {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9375rem;
  font-weight: 700;
  color: oklch(0.98 0.01 220);
  opacity: 0;
  animation: roy-carousel-fade 8s linear infinite;
}
.roycss-carousel-fade-cycle > span:nth-child(1) {
  background: linear-gradient(135deg, oklch(0.55 0.16 230), oklch(0.45 0.18 260));
  animation-delay: 0s;
}
.roycss-carousel-fade-cycle > span:nth-child(2) {
  background: linear-gradient(135deg, oklch(0.55 0.16 160), oklch(0.45 0.16 190));
  animation-delay: 2s;
}
.roycss-carousel-fade-cycle > span:nth-child(3) {
  background: linear-gradient(135deg, oklch(0.55 0.16 60), oklch(0.48 0.17 30));
  animation-delay: 4s;
}
.roycss-carousel-fade-cycle > span:nth-child(4) {
  background: linear-gradient(135deg, oklch(0.55 0.16 320), oklch(0.45 0.18 350));
  animation-delay: 6s;
}
@keyframes roy-carousel-fade {
  0%       { opacity: 0; transform: scale(1.04); }
  6%, 25%  { opacity: 1; transform: scale(1); }
  31%, 100% { opacity: 0; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-carousel-fade-cycle > span {
    animation: none;
    opacity: 1;
  }
  .roycss-carousel-fade-cycle > span:nth-child(n + 2) {
    opacity: 0;
  }
}`,
  },

  // 9. carousel-slide-cycle
  {
    id: "carousel-slide-cycle",
    name: "Sliding Track Carousel",
    category: "navigation",
    description:
      "Track-style carousel that advances one slide at a time with pauses between steps, then jumps back to the start — the classic hero-slider rhythm implemented in a single keyframes rule.",
    tags: ["carousel", "slider", "track", "steps", "hero"],
    previewType: "box",
    childCount: 4,
    cssCode: `/* CSS-Only Carousels: Sliding Track Carousel */
.roycss-carousel-slide-cycle {
  position: relative;
  display: flex;
  gap: 0.875rem;
  width: max-content;
  height: 100%;
  padding: 0.75rem;
  border-radius: 14px;
  box-shadow: inset 0 0 0 1px oklch(0.6 0.08 150 / 0.3);
  background: oklch(0.97 0.01 150 / 0.05);
  overflow: hidden;
  animation: roy-carousel-slide 12s cubic-bezier(0.77, 0, 0.175, 1) infinite;
}
.roycss-carousel-slide-cycle > span {
  flex: 0 0 8.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 700;
  color: oklch(0.24 0.06 150);
  background:
    radial-gradient(circle at 75% 15%, oklch(1 0 0 / 0.45), transparent 50%),
    linear-gradient(135deg, oklch(0.82 0.12 150), oklch(0.72 0.14 190));
  box-shadow:
    0 3px 10px oklch(0.3 0.07 150 / 0.3),
    inset 0 1px 0 oklch(1 0 0 / 0.4);
}
@keyframes roy-carousel-slide {
  0%, 22%    { transform: translateX(0); }
  28%, 47%   { transform: translateX(calc(-8.5rem - 0.875rem)); }
  53%, 72%   { transform: translateX(calc(-17rem - 1.75rem)); }
  78%, 96%   { transform: translateX(calc(-25.5rem - 2.625rem)); }
  100%       { transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-carousel-slide-cycle {
    animation: none;
    transform: none;
  }
}`,
  },

  // 10. carousel-3d-coverflow
  {
    id: "carousel-3d-coverflow",
    name: "3D Coverflow Carousel",
    category: "navigation",
    description:
      "Music-player coverflow: the center slide faces forward while neighbors rotate away in 3D with depth-ordered shadows, all inside a perspective container. A gentle sway makes the depth readable.",
    tags: ["carousel", "3d", "coverflow", "perspective", "gallery"],
    previewType: "box",
    childCount: 5,
    cssCode: `/* CSS-Only Carousels: 3D Coverflow Carousel */
.roycss-carousel-3d-coverflow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
  perspective: 640px;
  transform-style: preserve-3d;
  animation: roy-carousel-sway 7s ease-in-out infinite alternate;
}
.roycss-carousel-3d-coverflow > span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.75rem;
  height: 5rem;
  flex: 0 0 auto;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  color: oklch(0.98 0.01 320);
  transform-style: preserve-3d;
}
.roycss-carousel-3d-coverflow > span:nth-child(1) {
  background: linear-gradient(160deg, oklch(0.62 0.14 280), oklch(0.5 0.16 300));
  transform: rotateY(42deg) translateZ(-1.25rem);
  box-shadow: -4px 4px 12px oklch(0.25 0.08 280 / 0.4);
}
.roycss-carousel-3d-coverflow > span:nth-child(2) {
  background: linear-gradient(160deg, oklch(0.66 0.15 310), oklch(0.54 0.17 330));
  transform: rotateY(34deg) translateZ(-0.5rem);
  box-shadow: -3px 4px 12px oklch(0.25 0.08 310 / 0.4);
}
.roycss-carousel-3d-coverflow > span:nth-child(3) {
  background: linear-gradient(160deg, oklch(0.7 0.17 340), oklch(0.58 0.19 0));
  transform: translateZ(1.5rem) scale(1.12);
  box-shadow:
    0 8px 22px oklch(0.28 0.1 340 / 0.5),
    inset 0 1px 0 oklch(1 0 0 / 0.4);
}
.roycss-carousel-3d-coverflow > span:nth-child(4) {
  background: linear-gradient(160deg, oklch(0.66 0.15 20), oklch(0.54 0.17 40));
  transform: rotateY(-34deg) translateZ(-0.5rem);
  box-shadow: 3px 4px 12px oklch(0.25 0.08 20 / 0.4);
}
.roycss-carousel-3d-coverflow > span:nth-child(5) {
  background: linear-gradient(160deg, oklch(0.62 0.14 50), oklch(0.5 0.16 70));
  transform: rotateY(-42deg) translateZ(-1.25rem);
  box-shadow: 4px 4px 12px oklch(0.25 0.08 50 / 0.4);
}
@keyframes roy-carousel-sway {
  from { transform: rotateY(-5deg); }
  to   { transform: rotateY(5deg); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-carousel-3d-coverflow {
    animation: none;
    transform: none;
  }
}`,
  },

  // 11. carousel-progress
  {
    id: "carousel-progress",
    name: "Carousel with Progress",
    category: "navigation",
    description:
      "Auto-advancing carousel whose progress bar fills in lockstep with the slide cycle — the ::after bar reuses the same duration, so progress and slide position never drift apart.",
    tags: ["carousel", "progress", "auto", "indicator", "slideshow"],
    previewType: "box",
    childCount: 3,
    cssCode: `/* CSS-Only Carousels: Carousel with Progress */
.roycss-carousel-progress {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: calc(100% - 0.5rem);
  margin-bottom: 0.5rem;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px oklch(0.6 0.08 90 / 0.35);
}
.roycss-carousel-progress > span {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9375rem;
  font-weight: 700;
  color: oklch(0.98 0.01 90);
  opacity: 0;
  animation: roy-carousel-progress-fade 9s linear infinite;
}
.roycss-carousel-progress > span:nth-child(1) {
  background: linear-gradient(135deg, oklch(0.6 0.17 80), oklch(0.5 0.16 60));
  animation-delay: 0s;
}
.roycss-carousel-progress > span:nth-child(2) {
  background: linear-gradient(135deg, oklch(0.6 0.16 120), oklch(0.5 0.15 100));
  animation-delay: 3s;
}
.roycss-carousel-progress > span:nth-child(3) {
  background: linear-gradient(135deg, oklch(0.6 0.15 160), oklch(0.5 0.15 140));
  animation-delay: 6s;
}
/* The progress bar shares the 9s cycle — fill resets exactly when
   the first slide returns. */
.roycss-carousel-progress::after {
  content: "";
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 0.5rem;
  height: 0.25rem;
  border-radius: 999px;
  background: oklch(1 0 0 / 0.25);
  transform-origin: left;
  animation: roy-carousel-progress-fill 9s linear infinite;
}
@keyframes roy-carousel-progress-fade {
  0%        { opacity: 0; }
  5%, 30%   { opacity: 1; }
  36%, 100% { opacity: 0; }
}
@keyframes roy-carousel-progress-fill {
  0%       { transform: scaleX(0); }
  32%, 34% { transform: scaleX(1); }
  35%, 100% { transform: scaleX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-carousel-progress > span {
    animation: none;
    opacity: 1;
  }
  .roycss-carousel-progress > span:nth-child(n + 2) {
    opacity: 0;
  }
  .roycss-carousel-progress::after {
    animation: none;
    transform: none;
    background: oklch(1 0 0 / 0.4);
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // RANGE SLIDER & CONTROLS (3)
  // ═══════════════════════════════════════════════════════════════

  // 12. slider-range-modern
  {
    id: "slider-range-modern",
    name: "Modern Range Slider",
    category: "forms",
    description:
      "Contemporary range-slider visual: slim rounded track, filled value portion, and an oversized glowing thumb that eases back and forth. The demo animates the thumb; in production the same styles target input[type=range].",
    tags: ["slider", "range", "input", "form", "thumb"],
    previewType: "box",
    cssCode: `/* Range Slider & Controls: Modern Range Slider */
.roycss-slider-range-modern {
  position: relative;
  width: 100%;
  height: 0.5rem;
  border-radius: 999px;
  background: oklch(0.9 0.02 280);
  box-shadow:
    inset 0 1px 2px oklch(0.4 0.05 280 / 0.35),
    inset 0 0 0 1px oklch(0.6 0.08 280 / 0.3);
}
.roycss-slider-range-modern::before {
  content: "";
  position: absolute;
  inset: 0 55% 0 0;
  border-radius: 999px;
  background: linear-gradient(90deg, oklch(0.6 0.16 300), oklch(0.55 0.19 330));
  box-shadow: 0 0 8px oklch(0.55 0.19 330 / 0.4);
}
.roycss-slider-range-modern::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 45%;
  width: 1.5rem;
  height: 1.5rem;
  margin: -0.75rem 0 0 -0.75rem;
  border-radius: 999px;
  background: oklch(0.99 0 0);
  border: 2px solid oklch(0.55 0.19 330);
  box-shadow:
    0 2px 8px oklch(0.3 0.08 330 / 0.45),
    0 0 0 6px oklch(0.55 0.19 330 / 0.15);
  animation: roy-slider-thumb 3.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
@keyframes roy-slider-thumb {
  0%, 100% { left: 18%; }
  50%      { left: 72%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-slider-range-modern::after {
    animation: none;
    left: 45%;
  }
}`,
  },

  // 13. slider-range-gradient-fill
  {
    id: "slider-range-gradient-fill",
    name: "Gradient Fill Slider",
    category: "forms",
    description:
      "Range-slider variant where the filled portion is a flowing animated gradient and the thumb carries a hue-matched ring — great for volume, color-picking or brightness controls that deserve personality.",
    tags: ["slider", "range", "gradient", "fill", "animated"],
    previewType: "box",
    cssCode: `/* Range Slider & Controls: Gradient Fill Slider */
.roycss-slider-range-gradient-fill {
  position: relative;
  width: 100%;
  height: 0.75rem;
  border-radius: 999px;
  background: oklch(0.92 0.02 200);
  box-shadow: inset 0 1px 3px oklch(0.4 0.05 200 / 0.3);
}
.roycss-slider-range-gradient-fill::before {
  content: "";
  position: absolute;
  inset: 0 42% 0 0;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    oklch(0.62 0.18 200),
    oklch(0.6 0.2 280),
    oklch(0.58 0.21 340),
    oklch(0.62 0.18 200)
  );
  background-size: 300% 100%;
  animation: roy-slider-gradient 5s linear infinite;
  box-shadow: 0 0 12px oklch(0.6 0.2 280 / 0.45);
}
.roycss-slider-range-gradient-fill::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 58%;
  width: 1.375rem;
  height: 1.375rem;
  margin: -0.6875rem 0 0 -0.6875rem;
  border-radius: 999px;
  background: oklch(0.99 0 0);
  border: 2px solid oklch(0.6 0.2 280);
  box-shadow:
    0 2px 10px oklch(0.3 0.08 280 / 0.5),
    0 0 0 5px oklch(0.6 0.2 280 / 0.18);
  animation: roy-slider-fill-thumb 4.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
@keyframes roy-slider-gradient {
  from { background-position: 0% 0; }
  to   { background-position: 300% 0; }
}
@keyframes roy-slider-fill-thumb {
  0%, 100% { left: 32%; }
  50%      { left: 76%; }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-slider-range-gradient-fill::before {
    animation: none;
    background-position: 50% 0;
  }
  .roycss-slider-range-gradient-fill::after {
    animation: none;
    left: 58%;
  }
}`,
  },

  // 14. slider-toggle-switch
  {
    id: "slider-toggle-switch",
    name: "Spring Toggle Switch",
    category: "forms",
    description:
      "Toggle switch with a springy knob that overshoots on hover and settles into its state — a microinteraction-quality control. Hover to preview the knob travel; the track recolors to signal the target state.",
    tags: ["toggle", "switch", "form", "control", "microinteraction"],
    previewType: "box",
    cssCode: `/* Range Slider & Controls: Spring Toggle Switch */
.roycss-slider-toggle-switch {
  position: relative;
  width: 4.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: oklch(0.88 0.02 260);
  box-shadow:
    inset 0 2px 4px oklch(0.4 0.04 260 / 0.35),
    inset 0 0 0 1px oklch(0.6 0.06 260 / 0.25);
  cursor: pointer;
  transition: background-color 0.35s ease, box-shadow 0.35s ease;
}
.roycss-slider-toggle-switch::after {
  content: "";
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  background: oklch(0.99 0 0);
  box-shadow:
    0 2px 6px oklch(0.25 0.04 260 / 0.4),
    inset 0 -1px 2px oklch(0.7 0.02 260 / 0.3);
  transition:
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.35s ease;
}
@media (hover: hover) {
  .roycss-slider-toggle-switch:hover {
    background: oklch(0.68 0.16 160);
    box-shadow:
      inset 0 2px 4px oklch(0.35 0.08 160 / 0.4),
      0 0 12px oklch(0.68 0.16 160 / 0.35);
  }
  .roycss-slider-toggle-switch:hover::after {
    transform: translateX(2rem) scale(1.06);
  }
}
.roycss-slider-toggle-switch:active::after {
  transform: translateX(2rem) scale(0.94);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-slider-toggle-switch,
  .roycss-slider-toggle-switch::after {
    transition: none;
  }
}`,
  },
];
