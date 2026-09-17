/**
 * Unit tests — scope service (PF-007 / issue #126, chunk 1).
 *
 * Deep-path coverage for the @scope analyzer — the branches the
 * integration happy path never reaches:
 *   - the tiny selector engine: tag (case-insensitive), .class lists,
 *     #id, compound forms, and combinator selectors (only the final
 *     compound is analyzed)
 *   - donut-hole semantics: limit subtrees are out-of-scope, limits hit
 *     BEFORE a root are plain out-of-scope, and (documented quirk) the
 *     hole never closes until the next scope-root
 *   - the 400 validation branch for a root selector that parses to
 *     nothing (digits only — passes the Zod regex, fails the analyzer)
 *   - Zod rejection boundaries (selector charset, empty declarations,
 *     DOM node shape)
 */
import { describe, expect, it } from "vitest";

import {
  analyzeScope,
  listPresets,
} from "../../src/modules/scope/service.js";
import {
  ScopeAnalyzeSchema,
  type ScopeAnalyzeInput,
  type ScopeNodeShape,
} from "../../src/modules/scope/schema.js";

function node(
  tag: string,
  over: Partial<ScopeNodeShape> = {},
): ScopeNodeShape {
  return { tag, children: [], ...over };
}

function input(over: Partial<ScopeAnalyzeInput> = {}): ScopeAnalyzeInput {
  return {
    root: ".root",
    declarations: { color: "red" },
    dom: node("main"),
    ...over,
  };
}

describe("analyzeScope — selector engine deep paths", () => {
  it("1. class selector opens a scope; everything above stays out", async () => {
    const result = await analyzeScope(
      input({
        dom: node("main", {
          children: [
            node("h1", { text: "above" }),
            node("section", { class: "root", children: [node("h2")] }),
          ],
        }),
      }),
    );

    expect(result.matches.map((m) => m.status)).toEqual([
      "out-of-scope",
      "out-of-scope",
      "scope-root",
      "in-scope",
    ]);
    expect(result.summary).toEqual({
      total: 4,
      inScope: 1,
      outOfScope: 2,
      scopeRoots: 1,
      scopeLimits: 0,
    });
    expect(result.css).toContain("@scope (.root) {");
    expect(result.css).toContain(":scope {");
    expect(result.css).toContain("color: red;");
  });

  it("2. tag selectors match case-insensitively", async () => {
    const result = await analyzeScope(
      input({
        root: "div",
        dom: node("main", { children: [node("DIV", { children: [node("p")] })] }),
      }),
    );
    expect(result.summary.scopeRoots).toBe(1);
    expect(result.matches[2]!.status).toBe("in-scope");
  });

  it("3. compound tag+class selectors require BOTH parts", async () => {
    const result = await analyzeScope(
      input({
        root: "div.card",
        dom: node("main", {
          children: [node("div"), node("div", { class: "card" }), node("span", { class: "card" })],
        }),
      }),
    );
    // Only the second child (div.card) is a scope-root; the plain div and
    // the span.card fail the tag part.
    expect(result.summary.scopeRoots).toBe(1);
    expect(result.matches[2]!.status).toBe("scope-root");
  });

  it("4. id selectors match the node id", async () => {
    const result = await analyzeScope(
      input({
        root: "#main",
        dom: node("main", { id: "main", children: [node("p")] }),
      }),
    );
    expect(result.summary.scopeRoots).toBe(1);
    expect(result.matches[1]!.status).toBe("in-scope");
  });

  it("5. a class-list selector requires every class on the node", async () => {
    const result = await analyzeScope(
      input({
        root: ".card.featured",
        dom: node("main", {
          children: [
            node("article", { class: "card" }),
            node("article", { class: "card featured" }),
            node("article", { class: "featured" }),
          ],
        }),
      }),
    );
    expect(result.summary.scopeRoots).toBe(1);
    expect(result.matches[2]!.status).toBe("scope-root");
  });

  it("6. combinator selectors analyze only the final compound", async () => {
    const result = await analyzeScope(
      input({
        root: ".parent > .child",
        dom: node("main", {
          children: [
            node("div", { class: "parent" }),
            node("div", { class: "child", children: [node("p")] }),
          ],
        }),
      }),
    );
    // ".child" is the analyzed compound → the .parent div is NOT a root.
    expect(result.summary.scopeRoots).toBe(1);
    expect(result.matches[1]!.status).toBe("out-of-scope");
    expect(result.matches[2]!.status).toBe("scope-root");
    expect(result.matches[3]!.status).toBe("in-scope");
  });

  it("7. paths are built from the flattened DOM chain", async () => {
    const result = await analyzeScope(
      input({
        dom: node("main", {
          children: [node("section", { class: "root", children: [node("h2")] })],
        }),
      }),
    );
    expect(result.matches[2]!.path).toBe("main > section > h2");
  });
});

describe("analyzeScope — donut-hole (limit) semantics", () => {
  it("8. a limit inside the scope opens a hole; the limit node and subtree are out", async () => {
    const result = await analyzeScope(
      input({
        limit: ".limit",
        dom: node("main", {
          children: [
            node("section", {
              class: "root",
              children: [
                node("h2"),
                node("div", { class: "limit", children: [node("span")] }),
              ],
            }),
          ],
        }),
      }),
    );

    expect(result.matches.map((m) => m.status)).toEqual([
      "out-of-scope",
      "scope-root",
      "in-scope",
      "scope-limit",
      "out-of-scope",
    ]);
    expect(result.css).toContain("@scope (.root) to (.limit)");
    expect(result.explanation).toContain('.limit" (1 matched)');
  });

  it("9. the hole never closes below the first limit (documented quirk)", async () => {
    // depthInLimit is only reset by a new scope-root — a sibling AFTER the
    // limit subtree is still out-of-scope.
    const result = await analyzeScope(
      input({
        limit: ".limit",
        dom: node("main", {
          children: [
            node("section", {
              class: "root",
              children: [
                node("div", { class: "limit" }),
                node("p", { text: "sibling after the hole" }),
              ],
            }),
            node("section", {
              class: "root",
              children: [node("p", { text: "fresh root reopens scope" })],
            }),
          ],
        }),
      }),
    );

    expect(result.matches[3]!.status).toBe("out-of-scope");
    expect(result.matches[4]!.status).toBe("scope-root");
    expect(result.matches[5]!.status).toBe("in-scope");
  });

  it("10. a limit hit BEFORE any root is plain out-of-scope, not scope-limit", async () => {
    const result = await analyzeScope(
      input({
        limit: ".limit",
        dom: node("main", {
          children: [
            node("div", { class: "limit" }),
            node("section", { class: "root", children: [node("p")] }),
          ],
        }),
      }),
    );
    expect(result.matches[1]!.status).toBe("out-of-scope");
    expect(result.summary.scopeLimits).toBe(0);
  });

  it("11. an unmatchable root marks everything out-of-scope", async () => {
    const result = await analyzeScope(
      input({
        root: ".missing",
        dom: node("main", { children: [node("p"), node("p")] }),
      }),
    );
    expect(result.summary).toEqual({
      total: 3,
      inScope: 0,
      outOfScope: 3,
      scopeRoots: 0,
      scopeLimits: 0,
    });
  });
});

describe("analyzeScope — validation error path", () => {
  it("12. a root selector that parses to nothing is a 400 before any analysis", async () => {
    // "123" passes the route schema's permissive charset but has no
    // tag/class/id token for the analyzer.
    await expect(analyzeScope(input({ root: "123" }))).rejects.toMatchObject({
      statusCode: 400,
      code: "BAD_REQUEST",
      message: expect.stringContaining('Could not parse root selector "123"'),
    });
  });

  it("13. a purely-symbolic root selector is also rejected", async () => {
    await expect(analyzeScope(input({ root: ">>>" }))).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe("listPresets", () => {
  it("14. returns the 4 seeded @scope presets", async () => {
    const presets = await listPresets();
    expect(presets.map((p) => p.id)).toEqual([
      "preset-root-class",
      "preset-has-selector",
      "preset-direct-child",
      "preset-adjacent-sibling",
    ]);
  });

  it("15. documents the :has() preset behavior (see bug note in PR — the analyzer has no :has() support)", async () => {
    // parseSelector tokenizes ".card:has(.badge-featured)" as
    // tag "has" + classes [card, badge-featured], so no article matches
    // and the preset's own "in scope" annotations never materialize.
    const presets = await listPresets();
    const hasPreset = presets.find((p) => p.id === "preset-has-selector");
    expect(hasPreset).toBeDefined();
    const result = await analyzeScope(hasPreset!.input);
    expect(result.summary.scopeRoots).toBe(0);
    expect(result.summary.inScope).toBe(0);
  });
});

describe("ScopeAnalyzeSchema — Zod rejection boundaries", () => {
  const valid = {
    root: ".root",
    declarations: { color: "red" },
    dom: { tag: "main", children: [] },
  };

  it("16. root/limit must be non-empty and use the selector charset", () => {
    expect(ScopeAnalyzeSchema.safeParse({ ...valid, root: "" }).success).toBe(
      false,
    );
    expect(
      ScopeAnalyzeSchema.safeParse({ ...valid, root: ".a .b{}" }).success,
    ).toBe(false);
    expect(
      ScopeAnalyzeSchema.safeParse({ ...valid, limit: ".a .b{}" }).success,
    ).toBe(false);
  });

  it("17. declarations must be a non-empty record", () => {
    expect(
      ScopeAnalyzeSchema.safeParse({ ...valid, declarations: {} }).success,
    ).toBe(false);
  });

  it("18. DOM nodes require a tag; children default to []", () => {
    expect(
      ScopeAnalyzeSchema.safeParse({ ...valid, dom: { children: [] } }).success,
    ).toBe(false);
    const parsed = ScopeAnalyzeSchema.parse(valid);
    expect(parsed.dom.children).toEqual([]);
  });

  it("19. nested DOM nodes are validated recursively", () => {
    expect(
      ScopeAnalyzeSchema.safeParse({
        ...valid,
        dom: { tag: "main", children: [{ id: "x" }] },
      }).success,
    ).toBe(false);
  });
});
