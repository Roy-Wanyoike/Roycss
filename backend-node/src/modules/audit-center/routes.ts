/**
 * Audit Center routes — /api/v1/audit-center
 *
 *   GET /projects          list all monitored projects
 *   GET /projects/:id      single project with category scores
 *   GET /issues            list issues (optional ?projectId=, ?status=)
 *   GET /trends            6-month trend data (score + open issues)
 *
 * Order matters: static routes (`/projects`, `/issues`, `/trends`) are
 * declared before `/projects/:id` so the literal paths aren't captured
 * as an id.
 */
import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateParams,
  validateQuery,
} from "../../server/middleware/validate.js";
import {
  getProjectById,
  getTrends,
  listIssues,
  listProjects,
} from "./service.js";

export const AuditCenterProjectParamsSchema = z.object({
  id: z.string().min(1),
});

export const AuditCenterIssuesQuerySchema = z.object({
  projectId: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.string().trim().max(40).optional().or(z.literal("")),
});

export const auditCenterRouter = Router();

auditCenterRouter.get(
  "/projects",
  asyncHandler(async (_req, res) => {
    const items = await listProjects();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

auditCenterRouter.get(
  "/issues",
  validateQuery(AuditCenterIssuesQuerySchema),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<
      typeof AuditCenterIssuesQuerySchema
    >;
    const items = await listIssues({
      projectId: q.projectId || undefined,
      status: q.status || undefined,
    });
    res.json({ data: items, meta: { count: items.length } });
  }),
);

auditCenterRouter.get(
  "/trends",
  asyncHandler(async (_req, res) => {
    const items = await getTrends();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

auditCenterRouter.get(
  "/projects/:id",
  validateParams(AuditCenterProjectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof AuditCenterProjectParamsSchema
    >;
    const project = await getProjectById(id);
    res.json({ data: project });
  }),
);
