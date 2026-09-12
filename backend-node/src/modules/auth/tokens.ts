/**
 * Opaque single-use tokens for the email lifecycle (PF-011 / audit F-02).
 *
 * Design (mirrors the ApiKey conventions — prisma/schema.prisma):
 *   - 32 bytes from crypto.randomBytes → 64-char hex "raw" token that
 *     lives ONLY in the emailed link. Never stored, never logged.
 *   - SHA-256("raw") is stored as `tokenHash` (UNIQUE, indexed) — a DB
 *     leak reveals hashes, not usable tokens; preimage resistance on a
 *     256-bit random value makes brute force hopeless.
 *   - single-use: `usedAt` set on redemption; replay → 400.
 *   - 30-minute `expiresAt`; issuing a new token for the same
 *     user+purpose deletes the previous one (one live token per purpose).
 *   - purpose isolation: a VERIFY_EMAIL token can never be redeemed
 *     against PASSWORD_RESET and vice versa (checked in `consume`).
 */
import { createHash, randomBytes } from "node:crypto";

import { db } from "../../lib/db.js";
import { AppError } from "../../server/middleware/error.js";

export const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const TOKEN_TTL_LABEL = "30 minutes";

export const TOKEN_PURPOSES = {
  verifyEmail: "VERIFY_EMAIL",
  passwordReset: "PASSWORD_RESET",
} as const;

export type TokenPurpose =
  (typeof TOKEN_PURPOSES)[keyof typeof TOKEN_PURPOSES];

/** SHA-256 hex of the raw token — the only value ever persisted. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Fresh 256-bit random token: [raw (emailed), hash (stored)]. */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

/**
 * Issue a single-use token for (userId, purpose), retiring any previous
 * live token of the same purpose first. Returns the RAW token — the
 * caller embeds it in the emailed link and discards it.
 */
export async function issueToken(
  userId: string,
  purpose: TokenPurpose,
): Promise<string> {
  // One live token per (user, purpose): retire the previous one so a
  // "resend" invalidates the older link (also keeps the table small).
  await db.verificationToken.deleteMany({
    where: { userId, purpose, usedAt: null },
  });
  // Lazy GC: drop expired rows for this user while we're here.
  await db.verificationToken.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  const { raw, hash } = generateToken();
  await db.verificationToken.create({
    data: {
      userId,
      tokenHash: hash,
      purpose,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return raw;
}

/**
 * Consume a token: look it up by hash, enforce purpose + single-use +
 * expiry, then mark it used inside a transaction. Throws 400 AppError on
 * every failure path (uniform "invalid or expired" message — never leak
 * which check failed, never 500).
 *
 * Returns the owning userId so the caller can apply the state change.
 */
export async function consumeToken(
  raw: string,
  purpose: TokenPurpose,
): Promise<string> {
  const row = await db.verificationToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    select: { id: true, userId: true, purpose: true, expiresAt: true, usedAt: true },
  });

  // Same wire message for every branch — no oracle for token state.
  const invalidToken = (): AppError =>
    AppError.badRequest(
      purpose === TOKEN_PURPOSES.passwordReset
        ? "Invalid or expired password reset token"
        : "Invalid or expired email verification token",
    );

  if (!row) throw invalidToken(); // unknown token
  if (row.purpose !== purpose) throw invalidToken(); // cross-purpose replay
  if (row.usedAt !== null) throw invalidToken(); // single-use violation
  if (row.expiresAt.getTime() <= Date.now()) throw invalidToken(); // stale

  // Redeem: single-use is enforced by the conditional update — if a
  // concurrent request already claimed the row, affected count is 0
  // and we fail closed (no double redemption).
  const claimed = await db.verificationToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) throw invalidToken(); // concurrent replay

  return row.userId;
}
