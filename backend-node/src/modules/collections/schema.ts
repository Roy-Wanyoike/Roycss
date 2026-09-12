/**
 * Zod schemas for the collections module (PF-048).
 *
 * Collections are owner-scoped rows in the `Collection` Prisma model
 * (id, userId, name, description, effectIds — a JSON-string array, the
 * same convention as Theme.tokensJson, and the same member shape the
 * frontend's localStorage collections use). Every effect id is validated
 * against the registry catalog (PF-009 A1) before it is stored.
 */
import { z } from "zod";

/** Query params for GET /collections — standard pagination envelope. */
export const ListCollectionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(24),
});
export type ListCollectionsQuery = z.infer<typeof ListCollectionsQuerySchema>;

/** Body for POST /collections — create (optionally with membership). */
export const CreateCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name must be at most 80 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  effectIds: z
    .array(z.string().trim().min(1, "effectId must be a non-empty id"))
    .max(200, "A collection holds at most 200 effects")
    .default([]),
});
export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;

/**
 * Body for PATCH /collections/:id — partial update. Declared as its own
 * plain z.object (not CreateCollectionSchema.partial()) so the API.md /
 * OpenAPI generators can extract the field list.
 */
export const UpdateCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name must be at most 80 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  effectIds: z
    .array(z.string().trim().min(1, "effectId must be a non-empty id"))
    .max(200, "A collection holds at most 200 effects")
    .optional(),
});
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>;

/** Route params for /collections/:id. */
export const CollectionParamsSchema = z.object({
  id: z.string().min(1, "Collection id is required"),
});
export type CollectionParams = z.infer<typeof CollectionParamsSchema>;

/** Body for POST /collections/:id/effects — add one effect. */
export const AddEffectSchema = z.object({
  effectId: z.string().trim().min(1, "effectId is required"),
});
export type AddEffectInput = z.infer<typeof AddEffectSchema>;

/** Route params for /collections/:id/effects/:effectId. */
export const CollectionEffectParamsSchema = z.object({
  id: z.string().min(1, "Collection id is required"),
  effectId: z.string().min(1, "effectId is required"),
});
export type CollectionEffectParams = z.infer<
  typeof CollectionEffectParamsSchema
>;

/** Domain shape returned by every collections endpoint. `effectIds`
 *  preserves membership order (the order effects were added). */
export interface UserCollection {
  id: string;
  name: string;
  description: string | null;
  effectIds: string[];
  createdAt: string;
  updatedAt: string;
}
