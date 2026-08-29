/**
 * Generate all logo assets from the SVG source.
 * Uses sharp to convert SVG → PNG at various sizes.
 *
 * Output:
 *   public/favicon.png         (1024×1024 — master)
 *   public/apple-icon.png      (1024×1024 — Apple touch icon)
 *   public/apple-touch-icon.png (180×180)
 *   public/icon-192.png        (192×192 — PWA)
 *   public/icon-512.png        (512×512 — PWA)
 *   public/icon-maskable-192.png
 *   public/icon-maskable-512.png
 *   public/roycss-logo-mark.png (512×512 — brand mark)
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";
import { readFileSync } from "fs";

const PUBLIC_DIR = join(import.meta.dir, "..", "public");

// Read the SVG logo
const svgBuffer = readFileSync(join(PUBLIC_DIR, "logo.svg"));

// Logo sizes to generate
const SIZES = [
  { name: "favicon.png",         size: 1024 },
  { name: "apple-icon.png",     size: 1024 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png",       size: 192 },
  { name: "icon-512.png",       size: 512 },
  { name: "icon-maskable-192.png", size: 192 },
  { name: "icon-maskable-512.png", size: 512 },
  { name: "roycss-logo-mark.png", size: 512 },
];

async function main() {
  for (const { name, size } of SIZES) {
    const png = await sharp(svgBuffer, { density: 384 })
      .resize(size, size, { fit: "contain", background: "#0a0a0a" })
      .png({ quality: 95, compressionLevel: 9 })
      .toBuffer();
    writeFileSync(join(PUBLIC_DIR, name), png);
    console.log(`  ✓ ${name} (${size}×${size}, ${(png.length / 1024).toFixed(1)}KB)`);
  }
  console.log("✅ All logo assets generated");
}

main().catch((err) => { console.error("Failed:", err); process.exit(1); });
