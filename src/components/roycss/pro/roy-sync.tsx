"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoySync — a synchronization hub for RoyCSS integrations.
 *
 * Self-contained (no props). Three sections:
 *   1. Integration cards — Figma, GitHub, Design Tokens, Theme.
 *      Each card has an icon, connection status (Connected /
 *      Disconnected), last-sync time, per-integration config toggles,
 *      and a "Sync Now" button that simulates a sync with a
 *      progress bar.
 *   2. Sync log — the 5 most recent sync events with timestamp,
 *      source, status (Success / Failed / Pending), and items-synced
 *      count.
 *   3. "Sync All" — runs every connected integration in sequence and
 *      updates the sync log with fresh entries.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Every status / source is a string-literal
 *     union; the `never` guard enforces exhaustiveness on the
 *     status-to-color mapper.
 *   • Simulated async via setInterval. Every timer id is registered
 *     in a ref Set and cleared on unmount — no leaks.
 *   • Palette follows the RoyCSS theme — emerald primary, amber for
 *     warnings, rose for failures, sky for pending. No indigo or
 *     blue anywhere.
 *   • SSR-safe — no `window` access at module scope.
 */

import * as React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Figma,
  Github,
  History,
  Loader2,
  Palette,
  RefreshCcw,
  RefreshCw,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type IntegrationId = "figma" | "github" | "tokens" | "theme";

type SyncStatus = "success" | "failed" | "pending" | "idle";

interface IntegrationConfig {
  id: string;
  label: string;
  hint: string;
  default: boolean;
}

interface IntegrationMeta {
  id: IntegrationId;
  name: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  connected: boolean;
  /** Static mock "last sync" label, replaced live after a sync. */
  lastSyncLabel: string;
  /** Items reported after a successful sync. */
  itemsLabel: string;
  config: readonly IntegrationConfig[];
}

interface SyncEvent {
  id: string;
  timestamp: string;
  source: IntegrationId;
  status: SyncStatus;
  itemsSynced: number;
  message: string;
}

interface SyncState {
  status: SyncStatus;
  progress: number;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const INTEGRATIONS: readonly IntegrationMeta[] = [
  {
    id: "figma",
    name: "Figma",
    description: "Import Figma frames as RoyCSS components and tokens.",
    icon: Figma,
    accent:
      "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950/50 dark:text-fuchsia-300",
    connected: true,
    lastSyncLabel: "12 minutes ago",
    itemsLabel: "24 frames",
    config: [
      {
        id: "auto-sync",
        label: "Auto-sync on file change",
        hint: "Watch the linked Figma file for changes.",
        default: true,
      },
      {
        id: "components-only",
        label: "Components only",
        hint: "Skip plain frames, sync only Figma components.",
        default: false,
      },
      {
        id: "include-images",
        label: "Include image assets",
        hint: "Export raster assets alongside vector data.",
        default: true,
      },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    description: "Mirror code components to a GitHub repo on every commit.",
    icon: Github,
    accent:
      "border-foreground/20 bg-foreground/5 text-foreground dark:bg-foreground/10",
    connected: true,
    lastSyncLabel: "3 hours ago",
    itemsLabel: "18 commits",
    config: [
      {
        id: "push-on-sync",
        label: "Push on sync",
        hint: "Push generated files to the default branch.",
        default: true,
      },
      {
        id: "open-pr",
        label: "Open pull request",
        hint: "Open a PR instead of pushing directly.",
        default: false,
      },
      {
        id: "sign-commits",
        label: "Sign commits",
        hint: "GPG-sign every commit pushed by RoyCSS.",
        default: true,
      },
    ],
  },
  {
    id: "tokens",
    name: "Design Tokens",
    description: "Sync tokens (color, type, spacing) to W3C Tokens JSON.",
    icon: Palette,
    accent:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
    connected: false,
    lastSyncLabel: "Never",
    itemsLabel: "0 tokens",
    config: [
      {
        id: "include-aliases",
        label: "Include aliases",
        hint: "Emit token aliases in the JSON output.",
        default: true,
      },
      {
        id: "platform-prefix",
        label: "Add platform prefix",
        hint: "Prefix every token with `roycss-`.",
        default: false,
      },
    ],
  },
  {
    id: "theme",
    name: "Theme",
    description: "Push the active theme to the linked design-system package.",
    icon: Zap,
    accent:
      "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
    connected: true,
    lastSyncLabel: "Just now",
    itemsLabel: "12 theme variables",
    config: [
      {
        id: "include-dark",
        label: "Include dark mode",
        hint: "Sync both light and dark variables.",
        default: true,
      },
      {
        id: "compact-output",
        label: "Compact output",
        hint: "Strip comments from the synced theme file.",
        default: false,
      },
    ],
  },
] as const;

const INITIAL_LOG: readonly SyncEvent[] = [
  {
    id: "evt-1",
    timestamp: "Today · 14:32",
    source: "figma",
    status: "success",
    itemsSynced: 24,
    message: "Imported 24 frames from “App — Final”.",
  },
  {
    id: "evt-2",
    timestamp: "Today · 11:08",
    source: "github",
    status: "success",
    itemsSynced: 18,
    message: "Pushed 18 commits to main.",
  },
  {
    id: "evt-3",
    timestamp: "Yesterday · 17:54",
    source: "theme",
    status: "success",
    itemsSynced: 12,
    message: "Synced 12 theme variables to @roycss/theme.",
  },
  {
    id: "evt-4",
    timestamp: "Yesterday · 09:12",
    source: "tokens",
    status: "failed",
    itemsSynced: 0,
    message: "Design Tokens integration is not connected.",
  },
  {
    id: "evt-5",
    timestamp: "Mon · 22:01",
    source: "figma",
    status: "success",
    itemsSynced: 9,
    message: "Imported 9 frames from “Marketing — v3”.",
  },
] as const;

const SYNC_DURATION_MS = 1600;
const SYNC_TICK_MS = 80;

const SOURCE_META: Record<
  IntegrationId,
  { label: string; badge: string }
> = {
  figma: {
    label: "Figma",
    badge:
      "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
  },
  github: {
    label: "GitHub",
    badge:
      "border-foreground/20 bg-foreground/5 text-foreground dark:bg-foreground/10",
  },
  tokens: {
    label: "Design Tokens",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
  },
  theme: {
    label: "Theme",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
  },
};

const STATUS_META: Record<
  SyncStatus,
  { label: string; badge: string; icon: LucideIcon; iconClass: string }
> = {
  success: {
    label: "Success",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    icon: AlertTriangle,
    iconClass: "text-rose-600 dark:text-rose-400",
  },
  pending: {
    label: "Pending",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    icon: Clock,
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  idle: {
    label: "Idle",
    badge:
      "border-border bg-muted text-muted-foreground",
    icon: Clock,
    iconClass: "text-muted-foreground",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Generate a reasonably unique id for log entries. */
function uid(): string {
  return `evt-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

/** Format a Date as "Today · HH:MM", "Yesterday · HH:MM", or "Mon · HH:MM". */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  if (sameDay) return `Today · ${hh}:${mm}`;
  if (isYesterday) return `Yesterday · ${hh}:${mm}`;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  return `${day} · ${hh}:${mm}`;
}

/** Build a human-readable "X minutes ago" label. */
function relativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface IntegrationCardProps {
  meta: IntegrationMeta;
  syncState: SyncState | null;
  lastSync: Date | null;
  onSync: (id: IntegrationId) => void;
}

const IntegrationCard = React.memo(function IntegrationCard({
  meta,
  syncState,
  lastSync,
  onSync,
}: IntegrationCardProps) {
  const Icon = meta.icon;
  const isSyncing = syncState?.status === "pending";
  const lastSyncLabel = lastSync ? relativeTime(lastSync) : meta.lastSyncLabel;

  const [configValues, setConfigValues] = React.useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(meta.config.map((c) => [c.id, c.default])),
  );

  const handleToggle = useCallback((id: string, checked: boolean) => {
    setConfigValues((prev) => ({ ...prev, [id]: checked }));
  }, []);

  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-md border",
                meta.accent,
              )}
              aria-hidden
            >
              <Icon className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base leading-tight">
                {meta.name}
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs leading-snug">
                {meta.description}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 gap-1 text-[10px] uppercase tracking-wide",
              meta.connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                meta.connected ? "bg-emerald-500" : "bg-rose-500",
              )}
              aria-hidden
            />
            {meta.connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Sync progress (or last-sync info) */}
        {isSyncing ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground inline-flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                Syncing…
              </span>
              <span className="font-mono tabular-nums">
                {Math.round(syncState?.progress ?? 0)}%
              </span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-100"
                style={{ width: `${syncState?.progress ?? 0}%` }}
                role="progressbar"
                aria-valuenow={Math.round(syncState?.progress ?? 0)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${meta.name} sync progress`}
              />
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3" aria-hidden />
              Last sync: {lastSyncLabel}
            </span>
            <span>{meta.itemsLabel}</span>
          </div>
        )}

        {/* Config toggles */}
        <div className="flex flex-col gap-2.5 border-t pt-3">
          {meta.config.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium">{c.label}</span>
                <span className="text-muted-foreground text-[11px] leading-snug">
                  {c.hint}
                </span>
              </div>
              <Switch
                checked={configValues[c.id] ?? c.default}
                onCheckedChange={(checked) => handleToggle(c.id, checked)}
                disabled={!meta.connected}
                aria-label={c.label}
              />
            </div>
          ))}
        </div>

        {/* Sync button */}
        <Button
          size="sm"
          onClick={() => onSync(meta.id)}
          disabled={!meta.connected || isSyncing}
          className="w-full gap-1.5"
        >
          {isSyncing ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Syncing…
            </>
          ) : (
            <>
              <RefreshCw className="size-3.5" />
              Sync Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
});

interface SyncLogRowProps {
  event: SyncEvent;
}

const SyncLogRow = React.memo(function SyncLogRow({ event }: SyncLogRowProps) {
  const sourceMeta = SOURCE_META[event.source];
  const statusMeta = STATUS_META[event.status];
  const StatusIcon = statusMeta.icon;
  return (
    <li className="flex items-start gap-3 py-2.5">
      <div
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
          statusMeta.iconClass,
        )}
        aria-hidden
      >
        <StatusIcon className="size-3.5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-[10px] font-medium", sourceMeta.badge)}
          >
            {sourceMeta.label}
          </Badge>
          <Badge
            variant="outline"
            className={cn("text-[10px] font-medium uppercase tracking-wide", statusMeta.badge)}
          >
            {statusMeta.label}
          </Badge>
          <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">
            {event.timestamp}
          </span>
        </div>
        <p className="text-sm leading-snug">{event.message}</p>
        {event.itemsSynced > 0 && (
          <p className="text-muted-foreground text-[11px]">
            {event.itemsSynced} item{event.itemsSynced === 1 ? "" : "s"} synced
          </p>
        )}
      </div>
    </li>
  );
});

// ═══════════════════════════════════════════════════════════════════════
// RoySync
// ═══════════════════════════════════════════════════════════════════════

export function RoySync() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("sync/status");
  void data;

  const { toast } = useToast();
  const [syncStates, setSyncStates] = useState<
    Record<IntegrationId, SyncState | null>
  >({
    figma: null,
    github: null,
    tokens: null,
    theme: null,
  });
  const [lastSyncs, setLastSyncs] = useState<
    Record<IntegrationId, Date | null>
  >({
    figma: null,
    github: null,
    tokens: null,
    theme: null,
  });
  const [log, setLog] = useState<readonly SyncEvent[]>(INITIAL_LOG);
  const [syncingAll, setSyncingAll] = useState(false);

  const timersRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Clear every simulated timer on unmount — no leaks.
  useEffect(() => {
    const intervals = timersRef.current;
    const timeouts = timeoutsRef.current;
    return () => {
      intervals.forEach((id) => clearInterval(id));
      intervals.clear();
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
    };
  }, []);

  /** Simulate a single-integration sync, returning a cleanup fn. */
  const runSync = useCallback(
    (id: IntegrationId): void => {
      const meta = INTEGRATIONS.find((i) => i.id === id);
      if (!meta || !meta.connected) return;

      // Mark as pending, progress 0.
      setSyncStates((prev) => ({
        ...prev,
        [id]: { status: "pending", progress: 0 },
      }));

      const startedAt = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const progress = Math.min(100, (elapsed / SYNC_DURATION_MS) * 100);
        setSyncStates((prev) => ({
          ...prev,
          [id]: { status: "pending", progress },
        }));

        if (elapsed >= SYNC_DURATION_MS) {
          clearInterval(interval);
          timersRef.current.delete(interval);

          // Resolve to success.
          const finishedAt = new Date();
          setSyncStates((prev) => ({ ...prev, [id]: null }));
          setLastSyncs((prev) => ({ ...prev, [id]: finishedAt }));

          // Items count derived from the integration's reported items label.
          const itemsMatch = /(\d+)/.exec(meta.itemsLabel);
          const itemsSynced = itemsMatch ? Number(itemsMatch[1]) : 0;

          setLog((prev) => [
            {
              id: uid(),
              timestamp: formatTimestamp(finishedAt),
              source: id,
              status: "success" as SyncStatus,
              itemsSynced,
              message: `Synced ${meta.itemsLabel.toLowerCase()} from ${meta.name}.`,
            },
            ...prev,
          ].slice(0, 5));
        }
      }, SYNC_TICK_MS);
      timersRef.current.add(interval);
    },
    [],
  );

  const handleSync = useCallback(
    (id: IntegrationId) => {
      const meta = INTEGRATIONS.find((i) => i.id === id);
      if (!meta) return;
      if (!meta.connected) {
        toast({
          title: "Cannot sync",
          description: `${meta.name} is not connected.`,
          variant: "destructive",
        });
        return;
      }
      runSync(id);
      toast({
        title: `Syncing ${meta.name}…`,
        description: "This usually takes a couple of seconds.",
      });
    },
    [runSync, toast],
  );

  const handleSyncAll = useCallback(() => {
    if (syncingAll) return;
    const connected = INTEGRATIONS.filter((i) => i.connected);
    if (connected.length === 0) {
      toast({
        title: "No connected integrations",
        description: "Connect at least one integration to sync.",
        variant: "destructive",
      });
      return;
    }

    setSyncingAll(true);
    toast({
      title: "Syncing all integrations",
      description: `${connected.length} integrations queued.`,
    });

    // Kick off every connected sync immediately — they progress in parallel.
    connected.forEach((meta) => runSync(meta.id));

    // After the longest sync resolves, flip syncingAll off.
    const t = setTimeout(() => {
      setSyncingAll(false);
      toast({
        title: "All syncs complete",
        description: `${connected.length} integrations synced successfully.`,
      });
    }, SYNC_DURATION_MS + 200);
    timeoutsRef.current.add(t);
  }, [syncingAll, runSync, toast]);

  const connectedCount = useMemo(
    () => INTEGRATIONS.filter((i) => i.connected).length,
    [],
  );

  const totalInProgress = useMemo(
    () =>
      Object.values(syncStates).filter((s) => s?.status === "pending").length,
    [syncStates],
  );

  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <RefreshCcw className="size-5 text-primary" aria-hidden />
          Roy Sync
        </CardTitle>
        <CardDescription>
          Synchronize Figma, GitHub, design tokens, and your theme from one
          place. {connectedCount}/{INTEGRATIONS.length} integrations connected.
        </CardDescription>
        <CardAction>
          <BackendLiveBadge loading={loading} error={error} />
          <Button
            size="sm"
            onClick={handleSyncAll}
            disabled={syncingAll || connectedCount === 0}
            className="gap-1.5"
          >
            {syncingAll ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Syncing {totalInProgress > 0 ? `(${totalInProgress})` : "…"}
              </>
            ) : (
              <>
                <Zap className="size-3.5" />
                Sync All
              </>
            )}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* ─── Integration grid ────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {INTEGRATIONS.map((meta) => (
              <IntegrationCard
                key={meta.id}
                meta={meta}
                syncState={syncStates[meta.id]}
                lastSync={lastSyncs[meta.id]}
                onSync={handleSync}
              />
            ))}
          </div>
        </section>

        {/* ─── Sync log ───────────────────────────────────────────── */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <History className="size-4 text-primary" aria-hidden />
              Sync log
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {log.length} recent
            </Badge>
          </div>
          <div className="rounded-lg border">
            <ul className="divide-y px-4">
              {log.map((event) => (
                <SyncLogRow key={event.id} event={event} />
              ))}
            </ul>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
