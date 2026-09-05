/**
 * X-API-Key authentication middleware (issue #65 / PF-002).
 *
 * API keys are long-lived credentials for the CLI / SDK / MCP server and
 * an alternative to short-lived Bearer JWTs. This module resolves
 * presented keys and composes with the existing JWT middleware:
 *
 * ─── Resolution pipeline (`authenticateApiKey`) ───────────────────────────
 *   1. Format check — `rk_live_<base62(32)>` (cheap regex reject).
 *   2. Indexed lookup by SHA-256 of the full key (`ApiKey.lookupHash`,
 *      UNIQUE) — one indexed query, never an O(n) bcrypt scan.
 *   3. bcrypt(10) compare of the full key against `ApiKey.hash` — the
 *      only credential check.
 *   4. Revocation check — `revokedAt != null` → 401.
 *   5. Per-key rate limit (`server/api-key-rate-limit.ts`) → 429.
 *   6. `lastUsedAt` touch — fire-and-forget, throttled to one write per
 *      key per 30 s so it never blocks or write-amplifies the request path.
 *
 * ─── Exported middleware ──────────────────────────────────────────────────
 *   - `authenticateApiKey`   : steps 1–6; attaches `req.apiKey`.
 *   - `handleApiKeyCredentials` : full auth for protected routes — on top
 *     of the above, fails closed unless the key holds the `*` scope and
 *     attaches a JWT-shaped `req.user` built from the key owner. Used by
 *     `requireAuth` (server/middleware/auth.ts) as the X-API-Key branch.
 *   - `requireApiKeyScope(s)`: mounts on (public) module routes to
 *     enforce a per-key scope — e.g. `effects:read` on the effects
 *     module. Requests WITHOUT an X-API-Key header pass through (the
 *     route stays public); requests WITH a key must hold the scope.
 *   - `jwtOnly`              : rejects X-API-Key credentials outright —
 *     used on the API-key management endpoints so a (leaked) key can
 *     never mint more keys or list/revive existing ones.
 *
 * SECURITY: the plaintext key is never stored and never logged — log
 * statements only carry the key id, its name, and its masked form.
 * Uniform 401 message ("Invalid or revoked API key") for unknown,
 * malformed, revoked, and owner-deleted keys, so responses don't leak
 * which condition matched.
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";

import bcrypt from "bcryptjs";

import { db } from "../../lib/db.js";
import {
  hasScope,
  isValidApiKeyFormat,
  lookupHashOf,
  maskApiKey,
  parseApiKeyScopes,
} from "../../lib/api-key.js";
import { createLogger } from "../../lib/logger.js";
import {
  DEFAULT_API_KEY_TIER,
  enforceApiKeyRateLimit,
  type RateLimitTier,
} from "../api-key-rate-limit.js";
import { AppError, asyncHandler } from "./error.js";

const log = createLogger("api-key");

/**
 * Decoy bcrypt hash compared when no candidate row matches, so an
 * attacker cannot distinguish "unknown key" from "wrong key" by timing
 * (same pattern as the login handler in modules/auth/service.ts).
 */
const DUMMY_BCRYPT_HASH =
  "$2a$10$FrngG9tA9uzpOIZ3GsIDC.nVuQi9xIZfmK2ZRPAz3AJuAvmtIKGmG";

/** Minimum gap between two `lastUsedAt` writes for the same key. */
const LAST_USED_TOUCH_THROTTLE_MS = 30_000;

// Augment Express's Request with the API-key auth context.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by the X-API-Key middleware when the request used an API key. */
      apiKey?: ApiKeyAuthContext;
    }
  }
}

/** Auth context attached to `req.apiKey` after a key resolves. */
export interface ApiKeyAuthContext {
  keyId: string;
  /** Human-chosen key name (safe to display/log). */
  keyName: string;
  /** Masked display form, e.g. `rk_live_…ab12`. */
  masked: string;
  scopes: string[];
  ownerId: string;
  ownerEmail: string | null;
  orgId: string | null;
}

/** A stored ApiKey row (plus owner) as needed for authentication. */
interface ApiKeyRow {
  id: string;
  name: string;
  hash: string;
  prefix: string;
  last4: string;
  scopesJson: string;
  ownerId: string;
  orgId: string | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  owner: { id: string; email: string } | null;
}

/** Read the `X-API-Key` header (first value when duplicated). */
export function getApiKeyHeader(req: Request): string | null {
  const raw = req.headers["x-api-key"];
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? first : null;
  }
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

/**
 * Resolve a presented plaintext key to its stored row.
 * Returns null for unknown, malformed, revoked, or hash-mismatched keys.
 */
async function resolveApiKeyRow(plaintext: string): Promise<ApiKeyRow | null> {
  // Step 1 — cheap format reject. Do not even hit the DB for garbage.
  if (!isValidApiKeyFormat(plaintext)) {
    return null;
  }

  // Step 2 — indexed lookup by SHA-256 of the full key. A miss still pays
  // one bcrypt compare against a decoy hash so the timing profile of
  // "unknown key" matches "wrong key".
  const row = await db.apiKey.findUnique({
    where: { lookupHash: lookupHashOf(plaintext) },
    select: {
      id: true,
      name: true,
      hash: true,
      prefix: true,
      last4: true,
      scopesJson: true,
      ownerId: true,
      orgId: true,
      lastUsedAt: true,
      revokedAt: true,
      owner: { select: { id: true, email: true } },
    },
  });

  if (row === null) {
    await bcrypt.compare(plaintext, DUMMY_BCRYPT_HASH); // timing decoy
    return null;
  }

  // Step 3 — revocation BEFORE the (expensive) bcrypt compare: a revoked
  // key must not cost a bcrypt round-trip, and must not authenticate.
  if (row.revokedAt !== null) {
    return null;
  }

  // Step 4 — the actual credential check.
  const matches = await bcrypt.compare(plaintext, row.hash);
  if (!matches) {
    return null;
  }

  return row;
}

/**
 * Fire-and-forget `lastUsedAt` touch, throttled to one write per key per
 * 30 s. Never blocks the request path and never rejects into it — a
 * failed telemetry write must not fail the request.
 */
function touchLastUsedAt(keyId: string, lastUsedAt: Date | null): void {
  const now = Date.now();
  if (lastUsedAt !== null && now - lastUsedAt.getTime() < LAST_USED_TOUCH_THROTTLE_MS) {
    return; // recently written — skip to avoid write amplification
  }
  void db.apiKey
    .update({ where: { id: keyId }, data: { lastUsedAt: new Date(now) } })
    .catch((err: unknown) => {
      log.debug("lastUsedAt touch failed", {
        keyId,
        err: err instanceof Error ? err.message : String(err),
      });
    });
}

/**
 * Authenticate a request with an X-API-Key credential (steps 1–6 above).
 * Throws AppError(401) for invalid/revoked keys and AppError(429) when
 * the per-key rate limit is exceeded. On success attaches `req.apiKey`
 * and returns the context.
 */
export async function authenticateApiKey(
  plaintext: string,
  req: Request,
  res: Response,
  tier: RateLimitTier = DEFAULT_API_KEY_TIER,
): Promise<ApiKeyAuthContext> {
  const row = await resolveApiKeyRow(plaintext);
  if (row === null) {
    throw AppError.unauthorized("Invalid or revoked API key");
  }

  // Per-key rate limit — AFTER the credential check so the bucket is
  // keyed by the real key id, not by attacker-chosen bytes. Anonymous
  // abuse remains covered by the global per-IP limiters.
  enforceApiKeyRateLimit(res, row.id, tier);

  touchLastUsedAt(row.id, row.lastUsedAt);

  const context: ApiKeyAuthContext = {
    keyId: row.id,
    keyName: row.name,
    masked: maskApiKey(row.prefix, row.last4),
    scopes: parseApiKeyScopes(row.scopesJson),
    ownerId: row.ownerId,
    ownerEmail: row.owner?.email ?? null,
    orgId: row.orgId,
  };
  req.apiKey = context;
  return context;
}

/**
 * X-API-Key branch for `requireAuth` — authenticate the key, then fail
 * closed unless it holds the `*` scope (wildcard keys are the API-key
 * equivalent of a full user session). On success attaches a JWT-shaped
 * `req.user` built from the key OWNER, so downstream handlers that key
 * off `req.user.sub` work identically for both credential kinds.
 *
 * Keys with narrow scopes (e.g. `effects:read`) are rejected here with
 * 403 and a pointer to the endpoints that DO accept them — protected
 * routes without their own scope middleware cannot be reached with a
 * narrow key.
 */
export function handleApiKeyCredentials(
  plaintext: string,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void asyncHandler(async (req, res, next) => {
    const ctx = await authenticateApiKey(plaintext, req, res);

    if (!hasScope(ctx.scopes, "*")) {
      throw AppError.forbidden(
        `This endpoint requires an API key with the '*' scope. ` +
          `Key '${ctx.keyName}' (${ctx.masked}) only grants: ` +
          `${ctx.scopes.length > 0 ? ctx.scopes.join(", ") : "no scopes"}. ` +
          `Narrow-scope keys are accepted on endpoints that enforce their ` +
          `scope (e.g. GET /api/v1/effects requires 'effects:read').`,
      );
    }

    if (ctx.ownerEmail === null) {
      // Owner was deleted (keys cascade-delete with the user, so this is
      // defensive) — treat as invalid credentials.
      throw AppError.unauthorized("Invalid or revoked API key");
    }

    req.user = { sub: ctx.ownerId, email: ctx.ownerEmail, type: "access" };
    log.info("API key authenticated", {
      keyId: ctx.keyId,
      masked: ctx.masked,
      route: req.originalUrl,
    });
    next();
  })(req, res, next);
}

/**
 * Per-key scope enforcement for (public) module routes.
 *
 * Semantics:
 *   - No `X-API-Key` header → pass through (the route stays public —
 *     JWT-authenticated and anonymous callers are unaffected).
 *   - `X-API-Key` present → the key must be valid (401 otherwise),
 *     within its rate budget (429 otherwise), and hold `scope` or `*`
 *     (403 otherwise).
 *
 * Usage:
 *   router.get("/", requireApiKeyScope("effects:read"), handler)
 */
export function requireApiKeyScope(
  scope: string,
  tier: RateLimitTier = DEFAULT_API_KEY_TIER,
): RequestHandler {
  return asyncHandler(async (req, res, next) => {
    const presented = getApiKeyHeader(req);
    if (presented === null) {
      next(); // no key presented — public passthrough
      return;
    }

    const ctx = await authenticateApiKey(presented, req, res, tier);

    if (!hasScope(ctx.scopes, scope)) {
      throw AppError.forbidden(
        `API key '${ctx.keyName}' (${ctx.masked}) is missing the required ` +
          `scope '${scope}' (granted: ` +
          `${ctx.scopes.length > 0 ? ctx.scopes.join(", ") : "none"}).`,
      );
    }
    next();
  });
}

/**
 * Reject X-API-Key credentials outright. Mounted BEFORE `requireAuth` on
 * the API-key management endpoints (POST/GET/DELETE /auth/api-keys) so a
 * leaked or over-privileged key can never mint additional keys, list
 * them, or keep a revoked key alive by revoking the wrong id.
 */
export function jwtOnly(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (getApiKeyHeader(req) !== null) {
    next(
      AppError.unauthorized(
        "API-key management endpoints only accept Bearer JWT authentication",
      ),
    );
    return;
  }
  next();
}
