/**
 * Integration tests — Registry `/packages` endpoints (contract pins).
 *
 * Companion to registry.test.ts (which pins the A1 `resolve` endpoint
 * from issue #94): this file pins the pre-existing `/registry/packages`
 * collection + single + versions + POST contract — envelope shapes,
 * 404/400 error bodies, 201 creation — as part of the PF-007
 * contract-test harness (issue #93).
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit, expectSuccessEnvelope, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();

describe("registry", () => {
  it("1. GET /packages — seeded catalog collection envelope", async () => {
    const res = await hit(app, "get", "/api/v1/registry/packages");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(5);
    const first = res.body.data[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.name).toBe("string");
    expect(typeof first.version).toBe("string");
    expect(typeof first.latestVersion).toBe("string");
    expect(typeof first.downloads).toBe("number");
    expect(typeof first.license).toBe("string");
  });

  it("2. GET /packages/:id — seeded package 200 single envelope", async () => {
    const res = await hit(app, "get", "/api/v1/registry/packages/pkg-roycss-core");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.id).toBe("pkg-roycss-core");
    expect(res.body.data.name).toBe("@roycss/core");
  });

  it("3. GET /packages/:id unknown → 404 NOT_FOUND error envelope", async () => {
    const res = await hit(app, "get", "/api/v1/registry/packages/probe-123");
    expect(res.status).toBe(404);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("4. GET /packages/:id/versions — 4-entry version history", async () => {
    const res = await hit(
      app,
      "get",
      "/api/v1/registry/packages/pkg-roycss-core/versions",
    );

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBe(4);
    const first = res.body.data[0];
    expect(typeof first.version).toBe("string");
    expect(typeof first.publishedAt).toBe("string");
    expect(typeof first.size).toBe("number");
    expect(typeof first.deprecated).toBe("boolean");
  });

  it("5. POST /packages with a valid body → 201 local-only record", async () => {
    const res = await hit(app, "post", "/api/v1/registry/packages", {
      body: {
        name: "@contract/test-package",
        description: "Package created by the contract test suite",
        author: "contract-tests",
        version: "1.0.0",
        license: "MIT",
        tags: ["test"],
      },
    });

    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    expect(res.body.data.name).toBe("@contract/test-package");
    expect(res.body.data.version).toBe("1.0.0");
    expect(res.body.data.downloads).toBe(0);
  });

  it("6. POST /packages with an empty body → 400 VALIDATION_ERROR", async () => {
    const res = await hit(app, "post", "/api/v1/registry/packages", { body: {} });
    expect(res.status).toBe(400);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
