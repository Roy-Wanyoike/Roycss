import { describe, it, expect } from "vitest";
import {
  filterTools,
  TOOL_CATEGORY,
  TOOL_CATEGORY_META,
  TOOL_IDS,
  TOOL_META,
  type ToolCategoryId,
  type ToolMeta,
  type ToolType,
} from "@/components/roycss/tool-registry";
import { TOOL_COUNT } from "@/lib/site-stats";

describe("tool-registry — single source of truth (issue #185)", () => {
  it("TOOL_IDS matches the hand-maintained TOOL_COUNT", () => {
    expect(TOOL_IDS.length).toBe(TOOL_COUNT);
    expect(TOOL_IDS.length).toBe(70);
  });

  it("TOOL_META covers exactly TOOL_IDS with no gaps or extras", () => {
    expect(Object.keys(TOOL_META).sort()).toEqual([...TOOL_IDS].sort());
  });

  it("every tool has a non-empty title, description, and icon", () => {
    for (const id of TOOL_IDS) {
      const meta: ToolMeta = TOOL_META[id];
      expect(meta.title, `${id} title`).toBeTruthy();
      expect(meta.title.length).toBeGreaterThan(2);
      expect(meta.description, `${id} description`).toBeTruthy();
      expect(meta.description.length).toBeGreaterThan(10);
      expect(meta.icon, `${id} icon`).toBeTruthy();
    }
  });

  it("tool titles are unique (no duplicate cards in the gallery)", () => {
    const titles = TOOL_IDS.map((id) => TOOL_META[id].title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("tool-registry — categories", () => {
  it("every tool maps to exactly one category", () => {
    expect(Object.keys(TOOL_CATEGORY).sort()).toEqual([...TOOL_IDS].sort());
  });

  it("every category value is a known category id with metadata", () => {
    const known = new Set(Object.keys(TOOL_CATEGORY_META) as ToolCategoryId[]);
    for (const id of TOOL_IDS) {
      expect(known.has(TOOL_CATEGORY[id]), `${id} → ${TOOL_CATEGORY[id]}`).toBe(true);
    }
  });

  it("no category is empty, and category labels are unique", () => {
    const counts = new Map<ToolCategoryId, number>();
    for (const id of TOOL_IDS) {
      counts.set(TOOL_CATEGORY[id], (counts.get(TOOL_CATEGORY[id]) ?? 0) + 1);
    }
    expect(counts.size).toBe(Object.keys(TOOL_CATEGORY_META).length);
    for (const [cat, n] of counts) {
      expect(n, `${cat} count`).toBeGreaterThan(0);
    }
    const labels = Object.values(TOOL_CATEGORY_META).map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("filterTools — gallery search + category filter", () => {
  it("returns all tools for an empty query and 'all'", () => {
    expect(filterTools("", "all")).toEqual(TOOL_IDS);
    expect(filterTools("   ", "all")).toEqual(TOOL_IDS);
  });

  it("matches by title, case-insensitively", () => {
    const hits = filterTools("css doctor", "all");
    expect(hits).toContain("css-doctor");
    expect(hits.length).toBeLessThan(TOOL_IDS.length);
  });

  it("matches by description keywords (e.g. clamp)", () => {
    expect(filterTools("clamp", "all")).toContain("fluid-type");
  });

  it("matches by tool id", () => {
    expect(filterTools("css-lint", "all")).toContain("css-lint");
  });

  it("filters by category only", () => {
    const ai = filterTools("", "ai");
    expect(ai.length).toBe(4);
    for (const id of ai) expect(TOOL_CATEGORY[id]).toBe("ai");
  });

  it("combines query + category", () => {
    const hits = filterTools("css", "diagnostics");
    for (const id of hits) expect(TOOL_CATEGORY[id]).toBe("diagnostics");
    expect(hits).toContain("css-doctor");
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterTools("zzz-no-such-tool", "all")).toEqual([]);
  });

  it("is deterministic — same inputs, registry order", () => {
    expect(filterTools("css", "all")).toEqual(filterTools("css", "all"));
    const order = filterTools("", "layout").map((id: ToolType) => TOOL_IDS.indexOf(id));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});
