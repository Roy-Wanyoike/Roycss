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
function logLevelFor(statusCode: number): keyof Logger {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
}

/** Centralized Express error middleware — must have 4 args. */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // NextFunction must be present in the signature even if unused —
  // Express uses arity to decide this is an error handler.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const appErr = AppError.internal(
    IS_PROD ? "Internal server error" : message,
    IS_PROD ? undefined : { stack },
  );
  logger.error("Unhandled error", {
    requestId,
    err: message,
    stack,
  });
  logAndSend(res, appErr, requestId);
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

  const body: ErrorResponseBody = {
    error: {
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
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
