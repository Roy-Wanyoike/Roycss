/**
 * module-status — single source of truth for the *data honesty* status of
 * every product module the marketing site renders (PF-012 / issue #86).
 *
 * Problem this file solves: ~37 product cards wire to backend endpoints via
 * `useBackendData` and render a "Live" pill whenever the request succeeds.
 * But a 200 response is not the same as live data — several backend-node
 * modules deliberately return static/mock snapshots (documented with
 * `Future:` comments in each module's service.ts and in
 * `docs/PENDING-FEATURES.md` §PF-012, items F4/F5/F6/F7/F9–F12/F14/F15).
 * Showing "Live" for those cards misled users and investors.
 *
 * Fix: this registry maps module-key → status. Badge components
 * (`DemoBadge`, `BackendLiveBadge`) read from here and nowhere else, so the
 * label can never drift from the registry. Flip one line here and every
 * badge in the site updates.
 *
 * Status semantics:
 *   - "live"         genuine backend data path (Prisma-backed service or a
 *                    real integration) — the card may show "Live" while the
 *                    request succeeds.
 *   - "demo"         module renders sample/demo data (static snapshot, mock
 *                    fallback, simulated run) — the card must never show
 *                    "Live"; it shows "Demo data — not live".
 *   - "catalog-only" module serves a static catalog/listing only — no live
 *                    execution — the card shows "Catalog only".
 *
 * Module keys are the backend-node module directory names
 * (`backend-node/src/modules/<key>`), which also match the first path
 * segment of every `useBackendData("<key>/…")` call.
 *
 * Guard: `tests/unit/module-status.test.ts` fails if any module documented
 * as mock/limited (a `Future:` comment in backend-node, or the PF-012
 * module list) is registered as "live".
 */

export type ModuleStatus = "live" | "demo" | "catalog-only";

/** All valid statuses (useful for exhaustiveness checks in tests). */
export const MODULE_STATUSES: readonly ModuleStatus[] = ["live", "demo", "catalog-only"] as const;

/**
 * The registry. Additive only — when a backend module graduates from mock to
 * real, flip its status here (and update the audit comment), never in a
 * component.
 */
export const MODULE_STATUS: Record<string, ModuleStatus> = {
  /* ── Live — genuine backend data path ──────────────────────────── */
  architect: "live", // architect/templates — static template catalog served by the API (LLM fallback only affects POST /plan)
  "audit-center": "live", // Prisma-backed (AuditProject + AuditResult)
  benchmark: "live", // Prisma-backed (BenchmarkResult)
  blueprints: "live", // Prisma-backed (Blueprint)
  blocks: "live", // Prisma-backed (Block)
  bundle: "live", // Prisma-backed (BundleResult)
  cdn: "live", // real provider API when CDN_* env is set
  challenges: "live", // Prisma-backed (Challenge + ChallengeSubmission)
  certifications: "live", // Prisma-backed (Certification + CertificationAttempt)
  "color-space": "live", // pure computation over the OKLCH reference table
  compliance: "live", // Prisma-backed (ComplianceStandard + ComplianceScan)
  deploy: "live", // Prisma-backed (Deployment)
  designer: "live", // designer/presets — preset catalog served by the API (LLM fallback only affects POST /design)
  fleet: "live", // Prisma-backed (FleetProject)
  governance: "live", // Prisma-backed (GovernancePolicy + GovernanceApproval)
  marketplace: "live", // Prisma-backed (Template + TemplateReview)
  motion: "live", // catalog from the dist/motion-library.json build artifact
  observatory: "live", // Prisma-backed
  os: "live", // Prisma-backed (OSDashboard)
  pair: "live", // LLM-backed with deterministic fallback (LLM key optional)
  patterns: "live", // real curated pattern snapshot (same data the site ships)
  profiler: "live", // Prisma-backed (ProfilerResult)
  registry: "live", // registry/packages — real npm registry lookup (seeded catalog fallback)
  review: "live", // LLM/heuristic rule engine, history persisted
  search: "live", // Prisma SearchIndex (ILIKE query)
  spotlight: "live", // Prisma-backed (SpotlightItem)
  storage: "live", // real S3-compatible integration when env is set
  sync: "live", // real integration when env is set
  version: "live", // reads the real package version + manifest
  workspace: "live", // Prisma-backed (WorkspaceResource)

  /* ── Demo — renders sample data, never "Live" ──────────────────── */
  analytics: "demo", // PF-012 F4 — apiCalls/avgResponseTime/traffic/geo/top-effects are static snapshots (only totalUsers + activeEffects are real)
  devtools: "demo", // PF-012 F12 — deterministic mock inspection unless Playwright ships in the deploy
  "digital-twin": "demo", // PF-012 F11 — deterministic mock simulation unless Lighthouse ships in the deploy
  edge: "demo", // PF-012 F6 + Future: comment — in-memory mock edge regions, no edge-platform API
  generator: "demo", // PF-012 F15 — template-only code generation ("Generate code from a template. Mock.")
  live: "demo", // PF-012 F9 — sessions/cursors/chat live in service memory; nothing is persisted
  "plugin-hub": "demo", // PF-012 F7 + Future: comment — 12 seeded mock plugins, no npm discovery/persistence
  refactor: "demo", // PF-012 F14 — deterministic mock transform variance, no real CSS-lint AST
  scaffold: "demo", // PF-012 F15 — template-only scaffold output, one-shot, not persisted
  accessibility: "demo", // PF-012 F10 — deterministic mock audit unless Playwright + axe ship in the deploy

  /* ── Catalog-only — static listing, no live execution ──────────── */
  mcp: "catalog-only", // PF-012 F5 + Future: comment — in-memory MCP tool catalog; executeTool does NOT invoke the MCP server
  recipes: "catalog-only", // Future: comment — static recipe snapshot (real curated content, no Prisma model yet)
};

/** Presentation copy per status — the only place badge text is defined. */
export interface ModuleStatusMeta {
  /** Short pill label (for tight header layouts). */
  label: string;
  /** Unambiguous visible copy rendered inside the badge. */
  text: string;
  /** Explanation for the `title` tooltip / assistive tech. */
  description: string;
}

export const MODULE_STATUS_META: Record<ModuleStatus, ModuleStatusMeta> = {
  live: {
    label: "Live",
    text: "Live",
    description: "Backed by live API data",
  },
  demo: {
    label: "Demo",
    text: "Demo data — not live",
    description: "Demo data — not live: this module renders sample data, not real results",
  },
  "catalog-only": {
    label: "Catalog",
    text: "Catalog only",
    description: "Catalog only — not live: this module lists a static catalog and does not execute live requests",
  },
};

/**
 * Registry lookup. Unknown keys deliberately resolve to "demo" — an
 * unregistered module can never accidentally earn a "Live" badge (fail
 * honest, not fail misleading).
 */
export function getModuleStatus(moduleKey: string): ModuleStatus {
  return MODULE_STATUS[moduleKey] ?? "demo";
}

/** Convenience: presentation copy for a module key. */
export function getModuleStatusMeta(moduleKey: string): ModuleStatusMeta {
  return MODULE_STATUS_META[getModuleStatus(moduleKey)];
}

/** Convenience: is this module's data path genuinely live? */
export function isModuleLive(moduleKey: string): boolean {
  return getModuleStatus(moduleKey) === "live";
}
