/**
 * Initial-letter service — generate ::first-letter CSS for a drop cap
 * from a size/sink/font configuration.
 *
 * The 8 presets cover the full range of `initial-letter` syntax: classic
 * drop caps (size 2-5, drop keyword), raised caps (sink=0), sunken caps
 * (sink<size), and decorator oversized caps. Each generation produces a
 * self-contained ::first-letter rule with optional @supports fallback to
 * the float hack.
 *
 * Reads are LRU-cached; generations cache per input hash.
 *
 * Reference: CSS Inline Layout Module Level 3 §2 (initial-letter).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { InitialLetterGenerateInput } from "./schema.js";

const log = createLogger("initial-letter");

// ─── Types ───────────────────────────────────────────────────────────────
export interface InitialLetterResult {
  /** The ::first-letter CSS rule. */
  css: string;
  /** @supports fallback rule using the float hack for older browsers. */
  fallbackCss: string;
  /** Whether the drop-cap or raised-cap shape is produced. */
  shape: "drop-cap" | "raised-cap";
  /** Human-readable summary. */
  explanation: string;
  /** Browser support info. */
  support: {
    baseline: string;
    chrome: string;
    safari: string;
    firefox: string;
  };
}

export interface InitialLetterPreset {
  id: string;
  name: string;
  description: string;
  input: InitialLetterGenerateInput;
  /** Generated CSS for this preset (pre-computed from input). */
  css: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function fontFamilyStack(
  family: InitialLetterGenerateInput["fontFamily"],
): string {
  switch (family) {
    case "serif":
      return '"Iowan Old Style", "Apple Garamond", Baskerville, "Times New Roman", serif';
    case "sans-serif":
      return '"SF Pro Display", "Helvetica Neue", Inter, system-ui, sans-serif';
    case "monospace":
      return '"SF Mono", "Fira Code", "JetBrains Mono", Menlo, monospace';
    case "display":
      return '"Playfair Display", "Bodoni 72", Didot, "Big Caslon", serif';
    default:
      return "serif";
  }
}

function buildCss(input: InitialLetterGenerateInput): string {
  const initial = input.dropCap
    ? `${input.size} drop`
    : input.sink === 0
      ? `${input.size} ${input.size}`
      : `${input.size} ${input.sink}`;
  const lines: string[] = [];
  lines.push(`${input.selector}::first-letter {`);
  lines.push(`  initial-letter: ${initial};`);
  lines.push(`  font-family: ${fontFamilyStack(input.fontFamily)};`);
  lines.push(`  font-weight: ${input.fontWeight};`);
  lines.push(`  color: ${input.color};`);
  if (input.multiplier !== 1) {
    lines.push(`  font-size: ${input.multiplier}em;`);
  }
  if (input.align !== "leading") {
    lines.push(`  initial-letter-align: ${input.align};`);
  }
  lines.push(`}`);
  return lines.join("\n");
}

function buildFallback(input: InitialLetterGenerateInput): string {
  // The legacy float hack: float the first letter and size it to match the
  // visual mass of the modern initial-letter. Approximation only.
  const sizeEm = input.size * 0.9;
  return [
    `/* Fallback: legacy float hack for browsers without initial-letter */`,
    `${input.selector}::first-letter {`,
    `  float: left;`,
    `  font-size: ${sizeEm}em;`,
    `  line-height: 0.8;`,
    `  margin-right: 0.08em;`,
    `  margin-top: 0.05em;`,
    `  font-family: ${fontFamilyStack(input.fontFamily)};`,
    `  font-weight: ${input.fontWeight};`,
    `  color: ${input.color};`,
    `}`,
  ].join("\n");
}

// ─── 8 real `initial-letter` presets ───────────────────────────────────────
// Each preset demonstrates a distinct `initial-letter` value:
//   Drop Cap 2   — 2-line drop cap (default sink = size)
//   Sunrise 3    — 3-line drop cap with first-baseline alignment
//   Raised 3 0   — 3-line raised cap (sink=0, baseline sits on first line)
//   Sunken 3 1   — 3-line cap sunk only 1 line (overhangs 2 lines above)
//   Big Drop 4   — 4-line drop cap, display serif, dramatic magazine opener
//   Title 1 5    — size=1 sunk 5 lines (tiny cap elevated to title slot)
//   Magazine 2 1 — 2-line cap sunk 1 (overhanging pull-quote lede)
//   Decorator 5  — 5-line drop with the `drop` keyword for explicit drop shape
const PRESETS: { id: string; name: string; description: string; input: InitialLetterGenerateInput }[] = [
  {
    id: "preset-drop-cap-2",
    name: "Drop Cap 2",
    description: "2-line drop cap sunk 2 lines into the paragraph — the textbook entry point.",
    input: {
      selector: "article p:first-of-type",
      size: 2,
      sink: 2,
      dropCap: false,
      fontFamily: "serif",
      fontWeight: 700,
      color: "#1c1c1e",
      multiplier: 1,
      align: "leading",
    },
  },
  {
    id: "preset-sunrise-3",
    name: "Sunrise 3",
    description: "3-line drop cap with first-baseline alignment — the cap 'rises' out of the paragraph like a sunrise.",
    input: {
      selector: "article p:first-of-type",
      size: 3,
      sink: 3,
      dropCap: false,
      fontFamily: "display",
      fontWeight: 700,
      color: "#b45309",
      multiplier: 1,
      align: "first-baseline",
    },
  },
  {
    id: "preset-raised-3-0",
    name: "Raised 3 0",
    description: "3-line raised cap with sink=0 — the cap sits above the first line, baseline-aligned with the body.",
    input: {
      selector: "h1",
      size: 3,
      sink: 0,
      dropCap: false,
      fontFamily: "serif",
      fontWeight: 700,
      color: "#0a60ff",
      multiplier: 1,
      align: "leading",
    },
  },
  {
    id: "preset-sunken-3-1",
    name: "Sunken 3 1",
    description: "3-line cap sunk only 1 line — the cap overhangs 2 lines above its baseline for a magazine-pull-quote feel.",
    input: {
      selector: ".lede",
      size: 3,
      sink: 1,
      dropCap: false,
      fontFamily: "display",
      fontWeight: 700,
      color: "#7c2d12",
      multiplier: 1,
      align: "leading",
    },
  },
  {
    id: "preset-big-drop-4",
    name: "Big Drop 4",
    description: "4-line drop cap in a display serif — high drama, the classic magazine opener.",
    input: {
      selector: "article p:first-of-type",
      size: 4,
      sink: 4,
      dropCap: false,
      fontFamily: "display",
      fontWeight: 800,
      color: "#111827",
      multiplier: 1,
      align: "leading",
    },
  },
  {
    id: "preset-title-1-5",
    name: "Title 1 5",
    description: "size=1 cap sunk 5 lines — a tiny cap floated up to a 5-line slot, used as a section title marker.",
    input: {
      selector: "section h2",
      size: 1,
      sink: 5,
      dropCap: false,
      fontFamily: "sans-serif",
      fontWeight: 900,
      color: "#374151",
      multiplier: 1.4,
      align: "leading",
    },
  },
  {
    id: "preset-magazine-2-1",
    name: "Magazine 2 1",
    description: "2-line cap sunk 1 line — the overhanging lede made famous by magazine layouts.",
    input: {
      selector: ".pull-quote p:first-of-type",
      size: 2,
      sink: 1,
      dropCap: false,
      fontFamily: "serif",
      fontWeight: 700,
      color: "#92400e",
      multiplier: 1,
      align: "leading",
    },
  },
  {
    id: "preset-decorator-5",
    name: "Decorator 5",
    description: "5-line drop using the `drop` keyword for an explicit drop shape — theatrical, oversized opening cap.",
    input: {
      selector: ".ornament p:first-of-type",
      size: 5,
      sink: 5,
      dropCap: true,
      fontFamily: "display",
      fontWeight: 700,
      color: "#7a2c1a",
      multiplier: 1,
      align: "first-baseline",
    },
  },
];

const presets: InitialLetterPreset[] = PRESETS.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  input: { ...p.input },
  css: buildCss(p.input),
}));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 8 initial-letter presets. Cached. */
export async function listPresets(): Promise<InitialLetterPreset[]> {
  return cacheWrap(
    "initial-letter:presets",
    () => Promise.resolve(presets.map((p) => ({
      ...p,
      input: { ...p.input },
      css: p.css,
    }))),
    CACHE_TTL.initialLetterPresets,
  );
}

/** Generate ::first-letter CSS from size/sink/font config. */
export async function generateInitialLetter(
  input: InitialLetterGenerateInput,
): Promise<InitialLetterResult> {
  const cacheKey = `initial-letter:gen:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      const css = buildCss(input);
      const fallbackCss = buildFallback(input);
      const shape: InitialLetterResult["shape"] =
        input.sink === 0 ? "raised-cap" : "drop-cap";
      const explanation =
        shape === "raised-cap"
          ? `A ${input.size}-line raised cap on ${input.selector}. ` +
            `Sink=0 keeps the cap's baseline on the first line so it ascends above.`
          : `A ${input.size}-line drop cap on ${input.selector} ` +
            `sunk ${input.sink} line${input.sink === 1 ? "" : "s"} into the paragraph.`;

      log.info("Initial letter generated", {
        selector: input.selector,
        size: input.size,
        sink: input.sink,
        shape,
      });

      return Promise.resolve({
        css,
        fallbackCss,
        shape,
        explanation,
        support: {
          baseline: "2024 (initial-letter)",
          chrome: "110+",
          safari: "9+",
          firefox: "131+",
        },
      });
    },
    CACHE_TTL.initialLetterGenerate,
  );
}
