
/**
 * Generate RoyCSS build artifacts.
 *
 * Reads effects from src/lib/roycss-effects and generates:
 *
 * 1. dist/class-index.json
 *    Class names, categories, effect IDs and CSS properties.
 *
 * 2. dist/motion-library.json
 *    Motion-related effects and their metadata.
 *
 * 3. dist/pro-components.json
 *    Internal Pro component metadata.
 *
 * Usage:
 * bun run scripts/generate-build-artifacts.ts
 */

// --------------------------------------------------
// Imports
// --------------------------------------------------

import {
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from "node:fs";

import {
  join,
  basename,
  extname,
  dirname,
  resolve,
} from "node:path";

import { fileURLToPath } from "node:url";

import { effects } from "../src/lib/roycss-effects";
import type { EffectCategory } from "../src/lib/roycss-types";

// --------------------------------------------------
// Project paths
// --------------------------------------------------

// Resolve the actual script directory.
// Compatible with Windows, Linux and macOS.

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const ROOT = resolve(SCRIPT_DIR, "..");

const DIST_DIR = join(ROOT, "dist");

const PRO_DIR = join(
  ROOT,
  "src",
  "components",
  "roycss",
  "pro"
);

// --------------------------------------------------
// Motion categories
// --------------------------------------------------

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

// --------------------------------------------------
// Types
// --------------------------------------------------

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

// --------------------------------------------------
// CSS class parser
// --------------------------------------------------

/**
 * Extract CSS class rules.
 *
 * Matches selectors such as:
 *
 * .foo {
 *   color: red;
 * }
 *
 * Returns the class name and its CSS properties.
 */
function parseClassRules(
  css: string
): Array<{
  className: string;
  properties: string;
}> {
  const re = /\.([\w-]+)\s*\{([^}]*)\}/g;

  const out: Array<{
    className: string;
    properties: string;
  }> = [];

  let match: RegExpExecArray | null;

  while ((match = re.exec(css)) !== null) {
    out.push({
      className: match[1]!,
      properties: match[2]!.trim(),
    });
  }

  return out;
}

// --------------------------------------------------
// Class index generator
// --------------------------------------------------

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

// --------------------------------------------------
// Motion library generator
// --------------------------------------------------

function buildMotionLibrary() {
  return effects
    .filter((effect) =>
      MOTION_CATEGORIES.includes(effect.category)
    )
    .map((effect) => ({
      id: effect.id,
      name: effect.name,
      category: effect.category,
      description: effect.description,
      tags: effect.tags,
      previewType: effect.previewType,
      previewText: effect.previewText || null,
      childCount: effect.childCount || null,

      // Include raw CSS for downstream motion services.
      cssCode: effect.cssCode,
    }));
}

// --------------------------------------------------
// Pro components generator
// --------------------------------------------------

function buildProComponents(): ProComponentEntry[] {
  if (!existsSync(PRO_DIR)) {
    console.warn(
      `⚠ Pro components directory not found: ${PRO_DIR}`
    );

    return [];
  }

  const files = readdirSync(PRO_DIR).filter(
    (file) => extname(file) === ".tsx"
  );

  return files.map((file) => {
    const base = basename(file, ".tsx");

    // Convert kebab-case to Title Case.
    const name = base
      .split("-")
      .map((part) =>
        part.length === 0
          ? part
          : part[0]!.toUpperCase() + part.slice(1)
      )
      .join(" ");

    return {
      id: base,
      name,
      path: `src/components/roycss/pro/${file}`,
    };
  });
}

// --------------------------------------------------
// JSON writer
// --------------------------------------------------

function writeJson(
  filename: string,
  data: unknown
): void {
  const outputPath = join(DIST_DIR, filename);

  const json = JSON.stringify(data, null, 2);

  writeFileSync(outputPath, json, "utf-8");

  const sizeKb = (
    Buffer.byteLength(json, "utf-8") / 1024
  ).toFixed(1);

  const count = Array.isArray(data)
    ? data.length
    : 1;

  console.log(
    `  ✓ dist/${filename} (${count} entries, ${sizeKb}KB)`
  );
}

// --------------------------------------------------
// Build validation
// --------------------------------------------------

function validateBuild(): void {
  if (!Array.isArray(effects) || effects.length === 0) {
    throw new Error(
      "RoyCSS effects catalog is empty. Cannot generate build artifacts."
    );
  }

  console.log(`  Effects loaded: ${effects.length}`);

  if (!existsSync(ROOT)) {
    throw new Error(
      `Project root does not exist: ${ROOT}`
    );
  }

  console.log(`  Project root: ${ROOT}`);
  console.log(`  Output directory: ${DIST_DIR}`);
}

// --------------------------------------------------
// Main
// --------------------------------------------------

function main(): void {
  console.log("");
  console.log("Generating RoyCSS build artifacts...");
  console.log("--------------------------------------");

  validateBuild();

  // Ensure the root dist directory exists.
  mkdirSync(DIST_DIR, { recursive: true });

  // 1. Generate class index.
  console.log("");
  console.log("Generating class index...");

  const classIndex = buildClassIndex();

  writeJson("class-index.json", classIndex);

  // 2. Generate motion library.
  console.log("");
  console.log("Generating motion library...");

  const motionLibrary = buildMotionLibrary();

  writeJson("motion-library.json", motionLibrary);

  // 3. Generate Pro components.
  console.log("");
  console.log("Generating Pro components...");

  const proComponents = buildProComponents();

  writeJson("pro-components.json", proComponents);

  // Completion summary.
  console.log("");
  console.log("--------------------------------------");
  console.log("✅ RoyCSS build artifacts generated!");
  console.log("");
  console.log(`  Effects: ${effects.length}`);
  console.log(`  Class index entries: ${classIndex.length}`);
  console.log(`  Motion effects: ${motionLibrary.length}`);
  console.log(`  Pro components: ${proComponents.length}`);
  console.log("");
  console.log(`  Output: ${DIST_DIR}`);
  console.log("");
}

// --------------------------------------------------
// Execute
// --------------------------------------------------

try {
  main();
} catch (error) {
  console.error("");
  console.error("❌ RoyCSS build artifact generation failed.");
  console.error("");

  if (error instanceof Error) {
    console.error(error.message);
    console.error(error.stack);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
}
