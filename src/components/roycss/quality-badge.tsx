"use client";

import { useMemo } from "react";
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

/* ──────────────────────────────────────────────────────────────
   QualityBadge — small grade chip that surfaces a product/effect's
   quality score as a single letter (A/B/C/D/F) in a colored circle.

   Driven by the pure `computeQualityScore` heuristic in
   `@/lib/effect-quality`, which combines status, tier, description
   length, tag count, and metrics presence into a 0–100 score.

   Two sizes:
     • compact (default) — a 28px circle with the letter
     • full                — a 56px circle with the letter and a small
                              numeric score badge in the corner
   ────────────────────────────────────────────────────────────── */

export interface QualityBadgeProps {
  /** Quality signals used to compute the 0–100 score. */
  signals: QualitySignals;
  /** Compact = single letter circle. Full = larger circle with numeric badge. */
  compact?: boolean;
  className?: string;
}

/** Convenience helper: compute score + grade in one call (memoizable). */
function useQualityGrade(signals: QualitySignals): { score: number; grade: EffectGrade } {
  return useMemo(() => {
    const score = computeQualityScore(signals);
    return { score, grade: scoreToGrade(score) };
  }, [signals]);
}

export function QualityBadge({ signals, compact = false, className }: QualityBadgeProps) {
  const { score, grade } = useQualityGrade(signals);
  const gradeClass = gradeToClassName(grade);

  /* ── COMPACT MODE ─────────────────────────────────────────── */
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="img"
            aria-label={`Roy Verified quality grade ${grade}, score ${score} out of 100`}
            className={cn(
              "flex items-center justify-center size-7 rounded-full border border-border/40 font-display font-bold text-xs cursor-help shrink-0",
              gradeClass,
              className,
            )}
          >
            {grade}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-40 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold">Quality Score</span>
            <span className="text-xs font-mono font-bold">
              {score}
              <span className="opacity-50">/100</span>
              <span className="ml-1.5">{grade}</span>
            </span>
          </div>
          <p className="text-[10px] opacity-80 leading-snug">
            Heuristic blend of status, tier, description length, tag count, and metrics presence.
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  /* ── FULL MODE ────────────────────────────────────────────── */
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="img"
          aria-label={`Roy Verified quality grade ${grade}, score ${score} out of 100`}
          className={cn(
            "relative flex items-center justify-center size-14 rounded-full border-2 border-border/40 font-display font-bold text-lg shrink-0 cursor-help",
            gradeClass,
            className,
          )}
        >
          {grade}
          <span
            className={cn(
              "absolute -bottom-1.5 -right-1.5 text-[10px] font-mono font-bold rounded-full px-1.5 py-0.5 border bg-background",
              gradeClass,
            )}
          >
            {score}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <span className="text-xs font-semibold">
          Roy Verified™ Score · Grade {grade} · {score}/100
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
