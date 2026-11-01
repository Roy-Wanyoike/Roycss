/**
 * /api/auth/me single-flight reconcile (issue #299 info item).
 *
 * The AuthProvider mount effect reconciles the cookie session through the
 * module-level `reconcileMe` probe (auth-context.tsx). These specs pin the
 * double-fetch fix:
 *
 *   1. two concurrent reconcile invocations (double mount effect /
 *      StrictMode-style double render) → exactly ONE /api/auth/me request;
 *   2. serial double invocation (provider remount after the first probe
 *      settled — the double-fire observed on home load in #299) → still ONE
 *      request, both invocations resolve the same state;
 *   3. every consumer's state resolves from that single response;
 *   4. 401 signed-out probe semantics unchanged → `null`, never a throw;
 *   5. session mutations (resetMeProbe — what login/register/logout now
 *      call) drop the memo so the next reconcile probes fresh.
 *
 * The vitest unit environment is `node` (no DOM — vitest.config.ts), so the
 * mount effect is exercised by invoking its exact body (`reconcileMe`) the
 * way the effect does. Global fetch is stubbed with vi.stubGlobal following
 * api-mode.test.ts, and resetMeProbe() in beforeEach mirrors the
 * resetApiModeState() usage there to isolate module-level single-flight
 * state per test.
 */
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";

import { reconcileMe, resetMeProbe } from "@/components/roycss/auth/auth-context";
import type { AuthUser } from "@/lib/auth-client";

const SIGNED_IN: AuthUser = {
  id: "u_299",
  email: "ada@example.com",
  name: "Ada Lovelace",
  emailVerified: true,
  createdAt: "2025-01-01T00:00:00.000Z",
};

type FetchMock = Mock<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>;

const fetchMock = vi.fn() as FetchMock;

/** Queue one JSON response for the next /api/auth/me probe. */
function responds(body: unknown, status = 200): void {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

/**
 * AuthProvider's mount effect body (auth-context.tsx): await the
 * single-flight reconcile, then commit the result via setUser(). Returns
 * the value the effect would commit when its cleanup flag has not
 * cancelled it — the probe itself is what must stay single-flight.
 */
async function mountEffectCommit(): Promise<AuthUser | null> {
  return await reconcileMe();
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  resetMeProbe();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reconcileMe single-flight (issue #299)", () => {
  it("issues ONE /api/auth/me request when the mount effect fires twice concurrently", async () => {
    responds({ data: SIGNED_IN });

    const [first, second] = await Promise.all([
      mountEffectCommit(),
      mountEffectCommit(),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(SIGNED_IN);
    expect(second).toEqual(SIGNED_IN);

    const [url, init] = fetchMock.mock.calls[0] as [RequestInfo, RequestInit];
    expect(url).toBe("/api/auth/me");
    expect(init.cache).toBe("no-store");
  });

  it("still fires ONE request for serial double invocation (provider remount after settle)", async () => {
    responds({ data: SIGNED_IN });

    const first = await mountEffectCommit();
    const second = await mountEffectCommit(); // remounted provider replays the memo

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(SIGNED_IN);
    expect(second).toEqual(SIGNED_IN);
  });

  it("resolves every consumer's state from the single response", async () => {
    responds({ data: SIGNED_IN });

    const concurrent = Promise.all([
      mountEffectCommit(),
      mountEffectCommit(),
      mountEffectCommit(),
    ]);
    const late = mountEffectCommit(); // late consumer joins the settled memo

    const [a, b, c, d] = [...(await concurrent), await late];

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual(SIGNED_IN);
    expect(b).toEqual(SIGNED_IN);
    expect(c).toEqual(SIGNED_IN);
    expect(d).toEqual(SIGNED_IN);
  });

  it("keeps 401 signed-out semantics: resolves null without throwing, once", async () => {
    responds({ error: "Unauthorized" }, 401);

    const first = await mountEffectCommit();
    const second = await mountEffectCommit(); // serial remount — no second 401 probe

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toBeNull();
    expect(second).toBeNull();
  });

  it("drops the memo on session mutation so the next reconcile probes fresh", async () => {
    responds({ data: SIGNED_IN });
    await mountEffectCommit();

    resetMeProbe(); // what login / register / logout now call

    const updated: AuthUser = { ...SIGNED_IN, name: "Ada (updated)" };
    responds({ data: updated });
    const second = await mountEffectCommit();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(second).toEqual(updated);
  });
});
