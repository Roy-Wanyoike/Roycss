/**
 * Entry point — starts the Express server and wires signal handlers.
 *
 * Responsibilities:
 *   - Load + validate env (fails fast on bad config)
 *   - Initialize Sentry when SENTRY_DSN is set
 *   - Install Redis-backed rate limiters when REDIS_URL is set
 *     (issue #118 / PRD-F10; logs + falls back to in-memory on any
 *     connection failure — the API never fails to boot because of Redis)
 *   - Create the Express app via createApp()
 *   - Start listening on PORT
 *   - Hook SIGINT / SIGTERM for graceful shutdown
 *     (closes the HTTP server, the Redis rate-limiter client if any,
 *     then the Prisma connection pool)
 */
import { createServer } from "node:http";

// MUST stay the first import: applies backend-node/.env to process.env
// BEFORE any module reads the environment (issue #208 — `bun run dev`
// must boot from a copied `.env.example`; shell env always wins).
import "./config/dotenv.js";
import { env } from "./config/env.js";
import {
  APP_NAME,
  APP_VERSION,
  IS_PROD,
} from "./config/constants.js";
import { closeDatabase } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { initSentry } from "./lib/sentry.js";
import { createApp } from "./server/app.js";
import { corsPosture } from "./server/middleware/cors.js";
import { initRedisRateLimiting } from "./server/rate-limit-redis.js";
import { loadEffects } from "./modules/effects/service.js";

async function main(): Promise<void> {
  // Validate env up-front (loadEnv() exits on failure).
  const config = env;

  // Sentry error tracking (issue #119 / PRD-F11) — only activates when
  // SENTRY_DSN is set; logs once and no-ops otherwise.
  initSentry();

  // Redis rate limiting (issue #118 / PRD-F10) — installs Redis-backed
  // adapters for the five route tiers + the per-API-key limiter when
  // REDIS_URL is set, BEFORE the server accepts traffic. Unset var or a
  // failed connection leaves the in-memory default in place.
  const redisRateLimit = await initRedisRateLimiting();

  // Pre-load effects data so the first request isn't slow and so any
  // file/read errors surface at boot rather than mid-request.
  loadEffects();

  const app = createApp();
  const server = createServer(app);

  server.listen(config.PORT, () => {
    logger.info(`${APP_NAME} v${APP_VERSION} listening`, {
      port: config.PORT,
      env: config.NODE_ENV,
      apiPrefix: "/api/v1",
    });
    logger.info("CORS origins", { origins: config.CORS_ORIGINS });

    // CORS posture line (issue #209): dev reflection is now GATED to
    // localhost-family origins (the reflect-ANY-origin landmine is
    // gone) and rejected origins answer 403 in every mode. Log the
    // posture at boot so operators can see it without reading source.
    logger.info("CORS posture", {
      env: config.NODE_ENV,
      posture: corsPosture(IS_PROD),
    });
  });

  // Keep the server from keeping the process alive on test shutdown.
  server.on("error", (err) => {
    logger.error("Server error", { err: err.message, stack: err.stack });
    process.exit(1);
  });

  // ─── Graceful shutdown ────────────────────────────────────────────────
  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Shutting down gracefully", { signal });

    server.close(async () => {
      await closeDatabase();
      // Quit the Redis rate-limiter client, if one was installed —
      // never rejects, so shutdown can't hang on a dead Redis.
      await redisRateLimit?.quit();
      logger.info("Shutdown complete");
      process.exit(0);
    });

    // If graceful close takes >10s, force exit.
    setTimeout(() => {
      logger.warn("Forcing exit after 10s timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Surface unhandled errors loudly — they're bugs.
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", {
      err: err.message,
      stack: err.stack,
    });
    // Give the logger time to flush then exit — the process state is
    // now considered corrupt.
    setTimeout(() => process.exit(1), 100).unref();
  });
}

main();
