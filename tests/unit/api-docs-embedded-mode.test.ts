import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * API.md embedded-mode + timeout documentation pins (issue #245).
 *
 * The route TABLES in API.md are generated (`backend-node/scripts/
 * gen-api-md.ts`) and drift-checked by `cd backend-node && bun run api:check`
 * — but that gate only validates method+path rows, never semantics. These
 * assertions pin the semantic contracts that 7-d black-box QA found missing
 * (apiMode omitted; /api/v1/* documented as pure passthrough while the live
 * default is the embedded catalog): an api:check-style guard, but for prose.
 */

const API_MD = readFileSync(resolve(__dirname, "../../API.md"), "utf8");
/** Whitespace-normalized copy — prose assertions must survive markdown line wraps. */
const DOC = API_MD.replace(/\s+/g, " ");

describe("API.md — embedded mode section (#245)", () => {
  it("has a dedicated Embedded mode section, linked from the contents", () => {
    expect(API_MD).toContain("## Embedded mode");
    expect(API_MD).toContain("(#embedded-mode)");
  });

  it("documents the /api/health apiMode field and honest status semantics", () => {
    // The health ROW carries apiMode (was omitted pre-#245).
    expect(API_MD).toMatch(/\| GET \| `\/api\/health` \|.*apiMode/);
    // degraded ONLY for a configured-and-failed probe; standalone is "ok".
    expect(DOC).toMatch(/ONLY when a configured backend probe fails/);
    expect(DOC).toMatch(/flips to `"degraded"` ONLY when a CONFIGURED backend was probed and failed to answer/);
    expect(DOC).toContain("`status` is `\"ok\"` for a standalone");
    // The exact backendStatus error string observed live in embedded mode.
    expect(DOC).toContain("BACKEND_URL not configured — serving embedded API");
  });

  it("documents 503 EMBEDDED_MODE_UNSUPPORTED for writes/auth/unknown modules", () => {
    expect(API_MD).toContain("EMBEDDED_MODE_UNSUPPORTED");
    expect(DOC).toMatch(/Writes, auth and unknown modules → 503\*\*/);
    expect(DOC).toContain("DELIBERATE 503-not-404");
    // …and why: the backend 404 "Route not found" distinction.
    expect(DOC).toMatch(/404s with `Route not found` only for genuinely unknown paths/);
  });

  it("describes the mode-aware gateway (embedded reads without BACKEND_URL, proxy passthrough with it)", () => {
    expect(API_MD).toMatch(/`\/api\/v1\/\*` \| mode-aware \|/);
    expect(DOC).toContain("embedded API");
    expect(DOC).toContain("API_MODE=proxy");
  });
});

describe("API.md — contact write guard + limiter (#159 contracts, #245 docs)", () => {
  it("documents the 5/min/IP tier with 429 + Retry-After headers", () => {
    expect(API_MD).toMatch(/\| POST \| `\/api\/contact` \|.*429 \(5\/min\/IP\)/);
    expect(API_MD).toContain("5/min/IP");
    expect(API_MD).toContain("`Retry-After: 60`");
    expect(API_MD).toContain("`X-RateLimit-Remaining: 0`");
    expect(API_MD).toContain("`X-RateLimit-Reset`");
  });

  it("documents the origin-first guard order and fail-closed 403 (no-Origin)", () => {
    expect(DOC).toMatch(/BEFORE the rate limiter/);
    expect(DOC).toMatch(/missing `Origin` header on a write fails CLOSED with 403/);
  });

  it("documents that rejected (400/503) requests consume quota — deliberate", () => {
    expect(DOC).toMatch(/including rejected ones \(400 validation, 503 DB\)/);
    expect(DOC).toMatch(/429s are NOT recorded/);
  });
});

describe("API.md — auth proxy server-side timeout (#245)", () => {
  it("lists 503 (backend timeout) on the proxied auth routes", () => {
    const matches = API_MD.match(/503 \(backend timeout\)/g) ?? [];
    // login, register, refresh, me, forgot/reset/verify-email (+confirm).
    expect(matches.length).toBeGreaterThanOrEqual(7);
  });

  it("names the 15 s server-side deadline and its module", () => {
    expect(API_MD).toContain("src/lib/backend-fetch.ts");
    expect(API_MD).toMatch(/15 s server-side deadline/);
  });
});
