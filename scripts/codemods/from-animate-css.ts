/**
 * from-animate-css.ts — inbound codemod (PF-015, issue #95)
 *
 * Animate.css classes (`animate__fadeIn`, …) → RoyCSS animation classes.
 *
 * Every mapped target exists in the RoyCSS animations catalog. Directional
 * semantics are preserved 1:1 — note the deliberate cross-over: Animate.css
 * names the *direction of travel into view* (`slideInUp` enters from the
 * bottom), while RoyCSS names the *edge the element comes from*
 * (`roycss-slide-in-bottom` enters from the bottom). Variants with no RoyCSS
 * counterpart (hinge, flipOut*, zoomOutDown/Right, speed modifiers) map to
 * `null` — kept + reported, never silently wrong.
 */

import { cliMain, defineTableCodemod } from "./lib/engine";
import type { MappingTable } from "./lib/mapper";

export const MAPPINGS: MappingTable = {
  // ── fades ───────────────────────────────────────────────────────────────
  animate__fadeIn: "roycss-fade-in",
  animate__fadeOut: "roycss-fade-out",
  animate__fadeInUp: "roycss-fade-in-up",
  animate__fadeInDown: "roycss-fade-in-down",
  animate__fadeInLeft: "roycss-fade-in-left",
  animate__fadeInRight: "roycss-fade-in-right",
  animate__fadeInUpBig: "roycss-fade-in-up",
  animate__fadeInDownBig: "roycss-fade-in-down",
  animate__fadeInLeftBig: "roycss-fade-in-left",
  animate__fadeInRightBig: "roycss-fade-in-right",
  animate__fadeOutUp: "roycss-fade-out-up",
  animate__fadeOutDown: "roycss-fade-out-down",
  animate__fadeOutLeft: "roycss-fade-out-left",
  animate__fadeOutRight: "roycss-fade-out-right",
  animate__fadeOutUpBig: "roycss-fade-out-up",
  animate__fadeOutDownBig: "roycss-fade-out-down",
  animate__fadeOutLeftBig: "roycss-fade-out-left",
  animate__fadeOutRightBig: "roycss-fade-out-right",

  // ── bounces ─────────────────────────────────────────────────────────────
  animate__bounceIn: "roycss-bounce-in",
  animate__bounceInDown: "roycss-bounce-in-down",
  animate__bounceInLeft: "roycss-bounce-in-left",
  animate__bounceInRight: "roycss-bounce-in-right",
  animate__bounceInUp: "roycss-bounce-in-up",
  animate__bounceOut: "roycss-bounce-out",

  // ── slides (see header: Animate.css names travel, RoyCSS names origin) ──
  animate__slideInUp: "roycss-slide-in-bottom",
  animate__slideInDown: "roycss-slide-in-top",
  animate__slideInLeft: "roycss-slide-in-left",
  animate__slideInRight: "roycss-slide-in-right",
  animate__slideOutUp: "roycss-slide-out-top",
  animate__slideOutDown: "roycss-slide-out-bottom",
  animate__slideOutLeft: "roycss-slide-out-left",
  animate__slideOutRight: "roycss-slide-out-right",

  // ── zooms ───────────────────────────────────────────────────────────────
  animate__zoomIn: "roycss-zoom-in",
  animate__zoomInDown: "roycss-zoom-in-down",
  animate__zoomInLeft: "roycss-zoom-in-left",
  animate__zoomInRight: "roycss-zoom-in-right",
  animate__zoomInUp: "roycss-zoom-in-up",
  animate__zoomOut: "roycss-zoom-out",
  animate__zoomOutLeft: "roycss-zoom-out-left",
  animate__zoomOutUp: "roycss-zoom-out-up",
  animate__zoomOutDown: null, // no roycss-zoom-out-down in the catalog
  animate__zoomOutRight: null, // no roycss-zoom-out-right in the catalog

  // ── flips ───────────────────────────────────────────────────────────────
  animate__flipInX: "roycss-flip-in-x",
  animate__flipInY: "roycss-flip-in-y",

  // ── one-shot entrances ──────────────────────────────────────────────────
  animate__lightSpeedIn: "roycss-light-speed-in",
  animate__lightSpeedInLeft: "roycss-light-speed-in",
  animate__lightSpeedInRight: "roycss-light-speed-in",
  animate__rollIn: "roycss-roll-in",
  animate__rollOut: "roycss-roll-out",
  animate__jackInTheBox: "roycss-jack-in-box",

  // ── attention seekers ───────────────────────────────────────────────────
  animate__pulse: "roycss-pulse-soft",
  animate__heartBeat: "roycss-heartbeat",
  animate__flash: "roycss-flash",
  animate__shake: "roycss-shake",
  animate__headShake: "roycss-shake",
  animate__swing: "roycss-swing",
  animate__tada: "roycss-tada",
  animate__wobble: "roycss-wobble",
  animate__jello: "roycss-jello",
  animate__rubberBand: "roycss-rubber-band",

  // ── no RoyCSS counterpart → recognized, kept, reported ──────────────────
  // animate.css base class — RoyCSS animation classes carry their own
  // `animation` shorthand, so no equivalent is needed (kept + reported).
  animate__animated: null,
  animate__flip: null,
  animate__flipOutX: null,
  animate__flipOutY: null,
  animate__lightSpeedOut: null,
  animate__lightSpeedOutRight: null,
  animate__lightSpeedOutLeft: null,
  animate__hinge: null,
  animate__bounce: null,
  // duration / repeat modifiers — RoyCSS classes ship their own timing
  animate__faster: null,
  animate__fast: null,
  animate__slow: null,
  animate__slower: null,
  animate__repeat_1: null,
  animate__repeat_2: null,
  animate__repeat_3: null,
  animate__infinite: null,
};

export const codemod = defineTableCodemod({
  id: "from-animate-css",
  kind: "inbound",
  label: "Animate.css → RoyCSS",
  description:
    "Map animate__* entrance/exit/attention animations to RoyCSS animation classes; unmapped variants and speed modifiers stay untouched and are reported.",
  mappings: MAPPINGS,
});


// ─── Standalone entry: bun scripts/codemods/from-animate-css.ts <glob> [--write] ───
if (import.meta.main) {
  process.exit(cliMain(codemod, process.argv.slice(2)));
}

export default codemod;
