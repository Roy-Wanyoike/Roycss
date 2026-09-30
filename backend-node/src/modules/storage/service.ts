/**
 * Storage service — Roy Storage file + usage store.
 *
 * Backed by an S3-compatible object store (AWS S3, Cloudflare R2,
 * MinIO, Backblaze B2, …) when `STORAGE_ENDPOINT`, `STORAGE_BUCKET`,
 * `STORAGE_ACCESS_KEY_ID`, and `STORAGE_SECRET_ACCESS_KEY` are all
 * configured. The service signs requests with AWS Signature V4 (built
 * from `node:crypto` — no AWS SDK) and uses `fetch` for transport.
 *
 * When any of those env vars is unset, a deterministic in-memory mock
 * store is used — same signature, same downstream cache keys.
 *
 * The StorageFile id is the S3 object key when configured (or a
 * synthesized `file-<uuid>` for the mock path). Public type signatures
 * are unchanged regardless of which path is active.
 *
 * ─── Ownership model (issue #268 — storage IDOR) ─────────────────────
 * Every upload is attributed to the authenticated caller (`ownerId`,
 * required at the service boundary — the route passes `req.user.sub`).
 * Ownership is the ONE durable fact the module persists: the Prisma
 * `StorageFileOwner` map (id → ownerId) so deletion rights survive
 * process restarts; the in-memory rows carry it denormalized for the
 * fast path. Authorization rules:
 *
 *   - READS (list / usage / detail) are owner-scoped — the caller only
 *     ever sees rows attributed to them. Ownerless rows (the 8 seeded
 *     legacy files, bucket keys created out-of-band) are invisible
 *     through the API and read as flat 404s on detail.
 *   - DELETE is owner-scoped with a flat 404 for foreign ids; ownerless
 *     objects may only be deleted by a platform ADMIN (the caller
 *     resolves via `hasPlatformRole` — the boolean form of
 *     `requirePlatformRole`).
 *
 * The global 10 GB quota is unchanged (issue #268 tests pin it): the
 * quota check still accounts for the whole store, not per-owner usage.
 */
import { randomUUID, createHmac, createHash } from "node:crypto";

import { db } from "../../lib/db.js";
import { env } from "../../config/env.js";
import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { StorageFile, StorageUsage } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("storage");

/** True iff every required STORAGE_* env var is set. */
export const isStorageConfigured: boolean = Boolean(
  env.STORAGE_ENDPOINT &&
    env.STORAGE_BUCKET &&
    env.STORAGE_ACCESS_KEY_ID &&
    env.STORAGE_SECRET_ACCESS_KEY,
);

const FILES_KEY = "storage:files";
const detailKey = (id: string): string => `storage:file:${id}`;
const USAGE_KEY = "storage:usage";

function invalidate(id?: string): void {
  cache.delete(FILES_KEY);
  cache.delete(USAGE_KEY);
  if (id) cache.delete(detailKey(id));
}

const QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

/** Internal catalog row — the public StorageFile shape plus the owner
 *  attribution (`null` for legacy/seed rows and out-of-band objects).
 *  `ownerId` is stripped from every API response (toPublicFile). */
interface StoredFile extends StorageFile {
  ownerId: string | null;
}

/** Strip the internal owner attribution from a row for API responses. */
function toPublicFile(f: StoredFile): StorageFile {
  const { ownerId: _ownerId, ...publicFile } = f;
  return publicFile;
}

// ─── Seed: 8 files (totals ~2.3 GB) ──────────────────────────────────────
const SEED_FILES: StorageFile[] = [
  {
    id: "file-1",
    name: "hero-bg.png",
    type: "image",
    size: 1_245_184, // ~1.2 MB
    mimeType: "image/png",
    url: "https://storage.roycss.cloud/files/file-1/hero-bg.png",
    uploadedAt: "2025-02-26T10:00:00.000Z",
  },
  {
    id: "file-2",
    name: "intro-video.mp4",
    type: "video",
    size: 1_610_612_736, // ~1.5 GB
    mimeType: "video/mp4",
    url: "https://storage.roycss.cloud/files/file-2/intro-video.mp4",
    uploadedAt: "2025-02-24T14:30:00.000Z",
  },
  {
    id: "file-3",
    name: "whitepaper.pdf",
    type: "document",
    size: 4_812_004, // ~4.6 MB
    mimeType: "application/pdf",
    url: "https://storage.roycss.cloud/files/file-3/whitepaper.pdf",
    uploadedAt: "2025-02-22T09:15:00.000Z",
  },
  {
    id: "file-4",
    name: "brand-guide.mp3",
    type: "audio",
    size: 8_402_880, // ~8 MB
    mimeType: "audio/mpeg",
    url: "https://storage.roycss.cloud/files/file-4/brand-guide.mp3",
    uploadedAt: "2025-02-20T11:00:00.000Z",
  },
  {
    id: "file-5",
    name: "team-photo.jpg",
    type: "image",
    size: 2_488_320, // ~2.4 MB
    mimeType: "image/jpeg",
    url: "https://storage.roycss.cloud/files/file-5/team-photo.jpg",
    uploadedAt: "2025-02-18T16:00:00.000Z",
  },
  {
    id: "file-6",
    name: "fonts-bundle.zip",
    type: "archive",
    size: 18_874_368, // ~18 MB
    mimeType: "application/zip",
    url: "https://storage.roycss.cloud/files/file-6/fonts-bundle.zip",
    uploadedAt: "2025-02-15T08:00:00.000Z",
  },
  {
    id: "file-7",
    name: "icons-sprite.svg",
    type: "image",
    size: 142_848, // ~140 KB
    mimeType: "image/svg+xml",
    url: "https://storage.roycss.cloud/files/file-7/icons-sprite.svg",
    uploadedAt: "2025-02-12T13:30:00.000Z",
  },
  {
    id: "file-8",
    name: "tutorial.mp4",
    type: "video",
    size: 712_615_936, // ~680 MB
    mimeType: "video/mp4",
    url: "https://storage.roycss.cloud/files/file-8/tutorial.mp4",
    uploadedAt: "2025-02-10T18:45:00.000Z",
  },
];

let files: StoredFile[] = SEED_FILES.map((f) => ({ ...f, ownerId: null }));

/**
 * Resolve the owner of a storage object: the in-memory catalog first
 * (fast path), the durable `StorageFileOwner` map second (catalog rows
 * vanish on restart; S3 bucket keys are listed, not stored). `null` =
 * ownerless (legacy seed rows, out-of-band bucket keys, unknown ids).
 */
async function resolveOwnerId(id: string): Promise<string | null> {
  const row = files.find((f) => f.id === id);
  if (row && row.ownerId !== null) return row.ownerId;
  const tracked = await db.storageFileOwner.findUnique({ where: { id } });
  return tracked?.ownerId ?? null;
}

/**
 * Ownership gate (issue #268): anything the caller does not own reads
 * as the SAME flat 404 as a missing id — never a 403, so ids don't leak
 * (the collections/favorites convention).
 */
function requireOwned(id: string, ownerId: string | null, callerId: string): void {
  if (ownerId !== callerId) {
    throw AppError.notFound(`Storage file '${id}' not found`);
  }
}

/** Best-effort cleanup of the durable owner row after a successful
 *  deletion (a stale row would only ever over-grant to a dead id). */
async function deleteOwnerRow(id: string): Promise<void> {
  try {
    await db.storageFileOwner.deleteMany({ where: { id } });
  } catch (err) {
    log.warn("Storage owner-row cleanup failed", {
      id,
      err: (err as Error).message,
    });
  }
}

// ─── AWS SigV4 signer (no SDK — pure node:crypto) ──────────────────────────

const SIG_SERVICE = "s3";
const SIG_VERSION = "AWS4-HMAC-SHA256";

function hmacSha256(key: Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}
function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** Build an AWS SigV4-signed Authorization header for a single S3 request. */
function signV4(opts: {
  method: string;
  url: URL;
  bodySha256Hex: string;
  amzDate: string;
  dateStamp: string;
}): string {
  const accessKey = env.STORAGE_ACCESS_KEY_ID ?? "";
  const secretKey = env.STORAGE_SECRET_ACCESS_KEY ?? "";
  const region = env.STORAGE_REGION || "auto";

  // Canonical headers (must be sorted by header name, lowercase, trimmed).
  const host = opts.url.hostname;
  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": opts.bodySha256Hex,
    "x-amz-date": opts.amzDate,
  };
  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders =
    sortedHeaderNames.map((n) => `${n}:${headers[n]!.trim()}\n`).join("");
  const signedHeaders = sortedHeaderNames.join(";");

  // Canonical request.
  const canonicalUri = opts.url.pathname || "/";
  const canonicalQuery = opts.url.search
    ? opts.url.search.replace(/^\?/, "")
    : "";
  const canonicalRequest = [
    opts.method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    opts.bodySha256Hex,
  ].join("\n");

  // String to sign.
  const credentialScope = `${opts.dateStamp}/${region}/${SIG_SERVICE}/aws4_request`;
  const stringToSign = [
    SIG_VERSION,
    opts.amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  // Derived signing key.
  const kDate = hmacSha256(Buffer.from(`AWS4${secretKey}`, "utf8"), opts.dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, SIG_SERVICE);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = hmacSha256(kSigning, stringToSign).toString("hex");

  return (
    `${SIG_VERSION} Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`
  );
}

/** Build a public URL for a given object key (path-style: endpoint/bucket/key). */
function publicUrl(key: string): string {
  const base = (env.STORAGE_ENDPOINT ?? "").replace(/\/$/, "");
  const bucket = env.STORAGE_BUCKET ?? "";
  const safeKey = key.startsWith("/") ? key.slice(1) : key;
  return `${base}/${bucket}/${safeKey}`;
}

interface S3ListEntry {
  key: string;
  size: number;
  lastModified: string;
}

/** S3 ListObjectsV2 — returns parsed contents (or null on failure). */
async function s3List(): Promise<S3ListEntry[] | null> {
  const endpoint = env.STORAGE_ENDPOINT ?? "";
  const bucket = env.STORAGE_BUCKET ?? "";
  if (!endpoint || !bucket) return null;
  const url = new URL(`${endpoint}/${bucket}?list-type=2&max-keys=200`);
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const auth = signV4({
    method: "GET",
    url,
    bodySha256Hex: "UNSIGNED-PAYLOAD",
    amzDate,
    dateStamp,
  });
  try {
    const res = await fetch(url, {
      headers: {
        authorization: auth,
        "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
        "x-amz-date": amzDate,
      },
    });
    if (!res.ok) {
      log.warn("S3 ListObjectsV2 failed", { status: res.status });
      return null;
    }
    const xml = await res.text();
    return parseS3ListXml(xml);
  } catch (err) {
    log.warn("S3 ListObjectsV2 errored", { err: (err as Error).message });
    return null;
  }
}

/** Tiny XML extractor for ListObjectsV2 — pulls <Key>, <Size>, <LastModified>. */
function parseS3ListXml(xml: string): S3ListEntry[] {
  const out: S3ListEntry[] = [];
  const re = /<Contents>([\s\S]*?)<\/Contents>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1] ?? "";
    const key = block.match(/<Key>([^<]+)<\/Key>/)?.[1];
    const size = block.match(/<Size>(\d+)<\/Size>/)?.[1];
    const lm = block.match(/<LastModified>([^<]+)<\/LastModified>/)?.[1];
    if (key) {
      out.push({
        key,
        size: size ? parseInt(size, 10) : 0,
        lastModified: lm ?? new Date().toISOString(),
      });
    }
  }
  return out;
}

/** S3 HeadObject — returns content-length and content-type, or null. */
async function s3Head(
  key: string,
): Promise<{ size: number; mimeType: string } | null> {
  const endpoint = env.STORAGE_ENDPOINT ?? "";
  const bucket = env.STORAGE_BUCKET ?? "";
  if (!endpoint || !bucket) return null;
  const url = new URL(`${endpoint}/${bucket}/${key}`);
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const auth = signV4({
    method: "HEAD",
    url,
    bodySha256Hex: "UNSIGNED-PAYLOAD",
    amzDate,
    dateStamp,
  });
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        authorization: auth,
        "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
        "x-amz-date": amzDate,
      },
    });
    if (!res.ok) return null;
    const size = parseInt(res.headers.get("content-length") ?? "0", 10);
    const mimeType = res.headers.get("content-type") ?? "application/octet-stream";
    return { size, mimeType };
  } catch (err) {
    log.warn("S3 HeadObject errored", { key, err: (err as Error).message });
    return null;
  }
}

/** S3 PutObject — uploads body with the given content type. */
async function s3Put(
  key: string,
  body: string,
  contentType: string,
): Promise<boolean> {
  const endpoint = env.STORAGE_ENDPOINT ?? "";
  const bucket = env.STORAGE_BUCKET ?? "";
  if (!endpoint || !bucket) return false;
  const url = new URL(`${endpoint}/${bucket}/${key}`);
  const bodyHash = sha256Hex(body);
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const auth = signV4({
    method: "PUT",
    url,
    bodySha256Hex: bodyHash,
    amzDate,
    dateStamp,
  });
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        authorization: auth,
        "content-type": contentType,
        "x-amz-content-sha256": bodyHash,
        "x-amz-date": amzDate,
      },
      body,
    });
    if (!res.ok) {
      log.warn("S3 PutObject failed", { status: res.status, key });
      return false;
    }
    return true;
  } catch (err) {
    log.warn("S3 PutObject errored", { key, err: (err as Error).message });
    return false;
  }
}

/** S3 DeleteObject — removes a key from the bucket. */
async function s3Delete(key: string): Promise<boolean> {
  const endpoint = env.STORAGE_ENDPOINT ?? "";
  const bucket = env.STORAGE_BUCKET ?? "";
  if (!endpoint || !bucket) return false;
  const url = new URL(`${endpoint}/${bucket}/${key}`);
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const auth = signV4({
    method: "DELETE",
    url,
    bodySha256Hex: "UNSIGNED-PAYLOAD",
    amzDate,
    dateStamp,
  });
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        authorization: auth,
        "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
        "x-amz-date": amzDate,
      },
    });
    // 204 = deleted; 404 = already gone — both are "ok" from caller's POV.
    return res.ok || res.status === 404;
  } catch (err) {
    log.warn("S3 DeleteObject errored", { key, err: (err as Error).message });
    return false;
  }
}

/** Map an S3 entry into the StorageFile shape (synthesize id from key). */
function s3EntryToStorageFile(entry: S3ListEntry): StorageFile {
  return {
    id: entry.key,
    name: entry.key.split("/").pop() ?? entry.key,
    type: mimeTypeToType(entry.key),
    size: entry.size,
    mimeType: guessMimeType(entry.key),
    url: publicUrl(entry.key),
    uploadedAt: entry.lastModified,
  };
}

/** Best-effort MIME type guess from a file extension. */
function guessMimeType(name: string): string {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    pdf: "application/pdf",
    zip: "application/zip",
    json: "application/json",
    css: "text/css",
    js: "application/javascript",
    html: "text/html",
    txt: "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}

/** Map a MIME type (or filename) to the StorageFile type union. */
function mimeTypeToType(name: string): StorageFile["type"] {
  const mime = guessMimeType(name);
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "document";
  if (mime === "application/zip") return "archive";
  return "other";
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * List stored files.
 *
 *   - WITH `ownerId` (the only form routes may call — issue #268): the
 *     caller's own catalog rows, uncached (an in-memory filter is
 *     cheaper than a per-owner cache key). Ownerless rows are never
 *     included. In S3 mode this is the caller's API uploads — the
 *     bucket inventory itself is platform infrastructure and is not
 *     exposed per-user.
 *   - WITHOUT `ownerId`: the FULL inventory (S3 ListObjectsV2 when
 *     configured, else the catalog). Module-internal ONLY — the quota
 *     check in uploadFile consumes it; no route may call this form.
 */
export async function listFiles(ownerId?: string): Promise<StorageFile[]> {
  if (ownerId !== undefined) {
    const owned = files
      .filter((f) => f.ownerId === ownerId)
      .map(toPublicFile);
    return owned;
  }
  return cacheWrap(
    FILES_KEY,
    async () => {
      if (isStorageConfigured) {
        const entries = await s3List();
        if (entries) {
          return entries.map(s3EntryToStorageFile);
        }
        // S3 call failed — fall through to mock.
      }
      return files.map((f) => ({ ...f }));
    },
    CACHE_TTL.storageFiles,
  );
}

/**
 * Get a single file by id, owner-scoped (issue #268): the caller must
 * own the row (in-memory catalog or the durable StorageFileOwner map) —
 * foreign, ownerless, and unknown ids all read as the same flat 404
 * BEFORE any S3 transport is touched. Cached (the ownership gate runs
 * ahead of the cache; the cached row itself is owner-independent).
 */
export async function getFileById(
  id: string,
  ownerId: string,
): Promise<StorageFile> {
  requireOwned(id, await resolveOwnerId(id), ownerId);
  return cacheWrap(
    detailKey(id),
    async () => {
      if (isStorageConfigured) {
        const head = await s3Head(id);
        if (head) {
          return {
            id,
            name: id.split("/").pop() ?? id,
            type: mimeTypeToType(id),
            size: head.size,
            mimeType: head.mimeType,
            url: publicUrl(id),
            uploadedAt: new Date().toISOString(),
          };
        }
        // HeadObject failed — fall through to mock lookup.
      }
      const found = files.find((f) => f.id === id);
      if (!found) throw AppError.notFound(`Storage file '${id}' not found`);
      return toPublicFile(found);
    },
    CACHE_TTL.storageFileDetail,
  );
}

/**
 * Storage usage summary.
 *
 *   - WITH `ownerId` (routes): usage over the caller's own files. The
 *     quota constant stays the platform-wide 10 GB — per-user quotas
 *     are explicitly out of scope (issue #268 pins quota behavior).
 *   - WITHOUT `ownerId`: GLOBAL usage over the whole store (cached).
 *     Module-internal ONLY — the uploadFile quota check consumes it;
 *     no route may call this form.
 */
export async function getUsage(ownerId?: string): Promise<StorageUsage> {
  if (ownerId !== undefined) {
    const list = await listFiles(ownerId);
    return summarizeUsage(list);
  }
  return cacheWrap(
    USAGE_KEY,
    async () => {
      const list = await listFiles();
      return summarizeUsage(list);
    },
    CACHE_TTL.storageUsage,
  );
}

/** Aggregate a file list into the StorageUsage shape (shared by the
 *  global + owner-scoped paths). */
function summarizeUsage(list: StorageFile[]): StorageUsage {
  const used = list.reduce((sum, f) => sum + f.size, 0);
  const byTypeMap = new Map<string, number>();
  for (const f of list) {
    byTypeMap.set(f.type, (byTypeMap.get(f.type) ?? 0) + f.size);
  }
  const byType = [...byTypeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, size]) => ({ type, size }));
  return {
    used,
    quota: QUOTA_BYTES,
    unit: "bytes",
    fileCount: list.length,
    byType,
  };
}

/** Upload a new file, attributed to `ownerId` (required — issue #268;
 *  the route passes the Bearer-JWT `sub`). Invalidates file list + usage
 *  caches. When S3 is configured, also PUTs the metadata as a JSON
 *  manifest so the upload is durable (the route layer only sends
 *  metadata, no body). The owner row is persisted STRICTLY — an upload
 *  that cannot be attributed must not succeed (fail closed). */
export async function uploadFile(input: {
  name: string;
  type: StorageFile["type"];
  size: number;
  mimeType: string;
  ownerId: string;
}): Promise<StorageFile> {
  const usage = await getUsage();
  if (usage.used + input.size > QUOTA_BYTES) {
    throw AppError.badRequest(
      `Storage quota exceeded: would use ${usage.used + input.size} bytes of ${QUOTA_BYTES} allowed`,
    );
  }
  const id = `file-${randomUUID()}`;
  const row: StoredFile = {
    id,
    name: input.name,
    type: input.type,
    size: input.size,
    mimeType: input.mimeType,
    url: isStorageConfigured
      ? publicUrl(id)
      : `https://storage.roycss.cloud/files/${id}/${input.name}`,
    uploadedAt: new Date().toISOString(),
    ownerId: input.ownerId,
  };

  // Keep the local catalog current in both modes — S3 LIST will return
  // the manifest object too, and the in-memory mock list still works.
  files.push(row);

  // Durable ownership (issue #268): the Prisma owner map is the source
  // of truth that lets the creator delete the object after a restart or
  // from another instance. Upsert keeps a collision a no-op rather than
  // a P2002 — the first attribution wins.
  await db.storageFileOwner.upsert({
    where: { id },
    create: { id, ownerId: input.ownerId },
    update: {},
  });

  if (isStorageConfigured) {
    // Record the metadata as a JSON manifest so the bucket has a durable
    // record of the upload (the route layer doesn't ship a file body —
    // only {name, type, size, mimeType}). The manifest carries the owner
    // id too, for out-of-band observability.
    const manifestKey = `${id}.meta.json`;
    const manifest = JSON.stringify({
      id,
      name: input.name,
      type: input.type,
      size: input.size,
      mimeType: input.mimeType,
      uploadedAt: row.uploadedAt,
      ownerId: input.ownerId,
    });
    const ok = await s3Put(manifestKey, manifest, "application/json");
    if (ok) {
      log.info("File uploaded to S3", { id, key: manifestKey });
    } else {
      log.warn("S3 PUT failed — file only in local catalog", { id });
    }
  } else {
    log.info("File uploaded", { id, name: row.name, size: row.size });
  }

  invalidate(id);
  return toPublicFile(row);
}

/**
 * Delete a file by id — AUTHORIZED (issue #268): the caller must own the
 * object; ownerless objects (legacy seed rows, out-of-band bucket keys)
 * are deletable only by a platform ADMIN (`hasPlatformRole("ADMIN")`,
 * resolved by the route). Foreign and unauthorized ids read as the SAME
 * flat 404 as a missing id. Invalidates file list + usage caches.
 */
export async function deleteFile(
  id: string,
  caller: { sub: string; isPlatformAdmin: boolean },
): Promise<void> {
  // Authorization BEFORE any destructive transport call.
  const ownerId = await resolveOwnerId(id);
  if (ownerId !== caller.sub) {
    // Foreign-owned AND ownerless both land here: owners pass, admins
    // pass for ownerless rows, everyone else gets the flat 404.
    if (!(ownerId === null && caller.isPlatformAdmin)) {
      throw AppError.notFound(`Storage file '${id}' not found`);
    }
  }

  const before = files.length;
  files = files.filter((f) => f.id !== id);
  const existedLocally = files.length < before;

  if (isStorageConfigured) {
    // Try S3 DELETE on the id directly (it's the S3 key when configured).
    const ok = await s3Delete(id);
    if (!ok && !existedLocally) {
      throw AppError.notFound(`Storage file '${id}' not found`);
    }
    log.info("File deleted from S3", { id, actor: caller.sub });
  } else if (!existedLocally) {
    throw AppError.notFound(`Storage file '${id}' not found`);
  } else {
    log.info("File deleted", { id, actor: caller.sub });
  }

  await deleteOwnerRow(id);
  invalidate(id);
}

/** Number of files in the store. */
export function filesCount(): number {
  return files.length;
}

/** Test-only: reset to seed. */
export function _resetStorageForTest(): void {
  files = SEED_FILES.map((f) => ({ ...f, ownerId: null }));
  invalidate();
}

/** Test-only: stage an owned row in the local catalog without the
 *  quota check or the DB write (lets the S3-path tests exercise the
 *  ownership gate against arbitrary bucket keys). */
export function _stageOwnedRowForTest(row: {
  id: string;
  ownerId: string;
  name: string;
}): void {
  files.push({
    id: row.id,
    name: row.name,
    type: mimeTypeToType(row.name),
    size: 1,
    mimeType: guessMimeType(row.name),
    url: isStorageConfigured
      ? publicUrl(row.id)
      : `https://storage.roycss.cloud/files/${row.id}/${row.name}`,
    uploadedAt: new Date().toISOString(),
    ownerId: row.ownerId,
  });
  invalidate(row.id);
}

log.debug("Storage module loaded", {
  files: SEED_FILES.length,
  s3Configured: isStorageConfigured,
});
