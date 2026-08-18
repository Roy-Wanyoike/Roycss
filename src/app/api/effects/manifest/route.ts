import { NextResponse } from "next/server";
import { effects } from "@/lib/roycss-effects";
import type { EffectCategory, PreviewType } from "@/lib/roycss-types";

/**
 * Effects manifest endpoint.
 *
 * Returns a JSON manifest of every effect in the library (id, name,
 * category, tags, previewType) — NOT the full CSS — so the response
 * stays small enough (~hundreds of KB) for external tooling (CLI,
 * MCP server, IDE extensions, search indexes) to consume on cold
 * start.
 *
 * Cached for 24h. Effects are immutable per release version, so the
 * manifest is safe to cache aggressively.
 */
export const runtime = "nodejs";

interface ManifestEntry {
  id: string;
  name: string;
  category: EffectCategory;
  tags: string[];
  previewType: PreviewType;
}

interface Manifest {
  version: 1;
  generatedAt: string;
  count: number;
  effects: ManifestEntry[];
}

// The manifest is identical for the lifetime of the deployed build —
// compute it once and reuse across requests. (Next.js may re-import
// the module on hot reload in dev, which is fine.)
let cachedManifest: Manifest | null = null;

function buildManifest(): Manifest {
  if (cachedManifest) return cachedManifest;
  cachedManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    count: effects.length,
    effects: effects.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      tags: e.tags,
      previewType: e.previewType,
    })),
  };
  return cachedManifest;
}

export function GET() {
  const manifest = buildManifest();
  return NextResponse.json(manifest, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=86400, immutable",
      "X-RoyCSS-Manifest": "v1",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
