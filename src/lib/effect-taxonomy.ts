/**
 * RoyCSS Effect Taxonomy — catalog curation primitives.
 *
 * This module is the single source of truth for:
 *   - The controlled tag vocabulary (`TAG_VOCABULARY` + `TAG_SYNONYMS`)
 *   - The 20 category definitions (`CATEGORY_DEFINITIONS`)
 *   - The 5 quality dimensions and their scoring heuristics (`QUALITY_DIMENSIONS`)
 *   - The `scoreEffect`, `normalizeTags`, `findDuplicates` entry points
 *   - The submission guide for new effects (`SUBMISSION_GUIDE`)
 *
 * Design docs: docs/adr/effect-curation/{DESIGN,ADR,IMPLEMENTATION-PLAN,REVIEW-CHECKLIST}.md
 *
 * The module is intentionally dependency-free so it can be imported from:
 *   - The curation script (Bun, scripts/curate-effects.ts)
 *   - Future Next.js routes (Node runtime)
 *   - The MCP server (Node runtime)
 *
 * All exports are pure functions or constant data — no side effects, no I/O.
 */

import type { CSSEffect, EffectCategory } from "./roycss-types";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type TagDimension =
  | "visual"
  | "motion"
  | "purpose"
  | "surface"
  | "technique"
  | "a11y";

export interface CategoryDefinition {
  category: EffectCategory;
  label: string;
  definition: string;
  boundary: string;
  examples: string[];
  commonConfusion: string;
  /** Suggested previewType for this category. */
  previewType: CSSEffect["previewType"];
  /** Keywords that, if present in name or tags, suggest this category. */
  keywords: string[];
}

export type QualityDimensionId =
  | "correctness"
  | "completeness"
  | "performance"
  | "accessibility"
  | "uniqueness";

export interface DimensionScore {
  dimension: QualityDimensionId;
  score: number;
  reasoning: string;
}

export interface EffectScore {
  id: string;
  name: string;
  category: EffectCategory;
  overall: number;
  tier: "A" | "B" | "C" | "D";
  dimensions: DimensionScore[];
  flags: string[];
}

export interface TagNormalizationResult {
  normalized: string[];
  changes: { from: string; to: string | null }[];
}

export interface DuplicateCluster {
  canonical: string;
  members: {
    id: string;
    name: string;
    similarity: number;
    reason: string;
  }[];
  recommendation: "merge" | "review" | "distinct";
}

export interface SubmissionGuide {
  requiredFields: string[];
  namingConventions: { id: string; name: string; description: string };
  qualityBar: { overall: number; perDimension: number };
  tagRules: string[];
  steps: string[];
}

// ═══════════════════════════════════════════════════════════════════
// TAG_VOCABULARY — controlled vocabulary, ~100 tags across 6 dimensions
// ═══════════════════════════════════════════════════════════════════

export const TAG_VOCABULARY: Record<TagDimension, string[]> = {
  visual: [
    "glow", "shadow", "blur", "gradient", "neon", "shimmer", "shine",
    "metallic",
    "holographic", "iridescent", "chrome", "glass", "glassmorphism",
    "neumorphism", "claymorphism", "frosted", "mesh", "aurora", "liquid",
    "organic", "retro", "vintage", "modern", "minimal", "apple", "material",
    "cyberpunk", "synthwave", "hologram", "prism", "rainbow", "noise",
    "grain", "glitch", "pixel", "spotlight", "sunset", "water", "lava",
    "fire", "smoke", "snow", "rain", "stars", "bubbles", "crystal",
    "velvet", "stained-glass", "molten", "8bit", "sepia", "grayscale",
  ],
  motion: [
    "spin", "bounce", "fade", "slide", "pulse", "rotate", "scale", "flip",
    "shake", "swing", "wobble", "tada", "jello", "heartbeat", "float",
    "sway", "morph", "blink", "zoom", "roll", "stretch", "skew", "pop",
    "drift", "breathe", "ripple", "wave", "orbit", "dissolve", "parallax",
    "sweep", "vibrate", "jiggle", "twinkle", "flicker",
  ],
  purpose: [
    "attention", "loading", "feedback", "entrance", "exit", "reveal",
    "celebration", "ambient", "placeholder", "transition", "error",
    "success", "alert", "notification", "decoration", "interactive",
    "skeleton", "progress", "indeterminate", "draw", "highlight",
  ],
  surface: [
    "text", "card", "button", "background", "border", "cursor", "input",
    "form", "nav", "menu", "tabs", "image", "icon", "badge", "tooltip",
    "modal", "toast", "banner", "spinner", "dots", "bars", "ring",
    "accordion", "stepper", "dropdown", "toggle", "checkbox", "radio",
    "fab", "hero",
  ],
  technique: [
    "keyframes", "transform", "filter", "clip-path", "mask", "perspective",
    "container", "conic", "radial", "linear", "overlay", "blend",
    "backdrop", "shadow-2d", "shadow-3d", "typography", "3d", "depth",
    "offset-path", "mask-fade", "hue-rotate", "saturate",
  ],
  a11y: [
    "reduced-motion-safe", "high-contrast", "no-animation", "seizure-safe",
    "sr-only", "skip-link", "keyboard-nav",
  ],
};

/** Flat set of all canonical tags for O(1) lookup. */
export const CANONICAL_TAGS: Set<string> = new Set(
  Object.values(TAG_VOCABULARY).flat(),
);

// ═══════════════════════════════════════════════════════════════════
// TAG_SYNONYMS — freeform → canonical mappings (~120 entries)
// ═══════════════════════════════════════════════════════════════════

export const TAG_SYNONYMS: Record<string, string> = {
  // verb forms / participles
  glowing: "glow",
  shines: "shine",
  shining: "shimmer",
  shimmering: "shimmer",
  spinning: "spin",
  spinner: "spin",
  spinners: "spin",
  rotating: "rotate",
  rotation: "rotate",
  bouncing: "bounce",
  bouncing2: "bounce",
  fading: "fade",
  sliding: "slide",
  pulsing: "pulse",
  pulses: "pulse",
  scaling: "scale",
  flipping: "flip",
  shaking: "shake",
  swings: "swing",
  swinging: "swing",
  wobbling: "wobble",
  jelloing: "jello",
  floating: "float",
  floating2: "float",
  swaying: "sway",
  morphing: "morph",
  blinking: "blink",
  zooming: "zoom",
  rolling: "roll",
  stretching: "stretch",
  skewing: "skew",
  popping: "pop",
  drifting: "drift",
  breathing: "breathe",
  breathe: "breathe",
  rippling: "ripple",
  waving: "wave",
  waves: "wave",
  orbiting: "orbit",
  dissolving: "dissolve",
  sweeping: "sweep",
  vibrating: "vibrate",
  jiggling: "jiggle",
  twinkling: "twinkle",
  flickering: "flicker",
  flicker: "flicker",
  // animation/animate/animated — collapse to "keyframes" (technique) only when used as motion
  animated: "keyframes",
  animate: "keyframes",
  animation: "keyframes",
  motion: "keyframes",
  effect: "keyframes",
  // surfaces
  hover: "interactive",
  "hover-effect": "interactive",
  button: "button",
  buttons: "button",
  cards: "card",
  backgrounds: "background",
  loader: "spinner",
  loading: "loading",
  loaders: "spinner",
  text: "text",
  typography: "typography",
  border: "border",
  borders: "border",
  cursor: "cursor",
  input: "input",
  inputs: "input",
  form: "form",
  forms: "form",
  nav: "nav",
  navigation: "nav",
  image: "image",
  images: "image",
  icon: "icon",
  icons: "icon",
  badge: "badge",
  badges: "badge",
  tooltip: "tooltip",
  modal: "modal",
  toasts: "toast",
  skeleton: "skeleton",
  progress: "progress",
  // motion subtypes
  spring: "bounce",
  elastic: "bounce",
  "spring-bounce": "bounce",
  rubber: "stretch",
  "rubber-band": "stretch",
  // techniques
  filter2: "filter",
  filters: "filter",
  transforms: "transform",
  transformations: "transform",
  "3d-transform": "3d",
  "3d-transforms": "3d",
  "3d-rotate": "rotate",
  conic2: "conic",
  radial2: "radial",
  gradients: "gradient",
  "gradient-2": "gradient",
  // visuals
  glow2: "glow",
  neon2: "neon",
  shadow2: "shadow",
  shadows: "shadow",
  blurs: "blur",
  // generic motion
  in: "entrance",
  out: "exit",
  // attention/feedback
  attention2: "attention",
  error2: "error",
  alert2: "alert",
  success2: "success",
  // misc synonyms seen in catalog
  visual: "decoration",
  interactive2: "interactive",
  modern2: "modern",
  modern3: "modern",
  retro2: "retro",
  vintage2: "vintage",
  "8-bit": "8bit",
  cyberpunk2: "cyberpunk",
  // containers
  container2: "container",
  // 3d & depth
  depth2: "depth",
  // general
  transition2: "transition",
  transitions: "transition",
};

// ═══════════════════════════════════════════════════════════════════
// CATEGORY_DEFINITIONS — boundary rules for all 20 categories
// ═══════════════════════════════════════════════════════════════════

export const CATEGORY_DEFINITIONS: Record<EffectCategory, CategoryDefinition> =
  {
    animations: {
      category: "animations",
      label: "Animations",
      definition:
        "Keyframed continuous or one-shot motion applied to an element without requiring user interaction.",
      boundary:
        "If the effect only triggers on :hover/:focus/:active, it belongs in 'hover' or 'microinteractions' instead.",
      examples: ["pulse-glow", "bounce-in", "fade-in-up", "rotate-spin"],
      commonConfusion:
        "Confused with 'microinteractions' (which require a user trigger) and 'visual' (which is decorative, not motion).",
      previewType: "box",
      keywords: [
        "anim", "pulse", "bounce", "fade", "rotate", "spin", "shake",
        "wave", "morph", "orbit", "float", "swing", "wobble",
      ],
    },
    hover: {
      category: "hover",
      label: "Hover Effects",
      definition:
        "Effects that activate on :hover (or :focus/:active) of the element itself.",
      boundary:
        "If the effect runs continuously without a trigger, use 'animations'. If it's component-level feedback (e.g. a checkmark animating in), use 'microinteractions'.",
      examples: ["hover-lift-glow-b18", "hover-underline-grow"],
      commonConfusion:
        "Confused with 'microinteractions' (broader: includes click, focus, value-change triggers, not just hover).",
      previewType: "box",
      keywords: ["hover", "rollover", "mouseover", "lift", "press"],
    },
    text: {
      category: "text",
      label: "Text Effects",
      definition:
        "Styling or animation that targets text glyphs — gradient fills, glow, outline, kinetic typography.",
      boundary:
        "If the effect is on the text's container (not the glyphs), use 'cards' or 'visual'.",
      examples: ["text-gradient", "text-aurora-gradient-b18", "text-neon"],
      commonConfusion:
        "Confused with 'visual' (text is just one surface) and 'typography' (which is a technique tag, not a category).",
      previewType: "text",
      keywords: ["text", "typewriter", "letter", "glyph", "typography"],
    },
    backgrounds: {
      category: "backgrounds",
      label: "Backgrounds",
      definition:
        "Effects that paint a background surface — gradients, patterns, mesh, aurora.",
      boundary:
        "If the background requires user interaction, use 'hover'. If it's particle-based (multiple moving elements), use 'particles'.",
      examples: ["bg-animated-gradient", "bg-mesh-gradient"],
      commonConfusion:
        "Confused with 'particles' (multi-element) and 'visual' (decorative surfaces).",
      previewType: "background",
      keywords: ["bg", "background", "gradient", "pattern", "mesh", "aurora"],
    },
    loaders: {
      category: "loaders",
      label: "Loaders",
      definition:
        "Indeterminate progress indicators — spinners, dots, bars, skeletons, rings.",
      boundary:
        "If the effect shows a specific percentage, use 'forms' (progress bar). If it's a full-screen branded loading state, use 'page-transitions'.",
      examples: ["loader-spinner", "loader-dots", "loader-bars"],
      commonConfusion:
        "Confused with 'animations' (loaders are a subset with a specific purpose).",
      previewType: "loader",
      keywords: ["loader", "spinner", "loading", "skeleton", "dots", "bars", "ring", "progress"],
    },
    "3d-transforms": {
      category: "3d-transforms",
      label: "3D & Transforms",
      definition:
        "Effects using transform: perspective(), rotateX/Y/Z, translateZ, or 3D matrix.",
      boundary:
        "If the transform is purely 2D (translate, scale, rotate without perspective), use 'animations' or 'hover'.",
      examples: ["3d-flip-card", "3d-cube-rotate"],
      commonConfusion:
        "Confused with 'animations' (3d-transforms is the technique-driven category).",
      previewType: "box",
      keywords: ["3d", "perspective", "rotatex", "rotatey", "rotatez", "cube", "flip-3d"],
    },
    buttons: {
      category: "buttons",
      label: "Button Effects",
      definition:
        "Effects applied to a button affordance — press feedback, shine sweeps, gradient glows.",
      boundary:
        "If the effect is on a non-button element styled to look button-like, use 'hover' or 'microinteractions'.",
      examples: ["btn-shine-sweep", "btn-gradient-glow-b18", "btn-3d-push-b18"],
      commonConfusion:
        "Confused with 'hover' (buttons is component-scoped; hover is interaction-scoped).",
      previewType: "button",
      keywords: ["btn", "button", "cta", "press"],
    },
    cards: {
      category: "cards",
      label: "Card Effects",
      definition:
        "Effects styling a card surface — border treatments, glassmorphism applied to cards, reveal animations.",
      boundary:
        "If the effect is a generic glassmorphism surface (not card-shaped), use 'glass-ui'. If it's a button, use 'buttons'.",
      examples: ["card-glassmorphism", "card-glass-hover", "card-gradient-border-b19"],
      commonConfusion:
        "Confused with 'glass-ui' (surface technique) and 'borders' (border-only effects).",
      previewType: "card",
      keywords: ["card", "tile", "panel"],
    },
    borders: {
      category: "borders",
      label: "Borders",
      definition:
        "Effects where the border itself is the focus — animated outlines, gradient borders, drawn borders.",
      boundary:
        "If the border is incidental to a larger card effect, use 'cards'.",
      examples: ["border-gradient-spin", "border-draw-on-hover"],
      commonConfusion:
        "Confused with 'cards' (which often have borders but are about the whole surface).",
      previewType: "box",
      keywords: ["border", "outline", "frame", "stroke"],
    },
    filters: {
      category: "filters",
      label: "Filters",
      definition:
        "Effects whose primary mechanism is the CSS filter: or backdrop-filter: property.",
      boundary:
        "If the filter is incidental to a larger animation, use 'animations' or 'visual'.",
      examples: ["filter-blur-reveal", "filter-hue-rotate"],
      commonConfusion:
        "Confused with 'visual' (which often uses filters but isn't defined by them).",
      previewType: "box",
      keywords: ["filter", "blur", "hue-rotate", "saturate", "grayscale", "backdrop"],
    },
    forms: {
      category: "forms",
      label: "Forms & Inputs",
      definition:
        "Form input effects — focus states, validation feedback, label interactions, progress bars.",
      boundary:
        "If the effect is a generic button (submit), use 'buttons'. If it's a navigation control, use 'navigation'.",
      examples: ["glass-input-field-b18", "form-validation-shake"],
      commonConfusion:
        "Confused with 'microinteractions' (which is broader) and 'buttons' (which is submit-button-specific).",
      previewType: "box",
      keywords: ["form", "input", "validation", "label", "field", "checkbox", "radio", "select"],
    },
    navigation: {
      category: "navigation",
      label: "Navigation",
      definition:
        "Menus, tabs, breadcrumbs, steppers, and other navigation controls.",
      boundary:
        "If the effect is a generic hover on a nav link, use 'hover'.",
      examples: ["nav-stepper-b20", "glass-nav-bar-b18"],
      commonConfusion:
        "Confused with 'microinteractions' (nav is structure-scoped).",
      previewType: "card",
      keywords: ["nav", "menu", "tab", "breadcrumb", "stepper", "dropdown", "sidebar"],
    },
    scroll: {
      category: "scroll",
      label: "Scroll Effects",
      definition:
        "Effects triggered by or linked to scroll position — parallax, scroll-driven reveal, sticky transforms.",
      boundary:
        "If the effect is independent of scroll, use 'animations'.",
      examples: ["scroll-parallax", "scroll-reveal-up"],
      commonConfusion:
        "Confused with 'animations' (scroll requires a position trigger).",
      previewType: "background",
      keywords: ["scroll", "parallax", "sticky", "scroll-driven"],
    },
    cursor: {
      category: "cursor",
      label: "Cursor Effects",
      definition:
        "Custom cursor or cursor-following elements — dot followers, magnetic effects, trails.",
      boundary:
        "If the effect is a hover state on the element (not the cursor itself), use 'hover'.",
      examples: ["cursor-dot-follower", "cursor-magnetic"],
      commonConfusion:
        "Confused with 'hover' (cursor is global pointer tracking).",
      previewType: "box",
      keywords: ["cursor", "pointer", "follower", "magnetic", "trail"],
    },
    "page-transitions": {
      category: "page-transitions",
      label: "Page Transitions",
      definition:
        "Full-page enter/exit transitions — fade, slide, flip between routes.",
      boundary:
        "If the transition is on a single element (not the whole page), use 'animations'.",
      examples: ["page-fade-transition", "page-slide-left"],
      commonConfusion:
        "Confused with 'animations' (page-transitions are scoped to the full viewport).",
      previewType: "background",
      keywords: ["page", "transition", "route", "view"],
    },
    "glass-ui": {
      category: "glass-ui",
      label: "Glass & Modern UI",
      definition:
        "Glassmorphism, neumorphism, claymorphism, and modern surface treatments.",
      boundary:
        "If the effect is a specific component (card, button), use that category. Glass-ui is for surface-only effects.",
      examples: ["vis-frosted-glass-v2-b18", "glass-badge-pill-b18"],
      commonConfusion:
        "Confused with 'cards' (component) and 'visual' (decorative).",
      previewType: "card",
      keywords: ["glass", "glassmorphism", "neumorphism", "claymorphism", "frosted", "frost"],
    },
    particles: {
      category: "particles",
      label: "Particles",
      definition:
        "Multi-element particle systems — snow, confetti, dust, fireflies, sparks.",
      boundary:
        "If the effect is a single moving element, use 'animations'. If it's a static pattern, use 'backgrounds'.",
      examples: ["particles-snow-fall", "anim-confetti-burst-b20"],
      commonConfusion:
        "Confused with 'backgrounds' (particles implies motion + multiple elements).",
      previewType: "background",
      keywords: ["particle", "particles", "confetti", "snow", "rain", "dust", "sparks", "fireflies", "stars"],
    },
    microinteractions: {
      category: "microinteractions",
      label: "Microinteractions",
      definition:
        "Small interactive feedback on a single component — click ripples, bell shakes, toast slides.",
      boundary:
        "If the effect is on :hover specifically, use 'hover'. If it's a full animation without trigger, use 'animations'.",
      examples: ["micro-shake-error", "micro-bell-shake-b18", "micro-fade-up"],
      commonConfusion:
        "Confused with 'hover' (microinteractions is the broader trigger-driven category).",
      previewType: "box",
      keywords: ["micro", "ripple", "bell", "toast", "accordion", "shake", "feedback"],
    },
    visual: {
      category: "visual",
      label: "Visual Effects",
      definition:
        "Holographic, metallic, chrome, and advanced decorative styles that don't fit other categories.",
      boundary:
        "If the effect is primarily motion, use 'animations'. If it's a specific component, use that category.",
      examples: ["vis-liquid-metal-b18", "vis-holographic"],
      commonConfusion:
        "Confused with 'backgrounds' (visual is decorative surface styling, not background painting).",
      previewType: "box",
      keywords: ["vis", "holographic", "metallic", "chrome", "iridescent", "prism", "hologram"],
    },
    misc: {
      category: "misc",
      label: "Miscellaneous",
      definition:
        "Effects that genuinely defy categorization. Should be the smallest category — last resort only.",
      boundary:
        "If the effect can fit any other category, it must go there. 'misc' is for true oddities.",
      examples: ["misc-fireworks"],
      commonConfusion:
        "Used as a dumping ground for un-categorized effects. Should be reviewed quarterly for re-categorization.",
      previewType: "box",
      keywords: ["misc"],
    },
    physics: {
      category: "physics",
      label: "Physics Motion",
      definition:
        "Effects that simulate real-world physics: springs, elasticity, gravity, friction, momentum, and inertia.",
      boundary:
        "If the effect is a simple keyframe animation without physics-based easing, it belongs in 'animations' instead.",
      examples: ["physics-spring-bounce", "physics-gravity-drop", "physics-magnetic-pull"],
      commonConfusion:
        "Confused with 'animations' — physics effects use cubic-bezier easing that mimics real-world forces (spring, elastic, gravity).",
      previewType: "box",
      keywords: ["physics", "spring", "elastic", "gravity", "bounce", "magnetic", "friction", "momentum"],
    },
    liquid: {
      category: "liquid",
      label: "Liquid & Fluid",
      definition:
        "Effects that simulate liquid behavior: flowing, filling, rippling, and morphing like fluids.",
      boundary:
        "If the effect uses border-radius morphing without a liquid aesthetic, it belongs in 'morphing' instead.",
      examples: ["liquid-button-fill", "liquid-blob-morph", "liquid-wave-loader"],
      commonConfusion:
        "Confused with 'morphing' — liquid effects specifically evoke fluid behavior (pouring, rippling, surface tension).",
      previewType: "box",
      keywords: ["liquid", "fluid", "wave", "ripple", "splash", "pour", "water", "droplet"],
    },
    morphing: {
      category: "morphing",
      label: "Shape Morphing",
      definition:
        "Effects where elements transition between different shapes, states, or configurations.",
      boundary:
        "If the effect is a simple scale/rotate transform, it belongs in 'animations' or '3d-transforms' instead.",
      examples: ["morph-shape-cycle", "morph-icon-transform", "morph-card-expand"],
      commonConfusion:
        "Confused with 'animations' — morphing effects specifically change the element's shape/structure, not just its position.",
      previewType: "box",
      keywords: ["morph", "shape", "transform", "clip-path", "border-radius", "transition", "cycle"],
    },
  };

// ═══════════════════════════════════════════════════════════════════
// QUALITY_DIMENSIONS — 5 dimensions, each with a scoring function
// ═══════════════════════════════════════════════════════════════════

export const QUALITY_DIMENSIONS: {
  id: QualityDimensionId;
  label: string;
  description: string;
  score: (effect: CSSEffect) => { score: number; reasoning: string };
}[] = [
  {
    id: "correctness",
    label: "Correctness",
    description:
      "Does the CSS actually work in a modern browser without throwing away the previewType contract?",
    score: (effect) => scoreCorrectness(effect),
  },
  {
    id: "completeness",
    label: "Completeness",
    description:
      "Does the effect carry enough metadata for a consumer to find, understand, and trust it?",
    score: (effect) => scoreCompleteness(effect),
  },
  {
    id: "performance",
    label: "Performance",
    description:
      "Will this effect hurt the page? Heuristic, not a benchmark.",
    score: (effect) => scorePerformance(effect),
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description:
      "Honors prefers-reduced-motion, no seizure-risk strobing, preserves readability.",
    score: (effect) => scoreAccessibility(effect),
  },
  {
    id: "uniqueness",
    label: "Uniqueness",
    description:
      "How distinct is this effect from the rest of the catalog? Computed by findDuplicates.",
    score: (effect) => ({
      score: 7,
      reasoning:
        "Uniqueness is computed globally by findDuplicates(); defaulting to 7 (B-tier) for standalone scoring. Use EffectScore from the curation script for the real value.",
    }),
  },
];

// ═══════════════════════════════════════════════════════════════════
// SUBMISSION_GUIDE
// ═══════════════════════════════════════════════════════════════════

export const SUBMISSION_GUIDE: SubmissionGuide = {
  requiredFields: [
    "id (kebab-case, unique)",
    "name (Title Case, 2+ words, ≤ 36 chars)",
    "category (one of the 20 EffectCategory values)",
    "description (specific, ≥ 40 chars)",
    "tags (3–5 entries, all from TAG_VOCABULARY after normalization)",
    "cssCode (self-contained, .roycss-<id> + any @keyframes roy-<id>)",
    "previewType (matches category per CATEGORY_DEFINITIONS.previewType)",
  ],
  namingConventions: {
    id: "kebab-case, lowercase ASCII, starts with a letter, ≤ 40 chars. Batch-attributed: '-bNN' suffix. FerrumCSS imports: 'ferrum-' prefix.",
    name: "Title Case, 2+ words preferred, ≤ 36 chars. Not just the id with dashes replaced.",
    description:
      "Specific outcome-focused sentence or clause, ≥ 40 chars. Avoid 'An X effect' templates.",
  },
  qualityBar: {
    overall: 6,
    perDimension: 5,
  },
  tagRules: [
    "Use only tags from TAG_VOCABULARY (6 dimensions, ~100 tags).",
    "3–5 tags per effect. Fewer is under-tagged; more is over-tagged.",
    "No id-mirror tags (a tag equal to the effect id adds no information).",
    "Freeform tags are accepted at submission but normalized at curation time.",
  ],
  steps: [
    "1. Pick a category from CATEGORY_DEFINITIONS that matches your effect's boundary rule.",
    "2. Choose an id following the naming convention. Check uniqueness against existing batches.",
    "3. Write a Title Case name and a specific description (≥ 40 chars).",
    "4. Write self-contained CSS scoped under .roycss-<id>. Prefix all keyframes roy-<id>.",
    "5. Add a @media (prefers-reduced-motion: reduce) guard if you have any animation.",
    "6. Pick 3–5 tags from TAG_VOCABULARY covering visual + motion + purpose dimensions.",
    "7. Choose previewType per CATEGORY_DEFINITIONS[category].previewType.",
    "8. Add the effect to the most recent effects-batch-NN.ts file with a numbered comment.",
    "9. Run `bun run scripts/curate-effects.ts` — your effect must not appear in lowQuality or duplicates.",
    "10. Open a PR. A reviewer will run through REVIEW-CHECKLIST.md (15 items).",
  ],
};

// ═══════════════════════════════════════════════════════════════════
// normalizeTags — applies the 4-pass normalization
// ═══════════════════════════════════════════════════════════════════

export function normalizeTags(
  tags: string[],
  effectId?: string,
): TagNormalizationResult {
  const changes: { from: string; to: string | null }[] = [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  // Build a slug of the effect id once for id-mirror detection.
  const idSlug = effectId?.toLowerCase().replace(/-/g, "");

  for (const raw of tags) {
    const original = raw;
    let tag = raw.toLowerCase().trim().replace(/\s+/g, "-");

    // Pass 2: synonym map
    if (TAG_SYNONYMS[tag]) {
      tag = TAG_SYNONYMS[tag];
    }

    // Pass 3: id-mirror strip
    // Strip if the tag equals the id, equals the id with dashes removed,
    // or contains the id (e.g. "text-bounce-letters" on "ferrum-text-bounce-letters").
    if (effectId) {
      const tagNoDash = tag.replace(/-/g, "");
      const idLower = effectId.toLowerCase();
      const idNoDash = idLower.replace(/-/g, "");
      if (
        tag === idLower ||
        tagNoDash === idNoDash ||
        (idSlug && tagNoDash === idSlug) ||
        tag.includes(idLower)
      ) {
        changes.push({ from: original, to: null });
        continue;
      }
    }

    // Pass 4: keep only canonical tags; flag others as uncontrolled
    // (still include them in normalized output so we can count them in
    // the report — they're just not in the vocabulary)
    if (!seen.has(tag)) {
      seen.add(tag);
      normalized.push(tag);
    }

    if (original.toLowerCase().trim().replace(/\s+/g, "-") !== tag) {
      changes.push({ from: original, to: tag });
    }
  }

  return { normalized, changes };
}

// ═══════════════════════════════════════════════════════════════════
// scoreEffect — runs all 5 dimensions
// ═══════════════════════════════════════════════════════════════════

export function scoreEffect(effect: CSSEffect): DimensionScore[] {
  return QUALITY_DIMENSIONS.map((d) => {
    const result = d.score(effect);
    return {
      dimension: d.id,
      score: Math.max(0, Math.min(10, Math.round(result.score))),
      reasoning: result.reasoning,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// findDuplicates — name + CSS similarity, union-find clustering
// ═══════════════════════════════════════════════════════════════════

export function findDuplicates(effects: CSSEffect[]): DuplicateCluster[] {
  const n = effects.length;
  // Precompute normalized CSS strings for token-set Jaccard.
  const normCss = effects.map((e) => normalizeCss(e.cssCode));
  const cssTokens = normCss.map((s) => new Set(s.split(/\s+/).filter(Boolean)));

  // Union-find parent array.
  const parent = new Array(n).fill(0).map((_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  // Track the best similarity for each pair so we can attach a reason.
  const pairSimilarity: Map<string, { sim: number; reason: string }> = new Map();

  for (let i = 0; i < n; i++) {
    const nameI = effects[i].name.toLowerCase();
    for (let j = i + 1; j < n; j++) {
      const nameJ = effects[j].name.toLowerCase();
      const nameSim = nameSimilarity(nameI, nameJ);
      const cssSim = jaccard(cssTokens[i], cssTokens[j]);
      const weighted = 0.5 * nameSim + 0.5 * cssSim;

      let flagged = false;
      let reason = "";
      let sim = 0;
      // Tighter thresholds to avoid false positives:
      //   - name ≥ 0.85 catches same-name duplicates (e.g. pulse-glow vs
      //     ferrum-pulse-glow). Strong signal on its own.
      //   - css ≥ 0.95 catches near-identical CSS clones (only when the
      //     token sets are virtually identical, not just structurally
      //     similar).
      //   - compound: name ≥ 0.65 AND css ≥ 0.75 catches effects that are
      //     clearly variants (different name but high CSS overlap and
      //     reasonably similar name).
      if (nameSim >= 0.85) {
        flagged = true;
        reason = `name similarity ${nameSim.toFixed(2)} ≥ 0.85`;
        sim = nameSim;
      } else if (cssSim >= 0.95) {
        flagged = true;
        reason = `css similarity ${cssSim.toFixed(2)} ≥ 0.95`;
        sim = cssSim;
      } else if (nameSim >= 0.65 && cssSim >= 0.75) {
        flagged = true;
        reason = `compound similarity (name ${nameSim.toFixed(2)}, css ${cssSim.toFixed(2)})`;
        sim = weighted;
      }

      if (flagged) {
        union(i, j);
        const key = `${i}-${j}`;
        pairSimilarity.set(key, { sim, reason });
      }
    }
  }

  // Group by root.
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(i);
  }

  // Build clusters (only those with > 1 member).
  const clusters: DuplicateCluster[] = [];
  for (const [, indices] of groups) {
    if (indices.length < 2) continue;

    // For each member, find the best similarity to any other member.
    const members = indices.map((i) => {
      let bestSim = 0;
      let bestReason = "in cluster";
      for (const j of indices) {
        if (i === j) continue;
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        const entry = pairSimilarity.get(key);
        if (entry && entry.sim > bestSim) {
          bestSim = entry.sim;
          bestReason = entry.reason;
        }
      }
      return {
        id: effects[i].id,
        name: effects[i].name,
        similarity: Number(bestSim.toFixed(3)),
        reason: bestReason,
      };
    });

    // Canonical: prefer roycss- prefixed (non-ferrum), then alphabetical.
    // Among roycss-originals, pick the one with the shortest id (most
    // canonical / earliest).
    const sorted = [...members].sort((a, b) => {
      const aIsFerrum = a.id.startsWith("ferrum-");
      const bIsFerrum = b.id.startsWith("ferrum-");
      if (aIsFerrum !== bIsFerrum) return aIsFerrum ? 1 : -1;
      return a.id.length - b.id.length;
    });
    const canonical = sorted[0].id;

    // Recommendation
    const maxSim = Math.max(...members.map((m) => m.similarity));
    let recommendation: DuplicateCluster["recommendation"] = "review";
    if (maxSim >= 0.95) recommendation = "merge";
    else if (maxSim < 0.85) recommendation = "distinct";

    clusters.push({ canonical, members, recommendation });
  }

  // Sort clusters by size descending, then by max similarity.
  clusters.sort((a, b) => {
    if (b.members.length !== a.members.length)
      return b.members.length - a.members.length;
    const aMax = Math.max(...a.members.map((m) => m.similarity));
    const bMax = Math.max(...b.members.map((m) => m.similarity));
    return bMax - aMax;
  });

  return clusters;
}

// ═══════════════════════════════════════════════════════════════════
// Internal: scoring helpers
// ═══════════════════════════════════════════════════════════════════

function scoreCorrectness(effect: CSSEffect): { score: number; reasoning: string } {
  const css = effect.cssCode;
  const issues: string[] = [];
  let score = 10;

  // Empty / stub CSS
  if (css.trim().length < 30) {
    score -= 7;
    issues.push(`css is suspiciously short (${css.length} chars)`);
  }

  // Brace balance
  const open = (css.match(/\{/g) || []).length;
  const close = (css.match(/\}/g) || []).length;
  if (open !== close) {
    score -= 4;
    issues.push(`unbalanced braces (${open} open vs ${close} close)`);
  }

  // Class matches id
  const expectedClass = `.roycss-${effect.id}`;
  if (!css.includes(expectedClass)) {
    // Some effects use compound selectors or scope under a different name.
    // Check if any .roycss- class is present.
    if (!css.includes(".roycss-")) {
      score -= 5;
      issues.push(`no .roycss- class found in css`);
    } else if (!css.includes(expectedClass)) {
      score -= 2;
      issues.push(`expected class ${expectedClass} not present`);
    }
  }

  // Keyframe prefix check (if @keyframes present)
  const kfMatches = css.match(/@keyframes\s+([\w-]+)/g) || [];
  for (const kf of kfMatches) {
    const name = kf.replace(/@keyframes\s+/, "");
    if (!name.startsWith("roy-")) {
      score -= 1;
      issues.push(`keyframe '${name}' is not prefixed 'roy-'`);
    }
  }

  // TODO / placeholder
  if (/\/\*\s*TODO/.test(css) || /\/\*\s*placeholder/i.test(css)) {
    score -= 4;
    issues.push("css contains a TODO or placeholder comment");
  }

  // Verify previewType contract: text effects should style text-ish selectors
  if (effect.previewType === "text") {
    if (!/\bcolor\b|\bbackground-clip\b|\btext-shadow\b|\b-webkit-text/i.test(css)) {
      score -= 1;
      issues.push("text previewType but no text-targeting CSS");
    }
  }

  score = Math.max(0, Math.min(10, score));
  return {
    score,
    reasoning: issues.length ? issues.join("; ") : "css parses, class matches id, keyframes prefixed",
  };
}

function scoreCompleteness(effect: CSSEffect): {
  score: number;
  reasoning: string;
} {
  const issues: string[] = [];
  let score = 10;

  // Name checks
  const nameWords = effect.name.trim().split(/\s+/).length;
  if (effect.name.length < 3) {
    score -= 3;
    issues.push("name too short");
  } else if (nameWords < 2 && effect.name.length > 3) {
    // Single-word names are OK if well-known (Shake, Jello) but flag.
    score -= 1;
    issues.push("single-word name");
  }
  if (effect.name.length > 36) {
    score -= 1;
    issues.push("name > 36 chars");
  }

  // Description checks
  const descLen = effect.description.length;
  if (descLen < 20) {
    score -= 5;
    issues.push(`description < 20 chars (${descLen})`);
  } else if (descLen < 40) {
    score -= 2;
    issues.push(`description < 40 chars (${descLen})`);
  }
  // Generic template: "A X effect" or "An X effect"
  if (/^(an?|the)\s+\S+\s+effect\.?$/i.test(effect.description.trim())) {
    score -= 3;
    issues.push("generic 'A X effect' template description");
  }

  // Tags
  if (effect.tags.length < 2) {
    score -= 3;
    issues.push(`only ${effect.tags.length} tags`);
  } else if (effect.tags.length < 3) {
    score -= 1;
    issues.push("only 2 tags");
  }

  // Id-mirror tags
  const idMirrorCount = effect.tags.filter((t) => {
    const tl = t.toLowerCase();
    return (
      tl === effect.id ||
      effect.id.toLowerCase().includes(tl) && tl.length > 4
    );
  }).length;
  if (idMirrorCount > 0) {
    score -= 1;
    issues.push(`${idMirrorCount} id-mirror tag(s)`);
  }

  // previewType alignment with category
  const expectedPt = CATEGORY_DEFINITIONS[effect.category].previewType;
  if (expectedPt && effect.previewType !== expectedPt) {
    // Allow some slack: backgrounds can be 'background' or 'box'
    const lax: Record<string, Set<CSSEffect["previewType"]>> = {
      animations: new Set(["box", "text", "background", "card"]),
      hover: new Set(["box", "text", "button", "card"]),
      visual: new Set(["box", "background", "text"]),
      misc: new Set(["box", "background", "text", "card"]),
    };
    const allowed = lax[effect.category];
    if (!allowed || !allowed.has(effect.previewType)) {
      score -= 1;
      issues.push(
        `previewType '${effect.previewType}' doesn't match category default '${expectedPt}'`,
      );
    }
  }

  score = Math.max(0, Math.min(10, score));
  return {
    score,
    reasoning: issues.length ? issues.join("; ") : "name, description, tags all complete",
  };
}

function scorePerformance(effect: CSSEffect): {
  score: number;
  reasoning: string;
} {
  const css = effect.cssCode;
  const issues: string[] = [];
  let score = 10;

  // Size
  const len = css.length;
  if (len > 30000) {
    score -= 8;
    issues.push(`css ${len} chars > 30KB`);
  } else if (len > 12000) {
    score -= 5;
    issues.push(`css ${len} chars > 12KB`);
  } else if (len > 6000) {
    score -= 3;
    issues.push(`css ${len} chars > 6KB`);
  } else if (len > 2000) {
    score -= 1;
    issues.push(`css ${len} chars > 2KB`);
  }

  // Keyframe count
  const kfCount = (css.match(/@keyframes/g) || []).length;
  if (kfCount > 5) {
    score -= 2;
    issues.push(`${kfCount} @keyframes blocks`);
  } else if (kfCount > 3) {
    score -= 1;
    issues.push(`${kfCount} @keyframes blocks`);
  }

  // Paint-heavy animations: box-shadow or border-radius inside @keyframes
  const kfBlocks = css.match(/@keyframes[^{]*\{[^@]*?\}\s*\}/g) || [];
  let paintHeavy = false;
  for (const block of kfBlocks) {
    if (/box-shadow|border-radius|border-color|background-color/i.test(block)) {
      paintHeavy = true;
      break;
    }
  }
  if (paintHeavy) {
    score -= 2;
    issues.push("animates paint-heavy property (box-shadow/border-radius)");
  }

  // Filter animation
  if (/@keyframes[^{]*\{[^@]*filter\s*:/.test(css)) {
    score -= 1;
    issues.push("animates filter");
  }

  // Universal selector
  if (/^\s*\*\s*\{/m.test(css) || /\,\s*\*\s*\{/.test(css)) {
    score -= 3;
    issues.push("uses universal * selector");
  }

  // position: fixed
  if (/position\s*:\s*fixed/i.test(css)) {
    score -= 1;
    issues.push("uses position: fixed");
  }

  score = Math.max(0, Math.min(10, score));
  return {
    score,
    reasoning: issues.length ? issues.join("; ") : `css ${len} chars, ${kfCount} keyframes, transform/opacity-friendly`,
  };
}

function scoreAccessibility(effect: CSSEffect): {
  score: number;
  reasoning: string;
} {
  const css = effect.cssCode;
  const issues: string[] = [];
  let score = 10;

  const hasAnimation = /@keyframes|animation\s*:|transition\s*:/.test(css);
  const hasReducedMotion = /prefers-reduced-motion/i.test(css);

  if (hasAnimation && !hasReducedMotion) {
    score -= 3;
    issues.push("animation present, no prefers-reduced-motion guard");
  } else if (hasAnimation && hasReducedMotion) {
    issues.push("animation present, reduced-motion guard included");
  }

  // Strobe risk: animation duration ≤ 333ms with opacity animation
  const animDurations = css.match(/animation\s*:[^;]+;/g) || [];
  for (const anim of animDurations) {
    const durMatch = anim.match(/(\d*\.?\d+)\s*(ms|s)/i);
    if (!durMatch) continue;
    const dur =
      durMatch[2].toLowerCase() === "ms"
        ? parseFloat(durMatch[1])
        : parseFloat(durMatch[1]) * 1000;
    if (dur < 333 && dur > 0) {
      // Check if the animation involves opacity/brightness changes
      const kfName = anim.match(/roy-[\w-]+/);
      if (kfName) {
        const kfBlock = css.match(
          new RegExp(`@keyframes\\s+${kfName[0]}[^{]*\\{[^@]*?\\}\\s*\\}`),
        );
        if (kfBlock && /opacity|brightness|filter/i.test(kfBlock[0])) {
          score -= 5;
          issues.push(`potential strobe risk: ${dur}ms animation with opacity/brightness changes (WCAG 2.3.1)`);
          break;
        }
      }
    }
  }

  // Text readability: opacity < 0.5 on text-ish selectors
  if (effect.previewType === "text") {
    if (/opacity\s*:\s*0?\.[0-4]/.test(css)) {
      score -= 2;
      issues.push("opacity < 0.5 on text preview");
    }
  }

  // display: none on text content (could hide from screen readers)
  if (/display\s*:\s*none/.test(css) && effect.previewType === "text") {
    score -= 2;
    issues.push("display: none may hide text from screen readers");
  }

  // Skip link / sr-only effects get a bonus
  if (effect.id.includes("skip-link") || effect.id.includes("sr-only")) {
    score = 10;
    issues.length = 0;
    issues.push("accessibility-pattern effect (skip-link/sr-only)");
  }

  score = Math.max(0, Math.min(10, score));
  return {
    score,
    reasoning: issues.length ? issues.join("; ") : "no animation or has reduced-motion guard",
  };
}

// ═══════════════════════════════════════════════════════════════════
// Internal: similarity helpers
// ═══════════════════════════════════════════════════════════════════

/** Levenshtein distance, iterative DP. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  for (let i = 0; i <= b.length; i++) prev[i] = i;
  for (let i = 1; i <= a.length; i++) {
    const curr = new Array(b.length + 1);
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/** Name similarity in [0, 1]: 1 - levenshtein / max(len). */
export function nameSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/** Normalize CSS for token-set comparison: strip comments, collapse whitespace, lowercase. */
export function normalizeCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, " ") // strip /* */ comments
    .replace(/\/\/.*$/gm, " ") // strip // comments (defensive)
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/** Jaccard similarity between two token sets, in [0, 1]. */
export function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  // Iterate the smaller set
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const t of small) if (large.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return intersection / union;
}

// ═══════════════════════════════════════════════════════════════════
// Miscategorization detection
// ═══════════════════════════════════════════════════════════════════

export interface MiscategorizationFinding {
  effectId: string;
  name: string;
  declaredCategory: EffectCategory;
  suggestedCategory: EffectCategory;
  confidence: number;
  reason: string;
}

/**
 * For each effect, score alignment between its declared category and
 * the categories its name/tags suggest. Flag when a non-declared category
 * scores ≥ 1.5× the declared category's score.
 *
 * Id-prefix trust: if the effect's id starts with a category signature
 * prefix (e.g. `hover-`, `text-`, `bg-`, `loader-`, `card-`, `btn-`,
 * `nav-`, `micro-`, `vis-`, `border-`, `filter-`, `cursor-`, `page-`,
 * `glass-`, `particles-`, `scroll-`, `anim-`), the declared category gets
 * a +5 bonus. This prevents over-flagging effects that are correctly
 * categorized by their id prefix but whose names happen to mention
 * sibling-category keywords (e.g. `hover-zoom-blur` is a hover effect
 * that uses blur, not a filter effect).
 */
export function findMiscategorized(
  effects: CSSEffect[],
): MiscategorizationFinding[] {
  // Map id-prefix → category (declared category gets a bonus when id matches).
  const prefixToCategory: { prefix: string; category: EffectCategory }[] = [
    { prefix: "hover-", category: "hover" },
    { prefix: "text-", category: "text" },
    { prefix: "bg-", category: "backgrounds" },
    { prefix: "background-", category: "backgrounds" },
    { prefix: "loader-", category: "loaders" },
    { prefix: "card-", category: "cards" },
    { prefix: "btn-", category: "buttons" },
    { prefix: "button-", category: "buttons" },
    { prefix: "border-", category: "borders" },
    { prefix: "filter-", category: "filters" },
    { prefix: "form-", category: "forms" },
    { prefix: "input-", category: "forms" },
    { prefix: "nav-", category: "navigation" },
    { prefix: "menu-", category: "navigation" },
    { prefix: "tab-", category: "navigation" },
    { prefix: "scroll-", category: "scroll" },
    { prefix: "cursor-", category: "cursor" },
    { prefix: "page-", category: "page-transitions" },
    { prefix: "glass-", category: "glass-ui" },
    { prefix: "particles-", category: "particles" },
    { prefix: "particle-", category: "particles" },
    { prefix: "micro-", category: "microinteractions" },
    { prefix: "vis-", category: "visual" },
    { prefix: "anim-", category: "animations" },
    { prefix: "3d-", category: "3d-transforms" },
    { prefix: "misc-", category: "misc" },
  ];

  const findings: MiscategorizationFinding[] = [];
  for (const effect of effects) {
    const nameLower = effect.name.toLowerCase();
    const idLower = effect.id.toLowerCase();
    const tagsLower = effect.tags.map((t) => t.toLowerCase());

    const categoryScores: Record<string, number> = {};
    for (const def of Object.values(CATEGORY_DEFINITIONS)) {
      let score = 0;
      for (const kw of def.keywords) {
        if (nameLower.includes(kw)) score += 2;
        if (idLower.includes(kw)) score += 1;
        for (const t of tagsLower) if (t.includes(kw)) score += 1;
      }
      categoryScores[def.category] = score;
    }

    // Id-prefix trust: declared category gets a +5 bonus when the id starts
    // with its signature prefix.
    const declared = effect.category;
    for (const { prefix, category } of prefixToCategory) {
      if (idLower.startsWith(prefix) && category === declared) {
        categoryScores[declared] = (categoryScores[declared] ?? 0) + 5;
        break;
      }
    }

    const declaredScore = categoryScores[declared] ?? 0;
    let best: { cat: string; score: number } | null = null;
    for (const [cat, sc] of Object.entries(categoryScores)) {
      if (cat === declared) continue;
      if (!best || sc > best.score) best = { cat, score: sc };
    }
    // Only flag if the suggested category clearly dominates: score ≥ 4 AND
    // ≥ 2× the declared score (after the id-prefix bonus).
    if (best && best.score >= 4 && best.score >= declaredScore * 2) {
      findings.push({
        effectId: effect.id,
        name: effect.name,
        declaredCategory: declared,
        suggestedCategory: best.cat as EffectCategory,
        confidence: Number(
          (best.score / Math.max(1, declaredScore)).toFixed(2),
        ),
        reason: `keywords suggest '${best.cat}' (score ${best.score}) over '${declared}' (score ${declaredScore})`,
      });
    }
  }
  return findings;
}

// ═══════════════════════════════════════════════════════════════════
// Tier helper
// ═══════════════════════════════════════════════════════════════════

export function tierForScore(overall: number): "A" | "B" | "C" | "D" {
  if (overall >= 8) return "A";
  if (overall >= 6) return "B";
  if (overall >= 4) return "C";
  return "D";
}
