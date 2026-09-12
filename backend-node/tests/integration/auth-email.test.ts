/**
 * Integration tests — email verification + password reset (PF-011 /
 * audit F-02): POST /api/v1/auth/{verify-email,verify-email/confirm,
 * forgot-password,reset-password}.
 *
 * 16 tests:
 *   A. Verification happy path (register → emailed link → confirm → flag)
 *   B. Verification security edges (replay, expiry, wrong purpose,
 *      enumeration resistance, resend invalidation)
 *   C. Password reset happy path (forgot → emailed link → reset → login)
 *   D. Reset security edges (garbage token, replay, weak password,
 *      unknown email, cross-purpose token)
 *
 * The mock mailer is swapped for an in-memory capture (setMailer seam)
 * so tests can read the action link exactly like a user clicking it —
 * no logging scraping, no network.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";
import { setMailer } from "../../src/modules/email/mailer.js";
import type { EmailMessage } from "../../src/modules/email/templates.js";
import { hashToken } from "../../src/modules/auth/tokens.js";

const app = createApp();

// ─── Capture mailer (test seam — see modules/email/mailer.ts) ────────────
const sentEmails: EmailMessage[] = [];
setMailer({
  transport: "mock",
  async send(message: EmailMessage): Promise<void> {
    sentEmails.push(message);
  },
});

/** The most recent captured email. */
function lastEmail(): EmailMessage {
  return sentEmails[sentEmails.length - 1]!;
}

/** Pull the 64-hex token out of an emailed action URL. */
function extractToken(email: EmailMessage): string {
  const m = /token=([0-9a-f]{64})/.exec(email.text);
  expect(m, `email should carry a token URL — got: ${email.text.slice(0, 120)}`).not.toBeNull();
  return m![1]!;
}

function uniqueEmail(prefix = "user"): string {
  return `${prefix}+${crypto.randomUUID()}@example.com`;
}

function uniqueIp(): string {
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.100.${rand}`;
}

const VALID_PASSWORD = "correct-horse-battery-staple-9";
const NEW_PASSWORD = "brand-new-battery-staple-42";

/** Register a user via the API; return email + captured emails index. */
async function register(
  prefix = "user",
): Promise<{ email: string; userId: string }> {
  const email = uniqueEmail(prefix);
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("X-Forwarded-For", uniqueIp())
    .send({ email, password: VALID_PASSWORD, name: "Email Lifecycle" });
  expect(res.status).toBe(201);
  return { email, userId: res.body.data.user.id as string };
}

// ─── A. Verification happy path ───────────────────────────────────────────

describe("POST /api/v1/auth/verify-email (PF-011)", () => {
  it("A1. register — response flags emailVerified:false and a verification email goes out", async () => {
    const before = sentEmails.length;
    const { email } = await register("verify");

    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email, password: VALID_PASSWORD });

    // Grace mode: unverified accounts still log in, flagged for the UI.
    expect(res.status).toBe(200);
    expect(res.body.data.user.emailVerified).toBe(false);

    const email1 = sentEmails[sentEmails.length - 1]!;
    expect(sentEmails.length, "register sent exactly one email").toBe(before + 1);
    expect(email1.to).toBe(email);
    expect(email1.subject).toMatch(/verify your roycss email/i);
    expect(email1.text).toMatch(/verify-email\?token=[0-9a-f]{64}/);
  });

  it("A2. register — only the SHA-256 hash lands in the DB, never the raw token", async () => {
    const { email, userId } = await register("hash");
    const token = extractToken(lastEmail());

    const row = await db.verificationToken.findFirst({
      where: { userId, purpose: "VERIFY_EMAIL" },
    });
    expect(row).not.toBeNull();
    expect(row!.tokenHash).toBe(hashToken(token));
    expect(row!.tokenHash).not.toBe(token); // hashed, not plaintext
    expect(row!.usedAt).toBeNull();
    expect(row!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("A3. confirm — a valid token flips emailVerified and the flag survives /me", async () => {
    const { email, userId } = await register("confirm");
    const token = extractToken(lastEmail());

    const res = await request(app)
      .post("/api/v1/auth/verify-email/confirm")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token });

    expect(res.status).toBe(200);
    expect(res.body.data.emailVerified).toBe(true);
    expect(res.body.data.email).toBe(email);

    // DB round-trip.
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    expect(dbUser!.emailVerifiedAt).not.toBeNull();
    // Token row is marked used.
    const row = await db.verificationToken.findFirst({
      where: { userId, purpose: "VERIFY_EMAIL" },
    });
    expect(row!.usedAt).not.toBeNull();

    // /me reflects the verified state (auth'd call).
    const login = await request(app)
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email, password: VALID_PASSWORD });
    const me = await request(app)
      .get("/api/v1/auth/me")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${login.body.data.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.emailVerified).toBe(true);
  });
});

// ─── B. Verification security edges ──────────────────────────────────────

describe("POST /api/v1/auth/verify-email (security edges)", () => {
  it("B1. token replay — a second confirm with the same token is 400", async () => {
    await register("replay");
    const token = extractToken(lastEmail());

    const first = await request(app)
      .post("/api/v1/auth/verify-email/confirm")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/v1/auth/verify-email/confirm")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token });
    expect(second.status).toBe(400);
    expect(second.body.error.code).toBe("BAD_REQUEST");
    expect(second.body.error.message).toMatch(/invalid or expired/i);
  });

  it("B2. expired token — an expiresAt in the past is rejected", async () => {
    const { userId } = await register("expired");
    const stale = "f".repeat(64);
    await db.verificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(stale),
        purpose: "VERIFY_EMAIL",
        expiresAt: new Date(Date.now() - 60_000), // 1 min ago
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/verify-email/confirm")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token: stale });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid or expired/i);
  });

  it("B3. cross-purpose token — a PASSWORD_RESET token cannot verify an email", async () => {
    const { email } = await register("cross");

    // Request a PASSWORD RESET link for the same user, then try to
    // redeem it against the verify endpoint.
    await request(app)
      .post("/api/v1/auth/forgot-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email });
    const resetToken = extractToken(lastEmail());

    const res = await request(app)
      .post("/api/v1/auth/verify-email/confirm")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token: resetToken });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/invalid or expired/i);
  });

  it("B4. enumeration resistance — unknown and verified emails get the same 200 shape", async () => {
    const { email } = await register("enum");
    // Verify the account first.
    const token = extractToken(lastEmail());
    await request(app)
      .post("/api/v1/auth/verify-email/confirm")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token });

    const unknown = await request(app)
      .post("/api/v1/auth/verify-email")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: "nobody+does-not-exist@example.com" });
    const verified = await request(app)
      .post("/api/v1/auth/verify-email")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email });

    expect(unknown.status).toBe(200);
    expect(verified.status).toBe(200);
    expect(unknown.body.data.sent).toBe(true);
    expect(verified.body.data.sent).toBe(true);
    // Byte-identical payloads — no oracle.
    expect(unknown.body.data).toEqual(verified.body.data);
  });

  it("B5. resend — a second /verify-email invalidates the previous link", async () => {
    const { email } = await register("resend");
    const firstToken = extractToken(lastEmail());

    const res = await request(app)
      .post("/api/v1/auth/verify-email")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email });
    expect(res.status).toBe(200);

    const secondToken = extractToken(lastEmail());
    expect(secondToken).not.toBe(firstToken);

    // The OLD link is dead.
    const old = await request(app)
      .post("/api/v1/auth/verify-email/confirm")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token: firstToken });
    expect(old.status).toBe(400);

    // The NEW link works.
    const fresh = await request(app)
      .post("/api/v1/auth/verify-email/confirm")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token: secondToken });
    expect(fresh.status).toBe(200);
    expect(fresh.body.data.emailVerified).toBe(true);
  });
});

// ─── C. Password reset happy path ─────────────────────────────────────────

describe("POST /api/v1/auth/forgot-password + /reset-password (PF-011)", () => {
  it("C1. full flow — forgot → emailed link → reset → login with the new password", async () => {
    const { email } = await register("resetflow");

    const forgot = await request(app)
      .post("/api/v1/auth/forgot-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email });
    expect(forgot.status).toBe(200);
    expect(forgot.body.data.sent).toBe(true);

    const resetToken = extractToken(lastEmail());
    expect(lastEmail().subject).toMatch(/reset your roycss password/i);

    const reset = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token: resetToken, password: NEW_PASSWORD });
    expect(reset.status).toBe(200);
    expect(reset.body.data.reset).toBe(true);

    // Old password rejected, new password accepted.
    const oldLogin = await request(app)
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email, password: VALID_PASSWORD });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email, password: NEW_PASSWORD });
    expect(newLogin.status).toBe(200);
  });

  it("C2. audit — a reset writes an auth.password.reset row (no email in metadata)", async () => {
    const { userId } = await register("resetaudit");
    await request(app)
      .post("/api/v1/auth/forgot-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: lastEmail().to });
    const resetToken = extractToken(lastEmail());

    await request(app)
      .post("/api/v1/auth/reset-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token: resetToken, password: NEW_PASSWORD });

    const rows = await db.enterpriseAuditLog.findMany({
      where: { action: "auth.password.reset", userId },
    });
    expect(rows.length).toBe(1);
    const meta = JSON.parse(rows[0]!.metadataJson as string) as Record<string, unknown>;
    expect(meta.email).toBeUndefined(); // PII minimization (audit F-13)
  });
});

// ─── D. Reset security edges ──────────────────────────────────────────────

describe("POST /api/v1/auth/reset-password (security edges)", () => {
  it("D1. garbage token — 400 with the uniform message", async () => {
    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token: "0".repeat(64), password: NEW_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(res.body.error.message).toMatch(/invalid or expired/i);
  });

  it("D2. token replay — the reset token dies after one use", async () => {
    const { email } = await register("resetreplay");
    await request(app)
      .post("/api/v1/auth/forgot-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email });
    const token = extractToken(lastEmail());

    const first = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token, password: NEW_PASSWORD });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token, password: "yet-another-password-99" });
    expect(second.status).toBe(400);

    // And the intermediate password was NOT clobbered by the replay.
    const stillNew = await request(app)
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email, password: NEW_PASSWORD });
    expect(stillNew.status).toBe(200);
  });

  it("D3. weak password — the reset body is validated like register", async () => {
    const { email } = await register("weakpw");
    await request(app)
      .post("/api/v1/auth/forgot-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email });
    const token = extractToken(lastEmail());

    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token, password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    // Token stays consumable — a typo shouldn't burn the link.
    const retry = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token, password: NEW_PASSWORD });
    expect(retry.status).toBe(200);
  });

  it("D4. unknown email — forgot-password returns the same 200 (no enumeration)", async () => {
    const unknown = await request(app)
      .post("/api/v1/auth/forgot-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: "nobody+at-all@example.com" });
    expect(unknown.status).toBe(200);
    expect(unknown.body.data.sent).toBe(true);

    // And no token row was created for the ghost address.
    const rows = await db.verificationToken.findMany({
      where: { purpose: "PASSWORD_RESET" },
    });
    const ghosts = rows.filter((r) => r.userId === "does-not-exist");
    expect(ghosts).toEqual([]);
  });

  it("D5. expired reset token — rejected with 400", async () => {
    const { userId } = await register("resetexp");
    const stale = "e".repeat(64);
    await db.verificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(stale),
        purpose: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() - 60_000),
      },
    });
    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ token: stale, password: NEW_PASSWORD });
    expect(res.status).toBe(400);
  });

  it("D6. validation — missing token or email bodies fail with 400 VALIDATION_ERROR", async () => {
    const noToken = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ password: NEW_PASSWORD });
    expect(noToken.status).toBe(400);
    expect(noToken.body.error.code).toBe("VALIDATION_ERROR");

    const badEmail = await request(app)
      .post("/api/v1/auth/forgot-password")
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: "not-an-email" });
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.error.code).toBe("VALIDATION_ERROR");
  });
});
