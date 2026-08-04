"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Filter,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Eye,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * FilterStudioPro — a chain-based CSS `filter` studio.
 *
 * Unlike a flat-sliders editor, this models `filter` as an ORDERED LIST of
 * filter functions (blur, brightness, contrast, drop-shadow, grayscale,
 * hue-rotate, invert, opacity, saturate, sepia). The user stacks layers,
 * enables/disables per-layer, reorders (up/down), deletes, and watches the
 * composited result live on three preview surfaces (image / box / text).
 *
 * Features:
 *  - Layer stack: add (via type menu), remove, reorder (up/down), per-layer
 *    enable toggle, per-type value controls (slider + numeric input). The
 *    drop-shadow layer exposes dx/dy/blur/color.
 *  - Live preview Tabs: Image (roy-photo), Box (colorful gradient), Text
 *    (large heading). Switch surface without losing the layer stack.
 *  - Before/after comparison: a draggable vertical divider reveals the
 *    unfiltered source on the right, filtered on the left. Pointer drag.
 *  - 7 presets: Vintage, Cool, Warm, B&W, Dramatic, Dreamy, Inverted.
 *  - SVG filter export: maps every CSS filter to its SVG primitive
 *    (feGaussianBlur / feColorMatrix / feComponentTransfer / feDropShadow)
 *    so the same chain can be applied to SVG or as `filter: url(#id)`.
 *  - Generated CSS + SVG output with Copy buttons (2s Check confirmation).
 *
 * Browser support: `filter` is Baseline (Chrome 53+, FF 35+, Safari 9.1+).
 */

// ============================================================
// Types
// ============================================================

type FilterType =
  | "blur"
  | "brightness"
  | "contrast"
  | "drop-shadow"
  | "grayscale"
  | "hue-rotate"
  | "invert"
  | "opacity"
  | "saturate"
  | "sepia";

interface FilterLayer {
  id: string;
  type: FilterType;
  enabled: boolean;
  /** Primary numeric value (used by every type except drop-shadow). */
  value: number;
  /** Drop-shadow x offset (px). */
  dx: number;
  /** Drop-shadow y offset (px). */
  dy: number;
  /** Drop-shadow blur radius (px). */
  dBlur: number;
  /** Drop-shadow color (any CSS color). */
  color: string;
}

interface FilterSpec {
  type: FilterType;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  default: number;
}

interface Preset {
  name: string;
  layers: Array<{
    type: FilterType;
    value?: number;
    dx?: number;
    dy?: number;
    dBlur?: number;
    color?: string;
  }>;
}

type PreviewSurface = "image" | "box" | "text";

// ============================================================
// Constants
// ============================================================

const FILTER_SPECS: Record<FilterType, FilterSpec> = {
  blur: { type: "blur", label: "Blur", min: 0, max: 20, step: 0.1, unit: "px", default: 4 },
  brightness: { type: "brightness", label: "Brightness", min: 0, max: 200, step: 1, unit: "%", default: 100 },
  contrast: { type: "contrast", label: "Contrast", min: 0, max: 200, step: 1, unit: "%", default: 100 },
  "drop-shadow": { type: "drop-shadow", label: "Drop Shadow", min: 0, max: 30, step: 0.5, unit: "px", default: 4 },
  grayscale: { type: "grayscale", label: "Grayscale", min: 0, max: 100, step: 1, unit: "%", default: 100 },
  "hue-rotate": { type: "hue-rotate", label: "Hue Rotate", min: -180, max: 180, step: 1, unit: "deg", default: 0 },
  invert: { type: "invert", label: "Invert", min: 0, max: 100, step: 1, unit: "%", default: 100 },
  opacity: { type: "opacity", label: "Opacity", min: 0, max: 100, step: 1, unit: "%", default: 100 },
  saturate: { type: "saturate", label: "Saturate", min: 0, max: 200, step: 1, unit: "%", default: 100 },
  sepia: { type: "sepia", label: "Sepia", min: 0, max: 100, step: 1, unit: "%", default: 0 },
};

const FILTER_TYPE_ORDER: FilterType[] = [
  "blur",
  "brightness",
  "contrast",
  "drop-shadow",
  "grayscale",
  "hue-rotate",
  "invert",
  "opacity",
  "saturate",
  "sepia",
];

const DEFAULT_DS_COLOR = "rgba(0,0,0,0.5)";

const PRESETS: Preset[] = [
  {
    name: "Vintage",
    layers: [
      { type: "sepia", value: 50 },
      { type: "saturate", value: 140 },
      { type: "contrast", value: 110 },
      { type: "brightness", value: 95 },
    ],
  },
  {
    name: "Cool",
    layers: [
      { type: "hue-rotate", value: 180 },
      { type: "saturate", value: 120 },
      { type: "brightness", value: 105 },
    ],
  },
  {
    name: "Warm",
    layers: [
      { type: "sepia", value: 20 },
      { type: "saturate", value: 130 },
      { type: "brightness", value: 105 },
      { type: "hue-rotate", value: -10 },
    ],
  },
  {
    name: "B&W",
    layers: [
      { type: "grayscale", value: 100 },
      { type: "contrast", value: 110 },
    ],
  },
  {
    name: "Dramatic",
    layers: [
      { type: "contrast", value: 140 },
      { type: "saturate", value: 130 },
      { type: "brightness", value: 95 },
    ],
  },
  {
    name: "Dreamy",
    layers: [
      { type: "blur", value: 1 },
      { type: "brightness", value: 110 },
      { type: "saturate", value: 120 },
      { type: "contrast", value: 95 },
    ],
  },
  {
    name: "Inverted",
    layers: [
      { type: "invert", value: 100 },
      { type: "hue-rotate", value: 180 },
    ],
  },
];

// ============================================================
// Helpers
// ============================================================

let layerIdCounter = 0;
function nextLayerId(): string {
  layerIdCounter += 1;
  return `fsp-${layerIdCounter}`;
}

function makeLayer(
  type: FilterType,
  partial?: Partial<FilterLayer>,
): FilterLayer {
  const spec = FILTER_SPECS[type];
  return {
    id: nextLayerId(),
    type,
    enabled: true,
    value: partial?.value ?? spec.default,
    dx: partial?.dx ?? 0,
    dy: partial?.dy ?? 4,
    dBlur: partial?.dBlur ?? 8,
    color: partial?.color ?? DEFAULT_DS_COLOR,
  };
}

function layersFromPreset(preset: Preset): FilterLayer[] {
  return preset.layers.map((l) => makeLayer(l.type, l));
}

/** Render a single enabled layer as its CSS filter function. */
function layerToCss(layer: FilterLayer): string {
  if (layer.type === "drop-shadow") {
    return `drop-shadow(${layer.dx}px ${layer.dy}px ${layer.dBlur}px ${layer.color})`;
  }
  const spec = FILTER_SPECS[layer.type];
  const v = Number.isInteger(layer.value)
    ? layer.value
    : Number(layer.value.toFixed(2));
  return `${layer.type}(${v}${spec.unit})`;
}

/** Compose all enabled layers into a `filter:` value string. */
function buildFilterValue(layers: FilterLayer[]): string {
  const enabled = layers.filter((l) => l.enabled);
  if (enabled.length === 0) return "none";
  return enabled.map(layerToCss).join(" ");
}

/** Map a single layer to its SVG filter primitive element string. */
function layerToSvgPrimitive(layer: FilterLayer): string {
  switch (layer.type) {
    case "blur":
      return `<feGaussianBlur stdDeviation="${layer.value}" />`;
    case "brightness": {
      const slope = (layer.value / 100).toFixed(3);
      return (
        `<feComponentTransfer>` +
        `<feFuncR type="linear" slope="${slope}"/>` +
        `<feFuncG type="linear" slope="${slope}"/>` +
        `<feFuncB type="linear" slope="${slope}"/>` +
        `</feComponentTransfer>`
      );
    }
    case "contrast": {
      const slope = layer.value / 100;
      const intercept = 0.5 - 0.5 * slope;
      const s = slope.toFixed(3);
      const i = intercept.toFixed(3);
      return (
        `<feComponentTransfer>` +
        `<feFuncR type="linear" slope="${s}" intercept="${i}"/>` +
        `<feFuncG type="linear" slope="${s}" intercept="${i}"/>` +
        `<feFuncB type="linear" slope="${s}" intercept="${i}"/>` +
        `</feComponentTransfer>`
      );
    }
    case "drop-shadow":
      return `<feDropShadow dx="${layer.dx}" dy="${layer.dy}" stdDeviation="${layer.dBlur}" flood-color="${layer.color}" />`;
    case "grayscale": {
      const v = (1 - layer.value / 100).toFixed(3);
      return `<feColorMatrix type="saturate" values="${v}" />`;
    }
    case "hue-rotate":
      return `<feColorMatrix type="hueRotate" values="${layer.value}" />`;
    case "invert": {
      const amt = layer.value / 100;
      const a = (1 - amt).toFixed(3);
      const b = amt.toFixed(3);
      return (
        `<feComponentTransfer>` +
        `<feFuncR type="table" tableValues="${b} ${a}"/>` +
        `<feFuncG type="table" tableValues="${b} ${a}"/>` +
        `<feFuncB type="table" tableValues="${b} ${a}"/>` +
        `</feComponentTransfer>`
      );
    }
    case "opacity": {
      const slope = (layer.value / 100).toFixed(3);
      return (
        `<feComponentTransfer>` +
        `<feFuncA type="linear" slope="${slope}"/>` +
        `</feComponentTransfer>`
      );
    }
    case "saturate": {
      const v = (layer.value / 100).toFixed(3);
      return `<feColorMatrix type="saturate" values="${v}" />`;
    }
    case "sepia": {
      const amt = layer.value / 100;
      const i = 1 - amt;
      const m = [
        (0.393 + 0.607 * i).toFixed(3),
        (0.769 - 0.769 * i).toFixed(3),
        (0.189 - 0.189 * i).toFixed(3),
        "0",
        "0",
        (0.349 - 0.349 * i).toFixed(3),
        (0.686 + 0.314 * i).toFixed(3),
        (0.168 - 0.168 * i).toFixed(3),
        "0",
        "0",
        (0.272 - 0.272 * i).toFixed(3),
        (0.534 - 0.534 * i).toFixed(3),
        (0.131 + 0.869 * i).toFixed(3),
        "0",
        "0",
        "0",
        "0",
        "0",
        "1",
        "0",
      ];
      return `<feColorMatrix type="matrix" values="${m.join(" ")}" />`;
    }
    default:
      return "";
  }
}

function buildSvgFilter(layers: FilterLayer[]): string {
  const enabled = layers.filter((l) => l.enabled);
  if (enabled.length === 0) {
    return (
      `<svg width="0" height="0" style="position:absolute">\n` +
      `  <filter id="filter-studio-pro" />\n` +
      `</svg>`
    );
  }
  const primitives = enabled
    .map((l) => `    ${layerToSvgPrimitive(l)}`)
    .join("\n");
  return (
    `<svg width="0" height="0" style="position:absolute">\n` +
    `  <filter id="filter-studio-pro" color-interpolation-filters="sRGB">\n` +
    `${primitives}\n` +
    `  </filter>\n</svg>`
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * `<input type="color">` only accepts `#rrggbb`. We coerce rgba/hsl/named
 * colors to a hex approximation via a 1×1 canvas so the picker stays usable;
 * if that fails we fall back to black.
 */
function normalizeColorForInput(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (typeof document !== "undefined") {
    try {
      const ctx = document.createElement("canvas").getContext("2d");
      if (ctx) {
        ctx.fillStyle = color;
        const computed = ctx.fillStyle;
        if (/^#[0-9a-fA-F]{6}$/.test(computed)) return computed;
      }
    } catch {
      /* ignore */
    }
  }
  return "#000000";
}

// ============================================================
// Preview content (the actual rendered surface)
// ============================================================

interface PreviewContentProps {
  surface: PreviewSurface;
  /** Optional style merged onto the surface element (e.g. filter / gradient). */
  style?: CSSProperties;
}

function PreviewContent({ surface, style }: PreviewContentProps) {
  if (surface === "image") {
    return (
      <img
        src="/images/roy-photo.jpg"
        alt="Filter preview"
        draggable={false}
        style={style}
        className="h-full w-full object-cover"
      />
    );
  }
  if (surface === "box") {
    return (
      <div style={style} className="h-full w-full" aria-hidden />
    );
  }
  return (
    <div
      style={style}
      className="flex h-full w-full items-center justify-center bg-card"
    >
      <span className="text-5xl font-black tracking-tight text-foreground">
        RoyCSS
      </span>
    </div>
  );
}

// ============================================================
// Preview area (with optional before/after divider)
// ============================================================

interface PreviewAreaProps {
  surface: PreviewSurface;
  filteredStyle: CSSProperties | undefined;
  boxStyle: CSSProperties;
  compare: boolean;
  comparePos: number;
  onDividerPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onDividerPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onDividerPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
}

const PreviewArea = forwardRef<HTMLDivElement, PreviewAreaProps>(
  function PreviewArea(
    {
      surface,
      filteredStyle,
      boxStyle,
      compare,
      comparePos,
      onDividerPointerDown,
      onDividerPointerMove,
      onDividerPointerUp,
    },
    ref,
  ) {
    // Base layer = original (no filter). For the "box" surface we still want
    // the gradient visible, so we always pass boxStyle there.
    const baseStyle: CSSProperties | undefined =
      surface === "box" ? boxStyle : undefined;
    // Filtered layer = original style + filter. For "box" we merge boxStyle.
    const filteredMerged: CSSProperties | undefined =
      surface === "box"
        ? { ...boxStyle, ...filteredStyle }
        : filteredStyle;

    return (
      <div
        ref={ref}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted"
      >
        {/* Base layer: unfiltered source */}
        <div className="absolute inset-0">
          <PreviewContent surface={surface} style={baseStyle} />
        </div>

        {/* Filtered overlay: clipped to left of divider when comparing,
            full-bleed when not comparing. */}
        <div
          className="absolute inset-0"
          style={
            compare
              ? { clipPath: `inset(0 ${100 - comparePos}% 0 0)` }
              : undefined
          }
          aria-hidden={compare ? true : undefined}
        >
          <PreviewContent surface={surface} style={filteredMerged} />
        </div>

        {compare && (
          <>
            <div
              className="absolute inset-y-0 z-10 w-1 cursor-ew-resize bg-primary"
              style={{ left: `calc(${comparePos}% - 2px)` }}
              onPointerDown={onDividerPointerDown}
              onPointerMove={onDividerPointerMove}
              onPointerUp={onDividerPointerUp}
              onPointerCancel={onDividerPointerUp}
              role="separator"
              aria-valuenow={Math.round(comparePos)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Before/after divider"
              tabIndex={0}
            >
              <div className="absolute left-1/2 top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                <ArrowUp className="size-3 rotate-90 text-foreground" />
                <ArrowDown className="size-3 -rotate-90 text-foreground" />
              </div>
            </div>
            <span className="pointer-events-none absolute left-2 top-2 z-10 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
              After
            </span>
            <span className="pointer-events-none absolute right-2 top-2 z-10 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
              Before
            </span>
          </>
        )}
      </div>
    );
  },
);

// ============================================================
// Add-layer menu
// ============================================================

interface AddLayerMenuProps {
  onAdd: (type: FilterType) => void;
}

function AddLayerMenu({ onAdd }: AddLayerMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 text-xs"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Plus className="size-3" />
        Add filter
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-30 mt-1 max-h-64 w-44 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
            {FILTER_TYPE_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onAdd(t);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent"
              >
                {FILTER_SPECS[t].label}
                <Plus className="size-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Layer row
// ============================================================

interface LayerRowProps {
  layer: FilterLayer;
  index: number;
  total: number;
  onToggle: () => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onValueChange: (v: number) => void;
  onDsFieldChange: (
    field: "dx" | "dy" | "dBlur" | "color",
    v: number | string,
  ) => void;
}

function LayerRow({
  layer,
  index,
  total,
  onToggle,
  onRemove,
  onMove,
  onValueChange,
  onDsFieldChange,
}: LayerRowProps) {
  const spec = FILTER_SPECS[layer.type];
  const isDropShadow = layer.type === "drop-shadow";

  return (
    <li
      className={cn(
        "rounded-md border border-border bg-card p-3 transition-opacity",
        !layer.enabled && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={layer.enabled}
            onCheckedChange={onToggle}
            aria-label={`Toggle ${spec.label}`}
          />
          <span className="text-xs font-semibold text-foreground">
            {index + 1}. {spec.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move up"
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move down"
          >
            <ArrowDown className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label={`Remove ${spec.label}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {isDropShadow ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <DsField
            label="Offset X"
            value={layer.dx}
            min={-30}
            max={30}
            step={1}
            unit="px"
            onChange={(v) => onDsFieldChange("dx", v)}
          />
          <DsField
            label="Offset Y"
            value={layer.dy}
            min={-30}
            max={30}
            step={1}
            unit="px"
            onChange={(v) => onDsFieldChange("dy", v)}
          />
          <DsField
            label="Blur"
            value={layer.dBlur}
            min={0}
            max={40}
            step={0.5}
            unit="px"
            onChange={(v) => onDsFieldChange("dBlur", v)}
          />
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">Color</Label>
            <Input
              type="color"
              value={normalizeColorForInput(layer.color)}
              onChange={(e) => onDsFieldChange("color", e.target.value)}
              className="h-8 w-full cursor-pointer p-1"
            />
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <Slider
            value={[layer.value]}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            onValueChange={(v) => onValueChange(v[0])}
            className="flex-1"
            aria-label={spec.label}
          />
          <Input
            type="number"
            value={layer.value}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onValueChange(clamp(n, spec.min, spec.max));
            }}
            className="h-8 w-16 text-xs"
          />
          <span className="w-8 text-[11px] text-muted-foreground">
            {spec.unit}
          </span>
        </div>
      )}
    </li>
  );
}

interface DsFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}

function DsField({ label, value, min, max, step, unit, onChange }: DsFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[11px] text-muted-foreground">
        {label} ({unit})
      </Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(clamp(n, min, max));
        }}
        className="h-8 text-xs"
      />
    </div>
  );
}

// ============================================================
// Component
// ============================================================

export function FilterStudioPro() {
  // Start with the Vintage preset so the user sees a live composite on mount.
  const [layers, setLayers] = useState<FilterLayer[]>(() =>
    layersFromPreset(PRESETS[0]),
  );
  const [surface, setSurface] = useState<PreviewSurface>("image");
  const [compare, setCompare] = useState(false);
  const [comparePos, setComparePos] = useState(50);
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [activePreset, setActivePreset] = useState<string>(PRESETS[0].name);

  const compareRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  /* ── Derived: composite filter value & code strings ───────────────── */
  const filterValue = useMemo(() => buildFilterValue(layers), [layers]);

  const generatedCss = useMemo(
    () => `.filtered {\n  filter: ${filterValue};\n}`,
    [filterValue],
  );

  const svgFilter = useMemo(() => buildSvgFilter(layers), [layers]);

  const filteredStyle = useMemo<CSSProperties | undefined>(
    () => (filterValue === "none" ? undefined : { filter: filterValue }),
    [filterValue],
  );

  const boxStyle = useMemo<CSSProperties>(
    () => ({
      backgroundImage:
        "linear-gradient(135deg, hsl(14 90% 60%), hsl(45 95% 58%) 35%, hsl(160 70% 45%) 70%, hsl(280 65% 60%))",
    }),
    [],
  );

  /* ── Comparison divider drag handlers ──────────────────────────────── */
  const updateCompareFromClientX = useCallback((clientX: number) => {
    const el = compareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setComparePos(clamp(pct, 0, 100));
  }, []);

  const onDividerPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!compare) return;
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateCompareFromClientX(e.clientX);
    },
    [compare, updateCompareFromClientX],
  );

  const onDividerPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updateCompareFromClientX(e.clientX);
    },
    [updateCompareFromClientX],
  );

  const onDividerPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      draggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* pointerId may already be released */
      }
    },
    [],
  );

  /* ── Cleanup drag flag on unmount ─────────────────────────────────── */
  useEffect(() => {
    return () => {
      draggingRef.current = false;
    };
  }, []);

  /* ── Copy handler ─────────────────────────────────────────────────── */
  const copyText = useCallback(
    async (text: string, which: "css" | "svg") => {
      try {
        await navigator.clipboard.writeText(text);
        if (which === "css") {
          setCopiedCss(true);
          window.setTimeout(() => setCopiedCss(false), 2000);
        } else {
          setCopiedSvg(true);
          window.setTimeout(() => setCopiedSvg(false), 2000);
        }
      } catch {
        /* clipboard unavailable */
      }
    },
    [],
  );

  /* ── Layer mutation handlers ──────────────────────────────────────── */
  const addLayer = useCallback((type: FilterType) => {
    setLayers((prev) => [...prev, makeLayer(type)]);
    setActivePreset("");
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setActivePreset("");
  }, []);

  const moveLayer = useCallback((id: string, dir: -1 | 1) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
    setActivePreset("");
  }, []);

  const toggleLayer = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)),
    );
    setActivePreset("");
  }, []);

  const updateLayerValue = useCallback((id: string, value: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, value } : l)),
    );
    setActivePreset("");
  }, []);

  const updateLayerDsField = useCallback(
    (
      id: string,
      field: "dx" | "dy" | "dBlur" | "color",
      value: number | string,
    ) => {
      setLayers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
      );
      setActivePreset("");
    },
    [],
  );

  const applyPreset = useCallback((preset: Preset) => {
    setLayers(layersFromPreset(preset));
    setActivePreset(preset.name);
  }, []);

  const toggleCompare = useCallback(() => {
    setCompare((prev) => {
      const next = !prev;
      if (next) setComparePos(50);
      return next;
    });
  }, []);

  /* ── Memoized preview-area handler bundle so PreviewArea only
       re-renders when its props actually change. ───────────────────── */
  const dividerHandlers = useMemo(
    () => ({
      onDividerPointerDown,
      onDividerPointerMove,
      onDividerPointerUp,
    }),
    [onDividerPointerDown, onDividerPointerMove, onDividerPointerUp],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Filter Studio Pro
          </h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {layers.filter((l) => l.enabled).length} active
        </Badge>
      </div>

      {/* Preview area */}
      <Tabs
        value={surface}
        onValueChange={(v) => setSurface(v as PreviewSurface)}
      >
        <div className="flex items-center justify-between gap-2">
          <TabsList className="w-fit">
            <TabsTrigger value="image" className="gap-1">
              <Eye className="size-3.5" /> Image
            </TabsTrigger>
            <TabsTrigger value="box" className="gap-1">
              <Layers className="size-3.5" /> Box
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-1">
              <span className="text-xs font-bold">Aa</span> Text
            </TabsTrigger>
          </TabsList>
          <Button
            variant={compare ? "default" : "outline"}
            size="sm"
            onClick={toggleCompare}
            className="h-8 gap-1.5 text-xs"
            aria-pressed={compare}
          >
            <Sparkles className="size-3.5" />
            {compare ? "Comparing" : "Before / After"}
          </Button>
        </div>

        {(["image", "box", "text"] as PreviewSurface[]).map((s) => (
          <TabsContent key={s} value={s} className="mt-2">
            {surface === s && (
              <PreviewArea
                ref={compareRef}
                surface={s}
                filteredStyle={filteredStyle}
                boxStyle={boxStyle}
                compare={compare}
                comparePos={comparePos}
                {...dividerHandlers}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <Button
            key={p.name}
            variant={activePreset === p.name ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset(p)}
            className="h-7 gap-1 px-2.5 text-xs"
          >
            <Sparkles className="size-3" />
            {p.name}
          </Button>
        ))}
      </div>

      {/* Layer stack */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Filter chain ({layers.length})
          </Label>
          <AddLayerMenu onAdd={addLayer} />
        </div>

        {layers.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
            No filters yet. Use “Add filter” to stack one.
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {layers.map((layer, idx) => (
              <LayerRow
                key={layer.id}
                layer={layer}
                index={idx}
                total={layers.length}
                onToggle={() => toggleLayer(layer.id)}
                onRemove={() => removeLayer(layer.id)}
                onMove={(dir) => moveLayer(layer.id, dir)}
                onValueChange={(v) => updateLayerValue(layer.id, v)}
                onDsFieldChange={(field, v) =>
                  updateLayerDsField(layer.id, field, v)
                }
              />
            ))}
          </ol>
        )}
      </div>

      {/* Generated CSS */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Generated CSS
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyText(generatedCss, "css")}
            className="h-7 gap-1.5 text-xs"
          >
            {copiedCss ? (
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
        <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
          <code>{generatedCss}</code>
        </pre>
      </div>

      {/* SVG filter export */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            SVG filter export
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyText(svgFilter, "svg")}
            className="h-7 gap-1.5 text-xs"
          >
            {copiedSvg ? (
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
        <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
          <code>{svgFilter}</code>
        </pre>
        <p className="text-[11px] text-muted-foreground">
          Apply with{" "}
          <code className="text-foreground">filter: url(#filter-studio-pro)</code>{" "}
          on any SVG or HTML element.
        </p>
      </div>
    </div>
  );
}
