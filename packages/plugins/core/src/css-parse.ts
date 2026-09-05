/**
 * Minimal, dependency-free CSS *structure* parser used by the extractor.
 *
 * It splits a stylesheet into an ordered list of top-level nodes — comments,
 * statements (`@charset` / `@import` / bare `@layer name;`), style rules,
 * `@keyframes`, `@property`, other block at-rules, and group at-rules
 * (`@media`, `@supports`, `@container`, …) whose children are parsed
 * recursively.
 *
 * Every node keeps the exact raw source slice it was parsed from, so kept
 * nodes can be re-emitted byte-for-byte. That property is what makes
 * extraction **idempotent** and keeps formatting stable.
 */

export interface CssCommentNode {
  kind: "comment";
  /** Exact source text including the comment delimiters. */
  raw: string;
}

export interface CssStatementNode {
  kind: "statement";
  /** Exact source text including the trailing semicolon. */
  raw: string;
}

export interface CssRuleNode {
  kind: "rule";
  /** Exact source text (selector + balanced declaration block). */
  raw: string;
  /** Selector text (everything before the opening brace). */
  selector: string;
}

export interface CssKeyframesNode {
  kind: "keyframes";
  raw: string;
  /** Animation symbol name, e.g. `roy-pulse-glow`. */
  name: string;
}

export interface CssPropertyNode {
  kind: "property";
  raw: string;
  /** Registered custom property name, e.g. `--roy-angle`. */
  name: string;
}

export interface CssAtRuleNode {
  kind: "atrule";
  raw: string;
  /** Lower-cased at-keyword, e.g. `font-face`, `counter-style`, `page`. */
  keyword: string;
  /** Raw prelude (text between the at-keyword and the block). */
  prelude: string;
}

export interface CssGroupNode {
  kind: "group";
  raw: string;
  /** Raw prelude, e.g. `(prefers-reduced-motion: reduce)`. */
  prelude: string;
  /** Parsed child nodes (rules, keyframes, nested groups, comments…). */
  children: CssNode[];
}

export type CssNode =
  | CssCommentNode
  | CssStatementNode
  | CssRuleNode
  | CssKeyframesNode
  | CssPropertyNode
  | CssAtRuleNode
  | CssGroupNode;

/** At-keywords whose blocks contain nested rules (parsed recursively). */
const GROUP_KEYWORDS = new Set([
  "media",
  "supports",
  "container",
  "layer",
  "scope",
  "starting-style",
  "document",
]);

const AT_KEYWORD = /@([A-Za-z-]+)/y;

function isWhitespace(ch: string | undefined): boolean {
  return ch === " " || ch === "\n" || ch === "\r" || ch === "\t" || ch === "\f" || ch === "\v";
}

/** Skip a quoted string starting at `start` (css[start] is the quote). Returns index after the closing quote. */
function skipString(css: string, start: number): number {
  const quote = css[start];
  const n = css.length;
  let i = start + 1;
  while (i < n) {
    const ch = css[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === quote) return i + 1;
    i++;
  }
  return n;
}

/** Skip a comment starting at `start` (which begins with the comment-open delimiter). Returns index after the comment close delimiter, or end of input. */
function skipComment(css: string, start: number): number {
  const end = css.indexOf("*/", start + 2);
  return end === -1 ? css.length : end + 2;
}

/** Skip whitespace, strings, comments and balanced parens; returns index of the first `;` or `{` at paren depth 0 (or -1). */
function findPreludeEnd(css: string, start: number, stopChars: string): number {
  const n = css.length;
  let i = start;
  let parenDepth = 0;
  while (i < n) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      i = skipString(css, i);
      continue;
    }
    if (ch === "/" && css[i + 1] === "*") {
      i = skipComment(css, i);
      continue;
    }
    if (ch === "(") {
      parenDepth++;
      i++;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      i++;
      continue;
    }
    if (parenDepth === 0 && stopChars.includes(ch)) return i;
    i++;
  }
  return -1;
}

/** Read a balanced `{ … }` block starting at the opening brace. Returns index after the matching `}`. */
function readBlock(css: string, openBrace: number): number {
  const n = css.length;
  let depth = 0;
  let i = openBrace;
  while (i < n) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      i = skipString(css, i);
      continue;
    }
    if (ch === "/" && css[i + 1] === "*") {
      i = skipComment(css, i);
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return n;
}

/** Extract the dependency identifier from an at-rule prelude (`@keyframes roy-x` → `roy-x`). */
function preludeIdent(prelude: string): string {
  const stripped = prelude.replace(/^@[A-Za-z-]+/i, "").trim();
  const match = /([A-Za-z_][\w-]*)/.exec(stripped);
  return match ? match[1] : "";
}

/**
 * Parse a stylesheet (or the nested content of a group at-rule) into an
 * ordered node list. Tolerant of stray trailing text and unbalanced input.
 */
export function parseStylesheet(css: string): CssNode[] {
  const nodes: CssNode[] = [];
  const n = css.length;
  let i = 0;

  while (i < n) {
    while (i < n && isWhitespace(css[i])) i++;
    if (i >= n) break;

    // Comment
    if (css[i] === "/" && css[i + 1] === "*") {
      const stop = skipComment(css, i);
      nodes.push({ kind: "comment", raw: css.slice(i, stop) });
      i = stop;
      continue;
    }

    // At-rule or style rule?
    if (css[i] === "@") {
      AT_KEYWORD.lastIndex = i;
      const match = AT_KEYWORD.exec(css);
      const keyword = (match?.[1] ?? "").toLowerCase();
      const preludeEnd = findPreludeEnd(css, i, ";{");

      if (preludeEnd !== -1 && css[preludeEnd] === ";") {
        // Statement: @charset / @import / @namespace / `@layer name;` …
        const raw = css.slice(i, preludeEnd + 1);
        nodes.push({ kind: "statement", raw });
        i = preludeEnd + 1;
        continue;
      }

      const brace = preludeEnd === -1 ? -1 : preludeEnd;
      if (brace === -1 || css[brace] !== "{") {
        // Malformed at-rule — swallow the rest defensively.
        nodes.push({ kind: "statement", raw: css.slice(i) });
        i = n;
        continue;
      }

      const blockEnd = readBlock(css, brace);
      const raw = css.slice(i, blockEnd);
      const prelude = css.slice(i, brace).trim();

      if (keyword.endsWith("keyframes")) {
        nodes.push({ kind: "keyframes", raw, name: preludeIdent(prelude) });
      } else if (keyword === "property") {
        const name = prelude.replace(/^@property\s+/i, "").trim();
        nodes.push({ kind: "property", raw, name });
      } else if (GROUP_KEYWORDS.has(keyword)) {
        const inner = css.slice(brace + 1, Math.max(brace + 1, blockEnd - 1));
        nodes.push({ kind: "group", raw, prelude, children: parseStylesheet(inner) });
      } else {
        nodes.push({ kind: "atrule", raw, keyword, prelude });
      }
      i = blockEnd;
      continue;
    }

    // Style rule (possibly containing nested rules — kept as one node).
    const brace = findPreludeEnd(css, i, ";{");
    if (brace === -1) {
      nodes.push({ kind: "statement", raw: css.slice(i) });
      break;
    }
    if (css[brace] === ";") {
      // Stray declaration-ish text — keep it verbatim as a statement.
      nodes.push({ kind: "statement", raw: css.slice(i, brace + 1) });
      i = brace + 1;
      continue;
    }
    const blockEnd = readBlock(css, brace);
    const raw = css.slice(i, blockEnd);
    nodes.push({ kind: "rule", raw, selector: css.slice(i, brace).trim() });
    i = blockEnd;
  }

  return nodes;
}

/**
 * Brace/string sanity check — used by tests and consumers to assert that a
 * generated stylesheet is structurally valid.
 */
export function isBalancedCss(css: string): boolean {
  let depth = 0;
  let i = 0;
  const n = css.length;
  while (i < n) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      i = skipString(css, i);
      continue;
    }
    if (ch === "/" && css[i + 1] === "*") {
      i = skipComment(css, i);
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth < 0) return false;
    }
    i++;
  }
  return depth === 0;
}
