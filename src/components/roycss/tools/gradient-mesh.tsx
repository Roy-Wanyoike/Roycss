"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Blend,
  Copy,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * GradientMeshGenerator — visual builder for layered radial-gradient
 * "mesh" backgrounds (the pre-Houdini technique used by Stripe, Linear,
 * Vercel, etc.). Each color stop becomes one
 * `radial-gradient(at X% Y%, color 0px, transparent size%)` layer; all
 * layers stack on a base `background-color` and blend via
 * `background-blend-mode`.
 *
 * Features:
 *  - Large live preview (≥300×200) that reflects every control in real
 *    time, including blend mode.
 *  - 3–8 color stops. Each stop: color (picker + hex/named/oklch text),
 *    X (0–100%), Y (0–100%), size/radius (10–80%).
 *  - Interactive positioning: click + drag on the preview to move the
 *    nearest stop; drag a colored dot directly to move that stop. Each
 *    dot is colored by its stop color so it reads against any background.
 *  - Background color picker (base color behind all layers).
 *  - Blend mode select: normal, multiply, screen, overlay, lighten,
 *    darken, color-dodge, color-burn. Default: screen.
 *  - 8 presets: Aurora, Sunset, Ocean, Neon, Pastel, Monochrome, Fire,
 *    Galaxy.
 *  - Randomize: regenerates colors + positions + sizes for all stops.
 *  - Generated CSS with Copy button + 2s Check confirmation.
 *
 * Pointer logic: a single `draggingStopId` ref + pointer-capture on the
 * preview element lets us unify "drag a dot" and "drag the preview to
 * move the nearest stop" through the same move/up handlers. The dot
 * handler calls `stopPropagation` so the preview's `onPointerDown`
 * (which would re-pick the nearest stop) never fires when a dot is
 * grabbed directly.
 */

// ============================================================
// Types
// ============================================================

type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "lighten"
  | "darken"
  | "color-dodge"
  | "color-burn";

interface MeshStop {
  id: string;
  color: string;
  /** Horizontal position, 0–100 (% of preview width). */
  x: number;
  /** Vertical position, 0–100 (% of preview height). */
  y: number;
  /** Radius/softness of the radial gradient, 10–80 (%). */
  size: number;
}

interface MeshConfig {
  bgColor: string;
  blendMode: BlendMode;
  stops: MeshStop[];
}

interface Preset {
  name: string;
  bgColor: string;
  blendMode: BlendMode;
  stops: Array<{ color: string; x: number; y: number; size: number }>;
}

// ============================================================
// Constants
// ============================================================

const BLEND_MODES: readonly BlendMode[] = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "lighten",
  "darken",
  "color-dodge",
  "color-burn",
] as const;

const MIN_STOPS = 3;
const MAX_STOPS = 8;

const PRESETS: Preset[] = [
  {
    name: "Aurora",
    bgColor: "#0a0e1a",
    blendMode: "screen",
    stops: [
      { color: "#10b981", x: 20, y: 30, size: 55 },
      { color: "#06b6d4", x: 70, y: 20, size: 50 },
      { color: "#8b5cf6", x: 50, y: 75, size: 60 },
      { color: "#22d3ee", x: 85, y: 70, size: 45 },
    ],
  },
  {
    name: "Sunset",
    bgColor: "#1a0a0e",
    blendMode: "screen",
    stops: [
      { color: "#f97316", x: 20, y: 25, size: 60 },
      { color: "#ec4899", x: 75, y: 30, size: 55 },
      { color: "#8b5cf6", x: 50, y: 80, size: 65 },
      { color: "#f59e0b", x: 90, y: 75, size: 45 },
    ],
  },
  {
    name: "Ocean",
    bgColor: "#02121f",
    blendMode: "screen",
    stops: [
      { color: "#0ea5e9", x: 25, y: 30, size: 60 },
      { color: "#06b6d4", x: 75, y: 25, size: 55 },
      { color: "#14b8a6", x: 50, y: 80, size: 65 },
      { color: "#38bdf8", x: 90, y: 70, size: 50 },
    ],
  },
  {
    name: "Neon",
    bgColor: "#000000",
    blendMode: "screen",
    stops: [
      { color: "#00ffff", x: 15, y: 30, size: 45 },
      { color: "#ff00ff", x: 80, y: 20, size: 50 },
      { color: "#ffff00", x: 30, y: 80, size: 40 },
      { color: "#00ff00", x: 85, y: 75, size: 45 },
      { color: "#ff0080", x: 50, y: 50, size: 50 },
    ],
  },
  {
    name: "Pastel",
    bgColor: "#fdf2f8",
    blendMode: "multiply",
    stops: [
      { color: "#fbcfe8", x: 20, y: 25, size: 60 },
      { color: "#ddd6fe", x: 75, y: 30, size: 55 },
      { color: "#bae6fd", x: 50, y: 80, size: 65 },
      { color: "#fef3c7", x: 90, y: 70, size: 50 },
    ],
  },
  {
    name: "Monochrome",
    bgColor: "#0a0a0a",
    blendMode: "screen",
    stops: [
      { color: "#737373", x: 20, y: 30, size: 60 },
      { color: "#a3a3a3", x: 75, y: 25, size: 55 },
      { color: "#525252", x: 50, y: 80, size: 65 },
      { color: "#d4d4d4", x: 85, y: 70, size: 45 },
    ],
  },
  {
    name: "Fire",
    bgColor: "#1a0500",
    blendMode: "screen",
    stops: [
      { color: "#dc2626", x: 20, y: 35, size: 60 },
      { color: "#f97316", x: 75, y: 30, size: 55 },
      { color: "#fbbf24", x: 50, y: 75, size: 60 },
      { color: "#b91c1c", x: 85, y: 70, size: 50 },
    ],
  },
  {
    name: "Galaxy",
    bgColor: "#050314",
    blendMode: "screen",
    stops: [
      { color: "#7c3aed", x: 20, y: 30, size: 60 },
      { color: "#c026d3", x: 75, y: 25, size: 55 },
      { color: "#4338ca", x: 50, y: 80, size: 65 },
      { color: "#db2777", x: 90, y: 70, size: 50 },
      { color: "#6d28d9", x: 30, y: 70, size: 45 },
    ],
  },
];

const DEFAULT_CONFIG: MeshConfig = {
  bgColor: PRESETS[0].bgColor,
  blendMode: PRESETS[0].blendMode,
  stops: PRESETS[0].stops.map((s, i) => ({
    id: `mesh-stop-${i + 1}`,
    color: s.color,
    x: s.x,
    y: s.y,
    size: s.size,
  })),
};

// ============================================================
// Helpers
// ============================================================

let stopIdCounter = 100;
function nextStopId(): string {
  stopIdCounter += 1;
  return `mesh-stop-${stopIdCounter}`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Build the comma-joined `background-image` value from stops. */
function buildBackgroundImage(stops: MeshStop[]): string {
  return stops
    .map(
      (s) =>
        `radial-gradient(at ${s.x}% ${s.y}%, ${s.color} 0px, transparent ${s.size}%)`,
    )
    .join(", ");
}

/** Build the full generated CSS block for display / copy. */
function buildMeshCss(cfg: MeshConfig): string {
  const layers = cfg.stops
    .map(
      (s) =>
        `  radial-gradient(at ${s.x}% ${s.y}%, ${s.color} 0px, transparent ${s.size}%)`,
    )
    .join(",\n");
  return [
    ".mesh-bg {",
    `  background-color: ${cfg.bgColor};`,
    `  background-blend-mode: ${cfg.blendMode};`,
    "  background-image:",
    layers + ";",
    "}",
  ].join("\n");
}

/**
 * `<input type="color">` only accepts `#rrggbb`. We coerce other CSS
 * colors (hsl, oklch, named) via a 1×1 canvas so the picker stays
 * usable; falls back to black.
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
      /* ignore — picker will fall back to black */
    }
  }
  return "#000000";
}

/** Generate a random vibrant HSL color. */
function randomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 70 + Math.floor(Math.random() * 30);
  const l = 50 + Math.floor(Math.random() * 20);
  return `hsl(${h} ${s}% ${l}%)`;
}

// ============================================================
// Component
// ============================================================

export function GradientMeshGenerator() {
  const [cfg, setCfg] = useState<MeshConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const draggingStopId = useRef<string | null>(null);

  /* ── Derived: CSS strings + preview style ─────────────────────────── */
  const backgroundImage = useMemo(
    () => buildBackgroundImage(cfg.stops),
    [cfg.stops],
  );

  const generatedCss = useMemo(() => buildMeshCss(cfg), [cfg]);

  const previewStyle = useMemo<CSSProperties>(
    () => ({
      backgroundColor: cfg.bgColor,
      backgroundBlendMode: cfg.blendMode,
      backgroundImage,
    }),
    [backgroundImage, cfg.bgColor, cfg.blendMode],
  );

  /* ── Pointer-driven stop positioning ──────────────────────────────── */
  const updateStopFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = previewRef.current;
      const id = draggingStopId.current;
      if (!el || !id) return;
      const rect = el.getBoundingClientRect();
      const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
      setCfg((prev) => ({
        ...prev,
        stops: prev.stops.map((s) =>
          s.id === id ? { ...s, x: Math.round(x), y: Math.round(y) } : s,
        ),
      }));
    },
    [],
  );

  /**
   * Clicking the empty preview area grabs the nearest stop and starts
   * dragging it. The dot handler stops propagation so this only fires
   * for clicks that miss every dot.
   */
  const onPreviewPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = previewRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;

      let nearestId: string | null = null;
      let nearestDist = Infinity;
      for (const s of cfg.stops) {
        const dx = s.x - px;
        const dy = s.y - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < nearestDist) {
          nearestDist = d;
          nearestId = s.id;
        }
      }
      if (!nearestId) return;

      draggingStopId.current = nearestId;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* pointer capture unavailable — fall back to move-on-hover */
      }

      const x = Math.round(clamp(px, 0, 100));
      const y = Math.round(clamp(py, 0, 100));
      setCfg((prev) => ({
        ...prev,
        stops: prev.stops.map((s) =>
          s.id === nearestId ? { ...s, x, y } : s,
        ),
      }));
    },
    [cfg.stops],
  );

  const onPreviewPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingStopId.current) return;
      updateStopFromPointer(e.clientX, e.clientY);
    },
    [updateStopFromPointer],
  );

  const onPreviewPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      draggingStopId.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [],
  );

  /**
   * Grabbing a dot directly: stop propagation (so the preview's
   * nearest-stop logic doesn't override the choice) and capture the
   * pointer on the preview element so subsequent move/up events route
   * through the same handlers.
   */
  const onDotPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, stopId: string) => {
      e.stopPropagation();
      draggingStopId.current = stopId;
      const el = previewRef.current;
      if (el) {
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      updateStopFromPointer(e.clientX, e.clientY);
    },
    [updateStopFromPointer],
  );

  /* ── Cleanup drag state on unmount ────────────────────────────────── */
  useEffect(() => {
    return () => {
      draggingStopId.current = null;
    };
  }, []);

  /* ── Copy handler ─────────────────────────────────────────────────── */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [generatedCss]);

  /* ── Config mutations ─────────────────────────────────────────────── */
  const setBgColor = useCallback((bgColor: string) => {
    setCfg((prev) => ({ ...prev, bgColor }));
  }, []);

  const setBlendMode = useCallback((mode: BlendMode) => {
    setCfg((prev) => ({ ...prev, blendMode: mode }));
  }, []);

  const addStop = useCallback(() => {
    setCfg((prev) => {
      if (prev.stops.length >= MAX_STOPS) return prev;
      const newStop: MeshStop = {
        id: nextStopId(),
        color: randomColor(),
        x: Math.round(20 + Math.random() * 60),
        y: Math.round(20 + Math.random() * 60),
        size: 50,
      };
      return { ...prev, stops: [...prev.stops, newStop] };
    });
  }, []);

  const removeStop = useCallback((id: string) => {
    setCfg((prev) => {
      if (prev.stops.length <= MIN_STOPS) return prev;
      return { ...prev, stops: prev.stops.filter((s) => s.id !== id) };
    });
  }, []);

  const setStopColor = useCallback((id: string, color: string) => {
    setCfg((prev) => ({
      ...prev,
      stops: prev.stops.map((s) => (s.id === id ? { ...s, color } : s)),
    }));
  }, []);

  const setStopX = useCallback((id: string, x: number) => {
    setCfg((prev) => ({
      ...prev,
      stops: prev.stops.map((s) =>
        s.id === id ? { ...s, x: clamp(Math.round(x), 0, 100) } : s,
      ),
    }));
  }, []);

  const setStopY = useCallback((id: string, y: number) => {
    setCfg((prev) => ({
      ...prev,
      stops: prev.stops.map((s) =>
        s.id === id ? { ...s, y: clamp(Math.round(y), 0, 100) } : s,
      ),
    }));
  }, []);

  const setStopSize = useCallback((id: string, size: number) => {
    setCfg((prev) => ({
      ...prev,
      stops: prev.stops.map((s) =>
        s.id === id ? { ...s, size: clamp(Math.round(size), 10, 80) } : s,
      ),
    }));
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setCfg({
      bgColor: preset.bgColor,
      blendMode: preset.blendMode,
      stops: preset.stops.map((s) => ({
        id: nextStopId(),
        color: s.color,
        x: s.x,
        y: s.y,
        size: s.size,
      })),
    });
  }, []);

  const randomize = useCallback(() => {
    setCfg((prev) => {
      const count = prev.stops.length;
      const stops: MeshStop[] = Array.from({ length: count }, () => ({
        id: nextStopId(),
        color: randomColor(),
        x: Math.round(Math.random() * 100),
        y: Math.round(Math.random() * 100),
        size: Math.round(30 + Math.random() * 40),
      }));
      return { ...prev, stops };
    });
  }, []);

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Blend className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Gradient Mesh Generator
          </h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {cfg.stops.length} stops · {cfg.blendMode}
        </Badge>
      </div>

      {/* Live preview */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Live preview — drag a dot, or click empty space to grab the
          nearest stop
        </Label>
        <div
          ref={previewRef}
          onPointerDown={onPreviewPointerDown}
          onPointerMove={onPreviewPointerMove}
          onPointerUp={onPreviewPointerUp}
          onPointerCancel={onPreviewPointerUp}
          className="relative min-h-[200px] w-full touch-none cursor-crosshair overflow-hidden rounded-lg border border-border shadow-sm"
          style={previewStyle}
          role="img"
          aria-label="Mesh gradient preview"
        >
          {cfg.stops.map((s) => (
            <div
              key={s.id}
              onPointerDown={(e) => onDotPointerDown(e, s.id)}
              className="absolute size-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 active:cursor-grabbing active:scale-125"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                backgroundColor: s.color,
              }}
              role="slider"
              aria-valuenow={s.x}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Stop at ${s.x}% ${s.y}%, color ${s.color}`}
              tabIndex={0}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 1;
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  setStopX(s.id, s.x - step);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  setStopX(s.id, s.x + step);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setStopY(s.id, s.y - step);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setStopY(s.id, s.y + step);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Background color + blend mode + randomize */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="mesh-bg-color"
            className="text-xs text-muted-foreground"
          >
            Background
          </Label>
          <Input
            id="mesh-bg-color"
            type="color"
            value={normalizeColorForInput(cfg.bgColor)}
            onChange={(e) => setBgColor(e.target.value)}
            className="size-7 shrink-0 cursor-pointer p-0.5"
            aria-label="Background color"
          />
          <Input
            type="text"
            value={cfg.bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-7 w-24 text-xs"
            aria-label="Background color value"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Blend</Label>
          <Select
            value={cfg.blendMode}
            onValueChange={(v) => setBlendMode(v as BlendMode)}
          >
            <SelectTrigger size="sm" className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLEND_MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={randomize}
          className="h-7 gap-1.5 text-xs"
        >
          <Shuffle className="size-3" /> Randomize
        </Button>
      </div>

      {/* Color stops */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Color stops ({cfg.stops.length}/{MAX_STOPS})
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={addStop}
            disabled={cfg.stops.length >= MAX_STOPS}
            className="h-7 gap-1.5 text-xs"
          >
            <Plus className="size-3" /> Add stop
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          {cfg.stops.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-1.5"
            >
              <Input
                type="color"
                value={normalizeColorForInput(s.color)}
                onChange={(e) => setStopColor(s.id, e.target.value)}
                className="size-7 shrink-0 cursor-pointer p-0.5"
                aria-label={`Color picker for stop ${s.id}`}
              />
              <Input
                type="text"
                value={s.color}
                onChange={(e) => setStopColor(s.id, e.target.value)}
                className="h-7 w-28 text-xs"
                aria-label="Color value"
              />
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">X</span>
                <Input
                  type="number"
                  value={s.x}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isNaN(n)) setStopX(s.id, n);
                  }}
                  className="h-7 w-14 text-xs"
                  aria-label="X position percentage"
                />
                <span className="text-[11px] text-muted-foreground">%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Y</span>
                <Input
                  type="number"
                  value={s.y}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isNaN(n)) setStopY(s.id, n);
                  }}
                  className="h-7 w-14 text-xs"
                  aria-label="Y position percentage"
                />
                <span className="text-[11px] text-muted-foreground">%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">size</span>
                <Slider
                  value={[s.size]}
                  min={10}
                  max={80}
                  step={1}
                  onValueChange={(v) => setStopSize(s.id, v[0] ?? s.size)}
                  className="w-20"
                  aria-label="Stop radius percentage"
                />
                <span className="w-8 text-[11px] tabular-nums text-muted-foreground">
                  {s.size}%
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-6 text-destructive hover:text-destructive"
                onClick={() => removeStop(s.id)}
                disabled={cfg.stops.length <= MIN_STOPS}
                aria-label="Remove stop"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <Button
            key={p.name}
            variant="outline"
            size="sm"
            onClick={() => applyPreset(p)}
            className="h-7 gap-1 px-2.5 text-xs"
          >
            <Sparkles className="size-3" />
            {p.name}
          </Button>
        ))}
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
            onClick={handleCopy}
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
        <pre className="max-h-56 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
          <code>{generatedCss}</code>
        </pre>
      </div>
    </div>
  );
}
