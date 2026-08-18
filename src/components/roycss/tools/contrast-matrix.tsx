"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Grid2x2,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   COLOR MATH — WCAG CONTRAST RATIO
   Reference: W3C "Web Content Accessibility Guidelines (WCAG) 2.1",
   §1.4.3 Contrast (Minimum) and §1.4.6 Contrast (Enhanced).
   https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum

   The contrast ratio between two colors is:
       (L1 + 0.05) / (L2 + 0.05)
   where L1 ≥ L2 are the WCAG relative luminances of the two colors,
   each in [0, 1]. The result is in [1, 21].

   Relative luminance for an sRGB color:
       L = 0.2126·R' + 0.7152·G' + 0.0722·B'
   where R', G', B' are the gamma-decoded (linear) channel values,
   computed from the sRGB channel c ∈ [0, 1] as:
       c_linear = c ≤ 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ^ 2.4

   Sanity checks (verified by hand):
     • #ffffff vs #000000 → 21.00:1   (max contrast)
     • #000000 vs #ffffff → 21.00:1   (symmetric)
     • #777777 vs #ffffff → 4.48:1    (just under AA — classic example)
     • #000000 vs #000000 → 1.00:1    (min contrast, same color)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Parse a hex string (#rgb, #rgba, #rrggbb, #rrggbbaa) into an
 * [r, g, b] triple where each channel is in [0, 1]. Returns null if
 * the input is not a valid hex color.
 */
function parseHexToRgb01(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  } else if (h.length === 4) {
    // #rgba → expand + drop alpha
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  } else if (h.length === 8) {
    // #rrggbbaa → drop alpha
    h = h.slice(0, 6);
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/** Normalize any supported hex form to lowercase #rrggbb, or null. */
function normalizeHex(hex: string): string | null {
  const rgb = parseHexToRgb01(hex);
  if (!rgb) return null;
  const toByte = (c: number) =>
    Math.round(Math.max(0, Math.min(1, c)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toByte(rgb[0])}${toByte(rgb[1])}${toByte(rgb[2])}`;
}

/** sRGB channel value c ∈ [0, 1] → linear (gamma-decoded) value. */
function srgbToLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance for an sRGB color triple (each ∈ [0, 1]). */
function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
  );
}

/**
 * WCAG contrast ratio between two sRGB triples (each ∈ [0, 1]).
 * Returns a value in [1, 21]. Symmetric in its arguments.
 */
function contrastRatio(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const la = relativeLuminance(a[0], a[1], a[2]);
  const lb = relativeLuminance(b[0], b[1], b[2]);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface PaletteColor {
  id: string;
  hex: string;
  label: string;
}

/** WCAG conformance target the user is checking against. */
type WcagTarget = "AA" | "AAA" | "AALarge";

/**
 * Absolute WCAG band a ratio falls into, regardless of the chosen
 * target. Useful as a badge label so the user always sees the actual
 * accessibility tier of a pair.
 */
type WcagBand = "AAA" | "AA" | "AALarge" | "Fail";

/** Visual tint of a matrix cell — driven by the chosen target. */
type CellTint = "pass" | "warn" | "fail" | "diagonal";

interface ComputedColor {
  /** Original palette row. */
  color: PaletteColor;
  /** Normalized #rrggbb (lowercase) or null if invalid. */
  normalized: string | null;
  /** sRGB triple (each ∈ [0,1]) or null if invalid. */
  rgb: [number, number, number] | null;
}

interface MatrixCell {
  bg: ComputedColor;
  fg: ComputedColor;
  ratio: number | null; // null if either color invalid
  band: WcagBand | null;
  tint: CellTint;
  isDiagonal: boolean;
}

interface FailingPair {
  bg: ComputedColor;
  fg: ComputedColor;
  ratio: number;
  band: WcagBand;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const MIN_COLORS = 2;
const MAX_COLORS = 12;

/** Threshold (in :1) for each WCAG target. */
const TARGET_THRESHOLD: Record<WcagTarget, number> = {
  AA: 4.5,
  AAA: 7,
  AALarge: 3,
};

const TARGET_LABEL: Record<WcagTarget, string> = {
  AA: "AA (4.5:1)",
  AAA: "AAA (7:1)",
  AALarge: "AA Large (3:1)",
};

const NEW_ROW_PREFIX = "row-";

const DEFAULT_COLORS: PaletteColor[] = [
  { id: "default-bg", hex: "#ffffff", label: "Background" },
  { id: "default-text", hex: "#0f172a", label: "Text" },
  { id: "default-muted", hex: "#64748b", label: "Muted" },
  { id: "default-primary", hex: "#0d9488", label: "Primary" },
  { id: "default-surface", hex: "#f1f5f9", label: "Surface" },
  { id: "default-danger", hex: "#dc2626", label: "Danger" },
];

interface Preset {
  id: string;
  name: string;
  colors: PaletteColor[];
}

const PRESETS: Preset[] = [
  {
    id: "tailwind",
    name: "Tailwind default",
    colors: DEFAULT_COLORS.map((c) => ({ ...c })),
  },
  {
    id: "monochrome",
    name: "Monochrome",
    colors: [
      { id: "mono-bg", hex: "#ffffff", label: "White" },
      { id: "mono-100", hex: "#f3f4f6", label: "Gray 100" },
      { id: "mono-400", hex: "#9ca3af", label: "Gray 400" },
      { id: "mono-600", hex: "#4b5563", label: "Gray 600" },
      { id: "mono-800", hex: "#1f2937", label: "Gray 800" },
      { id: "mono-900", hex: "#111827", label: "Gray 900" },
    ],
  },
  {
    id: "brand",
    name: "Brand palette",
    colors: [
      { id: "brand-bg", hex: "#ffffff", label: "Background" },
      { id: "brand-text", hex: "#1a1a2e", label: "Text" },
      { id: "brand-primary", hex: "#0d9488", label: "Primary" },
      { id: "brand-accent", hex: "#f59e0b", label: "Accent" },
      { id: "brand-surface", hex: "#f8fafc", label: "Surface" },
      { id: "brand-muted", hex: "#64748b", label: "Muted" },
      { id: "brand-danger", hex: "#dc2626", label: "Danger" },
    ],
  },
  {
    id: "dark",
    name: "Dark theme",
    colors: [
      { id: "dark-bg", hex: "#0f172a", label: "Background" },
      { id: "dark-surface", hex: "#1e293b", label: "Surface" },
      { id: "dark-text", hex: "#f1f5f9", label: "Text" },
      { id: "dark-muted", hex: "#94a3b8", label: "Muted" },
      { id: "dark-primary", hex: "#14b8a6", label: "Primary" },
      { id: "dark-danger", hex: "#f87171", label: "Danger" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   PURE HELPERS — band / tint / formatting
   ═══════════════════════════════════════════════════════════════ */

/** Absolute WCAG band for a contrast ratio. */
function ratioToBand(ratio: number): WcagBand {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AALarge";
  return "Fail";
}

/**
 * Visual tint for a cell, derived from the ratio AND the chosen
 * WCAG target. The target determines the pass threshold; ratios
 * between 3 and the target are amber ("close, but not enough"),
 * and ratios below 3 are always rose ("fail").
 *
 * Examples:
 *   • target=AA (4.5), ratio=5.2  → pass  (emerald)
 *   • target=AAA (7), ratio=5.2   → warn  (amber, passes AA not AAA)
 *   • target=AAA (7), ratio=2.5   → fail  (rose)
 *   • target=AALarge (3), ratio=5  → pass (emerald)
 */
function ratioToTint(
  ratio: number,
  target: WcagTarget,
  isDiagonal: boolean,
): CellTint {
  if (isDiagonal) return "diagonal";
  if (ratio >= TARGET_THRESHOLD[target]) return "pass";
  if (ratio >= 3) return "warn";
  return "fail";
}

const TINT_CELL_CLASS: Record<CellTint, string> = {
  pass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  fail: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  diagonal: "bg-muted/50 text-muted-foreground",
};

const BAND_BADGE_CLASS: Record<WcagBand, string> = {
  AAA: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  AA: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  AALarge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Fail: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const BAND_BADGE_LABEL: Record<WcagBand, string> = {
  AAA: "AAA",
  AA: "AA",
  AALarge: "AA Lg",
  Fail: "Fail",
};

/** Inline-style background image for the diagonal (hatching). */
const DIAGONAL_HATCH =
  "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(128,128,128,0.18) 4px, rgba(128,128,128,0.18) 5px)";

/** Build the screen-reader / title text for a matrix cell. */
function formatBreakdown(
  bgLabel: string,
  bgHex: string,
  fgLabel: string,
  fgHex: string,
  ratio: number,
  band: WcagBand,
): string {
  return `${fgLabel || "Foreground"} (${fgHex}) on ${bgLabel || "Background"} (${bgHex}): ${ratio.toFixed(2)}:1 — ${BAND_BADGE_LABEL[band]}`;
}

/* ═══════════════════════════════════════════════════════════════
   COLOR SWATCH INPUT (interactive)
   ═══════════════════════════════════════════════════════════════ */

interface ColorRowProps {
  color: PaletteColor;
  index: number;
  canDelete: boolean;
  onChange: (patch: Partial<PaletteColor>) => void;
  onRemove: () => void;
}

function ColorRowInput({ color, index, canDelete, onChange, onRemove }: ColorRowProps) {
  // <input type="color"> requires a 7-char #rrggbb value
  const safeValue = normalizeHex(color.hex) ?? "#000000";
  const isValid = normalizeHex(color.hex) !== null;
  const labelId = `cm-color-label-${color.id}`;
  const hexId = `cm-color-hex-${color.id}`;

  return (
    <div className="flex items-center gap-2">
      {/* Swatch */}
      <div
        className={cn(
          "relative size-10 shrink-0 rounded-md border border-border overflow-hidden",
          "ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        )}
        style={{ background: isValid ? safeValue : "#e5e7eb" }}
      >
        <input
          type="color"
          value={safeValue}
          onChange={(e) => onChange({ hex: e.target.value })}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label={`Swatch for color ${index + 1}${color.label ? `: ${color.label}` : ""}`}
        />
      </div>

      {/* Hex + label */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <Input
          id={hexId}
          value={color.hex}
          onChange={(e) => onChange({ hex: e.target.value })}
          placeholder="#rrggbb"
          className={cn(
            "h-8 font-mono text-xs",
            !isValid && "border-rose-500/50 focus-visible:ring-rose-500/30",
          )}
          aria-label={`Hex code for color ${index + 1}`}
        />
        <Input
          id={labelId}
          value={color.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label (optional)"
          className="h-7 text-xs text-muted-foreground"
          aria-label={`Label for color ${index + 1}`}
        />
      </div>

      {/* Delete */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
        onClick={onRemove}
        disabled={!canDelete}
        aria-label={`Remove color ${index + 1}${color.label ? `: ${color.label}` : ""}`}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MATRIX CELL
   ═══════════════════════════════════════════════════════════════ */

interface MatrixCellViewProps {
  cell: MatrixCell;
  bgLabel: string;
  fgLabel: string;
}

function MatrixCellView({ cell, bgLabel, fgLabel }: MatrixCellViewProps) {
  const { ratio, band, tint, isDiagonal, bg, fg } = cell;

  // Invalid-color cell
  if (ratio === null || band === null) {
    return (
      <td
        className="border border-border w-16 h-16 text-center text-xs align-middle bg-muted/30 text-muted-foreground"
        title="Invalid color — cannot compute contrast"
      >
        <span aria-hidden="true">—</span>
        <span className="sr-only">Invalid color, cannot compute contrast</span>
      </td>
    );
  }

  const breakdown = formatBreakdown(
    bgLabel,
    bg.normalized ?? "",
    fgLabel,
    fg.normalized ?? "",
    ratio,
    band,
  );

  return (
    <td
      className={cn(
        "border border-border w-16 h-16 text-center text-xs align-middle p-0 relative",
        TINT_CELL_CLASS[tint],
      )}
      style={isDiagonal ? { backgroundImage: DIAGONAL_HATCH } : undefined}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            tabIndex={0}
            className="size-full w-full flex flex-col items-center justify-center gap-0.5 px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-default"
            aria-label={breakdown}
          >
            {/* Ratio number */}
            <span className="font-bold tabular-nums leading-none text-[11px]">
              {isDiagonal ? "1.00" : ratio.toFixed(2)}
            </span>
            {/* Mini "Aa" preview with actual bg/fg colors */}
            {!isDiagonal && (
              <span
                className="font-semibold text-[11px] leading-none rounded px-1 py-0.5"
                style={{ background: bg.normalized ?? undefined, color: fg.normalized ?? undefined }}
                aria-hidden="true"
              >
                Aa
              </span>
            )}
            {/* Band badge */}
            <span
              className={cn(
                "inline-flex items-center rounded-sm border px-1 py-px text-[8px] font-semibold leading-none uppercase tracking-wide",
                BAND_BADGE_CLASS[band],
              )}
              aria-hidden="true"
            >
              {BAND_BADGE_LABEL[band]}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[260px] text-left leading-relaxed"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="inline-block size-3 rounded-sm border border-white/20"
                style={{ background: bg.normalized ?? "#888" }}
                aria-hidden="true"
              />
              <span className="font-mono text-[10px]">
                bg: {bg.normalized ?? "?"} {bgLabel ? `(${bgLabel})` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block size-3 rounded-sm border border-white/20"
                style={{ background: fg.normalized ?? "#888" }}
                aria-hidden="true"
              />
              <span className="font-mono text-[10px]">
                fg: {fg.normalized ?? "?"} {fgLabel ? `(${fgLabel})` : ""}
              </span>
            </div>
            <div className="pt-1 border-t border-white/15">
              <span className="font-bold">{ratio.toFixed(2)}:1</span>
              <span className="ml-2 text-[10px] uppercase tracking-wide opacity-80">
                {BAND_BADGE_LABEL[band]}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
      {/* Native fallback for no-JS / mobile hover */}
      <span className="sr-only">{breakdown}</span>
    </td>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

/**
 * ContrastMatrix — takes a palette of N colors and renders an N×N
 * matrix showing the WCAG contrast ratio between every pair, color-
 * coded by the chosen conformance target (AA / AAA / AA Large).
 *
 * Complementary to the existing single-pair ContrastChecker: this
 * tool verifies EVERY text/background combination in a palette at
 * once, surfacing failing pairs as an actionable priority list.
 */
export function ContrastMatrix() {
  /* ─── State ─── */
  const [colors, setColors] = useState<PaletteColor[]>(() =>
    DEFAULT_COLORS.map((c) => ({ ...c })),
  );
  const [target, setTarget] = useState<WcagTarget>("AA");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedPairKey, setCopiedPairKey] = useState<string | null>(null);

  /* ─── Computed colors (normalize once per palette change) ─── */
  const computed: ComputedColor[] = useMemo(
    () =>
      colors.map((color) => {
        const normalized = normalizeHex(color.hex);
        const rgb = normalized ? parseHexToRgb01(normalized) : null;
        return { color, normalized, rgb };
      }),
    [colors],
  );

  /* ─── Matrix computation (N×N) ─── */
  const matrix = useMemo<MatrixCell[][]>(() => {
    return computed.map((bg, i) =>
      computed.map((fg, j): MatrixCell => {
        const isDiagonal = i === j;
        if (!bg.rgb || !fg.rgb) {
          return {
            bg,
            fg,
            ratio: null,
            band: null,
            tint: "diagonal",
            isDiagonal,
          };
        }
        const ratio = contrastRatio(bg.rgb, fg.rgb);
        const band = ratioToBand(ratio);
        const tint = ratioToTint(ratio, target, isDiagonal);
        return { bg, fg, ratio, band, tint, isDiagonal };
      }),
    );
  }, [computed, target]);

  /* ─── Summary stats + failing pairs ─── */
  const { summary, failingPairs } = useMemo(() => {
    let total = 0;
    let pass = 0;
    let fail = 0;
    const fails: FailingPair[] = [];
    const threshold = TARGET_THRESHOLD[target];

    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        const cell = matrix[i][j]!;
        if (cell.isDiagonal) continue; // skip diagonal — always 1.0
        if (cell.ratio === null || cell.band === null) continue;
        total++;
        if (cell.ratio >= threshold) {
          pass++;
        } else {
          fail++;
          if (!cell.isDiagonal) {
            fails.push({
              bg: cell.bg,
              fg: cell.fg,
              ratio: cell.ratio,
              band: cell.band,
            });
          }
        }
      }
    }

    // Sort failing pairs: worst ratio first
    fails.sort((a, b) => a.ratio - b.ratio);

    const compliancePct =
      total > 0 ? Math.round((pass / total) * 100) : 0;

    return {
      summary: {
        colors: colors.length,
        total,
        pass,
        fail,
        compliance: compliancePct,
      },
      failingPairs: fails,
    };
  }, [matrix, target, colors.length]);

  /* ─── Handlers ─── */
  const updateColor = useCallback(
    (id: string, patch: Partial<PaletteColor>) => {
      setColors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  const removeColor = useCallback((id: string) => {
    setColors((prev) => {
      if (prev.length <= MIN_COLORS) return prev;
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const addColor = useCallback(() => {
    setColors((prev) => {
      if (prev.length >= MAX_COLORS) return prev;
      return [
        ...prev,
        {
          id: `${NEW_ROW_PREFIX}${Date.now()}-${prev.length}`,
          hex: "#94a3b8",
          label: "",
        },
      ];
    });
  }, []);

  const loadPreset = useCallback((preset: Preset) => {
    setColors(preset.colors.map((c) => ({ ...c })));
  }, []);

  const resetDefaults = useCallback(() => {
    setColors(DEFAULT_COLORS.map((c) => ({ ...c })));
    setTarget("AA");
  }, []);

  const copyAllFailing = useCallback(async () => {
    if (failingPairs.length === 0) return;
    const lines = failingPairs.map(
      (p) =>
        `${p.fg.color.label || "Foreground"} on ${p.bg.color.label || "Background"}: ${p.ratio.toFixed(2)}:1 (Fail) — fg ${p.fg.normalized} · bg ${p.bg.normalized}`,
    );
    const text = [
      `Color Contrast Matrix — failing pairs (target: ${TARGET_LABEL[target]})`,
      `${failingPairs.length} pair(s) below ${TARGET_THRESHOLD[target]}:1`,
      "",
      ...lines,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1800);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [failingPairs, target]);

  const copyPair = useCallback(async (pair: FailingPair, key: string) => {
    const text = `${pair.fg.color.label || "Foreground"} (${pair.fg.normalized}) on ${pair.bg.color.label || "Background"} (${pair.bg.normalized}): ${pair.ratio.toFixed(2)}:1 (Fail)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPairKey(key);
      setTimeout(() => {
        setCopiedPairKey((cur) => (cur === key ? null : cur));
      }, 1800);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  const canAdd = colors.length < MAX_COLORS;
  const canRemove = colors.length > MIN_COLORS;

  /* ─── Render ─── */
  return (
    <div className="space-y-5">
      {/* Header / intro */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
          <Grid2x2 className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            Color Contrast Matrix
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Verify every text/background combination in your palette meets WCAG.
            Rows = background, columns = foreground.
          </p>
        </div>
      </div>

      {/* Palette input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Palette ({colors.length}/{MAX_COLORS})
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetDefaults}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {colors.map((color, idx) => (
            <ColorRowInput
              key={color.id}
              color={color}
              index={idx}
              canDelete={canRemove}
              onChange={(patch) => updateColor(color.id, patch)}
              onRemove={() => removeColor(color.id)}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addColor}
          disabled={!canAdd}
          className="w-full h-8 border-dashed text-xs"
        >
          <Plus className="size-3.5" />
          Add color{!canAdd && " (max reached)"}
        </Button>
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="size-3" />
          Presets
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => loadPreset(preset)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span className="flex -space-x-1">
                {preset.colors.slice(0, 4).map((c) => (
                  <span
                    key={c.id}
                    className="size-2.5 rounded-full border border-background"
                    style={{ background: normalizeHex(c.hex) ?? "#888" }}
                    aria-hidden="true"
                  />
                ))}
              </span>
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Target selector + legend */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="cm-target"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            WCAG target
          </Label>
          <Select value={target} onValueChange={(v) => setTarget(v as WcagTarget)}>
            <SelectTrigger id="cm-target" size="sm" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TARGET_LABEL) as WcagTarget[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TARGET_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground sm:ml-auto">
          <span className="font-semibold uppercase tracking-wider">Legend:</span>
          <LegendItem className="bg-emerald-500/30 border-emerald-500/40" label={`Pass (≥ ${TARGET_THRESHOLD[target]}:1)`} />
          <LegendItem className="bg-amber-500/30 border-amber-500/40" label="Close (≥ 3:1)" />
          <LegendItem className="bg-rose-500/30 border-rose-500/40" label="Fail (< 3:1)" />
          <LegendItem
            className="bg-muted/60 border-border"
            label="Same color"
            style={{ backgroundImage: DIAGONAL_HATCH }}
          />
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 text-xs">
        <span className="font-semibold text-foreground">{summary.colors} colors</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{summary.total} pairs</span>
        <span className="text-muted-foreground">·</span>
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3" />
          {summary.pass} pass
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="size-3" />
          {summary.fail} fail
        </span>
        <span className="text-muted-foreground">·</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            summary.compliance >= 80
              ? "text-emerald-600 dark:text-emerald-400"
              : summary.compliance >= 50
                ? "text-amber-600 dark:text-amber-400"
                : "text-rose-600 dark:text-rose-400",
          )}
        >
          {summary.compliance}% compliance
        </span>
      </div>

      {/* Failing pairs list */}
      {failingPairs.length > 0 ? (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="size-3.5" />
              Failing pairs ({failingPairs.length})
              <span className="text-rose-600/70 dark:text-rose-400/70 font-normal">
                · target {TARGET_LABEL[target]}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyAllFailing}
              className="h-7 text-xs border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300"
            >
              {copiedAll ? (
                <>
                  <Check className="size-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  Copy all
                </>
              )}
            </Button>
          </div>
          <ul className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
            {failingPairs.map((pair, idx) => {
              const key = `${pair.bg.color.id}-${pair.fg.color.id}-${idx}`;
              const isCopied = copiedPairKey === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => copyPair(pair, key)}
                    className="w-full flex items-center gap-2 rounded-md border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 px-2 py-1.5 text-left text-xs transition-colors group"
                    title="Click to copy this pair"
                    aria-label={`Copy failing pair: ${pair.fg.color.label || "foreground"} on ${pair.bg.color.label || "background"}, ${pair.ratio.toFixed(2)} to 1`}
                  >
                    {/* Swatch pair */}
                    <span className="flex shrink-0 overflow-hidden rounded border border-border">
                      <span
                        className="size-4"
                        style={{ background: pair.bg.normalized ?? "#888" }}
                        aria-hidden="true"
                      />
                      <span
                        className="size-4 flex items-center justify-center text-[8px] font-bold leading-none"
                        style={{
                          background: pair.bg.normalized ?? "#888",
                          color: pair.fg.normalized ?? "#fff",
                        }}
                        aria-hidden="true"
                      >
                        Aa
                      </span>
                    </span>
                    {/* Label + ratio */}
                    <span className="flex-1 min-w-0 truncate">
                      <span className="font-medium text-rose-700 dark:text-rose-300">
                        {pair.fg.color.label || "Foreground"}
                      </span>
                      <span className="text-muted-foreground"> on </span>
                      <span className="font-medium text-rose-700 dark:text-rose-300">
                        {pair.bg.color.label || "Background"}
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-rose-700 dark:text-rose-300 shrink-0">
                      {pair.ratio.toFixed(2)}:1
                    </span>
                    <Badge
                      variant="outline"
                      className="shrink-0 bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[9px] px-1 py-0"
                    >
                      Fail
                    </Badge>
                    <span className="shrink-0 text-muted-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400">
                      {isCopied ? (
                        <Check className="size-3" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>
            All {summary.total} pairs meet the {TARGET_LABEL[target]} target. Palette is accessible.
          </span>
        </div>
      )}

      {/* Matrix table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contrast matrix
          </Label>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Info className="size-3" />
            Rows = background · Columns = foreground
          </span>
        </div>

        <div className="rounded-lg border border-border overflow-auto max-h-[500px]">
          <table className="border-collapse">
            <caption className="sr-only">
              N by N contrast matrix showing the WCAG contrast ratio for every
              background (rows) and foreground (columns) pair in the palette.
              Currently checking {summary.colors} colors against the{" "}
              {TARGET_LABEL[target]} target. {summary.pass} of {summary.total}{" "}
              off-diagonal pairs pass; {summary.fail} fail.
            </caption>
            <thead>
              <tr>
                {/* Corner cell */}
                <th
                  scope="col"
                  className="sticky top-0 left-0 z-30 bg-card border border-border w-16 h-16 align-middle"
                >
                  <span className="flex flex-col items-center justify-center text-[9px] text-muted-foreground leading-tight gap-0.5">
                    <span>bg ＼ fg</span>
                  </span>
                </th>
                {/* Column headers = foreground colors */}
                {computed.map((fg, j) => (
                  <th
                    key={fg.color.id}
                    scope="col"
                    className="sticky top-0 z-20 bg-card border border-border w-16 h-16 align-bottom p-0"
                  >
                    <div className="flex flex-col items-center gap-0.5 pb-1">
                      <span
                        className="size-5 rounded border border-border shadow-sm"
                        style={{ background: fg.normalized ?? "#e5e7eb" }}
                        aria-hidden="true"
                      />
                      <span className="text-[9px] font-medium text-foreground truncate max-w-[58px] px-1 leading-tight">
                        {fg.color.label || `C${j + 1}`}
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground leading-none">
                        {fg.normalized ?? "?"}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => {
                const bg = computed[i]!;
                return (
                  <tr key={bg.color.id}>
                    {/* Row header = background color */}
                    <th
                      scope="row"
                      className="sticky left-0 z-20 bg-card border border-border w-16 h-16 align-middle p-0"
                    >
                      <div className="flex flex-col items-center gap-0.5 px-1">
                        <span
                          className="size-5 rounded border border-border shadow-sm"
                          style={{ background: bg.normalized ?? "#e5e7eb" }}
                          aria-hidden="true"
                        />
                        <span className="text-[9px] font-medium text-foreground truncate max-w-[58px] leading-tight">
                          {bg.color.label || `C${i + 1}`}
                        </span>
                        <span className="text-[8px] font-mono text-muted-foreground leading-none">
                          {bg.normalized ?? "?"}
                        </span>
                      </div>
                    </th>
                    {/* Cells */}
                    {row.map((cell, j) => (
                      <MatrixCellView
                        key={`${bg.color.id}-${computed[j]!.color.id}`}
                        cell={cell}
                        bgLabel={bg.color.label}
                        fgLabel={computed[j]!.color.label}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {colors.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Add at least {MIN_COLORS} colors to compute the matrix.
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LEGEND ITEM (tiny swatch + label, used in the legend row)
   ═══════════════════════════════════════════════════════════════ */

interface LegendItemProps {
  className: string;
  label: string;
  style?: React.CSSProperties;
}

function LegendItem({ className, label, style }: LegendItemProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={cn("inline-block size-3 rounded-sm border", className)}
        style={style}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
