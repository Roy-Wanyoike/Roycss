/**
 * Blocks routes — /api/v1/blocks
 *
 *   GET   /                list all application blocks
 *   GET   /:id             single block by id
 *   GET   /categories      list all block categories
 *   POST  /                create a new block (auth: Bearer token)
 *
 * Mutating routes require authentication (issue #64) — blocks persist
 * to the `Block` Prisma model.
 *
 * Order matters: static collection routes are declared before /:id.
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
  createBlock,
  getBlockById,
  listBlockCategories,
  listBlocks,
} from "./service.js";
import { BlockCreateSchema, IdParamsSchema } from "./schema.js";

export const blocksRouter = Router();

blocksRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const items = await listBlockCategories();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

blocksRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await listBlocks();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

blocksRouter.post(
  "/",
  requireAuth,
  validateBody(BlockCreateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof BlockCreateSchema>;
    const block = await createBlock(input);
    res.status(201).json({ data: block });
  }),
);

blocksRouter.get(
  "/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const block = await getBlockById(id);
    res.json({ data: block });
  }),
);
