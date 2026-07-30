/**
 * compat/matrix.ts
 *
 * Reads compat/results/feature-audit.json + dist/roycss.css + dist/effects.json
 * and produces compat/results/support-matrix.json with:
 *   - the Baseline 2024 minimum browser versions
 *   - total effects (1 569)
 *   - count of effects whose every modern feature is Baseline 2024 compatible
 *   - count of effects that require a newer browser than Baseline 2024
 *   - per-feature support summary (passthrough from the audit)
 *   - per-effect classification (which features each effect uses + baseline flag)
 *
 * An effect's CSS block is the contiguous run of rules between its primary
 * `.roycss-<id> { ... }` selector and the next `.roycss-<other-id>` selector
 * (or the next effect-comment header, whichever comes first). Shared
 * `keyframes` and `supports` blocks immediately following the primary selector
 * are part of the effect block.
 *
 * Usage:  bun run compat/matrix.ts
 *
 * Inputs:
 *   - compat/results/feature-audit.json
 *   - dist/roycss.css
 *   - dist/effects.json
 *
 * Output:
 *   - compat/results/support-matrix.json
 *
 * Exit codes:
 *   0  matrix succeeded
 *   1  missing inputs (audit must run first)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Version = number | string | null;

interface BrowserSupport {
  chrome: Version;
  firefox: Version;
  safari: Version;
  edge: Version;
}

interface FeatureAuditRow {
  feature: string;
  name: string;
  category: string;
  count: number;
  firstSeen: string | null;
  firstSeenLine: number | null;
  browsers: BrowserSupport;
  baseline2024: boolean;
  reference: string;
}

interface FeatureAudit {
  generatedAt: string;
  cssPath: string;
  cssLines: number;
  cssBytes: number;
  effectsTotal: number;
  baseline2024: BrowserSupport;
  featureCount: number;
  features: FeatureAuditRow[];
}

interface EffectEntry {
  id: string;
  name: string;
  category: string;
}

interface EffectClassification {
  id: string;
  name: string;
  category: string;
  startLine: number;
  endLine: number;
  featuresUsed: string[];
  baseline2024: boolean;
  /** The non-baseline feature(s) that force the "requires newer" flag. */
  blockers: string[];
}

interface SupportMatrix {
  generatedAt: string;
  baseline2024: BrowserSupport;
  totalEffects: number;
  baselineCompatible: number;
  requiresNewer: number;
  features: Array<{
    feature: string;
    name: string;
    browsers: BrowserSupport;
    baseline2024: boolean;
    count: number;
    effectsUsing: number;
  }>;
  effects: EffectClassification[];
  /** Effects that fail Baseline 2024 (for quick human review). */
  requiresNewerEffects: Array<{ id: string; name: string; blockers: string[] }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    const newlines = match.match(/\n/g);
    return newlines ? newlines.join("") : " ";
  });
}

function buildLineOffsets(text: string): number[] {
  const offsets: number[] = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") offsets.push(i + 1);
  }
  return offsets;
}

function offsetToLine(offsets: number[], offset: number): number {
  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const auditPath = resolve(__dirname, "results", "feature-audit.json");
  const cssPath = resolve(ROOT, "dist/roycss.css");
  const effectsPath = resolve(ROOT, "dist/effects.json");
  const outPath = resolve(__dirname, "results", "support-matrix.json");

  if (!existsSync(auditPath)) {
    console.error(
      `[matrix] missing ${auditPath} — run \`bun run compat/audit.ts\` first.`,
    );
    process.exit(1);
  }
  if (!existsSync(cssPath) || !existsSync(effectsPath)) {
    console.error(`[matrix] missing dist/roycss.css or dist/effects.json.`);
    process.exit(1);
  }

  const audit = JSON.parse(readFileSync(auditPath, "utf8")) as FeatureAudit;
  const effects = JSON.parse(readFileSync(effectsPath, "utf8")) as EffectEntry[];
  const css = readFileSync(cssPath, "utf8");

  mkdirSync(resolve(__dirname, "results"), { recursive: true });

  // Comment-stripped source (newlines preserved) for feature scanning.
  const stripped = stripComments(css);
  const lineOffsets = buildLineOffsets(stripped);

  // Build a feature lookup map.
  const featureById = new Map<string, FeatureAuditRow>(
    audit.features.map((f) => [f.feature, f]),
  );

  // For each effect, find the line range of its CSS block.
  // Strategy: locate every `\n.roycss-<id>` selector occurrence. An effect's
  // "primary block" extends from its first selector occurrence to the line
  // before the next *different* effect's first selector occurrence (or end of
  // file).
  //
  // Some effects share their id with multiple selectors (e.g. `.roycss-x`,
  // `.roycss-x:hover`, `.roycss-x::before`). We collect all line numbers per
  // effect id and treat the block as the contiguous span starting at the
  // earliest occurrence and ending at the line before the next effect's
  // earliest occurrence.

  // First pass: find the first occurrence line for every effect id.
  const firstOccurrence = new Map<string, number>();
  for (const e of effects) {
    const re = new RegExp(`\\n\\.roycss-${e.id}\\b`, "g");
    const m = re.exec(stripped);
    if (m) {
      firstOccurrence.set(e.id, offsetToLine(lineOffsets, m.index + 1));
    }
  }

  // Sort effect ids by their first occurrence line.
  const orderedIds = [...firstOccurrence.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id, line]) => ({ id, line }));

  // Compute endLine for each effect (line before the next effect's start, or
  // the last line of the file).
  const totalLines = lineOffsets.length - 1;
  const classifications: EffectClassification[] = [];

  for (let i = 0; i < orderedIds.length; i++) {
    const { id, line: startLine } = orderedIds[i];
    const endLine =
      i + 1 < orderedIds.length ? orderedIds[i + 1].line - 1 : totalLines;

    // Slice the effect's block from the stripped CSS.
    const startOffset = lineOffsets[startLine - 1];
    const endOffset =
      endLine < lineOffsets.length ? lineOffsets[endLine] : stripped.length;
    const block = stripped.slice(startOffset, endOffset);

    // Check which features appear in this block. We use the FEATURE_PATTERNS
    // table defined at the bottom of this file (duplicated from audit.ts so
    // matrix.ts has no runtime import dependency).
    const featuresUsed: string[] = [];
    const blockers: string[] = [];
    for (const def of FEATURE_PATTERNS) {
      const re = new RegExp(def.source, def.flags);
      if (re.test(block)) {
        featuresUsed.push(def.id);
        const feature = featureById.get(def.id);
        if (feature && !feature.baseline2024) blockers.push(def.id);
      } else if (def.id === "nesting") {
        // Implicit CSS nesting: a child selector written directly inside a
        // parent rule without `&`. The regex above only catches explicit `&`.
        if (countImplicitNestingInBlock(block) > 0) {
          featuresUsed.push(def.id);
          const feature = featureById.get(def.id);
          if (feature && !feature.baseline2024) blockers.push(def.id);
        }
      }
    }

    const effect = effects.find((e) => e.id === id);
    classifications.push({
      id,
      name: effect?.name ?? id,
      category: effect?.category ?? "unknown",
      startLine,
      endLine,
      featuresUsed,
      baseline2024: blockers.length === 0,
      blockers,
    });
  }

  // Count baseline-compatible vs requires-newer.
  const baselineCompatible = classifications.filter((c) => c.baseline2024).length;
  const requiresNewer = classifications.length - baselineCompatible;

  // Effects with no modern features (pure legacy CSS) — count for reporting.
  const noModernFeatures = classifications.filter(
    (c) => c.featuresUsed.length === 0,
  ).length;

  // Per-feature effects-using count.
  const featureSummary = audit.features.map((f) => {
    const effectsUsing = classifications.filter((c) =>
      c.featuresUsed.includes(f.feature),
    ).length;
    return {
      feature: f.feature,
      name: f.name,
      browsers: f.browsers,
      baseline2024: f.baseline2024,
      count: f.count,
      effectsUsing,
    };
  });

  const requiresNewerEffects = classifications
    .filter((c) => !c.baseline2024)
    .map((c) => ({ id: c.id, name: c.name, blockers: c.blockers }));

  const matrix: SupportMatrix = {
    generatedAt: new Date().toISOString(),
    baseline2024: audit.baseline2024,
    totalEffects: effects.length,
    baselineCompatible,
    requiresNewer,
    features: featureSummary,
    effects: classifications,
    requiresNewerEffects,
  };

  // Strip the full per-effect list from the human-readable console output but
  // keep it in the JSON file for downstream tooling.
  const compactForLog = {
    ...matrix,
    effects: `[${matrix.effects.length} classifications — see JSON]`,
  };

  writeFileSync(outPath, JSON.stringify(matrix, null, 2) + "\n", "utf8");

  console.log(`[matrix] baseline 2024:`, audit.baseline2024);
  console.log(`[matrix] total effects:        ${matrix.totalEffects}`);
  console.log(`[matrix] baseline-compatible:  ${matrix.baselineCompatible}`);
  console.log(`[matrix] requires newer:       ${matrix.requiresNewer}`);
  console.log(
    `[matrix] effects with no modern features: ${noModernFeatures} ` +
      `(counted in baseline-compatible)`,
  );
  console.log(
    `[matrix] effects found in CSS: ${classifications.length} / ${effects.length}`,
  );
  console.log(`[matrix] wrote ${outPath}`);
  void compactForLog;
}

// ---------------------------------------------------------------------------
// Feature pattern table — must match audit.ts FEATURES[].pattern exactly.
// Duplicated here so matrix.ts has no runtime import dependency on audit.ts.
// ---------------------------------------------------------------------------

const FEATURE_PATTERNS: Array<{ id: string; source: string; flags: string }> = [
  { id: "oklch", source: "oklch\\(", flags: "gi" },
  { id: "color-mix", source: "color-mix\\(", flags: "gi" },
  { id: "light-dark", source: "light-dark\\(", flags: "gi" },
  { id: "property", source: "@property\\s+--", flags: "gi" },
  { id: "container", source: "@container\\b", flags: "gi" },
  { id: "has", source: ":has\\(", flags: "gi" },
  {
    id: "nesting",
    source: "(^|[\\s{>,+~])&[a-zA-Z0-9.#:>([{ ]",
    flags: "g",
  },
  { id: "inset", source: "\\binset\\s*:(?!\\s*-)", flags: "gi" },
  {
    id: "margin-inline",
    source: "\\bmargin-inline(?:-start|-end)?\\s*:",
    flags: "gi",
  },
  {
    id: "padding-inline",
    source: "\\bpadding-inline(?:-start|-end)?\\s*:",
    flags: "gi",
  },
  { id: "aspect-ratio", source: "\\baspect-ratio\\s*:", flags: "gi" },
  {
    id: "backdrop-filter",
    source: "\\b(?:-webkit-)?backdrop-filter\\s*:",
    flags: "gi",
  },
  {
    id: "mask-composite",
    source:
      "\\b(?:-webkit-)?mask(?:-composite|-image|-size|-repeat|-position|-mode)?\\s*:",
    flags: "gi",
  },
  {
    id: "scroll-timeline",
    source: "\\banimation-timeline\\s*:\\s*scroll",
    flags: "gi",
  },
  {
    id: "view-timeline",
    source: "\\banimation-timeline\\s*:\\s*view",
    flags: "gi",
  },
  { id: "interpolate-size", source: "\\binterpolate-size\\s*:", flags: "gi" },
  {
    id: "text-wrap",
    source: "\\btext-wrap\\s*:\\s*(?:balance|pretty)",
    flags: "gi",
  },
  { id: "starting-style", source: "@starting-style\\b", flags: "gi" },
];

/**
 * Count implicit CSS nesting occurrences inside a CSS block. Mirrors the
 * logic in audit.ts's `countImplicitNesting` — tracks `{`/`}` depth and
 * detects selector-like lines that appear at depth >= 1 (i.e. inside another
 * rule). Explicit `&` nesting is caught by the regex; this catches the
 * implicit form (child selectors written directly inside parent rules).
 */
function countImplicitNestingInBlock(block: string): number {
  const SELECTOR_LINE_RE =
    /^[ \t]*([.#:&a-zA-Z][\w.#:&\-+~ >,\[\]="'*()]*?)\s*\{[ \t]*$/;
  let depth = 0;
  let count = 0;
  for (const rawLine of block.split("\n")) {
    const line = rawLine.trimEnd();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    if (depth >= 1 && opens > 0 && !line.trimStart().startsWith("@")) {
      const m = SELECTOR_LINE_RE.exec(line);
      if (m) count++;
    }
    depth += opens - closes;
    if (depth < 0) depth = 0;
  }
  return count;
}

main();
