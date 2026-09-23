/**
 * RoyCSS Package Build Script
 *
 * Compiles all CSS effects from the TypeScript source files into:
 *   dist/roycss.css       — full source (with comments, formatted)
 *   dist/roycss.min.css   — minified production build
 *   dist/effects.json     — metadata for tooling (id, name, category, tags)
 *   cli/effects.json      — byte-identical CLI snapshot of the dist catalog
 *                           (PF-049; tooling/parity artifact — the cli bundle
 *                           inlines the catalog, no runtime read)
 *   dist/effects.js       — ES module exporting the effects array
 *   dist/effects.cjs      — CommonJS module
 *   dist/roycss.manifest.json — unified lean index (PF-042): per-effect
 *                           maturity, quality score, a11y tier, browser
 *                           support + the naming-convention gate
 *
 * Usage:  bun run scripts/build-package.ts
 */

import { effects } from "../src/lib/roycss-effects";
import { categoryMeta, categoryOrder } from "../src/lib/roycss-types";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";
import { spawnSync } from "node:child_process";

const DIST_DIR = join(import.meta.dir, "..", "dist");
const CLI_DIR = join(import.meta.dir, "..", "cli");

// Ensure dist/ and cli/ exist
mkdirSync(DIST_DIR, { recursive: true });
mkdirSync(CLI_DIR, { recursive: true });

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

// Minify CSS. The `header` is re-prepended after stripping (the /*! banner
// survives comment-stripping, but re-prepending keeps ONE header code path
// for the monolith and the per-category splits).
function minifyCSS(css: string, header: string): string {
  return css
    .replace(/\/\*(?!\!)[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim()
    .replace(/^/, header.replace(/\n/g, "\n").trim() + "\n");
}

const minified = minifyCSS(fullCSS, HEADER);
writeFileSync(join(DIST_DIR, "roycss.min.css"), minified, "utf-8");
console.log(`  ✓ dist/roycss.min.css (${(minified.length / 1024).toFixed(1)}KB)`);

// ─── Per-category CSS splits (issue #217a) ──────────────────────
// One stylesheet (+ min twin) per category: roycss.<slug>.css lets
// consumers ship only the categories they use, exposed via the
// ./category/<slug> and ./category/<slug>/min package exports. Each
// split carries the shared BASE_CSS (box-sizing, .roycss-sr-only and
// the corpus-wide reduced-motion safety net) so a single-category
// install keeps the same a11y guarantees as the monolith — the base is
// idempotent when several splits are co-imported.
console.log("Building per-category splits...");
for (const cat of categoryOrder) {
  const catEffects = byCategory[cat];
  if (!catEffects || catEffects.length === 0) continue;
  const meta = categoryMeta[cat];
  const catHeader = `/*!
 * RoyCSS v${pkg.version} — ${meta.label} (${catEffects.length} effects)
 * Category split of dist/roycss.css — import "roycss/css" for all
 * ${categoryOrder.length} categories. https://github.com/Roy-Wanyoike/Roycss
 * License: MIT
 */

`;
  let catCSS = catHeader + BASE_CSS;
  for (const effect of catEffects) {
    catCSS += effect.cssCode + "\n\n";
  }
  writeFileSync(join(DIST_DIR, `roycss.${cat}.css`), catCSS, "utf-8");
  writeFileSync(
    join(DIST_DIR, `roycss.${cat}.min.css`),
    minifyCSS(catCSS, catHeader),
    "utf-8"
  );
}
console.log(`  ✓ dist/roycss.<slug>.css (+ .min) × ${categoryOrder.length} categories`);

// ─── Tailwind v4 integration stylesheet (issue #217b) ───────────
// Plain effect classes are NOT Tailwind-generated utilities, so an
// @utility transform would require rewriting every descendant selector,
// @keyframes and @supports block into &-nested form — unreliable across
// 2,000 effects. The honest recipe instead: a stylesheet that composes
// WITH Tailwind v4 via a single @import. Unlayered effect rules beat
// Tailwind's layered preflight/utilities on shared properties, so
// resets never punch holes in effects. The full recipe lives in the
// banner and in /docs/getting-started/frameworks#tailwind.
const TAILWIND_CSS = `/*!
 * RoyCSS v${pkg.version} — Tailwind v4 integration stylesheet
 * ${effects.length} production-ready CSS effects that compose with Tailwind v4.
 *
 * Usage (Tailwind v4 — in your main CSS entry):
 *
 *   @import "tailwindcss";
 *   @import "roycss/tailwind";
 *
 * That is the whole recipe. This file pulls in the full effect
 * stylesheet (dist/roycss.css). RoyCSS classes are plain, unlayered
 * CSS — they never collide with Tailwind utility names (roycss-* is a
 * reserved namespace) and, being unlayered, they deterministically win
 * over Tailwind's layered preflight resets without a single !important.
 *
 * Want Tailwind utilities to be able to OVERRIDE effect properties?
 * Declare the layer order before the imports:
 *
 *   @layer theme, base, roycss, components, utilities;
 *   @import "tailwindcss";
 *   @import "roycss/tailwind";
 *
 * Why not @utility for every effect? Registering a class as a Tailwind
 * utility requires anchoring each rule to its root class with &-nesting
 * and hoisting every @keyframes/@supports block — a lossy transform
 * across ${effects.length} effects with descendant selectors, state
 * variants and shared keyframes. The @import recipe keeps the authored
 * CSS byte-identical to the tested dist/roycss.css.
 *
 * https://github.com/Roy-Wanyoike/Roycss — License: MIT
 */

@import "./roycss.css";
`;
writeFileSync(join(DIST_DIR, "roycss.tailwind.css"), TAILWIND_CSS, "utf-8");
console.log(`  ✓ dist/roycss.tailwind.css (Tailwind v4 recipe)`);

// ─── SRI hash for CDN usage (issue #217c) ────────────────────────
// sha384 integrity attribute for dist/roycss.min.css, emitted next to
// the file it fingerprints and re-generated on every build so it can
// never drift. Documented in /docs/getting-started/installation#cdn.
const sri = `sha384-${createHash("sha384").update(minified, "utf8").digest("base64")}`;
writeFileSync(join(DIST_DIR, "roycss.min.css.sri.txt"), sri + "\n", "utf-8");
console.log(`  ✓ dist/roycss.min.css.sri.txt (${sri.slice(0, 20)}…)`);

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

// One serialization shared by both snapshot locations below — they must
// stay byte-identical (PF-049 snapshot-freshness parity).
const effectsJson = JSON.stringify(metadata, null, 2);

writeFileSync(join(DIST_DIR, "effects.json"), effectsJson, "utf-8");
console.log(`  ✓ dist/effects.json (${metadata.length} effects)`);

// CLI data snapshot (PF-049 / issue #169): same catalog as
// dist/effects.json, emitted at cli/effects.json so the documented
// artifact is reproducible from a clean clone. Sibling of the committed
// mcp-server/effects.json. NOTE: the cli/index.js bundle INLINES the
// catalog, so this file is a tooling/parity artifact, not a runtime
// dependency of the CLI — cli/package.json `files` intentionally does
// not ship it.
writeFileSync(join(CLI_DIR, "effects.json"), effectsJson, "utf-8");
console.log(`  ✓ cli/effects.json (${metadata.length} effects)`);

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

// ─── Unified manifest (PF-042 — dist/roycss.manifest.json) ──────
// The lean per-effect index (maturity, quality score, a11y tier,
// browser support) + the naming-convention gate. Unlike
// generate-build-artifacts.ts above (warn-and-continue), a manifest
// failure ABORTS the build: its naming gate is a policy gate, and the
// generator's ratchet baseline only lets it fail on NEW violations or
// a stale baseline — both demand human attention before publishing.
// (Previously this block sat INSIDE the catch above, so on the normal
// success path generate-manifest never ran — fixed while wiring the
// #217 distribution formats.)
console.log("");
console.log("Generating unified manifest...");
const manifestResult = spawnSync("bun", ["run", "scripts/generate-manifest.ts"], {
  cwd: join(import.meta.dir, ".."),
  stdio: "inherit",
});
if (manifestResult.status !== 0) {
  console.error("  ✗ generate-manifest failed (naming gate / catalog mismatch) — aborting build.");
  process.exit(1);
}
