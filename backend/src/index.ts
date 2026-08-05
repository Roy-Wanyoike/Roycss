/**
 * Entry point — starts the Express server and wires signal handlers.
 *
 * Responsibilities:
 *   - Load + validate env (fails fast on bad config)
 *   - Create the Express app via createApp()
 *   - Start listening on PORT
 *   - Hook SIGINT / SIGTERM for graceful shutdown
 *     (closes the HTTP server, then the Prisma connection pool)
 */
import { createServer } from "node:http";

import { env } from "./config/env.js";
import { APP_NAME, APP_VERSION } from "./config/constants.js";
import { closeDatabase } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { createApp } from "./server/app.js";
import { loadEffects } from "./modules/effects/service.js";

function main(): void {
  // Validate env up-front (loadEnv() exits on failure).
  const config = env;

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
