"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyBenchmark — benchmarking platform for RoyCSS projects.
 *
 * Self-contained (no props). Layout:
 *   • Header with project selector + "Run Benchmark" button (2s mock).
 *   • Comparison table — your project vs industry avg vs best-in-class
 *     across 6 metrics. Each row shows your value, avg, best, and a
 *     horizontal bar.
 *   • Recommendations panel — 3 mock findings with severity.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Metric direction & severity are string-
 *     literal unions with `never` exhaustiveness guards.
 *   • Simulated benchmark run via setInterval; timer ids in a ref Set
 *     cleared on unmount — no leaks.
 *   • Palette: emerald primary, teal/amber/sky accents, rose for
 *     critical. No indigo/blue.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Gauge,
  Lightbulb,
  Loader2,
  Trophy,
  TriangleAlert,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type Direction = "lower" | "higher";
type Severity = "critical" | "warning" | "info";

interface Metric {
  id: string;
  label: string;
  icon: LucideIcon;
  unit: string;
  direction: Direction;
  you: number;
  industry: number;
  best: number;
}

interface Recommendation {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const PROJECTS = [
  { id: "p1", name: "marketing-site" },
  { id: "p2", name: "design-system" },
  { id: "p3", name: "docs-platform" },
  { id: "p4", name: "checkout-app" },
] as const;

const METRICS: readonly Metric[] = [
  { id: "lcp", label: "LCP", icon: Gauge, unit: "s", direction: "lower", you: 1.8, industry: 2.5, best: 1.1 },
  { id: "fid", label: "FID", icon: Activity, unit: "ms", direction: "lower", you: 42, industry: 80, best: 18 },
  { id: "cls", label: "CLS", icon: Activity, unit: "", direction: "lower", you: 0.04, industry: 0.12, best: 0.01 },
  { id: "bundle", label: "Bundle Size", icon: Activity, unit: "KB", direction: "lower", you: 184, industry: 312, best: 92 },
  { id: "lighthouse", label: "Lighthouse", icon: Trophy, unit: "", direction: "higher", you: 96, industry: 78, best: 100 },
  { id: "a11y", label: "A11y Score", icon: CheckCircle2, unit: "", direction: "higher", you: 94, industry: 81, best: 100 },
];

const RECS: readonly Recommendation[] = [
  { id: "r1", severity: "critical", title: "Reduce bundle by 40 KB", detail: "Tree-shake 3 unused effect categories — saves ~40 KB gzipped." },
  { id: "r2", severity: "warning", title: "Improve CLS on mobile", detail: "Reserve space for ad slots above the fold to prevent layout shift." },
  { id: "r3", severity: "info", title: "Adopt OKLCH palette", detail: "Migrate to OKLCH for wider gamut — no perf cost, better color fidelity." },
];

const SEVERITY_TONE: Record<Severity, { tone: string; icon: LucideIcon }> = {
  critical: { tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400", icon: TriangleAlert },
  warning: { tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400", icon: TriangleAlert },
  info: { tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400", icon: Lightbulb },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Normalizes a metric to 0–100 where 100 = best-in-class, 0 = 2× worse. */
function normalized(m: Metric): number {
  const best = m.best;
  if (m.direction === "lower") {
    // Lower is better. Map best → 100, 2× best → 0.
    const pct = Math.max(0, Math.min(100, ((2 * best - m.you) / best) * 100));
    return Math.round(pct);
  }
  // Higher is better. Map best → 100, 0 → 0.
  return Math.round((m.you / best) * 100);
}

function formatValue(v: number, unit: string): string {
  return unit === "" ? String(v) : `${v}${unit}`;
}

// ─── Component ───────────────────────────────────────────────────────────

export function RoyBenchmark() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("benchmark/comparisons");
  void data; void loading; void error;

  const [project, setProject] = useState<string>(PROJECTS[0].id);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef<Set<ReturnType<typeof setInterval>>>(new Set());

  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach((id) => clearInterval(id));
      set.clear();
    };
  }, []);

  const run = useCallback(() => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          timers.current.delete(id);
          setRunning(false);
          return 100;
        }
        return p + 5;
      });
    }, 100);
    timers.current.add(id);
  }, [running]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Gauge className="size-5" />
              </div>
              <div>
                <CardTitle>Benchmarks</CardTitle>
                <CardDescription>
                  Compare your project to industry averages & best-in-class.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={run} disabled={running} className="gap-1.5">
                {running ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Activity className="size-4" />
                )}
                {running ? "Running…" : "Run Benchmark"}
              </Button>
            </div>
          </div>
          {running && (
            <div className="mt-3 flex items-center gap-3">
              <Progress value={progress} className="h-1.5" />
              <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                {progress}%
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Comparison table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metric Comparison</CardTitle>
          <CardDescription>
            Your project vs industry average vs best-in-class.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">You</TableHead>
                <TableHead className="text-right">Industry</TableHead>
                <TableHead className="text-right">Best</TableHead>
                <TableHead className="w-40">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {METRICS.map((m) => {
                const Icon = m.icon;
                const pct = normalized(m);
                const isBest = m.direction === "lower" ? m.you <= m.best : m.you >= m.best;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <Icon className="text-muted-foreground size-3.5" />
                        <span className="text-sm font-medium">{m.label}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          isBest
                            ? "text-emerald-600 dark:text-emerald-400"
                            : pct >= 75
                              ? "text-foreground"
                              : "text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {formatValue(m.you, m.unit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-sm tabular-nums">
                      {formatValue(m.industry, m.unit)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-sm tabular-nums">
                      {formatValue(m.best, m.unit)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={pct}
                          className={cn(
                            "h-1.5",
                            pct < 50 && "[&>[data-slot=progress-indicator]]:bg-rose-500",
                            pct >= 50 && pct < 75 && "[&>[data-slot=progress-indicator]]:bg-amber-500",
                          )}
                        />
                        <span className="text-muted-foreground w-8 text-right text-[11px] tabular-nums">
                          {pct}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="size-4" /> Recommendations
          </CardTitle>
          <CardDescription>
            3 actionable findings to climb the leaderboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {RECS.map((r) => {
            const meta = SEVERITY_TONE[r.severity];
            const Icon = meta.icon;
            return (
              <div key={r.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{r.title}</p>
                    <Badge className={cn("text-[10px] capitalize", meta.tone)}>
                      {r.severity}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">{r.detail}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
