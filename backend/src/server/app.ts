/**
 * Express app factory — wires all middleware and routes.
 *
 * Kept separate from `src/index.ts` so the app can be imported in
 * tests without starting the HTTP server.
 */
import express, { type Express } from "express";
import helmet from "helmet";

import { API_PREFIX } from "../config/constants.js";
import { accessibilityRouter } from "../modules/accessibility/routes.js";
import { academyRouter } from "../modules/academy/routes.js";
import { analyticsRouter } from "../modules/analytics/routes.js";
import { architectRouter } from "../modules/architect/routes.js";
import { auditCenterRouter } from "../modules/audit-center/routes.js";
import { authRouter } from "../modules/auth/routes.js";
import { benchmarkRouter } from "../modules/benchmark/routes.js";
import { blocksRouter } from "../modules/blocks/routes.js";
import { blueprintsRouter } from "../modules/blueprints/routes.js";
import { bundleRouter } from "../modules/bundle/routes.js";
import { cdnRouter } from "../modules/cdn/routes.js";
import { certificationsRouter } from "../modules/certifications/routes.js";
import { challengesRouter } from "../modules/challenges/routes.js";
import { cloudRouter } from "../modules/cloud/routes.js";
import { colorSpaceRouter } from "../modules/color-space/routes.js";
import { complianceRouter } from "../modules/compliance/routes.js";
import { contactRouter } from "../modules/contact/routes.js";
import { deployRouter } from "../modules/deploy/routes.js";
import { designerRouter } from "../modules/designer/routes.js";
import { devtoolsRouter } from "../modules/devtools/routes.js";
import { digitalTwinRouter } from "../modules/digital-twin/routes.js";
import { edgeRouter } from "../modules/edge/routes.js";
import { effectsRouter } from "../modules/effects/routes.js";
import { enterpriseRouter } from "../modules/enterprise/routes.js";
import { fallbackRouter } from "../modules/fallback/routes.js";
import { fleetRouter } from "../modules/fleet/routes.js";
import { generatorRouter } from "../modules/generator/routes.js";
import { governanceRouter } from "../modules/governance/routes.js";
import { healthRouter } from "../modules/health/routes.js";
import { iconsRouter } from "../modules/icons/routes.js";
import { initialLetterRouter } from "../modules/initial-letter/routes.js";
import { inspectorRouter } from "../modules/inspector/routes.js";
import { lightDarkRouter } from "../modules/light-dark/routes.js";
import { liveRouter } from "../modules/live/routes.js";
import { logicalPropertiesRouter } from "../modules/logical-properties/routes.js";
import { marketplaceRouter } from "../modules/marketplace/routes.js";
import { mcpRouter } from "../modules/mcp/routes.js";
import { mentorRouter } from "../modules/mentor/routes.js";
import { motionRouter } from "../modules/motion/routes.js";
import { observatoryRouter } from "../modules/observatory/routes.js";
import { openRouter } from "../modules/open/routes.js";
import { osRouter } from "../modules/os/routes.js";
import { pairRouter } from "../modules/pair/routes.js";
import { patternsRouter } from "../modules/patterns/routes.js";
import { pluginHubRouter } from "../modules/plugin-hub/routes.js";
import { previewRouter } from "../modules/preview/routes.js";
import { proComponentsRouter } from "../modules/pro-components/routes.js";
import { profilerRouter } from "../modules/profiler/routes.js";
import { propertyRegistrarRouter } from "../modules/property-registrar/routes.js";
import { recipesRouter } from "../modules/recipes/routes.js";
import { refactorRouter } from "../modules/refactor/routes.js";
import { registryRouter } from "../modules/registry/routes.js";
import { relativeColorRouter } from "../modules/relative-color/routes.js";
import { reviewRouter } from "../modules/review/routes.js";
import { scaffoldRouter } from "../modules/scaffold/routes.js";
import { scopeRouter } from "../modules/scope/routes.js";
import { searchRouter } from "../modules/search/routes.js";
import { spotlightRouter } from "../modules/spotlight/routes.js";
import { startingStyleRouter } from "../modules/starting-style/routes.js";
import { storageRouter } from "../modules/storage/routes.js";
import { studioRouter } from "../modules/studio/routes.js";
import { styleQueryRouter } from "../modules/style-query/routes.js";
import { subgridRouter } from "../modules/subgrid/routes.js";
import { syncRouter } from "../modules/sync/routes.js";
import { textWrapRouter } from "../modules/text-wrap/routes.js";
import { themesRouter } from "../modules/themes/routes.js";
import { versionRouter } from "../modules/version/routes.js";
import { workspaceRouter } from "../modules/workspace/routes.js";
import { createLogger } from "../lib/logger.js";
import { corsMiddleware } from "./middleware/cors.js";
import { asyncHandler, errorHandler, notFoundHandler } from "./middleware/error.js";
import {
  generalRateLimit,
} from "./middleware/rateLimit.js";
import { requestIdMiddleware, requestLogger } from "./middleware/logging.js";

const log = createLogger("app");

export function createApp(): Express {
  const app = express();

  // ─── Security & parsing ────────────────────────────────────────────────
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ extended: true, limit: "256kb" }));

  // ─── Request identity + logging ────────────────────────────────────────
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // ─── Trust proxy (so req.ip reflects real client behind nginx/caddy) ───
  app.set("trust proxy", 1);

  // ─── Health (mounted BEFORE general rate limit so it never gets throttled)
  app.use(`${API_PREFIX}/health`, healthRouter);

  // ─── Global rate limiter for everything else ───────────────────────────
  app.use(generalRateLimit);

  // ─── Modules ───────────────────────────────────────────────────────────
  app.use(`${API_PREFIX}/effects`, effectsRouter);
  app.use(`${API_PREFIX}/recipes`, recipesRouter);
  app.use(`${API_PREFIX}/patterns`, patternsRouter);
  app.use(`${API_PREFIX}/contact`, contactRouter);
  app.use(`${API_PREFIX}/auth`, authRouter);
  app.use(`${API_PREFIX}/themes`, themesRouter);
  app.use(`${API_PREFIX}/icons`, iconsRouter);
  app.use(`${API_PREFIX}/academy`, academyRouter);
  app.use(`${API_PREFIX}/marketplace`, marketplaceRouter);
  app.use(`${API_PREFIX}/analytics`, analyticsRouter);
  // ── 8 new modules (platform completion) ───────────────────────────────
  app.use(`${API_PREFIX}/cloud`, cloudRouter);
  app.use(`${API_PREFIX}/devtools`, devtoolsRouter);
  app.use(`${API_PREFIX}/motion`, motionRouter);
  app.use(`${API_PREFIX}/enterprise`, enterpriseRouter);
  app.use(`${API_PREFIX}/inspector`, inspectorRouter);
  app.use(`${API_PREFIX}/studio`, studioRouter);
  app.use(`${API_PREFIX}/pro-components`, proComponentsRouter);
  app.use(`${API_PREFIX}/mcp`, mcpRouter);
  // ── 12 batch-2 modules (platform completion) ─────────────────────────
  app.use(`${API_PREFIX}/compliance`, complianceRouter);
  app.use(`${API_PREFIX}/audit-center`, auditCenterRouter);
  app.use(`${API_PREFIX}/fleet`, fleetRouter);
  app.use(`${API_PREFIX}/workspace`, workspaceRouter);
  app.use(`${API_PREFIX}/deploy`, deployRouter);
  app.use(`${API_PREFIX}/preview`, previewRouter);
  app.use(`${API_PREFIX}/cdn`, cdnRouter);
  app.use(`${API_PREFIX}/storage`, storageRouter);
  app.use(`${API_PREFIX}/edge`, edgeRouter);
  app.use(`${API_PREFIX}/mentor`, mentorRouter);
  app.use(`${API_PREFIX}/challenges`, challengesRouter);
  app.use(`${API_PREFIX}/certifications`, certificationsRouter);
  // ── 12 batch-1 modules (platform modules) ────────────────────────────
  app.use(`${API_PREFIX}/accessibility`, accessibilityRouter);
  app.use(`${API_PREFIX}/architect`, architectRouter);
  app.use(`${API_PREFIX}/review`, reviewRouter);
  app.use(`${API_PREFIX}/refactor`, refactorRouter);
  app.use(`${API_PREFIX}/pair`, pairRouter);
  app.use(`${API_PREFIX}/designer`, designerRouter);
  app.use(`${API_PREFIX}/scaffold`, scaffoldRouter);
  app.use(`${API_PREFIX}/generator`, generatorRouter);
  app.use(`${API_PREFIX}/sync`, syncRouter);
  app.use(`${API_PREFIX}/version`, versionRouter);
  app.use(`${API_PREFIX}/registry`, registryRouter);
  app.use(`${API_PREFIX}/governance`, governanceRouter);
  // ── 13 batch-3 modules (final platform surface) ─────────────────────
  app.use(`${API_PREFIX}/open`, openRouter);
  app.use(`${API_PREFIX}/spotlight`, spotlightRouter);
  app.use(`${API_PREFIX}/profiler`, profilerRouter);
  app.use(`${API_PREFIX}/bundle`, bundleRouter);
  app.use(`${API_PREFIX}/observatory`, observatoryRouter);
  app.use(`${API_PREFIX}/os`, osRouter);
  app.use(`${API_PREFIX}/digital-twin`, digitalTwinRouter);
  app.use(`${API_PREFIX}/live`, liveRouter);
  app.use(`${API_PREFIX}/benchmark`, benchmarkRouter);
  app.use(`${API_PREFIX}/blocks`, blocksRouter);
  app.use(`${API_PREFIX}/blueprints`, blueprintsRouter);
  app.use(`${API_PREFIX}/plugins`, pluginHubRouter);
  app.use(`${API_PREFIX}/search`, searchRouter);
  // ── 8 modern-CSS developer-tool modules (Task 1-f) ──────────────────
  app.use(`${API_PREFIX}/color-space`, colorSpaceRouter);
  app.use(`${API_PREFIX}/style-query`, styleQueryRouter);
  app.use(`${API_PREFIX}/scope`, scopeRouter);
  app.use(`${API_PREFIX}/subgrid`, subgridRouter);
  app.use(`${API_PREFIX}/fallback`, fallbackRouter);
  app.use(`${API_PREFIX}/logical-properties`, logicalPropertiesRouter);
  app.use(`${API_PREFIX}/initial-letter`, initialLetterRouter);
  app.use(`${API_PREFIX}/text-wrap`, textWrapRouter);
  // ── 4 new modern-CSS developer-tool modules (Task 3-f) ───────────────
  app.use(`${API_PREFIX}/property-registrar`, propertyRegistrarRouter);
  app.use(`${API_PREFIX}/relative-color`, relativeColorRouter);
  app.use(`${API_PREFIX}/starting-style`, startingStyleRouter);
  app.use(`${API_PREFIX}/light-dark`, lightDarkRouter);

  // ─── Root info endpoint ────────────────────────────────────────────────
  app.get(
    API_PREFIX,
    asyncHandler(async (_req, res) => {
      res.json({
        name: "roycss-backend",
        version: "1.0.0",
        endpoints: [
          "GET    /api/v1/health",
          "GET    /api/v1/effects",
          "GET    /api/v1/effects/:id",
          "GET    /api/v1/effects/search",
          "GET    /api/v1/recipes",
          "GET    /api/v1/recipes/:id",
          "GET    /api/v1/patterns",
          "GET    /api/v1/patterns/:id",
          "POST   /api/v1/contact",
          "POST   /api/v1/auth/register",
          "POST   /api/v1/auth/login",
          "POST   /api/v1/auth/refresh",
          "GET    /api/v1/auth/me",
          "GET    /api/v1/themes",
          "GET    /api/v1/themes/:id",
          "POST   /api/v1/themes",
          "PUT    /api/v1/themes/:id",
          "DELETE /api/v1/themes/:id",
          "GET    /api/v1/icons",
          "GET    /api/v1/icons/categories",
          "GET    /api/v1/icons/:name",
          "GET    /api/v1/academy/paths",
          "GET    /api/v1/academy/paths/:id",
          "GET    /api/v1/academy/paths/:id/lessons",
          "POST   /api/v1/academy/paths/:id/progress",
          "GET    /api/v1/marketplace/templates",
          "GET    /api/v1/marketplace/templates/:id",
          "POST   /api/v1/marketplace/templates",
          "GET    /api/v1/marketplace/templates/:id/reviews",
          "GET    /api/v1/analytics/overview",
          "GET    /api/v1/analytics/effects",
          "GET    /api/v1/analytics/traffic",
          "GET    /api/v1/analytics/devices",
          // ── Cloud ──────────────────────────────────────────────────────
          "GET    /api/v1/cloud/status",
          "GET    /api/v1/cloud/projects",
          "POST   /api/v1/cloud/projects",
          "GET    /api/v1/cloud/projects/:id",
          "DELETE /api/v1/cloud/projects/:id",
          "GET    /api/v1/cloud/storage",
          "GET    /api/v1/cloud/deployments",
          // ── DevTools ───────────────────────────────────────────────────
          "GET    /api/v1/devtools/inspect",
          "GET    /api/v1/devtools/tokens",
          "GET    /api/v1/devtools/utilities",
          "POST   /api/v1/devtools/analyze",
          // ── Motion ─────────────────────────────────────────────────────
          "GET    /api/v1/motion/effects",
          "GET    /api/v1/motion/effects/:id",
          "GET    /api/v1/motion/presets",
          "GET    /api/v1/motion/categories",
          // ── Enterprise ─────────────────────────────────────────────────
          "GET    /api/v1/enterprise/organizations",
          "GET    /api/v1/enterprise/organizations/:id",
          "POST   /api/v1/enterprise/organizations",
          "GET    /api/v1/enterprise/teams",
          "GET    /api/v1/enterprise/licenses",
          "GET    /api/v1/enterprise/audit-log",
          // ── Inspector ──────────────────────────────────────────────────
          "GET    /api/v1/inspector/classes",
          "GET    /api/v1/inspector/classes/:name",
          "GET    /api/v1/inspector/effects",
          "POST   /api/v1/inspector/scan",
          // ── Studio ─────────────────────────────────────────────────────
          "GET    /api/v1/studio/projects",
          "POST   /api/v1/studio/projects",
          "GET    /api/v1/studio/projects/:id",
          "PUT    /api/v1/studio/projects/:id",
          "DELETE /api/v1/studio/projects/:id",
          "GET    /api/v1/studio/templates",
          // ── Pro Components ─────────────────────────────────────────────
          "GET    /api/v1/pro-components",
          "GET    /api/v1/pro-components/categories",
          "GET    /api/v1/pro-components/:id",
          "GET    /api/v1/pro-components/:id/code",
          // ── MCP ────────────────────────────────────────────────────────
          "GET    /api/v1/mcp/tools",
          "GET    /api/v1/mcp/tools/:name",
          "POST   /api/v1/mcp/execute",
          "GET    /api/v1/mcp/resources",
          "GET    /api/v1/mcp/prompts",
          // ── Compliance ────────────────────────────────────────────────
          "POST   /api/v1/compliance/scan",
          "GET    /api/v1/compliance/standards",
          "GET    /api/v1/compliance/results/:id",
          "GET    /api/v1/compliance/reports",
          // ── Audit Center ──────────────────────────────────────────────
          "GET    /api/v1/audit-center/projects",
          "GET    /api/v1/audit-center/projects/:id",
          "GET    /api/v1/audit-center/issues",
          "GET    /api/v1/audit-center/trends",
          // ── Fleet ─────────────────────────────────────────────────────
          "GET    /api/v1/fleet/projects",
          "GET    /api/v1/fleet/projects/:id",
          "POST   /api/v1/fleet/scan",
          "GET    /api/v1/fleet/health",
          // ── Workspace ─────────────────────────────────────────────────
          "GET    /api/v1/workspace/resources",
          "GET    /api/v1/workspace/resources/:type",
          "GET    /api/v1/workspace/team",
          "POST   /api/v1/workspace/invite",
          // ── Deploy ────────────────────────────────────────────────────
          "POST   /api/v1/deploy/create",
          "GET    /api/v1/deploy/history",
          "GET    /api/v1/deploy/history/:id",
          "GET    /api/v1/deploy/platforms",
          "GET    /api/v1/deploy/environments",
          // ── Preview ───────────────────────────────────────────────────
          "POST   /api/v1/preview/create",
          "GET    /api/v1/preview/list",
          "GET    /api/v1/preview/:id",
          "DELETE /api/v1/preview/:id",
          // ── CDN ───────────────────────────────────────────────────────
          "GET    /api/v1/cdn/stats",
          "GET    /api/v1/cdn/resources",
          "GET    /api/v1/cdn/edges",
          "POST   /api/v1/cdn/purge",
          // ── Storage ───────────────────────────────────────────────────
          "GET    /api/v1/storage/files",
          "GET    /api/v1/storage/files/:id",
          "POST   /api/v1/storage/upload",
          "DELETE /api/v1/storage/files/:id",
          "GET    /api/v1/storage/usage",
          // ── Edge ──────────────────────────────────────────────────────
          "GET    /api/v1/edge/regions",
          "GET    /api/v1/edge/config",
          "POST   /api/v1/edge/deploy",
          "GET    /api/v1/edge/performance",
          // ── Mentor ────────────────────────────────────────────────────
          "POST   /api/v1/mentor/chat",
          "GET    /api/v1/mentor/topics",
          "GET    /api/v1/mentor/progress",
          "GET    /api/v1/mentor/levels",
          // ── Challenges ────────────────────────────────────────────────
          "GET    /api/v1/challenges",
          "GET    /api/v1/challenges/:id",
          "POST   /api/v1/challenges/:id/submit",
          "GET    /api/v1/challenges/leaderboard",
          // ── Certifications ────────────────────────────────────────────
          "GET    /api/v1/certifications",
          "GET    /api/v1/certifications/:id",
          "POST   /api/v1/certifications/:id/exam",
          "GET    /api/v1/certifications/verify/:id",
          // ── Accessibility ─────────────────────────────────────────────
          "GET    /api/v1/accessibility/audit/:url",
          "GET    /api/v1/accessibility/rules",
          "GET    /api/v1/accessibility/contrast/:fg/:bg",
          "POST   /api/v1/accessibility/scan",
          // ── Architect ─────────────────────────────────────────────────
          "POST   /api/v1/architect/generate",
          "GET    /api/v1/architect/templates",
          "GET    /api/v1/architect/templates/:id",
          "GET    /api/v1/architect/results/:id",
          // ── Review ────────────────────────────────────────────────────
          "POST   /api/v1/review/code",
          "GET    /api/v1/review/results/:id",
          "GET    /api/v1/review/rules",
          "GET    /api/v1/review/history",
          // ── Refactor ──────────────────────────────────────────────────
          "POST   /api/v1/refactor/transform",
          "GET    /api/v1/refactor/frameworks",
          "GET    /api/v1/refactor/results/:id",
          // ── Pair ──────────────────────────────────────────────────────
          "POST   /api/v1/pair/chat",
          "GET    /api/v1/pair/history",
          "GET    /api/v1/pair/suggestions",
          // ── Designer ──────────────────────────────────────────────────
          "POST   /api/v1/designer/generate",
          "GET    /api/v1/designer/results/:id",
          "GET    /api/v1/designer/presets",
          // ── Scaffold ──────────────────────────────────────────────────
          "POST   /api/v1/scaffold/generate",
          "GET    /api/v1/scaffold/types",
          "GET    /api/v1/scaffold/types/:id",
          "GET    /api/v1/scaffold/frameworks",
          // ── Generator ─────────────────────────────────────────────────
          "POST   /api/v1/generator/generate",
          "GET    /api/v1/generator/types",
          "GET    /api/v1/generator/templates/:type",
          // ── Sync ──────────────────────────────────────────────────────
          "GET    /api/v1/sync/status",
          "POST   /api/v1/sync/figma",
          "POST   /api/v1/sync/github",
          "POST   /api/v1/sync/tokens",
          "GET    /api/v1/sync/history",
          // ── Version ───────────────────────────────────────────────────
          "GET    /api/v1/version/current",
          "GET    /api/v1/version/latest",
          "GET    /api/v1/version/changelog",
          "GET    /api/v1/version/breaking-changes",
          "POST   /api/v1/version/check-upgrade",
          // ── Registry ──────────────────────────────────────────────────
          "GET    /api/v1/registry/packages",
          "GET    /api/v1/registry/packages/:id",
          "POST   /api/v1/registry/packages",
          "GET    /api/v1/registry/packages/:id/versions",
          // ── Governance ────────────────────────────────────────────────
          "GET    /api/v1/governance/approvals",
          "POST   /api/v1/governance/approvals/:id/approve",
          "POST   /api/v1/governance/approvals/:id/reject",
          "GET    /api/v1/governance/policies",
          "GET    /api/v1/governance/audit-log",
          // ── Open ──────────────────────────────────────────────────────
          "GET    /api/v1/open/issues",
          "GET    /api/v1/open/issues/:id",
          "GET    /api/v1/open/rfcs",
          "GET    /api/v1/open/rfcs/:id",
          "POST   /api/v1/open/rfcs/:id/vote",
          "GET    /api/v1/open/roadmap",
          "GET    /api/v1/open/contributors",
          // ── Spotlight ────────────────────────────────────────────────
          "GET    /api/v1/spotlight/featured",
          "GET    /api/v1/spotlight/items",
          "GET    /api/v1/spotlight/items/:id",
          "POST   /api/v1/spotlight/submit",
          "GET    /api/v1/spotlight/weekly",
          // ── Profiler ─────────────────────────────────────────────────
          "POST   /api/v1/profiler/start",
          "GET    /api/v1/profiler/results/:id",
          "GET    /api/v1/profiler/metrics",
          // ── Bundle ───────────────────────────────────────────────────
          "POST   /api/v1/bundle/analyze",
          "GET    /api/v1/bundle/results/:id",
          "GET    /api/v1/bundle/duplicates",
          "GET    /api/v1/bundle/dead-css",
          // ── Observatory ──────────────────────────────────────────────
          "GET    /api/v1/observatory/sites",
          "GET    /api/v1/observatory/sites/:id",
          "GET    /api/v1/observatory/alerts",
          "GET    /api/v1/observatory/trends/:id",
          // ── OS ───────────────────────────────────────────────────────
          "GET    /api/v1/os/dashboard",
          "GET    /api/v1/os/products",
          "GET    /api/v1/os/activity",
          "GET    /api/v1/os/quick-actions",
          // ── Digital Twin ─────────────────────────────────────────────
          "POST   /api/v1/digital-twin/create",
          "GET    /api/v1/digital-twin/results/:id",
          "GET    /api/v1/digital-twin/simulations",
          // ── Live ─────────────────────────────────────────────────────
          "POST   /api/v1/live/sessions",
          "GET    /api/v1/live/sessions/:id",
          "GET    /api/v1/live/sessions/:id/users",
          "POST   /api/v1/live/sessions/:id/message",
          // ── Benchmark ────────────────────────────────────────────────
          "POST   /api/v1/benchmark/run",
          "GET    /api/v1/benchmark/results/:id",
          "GET    /api/v1/benchmark/comparisons",
          // ── Blocks ───────────────────────────────────────────────────
          "GET    /api/v1/blocks",
          "GET    /api/v1/blocks/:id",
          "GET    /api/v1/blocks/categories",
          "POST   /api/v1/blocks",
          // ── Blueprints ───────────────────────────────────────────────
          "GET    /api/v1/blueprints",
          "GET    /api/v1/blueprints/:id",
          "GET    /api/v1/blueprints/:id/architecture",
          "GET    /api/v1/blueprints/industries",
          // ── Plugins ──────────────────────────────────────────────────
          "GET    /api/v1/plugins",
          "GET    /api/v1/plugins/:id",
          "POST   /api/v1/plugins",
          "GET    /api/v1/plugins/:id/changelog",
          "GET    /api/v1/plugins/categories",
          // ── Search ───────────────────────────────────────────────────
          "POST   /api/v1/search",
          "GET    /api/v1/search/recent",
          "GET    /api/v1/search/suggestions",
          // ── Color Space ──────────────────────────────────────────────
          "POST   /api/v1/color-space/convert",
          "GET    /api/v1/color-space/gamut/:hex",
          "GET    /api/v1/color-space/presets",
          // ── Style Query ──────────────────────────────────────────────
          "POST   /api/v1/style-query/generate",
          "GET    /api/v1/style-query/presets",
          // ── Scope ────────────────────────────────────────────────────
          "POST   /api/v1/scope/analyze",
          "GET    /api/v1/scope/presets",
          // ── Subgrid ──────────────────────────────────────────────────
          "POST   /api/v1/subgrid/generate",
          "GET    /api/v1/subgrid/presets",
          // ── Fallback ─────────────────────────────────────────────────
          "GET    /api/v1/fallback/properties",
          "GET    /api/v1/fallback/properties/:id",
          "GET    /api/v1/fallback/presets",
          // ── Logical Properties ───────────────────────────────────────
          "GET    /api/v1/logical-properties/mapping",
          "POST   /api/v1/logical-properties/convert",
          "GET    /api/v1/logical-properties/presets",
          // ── Initial Letter ───────────────────────────────────────────
          "POST   /api/v1/initial-letter/generate",
          "GET    /api/v1/initial-letter/presets",
          // ── Text Wrap ────────────────────────────────────────────────
          "POST   /api/v1/text-wrap/analyze",
          "GET    /api/v1/text-wrap/presets",
          // ── Property Registrar ──────────────────────────────────────
          "POST   /api/v1/property-registrar/generate",
          "GET    /api/v1/property-registrar/syntaxes",
          "GET    /api/v1/property-registrar/presets",
          // ── Relative Color ──────────────────────────────────────────
          "POST   /api/v1/relative-color/derive",
          "GET    /api/v1/relative-color/channels",
          "GET    /api/v1/relative-color/presets",
          // ── Starting Style ──────────────────────────────────────────
          "POST   /api/v1/starting-style/generate",
          "GET    /api/v1/starting-style/presets",
          // ── Light Dark ──────────────────────────────────────────────
          "POST   /api/v1/light-dark/generate",
          "GET    /api/v1/light-dark/presets",
        ],
      });
    }),
  );

  // ─── 404 + centralized error handler ───────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  log.info("Express app configured");
  return app;
}
