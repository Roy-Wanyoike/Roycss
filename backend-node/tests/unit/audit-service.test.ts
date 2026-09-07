/**
 * Unit tests — audit service (PF-009 / issue #94 A6).
 *
 * The Prisma client is mocked (vi.mock) so the writer is exercised
 * hermetically:
 *   1. recordAuditEvent writes actor/action/resource/requestId with the
 *      platform org sentinel
 *   2. A DB failure NEVER throws — the mutation stays intact
 *   3. queryAuditLog maps rows to domain entries and applies
 *      actor/action/since filters
 *
 * The end-to-end coverage (mutating routes → EnterpriseAuditLog rows →
 * GET /api/v1/audit guards) lives in tests/integration/audit.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();
const findManyMock = vi.fn();
const countMock = vi.fn();

vi.mock("../../src/lib/db.js", () => ({
  db: {
    enterpriseAuditLog: {
      create: (args: unknown) => createMock(args),
      findMany: (args: unknown) => findManyMock(args),
      count: (args: unknown) => countMock(args),
    },
  },
}));

import { recordAuditEvent, queryAuditLog } from "../../src/modules/audit/service.js";

beforeEach(() => {
  createMock.mockReset();
  findManyMock.mockReset();
  countMock.mockReset();
});

describe("recordAuditEvent (issue #94 A6)", () => {
  it("1. writes actor, action, target, requestId — requestId lands in metadataJson", async () => {
    createMock.mockResolvedValue({
      id: "audit-1",
      orgId: "platform",
      userId: "user-9",
      action: "auth.user.register",
      resourceType: "user",
      resourceId: "user-9",
      metadataJson: JSON.stringify({ requestId: "req-1", email: "a@b.c" }),
      createdAt: new Date("2025-06-01T00:00:00Z"),
    });

    const entry = await recordAuditEvent({
      actor: "user-9",
      action: "auth.user.register",
      resourceType: "user",
      resourceId: "user-9",
      requestId: "req-1",
      metadata: { email: "a@b.c" },
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const data = createMock.mock.calls[0]![0].data;
    expect(data).toMatchObject({
      orgId: "platform",
      userId: "user-9",
      action: "auth.user.register",
      resourceType: "user",
      resourceId: "user-9",
    });
    expect(JSON.parse(data.metadataJson)).toEqual({
      requestId: "req-1",
      email: "a@b.c",
    });

    expect(entry).toMatchObject({
      id: "audit-1",
      actor: "user-9",
      action: "auth.user.register",
      requestId: "req-1",
      timestamp: "2025-06-01T00:00:00.000Z",
    });
  });

  it("2. never throws on DB failure — returns null, mutation stays intact", async () => {
    createMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const entry = await recordAuditEvent({
      actor: "user-1",
      action: "workspace.member.invite",
      resourceType: "team_member",
    });
    expect(entry).toBeNull();
  });
});

describe("queryAuditLog (issue #94 A6)", () => {
  it("3. maps rows to domain entries and applies actor/action/since filters", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "audit-2",
        orgId: "org-1",
        userId: "user-7",
        action: "governance.approval.approve",
        resourceType: "approval",
        resourceId: "appr-1",
        metadataJson: JSON.stringify({ requestId: "req-2" }),
        createdAt: new Date("2025-06-02T12:00:00Z"),
      },
    ]);
    countMock.mockResolvedValue(1);

    const since = new Date("2025-06-01T00:00:00Z");
    const { items, total } = await queryAuditLog({
      actor: "user-7",
      action: "governance.approval.approve",
      since,
      limit: 25,
      offset: 50,
    });

    const where = findManyMock.mock.calls[0]![0].where;
    expect(where).toEqual({
      userId: "user-7",
      action: "governance.approval.approve",
      createdAt: { gte: since },
    });
    expect(findManyMock.mock.calls[0]![0]).toMatchObject({ take: 25, skip: 50 });
    expect(total).toBe(1);
    expect(items[0]).toMatchObject({
      id: "audit-2",
      orgId: "org-1",
      actor: "user-7",
      requestId: "req-2",
      resourceId: "appr-1",
    });
  });
});
