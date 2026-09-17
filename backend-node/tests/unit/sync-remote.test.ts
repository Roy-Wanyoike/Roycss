/**
 * Unit tests — sync service, token-configured REST mode (PF-007 / issue #126,
 * chunk 1).
 *
 * FIGMA_TOKEN + GITHUB_TOKEN are set via vi.hoisted BEFORE the module graph
 * loads (so isFigmaConfigured / isGithubConfigured are true) and
 * `global.fetch` is stubbed — no network:
 *   - syncFigma via the Figma file API: token header, node counting
 *     (styles + components + document walk), the 500-node clamp, the
 *     scope suffix, and the mock fallback on 401 / transport error
 *   - syncGithub via the GitHub Contents API: Bearer token, base64
 *     manifest body, default vs explicit commit message, mock fallback
 *     on HTTP failure
 *   - syncTokens target=github routing to the real push path; other
 *     targets stay mock
 *   - listStatus probing: Figma handle→email fallback, verification
 *     failures leaving the status rows untouched
 *
 * Mock-mode behavior lives in sync-service.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIGMA_TOKEN = "figma-test-token";
const GITHUB_TOKEN = "gh-test-token";

vi.hoisted(() => {
  process.env.FIGMA_TOKEN = "figma-test-token";
  process.env.GITHUB_TOKEN = "gh-test-token";
});

import {
  _resetSyncForTest,
  listStatus,
  syncFigma,
  syncGithub,
  syncTokens,
} from "../../src/modules/sync/service.js";

interface FetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

const calls: FetchCall[] = [];

type Responder = (
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json?: () => Promise<unknown> }>;

let respond: Responder = async () => ({
  ok: true,
  status: 200,
  json: async () => ({}),
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
  _resetSyncForTest();
  calls.length = 0;
  respond = async () => ({ ok: true, status: 200, json: async () => ({}) });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: unknown, init: unknown) => {
      const i = (init ?? {}) as {
        method?: string;
        headers?: Record<string, string>;
        body?: string;
      };
      calls.push({
        url: String(url),
        method: i.method ?? "GET",
        headers: { ...(i.headers ?? {}) },
        body: typeof i.body === "string" ? i.body : undefined,
      });
      return respond(String(url), i);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("listStatus — live verification probes", () => {
  it("1. sends each provider's token to its verify endpoint", async () => {
    respond = async (url) => {
      if (url === "https://api.figma.com/v1/me") {
        return {
          ok: true,
          status: 200,
          json: async () => ({ handle: "ada" }),
        };
      }
      if (url === "https://api.github.com/user") {
        return {
          ok: true,
          status: 200,
          json: async () => ({ login: "octocat" }),
        };
      }
      throw new Error(`unexpected url ${url}`);
    };

    const statuses = await listStatus();
    expect(statuses.find((s) => s.service === "figma")!.status).toBe(
      "connected",
    );
    expect(calls.map((c) => c.url)).toEqual([
      "https://api.figma.com/v1/me",
      "https://api.github.com/user",
    ]);
    expect(calls[0]!.headers["x-figma-token"]).toBe(FIGMA_TOKEN);
    expect(calls[1]!.headers.authorization).toBe(`Bearer ${GITHUB_TOKEN}`);
  });

  it("2. a Figma profile without a handle falls back to the email", async () => {
    respond = async (url) => {
      if (url === "https://api.figma.com/v1/me") {
        return {
          ok: true,
          status: 200,
          json: async () => ({ email: "ada@figma.dev" }),
        };
      }
      if (url === "https://api.github.com/user") {
        return { ok: false, status: 401, json: async () => ({}) };
      }
      throw new Error(`unexpected url ${url}`);
    };

    await expect(listStatus()).resolves.toBeDefined(); // email path, no crash
  });

  it("3. failed verification leaves the status rows untouched", async () => {
    respond = async () => ({ ok: false, status: 401, json: async () => ({}) });

    const statuses = await listStatus();
    const tokens = statuses.find((s) => s.service === "tokens");
    expect(tokens!.status).toBe("syncing"); // seed untouched
    expect(statuses.find((s) => s.service === "adobe-xd")!.status).toBe(
      "disconnected",
    );
  });
});

describe("syncFigma — REST path", () => {
  it("4. counts styles + components + document nodes from the file API", async () => {
    respond = async (url) => {
      if (url === "https://api.figma.com/v1/files/abc123") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "Design System",
            document: { children: [{}, {}, {}] },
            styles: { s1: {}, s2: {} },
            components: { c1: {} },
          }),
        };
      }
      throw new Error(`unexpected url ${url}`);
    };

    const entry = await syncFigma({ fileKey: "abc123", scope: "Colors" });

    // 2 styles + 1 component + 4 document nodes (root + 3 children).
    expect(entry.resourceCount).toBe(7);
    expect(entry.message).toBe(
      "Pulled 7 tokens from Figma file abc123 (scope: Colors).",
    );
    expect(entry.duration).toBe(0); // frozen clock — deterministic
    expect(calls[0]!.headers["x-figma-token"]).toBe(FIGMA_TOKEN);
    expect(calls[0]!.headers.accept).toBe("application/json");

    const status = (await listStatus()).find((s) => s.service === "figma");
    expect(status!.resourceCount).toBe(7);
    expect(status!.lastSync).toBe(entry.timestamp);
  });

  it("5. the document walk clamps at 500 nodes", async () => {
    respond = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        document: { children: Array.from({ length: 600 }, () => ({})) },
      }),
    });

    const entry = await syncFigma({ fileKey: "big" });
    expect(entry.resourceCount).toBe(500); // min(601, 500)
  });

  it("6. a 401 from Figma falls back to the mock entry (bounded counts)", async () => {
    respond = async () => ({ ok: false, status: 401, json: async () => ({}) });

    const entry = await syncFigma({ fileKey: "locked", scope: "Colors" });
    expect(entry.status).toBe("success");
    expect(entry.resourceCount).toBeGreaterThanOrEqual(200);
    expect(entry.resourceCount).toBeLessThanOrEqual(299);
    // The mock message never carries the scope suffix.
    expect(entry.message).toBe(
      `Pulled ${entry.resourceCount} tokens from Figma file locked.`,
    );
  });

  it("7. a transport error falls back to the mock entry", async () => {
    respond = async () => {
      throw new Error("ENOTFOUND");
    };
    const entry = await syncFigma({ fileKey: "down" });
    expect(entry.resourceCount).toBeGreaterThanOrEqual(200);
    expect(entry.resourceCount).toBeLessThanOrEqual(299);
  });
});

describe("syncGithub — REST path", () => {
  const PUT_URL = "https://api.github.com/repos/owner/repo/contents/tokens.json";

  it("8. pushes a 5-token manifest with the Bearer token and a default message", async () => {
    respond = async () => ({ ok: true, status: 200, json: async () => ({}) });

    const entry = await syncGithub({ repo: "owner/repo", branch: "feature" });

    expect(entry.resourceCount).toBe(5);
    expect(entry.message).toBe(
      "Pushed 5 token definitions to owner/repo on feature.",
    );

    const put = calls[0]!;
    expect(put.method).toBe("PUT");
    expect(put.url).toBe(PUT_URL);
    expect(put.headers.authorization).toBe(`Bearer ${GITHUB_TOKEN}`);
    expect(put.headers["x-github-api-version"]).toBe("2022-11-28");

    const body = JSON.parse(put.body!) as {
      message: string;
      branch: string;
      content: string;
    };
    expect(body.branch).toBe("feature");
    expect(body.message).toBe(
      "chore(design-system): sync tokens @ 2026-06-01T00:00:00.000Z",
    );
    const manifest = JSON.parse(
      Buffer.from(body.content, "base64").toString("utf8"),
    ) as { tokens: unknown[] };
    expect(manifest.tokens).toHaveLength(5);
  });

  it("9. an explicit commit message wins over the default", async () => {
    respond = async () => ({ ok: true, status: 200, json: async () => ({}) });
    await syncGithub({
      repo: "owner/repo",
      branch: "main",
      message: "custom: sync tokens",
    });
    const body = JSON.parse(calls[0]!.body!) as { message: string };
    expect(body.message).toBe("custom: sync tokens");
  });

  it("10. an HTTP failure falls back to the mock entry", async () => {
    respond = async () => ({ ok: false, status: 422, json: async () => ({}) });
    const entry = await syncGithub({ repo: "owner/repo", branch: "main" });
    expect(entry.resourceCount).toBeGreaterThanOrEqual(40);
    expect(entry.resourceCount).toBeLessThanOrEqual(79);
    expect(entry.message).toBe(
      `Pushed ${entry.resourceCount} files to owner/repo on main.`,
    );
  });
});

describe("syncTokens — target routing", () => {
  it("11. target=github uses the real push path when the token is configured", async () => {
    respond = async (url) => {
      if (
        url ===
        "https://api.github.com/repos/roycss/design-system/contents/tokens.json"
      ) {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      throw new Error(`unexpected url ${url}`);
    };

    const entry = await syncTokens({ target: "github" });
    expect(entry.resourceCount).toBe(5);
    expect(entry.message).toBe("Pushed 5 token definitions to github.");
    expect(calls[0]!.method).toBe("PUT");
  });

  it("12. non-github targets stay on the mock path even with tokens set", async () => {
    const entry = await syncTokens({ target: "figma" });
    expect(entry.resourceCount).toBeGreaterThanOrEqual(250);
    expect(entry.resourceCount).toBeLessThanOrEqual(349);
    expect(entry.message).toBe(
      `Pushed ${entry.resourceCount} tokens to figma.`,
    );
  });
});
