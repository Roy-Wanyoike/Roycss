import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-client";

/**
 * POST /api/auth/logout
 * Clears both auth cookies. The backend is stateless (JWT only),
 * so the tokens become invalid only on expiry; we still clear the
 * cookies so the browser no longer sends them.
 */
export async function POST() {
  const c = await cookies();
  c.delete(ACCESS_COOKIE);
  c.delete(REFRESH_COOKIE);
  return Response.json({ data: { ok: true } });
}
