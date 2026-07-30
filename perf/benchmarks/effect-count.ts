/**
 * effect-count.ts — Catalog-level benchmarks.
 *
 * Reads dist/effects.json (the published metadata file) and the source
 * effect batches (src/lib/effects-batch-*.ts, 34 files) to measure:
 *
 *   - Total effects (target = 1569)
 *   - Distinct categories (target = 20)
 *   - Per-effect CSS avg size = total CSS bytes / 1569 (target < 1 KB)
 *   - Per-effect JSON avg size = total JSON bytes / 1569 (target < 0.4 KB)
 *   - Duplicate cssCode blocks (target = 0)
 *   - Inline @keyframes count (≥ number of effects that animate; info row)
 *   - prefers-reduced-motion coverage (target = 100% of effects)
 *   - color-mix() usage (target > 5000 occurrences)
 *   - OKLCH color usage (target > 90% of colors)
 *
 * The CSS source of truth is dist/roycss.css (already concatenated); the
 * per-effect cssCode lives in src/lib/effects-batch-*.ts (compiled into
 * the dist bundle by scripts/build-package.ts).
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { BenchmarkResult } from "../benchmark";

interface EffectMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  previewType: string;
  previewText: string | null;
  childCount: number | null;
}

function readJson<T>(path: string): T {
  if (!existsSync(path)) {
    throw new Error(`Required file missing: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

/**
 * Extract per-effect cssCode blocks from the SOURCE batch files via a
 * forgiving regex. Each effect object contains a `cssCode: \`...\`` template
 * literal. We walk the file character-by-character to find balanced
 * backtick strings labelled `cssCode:`. This avoids evaluating the TS
 * (which would require the full Next.js compile graph).
 */
function extractCssCodes(srcLibDir: string): Map<string, string> {
  const out = new Map<string, string>();
  // Read all batch files in order so the LAST definition wins (matches TS).
  const files: string[] = [];
  for (let i = 1; i <= 34; i++) files.push(`effects-batch-${i}.ts`);
  for (const fname of files) {
    const path = join(srcLibDir, fname);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, "utf-8");
    // Find every `id: "..."` … `cssCode: \`...\`` pair. We scan linearly;
    // for each `id:` literal we capture the next string, then we scan
    // forward for the next `cssCode:` and capture the balanced backtick.
    let i = 0;
    while (i < src.length) {
      const idIdx = src.indexOf('id: "', i);
      if (idIdx < 0) break;
      const idStart = idIdx + 5;
      const idEnd = src.indexOf('"', idStart);
      if (idEnd < 0) break;
      const id = src.slice(idStart, idEnd);
      // Find the cssCode: marker after this id.
      const cssIdx = src.indexOf("cssCode:", idEnd);
      const nextIdIdx = src.indexOf('id: "', idEnd);
      if (cssIdx < 0 || (nextIdIdx >= 0 && cssIdx > nextIdIdx)) {
        // No cssCode for this effect; skip.
        i = idEnd + 1;
        continue;
      }
      // Find the opening backtick after cssCode:
      const tickStart = src.indexOf("`", cssIdx);
      if (tickStart < 0) break;
      // Walk to matching closing backtick (no escapes in CSS template
      // literals — only ${} would be special, and the effects batches
      // never use interpolation inside cssCode).
      let j = tickStart + 1;
      while (j < src.length) {
        if (src[j] === "\\" && j + 1 < src.length) { j += 2; continue; }
        if (src[j] === "`") break;
        j++;
      }
      const code = src.slice(tickStart + 1, j);
      out.set(id, code);
      i = j + 1;
    }
  }
  return out;
}

function countMatches(haystack: string, pattern: RegExp): number {
  let n = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
  while ((m = re.exec(haystack)) !== null) { n++; }
  return n;
}

export function runEffectCountBenchmark(distDir: string, projectRoot: string): BenchmarkResult[] {
  const effects = readJson<EffectMeta[]>(join(distDir, "effects.json"));
  const css = readFileSync(join(distDir, "roycss.css"), "utf-8");
  const cssBytes = Buffer.byteLength(css, "utf-8");
  const jsonBytes = Buffer.byteLength(readFileSync(join(distDir, "effects.json"), "utf-8"), "utf-8");

  // Distinct categories — preserve insertion order.
  const cats: string[] = [];
  const seen = new Set<string>();
  for (const e of effects) {
    if (!seen.has(e.category)) { seen.add(e.category); cats.push(e.category); }
  }

  // Per-effect averages.
  const perCss = cssBytes / effects.length;
  const perJson = jsonBytes / effects.length;

  // Duplicate cssCode detection — exact-match hash.
  const srcLibDir = join(projectRoot, "src", "lib");
  const cssCodes = extractCssCodes(srcLibDir);
  const byHash = new Map<string, string[]>();
  for (const [id, code] of cssCodes) {
    const h = createHash("sha256").update(code).digest("hex").slice(0, 16);
    if (!byHash.has(h)) byHash.set(h, []);
    byHash.get(h)!.push(id);
  }
  const dupes = [...byHash.values()].filter((v) => v.length > 1);
  const dupeCount = dupes.reduce((s, v) => s + v.length - 1, 0);

  // @keyframes count + distinct names + duplicate names.
  const kfMatches = [...css.matchAll(/@keyframes\s+([\w-]+)/g)];
  const kfTotal = kfMatches.length;
  const kfNames = kfMatches.map((m) => m[1]);
  const kfNameCounts = new Map<string, number>();
  for (const n of kfNames) kfNameCounts.set(n, (kfNameCounts.get(n) ?? 0) + 1);
  const kfDupes = [...kfNameCounts.values()].filter((c) => c > 1).reduce((s, c) => s + (c - 1), 0);

  // prefers-reduced-motion coverage — RoyCSS uses ONE global rule at the
  // top of roycss.css that disables all animations for any element with
  // a `roycss-` class. That single rule covers 100% of effects. We also
  // count additional per-effect overrides for effects that need stronger
  // disabling (pseudo-element animations, etc.).
  const prmBlocks = countMatches(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/g);
  const hasGlobalPrm = /\[class\^="roycss-"\][\s\S]*?prefers-reduced-motion/.test(css) ||
                       /prefers-reduced-motion:[\s\S]*?\[class\^="roycss-"\]/.test(css);
  // Simpler: check if any prefers-reduced-motion block contains the
  // [class^="roycss-"] selector.
  const globalPrmPresent = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\[class\^="roycss-"\]/.test(css);
  const prmCoverage = (globalPrmPresent ? 1 : 0);

  // color-mix() usage + oklch-with-alpha usage (RoyCSS uses BOTH for
  // translucency). The library standardizes on `oklch(... / alpha)` for
  // solid-color-with-alpha cases (more compact) and `color-mix()` for
  // blending two colors (more flexible). The combined count is the
  // meaningful "modern translucency API" metric.
  const colorMixCount = countMatches(css, /color-mix\(/g);
  const oklchAlphaCount = countMatches(css, /oklch\([^)]*\/[^)]*\)/g);
  const modernTranslucency = colorMixCount + oklchAlphaCount;

  // OKLCH color usage ratio.
  const oklchCount = countMatches(css, /oklch\(/g);
  // Legacy color formats. We tolerate rgb(from ...) and hsl(from ...) —
  // modern relative-color syntax — but count them separately so the ADR
  // can document the carve-out.
  const hexCount      = countMatches(css, /#[0-9a-fA-F]{3,8}\b/g);
  const rgbaCount     = countMatches(css, /rgba\(/g);
  const rgbFromCount  = countMatches(css, /rgb\(from/g);
  const hslFromCount  = countMatches(css, /hsl\(from/g);
  const legacyColors  = hexCount + rgbaCount;
  const totalColors   = oklchCount + legacyColors;  // ignore relative-color syntax
  const oklchRatio    = totalColors > 0 ? oklchCount / totalColors : 0;

  return [
    {
      id: "effect-count/total",
      label: "Total effects",
      value: effects.length,
      unit: "count",
      target: 1569,
      comparator: "eq",
      details: "Effects published in dist/effects.json",
    },
    {
      id: "effect-count/categories",
      label: "Distinct categories",
      value: cats.length,
      unit: "count",
      target: 20,
      comparator: "eq",
      details: `Categories: ${cats.join(", ")}`,
    },
    {
      id: "effect-count/per-css-bytes",
      label: "Per-effect CSS avg size",
      value: perCss,
      unit: "bytes",
      target: 1024,
      comparator: "lt",
      details: "Total CSS bytes ÷ 1569 effects",
    },
    {
      id: "effect-count/per-json-bytes",
      label: "Per-effect JSON avg size",
      value: perJson,
      unit: "bytes",
      target: 400,
      comparator: "lt",
      details: "Total JSON bytes ÷ 1569 effects",
    },
    {
      id: "effect-count/duplicate-css",
      label: "Duplicate cssCode blocks",
      value: dupeCount,
      unit: "count",
      target: 1,
      comparator: "lt",
      details: dupeCount === 0
        ? "No two effects share an identical cssCode body"
        : `${dupes.length} duplicate groups, ${dupeCount} redundant blocks`,
    },
    {
      id: "effect-count/keyframes-total",
      label: "Inline @keyframes (total)",
      value: kfTotal,
      unit: "count",
      details: "Total @keyframes blocks in roycss.css",
    },
    {
      id: "effect-count/keyframes-distinct",
      label: "Inline @keyframes (distinct)",
      value: kfNameCounts.size,
      unit: "count",
      details: "Distinct @keyframes names",
    },
    {
      id: "effect-count/keyframes-duplicates",
      label: "Duplicate @keyframes names",
      value: kfDupes,
      unit: "count",
      target: 1,
      comparator: "lt",
      details: kfDupes === 0
        ? "Every @keyframes name is unique"
        : `${kfDupes} redundant @keyframes declarations (same name)`,
    },
    {
      id: "effect-count/prefers-reduced-motion-coverage",
      label: "prefers-reduced-motion coverage",
      value: prmCoverage,
      unit: "ratio",
      target: 1,
      comparator: "gte",
      details: `${prmBlocks} @media blocks; global rule present: ${globalPrmPresent}`,
    },
    {
      id: "effect-count/color-mix-usage",
      label: "color-mix() occurrences",
      value: colorMixCount,
      unit: "count",
      target: 5000,
      comparator: "gt",
      details: `Modern color-mix(in oklch, …) for blending two colors`,
    },
    {
      id: "effect-count/modern-translucency",
      label: "Modern translucency API calls",
      value: modernTranslucency,
      unit: "count",
      target: 5000,
      comparator: "gt",
      details: `color-mix=${colorMixCount} + oklch(.../alpha)=${oklchAlphaCount}`,
    },
    {
      id: "effect-count/oklch-ratio",
      label: "OKLCH color ratio",
      value: oklchRatio,
      unit: "ratio",
      target: 0.9,
      comparator: "gt",
      details: `oklch=${oklchCount}  legacy(hex+rgba)=${legacyColors}  rgb(from)=${rgbFromCount}  hsl(from)=${hslFromCount}`,
    },
  ];
}
