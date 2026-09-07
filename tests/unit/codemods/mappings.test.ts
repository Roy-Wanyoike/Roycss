/**
 * mappings.test.ts — catalog validation (PF-015, issue #95)
 *
 * THE load-bearing invariant of the migration library: every non-null
 * mapping target of every *inbound* codemod is a class the RoyCSS catalog
 * really ships (a `.roycss-*` selector in src/lib), and every mapping KEY
 * of every *outbound* codemod is a catalog class. A mapping can therefore
 * never reference a class the library does not define — this test fails the
 * moment a catalog rename lands without a codemod update.
 */

import { describe, it, expect } from "vitest";

import { effects } from "@/lib/roycss-effects";
import { getCatalogClasses, getEffectCssForClass } from "../../../scripts/codemods/lib/catalog";
import { codemods, codemodIds } from "../../../scripts/codemods/index";
import { MAPPINGS as TAILWIND } from "../../../scripts/codemods/from-tailwind";
import { MAPPINGS as BOOTSTRAP } from "../../../scripts/codemods/from-bootstrap";
import { MAPPINGS as ANIMATE } from "../../../scripts/codemods/from-animate-css";
import { MAPPINGS as MUI } from "../../../scripts/codemods/from-mui";
import { MAPPINGS as CHAKRA } from "../../../scripts/codemods/from-chakra";
import { MAPPINGS as TO_TAILWIND } from "../../../scripts/codemods/to-tailwind";
import { VANILLA_TABLE as TO_VANILLA } from "../../../scripts/codemods/to-vanilla-css";

const INBOUND_TABLES: ReadonlyArray<[string, Record<string, string | null>]> = [
  ["from-tailwind", TAILWIND],
  ["from-bootstrap", BOOTSTRAP],
  ["from-animate-css", ANIMATE],
  ["from-mui", MUI],
  ["from-chakra", CHAKRA],
];

describe("catalog validation — mappings can never point outside the library", () => {
  it("the catalog exposes its full class set (1,959 effects, 1,976 classes)", () => {
    expect(effects.length).toBe(1959);
    expect(getCatalogClasses().size).toBeGreaterThan(1900);
  });

  for (const [id, table] of INBOUND_TABLES) {
    it(`${id}: every non-null target is a real catalog class`, () => {
      const catalog = getCatalogClasses();
      const missing = Object.entries(table)
        .filter(([, to]) => to !== null && to !== undefined)
        .filter(([, to]) => !catalog.has(to as string))
        .map(([from, to]) => `${from} → ${to}`);
      expect(missing, `${id} targets not in catalog: ${missing.join(", ")}`).toEqual([]);
    });

    it(`${id}: every non-null target is roycss-prefixed (RoyMotion is reserved)`, () => {
      const bad = Object.values(table).filter(
        (to) => to !== null && to !== undefined && !/^roycss-[A-Za-z0-9_-]+$/.test(to as string),
      );
      expect(bad).toEqual([]);
    });
  }

  it("to-tailwind: every mapping KEY is a real catalog class", () => {
    const catalog = getCatalogClasses();
    const missing = Object.keys(TO_TAILWIND).filter((k) => !catalog.has(k));
    expect(missing, `to-tailwind keys not in catalog: ${missing.join(", ")}`).toEqual([]);
  });

  it("to-vanilla-css: the table is exactly the catalog, prefix-stripped", () => {
    const catalog = getCatalogClasses();
    expect(Object.keys(TO_VANILLA).length).toBe(catalog.size);
    for (const [from, to] of Object.entries(TO_VANILLA)) {
      expect(to).toBe(from.replace(/^(?:roycss|roymotion)-/, ""));
    }
  });

  it("getEffectCssForClass returns real css for catalog classes and null otherwise", () => {
    const css = getEffectCssForClass("roycss-fade-in");
    expect(css).toContain(".roycss-fade-in");
    expect(getEffectCssForClass("roycss-definitely-not-in-catalog")).toBeNull();
  });
});

describe("registry — every codemod is dispatchable and unique", () => {
  it("ships 8 codemods with unique kebab-case ids", () => {
    expect(codemodIds).toEqual([
      "from-tailwind",
      "from-bootstrap",
      "from-animate-css",
      "from-mui",
      "from-chakra",
      "to-vanilla-css",
      "to-tailwind",
      "v1-to-v2",
    ]);
    expect(new Set(codemodIds).size).toBe(codemodIds.length);
  });

  it("every codemod declares the issue #95 direction kinds", () => {
    const kinds = codemods.map((c) => c.kind).sort();
    expect(kinds).toEqual(["inbound", "inbound", "inbound", "inbound", "inbound", "outbound", "outbound", "scaffold"]);
    for (const def of codemods) {
      expect(def.id).toMatch(/^[a-z0-9-]+$/);
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
    }
  });

  it("total mapping counts are non-trivial for every table codemod", () => {
    for (const def of codemods) {
      if (def.reportOnly) continue;
      expect(def.mappingCount?.(), `${def.id} mappingCount`).toBeGreaterThan(0);
    }
    // inbound total pinned: 15 + 56 + 58 + 54 + 32 = 215 semantic mappings
    const inboundTotal = INBOUND_TABLES.reduce(
      (sum, [, t]) => sum + Object.values(t).filter((v) => v !== null && v !== undefined).length,
      0,
    );
    expect(inboundTotal).toBe(215);
  });
});
