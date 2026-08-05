"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import {
  Brush,
  Blend,
  Images,
  Type,
  Circle,
  Star,
  Heart,
  Hexagon,
  Triangle,
  Diamond,
  Droplet,
  ArrowRight,
  Eraser,
  Copy,
  Check,
  Sparkles,
  Upload,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * MaskStudio — a visual builder for the CSS Masking API.
 *
 * Models the full `mask-*` shorthand family as three authored surfaces
 * (gradient / image / text) sharing a common set of placement props
 * (size, position, repeat, mode). Every change is reflected live on a
 * checkerboard preview so transparent regions are obvious, and the
 * generated CSS is emitted with `-webkit-` prefixes for Safari.
 *
 * Features:
 *  - Mask type selector: Gradient (linear/radial), Image (8 SVG presets +
 *    upload), Text (content + font size/weight/family rendered as an
 *    SVG `<text>` mask source).
 *  - Gradient controls: linear angle slider (0–360°) OR radial shape
 *    (circle/ellipse) + center X/Y, plus two color stops
 *    (transparent → opaque, each 0–100%).
 *  - Image controls: 8 built-in SVG mask shapes (circle, star, heart,
 *    hexagon, triangle, diamond, blob, arrow), file upload, mask-size
 *    (contain/cover/custom %), 3×3 position grid, repeat select.
 *  - Text controls: content input, font-size slider (24–200px), font-weight
 *    select (300–900), font-family select (sans/serif/mono/display).
 *  - Common mask properties: size, position (3×3 grid), repeat, mode
 *    (alpha / luminance / match-source) — applied to every mask type.
 *  - Live preview: ≥288px tall checkerboard stage with a vivid, blue-free
 *    multi-stop gradient as the masked content layer.
 *  - Generated CSS: emits `mask-image/size/position/repeat/mode` plus
 *    `-webkit-` prefixed siblings. Copy button with 2s Check confirmation.
 *  - 7 presets: Fade bottom, Fade edges, Circle reveal, Star shape,
 *    Text reveal, Diamond cut, Clear (Clear → `mask-image: none`).
 *
 * Browser support: `mask-*` is Baseline (Chrome 120+, FF 53+, Safari 15.4+
 * unprefixed; `-webkit-` prefixes cover older Safari back to 4+).
 */

// ============================================================
// Types
// ============================================================

type MaskType = "gradient" | "image" | "text";
type GradientShape = "linear" | "radial";
type RadialShape = "circle" | "ellipse";
type ImagePreset =
  | "circle"
  | "star"
  | "heart"
  | "hexagon"
  | "triangle"
  | "diamond"
  | "blob"
  | "arrow";
type MaskSizeKey = "contain" | "cover" | "custom";
type MaskRepeat = "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
type MaskMode = "alpha" | "luminance" | "match-source";
type PositionKey =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
type FontWeight = "300" | "400" | "500" | "600" | "700" | "800" | "900";
type FontFamily = "sans" | "serif" | "mono" | "display";

interface MaskState {
  type: MaskType;
  /** When true, emits `mask-image: none` (Clear). Cleared by any edit. */
  noneMode: boolean;
  // gradient
  gradShape: GradientShape;
  angle: number;
  radialShape: RadialShape;
  radialPosX: number;
  radialPosY: number;
  stop1Pos: number;
  stop2Pos: number;
  // image
  imagePreset: ImagePreset;
  uploadedDataUrl: string | null;
  // text
  textContent: string;
  fontSize: number;
  fontWeight: FontWeight;
  fontFamily: FontFamily;
  // common
  maskSizeKey: MaskSizeKey;
  maskSizeCustom: number;
  maskPos: PositionKey;
  maskRepeat: MaskRepeat;
  maskMode: MaskMode;
}

// ============================================================
// Constants
// ============================================================

/**
 * The vivid gradient painted UNDER the mask. Strictly blue/indigo-free
 * (red → orange → yellow → teal → magenta) so it reads on any theme.
 */
const COLORFUL_GRADIENT =
  "linear-gradient(135deg, hsl(14 90% 60%), hsl(35 95% 58%) 28%, hsl(50 95% 55%) 52%, hsl(160 70% 45%) 76%, hsl(330 80% 62%))";

/** Copy-button confirmation window (ms). */
const COPY_TIMEOUT = 2000;

/** Preview stage minimum height (px) — satisfies the ≥280px spec. */
const PREVIEW_HEIGHT = "h-72 sm:h-80"; // 288 / 320

/**
 * SVG sources for the 8 built-in image-mask presets. Each is a 100×100
 * viewBox with the shape filled solid `black` (opaque = visible region).
 * Encoded via `encodeURIComponent` into a `data:image/svg+xml,` URL.
 */
const SVG_MASKS: Record<ImagePreset, string> = {
  circle:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="black"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,2 61,38 99,38 68,61 80,97 50,75 20,97 32,61 1,38 39,38" fill="black"/></svg>',
  heart:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,88 C18,68 2,48 2,28 C2,14 14,4 27,4 C37,4 45,10 50,20 C55,10 63,4 73,4 C86,4 98,14 98,28 C98,48 82,68 50,88 Z" fill="black"/></svg>',
  hexagon:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,0 100,25 100,75 50,100 0,75 0,25" fill="black"/></svg>',
  triangle:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,2 98,98 2,98" fill="black"/></svg>',
  diamond:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,0 100,50 50,100 0,50" fill="black"/></svg>',
  blob: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,2 C78,2 98,22 98,48 C98,74 80,98 52,98 C24,98 2,80 2,50 C2,22 22,2 50,2 Z" fill="black"/></svg>',
  arrow:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="0,35 58,35 58,12 98,50 58,88 58,65 0,65" fill="black"/></svg>',
};

interface ImagePresetMeta {
  key: ImagePreset;
  label: string;
  Icon: typeof Circle;
}

const IMAGE_PRESETS: ImagePresetMeta[] = [
  { key: "circle", label: "Circle", Icon: Circle },
  { key: "star", label: "Star", Icon: Star },
  { key: "heart", label: "Heart", Icon: Heart },
  { key: "hexagon", label: "Hexagon", Icon: Hexagon },
  { key: "triangle", label: "Triangle", Icon: Triangle },
  { key: "diamond", label: "Diamond", Icon: Diamond },
  { key: "blob", label: "Blob", Icon: Droplet },
  { key: "arrow", label: "Arrow", Icon: ArrowRight },
];

interface PositionPresetMeta {
  key: PositionKey;
  label: string;
  /** CSS value (horizontal vertical, keyword form). */
  css: string;
  /** Grid row 0–2 (top→bottom). */
  row: number;
  /** Grid col 0–2 (left→right). */
  col: number;
}

const POSITION_PRESETS: PositionPresetMeta[] = [
  { key: "top-left", label: "Top Left", css: "left top", row: 0, col: 0 },
  { key: "top-center", label: "Top Center", css: "center top", row: 0, col: 1 },
  { key: "top-right", label: "Top Right", css: "right top", row: 0, col: 2 },
  { key: "center-left", label: "Center Left", css: "left center", row: 1, col: 0 },
  { key: "center", label: "Center", css: "center center", row: 1, col: 1 },
  { key: "center-right", label: "Center Right", css: "right center", row: 1, col: 2 },
  { key: "bottom-left", label: "Bottom Left", css: "left bottom", row: 2, col: 0 },
  { key: "bottom-center", label: "Bottom Center", css: "center bottom", row: 2, col: 1 },
  { key: "bottom-right", label: "Bottom Right", css: "right bottom", row: 2, col: 2 },
];

/** Map the FontFamily key to a CSS generic stack usable in SVG `<text>`. */
const FONT_FAMILY_CSS: Record<FontFamily, string> = {
  sans: "sans-serif",
  serif: "serif",
  mono: "monospace",
  display: "Arial Black, sans-serif",
};

const FONT_WEIGHTS: FontWeight[] = ["300", "400", "500", "600", "700", "800", "900"];

interface MaskTypeMeta {
  key: MaskType;
  label: string;
  Icon: typeof Blend;
}

const MASK_TYPES: MaskTypeMeta[] = [
  { key: "gradient", label: "Gradient", Icon: Blend },
  { key: "image", label: "Image", Icon: Images },
  { key: "text", label: "Text", Icon: Type },
];

const DEFAULT_STATE: MaskState = {
  type: "gradient",
  noneMode: false,
  gradShape: "linear",
  angle: 180,
  radialShape: "ellipse",
  radialPosX: 50,
  radialPosY: 50,
  stop1Pos: 0,
  stop2Pos: 100,
  imagePreset: "circle",
  uploadedDataUrl: null,
  textContent: "RoyCSS",
  fontSize: 120,
  fontWeight: "800",
  fontFamily: "sans",
  maskSizeKey: "cover",
  maskSizeCustom: 100,
  maskPos: "center",
  maskRepeat: "no-repeat",
  maskMode: "alpha",
};

interface Preset {
  name: string;
  /** Partial state to merge. `clear: true` short-circuits to `none` mode. */
  clear?: boolean;
  state: Partial<MaskState>;
}

const PRESETS: Preset[] = [
  {
    name: "Fade bottom",
    state: {
      type: "gradient",
      gradShape: "linear",
      angle: 180,
      stop1Pos: 0,
      stop2Pos: 100,
      maskSizeKey: "cover",
      maskPos: "center",
      maskRepeat: "no-repeat",
      maskMode: "alpha",
    },
  },
  {
    name: "Fade edges",
    state: {
      type: "gradient",
      gradShape: "radial",
      radialShape: "ellipse",
      radialPosX: 50,
      radialPosY: 50,
      stop1Pos: 0,
      stop2Pos: 75,
      maskSizeKey: "cover",
      maskPos: "center",
      maskRepeat: "no-repeat",
      maskMode: "alpha",
    },
  },
  {
    name: "Circle reveal",
    state: {
      type: "image",
      imagePreset: "circle",
      uploadedDataUrl: null,
      maskSizeKey: "cover",
      maskPos: "center",
      maskRepeat: "no-repeat",
      maskMode: "alpha",
    },
  },
  {
    name: "Star shape",
    state: {
      type: "image",
      imagePreset: "star",
      uploadedDataUrl: null,
      maskSizeKey: "contain",
      maskPos: "center",
      maskRepeat: "no-repeat",
      maskMode: "alpha",
    },
  },
  {
    name: "Text reveal",
    state: {
      type: "text",
      textContent: "RoyCSS",
      fontSize: 140,
      fontWeight: "800",
      fontFamily: "sans",
      maskSizeKey: "contain",
      maskPos: "center",
      maskRepeat: "no-repeat",
      maskMode: "alpha",
    },
  },
  {
    name: "Diamond cut",
    state: {
      type: "image",
      imagePreset: "diamond",
      uploadedDataUrl: null,
      maskSizeKey: "contain",
      maskPos: "center",
      maskRepeat: "repeat",
      maskMode: "alpha",
    },
  },
  { name: "Clear", clear: true, state: {} },
];

// ============================================================
// Helpers
// ============================================================

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Encode an SVG string into a `data:image/svg+xml,` URL safe for `mask-image`. */
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** XML-escape text content before embedding in an SVG `<text>` node. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Build the `linear-gradient(...)` / `radial-gradient(...)` mask-image value. */
function buildGradientMaskImage(s: MaskState): string {
  if (s.gradShape === "linear") {
    return `linear-gradient(${Math.round(s.angle)}deg, transparent ${Math.round(s.stop1Pos)}%, black ${Math.round(s.stop2Pos)}%)`;
  }
  return `radial-gradient(${s.radialShape} at ${Math.round(s.radialPosX)}% ${Math.round(s.radialPosY)}%, transparent ${Math.round(s.stop1Pos)}%, black ${Math.round(s.stop2Pos)}%)`;
}

/** Build an inline SVG whose `<text>` node forms the mask shape. */
function buildTextMaskSvg(s: MaskState): string {
  const fam = FONT_FAMILY_CSS[s.fontFamily];
  const text = escapeXml(s.textContent.trim() === "" ? "RoyCSS" : s.textContent);
  const w = 800;
  const h = Math.max(40, Math.round(s.fontSize * 1.6));
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<text x="50%" y="50%" font-family="${fam}" font-size="${Math.round(s.fontSize)}" ` +
    `font-weight="${s.fontWeight}" text-anchor="middle" dominant-baseline="central" fill="black">` +
    `${text}</text></svg>`
  );
}

/** Resolve the final `mask-image` value for any type (or `"none"` when cleared). */
function buildMaskImage(s: MaskState): string {
  if (s.noneMode) return "none";
  switch (s.type) {
    case "gradient":
      return buildGradientMaskImage(s);
    case "image":
      return s.uploadedDataUrl ?? svgToDataUrl(SVG_MASKS[s.imagePreset]);
    case "text":
      return svgToDataUrl(buildTextMaskSvg(s));
  }
}

function buildMaskSizeCss(s: MaskState): string {
  if (s.maskSizeKey === "custom") return `${Math.round(s.maskSizeCustom)}%`;
  return s.maskSizeKey;
}

function buildMaskPosCss(s: MaskState): string {
  return POSITION_PRESETS.find((p) => p.key === s.maskPos)?.css ?? "center center";
}

/** Compose the full generated CSS block, standard + `-webkit-` prefixed. */
function buildGeneratedCss(s: MaskState): string {
  const maskImage = buildMaskImage(s);
  const maskSize = buildMaskSizeCss(s);
  const maskPos = buildMaskPosCss(s);
  const maskRepeat = s.maskRepeat;
  const maskMode = s.maskMode;
  return [
    ".masked-element {",
    `  mask-image: ${maskImage};`,
    `  mask-size: ${maskSize};`,
    `  mask-position: ${maskPos};`,
    `  mask-repeat: ${maskRepeat};`,
    `  mask-mode: ${maskMode};`,
    `  -webkit-mask-image: ${maskImage};`,
    `  -webkit-mask-size: ${maskSize};`,
    `  -webkit-mask-position: ${maskPos};`,
    `  -webkit-mask-repeat: ${maskRepeat};`,
    `  -webkit-mask-mode: ${maskMode};`,
    "}",
  ].join("\n");
}

/**
 * Checkerboard backdrop for the preview stage so transparent-mask regions
 * are visually distinct from the muted base. Uses fixed rgba (theme-agnostic).
 */
const CHECKERBOARD_STYLE: CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, rgba(128,128,128,0.18) 25%, transparent 25%), " +
    "linear-gradient(-45deg, rgba(128,128,128,0.18) 25%, transparent 25%), " +
    "linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.18) 75%), " +
    "linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.18) 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
};

// ============================================================
// Sub-components
// ============================================================

interface PreviewStageProps {
  state: MaskState;
}

function PreviewStage({ state }: PreviewStageProps) {
  const maskImage = buildMaskImage(state);
  const maskSize = buildMaskSizeCss(state);
  const maskPos = buildMaskPosCss(state);
  const isNone = maskImage === "none";

  const maskedStyle = useMemo<CSSProperties>(
    () => ({
      backgroundImage: COLORFUL_GRADIENT,
      maskImage: isNone ? undefined : maskImage,
      WebkitMaskImage: isNone ? undefined : maskImage,
      maskSize: isNone ? undefined : maskSize,
      WebkitMaskSize: isNone ? undefined : maskSize,
      maskPosition: isNone ? undefined : maskPos,
      WebkitMaskPosition: isNone ? undefined : maskPos,
      maskRepeat: isNone ? undefined : state.maskRepeat,
      WebkitMaskRepeat: isNone ? undefined : state.maskRepeat,
      maskMode: isNone ? undefined : state.maskMode,
      WebkitMaskMode: isNone ? undefined : state.maskMode,
    }),
    [isNone, maskImage, maskSize, maskPos, state.maskRepeat, state.maskMode],
  );

  const typeLabel = MASK_TYPES.find((t) => t.key === state.type)?.label ?? "";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-card",
        PREVIEW_HEIGHT,
      )}
    >
      {/* Checkerboard backdrop — shows through transparent mask regions. */}
      <div className="absolute inset-0" style={CHECKERBOARD_STYLE} aria-hidden />

      {/* Masked content layer (the vivid gradient, clipped by the mask). */}
      <div className="absolute inset-0" style={maskedStyle} aria-hidden />

      {/* Stage label */}
      <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5">
        <span className="rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
          {isNone ? "No mask" : typeLabel}
        </span>
      </div>
      <div className="pointer-events-none absolute right-2 top-2">
        <span className="rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
          masked-element
        </span>
      </div>
    </div>
  );
}

interface PositionGridProps {
  value: PositionKey;
  onChange: (key: PositionKey) => void;
}

function PositionGrid({ value, onChange }: PositionGridProps) {
  return (
    <div
      className="grid grid-cols-3 gap-1.5"
      role="radiogroup"
      aria-label="Mask position"
      style={{ width: "min(100%, 132px)" }}
    >
      {POSITION_PRESETS.map((meta) => {
        const active = value === meta.key;
        const dotPos: CSSProperties = {
          top: `${(meta.row / 2) * 100}%`,
          left: `${(meta.col / 2) * 100}%`,
        };
        return (
          <button
            key={meta.key}
            type="button"
            onClick={() => onChange(meta.key)}
            aria-pressed={active}
            aria-label={meta.label}
            title={meta.label}
            className={cn(
              "relative aspect-square rounded-md border transition-colors",
              active
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <span
              className={cn(
                "absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                active ? "bg-primary" : "bg-muted-foreground/60",
              )}
              style={dotPos}
            />
          </button>
        );
      })}
    </div>
  );
}

interface NumberSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: NumberSliderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={Math.round(value * 100) / 100}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange(clamp(n, min, max));
            }}
            className="h-7 w-16 text-xs"
          />
          {unit ? (
            <span className="w-8 text-[11px] text-muted-foreground">{unit}</span>
          ) : null}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        aria-label={label}
      />
    </div>
  );
}

interface GradientControlsProps {
  state: MaskState;
  patch: (p: Partial<MaskState>) => void;
}

function GradientControls({ state, patch }: GradientControlsProps) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5">
        <Blend className="size-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Gradient mask</span>
      </div>

      {/* Shape toggle */}
      <div className="flex gap-1.5">
        {(["linear", "radial"] as GradientShape[]).map((shape) => (
          <Button
            key={shape}
            variant={state.gradShape === shape ? "default" : "outline"}
            size="sm"
            onClick={() => patch({ gradShape: shape })}
            className="h-7 flex-1 text-xs capitalize"
            aria-pressed={state.gradShape === shape}
          >
            {shape}
          </Button>
        ))}
      </div>

      {state.gradShape === "linear" ? (
        <NumberSlider
          label="Angle"
          value={state.angle}
          min={0}
          max={360}
          step={1}
          unit="deg"
          onChange={(v) => patch({ angle: v })}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {(["ellipse", "circle"] as RadialShape[]).map((shape) => (
              <Button
                key={shape}
                variant={state.radialShape === shape ? "default" : "outline"}
                size="sm"
                onClick={() => patch({ radialShape: shape })}
                className="h-7 flex-1 text-xs capitalize"
                aria-pressed={state.radialShape === shape}
              >
                {shape}
              </Button>
            ))}
          </div>
          <NumberSlider
            label="Center X"
            value={state.radialPosX}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => patch({ radialPosX: v })}
          />
          <NumberSlider
            label="Center Y"
            value={state.radialPosY}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => patch({ radialPosY: v })}
          />
        </div>
      )}

      <div className="space-y-3 border-t border-border pt-3">
        <NumberSlider
          label="Stop 1 (transparent)"
          value={state.stop1Pos}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => patch({ stop1Pos: v })}
        />
        <NumberSlider
          label="Stop 2 (opaque)"
          value={state.stop2Pos}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(v) => patch({ stop2Pos: v })}
        />
      </div>
    </section>
  );
}

interface ImageControlsProps {
  state: MaskState;
  patch: (p: Partial<MaskState>) => void;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

function ImageControls({ state, patch, onUpload }: ImageControlsProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <Images className="size-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Image mask</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          className="h-7 gap-1.5 text-xs"
        >
          <Upload className="size-3" />
          Upload
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onUpload}
          className="hidden"
        />
      </div>

      {/* 8 SVG presets */}
      <div className="grid grid-cols-4 gap-1.5">
        {IMAGE_PRESETS.map(({ key, label, Icon }) => {
          const active = state.imagePreset === key && !state.uploadedDataUrl;
          return (
            <button
              key={key}
              type="button"
              onClick={() => patch({ imagePreset: key, uploadedDataUrl: null })}
              aria-pressed={active}
              aria-label={label}
              title={label}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-md border transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      {state.uploadedDataUrl ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5">
          <span className="truncate text-[11px] text-muted-foreground">
            Custom upload
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => patch({ uploadedDataUrl: null })}
            className="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
          >
            Remove
          </Button>
        </div>
      ) : null}
    </section>
  );
}

interface TextControlsProps {
  state: MaskState;
  patch: (p: Partial<MaskState>) => void;
}

function TextControls({ state, patch }: TextControlsProps) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5">
        <Type className="size-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Text mask</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="roycss-mask-text" className="text-[11px] text-muted-foreground">
          Text content
        </Label>
        <Input
          id="roycss-mask-text"
          type="text"
          value={state.textContent}
          onChange={(e) => patch({ textContent: e.target.value })}
          placeholder="RoyCSS"
          className="h-8 text-sm"
        />
      </div>

      <NumberSlider
        label="Font size"
        value={state.fontSize}
        min={24}
        max={200}
        step={1}
        unit="px"
        onChange={(v) => patch({ fontSize: v })}
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] text-muted-foreground">Weight</Label>
          <Select
            value={state.fontWeight}
            onValueChange={(v) => patch({ fontWeight: v as FontWeight })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((w) => (
                <SelectItem key={w} value={w} className="text-xs">
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] text-muted-foreground">Family</Label>
          <Select
            value={state.fontFamily}
            onValueChange={(v) => patch({ fontFamily: v as FontFamily })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sans" className="text-xs">
                Sans
              </SelectItem>
              <SelectItem value="serif" className="text-xs">
                Serif
              </SelectItem>
              <SelectItem value="mono" className="text-xs">
                Mono
              </SelectItem>
              <SelectItem value="display" className="text-xs">
                Display
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}

interface CommonMaskPropsProps {
  state: MaskState;
  patch: (p: Partial<MaskState>) => void;
}

function CommonMaskProps({ state, patch }: CommonMaskPropsProps) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">
          Mask properties
        </span>
        <Badge variant="outline" className="ml-auto text-[10px] font-mono">
          {buildMaskSizeCss(state)} · {buildMaskPosCss(state)}
        </Badge>
      </div>

      {/* mask-size */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] text-muted-foreground">mask-size</Label>
        <div className="flex gap-1.5">
          {(["contain", "cover", "custom"] as MaskSizeKey[]).map((k) => (
            <Button
              key={k}
              variant={state.maskSizeKey === k ? "default" : "outline"}
              size="sm"
              onClick={() => patch({ maskSizeKey: k })}
              className="h-7 flex-1 text-xs capitalize"
              aria-pressed={state.maskSizeKey === k}
            >
              {k}
            </Button>
          ))}
        </div>
        {state.maskSizeKey === "custom" ? (
          <NumberSlider
            label="Custom size"
            value={state.maskSizeCustom}
            min={10}
            max={300}
            step={1}
            unit="%"
            onChange={(v) => patch({ maskSizeCustom: v })}
          />
        ) : null}
      </div>

      {/* mask-position */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] text-muted-foreground">mask-position</Label>
        <div className="flex items-start gap-3">
          <PositionGrid
            value={state.maskPos}
            onChange={(k) => patch({ maskPos: k })}
          />
          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">mask-repeat</Label>
              <Select
                value={state.maskRepeat}
                onValueChange={(v) => patch({ maskRepeat: v as MaskRepeat })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-repeat" className="text-xs">
                    no-repeat
                  </SelectItem>
                  <SelectItem value="repeat" className="text-xs">
                    repeat
                  </SelectItem>
                  <SelectItem value="repeat-x" className="text-xs">
                    repeat-x
                  </SelectItem>
                  <SelectItem value="repeat-y" className="text-xs">
                    repeat-y
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground">mask-mode</Label>
              <Select
                value={state.maskMode}
                onValueChange={(v) => patch({ maskMode: v as MaskMode })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha" className="text-xs">
                    alpha
                  </SelectItem>
                  <SelectItem value="luminance" className="text-xs">
                    luminance
                  </SelectItem>
                  <SelectItem value="match-source" className="text-xs">
                    match-source
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Component
// ============================================================

export function MaskStudio() {
  const [state, setState] = useState<MaskState>(DEFAULT_STATE);
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Patch helper: merges a partial into state and clears noneMode ── */
  const patch = useCallback((p: Partial<MaskState>) => {
    setState((prev) => ({ ...prev, ...p, noneMode: false }));
    setActivePreset("");
  }, []);

  const setType = useCallback(
    (type: MaskType) => {
      setState((prev) => ({ ...prev, type, noneMode: false }));
      setActivePreset("");
    },
    [],
  );

  /* ── Upload handler ────────────────────────────────────────────────── */
  const onUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setState((prev) => ({
          ...prev,
          type: "image",
          uploadedDataUrl: result,
          noneMode: false,
        }));
        setActivePreset("");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  /* ── Apply preset (Clear → noneMode) ───────────────────────────────── */
  const applyPreset = useCallback((preset: Preset) => {
    if (preset.clear) {
      setState((prev) => ({ ...prev, noneMode: true }));
    } else {
      setState((prev) => ({ ...prev, ...preset.state, noneMode: false }));
    }
    setActivePreset(preset.clear ? "" : preset.name);
  }, []);

  /* ── Copy generated CSS ────────────────────────────────────────────── */
  const generatedCss = useMemo(() => buildGeneratedCss(state), [state]);

  const copyCss = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), COPY_TIMEOUT);
    } catch {
      /* clipboard unavailable */
    }
  }, [generatedCss]);

  /* ── Clear timer on unmount ────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brush className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">CSS Mask Studio</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {state.noneMode ? "none" : MASK_TYPES.find((t) => t.key === state.type)?.label}
        </Badge>
      </div>

      {/* Mask type selector */}
      <div className="grid grid-cols-3 gap-1.5">
        {MASK_TYPES.map(({ key, label, Icon }) => (
          <Button
            key={key}
            variant={state.type === key && !state.noneMode ? "default" : "outline"}
            size="sm"
            onClick={() => setType(key)}
            className="h-9 gap-1.5 text-xs"
            aria-pressed={state.type === key && !state.noneMode}
          >
            <Icon className="size-3.5" />
            {label}
          </Button>
        ))}
      </div>

      {/* Live preview */}
      <PreviewStage state={state} />

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const isClear = preset.clear === true;
          const active = !isClear && activePreset === preset.name;
          return (
            <Button
              key={preset.name}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset(preset)}
              className="h-7 gap-1 px-2.5 text-xs"
              aria-pressed={active}
            >
              {isClear ? (
                <Eraser className="size-3" />
              ) : (
                <Sparkles className="size-3" />
              )}
              {preset.name}
            </Button>
          );
        })}
      </div>

      {/* Type-specific controls */}
      {state.type === "gradient" ? (
        <GradientControls state={state} patch={patch} />
      ) : null}
      {state.type === "image" ? (
        <ImageControls state={state} patch={patch} onUpload={onUpload} />
      ) : null}
      {state.type === "text" ? (
        <TextControls state={state} patch={patch} />
      ) : null}

      {/* Common mask properties */}
      <CommonMaskProps state={state} patch={patch} />

      {/* Generated CSS */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Generated CSS
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={copyCss}
            className="h-7 gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="size-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> Copy
              </>
            )}
          </Button>
        </div>
        <pre className="max-h-56 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
          <code>{generatedCss}</code>
        </pre>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Move className="size-3" />
          Safari needs the{" "}
          <code className="text-foreground">-webkit-</code> prefixed siblings —
          both are emitted above.
        </p>
      </div>
    </div>
  );
}
