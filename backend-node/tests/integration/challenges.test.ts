/**
 * Integration tests — /api/v1/challenges (authz hardening, audit F-07).
 *
 * Challenges is the Prisma-backed catalog + submission store
 * (Challenge + ChallengeSubmission). Public read surface + the
 * authenticated submit route:
 *
 *   1. GET / + GET /:id + GET /leaderboard stay public (200 envelopes)
 *   2. POST /:id/submit anonymous → 401
 *   3. submission is attributed to the TOKEN SUBJECT — a spoofed body
 *      `userId` is stripped by Zod and ignored (audit F-07)
 *   4. self-graded pass (demo-integrity-limited): the seeded catalog
 *      ships free-form challenges with no checkable answer, so the
 *      client's `passed: true` claim is recorded on the submission
 *      row but scores 0 and NEVER touches the leaderboard
 *   5. server-graded pass: a challenge with a checkable `solutionCode`
 *      grades the submitted code itself — the client claim is IGNORED
 *      both ways (correct code + `passed: false` → server grades pass;
 *      wrong code + `passed: true` → server grades fail), score is
 *      awarded, and the leaderboard entry lands under the token subject
 *   6. unknown challenge id → 404; malformed body → 400
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

describe("challenges — public read surface", () => {
  it("GET / lists the seeded catalog with the collection envelope", async () => {
    const res = await hit(app, "get", "/api/v1/challenges");
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);
    expect(res.body.meta.count).toBe(res.body.data.length);
  });

  it("GET /:id returns a seeded challenge; unknown id → 404", async () => {
    const ok = await hit(app, "get", "/api/v1/challenges/ch-flex-center");
    expect(ok.status).toBe(200);
    expectSuccessEnvelope(ok);
    expect(ok.body.data.title).toBe("Center a Box with Flexbox");

    const missing = await hit(app, "get", "/api/v1/challenges/ch-nope");
    expect(missing.status).toBe(404);
    expectErrorEnvelope(missing);
  });

  it("GET /leaderboard returns the seeded entries (public)", async () => {
    const res = await hit(app, "get", "/api/v1/challenges/leaderboard");
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThanOrEqual(10);
  });
});

describe("challenges submit — attribution + grading (audit F-07)", () => {
  it("POST /:id/submit anonymous → 401 UNAUTHORIZED", async () => {
    const res = await hit(app, "post", "/api/v1/challenges/ch-flex-center/submit", {
      body: { code: ".x{}", passed: true },
    });
    expect(res.status).toBe(401);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("submission is attributed to the token subject — a spoofed body userId is stripped and ignored", async () => {
    const user = await registerUser(app, "challenges-attr");

    const res = await hit(app, "post", "/api/v1/challenges/ch-flex-center/submit", {
      // Legacy/spoofed shape: a client-supplied userId must be ignored.
      body: { userId: "victim-user-id", code: ".box { display: flex; }", passed: false },
      headers: bearer(user),
    });
    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    // The response echoes the verified attribution, not the body claim.
    expect(res.body.data.userId).toBe(user.id);
    expect(res.body.data.userId).not.toBe("victim-user-id");

    const row = await db.challengeSubmission.findFirst({
      where: { challengeId: "ch-flex-center", userId: user.id },
    });
    expect(row).not.toBeNull();

    const spoofed = await db.challengeSubmission.findFirst({
      where: { userId: "victim-user-id" },
    });
    expect(spoofed).toBeNull();
  });

  it("self-graded pass (no checkable answer) records the claim but scores 0 and leaves the leaderboard untouched", async () => {
    const user = await registerUser(app, "challenges-selfgrade");

    const boardBefore = await hit(app, "get", "/api/v1/challenges/leaderboard");
    expect(boardBefore.status).toBe(200);
    const before = boardBefore.body.data as Array<{
      userId: string;
      score: number;
      solved: number;
    }>;
    const scoresBefore = new Map(before.map((e) => [e.userId, e.score]));

    const res = await hit(app, "post", "/api/v1/challenges/ch-anim-bounce/submit", {
      // The seeded catalog ships solutionCode: "" — nothing to grade
      // against, so the claim is the only signal. It must not pay out.
      body: { code: "@keyframes bounce {}", passed: true, timeMs: 4_000 },
      headers: bearer(user),
    });
    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    expect(res.body.data.userId).toBe(user.id);
    // Honest semantics: recorded pass, unverified, zero score.
    expect(res.body.data.passed).toBe(true);
    expect(res.body.data.verified).toBe(false);
    expect(res.body.data.score).toBe(0);

    // The submission row exists (record-keeping) but carries score 0.
    const row = await db.challengeSubmission.findFirst({
      where: { challengeId: "ch-anim-bounce", userId: user.id },
    });
    expect(row).not.toBeNull();
    expect(row!.passed).toBe(true);
    expect(row!.score).toBe(0);

    // The leaderboard is byte-identical: no new entry, no score bumps.
    const boardAfter = await hit(app, "get", "/api/v1/challenges/leaderboard");
    const after = boardAfter.body.data as Array<{
      userId: string;
      score: number;
    }>;
    expect(after.some((e) => e.userId === user.id)).toBe(false);
    for (const [seedUserId, seedScore] of scoresBefore) {
      const entry = after.find((e) => e.userId === seedUserId);
      expect(entry, `seed entry ${seedUserId} unchanged`).toBeDefined();
      expect(entry!.score).toBe(seedScore);
    }
  });

  it("server-graded challenge: correct code + passed:false claim → server grades a verified pass, score + leaderboard under the token subject", async () => {
    const user = await registerUser(app, "challenges-graded-pass");
    const solution = ".hero { display: grid; gap: 1rem; }";

    // Stage a challenge that DOES carry a checkable answer.
    await db.challenge.create({
      data: {
        id: "ch-authz-graded",
        slug: "ch-authz-graded",
        title: "Authz graded challenge",
        description: "Server-graded fixture",
        difficulty: "easy",
        prompt: "Server-graded fixture",
        starterCode: "",
        solutionCode: solution,
        tagsJson: JSON.stringify({
          category: "layout",
          timeLimit: 10,
          participants: 1,
          completionRate: 1,
          xpReward: 50,
        }),
      },
    });

    const res = await hit(app, "post", "/api/v1/challenges/ch-authz-graded/submit", {
      // The client claims FAILURE with the correct code — the server
      // must grade the code itself and ignore the claim.
      body: { code: `  ${solution}  `, passed: false, timeMs: 30_000 },
      headers: bearer(user),
    });
    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    expect(res.body.data.userId).toBe(user.id);
    expect(res.body.data.passed).toBe(true);
    expect(res.body.data.verified).toBe(true);
    // xpReward 50 + time bonus ((10min - 30s) rounded to seconds → 570).
    expect(res.body.data.score).toBe(50 + 570);

    const row = await db.challengeSubmission.findFirst({
      where: { challengeId: "ch-authz-graded", userId: user.id },
    });
    expect(row).not.toBeNull();
    expect(row!.passed).toBe(true);
    expect(row!.score).toBe(620);

    // The verified pass entered the leaderboard under the token subject.
    const board = await hit(app, "get", "/api/v1/challenges/leaderboard");
    const entry = (board.body.data as Array<{ userId: string; score: number }>).find(
      (e) => e.userId === user.id,
    );
    expect(entry).toBeDefined();
    expect(entry!.score).toBe(620);
  });

  it("server-graded challenge: wrong code + passed:true claim → server grades a fail, no score, no leaderboard entry", async () => {
    const user = await registerUser(app, "challenges-graded-fail");

    const res = await hit(app, "post", "/api/v1/challenges/ch-authz-graded/submit", {
      // The client claims a pass with the WRONG code — the claim must
      // be ignored; this is the exact F-07 self-grading exploit.
      body: { code: ".hero { display: flex; }", passed: true, timeMs: 1_000 },
      headers: bearer(user),
    });
    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    expect(res.body.data.passed).toBe(false);
    expect(res.body.data.verified).toBe(true);
    expect(res.body.data.score).toBe(0);

    const row = await db.challengeSubmission.findFirst({
      where: { challengeId: "ch-authz-graded", userId: user.id },
    });
    expect(row).not.toBeNull();
    expect(row!.passed).toBe(false);
    expect(row!.score).toBe(0);

    // No leaderboard entry for the failed self-claim.
    const board = await hit(app, "get", "/api/v1/challenges/leaderboard");
    const entries = board.body.data as Array<{ userId: string }>;
    expect(entries.some((e) => e.userId === user.id)).toBe(false);
  });

  it("unknown challenge id → 404; malformed body → 400 VALIDATION_ERROR", async () => {
    const user = await registerUser(app, "challenges-guards");

    const missing = await hit(app, "post", "/api/v1/challenges/ch-nope/submit", {
      body: { code: ".x{}", passed: false },
      headers: bearer(user),
    });
    expect(missing.status).toBe(404);
    expectErrorEnvelope(missing);
    expect(missing.body.error.code).toBe("NOT_FOUND");

    const badBody = await hit(app, "post", "/api/v1/challenges/ch-flex-center/submit", {
      body: { passed: true },
      headers: bearer(user),
    });
    expect(badBody.status).toBe(400);
    expectErrorEnvelope(badBody);
    expect(badBody.body.error.code).toBe("VALIDATION_ERROR");
  });
});
