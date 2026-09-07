/**
 * Integration tests — /api/v1/themes (PF-007, issue #93 module 9/15).
 *
 * Themes is the Prisma-backed CRUD workhorse (Theme model). Full
 * authenticated lifecycle + envelope pinning:
 *
 *   1. GET /            → 200 { data: array, meta: { count } } seeded themes
 *   2. POST / anonymous  → 401
 *   3. POST / with Bearer + valid body → 201 { data: theme }
 *   4. GET /:id         → 200 single envelope (theme round-trip)
 *   5. PUT /:id         → 200 updated single envelope
 *   6. DELETE /:id      → 204 no content; subsequent GET → 404
 *   7. POST / invalid hex color → 400 VALIDATION_ERROR with field details
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";
import {
  hit,
  registerUser,
  bearer,
  expectSuccessEnvelope,
  expectErrorEnvelope,
} from "../helpers/api-client.js";

const app = createApp();

const NEW_THEME = {
  name: "Contract Test Theme",
  primary: "#10b981",
  secondary: "#6366f1",
  accent: "#f59e0b",
  background: "#0b0f14",
  foreground: "#e6edf3",
  tokens: { radius: "1rem" },
};

describe("themes CRUD lifecycle", () => {
  it("1. GET / — seeded catalog collection envelope", async () => {
    const res = await hit(app, "get", "/api/v1/themes");

    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.count).toBe(res.body.data.length);
    const first = res.body.data[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.name).toBe("string");
    expect(typeof first.primary).toBe("string");
  });

  it("2. POST / anonymous → 401 UNAUTHORIZED", async () => {
    const res = await hit(app, "post", "/api/v1/themes", { body: NEW_THEME });
    expect(res.status).toBe(401);
    expectErrorEnvelope(res);
  });

  it("3. POST / with Bearer → 201 single envelope + DB row", async () => {
    const user = await registerUser(app, "themes-create");
    const res = await hit(app, "post", "/api/v1/themes", {
      body: NEW_THEME,
      headers: bearer(user),
    });

    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    expect(res.body.data.name).toBe(NEW_THEME.name);
    expect(res.body.data.primary).toBe(NEW_THEME.primary);
    expect(typeof res.body.data.id).toBe("string");

    const row = await db.theme.findUnique({
      where: { id: res.body.data.id as string },
    });
    expect(row).not.toBeNull();
    expect(row!.name).toBe(NEW_THEME.name);
  });

  it("4-6. GET → PUT → DELETE lifecycle with Bearer", async () => {
    const user = await registerUser(app, "themes-lifecycle");
    const created = await hit(app, "post", "/api/v1/themes", {
      body: { ...NEW_THEME, name: "Lifecycle Theme" },
      headers: bearer(user),
    });
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;

    // GET :id — single envelope, meta omitted (documented).
    const got = await hit(app, "get", `/api/v1/themes/${id}`);
    expect(got.status).toBe(200);
    expectSuccessEnvelope(got);
    expect(got.body.data.id).toBe(id);
    expect(got.body.meta).toBeUndefined();

    // PUT :id — update name, colors immutable fields stay.
    const updated = await hit(app, "put", `/api/v1/themes/${id}`, {
      body: { name: "Lifecycle Theme v2" },
      headers: bearer(user),
    });
    expect(updated.status).toBe(200);
    expectSuccessEnvelope(updated);
    expect(updated.body.data.name).toBe("Lifecycle Theme v2");
    expect(updated.body.data.primary).toBe(NEW_THEME.primary);

    // DELETE :id — 204 (documented no-content).
    const deleted = await hit(app, "delete", `/api/v1/themes/${id}`, {
      headers: bearer(user),
    });
    expect(deleted.status).toBe(204);

    // Subsequent GET → 404 error envelope.
    const gone = await hit(app, "get", `/api/v1/themes/${id}`);
    expect(gone.status).toBe(404);
    expectErrorEnvelope(gone);
  });

  it("7. POST / invalid hex color → 400 VALIDATION_ERROR with details", async () => {
    const user = await registerUser(app, "themes-badcolor");
    const res = await hit(app, "post", "/api/v1/themes", {
      body: { ...NEW_THEME, primary: "not-a-hex" },
      headers: bearer(user),
    });

    expect(res.status).toBe(400);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const details = res.body.error.details as Array<{ path: string }>;
    expect(details.some((d) => d.path.includes("primary"))).toBe(true);
  });

  it("8. unknown id → 404 NOT_FOUND error envelope (public read)", async () => {
    const res = await hit(app, "get", "/api/v1/themes/probe-123");
    expect(res.status).toBe(404);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
