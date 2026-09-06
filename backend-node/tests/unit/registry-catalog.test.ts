/**
 * Unit tests — registry catalog (PF-009 / issue #94 A1).
 *
 * The catalog is exercised hermetically with synthetic sources:
 *   1. registerSource + listItemData/getItemData round-trip
 *   2. resolveItem: canonical envelope (type/slug/version/latestVersion),
 *      first-match-in-canonical-order, ?type disambiguation, 404
 *   3. versionFor: deterministic per-type stamps
 *   4. invalidation: invalidateCatalog drops the list cache
 *
 * The real module delegations (effects/patterns/…) over the full app
 * are covered by tests/integration/registry.test.ts.
 */
import { beforeEach, describe, expect, it } from "vitest";

import {
  REGISTRY_ITEM_TYPES,
  _resetCatalogForTest,
  getItemData,
  invalidateCatalog,
  listItems,
  listItemData,
  registerSource,
  registeredTypes,
  resolveItem,
  versionFor,
} from "../../src/modules/registry/catalog.js";

interface Widget {
  id: string;
  name: string;
}

beforeEach(() => {
  _resetCatalogForTest();
  registerSource("effect", {
    list: () => [
      { id: "fx-glow", name: "Glow", description: "A glow effect." },
      { id: "fx-pulse", name: "Pulse", description: "A pulse effect." },
    ],
    slugOf: (i) => (i as Widget).id,
    nameOf: (i) => (i as Widget).name,
    descriptionOf: (i) => (i as Widget).description,
  });
  registerSource("pattern", {
    list: async () => [{ id: "fx-glow", name: "Glow Pattern" }],
    slugOf: (i) => (i as Widget).id,
    nameOf: (i) => (i as Widget).name,
  });
});

describe("registry catalog (issue #94 A1)", () => {
  it("1. listItemData/getItemData round-trip registered sources (incl. async)", async () => {
    expect(registeredTypes()).toContain("effect");
    const effects = (await listItemData("effect")) as Widget[];
    expect(effects.map((e) => e.id)).toEqual(["fx-glow", "fx-pulse"]);

    const found = (await getItemData("effect", "fx-pulse")) as Widget;
    expect(found.name).toBe("Pulse");
    expect(await getItemData("effect", "nope")).toBeUndefined();
  });

  it("2. resolveItem returns the canonical envelope with version stamps", async () => {
    const item = await resolveItem("fx-glow");
    expect(item).toMatchObject({
      type: "effect",
      slug: "fx-glow",
      name: "Glow",
      description: "A glow effect.",
    });
    expect(item.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(item.latestVersion).toMatch(/^\d+\.\d+\.\d+$/);
    // The raw domain item travels under `data`.
    expect((item.data as Widget).name).toBe("Glow");
  });

  it("3. resolveItem searches in canonical type order and honors ?type=", async () => {
    // "fx-glow" exists as BOTH an effect and a pattern — canonical order
    // (effect first) wins when no type filter is given.
    const unfiltered = await resolveItem("fx-glow");
    expect(unfiltered.type).toBe("effect");

    // The type filter overrides the search order.
    const filtered = await resolveItem("fx-glow", "pattern");
    expect(filtered.type).toBe("pattern");
    expect((filtered.data as Widget).name).toBe("Glow Pattern");
  });

  it("4. resolveItem throws 404 for unknown slugs", async () => {
    await expect(resolveItem("does-not-exist")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
    await expect(resolveItem("fx-pulse", "pattern")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("5. versionFor is deterministic per type", () => {
    const a = versionFor("effect", "fx-glow");
    const b = versionFor("effect", "fx-pulse");
    expect(a).toEqual(b);
    // Different types may carry different stamps; every type has both.
    for (const type of REGISTRY_ITEM_TYPES) {
      const v = versionFor(type, "any");
      expect(v.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(v.latestVersion).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("6. listItems wraps raw items into RegistryItems; invalidation drops the cache", async () => {
    const items = await listItems("effect");
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ type: "effect", slug: "fx-glow" });

    // Swap the source and invalidate — the next list reflects it.
    registerSource("effect", {
      list: () => [{ id: "fx-new", name: "New" }],
      slugOf: (i) => (i as Widget).id,
    });
    invalidateCatalog("effect");
    const after = await listItems("effect");
    expect(after.map((i) => i.slug)).toEqual(["fx-new"]);
  });
});
