/**
 * CORS configuration.
 *
 * Allows the Next.js app (default http://localhost:3000) plus any
 * origins configured via CORS_ORIGINS. In dev, localhost-family origins
 * (localhost / 127.0.0.1 / [::1] / *.localhost, any port) are also
 * reflected so local mobile / framework dev servers work WITHOUT being
 * allowlisted; anything else is rejected. A rejected origin surfaces as
 * a 403 FORBIDDEN error envelope (issue #209) in BOTH modes — not the
 * plain-Error 500 the old `cb(Error)` form produced, and not the old
 * dev behavior of reflecting ANY Origin with credentials (a landmine if
 * a deployed env ever ran with NODE_ENV=development).
 *
 * The middleware is built through `createCorsMiddleware()` so tests can
 * exercise both modes without re-importing modules under a different
 * NODE_ENV; `corsMiddleware` is the real, constants-driven instance
 * used by app.ts.
 */
import cors, { type CorsOptions } from "cors";

import { CORS_ORIGINS, IS_PROD } from "../../config/constants.js";
import { AppError } from "./error.js";

/**
 * Localhost-family origin (issue #209): http(s)://localhost, 127.0.0.1,
 * [::1], or any *.localhost subdomain, with an optional port. Browsers
 * pin these names to the loopback interface (RFC 6761 for *.localhost),
 * so reflecting them is safe-by-construction even outside a dev
 * machine's own browser context.
 */
const LOCALHOST_ORIGIN_RE =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|(?:[a-z0-9-]+\.)+localhost)(?::\d+)?\/?$/i;

export function isLocalhostOrigin(origin: string): boolean {
  return LOCALHOST_ORIGIN_RE.test(origin);
}

/**
 * Origin decision, extracted from the middleware so both modes are
 * unit-testable (issue #209):
 *   1. the CORS_ORIGINS allowlist always wins (both modes);
 *   2. outside prod, localhost-family origins are reflected without
 *      needing an allowlist entry (the dev convenience, now GATED —
 *      arbitrary origins are no longer reflected);
 *   3. everything else rejects (403 envelope, both modes).
 */
export function isAllowedOrigin(
  origin: string,
  corsOrigins: readonly string[],
  isProd: boolean,
): boolean {
  if (corsOrigins.includes(origin)) return true;
  return !isProd && isLocalhostOrigin(origin);
}

/**
 * One-line CORS posture for the boot log (issue #209) — see index.ts.
 * Dev no longer reflects arbitrary origins, so the old landmine warning
 * is gone; the posture line documents the gated behavior instead.
 */
export function corsPosture(isProd: boolean): string {
  return isProd
    ? "allowlist only (CORS_ORIGINS); rejected origins → 403"
    : "allowlist (CORS_ORIGINS) + localhost origins; rejected origins → 403";
}

/** Options for `createCorsMiddleware` — defaults mirror the live app. */
export interface CorsMiddlewareOptions {
  isProd?: boolean;
  corsOrigins?: readonly string[];
}

/**
 * Build the CORS middleware. Defaults to the real app configuration
 * (constants-driven); tests inject `isProd`/`corsOrigins` to pin both
 * modes without module-reload gymnastics.
 */
export function createCorsMiddleware(
  options: CorsMiddlewareOptions = {},
): ReturnType<typeof cors> {
  const isProd = options.isProd ?? IS_PROD;
  const corsOrigins = options.corsOrigins ?? CORS_ORIGINS;

  const corsOptions: CorsOptions = {
    origin(origin, cb) {
      // Allow same-origin / no-origin requests (curl, server-to-server,
      // Postman).
      if (!origin) return cb(null, true);

      if (isAllowedOrigin(origin, corsOrigins, isProd)) {
        return cb(null, true);
      }

      // Rejection (issue #209), BOTH modes: an AppError flows through
      // the centralized errorHandler, so the client gets the standard
      // 403 envelope (code FORBIDDEN + requestId) instead of a plain
      // Error that fell into the unknown branch and answered 500. In
      // dev this also replaces the old reflect-anything behavior.
      cb(AppError.forbidden(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Request-Id",
      // Browser-based API-key consumers authenticate with this header
      // (src/server/middleware/api-key.ts) — it must be in allowedHeaders
      // or the preflight OPTIONS request fails (audit F-17).
      "X-API-Key",
    ],
    exposedHeaders: ["X-Request-Id"],
    credentials: true,
    maxAge: 600, // 10 min preflight cache
    optionsSuccessStatus: 204,
  };

  return cors(corsOptions);
}

export const corsMiddleware = createCorsMiddleware();
