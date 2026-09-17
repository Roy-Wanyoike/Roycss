/**
 * Sentry error-tracking wiring (issue #119 / PRD-F11).
 *
 * `src/config/env.ts` has validated SENTRY_DSN since the beginning, but
 * nothing ever consumed it — no init, no reporting. This module is the
 * missing half:
 *
 *   - `initSentry()`          — explicit startup hook (called from
 *                                src/index.ts, NOT at import time) that
 *                                initializes the Sentry Node SDK only
 *                                when `env.SENTRY_DSN` is set. Without
 *                                the env var it logs once and no-ops, so
 *                                dev/test behavior is byte-identical to
 *                                the pre-Sentry app.
 *   - `sentryErrorHandler`    — Express error middleware mounted right
 *                                BEFORE the JSON error handler (per the
 *                                @sentry/node Express docs: after all
 *                                controllers, before any other error
 *                                middleware). While Sentry is disabled it
 *                                is a pure `next(err)` pass-through; when
 *                                enabled it reports the error upstream and
 *                                still forwards it, so the public JSON
 *                                envelope (`{ error: { code, message },
 *                                requestId }`) is unchanged either way.
 *
 * Capture policy: only errors the JSON handler would classify as 5xx are
 * reported (mirrors the status mapping in server/middleware/error.ts —
 * Zod validation failures and operational AppErrors/Prisma conflicts are
 * expected client errors, not crashes, and would only be noise upstream).
 */
import {
  expressErrorHandler as sentryExpressErrorHandler,
  init as sentryInit,
} from "@sentry/node";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { APP_NAME, APP_VERSION } from "../config/constants.js";
import { env } from "../config/env.js";
import { AppError } from "../server/middleware/error.js";
import { logger } from "./logger.js";

/** The Sentry error middleware, created at init time (null = disabled). */
type SentryErrorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
let sentryErrorMiddleware: SentryErrorMiddleware | null = null;

/**
 * Initialize Sentry — call once at server startup (src/index.ts).
 *
 * No-ops (returns false, never touches `Sentry.init`) when SENTRY_DSN is
 * unset; otherwise initializes the SDK with the DSN and enables the error
 * middleware. Idempotent-ish: a second call while enabled only refreshes
 * the middleware reference.
 *
 * @returns true when Sentry was initialized, false when disabled.
 */
export function initSentry(): boolean {
  const dsn = env.SENTRY_DSN;
  if (!dsn) {
    // Deterministic no-op: even if a previous call had enabled the SDK,
    // the error middleware goes back to pass-through. (Production calls
    // this exactly once at boot, but keeping it order-independent costs
    // nothing and makes the unit tests hermetic.)
    sentryErrorMiddleware = null;
    logger.info("SENTRY_DSN not set — Sentry error tracking disabled");
    return false;
  }

  sentryInit({
    dsn,
    environment: env.NODE_ENV,
    release: `${APP_NAME}@${APP_VERSION}`,
  });

  // The SDK's own Express error middleware (adds the `auto.middleware.express`
  // mechanism + `res.sentry` event id, then forwards via next(err)). Retyped
  // to the express handler signature — Sentry ships its own structural types
  // for req/res/next that are runtime-compatible but not identical.
  sentryErrorMiddleware =
    sentryExpressErrorHandler() as unknown as SentryErrorMiddleware;

  logger.info("Sentry error tracking enabled", {
    dsn: dsnTarget(dsn),
    environment: env.NODE_ENV,
    release: `${APP_NAME}@${APP_VERSION}`,
  });
  return true;
}

/** Whether initSentry() has activated the SDK in this process. */
export function isSentryEnabled(): boolean {
  return sentryErrorMiddleware !== null;
}

/**
 * Test seam (same convention as `_resetMailerForTest`) — returns the
 * module to the disabled (pass-through) state. Production never calls it.
 */
export function _resetSentryForTest(): void {
  sentryErrorMiddleware = null;
}

/**
 * Express error middleware — mount immediately BEFORE the JSON error
 * handler (app.ts). Pass-through while Sentry is disabled; when enabled,
 * reports 5xx-class errors upstream and forwards the error either way so
 * the JSON error handler still produces the exact same response.
 */
export function sentryErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!sentryErrorMiddleware) {
    // Sentry disabled — zero behavior change.
    next(err);
    return;
  }
  if (sentryStatusFor(err) >= 500) {
    sentryErrorMiddleware(err, req, res, next);
    return;
  }
  // Expected 4xx-class error (validation / not-found / conflict / rate
  // limit) — not a bug, don't report it.
  next(err);
}

/**
 * Mirror of the status the JSON error handler (server/middleware/error.ts)
 * will pick for this error — keeps "what Sentry sees" aligned with "what
 * the client sees" so only genuine 5xx failures get reported.
 */
function sentryStatusFor(err: unknown): number {
  if (err instanceof ZodError) return 400; // VALIDATION_ERROR
  if (err instanceof AppError) return err.statusCode;
  const candidate = err as { code?: unknown };
  if (candidate?.code === "P2002") return 409; // unique constraint → CONFLICT
  if (candidate?.code === "P2025") return 404; // record not found → NOT_FOUND
  return 500; // unknown → INTERNAL_ERROR
}

/** Log-safe DSN summary: host + project (drops the public key prefix). */
function dsnTarget(dsn: string): string {
  try {
    const url = new URL(dsn);
    return `${url.host}${url.pathname}`;
  } catch {
    return "<invalid-dsn>";
  }
}
