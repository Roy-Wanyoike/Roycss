/**
 * API key service — create / list / revoke (issue #65 / PF-002).
 *
 * Lifecycle:
 *   1. `createApiKey` — generate `rk_live_<base62(32)>`, bcrypt(10) the
 *      FULL key, persist hash + SHA-256 lookup handle + display
 *      fragments. The plaintext is returned to the caller exactly ONCE
 *      (the route embeds it in the 201 response) and never stored,
 *      never logged, never recoverable.
 *   2. `listApiKeys` — the owner's keys, masked (`rk_live_…ab12`), most
 *      recent first, including revoked keys (with `revokedAt`) so the
 *      UI can show audit history.
 *   3. `revokeApiKey` — soft delete via `revokedAt`. Revoked keys fail
 *      authentication with 401 immediately (see
 *      server/middleware/api-key.ts).
 *
 * All management is owner-scoped: every query filters by `ownerId` (the
 * Bearer-JWT `sub`), and a key the caller doesn't own reads as 404 —
 * never 403 — so ids don't leak whether other keys exist.
 *
 * NOTE: the management endpoints themselves only accept Bearer JWTs
 * (`jwtOnly` middleware) — a key can never mint or resurrect keys.
 */
import { db } from "../../lib/db.js";
import {
  generateApiKey,
  hashApiKey,
  lookupHashOf,
  maskApiKey,
  parseApiKeyScopes,
} from "../../lib/api-key.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import type { CreateApiKeyInput, PublicApiKey } from "./schema.js";

const log = createLogger("api-keys");

/** Cap on ACTIVE (non-revoked) keys per owner — minting is not free. */
const MAX_ACTIVE_KEYS_PER_OWNER = 50;

/** Fields we ever read back for a PublicApiKey — never hash/lookupHash. */
const PUBLIC_SELECT = {
  id: true,
  name: true,
  prefix: true,
  last4: true,
  scopesJson: true,
  orgId: true,
  createdAt: true,
  lastUsedAt: true,
  revokedAt: true,
} as const;

type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  last4: string;
  scopesJson: string;
  orgId: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

function toPublicApiKey(row: ApiKeyRow): PublicApiKey {
  return {
    id: row.id,
    name: row.name,
    masked: maskApiKey(row.prefix, row.last4),
    scopes: parseApiKeyScopes(row.scopesJson),
    orgId: row.orgId,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    revokedAt: row.revokedAt,
  };
}

export interface CreateApiKeyResult {
  /** Masked record — safe to store/display client-side. */
  apiKey: PublicApiKey;
  /** The full plaintext key — shown ONCE in the 201 response, never again. */
  plaintext: string;
}

/**
 * Mint a new API key for `ownerId`. Throws:
 *   - 404 when `orgId` references a nonexistent organization
 *   - 409 on duplicate name for the owner, or when the active-key cap
 *     is hit
 */
export async function createApiKey(
  input: CreateApiKeyInput & { ownerId: string },
): Promise<CreateApiKeyResult> {
  // Duplicate name per owner → friendly 409 before any key material is
  // generated (the DB @@unique([ownerId, name]) is the backstop).
  const existing = await db.apiKey.findFirst({
    where: { ownerId: input.ownerId, name: input.name },
    select: { id: true },
  });
  if (existing) {
    throw AppError.conflict("An API key with that name already exists", {
      field: "name",
    });
  }

  const activeCount = await db.apiKey.count({
    where: { ownerId: input.ownerId, revokedAt: null },
  });
  if (activeCount >= MAX_ACTIVE_KEYS_PER_OWNER) {
    throw AppError.conflict(
      `API key limit reached — at most ${MAX_ACTIVE_KEYS_PER_OWNER} active keys per account. Revoke a key first.`,
    );
  }

  if (input.orgId !== undefined) {
    const org = await db.organization.findUnique({
      where: { id: input.orgId },
      select: { id: true },
    });
    if (!org) {
      throw AppError.notFound("Organization not found");
    }
  }

  const { plaintext, prefix, last4 } = generateApiKey();
  const hash = await hashApiKey(plaintext);
  const lookupHash = lookupHashOf(plaintext);

  const row = await db.apiKey.create({
    data: {
      name: input.name,
      hash,
      lookupHash,
      prefix,
      last4,
      scopesJson: JSON.stringify(input.scopes),
      ownerId: input.ownerId,
      orgId: input.orgId ?? null,
    },
    select: PUBLIC_SELECT,
  });

  // Log the lifecycle event WITHOUT the plaintext — id + masked form only.
  log.info("API key created", {
    keyId: row.id,
    masked: maskApiKey(prefix, last4),
    ownerId: input.ownerId,
    scopes: input.scopes,
  });

  return { apiKey: toPublicApiKey(row), plaintext };
}

/** List the owner's keys (masked), newest first, including revoked ones. */
export async function listApiKeys(ownerId: string): Promise<PublicApiKey[]> {
  const rows = await db.apiKey.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: PUBLIC_SELECT,
  });
  return rows.map(toPublicApiKey);
}

/**
 * Soft-delete (revoke) one of the owner's keys by id. Throws:
 *   - 404 when the key doesn't exist or belongs to someone else
 *   - 409 when it is already revoked
 */
export async function revokeApiKey(
  ownerId: string,
  id: string,
): Promise<PublicApiKey> {
  const key = await db.apiKey.findFirst({
    where: { id, ownerId },
    select: { id: true, revokedAt: true },
  });
  if (!key) {
    throw AppError.notFound("API key not found");
  }
  if (key.revokedAt !== null) {
    throw AppError.conflict("API key has already been revoked");
  }

  const row = await db.apiKey.update({
    where: { id: key.id },
    data: { revokedAt: new Date() },
    select: PUBLIC_SELECT,
  });

  log.info("API key revoked", { keyId: id, ownerId });
  return toPublicApiKey(row);
}
