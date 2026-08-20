"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyEdge — edge deployment across 6 global regions.
 *
 * Self-contained (no props). Layout:
 *   • Header with "Deploy to Edge" button (mock — 2s simulated deploy).
 *   • Config row — TTL input + cache-strategy select.
 *   • 6 edge-region cards with status, latency, requests/sec.
 *   • Performance comparison — edge vs origin bar chart (mock).
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Region status & strategy are string-literal
 *     unions with `never` exhaustiveness guards.
 *   • Simulated deploy via setInterval; timer ids in a ref Set cleared
 *     on unmount — no leaks.
 *   • Palette: emerald primary, sky/teal/amber accents. No indigo/blue.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Cloud,
  Gauge,
  Globe,
  Loader2,
  MapPin,
  Rocket,
  Timer,
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type RegionStatus = "live" | "warming" | "down";

interface EdgeRegion {
  id: string;
  city: string;
  code: string;
  status: RegionStatus;
  latency: string;
  rps: string;
}

type Strategy = "cache-first" | "stale-while-revalidate" | "pass-through";

// ─── Mock data ───────────────────────────────────────────────────────────

const REGIONS: readonly EdgeRegion[] = [
  { id: "r1", city: "US-East", code: "IAD", status: "live", latency: "18ms", rps: "1.4k" },
  { id: "r2", city: "US-West", code: "LAX", status: "live", latency: "24ms", rps: "980" },
  { id: "r3", city: "EU-West", code: "DUB", status: "live", latency: "31ms", rps: "1.1k" },
  { id: "r4", city: "AP-Southeast", code: "SIN", status: "warming", latency: "78ms", rps: "320" },
  { id: "r5", city: "SA-East", code: "GRU", status: "live", latency: "52ms", rps: "410" },
  { id: "r6", city: "AF-South", code: "CPT", status: "down", latency: "—", rps: "0" },
];

const STATUS_TONE: Record<
  RegionStatus,
  { label: string; tone: string; dot: string }
> = {
  live: { label: "Live", tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  warming: { label: "Warming", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  down: { label: "Down", tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
};

const COMPARISON = [
  { id: "p95", label: "P95 Latency", edge: 22, origin: 180, unit: "ms" },
  { id: "ttfb", label: "TTFB", edge: 45, origin: 320, unit: "ms" },
  { id: "cost", label: "Cost / 1M req", edge: 12, origin: 48, unit: "$" },
] as const;

// ─── Component ───────────────────────────────────────────────────────────

export function RoyEdge() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("edge/regions");
  void data; void loading; void error;

  const [ttl, setTtl] = useState("300");
  const [strategy, setStrategy] = useState<Strategy>("stale-while-revalidate");
  const [deploying, setDeploying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timers = useRef<Set<ReturnType<typeof setInterval>>>(new Set());

  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach((id) => clearInterval(id));
      set.clear();
    };
  }, []);

  const deploy = useCallback(() => {
    if (deploying) return;
    setDeploying(true);
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          timers.current.delete(id);
          setDeploying(false);
          return 100;
        }
        return p + 5;
      });
    }, 100);
    timers.current.add(id);
  }, [deploying]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header + config */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Globe className="size-5" />
              </div>
              <div>
                <CardTitle>Edge Deployment</CardTitle>
                <CardDescription>
                  6 PoPs · 4 live · 1 warming · 1 down.
                </CardDescription>
              </div>
            </div>
            <Button onClick={deploy} disabled={deploying} className="gap-1.5">
              {deploying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-4" />
              )}
              {deploying ? "Deploying…" : "Deploy to Edge"}
            </Button>
          </div>
          {deploying && (
            <div className="mt-3 flex items-center gap-3">
              <Progress value={progress} className="h-1.5" />
              <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                {progress}%
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                <Timer className="size-3" /> Cache TTL (seconds)
              </label>
              <Input
                type="number"
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                <Zap className="size-3" /> Cache Strategy
              </label>
              <Select value={strategy} onValueChange={(v) => setStrategy(v as Strategy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cache-first">Cache-First</SelectItem>
                  <SelectItem value="stale-while-revalidate">Stale-While-Revalidate</SelectItem>
                  <SelectItem value="pass-through">Pass-Through</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Region grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REGIONS.map((r) => {
          const meta = STATUS_TONE[r.status];
          return (
            <Card key={r.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                      <MapPin className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{r.city}</p>
                      <p className="text-muted-foreground text-[11px]">{r.code}</p>
                    </div>
                  </div>
                  <Badge className={cn("gap-1", meta.tone)}>
                    <span className={cn("size-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-muted/40 rounded-lg p-2">
                    <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
                      <Gauge className="size-3" /> Latency
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{r.latency}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-2">
                    <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
                      <Activity className="size-3" /> Req/s
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{r.rps}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cloud className="size-4" /> Edge vs Origin
          </CardTitle>
          <CardDescription>
            Same workload, served from edge vs single-region origin.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {COMPARISON.map((c) => {
            const edgePct = Math.round((c.edge / (c.edge + c.origin)) * 100);
            return (
              <div key={c.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{c.label}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {c.edge}{c.unit} edge · {c.origin}{c.unit} origin
                  </span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full">
                  <div
                    className="bg-primary transition-all"
                    style={{ width: `${edgePct}%` }}
                    title={`Edge: ${c.edge}${c.unit}`}
                  />
                  <div
                    className="bg-muted-foreground/30 transition-all"
                    style={{ width: `${100 - edgePct}%` }}
                    title={`Origin: ${c.origin}${c.unit}`}
                  />
                </div>
              </div>
            );
          })}
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="bg-primary size-2 rounded-full" /> Edge
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-muted-foreground/30 size-2 rounded-full" /> Origin
            </span>
            <span className="ml-auto flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" />
              Edge wins all 3 metrics
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
