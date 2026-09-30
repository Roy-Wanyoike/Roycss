/**
 * Studio routes — /api/v1/studio
 *
 *   GET    /projects          list the caller's visual-builder projects
 *   POST   /projects          create a new project (attributed to the caller)
 *   GET    /projects/:id      one of the caller's projects (with component tree)
 *   PUT    /projects/:id      update one of the caller's projects
 *   DELETE /projects/:id      delete one of the caller's projects
 *   GET    /templates         studio starter templates (static public catalog)
 *
 * Owner-scoping invariant (issue #267 — the collections/favorites
 * convention, audit F-06): EVERY /projects route (reads included)
 * requires authentication and only ever touches the caller's own rows —
 * a project the caller doesn't own (or a legacy owner-`null` seed row)
 * reads as a flat 404, never a 403, so ids don't leak. Create persists
 * the Bearer-JWT `sub` as the owner. GET /templates stays public: it is
 * a static catalog with no user data.
 *
 * Order matters: /projects and /templates are declared before /projects/:id
 * so the literal paths aren't captured as an id.
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
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  listTemplates,
  updateProject,
} from "./service.js";
import {
  CreateStudioProjectSchema,
  StudioProjectParamsSchema,
  UpdateStudioProjectSchema,
} from "./schema.js";

export const studioRouter = Router();

studioRouter.get(
  "/projects",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await listProjects(req.user!.sub);
    res.json({ data: items, meta: { count: items.length } });
  }),
);

studioRouter.post(
  "/projects",
  requireAuth,
  validateBody(CreateStudioProjectSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof CreateStudioProjectSchema
    >;
    const project = await createProject(req.user!.sub, input);
    res.status(201).json({ data: project });
  }),
);

studioRouter.get(
  "/templates",
  asyncHandler(async (_req, res) => {
    const items = await listTemplates();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

studioRouter.get(
  "/projects/:id",
  requireAuth,
  validateParams(StudioProjectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof StudioProjectParamsSchema
    >;
    const project = await getProjectById(req.user!.sub, id);
    res.json({ data: project });
  }),
);

studioRouter.put(
  "/projects/:id",
  requireAuth,
  validateParams(StudioProjectParamsSchema),
  validateBody(UpdateStudioProjectSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof StudioProjectParamsSchema
    >;
    const input = req.body as unknown as z.infer<
      typeof UpdateStudioProjectSchema
    >;
    const project = await updateProject(req.user!.sub, id, input);
    res.json({ data: project });
  }),
);

studioRouter.delete(
  "/projects/:id",
  requireAuth,
  validateParams(StudioProjectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof StudioProjectParamsSchema
    >;
    await deleteProject(req.user!.sub, id);
    res.status(204).end();
  }),
);
