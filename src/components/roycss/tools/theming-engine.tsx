"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Palette,
  Copy,
  Check,
  Sparkles,
  Download,
  Upload,
  Code2,
  FileJson,
  TriangleAlert,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * ThemingEngine — CSS Variables Theming Engine.
 *
 * Generates a complete design-token theme (12 OKLCH variables) from a single
 * primary color, with a live mini-UI preview, WCAG contrast checks for the
 * two most important foreground/background pairs, and three export formats
 * (CSS `:root` variables, JSON, Tailwind 4 `@theme` block). Themes can be
 * imported back from a JSON paste.
 *
 * Color math:
 *  - hex → linear sRGB (gamma decode) → XYZ (D65) → OKLab → OKLCH
 *    (Björn Ottosson's OK color space, https://bottosson.github.io/posts/oklab/)
 *  - WCAG relative luminance is computed from the linear sRGB triple, so we
 *    reuse the OKLCH → linear sRGB conversion.
 *  - Contrast ratio = (L_lighter + 0.05) / (L_darker + 0.05), in [1, 21].
 *
 * All 12 exported tokens derive their hue from the input primary. Lightness
 * and chroma are chosen to produce a usable light-theme palette: very light
 * backgrounds, very dark foregrounds, muted secondaries, and a saturated
 * destructive red (kept at a fixed hue of ~25° so it always reads as "stop").
 *
 * Constraints: TS strict, zero `any`, zero `console.log`. Semantic theme
 * tokens for chrome (bg-card, text-foreground, border-border, bg-primary,
 * text-primary, bg-muted, text-muted-foreground). Preview chrome overrides
 * --background / --foreground / --primary etc. locally via inline style.
 */

// ─── Types ────────────────────────────────────────────────────────────────

interface OklchColor {
  L: number;
  C: number;
  H: number;
}

type TokenKey =
  | "primary"
  | "secondary"
  | "accent"
  | "background"
  | "foreground"
  | "muted"
  | "muted-foreground"
  | "border"
  | "card"
  | "card-foreground"
  | "destructive"
  | "ring";

type Theme = Record<TokenKey, OklchColor>;

type ExportFormat = "css" | "json" | "tailwind";

type WcagBand = "AAA" | "AA" | "AALarge" | "Fail";

interface PresetMeta {
  key: string;
  label: string;
  hex: string;
  swatchClass: string;
}

// ─── Constants ────────────────────────────────────────────────────────────

const TOKEN_ORDER: TokenKey[] = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
  "muted",
  "muted-foreground",
  "border",
  "card",
  "card-foreground",
  "destructive",
  "ring",
];

const TOKEN_LABELS: Record<TokenKey, string> = {
  primary: "primary",
  secondary: "secondary",
  accent: "accent",
  background: "background",
  foreground: "foreground",
  muted: "muted",
  "muted-foreground": "muted-foreground",
  border: "border",
  card: "card",
  "card-foreground": "card-foreground",
  destructive: "destructive",
  ring: "ring",
};

const TOKEN_HINTS: Record<TokenKey, string> = {
  primary: "Brand color — buttons, links, focus rings",
  secondary: "Subtle buttons, secondary surfaces",
  accent: "Hover states, subtle highlights",
  background: "Page background",
  foreground: "Primary text color",
  muted: "Muted surfaces (cards in cards)",
  "muted-foreground": "Secondary / placeholder text",
  border: "Default border color",
  card: "Card surface",
  "card-foreground": "Text on card surface",
  destructive: "Error / delete actions",
  ring: "Focus ring color",
};

const PRESETS: PresetMeta[] = [
  {
    key: "emerald",
    label: "Emerald",
    hex: "#10b981",
    swatchClass: "bg-emerald-500",
  },
  {
    key: "rose",
    label: "Rose",
    hex: "#f43f5e",
    swatchClass: "bg-rose-500",
  },
  {
    key: "amber",
    label: "Amber",
    hex: "#f59e0b",
    swatchClass: "bg-amber-500",
  },
  {
    key: "cyan",
    label: "Cyan",
    hex: "#06b6d4",
    swatchClass: "bg-cyan-500",
  },
  {
    key: "violet",
    label: "Violet",
    hex: "#8b5cf6",
    swatchClass: "bg-violet-500",
  },
  {
    key: "slate",
    label: "Slate",
    hex: "#64748b",
    swatchClass: "bg-slate-500",
  },
];

const DEFAULT_PRIMARY_HEX = PRESETS[0]!.hex;
const DEFAULT_THEME_NAME = "roycss-theme";
const DESTRUCTIVE_HUE = 25; // OKLCH hue for destructive red

const COPY_CONFIRM_MS = 1500;

// ─── Color math: hex ↔ OKLCH ↔ linear sRGB ────────────────────────────────

const srgbToLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const linearToSrgb = (c: number): number => {
  const clamped = Math.max(0, Math.min(1, c));
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
};

const parseHex = (hex: string): [number, number, number] | null => {
  let h = hex.trim().replace(/^#/, "").toLowerCase();
  if (h.length === 3) {
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  } else if (h.length === 8) {
    h = h.slice(0, 6);
  }
  if (!/^[0-9a-f]{6}$/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

const toHexByte = (c: number): string => {
  const clamped = Math.max(0, Math.min(1, c));
  return Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
};

const srgbToHex = (r: number, g: number, b: number): string =>
  `#${toHexByte(linearToSrgb(r))}${toHexByte(linearToSrgb(g))}${toHexByte(linearToSrgb(b))}`;

/** linear sRGB (D65) → OKLab (Ottosson). */
const linearSrgbToOklab = (
  r: number,
  g: number,
  b: number,
): [number, number, number] => {
  const X = 0.412390799 * r + 0.357584339 * g + 0.180480788 * b;
  const Y = 0.212639006 * r + 0.715168679 * g + 0.072192315 * b;
  const Z = 0.019330819 * r + 0.11919478 * g + 0.950532152 * b;

  const l = 0.8189330101 * X + 0.3618667424 * Y - 0.1288597137 * Z;
  const m = 0.0329845436 * X + 0.9293118715 * Y + 0.0361456387 * Z;
  const s = 0.0482003018 * X + 0.2643662691 * Y + 0.633851707 * Z;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
};

/** OKLab → linear sRGB (D65). */
const oklabToLinearSrgb = (
  L: number,
  a: number,
  b: number,
): [number, number, number] => {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    1.2268798733741557 * l - 0.5578149965554813 * m + 0.2813910501772158 * s,
    -0.04057576262431372 * l + 1.1122868293970594 * m - 0.0717110666619174 * s,
    -0.07637294944629688 * l - 0.4214933239627914 * m + 0.4973864431754084 * s,
  ];
};

const oklabToOklch = (L: number, a: number, b: number): OklchColor => {
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
};

const oklchToOklab = (c: OklchColor): [number, number, number] => {
  const a = c.C * Math.cos((c.H * Math.PI) / 180);
  const b = c.C * Math.sin((c.H * Math.PI) / 180);
  return [c.L, a, b];
};

const hexToOklch = (hex: string): OklchColor | null => {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const lin: [number, number, number] = [
    srgbToLinear(r),
    srgbToLinear(g),
    srgbToLinear(b),
  ];
  const [L, a, bLab] = linearSrgbToOklab(lin[0]!, lin[1]!, lin[2]!);
  return oklabToOklch(L, a, bLab);
};

const oklchToLinearSrgb = (c: OklchColor): [number, number, number] => {
  const [L, a, b] = oklchToOklab(c);
  return oklabToLinearSrgb(L, a, b);
};

const oklchToHex = (c: OklchColor): string => {
  const [r, g, b] = oklchToLinearSrgb(c);
  return srgbToHex(r, g, b);
};

/** WCAG relative luminance from a linear sRGB triple. */
const relativeLuminance = (lin: [number, number, number]): number =>
  0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;

const contrastRatioOklch = (a: OklchColor, b: OklchColor): number => {
  const la = relativeLuminance(oklchToLinearSrgb(a));
  const lb = relativeLuminance(oklchToLinearSrgb(b));
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
};

const formatOklch = (c: OklchColor): string =>
  `oklch(${c.L.toFixed(3)} ${c.C.toFixed(3)} ${c.H.toFixed(1)})`;

const wcagBand = (ratio: number): WcagBand => {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AALarge";
  return "Fail";
};

// ─── Theme generation ─────────────────────────────────────────────────────

const buildTheme = (primaryHex: string): Theme | null => {
  const primary = hexToOklch(primaryHex);
  if (!primary) return null;
  const H = primary.H;
  return {
    primary,
    secondary: { L: 0.96, C: 0.01, H },
    accent: { L: 0.93, C: 0.04, H },
    background: { L: 0.99, C: 0.005, H },
    foreground: { L: 0.18, C: 0.02, H },
    muted: { L: 0.96, C: 0.01, H },
    "muted-foreground": { L: 0.5, C: 0.02, H },
    border: { L: 0.9, C: 0.01, H },
    card: { L: 1, C: 0, H: 0 },
    "card-foreground": { L: 0.18, C: 0.02, H },
    destructive: { L: 0.577, C: 0.245, H: DESTRUCTIVE_HUE },
    ring: { ...primary },
  };
};

// ─── Export formatters ────────────────────────────────────────────────────

const themeToCssBlock = (theme: Theme, themeName: string): string => {
  const lines = TOKEN_ORDER.map(
    (k) => `  --${TOKEN_LABELS[k]}: ${formatOklch(theme[k])};`,
  );
  const comment = `/* ${themeName} — generated by RoyCSS Theming Engine */`;
  return `${comment}\n:root {\n${lines.join("\n")}\n}`;
};

const themeToJson = (theme: Theme, themeName: string): string => {
  const obj: Record<string, string> = { name: themeName };
  for (const k of TOKEN_ORDER) {
    obj[TOKEN_LABELS[k]] = formatOklch(theme[k]);
  }
  return JSON.stringify(obj, null, 2);
};

const themeToTailwind = (theme: Theme, themeName: string): string => {
  const lines = TOKEN_ORDER.map(
    (k) => `  --color-${TOKEN_LABELS[k]}: ${formatOklch(theme[k])};`,
  );
  const comment = `/* ${themeName} — paste into your Tailwind 4 CSS (globals.css) */`;
  return `${comment}\n@theme inline {\n${lines.join("\n")}\n}`;
};

// ─── JSON import ──────────────────────────────────────────────────────────

interface ImportedTheme {
  theme: Theme;
  name: string;
}

const OKLCH_RE = /^oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)$/;

const parseOklchString = (s: string): OklchColor | null => {
  const m = s.trim().match(OKLCH_RE);
  if (!m) return null;
  const L = Number(m[1]);
  const C = Number(m[2]);
  const H = Number(m[3]);
  if (Number.isNaN(L) || Number.isNaN(C) || Number.isNaN(H)) return null;
  return { L, C, H };
};

const importThemeFromJson = (text: string): ImportedTheme | null => {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) return null;
    const theme: Partial<Theme> = {};
    for (const k of TOKEN_ORDER) {
      const v = parsed[TOKEN_LABELS[k]];
      if (typeof v !== "string") return null;
      const ok = parseOklchString(v);
      if (!ok) return null;
      theme[k] = ok;
    }
    const name =
      typeof parsed.name === "string" ? parsed.name : DEFAULT_THEME_NAME;
    return { theme: theme as Theme, name };
  } catch {
    return null;
  }
};

// ─── Component ────────────────────────────────────────────────────────────

interface ContrastRowProps {
  label: string;
  fg: OklchColor;
  bg: OklchColor;
}

const bandBadgeClass: Record<WcagBand, string> = {
  AAA: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  AA: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  AALarge:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Fail: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const bandLabel: Record<WcagBand, string> = {
  AAA: "AAA",
  AA: "AA",
  AALarge: "AA Large",
  Fail: "Fail",
};

function ContrastRow({ label, fg, bg }: ContrastRowProps) {
  const ratio = useMemo(() => contrastRatioOklch(fg, bg), [fg, bg]);
  const band = useMemo(() => wcagBand(ratio), [ratio]);
  const fgHex = useMemo(() => oklchToHex(fg), [fg]);
  const bgHex = useMemo(() => oklchToHex(bg), [bg]);
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background p-2.5">
      <div
        className="flex h-10 flex-1 items-center justify-center rounded-md border border-border px-2 text-xs font-medium"
        style={{
          backgroundColor: bgHex,
          color: fgHex,
        }}
      >
        {label}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-mono text-sm font-semibold text-foreground">
          {ratio.toFixed(2)}:1
        </span>
        <Badge
          variant="outline"
          className={cn("h-5 px-1.5 text-[10px] font-semibold", bandBadgeClass[band])}
        >
          {bandLabel[band]}
        </Badge>
      </div>
    </div>
  );
}

const ExportIcon: Record<ExportFormat, LucideIcon> = {
  css: Code2,
  json: FileJson,
  tailwind: Palette,
};

export function ThemingEngine() {
  const [primaryHex, setPrimaryHex] = useState<string>(DEFAULT_PRIMARY_HEX);
  const [themeName, setThemeName] = useState<string>(DEFAULT_THEME_NAME);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("css");
  const [importText, setImportText] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const flashCopied = useCallback((key: string) => {
    setCopiedKey(key);
    if (copiedTimerRef.current !== null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => {
      setCopiedKey(null);
      copiedTimerRef.current = null;
    }, COPY_CONFIRM_MS);
  }, []);

  const handleCopy = useCallback(
    async (text: string, key: string) => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
      } catch {
        /* clipboard may be unavailable */
      }
      flashCopied(key);
    },
    [flashCopied],
  );

  const theme = useMemo(() => buildTheme(primaryHex), [primaryHex]);

  const handlePrimaryHexChange = useCallback((value: string) => {
    const trimmed = value.trim();
    if (parseHex(trimmed)) {
      setPrimaryHex(trimmed.toLowerCase());
    } else {
      // Allow free typing; we'll fall back to the previous valid hex for
      // the generated theme so the preview never breaks.
      setPrimaryHex(trimmed);
    }
  }, []);

  const handleColorPicker = useCallback((value: string) => {
    setPrimaryHex(value.toLowerCase());
  }, []);

  const applyPreset = useCallback((hex: string) => {
    setPrimaryHex(hex);
  }, []);

  const exportText = useMemo<string>(() => {
    if (!theme) return "/* invalid primary color */";
    if (exportFormat === "json") return themeToJson(theme, themeName);
    if (exportFormat === "tailwind") return themeToTailwind(theme, themeName);
    return themeToCssBlock(theme, themeName);
  }, [theme, exportFormat, themeName]);

  // Inline-style override for the preview, exposing the generated tokens as
  // local CSS variables so semantic Tailwind utilities (bg-background etc.)
  // resolve to the user's palette inside this subtree only.
  const previewStyle = useMemo<CSSProperties>(() => {
    if (!theme) return {};
    const override: Record<string, string> = {
      "--primary": formatOklch(theme.primary),
      "--primary-foreground": formatOklch({ L: 0.99, C: 0.005, H: theme.primary.H }),
      "--secondary": formatOklch(theme.secondary),
      "--secondary-foreground": formatOklch({ L: 0.25, C: 0.02, H: theme.primary.H }),
      "--accent": formatOklch(theme.accent),
      "--accent-foreground": formatOklch({ L: 0.25, C: 0.04, H: theme.primary.H }),
      "--background": formatOklch(theme.background),
      "--foreground": formatOklch(theme.foreground),
      "--muted": formatOklch(theme.muted),
      "--muted-foreground": formatOklch(theme["muted-foreground"]),
      "--border": formatOklch(theme.border),
      "--card": formatOklch(theme.card),
      "--card-foreground": formatOklch(theme["card-foreground"]),
      "--destructive": formatOklch(theme.destructive),
      "--destructive-foreground": formatOklch({ L: 0.99, C: 0.005, H: DESTRUCTIVE_HUE }),
      "--ring": formatOklch(theme.ring),
    };
    return override as CSSProperties;
  }, [theme]);

  const handleImport = useCallback(() => {
    const result = importThemeFromJson(importText);
    if (!result) {
      setImportError(
        "Could not parse JSON. Expected an object with all token keys (oklch strings).",
      );
      return;
    }
    // Reverse-engineer the primary hex from the imported primary token.
    const primaryHexFromImport = oklchToHex(result.theme.primary);
    setPrimaryHex(primaryHexFromImport);
    setThemeName(result.name);
    setImportError(null);
    setImportText("");
  }, [importText]);

  if (!theme) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Palette className="size-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            CSS Variables Theming Engine
          </h3>
        </div>
        <p className="text-sm text-destructive">
          Invalid primary color. Please enter a valid hex (e.g. #10b981).
        </p>
      </div>
    );
  }

  const primaryOnBg = contrastRatioOklch(theme.primary, theme.background);
  const fgOnBg = contrastRatioOklch(theme.foreground, theme.background);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Palette className="size-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            CSS Variables Theming Engine
          </h3>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          12 tokens · primary {primaryOnBg.toFixed(2)}:1 · text {fgOnBg.toFixed(2)}:1
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Pick a primary color and RoyCSS derives a 12-token OKLCH palette
        (background, foreground, secondary, accent, muted, border, card,
        destructive, ring — all sharing your hue). Live preview, WCAG contrast
        checks, and three export formats included.
      </p>

      {/* Primary input + presets */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Primary color
        </Label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={parseHex(primaryHex) ? primaryHex : DEFAULT_PRIMARY_HEX}
            onChange={(e) => handleColorPicker(e.target.value)}
            className="size-10 shrink-0 cursor-pointer rounded-md border border-border bg-background p-0.5"
            aria-label="Primary color picker"
          />
          <Input
            value={primaryHex}
            onChange={(e) => handlePrimaryHexChange(e.target.value)}
            className="h-10 w-32 font-mono text-sm"
            aria-label="Primary hex value"
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset.hex)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                  primaryHex.toLowerCase() === preset.hex.toLowerCase()
                    ? "border-primary ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40",
                )}
                title={preset.hex}
              >
                <span
                  className={cn("size-3 rounded-sm", preset.swatchClass)}
                />
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <Label
            htmlFor="theme-name"
            className="text-xs text-muted-foreground"
          >
            theme name
          </Label>
          <Input
            id="theme-name"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            className="mt-1 font-mono text-sm"
            placeholder={DEFAULT_THEME_NAME}
          />
        </div>
      </div>

      {/* Generated tokens table */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Generated tokens ({TOKEN_ORDER.length})
        </Label>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {TOKEN_ORDER.map((k) => {
            const c = theme[k];
            const hex = oklchToHex(c);
            return (
              <div
                key={k}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                title={TOKEN_HINTS[k]}
              >
                <span
                  className="size-5 shrink-0 rounded border border-border"
                  style={{ backgroundColor: hex }}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium text-foreground">
                    {TOKEN_LABELS[k]}
                  </span>
                  <span className="truncate font-mono text-[10px] text-muted-foreground">
                    {formatOklch(c)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Label className="mb-3 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Live preview
        </Label>
        <div style={previewStyle} className="rounded-md bg-background p-4">
          <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            <h4 className="text-base font-semibold text-foreground">
              Card title
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              This card renders with your generated theme tokens. Every color
              below — buttons, badges, input — is driven by the OKLCH
              variables above.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm"
              >
                Primary action
              </button>
              <button
                type="button"
                className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
              >
                Secondary
              </button>
              <button
                type="button"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground"
              >
                Ghost
              </button>
              <button
                type="button"
                className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground shadow-sm"
              >
                Destructive
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Primary badge
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                Secondary
              </span>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                Accent
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Muted
              </span>
            </div>
            <div className="mt-3">
              <input
                type="text"
                placeholder="Type here…"
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      {/* WCAG contrast checks */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          WCAG contrast checks
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ContrastRow
            label="primary on background"
            fg={theme.primary}
            bg={theme.background}
          />
          <ContrastRow
            label="foreground on background"
            fg={theme.foreground}
            bg={theme.background}
          />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="size-3" />
          AA requires ≥ 4.5:1 for normal text · AAA requires ≥ 7:1.
        </p>
      </div>

      {/* Export */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Export
          </Label>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => handleCopy(exportText, "export")}
          >
            {copiedKey === "export" ? (
              <>
                <Check className="size-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" /> Copy
              </>
            )}
          </Button>
        </div>
        <Tabs
          value={exportFormat}
          onValueChange={(v) => setExportFormat(v as ExportFormat)}
          className="w-full"
        >
          <TabsList className="w-full">
            <TabsTrigger value="css" className="flex-1">
              <Code2 className="size-3.5" /> CSS
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              <FileJson className="size-3.5" /> JSON
            </TabsTrigger>
            <TabsTrigger value="tailwind" className="flex-1">
              <Palette className="size-3.5" /> Tailwind
            </TabsTrigger>
          </TabsList>
          {(["css", "json", "tailwind"] as ExportFormat[]).map((fmt) => {
            const Icon = ExportIcon[fmt];
            return (
              <TabsContent key={fmt} value={fmt} className="mt-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Icon className="size-3" />
                  {fmt === "css" && ":root variables — drop into any CSS file"}
                  {fmt === "json" && "Design-token JSON — store or share"}
                  {fmt === "tailwind" &&
                    "Tailwind 4 @theme — paste into globals.css"}
                </div>
                {fmt === exportFormat && (
                  <pre className="overflow-x-auto rounded-md bg-muted/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground">
                    <code>{exportText}</code>
                  </pre>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Import */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Import theme from JSON
        </Label>
        <Textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={`Paste a theme JSON here, e.g.\n{\n  "name": "my-theme",\n  "primary": "oklch(0.55 0.13 165)",\n  …\n}`}
          className="min-h-24 font-mono text-xs"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px]">
            {importError ? (
              <>
                <TriangleAlert className="size-3.5 text-amber-500" />
                <span className="text-amber-700 dark:text-amber-300">
                  {importError}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span className="text-muted-foreground">
                  Accepts the same JSON format Export produces.
                </span>
              </>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={!importText.trim()}
            className="h-7"
          >
            <Upload className="size-3.5" />
            Load
          </Button>
        </div>
      </div>

      {/* Export button (alternative to copy — a styled Download affordance) */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          className="text-xs text-muted-foreground"
          onClick={() => handleCopy(exportText, "export")}
        >
          <Download className="size-3.5" />
          Copy current {exportFormat.toUpperCase()} export
        </Button>
      </div>
    </div>
  );
}

export default ThemingEngine;
