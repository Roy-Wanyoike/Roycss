/**
 * DevTools routes — /api/v1/devtools
 *
 *   GET   /inspect       inspect a URL (query: ?url=...) → CSS classes found
 *   GET   /tokens        design token catalog
 *   GET   /utilities     utility class list
 *   POST  /analyze       analyze a page's CSS usage (body: { url, maxIssues })
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateBody, validateQuery } from "../../server/middleware/validate.js";
import { analyzePage, getTokens, getUtilities, inspectUrl } from "./service.js";
import { AnalyzePageSchema, InspectQuerySchema } from "./schema.js";

export const devtoolsRouter = Router();

devtoolsRouter.get(
  "/inspect",
  validateQuery(InspectQuerySchema),
  asyncHandler(async (req, res) => {
    const { url } = req.query as unknown as z.infer<typeof InspectQuerySchema>;
    const result = await inspectUrl(url);
    res.json({ data: result });
  }),
);

devtoolsRouter.get(
  "/tokens",
  asyncHandler(async (_req, res) => {
    const tokens = await getTokens();
    res.json({ data: tokens, meta: { count: tokens.length } });
  }),
);

devtoolsRouter.get(
  "/utilities",
  asyncHandler(async (_req, res) => {
    const utilities = await getUtilities();
    res.json({ data: utilities, meta: { count: utilities.length } });
  }),
);

devtoolsRouter.post(
  "/analyze",
  validateBody(AnalyzePageSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof AnalyzePageSchema>;
    const result = await analyzePage(input);
    res.json({ data: result });
  }),
);
