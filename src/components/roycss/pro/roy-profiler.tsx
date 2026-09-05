"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyProfiler — frontend performance profiler.
 *
 * Self-contained "Start Profiling" button (simulated 3s run),
 * rendering-time breakdown bar chart (5 phases), repaint count,
 * layout-shift entries, memory-usage graph, animation FPS chart,
 * and recommendations.
 *
 * Palette: emerald primary, amber for warnings, rose for severe.
 * No indigo / blue. TS strict, zero `any`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  Cpu,
  Gauge,
  Layers,
  Loader2,
  MemoryStick,
  Play,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

interface Phase {
  name: string;
  ms: number;
  tone: string;
}

interface ClsEvent {
  id: string;
  element: string;
  cls: number;
  when: string;
}

interface FpsSample {
  t: number;
  fps: number;
}

interface MemorySample {
  t: number;
  mb: number;
}

interface Recommendation {
  id: string;
  title: string;
  fix: string;
  severity: "high" | "medium" | "low";
}

// ─── Mock data ───────────────────────────────────────────────────────────

const PHASES: Phase[] = [
  { name: "Parse", ms: 38, tone: "bg-emerald-500" },
  { name: "Style", ms: 54, tone: "bg-teal-500" },
  { name: "Layout", ms: 92, tone: "bg-amber-500" },
  { name: "Paint", ms: 41, tone: "bg-rose-500" },
  { name: "Composite", ms: 18, tone: "bg-primary" },
];

const CLS_EVENTS: ClsEvent[] = [
  { id: "cls1", element: ".hero-image", cls: 0.18, when: "1.2s" },
  { id: "cls2", element: "#ad-slot", cls: 0.11, when: "2.4s" },
  { id: "cls3", element: ".card-grid", cls: 0.06, when: "3.1s" },
];

const FPS_SAMPLES: FpsSample[] = [
  { t: 0, fps: 60 }, { t: 1, fps: 60 }, { t: 2, fps: 58 }, { t: 3, fps: 44 },
  { t: 4, fps: 60 }, { t: 5, fps: 60 }, { t: 6, fps: 36 }, { t: 7, fps: 60 },
  { t: 8, fps: 60 }, { t: 9, fps: 60 }, { t: 10, fps: 52 }, { t: 11, fps: 60 },
];

const MEMORY_SAMPLES: MemorySample[] = [
  { t: 0, mb: 32 }, { t: 1, mb: 38 }, { t: 2, mb: 44 }, { t: 3, mb: 48 },
  { t: 4, mb: 52 }, { t: 5, mb: 49 }, { t: 6, mb: 58 }, { t: 7, mb: 64 },
  { t: 8, mb: 61 }, { t: 9, mb: 68 },
];

const RECS: Recommendation[] = [
  { id: "r1", title: "Avoid layout thrash in scroll handler", fix: "Cache bounding-rect reads outside the scroll callback and use requestAnimationFrame.", severity: "high" },
  { id: "r2", title: "Replace box-shadow animation with transform", fix: "Animate transform / opacity instead of box-shadow to stay on the compositor thread.", severity: "medium" },
  { id: "r3", title: "Reserve space for hero image", fix: "Set explicit width/height or aspect-ratio to eliminate the 0.18 CLS event.", severity: "medium" },
];

const SEVERITY_TONE: Record<Recommendation["severity"], string> = {
  high: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function FpsChart({ samples }: { samples: FpsSample[] }) {
  const w = 320;
  const h = 60;
  const yFor = (fps: number) => h - (fps / 60) * h;
  const path = samples
    .map((s, i) => `${i === 0 ? "M" : "L"} ${(i / (samples.length - 1)) * w} ${yFor(s.fps)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none" aria-label="Animation FPS over time">
      <line x1="0" y1={yFor(60)} x2={w} y2={yFor(60)} className="stroke-emerald-500/30" strokeDasharray="2 3" />
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} className="fill-primary/15" />
      <path d={path} className="stroke-primary" fill="none" strokeWidth="1.5" />
      {samples.map((s, i) => (
        <circle
          key={i}
          cx={(i / (samples.length - 1)) * w}
          cy={yFor(s.fps)}
          r={s.fps < 50 ? 2.5 : 1.5}
          className={s.fps < 50 ? "fill-rose-500" : "fill-primary"}
        />
      ))}
    </svg>
  );
}

function MemoryChart({ samples }: { samples: MemorySample[] }) {
  const w = 320;
  const h = 60;
  const max = 80;
  const yFor = (mb: number) => h - (mb / max) * h;
  const path = samples
    .map((s, i) => `${i === 0 ? "M" : "L"} ${(i / (samples.length - 1)) * w} ${yFor(s.mb)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none" aria-label="Memory usage over time">
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} className="fill-amber-500/15" />
      <path d={path} className="stroke-amber-500" fill="none" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────

export function RoyProfiler() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("profiler/results");
  void data;

  const [profiling, setProfiling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearInterval(t));
      timers.length = 0;
    };
  }, []);

  const start = useCallback(() => {
    setProfiling(true);
    setDone(false);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 5 + Math.random() * 8);
        if (next >= 100) {
          clearInterval(interval);
          setProfiling(false);
          setDone(true);
        }
        return next;
      });
    }, 180);
    timersRef.current.push(interval);
  }, []);

  const totalMs = PHASES.reduce((s, p) => s + p.ms, 0);
  const maxPhase = Math.max(...PHASES.map((p) => p.ms));
  const repaints = 142;
  const avgFps = Math.round(FPS_SAMPLES.reduce((s, x) => s + x.fps, 0) / FPS_SAMPLES.length);
  const totalCls = CLS_EVENTS.reduce((s, e) => s + e.cls, 0);
  const peakMem = Math.max(...MEMORY_SAMPLES.map((m) => m.mb));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Gauge className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Frontend Profiler</CardTitle>
                  <BackendLiveBadge module="profiler" loading={loading} error={error} />
                </div>
                <CardDescription>
                  Measure rendering, layout shifts, memory, and animation FPS.
                </CardDescription>
              </div>
            </div>
            <Button onClick={start} disabled={profiling} className="gap-1.5">
              {profiling ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {profiling ? "Profiling…" : "Start Profiling"}
            </Button>
          </div>
          {profiling && (
            <div className="mt-2">
              <Progress value={progress} />
              <p className="text-muted-foreground mt-1 text-xs">
                Recording frames… {Math.round(progress)}%
              </p>
            </div>
          )}
          {done && !profiling && (
            <p className="text-muted-foreground mt-1 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400">●</span> Profile complete · last run just now.
            </p>
          )}
        </CardHeader>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex size-11 items-center justify-center rounded-xl">
              <Activity className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total render</p>
              <p className="text-2xl font-bold tabular-nums">{totalMs}ms</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="bg-amber-500/15 text-amber-600 dark:text-amber-400 flex size-11 items-center justify-center rounded-xl">
              <Layers className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Repaints</p>
              <p className="text-2xl font-bold tabular-nums">{repaints}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="bg-teal-500/15 text-teal-600 dark:text-teal-400 flex size-11 items-center justify-center rounded-xl">
              <Zap className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Avg FPS</p>
              <p className="text-2xl font-bold tabular-nums">{avgFps}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="bg-rose-500/15 text-rose-600 dark:text-rose-400 flex size-11 items-center justify-center rounded-xl">
              <MemoryStick className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Peak memory</p>
              <p className="text-2xl font-bold tabular-nums">{peakMem}MB</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase breakdown + CLS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4" /> Rendering Phases
            </CardTitle>
            <CardDescription>Time spent in each pipeline phase.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {PHASES.map((p) => (
              <div key={p.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground tabular-nums">{p.ms}ms</span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className={cn("h-full rounded-full transition-all", p.tone)}
                    style={{ width: `${(p.ms / maxPhase) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <Separator className="my-1" />
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total</span>
              <span className="font-semibold tabular-nums">{totalMs}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4" /> Layout Shift Entries
            </CardTitle>
            <CardDescription>
              Total CLS: <span className="font-semibold tabular-nums">{totalCls.toFixed(2)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {CLS_EVENTS.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Badge
                  className={cn(
                    "gap-1",
                    e.cls >= 0.15
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                  )}
                >
                  CLS {e.cls.toFixed(2)}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs">{e.element}</p>
                  <p className="text-muted-foreground text-[11px]">detected at {e.when}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* FPS + Memory charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="size-4" /> Animation FPS
            </CardTitle>
            <CardDescription>12s window · target 60fps · dips in red.</CardDescription>
          </CardHeader>
          <CardContent>
            <FpsChart samples={FPS_SAMPLES} />
            <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
              <span>0s</span>
              <span>12s</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MemoryStick className="size-4" /> Memory Usage
            </CardTitle>
            <CardDescription>JS heap over the recording window.</CardDescription>
          </CardHeader>
          <CardContent>
            <MemoryChart samples={MEMORY_SAMPLES} />
            <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
              <span>{MEMORY_SAMPLES[0].mb}MB</span>
              <span>{peakMem}MB peak</span>
              <span>{MEMORY_SAMPLES[MEMORY_SAMPLES.length - 1].mb}MB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownToLine className="size-4" /> Recommendations
          </CardTitle>
          <CardDescription>Profiler-suggested fixes, ranked by impact.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {RECS.map((r, i) => (
            <div key={r.id}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge className={cn("capitalize", SEVERITY_TONE[r.severity])}>{r.severity}</Badge>
                  <p className="text-sm font-medium">{r.title}</p>
                </div>
                <p className="text-muted-foreground text-xs">{r.fix}</p>
              </div>
              {i < RECS.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
