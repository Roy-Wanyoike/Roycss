/**
 * Enterprise routes — /api/v1/enterprise
 *
 *   GET   /organizations          list all organizations
 *   GET   /organizations/:id      single organization
 *   POST  /organizations          create an organization (auth: Bearer token)
 *   GET   /teams                  list all teams
 *   GET   /licenses               list all licenses
 *   GET   /audit-log              list audit log entries
 *
 * Org-scoped note (issue #64): there is no Membership context for a
 * route that CREATES an organization (the org does not exist yet), so
 * requireAuth alone gates it. Mutating routes persist to the
 * `Organization` Prisma model. Reads stay public.
 *
 * Order matters: static collection routes are declared before /:id.
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
  createOrganization,
  getOrganizationById,
  listAuditLog,
  listLicenses,
  listOrganizations,
  listTeams,
} from "./service.js";
import { CreateOrganizationSchema, OrgParamsSchema } from "./schema.js";

export const enterpriseRouter = Router();

enterpriseRouter.get(
  "/organizations",
  asyncHandler(async (_req, res) => {
    const items = await listOrganizations();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

enterpriseRouter.post(
  "/organizations",
  requireAuth,
  validateBody(CreateOrganizationSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<
      typeof CreateOrganizationSchema
    >;
    const org = await createOrganization(input);
    res.status(201).json({ data: org });
  }),
);

enterpriseRouter.get(
  "/organizations/:id",
  validateParams(OrgParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<typeof OrgParamsSchema>;
    const org = await getOrganizationById(id);
    res.json({ data: org });
  }),
);

enterpriseRouter.get(
  "/teams",
  asyncHandler(async (_req, res) => {
    const items = await listTeams();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

enterpriseRouter.get(
  "/licenses",
  asyncHandler(async (_req, res) => {
    const items = await listLicenses();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

enterpriseRouter.get(
  "/audit-log",
  asyncHandler(async (_req, res) => {
    const items = await listAuditLog();
    res.json({ data: items, meta: { count: items.length } });
  }),
);
