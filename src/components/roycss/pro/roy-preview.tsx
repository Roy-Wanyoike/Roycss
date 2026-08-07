"use client";

/**
 * RoyPreview — shareable preview environments for every PR.
 *
 * Self-contained (no props). Layout:
 *   • Header with "Create Preview" button (mock toast).
 *   • List of 4 mock preview branches with: branch, PR #, preview URL,
 *     status badge, created time, Open button.
 *   • QR code placeholder panel for mobile testing of the selected
 *     preview — renders an SVG grid (no external QR deps).
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Status is a string-literal union; the
 *     `never` guard enforces exhaustiveness on the status mapper.
 *   • Palette: emerald primary, sky/teal/amber accents, rose for failed.
 *     No indigo/blue.
 */

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  GitPullRequest,
  Globe,
  Loader2,
  Plus,
  QrCode,
  Smartphone,
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type PreviewStatus = "building" | "ready" | "failed";

interface PreviewBranch {
  id: string;
  branch: string;
  pr: number;
  url: string;
  status: PreviewStatus;
  created: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const PREVIEWS: readonly PreviewBranch[] = [
  { id: "pv1", branch: "feat/tokens-oklch", pr: 482, url: "preview-482.roycss.app", status: "ready", created: "10m ago" },
  { id: "pv2", branch: "feat/data-grid", pr: 479, url: "preview-479.roycss.app", status: "building", created: "2m ago" },
  { id: "pv3", branch: "fix/hydration", pr: 477, url: "preview-477.roycss.app", status: "failed", created: "1h ago" },
  { id: "pv4", branch: "chore/deps", pr: 475, url: "preview-475.roycss.app", status: "ready", created: "3h ago" },
];

const STATUS_META: Record<
  PreviewStatus,
  { label: string; tone: string; icon: LucideIcon }
> = {
  building: {
    label: "Building",
    tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    icon: Loader2,
  },
  ready: {
    label: "Ready",
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    icon: TriangleAlert,
  },
};

// ─── QR placeholder (deterministic from URL) ─────────────────────────────

function QrPlaceholder({ value }: { value: string }) {
  // Deterministic 21×21 grid from the URL string. Purely decorative —
  // this is a placeholder QR that conveys "scan to open on mobile".
  const size = 21;
  const cells = useMemo(() => {
    const seed = Array.from(value, (c) => c.charCodeAt(0)).reduce(
      (a, b) => (a * 31 + b) >>> 0,
      7,
    );
    const out: boolean[] = [];
    let s = seed;
    for (let i = 0; i < size * size; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      out.push((s & 1) === 1);
    }
    return out;
  }, [value]);

  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="size-32"
      role="img"
      aria-label="QR code placeholder"
    >
      <rect width={size} height={size} fill="white" />
      {cells.map((on, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        if (isFinder(r, c)) return null;
        return on ? (
          <rect key={i} x={c} y={r} width={1} height={1} fill="black" />
        ) : null;
      })}
      {/* Finder patterns */}
      {[
        [0, 0],
        [0, size - 7],
        [size - 7, 0],
      ].map(([fr, fc], i) => (
        <g key={i}>
          <rect x={fc} y={fr} width={7} height={7} fill="black" />
          <rect x={fc + 1} y={fr + 1} width={5} height={5} fill="white" />
          <rect x={fc + 2} y={fr + 2} width={3} height={3} fill="black" />
        </g>
      ))}
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────

export function RoyPreview() {
  const [selectedId, setSelectedId] = useState<string>(PREVIEWS[0].id);
  const { toast } = useToast();

  const selected = PREVIEWS.find((p) => p.id === selectedId) ?? PREVIEWS[0];

  const createPreview = () =>
    toast({
      title: "Preview queued",
      description: "A new preview environment will build shortly (mock).",
    });

  const open = (url: string) =>
    toast({
      title: "Opening preview",
      description: `https://${url}`,
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Globe className="size-5" />
              </div>
              <div>
                <CardTitle>Preview Environments</CardTitle>
                <CardDescription>
                  Every PR gets an isolated, shareable preview URL.
                </CardDescription>
              </div>
            </div>
            <Button onClick={createPreview} className="gap-1.5">
              <Plus className="size-4" /> Create Preview
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Preview list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Previews</CardTitle>
            <CardDescription>Latest preview branches.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {PREVIEWS.map((p) => {
              const meta = STATUS_META[p.status];
              const StatusIcon = meta.icon;
              const isSel = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border p-3 text-left transition-colors sm:flex-row sm:items-center sm:justify-between",
                    isSel
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40 border-border",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <GitPullRequest className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{p.branch}</p>
                        <Badge variant="outline" className="text-[10px]">
                          #{p.pr}
                        </Badge>
                      </div>
                      <code className="text-muted-foreground truncate text-[11px]">
                        {p.url}
                      </code>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-muted-foreground hidden items-center gap-1 text-[11px] sm:flex">
                      <Clock className="size-3" />
                      {p.created}
                    </span>
                    <Badge className={cn("gap-1", meta.tone)}>
                      <StatusIcon
                        className={cn("size-3", p.status === "building" && "animate-spin")}
                      />
                      {meta.label}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        open(p.url);
                      }}
                      disabled={p.status !== "ready"}
                      className="gap-1"
                    >
                      <ExternalLink className="size-3" /> Open
                    </Button>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* QR / mobile panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="size-4" /> Mobile Test
            </CardTitle>
            <CardDescription>Scan to open on your phone.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="bg-background rounded-xl border p-3">
              <QrPlaceholder value={selected.url} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{selected.branch}</p>
              <code className="text-muted-foreground text-[11px]">
                {selected.url}
              </code>
            </div>
            <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <QrCode className="size-3" /> Generated for the selected preview
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
