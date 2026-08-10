/**
 * Text-wrap routes — /api/v1/text-wrap
 *
 *   POST  /analyze    analyze text wrapping for given properties + sample text
 *   GET   /presets    6 text-wrap presets
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { analyzeTextWrap, listPresets } from "./service.js";
import { TextWrapAnalyzeSchema } from "./schema.js";

export const textWrapRouter = Router();

textWrapRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

textWrapRouter.post(
  "/analyze",
  validateBody(TextWrapAnalyzeSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof TextWrapAnalyzeSchema>;
    const result = await analyzeTextWrap(input);
    res.status(201).json({ data: result });
  }),
);
