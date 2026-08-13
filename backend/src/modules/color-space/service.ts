/**
 * Color-space service — convert between sRGB / HSL / OKLCH / OKLab /
 * Display-P3 and check sRGB gamut coverage.
 *
 * Mock backend (no DB). All conversions use the canonical linear-algebra
 * pipeline (sRGB ↔ linear ↔ XYZ ↔ OKLab ↔ OKLCH, with Display-P3 sharing
 * the XYZ ↔ OKLab step under a different RGB→XYZ matrix).
 *
 * Reads are LRU-cached; conversions cache their results per (from,to,value)
 * triple so identical inputs never recompute.
 *
 * References:
 *   - Björn Ottosson, "A perceptual color space for image processing"
 *     (https://bottosson.github.io/posts/oklab/)
 *   - CSS Color Module Level 4 §10–11
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import { AppError } from "../../server/middleware/error.js";
import type { ColorConvertInput, ColorSpace } from "./schema.js";

const log = createLogger("color-space");

// ─── Types ───────────────────────────────────────────────────────────────
export interface ColorValues {
  srgb: { r: number; g: number; b: number; hex: string };
  hsl: { h: number; s: number; l: number; css: string };
  oklab: { l: number; a: number; b: number; css: string };
  oklch: { l: number; c: number; h: number; css: string };
  "display-p3": { r: number; g: number; b: number; css: string };
}

export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  hex: string;
  values: ColorValues;
}

export interface GamutResult {
  hex: string;
  inSRGB: boolean;
  inDisplayP3: boolean;
  outOfGamutChannels: string[];
  /** Closest sRGB-clamped hex (channels clipped to [0,1]). */
  clampedHex: string;
  /** Max channel overshoot above 1 or below 0, in [0, ∞). 0 = in gamut. */
  overshoot: number;
}

// ─── Parsing helpers ─────────────────────────────────────────────────────

/** Expand #rgb → #rrggbb; strip optional alpha for #rrggbbaa. */
function normalizeHex(input: string): string {
  let h = input.trim().toLowerCase();
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  if (h.length === 9) h = h.slice(0, 7);
  return h;
}

function parseHex(input: string): [number, number, number] {
  const h = normalizeHex(input);
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const rr = clamp(r).toString(16).padStart(2, "0");
  const gg = clamp(g).toString(16).padStart(2, "0");
  const bb = clamp(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

/** Parse "h(°) s% l%" or "h, s%, l%" or "h s% l%" into [h, s, l]. */
function parseHsl(input: string): [number, number, number] {
  // Strip unit suffixes (° for hue, % for s/l) and treat commas as spaces.
  const cleaned = input.replace(/°/g, "").replace(/%/g, "").replace(/,/g, " ").trim();
  const parts = cleaned.split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw AppError.badRequest(
      `Invalid HSL value "${input}". Expected "h s% l%" e.g. "210 60% 50%".`,
    );
  }
  const [h, s, l] = parts as [number, number, number];
  if (s < 0 || s > 100 || l < 0 || l > 100) {
    throw AppError.badRequest(
      `HSL out of range: s and l must be 0–100, got s=${s}, l=${l}.`,
    );
  }
  return [h, s / 100, l / 100];
}

/** Parse "L C H" / "L A B" space- or comma-separated. */
function parseTriplet(input: string): [number, number, number] {
  const cleaned = input.replace(/,/g, " ").trim();
  const parts = cleaned.split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw AppError.badRequest(
      `Invalid color triplet "${input}". Expected 3 numbers e.g. "0.7 0.12 240".`,
    );
  }
  return parts as [number, number, number];
}

// ─── Core pipeline: sRGB ↔ linear ↔ XYZ ↔ OKLab ↔ OKLCH ──────────────────

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

// linear sRGB (D65) → XYZ
function srgbLinearToXYZ(r: number, g: number, b: number): [number, number, number] {
  return [
    0.4123907992659593 * r + 0.357584339383878 * g + 0.1804807884018343 * b,
    0.2126390058715102 * r + 0.715168678767756 * g + 0.07219231536073371 * b,
    0.01933081871559182 * r + 0.11919477979462598 * g + 0.9505321522496607 * b,
  ];
}

// XYZ → linear sRGB (D65)
function xyzToSrgbLinear(x: number, y: number, z: number): [number, number, number] {
  return [
    3.2409699419045226 * x - 1.537383177570093 * y - 0.4986107602930034 * z,
    -0.9692436362808796 * x + 1.8759675015077202 * y + 0.04155505740717561 * z,
    0.05563007969699366 * x - 0.20397695888897652 * y + 1.0569715142428786 * z,
  ];
}

// linear Display-P3 (D65) → XYZ
function p3LinearToXYZ(r: number, g: number, b: number): [number, number, number] {
  return [
    0.4865709486482162 * r + 0.2656676931690929 * g + 0.1982172852343625 * b,
    0.2289745640697488 * r + 0.6917385218365064 * g + 0.079286914093745 * b,
    0.0 * r + 0.04511338185890264 * g + 1.043944368900976 * b,
  ];
}

// XYZ → linear Display-P3 (D65)
function xyzToP3Linear(x: number, y: number, z: number): [number, number, number] {
  return [
    2.493496911941425 * x - 0.9313836179191239 * y - 0.4027107844507168 * z,
    -0.8294889695615747 * x + 1.7626640603183463 * y + 0.0236246858419436 * z,
    0.0358458302437845 * x - 0.0761723892680418 * y + 0.9568845240076872 * z,
  ];
}

// XYZ → OKLab
function xyzToOklab(x: number, y: number, z: number): [number, number, number] {
  const l_ = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
  const m_ = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
  const s_ = 0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z;
  const l = Math.cbrt(l_);
  const m = Math.cbrt(m_);
  const s = Math.cbrt(s_);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

// OKLab → XYZ
function oklabToXyz(l: number, a: number, b: number): [number, number, number] {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const lC = l_ ** 3;
  const mC = m_ ** 3;
  const sC = s_ ** 3;
  return [
    1.2270138511 * lC - 0.5577999807 * mC + 0.281256149 * sC,
    -0.0405801784 * lC + 1.1122568696 * mC - 0.0716766787 * sC,
    -0.0763812845 * lC - 0.4214819784 * mC + 1.5861632204 * sC,
  ];
}

// OKLab → OKLCH (hue in degrees 0..360)
function oklabToOklch(l: number, a: number, b: number): [number, number, number] {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [l, c, h];
}

// OKLCH → OKLab
function oklchToOklab(l: number, c: number, h: number): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  return [l, c * Math.cos(rad), c * Math.sin(rad)];
}

// sRGB → HSL (h in degrees, s/l in 0..1)
function srgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      default:
        h = ((r - g) / d + 4) * 60;
    }
  }
  return [h, s, l];
}

// HSL → sRGB
function hslToSrgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const hn = h / 360;
  return [hue2rgb(hn + 1 / 3), hue2rgb(hn), hue2rgb(hn - 1 / 3)];
}

// ─── Normalize: any input space → OKLab (canonical intermediate) ──────────

function toOklab(from: ColorSpace, value: string): [number, number, number] {
  switch (from) {
    case "srgb": {
      const [r, g, b] = parseHex(value);
      const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
      const [x, y, z] = srgbLinearToXYZ(lr, lg, lb);
      return xyzToOklab(x, y, z);
    }
    case "hsl": {
      const [h, s, l] = parseHsl(value);
      const [r, g, b] = hslToSrgb(h, s, l);
      const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
      const [x, y, z] = srgbLinearToXYZ(lr, lg, lb);
      return xyzToOklab(x, y, z);
    }
    case "oklab": {
      const [l, a, b] = parseTriplet(value);
      return [l, a, b];
    }
    case "oklch": {
      const [l, c, h] = parseTriplet(value);
      return oklchToOklab(l, c, h);
    }
    case "display-p3": {
      const [r, g, b] = parseHex(value);
      // P3 uses the same gamma function as sRGB
      const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
      const [x, y, z] = p3LinearToXYZ(lr, lg, lb);
      return xyzToOklab(x, y, z);
    }
    default:
      throw AppError.badRequest(`Unknown source color space: ${from}`);
  }
}

// ─── Denormalize: OKLab → any target space ───────────────────────────────

function fromOklab(to: ColorSpace, l: number, a: number, b: number): ColorValues[ColorSpace] {
  switch (to) {
    case "srgb": {
      const [x, y, z] = oklabToXyz(l, a, b);
      const [lr, lg, lb] = xyzToSrgbLinear(x, y, z);
      const r = linearToSrgb(lr);
      const g = linearToSrgb(lg);
      const b2 = linearToSrgb(lb);
      const hex = toHex(r, g, b2);
      return { r, g, b: b2, hex };
    }
    case "hsl": {
      const [x, y, z] = oklabToXyz(l, a, b);
      const [lr, lg, lb] = xyzToSrgbLinear(x, y, z);
      const r = linearToSrgb(lr);
      const g = linearToSrgb(lg);
      const b2 = linearToSrgb(lb);
      const [h, s, ll] = srgbToHsl(r, g, b2);
      return {
        h: Math.round(h),
        s: +(s * 100).toFixed(2),
        l: +(ll * 100).toFixed(2),
        css: `hsl(${Math.round(h)} ${(s * 100).toFixed(2)}% ${(ll * 100).toFixed(2)}%)`,
      };
    }
    case "oklab": {
      return {
        l: +l.toFixed(6),
        a: +a.toFixed(6),
        b: +b.toFixed(6),
        css: `oklab(${l.toFixed(4)} ${a.toFixed(4)} ${b.toFixed(4)})`,
      };
    }
    case "oklch": {
      const [ll, c, h] = oklabToOklch(l, a, b);
      return {
        l: +ll.toFixed(6),
        c: +c.toFixed(6),
        h: +h.toFixed(2),
        css: `oklch(${ll.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`,
      };
    }
    case "display-p3": {
      const [x, y, z] = oklabToXyz(l, a, b);
      const [lr, lg, lb] = xyzToP3Linear(x, y, z);
      const r = linearToSrgb(lr);
      const g = linearToSrgb(lg);
      const b2 = linearToSrgb(lb);
      return {
        r: +r.toFixed(6),
        g: +g.toFixed(6),
        b: +b2.toFixed(6),
        css: `color(display-p3 ${r.toFixed(4)} ${g.toFixed(4)} ${b2.toFixed(4)})`,
      };
    }
    default:
      throw AppError.badRequest(`Unknown target color space: ${to}`);
  }
}

/** Compute all 5 representations of a color from any source. */
function computeAllValues(
  from: ColorSpace,
  value: string,
): ColorValues {
  const [l, a, b] = toOklab(from, value);
  return {
    srgb: fromOklab("srgb", l, a, b) as ColorValues["srgb"],
    hsl: fromOklab("hsl", l, a, b) as ColorValues["hsl"],
    oklab: fromOklab("oklab", l, a, b) as ColorValues["oklab"],
    oklch: fromOklab("oklch", l, a, b) as ColorValues["oklch"],
    "display-p3": fromOklab("display-p3", l, a, b) as ColorValues["display-p3"],
  };
}

// ─── Seed: 6 preset colors ───────────────────────────────────────────────
const SEED_PRESETS: { id: string; name: string; description: string; from: ColorSpace; value: string }[] = [
  { id: "preset-roy-purple", name: "Roy Purple", description: "Brand primary, ~P3-wide vivid violet.", from: "oklch", value: "0.55 0.22 290" },
  { id: "preset-cyan-pop", name: "Cyan Pop", description: "Out-of-sRGB cyan, only renderable on P3 displays.", from: "oklch", value: "0.78 0.18 195" },
  { id: "preset-forest", name: "Forest Canopy", description: "Deep moss green, in sRGB gamut.", from: "srgb", value: "#2d5016" },
  { id: "preset-coral", name: "Sunset Coral", description: "Warm red-orange used in marketing heroes.", from: "srgb", value: "#ff6b5b" },
  { id: "preset-arctic", name: "Arctic Ice", description: "Near-neutral cool light, great for surfaces.", from: "hsl", value: "210 30% 96%" },
  { id: "preset-amber", name: "Amber Glow", description: "Highlight amber, common in dark themes.", from: "oklch", value: "0.80 0.16 75" },
];

const presets: ColorPreset[] = SEED_PRESETS.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  hex: computeAllValues(p.from, p.value).srgb.hex,
  values: computeAllValues(p.from, p.value),
}));

// ─── Public service API ──────────────────────────────────────────────────

/** List the 6 preset colors with all 5 space representations. Cached. */
export async function listPresets(): Promise<ColorPreset[]> {
  return cacheWrap(
    "color-space:presets",
    () => Promise.resolve(presets.map((p) => ({ ...p, values: { ...p.values } }))),
    CACHE_TTL.colorSpacePresets,
  );
}

/** Convert a color from one space to another; returns all 5 representations. */
export async function convertColor(
  input: ColorConvertInput,
): Promise<ColorValues & { from: ColorSpace; to: ColorSpace; input: string }> {
  const cacheKey = `color-space:convert:${input.from}:${input.to}:${input.value}`;
  return cacheWrap(
    cacheKey,
    () => {
      const all = computeAllValues(input.from, input.value);
      const result = all[input.to];
      if (!result) {
        throw AppError.badRequest(
          `Conversion to "${input.to}" not implemented.`,
        );
      }
      log.info("Color converted", {
        from: input.from,
        to: input.to,
        in: input.value,
      });
      return Promise.resolve({
        from: input.from,
        to: input.to,
        input: input.value,
        ...all,
      });
    },
    CACHE_TTL.colorSpaceConvert,
  );
}

/** Check whether a hex color is inside the sRGB and Display-P3 gamuts. */
export async function checkGamut(hex: string): Promise<GamutResult> {
  const cacheKey = `color-space:gamut:${hex}`;
  return cacheWrap(
    cacheKey,
    () => {
      // Interpret the hex as an sRGB color and convert to linear then XYZ.
      const [r, g, b] = parseHex(hex);
      const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
      const [x, y, z] = srgbLinearToXYZ(lr, lg, lb);

      // Convert XYZ → Display-P3 linear → P3 sRGB-encoded.
      const [pr, pg, pb] = xyzToP3Linear(x, y, z);
      const p3Encoded = [
        linearToSrgb(pr),
        linearToSrgb(pg),
        linearToSrgb(pb),
      ];
      // sRGB input is by definition in sRGB gamut.
      const inSRGB = [r, g, b].every((c) => c >= 0 && c <= 1);
      const p3Overshoot = p3Encoded
        .map((c) => (c < 0 ? -c : c > 1 ? c - 1 : 0))
        .reduce((m, v) => Math.max(m, v), 0);
      const inDisplayP3 = p3Overshoot <= 0.0001;

      const outOfGamutChannels: string[] = [];
      const channelNames = ["r", "g", "b"] as const;
      for (let i = 0; i < channelNames.length; i++) {
        const v = p3Encoded[i];
        if (v === undefined) continue;
        if (v < -0.0001 || v > 1.0001) outOfGamutChannels.push(channelNames[i]!);
      }

      const clampedHex = toHex(
        Math.max(0, Math.min(1, p3Encoded[0] ?? 0)),
        Math.max(0, Math.min(1, p3Encoded[1] ?? 0)),
        Math.max(0, Math.min(1, p3Encoded[2] ?? 0)),
      );

      return Promise.resolve({
        hex,
        inSRGB,
        inDisplayP3,
        outOfGamutChannels,
        clampedHex,
        overshoot: +p3Overshoot.toFixed(6),
      });
    },
    CACHE_TTL.colorSpaceGamut,
  );
}
