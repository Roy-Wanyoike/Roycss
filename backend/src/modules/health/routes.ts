/**
 * Health module — GET /api/v1/health
 *
 * Returns server status, uptime, version, and DB connection status.
 * Mounted BEFORE the global rate limiter so it can always be polled.
 */
import { Router } from "express";

import { APP_NAME, APP_VERSION } from "../../config/constants.js";
import { pingDatabase } from "../../lib/db.js";
import { createLogger } from "../../lib/logger.js";
import { asyncHandler } from "../../server/middleware/error.js";

const log = createLogger("health");
export const healthRouter = Router();

const startedAt = Date.now();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const dbOk = await pingDatabase();
    const uptimeMs = Date.now() - startedAt;

    const status: "ok" | "degraded" = dbOk ? "ok" : "degraded";
    const statusCode = dbOk ? 200 : 503;

    if (!dbOk) {
      log.warn("Health check degraded — database unreachable");
    }

    res.status(statusCode).json({
      status,
      service: APP_NAME,
      version: APP_VERSION,
      uptime: {
        ms: uptimeMs,
        seconds: Math.floor(uptimeMs / 1000),
        human: formatUptime(uptimeMs),
      },
      time: new Date().toISOString(),
      checks: {
        database: dbOk ? "connected" : "disconnected",
        memory: getMemoryUsage(),
      },
    });
  }),
);

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

function getMemoryUsage(): {
  rssMb: number;
  heapUsedMb: number;
  heapTotalMb: number;
} {
  const mem = process.memoryUsage();
  const toMb = (b: number): number => Math.round((b / 1024 / 1024) * 100) / 100;
  return {
    rssMb: toMb(mem.rss),
    heapUsedMb: toMb(mem.heapUsed),
    heapTotalMb: toMb(mem.heapTotal),
  };
}
