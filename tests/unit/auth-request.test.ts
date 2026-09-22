/**
 * Auth request helper (issue #163) — bounded auth fetches.
 *
 * Covers the outcomes of `authRequest` with a mocked fetcher (same
 * pattern as contact-form.test.ts):
 *   1. success (2xx) — Response returned untouched, signal aborted=false;
 *   2. HTTP error passthrough — Response still returned so callers keep
 *      their backend-message handling (no unreachable remap);
 *   3. timeout — the controller fires at AUTH_REQUEST_TIMEOUT_MS and the
 *      rejection maps to AUTH_UNREACHABLE_MESSAGE (never a raw AbortError);
 *   4. network failure — fetch rejecting maps to the same safe message.
 */
import { describe, it, expect, vi, type Mock } from "vitest";

import {
  authRequest,
  AUTH_REQUEST_TIMEOUT_MS,
  AUTH_UNREACHABLE_MESSAGE,
  type FetchLike,
} from "@/lib/auth-request";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

type FetchMock = Mock<
  (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Response | Promise<Response>
>;

function fetcherResponding(
  responder: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Response | Promise<Response>,
): FetchMock {
  return vi.fn(responder);
}

describe("authRequest", () => {
  it("returns the response untouched on success and passes method/body through", async () => {
    const fetcher = fetcherResponding(() =>
      jsonResponse({ data: { id: "u1", email: "a@b.co", createdAt: "now" } }),
    );
    const res = await authRequest(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email: "a@b.co" }) },
      fetcher as unknown as FetchLike,
    );
    expect(res.ok).toBe(true);
    expect((await res.json() as { data: { id: string } }).data.id).toBe("u1");
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [, init] = fetcher.mock.calls[0] as [RequestInfo, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect((init.signal as AbortSignal).aborted).toBe(false);
  });

  it("passes HTTP error responses through (backend message handled by caller)", async () => {
    const fetcher = fetcherResponding(() =>
      jsonResponse({ error: "Invalid credentials" }, 401),
    );
    const res = await authRequest("/api/auth/login", {}, fetcher);
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("Invalid credentials");
  });

  it("aborts and maps the timeout to the unreachable message", async () => {
    vi.useFakeTimers();
    // Simulated hanging transport: resolves only if never aborted.
    const fetcher: FetchLike = (_input, init) =>
      new Promise<Response>((resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("The operation was aborted.", "AbortError")),
        );
      });
    const pending = authRequest("/api/auth/login", {}, fetcher);
    const assertion = expect(pending).rejects.toThrow(AUTH_UNREACHABLE_MESSAGE);
    await vi.advanceTimersByTimeAsync(AUTH_REQUEST_TIMEOUT_MS);
    await assertion;
    vi.useRealTimers();
  });

  it("maps a network failure to the unreachable message", async () => {
    const fetcher = fetcherResponding(() =>
      Promise.reject(new TypeError("Failed to fetch")),
    );
    await expect(authRequest("/api/auth/login", {}, fetcher)).rejects.toThrow(
      AUTH_UNREACHABLE_MESSAGE,
    );
  });

  it("clears the deadline timer once the response lands", async () => {
    const clearSpy = vi.spyOn(global, "clearTimeout");
    const fetcher = fetcherResponding(() => jsonResponse({ ok: true }));
    await authRequest("/api/auth/me", {}, fetcher);
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
