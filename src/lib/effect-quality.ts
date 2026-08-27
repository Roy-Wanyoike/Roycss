/**
 * effect-quality.ts — quality scoring & grading for products and effects.
 *
 * Pure heuristic that turns a few easy-to-compute signals (status, tier,
 * description length, tag count, metrics presence) into a 0–100 score and a
 * letter grade (A / B / C / D / F). Used by ProductCard to surface a
 * "quality score" badge so users can spot the most polished products at a
 * glance without inspecting every card.
 *
 * The function is intentionally side-effect free and pure so it can be
 * safely called inside `useMemo` from any client component.
 */

export type EffectGrade = "A" | "B" | "C" | "D" | "F";

export interface QualitySignals {
  /** Product status — "live" beats "beta" beats "coming-soon". */
  status?: "live" | "beta" | "coming-soon" | "ready" | "roadmap";
  /** Product tier — "free" / "pro" / "team" / "enterprise". */
  tier?: "free" | "pro" | "team" | "enterprise" | "cloud";
  /** Short description (longer = more documentation effort). */
  descriptionLength?: number;
  /** Number of tags — more tags = more discoverable. */
  tagCount?: number;
  /** Whether the product surfaces quantitative metrics (e.g. "62 effects"). */
  hasMetrics?: boolean;
}

const STATUS_SCORE: Record<string, number> = {
  live: 100,
  ready: 100,
  beta: 70,
  "coming-soon": 40,
  roadmap: 40,
};

const TIER_SCORE: Record<string, number> = {
  free: 80,
  pro: 90,
  team: 90,
  enterprise: 100,
  cloud: 85,
};

/** Map a 0–100 numeric score to a letter grade. */
export function scoreToGrade(score: number): EffectGrade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/** Map a letter grade to a tailwind className suitable for a badge. */
export function gradeToClassName(grade: EffectGrade): string {
  switch (grade) {
    case "A":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "B":
      return "bg-lime-500/15 text-lime-600 dark:text-lime-400";
    case "C":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
    case "D":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400";
    case "F":
    default:
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400";
  }
}

/** Compute a 0–100 quality score from a handful of signals. Pure & safe. */
export function computeQualityScore(signals: QualitySignals): number {
  const statusScore = signals.status
    ? STATUS_SCORE[signals.status] ?? 50
    : 50;
  const tierScore = signals.tier
    ? TIER_SCORE[signals.tier] ?? 70
    : 70;

  // Description length — encourages meaningful copy (caps at 100 chars).
  const descLen = Math.max(0, signals.descriptionLength ?? 0);
  const descScore = Math.min(100, (descLen / 100) * 100);

  // Tag count — more tags help discoverability (caps at 6 tags).
  const tagScore = Math.min(100, ((signals.tagCount ?? 0) / 6) * 100);

  // Bonus for surfacing quantitative metrics
  const metricsBonus = signals.hasMetrics ? 5 : 0;

  // Weighted blend — status and tier matter most (60%), polish signals (40%)
  const blended =
    statusScore * 0.3 +
    tierScore * 0.3 +
    descScore * 0.2 +
    tagScore * 0.2 +
    metricsBonus;

  return Math.round(Math.max(0, Math.min(100, blended)));
}

/** Convenience: compute the score then return the letter grade in one call. */
export function scoreToGradeFromSignals(signals: QualitySignals): EffectGrade {
  return scoreToGrade(computeQualityScore(signals));
}
