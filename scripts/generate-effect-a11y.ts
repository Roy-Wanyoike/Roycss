/**
 * RoyCSS Effect Accessibility Tag Generator (PF-004 — code half)
 *
 * Derives per-effect accessibility tags from the 1,973-effect catalog
 * (src/lib/effects-batch-{1..53}.ts, imported through src/lib/roycss-effects.ts)
 * and emits them as a standalone TypeScript module at src/lib/effect-a11y.ts:
 *
 *   Record<effectId, { motionSafe, decorationOnly, requiresAria? }>
 *   + getEffectA11y(id) lookup + effectA11yStats distribution counts.
 *
 * The derivation is a comment-stripped regex analysis of each effect's
 * cssCode. It is intentionally conservative and HONEST about its decisions:
 *
 *   motionSafe: true  — the effect's own cssCode ships a
 *                       `prefers-reduced-motion` media guard.
 *   motionSafe: false — no per-effect guard. NOT "unsafe to install":
 *                       dist/roycss.css ships a GLOBAL reduced-motion
 *                       kill-switch that covers every effect; the flag only
 *                       tells standalone copy-paste users they may want to
 *                       add their own guard. (See docs/EFFECT-A11Y-TIERS.md §4.)
 *
 *   decorationOnly: true  — no interactive pseudo-classes in the cssCode.
 *   decorationOnly: false — the cssCode responds to user input.
 *
 *   requiresAria: "<reason>" — the cssCode hides real text via a known
 *                           pattern; the reason names the highest-priority
 *                           match (one guidance note per effect).
 *
 * Honest decisions (documented so nobody "fixes" them by accident):
 *   1. Hover IS interaction. An effect with a `:hover`/`:focus`/`:active`
 *      rule changes its presentation in response to user input, so it is
 *      flagged interactive-relevant (`:focus-visible`/`:focus-within` count
 *      as `:focus`).
 *   2. Form-state pseudo-classes (:checked, :invalid, …) count as
 *      interaction — they style user-driven state.
 *   3. `background-clip: text` suppresses the redundant transparent-text
 *      note: the transparent fill is part of the gradient technique, so the
 *      effect is reported once as "gradient-clipped-text", not twice.
 *   4. `font-size: 0` is ranked below transparent-text because every
 *      current occurrence also sets a transparent color (verified: 23/23);
 *      the rule stays for future effects that collapse text without one.
 *   5. The sr-only recipe deliberately does NOT match `clip-path: inset(…)`
 *      inside @keyframes — animated clipping (glitch effects) is motion,
 *      not a visually-hidden recipe.
 *
 * Usage:
 *   bun run gen:a11y                          (package.json alias)
 *   bun run scripts/generate-effect-a11y.ts   (equivalent)
 *
 * Output: src/lib/effect-a11y.ts (checked in). The output is deterministic:
 * no timestamps, no environment data, catalog order preserved — running the
 * generator twice is byte-stable.
 *
 * NOT chained into scripts/build-package.ts: this generator writes src/
 * (a checked-in source module), not dist/ — the same precedent as
 * scripts/generate-docs-index.ts → src/lib/docs-data.ts. Drift between the
 * catalog and the generated module is instead gated by
 * tests/unit/effect-a11y.test.ts (id-set equality, per-effect rule
 * re-derivation, and a file-level grep of the 53 batch sources), so CI
 * fails if the catalog changes without a regeneration.
 *
 * See docs/EFFECT-A11Y-TIERS.md for the user-facing tier documentation.
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { effects } from "../src/lib/roycss-effects";

const ROOT = import.meta.dir + "/..";
const OUT_FILE = join(ROOT, "src", "lib", "effect-a11y.ts");

/* ─── Derivation rules ──────────────────────────────────────────
   Kept deliberately small and explainable — every rule below is
   cross-checked per-effect by tests/unit/effect-a11y.test.ts. */

/** Form-state pseudo-classes that style user-driven state (decision 2). */
const FORM_STATE_PSEUDO = [
  ":checked",
  ":indeterminate",
  ":invalid",
  ":valid",
  ":required",
  ":optional",
  ":disabled",
  ":enabled",
  ":read-only",
  ":read-write",
  ":placeholder-shown",
  ":default",
  ":in-range",
  ":out-of-range",
  ":autofill",
] as const;

/** `:hover`, `:active`, `:focus` (incl. -visible/-within) (decision 1). */
const HOVER_FOCUS_ACTIVE = /:(hover|active|focus)\b/;

/** The ranked text-hiding reasons (decision 3 suppresses transparent-text). */
const ARIA_REASONS = [
  "sr-only",
  "attr-content",
  "gradient-clipped-text",
  "transparent-text",
  "zero-font",
] as const;

export type EffectAriaReason = (typeof ARIA_REASONS)[number];

export interface DerivedEffectA11y {
  motionSafe: boolean;
  decorationOnly: boolean;
  requiresAria?: EffectAriaReason;
}

/** Remove block comments so commented-out CSS cannot flip a rule. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Derive the a11y tags for one effect from its cssCode. */
export function deriveEffectA11y(cssCode: string): DerivedEffectA11y {
  const css = stripCssComments(cssCode);

  // ── Motion ──
  const motionSafe = css.includes("prefers-reduced-motion");

  // ── Interaction (decisions 1 + 2) ──
  const interactive =
    HOVER_FOCUS_ACTIVE.test(css) ||
    FORM_STATE_PSEUDO.some((p) => new RegExp(p + "(?![a-zA-Z-])").test(css));
  const decorationOnly = !interactive;

  // ── Text-hiding patterns → one ranked reason (decisions 3 + 4) ──
  const srOnly =
    /clip:\s*rect\(/.test(css) ||
    (/width:\s*1px\b/.test(css) &&
      /height:\s*1px\b/.test(css) &&
      /overflow:\s*hidden\b/.test(css)); // decision 5: no clip-path-in-keyframes
  const attrContent = /attr\(/.test(css);
  const gradientClipped = /background-clip:\s*text\b/.test(css);
  const transparentText =
    /(?<![-a-zA-Z])color:\s*transparent\b/.test(css) || // bounded: no *-color longhands
    /-webkit-text-fill-color:\s*transparent\b/.test(css);
  const zeroFont = /font-size:\s*0(?![\d.])/.test(css);

  let requiresAria: EffectAriaReason | undefined;
  if (srOnly) requiresAria = "sr-only";
  else if (attrContent) requiresAria = "attr-content";
  else if (gradientClipped) requiresAria = "gradient-clipped-text";
  else if (transparentText) requiresAria = "transparent-text";
  else if (zeroFont) requiresAria = "zero-font";

  return {
    motionSafe,
    decorationOnly,
    ...(requiresAria ? { requiresAria } : {}),
  };
}

/* ─── Emission ────────────────────────────────────────────────── */

function emitEntry(id: string, a11y: DerivedEffectA11y): string {
  const parts = [`motionSafe: ${a11y.motionSafe}`, `decorationOnly: ${a11y.decorationOnly}`];
  if (a11y.requiresAria) parts.push(`requiresAria: ${JSON.stringify(a11y.requiresAria)}`);
  return `  ${JSON.stringify(id)}: { ${parts.join(", ")} },`;
}

function main() {
  const derived = effects.map((e) => ({ id: e.id, a11y: deriveEffectA11y(e.cssCode) }));

  // Distribution summary (pinned by tests + docs — keep all three in lockstep).
  const total = derived.length;
  const motionSafe = derived.filter((d) => d.a11y.motionSafe).length;
  const interactive = derived.filter((d) => !d.a11y.decorationOnly).length;
  const ariaRequired = derived.filter((d) => d.a11y.requiresAria).length;
  const stats = {
    total,
    motionSafe,
    motionCaution: total - motionSafe,
    interactive,
    decorative: total - interactive,
    ariaRequired,
  };

  const lines: string[] = [];
  lines.push("/**");
  lines.push(" * RoyCSS Effect Accessibility Tags — GENERATED FILE. DO NOT EDIT BY HAND.");
  lines.push(" *");
  lines.push(" * Regenerate with:  bun run gen:a11y   (or: bun run scripts/generate-effect-a11y.ts)");
  lines.push(" *");
  lines.push(" * Source: the 1,973-effect catalog (src/lib/effects-batch-{1..53}.ts via");
  lines.push(" * src/lib/roycss-effects.ts). One derived a11y record per effect id.");
  lines.push(" * Consumers: src/lib/effect-a11y-badges.ts (badge derivation),");
  lines.push(" *            src/components/roycss/effect-card.tsx (card pills),");
  lines.push(" *            src/components/roycss/roycss-page.tsx (Motion-safe filter).");
  lines.push(" *");
  lines.push(" * Derivation (comment-stripped regex analysis of each cssCode — the rules");
  lines.push(" * and their honest decisions live in scripts/generate-effect-a11y.ts):");
  lines.push(" *   motionSafe     — the cssCode ships its own prefers-reduced-motion guard.");
  lines.push(" *   decorationOnly  — no :hover/:focus/:active or form-state pseudo-classes.");
  lines.push(" *   requiresAria   — the cssCode hides real text (gradient-clipped text,");
  lines.push(" *                    transparent text, attr() content, font-size: 0, or an");
  lines.push(" *                    sr-only recipe); the value is the top-priority reason.");
  lines.push(" *");
  lines.push(" * DESIGN DECISIONS (do not undo without updating docs/EFFECT-A11Y-TIERS.md):");
  lines.push(" *   - CSSEffect (src/lib/roycss-types.ts) is deliberately UNTOUCHED. The 52");
  lines.push(" *     batch files construct it; derived data lives beside it and is consumed");
  lines.push(" *     by composition (id lookup), not by mutating the catalog type.");
  lines.push(" *   - motionSafe: false does NOT mean \"unsafe to install\": dist/roycss.css");
  lines.push(" *     ships a global @media (prefers-reduced-motion: reduce) kill-switch that");
  lines.push(" *     disables every effect's animation when the user opts out. The flag only");
  lines.push(" *     means the effect has no guard of its own for standalone copy-paste use.");
  lines.push(" *");
  lines.push(
    ` * Distribution (pinned by tests/unit/effect-a11y.test.ts): ${stats.total} total ·` +
      ` ${stats.motionSafe} motion-safe · ${stats.motionCaution} motion-caution ·`,
  );
  lines.push(
    ` *   ${stats.decorative} decorative · ${stats.interactive} interactive · ${stats.ariaRequired} aria-required.`,
  );
  lines.push(" */");
  lines.push("");
  lines.push("/** The known text-hiding reasons (highest priority first). */");
  lines.push("export type EffectAriaReason =");
  for (let i = 0; i < ARIA_REASONS.length; i++) {
    const reason = ARIA_REASONS[i];
    lines.push(`  | "${reason}"${i === ARIA_REASONS.length - 1 ? ";" : ""}`);
  }
  lines.push("");
  lines.push("/** Derived per-effect accessibility tags (see file header). */");
  lines.push("export interface EffectA11y {");
  lines.push("  /** Ships its own prefers-reduced-motion guard. */");
  lines.push("  motionSafe: boolean;");
  lines.push("  /** No interactive pseudo-classes (:hover/:focus/:active/form-state). */");
  lines.push("  decorationOnly: boolean;");
  lines.push("  /** Top-priority text-hiding reason, when the cssCode hides real text. */");
  lines.push("  requiresAria?: EffectAriaReason;");
  lines.push("}");
  lines.push("");
  lines.push("export const effectA11y: Record<string, EffectA11y> = {");
  for (const d of derived) lines.push(emitEntry(d.id, d.a11y));
  lines.push("};");
  lines.push("");
  lines.push("/** Look up the derived tags for an effect id (undefined for unknown ids). */");
  lines.push("export function getEffectA11y(id: string): EffectA11y | undefined {");
  lines.push("  return effectA11y[id];");
  lines.push("}");
  lines.push("");
  lines.push("/** Corpus-wide distribution of the derived tags. */");
  lines.push("export interface EffectA11yStats {");
  lines.push("  total: number;");
  lines.push("  motionSafe: number;");
  lines.push("  motionCaution: number;");
  lines.push("  interactive: number;");
  lines.push("  decorative: number;");
  lines.push("  ariaRequired: number;");
  lines.push("}");
  lines.push("");
  lines.push("export const effectA11yStats: EffectA11yStats = {");
  lines.push(`  total: ${stats.total},`);
  lines.push(`  motionSafe: ${stats.motionSafe},`);
  lines.push(`  motionCaution: ${stats.motionCaution},`);
  lines.push(`  interactive: ${stats.interactive},`);
  lines.push(`  decorative: ${stats.decorative},`);
  lines.push(`  ariaRequired: ${stats.ariaRequired},`);
  lines.push("};");

  writeFileSync(OUT_FILE, lines.join("\n") + "\n", "utf8");

  // Console summary for verification (matches docs/EFFECT-A11Y-TIERS.md §4).
  console.log(`Derived a11y tags for ${total} effects → ${OUT_FILE}`);
  console.log("Distribution:");
  console.log(`  motion-safe    ${stats.motionSafe}`);
  console.log(`  motion-caution ${stats.motionCaution}`);
  console.log(`  decorative      ${stats.decorative}`);
  console.log(`  interactive    ${stats.interactive}`);
  console.log(`  aria-required  ${stats.ariaRequired}`);
  const byReason = new Map<string, number>();
  for (const d of derived) {
    if (d.a11y.requiresAria) {
      byReason.set(d.a11y.requiresAria, (byReason.get(d.a11y.requiresAria) ?? 0) + 1);
    }
  }
  console.log("  by reason:     " + [...ARIA_REASONS].map((r) => `${r} ${byReason.get(r) ?? 0}`).join(" · "));
}

main();
