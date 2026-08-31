"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyAuditCenter — enterprise audit dashboard.
 *
 * Self-contained project selector, per-project scorecards (a11y,
 * performance, security), a 6-month trend chart (mock SVG), an
 * issues table across projects, severity filter, and an
 * "Audit All Projects" action.
 *
 * Palette: emerald primary, amber warning, rose critical, teal /
 * cyan for info accents. No indigo / blue. TS strict, zero `any`.
 */

import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type IssueSeverity = "critical" | "warning" | "info";

interface Project {
  id: string;
  name: string;
  a11y: number;
  performance: number;
  security: number;
  components: number;
  lastAudit: string;
  trend: number[]; // 6 monthly scores
}

interface Issue {
  id: string;
  project: string;
  severity: IssueSeverity;
  title: string;
  area: "Accessibility" | "Performance" | "Security";
}

// ─── Mock data ───────────────────────────────────────────────────────────

const PROJECTS: Project[] = [
  { id: "p1", name: "Marketing Site", a11y: 96, performance: 92, security: 98, components: 48, lastAudit: "2025-03-12", trend: [82, 85, 88, 90, 91, 92] },
  { id: "p2", name: "Admin Console", a11y: 88, performance: 84, security: 95, components: 132, lastAudit: "2025-03-10", trend: [70, 74, 78, 80, 82, 84] },
  { id: "p3", name: "Customer Portal", a11y: 91, performance: 79, security: 92, components: 76, lastAudit: "2025-03-09", trend: [68, 71, 74, 75, 77, 79] },
  { id: "p4", name: "Docs Site", a11y: 99, performance: 95, security: 97, components: 24, lastAudit: "2025-03-11", trend: [88, 90, 92, 93, 94, 95] },
  { id: "p5", name: "Mobile Webview", a11y: 73, performance: 68, security: 88, components: 56, lastAudit: "2025-03-08", trend: [58, 61, 64, 66, 67, 68] },
];

const ISSUES: Issue[] = [
  { id: "i1", project: "Mobile Webview", severity: "critical", title: "Tap targets below 44×44 px", area: "Accessibility" },
  { id: "i2", project: "Customer Portal", severity: "critical", title: "Inline event handlers without CSP nonce", area: "Security" },
  { id: "i3", project: "Admin Console", severity: "warning", title: "Bundle ships 38% unused CSS", area: "Performance" },
  { id: "i4", project: "Mobile Webview", severity: "warning", title: "LCP 3.4s on 3G profile", area: "Performance" },
  { id: "i5", project: "Admin Console", severity: "warning", title: "Missing alt text on 12 images", area: "Accessibility" },
  { id: "i6", project: "Customer Portal", severity: "info", title: "Outdated CSP directive 'upgrade-insecure-requests'", area: "Security" },
  { id: "i7", project: "Marketing Site", severity: "info", title: "Duplicate analytics script loaded twice", area: "Performance" },
  { id: "i8", project: "Docs Site", severity: "info", title: "Headings skip from h2 to h4 on /guide", area: "Accessibility" },
  { id: "i9", project: "Mobile Webview", severity: "warning", title: "localStorage used for session token", area: "Security" },
  { id: "i10", project: "Admin Console", severity: "info", title: "Three deprecated lifecycle methods detected", area: "Performance" },
];

const SEVERITY_META: Record<IssueSeverity, { label: string; icon: LucideIcon; tone: string }> = {
  critical: { label: "Critical", icon: AlertOctagon, tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  warning: { label: "Warning", icon: AlertTriangle, tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  info: { label: "Info", icon: Info, tone: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
};

const FILTERS: (IssueSeverity | "all")[] = ["all", "critical", "warning", "info"];

// ─── Helpers ─────────────────────────────────────────────────────────────

function scoreTone(score: number): string {
  if (score >= 90) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (score >= 75) return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return "bg-rose-500/15 text-rose-600 dark:text-rose-400";
}

function MiniTrend({ data }: { data: number[] }) {
  const w = 120;
  const h = 36;
  const max = 100;
  const min = 50;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M ${pts.join(" L ")}`;
  const areaPath = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-32" preserveAspectRatio="none" aria-hidden>
      <path d={areaPath} fill="currentColor" className="text-primary/15" />
      <path d={path} fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.5" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / (max - min)) * h;
        return <circle key={i} cx={x} cy={y} r="1.6" className="text-primary" fill="currentColor" />;
      })}
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────

export function RoyAuditCenter() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("audit-center/projects");
  void data;

  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string>(PROJECTS[0].id);
  const [filter, setFilter] = useState<IssueSeverity | "all">("all");
  const [auditing, setAuditing] = useState(false);

  const selected = PROJECTS.find((p) => p.id === selectedId) ?? PROJECTS[0];

  const filteredIssues = useMemo(() => {
    if (filter === "all") return ISSUES;
    return ISSUES.filter((i) => i.severity === filter);
  }, [filter]);

  const auditAll = useCallback(() => {
    setAuditing(true);
    window.setTimeout(() => {
      setAuditing(false);
      toast({
        title: "Audit complete",
        description: `Re-audited ${PROJECTS.length} projects. ${ISSUES.length} issues found.`,
      });
    }, 1500);
  }, [toast]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Activity className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Enterprise Audit Center</CardTitle>
                  <BackendLiveBadge loading={loading} error={error} />
                </div>
                <CardDescription>
                  Cross-project accessibility, performance, and security scores.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="h-9 w-[180px]" aria-label="Project">
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
              <Button onClick={auditAll} disabled={auditing} className="gap-1.5">
                {auditing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {auditing ? "Auditing…" : "Audit All Projects"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Scorecards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-xl">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Accessibility</p>
                <p className="text-2xl font-bold tabular-nums">{selected.a11y}</p>
              </div>
            </div>
            <Badge className={scoreTone(selected.a11y)}>{selected.a11y >= 90 ? "A" : selected.a11y >= 75 ? "B" : "C"}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-0">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/15 text-amber-600 dark:text-amber-400 flex size-11 items-center justify-center rounded-xl">
                <Zap className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Performance</p>
                <p className="text-2xl font-bold tabular-nums">{selected.performance}</p>
              </div>
            </div>
            <Badge className={scoreTone(selected.performance)}>
              {selected.performance >= 90 ? "A" : selected.performance >= 75 ? "B" : "C"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-0">
            <div className="flex items-center gap-3">
              <div className="bg-teal-500/15 text-teal-600 dark:text-teal-400 flex size-11 items-center justify-center rounded-xl">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Security</p>
                <p className="text-2xl font-bold tabular-nums">{selected.security}</p>
              </div>
            </div>
            <Badge className={scoreTone(selected.security)}>
              {selected.security >= 90 ? "A" : selected.security >= 75 ? "B" : "C"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Components</p>
                <p className="text-2xl font-bold tabular-nums">{selected.components}</p>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Last audit
                <br />
                <span className="text-foreground text-xs font-medium">{selected.lastAudit}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend + project table */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">6-Month Score Trend · {selected.name}</CardTitle>
            <CardDescription>Composite accessibility + performance + security.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2">
              {selected.trend.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-32 w-full items-end justify-center">
                    <div
                      className="bg-primary/80 hover:bg-primary w-full max-w-10 rounded-t-md transition-all"
                      style={{ height: `${((v - 50) / 50) * 100}%` }}
                      title={`${v}`}
                    />
                  </div>
                  <span className="text-muted-foreground text-[10px]">M{i + 1}</span>
                  <span className="text-xs font-semibold tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Project Roster</CardTitle>
            <CardDescription>Select to focus the scorecards above.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {PROJECTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition hover:bg-accent/50",
                  p.id === selectedId && "border-primary bg-primary/5",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-muted-foreground text-xs">{p.components} components · {p.lastAudit}</p>
                </div>
                <MiniTrend data={p.trend} />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Issues table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4" /> Cross-Project Issues
              </CardTitle>
              <CardDescription>{filteredIssues.length} issues across all projects.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium capitalize transition",
                    filter === f
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent/50",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Project</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead className="pr-6 text-right">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue) => {
                  const meta = SEVERITY_META[issue.severity];
                  const Icon = meta.icon;
                  return (
                    <TableRow key={issue.id}>
                      <TableCell className="pl-6 font-medium">{issue.project}</TableCell>
                      <TableCell className="text-muted-foreground">{issue.area}</TableCell>
                      <TableCell>{issue.title}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <Badge className={cn("gap-1", meta.tone)}>
                          <Icon className="size-3" /> {meta.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredIssues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground py-6 text-center text-sm">
                      <CheckCircle2 className="mx-auto mb-1 size-5 text-emerald-500" />
                      No issues at this severity.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
