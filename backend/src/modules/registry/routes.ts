/**
 * Registry routes — /api/v1/registry
 *
 *   GET   /packages              list all packages
 *   POST  /packages              publish a new package
 *   GET   /packages/:id          single package by id
 *   GET   /packages/:id/versions version history for a package
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
} from "../../server/middleware/validate.js";
import {
  getPackageById,
  listPackageVersions,
  listPackages,
  publishPackage,
} from "./service.js";
import { PublishPackageSchema, RegistryParamsSchema } from "./schema.js";

export const registryRouter = Router();

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
