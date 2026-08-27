/**
 * Text-wrap service — analyze text wrapping for given properties + sample
 * text and return line count + balance score.
 *
 * Mock backend (no DB). The analyzer approximates browser text wrapping
 * using a greedy word-fit algorithm tuned for English text: words are
 * measured by their character count × an average advance width derived
 * from the font-size, then packed onto lines until adding the next word
 * would overflow the container width. Long words overflow according to
 * the word-break / overflow-wrap / hyphens properties.
 *
 * The balance score (0..100) measures how evenly text fills the lines
 * (excluding the final line, which is expected to be short). Higher is
 * better; `text-wrap: balance` would naturally produce a high score.
 *
 * Reads are LRU-cached; analyses cache per input hash.
 *
 * Reference: CSS Text Module Level 4 §5 (text-wrap).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { TextWrapAnalyzeInput } from "./schema.js";

const log = createLogger("text-wrap");

// ─── Types ───────────────────────────────────────────────────────────────
export interface TextWrapLine {
  /** 1-indexed line number. */
  n: number;
  /** Text content of the line. */
  text: string;
  /** Approximate width in px. */
  width: number;
}

export interface TextWrapResult {
  /** The generated CSS rule. */
  css: string;
  /** Lines produced by the greedy wrap algorithm. */
  lines: TextWrapLine[];
  /** Total line count. */
  lineCount: number;
  /** Balance score 0..100 (higher = more even line widths). */
  balanceScore: number;
  /** Per-property assessment. */
  assessment: {
    textWrap: string;
    hyphens: string;
    hangingPunctuation: string;
    wordBreak: string;
  };
  /** Human-readable summary. */
  explanation: string;
}

export interface TextWrapPreset {
  id: string;
  name: string;
  description: string;
  input: TextWrapAnalyzeInput;
}

// ─── Word-width approximation ────────────────────────────────────────────

/**
 * Average advance width per character at a given font-size, in px.
 * Empirically ~0.5× the font-size for body sans-serif fonts (slightly less
 * for narrow fonts, more for monospace). This is a heuristic — real layout
 * requires canvas measuring, which we approximate here.
 */
function avgCharWidth(fontSize: number): number {
  return fontSize * 0.5;
}

function wordWidthPx(word: string, fontSize: number): number {
  // Trim leading/trailing whitespace; collapse internal runs.
  return word.length * avgCharWidth(fontSize);
}

// ─── Greedy wrap algorithm ───────────────────────────────────────────────

function wrapText(input: TextWrapAnalyzeInput): TextWrapLine[] {
  const { text, containerWidth, fontSize, properties } = input;
  const space = avgCharWidth(fontSize);
  const max = containerWidth;

  // Tokenize on whitespace but keep paragraph breaks.
  const paragraphs = text.split(/\n+/);
  const lines: TextWrapLine[] = [];

  for (const para of paragraphs) {
    const tokens = para.split(/\s+/).filter((t) => t.length > 0);
    if (tokens.length === 0) {
      lines.push({ n: lines.length + 1, text: "", width: 0 });
      continue;
    }

    let current = "";
    let currentWidth = 0;

    const flush = (): void => {
      lines.push({
        n: lines.length + 1,
        text: current.trim(),
        width: currentWidth,
      });
      current = "";
      currentWidth = 0;
    };

    for (const token of tokens) {
      const w = wordWidthPx(token, fontSize);
      const withSpace = current.length === 0 ? w : currentWidth + space + w;

      if (withSpace <= max) {
        current = current.length === 0 ? token : `${current} ${token}`;
        currentWidth = withSpace;
        continue;
      }

      // Token doesn't fit on current line.
      if (current.length > 0) {
        flush();
      }

      // Token alone doesn't fit either — apply break/overflow rules.
      if (w <= max) {
        current = token;
        currentWidth = w;
        continue;
      }

      // Token is wider than the line. Handle per properties.
      if (
        properties.wordBreak === "break-all" ||
        properties.overflowWrap === "anywhere" ||
        properties.lineBreak === "anywhere"
      ) {
        // Break anywhere, character by character.
        for (const ch of token) {
          const cw = wordWidthPx(ch, fontSize);
          if (currentWidth + cw > max && current.length > 0) {
            flush();
          }
          current += ch;
          currentWidth += cw;
        }
      } else if (
        properties.overflowWrap === "break-word" ||
        properties.wordBreak === "break-word"
      ) {
        // Break only at word boundaries when the word is too long.
        current = token;
        currentWidth = w;
      } else if (properties.hyphens === "auto" || properties.wordBreak === "auto-phrase") {
        // Approximate hyphenation: split at 60% of the word.
        const splitAt = Math.floor(token.length * 0.6);
        const head = token.slice(0, splitAt) + "-";
        const tail = token.slice(splitAt);
        current = head;
        currentWidth = wordWidthPx(head, fontSize);
        flush();
        current = tail;
        currentWidth = wordWidthPx(tail, fontSize);
      } else {
        // Default: token overflows the line.
        current = token;
        currentWidth = w;
      }
    }
    if (current.length > 0) flush();
  }

  return lines;
}

// ─── Balance score ───────────────────────────────────────────────────────

function balanceScore(lines: TextWrapLine[], containerWidth: number): number {
  if (lines.length <= 1) return 100;
  // Exclude the final line from scoring (it's expected to be short).
  const scored = lines.slice(0, -1).filter((l) => l.width > 0);
  if (scored.length === 0) return 0;
  const widths = scored.map((l) => l.width);
  const min = Math.min(...widths);
  const max = Math.max(...widths);
  // Score = how close min/max is to 1 (perfect balance). Penalize when the
  // narrowest line is much shorter than the widest.
  const ratio = max === 0 ? 0 : min / max;
  const fullness = max / containerWidth; // how close to filling the container
  return Math.round(ratio * fullness * 100);
}

// ─── CSS emission ────────────────────────────────────────────────────────

function buildCss(input: TextWrapAnalyzeInput): string {
  const p = input.properties;
  const lines: string[] = [];
  lines.push(".text {");
  lines.push(`  text-wrap: ${p.textWrap};`);
  lines.push(`  text-wrap-mode: ${p.textWrapMode};`);
  lines.push(`  line-break: ${p.lineBreak};`);
  lines.push(`  word-break: ${p.wordBreak};`);
  lines.push(`  overflow-wrap: ${p.overflowWrap};`);
  lines.push(`  hyphens: ${p.hyphens};`);
  if (p.hangingPunctuation !== "none") {
    lines.push(`  hanging-punctuation: ${p.hangingPunctuation};`);
  }
  lines.push(`  text-align: ${p.textAlign};`);
  lines.push("}");
  return lines.join("\n");
}

// ─── 5 text-wrap presets: balance, pretty, stable, nowrap, wrap ───────────
const PRESETS: TextWrapPreset[] = [
  {
    id: "preset-balance",
    name: "Balance",
    description:
      "text-wrap: balance evens out line widths in headlines — best for short, attention-grabbing copy.",
    input: {
      text: "CSS is finally getting the typographic tools designers have wanted for decades",
      containerWidth: 360,
      fontSize: 28,
      lineHeight: 1.2,
      properties: {
        textWrap: "balance",
        textWrapMode: "wrap",
        lineBreak: "auto",
        wordBreak: "normal",
        overflowWrap: "normal",
        hyphens: "none",
        hangingPunctuation: "none",
        textAlign: "start",
      },
    },
  },
  {
    id: "preset-pretty",
    name: "Pretty",
    description:
      "text-wrap: pretty optimizes the last few lines of a paragraph so the final line isn't a single short word (the 'orphan' problem).",
    input: {
      text: "Modern CSS gives us text-wrap: pretty, which optimizes the final few lines of a paragraph so the last line doesn't end on a single short word. The browser picks better break points than the naive greedy algorithm.",
      containerWidth: 480,
      fontSize: 16,
      lineHeight: 1.6,
      properties: {
        textWrap: "pretty",
        textWrapMode: "wrap",
        lineBreak: "auto",
        wordBreak: "normal",
        overflowWrap: "normal",
        hyphens: "none",
        hangingPunctuation: "none",
        textAlign: "start",
      },
    },
  },
  {
    id: "preset-stable",
    name: "Stable",
    description:
      "text-wrap: stable locks the wrapping while the user types in an editable region — earlier lines don't reflow as the caret advances.",
    input: {
      text: "Editable content uses text-wrap: stable so wrapping doesn't shift while the user types — critical for contenteditable regions and live textareas.",
      containerWidth: 320,
      fontSize: 14,
      lineHeight: 1.5,
      properties: {
        textWrap: "stable",
        textWrapMode: "wrap",
        lineBreak: "auto",
        wordBreak: "normal",
        overflowWrap: "normal",
        hyphens: "none",
        hangingPunctuation: "none",
        textAlign: "start",
      },
    },
  },
  {
    id: "preset-nowrap",
    name: "No Wrap",
    description:
      "text-wrap: nowrap (or text-wrap-mode: nowrap) prevents line breaks entirely — overflow scrolls or clips. Used for code, badges, and inline labels.",
    input: {
      text: "ThisIsAnExtremelyLongUnbrokenIdentifierThatShouldNeverWrapEvenWhenItExceedsTheContainerWidth",
      containerWidth: 200,
      fontSize: 13,
      lineHeight: 1.4,
      properties: {
        textWrap: "nowrap",
        textWrapMode: "nowrap",
        lineBreak: "auto",
        wordBreak: "normal",
        overflowWrap: "normal",
        hyphens: "none",
        hangingPunctuation: "none",
        textAlign: "start",
      },
    },
  },
  {
    id: "preset-wrap",
    name: "Wrap",
    description:
      "text-wrap: wrap is the default greedy line-fill behavior — words are packed onto each line until the next would overflow.",
    input: {
      text: "Default greedy wrapping packs as many words as possible onto each line until the next would overflow the container. It's fast and predictable but can leave a ragged right edge.",
      containerWidth: 360,
      fontSize: 15,
      lineHeight: 1.5,
      properties: {
        textWrap: "wrap",
        textWrapMode: "wrap",
        lineBreak: "auto",
        wordBreak: "normal",
        overflowWrap: "normal",
        hyphens: "none",
        hangingPunctuation: "none",
        textAlign: "start",
      },
    },
  },
];

const presets: TextWrapPreset[] = PRESETS.map((p) => ({ ...p }));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 5 text-wrap presets. Cached. */
export async function listPresets(): Promise<TextWrapPreset[]> {
  return cacheWrap(
    "text-wrap:presets",
    () => Promise.resolve(presets.map((p) => ({ ...p }))),
    CACHE_TTL.textWrapPresets,
  );
}

/** Analyze text wrapping for the given properties + sample text. */
export async function analyzeTextWrap(
  input: TextWrapAnalyzeInput,
): Promise<TextWrapResult> {
  const cacheKey = `text-wrap:analyze:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      const lines = wrapText(input);
      const score = balanceScore(lines, input.containerWidth);
      const css = buildCss(input);

      const assessment = {
        textWrap:
          input.properties.textWrap === "balance"
            ? "Balances line widths — best for headlines."
            : input.properties.textWrap === "pretty"
              ? "Optimizes the last few lines — best for body paragraphs."
              : input.properties.textWrap === "stable"
                ? "Stable wrapping for editable regions — lines don't shift while typing."
                : "Greedy line-fill — the default browser behavior.",
        hyphens:
          input.properties.hyphens === "auto"
            ? "Hyphenation enabled — reduces ragged right edges on justified text."
            : "No auto-hyphenation — long words may overflow or wrap mid-word.",
        hangingPunctuation:
          input.properties.hangingPunctuation === "none"
            ? "Punctuation stays inside the text block."
            : "Punctuation hangs outside the measure — improves optical alignment.",
        wordBreak:
          input.properties.wordBreak === "break-all"
            ? "Breaks words at any character — useful for very narrow columns of code."
            : input.properties.wordBreak === "keep-all"
              ? "Preserves CJK word boundaries — no mid-word breaks."
              : "Default word breaking — breaks only at whitespace.",
      };

      const explanation =
        `Greedy approximation produced ${lines.length} line${lines.length === 1 ? "" : "s"} ` +
        `at ${input.containerWidth}px width. Balance score ${score}/100 ` +
        `(higher = more even line widths, excluding the final line).`;

      log.info("Text wrap analyzed", {
        textWrap: input.properties.textWrap,
        lines: lines.length,
        balanceScore: score,
      });

      return Promise.resolve({
        css,
        lines,
        lineCount: lines.length,
        balanceScore: score,
        assessment,
        explanation,
      });
    },
    CACHE_TTL.textWrapAnalyze,
  );
}
