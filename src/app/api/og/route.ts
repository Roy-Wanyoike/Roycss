import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const runtime = "nodejs";

// Memoized — read PNG once per server instance; cached as Buffer.
let cachedPng: Buffer | null = null;

function getOgPng(): Buffer {
  if (cachedPng) return cachedPng;
  const path = resolve(process.cwd(), "public", "og.png");
  cachedPng = readFileSync(path);
  return cachedPng;
}

export function GET() {
  try {
    const png = getOgPng();
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("OG image not found", { status: 404 });
  }
}
