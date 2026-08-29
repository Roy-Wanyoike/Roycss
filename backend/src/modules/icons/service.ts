/**
 * Icons service — real icon catalog sourced from `lucide-react`.
 *
 * The catalog is built by importing the `icons` map from `lucide-react` (a
 * 1,776-icon PascalCase → forwardRef component map) and filtering to a
 * curated set of the most common UI icons grouped into the 7 categories the
 * front-end pack expects (navigation, action, communication, media, files,
 * user, status).
 *
 * For each icon, the SVG path data is extracted from the corresponding ESM
 * source file under `lucide-react/dist/esm/icons/<kebab>.mjs` so the catalog
 * carries the real `d` attribute(s) used to render the icon — not a mock.
 *
 * All reads are LRU-cached (10min list, 10min detail).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { icons as lucideIcons } from "lucide-react";

import { CACHE_TTL, PAGINATION } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { Icon, IconCategory, Paginated } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { ListIconsQuerySchema } from "./schema.js";
import type { z } from "zod";

const log = createLogger("icons");

export type ListIconsInput = z.infer<typeof ListIconsQuerySchema>;

const detailKey = (name: string): string => `icon:${name}`;
const listKey = (input: ListIconsInput): string =>
  `icons:list:${JSON.stringify(input)}`;
const categoriesKey = "icons:categories";

// ─── Lucide source file location ──────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
// src/modules/icons/service.ts → backend root → node_modules/lucide-react
const LUCIDE_ICONS_DIR = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "node_modules",
  "lucide-react",
  "dist",
  "esm",
  "icons",
);

// Stroke width 2 is Lucide's default (the icon-source SVGs were authored
// against it). Sizes are the standard render sizes used by the front-end pack.
const SW = 2;
const SIZES = [16, 20, 24, 32, 48];

// ─── Curated icon list ─────────────────────────────────────────────────────
// 50 of the most common UI icon names, grouped by category. Each entry is
// { PascalName, tags }. We verify the PascalName is exported by
// `lucide-react` and read its SVG path data from the ESM source file.
//
// Note: Lucide renamed several icons in recent versions —
//   Home → House, Edit → Pencil (kept for back-compat as alias), Message →
//   MessageCircle, CheckCircle → CircleCheck, XCircle → CircleX,
//   AlertTriangle → TriangleAlert. We use the current canonical names so
//   the catalog verifies cleanly against `lucide-react` v1.33+.
interface CuratedIcon {
  pascal: string;
  category: IconCategory;
  tags: string[];
}

const CURATED: CuratedIcon[] = [
  // ── navigation (8) ───────────────────────────────────────────────────────
  { pascal: "House", category: "navigation", tags: ["home", "main"] },
  { pascal: "Menu", category: "navigation", tags: ["hamburger"] },
  { pascal: "ArrowLeft", category: "navigation", tags: ["back"] },
  { pascal: "ArrowRight", category: "navigation", tags: ["forward"] },
  { pascal: "ChevronDown", category: "navigation", tags: ["expand"] },
  { pascal: "ChevronUp", category: "navigation", tags: ["collapse"] },
  { pascal: "CornerUpRight", category: "navigation", tags: ["redo"] },
  { pascal: "Navigation", category: "navigation", tags: ["compass"] },
  // ── action (8) ───────────────────────────────────────────────────────────
  { pascal: "Plus", category: "action", tags: ["add", "new"] },
  { pascal: "Minus", category: "action", tags: ["remove"] },
  { pascal: "Check", category: "action", tags: ["done", "tick"] },
  { pascal: "X", category: "action", tags: ["close", "dismiss"] },
  { pascal: "Trash", category: "action", tags: ["delete"] },
  { pascal: "Pencil", category: "action", tags: ["edit"] },
  { pascal: "Save", category: "action", tags: ["disk", "floppy"] },
  { pascal: "Download", category: "action", tags: ["export"] },
  // ── communication (7) ────────────────────────────────────────────────────
  { pascal: "Mail", category: "communication", tags: ["email", "envelope"] },
  { pascal: "MessageCircle", category: "communication", tags: ["chat", "bubble"] },
  { pascal: "Phone", category: "communication", tags: ["call"] },
  { pascal: "Send", category: "communication", tags: ["paper-plane"] },
  { pascal: "Bell", category: "communication", tags: ["notification"] },
  { pascal: "AtSign", category: "communication", tags: ["mention"] },
  { pascal: "Share", category: "communication", tags: ["social"] },
  // ── media (7) ───────────────────────────────────────────────────────────
  { pascal: "Play", category: "media", tags: ["start"] },
  { pascal: "Pause", category: "media", tags: ["hold"] },
  { pascal: "SkipForward", category: "media", tags: ["next"] },
  { pascal: "SkipBack", category: "media", tags: ["previous"] },
  { pascal: "Volume2", category: "media", tags: ["sound", "audio"] },
  { pascal: "VolumeX", category: "media", tags: ["mute"] },
  { pascal: "Image", category: "media", tags: ["picture", "photo"] },
  // ── files (7) ───────────────────────────────────────────────────────────
  { pascal: "Folder", category: "files", tags: ["directory"] },
  { pascal: "FolderOpen", category: "files", tags: ["directory"] },
  { pascal: "File", category: "files", tags: ["document"] },
  { pascal: "FileText", category: "files", tags: ["document", "text"] },
  { pascal: "Upload", category: "files", tags: ["import"] },
  { pascal: "Archive", category: "files", tags: ["zip", "box"] },
  { pascal: "Paperclip", category: "files", tags: ["attachment"] },
  // ── user (7) ────────────────────────────────────────────────────────────
  { pascal: "User", category: "user", tags: ["person", "account"] },
  { pascal: "Users", category: "user", tags: ["group", "team"] },
  { pascal: "UserPlus", category: "user", tags: ["invite"] },
  { pascal: "UserCheck", category: "user", tags: ["verified"] },
  { pascal: "LogIn", category: "user", tags: ["signin"] },
  { pascal: "LogOut", category: "user", tags: ["signout"] },
  { pascal: "Settings", category: "user", tags: ["gear", "preferences"] },
  // ── status (6) ──────────────────────────────────────────────────────────
  { pascal: "CircleCheck", category: "status", tags: ["success"] },
  { pascal: "CircleX", category: "status", tags: ["error"] },
  { pascal: "TriangleAlert", category: "status", tags: ["warning"] },
  { pascal: "Info", category: "status", tags: ["notice"] },
  { pascal: "Loader", category: "status", tags: ["spinner", "pending"] },
  { pascal: "Clock", category: "status", tags: ["time", "history"] },
];

// ─── PascalCase ↔ kebab-case ──────────────────────────────────────────────
// Lucide's icon file naming uses kebab-case with hyphens at every
// letter/digit and case boundary, e.g.:
//   Volume2      → volume-2.mjs
//   FileText     → file-text.mjs
//   TriangleAlert → triangle-alert.mjs
function toKebab(pascal: string): string {
  return pascal
    .replace(/([a-zA-Z])(\d)/g, "$1-$2") // letter → digit ("Volume2" → "Volume-2")
    .replace(/(\d)([a-zA-Z])/g, "$1-$2") // digit → letter
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2") // lower/digit → upper ("FileText" → "File-Text")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2") // consecutive upper ending
    .toLowerCase();
}

// ─── Extract the SVG `d` attribute(s) from a Lucide ESM source file ───────
function readSvgPath(kebab: string): string {
  try {
    const filePath = resolve(LUCIDE_ICONS_DIR, `${kebab}.mjs`);
    const content = readFileSync(filePath, "utf-8");
    // Match `d: "..."` or `d: '...'` patterns inside the __iconNode array.
    // Each path element is ["path", { d: "...", key: "..." }] — we want all
    // the d strings concatenated so a single SVG <path> can render the icon.
    const re = /\bd\s*:\s*"([^"]+)"/g;
    const paths: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      if (m[1]) paths.push(m[1]);
    }
    return paths.join(" ");
  } catch (err) {
    log.warn("Failed to read icon source file", {
      kebab,
      err: err instanceof Error ? err.message : String(err),
    });
    return "";
  }
}

// ─── Build the catalog once at module load ────────────────────────────────
const allIcons: Icon[] = (() => {
  const lucideKeys = new Set(Object.keys(lucideIcons));
  const out: Icon[] = [];
  for (const c of CURATED) {
    if (!lucideKeys.has(c.pascal)) {
      log.warn("Lucide icon not found in catalog", { pascal: c.pascal });
      continue;
    }
    const kebab = toKebab(c.pascal);
    const svgPath = readSvgPath(kebab);
    out.push({
      name: kebab,
      category: c.category,
      tags: [...c.tags],
      svgPath,
      strokeWidth: SW,
      sizes: [...SIZES],
    });
  }
  log.info("Icon catalog built", {
    curated: CURATED.length,
    available: lucideKeys.size,
    emitted: out.length,
  });
  return out;
})();

// ─── Service functions ───────────────────────────────────────────────────

/** List icons with optional category filter and full-text search. Cached. */
export async function listIcons(
  input: ListIconsInput,
): Promise<Paginated<Icon>> {
  return cacheWrap(
    listKey(input),
    () => {
      let filtered = allIcons;

      if (input.category) {
        filtered = filtered.filter((i) => i.category === input.category);
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        const terms = q.split(/\s+/).filter(Boolean);
        filtered = filtered.filter((i) => {
          const haystack = (
            i.name + " " + i.category + " " + i.tags.join(" ")
          ).toLowerCase();
          return terms.every((t) => haystack.includes(t));
        });
      }

      const safeLimit = Math.min(
        Math.max(input.limit, 1),
        PAGINATION.maxLimit,
      );
      const safePage = Math.max(input.page, 1);
      const start = (safePage - 1) * safeLimit;
      const items = filtered.slice(start, start + safeLimit);

      return Promise.resolve({
        items,
        page: safePage,
        limit: safeLimit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / safeLimit)),
      });
    },
    CACHE_TTL.iconsList,
  );
}

/** Get a single icon by name. Cached. Throws 404 if missing. */
export async function getIconByName(name: string): Promise<Icon> {
  return cacheWrap(
    detailKey(name),
    () => {
      const found = allIcons.find((i) => i.name === name);
      if (!found) throw AppError.notFound(`Icon '${name}' not found`);
      return Promise.resolve(found);
    },
    CACHE_TTL.iconDetail,
  );
}

/** Return all categories with counts. Cached. */
export async function listCategories(): Promise<
  { category: IconCategory; count: number }[]
> {
  return cacheWrap(
    categoriesKey,
    () => {
      const byCategory = new Map<IconCategory, number>();
      for (const i of allIcons) {
        byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + 1);
      }
      const ordered: IconCategory[] = [
        "navigation",
        "action",
        "communication",
        "media",
        "files",
        "user",
        "status",
      ];
      return Promise.resolve(
        ordered
          .filter((c) => byCategory.has(c))
          .map((c) => ({ category: c, count: byCategory.get(c) ?? 0 })),
      );
    },
    CACHE_TTL.iconsList,
  );
}

/** Number of icons in the dataset. */
export function iconsCount(): number {
  return allIcons.length;
}

log.debug("Icons module loaded", { count: allIcons.length });
