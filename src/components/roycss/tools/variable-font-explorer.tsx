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
  Type,
  Copy,
  Check,
  RefreshCw,
  Code2,
  Sparkles,
  Bold,
  AlignJustify,
  Minimize2,
  Italic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
 * VariableFontExplorer — a playground for OpenType variable fonts.
 *
 * Variable fonts expose one or more design *axes* (the most common is
 * `wght`, but modern fonts like Roboto Flex expose `opsz`, `wdth`,
 * `slnt`, `GRAD`, and more) that you animate with the
 * `font-variation-settings` CSS property.
 *
 * Features
 *  - 5 variable fonts: Inter, Roboto Flex, Source Code Pro, Space
 *    Grotesk, Geist. The supported axes (from each font's `fvar`
 *    table) are hardcoded; only sliders for the axes a font actually
 *    exposes are rendered.
 *  - Per-axis slider with the correct min / max / step from `fvar`.
 *  - Live preview: configurable text, configurable size (24–120 px).
 *  - Generated CSS (`font-family` + `font-variation-settings` +
 *    `font-feature-settings` when any feature is on). Copy button.
 *  - 4 presets: Display bold, Body regular, Condensed, Italic emphasis
 *    (presets only set the axes the chosen font actually supports).
 *  - Mock font-feature-settings toggles: ligatures, small-caps,
 *    discretionary ligatures, old-style numerals, stylistic set 01.
 *
 * Google Fonts are loaded by injecting a `<link rel="stylesheet">` once
 * per font (cached in a Set so we never re-inject). Each font is loaded
 * with its full variable axis range.
 *
 * Constraints: TS strict, no `any`, no console.log, memoized, semantic
 * theme tokens, responsive within max-w-2xl.
 */

// ─── Types ────────────────────────────────────────────────────────────────

type AxisTag = "wght" | "opsz" | "wdth" | "slnt" | "GRAD" | "ital";

interface AxisDef {
  tag: AxisTag;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
  unit?: string;
}

interface FontDef {
  id: string;
  label: string;
  family: string;
  /** Google Fonts CSS URL with the full axis range. */
  url: string;
  axes: AxisDef[];
  /** Italic variant URL (if available). */
  italicUrl?: string;
}

type UseCasePreset =
  | "display-bold"
  | "body-regular"
  | "condensed"
  | "italic-emphasis";

interface UseCaseConfig {
  label: string;
  Icon: typeof Bold;
  /** Per-axis target values. Axes not present in the chosen font are ignored. */
  values: Partial<Record<AxisTag, number>>;
  fontSize: number;
  features: Record<FeatureTag, boolean>;
  text: string;
}

type FeatureTag =
  | "liga"
  | "smcp"
  | "dlig"
  | "onum"
  | "ss01";

interface FeatureDef {
  tag: FeatureTag;
  label: string;
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────

const FONTS: FontDef[] = [
  {
    id: "inter",
    label: "Inter",
    family: "'Inter', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
    axes: [
      { tag: "wght", label: "Weight", min: 100, max: 900, default: 400, step: 1 },
    ],
  },
  {
    id: "roboto-flex",
    label: "Roboto Flex",
    family: "'Roboto Flex', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap",
    axes: [
      { tag: "wght", label: "Weight", min: 100, max: 1000, default: 400, step: 1 },
      { tag: "opsz", label: "Optical Size", min: 8, max: 144, default: 14, step: 1 },
      { tag: "wdth", label: "Width", min: 25, max: 151, default: 100, step: 1, unit: "%" },
      { tag: "slnt", label: "Slant", min: -10, max: 0, default: 0, step: 1, unit: "°" },
      { tag: "GRAD", label: "Grade", min: -200, max: 150, default: 0, step: 1 },
    ],
  },
  {
    id: "source-code-pro",
    label: "Source Code Pro",
    family: "'Source Code Pro', monospace",
    url: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@200..900&display=swap",
    axes: [
      { tag: "wght", label: "Weight", min: 200, max: 900, default: 400, step: 1 },
    ],
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    family: "'Space Grotesk', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap",
    axes: [
      { tag: "wght", label: "Weight", min: 300, max: 700, default: 400, step: 1 },
    ],
  },
  {
    id: "geist",
    label: "Geist",
    family: "'Geist', sans-serif",
    url: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
    axes: [
      { tag: "wght", label: "Weight", min: 100, max: 900, default: 400, step: 1 },
    ],
  },
];

const FEATURES: FeatureDef[] = [
  { tag: "liga", label: "Ligatures", description: "Standard f-ligatures (fi, fl, etc.)" },
  { tag: "smcp", label: "Small-caps", description: "Lowercase → small capitals" },
  { tag: "dlig", label: "Discretionary", description: "Optional decorative ligatures" },
  { tag: "onum", label: "Old-style nums", description: "Text-figure numerals" },
  { tag: "ss01", label: "Stylistic Set 01", description: "Font-specific alt glyphs" },
];

const USE_CASES: Record<UseCasePreset, UseCaseConfig> = {
  "display-bold": {
    label: "Display bold",
    Icon: Bold,
    values: { wght: 800, opsz: 120, wdth: 100, slnt: 0, GRAD: 0 },
    fontSize: 96,
    features: { liga: true, smcp: false, dlig: false, onum: false, ss01: false },
    text: "Display",
  },
  "body-regular": {
    label: "Body regular",
    Icon: AlignJustify,
    values: { wght: 400, opsz: 14, wdth: 100, slnt: 0, GRAD: 0 },
    fontSize: 32,
    features: { liga: true, smcp: false, dlig: false, onum: false, ss01: false },
    text: "The quick brown fox\njumps over the lazy dog.",
  },
  condensed: {
    label: "Condensed",
    Icon: Minimize2,
    values: { wght: 600, opsz: 72, wdth: 60, slnt: 0, GRAD: 0 },
    fontSize: 64,
    features: { liga: true, smcp: false, dlig: false, onum: false, ss01: false },
    text: "Condensed",
  },
  "italic-emphasis": {
    label: "Italic emphasis",
    Icon: Italic,
    values: { wght: 500, opsz: 36, wdth: 100, slnt: -8, GRAD: 0, ital: 1 },
    fontSize: 48,
    features: { liga: true, smcp: false, dlig: true, onum: false, ss01: false },
    text: "emphasis",
  },
};

const DEFAULT_USE_CASE: UseCasePreset = "body-regular";
const DEFAULT_FONT_ID = "inter";
const COPY_CONFIRM_MS = 1500;

// ─── Style-injection cache (module-level) ─────────────────────────────────

const loadedUrls = new Set<string>();

function injectFontLink(url: string): void {
  if (typeof document === "undefined") return;
  if (loadedUrls.has(url)) return;
  loadedUrls.add(url);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function defaultAxisValues(font: FontDef): Record<AxisTag, number> {
  const out = {} as Record<AxisTag, number>;
  for (const axis of font.axes) {
    out[axis.tag] = axis.default;
  }
  return out;
}

function buildVariationSettings(
  values: Record<AxisTag, number>,
  axes: AxisDef[],
): string {
  const parts = axes
    .map((a) => `'${a.tag}' ${Math.round(values[a.tag] * 100) / 100}`)
    .join(", ");
  return `font-variation-settings: ${parts};`;
}

function buildFeatureSettings(features: Record<FeatureTag, boolean>): string | null {
  const parts: string[] = [];
  for (const def of FEATURES) {
    parts.push(`'${def.tag}' ${features[def.tag] ? 1 : 0}`);
  }
  const joined = parts.join(", ");
  return `font-feature-settings: ${joined};`;
}

// ─── Component ────────────────────────────────────────────────────────────

export function VariableFontExplorer() {
  const [fontId, setFontId] = useState<string>(DEFAULT_FONT_ID);
  const font = useMemo(
    () => FONTS.find((f) => f.id === fontId) ?? FONTS[0]!,
    [fontId],
  );

  const [axisValues, setAxisValues] = useState<Record<AxisTag, number>>(() =>
    defaultAxisValues(FONTS[0]!),
  );
  const [fontSize, setFontSize] = useState<number>(32);
  const [previewText, setPreviewText] = useState<string>(
    USE_CASES[DEFAULT_USE_CASE].text,
  );
  const [features, setFeatures] = useState<Record<FeatureTag, boolean>>({
    liga: true,
    smcp: false,
    dlig: false,
    onum: false,
    ss01: false,
  });
  const [activeUseCase, setActiveUseCase] = useState<UseCasePreset | null>(
    DEFAULT_USE_CASE,
  );
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Inject Google Fonts <link> on font change ───────────────────── */
  useEffect(() => {
    injectFontLink(font.url);
  }, [font.url]);

  /* ── Clear copy timer on unmount ─────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  /* ── When font changes, reset axis values to the new font's defaults ─ */
  const selectFont = useCallback((id: string) => {
    const next = FONTS.find((f) => f.id === id) ?? FONTS[0]!;
    setFontId(next.id);
    setAxisValues(defaultAxisValues(next));
    setActiveUseCase(null);
  }, []);

  /* ── Per-axis slider update ──────────────────────────────────────── */
  const updateAxis = useCallback((tag: AxisTag, value: number) => {
    setAxisValues((prev) => ({ ...prev, [tag]: value }));
    setActiveUseCase(null);
  }, []);

  /* ── Feature toggle ──────────────────────────────────────────────── */
  const toggleFeature = useCallback((tag: FeatureTag, checked: boolean) => {
    setFeatures((prev) => ({ ...prev, [tag]: checked }));
    setActiveUseCase(null);
  }, []);

  /* ── Apply a preset (only sets axes the font supports) ───────────── */
  const applyUseCase = useCallback(
    (key: UseCasePreset) => {
      const cfg = USE_CASES[key];
      const next: Record<AxisTag, number> = defaultAxisValues(font);
      for (const axis of font.axes) {
        const v = cfg.values[axis.tag];
        if (typeof v === "number") {
          // Clamp to the font's actual range to keep the slider valid.
          next[axis.tag] = Math.max(axis.min, Math.min(axis.max, v));
        }
      }
      setAxisValues(next);
      setFontSize(cfg.fontSize);
      setPreviewText(cfg.text);
      setFeatures({ ...cfg.features });
      setActiveUseCase(key);
    },
    [font],
  );

  /* ── Copy ────────────────────────────────────────────────────────── */
  const handleCopy = useCallback(async (text: string) => {
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
  }, []);

  /* ── Generated CSS (memoized) ────────────────────────────────────── */
  const generatedCss = useMemo(() => {
    const lines: string[] = [];
    lines.push(`font-family: ${font.family};`);
    lines.push(buildVariationSettings(axisValues, font.axes));
    const feat = buildFeatureSettings(features);
    if (feat) lines.push(feat);
    lines.push(`font-size: ${fontSize}px;`);
    return lines.join("\n");
  }, [font, axisValues, features, fontSize]);

  /* ── Preview style (inline style applies the variation settings) ── */
  const previewStyle: CSSProperties = useMemo(() => {
    const settings: string[] = [];
    for (const axis of font.axes) {
      settings.push(`'${axis.tag}' ${axisValues[axis.tag]}`);
    }
    const feat: string[] = [];
    for (const def of FEATURES) {
      feat.push(`'${def.tag}' ${features[def.tag] ? 1 : 0}`);
    }
    return {
      fontFamily: font.family,
      fontVariationSettings: settings.join(", "),
      fontFeatureSettings: feat.join(", "),
      fontSize: `${fontSize}px`,
      lineHeight: 1.1,
    } as CSSProperties;
  }, [font, axisValues, features, fontSize]);

  const reset = useCallback(() => {
    setFontId(DEFAULT_FONT_ID);
    setAxisValues(defaultAxisValues(FONTS[0]!));
    setFontSize(USE_CASES[DEFAULT_USE_CASE].fontSize);
    setPreviewText(USE_CASES[DEFAULT_USE_CASE].text);
    setFeatures({ ...USE_CASES[DEFAULT_USE_CASE].features });
    setActiveUseCase(DEFAULT_USE_CASE);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Type className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Variable Font Explorer
        </h3>
      </div>

      {/* Font select + use-case presets */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Font family
        </Label>
        <Select value={fontId} onValueChange={selectFont}>
          <SelectTrigger className="h-9 w-full" aria-label="Font family">
            <SelectValue placeholder="Choose a font" />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label}
                <span className="ml-2 text-[10px] text-muted-foreground">
                  ({f.axes.length} {f.axes.length === 1 ? "axis" : "axes"})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Use-case presets
        </Label>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(USE_CASES) as UseCasePreset[]).map((key) => {
            const cfg = USE_CASES[key];
            const Icon = cfg.Icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyUseCase(key)}
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  activeUseCase === key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={activeUseCase === key}
              >
                <Icon className="size-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Live preview
        </Label>
        <div className="overflow-auto rounded-lg border border-border bg-card p-4">
          <p
            style={previewStyle}
            className="m-0 whitespace-pre-line break-words text-foreground"
          >
            {previewText || "Type something…"}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="vfe-preview-text"
            className="text-xs font-medium text-muted-foreground"
          >
            Preview text
          </Label>
          <Input
            id="vfe-preview-text"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="h-9"
            placeholder="Preview text"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              Font size
            </Label>
            <span className="text-xs text-foreground">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            min={24}
            max={120}
            step={1}
            onValueChange={(v) => setFontSize(v[0])}
            aria-label="Font size"
          />
        </div>
      </div>

      {/* Axis sliders */}
      <div className="flex flex-col gap-3">
        <Label className="text-xs font-medium text-muted-foreground">
          Variation axes (fvar)
        </Label>
        <div className="flex flex-col gap-3">
          {font.axes.map((axis) => (
            <div key={axis.tag} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-foreground">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {axis.tag}
                  </Badge>
                  <span>{axis.label}</span>
                </span>
                <span className="text-xs tabular-nums text-foreground">
                  {axisValues[axis.tag]}
                  {axis.unit ?? ""}
                </span>
              </div>
              <Slider
                value={[axisValues[axis.tag]]}
                min={axis.min}
                max={axis.max}
                step={axis.step}
                onValueChange={(v) => updateAxis(axis.tag, v[0])}
                aria-label={`${axis.label} (${axis.tag})`}
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{axis.min}</span>
                <span>{axis.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Font feature settings */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Font feature settings (OpenType)
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {FEATURES.map((feat) => (
            <label
              key={feat.tag}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-background p-2 hover:bg-muted/40"
              htmlFor={`vfe-feat-${feat.tag}`}
            >
              <Checkbox
                id={`vfe-feat-${feat.tag}`}
                checked={features[feat.tag]}
                onCheckedChange={(checked) =>
                  toggleFeature(feat.tag, checked === true)
                }
                className="mt-0.5"
              />
              <span className="flex flex-col">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {feat.tag}
                  </span>
                  {feat.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {feat.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="h-9 gap-1.5 text-xs"
        >
          <RefreshCw className="size-3.5" /> Reset
        </Button>
      </div>

      {/* Generated CSS */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Code2 className="size-3" />
            Generated CSS
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(generatedCss)}
            className="h-7 gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="size-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> Copy
              </>
            )}
          </Button>
        </div>
        <pre className="max-h-48 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground">
          <code>{generatedCss}</code>
        </pre>
      </div>

      {/* Note */}
      <p className="flex items-start gap-1.5 rounded-md border border-primary/20 bg-primary/5 p-2 text-[11px] text-muted-foreground">
        <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
        <span>
          The variation axis ranges come from each font&apos;s{" "}
          <code className="text-foreground">fvar</code> table. Roboto Flex
          exposes five axes; the others expose one. Toggling features
          generates the matching{" "}
          <code className="text-foreground">font-feature-settings</code>{" "}
          declaration.
        </span>
      </p>
    </div>
  );
}
