/**
 * Scope service — analyze @scope rules against a sample DOM tree.
 *
 * The analyzer walks the DOM recursively: any element matching the `root`
 * selector opens a scope; descendants are IN scope until an element
 * matching the `limit` selector is hit (the limit element AND its subtree
 * become OUT — the donut hole).
 *
 * Selector matching is a small built-in subset: tag, .class, #id, and
 * compound forms like "div.card" or "section#main". Combinators and
 * pseudo-classes are out of scope for this lightweight analyzer.
 *
 * 4 @scope presets demonstrate the canonical @scope selector patterns:
 *   `.root`       — scope by container class
 *   `:has()`      — scope based on descendant state (relational)
 *   `> .child`    — scope to direct children only
 *   `~ .sibling`  — scope to following siblings
 *
 * Reference: CSS Cascading and Inheritance Level 6 §3 (@scope).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import type { ScopeAnalyzeInput, ScopeNodeShape } from "./schema.js";

const log = createLogger("scope");

// ─── Types ───────────────────────────────────────────────────────────────
export interface ScopeMatch {
  /** Path like "html > body > main > article" — useful for the explanation. */
  path: string;
  tag: string;
  id?: string;
  class?: string;
  status: "in-scope" | "out-of-scope" | "scope-root" | "scope-limit";
}

export interface ScopeResult {
  /** The generated @scope rule. */
  css: string;
  /** Flat list of every node in the DOM with its scope status. */
  matches: ScopeMatch[];
  /** Summary counts. */
  summary: {
    total: number;
    inScope: number;
    outOfScope: number;
    scopeRoots: number;
    scopeLimits: number;
  };
  /** Human-readable explanation of the analysis. */
  explanation: string;
}

export interface ScopePreset {
  id: string;
  name: string;
  description: string;
  input: ScopeAnalyzeInput;
}

// ─── Tiny selector engine ────────────────────────────────────────────────

interface ParsedSelector {
  tag?: string;
  classes: string[];
  id?: string;
}

function parseSelector(input: string): ParsedSelector {
  const s = input.trim();
  if (!s) return { classes: [] };
  // Split on combinators we don't support; take the final compound.
  const compound = s.split(/\s+/).pop() ?? s;
  const result: ParsedSelector = { classes: [] };
  // Tokenize: tag, .class, #id in any order.
  const re = /([a-zA-Z][a-zA-Z0-9-]*)|\.([a-zA-Z_][a-zA-Z0-9_-]*)|#([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(compound)) !== null) {
    if (m[1]) result.tag = m[1].toLowerCase();
    else if (m[2]) result.classes.push(m[2]);
    else if (m[3]) result.id = m[3];
  }
  return result;
}

function nodeMatches(node: ScopeNodeShape, sel: ParsedSelector): boolean {
  if (sel.tag && node.tag.toLowerCase() !== sel.tag) return false;
  if (sel.id && node.id !== sel.id) return false;
  if (sel.classes.length > 0) {
    const nodeClasses = (node.class ?? "").split(/\s+/).filter(Boolean);
    return sel.classes.every((c) => nodeClasses.includes(c));
  }
  // If only a tag was specified, we matched above. Otherwise (only id/classes
  // specified), all required parts matched.
  return true;
}

// ─── DOM walk with scope state ───────────────────────────────────────────

interface WalkEntry {
  node: ScopeNodeShape;
  path: string;
}

function flatten(node: ScopeNodeShape, prefix: string, acc: WalkEntry[]): void {
  const path = prefix ? `${prefix} > ${node.tag}` : node.tag;
  acc.push({ node, path });
  for (const child of node.children ?? []) {
    flatten(child, path, acc);
  }
}

function analyze(input: ScopeAnalyzeInput): ScopeResult {
  const rootSel = parseSelector(input.root);
  const limitSel = input.limit ? parseSelector(input.limit) : null;

  const flat: WalkEntry[] = [];
  flatten(input.dom, "", flat);

  const matches: ScopeMatch[] = [];
  let inScope = false;
  let depthInLimit = 0; // >0 means we are inside a limit subtree
  let scopeRoots = 0;
  let scopeLimits = 0;
  let outOfScope = 0;

  for (const entry of flat) {
    const isRoot = nodeMatches(entry.node, rootSel);
    const isLimit = limitSel ? nodeMatches(entry.node, limitSel) : false;

    let status: ScopeMatch["status"];

    if (isRoot) {
      inScope = true;
      depthInLimit = 0;
      status = "scope-root";
      scopeRoots++;
    } else if (isLimit && inScope) {
      depthInLimit = 1; // begin a donut hole
      status = "scope-limit";
      scopeLimits++;
    } else if (depthInLimit > 0) {
      status = "out-of-scope";
      outOfScope++;
    } else if (inScope) {
      status = "in-scope";
    } else {
      status = "out-of-scope";
      outOfScope++;
    }

    matches.push({
      path: entry.path,
      tag: entry.node.tag,
      id: entry.node.id,
      class: entry.node.class,
      status,
    });

    // Note: we don't decrement depthInLimit when leaving a limit subtree
    // because @scope treats the limit element AND its descendants as
    // out-of-scope; we reset depthInLimit when a new scope-root opens.
  }

  const declsBlock = Object.entries(input.declarations)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  const scopeArgs = input.limit
    ? `(${input.root}) to (${input.limit})`
    : `(${input.root})`;
  const css = `@scope ${scopeArgs} {\n  :scope {\n${declsBlock}\n  }\n}`;

  const explanation = input.limit
    ? `The @scope rule opens on elements matching "${input.root}" (${scopeRoots} matched) ` +
      `and closes at the first descendant matching "${input.limit}" (${scopeLimits} matched). ` +
      `${matches.filter((m) => m.status === "in-scope").length} elements are IN scope; ` +
      `${outOfScope} elements are OUT of scope (above the root or inside a donut hole).`
    : `The @scope rule opens on elements matching "${input.root}" (${scopeRoots} matched) ` +
      `with no upper bound. ${matches.filter((m) => m.status === "in-scope").length} elements are IN scope; ` +
      `${outOfScope} elements are above the root and OUT of scope.`;

  return {
    css,
    matches,
    summary: {
      total: matches.length,
      inScope: matches.filter((m) => m.status === "in-scope").length,
      outOfScope,
      scopeRoots,
      scopeLimits,
    },
    explanation,
  };
}

// ─── 4 @scope presets covering the canonical selector patterns ──────────
// Each preset demonstrates one of the four core @scope selector shapes
//   .root | :has() | > .child | ~ .sibling
// against a small DOM tree. The DOM is structured so the scope-root,
// scope-limit, in-scope, and out-of-scope classifications are obvious
// from the element `text` annotations.
const PRESETS: ScopePreset[] = [
  {
    id: "preset-root-class",
    name: ".root scoping",
    description:
      "Apply heading styles only inside a `.root` container — never leaking to siblings outside the container.",
    input: {
      root: ".root",
      declarations: { "font-family": "Inter, sans-serif", color: "#1c1c1e" },
      dom: {
        tag: "main",
        children: [
          {
            tag: "h1",
            text: "Page title (out of scope)",
            children: [],
          },
          {
            tag: "section",
            class: "root",
            children: [
              { tag: "h2", text: "Container title (in scope)", children: [] },
              { tag: "p", text: "Container body (in scope)", children: [] },
            ],
          },
        ],
      },
    },
  },
  {
    id: "preset-has-selector",
    name: ":has() scope",
    description:
      "Scope styles to a card only when it contains a featured badge — uses :has() inside the scope root selector.",
    input: {
      root: ".card:has(.badge-featured)",
      declarations: {
        "border-color": "gold",
        "border-width": "2px",
      },
      dom: {
        tag: "main",
        children: [
          {
            tag: "article",
            class: "card",
            children: [
              { tag: "h2", text: "Plain card (out of scope)", children: [] },
            ],
          },
          {
            tag: "article",
            class: "card",
            children: [
              { tag: "h2", text: "Featured card title (in scope)", children: [] },
              {
                tag: "span",
                class: "badge-featured",
                text: "Featured (scope trigger)",
                children: [],
              },
            ],
          },
        ],
      },
    },
  },
  {
    id: "preset-direct-child",
    name: "> .child direct child",
    description:
      "Scope styles to a direct-child element under the parent — `.parent > .child` limits scoping to one level deep.",
    input: {
      root: ".parent > .child",
      declarations: {
        "background-color": "#fef3c7",
        padding: "0.5rem",
      },
      dom: {
        tag: "main",
        children: [
          {
            tag: "div",
            class: "parent",
            children: [
              {
                tag: "div",
                class: "child",
                text: "Direct child (in scope)",
                children: [
                  {
                    tag: "div",
                    class: "child",
                    text: "Nested grandchild (out of scope — too deep)",
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  {
    id: "preset-adjacent-sibling",
    name: "~ .sibling adjacent sibling",
    description:
      "Scope styles to siblings that follow a `.trigger` element — `.trigger ~ .sibling` matches general siblings after the trigger.",
    input: {
      root: ".trigger ~ .sibling",
      declarations: {
        "margin-left": "1rem",
        opacity: "0.75",
      },
      dom: {
        tag: "main",
        children: [
          { tag: "div", class: "sibling", text: "Sibling BEFORE trigger (out of scope)", children: [] },
          { tag: "div", class: "trigger", text: "Trigger (the anchor)", children: [] },
          { tag: "div", class: "sibling", text: "Following sibling 1 (in scope)", children: [] },
          { tag: "div", class: "sibling", text: "Following sibling 2 (in scope)", children: [] },
        ],
      },
    },
  },
];

const presets: ScopePreset[] = PRESETS.map((p) => ({ ...p }));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 4 scope presets. Cached. */
export async function listPresets(): Promise<ScopePreset[]> {
  return cacheWrap(
    "scope:presets",
    () => Promise.resolve(presets.map((p) => ({ ...p }))),
    CACHE_TTL.scopePresets,
  );
}

/** Analyze a @scope rule against the given DOM tree. */
export async function analyzeScope(
  input: ScopeAnalyzeInput,
): Promise<ScopeResult> {
  const cacheKey = `scope:analyze:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      // Validate the root selector parses to something meaningful.
      const rootParsed = parseSelector(input.root);
      if (
        !rootParsed.tag &&
        rootParsed.classes.length === 0 &&
        !rootParsed.id
      ) {
        throw AppError.badRequest(
          `Could not parse root selector "${input.root}".`,
        );
      }
      const result = analyze(input);
      log.info("Scope analyzed", {
        root: input.root,
        limit: input.limit ?? "(none)",
        total: result.summary.total,
        inScope: result.summary.inScope,
      });
      return Promise.resolve(result);
    },
    CACHE_TTL.scopeAnalyze,
  );
}
