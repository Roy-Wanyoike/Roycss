"use client";

/**
 * ColorSpaceExplorer — a color-space conversion playground.
 *
 * Modern CSS (Color Module Level 4) lets authors move freely between sRGB
 * (`#hex` / `rgb()`), HSL (`hsl()`), OKLCH (`oklch()`), OKLab (`oklab()`) and
 * wide-gamut spaces like Display-P3 (`color(display-p3 ...)`). This tool gives
 * developers a single playground to:
 *
 *   1. Pick a color with a native color picker or by typing a hex value.
 *   2. Watch that color be converted live into OKLCH, HSL, OKLab and
 *      Display-P3 — each shown on its own tab with editable sliders.
 *   3. Drag around an interactive 2D chroma-lightness plane (canvas-rendered)
 *      to find colors at a fixed hue, with in-gamut / out-of-gamut pixels
 *      visibly distinct.
 *   4. See a live warning badge the moment the current OKLCH color falls
 *      outside the sRGB gamut (i.e. clamping would occur if you used it as
 *      `rgb()`).
 *   5. Copy a ready-to-paste CSS snippet — the modern `oklch()` value plus an
 *      `@media (color-gamut: srgb)` fallback that uses the clamped `rgb()`.
 *   6. Load one of six named presets (sunset / ocean / forest / neon /
 *      pastel / grayscale).
 *
 * Color math (all implemented locally — no color library):
 *   - hex ↔ 8-bit sRGB ↔ linear sRGB (gamma decode/encode per sRGB transfer)
 *   - linear sRGB (D65) → XYZ → LMS (cube-root) → OKLab → OKLCH
 *     (Björn Ottosson's OK color space — https://bottosson.github.io/posts/oklab/)
 *   - sRGB ↔ HSL (the classic 1978 algorithm)
 *   - sRGB ↔ Display-P3 (shared D65 white point + sRGB transfer; only the
 *     XYZ matrix differs, so we round-trip through XYZ)
 *   - sRGB gamut check: convert OKLCH → linear sRGB → sRGB; if any channel
 *     falls outside [0,1] the color is "out of sRGB gamut".
 *
 * State model: OKLCH is the single source of truth. The hex input, HSL,
 * OKLab and Display-P3 tabs are all derived from OKLCH via useMemo. When the
 * user edits a slider on any tab, we convert back to OKLCH and update state.
 * Editing the hex input also updates OKLCH (via hex → linear sRGB → OKLab →
 * OKLCH). This keeps every view perfectly in sync without precision loss
 * from round-tripping through 8-bit hex.
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
  type CSSProperties,
} from "react";
import {
  Palette,
  Copy,
  Check,
  Sparkles,
  TriangleAlert,
  Globe,
  Pipette,
  Layers,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface OklchColor {
  L: number;
  C: number;
  H: number;
}

interface OklabColor {
  L: number;
  a: number;
  b: number;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

type TabKey = "oklch" | "hsl" | "oklab" | "p3";

interface Preset {
  id: string;
  label: string;
  hex: string;
}

interface BrowserSupport {
  label: string;
  tone: "newly" | "limited";
  versions: { browser: string; version: string }[];
}

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 1500;

const CHROMA_MAX = 0.4;
const PLANE_SIZE = 220; // CSS px for the chroma-lightness plane canvas
const PLANE_RES = 110; // backing-store px (half-size; rendered with image-rendering)

const PRESETS: Preset[] = [
  { id: "sunset", label: "Sunset", hex: "#ff7a59" },
  { id: "ocean", label: "Ocean", hex: "#0bbcd6" },
  { id: "forest", label: "Forest", hex: "#2f9e44" },
  { id: "neon", label: "Neon", hex: "#d025ff" },
  { id: "pastel", label: "Pastel", hex: "#f6c5d4" },
  { id: "grayscale", label: "Grayscale", hex: "#7a7a7a" },
];

const DEFAULT_HEX = PRESETS[0]!.hex;

const BROWSER_SUPPORT: BrowserSupport = {
  label: "Baseline 2023",
  tone: "newly",
  versions: [
    { browser: "Chrome", version: "111+" },
    { browser: "Edge", version: "111+" },
    { browser: "Safari", version: "15.4+" },
    { browser: "Firefox", version: "113+" },
    { browser: "Samsung", version: "20+" },
  ],
};

// ============================================================
// Color math: sRGB transfer function
// ============================================================

/** sRGB companding → linear light (per CSS Color L4). */
const srgbToLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

/** Linear light → sRGB companding. */
const linearToSrgb = (c: number): number => {
  const v = Math.max(0, Math.min(1, c));
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
};

// ============================================================
// hex ↔ 8-bit sRGB
// ============================================================

const parseHex = (hex: string): RgbColor | null => {
  let h = hex.trim().replace(/^#/, "").toLowerCase();
  if (h.length === 3) {
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  } else if (h.length === 8) {
    h = h.slice(0, 6);
  }
  if (!/^[0-9a-f]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
};

const toHexByte = (c: number): string => {
  const v = Math.max(0, Math.min(1, c));
  return Math.round(v * 255).toString(16).padStart(2, "0");
};

const srgbToHex = (r: number, g: number, b: number): string =>
  `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;

// ============================================================
// sRGB ↔ linear sRGB
// ============================================================

const rgbToLinear = (c: RgbColor): [number, number, number] => [
  srgbToLinear(c.r),
  srgbToLinear(c.g),
  srgbToLinear(c.b),
];

const linearToRgb = (r: number, g: number, b: number): RgbColor => ({
  r: linearToSrgb(r),
  g: linearToSrgb(g),
  b: linearToSrgb(b),
});

// ============================================================
// linear sRGB (D65) ↔ OKLab (Ottosson)
// ============================================================

const linearSrgbToOklab = (
  r: number,
  g: number,
  b: number,
): OklabColor => {
  // linear sRGB → CIE XYZ (D65)
  const X = 0.412390799 * r + 0.357584339 * g + 0.180480788 * b;
  const Y = 0.212639006 * r + 0.715168679 * g + 0.072192315 * b;
  const Z = 0.019330819 * r + 0.11919478 * g + 0.950532152 * b;

  // XYZ → LMS
  const l = 0.8189330101 * X + 0.3618667424 * Y - 0.1288597137 * Z;
  const m = 0.0329845436 * X + 0.9293118715 * Y + 0.0361456387 * Z;
  const s = 0.0482003018 * X + 0.2643662691 * Y + 0.633851707 * Z;

  // non-linearity (cube root)
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
};

const oklabToLinearSrgb = (c: OklabColor): [number, number, number] => {
  const l_ = c.L + 0.3963377774 * c.a + 0.2158037573 * c.b;
  const m_ = c.L - 0.1055613458 * c.a - 0.0638541728 * c.b;
  const s_ = c.L - 0.0894841775 * c.a - 1.291485548 * c.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    1.2268798733741557 * l - 0.5578149965554813 * m + 0.2813910501772158 * s,
    -0.04057576262431372 * l + 1.1122868293970594 * m - 0.0717110666619174 * s,
    -0.07637294944629688 * l - 0.4214933239627914 * m + 0.4973864431754084 * s,
  ];
};

// ============================================================
// OKLab ↔ OKLCH
// ============================================================

const oklabToOklch = (c: OklabColor): OklchColor => {
  const C = Math.sqrt(c.a * c.a + c.b * c.b);
  let H = (Math.atan2(c.b, c.a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L: c.L, C, H };
};

const oklchToOklab = (c: OklchColor): OklabColor => {
  const rad = (c.H * Math.PI) / 180;
  return {
    L: c.L,
    a: c.C * Math.cos(rad),
    b: c.C * Math.sin(rad),
  };
};

// ============================================================
// Convenience: hex ↔ OKLCH
// ============================================================

const hexToOklch = (hex: string): OklchColor | null => {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgbToLinear(rgb);
  return oklabToOklch(linearSrgbToOklab(r, g, b));
};

const oklchToLinearSrgbTriple = (c: OklchColor): [number, number, number] =>
  oklabToLinearSrgb(oklchToOklab(c));

/** Returns a clamped sRGB hex (channels forced into [0,1]). */
const oklchToHex = (c: OklchColor): string => {
  const [r, g, b] = oklchToLinearSrgbTriple(c);
  const srgb = linearToRgb(r, g, b);
  return srgbToHex(srgb.r, srgb.g, srgb.b);
};

/** True if the OKLCH color maps to sRGB channels strictly inside [0,1]. */
const oklchInSrgbGamut = (c: OklchColor): boolean => {
  const [r, g, b] = oklchToLinearSrgbTriple(c);
  // tiny epsilon so floating-point noise near the gamut edge doesn't flap
  const eps = 0.0005;
  return (
    r >= -eps &&
    r <= 1 + eps &&
    g >= -eps &&
    g <= 1 + eps &&
    b >= -eps &&
    b <= 1 + eps
  );
};

// ============================================================
// sRGB ↔ HSL (classic algorithm)
// ============================================================

const rgbToHsl = (c: RgbColor): HslColor => {
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === c.r) {
    h = ((c.g - c.b) / delta) % 6;
  } else if (max === c.g) {
    h = (c.b - c.r) / delta + 2;
  } else {
    h = (c.r - c.g) / delta + 4;
  }
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
};

const hslToRgb = (c: HslColor): RgbColor => {
  const h = ((c.h % 360) + 360) % 360;
  const C = (1 - Math.abs(2 * c.l - 1)) * c.s;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = c.l - C / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = C;
    g = X;
  } else if (h < 120) {
    r = X;
    g = C;
  } else if (h < 180) {
    g = C;
    b = X;
  } else if (h < 240) {
    g = X;
    b = C;
  } else if (h < 300) {
    r = X;
    b = C;
  } else {
    r = C;
    b = X;
  }
  return { r: r + m, g: g + m, b: b + m };
};

// ============================================================
// sRGB ↔ Display-P3 (shared D65 white point + sRGB transfer)
// ============================================================

/**
 * linear sRGB → linear Display-P3 (via XYZ, matrices per CSS Color L4).
 * Both spaces share the D65 white point and the sRGB transfer function, so
 * only the RGB-primaries matrix differs.
 */
const linearSrgbToLinearP3 = (
  r: number,
  g: number,
  b: number,
): [number, number, number] => {
  // linear sRGB → XYZ (D65)
  const X = 0.412390799 * r + 0.357584339 * g + 0.180480788 * b;
  const Y = 0.212639006 * r + 0.715168679 * g + 0.072192315 * b;
  const Z = 0.019330819 * r + 0.11919478 * g + 0.950532152 * b;
  // XYZ → linear Display-P3 (D65)
  return [
    2.493496911941425 * X - 0.9313836179191249 * Y - 0.402710784450717 * Z,
    -0.8294889695615747 * X + 1.7626640603183463 * Y + 0.0236246858419436 * Z,
    0.0358458302437845 * X - 0.0761723892680418 * Y + 0.9568845240076872 * Z,
  ];
};

/** linear Display-P3 → linear sRGB (inverse of the above). */
const linearP3ToLinearSrgb = (
  r: number,
  g: number,
  b: number,
): [number, number, number] => {
  // Inverse matrix: linear P3 (D65) → XYZ (D65)
  const X =
    0.4865709486482162 * r + 0.265667693169093 * g + 0.198217285234363 * b;
  const Y =
    0.228974564069749 * r + 0.691738521836506 * g + 0.079286914093745 * b;
  const Z = 0.0 * r + 0.045113381858903 * g + 1.04394436890098 * b;
  // XYZ → linear sRGB (D65) (inverse of the sRGB matrix above)
  return [
    3.2409699419045226 * X - 1.537383177570094 * Y - 0.4986107602930034 * Z,
    -0.9692436362808796 * X + 1.875967501507721 * Y + 0.041555057407176 * Z,
    0.0556300796969937 * X - 0.2039769588889765 * Y + 1.056971514242879 * Z,
  ];
};

// ============================================================
// Formatters
// ============================================================

const fmt = (n: number, dp = 3): string => {
  const v = Number(n.toFixed(dp));
  // Trim trailing zeros for tidier output: 0.700 → 0.7
  return String(v);
};

const formatRgb = (c: RgbColor): string =>
  `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(
    c.b * 255,
  )})`;

const formatHsl = (c: HslColor): string =>
  `hsl(${Math.round(c.h)}deg ${Math.round(c.s * 100)}% ${Math.round(
    c.l * 100,
  )}%)`;

const formatOklch = (c: OklchColor): string =>
  `oklch(${fmt(c.L)} ${fmt(c.C)} ${fmt(c.H, 1)})`;

const formatOklab = (c: OklabColor): string =>
  `oklab(${fmt(c.L)} ${fmt(c.a)} ${fmt(c.b)})`;

const formatP3 = (c: RgbColor): string =>
  `color(display-p3 ${fmt(c.r)} ${fmt(c.g)} ${fmt(c.b)})`;

// ============================================================
// Chroma-lightness plane canvas
// ============================================================

interface PlaneProps {
  hue: number;
  markerL: number;
  markerC: number;
  onPick: (L: number, C: number) => void;
}

/**
 * Renders the OKLCH chroma/lightness plane for the current hue:
 *   - x-axis: chroma 0 → CHROMA_MAX
 *   - y-axis: lightness 1 (top) → 0 (bottom)
 *   - in-gamut pixels are painted with their actual sRGB color
 *   - out-of-gamut pixels are painted as a checker of dark grey
 * A draggable marker shows the current (L, C).
 */
function ChromaLightnessPlane({
  hue,
  markerL,
  markerC,
  onPick,
}: PlaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);

  // Redraw the gamut image when the hue changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = PLANE_RES;
    const h = PLANE_RES;
    const img = ctx.createImageData(w, h);
    const data = img.data;
    for (let y = 0; y < h; y++) {
      // lightness: top row = 1, bottom row = 0
      const L = 1 - y / (h - 1);
      for (let x = 0; x < w; x++) {
        const C = (x / (w - 1)) * CHROMA_MAX;
        const [lr, lg, lb] = oklchToLinearSrgbTriple({ L, C, H: hue });
        const inGamut =
          lr >= -0.001 && lr <= 1.001 && lg >= -0.001 && lg <= 1.001 && lb >= -0.001 && lb <= 1.001;
        const idx = (y * w + x) * 4;
        if (inGamut) {
          const srgb = linearToRgb(lr, lg, lb);
          data[idx] = Math.round(srgb.r * 255);
          data[idx + 1] = Math.round(srgb.g * 255);
          data[idx + 2] = Math.round(srgb.b * 255);
          data[idx + 3] = 255;
        } else {
          // subtle checker pattern for out-of-gamut areas
          const checker = (x + y) % 8 === 0;
          const v = checker ? 60 : 40;
          data[idx] = v;
          data[idx + 1] = v;
          data[idx + 2] = v;
          data[idx + 3] = 220;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [hue]);

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const C = x * CHROMA_MAX;
      const L = 1 - y;
      onPick(L, C);
    },
    [onPick],
  );

  // Marker position in CSS px (PLANE_SIZE square)
  const markerLeft = (markerC / CHROMA_MAX) * PLANE_SIZE;
  const markerTop = (1 - markerL) * PLANE_SIZE;

  const planeStyle: CSSProperties = {
    width: PLANE_SIZE,
    height: PLANE_SIZE,
    imageRendering: "pixelated",
  };

  return (
    <div
      className="relative touch-none select-none rounded-md border border-border"
      style={{ width: PLANE_SIZE, height: PLANE_SIZE }}
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) handlePointer(e);
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* noop — pointer may already be released */
        }
      }}
    >
      <canvas ref={canvasRef} width={PLANE_RES} height={PLANE_RES} style={planeStyle} className="block rounded-md" />
      {/* Out-of-gamut legend swatch */}
      <div className="pointer-events-none absolute right-1 top-1 flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{
            backgroundImage:
              "repeating-conic-gradient(#5a5a5a 0% 25%, #3a3a3a 0% 50%)",
            backgroundSize: "6px 6px",
          }}
        />
        out of sRGB
      </div>
      {/* Marker */}
      <div
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.6)]"
        style={{ left: markerLeft, top: markerTop }}
      />
    </div>
  );
}

// ============================================================
// Slider row helper
// ============================================================

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
        <span className="font-mono text-xs text-foreground">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => {
          if (Array.isArray(v) && v.length > 0) onChange(v[0]!);
        }}
      />
    </div>
  );
}

// ============================================================
// Component
// ============================================================

export function ColorSpaceExplorer() {
  // OKLCH is the source of truth.
  const [oklch, setOklch] = useState<OklchColor>(() => {
    const initial = hexToOklch(DEFAULT_HEX);
    return initial ?? { L: 0.5, C: 0.1, H: 0 };
  });
  const [hexInput, setHexInput] = useState<string>(DEFAULT_HEX);
  const [tab, setTab] = useState<TabKey>("oklch");
  const [copied, setCopied] = useState<boolean>(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const flashCopied = useCallback(() => {
    setCopied(true);
    if (copiedTimerRef.current !== null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, COPY_CONFIRM_MS);
  }, []);

  // Derived: clamped hex + sRGB triple + gamut flag
  const derivedHex = useMemo(() => oklchToHex(oklch), [oklch]);
  const inSrgbGamut = useMemo(() => oklchInSrgbGamut(oklch), [oklch]);
  const srgbClamped = useMemo<RgbColor>(() => {
    const [r, g, b] = oklchToLinearSrgbTriple(oklch);
    return linearToRgb(r, g, b);
  }, [oklch]);

  const hsl = useMemo<HslColor>(() => rgbToHsl(srgbClamped), [srgbClamped]);
  const oklab = useMemo<OklabColor>(() => oklchToOklab(oklch), [oklch]);
  const p3 = useMemo<RgbColor>(() => {
    // OKLCH → linear sRGB → linear P3 → P3 (apply sRGB transfer to P3 since
    // Display-P3 shares the sRGB companding)
    const [r, g, b] = oklchToLinearSrgbTriple(oklch);
    const [pr, pg, pb] = linearSrgbToLinearP3(r, g, b);
    return {
      r: linearToSrgb(pr),
      g: linearToSrgb(pg),
      b: linearToSrgb(pb),
    };
  }, [oklch]);

  // Generated CSS output
  const generatedCss = useMemo(() => {
    const oklchLine = `color: ${formatOklch(oklch)};`;
    const fallback = `@media (color-gamut: srgb) {\n  color: ${formatRgb(
      srgbClamped,
    )};\n}`;
    return `${oklchLine}\n${fallback}`;
  }, [oklch, srgbClamped]);

  // Handlers — keep hex input + oklch in sync without precision loss.
  // These handlers close over the latest `oklch` on every render (no
  // useCallback) so they always read fresh state — important because slider
  // drags fire many onValueChange events in rapid succession.
  const handleHexChange = useCallback((value: string) => {
    setHexInput(value);
    const parsed = hexToOklch(value);
    if (parsed) setOklch(parsed);
  }, []);

  const handlePreset = useCallback((hex: string) => {
    setHexInput(hex);
    const parsed = hexToOklch(hex);
    if (parsed) setOklch(parsed);
  }, []);

  const handleOklchChange = (patch: Partial<OklchColor>) => {
    const next = { ...oklch, ...patch };
    setOklch(next);
    setHexInput(oklchToHex(next));
  };

  const handleHslChange = (patch: Partial<HslColor>) => {
    // Re-derive HSL from current OKLCH (so we don't lose precision when the
    // user only drags one slider), then patch.
    const [r0, g0, b0] = oklchToLinearSrgbTriple(oklch);
    const prevHsl = rgbToHsl(linearToRgb(r0, g0, b0));
    const nextHsl = { ...prevHsl, ...patch };
    const rgb = hslToRgb(nextHsl);
    const [r, g, b] = rgbToLinear(rgb);
    const next = oklabToOklch(linearSrgbToOklab(r, g, b));
    setOklch(next);
    setHexInput(oklchToHex(next));
  };

  const handleOklabChange = (patch: Partial<OklabColor>) => {
    const nextOklab = { ...oklchToOklab(oklch), ...patch };
    const next = oklabToOklch(nextOklab);
    setOklch(next);
    setHexInput(oklchToHex(next));
  };

  const handleP3Change = (patch: Partial<RgbColor>) => {
    // Re-derive current P3 from current OKLCH, then patch.
    const [lr, lg, lb] = oklchToLinearSrgbTriple(oklch);
    const [pr, pg, pb] = linearSrgbToLinearP3(lr, lg, lb);
    const nextP3: RgbColor = {
      r: linearToSrgb(pr),
      g: linearToSrgb(pg),
      b: linearToSrgb(pb),
      ...patch,
    };
    // Back to linear P3 → linear sRGB → OKLCH
    const [nlr, nlg, nlb] = linearP3ToLinearSrgb(
      srgbToLinear(nextP3.r),
      srgbToLinear(nextP3.g),
      srgbToLinear(nextP3.b),
    );
    const next = oklabToOklch(linearSrgbToOklab(nlr, nlg, nlb));
    setOklch(next);
    setHexInput(oklchToHex(next));
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      flashCopied();
    } catch {
      /* clipboard may be unavailable; silently ignore */
    }
  }, [generatedCss, flashCopied]);

  const swatchStyle: CSSProperties = {
    backgroundColor: derivedHex,
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="size-5" />
              Color Space Explorer
            </CardTitle>
            <CardDescription>
              Convert colors between sRGB, HSL, OKLCH, OKLab and Display-P3.
              Drag the chroma-lightness plane and copy production-ready CSS.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          >
            <Globe className="size-3" />
            {BROWSER_SUPPORT.label}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {BROWSER_SUPPORT.versions.map((v) => (
            <span key={v.browser}>
              {v.browser}{" "}
              <span className="font-mono text-foreground">{v.version}</span>
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Hex input + color picker + swatch */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cse-hex" className="text-xs font-medium text-muted-foreground">
              Hex color
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="cse-hex"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                className="h-9 w-32 font-mono"
                placeholder="#rrggbb"
                spellCheck={false}
                autoComplete="off"
              />
              <label
                className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background"
                title="Pick a color"
              >
                <Pipette className="size-4 text-muted-foreground" />
                <input
                  type="color"
                  value={derivedHex}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Color picker"
                />
              </label>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-3">
            <div
              className="h-12 flex-1 rounded-md border border-border shadow-inner"
              style={swatchStyle}
              aria-label="Live color preview"
            />
            {!inSrgbGamut ? (
              <Badge
                variant="outline"
                className="gap-1 border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              >
                <TriangleAlert className="size-3" />
                Out of sRGB gamut
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              >
                <Check className="size-3" />
                In sRGB gamut
              </Badge>
            )}
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Presets
          </Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handlePreset(p.hex)}
              >
                <span
                  className="size-3.5 rounded-full border border-border"
                  style={{ backgroundColor: p.hex }}
                />
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="oklch">OKLCH</TabsTrigger>
            <TabsTrigger value="hsl">HSL</TabsTrigger>
            <TabsTrigger value="oklab">OKLab</TabsTrigger>
            <TabsTrigger value="p3">Display-P3</TabsTrigger>
          </TabsList>

          {/* OKLCH tab */}
          <TabsContent value="oklch" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
              <ChromaLightnessPlane
                hue={oklch.H}
                markerL={oklch.L}
                markerC={oklch.C}
                onPick={(L, C) => handleOklchChange({ L, C })}
              />
              <div className="space-y-3">
                <SliderRow
                  label="Lightness L (0–1)"
                  value={oklch.L}
                  min={0}
                  max={1}
                  step={0.001}
                  display={fmt(oklch.L)}
                  onChange={(v) => handleOklchChange({ L: v })}
                />
                <SliderRow
                  label="Chroma C (0–0.4)"
                  value={oklch.C}
                  min={0}
                  max={CHROMA_MAX}
                  step={0.001}
                  display={fmt(oklch.C)}
                  onChange={(v) => handleOklchChange({ C: v })}
                />
                <SliderRow
                  label="Hue H (0–360°)"
                  value={oklch.H}
                  min={0}
                  max={360}
                  step={1}
                  display={fmt(oklch.H, 1)}
                  onChange={(v) => handleOklchChange({ H: v })}
                />
                <div className="rounded-md border border-border bg-muted/30 p-2.5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    OKLCH
                  </div>
                  <code className="font-mono text-sm text-foreground">
                    {formatOklch(oklch)}
                  </code>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* HSL tab */}
          <TabsContent value="hsl" className="space-y-4 pt-4">
            <SliderRow
              label="Hue (0–360°)"
              value={hsl.h}
              min={0}
              max={360}
              step={1}
              display={fmt(hsl.h, 1)}
              onChange={(v) => handleHslChange({ h: v })}
            />
            <SliderRow
              label="Saturation (0–100%)"
              value={hsl.s}
              min={0}
              max={1}
              step={0.001}
              display={`${Math.round(hsl.s * 100)}%`}
              onChange={(v) => handleHslChange({ s: v })}
            />
            <SliderRow
              label="Lightness (0–100%)"
              value={hsl.l}
              min={0}
              max={1}
              step={0.001}
              display={`${Math.round(hsl.l * 100)}%`}
              onChange={(v) => handleHslChange({ l: v })}
            />
            <div className="rounded-md border border-border bg-muted/30 p-2.5">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                HSL
              </div>
              <code className="font-mono text-sm text-foreground">
                {formatHsl(hsl)}
              </code>
            </div>
          </TabsContent>

          {/* OKLab tab */}
          <TabsContent value="oklab" className="space-y-4 pt-4">
            <SliderRow
              label="Lightness L (0–1)"
              value={oklab.L}
              min={0}
              max={1}
              step={0.001}
              display={fmt(oklab.L)}
              onChange={(v) => handleOklabChange({ L: v })}
            />
            <SliderRow
              label="a (green–red, -0.4–0.4)"
              value={oklab.a}
              min={-0.4}
              max={0.4}
              step={0.001}
              display={fmt(oklab.a)}
              onChange={(v) => handleOklabChange({ a: v })}
            />
            <SliderRow
              label="b (blue–yellow, -0.4–0.4)"
              value={oklab.b}
              min={-0.4}
              max={0.4}
              step={0.001}
              display={fmt(oklab.b)}
              onChange={(v) => handleOklabChange({ b: v })}
            />
            <div className="rounded-md border border-border bg-muted/30 p-2.5">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                OKLab
              </div>
              <code className="font-mono text-sm text-foreground">
                {formatOklab(oklab)}
              </code>
            </div>
          </TabsContent>

          {/* Display-P3 tab */}
          <TabsContent value="p3" className="space-y-4 pt-4">
            <SliderRow
              label="Red (0–1)"
              value={p3.r}
              min={0}
              max={1}
              step={0.001}
              display={fmt(p3.r)}
              onChange={(v) => handleP3Change({ r: v })}
            />
            <SliderRow
              label="Green (0–1)"
              value={p3.g}
              min={0}
              max={1}
              step={0.001}
              display={fmt(p3.g)}
              onChange={(v) => handleP3Change({ g: v })}
            />
            <SliderRow
              label="Blue (0–1)"
              value={p3.b}
              min={0}
              max={1}
              step={0.001}
              display={fmt(p3.b)}
              onChange={(v) => handleP3Change({ b: v })}
            />
            <div className="rounded-md border border-border bg-muted/30 p-2.5">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Display-P3
              </div>
              <code className="font-mono text-sm text-foreground">
                {formatP3(p3)}
              </code>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generated CSS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Layers className="size-3.5" />
              Generated CSS
            </Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="size-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
            <code>{generatedCss}</code>
          </pre>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="size-3" />
            Use the <code className="font-mono">oklch()</code> value as your
            primary; the <code className="font-mono">@media (color-gamut)</code>{" "}
            block serves the clamped fallback to sRGB-only browsers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
