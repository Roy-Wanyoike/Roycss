/**
 * Integration tests — GET /api/v1/inspector/{checks,analyze,health}
 *
 * 5 tests covering the read-only inspector surface:
 *   1. checks        — GET /inspector/checks → 200 + 8-check catalog envelope
 *   2. analyze dirty  — snippet with deliberate violations → findings for every rule
 *   3. analyze clean  — guarded, focus-paired snippet → zero findings
 *   4. analyze bad    — missing/empty ?css → 400 VALIDATION_ERROR envelope
 *   5. health        — GET /inspector/health → 200 module status
 *
 * Test isolation strategy:
 *   - The inspector has NO DB dependency, but the app under test wires
 *     all 68 routers (including the Prisma-backed ones), so the global
 *     setup file (`setup.ts`) still needs to run its `prisma db push`.
 *   - Each test sends a unique `X-Forwarded-For` IP so the in-memory
 *     rate limiter (100 req/min/IP, default) never trips — `createApp()`
 *     sets `trust proxy`, and with `isolate: false` the limiter's
 *     module-level buckets are shared across test files in this worker.
 */
import { describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../../src/server/app.js";

const app = createApp();

/** Unique IP per test so the in-memory rate limiter never trips. */
function uniqueIp(): string {
  // 198.51.100.0/24 is reserved for documentation/testing (RFC 5737).
  const rand = Math.floor(Math.random() * 250) + 1;
  return `198.51.100.${rand}`;
}

const VALID_SEVERITIES = ["error", "warning", "info"] as const;

/** A snippet that trips every inspector check on purpose. */
const DIRTY_CSS = [
  // no-reduced-motion-guard: @keyframes + animation, no guard anywhere.
  "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }",
  ".spinner { animation: spin 1s linear infinite; }",
  // universal-selector + stale-vendor-prefix:
  ".hero * { -webkit-box-shadow: 0 0 10px red; box-shadow: 0 0 10px red; }",
  // hover-without-focus-visible + important-overuse (3 uses):
  ".btn:hover { color: red !important; border-color: red !important; padding: 4px !important; }",
  // unknown-roycss-class + unused-custom-property:
  ".roycss-fade-in { --unused-token: 12px; }",
  // excessive-nesting-depth (4 style-rule levels):
  ".card { & .title { & span { & b { font-weight: bold; } } } }",
].join("\n");

/** A snippet that satisfies every check — must produce zero findings. */
const CLEAN_CSS = [
  "@media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }",
  "@keyframes spin { to { transform: rotate(360deg); } }",
  ".btn:hover, .btn:focus-visible { background: oklch(0.7 0.1 250); }",
  ":root { --brand: oklch(0.75 0.12 250); } .btn { color: var(--brand); }",
  ".field > label { display: block; }",
].join("\n");

describe("GET /api/v1/inspector", () => {
  it("1. checks — returns 200 with the 8-check catalog envelope", async () => {
    const res = await request(app)
      .get("/api/v1/inspector/checks")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    // Standard JSON envelope: { data: [...], meta: { count } }
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toEqual({ count: res.body.data.length });
    expect(res.body.data.length).toBe(8);

    for (const check of res.body.data) {
      expect(typeof check.id).toBe("string");
      expect(check.id.length).toBeGreaterThan(0);
      expect(typeof check.title).toBe("string");
      expect(typeof check.category).toBe("string");
      expect(typeof check.description).toBe("string");
    }

    const ids = res.body.data.map((c: { id: string }) => c.id);
    expect(ids).toContain("no-reduced-motion-guard");
    expect(ids).toContain("hover-without-focus-visible");
    expect(ids).toContain("excessive-nesting-depth");
  });

  it("2. analyze — dirty snippet returns findings for every rule", async () => {
    const res = await request(app)
      .get("/api/v1/inspector/analyze")
      .query({ css: DIRTY_CSS })
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data.findings)).toBe(true);

    const findings = res.body.data.findings as Array<{
      rule: string;
      severity: string;
      message: string;
      line?: number;
    }>;

    // Every deliberate violation must be caught.
    const rules = new Set(findings.map((f) => f.rule));
    expect(rules).toContain("no-reduced-motion-guard");
    expect(rules).toContain("hover-without-focus-visible");
    expect(rules).toContain("important-overuse");
    expect(rules).toContain("stale-vendor-prefix");
    expect(rules).toContain("universal-selector");
    expect(rules).toContain("unknown-roycss-class");
    expect(rules).toContain("unused-custom-property");
    expect(rules).toContain("excessive-nesting-depth");

    // Finding shape contract: severity/message/rule always, line 1-based int.
    for (const finding of findings) {
      expect(VALID_SEVERITIES).toContain(finding.severity);
      expect(typeof finding.message).toBe("string");
      expect(finding.message.length).toBeGreaterThan(0);
      if (finding.line !== undefined) {
        expect(Number.isInteger(finding.line)).toBe(true);
        expect(finding.line).toBeGreaterThan(0);
        expect(finding.line).toBeLessThanOrEqual(DIRTY_CSS.split("\n").length);
      }
    }

    // Summary counters must add up and match the findings array.
    const summary = res.body.data.summary;
    expect(summary.checksExecuted).toBe(8);
    expect(summary.findings).toBe(findings.length);
    expect(summary.errors + summary.warnings + summary.infos).toBe(
      findings.length,
    );
    expect(summary.lines).toBe(DIRTY_CSS.split("\n").length);
    // meta.count mirrors the findings length.
    expect(res.body.meta).toEqual({ count: findings.length });
  });

  it("3. analyze — clean snippet returns zero findings", async () => {
    const res = await request(app)
      .get("/api/v1/inspector/analyze")
      .query({ css: CLEAN_CSS })
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(res.body.data.findings).toEqual([]);
    expect(res.body.data.summary.findings).toBe(0);
    expect(res.body.data.summary.checksExecuted).toBe(8);
    expect(res.body.meta).toEqual({ count: 0 });
  });

  it("4. analyze — missing or empty ?css returns 400 VALIDATION_ERROR", async () => {
    // 4a. No query string at all.
    const missing = await request(app)
      .get("/api/v1/inspector/analyze")
      .set("X-Forwarded-For", uniqueIp());

    expect(missing.status).toBe(400);
    expect(missing.body).toHaveProperty("error");
    expect(missing.body.error.code).toBe("VALIDATION_ERROR");
    const details = missing.body.error.details as Array<{ path: string }>;
    expect(Array.isArray(details)).toBe(true);
    expect(details.some((d) => d.path.includes("css"))).toBe(true);

    // 4b. Present but empty string.
    const empty = await request(app)
      .get("/api/v1/inspector/analyze")
      .query({ css: "" })
      .set("X-Forwarded-For", uniqueIp());

    expect(empty.status).toBe(400);
    expect(empty.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("5. health — returns 200 module status with check count", async () => {
    const res = await request(app)
      .get("/api/v1/inspector/health")
      .set("X-Forwarded-For", uniqueIp());

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.module).toBe("inspector");
    expect(res.body.data.checks).toBe(8);
    expect(typeof res.body.data.time).toBe("string");
  });
});
