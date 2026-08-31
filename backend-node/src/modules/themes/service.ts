/**
 * Themes service — Prisma-backed theme store with CRUD operations.
 *
 * Persisted via the Prisma `Theme` model. Themes are seeded with 10
 * platform presets on first access. All reads are LRU-cached (10min
 * list, 10min detail); every mutation invalidates the list cache and
 * any affected detail cache entry so subsequent reads see the new state.
 *
 * Field-mapping: the Prisma `Theme` model exposes (slug, name,
 * description, tokensJson, isPublic, userId). The domain shape's
 * `id ← slug`, `name`, `tokens` map directly (`tokensJson ← JSON of
 * tokens`); the extra color fields (primary, secondary, accent,
 * background, foreground, createdAt) are JSON-encoded inside
 * `description` as a wrapper that also carries the seed `createdAt`
 * timestamp.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { db } from "../../lib/db.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { Theme } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { CreateThemeInput, UpdateThemeInput } from "./schema.js";

const log = createLogger("themes");

/** Single cache key for the full list — list endpoint returns everything. */
const THEMES_LIST_KEY = "themes:list";
const detailKey = (id: string): string => `theme:${id}`;

/** Helper — invalidate the list cache (and optionally one detail entry). */
function invalidate(id?: string): void {
  cache.delete(THEMES_LIST_KEY);
  if (id) cache.delete(detailKey(id));
}

// ─── Seed: 10 platform theme presets ─────────────────────────────────────
const SEED_THEMES: Theme[] = [
  {
    id: "theme-emerald-default",
    name: "Emerald Default",
    primary: "#10b981",
    secondary: "#6366f1",
    accent: "#f59e0b",
    background: "#0b0f14",
    foreground: "#e6edf3",
    tokens: { radius: "0.75rem", fontScale: 1 },
    createdAt: "2025-01-02T00:00:00.000Z",
  },
  {
    id: "theme-healthcare",
    name: "Healthcare",
    primary: "#0ea5e9",
    secondary: "#14b8a6",
    accent: "#ef4444",
    background: "#f8fafc",
    foreground: "#0f172a",
    tokens: { radius: "1rem", fontScale: 1.05, contrast: "AAA" },
    createdAt: "2025-01-04T00:00:00.000Z",
  },
  {
    id: "theme-banking",
    name: "Banking",
    primary: "#1e40af",
    secondary: "#0f766e",
    accent: "#facc15",
    background: "#0f172a",
    foreground: "#f1f5f9",
    tokens: { radius: "0.5rem", fontScale: 1, density: "comfortable" },
    createdAt: "2025-01-06T00:00:00.000Z",
  },
  {
    id: "theme-corporate",
    name: "Corporate",
    primary: "#475569",
    secondary: "#64748b",
    accent: "#3b82f6",
    background: "#ffffff",
    foreground: "#1e293b",
    tokens: { radius: "0.375rem", fontScale: 1, density: "compact" },
    createdAt: "2025-01-08T00:00:00.000Z",
  },
  {
    id: "theme-education",
    name: "Education",
    primary: "#7c3aed",
    secondary: "#ec4899",
    accent: "#22c55e",
    background: "#fefce8",
    foreground: "#1f2937",
    tokens: { radius: "1.25rem", fontScale: 1.1 },
    createdAt: "2025-01-10T00:00:00.000Z",
  },
  {
    id: "theme-gaming",
    name: "Gaming",
    primary: "#a855f7",
    secondary: "#06b6d4",
    accent: "#f97316",
    background: "#050505",
    foreground: "#f5f5f5",
    tokens: { radius: "0.5rem", fontScale: 1, neon: true },
    createdAt: "2025-01-12T00:00:00.000Z",
  },
  {
    id: "theme-saas",
    name: "SaaS",
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#10b981",
    background: "#fafafa",
    foreground: "#18181b",
    tokens: { radius: "0.625rem", fontScale: 1 },
    createdAt: "2025-01-14T00:00:00.000Z",
  },
  {
    id: "theme-dashboard",
    name: "Dashboard",
    primary: "#0f766e",
    secondary: "#0369a1",
    accent: "#f43f5e",
    background: "#111827",
    foreground: "#e5e7eb",
    tokens: { radius: "0.5rem", fontScale: 0.95, density: "compact" },
    createdAt: "2025-01-16T00:00:00.000Z",
  },
  {
    id: "theme-fintech",
    name: "Fintech",
    primary: "#059669",
    secondary: "#2563eb",
    accent: "#fbbf24",
    background: "#0a0a0a",
    foreground: "#fafafa",
    tokens: { radius: "0.75rem", fontScale: 1, mono: true },
    createdAt: "2025-01-18T00:00:00.000Z",
  },
  {
    id: "theme-apple-material",
    name: "Apple Material",
    primary: "#007aff",
    secondary: "#5856d6",
    accent: "#ff9500",
    background: "#f2f2f7",
    foreground: "#1c1c1e",
    tokens: {
      radius: "1.25rem",
      fontScale: 1,
      blur: "20px",
      material: "vibrancy",
    },
    createdAt: "2025-01-20T00:00:00.000Z",
  },
];

interface ThemeWrapper {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  seedCreatedAt: string;
}

function toDbRow(t: Theme) {
  const wrapper: ThemeWrapper = {
    primary: t.primary,
    secondary: t.secondary,
    accent: t.accent,
    background: t.background,
    foreground: t.foreground,
    seedCreatedAt: t.createdAt,
  };
  return {
    id: t.id,
    slug: t.id,
    name: t.name,
    description: JSON.stringify(wrapper),
    tokensJson: JSON.stringify(t.tokens),
    isPublic: true,
    userId: null,
  };
}

function toDomain(row: {
  id: string;
  name: string;
  description: string;
  tokensJson: string;
  createdAt: Date;
}): Theme {
  let wrapper: ThemeWrapper = {
    primary: "#000000",
    secondary: "#000000",
    accent: "#000000",
    background: "#ffffff",
    foreground: "#000000",
    seedCreatedAt: row.createdAt.toISOString(),
  };
  try {
    wrapper = JSON.parse(row.description) as ThemeWrapper;
  } catch {
    // Keep defaults.
  }
  let tokens: Record<string, unknown> = {};
  try {
    tokens = JSON.parse(row.tokensJson) as Record<string, unknown>;
  } catch {
    // Keep default.
  }
  return {
    id: row.id,
    name: row.name,
    primary: wrapper.primary,
    secondary: wrapper.secondary,
    accent: wrapper.accent,
    background: wrapper.background,
    foreground: wrapper.foreground,
    tokens,
    createdAt: wrapper.seedCreatedAt,
  };
}

let seedPromise: Promise<void> | null = null;
async function seedIfEmpty(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.theme.count();
    if (count === 0) {
      await db.theme.createMany({ data: SEED_THEMES.map(toDbRow) });
      log.info("Themes seeded", { count: SEED_THEMES.length });
    }
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** List all themes. Cached. */
export async function listThemes(): Promise<Theme[]> {
  return cacheWrap(
    THEMES_LIST_KEY,
    async () => {
      await seedIfEmpty();
      const rows = await db.theme.findMany({
        orderBy: { createdAt: "asc" },
      });
      return rows.map(toDomain);
    },
    CACHE_TTL.themesList,
  );
}

/** Get a single theme by id. Cached. Throws 404 if missing. */
export async function getThemeById(id: string): Promise<Theme> {
  return cacheWrap(
    detailKey(id),
    async () => {
      await seedIfEmpty();
      const row = await db.theme.findUnique({ where: { id } });
      if (!row) throw AppError.notFound(`Theme '${id}' not found`);
      return toDomain(row);
    },
    CACHE_TTL.themeDetail,
  );
}

/** Create a new theme. Invalidates list cache. */
export async function createTheme(input: CreateThemeInput): Promise<Theme> {
  await seedIfEmpty();
  const theme: Theme = {
    id: `theme-${randomUUID()}`,
    name: input.name,
    primary: input.primary,
    secondary: input.secondary,
    accent: input.accent,
    background: input.background,
    foreground: input.foreground,
    tokens: input.tokens,
    createdAt: new Date().toISOString(),
  };
  await db.theme.create({ data: toDbRow(theme) });
  invalidate();
  log.info("Theme created", { id: theme.id, name: theme.name });
  return theme;
}

/** Update an existing theme (partial). Invalidates list + detail cache. */
export async function updateTheme(
  id: string,
  input: UpdateThemeInput,
): Promise<Theme> {
  await seedIfEmpty();
  const row = await db.theme.findUnique({ where: { id } });
  if (!row) throw AppError.notFound(`Theme '${id}' not found`);

  let wrapper: ThemeWrapper;
  try {
    wrapper = JSON.parse(row.description) as ThemeWrapper;
  } catch {
    wrapper = {
      primary: "#000000",
      secondary: "#000000",
      accent: "#000000",
      background: "#ffffff",
      foreground: "#000000",
      seedCreatedAt: row.createdAt.toISOString(),
    };
  }
  let tokens: Record<string, unknown> = {};
  try {
    tokens = JSON.parse(row.tokensJson) as Record<string, unknown>;
  } catch {
    // Keep default.
  }
  if (input.primary !== undefined) wrapper.primary = input.primary;
  if (input.secondary !== undefined) wrapper.secondary = input.secondary;
  if (input.accent !== undefined) wrapper.accent = input.accent;
  if (input.background !== undefined) wrapper.background = input.background;
  if (input.foreground !== undefined) wrapper.foreground = input.foreground;
  if (input.tokens !== undefined) tokens = input.tokens;
  const updatedName = input.name ?? row.name;

  await db.theme.update({
    where: { id },
    data: {
      name: updatedName,
      description: JSON.stringify(wrapper),
      tokensJson: JSON.stringify(tokens),
    },
  });
  invalidate(id);
  log.info("Theme updated", { id });
  return toDomain({
    ...row,
    name: updatedName,
    description: JSON.stringify(wrapper),
    tokensJson: JSON.stringify(tokens),
  });
}

/** Delete a theme by id. Invalidates list + detail cache. */
export async function deleteTheme(id: string): Promise<void> {
  await seedIfEmpty();
  const row = await db.theme.findUnique({ where: { id } });
  if (!row) throw AppError.notFound(`Theme '${id}' not found`);
  await db.theme.delete({ where: { id } });
  invalidate(id);
  log.info("Theme deleted", { id });
}

/** Number of themes in the store — useful for the health/info endpoint. */
export function themesCount(): number {
  return SEED_THEMES.length;
}

/** Test-only: reset the store to the original seed. */
export function _resetThemesForTest(): void {
  seedPromise = null;
  invalidate();
}

export type { CreateThemeInput, UpdateThemeInput };
