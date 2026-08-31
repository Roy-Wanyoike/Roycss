/**
 * Logical-properties service — convert physical CSS properties to their
 * logical (direction-agnostic) equivalents and expose the full mapping
 * table.
 *
 * The converter does real, rule-based string replacement on the most
 * common physical properties (margin/padding/border/inset + -left/-right/
 * -top/-bottom, width/height, text-align, etc.). Edge cases (mixed logical
 * + physical, shorthand ordering) are noted in the returned warnings array.
 *
 * Reads are LRU-cached; conversions cache per input hash.
 *
 * Reference: CSS Logical Properties and Values Level 1.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { LogicalConvertInput } from "./schema.js";

const log = createLogger("logical-properties");

// ─── Types ───────────────────────────────────────────────────────────────
export interface LogicalMapping {
  physical: string;
  logical: string;
  /** Whether the logical form is widely supported (Baseline 2021+). */
  baseline: string;
  /** Example physical → logical usage. */
  example: { physical: string; logical: string };
}

export interface LogicalConvertResult {
  /** Converted CSS with logical properties substituted in. */
  css: string;
  /** Number of physical-property occurrences replaced. */
  replacedCount: number;
  /** Per-replacement breakdown for transparency. */
  replacements: { physical: string; logical: string; count: number }[];
  /** Warnings about edge cases the converter did not handle. */
  warnings: string[];
  /** The writing-mode hint the conversion assumed. */
  writingMode: string;
}

export interface LogicalPreset {
  id: string;
  name: string;
  description: string;
  /** Physical CSS input. */
  inputCss: string;
  /** Pre-computed converted output. */
  outputCss: string;
}

// ─── Mapping table ───────────────────────────────────────────────────────
const MAPPINGS: LogicalMapping[] = [
  {
    physical: "margin-left",
    logical: "margin-inline-start",
    baseline: "2021",
    example: { physical: "margin-left: 1rem;", logical: "margin-inline-start: 1rem;" },
  },
  {
    physical: "margin-right",
    logical: "margin-inline-end",
    baseline: "2021",
    example: { physical: "margin-right: 1rem;", logical: "margin-inline-end: 1rem;" },
  },
  {
    physical: "margin-top",
    logical: "margin-block-start",
    baseline: "2021",
    example: { physical: "margin-top: 1rem;", logical: "margin-block-start: 1rem;" },
  },
  {
    physical: "margin-bottom",
    logical: "margin-block-end",
    baseline: "2021",
    example: { physical: "margin-bottom: 1rem;", logical: "margin-block-end: 1rem;" },
  },
  {
    physical: "padding-left",
    logical: "padding-inline-start",
    baseline: "2021",
    example: { physical: "padding-left: 8px;", logical: "padding-inline-start: 8px;" },
  },
  {
    physical: "padding-right",
    logical: "padding-inline-end",
    baseline: "2021",
    example: { physical: "padding-right: 8px;", logical: "padding-inline-end: 8px;" },
  },
  {
    physical: "padding-top",
    logical: "padding-block-start",
    baseline: "2021",
    example: { physical: "padding-top: 8px;", logical: "padding-block-start: 8px;" },
  },
  {
    physical: "padding-bottom",
    logical: "padding-block-end",
    baseline: "2021",
    example: { physical: "padding-bottom: 8px;", logical: "padding-block-end: 8px;" },
  },
  {
    physical: "border-left",
    logical: "border-inline-start",
    baseline: "2021",
    example: { physical: "border-left: 1px solid #ccc;", logical: "border-inline-start: 1px solid #ccc;" },
  },
  {
    physical: "border-right",
    logical: "border-inline-end",
    baseline: "2021",
    example: { physical: "border-right: 1px solid #ccc;", logical: "border-inline-end: 1px solid #ccc;" },
  },
  {
    physical: "border-top",
    logical: "border-block-start",
    baseline: "2021",
    example: { physical: "border-top: 1px solid #ccc;", logical: "border-block-start: 1px solid #ccc;" },
  },
  {
    physical: "border-bottom",
    logical: "border-block-end",
    baseline: "2021",
    example: { physical: "border-bottom: 1px solid #ccc;", logical: "border-block-end: 1px solid #ccc;" },
  },
  {
    physical: "left",
    logical: "inset-inline-start",
    baseline: "2021",
    example: { physical: "left: 0;", logical: "inset-inline-start: 0;" },
  },
  {
    physical: "right",
    logical: "inset-inline-end",
    baseline: "2021",
    example: { physical: "right: 0;", logical: "inset-inline-end: 0;" },
  },
  {
    physical: "top",
    logical: "inset-block-start",
    baseline: "2021",
    example: { physical: "top: 0;", logical: "inset-block-start: 0;" },
  },
  {
    physical: "bottom",
    logical: "inset-block-end",
    baseline: "2021",
    example: { physical: "bottom: 0;", logical: "inset-block-end: 0;" },
  },
  {
    physical: "width",
    logical: "inline-size",
    baseline: "2021",
    example: { physical: "width: 320px;", logical: "inline-size: 320px;" },
  },
  {
    physical: "height",
    logical: "block-size",
    baseline: "2021",
    example: { physical: "height: 240px;", logical: "block-size: 240px;" },
  },
  {
    physical: "min-width",
    logical: "min-inline-size",
    baseline: "2021",
    example: { physical: "min-width: 100px;", logical: "min-inline-size: 100px;" },
  },
  {
    physical: "min-height",
    logical: "min-block-size",
    baseline: "2021",
    example: { physical: "min-height: 100px;", logical: "min-block-size: 100px;" },
  },
  {
    physical: "max-width",
    logical: "max-inline-size",
    baseline: "2021",
    example: { physical: "max-width: 640px;", logical: "max-inline-size: 640px;" },
  },
  {
    physical: "max-height",
    logical: "max-block-size",
    baseline: "2021",
    example: { physical: "max-height: 480px;", logical: "max-block-size: 480px;" },
  },
  {
    physical: "text-align: left",
    logical: "text-align: start",
    baseline: "2021",
    example: { physical: "text-align: left;", logical: "text-align: start;" },
  },
  {
    physical: "text-align: right",
    logical: "text-align: end",
    baseline: "2021",
    example: { physical: "text-align: right;", logical: "text-align: end;" },
  },
  {
    physical: "float: left",
    logical: "float: inline-start",
    baseline: "2024",
    example: { physical: "float: left;", logical: "float: inline-start;" },
  },
  {
    physical: "float: right",
    logical: "float: inline-end",
    baseline: "2024",
    example: { physical: "float: right;", logical: "float: inline-end;" },
  },
  {
    physical: "clear: left",
    logical: "clear: inline-start",
    baseline: "2024",
    example: { physical: "clear: left;", logical: "clear: inline-start;" },
  },
  {
    physical: "clear: right",
    logical: "clear: inline-end",
    baseline: "2024",
    example: { physical: "clear: right;", logical: "clear: inline-end;" },
  },
];

// ─── Conversion ──────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function convert(input: LogicalConvertInput): LogicalConvertResult {
  let css = input.css;
  let replacedCount = 0;
  const perKey = new Map<string, number>();
  const warnings: string[] = [];

  // Longest physical pattern first so "margin-left" wins over "left".
  const sorted = [...MAPPINGS].sort((a, b) => b.physical.length - a.physical.length);
  for (const m of sorted) {
    // Match the physical property at a word boundary to avoid partial matches
    // (e.g. don't rewrite the "left" inside ".is-left"). We require either the
    // start of line/whitespace or a non-identifier char before, and either ":"
    // or whitespace after.
    const re = new RegExp(`(^|[\\s;{])(${escapeRegex(m.physical)})(\\s*:)`, "g");
    css = css.replace(re, (_match, pre, _prop, post) => {
      replacedCount++;
      perKey.set(m.physical, (perKey.get(m.physical) ?? 0) + 1);
      return `${pre}${m.logical}${post}`;
    });
  }

  // Detect shorthands we cannot safely rewrite (e.g. "margin: 1rem 2rem").
  if (/(\bmargin|\bpadding|\bborder):\s*[^;}]+/i.test(input.css)) {
    warnings.push(
      "Shorthand margin/padding/border values were left as-is. Expand them " +
        "into per-side declarations before converting for full logical coverage.",
    );
  }
  // Detect vertical writing-mode (block/inline axes swap).
  if (input.writingMode.startsWith("vertical") || input.writingMode.startsWith("sideways")) {
    warnings.push(
      `writing-mode "${input.writingMode}" swaps the block and inline axes. ` +
        `The conversion above uses horizontal-tb semantics — review each rule.`,
    );
  }

  const replacements = Array.from(perKey.entries()).map(([physical, count]) => {
    const logical = MAPPINGS.find((m) => m.physical === physical)?.logical ?? "";
    return { physical, logical, count };
  });

  return {
    css,
    replacedCount,
    replacements,
    warnings,
    writingMode: input.writingMode,
  };
}

// ─── Presets: 4 real CSS snippets converted at module load ───────────────
const PRESETS: { id: string; name: string; description: string; inputCss: string }[] = [
  {
    id: "preset-card",
    name: "Card Box Model",
    description: "A simple card's margin + padding converted to logical equivalents.",
    inputCss: `.card {
  margin-left: 1rem;
  margin-right: 1rem;
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
  border-left: 1px solid #e5e5ea;
}`,
  },
  {
    id: "preset-positioned-badge",
    name: "Positioned Badge",
    description: "An absolutely-positioned badge using top/right/bottom/left.",
    inputCss: `.badge {
  position: absolute;
  top: 0;
  right: 0;
  left: auto;
  bottom: auto;
}`,
  },
  {
    id: "preset-text-block",
    name: "Text Block Alignment",
    description: "Convert text-align + float to start/end for RTL friendliness.",
    inputCss: `.pull-quote {
  float: left;
  text-align: left;
  width: 240px;
}`,
  },
  {
    id: "preset-form-field",
    name: "Form Field Sizing",
    description: "Form field with width/height/max-width swapped to inline/block-size.",
    inputCss: `.field {
  width: 100%;
  max-width: 320px;
  height: 40px;
  padding-left: 12px;
  padding-right: 12px;
}`,
  },
];

const presets: LogicalPreset[] = PRESETS.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  inputCss: p.inputCss,
  outputCss: convert({ css: p.inputCss, writingMode: "horizontal-tb" }).css,
}));

// ─── Public service API ──────────────────────────────────────────────────

/** Return the full physical → logical mapping table (28 entries). Cached. */
export async function getMapping(): Promise<LogicalMapping[]> {
  return cacheWrap(
    "logical:mapping",
    () => Promise.resolve(MAPPINGS.map((m) => ({ ...m }))),
    CACHE_TTL.logicalMapping,
  );
}

/** List all 4 logical-property presets (input + output CSS). Cached. */
export async function listPresets(): Promise<LogicalPreset[]> {
  return cacheWrap(
    "logical:presets",
    () => Promise.resolve(presets.map((p) => ({ ...p }))),
    CACHE_TTL.logicalPresets,
  );
}

/** Convert a physical CSS snippet to logical equivalents. */
export async function convertPhysical(
  input: LogicalConvertInput,
): Promise<LogicalConvertResult> {
  const cacheKey = `logical:convert:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      const result = convert(input);
      log.info("Physical CSS converted", {
        replaced: result.replacedCount,
        warnings: result.warnings.length,
      });
      return Promise.resolve(result);
    },
    CACHE_TTL.logicalConvert,
  );
}
