/**
 * Scope routes — /api/v1/scope
 *
 *   POST  /analyze    analyze a @scope rule against a DOM tree
 *   GET   /presets    4 scope presets
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { analyzeScope, listPresets } from "./service.js";
import { ScopeAnalyzeSchema } from "./schema.js";

export const scopeRouter = Router();

scopeRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

scopeRouter.post(
  "/analyze",
  validateBody(ScopeAnalyzeSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof ScopeAnalyzeSchema>;
    const result = await analyzeScope(input);
    res.status(201).json({ data: result });
  }),
);
