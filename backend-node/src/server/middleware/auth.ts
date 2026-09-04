/**
 * JWT authentication + organization role authorization middleware.
 *
 * ─── requireAuth ─────────────────────────────────────────────────────────
 * Reads `Authorization: Bearer <token>` header, verifies the access
 * token, and attaches the decoded payload to `req.user`. Throws
 * AppError(401) if missing, malformed, or invalid.
 *
 * Usage:
 *   router.get("/me", requireAuth, (req, res) => {
 *     res.json({ user: req.user })
 *   })
 *
 * ─── requireRole (issue #64) ──────────────────────────────────────────
 * Composable org-scoped role check that MUST run after `requireAuth`.
 * Resolves the organization id for the request, loads the caller's
 * Membership from the database, and rejects with 403 when the caller
 * is not a member or their role is below the required minimum.
 *
 * Role hierarchy: OWNER > ADMIN > MEMBER > VIEWER.
 *
 * Org-id resolution (first hit wins):
 *   1. `options.orgIdFrom(req)` — custom (possibly async) resolver for
 *      routes that do not key by org id directly (e.g. governance
 *      approvals resolve org via their policy). Returning null/undefined
 *      from a custom resolver means "resource is not org-scoped" — the
 *      role check is skipped and authentication alone gates the request.
 *   2. Default: `req.params.orgId` → `req.params.id` → `req.body.orgId`.
 *      If none resolve, the middleware fails CLOSED with 400 (a role
 *      check was requested but no org context exists).
 *
 * Usage:
 *   router.post(
 *     "/organizations/:orgId/teams",
 *     requireAuth,
 *     requireRole("ADMIN"),
 *     validateBody(schema),
 *     handler,
 *   )
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { db } from "../../lib/db.js";
import { verifyAccessToken, type AccessTokenPayload } from "../../lib/jwt.js";
import { AppError, asyncHandler } from "./error.js";

// Augment Express's Request with our user field.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      /** Set by requireRole on success — the caller's org membership. */
      membership?: RequestMembership;
      requestId?: string;
    }
  }
}

/** The caller's organization membership, attached by requireRole. */
export interface RequestMembership {
  orgId: string;
  userId: string;
  role: OrgRole;
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

// ─── Organization role authorization (issue #64) ───────────────────────────
//
// Roles, most to least privileged. Prisma `enum` is unsupported on
// SQLite, so memberships store the role as a plain string and it is
// validated here (single source of truth for the allowed values).
export const ORG_ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

const ROLE_RANK: Record<OrgRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
  VIEWER: 0,
};

/** Narrow a stored role string to OrgRole, or null if unrecognized. */
function toOrgRole(raw: string): OrgRole | null {
  const upper = raw.trim().toUpperCase() as OrgRole;
  return (ORG_ROLES as readonly string[]).includes(upper) ? upper : null;
}

export interface RequireRoleOptions {
  /**
   * Custom org-id resolution for routes that do not key by org id
   * directly (e.g. governance approvals resolve their org through the
   * owning policy). May be async.
   *
   * Contract: return the org id to enforce the role check against, or
   * null/undefined/"" when the target resource is NOT org-scoped — in
   * that case the role check is skipped and authentication alone gates
   * the request.
   */
  orgIdFrom?: (
    req: Request,
  ) => string | null | undefined | Promise<string | null | undefined>;
}

/**
 * Default org-id resolution for routes that DO key by org id:
 * `req.params.orgId` → `req.params.id` → `req.body.orgId`.
 */
function defaultOrgIdFrom(req: Request): string | null {
  const params = req.params as Record<string, string | undefined> | undefined;
  const body = req.body as Record<string, unknown> | undefined | null;
  const bodyOrgId =
    body && typeof body.orgId === "string" && body.orgId.length > 0
      ? body.orgId
      : undefined;
  return params?.orgId ?? params?.id ?? bodyOrgId ?? null;
}

/**
 * Require that the authenticated caller holds `minimumRole` or higher
 * in the organization this request targets (see RequireRoleOptions for
 * how the org is resolved). Rejects with:
 *   - 401 when requireAuth has not run (route misconfiguration — fail closed)
 *   - 403 when the caller has no membership for the org
 *   - 403 when the caller's stored role is not a known OrgRole
 *   - 403 when the caller's role ranks below the minimum
 *   - 400 when the DEFAULT resolver cannot find any org context
 *
 * On success the membership is attached to `req.membership` for handlers.
 *
 * NOTE: this must be mounted AFTER `requireAuth` in the middleware chain.
 */
export function requireRole(
  minimumRole: OrgRole,
  options: RequireRoleOptions = {},
): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    // Fail closed — requireRole without a preceding requireAuth is a
    // route wiring bug, not a client error.
    if (!req.user) {
      next(AppError.unauthorized("Authentication required before role check"));
      return;
    }

    let orgId: string | null | undefined;
    if (options.orgIdFrom) {
      orgId = await options.orgIdFrom(req);
      // Custom resolver: null/undefined/"" means "not org-scoped" —
      // authentication alone gates the request.
      if (orgId === null || orgId === undefined || orgId === "") {
        next();
        return;
      }
    } else {
      orgId = defaultOrgIdFrom(req);
      if (!orgId) {
        // Default resolution found no org context. Fail closed rather
        // than silently allowing every authenticated caller through.
        next(
          AppError.badRequest(
            "Organization context is required for role-based access",
          ),
        );
        return;
      }
    }

    const membership = await db.membership.findFirst({
      where: { userId: req.user.sub, orgId },
      select: { orgId: true, userId: true, role: true },
    });
    if (!membership) {
      next(
        AppError.forbidden(
          `You are not a member of organization '${orgId}'`,
        ),
      );
      return;
    }

    const role = toOrgRole(membership.role);
    if (!role) {
      // Unknown role stored on the membership — treat as no access.
      next(
        AppError.forbidden(
          `Membership has an unrecognized role '${membership.role}'`,
        ),
      );
      return;
    }

    if (ROLE_RANK[role] < ROLE_RANK[minimumRole]) {
      next(
        AppError.forbidden(
          `Requires role ${minimumRole} or higher in organization '${orgId}' (you have ${role})`,
        ),
      );
      return;
    }

    req.membership = {
      orgId: membership.orgId,
      userId: membership.userId,
      role,
    };
    next();
  });
}
