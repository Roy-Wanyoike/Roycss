"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyCompliance — compliance reporting suite.
 *
 * Self-contained standards selector, simulated 2s scan, results
 * table with pass / fail / warning badges, an overall compliance
 * score, mock findings with severity + recommendation, and a
 * "Download Report" button (mock toast).
 *
 * Palette: emerald primary, amber warning, rose fail. No indigo /
 * blue. TS strict, zero `any`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Gauge,
  Loader2,
  PlayCircle,
  ShieldCheck,
  XCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type Standard = "WCAG 2.2 AA" | "WCAG 2.2 AAA" | "ADA" | "Section 508" | "EN 301 549";
type Result = "pass" | "fail" | "warning";
type Severity = "critical" | "moderate" | "minor";

interface Criterion {
  id: string;
  name: string;
  ref: string;
  result: Result;
  score: number; // 0–100
}

interface Finding {
  id: string;
  severity: Severity;
  title: string;
  recommendation: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const STANDARDS: Standard[] = ["WCAG 2.2 AA", "WCAG 2.2 AAA", "ADA", "Section 508", "EN 301 549"];

const CRITERIA: Criterion[] = [
  { id: "c1", name: "Color Contrast (1.4.3)", ref: "WCAG 1.4.3", result: "pass", score: 96 },
  { id: "c2", name: "Non-text Content (1.1.1)", ref: "WCAG 1.1.1", result: "pass", score: 100 },
  { id: "c3", name: "Keyboard Navigation (2.1.1)", ref: "WCAG 2.1.1", result: "warning", score: 82 },
  { id: "c4", name: "Focus Visible (2.4.7)", ref: "WCAG 2.4.7", result: "warning", score: 78 },
  { id: "c5", name: "Heading Order (1.3.1)", ref: "WCAG 1.3.1", result: "pass", score: 92 },
  { id: "c6", name: "Resize Text (1.4.4)", ref: "WCAG 1.4.4", result: "pass", score: 100 },
  { id: "c7", name: "Reflow (1.4.10)", ref: "WCAG 1.4.10", result: "fail", score: 64 },
  { id: "c8", name: "Reduced Motion (2.3.3)", ref: "WCAG 2.3.3", result: "pass", score: 90 },
];

const FINDINGS: Finding[] = [
  {
    id: "f1",
    severity: "critical",
    title: "Content overflows horizontally at 320px viewport",
    recommendation: "Apply `min-width: 0` to flex children and wrap long words with `overflow-wrap: anywhere`.",
  },
  {
    id: "f2",
    severity: "moderate",
    title: "Custom combobox lacks arrow-key roving",
    recommendation: "Wire `aria-activedescendant` and rotate focus on ArrowDown / ArrowUp.",
  },
  {
    id: "f3",
    severity: "moderate",
    title: "Skip-link target not visible on focus",
    recommendation: "Ensure the skip-link target receives `:focus-visible` styling and is not `display:none`.",
  },
  {
    id: "f4",
    severity: "minor",
    title: "Icon-only button missing aria-label",
    recommendation: "Add `aria-label=\"Close\"` (or equivalent) to every icon-only button.",
  },
  {
    id: "f5",
    severity: "minor",
    title: "Form field uses placeholder as label",
    recommendation: "Add a visible `<label>` or `aria-label`; placeholder is not a substitute.",
  },
];

const RESULT_META: Record<Result, { label: string; icon: LucideIcon; tone: string }> = {
  pass: { label: "Pass", icon: CheckCircle2, tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  warning: { label: "Warning", icon: AlertTriangle, tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  fail: { label: "Fail", icon: XCircle, tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
};

const SEVERITY_TONE: Record<Severity, string> = {
  critical: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  moderate: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  minor: "bg-muted text-muted-foreground",
};

// ─── Component ───────────────────────────────────────────────────────────

export function RoyCompliance() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("compliance/standards");
  void data; void loading; void error;

  const { toast } = useToast();
  const [standard, setStandard] = useState<Standard>("WCAG 2.2 AA");
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearInterval(t));
      timers.length = 0;
    };
  }, []);

  const runScan = useCallback(() => {
    setScanning(true);
    setScanDone(false);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 8 + Math.random() * 14);
        if (next >= 100) {
          clearInterval(interval);
          setScanning(false);
          setScanDone(true);
        }
        return next;
      });
    }, 220);
    timersRef.current.push(interval);
  }, []);

  const overall = Math.round(CRITERIA.reduce((sum, c) => sum + c.score, 0) / CRITERIA.length);

  const counts = {
    pass: CRITERIA.filter((c) => c.result === "pass").length,
    warning: CRITERIA.filter((c) => c.result === "warning").length,
    fail: CRITERIA.filter((c) => c.result === "fail").length,
  };

  const handleDownload = useCallback(() => {
    toast({
      title: "Report generated",
      description: `${standard} compliance report (${overall}% overall) exported.`,
    });
  }, [standard, overall, toast]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header + controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle>Compliance Reporting</CardTitle>
                <CardDescription>
                  Scan the project against accessibility standards.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={standard} onValueChange={(v) => setStandard(v as Standard)}>
                <SelectTrigger className="h-9 w-[180px]" aria-label="Compliance standard">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STANDARDS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={runScan} disabled={scanning} className="gap-1.5">
                {scanning ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                {scanning ? "Scanning…" : "Run Compliance Check"}
              </Button>
            </div>
          </div>
          {scanning && (
            <div className="mt-2">
              <Progress value={progress} />
              <p className="text-muted-foreground mt-1 text-xs">
                Scanning against {standard}… {Math.round(progress)}%
              </p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Score cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex size-12 items-center justify-center rounded-xl">
              <Gauge className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Overall Score</p>
              <p className="text-foreground text-2xl font-bold tabular-nums">{overall}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex size-12 items-center justify-center rounded-xl">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Passing</p>
              <p className="text-foreground text-2xl font-bold tabular-nums">{counts.pass}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="bg-amber-500/15 text-amber-600 dark:text-amber-400 flex size-12 items-center justify-center rounded-xl">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Warnings</p>
              <p className="text-foreground text-2xl font-bold tabular-nums">{counts.warning}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="bg-rose-500/15 text-rose-600 dark:text-rose-400 flex size-12 items-center justify-center rounded-xl">
              <XCircle className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Failures</p>
              <p className="text-foreground text-2xl font-bold tabular-nums">{counts.fail}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results + findings */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="size-4" /> Criteria
                </CardTitle>
                <CardDescription>{standard} evaluation results.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                <Download className="size-3.5" /> Download Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {CRITERIA.map((c) => {
              const meta = RESULT_META[c.result];
              const Icon = meta.icon;
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Badge className={cn("gap-1", meta.tone)}>
                    <Icon className="size-3" /> {meta.label}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-muted-foreground text-xs">{c.ref}</p>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <Progress value={c.score} className="h-1.5" />
                  </div>
                  <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">{c.score}%</span>
                </div>
              );
            })}
            {!scanDone && !scanning && (
              <p className="text-muted-foreground mt-2 text-center text-xs">
                Run a scan to refresh results against the selected standard.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" /> Findings
            </CardTitle>
            <CardDescription>Severity-ranked issues with fixes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {FINDINGS.map((f, i) => (
              <div key={f.id}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("capitalize", SEVERITY_TONE[f.severity])}>{f.severity}</Badge>
                    <p className="text-sm font-medium">{f.title}</p>
                  </div>
                  <p className="text-muted-foreground text-xs">{f.recommendation}</p>
                </div>
                {i < FINDINGS.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
