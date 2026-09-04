/**
 * Compliance routes — /api/v1/compliance
 *
 *   POST /scan            run a compliance scan against a URL (auth: Bearer token)
 *   GET  /standards       list all compliance standards
 *   GET  /reports         list all compliance reports
 *   GET  /results/:id     single scan result by id
 *
 * Mutating routes require authentication (issue #64) — scans persist
 * to the `ComplianceScan` Prisma model.
 *
 * Order matters: static routes (`/scan`, `/standards`, `/reports`) are
 * declared before `/results/:id` so the literal paths aren't captured
 * as an id.
 */
import { Router } from "express";
import type { z } from "zod";

import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  getResultById,
  listReports,
  listStandards,
  listResults,
  runScan,
} from "./service.js";
import {
  ComplianceResultParamsSchema,
  ComplianceScanSchema,
} from "./schema.js";

export const complianceRouter = Router();

complianceRouter.post(
  "/scan",
  requireAuth,
  validateBody(ComplianceScanSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof ComplianceScanSchema>;
    const result = await runScan(input);
    res.status(201).json({ data: result });
  }),
);

complianceRouter.get(
  "/standards",
  asyncHandler(async (_req, res) => {
    const items = await listStandards();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

complianceRouter.get(
  "/reports",
  asyncHandler(async (_req, res) => {
    const items = await listReports();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

complianceRouter.get(
  "/results/:id",
  validateParams(ComplianceResultParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof ComplianceResultParamsSchema
    >;
    const result = await getResultById(id);
    res.json({ data: result });
  }),
);
