/**
 * Designer service — Roy Designer UI design generator.
 *
 * Backed by the unified LLM client. When an LLM key is configured, the
 * generator asks the LLM for CSS custom properties (design tokens) and
 * maps them into the existing DesignerResult shape. When no key is set,
 * a deterministic mock design is returned — same signature, same
 * cache keys, no breaking change for callers.
 *
 * Reads are LRU-cached; generating a new design invalidates the result
 * list.
 */
import { randomUUID } from "node:crypto";

import { CACHE_TTL } from "../../config/constants.js";
import { cache, cacheWrap } from "../../lib/cache.js";
import { chat, isLLMConfigured } from "../../lib/llm-client.js";
import { createLogger } from "../../lib/logger.js";
import type { DesignPreset, DesignerResult } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";
import type { GenerateDesignInput } from "./schema.js";

const log = createLogger("designer");

const DESIGNER_SYSTEM_PROMPT =
  "You are an expert UI designer. Given a design brief and optional brand palette, return a JSON object whose values are CSS custom property declarations (e.g. {\"--color-primary\":\"#007aff\"}). Include at minimum: --color-primary, --color-secondary, --color-bg, --color-fg, --radius-base, --space-base, --font-base. Respond with JSON only — no markdown fences.";

function safeJson<T>(raw: string): T | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

const PRESETS_KEY = "designer:presets";
const RESULT_LIST_KEY = "designer:results:list";
const resultKey = (id: string): string => `designer:result:${id}`;

function invalidateResults(id?: string): void {
  cache.delete(RESULT_LIST_KEY);
  if (id) cache.delete(resultKey(id));
}

// ─── Seed: 4 design presets ──────────────────────────────────────────────
const SEED_PRESETS: DesignPreset[] = [
  {
    id: "preset-apple",
    name: "Apple Material",
    style: "vibrancy",
    category: "modern",
    palette: ["#007aff", "#5856d6", "#ff9500", "#f2f2f7", "#1c1c1e"],
    typography: { fontFamily: "SF Pro Display", scale: 1.125 },
    radius: "1.25rem",
    spacing: "0.75rem",
  },
  {
    id: "preset-material",
    name: "Material You",
    style: "tonal",
    category: "modern",
    palette: ["#6750a4", "#e8def8", "#1d1b20", "#625b71", "#7d5260"],
    typography: { fontFamily: "Roboto Flex", scale: 1 },
    radius: "1rem",
    spacing: "0.5rem",
  },
  {
    id: "preset-brutalist",
    name: "Brutalist",
    style: "raw",
    category: "expressive",
    palette: ["#000000", "#ffffff", "#ff4500", "#00ff00", "#ffff00"],
    typography: { fontFamily: "Space Mono", scale: 1 },
    radius: "0",
    spacing: "0.25rem",
  },
  {
    id: "preset-glass",
    name: "Glassmorphism",
    style: "frosted",
    category: "modern",
    palette: ["#ffffff20", "#a8d8ff", "#7c5cff", "#0f172a", "#e0e7ff"],
    typography: { fontFamily: "Inter", scale: 1.05 },
    radius: "1.5rem",
    spacing: "1rem",
  },
];

const presets: DesignPreset[] = SEED_PRESETS.map((p) => ({ ...p }));

// ─── Seed: one historical result ─────────────────────────────────────────
const SEED_RESULTS: DesignerResult[] = [
  {
    id: "design-seed-1",
    prompt: "Design a healthcare patient portal landing hero with calm, trustworthy colors.",
    presetId: "preset-apple",
    status: "complete",
    components: [
      {
        name: "Hero",
        type: "hero",
        html: '<section class="roycss-hero"><h1>Your health, in one place</h1><button>Book appointment</button></section>',
        css: ".roycss-hero { background: linear-gradient(135deg, #007aff, #5856d6); color: #fff; padding: 4rem; border-radius: 1.25rem; }",
      },
      {
        name: "Card",
        type: "card",
        html: '<article class="roycss-card"><h3>Upcoming appointment</h3><p>Mar 14, 10:30 AM</p></article>',
        css: ".roycss-card { background: #f2f2f7; color: #1c1c1e; padding: 1.5rem; border-radius: 1.25rem; }",
      },
    ],
    tokens: {
      "--color-primary": "#007aff",
      "--color-secondary": "#5856d6",
      "--radius-base": "1.25rem",
      "--font-base": "SF Pro Display",
    },
    createdAt: "2025-02-15T00:00:00.000Z",
  },
];

let results: DesignerResult[] = SEED_RESULTS.map((r) => ({ ...r }));

/** List all design presets. Cached. */
export async function listPresets(): Promise<DesignPreset[]> {
  return cacheWrap(
    PRESETS_KEY,
    () => Promise.resolve(presets.map((p) => ({ ...p }))),
    CACHE_TTL.designerPresets,
  );
}

/** Get a single design result by id. Cached. Throws 404 if missing. */
export async function getResultById(id: string): Promise<DesignerResult> {
  return cacheWrap(
    resultKey(id),
    () => {
      const found = results.find((r) => r.id === id);
      if (!found) throw AppError.notFound(`Designer result '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.designerResult,
  );
}

/** Generate a new design. Uses LLM when configured. Invalidates result list cache. */
export async function generateDesign(
  input: GenerateDesignInput,
): Promise<DesignerResult> {
  const presetId = input.presetId ?? "preset-apple";
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) {
    throw AppError.notFound(`Preset '${presetId}' not found`);
  }

  const base = buildMockDesign(input, preset);
  let result = base;

  if (isLLMConfigured) {
    try {
      const paletteHint = input.palette
        ? ` Brand palette: ${input.palette.join(", ")}.`
        : "";
      const raw = await chat(
        [
          { role: "system", content: DESIGNER_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Brief: ${input.prompt}.${paletteHint} Components: ${input.components.join(", ")}.`,
          },
        ],
        { temperature: 0.3, maxTokens: 1200 },
      );
      const tokens = safeJson<Record<string, string>>(raw);
      if (tokens && Object.keys(tokens).length > 0) {
        const mergedTokens = { ...base.tokens, ...tokens };
        const primary =
          tokens["--color-primary"] ?? base.tokens["--color-primary"]!;
        const secondary =
          tokens["--color-secondary"] ?? base.tokens["--color-secondary"]!;
        const bg = tokens["--color-bg"] ?? base.tokens["--color-bg"]!;
        const fg = tokens["--color-fg"] ?? base.tokens["--color-fg"]!;
        // Re-derive the component CSS from the LLM-suggested tokens.
        const components = base.components.map((c) => ({
          ...c,
          css: `.roycss-${c.type} { background: ${bg}; color: ${fg}; padding: 2rem; border-radius: ${
            tokens["--radius-base"] ?? preset.radius
          }; border: 2px solid ${primary}; } .roycss-${c.type} h2 { color: ${primary}; } .roycss-${c.type} p { color: ${secondary}; }`,
        }));
        result = { ...base, tokens: mergedTokens, components };
      }
      log.info("Design generated via LLM", { id: base.id, presetId, llm: true });
    } catch (err) {
      log.warn("LLM call failed, using mock design", {
        err: (err as Error).message,
      });
    }
  } else {
    log.info("Design generated (mock fallback)", {
      id: base.id,
      presetId,
      llm: false,
    });
  }

  results = [result, ...results].slice(0, 100);
  invalidateResults(result.id);
  return result;
}

/** Deterministic mock design — same shape the route layer expects. */
function buildMockDesign(
  input: GenerateDesignInput,
  preset: DesignPreset,
): DesignerResult {
  const palette = input.palette ?? preset.palette;
  const primary = palette[0] ?? "#007aff";
  const secondary = palette[1] ?? "#5856d6";
  const bg = palette[3] ?? "#f2f2f7";
  const fg = palette[4] ?? "#1c1c1e";

  const components = input.components.map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    type: name,
    html: `<section class="roycss-${name}"><h2>${name}</h2><p>${input.prompt.slice(0, 60)}…</p></section>`,
    css: `.roycss-${name} { background: ${bg}; color: ${fg}; padding: 2rem; border-radius: ${preset.radius}; border: 2px solid ${primary}; } .roycss-${name} h2 { color: ${primary}; } .roycss-${name} p { color: ${secondary}; }`,
  }));

  const tokens: Record<string, string> = {
    "--color-primary": primary,
    "--color-secondary": secondary,
    "--color-bg": bg,
    "--color-fg": fg,
    "--radius-base": preset.radius,
    "--space-base": preset.spacing,
    "--font-base": preset.typography.fontFamily,
  };

  return {
    id: `design-${randomUUID()}`,
    prompt: input.prompt,
    presetId: preset.id,
    status: "complete",
    components,
    tokens,
    createdAt: new Date().toISOString(),
  };
}

/** Number of presets in the catalog. */
export function presetsCount(): number {
  return presets.length;
}

/** Test-only: reset results to seed. */
export function _resetDesignerForTest(): void {
  results = SEED_RESULTS.map((r) => ({ ...r }));
  invalidateResults();
}
