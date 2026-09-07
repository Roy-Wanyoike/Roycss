/**
 * Per-route latency metrics (PF-009 / issue #94 A9).
 *
 * In-memory histograms keyed by (method, route-pattern): each entry
 * keeps the last N latency samples (ms) and exposes p50/p95/p99,
 * count, and average. Buckets are recorded from a finish-hook
 * middleware mounted early in the app stack (app.ts), so every route
 * — including 404s — is measured.
 *
 * The route PATTERN (e.g. `/api/v1/effects/:id`) is recovered from
 * the live Express router table (see `buildRouteTable`): `req.route`
 * is not reliably readable in a `res.on("finish")` handler, so the
 * metrics middleware matches the concrete URL against the compiled
 * pattern table in Express's own dispatch order.
 *
 * Exposed at the admin endpoint `GET /api/v1/metrics/routes`
 * (auth + platform-ADMIN guarded — see modules/metrics/routes.ts).
 */
import type { Express, Request, Response } from "express";

import { createLogger } from "./logger.js";

const log = createLogger("metrics");

/** Samples retained per route bucket — keeps memory bounded. */
const MAX_SAMPLES = 500;

export interface RouteMetricsEntry {
  method: string;
  route: string;
  count: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  lastStatus: number;
}

interface Bucket {
  method: string;
  route: string;
  samples: number[];
  lastStatus: number;
}

const buckets = new Map<string, Bucket>();

// ─── Route pattern table ──────────────────────────────────────────────────

interface RoutePattern {
  method: string;
  pattern: string;
  regex: RegExp;
}

/** Ordered route patterns — Express dispatch order. */
let routeTable: RoutePattern[] | null = null;

/**
 * Express Layer internals we read (stable across Express 4.x):
 * route layers expose `.route` (Route with `.path` + method stack);
 * mounted routers expose `handle.stack`.
 */
interface ExpressLayer {
  name: string;
  route?: { path: string; stack: { method?: string }[] };
  handle?: { stack?: ExpressLayer[] };
  regexp?: { source: string };
}

/**
 * Decode a mount layer regexp source back to its path.
 * path-to-regexp 0.x emits e.g. `^\/api\/v1\/effects\/?(?=\/|$)`.
 */
function decodeMountPath(source: string): string {
  let s = source;
  if (s.startsWith("^")) s = s.slice(1);
  // path-to-regexp 0.x mount tails: "\/?(?=\/|$)" (optional slash +
  // slash-or-end lookahead) or a bare "$" anchor.
  const TAIL = "\\/?(?=\\/|$)";
  if (s.endsWith(TAIL)) {
    s = s.slice(0, -TAIL.length);
  } else if (s.endsWith("$")) {
    s = s.slice(0, -1);
  }
  // Unescape literals (\/ → /, \. → ., …).
  return s.replace(/\\(.)/g, "$1");
}

function walkStack(
  stack: ExpressLayer[] | undefined,
  prefix: string,
  out: RoutePattern[],
): void {
  if (!Array.isArray(stack)) return;
  for (const layer of stack) {
    if (layer.route && typeof layer.route.path === "string") {
      for (const methodLayer of layer.route.stack ?? []) {
        if (methodLayer?.method) {
          out.push({
            method: methodLayer.method.toUpperCase(),
            pattern: prefix + layer.route.path,
            regex: patternToRegex(prefix + layer.route.path),
          });
        }
      }
    } else if (Array.isArray(layer.handle?.stack)) {
      const nested = decodeMountPath(layer.regexp?.source ?? "^");
      if (nested) {
        walkStack(layer.handle?.stack, prefix + nested, out);
      }
    }
  }
}

/** Compile an Express-style path pattern to a match regex. */
function patternToRegex(pattern: string): RegExp {
  const segments = pattern
    .split("/")
    .map((seg) =>
      seg.startsWith(":") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("/");
  return new RegExp(`^${segments}/?$`);
}

/**
 * Build the route pattern table from the app's wired router stack.
 * Call AFTER all routers are mounted (createApp does this at the end).
 * Idempotent.
 */
export function buildRouteTable(app: Express): number {
  if (routeTable) return routeTable.length;
  const table: RoutePattern[] = [];
  const router = (app as unknown as { _router?: { stack?: ExpressLayer[] } })
    ._router;
  walkStack(router?.stack, "", table);
  routeTable = table;
  log.debug("Route metrics table built", { routes: table.length });
  return table.length;
}

/** Match a concrete method+path against the pattern table. */
export function matchRoutePattern(
  method: string,
  path: string,
): string | undefined {
  if (!routeTable) return undefined;
  const pathname = path.split("?")[0] ?? path;
  for (const entry of routeTable) {
    if (entry.method === method && entry.regex.test(pathname)) {
      return entry.pattern;
    }
  }
  return undefined;
}

// ─── Recording ────────────────────────────────────────────────────────────

/** Record one request observation. Called from the finish hook. */
export function recordRouteLatency(
  method: string,
  route: string,
  status: number,
  durationMs: number,
): void {
  const key = `${method} ${route}`;
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { method, route, samples: [], lastStatus: status };
    buckets.set(key, bucket);
  }
  bucket.samples.push(durationMs);
  if (bucket.samples.length > MAX_SAMPLES) {
    bucket.samples.splice(0, bucket.samples.length - MAX_SAMPLES);
  }
  bucket.lastStatus = status;
}

/**
 * Metrics middleware — mount once, early in the app stack. Records
 * (method, matched route pattern, status, duration) when the response
 * finishes. Never throws into the response path.
 */
export function routeMetricsMiddleware(
  req: Request,
  res: Response,
  next: () => void,
): void {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    try {
      const elapsedNs = Number(process.hrtime.bigint() - start);
      const durationMs = Math.max(
        0,
        Math.round(elapsedNs / 1_000_000 * 100) / 100,
      );
      const path = (req.originalUrl ?? req.url ?? "").toString();
      const route =
        matchRoutePattern(req.method, path) ?? "(unmatched)";
      recordRouteLatency(req.method, route, res.statusCode, durationMs);
    } catch (err) {
      log.warn("Failed to record route metrics", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  });
  next();
}

// ─── Reporting ────────────────────────────────────────────────────────────

/** Nearest-rank percentile over a sorted sample list. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(Math.max(rank, 1), sorted.length) - 1]!;
}

/** Snapshot of every route bucket, sorted by route then method. */
export function getRouteMetrics(): RouteMetricsEntry[] {
  const entries: RouteMetricsEntry[] = [];
  for (const bucket of buckets.values()) {
    const sorted = [...bucket.samples].sort((a, b) => a - b);
    const total = sorted.reduce((s, v) => s + v, 0);
    entries.push({
      method: bucket.method,
      route: bucket.route,
      count: sorted.length,
      p50Ms: percentile(sorted, 50),
      p95Ms: percentile(sorted, 95),
      p99Ms: percentile(sorted, 99),
      avgMs: sorted.length > 0 ? Math.round((total / sorted.length) * 100) / 100 : 0,
      minMs: sorted[0] ?? 0,
      maxMs: sorted[sorted.length - 1] ?? 0,
      lastStatus: bucket.lastStatus,
    });
  }
  entries.sort((a, b) => a.route.localeCompare(b.route) || a.method.localeCompare(b.method));
  return entries;
}

/** Number of tracked route buckets (diagnostics/tests). */
export function routeMetricsCount(): number {
  return buckets.size;
}

/** Test-only: drop every bucket and forget the compiled route table. */
export function resetRouteMetricsForTest(): void {
  buckets.clear();
  routeTable = null;
}
