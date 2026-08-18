import { NextRequest, NextResponse } from "next/server";
import { effects } from "@/lib/roycss-effects";

/**
 * Per-effect CSS endpoint.
 *
 * Returns the CSS for a single effect (by id) as `text/css`.
 *
 * Effects are immutable per release version — the same id always maps
 * to the same CSS — so we cache the response aggressively (24h,
 * immutable). External consumers (CLI, MCP server, IDE extensions,
 * CDN frontends, etc.) can fetch individual effect CSS via HTTP
 * without bundling the entire library.
 *
 * Returns 404 (as `text/css`) if the effect id is not found.
 */
export const runtime = "nodejs";

// Pre-build the id → effect lookup once at module load. The effects
// array is static at build time (read from the batch files), so this
// Map is safe to share across requests.
const effectById = new Map(effects.map((e) => [e.id, e]));

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const effect = effectById.get(id);

  if (!effect) {
    // Return a 404 with a CSS content-type so consumers that fetch()
    // expecting CSS still see a parseable, comment-only stylesheet.
    return new NextResponse(`/* 404 — effect "${id}" not found */`, {
      status: 404,
      headers: {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(effect.cssCode, {
    status: 200,
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, max-age=86400, immutable",
      "X-RoyCSS-Effect": effect.id,
      "X-RoyCSS-Category": effect.category,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
