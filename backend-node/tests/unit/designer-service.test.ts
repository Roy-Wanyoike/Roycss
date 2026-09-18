/**
 * Unit tests — designer service, mock-provider mode (PF-007 / issue #126,
 * chunk 1).
 *
 * OPENAI/ANTHROPIC keys are guaranteed unset before import (vi.hoisted)
 * so generateDesign uses the deterministic mock design:
 *   - unknown presetId → 404 before any generation
 *   - default preset (preset-apple) and short palette overrides falling
 *     back to per-slot defaults
 *   - component synthesis (capitalized name, prompt truncation at 60)
 *   - result history: head insert + cap + _resetDesignerForTest
 *   - getResultById 404 for unknown ids
 *
 * The LLM-configured merge paths live in designer-llm.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

import {
  _resetDesignerForTest,
  generateDesign,
  getResultById,
  listPresets,
  presetsCount,
} from "../../src/modules/designer/service.js";
import { GenerateDesignSchema } from "../../src/modules/designer/schema.js";

beforeEach(() => {
  _resetDesignerForTest();
});

describe("listPresets / getResultById — seeds + cache + 404", () => {
  it("1. listPresets returns the 4 seeded design presets", async () => {
    const presets = await listPresets();
    expect(presets.map((p) => p.id)).toEqual([
      "preset-apple",
      "preset-material",
      "preset-brutalist",
      "preset-glass",
    ]);
    expect(presetsCount()).toBe(4);
    expect(await listPresets()).toBe(presets);
  });

  it("2. a seeded result id resolves; an unknown id is a 404", async () => {
    const result = await getResultById("design-seed-1");
    expect(result.presetId).toBe("preset-apple");
    expect(result.components).toHaveLength(2);

    await expect(getResultById("design-nope")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Designer result 'design-nope' not found",
    });
  });
});

describe("generateDesign — validation + mock design", () => {
  it("3. an unknown presetId is a 404 before any generation", async () => {
    await expect(
      generateDesign({
        prompt: "Design a marketing site hero section",
        presetId: "preset-nope",
        components: ["hero"],
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Preset 'preset-nope' not found",
    });
  });

  it("4. defaults to preset-apple and derives the 7 canonical tokens", async () => {
    const result = await generateDesign({
      prompt: "Design a calm healthcare portal",
      components: ["hero"],
    });

    expect(result.presetId).toBe("preset-apple");
    expect(result.status).toBe("complete");
    expect(result.tokens).toEqual({
      "--color-primary": "#007aff",
      "--color-secondary": "#5856d6",
      "--color-bg": "#f2f2f7",
      "--color-fg": "#1c1c1e",
      "--radius-base": "1.25rem",
      "--space-base": "0.75rem",
      "--font-base": "SF Pro Display",
    });
    expect(result.components[0]).toMatchObject({
      name: "Hero",
      type: "hero",
    });
    expect(result.components[0]!.html).toContain("roycss-hero");
    expect(result.components[0]!.css).toContain(".roycss-hero {");
  });

  it("5. a palette override replaces the preset palette; missing slots use hard-coded defaults", async () => {
    // Only slot 0 provided → slots 1/3/4 do NOT fall back to the chosen
    // preset's palette but to the built-in defaults (documented behavior
    // of buildMockDesign — see PR notes).
    const partial = await generateDesign({
      prompt: "Design a brutalist portfolio page",
      presetId: "preset-brutalist",
      palette: ["#111111"],
      components: ["card"],
    });
    expect(partial.tokens["--color-primary"]).toBe("#111111");
    expect(partial.tokens["--color-secondary"]).toBe("#5856d6");
    expect(partial.tokens["--color-bg"]).toBe("#f2f2f7");
    expect(partial.tokens["--color-fg"]).toBe("#1c1c1e");

    // A full 5-slot override populates every token (slot 2 is unused).
    const full = await generateDesign({
      prompt: "Design a monochrome newspaper layout",
      presetId: "preset-material",
      palette: ["#111111", "#222222", "#333333", "#444444", "#555555"],
      components: ["card"],
    });
    expect(full.tokens["--color-primary"]).toBe("#111111");
    expect(full.tokens["--color-secondary"]).toBe("#222222");
    expect(full.tokens["--color-bg"]).toBe("#444444");
    expect(full.tokens["--color-fg"]).toBe("#555555");
  });

  it("6. the prompt is truncated to 60 chars inside component html", async () => {
    const longPrompt =
      "Design a page with an extremely long brief that goes on and on and on and must be truncated";
    const result = await generateDesign({
      prompt: longPrompt,
      components: ["hero"],
    });
    expect(result.prompt).toBe(longPrompt);
    expect(result.components[0]!.html).toContain(
      `${longPrompt.slice(0, 60)}…`,
    );
  });

  it("7. generated results land at the head of history (capped at 100)", async () => {
    const first = await generateDesign({
      prompt: "Brief number 0 for the design history cap",
      components: ["hero"],
    });
    for (let i = 1; i < 102; i++) {
      await generateDesign({
        prompt: `Brief number ${i} for the design history cap`,
        components: ["hero"],
      });
    }
    // The oldest generation is evicted by the 100-entry cap…
    await expect(getResultById(first.id)).rejects.toMatchObject({
      statusCode: 404,
    });
    // …while the newest resolves. (Note: a detail previously CACHED stays
    // readable until its TTL expires even after eviction — see the
    // cache-coherence note in the PR body.)
    const latest = await generateDesign({
      prompt: "The newest brief after the cap run",
      components: ["hero"],
    });
    await expect(getResultById(latest.id)).resolves.toBeDefined();
  });
});

describe("_resetDesignerForTest", () => {
  it("8. restores the seed result after mutations", async () => {
    await generateDesign({
      prompt: "Temporary design brief",
      components: ["hero"],
    });
    _resetDesignerForTest();
    await expect(getResultById("design-seed-1")).resolves.toBeDefined();
  });
});

describe("GenerateDesignSchema — Zod rejection boundaries", () => {
  const valid = {
    prompt: "A sufficiently long design brief",
    components: ["hero"],
  };

  it("9. prompts must be 10..2000 chars", () => {
    expect(
      GenerateDesignSchema.safeParse({ ...valid, prompt: "too short" })
        .success,
    ).toBe(false);
    expect(
      GenerateDesignSchema.safeParse({ ...valid, prompt: "x".repeat(2001) })
        .success,
    ).toBe(false);
  });

  it("10. palette entries must be hex colors (max 8)", () => {
    expect(
      GenerateDesignSchema.safeParse({ ...valid, palette: ["blue"] }).success,
    ).toBe(false);
    expect(
      GenerateDesignSchema.safeParse({
        ...valid,
        palette: Array.from({ length: 9 }, () => "#fff"),
      }).success,
    ).toBe(false);
  });

  it("11. components default to hero/card/button", () => {
    const parsed = GenerateDesignSchema.parse({
      prompt: "A sufficiently long design brief",
    });
    expect(parsed.components).toEqual(["hero", "card", "button"]);
  });
});
