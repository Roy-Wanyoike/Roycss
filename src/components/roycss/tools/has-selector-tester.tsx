"use client";

/**
 * HasSelectorTester — a self-contained CSS `:has()` selector playground.
 *
 * The `:has()` functional pseudo-class (Baseline 2023) lets a selector match
 * an element based on its *descendants*. This tool gives developers a live
 * DOM-tree builder where they can:
 *   1. Compose a tree of arbitrary elements (div / p / button / input / img /
 *      ul / li / a / span) with classes and attributes.
 *   2. Type any selector containing `:has()` (or any selector at all — the
 *      browser does the matching).
 *   3. Watch matching elements get a primary-coloured outline in the live
 *      preview pane.
 *   4. Read the generated CSS rule.
 *   5. Load one of six preset scenarios (card with image, list with active
 *      item, form with invalid input, nav with current page, empty container,
 *      nested `:has()`).
 *   6. See a Baseline 2023 browser-support badge with version numbers.
 *
 * Matching uses the browser's own `Element.querySelectorAll` — every selector
 * the user's browser supports works for free (`:has()`, `:is()`, `:where()`,
 * `:not()`, attribute operators, combinators, comma lists, etc.).
 *
 * Implementation notes:
 *   - The tree is a plain recursive data structure (root is fixed as
 *     `div.container`).
 *   - Live preview renders *real* DOM nodes so `querySelectorAll` works.
 *   - Highlight is applied via inline `outline` + `outline-offset`, with the
 *     original styles cached in `data-*` attributes and restored on re-run.
 *   - All parsing / matching is client-side. Invalid selectors throw a
 *     `SyntaxError` / `DOMException` which is caught and surfaced as a badge.
 *   - TS strict, no `any`, no `console.log`. Self-contained (no props,
 *     no external state, no network). Responsive within `max-w-2xl`.
 */

import {
  useCallback,
  useEffect,
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
  Target,
  ChevronRight,
  CornerDownRight,
  Globe,
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

const HIGHLIGHT_OUTLINE = "2px solid var(--primary, currentColor)";
const HIGHLIGHT_OUTLINE_OFFSET = "2px";
const HIGHLIGHT_BG =
  "color-mix(in srgb, var(--primary) 12%, transparent)";

/** Attributes used to save/restore original inline styles on matches. */
const ORIG_OUTLINE = "data-roycss-orig-outline";
const ORIG_OUTLINE_OFFSET = "data-roycss-orig-outline-offset";
const ORIG_BG = "data-roycss-orig-bg";

const COPY_CONFIRM_MS = 2000;

const DEFAULT_SELECTOR = ".container:has(.active)";

/** Tags the user can pick from in the editor. */
const TAG_OPTIONS = [
  "div",
  "p",
  "button",
  "input",
  "img",
  "ul",
  "li",
  "a",
  "span",
  "form",
  "nav",
] as const;
type TagOption = (typeof TAG_OPTIONS)[number];

/** Tags that are void (no children / no closing tag). */
const VOID_TAGS = new Set<TagOption>(["input", "img"]);

// ============================================================
// Types
// ============================================================

interface NodeAttribute {
  id: string;
  name: string;
  value: string;
}

interface TreeNode {
  id: string;
  tag: TagOption;
  classes: string;
  attrs: NodeAttribute[];
  text: string;
  children: TreeNode[];
}

interface Preset {
  id: string;
  label: string;
  description: string;
  selector: string;
  build: () => TreeNode;
}

interface BrowserSupport {
  label: string;
  tone: "widely" | "newly" | "limited";
  versions: { browser: string; version: string }[];
}

// ============================================================
// ID generator (stable enough for client-only UI keys)
// ============================================================

let __roycssHasIdCounter = 0;
function makeId(prefix: string): string {
  __roycssHasIdCounter += 1;
  return `${prefix}-${__roycssHasIdCounter.toString(36)}`;
}

// ============================================================
// Tree factory helpers
// ============================================================

function makeNode(
  tag: TagOption,
  classes = "",
  text = "",
  children: TreeNode[] = [],
  attrs: NodeAttribute[] = [],
): TreeNode {
  return {
    id: makeId("n"),
    tag,
    classes,
    attrs,
    text,
    children,
  };
}

function attr(name: string, value = ""): NodeAttribute {
  return { id: makeId("a"), name, value };
}

// ============================================================
// Presets
// ============================================================

const PRESETS: Preset[] = [
  {
    id: "card-image",
    label: "Card with image",
    description: "Highlight cards that contain an <img>.",
    selector: ".container:has(img)",
    build: () =>
      makeNode("div", "container", "", [
        makeNode("div", "card", "", [
          makeNode("img", "", "", [], [attr("alt", "preview"), attr("src", "")]),
          makeNode("p", "title", "Featured product"),
          makeNode("p", "price", "$29.00"),
        ]),
        makeNode("div", "card", "", [
          makeNode("p", "title", "Text-only card"),
          makeNode("p", "price", "$9.00"),
        ]),
      ]),
  },
  {
    id: "list-active",
    label: "List with active item",
    description: "Style lists that have an active child.",
    selector: ".container:has(li.active)",
    build: () =>
      makeNode("div", "container", "", [
        makeNode("ul", "nav-list", "", [
          makeNode("li", "", "Home"),
          makeNode("li", "active", "Dashboard"),
          makeNode("li", "", "Settings"),
        ]),
        makeNode("ul", "nav-list", "", [
          makeNode("li", "", "Apple"),
          makeNode("li", "", "Banana"),
        ]),
      ]),
  },
  {
    id: "form-invalid",
    label: "Form with invalid input",
    description: "Find forms containing an invalid field.",
    selector: ".container:has(.invalid)",
    build: () =>
      makeNode("div", "container", "", [
        makeNode("form", "signup", "", [
          makeNode("input", "invalid", "", [], [
            attr("type", "email"),
            attr("placeholder", "Email"),
          ]),
          makeNode("button", "", "Sign up"),
        ]),
        makeNode("form", "login", "", [
          makeNode("input", "", "", [], [
            attr("type", "email"),
            attr("placeholder", "Email"),
          ]),
          makeNode("button", "", "Log in"),
        ]),
      ]),
  },
  {
    id: "nav-current",
    label: "Nav with current page",
    description: "Highlight nav bars marking the current page.",
    selector: ".container:has(a.current)",
    build: () =>
      makeNode("div", "container", "", [
        makeNode("nav", "primary", "", [
          makeNode("a", "", "Home", [], [attr("href", "/")]),
          makeNode("a", "current", "Blog", [], [attr("href", "/blog")]),
          makeNode("a", "", "About", [], [attr("href", "/about")]),
        ]),
        makeNode("nav", "footer", "", [
          makeNode("a", "", "Terms", [], [attr("href", "/terms")]),
          makeNode("a", "", "Privacy", [], [attr("href", "/privacy")]),
        ]),
      ]),
  },
  {
    id: "empty-container",
    label: "Empty container",
    description: "Match a container that has no children at all.",
    selector: ".container:not(:has(*))",
    build: () =>
      makeNode("div", "container", "", [
        makeNode("div", "box", "I have no kids"),
        makeNode("div", "box", "", [makeNode("span", "", "kid")]),
      ]),
  },
  {
    id: "nested-has",
    label: "Nested :has()",
    description: "Chain :has() to match by deeply nested descendants.",
    selector: ".container:has(.item:has(.badge))",
    build: () =>
      makeNode("div", "container", "", [
        makeNode("ul", "list", "", [
          makeNode("li", "item", "", [
            makeNode("span", "label", "Inbox"),
            makeNode("span", "badge", "12"),
          ]),
          makeNode("li", "item", "", [makeNode("span", "label", "Drafts")]),
        ]),
      ]),
  },
];

const BROWSER_SUPPORT: BrowserSupport = {
  label: "Baseline 2023",
  tone: "widely",
  versions: [
    { browser: "Chrome", version: "105+" },
    { browser: "Edge", version: "105+" },
    { browser: "Safari", version: "15.4+" },
    { browser: "Firefox", version: "121+" },
    { browser: "Samsung", version: "20+" },
  ],
};

// ============================================================
// Tree mutation helpers (immutable)
// ============================================================

/** Recursively map over a tree, returning a new tree. */
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

/** Update a node by id (immutable). Returns null if removing the root. */
function updateNode(
  root: TreeNode,
  id: string,
  fn: (n: TreeNode) => TreeNode | null,
): TreeNode {
  const result = mapTree(root, (n) => (n.id === id ? fn(n) : n));
  // The root is never removed; fallback to root if map returned null.
  return result ?? root;
}

// ============================================================
// Live preview renderer
// ============================================================

/**
 * Render a TreeNode as a *real* DOM node so the browser's selector engine
 * can match it. Data attributes carry the node id so we can reflect DOM
 * matches back into React state if needed (currently unused — we apply
 * highlights imperatively).
 */
function renderDomNode(node: TreeNode): ReactNode {
  const Tag = node.tag;
  const attrProps: Record<string, string> = {};
  for (const a of node.attrs) {
    if (!a.name.trim()) continue;
    attrProps[a.name] = a.value;
  }
  const className = node.classes.trim();
  const isVoid = VOID_TAGS.has(node.tag);

  if (isVoid) {
    return (
      <Tag
        key={node.id}
        className={className || undefined}
        data-roycss-node={node.id}
        {...attrProps}
      />
    );
  }

  return (
    <Tag
      key={node.id}
      className={className || undefined}
      data-roycss-node={node.id}
      {...attrProps}
    >
      {node.text || null}
      {node.children.map((c) => renderDomNode(c))}
    </Tag>
  );
}

/**
 * Apply highlight outline to every element matching `selector` inside `root`.
 * Returns the matched elements + count, or an error string.
 *
 * Side effects: writes inline styles on matched elements, restoring prior
 * values via data attributes so they can be reverted on the next call.
 */
interface MatchOutcome {
  matches: HTMLElement[];
  error: string | null;
}

function applyHighlights(
  root: HTMLElement | null,
  selector: string,
  previouslyHighlighted: { current: HTMLElement[] },
): MatchOutcome {
  // Revert previous highlights.
  for (const el of previouslyHighlighted.current) {
    el.style.outline = el.getAttribute(ORIG_OUTLINE) ?? "";
    el.style.outlineOffset = el.getAttribute(ORIG_OUTLINE_OFFSET) ?? "";
    el.style.backgroundColor = el.getAttribute(ORIG_BG) ?? "";
    el.removeAttribute(ORIG_OUTLINE);
    el.removeAttribute(ORIG_OUTLINE_OFFSET);
    el.removeAttribute(ORIG_BG);
  }
  previouslyHighlighted.current = [];

  if (!root) return { matches: [], error: null };
  const trimmed = selector.trim();
  if (!trimmed) return { matches: [], error: null };

  try {
    const matched = Array.from(root.querySelectorAll(trimmed)) as HTMLElement[];
    for (const el of matched) {
      el.setAttribute(ORIG_OUTLINE, el.style.outline);
      el.setAttribute(ORIG_OUTLINE_OFFSET, el.style.outlineOffset);
      el.setAttribute(ORIG_BG, el.style.backgroundColor);
      el.style.outline = HIGHLIGHT_OUTLINE;
      el.style.outlineOffset = HIGHLIGHT_OUTLINE_OFFSET;
      el.style.backgroundColor = HIGHLIGHT_BG;
    }
    previouslyHighlighted.current = matched;
    return { matches: matched, error: null };
  } catch (err) {
    return {
      matches: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================
// Node editor (recursive)
// ============================================================

interface NodeEditorProps {
  node: TreeNode;
  depth: number;
  isRoot: boolean;
  onChange: (id: string, fn: (n: TreeNode) => TreeNode) => void;
  onRemove: (id: string) => void;
}

function NodeEditor({
  node,
  depth,
  isRoot,
  onChange,
  onRemove,
}: NodeEditorProps) {
  const isVoid = VOID_TAGS.has(node.tag);

  const patch = useCallback(
    (partial: Partial<TreeNode>) => {
      onChange(node.id, (n) => ({ ...n, ...partial }));
    },
    [node.id, onChange],
  );

  const addAttr = useCallback(() => {
    onChange(node.id, (n) => ({
      ...n,
      attrs: [...n.attrs, attr("data-attr", "")],
    }));
  }, [node.id, onChange]);

  const updateAttr = useCallback(
    (attrId: string, name: string, value: string) => {
      onChange(node.id, (n) => ({
        ...n,
        attrs: n.attrs.map((a) =>
          a.id === attrId ? { ...a, name, value } : a,
        ),
      }));
    },
    [node.id, onChange],
  );

  const removeAttr = useCallback(
    (attrId: string) => {
      onChange(node.id, (n) => ({
        ...n,
        attrs: n.attrs.filter((a) => a.id !== attrId),
      }));
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
      {/* Row 1: tag select + classes + remove */}
      <div className="flex flex-wrap items-center gap-2">
        {depth > 0 && (
          <span
            className="hidden sm:inline-flex text-muted-foreground/60"
            aria-hidden
          >
            <CornerDownRight className="size-3.5" />
          </span>
        )}
        <Select value={node.tag} onValueChange={(v) => patch({ tag: v as TagOption })}>
          <SelectTrigger size="sm" className="h-7 w-24 font-mono text-xs">
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
        {!isRoot && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(node.id)}
            aria-label="Remove element"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Row 2: text content (non-void only) */}
      {!isVoid && (
        <Input
          value={node.text}
          onChange={(e) => patch({ text: e.target.value })}
          placeholder="text content"
          className="h-7 w-full font-mono text-xs"
          aria-label="Element text content"
        />
      )}

      {/* Row 3: attributes */}
      {node.attrs.length > 0 && (
        <div className="space-y-1.5">
          {node.attrs.map((a) => (
            <div key={a.id} className="flex items-center gap-1.5">
              <Input
                value={a.name}
                onChange={(e) => updateAttr(a.id, e.target.value, a.value)}
                placeholder="name"
                className="h-6 w-24 font-mono text-[11px]"
                aria-label="Attribute name"
              />
              <span className="text-muted-foreground/50 text-xs">=</span>
              <Input
                value={a.value}
                onChange={(e) => updateAttr(a.id, a.name, e.target.value)}
                placeholder="value"
                className="h-6 flex-1 font-mono text-[11px]"
                aria-label="Attribute value"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeAttr(a.id)}
                aria-label="Remove attribute"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Row 4: actions */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="h-6 gap-1 px-2 text-[11px]"
          onClick={addAttr}
        >
          <Plus className="size-3" />
          Attr
        </Button>
        {!isVoid && (
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
              {TAG_OPTIONS.filter((t) => !VOID_TAGS.has(t) || t === "img").map(
                (t) => (
                  <DropdownMenuItem
                    key={t}
                    onClick={() => addChild(t)}
                    className="font-mono text-xs"
                  >
                    {t}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Children (recursive) */}
      {node.children.length > 0 && (
        <div className="space-y-2 border-l border-border/40 pl-2">
          {node.children.map((c) => (
            <NodeEditor
              key={c.id}
              node={c}
              depth={depth + 1}
              isRoot={false}
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

export function HasSelectorTester() {
  const [tree, setTree] = useState<TreeNode>(() => PRESETS[1]!.build());
  const [selector, setSelector] = useState<string>(DEFAULT_SELECTOR);
  const [error, setError] = useState<string | null>(null);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [editorOpen, setEditorOpen] = useState<boolean>(true);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const highlightedRef = useRef<HTMLElement[]>([]);

  // Apply highlights whenever the selector or tree changes.
  useEffect(() => {
    const outcome = applyHighlights(
      previewRef.current,
      selector,
      highlightedRef,
    );
    setError(outcome.error);
    setMatchCount(outcome.matches.length);
  }, [selector, tree]);

  // Revert highlights on unmount.
  useEffect(() => {
    return () => {
      for (const el of highlightedRef.current) {
        el.style.outline = el.getAttribute(ORIG_OUTLINE) ?? "";
        el.style.outlineOffset = el.getAttribute(ORIG_OUTLINE_OFFSET) ?? "";
        el.style.backgroundColor = el.getAttribute(ORIG_BG) ?? "";
      }
      highlightedRef.current = [];
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
    setTree((prev) =>
      updateNode(prev, id, () => null),
    );
  }, []);

  // ── Preset loader ───────────────────────────────────────────────────

  const loadPreset = useCallback((preset: Preset) => {
    setTree(preset.build());
    setSelector(preset.selector);
  }, []);

  // ── Generated CSS ───────────────────────────────────────────────────

  const generatedCss = useMemo(() => {
    const trimmed = selector.trim();
    if (!trimmed) return "/* type a selector containing :has() */";
    return `${trimmed} {\n  /* your styles here */\n}`;
  }, [selector]);

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

  // ── Preview container style ─────────────────────────────────────────

  const previewStyle = useMemo<CSSProperties>(
    () => ({
      // `container-type` is unrelated to our `.container` class; it's here
      // to keep the preview at a stable height for screenshot diffs.
      minHeight: "120px",
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
              :has() Selector Tester
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
            Build a DOM tree, type a selector containing{" "}
            <code className="font-mono text-foreground/80">:has()</code>, and
            see live matches highlighted.
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

      {/* Selector input */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <Label
          htmlFor="has-selector"
          className="text-xs font-semibold uppercase tracking-wider text-primary"
        >
          Selector
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="has-selector"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder=".container:has(.active)"
            spellCheck={false}
            className="flex-1 min-w-[200px] font-mono text-sm"
            aria-invalid={!!error}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-9"
            aria-label="Copy generated CSS"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied!" : "Copy CSS"}
          </Button>
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
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
            >
              <Target className="size-3" />
              {matchCount} match{matchCount === 1 ? "" : "s"}
            </Badge>
          )}
          {!error && selector.trim() && (
            <span className="text-muted-foreground">
              Selector engine: native{" "}
              <code className="font-mono text-foreground/70">
                querySelectorAll
              </code>
            </span>
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
            ref={previewRef}
            style={previewStyle}
            className="space-y-1.5 rounded-lg border border-border bg-background p-3 text-sm text-foreground"
          >
            {tree.children.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Empty container — nothing to match.
              </p>
            ) : (
              tree.children.map((c) => renderDomNode(c))
            )}
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
                  &lt;div class="container"&gt;
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
                      isRoot={false}
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
                      Add element to container
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

      {/* Generated CSS */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Generated CSS
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
          The selector engine used here is the browser&apos;s own{" "}
          <code className="font-mono">Element.querySelectorAll</code> — so
          anything your browser supports will work, including{" "}
          <code className="font-mono">:is()</code>,{" "}
          <code className="font-mono">:where()</code>, and{" "}
          <code className="font-mono">:not()</code>.
        </p>
      </div>
    </div>
  );
}
