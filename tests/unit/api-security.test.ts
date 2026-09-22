import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API_RATE_TIERS,
  _resetRateLimitStoreForTest,
  checkRateLimit,
  getClientIP,
  guardApiWrite,
  rateLimitHeaders,
  verifyOrigin,
} from "@/lib/api-security";

/**
 * Unit tests for the #159 API security helpers (src/lib/api-security.ts):
 * sliding-window limiter (threshold / reset / 429), strict origin
 * verification (403 on writes, GET/HEAD exempt), and the guardApiWrite
 * wiring used by every Next.js write route.
 */

// ─── checkRateLimit — sliding window ───────────────────────────────────────

describe("checkRateLimit (sliding window)", () => {
  beforeEach(() => {
    _resetRateLimitStoreForTest();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit, then denies with remaining=0", () => {
    for (let i = 0; i < 3; i++) {
      const verdict = checkRateLimit("t1:1.2.3.4", 3, 60_000);
      expect(verdict.allowed).toBe(true);
      expect(verdict.remaining).toBe(3 - (i + 1));
    }
    const denied = checkRateLimit("t1:1.2.3.4", 3, 60_000);
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.retryAfterSec).toBeGreaterThan(0);
  });

  it("denies the (limit+1)-th request inside the window and recovers after it slides out", () => {
    const key = "t2:1.2.3.4";
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    vi.advanceTimersByTime(1_000);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    vi.advanceTimersByTime(1_000);
    // 3rd request within 2s — both hits still inside the 60s window.
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(false);
    // Past the window: both recorded hits have slid out.
    vi.advanceTimersByTime(59_000);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
  });

  it("does not record denied requests — hammering 429 never extends the lockout", () => {
    const key = "t3:1.2.3.4";
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    vi.advanceTimersByTime(59_000);
    // Denied hits at t=59s must NOT be recorded; if they were, the bucket
    // would stay full until t=119s instead of freeing up at t=60s.
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(false);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(false);
    vi.advanceTimersByTime(2_000);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
  });

  it("keys buckets independently per identifier (per-IP isolation)", () => {
    expect(checkRateLimit("t4:a", 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit("t4:a", 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit("t4:b", 1, 60_000).allowed).toBe(true);
  });

  it("reports resetAt in the future and retryAfterSec as the window ceiling", () => {
    const verdict = checkRateLimit("t5:1.2.3.4", 1, 60_000);
    vi.advanceTimersByTime(1);
    const denied = checkRateLimit("t5:1.2.3.4", 1, 60_000);
    expect(denied.allowed).toBe(false);
    expect(denied.resetAt).toBeGreaterThan(Date.now());
    expect(denied.retryAfterSec).toBe(60);
  });
});

// ─── verifyOrigin — strict same-origin on writes ───────────────────────────

describe("verifyOrigin", () => {
  const req = (init: {
    method?: string;
    origin?: string | null;
    host?: string | null;
    forwardedHost?: string;
  }): Request => {
    const headers = new Headers();
    if (init.origin !== null) headers.set("origin", init.origin ?? "");
    if (init.host !== null) headers.set("host", init.host ?? "");
    if (init.forwardedHost) headers.set("x-forwarded-host", init.forwardedHost);
    return new Request("http://localhost:3000/api/contact", {
      method: init.method ?? "POST",
      headers,
    });
  };

  it("accepts a same-origin POST (http and https schemes)", () => {
    expect(verifyOrigin(req({ origin: "http://localhost:3000", host: "localhost:3000" }))).toBe(true);
    expect(verifyOrigin(req({ origin: "https://roycss.vercel.app", host: "roycss.vercel.app" }))).toBe(true);
  });

  it("is case-insensitive on scheme/host", () => {
    expect(verifyOrigin(req({ origin: "HTTPS://RoyCSS.vercel.app", host: "roycss.vercel.app" }))).toBe(true);
  });

  it("honors x-forwarded-host behind a proxy (Vercel edge)", () => {
    expect(
      verifyOrigin(
        req({
          origin: "https://roycss.vercel.app",
          host: "internal-pod.local",
          forwardedHost: "roycss.vercel.app",
        }),
      ),
    ).toBe(true);
    // …and still rejects a mismatched origin behind that proxy.
    expect(
      verifyOrigin(
        req({
          origin: "https://evil.example",
          host: "internal-pod.local",
          forwardedHost: "roycss.vercel.app",
        }),
      ),
    ).toBe(false);
  });

  it("rejects cross-origin POSTs with 403-policy (fail-closed)", () => {
    expect(verifyOrigin(req({ origin: "https://evil.example", host: "localhost:3000" }))).toBe(false);
  });

  it("rejects POSTs with a missing Origin (fail-closed per #159)", () => {
    expect(verifyOrigin(req({ origin: null, host: "localhost:3000" }))).toBe(false);
  });

  it("rejects the literal string 'null' origin (sandboxed iframe)", () => {
    expect(verifyOrigin(req({ origin: "null", host: "localhost:3000" }))).toBe(false);
  });

  it("rejects when no host can be derived", () => {
    expect(verifyOrigin(req({ origin: "http://localhost:3000", host: null }))).toBe(false);
  });

  it("exempts GET/HEAD (not state-changing) even without an Origin", () => {
    expect(verifyOrigin(req({ method: "GET", origin: null, host: "localhost:3000" }))).toBe(true);
    expect(verifyOrigin(req({ method: "HEAD", origin: null, host: "localhost:3000" }))).toBe(true);
    expect(verifyOrigin(req({ method: "GET", origin: "https://evil.example", host: "localhost:3000" }))).toBe(true);
  });
});

// ─── getClientIP ───────────────────────────────────────────────────────────

describe("getClientIP", () => {
  const reqWith = (headers: Record<string, string>): Request =>
    new Request("http://localhost:3000/api/contact", { method: "POST", headers });

  it("prefers x-vercel-forwarded-for (edge-set, non-spoofable on Vercel)", () => {
    expect(
      getClientIP(
        reqWith({
          "x-vercel-forwarded-for": "203.0.113.7",
          "x-forwarded-for": "9.9.9.9, 10.0.0.1",
        }),
      ),
    ).toBe("203.0.113.7");
  });

  it("takes the leftmost x-forwarded-for entry", () => {
    expect(getClientIP(reqWith({ "x-forwarded-for": "198.51.100.4, 10.0.0.1" }))).toBe("198.51.100.4");
  });

  it("falls back to x-real-ip, then to the shared 'unknown' bucket", () => {
    expect(getClientIP(reqWith({ "x-real-ip": "192.0.2.9" }))).toBe("192.0.2.9");
    expect(getClientIP(reqWith({}))).toBe("unknown");
  });
});

// ─── guardApiWrite — combined origin + rate-limit wiring ───────────────────

describe("guardApiWrite", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _resetRateLimitStoreForTest();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const request = (headers: Record<string, string> = {}, method = "POST"): Request =>
    new Request("http://localhost:3000/api/contact", { method, headers });

  const sameOrigin = { host: "localhost:3000", origin: "http://localhost:3000" };

  it("returns null for a clean same-origin request", () => {
    expect(guardApiWrite(request(sameOrigin), { route: "unit", ...API_RATE_TIERS.contact })).toBeNull();
  });

  it("returns a fail-closed 403 with generic body + requestId on origin mismatch", async () => {
    const res = guardApiWrite(
      request({ host: "localhost:3000", origin: "https://evil.example" }),
      { route: "unit", ...API_RATE_TIERS.contact },
    );
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    expect(res!.headers.get("x-request-id")).toBeTruthy();
    const body = (await res!.json()) as { ok: boolean; error: string; requestId: string };
    expect(body.ok).toBe(false);
    expect(typeof body.error).toBe("string");
    expect(body.requestId).toBeTruthy();
    // Generic — must not echo the rejected origin or any internals.
    expect(JSON.stringify(body)).not.toContain("evil.example");
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("returns a 429 with Retry-After + rate-limit headers once the tier is exhausted", async () => {
    const config = { route: "unit-429", limit: 2, windowMs: 60_000 };
    expect(guardApiWrite(request(sameOrigin), config)).toBeNull();
    expect(guardApiWrite(request(sameOrigin), config)).toBeNull();

    const res = guardApiWrite(request(sameOrigin), config);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(res!.headers.get("retry-after")).toBe("60");
    expect(res!.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(res!.headers.get("x-request-id")).toBeTruthy();
    const body = (await res!.json()) as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
  });

  it("origin-rejected requests never consume rate-limit budget", () => {
    const config = { route: "unit-budget", limit: 1, windowMs: 60_000 };
    // Cross-origin abuse gets 403 (not counted)…
    for (let i = 0; i < 10; i++) {
      expect(guardApiWrite(request({ host: "localhost:3000", origin: "https://evil.example" }), config)?.status).toBe(403);
    }
    // …so the legit same-origin client still has its full budget.
    expect(guardApiWrite(request(sameOrigin), config)).toBeNull();
    expect(guardApiWrite(request(sameOrigin), config)?.status).toBe(429);
  });

  it("namespaces buckets per route", () => {
    const a = { route: "route-a", limit: 1, windowMs: 60_000 };
    const b = { route: "route-b", limit: 1, windowMs: 60_000 };
    expect(guardApiWrite(request(sameOrigin), a)).toBeNull();
    expect(guardApiWrite(request(sameOrigin), a)?.status).toBe(429);
    expect(guardApiWrite(request(sameOrigin), b)).toBeNull();
  });

  it("throttles header-less clients together under the shared 'unknown' bucket (fail-closed)", () => {
    const config = { route: "unit-unknown", limit: 1, windowMs: 60_000 };
    // No IP headers at all → both resolve to the "unknown" bucket.
    expect(guardApiWrite(request(sameOrigin), config)).toBeNull();
    expect(guardApiWrite(request(sameOrigin), config)?.status).toBe(429);
  });

  it("never applies origin policy to GET/HEAD", () => {
    const config = { route: "unit-get", limit: 1, windowMs: 60_000 };
    // GET with no Origin and a cross-origin Origin both pass the guard.
    expect(guardApiWrite(request({ host: "localhost:3000" }, "GET"), config)).toBeNull();
  });
});

// ─── rateLimitHeaders ──────────────────────────────────────────────────────

describe("rateLimitHeaders", () => {
  it("formats remaining + epoch-seconds reset", () => {
    expect(rateLimitHeaders(3, 1_700_000_000_500)).toEqual({
      "X-RateLimit-Remaining": "3",
      "X-RateLimit-Reset": "1700000000",
    });
  });
});
