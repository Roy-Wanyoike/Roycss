/**
 * Style-query service — build @container style() queries from a
 * property+value+selector+declarations tuple.
 *
 * 4 style-query presets cover the canonical style() container-query
 * patterns: `--mode: dark`, `--theme: neon`, `--size: large`, and
 * `--density: compact` — each toggling a custom-property on the closest
 * container.
 *
 * Conversions are cached per (input) hash so identical requests are cheap.
 *
 * Reference: CSS Containment Module Level 3 §3 (style() container queries).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import type { StyleQueryGenerateInput } from "./schema.js";

const log = createLogger("style-query");

// ─── Types ───────────────────────────────────────────────────────────────
export interface StyleQueryResult {
  /** The full @container style() query CSS block. */
  css: string;
  /** Optional @supports fallback block (always present for browsers that
   *  don't yet support style() queries). */
  fallbackCss: string;
  /** The condition string used inside @container. */
  condition: string;
  /** Pretty-printed explanation of what triggers the query. */
  explanation: string;
  /** Browser support info. */
  support: {
    baseline: string;
    chrome: string;
    safari: string;
    firefox: string;
  };
}

export interface StyleQueryPreset {
  id: string;
  name: string;
  description: string;
  input: StyleQueryGenerateInput;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function indentDeclarations(decls: Record<string, string>): string {
  return Object.entries(decls)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
}

function buildCondition(
  containerName: string | undefined,
  property: string,
  value: string,
): string {
  const target = containerName ? `name(${containerName})` : "";
  return `@container ${target} style(${property}: ${value})`.replace(
    /\s+/g,
    " ",
  ).trim();
}

function buildFallback(input: StyleQueryGenerateInput): string {
  if (!input.fallbackDeclarations) return "";
  return [
    `/* Fallback for browsers without style() query support */`,
    `${input.selector} {`,
    indentDeclarations(input.fallbackDeclarations),
    `}`,
  ].join("\n");
}

// ─── 4 style() container-query presets ────────────────────────────────────
const PRESETS: StyleQueryPreset[] = [
  {
    id: "preset-mode-dark",
    name: "style(--mode: dark)",
    description:
      "Switch a card's surface and text colors when an ancestor container sets `--mode: dark` — the canonical dark-mode-via-style-query pattern.",
    input: {
      containerName: "card",
      property: "--mode",
      value: "dark",
      selector: ".card__body",
      declarations: {
        background: "#1c1c1e",
        color: "#f2f2f7",
        "border-color": "#3a3a3c",
      },
      fallbackDeclarations: {
        background: "#f2f2f7",
        color: "#1c1c1e",
      },
    },
  },
  {
    id: "preset-theme-neon",
    name: "style(--theme: neon)",
    description:
      "Apply neon accent + glow when an ancestor container sets `--theme: neon` — switch the whole visual identity from a single custom property.",
    input: {
      containerName: "page",
      property: "--theme",
      value: "neon",
      selector: ".btn-primary",
      declarations: {
        "background-color": "#b026ff",
        "box-shadow": "0 0 20px #b026ff, 0 0 40px #b026ff80",
        color: "#fff",
        "border-color": "#d066ff",
      },
    },
  },
  {
    id: "preset-size-large",
    name: "style(--size: large)",
    description:
      "Bump type and spacing when an ancestor container sets `--size: large` — typographic scale driven by a style() query, not a media query.",
    input: {
      containerName: "sidebar",
      property: "--size",
      value: "large",
      selector: ".sidebar__title",
      declarations: {
        "font-size": "1.5rem",
        "line-height": "1.2",
        "letter-spacing": "-0.01em",
        "margin-block": "1rem",
      },
    },
  },
  {
    id: "preset-density-compact",
    name: "style(--density: compact)",
    description:
      "Reduce padding and font-size on a list when an ancestor container sets `--density: compact` — the canonical density-switcher pattern.",
    input: {
      containerName: "list",
      property: "--density",
      value: "compact",
      selector: ".list__item",
      declarations: {
        padding: "0.25rem 0.5rem",
        "font-size": "0.8125rem",
        "line-height": "1.25",
      },
    },
  },
];

const presets: StyleQueryPreset[] = PRESETS.map((p) => ({ ...p }));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 4 style-query presets. Cached. */
export async function listPresets(): Promise<StyleQueryPreset[]> {
  return cacheWrap(
    "style-query:presets",
    () => Promise.resolve(presets.map((p) => ({ ...p }))),
    CACHE_TTL.styleQueryPresets,
  );
}

/** Build a style() container query CSS block from the input. */
export async function generateStyleQuery(
  input: StyleQueryGenerateInput,
): Promise<StyleQueryResult> {
  const cacheKey = `style-query:gen:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      // Validate that the property is either a custom property (--foo)
      // or one of the registered styleable properties.
      const isCustom = input.property.startsWith("--");
      const styleable = [
        "font-weight",
        "font-style",
        "color",
        "background-color",
        "display",
        "position",
      ];
      if (!isCustom && !styleable.includes(input.property.toLowerCase())) {
        throw AppError.badRequest(
          `Property "${input.property}" is not styleable in a style() query. ` +
            `Use a custom property (--foo) or one of: ${styleable.join(", ")}.`,
        );
      }

      const condition = buildCondition(
        input.containerName,
        input.property,
        input.value,
      );
      const declsBlock = indentDeclarations(input.declarations);
      const css = `${condition} {\n${input.selector} {\n${declsBlock}\n  }\n}`;
      const fallbackCss = buildFallback(input);

      const explanation = input.containerName
        ? `When an ancestor container named "${input.containerName}" has ${input.property}: ${input.value}, ` +
          `the rule body applies to ${input.selector}.`
        : `When the nearest ancestor container has ${input.property}: ${input.value}, ` +
          `the rule body applies to ${input.selector}.`;

      log.info("Style query generated", {
        property: input.property,
        value: input.value,
        selector: input.selector,
      });

      return Promise.resolve({
        css,
        fallbackCss,
        condition,
        explanation,
        support: {
          baseline: "2024 (style() queries)",
          chrome: "111+",
          safari: "17.4+",
          firefox: "Limited (behind flag)",
        },
      });
    },
    CACHE_TTL.styleQueryGenerate,
  );
}
