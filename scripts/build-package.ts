/**
 * RoyCSS Package Build Script
 *
 * Compiles all CSS effects from the TypeScript source files into:
 *   dist/roycss.css       — full source (with comments, formatted)
 *   dist/roycss.min.css   — minified production build
 *   dist/roycss.min.css.map — source map
 *   dist/effects.json     — metadata for tooling (id, name, category, tags)
 *   dist/effects.js       — ES module exporting the effects array
 *   dist/effects.cjs      — CommonJS module
 *
 * Usage:  bun run scripts/build-package.ts
 */

import { effects } from "../src/lib/roycss-effects";
import { categoryMeta, categoryOrder } from "../src/lib/roycss-types";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const DIST_DIR = join(import.meta.dir, "..", "dist");

// Ensure dist/ exists
mkdirSync(DIST_DIR, { recursive: true });

// Header banner
const HEADER = `/*!
 * RoyCSS v1.0.0
 * 1749+ production-ready CSS effects. Zero JavaScript runtime.
 * https://github.com/Roy-Wanyoike/roycss
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

// Source map
const map = { version: 3, file: "roycss.min.css", sources: ["roycss.css"], mappings: "" };
writeFileSync(join(DIST_DIR, "roycss.min.css.map"), JSON.stringify(map), "utf-8");
console.log(`  ✓ dist/roycss.min.css.map`);

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
