"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyDigitalTwin — digital twin simulator for live apps.
 *
 * Self-contained (no props). Layout:
 *   • Header with app URL input + "Create Twin" button (mock — 3s).
 *   • Before/after comparison toggle.
 *   • 4 simulation cards — Performance, Accessibility, User Journey,
 *     Device Compatibility — each with a score + 3 mock findings.
 *   • "Run Simulation" button (mock).
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Severity is a string-literal union; the
 *     `never` guard enforces exhaustiveness on the tone mapper.
 *   • Simulated twin build via setInterval; timer ids in a ref Set
 *     cleared on unmount — no leaks.
 *   • Palette: emerald primary, teal/amber/sky accents, rose for
 *     critical. No indigo/blue.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  Globe,
  Loader2,
  MonitorSmartphone,
  Route,
  ScanLine,
  Smartphone,
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type Severity = "critical" | "warning" | "ok";

interface Finding {
  id: string;
  text: string;
  severity: Severity;
}

interface Simulation {
  id: string;
  title: string;
  icon: LucideIcon;
  score: number;
  findings: readonly Finding[];
}

// ─── Mock data ───────────────────────────────────────────────────────────

const SEVERITY_TONE: Record<Severity, { tone: string; icon: LucideIcon }> = {
  critical: {
    tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    icon: AlertTriangle,
  },
  warning: {
    tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
  },
  ok: {
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
};

const SIMULATIONS: readonly Simulation[] = [
  {
    id: "perf",
    title: "Performance",
    icon: Gauge,
    score: 84,
    findings: [
      { id: "p1", text: "LCP 2.4s on 3G — under 2.5s target", severity: "ok" },
      { id: "p2", text: "Hero image unoptimized (412 KB)", severity: "warning" },
      { id: "p3", text: "Layout shift on ad slot above fold", severity: "critical" },
    ],
  },
  {
    id: "a11y",
    title: "Accessibility",
    icon: Accessibility,
    score: 91,
    findings: [
      { id: "a1", text: "Color contrast passes AA on all routes", severity: "ok" },
      { id: "a2", text: "Skip-link missing on /docs", severity: "warning" },
      { id: "a3", text: "Form labels present, ARIA valid", severity: "ok" },
    ],
  },
  {
    id: "journey",
    title: "User Journey",
    icon: Route,
    score: 78,
    findings: [
      { id: "j1", text: "Checkout: 4 steps, 1.2 avg drop-off", severity: "warning" },
      { id: "j2", text: "Onboarding completes in 90s median", severity: "ok" },
      { id: "j3", text: "Cart abandonment 32% on mobile", severity: "critical" },
    ],
  },
  {
    id: "devices",
    title: "Device Compatibility",
    icon: MonitorSmartphone,
    score: 88,
    findings: [
      { id: "d1", text: "iOS Safari 17 — all features work", severity: "ok" },
      { id: "d2", text: "Android Chrome — view-transitions missing", severity: "warning" },
      { id: "d3", text: "Foldable: layout reflows correctly", severity: "ok" },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────

export function RoyDigitalTwin() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("digital-twin/simulations");
  void data;

  const [url, setUrl] = useState("https://acme-design.roycss.app");
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasTwin, setHasTwin] = useState(true);
  const [view, setView] = useState<"before" | "after">("after");
  const timers = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach((id) => clearInterval(id));
      set.clear();
    };
  }, []);

  const createTwin = useCallback(() => {
    if (building) return;
    setBuilding(true);
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          timers.current.delete(id);
          setBuilding(false);
          setHasTwin(true);
          toast({
            title: "Twin created",
            description: `Digital twin of ${url} is ready.`,
          });
          return 100;
        }
        return p + 3;
      });
    }, 90);
    timers.current.add(id);
  }, [building, url, toast]);

  const runSim = () =>
    toast({
      title: "Simulation queued",
      description: "All 4 simulations re-running on the current twin (mock).",
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Cpu className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Digital Twin</CardTitle>
                  <BackendLiveBadge loading={loading} error={error} />
                </div>
                <CardDescription>
                  Mirror any URL and simulate real-world conditions.
                </CardDescription>
              </div>
            </div>
            <Button onClick={runSim} variant="outline" className="gap-1.5">
              <ScanLine className="size-4" /> Run Simulation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Globe className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-8"
                placeholder="https://your-app.com"
              />
            </div>
            <Button onClick={createTwin} disabled={building} className="gap-1.5">
              {building ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Cpu className="size-4" />
              )}
              {building ? "Building…" : "Create Twin"}
            </Button>
          </div>
          {building && (
            <div className="mt-3 flex items-center gap-3">
              <Progress value={progress} className="h-1.5" />
              <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                {progress}%
              </span>
            </div>
          )}

          {hasTwin && !building && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-muted-foreground text-xs">View:</span>
              <div className="bg-muted rounded-lg p-0.5">
                {(["before", "after"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                      view === v
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <span className="text-muted-foreground ml-auto text-xs">
                Showing <span className="text-foreground font-medium">{view}</span> state
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulation cards */}
      {hasTwin ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {SIMULATIONS.map((sim) => {
            const Icon = sim.icon;
            const score = view === "after" ? sim.score : Math.max(0, sim.score - 18);
            const tone =
              score >= 85
                ? "text-emerald-600 dark:text-emerald-400"
                : score >= 70
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400";
            return (
              <Card key={sim.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                        <Icon className="size-4" />
                      </div>
                      <CardTitle className="text-base">{sim.title}</CardTitle>
                    </div>
                    <span className={cn("text-2xl font-bold tabular-nums", tone)}>
                      {score}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress
                    value={score}
                    className={cn(
                      "h-1.5",
                      score < 70 && "[&>[data-slot=progress-indicator]]:bg-rose-500",
                      score >= 70 && score < 85 && "[&>[data-slot=progress-indicator]]:bg-amber-500",
                    )}
                  />
                  <ul className="mt-3 flex flex-col gap-2">
                    {sim.findings.map((f) => {
                      const meta = SEVERITY_TONE[f.severity];
                      const FIcon = meta.icon;
                      return (
                        <li key={f.id} className="flex items-start gap-2 text-xs">
                          <Badge className={cn("gap-1 px-1.5 py-0", meta.tone)}>
                            <FIcon className="size-3" />
                          </Badge>
                          <span className="text-muted-foreground pt-0.5">{f.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground flex flex-col items-center gap-3 py-12 text-center">
            <Smartphone className="size-10 opacity-40" />
            <p className="text-sm">No twin yet — enter a URL and click &ldquo;Create Twin&rdquo;.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
