/**
 * Integration tests — account export + delete (audit F-13):
 * GET /api/v1/auth/export + DELETE /api/v1/auth/account.
 *
 * Coverage matrix:
 *   - export: full own-data dump (profile, favorites, collections,
 *     API-key metadata) with NO secrets in the payload
 *   - export: user-scoped only — another user's data never appears
 *   - export: 401 anonymous · works with a wildcard API key (dual
 *     credential, like /me) · 404 after deletion
 *   - delete: 401 anonymous · 401 with an API key (jwtOnly) · 401
 *     with a wrong password (account stays alive)
 *   - delete happy path: password re-confirmed → soft-delete grace —
 *     login/refresh/API-key//me all die immediately, row + content
 *     retained (deletedAt set), email stays reserved, audited
 *   - grace semantics: no emails to a deleted address, re-registration
 *     409, second delete reads like a wrong password (no state oracle)
 *   - purge: hard delete cascades through EVERY user-scoped table
 *     (favorites, collections, memberships, API keys, verification +
 *     refresh tokens) and frees the email
 */
import { describe, expect, it } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";
import { setMailer } from "../../src/modules/email/mailer.js";
import type { EmailMessage } from "../../src/modules/email/templates.js";
import { purgeDeletedUsers } from "../../src/modules/auth/service.js";

const app = createApp();

// ─── Capture mailer (test seam — setMailer, see modules/email/mailer.ts) ──
const sentEmails: EmailMessage[] = [];
setMailer({
  transport: "mock",
  async send(message: EmailMessage): Promise<void> {
    sentEmails.push(message);
  },
});

function uniqueEmail(prefix = "user"): string {
  return `${prefix}+${crypto.randomUUID()}@example.com`;
}

function uniqueIp(): string {
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.100.${rand}`;
}

const VALID_PASSWORD = "correct-horse-battery-staple-9";

interface Session {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

/** Register via the API; return the session credentials. */
async function registerSession(prefix = "acct"): Promise<Session> {
  const email = uniqueEmail(prefix);
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("X-Forwarded-For", uniqueIp())
    .send({ email, password: VALID_PASSWORD, name: `${prefix} User` });
  expect(res.status).toBe(201);
  return {
    userId: res.body.data.user.id as string,
    email,
    accessToken: res.body.data.accessToken as string,
    refreshToken: res.body.data.refreshToken as string,
  };
}

/** Real catalog effect ids for favorites/collections staging. */
async function effectIds(): Promise<string[]> {
  const res = await request(app)
    .get("/api/v1/effects?limit=3")
    .set("X-Forwarded-For", uniqueIp());
  expect(res.status).toBe(200);
  return (res.body.data as Array<{ id: string }>).map((e) => e.id);
}

/** Stage favorites + a collection + an API key for a user; return ids. */
async function stageContent(s: Session, ids: string[]) {
  for (const effectId of ids.slice(0, 2)) {
    const res = await request(app)
      .post(`/api/v1/favorites/${effectId}`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`);
    expect(res.status).toBe(201);
  }
  const col = await request(app)
    .post("/api/v1/collections")
    .set("X-Forwarded-For", uniqueIp())
    .set("Authorization", `Bearer ${s.accessToken}`)
    .send({ name: "My Export Set", description: "staged", effectIds: ids.slice(0, 2) });
  expect(col.status).toBe(201);
  const key = await request(app)
    .post("/api/v1/auth/api-keys")
    .set("X-Forwarded-For", uniqueIp())
    .set("Authorization", `Bearer ${s.accessToken}`)
    .send({ name: "export-test-key" });
  expect(key.status).toBe(201);
  return {
    collectionId: col.body.data.id as string,
    apiKeyPlaintext: key.body.data.key as string,
  };
}

// ─── GET /auth/export ─────────────────────────────────────────────────────

describe("GET /api/v1/auth/export (audit F-13)", () => {
  it("1. full own-data dump — profile, favorites, collections, API-key metadata, no secrets", async () => {
    const s = await registerSession("export");
    const ids = await effectIds();
    const { apiKeyPlaintext } = await stageContent(s, ids);

    const res = await request(app)
      .get("/api/v1/auth/export")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`);
    expect(res.status).toBe(200);

    const dump = res.body.data;
    expect(dump.format).toBe("roycss-account-export/v1");
    expect(typeof dump.exportedAt).toBe("string");

    // Profile — no passwordHash anywhere in the payload.
    expect(dump.user.id).toBe(s.userId);
    expect(dump.user.email).toBe(s.email);
    expect(JSON.stringify(dump)).not.toContain("passwordHash");
    expect(JSON.stringify(dump)).not.toContain(VALID_PASSWORD);

    // Favorites (rows, not catalog payloads — raw data only).
    expect(dump.favorites.length).toBe(2);
    expect(dump.favorites.map((f: { effectId: string }) => f.effectId).sort())
      .toEqual(ids.slice(0, 2).sort());
    for (const f of dump.favorites) {
      expect(typeof f.createdAt).toBeTruthy();
    }

    // Collections — effectIds parsed out of the JSON-string column.
    expect(dump.collections.length).toBe(1);
    expect(dump.collections[0].name).toBe("My Export Set");
    expect(dump.collections[0].effectIds.sort()).toEqual(ids.slice(0, 2).sort());

    // API keys — MASKED metadata only, never the plaintext or hashes.
    expect(dump.apiKeys.length).toBe(1);
    const k = dump.apiKeys[0];
    expect(k.name).toBe("export-test-key");
    expect(k.masked).toMatch(/^rk_live_…[A-Za-z0-9]{4}$/);
    expect(JSON.stringify(dump)).not.toContain("lookupHash");
    expect(JSON.stringify(dump)).not.toContain('"hash"');
    expect(JSON.stringify(dump)).not.toContain(apiKeyPlaintext); // never the key
  });

  it("2. user-scoped — another user's rows never appear in the dump", async () => {
    const a = await registerSession("isolated-a");
    const b = await registerSession("isolated-b");
    const ids = await effectIds();
    await stageContent(a, ids);
    await stageContent(b, ids);

    const res = await request(app)
      .get("/api/v1/auth/export")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${b.accessToken}`);
    expect(res.status).toBe(200);

    const dump = JSON.stringify(res.body.data);
    expect(dump).not.toContain(a.userId);
    expect(dump).not.toContain(a.email);
    expect(res.body.data.favorites.every(
      (f: { effectId: string }) => !a.email.includes(f.effectId),
    )).toBe(true);
    // b's own dump carries exactly one collection + one key (their own).
    expect(res.body.data.collections.length).toBe(1);
    expect(res.body.data.apiKeys.length).toBe(1);
  });

  it("3. anonymous — 401", async () => {
    const res = await request(app)
      .get("/api/v1/auth/export")
      .set("X-Forwarded-For", uniqueIp());
    expect(res.status).toBe(401);
  });

  it("4. wildcard API key works (dual credential, like /me)", async () => {
    const s = await registerSession("exportkey");
    const created = await request(app)
      .post("/api/v1/auth/api-keys")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({ name: "wildcard", scopes: ["*"] });
    expect(created.status).toBe(201);

    const res = await request(app)
      .get("/api/v1/auth/export")
      .set("X-Forwarded-For", uniqueIp())
      .set("X-API-Key", created.body.data.key);
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(s.userId);
  });

  it("5. after deletion — 404 (grace-period data is not served)", async () => {
    const s = await registerSession("exportgone");
    const del = await request(app)
      .delete("/api/v1/auth/account")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({ password: VALID_PASSWORD });
    expect(del.status).toBe(200);

    const res = await request(app)
      .get("/api/v1/auth/export")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`);
    expect(res.status).toBe(404);
  });

  it("6. audit — an auth.account.export row is written (nothing about contents)", async () => {
    const s = await registerSession("exportaudit");
    await request(app)
      .get("/api/v1/auth/export")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`);

    const row = await db.enterpriseAuditLog.findFirst({
      where: { action: "auth.account.export", userId: s.userId },
    });
    expect(row).not.toBeNull();
    const meta = JSON.parse(row!.metadataJson as string) as Record<string, unknown>;
    expect(meta.email).toBeUndefined(); // PII minimization
  });
});

// ─── DELETE /auth/account ─────────────────────────────────────────────────

describe("DELETE /api/v1/auth/account (audit F-13)", () => {
  it("7. anonymous — 401", async () => {
    const res = await request(app)
      .delete("/api/v1/auth/account")
      .set("X-Forwarded-For", uniqueIp())
      .send({ password: VALID_PASSWORD });
    expect(res.status).toBe(401);
  });

  it("8. API key — 401 (jwtOnly: a key must not delete the owner's account)", async () => {
    const s = await registerSession("keydel");
    const created = await request(app)
      .post("/api/v1/auth/api-keys")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({ name: "wildcard", scopes: ["*"] });
    expect(created.status).toBe(201);

    const res = await request(app)
      .delete("/api/v1/auth/account")
      .set("X-Forwarded-For", uniqueIp())
      .set("X-API-Key", created.body.data.key)
      .send({ password: VALID_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/bearer jwt/i);
  });

  it("9. wrong password — 401, the account stays alive", async () => {
    const s = await registerSession("wrongpw");

    const res = await request(app)
      .delete("/api/v1/auth/account")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({ password: "this-is-the-wrong-password-7" });
    expect(res.status).toBe(401);

    // Still alive.
    const login = await request(app)
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: s.email, password: VALID_PASSWORD });
    expect(login.status).toBe(200);
    const row = await db.user.findUnique({
      where: { id: s.userId },
      select: { deletedAt: true },
    });
    expect(row!.deletedAt).toBeNull();
  });

  it("10. missing password body — 400 VALIDATION_ERROR", async () => {
    const s = await registerSession("nobody");
    const res = await request(app)
      .delete("/api/v1/auth/account")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("11. happy path — soft delete: every credential dies NOW, row retained for grace", async () => {
    const s = await registerSession("delete");
    const ids = await effectIds();
    const { apiKeyPlaintext } = await stageContent(s, ids);

    const res = await request(app)
      .delete("/api/v1/auth/account")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({ password: VALID_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
    expect(res.body.data.purgeAfterDays).toBe(30);
    expect(typeof res.body.data.deletedAt).toBeTruthy();
    expect(res.body.data.message).toMatch(/purged/i);

    // Grace: the row + user content survive, flagged deleted.
    const row = await db.user.findUnique({
      where: { id: s.userId },
      select: { deletedAt: true, favorites: { select: { id: true } }, collections: { select: { id: true } } },
    });
    expect(row).not.toBeNull();
    expect(row!.deletedAt).not.toBeNull();
    expect(row!.favorites.length).toBe(2);
    expect(row!.collections.length).toBe(1);

    // Login reads the account as gone (same 401 as wrong password).
    const login = await request(app)
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: s.email, password: VALID_PASSWORD });
    expect(login.status).toBe(401);
    expect(login.body.error.message).toMatch(/invalid email or password/i);

    // Refresh token revoked.
    const refresh = await request(app)
      .post("/api/v1/auth/refresh")
      .set("X-Forwarded-For", uniqueIp())
      .send({ refreshToken: s.refreshToken });
    expect(refresh.status).toBe(401);

    // API key revoked (401 on a scope-gated public read).
    const keyUse = await request(app)
      .get("/api/v1/effects?limit=1")
      .set("X-Forwarded-For", uniqueIp())
      .set("X-API-Key", apiKeyPlaintext);
    expect(keyUse.status).toBe(401);

    // /me reads as gone (the 15-min stateless access token can't
    // resurrect a deleted account).
    const me = await request(app)
      .get("/api/v1/auth/me")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`);
    expect(me.status).toBe(404);

    // No further emails go to a deleted address (forgot-password is
    // still an honest 200 — no enumeration — but nothing is sent).
    const before = sentEmails.length;
    const forgot = await request(app)
      .post("/api/v1/auth/forgot-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: s.email });
    expect(forgot.status).toBe(200);
    expect(forgot.body.data.sent).toBe(true);
    expect(sentEmails.length).toBe(before);

    // Email stays reserved during grace — re-registration 409.
    const reregister = await request(app)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: s.email, password: VALID_PASSWORD });
    expect(reregister.status).toBe(409);

    // A second delete with the CORRECT password reads exactly like a
    // wrong one — no grace-state oracle.
    const again = await request(app)
      .delete("/api/v1/auth/account")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({ password: VALID_PASSWORD });
    expect(again.status).toBe(401);

    // Audited.
    const audit = await db.enterpriseAuditLog.findFirst({
      where: { action: "auth.account.delete", userId: s.userId },
    });
    expect(audit).not.toBeNull();
  });

  it("12. purge — hard delete cascades through EVERY user-scoped table + frees the email", async () => {
    const s = await registerSession("purge");
    const ids = await effectIds();
    const { apiKeyPlaintext } = await stageContent(s, ids);
    // A membership row (org-scoped authorization — cascade target too).
    const org = await db.organization.create({
      data: { name: "Purge Org", slug: `purge-${crypto.randomUUID().slice(0, 8)}` },
    });
    await db.membership.create({
      data: { orgId: org.id, userId: s.userId, role: "OWNER" },
    });
    void apiKeyPlaintext;

    const del = await request(app)
      .delete("/api/v1/auth/account")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({ password: VALID_PASSWORD });
    expect(del.status).toBe(200);

    // Grace period elapsed (tiny cutoff — everything is "old" now).
    const purged = await purgeDeletedUsers(0);
    expect(purged).toBeGreaterThanOrEqual(1);

    // The row is gone.
    const user = await db.user.findUnique({ where: { id: s.userId } });
    expect(user).toBeNull();

    // …and every user-scoped table cascaded.
    expect(await db.effectFavorite.count({ where: { userId: s.userId } })).toBe(0);
    expect(await db.collection.count({ where: { userId: s.userId } })).toBe(0);
    expect(await db.membership.count({ where: { userId: s.userId } })).toBe(0);
    expect(await db.apiKey.count({ where: { ownerId: s.userId } })).toBe(0);
    expect(await db.refreshToken.count({ where: { userId: s.userId } })).toBe(0);
    expect(await db.verificationToken.count({ where: { userId: s.userId } })).toBe(0);

    // The email is free again — re-registration works.
    const reregister = await request(app)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: s.email, password: "a-fresh-password-11" });
    expect(reregister.status).toBe(201);

    // And a purge with nothing eligible is a no-op.
    expect(await purgeDeletedUsers(0)).toBe(0);
  });
});
