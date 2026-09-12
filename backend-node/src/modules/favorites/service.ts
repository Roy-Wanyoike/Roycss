/**
 * Favorites service — owner-scoped saved-effects store (PF-048).
 *
 * Persisted via the Prisma `EffectFavorite` model (id, userId, effectId,
 * createdAt, @@unique([userId, effectId])). The schema already existed —
 * this module is the HTTP surface's persistence half.
 *
 * Conventions (mirroring modules/api-keys/service.ts):
 *   - Every query filters by `userId` (the Bearer-JWT `sub`), so one
 *     user's favorites are invisible to every other user.
 *   - Effect ids are resolved through the registry catalog SOT
 *     (`getItemData("effect", id)` — PF-009 A1): there is exactly one
 *     code path for framework-content lookups, and an unknown id is a
 *     flat 404 ("Effect '<id>' not found") before any row is written.
 *   - Duplicate adds surface as 409 CONFLICT (the DB @@unique is the
 *     backstop).
 *   - No caching: reads are cheap per-user queries, and the api-keys
 *     module set the precedent that owner-scoped data skips the shared
 *     LRU (whose keys are global, not per-user).
 */
import { db } from "../../lib/db.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import { getItemData } from "../registry/catalog.js";
import type { EffectLike, FavoriteEntry, ListFavoritesQuery } from "./schema.js";

const log = createLogger("favorites");

interface FavoriteRow {
  id: string;
  userId: string;
  effectId: string;
  createdAt: Date;
}

function toEntry(row: FavoriteRow): FavoriteEntry {
  return {
    id: row.id,
    effectId: row.effectId,
    effect: null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Resolve one effect through the registry catalog or throw the 404. */
async function requireEffect(effectId: string): Promise<EffectLike> {
  const item = await getItemData("effect", effectId);
  if (item === undefined) {
    throw AppError.notFound(`Effect '${effectId}' not found`);
  }
  return item as EffectLike;
}

/** List the caller's favorites, newest first, with pagination meta.
 *  Each entry carries the catalog-resolved effect payload. */
export async function listFavorites(
  userId: string,
  input: ListFavoritesQuery,
): Promise<{
  items: FavoriteEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const [rows, total] = await Promise.all([
    db.effectFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    db.effectFavorite.count({ where: { userId } }),
  ]);

  // Resolve every effect id through the catalog (PF-009 A1) so the list
  // is self-sufficient — no follow-up /effects/:id round-trips.
  const items: FavoriteEntry[] = [];
  for (const row of rows) {
    const entry = toEntry(row);
    const item = await getItemData("effect", row.effectId);
    entry.effect = item === undefined ? null : (item as EffectLike);
    items.push(entry);
  }

  return {
    items,
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
  };
}

/** Favorite an effect. Throws 404 (unknown effect) / 409 (already favorited). */
export async function addFavorite(
  userId: string,
  effectId: string,
): Promise<FavoriteEntry> {
  await requireEffect(effectId);

  const existing = await db.effectFavorite.findFirst({
    where: { userId, effectId },
    select: { id: true },
  });
  if (existing) {
    throw AppError.conflict("Effect is already in your favorites", {
      effectId,
    });
  }

  const row = await db.effectFavorite.create({ data: { userId, effectId } });
  log.info("Effect favorited", { userId, effectId });
  const entry = toEntry(row);
  const item = await getItemData("effect", effectId);
  entry.effect = item === undefined ? null : (item as EffectLike);
  return entry;
}

/** Un-favorite an effect. Throws 404 when it is not favorited. */
export async function removeFavorite(
  userId: string,
  effectId: string,
): Promise<void> {
  const row = await db.effectFavorite.findFirst({
    where: { userId, effectId },
    select: { id: true },
  });
  if (!row) {
    throw AppError.notFound("Effect is not in your favorites");
  }
  await db.effectFavorite.delete({ where: { id: row.id } });
  log.info("Effect unfavorited", { userId, effectId });
}
