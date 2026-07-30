/**
 * Smoke test for src/lib/effect-taxonomy.ts exports.
 *
 * Verifies that every documented export is importable and callable with
 * realistic inputs. Run with: `bun run scripts/smoke-taxonomy.ts`
 *
 * This is not a unit test suite — it's a sanity check that the module's
 * public surface works end-to-end.
 */

import { effects } from "../src/lib/roycss-effects.ts";
import {
  CANONICAL_TAGS,
  CATEGORY_DEFINITIONS,
  QUALITY_DIMENSIONS,
  SUBMISSION_GUIDE,
  TAG_SYNONYMS,
  TAG_VOCABULARY,
  findDuplicates,
  findMiscategorized,
  jaccard,
  levenshtein,
  nameSimilarity,
  normalizeCss,
  normalizeTags,
  scoreEffect,
  tierForScore,
} from "../src/lib/effect-taxonomy.ts";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}

console.log("RoyCSS Effect Taxonomy — Smoke Test");
console.log("====================================");

console.log("\n1. TAG_VOCABULARY");
check("has 6 dimensions", Object.keys(TAG_VOCABULARY).length === 6);
check(
  "dimensions are visual/motion/purpose/surface/technique/a11y",
  ["visual", "motion", "purpose", "surface", "technique", "a11y"].every((d) =>
    TAG_VOCABULARY[d as keyof typeof TAG_VOCABULARY],
  ),
);
const totalTags = Object.values(TAG_VOCABULARY).reduce(
  (s, a) => s + a.length,
  0,
);
check(`has ~100+ canonical tags (got ${totalTags})`, totalTags >= 100);
check(
  "every tag is lowercase kebab-case",
  Object.values(TAG_VOCABULARY)
    .flat()
    .every((t) => t === t.toLowerCase() && !/\s/.test(t)),
);

console.log("\n2. CANONICAL_TAGS");
check("is a Set", CANONICAL_TAGS instanceof Set);
check(
  "size matches TAG_VOCABULARY flat",
  CANONICAL_TAGS.size === totalTags,
);

console.log("\n3. TAG_SYNONYMS");
check("has 100+ synonym entries", Object.keys(TAG_SYNONYMS).length >= 100);
check(
  "every synonym maps to a canonical tag",
  Object.values(TAG_SYNONYMS).every((v) => CANONICAL_TAGS.has(v)),
);

console.log("\n4. CATEGORY_DEFINITIONS");
check("has 20 categories", Object.keys(CATEGORY_DEFINITIONS).length === 20);
check(
  "every category has definition + boundary + examples",
  Object.values(CATEGORY_DEFINITIONS).every(
    (c) =>
      c.definition.length > 20 &&
      c.boundary.length > 10 &&
      c.examples.length > 0 &&
      c.keywords.length > 0,
  ),
);

console.log("\n5. QUALITY_DIMENSIONS");
check("has 5 dimensions", QUALITY_DIMENSIONS.length === 5);
check(
  "dimensions are correctness/completeness/performance/accessibility/uniqueness",
  QUALITY_DIMENSIONS.every((d) =>
    [
      "correctness",
      "completeness",
      "performance",
      "accessibility",
      "uniqueness",
    ].includes(d.id),
  ),
);
check(
  "every dimension has a score function",
  QUALITY_DIMENSIONS.every((d) => typeof d.score === "function"),
);

console.log("\n6. SUBMISSION_GUIDE");
check("has requiredFields", SUBMISSION_GUIDE.requiredFields.length > 0);
check("has namingConventions", Object.keys(SUBMISSION_GUIDE.namingConventions).length === 3);
check("has qualityBar", SUBMISSION_GUIDE.qualityBar.overall > 0);
check("has tagRules", SUBMISSION_GUIDE.tagRules.length > 0);
check("has steps", SUBMISSION_GUIDE.steps.length >= 5);

console.log("\n7. normalizeTags()");
const norm1 = normalizeTags(["Glow", "glowing", "spinner", "animate"], "test-effect");
check("lowercases input", norm1.normalized.includes("glow"));
check("maps synonyms (glowing → glow)", !norm1.normalized.includes("glowing"));
check("maps synonyms (animate → keyframes)", norm1.normalized.includes("keyframes"));
check(
  "strips id-mirror tags",
  normalizeTags(["test-effect", "glow"], "test-effect").normalized.length === 1,
);
check("returns changes array", norm1.changes.length > 0);

console.log("\n8. scoreEffect()");
const sample = effects[0];
const scores = scoreEffect(sample);
check("returns 5 dimension scores", scores.length === 5);
check(
  "every score is 0-10",
  scores.every((s) => s.score >= 0 && s.score <= 10),
);
check(
  "every score has reasoning",
  scores.every((s) => s.reasoning.length > 0),
);
check(
  "dimension ids match QUALITY_DIMENSIONS",
  scores.every((s) =>
    QUALITY_DIMENSIONS.some((d) => d.id === s.dimension),
  ),
);

console.log("\n9. findDuplicates()");
// Use a small subset for speed.
const subset = effects.slice(0, 200);
const t0 = Date.now();
const clusters = findDuplicates(subset);
const elapsed = Date.now() - t0;
check(`runs in < 5s on 200 effects (got ${elapsed}ms)`, elapsed < 5000);
check("returns DuplicateCluster[]", Array.isArray(clusters));
check(
  "every cluster has ≥ 2 members",
  clusters.every((c) => c.members.length >= 2),
);
check(
  "every cluster has a canonical member",
  clusters.every((c) => c.canonical.length > 0),
);
check(
  "every cluster has a recommendation",
  clusters.every((c) => ["merge", "review", "distinct"].includes(c.recommendation)),
);

console.log("\n10. findMiscategorized()");
const misc = findMiscategorized(subset);
check("returns array", Array.isArray(misc));
check(
  "every finding has required fields",
  misc.every(
    (m) =>
      m.effectId &&
      m.name &&
      m.declaredCategory &&
      m.suggestedCategory &&
      m.confidence > 0 &&
      m.reason,
  ),
);

console.log("\n11. Helper functions");
check(
  "levenshtein('kitten', 'sitting') = 3",
  levenshtein("kitten", "sitting") === 3,
);
check(
  "levenshtein('abc', 'abc') = 0",
  levenshtein("abc", "abc") === 0,
);
check(
  "nameSimilarity('abc', 'abc') = 1",
  nameSimilarity("abc", "abc") === 1,
);
check(
  "nameSimilarity('abc', 'xyz') = 0",
  nameSimilarity("abc", "xyz") === 0,
);
check(
  "jaccard of identical sets = 1",
  jaccard(new Set([1, 2, 3]), new Set([1, 2, 3])) === 1,
);
check(
  "jaccard of disjoint sets = 0",
  jaccard(new Set([1, 2]), new Set([3, 4])) === 0,
);
check(
  "normalizeCss strips comments",
  !normalizeCss("/* hi */ .x { }").includes("/*"),
);
check(
  "normalizeCss lowercases",
  !normalizeCss(".FOO { }").includes("FOO"),
);

console.log("\n12. tierForScore()");
check("tierForScore(10) = A", tierForScore(10) === "A");
check("tierForScore(8) = A", tierForScore(8) === "A");
check("tierForScore(7.9) = B", tierForScore(7.9) === "B");
check("tierForScore(6) = B", tierForScore(6) === "B");
check("tierForScore(5.9) = C", tierForScore(5.9) === "C");
check("tierForScore(4) = C", tierForScore(4) === "C");
check("tierForScore(3.9) = D", tierForScore(3.9) === "D");
check("tierForScore(0) = D", tierForScore(0) === "D");

console.log("");
console.log(`====================================`);
console.log(`Smoke test result: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  process.exit(1);
}
