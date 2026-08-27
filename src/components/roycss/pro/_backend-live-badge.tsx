"use client";

/**
 * BackendLiveBadge — small status pill shown on RoyCSS Pro product cards
 * to indicate whether the card is rendering real backend data (port 4000)
 * or falling back to the bundled demo content.
 *
 * States:
 *   • loading  → amber dot pulsing + "Syncing…"
 *   • live     → emerald dot + "Live data"
 *   • offline  → muted dot + "Demo data" (backend down / 4xx / 5xx)
 *
 * Tiny, zero-props-except-state — drives all 3 display states from a
 * single `state` prop. Companion to `useBackendData`.
 */
import { Loader2, Radio } from "lucide-react";

import { cn } from "@/lib/utils";

export type BackendLiveState = "loading" | "live" | "offline";

export function BackendLiveBadge({
  state,
  syncedAt,
  className,
}: {
  state: BackendLiveState;
  syncedAt?: string | null;
  className?: string;
}) {
  const label =
    state === "loading" ? "Syncing…" : state === "live" ? "Live data" : "Demo data";
  const Icon = state === "loading" ? Loader2 : Radio;
  const tone =
    state === "loading"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : state === "live"
        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        : "bg-muted text-muted-foreground";
  const dot =
    state === "loading"
      ? "bg-amber-500 animate-pulse"
      : state === "live"
        ? "bg-emerald-500"
        : "bg-muted-foreground/40";
  const title =
    state === "live" && syncedAt
      ? `Backend live · synced ${new Date(syncedAt).toLocaleTimeString()}`
      : state === "offline"
        ? "Backend unavailable — showing demo data"
        : "Fetching from backend…";
  return (
    <span
      role="status"
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
        tone,
        className,
      )}
    >
      <Icon
        className={cn("size-3", state === "loading" && "animate-spin")}
        aria-hidden="true"
      />
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
