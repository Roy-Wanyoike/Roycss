/**
 * Unit tests — storage service, S3-configured mode (PF-007 / issue #126,
 * chunk 1).
 *
 * STORAGE_* env vars are set via vi.hoisted BEFORE the module graph loads,
 * so `isStorageConfigured` is true and the SigV4 + fetch paths run.
 * `global.fetch` is stubbed — no network:
 *   - ListObjectsV2 XML parsing (entries without <Key> are skipped,
 *     missing <LastModified> falls back to now)
 *   - transport failure (HTTP 500 / rejection) falls back to the in-memory
 *     seed store — same list shape, no crash
 *   - HeadObject synthesis for detail lookups (with mock fallback)
 *   - PutObject manifest upload on uploadFile (and its failure branch)
 *   - DeleteObject semantics: 204 and 404 are both "ok"; a 500 only
 *     404s when the id is not in the local catalog either
 *   - the AWS SigV4 Authorization header shape (scope, signed headers,
 *     64-hex signature) and x-amz-date derivation from the faked clock
 *
 * Mock-mode behavior lives in storage-service.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const S3_ENDPOINT = "https://s3.example.test";
const S3_BUCKET = "my-bucket";
const S3_ACCESS_KEY = "test-access-key";

vi.hoisted(() => {
  process.env.STORAGE_ENDPOINT = "https://s3.example.test";
  process.env.STORAGE_BUCKET = "my-bucket";
  process.env.STORAGE_ACCESS_KEY_ID = "test-access-key";
  process.env.STORAGE_SECRET_ACCESS_KEY = "test-secret-key";
  delete process.env.STORAGE_REGION;
});

import {
  _resetStorageForTest,
  deleteFile,
  filesCount,
  getFileById,
  listFiles,
  uploadFile,
} from "../../src/modules/storage/service.js";

interface FetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

const calls: FetchCall[] = [];

type Responder = (
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{
  ok: boolean;
  status: number;
  text?: () => Promise<string>;
  headers?: Headers;
}>;

let respond: Responder = async () => ({
  ok: true,
  status: 200,
  text: async () => "",
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
  _resetStorageForTest();
  calls.length = 0;
  respond = async () => ({ ok: true, status: 200, text: async () => "" });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: unknown, init: unknown) => {
      const i = (init ?? {}) as {
        method?: string;
        headers?: Record<string, string>;
        body?: string;
      };
      calls.push({
        url: String(url),
        method: i.method ?? "GET",
        headers: { ...(i.headers ?? {}) },
        body: typeof i.body === "string" ? i.body : undefined,
      });
      return respond(String(url), i);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const LIST_URL = `${S3_ENDPOINT}/${S3_BUCKET}?list-type=2&max-keys=200`;

const LIST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
  <Contents><Key>assets/hero.png</Key><Size>1234</Size><LastModified>2026-01-05T00:00:00.000Z</LastModified></Contents>
  <Contents><Key>docs/report.pdf</Key><Size>99</Size></Contents>
  <Contents><Size>7</Size></Contents>
</ListBucketResult>`;

describe("listFiles — S3 ListObjectsV2", () => {
  it("1. parses the XML, maps entries to StorageFiles, and signs with SigV4", async () => {
    respond = async () => ({
      ok: true,
      status: 200,
      text: async () => LIST_XML,
    });

    const files = await listFiles();

    expect(files).toHaveLength(2); // the keyless <Contents> is skipped
    expect(files[0]).toMatchObject({
      id: "assets/hero.png",
      name: "hero.png",
      type: "image",
      size: 1234,
      mimeType: "image/png",
      url: `${S3_ENDPOINT}/${S3_BUCKET}/assets/hero.png`,
      uploadedAt: "2026-01-05T00:00:00.000Z",
    });
    expect(files[1]).toMatchObject({
      id: "docs/report.pdf",
      name: "report.pdf",
      type: "document",
      size: 99,
      // Missing <LastModified> → synthesized from the (faked) clock.
      uploadedAt: "2026-06-01T00:00:00.000Z",
    });

    expect(calls[0]!.url).toBe(LIST_URL);
    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.headers.authorization).toMatch(
      new RegExp(
        `^AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY}/20260601/auto/s3/aws4_request, ` +
          "SignedHeaders=host;x-amz-content-sha256;x-amz-date, " +
          "Signature=[0-9a-f]{64}$",
      ),
    );
    expect(calls[0]!.headers["x-amz-date"]).toBe("20260601T000000Z");
    expect(calls[0]!.headers["x-amz-content-sha256"]).toBe("UNSIGNED-PAYLOAD");
  });

  it("2. an HTTP failure from S3 falls back to the seed store", async () => {
    respond = async () => ({ ok: false, status: 500 });
    const files = await listFiles();
    expect(files).toHaveLength(8);
    expect(files[0]!.id).toBe("file-1");
  });

  it("3. a transport error from S3 falls back to the seed store", async () => {
    respond = async () => {
      throw new Error("ECONNREFUSED");
    };
    const files = await listFiles();
    expect(files).toHaveLength(8);
  });
});

describe("getFileById — S3 HeadObject", () => {
  it("4. a successful HEAD synthesizes the StorageFile from headers", async () => {
    respond = async (url) => {
      if (url.includes("/my-bucket/assets/hero.png")) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({
            "content-length": "4321",
            "content-type": "image/webp",
          }),
        };
      }
      return { ok: false, status: 404 };
    };

    const file = await getFileById("assets/hero.png");
    expect(file).toMatchObject({
      id: "assets/hero.png",
      name: "hero.png",
      type: "image",
      size: 4321,
      mimeType: "image/webp",
      url: `${S3_ENDPOINT}/${S3_BUCKET}/assets/hero.png`,
      uploadedAt: "2026-06-01T00:00:00.000Z",
    });
    expect(calls[0]!.method).toBe("HEAD");
  });

  it("5. a failed HEAD falls back to the local catalog for seeded ids", async () => {
    respond = async () => ({ ok: false, status: 403 });
    const file = await getFileById("file-1");
    expect(file.name).toBe("hero-bg.png");
  });

  it("6. a failed HEAD for an unknown id is a 404", async () => {
    respond = async () => ({ ok: false, status: 403 });
    await expect(getFileById("nope.bin")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
  });
});

describe("uploadFile — S3 PutObject manifest", () => {
  const UPLOAD = {
    name: "logo.webp",
    type: "image" as const,
    size: 2048,
    mimeType: "image/webp",
  };

  it("7. a successful PUT stores the manifest and returns a public URL", async () => {
    respond = async () => ({ ok: true, status: 200 });

    const file = await uploadFile(UPLOAD);

    expect(file.url).toBe(`${S3_ENDPOINT}/${S3_BUCKET}/${file.id}`);
    expect(filesCount()).toBe(9); // local catalog kept current in both modes

    const put = calls.find((c) => c.method === "PUT");
    expect(put).toBeDefined();
    expect(put!.url).toBe(`${S3_ENDPOINT}/${S3_BUCKET}/${file.id}.meta.json`);
    expect(put!.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(put!.body!)).toEqual({
      id: file.id,
      name: "logo.webp",
      type: "image",
      size: 2048,
      mimeType: "image/webp",
      uploadedAt: "2026-06-01T00:00:00.000Z",
    });
    // PUT signs the actual body hash (not UNSIGNED-PAYLOAD).
    expect(put!.headers["x-amz-content-sha256"]).toMatch(/^[0-9a-f]{64}$/);
    expect(put!.headers["x-amz-content-sha256"]).not.toBe("UNSIGNED-PAYLOAD");
  });

  it("8. a failed PUT still records the upload locally (no throw)", async () => {
    respond = async () => ({ ok: false, status: 500 });

    const file = await uploadFile(UPLOAD);
    expect(file.id).toMatch(/^file-/);
    expect(filesCount()).toBe(9);
  });
});

describe("deleteFile — S3 DeleteObject semantics", () => {
  it("9. a 204 response deletes even ids unknown to the local catalog", async () => {
    respond = async () => ({ ok: true, status: 204 });
    await expect(deleteFile("never-seen.bin")).resolves.toBeUndefined();
    expect(calls[0]!.method).toBe("DELETE");
  });

  it("10. a 404 response is treated as already-deleted (ok)", async () => {
    respond = async () => ({ ok: false, status: 404 });
    await expect(deleteFile("gone.bin")).resolves.toBeUndefined();
  });

  it("11. a 500 for an id missing locally is a 404", async () => {
    respond = async () => ({ ok: false, status: 500 });
    await expect(deleteFile("missing.bin")).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
  });

  it("12. a 500 for an id present locally succeeds (local row removed)", async () => {
    respond = async () => ({ ok: false, status: 500 });
    await expect(deleteFile("file-1")).resolves.toBeUndefined();
    expect(filesCount()).toBe(7);
  });
});
