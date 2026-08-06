"use client";

/**
 * RoyObservatory — production monitoring dashboard.
 *
 * Self-contained site selector (3 mock sites), Core Web Vitals
 * (LCP / FID / CLS) with colored pass-fail, error rate, uptime,
 * 24h status, alert feed, 7-day LCP trend chart, "Add Monitor"
 * mock form, and a real-time status indicator (green/amber/red).
 *
 * Palette: emerald primary, amber for warnings, rose for incidents.
 * No indigo / blue. TS strict, zero `any`.
 */

import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Globe,
  Plus,
  Radio,
  Server,
  X,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type Status = "healthy" | "degraded" | "down";

interface VitalThreshold {
  field: "LCP" | "FID" | "CLS";
  value: number;
  unit: string;
  pass: boolean;
}

interface Site {
  id: string;
  name: string;
  url: string;
  status: Status;
  uptime: number; // %
  errorRate: number; // %
  last24h: Status;
  vitals: VitalThreshold[];
  trend: number[]; // 7 days of LCP seconds
}

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  site: string;
  message: string;
  at: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const SITES: Site[] = [
  {
    id: "s1",
    name: "Marketing Site",
    url: "roycss.dev",
    status: "healthy",
    uptime: 99.98,
    errorRate: 0.04,
    last24h: "healthy",
    vitals: [
      { field: "LCP", value: 1.8, unit: "s", pass: true },
      { field: "FID", value: 42, unit: "ms", pass: true },
      { field: "CLS", value: 0.05, unit: "", pass: true },
    ],
    trend: [2.4, 2.1, 1.9, 2.0, 1.8, 1.7, 1.8],
  },
  {
    id: "s2",
    name: "Admin Console",
    url: "app.roycss.dev",
    status: "degraded",
    uptime: 99.42,
    errorRate: 1.12,
    last24h: "degraded",
    vitals: [
      { field: "LCP", value: 3.4, unit: "s", pass: false },
      { field: "FID", value: 180, unit: "ms", pass: false },
      { field: "CLS", value: 0.12, unit: "", pass: true },
    ],
    trend: [2.6, 2.8, 3.0, 3.2, 3.1, 3.4, 3.4],
  },
  {
    id: "s3",
    name: "Docs Site",
    url: "docs.roycss.dev",
    status: "healthy",
    uptime: 100,
    errorRate: 0,
    last24h: "healthy",
    vitals: [
      { field: "LCP", value: 1.2, unit: "s", pass: true },
      { field: "FID", value: 28, unit: "ms", pass: true },
      { field: "CLS", value: 0.02, unit: "", pass: true },
    ],
    trend: [1.4, 1.3, 1.3, 1.2, 1.2, 1.1, 1.2],
  },
];

const ALERTS: Alert[] = [
  { id: "al1", severity: "critical", site: "Admin Console", message: "LCP at 3.4s exceeds 2.5s budget", at: "2m ago" },
  { id: "al2", severity: "warning", site: "Admin Console", message: "Error rate 1.12% (threshold 1%)", at: "11m ago" },
  { id: "al3", severity: "warning", site: "Marketing Site", message: "Deployment started on production", at: "23m ago" },
  { id: "al4", severity: "info", site: "Docs Site", message: "Cache invalidated — rebuild complete", at: "1h ago" },
  { id: "al5", severity: "info", site: "Marketing Site", message: "SSL certificate renews in 14 days", at: "3h ago" },
];

const STATUS_META: Record<Status, { label: string; dot: string; tone: string; icon: typeof CheckCircle2 }> = {
  healthy: { label: "Healthy", dot: "bg-emerald-500", tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  degraded: { label: "Degraded", dot: "bg-amber-500", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400", icon: AlertTriangle },
  down: { label: "Down", dot: "bg-rose-500", tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400", icon: AlertOctagon },
};

const ALERT_TONE: Record<Alert["severity"], string> = {
  critical: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  info: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
};

// ─── Sub-components ──────────────────────────────────────────────────────

function StatusIcon({ status }: { status: Status }) {
  const Icon = STATUS_META[status].icon;
  return <Icon className="size-3" />;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function TrendChart({ data }: { data: number[] }) {
  const w = 240;
  const h = 64;
  const max = Math.max(...data) * 1.1;
  const min = 0;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pass = data.every((v) => v <= 2.5);
  const stroke = pass ? "#10b981" : "#f43f5e";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none" aria-label="7-day LCP trend">
      <line x1="0" y1={h - ((2.5 - min) / (max - min)) * h} x2={w} y2={h - ((2.5 - min) / (max - min)) * h} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1" />
      <path d={`M ${pts.join(" L ")} L ${w} ${h} L 0 ${h} Z`} fill={pass ? "#10b98122" : "#f43f5e22"} />
      <path d={`M ${pts.join(" L ")}`} fill="none" stroke={stroke} strokeWidth="1.5" />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - ((v - min) / (max - min)) * h} r="2" fill={stroke} />
      ))}
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────

export function RoyObservatory() {
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string>(SITES[0].id);
  const [addOpen, setAddOpen] = useState(false);
  const [monitorName, setMonitorName] = useState("");
  const [monitorUrl, setMonitorUrl] = useState("");
  const [monitorRegion, setMonitorRegion] = useState("us-east-1");

  const selected = SITES.find((s) => s.id === selectedId) ?? SITES[0];

  const overallStatus = useMemo<Status>(() => {
    if (SITES.some((s) => s.status === "down")) return "down";
    if (SITES.some((s) => s.status === "degraded")) return "degraded";
    return "healthy";
  }, []);

  const handleAdd = useCallback(() => {
    if (!monitorName.trim() || !monitorUrl.trim()) return;
    toast({
      title: "Monitor added",
      description: `Now tracking ${monitorName} (${monitorUrl}) from ${monitorRegion}.`,
    });
    setAddOpen(false);
    setMonitorName("");
    setMonitorUrl("");
  }, [monitorName, monitorUrl, monitorRegion, toast]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Radio className="size-5" />
              </div>
              <div>
                <CardTitle>Production Observatory</CardTitle>
                <CardDescription>
                  Real-time monitoring across {SITES.length} sites.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", STATUS_META[overallStatus].tone)}>
                <span className={cn("size-2 animate-pulse rounded-full", STATUS_META[overallStatus].dot)} />
                Real-time: {STATUS_META[overallStatus].label}
              </div>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="h-9 w-[180px]" aria-label="Site">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SITES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className={cn("size-1.5 rounded-full", STATUS_META[s.status].dot)} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
                <Plus className="size-3.5" /> Add Monitor
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Vitals + trend */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="size-4" /> {selected.name}
                </CardTitle>
                <CardDescription className="font-mono text-xs">{selected.url}</CardDescription>
              </div>
              <Badge className={cn("gap-1", STATUS_META[selected.status].tone)}>
                <StatusIcon status={selected.status} />
                {STATUS_META[selected.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {selected.vitals.map((v) => (
              <div key={v.field} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{v.field}</span>
                  <Badge className={v.pass ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"}>
                    {v.pass ? "Pass" : "Fail"}
                  </Badge>
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {v.value}
                  <span className="text-muted-foreground ml-1 text-sm font-normal">{v.unit}</span>
                </p>
              </div>
            ))}
            <div className="rounded-lg border p-3 sm:col-span-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">7-day LCP trend</p>
                <span className="text-muted-foreground text-[11px]">dashed line = 2.5s budget</span>
              </div>
              <TrendChart data={selected.trend} />
            </div>
          </CardContent>
        </Card>

        {/* Per-site status list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="size-4" /> All Sites
            </CardTitle>
            <CardDescription>Uptime + error rate (24h).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {SITES.map((s) => {
              const meta = STATUS_META[s.status];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition hover:bg-accent/50",
                    s.id === selectedId && "border-primary bg-primary/5",
                  )}
                >
                  <span className={cn("size-2 shrink-0 animate-pulse rounded-full", meta.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-muted-foreground truncate text-[11px]">{s.url}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold tabular-nums">{s.uptime}%</p>
                    <p className="text-muted-foreground text-[10px]">{s.errorRate}% err</p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Alert feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" /> Alert Feed
          </CardTitle>
          <CardDescription>Most recent alerts across all monitors.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {ALERTS.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Badge className={cn("capitalize", ALERT_TONE[a.severity])}>{a.severity}</Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.message}</p>
                <p className="text-muted-foreground text-xs">{a.site}</p>
              </div>
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="size-3" /> {a.at}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add monitor dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Monitor</DialogTitle>
            <DialogDescription>Track a new production site in real time.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="mon-name" className="text-xs">Monitor name</Label>
              <Input
                id="mon-name"
                value={monitorName}
                onChange={(e) => setMonitorName(e.target.value)}
                placeholder="Marketing Site"
              />
            </div>
            <div>
              <Label htmlFor="mon-url" className="text-xs">URL</Label>
              <Input
                id="mon-url"
                value={monitorUrl}
                onChange={(e) => setMonitorUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label className="text-xs">Region</Label>
              <Select value={monitorRegion} onValueChange={setMonitorRegion}>
                <SelectTrigger className="w-full" aria-label="Region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">us-east-1</SelectItem>
                  <SelectItem value="eu-west-1">eu-west-1</SelectItem>
                  <SelectItem value="ap-southeast-1">ap-southeast-1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!monitorName.trim() || !monitorUrl.trim()}>
              Add Monitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
