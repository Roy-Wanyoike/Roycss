import { cn } from "@/lib/utils";
import { getModuleStatus, getModuleStatusMeta } from "@/lib/module-status";
import { DemoBadge } from "@/components/roycss/demo-badge";

interface BackendLiveBadgeProps {
  /**
   * Module registry key (`src/lib/module-status.ts`) — the backend module
   * whose data this card renders. Required so the badge can never drift
   * from the registry: if the module is registered as demo/catalog-only,
   * this badge renders the honest `DemoBadge` instead of "Live" — even
   * when the API responds, because the payload itself is mock data.
   */
  module: string;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * BackendLiveBadge — small pill that reads "Live" when a product card
 * is wired to real backend data, or "Demo" when in an error/loading
 * state. Helps users see at a glance which cards are real.
 *
 * PF-012 honesty pass: the registry (`src/lib/module-status.ts`) is
 * checked first. Modules documented as mock/limited (analytics, edge,
 * plugin-hub, mcp, scaffold, refactor, live, digital-twin, devtools,
 * accessibility, generator) always render `DemoBadge` ("Demo data — not
 * live" / "Catalog only") and can never show "Live" here.
 */
export function BackendLiveBadge({ module, loading, error, className }: BackendLiveBadgeProps) {
  const registryStatus = getModuleStatus(module);

  // Registry wins over the fetch state: a successful response from a
  // mock-backed module is still mock data, not live data.
  if (registryStatus !== "live") {
    return <DemoBadge module={module} className={className} />;
  }

  const isLive = !loading && !error;
  const liveMeta = getModuleStatusMeta(module);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        isLive
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
          : "bg-muted text-muted-foreground border border-border",
        className,
      )}
      data-module={module}
      data-module-status={isLive ? "live" : loading ? "sync" : "demo"}
      title={isLive ? liveMeta.description : error ? `Error: ${error}` : "Loading live data…"}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isLive ? "bg-emerald-500 animate-pulse" : loading ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/60",
        )}
        aria-hidden
      />
      {isLive ? "Live" : loading ? "Sync" : "Demo"}
    </span>
  );
}
