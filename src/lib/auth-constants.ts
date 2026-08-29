/**
 * Shared constants for the frontend auth proxy routes.
 *
 * Centralized so a single source of truth drives cookie names + backend URL
 * across all 5 routes (login/register/refresh/logout/me) + AuthContext.
 */

const BACKEND_AUTH_URL =
  process.env.BACKEND_AUTH_URL ?? "http://localhost:4000";

/**
 * The two httpOnly cookie names — kept short to stay under the 4KB
 * browser limit even when the JWT has many claims, and prefixed with
 * `roycss-` so they don't collide with any 3rd-party cookie.
 */
export const AUTH_COOKIE_NAMES = {
  access: "roycss-access",
  refresh: "roycss-refresh",
} as const;

/**
 * Direct URL to the backend auth base path. The proxy routes append
 * `/login`, `/register`, etc.
 */
export { BACKEND_AUTH_URL };
