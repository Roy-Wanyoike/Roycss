/**
 * API.md drift gate — verifies the public API surface documented in
 * API.md matches the code. Exits 1 (listing missing/extra routes) when
 * they diverge, 0 when in sync.
 *
 * What it checks:
 *   1. Backend: every route mounted in `src/server/app.ts` (router mounts
 *      + the root `GET /api/v1` info endpoint) and defined in each
 *      `src/modules/<m>/routes.ts` appears in API.md.
 *   2. Frontend: every handler in the route.ts files under `src/app/api`
 *      (method + path) appears in API.md.
 *   3. Extra: every `/api/...` route row documented in API.md exists in
 *      the code (no stale docs).
 *
 * API.md table rows are the source of truth for the doc side:
 *   | GET | `/api/v1/effects` | ... |   ← method in col 1, backticked
 *   | ANY | `/api/v1/*`       | ... |   ← ANY = all methods (proxy row)
 *
 * Usage (from backend-node/):
 *   bunx tsx scripts/check-api-docs.ts [path-to-API.md]
 *   bun run api:check
 *
 * Pure static analysis — no env vars, no DB, no server boot.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  REPO_ROOT,
  walkBackendRoutes,
  walkFrontendRoutes,
} from "./lib/walk-routes.js";

const METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "ANY",
  "HEAD",
]);

/** Route rows documented in API.md: path → set of methods (ANY = wildcard). */
function parseDocRoutes(doc: string): Map<string, Set<string>> {
  const routes = new Map<string, Set<string>>();
  for (const line of doc.split("\n")) {
    // Markdown table row: | METHOD | `PATH` | ...
    const m = line.match(/^\|\s*([A-Z]+)\s*\|\s*`([^`]+)`\s*\|/);
    if (!m) continue;
    const [, method, path] = m;
    if (!METHODS.has(method)) continue;
    if (!path.startsWith("/api/")) continue;
    const set = routes.get(path) ?? new Set<string>();
    set.add(method);
    routes.set(path, set);
  }
  return routes;
}

interface Report {
  missing: string[];
  extra: string[];
  backendCount: number;
  frontendCount: number;
  docRowCount: number;
}

function check(docPath: string): Report {
  const doc = readFileSync(docPath, "utf8");
  const docRoutes = parseDocRoutes(doc);

  const backend = walkBackendRoutes();
  const frontend = walkFrontendRoutes();

  const missing: string[] = [];
  const extra: string[] = [];

  const covered = (path: string, method: string): boolean => {
    const set = docRoutes.get(path);
    if (!set) return false;
    return set.has(method) || set.has("ANY");
  };

  // 1) every code route must be documented
  for (const r of backend) {
    if (!covered(r.path, r.method)) {
      missing.push(`backend  ${r.method.padEnd(7)} ${r.path}`);
    }
  }
  for (const r of frontend) {
    if (!covered(r.path, r.method)) {
      missing.push(`frontend ${r.method.padEnd(7)} ${r.path}`);
    }
  }

  // 2) every documented /api/ row must exist in code
  const codePaths = new Set<string>([
    ...backend.map((r) => r.path),
    ...frontend.map((r) => r.path),
  ]);
  const codePathMethods = (path: string): Set<string> => {
    const methods = new Set<string>();
    for (const r of backend) if (r.path === path) methods.add(r.method);
    for (const r of frontend) if (r.path === path) methods.add(r.method);
    return methods;
  };
  for (const [path, methods] of docRoutes) {
    if (!codePaths.has(path)) {
      extra.push(`doc      ${[...methods].join(",")} ${path} (no such route in code)`);
      continue;
    }
    if (methods.has("ANY")) continue; // wildcard covers whatever exists
    for (const method of methods) {
      if (!codePathMethods(path).has(method)) {
        extra.push(
          `doc      ${method} ${path} (method not implemented in code)`,
        );
      }
    }
  }

  return {
    missing,
    extra,
    backendCount: backend.length,
    frontendCount: frontend.length,
    docRowCount: [...docRoutes.values()].reduce((n, s) => n + s.size, 0),
  };
}

// ─── CLI ──────────────────────────────────────────────────────────────────

const arg = process.argv[2];
const docPath = arg ? resolve(arg) : resolve(REPO_ROOT, "API.md");

if (!existsSync(docPath)) {
  console.error(`✖ API.md not found at ${docPath}`);
  process.exit(1);
}

const report = check(docPath);

console.log(
  `API drift check — ${report.backendCount} backend routes, ` +
    `${report.frontendCount} frontend route handlers, ` +
    `${report.docRowCount} documented rows in ${docPath}`,
);

if (report.missing.length > 0 || report.extra.length > 0) {
  if (report.missing.length > 0) {
    console.error(
      `\n✖ ${report.missing.length} route(s) missing from API.md ` +
        `(implemented in code but not documented):`,
    );
    for (const line of report.missing) console.error(`  ${line}`);
  }
  if (report.extra.length > 0) {
    console.error(
      `\n✖ ${report.extra.length} stale route(s) in API.md ` +
        `(documented but not implemented):`,
    );
    for (const line of report.extra) console.error(`  ${line}`);
  }
  console.error(
    "\nFix: update API.md (or regenerate the skeleton with " +
      "`bun run api:gen`) so it matches src/server/app.ts + module routes.",
  );
  process.exit(1);
}

console.log("✓ API.md is in sync with the code (no missing or stale routes).");
