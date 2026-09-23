import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  OG_HEIGHT,
  OG_WIDTH,
  buildEffectOgImage,
  resolveEffectOg,
} from "./_lib/og-effect";
import {
  buildCategoryOgImage,
  resolveCategoryOg,
} from "./_lib/og-category";

export const runtime = "nodejs";

/* ── Static brand card (public/og.png) ──────────────────────────
   The no-`effect` response — exactly what this route served before
   issue #116, and still the OG image for every non-effect page
   (home, /effects listing, docs, …). Memoized: read PNG once per
   server instance; cached as Buffer. */
let cachedPng: Buffer | null = null;

function getOgPng(): Buffer {
  if (cachedPng) return cachedPng;
  const path = resolve(process.cwd(), "public", "og.png");
  cachedPng = readFileSync(path);
  return cachedPng;
}

const CACHE_HEADERS: Record<string, string> = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
  "X-Content-Type-Options": "nosniff",
};

/* ── Route ──────────────────────────────────────────────────────
   GET /api/og               → static brand card (pre-#116 behavior)
   GET /api/og?effect=<id>   → per-effect 1200×630 card (#116), built
   from the bundled catalog with ImageResponse (no network fetches;
   see _lib/og-effect.tsx). Unknown ids 404 — the same contract the
   /effects/[id] page enforces.
   GET /api/og?category=<slug> → per-category 1200×630 card (#206,
   the #199 TODO) — label + effect count + description, mirroring the
   effect branch. Unknown slugs 404 — the same contract the
   /effects/category/[slug] page enforces. */
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const effectId = searchParams.get("effect");
  const categorySlug = searchParams.get("category");

  if (effectId === null && categorySlug === null) {
    try {
      const png = getOgPng();
      return new NextResponse(new Uint8Array(png), {
        status: 200,
        headers: CACHE_HEADERS,
      });
    } catch {
      return new NextResponse("OG image not found", { status: 404 });
    }
  }

  const effect = effectId !== null ? resolveEffectOg(effectId) : undefined;
  if (effectId !== null && !effect) {
    return new NextResponse("Unknown effect id", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (effect) {
    try {
      const image = await new ImageResponse(buildEffectOgImage(effect), {
        width: OG_WIDTH,
        height: OG_HEIGHT,
      });
      return new NextResponse(image.body, { status: 200, headers: CACHE_HEADERS });
    } catch {
      // Never 500 a social crawler: if Satori rejects a value the demo
      // extractor let through, degrade to the static brand card.
      return serveBrandCardOr404();
    }
  }

  // ?category=<slug> branch (#206) — same contract as the effect branch.
  const category = categorySlug !== null ? resolveCategoryOg(categorySlug) : undefined;
  if (categorySlug !== null && !category) {
    return new NextResponse("Unknown category slug", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const image = await new ImageResponse(buildCategoryOgImage(category!), {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    });
    return new NextResponse(image.body, { status: 200, headers: CACHE_HEADERS });
  } catch {
    // Never 500 a social crawler — same degradation as the effect branch.
    return serveBrandCardOr404();
  }
}

/** Shared degradation path: the static brand card, or a bare 404. */
function serveBrandCardOr404(): NextResponse {
  try {
    const png = getOgPng();
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: CACHE_HEADERS,
    });
  } catch {
    return new NextResponse("OG image not found", { status: 404 });
  }
}
