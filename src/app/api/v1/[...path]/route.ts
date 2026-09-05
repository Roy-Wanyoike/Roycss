import type { NextRequest } from "next/server";

import { handleApiGateway } from "@/lib/api-gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/v1/* — mode-aware gateway (issue #83).
 *
 * API_MODE (env) selects the strategy:
 *   - "auto" (default): BACKEND_URL set AND reachable → proxy to the full
 *     backend; otherwise serve the embedded read-only API from the
 *     1,959-effect catalog (production default — the site is standalone).
 *   - "embedded": always serve embedded (read-only catalog surface).
 *   - "proxy": always forward to BACKEND_URL (default localhost:4000) —
 *     the pre-embedded-mode behavior, preserved for self-hosted setups.
 *
 * Contract: API.md. Embedded handler: src/lib/embedded-api.ts.
 */
export async function GET(req: NextRequest) {
  return handleApiGateway(req);
}

export async function POST(req: NextRequest) {
  return handleApiGateway(req);
}

export async function PUT(req: NextRequest) {
  return handleApiGateway(req);
}

export async function PATCH(req: NextRequest) {
  return handleApiGateway(req);
}

export async function DELETE(req: NextRequest) {
  return handleApiGateway(req);
}

export async function OPTIONS(req: NextRequest) {
  return handleApiGateway(req);
}
