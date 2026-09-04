/**
 * API.md generator — emits the public API reference at the repo root from
 * the live route table (see scripts/lib/walk-routes.ts) plus the curated
 * metadata in this file (domain grouping, module blurbs, auth/persistence
 * policy, frontend contracts).
 *
 * Everything in API.md is reproducible:
 *
 *   cd backend-node
 *   bun run api:gen            # writes ../API.md
 *   bun run api:check          # verifies API.md ↔ code (drift gate)
 *
 * Route inventory (method/path/request envelope/auth) is derived from
 * `src/server/app.ts` + each `src/modules/<m>/routes.ts` — NEVER
 * hand-edit those cells in API.md; fix the code or this generator instead.
 */
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  REPO_ROOT,
  schemaFields,
  walkBackendRoutes,
  walkFrontendRoutes,
  type BackendRouteInfo,
} from "./lib/walk-routes.js";

// ─── Curated metadata ─────────────────────────────────────────────────────
// Domain grouping + one-line blurbs. Keys must cover every mounted module
// exactly once — the generator asserts this.

interface Domain {
  title: string;
  anchor: string;
  blurb: string;
  modules: string[];
}

const DOMAINS: Domain[] = [
  {
    title: "Platform core & registry",
    anchor: "domain-core",
    blurb:
      "Catalog + registry reads that power the docs site, the package, and the integrations.",
    modules: [
      "health",
      "effects",
      "recipes",
      "patterns",
      "pro-components",
      "motion",
      "icons",
      "blocks",
      "blueprints",
      "themes",
      "registry",
      "version",
      "search",
      "fallback",
    ],
  },
  {
    title: "Auth & messaging",
    anchor: "domain-auth",
    blurb: "Account lifecycle (JWT) and the contact intake form.",
    modules: ["auth", "contact"],
  },
  {
    title: "Modern-CSS devtools",
    anchor: "domain-devtools",
    blurb:
      "Stateless generators/analyzers for modern CSS features — POST bodies in, CSS or diagnostics out.",
    modules: [
      "devtools",
      "inspector",
      "color-space",
      "style-query",
      "scope",
      "subgrid",
      "logical-properties",
      "initial-letter",
      "text-wrap",
      "property-registrar",
      "relative-color",
      "starting-style",
      "light-dark",
    ],
  },
  {
    title: "AI & code intelligence",
    anchor: "domain-ai",
    blurb:
      "AI-assisted generation, review, auditing, profiling and simulation surfaces (LLM-backed or deterministic).",
    modules: [
      "architect",
      "review",
      "refactor",
      "designer",
      "scaffold",
      "generator",
      "pair",
      "mentor",
      "digital-twin",
      "preview",
      "studio",
      "sync",
      "profiler",
      "benchmark",
      "bundle",
      "audit-center",
      "compliance",
      "accessibility",
    ],
  },
  {
    title: "Community & learning",
    anchor: "domain-community",
    blurb:
      "Academy, challenges, certifications, open-source program, showcase, marketplace and plugins.",
    modules: [
      "academy",
      "challenges",
      "certifications",
      "open",
      "spotlight",
      "marketplace",
      "plugin-hub",
    ],
  },
  {
    title: "Infrastructure & operations",
    anchor: "domain-infra",
    blurb:
      "Cloud, deploys, CDN/edge/storage, fleet, workspace, enterprise, governance, analytics, observatory, RoyOS, live sessions and the MCP hub.",
    modules: [
      "cloud",
      "deploy",
      "cdn",
      "storage",
      "edge",
      "fleet",
      "workspace",
      "enterprise",
      "governance",
      "analytics",
      "observatory",
      "os",
      "live",
      "mcp",
    ],
  },
];

const MODULE_BLURBS: Record<string, string> = {
  health: "Liveness probe — DB connectivity, uptime, memory (mounted before the rate limiter).",
  effects: "Effect catalog — list/search/filter the packaged effects (from `dist/effects.json`).",
  recipes: "Curated recipe collection (list + detail).",
  patterns: "Pattern library (list + detail).",
  "pro-components": "Pro component catalog + per-component source code.",
  motion: "Motion library — motion effects, presets, categories.",
  icons: "Icon catalog with categories and per-icon lookup.",
  blocks: "Layout block library (Prisma-backed catalog + create).",
  blueprints: "Industry architecture blueprints (list, detail, architecture, industries).",
  themes: "Theme token store — Prisma CRUD, 10 seeded presets.",
  registry: "Package registry — packages, versions, publish.",
  version: "Release metadata — current, latest, changelog, breaking changes, upgrade check.",
  search: "Cross-resource search over effects/recipes/patterns (Prisma `SearchIndex`).",
  fallback: "`@supports` fallback recipes for modern CSS features.",
  auth: "JWT account lifecycle — register / login / refresh / me (bcrypt + Prisma `User`).",
  contact: "Contact form intake (Prisma `ContactMessage`; 5 submissions/min/IP).",
  devtools: "CSS introspection — class inspection, design tokens, utilities, CSS analysis.",
  inspector: "CSS lint — 8 correctness/a11y rules with line-precise findings (read-only).",
  "color-space": "Color conversion + gamut mapping (OKLCH, sRGB, Display P3).",
  "style-query": "Container/style-query (`@container`) generator.",
  scope: "`@scope` rule analysis + generation.",
  subgrid: "CSS subgrid layout generator.",
  "logical-properties": "Physical ↔ logical property mapping and conversion.",
  "initial-letter": "`initial-letter` drop-cap generator.",
  "text-wrap": "`text-wrap: balance/pretty` analysis.",
  "property-registrar": "`@property` at-rule registration generator.",
  "relative-color": "Relative color syntax derivation (`oklch from …`).",
  "starting-style": "`@starting-style` transition-entry generator.",
  "light-dark": "`light-dark()` color-pair generator.",
  architect: "AI architecture generator — templates and generated results.",
  review: "AI code review — rules, results, history.",
  refactor: "CSS refactoring — transforms, framework list, results.",
  designer: "AI design generator — presets and results.",
  scaffold: "Project scaffolding — scaffold types and frameworks.",
  generator: "Code/config generator — generator types and templates.",
  pair: "AI pair-programming chat — history and suggestions.",
  mentor: "AI mentor — chat, topics, progress, levels.",
  "digital-twin": "Site simulation — create runs, results, simulations.",
  preview: "Preview branches — create, list, detail, delete (Prisma).",
  studio: "Project studio — projects CRUD + templates (Prisma).",
  sync: "Design-token sync — Figma/GitHub/token imports + history.",
  profiler: "Performance profiler — start runs, results, metrics.",
  benchmark: "Runtime benchmarks — run, results, comparisons.",
  bundle: "CSS bundle analysis — duplicates, dead CSS, results.",
  "audit-center": "Aggregated audits — projects, issues, trends.",
  compliance: "Standards compliance scans — standards, results, reports.",
  accessibility: "Accessibility checks — page audit, rules, contrast, scan.",
  academy: "Learning paths + lesson progress (Prisma).",
  challenges: "Coding challenges, submissions, leaderboard.",
  certifications: "Certification exams + credential verification.",
  open: "Open-source program — issues, RFCs (+ voting), roadmap, contributors.",
  spotlight: "Community showcase — featured, items, submit, weekly.",
  marketplace: "Template marketplace — list, detail, publish, reviews.",
  "plugin-hub": "Plugin registry — plugins, categories, changelog (mounted at `/plugins`).",
  cloud: "Roy Cloud projects + deployments (Prisma).",
  deploy: "Deployment orchestration — create, history, platforms, environments.",
  cdn: "CDN stats, resources, edges, cache purge.",
  storage: "File storage — list, upload, delete, usage.",
  edge: "Edge compute — regions, config, deploy, performance.",
  fleet: "Project fleet health + scanning.",
  workspace: "Team workspace — resources, team, invites.",
  enterprise: "Organizations, teams, licenses, audit log.",
  governance: "Approval workflow — approve/reject, policies, audit log.",
  analytics: "Platform analytics — overview, effects, traffic, devices.",
  observatory: "Site observability — sites, alerts, trends.",
  os: "RoyOS dashboard — products, activity, quick actions.",
  live: "Live collaboration sessions + messages (Prisma).",
  mcp: "MCP tool hub — tools, execute, resources, prompts.",
};

/** Prisma models backing each persisted module (for the auth-planning note). */
const MODULE_MODELS: Record<string, string> = {
  academy: "LearningPath, PathProgress",
  analytics: "User (read-only)",
  "audit-center": "AuditProject, AuditResult",
  auth: "User",
  benchmark: "BenchmarkResult",
  blocks: "Block",
  blueprints: "Blueprint",
  bundle: "BundleResult",
  certifications: "Certification, CertificationAttempt",
  challenges: "Challenge, ChallengeSubmission",
  cloud: "CloudProject, Deployment",
  compliance: "ComplianceStandard, ComplianceScan",
  contact: "ContactMessage",
  deploy: "Deployment",
  enterprise: "Organization, Team, License, EnterpriseAuditLog",
  fleet: "FleetProject",
  governance: "GovernancePolicy, GovernanceApproval",
  live: "LiveSession, LiveMessage",
  marketplace: "Template, TemplateReview",
  observatory: "ObservatorySite",
  open: "GoodFirstIssue, RFC, Roadmap, Contributor",
  os: "OSDashboard",
  preview: "PreviewBranch",
  profiler: "ProfilerResult",
  search: "SearchIndex",
  spotlight: "SpotlightItem",
  studio: "StudioProject",
  themes: "Theme",
  workspace: "WorkspaceResource",
};

/**
 * Mutating endpoints that stay public BY DESIGN (form intake / token
 * bootstrap) — excluded from the "→ Bearer JWT (#64)" annotation.
 */
const PUBLIC_MUTATIONS = new Set<string>([
  "POST /api/v1/auth/register",
  "POST /api/v1/auth/login",
  "POST /api/v1/auth/refresh",
  "POST /api/v1/contact",
]);

/** Hand-curated response cells for routes with non-standard payloads. */
const RESPONSE_OVERRIDES: Record<string, string> = {
  "GET /api/v1":
    "`{ name, version, endpoints }` · 200 — static route catalog (see note below)",
  "GET /api/v1/health":
    "`{ status, service, version, uptime, time, checks }` · 200 · **503 degraded** when the DB is down",
  "POST /api/v1/auth/register":
    "`{ data: { user, accessToken, refreshToken, expiresIn } }` · 201",
  "POST /api/v1/auth/login":
    "`{ data: { user, accessToken, refreshToken, expiresIn } }` · 200",
  "POST /api/v1/auth/refresh":
    "`{ data: { user, accessToken, refreshToken, expiresIn } }` · 200",
  "GET /api/v1/auth/me": "`{ data: user }` · 200",
  "POST /api/v1/contact": "`{ ok, message, id }` · 201 — non-envelope",
};

/** Hand-curated error cells (codes beyond the derived defaults). */
const ERROR_OVERRIDES: Record<string, string> = {
  "GET /api/v1/health": "503",
  "POST /api/v1/auth/register": "400 · 409 · 429",
  "POST /api/v1/auth/login": "400 · 401 · 429",
  "POST /api/v1/auth/refresh": "400 · 401 · 429",
  "GET /api/v1/auth/me": "401",
  "POST /api/v1/contact": "400 · 429 · 503",
  "GET /api/v1/search": "400",
};

/** Hand-curated request cells (manual validation / composed schemas). */
const REQUEST_OVERRIDES: Record<string, string> = {
  // Manually validated in the handler (no Zod schema).
  "GET /api/v1/search": "query: { `q` (required), `limit?`, `types?` } — manually validated",
  // z.object().refine() — cross-field constraint the walker can't infer.
  "POST /api/v1/cdn/purge":
    "body: { `paths?`, `all?` } — refine: `paths` non-empty **or** `all: true` required",
  // CreateX.partial() — all fields optional (composition, not a plain
  // z.object literal, so the schema walker cannot extract them).
  "PUT /api/v1/themes/:id":
    "body: { `name?`, `primary?`, `secondary?`, `accent?`, `background?`, `foreground?`, `tokens?` } — partial update",
  "PUT /api/v1/studio/projects/:id":
    "body: partial `UpdateStudioProjectSchema` — all fields optional",
};

/** Module note overrides (auth/ping semantics that differ from the default). */
const MODULE_NOTE_OVERRIDES: Record<string, string> = {
  health:
    "> Read-only DB connectivity probe (`pingDatabase`) — mounted **before** " +
    "the global rate limiter so it never throttles.",
  auth:
    "> Prisma-backed (`User`). register/login/refresh stay public by design " +
    "(token bootstrap, 10/min/IP); only `GET /me` requires a Bearer token.",
  contact:
    "> Prisma-backed (`ContactMessage`). The POST stays public by design — " +
    "anonymous form intake (rate-limited 5/min/IP).",
};

// ─── Row rendering ────────────────────────────────────────────────────────

function requestCell(r: BackendRouteInfo): string {
  const override = REQUEST_OVERRIDES[`${r.method} ${r.path}`];
  if (override) return override;
  const parts: string[] = [];
  if (r.bodySchema) {
    const fields = schemaFields(r.module, r.bodySchema);
    parts.push(
      fields
        ? `body: { ${fields.map((f) => `\`${f.key}${f.optional ? "?" : ""}\``).join(", ")} }`
        : `body: \`${r.bodySchema}\``,
    );
  }
  if (r.querySchema) {
    const fields = schemaFields(r.module, r.querySchema);
    parts.push(
      fields
        ? `query: { ${fields.map((f) => `\`${f.key}${f.optional ? "?" : ""}\``).join(", ")} }`
        : `query: \`${r.querySchema}\``,
    );
  }
  if (r.paramsSchema) {
    const fields = schemaFields(r.module, r.paramsSchema);
    parts.push(
      fields
        ? `path: ${fields.map((f) => `\`:${f.key}\``).join(" ")}`
        : `path: \`${r.paramsSchema}\``,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function responseCell(r: BackendRouteInfo): string {
  const override = RESPONSE_OVERRIDES[`${r.method} ${r.path}`];
  if (override) return override;
  switch (r.envelope) {
    case "data":
      return `\`{ data }\` · ${r.successStatus[0] ?? 200}`;
    case "data-meta":
      return `\`{ data, meta }\` · ${r.successStatus[0] ?? 200}`;
    case "empty":
      return "204 — no body";
    default:
      return r.customKeys.length > 0
        ? `\`{ ${r.customKeys.join(", ")} }\` · ${r.successStatus[0] ?? 200}`
        : "see handler";
  }
}

function authCell(r: BackendRouteInfo): string {
  const key = `${r.method} ${r.path}`;
  if (r.auth === "required") return "Bearer JWT";
  if (r.auth === "optional") return "Public (Bearer optional)";
  if (PUBLIC_MUTATIONS.has(key)) return "Public";
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(r.method);
  if (mutating && r.persisted) return "Public → Bearer JWT *(#64)*";
  return "Public";
}

function errorsCell(r: BackendRouteInfo): string {
  const override = ERROR_OVERRIDES[`${r.method} ${r.path}`];
  if (override) return override;
  const codes: string[] = [];
  if (r.bodySchema || r.querySchema || r.paramsSchema) codes.push("400");
  if (r.path.includes(":")) codes.push("404");
  if (r.auth === "required") codes.push("401");
  if (r.rateLimiter) codes.push("429");
  return codes.length > 0 ? codes.join(" · ") : "—";
}

function routeRow(r: BackendRouteInfo): string {
  return (
    `| ${r.method} | \`${r.path}\` | ${authCell(r)} | ${requestCell(r)} | ` +
    `${responseCell(r)} | ${errorsCell(r)} |`
  );
}

const TABLE_HEADER =
  "| Method | Path | Auth | Request | Response | Errors |\n" +
  "|--------|------|------|---------|----------|--------|";

// ─── Document assembly ────────────────────────────────────────────────────

function moduleSection(routes: BackendRouteInfo[], mount: string): string {
  const modRoutes = routes.filter((r) => r.module === mount);
  if (modRoutes.length === 0) return "";
  const blurb = MODULE_BLURBS[mount] ?? "";
  const models = MODULE_MODELS[mount];
  const persisted = modRoutes.some((r) => r.persisted);
  // Heading shows the mounted path segment (plugin-hub mounts at /plugins).
  const mountSeg = modRoutes[0]?.path.split("/")[3] ?? mount;

  const lines: string[] = [];
  lines.push(`#### \`${mountSeg}\` — ${blurb}`);
  lines.push("");
  const noteOverride = MODULE_NOTE_OVERRIDES[mount];
  const hasMutations = modRoutes.some((r) =>
    ["POST", "PUT", "PATCH", "DELETE"].includes(r.method),
  );
  if (noteOverride) {
    lines.push(noteOverride);
  } else if (models) {
    if (hasMutations) {
      lines.push(
        `> Prisma-backed (${models}). Mutating routes are annotated ` +
          `"Public → Bearer JWT *(#64)*" — they become authenticated when ` +
          "issue #64 (requireAuth rollout) lands.",
      );
    } else {
      lines.push(
        `> Prisma-backed (${models}) — read-only surface (no mutating routes).`,
      );
    }
  } else if (persisted) {
    lines.push("> Prisma-backed module (see `service.ts`).");
  } else if (hasMutations) {
    lines.push(
      "> No durable persistence — POST output is computed in-process; where " +
        "an id is returned it is retrievable only for the process lifetime " +
        "(reset on restart). No auth planned (no durable data).",
    );
  } else {
    lines.push(
      "> Stateless — no persistence; safe to call unauthenticated.",
    );
  }
  const limiters = new Set(
    modRoutes.map((r) => r.rateLimiter).filter((x) => x !== undefined),
  );
  if (limiters.has("auth")) {
    lines.push(
      "> Extra rate limit: **auth 10/min/IP** on register/login/refresh.",
    );
  }
  if (limiters.has("contact")) {
    lines.push("> Extra rate limit: **contact 5/min/IP**.");
  }
  lines.push("");
  lines.push(TABLE_HEADER);
  for (const r of modRoutes) lines.push(routeRow(r));
  lines.push("");
  return lines.join("\n");
}

function frontendSection(): string {
  // Hand-curated contracts (10 route files under src/app/api — the walker
  // only verifies method+path coverage; the semantics below were read
  // from each route.ts).
  return `
### Frontend API routes (\`src/app/api\`)

Served by the Next.js app itself (not proxied unless noted). The browser
talks to these same-origin paths only — the CSP pins \`connect-src 'self'\`.

${TABLE_HEADER}
| GET | \`/api/health\` | Public | — | \`{ status, effectsCount, dbStatus, backendStatus, timestamp, version }\` · 200 | — (always 200; \`status: "degraded"\` when the backend probe fails) |
| ANY | \`/api/v1/*\` | passthrough | forwarded body/headers | backend response passthrough · 503 \`{ error: { code: "BACKEND_UNAVAILABLE" } }\` | backend codes · 503 |
| GET | \`/api/contact\` | Public | — | \`{ ok, message }\` · 200 (usage hint) | — |
| POST | \`/api/contact\` | Public | body: { \`name\`, \`email\`, \`subject?\`, \`message\` } (message ≥ 10 chars; truncated to 120/160/160/5000) | \`{ ok, message }\` · 200 | 400 · 503 (DB write) · 500 |
| POST | \`/api/auth/register\` | Public | body: { \`email\`, \`password\`, \`name?\` } | \`{ data: user }\` · 200 + sets httpOnly cookies | 400 · 409 · 429 · 500 |
| POST | \`/api/auth/login\` | Public | body: { \`email\`, \`password\` } | \`{ data: user }\` · 200 + sets httpOnly cookies | 400 · 401 · 429 · 500 |
| POST | \`/api/auth/logout\` | Public | — | \`{ data: { ok: true } }\` · 200 (clears cookies) | — |
| POST | \`/api/auth/refresh\` | cookie | reads refresh cookie | \`{ data: { ok: true } }\` · 200 + rotated cookies | 401 · 500 |
| GET | \`/api/auth/me\` | cookie | reads access cookie (one refresh+retry on 401) | \`{ data: user }\` · 200 | 401 |
| POST | \`/api/ai-playground\` | Public | body: { \`prompt\` } (≤ 500 chars) | \`{ css, prompt }\` · 200 | 400 · 500 |
| POST | \`/api/ai-migration\` | Public | body: { \`css\` (≤ 10 000 chars), \`framework?\` } | \`{ css, framework }\` · 200 | 400 · 500 |
| POST | \`/api/css-doctor\` | Public | body: { \`css\` (≤ 10 000 chars) } | \`{ score, issues[], summary }\` · 200 | 400 · 500 |
| GET | \`/api/effects/manifest\` | Public | — | \`{ count, effects[] }\` · 200 (metadata only, no \`cssCode\`; 24 h cache) | — |
| GET | \`/api/effects/:id/css\` | Public | path: \`:id\` | \`text/css\` (the effect's \`cssCode\`) · 200 · 404 | 404 |
| GET | \`/api/og\` | Public | — | \`image/png\` (static \`public/og.png\`) · 200 | 404 |

Notes:

- **\`/api/v1/*\` proxy** (\`src/app/api/v1/[...path]/route.ts\`): forwards
  \`GET/POST/PUT/PATCH/DELETE/OPTIONS\` to \`${"BACKEND_URL"}\` (default
  \`http://localhost:4000\`), passing through the \`Authorization\` header,
  cookies, request body, response status, \`Content-Type\` and
  \`Cache-Control\`. When the backend is unreachable it returns
  503 \`{ error: { code: "BACKEND_UNAVAILABLE", message } }\`.
- **Auth cookies**: \`roycss-access\` (15 min) and \`roycss-refresh\`
  (30 days) — httpOnly, \`sameSite=lax\`, \`secure\` in production. The
  register/login/refresh/logout/me routes are a cookie shim over the
  backend's JWT endpoints (\`src/lib/auth-client.ts\`).
- **\`/api/contact\`** writes to the *frontend* Prisma
  (\`ContactMessage\` model, root \`prisma/schema.prisma\`) — distinct from
  the backend's \`POST /api/v1/contact\`. No rate limiter on the frontend
  copy; the backend copy is limited to 5/min/IP.
- **AI routes** (\`ai-playground\`, \`ai-migration\`, \`css-doctor\`) call
  the ZAI LLM SDK (\`z-ai-web-dev-sdk\`), \`maxDuration\` 30 s, and return
  \`{ error: string }\` on failure.
`;
}

function generate(): string {
  const routes = walkBackendRoutes();
  const frontend = walkFrontendRoutes();

  // Sanity: every module documented exactly once across the domains.
  const grouped = DOMAINS.flatMap((d) => d.modules);
  const mounted = [...new Set(routes.map((r) => r.module).filter((m) => m !== "(root)"))];
  const missingBlurb = mounted.filter((m) => !MODULE_BLURBS[m]);
  const dupes = grouped.filter(
    (m, i) => grouped.indexOf(m) !== i,
  );
  if (grouped.length !== mounted.length || missingBlurb.length > 0 || dupes.length > 0) {
    throw new Error(
      `Domain grouping is out of sync with app.ts mounts:\n` +
        `  grouped=${grouped.length} mounted=${mounted.length}\n` +
        `  missing blurbs: ${missingBlurb.join(", ") || "none"}\n` +
        `  duplicate entries: ${dupes.join(", ") || "none"}`,
    );
  }

  const methodCount = (m: string) =>
    routes.filter((r) => r.method === m).length;

  const out: string[] = [];
  out.push("# RoyCSS Public API Reference");
  out.push("");
  out.push(
    `The public HTTP surface of the platform: the Express backend ` +
      `(\`/api/v1/*\`, \`backend-node/\`) and the Next.js frontend routes ` +
      `(\`/api/*\`, \`src/app/api/\`).`,
  );
  out.push("");
  out.push(
    `**Coverage:** ${mounted.length} backend modules · ` +
      `${routes.length} backend routes (GET ${methodCount("GET")}, ` +
      `POST ${methodCount("POST")}, PUT ${methodCount("PUT")}, ` +
      `DELETE ${methodCount("DELETE")}) · ` +
      `${new Set(frontend.map((r) => r.path)).size} frontend endpoints.`,
  );
  out.push("");
  out.push(
    "> **Drift gate:** \`cd backend-node && bun run api:check\` walks " +
      "\`src/server/app.ts\`, every module's \`routes.ts\` and " +
      "\`src/app/api/**\` and fails when a route here is missing or stale. " +
      "Regenerate the tables with \`bun run api:gen\` (curated prose lives " +
      "in \`backend-node/scripts/gen-api-md.ts\` — edit there, not in API.md).",
  );
  out.push("");
  out.push("## Contents");
  out.push("");
  out.push("- [Conventions](#conventions) — base URLs, envelope, errors, auth, rate limits, pagination");
  out.push("- [Backend modules](#backend-modules) — grouped by domain");
  for (const d of DOMAINS) {
    out.push(`  - [${d.title}](#${d.anchor})`);
  }
  out.push("- [Frontend routes (Next.js)](#frontend-routes-nextjs)");
  out.push("");
  out.push("## Conventions");
  out.push("");
  out.push("### Base URLs");
  out.push("");
  out.push("| Deployment | Base URL | Notes |");
  out.push("|------------|----------|-------|");
  out.push("| Local backend (direct) | `http://localhost:4000/api/v1` | Express, port from \`PORT\` |");
  out.push("| Local via Next proxy | `http://localhost:3000/api/v1` | same-origin proxy → backend |");
  out.push("| Production | `https://<backend-host>/api/v1` | Render blueprint (\`render.yaml\`) |");
  out.push("");
  out.push("### Response envelope");
  out.push("");
  out.push("Every backend module (except the noted non-envelope routes) returns:");
  out.push("");
  out.push("```jsonc");
  out.push("// collection");
  out.push('{ "data": [ /* items */ ], "meta": { /* page, limit, total, totalPages | count */ } }');
  out.push("// single resource");
  out.push('{ "data": { /* resource */ } }');
  out.push("```");
  out.push("");
  out.push("Errors always use one shape (see the [error codes](#error-codes) table):");
  out.push("");
  out.push("```jsonc");
  out.push('{');
  out.push('  "error": { "code": "NOT_FOUND", "message": "Resource not found", "details": [ /* optional */ ] },');
  out.push('  "requestId": "req_abc123"');
  out.push("}");
  out.push("```");
  out.push("");
  out.push("### Error codes");
  out.push("");
  out.push("| HTTP | `error.code` | Thrown when |");
  out.push("|------|--------------|-------------|");
  out.push("| 400 | `VALIDATION_ERROR` | Zod validation failed (body/query/params). `details[]` carries `{ target, path, message, code }` per field |");
  out.push("| 400 | `BAD_REQUEST` | Malformed input outside schema validation |");
  out.push("| 401 | `UNAUTHORIZED` | Missing, malformed or invalid `Authorization: Bearer` token |");
  out.push("| 403 | `FORBIDDEN` | Authenticated but not permitted |");
  out.push("| 404 | `NOT_FOUND` | Unknown route **or** missing resource id |");
  out.push("| 409 | `CONFLICT` | Duplicate record (e.g. email already registered — Prisma `P2002`) |");
  out.push("| 429 | `RATE_LIMITED` | Sliding-window rate limit exceeded |");
  out.push("| 500 | `INTERNAL_ERROR` | Unexpected failure (message + stack redacted in production) |");
  out.push("| 503 | `SERVICE_UNAVAILABLE` | `/health` with the DB down; contact DB write failure |");
  out.push("");
  out.push("### Auth");
  out.push("");
  out.push("- **Today** only `GET /api/v1/auth/me` requires " +
      "\`Authorization: Bearer <accessToken>\`. Register/login/refresh are " +
      "public (rate-limited) token-bootstrap endpoints.");
  out.push(
    "- **Planned (issue #64):** mutating endpoints (POST/PUT/PATCH/DELETE) " +
      "on Prisma-backed modules gain \`requireAuth\`. They are annotated " +
      "`\`Public → Bearer JWT *(#64)*\`` per row below; the errors column " +
      "documents today's behavior.",
  );
  out.push(
    "- **Tokens:** \`POST /auth/register|login|refresh\` return " +
      "`{ user, accessToken (15 min), refreshToken (7 days), expiresIn }` " +
      "(JWT, HS256, issuer `roycss-backend`, audience `roycss-client`).",
  );
  out.push(
    "- **Browser flow:** the frontend wraps these in httpOnly cookies " +
      "(\`roycss-access\` / \`roycss-refresh\`) via \`/api/auth/*\` — see " +
      "[Frontend routes](#frontend-routes-nextjs).",
  );
  out.push("");
  out.push("### Rate limits (per IP, sliding window)");
  out.push("");
  out.push("| Scope | Limit | Applies to | Env override |");
  out.push("|-------|-------|------------|--------------|");
  out.push("| general | 100 / min | every `/api/v1` route **except** `/health` | `RATE_LIMIT_MAX_GENERAL` |");
  out.push("| auth | 10 / min | `/auth/register`, `/auth/login`, `/auth/refresh` | `RATE_LIMIT_MAX_AUTH` |");
  out.push("| contact | 5 / min | `/api/v1/contact` | `RATE_LIMIT_MAX_CONTACT` |");
  out.push("");
  out.push(
    "Window via \`RATE_LIMIT_WINDOW_MS\` (60 s). Responses carry " +
      "\`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, " +
      "\`X-RateLimit-Reset\` and \`Retry-After\` (on 429).",
  );
  out.push("");
  out.push("### Pagination");
  out.push("");
  out.push(
    "List endpoints accept \`page\` (default 1) and \`limit\` " +
      "(default 24, max 200) and return " +
      "\`meta: { page, limit, total, totalPages }\`. Single-resource " +
      "responses omit \`meta\`.",
  );
  out.push("");
  out.push("### Request size / CORS");
  out.push("");
  out.push("- JSON bodies are capped at **256 kB**.");
  out.push(
    "- CORS: allowed origins from \`CORS_ORIGINS\` + localhost in dev; " +
      "methods GET/POST/PUT/PATCH/DELETE/OPTIONS; credentials enabled; " +
      "\`X-Request-Id\` exposed on every response.",
  );
  out.push("");
  out.push("## Backend modules");
  out.push("");

  // Root info endpoint (not part of any module).
  const rootRoute = routes.find((r) => r.module === "(root)");
  if (rootRoute) {
    out.push(
      "**API root** — index endpoint; returns a **static** route catalog " +
        "compiled into `src/server/app.ts` (informational only — known to " +
        "lag the real router, see the appendix).",
    );
    out.push("");
    out.push(TABLE_HEADER);
    out.push(routeRow(rootRoute));
    out.push("");
  }


  for (const domain of DOMAINS) {
    out.push(`### ${domain.title}`);
    out.push("");
    out.push(`${domain.blurb}`);
    out.push("");
    for (const mod of domain.modules) {
      out.push(moduleSection(routes, mod));
    }
  }

  out.push("## Frontend routes (Next.js)");
  out.push(frontendSection());

  out.push("## Appendix — caveats");
  out.push("");
  out.push(
    "- \`GET /api/v1\` returns a **static** route catalog compiled into " +
      "`\`src/server/app.ts\`. It is informational and can lag behind the " +
      "real router (e.g. it lists planned-but-unbuilt \`inspector/classes\` " +
      "and \`inspector/scan\` routes). Trust this document and " +
      "\`bun run api:check\`, not that payload.",
  );
  out.push(
    "- Seed data: Prisma-backed modules seed demo records on first " +
      "access (e.g. 10 themes, 4 cloud projects) — safe to browse " +
      "anonymously, reset via \`prisma db push\`.",
  );
  out.push(
    "- \`GET /api/v1/inspector/*\` is read-only linting; the " +
      "\`inspector/classes\`/\`scan\` endpoints listed by the root catalog " +
      "were a planned surface that never shipped (see #57).",
  );
  out.push("");

  return out.join("\n");
}

// ─── CLI ──────────────────────────────────────────────────────────────────

const arg = process.argv[2];
const target = arg ? resolve(arg) : join(REPO_ROOT, "API.md");
const doc = generate();
writeFileSync(target, doc, "utf8");
const lines = doc.split("\n").length;
console.log(`Wrote ${target} (${lines} lines)`);
