/**
 * Architect routes — /api/v1/architect
 *
 *   POST  /generate        kick off an architecture generation (mock)
 *   GET   /templates       list all architecture templates
 *   GET   /templates/:id   single template by id
 *   GET   /results/:id     single generation result by id
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  generateArchitecture,
  getResultById,
  getTemplateById,
  listTemplates,
} from "./service.js";
import {
  ArchitectureParamsSchema,
  GenerateArchitectureSchema,
} from "./schema.js";

export const architectRouter = Router();

architectRouter.get(
  "/templates",
  asyncHandler(async (_req, res) => {
    const items = await listTemplates();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

architectRouter.post(
  "/generate",
  validateBody(GenerateArchitectureSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof GenerateArchitectureSchema
    >;
    const result = await generateArchitecture(input);
    res.status(201).json({ data: result });
  }),
);

architectRouter.get(
  "/templates/:id",
  validateParams(ArchitectureParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof ArchitectureParamsSchema
    >;
    const template = await getTemplateById(id);
    res.json({ data: template });
  }),
);

architectRouter.get(
  "/results/:id",
  validateParams(ArchitectureParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof ArchitectureParamsSchema
    >;
    const result = await getResultById(id);
    res.json({ data: result });
  }),
);
