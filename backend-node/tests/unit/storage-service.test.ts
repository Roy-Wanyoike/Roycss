/**
 * Unit tests — storage service, in-memory mock mode (PF-007 / issue #126,
 * chunk 1).
 *
 * STORAGE_* env vars are guaranteed unset before import (vi.hoisted) so
 * `isStorageConfigured` is false and the deterministic in-memory store is
 * exercised hermetically:
 *   - 404s for unknown ids (detail + delete)
 *   - the 10 GB quota rejection on upload
 *   - usage aggregation: totals + by-type sorting
 *   - cache invalidation after upload/delete (fresh lists)
 *   - _resetStorageForTest restoring the seed
 *
 * The S3-configured paths (SigV4 signing, XML list parsing, fallbacks on
 * transport failure) live in storage-s3.test.ts; the HTTP surface lives in
 * the contract + integration suites.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
  _resetStorageForTest();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("listFiles — mock store", () => {
  it("1. returns the 8 seeded files as copies; repeat calls hit the cache", async () => {
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
});

describe("getFileById — mock store", () => {
  it("2. a known id returns a copy of the row", async () => {
    const file = await getFileById("file-3");
    expect(file).toMatchObject({
      id: "file-3",
      name: "whitepaper.pdf",
      type: "document",
      mimeType: "application/pdf",
    });
  });

  it("3. an unknown id is a 404 AppError", async () => {
    await expect(getFileById("file-999")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Storage file 'file-999' not found",
    });
  });
});

describe("getUsage — aggregation", () => {
  it("4. totals the seed and sorts by-type buckets by size (desc)", async () => {
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
});

describe("uploadFile — mock store", () => {
  it("5. records the file with a synthesized id + URL and invalidates the list cache", async () => {
    const file = await uploadFile({
      name: "logo.webp",
      type: "image",
      size: 2048,
      mimeType: "image/webp",
    });

    expect(file.id).toMatch(/^file-[0-9a-f-]{36}$/);
    expect(file.url).toBe(
      `https://storage.roycss.cloud/files/${file.id}/logo.webp`,
    );
    expect(file.uploadedAt).toBe("2026-06-01T00:00:00.000Z");

    expect(filesCount()).toBe(9);
    const list = await listFiles();
    expect(list).toHaveLength(9);
    expect(list.find((f) => f.name === "logo.webp")?.id).toBe(file.id);
  });

  it("6. an upload that would exceed the 10 GB quota is a 400", async () => {
    await expect(
      uploadFile({
        name: "huge.bin",
        type: "other",
        size: 9_000_000_000,
        mimeType: "application/octet-stream",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "BAD_REQUEST",
      message: expect.stringContaining("Storage quota exceeded"),
    });
    expect(filesCount()).toBe(8);
  });

  it("7. the quota check accounts for files already uploaded in this store", async () => {
    await uploadFile({
      name: "big-one.bin",
      type: "other",
      size: 8_000_000_000,
      mimeType: "application/octet-stream",
    });
    // Seed (~2.2 GB) + 8 GB leaves < 0.5 GB of headroom.
    await expect(
      uploadFile({
        name: "over-the-top.bin",
        type: "other",
        size: 500_000_000,
        mimeType: "application/octet-stream",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("deleteFile — mock store", () => {
  it("8. deleting a seeded file removes it and invalidates caches", async () => {
    await deleteFile("file-1");
    expect(filesCount()).toBe(7);
    await expect(getFileById("file-1")).rejects.toMatchObject({
      statusCode: 404,
    });
    expect((await listFiles()).map((f) => f.id)).not.toContain("file-1");
  });

  it("9. deleting an unknown id is a 404 with no state change", async () => {
    await expect(deleteFile("file-404")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
    expect(filesCount()).toBe(8);
  });
});

describe("_resetStorageForTest", () => {
  it("10. restores the seed catalog after mutations", async () => {
    await uploadFile({
      name: "temp.txt",
      type: "other",
      size: 1,
      mimeType: "text/plain",
    });
    await deleteFile("file-2");
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

  it("11. name and mimeType are required bounded strings", () => {
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

  it("12. type must be one of the six kinds; size an int in [0, 10GB]", () => {
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
