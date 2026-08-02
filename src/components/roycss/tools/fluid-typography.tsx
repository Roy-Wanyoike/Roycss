"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Type,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  ChevronRight,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * FluidTypographyCalculator — a CSS `clamp()` generator for fluid typography.
 *
 * Generates a `clamp(MIN, PREFERRED, MAX)` value that scales font-size
 * linearly between a min and max viewport width, hitting exactly minFS at
 * minVW and maxFS at maxVW.
 *
 * Math derivation:
 *   We want `font = S + R * (1vw)` where `1vw` resolves to viewport/100 px.
 *   At vw = minVW (so 1vw = minVW/100 px), font = minFS:
 *     minFS = S + R * (minVW / 100)
 *   At vw = maxVW, font = maxFS:
 *     maxFS = S + R * (maxVW / 100)
 *   Subtracting:  maxFS - minFS = R * (maxVW - minVW) / 100
 *   =>  R = 100 * (maxFS - minFS) / (maxVW - minVW)   (vw coefficient, unitless)
 *   =>  S = minFS - R * (minVW / 100)                  (intercept, in font units)
 *
 *   Equivalently, let B = (maxFS - minFS) / (maxVW - minVW)  (px per px):
 *     R = 100 * B
 *     S_px = minFS - B * minVW
 *   For rem output, divide px values by rootFontSize (R is dimensionless).
 *
 * Live preview uses one iframe per simulated viewport — the iframe's layout
 * width equals the viewport width, so `vw` resolves correctly inside it.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

interface Preset {
  name: string;
  minFS: number;
  maxFS: number;
  minVW: number;
  maxVW: number;
}

type Unit = "px" | "rem";
type CopyTarget = "clamp" | "rule" | "full";

interface ClampParams {
  /** Slope B = (maxFS - minFS) / (maxVW - minVW), px-per-px. */
  B: number;
  /** vw coefficient R = 100 * B (unitless). */
  R: number;
  /** Intercept S in px (= minFS - B * minVW). */
  Spx: number;
  /** Intercept S in the chosen output unit. */
  S: number;
  /** "16px" or "1rem". */
  minStr: string;
  /** "32px" or "2rem". */
  maxStr: string;
  /** "10.18px + 1.82vw" or "0.64rem + 1.82vw". */
  preferredStr: string;
  /** "clamp(1rem, 0.64rem + 1.82vw, 2rem)". */
  fullClamp: string;
}

interface ThemeColors {
  bg: string;
  fg: string;
  muted: string;
  border: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PRESETS: Preset[] = [
  { name: "Body text", minFS: 16, maxFS: 20, minVW: 320, maxVW: 1200 },
  { name: "H1", minFS: 32, maxFS: 64, minVW: 320, maxVW: 1200 },
  { name: "H2", minFS: 24, maxFS: 48, minVW: 320, maxVW: 1200 },
  { name: "H3", minFS: 20, maxFS: 36, minVW: 320, maxVW: 1200 },
  { name: "Small print", minFS: 12, maxFS: 14, minVW: 320, maxVW: 1200 },
  { name: "Aggressive H1", minFS: 28, maxFS: 80, minVW: 375, maxVW: 1440 },
];

const PREVIEW_VIEWPORTS = [320, 480, 768, 1024, 1200, 1440] as const;

const COPY_CONFIRM_MS = 2000;
const IFRAME_DEBOUNCE_MS = 200;

// ─── Math helpers ───────────────────────────────────────────────────────────

function clampNum(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Format a number with up to `decimals` digits, trimming trailing zeros. */
function fmt(n: number, decimals = 2): string {
  return Number(n.toFixed(decimals)).toString();
}

function computeClamp(
  minFS: number,
  maxFS: number,
  minVW: number,
  maxVW: number,
  unit: Unit,
  rootFontSize: number,
): ClampParams {
  // Guard against degenerate inputs (division by zero / reversed ranges).
  const vRange = maxVW - minVW;
  const safeRange = vRange === 0 ? 1 : vRange;
  const B = (maxFS - minFS) / safeRange;
  const R = 100 * B;
  const Spx = minFS - B * minVW;

  if (unit === "rem") {
    const root = rootFontSize || 16;
    const minStr = `${fmt(minFS / root)}rem`;
    const maxStr = `${fmt(maxFS / root)}rem`;
    const preferredStr = `${fmt(Spx / root)}rem + ${fmt(R, 3)}vw`;
    return {
      B,
      R,
      Spx,
      S: Spx / root,
      minStr,
      maxStr,
      preferredStr,
      fullClamp: `clamp(${minStr}, ${preferredStr}, ${maxStr})`,
    };
  }

  const minStr = `${fmt(minFS)}px`;
  const maxStr = `${fmt(maxFS)}px`;
  const preferredStr = `${fmt(Spx)}px + ${fmt(R, 3)}vw`;
  return {
    B,
    R,
    Spx,
    S: Spx,
    minStr,
    maxStr,
    preferredStr,
    fullClamp: `clamp(${minStr}, ${preferredStr}, ${maxStr})`,
  };
}

/** Resolved font size (px) at a given viewport width, clamping outside the ramp. */
function fontSizeAtV(
  V: number,
  minFS: number,
  maxFS: number,
  minVW: number,
  maxVW: number,
): number {
  if (V <= minVW) return minFS;
  if (V >= maxVW) return maxFS;
  const range = maxVW - minVW;
  if (range === 0) return minFS;
  return minFS + ((V - minVW) * (maxFS - minFS)) / range;
}

/** Escape HTML special characters in user-provided text. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Sub-component: SliderInput (number input + slider combo) ───────────────

interface SliderInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon?: React.ReactNode;
  invalid?: boolean;
  hint?: string;
}

function SliderInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  icon,
  invalid,
  hint,
}: SliderInputProps) {
  const hintId = `${id}-hint`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={id}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          {icon ? (
            <span className="text-muted-foreground/80" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {label}
        </Label>
        <div className="flex items-center gap-1">
          <Input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) onChange(clampNum(n, min, max));
            }}
            className={cn(
              "h-7 w-16 text-right font-mono text-xs",
              invalid && "border-destructive/60 text-destructive",
            )}
            aria-invalid={invalid || undefined}
            aria-describedby={hint ? hintId : undefined}
          />
          <span className="w-4 text-xs text-muted-foreground" aria-hidden="true">
            {unit}
          </span>
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
      {hint ? (
        <p id={hintId} className="text-[10px] text-destructive">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// ─── Sub-component: CurveChart (SVG line chart of font-size vs viewport) ─────

interface CurveChartProps {
  minFS: number;
  maxFS: number;
  minVW: number;
  maxVW: number;
  invalid: boolean;
}

function CurveChart({
  minFS,
  maxFS,
  minVW,
  maxVW,
  invalid,
}: CurveChartProps) {
  const W = 280;
  const H = 124;
  const padL = 34;
  const padR = 12;
  const padT = 10;
  const padB = 24;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Normalize so the chart stays sane even when inputs are reversed.
  const loFS = Math.min(minFS, maxFS);
  const hiFS = Math.max(minFS, maxFS);
  const loVW = Math.min(minVW, maxVW);
  const hiVW = Math.max(minVW, maxVW);

  const xMax = Math.max(1600, Math.ceil((hiVW + 100) / 100) * 100);
  const yMaxRaw = Math.max(hiFS * 1.15, loFS + 4);
  const yMax = Math.max(8, Math.ceil(yMaxRaw / 4) * 4);

  const xScale = (v: number) => padL + (v / xMax) * plotW;
  const yScale = (f: number) => padT + plotH - (f / yMax) * plotH;

  const pts = [
    { v: 0, f: loFS },
    { v: loVW, f: loFS },
    { v: hiVW, f: hiFS },
    { v: xMax, f: hiFS },
  ];
  const path = pts
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(p.v).toFixed(2)} ${yScale(p.f).toFixed(2)}`,
    )
    .join(" ");

  const midV = (loVW + hiVW) / 2;
  const midF = (loFS + hiFS) / 2;

  const xTicks = [0, loVW, hiVW, xMax];
  const ariaLabel = invalid
    ? "Font-size curve is invalid: max font size is below min, or max viewport is not greater than min."
    : `Font-size curve: flat at ${fmt(loFS)}px until viewport ${loVW}px, ramps linearly to ${fmt(hiFS)}px at ${hiVW}px viewport, then flat.`;

  return (
    <div className="space-y-1 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Font-size curve
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          px ↑ / px →
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={ariaLabel}
      >
        {/* Horizontal grid lines at loFS / hiFS */}
        <line
          x1={padL}
          y1={yScale(loFS)}
          x2={W - padR}
          y2={yScale(loFS)}
          className="stroke-muted-foreground/25"
          strokeWidth={0.5}
          strokeDasharray="2 3"
        />
        <line
          x1={padL}
          y1={yScale(hiFS)}
          x2={W - padR}
          y2={yScale(hiFS)}
          className="stroke-muted-foreground/25"
          strokeWidth={0.5}
          strokeDasharray="2 3"
        />

        {/* Vertical guide lines at loVW / hiVW */}
        <line
          x1={xScale(loVW)}
          y1={padT}
          x2={xScale(loVW)}
          y2={padT + plotH}
          className="stroke-muted-foreground/25"
          strokeWidth={0.5}
          strokeDasharray="2 3"
        />
        <line
          x1={xScale(hiVW)}
          y1={padT}
          x2={xScale(hiVW)}
          y2={padT + plotH}
          className="stroke-muted-foreground/25"
          strokeWidth={0.5}
          strokeDasharray="2 3"
        />

        {/* Axes */}
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + plotH}
          className="stroke-border"
          strokeWidth={1}
        />
        <line
          x1={padL}
          y1={padT + plotH}
          x2={W - padR}
          y2={padT + plotH}
          className="stroke-border"
          strokeWidth={1}
        />

        {/* The ramp path (flat → linear → flat) */}
        <path
          d={path}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Midpoint of the ramp (open dot) */}
        <circle
          cx={xScale(midV)}
          cy={yScale(midF)}
          r={2}
          className="fill-background stroke-primary"
          strokeWidth={1.5}
        />

        {/* Min/Max knee points (filled dots) */}
        <circle
          cx={xScale(loVW)}
          cy={yScale(loFS)}
          r={3.5}
          className="fill-primary"
        >
          <title>{`min: ${fmt(loFS)}px @ ${loVW}px`}</title>
        </circle>
        <circle
          cx={xScale(hiVW)}
          cy={yScale(hiFS)}
          r={3.5}
          className="fill-primary"
        >
          <title>{`max: ${fmt(hiFS)}px @ ${hiVW}px`}</title>
        </circle>

        {/* X-axis tick labels */}
        {xTicks.map((v) => (
          <text
            key={`x-${v}`}
            x={xScale(v)}
            y={padT + plotH + 12}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize={8}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {v}
          </text>
        ))}

        {/* Y-axis tick labels */}
        <text
          x={padL - 4}
          y={yScale(loFS) + 3}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={8}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {fmt(loFS)}
        </text>
        <text
          x={padL - 4}
          y={yScale(hiFS) + 3}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={8}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {fmt(hiFS)}
        </text>

        {/* Axis title */}
        <text
          x={(padL + W - padR) / 2}
          y={H - 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={8}
        >
          viewport width →
        </text>
      </svg>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function FluidTypographyCalculator() {
  // ── State: inputs ─────────────────────────────────────────────────────
  const [minFS, setMinFS] = useState(16);
  const [maxFS, setMaxFS] = useState(32);
  const [minVW, setMinVW] = useState(320);
  const [maxVW, setMaxVW] = useState(1200);
  const [unit, setUnit] = useState<Unit>("rem");
  const [rootFontSize, setRootFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("system-ui, sans-serif");
  const [previewText, setPreviewText] = useState(
    "The quick brown fox jumps over the lazy dog",
  );

  // ── State: UI ─────────────────────────────────────────────────────────
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [themeColors, setThemeColors] = useState<ThemeColors | null>(null);

  // Debounced inputs that feed the iframe srcdoc rebuild.
  const [debounced, setDebounced] = useState({
    text: previewText,
    family: fontFamily,
    fullClamp: "clamp(1rem, 0.64rem + 1.82vw, 2rem)",
  });

  const copyTimerRef = useRef<number | null>(null);

  // ── Derived: clamp parameters & CSS strings ───────────────────────────
  const params = useMemo(
    () => computeClamp(minFS, maxFS, minVW, maxVW, unit, rootFontSize),
    [minFS, maxFS, minVW, maxVW, unit, rootFontSize],
  );

  const cssRule = `font-size: ${params.fullClamp};`;
  const cssFull = `font-family: ${fontFamily};\nfont-size: ${params.fullClamp};`;

  const maxFSLowerThanMin = maxFS < minFS;
  const maxVWNotGreater = maxVW <= minVW;
  const configInvalid = maxFSLowerThanMin || maxVWNotGreater;

  // ── Effect: track theme color changes (for iframe styling) ────────────
  // iframes are isolated documents — they don't inherit CSS variables from
  // the parent. We read the resolved values of --background / --foreground
  // / --muted-foreground / --border from the root element and inject them
  // explicitly into each iframe's srcdoc. A MutationObserver keeps them in
  // sync when the user toggles between light/dark theme.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const read = () => {
      const cs = getComputedStyle(root);
      const bg = cs.getPropertyValue("--background").trim();
      const fg = cs.getPropertyValue("--foreground").trim();
      const muted = cs.getPropertyValue("--muted-foreground").trim();
      const border = cs.getPropertyValue("--border").trim();
      if (bg && fg) {
        setThemeColors({
          bg,
          fg,
          muted: muted || fg,
          border: border || muted || fg,
        });
      }
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // ── Effect: debounce iframe srcdoc rebuild (~200ms) ───────────────────
  // Rebuilding 6 iframes on every keystroke is wasteful and flickery; we
  // debounce so rapid slider drags / typing only trigger one rebuild.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced({
        text: previewText,
        family: fontFamily,
        fullClamp: params.fullClamp,
      });
    }, IFRAME_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [previewText, fontFamily, params.fullClamp]);

  // ── Effect: cleanup copy-confirmation timer on unmount ────────────────
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  // ── Callback: build the srcdoc for a given viewport width ─────────────
  const buildSrcdoc = useCallback(
    (V: number): string => {
      const bg = themeColors?.bg || "#ffffff";
      const fg = themeColors?.fg || "#0a0a0a";
      const muted = themeColors?.muted || "#888888";
      const safeFamily = debounced.family || "system-ui, sans-serif";
      const safeClamp = debounced.fullClamp || "16px";
      const safeText = debounced.text.length > 0 ? debounced.text : " ";
      const text = escapeHtml(safeText);
      // The iframe's layout width is set to V (via inline style), so 1vw
      // inside this document resolves to V/100 px — matching the simulated
      // viewport exactly. White-space: nowrap + overflow: hidden on body
      // means we just see the start of the text at its true rendered size.
      return [
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>",
        "*{margin:0;padding:0;box-sizing:border-box;}",
        `html,body{background:${bg};color:${fg};}`,
        `body{font-family:${safeFamily};padding:8px 10px;overflow:hidden;white-space:nowrap;}`,
        `.t{font-size:${safeClamp};line-height:1.25;}`,
        `.rule{color:${muted};font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;}`,
        "</style></head><body>",
        `<div class=\"t\">${text}</div>`,
        "</body></html>",
      ].join("");
    },
    [themeColors, debounced],
  );

  // ── Callback: copy handler ────────────────────────────────────────────
  const handleCopy = useCallback(
    async (which: CopyTarget) => {
      const text =
        which === "clamp"
          ? params.fullClamp
          : which === "rule"
            ? cssRule
            : cssFull;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // clipboard unavailable in insecure contexts — silently ignore
        return;
      }
      setCopied(which);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(null);
        copyTimerRef.current = null;
      }, COPY_CONFIRM_MS);
    },
    [params.fullClamp, cssRule, cssFull],
  );

  // ── Callback: apply a preset ──────────────────────────────────────────
  const applyPreset = useCallback((p: Preset) => {
    setMinFS(p.minFS);
    setMaxFS(p.maxFS);
    setMinVW(p.minVW);
    setMaxVW(p.maxVW);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Type className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight">
            Fluid Typography Calculator
          </h3>
          <p className="text-xs text-muted-foreground">
            Generate{" "}
            <code className="font-mono text-foreground/80">clamp()</code> CSS
            for fluid type that scales smoothly between viewports
          </p>
        </div>
      </div>

      {/* ─── Presets row ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3.5" />
          Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const active =
              p.minFS === minFS &&
              p.maxFS === maxFS &&
              p.minVW === minVW &&
              p.maxVW === maxVW;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                aria-pressed={active}
                title={`${p.minFS}→${p.maxFS}px · ${p.minVW}→${p.maxVW}vw`}
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                )}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Main grid: controls (left) · output + chart (right) ──────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* ═══ LEFT: Controls ═══ */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Controls
          </span>

          <SliderInput
            id="ftc-min-fs"
            label="Min font size"
            value={minFS}
            onChange={setMinFS}
            min={8}
            max={96}
            step={1}
            unit="px"
            icon={<Minimize2 className="size-3" />}
          />
          <SliderInput
            id="ftc-max-fs"
            label="Max font size"
            value={maxFS}
            onChange={setMaxFS}
            min={8}
            max={160}
            step={1}
            unit="px"
            icon={<Maximize2 className="size-3" />}
            invalid={maxFSLowerThanMin}
            hint={maxFSLowerThanMin ? "Must be ≥ min font size" : undefined}
          />
          <SliderInput
            id="ftc-min-vw"
            label="Min viewport"
            value={minVW}
            onChange={setMinVW}
            min={240}
            max={1200}
            step={10}
            unit="px"
            icon={<Smartphone className="size-3" />}
          />
          <SliderInput
            id="ftc-max-vw"
            label="Max viewport"
            value={maxVW}
            onChange={setMaxVW}
            min={600}
            max={2560}
            step={10}
            unit="px"
            icon={<Monitor className="size-3" />}
            invalid={maxVWNotGreater}
            hint={maxVWNotGreater ? "Must be > min viewport" : undefined}
          />

          {/* Unit + root font size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="ftc-unit"
                className="text-xs text-muted-foreground"
              >
                Output unit
              </Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                <SelectTrigger id="ftc-unit" size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rem">rem (preferred)</SelectItem>
                  <SelectItem value="px">px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="ftc-root"
                className="text-xs text-muted-foreground"
              >
                Root font size
              </Label>
              <Input
                id="ftc-root"
                type="number"
                min={1}
                max={64}
                step={1}
                value={rootFontSize}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!Number.isNaN(n)) setRootFontSize(clampNum(n, 1, 64));
                }}
                disabled={unit === "px"}
                className="h-8 font-mono text-xs"
                aria-describedby="ftc-root-help"
              />
              <p
                id="ftc-root-help"
                className="text-[10px] text-muted-foreground"
              >
                px → rem divisor
              </p>
            </div>
          </div>

          {/* Font family */}
          <div className="space-y-1.5">
            <Label
              htmlFor="ftc-family"
              className="text-xs text-muted-foreground"
            >
              Font family
            </Label>
            <Input
              id="ftc-family"
              type="text"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="h-8 font-mono text-xs"
              spellCheck={false}
            />
          </div>

          {/* Preview text */}
          <div className="space-y-1.5">
            <Label
              htmlFor="ftc-preview"
              className="text-xs text-muted-foreground"
            >
              Preview text
            </Label>
            <Input
              id="ftc-preview"
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="h-8 text-xs"
              spellCheck={false}
              maxLength={200}
            />
          </div>
        </div>

        {/* ═══ RIGHT: Generated CSS + Curve chart ═══ */}
        <div className="space-y-3">
          {/* Generated CSS block */}
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Generated CSS
              </span>
              {configInvalid ? (
                <span className="text-[10px] font-medium text-destructive">
                  invalid config
                </span>
              ) : null}
            </div>

            {/* Formula breakdown */}
            <div className="space-y-1 rounded-lg bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed">
              <div className="text-muted-foreground">
                <span className="text-foreground/70">slope</span>{" "}
                <span className="text-primary">B</span> = (maxFS − minFS) ÷
                (maxVW − minVW)
              </div>
              <div className="pl-3 text-foreground/80">
                = ({fmt(maxFS)} − {fmt(minFS)}) ÷ ({fmt(maxVW)} −{" "}
                {fmt(minVW)}) ={" "}
                <span className="text-primary">{fmt(params.B, 4)}</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-foreground/70">vw coef</span>{" "}
                <span className="text-primary">R</span> = 100 × B ={" "}
                <span className="text-primary">{fmt(params.R, 3)}</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-foreground/70">intercept</span>{" "}
                <span className="text-primary">S</span> = minFS − B × minVW
              </div>
              <div className="pl-3 text-foreground/80">
                = {fmt(minFS)} − {fmt(params.B, 4)} × {fmt(minVW)} ={" "}
                <span className="text-primary">
                  {fmt(params.S, 3)}
                  {unit === "rem" ? "rem" : "px"}
                </span>
              </div>
            </div>

            {/* Final CSS output */}
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
              <code>
                <span className="text-muted-foreground">font-size: </span>
                <span className="font-semibold text-primary">clamp</span>
                <span className="text-foreground/90">{"("}</span>
                <span className="text-foreground/80">{params.minStr}</span>
                <span className="text-muted-foreground">, </span>
                <span className="text-foreground/80">
                  {params.preferredStr}
                </span>
                <span className="text-muted-foreground">, </span>
                <span className="text-foreground/80">{params.maxStr}</span>
                <span className="text-foreground/90">{")"}</span>
                <span className="text-muted-foreground">;</span>
              </code>
            </pre>

            {/* Copy buttons */}
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy("clamp")}
                aria-label="Copy clamp() value"
                className="flex-1 min-w-[100px]"
              >
                {copied === "clamp" ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied === "clamp" ? "Copied" : "clamp()"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy("rule")}
                aria-label="Copy CSS rule"
                className="flex-1 min-w-[100px]"
              >
                {copied === "rule" ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied === "rule" ? "Copied" : "CSS rule"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy("full")}
                aria-label="Copy full rule with font family"
                className="flex-1 min-w-[100px]"
              >
                {copied === "full" ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied === "full" ? "Copied" : "Full rule"}
              </Button>
            </div>
          </div>

          {/* Curve chart */}
          <CurveChart
            minFS={minFS}
            maxFS={maxFS}
            minVW={minVW}
            maxVW={maxVW}
            invalid={configInvalid}
          />
        </div>
      </div>

      {/* ─── Preview strip — the star ─────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Monitor className="size-3.5" />
            Live preview · {PREVIEW_VIEWPORTS.length} viewports
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            scroll
            <ChevronRight className="size-3" />
          </span>
        </div>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          role="group"
          aria-label="Preview at multiple viewport widths"
        >
          {PREVIEW_VIEWPORTS.map((V) => {
            const fs = fontSizeAtV(V, minFS, maxFS, minVW, maxVW);
            const isMin = V <= minVW;
            const isMax = V >= maxVW;
            const inRamp = !isMin && !isMax;
            return (
              <div
                key={V}
                className="flex-shrink-0 w-[260px] space-y-1.5"
              >
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-mono font-medium text-foreground">
                    @ {V}px
                  </span>
                  <span
                    className={cn(
                      "font-mono",
                      isMin && "text-amber-500",
                      isMax && "text-emerald-500",
                      inRamp && "text-primary",
                    )}
                  >
                    → {fmt(fs)}px
                  </span>
                </div>
                <div
                  className="relative h-[70px] w-[260px] overflow-hidden rounded-lg border border-border bg-background"
                  aria-hidden="true"
                >
                  {/* The iframe's layout width = V, so 1vw resolves to V/100 px
                      inside the document — exactly the simulated viewport. */}
                  <iframe
                    srcDoc={buildSrcdoc(V)}
                    title={`Preview at ${V}px viewport width`}
                    className="absolute left-0 top-0 border-0"
                    style={{ width: `${V}px`, height: "70px" }}
                    scrolling="no"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Each card is a real{" "}
          <code className="font-mono">&lt;iframe&gt;</code> at that exact
          pixel width, so <code className="font-mono">vw</code> resolves
          correctly and the rendered glyphs are true to size.{" "}
          <span className="text-amber-500">Amber</span> = at min (clamped
          flat), <span className="text-primary">primary</span> = in ramp,{" "}
          <span className="text-emerald-500">emerald</span> = at max.
        </p>
      </div>
    </div>
  );
}
