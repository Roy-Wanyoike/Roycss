/**
 * Zod validation middleware factory.
 *
 * Validates one of: `body`, `query`, or `params` against a Zod schema.
 * On failure, throws AppError.validation(details) which the centralized
 * error middleware formats into a 400 response.
 *
 * Usage:
 *   router.post(
 *     "/contact",
 *     validateBody(contactSchema),
 *     contactController.submit,
 *   )
 */
import type { NextFunction, Request, Response } from "express";
import type { ZodType, ZodTypeAny } from "zod";

import { AppError } from "./error.js";

type Target = "body" | "query" | "params";

function validate(target: Target, schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        target,
        path: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      next(AppError.validation(details));
      return;
    }
    // Replace the request target with the parsed (and potentially
    // transformed/coerced) value. We can't assign directly to
    // req[target] because TS won't allow widening through a cast on
    // the left-hand side, so route through a record view.
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}

/** Validate the request body against a Zod schema. */
export function validateBody<T>(schema: ZodType<T>) {
  return validate("body", schema as unknown as ZodTypeAny);
}

/** Validate the request query string against a Zod schema. */
export function validateQuery<T>(schema: ZodType<T>) {
  return validate("query", schema as unknown as ZodTypeAny);
}

/** Validate route params against a Zod schema. */
export function validateParams<T>(schema: ZodType<T>) {
  return validate("params", schema as unknown as ZodTypeAny);
}
