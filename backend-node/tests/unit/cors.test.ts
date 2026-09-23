/**
 * Unit tests — CORS middleware (issue #209).
 *
 *   1. Rejected origin (prod AND dev) → 403 FORBIDDEN error envelope
 *      (NOT the 500 INTERNAL_ERROR a plain `cb(new Error(...))` used to
 *      fall into), carrying the requestId from the upstream middleware,
 *   2. Allowlisted + no-origin requests still pass,
 *   3. Dev reflection GATED to localhost-family origins (the old
 *      reflect-ANY-origin behavior is gone; localhost stays convenient
 *      without an allowlist entry),
 *   4. Preflight OPTIONS works,
 *   5. isAllowedOrigin / isLocalhostOrigin / corsPosture helpers.
 *
 * The middleware is built via createCorsMiddleware({ isProd, ... }) so
 * both modes are exercised here without re-importing modules under a
 * different NODE_ENV. The test app mirrors app.ts's ordering
 * (requestId → cors → errorHandler) — that ordering is exactly what
 * puts the requestId INSIDE the 403 envelope.
 */
import { describe, expect, it, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

import {
  corsPosture,
  createCorsMiddleware,
  isAllowedOrigin,
  isLocalhostOrigin,
} from "../../src/server/middleware/cors.js";
import { requestIdMiddleware } from "../../src/server/middleware/logging.js";
import { errorHandler } from "../../src/server/middleware/error.js";

function buildApp(opts: { isProd: boolean; corsOrigins?: string[] }): Express {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(createCorsMiddleware(opts));
  app.get("/ping", (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

const EVIL = "http://evil.example";

describe("CORS — prod-mode rejection returns the 403 envelope (issue #209)", () => {
  const app = buildApp({ isProd: true, corsOrigins: ["http://localhost:3000"] });

  it("1. a disallowed origin gets 403 FORBIDDEN — not 500", async () => {
    const res = await request(app).get("/ping").set("Origin", EVIL);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toContain(EVIL);
    // No internals leak (no stack, no CORS internals).
    expect(JSON.stringify(res.body.error)).not.toContain("stack");
  });

  it("2. the rejection envelope carries the requestId (body + header)", async () => {
    const res = await request(app)
      .get("/ping")
      .set("Origin", EVIL)
      .set("X-Request-Id", "cors-test-req-1");
    expect(res.status).toBe(403);
    expect(res.headers["x-request-id"]).toBe("cors-test-req-1");
    expect(res.body.requestId).toBe("cors-test-req-1");
  });

  it("3. an allowlisted origin passes", async () => {
    const res = await request(app)
      .get("/ping")
      .set("Origin", "http://localhost:3000");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("4. a no-origin request (curl / server-to-server) passes", async () => {
    const res = await request(app).get("/ping");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("5. preflight from an allowlisted origin is 204 with the API-key header allowed", async () => {
    const res = await request(app)
      .options("/ping")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "X-API-Key");
    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-headers"]).toContain("X-API-Key");
  });
});

describe("CORS — dev reflection gated to localhost (issue #209)", () => {
  const app = buildApp({ isProd: false });

  it("6. non-allowlisted LOCALHOST origins are still reflected in dev (dev convenience kept)", async () => {
    const res = await request(app)
      .get("/ping")
      .set("Origin", "http://localhost:5555");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5555",
    );
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("6b. an ARBITRARY origin is NOT reflected in dev — 403 envelope, same as prod", async () => {
    const res = await request(app).get("/ping").set("Origin", EVIL);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("6c. localhost-family members pass in dev: 127.0.0.1, [::1], *.localhost, any port", async () => {
    for (const origin of [
      "http://127.0.0.1:4173",
      "http://[::1]:3000",
      "http://app.localhost:3000",
      "https://localhost",
    ]) {
      const res = await request(app).get("/ping").set("Origin", origin);
      expect(res.status, origin).toBe(200);
      expect(res.headers["access-control-allow-origin"], origin).toBe(origin);
    }
  });

  it("6d. a LAN IP origin is rejected in dev (add it to CORS_ORIGINS instead)", async () => {
    const res = await request(app)
      .get("/ping")
      .set("Origin", "http://192.168.1.50:3000");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("7. corsPosture documents the gated behavior", () => {
    expect(corsPosture(false)).toContain("localhost");
    expect(corsPosture(false)).toContain("403");
    expect(corsPosture(true)).toContain("allowlist only");
    expect(corsPosture(true)).not.toContain("localhost origins");
  });
});

describe("isAllowedOrigin + isLocalhostOrigin (pure decision helpers)", () => {
  it("8. allowlist wins in both modes; dev gates the rest to localhost", () => {
    const list = ["http://a.test", "http://b.test"];
    expect(isAllowedOrigin("http://a.test", list, true)).toBe(true);
    expect(isAllowedOrigin("http://a.test", list, false)).toBe(true);
    expect(isAllowedOrigin("http://c.test", list, true)).toBe(false);
    expect(isAllowedOrigin("http://c.test", list, false)).toBe(false);
    expect(isAllowedOrigin("http://localhost:9999", list, false)).toBe(true);
  });

  it("8b. isLocalhostOrigin matches the loopback family only", () => {
    expect(isLocalhostOrigin("http://localhost:3000")).toBe(true);
    expect(isLocalhostOrigin("https://localhost")).toBe(true);
    expect(isLocalhostOrigin("http://127.0.0.1")).toBe(true);
    expect(isLocalhostOrigin("http://[::1]:8080")).toBe(true);
    expect(isLocalhostOrigin("http://api.localhost")).toBe(true);
    expect(isLocalhostOrigin("http://evil.example")).toBe(false);
    expect(isLocalhostOrigin("http://localhost.evil.example")).toBe(false);
    expect(isLocalhostOrigin("http://127.0.0.2:3000")).toBe(false);
    expect(isLocalhostOrigin("ftp://localhost")).toBe(false);
    expect(isLocalhostOrigin("")).toBe(false);
  });
});

describe("createCorsMiddleware — defaults track the real app", () => {
  it("9. builds without options (smoke — the app.ts instance path)", () => {
    vi.resetModules();
    expect(() => createCorsMiddleware()).not.toThrow();
  });
});
