import { describe, expect, it } from "vitest";
import {
  computeEffectQualityScore,
  computeQualityScore,
  EFFECT_QUALITY_MAX,
  EFFECT_QUALITY_MIN,
  gradeEffectQuality,
  gradeToClassName,
  scoreToGrade,
  scoreToGradeFromSignals,
  type EffectQualitySignals,
  type QualitySignals,
} from "@/lib/effect-quality";

/**
 * Unit coverage for src/lib/effect-quality.ts — the module PF-042
 * activates for dist/roycss.manifest.json (its effect half) plus the
 * original product half (consumed by quality-badge.tsx). The manifest
 * drift tests live in tests/unit/manifest.test.ts; these pin the pure
 * scoring functions themselves: ranges, boundaries, weights, and the
 * documented degenerate-entry guard.
 */

/** A polished, self-contained, evergreen effect — every signal at its best. */
const fullMarks: EffectQualitySignals = {
  descriptionLength: 120, // docs cap reached
  tagCount: 6, // discoverability cap reached
  cssLength: 1500, // leanness cap reached
  hasPreview: true,
  motionSafe: true,
  requiresAria: false,
  scrollDriven: false,
  webkitPrefixed: true, // +10 compat
};

/** The weakest realistic entry — every signal at its floor. */
const floorMarks: EffectQualitySignals = {
  descriptionLength: 0,
  tagCount: 0,
  cssLength: 8000,
  hasPreview: true,
  motionSafe: false,
  requiresAria: true,
  scrollDriven: false,
  webkitPrefixed: false,
};

describe("computeEffectQualityScore (effect half)", () => {
  it("returns the maximum for a fully-polished effect", () => {
    // a11y 100*0.3 + docs 100*0.25 + lean 100*0.2 + find 100*0.15 + compat 100*0.1
    expect(computeEffectQualityScore(fullMarks)).toBe(100);
  });

  it("returns the floor for the weakest realistic entry", () => {
    // a11y 55*0.3 + docs 0 + lean 0 + find 0 + compat 90*0.1 = 25.5 → 26
    expect(computeEffectQualityScore(floorMarks)).toBe(26);
    expect(gradeEffectQuality(floorMarks)).toBe("F"); // 26 < 60
  });

  it("scores a degenerate entry (no preview) at the documented minimum", () => {
    expect(computeEffectQualityScore({ ...fullMarks, hasPreview: false })).toBe(EFFECT_QUALITY_MIN);
  });

  it("clamps every combination into the documented 0–100 range", () => {
    // Sweep the signal space coarsely — nothing may escape the range.
    for (const descriptionLength of [0, 60, 120, 500]) {
      for (const tagCount of [0, 3, 6, 12]) {
        for (const cssLength of [0, 1500, 4000, 8000, 20000]) {
          for (const flags of [
            { motionSafe: true, requiresAria: false },
            { motionSafe: false, requiresAria: true },
          ]) {
            for (const compat of [
              { scrollDriven: false, webkitPrefixed: false },
              { scrollDriven: true, webkitPrefixed: true },
            ]) {
              const score = computeEffectQualityScore({
                descriptionLength,
                tagCount,
                cssLength,
                hasPreview: true,
                ...flags,
                ...compat,
              });
              expect(score).toBeGreaterThanOrEqual(EFFECT_QUALITY_MIN);
              expect(score).toBeLessThanOrEqual(EFFECT_QUALITY_MAX);
            }
          }
        }
      }
    }
  });

  it("penalizes scroll-driven engine dependency by 4 quality points (compat 10% × −40)", () => {
    const evergreen = computeEffectQualityScore(fullMarks);
    const limited = computeEffectQualityScore({ ...fullMarks, scrollDriven: true });
    expect(evergreen - limited).toBe(4); // 40 * 0.10
  });

  it("rewards own reduced-motion guards and penalizes hidden text (a11y 30%)", () => {
    const base = { ...fullMarks, webkitPrefixed: false }; // compat 90
    const caution = computeEffectQualityScore({ ...base, motionSafe: false }); // a11y 70
    const safe = computeEffectQualityScore(base); // a11y 100
    const aria = computeEffectQualityScore({ ...base, requiresAria: true }); // a11y 85
    expect(safe - caution).toBe(9); // 30 * 0.30
    expect(safe - aria).toBe(4); // 15 * 0.30 = 4.5, halved by the final Math.round
  });

  it("caps leanness decay at 8KB of cssCode (scores 0 lean, not negative)", () => {
    expect(computeEffectQualityScore({ ...fullMarks, cssLength: 8000 })).toBe(
      computeEffectQualityScore({ ...fullMarks, cssLength: 80000 }),
    );
  });
});

describe("gradeEffectQuality + scoreToGrade (shared grading)", () => {
  it("maps the effect half onto the letter grades", () => {
    expect(gradeEffectQuality(fullMarks)).toBe("A");
    expect(gradeEffectQuality(floorMarks)).toBe("F");
    expect(gradeEffectQuality({ ...fullMarks, hasPreview: false })).toBe("F");
  });

  it("maps score boundaries to grades (>=90 A, >=80 B, >=70 C, >=60 D, else F)", () => {
    expect(scoreToGrade(100)).toBe("A");
    expect(scoreToGrade(90)).toBe("A");
    expect(scoreToGrade(89)).toBe("B");
    expect(scoreToGrade(80)).toBe("B");
    expect(scoreToGrade(79)).toBe("C");
    expect(scoreToGrade(70)).toBe("C");
    expect(scoreToGrade(69)).toBe("D");
    expect(scoreToGrade(60)).toBe("D");
    expect(scoreToGrade(59)).toBe("F");
    expect(scoreToGrade(0)).toBe("F");
  });

  it("maps every grade to a tailwind badge class", () => {
    for (const grade of ["A", "B", "C", "D", "F"] as const) {
      expect(gradeToClassName(grade)).toMatch(/^bg-\w+-500\/15 text-\w+-600 dark:text-\w+-400$/);
    }
    // The default branch maps unknown values to the F styling.
    expect(gradeToClassName("X" as never)).toBe(gradeToClassName("F"));
  });
});

describe("computeQualityScore (product half — unchanged API)", () => {
  it("blends status and tier with the polish signals (weights 30/30/20/20 + metrics bonus)", () => {
    const live: QualitySignals = { status: "live", tier: "enterprise", descriptionLength: 100, tagCount: 6, hasMetrics: true };
    expect(computeQualityScore(live)).toBe(100);
  });

  it("falls back to neutral defaults when status/tier are absent", () => {
    // status 50*0.3 + tier 70*0.3 + docs 0 + tags 0 + no bonus = 36
    expect(computeQualityScore({})).toBe(36);
  });

  it("treats unknown status/tier values as mid-tier (?? fallbacks)", () => {
    const unknown: QualitySignals = { status: "beta", tier: "pro", descriptionLength: 0, tagCount: 0 };
    // 70*0.3 + 90*0.3 = 48
    expect(computeQualityScore(unknown)).toBe(48);
  });

  it("clamps out-of-range polish signals instead of exploding", () => {
    const negative: QualitySignals = { status: "live", tier: "cloud", descriptionLength: -50, tagCount: -3 };
    expect(computeQualityScore(negative)).toBeGreaterThanOrEqual(0);
    expect(computeQualityScore(negative)).toBeLessThanOrEqual(100);
    const huge: QualitySignals = { status: "roadmap", tier: "free", descriptionLength: 10000, tagCount: 100 };
    expect(computeQualityScore(huge)).toBeGreaterThanOrEqual(0);
    expect(computeQualityScore(huge)).toBeLessThanOrEqual(100);
  });

  it("computes the grade from signals in one call", () => {
    expect(scoreToGradeFromSignals({ status: "live", tier: "enterprise", descriptionLength: 100, tagCount: 6, hasMetrics: true })).toBe("A");
    expect(scoreToGradeFromSignals({})).toBe("F");
  });
});
