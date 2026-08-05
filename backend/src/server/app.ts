/**
 * Express app factory — wires all middleware and routes.
 *
 * Kept separate from `src/index.ts` so the app can be imported in
 * tests without starting the HTTP server.
 */
import express, { type Express } from "express";
import helmet from "helmet";

import { API_PREFIX } from "../config/constants.js";
import { authRouter } from "../modules/auth/routes.js";
import { contactRouter } from "../modules/contact/routes.js";
import { effectsRouter } from "../modules/effects/routes.js";
import { healthRouter } from "../modules/health/routes.js";
import { patternsRouter } from "../modules/patterns/routes.js";
import { recipesRouter } from "../modules/recipes/routes.js";
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
