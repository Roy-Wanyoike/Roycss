"use client";

/**
 * RelativeColorBuilder — a CSS Relative Color Syntax playground.
 *
 * The CSS Color Module Level 5 introduces "relative color syntax"
 * (Baseline 2024): you can derive a new color FROM an existing color
 * using channel math:
 *
 *   rgb(from red r g b / 0.5)              // halve the alpha
 *   oklch(from var(--brand) calc(l + 0.1) c h)   // lighten by 0.1
 *   hsl(from #3498db calc(h + 180) s l)    // rotate hue 180° (complement)
 *
 * The browser parses the source color into the channels of the OUTPUT
 * color space (r/g/b, h/s/l, l/c/h, or l/a/b), then each channel
 * expression is evaluated with those channel values bound to the channel
 * letters (r, g, b, h, s, l, c, a, b, alpha). The expression can be a
 * bare channel letter (identity) or a `calc()` expression like
 * `calc(l + 0.1)`.
 *
 * This tool lets developers:
 *   - Pick a source color (native color picker or hex input).
 *   - Choose an output color space: rgb, hsl, oklch, oklab.
 *   - Edit the channel math for each of the 3 channels + alpha.
 *   - Quickly nudge each channel with a slider (-100 to +100 for
 *     integer-range channels; ±0.5 for fractional channels).
 *   - See a live preview: source swatch → arrow → derived swatch, with
 *     the resolved hex computed locally.
 *   - Copy the generated CSS, ready to paste into a stylesheet.
 *   - Load one of six presets (lighten, darken, complementary-rotate-hue,
 *     saturate, desaturate, opacity-half).
 *
 * Color math (all implemented locally — no color library):
 *   - hex ↔ 8-bit sRGB ↔ linear sRGB (gamma decode/encode per sRGB transfer)
 *   - linear sRGB (D65) → XYZ → LMS (cube-root) → OKLab → OKLCH
 *     (Björn Ottosson's OK color space — https://bottosson.github.io/posts/oklab/)
 *   - sRGB ↔ HSL (the classic 1978 algorithm)
 *   - calc() parser supports identity, `calc(ch ± N)`, `calc(ch * N)`,
 *     `calc(ch / N)`, and a bare numeric literal — anything else falls
 *     back to identity so the preview degrades gracefully.
 *
 * Constraints: TS strict, zero `any`, zero `console.log`. Self-contained
 * (no props, no external state, no network). Responsive within `max-w-2xl`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Copy,
  Check,
  Globe,
  ArrowRight,
  Pipette,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type OutputSpace = "rgb" | "hsl" | "oklch" | "oklab";

interface ChannelDef {
  key: string;
  label: string;
  description: string;
  min: number;
  max: number;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  unit?: string;
  fmt: (v: number) => string;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  sourceHex: string;
  outputSpace: OutputSpace;
  channels: [string, string, string];
  alphaExpr: string;
}

interface ResolvedColor {
  hex: string;
  alpha: number;
  valid: boolean;
}

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

const CHANNELS: Record<OutputSpace, ChannelDef[]> = {
  rgb: [
    {
      key: "r",
      label: "R",
      description: "Red channel (0–255).",
      min: 0,
      max: 255,
      sliderMin: -100,
      sliderMax: 100,
      sliderStep: 1,
      fmt: (v) => v.toFixed(0),
    },
    {
      key: "g",
      label: "G",
      description: "Green channel (0–255).",
      min: 0,
      max: 255,
      sliderMin: -100,
      sliderMax: 100,
      sliderStep: 1,
      fmt: (v) => v.toFixed(0),
    },
    {
      key: "b",
      label: "B",
      description: "Blue channel (0–255).",
      min: 0,
      max: 255,
      sliderMin: -100,
      sliderMax: 100,
      sliderStep: 1,
      fmt: (v) => v.toFixed(0),
    },
  ],
  hsl: [
    {
      key: "h",
      label: "H",
      description: "Hue angle (0–360°).",
      min: 0,
      max: 360,
      sliderMin: -180,
      sliderMax: 180,
      sliderStep: 1,
      unit: "°",
      fmt: (v) => v.toFixed(0),
    },
    {
      key: "s",
      label: "S",
      description: "Saturation (0–100%).",
      min: 0,
      max: 100,
      sliderMin: -100,
      sliderMax: 100,
      sliderStep: 1,
      unit: "%",
      fmt: (v) => v.toFixed(0),
    },
    {
      key: "l",
      label: "L",
      description: "Lightness (0–100%).",
      min: 0,
      max: 100,
      sliderMin: -100,
      sliderMax: 100,
      sliderStep: 1,
      unit: "%",
      fmt: (v) => v.toFixed(0),
    },
  ],
  oklch: [
    {
      key: "l",
      label: "L",
      description: "Perceived lightness (0–1).",
      min: 0,
      max: 1,
      sliderMin: -0.5,
      sliderMax: 0.5,
      sliderStep: 0.01,
      fmt: (v) => v.toFixed(3),
    },
    {
      key: "c",
      label: "C",
      description: "Chroma (~0–0.4).",
      min: 0,
      max: 0.4,
      sliderMin: -0.2,
      sliderMax: 0.2,
      sliderStep: 0.01,
      fmt: (v) => v.toFixed(3),
    },
    {
      key: "h",
      label: "H",
      description: "Hue angle (0–360°).",
      min: 0,
      max: 360,
      sliderMin: -180,
      sliderMax: 180,
      sliderStep: 1,
      unit: "°",
      fmt: (v) => v.toFixed(0),
    },
  ],
  oklab: [
    {
      key: "l",
      label: "L",
      description: "Perceived lightness (0–1).",
      min: 0,
      max: 1,
      sliderMin: -0.5,
      sliderMax: 0.5,
      sliderStep: 0.01,
      fmt: (v) => v.toFixed(3),
    },
    {
      key: "a",
      label: "a",
      description: "Green–red axis (~−0.4 to 0.4).",
      min: -0.4,
      max: 0.4,
      sliderMin: -0.2,
      sliderMax: 0.2,
      sliderStep: 0.01,
      fmt: (v) => v.toFixed(3),
    },
    {
      key: "b",
      label: "b",
      description: "Blue–yellow axis (~−0.4 to 0.4).",
      min: -0.4,
      max: 0.4,
      sliderMin: -0.2,
      sliderMax: 0.2,
      sliderStep: 0.01,
      fmt: (v) => v.toFixed(3),
    },
  ],
};

const ALPHA_CHANNEL: ChannelDef = {
  key: "alpha",
  label: "α",
  description: "Alpha channel (0–1). Defaults to the source color's alpha.",
  min: 0,
  max: 1,
  sliderMin: -1,
  sliderMax: 1,
  sliderStep: 0.05,
  fmt: (v) => v.toFixed(2),
};

const PRESETS: Preset[] = [
  {
    id: "lighten",
    name: "Lighten",
    description: "OKLCH L + 0.1 — perceived brightness boost.",
    sourceHex: "#3498db",
    outputSpace: "oklch",
    channels: ["calc(l + 0.1)", "c", "h"],
    alphaExpr: "alpha",
  },
  {
    id: "darken",
    name: "Darken",
    description: "OKLCH L − 0.1 — perceived brightness cut.",
    sourceHex: "#3498db",
    outputSpace: "oklch",
    channels: ["calc(l - 0.1)", "c", "h"],
    alphaExpr: "alpha",
  },
  {
    id: "complementary",
    name: "Complementary",
    description: "Hue rotated 180° — picks the opposite color.",
    sourceHex: "#e74c3c",
    outputSpace: "oklch",
    channels: ["l", "c", "calc(h + 180)"],
    alphaExpr: "alpha",
  },
  {
    id: "saturate",
    name: "Saturate",
    description: "OKLCH C + 0.05 — more vivid.",
    sourceHex: "#f1c40f",
    outputSpace: "oklch",
    channels: ["l", "calc(c + 0.05)", "h"],
    alphaExpr: "alpha",
  },
  {
    id: "desaturate",
    name: "Desaturate",
    description: "OKLCH C − 0.05 — more muted.",
    sourceHex: "#f1c40f",
    outputSpace: "oklch",
    channels: ["l", "calc(c - 0.05)", "h"],
    alphaExpr: "alpha",
  },
  {
    id: "opacity-half",
    name: "Opacity ½",
    description: "Halve the alpha — useful for overlays.",
    sourceHex: "#9b59b6",
    outputSpace: "rgb",
    channels: ["r", "g", "b"],
    alphaExpr: "calc(alpha * 0.5)",
  },
];

// ============================================================
// Color math
// ============================================================

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(v).toString(16).padStart(2, "0"))
      .join("")
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308
    ? c * 12.92
    : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function linearRgbToXyz(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  return [
    0.4123907992659593 * r + 0.357584339383878 * g + 0.1804807884018343 * b,
    0.21263900587151027 * r + 0.715168678767756 * g + 0.07219231536073371 * b,
    0.01933081871559182 * r + 0.11919477979462598 * g + 0.9505321522496607 * b,
  ];
}

function xyzToLinearRgb(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  return [
    3.2409699419045226 * x - 1.5373831775700935 * y - 0.4986107602930034 * z,
    -0.9692436362808796 * x + 1.8759675015077202 * y + 0.04155505740717561 * z,
    0.05563007969699366 * x - 0.20397695888897652 * y + 1.0569715142428786 * z,
  ];
}

function xyzToOklab(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  const l = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
  const m = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
  const s = 0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

function oklabToXyz(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    1.2270138511 * l - 0.5577999807 * m + 0.281256149 * s,
    -0.0405801784 * l + 1.1122568696 * m - 0.0716766787 * s,
    -0.0763812845 * l - 0.4214819784 * m + 0.496866849 * s,
  ];
}

function oklabToOklch(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

function oklchToOklab(
  L: number,
  C: number,
  H: number,
): [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) {
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
    } else if (max === gn) {
      h = (bn - rn) / d + 2;
    } else {
      h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToRgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hP = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hP % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hP < 1) {
    r1 = c;
    g1 = x;
  } else if (hP < 2) {
    r1 = x;
    g1 = c;
  } else if (hP < 3) {
    g1 = c;
    b1 = x;
  } else if (hP < 4) {
    g1 = x;
    b1 = c;
  } else if (hP < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }
  const m = lN - c / 2;
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

// ============================================================
// Calc parsing
// ============================================================

/**
 * Evaluate a channel expression against the source channel value.
 * Supports: identity (`r`), `calc(ch + N)`, `calc(ch - N)`,
 * `calc(ch * N)`, `calc(ch / N)`, and a bare numeric literal.
 * Anything else falls back to the identity (source channel value).
 */
function applyExpression(expr: string, channelValue: number): number {
  const trimmed = expr.trim();
  if (trimmed === "") return channelValue;
  // Identity (bare channel letter / "alpha")
  if (/^[a-z]+$/i.test(trimmed)) return channelValue;
  // calc(ch OP N)
  const m = /^calc\(\s*([a-z]+)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)\s*\)$/i.exec(
    trimmed,
  );
  if (m) {
    const op = m[2];
    const num = parseFloat(m[3]);
    switch (op) {
      case "+":
        return channelValue + num;
      case "-":
        return channelValue - num;
      case "*":
        return channelValue * num;
      case "/":
        return channelValue / num;
    }
  }
  // Bare numeric literal
  const lit = /^(-?\d+(?:\.\d+)?)$/.exec(trimmed);
  if (lit) return parseFloat(lit[1]);
  // Unknown — identity
  return channelValue;
}

/** Parse an additive calc expression to extract the slider delta. */
function deltaFromExpr(expr: string, channel: string): number {
  const trimmed = expr.trim();
  if (trimmed === channel) return 0;
  const re = new RegExp(
    `^calc\\(\\s*${channel}\\s*([+\\-])\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\)$`,
    "i",
  );
  const m = re.exec(trimmed);
  if (!m) return 0;
  const num = parseFloat(m[2]);
  return m[1] === "+" ? num : -num;
}

/** Build an additive calc expression from a slider delta. */
function exprFromDelta(channel: string, delta: number): string {
  if (delta === 0) return channel;
  if (delta > 0) return `calc(${channel} + ${delta})`;
  return `calc(${channel} - ${Math.abs(delta)})`;
}

// ============================================================
// Color resolution
// ============================================================

function sourceChannelsFor(
  space: OutputSpace,
  rgb: [number, number, number],
): [number, number, number] {
  switch (space) {
    case "rgb":
      return rgb;
    case "hsl":
      return rgbToHsl(rgb[0], rgb[1], rgb[2]);
    case "oklch": {
      const [r, g, b] = rgb;
      const lr = srgbToLinear(r / 255);
      const lg = srgbToLinear(g / 255);
      const lb = srgbToLinear(b / 255);
      const xyz = linearRgbToXyz(lr, lg, lb);
      const lab = xyzToOklab(xyz[0], xyz[1], xyz[2]);
      return oklabToOklch(lab[0], lab[1], lab[2]);
    }
    case "oklab": {
      const [r, g, b] = rgb;
      const lr = srgbToLinear(r / 255);
      const lg = srgbToLinear(g / 255);
      const lb = srgbToLinear(b / 255);
      const xyz = linearRgbToXyz(lr, lg, lb);
      return xyzToOklab(xyz[0], xyz[1], xyz[2]);
    }
  }
}

function channelsToRgb(
  space: OutputSpace,
  channels: [number, number, number],
): [number, number, number] {
  switch (space) {
    case "rgb":
      return channels;
    case "hsl":
      return hslToRgb(channels[0], channels[1], channels[2]);
    case "oklch": {
      const lab = oklchToOklab(channels[0], channels[1], channels[2]);
      const xyz = oklabToXyz(lab[0], lab[1], lab[2]);
      const lin = xyzToLinearRgb(xyz[0], xyz[1], xyz[2]);
      return [
        linearToSrgb(lin[0]) * 255,
        linearToSrgb(lin[1]) * 255,
        linearToSrgb(lin[2]) * 255,
      ];
    }
    case "oklab": {
      const xyz = oklabToXyz(channels[0], channels[1], channels[2]);
      const lin = xyzToLinearRgb(xyz[0], xyz[1], xyz[2]);
      return [
        linearToSrgb(lin[0]) * 255,
        linearToSrgb(lin[1]) * 255,
        linearToSrgb(lin[2]) * 255,
      ];
    }
  }
}

function resolveColor(
  sourceHex: string,
  space: OutputSpace,
  channelExprs: [string, string, string],
  alphaExpr: string,
): ResolvedColor {
  const rgb = hexToRgb(sourceHex);
  if (!rgb) return { hex: "#000000", alpha: 1, valid: false };
  const sourceChannels = sourceChannelsFor(space, rgb);
  const outChannels: [number, number, number] = [
    applyExpression(channelExprs[0], sourceChannels[0]),
    applyExpression(channelExprs[1], sourceChannels[1]),
    applyExpression(channelExprs[2], sourceChannels[2]),
  ];
  const finalRgb = channelsToRgb(space, outChannels);
  const alpha = Math.max(0, Math.min(1, applyExpression(alphaExpr, 1)));
  return {
    hex: rgbToHex(finalRgb[0], finalRgb[1], finalRgb[2]),
    alpha,
    valid: true,
  };
}

// ============================================================
// Component
// ============================================================

export function RelativeColorBuilder() {
  const [sourceHex, setSourceHex] = useState("#3498db");
  const [outputSpace, setOutputSpace] = useState<OutputSpace>("oklch");
  const [channelExprs, setChannelExprs] = useState<[string, string, string]>([
    "calc(l + 0.1)",
    "c",
    "h",
  ]);
  const [alphaExpr, setAlphaExpr] = useState("alpha");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const channelDefs = CHANNELS[outputSpace];

  const sourceRgb = useMemo(() => hexToRgb(sourceHex), [sourceHex]);
  const sourceValid = sourceRgb !== null;

  const sourceChannels = useMemo<[number, number, number] | null>(() => {
    if (!sourceRgb) return null;
    return sourceChannelsFor(outputSpace, sourceRgb);
  }, [sourceRgb, outputSpace]);

  const derived = useMemo(
    () => resolveColor(sourceHex, outputSpace, channelExprs, alphaExpr),
    [sourceHex, outputSpace, channelExprs, alphaExpr],
  );

  const generatedCss = useMemo(() => {
    if (!sourceValid) {
      return "/* invalid source color — fix the hex input above */";
    }
    const parts = channelExprs.map((e) => e.trim() || "?").join(" ");
    const alpha = alphaExpr.trim();
    let css = `${outputSpace}(from ${sourceHex} ${parts}`;
    if (alpha && alpha !== "alpha") css += ` / ${alpha}`;
    css += `);`;
    return `.derived {\n  color: ${css}\n}`;
  }, [sourceValid, outputSpace, channelExprs, alphaExpr, sourceHex]);

  const handleOutputSpaceChange = (next: OutputSpace) => {
    setOutputSpace(next);
    const defaults = CHANNELS[next].map((c) => c.key) as [string, string, string];
    setChannelExprs(defaults);
    setAlphaExpr("alpha");
  };

  const handlePreset = (preset: Preset) => {
    setSourceHex(preset.sourceHex);
    setOutputSpace(preset.outputSpace);
    setChannelExprs(preset.channels);
    setAlphaExpr(preset.alphaExpr);
  };

  const handleChannelExprChange = (index: number, expr: string) => {
    setChannelExprs((prev) => {
      const next: [string, string, string] = [prev[0], prev[1], prev[2]];
      next[index] = expr;
      return next;
    });
  };

  const handleChannelSlider = (index: number, delta: number) => {
    const key = channelDefs[index].key;
    handleChannelExprChange(index, exprFromDelta(key, delta));
  };

  const handleAlphaSlider = (delta: number) => {
    setAlphaExpr(exprFromDelta("alpha", delta));
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }, [generatedCss]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* ── Header ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wand2 className="size-5 text-primary" />
                Relative Color Builder
              </CardTitle>
              <CardDescription>
                Derive new colors from a source with CSS Relative Color Syntax
                (Baseline 2024):{" "}
                <code className="font-mono text-xs">
                  oklch(from var(--brand) calc(l + 0.1) c h)
                </code>
                .
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Globe className="size-3" /> Baseline 2024
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* ── Source + output space ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Source &amp; output</CardTitle>
          <CardDescription>
            Pick a source color and choose the output color space — that
            determines which channels you can manipulate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rc-source">Source color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={sourceValid ? sourceHex : "#000000"}
                  onChange={(e) => setSourceHex(e.target.value)}
                  className="size-10 shrink-0 cursor-pointer rounded-md border bg-transparent p-0"
                  aria-label="Source color picker"
                />
                <Input
                  id="rc-source"
                  value={sourceHex}
                  onChange={(e) => setSourceHex(e.target.value)}
                  className={cn("font-mono", !sourceValid && "border-destructive")}
                  placeholder="#3498db"
                  aria-invalid={!sourceValid}
                />
              </div>
              <p
                className={cn(
                  "text-xs",
                  sourceValid ? "text-muted-foreground" : "text-destructive",
                )}
              >
                {sourceValid
                  ? "Hex value of the source color."
                  : "Enter a valid hex color (3 or 6 digits)."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Output color space</Label>
              <Select
                value={outputSpace}
                onValueChange={(v) =>
                  handleOutputSpaceChange(v as OutputSpace)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rgb">
                    <span className="font-mono">rgb()</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      red, green, blue
                    </span>
                  </SelectItem>
                  <SelectItem value="hsl">
                    <span className="font-mono">hsl()</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      hue, saturation, lightness
                    </span>
                  </SelectItem>
                  <SelectItem value="oklch">
                    <span className="font-mono">oklch()</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      lightness, chroma, hue
                    </span>
                  </SelectItem>
                  <SelectItem value="oklab">
                    <span className="font-mono">oklab()</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      lightness, a, b
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The browser converts the source into this space&apos;s channels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Channel math editors ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Channel math</CardTitle>
          <CardDescription>
            Edit each channel&apos;s expression or drag the slider for a quick
            additive delta. Use <code className="font-mono text-xs">calc()</code>{" "}
            for arithmetic — the channel letter is the source value.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channelDefs.map((c, i) => {
            const expr = channelExprs[i];
            const delta = deltaFromExpr(expr, c.key);
            const sourceVal = sourceChannels?.[i] ?? 0;
            const resolvedVal = applyExpression(expr, sourceVal);
            return (
              <div
                key={c.key}
                className="space-y-2 rounded-md border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {c.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {c.description}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {c.fmt(sourceVal)}
                    <ArrowRight className="mx-1 inline size-3 align-middle" />
                    <span className="text-foreground">
                      {c.fmt(resolvedVal)}
                    </span>
                  </span>
                </div>
                <Input
                  value={expr}
                  onChange={(e) => handleChannelExprChange(i, e.target.value)}
                  className="font-mono text-sm"
                  aria-label={`${c.label} channel expression`}
                />
                <div className="flex items-center gap-3">
                  <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                    {delta > 0 ? `+${c.fmt(delta)}` : c.fmt(delta)}
                  </span>
                  <Slider
                    value={[delta]}
                    min={c.sliderMin}
                    max={c.sliderMax}
                    step={c.sliderStep}
                    onValueChange={(v) =>
                      handleChannelSlider(i, v[0] ?? 0)
                    }
                    className="flex-1"
                    aria-label={`${c.label} delta slider`}
                  />
                </div>
              </div>
            );
          })}

          {/* Alpha channel */}
          <div className="space-y-2 rounded-md border border-dashed p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {ALPHA_CHANNEL.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {ALPHA_CHANNEL.description}
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                1.00
                <ArrowRight className="mx-1 inline size-3 align-middle" />
                <span className="text-foreground">
                  {ALPHA_CHANNEL.fmt(applyExpression(alphaExpr, 1))}
                </span>
              </span>
            </div>
            <Input
              value={alphaExpr}
              onChange={(e) => setAlphaExpr(e.target.value)}
              className="font-mono text-sm"
              aria-label="Alpha channel expression"
            />
            <div className="flex items-center gap-3">
              <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                {(() => {
                  const d = deltaFromExpr(alphaExpr, "alpha");
                  return d > 0
                    ? `+${ALPHA_CHANNEL.fmt(d)}`
                    : ALPHA_CHANNEL.fmt(d);
                })()}
              </span>
              <Slider
                value={[deltaFromExpr(alphaExpr, "alpha")]}
                min={ALPHA_CHANNEL.sliderMin}
                max={ALPHA_CHANNEL.sliderMax}
                step={ALPHA_CHANNEL.sliderStep}
                onValueChange={(v) => handleAlphaSlider(v[0] ?? 0)}
                className="flex-1"
                aria-label="Alpha delta slider"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Preview ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live preview</CardTitle>
          <CardDescription>
            The derived color is computed locally — same pipeline the browser
            uses, so what you see is what you get.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div
                className="size-24 rounded-md border shadow-sm"
                style={{
                  background: sourceValid ? sourceHex : "#cccccc",
                }}
              />
              <span className="font-mono text-xs">
                {sourceValid ? sourceHex : "—"}
              </span>
              <span className="text-xs text-muted-foreground">source</span>
            </div>
            <ArrowRight className="size-6 text-muted-foreground" />
            <div className="flex flex-col items-center gap-2">
              <div
                className="size-24 rounded-md border shadow-sm"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "0 0, 0 6px, 6px -6px, 6px 0",
                }}
              >
                <div
                  className="size-full rounded-md"
                  style={{
                    background: hexToRgba(derived.hex, derived.alpha),
                  }}
                />
              </div>
              <span className="font-mono text-xs">{derived.hex}</span>
              <span className="text-xs text-muted-foreground">
                derived (α {derived.alpha.toFixed(2)})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Presets ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Presets</CardTitle>
          <CardDescription>
            Six ready-to-go recipes. Click to load — then tweak.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset)}
              className="flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="font-medium">{preset.name}</span>
              <span className="text-xs text-muted-foreground">
                {preset.description}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* ── Output ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">Generated CSS</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="gap-1.5"
              disabled={!sourceValid}
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed">
            <code>{generatedCss}</code>
          </pre>
        </CardContent>
      </Card>

      {/* ── Browser support ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Browser support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Globe className="size-3" /> Baseline 2024
            </Badge>
            <Badge variant="outline">Chrome 119+</Badge>
            <Badge variant="outline">Safari 16.4+</Badge>
            <Badge variant="outline">Firefox 113+ (partial)</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Firefox shipped relative color syntax in 113 but only enabled it by
            default in 128, and some early versions had bugs with{" "}
            <code className="font-mono">oklch()</code> channel math. Test
            cross-browser before shipping to production.
          </p>
        </CardContent>
      </Card>

      {/* ── Channel reference ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pipette className="size-4 text-primary" />
            Channel reference
          </CardTitle>
          <CardDescription>
            Every channel letter the relative color syntax understands, the
            color spaces it applies to, and its range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Spaces</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CHANNEL_REFERENCE.map((row) => (
                <TableRow key={row.letter}>
                  <TableCell className="font-mono">{row.letter}</TableCell>
                  <TableCell className="text-xs">{row.spaces}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.description}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.range}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Channel reference data
// ============================================================

interface ChannelReferenceRow {
  letter: string;
  spaces: string;
  description: string;
  range: string;
}

const CHANNEL_REFERENCE: ChannelReferenceRow[] = [
  { letter: "r", spaces: "rgb", description: "Red", range: "0–255" },
  { letter: "g", spaces: "rgb", description: "Green", range: "0–255" },
  { letter: "b", spaces: "rgb, oklab", description: "Blue / blue–yellow axis", range: "0–255 / ±0.4" },
  { letter: "h", spaces: "hsl, oklch", description: "Hue angle", range: "0–360°" },
  { letter: "s", spaces: "hsl", description: "Saturation", range: "0–100%" },
  { letter: "l", spaces: "hsl, oklch, oklab", description: "Lightness / perceived L", range: "0–100% or 0–1" },
  { letter: "c", spaces: "oklch", description: "Chroma (colorfulness)", range: "0+" },
  { letter: "a", spaces: "oklab", description: "Green–red axis", range: "±0.4" },
  { letter: "alpha", spaces: "all", description: "Alpha channel", range: "0–1" },
  { letter: "w", spaces: "color()", description: "Whiteness (LCH / Lab)", range: "0–1" },
  { letter: "x", spaces: "color(xyz)", description: "X (CIE XYZ)", range: "0–1" },
  { letter: "y", spaces: "color(xyz)", description: "Y (luminance, CIE XYZ)", range: "0–1" },
  { letter: "z", spaces: "color(xyz)", description: "Z (CIE XYZ)", range: "0–1" },
];


