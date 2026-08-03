"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Timer,
  Copy,
  Check,
  Play,
  Pause,
  Plus,
  Trash2,
  RotateCcw,
  MousePointer2,
  Sparkles,
  Spline,
  ChevronDown,
  Zap,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * TransitionStudio — a multi-property CSS `transition` builder with live preview.
 *
 * Scope distinction from `easing-visualizer.tsx`:
 *  - EasingVisualizer is a deep single-curve designer (drag the bezier control
 *    points, watch a dot ride the curve, output one `transition-timing-function`).
 *  - TransitionStudio is the *transition-shorthand* layer above it: the user
 *    stacks multiple per-property transition rules (each with its own duration,
 *    timing-function, and delay), configures a "to" state, and triggers the
 *    real transition live (hover / click / looping play).
 *
 * Features:
 *  - Rules list: property (preset or custom) + duration (input/slider 0–3000ms)
 *    + timing-function (linear / ease / ease-in / ease-out / ease-in-out /
 *    step-start / step-end / steps(n, position) / cubic-bezier(x1,y1,x2,y2))
 *    + delay (input/slider 0–2000ms). Add / remove rules.
 *  - Inline 40×24 SVG thumbnail of the timing-function curve per rule
 *    (bezier sampled, or steps drawn as a staircase).
 *  - Live preview element that runs the ACTUAL `transition: ...` CSS:
 *      • Hover mode (whole preview area is the hover target).
 *      • Click mode (Trigger button toggles a class).
 *      • Play button auto-loops (forward, wait, reverse) using the longest
 *        rule's total duration (duration + delay) as the cycle period.
 *  - Configurable "to" state: transform preset, background-color picker,
 *    border-radius slider (0–50px), box-shadow preset.
 *  - Generated CSS: multi-property `transition:` shorthand (comma-separated)
 *    plus the `:hover` (or `.is-active`) block. Copy button + 2s Check.
 *  - Stats line: rule count + total duration (longest duration + delay).
 *  - Collapsible animatable-property reference (which CSS props transition vs
 *    snap instantly; `all` transitions every animatable prop).
 *
 * All cleanup-safe: the Play loop uses a single setTimeout chain that is
 * cancelled on unmount / pause / rule change.
 */

// ============================================================
// Types
// ============================================================

type TimingType =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "step-start"
  | "step-end"
  | "steps"
  | "cubic-bezier";

type StepsPosition = "jump-start" | "jump-end" | "jump-none" | "jump-both";

type TriggerMode = "hover" | "click";

type TransformPreset =
  | "none"
  | "scale(1.2)"
  | "rotate(45deg)"
  | "translateY(-20px)"
  | "scale(1.1) rotate(5deg)";

type ShadowPreset = "none" | "soft" | "glow";

interface BezierVals {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface TransitionRule {
  id: string;
  /** "__custom__" sentinel switches to the free-text `customProperty` input. */
  property: string;
  customProperty: string;
  duration: number;
  timingType: TimingType;
  bezier: BezierVals;
  stepsCount: number;
  stepsPosition: StepsPosition;
  delay: number;
}

interface HoverState {
  transform: TransformPreset;
  backgroundColor: string;
  borderRadius: number;
  boxShadow: ShadowPreset;
}

// ============================================================
// Constants
// ============================================================

const CUSTOM_SENTINEL = "__custom__";

const PROPERTIES: { value: string; label: string }[] = [
  { value: "all", label: "all" },
  { value: "transform", label: "transform" },
  { value: "opacity", label: "opacity" },
  { value: "background-color", label: "background-color" },
  { value: "color", label: "color" },
  { value: "border-color", label: "border-color" },
  { value: "box-shadow", label: "box-shadow" },
  { value: "filter", label: "filter" },
  { value: "width", label: "width" },
  { value: "height", label: "height" },
  { value: "margin", label: "margin" },
  { value: "padding", label: "padding" },
  { value: CUSTOM_SENTINEL, label: "custom…" },
];

const TIMING_TYPES: { value: TimingType; label: string }[] = [
  { value: "linear", label: "linear" },
  { value: "ease", label: "ease" },
  { value: "ease-in", label: "ease-in" },
  { value: "ease-out", label: "ease-out" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "step-start", label: "step-start" },
  { value: "step-end", label: "step-end" },
  { value: "steps", label: "steps(n)" },
  { value: "cubic-bezier", label: "cubic-bezier()" },
];

const STEPS_POSITIONS: { value: StepsPosition; label: string }[] = [
  { value: "jump-start", label: "jump-start" },
  { value: "jump-end", label: "jump-end" },
  { value: "jump-none", label: "jump-none" },
  { value: "jump-both", label: "jump-both" },
];

const TRANSFORM_PRESETS: { value: TransformPreset; label: string }[] = [
  { value: "none", label: "none" },
  { value: "scale(1.2)", label: "scale(1.2)" },
  { value: "rotate(45deg)", label: "rotate(45deg)" },
  { value: "translateY(-20px)", label: "translateY(-20px)" },
  { value: "scale(1.1) rotate(5deg)", label: "scale(1.1) rotate(5deg)" },
];

const SHADOW_PRESETS: { value: ShadowPreset; label: string }[] = [
  { value: "none", label: "none" },
  { value: "soft", label: "soft" },
  { value: "glow", label: "glow" },
];

const SHADOW_VALUES: Record<ShadowPreset, string> = {
  none: "none",
  soft:
    "0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.25)",
  glow: "0 0 28px rgba(13, 148, 136, 0.65)",
};

/**
 * Named CSS easings expressed as their cubic-bezier equivalents, so we can
 * render the same 40×24 thumbnail for every rule. Values from the CSS spec.
 * (`step-start` / `step-end` are handled separately as staircase curves.)
 */
const EASING_BEZIER: Record<string, BezierVals> = {
  linear: { x1: 0, y1: 0, x2: 1, y2: 1 },
  ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
  "ease-in": { x1: 0.42, y1: 0, x2: 1, y2: 1 },
  "ease-out": { x1: 0, y1: 0, x2: 0.58, y2: 1 },
  "ease-in-out": { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
};

/** Animatable-property reference rows. */
const PROPERTY_REFERENCE: {
  property: string;
  animatable: boolean;
  note: string;
}[] = [
  { property: "transform", animatable: true, note: "GPU-composited; very cheap to animate" },
  { property: "opacity", animatable: true, note: "GPU-composited; very cheap to animate" },
  { property: "filter", animatable: true, note: "blur/brightness/etc. — GPU but can be costly" },
  { property: "background-color", animatable: true, note: "paints each frame; OK for small areas" },
  { property: "color", animatable: true, note: "paints each frame; cheap on text" },
  { property: "border-color", animatable: true, note: "paints each frame" },
  { property: "box-shadow", animatable: true, note: "can be expensive — prefer filter: drop-shadow" },
  { property: "width / height", animatable: true, note: "triggers layout on every frame — avoid" },
  { property: "margin / padding", animatable: true, note: "triggers layout — avoid for large subtrees" },
  { property: "top / left", animatable: true, note: "triggers layout — prefer transform: translate()" },
  { property: "all", animatable: true, note: "shorthand — transitions every animatable property" },
  { property: "display", animatable: false, note: "snaps instantly (no intermediate values)" },
  { property: "position", animatable: false, note: "snaps instantly" },
  { property: "font-family", animatable: false, note: "snaps (no implicit interpolation)" },
];

const DEFAULT_HOVER_STATE: HoverState = {
  transform: "scale(1.2)",
  backgroundColor: "#0d9488",
  borderRadius: 24,
  boxShadow: "soft",
};

// ============================================================
// Helpers
// ============================================================

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Format a number for CSS output: trim trailing zeros, keep ≤3 decimals. */
function fmt(n: number): string {
  return Number(n.toFixed(3)).toString();
}

/** Resolve the actual CSS property name for a rule (preset or custom). */
function ruleProperty(rule: TransitionRule): string {
  if (rule.property === CUSTOM_SENTINEL) {
    const trimmed = rule.customProperty.trim();
    return trimmed.length > 0 ? trimmed : "all";
  }
  return rule.property;
}

/** Build the timing-function value string for a rule. */
function timingFunctionValue(rule: TransitionRule): string {
  switch (rule.timingType) {
    case "linear":
    case "ease":
    case "ease-in":
    case "ease-out":
    case "ease-in-out":
    case "step-start":
    case "step-end":
      return rule.timingType;
    case "steps":
      return `steps(${rule.stepsCount}, ${rule.stepsPosition})`;
    case "cubic-bezier":
      return `cubic-bezier(${fmt(rule.bezier.x1)}, ${fmt(rule.bezier.y1)}, ${fmt(rule.bezier.x2)}, ${fmt(rule.bezier.y2)})`;
  }
}

/** Resolve a rule's timing-function into a bezier, if it has one. */
function ruleBezier(rule: TransitionRule): BezierVals | null {
  if (rule.timingType === "cubic-bezier") return rule.bezier;
  return EASING_BEZIER[rule.timingType] ?? null;
}

/** Resolve a rule's timing-function into a steps descriptor, if it is one. */
function ruleSteps(
  rule: TransitionRule,
): { count: number; position: StepsPosition } | null {
  if (rule.timingType === "steps") {
    return { count: rule.stepsCount, position: rule.stepsPosition };
  }
  if (rule.timingType === "step-start") {
    return { count: 1, position: "jump-start" };
  }
  if (rule.timingType === "step-end") {
    return { count: 1, position: "jump-end" };
  }
  return null;
}

/** Total active time of a rule (ms) — when its final frame settles. */
function ruleTotalMs(rule: TransitionRule): number {
  return rule.duration + rule.delay;
}

/** Sample a cubic-bezier into an SVG polyline path inside the given box. */
function bezierPath(
  b: BezierVals,
  w: number,
  h: number,
  pad: number,
  samples = 32,
): string {
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const x = 3 * mt * mt * t * b.x1 + 3 * mt * t * t * b.x2 + t * t * t;
    const y = 3 * mt * mt * t * b.y1 + 3 * mt * t * t * b.y2 + t * t * t;
    pts.push(`${(pad + x * w).toFixed(2)} ${(pad + (1 - y) * h).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")}`;
}

/** Build an SVG staircase path for a `steps(N, position)` function. */
function stepsPath(
  count: number,
  position: StepsPosition,
  w: number,
  h: number,
  pad: number,
): string {
  const x = (t: number) => pad + t * w;
  const y = (v: number) => pad + (1 - v) * h;

  // Compute the (start_t, end_t, value) for each of the N intervals.
  const levels: { t0: number; t1: number; v: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t0 = i / count;
    const t1 = (i + 1) / count;
    let v: number;
    if (position === "jump-start") v = (i + 1) / count;
    else if (position === "jump-end") v = i / count;
    else if (position === "jump-none") v = i / (count + 1);
    else v = (i + 1) / (count + 1); // jump-both
    levels.push({ t0, t1, v });
  }

  const segs: string[] = [`M ${x(0).toFixed(2)} ${y(levels[0].v).toFixed(2)}`];
  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    segs.push(`L ${x(lvl.t1).toFixed(2)} ${y(lvl.v).toFixed(2)}`);
    if (i < levels.length - 1) {
      const next = levels[i + 1];
      // Vertical jump at the boundary (rendered as a near-vertical line).
      segs.push(`L ${x(lvl.t1).toFixed(2)} ${y(next.v).toFixed(2)}`);
    }
  }
  return segs.join(" ");
}

// ============================================================
// Sub-components
// ============================================================

interface TimingCurveProps {
  rule: TransitionRule;
  /** Inline label for screen readers. */
  ariaLabel?: string;
}

/** 40×24 inline SVG thumbnail of a rule's timing-function curve. */
function TimingCurve({ rule, ariaLabel }: TimingCurveProps) {
  const W = 40;
  const H = 24;
  const PAD = 3;
  const plotW = W - 2 * PAD;
  const plotH = H - 2 * PAD;

  const steps = ruleSteps(rule);
  const path = useMemo(() => {
    if (steps) {
      return stepsPath(steps.count, steps.position, plotW, plotH, PAD);
    }
    const b = ruleBezier(rule);
    if (b) return bezierPath(b, plotW, plotH, PAD);
    // Fallback: diagonal (linear).
    return bezierPath(EASING_BEZIER.linear, plotW, plotH, PAD);
  }, [steps, plotW, plotH, PAD, rule]);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="overflow-visible text-primary"
      role="img"
      aria-label={ariaLabel ?? `${rule.timingType} timing curve`}
    >
      {/* Frame */}
      <rect
        x={PAD}
        y={PAD}
        width={plotW}
        height={plotH}
        fill="none"
        className="stroke-border"
        strokeWidth={0.75}
      />
      {/* Diagonal reference */}
      <line
        x1={PAD}
        y1={PAD + plotH}
        x2={PAD + plotW}
        y2={PAD}
        className="stroke-muted-foreground/30"
        strokeWidth={0.5}
        strokeDasharray="2 2"
      />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface RuleCardProps {
  rule: TransitionRule;
  index: number;
  onChange: (id: string, patch: Partial<TransitionRule>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function RuleCard({ rule, index, onChange, onRemove, canRemove }: RuleCardProps) {
  const update = <K extends keyof TransitionRule>(
    key: K,
    value: TransitionRule[K],
  ) => onChange(rule.id, { [key]: value } as Partial<TransitionRule>);

  const updateBezier = (key: keyof BezierVals, value: number) =>
    onChange(rule.id, {
      bezier: { ...rule.bezier, [key]: value },
    });

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      {/* Row 1: property select + curve + remove */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <Select
          value={rule.property}
          onValueChange={(v) => update("property", v)}
        >
          <SelectTrigger
            className="h-8 flex-1 font-mono text-xs"
            aria-label={`Rule ${index + 1} property`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROPERTIES.map((p) => (
              <SelectItem key={p.value} value={p.value} className="font-mono text-xs">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="shrink-0 rounded border border-border/60 bg-muted/40 p-0.5">
          <TimingCurve rule={rule} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(rule.id)}
          disabled={!canRemove}
          aria-label={`Remove rule ${index + 1}`}
          title="Remove rule"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Custom property input */}
      {rule.property === CUSTOM_SENTINEL && (
        <div className="space-y-1">
          <Label
            htmlFor={`rule-${rule.id}-custom`}
            className="text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            Custom property
          </Label>
          <Input
            id={`rule-${rule.id}-custom`}
            value={rule.customProperty}
            onChange={(e) => update("customProperty", e.target.value)}
            placeholder="e.g. letter-spacing"
            className="h-8 font-mono text-xs"
          />
        </div>
      )}

      {/* Row 2: duration */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Duration
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={3000}
              step={50}
              value={rule.duration}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) update("duration", clamp(n, 0, 3000));
              }}
              className="h-7 w-20 text-right font-mono text-xs"
              aria-label={`Rule ${index + 1} duration in milliseconds`}
            />
            <span className="font-mono text-[10px] text-muted-foreground">ms</span>
          </div>
        </div>
        <Slider
          value={[rule.duration]}
          min={0}
          max={3000}
          step={50}
          onValueChange={(v) => update("duration", v[0])}
          aria-label={`Rule ${index + 1} duration slider`}
        />
      </div>

      {/* Row 3: timing-function */}
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Timing function
        </Label>
        <Select
          value={rule.timingType}
          onValueChange={(v) => update("timingType", v as TimingType)}
        >
          <SelectTrigger className="h-8 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMING_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="font-mono text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cubic-bezier controls */}
      {rule.timingType === "cubic-bezier" && (
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              { key: "x1", label: "x1", min: 0, max: 1 },
              { key: "y1", label: "y1", min: -0.5, max: 1.5 },
              { key: "x2", label: "x2", min: 0, max: 1 },
              { key: "y2", label: "y2", min: -0.5, max: 1.5 },
            ] as const
          ).map(({ key, label, min, max }) => (
            <div key={key} className="space-y-0.5">
              <Label
                htmlFor={`rule-${rule.id}-${key}`}
                className="font-mono text-[9px] text-muted-foreground"
              >
                {label}
              </Label>
              <Input
                id={`rule-${rule.id}-${key}`}
                type="number"
                step={0.01}
                min={min}
                max={max}
                value={rule.bezier[key]}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  if (!Number.isNaN(n)) updateBezier(key, clamp(n, min, max));
                }}
                className="h-7 text-right font-mono text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {/* Steps controls */}
      {rule.timingType === "steps" && (
        <div className="grid grid-cols-2 gap-1.5">
          <div className="space-y-0.5">
            <Label
              htmlFor={`rule-${rule.id}-steps-count`}
              className="text-[9px] uppercase tracking-wider text-muted-foreground"
            >
              Count
            </Label>
            <Input
              id={`rule-${rule.id}-steps-count`}
              type="number"
              min={1}
              max={50}
              step={1}
              value={rule.stepsCount}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) update("stepsCount", clamp(n, 1, 50));
              }}
              className="h-7 text-right font-mono text-xs"
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Position
            </Label>
            <Select
              value={rule.stepsPosition}
              onValueChange={(v) => update("stepsPosition", v as StepsPosition)}
            >
              <SelectTrigger className="h-8 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STEPS_POSITIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="font-mono text-xs">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Row 4: delay */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Delay
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={2000}
              step={50}
              value={rule.delay}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) update("delay", clamp(n, 0, 2000));
              }}
              className="h-7 w-20 text-right font-mono text-xs"
              aria-label={`Rule ${index + 1} delay in milliseconds`}
            />
            <span className="font-mono text-[10px] text-muted-foreground">ms</span>
          </div>
        </div>
        <Slider
          value={[rule.delay]}
          min={0}
          max={2000}
          step={50}
          onValueChange={(v) => update("delay", v[0])}
          aria-label={`Rule ${index + 1} delay slider`}
        />
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

let ruleIdCounter = 1;
function makeRuleId(): string {
  return `ts-rule-${ruleIdCounter++}`;
}

function makeDefaultRule(): TransitionRule {
  return {
    id: makeRuleId(),
    property: "all",
    customProperty: "",
    duration: 300,
    timingType: "ease",
    bezier: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
    stepsCount: 4,
    stepsPosition: "jump-end",
    delay: 0,
  };
}

export function TransitionStudio() {
  // ── State ────────────────────────────────────────────────────────
  const [rules, setRules] = useState<TransitionRule[]>(() => [
    {
      id: "ts-rule-seed",
      property: "all",
      customProperty: "",
      duration: 300,
      timingType: "ease",
      bezier: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
      stepsCount: 4,
      stepsPosition: "jump-end",
      delay: 0,
    },
  ]);
  const [hoverState, setHoverState] = useState<HoverState>(DEFAULT_HOVER_STATE);
  const [triggerMode, setTriggerMode] = useState<TriggerMode>("hover");
  const [hovering, setHovering] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refOpen, setRefOpen] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived: longest total duration (drives Play cycle) ─────────
  const longestTotalMs = useMemo(
    () => rules.reduce((max, r) => Math.max(max, ruleTotalMs(r)), 0),
    [rules],
  );

  const totalDurationLabel = useMemo(() => `${longestTotalMs}ms`, [longestTotalMs]);

  // ── Derived: live inline transition string ──────────────────────
  const transitionValue = useMemo(
    () =>
      rules
        .map(
          (r) =>
            `${ruleProperty(r)} ${r.duration}ms ${timingFunctionValue(r)} ${r.delay}ms`,
        )
        .join(", "),
    [rules],
  );

  // ── Derived: base + "to" state inline styles ────────────────────
  const baseStyle = useMemo(
    () => ({
      backgroundColor: "#71717a",
      borderRadius: "12px",
      transform: "none",
      boxShadow: "none",
    }),
    [],
  );

  const toStyle = useMemo(
    () => ({
      backgroundColor: hoverState.backgroundColor,
      borderRadius: `${hoverState.borderRadius}px`,
      transform: hoverState.transform,
      boxShadow: SHADOW_VALUES[hoverState.boxShadow],
    }),
    [hoverState],
  );

  // Active preview state: hover-mode mirrors `hovering`, click-mode mirrors `clicked`.
  const isTriggered = triggerMode === "hover" ? hovering : clicked;

  const previewStyle = useMemo(
    () => ({
      ...baseStyle,
      ...(isTriggered ? toStyle : {}),
      transition: transitionValue,
    }),
    [baseStyle, toStyle, isTriggered, transitionValue],
  );

  // ── Derived: generated CSS output (memoized) ────────────────────
  const generatedCss = useMemo(() => {
    const transitionLines = rules
      .map(
        (r) =>
          `  ${ruleProperty(r)} ${r.duration}ms ${timingFunctionValue(r)} ${r.delay}ms`,
      )
      .join(",\n");

    const selectorSuffix = triggerMode === "hover" ? ":hover" : ".is-active";

    const toDecls: string[] = [];
    if (hoverState.transform !== "none") {
      toDecls.push(`  transform: ${hoverState.transform};`);
    }
    toDecls.push(`  background-color: ${hoverState.backgroundColor};`);
    toDecls.push(`  border-radius: ${hoverState.borderRadius}px;`);
    if (hoverState.boxShadow !== "none") {
      toDecls.push(`  box-shadow: ${SHADOW_VALUES[hoverState.boxShadow]};`);
    }

    return `.element {
  transition:
${transitionLines};
}
.element${selectorSuffix} {
${toDecls.join("\n")}
}`;
  }, [rules, hoverState, triggerMode]);

  // ── Actions ─────────────────────────────────────────────────────
  const addRule = useCallback(() => {
    setRules((prev) => [...prev, makeDefaultRule()]);
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRule = useCallback(
    (id: string, patch: Partial<TransitionRule>) => {
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const handleReset = useCallback(() => {
    setRules([{ ...makeDefaultRule(), id: "ts-rule-seed" }]);
    setHoverState(DEFAULT_HOVER_STATE);
    setTriggerMode("hover");
    setHovering(false);
    setClicked(false);
    setPlaying(false);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCss);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, [generatedCss]);

  // ── Play loop: forward → wait → reverse → wait → repeat ─────────
  // Uses the longest rule's total duration as the cycle period (so every
  // rule has time to complete). Single setTimeout chain — cancelled on
  // unmount, pause, or rule change (via the `longestTotalMs` dep). The
  // initial `setClicked(true)` is deferred to a rAF so we don't trigger a
  // synchronous re-render inside the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!playing) return;
    const cycle = Math.max(longestTotalMs + 400, 600);

    let cancelled = false;

    const tick = (forward: boolean) => {
      if (cancelled) return;
      setClicked(forward);
      playTimeoutRef.current = setTimeout(() => tick(!forward), cycle);
    };

    // Kick off in the "to" state on the next frame.
    const kickoff = requestAnimationFrame(() => tick(true));

    return () => {
      cancelled = true;
      cancelAnimationFrame(kickoff);
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = null;
      }
    };
  }, [playing, longestTotalMs]);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // When the user pauses, snap back to the base state so the preview doesn't
  // get stuck mid-transition. (Hover mode lets `hovering` continue to drive.)
  // This is handled in the toggle handlers below rather than in an effect, to
  // avoid synchronous setState-in-effect cascading renders.

  const handlePlayToggle = useCallback(() => {
    setPlaying((prev) => {
      const next = !prev;
      if (!next && triggerMode === "click") {
        // Pausing — snap the preview back to base in click mode.
        setClicked(false);
      }
      return next;
    });
  }, [triggerMode]);

  const handleTriggerModeChange = useCallback(
    (mode: TriggerMode) => {
      setTriggerMode(mode);
      // Reset transient trigger state when leaving a mode.
      if (mode === "hover") setClicked(false);
      else setHovering(false);
    },
    [],
  );

  const handleTriggerClick = useCallback(() => {
    setClicked((c) => !c);
  }, []);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Timer className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">Transition Studio</h3>
            <p className="text-xs text-muted-foreground">
              Multi-property <code className="font-mono">transition</code> builder with live preview
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

      {/* ── Live preview ────────────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5" />
            Live Preview
          </span>
          <div className="flex items-center gap-2">
            <Tabs
              value={triggerMode}
              onValueChange={(v) => handleTriggerModeChange(v as TriggerMode)}
            >
              <TabsList className="h-8">
                <TabsTrigger value="hover" className="gap-1 text-xs">
                  <MousePointer2 className="size-3" />
                  Hover
                </TabsTrigger>
                <TabsTrigger value="click" className="gap-1 text-xs">
                  <Zap className="size-3" />
                  Click
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePlayToggle}
              className="h-8 gap-1 text-xs"
              aria-label={playing ? "Pause auto-loop" : "Play auto-loop"}
              title={
                playing
                  ? "Pause auto-loop"
                  : "Auto-loop the transition (forward → reverse)"
              }
            >
              {playing ? (
                <>
                  <Pause className="size-3.5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="size-3.5" />
                  Play
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview area — hover target in hover mode */}
        <div
          className="relative flex min-h-[200px] items-center justify-center rounded-lg bg-muted/30 p-8"
          onMouseEnter={() => triggerMode === "hover" && setHovering(true)}
          onMouseLeave={() => triggerMode === "hover" && setHovering(false)}
          role="region"
          aria-label="Transition preview area"
        >
          {/* Hover-mode hint */}
          {triggerMode === "hover" && !hovering && !playing && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              hover this area
            </span>
          )}
          <div
            className="size-20 shrink-0"
            style={previewStyle}
            aria-label={`Preview element — currently ${isTriggered ? "in the transitioned state" : "in the base state"}`}
            role="img"
          />
        </div>

        {/* Click-mode trigger button */}
        {triggerMode === "click" && (
          <div className="flex items-center justify-center">
            <Button
              type="button"
              variant={clicked ? "default" : "secondary"}
              size="sm"
              onClick={handleTriggerClick}
              className="gap-1.5"
              aria-pressed={clicked}
            >
              <Zap className="size-3.5" />
              {clicked ? "Reverse" : "Trigger"}
            </Button>
          </div>
        )}

        {/* Inline transition summary */}
        <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-2">
          <code className="block overflow-x-auto font-mono text-[11px] text-foreground/80">
            transition: {transitionValue}
          </code>
        </div>
      </div>

      {/* ── Rules + "to" state config ───────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Rules list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Spline className="size-3.5" />
              Rules
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRule}
              className="h-7 gap-1 text-xs"
            >
              <Plus className="size-3.5" />
              Add rule
            </Button>
          </div>
          <div className="space-y-3">
            {rules.map((r, i) => (
              <RuleCard
                key={r.id}
                rule={r}
                index={i}
                onChange={updateRule}
                onRemove={removeRule}
                canRemove={rules.length > 1}
              />
            ))}
          </div>
        </div>

        {/* "To" state config */}
        <div className="space-y-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5" />
            To state
          </span>
          <div className="space-y-3 rounded-lg border border-border bg-card p-3">
            {/* Transform */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Transform
              </Label>
              <Select
                value={hoverState.transform}
                onValueChange={(v) =>
                  setHoverState((s) => ({ ...s, transform: v as TransformPreset }))
                }
              >
                <SelectTrigger className="h-8 font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFORM_PRESETS.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="font-mono text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Background color */}
            <div className="space-y-1">
              <Label
                htmlFor="ts-bg-color"
                className="text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                Background color
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id="ts-bg-color"
                  type="color"
                  value={hoverState.backgroundColor}
                  onChange={(e) =>
                    setHoverState((s) => ({ ...s, backgroundColor: e.target.value }))
                  }
                  className="size-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
                  aria-label="To state background color picker"
                />
                <Input
                  type="text"
                  value={hoverState.backgroundColor}
                  onChange={(e) =>
                    setHoverState((s) => ({ ...s, backgroundColor: e.target.value }))
                  }
                  className="h-8 flex-1 font-mono text-xs"
                  aria-label="To state background color hex value"
                />
              </div>
            </div>

            {/* Border radius */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Border radius
                </Label>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {hoverState.borderRadius}px
                </span>
              </div>
              <Slider
                value={[hoverState.borderRadius]}
                min={0}
                max={50}
                step={1}
                onValueChange={(v) =>
                  setHoverState((s) => ({ ...s, borderRadius: v[0] }))
                }
                aria-label="To state border radius"
              />
            </div>

            {/* Box shadow */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Box shadow
              </Label>
              <Select
                value={hoverState.boxShadow}
                onValueChange={(v) =>
                  setHoverState((s) => ({ ...s, boxShadow: v as ShadowPreset }))
                }
              >
                <SelectTrigger className="h-8 font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHADOW_PRESETS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="font-mono text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="gap-1 font-mono">
          <Spline className="size-3" />
          {rules.length} {rules.length === 1 ? "rule" : "rules"}
        </Badge>
        <Badge variant="secondary" className="gap-1 font-mono">
          <Timer className="size-3" />
          total: {totalDurationLabel}
        </Badge>
        <span className="text-[11px]">
          (longest = max(duration + delay) across rules)
        </span>
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
            aria-label={copied ? "CSS copied to clipboard" : "Copy generated CSS"}
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
        {triggerMode === "click" && (
          <p className="text-[10px] text-muted-foreground">
            For the click mode, toggle the <code className="font-mono">.is-active</code> class
            (e.g. via <code className="font-mono">element.classList.toggle(&apos;is-active&apos;)</code>).
          </p>
        )}
      </div>

      {/* ── Animatable-property reference ───────────────────────── */}
      <Collapsible
        open={refOpen}
        onOpenChange={setRefOpen}
        className="rounded-xl border border-border bg-card"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl p-4 text-left transition-colors hover:bg-muted/40"
            aria-expanded={refOpen}
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Spline className="size-3.5" />
              Animatable property reference
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                refOpen && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border p-4">
            <p className="mb-3 text-[11px] text-muted-foreground">
              CSS only interpolates <em>animatable</em> properties. Non-animatable
              ones (like <code className="font-mono">display</code>) still &quot;transition&quot;
              but snap instantly. The <code className="font-mono">all</code> keyword
              transitions every animatable property at once.
            </p>
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-2.5 py-1.5 font-medium">Property</th>
                    <th className="px-2.5 py-1.5 font-medium">Animatable?</th>
                    <th className="px-2.5 py-1.5 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {PROPERTY_REFERENCE.map((row) => (
                    <tr key={row.property} className="align-top">
                      <td className="px-2.5 py-1.5 font-mono text-foreground/80">
                        {row.property}
                      </td>
                      <td className="px-2.5 py-1.5">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-mono text-[10px]",
                            row.animatable
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                          )}
                        >
                          {row.animatable ? "yes" : "no"}
                        </Badge>
                      </td>
                      <td className="px-2.5 py-1.5 text-muted-foreground">
                        {row.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
