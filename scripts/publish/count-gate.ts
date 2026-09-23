/**
 * RoyCSS publish — count-drift gate (issue #212).
 *
 * Every publishable manifest (root `roycss`, `roycss-cli`, `roycss-mcp`,
 * the VS Code extension) advertises the catalog size in its npm-facing
 * description. When the catalog moves and the descriptions don't, the
 * npm listings go stale — that is exactly how "1,959" survived two
 * catalog batches (53/54) before #212.
 *
 * This module is the PURE half of the gate (easy to unit test with a
 * mutated fixture — see tests/unit/publish-count-gate.test.ts):
 *
 *   - extractEffectsCount(description) → number | null
 *   - checkDescriptionCounts(packages, actual) → violations[]
 *
 * The impure half (reading package.json files + dist/effects.json,
 * printing, exiting non-zero) lives in scripts/publish/validate.ts,
 * which fails `bun run publish:validate` on any drift.
 */

/** One publishable manifest's npm description. */
export interface StatedCount {
  /** package.json path relative to the repo root — for error messages. */
  path: string;
  /** The raw `description` string from that package.json. */
  description: string;
}

/** A manifest whose advertised effects count disagrees with the catalog. */
export interface CountViolation {
  path: string;
  /** Count stated in the description. */
  stated: number;
  /** Actual number of effects in dist/effects.json. */
  actual: number;
}

/**
 * Extract the advertised effects count from an npm description.
 *
 * Matches every shape used by the publishable manifests:
 *   "RoyCSS — 1,983 production-ready CSS effects. …"            (root)
 *   "…search, add, and manage 1,983 production-ready CSS effects." (cli)
 *   "…access to 1,983 effects, 10 UI patterns, …"               (mcp-server)
 *   "…commands for all 1983 production-ready CSS effects. …"    (vscode)
 *
 * The first match wins. Returns null when no effects count is
 * advertised — nothing to drift, so the gate skips it.
 */
export function extractEffectsCount(description: string): number | null {
  const m =
    /(\d{1,3}(?:,\d{3})+|\d+)\s+(?:production-ready\s+)?(?:CSS\s+)?effects\b/i.exec(
      description,
    );
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

/**
 * Compare every advertised count against the actual catalog size.
 * Descriptions that state no effects count are skipped (null extract).
 */
export function checkDescriptionCounts(
  packages: readonly StatedCount[],
  actualEffects: number,
): CountViolation[] {
  const violations: CountViolation[] = [];
  for (const pkg of packages) {
    const stated = extractEffectsCount(pkg.description);
    if (stated !== null && stated !== actualEffects) {
      violations.push({ path: pkg.path, stated, actual: actualEffects });
    }
  }
  return violations;
}
