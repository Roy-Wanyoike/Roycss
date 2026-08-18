/**
 * Generate PWA icon set (192, 512, maskable 512) from the source logo SVG.
 *
 * PWA best practices (per web.dev/install-criteria + Lighthouse PWA audit):
 *   - 192×192 PNG (purpose: "any") — required by manifest
 *   - 512×512 PNG (purpose: "any") — required by manifest
 *   - 512×512 PNG maskable (purpose: "maskable") — Android adaptive icon
 *   - apple-touch-icon (180×180) — iOS home screen
 *
 * Why: Chrome's installability criteria require BOTH a 192 and a 512 icon.
 * Without them, Lighthouse PWA audit fails and `beforeinstallprompt` never
 * fires — users can't install the app. The current manifest only has 1024×1024
 * icons, which Lighthouse treats as insufficient.
 *
 * Usage: bun run scripts/generate-pwa-icons.ts
 */
import sharp from "sharp";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

/**
 * Source SVG — a "tile" version of the RoyCSS logo:
 *   - Solid dark background (matches PWA background_color #0a0a0a)
 *   - Centered RoyCSS mark (the white Z-like zigzag from logo.svg)
 *   - Maskable variant has 18% safe-zone padding (per Material spec)
 *
 * The mark sits inside a 60% box in the center — within the 80% maskable
 * safe zone — so the icon doesn't get cropped on Android adaptive displays.
 */
function markSvg(opts: { padded: boolean }): string {
  const innerSize = opts.padded ? 0.60 : 0.74; // 60% (maskable safe) vs 74% (any)
  const inner = 30 * innerSize;
  const offset = (30 - inner) / 2;
  return `<svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
  <rect width="30" height="30" fill="#0a0a0a"/>
  <g transform="translate(${offset}, ${offset}) scale(${innerSize})">
    <path d="M15.47,7.1l-1.3,1.85c-0.2,0.29-0.54,0.47-0.9,0.47h-7.1V7.09C6.16,7.1,15.47,7.1,15.47,7.1z"
          fill="#fafafa"/>
    <polygon points="24.3,7.1 13.14,22.91 5.7,22.91 16.86,7.1"
             fill="#34d399"/>
    <path d="M14.53,22.91l1.31-1.86c0.2-0.29,0.54-0.47,0.9-0.47h7.09v2.33H14.53z"
          fill="#fafafa"/>
  </g>
</svg>`;
}

const ICONS = [
  { name: "icon-192.png", size: 192, padded: false },
  { name: "icon-512.png", size: 512, padded: false },
  { name: "icon-maskable-192.png", size: 192, padded: true },
  { name: "icon-maskable-512.png", size: 512, padded: true },
  { name: "apple-touch-icon.png", size: 180, padded: false },
];

async function main() {
  if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

  const results: { name: string; size: number; bytes: number }[] = [];

  for (const { name, size, padded } of ICONS) {
    const svg = Buffer.from(markSvg({ padded }));
    const png = await sharp(svg, { density: 384 })
      .resize(size, size, { fit: "contain", background: "#0a0a0a" })
      .png({ quality: 92, compressionLevel: 9 })
      .toBuffer();
    const outPath = join(PUBLIC_DIR, name);
    writeFileSync(outPath, png);
    results.push({ name, size, bytes: png.length });
  }

  // Also regenerate favicon at multiple sizes inside one .ico isn't worth
  // the tooling; keep favicon.png as the 1024 master (already present) and
  // let manifest reference the 192 + 512 set we just generated.

  console.log("✓ Generated PWA icons:");
  for (const r of results) {
    console.log(`  - ${r.name}: ${r.size}×${r.size} (${(r.bytes / 1024).toFixed(1)}KB)`);
  }
}

main().catch((err) => {
  console.error("Failed to generate PWA icons:", err);
  process.exit(1);
});
