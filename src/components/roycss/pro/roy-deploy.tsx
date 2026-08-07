"use client";

/**
 * RoyDeploy — deployment platform for RoyCSS projects.
 *
 * Self-contained (no props). Three sections:
 *   1. Platform selector — 6 deploy targets (Vercel, Netlify, Cloudflare,
 *      AWS, Azure, GCP) as colored tiles; only one selectable at a time.
 *   2. Deploy Now button — simulates a 3s build+deploy with live progress
 *      that stages through Build → Upload → Live.
 *   3. Deployment history — 5 mock deploys with commit, branch,
 *      environment, status badge, timestamp, duration.
 *   4. Environment variables table — 3 mock vars.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Status & platform are string-literal unions
 *     with `never` exhaustiveness guards.
 *   • Simulated deploy via setInterval; timer ids registered in a ref
 *     Set and cleared on unmount — no leaks.
 *   • Palette: emerald primary, sky/teal/amber accents, rose for failed.
 *     No indigo/blue.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Cloud,
  Code2,
  GitBranch,
  Globe,
  Loader2,
  Rocket,
  Terminal,
  TriangleAlert,
  Upload,
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

type Platform = "vercel" | "netlify" | "cloudflare" | "aws" | "azure" | "gcp";
type DeployStatus = "success" | "building" | "failed" | "queued";
type Env = "production" | "preview" | "development";

interface DeployRecord {
  id: string;
  commit: string;
  branch: string;
  env: Env;
  status: DeployStatus;
  at: string;
  duration: string;
}

interface EnvVar {
  id: string;
  key: string;
  value: string;
  scope: Env;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const PLATFORMS: readonly {
  id: Platform;
  name: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  { id: "vercel", name: "Vercel", icon: TriangleAlert, tone: "bg-foreground/10 text-foreground" },
  { id: "netlify", name: "Netlify", icon: Globe, tone: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  { id: "cloudflare", name: "Cloudflare", icon: Cloud, tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  { id: "aws", name: "AWS", icon: Cloud, tone: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  { id: "azure", name: "Azure", icon: Cloud, tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  { id: "gcp", name: "GCP", icon: Cloud, tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
];

const DEPLOYS: readonly DeployRecord[] = [
  { id: "d1", commit: "a3f9c21", branch: "main", env: "production", status: "success", at: "12m ago", duration: "1m 48s" },
  { id: "d2", commit: "b7e2d10", branch: "feat/tokens", env: "preview", status: "success", at: "1h ago", duration: "2m 03s" },
  { id: "d3", commit: "c1a8b55", branch: "fix/hydration", env: "preview", status: "failed", at: "3h ago", duration: "0m 42s" },
  { id: "d4", commit: "d9f4e88", branch: "main", env: "production", status: "success", at: "1d ago", duration: "1m 51s" },
  { id: "d5", commit: "e2b7c33", branch: "chore/deps", env: "development", status: "queued", at: "2d ago", duration: "—" },
];

const ENV_VARS: readonly EnvVar[] = [
  { id: "v1", key: "NEXT_PUBLIC_ROYCSS_KEY", value: "rk_live_••••••3a9f", scope: "production" },
  { id: "v2", key: "ROYCSS_TOKEN_PATH", value: "./tokens/theme.json", scope: "preview" },
  { id: "v3", key: "ANALYTICS_ENDPOINT", value: "https://insights.local", scope: "development" },
];

const STATUS_META: Record<
  DeployStatus,
  { label: string; tone: string; icon: LucideIcon }
> = {
  success: {
    label: "Success",
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  building: {
    label: "Building",
    tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    icon: Loader2,
  },
  failed: {
    label: "Failed",
    tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    icon: TriangleAlert,
  },
  queued: {
    label: "Queued",
    tone: "bg-muted text-muted-foreground",
    icon: Terminal,
  },
};

const ENV_TONE: Record<Env, string> = {
  production: "bg-primary/15 text-primary",
  preview: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  development: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

const STAGES = ["Build", "Upload", "Live"] as const;

// ─── Component ───────────────────────────────────────────────────────────

export function RoyDeploy() {
  const [platform, setPlatform] = useState<Platform>("vercel");
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
        return p + 2;
      });
    }, 60);
    timers.current.add(id);
  }, [deploying]);

  const stageIndex = Math.min(
    STAGES.length - 1,
    Math.floor((progress / 100) * STAGES.length),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header + platform selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Rocket className="size-5" />
              </div>
              <div>
                <CardTitle>Deployments</CardTitle>
                <CardDescription>
                  Ship to any edge in seconds. Pick a platform and deploy.
                </CardDescription>
              </div>
            </div>
            <Button onClick={deploy} disabled={deploying} className="gap-1.5">
              {deploying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              {deploying ? "Deploying…" : "Deploy Now"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
            Target platform
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              const selected = platform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40 border-border",
                  )}
                >
                  <div className={cn("flex size-10 items-center justify-center rounded-lg", p.tone)}>
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs font-medium">{p.name}</span>
                </button>
              );
            })}
          </div>

          {deploying && (
            <div className="mt-4 rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Loader2 className="text-primary size-3.5 animate-spin" />
                  {STAGES[stageIndex]}…
                </span>
                <span className="text-muted-foreground tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
              <div className="mt-2 flex items-center justify-between text-[11px]">
                {STAGES.map((s, i) => (
                  <span
                    key={s}
                    className={cn(
                      "flex items-center gap-1",
                      i < stageIndex
                        ? "text-emerald-600 dark:text-emerald-400"
                        : i === stageIndex
                          ? "text-primary"
                          : "text-muted-foreground",
                    )}
                  >
                    {i < stageIndex ? (
                      <CheckCircle2 className="size-3" />
                    ) : i === stageIndex ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Upload className="size-3" />
                    )}
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History + Env vars */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deployment History</CardTitle>
            <CardDescription>Recent deploys across environments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commit</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Env</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">When</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEPLOYS.map((d) => {
                  const meta = STATUS_META[d.status];
                  const StatusIcon = meta.icon;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">
                        <span className="flex items-center gap-1.5">
                          <Code2 className="text-muted-foreground size-3" />
                          {d.commit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-xs">
                          <GitBranch className="text-muted-foreground size-3" />
                          {d.branch}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", ENV_TONE[d.env])}>{d.env}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", meta.tone)}>
                          <StatusIcon className="size-3" />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right text-xs">
                        {d.at}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {d.duration}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Environment Variables</CardTitle>
            <CardDescription>Scoped per environment.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {ENV_VARS.map((v) => (
              <div
                key={v.id}
                className="flex flex-col gap-1 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <code className="text-primary text-xs font-semibold">{v.key}</code>
                  <Badge className={cn("gap-1", ENV_TONE[v.scope])}>{v.scope}</Badge>
                </div>
                <code className="text-muted-foreground truncate font-mono text-xs">
                  {v.value}
                </code>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
