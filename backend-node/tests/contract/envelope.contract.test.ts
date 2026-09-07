/**
 * CONTRACT SUITE (PF-007) — registry-driven envelope walker for GET routes.
 *
 * The harness enumerates the LIVE Express router (tests/helpers/
 * route-walker.ts — app._router stack introspection) and fires one request
 * at every registered GET route under /api/v1, so a new module is covered
 * the moment it is mounted: fail-on-missing, not opt-in.
 *
 * Pins per route class:
 *   GET list/collection (no :param tail):
 *     200 → { data: array, meta: object }           (API.md §envelope/§pagination)
 *     200 → { data: object }                        (stat/singleton reads)
 *     4xx → documented error envelope
 *     never 5xx; always JSON + X-Request-Id.
 *   GET single (:param tail): see single-resource.contract.test.ts.
 *
 * Two documented non-envelope routes are pinned by their own shape
 * (API.md labels both as informational/health probes):
 *   GET /api/v1        → { name, version, endpoints }  (static catalog)
 *   GET /api/v1/health → { status, service, … }        (liveness probe)
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "../../src/server/app.js";
import { listRoutes, isListRoute } from "../helpers/route-walker.js";
import { hit, expectSuccessEnvelope, expectErrorEnvelope } from "../helpers/api-client.js";

const app = createApp();
const routes = listRoutes(app);

/** Documented non-envelope routes (API.md: "static route catalog" + health probes + the OpenAPI document). */
const NON_ENVELOPE_EXCEPTIONS = new Set([
  "/api/v1",
  "/api/v1/health", // infra probe (base health) — own documented shape
  "/api/v1/health/live", // infra probe (liveness) — own documented shape
  "/api/v1/health/ready", // infra probe (readiness, PR #97 A9) — own documented shape
  "/api/v1/openapi.json", // OpenAPI 3.x document (PR #97 A4) — spec shape, not a resource envelope
]);

const listRoutesUnderTest = routes.filter(
  (r) => r.method === "get" && isListRoute(r),
);

// ─── The sweep ───────────────────────────────────────────────────────────

describe("contract: GET list/collection envelope (registry-driven)", () => {
  for (const route of listRoutesUnderTest) {
    const title = `GET ${route.path} honors the /api/v1 envelope contract`;
    it(title, { timeout: 15_000 }, async () => {
      const res = await hit(app, "get", route.path);

      if (NON_ENVELOPE_EXCEPTIONS.has(route.path)) {
        // Documented exceptions — pin their own documented shape.
        expect(res.status).toBe(200);
        expect(typeof res.headers["x-request-id"]).toBe("string");
        if (route.path === "/api/v1") {
          expect(res.body).toHaveProperty("name", "roycss-backend");
          expect(Array.isArray(res.body.endpoints)).toBe(true);
        } else if (route.path === "/api/v1/health/ready") {
          // Readiness probe (PR #97 A9): { status, checks: { db, registry, search } }
          expect(res.body).toHaveProperty("status");
          expect(res.body).toHaveProperty("checks");
          expect(typeof res.body.checks).toBe("object");
        } else if (route.path === "/api/v1/openapi.json") {
          // OpenAPI document (PR #97 A4): { openapi, info, paths }
          expect(res.status).toBe(200);
          expect(typeof res.body.openapi).toBe("string");
          expect(res.body).toHaveProperty("info");
          expect(typeof res.body.paths).toBe("object");
        } else {
          // Liveness + base health: { status, service }
          expect(res.body).toHaveProperty("status");
          expect(res.body).toHaveProperty("service");
        }
        return;
      }

      if (res.status >= 200 && res.status < 300) {
        expectSuccessEnvelope(res);
      } else {
        // Documented failure (e.g. required query param missing →
        // 400 VALIDATION_ERROR, auth-gated list → 401). Never a 500.
        expect(
          res.status,
          `${route.path} must not 500 — got ${res.status}`,
        ).toBeLessThan(500);
        expectErrorEnvelope(res);
      }
    });
  }
});

// ─── Fail-on-missing module coverage guard ───────────────────────────────
//
// Walks src/modules/*/routes.ts on disk and asserts every module that
// declares GET routes was actually exercised by the sweep above (and that
// nothing on disk is un-mounted). Because the sweep iterates the live
// router, this catches the two drift cases:
//   1. a module directory with routes.ts that is NOT mounted in app.ts
//      (missing from the live table → fails here),
//   2. a mounted module that silently vanished from the router
//      (missing from the sweep results → fails here).

/** Module dir → mount segment (plugin-hub is mounted as /plugins). */
const MOUNT_ALIASES: Record<string, string> = { "plugin-hub": "plugins" };

/**
 * Router path segment → module dir. The openapi module serves its document
 * at `/api/v1/openapi.json` (OpenAPI convention), so its path segment is
 * `openapi.json` while the module dir is `openapi` (added by PR #97).
 */
const PATH_SEGMENT_ALIASES: Record<string, string> = {
  "openapi.json": "openapi",
};

/** Normalize a router-derived module segment to its module-dir name. */
function normalizeModule(segment: string): string {
  return PATH_SEGMENT_ALIASES[segment] ?? segment;
}

const MODULES_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../src/modules",
);

function moduleDirsDeclaringGetRoutes(): Map<string, boolean> {
  const found = new Map<string, boolean>();
  for (const entry of readdirSync(MODULES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const routesFile = resolve(MODULES_DIR, entry.name, "routes.ts");
    let declaresGet = false;
    try {
      declaresGet = /\.get\s*\(\s*["'`]/.test(readFileSync(routesFile, "utf8"));
    } catch {
      continue; // api-keys/ has no routes.ts (service-only module) — skip.
    }
    const mount = MOUNT_ALIASES[entry.name] ?? entry.name;
    found.set(mount, declaresGet);
  }
  return found;
}

describe("contract: module coverage guard (fail-on-missing)", () => {
  it("every module dir with routes.ts is mounted in the live router", () => {
    const liveModules = new Set(routes.map((r) => normalizeModule(r.module)));
    const onDisk = moduleDirsDeclaringGetRoutes();
    // 71 of 72 (api-keys is service-only) — audit, metrics, openapi added by PR #97.
    expect(onDisk.size, "module dirs with routes.ts").toBe(71);
    for (const [mount] of onDisk) {
      expect(
        liveModules.has(mount),
        `module "${mount}" has routes.ts but is NOT mounted — add it to src/server/app.ts`,
      ).toBe(true);
    }
  });

  it("every module declaring GET routes is covered by the contract sweep", () => {
    // Modules exercised by the list sweep above (GET routes hit in this
    // file) — every module that declares GET routes must appear here.
    const exercised = new Set(
      listRoutesUnderTest.map((r) => normalizeModule(r.module)),
    );
    const declaring = [...moduleDirsDeclaringGetRoutes()]
      .filter(([, declaresGet]) => declaresGet)
      .map(([mount]) => mount);

    expect(declaring.length, "modules declaring GET routes").toBeGreaterThan(60);
    const missing = declaring.filter((m) => !exercised.has(m));
    expect(
      missing,
      `modules with GET routes NOT covered by the contract sweep: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("the live router exposes no module that lacks a routes.ts on disk", () => {
    // Reverse guard: a route mounted from an unknown source would mean the
    // walker sees a module the FS cross-check can't vouch for. "root" is
    // the /api/v1 index endpoint defined inline in src/server/app.ts.
    const onDisk = new Set([...moduleDirsDeclaringGetRoutes().keys(), "root"]);
    const unknown = [...new Set(routes.map((r) => normalizeModule(r.module)))].filter(
      (m) => !onDisk.has(m),
    );
    expect(unknown, "mounted modules without a src/modules/<dir>").toEqual([]);
  });
});
