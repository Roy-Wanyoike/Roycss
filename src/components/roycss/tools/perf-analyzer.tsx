"use client";

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  Gauge,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  Sparkles,
  Trash2,
  FileCode,
  Zap,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * PerfAnalyzer — a self-contained CSS performance analyzer.
 *
 * Paste a stylesheet and get a Lighthouse-style score (0–100) with
 * categorised findings (critical / warning / info) plus a "good practices"
 * section that praises compositor-friendly choices.
 *
 * Detection is heuristic (regex + brace matching) — NOT a full CSS parser.
 *
 * Limitations (v1):
 *  - @media / @supports nested rules ARE walked recursively, but @keyframes
 *    bodies are flat-scanned for property declarations (keyframe selectors
 *    `from` / `to` / `N%` are skipped automatically because they don't end
 *    in a colon).
 *  - Universal `*` inside :not(...) / :is(...) arguments is not counted
 *    (parens are stripped before counting).
 *  - box-shadow blur-radius parsing assumes the 3rd numeric is the blur
 *    (matches the standard `<ox> <oy> <blur>? <spread>? <color>?` shape).
 *  - Duplicate-property detection only looks at the flat prefix of a rule
 *    body (before any nested `{`), so CSS Nesting duplicates inside child
 *    blocks are not flagged.
 *  - Selector combinator counting treats a run of ` `, `>`, `+`, `~` as a
 *    single combinator transition. Whitespace inside `()` or `[]` is
 *    ignored.
 */

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

type Severity = "critical" | "warning" | "info" | "good";

interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  /** How many occurrences were detected. */
  count: number;
  suggestion: string;
  /** Total score impact (negative for issues, 0 for info-tier and positives). */
  points: number;
}

interface AnalysisReport {
  findings: Finding[];
  positives: Finding[];
  score: number;
  sizeBytes: number;
  gzipBytes: number;
  counts: { critical: number; warning: number; info: number; good: number };
}

const EMPTY_REPORT: AnalysisReport = {
  findings: [],
  positives: [],
  score: 100,
  sizeBytes: 0,
  gzipBytes: 0,
  counts: { critical: 0, warning: 0, info: 0, good: 0 },
};

/* ═══════════════════════════════════════════════════════════════
   CSS PARSING HELPERS  (dependency-free, defensive)
   ═══════════════════════════════════════════════════════════════ */

/** Strip /* ... *\/ comments (including multiline). */
function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Strip quoted strings ("..." and '...') — replaced with empty quotes so
 *  the column structure is preserved without their contents. */
function stripStrings(input: string): string {
  return input
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

/** Strip [...] blocks (attribute selectors / at-rule descriptors). */
function stripBrackets(input: string): string {
  return input.replace(/\[[^\]]*\]/g, "[]");
}

/** Strip (...) blocks (function args / pseudo-class args).
 *  Iteratively strips innermost first so nested parens are removed. */
function stripParens(input: string): string {
  let s = input;
  for (let i = 0; i < 6; i++) {
    const next = s.replace(/\(([^()]*)\)/g, "()");
    if (next === s) break;
    s = next;
  }
  return s;
}

interface CssBlock {
  selector: string;
  body: string;
  isAtRule: boolean;
}

/**
 * Walk the CSS and return all top-level {...} blocks. For each block, the
 * "selector" is the text between the previous block's closing brace (or
 * start-of-string / top-level `;`) and the opening `{`. Quoted strings
 * are honoured so braces inside `content: "}"` don't confuse the scanner.
 */
function findTopLevelBlocks(css: string): CssBlock[] {
  const blocks: CssBlock[] = [];
  let i = 0;
  const n = css.length;
  let depth = 0;
  let selectorStart = 0;
  let bodyStart = 0;
  while (i < n) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < n && css[i] !== q) {
        if (css[i] === "\\") i++;
        i++;
      }
      i++;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) {
        const selector = css.slice(selectorStart, i).trim();
        bodyStart = i + 1;
        blocks.push({
          selector,
          body: "",
          isAtRule: selector.startsWith("@"),
        });
      }
      depth++;
    } else if (ch === "}") {
      if (depth > 0) {
        depth--;
        if (depth === 0) {
          const block = blocks[blocks.length - 1];
          if (block) {
            block.body = css.slice(bodyStart, i);
          }
          selectorStart = i + 1;
        }
      }
    } else if (ch === ";" && depth === 0) {
      // Ends an at-statement like @import / @charset — moves the selector
      // start past it so the next rule's selector isn't polluted.
      selectorStart = i + 1;
    }
    i++;
  }
  return blocks;
}

/** Recursively collect all rule blocks, descending into @media / @supports
 *  (but NOT @keyframes — its body is keyframe selectors, not nested rules). */
function findAllBlocks(css: string): CssBlock[] {
  const top = findTopLevelBlocks(css);
  const out: CssBlock[] = [];
  for (const block of top) {
    out.push(block);
    if (
      block.isAtRule &&
      !/^@(-\w+-)?keyframes\b/i.test(block.selector) &&
      // Don't recurse into @font-face / @page / @viewport — their bodies are
      // flat descriptors, not nested rules.
      !/^@(-\w+-)?(font-face|page|viewport|counter-style|font-palette-values|property|color-profile)\b/i.test(
        block.selector,
      )
    ) {
      out.push(...findAllBlocks(block.body));
    }
  }
  return out;
}

/** Split a comma-separated selector list on top-level commas. */
function splitTopLevelCommas(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  let i = 0;
  const n = input.length;
  while (i < n) {
    const ch = input[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      current += ch;
      i++;
      while (i < n) {
        current += input[i];
        if (input[i] === q) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    else if (ch === "," && depth === 0) {
      out.push(current);
      current = "";
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  out.push(current);
  return out.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Count top-level combinator transitions in a selector — a run of
 * whitespace / `>` / `+` / `~` counts as ONE combinator. Whitespace
 * inside `()` or `[]` is ignored. Used to detect 4+ chain selectors.
 */
function countCombinators(input: string): number {
  const s = input.trim();
  let depth = 0;
  let count = 0;
  let inRun = false;
  let i = 0;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < n && s[i] !== q) i++;
      i++;
      inRun = false;
      continue;
    }
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      if (
        ch === " " ||
        ch === "\t" ||
        ch === "\n" ||
        ch === "\r" ||
        ch === ">" ||
        ch === "+" ||
        ch === "~"
      ) {
        if (!inRun) {
          count++;
          inRun = true;
        }
      } else {
        inRun = false;
      }
    }
    i++;
  }
  return count;
}

/* ═══════════════════════════════════════════════════════════════
   ISSUE DETECTORS
   ═══════════════════════════════════════════════════════════════ */

/** @import statements (blocks rendering). */
function countImports(css: string): number {
  const m = css.match(/@import\b/gi);
  return m ? m.length : 0;
}

/** Universal `*` selectors — strip strings / [] / () first. */
function countUniversal(css: string): number {
  const cleaned = stripParens(stripBrackets(stripStrings(css)));
  const m = cleaned.match(/\*/g);
  return m ? m.length : 0;
}

/** !important declarations. */
function countImportant(css: string): number {
  const m = css.match(/!important/gi);
  return m ? m.length : 0;
}

/** will-change: declarations. */
function countWillChange(css: string): number {
  const m = css.match(/\bwill-change\s*:/gi);
  return m ? m.length : 0;
}

/** backdrop-filter: declarations. */
function countBackdropFilter(css: string): number {
  const m = css.match(/\bbackdrop-filter\s*:/gi);
  return m ? m.length : 0;
}

/** filter: declarations whose value contains blur(...). */
function countFilterBlur(css: string): number {
  const re = /\bfilter\s*:\s*([^;}]+)(?:;|}|$)/gi;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    if (/blur\s*\(/i.test(m[1])) count++;
  }
  return count;
}

/** box-shadow declarations whose 3rd numeric (blur radius) exceeds 30px. */
function countBigBoxShadows(css: string): number {
  const re = /\bbox-shadow\s*:\s*([^;}]+)(?:;|}|$)/gi;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    const shadows = splitTopLevelCommas(m[1]);
    for (const shadow of shadows) {
      const nums = (shadow.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
      // blur radius is the 3rd numeric in `<ox> <oy> <blur>? <spread>? <color>?`
      // (with or without leading `inset`).
      const blur = nums[2];
      if (typeof blur === "number" && blur > 30) count++;
    }
  }
  return count;
}

interface KeyframesAnalysis {
  expensive: number;
  cheap: number;
  expensiveProps: string[];
}

/** Scan @keyframes bodies for expensive vs cheap animated properties. */
function analyzeKeyframes(css: string): KeyframesAnalysis {
  const expensiveSet = new Set([
    "box-shadow",
    "filter",
    "backdrop-filter",
    "border-radius",
    "margin",
    "padding",
    "top",
    "left",
    "right",
    "bottom",
    "width",
    "height",
    "background",
    "background-color",
    "background-image",
    "color",
  ]);
  const cheapSet = new Set(["transform", "opacity"]);
  let expensive = 0;
  let cheap = 0;
  const expensiveProps: string[] = [];

  const blocks = findAllBlocks(css);
  for (const block of blocks) {
    if (!/^@(-\w+-)?keyframes\b/i.test(block.selector)) continue;
    const propRe = /\b([a-zA-Z-]+)\s*:/g;
    let m: RegExpExecArray | null;
    while ((m = propRe.exec(block.body)) !== null) {
      const prop = m[1].toLowerCase();
      if (expensiveSet.has(prop)) {
        expensive++;
        if (!expensiveProps.includes(prop)) expensiveProps.push(prop);
      } else if (cheapSet.has(prop)) {
        cheap++;
      }
    }
  }
  return { expensive, cheap, expensiveProps };
}

/** Deep descendant selectors (4+ compound parts ⇒ 3+ combinator runs). */
function countDeepSelectors(css: string): number {
  const blocks = findAllBlocks(css);
  let count = 0;
  for (const block of blocks) {
    if (block.isAtRule || !block.selector) continue;
    for (const part of splitTopLevelCommas(block.selector)) {
      if (countCombinators(part) >= 3) count++;
    }
  }
  return count;
}

/** Selectors longer than 100 characters. */
function countLongSelectors(css: string): number {
  const blocks = findAllBlocks(css);
  let count = 0;
  for (const block of blocks) {
    if (block.isAtRule || !block.selector) continue;
    for (const part of splitTopLevelCommas(block.selector)) {
      if (part.length > 100) count++;
    }
  }
  return count;
}

/** Rules with no declarations. */
function countEmptyRules(css: string): number {
  const blocks = findAllBlocks(css);
  let count = 0;
  for (const block of blocks) {
    if (block.isAtRule) continue;
    const stripped = block.body.replace(/\s+/g, "");
    if (stripped === "" || stripped === "{}") count++;
  }
  return count;
}

/** Duplicate property declarations within the same rule (flat prefix only). */
function countDuplicateProps(css: string): number {
  const blocks = findAllBlocks(css);
  let duplicates = 0;
  for (const block of blocks) {
    if (block.isAtRule) continue;
    // Only analyze the flat part (before any nested block).
    const firstBrace = block.body.indexOf("{");
    const flat = firstBrace >= 0 ? block.body.slice(0, firstBrace) : block.body;
    const seen = new Map<string, number>();
    const decls = flat.split(";");
    for (const decl of decls) {
      const idx = decl.indexOf(":");
      if (idx <= 0) continue;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      if (!prop) continue;
      seen.set(prop, (seen.get(prop) ?? 0) + 1);
    }
    for (const v of seen.values()) {
      if (v > 1) duplicates += v - 1;
    }
  }
  return duplicates;
}

/* ═══════════════════════════════════════════════════════════════
   POSITIVE-PRACTICE DETECTORS
   ═══════════════════════════════════════════════════════════════ */

function countContain(css: string): number {
  const m = css.match(/\bcontain\s*:/gi);
  return m ? m.length : 0;
}

function countContentVisibility(css: string): number {
  const m = css.match(/\bcontent-visibility\s*:/gi);
  return m ? m.length : 0;
}

function countLogicalProps(css: string): number {
  const re =
    /\b(?:margin|padding|border|inset|block-size|inline-size)-(?:inline|block|start|end)\b/gi;
  const m = css.match(re);
  return m ? m.length : 0;
}

function countCssVars(css: string): number {
  const m = css.match(/--[a-zA-Z_][\w-]*\s*:/g);
  return m ? m.length : 0;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN ANALYZER
   ═══════════════════════════════════════════════════════════════ */

function analyze(rawCss: string): AnalysisReport {
  if (!rawCss.trim()) return EMPTY_REPORT;
  try {
    const css = stripComments(rawCss);
    const sizeBytes = new TextEncoder().encode(rawCss).length;
    const gzipBytes = Math.round(sizeBytes / 3.5);

    const findings: Finding[] = [];
    const positives: Finding[] = [];

    // ── @import (critical, −10 each) ──────────────────────────────
    const imports = countImports(css);
    if (imports > 0) {
      findings.push({
        id: "import",
        severity: "critical",
        title: "@import statements",
        description: `${imports} @import${imports === 1 ? "" : "s"} found. @import blocks rendering and serializes the network waterfall.`,
        count: imports,
        suggestion:
          'Use <link rel="stylesheet"> in the document head, or bundle imports at build time. Preload critical fonts instead of @importing them.',
        points: -10 * imports,
      });
    }

    // ── Universal selector (critical, −8 each) ───────────────────
    const universal = countUniversal(css);
    if (universal > 0) {
      findings.push({
        id: "universal",
        severity: "critical",
        title: "Universal selector *",
        description: `${universal} universal selector${universal === 1 ? "" : "s"} found. * has zero specificity but is the most expensive selector to match — the engine tests it against every element in the document.`,
        count: universal,
        suggestion:
          "Scope resets with a single class (e.g. .reset) or rely on inherited defaults. Avoid `*` inside descendant chains like `.foo *`.",
        points: -8 * universal,
      });
    }

    // ── Expensive properties in @keyframes (critical, −10 each) ──
    const kf = analyzeKeyframes(css);
    if (kf.expensive > 0) {
      findings.push({
        id: "kf-expensive",
        severity: "critical",
        title: "Expensive properties in @keyframes",
        description: `${kf.expensive} animation step${kf.expensive === 1 ? "" : "s"} animate expensive properties (${kf.expensiveProps.join(", ")}). These trigger repaint or recomposite on every frame and will jank on low-end devices.`,
        count: kf.expensive,
        suggestion:
          "Animate only `transform` and `opacity` — they run on the compositor thread. Use translate/scale/rotate for movement and opacity for fades.",
        points: -10 * kf.expensive,
      });
    }

    // ── filter: blur() (warning, −6 each) ────────────────────────
    const filterBlur = countFilterBlur(css);
    if (filterBlur > 0) {
      findings.push({
        id: "filter-blur",
        severity: "warning",
        title: "filter: blur() usage",
        description: `${filterBlur} filter: blur() declaration${filterBlur === 1 ? "" : "s"} found. Blur is GPU-expensive and re-rasterises on scroll/resize.`,
        count: filterBlur,
        suggestion:
          "If you must blur, apply it to a small element. Avoid animating blur values — animate opacity of a pre-blurred layer instead.",
        points: -6 * filterBlur,
      });
    }

    // ── Big box-shadow (warning, −4 each) ────────────────────────
    const bigShadow = countBigBoxShadows(css);
    if (bigShadow > 0) {
      findings.push({
        id: "big-shadow",
        severity: "warning",
        title: "Large box-shadow blur radius",
        description: `${bigShadow} box-shadow${bigShadow === 1 ? "" : "s"} with blur > 30px. Large blurs allocate big shadow maps and can cause scroll jank, especially when the element moves.`,
        count: bigShadow,
        suggestion:
          "Reduce the blur radius, or layer multiple smaller shadows for a similar soft look with less memory.",
        points: -4 * bigShadow,
      });
    }

    // ── Deep descendant selectors (warning, −3 each) ─────────────
    const deep = countDeepSelectors(css);
    if (deep > 0) {
      findings.push({
        id: "deep-selector",
        severity: "warning",
        title: "Deep descendant selectors",
        description: `${deep} selector${deep === 1 ? "" : "s"} with 4+ levels of nesting. The browser matches selectors right-to-left — long chains force many match attempts per element.`,
        count: deep,
        suggestion:
          "Flatten the DOM or use a single descriptive class. BEM-style `.block__element` keeps selectors to one compound part.",
        points: -3 * deep,
      });
    }

    // ── !important (warning beyond 2nd, −5 each; first 2 info) ──
    const imp = countImportant(css);
    if (imp > 0) {
      const extra = Math.max(0, imp - 2);
      findings.push({
        id: "important",
        severity: extra > 0 ? "warning" : "info",
        title: "!important usage",
        description: `${imp} !important declaration${imp === 1 ? "" : "s"}. The first two are tolerable; beyond that, specificity becomes unmanageable.`,
        count: imp,
        suggestion:
          "Increase selector specificity naturally (chain a class) instead of escalating with !important. Reserve it for genuine overrides like user stylesheets.",
        points: -5 * extra,
      });
    }

    // ── will-change (warning beyond 1st, −4 each; first 1 info) ─
    const wc = countWillChange(css);
    if (wc > 0) {
      const extra = Math.max(0, wc - 1);
      findings.push({
        id: "will-change",
        severity: extra > 0 ? "warning" : "info",
        title: "will-change usage",
        description: `${wc} will-change declaration${wc === 1 ? "" : "s"}. A single use is a useful hint; multiple force the browser to create layers eagerly and waste memory.`,
        count: wc,
        suggestion:
          "Apply will-change to at most one element at a time and remove it after the animation ends. Don't sprinkle it across many rules.",
        points: -4 * extra,
      });
    }

    // ── backdrop-filter (info, −2 each) ──────────────────────────
    const bd = countBackdropFilter(css);
    if (bd > 0) {
      findings.push({
        id: "backdrop-filter",
        severity: "info",
        title: "backdrop-filter usage",
        description: `${bd} backdrop-filter declaration${bd === 1 ? "" : "s"}. Necessary for frosted-glass effects, but expensive on low-end devices and inconsistent in older browsers.`,
        count: bd,
        suggestion:
          "Provide a solid/semi-transparent fallback via @supports. Limit backdrop-filter to one or two sticky elements per viewport.",
        points: -2 * bd,
      });
    }

    // ── Duplicate properties (info, −1 each) ─────────────────────
    const dupes = countDuplicateProps(css);
    if (dupes > 0) {
      findings.push({
        id: "duplicate-props",
        severity: "info",
        title: "Duplicate properties",
        description: `${dupes} duplicate property declaration${dupes === 1 ? "" : "s"} within a single rule. The later wins, but the earlier is dead code that still ships.`,
        count: dupes,
        suggestion:
          "Remove the dead declaration, or use the pattern intentionally as a fallback: place the fallback first, modern value second, with a comment.",
        points: -1 * dupes,
      });
    }

    // ── Long selectors (info, −1 each) ───────────────────────────
    const long = countLongSelectors(css);
    if (long > 0) {
      findings.push({
        id: "long-selector",
        severity: "info",
        title: "Very long selectors",
        description: `${long} selector${long === 1 ? "" : "s"} exceed 100 characters. Long selectors hurt readability and slightly slow matching.`,
        count: long,
        suggestion:
          "Extract a shorter class. If the length comes from chaining, consider a flatter DOM or BEM naming.",
        points: -1 * long,
      });
    }

    // ── Empty rules (info, −1 each) ──────────────────────────────
    const emptyRules = countEmptyRules(css);
    if (emptyRules > 0) {
      findings.push({
        id: "empty-rules",
        severity: "info",
        title: "Empty rules",
        description: `${emptyRules} rule${emptyRules === 1 ? "" : "s"} with no declarations. Pure dead bytes shipped to every user.`,
        count: emptyRules,
        suggestion:
          "Delete the rule or finish implementing it. Empty rules ship to every user for no benefit.",
        points: -1 * emptyRules,
      });
    }

    // ── Large stylesheet (warning if > 50KB) ─────────────────────
    if (sizeBytes > 50 * 1024) {
      findings.push({
        id: "big-css",
        severity: "warning",
        title: "Large stylesheet",
        description: `CSS is ${(sizeBytes / 1024).toFixed(1)}KB (gzip ~${(gzipBytes / 1024).toFixed(1)}KB). Over 50KB starts to materially delay first paint on slow connections.`,
        count: 1,
        suggestion:
          "Audit unused selectors with browser DevTools coverage. Split per-route CSS or extract critical CSS for above-the-fold.",
        points: -10,
      });
    }

    /* ──────────────── POSITIVES ──────────────── */

    if (kf.cheap > 0) {
      positives.push({
        id: "pos-anim-cheap",
        severity: "good",
        title: "Animating cheap properties",
        description: `${kf.cheap} animation step${kf.cheap === 1 ? "" : "s"} use transform or opacity — compositor-friendly.`,
        count: kf.cheap,
        suggestion:
          "Keep it up. These animations run on the GPU and stay smooth at 60fps even on mid-range hardware.",
        points: 0,
      });
    }

    const contain = countContain(css);
    if (contain > 0) {
      positives.push({
        id: "pos-contain",
        severity: "good",
        title: "Uses contain",
        description: `${contain} contain: declaration${contain === 1 ? "" : "s"}. Containment lets the browser skip layout and paint work outside the subtree.`,
        count: contain,
        suggestion:
          "Combine with `content-visibility: auto` for maximum skip-page-work benefits on long lists.",
        points: 0,
      });
    }

    const cv = countContentVisibility(css);
    if (cv > 0) {
      positives.push({
        id: "pos-cv",
        severity: "good",
        title: "Uses content-visibility",
        description: `${cv} content-visibility: declaration${cv === 1 ? "" : "s"}. Skips rendering off-screen content — huge wins on long pages.`,
        count: cv,
        suggestion:
          "Pair with `contain-intrinsic-size` so the scrollbar doesn't jump when content renders.",
        points: 0,
      });
    }

    const logical = countLogicalProps(css);
    if (logical > 0) {
      positives.push({
        id: "pos-logical",
        severity: "good",
        title: "Uses logical properties",
        description: `${logical} logical-property declaration${logical === 1 ? "" : "s"} (margin-inline, padding-block, etc.). Direction-agnostic and RTL-friendly.`,
        count: logical,
        suggestion:
          "Migrate physical properties (margin-left, padding-top) to their logical equivalents for internationalised layouts.",
        points: 0,
      });
    }

    const vars = countCssVars(css);
    if (vars > 0) {
      positives.push({
        id: "pos-vars",
        severity: "good",
        title: "Uses CSS custom properties",
        description: `${vars} custom property declaration${vars === 1 ? "" : "s"}. Theme-able, runtime-updatable, and inherited cheaply.`,
        count: vars,
        suggestion:
          "Define design tokens on :root and consume via var() — enables dark mode and theming without recompiling.",
        points: 0,
      });
    }

    /* ──────────────── SCORE ──────────────── */
    let penalty = 0;
    for (const f of findings) penalty += f.points;
    const score = Math.max(0, Math.min(100, 100 + penalty));

    const counts = {
      critical: findings.filter((f) => f.severity === "critical").length,
      warning: findings.filter((f) => f.severity === "warning").length,
      info: findings.filter((f) => f.severity === "info").length,
      good: positives.length,
    };

    return { findings, positives, score, sizeBytes, gzipBytes, counts };
  } catch {
    // Defensive — never crash on malformed CSS.
    return EMPTY_REPORT;
  }
}

/* ═══════════════════════════════════════════════════════════════
   EXAMPLE CSS  (~50 lines, deliberately mixed good/bad patterns)
   ═══════════════════════════════════════════════════════════════ */

const EXAMPLE_CSS = `/* Example CSS — mixed performance patterns */
@import url("https://fonts.example.com/icons.css");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.card.hero {
  background: #fff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  filter: blur(0.5px);
  will-change: transform, opacity, filter;
}

.a .b .c .d .e {
  color: #333;
  font-size: 14px;
}

.list :nth-child(3n+1) .item .label .title {
  font-weight: 600;
}

.button:hover {
  color: red !important;
  color: crimson !important;
  background: blue !important;
  border: 1px solid #ccc !important;
}

.modal.overlay {
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.5);
}

.empty-rule {
}

@keyframes shake {
  0%   { transform: translateX(0); }
  25%  { box-shadow: 0 0 20px red; }
  50%  { transform: translateX(-10px); }
  75%  { filter: blur(2px); border-radius: 4px; }
  100% { transform: translateX(10px); }
}

@keyframes spin {
  from { transform: rotate(0deg); opacity: 1; }
  to   { transform: rotate(360deg); opacity: 0.5; }
}

.layout {
  contain: layout paint;
  content-visibility: auto;
  margin-inline: auto;
  padding-block: 2rem;
  --brand: #ff6b6b;
}

.long-selector-name-here-which-is-definitely-over-one-hundred-characters-when-counted-up-against-the-limit {
  color: green;
}
`;

/* ═══════════════════════════════════════════════════════════════
   SEVERITY / TIER VISUAL CONFIG
   ═══════════════════════════════════════════════════════════════ */

const SEVERITY_BORDER: Record<Severity, string> = {
  critical: "border-l-rose-500",
  warning: "border-l-amber-500",
  info: "border-l-cyan-500",
  good: "border-l-emerald-500",
};

const SEVERITY_TEXT: Record<Severity, string> = {
  critical: "text-rose-500",
  warning: "text-amber-500",
  info: "text-cyan-500",
  good: "text-emerald-500",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
  good: "Good",
};

function SeverityIcon({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}): ReactNode {
  switch (severity) {
    case "critical":
      return <AlertCircle className={className} />;
    case "warning":
      return <AlertTriangle className={className} />;
    case "info":
      return <Info className={className} />;
    case "good":
      return <Check className={className} />;
  }
}

interface ScoreTier {
  color: string;
  stroke: string;
  label: string;
  blurb: string;
}

function scoreTier(score: number): ScoreTier {
  if (score >= 90) {
    return {
      color: "text-emerald-500",
      stroke: "text-emerald-500",
      label: "Excellent",
      blurb: "Excellent — this CSS will not be a performance bottleneck.",
    };
  }
  if (score >= 70) {
    return {
      color: "text-primary",
      stroke: "text-primary",
      label: "Good",
      blurb: "Good — a few optimisations would tighten things up.",
    };
  }
  if (score >= 50) {
    return {
      color: "text-amber-500",
      stroke: "text-amber-500",
      label: "Needs work",
      blurb: "Needs work — address the critical findings first.",
    };
  }
  return {
    color: "text-rose-500",
    stroke: "text-rose-500",
    label: "Poor",
    blurb: "Poor — significant performance debt. Tackle criticals immediately.",
  };
}

/* ═══════════════════════════════════════════════════════════════
   SCORE GAUGE  (SVG circle, dasharray trick)
   ═══════════════════════════════════════════════════════════════ */

function ScoreGauge({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const tier = scoreTier(score);
  const ariaLabel = `Performance score ${score} out of 100, ${tier.label}`;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          className="stroke-muted/30"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-700 ease-out",
            tier.stroke,
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn("text-3xl font-bold tabular-nums leading-none", tier.color)}
        >
          {score}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FINDING CARD
   ═══════════════════════════════════════════════════════════════ */

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div
      className={cn(
        "bg-card border border-border border-l-4 rounded-lg p-3",
        SEVERITY_BORDER[finding.severity],
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn("mt-0.5 shrink-0", SEVERITY_TEXT[finding.severity])}
          aria-hidden="true"
        >
          <SeverityIcon severity={finding.severity} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-foreground">
              {finding.title}
            </h4>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 h-4 tabular-nums"
            >
              ×{finding.count}
            </Badge>
            {finding.points < 0 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 h-4 text-muted-foreground tabular-nums"
              >
                {finding.points} pts
              </Badge>
            )}
            <span className="sr-only">{SEVERITY_LABEL[finding.severity]}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {finding.description}
          </p>
          <div className="mt-2 flex items-start gap-1.5 rounded bg-muted/40 p-2">
            <Lightbulb
              className="size-3.5 shrink-0 mt-0.5 text-amber-500"
              aria-hidden="true"
            />
            <p className="text-xs text-foreground/80 leading-relaxed">
              {finding.suggestion}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

type FilterKey = "all" | "critical" | "warning" | "info" | "good";

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  return `${(n / 1024).toFixed(1)}KB`;
}

export function PerfAnalyzer() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  // 300ms debounce + a brief "Analyzing…" indicator. The setAnalyzing(true)
  // call is deferred to a requestAnimationFrame so it doesn't trigger a
  // cascading render synchronously inside the effect body.
  useEffect(() => {
    if (input === debounced) return;
    const raf = window.requestAnimationFrame(() => setAnalyzing(true));
    const t = window.setTimeout(() => {
      setDebounced(input);
      setAnalyzing(false);
    }, 300);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [input, debounced]);

  const report = useMemo(() => analyze(debounced), [debounced]);

  const handleLoadExample = useCallback(() => setInput(EXAMPLE_CSS), []);
  const handleClear = useCallback(() => {
    setInput("");
    setFilter("all");
  }, []);

  // Build the visible list based on the active filter chip.
  const { issuesList, positivesList } = useMemo(() => {
    if (filter === "all") {
      const order: Severity[] = ["critical", "warning", "info"];
      const issues = [...report.findings].sort(
        (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity),
      );
      return { issuesList: issues, positivesList: report.positives };
    }
    if (filter === "good") {
      return { issuesList: [], positivesList: report.positives };
    }
    return {
      issuesList: report.findings.filter((f) => f.severity === filter),
      positivesList: [],
    };
  }, [filter, report]);

  const hasInput = input.trim().length > 0;
  // Positives get a "Good practices" subheader only when shown alongside
  // issues (filter === "all"). In "good" mode they ARE the list.
  const showGoodHeading = filter === "all";

  const chips: { key: FilterKey; label: string; count: number }[] = [
    {
      key: "all",
      label: "All",
      count: report.findings.length + report.positives.length,
    },
    { key: "critical", label: "Critical", count: report.counts.critical },
    { key: "warning", label: "Warnings", count: report.counts.warning },
    { key: "info", label: "Info", count: report.counts.info },
    { key: "good", label: "Good", count: report.counts.good },
  ];

  const tier = scoreTier(report.score);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Gauge className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            CSS Performance Analyzer
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Paste CSS to get a Lighthouse-style score and prioritised findings.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="perf-input"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            CSS
          </label>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleLoadExample}
              aria-label="Load example CSS"
              className="h-7 text-xs"
            >
              <Sparkles className="size-3.5" />
              Load example
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={!hasInput}
              aria-label="Clear CSS input"
              className="h-7 text-xs"
            >
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          </div>
        </div>
        <Textarea
          id="perf-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            "/* Paste your CSS here */\n.card {\n  box-shadow: 0 0 40px #000;\n  filter: blur(2px);\n}"
          }
          rows={8}
          spellCheck={false}
          className="font-mono text-xs leading-relaxed resize-y min-h-[180px]"
          aria-describedby="perf-help"
        />
        <p id="perf-help" className="text-[11px] text-muted-foreground">
          Heuristic analysis — not a full CSS parser. Comments are stripped
          before scanning. Analysis runs client-side; nothing leaves your
          browser.
        </p>
      </div>

      {/* Empty state */}
      {!hasInput && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Gauge className="size-6" />
          </div>
          <p className="text-sm font-medium text-foreground">No CSS yet</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Paste a stylesheet (or load the example) to score it 0–100 and
            surface performance hotspots.
          </p>
          <Button size="sm" onClick={handleLoadExample} className="mt-4 h-8">
            <Sparkles className="size-4" />
            Load example
          </Button>
        </div>
      )}

      {/* Report */}
      {hasInput && (
        <div className="space-y-3">
          {/* Stats summary bar */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
              <span className="font-semibold text-foreground">
                Score:{" "}
                <span className={tier.color}>
                  {report.score}/100
                </span>
              </span>
              <span className="text-muted-foreground" aria-hidden="true">
                ·
              </span>
              <span className="text-muted-foreground">
                {report.findings.length + report.positives.length} findings (
                {report.counts.critical} critical, {report.counts.warning}{" "}
                warnings, {report.counts.info} info)
              </span>
              <span className="text-muted-foreground" aria-hidden="true">
                ·
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <FileCode className="size-3" aria-hidden="true" />
                {formatBytes(report.sizeBytes)} (gzip ~
                {formatBytes(report.gzipBytes)})
              </span>
              {analyzing && (
                <span
                  className="inline-flex items-center gap-1 text-primary ml-auto"
                  aria-live="polite"
                >
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  Analyzing…
                </span>
              )}
            </div>
          </div>

          {/* Score gauge + tier label */}
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
            <ScoreGauge score={report.score} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Zap
                  className={cn("size-4", tier.color)}
                  aria-hidden="true"
                />
                <span
                  className={cn("text-base font-semibold", tier.color)}
                >
                  {tier.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-xs">
                {tier.blurb}
              </p>
            </div>
          </div>

          {/* Filter chips */}
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter findings by severity"
          >
            {chips.map((chip) => {
              const active = filter === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilter(chip.key)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {chip.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] tabular-nums",
                      active
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Findings list */}
          <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
            {issuesList.length === 0 && positivesList.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <Check
                  className="mx-auto size-6 text-emerald-500"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-medium text-foreground">
                  No findings in this category
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {filter === "all"
                    ? "No performance patterns detected — your CSS is very short or uses syntax we don't flag yet."
                    : "Try a different filter or paste different CSS."}
                </p>
              </div>
            )}

            {issuesList.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}

            {positivesList.length > 0 && (
              <div className={showGoodHeading ? "pt-2" : ""}>
                {showGoodHeading && (
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <Check
                      className="size-3.5 text-emerald-500"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                      Good practices
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  {positivesList.map((f) => (
                    <FindingCard key={f.id} finding={f} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
