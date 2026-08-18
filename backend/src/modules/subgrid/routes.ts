/**
 * Subgrid routes — /api/v1/subgrid
 *
 *   POST  /generate   generate subgrid CSS from parent + child config
 *   GET   /presets    4 subgrid presets
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { generateSubgrid, listPresets } from "./service.js";
import { SubgridGenerateSchema } from "./schema.js";

export const subgridRouter = Router();

subgridRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

subgridRouter.post(
  "/generate",
  validateBody(SubgridGenerateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof SubgridGenerateSchema>;
    const result = await generateSubgrid(input);
    res.status(201).json({ data: result });
  }),
);
