/**
 * Unit tests — per-route latency metrics (PF-009 / issue #94 A9).
 *
 *   1. Recording + percentile math (p50/p95/p99) on known samples
 *   2. Buckets are keyed by (method, route-pattern) — different routes
 *      don't share samples; unmatched requests bucket separately
 *   3. resetRouteMetricsForTest clears buckets and the route table
 *   4. buildRouteTable + matchRoutePattern over a real (tiny) Express
 *      app: concrete URLs resolve to route PATTERNS in dispatch order
 *      (static segments win over :params)
 */
import { describe, expect, it } from "vitest";
import express, { type Express } from "express";

import {
  buildRouteTable,
  getRouteMetrics,
  matchRoutePattern,
  recordRouteLatency,
  resetRouteMetricsForTest,
  routeMetricsCount,
} from "../../src/lib/route-metrics.js";

describe("route latency metrics (issue #94 A9)", () => {
  it("1. records samples and computes p50/p95/p99/avg/min/max", () => {
    resetRouteMetricsForTest();
    // 1..100 ms — deterministic percentile targets.
    for (let ms = 1; ms <= 100; ms++) {
      recordRouteLatency("GET", "/api/v1/effects", 200, ms);
    }
    const entry = getRouteMetrics().find(
      (e) => e.route === "/api/v1/effects" && e.method === "GET",
    )!;
    expect(entry.count).toBe(100);
    expect(entry.p50Ms).toBe(50);
    expect(entry.p95Ms).toBe(95);
    expect(entry.p99Ms).toBe(99);
    expect(entry.avgMs).toBeCloseTo(50.5, 1);
    expect(entry.minMs).toBe(1);
    expect(entry.maxMs).toBe(100);
    expect(entry.lastStatus).toBe(200);
  });

  it("2. buckets are keyed by method + route; unmatched requests are separate", () => {
    resetRouteMetricsForTest();
    recordRouteLatency("GET", "/api/v1/effects/:id", 200, 5);
    recordRouteLatency("POST", "/api/v1/effects", 201, 7);
    recordRouteLatency("GET", "/api/v1/effects", 200, 9);
    recordRouteLatency("GET", "(unmatched)", 404, 3);

    const routes = new Set(getRouteMetrics().map((e) => `${e.method} ${e.route}`));
    expect(routes.has("GET /api/v1/effects/:id")).toBe(true);
    expect(routes.has("POST /api/v1/effects")).toBe(true);
    expect(routes.has("GET /api/v1/effects")).toBe(true);
    expect(routes.has("GET (unmatched)")).toBe(true);
    expect(routeMetricsCount()).toBe(4);
  });

  it("3. reset clears buckets and the compiled route table", () => {
    recordRouteLatency("GET", "/x", 200, 1);
    resetRouteMetricsForTest();
    expect(routeMetricsCount()).toBe(0);
    expect(matchRoutePattern("GET", "/x")).toBeUndefined();
  });

  it("4. builds a route table from a live Express app and matches patterns", () => {
    resetRouteMetricsForTest();
    const app: Express = express();
    const router = express.Router();
    router.get("/search", (_req, res) => res.json({}));
    router.get("/:id", (_req, res) => res.json({}));
    app.use("/api/v1/widgets", router);
    app.get("/api/v1/root", (_req, res) => res.json({}));

    const size = buildRouteTable(app);
    expect(size).toBeGreaterThanOrEqual(3);

    // Static segments take precedence over :id (Express dispatch order).
    expect(matchRoutePattern("GET", "/api/v1/widgets/search")).toBe(
      "/api/v1/widgets/search",
    );
    expect(matchRoutePattern("GET", "/api/v1/widgets/42")).toBe(
      "/api/v1/widgets/:id",
    );
    // Method mismatches and unknown paths do not match.
    expect(matchRoutePattern("POST", "/api/v1/widgets/search")).toBeUndefined();
    expect(matchRoutePattern("GET", "/api/v1/nope")).toBeUndefined();
    // App-level routes (outside any module router) resolve too.
    expect(matchRoutePattern("GET", "/api/v1/root")).toBe("/api/v1/root");
    // Query strings are ignored during matching.
    expect(matchRoutePattern("GET", "/api/v1/widgets/search?q=x")).toBe(
      "/api/v1/widgets/search",
    );
  });
});
