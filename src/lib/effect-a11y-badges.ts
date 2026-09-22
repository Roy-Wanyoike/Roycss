/**
 * Effect a11y badge derivation (PF-004 — UI half).
 *
 * Pure, React-free derivation of the card/filter badges from the generated
 * tags in ./effect-a11y.ts. Keeping this helper free of JSX means it runs
 * in the node vitest environment (this repo has no component/react tests),
 * so the badge logic is unit-tested directly — including the 1,578
 * motion-safe filter count that backs the grid's "Motion-safe only" chip
 * in src/components/roycss/roycss-page.tsx.
 *
 * Unknown effect ids deliberately yield NO badges and fail the motion-safe
 * filter: if the generated tags ever go stale relative to the catalog, the
 * UI fails closed instead of silently widening the filtered set.
 */

import { getEffectA11y, type EffectAriaReason } from "./effect-a11y";

/** Badge identifiers, in display order. */
export type EffectA11yBadgeKey = "motion-caution" | "decorative" | "a11y-note";

/** Visual tint for the pill (mapped to Tailwind classes by the card). */
export type EffectA11yBadgeTone = "amber" | "muted" | "violet";

export interface EffectA11yBadge {
  key: EffectA11yBadgeKey;
  label: "Motion caution" | "Decorative" | "A11y note";
  tone: EffectA11yBadgeTone;
  /** Guidance shown as the pill's title tooltip. */
  title: string;
}

/** Per-reason guidance for the "A11y note" pill. */
export const ARIA_REASON_GUIDANCE: Record<EffectAriaReason, string> = {
  "sr-only":
    "Uses a visually-hidden (sr-only) recipe — keep the readable text label for screen readers.",
  "attr-content":
    "Content is injected via attr() pseudo-elements — make sure the real element still carries the text for assistive tech.",
  "gradient-clipped-text":
    "Gradient-clipped text (background-clip: text) disappears in forced-colors modes — provide a solid-color fallback.",
  "transparent-text":
    "Text is made transparent — pair it with a screen-reader-visible label or keep the text decorative.",
  "zero-font":
    "font-size: 0 collapses the text — decorative spans only; keep real text in the markup.",
};

/** Derive the a11y pills for an effect id (unknown ids → no badges). */
export function getEffectA11yBadges(id: string): EffectA11yBadge[] {
  const a11y = getEffectA11y(id);
  if (!a11y) return [];

  const badges: EffectA11yBadge[] = [];
  if (!a11y.motionSafe) {
    badges.push({
      key: "motion-caution",
      label: "Motion caution",
      tone: "amber",
      title:
        "No per-effect prefers-reduced-motion guard. The global kill-switch shipped in roycss.css still disables it; add your own guard for standalone use.",
    });
  }
  if (a11y.decorationOnly) {
    badges.push({
      key: "decorative",
      label: "Decorative",
      tone: "muted",
      title:
        "Decoration only — the effect carries no interactive semantics; safe to aria-hide purely visual wrappers.",
    });
  }
  if (a11y.requiresAria) {
    badges.push({
      key: "a11y-note",
      label: "A11y note",
      tone: "violet",
      title: ARIA_REASON_GUIDANCE[a11y.requiresAria],
    });
  }
  return badges;
}

/**
 * Filter predicate for the "Motion-safe only" grid chip. Unknown ids
 * deliberately return false — stale generated tags fail closed.
 */
export function isMotionSafeEffect(id: string): boolean {
  return getEffectA11y(id)?.motionSafe === true;
}
