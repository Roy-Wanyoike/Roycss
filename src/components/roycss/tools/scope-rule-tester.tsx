"use client";

/**
 * ScopeRuleTester — a self-contained CSS `@scope` playground.
 *
 * The `@scope` at-rule (Baseline 2024) lets developers scope style rules to a
 * DOM subtree bounded by an upper "scope root" and an optional lower "scope
 * limit". Styles inside `@scope (.root) to (.limit) { ... }` apply only to
 * descendants of the root that are NOT descendants of the limit — creating
 * the famous "donut scope" effect where a hole is carved out of the scoped
 * subtree.
 *
 * This tool lets you:
 *   1. Build a nested DOM tree (div / section / article / p / span) with
 *      classes and text content. The root is fixed as a `div.scope-stage`.
 *   2. Pick a scope-root selector (e.g. `.card`) and an optional scope
 *      limit selector (e.g. `.content-area`).
 *   3. Type the inner CSS rule(s) that should apply inside the scope
 *      (e.g. `h2 { color: red; } p { color: blue; }`).
 *   4. Watch the live preview apply the `@scope` rule natively (on
 *      supporting browsers) and overlay outlines that highlight which
 *      elements are IN scope vs OUT of scope (below the limit).
 *   5. Read a generated explanation listing every element with its
 *      classification.
 *   6. Load one of four presets (card-scoped, donut-scope, nested-components,
 *      proximity-scoping).
 *   7. Copy the generated `@scope` CSS to the clipboard.
 *
 * Implementation notes:
 *   - The tree is a plain recursive data structure. The root `div.scope-stage`
 *     holds the children the user adds; it is never considered in-scope.
 *   - In-scope computation is done imperatively by walking the DOM: every
 *     element matching the scope-root selector establishes a scope; we walk
 *     descendants, marking each as IN scope, until we hit an element matching
 *     the scope-limit selector — that element AND its descendants are OUT of
 *     scope (the "donut hole").
 *   - The generated `<style>` tag injects the actual `@scope` rule natively,
 *     with the scope-root and scope-limit selectors prefixed by a unique
 *     stage class so the rule cannot leak onto the host page.
 *   - Outline overlays are applied imperatively via refs so they do not
 *     collide with the user's CSS.
 *   - TS strict, no `any`, no `console.log`. Self-contained (no props,
 *     no external state, no network). Responsive within `max-w-2xl`.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Boxes,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  CornerDownRight,
  Globe,
  ChevronRight,
  Target,
  CircleSlash,
} from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

/** Outline highlight applied imperatively to IN-scope elements. */
const IN_SCOPE_OUTLINE = "2px solid #10b981";
const IN_SCOPE_OUTLINE_OFFSET = "2px";
const IN_SCOPE_BG = "color-mix(in srgb, #10b981 14%, transparent)";

/** Outline highlight applied imperatively to OUT-of-scope elements. */
const OUT_OUTLINE = "2px dashed #f43f5e";
const OUT_OUTLINE_OFFSET = "2px";
const OUT_BG = "color-mix(in srgb, #f43f5e 8%, transparent)";

/** Attributes used to save/restore original inline styles on matches. */
const ORIG_OUTLINE = "data-roycss-scope-orig-outline";
const ORIG_OUTLINE_OFFSET = "data-roycss-scope-orig-outline-offset";
const ORIG_BG = "data-roycss-scope-orig-bg";

/** Tags the user can pick from in the editor. */
const TAG_OPTIONS = [
  "div",
  "section",
  "article",
  "p",
  "span",
  "h2",
  "h3",
  "header",
  "footer",
] as const;
type TagOption = (typeof TAG_OPTIONS)[number];

// ============================================================
// Types
// ============================================================

interface TreeNode {
  id: string;
  tag: TagOption;
  classes: string;
  text: string;
  children: TreeNode[];
}

interface Preset {
  id: string;
  label: string;
  description: string;
  scopeRoot: string;
  scopeLimit: string;
  innerCss: string;
  build: () => TreeNode;
}

interface BrowserSupport {
  label: string;
  tone: "widely" | "newly" | "limited";
  versions: { browser: string; version: string }[];
}

interface ElementClassification {
  id: string;
  tag: string;
  classes: string;
  text: string;
  inScope: boolean;
}

interface ScopeAnalysis {
  inScope: HTMLElement[];
  outOfScope: HTMLElement[];
  error: string | null;
}

// ============================================================
// ID generator (stable enough for client-only UI keys)
// ============================================================

let __roycssScopeIdCounter = 0;
function makeId(prefix: string): string {
  __roycssScopeIdCounter += 1;
  return `${prefix}-${__roycssScopeIdCounter.toString(36)}`;
}

// ============================================================
// Tree factory helpers
// ============================================================

function makeNode(
  tag: TagOption,
  classes = "",
  text = "",
  children: TreeNode[] = [],
): TreeNode {
  return {
    id: makeId("n"),
    tag,
    classes,
    text,
    children,
  };
}

// ============================================================
// Presets
// ============================================================

const PRESETS: Preset[] = [
  {
    id: "card-scoped",
    label: "Card scoped",
    description: "Scope h2 styles to .card without leaking to siblings.",
    scopeRoot: ".card",
    scopeLimit: "",
    innerCss: "h2 { color: #dc2626; font-weight: 700; }\np { color: #475569; }",
    build: () =>
      makeNode("div", "scope-stage", "", [
        makeNode("article", "card", "", [
          makeNode("h2", "", "Card title"),
          makeNode("p", "", "Card body copy."),
        ]),
        makeNode("article", "card", "", [
          makeNode("h2", "", "Second card title"),
          makeNode("p", "", "Another paragraph."),
        ]),
        makeNode("section", "sidebar", "", [
          makeNode("h2", "", "Sidebar title (should NOT be red)"),
        ]),
      ]),
  },
  {
    id: "donut-scope",
    label: "Donut scope",
    description: "Carve a hole: scope stops at .content-area.",
    scopeRoot: ".media",
    scopeLimit: ".content-area",
    innerCss: "h2 { color: #16a34a; font-weight: 700; }\np { color: #1e293b; }",
    build: () =>
      makeNode("div", "scope-stage", "", [
        makeNode("article", "media", "", [
          makeNode("h2", "", "Media headline"),
          makeNode("div", "content-area", "", [
            makeNode("h2", "", "Inside content-area (OUT of scope)"),
            makeNode("p", "", "Donut hole — not affected."),
          ]),
          makeNode("p", "", "After the hole — back in scope."),
        ]),
      ]),
  },
  {
    id: "nested-components",
    label: "Nested components",
    description: "Scope styles only to the outer component instance.",
    scopeRoot: ".panel",
    scopeLimit: ".panel",
    innerCss: "h3 { color: #7c3aed; text-transform: uppercase; }",
    build: () =>
      makeNode("div", "scope-stage", "", [
        makeNode("section", "panel", "", [
          makeNode("h3", "", "Outer panel heading"),
          makeNode("section", "panel", "", [
            makeNode("h3", "", "Nested panel heading (OUT of scope)"),
          ]),
        ]),
      ]),
  },
  {
    id: "proximity-scoping",
    label: "Proximity scoping",
    description: "Style .title only when it is near a .badge inside .item.",
    scopeRoot: ".item",
    scopeLimit: "",
    innerCss: ".title { color: #ea580c; font-weight: 600; }",
    build: () =>
      makeNode("div", "scope-stage", "", [
        makeNode("div", "item", "", [
          makeNode("p", "title", "Item with badge — styled"),
          makeNode("span", "badge", "NEW"),
        ]),
        makeNode("div", "item", "", [
          makeNode("p", "title", "Item without badge — also styled"),
        ]),
        makeNode("div", "footer", "", [
          makeNode("p", "title", "Footer title — NOT in scope"),
        ]),
      ]),
  },
];

const BROWSER_SUPPORT: BrowserSupport = {
  label: "Baseline 2024",
  tone: "newly",
  versions: [
    { browser: "Chrome", version: "118+" },
    { browser: "Edge", version: "118+" },
    { browser: "Safari", version: "17.4+" },
    { browser: "Firefox", version: "110+ (partial)" },
    { browser: "Samsung", version: "25+" },
  ],
};

// ============================================================
// Tree mutation helpers (immutable)
// ============================================================

/** Recursively map over a tree, returning a new tree (or null to delete). */
function mapTree(
  node: TreeNode,
  fn: (n: TreeNode) => TreeNode | null,
): TreeNode | null {
  const next = fn(node);
  if (!next) return null;
  return {
    ...next,
    children: next.children
      .map((c) => mapTree(c, fn))
      .filter((c): c is TreeNode => c !== null),
  };
}

/** Update a node by id (immutable). The stage root is never removed. */
function updateNode(
  root: TreeNode,
  id: string,
  fn: (n: TreeNode) => TreeNode | null,
): TreeNode {
  const result = mapTree(root, (n) => (n.id === id ? fn(n) : n));
  return result ?? root;
}

// ============================================================
// Live preview renderer (renders REAL DOM nodes for @scope matching)
// ============================================================

function renderDomNode(node: TreeNode): ReactNode {
  const Tag = node.tag;
  const className = node.classes.trim();
  return (
    <Tag
      key={node.id}
      className={className || undefined}
      data-roycss-node={node.id}
    >
      {node.text || null}
      {node.children.map((c) => renderDomNode(c))}
    </Tag>
  );
}

// ============================================================
// Scope analysis — walk the DOM and classify each element
// ============================================================

function analyzeScope(
  stage: HTMLElement | null,
  scopeRoot: string,
  scopeLimit: string,
): ScopeAnalysis {
  if (!stage) {
    return { inScope: [], outOfScope: [], error: null };
  }

  const trimmedRoot = scopeRoot.trim();
  if (!trimmedRoot) {
    return { inScope: [], outOfScope: [], error: null };
  }

  const inScope: HTMLElement[] = [];
  const outOfScope: HTMLElement[] = [];

  // Resolve all scope roots.
  let roots: HTMLElement[] = [];
  try {
    roots = Array.from(stage.querySelectorAll(trimmedRoot)) as HTMLElement[];
  } catch (err) {
    return {
      inScope: [],
      outOfScope: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Validate the limit selector once.
  let limitSelector = scopeLimit.trim();
  if (limitSelector) {
    try {
      // Probe — throws on invalid selector.
      stage.querySelector(limitSelector);
    } catch (err) {
      return {
        inScope: [],
        outOfScope: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    limitSelector = "";
  }

  // Mark every descendant of an out-of-scope element as out-of-scope.
  const markDescendantsOut = (el: HTMLElement) => {
    for (const child of Array.from(el.children) as HTMLElement[]) {
      outOfScope.push(child);
      markDescendantsOut(child);
    }
  };

  // Walk descendants of a scope root. When we hit an element matching the
  // limit selector, that element AND its descendants are out of scope.
  const walk = (el: HTMLElement) => {
    for (const child of Array.from(el.children) as HTMLElement[]) {
      let isLimit = false;
      if (limitSelector) {
        try {
          isLimit = child.matches(limitSelector);
        } catch {
          isLimit = false;
        }
      }
      if (isLimit) {
        outOfScope.push(child);
        markDescendantsOut(child);
      } else {
        inScope.push(child);
        walk(child);
      }
    }
  };

  for (const root of roots) walk(root);

  return { inScope, outOfScope, error: null };
}

// ============================================================
// Outline overlay (imperative) — highlights IN/OUT elements
// ============================================================

function revertOutlines(elements: HTMLElement[]) {
  for (const el of elements) {
    el.style.outline = el.getAttribute(ORIG_OUTLINE) ?? "";
    el.style.outlineOffset = el.getAttribute(ORIG_OUTLINE_OFFSET) ?? "";
    el.style.backgroundColor = el.getAttribute(ORIG_BG) ?? "";
    el.removeAttribute(ORIG_OUTLINE);
    el.removeAttribute(ORIG_OUTLINE_OFFSET);
    el.removeAttribute(ORIG_BG);
  }
}

function applyOutline(el: HTMLElement, outline: string, offset: string, bg: string) {
  el.setAttribute(ORIG_OUTLINE, el.style.outline);
  el.setAttribute(ORIG_OUTLINE_OFFSET, el.style.outlineOffset);
  el.setAttribute(ORIG_BG, el.style.backgroundColor);
  el.style.outline = outline;
  el.style.outlineOffset = offset;
  el.style.backgroundColor = bg;
}

// ============================================================
// Recursive tree editor
// ============================================================

interface NodeEditorProps {
  node: TreeNode;
  depth: number;
  onChange: (id: string, fn: (n: TreeNode) => TreeNode) => void;
  onRemove: (id: string) => void;
}

function NodeEditor({ node, depth, onChange, onRemove }: NodeEditorProps) {
  const patch = useCallback(
    (partial: Partial<TreeNode>) => {
      onChange(node.id, (n) => ({ ...n, ...partial }));
    },
    [node.id, onChange],
  );

  const addChild = useCallback(
    (tag: TagOption) => {
      onChange(node.id, (n) => ({
        ...n,
        children: [...n.children, makeNode(tag)],
      }));
    },
    [node.id, onChange],
  );

  return (
    <div
      className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-2.5"
      style={{ marginLeft: depth * 12 }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {depth > 0 && (
          <span
            className="hidden sm:inline-flex text-muted-foreground/60"
            aria-hidden
          >
            <CornerDownRight className="size-3.5" />
          </span>
        )}
        <Select
          value={node.tag}
          onValueChange={(v) => patch({ tag: v as TagOption })}
        >
          <SelectTrigger size="sm" className="h-7 w-28 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAG_OPTIONS.map((t) => (
              <SelectItem key={t} value={t} className="font-mono text-xs">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={node.classes}
          onChange={(e) => patch({ classes: e.target.value })}
          placeholder="classes (e.g. card active)"
          className="h-7 flex-1 min-w-[140px] font-mono text-xs"
          aria-label="Element classes"
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(node.id)}
          aria-label="Remove element"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <Input
        value={node.text}
        onChange={(e) => patch({ text: e.target.value })}
        placeholder="text content"
        className="h-7 w-full font-mono text-xs"
        aria-label="Element text content"
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-6 gap-1 px-2 text-[11px]"
            >
              <Plus className="size-3" />
              Add child
              <ChevronRight className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {TAG_OPTIONS.map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => addChild(t)}
                className="font-mono text-xs"
              >
                {t}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {node.children.length > 0 && (
        <div className="space-y-2 border-l border-border/40 pl-2">
          {node.children.map((c) => (
            <NodeEditor
              key={c.id}
              node={c}
              depth={depth + 1}
              onChange={onChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function ScopeRuleTester() {
  const initialPreset = PRESETS[1]!;
  const [tree, setTree] = useState<TreeNode>(() => initialPreset.build());
  const [scopeRoot, setScopeRoot] = useState<string>(initialPreset.scopeRoot);
  const [scopeLimit, setScopeLimit] = useState<string>(initialPreset.scopeLimit);
  const [innerCss, setInnerCss] = useState<string>(initialPreset.innerCss);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ScopeAnalysis>({
    inScope: [],
    outOfScope: [],
    error: null,
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [editorOpen, setEditorOpen] = useState<boolean>(true);

  const stageId = useId().replace(/[:]/g, "");
  const stageClass = `rscope-stage-${stageId}`;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const prevInScopeRef = useRef<HTMLElement[]>([]);
  const prevOutRef = useRef<HTMLElement[]>([]);
  const styleTagRef = useRef<HTMLStyleElement | null>(null);

  // ── Inject the @scope rule into the preview pane ────────────────────
  // The scope-root and scope-limit selectors are prefixed with the unique
  // stage class so the rule cannot leak onto the host page. Inner rules
  // stay verbatim because @scope already constrains them to descendants
  // of the matched roots (which are all inside the stage).

  const injectedCss = useMemo(() => {
    const trimmedRoot = scopeRoot.trim();
    if (!trimmedRoot) return "";
    const prefixedRoot = `.${stageClass} ${trimmedRoot}`;
    const trimmedLimit = scopeLimit.trim();
    const header = trimmedLimit
      ? `@scope (${prefixedRoot}) to (.${stageClass} ${trimmedLimit})`
      : `@scope (${prefixedRoot})`;
    return `${header} {\n${innerCss}\n}`;
  }, [scopeRoot, scopeLimit, innerCss, stageClass]);

  useEffect(() => {
    if (!stageRef.current) return;
    // Create or update a <style> tag scoped to this component instance.
    if (!styleTagRef.current) {
      const tag = document.createElement("style");
      tag.setAttribute("data-roycss-scope-style", stageClass);
      stageRef.current.prepend(tag);
      styleTagRef.current = tag;
    }
    styleTagRef.current.textContent = injectedCss;
    return () => {
      // Tag is cleaned up on unmount via the separate effect below.
    };
  }, [injectedCss, stageClass]);

  // ── Run scope analysis whenever inputs change ───────────────────────

  useEffect(() => {
    const result = analyzeScope(stageRef.current, scopeRoot, scopeLimit);
    setError(result.error);
    setAnalysis(result);
  }, [scopeRoot, scopeLimit, tree, innerCss]);

  // ── Apply outline overlays (imperative) ─────────────────────────────

  useEffect(() => {
    revertOutlines(prevInScopeRef.current);
    revertOutlines(prevOutRef.current);
    prevInScopeRef.current = [];
    prevOutRef.current = [];

    for (const el of analysis.inScope) {
      applyOutline(el, IN_SCOPE_OUTLINE, IN_SCOPE_OUTLINE_OFFSET, IN_SCOPE_BG);
    }
    for (const el of analysis.outOfScope) {
      applyOutline(el, OUT_OUTLINE, OUT_OUTLINE_OFFSET, OUT_BG);
    }
    prevInScopeRef.current = analysis.inScope;
    prevOutRef.current = analysis.outOfScope;
  }, [analysis]);

  // ── Cleanup on unmount ──────────────────────────────────────────────

  useEffect(() => {
    return () => {
      revertOutlines(prevInScopeRef.current);
      revertOutlines(prevOutRef.current);
      prevInScopeRef.current = [];
      prevOutRef.current = [];
      if (styleTagRef.current && styleTagRef.current.parentNode) {
        styleTagRef.current.parentNode.removeChild(styleTagRef.current);
      }
      styleTagRef.current = null;
    };
  }, []);

  // ── Tree mutation handlers ──────────────────────────────────────────

  const handleNodeChange = useCallback(
    (id: string, fn: (n: TreeNode) => TreeNode) => {
      setTree((prev) => updateNode(prev, id, fn));
    },
    [],
  );

  const handleNodeRemove = useCallback((id: string) => {
    setTree((prev) => updateNode(prev, id, () => null));
  }, []);

  // ── Preset loader ───────────────────────────────────────────────────

  const loadPreset = useCallback((preset: Preset) => {
    setTree(preset.build());
    setScopeRoot(preset.scopeRoot);
    setScopeLimit(preset.scopeLimit);
    setInnerCss(preset.innerCss);
  }, []);

  // ── Generated CSS (clean version for display / clipboard) ───────────

  const generatedCss = useMemo(() => {
    const trimmedRoot = scopeRoot.trim();
    if (!trimmedRoot) return "/* set a scope root selector first */";
    const header = scopeLimit.trim()
      ? `@scope (${trimmedRoot}) to (${scopeLimit.trim()})`
      : `@scope (${trimmedRoot})`;
    return `${header} {\n${innerCss}\n}`;
  }, [scopeRoot, scopeLimit, innerCss]);

  // ── Copy ────────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [generatedCss]);

  // ── Element classification list for the explanation panel ───────────

  const classification = useMemo<ElementClassification[]>(() => {
    const out: ElementClassification[] = [];
    const walk = (node: TreeNode) => {
      const inSet = analysis.inScope.some((el) => el.dataset.roycssNode === node.id);
      const outSet = analysis.outOfScope.some(
        (el) => el.dataset.roycssNode === node.id,
      );
      if (inSet || outSet) {
        out.push({
          id: node.id,
          tag: node.tag,
          classes: node.classes.trim(),
          text: node.text.trim(),
          inScope: inSet,
        });
      }
      for (const c of node.children) walk(c);
    };
    walk(tree);
    return out;
  }, [tree, analysis]);

  const inCount = analysis.inScope.length;
  const outCount = analysis.outOfScope.length;

  const previewStyle = useMemo<CSSProperties>(
    () => ({
      minHeight: "140px",
    }),
    [],
  );

  const badgeTone =
    BROWSER_SUPPORT.tone === "widely"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : BROWSER_SUPPORT.tone === "newly"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Boxes className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold leading-tight text-foreground">
              @scope Rule Tester
            </h2>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                badgeTone,
              )}
            >
              <Globe className="size-3" />
              {BROWSER_SUPPORT.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Build a DOM tree, define a scope root and optional limit, and
            watch which elements fall inside the donut.
          </p>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2.5 text-xs"
              onClick={() => loadPreset(p)}
              title={p.description}
            >
              <Sparkles className="size-3" />
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Scope definition */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Scope definition
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="scope-root"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Scope root
            </Label>
            <Input
              id="scope-root"
              value={scopeRoot}
              onChange={(e) => setScopeRoot(e.target.value)}
              placeholder=".card"
              spellCheck={false}
              className="font-mono text-sm"
              aria-invalid={!!error}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="scope-limit"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Scope limit (optional)
            </Label>
            <Input
              id="scope-limit"
              value={scopeLimit}
              onChange={(e) => setScopeLimit(e.target.value)}
              placeholder=".content-area"
              spellCheck={false}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="scope-inner"
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Inner CSS rules
          </Label>
          <textarea
            id="scope-inner"
            value={innerCss}
            onChange={(e) => setInnerCss(e.target.value)}
            placeholder={"h2 { color: red; }\np { color: blue; }"}
            spellCheck={false}
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 scrollbar-thin"
          />
        </div>
        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {error ? (
            <Badge
              variant="outline"
              className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1"
            >
              <AlertCircle className="size-3" />
              Invalid selector
            </Badge>
          ) : (
            <>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
              >
                <Target className="size-3" />
                {inCount} in scope
              </Badge>
              <Badge
                variant="outline"
                className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1"
              >
                <CircleSlash className="size-3" />
                {outCount} out of scope
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Two-pane: live preview + tree editor */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Live preview */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live preview
          </div>
          <div
            ref={stageRef}
            style={previewStyle}
            className={cn(
              "space-y-1.5 rounded-lg border border-border bg-background p-3 text-sm text-foreground",
              stageClass,
            )}
          >
            {tree.children.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Empty stage — add elements to scope.
              </p>
            ) : (
              tree.children.map((c) => renderDomNode(c))
            )}
            <p className="pt-1 text-[10px] text-muted-foreground/70">
              <span className="inline-block size-2 rounded-full bg-emerald-500 align-middle mr-1" />
              in scope &nbsp;·&nbsp;
              <span className="inline-block size-2 rounded-full bg-rose-500 align-middle mr-1" />
              out of scope (donut hole)
            </p>
          </div>
        </div>

        {/* Tree editor */}
        <div className="space-y-2">
          <Collapsible
            open={editorOpen}
            onOpenChange={setEditorOpen}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                DOM tree editor
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px]"
                >
                  {editorOpen ? "Hide" : "Show"}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto rounded-lg border border-border/60 bg-card/40 p-2 scrollbar-thin">
                <div className="rounded-md bg-primary/5 border border-primary/20 px-2 py-1 font-mono text-xs text-primary">
                  &lt;div class="scope-stage"&gt;
                </div>
                {tree.children.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-muted-foreground">
                    No children yet. Add one below.
                  </p>
                ) : (
                  tree.children.map((c) => (
                    <NodeEditor
                      key={c.id}
                      node={c}
                      depth={0}
                      onChange={handleNodeChange}
                      onRemove={handleNodeRemove}
                    />
                  ))
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-full gap-1 text-xs"
                    >
                      <Plus className="size-3" />
                      Add element to stage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {TAG_OPTIONS.map((t) => (
                      <DropdownMenuItem
                        key={t}
                        onClick={() =>
                          handleNodeChange(tree.id, (n) => ({
                            ...n,
                            children: [...n.children, makeNode(t)],
                          }))
                        }
                        className="font-mono text-xs"
                      >
                        {t}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="rounded-md bg-primary/5 border border-primary/20 px-2 py-1 font-mono text-xs text-primary">
                  &lt;/div&gt;
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Explanation panel */}
      <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Element classification
        </div>
        {classification.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No elements matched. Set a scope root that exists in the tree.
          </p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
            {classification.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-md border border-border/50 bg-background/60 px-2 py-1.5 text-xs"
              >
                <span
                  className={cn(
                    "inline-block size-2 shrink-0 rounded-full",
                    c.inScope ? "bg-emerald-500" : "bg-rose-500",
                  )}
                  aria-hidden
                />
                <code className="font-mono text-foreground/80">
                  &lt;{c.tag}
                  {c.classes ? ` class="${c.classes}"` : ""}&gt;
                </code>
                {c.text && (
                  <span className="truncate text-muted-foreground">
                    {c.text}
                  </span>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-auto gap-1 text-[10px]",
                    c.inScope
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  )}
                >
                  {c.inScope ? "IN" : "OUT"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Generated CSS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated CSS
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 gap-1 px-2 text-[11px]"
            aria-label="Copy generated CSS"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground scrollbar-thin">
          <code>{generatedCss}</code>
        </pre>
      </div>

      {/* Browser support details */}
      <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Globe className="size-3.5" />
          Browser support
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BROWSER_SUPPORT.versions.map((v) => (
            <Badge key={v.browser} variant="secondary" className="gap-1">
              <span className="text-foreground">{v.browser}</span>
              <span className="font-mono text-muted-foreground">{v.version}</span>
            </Badge>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          The <code className="font-mono">@scope</code> at-rule carves a
          subtree out of the DOM and confines style rules to it. With a
          lower-boundary <code className="font-mono">to (.limit)</code>{" "}
          selector, you get &ldquo;donut scope&rdquo; — a hole inside the
          scoped region. The injected style here is prefixed with a unique
          stage class so it never leaks onto the host page.
        </p>
      </div>
    </div>
  );
}
