"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
} from "react";
import {
  Copy,
  Check,
  Sparkles,
  MoveHorizontal,
  MoveVertical,
  GalleryHorizontalEnd,
  ListOrdered,
  GalleryThumbnails,
  RectangleVertical,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
 * ScrollSnapBuilder — interactive builder for CSS `scroll-snap-type` and
 * `scroll-snap-align`.
 *
 * Controls:
 *  - snap type (none / mandatory / proximity)
 *  - axis (x / y / both)
 *  - direction toggle (horizontal / vertical) — drives the live preview's
 *    scroll orientation, independent from the axis so users can experiment.
 *  - gap (0–32 px) and card size (80–280 px)
 *  - per-card `scroll-snap-align` (start / center / end / none) — six cards.
 *  - 4 presets: Horizontal gallery, Vertical list, Carousel, Full-page sections.
 *
 * The live preview is a REAL scrollable container: drag the cards / use the
 * scrollbar / scroll with the wheel and you'll see the snap behaviour the
 * generated CSS produces. The generated CSS for the container + child rule is
 * shown below the preview with a Copy button.
 *
 * Constraints: TS strict, zero `any`, zero `console.log`. Semantic theme
 * tokens for chrome; the 6 demo cards use Tailwind accent utilities
 * (emerald/amber/rose/violet/teal/orange) — no indigo, no blue.
 */

// ─── Types ────────────────────────────────────────────────────────────────

type SnapType = "none" | "mandatory" | "proximity";
type SnapAxis = "x" | "y" | "both";
type SnapAlign = "start" | "center" | "end" | "none";
type Direction = "horizontal" | "vertical";

type PresetKey =
  | "horizontalGallery"
  | "verticalList"
  | "carousel"
  | "fullPage";

interface PresetMeta {
  key: PresetKey;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

interface PresetConfig {
  type: SnapType;
  axis: SnapAxis;
  direction: Direction;
  gap: number;
  cardSize: number;
  aligns: SnapAlign[];
}

// ─── Constants ────────────────────────────────────────────────────────────

const CARD_COUNT = 6;

const CARD_COLORS: string[] = [
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-orange-500",
];

const PRESET_META: PresetMeta[] = [
  {
    key: "horizontalGallery",
    label: "Horizontal gallery",
    Icon: GalleryHorizontalEnd,
  },
  { key: "verticalList", label: "Vertical list", Icon: ListOrdered },
  { key: "carousel", label: "Carousel", Icon: GalleryThumbnails },
  { key: "fullPage", label: "Full-page sections", Icon: RectangleVertical },
];

const PRESETS: Record<PresetKey, PresetConfig> = {
  horizontalGallery: {
    type: "mandatory",
    axis: "x",
    direction: "horizontal",
    gap: 12,
    cardSize: 200,
    aligns: ["start", "start", "start", "start", "start", "start"],
  },
  verticalList: {
    type: "mandatory",
    axis: "y",
    direction: "vertical",
    gap: 12,
    cardSize: 120,
    aligns: ["start", "start", "start", "start", "start", "start"],
  },
  carousel: {
    type: "mandatory",
    axis: "x",
    direction: "horizontal",
    gap: 16,
    cardSize: 240,
    aligns: ["center", "center", "center", "center", "center", "center"],
  },
  fullPage: {
    type: "mandatory",
    axis: "y",
    direction: "vertical",
    gap: 0,
    cardSize: 280,
    aligns: ["start", "start", "start", "start", "start", "start"],
  },
};

const DEFAULT_CONFIG: PresetConfig = PRESETS.horizontalGallery;

const SNAP_TYPE_OPTIONS: SnapType[] = ["none", "mandatory", "proximity"];
const SNAP_AXIS_OPTIONS: SnapAxis[] = ["x", "y", "both"];
const SNAP_ALIGN_OPTIONS: SnapAlign[] = ["start", "center", "end", "none"];

const COPY_CONFIRM_MS = 1500;

const CONTAINER_HEIGHT_HORIZONTAL = 180; // px
const CONTAINER_HEIGHT_VERTICAL = 320; // px

// ─── Helpers ──────────────────────────────────────────────────────────────

const buildContainerCss = (axis: SnapAxis, type: SnapType): string => {
  if (type === "none") return "scroll-snap-type: none;";
  return `scroll-snap-type: ${axis} ${type};`;
};

const buildChildCss = (align: SnapAlign): string =>
  align === "none"
    ? "/* scroll-snap-align: none; */"
    : `scroll-snap-align: ${align};`;

const buildContainerStyle = (
  axis: SnapAxis,
  type: SnapType,
  direction: Direction,
  gap: number,
): CSSProperties => {
  const snap = type === "none" ? "none" : `${axis} ${type}`;
  if (direction === "horizontal") {
    return {
      scrollSnapType: snap,
      overflowX: "auto",
      overflowY: "hidden",
      display: "flex",
      flexDirection: "row",
      gap: `${gap}px`,
    };
  }
  return {
    scrollSnapType: snap,
    overflowX: "hidden",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: `${gap}px`,
  };
};

const buildChildStyle = (
  align: SnapAlign,
  cardSize: number,
  direction: Direction,
): CSSProperties => {
  const base: CSSProperties = {
    scrollSnapAlign: align === "none" ? "none" : align,
    flexShrink: 0,
  };
  if (direction === "horizontal") {
    return { ...base, width: `${cardSize}px`, height: "100%" };
  }
  return { ...base, height: `${cardSize}px`, width: "100%" };
};

// ─── Component ────────────────────────────────────────────────────────────

export function ScrollSnapBuilder() {
  const [snapType, setSnapType] = useState<SnapType>(DEFAULT_CONFIG.type);
  const [axis, setAxis] = useState<SnapAxis>(DEFAULT_CONFIG.axis);
  const [direction, setDirection] = useState<Direction>(DEFAULT_CONFIG.direction);
  const [gap, setGap] = useState<number>(DEFAULT_CONFIG.gap);
  const [cardSize, setCardSize] = useState<number>(DEFAULT_CONFIG.cardSize);
  const [aligns, setAligns] = useState<SnapAlign[]>(DEFAULT_CONFIG.aligns);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(
    "horizontalGallery",
  );
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

  const applyPreset = useCallback((key: PresetKey) => {
    const cfg = PRESETS[key];
    setSnapType(cfg.type);
    setAxis(cfg.axis);
    setDirection(cfg.direction);
    setGap(cfg.gap);
    setCardSize(cfg.cardSize);
    setAligns(cfg.aligns);
    setActivePreset(key);
  }, []);

  // When any control changes manually, clear the "active preset" highlight
  // (each individual update wrapper below sets `setActivePreset(null)`).
  const updateSnapType = useCallback(
    (v: SnapType) => {
      setSnapType(v);
      setActivePreset(null);
    },
    [],
  );
  const updateAxis = useCallback((v: SnapAxis) => {
    setAxis(v);
    setActivePreset(null);
  }, []);
  const updateDirection = useCallback((v: Direction) => {
    setDirection(v);
    setActivePreset(null);
  }, []);
  const updateGap = useCallback((v: number) => {
    setGap(v);
    setActivePreset(null);
  }, []);
  const updateCardSize = useCallback((v: number) => {
    setCardSize(v);
    setActivePreset(null);
  }, []);
  const updateAlign = useCallback((index: number, v: SnapAlign) => {
    setAligns((prev) => {
      const next = prev.slice();
      next[index] = v;
      return next;
    });
    setActivePreset(null);
  }, []);

  const containerCss = useMemo(
    () => buildContainerCss(axis, snapType),
    [axis, snapType],
  );

  const containerStyle = useMemo(
    () => buildContainerStyle(axis, snapType, direction, gap),
    [axis, snapType, direction, gap],
  );

  const fullCss = useMemo(() => {
    const childLines = aligns
      .map((a, i) => `  .card-${i + 1} { ${buildChildCss(a).replace(/^\/\* | \*\/$/g, "").trim()} }`)
      .join("\n");
    return `.snap-container {\n  ${containerCss}\n  overflow-${direction === "horizontal" ? "x" : "y"}: auto;\n}\n\n${childLines}`;
  }, [aligns, containerCss, direction]);

  const previewHeight = direction === "horizontal"
    ? CONTAINER_HEIGHT_HORIZONTAL
    : CONTAINER_HEIGHT_VERTICAL;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MoveHorizontal className="size-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            CSS Scroll Snap Builder
          </h3>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {CARD_COUNT} cards · snap: {snapType} {snapType === "none" ? "" : axis}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Configure <code className="font-mono">scroll-snap-type</code> on the
        container and <code className="font-mono">scroll-snap-align</code> per
        child, then scroll the live preview to feel the snap. Six cards, four
        presets, full CSS export.
      </p>

      {/* Presets */}
      <div>
        <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Presets
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESET_META.map(({ key, label, Icon }) => {
            const isActive = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-md border p-2.5 text-left transition-colors",
                  isActive
                    ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="text-xs font-medium text-foreground">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Snap type */}
        <div className="rounded-md border border-border bg-card p-3">
          <Label className="text-xs font-medium text-foreground">
            scroll-snap-type
          </Label>
          <Select
            value={snapType}
            onValueChange={(v) => updateSnapType(v as SnapType)}
          >
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SNAP_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Axis */}
        <div className="rounded-md border border-border bg-card p-3">
          <Label className="text-xs font-medium text-foreground">axis</Label>
          <Select
            value={axis}
            onValueChange={(v) => updateAxis(v as SnapAxis)}
          >
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SNAP_AXIS_OPTIONS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Direction toggle */}
        <div className="rounded-md border border-border bg-card p-3">
          <Label className="text-xs font-medium text-foreground">
            preview direction
          </Label>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => updateDirection("horizontal")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                direction === "horizontal"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/40",
              )}
            >
              <MoveHorizontal className="size-3.5" /> Horizontal
            </button>
            <button
              type="button"
              onClick={() => updateDirection("vertical")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                direction === "vertical"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/40",
              )}
            >
              <MoveVertical className="size-3.5" /> Vertical
            </button>
          </div>
        </div>

        {/* Gap */}
        <div className="rounded-md border border-border bg-card p-3">
          <div className="flex items-baseline justify-between">
            <Label className="text-xs font-medium text-foreground">gap</Label>
            <span className="font-mono text-xs text-muted-foreground">
              {gap}px
            </span>
          </div>
          <Slider
            className="mt-2"
            value={[gap]}
            onValueChange={(v) => updateGap(v[0] ?? 0)}
            min={0}
            max={32}
            step={2}
            aria-label="gap in pixels"
          />
        </div>

        {/* Card size */}
        <div className="rounded-md border border-border bg-card p-3 sm:col-span-2">
          <div className="flex items-baseline justify-between">
            <Label className="text-xs font-medium text-foreground">
              card {direction === "horizontal" ? "width" : "height"}
            </Label>
            <span className="font-mono text-xs text-muted-foreground">
              {cardSize}px
            </span>
          </div>
          <Slider
            className="mt-2"
            value={[cardSize]}
            onValueChange={(v) => updateCardSize(v[0] ?? 0)}
            min={80}
            max={280}
            step={10}
            aria-label="card size in pixels"
          />
        </div>
      </div>

      {/* Per-card align */}
      <div className="rounded-md border border-border bg-card p-3">
        <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Per-card scroll-snap-align
        </Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {aligns.map((align, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5"
            >
              <span
                className={cn(
                  "size-3 shrink-0 rounded-sm",
                  CARD_COLORS[i % CARD_COLORS.length],
                )}
              />
              <span className="text-[11px] font-medium text-muted-foreground">
                #{i + 1}
              </span>
              <Select
                value={align}
                onValueChange={(v) => updateAlign(i, v as SnapAlign)}
              >
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SNAP_ALIGN_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live preview · scroll me
          </Label>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => applyPreset(activePreset ?? "horizontalGallery")}
          >
            <RefreshCw className="size-3.5" />
            Reset scroll
          </Button>
        </div>
        <div
          className="w-full overflow-hidden rounded-md border border-border bg-muted/40 p-2"
          style={{ height: previewHeight + 16 }}
        >
          <div
            className="h-full w-full"
            style={{ ...containerStyle, height: previewHeight }}
          >
            {Array.from({ length: CARD_COUNT }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-center rounded-md text-sm font-semibold text-white shadow-sm",
                  CARD_COLORS[i % CARD_COLORS.length],
                )}
                style={buildChildStyle(aligns[i] ?? "start", cardSize, direction)}
              >
                #{i + 1}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="size-3" />
          Tip: use the scrollbar, arrow keys, or shift+wheel to scroll.
        </p>
      </div>

      {/* Generated CSS */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Generated CSS
          </Label>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => handleCopy(fullCss, "css")}
          >
            {copiedKey === "css" ? (
              <>
                <Check className="size-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" /> Copy CSS
              </>
            )}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-md bg-muted/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground">
          <code>{fullCss}</code>
        </pre>
      </div>
    </div>
  );
}

export default ScrollSnapBuilder;
