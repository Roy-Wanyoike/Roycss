"use client";

/**
 * SubgridBuilder — a self-contained CSS `grid-template-columns: subgrid`
 * visual builder.
 *
 * CSS subgrid (Baseline 2023) lets a nested grid inherit its parent's track
 * definitions: `grid-template-columns: subgrid` makes the child's columns
 * line up with the parent's columns, so tracks stay aligned across nesting
 * levels. This is the missing piece that lets designers build dashboards,
 * forms, and magazine layouts where labels and values line up no matter
 * how deep the markup nests.
 *
 * This tool lets you:
 *   1. Configure the parent grid: column count (2–12), gap, and track size
 *      type (`fr`, `px`, `auto`, `minmax`).
 *   2. Add child cards and toggle which ones use subgrid.
 *   3. For each subgrid child, choose how many parent columns it spans
 *      and how many inner cells it lays out.
 *   4. Watch a live preview render the actual CSS grid with track numbers
 *      above the grid and colored cells — the gap between cells becomes
 *      visible track lines that extend through subgrid children.
 *   5. Read the generated CSS for parent + each child, with a copy button.
 *   6. Load one of four presets (dashboard-cards, form-layout, magazine-grid,
 *      aligned-labels).
 *
 * Implementation notes:
 *   - The parent grid and the track-number row share the same
 *     `grid-template-columns` and `gap` so the numbers align with the
 *     columns exactly.
 *   - Each subgrid child uses `grid-template-columns: subgrid` natively;
 *     the browser does the track alignment. Inner cells flow into the
 *     inherited tracks.
 *   - All styling is inline so the configuration is the single source of
 *     truth — no global CSS leaks onto the host page.
 *   - TS strict, no `any`, no `console.log`. Self-contained (no props,
 *     no external state, no network). Responsive within `max-w-2xl`.
 */

import {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  LayoutGrid,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Globe,
  Grid3x3,
  ToggleRight,
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;

const MIN_COLUMNS = 2;
const MAX_COLUMNS = 12;
const MIN_GAP = 0;
const MAX_GAP = 32;
const MIN_TRACK = 40;
const MAX_TRACK = 240;

type TrackType = "fr" | "px" | "auto" | "minmax";

const TRACK_OPTIONS: { value: TrackType; label: string }[] = [
  { value: "fr", label: "fr (flexible)" },
  { value: "px", label: "px (fixed)" },
  { value: "auto", label: "auto (content)" },
  { value: "minmax", label: "minmax(px, 1fr)" },
];

const CHILD_PALETTE = [
  { name: "emerald", value: "#10b981" },
  { name: "amber", value: "#f59e0b" },
  { name: "rose", value: "#f43f5e" },
  { name: "violet", value: "#8b5cf6" },
  { name: "teal", value: "#14b8a6" },
  { value: "#f97316", name: "orange" },
  { value: "#ec4899", name: "pink" },
  { value: "#84cc16", name: "lime" },
];

// ============================================================
// Types
// ============================================================

interface ParentConfig {
  columns: number;
  gap: number;
  trackType: TrackType;
  trackSize: number;
}

interface ChildCard {
  id: string;
  label: string;
  useSubgrid: boolean;
  span: number;
  innerCells: number;
  color: string;
}

interface Preset {
  id: string;
  label: string;
  description: string;
  parent: ParentConfig;
  children: ChildCard[];
}

interface BrowserSupport {
  label: string;
  tone: "widely" | "newly" | "limited";
  versions: { browser: string; version: string }[];
}

// ============================================================
// ID generator (stable enough for client-only UI keys)
// ============================================================

let __roycssSubgridCounter = 0;
function makeId(prefix: string): string {
  __roycssSubgridCounter += 1;
  return `${prefix}-${__roycssSubgridCounter.toString(36)}`;
}

function makeChild(partial?: Partial<ChildCard>): ChildCard {
  const colorIndex = __roycssSubgridCounter % CHILD_PALETTE.length;
  return {
    id: makeId("c"),
    label: "Card",
    useSubgrid: false,
    span: 1,
    innerCells: 1,
    color: CHILD_PALETTE[colorIndex]!.value,
    ...partial,
  };
}

// ============================================================
// Presets
// ============================================================

const DEFAULT_PARENT: ParentConfig = {
  columns: 4,
  gap: 8,
  trackType: "fr",
  trackSize: 1,
};

const PRESETS: Preset[] = [
  {
    id: "dashboard-cards",
    label: "Dashboard cards",
    description: "4-column dashboard with one wide subgrid KPI strip.",
    parent: { columns: 4, gap: 12, trackType: "fr", trackSize: 1 },
    children: [
      makeChild({ label: "Revenue", span: 1, color: "#10b981" }),
      makeChild({ label: "Visits", span: 1, color: "#f59e0b" }),
      makeChild({ label: "Signups", span: 1, color: "#f43f5e" }),
      makeChild({ label: "Churn", span: 1, color: "#8b5cf6" }),
      makeChild({
        label: "Quarterly trend",
        span: 4,
        useSubgrid: true,
        innerCells: 4,
        color: "#14b8a6",
      }),
    ],
  },
  {
    id: "form-layout",
    label: "Form layout",
    description: "2-column rows (label | field) using subgrid for sections.",
    parent: { columns: 2, gap: 8, trackType: "minmax", trackSize: 80 },
    children: [
      makeChild({
        label: "Identity row",
        span: 2,
        useSubgrid: true,
        innerCells: 2,
        color: "#10b981",
      }),
      makeChild({
        label: "Contact row",
        span: 2,
        useSubgrid: true,
        innerCells: 2,
        color: "#f59e0b",
      }),
      makeChild({
        label: "Address row",
        span: 2,
        useSubgrid: true,
        innerCells: 2,
        color: "#f43f5e",
      }),
    ],
  },
  {
    id: "magazine-grid",
    label: "Magazine grid",
    description: "6-column magazine with a featured article using subgrid.",
    parent: { columns: 6, gap: 10, trackType: "fr", trackSize: 1 },
    children: [
      makeChild({ label: "Lead", span: 4, color: "#10b981" }),
      makeChild({ label: "Side", span: 2, color: "#f59e0b" }),
      makeChild({
        label: "Featured article",
        span: 4,
        useSubgrid: true,
        innerCells: 4,
        color: "#8b5cf6",
      }),
      makeChild({ label: "Ad", span: 2, color: "#f43f5e" }),
      makeChild({ label: "Footer A", span: 2, color: "#14b8a6" }),
      makeChild({ label: "Footer B", span: 2, color: "#f97316" }),
      makeChild({ label: "Footer C", span: 2, color: "#ec4899" }),
    ],
  },
  {
    id: "aligned-labels",
    label: "Aligned labels",
    description: "3-column rows where each row is a subgrid child.",
    parent: { columns: 3, gap: 12, trackType: "minmax", trackSize: 60 },
    children: [
      makeChild({
        label: "Header row",
        span: 3,
        useSubgrid: true,
        innerCells: 3,
        color: "#10b981",
      }),
      makeChild({
        label: "Row 1",
        span: 3,
        useSubgrid: true,
        innerCells: 3,
        color: "#f59e0b",
      }),
      makeChild({
        label: "Row 2",
        span: 3,
        useSubgrid: true,
        innerCells: 3,
        color: "#f43f5e",
      }),
      makeChild({
        label: "Row 3",
        span: 3,
        useSubgrid: true,
        innerCells: 3,
        color: "#8b5cf6",
      }),
    ],
  },
];

const BROWSER_SUPPORT: BrowserSupport = {
  label: "Baseline 2023",
  tone: "widely",
  versions: [
    { browser: "Chrome", version: "117+" },
    { browser: "Edge", version: "117+" },
    { browser: "Firefox", version: "71+" },
    { browser: "Safari", version: "16+" },
    { browser: "Samsung", version: "24+" },
  ],
};

// ============================================================
// CSS helpers
// ============================================================

/** Build the `grid-template-columns` value for the parent. */
function parentTemplate(parent: ParentConfig): string {
  const { columns, trackType, trackSize } = parent;
  switch (trackType) {
    case "fr":
      return `repeat(${columns}, ${trackSize}fr)`;
    case "px":
      return `repeat(${columns}, ${trackSize}px)`;
    case "auto":
      return `repeat(${columns}, auto)`;
    case "minmax":
      return `repeat(${columns}, minmax(${trackSize}px, 1fr))`;
    default:
      return `repeat(${columns}, 1fr)`;
  }
}

/** Inline style for the parent grid (and the track-label row). */
function gridStyle(parent: ParentConfig): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: parentTemplate(parent),
    gap: `${parent.gap}px`,
  };
}

/** Convert a hex color to an rgba string with the given alpha. */
function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================
// Child editor row
// ============================================================

interface ChildEditorProps {
  child: ChildCard;
  index: number;
  maxColumns: number;
  onChange: (id: string, fn: (c: ChildCard) => ChildCard) => void;
  onRemove: (id: string) => void;
}

function ChildEditor({
  child,
  index,
  maxColumns,
  onChange,
  onRemove,
}: ChildEditorProps) {
  const patch = useCallback(
    (partial: Partial<ChildCard>) => {
      onChange(child.id, (c) => ({ ...c, ...partial }));
    },
    [child.id, onChange],
  );

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-mono font-bold text-white"
          style={{ backgroundColor: child.color }}
          aria-hidden
        >
          {index + 1}
        </span>
        <Input
          value={child.label}
          onChange={(e) => patch({ label: e.target.value })}
          placeholder="Card label"
          className="h-7 flex-1 min-w-[120px] text-xs"
          aria-label="Card label"
        />
        <div className="flex items-center gap-1">
          <Switch
            checked={child.useSubgrid}
            onCheckedChange={(v) => patch({ useSubgrid: v })}
            aria-label="Toggle subgrid"
          />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            subgrid
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(child.id)}
          aria-label="Remove child"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Span
            </Label>
            <span className="font-mono text-[11px] text-foreground/80">
              {child.span} col
            </span>
          </div>
          <Slider
            value={[child.span]}
            min={1}
            max={maxColumns}
            step={1}
            onValueChange={(v) => {
              const next = v[0] ?? 1;
              patch({
                span: next,
                innerCells: Math.min(child.innerCells, next),
              });
            }}
          />
        </div>
        {child.useSubgrid && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Inner cells
              </Label>
              <span className="font-mono text-[11px] text-foreground/80">
                {child.innerCells}
              </span>
            </div>
            <Slider
              value={[child.innerCells]}
              min={1}
              max={child.span}
              step={1}
              onValueChange={(v) => patch({ innerCells: v[0] ?? 1 })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function SubgridBuilder() {
  const initialPreset = PRESETS[0]!;
  const [parent, setParent] = useState<ParentConfig>(initialPreset.parent);
  const [children, setChildren] = useState<ChildCard[]>(initialPreset.children);
  const [copied, setCopied] = useState<boolean>(false);

  // ── Parent mutation handlers ────────────────────────────────────────

  const patchParent = useCallback((partial: Partial<ParentConfig>) => {
    setParent((prev) => ({ ...prev, ...partial }));
  }, []);

  // ── Children mutation handlers ──────────────────────────────────────

  const handleChildChange = useCallback(
    (id: string, fn: (c: ChildCard) => ChildCard) => {
      setChildren((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
    },
    [],
  );

  const handleChildRemove = useCallback((id: string) => {
    setChildren((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addChild = useCallback(() => {
    setChildren((prev) => [
      ...prev,
      makeChild({ color: CHILD_PALETTE[prev.length % CHILD_PALETTE.length]!.value }),
    ]);
  }, []);

  // ── Preset loader ───────────────────────────────────────────────────

  const loadPreset = useCallback((preset: Preset) => {
    setParent(preset.parent);
    setChildren(preset.children);
  }, []);

  // ── Generated CSS ───────────────────────────────────────────────────

  const generatedCss = useMemo(() => {
    const lines: string[] = [];
    lines.push(".parent-grid {");
    lines.push(`  display: grid;`);
    lines.push(`  grid-template-columns: ${parentTemplate(parent)};`);
    lines.push(`  gap: ${parent.gap}px;`);
    lines.push("}");
    lines.push("");
    children.forEach((c, i) => {
      lines.push(`.child-${i + 1} {`);
      lines.push(`  grid-column: span ${c.span};`);
      if (c.useSubgrid) {
        lines.push(`  display: grid;`);
        lines.push(`  grid-template-columns: subgrid;`);
      }
      lines.push("}");
      if (i < children.length - 1) lines.push("");
    });
    return lines.join("\n");
  }, [parent, children]);

  // ── Copy ────────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [generatedCss]);

  // ── Track numbers ───────────────────────────────────────────────────

  const trackNumbers = useMemo(
    () => Array.from({ length: parent.columns }, (_, i) => i + 1),
    [parent.columns],
  );

  const badgeTone =
    BROWSER_SUPPORT.tone === "widely"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : BROWSER_SUPPORT.tone === "newly"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400";

  const subgridCount = children.filter((c) => c.useSubgrid).length;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <LayoutGrid className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold leading-tight text-foreground">
              Subgrid Builder
            </h2>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                badgeTone,
              )}
            >
              <Globe className="size-3" />
              {BROWSER_SUPPORT.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Build a parent grid, toggle subgrid on child cards, and watch
            tracks line up across nesting levels.
          </p>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2.5 text-xs"
              onClick={() => loadPreset(p)}
              title={p.description}
            >
              <Sparkles className="size-3" />
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Parent grid controls */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Grid3x3 className="size-3.5" />
          Parent grid
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Columns
              </Label>
              <span className="font-mono text-xs text-foreground/80">
                {parent.columns}
              </span>
            </div>
            <Slider
              value={[parent.columns]}
              min={MIN_COLUMNS}
              max={MAX_COLUMNS}
              step={1}
              onValueChange={(v) => {
                const next = v[0] ?? parent.columns;
                patchParent({ columns: next });
                // Shrink any children whose span exceeds the new column count.
                setChildren((prev) =>
                  prev.map((c) => ({
                    ...c,
                    span: Math.min(c.span, next),
                    innerCells: Math.min(c.innerCells, Math.min(c.span, next)),
                  })),
                );
              }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Gap
              </Label>
              <span className="font-mono text-xs text-foreground/80">
                {parent.gap}px
              </span>
            </div>
            <Slider
              value={[parent.gap]}
              min={MIN_GAP}
              max={MAX_GAP}
              step={1}
              onValueChange={(v) => patchParent({ gap: v[0] ?? parent.gap })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Track size type
            </Label>
            <Select
              value={parent.trackType}
              onValueChange={(v) => patchParent({ trackType: v as TrackType })}
            >
              <SelectTrigger size="sm" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACK_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {parent.trackType !== "auto" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Track size
                </Label>
                <span className="font-mono text-xs text-foreground/80">
                  {parent.trackSize}
                  {parent.trackType === "fr" ? "fr" : "px"}
                  {parent.trackType === "minmax" ? " min" : ""}
                </span>
              </div>
              <Slider
                value={[parent.trackSize]}
                min={MIN_TRACK}
                max={MAX_TRACK}
                step={parent.trackType === "fr" ? 1 : 4}
                onValueChange={(v) =>
                  patchParent({ trackSize: v[0] ?? parent.trackSize })
                }
              />
            </div>
          )}
        </div>

        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary gap-1"
          >
            <Grid3x3 className="size-3" />
            {parent.columns} tracks
          </Badge>
          <Badge
            variant="outline"
            className="border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400 gap-1"
          >
            <ToggleRight className="size-3" />
            {subgridCount} subgrid
            {subgridCount === 1 ? "" : "s"}
          </Badge>
          <span className="font-mono text-[11px] text-muted-foreground">
            {parentTemplate(parent)}
          </span>
        </div>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live preview
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 scrollbar-thin">
          {/* Track number row — shares the parent grid template so the
              numbers align perfectly with the column tracks. */}
          <div style={gridStyle(parent)} className="mb-1.5">
            {trackNumbers.map((n) => (
              <div
                key={n}
                className="text-center font-mono text-[10px] font-semibold text-muted-foreground"
              >
                {n}
              </div>
            ))}
          </div>
          {/* The actual parent grid. The muted background shows through the
              gaps, creating visible track lines that extend through any
              subgrid children. */}
          {children.length === 0 ? (
            <p className="rounded-md bg-background p-4 text-xs text-muted-foreground italic">
              No children — add one below.
            </p>
          ) : (
            <div style={gridStyle(parent)} className="bg-muted/60 rounded-md p-1">
              {children.map((c, i) => {
                const childStyle: CSSProperties = {
                  gridColumn: `span ${Math.min(c.span, parent.columns)}`,
                  backgroundColor: withAlpha(c.color, 0.18),
                  border: `1px solid ${withAlpha(c.color, 0.55)}`,
                  borderRadius: "8px",
                  padding: "8px",
                  minHeight: c.useSubgrid ? "auto" : "48px",
                  display: c.useSubgrid ? "grid" : "flex",
                  gridTemplateColumns: c.useSubgrid ? "subgrid" : undefined,
                  gap: c.useSubgrid ? `${parent.gap}px` : undefined,
                  alignItems: c.useSubgrid ? undefined : "center",
                  justifyContent: c.useSubgrid ? undefined : "center",
                };
                return (
                  <div
                    key={c.id}
                    style={childStyle}
                    className="text-xs font-medium"
                  >
                    {!c.useSubgrid && (
                      <span style={{ color: c.color }} className="font-semibold">
                        {c.label || `Card ${i + 1}`}
                      </span>
                    )}
                    {c.useSubgrid && (
                      <>
                        {Array.from(
                          { length: Math.max(1, c.innerCells) },
                          (_, ci) => (
                            <div
                              key={ci}
                              className="rounded-md border px-2 py-1.5 text-center font-mono text-[10px]"
                              style={{
                                backgroundColor: withAlpha(c.color, 0.35),
                                borderColor: withAlpha(c.color, 0.7),
                                color: "#ffffff",
                              }}
                            >
                              {c.label || `Card ${i + 1}`} · {ci + 1}
                            </div>
                          ),
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">
            Track lines (the gap) extend through subgrid children — that is the
            whole point of <code className="font-mono">subgrid</code>.
          </p>
        </div>
      </div>

      {/* Children editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Child cards
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={addChild}
            className="h-7 gap-1 px-2 text-[11px]"
          >
            <Plus className="size-3" />
            Add child
          </Button>
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
          {children.length === 0 ? (
            <p className="rounded-md border border-dashed border-border/60 p-4 text-xs text-muted-foreground italic">
              No children yet.
            </p>
          ) : (
            children.map((c, i) => (
              <ChildEditor
                key={c.id}
                child={c}
                index={i}
                maxColumns={parent.columns}
                onChange={handleChildChange}
                onRemove={handleChildRemove}
              />
            ))
          )}
        </div>
      </div>

      {/* Generated CSS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Generated CSS
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 gap-1 px-2 text-[11px]"
            aria-label="Copy generated CSS"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground scrollbar-thin">
          <code>{generatedCss}</code>
        </pre>
      </div>

      {/* Browser support details */}
      <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Globe className="size-3.5" />
          Browser support
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BROWSER_SUPPORT.versions.map((v) => (
            <Badge key={v.browser} variant="secondary" className="gap-1">
              <span className="text-foreground">{v.browser}</span>
              <span className="font-mono text-muted-foreground">{v.version}</span>
            </Badge>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          With <code className="font-mono">grid-template-columns: subgrid</code>,
          a nested grid inherits the parent&apos;s track sizes — so columns
          stay aligned across nesting levels. The gaps in this preview ARE the
          track lines: they extend through every subgrid child automatically.
        </p>
      </div>
    </div>
  );
}
