/**
 * JWT authentication middleware.
 *
 * Reads `Authorization: Bearer <token>` header, verifies the access
 * token, and attaches the decoded payload to `req.user`. Throws
 * AppError(401) if missing, malformed, or invalid.
 *
 * Usage:
 *   router.get("/me", requireAuth, (req, res) => {
 *     res.json({ user: req.user })
 *   })
 */
import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken, type AccessTokenPayload } from "../../lib/jwt.js";
import { AppError } from "./error.js";

// Augment Express's Request with our user field.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      requestId?: string;
    }
  }
}

const BEARER_RE = /^Bearer\s+(.+)$/i;

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header) {
    next(AppError.unauthorized("Missing Authorization header"));
    return;
  }

  const match = BEARER_RE.exec(header);
  if (!match || !match[1]) {
    next(AppError.unauthorized("Malformed Authorization header. Expected: Bearer <token>"));
    return;
  }

  const token = match[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — same as requireAuth but does NOT throw if the token
 * is missing/invalid. Useful for endpoints that personalize the
 * response when authenticated but are still useful anonymously.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header) {
    next();
    return;
  }
  const match = BEARER_RE.exec(header);
  if (!match || !match[1]) {
    next();
    return;
  }
  try {
    req.user = verifyAccessToken(match[1]);
  } catch {
    // Swallow — optional auth.
  }
  next();
}
