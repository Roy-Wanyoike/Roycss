/**
 * AuthClient — shared types + cookie helpers for the Next.js auth proxy.
 *
 * The actual JWT pair is stored in two httpOnly cookies so that no
 * token ever touches client-side JavaScript. These helpers are only
 * imported by server routes under `src/app/api/auth/*`.
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

/** Cookie names — never renamed without coordinated migration. */
export const ACCESS_COOKIE = "roycss-access";
export const REFRESH_COOKIE = "roycss-refresh";

/** Cookie options shared by every auth cookie. */
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Backend auth base URL — never exposed to the browser. */
export const BACKEND_AUTH_URL = "http://localhost:4000/api/v1/auth";

/**
 * Coerce any thrown value (Error, fetch Response.json, plain string)
 * into a human-readable message. Used by every proxy route handler.
 */
export function extractErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "Request failed";
}
