"use client";

/**
 * RoyColorStudio — enterprise color management.
 *
 * Self-contained (no props). Three tabs:
 *
 *   • Scale — base color picker → generates an 11-step OKLCH-lightness
 *     scale (50–950). Each step shows swatch, hex, OKLCH string, copy
 *     button, and WCAG contrast ratio against white & black backgrounds
 *     with AA/AAA pass/fail badges.
 *
 *   • Brand — pick a brand color (or load one of 6 presets) → generates
 *     a complete semantic theme (primary, secondary, accent, background,
 *     foreground, muted, border) as both color swatches and CSS variables.
 *
 *   • Export — emit the current scale + theme in three formats:
 *     `:root` CSS variables, a JSON object, and a Tailwind config
 *     snippet. Each block has its own Copy button.
 *
 * OKLCH math (sRGB ↔ OKLCH) is implemented in-module — no runtime
 * dependency. All clipboard writes happen inside event handlers with a
 * legacy fallback. SSR-safe. TS strict, zero `any`. No indigo / blue.
 */

import * as React from "react";
import {
  Check,
  Copy,
  Palette as PaletteIcon,
  Shuffle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type StepKey =
  | "50"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900"
  | "950";

interface ScaleStep {
  key: StepKey;
  /** OKLCH lightness target for this step. */
  lightness: number;
  /** Hex string, e.g. "#10b981". */
  hex: string;
  /** OKLCH string, e.g. "oklch(0.55 0.13 165)". */
  oklch: string;
  /** Contrast ratio against pure white (1–21). */
  contrastWhite: number;
  /** Contrast ratio against pure black (1–21). */
  contrastBlack: number;
}

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
}

interface BrandPreset {
  id: string;
  name: string;
  description: string;
  hex: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Color conversion — sRGB ↔ OKLCH (no runtime deps)
// ═══════════════════════════════════════════════════════════════════════

interface Rgb { r: number; g: number; b: number; }
interface OkLch { l: number; c: number; h: number; }

function hexToRgb(hex: string): Rgb {
  const c = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [r, g, b]
      .map((x) => clamp(x).toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToOklch(r: number, g: number, b: number): OkLch {
  const norm = [r, g, b].map((c) => c / 255);
  const lin = norm.map((c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  const [R, G, B] = lin;
  const X = 0.4124 * R + 0.3576 * G + 0.1805 * B;
  const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const Z = 0.0193 * R + 0.1192 * G + 0.9505 * B;
  const lCbrt = Math.cbrt(0.8189 * X + 0.3619 * Y - 0.1286 * Z);
  const mCbrt = Math.cbrt(0.0339 * X + 0.9289 * Y + 0.0373 * Z);
  const sCbrt = Math.cbrt(0.0489 * X + 0.026 * Y + 0.9125 * Z);
  const L = 0.2104 * lCbrt + 0.5801 * mCbrt + 0.0946 * sCbrt;
  const A = 1.5999 * lCbrt - 1.4269 * mCbrt + 0.2628 * sCbrt;
  const BAxis = 0.3998 * lCbrt + 0.1465 * mCbrt - 0.5195 * sCbrt;
  const C = Math.sqrt(A * A + BAxis * BAxis);
  let H = (Math.atan2(BAxis, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: L, c: C, h: H };
}

function oklchToRgb(l: number, c: number, h: number): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const bAxis = c * Math.sin(hr);
  // OKLab → linear sRGB (inverse of forward)
  const lCbrt = l + 0.3963377774 * a + 0.2158037573 * bAxis;
  const mCbrt = l - 0.1055613458 * a - 0.0638541728 * bAxis;
  const sCbrt = l - 0.0894841775 * a - 1.291485548 * bAxis;
  const l_ = lCbrt * lCbrt * lCbrt;
  const m_ = mCbrt * mCbrt * mCbrt;
  const s_ = sCbrt * sCbrt * sCbrt;
  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const bb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
  // Linear → sRGB
  const toSrgb = (v: number) =>
    v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return {
    r: toSrgb(r) * 255,
    g: toSrgb(g) * 255,
    b: toSrgb(bb) * 255,
  };
}

function fmtOklch(o: OkLch): string {
  return `oklch(${o.l.toFixed(3)} ${o.c.toFixed(3)} ${o.h.toFixed(1)})`;
}

/** WCAG contrast ratio (1–21) between two RGB colors. */
function contrastRatio(a: Rgb, b: Rgb): number {
  const lum = (rgb: Rgb): number => {
    const norm = [rgb.r, rgb.g, rgb.b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
  };
  const la = lum(a);
  const lb = lum(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const STEP_KEYS: readonly StepKey[] = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

/** OKLCH lightness targets per Tailwind-style step. */
const STEP_LIGHTNESS: Record<StepKey, number> = {
  "50": 0.985,
  "100": 0.955,
  "200": 0.885,
  "300": 0.78,
  "400": 0.66,
  "500": 0.55,
  "600": 0.46,
  "700": 0.38,
  "800": 0.3,
  "900": 0.225,
  "950": 0.165,
};

const BRAND_PRESETS: readonly BrandPreset[] = [
  {
    id: "emerald",
    name: "Emerald",
    description: "Default RoyCSS calm green.",
    hex: "#10b981",
  },
  {
    id: "teal",
    name: "Teal",
    description: "Cool teal — fintech & data.",
    hex: "#14b8a6",
  },
  {
    id: "rose",
    name: "Rose",
    description: "Warm rose — e-commerce.",
    hex: "#f43f5e",
  },
  {
    id: "amber",
    name: "Amber",
    description: "Energetic amber — consumer.",
    hex: "#f59e0b",
  },
  {
    id: "cyan",
    name: "Cyan",
    description: "Bright cyan — DevTools.",
    hex: "#06b6d4",
  },
  {
    id: "violet",
    name: "Violet",
    description: "Creative violet — design.",
    hex: "#8b5cf6",
  },
] as const;

const WHITE_RGB: Rgb = { r: 255, g: 255, b: 255 };
const BLACK_RGB: Rgb = { r: 0, g: 0, b: 0 };

// ═══════════════════════════════════════════════════════════════════════
// Scale + theme generation
// ═══════════════════════════════════════════════════════════════════════

function generateScale(baseHex: string): ScaleStep[] {
  const baseRgb = hexToRgb(baseHex);
  const baseOklch = rgbToOklch(baseRgb.r, baseRgb.g, baseRgb.b);
  // Clamp chroma at extreme lightness steps to avoid blowing out gamut.
  return STEP_KEYS.map((key) => {
    const targetL = STEP_LIGHTNESS[key];
    // Slightly reduce chroma at the very light & very dark ends for
    // perceptual uniformity (otherwise 50 looks grey, 950 looks muddy).
    const lDelta = Math.abs(targetL - baseOklch.l);
    const chromaFactor = Math.max(0.45, 1 - lDelta * 1.2);
    const c = Math.min(0.32, baseOklch.c * chromaFactor);
    const rgb = oklchToRgb(targetL, c, baseOklch.h);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const oklch = fmtOklch({ l: targetL, c, h: baseOklch.h });
    return {
      key,
      lightness: targetL,
      hex,
      oklch,
      contrastWhite: contrastRatio(rgb, WHITE_RGB),
      contrastBlack: contrastRatio(rgb, BLACK_RGB),
    };
  });
}

/** Generate a semantic theme palette from a base color. */
function generateTheme(scale: ScaleStep[]): ThemePalette {
  const get = (k: StepKey) => scale.find((s) => s.key === k)?.hex ?? "#000000";
  return {
    primary: get("500"),
    primaryForeground: get("50"),
    secondary: get("200"),
    secondaryForeground: get("800"),
    accent: get("300"),
    accentForeground: get("900"),
    background: get("50"),
    foreground: get("950"),
    muted: get("100"),
    mutedForeground: get("600"),
    border: get("200"),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Export builders
// ═══════════════════════════════════════════════════════════════════════

function buildCssVars(scale: ScaleStep[], theme: ThemePalette): string {
  const scaleLines = scale.map((s) => `  --brand-${s.key}: ${s.hex};`);
  const themeLines: string[] = [
    `  --primary: ${theme.primary};`,
    `  --primary-foreground: ${theme.primaryForeground};`,
    `  --secondary: ${theme.secondary};`,
    `  --secondary-foreground: ${theme.secondaryForeground};`,
    `  --accent: ${theme.accent};`,
    `  --accent-foreground: ${theme.accentForeground};`,
    `  --background: ${theme.background};`,
    `  --foreground: ${theme.foreground};`,
    `  --muted: ${theme.muted};`,
    `  --muted-foreground: ${theme.mutedForeground};`,
    `  --border: ${theme.border};`,
  ];
  return `:root {\n${scaleLines.join("\n")}\n\n  /* semantic */\n${themeLines.join("\n")}\n}`;
}

function buildJsonExport(scale: ScaleStep[], theme: ThemePalette): string {
  const scaleObj: Record<string, string> = {};
  for (const s of scale) scaleObj[s.key] = s.hex;
  const themeObj: Record<string, string> = { ...theme };
  return JSON.stringify({ scale: scaleObj, theme: themeObj }, null, 2);
}

function buildTailwindExport(scale: ScaleStep[]): string {
  const lines = scale.map((s) => `      ${s.key}: "${s.hex}",`);
  return `// tailwind.config.ts\nexport default {\n  theme: {\n    extend: {\n      colors: {\n        brand: {\n${lines.join("\n")}\n        },\n      },\n    },\n  },\n};`;
}

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
    // fall through
  }
  try {
    if (typeof document === "undefined") return false;
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface ContrastBadgeProps {
  ratio: number;
  background: "white" | "black";
}

function ContrastBadge({
  ratio,
  background,
}: ContrastBadgeProps): React.JSX.Element {
  const rounded = Math.round(ratio * 10) / 10;
  // AA Large = 3:1, AA Normal = 4.5:1, AAA Normal = 7:1
  const aaLarge = ratio >= 3;
  const aaNormal = ratio >= 4.5;
  const aaa = ratio >= 7;
  const label = `${rounded}:1`;
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[10px] text-foreground">{label}</span>
      <span
        className={cn(
          "rounded px-1 py-px text-[9px] font-bold",
          aaNormal
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
            : aaLarge
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
        )}
        title={
          background === "white"
            ? `Contrast on white: ${rounded}:1`
            : `Contrast on black: ${rounded}:1`
        }
      >
        {aaNormal ? (aaa ? "AAA" : "AA") : aaLarge ? "AA-L" : "Fail"}
      </span>
    </div>
  );
}

interface ScaleRowProps {
  step: ScaleStep;
  onCopy: (value: string, key: StepKey) => void;
  copiedKey: StepKey | null;
}

function ScaleRow({
  step,
  onCopy,
  copiedKey,
}: ScaleRowProps): React.JSX.Element {
  const isLight = step.lightness > 0.6;
  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-border/60 px-3 py-2 last:border-b-0">
      {/* Swatch */}
      <div className="col-span-3 sm:col-span-2">
        <button
          type="button"
          onClick={() => onCopy(step.hex, step.key)}
          className="group relative flex h-10 w-full items-center justify-center rounded-md border border-border/60 font-mono text-xs font-medium transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: step.hex,
            color: isLight ? "#0f172a" : "#ffffff",
          }}
          aria-label={`Copy hex ${step.hex} for step ${step.key}`}
        >
          {step.key}
          {copiedKey === step.key ? (
            <Check className="size-3" aria-hidden />
          ) : null}
        </button>
      </div>
      {/* Hex */}
      <div className="col-span-4 hidden font-mono text-xs text-foreground sm:block">
        {step.hex}
      </div>
      {/* OKLCH */}
      <div className="col-span-4 hidden truncate font-mono text-[11px] text-muted-foreground lg:block">
        {step.oklch}
      </div>
      {/* Contrast */}
      <div className="col-span-9 flex flex-col gap-0.5 sm:col-span-2">
        <ContrastBadge ratio={step.contrastWhite} background="white" />
        <ContrastBadge ratio={step.contrastBlack} background="black" />
      </div>
    </div>
  );
}

interface ThemeSwatchProps {
  label: string;
  value: string;
  foreground: string;
}

function ThemeSwatch({
  label,
  value,
  foreground,
}: ThemeSwatchProps): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div
        className="flex h-16 items-center justify-center px-2 text-center text-xs font-medium"
        style={{ backgroundColor: value, color: foreground }}
      >
        Aa
      </div>
      <div className="bg-background px-2 py-1.5">
        <div className="truncate text-[11px] font-medium text-foreground">
          {label}
        </div>
        <div className="truncate font-mono text-[10px] text-muted-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════

export function RoyColorStudio(): React.JSX.Element {
  const [baseHex, setBaseHex] = React.useState<string>("#10b981");
  const [copiedStep, setCopiedStep] = React.useState<StepKey | null>(null);
  const [copiedVars, setCopiedVars] = React.useState<boolean>(false);
  const [copiedJson, setCopiedJson] = React.useState<boolean>(false);
  const [copiedTw, setCopiedTw] = React.useState<boolean>(false);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const scale = React.useMemo(() => generateScale(baseHex), [baseHex]);
  const theme = React.useMemo(() => generateTheme(scale), [scale]);

  const cssVars = React.useMemo(
    () => buildCssVars(scale, theme),
    [scale, theme],
  );
  const jsonExport = React.useMemo(
    () => buildJsonExport(scale, theme),
    [scale, theme],
  );
  const tailwindExport = React.useMemo(
    () => buildTailwindExport(scale),
    [scale],
  );

  const flashCopy = React.useCallback(
    (
      setter: (v: boolean) => void,
      stepKey?: StepKey,
      stepSetter?: (k: StepKey | null) => void,
    ) => {
      if (stepKey !== undefined && stepSetter) {
        stepSetter(stepKey);
      } else {
        setter(true);
      }
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        if (stepSetter) stepSetter(null);
        setter(false);
        copyTimeoutRef.current = null;
      }, 1500);
    },
    [],
  );

  const handleCopyStep = React.useCallback(
    async (value: string, key: StepKey) => {
      const ok = await copyToClipboard(value);
      if (ok) flashCopy(() => void 0, key, setCopiedStep);
    },
    [flashCopy],
  );

  const handleCopyVars = React.useCallback(async () => {
    const ok = await copyToClipboard(cssVars);
    if (ok) flashCopy(setCopiedVars);
  }, [cssVars, flashCopy]);

  const handleCopyJson = React.useCallback(async () => {
    const ok = await copyToClipboard(jsonExport);
    if (ok) flashCopy(setCopiedJson);
  }, [jsonExport, flashCopy]);

  const handleCopyTw = React.useCallback(async () => {
    const ok = await copyToClipboard(tailwindExport);
    if (ok) flashCopy(setCopiedTw);
  }, [tailwindExport, flashCopy]);

  const handleRandomize = React.useCallback(() => {
    // Pick a random hue, mid chroma, mid lightness via HSL → hex.
    const hue = Math.floor(Math.random() * 360);
    const sat = 55 + Math.floor(Math.random() * 25);
    const light = 45 + Math.floor(Math.random() * 15);
    const h = hue / 360;
    const s = sat / 100;
    const l = light / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    setBaseHex(rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255));
  }, []);

  const handlePreset = React.useCallback((preset: BrandPreset) => {
    setBaseHex(preset.hex);
  }, []);

  // Validate hex input — only update if it parses.
  const handleHexInput = React.useCallback(
    (value: string) => {
      const v = value.startsWith("#") ? value : `#${value}`;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        setBaseHex(v.toLowerCase());
      } else {
        // Allow partial typing — store raw so the input is editable.
        setBaseHex(value);
      }
    },
    [],
  );

  return (
    <section
      aria-label="Roy Color Studio"
      className="mx-auto w-full max-w-6xl px-1 py-2"
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
            <PaletteIcon className="size-5 text-emerald-500" aria-hidden />
            Roy Color Studio
          </h2>
          <p className="text-sm text-muted-foreground">
            OKLCH-lightness color scaling · WCAG AA/AAA validation · brand
            theme generation · CSS + JSON + Tailwind export.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRandomize}
          aria-label="Randomize base color"
        >
          <Shuffle className="size-3.5" aria-hidden />
          Randomize
        </Button>
      </div>

      {/* ─── Base color picker ───────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <label
              className="relative inline-flex size-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border"
              style={{ backgroundColor: baseHex }}
            >
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(baseHex) ? baseHex : "#10b981"}
                onChange={(e) => setBaseHex(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Pick base color"
              />
            </label>
            <div>
              <Label
                htmlFor="base-hex"
                className="text-xs text-muted-foreground"
              >
                Base color
              </Label>
              <Input
                id="base-hex"
                value={baseHex}
                onChange={(e) => handleHexInput(e.target.value)}
                className="mt-0.5 h-9 w-36 font-mono"
                aria-label="Base color hex value"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <span className="text-xs text-muted-foreground">Brand presets:</span>
            {BRAND_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePreset(p)}
                title={p.description}
                aria-label={`Apply ${p.name} brand preset`}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
                  baseHex.toLowerCase() === p.hex.toLowerCase()
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span
                  className="size-3 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: p.hex }}
                  aria-hidden
                />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="scale">
        <TabsList className="mb-4">
          <TabsTrigger value="scale">Scale (50–950)</TabsTrigger>
          <TabsTrigger value="brand">Brand Theme</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* ─── Scale tab ─────────────────────────────────────────── */}
        <TabsContent value="scale">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-3 sm:col-span-2">Step</div>
              <div className="col-span-4 hidden sm:block">Hex</div>
              <div className="col-span-4 hidden lg:block">OKLCH</div>
              <div className="col-span-9 sm:col-span-2">Contrast (W/B)</div>
            </div>
            {scale.map((step) => (
              <ScaleRow
                key={step.key}
                step={step}
                onCopy={handleCopyStep}
                copiedKey={copiedStep}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Click a step swatch to copy its hex. Contrast badges show WCAG
            ratios against pure white & black — AA = 4.5:1, AAA = 7:1, AA-L =
            3:1 (large text).
          </p>
        </TabsContent>

        {/* ─── Brand tab ─────────────────────────────────────────── */}
        <TabsContent value="brand">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Generated semantic theme
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <ThemeSwatch
                label="Primary"
                value={theme.primary}
                foreground={theme.primaryForeground}
              />
              <ThemeSwatch
                label="Secondary"
                value={theme.secondary}
                foreground={theme.secondaryForeground}
              />
              <ThemeSwatch
                label="Accent"
                value={theme.accent}
                foreground={theme.accentForeground}
              />
              <ThemeSwatch
                label="Background"
                value={theme.background}
                foreground={theme.foreground}
              />
              <ThemeSwatch
                label="Foreground"
                value={theme.foreground}
                foreground={theme.background}
              />
              <ThemeSwatch
                label="Muted"
                value={theme.muted}
                foreground={theme.mutedForeground}
              />
              <ThemeSwatch
                label="Muted FG"
                value={theme.mutedForeground}
                foreground={theme.muted}
              />
              <ThemeSwatch
                label="Border"
                value={theme.border}
                foreground={theme.foreground}
              />
            </div>
          </div>

          {/* Theme preview card */}
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <div
              className="p-5"
              style={{
                backgroundColor: theme.background,
                color: theme.foreground,
                borderColor: theme.border,
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4
                  className="text-lg font-semibold"
                  style={{ color: theme.foreground }}
                >
                  Theme Preview
                </h4>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.primaryForeground,
                  }}
                >
                  Brand
                </span>
              </div>
              <p
                className="mb-3 text-sm"
                style={{ color: theme.mutedForeground }}
              >
                The quick brown fox jumps over the lazy dog. Body copy renders
                in foreground; muted copy in muted-foreground.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md px-3 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.primaryForeground,
                  }}
                >
                  Primary
                </button>
                <button
                  type="button"
                  className="rounded-md px-3 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: theme.secondary,
                    color: theme.secondaryForeground,
                  }}
                >
                  Secondary
                </button>
                <button
                  type="button"
                  className="rounded-md px-3 py-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: theme.accent,
                    color: theme.accentForeground,
                  }}
                >
                  Accent
                </button>
                <span
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                  style={{
                    borderColor: theme.border,
                    color: theme.foreground,
                    backgroundColor: theme.muted,
                  }}
                >
                  Muted
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── Export tab ────────────────────────────────────────── */}
        <TabsContent value="export">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  CSS variables
                </span>
                <Button
                  size="sm"
                  variant={copiedVars ? "secondary" : "outline"}
                  onClick={handleCopyVars}
                >
                  {copiedVars ? (
                    <>
                      <Check className="size-3.5" aria-hidden /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" aria-hidden /> Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="max-h-72 overflow-auto px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
                <code>{cssVars}</code>
              </pre>
            </div>

            <div className="rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  JSON
                </span>
                <Button
                  size="sm"
                  variant={copiedJson ? "secondary" : "outline"}
                  onClick={handleCopyJson}
                >
                  {copiedJson ? (
                    <>
                      <Check className="size-3.5" aria-hidden /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" aria-hidden /> Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="max-h-72 overflow-auto px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
                <code>{jsonExport}</code>
              </pre>
            </div>

            <div className="rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tailwind config
                </span>
                <Button
                  size="sm"
                  variant={copiedTw ? "secondary" : "outline"}
                  onClick={handleCopyTw}
                >
                  {copiedTw ? (
                    <>
                      <Check className="size-3.5" aria-hidden /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" aria-hidden /> Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="max-h-72 overflow-auto px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
                <code>{tailwindExport}</code>
              </pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
