/**
 * Extracts the top 100 RoyCSS effects (with cssCode) from the source library
 * and writes them to `inspector/src/effects-data.json` for embedding into the
 * Chrome extension.
 *
 * "Top 100" = first 100 effects from the master `effects` array, which is
 * ordered by recency of curation. Effect metadata is small (id/name/category/
 * description/tags/cssCode). We exclude previewType/previewText/childCount
 * since the extension only needs identification + css + framework tabs.
 *
 * Size budget: <50KB for the resulting .ts module (JSON-stringified).
 */
import { effects } from "../../../src/lib/roycss-effects";
import { writeFileSync } from "fs";
import { join } from "path";

const TOP_N = 100;

/** Strip comments and collapse whitespace from a CSS rule. */
function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "") // strip /* ... */ comments
    .replace(/\s+/g, " ") // collapse runs of whitespace
    .replace(/\s*([{}:;,>])\s*/g, "$1") // tighten around punctuation
    .replace(/;}/g, "}") // drop trailing semicolon before }
    .trim();
}

// Pick the first 100 effects — these are the most recently curated and span
// animations, hover, text, backgrounds, loaders, 3d-transforms, buttons, cards.
const picked = effects.slice(0, TOP_N).map((e) => ({
  id: e.id,
  name: e.name,
  category: e.category,
  description:
    e.description.length > 60
      ? e.description.slice(0, 57).trimEnd() + "..."
      : e.description,
  tags: e.tags.slice(0, 2), // cap at 2 tags per effect (kept lean for size budget)
  cssCode: minifyCss(e.cssCode),
}));

const json = JSON.stringify(picked);
const sizeKb = Buffer.byteLength(json, "utf-8") / 1024;

const outDir = join(import.meta.dir, "..", "src");
const outFile = join(outDir, "effects-data.json");
writeFileSync(outFile, json, "utf-8");

console.log(`Wrote ${picked.length} effects to ${outFile}`);
console.log(`Size: ${sizeKb.toFixed(1)}KB (budget: <50KB)`);
console.log(
  `Categories: ${[...new Set(picked.map((e) => e.category))].sort().join(", ")}`,
);
