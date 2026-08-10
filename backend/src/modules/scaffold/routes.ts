/**
 * Scaffold routes — /api/v1/scaffold
 *
 *   POST  /generate       generate a project scaffold (mock)
 *   GET   /types          list all project types
 *   GET   /types/:id      single project type by id
 *   GET   /frameworks     list all scaffold frameworks
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
  generateScaffold,
  getTypeById,
  listFrameworks,
  listTypes,
} from "./service.js";
import { ScaffoldGenerateSchema, ScaffoldParamsSchema } from "./schema.js";

export const scaffoldRouter = Router();

scaffoldRouter.post(
  "/generate",
  validateBody(ScaffoldGenerateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof ScaffoldGenerateSchema
    >;
    const result = await generateScaffold(input);
    res.status(201).json({ data: result });
  }),
);

scaffoldRouter.get(
  "/types",
  asyncHandler(async (_req, res) => {
    const items = await listTypes();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

scaffoldRouter.get(
  "/frameworks",
  asyncHandler(async (_req, res) => {
    const items = await listFrameworks();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

scaffoldRouter.get(
  "/types/:id",
  validateParams(ScaffoldParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof ScaffoldParamsSchema
    >;
    const item = await getTypeById(id);
    res.json({ data: item });
  }),
);
