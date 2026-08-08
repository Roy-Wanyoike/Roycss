"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Eye,
  Copy,
  Check,
  RefreshCw,
  Code2,
  AlertTriangle,
  CheckCircle2,
  Palette,
  LayoutGrid,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * ColorBlindnessSimulator — preview a color palette as it appears under
 * each of the eight common color-vision deficiencies.
 *
 * Simulation is done with SVG `<feColorMatrix>` filters (one per CVD
 * type) applied via CSS `filter: url(#cvd-<type>)`. The matrices are
 * the well-known LMS-conversion approximations popularised by
 * www.color-blindness.com and the Wickline.org palette tool.
 *
 * For the "Copy simulated palette" feature, the same matrices are
 * multiplied in JS so we can output the simulated hex values.
 *
 * Features
 *  - 5 color inputs (default to the RoyCSS theme colors: emerald,
 *    teal, amber, red, near-black).
 *  - 8 CVD types: Protanopia, Protanomaly, Deuteranopia,
 *    Deuteranomaly, Tritanopia, Tritanomaly, Achromatopsia,
 *    Achromatomaly.
 *  - Mode tabs: "Swatches" (original vs simulated comparison with
 *    hex values) and "UI Preview" (a card with text/background/button
 *    using the palette — rendered both normally and with the active
 *    CVD filter applied).
 *  - WCAG note: computes the contrast ratio for every unique color
 *    pair under the active CVD condition and lists which pairs fall
 *    below the WCAG AA threshold (4.5:1).
 *  - Copy simulated palette: outputs the 5 simulated hexes as a
 *    comma-separated string.
 *
 * Constraints: TS strict, no `any`, no console.log, memoized,
 * semantic theme tokens, responsive within max-w-2xl.
 */

// ─── Types ────────────────────────────────────────────────────────────────

type CvdType =
  | "protanopia"
  | "protanomaly"
  | "deuteranopia"
  | "deuteranomaly"
  | "tritanopia"
  | "tritanomaly"
  | "achromatopsia"
  | "achromatomaly";

type Mode = "swatches" | "ui";

interface CvdDef {
  value: CvdType;
  label: string;
  /** 3x3 RGB transformation matrix (row-major). */
  matrix: [number, number, number, number, number, number, number, number, number];
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────

/**
 * Default palette — five representative RoyCSS theme colors.
 * (emerald primary, teal accent, amber warning, red danger, dark foreground)
 */
const DEFAULT_PALETTE: string[] = [
  "#10b981",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#1f2937",
];

const PALETTE_LABELS: string[] = [
  "Primary",
  "Accent",
  "Warning",
  "Danger",
  "Foreground",
];

const CVD_TYPES: CvdDef[] = [
  {
    value: "protanopia",
    label: "Protanopia",
    matrix: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
    description: "No red cones — red appears as dark / black.",
  },
  {
    value: "protanomaly",
    label: "Protanomaly",
    matrix: [0.817, 0.183, 0, 0.333, 0.667, 0, 0, 0.125, 0.875],
    description: "Shifted red cones — reduced red sensitivity.",
  },
  {
    value: "deuteranopia",
    label: "Deuteranopia",
    matrix: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
    description: "No green cones — most common form of CVD.",
  },
  {
    value: "deuteranomaly",
    label: "Deuteranomaly",
    matrix: [0.8, 0.2, 0, 0.258, 0.742, 0, 0, 0.142, 0.858],
    description: "Shifted green cones — most common CVD overall.",
  },
  {
    value: "tritanopia",
    label: "Tritanopia",
    matrix: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
    description: "No blue cones — very rare.",
  },
  {
    value: "tritanomaly",
    label: "Tritanomaly",
    matrix: [0.967, 0.033, 0, 0, 0.733, 0.267, 0, 0.183, 0.817],
    description: "Shifted blue cones — rare.",
  },
  {
    value: "achromatopsia",
    label: "Achromatopsia",
    matrix: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
    description: "No color vision — total grayscale.",
  },
  {
    value: "achromatomaly",
    label: "Achromatomaly",
    matrix: [0.618, 0.32, 0.062, 0.163, 0.775, 0.062, 0.163, 0.32, 0.516],
    description: "Partial color vision — attenuated color.",
  },
];

const WCAG_AA_THRESHOLD = 4.5;
const COPY_CONFIRM_MS = 1500;

// ─── Color math ───────────────────────────────────────────────────────────

/** Parse a hex string into an [r, g, b] triple, each in [0, 255]. */
function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  } else if (h.length === 8) {
    h = h.slice(0, 6);
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert an [r, g, b] triple (0-255) to lowercase #rrggbb. */
function rgbToHex(r: number, g: number, b: number): string {
  const toByte = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c)))
      .toString(16)
      .padStart(2, "0");
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

/** Apply a 3x3 CVD matrix to an [r, g, b] triple (0-255). */
function applyMatrix(
  rgb: [number, number, number],
  m: CvdDef["matrix"],
): [number, number, number] {
  return [
    m[0] * rgb[0] + m[1] * rgb[1] + m[2] * rgb[2],
    m[3] * rgb[0] + m[4] * rgb[1] + m[5] * rgb[2],
    m[6] * rgb[0] + m[7] * rgb[1] + m[8] * rgb[2],
  ];
}

/** Simulate a single hex color under a CVD type. */
function simulateColor(hex: string, type: CvdType): string {
  const def = CVD_TYPES.find((t) => t.value === type);
  const rgb = hexToRgb(hex);
  if (!def || !rgb) return hex;
  return rgbToHex(...applyMatrix(rgb, def.matrix));
}

/** sRGB channel value c ∈ [0, 1] → linear (gamma-decoded) value. */
function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance for an sRGB triple (0-255). */
function relativeLuminance(rgb: [number, number, number]): number {
  return (
    0.2126 * srgbToLinear(rgb[0]) +
    0.7152 * srgbToLinear(rgb[1]) +
    0.0722 * srgbToLinear(rgb[2])
  );
}

/** WCAG contrast ratio between two hex colors (1-21). */
function contrastRatio(hexA: string, hexB: string): number {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return 1;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Build the 4x5 feColorMatrix `values` string from a 3x3 CVD matrix. */
function toSvgMatrix(m: CvdDef["matrix"]): string {
  return [
    m[0], m[1], m[2], 0, 0,
    m[3], m[4], m[5], 0, 0,
    m[6], m[7], m[8], 0, 0,
    0, 0, 0, 1, 0,
  ].join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────

export function ColorBlindnessSimulator() {
  const [palette, setPalette] = useState<string[]>(DEFAULT_PALETTE);
  const [activeType, setActiveType] = useState<CvdType>("deuteranopia");
  const [mode, setMode] = useState<Mode>("swatches");
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Clear copy timer on unmount ─────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  /* ── Update a single palette slot ────────────────────────────────── */
  const updateColor = useCallback((index: number, value: string) => {
    setPalette((prev) => {
      const next = prev.slice();
      next[index] = value;
      return next;
    });
  }, []);

  /* ── Simulated palette (memoized) ────────────────────────────────── */
  const simulatedPalette = useMemo(
    () => palette.map((hex) => simulateColor(hex, activeType)),
    [palette, activeType],
  );

  /* ── WCAG pair analysis ──────────────────────────────────────────── */
  const contrastResults = useMemo(() => {
    const failing: { a: number; b: number; ratio: number }[] = [];
    const passing: { a: number; b: number; ratio: number }[] = [];
    for (let i = 0; i < simulatedPalette.length; i++) {
      for (let j = i + 1; j < simulatedPalette.length; j++) {
        const ratio = contrastRatio(
          simulatedPalette[i]!,
          simulatedPalette[j]!,
        );
        const entry = { a: i, b: j, ratio: Math.round(ratio * 100) / 100 };
        if (ratio < WCAG_AA_THRESHOLD) {
          failing.push(entry);
        } else {
          passing.push(entry);
        }
      }
    }
    return { failing, passing, total: simulatedPalette.length };
  }, [simulatedPalette]);

  /* ── Copy ────────────────────────────────────────────────────────── */
  const handleCopy = useCallback(
    async (text: string) => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
      } catch {
        /* clipboard may be unavailable */
      }
      setCopied(true);
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = setTimeout(() => {
        setCopied(false);
        copiedTimerRef.current = null;
      }, COPY_CONFIRM_MS);
    },
    [],
  );

  const copySimulatedPalette = useCallback(() => {
    handleCopy(simulatedPalette.join(", "));
  }, [handleCopy, simulatedPalette]);

  const reset = useCallback(() => {
    setPalette(DEFAULT_PALETTE);
    setActiveType("deuteranopia");
    setMode("swatches");
  }, []);

  /* ── Active CVD definition (for the description + matrix) ────────── */
  const activeDef = useMemo(
    () => CVD_TYPES.find((t) => t.value === activeType) ?? CVD_TYPES[0]!,
    [activeType],
  );

  /* ── Filter URL (for inline style) ───────────────────────────────── */
  const filterStyle = useMemo<CSSProperties>(
    () => ({ filter: `url(#cvd-${activeType})` }),
    [activeType],
  );

  /* ── Generated CSS block ─────────────────────────────────────────── */
  const generatedCss = useMemo(() => {
    const lines: string[] = [];
    lines.push(`/* Simulated palette under ${activeDef.label} */`);
    PALETTE_LABELS.forEach((label, i) => {
      lines.push(
        `--${label.toLowerCase().replace(/\s/g, "-")}-simulated: ${simulatedPalette[i]};`,
      );
    });
    lines.push("");
    lines.push(`/* Apply to any element via SVG filter */`);
    lines.push(`.simulated {`);
    lines.push(`  filter: url(#cvd-${activeType});`);
    lines.push(`}`);
    return lines.join("\n");
  }, [activeDef, simulatedPalette, activeType]);

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden SVG with all 8 CVD filters */}
      <svg
        aria-hidden
        className="pointer-events-none absolute size-0"
        focusable="false"
      >
        <defs>
          {CVD_TYPES.map((t) => (
            <filter
              key={t.value}
              id={`cvd-${t.value}`}
              colorInterpolationFilters="sRGB"
            >
              <feColorMatrix type="matrix" values={toSvgMatrix(t.matrix)} />
            </filter>
          ))}
        </defs>
      </svg>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Eye className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Color Blindness Simulator
        </h3>
      </div>

      {/* Palette inputs */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Palette className="size-3" />
          Palette (5 colors)
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {palette.map((color, i) => (
            <div
              key={i}
              className="flex flex-col gap-1.5 rounded-md border border-border bg-background p-2"
            >
              <label
                htmlFor={`cbp-color-${i}`}
                className="text-[10px] font-medium text-muted-foreground"
              >
                {PALETTE_LABELS[i]}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id={`cbp-color-${i}`}
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="size-7 cursor-pointer rounded border border-border bg-background p-0"
                  aria-label={`${PALETTE_LABELS[i]} color`}
                />
                <Input
                  value={color}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="h-7 px-1.5 font-mono text-[11px]"
                  aria-label={`${PALETTE_LABELS[i]} hex value`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CVD type selector */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Color-vision deficiency
        </Label>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {CVD_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setActiveType(t.value)}
              className={cn(
                "rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                activeType === t.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={activeType === t.value}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">{activeDef.description}</p>
      </div>

      {/* Mode tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="swatches" className="gap-1 text-xs">
            <Square className="size-3" />
            Swatches
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-1 text-xs">
            <LayoutGrid className="size-3" />
            UI Preview
          </TabsTrigger>
        </TabsList>

        {/* Swatches mode */}
        <TabsContent value="swatches" className="m-0 mt-2">
          <div className="flex flex-col gap-2">
            {palette.map((color, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-border bg-card p-2"
              >
                <div className="flex flex-1 items-center gap-2">
                  <div
                    className="size-10 shrink-0 rounded-md border border-border"
                    style={{ background: color }}
                    aria-label={`Original ${PALETTE_LABELS[i]}: ${color}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">
                      Original
                    </span>
                    <span className="font-mono text-xs text-foreground">
                      {color}
                    </span>
                  </div>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex flex-1 items-center gap-2">
                  <div
                    className="size-10 shrink-0 rounded-md border border-border"
                    style={{ background: simulatedPalette[i] }}
                    aria-label={`Simulated ${PALETTE_LABELS[i]}: ${simulatedPalette[i]}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">
                      Simulated
                    </span>
                    <span className="font-mono text-xs text-foreground">
                      {simulatedPalette[i]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* UI Preview mode */}
        <TabsContent value="ui" className="m-0 mt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Original */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">
                Original
              </span>
              <PreviewCard palette={palette} />
            </div>
            {/* Simulated */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">
                Simulated ({activeDef.label})
              </span>
              <div style={filterStyle}>
                <PreviewCard palette={palette} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* WCAG note */}
      <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <AlertTriangle className="size-3" />
            WCAG contrast under {activeDef.label}
          </Label>
          <Badge
            variant={contrastResults.failing.length === 0 ? "secondary" : "destructive"}
            className={cn(
              "text-[10px]",
              contrastResults.failing.length === 0 &&
                "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
            )}
          >
            {contrastResults.failing.length === 0 ? (
              <>
                <CheckCircle2 className="mr-1 size-3" />
                All pass
              </>
            ) : (
              `${contrastResults.failing.length} fail`
            )}
          </Badge>
        </div>
        {contrastResults.failing.length > 0 ? (
          <ul className="flex flex-col gap-1 text-[11px] text-muted-foreground">
            {contrastResults.failing.map((r) => (
              <li key={`${r.a}-${r.b}`} className="flex items-center gap-2">
                <span
                  className="inline-block size-3 rounded border border-border"
                  style={{ background: simulatedPalette[r.a] }}
                />
                <span className="text-foreground/60">vs</span>
                <span
                  className="inline-block size-3 rounded border border-border"
                  style={{ background: simulatedPalette[r.b] }}
                />
                <span className="font-mono text-foreground">
                  {PALETTE_LABELS[r.a]} ↔ {PALETTE_LABELS[r.b]}:
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  {r.ratio.toFixed(2)}:1 (fails AA 4.5:1)
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
            All {contrastResults.total} colors meet the WCAG AA 4.5:1
            threshold under {activeDef.label}.
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Tested {contrastResults.failing.length + contrastResults.passing.length}{" "}
          unique color pairs. Threshold: WCAG 2.1 AA (4.5:1).
        </p>
      </div>

      {/* Reset + copy simulated palette */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="h-9 gap-1.5 text-xs"
        >
          <RefreshCw className="size-3.5" /> Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={copySimulatedPalette}
          className="h-9 gap-1.5 text-xs"
        >
          {copied ? (
            <>
              <Check className="size-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy simulated palette
            </>
          )}
        </Button>
      </div>

      {/* Generated CSS */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Code2 className="size-3" />
          Generated CSS
        </Label>
        <pre className="max-h-48 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground">
          <code>{generatedCss}</code>
        </pre>
      </div>
    </div>
  );
}

// ─── Preview card sub-component ───────────────────────────────────────────

interface PreviewCardProps {
  palette: string[];
}

/**
 * A small UI card that uses the palette for foreground, background,
 * button, border, and accent. Rendered twice in UI Preview mode —
 * once normally, once wrapped in a CVD SVG filter.
 */
function PreviewCard({ palette }: PreviewCardProps) {
  const [primary, accent, warning, danger, foreground] = palette;
  const cardStyle: CSSProperties = {
    background: "#ffffff",
    color: foreground ?? "#1f2937",
    borderColor: foreground ? `${foreground}22` : "#1f293722",
  };
  const btnPrimary: CSSProperties = { background: primary, color: "#ffffff" };
  const btnAccent: CSSProperties = { background: accent, color: "#ffffff" };
  const btnWarning: CSSProperties = { background: warning, color: "#1f2937" };
  const btnDanger: CSSProperties = { background: danger, color: "#ffffff" };

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-3 text-xs shadow-sm"
      style={cardStyle}
    >
      <div className="flex items-center gap-1.5">
        <div
          className="size-2.5 rounded-full"
          style={{ background: primary }}
        />
        <span className="font-semibold">Card title</span>
      </div>
      <p className="text-[11px] leading-snug opacity-80">
        Body copy uses the foreground color. Buttons below use each
        palette color so you can see contrast under simulation.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-[10px] font-medium"
          style={btnPrimary}
        >
          Primary
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-[10px] font-medium"
          style={btnAccent}
        >
          Accent
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-[10px] font-medium"
          style={btnWarning}
        >
          Warning
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-[10px] font-medium"
          style={btnDanger}
        >
          Danger
        </button>
      </div>
    </div>
  );
}
