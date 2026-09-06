/**
 * Integration tests — /api/v1/workspace (PF-007, issue #93 module 6/15).
 *
 * Reads are static snapshots; POST /invite is Bearer-protected (issue #64).
 *
 *   1. GET  /resources        → 200 envelope, grouped resource types
 *   2. GET  /resources/:type  → 200 for a seeded type · 404 error envelope otherwise
 *   3. GET  /team             → 200 envelope, seeded team roster
 *   4. POST /invite anonymous → 401 UNAUTHORIZED error envelope
 *   5. POST /invite with Bearer + valid body → 201 data envelope (mock member)
 *   6. POST /invite with Bearer + INVALID body → 400 VALIDATION_ERROR
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import {
  hit,
  registerUser,
  bearer,
  expectSuccessEnvelope,
  expectErrorEnvelope,
} from "../helpers/api-client.js";

const app = createApp();

describe("workspace", () => {
  it("1. GET /resources — grouped resource types with item lists", async () => {
    const res = await hit(app, "get", "/api/v1/workspace/resources");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(0);
    const first = res.body.data[0];
    expect(typeof first.type).toBe("string");
    expect(typeof first.label).toBe("string");
    expect(typeof first.count).toBe("number");
    expect(Array.isArray(first.items)).toBe(true);
  });

  it("2. GET /resources/:type — seeded type 200 · unknown type 404", async () => {
    const ok = await hit(app, "get", "/api/v1/workspace/resources/templates");
    expect(ok.status).toBe(200);
    expectSuccessEnvelope(ok);
    expect(ok.body.data.type).toBe("templates");

    const missing = await hit(app, "get", "/api/v1/workspace/resources/probe-123");
    expect(missing.status).toBe(404);
    expectErrorEnvelope(missing);
    expect(missing.body.error.code).toBe("NOT_FOUND");
  });

  it("3. GET /team — seeded roster with roles", async () => {
    const res = await hit(app, "get", "/api/v1/workspace/team");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(1);
    const first = res.body.data[0];
    expect(typeof first.name).toBe("string");
    expect(typeof first.email).toBe("string");
    expect(typeof first.role).toBe("string");
  });

  it("4. POST /invite anonymous → 401 UNAUTHORIZED error envelope", async () => {
    const res = await hit(app, "post", "/api/v1/workspace/invite", {
      body: { email: "anon@example.com", role: "viewer" },
    });
    expect(res.status).toBe(401);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("5. POST /invite with Bearer + valid body → 201 data envelope", async () => {
    const user = await registerUser(app, "ws-invite");
    const res = await hit(app, "post", "/api/v1/workspace/invite", {
      body: { email: "newmember@example.com", name: "New Member", role: "editor" },
      headers: bearer(user),
    });

    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    expect(res.body.data.email).toBe("newmember@example.com");
    expect(res.body.data.role).toBe("editor");
  });

  it("6. POST /invite with Bearer but invalid body → 400 VALIDATION_ERROR", async () => {
    const user = await registerUser(app, "ws-badbody");
    const res = await hit(app, "post", "/api/v1/workspace/invite", {
      body: { email: "not-an-email", role: "not-a-role" },
      headers: bearer(user),
    });

    expect(res.status).toBe(400);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });
});
