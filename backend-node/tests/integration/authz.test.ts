/**
 * Integration tests — authorization hardening (issue #64).
 *
 * Coverage matrix for the newly protected mutating endpoints:
 *   1. 401 — every protected POST/PUT/DELETE rejects requests with NO
 *      Authorization header (sweep across all 27 protected modules).
 *   2. 401 — a garbage/malformed Bearer token is rejected.
 *   3. 200/201 — happy path: register → login → Bearer token → mutation
 *      succeeds (themes CRUD lifecycle + workspace invite).
 *   4. 403 — requireRole("ADMIN") on org-scoped governance approvals:
 *      authenticated non-member → 403; VIEWER member → 403 (insufficient
 *      role); ADMIN member → 200.
 *   5. Global (non org-scoped) policies fall back to authentication-only.
 *   6. Read-only GET routes STAY PUBLIC (marketing surface regression).
 *
 * Conventions follow auth.test.ts: unique emails (uuid suffix) so
 * concurrent/repeated runs never collide on `User.email` @unique, and a
 * unique `X-Forwarded-For` IP per request so the in-memory rate limiter
 * (general 100/min/IP, auth 10/min/IP) never trips inside the suite.
 * The global setup file wipes all tables (including Membership) before
 * the run, so staged rows are fresh.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";
import { db } from "../../src/lib/db.js";

const app = createApp();

/** Generate a unique email so tests don't collide on `User.email` @unique. */
function uniqueEmail(prefix = "user"): string {
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
  email: string;
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
    email,
    accessToken: res.body.data.accessToken as string,
  };
}

// ─── 1. Sweep: every protected mutating endpoint returns 401 anonymous ────
//
// requireAuth is mounted FIRST in each chain, so a missing token must be
// rejected before body validation runs — an empty/irrelevant body is
// therefore fine for the sweep.
const PROTECTED_MUTATING_ENDPOINTS: Array<{
  method: "post" | "put" | "delete";
  path: string;
}> = [
  // Prisma-backed persistence modules
  { method: "post", path: "/api/v1/themes" },
  { method: "put", path: "/api/v1/themes/theme-x" },
  { method: "delete", path: "/api/v1/themes/theme-x" },
  { method: "post", path: "/api/v1/studio/projects" },
  { method: "put", path: "/api/v1/studio/projects/prj-x" },
  { method: "delete", path: "/api/v1/studio/projects/prj-x" },
  { method: "post", path: "/api/v1/cloud/projects" },
  { method: "delete", path: "/api/v1/cloud/projects/prj-x" },
  { method: "post", path: "/api/v1/preview/create" },
  { method: "delete", path: "/api/v1/preview/prev-x" },
  { method: "post", path: "/api/v1/deploy/create" },
  { method: "post", path: "/api/v1/fleet/scan" },
  { method: "post", path: "/api/v1/profiler/start" },
  { method: "post", path: "/api/v1/live/sessions" },
  { method: "post", path: "/api/v1/live/sessions/sess-x/message" },
  { method: "post", path: "/api/v1/enterprise/organizations" },
  { method: "post", path: "/api/v1/governance/approvals/appr-x/approve" },
  { method: "post", path: "/api/v1/governance/approvals/appr-x/reject" },
  { method: "post", path: "/api/v1/compliance/scan" },
  { method: "post", path: "/api/v1/blocks" },
  { method: "post", path: "/api/v1/benchmark/run" },
  { method: "post", path: "/api/v1/academy/paths/path-x/progress" },
  { method: "post", path: "/api/v1/challenges/ch-x/submit" },
  { method: "post", path: "/api/v1/certifications/cert-x/exam" },
  { method: "post", path: "/api/v1/marketplace/templates" },
  { method: "post", path: "/api/v1/open/rfcs/rfc-x/vote" },
  { method: "post", path: "/api/v1/spotlight/submit" },
  { method: "post", path: "/api/v1/bundle/analyze" },
  { method: "post", path: "/api/v1/workspace/invite" },
  // Conditionally-external modules (S3 storage / LLM-backed services)
  { method: "post", path: "/api/v1/storage/upload" },
  { method: "delete", path: "/api/v1/storage/files/file-x" },
  { method: "post", path: "/api/v1/architect/generate" },
  { method: "post", path: "/api/v1/pair/chat" },
  { method: "post", path: "/api/v1/designer/generate" },
  { method: "post", path: "/api/v1/mentor/chat" },
  { method: "post", path: "/api/v1/review/code" },
];

describe("issue #64 — requireAuth on mutating endpoints", () => {
  it("1. returns 401 UNAUTHORIZED (error envelope) for every protected endpoint when no token is sent", async () => {
    for (const endpoint of PROTECTED_MUTATING_ENDPOINTS) {
      const res = await request(app)
        [endpoint.method](endpoint.path)
        .set("X-Forwarded-For", uniqueIp())
        .send({});

      expect.soft(res.status, `${endpoint.method.toUpperCase()} ${endpoint.path}`).toBe(401);
      expect.soft(
        res.body?.error?.code,
        `${endpoint.method.toUpperCase()} ${endpoint.path}`,
      ).toBe("UNAUTHORIZED");
      expect.soft(
        typeof res.body?.error?.message,
        `${endpoint.method.toUpperCase()} ${endpoint.path}`,
      ).toBe("string");
    }
  });

  it("2. returns 401 for a garbage Bearer token (themes + workspace + governance)", async () => {
    const cases = [
      { method: "post" as const, path: "/api/v1/themes" },
      { method: "post" as const, path: "/api/v1/workspace/invite" },
      { method: "post" as const, path: "/api/v1/governance/approvals/appr-x/approve" },
    ];
    for (const c of cases) {
      const res = await request(app)
        [c.method](c.path)
        .set("X-Forwarded-For", uniqueIp())
        .set("Authorization", "Bearer this-is-not-a-jwt")
        .send({});
      expect.soft(res.status, `${c.method.toUpperCase()} ${c.path}`).toBe(401);
      expect.soft(res.body?.error?.code).toBe("UNAUTHORIZED");
    }
  });

  it("3. happy path — register → Bearer token → full themes CRUD lifecycle (201/200/204) + DB round-trip", async () => {
    const user = await registerUser("themes");
    const authHeader = `Bearer ${user.accessToken}`;

    // POST — create with a valid payload.
    const createRes = await request(app)
      .post("/api/v1/themes")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", authHeader)
      .send({
        name: "Authz Test Theme",
        primary: "#10b981",
        secondary: "#3b82f6",
        accent: "#f59e0b",
        background: "#0f172a",
        foreground: "#f8fafc",
        tokens: {},
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe("Authz Test Theme");
    const themeId = createRes.body.data.id as string;

    // DB round-trip — the row actually landed in the Theme table.
    const row = await db.theme.findUnique({ where: { id: themeId } });
    expect(row).not.toBeNull();
    expect(row!.name).toBe("Authz Test Theme");

    // GET stays PUBLIC (no Authorization header) — marketing surface.
    const getRes = await request(app)
      .get(`/api/v1/themes/${themeId}`)
      .set("X-Forwarded-For", uniqueIp())
      .send();
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(themeId);

    // PUT — update with the token.
    const putRes = await request(app)
      .put(`/api/v1/themes/${themeId}`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", authHeader)
      .send({ name: "Authz Renamed Theme" });
    expect(putRes.status).toBe(200);
    expect(putRes.body.data.name).toBe("Authz Renamed Theme");

    // DELETE — remove with the token.
    const delRes = await request(app)
      .delete(`/api/v1/themes/${themeId}`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", authHeader)
      .send();
    expect(delRes.status).toBe(204);

    // Row is gone.
    const gone = await db.theme.findUnique({ where: { id: themeId } });
    expect(gone).toBeNull();
  });

  it("4. happy path — register → Bearer token → POST /workspace/invite returns 201", async () => {
    const user = await registerUser("invite");
    const res = await request(app)
      .post("/api/v1/workspace/invite")
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ email: uniqueEmail("invited"), name: "Invited Member" });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toContain("@example.com");
    expect(res.body.data.role).toBe("viewer");
  });

  it("5. public read surface regression — anonymous GETs still return 200", async () => {
    // The marketing/demo site depends on public GET routes; these must
    // not have been caught by the auth hardening. (/health returns its
    // own status envelope rather than { data }; the others use { data }.)
    const paths = [
      "/api/v1/health",
      "/api/v1/themes",
      "/api/v1/workspace/team",
      "/api/v1/governance/approvals",
      "/api/v1/enterprise/organizations",
      "/api/v1/live/sessions",
    ];
    for (const path of paths) {
      const res = await request(app)
        .get(path)
        .set("X-Forwarded-For", uniqueIp())
        .send();
      expect.soft(res.status, `GET ${path}`).toBe(200);
      if (path === "/api/v1/health") {
        expect.soft(res.body?.status, `GET ${path} status`).toBe("ok");
      } else {
        expect.soft(res.body?.data !== undefined, `GET ${path} data envelope`).toBe(true);
      }
    }
  });
});

// ─── 6. requireRole("ADMIN") on org-scoped governance approvals ────────────
//
// Staging: an org-scoped GovernancePolicy (orgId set) + a pending
// GovernanceApproval referencing it + Membership rows for two of the
// three registered users (ADMIN + VIEWER; the third has none).
describe("issue #64 — requireRole(ADMIN) on governance approvals (org-scoped policy)", () => {
  it("6. 401 without a token", async () => {
    const res = await request(app)
      .post("/api/v1/governance/approvals/appr-x/approve")
      .set("X-Forwarded-For", uniqueIp())
      .send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("7. 403 FORBIDDEN for an authenticated user with NO membership in the org", async () => {
    const { approvalId, outsider } = await stageOrgScopedApproval("nomember");
    const res = await request(app)
      .post(`/api/v1/governance/approvals/${approvalId}/approve`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${outsider.accessToken}`)
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toMatch(/not a member/i);
  });

  it("8. 403 FORBIDDEN for a VIEWER member (insufficient role)", async () => {
    const { approvalId, viewer } = await stageOrgScopedApproval("viewer");
    const res = await request(app)
      .post(`/api/v1/governance/approvals/${approvalId}/approve`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${viewer.accessToken}`)
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toMatch(/ADMIN or higher/i);
    // Decision must NOT have been mutated.
    const row = await db.governanceApproval.findUnique({
      where: { id: approvalId },
    });
    expect(row!.decision).toBe("pending");
  });

  it("9. 200 for an ADMIN member — approval flips to approved (+ DB round-trip)", async () => {
    const { approvalId, admin } = await stageOrgScopedApproval("admin");
    const res = await request(app)
      .post(`/api/v1/governance/approvals/${approvalId}/approve`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ reviewer: "authz-admin-test", note: "LGTM" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("approved");

    const row = await db.governanceApproval.findUnique({
      where: { id: approvalId },
    });
    expect(row!.decision).toBe("approved");
  });

  it("10. 200 for ANY authenticated user when the approval's policy is global (orgId null) — auth-only fallback", async () => {
    const outsider = await registerUser("globalpol");
    const policyId = `authz-pol-${crypto.randomUUID()}`;
    const approvalId = `authz-appr-${crypto.randomUUID()}`;
    // Global policy (orgId null) + an approval referencing it.
    await db.governancePolicy.create({
      data: {
        id: policyId,
        orgId: null,
        name: "Authz global policy",
        rulesJson: "{}",
      },
    });
    await db.governanceApproval.create({
      data: {
        id: approvalId,
        policyId,
        userId: null,
        resourceType: "publish",
        resourceId: "theme-global-test",
        decision: "pending",
      },
    });

    const res = await request(app)
      .post(`/api/v1/governance/approvals/${approvalId}/approve`)
      .set("X-Forwarded-For", uniqueIp())
      .set("Authorization", `Bearer ${outsider.accessToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("approved");
  });
});

// ─── Staging helpers ────────────────────────────────────────────────────────

interface OrgScopedStaging {
  orgId: string;
  policyId: string;
  approvalId: string;
  admin: RegisteredUser;
  viewer: RegisteredUser;
  outsider: RegisteredUser;
}

/**
 * Stage: org row + org-scoped policy + pending approval + memberships
 * (admin → ADMIN, viewer → VIEWER; outsider gets no membership).
 */
async function stageOrgScopedApproval(
  prefix: string,
): Promise<OrgScopedStaging> {
  const [admin, viewer, outsider] = await Promise.all([
    registerUser(`${prefix}-admin`),
    registerUser(`${prefix}-viewer`),
    registerUser(`${prefix}-outsider`),
  ]);

  const orgId = `authz-org-${crypto.randomUUID()}`;
  const policyId = `authz-pol-${crypto.randomUUID()}`;
  const approvalId = `authz-appr-${crypto.randomUUID()}`;

  await db.organization.create({
    data: { id: orgId, slug: orgId, name: `Authz Org ${prefix}` },
  });
  await db.governancePolicy.create({
    data: { id: policyId, orgId, name: `Authz policy ${prefix}`, rulesJson: "{}" },
  });
  await db.governanceApproval.create({
    data: {
      id: approvalId,
      policyId,
      userId: admin.id,
      resourceType: "publish",
      resourceId: "theme-authz-test",
      decision: "pending",
    },
  });
  await db.membership.create({
    data: { orgId, userId: admin.id, role: "ADMIN" },
  });
  await db.membership.create({
    data: { orgId, userId: viewer.id, role: "VIEWER" },
  });

  return { orgId, policyId, approvalId, admin, viewer, outsider };
}
