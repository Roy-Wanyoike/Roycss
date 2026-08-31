/**
 * Auth service — registration, login, refresh, current user.
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

import { db } from "../../lib/db.js";
import {
  signTokenPair,
  verifyRefreshToken,
} from "../../lib/jwt.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import type {
  LoginInput,
  PublicUser,
  RegisterInput,
} from "./schema.js";

const log = createLogger("auth");

const BCRYPT_ROUNDS = 10;

function toPublicUser(u: {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}): PublicUser {
  return { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt };
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
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const tokens = signTokenPair({ sub: user.id, email: user.email });

  log.info("User registered", { userId: user.id, email: user.email });

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

  const tokens = signTokenPair({ sub: user.id, email: user.email });

  log.info("User logged in", { userId: user.id, email: user.email });

  return {
    user: toPublicUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

/**
 * Exchange a refresh token for a new access + refresh token pair.
 * Throws 401 if the refresh token is invalid or the user no longer exists.
 */
export async function refreshTokens(
  refreshToken: string,
): Promise<{ user: PublicUser; accessToken: string; refreshToken: string; expiresIn: number }> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) {
    throw AppError.unauthorized("User no longer exists");
  }
  // Re-issue with the current email so refresh tokens stay in sync
  // after an email change.
  const tokens = signTokenPair({ sub: user.id, email: user.email });

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
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) {
    throw AppError.notFound("User not found");
  }
  return toPublicUser(user);
}
