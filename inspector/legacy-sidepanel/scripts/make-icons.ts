/**
 * Generate the three Inspector icons (16×16, 48×48, 128×128) as PNGs.
 *
 * Uses the `sharp` library already installed in the parent project. The icon
 * is a stylized "R" mark in RoyCSS emerald on a transparent background, with
 * a subtle "scope" ring around it to suggest "inspector".
 *
 * Run: `bun run inspector/scripts/make-icons.ts`
 */

import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const ICONS_DIR = join(import.meta.dir, "..", "icons");

interface IconSpec {
  size: number;
  file: string;
}

const specs: IconSpec[] = [
  { size: 16, file: "icon16.png" },
  { size: 48, file: "icon48.png" },
  { size: 128, file: "icon128.png" },
];

/** Build an SVG icon at the requested size. */
function buildSvg(size: number): string {
  // The viewBox is always 128×128; we scale via width/height on the <svg>.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="oklch(0.7 0.16 162)"/>
      <stop offset="1" stop-color="oklch(0.55 0.12 200)"/>
    </linearGradient>
  </defs>
  <!-- Rounded-square background -->
  <rect x="6" y="6" width="116" height="116" rx="24" fill="url(#bg)"/>
  <!-- Inspector scope ring (subtle, white at low opacity) -->
  <circle cx="64" cy="64" r="44" fill="none" stroke="white" stroke-opacity="0.3" stroke-width="3"/>
  <circle cx="64" cy="64" r="44" fill="none" stroke="white" stroke-opacity="0.15" stroke-width="1" stroke-dasharray="4 6"/>
  <!-- RoyCSS "R" mark -->
  <text x="64" y="78" font-family="system-ui, -apple-system, sans-serif" font-size="68" font-weight="800" fill="oklch(0.16 0.02 162)" text-anchor="middle">R</text>
  <!-- Crosshair tick -->
  <line x1="64" y1="14" x2="64" y2="22" stroke="white" stroke-opacity="0.6" stroke-width="2" stroke-linecap="round"/>
  <line x1="64" y1="106" x2="64" y2="114" stroke="white" stroke-opacity="0.6" stroke-width="2" stroke-linecap="round"/>
  <line x1="14" y1="64" x2="22" y2="64" stroke="white" stroke-opacity="0.6" stroke-width="2" stroke-linecap="round"/>
  <line x1="106" y1="64" x2="114" y2="64" stroke="white" stroke-opacity="0.6" stroke-width="2" stroke-linecap="round"/>
</svg>`;
}

async function main(): Promise<void> {
  for (const spec of specs) {
    const svg = buildSvg(spec.size);
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    const outPath = join(ICONS_DIR, spec.file);
    writeFileSync(outPath, png);
    console.log(`  ✓ ${spec.file} (${spec.size}×${spec.size}, ${png.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
