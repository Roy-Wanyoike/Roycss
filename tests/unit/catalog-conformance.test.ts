import { describe, expect, it } from "vitest";
import { effects } from "@/lib/roycss-effects";

/**
 * Catalog authoring-rule conformance gate (issue #273).
 *
 * docs/CONTRIBUTING.md authoring rules:
 *   - "Use OKLCH colors — no indigo or blue as primary. Reference
 *     src/lib/design-tokens.ts"
 *   - "GPU-accelerated — animate transform and opacity only; never
 *     top/left/width"
 *
 * Three rules, enforced over every effect's `cssCode`:
 *
 *   1. NO HEX COLOR LITERALS — the catalog hex→oklch migration (issue #273,
 *      executed by scripts/migrate-hex-oklch.ts, byte-compatible with the
 *      original scripts/migrate-colors.ts pass) is complete, so any new hex
 *      literal fails here. CSS comments and quoted strings are NOT color
 *      contexts (issue references like "(#214)" and batch-48's typewriter
 *      `content: "#FF3030"` DISPLAY hex as text) — both are masked to
 *      same-length whitespace before scanning, which also preserves
 *      line/column mapping for diagnostics.
 *
 *   2. NO LAYOUT-PROPERTY TRANSITIONS without a documented exception.
 *      Animating geometry (width/height/inset/margin/padding/gap/…) forces
 *      layout on every frame. A transition conforms when it animates only
 *      non-layout properties, or carries the inline marker comment
 *      `non-GPU by design:` on the declaration line or within the two lines
 *      above it — self-documenting exceptions for true size/auto-height
 *      reveals that have no transform equivalent. Stale markers (marker
 *      present, layout transition gone) also fail, so documentation cannot
 *      rot. Keyframe animations are NOT scanned: the issue's evidence and
 *      this gate cover transitions; keyframes are a separate follow-up.
 *
 *   3. NO INDIGO/BLUE PRIMARY COLORS in the dataviz batch (id prefix
 *      `dataviz-`, effects-batch-39.ts) — the cluster the issue was filed
 *      against. Any oklch() color with chroma ≥ 0.09 in the blue→violet hue
 *      band [230°, 300°) must be allowlisted below with a reason. Neutral
 *      slate colors (C < 0.09, e.g. the oklch(0.208 0.04 265.75) background
 *      ramp) and non-dataviz batches are out of scope: the rule targets the
 *      indigo PRIMARY cluster, not the catalog's neutral ramp. The original
 *      cluster (#6366f1/#4f46e5/#818cf8/#93c5fd) was remapped to the accent
 *      token hue 200 (design-tokens.ts) with L/C preserved so the series'
 *      lightness structure — the actual distinguishability signal — is
 *      unchanged; see the header comment in effects-batch-39.ts.
 *
 * Re-run the migration (idempotent, CI-safe with --check):
 *   bun run scripts/migrate-hex-oklch.ts --check
 */

// ─── masking (preserves indexes and line numbers) ───────────────────────────

/** Blank out CSS comments and quoted strings, keeping every \n in place. */
function maskNonColorContexts(css: string): string {
  return css.replace(
    /\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g,
    (masked) => masked.replace(/[^\n]/g, " "),
  );
}

// ─── rule 1: no hex color literals ──────────────────────────────────────────

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

// ─── rule 2: layout-property transitions ────────────────────────────────────

const TRANSITION_RE = /transition(?:-property)?\s*:([^;{}]*)/g;
const EXCEPTION_MARKER = "non-GPU by design";

const LAYOUT_PROP_RE = new RegExp(
  "^(?:" +
    [
      "width",
      "height",
      "(?:min|max)-(?:width|height|inline-size|block-size)",
      "(?:inline|block)-size",
      "left",
      "right",
      "top",
      "bottom",
      "inset(?:-(?:block|inline))?(?:-(?:start|end))?",
      "margin(?:-(?:block|inline|top|right|bottom|left))?(?:-(?:start|end))?",
      "padding(?:-(?:block|inline|top|right|bottom|left))?(?:-(?:start|end))?",
      "gap",
      "(?:row|column)-gap",
      "flex-basis",
      "border(?:-(?:block|inline|top|right|bottom|left))?(?:-(?:start|end))?-width",
    ].join("|") +
    ")$",
);

/** Split a transition value on commas that are not inside functions. */
function splitTopLevelCommas(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/** Layout-property names animated by one transition declaration. */
function layoutPropsOf(transitionValue: string): string[] {
  const props: string[] = [];
  for (const segment of splitTopLevelCommas(transitionValue)) {
    for (const token of segment.trim().split(/\s+/)) {
      if (token && LAYOUT_PROP_RE.test(token.toLowerCase())) props.push(token.toLowerCase());
    }
  }
  return props;
}

// ─── rule 3: dataviz indigo/blue primaries ──────────────────────────────────

const OKLCH_RE = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.%.]+\s*)?\)/g;
/** Blue→violet hue band (CSS blue ≈ 255°, Tailwind indigo ≈ 277°, violet ≈ 293°). */
const BLUE_BAND = { minHue: 230, maxHue: 300, minChroma: 0.09 } as const;

/**
 * Documented exceptions to rule 3. Keyed by effect id → the exact offending
 * color string that must appear verbatim in that effect's cssCode. Every
 * entry must stay live (see the stale-allowlist test below) and carry a
 * written reason.
 */
const DATVIZ_BLUE_ALLOWLIST: Record<string, Array<{ value: string; reason: string }>> = {
  "dataviz-radial-progress": [
    {
      value: "oklch(0.606 0.219 292.72)",
      reason:
        "hue-preserved stop in the 4-hue conic sweep (accent 200° → violet → pink → yellow). It is the violet-500 family (#8b5cf6 → hue 292.72), not indigo/blue, and not the effect's primary; the issue #273 scope was the indigo primary cluster, which was remapped to the accent token hue 200",
    },
  ],
};

// ─── the gate ───────────────────────────────────────────────────────────────

function lineOf(css: string, index: number): number {
  return css.slice(0, index).split("\n").length; // 1-based
}

describe("catalog authoring-rule conformance (issue #273)", () => {
  it("rule 1 — catalog cssCode contains zero hex color literals (non-color contexts masked)", () => {
    const offenders: string[] = [];
    for (const effect of effects) {
      const css = maskNonColorContexts(effect.cssCode ?? "");
      const found = Array.from(css.matchAll(HEX_RE), (m) => m[0]);
      if (found.length) {
        offenders.push(`${effect.id}: ${[...new Set(found)].join(", ")}`);
      }
    }
    expect(
      offenders,
      `hex literals must be migrated to oklch() (scripts/migrate-hex-oklch.ts):\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });

  it("rule 2 — transitions animate no layout properties without an inline exception marker", () => {
    const offenders: string[] = [];
    for (const effect of effects) {
      const original = effect.cssCode ?? "";
      const css = maskNonColorContexts(original);
      const lines = original.split("\n");
      TRANSITION_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = TRANSITION_RE.exec(css)) !== null) {
        const props = layoutPropsOf(m[1]!);
        if (!props.length) continue;
        const line = lineOf(css, m.index);
        const context = lines.slice(Math.max(0, line - 3), line);
        const excepted = context.some((l) => l.includes(EXCEPTION_MARKER));
        if (!excepted) {
          offenders.push(`${effect.id}:${line} — ${[...new Set(props)].join(", ")}`);
        }
      }
    }
    expect(
      offenders,
      `layout-property transitions cause per-frame layout thrash; convert to transform/opacity or document with a "${EXCEPTION_MARKER}: <reason>" comment on/above the declaration:\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });

  it("rule 2 — inline exception markers always annotate a live layout transition", () => {
    const stale: string[] = [];
    for (const effect of effects) {
      const original = effect.cssCode ?? "";
      if (!original.includes(EXCEPTION_MARKER)) continue;
      const css = maskNonColorContexts(original);
      const lines = original.split("\n");
      // Lines (1-based) that legitimately carry a marker for a layout transition.
      const justified = new Set<number>();
      TRANSITION_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = TRANSITION_RE.exec(css)) !== null) {
        if (!layoutPropsOf(m[1]!).length) continue;
        const line = lineOf(css, m.index);
        for (let l = Math.max(1, line - 2); l <= line; l++) justified.add(l);
      }
      lines.forEach((text, i) => {
        if (text.includes(EXCEPTION_MARKER) && !justified.has(i + 1)) {
          stale.push(`${effect.id}:${i + 1}`);
        }
      });
    }
    expect(
      stale,
      `stale "${EXCEPTION_MARKER}" markers (no layout transition nearby) must be removed with the transition they documented:\n  ${stale.join("\n  ")}`,
    ).toEqual([]);
  });

  it("rule 3 — dataviz batch uses no indigo/blue primary outside the documented allowlist", () => {
    const offenders: string[] = [];
    for (const effect of effects) {
      if (!effect.id.startsWith("dataviz-")) continue;
      const css = maskNonColorContexts(effect.cssCode ?? "");
      OKLCH_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = OKLCH_RE.exec(css)) !== null) {
        const chroma = parseFloat(m[2]!);
        const hue = parseFloat(m[3]!);
        if (chroma < BLUE_BAND.minChroma) continue;
        if (hue < BLUE_BAND.minHue || hue >= BLUE_BAND.maxHue) continue;
        const exact = m[0].trim();
        const allowed = DATVIZ_BLUE_ALLOWLIST[effect.id]?.some((a) => a.value === exact);
        if (!allowed) offenders.push(`${effect.id}: ${exact}`);
      }
    }
    expect(
      offenders,
      `dataviz must not use indigo/blue as primary (CONTRIBUTING authoring rules); remap to the accent token hue 200 preserving L/C, or add a reasoned allowlist entry:\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });

  it("rule 3 — allowlist entries are live: effect exists, color occurs verbatim, reason present", () => {
    const byId = new Map(effects.map((e) => [e.id, e] as const));
    const stale: string[] = [];
    for (const [id, entries] of Object.entries(DATVIZ_BLUE_ALLOWLIST)) {
      const effect = byId.get(id);
      if (!effect) {
        stale.push(`${id}: effect no longer exists`);
        continue;
      }
      const css = maskNonColorContexts(effect.cssCode ?? "");
      for (const entry of entries) {
        if (!entry.reason?.trim()) stale.push(`${id}: ${entry.value} — missing reason`);
        if (!css.includes(entry.value)) stale.push(`${id}: ${entry.value} — color no longer present`);
      }
    }
    expect(stale, `stale allowlist entries must be pruned:\n  ${stale.join("\n  ")}`).toEqual([]);
  });
});
