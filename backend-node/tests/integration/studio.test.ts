/**
 * Integration tests — /api/v1/studio (issue #267).
 *
 * The studio project store is OWNER-SCOPED (the collections/favorites
 * convention): every /projects route — reads included — requires a
 * Bearer JWT and only ever touches the caller's own rows; a foreign id
 * reads as a flat 404, never a 403, so ids don't leak.
 *
 * Coverage matrix:
 *   - route-table equality for the 6-route surface (fail-on-missing
 *     both directions, contract-harness style)
 *   - 401 sweep: all 5 /projects routes anonymous → UNAUTHORIZED envelope
 *   - GET /templates stays public (static catalog, no user data)
 *   - validation 400s (body / params)
 *   - happy path CRUD: create attributes the row to the caller's `sub`
 *     (asserted at the DB level), list/detail/update/delete round-trip
 *   - ownership isolation in both directions — foreign ids are flat 404s
 *     for GET / PUT / DELETE, and the list never shows another user's
 *     projects (issue #267 repro: user B against user A's data)
 *   - legacy owner-`null` seed rows are invisible + immutable through
 *     the API (the recorded seeds decision)
 */
import { describe, expect, it } from "vitest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";
import { listRoutes, type RouteEntry } from "../helpers/route-walker.js";
import {
  hit,
  registerUser,
  bearer,
  expectSuccessEnvelope,
  expectErrorEnvelope,
} from "../helpers/api-client.js";

const app = createApp();

/** The studio surface — the acceptance list (method + path). */
const PLANNED_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ["get", "/api/v1/studio/projects"],
  ["post", "/api/v1/studio/projects"],
  ["get", "/api/v1/studio/projects/:id"],
  ["put", "/api/v1/studio/projects/:id"],
  ["delete", "/api/v1/studio/projects/:id"],
  ["get", "/api/v1/studio/templates"],
];

describe("studio — route surface + guards", () => {
  it("the live router registers exactly the 6 planned studio routes", () => {
    const relevant = listRoutes(app).filter((r: RouteEntry) =>
      r.path.startsWith("/api/v1/studio"),
    );
    const actual = relevant
      .map((r) => `${r.method} ${r.path}` as const)
      .sort();
    const planned = PLANNED_ROUTES.map(([m, p]) => `${m} ${p}`).sort();
    expect(actual).toEqual(planned);
  });

  it("all 5 /projects routes reject anonymous callers with the 401 envelope", async () => {
    const calls: Array<[string, string, Record<string, unknown>?]> = [
      ["get", "/api/v1/studio/projects"],
      ["post", "/api/v1/studio/projects", { name: "anon" }],
      ["get", "/api/v1/studio/projects/prj-x"],
      ["put", "/api/v1/studio/projects/prj-x", { name: "anon" }],
      ["delete", "/api/v1/studio/projects/prj-x"],
    ];
    for (const [method, path, body] of calls) {
      const res = await hit(app, method, path, body ? { body } : {});
      expect(res.status, `${method} ${path} anonymous`).toBe(401);
      expectErrorEnvelope(res);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("GET /templates stays public (static catalog, no user data)", async () => {
    const res = await hit(app, "get", "/api/v1/studio/templates");
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.meta.count).toBeGreaterThan(0);
  });

  it("validation failures return 400 VALIDATION_ERROR", async () => {
    const user = await registerUser(app, "studio-validate");

    // Body: missing name on create.
    const badBody = await hit(app, "post", "/api/v1/studio/projects", {
      body: { description: "no name" },
      headers: bearer(user),
    });
    expect(badBody.status).toBe(400);
    expect(badBody.body.error.code).toBe("VALIDATION_ERROR");

    // Body: name above the 120-char cap.
    const longName = await hit(app, "post", "/api/v1/studio/projects", {
      body: { name: "x".repeat(121) },
      headers: bearer(user),
    });
    expect(longName.status).toBe(400);
    expect(longName.body.error.code).toBe("VALIDATION_ERROR");

    // Body: wrong type on update.
    const badUpdate = await hit(app, "put", "/api/v1/studio/projects/prj-x", {
      body: { name: 5 },
      headers: bearer(user),
    });
    expect(badUpdate.status).toBe(400);
    expect(badUpdate.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("studio — CRUD happy path (owner attribution)", () => {
  it("create → 201, the row is attributed to the caller's sub, list + detail round-trip", async () => {
    const user = await registerUser(app, "studio-crud");

    const create = await hit(app, "post", "/api/v1/studio/projects", {
      body: {
        name: "Landing v2",
        description: "Issue #267 smoke",
        components: [
          { id: "cmp-1", type: "Hero", props: { title: "Hi" }, children: [] },
        ],
      },
      headers: bearer(user),
    });
    expect(create.status).toBe(201);
    expectSuccessEnvelope(create);
    expect(create.body.data.name).toBe("Landing v2");
    expect(create.body.data.components).toHaveLength(1);
    const id = create.body.data.id as string;

    // THE fix: the row carries the caller's userId (was `null` before #267).
    const row = await db.studioProject.findUnique({ where: { id } });
    expect(row).not.toBeNull();
    expect(row!.userId).toBe(user.id);

    // List — only the caller's own projects, with the count meta.
    const list = await hit(app, "get", "/api/v1/studio/projects", {
      headers: bearer(user),
    });
    expect(list.status).toBe(200);
    expectSuccessEnvelope(list);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].id).toBe(id);
    expect(list.body.meta).toEqual({ count: 1 });

    // Detail round-trip.
    const detail = await hit(app, "get", `/api/v1/studio/projects/${id}`, {
      headers: bearer(user),
    });
    expect(detail.status).toBe(200);
    expectSuccessEnvelope(detail);
    expect(detail.body.meta).toBeUndefined();
    expect(detail.body.data.id).toBe(id);
    expect(detail.body.data.components).toHaveLength(1);
  });

  it("PUT updates partially (name only keeps components+description); unknown id → 404", async () => {
    const user = await registerUser(app, "studio-update");
    const created = await hit(app, "post", "/api/v1/studio/projects", {
      body: {
        name: "Before",
        description: "Keep me",
        components: [{ id: "cmp-1", type: "Hero", props: {}, children: [] }],
      },
      headers: bearer(user),
    });
    const id = created.body.data.id as string;

    const patched = await hit(app, "put", `/api/v1/studio/projects/${id}`, {
      body: { name: "After" },
      headers: bearer(user),
    });
    expect(patched.status).toBe(200);
    expectSuccessEnvelope(patched);
    expect(patched.body.data.name).toBe("After");
    expect(patched.body.data.description).toBe("Keep me");
    expect(patched.body.data.components).toHaveLength(1);

    // Unknown id — same flat 404 as a foreign id.
    const missing = await hit(app, "put", "/api/v1/studio/projects/prj-x", {
      body: { name: "Ghost" },
      headers: bearer(user),
    });
    expect(missing.status).toBe(404);
    expectErrorEnvelope(missing);
  });

  it("delete → 204, subsequent detail → 404, list shrinks", async () => {
    const user = await registerUser(app, "studio-delete");
    const created = await hit(app, "post", "/api/v1/studio/projects", {
      body: { name: "Doomed" },
      headers: bearer(user),
    });
    const id = created.body.data.id as string;

    const del = await hit(app, "delete", `/api/v1/studio/projects/${id}`, {
      headers: bearer(user),
    });
    expect(del.status).toBe(204);

    const gone = await hit(app, "get", `/api/v1/studio/projects/${id}`, {
      headers: bearer(user),
    });
    expect(gone.status).toBe(404);
    expectErrorEnvelope(gone);

    const list = await hit(app, "get", "/api/v1/studio/projects", {
      headers: bearer(user),
    });
    expect(list.body.meta.count).toBe(0);
  });
});

describe("studio — ownership isolation (issue #267)", () => {
  it("user B cannot read, edit, or delete user A's project — flat 404s, list empty", async () => {
    const alice = await registerUser(app, "studio-alice");
    const bob = await registerUser(app, "studio-bob");

    const aliceProj = await hit(app, "post", "/api/v1/studio/projects", {
      body: { name: "Alice's project", description: "private" },
      headers: bearer(alice),
    });
    expect(aliceProj.status).toBe(201);
    const aliceId = aliceProj.body.data.id as string;

    // Bob's list is empty — A's project is not visible in the listing.
    const bobList = await hit(app, "get", "/api/v1/studio/projects", {
      headers: bearer(bob),
    });
    expect(bobList.status).toBe(200);
    expect(bobList.body.data).toEqual([]);
    expect(bobList.body.meta).toEqual({ count: 0 });

    // Bob cannot read A's project…
    const bobGet = await hit(app, "get", `/api/v1/studio/projects/${aliceId}`, {
      headers: bearer(bob),
    });
    expect(bobGet.status).toBe(404);
    expectErrorEnvelope(bobGet);
    expect(bobGet.body.error.code).toBe("NOT_FOUND");

    // …cannot edit it…
    const bobPut = await hit(app, "put", `/api/v1/studio/projects/${aliceId}`, {
      body: { name: "Stolen" },
      headers: bearer(bob),
    });
    expect(bobPut.status).toBe(404);
    expectErrorEnvelope(bobPut);

    // …and cannot delete it.
    const bobDel = await hit(
      app,
      "delete",
      `/api/v1/studio/projects/${aliceId}`,
      { headers: bearer(bob) },
    );
    expect(bobDel.status).toBe(404);
    expectErrorEnvelope(bobDel);

    // Alice's project survived Bob's attempts untouched.
    const aliceGet = await hit(
      app,
      "get",
      `/api/v1/studio/projects/${aliceId}`,
      { headers: bearer(alice) },
    );
    expect(aliceGet.status).toBe(200);
    expect(aliceGet.body.data.name).toBe("Alice's project");
    const aliceList = await hit(app, "get", "/api/v1/studio/projects", {
      headers: bearer(alice),
    });
    expect(aliceList.body.meta.count).toBe(1);
  });

  it("isolation is symmetric — A cannot touch B's project either", async () => {
    const alice = await registerUser(app, "studio-sym-a");
    const bob = await registerUser(app, "studio-sym-b");

    const bobProj = await hit(app, "post", "/api/v1/studio/projects", {
      body: { name: "Bob's project" },
      headers: bearer(bob),
    });
    const bobId = bobProj.body.data.id as string;

    for (const [method, path] of [
      ["get", `/api/v1/studio/projects/${bobId}`],
      ["put", `/api/v1/studio/projects/${bobId}`],
      ["delete", `/api/v1/studio/projects/${bobId}`],
    ] as const) {
      const res = await hit(app, method, path, {
        headers: bearer(alice),
        ...(method === "put" ? { body: { name: "Hacked" } } : {}),
      });
      expect(res.status, `${method} foreign id`).toBe(404);
      expectErrorEnvelope(res);
    }

    // Bob's row is intact.
    const stillThere = await db.studioProject.findUnique({
      where: { id: bobId },
    });
    expect(stillThere!.name).toBe("Bob's project");
  });

  it("legacy owner-null seed rows are invisible and immutable (seeds decision)", async () => {
    // Simulate a historical seed row exactly as the old seeder wrote it:
    // userId null, components JSON-encoded in filesJson.
    const legacyId = "studio-proj-landing-page";
    await db.studioProject.create({
      data: {
        id: legacyId,
        userId: null,
        name: "Landing Page (legacy seed)",
        description: "Hero + feature grid + pricing + footer.",
        filesJson: JSON.stringify({
          components: [],
          seedUpdatedAt: "2025-02-26T11:30:00.000Z",
          seedCreatedAt: "2025-02-20T09:00:00.000Z",
        }),
      },
    });

    const user = await registerUser(app, "studio-legacy");

    // Not in the caller's list…
    const list = await hit(app, "get", "/api/v1/studio/projects", {
      headers: bearer(user),
    });
    expect(list.body.meta.count).toBe(0);

    // …unreadable…
    const get = await hit(app, "get", `/api/v1/studio/projects/${legacyId}`, {
      headers: bearer(user),
    });
    expect(get.status).toBe(404);
    expectErrorEnvelope(get);

    // …uneditable…
    const put = await hit(app, "put", `/api/v1/studio/projects/${legacyId}`, {
      body: { name: "Defaced" },
      headers: bearer(user),
    });
    expect(put.status).toBe(404);

    // …and undeletable.
    const del = await hit(
      app,
      "delete",
      `/api/v1/studio/projects/${legacyId}`,
      { headers: bearer(user) },
    );
    expect(del.status).toBe(404);

    // The row itself is untouched (cleanup is an operator concern —
    // DELETE FROM "StudioProject" WHERE "userId" IS NULL).
    const row = await db.studioProject.findUnique({ where: { id: legacyId } });
    expect(row).not.toBeNull();
    expect(row!.name).toBe("Landing Page (legacy seed)");
  });
});
