/**
 * Inspector service — in-memory RoyCSS class catalog + page scanner.
 *
 * Stores 100 mock `roycss-*` class entries (name, category, description,
 * cssSnippet) plus a mock scan-result generator that returns whatever
 * classes the scanner "found" on a page.
 *
 * All reads are LRU-cached. No mutation endpoints — the catalog is a
 * curated platform asset.
 *
 * Future: source class metadata from the same build that produces
 * dist/effects.json (or a dedicated inspector build artifact).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { InspectorClass, ScanResult } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { ScanPageInput } from "./schema.js";

const log = createLogger("inspector");

const CLASSES_KEY = "inspector:classes";
const detailKey = (name: string): string => `inspector:class:${name}`;
const EFFECTS_KEY = "inspector:effects";
const scanKey = (url: string, category: string): string =>
  `inspector:scan:${url}:${category}`;

// ─── Seed: 100 roycss-* classes (deterministic generation) ──────────────
// Generated across 10 categories × 10 classes per category. Using a
// deterministic generator keeps the cached snapshot stable across runs
// (no Math.random — same rule as analytics).
type CategoryDef = {
  prefix: string;
  category: string;
  description: string;
};

const CATEGORY_DEFS: CategoryDef[] = [
  { prefix: "btn", category: "buttons", description: "Button styles" },
  { prefix: "card", category: "cards", description: "Card containers" },
  { prefix: "input", category: "forms", description: "Form inputs" },
  { prefix: "txt", category: "text", description: "Text treatments" },
  { prefix: "grid", category: "layout", description: "Grid + flex layout" },
  { prefix: "nav", category: "navigation", description: "Nav components" },
  { prefix: "modal", category: "overlays", description: "Modal overlays" },
  { prefix: "tbl", category: "tables", description: "Table styles" },
  { prefix: "badge", category: "feedback", description: "Badges + tags" },
  { prefix: "anim", category: "animations", description: "Animation utilities" },
];

const VARIANTS = [
  "default",
  "primary",
  "secondary",
  "ghost",
  "outline",
  "sm",
  "md",
  "lg",
  "active",
  "disabled",
];

function buildClasses(): InspectorClass[] {
  const out: InspectorClass[] = [];
  for (const def of CATEGORY_DEFS) {
    for (let i = 0; i < VARIANTS.length; i++) {
      const variant = VARIANTS[i]!;
      const name = `roycss-${def.prefix}-${variant}`;
      out.push({
        name,
        category: def.category,
        description: `${def.description} — ${variant} variant.`,
        cssSnippet: `.${name}{/* ${def.category}/${variant} */}`,
      });
    }
  }
  return out;
}

const SEED_CLASSES: InspectorClass[] = buildClasses();

// ─── Seed: inspectable effects (a small curated subset) ─────────────────
const SEED_EFFECTS: { id: string; name: string; category: string }[] = [
  { id: "text-gradient", name: "Text Gradient", category: "text" },
  { id: "card-glassmorphism", name: "Glassmorphism Card", category: "cards" },
  { id: "fade-in-up", name: "Fade In Up", category: "animations" },
  { id: "pulse-glow", name: "Pulse Glow", category: "hover" },
  { id: "loader-shimmer", name: "Shimmer Loader", category: "loaders" },
  { id: "input-glow-focus", name: "Input Glow Focus", category: "forms" },
  { id: "slide-in-right", name: "Slide In Right", category: "animations" },
  { id: "particles-confetti-burst", name: "Confetti Burst", category: "particles" },
];

/** List all inspector classes. Cached. */
export async function listClasses(): Promise<InspectorClass[]> {
  return cacheWrap(
    CLASSES_KEY,
    () => Promise.resolve(SEED_CLASSES.map((c) => ({ ...c }))),
    CACHE_TTL.inspectorClasses,
  );
}

/** Get a single class by name. Cached. Throws 404 if missing. */
export async function getClassByName(name: string): Promise<InspectorClass> {
  return cacheWrap(
    detailKey(name),
    () => {
      const found = SEED_CLASSES.find((c) => c.name === name);
      if (!found) throw AppError.notFound(`Class '${name}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.inspectorClassDetail,
  );
}

/** List inspectable effects (a curated subset). Cached. */
export async function listEffects(): Promise<
  { id: string; name: string; category: string }[]
> {
  return cacheWrap(
    EFFECTS_KEY,
    () => Promise.resolve(SEED_EFFECTS.map((e) => ({ ...e }))),
    CACHE_TTL.inspectorEffects,
  );
}

/** Scan a page URL — returns a mock ScanResult. Cached per URL+category. */
export async function scanPage(input: ScanPageInput): Promise<ScanResult> {
  return cacheWrap(
    scanKey(input.url, input.category ?? ""),
    () => {
      // Pick a deterministic subset of classes to "find" — derive from URL
      // hash so each URL gives a stable result across requests.
      const hash = simpleHash(input.url);
      const take = 6 + (hash % 6); // 6..11 classes
      const picked = SEED_CLASSES.slice(hash % 10, (hash % 10) + take);

      const matched = picked.map((c, i) => ({
        name: c.name,
        category: c.category,
        occurrences: 1 + ((hash + i) % 12),
      }));

      const filtered = input.category
        ? matched.filter((m) => m.category === input.category)
        : matched;

      return Promise.resolve({
        url: input.url,
        scannedAt: new Date().toISOString(),
        totalClasses: matched.length,
        matched: filtered,
        unknown: ["legacy-grid", "old-btn"],
      });
    },
    CACHE_TTL.inspectorScan,
  );
}

/** Tiny string-hash — stable and fast; not cryptographic. */
function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Number of classes in the catalog. */
export function classesCount(): number {
  return SEED_CLASSES.length;
}

log.debug("Inspector module loaded", { classes: SEED_CLASSES.length });
