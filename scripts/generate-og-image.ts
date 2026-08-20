/**
 * RoyCSS OG Image Generator
 *
 * Generates `public/og.png` (1200×630 PNG) from an inline SVG using sharp.
 * Tile-style: dark background (#0a0a0a), brand pill, two-line title
 * ("AI-Native Frontend" / "Engineering Platform"), stats row, and
 * "roycss.com" pill at bottom-right.
 *
 * Usage: `bun run scripts/generate-og-image.ts`
 */
import sharp from "sharp";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const OUT = resolve(ROOT, "public", "og.png");

const W = 1200;
const H = 630;
const BG = "#0a0a0a";
const FG = "#ffffff";
const BRAND = "#10b981";
const MUTED = "#94a3b8";

// Inline SVG with system fonts — sharp will rasterize via librsvg.
const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f0f0f"/>
      <stop offset="1" stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#10b981"/>
      <stop offset="1" stop-color="#34d399"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${BRAND}" stop-opacity="0.15"/>
      <stop offset="1" stop-color="${BRAND}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <circle cx="${W * 0.78}" cy="${H * 0.28}" r="280" fill="url(#glow)"/>

  <!-- Subtle grid -->
  <g opacity="0.04" stroke="${FG}" stroke-width="1">
    <line x1="0" y1="${H * 0.5}" x2="${W}" y2="${H * 0.5}"/>
    <line x1="${W * 0.5}" y1="0" x2="${W * 0.5}" y2="${H}"/>
  </g>

  <!-- Brand pill -->
  <g transform="translate(80, 80)">
    <rect width="220" height="46" rx="23" fill="${BRAND}" fill-opacity="0.12" stroke="${BRAND}" stroke-opacity="0.4" stroke-width="1"/>
    <text x="110" y="29" text-anchor="middle" font-size="20" font-weight="600" fill="${BRAND}" letter-spacing="1.5">ROYCSS · v2</text>
  </g>

  <!-- Headline -->
  <text x="80" y="250" font-size="78" font-weight="800" fill="${FG}" letter-spacing="-2">AI-Native Frontend</text>
  <text x="80" y="335" font-size="78" font-weight="800" fill="url(#brandGrad)" letter-spacing="-2">Engineering Platform</text>

  <!-- Subtitle -->
  <text x="80" y="390" font-size="22" fill="${MUTED}">Production-ready CSS effects · AI-native tools · Design systems</text>

  <!-- Stats row -->
  <g transform="translate(80, 460)">
    <!-- Stat 1 -->
    <g>
      <text x="0" y="36" font-size="38" font-weight="700" fill="${FG}">1,749</text>
      <text x="0" y="64" font-size="15" fill="${MUTED}">CSS EFFECTS</text>
    </g>
    <!-- Divider -->
    <rect x="180" y="10" width="2" height="60" fill="${BRAND}" fill-opacity="0.3"/>
    <!-- Stat 2 -->
    <g transform="translate(210, 0)">
      <text x="0" y="36" font-size="38" font-weight="700" fill="${FG}">62</text>
      <text x="0" y="64" font-size="15" fill="${MUTED}">PLATFORM PRODUCTS</text>
    </g>
    <!-- Divider -->
    <rect x="320" y="10" width="2" height="60" fill="${BRAND}" fill-opacity="0.3"/>
    <!-- Stat 3 -->
    <g transform="translate(350, 0)">
      <text x="0" y="36" font-size="38" font-weight="700" fill="${FG}">68</text>
      <text x="0" y="64" font-size="15" fill="${MUTED}">DEVELOPER TOOLS</text>
    </g>
    <!-- Divider -->
    <rect x="460" y="10" width="2" height="60" fill="${BRAND}" fill-opacity="0.3"/>
    <!-- Stat 4 -->
    <g transform="translate(490, 0)">
      <text x="0" y="36" font-size="38" font-weight="700" fill="${FG}">100%</text>
      <text x="0" y="64" font-size="15" fill="${MUTED}">OPEN SOURCE</text>
    </g>
  </g>

  <!-- Bottom-right URL pill -->
  <g transform="translate(${W - 240}, ${H - 90})">
    <rect width="160" height="48" rx="24" fill="${BRAND}"/>
    <text x="80" y="31" text-anchor="middle" font-size="20" font-weight="600" fill="#ffffff">roycss.com</text>
  </g>

  <!-- Top-left Z mark badge -->
  <g transform="translate(960, 90)">
    <rect width="160" height="160" rx="32" fill="${BRAND}" fill-opacity="0.08" stroke="${BRAND}" stroke-opacity="0.4"/>
    <path d="M50 50 L110 50 L50 110 L110 110" stroke="${FG}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>`;

async function main(): Promise<void> {
  await sharp(Buffer.from(ogSvg), { density: 144 })
    .resize(W, H, { fit: "cover", position: "center" })
    .png({ compressionLevel: 9, quality: 92 })
    .toFile(OUT);
  console.log(`✅ Generated ${OUT} (${W}×${H})`);
}

main().catch((err) => {
  console.error("❌ OG image generation failed:", err);
  process.exit(1);
});
