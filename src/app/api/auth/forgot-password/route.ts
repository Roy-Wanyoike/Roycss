import { BACKEND_AUTH_URL, extractErrorMessage } from "@/lib/auth-client";

/**
 * POST /api/auth/forgot-password
 * Proxies to backend `/api/v1/auth/forgot-password`. The backend ALWAYS
 * answers 200 with the same shape for known and unknown addresses (no
 * user enumeration — audit F-02); this proxy keeps that contract.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_AUTH_URL}/forgot-password`, {
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
        message: "If that address has a RoyCSS account, a password-reset link is on its way.",
      },
    });
  } catch (err) {
    return Response.json({ error: extractErrorMessage(err) }, { status: 500 });
  }
}
