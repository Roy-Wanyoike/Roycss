import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  // Return a simple SVG as OG image (works without next/og dependency)
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <text x="600" y="280" font-family="system-ui, sans-serif" font-size="72" font-weight="800" fill="#10b981" text-anchor="middle">RoyCSS</text>
  <text x="600" y="340" font-family="system-ui, sans-serif" font-size="32" fill="#ffffff" text-anchor="middle">AI-Native Frontend Engineering Platform</text>
  <text x="600" y="400" font-family="system-ui, sans-serif" font-size="20" fill="#6b7280" text-anchor="middle">1,749 Effects · 62 Products · 64 DevTools · AI Assistance</text>
  <rect x="500" y="440" width="200" height="48" rx="12" fill="#10b981"/>
  <text x="600" y="470" font-family="system-ui, sans-serif" font-size="22" font-weight="600" fill="#ffffff" text-anchor="middle">roycss.com</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
