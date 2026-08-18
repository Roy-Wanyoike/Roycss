import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * OG image endpoint.
 *
 * Returns the static /public/og.png asset (generated at build time by
 * `scripts/generate-og-image.ts` using sharp) directly as image/png.
 *
 * Why: `next/og` (Satori + wasm) crashes silently under Turbopack dev.
 * Serving a pre-built PNG is rock-solid, ~215KB, and instant for crawlers.
 */
export const runtime = "nodejs";

let cachedPng: Buffer | null = null;

function loadPng(): Buffer {
  if (cachedPng) return cachedPng;
  const filePath = join(process.cwd(), "public", "og.png");
  cachedPng = readFileSync(filePath);
  return cachedPng;
}

export function GET() {
  const png = loadPng();
  return new NextResponse(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Length": String(png.length),
    },
  });
}
