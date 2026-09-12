/**
 * Unit tests — collections service (PF-048).
 *
 * The Prisma client AND the registry catalog are mocked (vi.mock) so
 * the service is exercised hermetically:
 *   - effect ids validated through the catalog SOT (getItemData)
 *   - owner scoping: every query filters by userId; foreign ids = 404
 *   - effectIds JSON-string round-trip (Theme.tokensJson convention)
 *   - membership order preservation + duplicate rejection (409)
 *
 * The end-to-end coverage (HTTP surface, envelopes, audit rows) lives
 * in tests/integration/favorites-collections.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const countMock = vi.fn();
const findFirstMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("../../src/lib/db.js", () => ({
  db: {
    collection: {
      findMany: (args: unknown) => findManyMock(args),
      count: (args: unknown) => countMock(args),
      findFirst: (args: unknown) => findFirstMock(args),
      create: (args: unknown) => createMock(args),
      update: (args: unknown) => updateMock(args),
      delete: (args: unknown) => deleteMock(args),
    },
  },
}));

const getItemDataMock = vi.fn();

vi.mock("../../src/modules/registry/catalog.js", () => ({
  getItemData: (type: string, slug: string) => getItemDataMock(type, slug),
}));

import {
  addEffectToCollection,
  createCollection,
  deleteCollection,
  getCollectionById,
  listCollections,
  removeEffectFromCollection,
  updateCollection,
} from "../../src/modules/collections/service.js";

function row(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "col-1",
    userId: "user-1",
    name: "Neon kit",
    description: null,
    effectIds: JSON.stringify(["a", "b"]),
    createdAt: new Date("2026-09-01T00:00:00Z"),
    updatedAt: new Date("2026-09-02T00:00:00Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getItemDataMock.mockResolvedValue({ id: "a", name: "Effect A" });
});

describe("listCollections + getCollectionById (hermetic)", () => {
  it("1. maps rows to the domain shape (effectIds JSON parsed, ISO dates)", async () => {
    findManyMock.mockResolvedValue([row(), row({ id: "col-2", effectIds: "[]" })]);
    countMock.mockResolvedValue(2);

    const result = await listCollections("user-1", { page: 1, limit: 24 });

    expect(result.items[0]!.effectIds).toEqual(["a", "b"]);
    expect(result.items[1]!.effectIds).toEqual([]);
    expect(result.items[0]!.createdAt).toBe("2026-09-01T00:00:00.000Z");
    expect(result).toMatchObject({ page: 1, limit: 24, total: 2, totalPages: 1 });
  });

  it("2. queries are owner-scoped + paged, newest first", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    await listCollections("user-2", { page: 2, limit: 5 });

    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: "user-2" },
      orderBy: { createdAt: "desc" },
      skip: 5,
      take: 5,
    });
    expect(countMock).toHaveBeenCalledWith({ where: { userId: "user-2" } });
  });

  it("3. a corrupt effectIds payload reads as an empty collection", async () => {
    findFirstMock.mockResolvedValue(row({ effectIds: "not json" }));

    const collection = await getCollectionById("user-1", "col-1");

    expect(collection.effectIds).toEqual([]);
    expect(collection.name).toBe("Neon kit");
  });

  it("4. foreign/unknown id → AppError 404 (flat, no leak)", async () => {
    findFirstMock.mockResolvedValue(null);

    await expect(getCollectionById("user-1", "someone-elses")).rejects.toMatchObject(
      { statusCode: 404, code: "NOT_FOUND" },
    );
  });
});

describe("createCollection (hermetic)", () => {
  it("5. validates initial membership through the catalog before writing", async () => {
    getItemDataMock.mockImplementation((_t: string, slug: string) =>
      slug === "unknown" ? Promise.resolve(undefined) : Promise.resolve({ id: slug }),
    );

    await expect(
      createCollection("user-1", {
        name: "Kit",
        effectIds: ["a", "unknown"],
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("6. dedupes initial membership (order preserved) and persists JSON", async () => {
    createMock.mockResolvedValue(row({ effectIds: JSON.stringify(["a", "b"]) }));

    await createCollection("user-1", {
      name: "Kit",
      effectIds: ["b", "a", "b"],
    });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        name: "Kit",
        description: null,
        effectIds: JSON.stringify(["b", "a"]),
      },
    });
  });
});

describe("updateCollection + membership edits (hermetic)", () => {
  it("7. PATCH without effectIds keeps the existing membership untouched", async () => {
    findFirstMock.mockResolvedValue(row());
    updateMock.mockResolvedValue(row({ name: "Renamed" }));

    const updated = await updateCollection("user-1", "col-1", {
      name: "Renamed",
    });

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "col-1" },
      data: {
        name: "Renamed",
        effectIds: JSON.stringify(["a", "b"]),
      },
    });
    expect(updated.name).toBe("Renamed");
    expect(updated.effectIds).toEqual(["a", "b"]);
  });

  it("8. PATCH with effectIds validates + replaces the membership", async () => {
    findFirstMock.mockResolvedValue(row());
    updateMock.mockResolvedValue(
      row({ effectIds: JSON.stringify(["b", "c"]) }),
    );

    await updateCollection("user-1", "col-1", { effectIds: ["b", "c"] });

    expect(getItemDataMock).toHaveBeenCalledWith("effect", "b");
    expect(getItemDataMock).toHaveBeenCalledWith("effect", "c");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "col-1" },
      data: { effectIds: JSON.stringify(["b", "c"]) },
    });
  });

  it("9. addEffectToCollection appends (order) · 409 duplicate · 404 unknown effect", async () => {
    findFirstMock.mockResolvedValue(row());
    updateMock.mockResolvedValue(
      row({ effectIds: JSON.stringify(["a", "b", "c"]) }),
    );

    const appended = await addEffectToCollection("user-1", "col-1", {
      effectId: "c",
    });
    expect(appended.effectIds).toEqual(["a", "b", "c"]);

    // Duplicate member → 409 before any write.
    findFirstMock.mockResolvedValue(row());
    await expect(
      addEffectToCollection("user-1", "col-1", { effectId: "a" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT" });
    expect(updateMock).toHaveBeenCalledTimes(1);

    // Unknown effect → 404 through the catalog.
    getItemDataMock.mockResolvedValue(undefined);
    await expect(
      addEffectToCollection("user-1", "col-1", { effectId: "nope" }),
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  it("10. removeEffectFromCollection preserves the rest · 404 non-member · delete works", async () => {
    findFirstMock.mockResolvedValue(row());
    updateMock.mockResolvedValue(row({ effectIds: JSON.stringify(["a"]) }));

    const removed = await removeEffectFromCollection("user-1", "col-1", "b");
    expect(removed.effectIds).toEqual(["a"]);

    // Non-member → flat 404, no write.
    findFirstMock.mockResolvedValue(row());
    await expect(
      removeEffectFromCollection("user-1", "col-1", "zzz"),
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });

    // deleteCollection removes the owned row by id.
    findFirstMock.mockResolvedValue(row());
    await deleteCollection("user-1", "col-1");
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "col-1" } });
  });
});
