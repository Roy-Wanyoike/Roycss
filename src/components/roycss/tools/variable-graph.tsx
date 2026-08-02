"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Network,
  AlertCircle,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Sparkles,
  Trash2,
  CircleDot,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * VariableDependencyGraph — a CSS Custom Property dependency analyzer.
 *
 * Paste CSS that uses `var(--x)` and the tool builds a directed dependency
 * graph: nodes are custom properties, edges are "A references B" relationships.
 *
 * Features
 *  - Debounced (~300ms) client-side parsing with no external deps.
 *  - Detects three classes of issues:
 *      • Circular references (Tarjan SCC) — rose, dashed.
 *      • Undefined references (var points to a name that's never defined) — amber.
 *      • Unused variables (defined but never referenced) — muted, dashed.
 *  - Layered (longest-path) graph layout computed via Kahn's algorithm.
 *      Cycle nodes are placed in a "Cycles" zone at the bottom.
 *  - Each node is a button — click to open a Popover with raw/resolved
 *      value, scope, incoming & outgoing edges.
 *  - "Copy resolved values" emits a `:root { ... }` block with all `var()`
 *      references recursively substituted (cycles & undefined fall back).
 *  - Density toggle (compact / comfortable).
 *
 * Parser notes
 *  - Brace-matching block walker (string-aware) recurses into @media / @supports.
 *  - Own declarations are extracted at depth 0 within each block body, so
 *      CSS Nesting child-rules are walked separately and their declarations
 *      are attributed to the correct scope.
 *  - `var(--name, fallback)` references are found by scanning for `var(` then
 *      matching parens (handles nested vars and color-mix args).
 *  - The whole `analyze` call is wrapped in try/catch — malformed CSS never
 *      crashes the UI.
 */

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_CSS = `:root {
  --brand: oklch(0.6 0.15 180);
  --brand-hover: oklch(0.55 0.18 180);
  --text: oklch(0.2 0.02 250);
  --text-muted: color-mix(in oklch, var(--text) 60%, transparent);
  --surface: oklch(0.98 0.005 250);
  --surface-raised: color-mix(in oklch, var(--surface) 85%, white);
  --border: color-mix(in oklch, var(--text) 15%, var(--surface));
  --focus-ring: var(--brand);
  --shadow-color: var(--text);
}
.card {
  background: var(--surface-raised);
  color: var(--text);
  border-color: var(--border);
}
.unused-var-example { color: var(--never-defined); }`;

type Density = "compact" | "comfortable";

interface Dims {
  NODE_W: number;
  NODE_H: number;
  GAP_X: number;
  GAP_Y: number;
}

const DENSITY: Record<Density, Dims> = {
  compact: { NODE_W: 144, NODE_H: 40, GAP_X: 18, GAP_Y: 44 },
  comfortable: { NODE_W: 176, NODE_H: 52, GAP_X: 30, GAP_Y: 60 },
};

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface VarDef {
  name: string;
  value: string;
  /** Selector of the enclosing block (e.g. ":root", ".card"). */
  scope: string;
}

interface VarRef {
  /** Variable name that contains this ref, or "inline" if used in a plain property. */
  source: string;
  /** CSS property containing the ref (e.g. "background" or "--text-muted"). */
  sourceProperty: string;
  scope: string;
  target: string;
  fallback?: string;
}

interface CycleFinding {
  /** Ordered cycle path, e.g. ["--a", "--b", "--a"]. */
  path: string[];
}

interface UndefinedFinding {
  source: string;
  sourceProperty: string;
  target: string;
  fallback?: string;
  scope: string;
}

interface AnalysisCore {
  defs: VarDef[];
  defMap: Map<string, VarDef>;
  refs: VarRef[];
  /** All node names (defined + referenced-as-target). */
  allNodes: Set<string>;
  /** A → set of B (A depends on B). */
  adj: Map<string, Set<string>>;
  /** B → set of A (A depends on B). */
  radj: Map<string, Set<string>>;
  /** Names referenced by any var or inline usage. */
  referencedNames: Set<string>;
  cycleNodeSet: Set<string>;
  cycles: CycleFinding[];
  undefinedRefs: UndefinedFinding[];
  unusedVars: string[];
  stats: {
    defined: number;
    references: number;
    cycles: number;
    undefined: number;
    unused: number;
  };
  error: string | null;
}

interface PositionedNode {
  name: string;
  value: string;
  scope: string;
  resolved: string;
  x: number;
  y: number;
  isCycle: boolean;
  isUnused: boolean;
  isUndefined: boolean;
  swatch: string | null;
  incoming: string[];
  outgoing: string[];
}

interface GraphEdge {
  from: string;
  to: string;
  isCycle: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface LayoutResult {
  nodes: PositionedNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  cycleRowY: number;
  hasCycleRow: boolean;
}

const EMPTY_CORE: AnalysisCore = {
  defs: [],
  defMap: new Map(),
  refs: [],
  allNodes: new Set(),
  adj: new Map(),
  radj: new Map(),
  referencedNames: new Set(),
  cycleNodeSet: new Set(),
  cycles: [],
  undefinedRefs: [],
  unusedVars: [],
  stats: { defined: 0, references: 0, cycles: 0, undefined: 0, unused: 0 },
  error: null,
};

/* ═══════════════════════════════════════════════════════════════
   CSS PARSING HELPERS  (dependency-free, defensive)
   ═══════════════════════════════════════════════════════════════ */

/** Strip /* ... *\/ comments (multiline-aware). */
function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, "");
}

interface CssBlock {
  selector: string;
  body: string;
  isAtRule: boolean;
}

/** Walk CSS and return all top-level { ... } blocks. Quoted strings are
 *  honoured so braces inside `content: "}"` don't confuse the scanner.
 *  Top-level `;` (e.g. end of `@import url("...");`) advances the
 *  selector start so the next rule's selector isn't polluted. */
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
          if (block) block.body = css.slice(bodyStart, i);
          selectorStart = i + 1;
        }
      }
    } else if (ch === ";" && depth === 0) {
      selectorStart = i + 1;
    }
    i++;
  }
  return blocks;
}

/** Recursively collect all rule blocks, descending into @media / @supports
 *  (but NOT @keyframes / @font-face / @page — their bodies are flat
 *  descriptors, not nested rules). */
function findAllBlocks(css: string): CssBlock[] {
  const top = findTopLevelBlocks(css);
  const out: CssBlock[] = [];
  for (const block of top) {
    out.push(block);
    if (
      block.isAtRule &&
      !/^@(-\w+-)?keyframes\b/i.test(block.selector) &&
      !/^@(-\w+-)?(font-face|page|viewport|counter-style|font-palette-values|property|color-profile)\b/i.test(
        block.selector,
      )
    ) {
      out.push(...findAllBlocks(block.body));
    }
  }
  return out;
}

/** Extract declarations at depth 0 within a block body (so CSS Nesting
 *  child rules are skipped — they get walked as their own blocks). */
function extractOwnDeclarations(
  body: string,
): { property: string; value: string }[] {
  const decls: { property: string; value: string }[] = [];
  let depth = 0;
  let i = 0;
  const n = body.length;
  let declStart = 0;
  while (i < n) {
    const ch = body[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < n && body[i] !== q) {
        if (body[i] === "\\") i++;
        i++;
      }
      i++;
      continue;
    }
    if (ch === "{") {
      depth++;
      i++;
      continue;
    }
    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      declStart = i + 1;
      i++;
      continue;
    }
    if (ch === ";" && depth === 0) {
      const raw = body.slice(declStart, i).trim();
      if (raw) {
        const colon = raw.indexOf(":");
        if (colon > 0) {
          const property = raw.slice(0, colon).trim();
          const value = raw.slice(colon + 1).trim();
          if (property && value) decls.push({ property, value });
        }
      }
      declStart = i + 1;
    }
    i++;
  }
  // Trailing declaration without `;`
  const tail = body.slice(declStart).trim();
  if (tail && !tail.includes("{") && !tail.includes("}")) {
    const colon = tail.indexOf(":");
    if (colon > 0) {
      const property = tail.slice(0, colon).trim();
      const value = tail.slice(colon + 1).trim();
      if (property && value) decls.push({ property, value });
    }
  }
  return decls;
}

/** Normalise a block selector for display as the variable's "scope".
 *  At-rule blocks (rare to contain var defs directly) get their braces
 *  stripped; empty selectors default to ":root". */
function normalizeScope(selector: string): string {
  const s = selector.trim().replace(/\s+/g, " ");
  if (!s) return ":root";
  return s;
}

interface ParsedVar {
  target: string;
  fallback?: string;
}

/** Find all `var(--name, fallback)` references in a value. Handles nested
 *  vars (e.g. `var(--a, var(--b, #000))`) and refs inside `color-mix(...)`
 *  args. Returns one entry per `var()` occurrence (including nested ones). */
function findVarReferences(value: string): ParsedVar[] {
  const refs: ParsedVar[] = [];
  const re = /\bvar\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    const afterVar = m.index + m[0].length;
    let depth = 1;
    let i = afterVar;
    while (i < value.length && depth > 0) {
      const ch = value[i];
      if (ch === '"' || ch === "'") {
        const q = ch;
        i++;
        while (i < value.length && value[i] !== q) {
          if (value[i] === "\\") i++;
          i++;
        }
        i++;
        continue;
      }
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }
    if (depth !== 0) break; // unbalanced — abort
    const inner = value.slice(afterVar, i);
    // Split on the FIRST top-level comma (depth 0 within inner).
    let commaPos = -1;
    let d = 0;
    for (let j = 0; j < inner.length; j++) {
      const ch = inner[j];
      if (ch === '"' || ch === "'") {
        const q = ch;
        j++;
        while (j < inner.length && inner[j] !== q) j++;
        continue;
      }
      if (ch === "(") d++;
      else if (ch === ")") d = Math.max(0, d - 1);
      else if (ch === "," && d === 0) {
        commaPos = j;
        break;
      }
    }
    const target = (commaPos === -1 ? inner : inner.slice(0, commaPos)).trim();
    const fallback =
      commaPos === -1 ? undefined : inner.slice(commaPos + 1).trim();
    if (target.startsWith("--")) {
      refs.push({ target, fallback });
    }
    // Recurse into the fallback so nested vars are also captured.
    if (fallback) {
      refs.push(...findVarReferences(fallback));
    }
    // Advance past this var() so the regex doesn't rescan inside it.
    re.lastIndex = i + 1;
  }
  return refs;
}

/* ═══════════════════════════════════════════════════════════════
   GRAPH ALGORITHMS
   ═══════════════════════════════════════════════════════════════ */

/** Iterative Tarjan's strongly-connected-components algorithm.
 *  Returns SCCs as arrays of node names. SCCs of size > 1, or size 1
 *  with a self-loop, are cycles. */
function tarjanSCC(
  nodes: string[],
  adj: Map<string, Set<string>>,
): string[][] {
  let index = 0;
  const indices = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  for (const start of nodes) {
    if (indices.has(start)) continue;
    indices.set(start, index);
    lowLinks.set(start, index);
    index++;
    stack.push(start);
    onStack.add(start);

    // Each frame tracks the current node and an iterator over its neighbours.
    const workStack: {
      node: string;
      neighbors: string[];
      idx: number;
    }[] = [
      {
        node: start,
        neighbors: [...(adj.get(start) ?? [])],
        idx: 0,
      },
    ];

    while (workStack.length > 0) {
      const frame = workStack[workStack.length - 1];
      if (frame.idx < frame.neighbors.length) {
        const w = frame.neighbors[frame.idx++];
        if (!indices.has(w)) {
          indices.set(w, index);
          lowLinks.set(w, index);
          index++;
          stack.push(w);
          onStack.add(w);
          workStack.push({
            node: w,
            neighbors: [...(adj.get(w) ?? [])],
            idx: 0,
          });
        } else if (onStack.has(w)) {
          lowLinks.set(
            frame.node,
            Math.min(lowLinks.get(frame.node)!, indices.get(w)!),
          );
        }
      } else {
        // Done visiting frame.node's neighbours.
        if (lowLinks.get(frame.node) === indices.get(frame.node)) {
          const scc: string[] = [];
          let w: string;
          do {
            w = stack.pop()!;
            onStack.delete(w);
            scc.push(w);
          } while (w !== frame.node);
          sccs.push(scc);
        }
        workStack.pop();
        if (workStack.length > 0) {
          const parent = workStack[workStack.length - 1];
          lowLinks.set(
            parent.node,
            Math.min(
              lowLinks.get(parent.node)!,
              lowLinks.get(frame.node)!,
            ),
          );
        }
      }
    }
  }
  return sccs;
}

/** Given an SCC that contains a cycle, return an ordered cycle path such
 *  that path[0] → path[1] → ... → path[n-1] → path[0]. */
function findCyclePath(
  scc: string[],
  adj: Map<string, Set<string>>,
): string[] {
  if (scc.length === 0) return [];
  const sccSet = new Set(scc);
  const start = scc[0];
  const visited = new Set<string>();
  const path: string[] = [];
  let current: string | null = start;

  while (current && !visited.has(current)) {
    visited.add(current);
    path.push(current);
    const next = [...(adj.get(current) ?? [])].find((n) => sccSet.has(n));
    current = next ?? null;
  }

  if (current) {
    const cycleStart = path.indexOf(current);
    return [...path.slice(cycleStart), current];
  }
  return path.length > 0 ? [...path, path[0]] : path;
}

/** Longest-path layering via Kahn's algorithm (roots at layer 0).
 *  Cycle nodes are excluded — they go to the cycle zone separately.
 *  `layer(n) = 0` if no other variable depends on n; otherwise
 *  `layer(n) = max(layer(dependent)) + 1`. */
function computeLayers(
  allNodes: string[],
  adj: Map<string, Set<string>>,
  cycleNodeSet: Set<string>,
): Map<string, number> {
  const layerMap = new Map<string, number>();
  const nonCycle = allNodes.filter((n) => !cycleNodeSet.has(n));
  const nonCycleSet = new Set(nonCycle);

  // Build DAG restricted to non-cycle nodes.
  const inDegree = new Map<string, number>();
  const dagAdj = new Map<string, Set<string>>();
  for (const n of nonCycle) {
    inDegree.set(n, 0);
    dagAdj.set(n, new Set());
  }
  for (const n of nonCycle) {
    for (const t of adj.get(n) ?? []) {
      if (nonCycleSet.has(t)) {
        dagAdj.get(n)!.add(t);
        inDegree.set(t, (inDegree.get(t) ?? 0) + 1);
      }
    }
  }

  let queue = nonCycle.filter((n) => (inDegree.get(n) ?? 0) === 0);
  for (const n of queue) layerMap.set(n, 0);

  while (queue.length > 0) {
    const next: string[] = [];
    for (const n of queue) {
      for (const t of dagAdj.get(n) ?? []) {
        const newDeg = (inDegree.get(t) ?? 0) - 1;
        inDegree.set(t, newDeg);
        const newLayer = Math.max(
          layerMap.get(t) ?? 0,
          (layerMap.get(n) ?? 0) + 1,
        );
        layerMap.set(t, newLayer);
        if (newDeg === 0) next.push(t);
      }
    }
    queue = next;
  }
  return layerMap;
}

/* ═══════════════════════════════════════════════════════════════
   VALUE RESOLUTION & SWATCH DETECTION
   ═══════════════════════════════════════════════════════════════ */

/** Recursively substitute `var(--x)` references inside `value` using the
 *  def map. Stops at cycles (uses fallback, else `<cycle>`) and undefined
 *  targets (uses fallback, else `<undef: --x>`). Depth-capped at 50. */
function substituteVars(
  value: string,
  defs: Map<string, VarDef>,
  visited: Set<string>,
  depth: number,
): string {
  if (depth > 50) return value;
  let result = "";
  let lastIdx = 0;
  const re = /\bvar\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    const varStart = m.index;
    const afterVar = m.index + m[0].length;
    let depthP = 1;
    let i = afterVar;
    while (i < value.length && depthP > 0) {
      const ch = value[i];
      if (ch === '"' || ch === "'") {
        const q = ch;
        i++;
        while (i < value.length && value[i] !== q) {
          if (value[i] === "\\") i++;
          i++;
        }
        i++;
        continue;
      }
      if (ch === "(") depthP++;
      else if (ch === ")") {
        depthP--;
        if (depthP === 0) break;
      }
      i++;
    }
    if (depthP !== 0) break;

    result += value.slice(lastIdx, varStart);
    const inner = value.slice(afterVar, i);
    let commaPos = -1;
    let d = 0;
    for (let j = 0; j < inner.length; j++) {
      const ch = inner[j];
      if (ch === '"' || ch === "'") {
        const q = ch;
        j++;
        while (j < inner.length && inner[j] !== q) j++;
        continue;
      }
      if (ch === "(") d++;
      else if (ch === ")") d = Math.max(0, d - 1);
      else if (ch === "," && d === 0) {
        commaPos = j;
        break;
      }
    }
    const target = (commaPos === -1 ? inner : inner.slice(0, commaPos)).trim();
    const fallback =
      commaPos === -1 ? undefined : inner.slice(commaPos + 1).trim();

    if (!target.startsWith("--")) {
      // Not a valid custom-property name — keep literal.
      result += value.slice(varStart, i + 1);
    } else if (visited.has(target)) {
      result += fallback
        ? substituteVars(fallback, defs, visited, depth + 1)
        : `<cycle>`;
    } else {
      const def = defs.get(target);
      if (!def) {
        result += fallback
          ? substituteVars(fallback, defs, visited, depth + 1)
          : `<undef: ${target}>`;
      } else {
        const resolved = substituteVars(
          def.value,
          defs,
          new Set([...visited, target]),
          depth + 1,
        );
        result += resolved;
      }
    }

    lastIdx = i + 1;
    re.lastIndex = i + 1;
  }
  result += value.slice(lastIdx);
  return result;
}

const NAMED_COLORS = new Set([
  "red", "blue", "green", "black", "white", "yellow", "cyan", "magenta",
  "gray", "grey", "orange", "purple", "pink", "brown", "transparent",
  "currentcolor", "aqua", "fuchsia", "lime", "maroon", "navy", "olive",
  "silver", "teal", "rebeccapurple", "cornflowerblue", "aliceblue",
]);

/** Determine whether a value can be rendered as a CSS colour swatch. */
function isColorValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  if (/\bvar\s*\(/.test(v)) return false; // contains unresolved var()
  if (
    v.startsWith("oklch") ||
    v.startsWith("oklab") ||
    v.startsWith("lab(") ||
    v.startsWith("lch(") ||
    v.startsWith("hwb(") ||
    v.startsWith("rgb") ||
    v.startsWith("hsl") ||
    v.startsWith("#") ||
    v.startsWith("color-mix") ||
    v.startsWith("color(")
  ) {
    return true;
  }
  return NAMED_COLORS.has(v);
}

/** Extract a swatch colour from the value, preferring the resolved form. */
function extractSwatch(
  rawValue: string,
  resolvedValue: string,
): string | null {
  const candidates = [resolvedValue, rawValue];
  for (const v of candidates) {
    if (!v || v.startsWith("<")) continue;
    if (isColorValue(v)) return v.trim();
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   ANALYSIS
   ═══════════════════════════════════════════════════════════════ */

function analyzeCss(css: string): AnalysisCore {
  if (!css || !css.trim()) return EMPTY_CORE;
  try {
    const cleaned = stripComments(css);
    const blocks = findAllBlocks(cleaned);

    const defs: VarDef[] = [];
    const refs: VarRef[] = [];

    for (const block of blocks) {
      const scope = normalizeScope(block.selector);
      const decls = extractOwnDeclarations(block.body);
      for (const decl of decls) {
        const isCustomProp = decl.property.startsWith("--");
        if (isCustomProp) {
          defs.push({ name: decl.property, value: decl.value, scope });
        }
        const varRefs = findVarReferences(decl.value);
        for (const ref of varRefs) {
          refs.push({
            source: isCustomProp ? decl.property : "inline",
            sourceProperty: decl.property,
            scope,
            target: ref.target,
            fallback: ref.fallback,
          });
        }
      }
    }

    // First-def-wins map (so duplicate definitions across scopes don't
    // multiply the node set).
    const defMap = new Map<string, VarDef>();
    for (const d of defs) {
      if (!defMap.has(d.name)) defMap.set(d.name, d);
    }

    // All node names = defined + referenced-as-target.
    const allNodes = new Set<string>();
    for (const d of defs) allNodes.add(d.name);
    for (const r of refs) allNodes.add(r.target);

    // Adjacency (only for variable→variable edges; "inline" sources aren't nodes).
    const adj = new Map<string, Set<string>>();
    const radj = new Map<string, Set<string>>();
    for (const name of allNodes) {
      adj.set(name, new Set());
      radj.set(name, new Set());
    }
    for (const r of refs) {
      if (r.source !== "inline") {
        adj.get(r.source)?.add(r.target);
        radj.get(r.target)?.add(r.source);
      }
    }

    // Cycle detection (Tarjan SCC).
    const sccs = tarjanSCC([...allNodes], adj);
    const cycleNodeSet = new Set<string>();
    const cycles: CycleFinding[] = [];
    for (const scc of sccs) {
      if (scc.length > 1) {
        for (const n of scc) cycleNodeSet.add(n);
        const path = findCyclePath(scc, adj);
        cycles.push({ path });
      } else if (scc.length === 1) {
        const n = scc[0];
        if (adj.get(n)?.has(n)) {
          cycleNodeSet.add(n);
          cycles.push({ path: [n, n] });
        }
      }
    }

    // Referenced names = any var that appears as a target (var or inline).
    const referencedNames = new Set<string>();
    for (const r of refs) referencedNames.add(r.target);

    // Undefined refs (dedupe by source+target).
    const undefinedRefs: UndefinedFinding[] = [];
    const seenUndef = new Set<string>();
    for (const r of refs) {
      if (defMap.has(r.target)) continue;
      const key = `${r.source}:${r.target}`;
      if (seenUndef.has(key)) continue;
      seenUndef.add(key);
      undefinedRefs.push({
        source: r.source,
        sourceProperty: r.sourceProperty,
        target: r.target,
        fallback: r.fallback,
        scope: r.scope,
      });
    }

    // Unused vars (defined, never referenced by var or inline).
    const seenUnused = new Set<string>();
    const unusedVars: string[] = [];
    for (const d of defs) {
      if (referencedNames.has(d.name)) continue;
      if (seenUnused.has(d.name)) continue;
      seenUnused.add(d.name);
      unusedVars.push(d.name);
    }

    return {
      defs,
      defMap,
      refs,
      allNodes,
      adj,
      radj,
      referencedNames,
      cycleNodeSet,
      cycles,
      undefinedRefs,
      unusedVars,
      stats: {
        defined: defMap.size,
        references: refs.length,
        cycles: cycles.length,
        undefined: undefinedRefs.length,
        unused: unusedVars.length,
      },
      error: null,
    };
  } catch (err) {
    return {
      ...EMPTY_CORE,
      error: err instanceof Error ? err.message : "Failed to parse CSS",
    };
  }
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════════════════════════════ */

function computeLayout(core: AnalysisCore, density: Density): LayoutResult {
  const { NODE_W, NODE_H, GAP_X, GAP_Y } = DENSITY[density];
  const allNodes = [...core.allNodes];

  if (allNodes.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0, cycleRowY: 0, hasCycleRow: false };
  }

  const layerMap = computeLayers(allNodes, core.adj, core.cycleNodeSet);

  // Group non-cycle nodes by layer (sorted within layer for determinism).
  const layerNodesMap = new Map<number, string[]>();
  for (const [name, layer] of layerMap) {
    if (!layerNodesMap.has(layer)) layerNodesMap.set(layer, []);
    layerNodesMap.get(layer)!.push(name);
  }
  for (const arr of layerNodesMap.values()) arr.sort();

  const maxLayer = layerNodesMap.size === 0 ? -1 : Math.max(...layerNodesMap.keys());
  const cycleLayer = maxLayer + 1;
  const cycleNodes = [...core.cycleNodeSet].sort();

  type LayerInfo = { nodes: string[]; isCycle: boolean };
  const layers: LayerInfo[] = [];
  for (let l = 0; l <= maxLayer; l++) {
    const ns = layerNodesMap.get(l);
    if (ns && ns.length > 0) layers.push({ nodes: ns, isCycle: false });
  }
  if (cycleNodes.length > 0) {
    layers.push({ nodes: cycleNodes, isCycle: true });
  }

  const maxLayerWidth = Math.max(1, ...layers.map((l) => l.nodes.length));
  const width = Math.max(
    320,
    maxLayerWidth * NODE_W + (maxLayerWidth + 1) * GAP_X,
  );

  const positions = new Map<
    string,
    { x: number; y: number; isCycle: boolean }
  >();
  let yCursor = GAP_Y;
  let cycleRowY = 0;
  let hasCycleRow = false;
  for (const layerInfo of layers) {
    if (layerInfo.isCycle) {
      // Reserve a small header strip above the cycle row.
      yCursor += 14;
      cycleRowY = yCursor - 14;
      hasCycleRow = true;
    }
    const count = layerInfo.nodes.length;
    const totalWidth = count * NODE_W + Math.max(0, count - 1) * GAP_X;
    const startX = Math.max(GAP_X, (width - totalWidth) / 2);
    layerInfo.nodes.forEach((name, idx) => {
      positions.set(name, {
        x: startX + idx * (NODE_W + GAP_X),
        y: yCursor,
        isCycle: layerInfo.isCycle,
      });
    });
    yCursor += NODE_H + GAP_Y;
  }
  const height = Math.max(yCursor, NODE_H + 2 * GAP_Y);

  const nodes: PositionedNode[] = [];
  for (const name of allNodes) {
    const def = core.defMap.get(name);
    const pos = positions.get(name);
    if (!pos) continue;
    const incoming = [...(core.radj.get(name) ?? [])].sort();
    const outgoing = [...(core.adj.get(name) ?? [])].sort();
    const resolved = def
      ? substituteVars(def.value, core.defMap, new Set([name]), 0)
      : "<undefined>";
    nodes.push({
      name,
      value: def?.value ?? "(undefined)",
      scope: def?.scope ?? "(global)",
      resolved,
      x: pos.x,
      y: pos.y,
      isCycle: pos.isCycle,
      isUnused: !core.referencedNames.has(name) && !!def,
      isUndefined: !def,
      swatch: def ? extractSwatch(def.value, resolved) : null,
      incoming,
      outgoing,
    });
  }

  const edges: GraphEdge[] = [];
  for (const [from, targets] of core.adj) {
    const fromPos = positions.get(from);
    if (!fromPos) continue;
    for (const to of targets) {
      const toPos = positions.get(to);
      if (!toPos) continue;
      const isCycleEdge =
        core.cycleNodeSet.has(from) && core.cycleNodeSet.has(to);
      edges.push({
        from,
        to,
        isCycle: isCycleEdge,
        x1: fromPos.x + NODE_W / 2,
        y1: fromPos.y + NODE_H, // bottom of `from`
        x2: toPos.x + NODE_W / 2,
        y2: toPos.y, // top of `to`
      });
    }
  }

  return { nodes, edges, width, height, cycleRowY, hasCycleRow };
}

/** Build a `:root { --name: <resolved>; }` block from the defs. */
function buildResolvedBlock(core: AnalysisCore): string {
  const lines: string[] = [":root {"];
  for (const [name, def] of core.defMap) {
    const resolved = substituteVars(def.value, core.defMap, new Set([name]), 0);
    lines.push(`  ${name}: ${resolved};`);
  }
  lines.push("}");
  return lines.join("\n");
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dy = y2 - y1;
  const cy1 = y1 + dy * 0.5;
  const cy2 = y2 - dy * 0.5;
  return `M ${x1},${y1} C ${x1},${cy1} ${x2},${cy2} ${x2},${y2}`;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function VariableDependencyGraph() {
  const [input, setInput] = useState(DEFAULT_CSS);
  const [debounced, setDebounced] = useState(DEFAULT_CSS);
  const [density, setDensity] = useState<Density>("comfortable");
  const [copied, setCopied] = useState(false);
  const [inputOpen, setInputOpen] = useState(true);

  // Debounce the input ~300ms.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input), 300);
    return () => window.clearTimeout(t);
  }, [input]);

  const core = useMemo(() => analyzeCss(debounced), [debounced]);
  const layout = useMemo(
    () => computeLayout(core, density),
    [core, density],
  );

  const handleLoadExample = useCallback(() => {
    setInput(DEFAULT_CSS);
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
  }, []);

  const handleCopy = useCallback(async () => {
    if (core.defMap.size === 0) return;
    try {
      const text = buildResolvedBlock(core);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [core]);

  const hasInput = input.trim().length > 0;
  const hasNodes = layout.nodes.length > 0;
  const dims = DENSITY[density];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Network className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            CSS Variable Dependency Graph
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Map <code className="font-mono text-xs">var(--x)</code> references,
            spot cycles, undefined targets, and unused tokens.
          </p>
        </div>
      </div>

      {/* Collapsible CSS input */}
      <Collapsible open={inputOpen} onOpenChange={setInputOpen}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="var-graph-input"
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
              <CollapsibleTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  aria-label={inputOpen ? "Collapse CSS input" : "Expand CSS input"}
                >
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      inputOpen ? "rotate-180" : "",
                    )}
                  />
                  {inputOpen ? "Hide" : "Show"}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent>
            <Textarea
              id="var-graph-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                "/* Paste CSS with var(--…) references */\n:root {\n  --brand: oklch(0.6 0.15 180);\n  --text: var(--brand);\n}"
              }
              rows={10}
              spellCheck={false}
              className="font-mono text-xs leading-relaxed resize-y min-h-[180px]"
              aria-describedby="var-graph-help"
            />
            <p id="var-graph-help" className="text-[11px] text-muted-foreground mt-1.5">
              Parsing runs client-side. Custom properties can be defined in any
              selector — their scope is recorded. Nested <code className="font-mono">var(--a, var(--b))</code>{" "}
              and <code className="font-mono">color-mix(in oklch, var(--x) …)</code> are supported.
            </p>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Stats summary */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Badge variant="secondary" className="font-mono tabular-nums">
          {core.stats.defined} defined
        </Badge>
        <Badge variant="secondary" className="font-mono tabular-nums">
          {core.stats.references} refs
        </Badge>
        {core.stats.cycles > 0 ? (
          <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 font-mono tabular-nums">
            <AlertCircle className="size-3" />
            {core.stats.cycles} cycle{core.stats.cycles === 1 ? "" : "s"}
          </Badge>
        ) : null}
        {core.stats.undefined > 0 ? (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-mono tabular-nums">
            <AlertTriangle className="size-3" />
            {core.stats.undefined} undefined
          </Badge>
        ) : null}
        {core.stats.unused > 0 ? (
          <Badge variant="outline" className="font-mono tabular-nums text-muted-foreground">
            <Info className="size-3" />
            {core.stats.unused} unused
          </Badge>
        ) : null}
      </div>

      {/* Error state */}
      {core.error && (
        <div
          role="alert"
          className="rounded-lg border border-l-4 border-rose-500/40 border-border bg-rose-500/5 p-3 text-xs text-foreground"
        >
          <div className="flex items-center gap-2 font-medium text-rose-600">
            <AlertCircle className="size-4" />
            Parse error
          </div>
          <p className="mt-1 text-muted-foreground font-mono break-all">{core.error}</p>
        </div>
      )}

      {/* Empty state */}
      {!hasNodes && !core.error && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Network className="size-6" />
          </div>
          <p className="text-sm font-medium text-foreground">No custom properties found</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Paste CSS with <code className="font-mono">--name</code> definitions
            and <code className="font-mono">var(--name)</code> references to
            build the dependency graph.
          </p>
          <Button size="sm" onClick={handleLoadExample} className="mt-4 h-8">
            <Sparkles className="size-4" />
            Load example
          </Button>
        </div>
      )}

      {/* Main: graph + findings side panel */}
      {hasNodes && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem] gap-4">
          {/* Graph column */}
          <div className="space-y-3 min-w-0">
            <div className="bg-card border border-border rounded-lg p-4 overflow-auto max-h-[500px]">
              <div
                className="relative mx-auto"
                style={{
                  width: Math.max(layout.width, 100),
                  height: Math.max(layout.height, 60),
                  minWidth: "100%",
                }}
              >
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={layout.width}
                  height={layout.height}
                  role="img"
                  aria-label={`Dependency graph: ${layout.nodes.length} nodes, ${layout.edges.length} edges${core.stats.cycles > 0 ? `, ${core.stats.cycles} cycle${core.stats.cycles === 1 ? "" : "s"}` : ""}.`}
                >
                  <defs>
                    <marker
                      id="vg-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground" />
                    </marker>
                    <marker
                      id="vg-arrow-cycle"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" className="fill-rose-500" />
                    </marker>
                  </defs>

                  {/* Edges */}
                  {layout.edges.map((edge, i) => (
                    <path
                      key={`${edge.from}-${edge.to}-${i}`}
                      d={bezierPath(edge.x1, edge.y1, edge.x2, edge.y2)}
                      className={edge.isCycle ? "stroke-rose-500" : "stroke-muted-foreground/50"}
                      strokeDasharray={edge.isCycle ? "4 3" : undefined}
                      strokeWidth={1.5}
                      fill="none"
                      markerEnd={edge.isCycle ? "url(#vg-arrow-cycle)" : "url(#vg-arrow)"}
                    />
                  ))}

                  {/* Cycle row header */}
                  {layout.hasCycleRow && (
                    <g>
                      <text
                        x={12}
                        y={layout.cycleRowY + 10}
                        className="fill-rose-600"
                        fontSize="10"
                        fontWeight="600"
                      >
                        ⚠ Cycles
                      </text>
                    </g>
                  )}
                </svg>

                {/* Nodes (HTML buttons overlaid on the SVG) */}
                {layout.nodes.map((node) => {
                  const swatchStyle = node.swatch
                    ? { backgroundColor: node.swatch }
                    : undefined;
                  return (
                    <motion.div
                      key={node.name}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.18,
                        delay: Math.min(
                          (node.isCycle ? 0.2 : node.y / 800) * 0.4,
                          0.4,
                        ),
                      }}
                      className="absolute"
                      style={{
                        left: node.x,
                        top: node.y,
                        width: dims.NODE_W,
                        height: dims.NODE_H,
                      }}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "group w-full h-full flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-mono text-left",
                              "bg-background border-border hover:border-primary hover:z-10 transition-colors",
                              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-20",
                              node.isCycle &&
                                "border-rose-500/60 bg-rose-500/5 hover:border-rose-500",
                              node.isUndefined &&
                                "border-amber-500/60 bg-amber-500/5 hover:border-amber-500",
                              node.isUnused &&
                                "border-dashed border-muted-foreground/40 opacity-75",
                            )}
                            aria-label={[
                              `Variable ${node.name}`,
                              node.isCycle ? ", part of a circular reference" : "",
                              node.isUndefined ? ", undefined (never defined)" : "",
                              node.isUnused ? ", unused (never referenced)" : "",
                              `. Scope: ${node.scope}.`,
                              ` References: ${node.outgoing.length}.`,
                              ` Referenced by: ${node.incoming.length}.`,
                            ].join("")}
                          >
                            {node.swatch ? (
                              <span
                                className="inline-block size-3 rounded-full border border-border/60 shrink-0"
                                style={swatchStyle}
                                aria-hidden="true"
                              />
                            ) : (
                              <CircleDot
                                className="size-3 text-muted-foreground shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <span className="truncate flex-1">{node.name}</span>
                            {node.isUnused && (
                              <span className="ml-auto rounded bg-muted px-1 py-px text-[9px] text-muted-foreground uppercase tracking-wide">
                                unused
                              </span>
                            )}
                            {node.isUndefined && (
                              <span className="ml-auto rounded bg-amber-500/15 px-1 py-px text-[9px] text-amber-600 uppercase tracking-wide">
                                undef
                              </span>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-80 text-xs"
                          align="start"
                          sideOffset={4}
                        >
                          <NodeDetail node={node} />
                        </PopoverContent>
                      </Popover>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Graph controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                disabled={core.defMap.size === 0}
                aria-label="Copy resolved CSS variable values to clipboard"
                className="h-7 text-xs"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied!" : "Copy resolved values"}
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Label
                  htmlFor="vg-density"
                  className="text-xs text-muted-foreground"
                >
                  Compact
                </Label>
                <Switch
                  id="vg-density"
                  checked={density === "comfortable"}
                  onCheckedChange={(v) =>
                    setDensity(v ? "comfortable" : "compact")
                  }
                  aria-label="Toggle layout density"
                />
                <Label
                  htmlFor="vg-density"
                  className="text-xs text-muted-foreground"
                >
                  Comfortable
                </Label>
              </div>
            </div>
          </div>

          {/* Findings side panel */}
          <div className="space-y-2 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
            <FindingsPanel core={core} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function NodeDetail({ node }: { node: PositionedNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        {node.swatch ? (
          <span
            className="size-3.5 rounded-full border border-border shrink-0"
            style={{ backgroundColor: node.swatch }}
            aria-hidden="true"
          />
        ) : (
          <CircleDot className="size-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="font-mono font-semibold text-sm text-foreground truncate">
          {node.name}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {node.isCycle && (
            <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 text-[9px] px-1.5 py-0">
              cycle
            </Badge>
          )}
          {node.isUndefined && (
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[9px] px-1.5 py-0">
              undefined
            </Badge>
          )}
          {node.isUnused && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              unused
            </Badge>
          )}
        </div>
      </div>

      <DetailRow label="Scope">
        <code className="font-mono text-foreground text-[11px] break-all">
          {node.scope}
        </code>
      </DetailRow>

      <DetailRow label="Raw value">
        <code className="font-mono text-foreground text-[11px] break-all">
          {node.value}
        </code>
      </DetailRow>

      <DetailRow label="Resolved">
        <code
          className={cn(
            "font-mono text-[11px] break-all",
            node.resolved.startsWith("<")
              ? "text-rose-600"
              : "text-foreground",
          )}
        >
          {node.resolved}
        </code>
      </DetailRow>

      <DetailRow label={`Referenced by (${node.incoming.length})`}>
        {node.incoming.length === 0 ? (
          <span className="text-muted-foreground italic text-[11px]">
            No variable references this.
          </span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {node.incoming.map((n) => (
              <Badge
                key={n}
                variant="outline"
                className="font-mono text-[10px] px-1.5 py-0"
              >
                {n}
              </Badge>
            ))}
          </div>
        )}
      </DetailRow>

      <DetailRow label={`References (${node.outgoing.length})`}>
        {node.outgoing.length === 0 ? (
          <span className="text-muted-foreground italic text-[11px]">
            None — this is a leaf dependency.
          </span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {node.outgoing.map((n) => (
              <Badge
                key={n}
                variant="outline"
                className="font-mono text-[10px] px-1.5 py-0"
              >
                {n}
              </Badge>
            ))}
          </div>
        )}
      </DetailRow>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-foreground uppercase text-[10px] tracking-wider mb-0.5">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function FindingsPanel({ core }: { core: AnalysisCore }) {
  const hasCycles = core.cycles.length > 0;
  const hasUndefined = core.undefinedRefs.length > 0;
  const hasUnused = core.unusedVars.length > 0;
  const allClean = !hasCycles && !hasUndefined && !hasUnused;

  if (allClean && core.stats.defined > 0) {
    return (
      <div className="rounded-lg border border-l-4 border-emerald-500/40 border-border bg-card p-3">
        <div className="flex items-center gap-2 text-emerald-600 font-medium">
          <Check className="size-4" />
          All clear
        </div>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          No cycles, undefined references, or unused variables detected.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Cycles — critical */}
      {hasCycles && (
        <FindingSection
          icon={<AlertCircle className="size-3.5" />}
          title="Circular references"
          severity="critical"
          count={core.cycles.length}
        >
          {core.cycles.map((cycle, i) => (
            <div
              key={`cycle-${i}`}
              className="rounded-md bg-rose-500/5 border border-rose-500/20 p-2"
            >
              <div className="flex flex-wrap items-center gap-1 font-mono text-[11px] text-foreground">
                {cycle.path.map((name, j) => (
                  <span key={`${name}-${j}`} className="flex items-center gap-1">
                    {j > 0 && (
                      <ArrowRight className="size-3 text-rose-500" />
                    )}
                    <span className={j === 0 || j === cycle.path.length - 1
                      ? "text-rose-600 font-semibold"
                      : ""}>
                      {name}
                    </span>
                  </span>
                ))}
              </div>
              {i === 0 && (
                <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                  These variables reference each other, creating an infinite
                  loop. The browser will treat them as invalid at computed-value
                  time.
                </p>
              )}
            </div>
          ))}
        </FindingSection>
      )}

      {/* Undefined — warning */}
      {hasUndefined && (
        <FindingSection
          icon={<AlertTriangle className="size-3.5" />}
          title="Undefined references"
          severity="warning"
          count={core.undefinedRefs.length}
        >
          {core.undefinedRefs.map((u, i) => (
            <div
              key={`undef-${i}`}
              className="rounded-md bg-amber-500/5 border border-amber-500/20 p-2"
            >
              <div className="font-mono text-[11px] text-foreground">
                <span className="text-amber-600">{u.target}</span>
                <span className="text-muted-foreground">
                  {" "}
                  ← referenced by{" "}
                </span>
                <span className="text-foreground">
                  {u.source === "inline"
                    ? `inline (${u.sourceProperty})`
                    : u.source}
                </span>
              </div>
              {u.fallback && (
                <div className="mt-0.5 text-[10px] text-muted-foreground font-mono break-all">
                  fallback: {u.fallback}
                </div>
              )}
            </div>
          ))}
        </FindingSection>
      )}

      {/* Unused — info */}
      {hasUnused && (
        <FindingSection
          icon={<Info className="size-3.5" />}
          title="Unused variables"
          severity="info"
          count={core.unusedVars.length}
        >
          <div className="flex flex-wrap gap-1">
            {core.unusedVars.map((name) => (
              <Badge
                key={name}
                variant="outline"
                className="font-mono text-[10px] px-1.5 py-0 text-muted-foreground border-dashed"
              >
                {name}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
            Defined but never referenced — consider removing to shrink your
            token surface.
          </p>
        </FindingSection>
      )}
    </>
  );
}

function FindingSection({
  icon,
  title,
  severity,
  count,
  children,
}: {
  icon: ReactNode;
  title: string;
  severity: "critical" | "warning" | "info";
  count: number;
  children: ReactNode;
}) {
  const border = {
    critical: "border-l-rose-500/60",
    warning: "border-l-amber-500/60",
    info: "border-l-muted-foreground/40",
  }[severity];
  const accent = {
    critical: "text-rose-600",
    warning: "text-amber-600",
    info: "text-muted-foreground",
  }[severity];

  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 border-border bg-card p-3 space-y-2",
        border,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={accent}>{icon}</span>
        <span className={cn("text-xs font-semibold uppercase tracking-wider", accent)}>
          {title}
        </span>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground tabular-nums">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
