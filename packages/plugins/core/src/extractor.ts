/**
 * RoyCSS dependency-aware CSS extractor.
 *
 * Given the full compiled stylesheet and the set of classes actually used by
 * a consumer, emits the minimal subset stylesheet that preserves behaviour:
 *
 *   1. Every style rule whose selector references a used class is kept
 *      (compound/descendant/pseudo-element selectors are kept whole).
 *   2. `@keyframes` are kept only when their animation symbol is referenced
 *      by kept CSS (this includes keyframes nested inside `@supports`).
 *   3. `@property` registrations are kept only when their custom property is
 *      referenced by kept CSS (`var(--roy-x)` or `animation: --roy-x`).
 *   4. Root-scoped custom-property definitions (`:root`, `:where(:root)` …)
 *      are kept when kept CSS references them — i.e. design tokens survive
 *      if and only if something still uses them.
 *   5. Group at-rules (`@media`, `@supports`, `@container`, …) are kept when
 *      any nested rule survives, and are re-emitted pruned to the surviving
 *      children.
 *   6. "Base" rules that reference no class at all (universal resets, the
 *      `[class^="roycss-"]` prefers-reduced-motion a11y guard, `:root` token
 *      blocks) are kept whenever the output is non-empty, so extracted pages
 *      render identically to pages loading the full stylesheet.
 *
 * Unknown classes (no matching rule anywhere in the stylesheet) are ignored
 * safely and reported in `unmatchedClasses`.
 *
 * Kept nodes are re-emitted using their exact source slices, so extraction
 * is deterministic, order-preserving and idempotent:
 * `extract(extract(css)) === extract(css)`.
 */

import {
  type CssGroupNode,
  type CssNode,
  type CssRuleNode,
  isBalancedCss,
  parseStylesheet,
} from "./css-parse";

export interface ExtractOptions {
  /**
   * Keep class-less "base" rules (universal resets, `:root` token blocks,
   * the prefers-reduced-motion guard) whenever the output is non-empty.
   * @default true
   */
  includeBase?: boolean;
}

export interface ExtractResult {
  /** The extracted (subset) stylesheet. Empty string when nothing matched. */
  css: string;
  /** Normalized used-class input. */
  usedClasses: string[];
  /** Used classes that matched at least one rule in the stylesheet. */
  matchedClasses: string[];
  /** Used classes with no matching rule — ignored safely. */
  unmatchedClasses: string[];
  /** Total style rules (at any nesting depth) in the input. */
  totalRules: number;
  /** Style rules kept in the output. */
  keptRules: number;
  /** Total `@keyframes` declarations in the input. */
  totalKeyframes: number;
  /** `@keyframes` declarations kept. */
  keptKeyframes: number;
  /** Group / block at-rules kept (`@media`, `@supports`, `@property`, …). */
  keptAtRuleBlocks: number;
  /** Input stylesheet size in bytes (UTF-8). */
  inputBytes: number;
  /** Output stylesheet size in bytes (UTF-8). */
  outputBytes: number;
}

/** Class token inside CSS — must start with a letter/underscore (skips `0.5s`-style noise). */
const CSS_CLASS_TOKEN = /\.(-?[A-Za-z_][\w-]*)/g;
/** Custom property declaration anywhere in a node's raw text. */
const CSS_VAR_DEFINITION = /(^|[;{\s])(--[A-Za-z_][\w-]*)\s*:/g;
/** `font-family:` value inside an at-rule body (for `@font-face` deps). */
const FONT_FAMILY_DECL = /font-family\s*:\s*([^;}]+)/gi;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Does `text` contain `name` as a whole CSS token (word/hyphen boundaries)? */
function referencesName(text: string, name: string): boolean {
  if (!text || !name) return false;
  const re = new RegExp(`(?<![\\w-])${escapeRegExp(name)}(?![\\w-])`);
  return re.test(text);
}

/** Class tokens referenced anywhere in a node's raw text (selectors + nested rules). */
function classTokensOf(raw: string): Set<string> {
  const tokens = new Set<string>();
  for (const match of raw.matchAll(CSS_CLASS_TOKEN)) tokens.add(match[1]);
  return tokens;
}

/** Custom properties defined (declared) by a node. */
function definedCustomProperties(raw: string): string[] {
  const names: string[] = [];
  for (const match of raw.matchAll(CSS_VAR_DEFINITION)) names.push(match[2]);
  return names;
}

/** Dependency name for a block at-rule (`@font-face` → family, `@counter-style` → symbol name). */
function atRuleDependency(prelude: string, raw: string, keyword: string): string | null {
  if (keyword === "counter-style") return prelude.trim() || null;
  if (keyword === "font-face") {
    const family = FONT_FAMILY_DECL.exec(raw)?.[1];
    return family ? family.trim().replace(/^["']|["']$/g, "").split(",")[0].trim() : null;
  }
  return null;
}

function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

/** Normalize user-provided class names: trim, strip a leading `.`, dedupe, sort. */
function normalizeUsedClasses(classes: Iterable<string>): string[] {
  const seen = new Set<string>();
  for (const cls of classes) {
    const token = cls.trim();
    if (!token) continue;
    seen.add(token.startsWith(".") ? token.slice(1) : token);
  }
  return [...seen].sort();
}

/**
 * Extract the minimal RoyCSS subset for `usedClasses` from `css`.
 * See the module docblock for the dependency rules.
 */
export function extractStylesheet(
  css: string,
  usedClasses: Iterable<string>,
  options: ExtractOptions = {},
): ExtractResult {
  const includeBase = options.includeBase ?? true;
  const used = new Set(normalizeUsedClasses(usedClasses));
  const nodes = parseStylesheet(css);

  const kept = new Set<CssNode>();
  const rules: CssRuleNode[] = [];
  const keyframesList: { node: CssNode; name: string }[] = [];
  const propertyList: { node: CssNode; name: string }[] = [];
  const atRuleList: { node: CssNode; prelude: string; raw: string; keyword: string }[] = [];
  const stylesheetClasses = new Set<string>();

  // Memoized per-node class tokens (the fixpoint re-reads them).
  const tokenCache = new Map<CssNode, Set<string>>();
  const classTokensCache = (node: CssNode): Set<string> => {
    let tokens = tokenCache.get(node);
    if (!tokens) {
      tokens = node.kind === "rule" || node.kind === "group" ? classTokensOf(node.raw) : new Set<string>();
      tokenCache.set(node, tokens);
    }
    return tokens;
  };

  const walk = (children: CssNode[]): void => {
    for (const node of children) {
      switch (node.kind) {
        case "rule": {
          rules.push(node);
          const tokens = classTokensCache(node);
          for (const token of tokens) stylesheetClasses.add(token);
          if (tokens.size > 0 && [...tokens].some((t) => used.has(t))) kept.add(node);
          break;
        }
        case "keyframes":
          keyframesList.push({ node, name: node.name });
          break;
        case "property":
          propertyList.push({ node, name: node.name });
          break;
        case "atrule":
          atRuleList.push({ node, prelude: node.prelude, raw: node.raw, keyword: node.keyword });
          break;
        case "group":
          walk(node.children);
          break;
        default:
          break; // comments & statements handled at emit time
      }
    }
  };
  walk(nodes);

  // ── Fixpoint: class rules first, then everything they reference. ─────────
  let changed = true;
  let iterations = 0;
  const keptText = (): string => {
    let text = "";
    for (const node of kept) text += `${node.raw}\n`;
    return text;
  };

  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    const text = keptText();

    for (const { node, name } of keyframesList) {
      if (!kept.has(node) && referencesName(text, name)) {
        kept.add(node);
        changed = true;
      }
    }
    for (const { node, name } of propertyList) {
      if (!kept.has(node) && referencesName(text, name)) {
        kept.add(node);
        changed = true;
      }
    }
    for (const { node, prelude, raw, keyword } of atRuleList) {
      if (kept.has(node)) continue;
      const dep = atRuleDependency(prelude, raw, keyword);
      if (dep && referencesName(text, dep)) {
        kept.add(node);
        changed = true;
      }
    }
    // Root-scoped custom-property definitions referenced by kept CSS.
    if (text) {
      for (const rule of rules) {
        if (kept.has(rule) || classTokensCache(rule).size > 0) continue;
        if (definedCustomProperties(rule.raw).some((name) => referencesName(text, name))) {
          kept.add(rule);
          changed = true;
        }
      }
    }
  }

  // ── Base rules: class-less rules kept when the output is non-empty. ─────
  if (includeBase && kept.size > 0) {
    for (const rule of rules) {
      if (!kept.has(rule) && classTokensCache(rule).size === 0) kept.add(rule);
    }
  }

  // ── Groups: kept when any nested node survived (bottom-up). ─────────────
  const resolveGroups = (children: CssNode[]): boolean => {
    let any = false;
    for (const child of children) {
      if (child.kind === "group") {
        if (resolveGroups(child.children)) {
          kept.add(child);
          any = true;
        }
      } else if (child.kind === "comment" || child.kind === "statement") {
        continue;
      } else if (kept.has(child)) {
        any = true;
      }
    }
    return any;
  };
  for (const node of nodes) {
    if (node.kind === "group" && !kept.has(node) && resolveGroups(node.children)) {
      kept.add(node);
    }
  }

  // ── Emission: exact source slices, original order, idempotent. ──────────
  const emitChildren = (children: CssNode[], keepStatements: boolean): string[] => {
    // Pass 1: kept-ness of every non-comment node (statements ride along
    // with a non-empty output, like the class-less base rules).
    const flags: boolean[] = children.map((node) =>
      node.kind === "comment" ? false : node.kind === "statement" ? keepStatements : kept.has(node),
    );
    // Pass 2: comments survive when the next non-comment sibling survives.
    for (let i = 0; i < children.length; i++) {
      if (children[i].kind !== "comment") continue;
      for (let j = i + 1; j < children.length; j++) {
        if (children[j].kind === "comment") continue;
        flags[i] = flags[j];
        break;
      }
    }
    const emitted: string[] = [];
    for (let i = 0; i < children.length; i++) {
      if (!flags[i]) continue;
      const node = children[i];
      if (node.kind === "group") {
        const inner = emitChildren(node.children, keepStatements);
        if (inner.length === 0) continue; // defensive: never emit an empty block
        const allChildrenKept = node.children.every((_, j) => flags[j]);
        if (allChildrenKept) {
          emitted.push(node.raw);
        } else {
          emitted.push(`${node.prelude.trim()} {\n${inner.join("\n")}\n}`);
        }
      } else {
        emitted.push(node.raw);
      }
    }
    return emitted;
  };

  const parts = emitChildren(nodes, kept.size > 0);
  const out = parts.length > 0 ? `${parts.join("\n\n")}\n` : "";

  const keptRules = rules.filter((r) => kept.has(r)).length;
  const keptKeyframes = keyframesList.filter((k) => kept.has(k.node)).length;
  const keptAtRuleBlocks =
    atRuleList.filter((a) => kept.has(a.node)).length +
    [...kept].filter((n) => n.kind === "group").length +
    propertyList.filter((p) => kept.has(p.node)).length;

  const matchedClasses = [...used].filter((c) => stylesheetClasses.has(c));
  const unmatchedClasses = [...used].filter((c) => !stylesheetClasses.has(c));

  return {
    css: out,
    usedClasses: [...used],
    matchedClasses,
    unmatchedClasses,
    totalRules: rules.length,
    keptRules,
    totalKeyframes: keyframesList.length,
    keptKeyframes,
    keptAtRuleBlocks,
    inputBytes: byteLength(css),
    outputBytes: byteLength(out),
  };
}

/** Convenience: is the given CSS structurally balanced? (re-export for plugin consumers) */
export { isBalancedCss };
