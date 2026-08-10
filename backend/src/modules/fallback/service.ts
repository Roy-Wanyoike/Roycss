/**
 * Fallback service — modern CSS properties with progressive-enhancement
 * fallback strategies.
 *
 * Mock backend (no DB). Seeds 20 modern CSS properties (each with a 3-step
 * fallback chain: graceful → @supports → modern) and 6 fallback scenarios
 * that combine multiple properties into a real-world pattern.
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

// ─── Seed: 20 modern CSS properties ──────────────────────────────────────
const SEED_PROPERTIES: Omit<FallbackProperty, "combinedCss">[] = [
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
    id: "object-fit",
    property: "object-fit",
    summary: "Control how replaced elements fill their box.",
    baseline: "2017",
    support: { chrome: "32+", safari: "10+", firefox: "36+" },
    steps: [
      {
        label: "Graceful",
        css: ".avatar img { width: 100%; height: auto; }",
        rationale: "Letterboxed image with natural aspect ratio.",
      },
      {
        label: "@supports",
        css: "@supports (object-fit: cover) {\n  .avatar img { height: 100%; object-fit: cover; }\n}",
        rationale: "Crop-fill the box once supported.",
      },
      {
        label: "Modern",
        css: ".avatar img { width: 100%; height: 100%; object-fit: cover; }",
        rationale: "No fallback needed for current browsers.",
      },
    ],
  },
  {
    id: "sticky",
    property: "position: sticky",
    summary: "Element scrolls then sticks at a threshold.",
    baseline: "2019",
    support: { chrome: "56+", safari: "13+", firefox: "59+" },
    steps: [
      {
        label: "Graceful",
        css: ".header { position: fixed; top: 0; width: 100%; z-index: 10; }",
        rationale: "Always-fixed header (covers content on scroll).",
      },
      {
        label: "@supports",
        css: "@supports (position: sticky) {\n  .header { position: sticky; }\n}",
        rationale: "Sticky keeps header in flow, no content overlap.",
      },
      {
        label: "Modern",
        css: ".header { position: sticky; top: 0; }",
        rationale: "Native sticky on every modern browser.",
      },
    ],
  },
  {
    id: "custom-properties",
    property: "CSS Custom Properties",
    summary: "Author-defined variables resolved at use-site.",
    baseline: "2017",
    support: { chrome: "49+", safari: "9.1+", firefox: "31+" },
    steps: [
      {
        label: "Graceful",
        css: ":root { color: #333; }\n.theme-dark { color: #f2f2f7; }",
        rationale: "Hard-coded values per theme; no variables.",
      },
      {
        label: "@supports",
        css: "@supports (--a: 0) {\n  :root { --fg: #333; color: var(--fg); }\n  .theme-dark { --fg: #f2f2f7; }\n}",
        rationale: "Variables drive the theme.",
      },
      {
        label: "Modern",
        css: ":root { --fg: #333; color: var(--fg); }",
        rationale: "Custom properties assumed everywhere.",
      },
    ],
  },
  {
    id: "grid",
    property: "CSS Grid",
    summary: "Two-dimensional layout system.",
    baseline: "2017",
    support: { chrome: "57+", safari: "10.1+", firefox: "52+" },
    steps: [
      {
        label: "Graceful",
        css: ".layout { display: flex; flex-wrap: wrap; }\n.layout > * { flex: 1 1 30%; }",
        rationale: "Flexbox approximation of a 3-col grid.",
      },
      {
        label: "@supports",
        css: "@supports (display: grid) {\n  .layout { display: grid; grid-template-columns: repeat(3, 1fr); }\n  .layout > * { flex: initial; }\n}",
        rationale: "Real grid for capable browsers.",
      },
      {
        label: "Modern",
        css: ".layout { display: grid; grid-template-columns: repeat(3, 1fr); }",
        rationale: "Grid everywhere; flex fallback dropped.",
      },
    ],
  },
  {
    id: "clamp",
    property: "clamp()",
    summary: "Fluid sizing between min and max with preferred value.",
    baseline: "2020",
    support: { chrome: "79+", safari: "13.1+", firefox: "75+" },
    steps: [
      {
        label: "Graceful",
        css: "h1 { font-size: 2rem; }",
        rationale: "Fixed size on older browsers.",
      },
      {
        label: "@supports",
        css: "@supports (font-size: clamp(1rem, 5vw, 3rem)) {\n  h1 { font-size: clamp(1.5rem, 5vw, 3rem); }\n}",
        rationale: "Fluid type for modern engines.",
      },
      {
        label: "Modern",
        css: "h1 { font-size: clamp(1.5rem, 5vw, 3rem); }",
        rationale: "Native fluid typography.",
      },
    ],
  },
  {
    id: "logical-props",
    property: "Logical Properties",
    summary: "Direction-agnostic equivalents of margin-left, etc.",
    baseline: "2021",
    support: { chrome: "87+", safari: "15+", firefox: "66+" },
    steps: [
      {
        label: "Graceful",
        css: ".card { margin-left: 1rem; padding-right: 1rem; }",
        rationale: "Physical directions only.",
      },
      {
        label: "@supports",
        css: "@supports (margin-inline-start: 1rem) {\n  .card { margin-inline-start: 1rem; padding-inline-end: 1rem; }\n}",
        rationale: "Logical directions honor [dir=rtl].",
      },
      {
        label: "Modern",
        css: ".card { margin-inline: 1rem; }",
        rationale: "Pure logical shorthand.",
      },
    ],
  },
  {
    id: "container-queries",
    property: "Container Queries",
    summary: "Style components based on ancestor size.",
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
    id: "color-mix",
    property: "color-mix()",
    summary: "Interpolate two colors in a given color space.",
    baseline: "2023",
    support: { chrome: "111+", safari: "16.2+", firefox: "113+" },
    steps: [
      {
        label: "Graceful",
        css: ".btn { background: #5b8def; }",
        rationale: "Pre-computed mixed color.",
      },
      {
        label: "@supports",
        css: "@supports (background: color-mix(in srgb, red, blue)) {\n  .btn { background: color-mix(in srgb, #5b8def 70%, #fff); }\n}",
        rationale: "Live color mixing.",
      },
      {
        label: "Modern",
        css: ".btn { background: color-mix(in srgb, #5b8def 70%, #fff); }",
        rationale: "Native color-mix everywhere.",
      },
    ],
  },
  {
    id: "nesting",
    property: "CSS Nesting",
    summary: "Nest child rules inside parent selectors.",
    baseline: "2023",
    support: { chrome: "112+", safari: "16.5+", firefox: "117+" },
    steps: [
      {
        label: "Graceful",
        css: ".card { /* base */ }\n.card .title { /* nested */ }",
        rationale: "Flat selectors.",
      },
      {
        label: "@supports",
        css: "@supports selector(&) {\n  .card { & .title { /* nested */ } }\n}",
        rationale: "Native nesting.",
      },
      {
        label: "Modern",
        css: ".card { & .title { font-weight: 600; } }",
        rationale: "Native nesting everywhere.",
      },
    ],
  },
  {
    id: "text-wrap-balance",
    property: "text-wrap: balance",
    summary: "Balance headline line breaks for typographic evenness.",
    baseline: "2024",
    support: { chrome: "114+", safari: "17.5+", firefox: "121+" },
    steps: [
      {
        label: "Graceful",
        css: "h1 { max-width: 20ch; }",
        rationale: "Constrain width so wrapping naturally balances.",
      },
      {
        label: "@supports",
        css: "@supports (text-wrap: balance) {\n  h1 { text-wrap: balance; }\n}",
        rationale: "Native balancing for capable engines.",
      },
      {
        label: "Modern",
        css: "h1 { text-wrap: balance; }",
        rationale: "Balanced headlines for all.",
      },
    ],
  },
  {
    id: "scroll-snap",
    property: "Scroll Snap",
    summary: "Momentum-style snapping on scroll containers.",
    baseline: "2020",
    support: { chrome: "69+", safari: "11+", firefox: "68+" },
    steps: [
      {
        label: "Graceful",
        css: ".carousel { overflow-x: auto; white-space: nowrap; }",
        rationale: "Free-scrolling carousel without snapping.",
      },
      {
        label: "@supports",
        css: "@supports (scroll-snap-type: x mandatory) {\n  .carousel { scroll-snap-type: x mandatory; }\n  .carousel > * { scroll-snap-align: start; }\n}",
        rationale: "Snap items to start.",
      },
      {
        label: "Modern",
        css: ".carousel { scroll-snap-type: x mandatory; }\n.carousel > * { scroll-snap-align: start; }",
        rationale: "Native scroll snap.",
      },
    ],
  },
  {
    id: "scroll-driven-anim",
    property: "Scroll-Driven Animations",
    summary: "Bind animation progress to scroll position.",
    baseline: "2024",
    support: { chrome: "115+", safari: "—", firefox: "Limited" },
    steps: [
      {
        label: "Graceful",
        css: ".progress { width: 50%; }",
        rationale: "Static progress; JS required otherwise.",
      },
      {
        label: "@supports",
        css: "@supports (animation-timeline: scroll()) {\n  .progress { animation: grow linear; animation-timeline: scroll(); }\n}",
        rationale: "CSS-only scroll-linked progress.",
      },
      {
        label: "Modern",
        css: "@keyframes grow { from { width: 0 } to { width: 100% } }\n.progress { animation: grow linear; animation-timeline: scroll(root); }",
        rationale: "Pure scroll-driven animation.",
      },
    ],
  },
  {
    id: "view-transitions",
    property: "View Transitions",
    summary: "Cross-document or SPA view animations.",
    baseline: "2024",
    support: { chrome: "111+", safari: "18+", firefox: "—" },
    steps: [
      {
        label: "Graceful",
        css: ".view { opacity: 1; }",
        rationale: "No transition; views swap instantly.",
      },
      {
        label: "@supports",
        css: "@supports (view-transition-name: root) {\n  ::view-transition-old(root) { animation: fade-out .25s; }\n}",
        rationale: "Animate view changes.",
      },
      {
        label: "Modern",
        css: "@media (prefers-reduced-motion: no-preference) {\n  ::view-transition-old(root) { animation: fade .25s; }\n}",
        rationale: "Respect reduced motion.",
      },
    ],
  },
  {
    id: "subgrid",
    property: "Subgrid",
    summary: "Inherit parent grid tracks inside a child grid.",
    baseline: "2023",
    support: { chrome: "117+", safari: "16+", firefox: "71+" },
    steps: [
      {
        label: "Graceful",
        css: ".parent { display: grid; grid-template-columns: repeat(4, 1fr); }\n.child { grid-column: span 2; }",
        rationale: "Child spans columns but cannot inherit tracks.",
      },
      {
        label: "@supports",
        css: "@supports (grid-template-columns: subgrid) {\n  .child { display: grid; grid-template-columns: subgrid; }\n}",
        rationale: "Inherit parent tracks for perfect alignment.",
      },
      {
        label: "Modern",
        css: ".child { display: grid; grid-template-columns: subgrid; }",
        rationale: "Native subgrid.",
      },
    ],
  },
  {
    id: "intrinsic-sizing",
    property: "Intrinsic Sizing (min-content / max-content / fit-content)",
    summary: "Size boxes based on content rather than fixed lengths.",
    baseline: "2021",
    support: { chrome: "46+", safari: "11+", firefox: "66+" },
    steps: [
      {
        label: "Graceful",
        css: ".tag { width: 80px; }",
        rationale: "Fixed width; long text overflows.",
      },
      {
        label: "@supports",
        css: "@supports (width: fit-content) {\n  .tag { width: fit-content; }\n}",
        rationale: "Box shrinks to content.",
      },
      {
        label: "Modern",
        css: ".tag { width: fit-content; }",
        rationale: "Native intrinsic sizing.",
      },
    ],
  },
  {
    id: "oklch",
    property: "oklch() color",
    summary: "Perceptually-uniform lightness/chroma/hue color function.",
    baseline: "2023",
    support: { chrome: "111+", safari: "15.4+", firefox: "113+" },
    steps: [
      {
        label: "Graceful",
        css: ".accent { color: #5b8def; }",
        rationale: "Hex fallback.",
      },
      {
        label: "@supports",
        css: "@supports (color: oklch(0.7 0.15 250)) {\n  .accent { color: oklch(0.65 0.18 260); }\n}",
        rationale: "Perceptually-uniform color.",
      },
      {
        label: "Modern",
        css: ".accent { color: oklch(0.65 0.18 260); }",
        rationale: "Native OKLCH.",
      },
    ],
  },
  {
    id: "anchor-positioning",
    property: "CSS Anchor Positioning",
    summary: "Position an element relative to an anchor element.",
    baseline: "2024",
    support: { chrome: "125+", safari: "—", firefox: "—" },
    steps: [
      {
        label: "Graceful",
        css: ".tooltip { position: absolute; top: -2rem; left: 0; }",
        rationale: "Hard-coded offsets; JS for true anchoring.",
      },
      {
        label: "@supports",
        css: "@supports (anchor-name: --tip) {\n  .anchor { anchor-name: --tip; }\n  .tooltip { position-area: top; position-anchor: --tip; }\n}",
        rationale: "Anchor-driven positioning.",
      },
      {
        label: "Modern",
        css: ".anchor { anchor-name: --tip; }\n.tooltip { position-anchor: --tip; top: anchor(bottom); }",
        rationale: "Native anchor positioning.",
      },
    ],
  },
];

const properties: FallbackProperty[] = SEED_PROPERTIES.map((p) => ({
  ...p,
  combinedCss: combine(p.steps),
}));

// ─── Seed: 6 fallback scenarios ──────────────────────────────────────────
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

const SEED_SCENARIOS: FallbackPreset[] = [
  {
    id: "scenario-responsive-media",
    name: "Responsive Media",
    description: "Combine aspect-ratio + object-fit for bulletproof media boxes.",
    propertyIds: ["aspect-ratio", "object-fit"],
    css: cssFor(["aspect-ratio", "object-fit"]),
  },
  {
    id: "scenario-fluent-card",
    name: "Fluent Card Layout",
    description: "Card with gap, sticky header, and clamp() fluid title.",
    propertyIds: ["gap", "sticky", "clamp"],
    css: cssFor(["gap", "sticky", "clamp"]),
  },
  {
    id: "scenario-themed-app",
    name: "Themed App Shell",
    description: "Custom properties drive theme, logical properties keep RTL sane.",
    propertyIds: ["custom-properties", "logical-props"],
    css: cssFor(["custom-properties", "logical-props"]),
  },
  {
    id: "scenario-component-driven",
    name: "Component-Driven Layout",
    description: "Container queries + subgrid for perfectly aligned cards.",
    propertyIds: ["container-queries", "subgrid"],
    css: cssFor(["container-queries", "subgrid"]),
  },
  {
    id: "scenario-modern-typography",
    name: "Modern Typography",
    description: "Balanced headlines + fluid sizing + perceptual color.",
    propertyIds: ["text-wrap-balance", "clamp", "oklch"],
    css: cssFor(["text-wrap-balance", "clamp", "oklch"]),
  },
  {
    id: "scenario-rich-interactions",
    name: "Rich Interactions",
    description: ":has() + view transitions + scroll-driven animations.",
    propertyIds: ["has-selector", "view-transitions", "scroll-driven-anim"],
    css: cssFor(["has-selector", "view-transitions", "scroll-driven-anim"]),
  },
];

const presets: FallbackPreset[] = SEED_SCENARIOS.map((p) => ({ ...p }));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 20 modern CSS properties (summary form, no full CSS block). */
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
