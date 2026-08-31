/**
 * Motion service — Roy Motion library catalog.
 *
 * Sources its effect catalog from the build artifact
 * `dist/motion-library.json` (produced by
 * `scripts/generate-build-artifacts.ts`). The artifact is a filtered
 * view of the master effects array restricted to motion-related
 * categories (animations, hover, scroll, page-transitions, particles,
 * microinteractions, status-state, cursor), and includes the raw
 * `cssCode` so duration / easing / keyframes can be derived here.
 *
 * Field-mapping: the artifact carries `{ id, name, category,
 * description, tags, previewType, previewText, childCount, cssCode }`.
 * The MotionEffect domain shape carries `{ id, name, category,
 * duration, easing, keyframes, cssCode }`. The category union
 * (entrance/exit/loop/scroll/hover/gesture) is derived from the
 * artifact's category via a small map; duration, easing, and
 * keyframes are extracted from `cssCode` via regex (with sensible
 * defaults when the regex doesn't match).
 *
 * All reads are LRU-cached. No mutation endpoints.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { MotionEffect } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("motion");

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = resolve(__dirname, "..", "..", "..");
const MOTION_LIBRARY_PATH = resolve(BACKEND_ROOT, "..", "dist", "motion-library.json");

const LIST_KEY = "motion:effects";
const detailKey = (id: string): string => `motion:effect:${id}`;
const PRESETS_KEY = "motion:presets";
const CATEGORIES_KEY = "motion:categories";

/** Raw artifact shape produced by generate-build-artifacts.ts. */
interface MotionArtifactEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  previewType: string;
  previewText: string | null;
  childCount: number | null;
  cssCode: string;
}

// Maps the artifact's effect-category (one of the motion-related
// categories from `MOTION_CATEGORIES` in the generate script) onto the
// MotionEffect domain's narrower union (entrance/exit/loop/scroll/
// hover/gesture).
const CATEGORY_MAP: Record<string, MotionEffect["category"]> = {
  animations: "loop",
  hover: "hover",
  scroll: "scroll",
  "page-transitions": "entrance",
  particles: "loop",
  microinteractions: "hover",
  "status-state": "loop",
  cursor: "gesture",
};

let cachedEffects: MotionEffect[] | null = null;

/** Load + cache the motion-library.json artifact. */
function loadEffects(): MotionEffect[] {
  if (cachedEffects) return cachedEffects;

  let raw: string;
  try {
    raw = readFileSync(MOTION_LIBRARY_PATH, "utf-8");
  } catch (err) {
    log.error(
      "Failed to read motion-library.json artifact — running with empty catalog",
      {
        path: MOTION_LIBRARY_PATH,
        err: err instanceof Error ? err.message : String(err),
      },
    );
    cachedEffects = [];
    return cachedEffects;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    log.error("motion-library.json is malformed — running with empty catalog", {
      path: MOTION_LIBRARY_PATH,
      err: err instanceof Error ? err.message : String(err),
    });
    cachedEffects = [];
    return cachedEffects;
  }

  if (!Array.isArray(parsed)) {
    log.error("motion-library.json is not an array — running with empty catalog", {
      path: MOTION_LIBRARY_PATH,
    });
    cachedEffects = [];
    return cachedEffects;
  }

  const entries = parsed as MotionArtifactEntry[];
  cachedEffects = entries.map((entry) => artifactToMotionEffect(entry));
  log.info("Motion library loaded", {
    path: MOTION_LIBRARY_PATH,
    effects: cachedEffects.length,
  });
  return cachedEffects;
}

/** Convert an artifact entry to the MotionEffect domain shape. */
function artifactToMotionEffect(entry: MotionArtifactEntry): MotionEffect {
  const category = CATEGORY_MAP[entry.category] ?? "loop";
  const { duration, easing } = parseAnimationShorthand(entry.cssCode);
  const keyframes = extractKeyframes(entry.cssCode);
  return {
    id: entry.id,
    name: entry.name,
    category,
    duration,
    easing,
    keyframes,
    cssCode: entry.cssCode,
  };
}

/** Extract `duration` (ms) and `easing` from a CSS animation shorthand. */
function parseAnimationShorthand(css: string): { duration: number; easing: string } {
  // Look for `animation: ...` and try to pull out a duration number and
  // an easing keyword. Falls back to (0, "ease") if nothing matches.
  const animMatch = css.match(/animation\s*:\s*([^;}]+)/i);
  if (!animMatch) {
    return { duration: 0, easing: "ease" };
  }
  const shorthand = animMatch[1] ?? "";
  // Duration: a number followed by s or ms.
  const durationMatch = shorthand.match(/(\d+(?:\.\d+)?)\s*(s|ms)/i);
  let duration = 0;
  if (durationMatch) {
    const value = parseFloat(durationMatch[1]!);
    const unit = (durationMatch[2] ?? "").toLowerCase();
    duration = unit === "s" ? Math.round(value * 1000) : Math.round(value);
  }
  // Easing: a known keyword or a cubic-bezier(...) expression.
  const easingMatch = shorthand.match(
    /\b(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end|cubic-bezier\([^)]+\))\b/i,
  );
  const easing = easingMatch ? easingMatch[1]! : "ease";
  return { duration, easing };
}

/** Extract the `@keyframes` body as a compact string (best-effort). */
function extractKeyframes(css: string): string {
  const m = css.match(/@keyframes\s+[^{]+\{([\s\S]*?)\}\s*\}/i);
  if (!m) return "";
  // Normalize whitespace into a single line for compactness.
  return m[1]!.replace(/\s+/g, " ").trim();
}

/** List all motion effects. Cached. */
export async function listEffects(): Promise<MotionEffect[]> {
  return cacheWrap(
    LIST_KEY,
    () => Promise.resolve(loadEffects().map((e) => ({ ...e }))),
    CACHE_TTL.motionEffects,
  );
}

/** Alias for `listEffects` (matches the task spec's preferred name). */
export async function listMotions(): Promise<MotionEffect[]> {
  return listEffects();
}

/** Get a single motion effect by id. Cached. Throws 404 if missing. */
export async function getEffectById(id: string): Promise<MotionEffect> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = loadEffects().find((e) => e.id === id);
      if (!found) throw AppError.notFound(`Motion effect '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.motionEffectDetail,
  );
}

/** Alias for `getEffectById` (matches the task spec's preferred name). */
export async function getMotion(id: string): Promise<MotionEffect> {
  return getEffectById(id);
}

/** List all animation presets. Cached. */
export async function listPresets(): Promise<
  { name: string; effects: string[]; description: string }[]
> {
  return cacheWrap(
    PRESETS_KEY,
    () => {
      const all = loadEffects();
      if (all.length === 0) {
        return Promise.resolve([]);
      }
      // Synthesize a small deterministic set of presets from the loaded
      // effects — pick a stable subset across the first few effects.
      const sample = (offset: number, count: number) =>
        all
          .slice(offset, offset + count)
          .map((e) => e.id)
          .filter(Boolean);
      const presets = [
        { name: "Page Enter", effects: sample(0, 2), description: "Staggered page entrance." },
        { name: "Card Reveal", effects: sample(2, 2), description: "Card scales in, lifts on hover." },
        { name: "Loading Loop", effects: sample(4, 2), description: "Dual-loop loading state." },
        { name: "Toast Slide", effects: sample(6, 2), description: "Toast enters right, exits up." },
        { name: "Button Press", effects: sample(8, 2), description: "Tap-to-shrink, hover-to-glow button." },
        { name: "Scroll Story", effects: sample(10, 2), description: "Scroll-driven story sequence." },
        { name: "Drag Feedback", effects: sample(12, 2), description: "Wobble while dragging, lift on hover." },
        { name: "Empty State", effects: sample(14, 2), description: "Gentle fade-in with floating element." },
      ];
      return Promise.resolve(presets.filter((p) => p.effects.length > 0));
    },
    CACHE_TTL.motionPresets,
  );
}

/** List all motion categories with effect counts. Cached. */
export async function listCategories(): Promise<
  { category: MotionEffect["category"]; count: number }[]
> {
  return cacheWrap(
    CATEGORIES_KEY,
    () => {
      const byCategory = new Map<MotionEffect["category"], number>();
      for (const e of loadEffects()) {
        byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
      }
      const ordered: MotionEffect["category"][] = [
        "entrance",
        "exit",
        "loop",
        "scroll",
        "hover",
        "gesture",
      ];
      return Promise.resolve(
        ordered
          .filter((c) => byCategory.has(c))
          .map((c) => ({ category: c, count: byCategory.get(c) ?? 0 })),
      );
    },
    CACHE_TTL.motionCategories,
  );
}

/** Number of motion effects in the catalog. */
export function motionCount(): number {
  return loadEffects().length;
}

log.debug("Motion module loaded");
