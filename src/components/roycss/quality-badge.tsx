"use client";

import { useMemo } from "react";
import {
  Zap,
  Accessibility,
  Globe,
  Smartphone,
  EyeOff,
  Code2,
  type LucideIcon,
} from "lucide-react";
import {
  computeQualityScore,
  scoreToGrade,
  gradeToClasses,
  SUB_SCORES,
  type QualityBadge as QualityBadgeData,
} from "@/lib/effect-quality";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
   Static lookup tables (so Tailwind can see every class literal)
   ────────────────────────────────────────────────────────────── */

const BADGE_ICONS: Record<string, LucideIcon> = {
  Zap,
  Accessibility,
  Globe,
  Smartphone,
  EyeOff,
  Code2,
};

interface ColorBundle {
  text: string;
  bg: string;
  bar: string;
}

const COLOR_CLASSES: Record<string, ColorBundle> = {
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500",
  },
  teal: {
    text: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
    bar: "bg-teal-500",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    bar: "bg-amber-500",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    bar: "bg-rose-500",
  },
  slate: {
    text: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
    bar: "bg-slate-500",
  },
};

function colorBundle(name: string): ColorBundle {
  return COLOR_CLASSES[name] ?? COLOR_CLASSES.slate;
}

/* ──────────────────────────────────────────────────────────────
   Mini sub-score row (reused in tooltip + full mode)
   ────────────────────────────────────────────────────────────── */

function SubScoreRow({
  label,
  value,
  colorName,
  compact,
}: {
  label: string;
  value: number;
  colorName: string;
  compact?: boolean;
}) {
  const color = colorBundle(colorName);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={cn(
          "text-muted-foreground shrink-0",
          compact ? "text-[10px] w-14" : "text-[11px] w-16",
        )}
      >
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[36px]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color.bar)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-mono font-semibold text-foreground tabular-nums w-7 text-right shrink-0">
        {value}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Badge chip (icon + tooltip)
   ────────────────────────────────────────────────────────────── */

function BadgeChip({ badge, size = "sm" }: { badge: QualityBadgeData; size?: "sm" | "md" }) {
  const Icon = BADGE_ICONS[badge.icon] ?? Code2;
  const color = colorBundle(badge.color);
  const dim = size === "sm" ? "size-6" : "size-7";
  const iconDim = size === "sm" ? "size-3.5" : "size-4";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="img"
          aria-label={`${badge.label}: ${badge.description}`}
          className={cn(
            "flex items-center justify-center rounded-full border border-border/40 cursor-help",
            dim,
            color.bg,
            color.text,
          )}
        >
          <Icon className={iconDim} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[220px]">
        <div className="font-semibold text-xs">{badge.label}</div>
        <div className="text-[10px] opacity-80 mt-0.5 leading-snug">
          {badge.description}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/* ──────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────── */

export interface QualityBadgeProps {
  css: string;
  /** Compact = single grade circle with hover tooltip. Full = circle + 4 bars + badge icons. */
  compact?: boolean;
  className?: string;
}

export function QualityBadge({ css, compact = false, className }: QualityBadgeProps) {
  const score = useMemo(() => computeQualityScore(css), [css]);
  const grade = scoreToGrade(score.overall);
  const classes = gradeToClasses(grade);

  /* ── COMPACT MODE ─────────────────────────────────────────── */
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="img"
            aria-label={`Roy Verified quality grade ${grade}, overall score ${score.overall} out of 100`}
            className={cn(
              "flex items-center justify-center size-7 rounded-full border font-display font-bold text-xs cursor-help shrink-0",
              classes.text,
              classes.bg,
              classes.border,
              className,
            )}
          >
            {grade}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-60 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Quality Score</span>
            <span className="text-xs font-mono font-bold">
              {score.overall}
              <span className="opacity-50">/100</span>
              <span className="ml-1.5">{grade}</span>
            </span>
          </div>
          <div className="space-y-1.5">
            {SUB_SCORES.map((sub) => (
              <SubScoreRow
                key={sub.key}
                label={sub.label}
                value={score[sub.key]}
                colorName={sub.color}
                compact
              />
            ))}
          </div>
          {score.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/40">
              {score.badges.map((b) => (
                <span
                  key={b.label}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  /* ── FULL MODE ────────────────────────────────────────────── */
  return (
    <div
      className={cn(
        "flex items-center gap-3 sm:gap-4 flex-wrap",
        className,
      )}
    >
      {/* Grade circle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="img"
            aria-label={`Roy Verified quality grade ${grade}, overall score ${score.overall} out of 100`}
            className={cn(
              "relative flex items-center justify-center size-14 rounded-full border-2 font-display font-bold text-lg shrink-0 cursor-help",
              classes.text,
              classes.bg,
              classes.border,
            )}
          >
            {grade}
            <span
              className={cn(
                "absolute -bottom-1.5 -right-1.5 text-[10px] font-mono font-bold rounded-full px-1.5 py-0.5 border bg-background",
                classes.border,
                classes.text,
              )}
            >
              {score.overall}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="text-xs font-semibold">
            Roy Verified™ Score · Grade {grade}
          </span>
        </TooltipContent>
      </Tooltip>

      {/* Sub-scores (2 × 2 grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 flex-1 min-w-[180px]">
        {SUB_SCORES.map((sub) => (
          <SubScoreRow
            key={sub.key}
            label={sub.label}
            value={score[sub.key]}
            colorName={sub.color}
          />
        ))}
      </div>

      {/* Badge icons */}
      {score.badges.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {score.badges.map((badge) => (
            <BadgeChip key={badge.label} badge={badge} size="md" />
          ))}
        </div>
      )}
    </div>
  );
}
