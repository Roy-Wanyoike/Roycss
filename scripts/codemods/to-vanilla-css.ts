/**
 * to-vanilla-css.ts — outbound codemod (PF-015, issue #95)
 *
 * RoyCSS classes → plain, framework-free CSS classes. This is the lock-in
 * prevention path (LABS-34 §5.5): the migration rewrites `roycss-*` tokens
 * in markup to their prefix-stripped names (`roycss-fade-in` → `fade-in`)
 * and emits the matching catalog CSS with every `roycss-*` selector
 * rewritten the same way, producing a self-contained stylesheet that no
 * longer needs the RoyCSS package.
 *
 * Policy:
 *   - Only classes the catalog really defines are rewritten; any other
 *     `roycss-*` token is unknown — kept and reported, never guessed.
 *   - Non-RoyCSS classes in the same attribute are left as-is and reported
 *     as "kept as-is" (they are the user's own classes).
 *   - `@keyframes roy-*` names are kept verbatim: they are already
 *     namespaced and renaming them would risk collisions with user CSS.
 *
 * Idempotent: after a run no `roycss-*` tokens remain, so a second run is a
 * no-op. Pinned by tests/unit/codemods/to-vanilla-css.test.ts.
 */

import { getCatalogClasses, getEffectCssForClass } from "./lib/catalog";
import { applyMapping, type MappingTable } from "./lib/mapper";
import { cliMain, type CodemodDefinition, type CodemodTransformResult } from "./lib/engine";

/** roycss-fade-in → fade-in; roymotion-x → x (future-proof). */
function stripPrefix(cls: string): string {
  return cls.replace(/^(?:roycss|roymotion)-/, "");
}

/** Rewrite every `.roycss-*` / `.roymotion-*` selector in a CSS block. */
function rewriteSelectors(css: string): string {
  return css.replace(/\.((?:roycss|roymotion)-[A-Za-z0-9_-]+)/g, (_m, cls: string) => `.${stripPrefix(cls)}`);
}

/** Full catalog table, built once: roycss-X → X for every shipped class. */
function buildVanillaTable(): MappingTable {
  const table: MappingTable = {};
  for (const cls of getCatalogClasses()) table[cls] = stripPrefix(cls);
  return table;
}

export const VANILLA_TABLE = buildVanillaTable();

/** Tokens that are not RoyCSS classes — the user's own, left as-is. */
const NOT_ROYCSS = /^(?!(?:roycss|roymotion)-)/;

export function transformToVanilla(source: string): CodemodTransformResult {
  const result = applyMapping(source, VANILLA_TABLE, {
    skipRoycss: false,
    ignore: [NOT_ROYCSS],
  });
  // Emit the catalog CSS for every distinct RoyCSS class that was rewritten.
  // One block per effect; multi-class effects (helper selectors) are emitted
  // once via their first referenced class.
  const cssBlocks: string[] = [];
  const seenTargets = new Set<string>();
  const seenBlocks = new Set<string>();
  for (const r of result.replaced) {
    if (seenTargets.has(r.to)) continue;
    seenTargets.add(r.to);
    const css = getEffectCssForClass(r.from);
    if (css === null) continue; // not in catalog — already reported unknown
    const block = rewriteSelectors(css);
    if (!seenBlocks.has(block)) {
      seenBlocks.add(block);
      cssBlocks.push(block);
    }
  }
  return { ...result, approximate: [], cssBlocks, css: cssBlocks.join("\n\n") };
}

export const codemod: CodemodDefinition = {
  id: "to-vanilla-css",
  kind: "outbound",
  label: "RoyCSS → plain CSS (framework-free)",
  description:
    "Rewrite roycss-* classes to prefix-stripped plain classes and emit a self-contained CSS block with the rewritten selectors — the lock-in prevention path.",
  mappingCount: () => Object.keys(VANILLA_TABLE).length,
  transform: transformToVanilla,
};


// ─── Standalone entry: bun scripts/codemods/to-vanilla-css.ts <glob> [--write] ───
if (import.meta.main) {
  process.exit(cliMain(codemod, process.argv.slice(2), { defaultCssOut: "roycss-vanilla.css" }));
}

export default codemod;
