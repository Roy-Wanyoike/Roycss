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
  Disc,
  RotateCw,
  Move,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * ConicGradientGenerator — visual builder for `conic-gradient()` and
 * `repeating-conic-gradient()`.
 *
 * Features:
 *  - 300×300 live preview that reflects every control in real time.
 *  - SVG angle dial: drag the handle around the circle to set the `from`
 *    angle (0–360°, 0° = 12 o’clock, clockwise). Keyboard arrows nudge ±1°
 *    (±15° with Shift).
 *  - Color stops: a horizontal strip showing the gradient + draggable stop
 *    handles. Add / remove / recolor / reposition. The strip’s range adapts
 *    to the active mode (0–360 in conic, 0–repeatSize in repeating).
 *  - Mode toggle: `conic` vs `repeating`. In repeating mode a “repeat size”
 *    slider (10–360°) controls the period; stops rescale to fit.
 *  - 100×100 center-point pad: drag the dot to set the `at X% Y%` origin.
 *  - 6 presets: Rainbow, Pie, Sunburst, Color wheel, Traffic light, Clear.
 *  - Generated CSS with Copy button + 2s Check confirmation.
 *
 * Math: conic-gradient angles are clockwise from 12 o’clock. We convert
 * pointer → angle with `atan2(dx, -dy)` (SVG y-axis is down, so we negate dy
 * to map “up” to 0°).
 */

// ============================================================
// Types
// ============================================================

type Mode = "conic" | "repeating";

interface Stop {
  id: string;
  /** Angular position in degrees, in the active mode’s range. */
  position: number;
  color: string;
}

interface Config {
  mode: Mode;
  angle: number; // 0..360
  centerX: number; // 0..100 %
  centerY: number; // 0..100 %
  repeatSize: number; // 10..360 deg (repeating mode only)
  stops: Stop[];
}

interface Preset {
  name: string;
  mode: Mode;
  angle: number;
  centerX: number;
  centerY: number;
  repeatSize: number;
  stops: Array<{ position: number; color: string }>;
}

// ============================================================
// Constants
// ============================================================

const PRESETS: Preset[] = [
  {
    name: "Rainbow",
    mode: "conic",
    angle: 0,
    centerX: 50,
    centerY: 50,
    repeatSize: 60,
    stops: [
      { position: 0, color: "#ef4444" },
      { position: 60, color: "#f97316" },
      { position: 120, color: "#eab308" },
      { position: 180, color: "#22c55e" },
      { position: 240, color: "#3b82f6" },
      { position: 300, color: "#a855f7" },
      { position: 360, color: "#ef4444" },
    ],
  },
  {
    name: "Pie",
    mode: "conic",
    angle: 0,
    centerX: 50,
    centerY: 50,
    repeatSize: 60,
    stops: [
      { position: 0, color: "#ef4444" },
      { position: 90, color: "#22c55e" },
      { position: 180, color: "#3b82f6" },
      { position: 270, color: "#eab308" },
      { position: 360, color: "#ef4444" },
    ],
  },
  {
    name: "Sunburst",
    mode: "repeating",
    angle: 0,
    centerX: 50,
    centerY: 50,
    repeatSize: 60,
    stops: [
      { position: 0, color: "#f59e0b" },
      { position: 30, color: "#ffffff" },
      { position: 60, color: "#f59e0b" },
    ],
  },
  {
    name: "Color wheel",
    mode: "conic",
    angle: 0,
    centerX: 50,
    centerY: 50,
    repeatSize: 60,
    stops: [
      { position: 0, color: "hsl(0 100% 50%)" },
      { position: 60, color: "hsl(60 100% 50%)" },
      { position: 120, color: "hsl(120 100% 50%)" },
      { position: 180, color: "hsl(180 100% 50%)" },
      { position: 240, color: "hsl(240 100% 50%)" },
      { position: 300, color: "hsl(300 100% 50%)" },
      { position: 360, color: "hsl(360 100% 50%)" },
    ],
  },
  {
    name: "Traffic light",
    mode: "conic",
    angle: 0,
    centerX: 50,
    centerY: 50,
    repeatSize: 60,
    stops: [
      { position: 0, color: "#ef4444" },
      { position: 120, color: "#ef4444" },
      { position: 120, color: "#eab308" },
      { position: 240, color: "#eab308" },
      { position: 240, color: "#22c55e" },
      { position: 360, color: "#22c55e" },
    ],
  },
  {
    name: "Clear",
    mode: "conic",
    angle: 0,
    centerX: 50,
    centerY: 50,
    repeatSize: 60,
    stops: [
      { position: 0, color: "#ffffff" },
      { position: 360, color: "#ffffff" },
    ],
  },
];

const DEFAULT_CONFIG: Config = {
  ...PRESETS[0],
  stops: PRESETS[0].stops.map((s, i) => ({
    id: `stop-${i}`,
    position: s.position,
    color: s.color,
  })),
};

// ============================================================
// Helpers
// ============================================================

let stopIdCounter = 100;
function nextStopId(): string {
  stopIdCounter += 1;
  return `cg-stop-${stopIdCounter}`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Degree range for the active mode (drives stop strip + dial). */
function maxPosition(cfg: Config): number {
  return cfg.mode === "repeating" ? cfg.repeatSize : 360;
}

/** Build the CSS gradient value string. */
function buildGradient(cfg: Config): string {
  const sorted = cfg.stops.slice().sort((a, b) => a.position - b.position);
  const stopsStr =
    sorted.length === 0
      ? "transparent 0deg, transparent 360deg"
      : sorted
          .map((s) => `${s.color} ${Number(s.position.toFixed(1))}deg`)
          .join(", ");
  const fn =
    cfg.mode === "conic" ? "conic-gradient" : "repeating-conic-gradient";
  const from = cfg.angle !== 0 ? `from ${cfg.angle}deg ` : "";
  const at =
    cfg.centerX !== 50 || cfg.centerY !== 50
      ? `at ${cfg.centerX}% ${cfg.centerY}% `
      : "";
  return `${fn}(${from}${at}${stopsStr})`;
}

/**
 * Pointer → conic angle. SVG y is down, conic 0° is up (12 o’clock) and
 * increases clockwise. We compute `atan2(dx, -dy)` and convert to a
 * 0–360 range.
 */
function angleFromPointer(
  clientX: number,
  clientY: number,
  cx: number,
  cy: number,
): number {
  const dx = clientX - cx;
  const dy = clientY - cy;
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg);
}

/** Convert a conic angle (0°=up, clockwise) to an SVG point on a circle. */
function angleToPoint(
  angle: number,
  cx: number,
  cy: number,
  r: number,
): { x: number; y: number } {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/**
 * `<input type="color">` only accepts `#rrggbb`. We coerce other CSS colors
 * via a 1×1 canvas so the picker stays usable; falls back to black.
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
// Component
// ============================================================

export function ConicGradientGenerator() {
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);

  const dialRef = useRef<SVGSVGElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const padRef = useRef<HTMLDivElement | null>(null);
  const draggingDial = useRef(false);
  const draggingPad = useRef(false);
  const draggingStopId = useRef<string | null>(null);

  /* ── Derived: gradient CSS strings ────────────────────────────────── */
  const gradientValue = useMemo(() => buildGradient(cfg), [cfg]);

  const generatedCss = useMemo(
    () => `.conic-gradient {\n  background: ${gradientValue};\n}`,
    [gradientValue],
  );

  const previewStyle = useMemo<CSSProperties>(
    () => ({ background: gradientValue }),
    [gradientValue],
  );

  const stripPreviewStyle = useMemo<CSSProperties>(
    () => ({
      backgroundImage:
        cfg.mode === "repeating"
          ? `repeating-linear-gradient(90deg, ${cfg.stops
              .slice()
              .sort((a, b) => a.position - b.position)
              .map(
                (s) =>
                  `${s.color} ${((s.position / cfg.repeatSize) * 100).toFixed(2)}%`,
              )
              .join(", ")})`
          : `linear-gradient(90deg, ${cfg.stops
              .slice()
              .sort((a, b) => a.position - b.position)
              .map(
                (s) => `${s.color} ${((s.position / 360) * 100).toFixed(2)}%`,
              )
              .join(", ")})`,
    }),
    [cfg.stops, cfg.mode, cfg.repeatSize],
  );

  /* ── Dial drag handlers ───────────────────────────────────────────── */
  const updateAngleFromPointer = useCallback((clientX: number, clientY: number) => {
    const svg = dialRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setCfg((prev) => ({ ...prev, angle: angleFromPointer(clientX, clientY, cx, cy) }));
  }, []);

  const onDialPointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      draggingDial.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateAngleFromPointer(e.clientX, e.clientY);
    },
    [updateAngleFromPointer],
  );

  const onDialPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!draggingDial.current) return;
      updateAngleFromPointer(e.clientX, e.clientY);
    },
    [updateAngleFromPointer],
  );

  const onDialPointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      draggingDial.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [],
  );

  /* ── Center-pad drag handlers ─────────────────────────────────────── */
  const updateCenterFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
      setCfg((prev) => ({ ...prev, centerX: Math.round(x), centerY: Math.round(y) }));
    },
    [],
  );

  const onPadPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      draggingPad.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateCenterFromPointer(e.clientX, e.clientY);
    },
    [updateCenterFromPointer],
  );

  const onPadPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingPad.current) return;
      updateCenterFromPointer(e.clientX, e.clientY);
    },
    [updateCenterFromPointer],
  );

  const onPadPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      draggingPad.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [],
  );

  /* ── Stop strip drag handlers ─────────────────────────────────────── */
  const updateStopFromPointer = useCallback(
    (stopId: string, clientX: number) => {
      const el = stripRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
      setCfg((prev) => {
        const maxP = maxPosition(prev);
        const pos = Math.round(pct * maxP);
        return {
          ...prev,
          stops: prev.stops.map((s) =>
            s.id === stopId ? { ...s, position: pos } : s,
          ),
        };
      });
    },
    [],
  );

  const onStopPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, stopId: string) => {
      draggingStopId.current = stopId;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateStopFromPointer(stopId, e.clientX);
    },
    [updateStopFromPointer],
  );

  const onStopPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingStopId.current) return;
      updateStopFromPointer(draggingStopId.current, e.clientX);
    },
    [updateStopFromPointer],
  );

  const onStopPointerUp = useCallback(
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

  /* ── Cleanup drag flags on unmount ────────────────────────────────── */
  useEffect(() => {
    return () => {
      draggingDial.current = false;
      draggingPad.current = false;
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
  const setMode = useCallback((mode: Mode) => {
    setCfg((prev) => {
      if (prev.mode === mode) return prev;
      const oldMax = prev.mode === "repeating" ? prev.repeatSize : 360;
      const newMax = mode === "repeating" ? prev.repeatSize : 360;
      const scale = newMax / (oldMax || 1);
      return {
        ...prev,
        mode,
        stops: prev.stops.map((s) => ({
          ...s,
          position: Math.round(s.position * scale),
        })),
      };
    });
  }, []);

  const setRepeatSize = useCallback((size: number) => {
    setCfg((prev) => {
      const oldMax = prev.repeatSize;
      const scale = size / (oldMax || 1);
      return {
        ...prev,
        repeatSize: size,
        stops: prev.stops.map((s) => ({
          ...s,
          position: clamp(Math.round(s.position * scale), 0, size),
        })),
      };
    });
  }, []);

  const setAngle = useCallback((angle: number) => {
    setCfg((prev) => ({ ...prev, angle: clamp(Math.round(angle), 0, 360) }));
  }, []);

  const addStop = useCallback(() => {
    setCfg((prev) => {
      const maxP = maxPosition(prev);
      const sorted = prev.stops.slice().sort((a, b) => a.position - b.position);
      let pos: number;
      if (sorted.length === 0) {
        pos = 0;
      } else if (sorted.length === 1) {
        pos = Math.round(maxP / 2);
      } else {
        // Find the largest gap and place the new stop in its middle.
        let bestGap = 0;
        let bestPos = Math.round(maxP / 2);
        for (let i = 0; i < sorted.length - 1; i += 1) {
          const gap = sorted[i + 1].position - sorted[i].position;
          if (gap > bestGap) {
            bestGap = gap;
            bestPos = Math.round(sorted[i].position + gap / 2);
          }
        }
        // Also consider the wrap-around gap (last → maxP → 0 → first) for
        // repeating mode visual continuity.
        const wrapGap = maxP - sorted[sorted.length - 1].position + sorted[0].position;
        if (wrapGap > bestGap) {
          bestPos = Math.round(
            (sorted[sorted.length - 1].position + wrapGap / 2) % maxP,
          );
        }
        pos = bestPos;
      }
      const newStop: Stop = {
        id: nextStopId(),
        position: pos,
        color: "#64748b",
      };
      return { ...prev, stops: [...prev.stops, newStop] };
    });
  }, []);

  const removeStop = useCallback((id: string) => {
    setCfg((prev) => {
      if (prev.stops.length <= 2) return prev; // keep at least 2
      return { ...prev, stops: prev.stops.filter((s) => s.id !== id) };
    });
  }, []);

  const setStopColor = useCallback((id: string, color: string) => {
    setCfg((prev) => ({
      ...prev,
      stops: prev.stops.map((s) => (s.id === id ? { ...s, color } : s)),
    }));
  }, []);

  const setStopPosition = useCallback((id: string, position: number) => {
    setCfg((prev) => {
      const maxP = maxPosition(prev);
      const clamped = clamp(Math.round(position), 0, maxP);
      return {
        ...prev,
        stops: prev.stops.map((s) =>
          s.id === id ? { ...s, position: clamped } : s,
        ),
      };
    });
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setCfg({
      mode: preset.mode,
      angle: preset.angle,
      centerX: preset.centerX,
      centerY: preset.centerY,
      repeatSize: preset.repeatSize,
      stops: preset.stops.map((s) => ({
        id: nextStopId(),
        position: s.position,
        color: s.color,
      })),
    });
  }, []);

  const reset = useCallback(() => {
    setCfg({
      ...DEFAULT_CONFIG,
      stops: DEFAULT_CONFIG.stops.map((s) => ({
        id: nextStopId(),
        position: s.position,
        color: s.color,
      })),
    });
  }, []);

  /* ── Sorted stops for display ─────────────────────────────────────── */
  const sortedStops = useMemo(
    () => cfg.stops.slice().sort((a, b) => a.position - b.position),
    [cfg.stops],
  );

  const maxP = maxPosition(cfg);

  /* ── Dial geometry ────────────────────────────────────────────────── */
  const DIAL = 180;
  const DIAL_C = DIAL / 2;
  const DIAL_R = 72;
  const indicator = angleToPoint(cfg.angle, DIAL_C, DIAL_C, DIAL_R);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Disc className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Conic Gradient Generator
          </h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {cfg.mode === "repeating" ? "repeating" : "conic"}
        </Badge>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div
          className="size-[300px] rounded-lg border border-border shadow-sm"
          style={previewStyle}
          role="img"
          aria-label="Conic gradient preview"
        />
      </div>

      {/* Controls: angle dial + center pad */}
      <div className="flex flex-wrap items-start justify-center gap-6">
        {/* Angle dial */}
        <div className="flex flex-col items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            <RotateCw className="mr-1 inline size-3" />
            From angle: {cfg.angle}°
          </Label>
          <svg
            ref={dialRef}
            width={DIAL}
            height={DIAL}
            viewBox={`0 0 ${DIAL} ${DIAL}`}
            onPointerDown={onDialPointerDown}
            onPointerMove={onDialPointerMove}
            onPointerUp={onDialPointerUp}
            onPointerCancel={onDialPointerUp}
            className="cursor-grab touch-none active:cursor-grabbing"
            role="slider"
            aria-valuenow={cfg.angle}
            aria-valuemin={0}
            aria-valuemax={360}
            aria-label="Gradient from-angle"
            tabIndex={0}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 15 : 1;
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                setAngle(cfg.angle - step);
              } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                setAngle(cfg.angle + step);
              }
            }}
          >
            <circle
              cx={DIAL_C}
              cy={DIAL_C}
              r={DIAL_R + 8}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              className="text-border"
            />
            {/* Tick marks every 30° */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = i * 30;
              const p1 = angleToPoint(a, DIAL_C, DIAL_C, DIAL_R + 8);
              const p2 = angleToPoint(a, DIAL_C, DIAL_C, DIAL_R + 3);
              return (
                <line
                  key={i}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="currentColor"
                  strokeWidth={1}
                  className="text-muted-foreground"
                />
              );
            })}
            {/* Center dot */}
            <circle
              cx={DIAL_C}
              cy={DIAL_C}
              r={3}
              className="fill-muted-foreground"
            />
            {/* Indicator line */}
            <line
              x1={DIAL_C}
              y1={DIAL_C}
              x2={indicator.x}
              y2={indicator.y}
              className="stroke-primary"
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* Draggable handle */}
            <circle
              cx={indicator.x}
              cy={indicator.y}
              r={8}
              className="fill-primary"
              stroke="white"
              strokeWidth={2}
            />
            {/* Angle label */}
            <text
              x={DIAL_C}
              y={DIAL_C - DIAL_R + 22}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
              style={{ fontSize: 10 }}
            >
              0°
            </text>
          </svg>
        </div>

        {/* Center pad */}
        <div className="flex flex-col items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            <Move className="mr-1 inline size-3" />
            Center: {cfg.centerX}% {cfg.centerY}%
          </Label>
          <div
            ref={padRef}
            onPointerDown={onPadPointerDown}
            onPointerMove={onPadPointerMove}
            onPointerUp={onPadPointerUp}
            onPointerCancel={onPadPointerUp}
            className="relative size-[100px] cursor-grab touch-none rounded-md border border-border bg-muted active:cursor-grabbing"
            role="slider"
            aria-valuenow={cfg.centerX}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Gradient center X"
            tabIndex={0}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 10 : 1;
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setCfg((p) => ({ ...p, centerX: clamp(p.centerX - step, 0, 100) }));
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                setCfg((p) => ({ ...p, centerX: clamp(p.centerX + step, 0, 100) }));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCfg((p) => ({ ...p, centerY: clamp(p.centerY - step, 0, 100) }));
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setCfg((p) => ({ ...p, centerY: clamp(p.centerY + step, 0, 100) }));
              }
            }}
          >
            {/* Crosshair guides */}
            <div
              className="absolute inset-y-0 w-px bg-border"
              style={{ left: `${cfg.centerX}%` }}
            />
            <div
              className="absolute inset-x-0 h-px bg-border"
              style={{ top: `${cfg.centerY}%` }}
            />
            {/* Draggable dot */}
            <div
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow"
              style={{ left: `${cfg.centerX}%`, top: `${cfg.centerY}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mode + repeat-size */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-md border border-border bg-muted p-0.5">
          {(["conic", "repeating"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                cfg.mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={cfg.mode === m}
            >
              {m === "conic" ? "conic-gradient" : "repeating-conic-gradient"}
            </button>
          ))}
        </div>
        {cfg.mode === "repeating" && (
          <div className="flex flex-1 items-center gap-2">
            <Label className="whitespace-nowrap text-xs text-muted-foreground">
              Repeat size: {cfg.repeatSize}°
            </Label>
            <Slider
              value={[cfg.repeatSize]}
              min={10}
              max={360}
              step={5}
              onValueChange={(v) => setRepeatSize(v[0])}
              className="flex-1"
              aria-label="Repeat size in degrees"
            />
          </div>
        )}
      </div>

      {/* Color stops strip */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Color stops ({cfg.stops.length}) — range 0–{maxP}°
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={addStop}
            className="h-7 gap-1.5 text-xs"
          >
            <Plus className="size-3" /> Add stop
          </Button>
        </div>

        {/* The gradient preview strip with draggable handles */}
        <div
          ref={stripRef}
          className="relative h-12 w-full touch-none rounded-md border border-border"
          style={stripPreviewStyle}
        >
          {sortedStops.map((s) => {
            const pct = (s.position / maxP) * 100;
            return (
              <div
                key={s.id}
                onPointerDown={(e) => onStopPointerDown(e, s.id)}
                onPointerMove={onStopPointerMove}
                onPointerUp={onStopPointerUp}
                onPointerCancel={onStopPointerUp}
                className="absolute top-0 flex h-full cursor-ew-resize flex-col items-center"
                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                role="slider"
                aria-valuenow={s.position}
                aria-valuemin={0}
                aria-valuemax={maxP}
                aria-label={`Stop at ${s.position} degrees, color ${s.color}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  const step = e.shiftKey ? 10 : 1;
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    setStopPosition(s.id, s.position - step);
                  } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    setStopPosition(s.id, s.position + step);
                  }
                }}
              >
                <div
                  className="mt-0.5 size-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: s.color }}
                />
                <div className="mt-0.5 h-2 w-px bg-foreground/60" />
              </div>
            );
          })}
        </div>

        {/* Per-stop editors */}
        <div className="flex flex-col gap-1.5">
          {sortedStops.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-md border border-border bg-card p-1.5"
            >
              <Input
                type="color"
                value={normalizeColorForInput(s.color)}
                onChange={(e) => setStopColor(s.id, e.target.value)}
                className="size-7 shrink-0 cursor-pointer p-0.5"
                aria-label={`Color for stop at ${s.position}°`}
              />
              <Input
                type="text"
                value={s.color}
                onChange={(e) => setStopColor(s.id, e.target.value)}
                className="h-7 w-24 text-xs"
                aria-label="Color value"
              />
              <Input
                type="number"
                value={s.position}
                min={0}
                max={maxP}
                step={1}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isNaN(n)) setStopPosition(s.id, n);
                }}
                className="h-7 w-16 text-xs"
                aria-label="Stop position in degrees"
              />
              <span className="text-[11px] text-muted-foreground">deg</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-6 text-destructive hover:text-destructive"
                onClick={() => removeStop(s.id)}
                disabled={cfg.stops.length <= 2}
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
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-7 gap-1 px-2.5 text-xs"
        >
          <RefreshCw className="size-3" /> Reset
        </Button>
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
        <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
          <code>{generatedCss}</code>
        </pre>
      </div>
    </div>
  );
}
