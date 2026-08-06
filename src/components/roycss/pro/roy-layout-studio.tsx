"use client";

/**
 * RoyLayoutStudio — a visual grid & layout builder.
 *
 * Self-contained (no props). Four layout modes (tabs):
 *
 *   • Grid — columns / rows / gap inputs plus a template-areas visual
 *     editor. Pick an area name from the palette, then paint cells on
 *     the grid. Live preview renders the resulting grid. Export emits
 *     the `grid-template-*` CSS.
 *
 *   • Flexbox — direction, wrap, justify-content, align-items, gap.
 *     Live preview shows 5 colored items reacting to every control.
 *
 *   • Masonry — CSS columns count + gap. Live preview of mixed-height
 *     cards using `columns` (the only widely-supported masonry-ish CSS).
 *
 *   • Container Queries — define 2–3 container breakpoints; preview
 *     shows the same component at three fixed widths side by side.
 *
 * Presets: Holy Grail, Sidebar, Dashboard, App Shell (4 total). Each
 * preset loads into the appropriate tab with its full configuration.
 *
 * SSR-safe. TS strict, zero `any`. No indigo / blue.
 */

import * as React from "react";
import {
  Check,
  Copy,
  Download,
  LayoutGrid,
  RotateCcw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type LayoutType = "grid" | "flex" | "masonry" | "container";

type FlexDirection =
  | "row"
  | "row-reverse"
  | "column"
  | "column-reverse";
type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
type JustifyContent =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";
type AlignItems =
  | "flex-start"
  | "center"
  | "flex-end"
  | "stretch"
  | "baseline";

interface GridState {
  cols: number;
  rows: number;
  gap: number;
  /** 2D array of area names — `rows` rows of `cols` cells. */
  areas: string[][];
}

interface FlexState {
  direction: FlexDirection;
  wrap: FlexWrap;
  justify: JustifyContent;
  align: AlignItems;
  gap: number;
}

interface MasonryState {
  columns: number;
  gap: number;
}

interface ContainerBreakpoint {
  id: string;
  name: string;
  /** Container min-width at which this breakpoint applies. */
  width: number;
  /** Grid columns to switch to at this breakpoint. */
  cols: number;
}

interface ContainerState {
  breakpoints: ContainerBreakpoint[];
}

interface StudioState {
  type: LayoutType;
  grid: GridState;
  flex: FlexState;
  masonry: MasonryState;
  container: ContainerState;
}

interface PresetSpec {
  id: string;
  name: string;
  description: string;
  type: LayoutType;
  state: StudioState;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}

const AREA_PALETTE: readonly {
  value: string;
  label: string;
  /** Tailwind classes for the cell tint. */
  tint: string;
  text: string;
}[] = [
  {
    value: "header",
    label: "Header",
    tint: "bg-emerald-200 dark:bg-emerald-950/50",
    text: "text-emerald-800 dark:text-emerald-200",
  },
  {
    value: "nav",
    label: "Nav",
    tint: "bg-teal-200 dark:bg-teal-950/50",
    text: "text-teal-800 dark:text-teal-200",
  },
  {
    value: "main",
    label: "Main",
    tint: "bg-cyan-200 dark:bg-cyan-950/50",
    text: "text-cyan-800 dark:text-cyan-200",
  },
  {
    value: "aside",
    label: "Aside",
    tint: "bg-amber-200 dark:bg-amber-950/50",
    text: "text-amber-800 dark:text-amber-200",
  },
  {
    value: "footer",
    label: "Footer",
    tint: "bg-rose-200 dark:bg-rose-950/50",
    text: "text-rose-800 dark:text-rose-200",
  },
  {
    value: "ad",
    label: "Ad",
    tint: "bg-violet-200 dark:bg-violet-950/50",
    text: "text-violet-800 dark:text-violet-200",
  },
  {
    value: "hero",
    label: "Hero",
    tint: "bg-pink-200 dark:bg-pink-950/50",
    text: "text-pink-800 dark:text-pink-200",
  },
  {
    value: ".",
    label: "Empty",
    tint: "bg-muted",
    text: "text-muted-foreground",
  },
] as const;

const AREA_TINT: Record<string, string> = AREA_PALETTE.reduce(
  (acc, p) => {
    acc[p.value] = p.tint;
    return acc;
  },
  {} as Record<string, string>,
);

const AREA_TEXT: Record<string, string> = AREA_PALETTE.reduce(
  (acc, p) => {
    acc[p.value] = p.text;
    return acc;
  },
  {} as Record<string, string>,
);

const FLEX_DIRECTION_OPTIONS: readonly {
  value: FlexDirection;
  label: string;
}[] = [
  { value: "row", label: "Row" },
  { value: "row-reverse", label: "Row Reverse" },
  { value: "column", label: "Column" },
  { value: "column-reverse", label: "Column Reverse" },
] as const;

const FLEX_WRAP_OPTIONS: readonly { value: FlexWrap; label: string }[] = [
  { value: "nowrap", label: "No Wrap" },
  { value: "wrap", label: "Wrap" },
  { value: "wrap-reverse", label: "Wrap Reverse" },
] as const;

const JUSTIFY_OPTIONS: readonly { value: JustifyContent; label: string }[] = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Between" },
  { value: "space-around", label: "Around" },
  { value: "space-evenly", label: "Evenly" },
] as const;

const ALIGN_OPTIONS: readonly { value: AlignItems; label: string }[] = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "stretch", label: "Stretch" },
  { value: "baseline", label: "Baseline" },
] as const;

const FLEX_ITEMS: readonly { id: string; label: string }[] = [
  { id: "a", label: "1" },
  { id: "b", label: "2" },
  { id: "c", label: "3" },
  { id: "d", label: "4" },
  { id: "e", label: "5" },
] as const;

const MASONRY_ITEMS: readonly { id: string; height: number; tint: string }[] = [
  { id: "m1", height: 90, tint: "bg-emerald-200 dark:bg-emerald-950/50" },
  { id: "m2", height: 130, tint: "bg-teal-200 dark:bg-teal-950/50" },
  { id: "m3", height: 70, tint: "bg-cyan-200 dark:bg-cyan-950/50" },
  { id: "m4", height: 110, tint: "bg-amber-200 dark:bg-amber-950/50" },
  { id: "m5", height: 150, tint: "bg-rose-200 dark:bg-rose-950/50" },
  { id: "m6", height: 80, tint: "bg-violet-200 dark:bg-violet-950/50" },
  { id: "m7", height: 100, tint: "bg-pink-200 dark:bg-pink-950/50" },
  { id: "m8", height: 120, tint: "bg-emerald-200 dark:bg-emerald-950/50" },
  { id: "m9", height: 95, tint: "bg-teal-200 dark:bg-teal-950/50" },
] as const;

const DEFAULT_STATE: StudioState = {
  type: "grid",
  grid: {
    cols: 3,
    rows: 3,
    gap: 8,
    areas: [
      ["header", "header", "header"],
      ["nav", "main", "aside"],
      ["footer", "footer", "footer"],
    ],
  },
  flex: {
    direction: "row",
    wrap: "wrap",
    justify: "flex-start",
    align: "stretch",
    gap: 8,
  },
  masonry: {
    columns: 3,
    gap: 12,
  },
  container: {
    breakpoints: [
      { id: "bp1", name: "sm", width: 320, cols: 1 },
      { id: "bp2", name: "md", width: 560, cols: 2 },
      { id: "bp3", name: "lg", width: 800, cols: 3 },
    ],
  },
};

// ─── Presets ──────────────────────────────────────────────────────────

function gridState(
  cols: number,
  rows: number,
  gap: number,
  areas: string[][],
): GridState {
  return { cols, rows, gap, areas };
}

const PRESETS: readonly PresetSpec[] = [
  {
    id: "holy-grail",
    name: "Holy Grail",
    description: "Header · Nav (left) · Main · Aside (right) · Footer",
    type: "grid",
    state: {
      ...DEFAULT_STATE,
      type: "grid",
      grid: gridState(3, 3, 8, [
        ["header", "header", "header"],
        ["nav", "main", "aside"],
        ["footer", "footer", "footer"],
      ]),
    },
  },
  {
    id: "sidebar",
    name: "Sidebar",
    description: "Fixed sidebar + scrollable main, flex row.",
    type: "flex",
    state: {
      ...DEFAULT_STATE,
      type: "flex",
      flex: {
        direction: "row",
        wrap: "nowrap",
        justify: "flex-start",
        align: "stretch",
        gap: 0,
      },
    },
  },
  {
    id: "dashboard",
    name: "Dashboard",
    description: "12-col grid with cards spanning multiple columns.",
    type: "grid",
    state: {
      ...DEFAULT_STATE,
      type: "grid",
      grid: gridState(4, 3, 12, [
        ["header", "header", "header", "header"],
        ["nav", "main", "main", "aside"],
        ["nav", "main", "main", "aside"],
      ]),
    },
  },
  {
    id: "app-shell",
    name: "App Shell",
    description: "Top bar + sidebar + content + status bar.",
    type: "grid",
    state: {
      ...DEFAULT_STATE,
      type: "grid",
      grid: gridState(4, 4, 6, [
        ["header", "header", "header", "header"],
        ["nav", "main", "main", "main"],
        ["nav", "main", "main", "main"],
        ["footer", "footer", "footer", "footer"],
      ]),
    },
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// CSS builders
// ═══════════════════════════════════════════════════════════════════════

function buildGridCss(g: GridState): string {
  const cols = `repeat(${g.cols}, minmax(0, 1fr))`;
  const rows = `repeat(${g.rows}, minmax(0, 1fr))`;
  const areaStrings = g.areas.map((row) => `"${row.join(" ")}"`).join("\n  ");
  return `.roy-grid {
  display: grid;
  grid-template-columns: ${cols};
  grid-template-rows: ${rows};
  grid-template-areas:
    ${areaStrings};
  gap: ${g.gap}px;
}

.roy-grid > [data-area="header"]  { grid-area: header; }
.roy-grid > [data-area="nav"]     { grid-area: nav; }
.roy-grid > [data-area="main"]    { grid-area: main; }
.roy-grid > [data-area="aside"]   { grid-area: aside; }
.roy-grid > [data-area="footer"]  { grid-area: footer; }
.roy-grid > [data-area="ad"]      { grid-area: ad; }
.roy-grid > [data-area="hero"]    { grid-area: hero; }`;
}

function buildFlexCss(f: FlexState): string {
  return `.roy-flex {
  display: flex;
  flex-direction: ${f.direction};
  flex-wrap: ${f.wrap};
  justify-content: ${f.justify};
  align-items: ${f.align};
  gap: ${f.gap}px;
}`;
}

function buildMasonryCss(m: MasonryState): string {
  return `.roy-masonry {
  columns: ${m.columns};
  column-gap: ${m.gap}px;
}

.roy-masonry > * {
  break-inside: avoid;
  margin-bottom: ${m.gap}px;
}`;
}

function buildContainerCss(c: ContainerState): string {
  const sorted = [...c.breakpoints].sort((a, b) => a.width - b.width);
  const base = sorted[0];
  const rest = sorted.slice(1);
  const baseCols = base?.cols ?? 1;
  const lines = [
    ".roy-container {",
    "  container-type: inline-size;",
    "  display: grid;",
    `  grid-template-columns: repeat(${baseCols}, minmax(0, 1fr));`,
    "  gap: 12px;",
    "}",
    "",
  ];
  for (const bp of rest) {
    lines.push(`@container (min-width: ${bp.width}px) {`);
    lines.push(`  .roy-container {`);
    lines.push(`    grid-template-columns: repeat(${bp.cols}, minmax(0, 1fr));`);
    lines.push(`  }`);
    lines.push(`}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function buildExportCss(state: StudioState): string {
  if (state.type === "grid") return buildGridCss(state.grid);
  if (state.type === "flex") return buildFlexCss(state.flex);
  if (state.type === "masonry") return buildMasonryCss(state.masonry);
  return buildContainerCss(state.container);
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

interface SegmentedProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={cn(
              "inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium transition-colors",
              value === opt.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface GridEditorProps {
  grid: GridState;
  onChange: (g: GridState) => void;
}

function GridEditor({ grid, onChange }: GridEditorProps): React.JSX.Element {
  const [paintValue, setPaintValue] = React.useState<string>("main");

  // Resize the areas 2D array when cols / rows change.
  const resizeAreas = React.useCallback(
    (cols: number, rows: number): string[][] => {
      const next: string[][] = [];
      for (let r = 0; r < rows; r += 1) {
        const row: string[] = [];
        for (let c = 0; c < cols; c += 1) {
          row.push(grid.areas[r]?.[c] ?? ".");
        }
        next.push(row);
      }
      return next;
    },
    [grid.areas],
  );

  const handleCols = React.useCallback(
    (cols: number) => {
      onChange({ ...grid, cols, areas: resizeAreas(cols, grid.rows) });
    },
    [grid, onChange, resizeAreas],
  );

  const handleRows = React.useCallback(
    (rows: number) => {
      onChange({ ...grid, rows, areas: resizeAreas(grid.cols, rows) });
    },
    [grid, onChange, resizeAreas],
  );

  const paintCell = React.useCallback(
    (r: number, c: number) => {
      const next = grid.areas.map((row) => [...row]);
      next[r][c] = paintValue;
      onChange({ ...grid, areas: next });
    },
    [grid, onChange, paintValue],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
        <LabeledRange
          label="Columns"
          display={`${grid.cols}`}
          value={grid.cols}
          min={1}
          max={8}
          step={1}
          onChange={handleCols}
        />
        <LabeledRange
          label="Rows"
          display={`${grid.rows}`}
          value={grid.rows}
          min={1}
          max={8}
          step={1}
          onChange={handleRows}
        />
        <LabeledRange
          label="Gap"
          display={`${grid.gap}px`}
          value={grid.gap}
          min={0}
          max={32}
          step={1}
          onChange={(v) => onChange({ ...grid, gap: v })}
        />

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Brush — click cells to paint
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {AREA_PALETTE.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPaintValue(p.value)}
                aria-pressed={paintValue === p.value}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
                  paintValue === p.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span
                  className={cn("size-3 rounded-sm", p.tint)}
                  aria-hidden
                />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/50 p-4">
        <Label className="mb-2 block text-xs text-muted-foreground">
          Template-areas editor
        </Label>
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
            gap: 4,
            aspectRatio: `${grid.cols} / ${grid.rows}`,
          }}
        >
          {grid.areas.map((row, r) =>
            row.map((cell, c) => {
              const tint = AREA_TINT[cell] ?? "bg-muted";
              const textCls = AREA_TEXT[cell] ?? "text-muted-foreground";
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => paintCell(r, c)}
                  className={cn(
                    "flex items-center justify-center rounded text-[10px] font-semibold transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    tint,
                    textCls,
                  )}
                  aria-label={`Row ${r + 1} column ${c + 1}: ${cell}`}
                >
                  {cell === "." ? "" : cell}
                </button>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

interface GridPreviewProps {
  grid: GridState;
}

function GridPreview({ grid }: GridPreviewProps): React.JSX.Element {
  // Build a unique list of area names in their first-occurrence order.
  const areaOrder = React.useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const row of grid.areas) {
      for (const cell of row) {
        if (cell !== "." && !seen.has(cell)) {
          seen.add(cell);
          ordered.push(cell);
        }
      }
    }
    return ordered;
  }, [grid.areas]);

  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-border bg-card p-3"
      style={{ minHeight: 220 }}
    >
      <div
        className="grid h-full"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
          gridTemplateAreas: grid.areas
            .map((row) => `"${row.join(" ")}"`)
            .join(" "),
          gap: grid.gap,
          minHeight: 200,
        }}
      >
        {areaOrder.map((name) => {
          const tint = AREA_TINT[name] ?? "bg-muted";
          const textCls = AREA_TEXT[name] ?? "text-muted-foreground";
          return (
            <div
              key={name}
              className={cn(
                "flex items-center justify-center rounded-md text-xs font-semibold capitalize",
                tint,
                textCls,
              )}
              style={{ gridArea: name }}
            >
              {name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FlexPreviewProps {
  flex: FlexState;
}

function FlexPreview({ flex }: FlexPreviewProps): React.JSX.Element {
  const isColumn =
    flex.direction === "column" || flex.direction === "column-reverse";
  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-border bg-card p-3"
      style={{ minHeight: 220 }}
    >
      <div
        className="flex min-h-[200px] rounded-md bg-muted/30 p-2"
        style={{
          flexDirection: flex.direction,
          flexWrap: flex.wrap,
          justifyContent: flex.justify,
          alignItems: flex.align,
          gap: flex.gap,
        }}
      >
        {FLEX_ITEMS.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-center rounded-md font-semibold text-foreground shadow-sm",
              [
                "bg-emerald-300 dark:bg-emerald-900/60",
                "bg-teal-300 dark:bg-teal-900/60",
                "bg-cyan-300 dark:bg-cyan-900/60",
                "bg-amber-300 dark:bg-amber-900/60",
                "bg-rose-300 dark:bg-rose-900/60",
              ][i % 5],
              isColumn ? "h-12 w-full" : "h-12 w-16",
            )}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MasonryPreviewProps {
  masonry: MasonryState;
}

function MasonryPreview({ masonry }: MasonryPreviewProps): React.JSX.Element {
  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-border bg-card p-3"
      style={{ minHeight: 220 }}
    >
      <div
        style={{
          columnCount: masonry.columns,
          columnGap: `${masonry.gap}px`,
        }}
      >
        {MASONRY_ITEMS.map((item) => (
          <div
            key={item.id}
            className={cn(
              "mb-3 flex items-center justify-center break-inside-avoid rounded-md font-semibold text-foreground shadow-sm",
              item.tint,
            )}
            style={{ height: item.height }}
          >
            {item.id.toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ContainerPreviewProps {
  container: ContainerState;
}

function ContainerPreview({
  container,
}: ContainerPreviewProps): React.JSX.Element {
  const sorted = React.useMemo(
    () => [...container.breakpoints].sort((a, b) => a.width - b.width),
    [container.breakpoints],
  );
  const widths = sorted.map((bp) => bp.width);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {sorted.map((bp, i) => {
        const nextWidth = widths[i + 1] ?? bp.width + 200;
        const cols = bp.cols;
        return (
          <div key={bp.id} className="rounded-lg border border-border bg-card/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {bp.name} breakpoint
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                ≥{bp.width}px → {bp.cols} col
                {bp.cols === 1 ? "" : "s"}
              </span>
            </div>
            <div
              className="overflow-hidden rounded-md border border-dashed border-border bg-muted/20 p-2"
              style={{
                width: "100%",
                containerType: "inline-size",
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gap: 6,
                }}
              >
                {Array.from({ length: Math.max(3, cols) }, (_, idx) => (
                  <div
                    key={idx}
                    className="flex h-12 items-center justify-center rounded bg-emerald-300 text-xs font-semibold text-foreground dark:bg-emerald-900/60"
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Width: {bp.width}px–{nextWidth}px
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════

export function RoyLayoutStudio(): React.JSX.Element {
  const [state, setState] = React.useState<StudioState>(() => ({
    ...DEFAULT_STATE,
    grid: {
      ...DEFAULT_STATE.grid,
      areas: DEFAULT_STATE.grid.areas.map((row) => [...row]),
    },
    container: {
      breakpoints: DEFAULT_STATE.container.breakpoints.map((bp) => ({
        ...bp,
        id: uid("bp"),
      })),
    },
  }));
  const [exportOpen, setExportOpen] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);
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

  const patchGrid = React.useCallback(
    (g: GridState) => setState((s) => ({ ...s, grid: g })),
    [],
  );
  const patchFlex = React.useCallback(
    (f: FlexState) => setState((s) => ({ ...s, flex: f })),
    [],
  );
  const patchMasonry = React.useCallback(
    (m: MasonryState) => setState((s) => ({ ...s, masonry: m })),
    [],
  );
  const patchContainer = React.useCallback(
    (c: ContainerState) => setState((s) => ({ ...s, container: c })),
    [],
  );
  const setType = React.useCallback(
    (t: LayoutType) => setState((s) => ({ ...s, type: t })),
    [],
  );

  const handleApplyPreset = React.useCallback((preset: PresetSpec) => {
    setState({
      ...preset.state,
      grid: {
        ...preset.state.grid,
        areas: preset.state.grid.areas.map((row) => [...row]),
      },
      container: {
        breakpoints: preset.state.container.breakpoints.map((bp) => ({
          ...bp,
          id: uid("bp"),
        })),
      },
    });
  }, []);

  const handleReset = React.useCallback(() => {
    setState({
      ...DEFAULT_STATE,
      grid: {
        ...DEFAULT_STATE.grid,
        areas: DEFAULT_STATE.grid.areas.map((row) => [...row]),
      },
      container: {
        breakpoints: DEFAULT_STATE.container.breakpoints.map((bp) => ({
          ...bp,
          id: uid("bp"),
        })),
      },
    });
  }, []);

  const exportCss = React.useMemo(
    () => buildExportCss(state),
    [state],
  );

  const handleCopy = React.useCallback(async () => {
    const ok = await copyToClipboard(exportCss);
    if (ok) {
      setCopied(true);
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 1800);
    }
  }, [exportCss]);

  const handleBreakpointChange = React.useCallback(
    (id: string, patch: Partial<ContainerBreakpoint>) => {
      patchContainer({
        breakpoints: state.container.breakpoints.map((bp) =>
          bp.id === id ? { ...bp, ...patch } : bp,
        ),
      });
    },
    [patchContainer, state.container.breakpoints],
  );

  return (
    <section
      aria-label="Roy Layout Studio"
      className="mx-auto w-full max-w-6xl px-1 py-2"
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
            <LayoutGrid className="size-5 text-emerald-500" aria-hidden />
            Roy Layout Studio
          </h2>
          <p className="text-sm text-muted-foreground">
            CSS Grid · Flexbox · Masonry · Container Queries — visual editor
            with live preview and CSS export.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            aria-label="Reset to defaults"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => setExportOpen(true)}
            aria-label="Open export dialog"
          >
            <Download className="size-3.5" aria-hidden />
            Export CSS
          </Button>
        </div>
      </div>

      {/* ─── Presets ─────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Presets:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleApplyPreset(p)}
            className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            title={p.description}
          >
            {p.name}
          </button>
        ))}
      </div>

      <Tabs
        value={state.type}
        onValueChange={(v) => setType(v as LayoutType)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="grid">CSS Grid</TabsTrigger>
          <TabsTrigger value="flex">Flexbox</TabsTrigger>
          <TabsTrigger value="masonry">Masonry</TabsTrigger>
          <TabsTrigger value="container">Container Queries</TabsTrigger>
        </TabsList>

        {/* ─── Grid ─────────────────────────────────────────────── */}
        <TabsContent value="grid">
          <div className="mb-4">
            <GridEditor grid={state.grid} onChange={patchGrid} />
          </div>
          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">
              Live preview
            </Label>
            <GridPreview grid={state.grid} />
          </div>
        </TabsContent>

        {/* ─── Flex ─────────────────────────────────────────────── */}
        <TabsContent value="flex">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
              <Segmented
                label="Direction"
                options={FLEX_DIRECTION_OPTIONS}
                value={state.flex.direction}
                onChange={(v) => patchFlex({ ...state.flex, direction: v })}
              />
              <Segmented
                label="Wrap"
                options={FLEX_WRAP_OPTIONS}
                value={state.flex.wrap}
                onChange={(v) => patchFlex({ ...state.flex, wrap: v })}
              />
              <Segmented
                label="Justify content"
                options={JUSTIFY_OPTIONS}
                value={state.flex.justify}
                onChange={(v) => patchFlex({ ...state.flex, justify: v })}
              />
              <Segmented
                label="Align items"
                options={ALIGN_OPTIONS}
                value={state.flex.align}
                onChange={(v) => patchFlex({ ...state.flex, align: v })}
              />
              <LabeledRange
                label="Gap"
                display={`${state.flex.gap}px`}
                value={state.flex.gap}
                min={0}
                max={32}
                step={1}
                onChange={(v) => patchFlex({ ...state.flex, gap: v })}
              />
            </div>
            <div>
              <Label className="mb-2 block text-xs text-muted-foreground">
                Live preview
              </Label>
              <FlexPreview flex={state.flex} />
            </div>
          </div>
        </TabsContent>

        {/* ─── Masonry ──────────────────────────────────────────── */}
        <TabsContent value="masonry">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-border bg-card/50 p-4">
              <LabeledRange
                label="Columns count"
                display={`${state.masonry.columns}`}
                value={state.masonry.columns}
                min={2}
                max={6}
                step={1}
                onChange={(v) => patchMasonry({ ...state.masonry, columns: v })}
              />
              <LabeledRange
                label="Gap"
                display={`${state.masonry.gap}px`}
                value={state.masonry.gap}
                min={0}
                max={32}
                step={1}
                onChange={(v) => patchMasonry({ ...state.masonry, gap: v })}
              />
              <div className="rounded-md border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Note:</span>{" "}
                Uses CSS <code className="font-mono">columns</code> — the
                most widely-supported masonry approximation. Native CSS
                masonry (<code className="font-mono">grid-template-rows:
                masonry</code>) is still behind a flag in most browsers.
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-xs text-muted-foreground">
                Live preview
              </Label>
              <MasonryPreview masonry={state.masonry} />
            </div>
          </div>
        </TabsContent>

        {/* ─── Container queries ────────────────────────────────── */}
        <TabsContent value="container">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <Label className="mb-3 block text-xs text-muted-foreground">
                Breakpoints
              </Label>
              <div className="space-y-3">
                {state.container.breakpoints.map((bp) => (
                  <div
                    key={bp.id}
                    className="grid grid-cols-1 gap-3 rounded-md border border-border bg-background p-3 sm:grid-cols-3"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">
                        Name
                      </Label>
                      <input
                        type="text"
                        value={bp.name}
                        onChange={(e) =>
                          handleBreakpointChange(bp.id, { name: e.target.value })
                        }
                        className="h-8 w-full rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Breakpoint ${bp.id} name`}
                      />
                    </div>
                    <LabeledRange
                      label="Min width"
                      display={`${bp.width}px`}
                      value={bp.width}
                      min={240}
                      max={1200}
                      step={20}
                      onChange={(v) =>
                        handleBreakpointChange(bp.id, { width: v })
                      }
                    />
                    <LabeledRange
                      label="Columns"
                      display={`${bp.cols}`}
                      value={bp.cols}
                      min={1}
                      max={6}
                      step={1}
                      onChange={(v) =>
                        handleBreakpointChange(bp.id, { cols: v })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-xs text-muted-foreground">
                Live preview (3 widths side by side)
              </Label>
              <ContainerPreview container={state.container} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Export dialog ───────────────────────────────────────── */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Export layout CSS</DialogTitle>
            <DialogDescription>
              Paste this block into your stylesheet. The export reflects the
              currently active tab ({state.type}).
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                CSS · {state.type}
              </span>
              <Button
                size="sm"
                variant={copied ? "secondary" : "outline"}
                onClick={handleCopy}
              >
                {copied ? (
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
            <pre className="max-h-96 overflow-auto px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
              <code>{exportCss}</code>
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
