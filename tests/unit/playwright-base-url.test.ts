/**
 * playwright.config.ts PLAYWRIGHT_BASE_URL coherence pin (issue #274).
 *
 * `PLAYWRIGHT_BASE_URL` used to be a trap: `use.baseURL` and the webServer
 * health-check honored the override, but the auto-started server ran
 * `bun run dev` — which hardcodes `-p 3000` (package.json "dev") — so an
 * override to any other port deadlocked the 120 s health-check against a
 * server that was listening elsewhere.
 *
 * The config now derives the auto-start port from BASE_URL itself. These
 * tests import the real config module (env is read at module top level, so
 * each case re-imports with vi.resetModules) and pin:
 *   1. default (no env): :3000 + canonical `bun run dev` — unchanged;
 *   2. PLAYWRIGHT_NO_SERVER=1: no webServer at all, baseURL from env (CI);
 *   3. PLAYWRIGHT_BASE_URL override + auto-start: server command and
 *      health-check `url` agree on the overridden port.
 */
import { describe, it, expect, vi } from "vitest";
import type { Config } from "@playwright/test";

const ENV_KEYS = ["PLAYWRIGHT_BASE_URL", "PLAYWRIGHT_NO_SERVER"] as const;

/**
 * `Config["webServer"]` is a union (`WebServer | WebServer[]`); this repo's
 * config always defines a single object, but the pin must stay type-safe.
 */
function singleWebServer(config: Config) {
  const ws = config.webServer;
  const server = Array.isArray(ws) ? ws[0] : ws;
  if (!server) throw new Error("expected playwright.config to define a webServer");
  return server;
}

/** The resolved `@playwright/test` types type `use` as `Partial<{}>` — read
 * the one key these pins care about through a local, explicitly typed view. */
function baseURL(config: Config): string | undefined {
  const use = (config.use ?? {}) as { baseURL?: string };
  return use.baseURL;
}

async function loadConfig(
  env: Partial<Record<(typeof ENV_KEYS)[number], string>>,
): Promise<Config> {
  vi.resetModules();
  const saved: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  try {
    return (await import("../../playwright.config")).default;
  } finally {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

describe("playwright.config PLAYWRIGHT_BASE_URL coherence (issue #274)", () => {
  it("default env: baseURL :3000, canonical `bun run dev`, health-check :3000", async () => {
    const config = await loadConfig({});
    expect(baseURL(config)).toBe("http://localhost:3000");
    const webServer = singleWebServer(config);
    expect(webServer.command).toBe("bun run dev");
    expect(webServer.url).toBe("http://localhost:3000");
  });

  it("PLAYWRIGHT_NO_SERVER=1: baseURL from env, no auto-started webServer", async () => {
    const config = await loadConfig({
      PLAYWRIGHT_NO_SERVER: "1",
      PLAYWRIGHT_BASE_URL: "http://localhost:4173",
    });
    expect(config.webServer).toBeUndefined();
    expect(baseURL(config)).toBe("http://localhost:4173");
  });

  it("PLAYWRIGHT_BASE_URL override + auto-start: server port matches health-check URL", async () => {
    const config = await loadConfig({
      PLAYWRIGHT_BASE_URL: "http://localhost:4173",
    });
    const webServer = singleWebServer(config);
    expect(baseURL(config)).toBe("http://localhost:4173");
    // The health-check polls the overridden URL…
    expect(webServer.url).toBe("http://localhost:4173");
    // …and the server it waits for actually listens on that port.
    expect(webServer.command).toContain("-p 4173");
  });
});
