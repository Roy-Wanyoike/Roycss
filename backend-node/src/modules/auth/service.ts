/**
 * Auth service — registration, login, refresh, current user,
 * email verification + password reset (PF-011 / audit F-02).
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
    },
  });

  // Always run a bcrypt compare even if the user doesn't exist, to
  // avoid leaking which emails are registered via timing differences.
  // The dummy hash below is just a valid bcrypt hash of garbage.
  const DUMMY_HASH =
    "$2a$10$CwTycUXWue0Thq9StjUM0uJ8eVjP3wW6PvWQXnXnqE2KkGOa2GnS.";
  const passwordMatch = user
    ? await bcrypt.compare(input.password, user.passwordHash)
    : await bcrypt.compare(input.password, DUMMY_HASH);

  if (!user || !passwordMatch) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const tokens = await issueSession(user);

  log.info("User logged in", {
    userId: user.id,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
  });

  return {
    user: toPublicUser(user),
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
    select: { id: true, email: true, name: true, emailVerifiedAt: true, createdAt: true },
  });
  if (!user) {
    // User deleted between rotation and read — revoke what we just made.
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
    select: { id: true, email: true, name: true, emailVerifiedAt: true, createdAt: true },
  });
  if (!user) {
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
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  });

  // Unknown email OR already verified → identical silent success.
  if (!user || user.emailVerifiedAt !== null) return { sent: false };

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
    select: { id: true, email: true, name: true },
  });

  if (!user) return { sent: false };

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
