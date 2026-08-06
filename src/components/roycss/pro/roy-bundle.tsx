"use client";

/**
 * RoyBundle — bundle analyzer and optimizer.
 *
 * Self-contained "Analyze Bundle" button (mock), total bundle
 * size, breakdown by type (CSS / JS / Fonts / Images) rendered as
 * a donut chart mock, duplicate-code detection, dead CSS, oversized
 * bundles, before/after comparison, and "Export Report" action.
 *
 * Palette: emerald primary, amber / rose for warnings. No indigo /
 * blue. TS strict, zero `any`.
 */

import { useCallback, useState } from "react";
import {
  AlertTriangle,
  Box,
  Copy,
  FileImage,
  FileText,
  Gauge,
  Image as ImageIcon,
  Loader2,
  Package,
  PlayCircle,
  Type as TypeIcon,
  Download,
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

interface BundleType {
  key: string;
  label: string;
  kb: number;
  color: string;
  icon: typeof FileText;
}

interface Duplicate {
  id: string;
  pattern: string;
  files: string[];
  kb: number;
}

interface DeadClass {
  id: string;
  selector: string;
  occurrences: number;
  suggestion: string;
}

interface Oversized {
  id: string;
  name: string;
  kb: number;
  threshold: number;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const BUNDLE_TYPES: BundleType[] = [
  { key: "js", label: "JavaScript", kb: 318, color: "#10b981", icon: PlayCircle },
  { key: "css", label: "CSS", kb: 96, color: "#14b8a6", icon: FileText },
  { key: "fonts", label: "Fonts", kb: 124, color: "#f59e0b", icon: TypeIcon },
  { key: "images", label: "Images", kb: 248, color: "#f43f5e", icon: ImageIcon },
];

const DUPLICATES: Duplicate[] = [
  { id: "d1", pattern: "linear-gradient emerald", files: ["card.tsx", "button.tsx", "hero.tsx"], kb: 4.2 },
  { id: "d2", pattern: "@keyframes spin", files: ["loader.tsx", "icon.tsx", "spinner.tsx"], kb: 1.8 },
  { id: "d3", pattern: ".flex-center utility", files: ["grid.tsx", "modal.tsx"], kb: 0.6 },
];

const DEAD_CLASSES: DeadClass[] = [
  { id: "dc1", selector: ".btn-flat", occurrences: 0, suggestion: "Remove — superseded by .btn" },
  { id: "dc2", selector: ".card-old", occurrences: 0, suggestion: "Remove — replaced by Card component" },
  { id: "dc3", selector: ".text-muted-2", occurrences: 0, suggestion: "Remove — duplicate of .text-muted" },
  { id: "dc4", selector: ".legacy-shadow", occurrences: 0, suggestion: "Remove — uses deprecated shadow value" },
  { id: "dc5", selector: ".row-reverse-xs", occurrences: 0, suggestion: "Remove — no media query uses this" },
];

const OVERSIZED: Oversized[] = [
  { id: "o1", name: "vendor.chunk.js", kb: 412, threshold: 250 },
  { id: "o2", name: "fonts/inter-var.woff2", kb: 188, threshold: 120 },
];

const BEFORE_KB = BUNDLE_TYPES.reduce((s, t) => s + t.kb, 0);
const AFTER_KB = Math.round(BEFORE_KB * 0.72);

// ─── Donut chart mock ────────────────────────────────────────────────────

function Donut({ segments }: { segments: BundleType[] }) {
  const total = segments.reduce((s, seg) => s + seg.kb, 0);
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  // Precompute cumulative offsets so we never mutate during render.
  const arcs = segments.reduce<
    Array<{ seg: BundleType; dash: number; offset: number }>
  >((acc, seg) => {
    const dash = (seg.kb / total) * circ;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    acc.push({ seg, dash, offset });
    return acc;
  }, []);
  return (
    <div className="relative size-40">
      <svg viewBox="0 0 160 160" className="size-40 -rotate-90">
        {arcs.map(({ seg, dash, offset }) => (
          <circle
            key={seg.key}
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="20"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-muted-foreground text-[10px] uppercase tracking-wide">Total</span>
        <span className="text-2xl font-bold tabular-nums">{(total / 1024).toFixed(2)}MB</span>
        <span className="text-muted-foreground text-[10px]">{total}KB</span>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────

export function RoyBundle() {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const analyze = useCallback(() => {
    setAnalyzing(true);
    setAnalyzed(false);
    window.setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
      toast({ title: "Bundle analyzed", description: `${BEFORE_KB}KB across ${BUNDLE_TYPES.length} asset types.` });
    }, 1400);
  }, [toast]);

  const exportReport = useCallback(() => {
    toast({
      title: "Report exported",
      description: `roycss-bundle-report.json · ${BEFORE_KB}KB → ${AFTER_KB}KB (-${Math.round((1 - AFTER_KB / BEFORE_KB) * 100)}%)`,
    });
  }, [toast]);

  const savingsPct = Math.round((1 - AFTER_KB / BEFORE_KB) * 100);
  const duplicateKb = DUPLICATES.reduce((s, d) => s + d.kb, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Package className="size-5" />
              </div>
              <div>
                <CardTitle>Bundle Optimizer</CardTitle>
                <CardDescription>
                  Analyze asset sizes, dead CSS, and duplicate code.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={analyze} disabled={analyzing} className="gap-1.5">
                {analyzing ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                {analyzing ? "Analyzing…" : "Analyze Bundle"}
              </Button>
              <Button variant="outline" size="sm" onClick={exportReport} className="gap-1.5">
                <Download className="size-3.5" /> Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Big number + donut + before/after */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4" /> Total Size
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <Donut segments={BUNDLE_TYPES} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
              {BUNDLE_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.key} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: t.color }} />
                    <Icon className="text-muted-foreground size-3" />
                    <span className="font-medium">{t.label}</span>
                    <span className="text-muted-foreground tabular-nums">{t.kb}KB</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Before / After</CardTitle>
            <CardDescription>Estimated savings after optimization.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current</span>
                <span className="font-semibold tabular-nums">{BEFORE_KB}KB</span>
              </div>
              <div className="bg-muted h-3 overflow-hidden rounded-full">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Optimized</span>
                <span className="font-semibold tabular-nums">{AFTER_KB}KB</span>
              </div>
              <div className="bg-muted h-3 overflow-hidden rounded-full">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(AFTER_KB / BEFORE_KB) * 100}%` }} />
              </div>
            </div>
            <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-between rounded-lg px-3 py-2 text-sm">
              <span>Savings</span>
              <span className="font-bold tabular-nums">
                −{BEFORE_KB - AFTER_KB}KB ({savingsPct}%)
              </span>
            </div>
            {!analyzed && !analyzing && (
              <p className="text-muted-foreground text-center text-xs">
                Run an analysis to refresh the recommendation.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Asset types</span>
              <span className="font-semibold tabular-nums">{BUNDLE_TYPES.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Duplicates</span>
              <span className="font-semibold tabular-nums">{DUPLICATES.length} · {duplicateKb.toFixed(1)}KB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dead CSS classes</span>
              <span className="font-semibold tabular-nums">{DEAD_CLASSES.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Oversized assets</span>
              <span className="font-semibold tabular-nums">{OVERSIZED.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Potential savings</span>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">{savingsPct}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duplicates + dead CSS + oversized */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Copy className="size-4" /> Duplicate Code
            </CardTitle>
            <CardDescription>{duplicateKb.toFixed(1)}KB duplicated across files.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {DUPLICATES.map((d) => (
              <div key={d.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-mono text-xs">{d.pattern}</p>
                  <Badge variant="secondary" className="tabular-nums">{d.kb}KB</Badge>
                </div>
                <p className="text-muted-foreground mt-1 truncate text-[11px]">{d.files.join(" · ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" /> Dead CSS
            </CardTitle>
            <CardDescription>Unused selectors — safe to remove.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {DEAD_CLASSES.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-md border p-2.5">
                <code className="text-foreground truncate text-xs">{d.selector}</code>
                <p className="text-muted-foreground ml-auto truncate text-[11px]">{d.suggestion}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4" /> Oversized Assets
            </CardTitle>
            <CardDescription>Above the 250KB / 120KB thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {OVERSIZED.map((o) => (
              <div key={o.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-mono text-xs">{o.name}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {o.kb}KB / {o.threshold}KB
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (o.kb / (o.threshold * 1.5)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="bg-muted/60 flex items-center gap-2 rounded-md p-2.5 text-xs">
              <Box className="text-muted-foreground size-3.5" />
              <span className="text-muted-foreground">Consider code-splitting vendor and subsetting fonts.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall optimization progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optimization Progress</CardTitle>
          <CardDescription>Estimated impact of each applied fix.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Remove dead CSS</span>
              <span className="text-muted-foreground tabular-nums">−14KB</span>
            </div>
            <Progress value={90} className="h-1.5" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>De-duplicate code</span>
              <span className="text-muted-foreground tabular-nums">−{duplicateKb.toFixed(1)}KB</span>
            </div>
            <Progress value={60} className="h-1.5" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Code-split vendor chunk</span>
              <span className="text-muted-foreground tabular-nums">−162KB</span>
            </div>
            <Progress value={40} className="h-1.5" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Subset font glyphs</span>
              <span className="text-muted-foreground tabular-nums">−68KB</span>
            </div>
            <Progress value={20} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
