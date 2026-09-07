/**
 * to-tailwind.ts — outbound codemod (PF-015, issue #95)
 *
 * RoyCSS classes → closest *core* Tailwind utilities. Honest by design:
 * Tailwind's core ships four animations (`animate-spin/ping/pulse/bounce`),
 * an elevation scale and `backdrop-blur-*` — everything else in RoyCSS
 * (entrance animations, button/card/nav/form effects, loaders) has no core
 * equivalent and maps to `null`: recognized, kept, reported.
 *
 * Approximate mappings (Tailwind gets *close*, not equal) are flagged in
 * the `approximate` bucket and always reported so nothing silently loses
 * fidelity — e.g. `roycss-material-elevation-1` also paints a surface
 * background that `shadow-sm` does not.
 *
 * Mapping KEYS are catalog classes (validated by
 * tests/unit/codemods/mappings.test.ts); targets are Tailwind utility names
 * which are intentionally NOT validated against the RoyCSS catalog.
 */

import { cliMain, defineTableCodemod } from "./lib/engine";
import type { MappingTable } from "./lib/mapper";

export const MAPPINGS: MappingTable = {
  // ── animations → the four core Tailwind keyframe utilities ─────────────
  "roycss-rotate-spin": "animate-spin",
  "roycss-pulse-soft": "animate-pulse",
  "roycss-pulse-glow": "animate-pulse",
  "roycss-float": "animate-bounce",
  "roycss-heartbeat": "animate-pulse",
  "roycss-flash": "animate-pulse",
  "roycss-bounce-in": "animate-bounce",
  // entrance/exit families: no core Tailwind equivalent → kept + reported
  "roycss-fade-in": null,
  "roycss-fade-out": null,
  "roycss-zoom-in": null,
  "roycss-zoom-out": null,
  "roycss-slide-in-left": null,
  "roycss-slide-in-right": null,
  "roycss-flip-in-x": null,
  "roycss-light-speed-in": null,
  "roycss-roll-in": null,
  "roycss-jack-in-box": null,
  "roycss-shake": null,
  "roycss-wobble": null,
  "roycss-jello": null,
  "roycss-tada": null,
  "roycss-swing": null,
  "roycss-rubber-band": null,

  // ── elevation → shadow scale (approximate: elevation also paints bg) ───
  "roycss-material-elevation-1": "shadow-sm",
  "roycss-material-elevation-3": "shadow-md",
  "roycss-material-elevation-5": "shadow-lg",

  // ── glass → backdrop-blur (approximate: loses tint + borders) ──────────
  "roycss-glass-frosted": "backdrop-blur",
  "roycss-glass-frosted-dark": "backdrop-blur",

  // ── component families: no Tailwind equivalent → kept + reported ───────
  "roycss-btn-glow": null,
  "roycss-btn-outline-fill": null,
  "roycss-btn-neon": null,
  "roycss-card-glassmorphism": null,
  "roycss-card-hover-lift": null,
  "roycss-modal-backdrop-blur": null,
  "roycss-loader-spinner": null,
  "roycss-loader-skeleton": null,
  "roycss-glass-nav-bar-b18": null,
  "roycss-nav-tabs-underline": null,
  "roycss-form-toggle-switch": null,
};

/** Source classes whose Tailwind target only approximates the effect. */
const APPROXIMATE: readonly string[] = [
  "roycss-pulse-soft",
  "roycss-pulse-glow",
  "roycss-float",
  "roycss-heartbeat",
  "roycss-flash",
  "roycss-bounce-in",
  "roycss-material-elevation-1",
  "roycss-material-elevation-3",
  "roycss-material-elevation-5",
  "roycss-glass-frosted",
  "roycss-glass-frosted-dark",
];

/** Tokens that are not RoyCSS classes — the user's own, left as-is. */
const NOT_ROYCSS = /^(?!(?:roycss|roymotion)-)/;

export const codemod = defineTableCodemod({
  id: "to-tailwind",
  kind: "outbound",
  label: "RoyCSS → Tailwind CSS (closest utilities)",
  description:
    "Rewrite roycss-* classes to the closest core Tailwind utilities (spin/pulse/bounce, shadow scale, backdrop-blur); approximate mappings are flagged and classes without an equivalent are kept and reported.",
  mappings: MAPPINGS,
  ignore: [NOT_ROYCSS],
  approximate: APPROXIMATE,
  skipRoycss: false,
});


// ─── Standalone entry: bun scripts/codemods/to-tailwind.ts <glob> [--write] ───
if (import.meta.main) {
  process.exit(cliMain(codemod, process.argv.slice(2)));
}

export default codemod;
