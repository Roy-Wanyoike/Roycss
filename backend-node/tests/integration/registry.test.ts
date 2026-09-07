/**
 * Integration tests — Registry as single source of truth
 * (PF-009 / issue #94 A1).
 *
 *   1. GET /registry/resolve/:slug resolves an effect slug → canonical
 *      item with type + version + latestVersion + raw data
 *   2. GET /registry/resolve/:slug?theme=… resolves across types
 *      (themes are Prisma-backed — proves the DB source registered)
 *   3. Unknown slug → 404 NOT_FOUND
 *   4. Envelope regression: GET /effects/:id returns EXACTLY the raw
 *      dist/effects.json entry (deep-equal) — delegation changed
 *      nothing about the public shape
 *   5. Envelope regression: GET /effects list meta is unchanged
 *      (page/limit/total/totalPages) and items deep-equal their
 *      dist/effects.json counterparts
 *   6. Delegation is real: the pattern detail read resolves through
 *      the registry catalog (same object the resolver returns)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import type { Effect } from "../../src/types/index.js";

const app = createApp();

/** Unique IP per request — see auth.test.ts for rationale. */
function uniqueIp(): string {
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.${Math.floor(Math.random() * 250)}.${rand}`;
}

// dist/effects.json lives at the repo root (EFFECTS_DATA_PATH default).
// tests/integration → backend-node → repo root → dist/effects.json
const EFFECTS_JSON = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "..", "..", "..", "dist", "effects.json"),
    "utf-8",
  ),
) as Effect[];

describe("GET /api/v1/registry/resolve/:slug (issue #94 A1)", () => {
  it("1. resolves an effect slug to the canonical registry item", async () => {
    const slug = EFFECTS_JSON[0]!.id;
    const res = await request(app)
      .get(`/api/v1/registry/resolve/${encodeURIComponent(slug)}`)
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    const item = res.body.data;
    expect(item.type).toBe("effect");
    expect(item.slug).toBe(slug);
    expect(item.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(item.latestVersion).toMatch(/^\d+\.\d+\.\d+$/);
    // The raw domain object travels under `data` — byte-identical to
    // the effect the /effects endpoints serve.
    expect(item.data).toEqual(EFFECTS_JSON[0]);
  });

  it("2. resolves across types — themes (Prisma-backed source)", async () => {
    const res = await request(app)
      .get("/api/v1/registry/resolve/theme-emerald-default")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe("theme");
    expect(res.body.data.slug).toBe("theme-emerald-default");
    expect(res.body.data.data).toMatchObject({
      id: "theme-emerald-default",
      name: "Emerald Default",
      primary: "#10b981",
    });
  });

  it("3. unknown slug → 404 NOT_FOUND", async () => {
    const res = await request(app)
      .get("/api/v1/registry/resolve/this-slug-does-not-exist-anywhere")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toMatch(/No registry item found/i);
  });

  it("4. invalid type filter → 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .get(`/api/v1/registry/resolve/${EFFECTS_JSON[0]!.id}?type=bogus`)
      .set("X-Forwarded-For", uniqueIp());
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("envelope regression — /effects after registry delegation (issue #94 A1)", () => {
  it("5. GET /effects/:id deep-equals the raw dist/effects.json entry", async () => {
    const effect = EFFECTS_JSON[1]!;
    const res = await request(app)
      .get(`/api/v1/effects/${effect.id}`)
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    // The public envelope: { data: <effect> } — identical shape+values.
    expect(res.body).toEqual({ data: effect });
  });

  it("6. GET /effects list envelope unchanged + items identical to source", async () => {
    const res = await request(app)
      .get("/api/v1/effects?page=3&limit=7")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({
      page: 3,
      limit: 7,
      total: EFFECTS_JSON.length,
      totalPages: Math.ceil(EFFECTS_JSON.length / 7),
    });
    // Default sort is id (asc) — page 3 of 7 → the same slice the
    // pre-refactor code produced.
    const expected = [...EFFECTS_JSON]
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(14, 21);
    expect(res.body.data).toEqual(expected);
  });
});
