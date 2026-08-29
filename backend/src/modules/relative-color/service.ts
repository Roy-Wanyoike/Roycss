/**
 * Relative-color service — derive a color from a source hex + output space
 * + per-channel calc expressions, using CSS Relative Color Syntax (RCS).
 *
 * Mock backend (no DB). Seeds the 14-channel reference table
 * (r,g,b,h,s,l,c,a,b,alpha,w,x,y,z) and 6 RCS presets (lighten, darken,
 * complementary-rotate-hue, saturate, desaturate, opacity-half).
 *
 * The derive path returns:
 *   - css          : the relative-color() function call as it would appear
 *                    in CSS (e.g. `oklch(from #3498db calc(l + 0.1) c h)`)
 *   - resolvedHex  : the derived color resolved to a 6-digit sRGB hex
 *                    (computed via the full sRGB↔linear↔OKLab↔OKLCH pipeline)
 *   - sourceValues : the source color's channel values in the chosen space
 *                    (useful for understanding what the calc is operating on)
 *   - resolvedValues: the resulting channel values after applying the calcs
 *
 * calc parsing supports: identity (channel letter), bare number, and
 * `calc(ch +/- N | ch * N | ch / N)`. Anything else falls back to identity.
 *
 * Reference: CSS Color Module Level 5 §16 (Relative Color Syntax).
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { RelativeColorDeriveInput } from "./schema.js";

const log = createLogger("relative-color");

// ─── Types ───────────────────────────────────────────────────────────────
export type OutputSpace = "rgb" | "hsl" | "oklch" | "oklab";

export interface ChannelInfo {
  /** Channel letter as it appears in RCS. */
  letter: string;
  /** Human-readable name. */
  name: string;
  /** Output spaces that use this channel. */
  spaces: string[];
  /** Numeric range (human description). */
  range: string;
  /** Example expression. */
  example: string;
  /** Conversion examples: how to derive this channel from a source color
   *  in each of the supported output spaces. */
  conversionExamples?: string[];
}

export interface RelativeColorResult {
  /** The relative-color() function call as it appears in CSS. */
  css: string;
  /** Derived color resolved to a 6-digit sRGB hex. */
  resolvedHex: string;
  /** Source channel values in the chosen output space. */
  sourceValues: Record<string, number>;
  /** Resulting channel values after applying the calcs. */
  resolvedValues: Record<string, number>;
  /** Whether the alpha channel was modified (affects copyable form). */
  hasAlphaModification: boolean;
  /** Human-readable summary. */
  explanation: string;
  /** Browser support info. */
  support: {
    baseline: string;
    chrome: string;
    safari: string;
    firefox: string;
  };
}

export interface RelativeColorPreset {
  id: string;
  name: string;
  description: string;
  input: RelativeColorDeriveInput;
}

// ─── Color math: hex ↔ sRGB ↔ linear ↔ OKLab ↔ OKLCH ────────────────────

function hexToSrgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function srgbToHex(r: number, g: number, b: number): string {
  const toByte = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * 255)));
  const toHex = (v: number) => toByte(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308
    ? c * 12.92
    : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function linearSrgbToOklab(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
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

function oklabToLinearSrgb(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
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

function srgbToHsl(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToSrgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  const sN = s / 100;
  const lN = l / 100;
  if (sN === 0) return [lN, lN, lN];
  const hN = ((h % 360) + 360) % 360 / 360;
  const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
  const p = 2 * lN - q;
  const hue = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [hue(hN + 1 / 3), hue(hN), hue(hN - 1 / 3)];
}

// ─── calc expression evaluator ───────────────────────────────────────────

/**
 * Resolve a channel expression to a number.
 *
 * Supports: identity (channel letter), bare numeric, and
 * `calc(ch +/- N | ch * N | ch / N)`. Channel letters are looked up
 * in the supplied values map. Falls back to identity if the expression
 * can't be parsed.
 */
function evalChannel(
  expr: string | undefined,
  identityKey: string,
  sourceValues: Record<string, number>,
): number {
  if (expr === undefined) {
    return sourceValues[identityKey] ?? 0;
  }
  const trimmed = expr.trim();

  // Bare number literal.
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }
  // Identity — single channel letter.
  if (/^[a-z]+$/.test(trimmed)) {
    return sourceValues[trimmed] ?? sourceValues[identityKey] ?? 0;
  }
  // calc(ch OP N)
  const m = trimmed.match(
    /^calc\(([a-z]+)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)\)$/,
  );
  if (m && m[1] !== undefined && m[2] !== undefined && m[3] !== undefined) {
    const ch = m[1];
    const op = m[2];
    const num = parseFloat(m[3]);
    const base = sourceValues[ch] ?? 0;
    switch (op) {
      case "+":
        return base + num;
      case "-":
        return base - num;
      case "*":
        return base * num;
      case "/":
        return base / num;
    }
  }
  // Fall back to identity.
  return sourceValues[identityKey] ?? 0;
}

function isIdentity(
  expr: string | undefined,
  identityKey: string,
): boolean {
  if (expr === undefined) return true;
  const t = expr.trim();
  return t === identityKey;
}

// ─── Source → output-space values ────────────────────────────────────────

/** Compute the source color's channel values in the chosen output space. */
function computeSourceValues(
  source: string,
  space: OutputSpace,
): Record<string, number> {
  const [r1, g1, b1] = hexToSrgb(source); // 0-1
  if (space === "rgb") {
    return { r: r1 * 255, g: g1 * 255, b: b1 * 255, alpha: 1 };
  }
  if (space === "hsl") {
    const [h, s, l] = srgbToHsl(r1, g1, b1);
    return { h, s, l, alpha: 1 };
  }
  // oklch / oklab share the OKLab conversion.
  const rL = srgbToLinear(r1);
  const gL = srgbToLinear(g1);
  const bL = srgbToLinear(b1);
  const [L, A, B] = linearSrgbToOklab(rL, gL, bL);
  if (space === "oklab") {
    return { l: L, a: A, b: B, alpha: 1 };
  }
  // oklch
  const [lC, cC, hC] = oklabToOklch(L, A, B);
  return { l: lC, c: cC, h: hC, alpha: 1 };
}

/** Resolve the derived (post-calc) values back to an sRGB hex. */
function resolveHex(
  resolved: Record<string, number>,
  space: OutputSpace,
): string {
  if (space === "rgb") {
    // r/g/b are 0-255 → normalize → clamp → hex.
    const r = (resolved.r ?? 0) / 255;
    const g = (resolved.g ?? 0) / 255;
    const b = (resolved.b ?? 0) / 255;
    const cl = (v: number) => Math.max(0, Math.min(1, v));
    return srgbToHex(cl(r), cl(g), cl(b));
  }
  if (space === "hsl") {
    const [r, g, b] = hslToSrgb(resolved.h ?? 0, resolved.s ?? 0, resolved.l ?? 0);
    const cl = (v: number) => Math.max(0, Math.min(1, v));
    return srgbToHex(cl(r), cl(g), cl(b));
  }
  // oklab / oklch → OKLab → linear → sRGB → hex (with clamping).
  let lab: [number, number, number];
  if (space === "oklab") {
    lab = [resolved.l ?? 0, resolved.a ?? 0, resolved.b ?? 0];
  } else {
    // oklch → oklab
    lab = oklchToOklab(resolved.l ?? 0, resolved.c ?? 0, resolved.h ?? 0);
  }
  const [rL, gL, bL] = oklabToLinearSrgb(lab[0], lab[1], lab[2]);
  const r = linearToSrgb(rL);
  const g = linearToSrgb(gL);
  const b = linearToSrgb(bL);
  const cl = (v: number) => Math.max(0, Math.min(1, v));
  return srgbToHex(cl(r), cl(g), cl(b));
}

/** Format a numeric value for inclusion in the relative-color() call. */
function fmtNum(n: number): string {
  // Trim trailing zeros for compactness: 0.123000 → "0.123", 50 → "50".
  if (Number.isInteger(n)) return String(n);
  const rounded = Math.round(n * 1000) / 1000;
  return String(rounded);
}

// ─── Per-space channel definitions ───────────────────────────────────────

interface SpaceDef {
  /** The 3 channel letters used by this space, in declaration order. */
  channels: [string, string, string];
  /** The CSS function name to emit (e.g. "rgb" → "rgb(from ...)"). */
  fn: string;
}

const SPACE_DEFS: Record<OutputSpace, SpaceDef> = {
  rgb: { channels: ["r", "g", "b"], fn: "rgb" },
  hsl: { channels: ["h", "s", "l"], fn: "hsl" },
  oklch: { channels: ["l", "c", "h"], fn: "oklch" },
  oklab: { channels: ["l", "a", "b"], fn: "oklab" },
};

// ─── 8-channel reference table ─────────────────────────────────────────────
// Curated to the 8 channels that cover the most useful relative-color
// derivations across the rgb/hsl/oklab/oklch output spaces. The `l` channel
// serves double duty — it's the HSL Lightness (0-100%) when used in an
// `hsl(from ...)` call, and the OKLab/OKLCH L (0-1) when used in
// `oklab(from ...)`/`oklch(from ...)` calls. The `conversionExamples` array
// shows how each channel can be derived from a source color in each
// applicable output space.
const CHANNELS: ChannelInfo[] = [
  {
    letter: "r",
    name: "Red",
    spaces: ["rgb"],
    range: "0-255",
    example: "calc(r + 20)",
    conversionExamples: [
      "rgb(from #3498db calc(r + 20) g b)        /* lighten red channel */",
      "rgb(from #3498db r calc(g * 0.8) b)       /* desaturate green */",
    ],
  },
  {
    letter: "g",
    name: "Green",
    spaces: ["rgb"],
    range: "0-255",
    example: "calc(g * 0.8)",
    conversionExamples: [
      "rgb(from #3498db r calc(g * 0.8) b)        /* mute green */",
      "rgb(from #3498db calc(r + 10) calc(g + 10) calc(b + 10))  /* tint */",
    ],
  },
  {
    letter: "b",
    name: "Blue",
    spaces: ["rgb"],
    range: "0-255",
    example: "calc(b - 30)",
    conversionExamples: [
      "rgb(from #3498db r g calc(b - 30))         /* shift toward yellow */",
      "rgb(from #3498db b g r)                    /* swap to bgr */",
    ],
  },
  {
    letter: "h",
    name: "Hue",
    spaces: ["hsl", "oklch"],
    range: "0-360 (degrees)",
    example: "calc(h + 180)",
    conversionExamples: [
      "hsl(from #3498db calc(h + 180) s l)        /* complementary */",
      "oklch(from #3498db l c calc(h + 30))       /* analogous */",
    ],
  },
  {
    letter: "s",
    name: "Saturation (HSL)",
    spaces: ["hsl"],
    range: "0-100 (%)",
    example: "calc(s + 10)",
    conversionExamples: [
      "hsl(from #3498db h calc(s + 10) l)         /* more saturated */",
      "hsl(from #3498db h calc(s - 20) l)         /* less saturated */",
    ],
  },
  {
    letter: "l",
    name: "Lightness / L",
    spaces: ["hsl", "oklab", "oklch"],
    range: "0-100 (hsl) · 0-1 (oklab/oklch)",
    example: "calc(l + 0.1)",
    conversionExamples: [
      "hsl(from #3498db h s calc(l + 10))         /* lighten (hsl) */",
      "oklch(from #3498db calc(l + 0.1) c h)       /* lighten (oklch) */",
      "oklab(from #3498db calc(l - 0.1) a b)      /* darken (oklab) */",
    ],
  },
  {
    letter: "c",
    name: "Chroma (OKLCH)",
    spaces: ["oklch"],
    range: "0-0.4 unbounded",
    example: "calc(c + 0.05)",
    conversionExamples: [
      "oklch(from #3498db l calc(c + 0.05) h)     /* more colorful */",
      "oklch(from #3498db l calc(c - 0.05) h)    /* less colorful */",
    ],
  },
  {
    letter: "alpha",
    name: "Alpha",
    spaces: ["rgb", "hsl", "oklch", "oklab"],
    range: "0-1",
    example: "calc(alpha * 0.5)",
    conversionExamples: [
      "rgb(from #3498db r g b / calc(alpha * 0.5))    /* 50% transparent */",
      "oklch(from #3498db l c h / calc(alpha + 0.1))   /* more opaque */",
    ],
  },
];

// ─── 6 RCS presets ───────────────────────────────────────────────────────
const PRESETS: RelativeColorPreset[] = [
  {
    id: "preset-lighten",
    name: "Lighten",
    description:
      "Lighten the source color by adding 0.1 to OKLCH Lightness — perceptually uniform.",
    input: {
      source: "#3498db",
      outputSpace: "oklch",
      channels: { l: "calc(l + 0.1)", c: "c", h: "h" },
    },
  },
  {
    id: "preset-darken",
    name: "Darken",
    description:
      "Darken the source color by subtracting 0.1 from OKLCH Lightness.",
    input: {
      source: "#3498db",
      outputSpace: "oklch",
      channels: { l: "calc(l - 0.1)", c: "c", h: "h" },
    },
  },
  {
    id: "preset-complementary-rotate-hue",
    name: "Complementary (rotate hue)",
    description:
      "Rotate OKLCH hue by 180° to get the perceptual complement, preserving L and C.",
    input: {
      source: "#3498db",
      outputSpace: "oklch",
      channels: { l: "l", c: "c", h: "calc(h + 180)" },
    },
  },
  {
    id: "preset-saturate",
    name: "Saturate",
    description: "Add 0.05 to OKLCH chroma to boost colorfulness slightly.",
    input: {
      source: "#3498db",
      outputSpace: "oklch",
      channels: { l: "l", c: "calc(c + 0.05)", h: "h" },
    },
  },
  {
    id: "preset-desaturate",
    name: "Desaturate",
    description: "Subtract 0.05 from OKLCH chroma to mute the color.",
    input: {
      source: "#3498db",
      outputSpace: "oklch",
      channels: { l: "l", c: "calc(c - 0.05)", h: "h" },
    },
  },
  {
    id: "preset-opacity-half",
    name: "Opacity Half",
    description:
      "Halve the alpha channel — multiply the source's alpha by 0.5 for translucency.",
    input: {
      source: "#3498db",
      outputSpace: "rgb",
      channels: { r: "r", g: "g", b: "b", alpha: "calc(alpha * 0.5)" },
    },
  },
];

const channelsSeed: ChannelInfo[] = CHANNELS.map((c) => ({ ...c }));
const presets: RelativeColorPreset[] = PRESETS.map((p) => ({
  ...p,
  input: { ...p.input, channels: { ...p.input.channels } },
}));

// ─── Public service API ──────────────────────────────────────────────────

/** List all 8 RCS channel letters with conversion examples + syntax. Cached. */
export async function listChannels(): Promise<ChannelInfo[]> {
  return cacheWrap(
    "relative-color:channels",
    () => Promise.resolve(channelsSeed.map((c) => ({ ...c }))),
    CACHE_TTL.relativeColorChannels,
  );
}

/** List all 6 RCS presets. Cached. */
export async function listPresets(): Promise<RelativeColorPreset[]> {
  return cacheWrap(
    "relative-color:presets",
    () =>
      Promise.resolve(
        presets.map((p) => ({
          ...p,
          input: { ...p.input, channels: { ...p.input.channels } },
        })),
      ),
    CACHE_TTL.relativeColorPresets,
  );
}

/** Derive a color from source + output space + per-channel calc expressions. */
export async function deriveRelativeColor(
  input: RelativeColorDeriveInput,
): Promise<RelativeColorResult> {
  const cacheKey = `relative-color:derive:${JSON.stringify(input)}`;
  return cacheWrap(
    cacheKey,
    () => {
      const space = input.outputSpace;
      const def = SPACE_DEFS[space];
      const sourceValues = computeSourceValues(input.source, space);

      // Evaluate the 3 main channels + alpha. Missing expressions default
      // to identity (the channel letter itself).
      const resolvedValues: Record<string, number> = {};
      for (const ch of def.channels) {
        const expr = (input.channels as Record<string, string | undefined>)[ch];
        resolvedValues[ch] = evalChannel(expr, ch, sourceValues);
      }
      const alphaExpr = input.channels.alpha;
      const resolvedAlpha = evalChannel(alphaExpr, "alpha", sourceValues);
      resolvedValues.alpha = resolvedAlpha;

      const resolvedHex = resolveHex(resolvedValues, space);

      // Build the CSS function call.
      const parts = def.channels.map(
        (ch) => (input.channels as Record<string, string | undefined>)[ch] ?? ch,
      );
      let css = `${def.fn}(from ${input.source} ${parts.join(" ")})`;
      const hasAlphaModification = !isIdentity(alphaExpr, "alpha");
      if (hasAlphaModification && alphaExpr !== undefined) {
        css = `${def.fn}(from ${input.source} ${parts.join(" ")} / ${alphaExpr})`;
      }

      // Build a compact sourceValues/resolvedValues output (formatted numbers).
      const fmtRecord = (rec: Record<string, number>): Record<string, number> => {
        const out: Record<string, number> = {};
        for (const [k, v] of Object.entries(rec)) {
          out[k] = Math.round(v * 1000) / 1000;
        }
        return out;
      };

      const explanation =
        `Derives a ${space.toUpperCase()} color from ${input.source} by applying ` +
        `per-channel calc expressions to the source's ${def.channels.join(", ")} ` +
        (hasAlphaModification ? "and alpha " : "") +
        `channels. Resolves to ${resolvedHex} in sRGB (after gamut clamping).`;

      log.info("Relative color derived", {
        source: input.source,
        space,
        resolvedHex,
        hasAlphaModification,
      });

      return Promise.resolve({
        css,
        resolvedHex,
        sourceValues: fmtRecord(sourceValues),
        resolvedValues: fmtRecord(resolvedValues),
        hasAlphaModification,
        explanation,
        support: {
          baseline: "2024 (relative color syntax)",
          chrome: "119+",
          safari: "16.4+",
          firefox: "128+",
        },
      });
    },
    CACHE_TTL.relativeColorDerive,
  );
}
