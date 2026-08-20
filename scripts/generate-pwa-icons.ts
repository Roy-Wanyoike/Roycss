/**
 * RoyCSS PWA Icon Generator
 *
 * Generates 5 PNG icons from public/logo.svg using sharp:
 *   - icon-192.png           (192×192, "any")
 *   - icon-512.png           (512×512, "any")
 *   - icon-maskable-192.png  (192×192, "maskable" with padding)
 *   - icon-maskable-512.png  (512×512, "maskable" with padding)
 *   - apple-touch-icon.png   (180×180)
 *
 * Tile-style: dark background #0a0a0a + white RoyCSS "Z" mark centered.
 *
 * Usage: `bun run scripts/generate-pwa-icons.ts`
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const PUBLIC_DIR = resolve(ROOT, "public");
const SVG_LOGO = readFileSync(resolve(PUBLIC_DIR, "logo.svg"));

const DARK_BG = "#0a0a0a";

interface IconSpec {
  file: string;
  size: number;
  maskable?: boolean;
}

const ICONS: IconSpec[] = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-1024.png", size: 1024 },
  { file: "icon-maskable-192.png", size: 192, maskable: true },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180 },
];

/**
 * Build an SVG wrapper containing the logo mark on a dark tile background.
 * For maskable icons, the logo is inset 20% from the edges to satisfy
 * Chrome's safe-zone requirements.
 */
function buildTileSvg(size: number, maskable = false): string {
  const inset = maskable ? size * 0.2 : size * 0.08;
  const logoSize = size - inset * 2;

  // Embed original logo SVG (without XML prolog) inside an <svg> wrapper.
  const logoInner = SVG_LOGO.toString("utf-8")
    .replace(/<\?xml[^>]*\?>/, "")
    .replace(/<svg[^>]*>/, `<svg x="${inset}" y="${inset}" width="${logoSize}" height="${logoSize}" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">`);

  return `<?xml version="1.0" encoding="utf-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${DARK_BG}"/>
  ${logoInner}
</svg>`;
}

async function generateIcon(spec: IconSpec): Promise<void> {
  const outPath = resolve(PUBLIC_DIR, spec.file);
  const svg = Buffer.from(buildTileSvg(spec.size, spec.maskable === true));
  await sharp(svg, { density: 384 })
    .resize(spec.size, spec.size, { fit: "cover", position: "center" })
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(outPath);
  console.log(`  ✓ ${spec.file} (${spec.size}×${spec.size}${spec.maskable ? " maskable" : ""})`);
}

async function main(): Promise<void> {
  if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  console.log("🎨 Generating RoyCSS PWA icons…");
  for (const spec of ICONS) {
    await generateIcon(spec);
  }
  console.log(`✅ Generated ${ICONS.length} icons in /public`);
}

main().catch((err) => {
  console.error("❌ Icon generation failed:", err);
  process.exit(1);
});
