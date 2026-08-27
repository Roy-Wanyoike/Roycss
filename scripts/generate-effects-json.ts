/**
 * Generate dist/effects.json from the live TypeScript effects array.
 *
 * The backend's `effects` service (`backend/src/modules/effects/service.ts`)
 * reads `dist/effects.json` at boot via `EFFECTS_DATA_PATH` (default
 * `../dist/effects.json`). The previous file shipped 1,569 effects across
 * 20 categories; the current TypeScript source ships 1,809 effects across
 * 32 categories (see `src/lib/roycss-effects.ts`).
 *
 * This script regenerates the JSON from the canonical source so the backend
 * and the frontend never drift. Run it after every effect catalog change:
 *
 *   bun run scripts/generate-effects-json.ts
 *
 * The output is the full effects array (id, name, category, description,
 * tags, cssCode, previewType, previewText?, childCount?). The backend's
 * `EffectSchema` marks `cssCode` optional — we include it so the inspector
 * and the "copy CSS" features can read straight from the backend response
 * without falling back to the TypeScript source.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { effects } from "../src/lib/roycss-effects";

const OUTPUT_PATH = resolve(process.cwd(), "dist/effects.json");

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(effects));

const categories = new Set(effects.map((e) => e.category));
console.log(`Generated dist/effects.json with ${effects.length} effects`);
console.log(`  ${categories.size} categories: ${[...categories].sort().join(", ")}`);
