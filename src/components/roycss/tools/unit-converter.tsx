"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  Copy,
  Info,
  Monitor,
  Ruler,
  Sparkles,
  Table,
  Type,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   CSS Unit Converter Pro
   ───────────────────────────────────────────────────────────────
   A self-contained converter across the full CSS length-unit set:
   px, rem, em, %, vw, vh, vmin, vmax, pt, pc, cm, mm, in, ex, ch, Q.

   Conversion basis (CSS spec): 1in = 96px.
     pt: 1pt = 96/72 px ≈ 1.3333
     pc: 1pc = 12pt = 16px
     cm: 1cm = 96/2.54 px ≈ 37.7953
     mm: 1mm = cm/10 ≈ 3.7795
     Q : 1Q  = cm/40 ≈ 0.9449
   Relative:
     rem/em → × rootFontSize (em assumes root — caveat in UI)
     vw/vh/vmin/vmax → × viewport dimension / 100
     %    → context-dependent; simulator treats input % as % of vw
     ex/ch → ≈ 0.5em (font-dependent approximation)
   ═══════════════════════════════════════════════════════════════ */

// ─── Types ─────────────────────────────────────────────────────────────────

type UnitId =
  | "px"
  | "rem"
  | "em"
  | "%"
  | "vw"
  | "vh"
  | "vmin"
  | "vmax"
  | "pt"
  | "pc"
  | "cm"
  | "mm"
  | "in"
  | "ex"
  | "ch"
  | "Q";

type UnitCategory =
  | "Absolute"
  | "Relative"
  | "Viewport"
  | "Physical"
  | "Font"
  | "Contextual";

interface UnitDef {
  id: UnitId;
  label: string;
  name: string;
  category: UnitCategory;
  description: string;
}

interface ConvCtx {
  rootFontSize: number;
  vw: number;
  vh: number;
}

interface ConversionRow {
  id: UnitId;
  label: string;
  value: number;
  formatted: string;
  barPct: number;
  contextual: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PX_PER_IN = 96;
const PX_PER_PT = PX_PER_IN / 72; // 1.3333
const PX_PER_PC = PX_PER_IN / 6; // 16  (1pc = 12pt)
const PX_PER_CM = PX_PER_IN / 2.54; // 37.7953
const PX_PER_MM = PX_PER_CM / 10; // 3.7795
const PX_PER_Q = PX_PER_CM / 40; // 0.9449
const EX_FACTOR = 0.5; // ex ≈ 0.5em (x-height approximation)
const CH_FACTOR = 0.5; // ch ≈ 0.5em (monospace approximation)

const ROOT_FONT_MIN = 8;
const ROOT_FONT_MAX = 32;
const ROOT_FONT_DEFAULT = 16;
const VIEWPORT_DEFAULT_W = 1440;
const VIEWPORT_DEFAULT_H = 900;
const VIEWPORT_MIN = 1;
const VIEWPORT_MAX = 10000;
const COPY_CONFIRM_MS = 2000;

const PREVIEW_FONT_MIN = 10;
const PREVIEW_FONT_MAX = 56;
const PREVIEW_BAR_REF = 480; // px width referenced by the live-preview bar (100%)

const UNITS: readonly UnitDef[] = [
  {
    id: "px",
    label: "px",
    name: "Pixels",
    category: "Absolute",
    description:
      "Absolute pixels. 1px = 1/96 inch. CSS pixels are device-independent (not physical screen pixels).",
  },
  {
    id: "rem",
    label: "rem",
    name: "Root em",
    category: "Relative",
    description:
      "Relative to the :root (html) font-size. 1rem = rootFontSize px. Scales predictably across the document.",
  },
  {
    id: "em",
    label: "em",
    name: "Em",
    category: "Relative",
    description:
      "Relative to the parent element's font-size. Cascades — em values compound when nested. Simulator assumes root for simplicity.",
  },
  {
    id: "%",
    label: "%",
    name: "Percentage",
    category: "Contextual",
    description:
      "Relative to a parent dimension. Context-dependent: for font-size it's % of parent font-size; for width/height it's % of the parent's corresponding dimension.",
  },
  {
    id: "vw",
    label: "vw",
    name: "Viewport width",
    category: "Viewport",
    description: "1vw = 1% of the viewport width. Recomputes on resize.",
  },
  {
    id: "vh",
    label: "vh",
    name: "Viewport height",
    category: "Viewport",
    description: "1vh = 1% of the viewport height. Recomputes on resize.",
  },
  {
    id: "vmin",
    label: "vmin",
    name: "Viewport min",
    category: "Viewport",
    description:
      "1vmin = 1% of the smaller viewport dimension. Useful for consistent sizing across orientations.",
  },
  {
    id: "vmax",
    label: "vmax",
    name: "Viewport max",
    category: "Viewport",
    description: "1vmax = 1% of the larger viewport dimension.",
  },
  {
    id: "pt",
    label: "pt",
    name: "Points",
    category: "Physical",
    description: "1pt = 1/72 inch = 1.3333px. Common in print stylesheets.",
  },
  {
    id: "pc",
    label: "pc",
    name: "Picas",
    category: "Physical",
    description: "1pc = 12pt = 16px. Used in typography and print.",
  },
  {
    id: "cm",
    label: "cm",
    name: "Centimeters",
    category: "Physical",
    description: "1cm = 96/2.54 px ≈ 37.7953px (CSS reference inch).",
  },
  {
    id: "mm",
    label: "mm",
    name: "Millimeters",
    category: "Physical",
    description: "1mm = 1/10 cm ≈ 3.7795px.",
  },
  {
    id: "in",
    label: "in",
    name: "Inches",
    category: "Physical",
    description:
      "1in = 96px. The CSS reference unit for all physical conversions.",
  },
  {
    id: "ex",
    label: "ex",
    name: "X-height",
    category: "Font",
    description:
      "Height of the lowercase 'x' in the current font. ≈ 0.5em (varies by typeface). Simulator uses 0.5em.",
  },
  {
    id: "ch",
    label: "ch",
    name: "Character",
    category: "Font",
    description:
      'Width of the "0" glyph in the current font. ≈ 0.5em for monospace fonts (varies). Simulator uses 0.5em.',
  },
  {
    id: "Q",
    label: "Q",
    name: "Quarter-mm",
    category: "Physical",
    description:
      "1Q = 1/40 cm ≈ 0.9449px. Used in East Asian typography.",
  },
] as const;

/** Lowercase alias → canonical UnitId (handles case-insensitive parsing). */
const UNIT_ALIASES: Record<string, UnitId> = {
  px: "px",
  rem: "rem",
  em: "em",
  "%": "%",
  vw: "vw",
  vh: "vh",
  vmin: "vmin",
  vmax: "vmax",
  pt: "pt",
  pc: "pc",
  cm: "cm",
  mm: "mm",
  in: "in",
  ex: "ex",
  ch: "ch",
  q: "Q",
};

const QUICK_CHIPS: { label: string; value: string; unit: UnitId }[] = [
  { label: "16px", value: "16", unit: "px" },
  { label: "1rem", value: "1", unit: "rem" },
  { label: "100vw", value: "100", unit: "vw" },
  { label: "12pt", value: "12", unit: "pt" },
  { label: "1in", value: "1", unit: "in" },
];

const SAMPLE_CSS = `/* Paste your CSS — every value+unit is converted to the target unit */
.hero {
  padding: 16px 24px 32px;
  font-size: 1.125rem;
  width: 50%;
  margin-top: 12pt;
  border-width: 0.5mm;
  max-width: 8in;
  line-height: 1.5;
}`;

// ─── Math helpers ──────────────────────────────────────────────────────────

function clampNum(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Convert a value in the given unit to CSS pixels.
 * Exhaustive over UnitId — TypeScript enforces every case is handled.
 */
function toPx(value: number, unit: UnitId, ctx: ConvCtx): number {
  switch (unit) {
    case "px":
      return value;
    case "rem":
      return value * ctx.rootFontSize;
    case "em":
      return value * ctx.rootFontSize; // assumes root — caveat in UI
    case "%":
      return (value * ctx.vw) / 100; // context-dependent — treated as % of vw
    case "vw":
      return (value * ctx.vw) / 100;
    case "vh":
      return (value * ctx.vh) / 100;
    case "vmin":
      return (value * Math.min(ctx.vw, ctx.vh)) / 100;
    case "vmax":
      return (value * Math.max(ctx.vw, ctx.vh)) / 100;
    case "pt":
      return value * PX_PER_PT;
    case "pc":
      return value * PX_PER_PC;
    case "cm":
      return value * PX_PER_CM;
    case "mm":
      return value * PX_PER_MM;
    case "in":
      return value * PX_PER_IN;
    case "ex":
      return value * ctx.rootFontSize * EX_FACTOR;
    case "ch":
      return value * ctx.rootFontSize * CH_FACTOR;
    case "Q":
      return value * PX_PER_Q;
  }
}

/** Inverse of {@link toPx}: convert CSS pixels into the given unit. */
function fromPx(px: number, unit: UnitId, ctx: ConvCtx): number {
  switch (unit) {
    case "px":
      return px;
    case "rem":
      return px / ctx.rootFontSize;
    case "em":
      return px / ctx.rootFontSize;
    case "%":
      return (px * 100) / ctx.vw;
    case "vw":
      return (px * 100) / ctx.vw;
    case "vh":
      return (px * 100) / ctx.vh;
    case "vmin":
      return (px * 100) / Math.min(ctx.vw, ctx.vh);
    case "vmax":
      return (px * 100) / Math.max(ctx.vw, ctx.vh);
    case "pt":
      return px / PX_PER_PT;
    case "pc":
      return px / PX_PER_PC;
    case "cm":
      return px / PX_PER_CM;
    case "mm":
      return px / PX_PER_MM;
    case "in":
      return px / PX_PER_IN;
    case "ex":
      return px / (ctx.rootFontSize * EX_FACTOR);
    case "ch":
      return px / (ctx.rootFontSize * CH_FACTOR);
    case "Q":
      return px / PX_PER_Q;
  }
}

/**
 * Format a number to 4 decimal places, trimming trailing zeros.
 * Falls back to scientific notation for values too small to express at
 * 4 decimals (so 0.00001 doesn't render as "0").
 */
function formatValue(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (v === 0) return "0";
  const fixed = v.toFixed(4);
  const trimmed = fixed.replace(/\.?0+$/, "");
  if (trimmed === "0" || trimmed === "-0") {
    return v.toExponential(2);
  }
  return trimmed;
}

// ─── Batch parsing ─────────────────────────────────────────────────────────

/**
 * Matches `<number><unit>` pairs in CSS text.
 * - `-?` allows negative values (e.g. margin: -4px).
 * - `\d*\.?\d+` matches integers, decimals, and leading-dot decimals (.5).
 * - Unit alternation is case-insensitive (CSS allows e.g. 1REM).
 * - Trailing `(?![a-z0-9])` (with `i` flag → `(?![A-Za-z0-9])`) prevents
 *   matching a unit that's actually part of a longer identifier
 *   (e.g. "16quick" won't match "16q").
 * - `s`/`ms`/`deg`/`fr`/`hz` etc. are intentionally excluded.
 */
const UNIT_RE =
  /(-?\d*\.?\d+)(vmin|vmax|rem|px|em|vw|vh|pt|pc|cm|mm|in|ex|ch|q|%)(?![a-z0-9])/gi;

interface BatchMatch {
  value: number;
  unit: UnitId;
  start: number;
  end: number;
  raw: string;
}

function parseCssValues(css: string): BatchMatch[] {
  const out: BatchMatch[] = [];
  UNIT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = UNIT_RE.exec(css)) !== null) {
    const value = parseFloat(m[1]);
    if (!Number.isFinite(value)) continue;
    const canonical = UNIT_ALIASES[m[2].toLowerCase()];
    if (!canonical) continue;
    out.push({
      value,
      unit: canonical,
      start: m.index,
      end: m.index + m[0].length,
      raw: m[0],
    });
  }
  return out;
}

interface BatchResult {
  output: string;
  count: number;
}

/** Convert every numeric value in `css` to `target` unit. */
function convertCss(css: string, target: UnitId, ctx: ConvCtx): BatchResult {
  const matches = parseCssValues(css);
  if (matches.length === 0) return { output: css, count: 0 };
  let result = "";
  let cursor = 0;
  let count = 0;
  for (const mt of matches) {
    result += css.slice(cursor, mt.start);
    if (mt.unit === target) {
      // already in target unit — preserve original text
      result += mt.raw;
    } else {
      const px = toPx(mt.value, mt.unit, ctx);
      const converted = fromPx(px, target, ctx);
      result += `${formatValue(converted)}${target}`;
      count += 1;
    }
    cursor = mt.end;
  }
  result += css.slice(cursor);
  return { output: result, count };
}

// ─── Component ─────────────────────────────────────────────────────────────

export function UnitConverterPro() {
  /* ─── Simulator state ─── */
  const [rootFontSize, setRootFontSize] = useState<number>(ROOT_FONT_DEFAULT);
  const [vwStr, setVwStr] = useState<string>(String(VIEWPORT_DEFAULT_W));
  const [vhStr, setVhStr] = useState<string>(String(VIEWPORT_DEFAULT_H));

  /* ─── Single conversion state ─── */
  const [inputValue, setInputValue] = useState<string>("16");
  const [inputUnit, setInputUnit] = useState<UnitId>("px");

  /* ─── Batch state ─── */
  const [batchInput, setBatchInput] = useState<string>(SAMPLE_CSS);
  const [batchTarget, setBatchTarget] = useState<UnitId>("rem");

  /* ─── UI state ─── */
  const [copiedRow, setCopiedRow] = useState<UnitId | null>(null);
  const [copiedBatch, setCopiedBatch] = useState<boolean>(false);
  const [refOpen, setRefOpen] = useState<boolean>(false);

  /* ─── Derived: viewport (always valid ≥ 1) ─── */
  const vw = useMemo(
    () => clampNum(parseInt(vwStr, 10) || VIEWPORT_MIN, VIEWPORT_MIN, VIEWPORT_MAX),
    [vwStr],
  );
  const vh = useMemo(
    () => clampNum(parseInt(vhStr, 10) || VIEWPORT_MIN, VIEWPORT_MIN, VIEWPORT_MAX),
    [vhStr],
  );

  const ctx = useMemo<ConvCtx>(
    () => ({ rootFontSize, vw, vh }),
    [rootFontSize, vw, vh],
  );

  /* ─── Viewport preview box (preserves aspect ratio within 96×56) ─── */
  const viewportPreview = useMemo(() => {
    const maxW = 96;
    const maxH = 56;
    const ratio = vw / vh;
    let dW = maxW;
    let dH = maxW / ratio;
    if (dH > maxH) {
      dH = maxH;
      dW = maxH * ratio;
    }
    return { width: Math.round(dW), height: Math.round(dH) };
  }, [vw, vh]);

  /* ─── Single conversion math (memoized) ─── */
  const num = parseFloat(inputValue);
  const isValid = Number.isFinite(num);

  const pxValue = useMemo(() => {
    if (!isValid) return 0;
    return toPx(num, inputUnit, ctx);
  }, [isValid, num, inputUnit, ctx]);

  const rows = useMemo<ConversionRow[]>(() => {
    if (!isValid) return [];
    const others = UNITS.filter((u) => u.id !== inputUnit);
    const computed = others.map((u) => {
      const v = fromPx(pxValue, u.id, ctx);
      return {
        id: u.id,
        label: u.label,
        value: v,
        formatted: formatValue(v),
      };
    });
    const maxAbs = Math.max(
      ...computed.map((r) => Math.abs(r.value)),
      1,
    );
    return computed.map((r) => ({
      ...r,
      barPct: Math.max(6, (Math.abs(r.value) / maxAbs) * 100),
      contextual: r.id === "%",
    }));
  }, [isValid, pxValue, inputUnit, ctx]);

  /* ─── Live preview (clamped for display) ─── */
  const preview = useMemo(() => {
    if (!isValid || pxValue <= 0) return null;
    const fontPx = clampNum(pxValue, PREVIEW_FONT_MIN, PREVIEW_FONT_MAX);
    const barPct = clampNum((pxValue / PREVIEW_BAR_REF) * 100, 1, 100);
    const scaled = fontPx !== pxValue;
    return { fontPx, barPct, scaled };
  }, [isValid, pxValue]);

  /* ─── Batch conversion (memoized) ─── */
  const batchResult = useMemo(
    () => convertCss(batchInput, batchTarget, ctx),
    [batchInput, batchTarget, ctx],
  );

  /* ─── Copy handlers ─── */
  const handleCopyRow = useCallback(
    async (id: UnitId, formatted: string) => {
      try {
        await navigator.clipboard.writeText(`${formatted}${id}`);
        setCopiedRow(id);
        window.setTimeout(() => setCopiedRow(null), COPY_CONFIRM_MS);
      } catch {
        /* clipboard unavailable — silently ignore */
      }
    },
    [],
  );

  const handleCopyBatch = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(batchResult.output);
      setCopiedBatch(true);
      window.setTimeout(() => setCopiedBatch(false), COPY_CONFIRM_MS);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [batchResult.output]);

  const applyChip = useCallback((chip: { value: string; unit: UnitId }) => {
    setInputValue(chip.value);
    setInputUnit(chip.unit);
  }, []);

  /* ─── Render ─── */
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card/50 p-4 backdrop-blur-sm sm:p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Ruler className="size-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold leading-tight text-foreground">
            CSS Unit Converter Pro
          </h3>
          <p className="text-xs text-muted-foreground">
            Convert across px · rem · em · % · vw · vh · vmin · vmax · pt · pc ·
            cm · mm · in · ex · ch · Q — with root font-size &amp; viewport
            simulators.
          </p>
        </div>
      </div>

      {/* ── Controls: root font size + viewport ── */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Root font size simulator */}
        <div className="rounded-xl border border-border bg-background/40 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Type className="size-3.5 text-primary" />
            <Label
              htmlFor="ucp-root-font"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Root font size
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Slider
              id="ucp-root-font"
              value={[rootFontSize]}
              onValueChange={(vals) => setRootFontSize(vals[0] ?? ROOT_FONT_DEFAULT)}
              min={ROOT_FONT_MIN}
              max={ROOT_FONT_MAX}
              step={1}
              className="flex-1"
              aria-label="Root font size in pixels"
            />
            <div className="flex items-baseline gap-0.5 tabular-nums">
              <span className="font-mono text-2xl font-bold text-foreground">
                {rootFontSize}
              </span>
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
            1rem = {rootFontSize}px · :root {"{ font-size:"} {rootFontSize}px {"}"}
          </p>
        </div>

        {/* Viewport size simulator */}
        <div className="rounded-xl border border-border bg-background/40 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Monitor className="size-3.5 text-primary" />
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Viewport size
            </Label>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                inputMode="numeric"
                value={vwStr}
                onChange={(e) => setVwStr(e.target.value)}
                className="h-8 w-20 font-mono text-sm"
                aria-label="Viewport width in pixels"
                min={VIEWPORT_MIN}
                max={VIEWPORT_MAX}
              />
              <span className="text-xs text-muted-foreground">×</span>
              <Input
                type="number"
                inputMode="numeric"
                value={vhStr}
                onChange={(e) => setVhStr(e.target.value)}
                className="h-8 w-20 font-mono text-sm"
                aria-label="Viewport height in pixels"
                min={VIEWPORT_MIN}
                max={VIEWPORT_MAX}
              />
            </div>
            <div className="flex flex-1 justify-end">
              <div
                className="shrink-0 rounded-sm border-2 border-primary/40 bg-primary/5"
                style={{ width: viewportPreview.width, height: viewportPreview.height }}
                role="img"
                aria-label={`Viewport aspect ratio ${vw} by ${vh} pixels`}
              />
            </div>
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
            1vw = {formatValue(vw / 100)}px · 1vh = {formatValue(vh / 100)}px
          </p>
        </div>
      </div>

      {/* ── Quick chips ── */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3 text-primary" />
          Quick
        </span>
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => applyChip(chip)}
            className="rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <Separator className="my-4" />

      {/* ── Single conversion panel ── */}
      <section aria-label="Single unit conversion" className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label
              htmlFor="ucp-value"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Value
            </Label>
            <Input
              id="ucp-value"
              type="number"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="16"
              className="h-11 font-mono text-lg"
            />
          </div>
          <div className="w-28">
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Unit
            </Label>
            <Select
              value={inputUnit}
              onValueChange={(v) => setInputUnit(v as UnitId)}
            >
              <SelectTrigger className="h-11 w-full font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <span className="font-mono">{u.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {u.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Live preview */}
        {preview ? (
          <div className="rounded-lg border border-border bg-background/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Live preview
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                = {formatValue(pxValue)}px
                {preview.scaled ? " (scaled for display)" : ""}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="flex items-baseline"
                style={{ minHeight: `${PREVIEW_FONT_MAX}px` }}
              >
                <span
                  className="font-display font-semibold leading-none text-foreground"
                  style={{ fontSize: `${preview.fontPx}px` }}
                >
                  Aa
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-[width] duration-200"
                    style={{ width: `${preview.barPct}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  width ≈ {formatValue(pxValue)}px
                  {pxValue > PREVIEW_BAR_REF ? " (clamped to 100%)" : ""}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Conversion table */}
        <div className="overflow-hidden rounded-lg border border-border">
          {/* Caption (sr-only — describes the table for assistive tech) */}
          <p id="ucp-table-caption" className="sr-only">
            Equivalent values of{" "}
            {isValid ? `${inputValue}${inputUnit}` : "the input"} across all
            supported CSS units. Click any row to copy its value.
          </p>
          {/* Header row */}
          <div
            className="flex items-center gap-3 border-b border-border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground"
            aria-hidden
          >
            <span className="w-14">Unit</span>
            <span className="flex-1">Value</span>
            <span className="w-24">Relative</span>
            <span className="w-4" />
          </div>
          {/* Body */}
          <div
            className="max-h-[360px] overflow-y-auto p-1"
            aria-describedby="ucp-table-caption"
          >
            {rows.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Enter a value to see conversions.
              </div>
            ) : (
              rows.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleCopyRow(r.id, r.formatted)}
                  aria-label={`Copy ${r.formatted}${r.id}`}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                    "hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
                    copiedRow === r.id && "bg-primary/5",
                  )}
                >
                  <span className="w-14 font-mono text-sm font-semibold text-foreground">
                    {r.label}
                  </span>
                  <span className="flex flex-1 items-baseline gap-1 font-mono text-sm">
                    {r.contextual ? (
                      <>
                        <span className="italic text-muted-foreground">
                          context-dependent
                        </span>
                        <span className="text-[11px] text-muted-foreground/70">
                          (≈ {r.formatted}% of vw)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-foreground">{r.formatted}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.id}
                        </span>
                      </>
                    )}
                  </span>
                  <span
                    className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"
                    aria-hidden
                  >
                    <span
                      className="block h-full rounded-full bg-primary/70"
                      style={{ width: `${r.barPct}%` }}
                    />
                  </span>
                  <span className="flex w-4 items-center justify-center" aria-hidden>
                    {copiedRow === r.id ? (
                      <Check className="size-3.5 text-primary" />
                    ) : (
                      <Copy className="size-3.5 text-muted-foreground" />
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Caveat note */}
        <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5">
          <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">em</span> assumes the
            parent font-size equals the root (simulator).{" "}
            <span className="font-medium text-foreground">%</span> is
            context-dependent (font-size vs width vs height) — shown as an
            approximation relative to viewport width.{" "}
            <span className="font-medium text-foreground">ex</span> /{" "}
            <span className="font-medium text-foreground">ch</span> use a 0.5em
            approximation (actual values vary by typeface).
          </p>
        </div>
      </section>

      <Separator className="my-4" />

      {/* ── Batch converter ── */}
      <section aria-label="Batch CSS conversion" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">
              Batch converter
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="ucp-batch-target"
              className="text-xs text-muted-foreground"
            >
              Target
            </Label>
            <Select
              value={batchTarget}
              onValueChange={(v) => setBatchTarget(v as UnitId)}
            >
              <SelectTrigger id="ucp-batch-target" className="h-8 w-24 font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <span className="font-mono">{u.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* Input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="ucp-batch-input"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Input CSS
            </Label>
            <Textarea
              id="ucp-batch-input"
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              spellCheck={false}
              className="min-h-[180px] resize-y font-mono text-xs leading-relaxed"
              placeholder="Paste CSS with unit values…"
            />
          </div>
          {/* Output */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Output ({batchResult.count} converted)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyBatch}
                disabled={batchResult.count === 0}
                className="h-7 gap-1.5 px-2 text-xs"
              >
                {copiedBatch ? (
                  <>
                    <Check className="size-3 text-primary" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    Copy CSS
                  </>
                )}
              </Button>
            </div>
            <pre className="max-h-[220px] min-h-[180px] overflow-auto rounded-lg border border-border bg-background/60 p-3">
              <code className="whitespace-pre font-mono text-xs leading-relaxed text-foreground">
                {batchResult.output}
              </code>
            </pre>
          </div>
        </div>
      </section>

      <Separator className="my-4" />

      {/* ── Unit reference (collapsible) ── */}
      <Collapsible open={refOpen} onOpenChange={setRefOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <Table className="size-4 text-primary" />
              Unit reference
              <Badge variant="secondary" className="text-[10px]">
                {UNITS.length}
              </Badge>
            </span>
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-200",
                refOpen && "rotate-180",
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {UNITS.map((u) => (
              <div
                key={u.id}
                className="rounded-lg border border-border bg-background/40 p-2.5"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="w-8 font-mono text-sm font-bold text-foreground">
                    {u.label}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {u.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-auto text-[10px] text-muted-foreground"
                  >
                    {u.category}
                  </Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {u.description}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
