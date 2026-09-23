import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  BACKEND_AUTH_URL,
  cookieOptions,
  extractErrorMessage,
  type AuthUser,
} from "@/lib/auth-client";
import {
  backendFetch,
  backendTimeoutResponse,
  isBackendTimeoutError,
} from "@/lib/backend-fetch";

/**
 * POST /api/auth/register
 * Proxies to backend `/api/v1/auth/register`, then sets httpOnly
 * cookies and returns the new user.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await backendFetch(`${BACKEND_AUTH_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as
      | { data?: { user?: AuthUser; accessToken?: string; refreshToken?: string }; error?: { message?: string } | string }
      | null;
    if (!res.ok || !json?.data) {
      const msg =
        (json && typeof json.error === "object" ? json.error?.message : undefined) ??
        (typeof json?.error === "string" ? json.error : undefined) ??
        `Registration failed (HTTP ${res.status})`;
      return Response.json({ error: msg }, { status: res.status });
    }
    const { user, accessToken, refreshToken } = json.data;
    const c = await cookies();
    if (accessToken) c.set(ACCESS_COOKIE, accessToken, { ...cookieOptions, maxAge: 60 * 15 });
    if (refreshToken) c.set(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    return Response.json({ data: user });
  } catch (err) {
    // Hung backend (deadline abort) → clean 503 in this route's error
    // envelope — never an indefinite hang (#245; #163 covers the client side).
    if (isBackendTimeoutError(err)) return backendTimeoutResponse();
    return Response.json({ error: extractErrorMessage(err) }, { status: 500 });
  }
}
