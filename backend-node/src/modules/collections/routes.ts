/**
 * Collections routes — /api/v1/collections (PF-048)
 *
 *   GET    /                          list the caller's collections (paginated)
 *   POST   /                          create a collection
 *   GET    /:id                       one of the caller's collections
 *   PATCH  /:id                       rename / re-describe / replace membership
 *   DELETE /:id                       delete a collection
 *   POST   /:id/effects               add one effect (append, order preserved)
 *   DELETE /:id/effects/:effectId     remove one effect (order of rest preserved)
 *
 * ALL routes (reads included) require authentication and are
 * owner-scoped — a collection the caller doesn't own reads as a flat
 * 404, never a 403, so ids don't leak (the api-keys convention).
 *
 * Effect ids are resolved through the registry catalog SOT
 * (getItemData("effect", id) — PF-009 A1); every mutation writes an
 * EnterpriseAuditLog row (collections.collection.create | update |
 * delete, collections.effect.add | remove — PF-009 A6, which explicitly
 * named favorites/collections).
 */
import { Router } from "express";
import type { z } from "zod";

import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../server/middleware/validate.js";
import { recordAuditEvent } from "../audit/service.js";
import {
  addEffectToCollection,
  createCollection,
  deleteCollection,
  getCollectionById,
  listCollections,
  removeEffectFromCollection,
  updateCollection,
} from "./service.js";
import {
  AddEffectSchema,
  CollectionEffectParamsSchema,
  CollectionParamsSchema,
  CreateCollectionSchema,
  ListCollectionsQuerySchema,
  UpdateCollectionSchema,
} from "./schema.js";

export const collectionsRouter = Router();

/** GET / — the caller's collections, newest first, with pagination meta. */
collectionsRouter.get(
  "/",
  requireAuth,
  validateQuery(ListCollectionsQuerySchema),
  asyncHandler(async (req, res) => {
    const input = req.query as unknown as z.infer<
      typeof ListCollectionsQuerySchema
    >;
    const result = await listCollections(req.user!.sub, input);
    res.json({
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),
);

/** POST / — create a collection (404 when an initial effect id is unknown). */
collectionsRouter.post(
  "/",
  requireAuth,
  validateBody(CreateCollectionSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as unknown as z.infer<typeof CreateCollectionSchema>;
    const collection = await createCollection(req.user!.sub, input);
    await recordAuditEvent({
      actor: req.user!.sub,
      action: "collections.collection.create",
      resourceType: "collection",
      resourceId: collection.id,
      requestId: req.requestId,
      metadata: { name: collection.name, effects: collection.effectIds.length },
    });
    res.status(201).json({ data: collection });
  }),
);

/** GET /:id — one of the caller's collections (single envelope, no meta). */
collectionsRouter.get(
  "/:id",
  requireAuth,
  validateParams(CollectionParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof CollectionParamsSchema
    >;
    const collection = await getCollectionById(req.user!.sub, id);
    res.json({ data: collection });
  }),
);

/** PATCH /:id — partial update (name / description / effectIds). */
collectionsRouter.patch(
  "/:id",
  requireAuth,
  validateParams(CollectionParamsSchema),
  validateBody(UpdateCollectionSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof CollectionParamsSchema
    >;
    const input = req.body as unknown as z.infer<typeof UpdateCollectionSchema>;
    const collection = await updateCollection(req.user!.sub, id, input);
    await recordAuditEvent({
      actor: req.user!.sub,
      action: "collections.collection.update",
      resourceType: "collection",
      resourceId: collection.id,
      requestId: req.requestId,
    });
    res.json({ data: collection });
  }),
);

/** DELETE /:id — delete a collection (204, documented no-content). */
collectionsRouter.delete(
  "/:id",
  requireAuth,
  validateParams(CollectionParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof CollectionParamsSchema
    >;
    await deleteCollection(req.user!.sub, id);
    await recordAuditEvent({
      actor: req.user!.sub,
      action: "collections.collection.delete",
      resourceType: "collection",
      resourceId: id,
      requestId: req.requestId,
    });
    res.status(204).end();
  }),
);

/** POST /:id/effects — append one effect (404 unknown effect, 409 duplicate). */
collectionsRouter.post(
  "/:id/effects",
  requireAuth,
  validateParams(CollectionParamsSchema),
  validateBody(AddEffectSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as unknown as z.infer<
      typeof CollectionParamsSchema
    >;
    const input = req.body as unknown as z.infer<typeof AddEffectSchema>;
    const collection = await addEffectToCollection(req.user!.sub, id, input);
    await recordAuditEvent({
      actor: req.user!.sub,
      action: "collections.effect.add",
      resourceType: "collection",
      resourceId: collection.id,
      requestId: req.requestId,
      metadata: { effectId: input.effectId },
    });
    res.json({ data: collection });
  }),
);

/** DELETE /:id/effects/:effectId — remove one effect (404 when not a member). */
collectionsRouter.delete(
  "/:id/effects/:effectId",
  requireAuth,
  validateParams(CollectionEffectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id, effectId } = req.params as unknown as z.infer<
      typeof CollectionEffectParamsSchema
    >;
    const collection = await removeEffectFromCollection(
      req.user!.sub,
      id,
      effectId,
    );
    await recordAuditEvent({
      actor: req.user!.sub,
      action: "collections.effect.remove",
      resourceType: "collection",
      resourceId: collection.id,
      requestId: req.requestId,
      metadata: { effectId },
    });
    res.json({ data: collection });
  }),
);
