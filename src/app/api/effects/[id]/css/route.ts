import { NextResponse } from "next/server";
import { effects } from "@/lib/roycss-effects";

export const runtime = "nodejs";

/**
 * GET /api/effects/[id]/css — returns the raw CSS for a single effect.
 *
 * Content-Type: text/css; charset=utf-8
 * Cache: 24h public, s-maxage=86400
 * 404 if id not found.
 *
 * Example: <link rel="stylesheet" href="/api/effects/glass-card/css">
 */
export function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return (async () => {
    const { id } = await params;
    const effect = effects.find((e) => e.id === id);
    if (!effect) {
      return new NextResponse(
        `/* Effect not found: ${id} */`,
        {
          status: 404,
          headers: { "Content-Type": "text/css; charset=utf-8" },
        },
      );
    }
    return new NextResponse(effect.cssCode, {
      status: 200,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "X-Effect-Id": effect.id,
        "X-Effect-Category": effect.category,
      },
    });
  })();
}
