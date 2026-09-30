import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  BACKEND_AUTH_URL,
} from "@/lib/auth-client";
import { backendFetch } from "@/lib/backend-fetch";
import { API_RATE_TIERS, guardApiWrite } from "@/lib/api-security";

/**
 * POST /api/auth/logout
 * Signs the user out for real (audit F-05): forwards the refresh cookie
 * to the backend so its RefreshToken row is REVOKED (rotation makes
 * refresh tokens single-use, revocation is the kill switch), then
 * clears both cookies. Best-effort — if the backend is unreachable the
 * cookies still clear, and the row dies on its own expiry.
 */
export async function POST(req: Request) {
  // #275: same-origin verification (403) + per-IP rate limit (429, auth
  // tier 10/min — mirrors the backend authRateLimit tier). Fail-closed.
  const denied = guardApiWrite(req, { route: "auth-logout", ...API_RATE_TIERS.auth });
  if (denied) return denied;

  const c = await cookies();
  const refreshToken = c.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await backendFetch(`${BACKEND_AUTH_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    } catch {
      // Revocation is best-effort — clear the cookies regardless.
    }
  }
  c.delete(ACCESS_COOKIE);
  c.delete(REFRESH_COOKIE);
  return Response.json({ data: { ok: true } });
}
