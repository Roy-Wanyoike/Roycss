import { describe, it, expect } from "vitest";
import {
  normalizeTags,
  scoreEffect,
  findDuplicates,
  levenshtein,
  nameSimilarity,
  normalizeCss,
  jaccard,
  findMiscategorized,
  tierForScore,
  TAG_SYNONYMS,
  type DuplicateCluster,
  type MiscategorizationFinding,
} from "@/lib/effect-taxonomy";
import type { CSSEffect } from "@/lib/roycss-types";

/**
 * effect-taxonomy behavioral pins (issue #277).
 *
 * src/lib/effect-taxonomy.ts is the largest logic module in the frontend
 * (1,613 lines) and previously had ZERO test pins (only an unwired manual
 * smoke script). These pins cover the EXPORTED API only — the scoring
 * internals (scoreCorrectness/scoreCompleteness/…) are exercised through
 * the public scoreEffect()/findDuplicates()/findMiscategorized() surfaces.
 *
 * Fixtures are synthetic so the pins stay stable as the catalog grows;
 * the corpus-level scans belong to the curation agent's tooling.
 */

/** Minimal CSSEffect factory — only the fields the taxonomy reads. */
function makeEffect(overrides: Partial<CSSEffect> = {}): CSSEffect {
  return {
    // NOTE: the id deliberately avoids embedding the tags verbatim —
    // id-mirror tags (pass 3 / completeness) would otherwise dock points.
    id: "fixture-glow",
    name: "Test Glow Border",
    category: "hover",
    description: "A glowing border fixture used by the taxonomy pins.",
    tags: ["glow", "border", "hover"],
    previewType: "box",
    cssCode: `/* fixture */
.roycss-fixture-glow {
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .roycss-fixture-glow {
    transition: none;
  }
}
`,
    ...overrides,
  };
}

describe("normalizeTags", () => {
  it("returns empty normalization for an empty tag list", () => {
    expect(normalizeTags([])).toEqual({ normalized: [], changes: [] });
  });

  it("slugs case/whitespace variants into kebab-case", () => {
    const result = normalizeTags(["  Glow   Border "]);
    expect(result.normalized).toEqual(["glow-border"]);
    // The change log records only SEMANTIC rewrites (synonyms, id-mirror
    // removals) — a pure whitespace/case slug is not a "change".
    expect(result.changes).toEqual([]);
  });

  it("applies the synonym map (glowing → glow, spinner → spin)", () => {
    expect(TAG_SYNONYMS["glowing"]).toBe("glow");
    expect(TAG_SYNONYMS["spinner"]).toBe("spin");
    const result = normalizeTags(["Glowing", "SPINNER"]);
    expect(result.normalized).toEqual(["glow", "spin"]);
    expect(result.changes).toEqual([
      { from: "Glowing", to: "glow" },
      { from: "SPINNER", to: "spin" },
    ]);
  });

  it("strips tags that mirror the effect id (pass 3) and records them as removals", () => {
    const result = normalizeTags(
      ["hover-glow-border", "hover-glow-border-extra", "glow"],
      "hover-glow-border",
    );
    // The exact-id tag AND the tag containing the id are both stripped…
    expect(result.normalized).toEqual(["glow"]);
    // …and recorded with `to: null` (a removal, not a rewrite).
    expect(result.changes).toEqual([
      { from: "hover-glow-border", to: null },
      { from: "hover-glow-border-extra", to: null },
    ]);
  });

  it("dedupes case-insensitive duplicates to a single normalized tag", () => {
    const result = normalizeTags(["glow", "Glow", "GLOW"]);
    expect(result.normalized).toEqual(["glow"]);
    // The first entry is unchanged; the variants are dropped by the seen-set
    // (not recorded as changes — they never produce a distinct output tag).
    expect(result.changes).toEqual([]);
  });

  it("keeps non-vocabulary tags in the output (counted, not dropped)", () => {
    const result = normalizeTags(["totally-unknown-tag"]);
    expect(result.normalized).toEqual(["totally-unknown-tag"]);
    expect(result.changes).toEqual([]);
  });
});

describe("scoreEffect", () => {
  it("scores exactly the five documented quality dimensions in order", () => {
    const scores = scoreEffect(makeEffect());
    expect(scores.map((s) => s.dimension)).toEqual([
      "correctness",
      "completeness",
      "performance",
      "accessibility",
      "uniqueness",
    ]);
  });

  it("gives a healthy fixture a perfect correctness/completeness/performance score", () => {
    const byDim = Object.fromEntries(
      scoreEffect(makeEffect()).map((s) => [s.dimension, s.score]),
    );
    // Balanced braces, .roycss-<id> class present, no unprefixed keyframes,
    // name/description/tags complete, css < 2KB, reduced-motion guard present.
    expect(byDim.correctness).toBe(10);
    expect(byDim.completeness).toBe(10);
    expect(byDim.performance).toBe(10);
    expect(byDim.accessibility).toBe(10);
  });

  it("defaults the standalone uniqueness dimension to 7 (computed globally by findDuplicates)", () => {
    const uniqueness = scoreEffect(makeEffect()).find(
      (s) => s.dimension === "uniqueness",
    );
    expect(uniqueness?.score).toBe(7);
  });

  it("penalizes stub CSS by 7 (correctness boundary: < 30 chars)", () => {
    // 23 chars, correct class, balanced braces → exactly the stub penalty.
    const stub = makeEffect({ cssCode: ".roycss-fixture-glow{}" });
    const correctness = scoreEffect(stub).find((s) => s.dimension === "correctness");
    expect(correctness?.score).toBe(3); // 10 - 7
    expect(correctness?.reasoning).toContain("suspiciously short");
  });

  it("penalizes unbalanced braces by 4", () => {
    const broken = makeEffect({
      cssCode: `.roycss-fixture-glow {
  color: red;
`,
    });
    const correctness = scoreEffect(broken).find((s) => s.dimension === "correctness");
    expect(correctness?.score).toBe(6); // 10 - 4
  });

  it("penalizes a missing .roycss-<id> class but tolerates other roycss- classes", () => {
    const wrongClass = makeEffect({
      cssCode: `.roycss-some-other-effect {
  color: red;
}
`,
    });
    const correctness = scoreEffect(wrongClass).find((s) => s.dimension === "correctness");
    expect(correctness?.score).toBe(8); // 10 - 2 (a .roycss- class exists, just not the expected one)
  });

  it("penalizes thin metadata: short name, short description, sparse tags", () => {
    const thin = makeEffect({
      name: "Shake", // single-word name: -1
      description: "A short one.", // < 20 chars: -5
      tags: ["motion", "shake"], // exactly 2 tags: -1
    });
    const completeness = scoreEffect(thin).find((s) => s.dimension === "completeness");
    expect(completeness?.score).toBe(3);
    expect(completeness?.reasoning).toContain("single-word name");
    expect(completeness?.reasoning).toContain("description < 20 chars");
    expect(completeness?.reasoning).toContain("only 2 tags");
  });

  it("clamps every dimension score into [0, 10] for a maximally broken effect", () => {
    const broken = makeEffect({
      id: "no-class-here",
      name: "Ab", // < 3 chars: -3
      description: "x", // < 20 chars: -5
      tags: ["lonely"], // < 2 tags: -3
      // 23 chars (< 30: -7) with the correct .roycss- class so the only
      // correctness issue is the stub-length one.
      cssCode: ".roycss-no-class-here{}",
    });
    const scores = scoreEffect(broken);
    expect(scores.map((s) => s.score)).toEqual([3, 0, 10, 10, 7]);
    for (const s of scores) {
      expect(Number.isInteger(s.score)).toBe(true);
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(10);
    }
  });

  it("penalizes animation without a reduced-motion guard by 3 (accessibility)", () => {
    const unguarded = makeEffect({
      cssCode: `.roycss-test-glow-border {
  animation: roy-test 2s ease-in-out infinite;
}

@keyframes roy-test {
  to { transform: scale(1.1); }
}
`,
    });
    const a11y = scoreEffect(unguarded).find((s) => s.dimension === "accessibility");
    expect(a11y?.score).toBe(7); // 10 - 3
    expect(a11y?.reasoning).toContain("no prefers-reduced-motion guard");
  });
});

describe("findDuplicates", () => {
  it("returns no clusters for an empty catalog", () => {
    expect(findDuplicates([])).toEqual([]);
  });

  it("returns no clusters for clearly distinct effects", () => {
    const clusters = findDuplicates([
      makeEffect({ id: "alpha-spin", name: "Alpha Spin", tags: ["spin"] }),
      makeEffect({
        id: "beta-marquee",
        name: "Beta Marquee Scroll",
        category: "text",
        tags: ["marquee"],
        cssCode: `.roycss-beta-marquee {
  transform: translateX(100%);
}`,
      }),
    ]);
    expect(clusters).toEqual([]);
  });

  it("clusters identical-name clones and recommends a merge", () => {
    const clone = (id: string) =>
      makeEffect({ id, name: "Pulse Glow", cssCode: ".roycss-pulse-glow { color: red; }" });
    const clusters: DuplicateCluster[] = findDuplicates([clone("pulse-glow"), clone("ferrum-pulse-glow")]);
    expect(clusters).toHaveLength(1);
    const [cluster] = clusters;
    expect(cluster.members).toHaveLength(2);
    // name similarity 1.00 ≥ 0.85 → flagged by the name rule…
    expect(cluster.members[0].reason).toMatch(/name similarity 1\.00 ≥ 0\.85/);
    // …max similarity ≥ 0.95 → "merge"…
    expect(cluster.recommendation).toBe("merge");
    // …and the canonical prefers the non-ferrum original.
    expect(cluster.canonical).toBe("pulse-glow");
  });

  it("keeps distinct entries with duplicate ids unclustered when names/CSS differ (duplicate-id input safety)", () => {
    // Same id twice but different names AND different CSS: no name/CSS rule
    // fires, so findDuplicates must neither crash nor fabricate a cluster.
    const clusters = findDuplicates([
      makeEffect({ id: "twin", name: "First Twin" }),
      makeEffect({
        id: "twin",
        name: "Second Skin",
        cssCode: `.roycss-twin-second {
  filter: hue-rotate(90deg);
}`,
      }),
    ]);
    expect(clusters).toEqual([]);
  });

  it("sorts clusters by size descending, largest first", () => {
    const clone = (id: string, name: string) =>
      makeEffect({ id, name, cssCode: `.roycss-${id} { color: red; }` });
    const clusters = findDuplicates([
      // A pair.
      clone("pair-a", "Neon Pulse"),
      clone("pair-b", "Neon Pulse"),
      // …and a separate trio.
      clone("trio-a", "Wave Ring"),
      clone("trio-b", "Wave Ring"),
      clone("trio-c", "Wave Ring"),
    ]);
    expect(clusters).toHaveLength(2);
    expect(clusters[0].members.length).toBe(3);
    expect(clusters[0].canonical).toBe("trio-a");
    expect(clusters[1].members.length).toBe(2);
    expect(clusters[1].canonical).toBe("pair-a");
  });
});

describe("levenshtein", () => {
  it("handles the classic pair", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });

  it("is 0 for identical strings", () => {
    expect(levenshtein("same", "same")).toBe(0);
  });

  it("degenerates to the other length for empty inputs (boundary)", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
    expect(levenshtein("", "")).toBe(0);
  });

  it("is symmetric", () => {
    expect(levenshtein("glow", "border")).toBe(levenshtein("border", "glow"));
  });
});

describe("nameSimilarity", () => {
  it("is 1 for identical names", () => {
    expect(nameSimilarity("glow border", "glow border")).toBe(1);
  });

  it("is 1 for two empty strings (vacuously identical)", () => {
    expect(nameSimilarity("", "")).toBe(1);
  });

  it("scales linearly with edit distance over the longer length", () => {
    // lev("abc","abd") = 1, maxLen = 3 → 1 - 1/3
    expect(nameSimilarity("abc", "abd")).toBeCloseTo(2 / 3, 10);
    // lev("abcd","abce") = 1, maxLen = 4 → 1 - 1/4
    expect(nameSimilarity("abcd", "abce")).toBeCloseTo(3 / 4, 10);
  });

  it("drops to 0 for fully disjoint strings (lev = maxLen boundary)", () => {
    // lev("glow","border") = 6 = maxLen → similarity 0.
    expect(nameSimilarity("glow", "border")).toBe(0);
  });

  it("is case-sensitive (documented behavior: callers lowercase first)", () => {
    // "Glow" vs "glow" costs one substitution → 1 - 1/4, NOT 1.
    expect(nameSimilarity("Glow", "glow")).toBeCloseTo(3 / 4, 10);
  });
});

describe("normalizeCss", () => {
  it("strips comments, collapses whitespace and lowercases", () => {
    expect(normalizeCss("/* Header */\n  .A {   COLOR: red; }")).toBe(".a { color: red; }");
  });

  it("returns an empty string for comment-only CSS (token-set boundary)", () => {
    expect(normalizeCss("/* nothing here */")).toBe("");
  });
});

describe("jaccard", () => {
  it("treats two empty sets as identical (boundary)", () => {
    expect(jaccard(new Set(), new Set())).toBe(1);
  });

  it("is 0 when exactly one side is empty", () => {
    expect(jaccard(new Set(["a"]), new Set())).toBe(0);
    expect(jaccard(new Set(), new Set(["a"]))).toBe(0);
  });

  it("is 1 for identical sets", () => {
    expect(jaccard(new Set(["a", "b"]), new Set(["a", "b"]))).toBe(1);
  });

  it("computes |A∩B| / |A∪B|", () => {
    expect(jaccard(new Set([1, 2]), new Set([2, 3]))).toBeCloseTo(1 / 3, 10);
  });
});

describe("findMiscategorized", () => {
  it("returns no findings for an empty catalog", () => {
    expect(findMiscategorized([])).toEqual([]);
  });

  it("does not flag a correctly-categorized effect whose id prefix matches its category", () => {
    const findings: MiscategorizationFinding[] = findMiscategorized([
      makeEffect({
        id: "loader-spinner-dots",
        name: "Spinner Dots",
        category: "loaders",
        tags: ["loading", "dots"],
      }),
    ]);
    // id-prefix trust bonus (+5) keeps the declared category dominant.
    expect(findings).toEqual([]);
  });

  it("flags a blatantly miscategorized effect with its suggested category", () => {
    const findings = findMiscategorized([
      makeEffect({
        id: "demo-spinner-dots",
        name: "Loading Spinner Dots",
        category: "buttons", // wrong: loader keywords dominate
        tags: ["loading", "spinner", "dots"],
      }),
    ]);
    expect(findings).toHaveLength(1);
    const [finding] = findings;
    expect(finding.effectId).toBe("demo-spinner-dots");
    expect(finding.declaredCategory).toBe("buttons");
    expect(finding.suggestedCategory).toBe("loaders");
    expect(finding.confidence).toBeGreaterThan(1);
    expect(finding.reason).toContain("keywords suggest 'loaders'");
  });

  it("applies the id-prefix trust bonus to suppress sibling-keyword false positives", () => {
    // "btn-loading-press" is a BUTTON effect that merely mentions loading:
    // the btn- prefix bonus must keep it unflagged despite the loader keyword.
    const findings = findMiscategorized([
      makeEffect({
        id: "btn-loading-press",
        name: "Loading Press Feedback",
        category: "buttons",
        tags: ["loading", "press"],
      }),
    ]);
    expect(findings).toEqual([]);
  });
});

describe("tierForScore", () => {
  it("maps the documented score boundaries to tiers", () => {
    expect(tierForScore(10)).toBe("A");
    expect(tierForScore(8)).toBe("A"); // A-floor (inclusive)
    expect(tierForScore(7.99)).toBe("B");
    expect(tierForScore(6)).toBe("B"); // B-floor (inclusive)
    expect(tierForScore(5.99)).toBe("C");
    expect(tierForScore(4)).toBe("C"); // C-floor (inclusive)
    expect(tierForScore(3.99)).toBe("D");
    expect(tierForScore(0)).toBe("D");
  });
});
