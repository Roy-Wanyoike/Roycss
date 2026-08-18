/**
 * Icons service — in-memory icon metadata store.
 *
 * Stores metadata only (name, category, tags, svgPath, strokeWidth,
 * sizes) for 50 mock icon entries across 7 categories. The actual SVG
 * markup is delivered by the front-end pack; this service powers the
 * browse + search experience.
 *
 * All reads are LRU-cached (10min list, 10min detail).
 */
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

// ─── Seed: 50 icons across 7 categories ──────────────────────────────────
// Stroke width 1.75 matches Lucide's default; sizes are the standard
// render sizes used by the front-end pack.
const SW = 1.75;
const SIZES = [16, 20, 24, 32, 48];

function icon(
  name: string,
  category: IconCategory,
  tags: string[],
  svgPath: string,
): Icon {
  return { name, category, tags, svgPath, strokeWidth: SW, sizes: SIZES };
}

const SEED_ICONS: Icon[] = [
  // ── navigation (8) ───────────────────────────────────────────────────
  icon("home", "navigation", ["house", "main"], "M3 9.5 12 3l9 6.5V21H3z"),
  icon("menu", "navigation", ["hamburger"], "M4 6h16M4 12h16M4 18h16"),
  icon("arrow-left", "navigation", ["back"], "M19 12H5M12 19l-7-7 7-7"),
  icon("arrow-right", "navigation", ["forward"], "M5 12h14M12 5l7 7-7 7"),
  icon("chevron-down", "navigation", ["expand"], "m6 9 6 6 6-6"),
  icon("chevron-up", "navigation", ["collapse"], "m18 15-6-6-6 6"),
  icon("corner-up-right", "navigation", ["redo"], "M15 10l5 5-5 5M4 4v7a4 4 0 0 0 4 4h11"),
  icon("navigation", "navigation", ["compass"], "M3 11l19-9-9 19-2-8z"),
  // ── action (8) ───────────────────────────────────────────────────────
  icon("plus", "action", ["add", "new"], "M12 5v14M5 12h14"),
  icon("minus", "action", ["remove"], "M5 12h14"),
  icon("check", "action", ["done", "tick"], "M20 6 9 17l-5-5"),
  icon("x", "action", ["close", "dismiss"], "M18 6 6 18M6 6l12 12"),
  icon("trash", "action", ["delete"], "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"),
  icon("edit", "action", ["pencil"], "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"),
  icon("save", "action", ["disk", "floppy"], "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8"),
  icon("download", "action", ["export"], "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"),
  // ── communication (7) ────────────────────────────────────────────────
  icon("mail", "communication", ["email", "envelope"], "M4 4h16v16H4zM22 6l-10 7L2 6"),
  icon("message", "communication", ["chat", "bubble"], "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"),
  icon("phone", "communication", ["call"], "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"),
  icon("send", "communication", ["paper-plane"], "M22 2 11 13M22 2l-7 20-4-9-9-4z"),
  icon("bell", "communication", ["notification"], "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"),
  icon("at-sign", "communication", ["mention"], "M16 8a5 5 0 0 1 0 8M4 12a8 8 0 0 1 16 0v3a3 3 0 0 1-6 0M12 8v8"),
  icon("share", "communication", ["social"], "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"),
  // ── media (7) ────────────────────────────────────────────────────────
  icon("play", "media", ["start"], "M5 3l14 9-14 9z"),
  icon("pause", "media", ["hold"], "M6 4h4v16H6zM14 4h4v16h-4z"),
  icon("skip-forward", "media", ["next"], "M5 4l10 8-10 8zM19 5v14"),
  icon("skip-back", "media", ["previous"], "M19 20 9 12l10-8zM5 19V5"),
  icon("volume-2", "media", ["sound", "audio"], "M11 5 6 9H2v6h4l5 4zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"),
  icon("volume-x", "media", ["mute"], "M11 5 6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6"),
  icon("image", "media", ["picture", "photo"], "M3 3h18v18H3zM3 16l5-5 4 4 4-4 5 5M8.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"),
  // ── files (7) ────────────────────────────────────────────────────────
  icon("folder", "files", ["directory"], "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"),
  icon("folder-open", "files", ["directory"], "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3zM3 11h18l-2 8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"),
  icon("file", "files", ["document"], "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"),
  icon("file-text", "files", ["document", "text"], "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h1"),
  icon("upload", "files", ["import"], "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"),
  icon("archive", "files", ["zip", "box"], "M21 8v13H3V8M1 3h22v5H1zM10 12h4"),
  icon("paperclip", "files", ["attachment"], "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"),
  // ── user (7) ─────────────────────────────────────────────────────────
  icon("user", "user", ["person", "account"], "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"),
  icon("users", "user", ["group", "team"], "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"),
  icon("user-plus", "user", ["invite"], "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM20 8v6M23 11h-6"),
  icon("user-check", "user", ["verified"], "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17 11l2 2 4-4"),
  icon("log-in", "user", ["signin"], "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"),
  icon("log-out", "user", ["signout"], "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"),
  icon("settings", "user", ["gear", "preferences"], "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"),
  // ── status (6) ───────────────────────────────────────────────────────
  icon("check-circle", "status", ["success"], "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3"),
  icon("x-circle", "status", ["error"], "M10 15l5-5M15 15l-5-5M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"),
  icon("alert-triangle", "status", ["warning"], "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"),
  icon("info", "status", ["notice"], "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 16v-4M12 8h.01"),
  icon("loader", "status", ["spinner", "pending"], "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"),
  icon("clock", "status", ["time", "history"], "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 6v6l4 2"),
];

// ─── Service functions ───────────────────────────────────────────────────

/** List icons with optional category filter and full-text search. Cached. */
export async function listIcons(
  input: ListIconsInput,
): Promise<Paginated<Icon>> {
  return cacheWrap(
    listKey(input),
    () => {
      let filtered = SEED_ICONS;

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
      const found = SEED_ICONS.find((i) => i.name === name);
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
      for (const i of SEED_ICONS) {
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
  return SEED_ICONS.length;
}

log.debug("Icons module loaded", { count: SEED_ICONS.length });
