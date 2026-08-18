/**
 * Initial-letter service — generate ::first-letter CSS for a drop cap
 * from a size/sink/font configuration.
 *
 * Mock backend (no DB). Seeds 6 drop-cap presets covering medieval 3-line,
 * modern 2-line, raised-cap, sunken-5-line, colored-gradient, and ornate
 * serif treatments. Each generation produces a self-contained ::first-letter
 * rule with optional @supports fallback to the float hack.
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

// ─── Seed: 6 drop-cap presets ────────────────────────────────────────────
const SEED_PRESETS: InitialLetterPreset[] = [
  {
    id: "preset-medieval-3-line",
    name: "Medieval 3-Line",
    description:
      "Classic 3-line drop cap in a serif display face, sunk into the paragraph.",
    input: {
      selector: "article p:first-of-type",
      size: 3,
      sink: 3,
      dropCap: false,
      fontFamily: "display",
      fontWeight: 700,
      color: "#7a2c1a",
      multiplier: 1,
      align: "leading",
    },
  },
  {
    id: "preset-modern-2-line",
    name: "Modern 2-Line",
    description:
      "Tight 2-line sans-serif drop cap for editorial body copy.",
    input: {
      selector: "article p:first-of-type",
      size: 2,
      sink: 2,
      dropCap: false,
      fontFamily: "sans-serif",
      fontWeight: 800,
      color: "#1c1c1e",
      multiplier: 1,
      align: "leading",
    },
  },
  {
    id: "preset-raised-cap",
    name: "Raised Cap",
    description:
      "Sink=0 raises the cap so its baseline aligns with the first line.",
    input: {
      selector: "h1",
      size: 2,
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
    id: "preset-sunken-5-line",
    name: "Sunken 5-Line",
    description:
      "Large 5-line sunken cap for a magazine opener — high drama.",
    input: {
      selector: ".lede",
      size: 5,
      sink: 5,
      dropCap: false,
      fontFamily: "display",
      fontWeight: 900,
      color: "#111827",
      multiplier: 1,
      align: "leading",
    },
  },
  {
    id: "preset-colored-gradient",
    name: "Colored Gradient",
    description:
      "Drop cap with a vivid gradient color and slightly oversized font.",
    input: {
      selector: "article p:first-of-type",
      size: 3,
      sink: 3,
      dropCap: false,
      fontFamily: "sans-serif",
      fontWeight: 900,
      color: "#7c3aed",
      multiplier: 1.15,
      align: "first-baseline",
    },
  },
  {
    id: "preset-ornate-serif",
    name: "Ornate Serif",
    description:
      "Display serif with auto drop keyword and first-baseline alignment.",
    input: {
      selector: ".ornament",
      size: 4,
      sink: 4,
      dropCap: true,
      fontFamily: "display",
      fontWeight: 700,
      color: "#92400e",
      multiplier: 1,
      align: "first-baseline",
    },
  },
];

const presets: InitialLetterPreset[] = SEED_PRESETS.map((p) => ({ ...p }));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 6 drop-cap presets. Cached. */
export async function listPresets(): Promise<InitialLetterPreset[]> {
  return cacheWrap(
    "initial-letter:presets",
    () => Promise.resolve(presets.map((p) => ({ ...p }))),
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
