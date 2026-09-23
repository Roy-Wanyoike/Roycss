import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  BACKEND_AUTH_URL,
  cookieOptions,
  extractErrorMessage,
} from "@/lib/auth-client";
import {
  backendFetch,
  backendTimeoutResponse,
  isBackendTimeoutError,
} from "@/lib/backend-fetch";

/**
 * POST /api/auth/refresh
 * Reads the refresh cookie, exchanges it for a new access token at
 * the backend, and rotates the refresh cookie too.
 */
export async function POST() {
  const c = await cookies();
  const refreshToken = c.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return Response.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const res = await backendFetch(`${BACKEND_AUTH_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as
      | { data?: { accessToken?: string; refreshToken?: string }; error?: { message?: string } | string }
      | null;
    if (!res.ok || !json?.data) {
      const msg =
        (json && typeof json.error === "object" ? json.error?.message : undefined) ??
        (typeof json?.error === "string" ? json.error : undefined) ??
        `Refresh failed (HTTP ${res.status})`;
      // Clear stale cookies if the refresh token was rejected.
      c.delete(ACCESS_COOKIE);
      c.delete(REFRESH_COOKIE);
      return Response.json({ error: msg }, { status: res.status });
    }
    const { accessToken, refreshToken: newRefresh } = json.data;
    if (accessToken) c.set(ACCESS_COOKIE, accessToken, { ...cookieOptions, maxAge: 60 * 15 });
    if (newRefresh) c.set(REFRESH_COOKIE, newRefresh, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    return Response.json({ data: { ok: true } });
  } catch (err) {
    // Hung backend (deadline abort) → clean 503 in this route's error
    // envelope — never an indefinite hang (#245; #163 covers the client side).
    if (isBackendTimeoutError(err)) return backendTimeoutResponse();
    return Response.json({ error: extractErrorMessage(err) }, { status: 500 });
  }
}
