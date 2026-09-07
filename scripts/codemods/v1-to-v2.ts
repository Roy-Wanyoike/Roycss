/**
 * v1-to-v2.ts — scaffold codemod (PF-015, issue #95)
 *
 * RoyCSS V1 → V2 migration. REPORT-ONLY SCAFFOLD: the actual V1 → V2
 * transformation requires the V2 `@roycss/*` packages (PF-042 monorepo),
 * which are not published yet. Until then this codemod inventories a V1
 * codebase — every `roycss-*` class in use plus V1 package imports — so
 * teams can size the migration *before* the V2 packages exist.
 *
 * Behavior:
 *   - never transforms anything (output === input, --write is refused)
 *   - `roycss-*` tokens are reported as "already roycss" (V1 usage)
 *   - V1 import markers (`@import`/`import`/`require` of roycss paths) are
 *     reported as "kept" (V1 wiring a migration would rewrite)
 *   - everything else is ignored — this codemod only inventories
 */

import { scanClassAttributes } from "./lib/class-scanner";
import { cliMain, type CodemodDefinition, type CodemodTransformResult } from "./lib/engine";

export const V2_GUARD_REASON =
  "V1→V2 transformation requires the V2 @roycss/* packages (PF-042), which are not published yet — run in report-only mode to size your migration";

/** V1 import wiring: @import "…roycss…", import "roycss/…", require("roycss/…"). */
const V1_IMPORT_RE = /(?:@import\s+|from\s+|import\s*\(?\s*|require\s*\(\s*)["'][^"']*roycss[^"']*["']/g;

export function transformV1toV2(source: string): CodemodTransformResult {
  const alreadyRoycss: string[] = [];
  const kept: string[] = [];
  for (const attr of scanClassAttributes(source)) {
    for (const token of attr.tokens) {
      if (/^(?:roycss|roymotion)-/.test(token.value) && !alreadyRoycss.includes(token.value)) {
        alreadyRoycss.push(token.value);
      }
    }
  }
  for (const m of source.matchAll(V1_IMPORT_RE)) {
    const marker = m[0].trim();
    if (!kept.includes(marker)) kept.push(marker);
  }
  // Report-only: the output is always the untouched input.
  return { output: source, replaced: [], unknown: [], kept, ignored: [], alreadyRoycss, approximate: [] };
}

export const codemod: CodemodDefinition = {
  id: "v1-to-v2",
  kind: "scaffold",
  label: "RoyCSS V1 → V2 (report-only)",
  description:
    "Inventory V1 usage (roycss-* classes and V1 package imports) to size a future V2 migration; transformation is blocked until the V2 packages ship (PF-042).",
  reportOnly: true,
  reportOnlyReason: V2_GUARD_REASON,
  transform: transformV1toV2,
};


// ─── Standalone entry: bun scripts/codemods/v1-to-v2.ts <glob> [--write] ───
if (import.meta.main) {
  process.exit(cliMain(codemod, process.argv.slice(2)));
}

export default codemod;
