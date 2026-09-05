import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  resolveApiMode,
  resolveApiModeInfo,
  resetApiModeState,
  getApiModeSetting,
  getProxyTargetUrl,
  getConfiguredBackendUrl,
  PROBE_TIMEOUT_MS,
  PROBE_CACHE_TTL_MS,
  API_PROBE_HEADER,
} from "@/lib/api-mode";

/**
 * API_MODE resolution + backend reachability probe — issue #83.
 *
 * Global fetch is stubbed so no real network is touched; every scenario
 * pins one row of the routing decision table:
 *
 *   API_MODE    BACKEND_URL          probe result   → mode
 *   ─────────────────────────────────────────────────────────
 *   embedded    (any / unset)        —              → embedded
 *   proxy       (any / unset)        —              → proxy
 *   auto        unset                (no probe)     → embedded
 *   auto        set                  reachable      → proxy
 *   auto        set                  unreachable    → embedded
 */

const fetchMock = vi.fn();

function okBackend(body: Record<string, unknown> = { status: "ok", service: "roycss-backend" }) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => body,
  });
}

function deadBackend() {
  fetchMock.mockRejectedValueOnce(new Error("connect ECONNREFUSED"));
}

const ENV_KEYS = ["API_MODE", "BACKEND_URL"] as const;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  resetApiModeState();
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  for (const key of ENV_KEYS) delete process.env[key];
});

describe("getApiModeSetting", () => {
  it('defaults to "auto" and accepts the three documented values', () => {
    expect(getApiModeSetting()).toBe("auto");
    process.env.API_MODE = "embedded";
    expect(getApiModeSetting()).toBe("embedded");
    process.env.API_MODE = "proxy";
    expect(getApiModeSetting()).toBe("proxy");
    process.env.API_MODE = "AUTO";
    expect(getApiModeSetting()).toBe("auto");
  });

  it("falls back to auto (with a warning) on invalid values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.API_MODE = "sometimes";
    expect(getApiModeSetting()).toBe("auto");
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("backend URL resolution", () => {
  it("treats a blank BACKEND_URL as unset", () => {
    process.env.BACKEND_URL = "   ";
    expect(getConfiguredBackendUrl()).toBeUndefined();
  });

  it("keeps the legacy localhost:4000 default only for explicit proxy mode", () => {
    process.env.API_MODE = "proxy";
    expect(getProxyTargetUrl()).toBe("http://localhost:4000");

    process.env.API_MODE = "auto";
    expect(getProxyTargetUrl()).toBeNull();

    process.env.BACKEND_URL = "http://10.0.0.5:4000/";
    expect(getProxyTargetUrl()).toBe("http://10.0.0.5:4000"); // trailing slash stripped
  });
});

describe("explicit modes never consult the network to choose", () => {
  it("API_MODE=embedded is always embedded", async () => {
    process.env.API_MODE = "embedded";
    process.env.BACKEND_URL = "http://dead.example";
    deadBackend(); // probed for *health reporting*, never for the choice
    const info = await resolveApiModeInfo();
    expect(info.mode).toBe("embedded");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("API_MODE=proxy stays proxy even when the backend is down", async () => {
    process.env.API_MODE = "proxy";
    deadBackend();
    const info = await resolveApiModeInfo();
    expect(info.mode).toBe("proxy");
    expect(info.probe?.reachable).toBe(false);
  });
});

describe("auto mode routing table", () => {
  it("no BACKEND_URL → embedded without probing", async () => {
    expect(await resolveApiMode()).toBe("embedded");
    expect(fetchMock).not.toHaveBeenCalled();

    const info = await resolveApiModeInfo();
    expect(info.backendUrl).toBeNull();
    expect(info.probe).toBeNull();
  });

  it("reachable BACKEND_URL → proxy", async () => {
    process.env.BACKEND_URL = "http://backend.internal";
    okBackend();
    expect(await resolveApiMode()).toBe("proxy");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe("http://backend.internal/api/v1/health");
  });

  it("unreachable BACKEND_URL → embedded", async () => {
    process.env.BACKEND_URL = "https://roycss.onrender.com"; // the dead URL from vercel.json
    deadBackend();
    expect(await resolveApiMode()).toBe("embedded");
  });

  it("treats an embedded RoyCSS instance behind BACKEND_URL as NOT a backend (loop guard)", async () => {
    process.env.BACKEND_URL = "http://this-site.example"; // points back at us
    okBackend({ status: "ok", service: "roycss-embedded-api" });
    const info = await resolveApiModeInfo();
    expect(info.mode).toBe("embedded");
    expect(info.probe?.error).toContain("embedded RoyCSS instance");
  });

  it("treats a non-2xx health answer as unreachable", async () => {
    process.env.BACKEND_URL = "http://backend.internal";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });
    const info = await resolveApiModeInfo();
    expect(info.mode).toBe("embedded");
    expect(info.probe?.error).toBe("HTTP 503");
  });
});

describe("probe behavior", () => {
  it("uses a deterministic ≤2s timeout and sends the sentinel header", async () => {
    expect(PROBE_TIMEOUT_MS).toBeLessThanOrEqual(2000);
    process.env.BACKEND_URL = "http://backend.internal";
    okBackend();
    await resolveApiMode();
    const [, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect((init.headers as Record<string, string>)[API_PROBE_HEADER]).toBe("1");
  });

  it("caches the probe outcome for the TTL (one fetch per minute)", async () => {
    process.env.BACKEND_URL = "http://backend.internal";
    okBackend();
    await resolveApiMode(); // probe #1
    await resolveApiMode(); // cache hit
    await resolveApiMode(); // cache hit
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + PROBE_CACHE_TTL_MS + 1);
    okBackend();
    await resolveApiMode(); // cache expired → probe #2
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent probes into a single fetch", async () => {
    process.env.BACKEND_URL = "http://backend.internal";
    okBackend();
    await Promise.all([resolveApiMode(), resolveApiMode(), resolveApiMode()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resetApiModeState drops the cache (test hook)", async () => {
    process.env.BACKEND_URL = "http://backend.internal";
    okBackend();
    await resolveApiMode();
    resetApiModeState();
    okBackend();
    await resolveApiMode();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
