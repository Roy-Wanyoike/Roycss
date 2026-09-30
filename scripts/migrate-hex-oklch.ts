/**
 * migrate-hex-oklch.ts — one-shot catalog color migration (issue #273).
 *
 * Converts remaining sRGB hex literals inside `cssCode` blocks of
 * src/lib/effects-batch-*.ts to hue-preserving oklch() values, and remaps
 * the batch-39 (data-viz) indigo/blue cluster to the accent design-token
 * hue (200) per CONTRIBUTING rule 7 ("Use OKLCH colors — no indigo or blue
 * as primary. Reference src/lib/design-tokens.ts").
 *
 * Conversion math is byte-compatible with scripts/migrate-colors.ts (the
 * catalog's original hex→oklch pass): exact sRGB → OKLab → LCH with
 * L/C rounded to 3 decimals and H to 2.
 *
 * Skipped on purpose (not colors):
 *   - CSS comments (/* ... *\/) — e.g. batch-53/54 "(#214)" issue refs
 *   - string literals ("…" / '…') — e.g. batch-48's content: "#FF3030"
 *     typewriter effect, which DISPLAYS hex codes as text
 *
 * Idempotent: re-running after migration finds no hex and changes nothing.
 *
 * Run: bun run scripts/migrate-hex-oklch.ts [--check]
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

/* ─── sRGB hex → OKLCH (matches scripts/migrate-colors.ts) ─────────── */

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

interface Oklch {
  L: number;
  C: number;
  H: number;
}

function hexToOklch(hex: string): Oklch {
  let h = hex.replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
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
  return {
    L: Math.round(L * 1000) / 1000,
    C: Math.round(C * 1000) / 1000,
    H: Math.round(H * 100) / 100,
  };
}

function fmt({ L, C, H }: Oklch, alpha?: string): string {
  const a = alpha !== undefined ? ` / ${alpha}` : "";
  return `oklch(${L} ${C} ${H}${a})`;
}

/* ─── batch-39 indigo/blue → accent token hue remap (issue #273) ───── */

/**
 * data-viz batch must not use indigo/blue (CONTRIBUTING rule 7). These are
 * remapped to the nearest design-token hue that is NOT blue and keeps the
 * dataviz series distinguishable: the accent token hue, 200
 * (design-tokens.ts → accent: oklch(0.72 0.15 200)). Original L/C are
 * preserved so the palette's value structure is untouched.
 */
const BATCH39_HUE_REMAP = new Set([
  "6366f1", // indigo-500
  "4f46e5", // indigo-600
  "818cf8", // indigo-400
  "93c5fd", // blue-300
]);
const ACCENT_TOKEN_HUE = 200;

function convertHex(css: string, file: string): string {
  const isB39 = file === "effects-batch-39.ts";
  return css.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (m) => {
    const ok = hexToOklch(m);
    if (isB39 && BATCH39_HUE_REMAP.has(m.slice(1).toLowerCase())) {
      return fmt({ ...ok, H: ACCENT_TOKEN_HUE });
    }
    return fmt(ok);
  });
}

function convertRgba(css: string, file: string): string {
  const isB39 = file === "effects-batch-39.ts";
  if (!isB39) return css;
  // rgba(99, 102, 241, a) — the #6366f1 indigo cluster's alpha forms.
  return css.replace(
    /rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*([\d.]+)\s*\)/g,
    (_m, a) => {
      const ok = hexToOklch("#6366f1");
      return fmt({ ...ok, H: ACCENT_TOKEN_HUE }, String(a));
    },
  );
}

/* ─── comment/string-aware segmenter ────────────────────────────────── */

/** Splits CSS into segments; returns parts and whether each is "code". */
function segment(css: string): Array<{ text: string; isCode: boolean }> {
  const parts: Array<{ text: string; isCode: boolean }> = [];
  const re = /\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    if (m.index > last) parts.push({ text: css.slice(last, m.index), isCode: true });
    parts.push({ text: m[0], isCode: false });
    last = m.index + m[0].length;
  }
  if (last < css.length) parts.push({ text: css.slice(last), isCode: true });
  return parts;
}

/* ─── main ──────────────────────────────────────────────────────────── */

const CHECK = process.argv.includes("--check");
const libDir = join(process.cwd(), "src", "lib");
const files = (await readdir(libDir))
  .filter((f) => /^effects-batch-\d+\.ts$/.test(f))
  .sort();

let touched = 0;
let converted = 0;
for (const file of files) {
  const path = join(libDir, file);
  const content = await readFile(path, "utf-8");
  const migrated = content.replace(
    /cssCode:\s*`([\s\S]*?)`/g,
    (_match, css: string) => {
      const parts = segment(css).map((p) =>
        p.isCode ? convertRgba(convertHex(p.text, file), file) : p.text,
      );
      const out = parts.join("");
      if (out !== css) converted++;
      return `cssCode: \`${out}\``;
    },
  );
  if (migrated !== content) {
    if (CHECK) {
      console.error(`  ✗ ${file}: hex/indigo literals remain`);
      process.exitCode = 1;
    } else {
      await writeFile(path, migrated, "utf-8");
      touched++;
      console.log(`  ✅ ${file}: migrated`);
    }
  }
}
if (!CHECK) {
  console.log(`\nDone: ${touched} files migrated, ${converted} cssCode blocks converted`);
} else if (process.exitCode !== 1) {
  console.log("check: clean — no convertible hex/indigo literals in cssCode");
}
