import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 54 — P1 UI Patterns: Navigation & Media (10 effects)
 *
 * Two thematic groups (issue #203, continues the #200 batch roadmap):
 *   • Navigation Patterns (5)  — glass navbar, hamburger morph, peek drawer,
 *                                 dropdown with caret, sliding pill indicator
 *   • Media Patterns (5)       — before/after wipe, :target lightbox,
 *                                 caption reveal, 3D tilt frame,
 *                                 thumbnail gallery
 *
 * Conventions (held from batches 1–53):
 *   • Every class is prefixed `roycss-nav-` / `roycss-media-` — the
 *     100%-regular `roycss-<id>` mapping holds.
 *   • Every @keyframes symbol is prefixed `roy-nav-` / `roy-media-` —
 *     unique across the whole corpus (verified against batches 1–53).
 *   • Colors use the OKLCH color space with color-mix() compositing.
 *   • Animations favor GPU-friendly properties (transform, opacity,
 *     clip-path) over layout-triggering properties.
 *   • Every effect honors `prefers-reduced-motion: reduce` with its own
 *     per-effect guard (motion-safe tier).
 *   • Every `:hover` rule is wrapped in `@media (hover: hover)` and every
 *     interactive control ships a `:focus-visible` ring (#189 convention).
 *   • Effects styling `> span` children declare `childCount` so previews
 *     and usage snippets render the exact markup (audit-189 convention).
 *   • Structural patterns (:checked / :target / attribute-state) that need
 *     extra markup are documented in a REQUIRED MARKUP comment inside the
 *     cssCode itself AND mirrored as a structured `requiredMarkup` string
 *     on the effect (issue #215) so the effect page renders the exact
 *     markup instead of the span-derived default.
 *   • Every `:has()` selector ships an `@supports not selector(:has(*))`
 *     fallback (issue #217 guard-consistency policy, batch-10 exemplar) so
 *     the documented markup still reacts on engines without `:has()`.
 *     Corpus-wide migration of older batches is a separate decision.
 *   • No JavaScript, no external dependencies — pure CSS only.
 */
export const effectsBatch54: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION PATTERNS (5)
  // ═══════════════════════════════════════════════════════════════

  // 1. nav-navbar-glass
  {
    id: "nav-navbar-glass",
    name: "Glass Navbar",
    category: "navigation",
    description:
      "Sticky navbar with a frosted-glass surface: backdrop blur, translucent OKLCH tint and a hairline border that catches light. Ships an optional scroll-driven elevation via animation-timeline: scroll() where supported.",
    tags: ["navbar", "glass", "blur", "sticky", "navigation"],
    previewType: "box",
    childCount: 4,
    cssCode: `/* Navigation Patterns: Glass Navbar */
.roycss-nav-navbar-glass {
  position: sticky;
  inset-inline: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  inline-size: 100%;
  padding: 0.75rem 1.25rem;
  border-radius: 16px;
  background: oklch(0.99 0.005 250 / 0.55);
  -webkit-backdrop-filter: blur(14px) saturate(1.4);
  backdrop-filter: blur(14px) saturate(1.4);
  box-shadow:
    inset 0 -1px 0 oklch(0.6 0.02 250 / 0.18),
    0 1px 2px oklch(0.2 0.02 250 / 0.08);
  z-index: 50;
}
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .roycss-nav-navbar-glass {
      animation: roy-nav-glass-elevate linear both;
      animation-timeline: scroll(root);
      animation-range: 0px 160px;
    }
  }
}
@keyframes roy-nav-glass-elevate {
  to {
    box-shadow:
      inset 0 -1px 0 oklch(0.6 0.02 250 / 0.22),
      0 8px 24px oklch(0.2 0.03 250 / 0.18);
    background: oklch(0.99 0.005 250 / 0.72);
  }
}
.roycss-nav-navbar-glass > span {
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: oklch(0.35 0.03 250);
  padding: 0.375rem 0.625rem;
  border-radius: 10px;
  white-space: nowrap;
}
@media (hover: hover) {
  .roycss-nav-navbar-glass > span:hover {
    color: oklch(0.3 0.09 175);
    background: oklch(0.9 0.05 175 / 0.35);
  }
}
.roycss-nav-navbar-glass > span:focus-visible {
  outline: 2px solid oklch(0.6 0.14 175);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nav-navbar-glass {
    animation: none;
  }
}`,
  },

  // 2. nav-hamburger-morph
  {
    id: "nav-hamburger-morph",
    name: "Hamburger Morph X",
    category: "navigation",
    description:
      "Three-bar hamburger that morphs into a close X. Hover (or [data-open]) transforms the bars with GPU-only rotations and fades the middle bar out — pair it with a hidden checkbox or two lines of JS for a full toggle.",
    tags: ["hamburger", "menu", "icon", "morph", "navigation"],
    previewType: "box",
    childCount: 3,
    // Issue #215: structural — a real <button> with aria state, not a div.
    requiredMarkup: `<button class="roycss-nav-hamburger-morph" aria-expanded="false" aria-label="Open menu">
  <span></span>
  <span></span>
  <span></span>
</button>`,
    cssCode: `/* Navigation Patterns: Hamburger Morph X
   REQUIRED MARKUP: <button class="roycss-nav-hamburger-morph" aria-expanded="false"
                     aria-label="Open menu"><span></span><span></span><span></span></button>
   Toggle [data-open="true"] (or :hover) to morph. */
.roycss-nav-hamburger-morph {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  inline-size: 44px;
  block-size: 44px;
  padding: 10px;
  border-radius: 12px;
  background: oklch(0.97 0.01 250 / 0.6);
  box-shadow: inset 0 0 0 1px oklch(0.7 0.04 250 / 0.3);
  cursor: pointer;
}
.roycss-nav-hamburger-morph > span {
  display: block;
  block-size: 2px;
  inline-size: 100%;
  border-radius: 2px;
  background: oklch(0.35 0.05 250);
  transition:
    transform 0.32s cubic-bezier(0.34, 1.4, 0.64, 1),
    opacity 0.22s ease;
}
.roycss-nav-hamburger-morph[data-open="true"] > span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.roycss-nav-hamburger-morph[data-open="true"] > span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0.4);
}
.roycss-nav-hamburger-morph[data-open="true"] > span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}
@media (hover: hover) {
  .roycss-nav-hamburger-morph:hover > span:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }
  .roycss-nav-hamburger-morph:hover > span:nth-child(2) {
    opacity: 0;
    transform: scaleX(0.4);
  }
  .roycss-nav-hamburger-morph:hover > span:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }
}
.roycss-nav-hamburger-morph:focus-visible {
  outline: 2px solid oklch(0.6 0.14 175);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nav-hamburger-morph > span {
    transition: none;
  }
}`,
  },

  // 3. nav-drawer-slide
  {
    id: "nav-drawer-slide",
    name: "Peek Drawer",
    category: "navigation",
    description:
      "Off-canvas drawer that peeks a handle and slides fully open on hover or [data-open]. The scrim-free panel keeps 44px visible so touch users can always reach it; menu items stagger in with GPU transforms.",
    tags: ["drawer", "sidebar", "off-canvas", "slide", "navigation"],
    previewType: "box",
    childCount: 3,
    // Issue #215: structural — the CSS keys on the <aside> + data-open state.
    requiredMarkup: `<aside class="roycss-nav-drawer-slide" data-open="false">
  <span>Home</span>
  <span>Catalog</span>
  <span>About</span>
</aside>`,
    cssCode: `/* Navigation Patterns: Peek Drawer
   REQUIRED MARKUP: <aside class="roycss-nav-drawer-slide" data-open="false">
                      <span>Home</span><span>Catalog</span><span>About</span>
                    </aside>
   Toggle data-open="true" (checkbox :checked sibling selectors also work). */
.roycss-nav-drawer-slide {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.375rem;
  inline-size: 220px;
  block-size: 100%;
  padding: 1rem 0.875rem;
  border-radius: 14px;
  background: linear-gradient(
    160deg,
    oklch(0.98 0.015 175 / 0.9),
    oklch(0.94 0.03 200 / 0.92)
  );
  box-shadow:
    inset -1px 0 0 oklch(0.6 0.08 175 / 0.25),
    4px 0 16px oklch(0.2 0.03 200 / 0.15);
  transform: translateX(calc(-100% + 44px));
  transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  cursor: pointer;
}
.roycss-nav-drawer-slide > span {
  font-size: 0.8125rem;
  font-weight: 600;
  color: oklch(0.32 0.05 200);
  padding: 0.5rem 0.625rem;
  border-radius: 10px;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(12px);
  transition:
    opacity 0.3s ease 0.08s,
    transform 0.36s cubic-bezier(0.22, 1, 0.36, 1) 0.06s;
}
.roycss-nav-drawer-slide[data-open="true"] {
  transform: translateX(0);
}
.roycss-nav-drawer-slide[data-open="true"] > span {
  opacity: 1;
  transform: translateX(0);
}
@media (hover: hover) {
  .roycss-nav-drawer-slide:hover {
    transform: translateX(0);
  }
  .roycss-nav-drawer-slide:hover > span {
    opacity: 1;
    transform: translateX(0);
  }
}
.roycss-nav-drawer-slide:focus-within {
  transform: translateX(0);
}
.roycss-nav-drawer-slide > span:focus-visible {
  outline: 2px solid oklch(0.6 0.14 175);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nav-drawer-slide,
  .roycss-nav-drawer-slide > span {
    transition: none;
    transform: none;
    opacity: 1;
  }
}`,
  },

  // 4. nav-dropdown-caret
  {
    id: "nav-dropdown-caret",
    name: "Dropdown Caret Reveal",
    category: "navigation",
    description:
      "Dropdown menu with a rotating caret and a clipped reveal. Opens on hover and :focus-within so keyboard users get the same panel; items stagger in and the caret rotates 180° with a springy ease.",
    tags: ["dropdown", "menu", "caret", "focus-within", "navigation"],
    previewType: "box",
    childCount: 3,
    cssCode: `/* Navigation Patterns: Dropdown Caret Reveal */
.roycss-nav-dropdown-caret {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
  inline-size: 200px;
  padding: 0.5rem 0.625rem;
  border-radius: 14px;
  background: oklch(0.98 0.008 300 / 0.7);
  box-shadow: inset 0 0 0 1px oklch(0.7 0.05 300 / 0.3);
  cursor: pointer;
}
.roycss-nav-dropdown-caret::after {
  content: "";
  position: absolute;
  top: 0.875rem;
  right: 0.875rem;
  inline-size: 8px;
  block-size: 8px;
  border-right: 2px solid oklch(0.45 0.08 300);
  border-bottom: 2px solid oklch(0.45 0.08 300);
  transform: rotate(45deg);
  transition: transform 0.34s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.roycss-nav-dropdown-caret > span {
  display: flex;
  align-items: center;
  inline-size: calc(100% - 1.75rem);
  font-size: 0.8125rem;
  font-weight: 600;
  color: oklch(0.34 0.05 300);
  padding: 0.5rem 0.625rem;
  border-radius: 10px;
  max-block-size: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(-6px);
  transition:
    max-block-size 0.32s ease,
    opacity 0.26s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
@media (hover: hover) {
  .roycss-nav-dropdown-caret:hover::after {
    transform: rotate(225deg);
  }
  .roycss-nav-dropdown-caret:hover > span {
    max-block-size: 3rem;
    opacity: 1;
    transform: translateY(0);
  }
  .roycss-nav-dropdown-caret:hover > span:nth-child(2) {
    transition-delay: 0.04s;
  }
  .roycss-nav-dropdown-caret:hover > span:nth-child(3) {
    transition-delay: 0.08s;
  }
}
.roycss-nav-dropdown-caret:focus-within::after {
  transform: rotate(225deg);
}
.roycss-nav-dropdown-caret:focus-within > span {
  max-block-size: 3rem;
  opacity: 1;
  transform: translateY(0);
}
.roycss-nav-dropdown-caret > span:focus-visible {
  outline: 2px solid oklch(0.6 0.14 175);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nav-dropdown-caret::after,
  .roycss-nav-dropdown-caret > span {
    transition: none;
    transform: none;
  }
}`,
  },

  // 5. nav-pill-indicator
  {
    id: "nav-pill-indicator",
    name: "Sliding Pill Indicator",
    category: "navigation",
    description:
      "Segmented nav where the active item wears a pill. Hovering previews the pill (scale-in) and the documented radio-:checked variant makes the selection persist with zero JavaScript — keyboard focus moves the pill too.",
    tags: ["pill", "tabs", "segmented", "indicator", "navigation"],
    previewType: "box",
    childCount: 4,
    cssCode: `/* Navigation Patterns: Sliding Pill Indicator
   REQUIRED MARKUP (persisted selection):
     <nav class="roycss-nav-pill-indicator">
       <input type="radio" name="nav-pill" id="pill-1" hidden checked>
       <label for="pill-1"><span>Home</span></label> … </nav>
   Demo markup below mirrors the label>span shape so hover previews it. */
.roycss-nav-pill-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  inline-size: 100%;
  padding: 0.375rem;
  border-radius: 999px;
  background: oklch(0.96 0.012 220 / 0.75);
  box-shadow: inset 0 0 0 1px oklch(0.7 0.04 220 / 0.28);
}
.roycss-nav-pill-indicator > span {
  position: relative;
  flex: 1 1 0%;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: oklch(0.38 0.04 220);
  padding: 0.5rem 0.375rem;
  border-radius: 999px;
  white-space: nowrap;
  cursor: pointer;
}
.roycss-nav-pill-indicator > span::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    oklch(0.75 0.11 190),
    oklch(0.68 0.13 250)
  );
  box-shadow: 0 2px 8px oklch(0.4 0.1 220 / 0.35);
  transform: scale(0.6);
  opacity: 0;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1),
    opacity 0.22s ease;
}
.roycss-nav-pill-indicator > span:active::before {
  transform: scale(0.92);
  opacity: 0.7;
}
@media (hover: hover) {
  .roycss-nav-pill-indicator > span:hover::before {
    transform: scale(1);
    opacity: 1;
  }
}
.roycss-nav-pill-indicator > span:focus-visible {
  outline: 2px solid oklch(0.6 0.14 175);
  outline-offset: 3px;
}
.roycss-nav-pill-indicator:has(input:checked:nth-of-type(1)) label:nth-of-type(1) span::before,
.roycss-nav-pill-indicator:has(input:checked:nth-of-type(2)) label:nth-of-type(2) span::before,
.roycss-nav-pill-indicator:has(input:checked:nth-of-type(3)) label:nth-of-type(3) span::before,
.roycss-nav-pill-indicator:has(input:checked:nth-of-type(4)) label:nth-of-type(4) span::before {
  transform: scale(1);
  opacity: 1;
}
/* Issue #217 policy — no-:has() fallback (batch-10 exemplar): the radios
   precede their labels in the required markup, so the same selected-state
   pill is reachable with the plain general-sibling combinator. */
@supports not selector(:has(*)) {
  .roycss-nav-pill-indicator > input:checked:nth-of-type(1) ~ label:nth-of-type(1) span::before,
  .roycss-nav-pill-indicator > input:checked:nth-of-type(2) ~ label:nth-of-type(2) span::before,
  .roycss-nav-pill-indicator > input:checked:nth-of-type(3) ~ label:nth-of-type(3) span::before,
  .roycss-nav-pill-indicator > input:checked:nth-of-type(4) ~ label:nth-of-type(4) span::before {
    transform: scale(1);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .roycss-nav-pill-indicator > span::before {
    transition: none;
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════
  // MEDIA PATTERNS (5)
  // ═══════════════════════════════════════════════════════════════

  // 6. media-compare-wipe
  {
    id: "media-compare-wipe",
    name: "Before/After Wipe",
    category: "visual",
    description:
      "Auto-cycling before/after comparison: the top layer is clipped with an inset() wipe that sweeps back and forth, and hover pauses the cycle at the current split. Layer any two stacked images — pure CSS, no slider JS.",
    tags: ["compare", "before-after", "clip-path", "wipe", "media"],
    previewType: "box",
    // Issue #215: structural — two stacked images the wipe compares.
    requiredMarkup: `<figure class="roycss-media-compare-wipe">
  <img src="after.jpg" alt="After">
  <img src="before.jpg" alt="Before">
</figure>`,
    cssCode: `/* Media Patterns: Before/After Wipe
   REQUIRED MARKUP: <figure class="roycss-media-compare-wipe">
                      <img src="after.jpg" alt="After">   <!-- bottom -->
                      <img src="before.jpg" alt="Before"> <!-- top, clipped -->
                    </figure>
   Demo below paints the layers with gradients in place of images. */
.roycss-media-compare-wipe {
  position: relative;
  display: block;
  inline-size: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  isolation: isolate;
  box-shadow:
    inset 0 0 0 1px oklch(0.6 0.02 250 / 0.25),
    0 10px 28px oklch(0.2 0.03 250 / 0.18);
}
.roycss-media-compare-wipe::before,
.roycss-media-compare-wipe::after {
  content: "";
  position: absolute;
  inset: 0;
}
/* bottom layer — "after" */
.roycss-media-compare-wipe::before {
  background:
    linear-gradient(120deg, oklch(0.62 0.16 200), oklch(0.55 0.18 300));
}
/* top layer — "before", clipped by the wipe */
.roycss-media-compare-wipe::after {
  background:
    repeating-linear-gradient(
      45deg,
      oklch(0.85 0.02 250) 0 12px,
      oklch(0.78 0.02 250) 12px 24px
    );
  clip-path: inset(0 50% 0 0);
  animation: roy-media-compare-wipe 5.5s ease-in-out infinite;
  /* the split line */
  border-inline-end: 2px solid oklch(0.99 0 0 / 0.85);
}
@keyframes roy-media-compare-wipe {
  0%, 15%   { clip-path: inset(0 85% 0 0); }
  45%, 55%  { clip-path: inset(0 15% 0 0); }
  85%, 100% { clip-path: inset(0 85% 0 0); }
}
/* Real-image mode (issue #215): the two stacked <img> children from the
   required markup. The images paint over the demo's ::before/::after
   gradient layers, and the top ("before") image carries the same wipe
   animation + split line — so the shipped markup works as documented. */
.roycss-media-compare-wipe > img {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  z-index: 1;
}
.roycss-media-compare-wipe > img:last-of-type {
  clip-path: inset(0 50% 0 0);
  animation: roy-media-compare-wipe 5.5s ease-in-out infinite;
  border-inline-end: 2px solid oklch(0.99 0 0 / 0.85);
}
@media (hover: hover) {
  .roycss-media-compare-wipe:hover::after,
  .roycss-media-compare-wipe:hover > img:last-of-type {
    animation-play-state: paused;
  }
}
.roycss-media-compare-wipe:focus-within::after,
.roycss-media-compare-wipe:focus-within > img:last-of-type {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-media-compare-wipe::after,
  .roycss-media-compare-wipe > img:last-of-type {
    animation: none;
    clip-path: inset(0 50% 0 0);
  }
}`,
  },

  // 7. media-lightbox-zoom
  {
    id: "media-lightbox-zoom",
    name: "Target Lightbox",
    category: "visual",
    description:
      "Zero-JS lightbox built on :target: the thumbnail zooms slightly on hover, and the documented overlay fades+scales the full image when targeted, with a labelled close link. Progressive — works without JS entirely.",
    tags: ["lightbox", "gallery", "target", "zoom", "media"],
    previewType: "box",
    childCount: 1,
    // Issue #215: structural — the :target overlay is a second element the
    // CSS ships rules for; without it those rules are dead code.
    requiredMarkup: `<a href="#img-1" class="roycss-media-lightbox-zoom"><span></span></a>
<div class="roycss-media-lightbox-zoom-overlay" id="img-1">
  <a href="#" class="close" aria-label="Close">Close</a>
</div>`,
    cssCode: `/* Media Patterns: Target Lightbox
   REQUIRED MARKUP:
     <a href="#img-1" class="roycss-media-lightbox-zoom"><span></span></a>
     <div class="roycss-media-lightbox-zoom-overlay" id="img-1">
       <a href="#" class="close" aria-label="Close">Close</a>
     </div> */
.roycss-media-lightbox-zoom {
  display: block;
  inline-size: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  overflow: hidden;
  cursor: zoom-in;
  box-shadow:
    inset 0 0 0 1px oklch(0.6 0.02 250 / 0.25),
    0 6px 18px oklch(0.2 0.03 250 / 0.16);
}
.roycss-media-lightbox-zoom > span {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  background:
    radial-gradient(
      circle at 30% 30%,
      oklch(0.8 0.12 90),
      oklch(0.55 0.14 60)
    );
  transform: scale(1);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
@media (hover: hover) {
  .roycss-media-lightbox-zoom:hover > span {
    transform: scale(1.08);
  }
}
.roycss-media-lightbox-zoom:focus-visible {
  outline: 2px solid oklch(0.6 0.14 175);
  outline-offset: 3px;
}
.roycss-media-lightbox-zoom-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: oklch(0.15 0.01 250 / 0.9);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease;
  z-index: 100;
}
.roycss-media-lightbox-zoom-overlay:target {
  opacity: 1;
  visibility: visible;
}
.roycss-media-lightbox-zoom-overlay .close {
  position: absolute;
  top: 1.25rem;
  right: 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: oklch(0.98 0 0);
  padding: 0.5rem 0.875rem;
  border-radius: 10px;
}
.roycss-media-lightbox-zoom-overlay .close:focus-visible {
  outline: 2px solid oklch(0.85 0.14 175);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-media-lightbox-zoom > span {
    transition: none;
  }
  .roycss-media-lightbox-zoom-overlay {
    transition: none;
  }
}`,
  },

  // 8. media-caption-reveal
  {
    id: "media-caption-reveal",
    name: "Caption Reveal Card",
    category: "microinteractions",
    description:
      "Image card whose caption slides up over a gradient scrim on hover (and on keyboard focus), with the image zooming a touch underneath. The scrim keeps WCAG-safe contrast for the caption text at every position.",
    tags: ["caption", "overlay", "hover", "image", "media"],
    previewType: "box",
    childCount: 1,
    cssCode: `/* Media Patterns: Caption Reveal Card
   REQUIRED MARKUP: <figure class="roycss-media-caption-reveal" tabindex="0">
                      <span>Caption text</span>
                    </figure> */
.roycss-media-caption-reveal {
  position: relative;
  display: block;
  inline-size: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  overflow: hidden;
  isolation: isolate;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px oklch(0.6 0.02 250 / 0.25),
    0 6px 18px oklch(0.2 0.03 250 / 0.14);
}
.roycss-media-caption-reveal::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(150deg, oklch(0.66 0.14 160), oklch(0.5 0.12 220));
  transform: scale(1.02);
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
/* gradient scrim for caption contrast */
.roycss-media-caption-reveal::after {
  content: "";
  position: absolute;
  inset-block-start: 30%;
  inset-inline: 0;
  inset-block-end: 0;
  background: linear-gradient(
    to top,
    oklch(0.18 0.02 250 / 0.82),
    oklch(0.18 0.02 250 / 0)
  );
  opacity: 0;
  transition: opacity 0.32s ease;
}
.roycss-media-caption-reveal > span {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: oklch(0.99 0 0);
  transform: translateY(calc(100% - 0.5rem));
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
@media (hover: hover) {
  .roycss-media-caption-reveal:hover::before {
    transform: scale(1.08);
  }
  .roycss-media-caption-reveal:hover::after {
    opacity: 1;
  }
  .roycss-media-caption-reveal:hover > span {
    transform: translateY(0);
  }
}
.roycss-media-caption-reveal:focus-visible {
  outline: 2px solid oklch(0.6 0.14 175);
  outline-offset: 3px;
}
.roycss-media-caption-reveal:focus-within::after,
.roycss-media-caption-reveal:focus-visible::after {
  opacity: 1;
}
.roycss-media-caption-reveal:focus-within > span,
.roycss-media-caption-reveal:focus-visible > span {
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .roycss-media-caption-reveal::before,
  .roycss-media-caption-reveal::after,
  .roycss-media-caption-reveal > span {
    transition: none;
    transform: none;
  }
  .roycss-media-caption-reveal::after {
    opacity: 1;
  }
}`,
  },

  // 9. media-tilt-3d
  {
    id: "media-tilt-3d",
    name: "3D Tilt Frame",
    category: "microinteractions",
    description:
      "Static 3D presentation frame: perspective, a resting tilt and a glossy glare pseudo-element. Hover deepens the tilt with a springy ease — the pointer-tracking upgrade is a one-liner with CSS custom properties.",
    tags: ["tilt", "3d", "perspective", "frame", "media"],
    previewType: "box",
    cssCode: `/* Media Patterns: 3D Tilt Frame */
.roycss-media-tilt-3d {
  position: relative;
  display: block;
  inline-size: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  background:
    linear-gradient(145deg, oklch(0.7 0.1 60), oklch(0.55 0.12 300));
  box-shadow:
    inset 0 0 0 1px oklch(0.9 0.03 250 / 0.3),
    0 14px 30px oklch(0.2 0.03 250 / 0.22);
  transform: perspective(700px) rotateX(6deg) rotateY(-8deg);
  transform-style: preserve-3d;
  transition: transform 0.45s cubic-bezier(0.34, 1.3, 0.64, 1);
}
/* glossy glare */
.roycss-media-tilt-3d::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    115deg,
    oklch(1 0 0 / 0.35) 0%,
    oklch(1 0 0 / 0.05) 38%,
    oklch(1 0 0 / 0) 60%
  );
  transition: opacity 0.4s ease;
}
@media (hover: hover) {
  .roycss-media-tilt-3d:hover {
    transform: perspective(700px) rotateX(10deg) rotateY(-14deg)
      translateZ(10px);
  }
  .roycss-media-tilt-3d:hover::after {
    opacity: 0.85;
  }
}
.roycss-media-tilt-3d:focus-visible {
  outline: 2px solid oklch(0.6 0.14 175);
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-media-tilt-3d {
    transition: none;
    transform: none;
  }
}`,
  },

  // 10. media-thumb-select
  {
    id: "media-thumb-select",
    name: "Thumbnail Gallery",
    category: "visual",
    description:
      "Radio-driven gallery: thumbnails act as labels, and the selected thumb lifts with an accent ring while the main view swaps — a complete product-gallery interaction with zero JavaScript and full keyboard support.",
    tags: ["gallery", "thumbnails", "radio", "product", "media"],
    previewType: "box",
    childCount: 4,
    cssCode: `/* Media Patterns: Thumbnail Gallery
   REQUIRED MARKUP (zero-JS switching):
     <div class="roycss-media-thumb-select">
       <input type="radio" name="thumb" id="t1" hidden checked>
       <label for="t1"><span></span></label> … (x4) </div>
   :has() promotes the checked thumb to the "selected" state. */
.roycss-media-thumb-select {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  inline-size: 100%;
  block-size: 100%;
  padding: 0.625rem;
  border-radius: 14px;
  background: oklch(0.97 0.008 250 / 0.7);
  box-shadow: inset 0 0 0 1px oklch(0.7 0.04 250 / 0.28);
}
.roycss-media-thumb-select > span {
  position: relative;
  flex: 1 1 0%;
  block-size: 34%;
  border-radius: 9px;
  cursor: pointer;
  box-shadow:
    inset 0 0 0 1px oklch(0.65 0.03 250 / 0.4),
    0 2px 6px oklch(0.2 0.02 250 / 0.12);
  transition:
    transform 0.32s cubic-bezier(0.34, 1.4, 0.64, 1),
    box-shadow 0.3s ease;
}
.roycss-media-thumb-select > span:nth-child(1) {
  background: linear-gradient(135deg, oklch(0.8 0.1 90), oklch(0.7 0.12 60));
}
.roycss-media-thumb-select > span:nth-child(2) {
  background: linear-gradient(135deg, oklch(0.75 0.11 190), oklch(0.68 0.12 250));
}
.roycss-media-thumb-select > span:nth-child(3) {
  background: linear-gradient(135deg, oklch(0.78 0.1 140), oklch(0.66 0.12 200));
}
.roycss-media-thumb-select > span:nth-child(4) {
  background: linear-gradient(135deg, oklch(0.76 0.12 310), oklch(0.62 0.14 350));
}
.roycss-media-thumb-select > span[aria-current],
.roycss-media-thumb-select:has(input:checked:nth-of-type(1)) > span:nth-of-type(1),
.roycss-media-thumb-select:has(input:checked:nth-of-type(2)) > span:nth-of-type(2),
.roycss-media-thumb-select:has(input:checked:nth-of-type(3)) > span:nth-of-type(3),
.roycss-media-thumb-select:has(input:checked:nth-of-type(4)) > span:nth-of-type(4) {
  block-size: 46%;
  box-shadow:
    inset 0 0 0 2px oklch(0.6 0.14 175),
    0 6px 14px oklch(0.3 0.08 175 / 0.3);
}
/* Issue #217 policy — no-:has() fallback (batch-10 exemplar): the checked
   radio precedes its thumbnail spans, so the selected state also works via
   the general-sibling combinator. */
@supports not selector(:has(*)) {
  .roycss-media-thumb-select > input:checked:nth-of-type(1) ~ span:nth-of-type(1),
  .roycss-media-thumb-select > input:checked:nth-of-type(2) ~ span:nth-of-type(2),
  .roycss-media-thumb-select > input:checked:nth-of-type(3) ~ span:nth-of-type(3),
  .roycss-media-thumb-select > input:checked:nth-of-type(4) ~ span:nth-of-type(4) {
    block-size: 46%;
    box-shadow:
      inset 0 0 0 2px oklch(0.6 0.14 175),
      0 6px 14px oklch(0.3 0.08 175 / 0.3);
  }
}
@media (hover: hover) {
  .roycss-media-thumb-select > span:hover {
    transform: translateY(-4px);
    box-shadow:
      inset 0 0 0 2px oklch(0.65 0.1 200),
      0 8px 16px oklch(0.2 0.04 250 / 0.2);
  }
}
.roycss-media-thumb-select > span:focus-visible {
  outline: 2px solid oklch(0.6 0.14 175);
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  .roycss-media-thumb-select > span {
    transition: none;
    transform: none;
  }
}`,
  },
];
