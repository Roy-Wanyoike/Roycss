/**
 * Fallback service — modern CSS properties with progressive-enhancement
 * fallback strategies.
 *
 * 8 @supports fallback properties (backdrop-filter, aspect-ratio, gap,
 * :has(), @container, @scope, light-dark(), relative-color()) — each with
 * a 3-step fallback chain (graceful → @supports → modern) demonstrating
 * how to ship modern CSS while still supporting older engines.
 *
 * Reads are LRU-cached; lookups by id are cached per id.
 *
 * Reference: CSS Cascading and Inheritance Level 5 + caniuse tables.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("fallback");

// ─── Types ───────────────────────────────────────────────────────────────
export interface FallbackStep {
  /** Step label, e.g. "Graceful", "@supports", "Modern". */
  label: string;
  /** CSS snippet for this step. */
  css: string;
  /** Why this step exists / what it covers. */
  rationale: string;
}

export interface FallbackProperty {
  id: string;
  /** CSS property name, e.g. "aspect-ratio". */
  property: string;
  /** One-line summary of what the property does. */
  summary: string;
  /** Baseline status. */
  baseline: string;
  /** Browser support: Chrome / Safari / Firefox minimum versions. */
  support: { chrome: string; safari: string; firefox: string };
  /** Ordered fallback chain (oldest first, modern last). */
  steps: FallbackStep[];
  /** Generated combined CSS block (all 3 steps in order). */
  combinedCss: string;
}

export interface FallbackPreset {
  id: string;
  name: string;
  description: string;
  /** Property ids this scenario combines. */
  propertyIds: string[];
  /** Full generated CSS for the scenario. */
  css: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function combine(steps: FallbackStep[]): string {
  return steps.map((s) => `/* ${s.label} — ${s.rationale} */\n${s.css}`).join("\n\n");
}

// ─── 8 modern CSS properties with @supports fallback chains ────────────────
const PROPERTIES: Omit<FallbackProperty, "combinedCss">[] = [
  {
    id: "backdrop-filter",
    property: "backdrop-filter",
    summary: "Apply filters to the area behind an element — glass / frost / blur effects.",
    baseline: "2024",
    support: { chrome: "76+", safari: "9+ (prefixed -webkit-)", firefox: "103+" },
    steps: [
      {
        label: "Graceful",
        css: ".glass { background: rgba(255, 255, 255, 0.85); }",
        rationale: "Solid translucent background — no blur, no glass effect, but readable.",
      },
      {
        label: "@supports",
        css: "@supports (backdrop-filter: blur(8px)) {\n  .glass { backdrop-filter: blur(8px); background: rgba(255, 255, 255, 0.5); }\n}\n@supports (-webkit-backdrop-filter: blur(8px)) {\n  .glass { -webkit-backdrop-filter: blur(8px); }\n}",
        rationale: "Add real backdrop blur on capable engines (with -webkit- prefix for older Safari).",
      },
      {
        label: "Modern",
        css: ".glass { backdrop-filter: blur(8px); background: rgba(255, 255, 255, 0.5); }",
        rationale: "Native backdrop-filter everywhere; the unblurred fallback is dropped.",
      },
    ],
  },
  {
    id: "aspect-ratio",
    property: "aspect-ratio",
    summary: "Maintain a width/height ratio without padding hacks.",
    baseline: "2021",
    support: { chrome: "88+", safari: "15+", firefox: "89+" },
    steps: [
      {
        label: "Graceful",
        css: ".media { padding-top: 56.25%; position: relative; }",
        rationale: "Padding hack holds the ratio on ancient browsers.",
      },
      {
        label: "@supports",
        css: "@supports (aspect-ratio: 16/9) {\n  .media { padding-top: 0; aspect-ratio: 16/9; }\n}",
        rationale: "Swap to native aspect-ratio when supported.",
      },
      {
        label: "Modern",
        css: ".media { aspect-ratio: 16/9; }",
        rationale: "Drop the padding hack entirely once Baseline is met.",
      },
    ],
  },
  {
    id: "gap",
    property: "gap",
    summary: "Spacing between flex/grid items without margins.",
    baseline: "2021",
    support: { chrome: "84+", safari: "14.1+", firefox: "63+" },
    steps: [
      {
        label: "Graceful",
        css: ".row > * { margin-left: 1rem; }\n.row > *:first-child { margin-left: 0; }",
        rationale: "Lobotomized owl / sibling margins pre-flex gap.",
      },
      {
        label: "@supports",
        css: "@supports (gap: 1rem) {\n  .row { gap: 1rem; }\n  .row > * { margin-left: 0; }\n}",
        rationale: "Use real gap once it's supported on flex containers.",
      },
      {
        label: "Modern",
        css: ".row { display: flex; gap: 1rem; }",
        rationale: "Pure gap; no margins needed.",
      },
    ],
  },
  {
    id: "has-selector",
    property: ":has()",
    summary: "Parent/state selector based on descendant state.",
    baseline: "2023",
    support: { chrome: "105+", safari: "15.4+", firefox: "121+" },
    steps: [
      {
        label: "Graceful",
        css: ".card.is-highlighted { border-color: gold; }",
        rationale: "JS toggles a class on the parent.",
      },
      {
        label: "@supports",
        css: "@supports selector(:has(*)) {\n  .card:has(.badge-featured) { border-color: gold; }\n}",
        rationale: "CSS-only parent state.",
      },
      {
        label: "Modern",
        css: ".card:has(.badge-featured) { border-color: gold; }",
        rationale: "Native :has() everywhere.",
      },
    ],
  },
  {
    id: "container-queries",
    property: "@container",
    summary: "Style components based on ancestor size or style.",
    baseline: "2023",
    support: { chrome: "105+", safari: "16+", firefox: "110+" },
    steps: [
      {
        label: "Graceful",
        css: ".card { font-size: 1rem; }\n@media (min-width: 600px) { .card { font-size: 1.25rem; } }",
        rationale: "Viewport queries (not component-aware).",
      },
      {
        label: "@supports",
        css: "@supports (container-type: inline-size) {\n  .card { container-type: inline-size; }\n  @container (min-width: 300px) {\n    .card__title { font-size: 1.25rem; }\n  }\n}",
        rationale: "Component-driven layout.",
      },
      {
        label: "Modern",
        css: ".card { container-type: inline-size; }\n@container (min-width: 300px) { .card__title { font-size: 1.25rem; } }",
        rationale: "Pure container queries.",
      },
    ],
  },
  {
    id: "scope",
    property: "@scope",
    summary: "Limit a style rule's reach to a subtree (with optional upper bound).",
    baseline: "2024",
    support: { chrome: "118+", safari: "17.4+", firefox: "—" },
    steps: [
      {
        label: "Graceful",
        css: ".card .title { font-weight: 700; }\n.card .body p { line-height: 1.6; }",
        rationale: "Longhand descendant selectors — verbose, no upper bound, can leak to nested components.",
      },
      {
        label: "@supports",
        css: "@supports selector(:scope) {\n  @scope (.card) {\n    :scope .title { font-weight: 700; }\n    :scope .body p { line-height: 1.6; }\n  }\n}",
        rationale: "Use @scope to bound styles to the .card subtree only. (Note: @scope has no direct @supports query; this pattern uses :scope support as a proxy.)",
      },
      {
        label: "Modern",
        css: "@scope (.card) {\n  .title { font-weight: 700; }\n  .body p { line-height: 1.6; }\n}",
        rationale: "Native @scope — implicit :scope, no leak to nested cards.",
      },
    ],
  },
  {
    id: "light-dark",
    property: "light-dark()",
    summary: "Single declaration that resolves to light or dark value based on color-scheme.",
    baseline: "2024",
    support: { chrome: "123+", safari: "17.5+", firefox: "120+" },
    steps: [
      {
        label: "Graceful",
        css: ".card { background: #fff; color: #1c1c1e; }\n@media (prefers-color-scheme: dark) {\n  .card { background: #18181b; color: #fafafa; }\n}",
        rationale: "Explicit @media (prefers-color-scheme) block — verbose, no per-element overrides.",
      },
      {
        label: "@supports",
        css: "@supports (color: light-dark(white, black)) {\n  .card {\n    color-scheme: light dark;\n    background: light-dark(#fff, #18181b);\n    color: light-dark(#1c1c1e, #fafafa);\n  }\n}",
        rationale: "Single light-dark() declaration serves both schemes via the inherited color-scheme.",
      },
      {
        label: "Modern",
        css: ":root { color-scheme: light dark; }\n.card { background: light-dark(#fff, #18181b); color: light-dark(#1c1c1e, #fafafa); }",
        rationale: "Native light-dark() — no @media duplication; works with per-element color-scheme overrides too.",
      },
    ],
  },
  {
    id: "relative-color",
    property: "relative-color() (rgb(from ...) / oklch(from ...))",
    summary: "Derive a new color from a source color's channels via calc expressions.",
    baseline: "2024",
    support: { chrome: "119+", safari: "16.4+", firefox: "128+" },
    steps: [
      {
        label: "Graceful",
        css: ".btn { background: #5b8def; }\n.btn:hover { background: #4a7fc7; }",
        rationale: "Pre-computed hover color — duplicates the source hex with no shared variable.",
      },
      {
        label: "@supports",
        css: "@supports (background: rgb(from red r g b)) {\n  .btn { background: #5b8def; }\n  .btn:hover { background: rgb(from #5b8def calc(r + 20) g b); }\n}",
        rationale: "Derive the hover color from the base — single source of truth.",
      },
      {
        label: "Modern",
        css: ".btn { background: #5b8def; }\n.btn:hover { background: rgb(from #5b8def calc(r + 20) g b); }",
        rationale: "Native relative-color syntax — calc-driven derivations everywhere.",
      },
    ],
  },
];

const properties: FallbackProperty[] = PROPERTIES.map((p) => ({
  ...p,
  combinedCss: combine(p.steps),
}));

// ─── Fallback scenarios that combine multiple properties ──────────────────
function cssFor(ids: string[]): string {
  return ids
    .map((id) => {
      const p = properties.find((x) => x.id === id);
      if (!p) return "";
      return `/* ─── ${p.property} ─── */\n${p.combinedCss}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

const SCENARIOS: FallbackPreset[] = [
  {
    id: "scenario-glass-card",
    name: "Glass Card",
    description: "backdrop-filter + aspect-ratio + gap for a bulletproof glass-card layout.",
    propertyIds: ["backdrop-filter", "aspect-ratio", "gap"],
    css: cssFor(["backdrop-filter", "aspect-ratio", "gap"]),
  },
  {
    id: "scenario-themed-card",
    name: "Themed Card with :has()",
    description: "light-dark() drives the color scheme and :has() flips the card style when a badge is present.",
    propertyIds: ["light-dark", "has-selector"],
    css: cssFor(["light-dark", "has-selector"]),
  },
  {
    id: "scenario-scoped-component",
    name: "Scoped Component Layout",
    description: "@scope + @container + gap for a self-contained, container-aware component.",
    propertyIds: ["scope", "container-queries", "gap"],
    css: cssFor(["scope", "container-queries", "gap"]),
  },
  {
    id: "scenario-derived-buttons",
    name: "Derived Button States",
    description: "relative-color() + light-dark() for a single-source button palette that adapts to color scheme.",
    propertyIds: ["relative-color", "light-dark"],
    css: cssFor(["relative-color", "light-dark"]),
  },
  {
    id: "scenario-modern-foundation",
    name: "Modern Foundation",
    description: "aspect-ratio + gap + light-dark() — the three properties every modern layout starts with.",
    propertyIds: ["aspect-ratio", "gap", "light-dark"],
    css: cssFor(["aspect-ratio", "gap", "light-dark"]),
  },
  {
    id: "scenario-rich-interactions",
    name: "Rich Interactions",
    description: ":has() + @scope + relative-color for stateful, scoped, derived-from-source styling.",
    propertyIds: ["has-selector", "scope", "relative-color"],
    css: cssFor(["has-selector", "scope", "relative-color"]),
  },
];

const presets: FallbackPreset[] = SCENARIOS.map((p) => ({ ...p }));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 8 modern CSS properties (summary form, no full CSS block). */
export async function listProperties(): Promise<
  Omit<FallbackProperty, "steps" | "combinedCss">[]
> {
  return cacheWrap(
    "fallback:properties",
    () =>
      Promise.resolve(
        properties.map((p) => ({
          id: p.id,
          property: p.property,
          summary: p.summary,
          baseline: p.baseline,
          support: { ...p.support },
        })),
      ),
    CACHE_TTL.fallbackProperties,
  );
}

/** Get a single property's full fallback chain. Cached per id. */
export async function getPropertyById(
  id: string,
): Promise<FallbackProperty> {
  return cacheWrap(
    `fallback:property:${id}`,
    () => {
      const found = properties.find((p) => p.id === id);
      if (!found) {
        throw AppError.notFound(`Property '${id}' not found`);
      }
      return Promise.resolve({
        ...found,
        steps: found.steps.map((s) => ({ ...s })),
        support: { ...found.support },
      });
    },
    CACHE_TTL.fallbackPropertyDetail,
  );
}

/** List all 6 fallback scenarios (full CSS included). */
export async function listPresets(): Promise<FallbackPreset[]> {
  return cacheWrap(
    "fallback:presets",
    () => Promise.resolve(presets.map((p) => ({ ...p }))),
    CACHE_TTL.fallbackPresets,
  );
}
