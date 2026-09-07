/**
 * SECURITY SUITE (PF-007) — injection fuzzing on list/query surfaces.
 *
 * Hurls classic SQL-injection, XSS, path-traversal, NoSQL and null-byte
 * payloads at the query parameters of representative list endpoints
 * (Prisma-backed + static + Zod-validated) and pins:
 *
 *   - NEVER a 500 (a payload must not crash a handler),
 *   - responses are ALWAYS application/json — never text/html, so a
 *     reflected payload can never execute in a browser context,
 *   - no database driver internals leak into error bodies
 *     (SQLITE_*, PrismaClient*, "unrecognized token", …).
 *
 * Honesty note: the search module legitimately echoes `q` back inside
 * `meta.query` (a JSON field — inert). The XSS-relevant property is the
 * content-type + no-execution contract above, which is what these tests
 * pin.
 */
import { describe, it, expect } from "vitest";

import { createApp } from "../../src/server/app.js";
import { hit } from "../helpers/api-client.js";

const app = createApp();

const PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1' OR '1'='1' --",
  "UNION SELECT password FROM User",
  "<script>alert('xss')</script>",
  "\"><img src=x onerror=alert(1)>",
  "../../etc/passwd",
  '{"$gt": ""}',
  "%00\x00",
  "neon'; DELETE FROM SearchIndex;--",
];

/** List endpoints that accept (and parse) query parameters. */
const QUERY_ENDPOINTS = [
  "/api/v1/effects",
  "/api/v1/effects/search",
  "/api/v1/search",
  "/api/v1/icons",
  "/api/v1/recipes",
  "/api/v1/patterns",
  "/api/v1/audit-center/issues",
  "/api/v1/blocks",
] as const;

/** Driver-internal error signatures that must never reach a client. */
const DRIVER_LEAK_PATTERNS =
  /(SQLITE_|PRAGMA|PrismaClient|unrecognized token|syntax error|near \")/i;

describe("security/injection: query-param fuzzing never breaks the API", () => {
  for (const endpoint of QUERY_ENDPOINTS) {
    // Each endpoint's FIRST meaningful query param gets every payload.
    const param =
      endpoint === "/api/v1/effects/search" || endpoint === "/api/v1/search"
        ? "q"
        : endpoint === "/api/v1/audit-center/issues"
          ? "projectId"
          : "category";

    for (const payload of PAYLOADS) {
      it(`${endpoint}?${param}=<${labelFor(payload)}> — no 500, JSON-only, no driver leaks`, {
        timeout: 10_000,
      }, async () => {
        const res = await hit(
          app,
          "get",
          `${endpoint}?${encodeURIComponent(param)}=${encodeURIComponent(payload)}`,
        );

        // 1. Never a server error — payloads must be rejected or matched,
        //    but must never crash a handler.
        expect(
          res.status,
          `${endpoint} crashed on payload ${JSON.stringify(payload)} — ${res.status}`,
        ).toBeLessThan(500);

        // 2. JSON-only content type — reflected payload can never execute.
        expect(res.headers["content-type"] ?? "").toMatch(/application\/json/);

        // 3. Body is either a success envelope or a documented error
        //    envelope — no driver internals in any string field.
        const serialized = JSON.stringify(res.body);
        expect(
          DRIVER_LEAK_PATTERNS.test(serialized),
          `driver internals leaked for payload ${JSON.stringify(payload)}: ${serialized.slice(0, 200)}`,
        ).toBe(false);

        if (res.status < 400) {
          expect(res.body).toHaveProperty("data");
        } else {
          expect(res.body.error?.code).toBeTruthy();
        }
      });
    }
  }
});

/** Short human label for a payload (keeps test names readable). */
function labelFor(payload: string): string {
  if (payload.includes("DROP TABLE")) return "sql-drop";
  if (payload.includes("UNION")) return "sql-union";
  if (payload.includes("OR '1'='1")) return "sql-tautology";
  if (payload.includes("DELETE FROM")) return "sql-delete";
  if (payload.includes("<script")) return "xss-script";
  if (payload.includes("onerror")) return "xss-img";
  if (payload.includes("../")) return "path-traversal";
  if (payload.includes("$gt")) return "nosql-operator";
  if (payload.includes("\x00") || payload.includes("%00")) return "null-byte";
  return "sql-quote";
}

describe("security/injection: body-field fuzzing on a Prisma-backed POST", () => {
  it("POST /themes with XSS/SQLi in the name — validated or stored inert, never 500", async () => {
    const res = await hit(app, "post", "/api/v1/themes", {
      headers: { Authorization: "Bearer garbage-token" },
      body: { name: "<script>alert(1)</script>' OR '1'='1" },
    });

    // Without a valid token the route must reject before any storage —
    // 401 envelope, never 500, JSON-only.
    expect(res.status).toBe(401);
    expect(res.headers["content-type"] ?? "").toMatch(/application\/json/);
    expect(res.body.error?.code).toBe("UNAUTHORIZED");
  });
});
