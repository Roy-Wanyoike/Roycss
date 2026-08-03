"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Move3d,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Crosshair,
  Link2,
  Link2Off,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * TransformStudio — a visual builder for the CSS `transform` property.
 *
 * Scope distinction from the legacy `src/components/roycss/transform-studio.tsx`:
 *  - The legacy component is a single-state transform editor with a flat set of
 *    sliders (rotateX/Y/Z, scale, translate, skew, perspective).
 *  - This tool models `transform` the way CSS actually composes it: as an
 *    ORDERED LIST of transform functions applied left-to-right. The user stacks
 *    layers (translate, rotate, scale, skewX, skewY, perspective, rotateX/Y/Z,
 *    translate3d), reorders them, and watches how matrix-multiplication order
 *    changes the rendered result.
 *
 * Features:
 *  - Transform layers: add / remove / reorder (up/down) / enable-per-layer /
 *    type-switch with per-type value controls (sliders + numeric inputs).
 *  - Live 3D preview: a colored "target" card inside a `perspective: 800px`
 *    scene, with a dashed ghost outline of the un-transformed card behind it
 *    for visual comparison. The scene's perspective is suppressed when a
 *    `perspective()` layer is added (since that function applies perspective
 *    on the element itself).
 *  - Transform-origin picker: a 3×3 grid of named presets (top-left …
 *    bottom-right) plus free-text X / Y inputs for arbitrary values (%, px,
 *    em, keywords).
 *  - 3D toggle: adds `transform-style: preserve-3d` to the scene + card so
 *    depth is rendered more faithfully (useful for rotateX/Y flips). A subtle
 *    floor grid appears as a depth cue.
 *  - Presets: Flip card, Tilt, Zoom in, Spin, Skew banner, Reset.
 *  - Generated CSS with copy-to-clipboard + 2s Check confirmation.
 *
 * All cleanup-safe: copy confirmation uses a single timeout that is cleared on
 * unmount. No console.log. No `any`.
 */

// ============================================================
// Types
// ============================================================

type TransformType =
  | "translate"
  | "rotate"
  | "scale"
  | "skewX"
  | "skewY"
  | "perspective"
  | "rotateX"
  | "rotateY"
  | "rotateZ"
  | "translate3d";

interface BaseLayer {
  id: string;
  enabled: boolean;
}

interface TranslateLayer extends BaseLayer {
  type: "translate";
  x: number;
  y: number;
}
interface RotateLayer extends BaseLayer {
  type: "rotate";
  angle: number;
}
interface ScaleLayer extends BaseLayer {
  type: "scale";
  x: number;
  y: number;
  /** When true, editing X also updates Y (and vice versa). */
  uniform: boolean;
}
interface SkewXLayer extends BaseLayer {
  type: "skewX";
  angle: number;
}
interface SkewYLayer extends BaseLayer {
  type: "skewY";
  angle: number;
}
interface PerspectiveLayer extends BaseLayer {
  type: "perspective";
  px: number;
}
interface RotateXLayer extends BaseLayer {
  type: "rotateX";
  angle: number;
}
interface RotateYLayer extends BaseLayer {
  type: "rotateY";
  angle: number;
}
interface RotateZLayer extends BaseLayer {
  type: "rotateZ";
  angle: number;
}
interface Translate3dLayer extends BaseLayer {
  type: "translate3d";
  x: number;
  y: number;
  z: number;
}

type TransformLayer =
  | TranslateLayer
  | RotateLayer
  | ScaleLayer
  | SkewXLayer
  | SkewYLayer
  | PerspectiveLayer
  | RotateXLayer
  | RotateYLayer
  | RotateZLayer
  | Translate3dLayer;

interface TransformOrigin {
  /** Raw CSS value for the X component (e.g. "50%", "100px", "left"). */
  x: string;
  /** Raw CSS value for the Y component (e.g. "center", "2em", "top"). */
  y: string;
}

// ============================================================
// Constants
// ============================================================

const TYPE_OPTIONS: { value: TransformType; label: string }[] = [
  { value: "translate", label: "translate(x, y)" },
  { value: "translate3d", label: "translate3d(x, y, z)" },
  { value: "rotate", label: "rotate(angle)" },
  { value: "rotateX", label: "rotateX(angle)" },
  { value: "rotateY", label: "rotateY(angle)" },
  { value: "rotateZ", label: "rotateZ(angle)" },
  { value: "scale", label: "scale(x, y)" },
  { value: "skewX", label: "skewX(angle)" },
  { value: "skewY", label: "skewY(angle)" },
  { value: "perspective", label: "perspective(px)" },
];

/** 3×3 grid of transform-origin presets, in row-major order (top row first). */
const ORIGIN_PRESETS: { x: string; y: string; label: string }[] = [
  { x: "left", y: "top", label: "top left" },
  { x: "center", y: "top", label: "top center" },
  { x: "right", y: "top", label: "top right" },
  { x: "left", y: "center", label: "center left" },
  { x: "center", y: "center", label: "center" },
  { x: "right", y: "center", label: "center right" },
  { x: "left", y: "bottom", label: "bottom left" },
  { x: "center", y: "bottom", label: "bottom center" },
  { x: "right", y: "bottom", label: "bottom right" },
];

const DEFAULT_ORIGIN: TransformOrigin = { x: "center", y: "center" };

// ============================================================
// Helpers
// ============================================================

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Format a number for CSS output: trim trailing zeros, keep ≤3 decimals. */
function fmt(n: number): string {
  return Number(n.toFixed(3)).toString();
}

let layerIdCounter = 1;
function makeLayerId(): string {
  return `tf-layer-${layerIdCounter++}`;
}

/** Create a fresh layer of the given type with sensible defaults. */
function makeLayer(type: TransformType): TransformLayer {
  const id = makeLayerId();
  const enabled = true;
  switch (type) {
    case "translate":
      return { id, enabled, type, x: 0, y: 0 };
    case "translate3d":
      return { id, enabled, type, x: 0, y: 0, z: 0 };
    case "rotate":
      return { id, enabled, type, angle: 0 };
    case "rotateX":
      return { id, enabled, type, angle: 0 };
    case "rotateY":
      return { id, enabled, type, angle: 0 };
    case "rotateZ":
      return { id, enabled, type, angle: 0 };
    case "scale":
      return { id, enabled, type, x: 1, y: 1, uniform: true };
    case "skewX":
      return { id, enabled, type, angle: 0 };
    case "skewY":
      return { id, enabled, type, angle: 0 };
    case "perspective":
      return { id, enabled, type, px: 800 };
  }
}

/**
 * Switch an existing layer to a new type, preserving only `id` and `enabled`.
 * Used when the user picks a different transform function from the type select.
 */
function changeLayerType(layer: TransformLayer, newType: TransformType): TransformLayer {
  const next = makeLayer(newType);
  return { ...next, id: layer.id, enabled: layer.enabled };
}

/** Render a single layer's transform function as a CSS string (or null if disabled). */
function layerToCss(layer: TransformLayer): string | null {
  if (!layer.enabled) return null;
  switch (layer.type) {
    case "translate":
      return `translate(${fmt(layer.x)}px, ${fmt(layer.y)}px)`;
    case "translate3d":
      return `translate3d(${fmt(layer.x)}px, ${fmt(layer.y)}px, ${fmt(layer.z)}px)`;
    case "rotate":
      return `rotate(${fmt(layer.angle)}deg)`;
    case "rotateX":
      return `rotateX(${fmt(layer.angle)}deg)`;
    case "rotateY":
      return `rotateY(${fmt(layer.angle)}deg)`;
    case "rotateZ":
      return `rotateZ(${fmt(layer.angle)}deg)`;
    case "scale":
      return `scale(${fmt(layer.x)}, ${fmt(layer.y)})`;
    case "skewX":
      return `skewX(${fmt(layer.angle)}deg)`;
    case "skewY":
      return `skewY(${fmt(layer.angle)}deg)`;
    case "perspective":
      return `perspective(${fmt(layer.px)}px)`;
  }
}

// ============================================================
// Sub-components
// ============================================================

interface ValueSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  ariaLabel: string;
}

/** A compact label + slider + numeric input + unit row. */
function ValueSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  ariaLabel,
}: ValueSliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              if (!Number.isNaN(n)) onChange(clamp(n, min, max));
            }}
            className="h-7 w-16 text-right font-mono text-xs"
            aria-label={ariaLabel}
          />
          <span className="w-6 font-mono text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        aria-label={`${ariaLabel} slider`}
      />
    </div>
  );
}

interface LayerCardProps {
  layer: TransformLayer;
  index: number;
  total: number;
  onChange: (id: string, next: TransformLayer) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

function LayerCard({
  layer,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: LayerCardProps) {
  const setEnabled = (enabled: boolean) =>
    onChange(layer.id, { ...layer, enabled });

  const setType = (t: TransformType) =>
    onChange(layer.id, changeLayerType(layer, t));

  // Render type-specific value controls. Inside each branch TypeScript narrows
  // `layer` to its specific variant, so `{ ...layer, x: v }` stays type-safe.
  let valueControls: React.ReactNode = null;
  if (layer.type === "translate") {
    const l = layer;
    valueControls = (
      <div className="grid gap-2 sm:grid-cols-2">
        <ValueSlider
          label="X"
          value={l.x}
          min={-200}
          max={200}
          step={1}
          unit="px"
          ariaLabel={`Layer ${index + 1} translate X`}
          onChange={(v) => onChange(l.id, { ...l, x: v })}
        />
        <ValueSlider
          label="Y"
          value={l.y}
          min={-200}
          max={200}
          step={1}
          unit="px"
          ariaLabel={`Layer ${index + 1} translate Y`}
          onChange={(v) => onChange(l.id, { ...l, y: v })}
        />
      </div>
    );
  } else if (layer.type === "translate3d") {
    const l = layer;
    valueControls = (
      <div className="grid gap-2 sm:grid-cols-3">
        <ValueSlider
          label="X"
          value={l.x}
          min={-200}
          max={200}
          step={1}
          unit="px"
          ariaLabel={`Layer ${index + 1} translate3d X`}
          onChange={(v) => onChange(l.id, { ...l, x: v })}
        />
        <ValueSlider
          label="Y"
          value={l.y}
          min={-200}
          max={200}
          step={1}
          unit="px"
          ariaLabel={`Layer ${index + 1} translate3d Y`}
          onChange={(v) => onChange(l.id, { ...l, y: v })}
        />
        <ValueSlider
          label="Z"
          value={l.z}
          min={-200}
          max={200}
          step={1}
          unit="px"
          ariaLabel={`Layer ${index + 1} translate3d Z`}
          onChange={(v) => onChange(l.id, { ...l, z: v })}
        />
      </div>
    );
  } else if (layer.type === "scale") {
    const l = layer;
    const setX = (v: number) =>
      onChange(l.id, l.uniform ? { ...l, x: v, y: v } : { ...l, x: v });
    const setY = (v: number) =>
      onChange(l.id, l.uniform ? { ...l, x: v, y: v } : { ...l, y: v });
    valueControls = (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onChange(l.id, { ...l, uniform: !l.uniform })}
          className={cn(
            "flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
            l.uniform
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={l.uniform}
          title={
            l.uniform
              ? "Uniform scale — X and Y linked"
              : "Independent scale — X and Y separate"
          }
        >
          {l.uniform ? (
            <Link2 className="size-3" />
          ) : (
            <Link2Off className="size-3" />
          )}
          {l.uniform ? "Linked" : "Unlinked"}
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <ValueSlider
            label="X"
            value={l.x}
            min={0.1}
            max={3}
            step={0.05}
            unit="×"
            ariaLabel={`Layer ${index + 1} scale X`}
            onChange={setX}
          />
          <ValueSlider
            label="Y"
            value={l.y}
            min={0.1}
            max={3}
            step={0.05}
            unit="×"
            ariaLabel={`Layer ${index + 1} scale Y`}
            onChange={setY}
          />
        </div>
      </div>
    );
  } else if (layer.type === "skewX" || layer.type === "skewY") {
    const l = layer;
    valueControls = (
      <ValueSlider
        label="Angle"
        value={l.angle}
        min={-90}
        max={90}
        step={1}
        unit="°"
        ariaLabel={`Layer ${index + 1} ${l.type} angle`}
        onChange={(v) => onChange(l.id, { ...l, angle: v })}
      />
    );
  } else if (
    layer.type === "rotate" ||
    layer.type === "rotateX" ||
    layer.type === "rotateY" ||
    layer.type === "rotateZ"
  ) {
    const l = layer;
    valueControls = (
      <ValueSlider
        label="Angle"
        value={l.angle}
        min={0}
        max={360}
        step={1}
        unit="°"
        ariaLabel={`Layer ${index + 1} ${l.type} angle`}
        onChange={(v) => onChange(l.id, { ...l, angle: v })}
      />
    );
  } else if (layer.type === "perspective") {
    const l = layer;
    valueControls = (
      <ValueSlider
        label="Distance"
        value={l.px}
        min={100}
        max={2000}
        step={10}
        unit="px"
        ariaLabel={`Layer ${index + 1} perspective distance`}
        onChange={(v) => onChange(l.id, { ...l, px: v })}
      />
    );
  }

  const cssPreview = layerToCss(layer);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 transition-opacity",
        !layer.enabled && "opacity-50",
      )}
    >
      {/* Row 1: index + type select + enable + reorder + delete */}
      <div className="flex items-center gap-1.5">
        <span
          className="shrink-0 font-mono text-[10px] text-muted-foreground"
          aria-hidden
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <Select value={layer.type} onValueChange={(v) => setType(v as TransformType)}>
          <SelectTrigger
            className="h-8 flex-1 font-mono text-xs"
            aria-label={`Layer ${index + 1} transform type`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value} className="font-mono text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Switch
          checked={layer.enabled}
          onCheckedChange={setEnabled}
          aria-label={`Layer ${index + 1} enabled`}
          title={layer.enabled ? "Disable layer" : "Enable layer"}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onMove(layer.id, -1)}
          disabled={index === 0}
          aria-label={`Move layer ${index + 1} up`}
          title="Move up"
        >
          <ArrowUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onMove(layer.id, 1)}
          disabled={index === total - 1}
          aria-label={`Move layer ${index + 1} down`}
          title="Move down"
        >
          <ArrowDown className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(layer.id)}
          aria-label={`Delete layer ${index + 1}`}
          title="Delete layer"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Row 2: value controls */}
      <div className="mt-3">{valueControls}</div>

      {/* Row 3: per-layer CSS preview */}
      <div className="mt-2.5 flex items-center gap-2">
        <code
          className={cn(
            "block flex-1 truncate rounded-md border border-border/50 bg-muted/40 px-2 py-1 font-mono text-[10px]",
            layer.enabled ? "text-foreground/80" : "text-muted-foreground/60",
          )}
        >
          {cssPreview ?? "— disabled —"}
        </code>
      </div>
    </div>
  );
}

interface OriginGridProps {
  origin: TransformOrigin;
  onChange: (next: TransformOrigin) => void;
}

/** 3×3 grid of transform-origin preset buttons. */
function OriginGrid({ origin, onChange }: OriginGridProps) {
  return (
    <div
      className="grid grid-cols-3 gap-1"
      role="radiogroup"
      aria-label="Transform origin preset"
    >
      {ORIGIN_PRESETS.map((p) => {
        const active = origin.x === p.x && origin.y === p.y;
        return (
          <button
            key={p.label}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={p.label}
            title={p.label}
            onClick={() => onChange({ x: p.x, y: p.y })}
            className={cn(
              "relative flex aspect-square cursor-pointer items-center justify-center rounded-md border transition-all",
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {/* A small dot indicating the origin position within the square */}
            <span
              className="absolute size-1.5 rounded-full bg-current"
              style={{
                top: p.y === "top" ? "20%" : p.y === "bottom" ? "auto" : "50%",
                bottom: p.y === "bottom" ? "20%" : "auto",
                left: p.x === "left" ? "20%" : p.x === "right" ? "auto" : "50%",
                right: p.x === "right" ? "20%" : "auto",
                transform: "translate(-50%, -50%)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Presets
// ============================================================

interface Preset {
  name: string;
  /** Builds a fresh set of layers (with new IDs) for this preset. */
  build: () => TransformLayer[];
  /** Optional origin override; if omitted, current origin is preserved. */
  origin?: TransformOrigin;
  /** Optional 3D-mode override; if omitted, current 3D toggle is preserved. */
  enable3d?: boolean;
}

/** Helper to build a single-value rotate layer with a given angle. */
function rotateLayer(
  type: "rotate" | "rotateX" | "rotateY" | "rotateZ",
  angle: number,
): TransformLayer {
  const l = makeLayer(type) as RotateLayer | RotateXLayer | RotateYLayer | RotateZLayer;
  l.angle = angle;
  return l;
}

const PRESETS: Preset[] = [
  {
    name: "Flip card",
    build: () => [rotateLayer("rotateY", 180)],
    enable3d: true,
  },
  {
    name: "Tilt",
    build: () => {
      const p = makeLayer("perspective") as PerspectiveLayer;
      p.px = 800;
      return [p, rotateLayer("rotateX", 15)];
    },
    enable3d: true,
  },
  {
    name: "Zoom in",
    build: () => {
      const s = makeLayer("scale") as ScaleLayer;
      s.x = 1.5;
      s.y = 1.5;
      s.uniform = true;
      return [s];
    },
  },
  {
    name: "Spin",
    build: () => [rotateLayer("rotate", 360)],
  },
  {
    name: "Skew banner",
    build: () => {
      const s = makeLayer("skewX") as SkewXLayer;
      s.angle = -15;
      return [s];
    },
  },
  {
    name: "Reset",
    build: () => [],
    origin: DEFAULT_ORIGIN,
    enable3d: false,
  },
];

// ============================================================
// Main component
// ============================================================

export function TransformStudio() {
  // ── State ────────────────────────────────────────────────────────
  const [layers, setLayers] = useState<TransformLayer[]>(() => {
    const seed = makeLayer("translate") as TranslateLayer;
    seed.x = 20;
    seed.y = 10;
    return [seed];
  });
  const [origin, setOrigin] = useState<TransformOrigin>(DEFAULT_ORIGIN);
  const [enable3d, setEnable3d] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived: composed transform string ───────────────────────────
  const transformValue = useMemo(() => {
    const parts = layers
      .map(layerToCss)
      .filter((v): v is string => v !== null);
    return parts.length > 0 ? parts.join(" ") : "none";
  }, [layers]);

  // ── Derived: scene perspective ───────────────────────────────────
  // The scene container supplies perspective UNLESS the user has added a
  // perspective() layer (in which case perspective is applied via the
  // transform function on the element itself).
  const hasPerspectiveLayer = useMemo(
    () => layers.some((l) => l.enabled && l.type === "perspective"),
    [layers],
  );

  const sceneStyle = useMemo(
    () => ({
      perspective: hasPerspectiveLayer ? "none" : "800px",
      transformStyle: enable3d ? ("preserve-3d" as const) : ("flat" as const),
    }),
    [hasPerspectiveLayer, enable3d],
  );

  const cardStyle = useMemo(
    () => ({
      transform: transformValue,
      transformOrigin: `${origin.x} ${origin.y}`,
      transformStyle: enable3d ? ("preserve-3d" as const) : ("flat" as const),
      backfaceVisibility: "visible" as const,
    }),
    [transformValue, origin, enable3d],
  );

  const originCss = useMemo(
    () => `${origin.x} ${origin.y}`,
    [origin],
  );

  // ── Derived: generated CSS (memoized) ────────────────────────────
  const generatedCss = useMemo(() => {
    return `.element {
  transform: ${transformValue};
  transform-origin: ${originCss};
}`;
  }, [transformValue, originCss]);

  // ── Actions ──────────────────────────────────────────────────────
  const addLayer = useCallback(() => {
    setLayers((prev) => [...prev, makeLayer("translate")]);
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const moveLayer = useCallback((id: string, direction: -1 | 1) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(nextIdx, 0, moved);
      return next;
    });
  }, []);

  const updateLayer = useCallback(
    (id: string, next: TransformLayer) => {
      setLayers((prev) => prev.map((l) => (l.id === id ? next : l)));
    },
    [],
  );

  const applyPreset = useCallback((preset: Preset) => {
    setLayers(preset.build());
    if (preset.origin) setOrigin(preset.origin);
    if (preset.enable3d !== undefined) setEnable3d(preset.enable3d);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [generatedCss]);

  // ── Cleanup on unmount: clear any pending copy timeout ───────────
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  // ── Render ───────────────────────────────────────────────────────
  const enabledCount = layers.filter((l) => l.enabled).length;
  const resetPreset = PRESETS[PRESETS.length - 1];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Move3d className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">Transform Studio</h3>
            <p className="text-xs text-muted-foreground">
              Stack <code className="font-mono">transform</code> functions and watch the
              matrix order matter
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => applyPreset(resetPreset)}
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          title="Clear all layers and reset origin"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      {/* ── Live preview + transform origin ────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        {/* Preview */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3.5" />
              Live Preview
            </span>
            <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Switch
                checked={enable3d}
                onCheckedChange={setEnable3d}
                aria-label="Toggle 3D rendering mode"
              />
              3D
            </label>
          </div>
          <div
            className="relative grid min-h-[280px] place-items-center overflow-hidden rounded-lg bg-muted/30 p-6"
            style={sceneStyle}
            role="region"
            aria-label="Transform preview scene"
          >
            {/* Floor grid for 3D depth reference (only visible in 3D mode) */}
            {enable3d && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-6 h-20 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, color-mix(in oklch, var(--primary) 30%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--primary) 30%, transparent) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                  transform: "rotateX(70deg)",
                  transformOrigin: "center bottom",
                }}
                aria-hidden
              />
            )}
            {/* Ghost outline (original, untransformed card) */}
            <div
              className="pointer-events-none absolute size-36 rounded-xl border-2 border-dashed border-border/60 bg-muted/10"
              aria-hidden
            />
            {/* Target card (with the composed transform applied) */}
            <div
              className="relative flex size-36 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xl"
              style={cardStyle}
              aria-label="Transformed target card"
              role="img"
            >
              <span className="select-none text-sm font-semibold tracking-wide">
                Target
              </span>
            </div>
          </div>
          {/* Inline transform summary */}
          <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-2">
            <code className="block overflow-x-auto font-mono text-[11px] text-foreground/80">
              transform: {transformValue}
            </code>
            <code className="mt-1 block overflow-x-auto font-mono text-[11px] text-muted-foreground">
              transform-origin: {originCss}
            </code>
          </div>
        </div>

        {/* Transform origin picker */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Crosshair className="size-3.5" />
            Origin
          </span>
          <OriginGrid origin={origin} onChange={setOrigin} />
          <div className="space-y-1.5 pt-1">
            <div className="space-y-0.5">
              <Label
                htmlFor="tf-origin-x"
                className="text-[9px] uppercase tracking-wider text-muted-foreground"
              >
                X
              </Label>
              <Input
                id="tf-origin-x"
                type="text"
                value={origin.x}
                onChange={(e) => setOrigin((o) => ({ ...o, x: e.target.value }))}
                placeholder="50% / 100px / left"
                className="h-7 font-mono text-xs"
                aria-label="Transform origin X value"
              />
            </div>
            <div className="space-y-0.5">
              <Label
                htmlFor="tf-origin-y"
                className="text-[9px] uppercase tracking-wider text-muted-foreground"
              >
                Y
              </Label>
              <Input
                id="tf-origin-y"
                type="text"
                value={origin.y}
                onChange={(e) => setOrigin((o) => ({ ...o, y: e.target.value }))}
                placeholder="50% / 100px / top"
                className="h-7 font-mono text-xs"
                aria-label="Transform origin Y value"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Presets ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Presets:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => applyPreset(p)}
            className="flex cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* ── Layers ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Move3d className="size-3.5" />
            Layers
            <Badge variant="secondary" className="ml-1 gap-1 font-mono text-[10px]">
              {enabledCount}/{layers.length}
            </Badge>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLayer}
            className="h-7 gap-1 text-xs"
          >
            <Plus className="size-3.5" />
            Add layer
          </Button>
        </div>
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {layers.map((layer, i) => (
              <motion.div
                key={layer.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <LayerCard
                  layer={layer}
                  index={i}
                  total={layers.length}
                  onChange={updateLayer}
                  onRemove={removeLayer}
                  onMove={moveLayer}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {layers.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
              <p className="text-xs text-muted-foreground">
                No transform layers.{" "}
                <button
                  type="button"
                  onClick={addLayer}
                  className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline"
                >
                  Add one
                </button>{" "}
                or pick a preset above to begin.
              </p>
            </div>
          )}
        </div>
        {layers.length > 1 && (
          <p className="text-[11px] text-muted-foreground">
            Transforms apply left-to-right — the first layer is the outermost
            matrix multiplication. Reorder to see how the order changes the
            result.
          </p>
        )}
      </div>

      {/* ── Generated CSS ──────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated CSS
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
              copied
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-primary/10 text-primary hover:bg-primary/20",
            )}
            aria-label={copied ? "CSS copied to clipboard" : "Copy generated CSS"}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground/80">
          <code>{generatedCss}</code>
        </pre>
      </div>
    </div>
  );
}
