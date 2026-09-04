/**
 * Inspector routes — /api/v1/inspector
 *
 *   GET  /checks   catalog of inspection checks (id, title, category, description)
 *   GET  /analyze  lint a CSS snippet — query: ?css=<encodeURIComponent(snippet)>
 *   GET  /health   module health (read-only, no DB dependency)
 *
 * Read-only by design: NO POST/PUT/DELETE routes. The inspector is a
 * stateless analyzer — a writable surface would only expand the auth
 * and rate-limit attack surface for zero benefit.
 *
 * Order matters: static routes only (no param routes, so no shadowing).
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import { validateQuery } from "../../server/middleware/validate.js";
import { analyzeCss, inspectorHealth, listChecks } from "./service.js";
import { InspectorAnalyzeQuerySchema } from "./schema.js";

export const inspectorRouter = Router();

inspectorRouter.get(
  "/checks",
  asyncHandler(async (_req, res) => {
    const items = await listChecks();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

inspectorRouter.get(
  "/analyze",
  validateQuery(InspectorAnalyzeQuerySchema),
  asyncHandler(async (req, res) => {
    const { css } = req.query as unknown as z.infer<
      typeof InspectorAnalyzeQuerySchema
    >;
    const result = await analyzeCss(css);
    res.json({ data: result, meta: { count: result.findings.length } });
  }),
);

inspectorRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    res.json({ data: inspectorHealth() });
  }),
);
