/**
 * Roadmap data — public /roadmap page (issue #130, PF-045 acceptance #4).
 *
 * A curated, typed cut of `docs/PENDING-FEATURES.md` (the backlog source
 * of truth — PF-001..PF-049, states re-verified against the tree at
 * `main` @ 148d4bb, 2026-09-18). The page must not overclaim, so the
 * status mapping is deliberately conservative:
 *
 *   - `shipped`     only where the backlog's own State field says
 *                   DONE/shipped (residuals, where any, are stated in
 *                   the description — e.g. PF-001's role-check half,
 *                   PF-011's production mail key, PF-016's npm publish);
 *   - `in-progress` where the item is partial or carries an actively
 *                   dispatched residual (the filed issue queue
 *                   #123-#132 + the P0/P1 partials);
 *   - `planned`     where the item is not started or awaits a decision —
 *                   including "partial" items whose shipped groundwork
 *                   is called out in the description but whose feature
 *                   build has not begun.
 *
 * Owner-only work (npm publish, Vercel reclaim, domain, production keys)
 * is NOT feature work — it lives in `LAUNCH_MILESTONES` below, rendered
 * as its own section on the page.
 *
 * Update cadence: when an item flips in docs/PENDING-FEATURES.md, flip it
 * here in the same commit (this file is a cut, not a second source of
 * truth — the doc wins on any disagreement).
 */

export type RoadmapStatus = "shipped" | "in-progress" | "planned";

export type RoadmapCategory =
  | "backend"
  | "frontend"
  | "docs"
  | "a11y"
  | "infra"
  | "tooling"
  | "ai"
  | "motion"
  | "tokens"
  | "platform"
  | "community"
  | "governance"
  | "research"
  | "payments"
  | "education"
  | "enterprise"
  | "i18n"
  | "compiler"
  | "css"
  | "components"
  | "ecosystem"
  | "tests"
  | "ci"
  | "data"
  | "product";

export interface RoadmapItem {
  /** Backlog id — matches the `### PF-NNN` heading in PENDING-FEATURES.md. */
  id: string;
  title: string;
  status: RoadmapStatus;
  category: RoadmapCategory;
  /** One honest line: what exists today, and (if partial) what remains. */
  description: string;
}

export interface LaunchMilestone {
  id: string;
  title: string;
  /** GitHub issue tracking the owner action, if one is filed. */
  issue?: number;
  description: string;
}

/** Where this cut was synced from (shown on the page as the source link). */
export const ROADMAP_SOURCE_URL =
  "https://github.com/Roy-Wanyoike/Roycss/blob/main/docs/PENDING-FEATURES.md";
export const ROADMAP_SYNCED_AT = "September 18, 2026";

export const ROADMAP_ITEMS: RoadmapItem[] = [
  // ── Now — in progress ─────────────────────────────────────────────────
  {
    id: "PF-004",
    title: "Accessibility tiers + external WCAG audit",
    status: "in-progress",
    category: "a11y",
    description:
      "Code half shipped: per-effect a11y tags on all effects (motion-safe / decorative / aria-noted tiers, drift-gated) with a motion-safe-only filter. The third-party WCAG 2.2 AA audit + VPAT 2.4 is the owner-side remainder.",
  },
  {
    id: "PF-007",
    title: "Deep-path test coverage toward the 80% floor",
    status: "in-progress",
    category: "tests",
    description:
      "Registry-driven contract, security, and integration suites are live with a coverage ratchet; deep-path tests for the remaining ~50 modules close the gap to the 80% statements goal.",
  },
  {
    id: "PF-008",
    title: "backend-go production port",
    status: "in-progress",
    category: "backend",
    description:
      "The Go target has 3 real handlers and 64 honest 501 stubs across the 72 module dirs, plus docker-compose/terraform/OpenAPI artifacts. Porting the stubs to real handlers (against the contract tests) is the next major backend step.",
  },
  {
    id: "PF-010",
    title: "Marketplace + sponsorship payments",
    status: "in-progress",
    category: "payments",
    description:
      "Marketplace UI and backend module exist; Stripe Connect, idempotent purchases, and creator payouts are unwired — the sponsorship modal honestly says “coming soon” instead of faking a checkout.",
  },
  {
    id: "PF-014",
    title: "Versioned docs routing",
    status: "in-progress",
    category: "docs",
    description:
      "Every effect has a prerendered /effects/<id> page with live preview, copyable CSS, and JSON-LD. Residuals: versioned /docs/[version] routing, edit-on-GitHub links, and the per-page feedback widget.",
  },
  {
    id: "PF-021",
    title: "AI conformance artifacts",
    status: "in-progress",
    category: "ai",
    description:
      "Five LLM backend modules and the AI playgrounds run with mock fallback. Next: the roycss.rules.md / system-prompt / training-pairs content half; the vector-index half waits on provider keys.",
  },
  {
    id: "PF-030",
    title: "Token type system emission",
    status: "in-progress",
    category: "tokens",
    description:
      "Typed design tokens with @property registration exist today; the dispatched slice emits dist/tokens.d.ts + tokens.dtcg.json with a round-trip validator.",
  },
  {
    id: "PF-031",
    title: "i18n readiness",
    status: "in-progress",
    category: "i18n",
    description:
      "RTL and OKLCH audits already run in tests. Next slice: the message catalog, translation-platform wiring, RTL-safe marquee, and the Playwright multi-browser matrix.",
  },
  {
    id: "PF-035",
    title: "Cascade constitution (!important audit + @layer ordering)",
    status: "in-progress",
    category: "css",
    description:
      "V1 slice shipped: scripts/audit-important.ts ratchets the !important budget (0 unjustified, gate via bun run audit:important:check) and validates @layer ordering; the 5-rule lint engine is shared with roycss lint. Residual: re-architecting roycss.css itself onto the @layer skeleton.",
  },
  {
    id: "PF-036",
    title: "roycss lint CLI + editor diagnostics",
    status: "in-progress",
    category: "tooling",
    description:
      "V1 slice shipped: `roycss lint [--fix]` exposes the shared 5-rule engine (no-important, oklch-colors, roycss-prefix, reduced-motion-guard, layer-order) in the CLI and the in-browser Code Health Linter tool. Residual: the full VS Code LSP with diagnostics and community rule API.",
  },
  {
    id: "PF-042",
    title: "Unified manifest + maturity tags",
    status: "in-progress",
    category: "data",
    description:
      "Four separate artifact files exist but are not unified. The dispatched slice builds one roycss.manifest.json, effect maturity tags, and effect-quality scores.",
  },
  {
    id: "PF-045",
    title: "Community surface (this page + contributor ladder)",
    status: "in-progress",
    category: "community",
    description:
      "This roadmap page and the contributor ladder in CONTRIBUTING ship now. Still open: the starter-template gallery, good-first-issue automation, and the sponsorship/Conf program.",
  },

  // ── Next — planned ────────────────────────────────────────────────────
  {
    id: "PF-003",
    title: "Production infrastructure",
    status: "planned",
    category: "infra",
    description:
      "14 SQL migrations, docker-compose, and terraform are committed; provisioning PostgreSQL, Redis, S3, and workers is bundled with the owner-side launch milestones below.",
  },
  {
    id: "PF-017",
    title: "RoyMotion gestures + View Transitions",
    status: "planned",
    category: "motion",
    description:
      "60 motion presets, the animation timeline, and view-transition tools exist; the gesture library, router adapters, and cross-document MPA transitions are the build.",
  },
  {
    id: "PF-018",
    title: "Multi-surface token emission + Figma plugin",
    status: "planned",
    category: "tokens",
    description:
      "Tokens export as JSON today; iOS/Android/Flutter/Windows emission and the bidirectional Figma sync plugin are planned.",
  },
  {
    id: "PF-019",
    title: "Roy Cloud collaboration",
    status: "planned",
    category: "platform",
    description:
      "Cloud module scaffolding exists; Git-backed token repos, live multi-cursor editing, CDN theme hosting, and SSO are the v1.1 build.",
  },
  {
    id: "PF-020",
    title: "Marketplace creator platform",
    status: "planned",
    category: "platform",
    description:
      "Creator onboarding, the item-review pipeline, and payout dashboards on top of PF-010's payment wiring.",
  },
  {
    id: "PF-022",
    title: "Component Genome",
    status: "planned",
    category: "tooling",
    description:
      "Per-component manifests with composition graph, WCAG level, browser support, and bundle size — queryable via `roycss genome` and `roycss impact`.",
  },
  {
    id: "PF-023",
    title: "Accessibility Suite SDK",
    status: "planned",
    category: "a11y",
    description:
      "Build-time a11y audits exist; the @roycss/a11y build-fail CLI, RUM SDK, and AI auto-fix PR opener are the expansion.",
  },
  {
    id: "PF-024",
    title: "Academy certification",
    status: "planned",
    category: "education",
    description:
      "Academy UI and course modules exist; proctored exams and verifiable certification issuance are the build-out.",
  },
  {
    id: "PF-025",
    title: "Enterprise program",
    status: "planned",
    category: "enterprise",
    description:
      "The SLA docs shipped with the governance pack; the private registry, pen-test cadence, SOC 2 Type II, and indemnification program remain.",
  },
  {
    id: "PF-026",
    title: "Themes store",
    status: "planned",
    category: "platform",
    description:
      "Ten first-party theme presets ship today; the 10-vertical store with compliance-reviewed theme packs is planned.",
  },
  {
    id: "PF-027",
    title: "Motion Library Premium",
    status: "planned",
    category: "motion",
    description:
      "60 free presets ship today; the premium tier adds choreographed sequences, spring presets, page transitions, and motion tokens.",
  },
  {
    id: "PF-028",
    title: "Headless / styled split",
    status: "planned",
    category: "components",
    description:
      "@roycss/headless + @roycss/styled with compiled CVA variants and 100+ components, decoupled from the shadcn/ui fork.",
  },
  {
    id: "PF-029",
    title: "Composable effect recipes",
    status: "planned",
    category: "ecosystem",
    description:
      "12 recipes exist in-app; the recipe manifest spec, the @roycss-recipe/* org, and the composition engine are the expansion.",
  },
  {
    id: "PF-032",
    title: "V2 monorepo + build pipeline",
    status: "planned",
    category: "tooling",
    description:
      "Bun workspaces + Turborepo + changesets, a Lightning CSS pipeline, and AOT/JIT/runtime rendering modes — the foundation most V2 items build on.",
  },
  {
    id: "PF-033",
    title: "Intent-Class Compiler (RoyLang)",
    status: "planned",
    category: "compiler",
    description:
      "Research-grade: the intent-verb language and compiler that sit at the top of the V2 dependency graph.",
  },
  {
    id: "PF-034",
    title: "Plugin API + plugin marketplace",
    status: "planned",
    category: "ecosystem",
    description:
      "A formal plugin contract with lifecycle hooks, five official first-party plugins, and a vetted community marketplace.",
  },
  {
    id: "PF-037",
    title: "Performance observables",
    status: "planned",
    category: "tooling",
    description:
      "Benchmarks and regression tests exist; `roycss perf:check/overlay/ci` with source-map attribution is the build.",
  },
  {
    id: "PF-038",
    title: "DevTools panel + Roy Inspector",
    status: "planned",
    category: "tooling",
    description:
      "A RoyCSS tab in browser DevTools, the token inspector, the effect debugger, and the Roy Inspector extension.",
  },
  {
    id: "PF-039",
    title: "Roy Studio",
    status: "planned",
    category: "platform",
    description:
      "The Tauri-based visual builder — drag-and-drop layout, visual token editor, effect picker — exporting real RoyCSS.",
  },
  {
    id: "PF-040",
    title: "Commercial cloud (V2.3 consolidation)",
    status: "planned",
    category: "platform",
    description:
      "The V2 consolidation of Roy Cloud, marketplace payments, and the enterprise program into one commercial surface.",
  },
  {
    id: "PF-041",
    title: "Integrated AI layer (V2)",
    status: "planned",
    category: "ai",
    description:
      "The V2 consolidation of the retrieval + conformance work across CLI, Studio, Cloud, Marketplace, and DevTools.",
  },
  {
    id: "PF-043",
    title: "Visual regression + cross-browser CI",
    status: "planned",
    category: "ci",
    description:
      "Playwright e2e is wired; the Storybook addon, Chromatic visual regression, and the cross-browser matrix are the expansion.",
  },
  {
    id: "PF-044",
    title: "V2 governance + enterprise readiness",
    status: "planned",
    category: "governance",
    description:
      "WCAG 3.0 readiness, SLSA L3 build provenance, SOC 2 Type II, the working group, and RoyCSS Conf.",
  },
  {
    id: "PF-046",
    title: "v3 research directions",
    status: "planned",
    category: "research",
    description:
      "Pure-CSS behavioral primitives, WebGPU-accelerated effects, spatial and time-aware CSS, and layout-intent APIs — long-horizon research.",
  },
  {
    id: "PF-047",
    title: "Catalog direction decision",
    status: "planned",
    category: "product",
    description:
      "The documented product decision: the current accretive path (the catalog keeps growing) vs. the LABS-28 cut proposal. Must be recorded before further V2 investment.",
  },

  // ── Shipped — recent highlights ───────────────────────────────────────
  {
    id: "PF-001",
    title: "Auth on mutating endpoints",
    status: "shipped",
    category: "backend",
    description:
      "requireAuth + API-key middleware protect the mutating endpoints across 30 modules, verified by a dedicated integration sweep; the per-org role-check half on org-scoped resources is tracked as the item's open residual.",
  },
  {
    id: "PF-002",
    title: "API key management",
    status: "shipped",
    category: "backend",
    description:
      "Scoped API keys for CLI/SDK/MCP use — bcrypt-hashed at rest, X-API-Key auth alternating with Bearer JWT, one-time plaintext reveal, revocation, per-key rate limits.",
  },
  {
    id: "PF-005",
    title: "LTS, SLA + governance docs",
    status: "shipped",
    category: "governance",
    description:
      "The full governance pack: LTS windows, support SLAs, security policy, semver + deprecation rules, the RFC process, and the first retrospective RFC.",
  },
  {
    id: "PF-006",
    title: "CI performance + bundle-size gates",
    status: "shipped",
    category: "ci",
    description:
      "Lighthouse CI, size-limit, a 12-metric performance budget, and the coverage floor now gate every PR.",
  },
  {
    id: "PF-009",
    title: "backend-node hardening batch",
    status: "shipped",
    category: "backend",
    description:
      "Registry single source of truth, generated OpenAPI 3.1 with a drift gate, tiered rate limiting behind a swappable interface, audit logging on mutations, a job queue, and readiness + route metrics.",
  },
  {
    id: "PF-011",
    title: "Email lifecycle",
    status: "shipped",
    category: "backend",
    description:
      "Email verification, password reset, refresh-token rotation + revocation, logout-all, and account export/delete — running on a mock transport until the production mail key lands (a launch milestone below).",
  },
  {
    id: "PF-012",
    title: "Honest demo labels",
    status: "shipped",
    category: "frontend",
    description:
      "Every product card reads its Live/Sync/Demo badge from a single module-status registry, so mock surfaces are labeled — never implied.",
  },
  {
    id: "PF-013",
    title: "Public API surface + stability gate",
    status: "shipped",
    category: "docs",
    description:
      "API.md documents every route, and a committed api-surface snapshot fails any PR that removes a stable route or weakens its auth without a major-version bump.",
  },
  {
    id: "PF-015",
    title: "Codemod library",
    status: "shipped",
    category: "tooling",
    description:
      "Inbound codemods from Tailwind, Bootstrap, Animate.css, MUI, and Chakra; outbound to vanilla CSS; a `roycss migrate` CLI — pinned by 136 fixture tests.",
  },
  {
    id: "PF-016",
    title: "First-party build plugins",
    status: "shipped",
    category: "tooling",
    description:
      "All 8 bundler plugins (Vite, Next.js, Astro, webpack, Turbopack, esbuild, Rollup, Rspack) on one shared scan/extract engine, covered by 85 tests. Publishing the packages to npm is an owner milestone.",
  },
  {
    id: "PF-048",
    title: "Favorites + collections backend",
    status: "shipped",
    category: "backend",
    description:
      "Ten authenticated, Zod-validated, owner-scoped, audit-logged routes for favorites and collections. The UI still persists locally — switching it to these endpoints is the open follow-up.",
  },
  {
    id: "PF-049",
    title: "Snapshot freshness gate",
    status: "shipped",
    category: "tooling",
    description:
      "The dist/, mcp-server/, and cli/ snapshots all agree with the live effect catalog, pinned by snapshot-freshness tests.",
  },
];

/**
 * Owner-only launch milestones — not engineering features. These require
 * account access the maintainers cannot delegate (npm org, Vercel
 * dashboard, domain registrar, production secrets); each links to its
 * tracking issue. See docs/OWNER-RUNBOOK.md for the step-by-step runbooks.
 */
export const LAUNCH_MILESTONES: LaunchMilestone[] = [
  {
    id: "LM-01",
    title: "Production redeploy",
    issue: 75,
    description:
      "The public site serves a pre-fix build: the Actions billing block + Vercel deploy protection must be cleared so the verified main branch actually ships.",
  },
  {
    id: "LM-02",
    title: "Publish roycss v2.0.0 to npm",
    issue: 134,
    description:
      "The tarball is empirically verified (zero runtime deps, proven consumer install without --ignore-scripts); needs the npmjs org and an NPM_TOKEN secret.",
  },
  {
    id: "LM-03",
    title: "Vercel storage reclaim",
    issue: 135,
    description:
      "Roughly 11GB of retained deployments from the pre-slimming era — a ten-minute bulk-delete + cache-clear per the runbook in docs/OWNER-RUNBOOK.md.",
  },
  {
    id: "LM-04",
    title: "Canonical domain decision",
    issue: 113,
    description:
      "Pick the production domain, unify metadata/OG/canonical URLs to one origin, and 301-redirect the other at the edge.",
  },
  {
    id: "LM-05",
    title: "Production keys",
    issue: 140,
    description:
      "RESEND_API_KEY (real transactional email), SENTRY_DSN (error tracking), PostgreSQL/Redis/S3, and Stripe when billing lands — all env-var toggles, no code changes.",
  },
  {
    id: "LM-06",
    title: "External WCAG 2.2 AA audit + VPAT",
    issue: 139,
    description:
      "Contract a third-party auditor and publish the VPAT 2.4 — the external half of PF-004 (the code half shipped).",
  },
  {
    id: "LM-07",
    title: "security@roycss.dev mailbox + PGP key",
    issue: 137,
    description:
      "Provision the security mailbox and publish the PGP key that SECURITY-SLA.md already promises; GitHub Security Advisories cover the interim.",
  },
];

/** Grouped views used by the page (order = render order). */
export const inProgressItems = ROADMAP_ITEMS.filter(
  (item) => item.status === "in-progress",
);
export const plannedItems = ROADMAP_ITEMS.filter(
  (item) => item.status === "planned",
);
export const shippedItems = ROADMAP_ITEMS.filter(
  (item) => item.status === "shipped",
);
