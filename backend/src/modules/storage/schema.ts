/**
 * Zod schemas for the storage module.
 *
 * Defines the upload-payload shape and the route params for /files/:id.
 * The `StorageFile`/`StorageUsage` domain types live in
 * `../../types/index.ts`.
 */
import { z } from "zod";

/** Route params for /storage/files/:id. */
export const StorageFileParamsSchema = z.object({
  id: z.string().min(1),
});

const STORAGE_FILE_TYPES = z.enum([
  "image",
  "video",
  "document",
  "audio",
  "archive",
  "other",
]);

/** Body for POST /storage/upload — record a new file upload. */
export const StorageUploadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name is required")
    .max(255, "name must be at most 255 characters"),
  type: STORAGE_FILE_TYPES,
  size: z
    .number()
    .int("size must be an integer")
    .min(0, "size must be >= 0")
    .max(10 * 1024 * 1024 * 1024, "size must be <= 10GB"),
  mimeType: z
    .string()
    .trim()
    .min(1, "mimeType is required")
    .max(100, "mimeType must be at most 100 characters"),
});
export type StorageUploadInput = z.infer<typeof StorageUploadSchema>;
