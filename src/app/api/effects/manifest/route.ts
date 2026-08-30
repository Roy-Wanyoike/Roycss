import { NextResponse } from "next/server";
import { effects } from "@/lib/roycss-effects";

export const runtime = "nodejs";

// Memoized manifest — built once per server instance.
let cachedManifest: { count: number; effects: Array<Record<string, unknown>> } | null = null;

function buildManifest() {
  if (cachedManifest) return cachedManifest;
  const list = effects.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    description: e.description,
    tags: e.tags,
    previewType: e.previewType,
    childCount: e.childCount ?? null,
    previewText: e.previewText ?? null,
    // NOTE: cssCode intentionally omitted — fetch /api/effects/[id]/css separately.
  }));
  cachedManifest = { count: list.length, effects: list };
  return cachedManifest;
}

/**
 * GET /api/effects/manifest — JSON manifest of all 1,779 effects
 * (metadata only — no cssCode to keep payload small).
 *
 * Cache: 24h public.
 */
export function GET() {
  const m = buildManifest();
  return NextResponse.json(m, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "X-Effects-Count": String(m.count),
    },
  });
}
