/**
 * Collections service — owner-scoped curated effect bundles (PF-048).
 *
 * Persisted via the Prisma `Collection` model (id, userId, name,
 * description, effectIds — a JSON-encoded string array, matching the
 * Theme.tokensJson convention and the frontend's localStorage shape).
 *
 * Field-mapping: `effectIds` (domain, string[]) ↔ `effectIds` (Prisma,
 * String) via JSON.parse/JSON.stringify; everything else maps directly.
 *
 * Conventions (mirroring modules/api-keys/service.ts):
 *   - Every query filters by `userId` — a collection the caller doesn't
 *     own reads as a flat 404, never a 403, so ids don't leak.
 *   - Effect ids (initial membership, replacements, and single adds)
 *     are resolved through the registry catalog SOT
 *     (getItemData("effect", id) — PF-009 A1); unknown ids are a flat
 *     404 before any write.
 *   - Membership order is insertion order; duplicates are rejected
 *     with 409 CONFLICT.
 */
import { db } from "../../lib/db.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import { getItemData } from "../registry/catalog.js";
import type {
  AddEffectInput,
  CreateCollectionInput,
  ListCollectionsQuery,
  UpdateCollectionInput,
  UserCollection,
} from "./schema.js";

const log = createLogger("collections");

interface CollectionRow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  effectIds: string;
  createdAt: Date;
  updatedAt: Date;
}

function toDomain(row: CollectionRow): UserCollection {
  let effectIds: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.effectIds);
    if (Array.isArray(parsed)) {
      effectIds = parsed.filter((x): x is string => typeof x === "string");
    }
  } catch {
    // Keep the empty default — a corrupt payload reads as an empty
    // collection rather than failing the whole endpoint.
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    effectIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Resolve one effect through the registry catalog or throw the 404. */
async function requireEffect(effectId: string): Promise<void> {
  const item = await getItemData("effect", effectId);
  if (item === undefined) {
    throw AppError.notFound(`Effect '${effectId}' not found`);
  }
}

/** Dedupe a membership list, preserving insertion order. */
function dedupe(effectIds: string[]): string[] {
  return [...new Set(effectIds)];
}

/** Validate every id against the catalog (404 on the first unknown). */
async function requireEffects(effectIds: string[]): Promise<void> {
  for (const effectId of effectIds) {
    await requireEffect(effectId);
  }
}

/** Fetch one of the caller's collections or throw a flat 404. */
async function getOwned(userId: string, id: string): Promise<UserCollection> {
  const row = await db.collection.findFirst({ where: { id, userId } });
  if (!row) {
    throw AppError.notFound("Collection not found");
  }
  return toDomain(row);
}

/** List the caller's collections, newest first, with pagination meta. */
export async function listCollections(
  userId: string,
  input: ListCollectionsQuery,
): Promise<{
  items: UserCollection[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const [rows, total] = await Promise.all([
    db.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    db.collection.count({ where: { userId } }),
  ]);
  return {
    items: rows.map(toDomain),
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
  };
}

/** Create a collection (optionally with initial membership).
 *  Throws 404 when any initial effect id is unknown. */
export async function createCollection(
  userId: string,
  input: CreateCollectionInput,
): Promise<UserCollection> {
  const effectIds = dedupe(input.effectIds);
  await requireEffects(effectIds);

  const row = await db.collection.create({
    data: {
      userId,
      name: input.name,
      description: input.description ?? null,
      effectIds: JSON.stringify(effectIds),
    },
  });
  log.info("Collection created", {
    userId,
    collectionId: row.id,
    effects: effectIds.length,
  });
  return toDomain(row);
}

/** Get one of the caller's collections by id (flat 404 otherwise). */
export async function getCollectionById(
  userId: string,
  id: string,
): Promise<UserCollection> {
  return getOwned(userId, id);
}

/** Update (rename / re-describe / replace membership of) one of the
 *  caller's collections. Throws 404 (foreign or unknown id, or an
 *  unknown replacement effect id). */
export async function updateCollection(
  userId: string,
  id: string,
  input: UpdateCollectionInput,
): Promise<UserCollection> {
  const existing = await getOwned(userId, id);

  let effectIds = existing.effectIds;
  if (input.effectIds !== undefined) {
    effectIds = dedupe(input.effectIds);
    await requireEffects(effectIds);
  }

  const row = await db.collection.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      effectIds: JSON.stringify(effectIds),
    },
  });
  log.info("Collection updated", { userId, collectionId: id });
  return toDomain(row);
}

/** Delete one of the caller's collections (flat 404 otherwise). */
export async function deleteCollection(
  userId: string,
  id: string,
): Promise<void> {
  const existing = await getOwned(userId, id);
  await db.collection.delete({ where: { id: existing.id } });
  log.info("Collection deleted", { userId, collectionId: id });
}

/** Append one effect to a collection's membership (order preserved).
 *  Throws 404 (unknown collection or effect) / 409 (already a member). */
export async function addEffectToCollection(
  userId: string,
  id: string,
  input: AddEffectInput,
): Promise<UserCollection> {
  const existing = await getOwned(userId, id);
  await requireEffect(input.effectId);

  if (existing.effectIds.includes(input.effectId)) {
    throw AppError.conflict("Effect is already in the collection", {
      effectId: input.effectId,
    });
  }

  const effectIds = [...existing.effectIds, input.effectId];
  const row = await db.collection.update({
    where: { id: existing.id },
    data: { effectIds: JSON.stringify(effectIds) },
  });
  log.info("Effect added to collection", {
    userId,
    collectionId: id,
    effectId: input.effectId,
  });
  return toDomain(row);
}

/** Remove one effect from a collection's membership (order of the rest
 *  preserved). Throws 404 (unknown collection; effect not a member). */
export async function removeEffectFromCollection(
  userId: string,
  id: string,
  effectId: string,
): Promise<UserCollection> {
  const existing = await getOwned(userId, id);

  if (!existing.effectIds.includes(effectId)) {
    throw AppError.notFound("Effect is not in the collection");
  }

  const effectIds = existing.effectIds.filter((e) => e !== effectId);
  const row = await db.collection.update({
    where: { id: existing.id },
    data: { effectIds: JSON.stringify(effectIds) },
  });
  log.info("Effect removed from collection", {
    userId,
    collectionId: id,
    effectId,
  });
  return toDomain(row);
}
