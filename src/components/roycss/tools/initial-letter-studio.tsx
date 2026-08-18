"use client";

/**
 * InitialLetterStudio — a self-contained CSS `initial-letter` drop-cap editor.
 *
 * The `initial-letter` property (Baseline 2024) lets a `::first-letter`
 * pseudo-element become a true drop cap or raised cap, sized in *line boxes*
 * rather than `em` units. This tool lets developers:
 *   1. Pick the drop-cap size (1–6 lines) and sink depth (0–6 lines).
 *      A sink of 0 produces a raised cap; sink == size is the classic drop.
 *   2. Toggle the `drop` keyword shorthand (browser picks natural metrics).
 *   3. Pick the cap's font family (serif / sans / mono / display), weight,
 *      colour (with hex→oklch conversion for the generated CSS), and an
 *      optional first-letter font-size-multiplier.
 *   4. Choose `initial-letter-align` (auto / alphabetic / hanging / leading)
 *      for fine-tuning raised-cap alignment.
 *   5. Compare three rendering strategies side-by-side on a real
 *      multi-paragraph lorem-ipsum block:
 *        • "With initial-letter" — the user's current settings
 *        • "Raised cap" — size 1, sink 0 (the keyword `raise` look)
 *        • "Traditional float" — the legacy `float: left; font-size: 3em;
 *          line-height: 0.8;` hack that `initial-letter` replaces.
 *   6. Read the generated CSS rule (with copy-to-clipboard).
 *   7. Load one of six presets: medieval-3-line, modern-2-line, raised-cap,
 *      sunken-5-line, colored-gradient, ornate-serif.
 *   8. See a Baseline 2024 browser-support badge (Chrome 110+, Safari 9+,
 *      Firefox 131+) and an explanation of `initial-letter` vs the float hack.
 *
 * Implementation notes:
 *   - The `::first-letter` style is applied by injecting a `<style>` block with
 *     class-scoped selectors so the real pseudo-element is exercised — this is
 *     the only way to faithfully render `initial-letter`.
 *   - The "Traditional float" panel manually wraps the first letter in a span
 *     and floats it; this is what `initial-letter` replaces.
 *   - Hex → OKLCH conversion is done client-side with the standard
 *     sRGB → linear-RGB → OKLab → OKLCH pipeline.
 *   - All cleanup-safe: a single copy timeout is cleared on unmount.
 *   - TS strict, no `any`, no `console.log`. Self-contained (no props, no
 *     external state, no network). Responsive within `max-w-2xl`.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  AlignLeft,
  Check,
  Copy,
  Globe,
  Info,
  RotateCcw,
  Sparkles,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type FontFamily = "serif" | "sans" | "mono" | "display";

type FontWeight = "400" | "500" | "600" | "700" | "800" | "900";

type InitialLetterAlign = "auto" | "alphabetic" | "hanging" | "leading";

type PresetId =
  | "medieval-3-line"
  | "modern-2-line"
  | "raised-cap"
  | "sunken-5-line"
  | "colored-gradient"
  | "ornate-serif";

interface StudioState {
  /** Drop-cap size: how many line boxes the cap occupies. 1–6. */
  size: number;
  /** Sink depth: how many lines the cap sinks. 0 = raised cap. 0–6. */
  sink: number;
  /** When true, the property is emitted as `initial-letter: drop`. */
  useDropKeyword: boolean;
  fontFamily: FontFamily;
  fontWeight: FontWeight;
  /** Cap colour as a CSS value (hex or named). */
  color: string;
  /** Optional extra font-size multiplier on the first letter. */
  fontSizeMultiplier: number;
  align: InitialLetterAlign;
}

interface Preset {
  id: PresetId;
  name: string;
  state: StudioState;
}

// ============================================================
// Constants
// ============================================================

const FONT_FAMILY_VALUES: Record<FontFamily, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  display: "'Impact', 'Arial Black', sans-serif",
};

const FONT_FAMILIES: { value: FontFamily; label: string }[] = [
  { value: "serif", label: "Serif" },
  { value: "sans", label: "Sans" },
  { value: "mono", label: "Mono" },
  { value: "display", label: "Display" },
];

const FONT_WEIGHTS: { value: FontWeight; label: string }[] = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extrabold" },
  { value: "900", label: "Black" },
];

const ALIGN_OPTIONS: { value: InitialLetterAlign; label: string }[] = [
  { value: "auto", label: "auto" },
  { value: "alphabetic", label: "alphabetic" },
  { value: "hanging", label: "hanging" },
  { value: "leading", label: "leading" },
];

const DEFAULT_STATE: StudioState = {
  size: 3,
  sink: 3,
  useDropKeyword: false,
  fontFamily: "serif",
  fontWeight: "700",
  color: "#b91c1c",
  fontSizeMultiplier: 1,
  align: "auto",
};

const COPY_CONFIRM_MS = 2000;

const LOREM_PARAGRAPH_1 =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

const LOREM_PARAGRAPH_2 =
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const PRESETS: Preset[] = [
  {
    id: "medieval-3-line",
    name: "Medieval 3-Line",
    state: {
      size: 3,
      sink: 3,
      useDropKeyword: false,
      fontFamily: "serif",
      fontWeight: "700",
      color: "#7c2d12",
      fontSizeMultiplier: 1,
      align: "alphabetic",
    },
  },
  {
    id: "modern-2-line",
    name: "Modern 2-Line",
    state: {
      size: 2,
      sink: 2,
      useDropKeyword: false,
      fontFamily: "sans",
      fontWeight: "800",
      color: "#0f172a",
      fontSizeMultiplier: 1,
      align: "auto",
    },
  },
  {
    id: "raised-cap",
    name: "Raised Cap",
    state: {
      size: 2,
      sink: 0,
      useDropKeyword: false,
      fontFamily: "serif",
      fontWeight: "700",
      color: "#b45309",
      fontSizeMultiplier: 1.4,
      align: "alphabetic",
    },
  },
  {
    id: "sunken-5-line",
    name: "Sunken 5-Line",
    state: {
      size: 5,
      sink: 5,
      useDropKeyword: false,
      fontFamily: "display",
      fontWeight: "900",
      color: "#1e3a8a",
      fontSizeMultiplier: 1,
      align: "leading",
    },
  },
  {
    id: "colored-gradient",
    name: "Colored Gradient",
    state: {
      size: 4,
      sink: 4,
      useDropKeyword: false,
      fontFamily: "serif",
      fontWeight: "800",
      color: "#9333ea",
      fontSizeMultiplier: 1,
      align: "alphabetic",
    },
  },
  {
    id: "ornate-serif",
    name: "Ornate Serif",
    state: {
      size: 3,
      sink: 2,
      useDropKeyword: false,
      fontFamily: "serif",
      fontWeight: "900",
      color: "#92400e",
      fontSizeMultiplier: 1.1,
      align: "hanging",
    },
  },
];

// ============================================================
// Colour helpers — hex → OKLCH
// ============================================================

/**
 * Convert a `#rgb` / `#rrggbb` hex string to an `oklch(L C H)` CSS string.
 * Returns `null` if the input is not a clean hex value (caller falls back to
 * emitting the raw colour string).
 */
function hexToOklch(hex: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  // sRGB → linear
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lr = lin(r);
  const lg = lin(g);
  const lb = lin(b);

  // Linear RGB → LMS (OKLab precondition)
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m1 = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m1);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + b2 * b2);
  let H = (Math.atan2(b2, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  const round = (x: number, digits = 3) => {
    const p = Math.pow(10, digits);
    return Math.round(x * p) / p;
  };

  return `oklch(${round(L)} ${round(C)} ${round(H)})`;
}

// ============================================================
// CSS generation
// ============================================================

function buildInitialLetterValue(state: StudioState): string {
  if (state.useDropKeyword) return "drop";
  if (state.sink === state.size) return String(state.size);
  return `${state.size} ${state.sink}`;
}

function buildGeneratedCss(state: StudioState): string {
  const value = buildInitialLetterValue(state);
  const colorOklch = hexToOklch(state.color);
  const colorOut = colorOklch ?? state.color;
  const alignLine =
    state.align !== "auto" ? `\n  initial-letter-align: ${state.align};` : "";
  const sizeLine =
    state.fontSizeMultiplier !== 1
      ? `\n  font-size: ${state.fontSizeMultiplier}em;`
      : "";
  return `p::first-letter {
  initial-letter: ${value};
  font-family: ${FONT_FAMILY_VALUES[state.fontFamily]};
  color: ${colorOut};
  font-weight: ${state.fontWeight};${alignLine}${sizeLine}
}`;
}

// ============================================================
// Preview paragraph
// ============================================================

interface PreviewParagraphProps {
  /** CSS class applied to the <p>. The injected <style> targets it. */
  className: string;
  text: string;
  /** Optional inline style overrides (e.g. font-family for the float hack). */
  style?: CSSProperties;
  /** When set, the first letter is wrapped in a span with these styles. */
  firstLetterStyle?: CSSProperties;
}

function PreviewParagraph({
  className,
  text,
  style,
  firstLetterStyle,
}: PreviewParagraphProps) {
  const firstChar = text.charAt(0);
  const rest = text.slice(1);
  return (
    <p className={className} style={style}>
      {firstLetterStyle ? (
        <>
          <span style={firstLetterStyle}>{firstChar}</span>
          {rest}
        </>
      ) : (
        text
      )}
    </p>
  );
}

// ============================================================
// Main component
// ============================================================

export function InitialLetterStudio() {
  // ── State ────────────────────────────────────────────────────────
  const [state, setState] = useState<StudioState>(DEFAULT_STATE);
  const [copied, setCopied] = useState(false);
  const [activePresetId, setActivePresetId] = useState<PresetId | null>(
    "medieval-3-line",
  );

  // ── Refs ────────────────────────────────────────────────────────
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Patch helper ─────────────────────────────────────────────────
  const patch = useCallback(<K extends keyof StudioState>(key: K, value: StudioState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setActivePresetId(null);
  }, []);

  // ── When size changes, sink follows it unless user has decoupled ─
  const handleSizeChange = useCallback((nextSize: number) => {
    setState((prev) => {
      // Keep sink == size when they were previously equal (default behaviour).
      const sink = prev.sink === prev.size ? nextSize : prev.sink;
      return { ...prev, size: nextSize, sink };
    });
    setActivePresetId(null);
  }, []);

  // ── Derived: generated CSS ──────────────────────────────────────
  const generatedCss = useMemo(() => buildGeneratedCss(state), [state]);

  // ── Derived: injected <style> for the "With initial-letter" panel ──
  const userPanelStyle = useMemo(() => {
    const value = buildInitialLetterValue(state);
    const colorOut = hexToOklch(state.color) ?? state.color;
    const alignRule =
      state.align !== "auto"
        ? `\n  .il-user::first-letter { initial-letter-align: ${state.align}; }`
        : "";
    const sizeRule =
      state.fontSizeMultiplier !== 1
        ? `\n  .il-user::first-letter { font-size: ${state.fontSizeMultiplier}em; }`
        : "";
    return `.il-user::first-letter {
  initial-letter: ${value};
  font-family: ${FONT_FAMILY_VALUES[state.fontFamily]};
  color: ${colorOut};
  font-weight: ${state.fontWeight};
}${alignRule}${sizeRule}`;
  }, [state]);

  // ── Derived: injected <style> for the "Raised cap" demo panel ────
  const raisedPanelStyle = useMemo(
    () => `.il-raised::first-letter {
  initial-letter: 2 0;
  font-family: ${FONT_FAMILY_VALUES.serif};
  color: ${hexToOklch("#b45309") ?? "#b45309"};
  font-weight: 700;
  initial-letter-align: alphabetic;
}`,
    [],
  );

  // ── Presets ─────────────────────────────────────────────────────
  const applyPreset = useCallback((preset: Preset) => {
    setState(preset.state);
    setActivePresetId(preset.id);
  }, []);

  const handleReset = useCallback(() => {
    setState(DEFAULT_STATE);
    setActivePresetId("medieval-3-line");
  }, []);

  // ── Copy ────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(
        () => setCopied(false),
        COPY_CONFIRM_MS,
      );
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [generatedCss]);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // ── Float-hack first-letter style (legacy comparison) ───────────
  const floatHackFirstLetterStyle = useMemo<CSSProperties>(
    () => ({
      float: "left",
      fontSize: "3em",
      lineHeight: 0.8,
      paddingRight: "0.08em",
      fontFamily: FONT_FAMILY_VALUES.serif,
      fontWeight: 700,
      color: hexToOklch("#7c2d12") ?? "#7c2d12",
    }),
    [],
  );

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Injected styles for ::first-letter pseudo-elements */}
      <style>{userPanelStyle}</style>
      <style>{raisedPanelStyle}</style>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Type className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">
              Initial Letter Studio
            </h3>
            <p className="text-xs text-muted-foreground">
              Design CSS <code className="font-mono">initial-letter</code> drop
              caps · Baseline 2024
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex cursor-pointer items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          title="Reset to defaults"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      {/* ── Live preview: 3-way comparison ──────────────────────── */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <AlignLeft className="size-3.5" />
            Live Preview
          </span>
          <Badge variant="secondary" className="font-mono text-[10px]">
            initial-letter: {buildInitialLetterValue(state)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Column 1: With initial-letter (user settings) */}
          <figure className="space-y-2 rounded-lg border border-primary/30 bg-background p-3">
            <figcaption className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              With initial-letter
            </figcaption>
            <div
              className="overflow-hidden rounded-md bg-white p-3 text-foreground"
              style={{
                lineHeight: 1.5,
                fontSize: 13,
                color: "#1c1917",
              }}
            >
              <PreviewParagraph
                className="il-user m-0 text-justify"
                text={LOREM_PARAGRAPH_1}
              />
              <PreviewParagraph
                className="il-user m-0 mt-2 text-justify"
                text={LOREM_PARAGRAPH_2}
              />
            </div>
          </figure>

          {/* Column 2: Raised cap (size 1, sink 0) */}
          <figure className="space-y-2 rounded-lg border border-border bg-background p-3">
            <figcaption className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Raised cap (2 0)
            </figcaption>
            <div
              className="overflow-hidden rounded-md bg-white p-3"
              style={{
                lineHeight: 1.5,
                fontSize: 13,
                color: "#1c1917",
              }}
            >
              <PreviewParagraph
                className="il-raised m-0 text-justify"
                text={LOREM_PARAGRAPH_1}
              />
              <PreviewParagraph
                className="il-raised m-0 mt-2 text-justify"
                text={LOREM_PARAGRAPH_2}
              />
            </div>
          </figure>

          {/* Column 3: Traditional float hack */}
          <figure className="space-y-2 rounded-lg border border-border bg-background p-3">
            <figcaption className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="size-1.5 rounded-full bg-rose-500" />
              Traditional float
            </figcaption>
            <div
              className="overflow-hidden rounded-md bg-white p-3"
              style={{
                lineHeight: 1.5,
                fontSize: 13,
                color: "#1c1917",
              }}
            >
              <PreviewParagraph
                className="m-0 text-justify"
                text={LOREM_PARAGRAPH_1}
                firstLetterStyle={floatHackFirstLetterStyle}
              />
              <PreviewParagraph
                className="m-0 mt-2 text-justify"
                text={LOREM_PARAGRAPH_2}
              />
            </div>
          </figure>
        </div>

        <p className="text-[10px] text-muted-foreground">
          The first paragraph of each column carries the drop cap; the second
          flows normally. Resize the window to see how the cap reflows with the
          text.
        </p>
      </div>

      {/* ── Controls ────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Controls
        </span>

        {/* Drop keyword toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Label className="text-xs">Use <code className="font-mono">drop</code> keyword</Label>
            <p className="text-[10px] text-muted-foreground">
              Browser picks natural metrics; ignores size & sink sliders.
            </p>
          </div>
          <Button
            type="button"
            variant={state.useDropKeyword ? "default" : "outline"}
            size="sm"
            onClick={() =>
              patch("useDropKeyword", !state.useDropKeyword)
            }
            className="h-7 gap-1 text-xs"
            aria-pressed={state.useDropKeyword}
          >
            {state.useDropKeyword ? "On" : "Off"}
          </Button>
        </div>

        {/* Size + Sink sliders */}
        <div
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2",
            state.useDropKeyword && "pointer-events-none opacity-40",
          )}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Size (rows the cap spans)
              </Label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {state.size}
              </span>
            </div>
            <Slider
              value={[state.size]}
              min={1}
              max={6}
              step={1}
              onValueChange={(v) => handleSizeChange(v[0])}
              aria-label="Drop cap size"
              disabled={state.useDropKeyword}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Sink (lines sunk below baseline)
              </Label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {state.sink}
                {state.sink === 0 && " · raised"}
              </span>
            </div>
            <Slider
              value={[state.sink]}
              min={0}
              max={6}
              step={1}
              onValueChange={(v) => patch("sink", v[0])}
              aria-label="Drop cap sink depth"
              disabled={state.useDropKeyword}
            />
          </div>
        </div>

        {/* Font family + weight */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Font family
            </Label>
            <Select
              value={state.fontFamily}
              onValueChange={(v) => patch("fontFamily", v as FontFamily)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Font weight
            </Label>
            <Select
              value={state.fontWeight}
              onValueChange={(v) => patch("fontWeight", v as FontWeight)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_WEIGHTS.map((w) => (
                  <SelectItem key={w.value} value={w.value} className="text-xs">
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Color + size multiplier */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Cap colour
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  /^#[0-9a-f]{6}$/i.test(state.color) ? state.color : "#000000"
                }
                onChange={(e) => patch("color", e.target.value)}
                className="size-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
                aria-label="Drop cap colour picker"
              />
              <Input
                type="text"
                value={state.color}
                onChange={(e) => patch("color", e.target.value)}
                className="h-8 flex-1 font-mono text-xs"
                aria-label="Drop cap colour value"
              />
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">
              {hexToOklch(state.color) ?? "non-hex value"}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                First-letter size multiplier
              </Label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {state.fontSizeMultiplier.toFixed(2)}em
              </span>
            </div>
            <Slider
              value={[state.fontSizeMultiplier]}
              min={0.5}
              max={2}
              step={0.05}
              onValueChange={(v) => patch("fontSizeMultiplier", v[0])}
              aria-label="First letter font size multiplier"
            />
          </div>
        </div>

        {/* initial-letter-align */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            initial-letter-align
          </Label>
          <Select
            value={state.align}
            onValueChange={(v) => patch("align", v as InitialLetterAlign)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALIGN_OPTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value} className="text-xs">
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Presets ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3.5" />
          Presets
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "flex cursor-pointer flex-col items-start gap-1 rounded-lg border bg-card p-2.5 text-left transition-all",
                  isActive
                    ? "border-primary/60 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-muted/30",
                )}
                aria-label={`Apply ${preset.name} preset`}
                aria-pressed={isActive}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center font-bold leading-none"
                  style={{
                    fontFamily: FONT_FAMILY_VALUES[preset.state.fontFamily],
                    fontWeight: Number(preset.state.fontWeight),
                    color: preset.state.color,
                    fontSize: 22,
                  }}
                >
                  A
                </span>
                <span className="text-[10px] font-medium text-foreground">
                  {preset.name}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground">
                  {buildInitialLetterValue(preset.state)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Generated CSS ───────────────────────────────────────── */}
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
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-primary/10 text-primary hover:bg-primary/20",
            )}
            aria-label={
              copied ? "CSS copied to clipboard" : "Copy generated CSS"
            }
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground/80">
          <code>{generatedCss}</code>
        </pre>
      </div>

      {/* ── Browser support ─────────────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Globe className="size-3.5" />
          Browser Support
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Baseline 2024
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            Chrome 110+
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            Safari 9+
          </Badge>
          <Badge variant="secondary" className="font-mono text-[10px]">
            Firefox 131+
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Safari shipped <code className="font-mono">initial-letter</code> behind
          a <code className="font-mono">-webkit-</code> prefix as early as v9;
          Firefox landed unprefixed support in v131 (Oct 2024), completing
          Baseline 2024.
        </p>
      </div>

      {/* ── Explanation: initial-letter vs float hack ───────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Info className="size-3.5" />
          initial-letter vs the float hack
        </span>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            Before <code className="font-mono">initial-letter</code>, drop caps
            were faked with a floated span on the first character:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-[11px] text-foreground/80">
            <code>{`/* Legacy hack */
p::first-letter {
  float: left;
  font-size: 3em;
  line-height: 0.8;
  padding-right: 0.1em;
}`}</code>
          </pre>
          <p>
            This works visually but has real downsides: the cap is sized in
            <code className="font-mono"> em</code>s (not line boxes), so it
            drifts out of alignment when <code className="font-mono">line-height</code>
            , font metrics, or container width change. The cap also doesn't sink
            properly — adjacent lines wrap around an opaque float box, leaving
            awkward gaps below the cap.
          </p>
          <p>
            <code className="font-mono">initial-letter: 3 3</code> declares the
            intent directly: the cap spans exactly 3 line boxes and sinks 3
            lines. The browser does the metric math, the cap aligns to the
            baseline of the sink line, and the surrounding text reflows
            cleanly — no manual <code className="font-mono">line-height</code>
            hacking required.
          </p>
        </div>
      </div>
    </div>
  );
}
