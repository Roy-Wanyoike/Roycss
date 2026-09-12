/**
 * Unit tests — favorites service (PF-048).
 *
 * The Prisma client AND the registry catalog are mocked (vi.mock) so
 * the service is exercised hermetically:
 *   - effect resolution goes through the catalog SOT (getItemData)
 *   - owner scoping: every query filters by userId
 *   - 404/409 semantics (unknown effect, duplicate, not favorited)
 *   - pagination math (skip/take, totalPages floor of 1)
 *
 * The end-to-end coverage (HTTP surface, envelopes, audit rows) lives
 * in tests/integration/favorites-collections.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const countMock = vi.fn();
const findFirstMock = vi.fn();
const createMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("../../src/lib/db.js", () => ({
  db: {
    effectFavorite: {
      findMany: (args: unknown) => findManyMock(args),
      count: (args: unknown) => countMock(args),
      findFirst: (args: unknown) => findFirstMock(args),
      create: (args: unknown) => createMock(args),
      delete: (args: unknown) => deleteMock(args),
    },
  },
}));

const getItemDataMock = vi.fn();

vi.mock("../../src/modules/registry/catalog.js", () => ({
  getItemData: (type: string, slug: string) => getItemDataMock(type, slug),
}));

import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from "../../src/modules/favorites/service.js";

const FAKE_EFFECT = { id: "bounce-in", name: "Bounce In", category: "animation" };

function row(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "fav-1",
    userId: "user-1",
    effectId: "bounce-in",
    createdAt: new Date("2026-09-01T00:00:00Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getItemDataMock.mockResolvedValue(FAKE_EFFECT);
});

describe("listFavorites (hermetic)", () => {
  it("1. returns entries with catalog-resolved effects + pagination meta", async () => {
    findManyMock.mockResolvedValue([row(), row({ id: "fav-2", effectId: "btn-ripple" })]);
    countMock.mockResolvedValue(2);

    const result = await listFavorites("user-1", { page: 1, limit: 24 });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]!.effect).toEqual(FAKE_EFFECT);
    expect(result.items[0]!.effectId).toBe("bounce-in");
    expect(result.items[0]!.createdAt).toBe("2026-09-01T00:00:00.000Z");
    expect(result).toMatchObject({ page: 1, limit: 24, total: 2, totalPages: 1 });
  });

  it("2. resolves every effect id through the registry catalog SOT", async () => {
    findManyMock.mockResolvedValue([row()]);
    countMock.mockResolvedValue(1);

    await listFavorites("user-1", { page: 1, limit: 24 });

    expect(getItemDataMock).toHaveBeenCalledWith("effect", "bounce-in");
  });

  it("3. a dangling effect id degrades to effect: null instead of throwing", async () => {
    getItemDataMock.mockResolvedValue(undefined);
    findManyMock.mockResolvedValue([row()]);
    countMock.mockResolvedValue(1);

    const result = await listFavorites("user-1", { page: 1, limit: 24 });

    expect(result.items[0]!.effect).toBeNull();
  });

  it("4. queries are owner-scoped and paged (skip/take math)", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    await listFavorites("user-2", { page: 3, limit: 10 });

    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: "user-2" },
      orderBy: { createdAt: "desc" },
      skip: 20,
      take: 10,
    });
    expect(countMock).toHaveBeenCalledWith({ where: { userId: "user-2" } });
  });

  it("5. totalPages never drops below 1 on an empty list", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    const result = await listFavorites("user-1", { page: 1, limit: 24 });

    expect(result.totalPages).toBe(1);
  });
});

describe("addFavorite (hermetic)", () => {
  it("6. unknown effect → AppError 404 before any write", async () => {
    getItemDataMock.mockResolvedValue(undefined);

    await expect(addFavorite("user-1", "nope")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("7. already favorited → AppError 409, no second row", async () => {
    findFirstMock.mockResolvedValue({ id: "fav-1" });

    await expect(addFavorite("user-1", "bounce-in")).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("8. happy path creates an owner-scoped row and returns the entry", async () => {
    findFirstMock.mockResolvedValue(null);
    createMock.mockResolvedValue(row());

    const entry = await addFavorite("user-1", "bounce-in");

    expect(createMock).toHaveBeenCalledWith({
      data: { userId: "user-1", effectId: "bounce-in" },
    });
    expect(entry.effect).toEqual(FAKE_EFFECT);
    expect(entry.effectId).toBe("bounce-in");
  });
});

describe("removeFavorite (hermetic)", () => {
  it("9. not favorited → AppError 404", async () => {
    findFirstMock.mockResolvedValue(null);

    await expect(removeFavorite("user-1", "bounce-in")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("10. deletes by the owned row id (not a composite key)", async () => {
    findFirstMock.mockResolvedValue({ id: "fav-9" });

    await removeFavorite("user-1", "bounce-in");

    // The lookup was scoped to the owner…
    expect(findFirstMock).toHaveBeenCalledWith({
      where: { userId: "user-1", effectId: "bounce-in" },
      select: { id: true },
    });
    // …and the delete targets that specific row.
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "fav-9" } });
  });
});
