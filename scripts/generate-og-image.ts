import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(import.meta.dir, "..", "public");

const SVG = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F1729"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fafafa"/>
      <stop offset="100%" stop-color="#00A8FF"/>
    </linearGradient>
    <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#00A8FF"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Logo mark -->
  <g transform="translate(80, 50) scale(0.75)">
    <rect width="120" height="120" rx="28" fill="#0F1729" stroke="#8B5CF6" stroke-width="2" opacity="0.9"/>
    <rect x="30" y="28" width="14" height="64" rx="7" fill="url(#logo-grad)"/>
    <path d="M44 28 L64 28 C78 28 84 36 84 46 C84 56 78 64 64 64 L44 64" stroke="url(#logo-grad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M46 64 L82 92" stroke="url(#logo-grad)" stroke-width="14" stroke-linecap="round"/>
    <path d="M64 40 C60 40 60 44 56 44 C52 44 52 48 52 52 C52 56 52 60 56 60 C60 60 60 64 64 64" stroke="#00A8FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.8"/>
    <path d="M72 40 C76 40 76 44 80 44 C84 44 84 48 84 52 C84 56 84 60 80 60 C76 60 76 64 72 64" stroke="#00A8FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.8"/>
    <circle cx="68" cy="52" r="2" fill="#00A8FF" opacity="0.6"/>
  </g>
  <text x="220" y="125" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#00A8FF" letter-spacing="2">ROYCSS</text>

  <!-- Title -->
  <text x="80" y="300" font-family="system-ui, sans-serif" font-size="72" font-weight="800" fill="url(#text-grad)" letter-spacing="-2">AI-Native Frontend</text>
  <text x="80" y="380" font-family="system-ui, sans-serif" font-size="72" font-weight="800" fill="#fafafa" letter-spacing="-2">Engineering Platform</text>

  <!-- Stats -->
  <text x="80" y="470" font-family="system-ui, sans-serif" font-size="22" fill="#9ca3af">
    <tspan fill="#00A8FF" font-weight="700">1,959</tspan> Effects · <tspan fill="#00A8FF" font-weight="700">62</tspan> Products · <tspan fill="#00A8FF" font-weight="700">68</tspan> DevTools · <tspan fill="#00A8FF" font-weight="700">AI</tspan> Assistance
  </text>

  <!-- Bottom -->
  <rect x="80" y="520" width="160" height="44" rx="22" fill="#00A8FF"/>
  <text x="160" y="549" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="#0F1729" text-anchor="middle">roycss.com</text>
  <text x="260" y="549" font-family="system-ui, sans-serif" font-size="18" fill="#9ca3af">by Royford Wanyoike Wamaitha</text>
</svg>`;

async function main() {
  const png = await sharp(Buffer.from(SVG), { density: 144 })
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(PUBLIC_DIR, "og.png"), png);
  console.log(`✓ Generated og.png (${(png.length / 1024).toFixed(1)}KB)`);
}
main().catch((err) => { console.error("Failed:", err); process.exit(1); });
