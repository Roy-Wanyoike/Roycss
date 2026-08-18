/**
 * Storage service — in-memory Roy Storage file + usage store.
 *
 * Mock backend (no DB). Seeds 8 mock files (2.3 GB total used of a
 * 10 GB quota). All reads are LRU-cached; uploading or deleting a file
 * invalidates the file list and usage caches.
 *
 * Future: swap the in-memory arrays for an object storage-backed
 * implementation (S3, R2, GCS) without changing the route layer.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { StorageFile, StorageUsage } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("storage");

const FILES_KEY = "storage:files";
const detailKey = (id: string): string => `storage:file:${id}`;
const USAGE_KEY = "storage:usage";

function invalidate(id?: string): void {
  cache.delete(FILES_KEY);
  cache.delete(USAGE_KEY);
  if (id) cache.delete(detailKey(id));
}

const QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

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

let files: StorageFile[] = SEED_FILES.map((f) => ({ ...f }));

/** List all stored files. Cached. */
export async function listFiles(): Promise<StorageFile[]> {
  return cacheWrap(
    FILES_KEY,
    () => Promise.resolve(files.map((f) => ({ ...f }))),
    CACHE_TTL.storageFiles,
  );
}

/** Get a single file by id. Cached. Throws 404 if missing. */
export async function getFileById(id: string): Promise<StorageFile> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = files.find((f) => f.id === id);
      if (!found) throw AppError.notFound(`Storage file '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.storageFileDetail,
  );
}

/** Storage usage summary. Cached. */
export async function getUsage(): Promise<StorageUsage> {
  return cacheWrap(
    USAGE_KEY,
    () => {
      const used = files.reduce((sum, f) => sum + f.size, 0);
      const byTypeMap = new Map<string, number>();
      for (const f of files) {
        byTypeMap.set(f.type, (byTypeMap.get(f.type) ?? 0) + f.size);
      }
      const byType = [...byTypeMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([type, size]) => ({ type, size }));
      return Promise.resolve({
        used,
        quota: QUOTA_BYTES,
        unit: "bytes",
        fileCount: files.length,
        byType,
      });
    },
    CACHE_TTL.storageUsage,
  );
}

/** Upload a new file. Invalidates file list + usage caches. */
export async function uploadFile(input: {
  name: string;
  type: StorageFile["type"];
  size: number;
  mimeType: string;
}): Promise<StorageFile> {
  const usage = await getUsage();
  if (usage.used + input.size > QUOTA_BYTES) {
    throw AppError.badRequest(
      `Storage quota exceeded: would use ${usage.used + input.size} bytes of ${QUOTA_BYTES} allowed`,
    );
  }
  const id = `file-${randomUUID()}`;
  const file: StorageFile = {
    id,
    name: input.name,
    type: input.type,
    size: input.size,
    mimeType: input.mimeType,
    url: `https://storage.roycss.cloud/files/${id}/${input.name}`,
    uploadedAt: new Date().toISOString(),
  };
  files.push(file);
  invalidate(id);
  log.info("File uploaded", { id, name: file.name, size: file.size });
  return file;
}

/** Delete a file by id. Invalidates file list + usage caches. */
export async function deleteFile(id: string): Promise<void> {
  const before = files.length;
  files = files.filter((f) => f.id !== id);
  if (files.length === before) {
    throw AppError.notFound(`Storage file '${id}' not found`);
  }
  invalidate(id);
  log.info("File deleted", { id });
}

/** Number of files in the store. */
export function filesCount(): number {
  return files.length;
}

/** Test-only: reset to seed. */
export function _resetStorageForTest(): void {
  files = SEED_FILES.map((f) => ({ ...f }));
  invalidate();
}

log.debug("Storage module loaded", { files: SEED_FILES.length });
