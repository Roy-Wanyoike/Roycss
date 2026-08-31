/**
 * Color-space routes — /api/v1/color-space
 *
 *   POST  /convert       convert a color between spaces
 *   GET   /gamut/:hex    check whether a hex color is in sRGB gamut
 *   GET   /presets       6 preset colors with all 5 representations
 *
 * Order matters: static collection routes are declared before /:hex.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import { checkGamut, convertColor, listPresets } from "./service.js";
import { ColorConvertSchema, HexParamsSchema } from "./schema.js";

export const colorSpaceRouter = Router();

colorSpaceRouter.post(
  "/convert",
  validateBody(ColorConvertSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof ColorConvertSchema>;
    const result = await convertColor(input);
    res.status(201).json({ data: result });
  }),
);

colorSpaceRouter.get(
  "/gamut/:hex",
  validateParams(HexParamsSchema),
  asyncHandler(async (req, res) => {
    const { hex } = req.params as unknown as z.infer<typeof HexParamsSchema>;
    const result = await checkGamut(hex);
    res.json({ data: result });
  }),
);

colorSpaceRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);
