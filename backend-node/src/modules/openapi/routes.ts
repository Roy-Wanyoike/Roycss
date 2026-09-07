/**
 * OpenAPI routes — GET /api/v1/openapi.json (PF-009 / issue #94 A4)
 *
 * Serves the COMMITTED, generated OpenAPI 3.1 document
 * (`backend-node/api/openapi.json`, produced by
 * `npm run gen:openapi`) directly from disk. The file is cached in
 * memory keyed by mtime, so repeated hits cost nothing and edits to
 * the artifact are picked up without a restart.
 *
 * The document itself is generated, never hand-edited:
 *   cd backend-node && npm run gen:openapi            # regenerate
 *   cd backend-node && npm run gen:openapi:check      # CI drift gate
 *
 * NOTE: this router is mounted at `${API_PREFIX}/openapi.json` — a
 * mount segment with a dot — so the static route walkers
 * (scripts/lib/walk-routes.ts) deliberately do not see it; the
 * generator adds the endpoint to the spec manually instead.
 */
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";

import { AppError, asyncHandler } from "../../server/middleware/error.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// src/modules/openapi/routes.ts → backend root → api/openapi.json
const BACKEND_ROOT = resolve(__dirname, "..", "..", "..");
const OPENAPI_PATH = resolve(BACKEND_ROOT, "api", "openapi.json");

export const openapiRouter = Router();

/** mtime-keyed cache: { mtimeMs, body } */
let cached: { mtimeMs: number; body: string } | null = null;

function readDocument(): string {
  let mtimeMs: number;
  try {
    mtimeMs = statSync(OPENAPI_PATH).mtimeMs;
  } catch {
    throw AppError.notFound(
      "OpenAPI document not generated — run `npm run gen:openapi` in backend-node",
    );
  }
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.body;
  }
  const body = readFileSync(OPENAPI_PATH, "utf-8");
  cached = { mtimeMs, body };
  return body;
}

openapiRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const body = readDocument();
    res.type("application/json");
    res.send(body);
  }),
);
