/**
 * RoyCSS — OKLCH Color Format Audit
 *
 * Reads all `src/lib/effects-batch-*.ts` files, scans each effect's `cssCode`
 * for non-OKLCH color literals (hex, rgb, rgba, hsl, hsla), and records
 * violations with suggested OKLCH replacements.
 *
 * Output: `tests/i18n/results/color-violations.json`
 *
 * Run: `bun run tests/i18n/oklch-audit.ts`
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const BATCH_DIR = path.join(PROJECT_ROOT, "src", "lib");
const RESULTS_DIR = path.join(__dirname, "results");
const RESULTS_FILE = path.join(RESULTS_DIR, "color-violations.json");

// ---------------------------------------------------------------------------
// Color-matchers
// ---------------------------------------------------------------------------

interface ColorPattern {
  name: "hex" | "hex-short" | "hex-alpha" | "rgb" | "rgba" | "hsl" | "hsla";
  pattern: RegExp;
  // Approximate converter: takes the matched string and returns an OKLCH suggestion.
  convert: (match: string) => string;
}

// We exclude matches inside url(...) (e.g. data: URIs may contain #) and inside
// comments. We also exclude `#` followed by non-hex (e.g. `#id` in selectors).
const COLOR_PATTERNS: ColorPattern[] = [
  // 8-digit hex (with alpha) — #rrggbbaa
  {
    name: "hex-alpha",
    pattern: /#([0-9a-fA-F]{8})\b/g,
    convert: (m) => hexToOklch(m),
  },
  // 6-digit hex — #rrggbb
  {
    name: "hex",
    pattern: /#([0-9a-fA-F]{6})\b/g,
    convert: (m) => hexToOklch(m),
  },
  // 3-digit hex — #rgb (must come after 6-digit; both match same prefix)
  {
    name: "hex-short",
    pattern: /#([0-9a-fA-F]{3})\b(?!([0-9a-fA-F]))/g,
    convert: (m) => hexToOklch(m),
  },
  // rgba(r, g, b, a) and rgb(r, g, b)
  {
    name: "rgba",
    pattern: /\brgba?\(\s*([^)]+?)\s*\)/g,
    convert: (m) => rgbFnToOklch(m),
  },
  {
    name: "rgb",
    pattern: /\brgb\(\s*([^)]+?)\s*\)/g,
    convert: (m) => rgbFnToOklch(m),
  },
  // hsla(h, s%, l%, a) and hsl(h, s%, l%)
  {
    name: "hsla",
    pattern: /\bhsla?\(\s*([^)]+?)\s*\)/g,
    convert: (m) => hslFnToOklch(m),
  },
  {
    name: "hsl",
    pattern: /\bhsl\(\s*([^)]+?)\s*\)/g,
    convert: (m) => hslFnToOklch(m),
  },
];

// ---------------------------------------------------------------------------
// Color conversion utilities (approximate sRGB → OKLCH)
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length === 8) h = h.slice(0, 6); // strip alpha for the OKLCH suggestion
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return [L, a, b2];
}

function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [L, C, h];
}

function hexToOklch(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const [L, a, B] = linearToOklab(r, g, b);
  const [L2, C, h] = oklabToOklch(L, a, B);
  return `oklch(${L2.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(2)})`;
}

function rgbFnToOklch(fn: string): string {
  // Strip "rgb(" / "rgba(" and ")"
  const inner = fn.replace(/^\s*rgba?\(\s*/i, "").replace(/\s*\)\s*$/, "");
  const parts = inner.split(",").map((s) => s.trim());
  if (parts.length < 3) return `oklch(0 0 0) /* couldn't parse: ${fn} */`;
  const r = clamp01(parseFloat(parts[0]) / 255);
  const g = clamp01(parseFloat(parts[1]) / 255);
  const b = clamp01(parseFloat(parts[2]) / 255);
  const [L, a, B] = linearToOklab(r, g, b);
  const [L2, C, h] = oklabToOklch(L, a, B);
  const alpha = parts[3] ? ` / ${parts[3]}` : "";
  return `oklch(${L2.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(2)}${alpha})`;
}

function hslFnToOklch(fn: string): string {
  const inner = fn.replace(/^\s*hsla?\(\s*/i, "").replace(/\s*\)\s*$/, "");
  const parts = inner.split(",").map((s) => s.trim());
  if (parts.length < 3) return `oklch(0 0 0) /* couldn't parse: ${fn} */`;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  // HSL → RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m2 = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const [L2, a2, B2] = linearToOklab(r + m2, g + m2, b + m2);
  const [L3, C, hh] = oklabToOklch(L2, a2, B2);
  const alpha = parts[3] ? ` / ${parts[3]}` : "";
  return `oklch(${L3.toFixed(3)} ${C.toFixed(3)} ${hh.toFixed(2)}${alpha})`;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ColorViolation {
  file: string;
  effectId: string;
  effectCategory: string;
  line: number;
  column: number;
  lineContent: string;
  format: string;
  matched: string;
  suggestedOklch: string;
}

// ---------------------------------------------------------------------------
// Parser (same shape as logical-properties-audit.ts)
// ---------------------------------------------------------------------------

function listBatchFiles(): string[] {
  return fs
    .readdirSync(BATCH_DIR)
    .filter((f) => /^effects-batch-\d+\.ts$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)![0], 10);
      const nb = parseInt(b.match(/\d+/)![0], 10);
      return na - nb;
    })
    .map((f) => path.join(BATCH_DIR, f));
}

function parseBatchFile(
  filePath: string,
): Array<{ id: string; category: string; cssCode: string; cssLineOffset: number }> {
  const src = fs.readFileSync(filePath, "utf8");
  const effects: Array<{ id: string; category: string; cssCode: string; cssLineOffset: number }> = [];
  const idRegex = /\bid:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  const idPositions: Array<{ id: string; pos: number }> = [];
  while ((m = idRegex.exec(src)) !== null) {
    idPositions.push({ id: m[1], pos: m.index });
  }
  for (let i = 0; i < idPositions.length; i++) {
    const { id, pos } = idPositions[i];
    const end = i + 1 < idPositions.length ? idPositions[i + 1].pos : src.length;
    const block = src.slice(pos, end);
    const catMatch = block.match(/\bcategory:\s*"([^"]+)"/);
    const category = catMatch ? catMatch[1] : "unknown";
    const cssIdx = block.search(/\bcssCode:\s*`/);
    if (cssIdx === -1) continue;
    const cssStartInBlock = cssIdx + block.slice(cssIdx).indexOf("`") + 1;
    let j = cssStartInBlock;
    while (j < block.length) {
      if (block[j] === "\\" && j + 1 < block.length) {
        j += 2;
        continue;
      }
      if (block[j] === "`") break;
      j++;
    }
    const cssCode = block.slice(cssStartInBlock, j);
    const cssStartInFile = pos + cssStartInBlock;
    const cssLineOffset = src.slice(0, cssStartInFile).split("\n").length;
    effects.push({ id, category, cssCode, cssLineOffset });
  }
  return effects;
}

// Strip CSS comments, url(...) contents, @supports queries, and CSS Color L4
// relative-color syntax (`rgb(from ...)` / `hsl(from ...)`) before scanning for
// color literals. Relative-color is the modern way to derive colors from a base
// color and is NOT a violation — the base color itself should be OKLCH, but the
// `rgb(from ...)` / `hsl(from ...)` wrapper is fine.
function stripNonColorRegions(css: string): string {
  let out = css;
  // Remove block comments
  out = out.replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length));
  // Remove url(...) — replace contents with spaces
  out = out.replace(/\burl\(([^)]*)\)/g, (m) => `url(${" ".repeat(m.length - 5)})`);
  // Remove relative-color calls: rgb(from ...) / rgba(from ...) / hsl(from ...) / hsla(from ...)
  out = blankRelativeColorCalls(out);
  return out;
}

function blankRelativeColorCalls(css: string): string {
  // Walk the string; whenever we encounter `rgb(`, `rgba(`, `hsl(`, or `hsla(`
  // followed by optional whitespace and then `from`, blank out the entire
  // balanced call (replacing non-newline chars with spaces).
  const fnRegex = /\b(rgba?|hsla?)\s*\(/gi;
  const out: string[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = fnRegex.exec(css)) !== null) {
    const openParenEnd = m.index + m[0].length;
    // Peek ahead — is the next non-whitespace token `from`?
    const after = css.slice(openParenEnd);
    const fromMatch = after.match(/^\s*from\b/);
    if (!fromMatch) continue;
    // Find the matching close paren at depth 0
    let depth = 1;
    let j = openParenEnd;
    while (j < css.length && depth > 0) {
      const c = css[j];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      if (depth === 0) {
        j++; // consume the close paren
        break;
      }
      j++;
    }
    // Blank from m.index to j
    out.push(css.slice(lastIdx, m.index));
    const blanked = css.slice(m.index, j).replace(/[^\n]/g, " ");
    out.push(blanked);
    lastIdx = j;
    fnRegex.lastIndex = j;
  }
  out.push(css.slice(lastIdx));
  return out.join("");
}

function findColorViolations(
  filePath: string,
  effects: Array<{ id: string; category: string; cssCode: string; cssLineOffset: number }>,
): ColorViolation[] {
  const violations: ColorViolation[] = [];
  const fileRel = path.relative(PROJECT_ROOT, filePath);

  for (const eff of effects) {
    const cleaned = stripNonColorRegions(eff.cssCode);
    const lines = cleaned.split("\n");

    // Apply hex-alpha first, then hex (6-digit), then hex-short, then rgb/rgba, then hsl/hsla
    // — but only collect each match once. We do this by recording consumed ranges.
    const consumed: Array<{ start: number; end: number }> = [];
    const isConsumed = (start: number, end: number) =>
      consumed.some((c) => start < c.end && end > c.start);

    for (const { name, pattern, convert } of COLOR_PATTERNS) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(cleaned)) !== null) {
        if (isConsumed(m.index, m.index + m[0].length)) continue;
        consumed.push({ start: m.index, end: m.index + m[0].length });

        // Compute line + column
        let line = 1, col = 1;
        for (let k = 0; k < m.index; k++) {
          if (cleaned[k] === "\n") { line++; col = 1; } else col++;
        }
        const lineContent = (lines[line - 1] ?? "").trim();
        violations.push({
          file: fileRel,
          effectId: eff.id,
          effectCategory: eff.category,
          line: eff.cssLineOffset + line - 1,
          column: col,
          lineContent,
          format: name,
          matched: m[0],
          suggestedOklch: convert(m[0]),
        });
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const files = listBatchFiles();
  console.log(`\nScanning ${files.length} batch files for non-OKLCH color literals\n`);

  const allViolations: ColorViolation[] = [];
  let totalEffects = 0;

  for (const file of files) {
    const effects = parseBatchFile(file);
    totalEffects += effects.length;
    const violations = findColorViolations(file, effects);
    allViolations.push(...violations);
    console.log(
      `  ${path.relative(PROJECT_ROOT, file)}: ${effects.length} effects, ${violations.length} color violations`,
    );
  }

  // Summaries
  const byFormat: Record<string, number> = {};
  const byFile: Record<string, number> = {};
  const byEffect: Record<string, { count: number; file: string; category: string }> = {};

  for (const v of allViolations) {
    byFormat[v.format] = (byFormat[v.format] ?? 0) + 1;
    byFile[v.file] = (byFile[v.file] ?? 0) + 1;
    const key = `${v.file}::${v.effectId}`;
    if (!byEffect[key]) byEffect[key] = { count: 0, file: v.file, category: v.effectCategory };
    byEffect[key].count++;
  }

  const effectsWithViolations = Object.keys(byEffect).length;
  const oklchCount = countOklchOccurrences(files);

  const topViolations = Object.entries(byEffect)
    .map(([k, v]) => {
      const [file, effectId] = k.split("::");
      return { effectId, file, count: v.count, category: v.category };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalEffects,
      effectsWithColorViolations: effectsWithViolations,
      totalColorViolations: allViolations.length,
      violationsByFormat: byFormat,
      violationsByFile: byFile,
      oklchOccurrences: oklchCount,
      compliancePercent: +(((totalEffects - effectsWithViolations) / totalEffects) * 100).toFixed(2),
    },
    topViolations,
    violations: allViolations,
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));

  console.log(`\n────────────────────────────────────────────────────────────`);
  console.log(`OKLCH Color Format Audit Summary`);
  console.log(`────────────────────────────────────────────────────────────`);
  console.log(`Total effects scanned:        ${totalEffects}`);
  console.log(`Effects with ≥1 violation:    ${effectsWithViolations} (${((effectsWithViolations / totalEffects) * 100).toFixed(2)}%)`);
  console.log(`Effects fully OKLCH:          ${totalEffects - effectsWithViolations} (${(((totalEffects - effectsWithViolations) / totalEffects) * 100).toFixed(2)}%)`);
  console.log(`Total color violations:       ${allViolations.length}`);
  console.log(`OKLCH occurrences (for ref):  ${oklchCount}`);
  console.log(`\nViolations by format:`);
  for (const [fmt, count] of Object.entries(byFormat).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${fmt.padEnd(15)} ${count}`);
  }
  console.log(`\nTop 10 most-violating effects:`);
  for (const v of topViolations.slice(0, 10)) {
    console.log(`  ${v.count.toString().padStart(3)}× ${v.effectId.padEnd(35)} (${v.file})`);
  }
  console.log(`\nResults written to: ${path.relative(PROJECT_ROOT, RESULTS_FILE)}`);
  console.log(`────────────────────────────────────────────────────────────\n`);
}

function countOklchOccurrences(files: string[]): number {
  let total = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    const matches = src.match(/\boklch\(/g);
    total += matches ? matches.length : 0;
  }
  return total;
}

main();
