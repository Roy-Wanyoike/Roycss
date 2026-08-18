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
  Spline,
  Waypoints,
  Move,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * MotionPathAnimator — a CSS Motion Path (offset-path) animator.
 *
 * Features:
 *  - 400×300 SVG canvas to author a path:
 *      • line / curve (Catmull-Rom→cubic bezier) modes: click to add points,
 *        drag to move, delete via the points panel.
 *      • circle / ellipse modes: drag the center handle; radius via sliders.
 *      • custom mode: paste an SVG path string into a textarea.
 *  - Animated element (circle / square / triangle / star) travels the path
 *    using REAL `offset-path: path(...)` + an injected `@keyframes` that
 *    animates `offset-distance` 0%→100%. No JS RAF loop for the motion.
 *  - Controls: duration (s), timing-function, iteration count (∞ or N),
 *    offset-rotate (auto / fixed / custom deg), direction, play/pause.
 *  - 8 presets: Wave, Circle, Ellipse, Figure-8, Spiral, Zigzag, Heart, Star.
 *  - Generated CSS + path data, each with its own Copy button.
 *
 * Browser support: `offset-path: path()` is Baseline (Chrome 79+, FF 72+,
 * Safari 16+). The component still renders the static path in unsupported
 * browsers; only the motion is lost.
 */

// ============================================================
// Types
// ============================================================

type PathType = "line" | "curve" | "circle" | "ellipse" | "custom";
type Shape = "circle" | "square" | "triangle" | "star";
type Direction = "normal" | "reverse" | "alternate" | "alternate-reverse";

interface Point {
  x: number;
  y: number;
}

interface CircleCfg {
  cx: number;
  cy: number;
  r: number;
}

interface EllipseCfg {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

interface Config {
  pathType: PathType;
  points: Point[];
  circle: CircleCfg;
  ellipse: EllipseCfg;
  customPath: string;
  shape: Shape;
  shapeColor: string;
  duration: number; // seconds
  timing: string;
  iteration: number; // 0 = infinite
  rotateAuto: boolean;
  rotateDeg: number;
  direction: Direction;
  playing: boolean;
}

// ============================================================
// Constants
// ============================================================

const W = 400;
const H = 300;

const TIMING_FUNCTIONS = [
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "step-start",
  "step-end",
];

const SHAPES: { value: Shape; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "square", label: "Square" },
  { value: "triangle", label: "Triangle" },
  { value: "star", label: "Star" },
];

interface Preset {
  name: string;
  config: Partial<Config> & { pathType: PathType };
}

const DEFAULT_CONFIG: Config = {
  pathType: "curve",
  points: [
    { x: 30, y: 150 },
    { x: 100, y: 70 },
    { x: 200, y: 230 },
    { x: 300, y: 70 },
    { x: 370, y: 150 },
  ],
  circle: { cx: 200, cy: 150, r: 100 },
  ellipse: { cx: 200, cy: 150, rx: 150, ry: 80 },
  customPath: "M 50 150 C 100 50, 300 250, 350 150",
  shape: "circle",
  shapeColor: "hsl(var(--primary))",
  duration: 4,
  timing: "linear",
  iteration: 0,
  rotateAuto: true,
  rotateDeg: 0,
  direction: "normal",
  playing: true,
};

// ============================================================
// Path math helpers
// ============================================================

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function fmt(n: number): string {
  return Number(n.toFixed(1)).toString();
}

/** Catmull-Rom spline → SVG cubic bezier path string. */
function catmullRomToPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
  if (points.length === 2) {
    return `M ${fmt(points[0].x)} ${fmt(points[0].y)} L ${fmt(points[1].x)} ${fmt(points[1].y)}`;
  }
  const pts = points;
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M ${fmt(pts[0].x)} ${fmt(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = p[i];
    const p1 = p[i + 1];
    const p2 = p[i + 2];
    const p3 = p[i + 3];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${fmt(c1x)} ${fmt(c1y)}, ${fmt(c2x)} ${fmt(c2y)}, ${fmt(p2.x)} ${fmt(p2.y)}`;
  }
  return d;
}

function polylinePath(points: Point[]): string {
  if (points.length === 0) return "";
  return (
    `M ${fmt(points[0].x)} ${fmt(points[0].y)}` +
    points
      .slice(1)
      .map((p) => ` L ${fmt(p.x)} ${fmt(p.y)}`)
      .join("")
  );
}

function circlePath(c: CircleCfg): string {
  const { cx, cy, r } = c;
  const safeR = Math.max(1, r);
  return (
    `M ${fmt(cx - safeR)} ${fmt(cy)}` +
    ` A ${fmt(safeR)} ${fmt(safeR)} 0 1 0 ${fmt(cx + safeR)} ${fmt(cy)}` +
    ` A ${fmt(safeR)} ${fmt(safeR)} 0 1 0 ${fmt(cx - safeR)} ${fmt(cy)}`
  );
}

function ellipsePath(e: EllipseCfg): string {
  const { cx, cy, rx, ry } = e;
  const safeRx = Math.max(1, rx);
  const safeRy = Math.max(1, ry);
  return (
    `M ${fmt(cx - safeRx)} ${fmt(cy)}` +
    ` A ${fmt(safeRx)} ${fmt(safeRy)} 0 1 0 ${fmt(cx + safeRx)} ${fmt(cy)}` +
    ` A ${fmt(safeRx)} ${fmt(safeRy)} 0 1 0 ${fmt(cx - safeRx)} ${fmt(cy)}`
  );
}

/** Sample a parametric curve into a list of points. */
function sampleParametric(
  fn: (t: number) => Point,
  steps: number,
  tStart = 0,
  tEnd = Math.PI * 2,
): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = tStart + ((tEnd - tStart) * i) / steps;
    pts.push(fn(t));
  }
  return pts;
}

// ============================================================
// Presets (generate path data directly)
// ============================================================

const PRESET_PATHS: Record<string, string> = {
  // Wave: Catmull-Rom curve through 7 sinusoidal points.
  Wave: catmullRomToPath([
    { x: 30, y: 150 },
    { x: 90, y: 70 },
    { x: 150, y: 230 },
    { x: 210, y: 70 },
    { x: 270, y: 230 },
    { x: 330, y: 70 },
    { x: 370, y: 150 },
  ]),
  Circle: circlePath({ cx: 200, cy: 150, r: 100 }),
  Ellipse: ellipsePath({ cx: 200, cy: 150, rx: 150, ry: 75 }),
  // Figure-8 (lemniscate of Bernoulli), sampled parametrically.
  "Figure-8": polylinePath(
    sampleParametric((t) => {
      const s = 1 + Math.sin(t) ** 2;
      return {
        x: 200 + (150 * Math.cos(t)) / s,
        y: 150 + (80 * Math.sin(t) * Math.cos(t)) / s,
      };
    }, 80),
  ),
  // Archimedean spiral, 2 turns.
  Spiral: polylinePath(
    sampleParametric(
      (t) => {
        const r = 6 + t * 14;
        return { x: 200 + r * Math.cos(t), y: 150 + r * Math.sin(t) };
      },
      120,
      0,
      Math.PI * 4,
    ),
  ),
  Zigzag: polylinePath([
    { x: 30, y: 150 },
    { x: 90, y: 50 },
    { x: 150, y: 250 },
    { x: 210, y: 50 },
    { x: 270, y: 250 },
    { x: 330, y: 50 },
    { x: 370, y: 150 },
  ]),
  // Heart (parametric), scaled to fit.
  Heart: polylinePath(
    sampleParametric((t) => {
      const x = 16 * Math.sin(t) ** 3;
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      return { x: 200 + x * 7, y: 150 - y * 7 };
    }, 80),
  ),
  // 5-point star.
  Star: (() => {
    const pts: Point[] = [];
    const cx = 200;
    const cy = 150;
    const outer = 120;
    const inner = 50;
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    return polylinePath(pts) + " Z";
  })(),
};

const PRESETS: Preset[] = [
  { name: "Wave", config: { pathType: "custom", customPath: PRESET_PATHS.Wave } },
  { name: "Circle", config: { pathType: "custom", customPath: PRESET_PATHS.Circle } },
  { name: "Ellipse", config: { pathType: "custom", customPath: PRESET_PATHS.Ellipse } },
  { name: "Figure-8", config: { pathType: "custom", customPath: PRESET_PATHS["Figure-8"] } },
  { name: "Spiral", config: { pathType: "custom", customPath: PRESET_PATHS.Spiral } },
  { name: "Zigzag", config: { pathType: "custom", customPath: PRESET_PATHS.Zigzag } },
  { name: "Heart", config: { pathType: "custom", customPath: PRESET_PATHS.Heart } },
  { name: "Star", config: { pathType: "custom", customPath: PRESET_PATHS.Star } },
];

// ============================================================
// Shape rendering
// ============================================================

function shapeStyle(shape: Shape, color: string): CSSProperties {
  const base: CSSProperties = {
    width: 22,
    height: 22,
    background: color,
  };
  switch (shape) {
    case "circle":
      return { ...base, borderRadius: "50%" };
    case "square":
      return base;
    case "triangle":
      return { ...base, clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" };
    case "star":
      return {
        ...base,
        clipPath:
          "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
      };
    default:
      return base;
  }
}

// ============================================================
// Component
// ============================================================

export function MotionPathAnimator() {
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingPoint = useRef<number | null>(null);
  const draggingCenter = useRef<"circle" | "ellipse" | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  /* ── Derived: path data ───────────────────────────────────────────── */
  const pathData = useMemo(() => {
    switch (cfg.pathType) {
      case "line":
        return polylinePath(cfg.points);
      case "curve":
        return catmullRomToPath(cfg.points);
      case "circle":
        return circlePath(cfg.circle);
      case "ellipse":
        return ellipsePath(cfg.ellipse);
      case "custom":
        return cfg.customPath.trim();
      default:
        return "";
    }
  }, [cfg.pathType, cfg.points, cfg.circle, cfg.ellipse, cfg.customPath]);

  /* ── Derived: rotate CSS value ────────────────────────────────────── */
  const rotateCss = cfg.rotateAuto ? "auto" : `${cfg.rotateDeg}deg`;

  /* ── Derived: animation shorthand ─────────────────────────────────── */
  const iterationCss = cfg.iteration === 0 ? "infinite" : String(cfg.iteration);

  const animationShorthand = `mp-move ${cfg.duration}s ${cfg.timing} ${iterationCss} ${cfg.direction}`;

  /* ── Derived: generated CSS ───────────────────────────────────────── */
  const generatedCss = useMemo(() => {
    return (
      `@keyframes mp-move {\n` +
      `  from { offset-distance: 0%; }\n` +
      `  to { offset-distance: 100%; }\n` +
      `}\n\n` +
      `.motion-element {\n` +
      `  offset-path: path("${pathData}");\n` +
      `  offset-rotate: ${rotateCss};\n` +
      `  animation: ${animationShorthand};\n` +
      `  animation-play-state: ${cfg.playing ? "running" : "paused"};\n` +
      `}`
    );
  }, [pathData, rotateCss, animationShorthand, cfg.playing]);

  /* ── Inject the generated CSS into a live <style> tag ─────────────── */
  useEffect(() => {
    const el = styleRef.current;
    if (el) el.textContent = generatedCss;
  }, [generatedCss]);

  /* ── Canvas pointer → SVG coords ──────────────────────────────────── */
  const clientToCanvas = useCallback((clientX: number, clientY: number): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    return { x: clamp(x, 0, W), y: clamp(y, 0, H) };
  }, []);

  /* ── Canvas pointer handlers (line/curve modes) ───────────────────── */
  const onCanvasPointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (cfg.pathType !== "line" && cfg.pathType !== "curve") return;
      const p = clientToCanvas(e.clientX, e.clientY);
      setCfg((prev) => ({
        ...prev,
        points: [...prev.points, p],
      }));
      setSelectedPoint(null);
      // The new point index will be points.length (after state update).
      draggingPoint.current = cfg.points.length;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [cfg.pathType, cfg.points.length, clientToCanvas],
  );

  const onCanvasPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const p = clientToCanvas(e.clientX, e.clientY);
      if (draggingPoint.current !== null) {
        const idx = draggingPoint.current;
        setCfg((prev) => ({
          ...prev,
          points: prev.points.map((pt, i) => (i === idx ? p : pt)),
        }));
      } else if (draggingCenter.current === "circle") {
        setCfg((prev) => ({
          ...prev,
          circle: { ...prev.circle, cx: Math.round(p.x), cy: Math.round(p.y) },
        }));
      } else if (draggingCenter.current === "ellipse") {
        setCfg((prev) => ({
          ...prev,
          ellipse: { ...prev.ellipse, cx: Math.round(p.x), cy: Math.round(p.y) },
        }));
      }
    },
    [clientToCanvas],
  );

  const onCanvasPointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      draggingPoint.current = null;
      draggingCenter.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    },
    [],
  );

  /* ── Point handle pointer down (line/curve) ───────────────────────── */
  const onPointPointerDown = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>, idx: number) => {
      e.stopPropagation();
      draggingPoint.current = idx;
      setSelectedPoint(idx);
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    },
    [],
  );

  /* ── Center handle pointer down (circle/ellipse) ──────────────────── */
  const onCenterPointerDown = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>, kind: "circle" | "ellipse") => {
      e.stopPropagation();
      draggingCenter.current = kind;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    },
    [],
  );

  /* ── Cleanup drag refs on unmount ─────────────────────────────────── */
  useEffect(() => {
    return () => {
      draggingPoint.current = null;
      draggingCenter.current = null;
    };
  }, []);

  /* ── Copy handlers ────────────────────────────────────────────────── */
  const copyText = useCallback(async (text: string, which: "css" | "path") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "css") {
        setCopiedCss(true);
        window.setTimeout(() => setCopiedCss(false), 2000);
      } else {
        setCopiedPath(true);
        window.setTimeout(() => setCopiedPath(false), 2000);
      }
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  /* ── Config mutations ─────────────────────────────────────────────── */
  const updateConfig = useCallback(
    <K extends keyof Config>(key: K, value: Config[K]) => {
      setCfg((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const removePoint = useCallback((idx: number) => {
    setCfg((prev) => ({
      ...prev,
      points: prev.points.filter((_, i) => i !== idx),
    }));
    setSelectedPoint(null);
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setCfg((prev) => ({ ...prev, ...preset.config }));
    setSelectedPoint(null);
  }, []);

  const reset = useCallback(() => {
    setCfg(DEFAULT_CONFIG);
    setSelectedPoint(null);
  }, []);

  const replay = useCallback(() => {
    // Restart the animation by toggling play state off→on.
    setCfg((prev) => ({ ...prev, playing: false }));
    window.setTimeout(() => setCfg((prev) => ({ ...prev, playing: true })), 30);
  }, []);

  /* ── Animated element style (inline offset-path not needed — injected) ── */
  const animElStyle = useMemo<CSSProperties>(
    () => ({
      ...shapeStyle(cfg.shape, cfg.shapeColor),
      position: "absolute",
      top: 0,
      left: 0,
      offsetAnchor: "50% 50%",
    }),
    [cfg.shape, cfg.shapeColor],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden style tag holding the live keyframes + offset-path CSS */}
      <style ref={styleRef} />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Spline className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Motion Path Animator
          </h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          offset-path
        </Badge>
      </div>

      {/* Canvas — fixed 400×300 so offset-path pixel coords align with the
          SVG viewBox. Wrapped for horizontal scroll on narrow viewports. */}
      <div className="w-full overflow-x-auto">
        <div
          className="relative mx-auto overflow-hidden rounded-lg border border-border bg-card"
          style={{ width: W, height: H }}
        >
          <svg
            ref={svgRef}
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className={cn(
            "block h-full w-full touch-none",
            (cfg.pathType === "line" || cfg.pathType === "curve") &&
              "cursor-crosshair",
          )}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onPointerCancel={onCanvasPointerUp}
        >
          {/* Grid */}
          <defs>
            <pattern
              id="mp-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-border"
              />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#mp-grid)" />

          {/* Path */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
              opacity={0.7}
            />
          )}

          {/* Points (line/curve) */}
          {(cfg.pathType === "line" || cfg.pathType === "curve") &&
            cfg.points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={selectedPoint === i ? 7 : 5}
                onPointerDown={(e) => onPointPointerDown(e, i)}
                className={cn(
                  "cursor-grab active:cursor-grabbing",
                  selectedPoint === i ? "fill-primary" : "fill-foreground",
                )}
                stroke="white"
                strokeWidth={2}
              />
            ))}

          {/* Circle center + radius guide */}
          {cfg.pathType === "circle" && (
            <>
              <circle
                cx={cfg.circle.cx}
                cy={cfg.circle.cy}
                r={6}
                onPointerDown={(e) => onCenterPointerDown(e, "circle")}
                className="cursor-grab fill-primary active:cursor-grabbing"
                stroke="white"
                strokeWidth={2}
              />
              <line
                x1={cfg.circle.cx}
                y1={cfg.circle.cy}
                x2={cfg.circle.cx + cfg.circle.r}
                y2={cfg.circle.cy}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray="3 3"
                className="text-muted-foreground"
              />
            </>
          )}

          {/* Ellipse center + radii guides */}
          {cfg.pathType === "ellipse" && (
            <>
              <circle
                cx={cfg.ellipse.cx}
                cy={cfg.ellipse.cy}
                r={6}
                onPointerDown={(e) => onCenterPointerDown(e, "ellipse")}
                className="cursor-grab fill-primary active:cursor-grabbing"
                stroke="white"
                strokeWidth={2}
              />
              <line
                x1={cfg.ellipse.cx}
                y1={cfg.ellipse.cy}
                x2={cfg.ellipse.cx + cfg.ellipse.rx}
                y2={cfg.ellipse.cy}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray="3 3"
                className="text-muted-foreground"
              />
              <line
                x1={cfg.ellipse.cx}
                y1={cfg.ellipse.cy}
                x2={cfg.ellipse.cx}
                y2={cfg.ellipse.cy + cfg.ellipse.ry}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray="3 3"
                className="text-muted-foreground"
              />
            </>
          )}
        </svg>

        {/* Animated element overlay (driven by injected offset-path CSS) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="motion-element" style={animElStyle} />
        </div>

        {/* Empty-state hint */}
        {cfg.pathType !== "custom" && cfg.points.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
              Click anywhere to add points
            </span>
          </div>
        )}
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={cfg.playing ? "default" : "outline"}
          size="sm"
          onClick={() => updateConfig("playing", !cfg.playing)}
          className="h-8 gap-1.5 text-xs"
          aria-pressed={cfg.playing}
        >
          {cfg.playing ? (
            <>
              <Pause className="size-3.5" /> Pause
            </>
          ) : (
            <>
              <Play className="size-3.5" /> Play
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={replay}
          className="h-8 gap-1.5 text-xs"
        >
          <RotateCcw className="size-3.5" /> Replay
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-8 gap-1.5 text-xs"
        >
          <RotateCcw className="size-3.5" /> Reset
        </Button>
      </div>

      {/* Path type */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          <Waypoints className="mr-1 inline size-3" />
          Path type
        </Label>
        <div className="flex flex-wrap gap-1">
          {(["line", "curve", "circle", "ellipse", "custom"] as PathType[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  updateConfig("pathType", t);
                  setSelectedPoint(null);
                }}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  cfg.pathType === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={cfg.pathType === t}
              >
                {t}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Path-type-specific editors */}
      {cfg.pathType === "custom" ? (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            SVG path data
          </Label>
          <Textarea
            value={cfg.customPath}
            onChange={(e) => updateConfig("customPath", e.target.value)}
            placeholder="M 50 150 C 100 50, 300 250, 350 150"
            className="h-20 font-mono text-xs"
          />
        </div>
      ) : cfg.pathType === "circle" ? (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Radius: {cfg.circle.r}px
          </Label>
          <Slider
            value={[cfg.circle.r]}
            min={10}
            max={140}
            step={1}
            onValueChange={(v) =>
              setCfg((prev) => ({
                ...prev,
                circle: { ...prev.circle, r: v[0] },
              }))
            }
            aria-label="Circle radius"
          />
        </div>
      ) : cfg.pathType === "ellipse" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label className="w-16 text-xs text-muted-foreground">Radius X</Label>
            <Slider
              value={[cfg.ellipse.rx]}
              min={10}
              max={180}
              step={1}
              onValueChange={(v) =>
                setCfg((prev) => ({
                  ...prev,
                  ellipse: { ...prev.ellipse, rx: v[0] },
                }))
              }
              className="flex-1"
              aria-label="Ellipse X radius"
            />
            <span className="w-10 text-right text-xs text-muted-foreground">
              {cfg.ellipse.rx}px
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-16 text-xs text-muted-foreground">Radius Y</Label>
            <Slider
              value={[cfg.ellipse.ry]}
              min={10}
              max={130}
              step={1}
              onValueChange={(v) =>
                setCfg((prev) => ({
                  ...prev,
                  ellipse: { ...prev.ellipse, ry: v[0] },
                }))
              }
              className="flex-1"
              aria-label="Ellipse Y radius"
            />
            <span className="w-10 text-right text-xs text-muted-foreground">
              {cfg.ellipse.ry}px
            </span>
          </div>
        </div>
      ) : (
        /* line / curve points panel */
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              Points ({cfg.points.length}) — click canvas to add
            </Label>
          </div>
          {cfg.points.length > 0 && (
            <div className="flex flex-col gap-1">
              {cfg.points.map((p, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 rounded border border-border bg-card p-1.5",
                    selectedPoint === i && "border-primary",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPoint(i)}
                    className="flex items-center gap-1 text-xs text-foreground"
                  >
                    <Move className="size-3 text-muted-foreground" />
                    P{i + 1}
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    ({fmt(p.x)}, {fmt(p.y)})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-6 text-destructive hover:text-destructive"
                    onClick={() => removePoint(i)}
                    aria-label={`Remove point ${i + 1}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Animation controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">
            Duration: {cfg.duration}s
          </Label>
          <Slider
            value={[cfg.duration]}
            min={0.5}
            max={20}
            step={0.5}
            onValueChange={(v) => updateConfig("duration", v[0])}
            aria-label="Duration"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Timing</Label>
          <Select
            value={cfg.timing}
            onValueChange={(v) => updateConfig("timing", v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMING_FUNCTIONS.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">
            Iterations: {cfg.iteration === 0 ? "∞" : cfg.iteration}
          </Label>
          <Slider
            value={[cfg.iteration === 0 ? 0 : cfg.iteration]}
            min={0}
            max={10}
            step={1}
            onValueChange={(v) => updateConfig("iteration", v[0])}
            aria-label="Iterations (0 = infinite)"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Direction</Label>
          <Select
            value={cfg.direction}
            onValueChange={(v) => updateConfig("direction", v as Direction)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal" className="text-xs">normal</SelectItem>
              <SelectItem value="reverse" className="text-xs">reverse</SelectItem>
              <SelectItem value="alternate" className="text-xs">alternate</SelectItem>
              <SelectItem value="alternate-reverse" className="text-xs">alternate-reverse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* offset-rotate */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          offset-rotate
        </Label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateConfig("rotateAuto", true)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium",
              cfg.rotateAuto
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={cfg.rotateAuto}
          >
            auto
          </button>
          <button
            type="button"
            onClick={() => {
              updateConfig("rotateAuto", false);
              updateConfig("rotateDeg", 0);
            }}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium",
              !cfg.rotateAuto && cfg.rotateDeg === 0
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={!cfg.rotateAuto && cfg.rotateDeg === 0}
          >
            0deg
          </button>
          <button
            type="button"
            onClick={() => updateConfig("rotateAuto", false)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium",
              !cfg.rotateAuto && cfg.rotateDeg !== 0
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={!cfg.rotateAuto && cfg.rotateDeg !== 0}
          >
            custom
          </button>
          {!cfg.rotateAuto && (
            <>
              <Slider
                value={[cfg.rotateDeg]}
                min={-180}
                max={180}
                step={1}
                onValueChange={(v) => updateConfig("rotateDeg", v[0])}
                className="flex-1"
                aria-label="Custom rotate degrees"
              />
              <span className="w-12 text-right text-xs text-muted-foreground">
                {cfg.rotateDeg}deg
              </span>
            </>
          )}
        </div>
      </div>

      {/* Shape selector */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Animated shape
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => updateConfig("shape", s.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
                cfg.shape === s.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={cfg.shape === s.value}
            >
              <span
                className="inline-block size-3"
                style={shapeStyle(s.value, cfg.shapeColor)}
              />
              {s.label}
            </button>
          ))}
          <Input
            type="color"
            value={cfg.shapeColor.startsWith("#") ? cfg.shapeColor : "#6366f1"}
            onChange={(e) => updateConfig("shapeColor", e.target.value)}
            className="ml-1 size-7 cursor-pointer p-0.5"
            aria-label="Shape color"
          />
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
        <pre className="max-h-48 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
          <code>{generatedCss}</code>
        </pre>
      </div>

      {/* Path data */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Path data
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyText(pathData, "path")}
            className="h-7 gap-1.5 text-xs"
          >
            {copiedPath ? (
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
        <pre className="max-h-24 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
          <code>{pathData || "(empty)"}</code>
        </pre>
      </div>
    </div>
  );
}
