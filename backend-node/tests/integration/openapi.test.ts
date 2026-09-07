/**
 * Integration tests — generated OpenAPI document
 * (PF-009 / issue #94 A4).
 *
 *   1. GET /api/v1/openapi.json serves the committed artifact: 200,
 *      JSON content type, valid OpenAPI 3.1.0 with 250+ paths
 *   2. The document covers the new issue #94 surface (resolve, ready,
 *      audit, jobs, metrics) and a legacy module (effects)
 *   3. The served bytes are byte-identical to api/openapi.json (the
 *      generated file IS what is served)
 *   4. Path keys are sorted (deterministic generation)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import request from "supertest";

import { createApp } from "../../src/server/app.js";

const app = createApp();

function uniqueIp(): string {
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.${Math.floor(Math.random() * 250)}.${rand}`;
}

describe("GET /api/v1/openapi.json (issue #94 A4)", () => {
  it("1. serves a valid OpenAPI 3.1.0 document with 250+ paths", async () => {
    const res = await request(app)
      .get("/api/v1/openapi.json")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);

    const doc = res.body;
    expect(doc.openapi).toBe("3.1.0");
    expect(Object.keys(doc.paths).length).toBeGreaterThanOrEqual(250);
    expect(doc.components.schemas.ErrorEnvelope).toBeTruthy();
    expect(doc.components.schemas.EnvelopeDataMeta).toBeTruthy();
    expect(doc.components.securitySchemes.bearerAuth).toBeTruthy();
  });

  it("2. documents the new issue #94 surface + legacy modules", async () => {
    const res = await request(app)
      .get("/api/v1/openapi.json")
      .set("X-Forwarded-For", uniqueIp());
    const paths = res.body.paths;

    // New (issue #94) endpoints…
    expect(paths["/api/v1/registry/resolve/{slug}"].get).toBeTruthy();
    expect(paths["/api/v1/health/ready"].get).toBeTruthy();
    expect(paths["/api/v1/audit"].get).toBeTruthy();
    expect(paths["/api/v1/metrics/routes"].get).toBeTruthy();
    expect(paths["/api/v1/accessibility/jobs"].post).toBeTruthy();
    expect(paths["/api/v1/accessibility/jobs/{id}"].get).toBeTruthy();
    expect(paths["/api/v1/analytics/jobs"].post).toBeTruthy();
    expect(paths["/api/v1/architect/jobs"].post).toBeTruthy();
    // …and legacy modules stay documented.
    expect(paths["/api/v1/effects"].get).toBeTruthy();
    expect(paths["/api/v1/auth/register"].post.requestBody).toBeTruthy();
  });

  it("3. serves the exact committed artifact bytes", async () => {
    const res = await request(app)
      .get("/api/v1/openapi.json")
      .set("X-Forwarded-For", uniqueIp());

    // tests/integration → backend-node → api/openapi.json
    const committed = readFileSync(
      resolve(import.meta.dirname, "..", "..", "api", "openapi.json"),
      "utf-8",
    );
    expect(res.text).toBe(committed);
    // And the committed file parses (guard against hand-edits).
    expect(() => JSON.parse(committed)).not.toThrow();
  });

  it("4. path keys are sorted — regeneration is deterministic", async () => {
    const res = await request(app)
      .get("/api/v1/openapi.json")
      .set("X-Forwarded-For", uniqueIp());
    const keys = Object.keys(res.body.paths as Record<string, unknown>);
    expect(keys).toEqual([...keys].sort());
  });
});
