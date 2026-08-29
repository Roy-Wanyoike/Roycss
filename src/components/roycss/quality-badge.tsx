"use client";

/**
 * QualityBadge — a compact UI chip that surfaces the RoyCSS "quality
 * grade" for an effect or product, backed by the heuristic scoring in
 * `src/lib/effect-quality.ts`.
 *
 * Inputs are simple signals (description length, tag count, status, tier,
 * has-metrics flag) — not raw CSS. The component is intentionally a
 * thin presentational wrapper so the same scoring logic can be reused
 * by `ProductCard` without coupling it to a specific UI shape.
 *
 * Renders nothing when no signals are supplied (avoids a meaningless
 * "F" badge when no data is available).
 */
import { useMemo } from "react";
import { ShieldCheck, type LucideIcon } from "lucide-react";
import {
  computeQualityScore,
  scoreToGrade,
  gradeToClassName,
  type QualitySignals,
  type EffectGrade,
} from "@/lib/effect-quality";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type { QualitySignals };
export type QualityBadgeProps = QualitySignals & {
  /** Compact = single grade circle. Full = circle + label. */
  compact?: boolean;
  className?: string;
};

const GRADE_LABEL: Record<EffectGrade, string> = {
  A: "Excellent",
  B: "Good",
  C: "Fair",
  D: "Below average",
  F: "Poor",
};

export function QualityBadge({
  status,
  tier,
  descriptionLength,
  tagCount,
  hasMetrics,
  compact = false,
  className,
}: QualityBadgeProps) {
  const { score, grade } = useMemo(() => {
    const signals: QualitySignals = {
      status,
      tier,
      descriptionLength,
      tagCount,
      hasMetrics,
    };
    const s = computeQualityScore(signals);
    return { score: s, grade: scoreToGrade(s) };
  }, [status, tier, descriptionLength, tagCount, hasMetrics]);

  // Don't render a badge if we have no signal data — avoids misleading F grades.
  if (
    status === undefined &&
    tier === undefined &&
    descriptionLength === undefined &&
    tagCount === undefined &&
    hasMetrics === undefined
  ) {
    return null;
  }

  const gradeClass = gradeToClassName(grade);

  const Icon: LucideIcon = ShieldCheck;
  const dim = compact ? "size-7" : "size-10";
  const textClass = compact ? "text-xs" : "text-base";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="img"
          aria-label={`Roy Verified quality grade ${grade}, ${GRADE_LABEL[grade]} (${score}/100)`}
          className={cn(
            "flex items-center justify-center rounded-full border font-display font-bold shrink-0 cursor-help",
            dim,
            textClass,
            gradeClass,
            className,
          )}
        >
          {grade}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[220px]">
        <div className="flex items-center gap-1.5 font-semibold text-xs">
          <Icon className="size-3.5" />
          Roy Verified™ · Grade {grade}
        </div>
        <div className="text-[10px] opacity-80 mt-0.5 leading-snug">
          {GRADE_LABEL[grade]} — overall quality score {score}/100 based on
          status, tier, description length, tag count, and metrics presence.
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default QualityBadge;
