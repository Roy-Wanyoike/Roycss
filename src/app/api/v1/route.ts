import type { NextRequest } from "next/server";

import { handleApiGateway } from "@/lib/api-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1 — API root index.
 *
 * In embedded mode it returns the embedded route catalog
 * (`{ name, version, endpoints }`); in proxy mode it is forwarded to the
 * backend's index endpoint. Previously this path had no route handler at
 * all (Next.js 404) — the catch-all only matches non-empty sub-paths.
 */
export async function GET(req: NextRequest) {
  return handleApiGateway(req, { root: true });
}
