/**
 * Copy non-TypeScript assets into dist/ after the TS build.
 *
 * Files copied:
 *   - manifest.json
 *   - src/popup.html
 *   - src/popup.css
 *   - src/sidepanel.html
 *   - src/sidepanel.css
 *   - src/effects-data.json
 *   - icons/icon16.png, icon48.png, icon128.png
 *
 * The dist/ layout is what Chrome loads via "Load unpacked". Paths in
 * manifest.json are relative to dist/, so we keep src/* at dist/src/*.
 */

import { cpSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, ".."); // inspector/ root (parent of scripts/)
const DIST = join(ROOT, "dist");

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
  cpSync(src, dest);
  console.log(`  ✓ ${src.replace(ROOT + "/", "")} → ${dest.replace(DIST + "/", "")}`);
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    if (statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      cpSync(s, d);
    }
  }
  console.log(`  ✓ ${src.replace(ROOT + "/", "")}/ → ${dest.replace(DIST + "/", "")}/`);
}

function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ does not exist. Run `bun run build:ts` first.");
    process.exit(1);
  }

  console.log("Copying assets → dist/...");

  // manifest.json → dist/manifest.json
  copyFile(join(ROOT, "manifest.json"), join(DIST, "manifest.json"));

  // src/*.html, src/*.css, src/effects-data.json → dist/src/
  const srcDir = join(ROOT, "src");
  const distSrcDir = join(DIST, "src");
  ensureDir(distSrcDir);
  for (const entry of readdirSync(srcDir)) {
    const full = join(srcDir, entry);
    if (statSync(full).isFile() && /\.(html|css|json)$/.test(entry)) {
      copyFile(full, join(distSrcDir, entry));
    }
  }

  // icons/ → dist/icons/
  copyDir(join(ROOT, "icons"), join(DIST, "icons"));

  console.log("");
  console.log("✅ Assets copied. Load dist/ in chrome://extensions.");
}

main();
