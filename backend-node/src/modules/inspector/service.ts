/**
 * Inspector service — pure, dependency-free CSS lint logic.
 *
 * "Roy Inspector" analyzes a CSS snippet and returns lint-style
 * findings. There is NO database dependency: the check catalog is a
 * static snapshot and every check is a pure function over the parsed
 * stylesheet. That matches the platform's documented demo-tier module
 * pattern (see edge/, mcp/, devtools/) — the read surface is real
 * logic, persistence can be layered in later without touching routes.
 *
 * Pipeline:
 *   1. stripComments()   — blank out /* … *\/ while preserving offsets
 *                          (newlines kept, every other char → space) so
 *                          line numbers stay exact.
 *   2. parseStylesheet() — a small quote-aware brace walker that builds
 *                          a rule tree: selectors, declarations, and
 *                          nested children (CSS nesting / @media / @keyframes).
 *   3. check*()          — 8 independent checks, each walking the tree.
 *
 * Checks (ids match the /inspector/checks catalog):
 *   no-reduced-motion-guard     — motion without prefers-reduced-motion guard
 *   hover-without-focus-visible — :hover styles without a :focus-visible twin
 *   important-overuse           — !important count/ratio over thresholds
 *   stale-vendor-prefix         — prefixed props whose unprefixed form is Baseline
 *   universal-selector          — `*` selectors (zero specificity, broad match)
 *   unknown-roycss-class        — .roycss-* classes outside the class registry
 *   unused-custom-property      — --props defined but never var()-referenced
 *   excessive-nesting-depth     — style-rule nesting deeper than 3 levels
 */
import { createLogger } from "../../lib/logger.js";
import type {
  InspectorAnalyzeResult,
  InspectorCheck,
  InspectorFinding,
  InspectorSummary,
} from "./schema.js";

const log = createLogger("inspector");

// ─── Tunables ────────────────────────────────────────────────────────────

/** !important count at (or above) which we emit a warning. */
const IMPORTANT_WARN_COUNT = 3;
/** !important count at (or above) which we escalate to an error. */
const IMPORTANT_ERROR_COUNT = 10;
/** !important share of all declarations that alone triggers a warning. */
const IMPORTANT_WARN_RATIO = 0.2;
/** Max style-rule nesting depth before a finding (1-based). */
const MAX_NESTING_DEPTH = 3;

/** Properties that trigger motion (need a reduced-motion guard). */
const MOTION_PROPERTIES = new Set([
  "animation",
  "animation-name",
  "transition",
  "transition-property",
  "scroll-behavior",
]);

/**
 * Vendor-prefixed properties whose unprefixed form has been Baseline
 * (all modern engines) for years — keeping the prefix is pure rot.
 * Mapped to the unprefixed property to suggest in the message.
 */
const STALE_PREFIXED_PROPERTIES: Record<string, string> = {
  "-webkit-box-shadow": "box-shadow",
  "-moz-box-shadow": "box-shadow",
  "-webkit-border-radius": "border-radius",
  "-moz-border-radius": "border-radius",
  "-o-border-radius": "border-radius",
  "-webkit-transform": "transform",
  "-moz-transform": "transform",
  "-ms-transform": "transform",
  "-o-transform": "transform",
  "-webkit-transform-origin": "transform-origin",
  "-moz-transform-origin": "transform-origin",
  "-ms-transform-origin": "transform-origin",
  "-webkit-transition": "transition",
  "-moz-transition": "transition",
  "-o-transition": "transition",
  "-webkit-transition-property": "transition-property",
  "-moz-transition-property": "transition-property",
  "-o-transition-property": "transition-property",
  "-webkit-transition-duration": "transition-duration",
  "-o-transition-duration": "transition-duration",
  "-webkit-transition-timing-function": "transition-timing-function",
  "-o-transition-timing-function": "transition-timing-function",
  "-webkit-transition-delay": "transition-delay",
  "-o-transition-delay": "transition-delay",
  "-webkit-animation": "animation",
  "-moz-animation": "animation",
  "-o-animation": "animation",
  "-webkit-animation-name": "animation-name",
  "-moz-animation-name": "animation-name",
  "-o-animation-name": "animation-name",
  "-webkit-animation-duration": "animation-duration",
  "-moz-animation-duration": "animation-duration",
  "-webkit-animation-timing-function": "animation-timing-function",
  "-webkit-animation-delay": "animation-delay",
  "-webkit-animation-iteration-count": "animation-iteration-count",
  "-webkit-animation-direction": "animation-direction",
  "-webkit-animation-fill-mode": "animation-fill-mode",
  "-webkit-animation-play-state": "animation-play-state",
  "-webkit-flex": "flex",
  "-ms-flex": "flex",
  "-o-flex": "flex",
  "-webkit-flex-direction": "flex-direction",
  "-ms-flex-direction": "flex-direction",
  "-webkit-flex-wrap": "flex-wrap",
  "-webkit-order": "order",
  "-ms-order": "order",
  "-webkit-filter": "filter",
  "-webkit-columns": "columns",
  "-moz-columns": "columns",
  "-webkit-column-count": "column-count",
  "-webkit-column-gap": "column-gap",
  "-webkit-box-sizing": "box-sizing",
  "-moz-box-sizing": "box-sizing",
  "-webkit-backface-visibility": "backface-visibility",
  "-webkit-perspective": "perspective",
};

/**
 * Static snapshot of the RoyCSS class-family vocabulary — the segments
 * that follow the `roycss-` prefix in dist/roycss.css (ferrum-, vfx-,
 * btn-, card-, …). A .roycss-* class whose family is NOT in this set
 * is flagged: either a typo (styles that silently never apply) or a
 * custom class squatting on the RoyCSS namespace.
 */
const KNOWN_ROYCSS_FAMILIES = new Set([
  "ferrum", "vfx", "seasonal", "scroll", "cursor", "loader", "audio",
  "text", "immersive", "particles", "hover", "nature", "retro", "advtext",
  "card", "visual", "dataviz", "structural", "btn", "liquid", "glass2",
  "morph", "haptics", "state", "micro", "bg", "game", "physics", "nav",
  "form", "glass", "css", "misc", "linear", "anim", "page", "border",
  "optical", "property", "art", "svg", "filter", "vis", "slide", "offset",
]);

/** `.className` extractor for selectors. */
const CLASS_NAME_RE = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;

/** `var(--name)` usage extractor for values. */
const VAR_USAGE_RE = /var\(\s*(--[\w-]+)/g;

// ─── Check catalog (GET /inspector/checks) ───────────────────────────────

const CHECKS: InspectorCheck[] = [
  {
    id: "no-reduced-motion-guard",
    title: "Reduced-motion guard",
    category: "accessibility",
    description:
      "Flags animations/transitions/@keyframes declared without a `@media (prefers-reduced-motion: reduce)` guard — users who opt out of motion still get motion (WCAG 2.3.3 / motion-sensitivity vestibular disorders).",
  },
  {
    id: "hover-without-focus-visible",
    title: "Hover/focus-visible pairing",
    category: "accessibility",
    description:
      "Flags selectors that style :hover without a matching :focus-visible compound — keyboard users never see the hover state (WCAG 2.4.7 focus visible).",
  },
  {
    id: "important-overuse",
    title: "!important overuse",
    category: "maintainability",
    description:
      "Flags stylesheets where !important appears too often (3+ uses or 20%+ of declarations). !important breaks cascade intent and forces future overrides to escalate.",
  },
  {
    id: "stale-vendor-prefix",
    title: "Vendor-prefix rot",
    category: "compatibility",
    description:
      "Flags prefixed properties (-webkit-transition, -moz-box-shadow, …) whose unprefixed form has been Baseline in all engines for years — dead weight that rots the cascade.",
  },
  {
    id: "universal-selector",
    title: "Universal selector",
    category: "performance",
    description:
      "Flags `*` selectors — zero specificity (overridden by anything) and broad matching; expensive in wide scopes like `.card *`. Prefer scoped descendants or :where() for deliberate zero-specificity resets.",
  },
  {
    id: "unknown-roycss-class",
    title: "Unknown roycss-* class",
    category: "correctness",
    description:
      "Flags .roycss-* classes outside the RoyCSS class registry (family snapshot from dist/roycss.css) — typos that silently never apply, or custom classes squatting the RoyCSS namespace.",
  },
  {
    id: "unused-custom-property",
    title: "Unused custom property",
    category: "dead-code",
    description:
      "Flags custom properties (--tokens) defined but never referenced via var() in the snippet — dead code unless intentionally exported (then document it).",
  },
  {
    id: "excessive-nesting-depth",
    title: "Nesting depth",
    category: "maintainability",
    description:
      "Flags style-rule nesting deeper than 3 levels (at-rule wrappers like @media don't count) — deep nesting compiles to long, high-specificity selectors that are hard to override.",
  },
];

// ─── Parsed stylesheet model ─────────────────────────────────────────────

interface CssDeclaration {
  property: string;
  value: string;
  important: boolean;
  /** 1-based line of the declaration in the original snippet. */
  line: number;
}

interface CssRule {
  /** Raw prelude: selector list, or at-rule head like `@media …`. */
  selector: string;
  /** 1-based line where the prelude starts. */
  line: number;
  declarations: CssDeclaration[];
  /** Nested rules (CSS nesting, @media bodies, @keyframes frames). */
  children: CssRule[];
}

/**
 * Blank out /* … *\/ comments while preserving string length and
 * newlines: every non-newline comment char becomes a space. All line
 * offsets after the comment stay exact, so the parser can report
 * real line numbers against the ORIGINAL snippet.
 */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\n]/g, " "),
  );
}

/**
 * Minimal, quote-aware CSS walker.
 *
 * Not a full parser: it doesn't validate syntax, it just builds a rule
 * tree from braces/semicolons so the checks have real structure to
 * walk. Strings ("…" / '…') are consumed raw so braces/semicolons
 * inside content:url() values can't confuse the structure.
 */
function parseStylesheet(source: string): CssRule {
  const root: CssRule = { selector: "", line: 1, declarations: [], children: [] };
  const stack: CssRule[] = [root];
  let buffer = "";
  /** Line where the buffer's first non-whitespace character sits. */
  let bufferLine = 1;
  let line = 1;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  const current = (): CssRule => {
    const top = stack[stack.length - 1];
    if (!top) {
      // Unreachable: root is never popped (stray `}` is ignored below).
      throw new Error("parseStylesheet: brace stack underflow");
    }
    return top;
  };

  /** Turn the pending buffer into a declaration of the innermost rule. */
  const flushDeclaration = (): void => {
    const text = buffer.trim();
    if (text.length > 0 && stack.length > 1) {
      const colon = text.indexOf(":");
      if (colon > 0) {
        const property = text.slice(0, colon).trim();
        const rawValue = text.slice(colon + 1).trim();
        const important = /!\s*important$/i.test(rawValue);
        const value = important
          ? rawValue.replace(/!\s*important$/i, "").trim()
          : rawValue;
        if (property.length > 0) {
          current().declarations.push({
            property,
            value,
            important,
            line: bufferLine,
          });
        }
      }
    }
    buffer = "";
    bufferLine = line;
  };

  for (const ch of source) {
    if (quote !== null) {
      // Inside a string literal — only track escapes/close, keep raw.
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      if (ch === "\n") line += 1;
      buffer += ch;
      continue;
    }
    switch (ch) {
      case "{": {
        const selector = buffer.trim();
        const rule: CssRule = {
          selector,
          line: selector.length > 0 ? bufferLine : line,
          declarations: [],
          children: [],
        };
        current().children.push(rule);
        stack.push(rule);
        buffer = "";
        bufferLine = line;
        break;
      }
      case ";": {
        flushDeclaration();
        bufferLine = line;
        break;
      }
      case "}": {
        // Last declaration may omit the trailing `;` — flush it first.
        flushDeclaration();
        if (stack.length > 1) {
          stack.pop();
        }
        // Stray `}` at root: ignore (malformed input, lint not validation).
        buffer = "";
        bufferLine = line;
        break;
      }
      case '"':
      case "'": {
        quote = ch;
        if (buffer.length === 0) bufferLine = line;
        buffer += ch;
        break;
      }
      default: {
        if (ch === "\n") line += 1;
        if (buffer.length === 0) {
          bufferLine = line;
          if (/\s/.test(ch)) continue; // skip leading whitespace
        }
        buffer += ch;
      }
    }
  }
  // A trailing declaration without `}` is malformed — drop it.
  return root;
}

/** Depth-first walk over every rule in the tree. */
function walkRules(rules: CssRule[], visit: (rule: CssRule) => void): void {
  for (const rule of rules) {
    visit(rule);
    walkRules(rule.children, visit);
  }
}

/** Style rule = anything that isn't an at-rule (@media, @keyframes…). */
function isStyleRule(rule: CssRule): boolean {
  return !rule.selector.startsWith("@");
}

/**
 * Split a selector list on top-level commas only — commas inside
 * :is()/:not()/:has() parens or [attr] brackets stay part of the
 * compound they belong to.
 */
function splitSelectorList(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of selector) {
    if (ch === "(" || ch === "[") depth += 1;
    if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      if (current.trim().length > 0) parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  const tail = current.trim();
  if (tail.length > 0) parts.push(tail);
  return parts;
}

/** Token matches a universal selector: `*`, `*.card`, `*:hover`, `*[a]`. */
const UNIVERSAL_TOKEN_RE = /^\*/;

// ─── Checks ──────────────────────────────────────────────────────────────

/** Motion (animation/transition/@keyframes) with no reduced-motion guard. */
function checkReducedMotion(root: CssRule): InspectorFinding[] {
  let hasMotion = false;
  let firstMotionLine: number | undefined;
  let hasGuard = false;

  walkRules(root.children, (rule) => {
    if (
      rule.selector.startsWith("@media") &&
      rule.selector.includes("prefers-reduced-motion")
    ) {
      hasGuard = true; // covers both `reduce` and `no-preference` patterns
    }
    if (rule.selector.startsWith("@keyframes")) {
      hasMotion = true;
      firstMotionLine ??= rule.line;
    }
    for (const decl of rule.declarations) {
      if (MOTION_PROPERTIES.has(decl.property.toLowerCase())) {
        hasMotion = true;
        firstMotionLine ??= decl.line;
      }
    }
  });

  if (!hasMotion || hasGuard) return [];
  return [
    {
      rule: "no-reduced-motion-guard",
      severity: "warning",
      message:
        "Motion (animation/transition/@keyframes) is declared without a `@media (prefers-reduced-motion: reduce)` guard — users who opt out of motion will still get it. Add a reduced-motion block that disables or tones down the motion.",
      line: firstMotionLine,
    },
  ];
}

/** :hover compounds with no :focus-visible twin in the snippet. */
function checkHoverFocusVisible(root: CssRule): InspectorFinding[] {
  const focusCompounds = new Set<string>();
  const hoverCompounds: { compound: string; line: number }[] = [];

  walkRules(root.children, (rule) => {
    if (!isStyleRule(rule)) return;
    for (const compound of splitSelectorList(rule.selector)) {
      if (compound.includes(":focus-visible")) focusCompounds.add(compound);
      if (compound.includes(":hover")) {
        hoverCompounds.push({ compound, line: rule.line });
      }
    }
  });

  const findings: InspectorFinding[] = [];
  const reported = new Set<string>();
  for (const { compound, line } of hoverCompounds) {
    const twin = compound.replace(/:hover/g, ":focus-visible");
    if (focusCompounds.has(twin) || reported.has(twin)) continue;
    reported.add(twin);
    findings.push({
      rule: "hover-without-focus-visible",
      severity: "warning",
      message: `Selector "${compound}" styles :hover but there is no :focus-visible counterpart — keyboard users get no visible state. Add "${twin}" (or a :focus-visible fallback) with the same styles.`,
      line,
    });
  }
  return findings;
}

/** !important over thresholds (count and share of declarations). */
function checkImportantOveruse(root: CssRule): InspectorFinding[] {
  let importantCount = 0;
  let totalDeclarations = 0;
  let firstLine: number | undefined;

  walkRules(root.children, (rule) => {
    for (const decl of rule.declarations) {
      totalDeclarations += 1;
      if (decl.important) {
        importantCount += 1;
        firstLine ??= decl.line;
      }
    }
  });

  if (importantCount === 0) return [];
  const ratio = totalDeclarations > 0 ? importantCount / totalDeclarations : 0;
  if (importantCount < IMPORTANT_WARN_COUNT && ratio < IMPORTANT_WARN_RATIO) {
    return [];
  }
  return [
    {
      rule: "important-overuse",
      severity:
        importantCount >= IMPORTANT_ERROR_COUNT ? "error" : "warning",
      message: `${importantCount} of ${totalDeclarations} declarations use !important (${Math.round(ratio * 100)}%). !important breaks the cascade and makes later overrides painful — prefer @layer, specificity, or removing the competing rule.`,
      line: firstLine,
    },
  ];
}

/** Prefixed properties whose unprefixed form is Baseline everywhere. */
function checkStaleVendorPrefixes(root: CssRule): InspectorFinding[] {
  const findings: InspectorFinding[] = [];
  walkRules(root.children, (rule) => {
    for (const decl of rule.declarations) {
      const unprefixed = STALE_PREFIXED_PROPERTIES[decl.property.toLowerCase()];
      if (unprefixed) {
        findings.push({
          rule: "stale-vendor-prefix",
          severity: "info",
          message: `"${decl.property}" is vendor-prefix rot — "${unprefixed}" is Baseline (supported by all modern engines). Drop the prefix, or isolate legacy prefixes behind @supports if you truly need them.`,
          line: decl.line,
        });
      }
    }
  });
  return findings;
}

/** `*` selectors — zero specificity + broad match. */
function checkUniversalSelectors(root: CssRule): InspectorFinding[] {
  const findings: InspectorFinding[] = [];
  walkRules(root.children, (rule) => {
    if (!isStyleRule(rule)) return;
    for (const compound of splitSelectorList(rule.selector)) {
      // Tokenize on combinators; `*` inside [attr*=…] stays inside a
      // bracket token, so substring matching can't false-positive.
      const tokens = compound.split(/[\s>+~]+/).filter(Boolean);
      const hasUniversal = tokens.some((token) =>
        UNIVERSAL_TOKEN_RE.test(token),
      );
      if (!hasUniversal) continue;
      findings.push({
        rule: "universal-selector",
        severity: "info",
        message: `Selector "${compound}" uses the universal selector "*" — it matches every element in scope and contributes zero specificity, so any other rule overrides it and broad scopes (".card *") get expensive. Scope the descendant or use :where() for a deliberate zero-specificity reset.`,
        line: rule.line,
      });
    }
  });
  return findings;
}

/** .roycss-* classes that aren't in the class-family registry snapshot. */
function checkUnknownRoycssClasses(root: CssRule): InspectorFinding[] {
  const findings: InspectorFinding[] = [];
  const reported = new Set<string>();

  walkRules(root.children, (rule) => {
    if (!isStyleRule(rule)) return;
    const classNames = rule.selector.match(CLASS_NAME_RE) ?? [];
    for (const cls of classNames) {
      const name = cls.slice(1); // drop the leading "."
      if (!name.startsWith("roycss-")) continue;
      const family = name.slice("roycss-".length).split("-")[0] ?? "";
      if (KNOWN_ROYCSS_FAMILIES.has(family)) continue;
      if (reported.has(name)) continue;
      reported.add(name);
      findings.push({
        rule: "unknown-roycss-class",
        severity: "warning",
        message: `Class ".${name}" uses the roycss- prefix but its family ("${family}") is not in the RoyCSS class registry (snapshot of dist/roycss.css families). It is either a typo — the rule silently never applies — or a custom class squatting the RoyCSS namespace; use your own prefix for custom classes.`,
        line: rule.line,
      });
    }
  });
  return findings;
}

/** --custom-props defined but never var()-referenced in the snippet. */
function checkUnusedCustomProperties(
  root: CssRule,
  strippedCss: string,
): InspectorFinding[] {
  const defined = new Map<string, number>(); // name → first definition line
  walkRules(root.children, (rule) => {
    for (const decl of rule.declarations) {
      if (decl.property.startsWith("--") && !defined.has(decl.property)) {
        defined.set(decl.property, decl.line);
      }
    }
  });
  if (defined.size === 0) return [];

  const used = new Set<string>();
  for (const match of strippedCss.matchAll(VAR_USAGE_RE)) {
    const name = match[1];
    if (name) used.add(name);
  }

  const findings: InspectorFinding[] = [];
  for (const [name, line] of defined) {
    if (used.has(name)) continue;
    findings.push({
      rule: "unused-custom-property",
      severity: "warning",
      message: `Custom property "${name}" is defined but never referenced via var() in this snippet — dead code, unless it is an intentional export for other stylesheets (then document it with a comment).`,
      line,
    });
  }
  return findings;
}

/** Style-rule nesting deeper than MAX_NESTING_DEPTH levels. */
function checkNestingDepth(root: CssRule): InspectorFinding[] {
  let deepest = 0;
  let deepestLine: number | undefined;

  const visit = (rules: CssRule[], depth: number): void => {
    for (const rule of rules) {
      // At-rule wrappers (@media, @supports, @keyframes) don't add
      // selector-nesting depth — only style rules do.
      const isStyle = isStyleRule(rule);
      const nextDepth = isStyle ? depth + 1 : depth;
      if (isStyle && nextDepth > deepest) {
        deepest = nextDepth;
        deepestLine = rule.line;
      }
      visit(rule.children, nextDepth);
    }
  };
  visit(root.children, 0);

  if (deepest <= MAX_NESTING_DEPTH || deepestLine === undefined) return [];
  return [
    {
      rule: "excessive-nesting-depth",
      severity: "warning",
      message: `Nesting depth ${deepest} exceeds ${MAX_NESTING_DEPTH} levels — deeply nested rules compile to long, high-specificity selectors that are hard to override. Flatten the inner levels into their own rules.`,
      line: deepestLine,
    },
  ];
}

// ─── Public API ──────────────────────────────────────────────────────────

/** Catalog of inspection checks — GET /inspector/checks. */
export async function listChecks(): Promise<InspectorCheck[]> {
  return CHECKS.map((check) => ({ ...check }));
}

/** Analyze a CSS snippet — GET /inspector/analyze?css=… */
export async function analyzeCss(css: string): Promise<InspectorAnalyzeResult> {
  const stripped = stripComments(css);
  const root = parseStylesheet(stripped);

  const findings: InspectorFinding[] = [
    ...checkReducedMotion(root),
    ...checkHoverFocusVisible(root),
    ...checkImportantOveruse(root),
    ...checkStaleVendorPrefixes(root),
    ...checkUniversalSelectors(root),
    ...checkUnknownRoycssClasses(root),
    ...checkUnusedCustomProperties(root, stripped),
    ...checkNestingDepth(root),
  ];

  // Deterministic order: by line (unlined findings last), then by rule.
  findings.sort((a, b) => {
    const lineDiff = (a.line ?? Number.POSITIVE_INFINITY) -
      (b.line ?? Number.POSITIVE_INFINITY);
    return lineDiff !== 0 ? lineDiff : a.rule.localeCompare(b.rule);
  });

  const summary: InspectorSummary = {
    lines: css.length === 0 ? 0 : css.split("\n").length,
    checksExecuted: CHECKS.length,
    findings: findings.length,
    errors: countSeverity(findings, "error"),
    warnings: countSeverity(findings, "warning"),
    infos: countSeverity(findings, "info"),
  };

  log.debug("inspector analyze complete", {
    chars: css.length,
    findings: findings.length,
  });

  return { findings, summary };
}

/** Module health — GET /inspector/health. Pure logic, no DB: always ok. */
export function inspectorHealth(): {
  status: "ok";
  module: "inspector";
  checks: number;
  time: string;
} {
  return {
    status: "ok",
    module: "inspector",
    checks: CHECKS.length,
    time: new Date().toISOString(),
  };
}

function countSeverity(
  findings: InspectorFinding[],
  severity: InspectorFinding["severity"],
): number {
  let count = 0;
  for (const finding of findings) {
    if (finding.severity === severity) count += 1;
  }
  return count;
}

log.debug("Inspector module loaded", { checks: CHECKS.length });
