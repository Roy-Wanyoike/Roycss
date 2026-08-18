/**
 * Light-dark service — generate light-dark() CSS from a color-scheme and
 * 5 semantic tokens (each with light + dark values).
 *
 * Mock backend (no DB). Seeds 4 light-dark presets (neutral-gray,
 * warm-paper, cool-slate, vibrant) demonstrating how the light-dark() CSS
 * function lets a single declaration serve both color schemes — driven by
 * the inherited `color-scheme` property, NOT by a document-global @media
 * query (so it works for per-element color-scheme overrides too).
 *
 * The generate path returns:
 *   - css       : the light-dark() version (one declaration per property)
 *   - legacyCss : the equivalent `@media (prefers-color-scheme: dark)`
 *                 version, for browsers without light-dark() support
 *
 * Reads are LRU-cached; generations cache per input hash.
 *
 * Reference: CSS Color Module Level 5 §10 (light-dark()).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { LightDarkGenerateInput } from "./schema.js";

const log = createLogger("light-dark");

// ─── Types ───────────────────────────────────────────────────────────────
export interface LightDarkResult {
  /** The light-dark() version — one declaration per property. */
  css: string;
  /** The equivalent `@media (prefers-color-scheme: dark)` version. */
  legacyCss: string;
  /** Whether the color-scheme is "light dark" (auto) — only this triggers the light-dark() switch. */
  auto: boolean;
  /** Human-readable summary. */
  explanation: string;
  /** Browser support info. */
  support: {
    baseline: string;
    chrome: string;
    safari: string;
    firefox: string;
  };
}

export interface LightDarkPreset {
  id: string;
  name: string;
  description: string;
  input: LightDarkGenerateInput;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function buildCss(input: LightDarkGenerateInput): string {
  const t = input.tokens;
  const lines: string[] = [];
  lines.push(`${input.selector} {`);
  lines.push(`  color-scheme: ${input.colorScheme};`);
  lines.push(
    `  background: light-dark(${t.background.light}, ${t.background.dark});`,
  );
  lines.push(`  color: light-dark(${t.foreground.light}, ${t.foreground.dark});`);
  lines.push(
    `  border-color: light-dark(${t.border.light}, ${t.border.dark});`,
  );
  lines.push(`}`);
  lines.push(`${input.primarySelector} {`);
  lines.push(
    `  background: light-dark(${t.primary.light}, ${t.primary.dark});`,
  );
  lines.push(`}`);
  lines.push(`${input.mutedSelector} {`);
  lines.push(`  color: light-dark(${t.muted.light}, ${t.muted.dark});`);
  lines.push(`}`);
  return lines.join("\n");
}

function buildLegacyCss(input: LightDarkGenerateInput): string {
  const t = input.tokens;
  const lines: string[] = [];
  lines.push(`${input.selector} {`);
  lines.push(`  color-scheme: ${input.colorScheme};`);
  lines.push(`  background: ${t.background.light};`);
  lines.push(`  color: ${t.foreground.light};`);
  lines.push(`  border-color: ${t.border.light};`);
  lines.push(`}`);
  lines.push(`${input.primarySelector} {`);
  lines.push(`  background: ${t.primary.light};`);
  lines.push(`}`);
  lines.push(`${input.mutedSelector} {`);
  lines.push(`  color: ${t.muted.light};`);
  lines.push(`}`);
  lines.push(`@media (prefers-color-scheme: dark) {`);
  lines.push(`  ${input.selector} {`);
  lines.push(`    background: ${t.background.dark};`);
  lines.push(`    color: ${t.foreground.dark};`);
  lines.push(`    border-color: ${t.border.dark};`);
  lines.push(`  }`);
  lines.push(`  ${input.primarySelector} {`);
  lines.push(`    background: ${t.primary.dark};`);
  lines.push(`  }`);
  lines.push(`  ${input.mutedSelector} {`);
  lines.push(`    color: ${t.muted.dark};`);
  lines.push(`  }`);
  lines.push(`}`);
  return lines.join("\n");
}

function buildExplanation(input: LightDarkGenerateInput): string {
  const auto = input.colorScheme === "light dark";
  if (auto) {
    return (
      `Generates a ${input.selector} block that adapts between light and dark ` +
      `via light-dark(). The function resolves based on the INHERITED ` +
      `color-scheme value, so the same declaration works at the document root ` +
      `(driven by prefers-color-scheme) AND for per-element overrides ` +
      `(e.g. a \`color-scheme: light\` island inside a dark page).`
    );
  }
  return (
    `Generates a ${input.selector} block with color-scheme: ${input.colorScheme}. ` +
    `Because the color-scheme is fixed, light-dark() always resolves to the ` +
    `${input.colorScheme} branch — useful when a component should be locked ` +
    `to one scheme regardless of the page's overall theme.`
  );
}

// ─── Seed: 4 light-dark presets ──────────────────────────────────────────
const SEED_PRESETS: LightDarkPreset[] = [
  {
    id: "preset-neutral-gray",
    name: "Neutral Gray",
    description:
      "A neutral gray palette — light bg/ink, dark bg/light ink. Default for product UI shells.",
    input: {
      selector: ".card",
      colorScheme: "light dark",
      tokens: {
        background: { light: "#ffffff", dark: "#18181b" },
        foreground: { light: "#18181b", dark: "#fafafa" },
        primary: { light: "#7c3aed", dark: "#c084fc" },
        muted: { light: "#71717a", dark: "#a1a1aa" },
        border: { light: "#e4e4e7", dark: "#27272a" },
      },
      primarySelector: ".btn",
      mutedSelector: ".muted",
    },
  },
  {
    id: "preset-warm-paper",
    name: "Warm Paper",
    description:
      "Warm cream/sepia palette — light is paper-like, dark is warm dark brown.",
    input: {
      selector: ".reader",
      colorScheme: "light dark",
      tokens: {
        background: { light: "#faf6f0", dark: "#1c1410" },
        foreground: { light: "#3a2a1a", dark: "#e8d8c0" },
        primary: { light: "#b45309", dark: "#fbbf24" },
        muted: { light: "#8b7355", dark: "#a89578" },
        border: { light: "#e8ddc8", dark: "#3a2a1a" },
      },
      primarySelector: ".link",
      mutedSelector: ".byline",
    },
  },
  {
    id: "preset-cool-slate",
    name: "Cool Slate",
    description:
      "Cool slate palette — light is icy gray-blue, dark is deep slate. Calm, technical.",
    input: {
      selector: ".panel",
      colorScheme: "light dark",
      tokens: {
        background: { light: "#f8fafc", dark: "#0f172a" },
        foreground: { light: "#0f172a", dark: "#f1f5f9" },
        primary: { light: "#0d9488", dark: "#2dd4bf" },
        muted: { light: "#64748b", dark: "#94a3b8" },
        border: { light: "#e2e8f0", dark: "#1e293b" },
      },
      primarySelector: ".cta",
      mutedSelector: ".meta",
    },
  },
  {
    id: "preset-vibrant",
    name: "Vibrant",
    description:
      "High-energy palette — light is soft warm white, dark is near-black with pink accent.",
    input: {
      selector: ".hero",
      colorScheme: "light dark",
      tokens: {
        background: { light: "#fff1f2", dark: "#0a0a0f" },
        foreground: { light: "#1f1018", dark: "#fce7f3" },
        primary: { light: "#db2777", dark: "#f472b6" },
        muted: { light: "#9d5d72", dark: "#c4b1ba" },
        border: { light: "#fbcfe0", dark: "#2a1622" },
      },
      primarySelector: ".accent",
      mutedSelector: ".sub",
    },
  },
];

const presets: LightDarkPreset[] = SEED_PRESETS.map((p) => ({
  ...p,
  input: {
    ...p.input,
    tokens: {
      background: { ...p.input.tokens.background },
      foreground: { ...p.input.tokens.foreground },
      primary: { ...p.input.tokens.primary },
      muted: { ...p.input.tokens.muted },
      border: { ...p.input.tokens.border },
    },
  },
}));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 4 light-dark presets. Cached. */
export async function listPresets(): Promise<LightDarkPreset[]> {
  return cacheWrap(
    "light-dark:presets",
    () =>
      Promise.resolve(
        presets.map((p) => ({
          ...p,
          input: {
            ...p.input,
            tokens: {
              background: { ...p.input.tokens.background },
              foreground: { ...p.input.tokens.foreground },
              primary: { ...p.input.tokens.primary },
              muted: { ...p.input.tokens.muted },
              border: { ...p.input.tokens.border },
            },
          },
        })),
      ),
    CACHE_TTL.lightDarkPresets,
  );
}

/** Generate light-dark() CSS from color-scheme + 5 semantic tokens. */
export async function generateLightDark(
  input: LightDarkGenerateInput,
): Promise<LightDarkResult> {
  const cacheKey = `light-dark:gen:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      const css = buildCss(input);
      const legacyCss = buildLegacyCss(input);
      const auto = input.colorScheme === "light dark";

      log.info("light-dark() generated", {
        selector: input.selector,
        colorScheme: input.colorScheme,
        auto,
      });

      return Promise.resolve({
        css,
        legacyCss,
        auto,
        explanation: buildExplanation(input),
        support: {
          baseline: "2024 (light-dark())",
          chrome: "123+",
          safari: "17.5+",
          firefox: "120+",
        },
      });
    },
    CACHE_TTL.lightDarkGenerate,
  );
}
