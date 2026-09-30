/**
 * Integration tests — storage ownership + authorization (issue #268).
 *
 * The storage module's HTTP surface is owner-scoped end to end:
 *
 *   1. ALL routes (reads included) are 401 anonymous — GET /files,
 *      /usage, /files/:id lost their public-inventory status.
 *   2. Uploads are attributed to the Bearer-JWT `sub` (Prisma
 *      StorageFileOwner row); reads only ever return the caller's own
 *      rows — another user's id reads as the same flat 404 as an
 *      unknown one, and the public payloads carry no ownerId.
 *   3. DELETE is owner-scoped (204 for the owner, flat 404 cross-user)
 *      and ownerless legacy rows (the seed) are deletable ONLY by a
 *      platform ADMIN (`hasPlatformRole("ADMIN")` — requirePlatformRole's
 *      boolean form; non-admins get the flat 404, never a 403).
 *   4. The 10 GB quota stays GLOBAL (per-owner usage is scoped, the
 *      quota constant is not).
 *
 * Conventions follow authz.test.ts: unique emails (uuid suffix) so
 * repeated runs never collide on `User.email` @unique, and a unique
 * `X-Forwarded-For` IP per request so the in-memory rate limiter never
 * trips inside the suite. The storage catalog is reset to its seed in
 * `beforeEach` (shared worker — this file owns its mutations).
 */
import { beforeEach, describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";
import { _resetStorageForTest } from "../../src/modules/storage/service.js";

const app = createApp();

/** Generate a unique email so tests don't collide on `User.email` @unique. */
function uniqueEmail(prefix = "storage"): string {
  return `${prefix}+${crypto.randomUUID()}@example.com`;
}

/** Unique IP per request so the in-memory rate limiter never trips. */
function uniqueIp(): string {
  // 198.51.100.0/24 is reserved for documentation/testing (RFC 5737).
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.100.${rand}`;
}

const VALID_PASSWORD = "correct-horse-battery-staple-9"; // ≥8 chars, letter + number

interface RegisteredUser {
  id: string;
  accessToken: string;
}

/** Register a fresh user via the public API and return id + access token. */
async function registerUser(prefix: string): Promise<RegisteredUser> {
  const email = uniqueEmail(prefix);
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("X-Forwarded-For", uniqueIp())
    .send({ email, password: VALID_PASSWORD, name: `${prefix} User` });
  expect(res.status).toBe(201);
  expect(typeof res.body.data.accessToken).toBe("string");
  return {
    id: res.body.data.user.id as string,
    accessToken: res.body.data.accessToken as string,
  };
}

/** Stage a platform ADMIN (requirePlatformRole's decision domain): a
 *  user holding ADMIN in at least one organization. */
async function stagePlatformAdmin(prefix: string): Promise<RegisteredUser> {
  const admin = await registerUser(`${prefix}-admin`);
  const orgId = `storage-org-${crypto.randomUUID()}`;
  await db.organization.create({
    data: { id: orgId, slug: orgId, name: `Storage Org ${prefix}` },
  });
  await db.membership.create({
    data: { orgId, userId: admin.id, role: "ADMIN" },
  });
  return admin;
}

/** Upload a small file as `user` and return the created id. */
async function uploadAs(user: RegisteredUser, name: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/storage/upload")
    .set("X-Forwarded-For", uniqueIp())
    .set("Authorization", `Bearer ${user.accessToken}`)
    .send({ name, type: "image", size: 2048, mimeType: "image/webp" });
  expect(res.status).toBe(201);
  return res.body.data.id as string;
}

beforeEach(() => {
  _resetStorageForTest();
});

describe("issue #268 — reads are authenticated (no public inventory)", () => {
  it("1. GET /files, /usage and /files/:id are 401 anonymous", async () => {
    for (const path of ["/api/v1/storage/files", "/api/v1/storage/usage"]) {
      const res = await request(app)
        .get(path)
        .set("X-Forwarded-For", uniqueIp())
        .send();
      expect.soft(res.status, `GET ${path}`).toBe(401);
      expect.soft(res.body?.error?.code, `GET ${path}`).toBe("UNAUTHORIZED");
    }
    const detail = await request(app)
      .get("/api/v1/storage/files/file-1")
      .set("X-Forwarded-For", uniqueIp())
      .send();
    expect(detail.status).toBe(401);
    expect(detail.body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("issue #268 — uploads are attributed; reads are owner-scoped", () => {
  it("2. upload attributes the row to the caller; payloads carry no ownerId", async () => {
    const [owner, other] = await Promise.all([
      registerUser("owner"),
      registerUser("other"),
    ]);
    const id = await uploadAs(owner, "mine.webp");

    // The owner sees exactly their own rows.
    const list = await request(app)
      .get("/api/v1/storage/files")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send();
    expect(list.status).toBe(200);
    const rows = list.body.data as Array<Record<string, unknown>>;
    expect(rows.map((r) => r.id)).toEqual([id]);
    for (const row of rows) {
      expect(row).not.toHaveProperty("ownerId");
    }

    // Another user's list is empty — the seed and foreign rows invisible.
    const foreignList = await request(app)
      .get("/api/v1/storage/files")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${other.accessToken}`)
      .send();
    expect(foreignList.status).toBe(200);
    expect(foreignList.body.data).toEqual([]);

    // The owner row landed in the durable map.
    const tracked = await db.storageFileOwner.findUnique({ where: { id } });
    expect(tracked?.ownerId).toBe(owner.id);
  });

  it("3. detail reads: owner 200 · foreign + ownerless + unknown → the same flat 404", async () => {
    const [owner, other] = await Promise.all([
      registerUser("detail-owner"),
      registerUser("detail-other"),
    ]);
    const id = await uploadAs(owner, "detail.webp");

    const own = await request(app)
      .get(`/api/v1/storage/files/${id}`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send();
    expect(own.status).toBe(200);
    expect(own.body.data.id).toBe(id);
    expect(own.body.data).not.toHaveProperty("ownerId");

    for (const caller of [other, owner]) {
      for (const target of [id, "file-1", "never-existed.bin"]) {
        const res = await request(app)
          .get(`/api/v1/storage/files/${target}`)
          .set("X-Forwarded-For", uniqueIp())
          .set("Authorization", `Bearer ${caller.accessToken}`)
          .send();
        // `caller === owner` + `target === id` is the 200 above; every
        // other combination must be the uniform flat 404.
        if (caller === owner && target === id) continue;
        expect(res.status, `${caller === owner ? "owner" : "other"} → ${target}`).toBe(404);
        expect(res.body.error.code).toBe("NOT_FOUND");
      }
    }
  });

  it("4. usage is owner-scoped; the quota stays the global 10 GB", async () => {
    const owner = await registerUser("usage");
    await uploadAs(owner, "a.webp");
    await uploadAs(owner, "b.webp");

    const res = await request(app)
      .get("/api/v1/storage/usage")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send();
    expect(res.status).toBe(200);
    expect(res.body.data.fileCount).toBe(2);
    expect(res.body.data.used).toBe(4096);
    expect(res.body.data.quota).toBe(10 * 1024 * 1024 * 1024);
  });
});

describe("issue #268 — DELETE is owner-scoped; legacy rows are admin-only", () => {
  it("5. cross-user delete is a flat 404 and deletes nothing; owner delete is 204", async () => {
    const [owner, other] = await Promise.all([
      registerUser("del-owner"),
      registerUser("del-other"),
    ]);
    const id = await uploadAs(owner, "delete-me.webp");

    const foreign = await request(app)
      .delete(`/api/v1/storage/files/${id}`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${other.accessToken}`)
      .send();
    expect(foreign.status).toBe(404);
    expect(foreign.body.error.code).toBe("NOT_FOUND");

    // Nothing was deleted — the owner can still read it.
    const stillThere = await request(app)
      .get(`/api/v1/storage/files/${id}`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send();
    expect(stillThere.status).toBe(200);

    const own = await request(app)
      .delete(`/api/v1/storage/files/${id}`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send();
    expect(own.status).toBe(204);

    const gone = await request(app)
      .get(`/api/v1/storage/files/${id}`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send();
    expect(gone.status).toBe(404);

    // The durable owner row was cleaned up.
    expect(await db.storageFileOwner.findUnique({ where: { id } })).toBeNull();
  });

  it("6. anonymous DELETE stays 401", async () => {
    const res = await request(app)
      .delete("/api/v1/storage/files/file-1")
      .set("X-Forwarded-For", uniqueIp())
      .send();
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("7. ownerless legacy rows: regular user → flat 404 (no 403), platform ADMIN → 204", async () => {
    const user = await registerUser("legacy");
    const admin = await stagePlatformAdmin("legacy");

    // A regular user may not delete a legacy row — and must not learn it
    // exists: same flat 404 as any unknown id, never a 403.
    const denied = await request(app)
      .delete("/api/v1/storage/files/file-2")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send();
    expect(denied.status).toBe(404);
    expect(denied.body.error.code).toBe("NOT_FOUND");

    // The platform admin CAN delete ownerless legacy rows.
    const adminDelete = await request(app)
      .delete("/api/v1/storage/files/file-1")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send();
    expect(adminDelete.status).toBe(204);

    // A regular user deleting an UNKNOWN id reads the same flat 404 —
    // the two cases are indistinguishable (no enumeration).
    const unknown = await request(app)
      .delete("/api/v1/storage/files/never-existed.bin")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send();
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe("NOT_FOUND");
  });
});
