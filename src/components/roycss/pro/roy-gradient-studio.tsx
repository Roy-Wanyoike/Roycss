"use client";

/**
 * RoyGradientStudio — an advanced multi-mode gradient generator.
 *
 * Self-contained (no props). Four gradient modes (tabs):
 *   • Linear  — angle + color stops
 *   • Radial  — position + shape + color stops
 *   • Conic   — position + angle + color stops
 *   • Mesh    — 3–5 radial blobs overlaid with blend modes
 *
 * Cross-cutting toggles:
 *   • Noise overlay (SVG turbulence data URL, adjustable opacity)
 *   • Animated background-position (CSS keyframes, scoped to the preview)
 *   • Aurora layers (2 extra semi-transparent, drifting radial layers)
 *
 * Presets: Aurora, Sunset, Ocean, Neon, Pastel, Fire (6 total).
 * Export dialog emits the full `background` CSS rule + any required
 * `@keyframes` block, with a Copy button. Clipboard write uses the async
 * API with a legacy fallback. SSR-safe — no `window`/`document` access at
 * module load or render time.
 *
 * TS strict, zero `any`. No indigo / blue.
 */

import * as React from "react";
import {
  Check,
  Copy,
  Download,
  Plus,
  Shuffle,
  Sparkles,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type GradientType = "linear" | "radial" | "conic" | "mesh";
type RadialShape = "circle" | "ellipse";
type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "soft-light"
  | "hard-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

interface ColorStop {
  id: string;
  color: string;
  /** 0–100 — percent along the gradient axis. */
  position: number;
}

interface MeshPoint {
  id: string;
  color: string;
  /** 0–100 — center x in %. */
  x: number;
  /** 0–100 — center y in %. */
  y: number;
  /** 0–100 — radial extent in %. */
  size: number;
  /** 0–100 — opacity of the layer. */
  opacity: number;
  blend: BlendMode;
}

interface StudioState {
  type: GradientType;
  linearAngle: number;
  radialShape: RadialShape;
  radialX: number;
  radialY: number;
  conicAngle: number;
  conicX: number;
  conicY: number;
  stops: ColorStop[];
  meshPoints: MeshPoint[];
  noise: boolean;
  noiseOpacity: number;
  animated: boolean;
  aurora: boolean;
}

interface PresetSpec {
  id: string;
  name: string;
  description: string;
  state: StudioState;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}

const BLEND_OPTIONS: readonly BlendMode[] = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "soft-light",
  "hard-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
] as const;

const SHAPE_OPTIONS: readonly RadialShape[] = ["circle", "ellipse"] as const;

const TYPE_LABELS: Record<GradientType, string> = {
  linear: "Linear",
  radial: "Radial",
  conic: "Conic",
  mesh: "Mesh",
};

// ─── Presets (no indigo / blue — emerald, teal, cyan, amber, rose, violet) ──

function makeStop(color: string, position: number): ColorStop {
  return { id: uid("stop"), color, position };
}

function makeMesh(
  color: string,
  x: number,
  y: number,
  size: number,
  opacity: number,
  blend: BlendMode = "screen",
): MeshPoint {
  return { id: uid("mesh"), color, x, y, size, opacity, blend };
}

const PRESETS: readonly PresetSpec[] = [
  {
    id: "aurora",
    name: "Aurora",
    description: "Drifting cyan + emerald + violet mesh with aurora layers.",
    state: {
      type: "mesh",
      linearAngle: 135,
      radialShape: "ellipse",
      radialX: 50,
      radialY: 50,
      conicAngle: 0,
      conicX: 50,
      conicY: 50,
      stops: [
        makeStop("#10b981", 0),
        makeStop("#06b6d4", 100),
      ],
      meshPoints: [
        makeMesh("#06b6d4", 20, 30, 60, 70, "screen"),
        makeMesh("#10b981", 70, 40, 70, 70, "screen"),
        makeMesh("#8b5cf6", 40, 75, 65, 55, "screen"),
        makeMesh("#22d3ee", 85, 80, 55, 60, "screen"),
      ],
      noise: true,
      noiseOpacity: 0.08,
      animated: true,
      aurora: true,
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm amber → rose linear with soft noise.",
    state: {
      type: "linear",
      linearAngle: 135,
      radialShape: "ellipse",
      radialX: 50,
      radialY: 50,
      conicAngle: 0,
      conicX: 50,
      conicY: 50,
      stops: [
        makeStop("#f59e0b", 0),
        makeStop("#ef4444", 50),
        makeStop("#ec4899", 100),
      ],
      meshPoints: [],
      noise: true,
      noiseOpacity: 0.06,
      animated: false,
      aurora: false,
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Calm teal → cyan → emerald linear.",
    state: {
      type: "linear",
      linearAngle: 180,
      radialShape: "ellipse",
      radialX: 50,
      radialY: 50,
      conicAngle: 0,
      conicX: 50,
      conicY: 50,
      stops: [
        makeStop("#0d9488", 0),
        makeStackSafe("#06b6d4", 50),
        makeStackSafe("#10b981", 100),
      ],
      meshPoints: [],
      noise: false,
      noiseOpacity: 0.05,
      animated: true,
      aurora: false,
    },
  },
  {
    id: "neon",
    name: "Neon",
    description: "Hot pink → cyan → violet conic.",
    state: {
      type: "conic",
      linearAngle: 135,
      radialShape: "ellipse",
      radialX: 50,
      radialY: 50,
      conicAngle: 0,
      conicX: 50,
      conicY: 50,
      stops: [
        makeStop("#ec4899", 0),
        makeStop("#22d3ee", 33),
        makeStop("#8b5cf6", 66),
        makeStop("#ec4899", 100),
      ],
      meshPoints: [],
      noise: false,
      noiseOpacity: 0.05,
      animated: true,
      aurora: false,
    },
  },
  {
    id: "pastel",
    name: "Pastel",
    description: "Soft pink → amber → mint linear.",
    state: {
      type: "linear",
      linearAngle: 90,
      radialShape: "ellipse",
      radialX: 50,
      radialY: 50,
      conicAngle: 0,
      conicX: 50,
      conicY: 50,
      stops: [
        makeStop("#fbcfe8", 0),
        makeStop("#fde68a", 50),
        makeStop("#a7f3d0", 100),
      ],
      meshPoints: [],
      noise: true,
      noiseOpacity: 0.04,
      animated: false,
      aurora: false,
    },
  },
  {
    id: "fire",
    name: "Fire",
    description: "Yellow → orange → red radial burn.",
    state: {
      type: "radial",
      linearAngle: 135,
      radialShape: "circle",
      radialX: 50,
      radialY: 80,
      conicAngle: 0,
      conicX: 50,
      conicY: 50,
      stops: [
        makeStop("#fde047", 0),
        makeStop("#fb923c", 45),
        makeStop("#dc2626", 100),
      ],
      meshPoints: [],
      noise: true,
      noiseOpacity: 0.07,
      animated: false,
      aurora: false,
    },
  },
] as const;

// Helper alias for the ocean preset (since `makeStop` returns ColorStop
// directly — keeping the call sites symmetric for readability).
function makeStackSafe(color: string, position: number): ColorStop {
  return makeStop(color, position);
}

const DEFAULT_STATE: StudioState = {
  type: "linear",
  linearAngle: 135,
  radialShape: "ellipse",
  radialX: 50,
  radialY: 50,
  conicAngle: 0,
  conicX: 50,
  conicY: 50,
  stops: [
    makeStop("#10b981", 0),
    makeStop("#06b6d4", 50),
    makeStop("#8b5cf6", 100),
  ],
  meshPoints: [
    makeMesh("#22d3ee", 30, 30, 60, 70),
    makeMesh("#10b981", 70, 50, 65, 65),
    makeMesh("#8b5cf6", 40, 75, 55, 60),
  ],
  noise: false,
  noiseOpacity: 0.05,
  animated: false,
  aurora: false,
};

// ═══════════════════════════════════════════════════════════════════════
// Helpers — CSS string builders
// ═══════════════════════════════════════════════════════════════════════

function stopsToCss(stops: readonly ColorStop[]): string {
  if (stops.length === 0) return "transparent";
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  return sorted
    .map((s) => `${s.color} ${s.position.toFixed(1)}%`)
    .join(", ");
}

function buildGradientCss(state: StudioState): string {
  if (state.type === "linear") {
    return `linear-gradient(${state.linearAngle}deg, ${stopsToCss(state.stops)})`;
  }
  if (state.type === "radial") {
    return `radial-gradient(${state.radialShape} at ${state.radialX}% ${state.radialY}%, ${stopsToCss(state.stops)})`;
  }
  if (state.type === "conic") {
    return `conic-gradient(from ${state.conicAngle}deg at ${state.conicX}% ${state.conicY}%, ${stopsToCss(state.stops)})`;
  }
  // Mesh — overlay multiple radial gradients.
  const layers = state.meshPoints
    .map(
      (m) =>
        `radial-gradient(circle at ${m.x}% ${m.y}%, ${m.color} 0%, transparent ${m.size}%)`,
    )
    .join(", ");
  return layers || "linear-gradient(#0f172a, #0f172a)";
}

function buildBackgroundCss(state: StudioState): string {
  const gradient = buildGradientCss(state);
  const layers: string[] = [];

  if (state.aurora) {
    // Aurora — three semi-transparent drifting layers behind the main
    // gradient. We emit them BEFORE the main gradient so the main
    // gradient sits on top with normal blend (CSS lists first = bottom).
    layers.push(
      "radial-gradient(circle at 20% 30%, rgba(34, 211, 238, 0.35), transparent 45%)",
      "radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.35), transparent 50%)",
      "radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.30), transparent 55%)",
    );
  }
  layers.push(gradient);

  return layers.join(", ");
}

function buildExportBlock(state: StudioState): string {
  const bg = buildBackgroundCss(state);
  const lines: string[] = [];

  lines.push(".roy-gradient-target {");
  if (state.animated) {
    lines.push("  background: " + bg + ";");
    lines.push("  background-size: 200% 200%;");
    lines.push("  animation: roy-gradient-shift 8s ease-in-out infinite;");
  } else {
    lines.push("  background: " + bg + ";");
  }
  if (state.noise) {
    lines.push("  position: relative;");
  }
  lines.push("}");

  if (state.noise) {
    lines.push("");
    lines.push(".roy-gradient-target::after {");
    lines.push("  content: \"\";");
    lines.push("  position: absolute;");
    lines.push("  inset: 0;");
    lines.push(
      `  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");`,
    );
    lines.push(`  opacity: ${state.noiseOpacity.toFixed(2)};`);
    lines.push("  mix-blend-mode: overlay;");
    lines.push("  pointer-events: none;");
    lines.push("}");
  }

  if (state.animated) {
    lines.push("");
    lines.push("@keyframes roy-gradient-shift {");
    lines.push("  0%   { background-position: 0% 50%; }");
    lines.push("  50%  { background-position: 100% 50%; }");
    lines.push("  100% { background-position: 0% 50%; }");
    lines.push("}");
  }

  return lines.join("\n");
}

const NOISE_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    if (typeof document === "undefined") return false;
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface ColorStopsEditorProps {
  stops: ColorStop[];
  onChange: (stops: ColorStop[]) => void;
}

function ColorStopsEditor({
  stops,
  onChange,
}: ColorStopsEditorProps): React.JSX.Element {
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const draggingIdRef = React.useRef<string | null>(null);

  const pointerToPos = React.useCallback((clientX: number): number => {
    const rail = railRef.current;
    if (!rail) return 0;
    const rect = rail.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
      event.preventDefault();
      event.stopPropagation();
      draggingIdRef.current = id;
      (event.currentTarget as HTMLButtonElement).setPointerCapture(
        event.pointerId,
      );
    },
    [],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const id = draggingIdRef.current;
      if (id === null) return;
      const pos = pointerToPos(event.clientX);
      onChange(stops.map((s) => (s.id === id ? { ...s, position: pos } : s)));
    },
    [stops, onChange, pointerToPos],
  );

  const endDrag = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      draggingIdRef.current = null;
      try {
        (event.currentTarget as HTMLDivElement).releasePointerCapture(
          event.pointerId,
        );
      } catch {
        // ignore
      }
    },
    [],
  );

  const handleAdd = React.useCallback(() => {
    onChange([...stops, makeStop("#f472b6", 50)]);
  }, [stops, onChange]);

  const handleRemove = React.useCallback(
    (id: string) => {
      if (stops.length <= 2) return;
      onChange(stops.filter((s) => s.id !== id));
    },
    [stops, onChange],
  );

  const handleColorChange = React.useCallback(
    (id: string, color: string) => {
      onChange(stops.map((s) => (s.id === id ? { ...s, color } : s)));
    },
    [stops, onChange],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Color stops</Label>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="size-3" aria-hidden />
          Add stop
        </button>
      </div>

      <div
        ref={railRef}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative h-12 w-full touch-none select-none overflow-hidden rounded-md border border-border"
        style={{
          background: `linear-gradient(90deg, ${stops
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((s) => `${s.color} ${s.position}%`)
            .join(", ")})`,
        }}
        aria-label="Color stops gradient bar"
      >
        {stops.map((s) => (
          <button
            key={s.id}
            type="button"
            onPointerDown={(e) => handlePointerDown(e, s.id)}
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white shadow-md ring-1 ring-black/20 transition-transform hover:scale-110 active:cursor-grabbing"
            style={{
              left: `${s.position}%`,
              backgroundColor: s.color,
            }}
            aria-label={`Stop at ${s.position.toFixed(0)}% — ${s.color}`}
          >
            <span className="sr-only">
              Color stop {s.color} at {s.position.toFixed(0)}%
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {stops.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-2 rounded-md border border-border bg-background p-2"
          >
            <label
              className="relative inline-flex size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border"
              style={{ backgroundColor: s.color }}
            >
              <input
                type="color"
                value={s.color}
                onChange={(e) => handleColorChange(s.id, e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label={`Pick color for stop at ${s.position.toFixed(0)}%`}
              />
            </label>
            <span className="font-mono text-xs text-foreground">{s.color}</span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {s.position.toFixed(0)}%
            </span>
            <button
              type="button"
              onClick={() => handleRemove(s.id)}
              disabled={stops.length <= 2}
              className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950/40"
              aria-label="Remove this color stop"
            >
              <Trash2 className="size-3" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MeshEditorProps {
  points: MeshPoint[];
  onChange: (points: MeshPoint[]) => void;
}

function MeshEditor({
  points,
  onChange,
}: MeshEditorProps): React.JSX.Element {
  const handleAdd = React.useCallback(() => {
    if (points.length >= 5) return;
    onChange([
      ...points,
      makeMesh("#f472b6", 50, 50, 50, 65, "screen"),
    ]);
  }, [points, onChange]);

  const handleRemove = React.useCallback(
    (id: string) => {
      if (points.length <= 1) return;
      onChange(points.filter((p) => p.id !== id));
    },
    [points, onChange],
  );

  const handlePatch = React.useCallback(
    (id: string, patch: Partial<MeshPoint>) => {
      onChange(points.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [points, onChange],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">
          Mesh points ({points.length}/5)
        </Label>
        <button
          type="button"
          onClick={handleAdd}
          disabled={points.length >= 5}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-3" aria-hidden />
          Add point
        </button>
      </div>

      <div className="space-y-2">
        {points.map((p) => (
          <div
            key={p.id}
            className="rounded-md border border-border bg-background p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <label
                className="relative inline-flex size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border"
                style={{ backgroundColor: p.color }}
              >
                <input
                  type="color"
                  value={p.color}
                  onChange={(e) => handlePatch(p.id, { color: e.target.value })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label={`Pick color for mesh point`}
                />
              </label>
              <span className="font-mono text-xs text-foreground">
                {p.color}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(p.id)}
                disabled={points.length <= 1}
                className="ml-auto inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950/40"
                aria-label="Remove this mesh point"
              >
                <Trash2 className="size-3" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              <LabeledRange
                label="X"
                value={p.x}
                min={0}
                max={100}
                step={1}
                onChange={(v) => handlePatch(p.id, { x: v })}
              />
              <LabeledRange
                label="Y"
                value={p.y}
                min={0}
                max={100}
                step={1}
                onChange={(v) => handlePatch(p.id, { y: v })}
              />
              <LabeledRange
                label="Size"
                value={p.size}
                min={10}
                max={100}
                step={1}
                onChange={(v) => handlePatch(p.id, { size: v })}
              />
              <LabeledRange
                label="Opacity"
                value={p.opacity}
                min={0}
                max={100}
                step={1}
                onChange={(v) => handlePatch(p.id, { opacity: v })}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {BLEND_OPTIONS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handlePatch(p.id, { blend: b })}
                  aria-pressed={p.blend === b}
                  className={cn(
                    "inline-flex h-6 items-center rounded border px-1.5 text-[10px] font-medium transition-colors",
                    p.blend === b
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LabeledRangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function LabeledRange({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: LabeledRangeProps): React.JSX.Element {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-[10px] text-foreground">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? value)}
        aria-label={label}
      />
    </div>
  );
}

interface LivePreviewProps {
  state: StudioState;
}

function LivePreview({ state }: LivePreviewProps): React.JSX.Element {
  const bg = buildBackgroundCss(state);
  return (
    <div
      className="relative h-64 w-full overflow-hidden rounded-xl border border-border shadow-inner sm:h-80"
      style={{
        background: bg,
        backgroundSize: state.animated ? "200% 200%" : undefined,
        animation: state.animated
          ? "roy-gradient-studio-shift 8s ease-in-out infinite"
          : undefined,
      }}
      aria-label="Gradient preview"
      role="img"
    >
      {state.noise ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{
            backgroundImage: `url("${NOISE_DATA_URL}")`,
            opacity: state.noiseOpacity,
          }}
        />
      ) : null}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════

export function RoyGradientStudio(): React.JSX.Element {
  const [state, setState] = React.useState<StudioState>(() => ({
    ...DEFAULT_STATE,
    stops: DEFAULT_STATE.stops.map((s) => ({ ...s })),
    meshPoints: DEFAULT_STATE.meshPoints.map((m) => ({ ...m })),
  }));
  const [exportOpen, setExportOpen] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Inject the animation keyframes once for the live preview.
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "roy-gradient-studio-keyframes";
    const existing = document.getElementById(styleId);
    if (existing) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `@keyframes roy-gradient-studio-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`;
    document.head.appendChild(style);
  }, []);

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const patchState = React.useCallback(
    (patch: Partial<StudioState>) => {
      setState((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const handleApplyPreset = React.useCallback((preset: PresetSpec) => {
    setState({
      ...preset.state,
      stops: preset.state.stops.map((s) => ({ ...s, id: uid("stop") })),
      meshPoints: preset.state.meshPoints.map((m) => ({
        ...m,
        id: uid("mesh"),
      })),
    });
  }, []);

  const handleRandomize = React.useCallback(() => {
    const palette = [
      "#10b981",
      "#06b6d4",
      "#22d3ee",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#8b5cf6",
      "#84cc16",
      "#f97316",
      "#14b8a6",
    ];
    const pick = () => palette[Math.floor(Math.random() * palette.length)];
    const stopCount = 2 + Math.floor(Math.random() * 3);
    const newStops: ColorStop[] = Array.from({ length: stopCount }, (_, i) =>
      makeStop(pick(), (i / (stopCount - 1)) * 100),
    );
    setState((prev) => ({
      ...prev,
      stops: newStops,
      linearAngle: Math.floor(Math.random() * 360),
    }));
  }, []);

  const exportCss = React.useMemo(
    () => buildExportBlock(state),
    [state],
  );

  const handleCopy = React.useCallback(async () => {
    const ok = await copyToClipboard(exportCss);
    if (ok) {
      setCopied(true);
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 1800);
    }
  }, [exportCss]);

  return (
    <section
      aria-label="Roy Gradient Studio"
      className="mx-auto w-full max-w-6xl px-1 py-2"
    >
      {/* Inline keyframes (server-safe; only added once on client via effect). */}

      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Roy Gradient Studio
          </h2>
          <p className="text-sm text-muted-foreground">
            Linear · Radial · Conic · Mesh · noise · animated · aurora layers ·
            CSS export.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRandomize}
            aria-label="Randomize stops"
          >
            <Shuffle className="size-3.5" aria-hidden />
            Randomize
          </Button>
          <Button
            size="sm"
            onClick={() => setExportOpen(true)}
            aria-label="Open export dialog"
          >
            <Download className="size-3.5" aria-hidden />
            Export CSS
          </Button>
        </div>
      </div>

      {/* ─── Presets ─────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Presets:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleApplyPreset(p)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            title={p.description}
          >
            <Sparkles className="size-3 text-emerald-500" aria-hidden />
            {p.name}
          </button>
        ))}
      </div>

      {/* ─── Live preview ─────────────────────────────────────────── */}
      <div className="mb-5">
        <LivePreview state={state} />
      </div>

      {/* ─── Effects toggles ─────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm font-medium text-foreground">
              Noise overlay
            </Label>
            <p className="text-[11px] text-muted-foreground">
              SVG turbulence · overlay blend
            </p>
          </div>
          <Switch
            checked={state.noise}
            onCheckedChange={(v) => patchState({ noise: v })}
            aria-label="Toggle noise overlay"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm font-medium text-foreground">
              Animated
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Drifts background-position
            </p>
          </div>
          <Switch
            checked={state.animated}
            onCheckedChange={(v) => patchState({ animated: v })}
            aria-label="Toggle animation"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm font-medium text-foreground">
              Aurora layers
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Adds 3 semi-transparent blobs
            </p>
          </div>
          <Switch
            checked={state.aurora}
            onCheckedChange={(v) => patchState({ aurora: v })}
            aria-label="Toggle aurora layers"
          />
        </div>
        {state.noise ? (
          <div className="sm:col-span-3">
            <LabeledRange
              label="Noise opacity"
              value={Math.round(state.noiseOpacity * 100)}
              min={0}
              max={50}
              step={1}
              onChange={(v) => patchState({ noiseOpacity: v / 100 })}
            />
          </div>
        ) : null}
      </div>

      {/* ─── Type tabs ───────────────────────────────────────────── */}
      <Tabs
        value={state.type}
        onValueChange={(v) => patchState({ type: v as GradientType })}
      >
        <TabsList className="mb-4">
          {(["linear", "radial", "conic", "mesh"] as const).map((t) => (
            <TabsTrigger key={t} value={t}>
              {TYPE_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── Linear ──────────────────────────────────────────── */}
        <TabsContent value="linear">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <LabeledRange
                label="Angle (deg)"
                value={state.linearAngle}
                min={0}
                max={360}
                step={1}
                onChange={(v) => patchState({ linearAngle: v })}
              />
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <ColorStopsEditor
                stops={state.stops}
                onChange={(stops) => patchState({ stops })}
              />
            </div>
          </div>
        </TabsContent>

        {/* ─── Radial ──────────────────────────────────────────── */}
        <TabsContent value="radial">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">
                  Shape
                </Label>
                <div className="flex gap-1.5">
                  {SHAPE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => patchState({ radialShape: s })}
                      aria-pressed={state.radialShape === s}
                      className={cn(
                        "inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium capitalize transition-colors",
                        state.radialShape === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <LabeledRange
                label="Center X (%)"
                value={state.radialX}
                min={0}
                max={100}
                step={1}
                onChange={(v) => patchState({ radialX: v })}
              />
              <LabeledRange
                label="Center Y (%)"
                value={state.radialY}
                min={0}
                max={100}
                step={1}
                onChange={(v) => patchState({ radialY: v })}
              />
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <ColorStopsEditor
                stops={state.stops}
                onChange={(stops) => patchState({ stops })}
              />
            </div>
          </div>
        </TabsContent>

        {/* ─── Conic ───────────────────────────────────────────── */}
        <TabsContent value="conic">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
              <LabeledRange
                label="From angle (deg)"
                value={state.conicAngle}
                min={0}
                max={360}
                step={1}
                onChange={(v) => patchState({ conicAngle: v })}
              />
              <LabeledRange
                label="Center X (%)"
                value={state.conicX}
                min={0}
                max={100}
                step={1}
                onChange={(v) => patchState({ conicX: v })}
              />
              <LabeledRange
                label="Center Y (%)"
                value={state.conicY}
                min={0}
                max={100}
                step={1}
                onChange={(v) => patchState({ conicY: v })}
              />
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <ColorStopsEditor
                stops={state.stops}
                onChange={(stops) => patchState({ stops })}
              />
            </div>
          </div>
        </TabsContent>

        {/* ─── Mesh ────────────────────────────────────────────── */}
        <TabsContent value="mesh">
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <MeshEditor
              points={state.meshPoints}
              onChange={(meshPoints) => patchState({ meshPoints })}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Export dialog ───────────────────────────────────────── */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Export gradient CSS</DialogTitle>
            <DialogDescription>
              Paste this block into your stylesheet. The animation keyframes
              are included when the animated toggle is on; the noise overlay
              pseudo-element is included when noise is on.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                CSS
              </span>
              <Button
                size="sm"
                variant={copied ? "secondary" : "outline"}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" aria-hidden /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" aria-hidden /> Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="max-h-80 overflow-auto px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
              <code>{exportCss}</code>
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
