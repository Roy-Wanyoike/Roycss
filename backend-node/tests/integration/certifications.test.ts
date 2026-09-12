/**
 * Integration tests — /api/v1/certifications (authz hardening, audit F-07).
 *
 * Certifications is the Prisma-backed catalog + exam-attempt store
 * (Certification + CertificationAttempt). Public read/verify surface
 * + the authenticated exam route:
 *
 *   1. GET / + GET /:id stay public (seeded catalog envelopes)
 *   2. GET /verify/:code resolves a seeded credential (public)
 *   3. POST /:id/exam anonymous → 401
 *   4. the attempt is attributed to the TOKEN SUBJECT — a spoofed
 *      body `userId` is stripped by Zod and ignored (audit F-07)
 *   5. passing exam → server-scored pass, `CertificationAttempt` row
 *      under the token subject, earned credential carries the same id
 *   6. failing exam → recorded attempt, no earned credential
 *   7. wrong answer count → 400; unknown certification → 404
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

describe("certifications — public read/verify surface", () => {
  it("GET / lists the seeded catalog with the collection envelope", async () => {
    const res = await hit(app, "get", "/api/v1/certifications");
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.meta.count).toBe(res.body.data.length);
  });

  it("GET /:id returns a seeded certification; unknown id → 404", async () => {
    const ok = await hit(app, "get", "/api/v1/certifications/cert-associate");
    expect(ok.status).toBe(200);
    expectSuccessEnvelope(ok);
    expect(ok.body.data.name).toBe("RoyCSS Associate");

    const missing = await hit(app, "get", "/api/v1/certifications/cert-nope");
    expect(missing.status).toBe(404);
    expectErrorEnvelope(missing);
  });

  it("GET /verify/:code resolves a seeded credential (public)", async () => {
    const res = await hit(
      app,
      "get",
      "/api/v1/certifications/verify/ROY-MAYA-2025-PRO-88",
    );
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.userName).toBe("Maya Singh");
    expect(res.body.data.certificationId).toBe("cert-professional");
  });
});

describe("certifications exam — attribution (audit F-07)", () => {
  it("POST /:id/exam anonymous → 401 UNAUTHORIZED", async () => {
    const res = await hit(app, "post", "/api/v1/certifications/cert-associate/exam", {
      body: { userName: "Anon", answers: [0, 2, 0] },
    });
    expect(res.status).toBe(401);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("the attempt is attributed to the token subject — a spoofed body userId is stripped and ignored", async () => {
    const user = await registerUser(app, "certs-attr");

    const res = await hit(app, "post", "/api/v1/certifications/cert-associate/exam", {
      // Legacy/spoofed shape: a client-supplied userId must be ignored.
      body: { userId: "victim-user-id", userName: "Mallory", answers: [0, 2, 0] },
      headers: bearer(user),
    });
    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    // The response echoes the verified attribution, not the body claim.
    expect(res.body.data.userId).toBe(user.id);
    expect(res.body.data.userId).not.toBe("victim-user-id");

    const row = await db.certificationAttempt.findFirst({
      where: { certificationId: "cert-associate", userId: user.id },
    });
    expect(row).not.toBeNull();
    expect(row!.passed).toBe(true);
    expect(row!.score).toBe(100);

    // Nothing was filed under the spoofed identity.
    const spoofed = await db.certificationAttempt.findFirst({
      where: { userId: "victim-user-id" },
    });
    expect(spoofed).toBeNull();
  });

  it("passing exam → server-scored pass + earned credential under the token subject", async () => {
    const user = await registerUser(app, "certs-pass");

    const res = await hit(app, "post", "/api/v1/certifications/cert-associate/exam", {
      body: { userName: "Honest Holder", answers: [0, 2, 0] },
      headers: bearer(user),
    });
    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    expect(res.body.data.userId).toBe(user.id);
    expect(res.body.data.score).toBe(100);
    expect(res.body.data.passed).toBe(true);
    expect(res.body.data.earned).not.toBeNull();
    // The earned credential is attributed to the same verified subject.
    expect(res.body.data.earned.userId).toBe(user.id);
    expect(res.body.data.earned.verifyCode).toContain("HONEST");

    const row = await db.certificationAttempt.findFirst({
      where: { certificationId: "cert-associate", userId: user.id },
    });
    expect(row).not.toBeNull();
    expect(row!.score).toBe(100);
    expect(row!.passed).toBe(true);
  });

  it("failing exam → attempt recorded under the token subject, no earned credential", async () => {
    const user = await registerUser(app, "certs-fail");

    const res = await hit(app, "post", "/api/v1/certifications/cert-associate/exam", {
      body: { userName: "Try Again", answers: [1, 1, 1] },
      headers: bearer(user),
    });
    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    expect(res.body.data.userId).toBe(user.id);
    expect(res.body.data.score).toBe(0);
    expect(res.body.data.passed).toBe(false);
    expect(res.body.data.earned).toBeNull();

    const row = await db.certificationAttempt.findFirst({
      where: { certificationId: "cert-associate", userId: user.id },
    });
    expect(row).not.toBeNull();
    expect(row!.passed).toBe(false);
  });

  it("wrong answer count → 400; unknown certification → 404", async () => {
    const user = await registerUser(app, "certs-guards");

    const badCount = await hit(
      app,
      "post",
      "/api/v1/certifications/cert-associate/exam",
      { body: { userName: "Short", answers: [0] }, headers: bearer(user) },
    );
    // Service-level answer-count check (AppError.badRequest, not Zod).
    expect(badCount.status).toBe(400);
    expectErrorEnvelope(badCount);
    expect(badCount.body.error.code).toBe("BAD_REQUEST");

    const missing = await hit(app, "post", "/api/v1/certifications/cert-nope/exam", {
      body: { userName: "Ghost", answers: [0, 2, 0] },
      headers: bearer(user),
    });
    expect(missing.status).toBe(404);
    expectErrorEnvelope(missing);
    expect(missing.body.error.code).toBe("NOT_FOUND");
  });
});
