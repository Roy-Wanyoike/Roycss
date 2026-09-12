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
 *
 * Ownership hardening (audit F-06 — api-keys flat-404 convention):
 *
 *   8. POST attributes the row to the token subject (a spoofed body
 *      `userId` is stripped by Zod and ignored)
 *   9. PUT/DELETE by a foreign user → flat 404, row untouched
 *  10. Seeded platform presets (owner `null`) are read-only — PUT/DELETE
 *      by ANY authenticated user → 404, row untouched
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

describe("themes ownership hardening (audit F-06)", () => {
  it("POST attributes the theme to the token subject — a spoofed body userId is stripped and ignored", async () => {
    const user = await registerUser(app, "themes-attr");
    const res = await hit(app, "post", "/api/v1/themes", {
      // Legacy/spoofed shape: a client-supplied userId must be ignored.
      body: { ...NEW_THEME, name: "Attributed Theme", userId: "victim-user-id" },
      headers: bearer(user),
    });

    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    const id = res.body.data.id as string;

    const row = await db.theme.findUnique({ where: { id } });
    expect(row).not.toBeNull();
    // Attribution = the verified token subject, never the body field.
    expect(row!.userId).toBe(user.id);
    expect(row!.userId).not.toBe("victim-user-id");
  });

  it("PUT/DELETE by a foreign user → flat 404s, the owner's row is untouched (both directions)", async () => {
    const alice = await registerUser(app, "themes-alice");
    const bob = await registerUser(app, "themes-bob");

    const created = await hit(app, "post", "/api/v1/themes", {
      body: { ...NEW_THEME, name: "Alice's Theme" },
      headers: bearer(alice),
    });
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;

    // Bob cannot update Alice's theme — flat 404, no id-existence leak.
    const bobPut = await hit(app, "put", `/api/v1/themes/${id}`, {
      body: { name: "Stolen Theme" },
      headers: bearer(bob),
    });
    expect(bobPut.status).toBe(404);
    expectErrorEnvelope(bobPut);
    expect(bobPut.body.error.code).toBe("NOT_FOUND");

    // Bob cannot delete it either.
    const bobDelete = await hit(app, "delete", `/api/v1/themes/${id}`, {
      headers: bearer(bob),
    });
    expect(bobDelete.status).toBe(404);
    expectErrorEnvelope(bobDelete);

    // Alice's row survived both attempts, name unchanged.
    const row = await db.theme.findUnique({ where: { id } });
    expect(row).not.toBeNull();
    expect(row!.name).toBe("Alice's Theme");
    expect(row!.userId).toBe(alice.id);

    // …and Alice can still update it herself (owner path).
    const alicePut = await hit(app, "put", `/api/v1/themes/${id}`, {
      body: { name: "Alice's Theme v2" },
      headers: bearer(alice),
    });
    expect(alicePut.status).toBe(200);
    expect(alicePut.body.data.name).toBe("Alice's Theme v2");
  });

  it("an unknown id PUT/DELETE is the same flat 404 (indistinguishable from foreign)", async () => {
    const user = await registerUser(app, "themes-unknown");
    const put = await hit(app, "put", "/api/v1/themes/no-such-theme", {
      body: { name: "Ghost" },
      headers: bearer(user),
    });
    expect(put.status).toBe(404);
    expect(put.body.error.code).toBe("NOT_FOUND");

    const del = await hit(app, "delete", "/api/v1/themes/no-such-theme", {
      headers: bearer(user),
    });
    expect(del.status).toBe(404);
    expectErrorEnvelope(del);
  });

  it("seeded platform presets (owner null) are read-only — PUT/DELETE by any authenticated user → 404", async () => {
    const user = await registerUser(app, "themes-platform");

    // Public read of a seeded preset still works (marketing surface).
    const before = await hit(app, "get", "/api/v1/themes/theme-emerald-default");
    expect(before.status).toBe(200);
    expect(before.body.data.name).toBe("Emerald Default");

    // No authenticated caller matches a null-owner row: mutations 404.
    const put = await hit(app, "put", "/api/v1/themes/theme-emerald-default", {
      body: { name: "Hacked Platform Theme" },
      headers: bearer(user),
    });
    expect(put.status).toBe(404);
    expectErrorEnvelope(put);
    expect(put.body.error.code).toBe("NOT_FOUND");

    const del = await hit(app, "delete", "/api/v1/themes/theme-emerald-default", {
      headers: bearer(user),
    });
    expect(del.status).toBe(404);
    expectErrorEnvelope(del);

    // The preset survived, name unchanged (public read is uncached truth).
    const row = await db.theme.findUnique({
      where: { id: "theme-emerald-default" },
    });
    expect(row).not.toBeNull();
    expect(row!.userId).toBeNull();
    expect(row!.name).toBe("Emerald Default");
  });

  it("DELETE by the owner still works after the hardening (204 + row gone)", async () => {
    const user = await registerUser(app, "themes-owner-del");
    const created = await hit(app, "post", "/api/v1/themes", {
      body: { ...NEW_THEME, name: "Doomed Theme" },
      headers: bearer(user),
    });
    const id = created.body.data.id as string;

    const del = await hit(app, "delete", `/api/v1/themes/${id}`, {
      headers: bearer(user),
    });
    expect(del.status).toBe(204);

    const row = await db.theme.findUnique({ where: { id } });
    expect(row).toBeNull();
  });
});
