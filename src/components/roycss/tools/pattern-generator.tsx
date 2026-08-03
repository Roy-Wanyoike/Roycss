"use client";

import { useCallback, useMemo, useState, type CSSProperties, type ComponentType } from "react";
import {
  Shapes,
  Copy,
  Check,
  Sparkles,
  Palette,
  RotateCw,
  AlignJustify,
  Grid3x3,
  Dices,
  Grid2x2,
  Triangle,
  Spline,
  Hash,
  CircleDashed,
  Waves,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * BackgroundPatternGenerator — a pure-CSS background pattern generator.
 *
 * The user picks one of 10 pattern archetypes (stripes, grid, dots,
 * checkerboard, triangles, zigzag, crosshatch, polka, waves, gingham),
 * customizes two colors + a repeat-unit size (and angle where relevant),
 * and gets a copy-ready `.pattern { … }` rule.
 *
 * All patterns are built from `linear-gradient` / `repeating-linear-gradient`
 * / `radial-gradient` / `conic-gradient` layers — no images, no SVG, no
 * data-URIs. Output is fully self-contained and works in any browser that
 * supports CSS gradients.
 *
 * Features:
 *  - 10 pattern archetypes in a 5×2 icon+label grid.
 *  - Color 1 / Color 2 swatches with native `<input type="color">` + hex
 *    text field (3- and 6-digit hex accepted).
 *  - Size slider (4–100 px) controlling the repeat unit.
 *  - Angle slider (0–360°) shown only for stripe-like patterns (stripes,
 *    zigzag, crosshatch) and gracefully disabled otherwise.
 *  - Opacity slider (0–100 %) applied to the whole pattern via `opacity:`.
 *  - 8 color presets (Emerald, Sunset, Ocean, Monochrome, Candy, Forest,
 *    Lavender, Neon) as split swatch chips.
 *  - "Export as `--bg-pattern`" toggle: switches the output from longhand
 *    (`background-color` / `background-image` / `background-size` /
 *    `background-position` separately) to a single `--bg-pattern: …;`
 *    custom property that holds the entire `background` shorthand, ready
 *    to be overridden or reused.
 *  - Live preview (full-width, ≥200 px tall) reflects every change.
 *  - Copy-to-clipboard with a 1.5 s Check confirmation.
 *
 * The component is fully self-contained and uses only semantic Tailwind
 * theme tokens for chrome (no indigo/blue, no hardcoded brand colors).
 */

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type PatternType =
  | "stripes"
  | "grid"
  | "dots"
  | "checkerboard"
  | "triangles"
  | "zigzag"
  | "crosshatch"
  | "polka"
  | "waves"
  | "gingham";

type LucideIcon = ComponentType<{ className?: string }>;

interface PatternMeta {
  key: PatternType;
  label: string;
  Icon: LucideIcon;
  /** Whether the angle slider is meaningful for this pattern. */
  usesAngle: boolean;
  /** Short CSS-technique hint, surfaced as the button tooltip. */
  hint: string;
}

/** A single `background-image` layer with optional per-layer size/position. */
interface BgLayer {
  image: string;
  /** `background-size` value (e.g. `"20px 20px"`). */
  size?: string;
  /** `background-position` value (e.g. `"0 0"` or `"10px 10px"`). */
  position?: string;
}

/** The full decoded pattern: a stack of layers + a base color. */
interface PatternCSS {
  backgroundColor: string;
  layers: BgLayer[];
}

interface Preset {
  name: string;
  color1: string;
  color2: string;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const PATTERN_TYPES: PatternMeta[] = [
  {
    key: "stripes",
    label: "Stripes",
    Icon: AlignJustify,
    usesAngle: true,
    hint: "repeating-linear-gradient",
  },
  {
    key: "grid",
    label: "Grid",
    Icon: Grid3x3,
    usesAngle: false,
    hint: "two linear-gradient layers",
  },
  {
    key: "dots",
    label: "Dots",
    Icon: Dices,
    usesAngle: false,
    hint: "radial-gradient",
  },
  {
    key: "checkerboard",
    label: "Checker",
    Icon: Grid2x2,
    usesAngle: false,
    hint: "two 45° gradients",
  },
  {
    key: "triangles",
    label: "Triangles",
    Icon: Triangle,
    usesAngle: false,
    hint: "conic-gradient",
  },
  {
    key: "zigzag",
    label: "Zigzag",
    Icon: Spline,
    usesAngle: true,
    hint: "linear-gradient stack",
  },
  {
    key: "crosshatch",
    label: "Crosshatch",
    Icon: Hash,
    usesAngle: true,
    hint: "two diagonal stripe layers",
  },
  {
    key: "polka",
    label: "Polka",
    Icon: CircleDashed,
    usesAngle: false,
    hint: "offset radial dots",
  },
  {
    key: "waves",
    label: "Waves",
    Icon: Waves,
    usesAngle: false,
    hint: "overlapping radial gradients",
  },
  {
    key: "gingham",
    label: "Gingham",
    Icon: LayoutGrid,
    usesAngle: false,
    hint: "two stripe layers (plaid)",
  },
];

/**
 * Eight color presets. Two-color combos chosen for strong figure/ground
 * contrast. No indigo/blue per RoyCSS theme policy (purple, cyan, teal,
 * emerald, amber, rose all allowed).
 */
const PRESETS: Preset[] = [
  { name: "Emerald", color1: "#0d9488", color2: "#f0fdf4" },
  { name: "Sunset", color1: "#ea580c", color2: "#fff7ed" },
  { name: "Ocean", color1: "#0891b2", color2: "#ecfeff" },
  { name: "Monochrome", color1: "#1f2937", color2: "#f9fafb" },
  { name: "Candy", color1: "#db2777", color2: "#fdf2f8" },
  { name: "Forest", color1: "#15803d", color2: "#f0fdf4" },
  { name: "Lavender", color1: "#7c3aed", color2: "#f5f3ff" },
  { name: "Neon", color1: "#10b981", color2: "#0a0a0a" },
];

const DEFAULT_TYPE: PatternType = "stripes";
const DEFAULT_COLOR_1 = "#0d9488";
const DEFAULT_COLOR_2 = "#f0fdf4";
const DEFAULT_SIZE = 20;
const DEFAULT_ANGLE = 45;
const DEFAULT_OPACITY = 100;

const MIN_SIZE = 4;
const MAX_SIZE = 100;

// ----------------------------------------------------------------------------
// Pure helpers
// ----------------------------------------------------------------------------

/**
 * Normalize a hex color input to a canonical 7-char `#rrggbb` form, or
 * return null if the input isn't a valid 3- or 6-digit hex. The native
 * `<input type="color">` requires a 7-char value, so the swatch control
 * falls back to "#000000" when the user types something invalid.
 */
function normalizeHex(hex: string): string | null {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${h.toLowerCase()}`;
}

/**
 * Build the full PatternCSS (color + gradient layers) for a given archetype.
 * Pure function — same inputs always yield the same CSS strings.
 */
function generatePattern(
  type: PatternType,
  c1: string,
  c2: string,
  size: number,
  angle: number,
): PatternCSS {
  const s = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(size)));
  const half = Math.max(2, Math.round(s / 2));
  // 1-pixel line width for grid/gingham (keeps the lattice crisp even at small sizes).
  const line = 1;

  switch (type) {
    case "stripes":
      return {
        backgroundColor: c2,
        layers: [
          {
            image: `repeating-linear-gradient(${angle}deg, ${c1}, ${c1} ${half}px, transparent ${half}px, transparent ${s}px)`,
          },
        ],
      };

    case "grid":
      return {
        backgroundColor: c2,
        layers: [
          {
            image: `linear-gradient(${c1} ${line}px, transparent ${line}px)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
          {
            image: `linear-gradient(90deg, ${c1} ${line}px, transparent ${line}px)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
        ],
      };

    case "dots": {
      const r = Math.max(1, Math.round(s / 6));
      return {
        backgroundColor: c2,
        layers: [
          {
            image: `radial-gradient(${c1} ${r}px, transparent ${r + 0.5}px)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
        ],
      };
    }

    case "checkerboard":
      return {
        backgroundColor: c2,
        layers: [
          {
            image: `linear-gradient(45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
          {
            image: `linear-gradient(45deg, ${c1} 25%, transparent 25%, transparent 75%, ${c1} 75%)`,
            size: `${s}px ${s}px`,
            position: `${half}px ${half}px`,
          },
        ],
      };

    case "triangles":
      return {
        backgroundColor: c2,
        layers: [
          {
            image: `conic-gradient(from 0deg, ${c1} 0deg 60deg, transparent 60deg 120deg, ${c1} 120deg 180deg, transparent 180deg 240deg, ${c1} 240deg 300deg, transparent 300deg 360deg)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
        ],
      };

    case "zigzag":
      return {
        backgroundColor: c2,
        layers: [
          {
            image: `linear-gradient(${angle + 135}deg, ${c1} 25%, transparent 25%)`,
            size: `${s}px ${s}px`,
            position: `${half}px 0`,
          },
          {
            image: `linear-gradient(${angle + 225}deg, ${c1} 25%, transparent 25%)`,
            size: `${s}px ${s}px`,
            position: `${half}px 0`,
          },
          {
            image: `linear-gradient(${angle + 45}deg, ${c1} 25%, transparent 25%)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
          {
            image: `linear-gradient(${angle + 315}deg, ${c1} 25%, transparent 25%)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
        ],
      };

    case "crosshatch": {
      const w = Math.max(1, Math.round(s / 8));
      return {
        backgroundColor: c2,
        layers: [
          {
            image: `repeating-linear-gradient(${angle}deg, ${c1} 0, ${c1} ${w}px, transparent ${w}px, transparent ${half}px)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
          {
            image: `repeating-linear-gradient(${angle + 90}deg, ${c1} 0, ${c1} ${w}px, transparent ${w}px, transparent ${half}px)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
        ],
      };
    }

    case "polka": {
      const r = Math.max(1, Math.round(s / 5));
      return {
        backgroundColor: c2,
        layers: [
          {
            image: `radial-gradient(${c1} ${r}px, transparent ${r + 0.5}px)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
          {
            image: `radial-gradient(${c1} ${r}px, transparent ${r + 0.5}px)`,
            size: `${s}px ${s}px`,
            position: `${half}px ${half}px`,
          },
        ],
      };
    }

    case "waves": {
      const r = Math.max(1, Math.round(s / 4));
      return {
        backgroundColor: c2,
        layers: [
          {
            image: `radial-gradient(circle at 50% 0%, ${c1} ${r}px, transparent ${r + 0.5}px)`,
            size: `${s}px ${s}px`,
            position: "0 0",
          },
          {
            image: `radial-gradient(circle at 50% 100%, ${c1} ${r}px, transparent ${r + 0.5}px)`,
            size: `${s}px ${s}px`,
            position: `0 ${half}px`,
          },
        ],
      };
    }

    case "gingham":
      return {
        backgroundColor: c2,
        layers: [
          {
            image: `repeating-linear-gradient(0deg, ${c1} 0, ${c1} ${line}px, transparent ${line}px, transparent ${s}px)`,
          },
          {
            image: `repeating-linear-gradient(90deg, ${c1} 0, ${c1} ${line}px, transparent ${line}px, transparent ${s}px)`,
          },
        ],
      };
  }
}

/**
 * Longhand CSS — emits `background-color`, `background-image`,
 * `background-size`, `background-position` as separate properties. The
 * `background-position` line is omitted entirely when no layer uses a
 * non-default position (keeps the output tidy for stripes / dots).
 */
function buildLonghandCSS(p: PatternCSS, opacity: number): string {
  const lines: string[] = [".pattern {"];
  lines.push(`  background-color: ${p.backgroundColor};`);

  if (p.layers.length > 0) {
    const images = p.layers.map((l) => l.image).join(", ");
    lines.push(`  background-image: ${images};`);
  }

  const anySize = p.layers.some((l) => l.size);
  if (anySize) {
    const sizes = p.layers.map((l) => l.size ?? "auto").join(", ");
    lines.push(`  background-size: ${sizes};`);
  }

  // Only surface background-position when at least one layer deviates from "0 0".
  const hasNonDefaultPos = p.layers.some((l) => l.position && l.position !== "0 0");
  if (hasNonDefaultPos) {
    const positions = p.layers.map((l) => l.position ?? "0 0").join(", ");
    lines.push(`  background-position: ${positions};`);
  }

  if (opacity < 100) {
    lines.push(`  opacity: ${(opacity / 100).toFixed(2)};`);
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * Build the value for a single `background:` shorthand string, suitable
 * for embedding inside a CSS custom property. Per-layer position is
 * mandatory before `/ <size>` per the shorthand spec, so we default to
 * "0 0" when only a size is set. The base color is appended as the
 * final (color-only) layer.
 */
function buildShorthandValue(p: PatternCSS): string {
  if (p.layers.length === 0) return p.backgroundColor;

  const layerStrs = p.layers.map((l) => {
    let s = l.image;
    if (l.size) {
      s += ` ${l.position ?? "0 0"}`;
      s += ` / ${l.size}`;
    } else if (l.position && l.position !== "0 0") {
      s += ` ${l.position}`;
    }
    return s;
  });
  layerStrs.push(p.backgroundColor);
  return layerStrs.join(", ");
}

/**
 * Variable-mode CSS — wraps the whole pattern as `--bg-pattern: …;` and
 * references it via `background: var(--bg-pattern);`. The opacity line
 * stays outside the variable (it isn't part of the background value).
 */
function buildVariableCSS(p: PatternCSS, opacity: number): string {
  const value = buildShorthandValue(p);
  const lines: string[] = [".pattern {"];

  // Multi-layer values get pretty-printed across indented lines for readability.
  if (value.includes(",")) {
    const parts = value.split(", ");
    lines.push("  --bg-pattern:");
    parts.forEach((part, i) => {
      const suffix = i === parts.length - 1 ? ";" : ",";
      lines.push(`    ${part}${suffix}`);
    });
  } else {
    lines.push(`  --bg-pattern: ${value};`);
  }

  lines.push("  background: var(--bg-pattern);");
  if (opacity < 100) {
    lines.push(`  opacity: ${(opacity / 100).toFixed(2)};`);
  }
  lines.push("}");
  return lines.join("\n");
}

/** Inline `style` object for the live preview, matching the longhand output. */
function buildPreviewStyle(p: PatternCSS, opacity: number): CSSProperties {
  const style: CSSProperties = {
    backgroundColor: p.backgroundColor,
    opacity: opacity / 100,
  };
  if (p.layers.length > 0) {
    style.backgroundImage = p.layers.map((l) => l.image).join(", ");
  }
  if (p.layers.some((l) => l.size)) {
    style.backgroundSize = p.layers.map((l) => l.size ?? "auto").join(", ");
  }
  if (p.layers.some((l) => l.position)) {
    style.backgroundPosition = p.layers.map((l) => l.position ?? "0 0").join(", ");
  }
  return style;
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function ColorControl({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent: "primary" | "muted";
}) {
  // The native color input requires a 7-char #rrggbb value. Fall back to
  // black while the user is mid-typing an invalid hex.
  const safe = normalizeHex(value) ?? "#000000";
  const inputId = `pattern-color-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId} className="text-[11px] text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "relative size-9 shrink-0 overflow-hidden rounded-md border",
            accent === "primary" ? "border-primary/40" : "border-border",
          )}
          style={{ background: safe }}
        >
          <input
            type="color"
            value={safe}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={`${label} color picker`}
          />
        </div>
        <Input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 flex-1 font-mono text-xs"
          spellCheck={false}
          autoComplete="off"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-muted-foreground">{label}</Label>
        <span className="font-mono text-[11px] tabular-nums text-foreground">
          {value}
          <span className="text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(arr) => {
          const next = arr[0];
          if (typeof next === "number") onChange(next);
        }}
        className="py-1.5"
        aria-label={`${label} slider`}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function BackgroundPatternGenerator() {
  const [patternType, setPatternType] = useState<PatternType>(DEFAULT_TYPE);
  const [color1, setColor1] = useState<string>(DEFAULT_COLOR_1);
  const [color2, setColor2] = useState<string>(DEFAULT_COLOR_2);
  const [size, setSize] = useState<number>(DEFAULT_SIZE);
  const [angle, setAngle] = useState<number>(DEFAULT_ANGLE);
  const [opacity, setOpacity] = useState<number>(DEFAULT_OPACITY);
  const [asVariable, setAsVariable] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const activePattern = useMemo(
    () => PATTERN_TYPES.find((p) => p.key === patternType) ?? PATTERN_TYPES[0],
    [patternType],
  );
  const usesAngle = activePattern.usesAngle;

  // Decoded pattern (color + gradient layers). Memoized so the CSS string
  // and the preview style stay in sync and only recompute on real changes.
  const pattern = useMemo(
    () => generatePattern(patternType, color1, color2, size, angle),
    [patternType, color1, color2, size, angle],
  );

  const cssString = useMemo(
    () => (asVariable ? buildVariableCSS(pattern, opacity) : buildLonghandCSS(pattern, opacity)),
    [pattern, opacity, asVariable],
  );

  const previewStyle = useMemo(
    () => buildPreviewStyle(pattern, opacity),
    [pattern, opacity],
  );

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
    setPatternType(DEFAULT_TYPE);
    setColor1(DEFAULT_COLOR_1);
    setColor2(DEFAULT_COLOR_2);
    setSize(DEFAULT_SIZE);
    setAngle(DEFAULT_ANGLE);
    setOpacity(DEFAULT_OPACITY);
    setAsVariable(false);
  }, []);

  const applyPreset = useCallback((p: Preset) => {
    setColor1(p.color1);
    setColor2(p.color2);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shapes className="size-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">
              Background Pattern Generator
            </h3>
            <Badge variant="secondary" className="text-[10px]">
              pure CSS
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Pick a pattern, customize colors &amp; size, copy the CSS. No images, no SVG.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 shrink-0 px-2"
          onClick={handleReset}
          aria-label="Reset to defaults"
        >
          <RotateCw className="size-3.5" aria-hidden />
          Reset
        </Button>
      </div>

      {/* Pattern selector — 5×2 grid */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3" aria-hidden />
          Pattern type
        </Label>
        <div
          className="grid grid-cols-5 gap-1.5"
          role="radiogroup"
          aria-label="Pattern type"
        >
          {PATTERN_TYPES.map(({ key, label, Icon, hint }) => {
            const active = key === patternType;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPatternType(key)}
                title={hint}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border px-1.5 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          <span className="font-medium text-foreground">{activePattern.label}</span> ·{" "}
          {activePattern.hint}
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
        <ColorControl
          label="Color 1"
          value={color1}
          onChange={setColor1}
          accent="primary"
        />
        <ColorControl
          label="Color 2"
          value={color2}
          onChange={setColor2}
          accent="muted"
        />

        <SliderControl
          label="Size"
          value={size}
          min={MIN_SIZE}
          max={MAX_SIZE}
          step={1}
          unit="px"
          onChange={setSize}
        />

        {usesAngle ? (
          <SliderControl
            label="Angle"
            value={angle}
            min={0}
            max={360}
            step={1}
            unit="°"
            onChange={setAngle}
          />
        ) : (
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Angle</Label>
            <div className="flex h-9 items-center rounded-md border border-dashed border-border bg-muted/30 px-3 text-[11px] text-muted-foreground">
              Not used for this pattern
            </div>
          </div>
        )}

        <SliderControl
          label="Opacity"
          value={opacity}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={setOpacity}
        />

        {/* Export-as-variable toggle */}
        <div className="space-y-1.5">
          <Label
            htmlFor="pattern-as-variable"
            className="text-[11px] text-muted-foreground"
          >
            Export as variable
          </Label>
          <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3">
            <Switch
              id="pattern-as-variable"
              checked={asVariable}
              onCheckedChange={setAsVariable}
              aria-label="Wrap pattern as --bg-pattern CSS custom property"
            />
            <code className="font-mono text-[11px] text-foreground">--bg-pattern</code>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Palette className="size-3" aria-hidden />
          Presets
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const active =
              color1.toLowerCase() === p.color1.toLowerCase() &&
              color2.toLowerCase() === p.color2.toLowerCase();
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                aria-pressed={active}
                title={`${p.name} — ${p.color1} on ${p.color2}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-accent",
                )}
              >
                <span
                  className="flex size-3 overflow-hidden rounded-sm border border-border"
                  aria-hidden
                >
                  <span
                    className="h-full w-1/2"
                    style={{ background: p.color1 }}
                  />
                  <span
                    className="h-full w-1/2"
                    style={{ background: p.color2 }}
                  />
                </span>
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Live preview
          </Label>
          <span className="font-mono text-[10px] text-muted-foreground">
            {activePattern.label} · {size}px{usesAngle ? ` · ${angle}°` : ""}
            {opacity < 100 ? ` · ${opacity}%` : ""}
          </span>
        </div>
        <div
          className="min-h-[200px] w-full rounded-lg border border-border"
          style={previewStyle}
          role="img"
          aria-label={`${activePattern.label} pattern preview`}
        />
      </div>

      {/* Generated CSS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Generated CSS{asVariable ? " (as --bg-pattern)" : ""}
          </Label>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={handleCopy}
            aria-label="Copy generated CSS to clipboard"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-primary" aria-hidden />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden />
                Copy
              </>
            )}
          </Button>
        </div>
        <pre
          className="max-h-72 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-foreground"
          aria-label="Generated CSS code block"
        >
          <code>{cssString}</code>
        </pre>
      </div>
    </div>
  );
}
