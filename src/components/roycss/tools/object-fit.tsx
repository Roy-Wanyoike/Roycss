"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type SyntheticEvent,
} from "react";
import { motion } from "framer-motion";
import {
  Crop,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  Frame,
  Move,
  Link2,
  RotateCcw,
  ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
 * ObjectFitVisualizer — an interactive CSS `object-fit` + `object-position`
 * playground with side-by-side comparison and live preview on different
 * container aspect ratios.
 *
 * Features:
 *  - Object-fit selector: 5 buttons (`fill`, `contain`, `cover`, `none`,
 *    `scale-down`) each with a Lucide icon that hints at the behaviour.
 *  - Object-position: a 3×3 grid of named presets (top-left … bottom-right)
 *    with a dot that mirrors the anchor point, PLUS free-form custom X / Y
 *    inputs with a `%` / `px` unit toggle per axis. Selecting "custom"
 *    deselects the 3×3 grid; editing a preset value is a one-tap action.
 *  - Container aspect ratio: 6 named ratios (`1:1`, `16:9`, `4:3`, `3:2`,
 *    `9:16`, `21:9`) plus a `custom` mode with width × height inputs. The
 *    preview box uses the resulting `aspect-ratio` so the fit is honest.
 *  - Image source: 4 picsum.photos sample images at known dimensions
 *    (landscape 800×600, portrait 600×800, square 600×600, panoramic
 *    1200×400) OR a user-pasted URL. Custom-URL images report their
 *    natural dimensions back via `onLoad` so the stats line stays accurate.
 *  - Live preview: the container (with chosen aspect ratio) shows the image
 *    with the selected `object-fit` + `object-position`, on a checkerboard
 *    background so any letterboxing / cropping is visible at a glance.
 *  - Side-by-side comparison: ALL 5 object-fit values rendered
 *    simultaneously in small thumbnails (same image, same container), with
 *    the active one highlighted via a primary border.
 *  - Generated CSS: spec-exact block with `.image-container img` selector,
 *    `object-fit`, `object-position`, `width: 100%`, `height: 100%`. Copy
 *    button with 1.5 s Check confirmation.
 *  - Stats line: `Container: WxH (ratio) · Image: WxH (ratio) · Fit: cover`.
 *
 * Theme: semantic tokens only (`bg-card`, `border-border`, `text-muted-foreground`,
 * `text-primary`, `bg-muted`, `bg-primary/10`), oklch palette, no indigo/blue.
 * TS strict, no `any`, no console.log. CSS strings are memoised; clipboard
 * writes are best-effort with a timer that is cleared on unmount.
 */

// ============================================================
// Types
// ============================================================

type ObjectFit = "fill" | "contain" | "cover" | "none" | "scale-down";

type PositionPreset =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "custom";

type PositionUnit = "%" | "px";

type AspectKey =
  | "1:1"
  | "16:9"
  | "4:3"
  | "3:2"
  | "9:16"
  | "21:9"
  | "custom";

type ImageSourceKey =
  | "landscape"
  | "portrait"
  | "square"
  | "panoramic"
  | "custom";

interface SampleImage {
  key: Exclude<ImageSourceKey, "custom">;
  label: string;
  url: string;
  width: number;
  height: number;
}

interface AspectMeta {
  key: Exclude<AspectKey, "custom">;
  label: string;
  w: number;
  h: number;
}

interface ObjectFitMeta {
  key: ObjectFit;
  label: string;
  /** Lucide icon component. */
  Icon: typeof Maximize2;
  /** Short tooltip-style description. */
  desc: string;
}

interface PositionPresetMeta {
  key: Exclude<PositionPreset, "custom">;
  label: string;
  /** CSS value (horizontal vertical, keyword form). */
  css: string;
  /** Grid row 0–2 (top→bottom). */
  row: number;
  /** Grid col 0–2 (left→right). */
  col: number;
}

// ============================================================
// Constants
// ============================================================

const SAMPLE_IMAGES: SampleImage[] = [
  {
    key: "landscape",
    label: "Landscape · 800×600",
    url: "https://picsum.photos/seed/roycss-land/800/600",
    width: 800,
    height: 600,
  },
  {
    key: "portrait",
    label: "Portrait · 600×800",
    url: "https://picsum.photos/seed/roycss-port/600/800",
    width: 600,
    height: 800,
  },
  {
    key: "square",
    label: "Square · 600×600",
    url: "https://picsum.photos/seed/roycss-sq/600/600",
    width: 600,
    height: 600,
  },
  {
    key: "panoramic",
    label: "Panoramic · 1200×400",
    url: "https://picsum.photos/seed/roycss-pano/1200/400",
    width: 1200,
    height: 400,
  },
];

const ASPECT_RATIOS: AspectMeta[] = [
  { key: "1:1", label: "1:1 · Square", w: 1, h: 1 },
  { key: "16:9", label: "16:9 · Widescreen", w: 16, h: 9 },
  { key: "4:3", label: "4:3 · Standard", w: 4, h: 3 },
  { key: "3:2", label: "3:2 · Photo", w: 3, h: 2 },
  { key: "9:16", label: "9:16 · Portrait", w: 9, h: 16 },
  { key: "21:9", label: "21:9 · Ultrawide", w: 21, h: 9 },
];

const OBJECT_FITS: ObjectFitMeta[] = [
  {
    key: "fill",
    label: "fill",
    Icon: Expand,
    desc: "Stretch to fill — distorts the image.",
  },
  {
    key: "contain",
    label: "contain",
    Icon: Minimize2,
    desc: "Fit entirely — letterboxed.",
  },
  {
    key: "cover",
    label: "cover",
    Icon: Maximize2,
    desc: "Fill + crop the overflow.",
  },
  {
    key: "none",
    label: "none",
    Icon: Frame,
    desc: "Use the image's original size.",
  },
  {
    key: "scale-down",
    label: "scale-down",
    Icon: Shrink,
    desc: "The smaller of none or contain.",
  },
];

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

/** Largest dimension of the main preview box, in CSS px. */
const PREVIEW_MAX = 300;
/** Largest dimension of each comparison thumbnail, in CSS px. */
const THUMB_MAX = 120;
/** Copy-button confirmation window (ms). */
const COPY_TIMEOUT = 1500;

const DEFAULT_CUSTOM_IMAGE_URL =
  "https://picsum.photos/seed/roycss-custom/700/500";

/**
 * Checkerboard background style for preview surfaces. Uses the semantic
 * `--muted` token so the squares stay legible in both light and dark themes.
 */
const CHECKERBOARD_STYLE: CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, var(--muted) 25%, transparent 25%, transparent 75%, var(--muted) 75%), linear-gradient(45deg, var(--muted) 25%, transparent 25%, transparent 75%, var(--muted) 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 8px 8px",
};

// ============================================================
// Helpers
// ============================================================

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Reduce W×H to a `W:H` ratio string, falling back to a decimal for odd sizes. */
function aspectLabel(w: number, h: number): string {
  if (w <= 0 || h <= 0) return "—";
  const g = gcd(w, h);
  const rw = w / g;
  const rh = h / g;
  // Cap the integer ratio to stay readable; beyond that show a decimal.
  if (rw > 99 || rh > 99) {
    return `${(w / h).toFixed(2)}:1`;
  }
  return `${rw}:${rh}`;
}

/** Scale a W×H pair so its largest dimension equals `max`. */
function fitToMax(w: number, h: number, max: number): { w: number; h: number } {
  if (w <= 0 || h <= 0) return { w: max, h: max };
  const r = Math.min(max / w, max / h);
  return { w: Math.round(w * r), h: Math.round(h * r) };
}

/** Best-effort clipboard write. Resolves true on success. */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* clipboard unavailable — silent */
  }
  return false;
}

// ============================================================
// Sub-components
// ============================================================

interface FitButtonProps {
  meta: ObjectFitMeta;
  active: boolean;
  onSelect: (key: ObjectFit) => void;
}

function FitButton({ meta, active, onSelect }: FitButtonProps) {
  const { Icon } = meta;
  return (
    <button
      type="button"
      onClick={() => onSelect(meta.key)}
      aria-pressed={active}
      title={meta.desc}
      className={cn(
        "group flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      <span className="font-mono text-[11px] font-medium">{meta.label}</span>
    </button>
  );
}

interface PositionGridButtonProps {
  meta: PositionPresetMeta;
  active: boolean;
  onSelect: (key: Exclude<PositionPreset, "custom">) => void;
}

function PositionGridButton({
  meta,
  active,
  onSelect,
}: PositionGridButtonProps) {
  // Position the dot inside the button to mirror the anchor point.
  const dotPos: CSSProperties = {
    top: `${(meta.row / 2) * 100}%`,
    left: `${(meta.col / 2) * 100}%`,
  };
  return (
    <button
      type="button"
      onClick={() => onSelect(meta.key)}
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
}

interface AspectChipProps {
  meta: AspectMeta;
  active: boolean;
  onSelect: (key: Exclude<AspectKey, "custom">) => void;
}

function AspectChip({ meta, active, onSelect }: AspectChipProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(meta.key)}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {meta.key}
    </button>
  );
}

interface PreviewImageProps {
  src: string;
  fit: ObjectFit;
  positionCss: string;
  onLoad?: (e: SyntheticEvent<HTMLImageElement>) => void;
  onError?: () => void;
  alt?: string;
  loading?: "lazy" | "eager";
}

/**
 * The actual <img> rendered with the user's object-fit + object-position.
 * Used by both the main preview and the comparison thumbnails.
 */
function PreviewImage({
  src,
  fit,
  positionCss,
  onLoad,
  onError,
  alt,
  loading = "lazy",
}: PreviewImageProps) {
  return (
    <img
      src={src}
      alt={alt ?? "Object-fit preview"}
      loading={loading}
      decoding="async"
      onLoad={onLoad}
      onError={onError}
      className="block h-full w-full"
      style={{
        objectFit: fit,
        objectPosition: positionCss,
      }}
      draggable={false}
    />
  );
}

// ============================================================
// Main component
// ============================================================

export function ObjectFitVisualizer() {
  // --- State -----------------------------------------------------------
  const [fit, setFit] = useState<ObjectFit>("cover");
  const [position, setPosition] = useState<PositionPreset>("center");

  // Custom object-position values (used when position === "custom").
  const [customX, setCustomX] = useState("50");
  const [customY, setCustomY] = useState("50");
  const [unitX, setUnitX] = useState<PositionUnit>("%");
  const [unitY, setUnitY] = useState<PositionUnit>("%");

  // Container aspect ratio.
  const [aspectKey, setAspectKey] = useState<AspectKey>("16:9");
  const [customAspectW, setCustomAspectW] = useState(16);
  const [customAspectH, setCustomAspectH] = useState(9);

  // Image source.
  const [imageKey, setImageKey] = useState<ImageSourceKey>("landscape");
  const [customImageUrl, setCustomImageUrl] = useState(DEFAULT_CUSTOM_IMAGE_URL);
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [imageError, setImageError] = useState(false);

  // Copy feedback.
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Derived ---------------------------------------------------------

  const aspectDims = useMemo<{ w: number; h: number }>(() => {
    if (aspectKey === "custom") {
      const w = Math.max(1, Math.round(customAspectW || 1));
      const h = Math.max(1, Math.round(customAspectH || 1));
      return { w, h };
    }
    const found = ASPECT_RATIOS.find((a) => a.key === aspectKey);
    return found ? { w: found.w, h: found.h } : { w: 16, h: 9 };
  }, [aspectKey, customAspectW, customAspectH]);

  const sample = useMemo(
    () => SAMPLE_IMAGES.find((s) => s.key === imageKey) ?? SAMPLE_IMAGES[0],
    [imageKey],
  );

  const imageUrl = useMemo(() => {
    if (imageKey === "custom") return customImageUrl.trim();
    return sample.url;
  }, [imageKey, sample, customImageUrl]);

  const imageDims = useMemo<{ w: number; h: number }>(() => {
    if (imageKey === "custom") return naturalDims ?? { w: 0, h: 0 };
    return { w: sample.width, h: sample.height };
  }, [imageKey, sample, naturalDims]);

  const positionCss = useMemo(() => {
    if (position === "custom") {
      const x = customX.trim() === "" ? "0" : customX.trim();
      const y = customY.trim() === "" ? "0" : customY.trim();
      return `${x}${unitX} ${y}${unitY}`;
    }
    return (
      POSITION_PRESETS.find((p) => p.key === position)?.css ?? "center center"
    );
  }, [position, customX, customY, unitX, unitY]);

  const cssString = useMemo(() => {
    return [
      ".image-container img {",
      `  object-fit: ${fit};`,
      `  object-position: ${positionCss};`,
      "  width: 100%;",
      "  height: 100%;",
      "}",
    ].join("\n");
  }, [fit, positionCss]);

  const previewDims = useMemo(
    () => fitToMax(aspectDims.w, aspectDims.h, PREVIEW_MAX),
    [aspectDims],
  );
  const thumbDims = useMemo(
    () => fitToMax(aspectDims.w, aspectDims.h, THUMB_MAX),
    [aspectDims],
  );

  const containerRatioLabel = useMemo(
    () =>
      aspectKey === "custom"
        ? aspectLabel(aspectDims.w, aspectDims.h)
        : aspectKey,
    [aspectKey, aspectDims],
  );

  const imageRatioLabel = useMemo(
    () => aspectLabel(imageDims.w, imageDims.h),
    [imageDims],
  );

  // --- Callbacks -------------------------------------------------------

  const handleCopy = useCallback(async () => {
    const ok = await writeClipboard(cssString);
    if (!ok) return;
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), COPY_TIMEOUT);
  }, [cssString]);

  const selectPositionPreset = useCallback(
    (key: Exclude<PositionPreset, "custom">) => {
      setPosition(key);
    },
    [],
  );

  const handleCustomXChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setCustomX(e.target.value);
      setPosition("custom");
    },
    [],
  );

  const handleCustomYChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setCustomY(e.target.value);
      setPosition("custom");
    },
    [],
  );

  const handleUnitXChange = useCallback((value: string) => {
    if (value === "%" || value === "px") setUnitX(value);
  }, []);

  const handleUnitYChange = useCallback((value: string) => {
    if (value === "%" || value === "px") setUnitY(value);
  }, []);

  const handleImageLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > 0 && h > 0) {
        setNaturalDims({ w, h });
      }
      setImageError(false);
    },
    [],
  );

  const handleImageError = useCallback(() => {
    setImageError(true);
    setNaturalDims(null);
  }, []);

  const handleImageSourceChange = useCallback((value: string) => {
    if (
      value === "landscape" ||
      value === "portrait" ||
      value === "square" ||
      value === "panoramic" ||
      value === "custom"
    ) {
      setImageKey(value);
      setImageError(false);
      setNaturalDims(null);
    }
  }, []);

  const handleCustomAspectWChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const n = parseInt(e.target.value, 10);
      setCustomAspectW(Number.isFinite(n) ? Math.max(1, n) : 1);
    },
    [],
  );

  const handleCustomAspectHChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const n = parseInt(e.target.value, 10);
      setCustomAspectH(Number.isFinite(n) ? Math.max(1, n) : 1);
    },
    [],
  );

  const handleCustomUrlChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setCustomImageUrl(e.target.value);
      setImageError(false);
      setNaturalDims(null);
    },
    [],
  );

  const handleReset = useCallback(() => {
    setFit("cover");
    setPosition("center");
    setCustomX("50");
    setCustomY("50");
    setUnitX("%");
    setUnitY("%");
    setAspectKey("16:9");
    setCustomAspectW(16);
    setCustomAspectH(9);
    setImageKey("landscape");
    setCustomImageUrl(DEFAULT_CUSTOM_IMAGE_URL);
    setNaturalDims(null);
    setImageError(false);
  }, []);

  // --- Lifecycle: clean up the copy timer on unmount -------------------

  useEffect(() => {
    return () => {
      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
        copyTimer.current = null;
      }
    };
  }, []);

  // --- Render ----------------------------------------------------------

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
            <Crop className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Object Fit &amp; Position
            </h2>
            <p className="text-xs text-muted-foreground">
              Visualise how <code className="font-mono">object-fit</code> &amp;{" "}
              <code className="font-mono">object-position</code> behave across
              aspect ratios.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          aria-label="Reset to defaults"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </header>

      {/* Object-fit selector */}
      <section
        className="space-y-2 rounded-xl border border-border bg-card p-3"
        aria-label="Object-fit selector"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          <span>object-fit</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {OBJECT_FITS.map((meta) => (
            <FitButton
              key={meta.key}
              meta={meta}
              active={fit === meta.key}
              onSelect={setFit}
            />
          ))}
        </div>
      </section>

      {/* Aspect ratio + Image source row */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Aspect ratio */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Frame className="size-3.5 text-primary" />
            <span>Container aspect ratio</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_RATIOS.map((meta) => (
              <AspectChip
                key={meta.key}
                meta={meta}
                active={aspectKey === meta.key}
                onSelect={(k) => setAspectKey(k)}
              />
            ))}
            <button
              type="button"
              onClick={() => setAspectKey("custom")}
              aria-pressed={aspectKey === "custom"}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
                aspectKey === "custom"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              custom
            </button>
          </div>
          {aspectKey === "custom" && (
            <div className="flex items-end gap-2 pt-1">
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="roycss-of-custom-w"
                  className="text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  Width
                </Label>
                <Input
                  id="roycss-of-custom-w"
                  type="number"
                  min={1}
                  value={customAspectW}
                  onChange={handleCustomAspectWChange}
                  className="h-8 font-mono text-xs"
                />
              </div>
              <span className="pb-1.5 font-mono text-xs text-muted-foreground">
                :
              </span>
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="roycss-of-custom-h"
                  className="text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  Height
                </Label>
                <Input
                  id="roycss-of-custom-h"
                  type="number"
                  min={1}
                  value={customAspectH}
                  onChange={handleCustomAspectHChange}
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Image source */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ImageIcon className="size-3.5 text-primary" />
            <span>Image source</span>
          </div>
          <Select value={imageKey} onValueChange={handleImageSourceChange}>
            <SelectTrigger className="h-9 w-full font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SAMPLE_IMAGES.map((s) => (
                <SelectItem key={s.key} value={s.key} className="font-mono text-xs">
                  {s.label}
                </SelectItem>
              ))}
              <SelectItem value="custom" className="font-mono text-xs">
                Custom URL
              </SelectItem>
            </SelectContent>
          </Select>
          {imageKey === "custom" && (
            <div className="space-y-1">
              <Label
                htmlFor="roycss-of-custom-url"
                className="sr-only"
              >
                Custom image URL
              </Label>
              <div className="flex items-center gap-1.5">
                <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                <Input
                  id="roycss-of-custom-url"
                  type="url"
                  value={customImageUrl}
                  onChange={handleCustomUrlChange}
                  placeholder="https://example.com/image.jpg"
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>
          )}
          {imageError && (
            <p className="text-[10px] text-destructive">
              Could not load that image — check the URL.
            </p>
          )}
        </div>
      </section>

      {/* Main preview */}
      <section className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            <span>Live preview</span>
          </div>
          <Badge
            variant="outline"
            className="border-border bg-muted/50 font-mono text-[10px] text-muted-foreground"
          >
            {aspectKey === "custom" ? containerRatioLabel : aspectKey}
            {" · "}
            {previewDims.w}×{previewDims.h}
          </Badge>
        </div>
        <div className="flex justify-center rounded-lg bg-muted/30 p-3">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="image-container relative overflow-hidden rounded-md border-2 border-primary/40"
            style={{
              ...CHECKERBOARD_STYLE,
              width: previewDims.w,
              height: previewDims.h,
            }}
            role="img"
            aria-label={`Preview of object-fit: ${fit}, object-position: ${positionCss}, in a ${containerRatioLabel} container.`}
          >
            {imageUrl ? (
              <PreviewImage
                src={imageUrl}
                fit={fit}
                positionCss={positionCss}
                onLoad={imageKey === "custom" ? handleImageLoad : undefined}
                onError={imageKey === "custom" ? handleImageError : undefined}
                alt="Object-fit preview"
                loading="eager"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                No image
              </div>
            )}
          </motion.div>
        </div>
        {/* Stats */}
        <p className="text-center text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Container:</span>{" "}
          {previewDims.w}×{previewDims.h} ({containerRatioLabel})
          <span className="px-1.5 text-border">·</span>
          <span className="font-medium text-foreground">Image:</span>{" "}
          {imageDims.w > 0 && imageDims.h > 0
            ? `${imageDims.w}×${imageDims.h} (${imageRatioLabel})`
            : "loading…"}
          <span className="px-1.5 text-border">·</span>
          <span className="font-medium text-foreground">Fit:</span>{" "}
          <code className="font-mono text-primary">{fit}</code>
        </p>
      </section>

      {/* Side-by-side comparison */}
      <section className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Maximize2 className="size-3.5 text-primary" />
          <span>Side-by-side comparison</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {OBJECT_FITS.map((meta) => {
            const isActive = fit === meta.key;
            return (
              <button
                key={meta.key}
                type="button"
                onClick={() => setFit(meta.key)}
                aria-pressed={isActive}
                className={cn(
                  "group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors",
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <div
                  className="image-container relative overflow-hidden rounded border border-border"
                  style={{
                    ...CHECKERBOARD_STYLE,
                    width: thumbDims.w,
                    height: thumbDims.h,
                  }}
                  role="img"
                  aria-label={`${meta.label} preview`}
                >
                  {imageUrl ? (
                    <PreviewImage
                      src={imageUrl}
                      fit={meta.key}
                      positionCss={positionCss}
                      alt={`${meta.label} thumbnail`}
                    />
                  ) : null}
                </div>
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Object-position 3×3 grid + custom inputs */}
      <section className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Move className="size-3.5 text-primary" />
          <span>object-position</span>
          <Badge
            variant="outline"
            className="ml-auto border-border bg-muted/50 font-mono text-[10px] text-muted-foreground"
          >
            {positionCss}
          </Badge>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* 3×3 grid */}
          <div
            className="grid grid-cols-3 gap-1.5"
            role="radiogroup"
            aria-label="Object-position preset"
            style={{ width: "min(100%, 132px)" }}
          >
            {POSITION_PRESETS.map((meta) => (
              <PositionGridButton
                key={meta.key}
                meta={meta}
                active={position === meta.key}
                onSelect={selectPositionPreset}
              />
            ))}
          </div>
          {/* Custom X / Y inputs */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className={position === "custom" ? "text-primary" : ""}>
                Custom
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* X */}
              <div className="space-y-1">
                <Label
                  htmlFor="roycss-of-pos-x"
                  className="text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  X (horizontal)
                </Label>
                <div className="flex gap-1">
                  <Input
                    id="roycss-of-pos-x"
                    type="text"
                    inputMode="numeric"
                    value={customX}
                    onChange={handleCustomXChange}
                    onFocus={() => setPosition("custom")}
                    className="h-8 font-mono text-xs"
                    aria-label="Custom object-position X"
                  />
                  <Select
                    value={unitX}
                    onValueChange={handleUnitXChange}
                  >
                    <SelectTrigger className="h-8 w-[68px] px-2 font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%" className="font-mono text-xs">
                        %
                      </SelectItem>
                      <SelectItem value="px" className="font-mono text-xs">
                        px
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Y */}
              <div className="space-y-1">
                <Label
                  htmlFor="roycss-of-pos-y"
                  className="text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  Y (vertical)
                </Label>
                <div className="flex gap-1">
                  <Input
                    id="roycss-of-pos-y"
                    type="text"
                    inputMode="numeric"
                    value={customY}
                    onChange={handleCustomYChange}
                    onFocus={() => setPosition("custom")}
                    className="h-8 font-mono text-xs"
                    aria-label="Custom object-position Y"
                  />
                  <Select
                    value={unitY}
                    onValueChange={handleUnitYChange}
                  >
                    <SelectTrigger className="h-8 w-[68px] px-2 font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%" className="font-mono text-xs">
                        %
                      </SelectItem>
                      <SelectItem value="px" className="font-mono text-xs">
                        px
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Tip: pick a 3×3 preset OR type custom values. The first value is
              horizontal, the second is vertical.
            </p>
          </div>
        </div>
      </section>

      {/* Generated CSS */}
      <section className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            <span>Generated CSS</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 gap-1.5 px-2 text-[11px]"
            aria-label="Copy generated CSS"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">
                  Copied
                </span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
        <pre
          className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground"
        >
          <code>{cssString}</code>
        </pre>
      </section>
    </div>
  );
}

export default ObjectFitVisualizer;
