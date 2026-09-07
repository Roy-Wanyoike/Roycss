/**
 * Integration tests — design tokens surface (PF-007, issue #93 module 10/15).
 *
 * The issue's "tokens" module maps to the design-token surfaces that exist
 * today: GET /api/v1/devtools/tokens (design token catalog) — the token
 * PUSH side (POST /api/v1/sync/tokens) is a documented public mock, pinned
 * in its minimal documented behavior.
 *
 *   1. GET /devtools/tokens → 200 { data: array, meta: { count } } —
 *      each item { name: "--roycss-*", value }
 *   2. POST /sync/tokens (valid body) → 201 envelope (mock upstream push)
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit, expectSuccessEnvelope } from "../helpers/api-client.js";

const app = createApp();

describe("design tokens", () => {
  it("1. GET /api/v1/devtools/tokens — design token catalog envelope", async () => {
    const res = await hit(app, "get", "/api/v1/devtools/tokens");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(10);
    expect(typeof res.body.meta.count).toBe("number");
    for (const token of res.body.data) {
      expect(token.name).toMatch(/^--roycss-/);
      expect(typeof token.value).toBe("string");
    }
  });

  it("2. POST /api/v1/sync/tokens — documented public mock push (201 envelope)", async () => {
    const res = await hit(app, "post", "/api/v1/sync/tokens", {
      body: { target: "style-dictionary", namespace: "roycss" },
    });

    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    expect(res.body.data).toBeTruthy();
  });
});
