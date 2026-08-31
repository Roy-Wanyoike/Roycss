import { cn } from "@/lib/utils";

interface BackendLiveBadgeProps {
  loading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * BackendLiveBadge — small pill that reads "Live" when a product card
 * is wired to real backend data, or "Demo" when in an error/loading
 * state. Helps users see at a glance which cards are real.
 */
export function BackendLiveBadge({ loading, error, className }: BackendLiveBadgeProps) {
  const isLive = !loading && !error;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        isLive
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
          : "bg-muted text-muted-foreground border border-border",
        className,
      )}
      title={isLive ? "Backed by live API data" : error ? `Error: ${error}` : "Loading live data…"}
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
