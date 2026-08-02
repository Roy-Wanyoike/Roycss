"use client";

import { useState, useMemo, useCallback } from "react";
import {
  MoonStar,
  Sun,
  SunMoon,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Code2,
  Palette,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   COLOR MATH — OKLCH (perceptually uniform color space)
   Reference: Björn Ottosson, "A perceptual color space for image
   processing" (Dec 2020). https://bottosson.github.io/posts/oklab/
   All channel values are in [0,1] unless otherwise noted.

   Sanity checks (verified by hand):
     #ffffff → L=1.000  C=0  H=0
     #000000 → L=0.000  C=0  H=0
     #808080 → L≈0.596  C≈0  H=0
   ═══════════════════════════════════════════════════════════════ */

/** sRGB [0,1] → linear sRGB [0,1] (inverse gamma). */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Linear sRGB [0,1] → sRGB [0,1] (gamma encode). */
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** Linear sRGB → OKLab. Returns [L, a, b]. */
function linearSrgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

/** OKLab → linear sRGB. Returns [r, g, b]. */
function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

interface Oklch {
  /** Perceptual lightness, 0..1 (0=black, 1=white). */
  L: number;
  /** Chroma, 0..~0.4. */
  C: number;
  /** Hue angle, 0..360 degrees. */
  H: number;
}

/** OKLab → OKLCH (H in degrees, 0..360). */
function oklabToOklch(L: number, a: number, b: number): Oklch {
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

/** OKLCH → OKLab (returns [L, a, b]). */
function oklchToOklab({ L, C, H }: Oklch): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

/** Hex string (#rgb | #rgba | #rrggbb | #rrggbbaa) → OKLCH, or null if invalid. */
function hexToOklch(hex: string): Oklch | null {
  const rgb = parseHexToRgb01(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const [L, a, b_] = linearSrgbToOklab(
    srgbToLinear(r),
    srgbToLinear(g),
    srgbToLinear(b),
  );
  return oklabToOklch(L, a, b_);
}

/** OKLCH → #rrggbb hex string. */
function oklchToHex({ L, C, H }: Oklch): string {
  const [oL, oa, ob] = oklchToOklab({ L, C, H });
  const [lr, lg, lb] = oklabToLinearSrgb(oL, oa, ob);
  return rgbToHex(linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb));
}

/** WCAG relative luminance for an sRGB triple (each in [0,1]). */
function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
  );
}

/** WCAG contrast ratio between two sRGB triples (each in [0,1]). Returns 1..21. */
function contrastRatio(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const la = relativeLuminance(a[0], a[1], a[2]);
  const lb = relativeLuminance(b[0], b[1], b[2]);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/* ═══════════════════════════════════════════════════════════════
   HEX / COLOR PARSING UTILITIES
   ═══════════════════════════════════════════════════════════════ */

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function rgbToHex(r: number, g: number, b: number): string {
  const toByte = (c: number) => {
    const clamped = clamp(c, 0, 1);
    return Math.round(clamped * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

/** Parse a hex string (#rgb, #rgba, #rrggbb, #rrggbbaa) → [r,g,b] in [0,1]. */
function parseHexToRgb01(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  } else if (h.length === 4) {
    // #rgba → expand + drop alpha
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  } else if (h.length === 8) {
    // #rrggbbaa → drop alpha
    h = h.slice(0, 6);
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/** Normalize any supported hex form to lowercase #rrggbb, or null. */
function normalizeHex(hex: string): string | null {
  const rgb = parseHexToRgb01(hex);
  return rgb ? rgbToHex(rgb[0], rgb[1], rgb[2]) : null;
}

/** Convert HSL (h:0..360, s:0..1, l:0..1) → sRGB [0,1] triple. */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) {
    r = c;
    g = x;
    b = 0;
  } else if (hp < 2) {
    r = x;
    g = c;
    b = 0;
  } else if (hp < 3) {
    r = 0;
    g = c;
    b = x;
  } else if (hp < 4) {
    r = 0;
    g = x;
    b = c;
  } else if (hp < 5) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  const m = l - c / 2;
  return [r + m, g + m, b + m];
}

/**
 * Try to interpret a CSS color string (hex, rgb()/rgba(), hsl()/hsla())
 * → #rrggbb, or null. Handles both comma and space modern syntax,
 * percentages, and the `deg` hue unit.
 */
function anyColorToHex(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.startsWith("#")) return normalizeHex(trimmed);

  // rgb()/rgba() — comma or space separated, with optional % and alpha
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+)(%)?\s*[ ,]\s*([\d.]+)(%)?\s*[ ,]\s*([\d.]+)(%)?\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i,
  );
  if (rgbMatch) {
    const parseChannel = (val: string | undefined, pct: string | undefined) => {
      const n = parseFloat(val ?? "0");
      return pct ? n / 100 : n / 255;
    };
    const r = parseChannel(rgbMatch[1], rgbMatch[2]);
    const g = parseChannel(rgbMatch[3], rgbMatch[4]);
    const b = parseChannel(rgbMatch[5], rgbMatch[6]);
    return rgbToHex(r, g, b);
  }

  // hsl()/hsla()
  const hslMatch = trimmed.match(
    /^hsla?\(\s*([\d.]+)(?:deg)?\s*[ ,]\s*([\d.]+)%\s*[ ,]\s*([\d.]+)%\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i,
  );
  if (hslMatch) {
    const h = parseFloat(hslMatch[1] ?? "0");
    const s = parseFloat(hslMatch[2] ?? "0") / 100;
    const l = parseFloat(hslMatch[3] ?? "0") / 100;
    const [r, g, b] = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   CSS EXTRACTION
   ═══════════════════════════════════════════════════════════════ */

interface ExtractedColor {
  hex: string;
  label: string;
}

/**
 * Extract colors from a CSS string. If `:root { --var: <color>; }` blocks
 * are present, the variable names become labels (with `--color-`/`--c-`
 * prefixes stripped). Otherwise just collect every hex/rgb()/hsl() value,
 * deduped, with sequential labels.
 */
function extractColorsFromCss(css: string): ExtractedColor[] {
  const labeled: ExtractedColor[] = [];
  const seenLabeled = new Set<string>();

  // Pattern 1: --var-name: <color>;
  const varRe =
    /--([a-zA-Z][a-zA-Z0-9-]*)\s*:\s*(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\))/g;
  let m: RegExpExecArray | null;
  while ((m = varRe.exec(css)) !== null) {
    const rawLabel =
      (m[1] ?? "")
        .replace(/^(?:color|c)-/i, "")
        .replace(/[-_]/g, " ")
        .trim() || "color";
    const hex = anyColorToHex(m[2] ?? "");
    if (!hex) continue;
    const key = `${rawLabel.toLowerCase()}:${hex}`;
    if (seenLabeled.has(key)) continue;
    seenLabeled.add(key);
    labeled.push({ hex, label: rawLabel });
  }

  if (labeled.length > 0) return labeled;

  // Pattern 2: any hex / rgb / hsl anywhere (deduped)
  const found: string[] = [];
  const seenHex = new Set<string>();

  const hexRe = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{1})?(?:[0-9a-fA-F]{2})?(?:[0-9a-fA-F]{2})?\b/g;
  while ((m = hexRe.exec(css)) !== null) {
    const hex = normalizeHex(m[0]);
    if (hex && !seenHex.has(hex)) {
      seenHex.add(hex);
      found.push(hex);
    }
  }

  const rgbRe = /rgba?\(\s*[\d.%\s,/-]+deg?\s*[\d.%\s,/-]*\)/gi;
  while ((m = rgbRe.exec(css)) !== null) {
    const hex = anyColorToHex(m[0]);
    if (hex && !seenHex.has(hex)) {
      seenHex.add(hex);
      found.push(hex);
    }
  }

  const hslRe = /hsla?\(\s*[\d.%\s,/-]+deg?\s*[\d.%\s,/-]*\)/gi;
  while ((m = hslRe.exec(css)) !== null) {
    const hex = anyColorToHex(m[0]);
    if (hex && !seenHex.has(hex)) {
      seenHex.add(hex);
      found.push(hex);
    }
  }

  return found.map((hex, i) => ({ hex, label: `Color ${i + 1}` }));
}

/* ═══════════════════════════════════════════════════════════════
   DARK MODE CONVERSION ALGORITHM
   ═══════════════════════════════════════════════════════════════ */

interface ConvertOptions {
  hueRotation: boolean;
  boostContrast: number; // 0..100
}

/**
 * Convert a single OKLCH color to its dark-mode counterpart.
 *
 * Strategy (per spec):
 * - Light (L > 0.65): invert L to a "dark surface" range via
 *   L' = clamp(0.18, 1 - L + 0.15, 0.35). Chroma reduced ~15% on
 *   very saturated colors (C > 0.10) to avoid neon glow on dark.
 * - Dark (L < 0.35): invert L to a "light text" range via
 *   L' = clamp(0.75, 1 - L - 0.10, 0.95). Chroma preserved.
 * - Mid (0.35 ≤ L ≤ 0.65): mild invert L' = 1 - L, chroma −15%.
 *
 * The `boostContrast` slider (0..100) pushes L' further from the
 * perceptual midpoint (0.5), increasing contrast in dark mode.
 * Optional +15° hue rotation warms accents.
 */
function convertToDark(input: Oklch, opts: ConvertOptions): Oklch {
  const { L, C, H } = input;
  const boost = opts.boostContrast / 100; // 0..1

  let Lp: number;
  let Cp: number;

  if (L > 0.65) {
    // Light → dark surface
    Lp = clamp(0.18, 1.0 - L + 0.15, 0.35);
    // Boost: push further from 0.5 → darker
    Lp = clamp(0.1, Lp - boost * 0.08, 0.35);
    // Reduce chroma for very saturated colors to avoid neon glow
    Cp = C > 0.1 ? C * 0.85 : C;
  } else if (L < 0.35) {
    // Dark → light text
    Lp = clamp(0.75, 1.0 - L - 0.1, 0.95);
    // Boost: push further from 0.5 → lighter
    Lp = clamp(0.75, Lp + boost * 0.05, 0.98);
    Cp = C;
  } else {
    // Mid
    Lp = 1.0 - L;
    // Boost: push further from 0.5
    if (Lp < 0.5) {
      Lp = clamp(0.1, Lp - boost * 0.08, 0.5);
    } else {
      Lp = clamp(0.5, Lp + boost * 0.08, 0.98);
    }
    Cp = C * 0.85;
  }

  const Hp = opts.hueRotation ? (H + 15) % 360 : H;

  return { L: Lp, C: Cp, H: Hp };
}

/** WCAG contrast tier label for a ratio (1..21). */
function contrastTier(ratio: number): { label: string; className: string } {
  if (ratio >= 7) {
    return {
      label: "AAA",
      className:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    };
  }
  if (ratio >= 4.5) {
    return {
      label: "AA",
      className: "bg-primary/15 text-primary border-primary/30",
    };
  }
  if (ratio >= 3) {
    return {
      label: "AA Large",
      className:
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
  }
  return {
    label: "Low",
    className: "bg-muted text-muted-foreground border-border",
  };
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT FORMATTERS
   ═══════════════════════════════════════════════════════════════ */

function slug(label: string, fallback: string): string {
  const cleaned = (label || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

function formatCssVars(items: { label: string; hex: string }[]): string {
  const lines = items.map(
    (c, i) => `  --color-${slug(c.label, `color-${i + 1}`)}: ${c.hex};`,
  );
  return `:root {\n${lines.join("\n")}\n}`;
}

function formatTailwind(items: { label: string; hex: string }[]): string {
  const lines = items.map((c, i) => {
    const key = slug(c.label, `color-${i + 1}`).replace(/-/g, "");
    return `      ${key}: "${c.hex}"`;
  });
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${lines.join(",\n")}\n      }\n    }\n  }\n}`;
}

function formatOklchVars(items: { label: string; oklch: Oklch }[]): string {
  const lines = items.map((c, i) => {
    const { L, C, H } = c.oklch;
    return `  --color-${slug(c.label, `color-${i + 1}`)}: oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(3)});`;
  });
  return `:root {\n${lines.join("\n")}\n}`;
}

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

interface ColorRow {
  id: string;
  hex: string;
  label: string;
}

interface ConversionResult {
  row: ColorRow;
  inputOklch: Oklch | null;
  output: Oklch | null;
  outputHex: string;
}

const DEFAULT_COLORS: ColorRow[] = [
  { id: "row-bg", hex: "#ffffff", label: "Background" },
  { id: "row-surface", hex: "#f8fafc", label: "Surface" },
  { id: "row-text", hex: "#0f172a", label: "Text" },
  { id: "row-muted", hex: "#64748b", label: "Muted" },
  { id: "row-primary", hex: "#0d9488", label: "Primary" },
];

const DEFAULT_CSS = `:root {
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #0f172a;
  --color-muted: #64748b;
  --color-primary: #0d9488;
  --color-border: #e2e8f0;
}`;

const NEW_ROW_PREFIX = "row-";

/* ═══════════════════════════════════════════════════════════════
   COLOR SWATCH (interactive when onChange is provided)
   ═══════════════════════════════════════════════════════════════ */

interface SwatchProps {
  hex: string;
  onChange?: (hex: string) => void;
  ariaLabel: string;
}

function ColorSwatch({ hex, onChange, ariaLabel }: SwatchProps) {
  // <input type="color"> requires a 7-char #rrggbb value
  const safeValue = normalizeHex(hex) ?? "#000000";
  return (
    <div
      className={cn(
        "relative size-10 shrink-0 rounded-md border border-border overflow-hidden",
        onChange && "cursor-pointer",
      )}
      style={{ background: hex }}
    >
      {onChange ? (
        <input
          type="color"
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label={ariaLabel}
        />
      ) : (
        <span className="sr-only">{ariaLabel}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

/**
 * DarkModeConverter — takes a set of light-mode colors and auto-generates
 * a perceptually-tuned dark-mode palette via OKLCH color science. Features
 * palette/CSS input modes, side-by-side comparison with WCAG contrast
 * indicators, a live UI preview, and CSS/Tailwind/OKLCH exports.
 */
export function DarkModeConverter() {
  /* ─── State ─── */
  const [mode, setMode] = useState<"palette" | "css">("palette");
  const [colors, setColors] = useState<ColorRow[]>(() =>
    DEFAULT_COLORS.map((c) => ({ ...c })),
  );
  const [cssInput, setCssInput] = useState(DEFAULT_CSS);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const [hueRotation, setHueRotation] = useState(false);
  const [boostContrast, setBoostContrast] = useState(30);
  const [swapColumns, setSwapColumns] = useState(false);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("dark");
  const [copiedExport, setCopiedExport] = useState<string | null>(null);

  /* ─── Conversions (recompute on any input/control change) ─── */
  const conversions = useMemo<ConversionResult[]>(() => {
    return colors.map((row): ConversionResult => {
      const inputOklch = hexToOklch(row.hex);
      if (!inputOklch) {
        return { row, inputOklch: null, output: null, outputHex: "" };
      }
      const output = convertToDark(inputOklch, { hueRotation, boostContrast });
      const outputHex = oklchToHex(output);
      return { row, inputOklch, output, outputHex };
    });
  }, [colors, hueRotation, boostContrast]);

  /* ─── Dark bg reference for contrast indicator ─── */
  const darkBgHex = useMemo<string | null>(() => {
    const valid = conversions.filter((c) => c.inputOklch && c.outputHex);
    if (valid.length === 0) return null;
    // Prefer a row labeled "background"/"bg"
    const bgRow = valid.find((c) => /bg|background/i.test(c.row.label));
    if (bgRow?.outputHex) return bgRow.outputHex;
    // Fallback: the lightest input's dark conversion (becomes the dark bg)
    const lightest = [...valid].sort(
      (a, b) => (b.inputOklch?.L ?? 0) - (a.inputOklch?.L ?? 0),
    )[0];
    return lightest?.outputHex ?? null;
  }, [conversions]);

  const darkBgRgb = useMemo<[number, number, number] | null>(() => {
    if (!darkBgHex) return null;
    return parseHexToRgb01(darkBgHex);
  }, [darkBgHex]);

  /* ─── Live preview palette (light = input, dark = generated) ─── */
  const previewPalette = useMemo(() => {
    const source: { hex: string; label: string }[] =
      previewMode === "light"
        ? colors.map((c) => ({ hex: c.hex, label: c.label }))
        : conversions
            .filter((c) => c.outputHex)
            .map((c) => ({ hex: c.outputHex, label: c.row.label }));

    const find = (...roles: string[]) => {
      for (const role of roles) {
        const hit = source.find((c) =>
          c.label.toLowerCase().includes(role.toLowerCase()),
        );
        if (hit) return hit.hex;
      }
      return null;
    };

    return {
      bg: find("background", "bg"),
      surface: find("surface", "card"),
      text: find("text", "foreground", "fg"),
      muted: find("muted", "secondary"),
      primary: find("primary", "accent", "brand"),
      fallback: source[0]?.hex ?? "#ffffff",
    };
  }, [previewMode, colors, conversions]);

  /* ─── Export payloads (dark palette) ─── */
  const exportData = useMemo(() => {
    const valid = conversions.filter((c) => c.inputOklch && c.output && c.outputHex);
    const hexItems = valid.map((c) => ({
      label: c.row.label,
      hex: c.outputHex as string,
    }));
    const oklchItems = valid.map((c) => ({
      label: c.row.label,
      oklch: c.output as Oklch,
    }));
    return {
      cssVars: formatCssVars(hexItems),
      tailwind: formatTailwind(hexItems),
      oklch: formatOklchVars(oklchItems),
    };
  }, [conversions]);

  /* ─── Handlers ─── */
  const updateRow = useCallback((id: string, patch: Partial<ColorRow>) => {
    setColors((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const addRow = useCallback(() => {
    setColors((prev) => [
      ...prev,
      {
        id: `${NEW_ROW_PREFIX}${Date.now()}-${prev.length}`,
        hex: "#94a3b8",
        label: "",
      },
    ]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setColors((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const loadExample = useCallback(() => {
    setColors(DEFAULT_COLORS.map((c) => ({ ...c })));
    setCssInput(DEFAULT_CSS);
    setParsedCount(null);
    setParseError(null);
  }, []);

  const clearAll = useCallback(() => {
    setColors([]);
    setCssInput("");
    setParsedCount(null);
    setParseError(null);
  }, []);

  const parseCss = useCallback(() => {
    try {
      const extracted = extractColorsFromCss(cssInput);
      if (extracted.length === 0) {
        setParseError("No colors found. Try hex (#rrggbb), rgb(), or hsl() values.");
        setParsedCount(0);
        return;
      }
      setParseError(null);
      setParsedCount(extracted.length);
      setColors(
        extracted.map((c, i) => ({
          id: `${NEW_ROW_PREFIX}parsed-${i}-${Date.now()}`,
          hex: c.hex,
          label: c.label,
        })),
      );
    } catch {
      setParseError("Failed to parse CSS. Please check your input.");
      setParsedCount(0);
    }
  }, [cssInput]);

  const copyExport = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedExport(key);
      setTimeout(() => {
        setCopiedExport((cur) => (cur === key ? null : cur));
      }, 1800);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, []);

  /* ─── Preview role resolution ─── */
  const previewBg = previewPalette.bg ?? previewPalette.fallback;
  const previewText =
    previewPalette.text ?? (previewMode === "dark" ? "#f8fafc" : "#0f172a");
  const previewSurface = previewPalette.surface ?? previewPalette.fallback;
  const previewMuted = previewPalette.muted ?? previewText;
  const previewPrimary =
    previewPalette.primary ?? (previewMode === "dark" ? "#14b8a6" : "#0d9488");

  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MoonStar className="size-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-foreground leading-tight">
            Dark Mode Color Converter
          </h3>
          <p className="text-xs text-muted-foreground">
            Generate a perceptually-tuned dark palette from your light-mode colors via OKLCH.
          </p>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-4 rounded-xl border border-border bg-background/40 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Switch
            id="dmc-hue"
            checked={hueRotation}
            onCheckedChange={setHueRotation}
          />
          <Label htmlFor="dmc-hue" className="text-xs cursor-pointer">
            Hue rotation +15°
          </Label>
        </div>

        <div className="flex items-center gap-2 min-w-[220px] flex-1">
          <Label htmlFor="dmc-boost" className="text-xs whitespace-nowrap">
            Boost contrast
          </Label>
          <Slider
            id="dmc-boost"
            value={[boostContrast]}
            onValueChange={(vals) => setBoostContrast(vals[0] ?? 30)}
            min={0}
            max={100}
            step={1}
            className="flex-1"
            aria-label="Boost contrast"
          />
          <span className="font-mono text-xs text-muted-foreground w-7 text-right tabular-nums">
            {boostContrast}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadExample}>
            <RefreshCw className="size-3.5" />
            Load example
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            <Trash2 className="size-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Tabs: Palette / CSS */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as "palette" | "css")}>
        <TabsList>
          <TabsTrigger value="palette">
            <Palette className="size-3.5" />
            Palette
          </TabsTrigger>
          <TabsTrigger value="css">
            <Code2 className="size-3.5" />
            CSS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="palette" className="mt-3">
          <div className="space-y-2">
            {colors.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <Palette
                  className="size-5 mx-auto mb-2 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">No colors yet.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={addRow}>
                  <Plus className="size-3.5" />
                  Add color
                </Button>
              </div>
            ) : (
              colors.map((row) => {
                const invalid = !hexToOklch(row.hex);
                return (
                  <div
                    key={row.id}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-lg border border-border bg-background/40 p-2"
                  >
                    <ColorSwatch
                      hex={row.hex}
                      onChange={(hex) => updateRow(row.id, { hex })}
                      ariaLabel={`Color picker for ${row.label || "row"}`}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 flex-1 min-w-[160px]">
                      <Input
                        type="text"
                        value={row.hex}
                        onChange={(e) => updateRow(row.id, { hex: e.target.value })}
                        placeholder="#rrggbb"
                        className="font-mono text-sm h-9"
                        aria-label={`Hex value for ${row.label || "row"}`}
                        aria-invalid={invalid}
                      />
                      <Input
                        type="text"
                        value={row.label}
                        onChange={(e) => updateRow(row.id, { label: e.target.value })}
                        placeholder="Label (e.g. Background)"
                        className="text-sm h-9"
                        aria-label={`Label for color ${row.hex}`}
                      />
                    </div>
                    {invalid && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/5 shrink-0"
                      >
                        Invalid
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => removeRow(row.id)}
                      aria-label={`Delete color ${row.label || row.hex}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
          {colors.length > 0 && (
            <Button variant="outline" size="sm" className="mt-2" onClick={addRow}>
              <Plus className="size-3.5" />
              Add color
            </Button>
          )}
        </TabsContent>

        <TabsContent value="css" className="mt-3">
          <Label htmlFor="dmc-css" className="sr-only">
            Paste CSS with color values
          </Label>
          <Textarea
            id="dmc-css"
            value={cssInput}
            onChange={(e) => setCssInput(e.target.value)}
            placeholder={DEFAULT_CSS}
            className="font-mono text-xs min-h-[160px] max-h-[280px]"
            spellCheck={false}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={parseCss}>
              <Code2 className="size-3.5" />
              Parse CSS
            </Button>
            {parsedCount !== null && parseError === null && (
              <Badge variant="secondary" className="text-xs">
                Extracted {parsedCount} color{parsedCount === 1 ? "" : "s"}
              </Badge>
            )}
            {parseError && (
              <Badge
                variant="outline"
                className="text-xs text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/5"
              >
                {parseError}
              </Badge>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Conversion table */}
      <div className="mt-4 rounded-xl border border-border bg-card/30 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">
            {swapColumns ? "Dark \u2190 Light" : "Light \u2192 Dark"}
          </span>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="dmc-swap"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Swap columns
            </Label>
            <Switch
              id="dmc-swap"
              checked={swapColumns}
              onCheckedChange={setSwapColumns}
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto scrollbar-thin px-2">
          {conversions.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No colors to convert. Add a color or load the example.
            </div>
          ) : (
            conversions.map((c) => {
              const inputHex = c.row.hex;
              const inputOklch = c.inputOklch;
              const outputHex = c.outputHex;
              const outputOklch = c.output;
              const invalid = !inputOklch;

              // Contrast indicator (output vs dark-mode background)
              let contrastLabel: string | null = null;
              let contrastClass = "";
              const isBg =
                outputHex && darkBgHex !== null && darkBgHex === outputHex;
              if (invalid) {
                // skip
              } else if (isBg) {
                contrastLabel = "background";
                contrastClass = "bg-muted text-muted-foreground border-border";
              } else if (outputHex && darkBgRgb) {
                const outRgb = parseHexToRgb01(outputHex);
                if (outRgb) {
                  const ratio = contrastRatio(outRgb, darkBgRgb);
                  const tier = contrastTier(ratio);
                  contrastLabel = `${tier.label} \u00b7 ${ratio.toFixed(1)}:1`;
                  contrastClass = tier.className;
                }
              }

              const lightCell = (
                <div className="flex items-center gap-2 min-w-0">
                  <ColorSwatch
                    hex={inputHex}
                    ariaLabel={`Light swatch ${c.row.label || inputHex}`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">
                      {c.row.label || "Untitled"}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {inputHex}
                    </div>
                    {inputOklch ? (
                      <div className="font-mono text-[10px] text-muted-foreground">
                        oklch({inputOklch.L.toFixed(3)} {inputOklch.C.toFixed(3)}{" "}
                        {inputOklch.H.toFixed(3)})
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/5"
                      >
                        Invalid hex
                      </Badge>
                    )}
                  </div>
                </div>
              );

              const darkCell = invalid ? (
                <div className="text-xs text-muted-foreground">—</div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <ColorSwatch
                    hex={outputHex}
                    ariaLabel={`Dark swatch ${c.row.label || outputHex}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground truncate">
                      {c.row.label || "Untitled"}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {outputHex}
                    </div>
                    {outputOklch && (
                      <div className="font-mono text-[10px] text-muted-foreground">
                        oklch({outputOklch.L.toFixed(3)} {outputOklch.C.toFixed(3)}{" "}
                        {outputOklch.H.toFixed(3)})
                      </div>
                    )}
                  </div>
                  {contrastLabel && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px] font-mono",
                        contrastClass,
                      )}
                    >
                      {contrastLabel}
                    </Badge>
                  )}
                </div>
              );

              return (
                <div
                  key={c.row.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 py-2.5 border-b border-border last:border-0 items-center"
                >
                  {swapColumns ? darkCell : lightCell}
                  <ArrowRight
                    className={cn(
                      "size-4 text-muted-foreground mx-auto rotate-90 md:rotate-0",
                      swapColumns && "md:rotate-180",
                    )}
                    aria-hidden="true"
                  />
                  {swapColumns ? lightCell : darkCell}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Live preview */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <SunMoon className="size-3.5 text-muted-foreground" aria-hidden="true" />
            Live preview
          </h4>
          <div className="flex items-center gap-2">
            <Sun
              className={cn(
                "size-3.5",
                previewMode === "light"
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
            <Switch
              id="dmc-preview"
              checked={previewMode === "dark"}
              onCheckedChange={(checked) =>
                setPreviewMode(checked ? "dark" : "light")
              }
              aria-label="Toggle preview between light and dark"
            />
            <MoonStar
              className={cn(
                "size-3.5",
                previewMode === "dark"
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
          </div>
        </div>
        <div
          className="rounded-xl border p-6 transition-colors"
          style={{
            background: previewBg,
            color: previewText,
            borderColor: previewMuted,
          }}
          role="group"
          aria-label={`${previewMode} mode preview`}
        >
          <h5
            className="font-display text-lg font-semibold mb-1.5"
            style={{ color: previewText }}
          >
            The quick brown fox
          </h5>
          <p className="text-sm leading-relaxed mb-3 opacity-90">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md px-4 py-2 text-sm font-medium"
              style={{ background: previewPrimary, color: previewBg }}
            >
              Primary action
            </button>
            <div
              className="rounded-md px-3 py-2 text-xs"
              style={{ background: previewSurface, color: previewMuted }}
            >
              Muted surface text
            </div>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyExport("css", exportData.cssVars)}
          aria-label="Copy dark palette as CSS variables"
        >
          {copiedExport === "css" ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
          CSS variables
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyExport("tw", exportData.tailwind)}
          aria-label="Copy dark palette as Tailwind config"
        >
          {copiedExport === "tw" ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
          Tailwind config
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyExport("oklch", exportData.oklch)}
          aria-label="Copy dark palette as OKLCH CSS variables"
        >
          {copiedExport === "oklch" ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
          OKLCH
        </Button>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Tip: edit any swatch or hex value to recompute the dark palette live.
        Use the OKLCH export for modern browsers and design tokens.
      </p>
    </div>
  );
}
