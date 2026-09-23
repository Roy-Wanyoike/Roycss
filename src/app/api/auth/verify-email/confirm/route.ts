import { BACKEND_AUTH_URL, extractErrorMessage } from "@/lib/auth-client";
import {
  backendFetch,
  backendTimeoutResponse,
  isBackendTimeoutError,
} from "@/lib/backend-fetch";

/**
 * POST /api/auth/verify-email/confirm
 * Proxies to backend `/api/v1/auth/verify-email/confirm` (redeem the
 * emailed single-use token → emailVerifiedAt set). Invalid/expired/
 * reused tokens come back as a uniform 400.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await backendFetch(`${BACKEND_AUTH_URL}/verify-email/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as
      | { data?: { id?: string; emailVerified?: boolean }; error?: { message?: string } | string }
      | null;
    if (!res.ok || !json?.data) {
      const msg =
        (json && typeof json.error === "object" ? json.error?.message : undefined) ??
        (typeof json?.error === "string" ? json.error : undefined) ??
        `Verification failed (HTTP ${res.status})`;
      return Response.json({ error: msg }, { status: res.status });
    }
    return Response.json({ data: json.data });
  } catch (err) {
    // Hung backend (deadline abort) → clean 503 in this route's error
    // envelope — never an indefinite hang (#245; #163 covers the client side).
    if (isBackendTimeoutError(err)) return backendTimeoutResponse();
    return Response.json({ error: extractErrorMessage(err) }, { status: 500 });
  }
}
