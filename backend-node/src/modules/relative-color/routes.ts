/**
 * Relative-color routes — /api/v1/relative-color
 *
 *   POST  /derive     derive a color from source + output space + calc expressions
 *   GET   /channels   14-channel reference table (r,g,b,h,s,l,c,a,b,alpha,w,x,y,z)
 *   GET   /presets    6 relative-color presets
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { deriveRelativeColor, listChannels, listPresets } from "./service.js";
import { RelativeColorDeriveSchema } from "./schema.js";

export const relativeColorRouter = Router();

relativeColorRouter.get(
  "/channels",
  asyncHandler(async (_req, res) => {
    const items = await listChannels();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

relativeColorRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

relativeColorRouter.post(
  "/derive",
  validateBody(RelativeColorDeriveSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof RelativeColorDeriveSchema
    >;
    const result = await deriveRelativeColor(input);
    res.status(201).json({ data: result });
  }),
);
