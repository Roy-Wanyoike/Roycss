import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  BACKEND_AUTH_URL,
  cookieOptions,
  type AuthUser,
} from "@/lib/auth-client";

/**
 * GET /api/auth/me
 * Returns the current user from the backend `/me` endpoint using
 * the access cookie. On a 401, attempts exactly ONE refresh+retry
 * before giving up — the classic access/refresh refresh flow.
 */
export async function GET() {
  const c = await cookies();
  const access = c.get(ACCESS_COOKIE)?.value;
  if (!access) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const fetchMe = async (token: string): Promise<{ ok: boolean; status: number; user?: AuthUser }> => {
    const res = await fetch(`${BACKEND_AUTH_URL}/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status };
    const json = (await res.json().catch(() => null)) as { data?: AuthUser } | null;
    return { ok: true, status: 200, user: json?.data };
  };

  let result = await fetchMe(access);

  // ONE refresh+retry on 401 from the access token.
  if (!result.ok && result.status === 401) {
    const refresh = c.get(REFRESH_COOKIE)?.value;
    if (!refresh) return Response.json({ error: "Session expired" }, { status: 401 });

    const refreshRes = await fetch(`${BACKEND_AUTH_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
      cache: "no-store",
    });
    const refreshJson = (await refreshRes.json().catch(() => null)) as
      | { data?: { accessToken?: string; refreshToken?: string } }
      | null;
    if (!refreshRes.ok || !refreshJson?.data?.accessToken) {
      c.delete(ACCESS_COOKIE);
      c.delete(REFRESH_COOKIE);
      return Response.json({ error: "Session expired" }, { status: 401 });
    }
    const newAccess = refreshJson.data.accessToken;
    const newRefresh = refreshJson.data.refreshToken;
    c.set(ACCESS_COOKIE, newAccess, { ...cookieOptions, maxAge: 60 * 15 });
    if (newRefresh) c.set(REFRESH_COOKIE, newRefresh, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    result = await fetchMe(newAccess);
  }

  if (!result.ok || !result.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  return Response.json({ data: result.user });
}
