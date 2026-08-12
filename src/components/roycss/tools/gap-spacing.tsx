"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import {
  AlignHorizontalSpaceBetween,
  Check,
  Copy,
  Link,
  MoveHorizontal,
  Ruler,
  Sparkles,
  Table as TableIcon,
  Unlink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/**
 * GapSpacingCalculator — visual CSS spacing calculator for the RoyCSS platform.
 *
 * Five spacing systems:
 *   - 8px grid (4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96)
 *   - 4px grid (2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64)
 *   - Modular scale (base × ratio^n, ratios: 1.2 / 1.25 / 1.333 / 1.5 / 1.618)
 *   - Tailwind defaults (0…32 spacing tokens, ×0.25rem)
 *   - Custom (base + linear step)
 *
 * Tools:
 *   - Gap calculator: row + column gap with link toggle, flex-wrap preview,
 *     `gap:` shorthand OR `row-gap` / `column-gap` longhand output.
 *   - Margin/padding shorthand calculator: 4-side inputs with a box-model
 *     arrow diagram and smart 1/2/3/4-value collapsing (T R B L clockwise).
 *   - Spacing scale table: every value of the selected system with its
 *     px value, rem equivalent (at the chosen root font size), and a
 *     proportional visual bar; click a row to copy `gap: Npx;` or
 *     `margin: Npx;`.
 *
 * Self-contained, semantic-theme-colored, no indigo/blue, TS strict.
 * NOT wired into the app router — surfaced by the RoyCSS tool index.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

type SystemId = "grid8" | "grid4" | "modular" | "tailwind" | "custom";
type BoxKind = "margin" | "padding";
type CopyKind = "gap" | "margin";
type BorderSide = "top" | "right" | "bottom" | "left";

interface Sides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ScaleRow {
  label: string;
  px: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SYSTEMS: { id: SystemId; label: string; hint: string }[] = [
  { id: "grid8", label: "8px grid", hint: "4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96" },
  { id: "grid4", label: "4px grid", hint: "2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64" },
  { id: "modular", label: "Modular scale", hint: "base × ratio^n (5 ratios)" },
  { id: "tailwind", label: "Tailwind defaults", hint: "0…32 tokens (×0.25rem)" },
  { id: "custom", label: "Custom", hint: "base + linear step" },
];

const RATIOS: { value: string; label: string }[] = [
  { value: "1.2", label: "1.200 · minor third" },
  { value: "1.25", label: "1.250 · major third" },
  { value: "1.333", label: "1.333 · perfect fourth" },
  { value: "1.5", label: "1.500 · perfect fifth" },
  { value: "1.618", label: "1.618 · golden ratio" },
];

const GRID8_VALUES: number[] = [4, 8, 12, 16, 24, 32, 48, 64, 96];
const GRID4_VALUES: number[] = [2, 4, 8, 12, 16, 20, 24, 32, 48, 64];
const TAILWIND_TOKENS: number[] = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32,
];
/** 1 Tailwind spacing unit = 4px (= 0.25rem at a 16px root font size). */
const TAILWIND_UNIT_PX = 4;
const MODULAR_STEPS = 12;
const CUSTOM_STEPS = 12;

const GAP_MAX = 80;
const BOX_MAX = 96;
/** Cap displayed thickness in the box-model diagram so extreme values still fit. */
const DIAGRAM_CAP = 60;

const DEFAULT_ROOT = 16;
const DEFAULT_SYSTEM: SystemId = "grid8";
const DEFAULT_RATIO = "1.25";
const DEFAULT_MOD_BASE = 16;
const DEFAULT_CUSTOM_BASE = 8;
const DEFAULT_CUSTOM_STEP = 8;

const DEFAULT_GAP_ROW = 16;
const DEFAULT_GAP_COL = 16;
const DEFAULT_SIDES: Sides = { top: 16, right: 24, bottom: 16, left: 24 };

// ─── Helpers ────────────────────────────────────────────────────────────────

const clampNonNeg = (n: number, max: number): number => {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.round(n)));
};

const parseNum = (s: string, max: number): number =>
  clampNonNeg(parseInt(s, 10) || 0, max);

const clampRoot = (n: number): number => {
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_ROOT;
  return Math.max(8, Math.min(32, Math.round(n)));
};

const pxToRem = (px: number, root: number): string => {
  if (px === 0) return "0";
  const rem = Math.round((px / root) * 1000) / 1000;
  return `${rem}rem`;
};

/** 4-side shorthand with 1/2/3/4 value collapsing (T R B L clockwise). */
const sidesToShorthand = (prefix: string, s: Sides): string => {
  const { top, right, bottom, left } = s;
  if (top === right && right === bottom && bottom === left)
    return `${prefix}: ${top}px;`;
  if (top === bottom && right === left)
    return `${prefix}: ${top}px ${right}px;`;
  if (right === left)
    return `${prefix}: ${top}px ${right}px ${bottom}px;`;
  return `${prefix}: ${top}px ${right}px ${bottom}px ${left}px;`;
};

const buildScale = (
  system: SystemId,
  ratio: string,
  modBase: number,
  customBase: number,
  customStep: number,
): ScaleRow[] => {
  switch (system) {
    case "grid8":
      return GRID8_VALUES.map((px) => ({ label: String(px), px }));
    case "grid4":
      return GRID4_VALUES.map((px) => ({ label: String(px), px }));
    case "tailwind":
      return TAILWIND_TOKENS.map((t) => ({
        label: String(t),
        px: Math.round(t * TAILWIND_UNIT_PX),
      }));
    case "modular": {
      const r = parseFloat(ratio);
      const rows: ScaleRow[] = [];
      for (let i = 0; i < MODULAR_STEPS; i++) {
        rows.push({ label: `s${i}`, px: Math.round(modBase * Math.pow(r, i)) });
      }
      return rows;
    }
    case "custom": {
      const rows: ScaleRow[] = [];
      for (let i = 0; i < CUSTOM_STEPS; i++) {
        rows.push({ label: `s${i}`, px: customBase + i * customStep });
      }
      return rows;
    }
    default:
      return [];
  }
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
  label = "Copy",
  copiedLabel = "Copied!",
  className,
}: {
  copied: boolean;
  onCopy: () => void;
  label?: string;
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

function SliderRow({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
  trailing,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (n: number) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[11px] text-muted-foreground">
          {label}
        </Label>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              id={id}
              type="number"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(parseNum(e.target.value, max))}
              className="h-7 w-20 pr-7 text-right font-mono text-xs"
            />
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              {unit}
            </span>
          </div>
          {trailing}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(arr) => onChange(arr[0] ?? 0)}
        className="py-1"
      />
    </div>
  );
}

/** Position classes for the four directional side-value tags on the diagram. */
const SIDE_TAG_POS: Record<BorderSide, string> = {
  top: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
  right: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
  bottom: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2",
  left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
};

function SideTag({
  side,
  arrow,
  value,
  className,
}: {
  side: BorderSide;
  arrow: string;
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-10 rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] tabular-nums shadow-sm",
        SIDE_TAG_POS[side],
        className,
      )}
    >
      {arrow} {value}px
    </span>
  );
}

/**
 * Box-model diagram showing the four side values with directional arrows.
 * The outer zone is the margin/padding area (amber for margin, cyan for
 * padding); the inner rounded box represents the content. Displayed
 * thickness is capped at `DIAGRAM_CAP` so extreme values still fit.
 */
function BoxModelDiagram({ sides, kind }: { sides: Sides; kind: BoxKind }) {
  const t = Math.min(sides.top, DIAGRAM_CAP);
  const r = Math.min(sides.right, DIAGRAM_CAP);
  const b = Math.min(sides.bottom, DIAGRAM_CAP);
  const l = Math.min(sides.left, DIAGRAM_CAP);

  const outerClass =
    kind === "margin"
      ? "bg-amber-500/10 border-amber-500/40"
      : "bg-cyan-500/10 border-cyan-500/40";
  const labelClass =
    kind === "margin"
      ? "text-amber-700 dark:text-amber-300"
      : "text-cyan-700 dark:text-cyan-300";

  // Scale displayed thickness into a percentage inset of the panel.
  const pct = (v: number) => `${(v / (DIAGRAM_CAP * 2)) * 100}%`;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[240px]">
      {/* Outer (margin/padding) zone */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg border-2 border-dashed",
          outerClass,
        )}
      />
      {/* Inner content box */}
      <div
        className="absolute rounded-md border border-primary/60 bg-primary/15"
        style={{
          top: pct(t),
          right: pct(r),
          bottom: pct(b),
          left: pct(l),
        }}
      />
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          content
        </span>
      </div>
      {/* Side value tags */}
      <SideTag side="top" arrow="↑" value={sides.top} className={labelClass} />
      <SideTag side="right" arrow="→" value={sides.right} className={labelClass} />
      <SideTag side="bottom" arrow="↓" value={sides.bottom} className={labelClass} />
      <SideTag side="left" arrow="←" value={sides.left} className={labelClass} />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function GapSpacingCalculator() {
  // System + scale parameters
  const [system, setSystem] = useState<SystemId>(DEFAULT_SYSTEM);
  const [ratio, setRatio] = useState<string>(DEFAULT_RATIO);
  const [modBase, setModBase] = useState<number>(DEFAULT_MOD_BASE);
  const [customBase, setCustomBase] = useState<number>(DEFAULT_CUSTOM_BASE);
  const [customStep, setCustomStep] = useState<number>(DEFAULT_CUSTOM_STEP);

  // Root font size (drives rem column in the scale table)
  const [root, setRoot] = useState<number>(DEFAULT_ROOT);

  // Gap calculator state
  const [rowGap, setRowGap] = useState<number>(DEFAULT_GAP_ROW);
  const [colGap, setColGap] = useState<number>(DEFAULT_GAP_COL);
  const [linkGap, setLinkGap] = useState<boolean>(true);
  const [longhandGap, setLonghandGap] = useState<boolean>(false);

  // Margin / Padding calculator state
  const [boxKind, setBoxKind] = useState<BoxKind>("margin");
  const [sides, setSides] = useState<Sides>(DEFAULT_SIDES);
  const [linkSides, setLinkSides] = useState<boolean>(false);

  // Scale table copy mode + per-row flash
  const [copyKind, setCopyKind] = useState<CopyKind>("gap");
  const [copiedRowPx, setCopiedRowPx] = useState<number | null>(null);
  const rowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (rowTimerRef.current) clearTimeout(rowTimerRef.current);
    };
  }, []);

  // Copy hooks for the two generated CSS outputs
  const [gapCopied, gapCopy] = useCopyConfirmation();
  const [boxCopied, boxCopy] = useCopyConfirmation();

  // Derived scale + max for bar widths
  const scale = useMemo(
    () => buildScale(system, ratio, modBase, customBase, customStep),
    [system, ratio, modBase, customBase, customStep],
  );
  const maxScalePx = useMemo(
    () => scale.reduce((m, r) => (r.px > m ? r.px : m), 0),
    [scale],
  );

  // Derived gap CSS (shorthand or longhand)
  const gapCss = useMemo(() => {
    if (longhandGap) {
      if (rowGap === colGap) return `gap: ${rowGap}px;`;
      return `row-gap: ${rowGap}px;\ncolumn-gap: ${colGap}px;`;
    }
    if (rowGap === colGap) return `gap: ${rowGap}px;`;
    return `gap: ${rowGap}px ${colGap}px;`;
  }, [rowGap, colGap, longhandGap]);

  // Derived margin/padding shorthand
  const boxCss = useMemo(
    () => sidesToShorthand(boxKind, sides),
    [boxKind, sides],
  );

  // ─── Handlers ────────────────────────────────────────────────────────────

  const updateRowGap = useCallback(
    (v: number) => {
      setRowGap(v);
      if (linkGap) setColGap(v);
    },
    [linkGap],
  );

  const updateColGap = useCallback(
    (v: number) => {
      setColGap(v);
      if (linkGap) setRowGap(v);
    },
    [linkGap],
  );

  const updateSide = useCallback(
    (side: BorderSide, value: number) => {
      setSides((prev) => {
        if (linkSides) {
          return { top: value, right: value, bottom: value, left: value };
        }
        return { ...prev, [side]: value };
      });
    },
    [linkSides],
  );

  const copyRowCss = useCallback(
    (px: number) => {
      const css = `${copyKind}: ${px}px;`;
      const flash = () => {
        setCopiedRowPx(px);
        if (rowTimerRef.current) clearTimeout(rowTimerRef.current);
        rowTimerRef.current = setTimeout(() => setCopiedRowPx(null), 2000);
      };
      try {
        void navigator.clipboard.writeText(css).then(flash, flash);
      } catch {
        flash();
      }
    },
    [copyKind],
  );

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
          <Ruler className="size-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold leading-tight text-foreground">
            Gap &amp; Spacing Calculator
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pick a spacing system, design{" "}
            <code className="font-mono text-foreground/80">gap</code>,{" "}
            <code className="font-mono text-foreground/80">margin</code>, and{" "}
            <code className="font-mono text-foreground/80">padding</code>, then
            copy the CSS.
          </p>
        </div>
      </motion.div>

      {/* ─── System selector + root font size ─────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="size-3.5" />
          Spacing system
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="gs-system"
              className="text-[11px] text-muted-foreground"
            >
              System
            </Label>
            <Select
              value={system}
              onValueChange={(v) => setSystem(v as SystemId)}
            >
              <SelectTrigger id="gs-system" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYSTEMS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-medium">{s.label}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground">
                      · {s.hint}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="gs-root"
              className="text-[11px] text-muted-foreground"
            >
              Root font size (drives rem column)
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative w-20 shrink-0">
                <Input
                  id="gs-root"
                  type="number"
                  min={8}
                  max={32}
                  step={1}
                  value={root}
                  onChange={(e) =>
                    setRoot(clampRoot(parseInt(e.target.value, 10)))
                  }
                  className="h-9 pr-7 text-right font-mono text-sm"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  px
                </span>
              </div>
              <Slider
                value={[root]}
                min={8}
                max={32}
                step={1}
                onValueChange={(arr) => setRoot(arr[0] ?? DEFAULT_ROOT)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* System-specific secondary controls */}
        {system === "modular" && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="gs-ratio"
                className="text-[11px] text-muted-foreground"
              >
                Ratio
              </Label>
              <Select value={ratio} onValueChange={setRatio}>
                <SelectTrigger id="gs-ratio" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATIOS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SliderRow
              id="gs-mod-base"
              label="Base"
              value={modBase}
              min={4}
              max={32}
              onChange={setModBase}
            />
          </div>
        )}

        {system === "custom" && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <SliderRow
              id="gs-custom-base"
              label="Base"
              value={customBase}
              min={0}
              max={32}
              onChange={setCustomBase}
            />
            <SliderRow
              id="gs-custom-step"
              label="Step"
              value={customStep}
              min={1}
              max={32}
              onChange={setCustomStep}
            />
          </div>
        )}
      </div>

      {/* ─── Gap calculator card ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <AlignHorizontalSpaceBetween className="size-3.5" />
            Gap calculator
          </span>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {rowGap === colGap ? `${rowGap}px` : `${rowGap} × ${colGap}px`}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Controls */}
          <div className="space-y-3">
            <SliderRow
              id="gs-row-gap"
              label="Row gap"
              value={rowGap}
              min={0}
              max={GAP_MAX}
              onChange={updateRowGap}
              trailing={
                <button
                  type="button"
                  onClick={() => setLinkGap((v) => !v)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md border transition-colors",
                    linkGap
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                  aria-label={
                    linkGap
                      ? "Unlink row and column gap"
                      : "Link row and column gap"
                  }
                  title={
                    linkGap
                      ? "Linked — row and column move together"
                      : "Unlinked — row and column are independent"
                  }
                >
                  {linkGap ? (
                    <Link className="size-3.5" />
                  ) : (
                    <Unlink className="size-3.5" />
                  )}
                </button>
              }
            />
            <SliderRow
              id="gs-col-gap"
              label="Column gap"
              value={colGap}
              min={0}
              max={GAP_MAX}
              onChange={updateColGap}
            />
            <label className="flex cursor-pointer items-center justify-between rounded-md border border-border/60 bg-background px-2.5 py-1.5">
              <span className="text-[11px] text-muted-foreground">
                Longhand output (row-gap / column-gap)
              </span>
              <Switch
                checked={longhandGap}
                onCheckedChange={setLonghandGap}
                aria-label="Toggle longhand gap output"
              />
            </label>
          </div>

          {/* Live preview */}
          <div className="space-y-2">
            <div className="text-[11px] text-muted-foreground">
              Live preview (flex-wrap)
            </div>
            <div
              className="flex min-h-[120px] max-w-[260px] flex-wrap content-start rounded-lg border border-border bg-background p-3"
              style={{
                rowGap: `${rowGap}px`,
                columnGap: `${colGap}px`,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex size-12 items-center justify-center rounded-md border border-primary/40 bg-primary/15 font-mono text-[11px] text-primary"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generated CSS */}
        <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Generated CSS
            </span>
            <CopyButton copied={gapCopied} onCopy={() => gapCopy(gapCss)} />
          </div>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground/90">
            <code>{gapCss}</code>
          </pre>
        </div>
      </div>

      {/* ─── Margin / Padding calculator card ───────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <MoveHorizontal className="size-3.5" />
            Margin / Padding shorthand
          </span>
          {/* Segmented control: margin | padding */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            {(["margin", "padding"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setBoxKind(k)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                  boxKind === k
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={boxKind === k}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Diagram */}
          <div>
            <BoxModelDiagram sides={sides} kind={boxKind} />
          </div>

          {/* Side controls */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {(["top", "right", "bottom", "left"] as const).map((side) => (
                <div key={side} className="space-y-1">
                  <Label
                    htmlFor={`gs-${side}`}
                    className="text-[10px] capitalize text-muted-foreground"
                  >
                    {side}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`gs-${side}`}
                      type="number"
                      min={0}
                      max={BOX_MAX}
                      step={1}
                      value={sides[side]}
                      onChange={(e) =>
                        updateSide(side, parseNum(e.target.value, BOX_MAX))
                      }
                      className="h-8 pr-8 text-right font-mono text-xs"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                      px
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-md border border-border/60 bg-background px-2.5 py-1.5">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {linkSides ? (
                  <Link className="size-3 text-primary" />
                ) : (
                  <Unlink className="size-3 text-muted-foreground" />
                )}
                Link all sides
              </span>
              <Switch
                checked={linkSides}
                onCheckedChange={setLinkSides}
                aria-label="Link all four sides together"
              />
            </label>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Shorthand collapses to 1 value (all equal), 2 values (vertical ·
              horizontal), 3 values (top · horizontal · bottom), or 4 values.
            </p>
          </div>
        </div>

        {/* Generated CSS */}
        <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Generated CSS
            </span>
            <CopyButton copied={boxCopied} onCopy={() => boxCopy(boxCss)} />
          </div>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground/90">
            <code>{boxCss}</code>
          </pre>
        </div>
      </div>

      {/* ─── Spacing scale table ────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <TableIcon className="size-3.5" />
            Spacing scale
            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
              {scale.length} steps
            </span>
          </span>
          {/* Copy-mode toggle */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            {(["gap", "margin"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setCopyKind(k)}
                className={cn(
                  "rounded-md px-2.5 py-0.5 font-mono text-[11px] transition-colors",
                  copyKind === k
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={copyKind === k}
              >
                {k}:
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-left">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Step</th>
                <th className="px-2.5 py-1.5 text-right font-semibold">px</th>
                <th className="px-2.5 py-1.5 text-right font-semibold">rem</th>
                <th className="px-2.5 py-1.5 font-semibold">Visual</th>
                <th className="w-8 px-2.5 py-1.5 text-right font-semibold" />
              </tr>
            </thead>
            <tbody>
              {scale.map((row) => {
                const widthPct =
                  maxScalePx > 0 ? (row.px / maxScalePx) * 100 : 0;
                const isCopied = copiedRowPx === row.px;
                return (
                  <tr
                    key={`${row.label}-${row.px}`}
                    onClick={() => copyRowCss(row.px)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        copyRowCss(row.px);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy ${copyKind} spacing ${row.label} (${row.px}px) to clipboard`}
                    className={cn(
                      "cursor-pointer border-t border-border/40 outline-none transition-colors focus-visible:bg-muted/40",
                      isCopied
                        ? "bg-emerald-500/10"
                        : "hover:bg-muted/40",
                    )}
                    title={`Click to copy ${copyKind}: ${row.px}px;`}
                  >
                    <td className="px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
                      {row.label}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-xs tabular-nums text-foreground">
                      {row.px}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {pxToRem(row.px, root)}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${widthPct}%` }}
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
            {copyKind}: Npx;
          </code>{" "}
          · rem values assume a {root}px root font size.
        </p>
      </div>
    </div>
  );
}

export default GapSpacingCalculator;
