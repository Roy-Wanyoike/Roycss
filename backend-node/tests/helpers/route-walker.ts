/**
 * Route-introspection walker (PF-007 contract harness core).
 *
 * Walks the LIVE Express router of `createApp()` and returns a flat,
 * deduplicated table of every registered HTTP route:
 *
 *   { method, path, module }   e.g. { "get", "/api/v1/search", "search" }
 *
 * How it works:
 *   - Express 4 keeps the routing table on `app._router.stack` as an
 *     array of `Layer` objects.
 *   - A layer with `.route` set is a terminal route (path pattern +
 *     `.methods` map).
 *   - A layer whose `.handle` is a Router (has its own `.stack` and the
 *     layer name "router") is a mounted sub-router — recurse with the
 *     layer's path prefix.
 *
 * This mirrors the introspection approach used by scripts/lib/walk-routes.ts
 * for API.md generation, but is kept deliberately independent so the
 * CONTRACT tests never share code with the doc generator they are
 * supposed to keep honest.
 */
import type { Express } from "express";

export interface RouteEntry {
  /** Lowercase HTTP method: get | post | put | patch | delete | options | head. */
  method: string;
  /** Full path pattern, e.g. "/api/v1/effects/:id". */
  path: string;
  /** Module segment — the first path chunk after /api/v1 ("effects"),
   * or "root" for the API root "/api/v1" itself. */
  module: string;
}

interface LayerKey {
  name: string;
}
interface LayerLike {
  route?: { path: string; methods: Record<string, boolean> };
  // Express 4 routers are functions that carry a `.stack` of layers.
  handle: any;
  path?: string;
  name?: string;
  regexp?: RegExp;
  keys?: LayerKey[];
}

/** True when the layer's handle is an Express Router (recursable). */
function isRouterLayer(layer: LayerLike): boolean {
  const handle = layer.handle;
  return (
    typeof handle === "function" &&
    Array.isArray(handle.stack) &&
    // Mounted routers are named "router"; terminal routes and middleware
    // (query, expressInit, helmet, cors…) are not.
    layer.name === "router"
  );
}

/** Type-safe view of a router layer's inner stack. */
function innerStack(layer: LayerLike): LayerLike[] {
  return (layer.handle?.stack ?? []) as LayerLike[];
}

/**
 * Reconstruct the mount path of a router layer.
 *
 * Express 4 layers don't store the plain path (Express 5 does, via
 * `layer.path`). For Express 4 we decode it from `layer.regexp`:
 *
 *   /^\/api\/v1\/foo\/?(?=\/|$)/i           → /api/v1/foo
 *   /^\/api\/v1\/foo\/(?:([^\/]+?))\/?(?=\/|$)/i (mounts with params —
 *   not used in this codebase) → /api/v1/foo/:<key name>
 */
function layerMountPath(layer: LayerLike): string {
  if (typeof layer.path === "string" && layer.path) return layer.path;
  const source = layer.regexp?.source;
  if (!source) return "";
  let body = source;
  if (body.startsWith("^")) body = body.slice(1);
  // Strip the trailing "\/?(?=\/|$)" matcher Express appends to mounts.
  // (In a regexp source, "/" is stored escaped as "\/" — so we must match
  // the literal backslash too.)
  body = body.replace(/\\\/\?\(\?=\\\/\|\$\)$/, "");
  // Replace param capture groups "(?:([^\/]+?))" with ":<name>" using
  // layer.keys (in declaration order).
  let keyIndex = 0;
  body = body.replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, () => {
    const name = layer.keys?.[keyIndex]?.name ?? `param${keyIndex}`;
    keyIndex += 1;
    return `:${name}`;
  });
  return body.replace(/\\\//g, "/");
}

/** Walk one router stack, accumulating routes into `out` (deduped by key). */
function walkStack(
  stack: LayerLike[],
  prefix: string,
  out: Map<string, RouteEntry>,
): void {
  for (const layer of stack) {
    if (layer.route) {
      // Terminal route layer — register every method it responds to.
      const fullPath = joinPath(prefix, layer.route.path);
      for (const method of Object.keys(layer.route.methods)) {
        if (!layer.route.methods[method]) continue;
        const key = `${method.toUpperCase()} ${fullPath}`;
        if (!out.has(key)) {
          out.set(key, {
            method: method.toLowerCase(),
            path: fullPath,
            module: moduleOf(fullPath),
          });
        }
      }
      continue;
    }
    if (isRouterLayer(layer)) {
      walkStack(innerStack(layer), joinPath(prefix, layerMountPath(layer)), out);
    }
    // Everything else (middleware: helmet, cors, rate-limit, 404/error
    // handlers) is not a route — skipped.
  }
}

/** Join a mounted prefix with a sub-path, collapsing duplicate slashes. */
function joinPath(prefix: string, sub: string): string {
  if (!prefix) return normalizePathPattern(sub);
  if (!sub) return normalizePathPattern(prefix);
  return normalizePathPattern(
    `${prefix.replace(/\/$/, "")}/${sub.replace(/^\//, "")}`,
  );
}

/**
 * Normalize an Express 5 path-to-regexp pattern for display/matching:
 *   - unescape literal escapes ("\." → "." — e.g. the OpenAPI document
 *     route mounted at /api/v1/openapi.json registers as "openapi\\.json")
 *   - strip a trailing slash (mounting an empty sub-router yields "…/…/")
 * The walk stays lossless for assertions: ":param" segments are already
 * restored as named params, and these two normalizations make the path
 * string identical to what the route was declared with in source.
 */
function normalizePathPattern(path: string): string {
  return path.replace(/\\([.\\/-])/g, "$1").replace(/\/$/, "");
}

/** Module segment of a full path ("/api/v1/effects/:id" → "effects"). */
function moduleOf(path: string): string {
  const parts = path.split("/").filter(Boolean); // ["api","v1","effects",":id"]
  if (parts.length < 3) return "root";
  return parts[2] ?? "root";
}

/**
 * Enumerate all routes of an Express app, scoped to /api/v1 by default.
 * Sorted deterministically (path, then method) so snapshots are stable.
 */
export function listRoutes(
  app: Express,
  modulePrefix = "/api/v1",
): RouteEntry[] {
  const router = (app as any)._router;
  if (!router || !Array.isArray(router.stack)) {
    throw new Error("route-walker: app._router.stack is unavailable");
  }
  const out = new Map<string, RouteEntry>();
  walkStack(router.stack, "", out);
  const routes = [...out.values()].sort((a, b) =>
    a.path === b.path
      ? a.method.localeCompare(b.method)
      : a.path.localeCompare(b.path),
  );
  return modulePrefix
    ? routes.filter(
        (r) =>
          r.path === modulePrefix || r.path.startsWith(`${modulePrefix}/`),
      )
    : routes;
}

/** Mutating methods — the security authn sweep iterates these. */
export const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

/** Routes that LIST a collection (GET whose tail segment is not a :param). */
export function isListRoute(entry: RouteEntry): boolean {
  if (entry.method !== "get") return false;
  const segments = entry.path.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  return !last.startsWith(":");
}

/** Routes that fetch a single resource (GET ending in a ":param"). */
export function isSingleRoute(entry: RouteEntry): boolean {
  if (entry.method !== "get") return false;
  const segments = entry.path.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  return last.startsWith(":");
}
