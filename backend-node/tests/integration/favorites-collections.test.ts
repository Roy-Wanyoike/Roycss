/**
 * Integration tests — /api/v1/favorites + /api/v1/collections (PF-048).
 *
 * This suite was the honesty PIN (absence-of-routes) while the Prisma
 * models existed without an HTTP surface; PF-048 ships the surface, so
 * the pin flips to live coverage of the 10 planned routes:
 *
 *   GET    /api/v1/favorites                        list (paginated, owner)
 *   POST   /api/v1/favorites/:effectId              favorite an effect
 *   DELETE /api/v1/favorites/:effectId              un-favorite an effect
 *   GET    /api/v1/collections                      list (paginated, owner)
 *   POST   /api/v1/collections                      create
 *   GET    /api/v1/collections/:id                   detail (owner)
 *   PATCH  /api/v1/collections/:id                   rename / re-describe
 *   DELETE /api/v1/collections/:id                   delete
 *   POST   /api/v1/collections/:id/effects           add effect (append)
 *   DELETE /api/v1/collections/:id/effects/:effectId remove effect
 *
 * Coverage matrix:
 *   - route-table equality with the planned surface (fail-on-missing
 *     in both directions, contract-harness style)
 *   - 401 sweep: all 10 routes anonymous → UNAUTHORIZED envelope
 *   - validation 400s (query / body / params)
 *   - favorites: happy path incl. catalog-resolved effect payload +
 *     pagination meta + membership order (newest first)
 *   - collections: CRUD + membership edits incl. order preservation
 *   - catalog 404s (unknown effect ids — registry SOT enforcement)
 *   - duplicate 409s (favorite / collection membership)
 *   - ownership isolation in both directions (foreign ids = flat 404)
 *   - audit-row assertions (favorites.effect.* / collections.*)
 */
import { beforeAll, describe, expect, it } from "vitest";

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

/** The planned PF-048 surface — the acceptance list (method + path). */
const PLANNED_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ["get", "/api/v1/favorites"],
  ["post", "/api/v1/favorites/:effectId"],
  ["delete", "/api/v1/favorites/:effectId"],
  ["get", "/api/v1/collections"],
  ["post", "/api/v1/collections"],
  ["get", "/api/v1/collections/:id"],
  ["patch", "/api/v1/collections/:id"],
  ["delete", "/api/v1/collections/:id"],
  ["post", "/api/v1/collections/:id/effects"],
  ["delete", "/api/v1/collections/:id/effects/:effectId"],
];

/** Real catalog effect ids for membership tests (fetched once). */
let EFFECT_IDS: string[] = [];

beforeAll(async () => {
  const res = await hit(app, "get", "/api/v1/effects?limit=5");
  expect(res.status).toBe(200);
  EFFECT_IDS = (res.body.data as Array<{ id: string }>).map((e) => e.id);
  expect(EFFECT_IDS.length).toBeGreaterThanOrEqual(3);
});

describe("favorites + collections — route surface + guards", () => {
  it("the live router registers exactly the 10 planned PF-048 routes", () => {
    const relevant = listRoutes(app).filter(
      (r: RouteEntry) =>
        r.path.includes("favorite") || /\/collections(\/|$)/.test(r.path),
    );
    const actual = relevant
      .map((r) => `${r.method} ${r.path}` as const)
      .sort();
    const planned = PLANNED_ROUTES.map(([m, p]) => `${m} ${p}`).sort();
    expect(actual).toEqual(planned);
  });

  it("all 10 routes reject anonymous callers with the 401 envelope", async () => {
    // :params substituted with sentinels (contract-sweep style).
    const calls: Array<[string, string, Record<string, unknown>?]> = [
      ["get", "/api/v1/favorites"],
      ["post", "/api/v1/favorites/effect-x", {}],
      ["delete", "/api/v1/favorites/effect-x"],
      ["get", "/api/v1/collections"],
      ["post", "/api/v1/collections", { name: "anon" }],
      ["get", "/api/v1/collections/col-x"],
      ["patch", "/api/v1/collections/col-x", { name: "anon" }],
      ["delete", "/api/v1/collections/col-x"],
      ["post", "/api/v1/collections/col-x/effects", { effectId: "effect-x" }],
      ["delete", "/api/v1/collections/col-x/effects/effect-x"],
    ];
    expect(calls.length).toBe(PLANNED_ROUTES.length);
    for (const [method, path, body] of calls) {
      const res = await hit(app, method, path, body ? { body } : {});
      expect(res.status, `${method} ${path} anonymous`).toBe(401);
      expectErrorEnvelope(res);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("validation failures return 400 VALIDATION_ERROR (query / body / params)", async () => {
    const user = await registerUser(app, "pf048-validate");

    // Query: limit above the 200 max.
    const badQuery = await hit(app, "get", "/api/v1/favorites?limit=500", {
      headers: bearer(user),
    });
    expect(badQuery.status).toBe(400);
    expect(badQuery.body.error.code).toBe("VALIDATION_ERROR");

    // Body: missing name on create.
    const badBody = await hit(app, "post", "/api/v1/collections", {
      body: { description: "no name" },
      headers: bearer(user),
    });
    expect(badBody.status).toBe(400);
    expect(badBody.body.error.code).toBe("VALIDATION_ERROR");

    // Body: missing effectId on membership add.
    const created = await hit(app, "post", "/api/v1/collections", {
      body: { name: "Validation target" },
      headers: bearer(user),
    });
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    const badMember = await hit(
      app,
      "post",
      `/api/v1/collections/${id}/effects`,
      { body: {}, headers: bearer(user) },
    );
    expect(badMember.status).toBe(400);
    expect(badMember.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("favorites — happy path, pagination, order, guards", () => {
  it("add → list returns catalog-resolved effects with default pagination meta", async () => {
    const user = await registerUser(app, "pf048-fav-happy");

    const add = await hit(app, "post", `/api/v1/favorites/${EFFECT_IDS[0]}`, {
      headers: bearer(user),
    });
    expect(add.status).toBe(201);
    expectSuccessEnvelope(add);
    expect(add.body.data.effectId).toBe(EFFECT_IDS[0]);
    // The effect payload is resolved through the registry catalog SOT.
    expect(add.body.data.effect.id).toBe(EFFECT_IDS[0]);
    expect(typeof add.body.data.effect.name).toBe("string");
    expect(typeof add.body.data.createdAt).toBe("string");

    const list = await hit(app, "get", "/api/v1/favorites", {
      headers: bearer(user),
    });
    expect(list.status).toBe(200);
    expectSuccessEnvelope(list);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.length).toBe(1);
    // Default pagination: page 1, limit 24 (repo convention).
    expect(list.body.meta).toEqual({
      page: 1,
      limit: 24,
      total: 1,
      totalPages: 1,
    });
  });

  it("list paginates with explicit page/limit and reports total/totalPages", async () => {
    const user = await registerUser(app, "pf048-fav-page");
    for (const effectId of EFFECT_IDS.slice(0, 3)) {
      const res = await hit(app, "post", `/api/v1/favorites/${effectId}`, {
        headers: bearer(user),
      });
      expect(res.status).toBe(201);
    }

    const page1 = await hit(app, "get", "/api/v1/favorites?limit=2", {
      headers: bearer(user),
    });
    expect(page1.status).toBe(200);
    expect(page1.body.data.length).toBe(2);
    expect(page1.body.meta).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });

    const page2 = await hit(app, "get", "/api/v1/favorites?limit=2&page=2", {
      headers: bearer(user),
    });
    expect(page2.status).toBe(200);
    expect(page2.body.data.length).toBe(1);
    expect(page2.body.meta).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it("membership order is newest-first (api-keys listing convention)", async () => {
    const user = await registerUser(app, "pf048-fav-order");
    for (const effectId of EFFECT_IDS.slice(0, 3)) {
      await hit(app, "post", `/api/v1/favorites/${effectId}`, {
        headers: bearer(user),
      });
    }

    const list = await hit(app, "get", "/api/v1/favorites", {
      headers: bearer(user),
    });
    const ids = (list.body.data as Array<{ effectId: string }>).map(
      (f) => f.effectId,
    );
    // Added A, B, C → listed C, B, A.
    expect(ids).toEqual([...EFFECT_IDS.slice(0, 3)].reverse());
  });

  it("duplicate favorite → 409 CONFLICT", async () => {
    const user = await registerUser(app, "pf048-fav-dup");

    const first = await hit(app, "post", `/api/v1/favorites/${EFFECT_IDS[0]}`, {
      headers: bearer(user),
    });
    expect(first.status).toBe(201);

    const dup = await hit(app, "post", `/api/v1/favorites/${EFFECT_IDS[0]}`, {
      headers: bearer(user),
    });
    expect(dup.status).toBe(409);
    expectErrorEnvelope(dup);
    expect(dup.body.error.code).toBe("CONFLICT");
  });

  it("unknown effect id → 404 via the registry catalog SOT, nothing written", async () => {
    const user = await registerUser(app, "pf048-fav-unknown");

    // Unknown effect id — resolved (and rejected) through the registry
    // catalog single code path before any row is written.
    const unknown = await hit(app, "post", "/api/v1/favorites/no-such-effect", {
      headers: bearer(user),
    });
    expect(unknown.status).toBe(404);
    expectErrorEnvelope(unknown);
    expect(unknown.body.error.code).toBe("NOT_FOUND");
    expect(unknown.body.error.message).toContain("no-such-effect");
    const row = await db.effectFavorite.findFirst({
      where: { userId: user.id, effectId: "no-such-effect" },
    });
    expect(row).toBeNull();
  });

  it("remove → 204, list shrinks, double-remove → 404", async () => {
    const user = await registerUser(app, "pf048-fav-remove");
    await hit(app, "post", `/api/v1/favorites/${EFFECT_IDS[0]}`, {
      headers: bearer(user),
    });
    await hit(app, "post", `/api/v1/favorites/${EFFECT_IDS[1]}`, {
      headers: bearer(user),
    });

    const del = await hit(app, "delete", `/api/v1/favorites/${EFFECT_IDS[1]}`, {
      headers: bearer(user),
    });
    expect(del.status).toBe(204);

    const list = await hit(app, "get", "/api/v1/favorites", {
      headers: bearer(user),
    });
    expect(list.body.data.length).toBe(1);
    expect(list.body.data[0].effectId).toBe(EFFECT_IDS[0]);

    const again = await hit(
      app,
      "delete",
      `/api/v1/favorites/${EFFECT_IDS[1]}`,
      { headers: bearer(user) },
    );
    expect(again.status).toBe(404);
    expectErrorEnvelope(again);
  });

  it("ownership isolation — other users' favorites are invisible both ways", async () => {
    const alice = await registerUser(app, "pf048-fav-alice");
    const bob = await registerUser(app, "pf048-fav-bob");

    await hit(app, "post", `/api/v1/favorites/${EFFECT_IDS[0]}`, {
      headers: bearer(alice),
    });

    // Bob's list is empty…
    const bobList = await hit(app, "get", "/api/v1/favorites", {
      headers: bearer(bob),
    });
    expect(bobList.status).toBe(200);
    expect(bobList.body.data).toEqual([]);
    expect(bobList.body.meta.total).toBe(0);

    // …and Bob cannot remove Alice's favorite (flat 404, no id leak).
    const bobDel = await hit(
      app,
      "delete",
      `/api/v1/favorites/${EFFECT_IDS[0]}`,
      { headers: bearer(bob) },
    );
    expect(bobDel.status).toBe(404);

    // Alice's favorite survived.
    const aliceList = await hit(app, "get", "/api/v1/favorites", {
      headers: bearer(alice),
    });
    expect(aliceList.body.meta.total).toBe(1);
  });

  it("audit rows: favorites.effect.add + favorites.effect.remove (PF-009 A6)", async () => {
    const user = await registerUser(app, "pf048-fav-audit");
    const effectId = EFFECT_IDS[2]!;

    await hit(app, "post", `/api/v1/favorites/${effectId}`, {
      headers: bearer(user),
    });
    await hit(app, "delete", `/api/v1/favorites/${effectId}`, {
      headers: bearer(user),
    });

    for (const action of ["favorites.effect.add", "favorites.effect.remove"]) {
      const rows = await db.enterpriseAuditLog.findMany({
        where: { userId: user.id, action },
        orderBy: { createdAt: "desc" },
      });
      expect(rows.length).toBeGreaterThanOrEqual(1);
      const row = rows[0]!;
      expect(row.orgId).toBe("platform");
      expect(row.resourceType).toBe("effect");
      expect(row.resourceId).toBe(effectId);
      const meta = JSON.parse(row.metadataJson) as { requestId?: string };
      expect(typeof meta.requestId).toBe("string");
      expect(meta.requestId!.length).toBeGreaterThan(0);
    }
  });
});

describe("collections — CRUD, membership, pagination, guards", () => {
  it("create → 201 + detail round-trip; list is owner-scoped", async () => {
    const user = await registerUser(app, "pf048-col-crud");

    const create = await hit(app, "post", "/api/v1/collections", {
      body: {
        name: "Neon kit",
        description: "Glowy favorites",
        effectIds: EFFECT_IDS.slice(0, 2),
      },
      headers: bearer(user),
    });
    expect(create.status).toBe(201);
    expectSuccessEnvelope(create);
    expect(create.body.data.name).toBe("Neon kit");
    expect(create.body.data.description).toBe("Glowy favorites");
    // Membership order on create = the submitted order.
    expect(create.body.data.effectIds).toEqual(EFFECT_IDS.slice(0, 2));
    expect(typeof create.body.data.id).toBe("string");
    expect(typeof create.body.data.createdAt).toBe("string");
    const id = create.body.data.id as string;

    const detail = await hit(app, "get", `/api/v1/collections/${id}`, {
      headers: bearer(user),
    });
    expect(detail.status).toBe(200);
    expectSuccessEnvelope(detail);
    // Single-resource envelope — no meta (repo convention).
    expect(detail.body.meta).toBeUndefined();
    expect(detail.body.data.id).toBe(id);
    expect(detail.body.data.effectIds).toEqual(EFFECT_IDS.slice(0, 2));
  });

  it("create with an unknown effect id → 404 and no row is written", async () => {
    const user = await registerUser(app, "pf048-col-badcreate");

    const res = await hit(app, "post", "/api/v1/collections", {
      body: { name: "Broken", effectIds: [EFFECT_IDS[0]!, "no-such-effect"] },
      headers: bearer(user),
    });
    expect(res.status).toBe(404);
    expectErrorEnvelope(res);
    expect(res.body.error.message).toContain("no-such-effect");

    const count = await db.collection.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it("list paginates with meta (3 collections, limit 2 → 2 pages)", async () => {
    const user = await registerUser(app, "pf048-col-page");
    for (let i = 0; i < 3; i++) {
      const res = await hit(app, "post", "/api/v1/collections", {
        body: { name: `Kit ${i + 1}` },
        headers: bearer(user),
      });
      expect(res.status).toBe(201);
    }

    const page1 = await hit(app, "get", "/api/v1/collections?limit=2", {
      headers: bearer(user),
    });
    expect(page1.status).toBe(200);
    expectSuccessEnvelope(page1);
    expect(page1.body.data.length).toBe(2);
    expect(page1.body.meta).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });

    const page2 = await hit(app, "get", "/api/v1/collections?limit=2&page=2", {
      headers: bearer(user),
    });
    expect(page2.body.data.length).toBe(1);
    expect(page2.body.meta).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it("PATCH renames + re-describes without touching membership", async () => {
    const user = await registerUser(app, "pf048-col-patch");
    const created = await hit(app, "post", "/api/v1/collections", {
      body: { name: "Before", effectIds: [EFFECT_IDS[0]!] },
      headers: bearer(user),
    });
    const id = created.body.data.id as string;

    const patched = await hit(app, "patch", `/api/v1/collections/${id}`, {
      body: { name: "After", description: "Renamed" },
      headers: bearer(user),
    });
    expect(patched.status).toBe(200);
    expectSuccessEnvelope(patched);
    expect(patched.body.data.name).toBe("After");
    expect(patched.body.data.description).toBe("Renamed");
    // Untouched membership survives the patch.
    expect(patched.body.data.effectIds).toEqual([EFFECT_IDS[0]!]);
  });

  it("PATCH can replace the membership wholesale (new order wins)", async () => {
    const user = await registerUser(app, "pf048-col-replace");
    const created = await hit(app, "post", "/api/v1/collections", {
      body: { name: "Replace me", effectIds: EFFECT_IDS.slice(0, 2) },
      headers: bearer(user),
    });
    const id = created.body.data.id as string;

    const replacement = [EFFECT_IDS[2]!, EFFECT_IDS[0]!];
    const patched = await hit(app, "patch", `/api/v1/collections/${id}`, {
      body: { effectIds: replacement },
      headers: bearer(user),
    });
    expect(patched.status).toBe(200);
    expect(patched.body.data.effectIds).toEqual(replacement);
  });

  it("POST /:id/effects appends (order preserved) and returns the collection", async () => {
    const user = await registerUser(app, "pf048-col-add");
    const created = await hit(app, "post", "/api/v1/collections", {
      body: { name: "Growable", effectIds: [EFFECT_IDS[0]!] },
      headers: bearer(user),
    });
    const id = created.body.data.id as string;

    const added = await hit(app, "post", `/api/v1/collections/${id}/effects`, {
      body: { effectId: EFFECT_IDS[1]! },
      headers: bearer(user),
    });
    expect(added.status).toBe(200);
    expectSuccessEnvelope(added);
    expect(added.body.data.effectIds).toEqual([EFFECT_IDS[0]!, EFFECT_IDS[1]!]);

    const detail = await hit(app, "get", `/api/v1/collections/${id}`, {
      headers: bearer(user),
    });
    expect(detail.body.data.effectIds).toEqual([EFFECT_IDS[0]!, EFFECT_IDS[1]!]);
  });

  it("duplicate membership add → 409; unknown effect add → 404", async () => {
    const user = await registerUser(app, "pf048-col-dup");
    const created = await hit(app, "post", "/api/v1/collections", {
      body: { name: "Dupes", effectIds: [EFFECT_IDS[0]!] },
      headers: bearer(user),
    });
    const id = created.body.data.id as string;

    const dup = await hit(app, "post", `/api/v1/collections/${id}/effects`, {
      body: { effectId: EFFECT_IDS[0]! },
      headers: bearer(user),
    });
    expect(dup.status).toBe(409);
    expectErrorEnvelope(dup);
    expect(dup.body.error.code).toBe("CONFLICT");

    const unknown = await hit(app, "post", `/api/v1/collections/${id}/effects`, {
      body: { effectId: "no-such-effect" },
      headers: bearer(user),
    });
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.message).toContain("no-such-effect");
  });

  it("DELETE /:id/effects/:effectId removes one member, preserves the rest", async () => {
    const user = await registerUser(app, "pf048-col-remove");
    const created = await hit(app, "post", "/api/v1/collections", {
      body: {
        name: "Removable",
        effectIds: EFFECT_IDS.slice(0, 3),
      },
      headers: bearer(user),
    });
    const id = created.body.data.id as string;

    const removed = await hit(
      app,
      "delete",
      `/api/v1/collections/${id}/effects/${EFFECT_IDS[1]}`,
      { headers: bearer(user) },
    );
    expect(removed.status).toBe(200);
    expectSuccessEnvelope(removed);
    expect(removed.body.data.effectIds).toEqual([
      EFFECT_IDS[0]!,
      EFFECT_IDS[2]!,
    ]);

    // Removing a non-member is a flat 404.
    const again = await hit(
      app,
      "delete",
      `/api/v1/collections/${id}/effects/${EFFECT_IDS[1]}`,
      { headers: bearer(user) },
    );
    expect(again.status).toBe(404);
    expectErrorEnvelope(again);
  });

  it("delete → 204, subsequent detail → 404", async () => {
    const user = await registerUser(app, "pf048-col-delete");
    const created = await hit(app, "post", "/api/v1/collections", {
      body: { name: "Doomed" },
      headers: bearer(user),
    });
    const id = created.body.data.id as string;

    const del = await hit(app, "delete", `/api/v1/collections/${id}`, {
      headers: bearer(user),
    });
    expect(del.status).toBe(204);

    const gone = await hit(app, "get", `/api/v1/collections/${id}`, {
      headers: bearer(user),
    });
    expect(gone.status).toBe(404);
    expectErrorEnvelope(gone);
  });

  it("ownership isolation — foreign ids read/patch/delete as flat 404s both ways", async () => {
    const alice = await registerUser(app, "pf048-col-alice");
    const bob = await registerUser(app, "pf048-col-bob");

    const aliceCol = await hit(app, "post", "/api/v1/collections", {
      body: { name: "Alice's kit", effectIds: [EFFECT_IDS[0]!] },
      headers: bearer(alice),
    });
    expect(aliceCol.status).toBe(201);
    const aliceId = aliceCol.body.data.id as string;

    const bobCol = await hit(app, "post", "/api/v1/collections", {
      body: { name: "Bob's kit" },
      headers: bearer(bob),
    });
    expect(bobCol.status).toBe(201);

    // Bob cannot see, edit, or delete Alice's collection — flat 404s.
    const bobSees = await hit(app, "get", `/api/v1/collections/${aliceId}`, {
      headers: bearer(bob),
    });
    expect(bobSees.status).toBe(404);
    const bobPatches = await hit(app, "patch", `/api/v1/collections/${aliceId}`, {
      body: { name: "Stolen" },
      headers: bearer(bob),
    });
    expect(bobPatches.status).toBe(404);
    const bobDeletes = await hit(
      app,
      "delete",
      `/api/v1/collections/${aliceId}`,
      { headers: bearer(bob) },
    );
    expect(bobDeletes.status).toBe(404);

    // Bob's list contains only his own collection.
    const bobList = await hit(app, "get", "/api/v1/collections", {
      headers: bearer(bob),
    });
    expect(bobList.body.meta.total).toBe(1);
    expect(
      (bobList.body.data as Array<{ id: string }>).some(
        (c) => c.id === aliceId,
      ),
    ).toBe(false);

    // …and Alice's collection survived Bob's attempts untouched.
    const aliceDetail = await hit(
      app,
      "get",
      `/api/v1/collections/${aliceId}`,
      { headers: bearer(alice) },
    );
    expect(aliceDetail.status).toBe(200);
    expect(aliceDetail.body.data.name).toBe("Alice's kit");
  });

  it("audit rows: collections.collection.* + collections.effect.* (PF-009 A6)", async () => {
    const user = await registerUser(app, "pf048-col-audit");

    const created = await hit(app, "post", "/api/v1/collections", {
      body: { name: "Audited" },
      headers: bearer(user),
    });
    const id = created.body.data.id as string;
    await hit(app, "patch", `/api/v1/collections/${id}`, {
      body: { name: "Audited v2" },
      headers: bearer(user),
    });
    await hit(app, "post", `/api/v1/collections/${id}/effects`, {
      body: { effectId: EFFECT_IDS[0]! },
      headers: bearer(user),
    });
    await hit(
      app,
      "delete",
      `/api/v1/collections/${id}/effects/${EFFECT_IDS[0]}`,
      { headers: bearer(user) },
    );
    await hit(app, "delete", `/api/v1/collections/${id}`, {
      headers: bearer(user),
    });

    const expected: Record<string, string | null> = {
      "collections.collection.create": id,
      "collections.collection.update": id,
      "collections.effect.add": id,
      "collections.effect.remove": id,
      "collections.collection.delete": id,
    };
    for (const [action, resourceId] of Object.entries(expected)) {
      const rows = await db.enterpriseAuditLog.findMany({
        where: { userId: user.id, action },
        orderBy: { createdAt: "desc" },
      });
      expect(rows.length, `audit action ${action}`).toBeGreaterThanOrEqual(1);
      const row = rows[0]!;
      expect(row.orgId).toBe("platform");
      expect(row.resourceType).toBe("collection");
      expect(row.resourceId).toBe(resourceId);
      const meta = JSON.parse(row.metadataJson) as {
        requestId?: string;
        effectId?: string;
      };
      expect(typeof meta.requestId).toBe("string");
    }

    // The membership events carry the effect id in their metadata.
    const addRow = await db.enterpriseAuditLog.findFirst({
      where: { userId: user.id, action: "collections.effect.add" },
    });
    const addMeta = JSON.parse(addRow!.metadataJson) as { effectId?: string };
    expect(addMeta.effectId).toBe(EFFECT_IDS[0]);
  });
});
