"use client";

/**
 * LogicalPropertiesMapper — Map physical CSS properties (margin-left,
 * padding-right, width, top) to their logical equivalents
 * (margin-inline-start, padding-inline-end, inline-size, inset-block-start)
 * and demonstrate how they adapt to writing-mode and direction (LTR / RTL /
 * vertical).
 *
 * ## Why logical properties?
 *
 * Physical CSS properties (`margin-left`, `padding-right`, `width`, `top`)
 * always point at a fixed physical edge of the viewport. That breaks
 * internationalization: an Arabic or Hebrew UI laid out right-to-left needs
 * the *same* spacing rules mirrored, not rewritten. Logical properties
 * (`margin-inline-start`, `padding-inline-end`, `inline-size`,
 * `inset-block-start`) reference the **inline** and **block** axes of the
 * current writing mode instead:
 *
 *   - In `horizontal-tb` + LTR, `inline-start` = left, `block-start` = top.
 *   - In `horizontal-tb` + RTL, `inline-start` = right, `block-start` = top.
 *   - In `vertical-rl` + LTR, `inline-start` = top, `block-start` = right.
 *
 * Switch `direction` or `writing-mode` and the logical styles adapt
 * automatically — no second stylesheet, no `:dir()` overrides. This tool:
 *
 *   1. Renders two side-by-side preview boxes — one styled with physical
 *      properties, the other with logical — so you can see the logical box
 *      adapt to direction/writing-mode changes while the physical box stays
 *      anchored to the left edge.
 *   2. Provides a direction toggle (LTR / RTL) and a writing-mode selector
 *      (horizontal-tb / vertical-rl / vertical-lr).
 *   3. Shows a full mapping table (margin, padding, border, width, height,
 *      top, left, right, bottom, text-align, float, clear, overflow) with a
 *      search filter.
 *   4. Generates the logical CSS for the current configuration with a copy
 *      button.
 *   5. Offers a paste-physical-CSS → get-logical-CSS conversion box.
 *   6. Ships 4 presets (card-component, nav-bar, form-field, media-object).
 *
 * Logical properties are Baseline 2020 — universal in all modern browsers
 * (Chrome 87+, Firefox 66+, Safari 15+, Edge 87+).
 *
 * Implementation notes:
 *   - All data is hard-coded (no network). TS strict, no `any`, no
 *     `console.log`. Self-contained (no props, no external state).
 *   - The preview boxes apply `writing-mode` + `direction` to the colored
 *     box itself so that logical properties on the box resolve to the correct
 *     physical side, while the wrapper stays in `horizontal-tb` so the box
 *     position remains comparable across configurations.
 *   - Clipboard writes are best-effort (try/catch silent fallback). Copy
 *     timer tracked via `useRef` and cleared on unmount.
 *   - Responsive within `max-w-2xl`.
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
  Copy,
  Check,
  Languages,
  FlipHorizontal,
  Search,
  Wand2,
  ArrowRight,
  Globe,
  RotateCcw,
  AlignVerticalJustifyCenter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

type Direction = "ltr" | "rtl";
type WritingMode = "horizontal-tb" | "vertical-rl" | "vertical-lr";

interface MappingRow {
  physical: string;
  logical: string;
  group: string;
  note?: string;
}

interface Preset {
  id: string;
  label: string;
  description: string;
  css: string;
}

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

const WRITING_MODES: ReadonlyArray<{
  key: WritingMode;
  label: string;
  hint: string;
}> = [
  {
    key: "horizontal-tb",
    label: "horizontal-tb",
    hint: "Top-to-bottom block flow (Latin, CJK default)",
  },
  {
    key: "vertical-rl",
    label: "vertical-rl",
    hint: "Right-to-left columns (Japanese, Chinese)",
  },
  {
    key: "vertical-lr",
    label: "vertical-lr",
    hint: "Left-to-right columns (Mongolian, Manchu)",
  },
];

const MAPPINGS: ReadonlyArray<MappingRow> = [
  // margin
  { physical: "margin-left", logical: "margin-inline-start", group: "margin", note: "flips in RTL" },
  { physical: "margin-right", logical: "margin-inline-end", group: "margin", note: "flips in RTL" },
  { physical: "margin-top", logical: "margin-block-start", group: "margin", note: "block axis" },
  { physical: "margin-bottom", logical: "margin-block-end", group: "margin", note: "block axis" },
  // padding
  { physical: "padding-left", logical: "padding-inline-start", group: "padding", note: "flips in RTL" },
  { physical: "padding-right", logical: "padding-inline-end", group: "padding", note: "flips in RTL" },
  { physical: "padding-top", logical: "padding-block-start", group: "padding", note: "block axis" },
  { physical: "padding-bottom", logical: "padding-block-end", group: "padding", note: "block axis" },
  // border
  { physical: "border-left", logical: "border-inline-start", group: "border" },
  { physical: "border-left-width", logical: "border-inline-start-width", group: "border" },
  { physical: "border-left-color", logical: "border-inline-start-color", group: "border" },
  { physical: "border-right", logical: "border-inline-end", group: "border" },
  { physical: "border-top", logical: "border-block-start", group: "border" },
  { physical: "border-bottom", logical: "border-block-end", group: "border" },
  // sizing
  { physical: "width", logical: "inline-size", group: "sizing", note: "inline axis" },
  { physical: "height", logical: "block-size", group: "sizing", note: "block axis" },
  { physical: "min-width", logical: "min-inline-size", group: "sizing" },
  { physical: "min-height", logical: "min-block-size", group: "sizing" },
  { physical: "max-width", logical: "max-inline-size", group: "sizing" },
  { physical: "max-height", logical: "max-block-size", group: "sizing" },
  // inset
  { physical: "top", logical: "inset-block-start", group: "inset", note: "block axis" },
  { physical: "bottom", logical: "inset-block-end", group: "inset", note: "block axis" },
  { physical: "left", logical: "inset-inline-start", group: "inset", note: "flips in RTL" },
  { physical: "right", logical: "inset-inline-end", group: "inset", note: "flips in RTL" },
  // text / layout
  { physical: "text-align: left", logical: "text-align: start", group: "layout", note: "keyword" },
  { physical: "text-align: right", logical: "text-align: end", group: "layout", note: "keyword" },
  { physical: "float: left", logical: "float: inline-start", group: "layout", note: "keyword" },
  { physical: "float: right", logical: "float: inline-end", group: "layout", note: "keyword" },
  { physical: "clear: left", logical: "clear: inline-start", group: "layout", note: "keyword" },
  { physical: "clear: right", logical: "clear: inline-end", group: "layout", note: "keyword" },
  { physical: "overflow-x", logical: "overflow-inline", group: "layout" },
  { physical: "overflow-y", logical: "overflow-block", group: "layout" },
];

/** Physical → Logical property name lookup, used by the conversion feature. */
const PHYSICAL_TO_LOGICAL_PROP: Record<string, string> = MAPPINGS.reduce(
  (acc, row) => {
    // Skip value-pairs (e.g. "text-align: left")
    if (!row.physical.includes(":")) {
      acc[row.physical] = row.logical;
    }
    return acc;
  },
  {} as Record<string, string>,
);

const PRESETS: ReadonlyArray<Preset> = [
  {
    id: "card-component",
    label: "card-component",
    description: "Card with media + content",
    css: [
      ".card {",
      "  margin-bottom: 1rem;",
      "  padding-left: 1.5rem;",
      "  padding-right: 1.5rem;",
      "  border-top: 1px solid #ddd;",
      "  width: 320px;",
      "}",
    ].join("\n"),
  },
  {
    id: "nav-bar",
    label: "nav-bar",
    description: "Horizontal nav with links",
    css: [
      ".nav {",
      "  padding-left: 1rem;",
      "  padding-right: 1rem;",
      "  text-align: left;",
      "}",
      ".nav .logo {",
      "  float: left;",
      "  margin-right: 1rem;",
      "}",
    ].join("\n"),
  },
  {
    id: "form-field",
    label: "form-field",
    description: "Label + input row",
    css: [
      ".field {",
      "  margin-bottom: 0.75rem;",
      "  padding-left: 0.5rem;",
      "}",
      ".field label {",
      "  width: 120px;",
      "  text-align: right;",
      "  margin-right: 0.5rem;",
      "}",
    ].join("\n"),
  },
  {
    id: "media-object",
    label: "media-object",
    description: "Image left, text right",
    css: [
      ".media {",
      "  padding-left: 1rem;",
      "  padding-right: 1rem;",
      "}",
      ".media .img {",
      "  float: left;",
      "  margin-right: 1rem;",
      "  width: 80px;",
      "  height: 80px;",
      "}",
      ".media .body {",
      "  overflow-x: hidden;",
      "}",
    ].join("\n"),
  },
];

// ============================================================
// Pure helpers
// ============================================================

/** Convert a chunk of physical CSS to logical CSS, line by line. */
function convertPhysicalToLogical(input: string): string {
  const lines = input.split("\n");
  return lines.map(convertLine).join("\n");
}

function convertLine(line: string): string {
  const match = line.match(/^(\s*)([-\w]+)(\s*:\s*)(.*)$/);
  if (!match) return line;
  const [, indent, prop, sep, value] = match;
  const newProp = PHYSICAL_TO_LOGICAL_PROP[prop] ?? prop;
  const newValue = convertValue(prop, value);
  return `${indent}${newProp}${sep}${newValue}`;
}

function convertValue(prop: string, value: string): string {
  if (prop === "text-align") {
    return value.replace(/\bleft\b/g, "start").replace(/\bright\b/g, "end");
  }
  if (prop === "float" || prop === "clear") {
    return value
      .replace(/\bleft\b/g, "inline-start")
      .replace(/\bright\b/g, "inline-end");
  }
  return value;
}

function buildGeneratedCSS(direction: Direction, writingMode: WritingMode): string {
  return [
    ".logical-box {",
    "  /* adapts to direction + writing-mode automatically */",
    "  margin-inline-start: 1.5rem;",
    "  padding-inline-start: 1rem;",
    "  padding-inline-end: 1rem;",
    "  margin-block-end: 1rem;",
    "  inline-size: 320px;",
    "  border-block-start: 1px solid #ddd;",
    `  direction: ${direction};`,
    `  writing-mode: ${writingMode};`,
    "}",
  ].join("\n");
}

// ============================================================
// Sub-components
// ============================================================

interface PreviewBoxProps {
  mode: "physical" | "logical";
  direction: Direction;
  writingMode: WritingMode;
}

/**
 * A single preview box. The colored inner box applies `writing-mode` +
 * `direction` directly so its logical properties resolve to the correct
 * physical side. The wrapper stays in horizontal-tb so both boxes occupy the
 * same position for easy comparison.
 *
 * Layout legend:
 *   - amber wrapper background = margin area (visible gap from edge)
 *   - primary-tinted box       = padding area
 *   - solid primary badge "A"  = the inline-start content
 */
function PreviewBox({ mode, direction, writingMode }: PreviewBoxProps) {
  const isLogical = mode === "logical";

  const boxStyle: CSSProperties = isLogical
    ? {
        marginInlineStart: "24px",
        paddingInlineStart: "16px",
        paddingInlineEnd: "8px",
        marginBlockEnd: "12px",
        borderBlockStart: "2px solid var(--primary)",
      }
    : {
        marginLeft: "24px",
        paddingLeft: "16px",
        paddingRight: "8px",
        marginBottom: "12px",
        borderTop: "2px solid var(--primary)",
      };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">
          {isLogical ? "Logical properties" : "Physical properties"}
        </Label>
        <Badge
          variant="outline"
          className={cn(
            "px-1.5 py-0 text-[10px] font-medium",
            isLogical
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
          )}
        >
          {isLogical ? "adapts" : "static"}
        </Badge>
      </div>
      <div
        className="overflow-hidden rounded-md border border-dashed border-amber-500/40 bg-amber-500/10"
        style={{ minHeight: "170px" }}
        aria-label={`${mode} preview, ${direction} ${writingMode}`}
      >
        <div
          dir={direction}
          style={
            {
              writingMode,
              ...boxStyle,
              width: "140px",
              height: "90px",
              background:
                "color-mix(in srgb, var(--primary) 15%, transparent)",
            } as CSSProperties
          }
        >
          <span className="inline-flex size-8 items-center justify-center rounded bg-primary text-sm font-semibold text-primary-foreground">
            A
          </span>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {isLogical
          ? "margin-inline-start · padding-inline-start · border-block-start adapt to direction + writing-mode."
          : "margin-left · padding-left · border-top always anchor to the left/top edge."}
      </p>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function LogicalPropertiesMapper() {
  const [direction, setDirection] = useState<Direction>("ltr");
  const [writingMode, setWritingMode] = useState<WritingMode>("horizontal-tb");
  const [search, setSearch] = useState<string>("");
  const [conversionInput, setConversionInput] = useState<string>(PRESETS[0].css);
  const [copied, setCopied] = useState<boolean>(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const generatedCSS = useMemo(
    () => buildGeneratedCSS(direction, writingMode),
    [direction, writingMode],
  );

  const conversionOutput = useMemo(
    () => convertPhysicalToLogical(conversionInput),
    [conversionInput],
  );

  const filteredMappings = useMemo<ReadonlyArray<MappingRow>>(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return MAPPINGS;
    return MAPPINGS.filter(
      (row) =>
        row.physical.toLowerCase().includes(term) ||
        row.logical.toLowerCase().includes(term) ||
        row.group.toLowerCase().includes(term),
    );
  }, [search]);

  const activePreset = useMemo<string | null>(() => {
    return PRESETS.find((p) => p.css === conversionInput)?.id ?? null;
  }, [conversionInput]);

  const handleCopy = useCallback(() => {
    try {
      void navigator.clipboard.writeText(generatedCSS).then(() => {
        setCopied(true);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
      });
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [generatedCSS]);

  const applyPreset = useCallback((preset: Preset) => {
    setConversionInput(preset.css);
  }, []);

  const isRtl = direction === "rtl";

  return (
    <Card className="mx-auto w-full max-w-2xl gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Languages className="size-5 text-primary" aria-hidden="true" />
          Logical Properties Mapper
        </CardTitle>
        <CardDescription className="mt-1">
          Map physical properties (margin-left, width, top) to logical
          equivalents (margin-inline-start, inline-size, inset-block-start)
          that adapt to writing-mode and direction.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Controls */}
        <section
          aria-labelledby="controls-label"
          className="flex flex-wrap items-end gap-4"
        >
          <h3 id="controls-label" className="sr-only">
            Direction and writing mode controls
          </h3>

          <div className="flex items-center gap-2">
            <Label
              htmlFor="direction-switch"
              className="min-w-[2.5rem] font-mono text-xs"
            >
              {isRtl ? "RTL" : "LTR"}
            </Label>
            <Switch
              id="direction-switch"
              checked={isRtl}
              onCheckedChange={(checked) =>
                setDirection(checked ? "rtl" : "ltr")
              }
              aria-label="Toggle between left-to-right and right-to-left direction"
            />
            <FlipHorizontal
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label
              htmlFor="writing-mode-select"
              className="text-xs text-muted-foreground"
            >
              Writing mode
            </Label>
            <Select
              value={writingMode}
              onValueChange={(v) => setWritingMode(v as WritingMode)}
            >
              <SelectTrigger
                id="writing-mode-select"
                size="sm"
                className="w-44"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WRITING_MODES.map((wm) => (
                  <SelectItem key={wm.key} value={wm.key}>
                    {wm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge
            variant="outline"
            className="ml-auto gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            title="Logical properties are universally supported since 2020"
          >
            <Globe className="size-3.5" aria-hidden="true" />
            Baseline 2020 — universal
          </Badge>
        </section>

        {/* Preview boxes */}
        <section
          aria-labelledby="preview-label"
          className="flex flex-col gap-2"
        >
          <Label
            id="preview-label"
            className="flex items-center gap-1.5 text-sm font-medium"
          >
            <AlignVerticalJustifyCenter
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Side-by-side preview
          </Label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PreviewBox
              mode="physical"
              direction={direction}
              writingMode={writingMode}
            />
            <PreviewBox
              mode="logical"
              direction={direction}
              writingMode={writingMode}
            />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Both boxes apply the <em>same</em> direction and writing-mode. The
            logical box&apos;s margin, padding, and border move with the
            inline/block axes; the physical box&apos;s stay anchored to the
            left/top edge — that&apos;s the i18n bug logical properties fix.
          </p>
        </section>

        {/* Mapping table */}
        <section
          aria-labelledby="mapping-label"
          className="flex flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <Label
              id="mapping-label"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
              Physical → Logical mapping
            </Label>
            <div className="relative">
              <Search
                className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter…"
                className="h-8 w-32 pl-7 text-xs"
                aria-label="Filter mapping table"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border border-border bg-background">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                    Physical
                  </th>
                  <th className="px-2 py-1.5" aria-label="maps to" />
                  <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                    Logical
                  </th>
                  <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMappings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-xs text-muted-foreground"
                    >
                      No mappings match &ldquo;{search}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredMappings.map((row, i) => (
                    <tr
                      key={`${row.physical}-${i}`}
                      className="border-t border-border/60"
                    >
                      <td className="px-3 py-1.5 font-mono text-[11px] text-foreground">
                        {row.physical}
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground">
                        <ArrowRight
                          className="size-3"
                          aria-hidden="true"
                        />
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-primary">
                        {row.logical}
                      </td>
                      <td className="px-3 py-1.5 text-[10px] text-muted-foreground">
                        {row.note ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Generated CSS */}
        <section
          aria-labelledby="gen-label"
          className="flex flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <Label
              id="gen-label"
              htmlFor="generated-css"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Languages
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Generated logical CSS
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
              aria-label="Copy generated CSS to clipboard"
            >
              {copied ? (
                <Check
                  className="size-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre
            id="generated-css"
            className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground"
          >
            <code>{generatedCSS}</code>
          </pre>
        </section>

        {/* Conversion feature */}
        <section
          aria-labelledby="convert-label"
          className="flex flex-col gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <Label
              id="convert-label"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Wand2
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Conversion: physical → logical
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setConversionInput("")}
              aria-label="Clear conversion input"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              Clear
            </Button>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map((preset) => {
              const active = activePreset === preset.id;
              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className="h-auto flex-col items-start gap-0.5 py-2 text-left"
                  onClick={() => applyPreset(preset)}
                  aria-pressed={active}
                >
                  <span className="font-mono text-[10px] font-semibold">
                    {preset.label}
                  </span>
                  <span className="text-[9px] font-normal opacity-80">
                    {preset.description}
                  </span>
                </Button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Physical input
              </span>
              <Textarea
                value={conversionInput}
                onChange={(e) => setConversionInput(e.target.value)}
                placeholder="Paste physical CSS here…"
                className="min-h-[12rem] resize-y font-mono text-xs leading-relaxed"
                spellCheck={false}
                aria-label="Physical CSS input for conversion"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Logical output
              </span>
              <pre className="min-h-[12rem] overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
                <code>{conversionOutput}</code>
              </pre>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
