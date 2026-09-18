/**
 * Unit tests — sync service, mock mode (PF-007 / issue #126, chunk 1).
 *
 * FIGMA_TOKEN / GITHUB_TOKEN are guaranteed unset before import
 * (vi.hoisted) so the deterministic mock behavior is exercised
 * hermetically:
 *   - sync entries land at the head of history with bounded mock counts
 *   - the matching integration status row is updated (lastSync,
 *     resourceCount, connected) — including the tokens row flipping from
 *     "syncing" to "connected"
 *   - history is capped at 100 entries
 *   - reads are LRU-cached (same reference) and _resetSyncForTest
 *     restores the seed
 *
 * The token-configured REST paths live in sync-remote.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  delete process.env.FIGMA_TOKEN;
  delete process.env.GITHUB_TOKEN;
});

import {
  _resetSyncForTest,
  integrationsCount,
  listHistory,
  listStatus,
  syncFigma,
  syncGithub,
  syncTokens,
} from "../../src/modules/sync/service.js";
import {
  SyncFigmaSchema,
  SyncGithubSchema,
  SyncTokensSchema,
} from "../../src/modules/sync/schema.js";

beforeEach(() => {
  _resetSyncForTest();
});

describe("reads — mock mode", () => {
  it("1. listStatus returns the 4 seeded integrations; repeat calls hit the cache", async () => {
    const first = await listStatus();
    expect(first.map((s) => s.id)).toEqual([
      "sync-figma",
      "sync-github",
      "sync-tokens",
      "sync-adobe-xd",
    ]);
    expect(first[3]).toMatchObject({ status: "disconnected", lastSync: null });
    expect(integrationsCount()).toBe(4);

    const second = await listStatus();
    expect(second).toBe(first);
  });

  it("2. listHistory returns the 5 seeded entries; repeat calls hit the cache", async () => {
    const first = await listHistory();
    expect(first).toHaveLength(5);
    expect(first[0]).toMatchObject({
      service: "figma",
      status: "success",
      resourceCount: 248,
    });

    const second = await listHistory();
    expect(second).toBe(first);
  });
});

describe("syncFigma — mock fallback", () => {
  it("3. records a success entry with bounded mock counts and updates the figma status row", async () => {
    const entry = await syncFigma({ fileKey: "abc123" });

    expect(entry).toMatchObject({
      service: "figma",
      status: "success",
      resourceType: "design-tokens",
    });
    expect(entry.resourceCount).toBeGreaterThanOrEqual(200);
    expect(entry.resourceCount).toBeLessThanOrEqual(299);
    expect(entry.duration).toBeGreaterThanOrEqual(1200);
    expect(entry.duration).toBeLessThanOrEqual(2199);
    expect(entry.message).toBe(
      `Pulled ${entry.resourceCount} tokens from Figma file abc123.`,
    );
    expect(entry.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );

    const status = (await listStatus()).find((s) => s.service === "figma");
    expect(status).toMatchObject({
      status: "connected",
      resourceCount: entry.resourceCount,
      lastSync: entry.timestamp,
    });

    const history = await listHistory();
    expect(history[0]!.id).toBe(entry.id);
  });
});

describe("syncGithub — mock fallback", () => {
  it("4. records a success entry and updates the github status row", async () => {
    const entry = await syncGithub({ repo: "owner/repo", branch: "main" });

    expect(entry.service).toBe("github");
    expect(entry.resourceCount).toBeGreaterThanOrEqual(40);
    expect(entry.resourceCount).toBeLessThanOrEqual(79);
    expect(entry.message).toBe(
      `Pushed ${entry.resourceCount} files to owner/repo on main.`,
    );

    const status = (await listStatus()).find((s) => s.service === "github");
    expect(status!.resourceCount).toBe(entry.resourceCount);
    expect(status!.lastSync).toBe(entry.timestamp);
  });
});

describe("syncTokens — mock fallback", () => {
  it("5. a successful token push flips the tokens row from 'syncing' to 'connected'", async () => {
    const before = (await listStatus()).find((s) => s.service === "tokens");
    expect(before!.status).toBe("syncing");

    const entry = await syncTokens({ target: "github" });

    expect(entry).toMatchObject({
      service: "tokens",
      status: "success",
      resourceType: "design-tokens",
    });
    expect(entry.resourceCount).toBeGreaterThanOrEqual(250);
    expect(entry.resourceCount).toBeLessThanOrEqual(349);
    expect(entry.message).toBe(`Pushed ${entry.resourceCount} tokens to github.`);

    const after = (await listStatus()).find((s) => s.service === "tokens");
    expect(after!.status).toBe("connected");
    expect(after!.resourceCount).toBe(entry.resourceCount);
  });

  it("6. non-github targets take the mock path directly", async () => {
    const entry = await syncTokens({ target: "figma", namespace: "core" });
    expect(entry.message).toBe(
      `Pushed ${entry.resourceCount} tokens to figma.`,
    );
    expect(entry.resourceCount).toBeGreaterThanOrEqual(250);
  });
});

describe("history cap", () => {
  it("7. history never exceeds 100 entries", async () => {
    for (let i = 0; i < 102; i++) {
      await syncFigma({ fileKey: `file-${i}` });
    }
    const history = await listHistory();
    expect(history).toHaveLength(100);
    expect(history[0]!.message).toContain("file-101");
    expect(history[99]!.message).toContain("file-2");
  });
});

describe("_resetSyncForTest", () => {
  it("8. restores the seed statuses and history", async () => {
    await syncFigma({ fileKey: "x" });
    await syncGithub({ repo: "a/b", branch: "main" });
    _resetSyncForTest();

    expect(await listHistory()).toHaveLength(5);
    const tokens = (await listStatus()).find((s) => s.service === "tokens");
    expect(tokens!.status).toBe("syncing");
  });
});

describe("Zod schemas — rejection boundaries", () => {
  it("9. SyncFigmaSchema: fileKey is required and bounded; scope is optional", () => {
    expect(SyncFigmaSchema.safeParse({ fileKey: "" }).success).toBe(false);
    expect(
      SyncFigmaSchema.safeParse({ fileKey: "k".repeat(81) }).success,
    ).toBe(false);
    const parsed = SyncFigmaSchema.parse({ fileKey: " k " });
    expect(parsed.fileKey).toBe("k");
    expect(parsed.scope).toBeUndefined();
  });

  it("10. SyncGithubSchema: repo must be owner/name; branch defaults to main", () => {
    expect(
      SyncGithubSchema.safeParse({ repo: "not-a-repo" }).success,
    ).toBe(false);
    expect(
      SyncGithubSchema.safeParse({ repo: "owner/repo/extra" }).success,
    ).toBe(false);
    expect(SyncGithubSchema.parse({ repo: "owner/repo" }).branch).toBe("main");
  });

  it("11. SyncTokensSchema: target must be one of the four targets", () => {
    expect(SyncTokensSchema.safeParse({ target: "ftp" }).success).toBe(false);
    expect(
      SyncTokensSchema.safeParse({ target: "style-dictionary" }).success,
    ).toBe(true);
  });
});
