/**
 * Integration tests — audit trail coverage + admin query endpoint
 * (PF-009 / issue #94 A6).
 *
 *   1. POST /auth/register writes an EnterpriseAuditLog entry with
 *      actor, action, target, timestamp + requestId
 *   2. GET /api/v1/audit — 401 anonymous, 403 non-admin
 *   3. GET /api/v1/audit as admin: filters (actor=, action=, since=)
 *      return the register entry with its requestId
 *   4. Mutating routes across modules write audit entries:
 *      workspace invite + enterprise organization create
 */
import { describe, it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";

const app = createApp();

function uniqueIp(): string {
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.${Math.floor(Math.random() * 250)}.${rand}`;
}

const VALID_PASSWORD = "correct-horse-battery-staple-9";

interface RegisteredUser {
  id: string;
  email: string;
  accessToken: string;
}

async function registerUser(prefix: string): Promise<RegisteredUser> {
  const email = `${prefix}+${randomUUID()}@example.com`;
  const res = await request(app)
    .post("/api/v1/auth/register")
    .set("X-Forwarded-For", uniqueIp())
    .send({ email, password: VALID_PASSWORD, name: `${prefix} User` });
  expect(res.status).toBe(201);
  return {
    id: res.body.data.user.id as string,
    email,
    accessToken: res.body.data.accessToken as string,
  };
}

async function makeAdmin(userId: string): Promise<string> {
  const orgId = `org-${randomUUID()}`;
  await db.organization.create({
    data: { id: orgId, slug: orgId, name: `Org ${orgId.slice(0, 8)}`, plan: "team", seats: 10 },
  });
  await db.membership.create({
    data: { orgId, userId, role: "ADMIN" },
  });
  return orgId;
}

describe("audit coverage on mutating routes (issue #94 A6)", () => {
  it("1. POST /auth/register writes an audit row with actor/action/requestId", async () => {
    const user = await registerUser("audit");

    const rows = await db.enterpriseAuditLog.findMany({
      where: { userId: user.id, action: "auth.user.register" },
      orderBy: { createdAt: "desc" },
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);

    const row = rows[0]!;
    expect(row.orgId).toBe("platform");
    expect(row.resourceType).toBe("user");
    expect(row.resourceId).toBe(user.id);
    expect(row.createdAt).toBeTruthy();
    const meta = JSON.parse(row.metadataJson) as {
      requestId?: string;
      email?: string;
    };
    expect(meta.email).toBe(user.email);
    expect(typeof meta.requestId).toBe("string");
    expect((meta.requestId as string).length).toBeGreaterThan(0);
  });

  it("2. GET /api/v1/audit rejects anonymous + non-admin callers", async () => {
    const anon = await request(app)
      .get("/api/v1/audit")
      .set("X-Forwarded-For", uniqueIp());
    expect(anon.status).toBe(401);
    expect(anon.body.error.code).toBe("UNAUTHORIZED");

    const plain = await registerUser("auditplain");
    const forbidden = await request(app)
      .get("/api/v1/audit")
      .set("Authorization", `Bearer ${plain.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.message).toMatch(
      /ADMIN or higher in at least one organization/i,
    );
  });

  it("3. GET /api/v1/audit (admin) supports actor=/action=/since= filters", async () => {
    const user = await registerUser("auditfilter");
    const admin = await registerUser("auditadmin");
    await makeAdmin(admin.id);

    const res = await request(app)
      .get(
        `/api/v1/audit?actor=${user.id}&action=auth.user.register&since=2020-01-01T00:00:00.000Z&limit=10`,
      )
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.count).toBeGreaterThanOrEqual(1);
    const entry = res.body.data[0];
    expect(entry.actor).toBe(user.id);
    expect(entry.action).toBe("auth.user.register");
    expect(entry.requestId).toBeTruthy();
    expect(entry.timestamp).toBeTruthy();
    expect(entry.orgId).toBe("platform");

    // since= in the future → empty result.
    const future = await request(app)
      .get(`/api/v1/audit?actor=${user.id}&since=2999-01-01T00:00:00.000Z`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());
    expect(future.status).toBe(200);
    expect(future.body.data).toHaveLength(0);

    // Invalid since → 400 VALIDATION_ERROR.
    const bad = await request(app)
      .get(`/api/v1/audit?actor=${user.id}&since=not-a-date`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .set("X-Forwarded-For", uniqueIp());
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("4. workspace invite + enterprise org create write audit rows", async () => {
    const user = await registerUser("auditmulti");

    // Workspace invite (issue #64 protected route → Bearer token).
    const inviteEmail = `invited+${randomUUID()}@example.com`;
    const invite = await request(app)
      .post("/api/v1/workspace/invite")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .set("X-Forwarded-For", uniqueIp())
      .send({ email: inviteEmail, role: "editor" });
    expect(invite.status).toBe(201);

    const inviteAudit = await db.enterpriseAuditLog.findFirst({
      where: { userId: user.id, action: "workspace.member.invite" },
    });
    expect(inviteAudit).toBeTruthy();
    expect(inviteAudit!.resourceType).toBe("team_member");
    expect(
      (JSON.parse(inviteAudit!.metadataJson) as { email?: string }).email,
    ).toBe(inviteEmail);

    // Enterprise organization create.
    const org = await request(app)
      .post("/api/v1/enterprise/organizations")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .set("X-Forwarded-For", uniqueIp())
      .send({
        name: `Audit Org ${randomUUID().slice(0, 6)}`,
        plan: "team",
        seats: 5,
        ownerId: user.id,
      });
    expect(org.status).toBe(201);

    const orgAudit = await db.enterpriseAuditLog.findFirst({
      where: { userId: user.id, action: "enterprise.organization.create" },
    });
    expect(orgAudit).toBeTruthy();
    expect(orgAudit!.orgId).toBe(org.body.data.id);
    expect(orgAudit!.resourceId).toBe(org.body.data.id);
  });
});
