/**
 * RoyCSS CSS Lint Engine (PF-036 V1 slice — shared by `roycss lint` CLI,
 * `scripts/audit-important.ts`, and the in-browser Code Health tool).
 *
 * Design constraints:
 *  - Pure, dependency-free, framework-free: runs in Node/Bun (CLI), Vitest
 *    (tests), and the browser (Code Health tool). No DOM, no fs, no node APIs.
 *  - Findings carry exact line/column positions (1-based) for editor integration.
 *  - Auto-fixes are conservative: only transformations that cannot change
 *    visual output are applied (a11y guard insertion, roycss- class prefixing).
 *    Risky fixes (stripping !important) are reported but never auto-applied.
 *
 * Rules (V1):
 *  - no-important          !important outside an a11y reduced-motion guard
 *  - oklch-colors          hex/rgb()/rgba()/hsl()/hsla() color literals
 *  - roycss-prefix         known effect ids used without the `roycss-` prefix
 *  - reduced-motion-guard  stylesheet lacks any prefers-reduced-motion guard
 *  - layer-order           @layer statement order deviates from the
 *                          recommended RoyCSS cascade skeleton
 */

// ============================================================
// Types
// ============================================================

export type LintSeverity = "error" | "warning" | "info";

export type LintRuleId =
  | "no-important"
  | "oklch-colors"
  | "roycss-prefix"
  | "reduced-motion-guard"
  | "layer-order";

export interface LintFinding {
  rule: LintRuleId;
  severity: LintSeverity;
  message: string;
  /** 1-based line number. 0 = whole-file finding. */
  line: number;
  /** 1-based column number. 0 = whole-file finding. */
  column: number;
  /** The offending text snippet (trimmed). */
  snippet?: string;
  /** Machine-readable extra detail (e.g. color count, expected layer order). */
  detail?: Record<string, string | number | boolean>;
  /** Whether `--fix` / applyFixes can safely repair this finding. */
  fixable: boolean;
}

export interface LintSummary {
  errors: number;
  warnings: number;
  infos: number;
  /** Findings that are allowed by policy (e.g. !important inside a11y guards). */
  allowed: number;
}

export interface LintResult {
  findings: LintFinding[];
  summary: LintSummary;
}

export interface LintOptions {
  /** Known RoyCSS effect ids (without prefix) for the roycss-prefix rule. */
  knownEffectIds?: string[];
  /**
   * !important occurrences inside a11y reduced-motion guards are allowed.
   * Set false to flag them too (stricter mode, default true = per policy).
   */
  allowA11yImportant?: boolean;
  /** Disable individual rules. */
  disabledRules?: LintRuleId[];
  /**
   * Expected @layer order for layer-order rule. When absent the RoyCSS
   * recommended skeleton is used.
   */
  expectedLayerOrder?: string[];
}

/** Recommended @layer declaration order for RoyCSS output (PF-035). */
export const RECOMMENDED_LAYER_ORDER = [
  "tokens",
  "reset",
  "base",
  "elements",
  "layout",
  "components",
  "effects",
  "utilities",
] as const;

// ============================================================
// Rule: no-important
// ============================================================

interface MediaBlock {
  start: number;
  end: number;
  isReducedMotion: boolean;
}

/**
 * Locate top-level @media blocks (supports nesting one level for @supports).
 * Returns character offsets so !important occurrences can be classified.
 */
function findMediaBlocks(css: string): MediaBlock[] {
  const blocks: MediaBlock[] = [];
  const re = /@media[^{]*\{/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    const header = match[0];
    const start = match.index;
    // Walk braces to find the matching close.
    let depth = 1;
    let i = start + header.length;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    const isReducedMotion = /prefers-reduced-motion\s*:\s*reduce/i.test(header);
    blocks.push({ start, end: i, isReducedMotion });
    re.lastIndex = i;
  }
  return blocks;
}

export function lintNoImportant(
  css: string,
  allowA11yImportant: boolean,
): LintFinding[] {
  const findings: LintFinding[] = [];
  const blocks = findMediaBlocks(css);
  const importantRe = /!important/gi;
  let match: RegExpExecArray | null;
  while ((match = importantRe.exec(css)) !== null) {
    const idx = match.index;
    const inGuard = blocks.some(
      (b) => idx >= b.start && idx < b.end && b.isReducedMotion,
    );
    if (inGuard && allowA11yImportant) {
      continue; // allowed by policy
    }
    const { line, column } = indexToLineCol(css, idx);
    findings.push({
      rule: "no-important",
      severity: inGuard ? "info" : "warning",
      message: inGuard
        ? "!important inside a reduced-motion guard — allowed, but consider removing"
        : "!important overrides user cascade control — replace with higher specificity or @layer ordering",
      line,
      column,
      snippet: css.slice(Math.max(0, idx - 30), idx + 40).replace(/\s+/g, " ").trim(),
      fixable: false,
      detail: { inA11yGuard: inGuard },
    });
  }
  return findings;
}

// ============================================================
// Rule: oklch-colors
// ============================================================

const COLOR_LITERAL_RE =
  /#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*[^)]*\)|\bhsla?\(\s*[^)]*\)/g;

export function lintOklchColors(css: string): LintFinding[] {
  const findings: LintFinding[] = [];
  let match: RegExpExecArray | null;
  COLOR_LITERAL_RE.lastIndex = 0;
  while ((match = COLOR_LITERAL_RE.exec(css)) !== null) {
    // Ignore color-mix() arguments and oklch() internals (they never match).
    const { line, column } = indexToLineCol(css, match.index);
    const value = match[0];
    findings.push({
      rule: "oklch-colors",
      severity: "warning",
      message: `color literal "${value}" — RoyCSS v2 standardizes on oklch() for perceptual uniformity`,
      line,
      column,
      snippet: value,
      fixable: false,
      detail: { colorLiteral: value },
    });
  }
  return findings;
}

// ============================================================
// Rule: roycss-prefix (class attributes in CSS-adjacent markup)
// ============================================================

/**
 * Detect known effect ids used unprefixed inside class="..." / className="..."
 * attributes. Pass markup (HTML/JSX) — for pure CSS files this rule is a no-op.
 */
export function lintRoycssPrefix(
  markup: string,
  knownEffectIds: string[],
): LintFinding[] {
  if (knownEffectIds.length === 0) return [];
  const known = new Set(knownEffectIds);
  const findings: LintFinding[] = [];
  const attrRe = /(?:class|className)\s*=\s*["'`{]([^"'`}]+)/g;
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(markup)) !== null) {
    const attrStart = match.index + match[0].indexOf(match[1]);
    const tokens = match[1].split(/\s+/).filter(Boolean);
    let offsetInAttr = 0;
    for (const tok of tokens) {
      const tokStart = attrStart + match[1].indexOf(tok, offsetInAttr);
      offsetInAttr = match[1].indexOf(tok, offsetInAttr) + tok.length;
      if (known.has(tok) && !tok.startsWith("roycss-")) {
        const { line, column } = indexToLineCol(markup, tokStart);
        findings.push({
          rule: "roycss-prefix",
          severity: "error",
          message: `class "${tok}" is missing the "roycss-" prefix (v2 namespace)`,
          line,
          column,
          snippet: tok,
          fixable: true,
          detail: { effectId: tok },
        });
      }
    }
  }
  return findings;
}

// ============================================================
// Rule: reduced-motion-guard
// ============================================================

export function lintReducedMotionGuard(css: string): LintFinding[] {
  if (/prefers-reduced-motion/i.test(css)) return [];
  return [
    {
      rule: "reduced-motion-guard",
      severity: "warning",
      message:
        "no prefers-reduced-motion guard found — animations run for motion-sensitive users",
      line: 0,
      column: 0,
      fixable: true,
    },
  ];
}

/** The guard block `--fix` inserts (mirror of dist/roycss.css a11y header). */
export const REDUCED_MOTION_GUARD_CSS = `@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

// ============================================================
// Rule: layer-order
// ============================================================

/** Extract layer names from a top-level `@layer a, b, c;` statement. */
export function extractLayerStatement(css: string): string[] | null {
  const re = /@layer\s+([^;{]+);/;
  const m = re.exec(css);
  if (!m) return null;
  return m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function lintLayerOrder(
  css: string,
  expectedOrder: string[] = [...RECOMMENDED_LAYER_ORDER],
): LintFinding[] {
  const declared = extractLayerStatement(css);
  if (!declared) return []; // no layer statement — nothing to validate
  const expectedIdx = new Map(expectedOrder.map((n, i) => [n, i]));
  // Findings: unknown layers (not in expected list) are informational.
  const findings: LintFinding[] = [];
  let lastIdx = -1;
  for (const name of declared) {
    const idx = expectedIdx.get(name);
    if (idx === undefined) {
      const pos = css.indexOf(`@layer`);
      const { line, column } = indexToLineCol(css, pos);
      findings.push({
        rule: "layer-order",
        severity: "info",
        message: `layer "${name}" is not part of the recommended RoyCSS cascade skeleton`,
        line,
        column,
        snippet: name,
        fixable: false,
        detail: { layer: name, expected: expectedOrder.join(",") },
      });
      continue;
    }
    if (idx < lastIdx) {
      const pos = css.indexOf(`@layer`);
      const { line, column } = indexToLineCol(css, pos);
      findings.push({
        rule: "layer-order",
        severity: "warning",
        message: `layer "${name}" declared out of recommended order (expected after "${expectedOrder[lastIdx]}")`,
        line,
        column,
        snippet: declared.join(", "),
        fixable: false,
        detail: {
          layer: name,
          declaredOrder: declared.join(","),
          expectedOrder: expectedOrder.join(","),
        },
      });
    }
    lastIdx = Math.max(lastIdx, idx);
  }
  return findings;
}

// ============================================================
// Auto-fixes (conservative)
// ============================================================

export interface FixApplication {
  fixed: string;
  appliedFixes: Array<{ rule: LintRuleId; message: string }>;
}

/**
 * Apply all safe fixes. Never removes !important (cascade risk).
 *  1. reduced-motion-guard: insert the guard block at the top of the file.
 *  2. roycss-prefix: prefix known effect ids inside class attributes.
 */
export function applyFixes(
  css: string,
  findings: LintFinding[],
  options: { knownEffectIds?: string[]; markup?: string } = {},
): FixApplication {
  const appliedFixes: FixApplication["appliedFixes"] = [];
  let fixed = css;

  // 1. Insert reduced-motion guard (CSS files only).
  const hasGuardFinding = findings.some(
    (f) => f.rule === "reduced-motion-guard" && f.fixable,
  );
  if (hasGuardFinding && !/prefers-reduced-motion/i.test(fixed)) {
    fixed = REDUCED_MOTION_GUARD_CSS + "\n" + fixed;
    appliedFixes.push({
      rule: "reduced-motion-guard",
      message: "inserted prefers-reduced-motion guard block",
    });
  }

  // 2. Prefix unprefixed known effect ids in class attributes (markup only).
  const markup = options.markup ?? css;
  if (options.knownEffectIds?.length && findings.some((f) => f.rule === "roycss-prefix")) {
    const known = new Set(options.knownEffectIds);
    const prefixed = markup.replace(
      /((?:class|className)\s*=\s*["'`{])([^"'`}]+)(["'`}])/g,
      (full, p1: string, body: string, p3: string) => {
        const body2 = body
          .split(/\s+/)
          .map((tok) => (tok && known.has(tok) && !tok.startsWith("roycss-") ? `roycss-${tok}` : tok))
          .join(" ");
        if (body2 !== body) {
          appliedFixes.push({
            rule: "roycss-prefix",
            message: `prefixed effect classes: ${body2}`,
          });
        }
        return p1 + body2 + p3;
      },
    );
    if (markup === css) fixed = prefixed;
    else return { fixed: prefixed, appliedFixes };
  }

  return { fixed, appliedFixes };
}

// ============================================================
// Orchestrator
// ============================================================

export function lintCss(css: string, options: LintOptions = {}): LintResult {
  const {
    knownEffectIds = [],
    allowA11yImportant = true,
    disabledRules = [],
    expectedLayerOrder,
  } = options;
  const off = new Set(disabledRules);
  const findings: LintFinding[] = [];

  // Is this markup (contains class= attributes) or pure CSS?
  const looksLikeMarkup = /(?:class|className)\s*=\s*["'`]/.test(css);

  if (!off.has("no-important")) {
    findings.push(...lintNoImportant(css, allowA11yImportant));
  }
  if (!off.has("oklch-colors")) {
    findings.push(...lintOklchColors(css));
  }
  if (!off.has("roycss-prefix") && looksLikeMarkup) {
    findings.push(...lintRoycssPrefix(css, knownEffectIds));
  }
  if (!off.has("reduced-motion-guard") && !looksLikeMarkup) {
    findings.push(...lintReducedMotionGuard(css));
  }
  if (!off.has("layer-order")) {
    findings.push(...lintLayerOrder(css, expectedLayerOrder));
  }

  findings.sort((a, b) =>
    a.line === b.line ? a.column - b.column : a.line - b.line,
  );

  const summary: LintSummary = { errors: 0, warnings: 0, infos: 0, allowed: 0 };
  for (const f of findings) {
    if (f.severity === "error") summary.errors++;
    else if (f.severity === "warning") summary.warnings++;
    else summary.infos++;
  }

  return { findings, summary };
}

// ============================================================
// Utilities
// ============================================================

/** Convert a 0-based string index to 1-based {line, column}. */
export function indexToLineCol(
  source: string,
  index: number,
): { line: number; column: number } {
  const upto = source.slice(0, Math.max(0, index));
  const lines = upto.split("\n");
  return { line: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1 };
}
