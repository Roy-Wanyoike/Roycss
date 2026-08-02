"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutGrid,
  Copy,
  Check,
  Trash2,
  Plus,
  Eraser,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Paintbrush,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * GridAreasBuilder — a visual editor for the CSS `grid-template-areas` property.
 *
 * The user draws a 2D "map" of named areas by painting cells with a current
 * brush (selected from the palette) or by double-clicking a cell to rename it
 * inline. Drag-select paints a rectangular range with the current brush.
 *
 * Output:
 *   - A live, read-only CSS block (`display: grid; grid-template-columns: …;
 *     grid-template-rows: …; grid-template-areas: "…" "…" …;`).
 *   - A live preview that actually renders the grid using the generated CSS.
 *
 * Validation surfaces two classes of problems as amber badges:
 *   - Invalid identifiers (names not matching `^[A-Za-z][A-Za-z0-9_-]*$`).
 *   - Non-rectangular regions (a single name whose cells do not form a single
 *     solid rectangle — CSS requires this).
 *
 * Interaction model (resolves the spec's click-to-paint vs click-to-edit
 * tension):
 *   - Single click on a cell  → paint with the current brush.
 *   - Double-click on a cell  → edit its name inline (Enter/blur commits,
 *                                Escape cancels, empty/`.` clears).
 *   - Mousedown + drag + up   → paint the rectangular range with the brush.
 *
 * The component is fully self-contained and uses only semantic Tailwind theme
 * tokens for chrome (no indigo/blue, no hardcoded brand colors). The data-viz
 * area tints use the eight-color palette at `/15` opacity, per spec.
 */

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Cell = { r: number; c: number };
type Grid = string[][];

interface Tint {
  /** Cell background tint (15% opacity). */
  cell: string;
  /** Cell border color (40% opacity). */
  cellBorder: string;
  /** Legend swatch solid color. */
  swatch: string;
  /** Preview panel area classes (bg + border). */
  preview: string;
  /** Text color token for cell label. */
  text: string;
}

interface Preset {
  name: string;
  label: string;
  grid: Grid;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

/** Sentinel value for an empty cell ("no area"). */
const DOT = ".";

/** Maximum grid dimension (rows × cols). */
const MAX_DIM = 12;

/**
 * Eight muted, distinguishable tints for area groups. The order cycles through
 * the spec's palette (emerald/amber/rose/cyan/violet/fuchsia/orange/teal).
 *
 * All class strings are written as literal source substrings so Tailwind v4
 * JIT can detect and generate them.
 */
const AREA_TINTS: Tint[] = [
  {
    cell: "bg-emerald-500/15",
    cellBorder: "border-emerald-500/40",
    swatch: "bg-emerald-500",
    preview: "bg-emerald-500/15 border-emerald-500/40",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    cell: "bg-amber-500/15",
    cellBorder: "border-amber-500/40",
    swatch: "bg-amber-500",
    preview: "bg-amber-500/15 border-amber-500/40",
    text: "text-amber-700 dark:text-amber-300",
  },
  {
    cell: "bg-rose-500/15",
    cellBorder: "border-rose-500/40",
    swatch: "bg-rose-500",
    preview: "bg-rose-500/15 border-rose-500/40",
    text: "text-rose-700 dark:text-rose-300",
  },
  {
    cell: "bg-cyan-500/15",
    cellBorder: "border-cyan-500/40",
    swatch: "bg-cyan-500",
    preview: "bg-cyan-500/15 border-cyan-500/40",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  {
    cell: "bg-violet-500/15",
    cellBorder: "border-violet-500/40",
    swatch: "bg-violet-500",
    preview: "bg-violet-500/15 border-violet-500/40",
    text: "text-violet-700 dark:text-violet-300",
  },
  {
    cell: "bg-fuchsia-500/15",
    cellBorder: "border-fuchsia-500/40",
    swatch: "bg-fuchsia-500",
    preview: "bg-fuchsia-500/15 border-fuchsia-500/40",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  {
    cell: "bg-orange-500/15",
    cellBorder: "border-orange-500/40",
    swatch: "bg-orange-500",
    preview: "bg-orange-500/15 border-orange-500/40",
    text: "text-orange-700 dark:text-orange-300",
  },
  {
    cell: "bg-teal-500/15",
    cellBorder: "border-teal-500/40",
    swatch: "bg-teal-500",
    preview: "bg-teal-500/15 border-teal-500/40",
    text: "text-teal-700 dark:text-teal-300",
  },
];

/**
 * Built-in presets. Each is a fully-formed 2D grid (rows × cols). The Clear
 * preset is special-cased to fall back to the current dimensions.
 */
const PRESETS: Preset[] = [
  {
    name: "holy-grail",
    label: "Holy grail",
    grid: [
      ["header", "header", "header"],
      ["sidebar", "main", "aside"],
      ["footer", "footer", "footer"],
    ],
  },
  {
    name: "app-shell",
    label: "App shell",
    grid: [
      ["nav", "nav"],
      ["main", "main"],
    ],
  },
  {
    name: "magazine",
    label: "Magazine",
    grid: [
      ["mast", "mast", "mast", "mast"],
      ["lead", "lead", "pic", "pic"],
      ["lead", "lead", "col1", "col2"],
      ["foot", "foot", "foot", "foot"],
    ],
  },
  {
    name: "dashboard",
    label: "Dashboard",
    grid: [
      ["header", "header", "header"],
      ["sidebar", "main", "main"],
      ["sidebar", "stats1", "stats2"],
      ["footer", "footer", "footer"],
    ],
  },
];

/** Column-sizing options for the generated `grid-template-columns`. */
const COL_SIZING_OPTIONS = [
  { value: "1fr", label: "1fr" },
  { value: "minmax(200px, 1fr)", label: "minmax(200px, 1fr)" },
  { value: "auto", label: "auto" },
  { value: "custom", label: "Custom…" },
] as const;

/** Row-sizing options for the generated `grid-template-rows`. */
const ROW_SIZING_OPTIONS = [
  { value: "auto", label: "auto" },
  { value: "1fr", label: "1fr" },
  { value: "minmax(100px, auto)", label: "minmax(100px, auto)" },
  { value: "custom", label: "Custom…" },
] as const;

// ----------------------------------------------------------------------------
// Helpers (pure)
// ----------------------------------------------------------------------------

/** Valid CSS identifier for a grid-area name: letter followed by letters/digits/hyphens/underscores. */
const IDENT_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;

function isValidAreaName(name: string): boolean {
  return IDENT_RE.test(name);
}

/** Build a rows×cols grid, preserving old cell values where they still fit. */
function resizeGrid(prev: Grid, rows: number, cols: number): Grid {
  const next: Grid = [];
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(prev[r]?.[c] ?? DOT);
    }
    next.push(row);
  }
  return next;
}

/** Create a fresh rows×cols grid filled with the dot sentinel. */
function emptyGrid(rows: number, cols: number): Grid {
  return resizeGrid([], rows, cols);
}

/** Order-preserving list of unique non-dot names currently in the grid. */
function getUniqueNames(grid: Grid): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== DOT && !seen.has(cell)) {
        seen.add(cell);
        out.push(cell);
      }
    }
  }
  return out;
}

/** Stable tint lookup — index by the name's position in the unique-names list. */
function tintForName(name: string, names: string[]): Tint {
  const idx = names.indexOf(name);
  return AREA_TINTS[(idx < 0 ? 0 : idx) % AREA_TINTS.length];
}

/** All coordinates currently occupied by `name`. */
function cellsForName(grid: Grid, name: string): Cell[] {
  const out: Cell[] = [];
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c] === name) out.push({ r, c });
    }
  }
  return out;
}

/**
 * A named area is CSS-valid only if its cells form a single solid rectangle:
 * the bounding box's area must equal the cell count AND every cell inside the
 * bounding box must belong to `name`.
 */
function isRectangular(grid: Grid, name: string): boolean {
  const cells = cellsForName(grid, name);
  if (cells.length === 0) return true;
  let minR = Infinity,
    maxR = -Infinity,
    minC = Infinity,
    maxC = -Infinity;
  for (const { r, c } of cells) {
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (c < minC) minC = c;
    if (c > maxC) maxC = c;
  }
  const expected = (maxR - minR + 1) * (maxC - minC + 1);
  if (cells.length !== expected) return false;
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (grid[r]?.[c] !== name) return false;
    }
  }
  return true;
}

/** Generate the indented `"a b c"` block for `grid-template-areas:`. */
function areasBlock(grid: Grid): string {
  return grid.map((row) => `    "${row.join(" ")}"`).join("\n");
}

/** Generate the full CSS snippet. */
function generateCss(
  grid: Grid,
  cols: number,
  rows: number,
  colValue: string,
  rowValue: string
): string {
  return [
    ".layout {",
    "  display: grid;",
    `  grid-template-columns: ${colValue};`,
    `  grid-template-rows: ${rowValue};`,
    "  grid-template-areas:",
    areasBlock(grid) + ";",
    "}",
  ].join("\n");
}

/** Compute the column CSS value from the selected sizing + dims. */
function resolveColValue(
  sizing: string,
  cols: number,
  custom: string
): string {
  if (sizing === "custom") return custom.trim() || `repeat(${cols}, 1fr)`;
  if (sizing === "auto") return `repeat(${cols}, auto)`;
  return `repeat(${cols}, ${sizing})`;
}

/** Compute the row CSS value from the selected sizing + dims. */
function resolveRowValue(
  sizing: string,
  rows: number,
  custom: string
): string {
  if (sizing === "custom") return custom.trim() || `repeat(${rows}, auto)`;
  if (sizing === "auto") return `repeat(${rows}, auto)`;
  return `repeat(${rows}, ${sizing})`;
}

/** Build the `gridTemplateAreas` CSS string for the live preview. */
function previewTemplateAreas(grid: Grid): string {
  return grid.map((row) => `"${row.join(" ")}"`).join(" ");
}

/** Title-case a name for the live preview label ("sidebar" → "Sidebar"). */
function prettyLabel(name: string): string {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Auto-name a new area: area-1, area-2, … skipping names already in use. */
function nextAutoName(taken: string[]): string {
  let n = 1;
  while (taken.includes(`area-${n}`)) n++;
  return `area-${n}`;
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function DimensionControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          type="number"
          min={1}
          max={MAX_DIM}
          value={value}
          onChange={(e) => {
            const n = Math.max(
              1,
              Math.min(MAX_DIM, Number(e.target.value) || 1)
            );
            onChange(n);
          }}
          className="h-7 w-16 text-xs"
          aria-label={`${label} count`}
        />
      </div>
      <Slider
        value={[value]}
        min={1}
        max={MAX_DIM}
        step={1}
        onValueChange={(v) => onChange(v[0] ?? value)}
        aria-label={`${label} slider`}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function GridAreasBuilder() {
  // Grid state ---------------------------------------------------------------
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [grid, setGrid] = useState<Grid>(() => PRESETS[0].grid.map((r) => [...r]));

  // Brush + palette ----------------------------------------------------------
  const [brush, setBrush] = useState<string>(DOT);

  // Sizing -------------------------------------------------------------------
  const [colSizing, setColSizing] = useState<string>("1fr");
  const [rowSizing, setRowSizing] = useState<string>("auto");
  const [customCol, setCustomCol] = useState<string>("200px 1fr 200px");
  const [customRow, setCustomRow] = useState<string>("auto 1fr auto");

  // Inline editing -----------------------------------------------------------
  const [editing, setEditing] = useState<Cell | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const editInputRef = useRef<HTMLInputElement | null>(null);

  // Drag-select --------------------------------------------------------------
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Cell | null>(null);
  const [dragEnd, setDragEnd] = useState<Cell | null>(null);

  // Copy feedback ------------------------------------------------------------
  const [copied, setCopied] = useState(false);

  // Derived ------------------------------------------------------------------
  const uniqueNames = useMemo(() => getUniqueNames(grid), [grid]);
  const invalidNames = useMemo(
    () => uniqueNames.filter((n) => !isValidAreaName(n)),
    [uniqueNames]
  );
  const nonRectangular = useMemo(
    () => uniqueNames.filter((n) => !isRectangular(grid, n)),
    [grid, uniqueNames]
  );
  const colValue = useMemo(
    () => resolveColValue(colSizing, cols, customCol),
    [colSizing, cols, customCol]
  );
  const rowValue = useMemo(
    () => resolveRowValue(rowSizing, rows, customRow),
    [rowSizing, rows, customRow]
  );
  const css = useMemo(
    () => generateCss(grid, cols, rows, colValue, rowValue),
    [grid, cols, rows, colValue, rowValue]
  );

  // Focus the edit input whenever it appears --------------------------------
  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  // Global mouseup to commit drag-select ------------------------------------
  useEffect(() => {
    if (!isDragging) return;
    const handleUp = () => {
      if (dragStart && dragEnd) {
        const minR = Math.min(dragStart.r, dragEnd.r);
        const maxR = Math.max(dragStart.r, dragEnd.r);
        const minC = Math.min(dragStart.c, dragEnd.c);
        const maxC = Math.max(dragStart.c, dragEnd.c);
        setGrid((prev) =>
          prev.map((row, r) =>
            r >= minR && r <= maxR
              ? row.map((cell, c) =>
                  c >= minC && c <= maxC ? brush : cell
                )
              : row
          )
        );
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, [isDragging, dragStart, dragEnd, brush]);

  // Mutators -----------------------------------------------------------------
  const setDims = useCallback(
    (nextRows: number, nextCols: number) => {
      setRows(nextRows);
      setCols(nextCols);
      setGrid((prev) => resizeGrid(prev, nextRows, nextCols));
    },
    []
  );

  const startEdit = useCallback((cell: Cell, current: string) => {
    setEditing(cell);
    setEditValue(current === DOT ? "" : current);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editing) return;
    const raw = editValue.trim();
    const final = raw === "" ? DOT : raw;
    setGrid((prev) =>
      prev.map((row, r) =>
        r === editing.r
          ? row.map((cell, c) => (c === editing.c ? final : cell))
          : row
      )
    );
    setEditing(null);
    setEditValue("");
  }, [editing, editValue]);

  const cancelEdit = useCallback(() => {
    setEditing(null);
    setEditValue("");
  }, []);

  const loadPreset = useCallback(
    (preset: Preset) => {
      const next = preset.grid.map((r) => [...r]);
      setGrid(next);
      setRows(next.length);
      setCols(next[0]?.length ?? 1);
      setBrush(DOT);
      setEditing(null);
    },
    []
  );

  const clearGrid = useCallback(() => {
    setGrid(emptyGrid(rows, cols));
    setBrush(DOT);
    setEditing(null);
  }, [rows, cols]);

  const addNewArea = useCallback(() => {
    const name = nextAutoName(uniqueNames);
    setBrush(name);
    // Don't paint anything yet — the user picks where to put it.
  }, [uniqueNames]);

  const deleteArea = useCallback((name: string) => {
    setGrid((prev) =>
      prev.map((row) => row.map((cell) => (cell === name ? DOT : cell)))
    );
    setBrush((b) => (b === name ? DOT : b));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be unavailable (permissions, SSR). Silently no-op.
      setCopied(false);
    }
  }, [css]);

  // Drag range predicate -----------------------------------------------------
  const inDragRange = useCallback(
    (r: number, c: number): boolean => {
      if (!isDragging || !dragStart || !dragEnd) return false;
      const minR = Math.min(dragStart.r, dragEnd.r);
      const maxR = Math.max(dragStart.r, dragEnd.r);
      const minC = Math.min(dragStart.c, dragEnd.c);
      const maxC = Math.max(dragStart.c, dragEnd.c);
      return r >= minR && r <= maxR && c >= minC && c <= maxC;
    },
    [isDragging, dragStart, dragEnd]
  );

  // Cell handlers ------------------------------------------------------------
  const onCellMouseDown = (r: number, c: number) => {
    setIsDragging(true);
    setDragStart({ r, c });
    setDragEnd({ r, c });
  };
  const onCellMouseEnter = (r: number, c: number) => {
    if (isDragging) setDragEnd({ r, c });
  };
  const onCellDoubleClick = (r: number, c: number, current: string) => {
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    startEdit({ r, c }, current);
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <LayoutGrid className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight">
            Grid Template Areas Builder
          </h3>
          <p className="text-sm text-muted-foreground">
            Visually compose the <code className="font-mono text-xs">grid-template-areas</code>{" "}
            map. Paint cells with a brush, drag to fill ranges, double-click to
            rename.
          </p>
        </div>
      </div>

      {/* Presets + clear */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5" />
          Presets
        </span>
        {PRESETS.map((p) => (
          <Button
            key={p.name}
            size="sm"
            variant="outline"
            onClick={() => loadPreset(p)}
          >
            {p.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          onClick={clearGrid}
          aria-label="Clear grid (set all cells to empty)"
        >
          <Eraser className="size-3.5" />
          Clear
        </Button>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card/50 p-3">
        <DimensionControl
          label="Rows"
          value={rows}
          onChange={(n) => setDims(n, cols)}
        />
        <DimensionControl
          label="Columns"
          value={cols}
          onChange={(n) => setDims(rows, n)}
        />
      </div>

      {/* Main editor + palette */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Grid map */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Grid map</span>
            <span className="text-[11px] text-muted-foreground">
              Click = paint · Drag = fill range · Double-click = rename
            </span>
          </div>
          <div
            className="overflow-auto rounded-lg border border-border bg-card p-3"
            onMouseLeave={() => {
              // Cancel an in-flight drag if the pointer leaves the editor
              // without a mouseup (e.g. released outside the window — the
              // global handler still fires; this is just a tidy-up).
              if (isDragging) {
                setIsDragging(false);
                setDragStart(null);
                setDragEnd(null);
              }
            }}
          >
            <div
              className="inline-grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${cols}, 3.5rem)`,
              }}
              role="grid"
              aria-label={`Grid map, ${rows} rows by ${cols} columns`}
            >
              {grid.map((row, r) =>
                row.map((name, c) => {
                  const isDot = name === DOT;
                  const tint = isDot ? null : tintForName(name, uniqueNames);
                  const editingHere =
                    editing?.r === r && editing?.c === c;
                  const inRange = inDragRange(r, c);
                  const isSelectedBrush = !isDot && name === brush;
                  return (
                    <div
                      key={`${r}-${c}`}
                      role="gridcell"
                      className="relative"
                    >
                      {editingHere ? (
                        <input
                          ref={editInputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitEdit();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEdit();
                            }
                          }}
                          className="size-14 rounded-sm border border-primary bg-background px-1 text-center text-xs font-medium outline-none ring-2 ring-primary/40"
                          aria-label={`Edit area name at row ${r + 1}, column ${c + 1}`}
                          placeholder="."
                          maxLength={32}
                        />
                      ) : (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            // Prevent text-selection drag interference.
                            e.preventDefault();
                            onCellMouseDown(r, c);
                          }}
                          onMouseEnter={() => onCellMouseEnter(r, c)}
                          onDoubleClick={() =>
                            onCellDoubleClick(r, c, name)
                          }
                          className={cn(
                            "flex size-14 items-center justify-center rounded-sm border text-xs font-medium transition-colors",
                            isDot
                              ? "border-border bg-muted/40 text-muted-foreground/60"
                              : cn(
                                  tint?.cell,
                                  tint?.cellBorder,
                                  tint?.text
                                ),
                            inRange &&
                              "ring-2 ring-primary ring-offset-1 ring-offset-card z-10",
                            isSelectedBrush &&
                              !inRange &&
                              "outline outline-1 outline-offset-1 outline-foreground/30"
                          )}
                          aria-label={`Row ${r + 1}, Column ${c + 1}: ${
                            isDot ? "empty" : name
                          }`}
                          title={isDot ? "empty" : name}
                        >
                          {isDot ? (
                            <span aria-hidden className="select-none text-base leading-none">
                              ·
                            </span>
                          ) : (
                            <span className="truncate px-1">{name}</span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Palette / legend */}
        <aside
          className="w-full shrink-0 space-y-2 sm:w-48"
          aria-label="Area palette"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Areas</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={addNewArea}
              aria-label="Add a new area"
            >
              <Plus className="size-3.5" />
              New
            </Button>
          </div>

          {/* Eraser brush */}
          <button
            type="button"
            onClick={() => setBrush(DOT)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
              brush === DOT
                ? "border-foreground/40 bg-muted/60"
                : "border-border bg-card hover:bg-accent"
            )}
            aria-pressed={brush === DOT}
          >
            <span className="flex size-4 items-center justify-center rounded-sm border border-border bg-muted/60 text-[10px] text-muted-foreground">
              <Eraser className="size-3" />
            </span>
            <span className="flex-1 font-medium">Eraser (.)</span>
            <span className="font-mono text-[10px] text-muted-foreground">.</span>
          </button>

          {uniqueNames.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-2 py-3 text-center text-[11px] text-muted-foreground">
              No areas yet. Pick a preset or double-click a cell to start.
            </p>
          ) : (
            <ul className="space-y-1">
              {uniqueNames.map((name) => {
                const tint = tintForName(name, uniqueNames);
                const invalid = !isValidAreaName(name);
                const nonRect = !isRectangular(grid, name);
                return (
                  <li key={name}>
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
                        brush === name
                          ? "border-foreground/40 bg-muted/60"
                          : "border-border bg-card hover:bg-accent"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setBrush(name)}
                        className="flex flex-1 items-center gap-2 text-left"
                        aria-pressed={brush === name}
                        aria-label={`Select ${name} as current brush`}
                      >
                        <span
                          className={cn(
                            "size-4 shrink-0 rounded-sm border",
                            tint.swatch,
                            tint.cellBorder
                          )}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "flex-1 truncate font-medium",
                            invalid && "text-amber-600 dark:text-amber-400"
                          )}
                          title={name}
                        >
                          {name}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteArea(name)}
                        className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete area ${name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {(invalid || nonRect) && (
                      <div className="mt-0.5 flex flex-wrap gap-1 pl-1">
                        {invalid && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 bg-amber-500/10 px-1 py-0 text-[9px] font-medium text-amber-700 dark:text-amber-300"
                          >
                            <AlertTriangle className="mr-0.5 size-2.5" />
                            Invalid name
                          </Badge>
                        )}
                        {nonRect && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 bg-amber-500/10 px-1 py-0 text-[9px] font-medium text-amber-700 dark:text-amber-300"
                          >
                            <AlertTriangle className="mr-0.5 size-2.5" />
                            Non-rectangular
                          </Badge>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
            <Paintbrush className="size-3" />
            <span>
              Brush:{" "}
              <span className="font-mono font-medium text-foreground">
                {brush === DOT ? "Eraser (.)" : brush}
              </span>
            </span>
          </div>
        </aside>
      </div>

      {/* Validation summary */}
      {(invalidNames.length > 0 || nonRectangular.length > 0) && (
        <div className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="size-3.5" />
            Validation issues
          </div>
          {invalidNames.length > 0 && (
            <p className="text-amber-700/90 dark:text-amber-300/90">
              Invalid name{invalidNames.length > 1 ? "s" : ""}:{" "}
              <span className="font-mono">{invalidNames.join(", ")}</span>{" "}
              <span className="text-amber-700/70 dark:text-amber-300/70">
                (must start with a letter; only letters, digits, hyphens, underscores).
              </span>
            </p>
          )}
          {nonRectangular.length > 0 && (
            <p className="text-amber-700/90 dark:text-amber-300/90">
              Non-rectangular:{" "}
              <span className="font-mono">{nonRectangular.join(", ")}</span>{" "}
              <span className="text-amber-700/70 dark:text-amber-300/70">
                (CSS requires each named area to form a single solid rectangle).
              </span>
            </p>
          )}
        </div>
      )}

      {/* CSS output + live preview */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* CSS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Generated CSS</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              aria-label="Copy generated CSS to clipboard"
            >
              {copied ? (
                <>
                  <Check className="size-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Column/row sizing selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                Columns
              </Label>
              <Select
                value={colSizing}
                onValueChange={(v) => setColSizing(v)}
              >
                <SelectTrigger className="h-8 text-xs" aria-label="Column sizing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COL_SIZING_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {colSizing === "custom" && (
                <Input
                  value={customCol}
                  onChange={(e) => setCustomCol(e.target.value)}
                  className="h-7 text-xs"
                  aria-label="Custom column template"
                  placeholder="200px 1fr 200px"
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Rows</Label>
              <Select
                value={rowSizing}
                onValueChange={(v) => setRowSizing(v)}
              >
                <SelectTrigger className="h-8 text-xs" aria-label="Row sizing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROW_SIZING_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rowSizing === "custom" && (
                <Input
                  value={customRow}
                  onChange={(e) => setCustomRow(e.target.value)}
                  className="h-7 text-xs"
                  aria-label="Custom row template"
                  placeholder="auto 1fr auto"
                />
              )}
            </div>
          </div>

          <pre
            className="max-h-72 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed"
            aria-label="Generated CSS code block"
          >
            <code>{css}</code>
          </pre>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Live preview</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => loadPreset(PRESETS[0])}
              aria-label="Reset to default preset"
            >
              <RefreshCw className="size-3.5" />
              Reset
            </Button>
          </div>
          <div className="rounded-lg bg-muted/30 p-4">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: colValue,
                gridTemplateRows: rowValue,
                gridTemplateAreas: previewTemplateAreas(grid),
                minHeight: "12rem",
              }}
              aria-label="Live grid preview"
            >
              {uniqueNames.map((name) => {
                const tint = tintForName(name, uniqueNames);
                return (
                  <div
                    key={name}
                    style={{ gridArea: name }}
                    className={cn(
                      "flex items-center justify-center rounded-sm border p-3 text-center text-sm font-medium",
                      tint.preview,
                      tint.text
                    )}
                  >
                    {prettyLabel(name)}
                  </div>
                );
              })}
            </div>
            {uniqueNames.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Paint some cells to see the live preview.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
