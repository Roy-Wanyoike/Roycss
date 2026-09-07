/**
 * SECURITY SUITE (PF-007) — authorization (role + ownership).
 *
 *   1. admin-only route: POST /governance/approvals/:id/approve is gated by
 *      requireRole("ADMIN") — a VALID regular-user token gets 403
 *      FORBIDDEN (authenticated, insufficient role), never 500 and never
 *      a success. The same for /reject.
 *   2. ownership scoping: GET /auth/api-keys only lists the CALLER's keys —
 *      user B never sees user A's key id.
 *   3. cross-tenant revoke: DELETE /auth/api-keys/:id for another user's
 *      key id → 404 (the route scopes by owner), never a foreign delete.
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";
import {
  hit,
  registerUser,
  bearer,
  expectErrorEnvelope,
  expectSuccessEnvelope,
} from "../helpers/api-client.js";

const app = createApp();

/**
 * Stage an ORG-SCOPED governance approval so the requireRole("ADMIN")
 * chain is actually exercised: org → policy (orgId set) → pending
 * approval → membership rows. Follows the staging pattern proven in
 * tests/integration/authz.test.ts (issue #64), minimized to the needs of
 * the security suite: an ADMIN member (control) + a regular user with a
 * low-privilege VIEWER membership (target).
 */
async function stageOrgScopedApproval() {
  const admin = await registerUser(app, "sec-authz-admin");
  const viewer = await registerUser(app, "sec-authz-viewer");

  const orgId = `sec-org-${crypto.randomUUID()}`;
  const policyId = `sec-pol-${crypto.randomUUID()}`;
  const approvalId = `sec-appr-${crypto.randomUUID()}`;

  await db.organization.create({
    data: { id: orgId, slug: orgId, name: "Security Suite Org" },
  });
  await db.governancePolicy.create({
    data: { id: policyId, orgId, name: "Security policy", rulesJson: "{}" },
  });
  await db.governanceApproval.create({
    data: {
      id: approvalId,
      policyId,
      userId: admin.id,
      resourceType: "publish",
      resourceId: "theme-sec-authz",
      decision: "pending",
    },
  });
  await db.membership.create({
    data: { orgId, userId: admin.id, role: "ADMIN" },
  });
  await db.membership.create({
    data: { orgId, userId: viewer.id, role: "VIEWER" },
  });
  return { approvalId, admin, viewer };
}

describe("security/authz: role + ownership enforcement", () => {
  it("1. admin-only governance approvals reject a regular-user token with 403", async () => {
    const { approvalId, viewer } = await stageOrgScopedApproval();

    for (const action of ["approve", "reject"]) {
      const res = await hit(
        app,
        "post",
        `/api/v1/governance/approvals/${approvalId}/${action}`,
        { body: {}, headers: bearer(viewer) },
      );

      expect(
        res.status,
        `POST /governance/approvals/:id/${action} with a VIEWER-member token`,
      ).toBe(403);
      expectErrorEnvelope(res);
      expect(res.body.error.code).toBe("FORBIDDEN");
    }

    // The approval decision must NOT have been mutated by the rejections.
    const row = await db.governanceApproval.findUnique({
      where: { id: approvalId },
    });
    expect(row!.decision).toBe("pending");
  });

  it("2. api-key listing is owner-scoped — user B never sees user A's keys", async () => {
    const userA = await registerUser(app, "authz-owner-a");
    const userB = await registerUser(app, "authz-owner-b");

    // User A mints a key.
    const mint = await hit(app, "post", "/api/v1/auth/api-keys", {
      body: { name: "authz-probe-key" },
      headers: bearer(userA),
    });
    expect(mint.status).toBe(201);
    const keyId = mint.body.data.apiKey.id as string;

    // User B lists their own (empty) key set — must not contain A's key.
    const listB = await hit(app, "get", "/api/v1/auth/api-keys", {
      headers: bearer(userB),
    });
    expect(listB.status).toBe(200);
    expectSuccessEnvelope(listB);
    const idsB = (listB.body.data as Array<{ id: string }>).map((k) => k.id);
    expect(idsB).not.toContain(keyId);

    // User A still sees their own key (control).
    const listA = await hit(app, "get", "/api/v1/auth/api-keys", {
      headers: bearer(userA),
    });
    expect(listA.status).toBe(200);
    const idsA = (listA.body.data as Array<{ id: string }>).map((k) => k.id);
    expect(idsA).toContain(keyId);
  });

  it("3. cross-user key revoke is a 404 — user B cannot delete user A's key", async () => {
    const userA = await registerUser(app, "authz-rev-a");
    const userB = await registerUser(app, "authz-rev-b");

    const mint = await hit(app, "post", "/api/v1/auth/api-keys", {
      body: { name: "authz-revoke-target" },
      headers: bearer(userA),
    });
    expect(mint.status).toBe(201);
    const keyId = mint.body.data.apiKey.id as string;

    const attempt = await hit(app, "delete", `/api/v1/auth/api-keys/${keyId}`, {
      headers: bearer(userB),
    });
    expect(attempt.status).toBe(404);
    expectErrorEnvelope(attempt);
    expect(attempt.body.error.code).toBe("NOT_FOUND");

    // The key survives — it was never B's to delete.
    const listA = await hit(app, "get", "/api/v1/auth/api-keys", {
      headers: bearer(userA),
    });
    const idsA = (listA.body.data as Array<{ id: string }>).map((k) => k.id);
    expect(idsA).toContain(keyId);
  });
});
