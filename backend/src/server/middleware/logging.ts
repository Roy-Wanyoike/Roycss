/**
 * Request logger — emits one structured log line per request.
 *
 * Uses morgan for tokenized access logs in dev, plus a structured
 * JSON line wrapper that includes request id, method, path, status,
 * and duration in ms. In prod the JSON line is the source of truth;
 * in dev we keep morgan's pretty colorized output too for readability.
 *
 * A request id is attached to every request:
 *   - If client sent `X-Request-Id`, it's reused.
 *   - Otherwise we generate a short nanoid-ish id.
 *   - The id is echoed back via the `X-Request-Id` response header
 *     so clients can correlate.
 */
import type { NextFunction, Request, Response } from "express";
import morgan from "morgan";

import { IS_DEV } from "../../config/constants.js";
import { createLogger } from "../../lib/logger.js";

const log = createLogger("http");

/** Generate a short request id: 12 hex chars. */
function generateRequestId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(16).slice(2, 10)
  ).slice(0, 16);
}

/** Attach a request id + start the timer. Runs before routes. */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers["x-request-id"];
  const id = (typeof incoming === "string" && incoming) || generateRequestId();
  req.requestId = id;
  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);

  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const elapsedNs = Number(process.hrtime.bigint() - start);
    const durationMs = Math.round(elapsedNs / 1_000_000);
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    log[level](`${req.method} ${req.originalUrl} → ${res.statusCode}`, {
      requestId: id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  });

  next();
}

/** Pretty colorized morgan output for dev. */
const morganDev = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  {
    skip: () => !IS_DEV,
  },
);

export const requestLogger = morganDev;
