import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Server-side timeout contract for the /api/auth/* proxy routes (issue #245).
 *
 * Issue #163 bounded the BROWSER's wait (src/lib/auth-request.ts), but the
 * route handlers themselves called plain fetch — a backend that accepts the
 * connection and never answers would hang the route indefinitely (and
 * /api/auth/me had NO catch at all: its rejection escaped as a framework
 * 500). Every proxied fetch now goes through src/lib/backend-fetch.ts
 * (AbortSignal.timeout(15s) — the same pattern as the api-mode probe), and a
 * TimeoutError maps to a clean 503 `{ error }` in the route's OWN envelope.
 *
 * Network-refused failures (ECONNREFUSED → Error("fetch failed")) keep the
 * pre-#245 behavior (fast 500) — only the HANG is new behavior.
 */

const cookiesMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => cookiesMock,
}));

const { POST: loginPOST } = await import("@/app/api/auth/login/route");
const { GET: meGET } = await import("@/app/api/auth/me/route");
const {
  BACKEND_FETCH_TIMEOUT_MS,
  BACKEND_TIMEOUT_MESSAGE,
} = await import("@/lib/backend-fetch");

const LOGIN_URL = "http://localhost:3000/api/auth/login";
const CREDENTIALS = JSON.stringify({ email: "qa@example.com", password: "hunter2secret" });

/** What fetch does when an AbortSignal.timeout deadline fires mid-request. */
function timeoutRejection(): () => Promise<never> {
  return () => Promise.reject(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
}

function loginRequest(): Request {
  return new Request(LOGIN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: CREDENTIALS,
  });
}

let timeoutSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.restoreAllMocks();
  cookiesMock.get.mockReset();
  cookiesMock.set.mockReset();
  cookiesMock.delete.mockReset();
  // Intercept the deadline construction: no real 15 s waits in unit tests —
  // the fetch mock rejects/rejects-on-abort directly.
  timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockImplementation(
    () => new AbortController().signal,
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("never wired — each test stubs fetch")))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/auth/login — server-side backend timeout (#245)", () => {
  it("maps a hung-backend deadline abort to a clean 503 { error } (not 500/hang)", async () => {
    vi.stubGlobal("fetch", vi.fn(timeoutRejection()));

    const res = await loginPOST(loginRequest());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: BACKEND_TIMEOUT_MESSAGE });
    // The deadline is real: backendFetch asked AbortSignal.timeout for the
    // same 15 s ceiling the browser-side #163 wrapper uses.
    expect(timeoutSpy).toHaveBeenCalledWith(BACKEND_FETCH_TIMEOUT_MS);
    expect(BACKEND_FETCH_TIMEOUT_MS).toBe(15_000);
  });

  it("keeps the refused-connection contract (fast 500 'fetch failed') — only the hang is new", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("fetch failed"))));

    const res = await loginPOST(loginRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "fetch failed" });
  });

  it("does not disturb the success path (200 + cookies) once the backend answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              data: { user: { id: "u1", email: "qa@example.com", name: "QA", createdAt: "2026-01-01T00:00:00.000Z" }, accessToken: "a", refreshToken: "r" },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        ),
      ),
    );

    const res = await loginPOST(loginRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ data: { email: "qa@example.com" } });
    expect(cookiesMock.set).toHaveBeenCalledTimes(2); // access + refresh
  });
});

describe("GET /api/auth/me — server-side backend timeout (#245)", () => {
  it("returns a clean 503 { error } instead of an uncaught framework 500", async () => {
    cookiesMock.get.mockImplementation((name: string) =>
      name === "roycss-access" ? { value: "stale-token" } : undefined,
    );
    vi.stubGlobal("fetch", vi.fn(timeoutRejection()));

    const res = await meGET();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: BACKEND_TIMEOUT_MESSAGE });
    expect(timeoutSpy).toHaveBeenCalledWith(BACKEND_FETCH_TIMEOUT_MS);
  });

  it("keeps the signed-out 401 contract (no cookie → early return, no fetch)", async () => {
    cookiesMock.get.mockReturnValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const res = await meGET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Not authenticated" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
