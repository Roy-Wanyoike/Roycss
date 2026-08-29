/**
 * JWT sign/verify helpers — wraps jsonwebtoken with typed payloads
 * and our central config (issuer, audience, secrets, expiries).
 *
 * Two token kinds:
 *   - access  : short-lived (default 15m), used to authenticate API calls
 *   - refresh : long-lived (default 7d),  used to obtain new access tokens
 *
 * Both are signed with HS256. Refresh uses a *different* secret so that
 * an access-token leak cannot mint refresh tokens.
 */
import jwt, { type SignOptions, type VerifyOptions } from "jsonwebtoken";

import { JWT_CONFIG } from "../config/constants.js";
import { AppError, ErrorCode } from "../server/middleware/error.js";

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string; // user id
  email: string;
  type: "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access token expiry in seconds (for client-side expiry tracking). */
  expiresIn: number;
}

const BASE_SIGN_OPTS: SignOptions = {
  issuer: JWT_CONFIG.issuer,
  audience: JWT_CONFIG.audience,
};

const BASE_VERIFY_OPTS: VerifyOptions = {
  issuer: JWT_CONFIG.issuer,
  audience: JWT_CONFIG.audience,
};

/** Convert a human-readable duration string ("15m", "7d") to seconds. */
function durationToSeconds(input: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(input.trim());
  if (!match) return 900; // default 15m if malformed
  const n = Number.parseInt(match[1]!, 10);
  const unit = match[2];
  switch (unit) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    default:
      return 900;
  }
}

/** Sign a new access token. */
export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" } satisfies AccessTokenPayload,
    JWT_CONFIG.secret,
    { ...BASE_SIGN_OPTS, expiresIn: durationToSeconds(JWT_CONFIG.expiresIn) },
  );
}

/** Sign a new refresh token. */
export function signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "refresh" } satisfies RefreshTokenPayload,
    JWT_CONFIG.refreshSecret,
    { ...BASE_SIGN_OPTS, expiresIn: durationToSeconds(JWT_CONFIG.refreshExpiresIn) },
  );
}

/** Sign both tokens at once — typical post-login response. */
export function signTokenPair(payload: {
  sub: string;
  email: string;
}): TokenPair {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: durationToSeconds(JWT_CONFIG.expiresIn),
  };
}

/** Verify an access token. Throws AppError on failure. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret, BASE_VERIFY_OPTS);
    const payload = decoded as unknown as AccessTokenPayload;
    if (payload.type !== "access") {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Invalid token type",
        401,
      );
    }
    return payload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Invalid or expired access token",
      401,
      { reason: err instanceof Error ? err.message : "unknown" },
    );
  }
}

/** Verify a refresh token. Throws AppError on failure. */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(
      token,
      JWT_CONFIG.refreshSecret,
      BASE_VERIFY_OPTS,
    );
    const payload = decoded as unknown as RefreshTokenPayload;
    if (payload.type !== "refresh") {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Invalid token type",
        401,
      );
    }
    return payload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Invalid or expired refresh token",
      401,
      { reason: err instanceof Error ? err.message : "unknown" },
    );
  }
}
