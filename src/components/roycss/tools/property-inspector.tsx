"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Search,
  Copy,
  Check,
  Sparkles,
  Trash2,
  Eye,
  Palette,
  RotateCcw,
  AlertCircle,
  Link2,
  Layers,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * CustomPropertyInspector — paste CSS, extract every `--custom-property`
 * declaration with resolved values, type detection, usage counts, and
 * inheritance chains.
 *
 * Scope distinction from `variable-graph.tsx`:
 *  - VariableGraph builds a directed dependency GRAPH of custom properties
 *    and computes SCCs (Tarjan) + layered layouts — it answers "what
 *    depends on what, where are the cycles".
 *  - CustomPropertyInspector is the FLAT CATALOGUE: every `--foo: bar;`
 *    declaration becomes a row with its raw value, RECURSIVELY-RESOLVED
 *    value (every `var()` substituted), detected type (color / length /
 *    number / percentage / url / time / string), usage count across the
 *    whole stylesheet, inheritance chain, scope (:root vs scoped), and an
 *    overridden flag when a name is redefined. Filter / search / copy as
 *    `:root` block.
 *
 * Features:
 *  - Debounced (~300ms) client-side parsing (no external deps).
 *  - Robust CSS tokenizer: honours quoted strings, nested parens, nested
 *    `var(--a, var(--b, fallback))`, and descends into `@media` /
 *    `@supports` to find scoped definitions.
 *  - Per-property metadata: type, scope, usage count, inheritance chain
 *    (list of transitively-referenced vars), cycle flag (when the
 *    resolver hits a var it's already visiting), overridden flag.
 *  - Three filters: type (all / color / length / …), scope (all / :root
 *    / scoped), usage (all / used / unused), plus a name search box.
 *  - Stats line: total properties + per-type breakdown.
 *  - "Copy as :root block" — generates a `:root { --a: …; --b: …; }`
 *    block from the canonical (non-overridden) definitions.
 *  - "Load example" button — fills the textarea with a multi-scope
 *    stylesheet that exercises every code path (var chains, calc(),
 *    scoped overrides, an unused token, etc.).
 *
 * All cleanup-safe: the debounce + copy timeouts are cleared on unmount.
 * No console.log. No `any`.
 */

// ============================================================
// Types
// ============================================================

type PropertyType =
  | "color"
  | "length"
  | "number"
  | "percentage"
  | "url"
  | "time"
  | "string";

type TypeFilter = "all" | PropertyType;
type ScopeFilter = "all" | "root" | "scoped";
type UsageFilter = "all" | "used" | "unused";

interface CustomProperty {
  id: string;
  name: string;
  rawValue: string;
  resolvedValue: string;
  scope: string;
  isRoot: boolean;
  type: PropertyType;
  usageCount: number;
  chain: string[];
  cycle: boolean;
  overridden: boolean;
  line: number;
}

interface ParsedBlock {
  selector: string;
  body: string;
  startLine: number;
}

interface Declaration {
  property: string;
  value: string;
}

interface VarCall {
  start: number;
  end: number;
  name: string;
  fallback: string | null;
}

// ============================================================
// Constants
// ============================================================

const EXAMPLE_CSS = `:root {
  --color-primary: #0d9488;
  --color-primary-rgb: 13 148 136;
  --color-accent: var(--color-primary);
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: calc(var(--space-1) + var(--space-2));
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --font-body: "Inter", system-ui, sans-serif;
  --shadow-color: 220 40% 5%;
  --transition-fast: 150ms ease-out;
  --header-height: 64px;
  --unused-token: #ff0000;
  --self-ref: var(--self-ref);
}

.button {
  --button-bg: var(--color-primary);
  --button-radius: var(--radius-md);
  --button-padding: var(--space-2) var(--space-3);
  --color-primary: #14b8a6;
}

.card {
  --card-bg: #ffffff;
  --card-shadow: 0 4px 12px hsl(var(--shadow-color) / 0.1);
  --card-radius: var(--radius-lg);
}`;

const NAMED_COLORS = new Set([
  "transparent", "currentcolor", "inherit", "initial", "revert", "unset",
  "red", "orange", "yellow", "green", "blue", "purple", "pink", "brown",
  "black", "white", "gray", "grey", "teal", "cyan", "magenta", "navy",
  "maroon", "olive", "lime", "aqua", "silver", "tan", "gold", "ivory",
  "violet", "salmon", "coral", "khaki", "plum", "orchid", "crimson",
  "azure", "beige", "lavender", "tomato", "wheat", "linen", "rose",
  "amber", "emerald", "fuchsia", "indigo", "snow", "mint", "sky",
  "aliceblue", "antiquewhite", "aquamarine", "bisque", "blanchedalmond",
  "blueviolet", "burlywood", "cadetblue", "chartreuse", "chocolate",
  "cornflowerblue", "cornsilk", "darkblue", "darkcyan", "darkgoldenrod",
  "darkgray", "darkgreen", "darkgrey", "darkkhaki", "darkmagenta",
  "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon",
  "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey",
  "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray",
  "dimgrey", "dodgerblue", "firebrick", "floralwhite", "forestgreen",
  "gainsboro", "ghostwhite", "goldenrod", "greenyellow", "grey",
  "honeydew", "hotpink", "indianred", "lavenderblush", "lawngreen",
  "lemonchiffon", "lightblue", "lightcoral", "lightcyan",
  "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey",
  "lightpink", "lightsalmon", "lightseagreen", "lightskyblue",
  "lightslategray", "lightslategrey", "lightsteelblue", "lightyellow",
  "limegreen", "mediumaquamarine", "mediumblue", "mediumorchid",
  "mediumpurple", "mediumseagreen", "mediumslateblue",
  "mediumspringgreen", "mediumturquoise", "mediumvioletred",
  "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite",
  "oldlace", "olivedrab", "orangered", "orchid", "palegoldenrod",
  "palegreen", "paleturquoise", "palevioletred", "papayawhip",
  "peachpuff", "peru", "pink", "powderblue", "purple", "rebeccapurple",
  "rosybrown", "royalblue", "saddlebrown", "sandybrown", "seagreen",
  "seashell", "sienna", "slateblue", "slategray", "slategrey",
  "springgreen", "steelblue", "thistle", "turquoise", "violet",
  "wheat", "whitesmoke", "yellowgreen",
]);

const TYPE_STYLES: Record<PropertyType, string> = {
  color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  length: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  number: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  percentage: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  url: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  time: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
  string: "bg-muted text-muted-foreground",
};

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "color", label: "Color" },
  { value: "length", label: "Length" },
  { value: "number", label: "Number" },
  { value: "percentage", label: "Percentage" },
  { value: "url", label: "URL" },
  { value: "time", label: "Time" },
  { value: "string", label: "String" },
];

const SCOPE_OPTIONS: { value: ScopeFilter; label: string }[] = [
  { value: "all", label: "All scopes" },
  { value: "root", label: ":root only" },
  { value: "scoped", label: "Scoped only" },
];

const USAGE_OPTIONS: { value: UsageFilter; label: string }[] = [
  { value: "all", label: "All usage" },
  { value: "used", label: "Used" },
  { value: "unused", label: "Unused" },
];

// ============================================================
// Parsing helpers
// ============================================================

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function countNewlines(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\n") count++;
  }
  return count;
}

/** Walk CSS and return top-level { ... } blocks, descending into
 *  condition at-rules (@media / @supports / @container) so scoped
 *  definitions inside them are still picked up. Honours quoted strings
 *  so braces in `content: "}"` don't confuse the scanner. */
function parseBlocks(css: string): ParsedBlock[] {
  const stripped = stripComments(css);
  const top = findTopLevelBlocks(stripped);
  const out: ParsedBlock[] = [];
  for (const block of top) {
    out.push(block);
    // Descend into condition at-rules to find scoped var defs inside.
    if (
      block.selector.startsWith("@") &&
      /^@(media|supports|container|layer)\b/i.test(block.selector)
    ) {
      const nested = parseBlocks(block.body);
      for (const n of nested) {
        out.push({
          // Prefix the parent at-rule onto the nested selector.
          selector: `${block.selector} ${n.selector}`.trim(),
          body: n.body,
          // Offset line numbers by the parent block's start.
          startLine: block.startLine + n.startLine,
        });
      }
    }
  }
  return out;
}

function findTopLevelBlocks(css: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
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
        const startLine = countNewlines(css.slice(0, selectorStart)) + 1;
        if (selector) {
          blocks.push({
            selector: normalizeScope(selector),
            body: "",
            startLine,
          });
        }
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

function normalizeScope(selector: string): string {
  const s = selector.trim().replace(/\s+/g, " ");
  if (!s) return ":root";
  return s;
}

function isRootScope(scope: string): boolean {
  // :root, html, or any combination containing :root
  return /(^|\s|,)(:root|html)\b/.test(scope);
}

/** Extract depth-0 declarations from a block body. Skips nested rule
 *  bodies (CSS Nesting) — they get walked as their own blocks. */
function extractDeclarations(body: string): Declaration[] {
  const decls: Declaration[] = [];
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

/** Find all `var(--name, fallback)` calls in a value. Handles nested
 *  parens and quoted strings. Does NOT recurse into the fallback — the
 *  caller decides whether to resolve recursively. */
function findVarCalls(value: string): VarCall[] {
  const calls: VarCall[] = [];
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
    const commaPos = findTopLevelComma(inner);
    const name = (commaPos === -1 ? inner : inner.slice(0, commaPos)).trim();
    const fallback =
      commaPos === -1 ? null : inner.slice(commaPos + 1).trim();
    if (name.startsWith("--")) {
      calls.push({
        start: m.index,
        end: i + 1,
        name,
        fallback: fallback === "" ? null : fallback,
      });
    }
    re.lastIndex = i + 1;
  }
  return calls;
}

function findTopLevelComma(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      while (i < s.length && s[i] !== q) {
        if (s[i] === "\\") i++;
        i++;
      }
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === "," && depth === 0) return i;
  }
  return -1;
}

// ============================================================
// Type detection
// ============================================================

function detectType(value: string): PropertyType {
  const v = value.trim().toLowerCase();
  if (!v) return "string";
  if (/^url\(/i.test(v)) return "url";
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return "color";
  if (/^(rgba?|hsla?|oklch|oklab|lab|lch|color)\s*\(/i.test(v)) return "color";
  if (NAMED_COLORS.has(v)) return "color";
  if (/^-?\d*\.?\d+(ms|s)\b/i.test(v)) return "time";
  if (/^-?\d*\.?\d+%$/.test(v)) return "percentage";
  if (
    /^-?\d*\.?\d+(px|em|rem|vh|vw|vmin|vmax|ex|ch|cm|mm|in|pt|pc|fr|q)\b/i.test(
      v,
    )
  ) {
    return "length";
  }
  if (/^-?\d*\.?\d+$/.test(v)) return "number";
  return "string";
}

// ============================================================
// Resolution
// ============================================================

interface ResolveResult {
  resolved: string;
  chain: string[];
  cycle: boolean;
}

/** Recursively substitute `var(--x)` references using `lookup`.
 *  Returns the resolved string, the ordered chain of referenced vars
 *  (deduplicated), and a `cycle` flag if a cycle was detected. */
function resolveValue(
  raw: string,
  lookup: Map<string, string>,
): ResolveResult {
  const chain: string[] = [];
  let cycle = false;

  const replaceAll = (input: string, visited: Set<string>): string => {
    const calls = findVarCalls(input);
    if (calls.length === 0) return input;

    let result = "";
    let lastEnd = 0;
    for (const call of calls) {
      result += input.slice(lastEnd, call.start);

      if (visited.has(call.name)) {
        // Cycle — leave the var() untouched.
        cycle = true;
        result += input.slice(call.start, call.end);
        lastEnd = call.end;
        continue;
      }

      const def = lookup.get(call.name);
      if (def === undefined) {
        // Unknown var — use the fallback if provided, else leave as-is.
        if (call.fallback !== null) {
          result += replaceAll(call.fallback, new Set(visited));
        } else {
          result += input.slice(call.start, call.end);
        }
        lastEnd = call.end;
        continue;
      }

      if (!chain.includes(call.name)) chain.push(call.name);
      const nextVisited = new Set(visited).add(call.name);
      result += replaceAll(def, nextVisited);
      lastEnd = call.end;
    }
    result += input.slice(lastEnd);
    return result;
  };

  const resolved = replaceAll(raw, new Set());
  return { resolved, chain, cycle };
}

// ============================================================
// Top-level analysis
// ============================================================

let propIdCounter = 1;
function makePropId(): string {
  return `cpi-prop-${propIdCounter++}`;
}

interface AnalysisResult {
  properties: CustomProperty[];
  error: string | null;
}

function analyzeCss(css: string): AnalysisResult {
  if (!css.trim()) {
    return { properties: [], error: null };
  }
  try {
    const blocks = parseBlocks(css);
    const declarations: { block: ParsedBlock; decl: Declaration }[] = [];
    for (const block of blocks) {
      const decls = extractDeclarations(block.body);
      for (const decl of decls) {
        declarations.push({ block, decl });
      }
    }

    // Collect all custom-property definitions (in source order).
    const definitions: {
      id: string;
      name: string;
      rawValue: string;
      scope: string;
      isRoot: boolean;
      line: number;
    }[] = [];
    for (const { block, decl } of declarations) {
      if (decl.property.startsWith("--")) {
        definitions.push({
          id: makePropId(),
          name: decl.property,
          rawValue: decl.value,
          scope: block.selector,
          isRoot: isRootScope(block.selector),
          line: block.startLine,
        });
      }
    }

    // Usage counts: scan ALL declarations (custom + regular) for var() calls.
    const usageCounts = new Map<string, number>();
    for (const { decl } of declarations) {
      const calls = findVarCalls(decl.value);
      for (const call of calls) {
        usageCounts.set(call.name, (usageCounts.get(call.name) ?? 0) + 1);
      }
    }

    // Canonical lookup: prefer :root defs, then first def in source order.
    const lookup = new Map<string, string>();
    for (const def of definitions) {
      if (def.isRoot && !lookup.has(def.name)) {
        lookup.set(def.name, def.rawValue);
      }
    }
    for (const def of definitions) {
      if (!lookup.has(def.name)) {
        lookup.set(def.name, def.rawValue);
      }
    }

    // Overridden set: every definition that is NOT the canonical one.
    const canonicalIds = new Set<string>();
    const seenNames = new Set<string>();
    for (const def of definitions) {
      if (def.isRoot && !seenNames.has(def.name)) {
        canonicalIds.add(def.id);
        seenNames.add(def.name);
      }
    }
    for (const def of definitions) {
      if (!seenNames.has(def.name)) {
        canonicalIds.add(def.id);
        seenNames.add(def.name);
      }
    }

    // Build the CustomProperty list.
    const properties: CustomProperty[] = definitions.map((def) => {
      const { resolved, chain, cycle } = resolveValue(def.rawValue, lookup);
      const type = detectType(resolved);
      return {
        id: def.id,
        name: def.name,
        rawValue: def.rawValue,
        resolvedValue: resolved,
        scope: def.scope,
        isRoot: def.isRoot,
        type,
        usageCount: usageCounts.get(def.name) ?? 0,
        chain,
        cycle,
        overridden: !canonicalIds.has(def.id),
        line: def.line,
      };
    });

    return { properties, error: null };
  } catch {
    return { properties: [], error: "Failed to parse CSS — check for unbalanced braces." };
  }
}

// ============================================================
// Sub-components
// ============================================================

interface PropertyRowProps {
  property: CustomProperty;
  onCopy: (text: string) => void;
}

function PropertyRow({ property, onCopy }: PropertyRowProps) {
  const [showResolved, setShowResolved] = useState(false);

  const isColor = property.type === "color";
  const swatch = isColor ? extractColor(property.resolvedValue) : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 transition-colors",
        property.overridden && "border-amber-500/30 bg-amber-500/5",
        property.cycle && "border-rose-500/40 bg-rose-500/5",
      )}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2">
        <code className="font-mono text-xs font-semibold text-foreground">
          {property.name}
        </code>
        <Badge
          variant="secondary"
          className={cn("font-mono text-[10px]", TYPE_STYLES[property.type])}
        >
          {property.type}
        </Badge>
        <Badge
          variant="secondary"
          className={cn(
            "font-mono text-[10px]",
            property.isRoot
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {property.scope}
        </Badge>
        <Badge variant="outline" className="gap-1 font-mono text-[10px]">
          <Search className="size-2.5" />
          {property.usageCount} use{property.usageCount === 1 ? "" : "s"}
        </Badge>
        {property.overridden && (
          <Badge
            variant="secondary"
            className="bg-amber-500/15 font-mono text-[10px] text-amber-600 dark:text-amber-400"
            title="This name is redefined by a later, more specific rule"
          >
            overridden
          </Badge>
        )}
        {property.cycle && (
          <Badge
            variant="secondary"
            className="bg-rose-500/15 font-mono text-[10px] text-rose-600 dark:text-rose-400"
            title="This variable's resolution hits a cycle"
          >
            <AlertCircle className="size-2.5" />
            cycle
          </Badge>
        )}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          line {property.line}
        </span>
      </div>

      {/* Raw value */}
      <div className="mt-2 flex items-center gap-2">
        <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
          raw
        </span>
        <code className="flex-1 overflow-x-auto rounded bg-muted/40 px-2 py-1 font-mono text-[11px] text-foreground/80">
          {property.rawValue}
        </code>
        {swatch && (
          <span
            className="size-5 shrink-0 rounded border border-border"
            style={{ backgroundColor: swatch }}
            aria-label={`Color preview: ${swatch}`}
          />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-primary"
          onClick={() => onCopy(property.rawValue)}
          aria-label="Copy raw value"
          title="Copy raw value"
        >
          <Copy className="size-3" />
        </Button>
      </div>

      {/* Resolved value (collapsible) */}
      {property.resolvedValue !== property.rawValue && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setShowResolved((s) => !s)}
            className="flex cursor-pointer items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={showResolved}
          >
            <Eye className="size-3" />
            resolved
            {showResolved ? " (hide)" : " (show)"}
          </button>
          {showResolved && (
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-primary/5 px-2 py-1 font-mono text-[11px] text-primary">
                {property.resolvedValue}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-primary"
                onClick={() => onCopy(property.resolvedValue)}
                aria-label="Copy resolved value"
                title="Copy resolved value"
              >
                <Copy className="size-3" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Inheritance chain */}
      {property.chain.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
          <Link2 className="size-3" />
          <span>inherits:</span>
          {property.chain.map((name, i) => (
            <span key={`${name}-${i}`} className="flex items-center gap-1">
              <code className="font-mono text-foreground/80">{name}</code>
              {i < property.chain.length - 1 && (
                <span className="text-muted-foreground/60">→</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Best-effort extraction of a CSS color string from a value, for the
 *  swatch preview. Returns null if the value isn't a usable color. */
function extractColor(value: string): string | null {
  const v = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
  if (/^(rgba?|hsla?|oklch|oklab|lab|lch|color)\s*\(/i.test(v)) return v;
  if (NAMED_COLORS.has(v.toLowerCase())) return v;
  return null;
}

// ============================================================
// Main component
// ============================================================

export function CustomPropertyInspector() {
  // ── State ────────────────────────────────────────────────────────
  const [css, setCss] = useState(EXAMPLE_CSS);
  const [debouncedCss, setDebouncedCss] = useState(EXAMPLE_CSS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");
  const [copied, setCopied] = useState(false);
  const [copiedBlock, setCopiedBlock] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyBlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounced CSS parsing ───────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedCss(css);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [css]);

  // ── Derived: parse + analyze (memoized) ─────────────────────────
  const analysis = useMemo(() => analyzeCss(debouncedCss), [debouncedCss]);

  // ── Derived: filtered properties ────────────────────────────────
  const filtered = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return analysis.properties.filter((p) => {
      if (searchLower && !p.name.toLowerCase().includes(searchLower)) {
        return false;
      }
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (scopeFilter === "root" && !p.isRoot) return false;
      if (scopeFilter === "scoped" && p.isRoot) return false;
      if (usageFilter === "used" && p.usageCount === 0) return false;
      if (usageFilter === "unused" && p.usageCount > 0) return false;
      return true;
    });
  }, [analysis.properties, search, typeFilter, scopeFilter, usageFilter]);

  // ── Derived: stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const byType = new Map<PropertyType, number>();
    let rootCount = 0;
    let usedCount = 0;
    let overriddenCount = 0;
    let cycleCount = 0;
    for (const p of analysis.properties) {
      byType.set(p.type, (byType.get(p.type) ?? 0) + 1);
      if (p.isRoot) rootCount++;
      if (p.usageCount > 0) usedCount++;
      if (p.overridden) overriddenCount++;
      if (p.cycle) cycleCount++;
    }
    return {
      total: analysis.properties.length,
      byType,
      rootCount,
      usedCount,
      overriddenCount,
      cycleCount,
    };
  }, [analysis.properties]);

  // ── Derived: :root block (canonical defs only) ──────────────────
  const rootBlock = useMemo(() => {
    const canonical = analysis.properties.filter((p) => !p.overridden);
    if (canonical.length === 0) return ":root {}";
    const lines = canonical.map(
      (p) => `  ${p.name}: ${p.resolvedValue};`,
    );
    return `:root {\n${lines.join("\n")}\n}`;
  }, [analysis.properties]);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (copyBlockTimeoutRef.current) clearTimeout(copyBlockTimeoutRef.current);
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────
  const handleLoadExample = useCallback(() => {
    setCss(EXAMPLE_CSS);
  }, []);

  const handleClear = useCallback(() => {
    setCss("");
  }, []);

  const handleCopyValue = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const handleCopyRootBlock = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rootBlock);
      setCopiedBlock(true);
      if (copyBlockTimeoutRef.current) clearTimeout(copyBlockTimeoutRef.current);
      copyBlockTimeoutRef.current = setTimeout(() => setCopiedBlock(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [rootBlock]);

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    [],
  );

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Palette className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">Custom Property Inspector</h3>
            <p className="text-xs text-muted-foreground">
              Extract <code className="font-mono">--custom-props</code> with resolved values, types, and usage
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          title="Clear input"
        >
          <Trash2 className="size-3.5" />
          Clear
        </button>
      </div>

      {/* ── CSS input ──────────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="cpi-css"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <Sparkles className="size-3.5" />
            CSS Input
          </Label>
          <button
            type="button"
            onClick={handleLoadExample}
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary/20"
          >
            <Sparkles className="size-3" />
            Load example
          </button>
        </div>
        <Textarea
          id="cpi-css"
          value={css}
          onChange={(e) => setCss(e.target.value)}
          placeholder="Paste CSS with --custom-properties here…"
          className="min-h-[160px] resize-y font-mono text-xs"
          spellCheck={false}
          aria-label="CSS input"
        />
        {analysis.error && (
          <p className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="size-3.5" />
            {analysis.error}
          </p>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary" className="gap-1 font-mono">
          <Layers className="size-3" />
          {stats.total} {stats.total === 1 ? "prop" : "props"}
        </Badge>
        {stats.total > 0 && (
          <>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {stats.rootCount} :root
            </Badge>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {stats.usedCount} used
            </Badge>
            {stats.overriddenCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-amber-500/15 font-mono text-[10px] text-amber-600 dark:text-amber-400"
              >
                {stats.overriddenCount} overridden
              </Badge>
            )}
            {stats.cycleCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-rose-500/15 font-mono text-[10px] text-rose-600 dark:text-rose-400"
              >
                {stats.cycleCount} cycle{stats.cycleCount === 1 ? "" : "s"}
              </Badge>
            )}
          </>
        )}
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
        {/* Search */}
        <div className="space-y-1 sm:col-span-2">
          <Label
            htmlFor="cpi-search"
            className="text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            Search by name
          </Label>
          <div className="flex items-center gap-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              id="cpi-search"
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="e.g. --color, --space"
              className="h-8 flex-1 font-mono text-xs"
              aria-label="Search custom property names"
            />
          </div>
        </div>
        {/* Type filter */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Type
          </Label>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as TypeFilter)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Scope filter */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Scope
          </Label>
          <Select
            value={scopeFilter}
            onValueChange={(v) => setScopeFilter(v as ScopeFilter)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Usage filter */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Usage
          </Label>
          <Select
            value={usageFilter}
            onValueChange={(v) => setUsageFilter(v as UsageFilter)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USAGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Result count */}
        <div className="flex items-end">
          <span className="text-[10px] text-muted-foreground">
            {filtered.length} of {analysis.properties.length} shown
          </span>
        </div>
      </div>

      {/* ── Property list ──────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
          {analysis.properties.length === 0
            ? "No custom properties found — paste some CSS above."
            : "No properties match the current filters."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <PropertyRow key={p.id} property={p} onCopy={handleCopyValue} />
          ))}
        </div>
      )}

      {/* ── Copy-as-:root block ────────────────────────────────── */}
      {analysis.properties.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Link2 className="size-3.5" />
              Copy as :root block
            </span>
            <button
              type="button"
              onClick={handleCopyRootBlock}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                copiedBlock
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
              )}
              aria-label={copiedBlock ? "Block copied to clipboard" : "Copy :root block"}
            >
              {copiedBlock ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copiedBlock ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground/80">
            <code>{rootBlock}</code>
          </pre>
          <p className="text-[10px] text-muted-foreground">
            Canonical definitions only — overridden scoped redefinitions are excluded. Resolved
            values (with all <code className="font-mono">var()</code> calls substituted) are used.
          </p>
        </div>
      )}

      {/* Floating "copied!" toast for individual value copies */}
      {copied && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg">
          Copied value
        </div>
      )}
    </div>
  );
}
