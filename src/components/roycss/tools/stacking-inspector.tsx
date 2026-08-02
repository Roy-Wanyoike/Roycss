"use client";

import { useState, useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Layers,
  ScanSearch,
  RefreshCw,
  Trash2,
  Eye,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * StackingInspector — CSS Stacking Context Inspector / Visualizer.
 *
 * Two modes:
 *  1. Inspector — paste HTML, see the stacking context tree with trigger reasons.
 *  2. Playground — interactive sandbox with 4 boxes; tweak z-index / position /
 *     isolation hacks and watch them (and the live tree) update in real time.
 *
 * Only inline `style` attributes are inspected (class-based styles are not
 * resolved). See the in-component disclaimer for details.
 */

// ============================================================
// Types
// ============================================================

interface StackNode {
  id: string;
  tagName: string;
  idAttr?: string;
  classAttr?: string;
  /** Raw z-index value as authored (or "auto"). */
  zIndex: string;
  /** CSS position value (or "static"). */
  position: string;
  /** Whether this element establishes a new stacking context. */
  isStackingContext: boolean;
  /** Human-readable trigger reasons (e.g. "position:fixed", "opacity:0.5"). */
  triggers: string[];
  /** DOM nesting depth (0 = root). */
  depth: number;
  children: StackNode[];
}

type SandboxPosition = "relative" | "absolute" | "fixed" | "sticky";

interface SandboxBox {
  letter: string;
  color: string;
  zIndex: number;
  position: SandboxPosition;
  /** Applies opacity:0.99 to force a stacking context. */
  createContext: boolean;
  top: string;
  left: string;
}

interface ParseResult {
  root: StackNode | null;
  error?: string;
}

// ============================================================
// Inline style parsing (manual; no getComputedStyle for parsed DOM)
// ============================================================

function parseInlineStyle(style: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!style) return out;
  for (const part of style.split(";")) {
    const idx = part.indexOf(":");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

// ============================================================
// Stacking context detection
// ============================================================

const WILL_CHANGE_RELEVANT = new Set([
  "transform",
  "opacity",
  "filter",
  "perspective",
  "isolation",
  "backdrop-filter",
  "z-index",
]);

interface Detection {
  isContext: boolean;
  triggers: string[];
  zIndex: string;
  position: string;
}

/**
 * Determine whether an element establishes a new stacking context based on
 * its inline style map. See https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context
 */
function detectStacking(
  styles: Record<string, string>,
  parentDisplay: string | null,
  isRoot: boolean,
): Detection {
  const position = styles["position"] ?? "static";
  const zIndexRaw = styles["z-index"];
  const zIndex = zIndexRaw ?? "auto";
  const opacity = styles["opacity"];
  const transform = styles["transform"];
  const filter = styles["filter"];
  const perspective = styles["perspective"];
  const backdropFilter = styles["backdrop-filter"] ?? styles["backdropfilter"];
  const willChange = styles["will-change"];
  const mixBlendMode = styles["mix-blend-mode"] ?? styles["mixblendmode"];
  const isolation = styles["isolation"];
  const mask = styles["mask"] ?? styles["mask-image"];
  const clipPath = styles["clip-path"] ?? styles["clippath"];
  const contain = styles["contain"];
  const containerType = styles["container-type"] ?? styles["containertype"];

  const triggers: string[] = [];

  if (isRoot) triggers.push("root element");

  // position: absolute/relative + z-index != auto
  if (
    (position === "absolute" || position === "relative") &&
    zIndexRaw != null &&
    zIndexRaw !== "auto"
  ) {
    triggers.push(`position:${position} + z-index:${zIndexRaw}`);
  }

  // position: fixed / sticky (always, regardless of z-index)
  if (position === "fixed" || position === "sticky") {
    triggers.push(`position:${position}`);
  }

  // flex / grid child with z-index != auto
  const isFlexOrGridParent =
    parentDisplay === "flex" ||
    parentDisplay === "inline-flex" ||
    parentDisplay === "grid" ||
    parentDisplay === "inline-grid";
  if (isFlexOrGridParent && zIndexRaw != null && zIndexRaw !== "auto") {
    triggers.push(`${parentDisplay}-child + z-index:${zIndexRaw}`);
  }

  // opacity < 1
  if (opacity != null) {
    const n = parseFloat(opacity);
    if (!Number.isNaN(n) && n < 1) triggers.push(`opacity:${opacity}`);
  }

  if (transform && transform !== "none") triggers.push("transform");
  if (filter && filter !== "none") triggers.push("filter");
  if (perspective && perspective !== "none") triggers.push("perspective");
  if (backdropFilter && backdropFilter !== "none") triggers.push("backdrop-filter");

  // will-change of transform/opacity/perspective/filter/isolation/backdrop-filter
  if (willChange && willChange !== "auto" && willChange !== "normal") {
    const relevant = willChange
      .split(",")
      .map((s) => s.trim())
      .filter((s) => WILL_CHANGE_RELEVANT.has(s));
    if (relevant.length) triggers.push(`will-change:${relevant.join(",")}`);
  }

  if (mixBlendMode && mixBlendMode !== "normal") {
    triggers.push(`mix-blend-mode:${mixBlendMode}`);
  }
  if (isolation === "isolate") triggers.push("isolation:isolate");
  if (mask && mask !== "none") triggers.push("mask");
  if (clipPath && clipPath !== "none") triggers.push("clip-path");

  if (contain) {
    const parts = contain.split(" ").map((s) => s.trim());
    if (parts.some((p) => ["layout", "paint", "strict", "content"].includes(p))) {
      triggers.push(`contain:${contain}`);
    }
  }

  if (
    containerType &&
    (containerType.startsWith("size") || containerType.startsWith("inline-size"))
  ) {
    triggers.push(`container-type:${containerType}`);
  }

  return {
    isContext: triggers.length > 0,
    triggers,
    zIndex,
    position,
  };
}

// ============================================================
// DOM tree walk → StackNode tree
// ============================================================

function buildTree(html: string): ParseResult {
  if (typeof window === "undefined") return { root: null };
  if (!html.trim()) return { root: null };
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const rootEl = doc.documentElement;
    if (!rootEl) return { root: null, error: "No root element found." };
    let counter = 0;
    const nextId = () => `node-${counter++}`;

    function walk(el: Element, depth: number, parentDisplay: string | null): StackNode {
      const styles = parseInlineStyle(el.getAttribute("style"));
      const display = styles["display"] ?? null;
      const isRoot = el.tagName.toLowerCase() === "html";
      const detection = detectStacking(styles, parentDisplay, isRoot);
      const rawClass = el.getAttribute("class") || undefined;
      const node: StackNode = {
        id: nextId(),
        tagName: el.tagName.toLowerCase(),
        idAttr: el.id || undefined,
        classAttr: rawClass
          ? rawClass.split(/\s+/).filter(Boolean).join(".")
          : undefined,
        zIndex: detection.zIndex,
        position: detection.position,
        isStackingContext: detection.isContext,
        triggers: detection.triggers,
        depth,
        children: [],
      };
      for (const child of Array.from(el.children)) {
        node.children.push(walk(child, depth + 1, display));
      }
      return node;
    }

    return { root: walk(rootEl, 0, null) };
  } catch (err) {
    return {
      root: null,
      error: err instanceof Error ? err.message : "Failed to parse HTML.",
    };
  }
}

// ============================================================
// Example HTML — the classic "modal behind navbar" bug
// ============================================================

const EXAMPLE_HTML = `<header style="position: sticky; top: 0; z-index: 100;">
  <nav style="position: relative;">
    <span class="brand">My App</span>
    <ul style="position: absolute; top: 100%; left: 0; z-index: 50;">
      <li>Profile</li>
      <li>Settings</li>
    </ul>
  </nav>
</header>
<main style="position: relative; z-index: 1;">
  <section>
    <p>Page content goes here.</p>
    <div id="modal" style="position: fixed; inset: 0; z-index: 9999;">
      <div style="position: absolute; top: 25%; left: 25%; right: 25%; bottom: 25%; opacity: 0.99;">
        Modal content
      </div>
    </div>
  </section>
</main>`;

// ============================================================
// Tree rendering
// ============================================================

function NodeRow({ node }: { node: StackNode }) {
  // Effective z-index in the parent's stacking context: the authored value,
  // or 0 if auto (context-creating elements with auto z-index are treated as 0).
  const effectiveZ = node.zIndex === "auto" ? "0" : node.zIndex;
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      <span className="font-mono text-sm">
        <span className="text-foreground">&lt;{node.tagName}&gt;</span>
        {node.idAttr && <span className="text-primary">#{node.idAttr}</span>}
        {node.classAttr && (
          <span className="text-muted-foreground">.{node.classAttr}</span>
        )}
      </span>

      <Badge
        variant="outline"
        className={cn(
          "font-mono text-[10px] py-0 h-4",
          node.zIndex !== "auto" && "border-primary/30 text-primary",
        )}
      >
        z:{node.zIndex}
      </Badge>

      {node.isStackingContext && (
        <Badge
          className="bg-primary/15 text-primary border-primary/20 font-mono text-[10px] py-0 h-4"
          title={`Effective z-index in parent context: ${effectiveZ}`}
        >
          <Layers className="size-2.5" /> context · eff.z:{effectiveZ}
        </Badge>
      )}

      {node.triggers.length > 0 && (
        <span className="text-[10px] text-muted-foreground font-mono">
          ← {node.triggers.join(" · ")}
        </span>
      )}
    </div>
  );
}

function TreeNode({ node }: { node: StackNode }) {
  return (
    <div>
      <NodeRow node={node} />
      {node.children.length > 0 && (
        <div className="ml-3 border-l border-border/40 pl-3">
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function StackTree({ result }: { result: ParseResult | null }) {
  if (!result) {
    return (
      <div className="text-sm text-muted-foreground italic py-8 text-center">
        Paste HTML to see the stacking context tree.
      </div>
    );
  }
  if (result.error) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center">
        <Badge variant="destructive">
          <AlertTriangle className="size-3" /> {result.error}
        </Badge>
      </div>
    );
  }
  if (!result.root) {
    return (
      <div className="text-sm text-muted-foreground italic py-8 text-center">
        Nothing to display.
      </div>
    );
  }
  return (
    <div className="max-h-[420px] overflow-y-auto rounded-md border border-border bg-card/50 p-3">
      <TreeNode node={result.root} />
    </div>
  );
}

// ============================================================
// Inspector mode
// ============================================================

function InspectorMode() {
  const [html, setHtml] = useState(EXAMPLE_HTML);
  const [result, setResult] = useState<ParseResult | null>(null);

  // Parse on mount and whenever `html` changes. Effect runs client-side only,
  // so DOMParser is always available — no SSR concerns.
  useEffect(() => {
    setResult(buildTree(html));
  }, [html]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="stack-html-input"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            HTML Snippet
          </Label>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setHtml(EXAMPLE_HTML)}
              aria-label="Load example HTML demonstrating the modal-behind-navbar bug"
            >
              <ScanSearch className="size-3.5" /> Example
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setHtml("")}
              aria-label="Clear HTML input"
            >
              <Trash2 className="size-3.5" /> Clear
            </Button>
          </div>
        </div>
        <Textarea
          id="stack-html-input"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="Paste HTML with inline styles here..."
          className="font-mono text-xs min-h-[140px] max-h-[280px]"
          spellCheck={false}
          aria-label="HTML input for stacking context inspection"
        />
      </div>

      {/* Disclaimer about class-based styles */}
      <div className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 p-2">
        <Info className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Only inline <code className="font-mono">style</code> attributes are
          parsed. Class-based styles (Tailwind, etc.) are <strong>not</strong>{" "}
          resolved — for full accuracy, paste real rendered DOM from browser
          DevTools.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Stacking Context Tree
          </Label>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Eye className="size-3" /> live
          </span>
        </div>
        <StackTree result={result} />
      </div>

      {/* Key insight / watch-out note */}
      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5">
        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-foreground/90 leading-relaxed">
          <strong>Key insight:</strong> z-index only compares between siblings
          in the <em>same</em> stacking context. A child with{" "}
          <code className="font-mono">z-index:999</code> inside a parent with{" "}
          <code className="font-mono">z-index:1</code> will still render{" "}
          <strong>BELOW</strong> a sibling of the parent with{" "}
          <code className="font-mono">z-index:2</code>.
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Playground mode
// ============================================================

const DEFAULT_BOXES: SandboxBox[] = [
  { letter: "A", color: "bg-emerald-500/80", zIndex: 1, position: "absolute", createContext: false, top: "32px", left: "24px" },
  { letter: "B", color: "bg-rose-500/80", zIndex: 2, position: "absolute", createContext: false, top: "64px", left: "96px" },
  { letter: "C", color: "bg-amber-500/80", zIndex: 3, position: "absolute", createContext: false, top: "96px", left: "168px" },
  { letter: "D", color: "bg-fuchsia-500/80", zIndex: 4, position: "absolute", createContext: false, top: "128px", left: "240px" },
];

/** Fixed z-index applied to the isolated wrapper around box B when wrapB is on.
 *  Demonstrates that B cannot escape this ceiling regardless of its own z-index. */
const B_WRAPPER_Z = 2;

function buildSandboxTree(boxes: SandboxBox[], wrapB: boolean): StackNode {
  const sandbox: StackNode = {
    id: "sandbox",
    tagName: "div",
    classAttr: "sandbox",
    zIndex: "auto",
    position: "relative",
    isStackingContext: true,
    triggers: ["transform:translateZ(0)"],
    depth: 0,
    children: [],
  };

  boxes.forEach((box) => {
    const triggers: string[] = [];
    if (box.position === "absolute" || box.position === "relative") {
      triggers.push(`position:${box.position} + z-index:${box.zIndex}`);
    }
    if (box.position === "fixed" || box.position === "sticky") {
      triggers.push(`position:${box.position}`);
    }
    if (box.createContext) {
      triggers.push("opacity:0.99");
    }
    const boxNode: StackNode = {
      id: `box-${box.letter}`,
      tagName: "div",
      classAttr: `box-${box.letter.toLowerCase()}`,
      zIndex: String(box.zIndex),
      position: box.position,
      isStackingContext: triggers.length > 0,
      triggers,
      depth: 1,
      children: [],
    };

    if (box.letter === "B" && wrapB) {
      const wrapper: StackNode = {
        id: "b-wrapper",
        tagName: "div",
        classAttr: "b-wrapper",
        zIndex: String(B_WRAPPER_Z),
        position: "relative",
        isStackingContext: true,
        triggers: ["isolation:isolate"],
        depth: 1,
        children: [{ ...boxNode, depth: 2 }],
      };
      sandbox.children.push(wrapper);
    } else {
      sandbox.children.push(boxNode);
    }
  });

  return sandbox;
}

function BoxVisual({
  box,
  wrapped,
}: {
  box: SandboxBox;
  wrapped: boolean;
}) {
  const inner: CSSProperties = {
    opacity: box.createContext ? 0.99 : 1,
    position: wrapped ? "relative" : box.position,
    zIndex: box.zIndex,
  };
  return (
    <div
      className={cn(
        "size-20 rounded-md flex flex-col items-center justify-center text-white font-bold text-lg shadow-lg border border-white/30",
        box.color,
        box.createContext && "ring-2 ring-primary/60 ring-offset-1 ring-offset-background",
      )}
      style={inner}
      aria-label={`Box ${box.letter}, z-index ${box.zIndex}, position ${box.position}${box.createContext ? ", forced context" : ""}`}
    >
      <span>{box.letter}</span>
      <span className="text-white/85 text-[10px] font-mono">z:{box.zIndex}</span>
    </div>
  );
}

function PlaygroundMode() {
  const [boxes, setBoxes] = useState<SandboxBox[]>(DEFAULT_BOXES);
  const [wrapB, setWrapB] = useState(false);

  const updateBox = (idx: number, patch: Partial<SandboxBox>) => {
    setBoxes((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const handleReset = () => {
    setBoxes(DEFAULT_BOXES);
    setWrapB(false);
  };

  const sandboxTree = buildSandboxTree(boxes, wrapB);

  // Render boxes — box B gets wrapped in an isolated parent when `wrapB` is on.
  const renderBoxes = (): ReactNode[] => {
    const out: ReactNode[] = [];
    boxes.forEach((box) => {
      if (box.letter === "B" && wrapB) {
        out.push(
          <div
            key="b-wrapper"
            className="absolute"
            style={{
              top: box.top,
              left: box.left,
              zIndex: B_WRAPPER_Z,
              isolation: "isolate",
            }}
            aria-label={`Isolated parent wrapping box B, fixed z-index ${B_WRAPPER_Z}`}
          >
            <BoxVisual box={box} wrapped />
          </div>,
        );
      } else {
        const style: CSSProperties = {
          top: box.top,
          left: box.left,
          zIndex: box.zIndex,
          position: box.position,
        };
        out.push(
          <div key={box.letter} className="absolute" style={style}>
            <BoxVisual box={box} wrapped={false} />
          </div>,
        );
      }
    });
    return out;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sandbox
        </Label>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          aria-label="Reset sandbox to defaults"
        >
          <RefreshCw className="size-3.5" /> Reset
        </Button>
      </div>

      {/* Sandbox — transform: translateZ(0) makes it the containing block for
          any fixed-positioned box so they stay inside the demo. */}
      <div
        className="relative h-80 w-full overflow-hidden rounded-lg bg-muted/30 border border-border"
        style={{ transform: "translateZ(0)" }}
        aria-label="Stacking sandbox preview"
      >
        <p className="absolute top-2 left-2 text-[10px] text-muted-foreground font-mono pointer-events-none">
          sandbox · position:relative · transform:translateZ(0)
        </p>
        {renderBoxes()}
      </div>

      {/* Wrap-B toggle */}
      <label className="flex items-start gap-2 cursor-pointer">
        <Switch
          checked={wrapB}
          onCheckedChange={setWrapB}
          aria-label="Wrap box B in an isolated parent with fixed z-index 2"
        />
        <span className="text-xs text-muted-foreground leading-relaxed">
          Wrap box <strong className="text-rose-500">B</strong> in an isolated
          parent (<code className="font-mono">isolation:isolate</code>,
          z-index <code className="font-mono">{B_WRAPPER_Z}</code>). B cannot
          escape this ceiling — set B&apos;s z-index to 9999 and watch it stay
          trapped.
        </span>
      </label>

      {/* Per-box controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {boxes.map((box, idx) => (
          <BoxControls
            key={box.letter}
            box={box}
            onChange={(patch) => updateBox(idx, patch)}
          />
        ))}
      </div>

      {/* Live tree */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live Stacking Tree
          </Label>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Eye className="size-3" /> auto-updates
          </span>
        </div>
        <div className="max-h-[280px] overflow-y-auto rounded-md border border-border bg-card/50 p-3">
          <TreeNode node={sandboxTree} />
        </div>
      </div>
    </div>
  );
}

function BoxControls({
  box,
  onChange,
}: {
  box: SandboxBox;
  onChange: (patch: Partial<SandboxBox>) => void;
}) {
  return (
    <div className="rounded-md border border-border p-2.5 space-y-2 bg-card/40">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex size-6 items-center justify-center rounded text-white font-bold text-xs",
            box.color,
          )}
          aria-hidden
        >
          {box.letter}
        </span>
        <span className="text-xs font-medium">Box {box.letter}</span>
        {box.createContext && (
          <Badge className="bg-primary/15 text-primary border-primary/20 text-[9px] py-0 h-4 ml-auto">
            <Layers className="size-2.5" /> ctx
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label
            htmlFor={`z-${box.letter}`}
            className="text-[10px] text-muted-foreground uppercase"
          >
            z-index
          </Label>
          <Input
            id={`z-${box.letter}`}
            type="number"
            min={-5}
            max={9999}
            value={box.zIndex}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!Number.isNaN(v)) {
                onChange({ zIndex: Math.max(-5, Math.min(9999, v)) });
              }
            }}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor={`pos-${box.letter}`}
            className="text-[10px] text-muted-foreground uppercase"
          >
            position
          </Label>
          <Select
            value={box.position}
            onValueChange={(v) => onChange({ position: v as SandboxPosition })}
          >
            <SelectTrigger id={`pos-${box.letter}`} className="h-7 text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relative">relative</SelectItem>
              <SelectItem value="absolute">absolute</SelectItem>
              <SelectItem value="fixed">fixed</SelectItem>
              <SelectItem value="sticky">sticky</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <Switch
          checked={box.createContext}
          onCheckedChange={(c) => onChange({ createContext: c })}
          aria-label={`Force stacking context on box ${box.letter} via opacity 0.99`}
        />
        <span className="text-[10px] text-muted-foreground">
          force context (<code className="font-mono">opacity:0.99</code>)
        </span>
      </label>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function StackingInspector() {
  return (
    <div className="w-full space-y-3">
      <Tabs defaultValue="inspector" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="inspector" className="flex-1">
            <ScanSearch className="size-3.5" /> Inspector
          </TabsTrigger>
          <TabsTrigger value="playground" className="flex-1">
            <Layers className="size-3.5" /> Playground
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inspector" className="mt-3">
          <InspectorMode />
        </TabsContent>
        <TabsContent value="playground" className="mt-3">
          <PlaygroundMode />
        </TabsContent>
      </Tabs>
    </div>
  );
}
