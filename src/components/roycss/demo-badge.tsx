import { cn } from "@/lib/utils";
import {
  getModuleStatus,
  getModuleStatusMeta,
  type ModuleStatus,
} from "@/lib/module-status";

/**
 * DemoBadge — honest status pill for modules whose data is NOT live.
 *
 * Registry-driven: pass the module key (see `src/lib/module-status.ts`)
 * and the badge renders the registry's status. If the registry says the
 * module is live, the badge renders nothing — so callers can mount it
 * unconditionally next to a card title and the label can never drift
 * from the registry.
 *
 * Design notes:
 *   • Mirrors `BackendLiveBadge`'s pill anatomy (dot + uppercase
 *     micro-label) so the two read as siblings.
 *   • Color semantics are deliberately distinct from "Live":
 *       live → emerald (positive)   ← BackendLiveBadge
 *       demo → amber  (caution: sample data)
 *       catalog-only → sky (informational: static listing)
 *   • Accessible: the visible copy is unambiguous ("Demo data — not
 *     live") and the `title` tooltip carries the full explanation.
 */

type NonLiveStatus = Exclude<ModuleStatus, "live">;

const TONE: Record<NonLiveStatus, { pill: string; dot: string }> = {
  demo: {
    pill: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25",
    dot: "bg-amber-500",
  },
  "catalog-only": {
    pill: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/25",
    dot: "bg-sky-500",
  },
};

interface DemoBadgeProps {
  /** Registry key — must exist in `src/lib/module-status.ts`. */
  module: string;
  className?: string;
}

export function DemoBadge({ module, className }: DemoBadgeProps) {
  const status = getModuleStatus(module);

  // Live modules have nothing to disclose — render nothing.
  if (status === "live") return null;

  const meta = getModuleStatusMeta(module);
  const tone = TONE[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        tone.pill,
        className,
      )}
      data-module={module}
      data-module-status={status}
      title={meta.description}
    >
      <span className={cn("size-1.5 rounded-full", tone.dot)} aria-hidden />
      {meta.text}
    </span>
  );
}
