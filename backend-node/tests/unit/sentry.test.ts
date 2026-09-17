/**
 * Unit tests — Sentry wiring (issue #119 / PRD-F11).
 *
 *   initSentry()
 *     1. no-ops (Sentry.init NOT called) when SENTRY_DSN is absent —
 *        importing the module alone also has zero side effects
 *     2. calls Sentry.init with the DSN (+ environment/release) when
 *        SENTRY_DSN is present
 *
 *   error pipeline parity
 *     3. the same JSON envelope { error: { code, message } } is returned
 *        with AND without Sentry enabled (rate-limiter.test.ts pattern:
 *        bare express app + real errorHandler + supertest)
 *     4. when enabled, only 5xx-class errors are reported — a Zod
 *        validation error (400) passes through uncaptured
 *
 * @sentry/node is fully mocked — no network, no global SDK state.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { z } from "zod";

vi.mock("@sentry/node", () => {
  // Mirrors the real handler contract: capture, then forward via next(err).
  const captureException = vi.fn();
  const sentryErrorMiddleware = (
    err: unknown,
    _req: unknown,
    _res: unknown,
    next: (err?: unknown) => void,
  ): void => {
    captureException(err);
    next(err);
  };
  const init = vi.fn();
  const expressErrorHandler = vi.fn(() => sentryErrorMiddleware);
  return { init, expressErrorHandler, captureException };
});

import * as Sentry from "@sentry/node";
import { _resetEnvCacheForTest } from "../../src/config/env.js";
import { AppError, errorHandler } from "../../src/server/middleware/error.js";
import {
  _resetSentryForTest,
  initSentry,
  isSentryEnabled,
  sentryErrorHandler,
} from "../../src/lib/sentry.js";

const initMock = Sentry.init as unknown as Mock;
const captureExceptionMock = Sentry.captureException as unknown as Mock;

const FAKE_DSN = "https://abc123def456@o0.ingest.sentry.io/42";

/** Bare app wired like app.ts: throwing route → sentryErrorHandler → errorHandler. */
function buildErrorApp(): Express {
  const app = express();
  app.get("/boom", () => {
    throw new Error("boom");
  });
  app.get("/bad-input", () => {
    // Zod v4 issue objects are fiddly to hand-write — derive a real one.
    throw z.string().min(8).parse("short");
  });
  app.get("/missing", () => {
    throw AppError.notFound("Resource not found");
  });
  app.use(sentryErrorHandler);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.SENTRY_DSN;
  _resetEnvCacheForTest();
  _resetSentryForTest();
});

afterEach(() => {
  // Restore hermetic state for any test file sharing this worker process.
  delete process.env.SENTRY_DSN;
  _resetEnvCacheForTest();
  _resetSentryForTest();
});

describe("initSentry (issue #119)", () => {
  it("1. no-ops when SENTRY_DSN is absent — init is never called", () => {
    // Importing the module graph above already proves no import-time
    // side effects; pin it before the first explicit call.
    expect(initMock).not.toHaveBeenCalled();
    expect(isSentryEnabled()).toBe(false);

    const enabled = initSentry();

    expect(enabled).toBe(false);
    expect(isSentryEnabled()).toBe(false);
    expect(initMock).not.toHaveBeenCalled();
    expect(Sentry.expressErrorHandler as unknown as Mock).not.toHaveBeenCalled();
  });

  it("2. calls Sentry.init with the DSN when SENTRY_DSN is present", () => {
    process.env.SENTRY_DSN = FAKE_DSN;
    _resetEnvCacheForTest();

    const enabled = initSentry();

    expect(enabled).toBe(true);
    expect(isSentryEnabled()).toBe(true);
    expect(initMock).toHaveBeenCalledTimes(1);
    const [firstCall] = initMock.mock.calls;
    expect(firstCall).toBeDefined();
    const options = firstCall![0] as Record<string, unknown>;
    expect(options.dsn).toBe(FAKE_DSN);
    // Vitest sets NODE_ENV=test itself; dev shells run "development".
    expect(["development", "test"]).toContain(options.environment);
    expect(typeof options.release).toBe("string");
  });
});

describe("error pipeline parity (issue #119)", () => {
  it("3. same JSON envelope with and without Sentry; unknown 500 errors are captured when enabled", async () => {
    // ── WITHOUT Sentry ──────────────────────────────────────────────────
    const withoutSentry = buildErrorApp();
    const before = await request(withoutSentry).get("/boom");
    expect(before.status).toBe(500);
    expect(before.body.error.code).toBe("INTERNAL_ERROR");
    expect(before.body.error.message).toBe("boom"); // dev mode: real message
    expect(captureExceptionMock).not.toHaveBeenCalled();

    // ── WITH Sentry ─────────────────────────────────────────────────────
    process.env.SENTRY_DSN = FAKE_DSN;
    _resetEnvCacheForTest();
    expect(initSentry()).toBe(true);

    const withSentry = buildErrorApp();
    const after = await request(withSentry).get("/boom");

    // Envelope unchanged — Sentry reports upstream, the client sees the
    // exact same shape/fields as the disabled run.
    expect(after.status).toBe(500);
    expect(after.body.error).toEqual(before.body.error);
    expect(after.body.requestId).toEqual(before.body.requestId);
    // The unknown Error was reported (5xx class).
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect((captureExceptionMock.mock.calls[0] as unknown[])[0]).toBeInstanceOf(
      Error,
    );
  });

  it("4. expected 4xx errors are NOT captured when enabled (no Sentry noise)", async () => {
    process.env.SENTRY_DSN = FAKE_DSN;
    _resetEnvCacheForTest();
    expect(initSentry()).toBe(true);

    const app = buildErrorApp();

    // Zod validation error → 400 VALIDATION_ERROR envelope, not reported.
    const badInput = await request(app).get("/bad-input");
    expect(badInput.status).toBe(400);
    expect(badInput.body.error.code).toBe("VALIDATION_ERROR");

    // Operational AppError → 404 NOT_FOUND envelope, not reported.
    const missing = await request(app).get("/missing");
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");

    expect(captureExceptionMock).not.toHaveBeenCalled();
  });
});
