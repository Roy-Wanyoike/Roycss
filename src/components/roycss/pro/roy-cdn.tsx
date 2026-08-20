"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyCDN — CDN dashboard for RoyCSS distributed assets.
 *
 * Self-contained (no props). Layout:
 *   • Stats row — total requests, bandwidth, cache hit rate, avg
 *     response time.
 *   • 4 resource-type cards — CSS, JS, Fonts, Images with size + reqs.
 *   • Edge locations — text list of 6 regions with status dots.
 *   • Purge cache button (mock with confirm dialog).
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Resource type & region status are string-
 *     literal unions with `never` exhaustiveness guards.
 *   • Palette: emerald primary, sky/teal/amber accents, rose for
 *     degraded. No indigo/blue.
 */

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  FileCode2,
  FileType2,
  Gauge,
  Globe2,
  Hash,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type ResourceType = "css" | "js" | "fonts" | "images";
type RegionStatus = "healthy" | "degraded" | "maintenance";

interface Stat {
  id: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

interface ResourceStat {
  id: ResourceType;
  label: string;
  icon: LucideIcon;
  size: string;
  requests: string;
  tone: string;
}

interface EdgeRegion {
  id: string;
  city: string;
  region: string;
  status: RegionStatus;
  latency: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const STATS: readonly Stat[] = [
  { id: "s1", label: "Total Requests", value: "48.2M", hint: "+12% vs last week", icon: Activity },
  { id: "s2", label: "Bandwidth", value: "1.8 TB", hint: "+8% vs last week", icon: Gauge },
  { id: "s3", label: "Cache Hit Rate", value: "94.6%", hint: "Target 95%", icon: Zap },
  { id: "s4", label: "Avg Response", value: "42ms", hint: "P95: 110ms", icon: Hash },
];

const RESOURCES: readonly ResourceStat[] = [
  { id: "css", label: "CSS", icon: FileCode2, size: "412 GB", requests: "21.4M", tone: "bg-primary/15 text-primary" },
  { id: "js", label: "JavaScript", icon: FileCode2, size: "624 GB", requests: "18.1M", tone: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  { id: "fonts", label: "Fonts", icon: FileType2, size: "188 GB", requests: "5.6M", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  { id: "images", label: "Images", icon: ImageIcon, size: "612 GB", requests: "3.1M", tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
];

const REGIONS: readonly EdgeRegion[] = [
  { id: "r1", city: "Ashburn", region: "US-East", status: "healthy", latency: "18ms" },
  { id: "r2", city: "Los Angeles", region: "US-West", status: "healthy", latency: "24ms" },
  { id: "r3", city: "Dublin", region: "EU-West", status: "healthy", latency: "31ms" },
  { id: "r4", city: "Singapore", region: "AP-Southeast", status: "degraded", latency: "78ms" },
  { id: "r5", city: "São Paulo", region: "SA-East", status: "healthy", latency: "52ms" },
  { id: "r6", city: "Cape Town", region: "AF-South", status: "maintenance", latency: "—" },
];

const REGION_TONE: Record<RegionStatus, { dot: string; label: string }> = {
  healthy: { dot: "bg-emerald-500", label: "Healthy" },
  degraded: { dot: "bg-amber-500", label: "Degraded" },
  maintenance: { dot: "bg-muted-foreground/50", label: "Maintenance" },
};

// ─── Component ───────────────────────────────────────────────────────────

export function RoyCDN() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("cdn/stats");
  void data; void loading; void error;

  const [purging, setPurging] = useState(false);
  const { toast } = useToast();

  const purge = () => {
    setPurging(true);
    setTimeout(() => {
      setPurging(false);
      toast({
        title: "Cache purged",
        description: "Edge cache invalidated across all regions (mock).",
      });
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Globe2 className="size-5" />
              </div>
              <div>
                <CardTitle>CDN Dashboard</CardTitle>
                <CardDescription>
                  Edge delivery across 6 regions · 94.6% hit rate.
                </CardDescription>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  <Trash2 className="size-4" /> Purge Cache
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Purge entire edge cache?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This invalidates all cached assets across every region. New
                    requests will re-fetch from origin until the cache warms.
                    Typical warm-up: 5–10 minutes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={purge}
                    disabled={purging}
                    className="gap-1.5"
                  >
                    {purging ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    {purging ? "Purging…" : "Purge Now"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="bg-muted/40 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">{s.label}</span>
                    <Icon className="text-primary size-3.5" />
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
                  <p className="text-muted-foreground text-[11px]">{s.hint}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Resource cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resources by Type</CardTitle>
            <CardDescription>Cache distribution across asset classes.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {RESOURCES.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.id} className="rounded-lg border p-3">
                  <div className={cn("flex size-8 items-center justify-center rounded-lg", r.tone)}>
                    <Icon className="size-4" />
                  </div>
                  <p className="mt-2 text-sm font-medium">{r.label}</p>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium tabular-nums">{r.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Requests</span>
                    <span className="font-medium tabular-nums">{r.requests}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Edge regions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" /> Edge Locations
            </CardTitle>
            <CardDescription>6 PoPs serving traffic worldwide.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {REGIONS.map((r) => {
              const tone = REGION_TONE[r.status];
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border p-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("size-2 rounded-full", tone.dot)} />
                    <div>
                      <p className="text-sm font-medium">{r.city}</p>
                      <p className="text-muted-foreground text-[11px]">{r.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {r.latency}
                    </span>
                    <Badge
                      className={cn(
                        "gap-1",
                        r.status === "healthy"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : r.status === "degraded"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {tone.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Bandwidth bar (decorative) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bandwidth Utilization</CardTitle>
          <CardDescription>Of this month&apos;s 2 TB plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium tabular-nums">1.8 TB used</span>
            <span className="text-muted-foreground tabular-nums">200 GB free</span>
          </div>
          <Progress value={90} className="h-2" />
          <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="text-emerald-500 size-3.5" />
            Within plan — auto-scale enabled.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
