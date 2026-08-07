"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  PenTool,
  Blocks,
  BrainCircuit,
  Terminal,
  Search,
  Palette,
  Shapes,
  GraduationCap,
  Building2,
  Wrench,
  Film,
  Accessibility,
  Cloud,
  BarChart3,
  Stethoscope,
  Dna,
  GitCompare,
  MousePointer2,
  ArrowLeftRight,
  Library,
  Gauge,
  Trophy,
  Microscope,
  Sparkles,
  ArrowRight,
  Check,
  Crown,
  Heart,
  Layers,
  Rocket,
  Users,
  Shield,
  Award,
  Play,
  Calculator,
  Spline,
  Radar,
  Zap,
  Globe,
  Printer,
  Crosshair,
  MoonStar,
  Network,
  Type,
  ArrowDownUp,
  LayoutGrid,
  SquareStack,
  Grid2x2,
  Ruler,
  Box,
  Rows3,
  Timer,
  Images,
  Filter,
  Disc,
  Move,
  ScrollText,
  Languages,
  Image,
  Brush,
  Blend,
  TableProperties,
  Proportions,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  SectionHeading,
  ScrollReveal,
  StaggerGroup,
  AnimatedCounter,
  Floating,
  ShineBorder,
  staggerContainer,
  staggerItem,
  Marquee,
} from "@/components/roycss/motion-primitives";
import {
  COMPANIES as SPONSORED_COMPANIES,
  getTierForCompany,
  TIER_META as SPONSOR_TIER_META,
  SponsorModal,
} from "@/components/roycss/featured-companies";

/* ═══════════════════════════════════════════════════════════════
   DATA: 16 platform products
   ═══════════════════════════════════════════════════════════════ */

type Tier = "free" | "pro" | "enterprise" | "cloud";
type Priority = 5 | 4 | 3; // star rating from the vision

interface PlatformProduct {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tier: Tier;
  priority: Priority;
  revenue: string;
  features: string[];
  /** Optional lifecycle label (e.g. "Complete", "Planned"). Vestigial in UI. */
  status?: string;
  /** Optional setup instructions string shown in the docs deep-link. */
  setup?: string;
  /** Optional slug linking this product to a docs entry. */
  docsSlug?: string;
}

const PRODUCTS: PlatformProduct[] = [
  {
    id: "marketplace",
    name: "RoyCSS Marketplace",
    tagline: "One-click templates & components",
    description:
      "Developers install Healthcare Dashboards, Admin Panels, CRMs, POS systems, Banking themes, and more — a curated marketplace of production-ready blocks and templates.",
    icon: Store,
    tier: "pro",
    priority: 5,
    revenue: "15% transaction fee",
    features: ["Healthcare Dashboard", "Admin Panel", "CRM", "POS", "Banking Theme", "Portfolio", "Pricing Tables", "Charts & Calendar"],
  },
  {
    id: "studio",
    name: "Roy Studio",
    tagline: "Visual builder → RoyCSS code",
    description:
      "Visual drag-and-drop builder that outputs clean RoyCSS code. Designers prototype visually; developers continue coding from the generated output.",
    icon: PenTool,
    tier: "pro",
    priority: 5,
    revenue: "Subscription",
    features: ["Drag-and-drop canvas", "Exports clean RoyCSS", "Live code sync", "Component reuse", "Team collaboration"],
  },
  {
    id: "pro-components",
    name: "RoyCSS Pro Components",
    tagline: "Enterprise-grade building blocks",
    description:
      "Enterprise-grade building blocks: Scheduler, Kanban, Data Grid, Charts, Calendar, Timeline, Tree View, Org Chart, Rich Text Editor, Pivot Table.",
    icon: Blocks,
    tier: "pro",
    priority: 5,
    revenue: "$199 / year",
    features: ["Scheduler", "Kanban", "Data Grid", "Charts", "Calendar", "Timeline", "Tree View", "Rich Text Editor", "Pivot Table"],
  },
  {
    id: "roy-ai",
    name: "RoyAI",
    tagline: "The official AI assistant",
    description:
      "Prompt 'Create a Healthcare Dashboard' → RoyCSS code. Prompt 'Improve accessibility' → fixes. Prompt 'Reduce HTML classes' → optimizes. Credits or subscription.",
    icon: BrainCircuit,
    tier: "pro",
    priority: 5,
    revenue: "Credits + Subscription",
    features: ["Generate from prompt", "Accessibility fixes", "Class optimization", "Natural-language search", "Code review"],
  },
  {
    id: "cli-premium",
    name: "RoyCLI Premium",
    tagline: "Intelligent command-line tooling",
    description:
      "roy create dashboard. roy generate auth. roy convert bootstrap. roy convert tailwind. roy optimize. roy audit. roy lint. roy doctor. Advanced commands require Pro.",
    icon: Terminal,
    tier: "pro",
    priority: 4,
    revenue: "Pro upgrade",
    features: ["roy create dashboard", "roy generate auth", "roy convert bootstrap", "roy convert tailwind", "roy optimize", "roy audit", "roy doctor"],
    status: "Complete",
    setup: "Install globally:\n  npm install -g roycss-cli\n  Or use without installing:\n  npx roycss-cli <command>\n\nKey commands:\n  roycss init --framework react  # Initialize in a React project\n  roycss search 'neon glow'       # Search effects\n  roycss add pulse-glow           # Add an effect CSS file\n  roycss export pulse-glow bounce-in --out subset.css  # Tree-shake\n  roycss analyze                  # Full project health report\n  roycss upgrade --migrate        # Auto-migrate legacy CSS",
    docsSlug: "cli-reference",
  },
  {
    id: "inspector",
    name: "RoyCSS Inspector",
    tagline: "Chrome Extension — learn by exploring",
    description:
      "Inspect any website. See spacing, typography, radius, grid, shadow — and the RoyCSS equivalent. Premium: export the entire page as RoyCSS.",
    icon: Microscope,
    tier: "pro",
    priority: 4,
    revenue: "Premium export",
    features: ["Inspect spacing", "Typography analysis", "Radius detection", "Grid mapping", "RoyCSS equivalent", "Page export (premium)"],
    status: "Complete",
    setup: "Load the extension in Chrome:\n1. Open chrome://extensions\n2. Toggle 'Developer mode' (top right)\n3. Click 'Load unpacked'\n4. Select the /inspector directory from the RoyCSS project\n5. Open DevTools → RoyCSS tab appears\n\nThe Inspector scans any page for .roycss-* classes, shows categorized results with effect counts, and lets you click effects to highlight matching elements.",
    docsSlug: "platform-tools",
  },
  {
    id: "themes",
    name: "RoyCSS Themes",
    tagline: "Professional theme store",
    description:
      "Healthcare, Apple, Material, Banking, Corporate, Education, Gaming, SaaS, Dashboard, Fintech — production-ready themes from the community and core team.",
    icon: Palette,
    tier: "pro",
    priority: 4,
    revenue: "Theme store",
    features: ["Healthcare", "Apple", "Material", "Banking", "Corporate", "Education", "Gaming", "SaaS", "Fintech"],
  },
  {
    id: "icons",
    name: "RoyCSS Icons",
    tagline: "Official icon pack",
    description:
      "An icon pack designed specifically for RoyCSS — consistent stroke width, optical sizes, and semantic naming that matches the utility classes.",
    icon: Shapes,
    tier: "pro",
    priority: 3,
    revenue: "Premium icons",
    features: ["Consistent stroke width", "Optical sizing", "Semantic names", "Premium sets"],
  },
  {
    id: "academy",
    name: "Roy Academy",
    tagline: "Courses + industry certification",
    description:
      "RoyCSS Associate, Professional, Expert, and Architect certifications. Companies hire certified developers. Courses, exams, and a verified credential registry.",
    icon: GraduationCap,
    tier: "pro",
    priority: 4,
    revenue: "Courses + Exams",
    features: ["Associate cert", "Professional cert", "Expert cert", "Architect cert", "Verified registry"],
  },
  {
    id: "enterprise",
    name: "RoyCSS Enterprise",
    tagline: "Support, migration, SLA, LTS",
    description:
      "Large companies get support, migration assistance, training, SLAs, private packages, private registry, custom themes, security reviews, and LTS versions.",
    icon: Building2,
    tier: "enterprise",
    priority: 5,
    revenue: "Annual contracts",
    features: ["Priority support", "Migration assistance", "Team training", "SLA guarantees", "Private registry", "Custom themes", "Security reviews", "LTS versions"],
  },
  {
    id: "devtools",
    name: "Roy DevTools",
    tagline: "Browser DevTools integration",
    description:
      "Select any element and instantly see RoyCSS classes, accessibility score, design tokens, suggestions, performance metrics, and contrast checks — inline.",
    icon: Wrench,
    tier: "pro",
    priority: 3,
    revenue: "Pro upgrade",
    features: ["Class inspection", "Accessibility score", "Token display", "Suggestions", "Performance", "Contrast checks"],
  },
  {
    id: "motion-library",
    name: "Roy Motion Library",
    tagline: "Premium animations & transitions",
    description:
      "Premium animations, transitions, interactions, micro-animations, and landing-page motion packs — built on the free RoyMotion foundation.",
    icon: Film,
    tier: "pro",
    priority: 3,
    revenue: "Premium pack",
    features: ["Landing animations", "Micro-interactions", "Page transitions", "Scroll choreography", "Gesture-driven motion"],
  },
  {
    id: "accessibility-suite",
    name: "Roy Accessibility Suite",
    tagline: "Audit & auto-fix entire apps",
    description:
      "Audit your entire application for contrast, ARIA, keyboard, focus, and reduced-motion issues — then auto-fix them. Enterprise loves this.",
    icon: Accessibility,
    tier: "enterprise",
    priority: 4,
    revenue: "Enterprise license",
    features: ["Contrast audit", "ARIA audit", "Keyboard audit", "Focus audit", "Auto-fix", "WCAG reports"],
  },
  {
    id: "cloud",
    name: "Roy Cloud",
    tagline: "Hosted design systems",
    description:
      "Cloud platform to host tokens, themes, components, design systems, and shared libraries — with versioning and real-time collaboration.",
    icon: Cloud,
    tier: "cloud",
    priority: 5,
    revenue: "Subscription",
    features: ["Token hosting", "Theme versioning", "Component registry", "Shared libraries", "Real-time collaboration"],
  },
  {
    id: "analytics",
    name: "Roy Analytics",
    tagline: "Usage, dead CSS, a11y scores",
    description:
      "Analyze which components are used, find unused utilities, detect duplicate styles, measure performance, dead CSS, and accessibility scores across your codebase.",
    icon: BarChart3,
    tier: "enterprise",
    priority: 4,
    revenue: "Enterprise license",
    features: ["Component usage", "Dead CSS detection", "Duplicate detection", "Performance metrics", "Accessibility score"],
  },
  {
    id: "mcp-server",
    name: "RoyCSS MCP Server",
    tagline: "AI assistant integration — no hallucination",
    description:
      "Model Context Protocol server that gives AI assistants (Claude, ChatGPT, Cursor, Windsurf, Codex) access to official RoyCSS effects, documentation, and framework examples. Every AI produces accurate RoyCSS code — no hallucination.",
    icon: BrainCircuit,
    tier: "free",
    priority: 5,
    revenue: "Free / OSS",
    features: ["Search 1569+ effects", "Get CSS code by ID", "Framework examples", "Design tokens", "Recipes", "Claude + Cursor + Windsurf"],
    status: "Complete",
    setup: "Claude Desktop:\n1. Edit ~/Library/Application Support/Claude/claude_desktop_config.json\n2. Add: { \"mcpServers\": { \"roycss\": { \"command\": \"npx\", \"args\": [\"-y\", \"@roycss/mcp-server\"] } } }\n3. Restart Claude\n\nCursor: Settings → MCP → Add Server → npx -y @roycss/mcp-server\nWindsurf: Edit ~/.codeium/windsurf/mcp_config.json with same config\n\n15 tools available: search_effects, get_effect, get_collections, get_recipes, get_patterns, validate_class_name, suggest_for_intent, and more.",
    docsSlug: "mcp-reference",
  },
];

/* ═══════════════════════════════════════════════════════════════
   DATA: 10 unique differentiators (features that set RoyCSS apart)
   ═══════════════════════════════════════════════════════════════ */

interface Differentiator {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DIFFERENTIATORS: Differentiator[] = [
  {
    id: "live-search",
    name: "Live Utility Search",
    description: "Type 'I need a hero section' → the framework finds hero, stack, center, container. No more scrolling docs.",
    icon: Search,
  },
  {
    id: "css-doctor",
    name: "CSS Doctor",
    description: "Run `roy doctor` — finds bad spacing, duplicate utilities, accessibility issues, performance problems, and unused classes.",
    icon: Stethoscope,
  },
  {
    id: "genome",
    name: "Component Genome",
    description: "Every component knows its tokens, utilities, accessibility, animations, and dependencies — useful for AI and tooling.",
    icon: Dna,
  },
  {
    id: "ai-playground",
    name: "CSS Playground with AI",
    description: "Prompt 'Make this card Apple-like' → updates instantly. No more manual CSS editing.",
    icon: Sparkles,
  },
  {
    id: "design-diff",
    name: "Design Diff",
    description: "Upload two screenshots. RoyCSS tells you what changed in spacing, typography, radius, and shadow. Amazing for design systems.",
    icon: GitCompare,
  },
  {
    id: "utility-explorer",
    name: "Utility Explorer",
    description: "Hover any class to see generated CSS, performance, browser support, accessibility, and related utilities.",
    icon: MousePointer2,
  },
  {
    id: "ai-migration",
    name: "AI Migration",
    description: "Paste Bootstrap, Tailwind, or raw CSS → get RoyCSS. Automatic, intelligent, lossless conversion.",
    icon: ArrowLeftRight,
  },
  {
    id: "pattern-library",
    name: "Pattern Library",
    description: "Search 'Healthcare Dashboard' → 50 production examples. Real-world patterns, not toy demos.",
    icon: Library,
  },
  {
    id: "benchmark",
    name: "CSS Benchmark",
    description: "Benchmark RoyCSS performance — live, always. Bundle size, render time, feature coverage.",
    icon: Gauge,
  },
  {
    id: "challenges",
    name: "Community Challenges",
    description: "Monthly challenges. Developers submit landing pages, dashboards, components, and animations. Win prizes, grow the ecosystem.",
    icon: Trophy,
  },
  {
    id: "specificity",
    name: "Specificity Calculator",
    description: "Paste any CSS selectors → instantly see each one's (a, b, c) specificity score, ranked visually. Never lose a cascade battle again.",
    icon: Calculator,
  },
  {
    id: "easing",
    name: "Easing Visualizer",
    description: "Design cubic-bezier curves visually — drag control points, compare 14 presets, watch a live preview, copy production CSS.",
    icon: Spline,
  },
  {
    id: "stacking",
    name: "Stacking Context Inspector",
    description: "Paste HTML → see the stacking-context tree with effective z-index. Or sandbox z-index live and finally understand why your modal hides behind the navbar.",
    icon: Layers,
  },
  {
    id: "similarity",
    name: "Effect Similarity Finder",
    description: "Pick any of 1,569 effects → instantly surface the most similar ones by tag, category, and CSS-property overlap. Explore the library by feel.",
    icon: Radar,
  },
  {
    id: "perf",
    name: "CSS Performance Analyzer",
    description: "Paste CSS → get a Lighthouse-style 0–100 score with categorized findings: @import, universal selectors, expensive @keyframes, big box-shadows, will-change overuse, and more.",
    icon: Zap,
  },
  {
    id: "browser-support",
    name: "Browser Support Matrix",
    description: "caniuse-style lookup for 27 modern CSS features (:has, oklch, nesting, container queries, view-transitions, subgrid…) across Chrome, Firefox, Safari, Edge, Samsung — with Baseline status.",
    icon: Globe,
  },
  {
    id: "print",
    name: "Print Stylesheet Simulator",
    description: "Preview @media print CSS in a live iframe — see exactly what prints (hidden nav, expanded links, page-breaks) without opening the print dialog. Pick A4/Letter, margins, toggle page breaks.",
    icon: Printer,
  },
  {
    id: "selector-tester",
    name: "Selector Tester",
    description: "Type any CSS selector — :has(), :is(), :where(), attribute operators, nth-child, combinators — and instantly see matching elements highlighted in a live HTML sample.",
    icon: Crosshair,
  },
  {
    id: "dark-mode",
    name: "Dark Mode Converter",
    description: "Paste a light-mode color palette (or raw CSS) → auto-generate a perceptually-tuned dark palette using OKLCH lightness inversion, with a live UI preview and CSS-variable export.",
    icon: MoonStar,
  },
  {
    id: "variable-graph",
    name: "Variable Dependency Graph",
    description: "Paste CSS using var() → get a layered visual dependency graph. Detects circular references, undefined var() calls, and unused custom properties — with one-click resolved-value export.",
    icon: Network,
  },
  {
    id: "fluid-type",
    name: "Fluid Typography Calculator",
    description: "Generate mathematically-correct clamp() type scales. Live multi-viewport preview (320–1440px via real iframes), font-size curve chart, and rem/px output with 6 type-scale presets.",
    icon: Type,
  },
  {
    id: "scroll-animation",
    name: "Scroll-Driven Animation Builder",
    description: "Build modern animation-timeline: scroll() and view() CSS with a live scrollable preview that actually drives the animation. Feature-detects browser support and falls back gracefully.",
    icon: ArrowDownUp,
  },
  {
    id: "grid-areas",
    name: "Grid Template Areas Builder",
    description: "Visually design grid-template-areas maps — paint named regions on a grid, drag-select ranges, validate rectangularity, and get copy-ready CSS with a live layout preview.",
    icon: LayoutGrid,
  },
  {
    id: "container-query",
    name: "Container Query Builder",
    description: "Build @container queries with a live resizable container you can drag — the content responds to the container's width, not the viewport. The modern responsive primitive.",
    icon: SquareStack,
  },
  {
    id: "nesting",
    name: "CSS Nesting Converter",
    description: "Convert flat CSS to native nesting (with &) and back — round-trip safe. Handles @media, combinators, pseudo-classes, and @supports. Modernize old stylesheets in one click.",
    icon: GitCompare,
  },
  {
    id: "contrast-matrix",
    name: "Color Contrast Matrix",
    description: "Check WCAG contrast for every color pair in your palette at once. N×N matrix with AAA/AA/AA-Large/Fail coloring, mini previews, and a failing-pairs report. Ship accessible palettes.",
    icon: Grid2x2,
  },
  {
    id: "unit-converter",
    name: "Unit Converter Pro",
    description: "Convert between all 16 CSS length units (px, rem, em, %, vw, vh, vmin, vmax, pt, pc, cm, mm, in, ex, ch, Q) with a root font-size simulator, viewport simulator, and batch CSS conversion.",
    icon: Ruler,
  },
  {
    id: "box-model",
    name: "Box Model Visualizer",
    description: "Interactive box model diagram — tweak margin/border/padding/content with live sliders, toggle box-sizing (content-box vs border-box), see computed dimensions, and copy generated CSS.",
    icon: Box,
  },
  {
    id: "flex-playground",
    name: "Flexbox Playground",
    description: "Full interactive flexbox playground — container controls (direction, wrap, justify, align, gap) + per-item flex/order/align-self. Add/remove items, live layout preview, generated CSS.",
    icon: Rows3,
  },
  {
    id: "transition-studio",
    name: "Transition Studio",
    description: "Build multi-property CSS transitions with per-property duration/easing/delay. Live hover/click trigger preview, configurable 'to' state, and generated transition shorthand CSS.",
    icon: Timer,
  },
  {
    id: "pattern-generator",
    name: "Background Pattern Generator",
    description: "Generate pure-CSS background patterns — stripes, grid, dots, checkerboard, triangles, zigzag, crosshatch, polka dots, waves, gingham. 8 color presets.",
    icon: Shapes,
  },
  {
    id: "transform-studio",
    name: "Transform Studio",
    description: "Visual builder for CSS transform — combine translate/rotate/scale/skew/3D transforms as layers. Live 3D preview with ghost outline, transform-origin picker, 6 presets.",
    icon: Move,
  },
  {
    id: "cursor-gallery",
    name: "Cursor Preview Gallery",
    description: "Hover-preview every CSS cursor value (pointer, grab, text, resize…), search by category, and build custom cursors with image upload + hotspot positioning.",
    icon: MousePointer2,
  },
  {
    id: "scrollbar-styler",
    name: "Scrollbar Styler",
    description: "Design custom CSS scrollbars — width, colors, radius, hover, border. Cross-browser (WebKit + Firefox). Live scrollable preview with 6 presets (Minimal, Rounded, Neon, MacOS).",
    icon: ScrollText,
  },
  {
    id: "gap-spacing",
    name: "Gap & Spacing Calculator",
    description: "Calculate CSS gap, margin, padding with 5 spacing systems (8px grid, 4px grid, modular scale, Tailwind defaults, custom). Smart shorthand collapsing + visual box-model diagram.",
    icon: Ruler,
  },
  {
    id: "writing-mode",
    name: "Writing Mode Playground",
    description: "Explore CSS writing-mode, direction, text-orientation for vertical text, RTL, and CJK layouts. Logical-to-physical properties mapping + RTL flip comparison demo.",
    icon: Languages,
  },
  {
    id: "object-fit",
    name: "Object Fit Visualizer",
    description: "Compare object-fit values (fill, contain, cover, none, scale-down) with live preview on 6 aspect ratios. Side-by-side thumbnails + object-position 3×3 grid.",
    icon: Image,
  },
  {
    id: "positioning",
    name: "Positioning Playground",
    description: "Interactive CSS position playground — static/relative/absolute/fixed/sticky. Draggable target element, inset controls, z-index, sticky scroll demo, 5 presets.",
    icon: Move,
  },
  {
    id: "property-inspector",
    name: "Custom Property Inspector",
    description: "Paste CSS → extract every --custom-property with resolved values, type detection (color/length/number), usage counts, and inheritance chains. Copy as :root block.",
    icon: Search,
  },
  {
    id: "animation-timeline",
    name: "Animation Timeline Visualizer",
    description: "Visualize multiple CSS animations on a Gantt-style timeline. See overlaps, play with a scrubber, adjust speed, and generate animation shorthand CSS.",
    icon: Film,
  },
  {
    id: "sprite-sheet",
    name: "Sprite Sheet Generator",
    description: "Combine images into a CSS sprite sheet — horizontal/vertical/grid layout, download PNG, generate background-position CSS + steps() animation.",
    icon: Images,
  },
  {
    id: "text-shadow",
    name: "Text Shadow Studio",
    description: "Design multi-layer text-shadows with live preview and 9 curated presets (neon glow, 3D extrude, fire, retro, letterpress). Copy production-ready CSS.",
    icon: Type,
  },
  {
    id: "filter-studio",
    name: "Filter Studio Pro",
    description: "Chain multiple CSS filters (blur, brightness, contrast, hue-rotate, drop-shadow) with live preview on image/box/text, before/after comparison, and SVG filter export.",
    icon: Filter,
  },
  {
    id: "conic-gradient",
    name: "Conic Gradient Generator",
    description: "Build conic-gradient() and repeating-conic-gradient() with a draggable angle dial, color stops on a strip, center-point pad, and 6 presets (rainbow, pie, sunburst).",
    icon: Disc,
  },
  {
    id: "motion-path",
    name: "Motion Path Animator",
    description: "Draw a path on an SVG canvas and animate an element along it using CSS offset-path. 5 path types (line/curve/circle/ellipse/custom), 8 presets (wave, figure-8, heart, star).",
    icon: Spline,
  },
  {
    id: "view-transition",
    name: "View Transition Builder",
    description: "Build View Transitions API demos with 6 transition types (morph, fade, slide, zoom, flip, custom). Live startViewTransition() trigger with feature detection and fallback.",
    icon: SquareStack,
  },
  {
    id: "mask-studio",
    name: "Mask Studio",
    description: "Visual CSS mask builder — gradient masks, image masks (8 SVG presets), text masks. Live preview with -webkit- prefixes for Safari. 7 presets.",
    icon: Brush,
  },
  {
    id: "gradient-mesh",
    name: "Gradient Mesh Generator",
    description: "Create mesh-gradient backgrounds with overlapping radial-gradients. Drag stops on preview, blend modes, 8 presets (Aurora, Sunset, Ocean, Neon), randomize.",
    icon: Blend,
  },
  {
    id: "table-styler",
    name: "Table Styler",
    description: "Style HTML tables — borders, headers, striped rows, hover effects, sticky header, responsive. Live preview with mock data. 6 presets (Minimal, Striped, Dark mode).",
    icon: TableProperties,
  },
  {
    id: "aspect-ratio",
    name: "Aspect Ratio Calculator",
    description: "Compute dimensions from aspect ratios, visualize responsive behavior at mobile/tablet/desktop, generate modern + padding-top fallback CSS. 8 common ratios.",
    icon: Proportions,
  },
];

/* ═══════════════════════════════════════════════════════════════
   DATA: Sponsor tiers
   ═══════════════════════════════════════════════════════════════ */

interface SponsorTier {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  amount: string;
  perks: string[];
}

const SPONSOR_TIERS: SponsorTier[] = [
  {
    id: "founder",
    name: "Founder",
    icon: Award,
    color: "text-emerald-500",
    amount: "By recognition",
    perks: ["The company that built RoyCSS", "Unique emerald glow", "Creator badge", "Permanent hero placement"],
  },
  {
    id: "community",
    name: "Community",
    icon: Heart,
    color: "text-rose-500",
    amount: "Any amount",
    perks: ["Listed on homepage", "Logo in documentation", "Monthly newsletter mention"],
  },
  {
    id: "gold",
    name: "Gold",
    icon: Crown,
    color: "text-amber-500",
    amount: "Suggested ~$1K+",
    perks: ["Featured on homepage", "Dedicated profile page", "Blog spotlight", "Conference sponsorship"],
  },
  {
    id: "platinum",
    name: "Platinum",
    icon: Rocket,
    color: "text-violet-500",
    amount: "Suggested ~$3K+",
    perks: ["Homepage hero placement", "Joint webinars", "Early roadmap access", "Direct engineering support"],
  },
  {
    id: "tech-partner",
    name: "Technology Partner",
    icon: Layers,
    color: "text-cyan-500",
    amount: "Suggested ~$10K+",
    perks: ["Framework integrations", "Co-marketing", "Joint technical content", "Mutual certification"],
  },
];

/* ═══════════════════════════════════════════════════════════════
   TIER METADATA
   ═══════════════════════════════════════════════════════════════ */

const TIER_META: Record<Tier | "all", { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  all: { label: "All Products", icon: Sparkles, color: "text-primary" },
  free: { label: "Free / OSS", icon: Heart, color: "text-emerald-500" },
  pro: { label: "Pro", icon: Crown, color: "text-amber-500" },
  enterprise: { label: "Enterprise", icon: Building2, color: "text-violet-500" },
  cloud: { label: "Cloud", icon: Cloud, color: "text-cyan-500" },
};

/* ═══════════════════════════════════════════════════════════════
   VISION DIAGRAM — Free foundation + paid ecosystem
   ═══════════════════════════════════════════════════════════════ */

function VisionDiagram() {
  const freeProducts = ["Framework", "Components", "CLI", "Documentation"];
  const paidProducts = ["Pro", "Studio", "Cloud", "Marketplace", "AI", "Enterprise", "Academy"];

  return (
    <ScrollReveal className="max-w-3xl mx-auto">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 overflow-hidden">
        {/* RoyCSS core */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary/10 border border-primary/30">
            <span className="font-display font-bold text-primary text-lg">RoyCSS</span>
            <span className="text-xs text-muted-foreground">core</span>
          </div>
        </div>

        {/* Free layer */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
            <Heart className="size-3" />
            Free &amp; Open Source — the entry point
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {freeProducts.map((p) => (
              <span
                key={p}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <ArrowRight className="size-4 text-muted-foreground rotate-90" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Paid layer */}
        <div>
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
            <Crown className="size-3" />
            Everything around it becomes valuable
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {paidProducts.map((p) => (
              <span
                key={p}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-600 dark:text-amber-400"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground italic leading-relaxed">
          &ldquo;A framework can recreate utility classes in months. What is much harder to reproduce is a mature
          ecosystem — marketplace, docs, tools, plugins, enterprise support, and an active community.&rdquo;
        </p>
      </div>
    </ScrollReveal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT CARD
   ═══════════════════════════════════════════════════════════════ */

function ProductCard({ product, onLaunchTool }: { product: PlatformProduct; onLaunchTool?: (toolId: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = product.icon;
  const tierMeta = TIER_META[product.tier];
  const TierIcon = tierMeta.icon;
  const isInteractive = onLaunchTool && INTERACTIVE_TOOLS[product.id];

  const handleClick = () => {
    if (isInteractive) {
      onLaunchTool!(product.id);
    } else {
      setExpanded((e) => !e);
    }
  };

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer perf-auto"
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`${product.name} — ${product.tagline}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isInteractive) { onLaunchTool!(product.id); } else { setExpanded((x) => !x); }
        }
      }}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-foreground text-sm leading-tight truncate">
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{product.tagline}</p>
            </div>
          </div>
          {/* Priority stars */}
          <div className="flex items-center gap-0.5 shrink-0" aria-label={`${product.priority} out of 5 priority`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-[8px] ${i < product.priority ? "text-amber-500" : "text-muted-foreground/30"}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {product.description}
        </p>

        {/* Tier + revenue badges */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs gap-1 capitalize ${tierMeta.color}`}>
            <TierIcon className="size-2.5" />
            {tierMeta.label}
          </Badge>
          <Badge variant="secondary" className="text-xs bg-muted/80 text-muted-foreground">
            {product.revenue}
          </Badge>
          {isInteractive && (
            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-500 gap-1">
              <Play className="size-2.5" /> Try it
            </Badge>
          )}
        </div>

        {/* Expanded features */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Includes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.features.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60 text-xs text-foreground/80"
                    >
                      <Check className="size-2.5 text-emerald-500 shrink-0" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint */}
        <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          {expanded ? "Show less" : "Show details"}
          <ArrowRight className={`size-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DIFFERENTIATOR CARD
   ═══════════════════════════════════════════════════════════════ */

function DifferentiatorCard({ item, onLaunchTool }: { item: Differentiator; onLaunchTool?: (toolId: string) => void }) {
  const Icon = item.icon;
  const isInteractive = onLaunchTool && INTERACTIVE_TOOLS[item.id];
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={() => isInteractive && onLaunchTool!(item.id)}
      className={`group rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-all ${
        isInteractive ? "cursor-pointer" : ""
      }`}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? `Launch ${item.name}` : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onLaunchTool!(item.id);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground text-sm leading-tight">{item.name}</h4>
            {isInteractive && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-500 gap-0.5 shrink-0">
                <Play className="size-2" /> Try it
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPONSOR TIER CARD
   ═══════════════════════════════════════════════════════════════ */

function SponsorCard({ tier }: { tier: SponsorTier }) {
  const Icon = tier.icon;
  return (
    <motion.div variants={staggerItem} className="h-full">
      <div className="rounded-2xl border border-border bg-card p-5 h-full hover:border-primary/40 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center justify-center size-9 rounded-lg bg-muted/60 ${tier.color}`}>
            <Icon className="size-4" />
          </div>
          <h4 className="font-display font-bold text-foreground">{tier.name}</h4>
        </div>
        <p className={`text-xs font-semibold ${tier.color} mb-3`}>{tier.amount}</p>
        <ul className="space-y-2">
          {tier.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Check className={`size-3.5 shrink-0 mt-0.5 ${tier.color}`} />
              <span className="leading-relaxed">{perk}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPETITIVE MOAT — closing statement
   ═══════════════════════════════════════════════════════════════ */

function CompetitiveMoat() {
  return (
    <ScrollReveal className="max-w-4xl mx-auto mt-16">
      <ShineBorder className="rounded-3xl bg-card overflow-hidden">
        <div className="p-8 sm:p-10 text-center">
          <Floating className="inline-block mb-4">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary">
              <Shield className="size-7" />
            </div>
          </Floating>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            The framework is the entry point, not the entire product
          </h3>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Frameworks are relatively easy to copy; ecosystems are not. If RoyCSS becomes the center of a trusted
            marketplace, high-quality documentation, excellent developer tools, a strong plugin and theme ecosystem,
            enterprise support, and an active community — that&apos;s a much stronger long-term position than competing
            on utility classes alone.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <AnimatedCounter value={16} className="font-display text-3xl font-bold text-primary" />
              <p className="text-xs text-muted-foreground mt-1">Platform products</p>
            </div>
            <div className="text-center">
              <AnimatedCounter value={10} className="font-display text-3xl font-bold text-primary" />
              <p className="text-xs text-muted-foreground mt-1">Unique differentiators</p>
            </div>
            <div className="text-center">
              <AnimatedCounter value={1569} className="font-display text-3xl font-bold text-primary" />
              <p className="text-xs text-muted-foreground mt-1">Free CSS effects</p>
            </div>
            <div className="text-center">
              <AnimatedCounter value={4} className="font-display text-3xl font-bold text-primary" />
              <p className="text-xs text-muted-foreground mt-1">Sponsor tiers</p>
            </div>
          </div>
        </div>
      </ShineBorder>
    </ScrollReveal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN SECTION
   ═══════════════════════════════════════════════════════════════ */

// Tool IDs that are interactive (open a panel instead of just expanding)
const INTERACTIVE_TOOLS: Record<string, string> = {
  "ai-playground": "ai-playground",
  "css-doctor": "css-doctor",
  "utility-explorer": "utility-explorer",
  "benchmark": "benchmark",
  "genome": "genome",
  "ai-migration": "ai-migration",
  "challenges": "challenges",
  "design-diff": "design-diff",
  "css-minifier": "css-minifier",
  "specificity": "specificity",
  "easing": "easing",
  "stacking": "stacking",
  "similarity": "similarity",
  "perf": "perf",
  "browser-support": "browser-support",
  "print": "print",
  "selector-tester": "selector-tester",
  "dark-mode": "dark-mode",
  "variable-graph": "variable-graph",
  "fluid-type": "fluid-type",
  "scroll-animation": "scroll-animation",
  "grid-areas": "grid-areas",
  "container-query": "container-query",
  "nesting": "nesting",
  "contrast-matrix": "contrast-matrix",
  "unit-converter": "unit-converter",
  "box-model": "box-model",
  "flex-playground": "flex-playground",
  "transition-studio": "transition-studio",
  "pattern-generator": "pattern-generator",
  "transform-studio": "transform-studio",
  "cursor-gallery": "cursor-gallery",
  "scrollbar-styler": "scrollbar-styler",
  "gap-spacing": "gap-spacing",
  "writing-mode": "writing-mode",
  "object-fit": "object-fit",
  "positioning": "positioning",
  "property-inspector": "property-inspector",
  "animation-timeline": "animation-timeline",
  "sprite-sheet": "sprite-sheet",
  "text-shadow": "text-shadow",
  "filter-studio": "filter-studio",
  "conic-gradient": "conic-gradient",
  "motion-path": "motion-path",
  "view-transition": "view-transition",
  "mask-studio": "mask-studio",
  "gradient-mesh": "gradient-mesh",
  "table-styler": "table-styler",
  "aspect-ratio": "aspect-ratio",
  // Note: mcp-server and inspector are external tools (CLI/Chrome extension),
  // NOT in-browser tools. They should expand to show setup instructions,
  // NOT try to open a panel. So they are intentionally NOT in this map.
};

export function PlatformEcosystem({ onLaunchTool }: { onLaunchTool?: (toolId: string) => void; onLearnMore?: (slug: string) => void } = {}) {
  const [activeTier, setActiveTier] = useState<Tier | "all">("all");
  const [sponsorOpen, setSponsorOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (activeTier === "all") return PRODUCTS;
    return PRODUCTS.filter((p) => p.tier === activeTier);
  }, [activeTier]);

  const tierKeys: (Tier | "all")[] = ["all", "free", "pro", "enterprise", "cloud"];

  const handleTierChange = useCallback((tier: Tier | "all") => {
    setActiveTier(tier);
  }, []);

  return (
    <section id="platform" aria-label="Platform ecosystem" className="py-16 sm:py-20 scroll-mt-20 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 -z-10 bg-grid opacity-10" />

      <div className="container mx-auto px-4 sm:px-6">
        {/* ─── Heading ─── */}
        <SectionHeading
          eyebrow="Not just a framework — a platform"
          title="The RoyCSS Ecosystem"
          subtitle="The framework remains free and open source. Everything around it — marketplace, studio, AI, cloud, enterprise — becomes the business. This is how great developer platforms win."
        />

        {/* ─── Vision Diagram ─── */}
        <div className="mt-12">
          <VisionDiagram />
        </div>

        {/* ─── Products ─── */}
        <div className="mt-16">
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="size-4 text-primary" />
              <h3 className="font-display text-xl font-bold text-foreground">Platform Ecosystem</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Filter by tier. Click any card to see what&apos;s included.
            </p>
          </ScrollReveal>

          {/* Tier filter pills */}
          <ScrollReveal delay={0.1}>
            <div
              className="flex flex-wrap gap-2 mb-6"
              role="tablist"
              aria-label="Filter platform products by tier"
            >
              {tierKeys.map((tier) => {
                const meta = TIER_META[tier];
                const TierIcon = meta.icon;
                const isActive = activeTier === tier;
                const count = tier === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.tier === tier).length;
                return (
                  <button
                    key={tier}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleTierChange(tier)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <TierIcon className="size-3" />
                    {meta.label}
                    <span className={`text-[10px] tabular-nums ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Product grid — removed; products now live in the unified Platform Products Showcase section */}
          <ScrollReveal delay={0.15}>
            <div className="text-center py-8 rounded-xl border border-dashed border-border/60 bg-muted/20">
              <p className="text-sm text-muted-foreground">
                All 60+ platform products are available in the interactive{" "}
                <span className="text-primary font-medium">Platform Products</span> section below.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* ─── Unique Features ─── */}
        <div className="mt-20">
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-display text-xl font-bold text-foreground">Unique Features</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Ten differentiators that make RoyCSS more than a CSS library.
            </p>
          </ScrollReveal>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DIFFERENTIATORS.map((item) => (
              <DifferentiatorCard key={item.id} item={item} onLaunchTool={onLaunchTool} />
            ))}
          </StaggerGroup>
        </div>

        {/* ─── Sponsor Tiers ─── */}
        <div className="mt-20">
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-4 text-primary" />
              <h3 className="font-display text-xl font-bold text-foreground">Sponsor Ecosystem</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Don&apos;t just add logos — build an ecosystem. Amounts are suggestions — not requirements.
            </p>
          </ScrollReveal>

          {/* Sponsor button */}
          <ScrollReveal delay={0.05}>
            <div className="flex justify-center mb-8">
              <button
                onClick={() => setSponsorOpen(true)}
                className="group inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Heart className="size-4 group-hover:scale-110 transition-transform" />
                Become a Sponsor
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </ScrollReveal>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SPONSOR_TIERS.map((tier) => (
              <SponsorCard key={tier.id} tier={tier} />
            ))}
          </StaggerGroup>

          {/* Sponsored companies carousel */}
          {SPONSORED_COMPANIES.length > 0 && (
            <div className="mt-10">
              <ScrollReveal>
                <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Our Sponsors
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/30 p-4">
                  <Marquee speed={30}>
                    {SPONSORED_COMPANIES.map((company) => {
                      const tier = getTierForCompany(company);
                      const meta = SPONSOR_TIER_META[tier];
                      const TierIcon = meta.icon;
                      return (
                        <div
                          key={company.name}
                          className={`mx-2 flex items-center gap-3 rounded-xl border bg-card/80 px-4 py-3 shrink-0 ${meta.glowBorder}`}
                          style={{ boxShadow: meta.glowShadow }}
                        >
                          <div className={`flex items-center justify-center size-9 rounded-lg ${meta.bg} ${meta.color} shrink-0`}>
                            <Building2 className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-display font-bold text-xs text-foreground leading-tight whitespace-nowrap">
                                {company.name}
                              </p>
                              <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${meta.bg} ${meta.color} whitespace-nowrap`}>
                                <Check className="size-2" />
                                <TierIcon className="size-2" />
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 whitespace-nowrap">
                              {company.amount
                                ? `$${company.amount.toLocaleString()}+ contributed`
                                : meta.suggestedAmount}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </Marquee>
                </div>
              </ScrollReveal>
            </div>
          )}
        </div>

        {/* ─── Competitive Moat ─── */}
        <CompetitiveMoat />
      </div>

      {/* Sponsor Modal */}
      <SponsorModal open={sponsorOpen} onOpenChange={setSponsorOpen} />
    </section>
  );
}
