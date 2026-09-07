/**
 * Shared supertest client + assertion helpers for the contract, integration
 * and security suites (PF-007).
 *
 * Follows the conventions established by tests/integration/auth.test.ts:
 *   - unique emails (uuid suffix) so runs never collide on `User.email`
 *     @unique,
 *   - a UNIQUE `X-Forwarded-For` IP per request so the in-memory sliding-
 *     window rate limiter (general 100/min/IP, auth 10/min/IP) never trips
 *     inside the sweeps. `app.set("trust proxy", 1)` is set in `createApp()`
 *     so `req.ip` honors the forwarded header.
 *
 * The IP counter is MODULE state. The integration vitest project runs with
 * `isolate: false` + one worker, so every test file shares this module —
 * the counter is process-global for the whole run. IPs are drawn from the
 * three RFC 5737 / RFC 1918-style documentation blocks (198.51.100.x,
 * 203.0.113.x, 192.0.2.x) → 750 unique test IPs before reuse, far above
 * the ~400 requests the full suite issues inside the 60 s window.
 */
import type { Express } from "express";
import request from "supertest";
import { expect } from "vitest";


let ipCounter = 0;

/** Unique documentation-range IP per call (see file header). */
export function uniqueIp(): string {
  const blocks = ["198.51.100", "203.0.113", "192.0.2"];
  const block = blocks[Math.floor(ipCounter / 250) % blocks.length];
  const host = (ipCounter % 250) + 1;
  ipCounter += 1;
  return `${block}.${host}`;
}

/**
 * Fire one request at the app with a fresh rate-limit identity.
 *
 *   const res = await hit(app, "get", "/api/v1/effects");
 *   const res = await hit(app, "post", "/api/v1/themes", { body: {...} });
 */
export function hit(
  app: Express,
  method: string,
  path: string,
  opts: { body?: unknown; headers?: Record<string, string> } = {},
): request.Test {
  // `request(app)` returns a superagent factory; indexing it with the
  // method name ("get" | "post" | …) yields the method builder. The cast
  // is needed because the factory has no index signature in @types/supertest.
  const methodFactory = (request(app) as unknown as Record<
    string,
    (path: string) => request.Test
  >)[method] as ((path: string) => request.Test) | undefined;
  if (typeof methodFactory !== "function") {
    throw new Error(`api-client: unsupported HTTP method "${method}"`);
  }
  const agent = methodFactory(path).set("X-Forwarded-For", uniqueIp());
  if (opts.headers) {
    for (const [k, v] of Object.entries(opts.headers)) agent.set(k, v);
  }
  if (opts.body !== undefined) agent.send(opts.body as object);
  return agent;
}

const VALID_PASSWORD = "correct-horse-battery-staple-9"; // ≥8 chars, letter + number

export interface RegisteredUser {
  id: string;
  email: string;
  accessToken: string;
}

/** Register a fresh user via the public API; return id + access token. */
export async function registerUser(
  app: Express,
  prefix = "user",
): Promise<RegisteredUser> {
  const email = `${prefix}+${crypto.randomUUID()}@example.com`;
  const res = await hit(app, "post", "/api/v1/auth/register", {
    body: { email, password: VALID_PASSWORD, name: `${prefix} User` },
  });
  expect(res.status, `register ${email}`).toBe(201);
  expect(typeof res.body.data.accessToken).toBe("string");
  return {
    id: res.body.data.user.id as string,
    email,
    accessToken: res.body.data.accessToken as string,
  };
}

/** Authorization header for a registered user's access token. */
export function bearer(user: RegisteredUser): { Authorization: string } {
  return { Authorization: `Bearer ${user.accessToken}` };
}

// ─── Envelope contract assertions ────────────────────────────────────────

/** Documented error-code set (API.md §error-codes). */
export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "SERVICE_UNAVAILABLE",
] as const;

/**
 * Assert the full wire contract that applies to EVERY /api/v1 response:
 *   - content-type is application/json,
 *   - the X-Request-Id correlation header is present.
 */
export function expectTransportContract(res: request.Response): void {
  const label = `${res.request.method} ${res.request.url}`;
  expect(
    res.headers["content-type"] ?? "",
    `${label} content-type`,
  ).toMatch(/application\/json/);
  expect(
    typeof res.headers["x-request-id"],
    `${label} X-Request-Id`,
  ).toBe("string");
}

/**
 * Assert a SUCCESS envelope: `{ data: … }` where `data` is an array
 * (collection → `meta` object required, per API.md §pagination) or an
 * object (single resource / stat → `meta` optional).
 */
export function expectSuccessEnvelope(res: request.Response): void {
  expectTransportContract(res);
  expect(res.body, "success envelope body").toHaveProperty("data");
  if (Array.isArray(res.body.data)) {
    expect(
      typeof res.body.meta,
      "collection meta must be an object (API.md §pagination)",
    ).toBe("object");
  } else {
    expect(
      res.body.data === null || typeof res.body.data === "object",
      "data must be an array or object",
    ).toBe(true);
  }
}

/** Assert a FAILURE envelope: `{ error: { code, message }, requestId }`. */
export function expectErrorEnvelope(res: request.Response): void {
  expectTransportContract(res);
  expect(res.status, "error status must be 4xx/5xx").toBeGreaterThanOrEqual(400);
  expect(res.body, "error envelope body").toHaveProperty("error");
  expect(typeof res.body.error.code, "error.code").toBe("string");
  expect(
    ERROR_CODES as readonly string[],
    `error.code "${res.body.error.code}" must be documented`,
  ).toContain(res.body.error.code);
  expect(typeof res.body.error.message, "error.message").toBe("string");
  expect(typeof res.body.requestId, "error requestId").toBe("string");
}
