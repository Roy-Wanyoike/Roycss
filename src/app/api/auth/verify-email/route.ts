import { BACKEND_AUTH_URL, extractErrorMessage } from "@/lib/auth-client";
import {
  backendFetch,
  backendTimeoutResponse,
  isBackendTimeoutError,
} from "@/lib/backend-fetch";

/**
 * POST /api/auth/verify-email
 * Proxies to backend `/api/v1/auth/verify-email` ((re)send a
 * verification email). Same no-enumeration contract as forgot-password:
 * always 200 with the identical shape.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await backendFetch(`${BACKEND_AUTH_URL}/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as
      | { data?: { sent?: boolean; message?: string }; error?: { message?: string } | string }
      | null;
    if (!res.ok) {
      const msg =
        (json && typeof json.error === "object" ? json.error?.message : undefined) ??
        (typeof json?.error === "string" ? json.error : undefined) ??
        `Request failed (HTTP ${res.status})`;
      return Response.json({ error: msg }, { status: res.status });
    }
    return Response.json({
      data: json?.data ?? {
        sent: true,
        message:
          "If that address has an unverified RoyCSS account, a verification link is on its way.",
      },
    });
  } catch (err) {
    // Hung backend (deadline abort) → clean 503 in this route's error
    // envelope — never an indefinite hang (#245; #163 covers the client side).
    if (isBackendTimeoutError(err)) return backendTimeoutResponse();
    return Response.json({ error: extractErrorMessage(err) }, { status: 500 });
  }
}
