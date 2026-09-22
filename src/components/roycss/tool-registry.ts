/**
 * Tool registry — the single live source of truth for the developer tools
 * surfaced in the <PlatformTools/> sheet.
 *
 * Extracted from platform-tools.tsx (issue #185): TOOL_META previously lived
 * inside the lazy tool sheet while a second, diverging copy sat in the dead
 * platform-ecosystem.tsx. Everything tool-related now derives from here:
 *
 *  - <PlatformTools/> renders `TOOL_META[tool]` for the active tool
 *  - <DevToolsGallery/> browses `TOOL_IDS` with categories + search
 *  - roycss-page derives the #tool= deep-link allowlist from TOOL_IDS
 *  - site-stats TOOL_COUNT is guarded against TOOL_IDS.length by test
 *
 * This module is intentionally light (metadata + lucide icons only) so the
 * heavy tool implementations in platform-tools.tsx stay in their lazy chunk.
 */

import type { ComponentType } from "react";
import {
  AlignLeft,
  ArrowDownUp,
  ArrowLeftRight,
  Blend,
  Box,
  Boxes,
  Brush,
  Calculator,
  CaseSensitive,
  Clapperboard,
  Crosshair,
  Disc,
  Dna,
  DoorOpen,
  Droplet,
  Film,
  Filter,
  Frame,
  Gauge,
  GitCompare,
  Globe,
  Grid2x2,
  Grid3x3,
  Images,
  Image,
  FileBox,
  Keyboard,
  Languages,
  Layers,
  Layers3,
  LayoutGrid,
  Microscope,
  Minimize2,
  MoonStar,
  MousePointer2,
  Move,
  MoveVertical,
  Network,
  Palette,
  Printer,
  Proportions,
  Radar,
  Rows3,
  Ruler,
  ScanSearch,
  ScrollText,
  Shapes,
  ShieldQuestion,
  Spline,
  Split,
  SquareStack,
  Scale,
  Search,
  Sparkles,
  Stethoscope,
  SunMoon,
  TableProperties,
  Target,
  Timer,
  Trophy,
  Type,
  Zap,
} from "lucide-react";

export type ToolType =
  | "ai-playground"
  | "css-doctor"
  | "utility-explorer"
  | "benchmark"
  | "genome"
  | "ai-migration"
  | "challenges"
  | "design-diff"
  | "css-minifier"
  | "specificity"
  | "easing"
  | "stacking"
  | "similarity"
  | "perf"
  | "browser-support"
  | "print"
  | "selector-tester"
  | "dark-mode"
  | "variable-graph"
  | "fluid-type"
  | "scroll-animation"
  | "grid-areas"
  | "container-query"
  | "nesting"
  | "contrast-matrix"
  | "unit-converter"
  | "box-model"
  | "flex-playground"
  | "transition-studio"
  | "pattern-generator"
  | "transform-studio"
  | "cursor-gallery"
  | "scrollbar-styler"
  | "gap-spacing"
  | "writing-mode"
  | "object-fit"
  | "positioning"
  | "property-inspector"
  | "animation-timeline"
  | "sprite-sheet"
  | "text-shadow"
  | "filter-studio"
  | "conic-gradient"
  | "motion-path"
  | "view-transition"
  | "mask-studio"
  | "gradient-mesh"
  | "table-styler"
  | "aspect-ratio"
  | "shape-generator"
  | "scroll-snap"
  | "keyframes-studio"
  | "theming-engine"
  | "has-selector-tester"
  | "css-layers"
  | "input-mode"
  | "cascade-specificity"
  | "color-space"
  | "style-query"
  | "scope"
  | "subgrid"
  | "fallback"
  | "logical-properties"
  | "initial-letter"
  | "text-wrap"
  | "property-registrar"
  | "relative-color"
  | "starting-style"
  | "light-dark"
  | "css-lint";

export interface ToolMeta {
  title: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
}

export const TOOL_META: Record<ToolType, ToolMeta> = {
  "ai-playground": { title: "AI Playground", icon: Sparkles, description: "Describe an effect in plain English — AI generates production-ready RoyCSS." },
  "css-doctor": { title: "CSS Doctor", icon: Stethoscope, description: "Paste your CSS — get a health score, diagnostics, and auto-fixes." },
  "utility-explorer": { title: "Utility Explorer", icon: Microscope, description: "Hover any effect to see its CSS properties, size, and compliance score." },
  "benchmark": { title: "Benchmark Tool", icon: Gauge, description: "Live-performance test any effect with 100 simultaneous instances." },
  "genome": { title: "Component Genome", icon: Dna, description: "Inspect any effect's DNA — selectors, keyframes, properties, color system, modern features, and accessibility notes." },
  "ai-migration": { title: "AI Migration", icon: ArrowLeftRight, description: "Convert Bootstrap, Tailwind, Material, Bulma, or Foundation CSS to RoyCSS (OKLCH + logical properties)." },
  "challenges": { title: "Community Challenges", icon: Trophy, description: "Complete CSS challenges, earn XP, and climb the leaderboard." },
  "design-diff": { title: "Design Diff", icon: GitCompare, description: "Compare two CSS blocks — see exactly what properties were added, changed, or removed." },
  "css-minifier": { title: "CSS Minifier", icon: Minimize2, description: "Paste CSS → get minified output with size savings and gzip estimate." },
  "specificity": { title: "Specificity Calculator", icon: Calculator, description: "Paste CSS selectors → see each one's (a, b, c) specificity score, ranked." },
  "easing": { title: "Easing Visualizer", icon: Spline, description: "Design cubic-bezier curves visually — drag control points, compare presets, copy CSS." },
  "stacking": { title: "Stacking Context Inspector", icon: Layers, description: "Paste HTML → see the stacking-context tree, or sandbox z-index live." },
  "similarity": { title: "Effect Similarity Finder", icon: Radar, description: "Pick any effect → instantly find the most similar effects in the library." },
  "perf": { title: "CSS Performance Analyzer", icon: Zap, description: "Paste CSS → get a 0–100 performance score with categorized findings and fixes." },
  "browser-support": { title: "Browser Support Matrix", icon: Globe, description: "Look up caniuse-style support for 27 modern CSS features across 5 major browsers." },
  "print": { title: "Print Stylesheet Simulator", icon: Printer, description: "Preview @media print CSS in a live iframe — see exactly what prints, without the print dialog." },
  "selector-tester": { title: "Selector Tester", icon: Crosshair, description: "Type any CSS selector → instantly see matching elements highlighted in a live HTML sample." },
  "dark-mode": { title: "Dark Mode Converter", icon: MoonStar, description: "Paste light-mode colors → auto-generate a perceptually-tuned dark palette via OKLCH lightness inversion." },
  "variable-graph": { title: "Variable Dependency Graph", icon: Network, description: "Paste CSS with var() → visualize the dependency graph, detect cycles, undefined refs, and unused tokens." },
  "fluid-type": { title: "Fluid Typography Calculator", icon: Type, description: "Generate clamp() fluid type scales with a live multi-viewport preview at 320–1440px." },
  "scroll-animation": { title: "Scroll-Driven Animation Builder", icon: ArrowDownUp, description: "Build animation-timeline: scroll() / view() CSS with a live scrollable preview that actually scrolls." },
  "grid-areas": { title: "Grid Template Areas Builder", icon: LayoutGrid, description: "Visually design grid-template-areas maps — paint named regions, get copy-ready CSS with a live layout preview." },
  "container-query": { title: "Container Query Builder", icon: SquareStack, description: "Build @container queries with a live resizable container preview that responds to its own width, not the viewport." },
  "nesting": { title: "CSS Nesting Converter", icon: GitCompare, description: "Convert flat CSS to native nesting (with &) and back. Round-trip safe, handles @media, combinators, pseudo-classes." },
  "contrast-matrix": { title: "Color Contrast Matrix", icon: Grid2x2, description: "Check WCAG contrast for every color pair in your palette at once. AAA/AA/AA-Large/Fail matrix with failing-pair report." },
  "unit-converter": { title: "Unit Converter Pro", icon: Ruler, description: "Convert between all 16 CSS length units (px, rem, em, vw, vh, pt, cm, Q…) with a root font-size + viewport simulator and batch CSS conversion." },
  "box-model": { title: "Box Model Visualizer", icon: Box, description: "Interactive box model diagram — tweak margin/border/padding/content with live sliders, toggle box-sizing, get computed dimensions + generated CSS." },
  "flex-playground": { title: "Flexbox Playground", icon: Rows3, description: "Full flexbox playground — container + per-item controls, live layout preview, add/remove items, generated CSS with flex shorthand." },
  "transition-studio": { title: "Transition Studio", icon: Timer, description: "Build multi-property CSS transitions with per-property timing/delay/easing, live hover/click trigger, and generated shorthand CSS." },
  "pattern-generator": { title: "Background Pattern Generator", icon: Shapes, description: "Generate pure-CSS background patterns (stripes, grid, dots, checker, triangles, zigzag) with color + size controls and copy-ready CSS." },
  "transform-studio": { title: "Transform Studio", icon: Move, description: "Visual builder for CSS transform — combine translate/rotate/scale/skew/3D with live preview, transform-origin picker, and layer reordering." },
  "cursor-gallery": { title: "Cursor Preview Gallery", icon: MousePointer2, description: "Hover-preview every CSS cursor value (pointer, grab, text, resize…), search by category, and build custom cursors with hotspot." },
  "scrollbar-styler": { title: "Scrollbar Styler", icon: ScrollText, description: "Design custom CSS scrollbars — width, colors, radius, hover, border. Cross-browser (WebKit + Firefox). Live preview with 6 presets." },
  "gap-spacing": { title: "Gap & Spacing Calculator", icon: Ruler, description: "Calculate CSS gap, margin, padding with 5 spacing systems (8px grid, 4px grid, modular scale, Tailwind, custom). Smart shorthand output." },
  "writing-mode": { title: "Writing Mode Playground", icon: Languages, description: "Explore CSS writing-mode, direction, text-orientation for vertical text, RTL, and CJK layouts. Logical properties mapping + RTL flip demo." },
  "object-fit": { title: "Object Fit Visualizer", icon: Image, description: "Compare object-fit values (fill, contain, cover, none, scale-down) with live preview on different aspect ratios. Side-by-side comparison." },
  "positioning": { title: "Positioning Playground", icon: Move, description: "Interactive CSS position playground — static/relative/absolute/fixed/sticky. Draggable target, inset controls, z-index, sticky scroll demo." },
  "property-inspector": { title: "Custom Property Inspector", icon: Search, description: "Extract every --custom-property from your CSS with resolved values, type detection, usage counts, and inheritance chains." },
  "animation-timeline": { title: "Animation Timeline", icon: Film, description: "Visualize multiple CSS animations on a Gantt-style timeline. See overlaps, play with a scrubber, generate shorthand CSS." },
  "sprite-sheet": { title: "Sprite Sheet Generator", icon: Images, description: "Combine images into a sprite sheet and generate background-position CSS + steps() animation. Download PNG, copy CSS." },
  "text-shadow": { title: "Text Shadow Studio", icon: Type, description: "Design multi-layer text-shadows with live preview, 9 curated presets (neon, 3D, fire, retro), and generated CSS." },
  "filter-studio": { title: "Filter Studio Pro", icon: Filter, description: "Chain multiple CSS filters (blur, brightness, hue-rotate, drop-shadow…) with live preview, before/after comparison, and SVG filter export." },
  "conic-gradient": { title: "Conic Gradient Generator", icon: Disc, description: "Build conic-gradient() and repeating-conic-gradient() with a draggable angle dial, color stops, center-point pad, and 6 presets." },
  "motion-path": { title: "Motion Path Animator", icon: Spline, description: "Draw a path and animate an element along it using CSS offset-path. 5 path types, 8 presets, live preview with real offset-path animation." },
  "view-transition": { title: "View Transition Builder", icon: SquareStack, description: "Build View Transitions API demos — 6 transition types (morph, fade, slide, zoom, flip, custom) with a live startViewTransition() trigger." },
  "mask-studio": { title: "Mask Studio", icon: Brush, description: "Visual CSS mask builder — gradient masks, image masks (8 SVG presets), text masks. Live preview with -webkit- prefixes. Copy production CSS." },
  "gradient-mesh": { title: "Gradient Mesh Generator", icon: Blend, description: "Create mesh-gradient backgrounds with multiple overlapping radial-gradients. Drag stops on preview, blend modes, 8 presets, randomize." },
  "table-styler": { title: "Table Styler", icon: TableProperties, description: "Style HTML tables — borders, headers, striped rows, hover, sticky header, responsive. Live preview with mock data. 6 presets." },
  "aspect-ratio": { title: "Aspect Ratio Calculator", icon: Proportions, description: "Compute dimensions from aspect ratios, visualize responsive behavior, generate modern + fallback CSS. Reference table of 8 common ratios." },
  "shape-generator": { title: "Shape Generator", icon: Frame, description: "14 CSS shapes (circle, star, heart, hexagon) with visual clip-path polygon editor and border-radius sliders." },
  "scroll-snap": { title: "Scroll Snap Builder", icon: MoveVertical, description: "Interactive scroll-snap-type/align builder with live scrollable preview and 4 presets." },
  "keyframes-studio": { title: "Keyframes Studio", icon: Clapperboard, description: "Visual @keyframes editor with timeline stops, per-stop transform/color controls, live preview, 6 presets." },
  "theming-engine": { title: "Theming Engine", icon: Droplet, description: "Design token generator from a single primary color — 12 OKLCH tokens, 3 export formats, WCAG contrast checks." },
  "has-selector-tester": { title: ":has() Selector Tester", icon: ScanSearch, description: "Live DOM tree builder with real querySelectorAll matching, 6 preset scenarios, highlight matching elements." },
  "css-layers": { title: "CSS Layers Visualizer", icon: Layers3, description: "@layer cascade visualizer with add/reorder layers, live preview via scoped style injection, priority diagram." },
  "input-mode": { title: "Input Mode Explorer", icon: Keyboard, description: "inputmode + enterkeyhint + autocomplete explorer with stylized keyboard mockups and reference tables." },
  "cascade-specificity": { title: "Cascade Specificity Explorer", icon: Scale, description: "CSS parser + specificity computer with :where() stripping, cascade resolution visualization, 3 presets." },
  "color-space": { title: "Color Space Explorer", icon: Palette, description: "Convert colors between sRGB, HSL, OKLCH, OKLab, Display-P3. Gamut visualization, 2D chroma-lightness plane, copy-ready CSS with sRGB fallback." },
  "style-query": { title: "Container Style Query Builder", icon: Boxes, description: "Build @container style(--foo: value) queries (Baseline 2023) with live container custom-property switching and 3 presets." },
  "scope": { title: "@scope Rule Tester", icon: Target, description: "Playground for CSS @scope (Baseline 2024) with DOM tree builder, scope-root + scope-limit selectors, donut-scope visualization." },
  "subgrid": { title: "Subgrid Builder", icon: Grid3x3, description: "Visual builder for grid-template-columns: subgrid (Baseline 2023). Parent track definitions inherited by nested grids with aligned track lines." },
  "fallback": { title: "Property Fallback Analyzer", icon: ShieldQuestion, description: "Generate progressive-enhancement CSS with @supports feature queries for 20 modern properties. Old syntax → @supports → modern syntax chain." },
  "logical-properties": { title: "Logical Properties Mapper", icon: ArrowLeftRight, description: "Map physical → logical CSS properties (margin-left → margin-inline-start). RTL/vertical writing-mode demo, paste-physical-get-logical converter." },
  "initial-letter": { title: "Initial Letter Studio", icon: CaseSensitive, description: "Design CSS initial-letter drop caps (Baseline 2024). Size/sink sliders, raised vs sunken caps, 3-way comparison with legacy float hack, 6 presets." },
  "text-wrap": { title: "Text Wrap Balance Studio", icon: AlignLeft, description: "Explore text-wrap: balance/pretty, line-break, word-break, hyphens, hanging-punctuation. Before/after comparison with balance score, 6 presets." },
  "property-registrar": { title: "@property Registrar", icon: FileBox, description: "Register typed CSS custom properties with @property (Houdini). Syntax picker, inheritance toggle, animated transition demo vs untyped var." },
  "relative-color": { title: "Relative Color Builder", icon: Split, description: "CSS Relative Color Syntax (Baseline 2024) — rgb(from red calc(r + 20) g b). Channel math editors, source→derived preview, 6 presets." },
  "starting-style": { title: "@starting-style Studio", icon: DoorOpen, description: "Animate elements entering the DOM with @starting-style (Baseline 2024). transition-behavior: allow-discrete for display animations, side-by-side comparison." },
  "light-dark": { title: "Light-Dark() Explorer", icon: SunMoon, description: "CSS light-dark() function (Baseline 2024) — auto-switch colors by color-scheme. Palette builder, side-by-side vs @media boilerplate, 4 presets." },
  "css-lint": { title: "Code Health Linter", icon: ScanSearch, description: "Paste CSS or markup → cascade, color, and namespace findings from the same engine that powers roycss lint [--fix]. Safe auto-fixes, rules reference, CLI parity." },
};

/* ─── Categories ────────────────────────────────────────────────
   Every tool id maps to exactly one category; tests/unit/
   tool-registry.test.ts guards completeness (keys === TOOL_IDS). */

export type ToolCategoryId =
  | "ai"
  | "diagnostics"
  | "layout"
  | "color"
  | "motion"
  | "generators"
  | "typography"
  | "selectors"
  | "utilities";

export const TOOL_CATEGORY: Record<ToolType, ToolCategoryId> = {
  // AI & Automation (4)
  "ai-playground": "ai",
  "ai-migration": "ai",
  "genome": "ai",
  "challenges": "ai",
  // Diagnostics & Audit (9)
  "css-doctor": "diagnostics",
  "benchmark": "diagnostics",
  "similarity": "diagnostics",
  "perf": "diagnostics",
  "browser-support": "diagnostics",
  "specificity": "diagnostics",
  "cascade-specificity": "diagnostics",
  "design-diff": "diagnostics",
  "css-lint": "diagnostics",
  // Layout & Grid (13)
  "grid-areas": "layout",
  "container-query": "layout",
  "subgrid": "layout",
  "box-model": "layout",
  "flex-playground": "layout",
  "gap-spacing": "layout",
  "positioning": "layout",
  "object-fit": "layout",
  "aspect-ratio": "layout",
  "scroll-snap": "layout",
  "logical-properties": "layout",
  "stacking": "layout",
  "nesting": "layout",
  // Color & Theming (8)
  "color-space": "color",
  "relative-color": "color",
  "light-dark": "color",
  "dark-mode": "color",
  "theming-engine": "color",
  "contrast-matrix": "color",
  "variable-graph": "color",
  "gradient-mesh": "color",
  // Animation & Motion (7)
  "animation-timeline": "motion",
  "scroll-animation": "motion",
  "motion-path": "motion",
  "view-transition": "motion",
  "keyframes-studio": "motion",
  "transition-studio": "motion",
  "easing": "motion",
  // Generators & Studios (11)
  "pattern-generator": "generators",
  "shape-generator": "generators",
  "conic-gradient": "generators",
  "sprite-sheet": "generators",
  "mask-studio": "generators",
  "filter-studio": "generators",
  "transform-studio": "generators",
  "table-styler": "generators",
  "scrollbar-styler": "generators",
  "cursor-gallery": "generators",
  "text-shadow": "generators",
  // Typography & Writing (6)
  "fluid-type": "typography",
  "text-wrap": "typography",
  "initial-letter": "typography",
  "writing-mode": "typography",
  "input-mode": "typography",
  "property-registrar": "typography",
  // Selectors & Cascade (7)
  "selector-tester": "selectors",
  "has-selector-tester": "selectors",
  "css-layers": "selectors",
  "style-query": "selectors",
  "scope": "selectors",
  "fallback": "selectors",
  "starting-style": "selectors",
  // Reference & Utilities (5)
  "utility-explorer": "utilities",
  "unit-converter": "utilities",
  "css-minifier": "utilities",
  "print": "utilities",
  "property-inspector": "utilities",
};

export const TOOL_CATEGORY_META: Record<ToolCategoryId, { label: string; description: string }> = {
  ai: { label: "AI & Automation", description: "AI-assisted generation, migration, and challenges" },
  diagnostics: { label: "Diagnostics & Audit", description: "Scores, analysis, and comparisons for your CSS" },
  layout: { label: "Layout & Grid", description: "Flexbox, grid, container queries, and box model" },
  color: { label: "Color & Theming", description: "OKLCH, palettes, contrast, and design tokens" },
  motion: { label: "Animation & Motion", description: "Keyframes, transitions, scroll-driven and view transitions" },
  generators: { label: "Generators & Studios", description: "Visual builders for gradients, patterns, and effects" },
  typography: { label: "Typography & Writing", description: "Fluid type, text wrapping, and writing modes" },
  selectors: { label: "Selectors & Cascade", description: ":has(), @scope, @layer, and specificity tooling" },
  utilities: { label: "Reference & Utilities", description: "Converters, minifiers, and property lookups" },
};

/** All tool ids, in registry order (matches TOOL_META keys exactly). */
export const TOOL_IDS = Object.keys(TOOL_META) as ToolType[];

export type ToolCategoryFilter = ToolCategoryId | "all";

/**
 * Pure filter used by the gallery (and unit-tested): case-insensitive
 * substring match over title/description/id, combined with an optional
 * category constraint. Deterministic — returns registry order.
 */
export function filterTools(query: string, category: ToolCategoryFilter): ToolType[] {
  const q = query.trim().toLowerCase();
  return TOOL_IDS.filter((id) => {
    if (category !== "all" && TOOL_CATEGORY[id] !== category) return false;
    if (!q) return true;
    const meta = TOOL_META[id];
    return (
      meta.title.toLowerCase().includes(q) ||
      meta.description.toLowerCase().includes(q) ||
      id.includes(q)
    );
  });
}
