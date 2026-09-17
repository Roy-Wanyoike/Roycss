/**
 * Unit tests — subgrid service (PF-007 / issue #126, chunk 1).
 *
 * Deep-path coverage for the subgrid generator — the branches the
 * integration happy path never reaches:
 *   - the span > columns validation error (400) with the offending index
 *   - every track-size strategy (fr / px / auto / minmax / fit-content)
 *     in both the parent CSS and the parentTracks summary
 *   - named vs unnamed parent selectors; subgrid vs non-subgrid children;
 *     cells defaulting to span
 *   - the sequential track-placement wrap math (including the
 *     reset-to-track-1 path — see the dead-ternary note in the PR)
 *   - LRU cache hit (same reference)
 *   - Zod rejection boundaries (columns span, label, hex color, name)
 */
import { describe, expect, it } from "vitest";

import {
  generateSubgrid,
  listPresets,
} from "../../src/modules/subgrid/service.js";
import {
  SubgridGenerateSchema,
  type SubgridGenerateInput,
} from "../../src/modules/subgrid/schema.js";

function input(
  over: Partial<SubgridGenerateInput> = {},
): SubgridGenerateInput {
  return {
    parent: {
      columns: 3,
      trackSize: "fr",
      trackPx: 120,
      trackMin: 80,
      gap: 16,
    },
    children: [
      { label: "Header", span: 3, subgrid: true, color: "#5b8def" },
    ],
    ...over,
  };
}

describe("generateSubgrid — validation error path", () => {
  it("1. a child span wider than the parent columns is a 400 naming the index", async () => {
    await expect(
      generateSubgrid(
        input({
          children: [
            { label: "A", span: 3, subgrid: true, color: "#5b8def" },
            { label: "B", span: 5, subgrid: true, color: "#22c55e" },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "BAD_REQUEST",
      message: "child[1] span (5) exceeds parent columns (3).",
    });
  });
});

describe("generateSubgrid — track-size strategies", () => {
  const cases: Array<[SubgridGenerateInput["parent"]["trackSize"], string]> = [
    ["fr", "repeat(3, 1fr)"],
    ["px", "repeat(3, 120px)"],
    ["auto", "repeat(3, auto)"],
    ["minmax", "repeat(3, minmax(80px, 1fr))"],
    ["fit-content", "repeat(3, fit-content(120px))"],
  ];

  it.each(cases)("2. trackSize '%s' renders '%s' in parentTracks + parent CSS", async (trackSize, expected) => {
    const result = await generateSubgrid(
      input({ parent: { columns: 3, trackSize, trackPx: 120, trackMin: 80, gap: 16 } }),
    );
    expect(result.parentTracks).toBe(expected);
    expect(result.css).toContain(`grid-template-columns: ${expected};`);
    expect(result.css).toContain("gap: 16px;");
  });
});

describe("generateSubgrid — selector + child branches", () => {
  it("3. a named parent uses .parent-<name>; unnamed falls back to .parent-grid", async () => {
    const named = await generateSubgrid(
      input({ parent: { columns: 3, trackSize: "fr", trackPx: 120, trackMin: 80, gap: 16, name: "three-col" } }),
    );
    expect(named.css).toContain(".parent-three-col {");

    const unnamed = await generateSubgrid(input());
    expect(unnamed.css).toContain(".parent-grid {");
  });

  it("4. subgrid children emit the subgrid declaration; non-subgrid children do not", async () => {
    const result = await generateSubgrid(
      input({
        children: [
          { label: "Sub", span: 1, subgrid: true, color: "#5b8def" },
          { label: "Plain", span: 1, subgrid: false, color: "#22c55e" },
        ],
      }),
    );

    expect(result.css).toContain("grid-column: span 1;");
    expect(result.css).toContain("grid-template-columns: subgrid;");

    const sub = result.children[0]!;
    const plain = result.children[1]!;
    expect(sub.subgrid).toBe(true);
    expect(sub.cells).toBe(1); // cells default to span
    expect(plain.subgrid).toBe(false);
    expect(plain.cells).toBeUndefined();
  });

  it("5. explicit cells override the span default for subgrid children", async () => {
    const result = await generateSubgrid(
      input({
        children: [
          { label: "A", span: 3, subgrid: true, cells: 6, color: "#5b8def" },
        ],
      }),
    );
    expect(result.children[0]!.cells).toBe(6);
    expect(result.css).toContain("6 inner cells inherit parent tracks");
  });

  it("6. child labels are rendered as CSS comments", async () => {
    const result = await generateSubgrid(
      input({
        children: [
          { label: "Revenue", span: 3, subgrid: true, color: "#5b8def" },
        ],
      }),
    );
    expect(result.css).toContain("/* Revenue */");
    expect(result.css).toContain(".child-1 {");
  });
});

describe("generateSubgrid — sequential track placement", () => {
  it("7. children pick up tracks sequentially and wrap via modulo", async () => {
    const result = await generateSubgrid(
      input({
        children: [
          { label: "A", span: 2, subgrid: true, color: "#5b8def" },
          { label: "B", span: 2, subgrid: true, color: "#22c55e" },
        ],
      }),
    );
    // A starts at track 1 → [1, 2]. B starts at track 3 → wraps to [3, 1].
    expect(result.children[0]!.parentTracks).toEqual([1, 2]);
    expect(result.children[1]!.parentTracks).toEqual([3, 1]);
  });

  it("8. an overflowing running track index resets to 1 (see dead-ternary note in the PR)", async () => {
    const result = await generateSubgrid(
      input({
        children: [
          { label: "A", span: 2, subgrid: true, color: "#5b8def" },
          { label: "B", span: 2, subgrid: true, color: "#22c55e" },
          { label: "C", span: 2, subgrid: true, color: "#f59e0b" },
        ],
      }),
    );
    // Running index after A and B would be 5 (> 3 columns) — the current
    // implementation resets to 1 rather than wrapping to 2.
    expect(result.children[2]!.parentTracks).toEqual([1, 2]);
  });

  it("9. a child spanning exactly all columns starts at track 1", async () => {
    const result = await generateSubgrid(input());
    expect(result.children[0]!.parentTracks).toEqual([1, 2, 3]);
  });
});

describe("generateSubgrid — cache + presets", () => {
  it("10. identical input returns the cached object (same reference)", async () => {
    const a = input({ parent: { columns: 4, trackSize: "px", trackPx: 100, trackMin: 40, gap: 8 } });
    const first = await generateSubgrid(a);
    const second = await generateSubgrid(a);
    expect(second).toBe(first);
  });

  it("11. returns the 6 seeded presets", async () => {
    const presets = await listPresets();
    expect(presets).toHaveLength(6);
    expect(presets.map((p) => p.id)).toContain("preset-12-col");
  });
});

describe("SubgridGenerateSchema — Zod rejection boundaries", () => {
  const valid = {
    parent: { columns: 3, trackSize: "fr", trackPx: 120, trackMin: 80, gap: 16 },
    children: [{ label: "A", span: 1, subgrid: true, color: "#5b8def" }],
  };

  it("12. columns must be an int in [2, 12]", () => {
    expect(
      SubgridGenerateSchema.safeParse({
        ...valid,
        parent: { ...valid.parent, columns: 1 },
      }).success,
    ).toBe(false);
    expect(
      SubgridGenerateSchema.safeParse({
        ...valid,
        parent: { ...valid.parent, columns: 13 },
      }).success,
    ).toBe(false);
  });

  it("13. children must be a non-empty array (max 12)", () => {
    expect(
      SubgridGenerateSchema.safeParse({ ...valid, children: [] }).success,
    ).toBe(false);
    expect(
      SubgridGenerateSchema.safeParse({
        ...valid,
        children: Array.from({ length: 13 }, () => valid.children[0]),
      }).success,
    ).toBe(false);
  });

  it("14. labels are required bounded strings; spans are ints in [1, 12]", () => {
    expect(
      SubgridGenerateSchema.safeParse({
        ...valid,
        children: [{ ...valid.children[0], label: "  " }],
      }).success,
    ).toBe(false);
    expect(
      SubgridGenerateSchema.safeParse({
        ...valid,
        children: [{ ...valid.children[0], span: 0 }],
      }).success,
    ).toBe(false);
    expect(
      SubgridGenerateSchema.safeParse({
        ...valid,
        children: [{ ...valid.children[0], span: 13 }],
      }).success,
    ).toBe(false);
  });

  it("15. colors must be 3/6-digit hex; parent name must be a CSS identifier", () => {
    expect(
      SubgridGenerateSchema.safeParse({
        ...valid,
        children: [{ ...valid.children[0], color: "blue" }],
      }).success,
    ).toBe(false);
    expect(
      SubgridGenerateSchema.safeParse({
        ...valid,
        parent: { ...valid.parent, name: "1bad" },
      }).success,
    ).toBe(false);
    // Defaults: color + subgrid are optional.
    const parsed = SubgridGenerateSchema.parse({
      parent: { columns: 2 },
      children: [{ label: "A", span: 1 }],
    });
    expect(parsed.children[0]!.subgrid).toBe(true);
    expect(parsed.children[0]!.color).toBe("#5b8def");
    expect(parsed.parent.trackSize).toBe("fr");
    expect(parsed.parent.gap).toBe(8);
  });
});
