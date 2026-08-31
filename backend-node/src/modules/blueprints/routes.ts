/**
 * Blueprints routes — /api/v1/blueprints
 *
 *   GET   /                       list all blueprints
 *   GET   /:id                    single blueprint by id
 *   GET   /:id/architecture       full architecture doc for a blueprint
 *   GET   /industries             list all blueprint industries
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateParams } from "../../server/middleware/validate.js";
import {
  getBlueprintArchitecture,
  getBlueprintById,
  listBlueprintIndustries,
  listBlueprints,
} from "./service.js";
import { IdParamsSchema } from "./schema.js";

export const blueprintsRouter = Router();

blueprintsRouter.get(
  "/industries",
  asyncHandler(async (_req, res) => {
    const items = await listBlueprintIndustries();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

blueprintsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const items = await listBlueprints();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

blueprintsRouter.get(
  "/:id",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const blueprint = await getBlueprintById(id);
    res.json({ data: blueprint });
  }),
);

blueprintsRouter.get(
  "/:id/architecture",
  validateParams(IdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof IdParamsSchema>;
    const architecture = await getBlueprintArchitecture(id);
    res.json({ data: architecture });
  }),
);
