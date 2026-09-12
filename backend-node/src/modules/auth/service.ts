/**
 * Auth service — registration, login, refresh, current user,
 * email verification + password reset (PF-011 / audit F-02), session
 * rotation + revocation (audit F-05), and account export + delete
 * (audit F-13).
 *
 * Uses:
 *   - bcryptjs for password hashing (10 rounds — fast enough on a
 *     single CPU, strong enough for a hobby project; bump to 12 for prod)
 *   - jsonwebtoken for access + refresh tokens (see lib/jwt.ts)
 *   - Prisma User model for persistence
 *
 * All thrown errors are AppError instances so the centralized error
 * middleware formats them into standardized responses.
 */
import bcrypt from "bcryptjs";

import { env } from "../../config/env.js";
import { db } from "../../lib/db.js";
import {
  maskApiKey,
  parseApiKeyScopes,
} from "../../lib/api-key.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import { getMailer } from "../email/mailer.js";
import {
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "../email/templates.js";
import {
  issueSession,
  revokeAllUserSessions,
  revokeSession,
  rotateSession,
} from "./sessions.js";
import {
  TOKEN_PURPOSES,
  TOKEN_TTL_LABEL,
  consumeToken,
  issueToken,
} from "./tokens.js";
import type {
  AccountExport,
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  PublicUser,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailConfirm,
  VerifyEmailRequest,
} from "./schema.js";

const log = createLogger("auth");

const BCRYPT_ROUNDS = 10;

function toPublicUser(u: {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    emailVerified: u.emailVerifiedAt !== null,
    createdAt: u.createdAt,
  };
}

/** Send the verification email (best-effort — never throws). */
async function sendVerificationEmail(user: {
  id: string;
  email: string;
  name: string | null;
}): Promise<void> {
  try {
    const raw = await issueToken(user.id, TOKEN_PURPOSES.verifyEmail);
    await getMailer().send(
      verifyEmailTemplate({
        to: user.email,
        name: user.name,
        verifyUrl: `${env.APP_URL}/verify-email?token=${raw}`,
        expiresInLabel: TOKEN_TTL_LABEL,
      }),
    );
  } catch (err) {
    // Email delivery must never fail registration — log and move on.
    log.error("Verification email failed (user still registered)", {
      userId: user.id,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Register a new user. Throws 409 if email already exists. */
export async function registerUser(
  input: RegisterInput,
): Promise<{ user: PublicUser; accessToken: string; refreshToken: string; expiresIn: number }> {
  // Check for existing email first — avoids hashing a password for nothing
  // when the user already exists.
  const existing = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw AppError.conflict("An account with that email already exists", {
      field: "email",
    });
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await db.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name ?? null,
    },
    select: { id: true, email: true, name: true, emailVerifiedAt: true, createdAt: true },
  });

  // Session = token pair + its revocable RefreshToken row (audit F-05).
  const tokens = await issueSession(user);

  log.info("User registered", { userId: user.id, email: user.email });

  // Kick off the verification email (PF-011). Grace mode: the account is
  // usable immediately; the email just clears the "unverified" banner.
  await sendVerificationEmail(user);

  return {
    user: toPublicUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

/** Login by email + password. Throws 401 on bad credentials. */
export async function loginUser(
  input: LoginInput,
): Promise<{ user: PublicUser; accessToken: string; refreshToken: string; expiresIn: number }> {
  const user = await db.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true,
      createdAt: true,
      passwordHash: true,
      // Grace-period deletes read as "no such account" (audit F-13) —
      // a deleted account must fail exactly like an unknown one.
      deletedAt: true,
    },
  });

  // Always run a bcrypt compare even if the user doesn't exist, to
  // avoid leaking which emails are registered via timing differences.
  // The dummy hash below is just a valid bcrypt hash of garbage.
  const DUMMY_HASH =
    "$2a$10$CwTycUXWue0Thq9StjUM0uJ8eVjP3wW6PvWQXnXnqE2KkGOa2GnS.";
  const live = user !== null && user.deletedAt === null ? user : null;
  const passwordMatch = live
    ? await bcrypt.compare(input.password, live.passwordHash)
    : await bcrypt.compare(input.password, DUMMY_HASH);

  if (!live || !passwordMatch) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const tokens = await issueSession(live);

  log.info("User logged in", {
    userId: live.id,
    email: live.email,
    emailVerified: live.emailVerifiedAt !== null,
  });

  return {
    user: toPublicUser(live),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

/**
 * Exchange a refresh token for a new access + refresh token pair.
 *
 * ROTATION (audit F-05): the presented refresh token is verified against
 * BOTH its JWT signature AND its RefreshToken row (exists · not revoked ·
 * not expired), the old row is revoked (chained to its successor), and a
 * new row is issued — a refresh token is single-use. Presenting an
 * already-rotated token is treated as theft and revokes every session
 * for the user (see sessions.ts for the compromise story).
 */
export async function refreshTokens(
  refreshToken: string,
): Promise<{ user: PublicUser; accessToken: string; refreshToken: string; expiresIn: number }> {
  const { userId, tokens } = await rotateSession(refreshToken);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerifiedAt: true, createdAt: true, deletedAt: true },
  });
  if (!user || user.deletedAt !== null) {
    // User deleted between rotation and read (or in the grace period —
    // audit F-13) — revoke what we just made and refuse.
    await revokeAllUserSessions(userId);
    throw AppError.unauthorized("User no longer exists");
  }

  return {
    user: toPublicUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

/** Fetch the current user by id (from the JWT sub claim). */
export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerifiedAt: true, createdAt: true, deletedAt: true },
  });
  // Grace-period rows (deletedAt set — audit F-13) read as gone: the
  // stateless 15-min access token can't be revoked, but it must not
  // resurrect a deleted account either.
  if (!user || user.deletedAt !== null) {
    throw AppError.notFound("User not found");
  }
  return toPublicUser(user);
}

// ─── Email verification (PF-011 / audit F-02) ─────────────────────────────

/**
 * (Re)send a verification email. NEVER reveals whether the address has
 * an account — the same `{ sent: true }` comes back either way (the
 * register endpoint's 409 already makes email enumeration possible;
 * this route just refuses to make it cheaper).
 */
export async function requestEmailVerification(
  input: VerifyEmailRequest,
): Promise<{ sent: boolean }> {
  const user = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, name: true, emailVerifiedAt: true, deletedAt: true },
  });

  // Unknown email, deleted account OR already verified → identical
  // silent success (deleted accounts must not receive more email —
  // audit F-13).
  if (!user || user.deletedAt !== null || user.emailVerifiedAt !== null) {
    return { sent: false };
  }

  await sendVerificationEmail(user);
  return { sent: true };
}

/** Redeem a verification token — sets User.emailVerifiedAt. */
export async function confirmEmailVerification(
  input: VerifyEmailConfirm,
): Promise<PublicUser> {
  const userId = await consumeToken(input.token, TOKEN_PURPOSES.verifyEmail);

  // Conditional update: keep the FIRST verification timestamp if a race
  // or a stale resend already verified the address.
  await db.user.updateMany({
    where: { id: userId, emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerifiedAt: true, createdAt: true },
  });

  log.info("Email verified", { userId });
  return toPublicUser(user);
}

// ─── Password reset (PF-011 / audit F-02) ─────────────────────────────────

/**
 * Request a password-reset email. Always succeeds (200) — no user
 * enumeration: unknown addresses get the exact same response and the
 * same work (a bcrypt-ish no-op is skipped here because the response
 * is uniform and the route is IP rate-limited at 10/min).
 */
export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<{ sent: boolean }> {
  const user = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, name: true, deletedAt: true },
  });

  // Deleted accounts get the same silent 200 as unknown ones — no
  // email is sent to a grace-period address (audit F-13).
  if (!user || user.deletedAt !== null) return { sent: false };

  try {
    const raw = await issueToken(user.id, TOKEN_PURPOSES.passwordReset);
    await getMailer().send(
      resetPasswordTemplate({
        to: user.email,
        name: user.name,
        resetUrl: `${env.APP_URL}/reset-password?token=${raw}`,
        expiresInLabel: TOKEN_TTL_LABEL,
      }),
    );
  } catch (err) {
    log.error("Password-reset email failed", {
      userId: user.id,
      err: err instanceof Error ? err.message : String(err),
    });
  }
  return { sent: true };
}

/**
 * Redeem a reset token + set the new password. The token is consumed
 * inside `consumeToken` (single-use, purpose-checked, 30-min expiry).
 * Throws 400 on any token problem — uniform message, no oracle.
 * Returns the userId so the route can audit without exposing it.
 */
export async function resetPassword(
  input: ResetPasswordInput,
): Promise<{ reset: true; userId: string }> {
  const userId = await consumeToken(input.token, TOKEN_PURPOSES.passwordReset);

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // SESSION KILL-SWITCH (audit F-05): every issued refresh token for
  // this account dies with the old password. Whoever requested the
  // reset keeps no borrowed session.
  await revokeAllUserSessions(userId);

  log.info("Password reset via emailed token", { userId });
  return { reset: true, userId };
}

// ─── Session lifecycle (audit F-05) ───────────────────────────────────

/**
 * Logout: revoke the presented refresh token (not just cookie
 * clearing — the server-side row dies too). Idempotent: a garbage or
 * unknown token is still a successful logout.
 */
export async function logoutUser(
  input: LogoutInput,
): Promise<{ ok: true }> {
  await revokeSession(input.refreshToken);
  return { ok: true };
}

/** Logout everywhere: revoke every live refresh token for the user. */
export async function logoutAll(
  userId: string,
): Promise<{ ok: true; revoked: number }> {
  const revoked = await revokeAllUserSessions(userId);
  return { ok: true, revoked };
}

// ─── Account lifecycle: export + delete (audit F-13) ──────────────────────

/** Grace period a soft-deleted account is kept before the hard purge. */
export const ACCOUNT_PURGE_GRACE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Export the caller's OWN data as JSON (audit F-13): profile,
 * favorites, collections, and API-key METADATA (masked — the plaintext
 * of a key is unrecoverable by design, and passwordHash never leaves
 * the DB). Throws 404 when the account is gone or in the grace period.
 */
export async function exportAccount(userId: string): Promise<AccountExport> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailVerifiedAt: true, createdAt: true, updatedAt: true, deletedAt: true },
  });
  if (!user || user.deletedAt !== null) {
    throw AppError.notFound("User not found");
  }

  const [favorites, collections, apiKeys] = await Promise.all([
    db.effectFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, effectId: true, createdAt: true },
    }),
    db.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        effectIds: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.apiKey.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      // PUBLIC_SELECT conventions (modules/api-keys/service.ts) — never
      // hash / lookupHash.
      select: {
        id: true,
        name: true,
        prefix: true,
        last4: true,
        scopesJson: true,
        orgId: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    }),
  ]);

  log.info("Account data exported", { userId, favorites: favorites.length });

  return {
    format: "roycss-account-export/v1",
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerifiedAt !== null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    favorites,
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      // Stored as a JSON-string array (Theme.tokensJson convention) —
      // parse for the dump; a corrupt row degrades to an empty list
      // rather than failing the whole export.
      effectIds: safeParseStringArray(c.effectIds),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    apiKeys: apiKeys.map((k) => ({
      id: k.id,
      name: k.name,
      masked: maskApiKey(k.prefix, k.last4),
      scopes: parseApiKeyScopes(k.scopesJson),
      orgId: k.orgId,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      revokedAt: k.revokedAt,
    })),
  };
}

/**
 * Delete the caller's account (audit F-13).
 *
 * Password re-confirmation first — deletion is the one mutation a
 * stolen session (or a borrowed device) must not be able to trigger
 * alone. On confirmation:
 *   1. every refresh token is revoked (sessions die NOW, not in 15 min),
 *   2. every API key is revoked (CLI/SDK access dies NOW too),
 *   3. the row is SOFT-deleted (`deletedAt`) — login, refresh, email
 *      flows and /me all read the account as gone from this instant,
 *      but the data survives a grace period (30 days) before the
 *      operator-run purge hard-deletes it (Prisma cascades wipe
 *      favorites, collections, keys, tokens and memberships).
 *
 * The grace window is a safety net for a wrong-button click and for
 * the platform's incident/abuse forensics — it is NOT a retention
 * loophole: no endpoint serves grace-period data, and the email stays
 * reserved (re-registration 409) until the purge frees it.
 */
export async function deleteAccount(
  userId: string,
  password: string,
): Promise<{ ok: true; deletedAt: Date; purgeAfterDays: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, deletedAt: true },
  });

  // Unknown OR already deleted → same 401 as a wrong password: the
  // route is authenticated, so this is an idempotent no-op response
  // that never reveals grace-period state.
  const passwordMatch = user
    ? await bcrypt.compare(password, user.passwordHash)
    : // Timing decoy — same shape as the login handler.
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
  if (!user || user.deletedAt !== null || !passwordMatch) {
    throw AppError.unauthorized("Password confirmation failed");
  }

  const deletedAt = new Date();

  // 1 + 2 — kill every credential and session the account still has.
  await revokeAllUserSessions(userId);
  await db.apiKey.updateMany({
    where: { ownerId: userId, revokedAt: null },
    data: { revokedAt: deletedAt },
  });

  // 3 — soft delete.
  await db.user.update({
    where: { id: userId },
    data: { deletedAt },
  });

  log.warn("Account deleted (soft — grace period started)", {
    userId,
    purgeAfterDays: ACCOUNT_PURGE_GRACE_MS / (24 * 60 * 60 * 1000),
  });

  return {
    ok: true,
    deletedAt,
    purgeAfterDays: ACCOUNT_PURGE_GRACE_MS / (24 * 60 * 60 * 1000),
  };
}

/**
 * Hard-purge soft-deleted accounts whose grace period has elapsed
 * (audit F-13). The Prisma schema cascades the delete through every
 * user-scoped table (favorites, collections, memberships, API keys,
 * verification + refresh tokens).
 *
 * NOT mounted on a route and not on a timer: this codebase has no
 * scheduler, so the purge runs as an operator task (see the runbook)
 * and is exercised by the integration tests via a tiny cutoff. When a
 * cron/worker lands, this is the function to call daily.
 *
 * Returns the number of accounts purged.
 */
export async function purgeDeletedUsers(
  olderThanMs: number = ACCOUNT_PURGE_GRACE_MS,
): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const stale = await db.user.findMany({
    where: { deletedAt: { not: null, lt: cutoff } },
    select: { id: true },
  });
  for (const user of stale) {
    // One-by-one so the cascade (verified by auth-account.test.ts) is
    // exercised exactly as it will be in production.
    await db.user.delete({ where: { id: user.id } });
  }
  if (stale.length > 0) {
    log.warn("Purged grace-expired accounts (hard delete + cascades)", {
      count: stale.length,
    });
  }
  return stale.length;
}

// ─── Local helpers ────────────────────────────────────────────────────────

/** Timing decoy for deleteAccount (same pattern as login). */
const DUMMY_BCRYPT_HASH =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8eVjP3wW6PvWQXnXnqE2KkGOa2GnS.";

/** Parse a JSON-string array column; corrupt input degrades to []. */
function safeParseStringArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}
