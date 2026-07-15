/**
 * RoyCSS Design Tokens
 * OKLCH-native color system with semantic naming.
 * All colors use oklch() for perceptual uniformity and wide gamut.
 */

export const tokens = {
  // ─── Colors (OKLCH) ─────────────────────────────────
  color: {
    // Brand
    primary: "oklch(0.697 0.155 162.48)",
    primaryDeep: "oklch(0.418 0.093 162.48)",
    primaryLight: "oklch(0.802 0.137 162.48)",
    secondary: "oklch(0.702 0.117 205.44)",
    accent: "oklch(0.606 0.234 283.17)",

    // Semantic
    success: "oklch(0.7 0.15 145)",
    warning: "oklch(0.75 0.15 75)",
    danger: "oklch(0.65 0.2 25)",
    info: "oklch(0.7 0.12 230)",

    // Surfaces
    background: "oklch(0.14 0.015 175)",
    surface: "oklch(0.18 0.02 175)",
    surfaceHover: "oklch(0.22 0.025 175)",
    border: "oklch(1 0 0 / 10%)",
    text: "oklch(0.96 0.005 165)",
    textMuted: "oklch(0.68 0.02 170)",

    // Light mode (via light-dark)
    backgroundLight: "oklch(0.99 0.005 165)",
    surfaceLight: "oklch(1 0 0)",
    textLight: "oklch(0.18 0.02 170)",
    textMutedLight: "oklch(0.5 0.02 170)",
    borderLight: "oklch(0.9 0.01 165)",
  },

  // ─── Spacing ────────────────────────────────────────
  spacing: {
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
  },

  // ─── Radius ─────────────────────────────────────────
  radius: {
    none: "0",
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem",
    full: "9999px",
  },

  // ─── Typography ─────────────────────────────────────
  typography: {
    fontFamily: {
      sans: "var(--font-geist-sans), system-ui, sans-serif",
      mono: "var(--font-geist-mono), monospace",
      display: "var(--font-display), var(--font-geist-sans), sans-serif",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },

  // ─── Shadows (OKLCH) ────────────────────────────────
  shadow: {
    sm: "0 1px 2px 0 oklch(0 0 0 / 0.05)",
    md: "0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px oklch(0 0 0 / 0.1), 0 8px 10px -6px oklch(0 0 0 / 0.1)",
    glow: "0 0 20px color-mix(in oklch, var(--roycss-primary) 30%, transparent)",
  },

  // ─── Transitions ────────────────────────────────────
  transition: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

export type TokenType = typeof tokens;
