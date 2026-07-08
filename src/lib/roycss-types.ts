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
  | "misc";

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
    icon: "Input",
    color: "lime",
    description: "Form input effects and validations",
  },
  navigation: {
    label: "Navigation",
    icon: "Navigation",
    color: "fuchsia",
    description: "Menu, tab, and navigation animations",
  },
  misc: {
    label: "Miscellaneous",
    icon: "Sparkle",
    color: "yellow",
    description: "Unique effects that defy categorization",
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
  "misc",
];
