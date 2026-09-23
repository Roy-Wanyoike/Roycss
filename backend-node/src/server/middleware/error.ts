/**
 * Centralized error handling.
 *
 * Exposes:
 *   - `AppError`           : a typed, status-aware Error subclass that
 *                            services and middleware throw for expected
 *                            failures (validation, not-found, auth).
 *   - `ErrorCode`          : a stable enum of error codes for clients
 *                            to switch on.
 *   - `errorHandler`       : Express middleware that converts any
 *                            thrown error into a standardized JSON
 *                            response shape:
 *
 *     {
 *       error: {
 *         code:    "VALIDATION_ERROR",
 *         message: "Email is required",
 *         details?: [{ field: "email", ... }]
 *       },
 *       requestId: "..."
 *     }
 *
 *   - `notFoundHandler`    : catches unmatched routes.
 *   - `asyncHandler`       : wraps an async route handler so thrown
 *                            rejections are forwarded to errorHandler.
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";

import { IS_PROD } from "../../config/constants.js";
import type { Logger } from "../../lib/logger.js";
import { logger } from "../../lib/logger.js";

export enum ErrorCode {
  // 400
  VALIDATION_ERROR = "VALIDATION_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  // 401
  UNAUTHORIZED = "UNAUTHORIZED",
  // 403
  FORBIDDEN = "FORBIDDEN",
  // 404
  NOT_FOUND = "NOT_FOUND",
  // 409
  CONFLICT = "CONFLICT",
  // 429
  RATE_LIMITED = "RATE_LIMITED",
  // 500
  INTERNAL = "INTERNAL_ERROR",
  // 503
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export interface ErrorResponseBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message = "Bad request", details?: unknown): AppError {
    return new AppError(ErrorCode.BAD_REQUEST, message, 400, details);
  }

  static validation(details: unknown): AppError {
    return new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Request validation failed",
      400,
      details,
    );
  }

  static unauthorized(message = "Unauthorized", details?: unknown): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 401, details);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, 403);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(ErrorCode.NOT_FOUND, message, 404);
  }

  static conflict(message = "Conflict", details?: unknown): AppError {
    return new AppError(ErrorCode.CONFLICT, message, 409, details);
  }

  static rateLimited(message = "Too many requests", details?: unknown): AppError {
    return new AppError(ErrorCode.RATE_LIMITED, message, 429, details);
  }

  static serviceUnavailable(message = "Service unavailable", details?: unknown): AppError {
    return new AppError(ErrorCode.SERVICE_UNAVAILABLE, message, 503, details);
  }

  static internal(message = "Internal server error", details?: unknown): AppError {
    return new AppError(ErrorCode.INTERNAL, message, 500, details, false);
  }
}

/** Normalize Zod errors into a compact field-level details array. */
function zodErrorDetails(err: ZodError): unknown {
  return err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
    code: i.code,
  }));
}

/** Pick the right log level for an error based on its status code. */
type LogLevel = "debug" | "info" | "warn" | "error";
function logLevelFor(statusCode: number): LogLevel {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
}

/**
 * Recognize body-parser request-parsing failures that must surface as
 * 4xx client errors instead of 500s (issue #207):
 *
 *   - `type === "entity.parse.failed"` — a malformed JSON/urlencoded
 *     payload. body-parser raises these as SyntaxError subclasses with
 *     `status = 400`; letting them reach the unknown-error branch turned
 *     bad client input into `500 INTERNAL_ERROR` with the raw parser
 *     message and (in dev) a full stack of absolute paths.
 *   - `status === 400` with a body-parser `type` tag (e.g.
 *     `request.aborted`, `request.size.invalid`) — same class of
 *     client-side body problems.
 *   - a bare SyntaxError with status 400 — defensive: body-parser's
 *     JSON errors are SyntaxError instances; a raw `JSON.parse` failure
 *     on user-supplied strings deserves 400 too, not 500.
 *
 * Deliberately NOT remapped: `entity.too.large` (413),
 * `encoding.unsupported`/`charset.unsupported` (415) — they keep their
 * historical handling; widening the ErrorCode surface is follow-up work.
 */
function isBodyParserParseError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const e = err as Error & {
    type?: unknown;
    status?: unknown;
    statusCode?: unknown;
  };
  const status =
    typeof e.status === "number"
      ? e.status
      : typeof e.statusCode === "number"
        ? e.statusCode
        : undefined;
  if (e.type === "entity.parse.failed") return true;
  if (err instanceof SyntaxError && status === 400) return true;
  return status === 400 && typeof e.type === "string";
}

/** Centralized Express error middleware — must have 4 args. */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // NextFunction must be present in the signature even if unused —
  // Express uses arity to decide this is an error handler.
  _next: NextFunction,
): void {
  const requestId = (req.headers["x-request-id"] as string | undefined) ??
    res.locals.requestId;

  // ─── Zod validation errors ────────────────────────────────────────────
  if (err instanceof ZodError) {
    const appErr = AppError.validation(zodErrorDetails(err));
    logAndSend(res, appErr, requestId);
    return;
  }

  // ─── Our own operational errors ───────────────────────────────────────
  if (err instanceof AppError) {
    logAndSend(res, err, requestId);
    return;
  }

  // ─── Body-parser errors — malformed request payloads (issue #207) ────
  // Bad client input must never surface as a 500 with parser internals
  // or a dev stack trace. The parser message stays server-side (debug
  // log); the client gets a clean 400 envelope with no details.
  if (isBodyParserParseError(err)) {
    logger.debug("Malformed request body rejected by the body parser", {
      requestId,
      parserMessage: err instanceof Error ? err.message : String(err),
    });
    logAndSend(
      res,
      AppError.badRequest(
        "Malformed request body — the payload could not be parsed",
      ),
      requestId,
    );
    return;
  }

  // ─── Prisma errors — normalize common ones ────────────────────────────
  const prismaError = err as { code?: string; meta?: unknown; message?: string };
  if (typeof prismaError?.code === "string") {
    if (prismaError.code === "P2002") {
      // Unique constraint violation
      const appErr = AppError.conflict(
        "A record with that value already exists",
        prismaError.meta,
      );
      logAndSend(res, appErr, requestId);
      return;
    }
    if (prismaError.code === "P2025") {
      // Record not found
      const appErr = AppError.notFound("Record not found");
      logAndSend(res, appErr, requestId);
      return;
    }
  }

  // ─── Unknown / programmer errors ──────────────────────────────────────
  const message = err instanceof Error ? err.message : "Unknown error";
  const stack = err instanceof Error ? err.stack : undefined;
  // details.stack is a DEV-ONLY, 5xx-ONLY diagnostic (issue #207):
  // 4xx bodies must never carry it, whatever the throw site does.
  const unknownStatus = 500;
  const appErr = AppError.internal(
    IS_PROD ? "Internal server error" : message,
    !IS_PROD && unknownStatus >= 500 ? { stack } : undefined,
  );
  logger.error("Unhandled error", {
    requestId,
    err: message,
    stack,
  });
  logAndSend(res, appErr, requestId);
}

/**
 * What the CLIENT may see in `error.details`.
 *
 * Server logs always receive the full `details` (see logAndSend); the
 * response body is stricter — the invariants from issues #207/#209:
 *   - a 4xx response never carries a top-level `stack` details key
 *     (client errors need no server frames);
 *   - a 401 response carries NO details at all (issue #209): the JWT
 *     verify path used to attach `{ reason: "jwt malformed" }` etc.,
 *     letting attackers distinguish token failure modes (malformed vs
 *     expired vs wrong signature). The precise reason stays in the
 *     server log; the body stays uniform.
 *   - 5xx details (the dev-only stack) are attached at the throw site
 *     and only when !IS_PROD, so they pass through unchanged here.
 */
function clientErrorDetails(err: AppError): unknown {
  if (err.statusCode === 401) return undefined;
  if (err.statusCode < 500) return stripStackDetails(err.details);
  return err.details;
}

/** Drop a top-level `stack` key from object-shaped details. */
function stripStackDetails(details: unknown): unknown {
  if (
    details !== null &&
    typeof details === "object" &&
    !Array.isArray(details) &&
    "stack" in (details as Record<string, unknown>)
  ) {
    const { stack: _stack, ...rest } = details as Record<string, unknown>;
    return Object.keys(rest).length > 0 ? rest : undefined;
  }
  return details;
}

function logAndSend(
  res: Response,
  err: AppError,
  requestId: string | undefined,
): void {
  const level = logLevelFor(err.statusCode);
  logger[level](err.message, {
    requestId,
    code: err.code,
    statusCode: err.statusCode,
    ...(err.details ? { details: err.details } : {}),
  });

  const clientDetails = clientErrorDetails(err);
  const body: ErrorResponseBody = {
    error: {
      code: err.code,
      message: err.message,
      ...(clientDetails !== undefined ? { details: clientDetails } : {}),
    },
    requestId,
  };
  res.status(err.statusCode).json(body);
}

/** 404 handler — anything that falls through routes lands here. */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Wrap an async route handler so any rejected promise is forwarded to
 * Express's error chain (which the errorHandler middleware picks up).
 *
 * Without this, `async (req, res) => { throw ... }` would be swallowed
 * as an unhandled rejection — Express 4 does not catch them by default.
 */
export function asyncHandler<ReqT = Request>(
  fn: (req: ReqT, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as unknown as ReqT, res, next)).catch(next);
  };
}
