/**
 * Inspector routes — /api/v1/inspector
 *
 *   GET   /classes         list all RoyCSS classes (roycss-*)
 *   GET   /classes/:name   single class details
 *   GET   /effects         inspectable effects (curated subset)
 *   POST  /scan            scan a page URL → found classes
 *
 * Order matters: /effects and /classes are declared before /classes/:name
 * so the literal paths aren't captured as a class name.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody, validateParams } from "../../server/middleware/validate.js";
import {
  getClassByName,
  listClasses,
  listEffects,
  scanPage,
} from "./service.js";
import { ClassNameParamsSchema, ScanPageSchema } from "./schema.js";

export const inspectorRouter = Router();

inspectorRouter.get(
  "/classes",
  asyncHandler(async (_req, res) => {
    const items = await listClasses();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

inspectorRouter.get(
  "/effects",
  asyncHandler(async (_req, res) => {
    const items = await listEffects();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

inspectorRouter.get(
  "/classes/:name",
  validateParams(ClassNameParamsSchema),
  asyncHandler(async (req, res) => {
    const { name } = req.params as unknown as z.infer<
      typeof ClassNameParamsSchema
    >;
    const cls = await getClassByName(name);
    res.json({ data: cls });
  }),
);

inspectorRouter.post(
  "/scan",
  validateBody(ScanPageSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof ScanPageSchema>;
    const result = await scanPage(input);
    res.json({ data: result });
  }),
);
