/**
 * Integration tests — refresh-token rotation + revocation (audit F-05):
 * POST /api/v1/auth/{refresh,logout,logout-all} + the DB row lifecycle.
 *
 * Coverage matrix:
 *   - route surface: logout + logout-all registered on the auth router
 *   - issuance: register/login create a HASHED RefreshToken row
 *     (tokenHash == SHA-256 of the JWT, never the plaintext)
 *   - rotation: /refresh issues a new pair, revokes the old row and
 *     chains it to its successor (replacedByHash)
 *   - reuse detection: replaying a rotated token → 401 AND every other
 *     session for that user dies too (the compromise kill-switch)
 *   - logout: revokes the presented token (refresh with it → 401) and
 *     is IDEMPOTENT (garbage/double logout still 200)
 *   - logout-all: Bearer-JWT-only (anonymous → 401, wildcard API key →
 *     401 — the jwtOnly convention), revokes every row, audited
 *   - password reset = session kill-switch: every refresh token dies
 *   - expired row → 401 (row is the source of truth, fail closed)
 *   - jti regression: two sessions issued in the same second produce
 *     DISTINCT refresh tokens (deterministic HS256 without jti used to
 *     collide on the tokenHash unique index)
 *
 * The mock mailer is swapped for an in-memory capture (setMailer seam)
 * so the reset-flow test can click the emailed link exactly like a user.
 */
import { describe, expect, it } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";
import { setMailer } from "../../src/modules/email/mailer.js";
import type { EmailMessage } from "../../src/modules/email/templates.js";
import { hashToken } from "../../src/modules/auth/tokens.js";

const app = createApp();

// ─── Capture mailer (test seam — setMailer, see modules/email/mailer.ts) ──
// Module-level so this file is self-contained even though the integration
// project shares the module registry across test files.
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
const NEW_PASSWORD = "brand-new-battery-staple-42";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Register via the API; return the issued token pair + user id. */
async function registerSession(
  prefix = "sess",
): Promise<TokenPair & { userId: string; email: string }> {
  const email = uniqueEmail(prefix);
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("X-Forwarded-For", uniqueIp())
    .send({ email, password: VALID_PASSWORD });
  expect(res.status).toBe(201);
  return {
    userId: res.body.data.user.id as string,
    email,
    accessToken: res.body.data.accessToken as string,
    refreshToken: res.body.data.refreshToken as string,
  };
}

/** Login via the API; return the issued token pair. */
async function loginSession(email: string): Promise<TokenPair> {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .set("X-Forwarded-For", uniqueIp())
    .send({ email, password: VALID_PASSWORD });
  expect(res.status).toBe(200);
  return {
    accessToken: res.body.data.accessToken as string,
    refreshToken: res.body.data.refreshToken as string,
  };
}

/** POST /auth/refresh with a given refresh token. */
function refresh(refreshToken: string) {
  return request(app)
    .post("/api/v1/auth/refresh")
    .set("X-Forwarded-For", uniqueIp())
    .send({ refreshToken });
}

/** POST /auth/logout with a given refresh token. */
function logout(refreshToken: string) {
  return request(app)
    .post("/api/v1/auth/logout")
    .set("X-Forwarded-For", uniqueIp())
    .send({ refreshToken });
}

/** The user's refresh-token rows, oldest first. */
function rowsFor(userId: string) {
  return db.refreshToken.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

describe("refresh-token issuance (audit F-05)", () => {
  it("1. register — lands a HASHED RefreshToken row (never the plaintext)", async () => {
    const s = await registerSession("issue");

    const rows = await rowsFor(s.userId);
    expect(rows.length).toBe(1);
    const row = rows[0]!;
    expect(row.tokenHash).toBe(hashToken(s.refreshToken)); // sha256 at rest
    expect(row.tokenHash).not.toBe(s.refreshToken); // not plaintext
    expect(row.revokedAt).toBeNull();
    expect(row.replacedByHash).toBeNull();
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("2. jti regression — two sessions issued in the same second are DISTINCT tokens", async () => {
    // Before jti, HS256 signing was deterministic: register + login within
    // one second produced byte-identical refresh JWTs → unique-index
    // violation on tokenHash → login 409. Both calls happen as fast as
    // possible to keep them in the same second.
    const s = await registerSession("jti");
    const l = await loginSession(s.email);

    expect(l.refreshToken).not.toBe(s.refreshToken);

    const rows = await rowsFor(s.userId);
    expect(rows.length).toBe(2);
    expect(new Set(rows.map((r) => r.tokenHash)).size).toBe(2);
  });
});

describe("POST /api/v1/auth/refresh — rotation (audit F-05)", () => {
  it("3. rotation — new pair issued, old row revoked + chained to its successor", async () => {
    const s = await registerSession("rotate");

    const res = await refresh(s.refreshToken);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(s.email);
    const newRefresh = res.body.data.refreshToken as string;
    const newAccess = res.body.data.accessToken as string;
    expect(newRefresh).not.toBe(s.refreshToken);
    expect(typeof newAccess).toBe("string");

    const rows = await rowsFor(s.userId);
    expect(rows.length).toBe(2);

    const oldRow = rows.find((r) => r.tokenHash === hashToken(s.refreshToken))!;
    const newRow = rows.find((r) => r.tokenHash === hashToken(newRefresh))!;
    expect(oldRow, "old row still present (audit trail)").toBeDefined();
    expect(oldRow.revokedAt).not.toBeNull(); // rotated away
    expect(oldRow.replacedByHash).toBe(hashToken(newRefresh)); // chain
    expect(newRow.revokedAt).toBeNull(); // live successor
    expect(newRow.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("4. rotation chains — the successor refreshes in turn (multi-hop)", async () => {
    const s = await registerSession("chain");
    const first = await refresh(s.refreshToken);
    expect(first.status).toBe(200);

    const second = await refresh(first.body.data.refreshToken as string);
    expect(second.status).toBe(200);
    expect(second.body.data.refreshToken).not.toBe(first.body.data.refreshToken);

    const rows = await rowsFor(s.userId);
    expect(rows.length).toBe(3);
    expect(rows.filter((r) => r.revokedAt !== null).length).toBe(2); // both ancestors
    expect(rows.filter((r) => r.revokedAt === null).length).toBe(1); // current head
  });

  it("5. reuse detection — replaying a rotated token kills EVERY session", async () => {
    // The compromise story: a replayed (already-rotated) token means two
    // parties held it — the response is to revoke all user sessions.
    const s = await registerSession("reuse");
    // A second, independent session (e.g. another device).
    const other = await loginSession(s.email);

    const rotated = await refresh(s.refreshToken);
    expect(rotated.status).toBe(200);
    const head = rotated.body.data.refreshToken as string;

    // THEFT: the attacker replays the token the legitimate client rotated.
    const replay = await refresh(s.refreshToken);
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe("UNAUTHORIZED");

    // The legitimate successor AND the independent session both died.
    const afterHead = await refresh(head);
    expect(afterHead.status).toBe(401);
    const afterOther = await refresh(other.refreshToken);
    expect(afterOther.status).toBe(401);

    const rows = await rowsFor(s.userId);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.revokedAt, "every row revoked by the kill-switch").not.toBeNull();
    }
  });

  it("6. expired row — a JWT whose DB row is expired is rejected (fail closed)", async () => {
    const s = await registerSession("expiredrow");
    await db.refreshToken.updateMany({
      where: { userId: s.userId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const res = await refresh(s.refreshToken);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/invalid or expired/i);
  });

  it("7. no row — a valid-signature JWT without a row is rejected (row is the truth)", async () => {
    const s = await registerSession("norow");
    await db.refreshToken.deleteMany({ where: { userId: s.userId } });

    const res = await refresh(s.refreshToken);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/invalid or expired/i);
  });

  it("8. garbage token — 401 with the error envelope", async () => {
    const res = await refresh("not-a-jwt");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(typeof res.body.requestId).toBe("string");
  });
});

describe("POST /api/v1/auth/logout (audit F-05)", () => {
  it("9. logout revokes the presented token — the row dies, refresh → 401", async () => {
    const s = await registerSession("logout");

    const res = await logout(s.refreshToken);
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);

    const row = (await rowsFor(s.userId)).find(
      (r) => r.tokenHash === hashToken(s.refreshToken),
    )!;
    expect(row.revokedAt).not.toBeNull();

    const after = await refresh(s.refreshToken);
    expect(after.status).toBe(401);
  });

  it("10. logout is idempotent — garbage token and double logout stay 200", async () => {
    const garbage = await logout("garbage-token-value");
    expect(garbage.status).toBe(200);
    expect(garbage.body.data.ok).toBe(true);

    const s = await registerSession("idem");
    const first = await logout(s.refreshToken);
    expect(first.status).toBe(200);
    const second = await logout(s.refreshToken);
    expect(second.status).toBe(200);
    expect(second.body.data.ok).toBe(true);
  });

  it("11. logout without a body fails validation (400)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("X-Forwarded-For", uniqueIp())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/v1/auth/logout-all (audit F-05)", () => {
  it("12. anonymous — 401 (Bearer JWT required)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("X-Forwarded-For", uniqueIp())
      .send({});
    expect(res.status).toBe(401);
  });

  it("13. wildcard API key — 401 (jwtOnly: keys cannot lock the owner out)", async () => {
    const s = await registerSession("keylogout");
    const created = await request(app)
      .post("/api/v1/auth/api-keys")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({ name: "wildcard", scopes: ["*"] });
    expect(created.status).toBe(201);
    const plaintext = created.body.data.key as string;

    const res = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("X-Forwarded-For", uniqueIp())
      .set("X-API-Key", plaintext)
      .send({});
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/bearer jwt/i);
  });

  it("14. logout-all revokes every session + writes an audit row", async () => {
    const s = await registerSession("alldevices");
    const other = await loginSession(s.email); // second device
    await loginSession(s.email); // third device

    const res = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
    expect(res.body.data.revoked).toBe(3);

    const rows = await rowsFor(s.userId);
    expect(rows.length).toBe(3);
    for (const row of rows) {
      expect(row.revokedAt, "every device row revoked").not.toBeNull();
    }

    // Every device's refresh token is dead.
    const after = await refresh(other.refreshToken);
    expect(after.status).toBe(401);

    // Audit trail (auth.session.logout_all, actor = the caller).
    const audit = await db.enterpriseAuditLog.findFirst({
      where: { action: "auth.session.logout_all", userId: s.userId },
    });
    expect(audit).not.toBeNull();
  });

  it("15. logout-all is repeatable — a second call revokes 0 and stays 200", async () => {
    const s = await registerSession("alltwice");

    const first = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({});
    expect(first.status).toBe(200);
    expect(first.body.data.revoked).toBe(1);

    const second = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${s.accessToken}`)
      .send({});
    expect(second.status).toBe(200);
    expect(second.body.data.revoked).toBe(0);
  });
});

describe("password reset — session kill-switch (audit F-05)", () => {
  it("16. a successful reset revokes every issued refresh token", async () => {
    const s = await registerSession("resetkill");
    const other = await loginSession(s.email); // a borrowed session survives nothing

    const forgot = await request(app)
      .post("/api/v1/auth/forgot-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: s.email });
    expect(forgot.status).toBe(200);
    const m = /token=([0-9a-f]{64})/.exec(
      sentEmails[sentEmails.length - 1]!.text,
    );
    expect(m).not.toBeNull();

    const reset = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token: m![1], password: NEW_PASSWORD });
    expect(reset.status).toBe(200);

    // Both pre-reset sessions are dead.
    const afterA = await refresh(s.refreshToken);
    expect(afterA.status).toBe(401);
    const afterB = await refresh(other.refreshToken);
    expect(afterB.status).toBe(401);

    // …and a fresh login starts a clean session (with the NEW password).
    const fresh = await request(app)
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: s.email, password: NEW_PASSWORD });
    expect(fresh.status).toBe(200);
    expect(typeof fresh.body.data.refreshToken).toBe("string");
  });
});
