/**
 * design-tokens.ts
 *
 * Central design-token architecture for RoyCSS. Defines 12 token categories
 * using modern CSS values (OKLCH for color, fluid clamp() for typography,
 * color-mix() for shadows) and provides three export formats:
 *
 *   - generateCSSVariables()  → a single `:root { ... }` CSS string
 *   - generateJSONTokens()    → a structured JSON object (Style Dictionary compatible)
 *   - generateTailwindConfig()→ a `theme.extend` JS object for Tailwind v3/v4
 *
 * The 12 categories: color, typography, spacing, radius, shadow, border,
 * opacity, elevation, motion, breakpoint, container, zIndex.
 */

export type TokenValue = string | number;
export type TokenGroup = Record<string, TokenValue>;

export interface TokenCategory {
  /** Category id (also used as the Tailwind namespace). */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Optional short description shown in docs / tooling. */
  description?: string;
  /** The actual token → value map. */
  tokens: TokenGroup;
}

/* ─── 1. Color tokens (OKLCH) ──────────────────────────────── */
const color: TokenCategory = {
  id: "color",
  label: "Color",
  description: "OKLCH-based perceptual color palette.",
  tokens: {
    primary: "oklch(0.69 0.17 162.48)",
    "primary-soft": "oklch(0.85 0.12 162.48)",
    "primary-contrast": "oklch(0.18 0.02 162.48)",
    accent: "oklch(0.72 0.15 200)",
    "accent-soft": "oklch(0.86 0.10 200)",
    success: "oklch(0.72 0.18 150)",
    warning: "oklch(0.80 0.17 75)",
    danger: "oklch(0.62 0.22 25)",
    info: "oklch(0.70 0.14 240)",
    background: "oklch(0.16 0.01 240)",
    surface: "oklch(0.20 0.02 240)",
    "surface-raised": "oklch(0.24 0.02 240)",
    foreground: "oklch(0.96 0.01 240)",
    muted: "oklch(0.65 0.02 240)",
    border: "oklch(0.30 0.02 240)",
  },
};

/* ─── 2. Typography tokens (fluid clamp) ───────────────────── */
const typography: TokenCategory = {
  id: "typography",
  label: "Typography",
  description: "Fluid type scale using clamp() for responsive sizing.",
  tokens: {
    "font-sans": "var(--font-geist-sans), system-ui, sans-serif",
    "font-mono": "var(--font-geist-mono), monospace",
    "font-display": "var(--font-display), system-ui, sans-serif",
    "text-xs": "clamp(0.69rem, 0.66rem + 0.15vw, 0.75rem)",
    "text-sm": "clamp(0.83rem, 0.80rem + 0.15vw, 0.88rem)",
    "text-base": "clamp(0.95rem, 0.90rem + 0.25vw, 1rem)",
    "text-lg": "clamp(1.08rem, 1.02rem + 0.30vw, 1.13rem)",
    "text-xl": "clamp(1.20rem, 1.10rem + 0.50vw, 1.30rem)",
    "text-2xl": "clamp(1.40rem, 1.25rem + 0.75vw, 1.60rem)",
    "text-3xl": "clamp(1.70rem, 1.50rem + 1.00vw, 2.05rem)",
    "text-4xl": "clamp(2.10rem, 1.80rem + 1.50vw, 2.60rem)",
    "text-5xl": "clamp(2.60rem, 2.20rem + 2.00vw, 3.30rem)",
    "leading-tight": "1.15",
    "leading-normal": "1.55",
    "leading-relaxed": "1.75",
    "tracking-tight": "-0.02em",
    "tracking-normal": "0",
    "tracking-wide": "0.05em",
  },
};

/* ─── 3. Spacing tokens ────────────────────────────────────── */
const spacing: TokenCategory = {
  id: "spacing",
  label: "Spacing",
  description: "4px-based spacing scale.",
  tokens: {
    "space-0": "0",
    "space-1": "0.25rem",
    "space-2": "0.5rem",
    "space-3": "0.75rem",
    "space-4": "1rem",
    "space-5": "1.25rem",
    "space-6": "1.5rem",
    "space-8": "2rem",
    "space-10": "2.5rem",
    "space-12": "3rem",
    "space-16": "4rem",
    "space-20": "5rem",
    "space-24": "6rem",
    "space-32": "8rem",
  },
};

/* ─── 4. Radius tokens ─────────────────────────────────────── */
const radius: TokenCategory = {
  id: "radius",
  label: "Radius",
  description: "Corner radii from sharp to pill.",
  tokens: {
    "radius-none": "0",
    "radius-sm": "0.25rem",
    "radius-md": "0.5rem",
    "radius-lg": "0.75rem",
    "radius-xl": "1rem",
    "radius-2xl": "1.5rem",
    "radius-3xl": "2rem",
    "radius-full": "9999px",
  },
};

/* ─── 5. Shadow tokens (color-mix) ─────────────────────────── */
const shadow: TokenCategory = {
  id: "shadow",
  label: "Shadow",
  description: "Layered shadows using color-mix() for tinted ambient light.",
  tokens: {
    "shadow-none": "none",
    "shadow-sm":
      "0 1px 2px color-mix(in oklch, var(--roy-color-primary) 8%, transparent)",
    "shadow-md":
      "0 4px 12px color-mix(in oklch, var(--roy-color-primary) 12%, transparent), 0 1px 2px color-mix(in oklch, var(--roy-color-primary) 8%, transparent)",
    "shadow-lg":
      "0 12px 28px color-mix(in oklch, var(--roy-color-primary) 18%, transparent), 0 4px 8px color-mix(in oklch, var(--roy-color-primary) 12%, transparent)",
    "shadow-xl":
      "0 24px 48px color-mix(in oklch, var(--roy-color-primary) 22%, transparent), 0 8px 16px color-mix(in oklch, var(--roy-color-primary) 14%, transparent)",
    "shadow-2xl":
      "0 40px 80px color-mix(in oklch, var(--roy-color-primary) 28%, transparent), 0 12px 24px color-mix(in oklch, var(--roy-color-primary) 16%, transparent)",
    "shadow-inner": "inset 0 2px 6px color-mix(in oklch, var(--roy-color-primary) 10%, transparent)",
  },
};

/* ─── 6. Border tokens ─────────────────────────────────────── */
const border: TokenCategory = {
  id: "border",
  label: "Border",
  description: "Border widths and styles.",
  tokens: {
    "border-width-0": "0",
    "border-width-1": "1px",
    "border-width-2": "2px",
    "border-width-4": "4px",
    "border-width-8": "8px",
    "border-style-solid": "solid",
    "border-style-dashed": "dashed",
    "border-style-dotted": "dotted",
    "border-style-none": "none",
  },
};

/* ─── 7. Opacity tokens ────────────────────────────────────── */
const opacity: TokenCategory = {
  id: "opacity",
  label: "Opacity",
  description: "Discrete opacity steps.",
  tokens: {
    "opacity-0": "0",
    "opacity-25": "0.25",
    "opacity-50": "0.5",
    "opacity-75": "0.75",
    "opacity-90": "0.9",
    "opacity-100": "1",
  },
};

/* ─── 8. Elevation tokens ──────────────────────────────────── */
const elevation: TokenCategory = {
  id: "elevation",
  label: "Elevation",
  description: "Semantic surface elevation tiers (z + shadow combo).",
  tokens: {
    "elevation-flat": "0",
    "elevation-raised": "1",
    "elevation-overlay": "2",
    "elevation-sticky": "3",
    "elevation-fixed": "4",
    "elevation-modal": "5",
    "elevation-popover": "6",
  },
};

/* ─── 9. Motion tokens ─────────────────────────────────────── */
const motion: TokenCategory = {
  id: "motion",
  label: "Motion",
  description: "Spring easing curves + duration scale (mirrors RoyMotion).",
  tokens: {
    "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
    "ease-spring-soft": "cubic-bezier(0.25, 1.2, 0.5, 1)",
    "ease-spring-snappy": "cubic-bezier(0.5, 1.65, 0.5, 1)",
    "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
    "ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
    "ease-linear": "linear",
    "dur-instant": "120ms",
    "dur-fast": "200ms",
    "dur-normal": "400ms",
    "dur-slow": "700ms",
    "dur-slower": "1100ms",
  },
};

/* ─── 10. Breakpoint tokens ────────────────────────────────── */
const breakpoint: TokenCategory = {
  id: "breakpoint",
  label: "Breakpoint",
  description: "Mobile-first responsive breakpoints.",
  tokens: {
    "bp-xs": "30rem", // 480px
    "bp-sm": "40rem", // 640px
    "bp-md": "48rem", // 768px
    "bp-lg": "64rem", // 1024px
    "bp-xl": "80rem", // 1280px
    "bp-2xl": "96rem", // 1536px
  },
};

/* ─── 11. Container tokens ─────────────────────────────────── */
const container: TokenCategory = {
  id: "container",
  label: "Container",
  description: "Max-widths for content containers.",
  tokens: {
    "container-xs": "20rem",
    "container-sm": "24rem",
    "container-md": "28rem",
    "container-lg": "32rem",
    "container-xl": "36rem",
    "container-2xl": "42rem",
    "container-3xl": "48rem",
    "container-4xl": "56rem",
    "container-5xl": "64rem",
    "container-6xl": "72rem",
    "container-7xl": "80rem",
    "container-prose": "65ch",
  },
};

/* ─── 12. Z-index tokens ───────────────────────────────────── */
const zIndex: TokenCategory = {
  id: "zIndex",
  label: "Z-index",
  description: "Semantic stacking order.",
  tokens: {
    "z-base": "0",
    "z-decor": "10",
    "z-dropdown": "1000",
    "z-sticky": "1100",
    "z-banner": "1200",
    "z-overlay": "1300",
    "z-modal": "1400",
    "z-popover": "1500",
    "z-tooltip": "1600",
    "z-toast": "1700",
    "z-max": "2147483647",
  },
};

/* ─── All categories ───────────────────────────────────────── */
export const designTokens: TokenCategory[] = [
  color,
  typography,
  spacing,
  radius,
  shadow,
  border,
  opacity,
  elevation,
  motion,
  breakpoint,
  container,
  zIndex,
];

/* ─── Helpers ──────────────────────────────────────────────── */

/**
 * Maps a category id to a CSS custom property prefix. E.g. "color" → "--roy-color-",
 * "typography" → "--roy-typography-", etc.
 */
function cssPrefixFor(categoryId: string): string {
  return `--roy-${categoryId}-`;
}

/**
 * Generates a single `:root { ... }` CSS string containing every token as a
 * custom property. Useful for a global stylesheet.
 */
export function generateCSSVariables(): string {
  const lines: string[] = [":root {"];
  for (const cat of designTokens) {
    lines.push(`  /* ${cat.label}${cat.description ? ` — ${cat.description}` : ""} */`);
    for (const [name, value] of Object.entries(cat.tokens)) {
      lines.push(`  ${cssPrefixFor(cat.id)}${name}: ${value};`);
    }
    lines.push("");
  }
  lines.push("}");
  return lines.join("\n");
}

/**
 * Generates a structured JSON representation suitable for the
 * Style Dictionary / Token Studio format.
 */
export function generateJSONTokens(): Record<string, Record<string, { value: TokenValue; type: string }>> {
  const typeForCategory: Record<string, string> = {
    color: "color",
    typography: "dimension",
    spacing: "dimension",
    radius: "dimension",
    shadow: "shadow",
    border: "border",
    opacity: "opacity",
    elevation: "number",
    motion: "other",
    breakpoint: "dimension",
    container: "dimension",
    zIndex: "number",
  };

  const out: Record<string, Record<string, { value: TokenValue; type: string }>> = {};
  for (const cat of designTokens) {
    out[cat.id] = {};
    const type = typeForCategory[cat.id] ?? "other";
    for (const [name, value] of Object.entries(cat.tokens)) {
      out[cat.id][name] = { value, type };
    }
  }
  return out;
}

/**
 * Generates a Tailwind theme.extend configuration object. Keys are mapped to
 * the closest Tailwind namespace (e.g. `color` → `colors`, `radius` →
 * `borderRadius`, `shadow` → `boxShadow`).
 */
export function generateTailwindConfig(): Record<string, Record<string, string>> {
  const tailwindKeys: Record<string, string> = {
    color: "colors",
    typography: "fontSize",
    spacing: "spacing",
    radius: "borderRadius",
    shadow: "boxShadow",
    border: "borderWidth",
    opacity: "opacity",
    elevation: "zIndex",
    motion: "transitionTimingFunction",
    breakpoint: "screens",
    container: "maxWidth",
    zIndex: "zIndex",
  };

  const config: Record<string, Record<string, string>> = {};
  for (const cat of designTokens) {
    const ns = tailwindKeys[cat.id] ?? cat.id;
    // Strip the redundant category prefix for Tailwind to keep names clean.
    // E.g. "space-4" → "4", "radius-md" → "md", "color-primary" → "primary".
    const stripped: Record<string, string> = {};
    const stripPrefix = `${cat.id}-`;
    for (const [name, value] of Object.entries(cat.tokens)) {
      const clean = name.startsWith(stripPrefix)
        ? name.slice(stripPrefix.length)
        : name;
      stripped[clean] = `var(${cssPrefixFor(cat.id)}${name})`;
    }
    config[ns] = stripped;
  }
  return config;
}
