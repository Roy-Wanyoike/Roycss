"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Move,
  Copy,
  Check,
  Sparkles,
  Layers,
  RefreshCw,
  Crosshair,
  ChevronDown,
  Info,
  Pin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * PositioningPlayground — an interactive CSS `position` playground.
 *
 * The user picks one of the five `position` values (`static` / `relative` /
 * `absolute` / `fixed` / `sticky`), tweaks the four insets (top / right /
 * bottom / left, in `px` or `%`) and `z-index`, and watches a live canvas
 * respond. The target box is **draggable** (pointer events, mouse + touch)
 * for `relative` / `absolute` / `fixed` — dragging live-updates `top` / `left`.
 *
 * Key mechanics modelled by the canvas:
 *  - The **canvas** carries `position: relative` + `transform: translateZ(0)`.
 *    The transform establishes a containing block for `position: fixed`, so
 *    fixed elements are scoped to the canvas (not the whole viewport) — this
 *    is the documented "ancestor with transform/filter" exception.
 *  - The **parent** box is `position: relative`, so it is the containing
 *    block for `position: absolute` descendants.
 *  - For `sticky`, the canvas becomes scrollable (`overflow-y: auto`) and a
 *    tall spacer is injected above + below the parent so the user can scroll
 *    and watch the target stick at its `top` threshold.
 *  - A **sibling** box sits in flow after the target — for `absolute` /
 *    `fixed` (which remove the target from flow) the sibling slides up,
 *    making the flow impact obvious.
 *
 * Generated CSS mirrors the spec example exactly:
 *
 * ```css
 * .target {
 *   position: absolute;
 *   top: 50px;
 *   left: 100px;
 *   z-index: 10;
 * }
 * ```
 *
 * Only enabled, non-default declarations are emitted. Self-contained: no
 * props, no external state, no network, no `console.log`. TS-strict, no
 * `any`. Pointer capture is set on `pointerdown` and released on `pointerup`
 * / `pointercancel`, so the drag never leaks. Memoised CSS + style pipeline.
 */

// ============================================================
// Types
// ============================================================

type PositionValue = "static" | "relative" | "absolute" | "fixed" | "sticky";
type LengthUnit = "px" | "%";
type InsetSide = "top" | "right" | "bottom" | "left";

interface InsetControl {
  /** Numeric value (clamped to the unit's range). */
  value: number;
  unit: LengthUnit;
  /** When false, the inset is treated as `auto` (omitted from CSS + style). */
  enabled: boolean;
}

interface InsetState {
  top: InsetControl;
  right: InsetControl;
  bottom: InsetControl;
  left: InsetControl;
}

interface PlaygroundState {
  position: PositionValue;
  inset: InsetState;
  zIndex: number;
}

interface PositionMeta {
  value: PositionValue;
  label: string;
  description: string;
}

interface Preset {
  id: string;
  label: string;
  build: () => PlaygroundState;
}

interface ReferenceRow {
  value: PositionValue;
  description: string;
}

// ============================================================
// Constants
// ============================================================

const INSET_PX_MIN = -200;
const INSET_PX_MAX = 200;
const INSET_PCT_MIN = -100;
const INSET_PCT_MAX = 100;
const Z_MIN = -10;
const Z_MAX = 100;

const CANVAS_HEIGHT = 420;
const STICKY_PARENT_HEIGHT = 720;

const POSITION_META: PositionMeta[] = [
  {
    value: "static",
    label: "static",
    description: "Default — element stays in normal document flow.",
  },
  {
    value: "relative",
    label: "relative",
    description: "Offset from normal position; doesn't leave flow.",
  },
  {
    value: "absolute",
    label: "absolute",
    description: "Removed from flow; positioned vs nearest positioned ancestor.",
  },
  {
    value: "fixed",
    label: "fixed",
    description: "Positioned vs viewport (or ancestor with transform/filter).",
  },
  {
    value: "sticky",
    label: "sticky",
    description: "Hybrid — scrolls until threshold, then sticks.",
  },
];

const POSITION_REFERENCE: ReferenceRow[] = [
  {
    value: "static",
    description:
      "Default. The element is positioned according to the normal document flow. `top` / `right` / `bottom` / `left` / `z-index` do NOT apply.",
  },
  {
    value: "relative",
    description:
      "The element is offset from its normal position. It still occupies its original space in the flow (a 'ghost' remains), so siblings are NOT reflowed.",
  },
  {
    value: "absolute",
    description:
      "The element is removed from normal flow (no space reserved). It is positioned relative to its nearest positioned ancestor (an ancestor with `position` ≠ `static`). If none exists, it uses the initial containing block.",
  },
  {
    value: "fixed",
    description:
      "The element is removed from flow and positioned relative to the viewport — UNLESS an ancestor has `transform`, `perspective`, `filter`, `will-change: transform`, or `contain`, in which case that ancestor becomes the containing block. (This canvas applies `transform: translateZ(0)` to demonstrate the exception.)",
  },
  {
    value: "sticky",
    description:
      "Hybrid. The element flows normally until its scroll container would scroll it past the threshold set by `top` / `right` / `bottom` / `left`, at which point it 'sticks' as if fixed. It unsticks when its containing block scrolls out of view.",
  },
];

const DEFAULT_STATE: PlaygroundState = {
  position: "absolute",
  inset: {
    top: { value: 50, unit: "px", enabled: true },
    right: { value: 0, unit: "px", enabled: false },
    bottom: { value: 0, unit: "px", enabled: false },
    left: { value: 100, unit: "px", enabled: true },
  },
  zIndex: 10,
};

const PRESETS: Preset[] = [
  {
    id: "sticky-header",
    label: "Sticky header",
    build: () => ({
      position: "sticky",
      inset: {
        top: { value: 0, unit: "px", enabled: true },
        right: { value: 0, unit: "px", enabled: false },
        bottom: { value: 0, unit: "px", enabled: false },
        left: { value: 0, unit: "px", enabled: false },
      },
      zIndex: 100,
    }),
  },
  {
    id: "fab",
    label: "Floating action button",
    build: () => ({
      position: "fixed",
      inset: {
        top: { value: 0, unit: "px", enabled: false },
        right: { value: 24, unit: "px", enabled: true },
        bottom: { value: 24, unit: "px", enabled: true },
        left: { value: 0, unit: "px", enabled: false },
      },
      zIndex: 50,
    }),
  },
  {
    id: "overlay",
    label: "Overlay",
    build: () => ({
      position: "absolute",
      inset: {
        top: { value: 0, unit: "px", enabled: true },
        right: { value: 0, unit: "px", enabled: true },
        bottom: { value: 0, unit: "px", enabled: true },
        left: { value: 0, unit: "px", enabled: true },
      },
      zIndex: 1000,
    }),
  },
  {
    id: "tooltip",
    label: "Tooltip",
    build: () => ({
      position: "absolute",
      inset: {
        top: { value: -32, unit: "px", enabled: true },
        right: { value: 0, unit: "px", enabled: false },
        bottom: { value: 0, unit: "px", enabled: false },
        left: { value: 50, unit: "%", enabled: true },
      },
      zIndex: 10,
    }),
  },
  {
    id: "reset",
    label: "Reset",
    build: () => cloneState(DEFAULT_STATE),
  },
];

// ============================================================
// Helpers
// ============================================================

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function cloneState(s: PlaygroundState): PlaygroundState {
  return {
    position: s.position,
    zIndex: s.zIndex,
    inset: {
      top: { ...s.inset.top },
      right: { ...s.inset.right },
      bottom: { ...s.inset.bottom },
      left: { ...s.inset.left },
    },
  };
}

function unitRange(unit: LengthUnit): [number, number] {
  return unit === "px" ? [INSET_PX_MIN, INSET_PX_MAX] : [INSET_PCT_MIN, INSET_PCT_MAX];
}

/** Returns e.g. `"50px"` / `"-32px"` / `"50%"` or `undefined` when disabled. */
function insetStyleValue(c: InsetControl): string | undefined {
  if (!c.enabled) return undefined;
  return `${c.value}${c.unit}`;
}

function buildCSS(state: PlaygroundState): string {
  const lines: string[] = [".target {"];
  lines.push(`  position: ${state.position};`);
  const sides: InsetSide[] = ["top", "right", "bottom", "left"];
  for (const side of sides) {
    const c = state.inset[side];
    if (c.enabled) {
      lines.push(`  ${side}: ${c.value}${c.unit};`);
    }
  }
  if (state.zIndex !== 0) {
    lines.push(`  z-index: ${state.zIndex};`);
  }
  lines.push("}");
  return lines.join("\n");
}

// ============================================================
// Sub-components
// ============================================================

interface PositionButtonProps {
  meta: PositionMeta;
  active: boolean;
  onSelect: (value: PositionValue) => void;
}

function PositionButton({ meta, active, onSelect }: PositionButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onSelect(meta.value)}
      title={meta.description}
      className={cn(
        "group flex w-full flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all",
        active
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <span className="flex items-center gap-1.5">
        {active ? (
          <Crosshair className="size-3.5" />
        ) : (
          <Pin className="size-3.5 text-muted-foreground" />
        )}
        <span className="font-mono text-sm font-semibold">{meta.label}</span>
      </span>
      <span className="text-[11px] leading-snug text-muted-foreground">
        {meta.description}
      </span>
    </button>
  );
}

interface InsetSliderProps {
  side: InsetSide;
  control: InsetControl;
  onChange: (patch: Partial<InsetControl>) => void;
}

function InsetSlider({ side, control, onChange }: InsetSliderProps) {
  const [min, max] = unitRange(control.unit);
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-2.5 transition-opacity",
        !control.enabled && "opacity-60",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-1.5">
          <Switch
            checked={control.enabled}
            onCheckedChange={(v) => onChange({ enabled: v })}
            aria-label={`Enable ${side}`}
          />
          <span className="font-mono text-xs font-medium">{side}</span>
        </label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={control.value}
            min={min}
            max={max}
            step={1}
            disabled={!control.enabled}
            onChange={(e) => {
              const parsed = parseInt(e.target.value || "0", 10);
              const safe = Number.isFinite(parsed) ? parsed : 0;
              onChange({ value: clamp(safe, min, max) });
            }}
            className="h-7 w-14 pr-1 text-right font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => onChange({ unit: control.unit === "px" ? "%" : "px", value: 0 })}
            disabled={!control.enabled}
            className="flex h-7 w-8 items-center justify-center rounded-md border border-border bg-background font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            title={`Switch to ${control.unit === "px" ? "%" : "px"}`}
            aria-label={`Switch ${side} unit to ${control.unit === "px" ? "%" : "px"}`}
          >
            {control.unit}
          </button>
        </div>
      </div>
      <Slider
        value={[control.value]}
        min={min}
        max={max}
        step={1}
        disabled={!control.enabled}
        onValueChange={(v) => onChange({ value: v[0] })}
        className="w-full"
        aria-label={`${side} inset`}
      />
    </div>
  );
}

interface PresetChipProps {
  preset: Preset;
  onApply: () => void;
}

function PresetChip({ preset, onApply }: PresetChipProps) {
  const isReset = preset.id === "reset";
  return (
    <button
      type="button"
      onClick={onApply}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        isReset
          ? "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
          : "border-primary/30 bg-primary/10 text-primary hover:border-primary/50 hover:bg-primary/15",
      )}
    >
      {isReset ? <RefreshCw className="size-3" /> : <Sparkles className="size-3" />}
      {preset.label}
    </button>
  );
}

// ============================================================
// Main component
// ============================================================

export function PositioningPlayground(): ReactNode {
  const [state, setState] = useState<PlaygroundState>(() => cloneState(DEFAULT_STATE));
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTopPx: number;
    startLeftPx: number;
  } | null>(null);

  // Clear the copy-confirmation timer on unmount.
  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const cssString = useMemo(() => buildCSS(state), [state]);

  const isSticky = state.position === "sticky";
  const isDraggable =
    state.position === "relative" ||
    state.position === "absolute" ||
    state.position === "fixed";
  const isInsetRelevant = state.position !== "static";

  const targetStyle = useMemo<CSSProperties>(() => {
    const s: CSSProperties = { position: state.position };
    const top = insetStyleValue(state.inset.top);
    const right = insetStyleValue(state.inset.right);
    const bottom = insetStyleValue(state.inset.bottom);
    const left = insetStyleValue(state.inset.left);
    if (top !== undefined) s.top = top;
    if (right !== undefined) s.right = right;
    if (bottom !== undefined) s.bottom = bottom;
    if (left !== undefined) s.left = left;
    if (state.zIndex !== 0) s.zIndex = state.zIndex;
    return s;
  }, [state]);

  // --- State mutators -----------------------------------------------------

  const selectPosition = useCallback((value: PositionValue) => {
    setState((s) => ({ ...s, position: value }));
  }, []);

  const updateInset = useCallback(
    (side: InsetSide, patch: Partial<InsetControl>) => {
      setState((s) => ({
        ...s,
        inset: {
          ...s.inset,
          [side]: { ...s.inset[side], ...patch },
        },
      }));
    },
    [],
  );

  const setZIndex = useCallback((value: number) => {
    setState((s) => ({ ...s, zIndex: clamp(value, Z_MIN, Z_MAX) }));
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setState(preset.build());
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssString);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent — clipboard may be unavailable (permissions, non-secure context).
    }
  }, [cssString]);

  // --- Drag-to-position ---------------------------------------------------

  const onTargetPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggable) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const target = targetRef.current;
      const parent = parentRef.current;
      const canvas = canvasRef.current;
      if (!target || !parent || !canvas) return;
      e.preventDefault();
      // The containing block is the canvas for `fixed` (transform creates it),
      // the parent for `absolute`, and the parent for `relative` (offsets are
      // measured from the normal-flow position which lives inside the parent).
      const containingRect =
        state.position === "fixed"
          ? canvas.getBoundingClientRect()
          : parent.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const pointerId = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(pointerId);
      } catch {
        // setPointerCapture can throw if the pointer is no longer active.
      }
      dragStateRef.current = {
        pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startTopPx: targetRect.top - containingRect.top,
        startLeftPx: targetRect.left - containingRect.left,
      };
      setDragging(true);
    },
    [isDraggable, state.position],
  );

  const onTargetPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragStateRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const newTop = clamp(Math.round(d.startTopPx + dy), INSET_PX_MIN, INSET_PX_MAX);
      const newLeft = clamp(Math.round(d.startLeftPx + dx), INSET_PX_MIN, INSET_PX_MAX);
      setState((s) => ({
        ...s,
        inset: {
          ...s.inset,
          top: { value: newTop, unit: "px", enabled: true },
          left: { value: newLeft, unit: "px", enabled: true },
        },
      }));
    },
    [],
  );

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragStateRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(d.pointerId);
    } catch {
      // Release can throw if capture was already lost.
    }
    dragStateRef.current = null;
    setDragging(false);
  }, []);

  // --- Render -------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Position selector */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Crosshair className="size-3.5" />
          <span>position</span>
        </div>
        <div
          role="radiogroup"
          aria-label="CSS position value"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
        >
          {POSITION_META.map((meta) => (
            <PositionButton
              key={meta.value}
              meta={meta}
              active={state.position === meta.value}
              onSelect={selectPosition}
            />
          ))}
        </div>
      </section>

      {/* Interactive canvas */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="size-3.5" />
            <span>canvas</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {isSticky ? (
              <span className="flex items-center gap-1">
                <Move className="size-3" />
                Scroll to see sticky behavior
              </span>
            ) : isDraggable ? (
              <span className="flex items-center gap-1">
                <Move className="size-3" />
                Drag the target to reposition
              </span>
            ) : (
              <span>In normal flow — no positioning</span>
            )}
          </div>
        </div>
        <div
          ref={canvasRef}
          className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/30"
          style={{
            height: CANVAS_HEIGHT,
            overflowY: isSticky ? "auto" : "hidden",
            // The transform establishes a containing block for `position: fixed`
            // descendants — this is how the canvas "captures" fixed elements
            // instead of letting them escape to the viewport.
            transform: "translateZ(0)",
          }}
        >
          {isSticky && (
            <div className="space-y-1 px-4 pt-4 text-[11px] leading-relaxed text-muted-foreground">
              <p className="font-mono text-foreground/70">↑ scroll content above</p>
              <p>
                The target is <code className="font-mono">position: sticky</code> with{" "}
                <code className="font-mono">top: {state.inset.top.enabled ? `${state.inset.top.value}${state.inset.top.unit}` : "auto"}</code>.
                Scroll the canvas — the target sticks at its threshold until its
                containing block (the parent) scrolls out of view.
              </p>
            </div>
          )}

          <div
            ref={parentRef}
            className={cn(
              "relative mx-3 my-3 rounded-md border-2 border-dashed border-primary/40 bg-primary/[0.04] p-3",
              isSticky && "min-h-[120px]",
            )}
            style={{
              height: isSticky ? STICKY_PARENT_HEIGHT : undefined,
            }}
          >
            <div className="pointer-events-none absolute left-2 top-1.5 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <span className="rounded bg-background/80 px-1 py-px">parent</span>
              <span className="rounded bg-background/80 px-1 py-px">position: relative</span>
            </div>

            {/* Target */}
            <motion.div
              ref={targetRef}
              layout
              onPointerDown={onTargetPointerDown}
              onPointerMove={onTargetPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={targetStyle}
              className={cn(
                "select-none rounded-md border-2 px-3 py-2 shadow-sm",
                isDraggable
                  ? "cursor-grab touch-none border-primary bg-primary/15 active:cursor-grabbing"
                  : isSticky
                    ? "cursor-default touch-none border-primary bg-primary/15"
                    : "cursor-default border-primary bg-primary/15",
                dragging && "shadow-lg ring-2 ring-primary/30",
              )}
              animate={{ scale: dragging ? 1.03 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="flex items-center gap-1.5">
                {isDraggable ? (
                  <Move className="size-3 text-primary" />
                ) : (
                  <Pin className="size-3 text-primary" />
                )}
                <span className="font-mono text-xs font-semibold text-primary">
                  target
                </span>
              </div>
              <div className="mt-1 font-mono text-[10px] leading-tight text-muted-foreground">
                position: {state.position}
                <br />
                z: {state.zIndex}
              </div>
            </motion.div>

            {/* Sibling — sits in normal flow after the target */}
            <div className="mt-2 rounded-md border border-border bg-card px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Layers className="size-3 text-muted-foreground" />
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  sibling
                </span>
              </div>
              <div className="mt-1 font-mono text-[10px] leading-tight text-muted-foreground">
                in normal flow — slides up when target leaves flow
              </div>
            </div>
          </div>

          {isSticky && (
            <div className="space-y-1 px-4 pb-4 pt-2 text-[11px] leading-relaxed text-muted-foreground">
              <p className="font-mono text-foreground/70">↓ scroll content below</p>
              <p>
                Keep scrolling — the target unsticks once the parent box is
                scrolled past, exactly like a real sticky header.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Inset controls + z-index */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Crosshair className="size-3.5" />
            <span>insets &amp; z-index</span>
          </div>
          {!isInsetRelevant && (
            <Badge variant="outline" className="font-mono text-[10px]">
              inset / z-index ignored for position: static
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(["top", "right", "bottom", "left"] as InsetSide[]).map((side) => (
            <InsetSlider
              key={side}
              side={side}
              control={state.inset[side]}
              onChange={(patch) => updateInset(side, patch)}
            />
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <Layers className="size-3.5 text-primary" />
              <span className="font-mono">z-index</span>
            </Label>
            <Input
              type="number"
              value={state.zIndex}
              min={Z_MIN}
              max={Z_MAX}
              step={1}
              onChange={(e) => {
                const parsed = parseInt(e.target.value || "0", 10);
                setZIndex(Number.isFinite(parsed) ? parsed : 0);
              }}
              className="h-7 w-16 pr-1 text-right font-mono text-xs"
            />
          </div>
          <Slider
            value={[state.zIndex]}
            min={Z_MIN}
            max={Z_MAX}
            step={1}
            onValueChange={(v) => setZIndex(v[0])}
            className="w-full"
            aria-label="z-index"
          />
          <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground">
            <span>{Z_MIN}</span>
            <span>0 = auto</span>
            <span>{Z_MAX}</span>
          </div>
        </div>
      </section>

      {/* Presets */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3.5" />
          <span>presets</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <PresetChip
              key={preset.id}
              preset={preset}
              onApply={() => applyPreset(preset)}
            />
          ))}
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Tooltip preset uses <code className="font-mono">left: 50%</code> — pair
          with <code className="font-mono">translateX(-50%)</code> to truly center
          over the anchor.
        </p>
      </section>

      {/* Generated CSS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5" />
            <span>generated css</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
          <code>{cssString}</code>
        </pre>
      </section>

      {/* Reference table */}
      <Collapsible open={referenceOpen} onOpenChange={setReferenceOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-accent/40"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Info className="size-3.5" />
              <span>position reference</span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                referenceOpen && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-mono font-semibold">value</th>
                  <th className="px-3 py-2 font-semibold">behavior</th>
                </tr>
              </thead>
              <tbody>
                {POSITION_REFERENCE.map((row, i) => (
                  <tr
                    key={row.value}
                    className={cn(
                      "align-top",
                      i % 2 === 1 && "bg-muted/20",
                      state.position === row.value && "bg-primary/[0.06]",
                    )}
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold text-primary">
                      {row.value}
                    </td>
                    <td className="px-3 py-2 leading-relaxed text-foreground/80">
                      {row.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default PositioningPlayground;
