"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
} from "react";
import {
  Anchor,
  Copy,
  Check,
  RefreshCw,
  Move,
  Sparkles,
  AlertTriangle,
  Code2,
  MousePointer2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * AnchorPositioning — visual builder for the CSS Anchor Positioning API.
 *
 * The CSS Anchor Positioning API (`anchor-name`, `position-anchor`,
 * `anchor()`, `anchor-size()`) lets a positioned element tether itself
 * to another element so that moving the anchor automatically moves the
 * target. This is the foundation of native tooltips, popovers, and
 * menus without JS positioning libraries.
 *
 * Features
 *  - Live preview: drag the anchor (a button) anywhere inside a sandbox;
 *    the target (a tooltip / popover) follows it in real time. The
 *    preview is JS-simulated so it works in every browser, even those
 *    that don't implement the API yet.
 *  - 9 position presets: top, bottom, left, right, center, top-left,
 *    top-right, bottom-left, bottom-right.
 *  - Offset slider (0–40 px) → maps to `margin` on the target.
 *  - 4 use-case presets: Tooltip below, Popover right, Menu below-center,
 *    Badge top-right.
 *  - Generated CSS with `anchor-name`, `position-anchor`, and `anchor()`
 *    functions, plus a Copy button.
 *  - Browser-support badge: Baseline 2024 (Chrome 125+, Edge 125+;
 *    Safari TP; Firefox behind a flag).
 *
 * Constraints: TS strict, no `any`, no console.log, memoized, semantic
 * theme tokens, responsive within max-w-2xl.
 */

// ─── Types ────────────────────────────────────────────────────────────────

type PositionPreset =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type UseCasePreset =
  | "tooltip-below"
  | "popover-right"
  | "menu-below-center"
  | "badge-top-right";

interface PositionMeta {
  value: PositionPreset;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

interface UseCaseConfig {
  position: PositionPreset;
  offset: number;
  label: string;
  targetText: string;
  targetVariant: "tooltip" | "popover" | "menu" | "badge";
}

interface TargetBox {
  width: number;
  height: number;
}

// ─── Constants ────────────────────────────────────────────────────────────

const PREVIEW_WIDTH = 480;
const PREVIEW_HEIGHT = 240;
const ANCHOR_WIDTH = 96;
const ANCHOR_HEIGHT = 36;
const TARGET_BOXES: Record<UseCaseConfig["targetVariant"], TargetBox> = {
  tooltip: { width: 160, height: 36 },
  popover: { width: 180, height: 80 },
  menu: { width: 160, height: 100 },
  badge: { width: 56, height: 24 },
};

const POSITION_OPTIONS: PositionMeta[] = [
  { value: "top-left", label: "Top Left", Icon: Move },
  { value: "top", label: "Top", Icon: Move },
  { value: "top-right", label: "Top Right", Icon: Move },
  { value: "left", label: "Left", Icon: Move },
  { value: "center", label: "Center", Icon: Move },
  { value: "right", label: "Right", Icon: Move },
  { value: "bottom-left", label: "Bot Left", Icon: Move },
  { value: "bottom", label: "Bottom", Icon: Move },
  { value: "bottom-right", label: "Bot Right", Icon: Move },
];

const USE_CASES: Record<UseCasePreset, UseCaseConfig> = {
  "tooltip-below": {
    position: "bottom",
    offset: 8,
    label: "Tooltip below",
    targetText: "I'm a tooltip",
    targetVariant: "tooltip",
  },
  "popover-right": {
    position: "right",
    offset: 12,
    label: "Popover right",
    targetText: "Popover\nwith details",
    targetVariant: "popover",
  },
  "menu-below-center": {
    position: "bottom",
    offset: 4,
    label: "Menu below-center",
    targetText: "Menu Item 1\nMenu Item 2\nMenu Item 3",
    targetVariant: "menu",
  },
  "badge-top-right": {
    position: "top-right",
    offset: 4,
    label: "Badge top-right",
    targetText: "3",
    targetVariant: "badge",
  },
};

const DEFAULT_USE_CASE: UseCasePreset = "tooltip-below";
const COPY_CONFIRM_MS = 1500;

// ─── Geometry helpers ─────────────────────────────────────────────────────

/**
 * Compute the target's pixel position (top-left corner) inside the
 * preview area, given the anchor's top-left and the position preset.
 *
 * The simulation mirrors the semantics of the native `anchor()` API:
 *   - `anchor(top)`    → top edge of the anchor (in container coords)
 *   - `anchor(bottom)` → bottom edge of the anchor
 *   - `anchor(left)`   → left edge of the anchor
 *   - `anchor(right)`  → right edge of the anchor
 *   - `anchor(center)` → horizontal midpoint of the anchor
 *   - `anchor(center)` (on Y) → vertical midpoint of the anchor
 *
 * The offset (margin) is applied in the direction of placement.
 */
function computeTargetBox(
  anchorX: number,
  anchorY: number,
  position: PositionPreset,
  offset: number,
  target: TargetBox,
): { x: number; y: number } {
  const a = {
    left: anchorX,
    top: anchorY,
    right: anchorX + ANCHOR_WIDTH,
    bottom: anchorY + ANCHOR_HEIGHT,
    cx: anchorX + ANCHOR_WIDTH / 2,
    cy: anchorY + ANCHOR_HEIGHT / 2,
  };

  switch (position) {
    case "top":
      return { x: a.cx - target.width / 2, y: a.top - target.height - offset };
    case "bottom":
      return { x: a.cx - target.width / 2, y: a.bottom + offset };
    case "left":
      return { x: a.left - target.width - offset, y: a.cy - target.height / 2 };
    case "right":
      return { x: a.right + offset, y: a.cy - target.height / 2 };
    case "center":
      return {
        x: a.cx - target.width / 2,
        y: a.cy - target.height / 2,
      };
    case "top-left":
      return { x: a.left - target.width - offset, y: a.top - target.height - offset };
    case "top-right":
      return { x: a.right + offset, y: a.top - target.height - offset };
    case "bottom-left":
      return { x: a.left - target.width - offset, y: a.bottom + offset };
    case "bottom-right":
      return { x: a.right + offset, y: a.bottom + offset };
    default:
      return { x: a.right + offset, y: a.bottom + offset };
  }
}

/**
 * Clamp the anchor inside the preview area so the target stays visible.
 * We pad by a margin equal to the larger of the target's dimension so
 * the target doesn't get cut off when placed on either side.
 */
function clampAnchor(
  x: number,
  y: number,
  padX: number,
  padY: number,
  areaWidth: number,
  areaHeight: number,
): { x: number; y: number } {
  const minX = Math.max(0, -padX + ANCHOR_WIDTH / 2);
  const maxX = Math.max(minX, Math.min(areaWidth - ANCHOR_WIDTH, areaWidth - ANCHOR_WIDTH / 2 + padX));
  const minY = Math.max(0, -padY + ANCHOR_HEIGHT / 2);
  const maxY = Math.max(minY, Math.min(areaHeight - ANCHOR_HEIGHT, areaHeight - ANCHOR_HEIGHT / 2 + padY));
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

// ─── Generated CSS ────────────────────────────────────────────────────────

/**
 * Build the generated CSS string for the chosen position + offset.
 *
 * The `anchor()` function returns the anchor's edge in the target's
 * containing-block coordinates. For instance, `top: anchor(bottom)`
 * places the target's top edge at the anchor's bottom edge — i.e.,
 * the target sits below the anchor.
 */
function buildGeneratedCss(
  position: PositionPreset,
  offset: number,
  targetVariant: UseCaseConfig["targetVariant"],
): string {
  const lines: string[] = [];
  lines.push("/* The anchor element gets a name. */");
  lines.push(".anchor {");
  lines.push("  anchor-name: --my-anchor;");
  lines.push("}");
  lines.push("");
  lines.push("/* The target opts into the anchor and uses anchor() for its edges. */");
  lines.push(`.target-${targetVariant} {`);
  lines.push("  position: absolute;");
  lines.push("  position-anchor: --my-anchor;");
  if (offset > 0) {
    lines.push(`  margin: ${offset}px;`);
  }

  switch (position) {
    case "top":
      lines.push("  bottom: anchor(top);");
      lines.push("  left: anchor(center);");
      lines.push("  transform: translateX(-50%);");
      break;
    case "bottom":
      lines.push("  top: anchor(bottom);");
      lines.push("  left: anchor(center);");
      lines.push("  transform: translateX(-50%);");
      break;
    case "left":
      lines.push("  right: anchor(left);");
      lines.push("  top: anchor(center);");
      lines.push("  transform: translateY(-50%);");
      break;
    case "right":
      lines.push("  left: anchor(right);");
      lines.push("  top: anchor(center);");
      lines.push("  transform: translateY(-50%);");
      break;
    case "center":
      lines.push("  top: anchor(center);");
      lines.push("  left: anchor(center);");
      lines.push("  transform: translate(-50%, -50%);");
      break;
    case "top-left":
      lines.push("  bottom: anchor(top);");
      lines.push("  right: anchor(left);");
      break;
    case "top-right":
      lines.push("  bottom: anchor(top);");
      lines.push("  left: anchor(right);");
      break;
    case "bottom-left":
      lines.push("  top: anchor(bottom);");
      lines.push("  right: anchor(left);");
      break;
    case "bottom-right":
      lines.push("  top: anchor(bottom);");
      lines.push("  left: anchor(right);");
      break;
    default:
      break;
  }
  lines.push("}");
  return lines.join("\n");
}

// ─── Component ────────────────────────────────────────────────────────────

export function AnchorPositioning() {
  const initial = USE_CASES[DEFAULT_USE_CASE];
  const [position, setPosition] = useState<PositionPreset>(initial.position);
  const [offset, setOffset] = useState<number>(initial.offset);
  const [targetVariant, setTargetVariant] =
    useState<UseCaseConfig["targetVariant"]>(initial.targetVariant);
  const [targetText, setTargetText] = useState<string>(initial.targetText);
  const [activeUseCase, setActiveUseCase] = useState<UseCasePreset | null>(
    DEFAULT_USE_CASE,
  );

  const [anchorX, setAnchorX] = useState<number>(192);
  const [anchorY, setAnchorY] = useState<number>(102);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Feature detection (deferred to rAF to satisfy react-hooks rule) ── */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
          setSupported(false);
          return;
        }
        // `anchor-name` is the most reliable probe; the API also exposes
        // `position-anchor` and the `anchor()` function.
        setSupported(
          CSS.supports("anchor-name: --x") ||
            CSS.supports("position-anchor: --x"),
        );
      } catch {
        setSupported(false);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── Clear copy timer on unmount ──────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const targetBox = TARGET_BOXES[targetVariant];

  /* ── Drag handlers ────────────────────────────────────────────────── */
  const startDrag = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    setDragging(true);
  }, []);

  const onDragMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      const rect = previewRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left - ANCHOR_WIDTH / 2;
      const y = e.clientY - rect.top - ANCHOR_HEIGHT / 2;
      const clamped = clampAnchor(
        x,
        y,
        targetBox.width,
        targetBox.height,
        rect.width,
        rect.height,
      );
      setAnchorX(clamped.x);
      setAnchorY(clamped.y);
    },
    [dragging, targetBox.width, targetBox.height],
  );

  const endDrag = useCallback(() => {
    setDragging(false);
  }, []);

  /* ── Clamp initial anchor coordinates if the preview area is smaller
     than the default 480×240 (e.g. on mobile). Mounted once. ────── */
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    setAnchorX((prev) => Math.max(0, Math.min(prev, rect.width - ANCHOR_WIDTH)));
    setAnchorY((prev) => Math.max(0, Math.min(prev, rect.height - ANCHOR_HEIGHT)));
    // React state-setters are stable; no need to depend on them.
  }, []);

  /* ── Copy ─────────────────────────────────────────────────────────── */
  const handleCopy = useCallback(async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    if (copiedTimerRef.current !== null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, COPY_CONFIRM_MS);
  }, []);

  /* ── Apply a use-case preset ──────────────────────────────────────── */
  const applyUseCase = useCallback((key: UseCasePreset) => {
    const cfg = USE_CASES[key];
    setPosition(cfg.position);
    setOffset(cfg.offset);
    setTargetVariant(cfg.targetVariant);
    setTargetText(cfg.targetText);
    setActiveUseCase(key);
  }, []);

  /* ── Per-control updates clear the active preset highlight ────────── */
  const updatePosition = useCallback((p: PositionPreset) => {
    setPosition(p);
    setActiveUseCase(null);
  }, []);
  const updateOffset = useCallback((v: number) => {
    setOffset(v);
    setActiveUseCase(null);
  }, []);

  const reset = useCallback(() => {
    applyUseCase(DEFAULT_USE_CASE);
    setAnchorX(192);
    setAnchorY(102);
  }, [applyUseCase]);

  /* ── Generated CSS (memoized) ─────────────────────────────────────── */
  const generatedCss = useMemo(
    () => buildGeneratedCss(position, offset, targetVariant),
    [position, offset, targetVariant],
  );

  /* ── Computed target position in the preview area ─────────────────── */
  const targetPos = useMemo(
    () => computeTargetBox(anchorX, anchorY, position, offset, targetBox),
    [anchorX, anchorY, position, offset, targetBox],
  );

  /* ── Styles ───────────────────────────────────────────────────────── */
  const previewStyle: CSSProperties = {
    width: "100%",
    maxWidth: PREVIEW_WIDTH,
    aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}`,
  };

  const anchorStyle: CSSProperties = {
    position: "absolute",
    left: `${anchorX}px`,
    top: `${anchorY}px`,
    width: `${ANCHOR_WIDTH}px`,
    height: `${ANCHOR_HEIGHT}px`,
    cursor: dragging ? "grabbing" : "grab",
    touchAction: "none",
  };

  const targetStyle: CSSProperties = {
    position: "absolute",
    left: `${targetPos.x}px`,
    top: `${targetPos.y}px`,
    width: `${targetBox.width}px`,
    minHeight: `${targetBox.height}px`,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header + support badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Anchor className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Anchor Positioning Builder
          </h3>
        </div>
        <Badge
          variant={supported === false ? "destructive" : "secondary"}
          className={cn(
            "gap-1 text-xs",
            supported === true && "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
            supported === false && "border-amber-500/40 text-amber-600 dark:text-amber-400",
          )}
        >
          {supported === null
            ? "Detecting…"
            : supported
              ? "Supported"
              : "Chrome 125+"}
          {supported === false && <AlertTriangle className="size-3" />}
        </Badge>
      </div>

      {/* Use-case presets */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Use-case presets
        </Label>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(USE_CASES) as UseCasePreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => applyUseCase(key)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                activeUseCase === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={activeUseCase === key}
            >
              {USE_CASES[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Live preview
          </Label>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MousePointer2 className="size-3" />
            Drag the anchor
          </span>
        </div>
        <div
          ref={previewRef}
          className="relative w-full overflow-hidden rounded-lg border border-border bg-card"
          style={previewStyle}
          onPointerMove={onDragMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          {/* grid background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--border) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
            aria-hidden
          />
          {/* anchor */}
          <button
            type="button"
            onPointerDown={startDrag}
            style={anchorStyle}
            className="z-10 flex items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Drag the anchor element"
          >
            <Move className="size-3" />
            Anchor
          </button>
          {/* target */}
          <div
            style={targetStyle}
            className={cn(
              "pointer-events-none z-20 flex flex-col items-center justify-center rounded-md border p-2 text-center text-[11px] font-medium shadow-md",
              targetVariant === "tooltip" &&
                "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
              targetVariant === "popover" &&
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              targetVariant === "menu" &&
                "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
              targetVariant === "badge" &&
                "border-rose-500/40 bg-rose-500 text-rose-50",
            )}
          >
            <span className="whitespace-pre-line leading-tight">
              {targetText}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          The target follows the anchor as you drag — just like the native{" "}
          <code className="text-foreground">anchor()</code> function would
          make it do automatically.
        </p>
      </div>

      {/* Position grid */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Target position (relative to anchor)
        </Label>
        <div className="grid grid-cols-3 gap-1">
          {POSITION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updatePosition(opt.value)}
              className={cn(
                "flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                position === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={position === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offset slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Offset (margin)
          </Label>
          <span className="text-xs text-foreground">{offset}px</span>
        </div>
        <Slider
          value={[offset]}
          min={0}
          max={40}
          step={1}
          onValueChange={(v) => updateOffset(v[0])}
          aria-label="Target offset"
        />
      </div>

      {/* Reset */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="h-9 gap-1.5 text-xs"
        >
          <RefreshCw className="size-3.5" /> Reset
        </Button>
      </div>

      {/* Generated CSS */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Code2 className="size-3" />
            Generated CSS
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(generatedCss)}
            className="h-7 gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="size-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> Copy
              </>
            )}
          </Button>
        </div>
        <pre className="max-h-64 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground">
          <code>{generatedCss}</code>
        </pre>
      </div>

      {/* Browser-support note */}
      <p className="flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] text-amber-700 dark:text-amber-300">
        <Sparkles className="mt-0.5 size-3 shrink-0" />
        <span>
          The CSS Anchor Positioning API reached Baseline in 2024
          (Chrome 125+, Edge 125+, Safari Technology Preview). Firefox
          ships it behind a flag. The live preview above is JS-simulated
          so it works in any browser — copy the CSS into a Chrome 125+
          build to see the native behaviour.
        </span>
      </p>
    </div>
  );
}
