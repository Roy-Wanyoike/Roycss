/**
 * Integration tests — /api/v1/live (authz hardening, audit F-07).
 *
 * Live is the Prisma-backed collaborative-sessions store
 * (LiveSession + LiveMessage). Public read surface + the two
 * authenticated mutating routes:
 *
 *   1. GET /sessions + GET /sessions/:id + GET /sessions/:id/users
 *      stay public (seeded demo surface)
 *   2. POST /sessions + POST /sessions/:id/message anonymous → 401
 *   3. the session HOST is the token subject — a spoofed body
 *      `hostId` is stripped by Zod and ignored (audit F-07)
 *   4. the message AUTHOR is the token subject — a spoofed body
 *      `userId` is stripped by Zod and ignored (audit F-07)
 *   5. unknown session id → 404; empty content → 400
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

describe("live — public read surface", () => {
  it("GET /sessions lists the seeded sessions with the collection envelope", async () => {
    const res = await hit(app, "get", "/api/v1/live/sessions");
    expect(res.status).toBe(200);
    expectSuccessEnvelope(res);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.meta.count).toBe(res.body.data.length);
  });

  it("GET /sessions/:id + /users return seeded data; unknown id → 404", async () => {
    const ok = await hit(app, "get", "/api/v1/live/sessions/live-sess-aurora");
    expect(ok.status).toBe(200);
    expectSuccessEnvelope(ok);
    expect(ok.body.data.title).toContain("Aurora");

    const users = await hit(app, "get", "/api/v1/live/sessions/live-sess-aurora/users");
    expect(users.status).toBe(200);
    expectSuccessEnvelope(users);
    expect(users.body.data.length).toBe(3);

    const missing = await hit(app, "get", "/api/v1/live/sessions/live-sess-nope");
    expect(missing.status).toBe(404);
    expectErrorEnvelope(missing);
  });
});

describe("live sessions + messages — attribution (audit F-07)", () => {
  it("POST /sessions anonymous → 401 UNAUTHORIZED", async () => {
    const res = await hit(app, "post", "/api/v1/live/sessions", {
      body: { title: "Anon session" },
    });
    expect(res.status).toBe(401);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("the session host is the token subject — a spoofed body hostId is stripped and ignored", async () => {
    const user = await registerUser(app, "live-host");

    const res = await hit(app, "post", "/api/v1/live/sessions", {
      // Legacy/spoofed shape: a client-supplied hostId must be ignored.
      body: {
        title: "Attributed session",
        hostId: "victim-user-id",
        hostName: "Mallory",
      },
      headers: bearer(user),
    });
    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    const id = res.body.data.id as string;

    // The response reports the verified host, not the body claim.
    expect(res.body.data.hostId).toBe(user.id);
    expect(res.body.data.hostId).not.toBe("victim-user-id");

    const row = await db.liveSession.findUnique({ where: { id } });
    expect(row).not.toBeNull();
    expect(row!.ownerId).toBe(user.id);
    expect(row!.ownerId).not.toBe("victim-user-id");

    // The host roster entry is keyed by the verified subject (the
    // display name stays client-supplied metadata).
    const roster = await hit(app, "get", `/api/v1/live/sessions/${id}/users`);
    expect(roster.status).toBe(200);
    expect(roster.body.data.length).toBe(1);
    expect(roster.body.data[0].id).toBe(user.id);
    expect(roster.body.data[0].name).toBe("Mallory");
  });

  it("POST /sessions/:id/message anonymous → 401 UNAUTHORIZED", async () => {
    const res = await hit(
      app,
      "post",
      "/api/v1/live/sessions/live-sess-aurora/message",
      { body: { content: "anon hello" } },
    );
    expect(res.status).toBe(401);
    expectErrorEnvelope(res);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("the message author is the token subject — a spoofed body userId is stripped and ignored", async () => {
    const user = await registerUser(app, "live-author");

    const res = await hit(
      app,
      "post",
      "/api/v1/live/sessions/live-sess-aurora/message",
      {
        // Legacy/spoofed shape: a client-supplied userId must be ignored.
        body: { userId: "victim-user-id", content: "hello from the real user" },
        headers: bearer(user),
      },
    );
    expect(res.status).toBe(201);
    expectSuccessEnvelope(res);
    expect(res.body.data.userId).toBe(user.id);
    expect(res.body.data.userId).not.toBe("victim-user-id");
    expect(res.body.data.content).toBe("hello from the real user");

    const row = await db.liveMessage.findFirst({
      where: { sessionId: "live-sess-aurora", userId: user.id },
    });
    expect(row).not.toBeNull();
    expect(row!.content).toBe("hello from the real user");

    const spoofed = await db.liveMessage.findFirst({
      where: { userId: "victim-user-id" },
    });
    expect(spoofed).toBeNull();
  });

  it("unknown session → 404; empty content → 400 VALIDATION_ERROR", async () => {
    const user = await registerUser(app, "live-guards");

    const missing = await hit(
      app,
      "post",
      "/api/v1/live/sessions/live-sess-nope/message",
      { body: { content: "into the void" }, headers: bearer(user) },
    );
    expect(missing.status).toBe(404);
    expectErrorEnvelope(missing);
    expect(missing.body.error.code).toBe("NOT_FOUND");

    const empty = await hit(
      app,
      "post",
      "/api/v1/live/sessions/live-sess-aurora/message",
      { body: { content: "   " }, headers: bearer(user) },
    );
    expect(empty.status).toBe(400);
    expectErrorEnvelope(empty);
    expect(empty.body.error.code).toBe("VALIDATION_ERROR");
  });
});
