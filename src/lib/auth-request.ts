/**
 * Auth request — bounded client fetch for the auth flows (issue #163).
 *
 * The Next.js auth proxy routes forward to the backend service; when
 * that service is unreachable the transport can hang indefinitely, which
 * left the sign-in button stuck on "Signing in..." with no feedback and
 * no recovery.
 *
 * `authRequest` wraps fetch with an `AbortController` timeout so every
 * outcome is bounded and mapped to a safe Error the sheets already
 * render inline (role="alert"):
 * - HTTP error responses  → returned to the caller untouched (existing
 *   backend-message passthrough is preserved).
 * - timeout / abort / network failure → `AUTH_UNREACHABLE_MESSAGE`
 *   (same copy style as `contact-form.ts` CONTACT_UNREACHABLE_MESSAGE).
 *
 * Wired into login / register (auth-context) and forgot-password
 * (login-sheet). Background calls (/me, /logout) intentionally keep
 * plain fetch — they are non-blocking and already fail soft.
 */

/** Shown when an auth request never completes (timeout / offline). */
export const AUTH_UNREACHABLE_MESSAGE =
  "Couldn't reach the service — try again.";

/** Hard ceiling for one auth request (issue #163: ~15s). */
export const AUTH_REQUEST_TIMEOUT_MS = 15_000;

/** Minimal fetch surface — mockable in unit tests. */
export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Response | Promise<Response>;

/** Bound wrapper — a detached `window.fetch` throws in browsers. */
const globalFetch: FetchLike = (...args) => fetch(...args);

/**
 * POST/GET an auth endpoint with a hard ~15s deadline.
 *
 * Resolves with the raw `Response` so callers keep their existing
 * status/payload handling (backend-provided error messages still
 * surface). Rejects with a safe, actionable `Error` when the request
 * times out, is aborted, or the network fails.
 */
export async function authRequest(
  url: string,
  init: RequestInit = {},
  fetcher: FetchLike = globalFetch,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    AUTH_REQUEST_TIMEOUT_MS,
  );
  try {
    return await fetcher(url, { ...init, signal: controller.signal });
  } catch {
    // fetch rejects on network failure / offline / deadline abort.
    throw new Error(AUTH_UNREACHABLE_MESSAGE);
  } finally {
    clearTimeout(timer);
  }
}
