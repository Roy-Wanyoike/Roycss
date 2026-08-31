/**
 * Preview routes — /api/v1/preview
 *
 *   POST   /create     spin up a new preview branch deployment
 *   GET    /list       list all preview branches
 *   DELETE /:id        delete a preview branch by id
 *   GET    /:id        single preview by id
 *
 * Order matters: static routes (`/create`, `/list`) are declared before
 * `/:id` so the literal paths aren't captured as an id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  createPreview,
  deletePreview,
  getPreviewById,
  listPreviews,
} from "./service.js";
import { PreviewCreateSchema, PreviewParamsSchema } from "./schema.js";

export const previewRouter = Router();

previewRouter.post(
  "/create",
  validateBody(PreviewCreateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof PreviewCreateSchema>;
    const preview = await createPreview({
      branch: input.branch,
      project: input.project,
      commit: input.commit || undefined,
    });
    res.status(201).json({ data: preview });
  }),
);

previewRouter.get(
  "/list",
  asyncHandler(async (_req, res) => {
    const items = await listPreviews();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

previewRouter.delete(
  "/:id",
  validateParams(PreviewParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof PreviewParamsSchema>;
    await deletePreview(id);
    res.status(204).end();
  }),
);

previewRouter.get(
  "/:id",
  validateParams(PreviewParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof PreviewParamsSchema>;
    const preview = await getPreviewById(id);
    res.json({ data: preview });
  }),
);
