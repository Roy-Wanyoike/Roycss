/**
 * RoyCSS Package Build Script
 *
 * Compiles all CSS effects from the TypeScript source files into:
 *   dist/roycss.css       — full source (with comments, formatted)
 *   dist/roycss.min.css   — minified production build
 *   dist/effects.json     — metadata for tooling (id, name, category, tags)
 *   dist/effects.js       — ES module exporting the effects array
 *   dist/effects.cjs      — CommonJS module
 *
 * Usage:  bun run scripts/build-package.ts
 */

import { effects } from "../src/lib/roycss-effects";
import { categoryMeta, categoryOrder } from "../src/lib/roycss-types";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "node:child_process";

const DIST_DIR = join(import.meta.dir, "..", "dist");

// Ensure dist/ exists
mkdirSync(DIST_DIR, { recursive: true });

// Version is read from package.json at build time so the shipped banner
// always matches the manifest (previously hardcoded "v1.0.0 / 1569+" while
// the package was v2.0.0 / 1,959 effects).
const pkg = JSON.parse(readFileSync(join(import.meta.dir, "..", "package.json"), "utf-8")) as {
  version: string;
};

// Header banner
const HEADER = `/*!
 * RoyCSS v${pkg.version}
 * ${effects.length} production-ready CSS effects. Zero JavaScript runtime.
 * https://github.com/Roy-Wanyoike/Roycss
 *
 * Author: Royford Wanyoike Wamaitha
 * License: MIT
 *
 * Built: ${new Date().toISOString().split("T")[0]}
 * Effects: ${effects.length}
 * Categories: ${categoryOrder.length}
 */

`;

// Base reset (minimal, non-destructive)
const BASE_CSS = `/* ─── Base ────────────────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
}

.roycss-sr-only {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

@media (prefers-reduced-motion: reduce) {
  [class^="roycss-"],
  [class*=" roycss-"] {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

`;

// Build full CSS
console.log("Building RoyCSS distribution...");

const byCategory: Record<string, typeof effects> = {};
for (const effect of effects) {
  if (!byCategory[effect.category]) byCategory[effect.category] = [];
  byCategory[effect.category].push(effect);
}

let fullCSS = HEADER + BASE_CSS;

for (const cat of categoryOrder) {
  const catEffects = byCategory[cat];
  if (!catEffects || catEffects.length === 0) continue;
  const meta = categoryMeta[cat];
  fullCSS += `/* ═══════════════════════════════════════════════════════════════
   ${meta.label.toUpperCase()} (${catEffects.length} effects)
   ═══════════════════════════════════════════════════════════════ */

`;
  for (const effect of catEffects) {
    fullCSS += effect.cssCode + "\n\n";
  }
}

writeFileSync(join(DIST_DIR, "roycss.css"), fullCSS, "utf-8");
console.log(`  ✓ dist/roycss.css (${(fullCSS.length / 1024).toFixed(1)}KB)`);

// Minify CSS
function minifyCSS(css: string): string {
  return css
    .replace(/\/\*(?!\!)[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim()
    .replace(/^/, HEADER.replace(/\n/g, "\n").trim() + "\n");
}

const minified = minifyCSS(fullCSS);
writeFileSync(join(DIST_DIR, "roycss.min.css"), minified, "utf-8");
console.log(`  ✓ dist/roycss.min.css (${(minified.length / 1024).toFixed(1)}KB)`);

// No source map is emitted: we have no real per-rule mappings (the old
// dist/roycss.min.css.map was a 76-byte empty-mappings stub) and the
// stylesheet is generated, not hand-written — shipping a fake map only
// misleads browser devtools.

// Effects metadata JSON
const metadata = effects.map((e) => ({
  id: e.id,
  name: e.name,
  category: e.category,
  description: e.description,
  tags: e.tags,
  previewType: e.previewType,
  previewText: e.previewText || null,
  childCount: e.childCount || null,
}));

writeFileSync(join(DIST_DIR, "effects.json"), JSON.stringify(metadata, null, 2), "utf-8");
console.log(`  ✓ dist/effects.json (${metadata.length} effects)`);

// ES module
const esModule = `// RoyCSS effects metadata — auto-generated
export const effects = ${JSON.stringify(metadata)};
export const categories = ${JSON.stringify(categoryOrder)};
export const categoryMeta = ${JSON.stringify(categoryMeta)};
export default effects;
`;
writeFileSync(join(DIST_DIR, "effects.js"), esModule, "utf-8");
console.log(`  ✓ dist/effects.js`);

// CommonJS module
const cjsModule = `"use strict";
const effects = ${JSON.stringify(metadata)};
const categories = ${JSON.stringify(categoryOrder)};
const categoryMeta = ${JSON.stringify(categoryMeta)};
module.exports = effects;
module.exports.effects = effects;
module.exports.categories = categories;
module.exports.categoryMeta = categoryMeta;
module.exports.default = effects;
`;
writeFileSync(join(DIST_DIR, "effects.cjs"), cjsModule, "utf-8");
console.log(`  ✓ dist/effects.cjs`);

// TypeScript declarations
const typesDecl = `// RoyCSS type declarations — auto-generated
export interface CSSEffect {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  previewType: string;
  previewText: string | null;
  childCount: number | null;
}

export declare const effects: CSSEffect[];
export declare const categories: string[];
export declare const categoryMeta: Record<string, { label: string; description: string }>;
export default effects;
`;
writeFileSync(join(DIST_DIR, "effects.d.ts"), typesDecl, "utf-8");
console.log(`  ✓ dist/effects.d.ts`);

console.log("");
console.log("✅ RoyCSS build complete!");
console.log(`   ${effects.length} effects across ${categoryOrder.length} categories`);
console.log(`   Full: ${(fullCSS.length / 1024).toFixed(1)}KB | Minified: ${(minified.length / 1024).toFixed(1)}KB`);

// ─── Generate derived build artifacts (class-index / motion /
//     pro-components JSON files) ─────────────────────────────────
// Run the generate-build-artifacts script as a child process so this
// script stays single-purpose and the artifact script stays testable
// in isolation. The artifact script reads from src/ and writes 3 JSON
// files into dist/.
console.log("");
console.log("Generating derived build artifacts...");
try {
  const result = spawnSync("bun", ["run", "scripts/generate-build-artifacts.ts"], {
    cwd: join(import.meta.dir, ".."),
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.warn("  ⚠ generate-build-artifacts exited non-zero — continuing.");
  }
} catch (err) {
  console.warn("  ⚠ generate-build-artifacts failed:", err instanceof Error ? err.message : String(err));
}

// ─── Emit the design-token type system (PF-030 / issue #123) ──────
// dist/tokens.d.ts (typed CSS custom-property constants) +
// dist/tokens.dtcg.json (W3C DTCG interchange). Chained here so
// `bun run build:package` / prepublishOnly can never ship a stale
// token artifact; staleness of the COMMITTED copies is additionally
// gated by `bun run tokens:check` and tests/unit/tokens-emission.test.ts.
console.log("");
console.log("Emitting design-token artifacts...");
try {
  const result = spawnSync("bun", ["run", "scripts/emit-tokens.ts"], {
    cwd: join(import.meta.dir, ".."),
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.warn("  ⚠ emit-tokens exited non-zero — continuing.");
  }
} catch (err) {
  console.warn("  ⚠ emit-tokens failed:", err instanceof Error ? err.message : String(err));
}

// ─── Generate AI-conformance artifacts (rules / system prompt /
//     grammar / training pairs — issue #124) ─────────────────────
// Same child-process pattern as above: the generator reads the catalog
// from src/ plus package.json surfaces and writes 4 files into dist/,
// self-validating that every class token it emits exists in the
// catalog. Drift gates: `bun run ai:check` and
// tests/unit/ai-artifacts.test.ts.
console.log("");
try {
  const result = spawnSync("bun", ["run", "scripts/generate-ai-artifacts.ts"], {
    cwd: join(import.meta.dir, ".."),
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.warn("  ⚠ generate-ai-artifacts exited non-zero — continuing.");
  }
} catch (err) {
  console.warn("  ⚠ generate-ai-artifacts failed:", err instanceof Error ? err.message : String(err));
}
