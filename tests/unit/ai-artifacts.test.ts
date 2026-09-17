import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { effects } from "@/lib/roycss-effects";
import { categoryOrder } from "@/lib/roycss-types";

/**
 * AI-conformance artifact gates (issue #124 / PF-021 content half).
 *
 * scripts/generate-ai-artifacts.ts emits four artifacts into dist/ —
 * roycss.rules.md, roycss.system-prompt.md, roycss.grammar.json,
 * roycss.training-pairs.jsonl — all derived from the live effect catalog.
 * Nothing forces them to be regenerated when the catalog changes, so like
 * snapshot-freshness.test.ts this suite re-derives the ground truth from
 * src/lib/roycss-effects and pins the invariants:
 *
 *   1. all four artifacts exist and parse;
 *   2. ZERO phantom classes: every `roycss-*` token in every artifact must
 *      exist in the catalog (the docs-class-api.test.ts approach — the whole
 *      point of the artifacts is AI conformance, so a fabricated class in
 *      them would teach every consumer the exact failure mode #124 exists
 *      to prevent);
 *   3. every stated count equals the computed count;
 *   4. training-pairs: ≥ 200 lines, valid JSONL structure, anti-pairs for
 *      the documented failure modes;
 *   5. the grammar's class-name pattern round-trips against ALL real class
 *      names (and rejects the known fictions).
 *
 * Regenerate with: `bun run gen:ai` (drift also caught by `bun run ai:check`).
 */

/** Repo root — derived from this test file (tests/unit/) so cwd doesn't matter. */
const ROOT = fileURLToPath(new URL("../..", import.meta.url));

const RULES_PATH = join(ROOT, "dist", "roycss.rules.md");
const PROMPT_PATH = join(ROOT, "dist", "roycss.system-prompt.md");
const GRAMMAR_PATH = join(ROOT, "dist", "roycss.grammar.json");
const PAIRS_PATH = join(ROOT, "dist", "roycss.training-pairs.jsonl");

// ─── ground truth, re-derived from the live catalog ─────────────────────────

/** All `roycss-*` class selectors an effect's own CSS defines. */
function classesOf(cssCode: string): string[] {
  return Array.from((cssCode ?? "").matchAll(/\.((?:roycss-)[a-zA-Z0-9-]+)/g), (m) => m[1]!);
}

/** The class you put on the element: `roycss-<id>` when present, else the first declared class. */
function primaryClassOf(effect: (typeof effects)[number]): string {
  const classes = classesOf(effect.cssCode);
  return classes.includes(`roycss-${effect.id}`) ? `roycss-${effect.id}` : classes[0]!;
}

/** The only class outside the catalog's cssCode: emitted by scripts/build-package.ts BASE_CSS. */
const BASE_UTILITY_CLASSES = new Set(["roycss-sr-only"]);

const validClasses = new Set<string>(BASE_UTILITY_CLASSES);
const primaryClasses = new Set<string>();
for (const e of effects) {
  primaryClasses.add(primaryClassOf(e));
  for (const c of classesOf(e.cssCode)) validClasses.add(c);
}
const auxiliaryClasses = [...validClasses].filter(
  (c) => !primaryClasses.has(c) && !BASE_UTILITY_CLASSES.has(c),
);

const categoryCounts = new Map<string, number>();
for (const e of effects) categoryCounts.set(e.category, (categoryCounts.get(e.category) ?? 0) + 1);

/** 1959 → "1,959" (deterministic). */
function fmt(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Extract every `roycss-*` class token from artifact text. Mirrors the
 * docs-class-api.test.ts canonical approach: case-mismatch teaching tokens
 * (`roycss-…` immediately followed by an uppercase letter) are stripped —
 * real classes are lowercase kebab, so those are negative examples.
 */
function extractClassTokens(text: string): string[] {
  const stripped = text.replace(/roycss-[a-z0-9-]+(?=[A-Z])/g, "");
  return Array.from(stripped.matchAll(/\broycss-[a-z0-9-]+/g), (m) => m[0]!);
}

// ─── load the artifacts ─────────────────────────────────────────────────────

const rulesMd = readFileSync(RULES_PATH, "utf8");
const promptMd = readFileSync(PROMPT_PATH, "utf8");
const grammarJsonText = readFileSync(GRAMMAR_PATH, "utf8");
const pairsText = readFileSync(PAIRS_PATH, "utf8");

interface TrainingPairRecord {
  id: string;
  kind: string;
  template: string;
  effectId?: string;
  failureMode?: string;
  negativeExample?: string;
  instruction: string;
  output: string;
  validClasses: string[];
}

interface GrammarDoc {
  name: string;
  version: string;
  generator: string;
  classNamePattern: {
    pattern: string;
    flags: string;
    examples: string[];
    counterExamples: string[];
  };
  categories: Array<{ id: string; count: number }>;
  modifiers: { exists: boolean; count: number };
  baseUtilityClasses: string[];
  auxiliaryClasses: string[];
  idToClassRule: { rule: string; exceptions: Array<{ effectId: string; className: string }> };
  counts: Record<string, number>;
}

const grammar = JSON.parse(grammarJsonText) as GrammarDoc;
const pairLines = pairsText.split("\n").filter((l) => l.trim().length > 0);
const pairRecords = pairLines.map((l) => JSON.parse(l) as TrainingPairRecord);

/** Declared fiction tokens: one per anti-pair record, plus the grammar's own counter-examples. */
const negativeExamples = new Set(
  pairRecords.flatMap((p) => (p.negativeExample ? [p.negativeExample] : [])),
);
const grammarCounterExamples = new Set(
  grammar.classNamePattern.counterExamples.filter((c) => c.startsWith("roycss-")),
);

/** {artifact → text} with each one's declared exemptions. */
const phantomTargets: Array<{ label: string; text: string; exemptions: ReadonlySet<string> }> = [
  { label: "dist/roycss.rules.md", text: rulesMd, exemptions: new Set<string>() },
  { label: "dist/roycss.system-prompt.md", text: promptMd, exemptions: new Set<string>() },
  { label: "dist/roycss.grammar.json", text: grammarJsonText, exemptions: grammarCounterExamples },
  { label: "dist/roycss.training-pairs.jsonl", text: pairsText, exemptions: negativeExamples },
];

// ─── tests ──────────────────────────────────────────────────────────────────

describe("ai-conformance artifacts (issue #124)", () => {
  it("ships all four generated artifacts", () => {
    for (const p of [RULES_PATH, PROMPT_PATH, GRAMMAR_PATH, PAIRS_PATH]) {
      expect(existsSync(p), `${p} is missing — run \`bun run gen:ai\``).toBe(true);
    }
    expect(rulesMd.startsWith("# RoyCSS")).toBe(true);
    expect(promptMd.startsWith("# RoyCSS")).toBe(true);
    expect(rulesMd).toContain("generated from the live RoyCSS effect catalog");
    expect(promptMd).toMatch(/generated from the live RoyCSS catalog/i);
    expect(grammar.generator).toBe("scripts/generate-ai-artifacts.ts");
    expect(grammar.name).toBe("roycss");
  });

  it("has ZERO phantom classes — every roycss-* token in every artifact exists in the catalog", () => {
    // The critical conformance gate: these artifacts are what AI consumers
    // learn from, so a single fabricated class would propagate the exact
    // failure mode (r-* fiction era, audit F-01/F-02) the artifacts prevent.
    const offenders: string[] = [];
    for (const { label, text, exemptions } of phantomTargets) {
      for (const token of extractClassTokens(text)) {
        if (validClasses.has(token) || exemptions.has(token)) continue;
        offenders.push(`${label}: .${token}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("declares every fiction token it shows (anti-pairs and grammar counter-examples)", () => {
    // Every exemption used above must be an explicitly declared fiction,
    // never a silent allowance: negativeExample on anti records only.
    for (const p of pairRecords) {
      if (p.negativeExample && p.negativeExample.startsWith("roycss-")) {
        expect(
          p.kind,
          `pair ${p.id} declares a roycss-* negativeExample but is not an anti pair`,
        ).toBe("anti");
      }
    }
    for (const counter of grammar.classNamePattern.counterExamples) {
      if (counter.startsWith("roycss-")) {
        expect(validClasses.has(counter), `grammar counter-example ${counter} is unexpectedly REAL`).toBe(false);
      }
    }
  });

  it("states only truthful counts (comma-grouped numbers match computed truths)", () => {
    const allowed = new Set([fmt(effects.length), fmt(validClasses.size), fmt(primaryClasses.size)]);
    for (const { label, text } of phantomTargets) {
      const stated = Array.from(text.matchAll(/\b\d{1,3}(?:,\d{3})+\b/g), (m) => m[0]!);
      const bad = [...new Set(stated.filter((n) => !allowed.has(n)))];
      expect(bad, `${label} states stale counts (${bad.join(", ")}) — run \`bun run gen:ai\``).toEqual([]);
    }
    // The headline claims, pinned exactly:
    expect(rulesMd).toContain(`${fmt(effects.length)} production-ready effect classes`);
    expect(rulesMd).toContain(`across ${categoryOrder.length} categories`);
    expect(grammar.counts.totalEffects).toBe(effects.length);
    expect(grammar.counts.totalCategories).toBe(categoryOrder.length);
    expect(grammar.counts.totalClasses).toBe(validClasses.size);
    expect(grammar.counts.primaryClasses).toBe(primaryClasses.size);
    expect(grammar.counts.auxiliaryClasses).toBe(auxiliaryClasses.length);
    expect(grammar.counts.trainingPairs).toBe(pairRecords.length);
  });

  it("enumerates the real categories with real per-category counts", () => {
    expect(grammar.categories.map((c) => c.id)).toEqual(categoryOrder);
    for (const cat of grammar.categories) {
      expect(cat.count, `category ${cat.id} count drifted`).toBe(categoryCounts.get(cat.id));
    }
  });

  it("documents the class grammar truthfully (modifiers, base utility, id→class outliers)", () => {
    expect(grammar.modifiers.exists).toBe(false);
    expect(grammar.modifiers.count).toBe([...validClasses].filter((c) => c.includes("--")).length);
    expect(grammar.baseUtilityClasses).toEqual([...BASE_UTILITY_CLASSES]);
    expect([...grammar.auxiliaryClasses].sort()).toEqual(auxiliaryClasses.sort());
    // The documented outliers must be exactly the real ones.
    const realOutliers = effects
      .map((e) => ({ effectId: e.id, className: primaryClassOf(e) }))
      .filter((o) => o.className !== `roycss-${o.effectId}`);
    expect(grammar.idToClassRule.exceptions).toEqual(realOutliers);
    // …and each outlier's class is real.
    for (const o of grammar.idToClassRule.exceptions) {
      expect(validClasses.has(o.className), `outlier class ${o.className} is not real`).toBe(true);
    }
  });
});

describe("ai-conformance training pairs", () => {
  it("ships at least 200 pairs as valid JSONL with the required structure", () => {
    expect(pairRecords.length).toBeGreaterThanOrEqual(200);
    const problems: string[] = [];
    const seenIds = new Set<string>();
    pairRecords.forEach((p, i) => {
      const where = `${i + 1} (${p.id ?? "?"})`;
      if (typeof p.id !== "string" || p.id.length === 0) problems.push(`${where}: missing id`);
      if (seenIds.has(p.id)) problems.push(`${where}: duplicate id`);
      seenIds.add(p.id);
      if (p.kind !== "positive" && p.kind !== "anti") problems.push(`${where}: bad kind ${p.kind}`);
      if (typeof p.instruction !== "string" || p.instruction.trim().length === 0) {
        problems.push(`${where}: empty instruction`);
      }
      if (typeof p.output !== "string" || p.output.trim().length === 0) {
        problems.push(`${where}: empty output`);
      }
      if (!Array.isArray(p.validClasses)) problems.push(`${where}: validClasses not an array`);
      for (const c of p.validClasses ?? []) {
        if (!validClasses.has(c)) problems.push(`${where}: phantom validClass ${c}`);
      }
      if (p.kind === "anti" && (typeof p.negativeExample !== "string" || !p.negativeExample)) {
        problems.push(`${where}: anti pair without a declared negativeExample`);
      }
      if (p.kind === "anti" && !p.failureMode) {
        problems.push(`${where}: anti pair without a failureMode`);
      }
    });
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("teaches real classes: every validClasses entry exists and outputs contain real class markup", () => {
    const anchored = pairRecords.filter((p) => p.validClasses.length > 0);
    expect(anchored.length).toBeGreaterThan(100);
    // Spot-check the shape AI consumers will mimic: class="roycss-…" in a code block.
    const withMarkup = pairRecords.filter((p) => p.output.includes('class="roycss-'));
    expect(withMarkup.length).toBeGreaterThan(100);
  });

  it("includes anti-pairs for every documented failure mode", () => {
    const modes = new Set(pairRecords.filter((p) => p.kind === "anti").map((p) => p.failureMode));
    expect(modes.has("r-prefix-fiction"), "missing r-* anti-pairs").toBe(true);
    expect(modes.has("wrong-import-path"), "missing phantom-import anti-pairs").toBe(true);
    expect(modes.has("phantom-cdn-host"), "missing phantom-CDN anti-pairs").toBe(true);
    expect(modes.has("wrong-case"), "missing wrong-case anti-pairs").toBe(true);
    expect(modes.has("modifier-suffix-fiction"), "missing modifier-suffix anti-pairs").toBe(true);
    expect(modes.has("typo-id"), "missing typo anti-pairs").toBe(true);
    // The two headline failure modes get real coverage, not a token pair:
    const rPrefixCount = pairRecords.filter((p) => p.failureMode === "r-prefix-fiction").length;
    const wrongImportCount = pairRecords.filter((p) => p.failureMode === "wrong-import-path").length;
    expect(rPrefixCount).toBeGreaterThanOrEqual(10);
    expect(wrongImportCount).toBeGreaterThanOrEqual(5);
  });

  it("never states a phantom import path or CDN host outside declared negative context", () => {
    // docs-class-api.test.ts rule 3, adapted: the ONLY permitted mentions of
    // the phantom surfaces are (a) negation prose in the markdown rules
    // ("There is no roycss/effects.css export…"), (b) the grammar's declared
    // `forbidden` lists, and (c) jsonl anti-pair records that declare the
    // fiction in negativeExample. Any other mention teaches a phantom.
    const NEGATION = /\b(no|never|not|phantom|fiction|nonexistent|doesn'?t|isn'?t|don'?t)\b/i;

    // (a) markdown: every line naming a phantom must sit in negation context
    // (the negation word may be on the wrapping line above — same window
    // approach as docs-class-api.test.ts's negative-example allowlist).
    for (const [label, text] of [
      ["dist/roycss.rules.md", rulesMd],
      ["dist/roycss.system-prompt.md", promptMd],
    ] as const) {
      const lines = text.split("\n");
      for (const [lineno, line] of lines.entries()) {
        if (/cdn\.roycss\.org/.test(line) || /roycss\/effects\.css/.test(line)) {
          const window = lines.slice(Math.max(0, lineno - 1), lineno + 1).join("\n");
          expect(
            NEGATION.test(window),
            `${label}:${lineno + 1} mentions a phantom surface without negation context: ${line.trim().slice(0, 90)}`,
          ).toBe(true);
        }
      }
    }

    // (b) grammar: phantoms appear exactly once each, inside the forbidden lists.
    expect(grammarJsonText.match(/cdn\.roycss\.org/g)?.length ?? 0).toBe(1);
    expect(grammarJsonText.match(/roycss\/effects\.css/g)?.length ?? 0).toBe(1);

    // (c) jsonl: a record may show the fiction only if it declares it.
    for (const p of pairRecords) {
      const text = `${p.instruction}\n${p.output}`;
      if (/cdn\.roycss\.org/.test(text)) expect(p.negativeExample).toBe("cdn.roycss.org");
      if (/roycss\/effects\.css/.test(text)) expect(p.negativeExample).toBe("roycss/effects.css");
    }
  });
});

describe("ai-conformance grammar round-trip", () => {
  it("validates the class-name pattern against ALL real class names", () => {
    const re = new RegExp(grammar.classNamePattern.pattern, grammar.classNamePattern.flags);
    const failures: string[] = [];
    for (const c of validClasses) {
      if (!re.test(c)) failures.push(c);
    }
    expect(failures, `${failures.length} real classes fail the pattern (first: ${failures[0]})`).toEqual([]);
    expect(validClasses.size).toBeGreaterThan(1900); // sanity: we really checked the whole catalog
  });

  it("rejects the known fictions (r-* prefix, case variants, modifier suffixes)", () => {
    const re = new RegExp(grammar.classNamePattern.pattern, grammar.classNamePattern.flags);
    expect(re.test("r-btn-glow")).toBe(false);
    expect(re.test("roycss-Btn-Glow")).toBe(false);
    expect(re.test("roycss-btn-glow--lg")).toBe(false);
    expect(re.test("btn-glow")).toBe(false);
    expect(re.test("")).toBe(false);
  });

  it("uses only real classes as pattern examples", () => {
    for (const example of grammar.classNamePattern.examples) {
      expect(validClasses.has(example), `grammar example ${example} is not a real class`).toBe(true);
    }
  });
});
