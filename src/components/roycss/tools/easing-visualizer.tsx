"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Activity,
  Play,
  Pause,
  Copy,
  Check,
  RotateCcw,
  Gauge,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * EasingVisualizer — an interactive cubic-bezier easing curve designer.
 *
 * Features:
 *  - SVG curve editor with two draggable control points (pointer + keyboard).
 *  - Live moving dot driven by a `requestAnimationFrame` loop.
 *  - Bidirectionally synced numeric inputs + sliders (x1, y1, x2, y2).
 *  - Preset gallery (linear / ease / quad / cubic / back / bounce-ish) with
 *    mini curve thumbnails; active preset is highlighted.
 *  - Real-world live preview: a 48px circle traversing a track using the
 *    actual `cubic-bezier(...)` CSS transition.
 *  - Generated `transition-timing-function` CSS with copy-to-clipboard.
 *  - Configurable preview duration (100–5000ms).
 *
 * Math:
 *  - The cubic-bezier parametric form with P0=(0,0), P1=(x1,y1),
 *    P2=(x2,y2), P3=(1,1):
 *      B(t) = 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3   (P0 term is 0)
 *  - For the moving dot we need y given x (time). Because x1,x2 ∈ [0,1],
 *    Bx(t) is monotonically increasing in t, so a 40-iteration binary
 *    search on t converges to sub-pixel precision.
 */

interface BezierVals {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Preset extends BezierVals {
  name: string;
  /** Flag for approximate / non-standard easings (e.g. "bounce-ish"). */
  approx?: boolean;
}

const PRESETS: Preset[] = [
  { name: "linear", x1: 0, y1: 0, x2: 1, y2: 1 },
  { name: "ease", x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
  { name: "ease-in", x1: 0.42, y1: 0, x2: 1, y2: 1 },
  { name: "ease-out", x1: 0, y1: 0, x2: 0.58, y2: 1 },
  { name: "ease-in-out", x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
  { name: "ease-in-quad", x1: 0.55, y1: 0.085, x2: 0.68, y2: 0.53 },
  { name: "ease-out-quad", x1: 0.25, y1: 0.46, x2: 0.45, y2: 0.94 },
  { name: "ease-in-cubic", x1: 0.55, y1: 0.055, x2: 0.675, y2: 0.19 },
  { name: "ease-out-cubic", x1: 0.215, y1: 0.61, x2: 0.355, y2: 1 },
  { name: "ease-in-out-cubic", x1: 0.645, y1: 0.045, x2: 0.355, y2: 1 },
  { name: "ease-in-back", x1: 0.6, y1: -0.28, x2: 0.735, y2: 0.045 },
  { name: "ease-out-back", x1: 0.175, y1: 0.885, x2: 0.32, y2: 1.275 },
  { name: "ease-in-out-back", x1: 0.68, y1: -0.55, x2: 0.265, y2: 1.55 },
  { name: "bounce-ish", x1: 0.68, y1: -0.6, x2: 0.32, y2: 1.6, approx: true },
];

/** Default curve = `ease-in-out` — matches the "Reset" affordance. */
const DEFAULT_VALS: BezierVals = { x1: 0.42, y1: 0, x2: 0.58, y2: 1 };

/** SVG viewBox dimension for the graph square (in SVG user units). */
const VB = 280;
/** Y-axis clamp range (allows overshoot / back / bounce-style easings). */
const Y_MIN = -0.5;
const Y_MAX = 1.5;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Trim trailing zeros so 0.5 stays "0.5" and 0.42 stays "0.42". */
function fmt(n: number): string {
  return Number(n.toFixed(3)).toString();
}

/**
 * Solve `y = By(t)` for a given `x = Bx(t)` using binary search.
 * Requires x1, x2 ∈ [0,1] (guaranteed by clamping) so Bx is monotonic.
 */
function bezierYForX(
  x: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const t = (lo + hi) / 2;
    const mt = 1 - t;
    const bx = 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t;
    if (bx < x) lo = t;
    else hi = t;
  }
  const t = (lo + hi) / 2;
  const mt = 1 - t;
  return 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t;
}

/** Sample the bezier into a polyline SVG path (robust, no curve command needed). */
function sampleCurvePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  samples: number,
  scale: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const x = 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t;
    const y = 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t;
    pts.push(`${(x * scale).toFixed(2)},${((1 - y) * scale).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")}`;
}

/** Compact inline curve thumbnail used in the preset gallery (28×16). */
function MiniCurve({ x1, y1, x2, y2 }: BezierVals) {
  const d = useMemo(
    () => sampleCurvePath(x1, y1, x2, y2, 20, 24),
    [x1, y1, x2, y2],
  );
  return (
    <svg
      width="28"
      height="16"
      viewBox="0 0 24 16"
      className="overflow-visible text-current"
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type DragTarget = "p1" | "p2";

interface ControlPointProps {
  cx: number;
  cy: number;
  label: string;
  valX: number;
  valY: number;
  onPointerDown: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGGElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<SVGGElement>) => void;
}

/** Draggable / keyboard-navigable control point with role="slider". */
function ControlPoint({
  cx,
  cy,
  label,
  valX,
  valY,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
}: ControlPointProps) {
  return (
    <g
      tabIndex={0}
      role="slider"
      aria-label={`${label} control point`}
      aria-valuenow={Number(valX.toFixed(2))}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuetext={`${label}: x=${valX.toFixed(2)}, y=${valY.toFixed(2)}`}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="cursor-grab touch-none focus-visible:outline-none active:cursor-grabbing"
    >
      {/* Generous invisible hit area for easy grabbing */}
      <circle cx={cx} cy={cy} r={16} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={7}
        className="fill-background stroke-primary"
        strokeWidth={2.5}
      />
      <text
        x={cx}
        y={cy - 13}
        textAnchor="middle"
        className="fill-primary"
        fontSize="10"
        fontWeight="600"
        style={{ pointerEvents: "none" }}
      >
        {label}
      </text>
    </g>
  );
}

export function EasingVisualizer() {
  const [vals, setVals] = useState<BezierVals>(DEFAULT_VALS);
  const [duration, setDuration] = useState(1500);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [previewPos, setPreviewPos] = useState<0 | 1>(0);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState<DragTarget | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  const { x1, y1, x2, y2 } = vals;

  /* ── Track width (for live preview translate distance) ─────────────── */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => setTrackWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Moving dot: requestAnimationFrame loop, cleaned up on unmount ── */
  useEffect(() => {
    if (!playing) {
      lastTimeRef.current = 0;
      return;
    }
    const tick = (now: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      setProgress((p) => {
        const next = p + dt / duration;
        // Loop seamlessly, preserving sub-frame precision.
        return next >= 1 ? next - Math.floor(next) : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [playing, duration]);

  /* ── Live preview box: CSS transition toggled on an interval ──────── */
  useEffect(() => {
    if (!playing) return;
    // Kick off the back-and-forth cycle on the next animation frame so we
    // don't trigger a synchronous re-render inside this effect body.
    const kickoff = requestAnimationFrame(() => setPreviewPos(1));
    const interval = window.setInterval(
      () => setPreviewPos((p) => (p === 1 ? 0 : 1)),
      duration + 120,
    );
    return () => {
      cancelAnimationFrame(kickoff);
      window.clearInterval(interval);
    };
  }, [playing, duration]);

  const curvePath = useMemo(
    () => sampleCurvePath(x1, y1, x2, y2, 60, VB),
    [x1, y1, x2, y2],
  );

  const easedY = useMemo(
    () => bezierYForX(progress, x1, y1, x2, y2),
    [progress, x1, y1, x2, y2],
  );

  const cssString = `transition-timing-function: cubic-bezier(${fmt(x1)}, ${fmt(y1)}, ${fmt(x2)}, ${fmt(y2)});`;
  const cubicBezierString = `cubic-bezier(${fmt(x1)}, ${fmt(y1)}, ${fmt(x2)}, ${fmt(y2)})`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssString);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [cssString]);

  const setVal = useCallback(
    (key: keyof BezierVals, v: number) => {
      setVals((prev) => ({ ...prev, [key]: v }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    setVals(DEFAULT_VALS);
    setProgress(0);
  }, []);

  /* ── Pointer → normalized (x, y) conversion using the SVG CTM ─────── */
  const getNormalized = useCallback(
    (e: React.PointerEvent): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const pt = new DOMPoint(e.clientX, e.clientY);
      const svgP = pt.matrixTransform(ctm.inverse());
      return {
        x: clamp(svgP.x / VB, 0, 1),
        y: clamp(1 - svgP.y / VB, Y_MIN, Y_MAX),
      };
    },
    [],
  );

  const onPointerDownControl = useCallback(
    (e: React.PointerEvent<SVGGElement>, target: DragTarget) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      setDragging(target);
      const n = getNormalized(e);
      if (!n) return;
      if (target === "p1") {
        setVals((prev) => ({ ...prev, x1: n.x, y1: n.y }));
      } else {
        setVals((prev) => ({ ...prev, x2: n.x, y2: n.y }));
      }
    },
    [getNormalized],
  );

  const onPointerMoveControl = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!dragging) return;
      const n = getNormalized(e);
      if (!n) return;
      if (dragging === "p1") {
        setVals((prev) => ({ ...prev, x1: n.x, y1: n.y }));
      } else {
        setVals((prev) => ({ ...prev, x2: n.x, y2: n.y }));
      }
    },
    [dragging, getNormalized],
  );

  const onPointerUpControl = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      if (!dragging) return;
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      setDragging(null);
    },
    [dragging],
  );

  const onKeyDownControl = useCallback(
    (e: React.KeyboardEvent<SVGGElement>, target: DragTarget) => {
      const step = e.shiftKey ? 0.1 : 0.01;
      let handled = true;
      if (target === "p1") {
        if (e.key === "ArrowLeft")
          setVals((p) => ({ ...p, x1: clamp(p.x1 - step, 0, 1) }));
        else if (e.key === "ArrowRight")
          setVals((p) => ({ ...p, x1: clamp(p.x1 + step, 0, 1) }));
        else if (e.key === "ArrowUp")
          setVals((p) => ({ ...p, y1: clamp(p.y1 + step, Y_MIN, Y_MAX) }));
        else if (e.key === "ArrowDown")
          setVals((p) => ({ ...p, y1: clamp(p.y1 - step, Y_MIN, Y_MAX) }));
        else handled = false;
      } else {
        if (e.key === "ArrowLeft")
          setVals((p) => ({ ...p, x2: clamp(p.x2 - step, 0, 1) }));
        else if (e.key === "ArrowRight")
          setVals((p) => ({ ...p, x2: clamp(p.x2 + step, 0, 1) }));
        else if (e.key === "ArrowUp")
          setVals((p) => ({ ...p, y2: clamp(p.y2 + step, Y_MIN, Y_MAX) }));
        else if (e.key === "ArrowDown")
          setVals((p) => ({ ...p, y2: clamp(p.y2 - step, Y_MIN, Y_MAX) }));
        else handled = false;
      }
      if (handled) e.preventDefault();
    },
    [],
  );

  const isPresetActive = useCallback(
    (p: Preset): boolean =>
      Math.abs(p.x1 - x1) < 0.005 &&
      Math.abs(p.y1 - y1) < 0.005 &&
      Math.abs(p.x2 - x2) < 0.005 &&
      Math.abs(p.y2 - y2) < 0.005,
    [x1, y1, x2, y2],
  );

  /* ── Pre-computed SVG coordinates ─────────────────────────────────── */
  const p0 = { x: 0, y: VB };
  const p1Svg = { x: x1 * VB, y: (1 - y1) * VB };
  const p2Svg = { x: x2 * VB, y: (1 - y2) * VB };
  const p3 = { x: VB, y: 0 };
  const dotX = progress * VB;
  const dotY = (1 - easedY) * VB;
  const circleTranslate = previewPos === 1 ? Math.max(0, trackWidth - 48) : 0;

  const INPUTS: {
    key: keyof BezierVals;
    label: string;
    min: number;
    max: number;
  }[] = [
    { key: "x1", label: "x1", min: 0, max: 1 },
    { key: "y1", label: "y1", min: Y_MIN, max: Y_MAX },
    { key: "x2", label: "x2", min: 0, max: 1 },
    { key: "y2", label: "y2", min: Y_MIN, max: Y_MAX },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">Easing Visualizer</h3>
            <p className="text-xs text-muted-foreground">
              Design and compare cubic-bezier easing curves
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          title="Reset to ease-in-out"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ═══ LEFT: SVG editor + numeric controls + live preview ═══ */}
        <div className="space-y-4">
          {/* SVG curve editor */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Curve
              </span>
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                title={playing ? "Pause animation" : "Play animation"}
              >
                {playing ? (
                  <Pause className="size-3.5" />
                ) : (
                  <Play className="size-3.5" />
                )}
                {playing ? "Pause" : "Play"}
              </button>
            </div>

            <div className="relative py-4">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VB} ${VB}`}
                className="mx-auto h-auto w-full max-w-[300px] touch-none select-none overflow-visible"
                role="img"
                aria-label="Cubic bezier curve editor"
              >
                {/* Grid lines at 0.25 intervals */}
                {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                  <g key={v}>
                    <line
                      x1={v * VB}
                      y1={0}
                      x2={v * VB}
                      y2={VB}
                      className="stroke-border"
                      strokeWidth={1}
                      strokeDasharray="2 4"
                    />
                    <line
                      x1={0}
                      y1={v * VB}
                      x2={VB}
                      y2={v * VB}
                      className="stroke-border"
                      strokeWidth={1}
                      strokeDasharray="2 4"
                    />
                  </g>
                ))}

                {/* Outer frame */}
                <rect
                  x={0}
                  y={0}
                  width={VB}
                  height={VB}
                  fill="none"
                  className="stroke-border"
                  strokeWidth={1.5}
                />

                {/* Linear reference (faint diagonal) */}
                <line
                  x1={0}
                  y1={VB}
                  x2={VB}
                  y2={0}
                  className="stroke-muted-foreground/30"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />

                {/* Control-point handles (dashed) */}
                <line
                  x1={p0.x}
                  y1={p0.y}
                  x2={p1Svg.x}
                  y2={p1Svg.y}
                  className="stroke-muted-foreground/50"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <line
                  x1={p3.x}
                  y1={p3.y}
                  x2={p2Svg.x}
                  y2={p2Svg.y}
                  className="stroke-muted-foreground/50"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />

                {/* The actual easing curve */}
                <path
                  d={curvePath}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Endpoints (P0 and P3) */}
                <circle cx={0} cy={VB} r={4} className="fill-muted-foreground" />
                <circle
                  cx={VB}
                  cy={0}
                  r={4}
                  className="fill-muted-foreground"
                />

                {/* Moving dot animating along the curve */}
                <circle
                  cx={dotX}
                  cy={dotY}
                  r={5.5}
                  className="fill-primary"
                  opacity={playing ? 1 : 0.4}
                >
                  <title>Current eased position</title>
                </circle>

                {/* Draggable control points */}
                <ControlPoint
                  cx={p1Svg.x}
                  cy={p1Svg.y}
                  label="P1"
                  valX={x1}
                  valY={y1}
                  onPointerDown={(e) => onPointerDownControl(e, "p1")}
                  onPointerMove={onPointerMoveControl}
                  onPointerUp={onPointerUpControl}
                  onKeyDown={(e) => onKeyDownControl(e, "p1")}
                />
                <ControlPoint
                  cx={p2Svg.x}
                  cy={p2Svg.y}
                  label="P2"
                  valX={x2}
                  valY={y2}
                  onPointerDown={(e) => onPointerDownControl(e, "p2")}
                  onPointerMove={onPointerMoveControl}
                  onPointerUp={onPointerUpControl}
                  onKeyDown={(e) => onKeyDownControl(e, "p2")}
                />

                {/* Axis labels */}
                <text
                  x={VB / 2}
                  y={VB + 20}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="10"
                >
                  time →
                </text>
                <text
                  x={-16}
                  y={VB / 2}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="10"
                  transform={`rotate(-90 -16 ${VB / 2})`}
                >
                  progress →
                </text>
              </svg>
            </div>

            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              Drag P1/P2 · focus a point & use arrow keys (Shift = 0.1)
            </p>
          </div>

          {/* Numeric inputs + sliders */}
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Control Points
            </span>
            <div className="grid grid-cols-2 gap-3">
              {INPUTS.map(({ key, label, min, max }) => {
                const value = vals[key];
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`bezier-${key}`}
                        className="font-mono text-xs text-muted-foreground"
                      >
                        {label}
                      </label>
                      <Input
                        id={`bezier-${key}`}
                        type="number"
                        step={0.01}
                        min={min}
                        max={max}
                        defaultValue={value.toFixed(2)}
                        key={`${key}-${value.toFixed(3)}`}
                        onBlur={(e) => {
                          const num = parseFloat(e.target.value);
                          const clamped = Number.isNaN(num)
                            ? 0
                            : clamp(num, min, max);
                          setVal(key, clamped);
                        }}
                        className="h-7 w-20 text-right font-mono text-xs"
                      />
                    </div>
                    <Slider
                      value={[value]}
                      min={min}
                      max={max}
                      step={0.01}
                      onValueChange={(v) => setVal(key, v[0])}
                      aria-label={`${label} value`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live preview */}
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Gauge className="size-3.5" />
                Live Preview
              </span>
              <span className="font-mono text-xs text-primary">
                {duration}ms
              </span>
            </div>
            <div
              ref={trackRef}
              className="relative h-12 w-full overflow-hidden rounded-full bg-muted/40"
            >
              <div
                className="absolute left-0 top-0 size-12 rounded-full bg-primary shadow-lg"
                style={{
                  transform: `translateX(${circleTranslate}px)`,
                  transition: `transform ${duration}ms ${cubicBezierString}`,
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="bezier-duration"
                className="shrink-0 text-xs text-muted-foreground"
              >
                Duration
              </label>
              <input
                id="bezier-duration"
                type="range"
                min={100}
                max={5000}
                step={100}
                value={duration}
                onChange={(e) =>
                  setDuration(parseInt(e.target.value, 10))
                }
                className="flex-1 cursor-pointer accent-primary"
              />
              <Input
                type="number"
                min={100}
                max={5000}
                step={100}
                value={duration}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!Number.isNaN(n)) setDuration(clamp(n, 100, 5000));
                }}
                className="h-7 w-20 text-right font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: preset gallery + CSS output ═══ */}
        <div className="space-y-4">
          {/* Preset gallery */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Presets
              </span>
              <span className="text-[10px] text-muted-foreground">
                {PRESETS.length} easings
              </span>
            </div>
            <div className="max-h-72 grid grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {PRESETS.map((p) => {
                const active = isPresetActive(p);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      setVals({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 })
                    }
                    title={
                      p.approx
                        ? `${p.name} (approximate) — cubic-bezier(${fmt(p.x1)}, ${fmt(p.y1)}, ${fmt(p.x2)}, ${fmt(p.y2)})`
                        : `${p.name} — cubic-bezier(${fmt(p.x1)}, ${fmt(p.y1)}, ${fmt(p.x2)}, ${fmt(p.y2)})`
                    }
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    <MiniCurve x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
                    <span className="text-center font-medium leading-tight">
                      {p.name}
                    </span>
                    {p.approx ? (
                      <span className="text-[9px] opacity-70">approx</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generated CSS output */}
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
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-border/40 bg-muted/30 p-3 font-mono text-xs text-foreground/80">
              <code>{cssString}</code>
            </pre>
            <p className="text-[10px] text-muted-foreground">
              Use inline:{" "}
              <code className="font-mono text-foreground/70">
                {cubicBezierString}
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
