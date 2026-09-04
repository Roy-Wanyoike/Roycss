/**
 * Storage routes — /api/v1/storage
 *
 *   GET    /files         list all stored files
 *   POST   /upload        record a new file upload (auth: Bearer token)
 *   GET    /usage         storage usage summary
 *   GET    /files/:id     single file by id
 *   DELETE /files/:id     delete a file by id     (auth: Bearer token)
 *
 * Mutating routes require authentication (issue #64) — uploads write
 * to S3/Supabase storage when configured (in-memory otherwise), and
 * unauthenticated writes would bypass the quota model.
 *
 * Order matters: static routes (`/files`, `/upload`, `/usage`) are
 * declared before `/files/:id` so the literal paths aren't captured
 * as an id.
 */
import { Router } from "express";
import type { z } from "zod";

import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  deleteFile,
  getFileById,
  getUsage,
  listFiles,
  uploadFile,
} from "./service.js";
import { StorageFileParamsSchema, StorageUploadSchema } from "./schema.js";

export const storageRouter = Router();

storageRouter.get(
  "/files",
  asyncHandler(async (_req, res) => {
    const items = await listFiles();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

storageRouter.post(
  "/upload",
  requireAuth,
  validateBody(StorageUploadSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof StorageUploadSchema>;
    const file = await uploadFile({
      name: input.name,
      type: input.type,
      size: input.size,
      mimeType: input.mimeType,
    });
    res.status(201).json({ data: file });
  }),
);

storageRouter.get(
  "/usage",
  asyncHandler(async (_req, res) => {
    const usage = await getUsage();
    res.json({ data: usage });
  }),
);

storageRouter.get(
  "/files/:id",
  validateParams(StorageFileParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof StorageFileParamsSchema
    >;
    const file = await getFileById(id);
    res.json({ data: file });
  }),
);

storageRouter.delete(
  "/files/:id",
  requireAuth,
  validateParams(StorageFileParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof StorageFileParamsSchema
    >;
    await deleteFile(id);
    res.status(204).end();
  }),
);
