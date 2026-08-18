/**
 * Fleet routes — /api/v1/fleet
 *
 *   GET  /projects        list all monitored fleet projects
 *   GET  /health          fleet-wide health summary
 *   POST /scan            trigger a re-scan of a project
 *   GET  /projects/:id    single project by id
 *
 * Order matters: static routes (`/projects`, `/health`, `/scan`) are
 * declared before `/projects/:id` so the literal paths aren't captured
 * as an id.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
} from "../../server/middleware/validate.js";
import {
  getHealth,
  getProjectById,
  listProjects,
  scanProject,
} from "./service.js";
import { FleetProjectParamsSchema, FleetScanSchema } from "./schema.js";

export const fleetRouter = Router();

fleetRouter.get(
  "/projects",
  asyncHandler(async (_req, res) => {
    const items = await listProjects();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

fleetRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const health = await getHealth();
    res.json({ data: health });
  }),
);

fleetRouter.post(
  "/scan",
  validateBody(FleetScanSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof FleetScanSchema>;
    const result = await scanProject(input.projectId);
    res.json({ data: result });
  }),
);

fleetRouter.get(
  "/projects/:id",
  validateParams(FleetProjectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof FleetProjectParamsSchema
    >;
    const project = await getProjectById(id);
    res.json({ data: project });
  }),
);
