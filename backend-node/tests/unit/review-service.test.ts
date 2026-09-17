/**
 * Unit tests — review service, mock-provider mode (PF-007 / issue #126,
 * chunk 1).
 *
 * OPENAI/ANTHROPIC keys are guaranteed unset before import (vi.hoisted)
 * so the unified LLM client stays on its deterministic mock provider and
 * reviewCode uses the regex/heuristic fallback:
 *   - deterministic findings selection (same input → same score/rules)
 *   - rule applicability by language (tsx sees the a11y rules; exotic
 *     languages fall back to the ts/js catalog)
 *   - score formula (errors × 18 + warnings × 8) and summary wording
 *   - history cap + _resetReviewForTest
 *   - getResultById 404 for unknown ids
 *
 * The LLM-configured paths live in review-llm.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

import {
  _resetReviewForTest,
  getResultById,
  listHistory,
  listRules,
  reviewCode,
  rulesCount,
} from "../../src/modules/review/service.js";
import { ReviewCodeSchema } from "../../src/modules/review/schema.js";

beforeEach(() => {
  _resetReviewForTest();
});

const CODE = "export function Card() { return <img src='x' /> }";

describe("listRules / listHistory — seeds + cache", () => {
  it("1. listRules returns the 8-rule catalog; repeat calls hit the cache", async () => {
    const first = await listRules();
    expect(first).toHaveLength(8);
    expect(rulesCount()).toBe(8);
    expect(await listRules()).toBe(first);
  });

  it("2. listHistory returns the 3 seeded results; repeat calls hit the cache", async () => {
    const first = await listHistory();
    expect(first.map((r) => r.id)).toEqual([
      "rev-seed-1",
      "rev-seed-2",
      "rev-seed-3",
    ]);
    expect(await listHistory()).toBe(first);
  });
});

describe("getResultById", () => {
  it("3. a seeded id returns the stored result", async () => {
    const result = await getResultById("rev-seed-2");
    expect(result).toMatchObject({
      filename: "src/lib/db.ts",
      score: 64,
      status: "complete",
    });
  });

  it("4. an unknown id is a 404", async () => {
    await expect(getResultById("rev-nope")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Review result 'rev-nope' not found",
    });
  });
});

describe("reviewCode — deterministic heuristic fallback", () => {
  it("5. identical input produces identical findings and score", async () => {
    const input = {
      filename: "src/components/UserCard.tsx",
      language: "tsx" as const,
      code: CODE,
    };
    const a = await reviewCode(input);
    const b = await reviewCode(input);

    expect(a.score).toBe(b.score);
    expect(a.findings).toEqual(b.findings);
    expect(a.summary).toBe(b.summary);
    expect(a.status).toBe("complete");
    expect(a.id).toMatch(/^rev-[0-9a-f-]{36}$/);
    expect(a.language).toBe("tsx");
  });

  it("6. findings come from the applicable rule catalog, capped at 4", async () => {
    const result = await reviewCode({
      filename: "a.tsx",
      language: "tsx",
      code: CODE,
    });

    const catalog = await listRules();
    const ruleIds = new Set(catalog.map((r) => r.id));
    expect(result.findings.length).toBeLessThanOrEqual(4);
    expect(result.findings.length).toBeGreaterThan(0);
    for (const f of result.findings) {
      expect(ruleIds.has(f.ruleId)).toBe(true);
      // Lines land in the deterministic 5..84 band.
      expect(f.line).toBeGreaterThanOrEqual(5);
      expect(f.line).toBeLessThanOrEqual(84);
    }
  });

  it("7. tsx reviews see the accessibility rules; exotic languages fall back to the ts/js catalog", async () => {
    // Force the a11y rules into the picked subset by trying a few inputs —
    // instead of relying on hash luck, assert the APPLICABILITY contract:
    // run many distinct inputs and union the rule ids observed.
    const seen = new Set<string>();
    for (let i = 0; i < 24; i++) {
      const r = await reviewCode({
        filename: `f${i}.tsx`,
        language: "tsx",
        code: `${CODE} ${i}`,
      });
      for (const f of r.findings) seen.add(f.ruleId);
    }
    expect(seen.has("rule-a11y-img-alt") || seen.has("rule-a11y-button-role"))
      .toBe(true);

    const rustSeen = new Set<string>();
    for (let i = 0; i < 24; i++) {
      const r = await reviewCode({
        filename: `m${i}.rs`,
        language: "rust",
        code: `fn main() { ${i} }`,
      });
      for (const f of r.findings) rustSeen.add(f.ruleId);
    }
    // rust has no native rules — the ts/js subset applies instead, and the
    // tsx-only a11y rules never appear.
    expect(rustSeen.has("rule-a11y-img-alt")).toBe(false);
    expect([...rustSeen].length).toBeGreaterThan(0);
  });

  it("8. the score matches the error/warning formula and the summary wording", async () => {
    const input = {
      filename: "score.ts",
      language: "typescript" as const,
      code: "const x = 1;",
    };
    const result = await reviewCode(input);

    const errors = result.findings.filter((f) => f.severity === "error").length;
    const warnings = result.findings.filter((f) => f.severity === "warning")
      .length;
    expect(result.score).toBe(
      Math.max(0, 100 - errors * 18 - warnings * 8),
    );
    expect(result.summary).toBe(
      `${result.findings.length} finding(s) (${errors} error, ${warnings} warning).`,
    );
  });

  it("9. suggestions are category-specific for a11y and performance findings", async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 24; i++) {
      const r = await reviewCode({
        filename: `s${i}.tsx`,
        language: "tsx",
        code: `${CODE} ${i}`,
      });
      for (const f of r.findings) {
        if (f.suggestion !== undefined) seen.add(f.suggestion);
      }
    }
    expect(seen.has("Add the missing accessibility attribute.")).toBe(true);
    expect(seen.has("Refactor to avoid the performance pitfall.")).toBe(true);
    expect(seen.has("Apply the recommended change.")).toBe(true);
  });

  it("10. reviews land at the head of history (capped at 100)", async () => {
    for (let i = 0; i < 102; i++) {
      await reviewCode({
        filename: `cap${i}.ts`,
        language: "typescript",
        code: `const v${i} = ${i};`,
      });
    }
    const history = await listHistory();
    expect(history).toHaveLength(100);
    expect(history[0]!.filename).toBe("cap101.ts");
  });
});

describe("_resetReviewForTest", () => {
  it("11. restores the seed history after mutations", async () => {
    await reviewCode({ filename: "x.ts", language: "typescript", code: "1" });
    _resetReviewForTest();
    expect(await listHistory()).toHaveLength(3);
  });
});

describe("ReviewCodeSchema — Zod rejection boundaries", () => {
  const valid = {
    filename: "a.ts",
    language: "typescript",
    code: "const x = 1;",
  };

  it("12. filename and code are required bounded strings", () => {
    expect(
      ReviewCodeSchema.safeParse({ ...valid, filename: "  " }).success,
    ).toBe(false);
    expect(ReviewCodeSchema.safeParse({ ...valid, code: "" }).success).toBe(
      false,
    );
  });

  it("13. language must be one of the ten supported languages", () => {
    expect(
      ReviewCodeSchema.safeParse({ ...valid, language: "kotlin" }).success,
    ).toBe(false);
    expect(
      ReviewCodeSchema.safeParse({ ...valid, language: "rust" }).success,
    ).toBe(true);
  });

  it("14. focus areas are bounded to the four known categories (max 4)", () => {
    expect(
      ReviewCodeSchema.safeParse({ ...valid, focus: ["bogus"] }).success,
    ).toBe(false);
    expect(
      ReviewCodeSchema.safeParse({
        ...valid,
        focus: ["performance", "accessibility", "security", "maintainability"],
      }).success,
    ).toBe(true);
  });
});
