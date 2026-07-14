import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function hexToOklch(hex: string): string {
  let h = hex.replace(/^#/, "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bAxis = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(a * a + bAxis * bAxis);
  let H = (Math.atan2(bAxis, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return `oklch(${Math.round(L * 1000) / 1000} ${Math.round(C * 1000) / 1000} ${Math.round(H * 100) / 100})`;
}

function convertHexColors(css: string): string {
  const parts = css.split(/(url\([^)]+\)|data:[^"')\s]+)/gi);
  return parts.map((part, i) => {
    if (i % 2 === 1) return part;
    return part.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/gi, m => hexToOklch(m));
  }).join("");
}

function convertRgba(css: string): string {
  return css.replace(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+))?\s*\)/gi, (match, r, g, b, a) => {
    const ri = parseInt(r), gi = parseInt(g), bi = parseInt(b);
    const hex = `#${[ri, gi, bi].map(v => v.toString(16).padStart(2, "0")).join("")}`;
    const oklch = hexToOklch(hex);
    if (a === undefined) return oklch;
    return `color-mix(in oklch, ${oklch} ${Math.round(parseFloat(a) * 100)}%, transparent)`;
  });
}

async function main() {
  const libDir = join(process.cwd(), "src", "lib");
  const files = (await readdir(libDir)).filter(f => f.startsWith("effects-batch-") && f.endsWith(".ts")).sort();
  let total = 0;
  for (const file of files) {
    const content = await readFile(join(libDir, file), "utf-8");
    const migrated = content.replace(/cssCode:\s*`([\s\S]*?)`/g, (match, css) => {
      return `cssCode: \`${convertHexColors(convertRgba(css))}\``;
    });
    if (migrated !== content) {
      await writeFile(join(libDir, file), migrated, "utf-8");
      total++;
      console.log(`  ✅ ${file}: migrated`);
    }
  }
  console.log(`\nDone: ${total} files migrated`);
}
main().catch(console.error);
