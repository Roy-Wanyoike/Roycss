"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Rows3,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  ArrowDown,
  Sparkles,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * FlexPlayground — an interactive Flexbox playground.
 *
 * The user tweaks the flex container (direction / wrap / justify-content /
 * align-items / align-content / gap) plus per-item properties (order /
 * flex-grow / flex-shrink / flex-basis / align-self / width / height) and
 * watches the layout respond instantly. A live, copyable CSS block is
 * generated from the current state, using the `flex: grow shrink basis`
 * shorthand per spec.
 *
 * Items are added (max 8) / removed via the per-item Popover that opens when
 * the item card itself is clicked. Each item gets a distinct tint from a
 * six-color palette (emerald / amber / rose / cyan / violet / fuchsia) so
 * the layout is easy to read at a glance — and absolutely no indigo/blue.
 *
 * The chrome uses only semantic Tailwind theme tokens (bg-card, bg-muted,
 * text-foreground, text-muted-foreground, border-border, text-primary,
 * bg-primary) so it adapts to light/dark themes automatically via next-themes.
 *
 * Fully self-contained: no props, no external state, no network, no
 * `console.log`. Memoized CSS + container style. TS-strict, no `any`.
 */

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";
type JustifyContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly";
type AlignItems =
  | "stretch"
  | "flex-start"
  | "flex-end"
  | "center"
  | "baseline";
type AlignContent =
  | "stretch"
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around";
type AlignSelf =
  | "auto"
  | "flex-start"
  | "flex-end"
  | "center"
  | "stretch"
  | "baseline";

interface FlexItem {
  id: string;
  order: number;
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  alignSelf: AlignSelf;
  /** Width in px, or null = unset (auto). */
  width: number | null;
  /** Height in px, or null = unset (auto). */
  height: number | null;
}

interface ContainerState {
  direction: FlexDirection;
  wrap: FlexWrap;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
  alignContent: AlignContent;
  gap: number;
}

interface Tint {
  bg: string;
  border: string;
  text: string;
  dot: string;
}

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface Preset {
  label: string;
  container: Partial<ContainerState>;
  /** Optional per-item patches, applied by index. */
  items?: Partial<FlexItem>[];
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const MAX_ITEMS = 8;
const MIN_GAP = 0;
const MAX_GAP = 48;
const MIN_ITEM_SIZE = 60;

const DIRECTION_OPTIONS: SelectOption<FlexDirection>[] = [
  { value: "row", label: "row" },
  { value: "row-reverse", label: "row-reverse" },
  { value: "column", label: "column" },
  { value: "column-reverse", label: "column-reverse" },
];

const WRAP_OPTIONS: SelectOption<FlexWrap>[] = [
  { value: "nowrap", label: "nowrap" },
  { value: "wrap", label: "wrap" },
  { value: "wrap-reverse", label: "wrap-reverse" },
];

const JUSTIFY_OPTIONS: SelectOption<JustifyContent>[] = [
  { value: "flex-start", label: "flex-start" },
  { value: "flex-end", label: "flex-end" },
  { value: "center", label: "center" },
  { value: "space-between", label: "space-between" },
  { value: "space-around", label: "space-around" },
  { value: "space-evenly", label: "space-evenly" },
];

const ALIGN_ITEMS_OPTIONS: SelectOption<AlignItems>[] = [
  { value: "stretch", label: "stretch" },
  { value: "flex-start", label: "flex-start" },
  { value: "flex-end", label: "flex-end" },
  { value: "center", label: "center" },
  { value: "baseline", label: "baseline" },
];

const ALIGN_CONTENT_OPTIONS: SelectOption<AlignContent>[] = [
  { value: "stretch", label: "stretch" },
  { value: "flex-start", label: "flex-start" },
  { value: "flex-end", label: "flex-end" },
  { value: "center", label: "center" },
  { value: "space-between", label: "space-between" },
  { value: "space-around", label: "space-around" },
];

const ALIGN_SELF_OPTIONS: SelectOption<AlignSelf>[] = [
  { value: "auto", label: "auto" },
  { value: "flex-start", label: "flex-start" },
  { value: "flex-end", label: "flex-end" },
  { value: "center", label: "center" },
  { value: "stretch", label: "stretch" },
  { value: "baseline", label: "baseline" },
];

/**
 * Six distinct, subtle tints. Order cycles emerald → amber → rose → cyan →
 * violet → fuchsia (NO blue, per spec). All class strings are literal source
 * substrings so Tailwind v4 JIT can detect and generate them.
 */
const ITEM_TINTS: Tint[] = [
  {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/50",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-amber-500/15",
    border: "border-amber-500/50",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-rose-500/15",
    border: "border-rose-500/50",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/50",
    text: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-500",
  },
  {
    bg: "bg-violet-500/15",
    border: "border-violet-500/50",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  {
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/50",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    dot: "bg-fuchsia-500",
  },
];

const DEFAULT_CONTAINER: ContainerState = {
  direction: "row",
  wrap: "nowrap",
  justifyContent: "center",
  alignItems: "center",
  alignContent: "stretch",
  gap: 16,
};

const DEFAULT_ITEMS: FlexItem[] = [
  {
    id: "item-1",
    order: 0,
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
    alignSelf: "auto",
    width: 80,
    height: 80,
  },
  {
    id: "item-2",
    order: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    alignSelf: "auto",
    width: 100,
    height: 100,
  },
  {
    id: "item-3",
    order: 0,
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
    alignSelf: "auto",
    width: 64,
    height: 64,
  },
];

/** Distinct sizes for newly added items, so they don't all look the same. */
const ITEM_SIZE_CYCLE: ReadonlyArray<readonly [number, number]> = [
  [88, 88],
  [112, 72],
  [72, 112],
  [96, 96],
  [128, 64],
  [64, 128],
  [80, 100],
  [100, 80],
];

const PRESETS: Preset[] = [
  {
    label: "Navbar",
    container: {
      direction: "row",
      wrap: "nowrap",
      justifyContent: "space-between",
      alignItems: "center",
      alignContent: "stretch",
      gap: 12,
    },
  },
  {
    label: "Centered card",
    container: {
      direction: "column",
      wrap: "nowrap",
      justifyContent: "center",
      alignItems: "center",
      alignContent: "stretch",
      gap: 12,
    },
  },
  {
    label: "Card grid",
    container: {
      direction: "row",
      wrap: "wrap",
      justifyContent: "flex-start",
      alignItems: "stretch",
      alignContent: "flex-start",
      gap: 16,
    },
  },
  {
    label: "Holy grail row",
    container: {
      direction: "row",
      wrap: "nowrap",
      justifyContent: "flex-start",
      alignItems: "stretch",
      alignContent: "stretch",
      gap: 12,
    },
    // Reorder the first three items: visual order becomes 2, 1, 3 (…, n).
    items: [{ order: 2 }, { order: 1 }, { order: 3 }],
  },
  {
    label: "Stack",
    container: {
      direction: "column",
      wrap: "nowrap",
      justifyContent: "flex-start",
      alignItems: "stretch",
      alignContent: "stretch",
      gap: 12,
    },
  },
];

// Module-level counter for unique item IDs. The defaults use IDs
// "item-1".."item-3", so the counter starts at 3 and increments before use.
let itemIdCounter = 3;

function createItem(index: number): FlexItem {
  const id = `item-${++itemIdCounter}`;
  const [w, h] = ITEM_SIZE_CYCLE[index % ITEM_SIZE_CYCLE.length];
  return {
    id,
    order: 0,
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
    alignSelf: "auto",
    width: w,
    height: h,
  };
}

// ----------------------------------------------------------------------------
// Style + CSS generators (pure helpers)
// ----------------------------------------------------------------------------

function flexShorthand(item: FlexItem): string {
  return `${item.flexGrow} ${item.flexShrink} ${item.flexBasis}`;
}

function buildItemStyle(item: FlexItem): React.CSSProperties {
  const style: React.CSSProperties = {
    order: item.order,
    flexGrow: item.flexGrow,
    flexShrink: item.flexShrink,
    flexBasis: item.flexBasis,
    alignSelf: item.alignSelf,
    minWidth: MIN_ITEM_SIZE,
    minHeight: MIN_ITEM_SIZE,
  };
  if (item.width != null) style.width = item.width;
  if (item.height != null) style.height = item.height;
  return style;
}

function buildContainerStyle(c: ContainerState): React.CSSProperties {
  return {
    display: "flex",
    flexDirection: c.direction,
    flexWrap: c.wrap,
    justifyContent: c.justifyContent,
    alignItems: c.alignItems,
    alignContent: c.alignContent,
    gap: `${c.gap}px`,
  };
}

function generateCss(container: ContainerState, items: FlexItem[]): string {
  const lines: string[] = [];
  lines.push(".container {");
  lines.push("  display: flex;");
  lines.push(`  flex-direction: ${container.direction};`);
  lines.push(`  flex-wrap: ${container.wrap};`);
  lines.push(`  justify-content: ${container.justifyContent};`);
  lines.push(`  align-items: ${container.alignItems};`);
  lines.push(`  align-content: ${container.alignContent};`);
  lines.push(`  gap: ${container.gap}px;`);
  lines.push("}");
  lines.push("");
  items.forEach((item, i) => {
    const num = i + 1;
    lines.push(
      `.item-${num} { order: ${item.order}; flex: ${flexShorthand(item)}; align-self: ${item.alignSelf}; }`,
    );
  });
  return lines.join("\n");
}

// ----------------------------------------------------------------------------
// LabeledSelect — small reusable select with label, fully typed
// ----------------------------------------------------------------------------

interface LabeledSelectProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: SelectOption<T>[];
  onValueChange: (v: T) => void;
}

function LabeledSelect<T extends string>({
  id,
  label,
  value,
  options,
  onValueChange,
}: LabeledSelectProps<T>) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide"
      >
        {label}
      </Label>
      <Select value={value} onValueChange={(v) => onValueChange(v as T)}>
        <SelectTrigger id={id} className="w-full h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function FlexPlayground() {
  const [container, setContainer] = useState<ContainerState>(DEFAULT_CONTAINER);
  const [items, setItems] = useState<FlexItem[]>(() =>
    DEFAULT_ITEMS.map((i) => ({ ...i })),
  );
  const [copied, setCopied] = useState(false);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  // Derived state ------------------------------------------------------------
  const css = useMemo(
    () => generateCss(container, items),
    [container, items],
  );
  const containerStyle = useMemo(
    () => buildContainerStyle(container),
    [container],
  );
  const isRow =
    container.direction === "row" ||
    container.direction === "row-reverse";
  const DirectionIcon = isRow ? ArrowRight : ArrowDown;

  // Mutators -----------------------------------------------------------------
  const updateContainer = useCallback(
    <K extends keyof ContainerState>(key: K, value: ContainerState[K]) => {
      setContainer((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateItem = useCallback((id: string, patch: Partial<FlexItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) =>
      prev.length >= MAX_ITEMS ? prev : [...prev, createItem(prev.length)],
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setOpenItemId((cur) => (cur === id ? null : cur));
  }, []);

  const reset = useCallback(() => {
    setContainer(DEFAULT_CONTAINER);
    setItems(DEFAULT_ITEMS.map((i) => ({ ...i })));
    setOpenItemId(null);
    itemIdCounter = 3;
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setContainer((prev) => ({ ...prev, ...preset.container }));
    if (preset.items) {
      setItems((prev) =>
        prev.map((it, i) =>
          preset.items && preset.items[i] ? { ...it, ...preset.items[i] } : it,
        ),
      );
    }
    setOpenItemId(null);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API may be unavailable (permissions / SSR). Silently no-op.
      setCopied(false);
    }
  }, [css]);

  // Render -------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header: title + reset */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Rows3 className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight text-foreground">
              Flexbox Playground
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Live container + per-item editor with generated CSS
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          aria-label="Reset to defaults"
          className="h-7 text-xs"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-3" />
          Presets
        </span>
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="secondary"
            size="sm"
            onClick={() => applyPreset(p)}
            className="h-7 text-xs"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Main grid: sidebar controls + live preview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[18rem_1fr]">
        {/* Sidebar — container controls */}
        <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Settings2 className="size-3.5 text-primary" />
            Container
          </div>
          <Separator />
          <LabeledSelect<FlexDirection>
            id="flex-direction"
            label="flex-direction"
            value={container.direction}
            options={DIRECTION_OPTIONS}
            onValueChange={(v) => updateContainer("direction", v)}
          />
          <LabeledSelect<FlexWrap>
            id="flex-wrap"
            label="flex-wrap"
            value={container.wrap}
            options={WRAP_OPTIONS}
            onValueChange={(v) => updateContainer("wrap", v)}
          />
          <LabeledSelect<JustifyContent>
            id="justify-content"
            label="justify-content"
            value={container.justifyContent}
            options={JUSTIFY_OPTIONS}
            onValueChange={(v) => updateContainer("justifyContent", v)}
          />
          <LabeledSelect<AlignItems>
            id="align-items"
            label="align-items"
            value={container.alignItems}
            options={ALIGN_ITEMS_OPTIONS}
            onValueChange={(v) => updateContainer("alignItems", v)}
          />
          <LabeledSelect<AlignContent>
            id="align-content"
            label="align-content"
            value={container.alignContent}
            options={ALIGN_CONTENT_OPTIONS}
            onValueChange={(v) => updateContainer("alignContent", v)}
          />
          {/* Gap */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="flex-gap"
                className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                gap
              </Label>
              <span className="font-mono text-xs text-primary">
                {container.gap}px
              </span>
            </div>
            <Input
              id="flex-gap"
              type="number"
              min={MIN_GAP}
              max={MAX_GAP}
              value={container.gap}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) {
                  updateContainer(
                    "gap",
                    Math.max(MIN_GAP, Math.min(MAX_GAP, Math.round(n))),
                  );
                }
              }}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <DirectionIcon className="size-3.5 text-primary" />
              {isRow ? "Main axis: horizontal" : "Main axis: vertical"}
            </span>
            <span className="text-xs text-muted-foreground">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="min-h-[280px] overflow-auto rounded-lg border-2 border-dashed border-border bg-muted/30 p-4">
            <div style={containerStyle} className="min-h-[248px]">
              {items.map((item, i) => {
                const tint = ITEM_TINTS[i % ITEM_TINTS.length];
                const num = i + 1;
                const isOpen = openItemId === item.id;
                const shorthand = flexShorthand(item);
                return (
                  <Popover
                    key={item.id}
                    open={isOpen}
                    onOpenChange={(o) => setOpenItemId(o ? item.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        style={buildItemStyle(item)}
                        aria-label={`Item ${num} settings. Order ${item.order}, flex ${shorthand}, align-self ${item.alignSelf}.`}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-3 font-bold outline-none transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50",
                          tint.bg,
                          tint.border,
                          tint.text,
                          isOpen && "ring-2 ring-ring/60",
                        )}
                      >
                        <span className="text-lg leading-none">{num}</span>
                        <span className="font-mono text-[10px] opacity-80">
                          flex: {shorthand}
                        </span>
                        {item.order !== 0 && (
                          <span className="font-mono text-[10px] opacity-70">
                            order: {item.order}
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-72 p-3"
                      align="center"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "flex items-center gap-1.5 text-xs font-semibold",
                              tint.text,
                            )}
                          >
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                tint.dot,
                              )}
                            />
                            Item {num}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive"
                            aria-label={`Delete item ${num}`}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label
                              htmlFor={`order-${item.id}`}
                              className="text-[10px] font-medium uppercase text-muted-foreground"
                            >
                              order
                            </Label>
                            <Input
                              id={`order-${item.id}`}
                              type="number"
                              value={item.order}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  order: Number(e.target.value) || 0,
                                })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor={`grow-${item.id}`}
                              className="text-[10px] font-medium uppercase text-muted-foreground"
                            >
                              flex-grow
                            </Label>
                            <Input
                              id={`grow-${item.id}`}
                              type="number"
                              min={0}
                              value={item.flexGrow}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  flexGrow: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor={`shrink-${item.id}`}
                              className="text-[10px] font-medium uppercase text-muted-foreground"
                            >
                              flex-shrink
                            </Label>
                            <Input
                              id={`shrink-${item.id}`}
                              type="number"
                              min={0}
                              value={item.flexShrink}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  flexShrink: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor={`basis-${item.id}`}
                              className="text-[10px] font-medium uppercase text-muted-foreground"
                            >
                              flex-basis
                            </Label>
                            <Input
                              id={`basis-${item.id}`}
                              type="text"
                              value={item.flexBasis}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  flexBasis: e.target.value,
                                })
                              }
                              placeholder="auto"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor={`w-${item.id}`}
                              className="text-[10px] font-medium uppercase text-muted-foreground"
                            >
                              width (px)
                            </Label>
                            <Input
                              id={`w-${item.id}`}
                              type="number"
                              min={0}
                              value={item.width ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateItem(item.id, {
                                  width:
                                    v === ""
                                      ? null
                                      : Math.max(0, Number(v) || 0),
                                });
                              }}
                              placeholder="auto"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label
                              htmlFor={`h-${item.id}`}
                              className="text-[10px] font-medium uppercase text-muted-foreground"
                            >
                              height (px)
                            </Label>
                            <Input
                              id={`h-${item.id}`}
                              type="number"
                              min={0}
                              value={item.height ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateItem(item.id, {
                                  height:
                                    v === ""
                                      ? null
                                      : Math.max(0, Number(v) || 0),
                                });
                              }}
                              placeholder="auto"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label
                            htmlFor={`self-${item.id}`}
                            className="text-[10px] font-medium uppercase text-muted-foreground"
                          >
                            align-self
                          </Label>
                          <Select
                            value={item.alignSelf}
                            onValueChange={(v) =>
                              updateItem(item.id, {
                                alignSelf: v as AlignSelf,
                              })
                            }
                          >
                            <SelectTrigger
                              id={`self-${item.id}`}
                              className="w-full h-8 text-xs"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALIGN_SELF_OPTIONS.map((o) => (
                                <SelectItem
                                  key={o.value}
                                  value={o.value}
                                  className="text-xs"
                                >
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={items.length >= MAX_ITEMS}
              className="h-7 text-xs"
            >
              <Plus className="size-3.5" />
              Add item
            </Button>
            <span className="text-xs text-muted-foreground">
              Click any item to edit its per-item properties.
            </span>
          </div>
        </div>
      </div>

      {/* Generated CSS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Generated CSS
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            aria-label="Copy generated CSS to clipboard"
            className="h-7 text-xs"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="overflow-x-auto whitespace-pre rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs text-foreground/90">
          <code>{css}</code>
        </pre>
      </div>
    </div>
  );
}
