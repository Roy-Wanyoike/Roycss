/**
 * Logical-properties routes — /api/v1/logical-properties
 *
 *   GET   /mapping    full physical → logical mapping table (28 entries)
 *   POST  /convert    convert physical CSS to logical
 *   GET   /presets    4 logical-property presets
 *
 * Order matters: static collection routes are declared before /:id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody } from "../../server/middleware/validate.js";
import { convertPhysical, getMapping, listPresets } from "./service.js";
import { LogicalConvertSchema } from "./schema.js";

export const logicalPropertiesRouter = Router();

logicalPropertiesRouter.get(
  "/mapping",
  asyncHandler(async (_req, res) => {
    const items = await getMapping();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

logicalPropertiesRouter.get(
  "/presets",
  asyncHandler(async (_req, res) => {
    const items = await listPresets();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

logicalPropertiesRouter.post(
  "/convert",
  validateBody(LogicalConvertSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof LogicalConvertSchema>;
    const result = await convertPhysical(input);
    res.status(201).json({ data: result });
  }),
);
