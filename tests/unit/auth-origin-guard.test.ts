import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Origin-check coverage for the #275 hardening pack's NEW surfaces.
 *
 * The fail-closed same-origin guard (guardApiWrite/verifyOrigin,
 * src/lib/api-security.ts) already covered contact/docs-feedback/css-doctor/
 * ai-*. Issue #275 extends it to:
 *   1. every MUTATING /api/auth/* route (login/register/logout/refresh/
 *      forgot-password/reset-password/verify-email — /api/auth/me is GET-only
 *      and stays exempt), behaviorally via the login handler below + source
 *      pins in api-security.test.ts for all seven;
 *   2. the cookie→Bearer promotion seam of the /api/v1 gateway
 *      (src/lib/api-gateway.ts): a state-changing request that relies on the
 *      promoted httpOnly cookie must carry a same-origin Origin. Explicit
 *      Authorization callers (CLI/SDK) and GET/HEAD stay exempt — embedded
 *      mode never promotes cookies at all.
 *
 * Same-origin dev flows (localhost:3000) keep working: Origin === Host.
 */

// ─── login route (behavioral, representative of all auth routes) ───────────

const cookiesMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => cookiesMock,
}));

const backendFetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/backend-fetch", () => ({
  backendFetch: backendFetchMock,
  backendTimeoutResponse: () =>
    Response.json({ error: "Backend service is not running." }, { status: 503 }),
  isBackendTimeoutError: (err: unknown) =>
    err instanceof Error && err.name === "TimeoutError",
}));

const { POST: loginPOST } = await import("@/app/api/auth/login/route");

const LOGIN_URL = "http://localhost:3000/api/auth/login";
const BODY = JSON.stringify({ email: "qa@example.com", password: "hunter2secret" });

function loginRequest(headers: Record<string, string>): Request {
  return new Request(LOGIN_URL, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: BODY });
}

function backendLoginResponse(): Response {
  return new Response(
    JSON.stringify({ data: { user: { id: "u1" }, accessToken: "a.jwt.token", refreshToken: "r.jwt.token" } }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

beforeEach(() => {
  cookiesMock.get.mockReset();
  cookiesMock.set.mockReset();
  cookiesMock.delete.mockReset();
  backendFetchMock.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/auth/login — guardApiWrite origin gate (#275)", () => {
  it("same-origin POST passes the guard and reaches the backend", async () => {
    backendFetchMock.mockResolvedValue(backendLoginResponse());

    const res = await loginPOST(
      loginRequest({ host: "localhost:3000", origin: "http://localhost:3000" }),
    );

    expect(res.status).toBe(200);
    // The route unwraps the backend envelope: { data: user }.
    expect((await res.json() as { data: { id: string } }).data.id).toBe("u1");
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
  });

  it("cross-origin POST → fail-closed 403, generic body, backend NEVER called", async () => {
    const res = await loginPOST(
      loginRequest({ host: "localhost:3000", origin: "https://evil.example" }),
    );

    expect(res.status).toBe(403);
    const body = (await res.json()) as { ok: boolean; error: string; requestId: string };
    expect(body.ok).toBe(false);
    expect(body.requestId).toBeTruthy();
    // Generic — no echo of the rejected origin.
    expect(JSON.stringify(body)).not.toContain("evil.example");
    expect(backendFetchMock).not.toHaveBeenCalled();
  });

  it("missing Origin on POST → fail-closed 403, backend NEVER called", async () => {
    const res = await loginPOST(loginRequest({ host: "localhost:3000" }));

    expect(res.status).toBe(403);
    expect(backendFetchMock).not.toHaveBeenCalled();
  });
});

// ─── gateway cookie→Bearer promotion seam (behavioral) ─────────────────────

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

const GATEWAY_URL = "http://localhost:3000/api/v1/themes";
const SESSION_COOKIE = "roycss-access=access.jwt.value";

function gatewayRequest(init: { method: string; headers?: Record<string, string> }): NextRequest {
  return new NextRequest(GATEWAY_URL, {
    method: init.method,
    headers: init.headers ?? {},
  });
}

function proxiedJson(): Response {
  return new Response(JSON.stringify({ data: [], meta: { page: 1 } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("api-gateway — origin gate on the cookie→Bearer promotion seam (#275)", () => {
  beforeEach(() => {
    apiModeMock.resolveApiMode.mockResolvedValue("proxy");
    apiModeMock.getProxyTargetUrl.mockReturnValue("http://127.0.0.1:4000");
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("same-origin POST with a session cookie promotes and forwards to the backend", async () => {
    backendFetchMock.mockResolvedValue(proxiedJson());

    const res = await handleApiGateway(
      gatewayRequest({
        method: "POST",
        headers: {
          cookie: SESSION_COOKIE,
          origin: "http://localhost:3000",
          host: "localhost:3000",
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
    const [, init] = backendFetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer access.jwt.value");
  });

  it("cross-origin POST relying on the promoted cookie → fail-closed 403, backend NEVER called", async () => {
    const res = await handleApiGateway(
      gatewayRequest({
        method: "POST",
        headers: {
          cookie: SESSION_COOKIE,
          origin: "https://evil.example",
          host: "localhost:3000",
        },
      }),
    );

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: { code: "FORBIDDEN", message: "Request origin is not allowed." },
    });
    expect(backendFetchMock).not.toHaveBeenCalled();
  });

  it("missing Origin on a cookie-promoted POST → fail-closed 403", async () => {
    const res = await handleApiGateway(
      gatewayRequest({ method: "POST", headers: { cookie: SESSION_COOKIE, host: "localhost:3000" } }),
    );

    expect(res.status).toBe(403);
    expect(backendFetchMock).not.toHaveBeenCalled();
  });

  it("explicit Authorization callers (CLI/SDK) stay exempt — cross-origin POST still forwards", async () => {
    backendFetchMock.mockResolvedValue(proxiedJson());

    const res = await handleApiGateway(
      gatewayRequest({
        method: "POST",
        headers: {
          authorization: "Bearer cli.token",
          origin: "https://evil.example",
          host: "localhost:3000",
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
    const [, init] = backendFetchMock.mock.calls[0] as [string, RequestInit];
    // The explicit header is forwarded verbatim — no origin veto on it.
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer cli.token");
  });

  it("GET stays exempt (not state-changing) even with a cookie and a foreign Origin", async () => {
    backendFetchMock.mockResolvedValue(proxiedJson());

    const res = await handleApiGateway(
      gatewayRequest({
        method: "GET",
        headers: {
          cookie: SESSION_COOKIE,
          origin: "https://evil.example",
          host: "localhost:3000",
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
  });

  it("no cookie at all → no promotion → no origin requirement (anonymous proxied POST)", async () => {
    backendFetchMock.mockResolvedValue(proxiedJson());

    const res = await handleApiGateway(
      gatewayRequest({
        method: "POST",
        headers: { host: "localhost:3000" },
      }),
    );

    expect(res.status).toBe(200);
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
    const [, init] = backendFetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});
