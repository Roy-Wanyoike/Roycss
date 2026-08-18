"use client";

/**
 * ThemeSystem — a production-ready theme system showcase.
 *
 * Self-contained (no props). Ships 10 production-ready OKLCH theme presets,
 * a clickable theme-selector grid with preview swatches, a live preview
 * rendered entirely via scoped inline CSS variables (no global state
 * pollution), a "Copy CSS variables" exporter, and an optional side-by-side
 * comparison mode.
 *
 * Design notes
 *   • Every theme declares the full RoyCSS semantic token set as OKLCH
 *     strings — no `any`, no `as const` leakage. The exported `:root` block
 *     is built from the same typed source of truth the preview reads from.
 *   • The live preview is scoped: the theme tokens are injected as inline
 *     `style` on a wrapper `<div>` so descendants resolve `var(--primary)`
 *     against the selected theme without leaking to `document.documentElement`
 *     (no global side effects — safe to mount several instances side by side,
 *     which the comparison view relies on).
 *   • Copy uses the async Clipboard API with a fallback to a hidden
 *     `<textarea>` + `execCommand("copy")` for older browsers / insecure
 *     contexts. The button surfaces a transient "Copied!" affordance.
 *   • SSR-safe: no `window`/`navigator` access during render. Clipboard calls
 *     only happen inside event handlers.
 */

import * as React from "react";
import {
  CheckIcon,
  CopyIcon,
  GitCompareIcon,
  LayoutGridIcon,
  PaletteIcon,
  TypeIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

/**
 * Full RoyCSS semantic token set, expressed as OKLCH strings.
 * Every value is a single source of truth consumed by the preview, the
 * swatch dots, and the exported `:root` CSS block.
 */
interface ThemePalette {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  /** Ring + input border — used by the live preview's <input>. */
  ring: string;
  input: string;
  /** Surface tone for cards (used by the live preview). */
  card: string;
  cardForeground: string;
}

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  /** Industry / vertical tag (rendered as a label). */
  vertical: string;
  palette: ThemePalette;
}

type Mode = "single" | "compare";

/** Which side of the compare view is the active click target. */
type CompareTarget = "a" | "b";

// ═══════════════════════════════════════════════════════════════════════
// Theme presets — 10 production-ready palettes
// All colors are OKLCH strings. NO indigo/blue (Material uses teal instead).
// ═══════════════════════════════════════════════════════════════════════

const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: "emerald-default",
    name: "Emerald Default",
    description:
      "The canonical RoyCSS theme — calm emerald on warm paper white.",
    vertical: "Default",
    palette: {
      primary: "oklch(0.55 0.13 165)",
      primaryForeground: "oklch(0.99 0.005 165)",
      secondary: "oklch(0.96 0.01 165)",
      secondaryForeground: "oklch(0.25 0.02 170)",
      accent: "oklch(0.93 0.04 165)",
      accentForeground: "oklch(0.25 0.04 170)",
      background: "oklch(0.99 0.005 165)",
      foreground: "oklch(0.18 0.02 170)",
      muted: "oklch(0.96 0.01 165)",
      mutedForeground: "oklch(0.5 0.02 170)",
      border: "oklch(0.9 0.01 165)",
      ring: "oklch(0.55 0.13 165)",
      input: "oklch(0.92 0.01 165)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.18 0.02 170)",
    },
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description:
      "Calming teal on clinical whites — clinical, trustworthy, restful.",
    vertical: "Healthcare",
    palette: {
      primary: "oklch(0.6 0.09 200)",
      primaryForeground: "oklch(0.99 0.01 200)",
      secondary: "oklch(0.96 0.015 200)",
      secondaryForeground: "oklch(0.3 0.03 200)",
      accent: "oklch(0.92 0.04 200)",
      accentForeground: "oklch(0.3 0.05 200)",
      background: "oklch(0.995 0.003 200)",
      foreground: "oklch(0.22 0.02 200)",
      muted: "oklch(0.96 0.012 200)",
      mutedForeground: "oklch(0.52 0.02 200)",
      border: "oklch(0.91 0.012 200)",
      ring: "oklch(0.6 0.09 200)",
      input: "oklch(0.93 0.012 200)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.22 0.02 200)",
    },
  },
  {
    id: "apple-material",
    name: "Apple Material",
    description:
      "Vibrant teal-driven Material system — energetic but disciplined.",
    vertical: "Material",
    palette: {
      primary: "oklch(0.62 0.15 195)",
      primaryForeground: "oklch(0.99 0.02 195)",
      secondary: "oklch(0.95 0.03 195)",
      secondaryForeground: "oklch(0.28 0.05 195)",
      accent: "oklch(0.88 0.07 195)",
      accentForeground: "oklch(0.25 0.06 195)",
      background: "oklch(0.985 0.005 195)",
      foreground: "oklch(0.2 0.02 200)",
      muted: "oklch(0.95 0.02 195)",
      mutedForeground: "oklch(0.5 0.025 195)",
      border: "oklch(0.9 0.018 195)",
      ring: "oklch(0.62 0.15 195)",
      input: "oklch(0.92 0.018 195)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.2 0.02 200)",
    },
  },
  {
    id: "banking",
    name: "Banking",
    description:
      "Deep emerald with a gold accent — trustworthy, premium, secure.",
    vertical: "Banking",
    palette: {
      primary: "oklch(0.42 0.11 165)",
      primaryForeground: "oklch(0.97 0.01 165)",
      secondary: "oklch(0.94 0.012 165)",
      secondaryForeground: "oklch(0.25 0.02 165)",
      accent: "oklch(0.74 0.14 85)",
      accentForeground: "oklch(0.22 0.04 85)",
      background: "oklch(0.985 0.006 165)",
      foreground: "oklch(0.2 0.025 165)",
      muted: "oklch(0.95 0.012 165)",
      mutedForeground: "oklch(0.48 0.02 165)",
      border: "oklch(0.9 0.015 165)",
      ring: "oklch(0.42 0.11 165)",
      input: "oklch(0.92 0.015 165)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.2 0.025 165)",
    },
  },
  {
    id: "corporate",
    name: "Corporate",
    description:
      "Slate base with emerald action color — professional, restrained.",
    vertical: "Enterprise",
    palette: {
      primary: "oklch(0.52 0.12 165)",
      primaryForeground: "oklch(0.99 0.005 165)",
      secondary: "oklch(0.93 0.015 250)",
      secondaryForeground: "oklch(0.28 0.03 250)",
      accent: "oklch(0.92 0.025 250)",
      accentForeground: "oklch(0.28 0.04 250)",
      background: "oklch(0.985 0.005 250)",
      foreground: "oklch(0.22 0.025 250)",
      muted: "oklch(0.95 0.012 250)",
      mutedForeground: "oklch(0.5 0.025 250)",
      border: "oklch(0.9 0.012 250)",
      ring: "oklch(0.52 0.12 165)",
      input: "oklch(0.92 0.012 250)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.22 0.025 250)",
    },
  },
  {
    id: "education",
    name: "Education",
    description:
      "Warm amber primary with an emerald action color — friendly, approachable.",
    vertical: "EdTech",
    palette: {
      primary: "oklch(0.7 0.15 75)",
      primaryForeground: "oklch(0.2 0.04 75)",
      secondary: "oklch(0.95 0.02 165)",
      secondaryForeground: "oklch(0.25 0.02 165)",
      accent: "oklch(0.9 0.05 75)",
      accentForeground: "oklch(0.25 0.05 75)",
      background: "oklch(0.99 0.008 75)",
      foreground: "oklch(0.22 0.025 75)",
      muted: "oklch(0.95 0.015 75)",
      mutedForeground: "oklch(0.5 0.025 75)",
      border: "oklch(0.9 0.015 75)",
      ring: "oklch(0.7 0.15 75)",
      input: "oklch(0.92 0.015 75)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.22 0.025 75)",
    },
  },
  {
    id: "gaming",
    name: "Gaming",
    description:
      "Neon emerald on near-black — high-energy, vibrant, immersive.",
    vertical: "Gaming",
    palette: {
      primary: "oklch(0.78 0.19 160)",
      primaryForeground: "oklch(0.18 0.04 160)",
      secondary: "oklch(0.28 0.04 165)",
      secondaryForeground: "oklch(0.92 0.04 165)",
      accent: "oklch(0.7 0.18 145)",
      accentForeground: "oklch(0.16 0.04 145)",
      background: "oklch(0.16 0.02 165)",
      foreground: "oklch(0.94 0.03 165)",
      muted: "oklch(0.24 0.025 165)",
      mutedForeground: "oklch(0.66 0.03 165)",
      border: "oklch(0.32 0.03 165)",
      ring: "oklch(0.78 0.19 160)",
      input: "oklch(0.3 0.03 165)",
      card: "oklch(0.2 0.025 165)",
      cardForeground: "oklch(0.94 0.03 165)",
    },
  },
  {
    id: "saas",
    name: "SaaS",
    description:
      "Clean, minimal emerald with cyan support — modern marketing surface.",
    vertical: "SaaS",
    palette: {
      primary: "oklch(0.55 0.13 165)",
      primaryForeground: "oklch(0.99 0.005 165)",
      secondary: "oklch(0.96 0.02 200)",
      secondaryForeground: "oklch(0.28 0.03 200)",
      accent: "oklch(0.88 0.08 200)",
      accentForeground: "oklch(0.22 0.04 200)",
      background: "oklch(0.995 0.003 165)",
      foreground: "oklch(0.2 0.02 165)",
      muted: "oklch(0.96 0.012 165)",
      mutedForeground: "oklch(0.5 0.02 165)",
      border: "oklch(0.91 0.012 165)",
      ring: "oklch(0.55 0.13 165)",
      input: "oklch(0.93 0.012 165)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.2 0.02 165)",
    },
  },
  {
    id: "dashboard",
    name: "Dashboard",
    description:
      "Dark-first, high-contrast — designed for long analytic sessions.",
    vertical: "Analytics",
    palette: {
      primary: "oklch(0.75 0.16 165)",
      primaryForeground: "oklch(0.16 0.03 165)",
      secondary: "oklch(0.3 0.025 165)",
      secondaryForeground: "oklch(0.92 0.03 165)",
      accent: "oklch(0.7 0.12 145)",
      accentForeground: "oklch(0.14 0.03 145)",
      background: "oklch(0.19 0.018 165)",
      foreground: "oklch(0.95 0.02 165)",
      muted: "oklch(0.26 0.02 165)",
      mutedForeground: "oklch(0.68 0.025 165)",
      border: "oklch(0.33 0.025 165)",
      ring: "oklch(0.75 0.16 165)",
      input: "oklch(0.3 0.025 165)",
      card: "oklch(0.23 0.02 165)",
      cardForeground: "oklch(0.95 0.02 165)",
    },
  },
  {
    id: "fintech",
    name: "Fintech",
    description:
      "Emerald primary with amber data accent — data-focused, precise.",
    vertical: "Fintech",
    palette: {
      primary: "oklch(0.58 0.13 165)",
      primaryForeground: "oklch(0.99 0.005 165)",
      secondary: "oklch(0.95 0.015 85)",
      secondaryForeground: "oklch(0.26 0.03 85)",
      accent: "oklch(0.78 0.14 85)",
      accentForeground: "oklch(0.2 0.04 85)",
      background: "oklch(0.99 0.005 165)",
      foreground: "oklch(0.2 0.02 165)",
      muted: "oklch(0.95 0.012 165)",
      mutedForeground: "oklch(0.5 0.02 165)",
      border: "oklch(0.9 0.012 165)",
      ring: "oklch(0.58 0.13 165)",
      input: "oklch(0.92 0.012 165)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.2 0.02 165)",
    },
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Ordered list of palette keys that make up the swatch preview row. */
const SWATCH_KEYS = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
] as const;

type SwatchKey = (typeof SWATCH_KEYS)[number];

/** CSS variable name → palette key (used to build the exported :root block). */
const ROOT_VAR_ORDER: ReadonlyArray<readonly [string, keyof ThemePalette]> = [
  ["--background", "background"],
  ["--foreground", "foreground"],
  ["--card", "card"],
  ["--card-foreground", "cardForeground"],
  ["--primary", "primary"],
  ["--primary-foreground", "primaryForeground"],
  ["--secondary", "secondary"],
  ["--secondary-foreground", "secondaryForeground"],
  ["--accent", "accent"],
  ["--accent-foreground", "accentForeground"],
  ["--muted", "muted"],
  ["--muted-foreground", "mutedForeground"],
  ["--border", "border"],
  ["--input", "input"],
  ["--ring", "ring"],
] as const;

/** Build the `:root { ... }` CSS block for the selected theme. */
function buildRootBlock(theme: ThemePreset): string {
  const lines = ROOT_VAR_ORDER.map(
    ([varName, key]) => `  ${varName}: ${theme.palette[key]};`,
  );
  return `:root {\n${lines.join("\n")}\n}`;
}

/** Convert a ThemePalette into an inline-style object usable on a wrapper div. */
function paletteToCssVars(
  palette: ThemePalette,
): React.CSSProperties {
  // React.CSSProperties happily accepts custom properties as string keys.
  // Cast through `Record<string, string>` to satisfy TS without `any`.
  const vars: Record<string, string> = {
    "--background": palette.background,
    "--foreground": palette.foreground,
    "--card": palette.card,
    "--card-foreground": palette.cardForeground,
    "--primary": palette.primary,
    "--primary-foreground": palette.primaryForeground,
    "--secondary": palette.secondary,
    "--secondary-foreground": palette.secondaryForeground,
    "--accent": palette.accent,
    "--accent-foreground": palette.accentForeground,
    "--muted": palette.muted,
    "--muted-foreground": palette.mutedForeground,
    "--border": palette.border,
    "--input": palette.input,
    "--ring": palette.ring,
  };
  return vars as React.CSSProperties;
}

/** Sync clipboard write with a graceful legacy fallback. Resolves `false` on failure. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy path.
  }

  try {
    if (typeof document === "undefined") return false;
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface SwatchRowProps {
  palette: ThemePalette;
  size?: "sm" | "md";
}

/** Five-dot palette preview (primary, secondary, accent, bg, fg). */
function SwatchRow({ palette, size = "sm" }: SwatchRowProps): React.JSX.Element {
  const dot = size === "sm" ? "size-4" : "size-5";
  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label="Theme palette preview"
    >
      {SWATCH_KEYS.map((key) => (
        <span
          key={key}
          aria-hidden
          className={cn(
            "rounded-full ring-1 ring-black/5",
            dot,
            // For the "background" swatch, draw a faint border so light
            // colors remain visible against the card surface.
            key === "background" && "ring-black/10",
          )}
          style={{ backgroundColor: palette[key as SwatchKey] }}
        />
      ))}
    </div>
  );
}

interface ThemeCardProps {
  theme: ThemePreset;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** Clickable theme preset card. */
function ThemeCard({
  theme,
  selected,
  onSelect,
}: ThemeCardProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme.id)}
      aria-pressed={selected}
      aria-label={`Apply ${theme.name} theme`}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border p-3.5 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-accent/40 shadow-sm"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <SwatchRow palette={theme.palette} />
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            selected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {theme.vertical}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{theme.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {theme.description}
        </p>
      </div>
      {selected ? (
        <span
          aria-hidden
          className="absolute right-2.5 top-2.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <CheckIcon className="size-3" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

interface LivePreviewProps {
  theme: ThemePreset;
  /** Progress value (0–100) shown in the preview's progress bar. */
  progress: number;
  /** Heading text — usually the theme name. */
  heading?: string;
}

/**
 * Mini UI rendered entirely with the selected theme's tokens.
 * The tokens are injected as inline CSS vars on the root wrapper, so all
 * `var(--primary)` etc. resolve against the theme — no global leakage.
 */
function LivePreview({
  theme,
  progress,
  heading,
}: LivePreviewProps): React.JSX.Element {
  const title = heading ?? theme.name;
  const style = React.useMemo(
    () => paletteToCssVars(theme.palette),
    [theme.palette],
  );

  return (
    <div
      style={{
        ...style,
        border: "1px solid var(--border)",
      }}
      className="space-y-4 rounded-xl p-5"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex size-7 items-center justify-center rounded-md"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              <PaletteIcon className="size-4" />
            </span>
            <h3
              className="text-base font-semibold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              {title}
            </h3>
          </div>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            {theme.description}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--accent-foreground)",
          }}
        >
          {theme.vertical}
        </span>
      </div>

      {/* Body card */}
      <div
        className="rounded-lg p-4"
        style={{
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TypeIcon
              className="size-4"
              style={{ color: "var(--primary)" }}
            />
            <span className="text-sm font-medium">Account balance</span>
          </div>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: "var(--foreground)" }}
          >
            $48,250.00
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--muted-foreground)" }}>
              Monthly goal
            </span>
            <span
              className="font-medium tabular-nums"
              style={{ color: "var(--foreground)" }}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--muted)" }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label="Monthly goal progress"
          >
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                backgroundColor: "var(--primary)",
              }}
            />
          </div>
        </div>

        {/* Input + Buttons row */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <input
            type="email"
            placeholder="name@example.com"
            aria-label="Email address"
            className={cn(
              "h-9 min-w-0 flex-1 rounded-md px-3 text-sm outline-none",
              "focus-visible:ring-2 focus-visible:ring-offset-0",
            )}
            style={{
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--input)",
              // Inline var can't drive focus-visible pseudo-class; use the
              // ring var as a fallback solid border-color on focus via the
              // CSS-in-JS approach below (kept simple for preview).
              ["--tw-ring-color" as string]: "var(--ring)",
            }}
          />
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md px-3.5 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              ["--tw-ring-color" as string]: "var(--ring)",
            }}
          >
            Subscribe
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--secondary-foreground)",
              border: "1px solid var(--border)",
              ["--tw-ring-color" as string]: "var(--ring)",
            }}
          >
            Details
          </button>
        </div>

        {/* Badge row */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {["Active", "Verified", "Pro"].map((label) => (
            <span
              key={label}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
            >
              {label}
            </span>
          ))}
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            New
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════

export function ThemeSystem(): React.JSX.Element {
  const [selectedId, setSelectedId] = React.useState<string>(
    THEME_PRESETS[0].id,
  );
  const [compareId, setCompareId] = React.useState<string>(
    THEME_PRESETS[3].id,
  );
  const [mode, setMode] = React.useState<Mode>("single");
  const [compareTarget, setCompareTarget] =
    React.useState<CompareTarget>("b");
  const [copied, setCopied] = React.useState<boolean>(false);
  const [progress] = React.useState<number>(68);

  const selectedTheme = React.useMemo(
    () =>
      THEME_PRESETS.find((t) => t.id === selectedId) ?? THEME_PRESETS[0],
    [selectedId],
  );
  const compareTheme = React.useMemo(
    () =>
      THEME_PRESETS.find((t) => t.id === compareId) ?? THEME_PRESETS[0],
    [compareId],
  );

  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Clear any pending "Copied!" reset on unmount.
  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleSelect = React.useCallback(
    (id: string) => {
      if (mode === "single") {
        setSelectedId(id);
      } else if (compareTarget === "a") {
        setSelectedId(id);
      } else {
        setCompareId(id);
      }
    },
    [mode, compareTarget],
  );

  const handleModeChange = React.useCallback((next: Mode) => {
    setMode(next);
  }, []);

  const handleCompareTargetChange = React.useCallback(
    (next: CompareTarget) => {
      setCompareTarget(next);
    },
    [],
  );

  const handleCopy = React.useCallback(async () => {
    const block = buildRootBlock(selectedTheme);
    const ok = await copyToClipboard(block);
    if (ok) {
      setCopied(true);
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 1800);
    }
  }, [selectedTheme]);

  const cssBlock = React.useMemo(
    () => buildRootBlock(selectedTheme),
    [selectedTheme],
  );

  return (
    <section
      aria-label="Theme System"
      className="mx-auto w-full max-w-6xl px-1 py-2"
    >
      {/* ─── Header ───────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Theme System
        </h2>
        <p className="text-sm text-muted-foreground">
          10 production-ready OKLCH theme presets · live preview · CSS
          variable export · side-by-side comparison.
        </p>
      </div>

      {/* ─── Mode toggle + copy button ───────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Preview mode"
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "single"}
            onClick={() => handleModeChange("single")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "single"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGridIcon className="size-3.5" />
            Single
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "compare"}
            onClick={() => handleModeChange("compare")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "compare"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <GitCompareIcon className="size-3.5" />
            Compare
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border px-3.5 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            copied
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
          )}
          aria-live="polite"
        >
          {copied ? (
            <>
              <CheckIcon className="size-4" />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon className="size-4" />
              Copy CSS variables
            </>
          )}
        </button>
      </div>

      {/* ─── Compare-mode target selector ───────────────────── */}
      {mode === "compare" ? (
        <div className="mb-3 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Editing side:
          </span>
          <div
            role="tablist"
            aria-label="Editing target"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={compareTarget === "a"}
              onClick={() => handleCompareTargetChange("a")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                compareTarget === "a"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              A · {selectedTheme.name}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={compareTarget === "b"}
              onClick={() => handleCompareTargetChange("b")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                compareTarget === "b"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              B · {compareTheme.name}
            </button>
          </div>
        </div>
      ) : null}

      {/* ─── Theme selector grid ─────────────────────────────── */}
      <div
        role="group"
        aria-label="Theme presets"
        className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {THEME_PRESETS.map((theme) => {
          const isSelected = theme.id === selectedId;
          const isCompare = theme.id === compareId;
          const selected =
            mode === "single"
              ? isSelected
              : (compareTarget === "a" && isSelected) ||
                (compareTarget === "b" && isCompare) ||
                isSelected ||
                isCompare;
          return (
            <ThemeCard
              key={theme.id}
              theme={theme}
              selected={selected}
              onSelect={handleSelect}
            />
          );
        })}
      </div>

      {/* ─── Live preview area ───────────────────────────────── */}
      {mode === "single" ? (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <LivePreview
            theme={selectedTheme}
            progress={progress}
          />
          {/* CSS block panel */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <TypeIcon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  CSS variables
                </span>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                :root
              </span>
            </div>
            <pre
              className="max-h-[420px] overflow-auto px-4 py-3 text-xs leading-relaxed"
              aria-label="Generated CSS variables block"
            >
              <code className="font-mono text-foreground">{cssBlock}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                  compareTarget === "a"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                A
              </span>
              <span className="text-sm font-medium text-foreground">
                {selectedTheme.name}
              </span>
              {compareTarget === "a" ? (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  editing
                </span>
              ) : null}
            </div>
            <LivePreview
              theme={selectedTheme}
              progress={progress}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                  compareTarget === "b"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                B
              </span>
              <span className="text-sm font-medium text-foreground">
                {compareTheme.name}
              </span>
              {compareTarget === "b" ? (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  editing
                </span>
              ) : null}
            </div>
            <LivePreview
              theme={compareTheme}
              progress={progress}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default ThemeSystem;
