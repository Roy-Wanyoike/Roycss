export type EffectCategory =
  | "animations"
  | "hover"
  | "text"
  | "backgrounds"
  | "loaders"
  | "3d-transforms"
  | "buttons"
  | "cards"
  | "borders"
  | "filters"
  | "forms"
  | "navigation"
  | "scroll"
  | "cursor"
  | "page-transitions"
  | "glass-ui"
  | "particles"
  | "microinteractions"
  | "visual"
  | "misc"
  | "physics"
  | "liquid"
  | "morphing"
  | "status-state"
  | "audio"
  | "retro"
  | "data-viz"
  | "immersive"
  | "advanced-text";

export type PreviewType =
  | "box"
  | "text"
  | "button"
  | "loader"
  | "card"
  | "background";

export interface CSSEffect {
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  tags: string[];
  cssCode: string;
  previewType: PreviewType;
  /** Number of child <span> elements to render inside the preview (for loaders etc.) */
  childCount?: number;
  /** Text to display for text/button previews. Defaults to "RoyCSS" or "Hover Me". */
  previewText?: string;
}

export const categoryMeta: Record<
  EffectCategory,
  { label: string; icon: string; color: string; description: string }
> = {
  animations: {
    label: "Animations",
    icon: "Play",
    color: "emerald",
    description: "Keyframe animations that bring elements to life",
  },
  hover: {
    label: "Hover Effects",
    icon: "MousePointer",
    color: "amber",
    description: "Interactive effects triggered on mouse hover",
  },
  text: {
    label: "Text Effects",
    icon: "Type",
    color: "rose",
    description: "Stunning text transformations and decorations",
  },
  backgrounds: {
    label: "Backgrounds",
    icon: "Layers",
    color: "violet",
    description: "Dynamic background patterns and gradients",
  },
  loaders: {
    label: "Loaders",
    icon: "Loader2",
    color: "sky",
    description: "Loading indicators and spinners",
  },
  "3d-transforms": {
    label: "3D & Transforms",
    icon: "Box",
    color: "orange",
    description: "Three-dimensional transformations and perspective effects",
  },
  buttons: {
    label: "Button Effects",
    icon: "MousePointerClick",
    color: "teal",
    description: "Interactive button animations and feedback",
  },
  cards: {
    label: "Card Effects",
    icon: "Square",
    color: "pink",
    description: "Card components with glass, borders, and reveals",
  },
  borders: {
    label: "Borders",
    icon: "Frame",
    color: "cyan",
    description: "Creative border styles and animated outlines",
  },
  filters: {
    label: "Filters",
    icon: "SlidersHorizontal",
    color: "indigo",
    description: "CSS filter effects for images and elements",
  },
  forms: {
    label: "Forms & Inputs",
    icon: "FormInput",
    color: "lime",
    description: "Form input effects and validations",
  },
  navigation: {
    label: "Navigation",
    icon: "Navigation",
    color: "fuchsia",
    description: "Menu, tab, and navigation animations",
  },
  scroll: {
    label: "Scroll Effects",
    icon: "ScrollText",
    color: "teal",
    description: "Scroll-triggered and scroll-linked animations",
  },
  cursor: {
    label: "Cursor Effects",
    icon: "MousePointer2",
    color: "rose",
    description: "Custom cursor and cursor-following effects",
  },
  "page-transitions": {
    label: "Page Transitions",
    icon: "ArrowLeftRight",
    color: "violet",
    description: "Full-page transition animations",
  },
  "glass-ui": {
    label: "Glass & Modern UI",
    icon: "GlassWater",
    color: "sky",
    description: "Glassmorphism, neumorphism, and modern surface effects",
  },
  particles: {
    label: "Particles",
    icon: "Sparkles",
    color: "amber",
    description: "Particle systems and environmental effects",
  },
  microinteractions: {
    label: "Microinteractions",
    icon: "ToggleRight",
    color: "emerald",
    description: "Small interactive component animations",
  },
  visual: {
    label: "Visual Effects",
    icon: "Wand2",
    color: "fuchsia",
    description: "Holographic, metallic, chrome, and advanced visual styles",
  },
  misc: {
    label: "Miscellaneous",
    icon: "Sparkle",
    color: "yellow",
    description: "Unique effects that defy categorization",
  },
  physics: {
    label: "Physics Motion",
    icon: "Atom",
    color: "emerald",
    description: "Physics-based motion: springs, elasticity, gravity, and inertia",
  },
  liquid: {
    label: "Liquid & Fluid",
    icon: "Droplets",
    color: "sky",
    description: "Liquid and fluid effects: waves, blobs, drips, and flowing fills",
  },
  morphing: {
    label: "Shape Morphing",
    icon: "Shapes",
    color: "fuchsia",
    description: "Shape-shifting effects: clip-path, border-radius, and form transitions",
  },
  "status-state": {
    label: "Status & State",
    icon: "Activity",
    color: "emerald",
    description: "Status indicators and state transitions: skeletons, success, error, loading, toggles",
  },
  audio: {
    label: "Audio-Reactive",
    icon: "Music",
    color: "violet",
    description: "Pure-CSS simulations of audio visuals: equalizers, waveforms, vinyl, ripples, VU meters",
  },
  retro: {
    label: "Retro & Nostalgic",
    icon: "Tv",
    color: "amber",
    description: "Retro effects: CRT, VHS, arcade neon, synthwave, cassette, and 8-bit aesthetics",
  },
  "data-viz": {
    label: "Data Visualization",
    icon: "BarChart3",
    color: "teal",
    description: "Data viz: rings, gauges, sparklines, bars, counters, and shimmer skeletons",
  },
  immersive: {
    label: "Immersive Backgrounds",
    icon: "Cloud",
    color: "cyan",
    description: "Ambient scene backgrounds: starfields, weather, fire, water, and particle fields",
  },
  "advanced-text": {
    label: "Advanced Text",
    icon: "Type",
    color: "amber",
    description: "Cinematic text treatments: typewriters, glitches, neon, kinetic motion, and gradient fills",
  },
};

export const categoryOrder: EffectCategory[] = [
  "animations",
  "hover",
  "text",
  "backgrounds",
  "loaders",
  "3d-transforms",
  "buttons",
  "cards",
  "borders",
  "filters",
  "forms",
  "navigation",
  "scroll",
  "cursor",
  "page-transitions",
  "glass-ui",
  "particles",
  "microinteractions",
  "visual",
  "misc",
  "physics",
  "liquid",
  "morphing",
  "status-state",
  "audio",
  "retro",
  "data-viz",
  "immersive",
  "advanced-text",
];
