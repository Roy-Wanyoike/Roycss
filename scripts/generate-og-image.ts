/**
 * Generate the OG image (1200×630 PNG) using sharp.
 * Uses the new RoyCSS logo + branding colors.
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(import.meta.dir, "..", "public");

const SVG = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fafafa"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle grid -->
  <g opacity="0.06">
    ${Array.from({ length: 25 }, (_, i) => `<line x1="${i * 48}" y1="0" x2="${i * 48}" y2="630" stroke="#10b981" stroke-width="0.5"/>`).join("")}
    ${Array.from({ length: 14 }, (_, i) => `<line x1="0" y1="${i * 48}" x2="1200" y2="${i * 48}" stroke="#10b981" stroke-width="0.5"/>`).join("")}
  </g>

  <!-- Logo mark (top-left) -->
  <g transform="translate(80, 60) scale(0.8)">
    <rect width="120" height="120" rx="28" fill="#0a0a0a" stroke="#10b981" stroke-width="2" opacity="0.9"/>
    <rect x="32" y="28" width="12" height="64" rx="6" fill="url(#logo-grad)"/>
    <path d="M44 28 L66 28 C78 28 84 36 84 46 C84 56 78 64 66 64 L44 64" stroke="url(#logo-grad)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M48 64 L80 92" stroke="url(#logo-grad)" stroke-width="12" stroke-linecap="round"/>
    <circle cx="96" cy="92" r="5" fill="#34d399"/>
  </g>
  <text x="220" y="130" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#34d399" letter-spacing="2">ROYCSS</text>

  <!-- Main title -->
  <text x="80" y="300" font-family="system-ui, sans-serif" font-size="72" font-weight="800" fill="url(#text-grad)" letter-spacing="-2">AI-Native Frontend</text>
  <text x="80" y="380" font-family="system-ui, sans-serif" font-size="72" font-weight="800" fill="#fafafa" letter-spacing="-2">Engineering Platform</text>

  <!-- Stats -->
  <text x="80" y="470" font-family="system-ui, sans-serif" font-size="22" fill="#9ca3af">
    <tspan fill="#34d399" font-weight="700">1,749</tspan> Effects · <tspan fill="#34d399" font-weight="700">62</tspan> Products · <tspan fill="#34d399" font-weight="700">68</tspan> DevTools · <tspan fill="#34d399" font-weight="700">AI</tspan> Assistance
  </text>

  <!-- Bottom bar -->
  <rect x="80" y="520" width="160" height="44" rx="22" fill="#10b981"/>
  <text x="160" y="549" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="#0a0a0a" text-anchor="middle">roycss.com</text>
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
