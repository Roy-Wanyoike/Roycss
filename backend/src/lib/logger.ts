/**
 * Structured logger — no external dependency.
 *
 * Emits JSON-ish structured lines to stdout/stderr with:
 *   timestamp · level · message · context fields · requestId (optional)
 *
 * The shape is intentionally simple to keep production logs greppable
 * while still being parseable by any downstream log shipper (Loki,
 * Datadog, CloudWatch, etc.).
 */
import { env } from "../config/env.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LEVEL_STREAM: Record<LogLevel, NodeJS.WriteStream> = {
  debug: process.stdout,
  info: process.stdout,
  warn: process.stderr,
  error: process.stderr,
};

export interface LogContext {
  [key: string]: unknown;
}

const configuredLevel: LogLevel = env.LOG_LEVEL;

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[configuredLevel];
}

function formatContext(ctx: LogContext | undefined): string {
  if (!ctx || Object.keys(ctx).length === 0) return "";
  // Compact JSON for context — never pretty-print to keep one log = one line.
  try {
    return " " + JSON.stringify(ctx);
  } catch {
    return " " + JSON.stringify({ _unserializable: true });
  }
}

function emit(level: LogLevel, message: string, ctx?: LogContext): void {
  if (!shouldLog(level)) return;
  const line =
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...(ctx && Object.keys(ctx).length > 0 ? ctx : {}),
    }) + "\n";
  LEVEL_STREAM[level].write(line);
}

export interface Logger {
  debug(message: string, ctx?: LogContext): void;
  info(message: string, ctx?: LogContext): void;
  warn(message: string, ctx?: LogContext): void;
  error(message: string, ctx?: LogContext): void;
  /** Create a child logger that always attaches the given context. */
  child(ctx: LogContext): Logger;
}

function makeLogger(bindCtx: LogContext = {}): Logger {
  return {
    debug(message, ctx) {
      emit("debug", message, { ...bindCtx, ...ctx });
    },
    info(message, ctx) {
      emit("info", message, { ...bindCtx, ...ctx });
    },
    warn(message, ctx) {
      emit("warn", message, { ...bindCtx, ...ctx });
    },
    error(message, ctx) {
      emit("error", message, { ...bindCtx, ...ctx });
    },
    child(ctx) {
      return makeLogger({ ...bindCtx, ...ctx });
    },
  };
}

/** Root logger. Use `logger.child({ module: "..." })` for module-scoped logs. */
export const logger = makeLogger();

/** Create a module-scoped logger in one call. */
export function createLogger(module: string): Logger {
  return logger.child({ module });
}
