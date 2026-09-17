/**
 * Session-token promotion for the /api/v1 gateway seam (issue #122 / PRD-F21).
 *
 * The site keeps its JWT pair in httpOnly cookies (see src/lib/auth-client.ts)
 * so a browser request never carries an `Authorization` header — yet backend
 * endpoints such as `/api/v1/auth/api-keys` authenticate via
 * `Authorization: Bearer <access-token>`. The gateway (src/lib/api-gateway.ts)
 * uses these pure helpers to promote the access cookie into that header,
 * making the ONE api seam (api-client → /api/v1/* → gateway) carry session
 * auth for browser traffic. Explicit `Authorization` headers from CLI/SDK
 * callers are always forwarded untouched and never re-derived here.
 *
 * Pure string parsing (no Next/server imports) so it is unit-testable in the
 * node vitest environment.
 */
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./auth-client";

/**
 * Extract one cookie's value from a raw `Cookie` request header.
 * Returns null when the header is absent or the cookie is missing/empty.
 */
export function cookieValue(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (typeof cookieHeader !== "string" || cookieHeader.length === 0) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    // eq <= 0 skips both "novalue" (no =) and "=value" (empty name).
    if (eq <= 0) continue;
    if (part.slice(0, eq).trim() === name) {
      const value = part.slice(eq + 1).trim();
      return value.length > 0 ? value : null;
    }
  }
  return null;
}

/**
 * The access-token JWT from a raw `Cookie` header, or null when the visitor
 * has no session. This is the value the gateway promotes to
 * `Authorization: Bearer <token>` when the incoming request has no
 * Authorization header of its own.
 */
export function accessCookieValue(
  cookieHeader: string | null | undefined,
): string | null {
  return cookieValue(cookieHeader, ACCESS_COOKIE);
}

/**
 * The refresh-token JWT from a raw `Cookie` header, or null. Used by the
 * gateway's ONE refresh+retry (same policy as /api/auth/me) when a
 * cookie-derived access token was rejected with 401.
 */
export function refreshCookieValue(
  cookieHeader: string | null | undefined,
): string | null {
  return cookieValue(cookieHeader, REFRESH_COOKIE);
}
