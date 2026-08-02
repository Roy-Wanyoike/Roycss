"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Copy,
  Check,
  Link2,
  Unlink,
  RefreshCw,
  Sparkles,
  Move,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * BoxModelVisualizer — interactive CSS box model diagram + generator.
 *
 * Features:
 *  - Nested visualization of margin → border → padding → content layers,
 *    with per-side value tags and an auto-scaling transform so large
 *    values still fit the panel.
 *  - Per-side numeric inputs for margin / border / padding (with a "link
 *    all sides" toggle), plus border-style + border-color, and width /
 *    height (with optional "auto") for content.
 *  - box-sizing toggle (content-box vs border-box). The diagram and the
 *    computed-dimensions panel both reflect how border + padding are
 *    added OUTSIDE the content (content-box) or INSIDE the fixed size
 *    (border-box) — in border-box mode the content area shrinks.
 *  - Computed dimensions for content / padding / border / margin boxes.
 *  - Generated CSS (smart shorthand: 1 / 2 / 3 / 4-value forms) with
 *    Copy button + Check confirmation.
 *  - Live preview: a real <div> rendered with the exact inline styles.
 *  - Presets: Zero reset, Symmetric 16, Card, Hero.
 *
 * Colors (NOT indigo/blue — per RoyCSS theme):
 *   margin = amber, border = primary (teal), padding = cyan,
 *   content = primary/20.
 */

type BoxSizing = "content-box" | "border-box";
type BorderSide = "t" | "r" | "b" | "l";

interface Sides {
  t: number;
  r: number;
  b: number;
  l: number;
}

interface BorderState extends Sides {
  style: string;
  color: string;
}

interface ContentState {
  w: number;
  h: number;
  wAuto: boolean;
  hAuto: boolean;
}

interface Dims {
  w: number;
  h: number;
}

interface BoxDims {
  content: Dims;
  padding: Dims;
  border: Dims;
  margin: Dims;
}

const DEFAULT_MARGIN: Sides = { t: 16, r: 16, b: 16, l: 16 };
const DEFAULT_BORDER: BorderState = {
  t: 2,
  r: 2,
  b: 2,
  l: 2,
  style: "solid",
  color: "#0d9488",
};
const DEFAULT_PADDING: Sides = { t: 12, r: 12, b: 12, l: 12 };
const DEFAULT_CONTENT: ContentState = {
  w: 200,
  h: 100,
  wAuto: false,
  hAuto: false,
};
const DEFAULT_BOX_SIZING: BoxSizing = "content-box";

const BORDER_STYLES = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "groove",
  "ridge",
  "none",
] as const;

const SIDE_DEFS: { key: BorderSide; label: string }[] = [
  { key: "t", label: "Top" },
  { key: "r", label: "Right" },
  { key: "b", label: "Bottom" },
  { key: "l", label: "Left" },
];

/** When content width/height is "auto", the diagram uses these fallbacks. */
const AUTO_DISPLAY_W = 200;
const AUTO_DISPLAY_H = 100;

/** Padding inside the diagram panel reserved for layer tags (px). */
const DIAGRAM_PADDING = 28;

const AMBER_BG = "rgba(245, 158, 11, 0.12)";
const CYAN_BG = "rgba(6, 182, 212, 0.14)";
const CONTENT_BG = "rgba(13, 148, 136, 0.22)";

function clampNonNegInt(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(9999, Math.round(n)));
}

function parseSideInput(value: string): number {
  return clampNonNegInt(parseInt(value, 10));
}

/** 4-side CSS shorthand with smart collapsing (1/2/3/4 value forms). */
function sidesToShorthand(prefix: string, s: Sides): string {
  const { t, r, b, l } = s;
  if (t === r && r === b && b === l) return `${prefix}: ${t}px;`;
  if (t === b && r === l) return `${prefix}: ${t}px ${r}px;`;
  if (r === l) return `${prefix}: ${t}px ${r}px ${b}px;`;
  return `${prefix}: ${t}px ${r}px ${b}px ${l}px;`;
}

/** 4-side width shorthand value (no property prefix), with collapsing. */
function sidesToWidthShorthand(s: Sides): string {
  const { t, r, b, l } = s;
  if (t === r && r === b && b === l) return `${t}px`;
  if (t === b && r === l) return `${t}px ${r}px`;
  if (r === l) return `${t}px ${r}px ${b}px`;
  return `${t}px ${r}px ${b}px ${l}px`;
}

interface Preset {
  name: string;
  description: string;
  margin: Sides;
  border: BorderState;
  padding: Sides;
  content: ContentState;
  boxSizing: BoxSizing;
}

const PRESETS: Preset[] = [
  {
    name: "Zero reset",
    description: "All zero, no border",
    margin: { t: 0, r: 0, b: 0, l: 0 },
    border: { t: 0, r: 0, b: 0, l: 0, style: "solid", color: "#0d9488" },
    padding: { t: 0, r: 0, b: 0, l: 0 },
    content: { w: 200, h: 100, wAuto: false, hAuto: false },
    boxSizing: "content-box",
  },
  {
    name: "Symmetric 16",
    description: "16px margin & padding, 1px border",
    margin: { t: 16, r: 16, b: 16, l: 16 },
    border: { t: 1, r: 1, b: 1, l: 1, style: "solid", color: "#0d9488" },
    padding: { t: 16, r: 16, b: 16, l: 16 },
    content: { w: 200, h: 100, wAuto: false, hAuto: false },
    boxSizing: "content-box",
  },
  {
    name: "Card",
    description: "padding 24, 1px border, margin 16, border-box",
    margin: { t: 16, r: 16, b: 16, l: 16 },
    border: { t: 1, r: 1, b: 1, l: 1, style: "solid", color: "#0d9488" },
    padding: { t: 24, r: 24, b: 24, l: 24 },
    content: { w: 240, h: 120, wAuto: false, hAuto: false },
    boxSizing: "border-box",
  },
  {
    name: "Hero",
    description: "padding 80/40, margin 0, border-box",
    margin: { t: 0, r: 0, b: 0, l: 0 },
    border: { t: 0, r: 0, b: 0, l: 0, style: "solid", color: "#0d9488" },
    padding: { t: 80, r: 40, b: 80, l: 40 },
    content: { w: 320, h: 160, wAuto: false, hAuto: false },
    boxSizing: "border-box",
  },
];

/* ─────────────────────────────────────────────────────────────────────── */
/* Sub-components                                                          */
/* ─────────────────────────────────────────────────────────────────────── */

const SIDE_TAG_CLS: Record<BorderSide, string> = {
  t: "left-1/2 top-0 -translate-x-1/2 -translate-y-full",
  r: "right-0 top-1/2 translate-x-full -translate-y-1/2",
  b: "left-1/2 bottom-0 -translate-x-1/2 translate-y-full",
  l: "left-0 top-1/2 -translate-x-full -translate-y-1/2",
};

/** A small absolutely-positioned tag for one side of a diagram layer. */
function LayerTag({
  side,
  children,
  className,
}: {
  side: BorderSide;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-20 rounded px-1 py-px text-[9px] font-mono leading-tight whitespace-nowrap shadow-sm",
        SIDE_TAG_CLS[side],
        className,
      )}
    >
      {children}
    </span>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <span className={cn("size-2 rounded-sm", className)} />
      {label}
    </span>
  );
}

/** A 2×2 / 4×1 grid of T/R/B/L number inputs with a "link sides" toggle. */
function SideControlsSection({
  title,
  accentClass,
  accentDot,
  idPrefix,
  sides,
  linked,
  onLinkedChange,
  onUpdate,
  extra,
}: {
  title: string;
  accentClass: string;
  accentDot: string;
  idPrefix: string;
  sides: Sides;
  linked: boolean;
  onLinkedChange: (v: boolean) => void;
  onUpdate: (side: BorderSide, value: number) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider",
            accentClass,
          )}
        >
          <span className={cn("size-2 rounded-sm", accentDot)} />
          {title}
        </span>
        <label
          className="flex cursor-pointer items-center gap-1"
          title={linked ? "Unlink sides" : "Link all sides together"}
        >
          <Checkbox
            checked={linked}
            onCheckedChange={(c) => onLinkedChange(c === true)}
            aria-label={`Link all ${title.toLowerCase()} sides`}
          />
          {linked ? (
            <Link2 className="size-3 text-primary" />
          ) : (
            <Unlink className="size-3 text-muted-foreground" />
          )}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SIDE_DEFS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label
              htmlFor={`${idPrefix}-${key}`}
              className="text-[10px] text-muted-foreground"
            >
              {label}
            </Label>
            <div className="relative">
              <Input
                id={`${idPrefix}-${key}`}
                type="number"
                min={0}
                step={1}
                value={sides[key]}
                onChange={(e) => onUpdate(key, parseSideInput(e.target.value))}
                className="h-7 pr-7 text-right font-mono text-xs"
              />
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                px
              </span>
            </div>
          </div>
        ))}
      </div>
      {extra ? <div className="mt-2">{extra}</div> : null}
    </div>
  );
}

function DimRow({
  label,
  dims,
  highlight,
}: {
  label: string;
  dims: Dims;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-1.5 text-xs",
        highlight ? "bg-primary/10" : "bg-muted/30",
      )}
    >
      <span
        className={cn(
          "font-medium",
          highlight ? "text-primary" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span className="font-mono tabular-nums text-foreground">
        {dims.w} × {dims.h}
        <span className="ml-1 text-muted-foreground">px</span>
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Main component                                                          */
/* ─────────────────────────────────────────────────────────────────────── */

export function BoxModelVisualizer() {
  const [margin, setMargin] = useState<Sides>(DEFAULT_MARGIN);
  const [border, setBorder] = useState<BorderState>(DEFAULT_BORDER);
  const [padding, setPadding] = useState<Sides>(DEFAULT_PADDING);
  const [content, setContent] = useState<ContentState>(DEFAULT_CONTENT);
  const [boxSizing, setBoxSizing] = useState<BoxSizing>(DEFAULT_BOX_SIZING);

  const [linkMargin, setLinkMargin] = useState(false);
  const [linkBorder, setLinkBorder] = useState(false);
  const [linkPadding, setLinkPadding] = useState(false);

  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(480);

  /* Measure container width for diagram scaling. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Display content size — "auto" falls back to fixed values for the diagram. */
  const displayW = content.wAuto ? AUTO_DISPLAY_W : content.w;
  const displayH = content.hAuto ? AUTO_DISPLAY_H : content.h;

  /* Natural diagram size + scale to fit. */
  const { naturalW, naturalH, scale } = useMemo(() => {
    const borderBoxW =
      boxSizing === "border-box"
        ? displayW
        : displayW + padding.l + padding.r + border.l + border.r;
    const borderBoxH =
      boxSizing === "border-box"
        ? displayH
        : displayH + padding.t + padding.b + border.t + border.b;
    const w = borderBoxW + margin.l + margin.r;
    const h = borderBoxH + margin.t + margin.b;
    const avail = Math.max(160, containerWidth - DIAGRAM_PADDING * 2);
    const s = Math.min(1, avail / Math.max(1, w));
    return { naturalW: w, naturalH: h, scale: s };
  }, [
    boxSizing,
    displayW,
    displayH,
    padding.l,
    padding.r,
    padding.t,
    padding.b,
    border.l,
    border.r,
    border.t,
    border.b,
    margin.l,
    margin.r,
    margin.t,
    margin.b,
    containerWidth,
  ]);

  /* Computed dimensions for each box (content / padding / border / margin). */
  const dims: BoxDims = useMemo(() => {
    if (boxSizing === "border-box") {
      const bbW = displayW;
      const bbH = displayH;
      const pbW = bbW - border.l - border.r;
      const pbH = bbH - border.t - border.b;
      const cbW = pbW - padding.l - padding.r;
      const cbH = pbH - padding.t - padding.b;
      const mbW = bbW + margin.l + margin.r;
      const mbH = bbH + margin.t + margin.b;
      return {
        content: { w: cbW, h: cbH },
        padding: { w: pbW, h: pbH },
        border: { w: bbW, h: bbH },
        margin: { w: mbW, h: mbH },
      };
    }
    const contentW = displayW;
    const contentH = displayH;
    const paddingW = contentW + padding.l + padding.r;
    const paddingH = contentH + padding.t + padding.b;
    const borderW = paddingW + border.l + border.r;
    const borderH = paddingH + border.t + border.b;
    const marginW = borderW + margin.l + margin.r;
    const marginH = borderH + margin.t + margin.b;
    return {
      content: { w: contentW, h: contentH },
      padding: { w: paddingW, h: paddingH },
      border: { w: borderW, h: borderH },
      margin: { w: marginW, h: marginH },
    };
  }, [
    boxSizing,
    displayW,
    displayH,
    padding.l,
    padding.r,
    padding.t,
    padding.b,
    border.l,
    border.r,
    border.t,
    border.b,
    margin.l,
    margin.r,
    margin.t,
    margin.b,
  ]);

  /* Content area shown inside the diagram (differs in border-box mode). */
  const contentAreaW =
    boxSizing === "border-box"
      ? displayW - border.l - border.r - padding.l - padding.r
      : displayW;
  const contentAreaH =
    boxSizing === "border-box"
      ? displayH - border.t - border.b - padding.t - padding.b
      : displayH;

  /* Generated CSS — smart shorthand, border collapses when uniform. */
  const cssString = useMemo(() => {
    const widthLine = content.wAuto ? "  width: auto;" : `  width: ${content.w}px;`;
    const heightLine = content.hAuto ? "  height: auto;" : `  height: ${content.h}px;`;

    const borderUniform =
      border.t === border.r && border.r === border.b && border.b === border.l;
    const borderLines = borderUniform
      ? [`  border: ${border.t}px ${border.style} ${border.color};`]
      : [
          `  border-width: ${sidesToWidthShorthand(border)};`,
          `  border-style: ${border.style};`,
          `  border-color: ${border.color};`,
        ];

    const lines: string[] = [
      ".box {",
      `  box-sizing: ${boxSizing};`,
      widthLine,
      heightLine,
      `  ${sidesToShorthand("margin", margin)}`,
      ...borderLines,
      `  ${sidesToShorthand("padding", padding)}`,
      "}",
    ];
    return lines.join("\n");
  }, [boxSizing, content.w, content.h, content.wAuto, content.hAuto, margin, border, padding]);

  /* Inline style for the live-preview box — must match the CSS exactly. */
  const previewStyle = useMemo<React.CSSProperties>(
    () => ({
      boxSizing,
      width: content.wAuto ? "auto" : `${content.w}px`,
      height: content.hAuto ? "auto" : `${content.h}px`,
      marginTop: `${margin.t}px`,
      marginRight: `${margin.r}px`,
      marginBottom: `${margin.b}px`,
      marginLeft: `${margin.l}px`,
      borderTopWidth: `${border.t}px`,
      borderRightWidth: `${border.r}px`,
      borderBottomWidth: `${border.b}px`,
      borderLeftWidth: `${border.l}px`,
      borderStyle: border.style,
      borderColor: border.color,
      paddingTop: `${padding.t}px`,
      paddingRight: `${padding.r}px`,
      paddingBottom: `${padding.b}px`,
      paddingLeft: `${padding.l}px`,
      background: "rgba(13, 148, 136, 0.08)",
    }),
    [boxSizing, content.w, content.h, content.wAuto, content.hAuto, margin, border, padding],
  );

  /* ── Handlers ──────────────────────────────────────────────────────── */

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssString);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [cssString]);

  const handleReset = useCallback(() => {
    setMargin(DEFAULT_MARGIN);
    setBorder(DEFAULT_BORDER);
    setPadding(DEFAULT_PADDING);
    setContent(DEFAULT_CONTENT);
    setBoxSizing(DEFAULT_BOX_SIZING);
    setLinkMargin(false);
    setLinkBorder(false);
    setLinkPadding(false);
  }, []);

  const applyPreset = useCallback((p: Preset) => {
    setMargin(p.margin);
    setBorder(p.border);
    setPadding(p.padding);
    setContent(p.content);
    setBoxSizing(p.boxSizing);
  }, []);

  const updateSide = useCallback(
    (
      which: "margin" | "border" | "padding",
      side: BorderSide,
      value: number,
    ) => {
      const v = clampNonNegInt(value);
      if (which === "margin") {
        setMargin((prev) =>
          linkMargin ? { t: v, r: v, b: v, l: v } : { ...prev, [side]: v },
        );
      } else if (which === "border") {
        setBorder((prev) =>
          linkBorder
            ? { ...prev, t: v, r: v, b: v, l: v }
            : { ...prev, [side]: v },
        );
      } else {
        setPadding((prev) =>
          linkPadding ? { t: v, r: v, b: v, l: v } : { ...prev, [side]: v },
        );
      }
    },
    [linkMargin, linkBorder, linkPadding],
  );

  /* ── Aria label for the diagram ────────────────────────────────────── */
  const diagramAria = useMemo(
    () =>
      `Box model diagram. Box sizing ${boxSizing}. ` +
      `Margin: top ${margin.t}, right ${margin.r}, bottom ${margin.b}, left ${margin.l} pixels. ` +
      `Border: top ${border.t}, right ${border.r}, bottom ${border.b}, left ${border.l} pixels, ` +
      `style ${border.style}, color ${border.color}. ` +
      `Padding: top ${padding.t}, right ${padding.r}, bottom ${padding.b}, left ${padding.l} pixels. ` +
      `Content: ${content.wAuto ? "auto" : `${content.w}px`} wide by ${content.hAuto ? "auto" : `${content.h}px`} high. ` +
      `Margin box ${dims.margin.w} by ${dims.margin.h} pixels.`,
    [
      boxSizing,
      margin,
      border,
      padding,
      content.w,
      content.h,
      content.wAuto,
      content.hAuto,
      dims.margin.w,
      dims.margin.h,
    ],
  );

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Box className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">Box Model Visualizer</h3>
            <p className="text-xs text-muted-foreground">
              Inspect margin, border, padding &amp; content with live CSS
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          title="Reset to defaults"
        >
          <RefreshCw className="size-3.5" />
          Reset
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3.5" />
          Presets
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => applyPreset(p)}
            title={p.description}
            className="cursor-pointer rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium text-foreground/80 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Main 2-col grid: diagram + controls */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* LEFT: box-sizing + diagram + live preview */}
        <div className="space-y-4">
          {/* box-sizing toggle */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <Move className="size-4 text-primary" />
              <div>
                <Label
                  htmlFor="bm-box-sizing"
                  className="cursor-pointer text-xs font-semibold"
                >
                  box-sizing
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  {boxSizing === "content-box"
                    ? "border+padding added outside content"
                    : "border+padding inside the fixed size"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-mono text-[10px]",
                  boxSizing === "content-box"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                content-box
              </span>
              <Switch
                id="bm-box-sizing"
                checked={boxSizing === "border-box"}
                onCheckedChange={(c) =>
                  setBoxSizing(c ? "border-box" : "content-box")
                }
                aria-label="Toggle box-sizing between content-box and border-box"
              />
              <span
                className={cn(
                  "font-mono text-[10px]",
                  boxSizing === "border-box"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                border-box
              </span>
            </div>
          </div>

          {/* Diagram */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Diagram
              </span>
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                scale {Math.round(scale * 100)}%
              </span>
            </div>
            <div
              ref={containerRef}
              className="w-full overflow-hidden rounded-lg bg-muted/20"
              style={{ padding: DIAGRAM_PADDING, minHeight: 220 }}
              role="img"
              aria-label={diagramAria}
            >
              <div
                className="relative mx-auto"
                style={{
                  width: naturalW * scale,
                  height: naturalH * scale,
                }}
              >
                <div
                  className="absolute left-0 top-0"
                  style={{
                    width: naturalW,
                    height: naturalH,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  {/* ───── MARGIN layer (outermost) ───── */}
                  <div
                    className="relative"
                    style={{
                      display: "inline-block",
                      paddingTop: margin.t,
                      paddingRight: margin.r,
                      paddingBottom: margin.b,
                      paddingLeft: margin.l,
                      background: AMBER_BG,
                    }}
                  >
                    <LayerTag
                      side="t"
                      className="bg-amber-500/25 text-amber-800 dark:text-amber-200"
                    >
                      m·{margin.t}
                    </LayerTag>
                    <LayerTag
                      side="r"
                      className="bg-amber-500/25 text-amber-800 dark:text-amber-200"
                    >
                      {margin.r}
                    </LayerTag>
                    <LayerTag
                      side="b"
                      className="bg-amber-500/25 text-amber-800 dark:text-amber-200"
                    >
                      {margin.b}
                    </LayerTag>
                    <LayerTag
                      side="l"
                      className="bg-amber-500/25 text-amber-800 dark:text-amber-200"
                    >
                      {margin.l}
                    </LayerTag>

                    {/* ───── BORDER layer ───── */}
                    <div
                      className="relative"
                      style={{
                        display: "block",
                        paddingTop: border.t,
                        paddingRight: border.r,
                        paddingBottom: border.b,
                        paddingLeft: border.l,
                        background: border.color,
                        boxSizing: "border-box",
                        width:
                          boxSizing === "border-box" ? `${displayW}px` : "auto",
                        height:
                          boxSizing === "border-box" ? `${displayH}px` : "auto",
                      }}
                    >
                      <LayerTag
                        side="t"
                        className="bg-primary/30 text-primary-foreground"
                      >
                        b·{border.t}
                      </LayerTag>
                      <LayerTag
                        side="r"
                        className="bg-primary/30 text-primary-foreground"
                      >
                        {border.r}
                      </LayerTag>
                      <LayerTag
                        side="b"
                        className="bg-primary/30 text-primary-foreground"
                      >
                        {border.b}
                      </LayerTag>
                      <LayerTag
                        side="l"
                        className="bg-primary/30 text-primary-foreground"
                      >
                        {border.l}
                      </LayerTag>

                      {/* ───── PADDING layer ───── */}
                      <div
                        className="relative"
                        style={{
                          display: "block",
                          paddingTop: padding.t,
                          paddingRight: padding.r,
                          paddingBottom: padding.b,
                          paddingLeft: padding.l,
                          background: CYAN_BG,
                        }}
                      >
                        <LayerTag
                          side="t"
                          className="bg-cyan-500/30 text-cyan-900 dark:text-cyan-100"
                        >
                          p·{padding.t}
                        </LayerTag>
                        <LayerTag
                          side="r"
                          className="bg-cyan-500/30 text-cyan-900 dark:text-cyan-100"
                        >
                          {padding.r}
                        </LayerTag>
                        <LayerTag
                          side="b"
                          className="bg-cyan-500/30 text-cyan-900 dark:text-cyan-100"
                        >
                          {padding.b}
                        </LayerTag>
                        <LayerTag
                          side="l"
                          className="bg-cyan-500/30 text-cyan-900 dark:text-cyan-100"
                        >
                          {padding.l}
                        </LayerTag>

                        {/* ───── CONTENT ───── */}
                        <div
                          className="flex items-center justify-center text-center font-mono text-[10px] text-primary"
                          style={{
                            width:
                              boxSizing === "border-box"
                                ? "auto"
                                : `${displayW}px`,
                            height:
                              boxSizing === "border-box"
                                ? "auto"
                                : `${displayH}px`,
                            minWidth:
                              boxSizing === "border-box" ? 0 : displayW,
                            minHeight:
                              boxSizing === "border-box" ? 0 : displayH,
                            background: CONTENT_BG,
                          }}
                        >
                          <span className="px-1 leading-tight">
                            {content.wAuto || content.hAuto
                              ? `auto·${contentAreaW}×${contentAreaH}`
                              : `${contentAreaW}×${contentAreaH}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
              <LegendDot className="bg-amber-500/40" label="margin" />
              <LegendDot className="bg-primary" label="border" />
              <LegendDot className="bg-cyan-500/40" label="padding" />
              <LegendDot className="bg-primary/30" label="content" />
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Live Preview
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                real rendered box
              </span>
            </div>
            <div
              className="overflow-auto rounded-lg p-2"
              style={{
                backgroundColor: "color-mix(in oklch, var(--muted) 50%, transparent)",
                backgroundImage:
                  "linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.04) 75%), linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.04) 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 8px 8px",
              }}
            >
              <div
                style={previewStyle}
                className="text-[10px] font-mono text-primary"
              >
                <div className="flex items-center justify-center bg-primary/15 px-2 py-1">
                  {content.wAuto || content.hAuto
                    ? `auto · ${contentAreaW}×${contentAreaH}`
                    : `${contentAreaW}×${contentAreaH}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: controls */}
        <div className="space-y-3">
          <SideControlsSection
            title="Margin"
            accentClass="text-amber-700 dark:text-amber-300"
            accentDot="bg-amber-500/50"
            idPrefix="bm-margin"
            sides={margin}
            linked={linkMargin}
            onLinkedChange={setLinkMargin}
            onUpdate={(s, v) => updateSide("margin", s, v)}
          />

          <SideControlsSection
            title="Border"
            accentClass="text-primary"
            accentDot="bg-primary/60"
            idPrefix="bm-border"
            sides={border}
            linked={linkBorder}
            onLinkedChange={setLinkBorder}
            onUpdate={(s, v) => updateSide("border", s, v)}
            extra={
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="bm-border-style"
                    className="text-[10px] text-muted-foreground"
                  >
                    style
                  </Label>
                  <Select
                    value={border.style}
                    onValueChange={(v) =>
                      setBorder((p) => ({ ...p, style: v }))
                    }
                  >
                    <SelectTrigger
                      id="bm-border-style"
                      size="sm"
                      className="h-7 w-full text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BORDER_STYLES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="bm-border-color"
                    className="text-[10px] text-muted-foreground"
                  >
                    color
                  </Label>
                  <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-1.5 py-0.5">
                    <input
                      id="bm-border-color"
                      type="color"
                      value={border.color}
                      onChange={(e) =>
                        setBorder((p) => ({ ...p, color: e.target.value }))
                      }
                      className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
                      aria-label="Border color"
                    />
                    <input
                      type="text"
                      value={border.color}
                      onChange={(e) =>
                        setBorder((p) => ({ ...p, color: e.target.value }))
                      }
                      className="w-full bg-transparent font-mono text-[11px] text-foreground outline-none"
                      aria-label="Border color hex value"
                    />
                  </div>
                </div>
              </div>
            }
          />

          <SideControlsSection
            title="Padding"
            accentClass="text-cyan-700 dark:text-cyan-300"
            accentDot="bg-cyan-500/50"
            idPrefix="bm-padding"
            sides={padding}
            linked={linkPadding}
            onLinkedChange={setLinkPadding}
            onUpdate={(s, v) => updateSide("padding", s, v)}
          />

          {/* Content controls */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <span className="size-2 rounded-sm bg-primary/30" />
              Content
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label
                  htmlFor="bm-content-w"
                  className="text-[10px] text-muted-foreground"
                >
                  Width
                </Label>
                <div className="relative">
                  <Input
                    id="bm-content-w"
                    type="number"
                    min={0}
                    step={1}
                    value={content.w}
                    disabled={content.wAuto}
                    onChange={(e) =>
                      setContent((p) => ({
                        ...p,
                        w: parseSideInput(e.target.value),
                      }))
                    }
                    className="h-7 pr-7 text-right font-mono text-xs disabled:opacity-50"
                  />
                  <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                    px
                  </span>
                </div>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <Checkbox
                    checked={content.wAuto}
                    onCheckedChange={(c) =>
                      setContent((p) => ({ ...p, wAuto: c === true }))
                    }
                    aria-label="Auto width"
                  />
                  <span className="text-[10px] text-muted-foreground">auto</span>
                </label>
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="bm-content-h"
                  className="text-[10px] text-muted-foreground"
                >
                  Height
                </Label>
                <div className="relative">
                  <Input
                    id="bm-content-h"
                    type="number"
                    min={0}
                    step={1}
                    value={content.h}
                    disabled={content.hAuto}
                    onChange={(e) =>
                      setContent((p) => ({
                        ...p,
                        h: parseSideInput(e.target.value),
                      }))
                    }
                    className="h-7 pr-7 text-right font-mono text-xs disabled:opacity-50"
                  />
                  <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                    px
                  </span>
                </div>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <Checkbox
                    checked={content.hAuto}
                    onCheckedChange={(c) =>
                      setContent((p) => ({ ...p, hAuto: c === true }))
                    }
                    aria-label="Auto height"
                  />
                  <span className="text-[10px] text-muted-foreground">auto</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: computed dims + generated CSS */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Computed dimensions */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Computed Dimensions
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {boxSizing}
            </span>
          </div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            className="space-y-1.5"
          >
            <DimRow label="Content box" dims={dims.content} />
            <DimRow label="Padding box" dims={dims.padding} />
            <DimRow label="Border box" dims={dims.border} highlight />
            <DimRow label="Margin box" dims={dims.margin} />
          </motion.div>
          <div className="mt-3 flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs">
            <span className="font-medium text-muted-foreground">
              Total occupied space
            </span>
            <span className="font-mono tabular-nums text-primary">
              {dims.margin.w} × {dims.margin.h}
              <span className="ml-1 text-muted-foreground">px</span>
            </span>
          </div>
        </div>

        {/* Generated CSS */}
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Generated CSS
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                copied
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
              )}
              aria-label={copied ? "CSS copied to clipboard" : "Copy CSS to clipboard"}
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-border/40 bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground/80">
            <code>{cssString}</code>
          </pre>
          <p className="text-[10px] text-muted-foreground">
            Shorthand collapses automatically — equal sides become a single
            value, symmetric pairs become two values.
          </p>
        </div>
      </div>
    </div>
  );
}
