/**
 * from-tailwind.ts — inbound codemod (PF-015, issue #95)
 *
 * Tailwind utility classes → RoyCSS classes.
 *
 * Policy (conservative by design):
 *   - Only what RoyCSS *genuinely ships* is mapped: the `animate-*` family
 *     and the `backdrop-blur-*` / `shadow-*` utility families.
 *   - Layout utilities (spacing / flex / grid / sizing / typography) stay
 *     exactly as-is — RoyCSS is an effects library, not a layout system.
 *     They match the `ignore` patterns and are reported as "kept as-is".
 *   - `blur-*`, `ring*`, `sepia`, `grayscale`, … have no honest RoyCSS
 *     equivalent → mapped to `null` (recognized, kept, reported) so they are
 *     distinguished from genuinely unknown classes.
 *
 * Every target below is validated against the live catalog by
 * tests/unit/codemods/mappings.test.ts.
 */

import { cliMain, defineTableCodemod } from "./lib/engine";
import type { MappingTable } from "./lib/mapper";

/** Tailwind layout/sizing/typography utilities — kept as-is, reported. */
const IGNORED_TAILWIND_UTILITIES: RegExp[] = [
  // spacing (padding/margin/gap), including negative + arbitrary values
  /^[pm][trblxy]?-(?!roycss)[\w.[\]/%-]+$/,
  /^gap(-[xyz])?-(?!roycss)[\w.[\]/%-]+$/,
  // layout
  /^(flex|grid|block|inline|hidden|contents)$/,
  /^(flex|grid)-(col|row|wrap|nowrap|cols|rows|flow|auto|grow|shrink)[\w-]*$/,
  /^(items|justify|justify-items|justify-self|self|place|content)-[\w-]+$/,
  /^(relative|absolute|fixed|sticky|static)$/,
  /^(top|bottom|left|right|inset)-(?!roycss)[\w.[\]/%-]+$/,
  /^z-(?!roycss)[\w.[\]/%-]+$/,
  // sizing
  /^[wh]-(?!roycss)(min-|max-)?[\w.[\]/%-]+$/,
  /^[wh]-(min|max)-(?!roycss)[\w.[\]/%-]+$/,
  /^min-[wh]-(?!roycss)[\w.[\]/%-]+$/,
  /^max-[wh]-(?!roycss)[\w.[\]/%-]+$/,
  /^size-(?!roycss)[\w.[\]/%-]+$/,
  // typography & color utilities (no RoyCSS token classes exist)
  /^(text|font|leading|tracking|line-clamp|list|decoration|underline|uppercase|lowercase|capitalize|truncate|antialiased)[\w-]*$/,
  /^(bg|from|via|to|border|divide|outline|ring-offset|fill|stroke|text|opacity)-[\w.[\]/%()-]+$/,
  /^(rounded|border|divide|outline)[\w-]*$/,
  /^(container|isolate|aspect|object|overflow|overscroll|scroll|snap)[\w-]*$/,
  /^(transition|duration|ease|delay)[\w-]*$/,
  /^(select|resize|cursor|appearance|pointer-events|whitespace|break|sr-only|not-sr-only)$/,
  /^(col|row|order)-[\w-]+$/,
];

export const MAPPINGS: MappingTable = {
  // ── animate-* → RoyCSS animation families ──────────────────────────────
  // Tailwind's four core animations. `animate-ping` / `animate-bounce` have
  // no element-agnostic RoyCSS equivalent → kept + reported.
  "animate-pulse": "roycss-pulse-soft",
  "animate-spin": "roycss-rotate-spin",
  "animate-ping": null,
  "animate-bounce": null,

  // ── shadow-* → RoyCSS elevation family ─────────────────────────────────
  // RoyCSS ships three Material-elevation steps; the six Tailwind steps map
  // onto them in order. (Elevation classes also set a surface background —
  // reported so the migration is never silent.)
  "shadow-sm": "roycss-material-elevation-1",
  shadow: "roycss-material-elevation-1",
  "shadow-md": "roycss-material-elevation-3",
  "shadow-lg": "roycss-material-elevation-3",
  "shadow-xl": "roycss-material-elevation-5",
  "shadow-2xl": "roycss-material-elevation-5",
  "shadow-none": null,

  // ── backdrop-blur-* → RoyCSS frosted-glass family ──────────────────────
  "backdrop-blur": "roycss-glass-frosted",
  "backdrop-blur-sm": "roycss-glass-frosted",
  "backdrop-blur-md": "roycss-glass-frosted",
  "backdrop-blur-lg": "roycss-glass-frosted",
  "backdrop-blur-xl": "roycss-glass-frosted",
  "backdrop-blur-2xl": "roycss-glass-frosted",
  "backdrop-blur-3xl": "roycss-glass-frosted",

  // ── no honest RoyCSS equivalent → recognized, kept, reported ───────────
  blur: null,
  "blur-sm": null,
  "blur-md": null,
  "blur-lg": null,
  "blur-xl": null,
  "blur-2xl": null,
  "blur-3xl": null,
  ring: null,
  "ring-0": null,
  "ring-1": null,
  "ring-2": null,
  "ring-4": null,
  "ring-8": null,
};

export const codemod = defineTableCodemod({
  id: "from-tailwind",
  kind: "inbound",
  label: "Tailwind CSS → RoyCSS",
  description:
    "Map Tailwind animate-*/shadow-*/backdrop-blur-* utilities to RoyCSS animation, elevation and glass families; layout utilities stay as-is; unknown classes are reported.",
  mappings: MAPPINGS,
  ignore: IGNORED_TAILWIND_UTILITIES,
});


// ─── Standalone entry: bun scripts/codemods/from-tailwind.ts <glob> [--write] ───
if (import.meta.main) {
  process.exit(cliMain(codemod, process.argv.slice(2)));
}

export default codemod;
