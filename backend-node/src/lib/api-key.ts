/**
 * API key primitives — format, generation, scopes, masking (issue #65 / PF-002).
 *
 * API keys are long-lived credentials for the CLI / SDK / MCP server:
 *
 *   rk_live_<base62(32)>
 *   └─┬──┘  └───┬────┘
 *   prefix     secret (~190 bits of entropy)
 *
 * SECURITY rules enforced here and by the middleware
 * (src/server/middleware/api-key.ts):
 *   - The FULL key (prefix + secret) is hashed with bcrypt(10) for storage.
 *     The plaintext key is never persisted and never logged.
 *   - `prefix` + `last4` are stored separately for masked listing only
 *     (e.g. `rk_live_…ab12`); neither is a secret.
 *   - A SHA-256 of the full key is stored as a unique indexed lookup
 *     handle, so verification is one indexed query + one bcrypt compare.
 *
 * Scope model:
 *   "*"             — wildcard, accepted wherever a Bearer JWT is
 *   "<resource>:read" / "<resource>:write" — narrow grants, enforced by
 *   module-level middleware (currently the effects module).
 */
import { createHash, randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

// ─── Key format ───────────────────────────────────────────────────────────

/** Human-readable prefix of every API key. */
export const API_KEY_PREFIX = "rk_live";

/** Length of the random secret segment (base62 characters). */
export const API_KEY_SECRET_LENGTH = 32;

/** bcrypt cost for API key hashing. 10 rounds ≈ 60 ms/compare — same as passwords. */
export const API_KEY_BCRYPT_ROUNDS = 10;

/** Full-key shape: rk_live_ followed by exactly 32 base62 characters. */
export const API_KEY_PATTERN = `${API_KEY_PREFIX}_[0-9A-Za-z]{${API_KEY_SECRET_LENGTH}}`;

const API_KEY_RE = new RegExp(`^${API_KEY_PATTERN}$`);

const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generate `length` uniformly random base62 characters.
 *
 * Rejection sampling (bytes ≥ 248 are discarded, 248 = 62 × 4) keeps the
 * distribution uniform — a naive `byte % 62` would bias the first 8
 * characters of the alphabet by ~1.6%.
 */
function randomBase62(length: number): string {
  let out = "";
  while (out.length < length) {
    const byte = randomBytes(1)[0]!;
    if (byte < 248) out += BASE62_ALPHABET[byte % 62]!;
  }
  return out;
}

export interface GeneratedApiKey {
  /** The full plaintext key — shown to the caller exactly once, never stored. */
  plaintext: string;
  /** Display prefix, e.g. "rk_live". */
  prefix: string;
  /** Display tail — last 4 chars of the full key, e.g. "ab12". */
  last4: string;
}

/** Generate a fresh API key (plaintext + display fragments). */
export function generateApiKey(): GeneratedApiKey {
  const secret = randomBase62(API_KEY_SECRET_LENGTH);
  const plaintext = `${API_KEY_PREFIX}_${secret}`;
  return { plaintext, prefix: API_KEY_PREFIX, last4: plaintext.slice(-4) };
}

/** True when `key` matches the documented `rk_live_<base62(32)>` shape. */
export function isValidApiKeyFormat(key: string): boolean {
  return API_KEY_RE.test(key);
}

/** Hash the full key with bcrypt for at-rest storage. */
export function hashApiKey(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, API_KEY_BCRYPT_ROUNDS);
}

/**
 * SHA-256 hex digest of the full key — the indexed UNIQUE lookup handle.
 *
 * NOT a secret: it is preimage-resistant and derived from a ~190-bit
 * random secret, so a database leak does not help recover the key. Its
 * only job is to turn key verification into one indexed lookup instead
 * of scanning every stored bcrypt hash.
 */
export function lookupHashOf(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

/** Masked display form for listings, e.g. `rk_live_…ab12`. */
export function maskApiKey(prefix: string, last4: string): string {
  return `${prefix}_…${last4}`;
}

// ─── Scopes ───────────────────────────────────────────────────────────────

/**
 * Every scope that may be granted to an API key. Validated at creation
 * time (Zod) so unknown scopes are rejected with 400, and re-checked at
 * request time by module middleware so a missing/insufficient scope is 403.
 */
export const API_KEY_SCOPES = [
  "*",
  "effects:read",
  "effects:write",
  "recipes:read",
  "recipes:write",
  "patterns:read",
  "patterns:write",
  "themes:read",
  "themes:write",
  "mcp:read",
  "mcp:execute",
  "search:read",
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

/**
 * True when `scopes` grants `required`. The wildcard `*` covers any scope;
 * otherwise the exact scope string must be present.
 */
export function hasScope(scopes: readonly string[], required: string): boolean {
  return scopes.includes("*") || scopes.includes(required);
}

/**
 * Parse the JSON-encoded scope array stored in `ApiKey.scopesJson`.
 * Defensive: malformed or non-array JSON degrades to `[]` (no access)
 * rather than throwing — a corrupted row must never widen access.
 */
export function parseApiKeyScopes(scopesJson: string): string[] {
  try {
    const parsed: unknown = JSON.parse(scopesJson);
    if (Array.isArray(parsed)) {
      return parsed.filter((s): s is string => typeof s === "string");
    }
  } catch {
    // fall through — degrade to no scopes
  }
  return [];
}
