/**
 * Property-registrar routes — /api/v1/property-registrar
 *
 *   POST  /generate   generate a @property (CSS Houdini) rule
 *   GET   /syntaxes   list all 11 CSS syntax strings with descriptions
 *   GET   /presets    4 @property presets
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { generateProperty, listPresets, listSyntaxes } from "./service.js";
import { PropertyRegistrarGenerateSchema } from "./schema.js";

export const propertyRegistrarRouter = Router();

propertyRegistrarRouter.get(
  "/syntaxes",
  asyncHandler(async (_req, res) => {
    const items = await listSyntaxes();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

propertyRegistrarRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

propertyRegistrarRouter.post(
  "/generate",
  validateBody(PropertyRegistrarGenerateSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof PropertyRegistrarGenerateSchema
    >;
    const result = await generateProperty(input);
    res.status(201).json({ data: result });
  }),
);
