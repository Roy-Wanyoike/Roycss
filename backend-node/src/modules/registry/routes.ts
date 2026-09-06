/**
 * Registry routes — /api/v1/registry
 *
 *   GET   /packages              list all packages
 *   POST  /packages              publish a new package
 *   GET   /packages/:id          single package by id
 *   GET   /packages/:id/versions version history for a package
 *   GET   /resolve/:slug         canonical framework-content item
 *                                (PF-009 / issue #94 A1 — the single
 *                                source of truth for effect/component/
 *                                pattern/theme/token/icon/motion reads)
 *
 * Order matters: the POST collection route is declared before /:id,
 * and the nested /:id/versions route is declared last so /:id still
 * works for arbitrary ids.
 */
import { Router } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../server/middleware/validate.js";
import {
  getPackageById,
  listPackageVersions,
  listPackages,
  publishPackage,
} from "./service.js";
import {
  PublishPackageSchema,
  RegistryParamsSchema,
  ResolveParamsSchema,
  ResolveQuerySchema,
} from "./schema.js";
import { resolveItem } from "./catalog.js";
import type { RegistryItemType } from "./catalog.js";

export const registryRouter = Router();

registryRouter.get(
  "/resolve/:slug",
  validateParams(ResolveParamsSchema),
  validateQuery(ResolveQuerySchema),
  asyncHandler(async (req, res) => {
    const { slug } = req.params as unknown as z.infer<
      typeof ResolveParamsSchema
    >;
    const q = req.query as unknown as z.infer<typeof ResolveQuerySchema>;
    const item = await resolveItem(slug, q.type as RegistryItemType | undefined);
    res.json({ data: item });
  }),
);

registryRouter.get(
  "/packages",
  asyncHandler(async (_req, res) => {
    const items = await listPackages();
    res.json({ data: items, meta: { count: items.length } });
  }),
);

registryRouter.post(
  "/packages",
  validateBody(PublishPackageSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof PublishPackageSchema>;
    const pkg = await publishPackage(input);
    res.status(201).json({ data: pkg });
  }),
);

registryRouter.get(
  "/packages/:id",
  validateParams(RegistryParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof RegistryParamsSchema
    >;
    const pkg = await getPackageById(id);
    res.json({ data: pkg });
  }),
);

registryRouter.get(
  "/packages/:id/versions",
  validateParams(RegistryParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof RegistryParamsSchema
    >;
    const versions = await listPackageVersions(id);
    res.json({ data: versions, meta: { count: versions.length } });
  }),
);
