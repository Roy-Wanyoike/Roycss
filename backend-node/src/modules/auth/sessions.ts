/**
 * Refresh-token session store (audit F-05) — rotation + revocation.
 *
 * ─── THE COMPROMISE STORY (what changed vs the stateless JWT) ─────────
 * Before: refresh tokens were pure JWTs — no jti, no rotation, no
 * revocation. A stolen refresh token stayed valid for its full 7-day
 * life with NO kill switch; logout was client-side cookie clearing.
 *
 * Now every issued refresh token has a `RefreshToken` row keyed by
 * SHA-256(full JWT string):
 *   - ROTATE:  every /auth/refresh revokes the presented row
 *              (revokedAt + replacedByHash) and issues a new one. A
 *              token can therefore be used exactly ONCE — an
 *              intercepted token dies the moment the legitimate client
 *              refreshes.
 *   - REUSE DETECTION: presenting a REVOKED token means two parties
 *              hold it (a rotation race between honest clients is
 *              possible but rare; a thief replaying an already-rotated
 *              token is the common case). Response: revoke EVERY
 *              session for that user — the stolen-and-legit tokens all
 *              die together, forcing a fresh login. This is the
 *              standard rotation trade-off (Auth0 does the same).
 *   - REVOKE:  /auth/logout revokes the presented token; /auth/logout-all
 *              and a successful password reset revoke every row
 *              (reset = session kill-switch).
 *
 * DB leak ≠ token leak: the table stores hashes only; forging a JWT
 * that hashes to a known row requires the signing secret.
 *
 * ─── Grace degradation ────────────────────────────────────────────────
 * A refresh JWT that verifies but has NO row (issued before this table
 * existed, or rows wiped) is rejected — fail closed. The row is the
 * source of truth, the JWT is just the carried credential.
 */
import { db } from "../../lib/db.js";
import {
  REFRESH_TOKEN_TTL_MS,
  signTokenPair,
  verifyRefreshToken,
  type TokenPair,
} from "../../lib/jwt.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import { hashToken } from "./tokens.js";

const log = createLogger("auth");

/** Issue a brand-new session (register/login): token pair + its row. */
export async function issueSession(user: {
  id: string;
  email: string;
}): Promise<TokenPair> {
  const tokens = signTokenPair({ sub: user.id, email: user.email });
  await db.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(tokens.refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  return tokens;
}

/**
 * Rotate: verify the JWT AND the DB row, revoke the old row, issue the
 * successor. Reuse of a revoked row nukes every session for the user.
 */
export async function rotateSession(refreshToken: string): Promise<{
  userId: string;
  tokens: TokenPair;
}> {
  const payload = verifyRefreshToken(refreshToken);
  const row = await db.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    select: { id: true, userId: true, expiresAt: true, revokedAt: true },
  });

  if (row && row.revokedAt !== null) {
    // ─── REUSE DETECTION (see module header) ───────────────────────
    await db.refreshToken.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    log.warn("Refresh-token reuse detected — ALL user sessions revoked", {
      userId: row.userId,
    });
    throw AppError.unauthorized(
      "Session expired or was revoked — please sign in again",
    );
  }

  if (!row || row.userId !== payload.sub) {
    // No row (pre-rotation token / wiped table) or claim mismatch.
    throw AppError.unauthorized("Invalid or expired refresh token");
  }
  if (row.expiresAt.getTime() <= Date.now()) {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  const tokens = signTokenPair({ sub: payload.sub, email: payload.email });
  const now = new Date();
  // Revoke the presented row, chaining to its successor.
  await db.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: now, replacedByHash: hashToken(tokens.refreshToken) },
  });
  await db.refreshToken.create({
    data: {
      userId: row.userId,
      tokenHash: hashToken(tokens.refreshToken),
      expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
    },
  });
  // Lazy GC — expired rows for this user only (cheap, bounded).
  await db.refreshToken.deleteMany({
    where: { userId: row.userId, expiresAt: { lt: now }, revokedAt: { not: null } },
  });

  log.info("Refresh token rotated", { userId: row.userId });
  return { userId: row.userId, tokens };
}

/**
 * Revoke ONE presented refresh token (logout). Best-effort + idempotent:
 * a garbage/unknown token still returns success — logout must never
 * leak token validity. Returns the userId whose row was revoked, if any.
 */
export async function revokeSession(
  refreshToken: string,
): Promise<string | null> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const row = await db.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      select: { id: true, userId: true, revokedAt: true },
    });
    if (!row) return null;
    if (row.revokedAt === null) {
      await db.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      });
      log.info("Refresh token revoked (logout)", { userId: row.userId });
    }
    return row.userId;
  } catch {
    // Invalid JWT — nothing to revoke, logout stays idempotent.
    return null;
  }
}

/** Revoke every live session for a user (logout-all / password reset). */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  const res = await db.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (res.count > 0) {
    log.info("All user sessions revoked", { userId, count: res.count });
  }
  return res.count;
}
