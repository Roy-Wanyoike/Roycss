/**
 * Zod schemas for API-key management (issue #65 / PF-002).
 *
 * Routes live under the auth module (/api/v1/auth/api-keys — see
 * modules/auth/routes.ts); this module owns the request/response shapes
 * and the persistence logic (service.ts).
 */
import { z } from "zod";

import { API_KEY_SCOPES } from "../../lib/api-key.js";

/** Scope enum validated at creation — unknown scopes are a 400. */
const ApiScopeSchema = z.enum(API_KEY_SCOPES);

export const CreateApiKeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters"),
  scopes: z
    .array(ApiScopeSchema)
    .nonempty("At least one scope is required")
    .max(16, "At most 16 scopes per key")
    // Default to least-privilege read access to the effects catalog.
    .default(["effects:read"])
    // Dedupe — a scope listed twice grants nothing extra.
    .transform((scopes) => [...new Set(scopes)]),
  orgId: z
    .string()
    .trim()
    .min(1, "orgId must be a non-empty id")
    .max(64, "orgId must be at most 64 characters")
    .optional(),
});
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

export const ApiKeyParamsSchema = z.object({
  id: z.string().min(1, "API key id is required"),
});
export type ApiKeyParams = z.infer<typeof ApiKeyParamsSchema>;

/**
 * Masked API key shape returned by every management endpoint.
 * NEVER contains the plaintext key or the stored hashes.
 */
export interface PublicApiKey {
  id: string;
  name: string;
  /** Masked display form, e.g. `rk_live_…ab12`. */
  masked: string;
  scopes: string[];
  orgId: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}
