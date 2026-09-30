/**
 * Unit tests — storage service, in-memory mock mode (PF-007 / issue #126,
 * chunk 1; ownership model reworked by issue #268).
 *
 * STORAGE_* env vars are guaranteed unset before import (vi.hoisted) so
 * `isStorageConfigured` is false and the deterministic in-memory store is
 * exercised hermetically. The Prisma owner map (StorageFileOwner — issue
 * #268) is mocked like collections-service.test.ts does.
 *
 * Pins:
 *   - the 8 seeded files are OWNERLESS legacy rows: invisible to
 *     owner-scoped reads, deletable only by a platform admin
 *   - uploads are attributed to the caller; the owner row is persisted
 *     (upsert) and cleaned up on delete
 *   - owner-scoped list/detail/delete: foreign + ownerless ids read as
 *     the SAME flat 404 (issue #268)
 *   - the 10 GB quota stays GLOBAL (issue #268 pins quota behavior)
 *   - cache invalidation after upload/delete (fresh lists)
 *   - _resetStorageForTest restoring the seed
 *
 * The S3-configured paths (SigV4 signing, XML list parsing, fallbacks on
 * transport failure) live in storage-s3.test.ts; the HTTP surface lives in
 * the contract + integration suites.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const upsertMock = vi.fn();
const deleteManyMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock("../../src/lib/db.js", () => ({
  db: {
    storageFileOwner: {
      upsert: (args: unknown) => upsertMock(args),
      deleteMany: (args: unknown) => deleteManyMock(args),
      findUnique: (args: unknown) => findUniqueMock(args),
    },
  },
}));

vi.hoisted(() => {
  delete process.env.STORAGE_ENDPOINT;
  delete process.env.STORAGE_BUCKET;
  delete process.env.STORAGE_ACCESS_KEY_ID;
  delete process.env.STORAGE_SECRET_ACCESS_KEY;
  delete process.env.STORAGE_REGION;
});

import {
  _resetStorageForTest,
  deleteFile,
  filesCount,
  getFileById,
  getUsage,
  listFiles,
  uploadFile,
} from "../../src/modules/storage/service.js";
import { StorageUploadSchema } from "../../src/modules/storage/schema.js";

const SEED_USED =
  1_245_184 + 1_610_612_736 + 4_812_004 + 8_402_880 + 2_488_320 +
  18_874_368 + 142_848 + 712_615_936;

const OWNER_A = "user-A-cuid";
const OWNER_B = "user-B-cuid";
const ADMIN = { sub: "admin-cuid", isPlatformAdmin: true } as const;
const USER_A = { sub: OWNER_A, isPlatformAdmin: false } as const;
const USER_B = { sub: OWNER_B, isPlatformAdmin: false } as const;

const UPLOAD_A = {
  name: "logo.webp",
  type: "image" as const,
  size: 2048,
  mimeType: "image/webp",
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
  _resetStorageForTest();
  vi.clearAllMocks();
  upsertMock.mockResolvedValue({});
  deleteManyMock.mockResolvedValue({ count: 0 });
  findUniqueMock.mockResolvedValue(null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("listFiles — mock store", () => {
  it("1. unscoped returns the 8 seeded files as copies; repeat calls hit the cache", async () => {
    const first = await listFiles();
    expect(first).toHaveLength(8);
    expect(first[0]).toMatchObject({ id: "file-1", name: "hero-bg.png" });

    const second = await listFiles();
    expect(second).toBe(first); // cache hit — same reference

    // Callers can mutate the cached array, but the module's live rows are
    // never exposed: the catalog still reports the full seed.
    first.pop();
    expect(filesCount()).toBe(8);
  });

  it("1b. owner-scoped returns only the caller's rows; seeds are invisible", async () => {
    await uploadFile({ ...UPLOAD_A, ownerId: OWNER_A });
    await uploadFile({ ...UPLOAD_A, name: "b.bin", ownerId: OWNER_B });

    const ownedA = await listFiles(OWNER_A);
    expect(ownedA).toHaveLength(1);
    expect(ownedA[0]).toMatchObject({ name: "logo.webp" });
    // The internal owner attribution is stripped from the public shape.
    expect(ownedA[0]).not.toHaveProperty("ownerId");

    const ownedB = await listFiles(OWNER_B);
    expect(ownedB.map((f) => f.name)).toEqual(["b.bin"]);

    // A fresh user sees nothing — including the 8 legacy seed rows.
    expect(await listFiles("user-C-cuid")).toEqual([]);
  });
});

describe("getFileById — mock store", () => {
  it("2. a known id owned by the caller returns a copy of the row", async () => {
    const file = await uploadFile({ ...UPLOAD_A, ownerId: OWNER_A });
    const got = await getFileById(file.id, OWNER_A);
    expect(got).toMatchObject({ name: "logo.webp", type: "image" });
    expect(got).not.toHaveProperty("ownerId");
  });

  it("2b. ownerless seeded ids are flat 404 for every caller (issue #268)", async () => {
    await expect(getFileById("file-3", OWNER_A)).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
    await expect(getFileById("file-3", ADMIN.sub)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("2c. a foreign-owned id is the SAME flat 404 as an unknown id", async () => {
    const file = await uploadFile({ ...UPLOAD_A, ownerId: OWNER_A });
    await expect(getFileById(file.id, OWNER_B)).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      message: `Storage file '${file.id}' not found`,
    });
    await expect(getFileById("file-999", OWNER_B)).rejects.toMatchObject({
      statusCode: 404,
      message: "Storage file 'file-999' not found",
    });
  });

  it("2d. ownership is recovered from the durable owner map when the catalog misses", async () => {
    findUniqueMock.mockResolvedValue({ id: "file-1", ownerId: OWNER_A });
    const got = await getFileById("file-1", OWNER_A);
    expect(got).toMatchObject({ id: "file-1", name: "hero-bg.png" });
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: "file-1" } });
  });
});

describe("getUsage — aggregation", () => {
  it("3. global totals the seed and sorts by-type buckets by size (desc)", async () => {
    const usage = await getUsage();
    expect(usage.used).toBe(SEED_USED);
    expect(usage.quota).toBe(10 * 1024 * 1024 * 1024);
    expect(usage.unit).toBe("bytes");
    expect(usage.fileCount).toBe(8);
    expect(usage.byType.map((b) => b.type)).toEqual([
      "video",
      "archive",
      "audio",
      "document",
      "image",
    ]);
    // video = intro-video + tutorial
    expect(usage.byType[0]!.size).toBe(1_610_612_736 + 712_615_936);
  });

  it("3b. owner-scoped usage covers only the caller's rows (quota constant global)", async () => {
    const a1 = await uploadFile({ ...UPLOAD_A, ownerId: OWNER_A });
    await uploadFile({ ...UPLOAD_A, name: "a2.bin", type: "other", ownerId: OWNER_A });
    await uploadFile({ ...UPLOAD_A, name: "b.bin", ownerId: OWNER_B });

    const usageA = await getUsage(OWNER_A);
    expect(usageA.fileCount).toBe(2);
    expect(usageA.used).toBe(a1.size * 2);
    expect(usageA.quota).toBe(10 * 1024 * 1024 * 1024); // unchanged, global
    expect(usageA.byType.map((b) => b.type)).toEqual(["image", "other"]);

    expect((await getUsage(OWNER_B)).fileCount).toBe(1);
    expect((await getUsage("user-C-cuid")).fileCount).toBe(0);
  });
});

describe("uploadFile — mock store", () => {
  it("4. records the file with a synthesized id + URL, persists the owner row, and invalidates the list cache", async () => {
    const file = await uploadFile({ ...UPLOAD_A, ownerId: OWNER_A });

    expect(file.id).toMatch(/^file-[0-9a-f-]{36}$/);
    expect(file.url).toBe(
      `https://storage.roycss.cloud/files/${file.id}/logo.webp`,
    );
    expect(file.uploadedAt).toBe("2026-06-01T00:00:00.000Z");
    expect(file).not.toHaveProperty("ownerId");

    expect(filesCount()).toBe(9);
    const list = await listFiles();
    expect(list).toHaveLength(9);
    expect(list.find((f) => f.name === "logo.webp")?.id).toBe(file.id);

    // Durable attribution (issue #268): the StorageFileOwner row is
    // upserted with the file id → caller mapping.
    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: file.id },
      create: { id: file.id, ownerId: OWNER_A },
      update: {},
    });
    expect(await listFiles(OWNER_A)).toHaveLength(1);
  });

  it("5. an upload that would exceed the 10 GB quota is a 400 (quota still global)", async () => {
    await expect(
      uploadFile({
        name: "huge.bin",
        type: "other",
        size: 9_000_000_000,
        mimeType: "application/octet-stream",
        ownerId: OWNER_A,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "BAD_REQUEST",
      message: expect.stringContaining("Storage quota exceeded"),
    });
    expect(filesCount()).toBe(8);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("6. the quota check accounts for files already uploaded by ANY user", async () => {
    await uploadFile({
      name: "big-one.bin",
      type: "other",
      size: 8_000_000_000,
      mimeType: "application/octet-stream",
      ownerId: OWNER_A,
    });
    // Seed (~2.2 GB) + 8 GB leaves < 0.5 GB of headroom — the second
    // upload exceeds the GLOBAL quota even for a different owner.
    await expect(
      uploadFile({
        name: "over-the-top.bin",
        type: "other",
        size: 500_000_000,
        mimeType: "application/octet-stream",
        ownerId: OWNER_B,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("deleteFile — authorized (issue #268)", () => {
  it("7. the owner deletes their own upload", async () => {
    const file = await uploadFile({ ...UPLOAD_A, ownerId: OWNER_A });
    await expect(deleteFile(file.id, USER_A)).resolves.toBeUndefined();
    expect(filesCount()).toBe(8);
    await expect(getFileById(file.id, OWNER_A)).rejects.toMatchObject({
      statusCode: 404,
    });
    // The durable owner row is cleaned up too.
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { id: file.id } });
  });

  it("8. cross-user delete is a flat 404 and mutates nothing", async () => {
    const file = await uploadFile({ ...UPLOAD_A, ownerId: OWNER_A });
    await expect(deleteFile(file.id, USER_B)).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      message: `Storage file '${file.id}' not found`,
    });
    expect(filesCount()).toBe(9);
    expect(deleteManyMock).not.toHaveBeenCalled();
    // Even a platform admin gets the flat 404 on a foreign-owned row.
    await expect(deleteFile(file.id, ADMIN)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(filesCount()).toBe(9);
  });

  it("9. ownerless legacy rows are admin-only — a regular user reads the same flat 404", async () => {
    await expect(deleteFile("file-1", USER_A)).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
    expect(filesCount()).toBe(8);

    await expect(deleteFile("file-1", ADMIN)).resolves.toBeUndefined();
    expect(filesCount()).toBe(7);
  });

  it("10. an unknown id is a flat 404 for a regular user (no enumeration)", async () => {
    await expect(deleteFile("file-404", USER_A)).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
    expect(filesCount()).toBe(8);
  });
});

describe("_resetStorageForTest", () => {
  it("11. restores the seed catalog after mutations", async () => {
    await uploadFile({ ...UPLOAD_A, ownerId: OWNER_A });
    await deleteFile("file-2", ADMIN);
    expect(filesCount()).toBe(8); // 8 + 1 - 1

    _resetStorageForTest();
    expect(filesCount()).toBe(8);
    expect((await listFiles()).map((f) => f.id)).toContain("file-2");
  });
});

describe("StorageUploadSchema — Zod rejection boundaries", () => {
  const valid = {
    name: "logo.webp",
    type: "image",
    size: 2048,
    mimeType: "image/webp",
  };

  it("12. name and mimeType are required bounded strings", () => {
    expect(
      StorageUploadSchema.safeParse({ ...valid, name: "  " }).success,
    ).toBe(false);
    expect(
      StorageUploadSchema.safeParse({ ...valid, name: "x".repeat(256) })
        .success,
    ).toBe(false);
    expect(
      StorageUploadSchema.safeParse({ ...valid, mimeType: "" }).success,
    ).toBe(false);
  });

  it("13. type must be one of the six kinds; size an int in [0, 10GB]", () => {
    expect(
      StorageUploadSchema.safeParse({ ...valid, type: "executable" })
        .success,
    ).toBe(false);
    expect(
      StorageUploadSchema.safeParse({ ...valid, size: -1 }).success,
    ).toBe(false);
    expect(
      StorageUploadSchema.safeParse({
        ...valid,
        size: 10 * 1024 * 1024 * 1024 + 1,
      }).success,
    ).toBe(false);
    expect(
      StorageUploadSchema.safeParse({ ...valid, size: 0 }).success,
    ).toBe(true);
  });
});
