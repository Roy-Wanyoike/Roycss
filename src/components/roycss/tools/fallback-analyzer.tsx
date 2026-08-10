"use client";

/**
 * FallbackAnalyzer — Build progressive-enhancement CSS with proper
 * `@supports` feature queries and fallback declarations.
 *
 * Modern CSS ships faster than browsers update, so progressive enhancement
 * is still the safest way to ship new properties: declare a widely-supported
 * fallback first, then add a `@supports` block that overrides with the modern
 * syntax only in browsers that understand it. This tool:
 *
 *   1. Lets you pick from 20 modern CSS features (aspect-ratio, gap, grid,
 *      clamp, min, max, @layer, @container, color-mix, oklch, nesting, :has,
 *      subgrid, view-transition, text-wrap, initial-letter, @scope, @property,
 *      anchor-positioning, inset).
 *   2. Shows three layers for the chosen feature:
 *        - "Old way"  — the legacy fallback declaration(s)
 *        - "@supports check" — the exact feature-query condition
 *        - "Modern way" — the new declaration(s)
 *   3. Generates a copy-pasteable CSS block with the layered fallback already
 *      wired up (fallback outside the @supports, modern inside it, with the
 *      fallback reset where needed).
 *   4. Reports a CanIUse-style browser-support matrix (global %, plus the
 *      specific browser versions that need the fallback).
 *   5. Badges a "complexity score" (1–3) reflecting how many fallback layers
 *      the property typically requires.
 *   6. Ships 6 presets (aspect-ratio-video, gap-flexbox, clamp-typography,
 *      color-oklch, container-query, has-selector).
 *
 * Implementation notes:
 *   - All data is hard-coded (no network). TS strict, no `any`, no
 *     `console.log`. Self-contained (no props, no external state).
 *   - The property picker is a DropdownMenu with a search Input at the top
 *     (shadcn Select doesn't support search out of the box). Select is used
 *     for the category filter.
 *   - Clipboard writes are best-effort (try/catch silent fallback). Copy
 *     timer tracked via `useRef` and cleared on unmount.
 *   - Responsive within `max-w-2xl`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  Copy,
  Check,
  Layers,
  Globe,
  AlertCircle,
  ChevronDown,
  Lightbulb,
  ShieldCheck,
  Search,
  Zap,
  CircleCheck,
  CircleAlert,
  Code2,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type PropertyCategory =
  | "Layout"
  | "Color"
  | "Typography"
  | "Selectors"
  | "At-rules";

type ComplexityLevel = 1 | 2 | 3;

interface BrowserEntry {
  name: string;
  version: string;
  needsFallback: boolean;
}

interface PropertyDef {
  id: string;
  name: string;
  category: PropertyCategory;
  baselineYear: number;
  globalSupport: number; // percentage 0–100
  complexity: ComplexityLevel;
  /** Each entry is a complete CSS rule string (selector + declarations). */
  fallbackRules: string[];
  /** The condition inside `@supports (...)`. */
  supportsCheck: string;
  /** CSS rules to put inside `@supports { ... }`. */
  modernRules: string[];
  /** Why the fallback exists. */
  why: string;
  browsers: BrowserEntry[];
}

interface Preset {
  id: string;
  label: string;
  description: string;
  propertyId: string;
}

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

const CATEGORIES: ReadonlyArray<PropertyCategory | "All"> = [
  "All",
  "Layout",
  "Color",
  "Typography",
  "Selectors",
  "At-rules",
];

const PROPERTIES: ReadonlyArray<PropertyDef> = [
  {
    id: "aspect-ratio",
    name: "aspect-ratio",
    category: "Layout",
    baselineYear: 2021,
    globalSupport: 96,
    complexity: 1,
    fallbackRules: [
      ".box {\n  /* 9/16 = 56.25% — preserves 16:9 ratio via percentage padding */\n  padding-top: 56.25%;\n}",
    ],
    supportsCheck: "(aspect-ratio: 16 / 9)",
    modernRules: [".box {\n  padding-top: 0;\n  aspect-ratio: 16 / 9;\n}"],
    why: "Safari < 15 and older Chrome/Firefox ignored `aspect-ratio`. The classic `padding-top` hack keeps the box at a 16:9 ratio using percentage padding, which is supported everywhere. Inside `@supports` we zero the padding and let `aspect-ratio` drive the height — no layout shift, no double-spacing.",
    browsers: [
      { name: "Chrome", version: "88+", needsFallback: false },
      { name: "Edge", version: "88+", needsFallback: false },
      { name: "Firefox", version: "89+", needsFallback: false },
      { name: "Safari", version: "15+", needsFallback: false },
      { name: "Safari", version: "≤14", needsFallback: true },
      { name: "Samsung", version: "15+", needsFallback: false },
    ],
  },
  {
    id: "gap",
    name: "gap (flexbox)",
    category: "Layout",
    baselineYear: 2021,
    globalSupport: 95,
    complexity: 2,
    fallbackRules: [
      "/* Apply margins to children instead of `gap` on the parent */\n.row > * {\n  margin-inline-start: 1rem;\n}\n.row > *:first-child {\n  margin-inline-start: 0;\n}",
    ],
    supportsCheck: "(gap: 1rem)",
    modernRules: [
      ".row > * {\n  margin-inline-start: 0;\n}\n.row {\n  gap: 1rem;\n}",
    ],
    why: "`gap` for flexbox landed in Safari 14.1. Older browsers need margins on children plus a `:first-child` reset. The `@supports` block wipes the margins and switches to `gap`, which is less error-prone and survives reordering.",
    browsers: [
      { name: "Chrome", version: "84+", needsFallback: false },
      { name: "Edge", version: "84+", needsFallback: false },
      { name: "Firefox", version: "63+", needsFallback: false },
      { name: "Safari", version: "14.1+", needsFallback: false },
      { name: "Safari", version: "≤14.0", needsFallback: true },
      { name: "Samsung", version: "14+", needsFallback: false },
    ],
  },
  {
    id: "grid",
    name: "grid (display)",
    category: "Layout",
    baselineYear: 2017,
    globalSupport: 96,
    complexity: 2,
    fallbackRules: [
      "/* Fallback: flexbox approximation with auto-wrapping */\n.grid {\n  display: flex;\n  flex-wrap: wrap;\n}\n.grid > * {\n  flex: 1 1 200px;\n}",
    ],
    supportsCheck: "(display: grid)",
    modernRules: [
      ".grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n}",
    ],
    why: "CSS Grid shipped in IE 10 with an old `-ms-grid` syntax; modern Grid landed in Edge 16 / Safari 10.1 / Firefox 52 / Chrome 57. For browsers that don't understand modern `grid-template-columns`, a flexbox approximation with `flex-basis` is a serviceable fallback. Inside `@supports (display: grid)` we replace flex with a real auto-fit grid.",
    browsers: [
      { name: "Chrome", version: "57+", needsFallback: false },
      { name: "Edge", version: "16+", needsFallback: false },
      { name: "Firefox", version: "52+", needsFallback: false },
      { name: "Safari", version: "10.1+", needsFallback: false },
      { name: "IE", version: "11", needsFallback: true },
      { name: "Samsung", version: "6.2+", needsFallback: false },
    ],
  },
  {
    id: "clamp",
    name: "clamp()",
    category: "Typography",
    baselineYear: 2020,
    globalSupport: 95,
    complexity: 1,
    fallbackRules: [
      "/* Fallback: media-query steps */\n.title { font-size: 1rem; }\n@media (min-width: 768px) {\n  .title { font-size: 1.5rem; }\n}\n@media (min-width: 1200px) {\n  .title { font-size: 2rem; }\n}",
    ],
    supportsCheck: "(font-size: clamp(1rem, 2vw, 2rem))",
    modernRules: [".title {\n  font-size: clamp(1rem, 2vw, 2rem);\n}"],
    why: "`clamp()` fluidly scales between a min and max without media queries. Older Safari (< 13.1) and Chrome (< 79) ignore it entirely, leaving font-size at the default. A `@supports` check lets us swap a 2–3 step media-query fallback for one smooth `clamp()` expression.",
    browsers: [
      { name: "Chrome", version: "79+", needsFallback: false },
      { name: "Edge", version: "79+", needsFallback: false },
      { name: "Firefox", version: "75+", needsFallback: false },
      { name: "Safari", version: "13.1+", needsFallback: false },
      { name: "Safari", version: "≤13", needsFallback: true },
      { name: "Samsung", version: "12+", needsFallback: false },
    ],
  },
  {
    id: "min",
    name: "min()",
    category: "Layout",
    baselineYear: 2020,
    globalSupport: 95,
    complexity: 1,
    fallbackRules: [
      "/* Fallback: width 100% with explicit max-width */\n.wrap {\n  width: 100%;\n  max-width: 600px;\n}",
    ],
    supportsCheck: "(width: min(100%, 600px))",
    modernRules: [".wrap {\n  width: min(100%, 600px);\n}"],
    why: "`min()` picks the smallest of comma-separated values, perfect for responsive caps. Browsers that don't understand it (Safari < 11.1, Chrome < 79) drop the declaration, so we declare the equivalent `width` + `max-width` pair first, then override inside `@supports`.",
    browsers: [
      { name: "Chrome", version: "79+", needsFallback: false },
      { name: "Edge", version: "79+", needsFallback: false },
      { name: "Firefox", version: "75+", needsFallback: false },
      { name: "Safari", version: "11.1+", needsFallback: false },
      { name: "Safari", version: "≤11", needsFallback: true },
      { name: "Samsung", version: "12+", needsFallback: false },
    ],
  },
  {
    id: "max",
    name: "max()",
    category: "Layout",
    baselineYear: 2020,
    globalSupport: 95,
    complexity: 1,
    fallbackRules: [
      "/* Fallback: explicit width with min-width */\n.aside {\n  width: 240px;\n  min-width: 50vw;\n}",
    ],
    supportsCheck: "(width: max(240px, 50vw))",
    modernRules: [".aside {\n  width: max(240px, 50vw);\n}"],
    why: "`max()` picks the largest value — great for ensuring a sidebar never shrinks below a viewport-relative floor. Older browsers ignore the function, so we declare an equivalent `width` + `min-width` pair first, then swap to `max()` inside `@supports`.",
    browsers: [
      { name: "Chrome", version: "79+", needsFallback: false },
      { name: "Edge", version: "79+", needsFallback: false },
      { name: "Firefox", version: "75+", needsFallback: false },
      { name: "Safari", version: "11.1+", needsFallback: false },
      { name: "Safari", version: "≤11", needsFallback: true },
      { name: "Samsung", version: "12+", needsFallback: false },
    ],
  },
  {
    id: "layer",
    name: "@layer",
    category: "At-rules",
    baselineYear: 2022,
    globalSupport: 95,
    complexity: 3,
    fallbackRules: [
      "/* Pre-layer cascade: source order + specificity wins */\n.btn {\n  color: white;\n  background: black;\n}\n.btn.primary {\n  color: white;\n  background: blue;\n}",
    ],
    supportsCheck: "at-rule (@layer)",
    modernRules: [
      "@layer base, components;\n\n@layer components {\n  .btn {\n    color: white;\n    background: black;\n  }\n  .btn.primary {\n    background: blue;\n  }\n}",
    ],
    why: "`@layer` lets you order whole stylesheets so a utility layer can safely override a framework layer without specificity wars. Browsers that don't understand `@layer` parse the inner rules normally — but at uncontrolled cascade priority, so the `@supports at-rule (@layer)` gate keeps the layered version isolated. Complexity 3 because teams usually have to refactor their cascade to use layers safely.",
    browsers: [
      { name: "Chrome", version: "99+", needsFallback: false },
      { name: "Edge", version: "99+", needsFallback: false },
      { name: "Firefox", version: "97+", needsFallback: false },
      { name: "Safari", version: "15.4+", needsFallback: false },
      { name: "Safari", version: "≤15.3", needsFallback: true },
      { name: "Samsung", version: "18+", needsFallback: false },
    ],
  },
  {
    id: "container",
    name: "@container",
    category: "At-rules",
    baselineYear: 2023,
    globalSupport: 90,
    complexity: 2,
    fallbackRules: [
      "/* Fallback: viewport media query approximation */\n@media (min-width: 768px) {\n  .card { padding: 2rem; }\n}",
    ],
    supportsCheck: "(container-type: inline-size)",
    modernRules: [
      ".card-host {\n  container-type: inline-size;\n}\n@container (min-width: 400px) {\n  .card { padding: 2rem; }\n}",
    ],
    why: "Container queries style a component based on its *parent* size rather than the viewport. The `@media` fallback approximates the layout on viewport width only; inside `@supports (container-type: inline-size)` we enable true container responsiveness, which works in nested layouts that viewport queries can't model.",
    browsers: [
      { name: "Chrome", version: "105+", needsFallback: false },
      { name: "Edge", version: "105+", needsFallback: false },
      { name: "Firefox", version: "110+", needsFallback: false },
      { name: "Safari", version: "16+", needsFallback: false },
      { name: "Safari", version: "≤15", needsFallback: true },
      { name: "Samsung", version: "20+", needsFallback: false },
    ],
  },
  {
    id: "color-mix",
    name: "color-mix()",
    category: "Color",
    baselineYear: 2023,
    globalSupport: 92,
    complexity: 1,
    fallbackRules: [
      "/* Fallback: precomputed rgba() blend */\n.tint {\n  background-color: rgba(255, 0, 0, 0.5);\n}",
    ],
    supportsCheck: "(color: color-mix(in srgb, red, blue))",
    modernRules: [
      ".tint {\n  background-color: color-mix(in srgb, var(--brand) 50%, transparent);\n}",
    ],
    why: "`color-mix()` blends two colors at a percentage, in a named color space. Browsers without support (Safari < 16.2, Firefox < 113) ignore the declaration, so we declare a precomputed rgba approximation first. The modern expression additionally lets the blend react to a CSS variable, which the static rgba cannot.",
    browsers: [
      { name: "Chrome", version: "111+", needsFallback: false },
      { name: "Edge", version: "111+", needsFallback: false },
      { name: "Firefox", version: "113+", needsFallback: false },
      { name: "Safari", version: "16.2+", needsFallback: false },
      { name: "Safari", version: "≤16.1", needsFallback: true },
      { name: "Samsung", version: "22+", needsFallback: false },
    ],
  },
  {
    id: "oklch",
    name: "oklch()",
    category: "Color",
    baselineYear: 2023,
    globalSupport: 90,
    complexity: 2,
    fallbackRules: [
      "/* Fallback: sRGB hex approximation (perceptual loss) */\n.accent {\n  color: #d4a574;\n}",
    ],
    supportsCheck: "(color: oklch(0 0 0))",
    modernRules: [".accent {\n  color: oklch(0.7 0.1 80);\n}"],
    why: "`oklch()` is a perceptually-uniform color space — equal steps in lightness look equal to the human eye. sRGB hex fallbacks are perceptually lossy, so the `@supports` gate lets you ship a precise `oklch` value to modern browsers and a close-enough sRGB approximation to older ones.",
    browsers: [
      { name: "Chrome", version: "111+", needsFallback: false },
      { name: "Edge", version: "111+", needsFallback: false },
      { name: "Firefox", version: "113+", needsFallback: false },
      { name: "Safari", version: "15.4+", needsFallback: false },
      { name: "Safari", version: "≤15.3", needsFallback: true },
      { name: "Samsung", version: "22+", needsFallback: false },
    ],
  },
  {
    id: "nesting",
    name: "nesting",
    category: "Selectors",
    baselineYear: 2023,
    globalSupport: 89,
    complexity: 2,
    fallbackRules: [
      "/* Fallback: explicit parent-child selectors */\n.card { padding: 1rem; }\n.card .title { font-weight: 700; }\n.card .title:hover { color: blue; }",
    ],
    supportsCheck: "selector(&)",
    modernRules: [
      ".card {\n  padding: 1rem;\n  & .title {\n    font-weight: 700;\n    &:hover { color: blue; }\n  }\n}",
    ],
    why: "Native CSS nesting (the `&` selector) lets you scope rules to a parent without repeating the selector. Browsers without support silently drop the whole rule, so the `@supports selector(&)` gate keeps the flattened descendant selectors for old browsers and ships the nested form to modern ones.",
    browsers: [
      { name: "Chrome", version: "112+", needsFallback: false },
      { name: "Edge", version: "112+", needsFallback: false },
      { name: "Firefox", version: "117+", needsFallback: false },
      { name: "Safari", version: "16.5+", needsFallback: false },
      { name: "Safari", version: "≤16.4", needsFallback: true },
      { name: "Samsung", version: "23+", needsFallback: false },
    ],
  },
  {
    id: "has",
    name: ":has()",
    category: "Selectors",
    baselineYear: 2023,
    globalSupport: 89,
    complexity: 1,
    fallbackRules: [
      "/* Fallback: JS-toggled .has-img class on the parent */\n.card.has-img {\n  padding: 1rem;\n}",
    ],
    supportsCheck: "selector(:has(*))",
    modernRules: [".card:has(img) {\n  padding: 1rem;\n}"],
    why: "`:has()` styles an element based on its descendants — the long-missing \"parent selector\". Browsers without support ignore the rule, so the `@supports selector(:has(*))` gate keeps a JS-toggled fallback class for old browsers and ships a pure-CSS solution to modern ones (no JS dependency, no layout shift).",
    browsers: [
      { name: "Chrome", version: "105+", needsFallback: false },
      { name: "Edge", version: "105+", needsFallback: false },
      { name: "Firefox", version: "121+", needsFallback: false },
      { name: "Safari", version: "15.4+", needsFallback: false },
      { name: "Firefox", version: "≤120", needsFallback: true },
      { name: "Samsung", version: "20+", needsFallback: false },
    ],
  },
  {
    id: "subgrid",
    name: "subgrid",
    category: "Layout",
    baselineYear: 2023,
    globalSupport: 80,
    complexity: 2,
    fallbackRules: [
      "/* Fallback: replicate via spanned track + manual sizing */\n.cell {\n  grid-column: span 3;\n}",
    ],
    supportsCheck: "(grid-template-columns: subgrid)",
    modernRules: [
      ".cell {\n  grid-column: span 3;\n  grid-template-columns: subgrid;\n}",
    ],
    why: "`subgrid` lets a child inherit the parent's grid tracks, so columns line up across nested components. Without support, the child gets its own tracks; the `@supports` gate lets you span the right number of tracks for old browsers and then enable `subgrid` for alignment in modern ones.",
    browsers: [
      { name: "Chrome", version: "117+", needsFallback: false },
      { name: "Edge", version: "117+", needsFallback: false },
      { name: "Firefox", version: "71+", needsFallback: false },
      { name: "Safari", version: "16+", needsFallback: false },
      { name: "Chrome", version: "≤116", needsFallback: true },
      { name: "Safari", version: "≤15", needsFallback: true },
    ],
  },
  {
    id: "view-transition",
    name: "view-transition",
    category: "At-rules",
    baselineYear: 2024,
    globalSupport: 75,
    complexity: 3,
    fallbackRules: [
      "/* Fallback: clone DOM nodes and cross-fade via JS + opacity */",
    ],
    supportsCheck: "(view-transition-name: --x)",
    modernRules: [
      ".hero { view-transition-name: hero; }\n\n@view-transition {\n  navigation: auto;\n}\n\n::view-transition-old(hero) {\n  animation: fade-out 200ms;\n}\n::view-transition-new(hero) {\n  animation: fade-in 200ms;\n}",
    ],
    why: "The View Transitions API animates DOM state changes with one snapshot. Browsers without support need a JS-driven clone-and-fade routine; the `@supports (view-transition-name: --x)` gate keeps the JS path for old browsers and ships the native transition to Chrome/Edge. Complexity 3 because the JS fallback is bespoke per transition.",
    browsers: [
      { name: "Chrome", version: "111+", needsFallback: false },
      { name: "Edge", version: "111+", needsFallback: false },
      { name: "Firefox", version: "≤128", needsFallback: true },
      { name: "Safari", version: "18+", needsFallback: false },
      { name: "Safari", version: "≤17", needsFallback: true },
      { name: "Samsung", version: "22+", needsFallback: false },
    ],
  },
  {
    id: "text-wrap",
    name: "text-wrap: balance",
    category: "Typography",
    baselineYear: 2023,
    globalSupport: 85,
    complexity: 1,
    fallbackRules: [
      "/* Fallback: hyphens + word-break to reduce orphans */\n.heading {\n  hyphens: auto;\n  word-break: break-word;\n}",
    ],
    supportsCheck: "(text-wrap: balance)",
    modernRules: [".heading {\n  text-wrap: balance;\n}"],
    why: "`text-wrap: balance` redistributes text so the last line isn't a single orphan word. Older browsers ignore it, so we ship `hyphens` + `word-break` as a serviceable fallback and swap to native balancing inside `@supports` for crisper headlines without JS measurement.",
    browsers: [
      { name: "Chrome", version: "114+", needsFallback: false },
      { name: "Edge", version: "114+", needsFallback: false },
      { name: "Firefox", version: "121+", needsFallback: false },
      { name: "Safari", version: "17.5+", needsFallback: false },
      { name: "Safari", version: "≤17.4", needsFallback: true },
      { name: "Firefox", version: "≤120", needsFallback: true },
    ],
  },
  {
    id: "initial-letter",
    name: "initial-letter",
    category: "Typography",
    baselineYear: 2024,
    globalSupport: 65,
    complexity: 2,
    fallbackRules: [
      "/* Fallback: float + manual font-size / line-height */\n.dropcap {\n  float: left;\n  font-size: 3em;\n  line-height: 0.8;\n  margin-inline-end: 0.1em;\n}",
    ],
    supportsCheck: "(initial-letter: 3)",
    modernRules: [".dropcap {\n  initial-letter: 3;\n}"],
    why: "`initial-letter` sizes a drop cap to span N lines automatically. Browsers without support (only Safari shipped it widely for years) need a fragile `float` + manual `font-size`/`line-height` combination. The `@supports` gate keeps the float version for compatibility and ships native drop-cap sizing to Safari.",
    browsers: [
      { name: "Chrome", version: "110+", needsFallback: false },
      { name: "Edge", version: "110+", needsFallback: false },
      { name: "Firefox", version: "≤130", needsFallback: true },
      { name: "Safari", version: "9+", needsFallback: false },
      { name: "Firefox", version: "131+", needsFallback: false },
      { name: "Samsung", version: "21+", needsFallback: false },
    ],
  },
  {
    id: "scope",
    name: "@scope",
    category: "At-rules",
    baselineYear: 2024,
    globalSupport: 75,
    complexity: 3,
    fallbackRules: [
      "/* Fallback: descendant selectors with lower-bound wrapper */\n.article p { color: inherit; }\n.article figure p { color: initial; }",
    ],
    supportsCheck: "at-rule (@scope)",
    modernRules: [
      "@scope (.article) to (> figure) {\n  p { color: inherit; }\n}",
    ],
    why: "`@scope` limits a selector's reach with both upper and lower bounds — a descendant selector with a built-in `:not()` boundary. Browsers without support ignore the rule, so we ship the flattened descendant selector with a manual override for the boundary subtree and swap to `@scope` inside `@supports`. Complexity 3 because the fallback often requires several overrides.",
    browsers: [
      { name: "Chrome", version: "118+", needsFallback: false },
      { name: "Edge", version: "118+", needsFallback: false },
      { name: "Firefox", version: "≤128", needsFallback: true },
      { name: "Safari", version: "17.4+", needsFallback: false },
      { name: "Safari", version: "≤17.3", needsFallback: true },
      { name: "Firefox", version: "129+", needsFallback: false },
    ],
  },
  {
    id: "property",
    name: "@property",
    category: "At-rules",
    baselineYear: 2022,
    globalSupport: 88,
    complexity: 2,
    fallbackRules: [
      "/* Fallback: plain custom property (no type, no transition) */\n:root {\n  --angle: 0deg;\n}",
    ],
    supportsCheck: "at-rule (@property)",
    modernRules: [
      "@property --angle {\n  syntax: '<angle>';\n  initial-value: 0deg;\n  inherits: false;\n}\n:root {\n  --angle: 90deg;\n}",
    ],
    why: "`@property` registers a typed custom property so it can be animated and inherit predictably. Browsers without support treat the variable as an untyped string, which means transitions on it are skipped. The `@supports at-rule (@property)` gate keeps the plain custom property for old browsers and ships the typed registration to modern ones.",
    browsers: [
      { name: "Chrome", version: "85+", needsFallback: false },
      { name: "Edge", version: "85+", needsFallback: false },
      { name: "Firefox", version: "128+", needsFallback: false },
      { name: "Safari", version: "16.4+", needsFallback: false },
      { name: "Firefox", version: "≤127", needsFallback: true },
      { name: "Safari", version: "≤16.3", needsFallback: true },
    ],
  },
  {
    id: "anchor-positioning",
    name: "anchor-positioning",
    category: "Layout",
    baselineYear: 2024,
    globalSupport: 55,
    complexity: 3,
    fallbackRules: [
      "/* Fallback: absolute positioning with JS-computed coords */\n.pop {\n  position: absolute;\n  top: var(--anchor-bottom, 0);\n  left: var(--anchor-left, 0);\n}",
    ],
    supportsCheck: "(anchor-name: --btn)",
    modernRules: [
      ".btn { anchor-name: --btn; }\n.pop {\n  position: absolute;\n  position-anchor: --btn;\n  top: anchor(bottom);\n  left: anchor(left);\n}",
    ],
    why: "CSS Anchor Positioning lets a popover track a relative anchor element natively, no JS resize observers needed. Without support, you need JS to compute and write the popover's coordinates on every scroll/resize. The `@supports (anchor-name: --btn)` gate keeps the JS-coord fallback and ships the native anchor in Chrome 125+. Complexity 3 because the JS fallback is non-trivial.",
    browsers: [
      { name: "Chrome", version: "125+", needsFallback: false },
      { name: "Edge", version: "125+", needsFallback: false },
      { name: "Firefox", version: "≤131", needsFallback: true },
      { name: "Safari", version: "≤18", needsFallback: true },
      { name: "Chrome", version: "≤124", needsFallback: true },
      { name: "Samsung", version: "25+", needsFallback: false },
    ],
  },
  {
    id: "inset",
    name: "inset",
    category: "Layout",
    baselineYear: 2021,
    globalSupport: 96,
    complexity: 1,
    fallbackRules: [
      "/* Fallback: top + right + bottom + left */\n.overlay {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n}",
    ],
    supportsCheck: "(inset: 0)",
    modernRules: [".overlay {\n  position: absolute;\n  inset: 0;\n}"],
    why: "`inset` is the shorthand for `top`/`right`/`bottom`/`left`. Older browsers (Safari < 14.1, Chrome < 87) drop the declaration, so we ship the four longhands first and override with `inset` inside `@supports` for terser, less error-prone code.",
    browsers: [
      { name: "Chrome", version: "87+", needsFallback: false },
      { name: "Edge", version: "87+", needsFallback: false },
      { name: "Firefox", version: "66+", needsFallback: false },
      { name: "Safari", version: "14.1+", needsFallback: false },
      { name: "Safari", version: "≤14", needsFallback: true },
      { name: "Samsung", version: "14+", needsFallback: false },
    ],
  },
];

const PRESETS: ReadonlyArray<Preset> = [
  {
    id: "aspect-ratio-video",
    label: "aspect-ratio-video",
    description: "16:9 responsive video frame",
    propertyId: "aspect-ratio",
  },
  {
    id: "gap-flexbox",
    label: "gap-flexbox",
    description: "Flex gap with margin fallback",
    propertyId: "gap",
  },
  {
    id: "clamp-typography",
    label: "clamp-typography",
    description: "Fluid headline scaling",
    propertyId: "clamp",
  },
  {
    id: "color-oklch",
    label: "color-oklch",
    description: "Perceptual brand color",
    propertyId: "oklch",
  },
  {
    id: "container-query",
    label: "container-query",
    description: "Card padding by container size",
    propertyId: "container",
  },
  {
    id: "has-selector",
    label: "has-selector",
    description: "Card with image styling",
    propertyId: "has",
  },
];

// ============================================================
// Pure helpers
// ============================================================

function indentBlock(ruleText: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return ruleText
    .split("\n")
    .map((line) => (line.length === 0 ? line : pad + line))
    .join("\n");
}

function buildGeneratedCSS(def: PropertyDef): string {
  const fallbackBlock = def.fallbackRules.join("\n\n");
  const modernBlock = def.modernRules
    .map((rule) => indentBlock(rule, 2))
    .join("\n\n");
  return [
    "/* =============================================",
    ` * ${def.name} — progressive enhancement`,
    ` * Baseline ${def.baselineYear} · ${def.globalSupport}% global support`,
    " * ============================================= */",
    "",
    "/* --- Fallback (old browsers) --- */",
    fallbackBlock,
    "",
    "/* --- Modern (@supports gated) --- */",
    `@supports ${def.supportsCheck} {`,
    modernBlock,
    "}",
  ].join("\n");
}

function complexityTone(level: ComplexityLevel): {
  label: string;
  tone: "low" | "med" | "high";
  hint: string;
} {
  switch (level) {
    case 1:
      return {
        label: "Low",
        tone: "low",
        hint: "Single fallback layer — drop-in replacement.",
      };
    case 2:
      return {
        label: "Medium",
        tone: "med",
        hint: "Two fallback layers — needs reset of the legacy value.",
      };
    case 3:
      return {
        label: "High",
        tone: "high",
        hint: "Three+ layers or JS coordination required.",
      };
  }
}

function supportTone(pct: number): "widely" | "newly" | "limited" {
  if (pct >= 95) return "widely";
  if (pct >= 85) return "newly";
  return "limited";
}

// ============================================================
// Sub-components
// ============================================================

interface ComplexityBadgeProps {
  level: ComplexityLevel;
}

function ComplexityBadge({ level }: ComplexityBadgeProps) {
  const meta = complexityTone(level);
  const Icon = level === 1 ? CircleCheck : level === 2 ? CircleDot : CircleAlert;
  const toneClasses: Record<"low" | "med" | "high", string> = {
    low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    med: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    high: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-mono text-xs", toneClasses[meta.tone])}
      title={meta.hint}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      Complexity {level} · {meta.label}
    </Badge>
  );
}

interface SupportBadgeProps {
  percentage: number;
}

function SupportBadge({ percentage }: SupportBadgeProps) {
  const tone = supportTone(percentage);
  const toneClasses: Record<"widely" | "newly" | "limited", string> = {
    widely:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    newly: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    limited: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-mono text-xs", toneClasses[tone])}
    >
      <Globe className="size-3.5" aria-hidden="true" />
      {percentage}% global
    </Badge>
  );
}

interface CodeBlockProps {
  code: string;
  /** Optional aria-label for screen readers. */
  label?: string;
}

function CodeBlock({ code, label }: CodeBlockProps) {
  return (
    <pre
      aria-label={label}
      className="max-h-96 overflow-auto rounded-md border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground"
    >
      <code>{code}</code>
    </pre>
  );
}

interface LayerCardProps {
  step: number;
  title: string;
  subtitle: string;
  code: string;
  icon: ReactNode;
  accentClass: string;
}

function LayerCard({
  step,
  title,
  subtitle,
  code,
  icon,
  accentClass,
}: LayerCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-md text-xs font-semibold",
            accentClass,
          )}
          aria-hidden="true"
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {icon}
            <span className="text-sm font-semibold text-foreground">
              {title}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <pre className="overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface BrowserMatrixProps {
  browsers: BrowserEntry[];
}

function BrowserMatrix({ browsers }: BrowserMatrixProps) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {browsers.map((b, i) => (
        <div
          key={`${b.name}-${b.version}-${i}`}
          className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-1.5"
        >
          <span className="font-mono text-xs text-foreground">
            {b.name}{" "}
            <span className="text-muted-foreground">{b.version}</span>
          </span>
          {b.needsFallback ? (
            <Badge
              variant="outline"
              className="gap-1 border-rose-500/30 bg-rose-500/10 px-1.5 py-0 text-[10px] font-medium text-rose-700 dark:text-rose-300"
            >
              <AlertCircle className="size-3" aria-hidden="true" />
              fallback
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
            >
              <CircleCheck className="size-3" aria-hidden="true" />
              native
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function FallbackAnalyzer() {
  const [propertyId, setPropertyId] = useState<string>("aspect-ratio");
  const [categoryFilter, setCategoryFilter] =
    useState<PropertyCategory | "All">("All");
  const [search, setSearch] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const current = useMemo<PropertyDef>(
    () =>
      PROPERTIES.find((p) => p.id === propertyId) ?? PROPERTIES[0],
    [propertyId],
  );

  const filteredProperties = useMemo<ReadonlyArray<PropertyDef>>(() => {
    const term = search.trim().toLowerCase();
    return PROPERTIES.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) {
        return false;
      }
      if (term.length === 0) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
      );
    });
  }, [search, categoryFilter]);

  const generatedCSS = useMemo(() => buildGeneratedCSS(current), [current]);

  const activePreset = useMemo<string | null>(() => {
    return PRESETS.find((p) => p.propertyId === current.id)?.id ?? null;
  }, [current]);

  const handleCopy = useCallback(() => {
    try {
      void navigator.clipboard.writeText(generatedCSS).then(() => {
        setCopied(true);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
      });
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [generatedCSS]);

  const applyPreset = useCallback((preset: Preset) => {
    setPropertyId(preset.propertyId);
  }, []);

  const selectProperty = useCallback((id: string) => {
    setPropertyId(id);
    setPickerOpen(false);
    setSearch("");
  }, []);

  return (
    <Card className="mx-auto w-full max-w-2xl gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="size-5 text-primary" aria-hidden="true" />
              Fallback Analyzer
            </CardTitle>
            <CardDescription className="mt-1">
              Progressive-enhancement CSS with proper{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                @supports
              </code>{" "}
              feature queries.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ComplexityBadge level={current.complexity} />
            <SupportBadge percentage={current.globalSupport} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Presets */}
        <section aria-labelledby="presets-label" className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sparkles
              className="size-4 text-primary"
              aria-hidden="true"
            />
            <Label id="presets-label" className="text-sm font-medium">
              Presets
            </Label>
            {activePreset ? (
              <Badge
                variant="secondary"
                className="ml-auto gap-1 font-mono text-[10px]"
              >
                <Zap className="size-3" aria-hidden="true" />
                {activePreset}
              </Badge>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESETS.map((preset) => {
              const active = preset.propertyId === current.id;
              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className="h-auto flex-col items-start gap-0.5 py-2 text-left"
                  onClick={() => applyPreset(preset)}
                  aria-pressed={active}
                >
                  <span className="font-mono text-[11px] font-semibold">
                    {preset.label}
                  </span>
                  <span className="text-[10px] font-normal opacity-80">
                    {preset.description}
                  </span>
                </Button>
              );
            })}
          </div>
        </section>

        {/* Property picker */}
        <section
          aria-labelledby="picker-label"
          className="flex flex-col gap-2"
        >
          <Label id="picker-label" className="text-sm font-medium">
            Property
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <DropdownMenu open={pickerOpen} onOpenChange={setPickerOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between sm:w-72"
                  aria-label="Pick a modern CSS property"
                >
                  <span className="flex items-center gap-2">
                    <Code2 className="size-4 text-muted-foreground" aria-hidden="true" />
                    <span className="font-mono text-sm">{current.name}</span>
                    <Badge
                      variant="secondary"
                      className="ml-1 text-[10px] font-normal"
                    >
                      {current.category}
                    </Badge>
                  </span>
                  <ChevronDown className="size-4 opacity-50" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[18rem] sm:w-80"
              >
                <div className="p-2">
                  <div className="relative">
                    <Search
                      className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search 20 properties…"
                      className="h-8 pl-7 text-xs"
                      aria-label="Search properties"
                    />
                  </div>
                </div>
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {filteredProperties.length} match
                  {filteredProperties.length === 1 ? "" : "es"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-72 overflow-y-auto p-1">
                  {filteredProperties.length === 0 ? (
                    <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                      No properties match &ldquo;{search}&rdquo;.
                    </div>
                  ) : (
                    filteredProperties.map((p) => (
                      <DropdownMenuItem
                        key={p.id}
                        onSelect={() => selectProperty(p.id)}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs">{p.name}</span>
                          <Badge
                            variant="outline"
                            className="px-1 py-0 text-[9px] font-normal text-muted-foreground"
                          >
                            {p.category}
                          </Badge>
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {p.globalSupport}%
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              <Label
                htmlFor="category-filter"
                className="text-xs text-muted-foreground"
              >
                Filter:
              </Label>
              <Select
                value={categoryFilter}
                onValueChange={(v) =>
                  setCategoryFilter(v as PropertyCategory | "All")
                }
              >
                <SelectTrigger
                  id="category-filter"
                  size="sm"
                  className="w-[8.5rem]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Three-layer explanation */}
        <section
          aria-labelledby="layers-label"
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" aria-hidden="true" />
            <h3
              id="layers-label"
              className="text-sm font-semibold text-foreground"
            >
              Fallback chain for{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {current.name}
              </code>
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <LayerCard
              step={1}
              title="Old way"
              subtitle="Legacy fallback — every browser understands this."
              code={current.fallbackRules.join("\n\n")}
              icon={
                <ShieldCheck
                  className="size-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              }
              accentClass="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            />
            <LayerCard
              step={2}
              title="@supports check"
              subtitle={`Wrap the modern rule in @supports ${current.supportsCheck}.`}
              code={`@supports ${current.supportsCheck} {\n  /* modern rules go here */\n}`}
              icon={
                <CircleDot
                  className="size-3.5 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
              }
              accentClass="bg-amber-500/15 text-amber-700 dark:text-amber-300"
            />
            <LayerCard
              step={3}
              title="Modern way"
              subtitle="Overrides the fallback where supported."
              code={current.modernRules.join("\n\n")}
              icon={
                <Sparkles
                  className="size-3.5 text-primary"
                  aria-hidden="true"
                />
              }
              accentClass="bg-primary/15 text-primary"
            />
          </div>
        </section>

        {/* Generated CSS */}
        <section
          aria-labelledby="css-label"
          className="flex flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <Label
              id="css-label"
              htmlFor="generated-css"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Code2 className="size-4 text-muted-foreground" aria-hidden="true" />
              Generated CSS
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
              aria-label="Copy generated CSS to clipboard"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Copied
                </>
                ) : (
                <>
                  <Copy className="size-3.5" aria-hidden="true" />
                  Copy
                </>
                )}
            </Button>
          </div>
          <Textarea
            id="generated-css"
            value={generatedCSS}
            readOnly
            className="max-h-96 min-h-[14rem] resize-y font-mono text-xs leading-relaxed"
            spellCheck={false}
            aria-describedby="css-help"
          />
          <p id="css-help" className="sr-only">
            Read-only generated CSS showing the layered fallback declaration
            followed by the @supports-gated modern rule.
          </p>
        </section>

        {/* Browser support matrix */}
        <section
          aria-labelledby="support-label"
          className="flex flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <Label
              id="support-label"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
              Browser support matrix
            </Label>
            <span className="text-[11px] text-muted-foreground">
              Baseline {current.baselineYear}
            </span>
          </div>
          <BrowserMatrix browsers={current.browsers} />
        </section>

        {/* Why explanation */}
        <section
          aria-labelledby="why-label"
          className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-center gap-2">
            <Lightbulb
              className="size-4 text-primary"
              aria-hidden="true"
            />
            <h3
              id="why-label"
              className="text-sm font-semibold text-foreground"
            >
              Why this fallback exists
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {current.why}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
