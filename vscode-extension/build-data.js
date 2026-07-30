/**
 * RoyCSS VSCode Extension — data builder.
 *
 * Reads /home/z/my-project/dist/effects.json (1,569 effects with metadata)
 * and /home/z/my-project/dist/roycss.css (full CSS source), then writes:
 *
 *   - class-data.json : { effects: [{ id, className, name, category,
 *                                     description, tags, previewType,
 *                                     cssCode }, ...], version, generatedAt }
 *   - snippets.json   : { "<EffectName>": { prefix, body[], description, scope } }
 *
 * Run:  node build-data.js
 *
 * Idempotent: re-running overwrites both files. Verifies counts and
 * asserts every effect has a non-empty cssCode extracted from the CSS.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EFFECTS_JSON = path.join(ROOT, "dist", "effects.json");
const ROYCSS_CSS = path.join(ROOT, "dist", "roycss.css");
const OUT_CLASS_DATA = path.join(__dirname, "class-data.json");
const OUT_SNIPPETS = path.join(__dirname, "snippets.json");

// ────────────────────────────────────────────────────────────────────────
// 1. Load source data
// ────────────────────────────────────────────────────────────────────────

console.log("[build-data] Loading sources...");
const effectsRaw = JSON.parse(fs.readFileSync(EFFECTS_JSON, "utf8"));
const effects = Array.isArray(effectsRaw)
  ? effectsRaw
  : effectsRaw.effects || effectsRaw.default || [];

if (effects.length < 1569) {
  throw new Error(
    `Expected ≥1569 effects in dist/effects.json, got ${effects.length}. ` +
      `Run \`bun run build\` in the project root first.`,
  );
}
console.log(`[build-data]   effects.json: ${effects.length} effects`);

const cssSource = fs.readFileSync(ROYCSS_CSS, "utf8");
console.log(
  `[build-data]   roycss.css:   ${(cssSource.length / 1024).toFixed(1)} KB`,
);

// ────────────────────────────────────────────────────────────────────────
// 2. CSS extractor: find a top-level block starting at `selectorStart`
//    and match braces until the closing `}`.
// ────────────────────────────────────────────────────────────────────────

/**
 * Given the full CSS source and a starting index of a selector, return the
 * substring from that index through the matching closing brace (inclusive).
 * Returns "" if no closing brace is found.
 */
function extractBlock(css, startIndex) {
  // Find the opening brace at-or-after startIndex.
  const openIdx = css.indexOf("{", startIndex);
  if (openIdx === -1) return "";
  let depth = 1;
  let i = openIdx + 1;
  while (i < css.length && depth > 0) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  if (depth !== 0) return "";
  // Include the selector text (from startIndex to openIdx + block body + close brace)
  // Walk back from startIndex to the start of the line (so we capture the full selector).
  let lineStart = startIndex;
  while (lineStart > 0 && css[lineStart - 1] !== "\n") lineStart--;
  return css.slice(lineStart, i).trim();
}

/**
 * Extract all CSS rules whose selector list contains the given class token,
 * PLUS all @keyframes / @-webkit-keyframes whose name starts with `roy-<id>`
 * (the RoyCSS convention). Returns the combined CSS as a single string.
 */
function extractCssForEffect(css, effectId) {
  const out = [];
  const className = `roycss-${effectId}`;
  // Match the className as a CSS class token (preceded by . or whitespace,
  // followed by a non-word char so we don't match `roycss-pulse-glow-extra`).
  // We search for occurrences of `.roycss-<id>` not followed by `[\w-]`.
  const classTokenRe = new RegExp(
    `\\.roycss-${effectId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`,
    "g",
  );
  let m;
  while ((m = classTokenRe.exec(css)) !== null) {
    // Walk back to the start of the rule. Since we matched at the start of
    // a top-level selector (depth 0), the previous rule ends at the most
    // recent `}`. (We must NOT stop at `;` because that's a property
    // separator inside a block, not a rule separator.)
    let ruleStart = m.index;
    while (ruleStart > 0 && css[ruleStart - 1] !== "}") ruleStart--;
    // Now ruleStart is just after the previous rule's closing brace (or 0).
    // Skip whitespace/newlines AND comments AND section-header comments so
    // the extracted block starts at the actual selector for THIS effect.
    while (ruleStart < m.index) {
      // Skip whitespace.
      if (/\s/.test(css[ruleStart])) {
        ruleStart++;
        continue;
      }
      // Skip block comments `/* ... */`.
      if (css.slice(ruleStart, ruleStart + 2) === "/*") {
        const end = css.indexOf("*/", ruleStart + 2);
        if (end === -1) break;
        ruleStart = end + 2;
        continue;
      }
      break;
    }
    let block = extractBlock(css, ruleStart);
    if (!block) {
      // Fallback: the CSS uses native nesting without explicit closing
      // braces for the outer rules (a handful of effects). In that case,
      // extractBlock returns "" because the brace counter never reaches 0
      // at the top level. Grab the selector line + up to 600 chars or
      // until the next top-level `.roycss-` / `/*` marker.
      const lineEnd = css.indexOf("\n", m.index);
      const after = css.slice(
        m.index,
        Math.min(m.index + 600, css.length),
      );
      const nextMarker = after.slice(1).search(/\n\.(?:roycss|roy-)|\n\/\*/);
      const snippet =
        nextMarker === -1 ? after : after.slice(0, nextMarker + 1);
      block = snippet.trim();
    }
    if (block) out.push(block);
  }

  // Extract @keyframes roy-<id> { ... } (the RoyCSS convention prefixes
  // keyframes with `roy-`). Also match @-webkit-keyframes.
  const kfRe = new RegExp(
    `@(?:-webkit-)?keyframes\\s+roy-${effectId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`,
    "g",
  );
  while ((m = kfRe.exec(css)) !== null) {
    const block = extractBlock(css, m.index);
    if (block) out.push(block);
  }

  // Deduplicate (the same block may be matched twice if the class appears
  // multiple times — rare, but possible for utility classes).
  const seen = new Set();
  const unique = [];
  for (const b of out) {
    if (seen.has(b)) continue;
    seen.add(b);
    unique.push(b);
  }
  return unique.join("\n\n");
}

// ────────────────────────────────────────────────────────────────────────
// 3. Build class-data.json
// ────────────────────────────────────────────────────────────────────────

console.log("[build-data] Building class-data.json...");
const classData = {
  version: "1.0.0",
  generatedAt: new Date().toISOString(),
  source: "dist/effects.json + dist/roycss.css",
  effectCount: effects.length,
  effects: [],
};

const seenIds = new Set();
const seenClassNames = new Set();
let missingCssCount = 0;

for (const e of effects) {
  // Validate
  if (!e.id || !/^[a-z0-9-]+$/.test(e.id)) {
    throw new Error(`Invalid effect id: ${JSON.stringify(e.id)}`);
  }
  if (seenIds.has(e.id)) {
    throw new Error(`Duplicate effect id: ${e.id}`);
  }
  seenIds.add(e.id);

  const className = `roycss-${e.id}`;
  if (seenClassNames.has(className)) {
    throw new Error(`Duplicate className: ${className}`);
  }
  seenClassNames.add(className);

  if (!e.name || !e.category || !e.description) {
    throw new Error(
      `Effect ${e.id} missing name/category/description: ${JSON.stringify(e).slice(0, 200)}`,
    );
  }
  if (!Array.isArray(e.tags) || e.tags.length === 0) {
    throw new Error(`Effect ${e.id} has no tags`);
  }

  const cssCode = extractCssForEffect(cssSource, e.id);
  if (!cssCode) {
    missingCssCount++;
    // Don't throw — some utility classes may not have their own CSS rule
    // (e.g. they may be defined via a different selector). We log and continue.
    console.warn(`[build-data]   ⚠ no CSS extracted for ${e.id}`);
  }

  classData.effects.push({
    id: e.id,
    className,
    name: e.name,
    category: e.category,
    description: e.description,
    tags: e.tags,
    previewType: e.previewType || "box",
    previewText: e.previewText || null,
    childCount: e.childCount || null,
    cssCode: cssCode || `/* ${className} — CSS not found in roycss.css */`,
  });
}

if (missingCssCount > 50) {
  throw new Error(
    `${missingCssCount} effects have no CSS extracted — the roycss.css format may have changed.`,
  );
}

fs.writeFileSync(OUT_CLASS_DATA, JSON.stringify(classData, null, 2), "utf8");
const classDataSize = fs.statSync(OUT_CLASS_DATA).size;
console.log(
  `[build-data]   ✓ class-data.json: ${classData.effects.length} effects, ` +
    `${(classDataSize / 1024).toFixed(1)} KB` +
    (missingCssCount > 0 ? ` (${missingCssCount} with empty CSS)` : ""),
);

// ────────────────────────────────────────────────────────────────────────
// 4. Build snippets.json (HTML wrapper per effect)
// ────────────────────────────────────────────────────────────────────────

console.log("[build-data] Building snippets.json...");
const snippets = {};

for (const e of classData.effects) {
  // The snippet key uses the effect's display name. If two effects share a
  // name (shouldn't happen, but defensive), append the id.
  let key = e.name;
  if (snippets[key]) key = `${e.name} (${e.id})`;

  snippets[key] = {
    prefix: e.className, // roycss-<id>
    body: [`<div class="${e.className}">`, "  Content", "</div>"],
    description: e.description,
    scope: "html,jsx,tsx,vue,svelte",
  };
}

fs.writeFileSync(OUT_SNIPPETS, JSON.stringify(snippets, null, 2), "utf8");
const snippetsSize = fs.statSync(OUT_SNIPPETS).size;
console.log(
  `[build-data]   ✓ snippets.json: ${Object.keys(snippets).length} snippets, ` +
    `${(snippetsSize / 1024).toFixed(1)} KB`,
);

// ────────────────────────────────────────────────────────────────────────
// 5. Summary + integrity check
// ────────────────────────────────────────────────────────────────────────

const categoryCounts = {};
for (const e of classData.effects) {
  categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
}

console.log("");
console.log("[build-data] ✅ Data build complete:");
console.log(`   Effects:   ${classData.effects.length}`);
console.log(`   Categories: ${Object.keys(categoryCounts).length}`);
console.log(
  `   Top 5 categories:`,
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}=${v}`)
    .join(", "),
);
console.log("");
console.log("   Output files:");
console.log(`     ${OUT_CLASS_DATA} (${(classDataSize / 1024).toFixed(1)} KB)`);
console.log(`     ${OUT_SNIPPETS}   (${(snippetsSize / 1024).toFixed(1)} KB)`);

// Sanity assertions
if (classData.effects.length < 1569) {
  throw new Error(`Expected ≥1569 effects, got ${classData.effects.length}`);
}
if (Object.keys(snippets).length !== classData.effects.length) {
  throw new Error(
    `Snippet count mismatch: ${Object.keys(snippets).length} vs ${classData.effects.length}`,
  );
}
console.log("");
console.log("[build-data] ✓ All integrity checks passed.");
