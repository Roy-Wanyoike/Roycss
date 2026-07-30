/**
 * compat/audit.ts
 *
 * Scans dist/roycss.css for every modern CSS feature RoyCSS uses and emits
 * compat/results/feature-audit.json with per-feature:
 *   - occurrence count (every match across the file, including repeats)
 *   - firstSeen effect (the nearest preceding `.roycss-<id>` selector)
 *   - browser support matrix (Chrome / Firefox / Safari / Edge minimum versions)
 *   - baseline 2024 flag (true if the feature works in Baseline 2024 browsers:
 *     Chrome 123+, Firefox 121+, Safari 17.4+, Edge 123+)
 *
 * Usage:  bun run compat/audit.ts
 *
 * Inputs:
 *   - dist/roycss.css          (built CSS bundle, ~37 989 lines, 1 569 effects)
 *   - dist/effects.json        (effect id → name lookup)
 *
 * Output:
 *   - compat/results/feature-audit.json
 *
 * Exit codes:
 *   0  audit succeeded (always — even with 0 features found)
 *   1  unreadable input files
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Version = number | string | null; // null = not supported

interface BrowserSupport {
  chrome: Version;
  firefox: Version;
  safari: Version;
  edge: Version;
}

interface FeatureDef {
  /** Stable feature id, used as the JSON `feature` key. */
  id: string;
  /** Human-readable name shown in the report. */
  name: string;
  /** Specification category. */
  category:
    | "color"
    | "selectors"
    | "at-rules"
    | "layout"
    | "properties"
    | "animation";
  /** Regex applied to the raw CSS text. Use global flag for counting. */
  pattern: RegExp;
  /** Minimum browser versions that ship the feature (null = not supported). */
  browsers: BrowserSupport;
  /** True if the feature is available in Baseline 2024 browsers. */
  baseline2024: boolean;
  /** One-line caniuse / MDN reference. */
  reference: string;
}

interface FeatureAuditRow {
  feature: string;
  name: string;
  category: FeatureDef["category"];
  count: number;
  firstSeen: string | null;
  firstSeenLine: number | null;
  browsers: BrowserSupport;
  baseline2024: boolean;
  reference: string;
}

// ---------------------------------------------------------------------------
// Feature catalogue
// ---------------------------------------------------------------------------
//
// Baseline 2024 = Chrome 123+, Firefox 121+, Safari 17.4+, Edge 123+
// (https://web.dev/baseline  —  end-of-2024 snapshot)
//
// `browsers` is the MINIMUM version that ships the feature unprefixed (or with
// the widely-supported -webkit- prefix that RoyCSS already uses). `null` means
// the feature has not yet shipped in that browser as of 2026-07.
//
// Sources cross-checked:
//   - https://caniuse.com/  (per-feature tables)
//   - https://developer.mozilla.org/en-US/docs/Web/CSS/...
//   - https://web.dev/baseline
// ---------------------------------------------------------------------------

const BASELINE_2024: BrowserSupport = {
  chrome: 123,
  firefox: 121,
  safari: "17.4",
  edge: 123,
};

const FEATURES: FeatureDef[] = [
  {
    id: "oklch",
    name: "OKLCH color space",
    category: "color",
    pattern: /oklch\(/gi,
    browsers: { chrome: 111, firefox: 113, safari: "15.4", edge: 111 },
    baseline2024: true,
    reference: "https://caniuse.com/oklch",
  },
  {
    id: "color-mix",
    name: "color-mix() function",
    category: "color",
    pattern: /color-mix\(/gi,
    browsers: { chrome: 111, firefox: 113, safari: "16.2", edge: 111 },
    baseline2024: true,
    reference: "https://caniuse.com/css-color-mix",
  },
  {
    id: "light-dark",
    name: "light-dark() color function",
    category: "color",
    pattern: /light-dark\(/gi,
    browsers: { chrome: 123, firefox: 120, safari: "17.5", edge: 123 },
    baseline2024: true,
    reference: "https://caniuse.com/mdn-css_types_color_light-dark",
  },
  {
    id: "property",
    name: "@property typed custom properties",
    category: "at-rules",
    pattern: /@property\s+--/gi,
    browsers: { chrome: 85, firefox: 128, safari: "16.4", edge: 85 },
    baseline2024: true,
    reference: "https://caniuse.com/at-property",
  },
  {
    id: "container",
    name: "@container queries",
    category: "at-rules",
    pattern: /@container\b/gi,
    browsers: { chrome: 105, firefox: 110, safari: "16", edge: 105 },
    baseline2024: true,
    reference: "https://caniuse.com/css-container-queries",
  },
  {
    id: "has",
    name: ":has() relational pseudo-class",
    category: "selectors",
    pattern: /:has\(/gi,
    browsers: { chrome: 105, firefox: 121, safari: "15.4", edge: 105 },
    baseline2024: true,
    reference: "https://caniuse.com/css-has",
  },
  {
    id: "nesting",
    name: "CSS nesting (& selector)",
    category: "selectors",
    // Match `&` only when it appears at the start of a selector (post-comment-strip).
    // Inline `&` in strings/comments is filtered out by the comment stripper.
    pattern: /(^|[\s{>,+~])&[a-zA-Z0-9.#:>([{ ]/g,
    browsers: { chrome: 112, firefox: 117, safari: "16.5", edge: 112 },
    baseline2024: true,
    reference: "https://caniuse.com/css-nesting",
  },
  {
    id: "inset",
    name: "inset logical shorthand",
    category: "properties",
    pattern: /\binset\s*:(?!\s*-)/gi,
    browsers: { chrome: 87, firefox: 63, safari: "14.1", edge: 87 },
    baseline2024: true,
    reference: "https://caniuse.com/inset",
  },
  {
    id: "margin-inline",
    name: "margin-inline logical property",
    category: "properties",
    pattern: /\bmargin-inline(?:-start|-end)?\s*:/gi,
    browsers: { chrome: 87, firefox: 41, safari: "14.1", edge: 87 },
    baseline2024: true,
    reference: "https://caniuse.com/mdn-css_properties_margin-inline",
  },
  {
    id: "padding-inline",
    name: "padding-inline logical property",
    category: "properties",
    pattern: /\bpadding-inline(?:-start|-end)?\s*:/gi,
    browsers: { chrome: 87, firefox: 41, safari: "14.1", edge: 87 },
    baseline2024: true,
    reference: "https://caniuse.com/mdn-css_properties_padding-inline",
  },
  {
    id: "aspect-ratio",
    name: "aspect-ratio property",
    category: "properties",
    pattern: /\baspect-ratio\s*:/gi,
    browsers: { chrome: 88, firefox: 89, safari: "15", edge: 88 },
    baseline2024: true,
    reference: "https://caniuse.com/aspect-ratio",
  },
  {
    id: "backdrop-filter",
    name: "backdrop-filter",
    category: "properties",
    pattern: /\b(?:-webkit-)?backdrop-filter\s*:/gi,
    browsers: { chrome: 76, firefox: 103, safari: "18", edge: 79 },
    baseline2024: true,
    reference: "https://caniuse.com/backdrop-filter",
  },
  {
    id: "mask-composite",
    name: "mask / mask-composite",
    category: "properties",
    pattern: /\b(?:-webkit-)?mask(?:-composite|-image|-size|-repeat|-position|-mode)?\s*:/gi,
    browsers: { chrome: 120, firefox: 53, safari: "15.4", edge: 120 },
    baseline2024: true,
    reference: "https://caniuse.com/mdn-css_properties_mask-composite",
  },
  {
    id: "scroll-timeline",
    name: "scroll-timeline / animation-timeline: scroll()",
    category: "animation",
    pattern: /\banimation-timeline\s*:\s*scroll/gi,
    browsers: { chrome: 115, firefox: null, safari: null, edge: 115 },
    baseline2024: false,
    reference: "https://caniuse.com/css-scroll-driven-animations",
  },
  {
    id: "view-timeline",
    name: "view-timeline / animation-timeline: view()",
    category: "animation",
    pattern: /\banimation-timeline\s*:\s*view/gi,
    browsers: { chrome: 115, firefox: null, safari: null, edge: 115 },
    baseline2024: false,
    reference: "https://caniuse.com/css-scroll-driven-animations",
  },
  {
    id: "interpolate-size",
    name: "interpolate-size: allow-keywords",
    category: "properties",
    pattern: /\binterpolate-size\s*:/gi,
    browsers: { chrome: 129, firefox: null, safari: null, edge: 129 },
    baseline2024: false,
    reference: "https://caniuse.com/mdn-css_properties_interpolate-size",
  },
  {
    id: "text-wrap",
    name: "text-wrap: balance / pretty",
    category: "properties",
    pattern: /\btext-wrap\s*:\s*(?:balance|pretty)/gi,
    browsers: { chrome: 114, firefox: 121, safari: "17.5", edge: 114 },
    baseline2024: true,
    reference: "https://caniuse.com/css-text-wrap",
  },
  {
    id: "starting-style",
    name: "@starting-style at-rule",
    category: "at-rules",
    pattern: /@starting-style\b/gi,
    browsers: { chrome: 117, firefox: 129, safari: "17.5", edge: 117 },
    baseline2024: true,
    reference: "https://caniuse.com/mdn-css_at-rules_starting-style",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface EffectEntry {
  id: string;
  name: string;
  category: string;
}

function readEffects(path: string): EffectEntry[] {
  const raw = readFileSync(path, "utf8");
  const arr = JSON.parse(raw) as EffectEntry[];
  return arr;
}

/** Strip /* ... *‍/ comments while preserving newlines (so line numbers stay
 * accurate). Each comment becomes a run of `\n` characters equal to the number
 * of newlines it contained. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    const newlines = match.match(/\n/g);
    return newlines ? newlines.join("") : " ";
  });
}

/** Build a 0-indexed line lookup table: for each character offset → line number. */
function buildLineIndex(text: string): number[] {
  // Each entry is the offset where line N starts.
  const lines: number[] = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") lines.push(i + 1);
  }
  return lines;
}

function offsetToLine(lineIndex: number[], offset: number): number {
  // Binary search: largest line start <= offset.
  let lo = 0;
  let hi = lineIndex.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineIndex[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1; // 1-indexed line number
}

/**
 * Find the nearest preceding `.roycss-<id>` selector at the start of a line
 * before `offset`. Returns the effect id (without the `roycss-` prefix) and
 * the line number, or null if none found.
 *
 * `css` MUST be the comment-stripped source (with newlines preserved) so the
 * offsets and line numbers line up with the rest of the audit pipeline.
 */
function findPrecedingEffect(
  css: string,
  lineIndex: number[],
  offset: number,
  idToName: Map<string, string>,
): { id: string; name: string; line: number } | null {
  // Look backwards for `\n.roycss-<id>` (a selector at the start of a line).
  const searchStart = offset;
  const windowStart = Math.max(0, searchStart - 100_000); // bound the search
  const slice = css.slice(windowStart, searchStart);
  // Capture the effect id (letters, digits, hyphens) — greedy.
  const re = /\n\.roycss-([a-z0-9][a-z0-9-]*)/g;
  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(slice)) !== null) lastMatch = m;
  if (!lastMatch) return null;
  const id = lastMatch[1];
  const absOffset = windowStart + lastMatch.index + 1; // +1 to skip the \n
  const line = offsetToLine(lineIndex, absOffset);
  return { id, name: idToName.get(id) ?? id, line };
}

// ---------------------------------------------------------------------------
// Implicit CSS nesting detection
// ---------------------------------------------------------------------------
//
// RoyCSS uses implicit CSS nesting (a child selector written directly inside
// a parent rule without `&`). The `&` regex pattern catches the explicit form
// but not the implicit form. These helpers count and locate implicit-nested
// selectors by tracking `{` / `}` depth and detecting selector-like lines
// that appear at depth >= 1.
//
// A "selector-like line" is one that begins (after stripping leading
// whitespace) with a `.`, `#`, `:`, or alphabetic character, ends with ` {`,
// and is NOT an at-rule (i.e. does not start with `@`).

const SELECTOR_LINE_RE = /^[ \t]*([.#:&a-zA-Z][\w.#:&\-+~ >,\[\]="'*()]*?)\s*\{[ \t]*$/;

function countImplicitNesting(stripped: string): number {
  let depth = 0;
  let count = 0;
  for (const rawLine of stripped.split("\n")) {
    const line = rawLine.trimEnd();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    // If we're already inside a rule (depth >= 1) and this line opens a new
    // brace and looks like a selector (not an at-rule, not a `}`-only line),
    // it's an implicit-nested selector.
    if (depth >= 1 && opens > 0 && !line.trimStart().startsWith("@")) {
      const m = SELECTOR_LINE_RE.exec(line);
      if (m) count++;
    }
    depth += opens - closes;
    if (depth < 0) depth = 0; // defensive — underclosed rules
  }
  return count;
}

function findFirstImplicitNestedSelector(stripped: string): number | null {
  let depth = 0;
  let charOffset = 0;
  for (const rawLine of stripped.split("\n")) {
    const line = rawLine.trimEnd();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (depth >= 1 && opens > 0 && !line.trimStart().startsWith("@")) {
      const m = SELECTOR_LINE_RE.exec(line);
      if (m) {
        // Return the offset of the start of the selector (after leading
        // whitespace).
        return charOffset + (line.length - line.trimStart().length);
      }
    }
    charOffset += rawLine.length + 1; // +1 for the \n
    depth += opens - closes;
    if (depth < 0) depth = 0;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const cssPath = resolve(ROOT, "dist/roycss.css");
  const effectsPath = resolve(ROOT, "dist/effects.json");
  const outDir = resolve(__dirname, "results");
  const outPath = resolve(outDir, "feature-audit.json");

  let css: string;
  let effects: EffectEntry[];
  try {
    css = readFileSync(cssPath, "utf8");
    effects = readEffects(effectsPath);
  } catch (err) {
    console.error(`[audit] failed to read inputs: ${(err as Error).message}`);
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  const idToName = new Map<string, string>(
    effects.map((e) => [e.id, e.name]),
  );

  // Strip comments so feature patterns do not match comment text. Newlines
  // are preserved so line numbers stay accurate vs. the original CSS file.
  const cssStripped = stripComments(css);
  const lineIndex = buildLineIndex(cssStripped);

  console.log(
    `[audit] dist/roycss.css — ${lineIndex.length - 1} lines, ` +
      `${css.length.toLocaleString()} bytes (${cssStripped.length.toLocaleString()} after comment strip).`,
  );
  console.log(`[audit] effects.json — ${effects.length} effects.`);

  const rows: FeatureAuditRow[] = [];
  for (const def of FEATURES) {
    // Re-create the regex with the global flag to count occurrences.
    const re = new RegExp(def.pattern.source, def.pattern.flags);
    let count = 0;
    let firstOffset: number | null = null;
    let m: RegExpExecArray | null;
    while ((m = re.exec(cssStripped)) !== null) {
      count++;
      if (firstOffset === null) firstOffset = m.index;
      // Defensive: avoid zero-length match infinite loop.
      if (m.index === re.lastIndex) re.lastIndex++;
    }

    // CSS nesting is special: the regex above only catches explicit `&`
    // nesting. RoyCSS additionally uses IMPLICIT nesting (a child selector
    // written directly inside a parent rule without `&`). Count that form
    // separately by tracking `{`/`}` depth and detecting selector-like lines
    // that appear at depth >= 1.
    if (def.id === "nesting") {
      const implicit = countImplicitNesting(cssStripped);
      count += implicit;
      // If we did not already find an explicit-& firstSeen, take the first
      // implicit-nested selector as firstSeen.
      if (firstOffset === null && implicit > 0) {
        const firstImplicit = findFirstImplicitNestedSelector(cssStripped);
        if (firstImplicit !== null) {
          firstOffset = firstImplicit;
        }
      }
    }

    let firstSeen: string | null = null;
    let firstSeenLine: number | null = null;
    if (firstOffset !== null) {
      const hit = findPrecedingEffect(cssStripped, lineIndex, firstOffset, idToName);
      if (hit) {
        firstSeen = hit.name;
        firstSeenLine = hit.line;
      }
    }

    rows.push({
      feature: def.id,
      name: def.name,
      category: def.category,
      count,
      firstSeen,
      firstSeenLine,
      browsers: def.browsers,
      baseline2024: def.baseline2024,
      reference: def.reference,
    });
  }

  // Sort by count descending for the human-readable preview.
  const sorted = [...rows].sort((a, b) => b.count - a.count);

  const report = {
    generatedAt: new Date().toISOString(),
    cssPath: "dist/roycss.css",
    cssLines: lineIndex.length - 1,
    cssBytes: css.length,
    effectsTotal: effects.length,
    baseline2024: BASELINE_2024,
    featureCount: rows.length,
    features: sorted,
  };

  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  // Human-readable summary.
  console.log("\n[audit] feature usage (top 18, sorted by count):");
  console.log(
    "  feature            count   firstSeen                  baseline  chrome  firefox  safari  edge",
  );
  for (const row of sorted) {
    const b = row.browsers;
    const fmt = (v: Version) => (v === null ? "—" : String(v));
    console.log(
      `  ${row.feature.padEnd(18)} ${String(row.count).padStart(6)}   ` +
        `${(row.firstSeen ?? "—").padEnd(26)} ` +
        `${row.baseline2024 ? "yes" : "no "}       ` +
        `${fmt(b.chrome).padStart(6)}  ` +
        `${fmt(b.firefox).padStart(7)}  ` +
        `${fmt(b.safari).padStart(6)}  ` +
        `${fmt(b.edge).padStart(5)}`,
    );
  }

  const totalBaseline = sorted.filter((r) => r.baseline2024).length;
  console.log(
    `\n[audit] wrote ${outPath} — ${sorted.length} features, ` +
      `${totalBaseline} Baseline 2024 compatible, ` +
      `${sorted.length - totalBaseline} require newer browsers.`,
  );
}

main();
