/**
 * Unit tests — starting-style service (PF-007 / issue #126, chunk 1).
 *
 * Deep-path coverage for the @starting-style generator — the branches
 * the integration happy path never reaches:
 *   - easing resolution: named easings, cubic-bezier with control points,
 *     and cubic-bezier WITHOUT points (raw keyword fallback — schema does
 *     not require the tuple)
 *   - per-property emission branches (opacity / transform-like /
 *     color / background-color / border-color / display-discrete)
 *   - allow-discrete: transition suffix, hidden display:none, explanation
 *   - LRU cache hit (same reference)
 *   - Zod rejection boundaries (selector charset, duration, properties)
 */
import { describe, expect, it } from "vitest";

import {
  generateStartingStyle,
  listPresets,
} from "../../src/modules/starting-style/service.js";
import {
  StartingStyleGenerateSchema,
  type StartingStyleGenerateInput,
} from "../../src/modules/starting-style/schema.js";

function input(
  over: Partial<StartingStyleGenerateInput> = {},
): StartingStyleGenerateInput {
  return {
    selector: ".tooltip",
    duration: 200,
    easing: "ease-out",
    properties: ["opacity"],
    translateY: 16,
    scaleFrom: 0.9,
    allowDiscrete: false,
    hiddenClass: "is-hidden",
    ...over,
  };
}

describe("generateStartingStyle — easing resolution", () => {
  it("1. named easings pass through untouched", async () => {
    const result = await generateStartingStyle(input({ easing: "ease-in-out" }));
    expect(result.baseCss).toContain("transition: opacity 200ms ease-in-out;");
  });

  it("2. cubic-bezier with control points is fully rendered", async () => {
    const result = await generateStartingStyle(
      input({ easing: "cubic-bezier", cubicBezier: [0.34, 1.56, 0.64, 1] }),
    );
    expect(result.baseCss).toContain(
      "transition: opacity 200ms cubic-bezier(0.34, 1.56, 0.64, 1);",
    );
    expect(result.explanation).toContain("cubic-bezier(0.34, 1.56, 0.64, 1)");
  });

  it("3. cubic-bezier without control points degrades to the raw keyword", async () => {
    // The schema makes cubicBezier optional even for easing: cubic-bezier —
    // the generator must not crash, it emits the bare keyword.
    const result = await generateStartingStyle(
      input({ easing: "cubic-bezier", cubicBezier: undefined }),
    );
    expect(result.baseCss).toContain("transition: opacity 200ms cubic-bezier;");
  });
});

describe("generateStartingStyle — per-property emission branches", () => {
  it("4. opacity-only animates opacity in all three blocks", async () => {
    const result = await generateStartingStyle(input());
    expect(result.baseCss).toContain("opacity: 1;");
    expect(result.hiddenCss).toContain("opacity: 0;");
    expect(result.startingStyleCss).toContain("opacity: 0;");
    expect(result.baseCss).not.toContain("transform:");
    expect(result.combinedCss).toBe(
      [result.baseCss, result.hiddenCss, result.startingStyleCss].join("\n\n"),
    );
  });

  it("5. transform, scale AND translate each count as transform-like", async () => {
    for (const prop of ["transform", "scale", "translate"] as const) {
      const result = await generateStartingStyle(
        input({ properties: [prop], selector: `.el-${prop}` }),
      );
      expect(result.baseCss).toContain("transform: translateY(0) scale(1);");
      expect(result.hiddenCss).toContain("transform: translateY(16px) scale(0.9);");
      expect(result.startingStyleCss).toContain(
        "transform: translateY(16px) scale(0.9);",
      );
    }
  });

  it("6. color / background-color / border-color emit their base declarations", async () => {
    const result = await generateStartingStyle(
      input({
        properties: ["color", "background-color", "border-color"],
      }),
    );
    expect(result.baseCss).toContain("color: currentColor;");
    expect(result.baseCss).toContain(
      "background-color: var(--bg, transparent);",
    );
    expect(result.baseCss).toContain("border-color: var(--border, transparent);");
    // No transform-like property → no transform lines anywhere.
    expect(result.baseCss).not.toContain("transform:");
  });

  it("7. every animated property gets its own transition segment", async () => {
    const result = await generateStartingStyle(
      input({ properties: ["opacity", "transform"] }),
    );
    expect(result.baseCss).toContain(
      "transition: opacity 200ms ease-out, transform 200ms ease-out;",
    );
  });
});

describe("generateStartingStyle — allow-discrete branch", () => {
  it("8. allowDiscrete appends the display segment, hidden display:none, and an explanation note", async () => {
    const result = await generateStartingStyle(
      input({ properties: ["opacity", "transform"], allowDiscrete: true }),
    );

    expect(result.allowDiscrete).toBe(true);
    expect(result.baseCss).toContain(
      "display 200ms ease-out allow-discrete",
    );
    expect(result.hiddenCss).toContain("display: none;");
    expect(result.explanation).toContain("allow-discrete");
    expect(result.explanation).toContain("is-hidden");
  });

  it("9. without allowDiscrete there is no display anywhere", async () => {
    const result = await generateStartingStyle(input());
    expect(result.allowDiscrete).toBe(false);
    expect(result.baseCss).not.toContain("display");
    expect(result.hiddenCss).not.toContain("display");
    expect(result.explanation).not.toContain("allow-discrete");
  });

  it("10. the hidden block is selected by the configurable hiddenClass", async () => {
    const result = await generateStartingStyle(
      input({ hiddenClass: "is-collapsed" }),
    );
    expect(result.hiddenCss).toContain(".tooltip.is-collapsed {");
  });
});

describe("generateStartingStyle — cache", () => {
  it("11. identical input returns the cached object (same reference)", async () => {
    const a = input({ selector: ".cache" });
    const first = await generateStartingStyle(a);
    const second = await generateStartingStyle(a);
    expect(second).toBe(first);
  });
});

describe("listPresets", () => {
  it("12. returns the 6 seeded presets with unique ids", async () => {
    const presets = await listPresets();
    expect(presets).toHaveLength(6);
    expect(new Set(presets.map((p) => p.id)).size).toBe(6);
    expect(presets.map((p) => p.id)).toContain("preset-height-collapse");
  });
});

describe("StartingStyleGenerateSchema — Zod rejection boundaries", () => {
  const valid = {
    selector: ".tooltip",
    duration: 200,
    easing: "ease-out",
    properties: ["opacity"],
  };

  it("13. selector must be non-empty and match the selector charset", () => {
    expect(
      StartingStyleGenerateSchema.safeParse({ ...valid, selector: "" }).success,
    ).toBe(false);
    expect(
      StartingStyleGenerateSchema.safeParse({ ...valid, selector: "a, b!" })
        .success,
    ).toBe(false);
  });

  it("14. duration is an int in [0, 5000]", () => {
    expect(
      StartingStyleGenerateSchema.safeParse({ ...valid, duration: 5001 })
        .success,
    ).toBe(false);
    expect(
      StartingStyleGenerateSchema.safeParse({ ...valid, duration: -1 }).success,
    ).toBe(false);
    expect(
      StartingStyleGenerateSchema.safeParse({ ...valid, duration: 200.5 })
        .success,
    ).toBe(false);
  });

  it("15. properties must be a non-empty list of known animatable props", () => {
    expect(
      StartingStyleGenerateSchema.safeParse({ ...valid, properties: [] })
        .success,
    ).toBe(false);
    expect(
      StartingStyleGenerateSchema.safeParse({
        ...valid,
        properties: ["margin"],
      }).success,
    ).toBe(false);
  });

  it("16. a minimal valid payload fills in every default", () => {
    const parsed = StartingStyleGenerateSchema.parse(valid);
    expect(parsed.translateY).toBe(20);
    expect(parsed.scaleFrom).toBe(0.95);
    expect(parsed.allowDiscrete).toBe(false);
    expect(parsed.hiddenClass).toBe("is-hidden");
  });
});
