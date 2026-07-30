#!/usr/bin/env bun
/**
 * reduced-motion.ts — Verify `prefers-reduced-motion: reduce` is respected
 * globally across the RoyCSS marketing site's CSS.
 *
 * Scans `src/app/globals.css` and `src/app/roycss.css` for:
 *   1. A `@media (prefers-reduced-motion: reduce)` block exists.
 *   2. The block contains `animation: none !important` OR
 *      `animation-duration: 0.01ms !important` (or equivalent).
 *   3. The block contains `transition: none !important` OR
 *      `transition-duration: 0.01ms !important` (or equivalent).
 *   4. The block contains `scroll-behavior: auto !important`.
 *
 * These four guarantees are the "sledgehammer" that ensures every
 * animation on the site is killed when the user has reduced-motion
 * enabled. WCAG 2.3.3 (AAA) requires this.
 *
 * The script also scans the same CSS files for inline `@media
 * (prefers-reduced-motion: ...)` blocks inside specific selectors (the
 * "surgical overrides" pattern) and reports them — these are optional
 * but encouraged for non-critical animations.
 *
 * Output: a summary to stdout + JSON to `a11y/results/reduced-motion.json`.
 * Exit 0 if all 4 required guarantees are present, 1 otherwise.
 *
 * Usage:
 *   bun run a11y/reduced-motion.ts
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(HERE, "..");
const RESULTS_DIR = join(HERE, "results");

mkdirSync(RESULTS_DIR, { recursive: true });

const CSS_FILES = [
  join(PROJECT_ROOT, "src", "app", "globals.css"),
  join(PROJECT_ROOT, "src", "app", "roycss.css"),
];

/* ─── 1. Read CSS files ───────────────────────────────────────────────────── */

interface FileResult {
  path: string;
  exists: boolean;
  content: string;
  reducedMotionBlocks: string[];   // text of each @media (prefers-reduced-motion) block
  perEffectOverrides: number;       // count of surgical overrides inside selectors
}

function findReducedMotionBlocks(css: string): string[] {
  // Match `@media (prefers-reduced-motion: ...)` blocks including nested braces.
  // We scan char by char and track brace depth.
  const blocks: string[] = [];
  const re = /@media\s*\(\s*prefers-reduced-motion\s*:\s*(reduce|no-preference)\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    const startOff = m.index;
    // Walk forward to find the opening `{` of the media block.
    let i = m.index + m[0].length;
    while (i < css.length && css[i] !== "{") i++;
    if (css[i] !== "{") continue;
    const blockStart = i;
    let depth = 1;
    i++;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    const blockEnd = i; // one past the closing `}`
    blocks.push(css.slice(startOff, blockEnd));
    re.lastIndex = blockEnd;
  }
  return blocks;
}

function countPerEffectOverrides(css: string): number {
  // Count `@media (prefers-reduced-motion: reduce)` blocks that appear
  // INSIDE a selector (i.e., after a `{` and before the matching `}`).
  // These are the "surgical" overrides used by per-effect CSS to disable
  // a specific animation under reduced motion.
  //
  // We approximate by counting occurrences of the pattern that appear
  // indented (preceded by whitespace) on a line within a rule body.
  // The full CSS parser approach is overkill for this count.
  const re = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/g;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    // Check if the @media is inside a rule body by looking at the
    // preceding non-whitespace character — if it's `{`, this is a nested
    // override (surgical). If it's `}` or `;` or start-of-file, it's a
    // top-level block (the sledgehammer).
    let i = m.index - 1;
    while (i >= 0 && /\s/.test(css[i])) i--;
    const prevChar = css[i] ?? "";
    if (prevChar === "{") count++;
  }
  return count;
}

const fileResults: FileResult[] = [];
for (const p of CSS_FILES) {
  const exists = existsSync(p);
  const content = exists ? readFileSync(p, "utf-8") : "";
  fileResults.push({
    path: p,
    exists,
    content,
    reducedMotionBlocks: findReducedMotionBlocks(content),
    perEffectOverrides: countPerEffectOverrides(content),
  });
}

/* ─── 2. Aggregate the sledgehammer block ───────────────────────────────────
 *
 * The "sledgehammer" is the global @media (prefers-reduced-motion: reduce)
 * block that applies to all elements (typically via `*, *::before, *::after`).
 * We collect ALL reduced-motion blocks across all files and check that at
 * least one of them contains each required property.
 */

const allBlocks: string[] = [];
for (const fr of fileResults) {
  allBlocks.push(...fr.reducedMotionBlocks);
}

interface Guarantee {
  id: string;
  rule: string;
  re: RegExp;
  found: boolean;
  foundIn: string | null;  // file path or "aggregated"
  snippet: string | null;
}

const guarantees: Guarantee[] = [
  {
    id: "G1",
    rule: "@media (prefers-reduced-motion: reduce) block exists",
    re: /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/,
    found: false,
    foundIn: null,
    snippet: null,
  },
  {
    id: "G2",
    rule: "animation-duration ≤ 0.01ms !important (or animation: none !important)",
    re: /animation(?:-duration)?\s*:\s*(?:none|0\.01ms|0ms|0\.001s)\s*!important/i,
    found: false,
    foundIn: null,
    snippet: null,
  },
  {
    id: "G3",
    rule: "transition-duration ≤ 0.01ms !important (or transition: none !important)",
    re: /transition(?:-duration)?\s*:\s*(?:none|0\.01ms|0ms|0\.001s)\s*!important/i,
    found: false,
    foundIn: null,
    snippet: null,
  },
  {
    id: "G4",
    rule: "scroll-behavior: auto !important",
    re: /scroll-behavior\s*:\s*auto\s*!important/i,
    found: false,
    foundIn: null,
    snippet: null,
  },
];

// Check G1 across all files.
for (const fr of fileResults) {
  if (guarantees[0].re.test(fr.content)) {
    guarantees[0].found = true;
    guarantees[0].foundIn = fr.path;
    const m = fr.content.match(guarantees[0].re);
    guarantees[0].snippet = m ? m[0] : null;
    break;
  }
}

// Check G2-G4 across all reduced-motion blocks (the properties must be
// INSIDE a reduced-motion block to count as "respects reduced motion").
for (const gIdx of [1, 2, 3]) {
  const g = guarantees[gIdx];
  for (const block of allBlocks) {
    if (g.re.test(block)) {
      g.found = true;
      g.foundIn = "reduced-motion block";
      const m = block.match(g.re);
      g.snippet = m ? m[0] : null;
      break;
    }
  }
}

/* ─── 3. Output ───────────────────────────────────────────────────────────── */

function printSummary(): void {
  console.log("\n" + "═".repeat(80));
  console.log("Reduced-Motion CSS Audit — prefers-reduced-motion: reduce");
  console.log("Scanned files:");
  for (const fr of fileResults) {
    console.log(`  ${fr.exists ? "✓" : "✗"} ${fr.path} (${fr.reducedMotionBlocks.length} @media blocks, ${fr.perEffectOverrides} surgical overrides)`);
  }
  console.log("═".repeat(80));

  console.log("\nRequired guarantees (the sledgehammer):");
  for (const g of guarantees) {
    const status = g.found ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${status}  ${g.id}: ${g.rule}`);
    if (g.foundIn) console.log(`            found in: ${g.foundIn}`);
    if (g.snippet) console.log(`            snippet:  ${g.snippet}`);
  }

  console.log("\nSurgical (per-selector) overrides:");
  let totalOverrides = 0;
  for (const fr of fileResults) totalOverrides += fr.perEffectOverrides;
  console.log(`  Total surgical @media (prefers-reduced-motion: reduce) blocks: ${totalOverrides}`);

  console.log("");
}

function writeJson(): void {
  const outPath = join(RESULTS_DIR, "reduced-motion.json");
  const payload = {
    generatedAt: new Date().toISOString(),
    spec: "WCAG 2.3.3 AAA (Animation from Interactions)",
    files: fileResults.map((fr) => ({
      path: fr.path,
      exists: fr.exists,
      reducedMotionBlockCount: fr.reducedMotionBlocks.length,
      surgicalOverrideCount: fr.perEffectOverrides,
    })),
    guarantees: guarantees.map((g) => ({
      id: g.id,
      rule: g.rule,
      found: g.found,
      foundIn: g.foundIn,
      snippet: g.snippet,
    })),
    summary: {
      totalGuarantees: guarantees.length,
      passed: guarantees.filter((g) => g.found).length,
      failed: guarantees.filter((g) => !g.found).length,
      surgicalOverrides: fileResults.reduce((s, fr) => s + fr.perEffectOverrides, 0),
    },
  };
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`JSON written to ${outPath}`);
}

printSummary();
writeJson();

const failed = guarantees.filter((g) => !g.found);
if (failed.length > 0) {
  console.error(`❌ reduced-motion: FAIL — ${failed.length} guarantee(s) missing.`);
  process.exit(1);
} else {
  console.log("✅ reduced-motion: PASS — all 4 guarantees present.");
  process.exit(0);
}
