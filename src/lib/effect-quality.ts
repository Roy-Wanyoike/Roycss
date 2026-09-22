/**
 * effect-quality.ts — quality scoring & grading for products and effects.
 *
 * Two scoring halves, one file:
 *
 *   1. PRODUCT half (original): `computeQualityScore` turns a few
 *      easy-to-compute signals (status, tier, description length, tag
 *      count, metrics presence) into a 0–100 score and a letter grade.
 *      Written for the product cards; available to any UI surface via
 *      `src/components/roycss/quality-badge.tsx`.
 *
 *   2. EFFECT half (PF-042): `computeEffectQualityScore` scores every
 *      effect in the 1,983-effect catalog for `dist/roycss.manifest.json`
 *      from REAL per-effect signals — a11y tags (src/lib/effect-a11y.ts),
 *      description length (the catalog's per-effect documentation),
 *      tag count, cssCode size, preview presence, and browser-support
 *      flags derived from the cssCode's feature usage. The mapping from
 *      catalog effect → signals lives in scripts/generate-manifest.ts;
 *      this module stays pure and catalog-free on purpose.
 *
 * Both functions are intentionally side-effect free and pure so they can
 * be safely called inside `useMemo` from any client component AND from
 * Bun/Node generator scripts without a DOM.
 *
 * Score range for both halves: 0–100 (EFFECT_QUALITY_MIN/MAX pin the
 * effect half; tests/unit/manifest.test.ts enforces it).
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

/* ═══════════════════════════════════════════════════════════════════
   EFFECT half (PF-042 — per-effect quality scores for
   dist/roycss.manifest.json). Same conventions as the product half
   above: typed signals in, 0–100 blended score out, letter grades via
   the shared scoreToGrade(). Pure — the caller maps catalog effects to
   signals (scripts/generate-manifest.ts does exactly that).
   ═══════════════════════════════════════════════════════════════════ */

/** Documented score range for the effect half (tests pin against these). */
export const EFFECT_QUALITY_MIN = 0;
export const EFFECT_QUALITY_MAX = 100;

export interface EffectQualitySignals {
  /** Character count of the effect's description — the per-effect documentation the catalog actually ships. */
  descriptionLength: number;
  /** Number of curated tags on the effect. */
  tagCount: number;
  /** Bytes of the effect's cssCode — lean payloads score higher. */
  cssLength: number;
  /** The effect declares a valid previewType (box/text/button/loader/card/background). */
  hasPreview: boolean;
  /** Ships its own prefers-reduced-motion guard (from src/lib/effect-a11y.ts). */
  motionSafe: boolean;
  /** Hides real text, so authors must add ARIA (from src/lib/effect-a11y.ts). */
  requiresAria: boolean;
  /** Uses scroll-driven animations — limited engine support (Chrome 115+/Safari 17.4+, no Firefox). */
  scrollDriven: boolean;
  /** Ships -webkit- fallback declarations where Safari still requires them. */
  webkitPrefixed: boolean;
}

/* Tuning constants — documented so the weights are auditable, not magic:

     a11y (30%)   70 base + 30 when the effect guards reduced-motion itself
                  − 15 when it hides text and needs author-side ARIA.
                  Range [55, 100]. A motion-caution effect is NOT penalised
                  to zero: dist/roycss.css ships the global kill-switch
                  (docs/EFFECT-A11Y-TIERS.md §4) — the flag only matters
                  for standalone copy-paste use, so it is a mild signal.
     docs  (25%)  description chars / 120, capped. The catalog has no
                  per-effect doc pages — the description IS the per-effect
                  documentation signal that exists.
     lean  (20%)  100 at ≤ 1.5KB of cssCode, linear decay to 0 at 8KB.
                  Heavier effects cost more payload/parse time per use.
     find  (15%)  tags / 6, capped — same discoverability cap as the
                  product half.
     compat(10%)  90 base − 40 when the effect depends on scroll-driven
                  animations (the only limited-support feature, per
                  docs/concepts/browser-support) + 10 when it ships the
                  -webkit- fallbacks Safari needs. Range [50, 100]. */

const EFFECT_LEAN_FULL = 1500; // bytes of cssCode that still score 100
const EFFECT_LEAN_ZERO = 8000; // bytes of cssCode that score 0
const EFFECT_DOCS_CAP = 120; // description chars that score 100
const EFFECT_TAG_CAP = 6; // tags that score 100 (product-half convention)

/** Compute the 0–100 effect quality score. Pure; see weights above. */
export function computeEffectQualityScore(signals: EffectQualitySignals): number {
  // An effect without a preview entry cannot be showcased at all — the
  // catalog schema requires previewType, so this is a degenerate-entry
  // guard rather than a realistic branch.
  if (!signals.hasPreview) return EFFECT_QUALITY_MIN;

  const a11yScore = 70 + (signals.motionSafe ? 30 : 0) - (signals.requiresAria ? 15 : 0);
  const docsScore = Math.min(100, (Math.max(0, signals.descriptionLength) / EFFECT_DOCS_CAP) * 100);
  const leanScore =
    signals.cssLength <= EFFECT_LEAN_FULL
      ? 100
      : Math.max(
          0,
          100 - ((signals.cssLength - EFFECT_LEAN_FULL) / (EFFECT_LEAN_ZERO - EFFECT_LEAN_FULL)) * 100,
        );
  const findScore = Math.min(100, (Math.max(0, signals.tagCount) / EFFECT_TAG_CAP) * 100);
  const compatScore = Math.min(
    100,
    Math.max(0, 90 - (signals.scrollDriven ? 40 : 0) + (signals.webkitPrefixed ? 10 : 0)),
  );

  const blended =
    a11yScore * 0.3 + docsScore * 0.25 + leanScore * 0.2 + findScore * 0.15 + compatScore * 0.1;

  return Math.round(Math.max(EFFECT_QUALITY_MIN, Math.min(EFFECT_QUALITY_MAX, blended)));
}

/** Convenience: effect signals → letter grade in one call. */
export function gradeEffectQuality(signals: EffectQualitySignals): EffectGrade {
  return scoreToGrade(computeEffectQualityScore(signals));
}
