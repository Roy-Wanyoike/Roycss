/**
 * Generator routes — /api/v1/generator
 *
 *   POST  /generate            generate code (mock)
 *   GET   /types               list all generation types
 *   GET   /templates/:type     list templates for a generation type
 *
 * Order matters: static collection routes are declared before /:param.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  generateCode,
  listTemplatesForType,
  listTypes,
} from "./service.js";
import { GenerateCodeSchema, GeneratorParamsSchema } from "./schema.js";

export const generatorRouter = Router();

generatorRouter.get(
  "/types",
  asyncHandler(async (_req, res) => {
    const items = await listTypes();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

generatorRouter.post(
  "/generate",
  validateBody(GenerateCodeSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof GenerateCodeSchema>;
    const result = await generateCode(input);
    res.status(201).json({ data: result });
  }),
);

generatorRouter.get(
  "/templates/:type",
  validateParams(GeneratorParamsSchema),
  asyncHandler(async (req, res) => {
    const { type } = req.params as unknown as z.infer<
      typeof GeneratorParamsSchema
    >;
    const items = await listTemplatesForType(type);
    res.json({ data: items, meta: { count: items.length } });
  }),
);
