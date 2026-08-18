"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Monitor,
  Proportions,
  RectangleHorizontal,
  RectangleVertical,
  Scaling,
  Smartphone,
  Sparkles,
  Table as TableIcon,
  Tablet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * AspectRatioCalculator — CSS `aspect-ratio` calculator & visualizer.
 *
 * Computes dimensions from an aspect ratio, visualizes how the modern
 * `aspect-ratio` CSS property works at multiple viewport widths, and
 * generates either the modern declaration or the legacy `padding-top`
 * fallback for older browsers.
 *
 * Math:
 *   - GCD via Euclidean algorithm (inputs rounded to integers).
 *   - Simplified ratio = (w/gcd : h/gcd).
 *   - Decimal value = w ÷ h.
 *   - padding-top % = (h ÷ w) × 100 (relative to parent's content width).
 *   - Height from width:  H = W × (h ÷ w).
 *   - Width  from height: W = H × (w ÷ h).
 *
 * Self-contained, semantic-theme-colored, no indigo/blue, TS strict.
 * NOT wired into the app router — surfaced by the RoyCSS tool index.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

type CalcMode = "width" | "height";
type CssMode = "modern" | "fallback";

interface CommonRatio {
  label: string;
  w: number;
  h: number;
}

interface RatioRow extends CommonRatio {
  name: string;
}

interface ResponsiveBreakpoint {
  id: "mobile" | "tablet" | "desktop";
  label: string;
  width: number;
  Icon: typeof Smartphone;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COMMON_RATIOS: CommonRatio[] = [
  { label: "16:9", w: 16, h: 9 },
  { label: "4:3", w: 4, h: 3 },
  { label: "1:1", w: 1, h: 1 },
  { label: "21:9", w: 21, h: 9 },
  { label: "9:16", w: 9, h: 16 },
  { label: "3:2", w: 3, h: 2 },
  { label: "2:1", w: 2, h: 1 },
  { label: "5:4", w: 5, h: 4 },
];

const RATIO_TABLE: RatioRow[] = [
  { label: "16:9", w: 16, h: 9, name: "Widescreen" },
  { label: "4:3", w: 4, h: 3, name: "Standard" },
  { label: "1:1", w: 1, h: 1, name: "Square" },
  { label: "21:9", w: 21, h: 9, name: "Ultrawide" },
  { label: "9:16", w: 9, h: 16, name: "Portrait / Mobile" },
  { label: "3:2", w: 3, h: 2, name: "Photography" },
  { label: "2:1", w: 2, h: 1, name: "Unboxed" },
  { label: "5:4", w: 5, h: 4, name: "Monitor" },
];

const RESPONSIVE_BREAKPOINTS: ResponsiveBreakpoint[] = [
  { id: "mobile", label: "Mobile", width: 375, Icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 768, Icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1200, Icon: Monitor },
];

const DEFAULT_W = 16;
const DEFAULT_H = 9;
const DEFAULT_KNOWN_DIM = 1920;
const DEFAULT_MODE: CalcMode = "width";
const DEFAULT_CSS_MODE: CssMode = "modern";

const RATIO_MAX = 999;
const DIM_MAX = 99_999;

/** Live preview display cap — box fits within this pixel area. */
const LIVE_MAX_W = 320;
const LIVE_MAX_H = 200;
/** Per-cell cap for the responsive preview boxes. */
const RESP_MAX_W = 180;
const RESP_MAX_H = 130;
/** Tiny shape swatches in the reference table. */
const SWATCH_MAX_W = 36;
const SWATCH_MAX_H = 16;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Greatest common divisor via the Euclidean algorithm (inputs floored to ≥1). */
const gcd = (a: number, b: number): number => {
  let x = Math.max(1, Math.round(Math.abs(a)));
  let y = Math.max(1, Math.round(Math.abs(b)));
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
};

const parseIntClamped = (s: string, max: number): number => {
  const n = parseInt(s, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.round(n)));
};

/** Format a dimension: integer if whole, else 2-decimal. */
const formatDim = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
};

/** Format a percentage with up to 2 decimals (e.g. 56.25%). */
const formatPct = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  return `${(Math.round(n * 100) / 100).toFixed(2)}%`;
};

/** Format a ratio's decimal value with up to 4 significant decimals. */
const formatDecimal = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  return String(Math.round(n * 10000) / 10000);
};

/**
 * Fit a box of aspect ratio `w:h` into a `maxW × maxH` pixel area while
 * preserving the ratio. Returns integer display dimensions.
 */
const fitBox = (
  w: number,
  h: number,
  maxW: number,
  maxH: number,
): { dw: number; dh: number } => {
  const rw = Math.max(1, w);
  const rh = Math.max(1, h);
  const ratio = rw / rh;
  let dw = maxW;
  let dh = dw / ratio;
  if (dh > maxH) {
    dh = maxH;
    dw = dh * ratio;
  }
  return { dw: Math.round(dw), dh: Math.round(dh) };
};

// ─── Copy hook ──────────────────────────────────────────────────────────────

/**
 * Per-instance copy state with a 2-second Check confirmation and proper
 * unmount cleanup of the pending timer.
 */
function useCopyConfirmation(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const flash = () => {
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    };
    try {
      void navigator.clipboard.writeText(text).then(flash, flash);
    } catch {
      flash();
    }
  }, []);

  return [copied, copy];
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function CopyButton({
  copied,
  onCopy,
  label,
  copiedLabel = "Copied!",
  className,
}: {
  copied: boolean;
  onCopy: () => void;
  label: string;
  copiedLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
        copied
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-primary/10 text-primary hover:bg-primary/20",
        className,
      )}
      aria-label={
        copied ? copiedLabel : `Copy ${label.toLowerCase()} to clipboard`
      }
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? copiedLabel : label}
    </button>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background px-2.5 py-1.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 truncate font-mono text-sm tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function AspectRatioCalculator() {
  // Ratio inputs
  const [rw, setRw] = useState<number>(DEFAULT_W);
  const [rh, setRh] = useState<number>(DEFAULT_H);

  // Dimension calculator
  const [mode, setMode] = useState<CalcMode>(DEFAULT_MODE);
  const [knownDim, setKnownDim] = useState<number>(DEFAULT_KNOWN_DIM);

  // Generated CSS output mode + per-row table flash
  const [cssMode, setCssMode] = useState<CssMode>(DEFAULT_CSS_MODE);
  const [copiedRowLabel, setCopiedRowLabel] = useState<string | null>(null);
  const rowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (rowTimerRef.current) clearTimeout(rowTimerRef.current);
    };
  }, []);

  const [cssCopied, cssCopy] = useCopyConfirmation();

  // ─── Derived values ──────────────────────────────────────────────────────

  const derived = useMemo(() => {
    const safeW = Math.max(1, rw);
    const safeH = Math.max(1, rh);
    const g = gcd(safeW, safeH);
    return {
      gcd: g,
      simpW: Math.round(safeW) / g,
      simpH: Math.round(safeH) / g,
      decimal: safeW / safeH,
      paddingPct: (safeH / safeW) * 100,
    };
  }, [rw, rh]);

  /** Width & height from the active calculator mode. */
  const dims = useMemo(() => {
    const safeW = Math.max(1, rw);
    const safeH = Math.max(1, rh);
    if (mode === "width") {
      return { width: knownDim, height: (knownDim * safeH) / safeW };
    }
    return { width: (knownDim * safeW) / safeH, height: knownDim };
  }, [mode, knownDim, rw, rh]);

  const liveDisplay = useMemo(
    () => fitBox(rw, rh, LIVE_MAX_W, LIVE_MAX_H),
    [rw, rh],
  );

  const cssModern = useMemo(
    () =>
      [
        ".aspect-box {",
        `  aspect-ratio: ${rw} / ${rh};`,
        "  width: 100%;",
        "  /* height is automatic */",
        "}",
      ].join("\n"),
    [rw, rh],
  );

  const cssFallback = useMemo(
    () =>
      [
        ".aspect-box-fallback {",
        "  position: relative;",
        `  padding-top: ${formatPct(derived.paddingPct)}; /* ${derived.simpH}/${derived.simpW} * 100% */`,
        "}",
        ".aspect-box-fallback > * {",
        "  position: absolute;",
        "  top: 0; left: 0; right: 0; bottom: 0;",
        "}",
      ].join("\n"),
    [derived.paddingPct, derived.simpH, derived.simpW],
  );

  const cssOutput = cssMode === "modern" ? cssModern : cssFallback;

  // ─── Handlers ────────────────────────────────────────────────────────────

  const applyRatio = useCallback((w: number, h: number) => {
    setRw(w);
    setRh(h);
  }, []);

  /** Switch calculator mode and carry over the previously-computed dim. */
  const switchMode = useCallback(
    (next: CalcMode) => {
      if (next === mode) return;
      setKnownDim(Math.round(next === "width" ? dims.width : dims.height));
      setMode(next);
    },
    [mode, dims.width, dims.height],
  );

  const copyRow = useCallback((row: RatioRow) => {
    const css = `aspect-ratio: ${row.w} / ${row.h};`;
    const flash = () => {
      setCopiedRowLabel(row.label);
      if (rowTimerRef.current) clearTimeout(rowTimerRef.current);
      rowTimerRef.current = setTimeout(() => setCopiedRowLabel(null), 2000);
    };
    try {
      void navigator.clipboard.writeText(css).then(flash, flash);
    } catch {
      flash();
    }
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start gap-3"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Proportions className="size-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            Aspect Ratio Calculator
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Compute dimensions from aspect ratios, visualize{" "}
            <code className="font-mono text-foreground/80">aspect-ratio</code>,
            and copy modern or padding-top fallback CSS.
          </p>
        </div>
      </motion.div>

      {/* ─── Ratio input ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="size-3.5" />
          Aspect ratio
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ar-rw" className="text-[11px] text-muted-foreground">
              Width ratio
            </Label>
            <div className="relative">
              <Input
                id="ar-rw"
                type="number"
                min={1}
                max={RATIO_MAX}
                step={1}
                value={rw || ""}
                onChange={(e) =>
                  setRw(parseIntClamped(e.target.value, RATIO_MAX))
                }
                className="h-9 pr-7 text-right font-mono text-sm"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                w
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ar-rh" className="text-[11px] text-muted-foreground">
              Height ratio
            </Label>
            <div className="relative">
              <Input
                id="ar-rh"
                type="number"
                min={1}
                max={RATIO_MAX}
                step={1}
                value={rh || ""}
                onChange={(e) =>
                  setRh(parseIntClamped(e.target.value, RATIO_MAX))
                }
                className="h-9 pr-7 text-right font-mono text-sm"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                h
              </span>
            </div>
          </div>
        </div>

        {/* Common ratio chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {COMMON_RATIOS.map((r) => {
            const isActive = rw === r.w && rh === r.h;
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => applyRatio(r.w, r.h)}
                className={cn(
                  "rounded-md border px-2 py-1 font-mono text-[11px] tabular-nums transition-colors",
                  isActive
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
                aria-pressed={isActive}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Computed summary */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryStat label="Ratio" value={`${rw}:${rh}`} />
          <SummaryStat
            label="Simplified"
            value={`${derived.simpW}:${derived.simpH}`}
          />
          <SummaryStat label="Decimal" value={formatDecimal(derived.decimal)} />
          <SummaryStat
            label="Padding-top"
            value={formatPct(derived.paddingPct)}
          />
        </div>
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
          GCD of <span className="font-mono">{rw}</span> and{" "}
          <span className="font-mono">{rh}</span> is{" "}
          <span className="font-mono">{derived.gcd}</span> · decimal = w ÷ h ·
          padding-top % = (h ÷ w) × 100.
        </p>
      </div>

      {/* ─── Dimension calculator + live preview ───────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Scaling className="size-3.5" />
            Dimension calculator
          </span>
          {/* Segmented: width → height | height → width */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            {(
              [
                {
                  id: "width" as const,
                  label: "Width → Height",
                  Icon: RectangleHorizontal,
                },
                {
                  id: "height" as const,
                  label: "Height → Width",
                  Icon: RectangleVertical,
                },
              ]
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => switchMode(id)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  mode === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={mode === id}
              >
                <Icon className="size-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Input + computed outputs */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="ar-dim"
                className="text-[11px] text-muted-foreground"
              >
                {mode === "width" ? "Known width" : "Known height"}
              </Label>
              <div className="relative">
                <Input
                  id="ar-dim"
                  type="number"
                  min={1}
                  max={DIM_MAX}
                  step={1}
                  value={knownDim || ""}
                  onChange={(e) =>
                    setKnownDim(parseIntClamped(e.target.value, DIM_MAX))
                  }
                  className="h-9 pr-9 text-right font-mono text-sm"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  px
                </span>
              </div>
            </div>

            {/* Computed other dimension */}
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {mode === "width" ? "Computed height" : "Computed width"}
              </div>
              <div className="mt-1 font-mono text-lg tabular-nums text-foreground">
                {formatDim(mode === "width" ? dims.height : dims.width)} px
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {mode === "width"
                  ? "= width × (h ÷ w)"
                  : "= height × (w ÷ h)"}
              </div>
            </div>

            {/* Dimensions summary */}
            <div className="rounded-lg border border-border/60 bg-background p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Width</span>
                <span className="font-mono tabular-nums text-foreground">
                  {formatDim(dims.width)} px
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Height</span>
                <span className="font-mono tabular-nums text-foreground">
                  {formatDim(dims.height)} px
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-border/40 pt-1 text-xs">
                <span className="text-muted-foreground">Ratio</span>
                <span className="font-mono tabular-nums text-primary">
                  {derived.simpW}:{derived.simpH}
                </span>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="space-y-2">
            <div className="text-[11px] text-muted-foreground">
              Live preview · {formatDim(dims.width)} ×{" "}
              {formatDim(dims.height)} px
            </div>
            <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-6">
              <div
                className="relative"
                style={{ width: liveDisplay.dw, height: liveDisplay.dh }}
              >
                {/* The actual aspect-ratio box */}
                <div className="size-full rounded-md border-2 border-primary/60 bg-primary/15" />
                {/* Center: simplified ratio */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded bg-background/85 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-foreground">
                    {derived.simpW}:{derived.simpH}
                  </span>
                </div>
                {/* Top: width */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] tabular-nums text-muted-foreground">
                  {formatDim(dims.width)}px
                </div>
                {/* Right: height */}
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full whitespace-nowrap font-mono text-[10px] tabular-nums text-muted-foreground">
                  {formatDim(dims.height)}px
                </div>
              </div>
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Box shape matches the aspect ratio exactly; visual size is scaled
              to fit the panel.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Responsive preview ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Monitor className="size-3.5" />
          Responsive preview
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {RESPONSIVE_BREAKPOINTS.map(({ id, label, width, Icon }) => {
            const height = (width * Math.max(1, rh)) / Math.max(1, rw);
            const fit = fitBox(rw, rh, RESP_MAX_W, RESP_MAX_H);
            return (
              <div
                key={id}
                className="rounded-lg border border-border/60 bg-background p-3"
              >
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                  <Icon className="size-3.5 text-primary" />
                  {label}
                </div>
                <div className="flex min-h-[150px] items-center justify-center">
                  <div
                    className="rounded-md border-2 border-primary/60 bg-primary/15"
                    style={{ width: fit.dw, height: fit.dh }}
                  />
                </div>
                <div className="mt-2 space-y-0.5 text-center">
                  <div className="font-mono text-[11px] tabular-nums text-foreground">
                    {width} × {formatDim(height)} px
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    width: {width}px
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
          At each viewport width, the box height is{" "}
          <code className="font-mono text-foreground/80">
            width × (h ÷ w)
          </code>
          .
        </p>
      </div>

      {/* ─── Generated CSS ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="size-3.5" />
            Generated CSS
          </span>
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            {(
              [
                { id: "modern" as const, label: "aspect-ratio" },
                { id: "fallback" as const, label: "padding-top" },
              ]
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCssMode(id)}
                className={cn(
                  "rounded-md px-2.5 py-0.5 font-mono text-[11px] transition-colors",
                  cssMode === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={cssMode === id}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {cssMode === "modern"
                ? "Modern (aspect-ratio)"
                : "Fallback (padding-top)"}
            </span>
            <CopyButton
              copied={cssCopied}
              onCopy={() => cssCopy(cssOutput)}
              label="Copy CSS"
            />
          </div>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground/90">
            <code>{cssOutput}</code>
          </pre>
        </div>
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
          {cssMode === "modern"
            ? "Modern browsers (Chrome 88+, Firefox 89+, Safari 15+) compute the height automatically from aspect-ratio."
            : "The padding-top hack is the legacy technique for browsers without aspect-ratio support. The percentage is relative to the parent's content width."}
        </p>
      </div>

      {/* ─── Aspect ratio reference table ──────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <TableIcon className="size-3.5" />
            Aspect ratio reference
          </span>
          <span className="text-[10px] text-muted-foreground">
            Click to copy{" "}
            <code className="font-mono text-foreground/80">aspect-ratio</code>
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-left">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Ratio</th>
                <th className="px-2.5 py-1.5 font-semibold">Name</th>
                <th className="px-2.5 py-1.5 text-right font-semibold">
                  Decimal
                </th>
                <th className="px-2.5 py-1.5 text-right font-semibold">
                  Padding-top
                </th>
                <th className="px-2.5 py-1.5 font-semibold">Shape</th>
                <th className="w-8 px-2.5 py-1.5 text-right font-semibold" />
              </tr>
            </thead>
            <tbody>
              {RATIO_TABLE.map((row) => {
                const decimal = row.w / row.h;
                const pct = (row.h / row.w) * 100;
                const isCopied = copiedRowLabel === row.label;
                const isActive = rw === row.w && rh === row.h;
                const shape = fitBox(row.w, row.h, SWATCH_MAX_W, SWATCH_MAX_H);
                return (
                  <tr
                    key={row.label}
                    onClick={() => copyRow(row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        copyRow(row);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy aspect-ratio ${row.label} (${row.w} / ${row.h}) to clipboard`}
                    className={cn(
                      "cursor-pointer border-t border-border/40 outline-none transition-colors focus-visible:bg-muted/40",
                      isCopied ? "bg-emerald-500/10" : "hover:bg-muted/40",
                    )}
                    title={`Click to copy aspect-ratio: ${row.w} / ${row.h};`}
                  >
                    <td className="px-2.5 py-1.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-xs tabular-nums",
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "text-foreground",
                        )}
                      >
                        {row.label}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 text-xs text-muted-foreground">
                      {row.name}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-xs tabular-nums text-foreground">
                      {formatDecimal(decimal)}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {formatPct(pct)}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="flex items-center justify-center">
                        <div
                          className="rounded-sm border border-primary/50 bg-primary/20"
                          style={{ width: shape.dw, height: shape.dh }}
                        />
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5 text-right">
                      {isCopied ? (
                        <Check className="ml-auto size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="ml-auto size-3.5 text-muted-foreground/60" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Click any row to copy{" "}
          <code className="font-mono text-foreground/80">
            aspect-ratio: W / H;
          </code>
          . The current selection is highlighted.
        </p>
      </div>
    </div>
  );
}

export default AspectRatioCalculator;
