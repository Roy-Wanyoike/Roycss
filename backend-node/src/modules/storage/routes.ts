/**
 * Storage routes — /api/v1/storage
 *
 *   GET    /files         list the caller's own files
 *   POST   /upload        record a new file upload (attributed to the caller)
 *   GET    /usage         storage usage over the caller's own files
 *   GET    /files/:id     one of the caller's files
 *   DELETE /files/:id     delete one of the caller's files
 *
 * ALL routes require authentication (issue #64) and are OWNER-SCOPED
 * (issue #268 — storage IDOR): reads only ever return rows attributed
 * to the caller, and DELETE only touches the caller's own objects.
 * Foreign and unknown ids read as the same flat 404 (the
 * collections/favorites convention), and ownerless objects (legacy seed
 * rows, out-of-band bucket keys) are deletable only by a platform ADMIN
 * — the route resolves `hasPlatformRole("ADMIN")` (the boolean form of
 * requirePlatformRole) and the service enforces the decision. Uploads
 * persist the creator in the Prisma `StorageFileOwner` map so deletion
 * rights survive restarts.
 *
 * The global 10 GB quota is unchanged (issue #268): uploads still count
 * against the platform-wide store, not per-owner usage.
 *
 * Order matters: static routes (`/files`, `/upload`, `/usage`) are
 * declared before `/files/:id` so the literal paths aren't captured
 * as an id.
 */
import { Router } from "express";
import type { z } from "zod";

import { requireAuth, hasPlatformRole } from "../../server/middleware/auth.js";
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
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await listFiles(req.user!.sub);
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
      // Owner attribution — the authenticated caller (issue #268).
      ownerId: req.user!.sub,
    });
    res.status(201).json({ data: file });
  }),
);

storageRouter.get(
  "/usage",
  requireAuth,
  asyncHandler(async (req, res) => {
    const usage = await getUsage(req.user!.sub);
    res.json({ data: usage });
  }),
);

storageRouter.get(
  "/files/:id",
  requireAuth,
  validateParams(StorageFileParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof StorageFileParamsSchema
    >;
    const file = await getFileById(id, req.user!.sub);
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
    // Owner-scoped with an admin escape hatch for ownerless legacy rows
    // (issue #268). The service turns any denial into the same flat 404,
    // so the role check here never leaks WHICH case denied the request.
    const isPlatformAdmin = await hasPlatformRole(req.user!.sub, "ADMIN");
    await deleteFile(id, { sub: req.user!.sub, isPlatformAdmin });
    res.status(204).end();
  }),
);
