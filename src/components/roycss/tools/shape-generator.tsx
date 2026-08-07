"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Shapes,
  Copy,
  Check,
  Sparkles,
  Trash2,
  RotateCcw,
  Circle,
  Square,
  Triangle,
  Pentagon,
  Hexagon,
  Octagon,
  Star,
  Heart,
  ArrowRight,
  Diamond,
  Spline,
  Split,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * ShapeGenerator — a visual builder for CSS shapes.
 *
 * Three authoring modes (tabbed):
 *  1. Presets — 14 ready-made shapes (circle, ellipse, triangle, square,
 *     pentagon, hexagon, octagon, star, heart, arrow, diamond, blob,
 *     parallelogram, trapezoid). Each preset is rendered as a card with a
 *     live mini preview, the underlying `clip-path` / `border-radius` CSS,
 *     and a Copy button. Clicking a card promotes it to the "current"
 *     shape surfaced in the header stats line.
 *  2. Custom Polygon — an SVG grid editor (100×100 viewBox). Click empty
 *     space to add a point, drag a point handle to reposition, right-click
 *     a handle (or use the row Delete button) to remove. Points snap to a
 *     5% grid. Generates `clip-path: polygon(...)`.
 *  3. Border Radius — four corner sliders (top-left, top-right, bottom-right,
 *     bottom-left), 0–100%. Generates `border-radius: a% b% c% d%;`.
 *
 * Below the active editor, a large live preview + the generated CSS rule +
 * a Copy button are always visible.
 *
 * Constraints: TS strict, zero `any`, zero `console.log`. Semantic theme
 * colors only (bg-card, bg-background, text-foreground, text-muted-foreground,
 * border-border, bg-primary, text-primary, bg-muted). No indigo/blue.
 */

// ─── Types ────────────────────────────────────────────────────────────────

type EditorMode = "presets" | "custom" | "borderRadius";

type ShapeKey =
  | "circle"
  | "ellipse"
  | "triangle"
  | "square"
  | "pentagon"
  | "hexagon"
  | "octagon"
  | "star"
  | "heart"
  | "arrow"
  | "diamond"
  | "blob"
  | "parallelogram"
  | "trapezoid";

type LucideIcon = ComponentType<{ className?: string }>;

interface ShapePreset {
  key: ShapeKey;
  label: string;
  Icon: LucideIcon;
  /** CSS declaration string (no selector, trailing semicolon included). */
  css: string;
  /** Inline style for the preview box. */
  style: CSSProperties;
}

interface PolyPoint {
  x: number; // 0–100 (percentage)
  y: number; // 0–100 (percentage)
}

type CornerKey = "tl" | "tr" | "br" | "bl";

interface BorderRadiusState {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

// ─── Constants ────────────────────────────────────────────────────────────

const SHAPE_PRESETS: ShapePreset[] = [
  {
    key: "circle",
    label: "Circle",
    Icon: Circle,
    css: "clip-path: circle(50% at 50% 50%);",
    style: { clipPath: "circle(50% at 50% 50%)" },
  },
  {
    key: "ellipse",
    label: "Ellipse",
    Icon: Circle,
    css: "clip-path: ellipse(50% 40% at 50% 50%);",
    style: { clipPath: "ellipse(50% 40% at 50% 50%)" },
  },
  {
    key: "triangle",
    label: "Triangle",
    Icon: Triangle,
    css: "clip-path: polygon(50% 0%, 0% 100%, 100% 100%);",
    style: { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" },
  },
  {
    key: "square",
    label: "Square",
    Icon: Square,
    css: "clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);",
    style: { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" },
  },
  {
    key: "pentagon",
    label: "Pentagon",
    Icon: Pentagon,
    css: "clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);",
    style: { clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" },
  },
  {
    key: "hexagon",
    label: "Hexagon",
    Icon: Hexagon,
    css: "clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);",
    style: {
      clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    },
  },
  {
    key: "octagon",
    label: "Octagon",
    Icon: Octagon,
    css: "clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);",
    style: {
      clipPath:
        "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
    },
  },
  {
    key: "star",
    label: "Star",
    Icon: Star,
    css: "clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);",
    style: {
      clipPath:
        "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
    },
  },
  {
    key: "heart",
    label: "Heart",
    Icon: Heart,
    css: "clip-path: polygon(50% 100%, 0% 35%, 0% 15%, 15% 0%, 35% 0%, 50% 20%, 65% 0%, 85% 0%, 100% 15%, 100% 35%);",
    style: {
      clipPath:
        "polygon(50% 100%, 0% 35%, 0% 15%, 15% 0%, 35% 0%, 50% 20%, 65% 0%, 85% 0%, 100% 15%, 100% 35%)",
    },
  },
  {
    key: "arrow",
    label: "Arrow",
    Icon: ArrowRight,
    css: "clip-path: polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%);",
    style: {
      clipPath:
        "polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)",
    },
  },
  {
    key: "diamond",
    label: "Diamond",
    Icon: Diamond,
    css: "clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);",
    style: { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  },
  {
    key: "blob",
    label: "Blob",
    Icon: Spline,
    css: "border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;",
    style: { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
  },
  {
    key: "parallelogram",
    label: "Parallelogram",
    Icon: Split,
    css: "clip-path: polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%);",
    style: { clipPath: "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)" },
  },
  {
    key: "trapezoid",
    label: "Trapezoid",
    Icon: Split,
    css: "clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);",
    style: { clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)" },
  },
];

const DEFAULT_PRESET_KEY: ShapeKey = "hexagon";

const DEFAULT_CUSTOM_POINTS: PolyPoint[] = [
  { x: 50, y: 0 },
  { x: 100, y: 50 },
  { x: 50, y: 100 },
  { x: 0, y: 50 },
];

const DEFAULT_BORDER_RADIUS: BorderRadiusState = { tl: 16, tr: 16, br: 16, bl: 16 };

const SNAP_STEP = 5; // snap polygon points to 5% grid
const GRID_SIZE = 100; // viewBox 0..100

const CORNER_META: Array<{
  key: CornerKey;
  label: string;
  hint: string;
}> = [
  { key: "tl", label: "Top-left", hint: "border-top-left-radius" },
  { key: "tr", label: "Top-right", hint: "border-top-right-radius" },
  { key: "br", label: "Bottom-right", hint: "border-bottom-right-radius" },
  { key: "bl", label: "Bottom-left", hint: "border-bottom-left-radius" },
];

const COPY_CONFIRM_MS = 1500;

// ─── Helpers ──────────────────────────────────────────────────────────────

const clampPct = (n: number): number =>
  Math.max(0, Math.min(GRID_SIZE, Math.round(n)));

const snap = (n: number): number => Math.round(n / SNAP_STEP) * SNAP_STEP;

const formatPoint = (p: PolyPoint): string => `${p.x}% ${p.y}%`;

const buildPolygonCss = (points: PolyPoint[]): string => {
  if (points.length < 3) return "/* add at least 3 points */";
  const inner = points.map(formatPoint).join(", ");
  return `clip-path: polygon(${inner});`;
};

const buildPolygonStyle = (points: PolyPoint[]): CSSProperties => {
  if (points.length < 3) return { borderRadius: 0 };
  const inner = points.map(formatPoint).join(", ");
  return { clipPath: `polygon(${inner})` };
};

const buildBorderRadiusCss = (r: BorderRadiusState): string =>
  `border-radius: ${r.tl}% ${r.tr}% ${r.br}% ${r.bl}%;`;

const buildBorderRadiusStyle = (r: BorderRadiusState): CSSProperties => ({
  borderRadius: `${r.tl}% ${r.tr}% ${r.br}% ${r.bl}%`,
});

// ─── Component ────────────────────────────────────────────────────────────

export function ShapeGenerator() {
  const [mode, setMode] = useState<EditorMode>("presets");
  const [selectedPresetKey, setSelectedPresetKey] = useState<ShapeKey>(
    DEFAULT_PRESET_KEY,
  );
  const [customPoints, setCustomPoints] = useState<PolyPoint[]>(
    DEFAULT_CUSTOM_POINTS,
  );
  const [borderRadius, setBorderRadius] = useState<BorderRadiusState>(
    DEFAULT_BORDER_RADIUS,
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the copy-confirmation timer on unmount.
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const flashCopied = useCallback((key: string) => {
    setCopiedKey(key);
    if (copiedTimerRef.current !== null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => {
      setCopiedKey(null);
      copiedTimerRef.current = null;
    }, COPY_CONFIRM_MS);
  }, []);

  const handleCopy = useCallback(
    async (text: string, key: string) => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
        flashCopied(key);
      } catch {
        // Clipboard may be unavailable (e.g. insecure context); still flash
        // so the user gets feedback that the action was attempted.
        flashCopied(key);
      }
    },
    [flashCopied],
  );

  const selectedPreset = useMemo(
    () =>
      SHAPE_PRESETS.find((p) => p.key === selectedPresetKey) ?? SHAPE_PRESETS[0]!,
    [selectedPresetKey],
  );

  // Active shape name + active CSS + active preview style, derived from mode.
  const { currentName, currentCss, currentStyle } = useMemo(() => {
    if (mode === "custom") {
      return {
        currentName: "Custom polygon",
        currentCss: buildPolygonCss(customPoints),
        currentStyle: buildPolygonStyle(customPoints),
      };
    }
    if (mode === "borderRadius") {
      return {
        currentName: "Border-radius",
        currentCss: buildBorderRadiusCss(borderRadius),
        currentStyle: buildBorderRadiusStyle(borderRadius),
      };
    }
    return {
      currentName: selectedPreset.label,
      currentCss: selectedPreset.css,
      currentStyle: selectedPreset.style,
    };
  }, [mode, customPoints, borderRadius, selectedPreset]);

  // ─── Custom polygon pointer handlers ────────────────────────────────────

  const dragIndexRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const pointFromEvent = useCallback(
    (clientX: number, clientY: number): PolyPoint => {
      const svg = svgRef.current;
      if (!svg) return { x: 50, y: 50 };
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * GRID_SIZE;
      const y = ((clientY - rect.top) / rect.height) * GRID_SIZE;
      return { x: clampPct(x), y: clampPct(y) };
    },
    [],
  );

  const handleSvgPointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      // Only left-click that lands on the SVG, the background rect, or the
      // polygon overlay should add a point. Clicks on a point handle (a
      // <circle>) are handled by that handle's own pointer-down handler
      // (which calls stopPropagation), so we should never see them here —
      // but we guard defensively anyway.
      if (e.button !== 0) return;
      const tag = (e.target as Element).tagName;
      if (tag === "circle") return;
      const raw = pointFromEvent(e.clientX, e.clientY);
      const next: PolyPoint = { x: snap(raw.x), y: snap(raw.y) };
      setCustomPoints((prev) => [...prev, next]);
      e.preventDefault();
    },
    [pointFromEvent],
  );

  const handlePointPointerDown = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>, index: number) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      dragIndexRef.current = index;
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [],
  );

  const handlePointPointerMove = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>) => {
      if (dragIndexRef.current === null) return;
      const idx = dragIndexRef.current;
      const raw = pointFromEvent(e.clientX, e.clientY);
      const next: PolyPoint = { x: clampPct(raw.x), y: clampPct(raw.y) };
      setCustomPoints((prev) => {
        if (idx < 0 || idx >= prev.length) return prev;
        const copy = prev.slice();
        copy[idx] = next;
        return copy;
      });
    },
    [pointFromEvent],
  );

  const handlePointPointerUp = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>) => {
      if (dragIndexRef.current !== null) {
        try {
          (e.currentTarget as Element).releasePointerCapture(e.pointerId);
        } catch {
          /* no-op */
        }
        dragIndexRef.current = null;
      }
    },
    [],
  );

  const handlePointContextMenu = useCallback(
    (e: React.MouseEvent<SVGCircleElement>, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setCustomPoints((prev) => prev.filter((_, i) => i !== index));
    },
    [],
  );

  const removePoint = useCallback((index: number) => {
    setCustomPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetCustom = useCallback(() => {
    setCustomPoints(DEFAULT_CUSTOM_POINTS);
  }, []);

  const polygonPointsAttr = useMemo(
    () => customPoints.map((p) => `${p.x},${p.y}`).join(" "),
    [customPoints],
  );

  // ─── Border-radius handlers ─────────────────────────────────────────────

  const setCorner = useCallback((key: CornerKey, value: number) => {
    setBorderRadius((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetBorderRadius = useCallback(() => {
    setBorderRadius(DEFAULT_BORDER_RADIUS);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shapes className="size-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            CSS Shape Generator
          </h3>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {SHAPE_PRESETS.length} shapes · current: {currentName}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Build CSS shapes visually with <code className="font-mono">clip-path</code>,{" "}
        <code className="font-mono">border-radius</code>, and transform-ready
        polygons. Pick a preset, draw your own polygon, or sculpt corners — every
        edit generates copy-ready CSS.
      </p>

      {/* Editor tabs */}
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as EditorMode)}
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger value="presets" className="flex-1">
            Presets
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">
            Custom polygon
          </TabsTrigger>
          <TabsTrigger value="borderRadius" className="flex-1">
            Border radius
          </TabsTrigger>
        </TabsList>

        {/* Presets tab */}
        <TabsContent value="presets" className="mt-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SHAPE_PRESETS.map((preset) => {
              const Icon = preset.Icon;
              const isSelected = preset.key === selectedPresetKey;
              const isCopied = copiedKey === `preset-${preset.key}`;
              return (
                <div
                  key={preset.key}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border bg-card p-3 transition-colors",
                    isSelected
                      ? "border-primary/60 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                      <div
                        className="size-8 bg-primary"
                        style={preset.style}
                        aria-hidden
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium text-foreground">
                        {preset.label}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      className="h-7 shrink-0 px-2 text-xs"
                      onClick={() => {
                        setSelectedPresetKey(preset.key);
                        handleCopy(preset.css, `preset-${preset.key}`);
                      }}
                    >
                      {isCopied ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      <span className="sr-only">Copy {preset.label} CSS</span>
                    </Button>
                  </div>
                  <pre className="overflow-x-auto rounded-md bg-muted/60 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-foreground">
                    <code>{preset.css}</code>
                  </pre>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Custom polygon tab */}
        <TabsContent value="custom" className="mt-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="sm:w-1/2">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Click to add · drag to move · right-click to delete
                </Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={resetCustom}
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </Button>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-2">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
                  className="aspect-square w-full touch-none cursor-crosshair"
                  onPointerDown={handleSvgPointerDown}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <defs>
                    <pattern
                      id="shape-grid"
                      width={SNAP_STEP}
                      height={SNAP_STEP}
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d={`M ${SNAP_STEP} 0 L 0 0 0 ${SNAP_STEP}`}
                        fill="none"
                        className="stroke-border"
                        strokeWidth={0.3}
                      />
                    </pattern>
                  </defs>
                  <rect
                    x={0}
                    y={0}
                    width={GRID_SIZE}
                    height={GRID_SIZE}
                    fill="url(#shape-grid)"
                    className="fill-border/40"
                  />
                  {customPoints.length >= 3 && (
                    <polygon
                      points={polygonPointsAttr}
                      className="fill-primary/30 stroke-primary"
                      strokeWidth={0.6}
                    />
                  )}
                  {customPoints.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={2.2}
                      className="fill-background stroke-primary"
                      strokeWidth={0.8}
                      onPointerDown={(e) => handlePointPointerDown(e, i)}
                      onPointerMove={handlePointPointerMove}
                      onPointerUp={handlePointPointerUp}
                      onContextMenu={(e) => handlePointContextMenu(e, i)}
                      style={{ cursor: "grab", touchAction: "none" }}
                    />
                  ))}
                </svg>
              </div>
            </div>

            <div className="sm:w-1/2">
              <Label className="text-xs text-muted-foreground">
                Points ({customPoints.length})
              </Label>
              <div className="mt-1 max-h-64 space-y-1.5 overflow-y-auto rounded-md border border-border bg-card p-2">
                {customPoints.length === 0 && (
                  <p className="px-1 py-2 text-xs text-muted-foreground">
                    No points yet. Click the grid to add one.
                  </p>
                )}
                {customPoints.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded px-1.5 py-1 font-mono text-xs text-foreground hover:bg-muted/60"
                  >
                    <span className="w-5 shrink-0 text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="flex-1">
                      {p.x}% {p.y}%
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removePoint(i)}
                      aria-label={`Remove point ${i + 1}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Sparkles className="size-3" />
                Snaps to {SNAP_STEP}% grid · minimum 3 points for a polygon.
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Border-radius tab */}
        <TabsContent value="borderRadius" className="mt-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CORNER_META.map(({ key, label, hint }) => (
              <div
                key={key}
                className="rounded-md border border-border bg-card p-3"
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    {label}
                  </Label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {borderRadius[key]}%
                  </span>
                </div>
                <Slider
                  value={[borderRadius[key]]}
                  onValueChange={(v) => setCorner(key, v[0] ?? 0)}
                  min={0}
                  max={100}
                  step={1}
                  aria-label={hint}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={resetBorderRadius}
            >
              <RotateCcw className="size-3.5" />
              Reset corners
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Live preview + generated CSS (always reflects active mode) */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live preview
          </Label>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => handleCopy(currentCss, "current")}
          >
            {copiedKey === "current" ? (
              <>
                <Check className="size-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" /> Copy CSS
              </>
            )}
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-32 shrink-0 items-center justify-center rounded-md bg-muted/50">
            <div
              className="size-24 bg-primary shadow-sm"
              style={currentStyle}
              aria-label={`${currentName} preview`}
              role="img"
            />
          </div>
          <pre className="flex-1 overflow-x-auto rounded-md bg-muted/60 px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
            <code>{currentCss}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

export default ShapeGenerator;
