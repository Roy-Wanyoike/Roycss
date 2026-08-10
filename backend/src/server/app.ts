/**
 * Express app factory — wires all middleware and routes.
 *
 * Kept separate from `src/index.ts` so the app can be imported in
 * tests without starting the HTTP server.
 */
import express, { type Express } from "express";
import helmet from "helmet";

import { API_PREFIX } from "../config/constants.js";
import { academyRouter } from "../modules/academy/routes.js";
import { analyticsRouter } from "../modules/analytics/routes.js";
import { authRouter } from "../modules/auth/routes.js";
import { cloudRouter } from "../modules/cloud/routes.js";
import { contactRouter } from "../modules/contact/routes.js";
import { devtoolsRouter } from "../modules/devtools/routes.js";
import { effectsRouter } from "../modules/effects/routes.js";
import { enterpriseRouter } from "../modules/enterprise/routes.js";
import { healthRouter } from "../modules/health/routes.js";
import { iconsRouter } from "../modules/icons/routes.js";
import { inspectorRouter } from "../modules/inspector/routes.js";
import { marketplaceRouter } from "../modules/marketplace/routes.js";
import { mcpRouter } from "../modules/mcp/routes.js";
import { motionRouter } from "../modules/motion/routes.js";
import { patternsRouter } from "../modules/patterns/routes.js";
import { proComponentsRouter } from "../modules/pro-components/routes.js";
import { recipesRouter } from "../modules/recipes/routes.js";
import { studioRouter } from "../modules/studio/routes.js";
import { themesRouter } from "../modules/themes/routes.js";
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
