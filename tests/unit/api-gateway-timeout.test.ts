import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Bounded proxy contract for the /api/v1/* gateway (issue #245).
 *
 * In proxy mode the gateway forwards to the Express backend. A REFUSED
 * connection already degraded to the documented
 * 503 `{ error: { code: "BACKEND_UNAVAILABLE" } }` envelope (the pre-existing
 * catch); a HUNG backend (accepts TCP, never answers) used to hang the route
 * forever. Every proxied fetch now goes through src/lib/backend-fetch.ts's
 * 15 s deadline, and the timeout lands in that SAME catch envelope.
 */

const apiModeMock = vi.hoisted(() => ({
  resolveApiMode: vi.fn(),
  getProxyTargetUrl: vi.fn(),
}));

vi.mock("@/lib/api-mode", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-mode")>()),
  resolveApiMode: apiModeMock.resolveApiMode,
  getProxyTargetUrl: apiModeMock.getProxyTargetUrl,
}));

const { handleApiGateway } = await import("@/lib/api-gateway");
const { BACKEND_FETCH_TIMEOUT_MS } = await import("@/lib/backend-fetch");

const GATEWAY_URL = "http://localhost:3000/api/v1/effects";

function gatewayRequest(): NextRequest {
  return new NextRequest(GATEWAY_URL, { method: "GET" });
}

function gatewayJson(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

let timeoutSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.restoreAllMocks();
  apiModeMock.resolveApiMode.mockResolvedValue("proxy");
  apiModeMock.getProxyTargetUrl.mockReturnValue("http://127.0.0.1:4000");
  timeoutSpy = vi.spyOn(AbortSignal, "timeout").mockImplementation(
    () => new AbortController().signal,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api-gateway proxy mode — hung-backend deadline (#245)", () => {
  it("maps a TimeoutError from the bounded fetch to the documented 503 BACKEND_UNAVAILABLE envelope", async () => {
    const fetchMock = vi.fn(() =>
      Promise.reject(new DOMException("The operation was aborted due to timeout", "TimeoutError")),
    );
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const res = await handleApiGateway(gatewayRequest());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: { code: "BACKEND_UNAVAILABLE", message: "Backend service is not running." },
    });
    // The proxied fetch actually carries the 15 s deadline.
    expect(timeoutSpy).toHaveBeenCalledWith(BACKEND_FETCH_TIMEOUT_MS);
  });

  it("attaches an AbortSignal to the proxied fetch (bounded call, not plain fetch)", async () => {
    let seenSignal: unknown = null;
    const fetchMock = vi.fn((_url: string | URL, init?: RequestInit) => {
      seenSignal = init?.signal;
      return Promise.resolve(gatewayJson(200, { data: [], meta: { page: 1, limit: 24, total: 0, totalPages: 0 } }));
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const res = await handleApiGateway(gatewayRequest());

    expect(res.status).toBe(200);
    expect(seenSignal).toBeInstanceOf(AbortSignal);
  });

  it("keeps the response passthrough contract once the backend answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: [{ id: "pulse-glow" }] }), {
            status: 200,
            headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
          }),
        ),
      ) as unknown as typeof fetch,
    );

    const res = await handleApiGateway(gatewayRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [{ id: "pulse-glow" }] });
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
  });
});
