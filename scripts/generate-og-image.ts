/**
 * Generate the OG image (1200×630 PNG) from an SVG source using sharp.
 *
 * Why: `next/og` (ImageResponse / Satori) requires wasm binaries that
 * crash silently under Turbopack dev mode in this sandbox. Rendering the
 * SVG → PNG once via sharp is rock-solid and yields a small (~30KB) static
 * file that loads instantly for crawlers.
 *
 * Output: public/og.png
 *
 * Usage: bun run scripts/generate-og-image.ts
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const SVG = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="title-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fafafa"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#10b981" stroke-width="0.5" opacity="0.18"/>
    </pattern>
    <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Aura circles -->
  <circle cx="100" cy="530" r="200" fill="#10b981" opacity="0.08" filter="url(#soft-glow)"/>
  <circle cx="1100" cy="100" r="160" fill="#34d399" opacity="0.06" filter="url(#soft-glow)"/>

  <!-- Brand pill -->
  <g transform="translate(490, 80)">
    <rect width="220" height="42" rx="21" fill="#10b981" fill-opacity="0.15" stroke="#34d399" stroke-opacity="0.4" stroke-width="1"/>
    <text x="110" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#34d399" text-anchor="middle" letter-spacing="2">◆ ROYCSS PLATFORM</text>
  </g>

  <!-- Main title -->
  <text x="600" y="240" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="78" font-weight="800" fill="url(#title-grad)" text-anchor="middle" letter-spacing="-2">AI-Native Frontend</text>
  <text x="600" y="320" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="78" font-weight="800" fill="#fafafa" text-anchor="middle" letter-spacing="-2">Engineering Platform</text>

  <!-- Stats row -->
  <g font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#d1d5db">
    <text x="170" y="420" text-anchor="middle"><tspan fill="#34d399" font-weight="700">1,749</tspan> Effects</text>
    <text x="375" y="420" text-anchor="middle" fill="#374151">•</text>
    <text x="475" y="420" text-anchor="middle"><tspan fill="#34d399" font-weight="700">62</tspan> Products</text>
    <text x="650" y="420" text-anchor="middle" fill="#374151">•</text>
    <text x="760" y="420" text-anchor="middle"><tspan fill="#34d399" font-weight="700">68</tspan> DevTools</text>
    <text x="925" y="420" text-anchor="middle" fill="#374151">•</text>
    <text x="1030" y="420" text-anchor="middle"><tspan fill="#34d399" font-weight="700">AI</tspan> Assistance</text>
  </g>

  <!-- Bottom row -->
  <g transform="translate(420, 530)">
    <rect width="180" height="44" rx="22" fill="#10b981"/>
    <text x="90" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#0a0a0a" text-anchor="middle">roycss.com</text>
    <text x="200" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#9ca3af">by Royford Wanyoike Wamaitha</text>
  </g>
</svg>`;

const OUT_PATH = join(import.meta.dir, "..", "public", "og.png");

async function main() {
  const png = await sharp(Buffer.from(SVG), { density: 144 })
    .png({ quality: 92, compressionLevel: 9 })
    .toBuffer();

  writeFileSync(OUT_PATH, png);
  console.log(`✓ Generated ${OUT_PATH} (${(png.length / 1024).toFixed(1)}KB)`);
}

main().catch((err) => {
  console.error("Failed to generate OG image:", err);
  process.exit(1);
});
