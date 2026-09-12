/**
 * API stability gate — PF-013: "fail if a stable API name disappears
 * without a major-version bump".
 *
 * Compares the CURRENT route inventory (same static walkers the
 * api:check / gen-openapi tooling uses — `scripts/lib/walk-routes.ts`)
 * against the committed snapshot `backend-node/api-surface.json`:
 *
 *   REMOVED   a route (method + path) present in the snapshot but gone
 *             from the code                                     → violation
 *   WEAKENED  a backend route whose auth requirement dropped
 *             (required → optional → none, or the route stopped
 *             being a backend route at all)                     → violation
 *
 *   ADDED     new routes / methods / hardened auth              → always
 *             allowed (reported for visibility)
 *
 * Violations FAIL the gate UNLESS backend-node/package.json's major
 * version is HIGHER than the one recorded in the snapshot — a major
 * bump is the documented escape hatch for intentional breaking
 * changes (bump the version, then regenerate the snapshot).
 *
 * Frontend route handlers (src/app/api/**) have no auth middleware of
 * their own (they proxy), so only presence is tracked for them —
 * except a backend route that re-appears as a frontend-only handler,
 * which counts as WEAKENED (its auth is no longer statically
 * guaranteed). Out of scope (documented): rate-limiter tier changes,
 * response envelope changes, query/body schema changes — API.md +
 * the contract suite cover those.
 *
 * Usage (from backend-node/):
 *   bun run api:surface        # gate: exit 1 on violations
 *   bun run api:surface:update # regenerate the snapshot
 *   # plain-bun form (no node_modules needed — node: builtins only):
 *   bun scripts/check-api-stability.ts [--update]
 *
 * The snapshot regeneration path is also documented in
 * .github/workflows/api-gate.yml:
 *   cd backend-node && bun run api:surface:update
 *   git add api-surface.json
 *
 * Pure static analysis — no env vars, no DB, no server boot, no install
 * (runs on plain `bun`; node: builtins only).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  BACKEND_ROOT,
  walkBackendRoutes,
  walkFrontendRoutes,
} from "./lib/walk-routes.js";

const SNAPSHOT_PATH = join(BACKEND_ROOT, "api-surface.json");
const PKG_PATH = join(BACKEND_ROOT, "package.json");

// ─── Snapshot types ───────────────────────────────────────────────────────

/** Auth requirement ladder, strongest first. */
export type AuthLevel = "required" | "optional" | "none";

export interface RouteEntry {
  /** "backend" routes carry auth info; "frontend" handlers don't. */
  origin: "backend" | "frontend";
  /** Auth requirement (backend routes only). */
  auth?: AuthLevel;
}

/** api-surface.json shape. `routes` keys are `${METHOD} ${path}`. */
export interface SnapshotFile {
  comment: string;
  snapshotFormat: 1;
  /** backend-node/package.json version at snapshot time. */
  packageVersion: string;
  counts: { backend: number; frontend: number };
  routes: Record<string, RouteEntry>;
}

export const SNAPSHOT_COMMENT =
  "PF-013 API surface snapshot. Regenerate after an INTENTIONAL " +
    "breaking change (major bump first): cd backend-node && " +
    "bun run api:surface:update";

// ─── Pure diff logic (unit-tested in tests/unit/api-stability.test.ts) ───

export interface StabilityViolation {
  key: string;
  kind: "removed" | "weakened";
  detail: string;
}

export interface StabilityReport {
  violations: StabilityViolation[];
  additions: string[];
  hardened: string[];
}

const AUTH_RANK: Record<AuthLevel, number> = {
  required: 2,
  optional: 1,
  none: 0,
};

/** Parse the major out of a semver string ("1.2.3" → 1). Null if not semver. */
export function parseMajorVersion(version: string): number | null {
  const m = /^v?(\d+)\.\d+\.\d+/.exec(version.trim());
  return m?.[1] ? Number(m[1]) : null;
}

/**
 * Compare a snapshot route table against the current one.
 * Pure — no filesystem, so the unit tests can drive it with fixtures.
 */
export function diffSurfaces(
  snapshotRoutes: Record<string, RouteEntry>,
  currentRoutes: Record<string, RouteEntry>,
): StabilityReport {
  const violations: StabilityViolation[] = [];
  const additions: string[] = [];
  const hardened: string[] = [];

  for (const [key, snap] of Object.entries(snapshotRoutes)) {
    const current = currentRoutes[key];
    if (!current) {
      violations.push({
        key,
        kind: "removed",
        detail: `present in api-surface.json, gone from the code (${snap.origin})`,
      });
      continue;
    }
    const snapAuth = snap.auth;
    const currentAuth = current.auth;
    if (snapAuth && (!currentAuth || AUTH_RANK[currentAuth] < AUTH_RANK[snapAuth])) {
      violations.push({
        key,
        kind: "weakened",
        detail: !currentAuth
          ? `auth requirement dropped: ${snapAuth} → none ` +
              `(no longer a backend route — ${current.origin} handler has no static auth)`
          : `auth requirement weakened: ${snapAuth} → ${currentAuth}`,
      });
    } else if (snapAuth && currentAuth && AUTH_RANK[currentAuth] > AUTH_RANK[snapAuth]) {
      hardened.push(key); // hardening is always allowed
    }
  }

  for (const key of Object.keys(currentRoutes)) {
    if (!snapshotRoutes[key]) additions.push(key);
  }

  additions.sort();
  hardened.sort();
  return { violations, additions, hardened };
}

// ─── FS-driven collection (walks the real route table) ───────────────────

/** Build the current route table: `${METHOD} ${path}` → entry. */
export function collectRoutes(): {
  routes: Record<string, RouteEntry>;
  counts: { backend: number; frontend: number };
} {
  const routes: Record<string, RouteEntry> = {};
  let backendCount = 0;
  let frontendCount = 0;

  for (const r of walkBackendRoutes()) {
    routes[`${r.method} ${r.path}`] = { origin: "backend", auth: r.auth };
    backendCount++;
  }
  for (const r of walkFrontendRoutes()) {
    const key = `${r.method} ${r.path}`;
    // A Next.js route handler and a backend route can share a method+path
    // only in the docs sense; if they do, keep the stricter (backend) entry.
    if (!routes[key]) {
      routes[key] = { origin: "frontend" };
      frontendCount++;
    }
  }
  return { routes, counts: { backend: backendCount, frontend: frontendCount } };
}

/** Read the committed snapshot. Throws with a clear message when absent. */
export function readSnapshot(): SnapshotFile {
  if (!existsSync(SNAPSHOT_PATH)) {
    throw new Error(
      `api-surface.json not found at ${SNAPSHOT_PATH} — regenerate it with ` +
        `\`bun scripts/check-api-stability.ts --update\` and commit the file`,
    );
  }
  const parsed = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as SnapshotFile;
  if (parsed.snapshotFormat !== 1) {
    throw new Error(
      `api-surface.json has unsupported snapshotFormat ${String(parsed.snapshotFormat)} — regenerate it`,
    );
  }
  return parsed;
}

/** Serialize a snapshot deterministically (sorted route keys). */
export function renderSnapshot(
  packageVersion: string,
  routes: Record<string, RouteEntry>,
  counts: { backend: number; frontend: number },
): string {
  const sorted: Record<string, RouteEntry> = {};
  for (const key of Object.keys(routes).sort()) {
    const entry = routes[key];
    if (entry !== undefined) sorted[key] = entry;
  }
  const snapshot: SnapshotFile = {
    comment: SNAPSHOT_COMMENT,
    snapshotFormat: 1,
    packageVersion,
    counts,
    routes: sorted,
  };
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

// ─── Version-aware verdict (unit-tested in tests/unit/api-stability.test.ts) ─

/** What the gate decided — the escape-hatch semantics live here. */
export type GateDecision =
  | { outcome: "pass"; report: StabilityReport }
  /** Stable-API breaks without a major bump → the gate must FAIL. */
  | { outcome: "fail"; report: StabilityReport }
  /** Breaks exist, but the major version moved past the snapshot's. */
  | { outcome: "major-bump-allowed"; report: StabilityReport }
  /** Version strings are unparseable or the package went backwards. */
  | { outcome: "invalid-versions"; report: StabilityReport; problem: string };

/**
 * Decide the gate verdict: `diffSurfaces` finds the surface changes,
 * then `backend-node/package.json`'s MAJOR version decides whether
 * breaking changes were authorized (PF-013: minor/patch bumps never
 * are — only a major bump). Pure — the unit tests drive it with
 * fixtures, the CLI feeds it the real snapshot + walker output.
 */
export function evaluateGate(
  snapshotRoutes: Record<string, RouteEntry>,
  currentRoutes: Record<string, RouteEntry>,
  snapshotVersion: string,
  currentVersion: string,
): GateDecision {
  const report = diffSurfaces(snapshotRoutes, currentRoutes);
  if (report.violations.length === 0) {
    return { outcome: "pass", report };
  }

  const snapshotMajor = parseMajorVersion(snapshotVersion);
  const currentMajor = parseMajorVersion(currentVersion);
  if (snapshotMajor === null || currentMajor === null) {
    return {
      outcome: "invalid-versions",
      report,
      problem:
        `could not parse semver (snapshot "${snapshotVersion}" vs ` +
        `package.json "${currentVersion}") — fix the version strings`,
    };
  }
  if (currentMajor < snapshotMajor) {
    return {
      outcome: "invalid-versions",
      report,
      problem:
        `package.json version (${currentVersion}) is LOWER than the ` +
        `snapshot's (${snapshotVersion}) — regenerate the snapshot`,
    };
  }
  if (currentMajor > snapshotMajor) {
    return { outcome: "major-bump-allowed", report };
  }
  return { outcome: "fail", report };
}

// ─── CLI ─────────────────────────────────────────────────────────────────

function main(): void {
  const update = process.argv.slice(2).includes("--update");
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8")) as { version?: string };
  const currentVersion = pkg.version;
  if (!currentVersion) {
    console.error(`✖ could not read "version" from ${PKG_PATH}`);
    process.exit(1);
  }

  const current = collectRoutes();

  if (update) {
    writeFileSync(
      SNAPSHOT_PATH,
      renderSnapshot(currentVersion, current.routes, current.counts),
      "utf8",
    );
    console.log(
      `✓ wrote api-surface.json — ${current.counts.backend} backend routes, ` +
        `${current.counts.frontend} frontend handlers, version ${currentVersion}.`,
    );
    return;
  }

  const snapshot = readSnapshot();
  const decision = evaluateGate(
    snapshot.routes,
    current.routes,
    snapshot.packageVersion,
    currentVersion,
  );
  const report = decision.report;

  console.log(
    `API stability check — snapshot v${snapshot.packageVersion} ` +
      `(${snapshot.counts.backend} backend + ${snapshot.counts.frontend} frontend) ` +
      `vs current ${current.counts.backend} backend + ${current.counts.frontend} frontend`,
  );

  if (report.additions.length > 0) {
    console.log(`ℹ ${report.additions.length} addition(s) — always allowed:`);
    for (const key of report.additions) console.log(`  + ${key}`);
  }
  if (report.hardened.length > 0) {
    console.log(`ℹ ${report.hardened.length} auth-hardened route(s) — allowed:`);
    for (const key of report.hardened) console.log(`  ~ ${key}`);
  }

  if (decision.outcome === "pass") {
    console.log(
      "✓ stable API surface intact — no removals or auth weakenings.",
    );
    return;
  }

  // Version strings must be comparable before the escape hatch applies.
  if (decision.outcome === "invalid-versions") {
    console.error(`✖ ${decision.problem}`);
    process.exit(1);
  }

  // Major-version escape hatch (PF-013): breaking changes are allowed
  // when the major version moved past the one recorded in the snapshot.
  if (decision.outcome === "major-bump-allowed") {
    console.log(
      `ℹ major bump detected (${snapshot.packageVersion} → ${currentVersion}) — ` +
        `${report.violations.length} breaking change(s) allowed:`,
    );
    for (const v of report.violations) {
      console.log(`  ! ${v.key} — ${v.detail}`);
    }
    console.log(
      "Remember to regenerate the snapshot so the new surface becomes the " +
        "stable baseline: cd backend-node && bun run api:surface:update",
    );
    return;
  }

  console.error(
    `\n✖ ${report.violations.length} stable API break(s) without a major-version bump ` +
      `(snapshot v${snapshot.packageVersion}, package.json v${currentVersion}):`,
  );
  for (const v of report.violations) {
    console.error(`  ✖ ${v.key} — ${v.detail}`);
  }
  console.error(
    "\nPF-013: a stable API name must not disappear (or lose auth) without " +
      "a major-version bump. Either restore the route, or make it an " +
      "intentional break:\n" +
      "  1. bump \"version\" in backend-node/package.json to the next major\n" +
      "  2. cd backend-node && bun run api:surface:update\n" +
      "  3. commit backend-node/api-surface.json together with the change",
  );
  process.exit(1);
}

// Run only when executed directly (importing for tests is side-effect-free).
// `resolve` normalizes a relative argv[1] (e.g. running
// `bun scripts/check-api-stability.ts` from backend-node/).
const isMain =
  typeof process !== "undefined" &&
  !!process.argv[1] &&
  import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href;
if (isMain) main();
