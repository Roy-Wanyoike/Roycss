"use client";

/**
 * RoyTypography — a fluid type scale generator + variable font configurator.
 *
 * Self-contained (no props). Two tabs:
 *
 *   • Type Scale — base font size, modular scale ratio (Minor Third 1.2 →
 *     Golden 1.618), step count (5–8). Renders a table where every row
 *     shows the step name (xs / sm / base / lg / xl / 2xl / 3xl / 4xl),
 *     px, rem, the clamp() value (when fluid mode is on), and a live
 *     preview line at the actual computed size. "Copy CSS variables"
 *     emits a `:root { --text-… }` block.
 *
 *   • Variable Font — pick Inter / Geist / system-ui, drag the weight
 *     slider (100–900), set optical size (8–144). Live specimen card
 *     renders the chosen axes via `font-variation-settings`. Below it:
 *     a reading-optimization tips list (line-height, measure, contrast,
 *     letter-spacing, anti-aliasing) and a copy button for the variable
 *     font CSS.
 *
 * All clamp math is done in JS (no CSS calculations needed). SSR-safe —
 * no `window`/`document` access during render. TS strict, zero `any`.
 * No indigo / blue accents.
 */

import * as React from "react";
import {
  Check,
  Copy,
  Type as TypeIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type ScaleRatio = 1.2 | 1.25 | 1.333 | 1.5 | 1.618;
type StepCount = 5 | 6 | 7 | 8;
type FontChoice = "Inter" | "Geist" | "system-ui";

interface RatioMeta {
  value: ScaleRatio;
  label: string;
  description: string;
}

interface TypeStep {
  /** Tailwind-style step name. */
  name: string;
  /** Computed px size at the "max" (desktop) end of the scale. */
  px: number;
  /** Computed rem size. */
  rem: number;
  /** When fluid is on, the min px value (75% of max, min 12px). */
  minPx: number;
  /** The sample text shown in the preview column. */
  preview: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const RATIO_OPTIONS: readonly RatioMeta[] = [
  { value: 1.2, label: "1.200", description: "Minor Third — tight, dense" },
  { value: 1.25, label: "1.250", description: "Major Third — balanced" },
  { value: 1.333, label: "1.333", description: "Perfect Fourth — classic" },
  { value: 1.5, label: "1.500", description: "Perfect Fifth — dramatic" },
  { value: 1.618, label: "1.618", description: "Golden Ratio — golden" },
] as const;

const STEP_COUNT_OPTIONS: readonly StepCount[] = [5, 6, 7, 8] as const;

const STEP_NAMES_DESC: readonly string[] = [
  "5xl",
  "4xl",
  "3xl",
  "2xl",
  "xl",
  "lg",
  "base",
  "sm",
  "xs",
] as const;

const FONT_OPTIONS: readonly { value: FontChoice; label: string }[] = [
  { value: "Inter", label: "Inter" },
  { value: "Geist", label: "Geist" },
  { value: "system-ui", label: "system-ui" },
] as const;

const READING_TIPS: readonly { title: string; body: string }[] = [
  {
    title: "Line height between 1.4–1.7 for body",
    body: "Long-form reading is most comfortable at 1.5–1.6. Headings can drop to 1.1–1.25 to feel intentional.",
  },
  {
    title: "Measure: 45–75 characters per line",
    body: "Lines longer than ~75 characters fatigue the eye. Use `max-width: 65ch` on paragraphs.",
  },
  {
    title: "Body text ≥ 16px",
    body: "Anything smaller triggers iOS Safari to zoom on focus. Use rem so users can scale.",
  },
  {
    title: "Letter-spacing tightens with size",
    body: "Display sizes benefit from -0.02em to -0.04em; body stays at 0. Caps lock benefits from +0.08em.",
  },
  {
    title: "Contrast ≥ 4.5:1 for body",
    body: "WCAG AA requires 4.5:1 for normal text, 3:1 for large (≥18.66px bold or ≥24px).",
  },
  {
    title: "Use `font-optical-sizing: auto`",
    body: "Variable fonts with an `opsz` axis adapt letterforms to size automatically — sharper at small sizes, more open at display sizes.",
  },
  {
    title: "Antialiasing: `-webkit-font-smoothing: antialiased`",
    body: "On macOS, this enables subpixel antialiasing for crisper text. Use sparingly — it darkens text.",
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/**
 * Compute a type scale with `count` steps centered around `base`.
 * The middle step is always `base`. Steps above multiply by `ratio`,
 * steps below divide.
 */
function computeScale(
  basePx: number,
  ratio: ScaleRatio,
  count: StepCount,
): TypeStep[] {
  // Pick the central slice of STEP_NAMES_DESC that has `count` entries
  // and includes "base" at the center (or just above center for even counts).
  const baseIdx = STEP_NAMES_DESC.indexOf("base");
  const halfBelow = Math.floor((count - 1) / 2);
  const halfAbove = count - 1 - halfBelow;
  const startIdx = baseIdx - halfBelow;
  const names = STEP_NAMES_DESC.slice(startIdx, startIdx + count);

  const steps: TypeStep[] = names.map((name, i) => {
    const offset = i - halfBelow; // 0 at base, positive above
    const px = basePx * Math.pow(ratio, offset);
    const minPx = Math.max(12, px * 0.78);
    const preview =
      offset <= -2
        ? "The quick brown fox"
        : offset <= 0
          ? "The quick brown fox jumps over the lazy dog"
          : offset <= 1
            ? "Headline copy"
            : "Display";
    return {
      name,
      px: Math.round(px * 100) / 100,
      rem: Math.round((px / 16) * 1000) / 1000,
      minPx: Math.round(minPx * 100) / 100,
      preview,
    };
  });
  return steps;
}

/** Build a clamp() expression for a fluid step. */
function buildClamp(step: TypeStep): string {
  const minRem = (step.minPx / 16).toFixed(3);
  const maxRem = step.rem.toFixed(3);
  // The vw portion: at 1200px viewport, size reaches max.
  const diffVw = ((step.px - step.minPx) / 12).toFixed(3);
  return `clamp(${minRem}rem, calc(${minRem}rem + ${diffVw}vw), ${maxRem}rem)`;
}

/** Build the :root CSS variables block from a type scale. */
function buildCssVars(
  steps: TypeStep[],
  fluid: boolean,
  basePx: number,
): string {
  const lines = steps.map((step) => {
    const value = fluid
      ? buildClamp(step)
      : `${step.rem}rem /* ${step.px}px */`;
    return `  --text-${step.name}: ${value};`;
  });
  lines.push(`  --font-base: ${(basePx / 16).toFixed(3)}rem;`);
  return `:root {\n${lines.join("\n")}\n}`;
}

/** Build the variable-font CSS snippet. */
function buildVariableFontCss(
  font: FontChoice,
  weight: number,
  opticalSize: number,
): string {
  const family =
    font === "Inter"
      ? '"Inter", system-ui, sans-serif'
      : font === "Geist"
        ? '"Geist", system-ui, sans-serif'
        : "system-ui, -apple-system, sans-serif";
  const lines = [
    "body {",
    `  font-family: ${family};`,
    `  font-weight: ${weight};`,
    `  font-optical-sizing: auto;`,
    `  font-variation-settings: "opsz" ${opticalSize}, "wght" ${weight};`,
    "}",
  ];
  return lines.join("\n");
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    if (typeof document === "undefined") return false;
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface LabeledRangeProps {
  label: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function LabeledRange({
  label,
  display,
  value,
  min,
  max,
  step,
  onChange,
}: LabeledRangeProps): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="font-mono text-xs text-foreground">{display}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? value)}
        aria-label={label}
      />
    </div>
  );
}

interface ScaleRowProps {
  step: TypeStep;
  fluid: boolean;
  fontStack: string;
}

function ScaleRow({ step, fluid, fontStack }: ScaleRowProps): React.JSX.Element {
  const fontSize = fluid ? buildClamp(step) : `${step.rem}rem`;
  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-border/60 px-3 py-3 last:border-b-0">
      <div className="col-span-3 sm:col-span-2">
        <span className="inline-flex h-6 items-center rounded-md border border-border bg-muted px-2 font-mono text-[11px] font-medium text-foreground">
          {step.name}
        </span>
      </div>
      <div className="col-span-3 hidden font-mono text-xs text-muted-foreground sm:block">
        {step.px.toFixed(2)}px
      </div>
      <div className="col-span-3 hidden font-mono text-xs text-muted-foreground sm:block">
        {step.rem.toFixed(3)}rem
      </div>
      <div className="col-span-6 truncate font-mono text-[11px] text-foreground sm:col-span-3">
        {fluid ? buildClamp(step) : `${step.rem}rem`}
      </div>
      <div
        className="col-span-12 truncate font-semibold text-foreground sm:col-span-2"
        style={{
          fontFamily: fontStack,
          fontSize,
          lineHeight: 1.1,
        }}
      >
        {step.preview}
      </div>
      {/* Hidden a11y description for screen readers */}
      <span className="sr-only">
        Step {step.name}: {step.px} pixels, {step.rem} rem
        {fluid ? `, fluid clamp ${buildClamp(step)}` : ""}.
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════

export function RoyTypography(): React.JSX.Element {
  const [basePx, setBasePx] = React.useState<number>(16);
  const [ratio, setRatio] = React.useState<ScaleRatio>(1.25);
  const [stepCount, setStepCount] = React.useState<StepCount>(7);
  const [fluid, setFluid] = React.useState<boolean>(true);

  // Variable font state
  const [font, setFont] = React.useState<FontChoice>("Inter");
  const [weight, setWeight] = React.useState<number>(450);
  const [opticalSize, setOpticalSize] = React.useState<number>(14);

  const [copiedVars, setCopiedVars] = React.useState<boolean>(false);
  const [copiedFont, setCopiedFont] = React.useState<boolean>(false);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const steps = React.useMemo(
    () => computeScale(basePx, ratio, stepCount),
    [basePx, ratio, stepCount],
  );

  const fontStack = React.useMemo(() => {
    switch (font) {
      case "Inter":
        return '"Inter", system-ui, sans-serif';
      case "Geist":
        return '"Geist", system-ui, sans-serif';
      case "system-ui":
        return "system-ui, -apple-system, sans-serif";
    }
  }, [font]);

  const cssVars = React.useMemo(
    () => buildCssVars(steps, fluid, basePx),
    [steps, fluid, basePx],
  );

  const variableFontCss = React.useMemo(
    () => buildVariableFontCss(font, weight, opticalSize),
    [font, weight, opticalSize],
  );

  const handleCopyVars = React.useCallback(async () => {
    const ok = await copyToClipboard(cssVars);
    if (ok) {
      setCopiedVars(true);
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedVars(false);
        copyTimeoutRef.current = null;
      }, 1800);
    }
  }, [cssVars]);

  const handleCopyFont = React.useCallback(async () => {
    const ok = await copyToClipboard(variableFontCss);
    if (ok) {
      setCopiedFont(true);
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedFont(false);
        copyTimeoutRef.current = null;
      }, 1800);
    }
  }, [variableFontCss]);

  return (
    <section
      aria-label="Roy Typography"
      className="mx-auto w-full max-w-6xl px-1 py-2"
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
          <TypeIcon className="size-5 text-emerald-500" aria-hidden />
          Roy Typography
        </h2>
        <p className="text-sm text-muted-foreground">
          Fluid type scale generator + variable font configurator · 5 modular
          scales · clamp() export · reading optimization tips.
        </p>
      </div>

      <Tabs defaultValue="scale">
        <TabsList className="mb-4">
          <TabsTrigger value="scale">Type Scale</TabsTrigger>
          <TabsTrigger value="font">Variable Font</TabsTrigger>
        </TabsList>

        {/* ─── Type Scale tab ─────────────────────────────────────── */}
        <TabsContent value="scale">
          {/* Controls */}
          <div className="mb-5 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 lg:grid-cols-3">
            <LabeledRange
              label="Base font size"
              display={`${basePx}px`}
              value={basePx}
              min={14}
              max={20}
              step={1}
              onChange={(v) => setBasePx(v)}
            />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Scale ratio
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {RATIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRatio(opt.value)}
                    aria-pressed={ratio === opt.value}
                    title={opt.description}
                    className={cn(
                      "inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium transition-colors",
                      ratio === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Step count
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {STEP_COUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStepCount(opt)}
                    aria-pressed={stepCount === opt}
                    className={cn(
                      "inline-flex h-8 w-9 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                      stepCount === opt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 lg:col-span-3">
              <div>
                <Label className="text-sm font-medium text-foreground">
                  Fluid (clamp)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Generates `clamp(min, preferred, max)` for each step —
                  scales smoothly from 320px → 1200px viewports.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={fluid}
                onClick={() => setFluid((f) => !f)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  fluid ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform",
                    fluid ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          </div>

          {/* Scale table */}
          <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-3 sm:col-span-2">Step</div>
              <div className="col-span-3 hidden sm:block">Pixels</div>
              <div className="col-span-3 hidden sm:block">REM</div>
              <div className="col-span-6 sm:col-span-3">Value</div>
              <div className="col-span-12 sm:col-span-2">Preview</div>
            </div>
            {steps.map((step) => (
              <ScaleRow
                key={step.name}
                step={step}
                fluid={fluid}
                fontStack={fontStack}
              />
            ))}
          </div>

          {/* CSS export */}
          <div className="rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                CSS variables
              </span>
              <Button
                size="sm"
                variant={copiedVars ? "secondary" : "outline"}
                onClick={handleCopyVars}
              >
                {copiedVars ? (
                  <>
                    <Check className="size-3.5" aria-hidden /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" aria-hidden /> Copy CSS variables
                  </>
                )}
              </Button>
            </div>
            <pre className="overflow-auto px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
              <code>{cssVars}</code>
            </pre>
          </div>
        </TabsContent>

        {/* ─── Variable Font tab ─────────────────────────────────── */}
        <TabsContent value="font">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Configurator */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Font</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FONT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFont(opt.value)}
                      aria-pressed={font === opt.value}
                      className={cn(
                        "inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors",
                        font === opt.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <LabeledRange
                label="Weight (wght axis)"
                display={`${weight}`}
                value={weight}
                min={100}
                max={900}
                step={50}
                onChange={(v) => setWeight(v)}
              />
              <LabeledRange
                label="Optical size (opsz axis)"
                display={`${opticalSize}`}
                value={opticalSize}
                min={8}
                max={144}
                step={1}
                onChange={(v) => setOpticalSize(v)}
              />

              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Note:
                  </span>{" "}
                  Inter and Geist ship variable weight axes. Geist also exposes
                  an `opsz` axis (8–144). `system-ui` falls back to the host
                  OS font (San Francisco / Segoe UI / Roboto).
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    CSS
                  </span>
                  <Button
                    size="sm"
                    variant={copiedFont ? "secondary" : "outline"}
                    onClick={handleCopyFont}
                  >
                    {copiedFont ? (
                      <>
                        <Check className="size-3.5" aria-hidden /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" aria-hidden /> Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="overflow-auto px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
                  <code>{variableFontCss}</code>
                </pre>
              </div>
            </div>

            {/* Specimen + tips */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/40 to-background">
                <div className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Specimen
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {font} · wght {weight} · opsz {opticalSize}
                  </span>
                </div>
                <div
                  className="space-y-3 p-5"
                  style={{
                    fontFamily: fontStack,
                    fontVariationSettings: `"opsz" ${opticalSize}, "wght" ${weight}`,
                    fontWeight: weight,
                    fontOpticalSizing: "auto",
                  }}
                >
                  <p
                    className="text-foreground"
                    style={{ fontSize: "2.5rem", lineHeight: 1.1 }}
                  >
                    The quick brown fox
                  </p>
                  <p
                    className="text-foreground"
                    style={{ fontSize: "1.25rem", lineHeight: 1.3 }}
                  >
                    jumps over the lazy dog
                  </p>
                  <p
                    className="text-muted-foreground"
                    style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
                  >
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz
                    0123456789 — RoyCSS variable font specimen.
                  </p>
                  <p
                    className="font-mono text-muted-foreground"
                    style={{ fontSize: "0.8rem" }}
                  >
                    $ roycss typography --font={font} --weight={weight} --opsz={opticalSize}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Reading optimization tips
                </h3>
                <ul className="space-y-2.5">
                  {READING_TIPS.map((tip) => (
                    <li key={tip.title} className="text-sm">
                      <span className="font-medium text-foreground">
                        {tip.title}
                      </span>
                      <span className="block text-[12px] text-muted-foreground">
                        {tip.body}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
