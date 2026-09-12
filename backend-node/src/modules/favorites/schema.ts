/**
 * Zod schemas for the favorites module (PF-048).
 *
 * Favorites are owner-scoped rows in the `EffectFavorite` Prisma model
 * (@@unique([userId, effectId])). Every effect id is validated against
 * the registry catalog (modules/registry/catalog.ts — PF-009 A1 single
 * code path) before it can be stored.
 */
import { z } from "zod";

/** Query params for GET /favorites — standard pagination envelope. */
export const ListFavoritesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(24),
});
export type ListFavoritesQuery = z.infer<typeof ListFavoritesQuerySchema>;

/** Route params for /favorites/:effectId. */
export const FavoriteParamsSchema = z.object({
  effectId: z.string().min(1, "effectId is required"),
});
export type FavoriteParams = z.infer<typeof FavoriteParamsSchema>;

/**
 * Domain shape returned by every favorites endpoint. `effect` is the
 * catalog-resolved Effect (the same payload GET /effects/:id serves).
 */
export interface FavoriteEntry {
  id: string;
  effectId: string;
  effect: EffectLike | null;
  createdAt: string;
}

/**
 * Structural stand-in for the catalog's Effect domain item — avoids a
 * cross-module type dependency; the effects module owns the real shape.
 */
export interface EffectLike {
  id: string;
  name: string;
  [key: string]: unknown;
}
