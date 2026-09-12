/**
 * Favorites routes — /api/v1/favorites (PF-048)
 *
 *   GET    /            list the caller's favorites (paginated)
 *   POST   /:effectId   favorite an effect
 *   DELETE /:effectId   un-favorite an effect
 *
 * ALL routes (reads included) require authentication and are
 * owner-scoped — one user's favorites are invisible to every other
 * user (the api-keys flat-404 convention: foreign ids never leak
 * whether they exist).
 *
 * Effect ids are resolved through the registry catalog SOT
 * (getItemData("effect", id) — PF-009 A1); every mutation writes an
 * EnterpriseAuditLog row (favorites.effect.add | favorites.effect.remove
 * — PF-009 A6, which explicitly named favorites/collections).
 */
import { Router } from "express";
import type { z } from "zod";

import { requireAuth } from "../../server/middleware/auth.js";
import { asyncHandler } from "../../server/middleware/error.js";
import {
  validateParams,
  validateQuery,
} from "../../server/middleware/validate.js";
import { recordAuditEvent } from "../audit/service.js";
import { addFavorite, listFavorites, removeFavorite } from "./service.js";
import {
  FavoriteParamsSchema,
  ListFavoritesQuerySchema,
} from "./schema.js";

export const favoritesRouter = Router();

/** GET / — the caller's favorites, newest first, with pagination meta. */
favoritesRouter.get(
  "/",
  requireAuth,
  validateQuery(ListFavoritesQuerySchema),
  asyncHandler(async (req, res) => {
    const input = req.query as unknown as z.infer<
      typeof ListFavoritesQuerySchema
    >;
    const result = await listFavorites(req.user!.sub, input);
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

/** POST /:effectId — favorite an effect (404 unknown effect, 409 duplicate). */
favoritesRouter.post(
  "/:effectId",
  requireAuth,
  validateParams(FavoriteParamsSchema),
  asyncHandler(async (req, res) => {
    const { effectId } = req.params as unknown as z.infer<
      typeof FavoriteParamsSchema
    >;
    const favorite = await addFavorite(req.user!.sub, effectId);
    await recordAuditEvent({
      actor: req.user!.sub,
      action: "favorites.effect.add",
      resourceType: "effect",
      resourceId: effectId,
      requestId: req.requestId,
    });
    res.status(201).json({ data: favorite });
  }),
);

/** DELETE /:effectId — un-favorite an effect (404 when not favorited). */
favoritesRouter.delete(
  "/:effectId",
  requireAuth,
  validateParams(FavoriteParamsSchema),
  asyncHandler(async (req, res) => {
    const { effectId } = req.params as unknown as z.infer<
      typeof FavoriteParamsSchema
    >;
    await removeFavorite(req.user!.sub, effectId);
    await recordAuditEvent({
      actor: req.user!.sub,
      action: "favorites.effect.remove",
      resourceType: "effect",
      resourceId: effectId,
      requestId: req.requestId,
    });
    res.status(204).end();
  }),
);
