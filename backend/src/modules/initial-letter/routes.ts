/**
 * Initial-letter routes — /api/v1/initial-letter
 *
 *   POST  /generate   generate ::first-letter CSS for a drop cap
 *   GET   /presets    6 drop-cap presets
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { generateInitialLetter, listPresets } from "./service.js";
import { InitialLetterGenerateSchema } from "./schema.js";

export const initialLetterRouter = Router();

initialLetterRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

initialLetterRouter.post(
  "/generate",
  validateBody(InitialLetterGenerateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof InitialLetterGenerateSchema
    >;
    const result = await generateInitialLetter(input);
    res.status(201).json({ data: result });
  }),
);
