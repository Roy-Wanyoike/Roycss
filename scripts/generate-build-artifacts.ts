/**
 * Generate build artifacts.
 *
 * Reads the RoyCSS effects source (from `src/lib/roycss-effects`)
 * and produces three derived JSON artifacts in `dist/`:
 *
 *   1. dist/class-index.json
 *      Array of `{ className, category, effectId, properties }`. Each
 *      effect's `cssCode` is scanned for top-level class selectors of
 *      the form `.foo { ... }` and one row is emitted per match.
 *
 *   2. dist/motion-library.json
 *      Array of effects whose `category` is in the motion-related set
 *      `"animations", "hover", "scroll", "page-transitions",
 *      "particles", "microinteractions", "status-state", "cursor"`.
 *      The output shape matches `dist/effects.json`'s metadata format.
 *
 *   3. dist/pro-components.json
 *      Array of `{ id, name, path }` rows derived from listing
 *      `src/components/roycss/pro/*.tsx`. INTERNAL — read at runtime by
 *      the backend-node pro-components service; excluded from the npm
 *      tarball via the `!dist/pro-components.json` negation in
 *      package.json `files`.
 *
 * (dist/version-manifest.json is intentionally NOT generated anymore:
 * nothing reads it — the backend version service degrades gracefully
 * to its defaults when the artifact is absent.)
 *
 * Usage: `bun run scripts/generate-build-artifacts.ts` — typically
 * invoked at the end of `scripts/build-package.ts`.
 */
import { writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename, extname } from "node:path";

import { effects } from "../src/lib/roycss-effects";
import type { EffectCategory } from "../src/lib/roycss-types";

const ROOT = import.meta.dir.replace(/\/scripts$/, "");
const DIST_DIR = join(ROOT, "dist");
const PRO_DIR = join(ROOT, "src", "components", "roycss", "pro");

const MOTION_CATEGORIES: EffectCategory[] = [
  "animations",
  "hover",
  "scroll",
  "page-transitions",
  "particles",
  "microinteractions",
  "status-state",
  "cursor",
];

interface ClassIndexEntry {
  className: string;
  category: string;
  effectId: string;
  properties: string;
}

interface ProComponentEntry {
  id: string;
  name: string;
  path: string;
}

/** Parse `\.([\w-]+)\s*\{([^}]*)\}` from a CSS string. */
function parseClassRules(css: string): Array<{ className: string; properties: string }> {
  const re = /\.([\w-]+)\s*\{([^}]*)\}/g;
  const out: Array<{ className: string; properties: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    out.push({ className: m[1]!, properties: m[2]!.trim() });
  }
  return out;
}

function buildClassIndex(): ClassIndexEntry[] {
  const entries: ClassIndexEntry[] = [];
  for (const effect of effects) {
    if (!effect.cssCode) continue;
    const rules = parseClassRules(effect.cssCode);
    for (const rule of rules) {
      entries.push({
        className: rule.className,
        category: effect.category,
        effectId: effect.id,
        properties: rule.properties,
      });
    }
  }
  return entries;
}

function buildMotionLibrary() {
  return effects
    .filter((e) => MOTION_CATEGORIES.includes(e.category))
    .map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      description: e.description,
      tags: e.tags,
      previewType: e.previewType,
      previewText: e.previewText || null,
      childCount: e.childCount || null,
      // Include the raw cssCode so downstream consumers (Roy Motion
      // service) can extract duration / easing / keyframes via regex
      // without re-reading the TypeScript source.
      cssCode: e.cssCode,
    }));
}

function buildProComponents(): ProComponentEntry[] {
  if (!existsSync(PRO_DIR)) return [];
  const files = readdirSync(PRO_DIR).filter((f) => extname(f) === ".tsx");
  return files.map((f) => {
    const base = basename(f, ".tsx");
    // Convert kebab-case to Title Case for the human-readable name.
    const name = base
      .split("-")
      .map((part) => (part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
      .join(" ");
    return {
      id: base,
      name,
      path: `src/components/roycss/pro/${f}`,
    };
  });
}

function writeJson(filename: string, data: unknown): void {
  const path = join(DIST_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
  const sizeKb = (Buffer.byteLength(JSON.stringify(data)) / 1024).toFixed(1);
  const count = Array.isArray(data) ? data.length : 1;
  console.log(`  ✓ dist/${filename} (${count} entries, ${sizeKb}KB)`);
}

function main(): void {
  console.log("Generating build artifacts...");

  const classIndex = buildClassIndex();
  writeJson("class-index.json", classIndex);

  const motionLibrary = buildMotionLibrary();
  writeJson("motion-library.json", motionLibrary);

  const proComponents = buildProComponents();
  writeJson("pro-components.json", proComponents);

  console.log("");
  console.log("✅ Build artifacts generated!");
}

main();
