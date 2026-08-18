"use client";

/**
 * RoyMotionStudio — a visual animation builder with a video-editor-style
 * timeline.
 *
 * Self-contained (no props). Five property tracks (opacity, translateX,
 * translateY, scale, rotate) each holding draggable keyframe dots on a
 * normalised 0–1 timeline. A playhead scrubber with Play / Pause and a
 * 0.5s–5s duration slider drives the live preview card (rendered via
 * framer-motion so reduced-motion users get a static frame).
 *
 * Features
 *   • Per-keyframe easing selector (linear / easeIn / easeOut / easeInOut /
 *     bounce / sharp / smooth / elastic).
 *   • Click a keyframe to select it; drag horizontally to move it.
 *   • "Add keyframe" per track at the current playhead position.
 *   • Delete the selected keyframe (disabled if it's the only one — every
 *     track needs at least one anchor).
 *   • 4 presets — Bounce, Slide, Fade+Scale, Shake.
 *   • Export dialog with both `@keyframes` CSS and a framer-motion
 *     `keyframes` snippet, each with its own Copy button.
 *
 * SSR-safe: requestAnimationFrame only starts after mount; clipboard only
 * fires inside event handlers. TS strict, zero `any`. No indigo / blue.
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Download,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
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

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type PropertyName =
  | "opacity"
  | "translateX"
  | "translateY"
  | "scale"
  | "rotate";

type EasingName =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "bounce"
  | "sharp"
  | "smooth"
  | "elastic";

interface Keyframe {
  id: string;
  /** Normalised time on the timeline, 0–1. */
  time: number;
  /** Raw numeric value (interpretation depends on the track property). */
  value: number;
  easing: EasingName;
}

type Tracks = Record<PropertyName, readonly Keyframe[]>;

interface TrackMeta {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Accent tailwind classes (no indigo/blue). */
  accent: string;
  dot: string;
  hint: string;
}

interface PresetSpec {
  id: string;
  name: string;
  description: string;
  tracks: Tracks;
}

// ═══════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════

const TRACK_ORDER: readonly PropertyName[] = [
  "opacity",
  "translateX",
  "translateY",
  "scale",
  "rotate",
] as const;

const TRACK_META: Record<PropertyName, TrackMeta> = {
  opacity: {
    label: "Opacity",
    unit: "",
    min: 0,
    max: 1,
    step: 0.05,
    default: 1,
    accent: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500 ring-emerald-500/30",
    hint: "0 = invisible · 1 = fully visible",
  },
  translateX: {
    label: "Translate X",
    unit: "px",
    min: -200,
    max: 200,
    step: 1,
    default: 0,
    accent: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500 ring-teal-500/30",
    hint: "horizontal offset in pixels",
  },
  translateY: {
    label: "Translate Y",
    unit: "px",
    min: -200,
    max: 200,
    step: 1,
    default: 0,
    accent: "text-cyan-600 dark:text-cyan-400",
    dot: "bg-cyan-500 ring-cyan-500/30",
    hint: "vertical offset in pixels",
  },
  scale: {
    label: "Scale",
    unit: "×",
    min: 0.2,
    max: 2.5,
    step: 0.05,
    default: 1,
    accent: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500 ring-amber-500/30",
    hint: "1 = natural · 2 = double size",
  },
  rotate: {
    label: "Rotate",
    unit: "deg",
    min: -180,
    max: 180,
    step: 1,
    default: 0,
    accent: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500 ring-rose-500/30",
    hint: "rotation in degrees",
  },
};

const EASING_OPTIONS: readonly {
  value: EasingName;
  label: string;
  /** CSS cubic-bezier string (or "linear"). */
  css: string;
  /** Framer-motion ease name (or array). */
  fm: string;
}[] = [
  { value: "linear", label: "Linear", css: "linear", fm: '"linear"' },
  { value: "easeIn", label: "Ease In", css: "cubic-bezier(0.42,0,1,1)", fm: '"easeIn"' },
  { value: "easeOut", label: "Ease Out", css: "cubic-bezier(0,0,0.58,1)", fm: '"easeOut"' },
  { value: "easeInOut", label: "Ease In-Out", css: "cubic-bezier(0.42,0,0.58,1)", fm: '"easeInOut"' },
  { value: "bounce", label: "Bounce", css: "cubic-bezier(0.34,1.56,0.64,1)", fm: "[0.34, 1.56, 0.64, 1]" },
  { value: "sharp", label: "Sharp", css: "cubic-bezier(0.4,0,0.2,1)", fm: "[0.4, 0, 0.2, 1]" },
  { value: "smooth", label: "Smooth", css: "cubic-bezier(0.45,0.05,0.55,0.95)", fm: "[0.45, 0.05, 0.55, 0.95]" },
  { value: "elastic", label: "Elastic", css: "cubic-bezier(0.68,-0.55,0.265,1.55)", fm: "[0.68, -0.55, 0.265, 1.55]" },
] as const;

const EASING_CSS: Record<EasingName, string> = EASING_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.value] = opt.css;
    return acc;
  },
  {} as Record<EasingName, string>,
);

const EASING_FM: Record<EasingName, string> = EASING_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.value] = opt.fm;
    return acc;
  },
  {} as Record<EasingName, string>,
);

// ─── Easing curve functions (for the in-JS playhead preview) ───────────

const EASING_FN: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bounce: (t) => {
    // Simplified bounce-out — single overshoot.
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) {
      const t2 = t - 1.5 / 2.75;
      return 7.5625 * t2 * t2 + 0.75;
    }
    if (t < 2.5 / 2.75) {
      const t2 = t - 2.25 / 2.75;
      return 7.5625 * t2 * t2 + 0.9375;
    }
    const t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  },
  sharp: (t) => {
    // cubic-bezier(.4,0,.2,1) approximated via simple cubic solver.
    return 3 * t * t - 2 * t * t * t;
  },
  smooth: (t) => t * t * (3 - 2 * t),
  elastic: (t) => {
    if (t === 0 || t === 1) return t;
    return (
      Math.pow(2, -10 * t) * Math.sin(((t - 0.075) * (2 * Math.PI)) / 0.3) + 1
    );
  },
};

// ─── Presets ──────────────────────────────────────────────────────────

function kf(
  id: string,
  time: number,
  value: number,
  easing: EasingName = "easeInOut",
): Keyframe {
  return { id, time, value, easing };
}

let presetIdCounter = 0;
function freshId(prefix: string): string {
  presetIdCounter += 1;
  return `${prefix}-${presetIdCounter.toString(36)}`;
}

const PRESETS: readonly PresetSpec[] = [
  {
    id: "bounce",
    name: "Bounce",
    description: "Springy vertical bounce with elastic landing.",
    tracks: {
      opacity: [kf("b-o1", 0, 0, "easeOut"), kf("b-o2", 0.15, 1, "linear")],
      translateX: [kf("b-x", 0, 0, "linear")],
      translateY: [
        kf("b-y1", 0, -80, "easeIn"),
        kf("b-y2", 0.55, 0, "bounce"),
        kf("b-y3", 0.75, -20, "easeIn"),
        kf("b-y4", 1, 0, "bounce"),
      ],
      scale: [
        kf("b-s1", 0, 0.6, "easeOut"),
        kf("b-s2", 0.55, 1.15, "bounce"),
        kf("b-s3", 1, 1, "easeOut"),
      ],
      rotate: [kf("b-r", 0, 0, "linear")],
    },
  },
  {
    id: "slide",
    name: "Slide In",
    description: "Smooth slide from the left with fade-in.",
    tracks: {
      opacity: [kf("s-o1", 0, 0, "easeOut"), kf("s-o2", 0.4, 1, "linear")],
      translateX: [
        kf("s-x1", 0, -120, "easeOut"),
        kf("s-x2", 1, 0, "easeOut"),
      ],
      translateY: [kf("s-y", 0, 0, "linear")],
      scale: [kf("s-s", 0, 1, "linear")],
      rotate: [kf("s-r", 0, 0, "linear")],
    },
  },
  {
    id: "fade-scale",
    name: "Fade + Scale",
    description: "Gentle fade with a slight overshoot zoom.",
    tracks: {
      opacity: [kf("f-o1", 0, 0, "easeOut"), kf("f-o2", 1, 1, "linear")],
      translateX: [kf("f-x", 0, 0, "linear")],
      translateY: [kf("f-y", 0, 0, "linear")],
      scale: [
        kf("f-s1", 0, 0.5, "easeOut"),
        kf("f-s2", 0.7, 1.08, "bounce"),
        kf("f-s3", 1, 1, "easeOut"),
      ],
      rotate: [kf("f-r", 0, 0, "linear")],
    },
  },
  {
    id: "shake",
    name: "Shake",
    description: "Error-shake — quick horizontal jitters.",
    tracks: {
      opacity: [kf("k-o", 0, 1, "linear")],
      translateX: [
        kf("k-x1", 0, 0, "sharp"),
        kf("k-x2", 0.15, -14, "sharp"),
        kf("k-x3", 0.3, 12, "sharp"),
        kf("k-x4", 0.45, -10, "sharp"),
        kf("k-x5", 0.6, 8, "sharp"),
        kf("k-x6", 0.8, -4, "sharp"),
        kf("k-x7", 1, 0, "sharp"),
      ],
      translateY: [kf("k-y", 0, 0, "linear")],
      scale: [kf("k-s", 0, 1, "linear")],
      rotate: [kf("k-r", 0, 0, "linear")],
    },
  },
] as const;

const DEFAULT_TRACKS: Tracks = {
  opacity: [
    kf("def-o1", 0, 0, "easeOut"),
    kf("def-o2", 0.5, 1, "linear"),
    kf("def-o3", 1, 1, "easeIn"),
  ],
  translateX: [kf("def-x", 0, 0, "linear")],
  translateY: [kf("def-y", 0, 0, "linear")],
  scale: [kf("def-s", 0, 1, "linear")],
  rotate: [kf("def-r", 0, 0, "linear")],
};

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Sample a track value at the given normalised time t (0–1). */
function sampleTrack(track: readonly Keyframe[], t: number): number {
  if (track.length === 0) return 0;
  if (track.length === 1) return track[0].value;
  const sorted = [...track].sort((a, b) => a.time - b.time);
  if (t <= sorted[0].time) return sorted[0].value;
  if (t >= sorted[sorted.length - 1].time)
    return sorted[sorted.length - 1].value;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.time && t <= b.time) {
      const localT = (t - a.time) / (b.time - a.time || 1);
      const eased = EASING_FN[a.easing](localT);
      return a.value + (b.value - a.value) * eased;
    }
  }
  return sorted[sorted.length - 1].value;
}

/** Sample every track at once — returns the resolved preview style. */
function sampleAll(
  tracks: Tracks,
  t: number,
): {
  opacity: number;
  x: number;
  y: number;
  scale: number;
  rotate: number;
} {
  return {
    opacity: sampleTrack(tracks.opacity, t),
    x: sampleTrack(tracks.translateX, t),
    y: sampleTrack(tracks.translateY, t),
    scale: sampleTrack(tracks.scale, t),
    rotate: sampleTrack(tracks.rotate, t),
  };
}

/** Round a value to a sensible precision for display. */
function fmtValue(value: number, unit: string): string {
  if (unit === "") return value.toFixed(2);
  if (unit === "×") return `${value.toFixed(2)}×`;
  return `${value.toFixed(unit === "px" || unit === "deg" ? 0 : 2)}${unit}`;
}

/** Build the @keyframes CSS string for the current tracks. */
function buildKeyframesCss(
  tracks: Tracks,
  durationSec: number,
): string {
  const lines: string[] = [];
  lines.push("@keyframes roy-motion-studio {");
  // Collect every distinct timestamp across all tracks.
  const times = new Set<number>();
  times.add(0);
  times.add(1);
  for (const prop of TRACK_ORDER) {
    for (const k of tracks[prop]) times.add(k.time);
  }
  const sorted = [...times].sort((a, b) => a - b);
  for (const t of sorted) {
    const pct = (t * 100).toFixed(2);
    const pctStr = pct.endsWith(".00") ? pct.slice(0, -3) : pct;
    const s = sampleAll(tracks, t);
    // Determine the easing to emit at this keyframe — use the easing of
    // the keyframe whose time === t on the first track that has one.
    let easingForFrame: EasingName | null = null;
    for (const prop of TRACK_ORDER) {
      const found = tracks[prop].find((k) => k.time === t);
      if (found) {
        easingForFrame = found.easing;
        break;
      }
    }
    const transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(
      2,
    )}px) scale(${s.scale.toFixed(3)}) rotate(${s.rotate.toFixed(2)}deg)`;
    const block = [
      `  ${pctStr}% {`,
      `    opacity: ${s.opacity.toFixed(3)};`,
      `    transform: ${transform};`,
      easingForFrame
        ? `    animation-timing-function: ${EASING_CSS[easingForFrame]};`
        : null,
      `  }`,
    ]
      .filter(Boolean)
      .join("\n");
    lines.push(block);
  }
  lines.push("}");
  lines.push("");
  lines.push(".roy-motion-target {");
  lines.push(`  animation: roy-motion-studio ${durationSec.toFixed(2)}s infinite;`);
  lines.push("}");
  return lines.join("\n");
}

/** Build a framer-motion keyframes snippet for the current tracks. */
function buildFramerSnippet(
  tracks: Tracks,
  durationSec: number,
): string {
  const fmtArr = (track: readonly Keyframe[]): string =>
    `[${track.map((k) => k.value).join(", ")}]`;
  const fmtTimes = (track: readonly Keyframe[]): string =>
    `[${track.map((k) => k.time).join(", ")}]`;
  const fmtEase = (track: readonly Keyframe[]): string =>
    `[${track.map((k) => EASING_FM[k.easing]).join(", ")}]`;

  const active: PropertyName[] = TRACK_ORDER.filter(
    (p) => tracks[p].length >= 2,
  );

  const animateLines = active.map((p) => {
    const key = p === "translateX" ? "x" : p === "translateY" ? "y" : p;
    return `  ${key}: {
    keyframes: ${fmtArr(tracks[p])},
    times: ${fmtTimes(tracks[p])},
    ease: ${fmtEase(tracks[p])},
    duration: ${durationSec.toFixed(2)},
    repeat: Infinity,
  },`;
  });

  return `import { motion } from "framer-motion";

<motion.div animate={{\n${animateLines.join("\n")}\n}} />;`;
}

/** Sync clipboard with legacy fallback. */
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

interface TrackRowProps {
  property: PropertyName;
  keyframes: readonly Keyframe[];
  selectedId: string | null;
  playhead: number;
  onSelectKeyframe: (id: string) => void;
  onMoveKeyframe: (id: string, time: number) => void;
  onAddKeyframe: () => void;
  onUpdateSelected: (patch: Partial<Keyframe>) => void;
  onDeleteSelected: () => void;
}

function TrackRow({
  property,
  keyframes,
  selectedId,
  playhead,
  onSelectKeyframe,
  onMoveKeyframe,
  onAddKeyframe,
  onUpdateSelected,
  onDeleteSelected,
}: TrackRowProps): React.JSX.Element {
  const meta = TRACK_META[property];
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const draggingIdRef = React.useRef<string | null>(null);

  const sorted = React.useMemo(
    () => [...keyframes].sort((a, b) => a.time - b.time),
    [keyframes],
  );

  const selectedKf = React.useMemo(
    () => keyframes.find((k) => k.id === selectedId) ?? null,
    [keyframes, selectedId],
  );

  const pointerToTime = React.useCallback((clientX: number): number => {
    const rail = railRef.current;
    if (!rail) return 0;
    const rect = rail.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }, []);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
      event.preventDefault();
      event.stopPropagation();
      draggingIdRef.current = id;
      onSelectKeyframe(id);
      (event.currentTarget as HTMLButtonElement).setPointerCapture(
        event.pointerId,
      );
    },
    [onSelectKeyframe],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const id = draggingIdRef.current;
      if (id === null) return;
      const t = pointerToTime(event.clientX);
      onMoveKeyframe(id, t);
    },
    [onMoveKeyframe, pointerToTime],
  );

  const endDrag = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (draggingIdRef.current !== null) {
        draggingIdRef.current = null;
      }
      try {
        (event.currentTarget as HTMLDivElement).releasePointerCapture(
          event.pointerId,
        );
      } catch {
        // ignore — pointer already released
      }
    },
    [],
  );

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", meta.dot.split(" ")[0])} />
          <span className="text-sm font-medium text-foreground">
            {meta.label}
          </span>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            · {meta.hint}
          </span>
        </div>
        <button
          type="button"
          onClick={onAddKeyframe}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          aria-label={`Add keyframe to ${meta.label} track`}
        >
          <Plus className="size-3" aria-hidden />
          Add
        </button>
      </div>

      <div
        ref={railRef}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative h-10 w-full touch-none select-none rounded-md border border-border/70 bg-muted/40"
        aria-label={`${meta.label} timeline`}
      >
        {/* tick marks */}
        <div className="pointer-events-none absolute inset-0 flex items-center">
          {Array.from({ length: 11 }, (_, i) => (
            <span
              key={i}
              className="h-3 w-px bg-border/60"
              style={{ marginLeft: i === 0 ? 0 : "calc(10% - 1px)" }}
              aria-hidden
            />
          ))}
        </div>
        {/* playhead line */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-foreground/40"
          style={{ left: `${playhead * 100}%` }}
          aria-hidden
        />
        {/* keyframe dots */}
        {sorted.map((k) => {
          const isSelected = k.id === selectedId;
          return (
            <button
              key={k.id}
              type="button"
              onPointerDown={(e) => handlePointerDown(e, k.id)}
              className={cn(
                "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full ring-4 transition-transform hover:scale-110 active:cursor-grabbing",
                meta.dot,
                isSelected ? "scale-125 ring-4" : "ring-2",
              )}
              style={{ left: `${k.time * 100}%` }}
              aria-label={`Keyframe at ${(k.time * 100).toFixed(0)}% — value ${k.value}`}
              aria-pressed={isSelected}
            >
              <span className="sr-only">
                {meta.label} keyframe {fmtValue(k.value, meta.unit)} at{" "}
                {(k.time * 100).toFixed(0)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected keyframe editor */}
      {selectedKf ? (
        <div className="mt-3 rounded-md border border-border bg-background/60 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Selected keyframe
            </span>
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={keyframes.length <= 1}
              className="inline-flex h-6 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 text-[11px] font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
              aria-label="Delete selected keyframe"
            >
              <Trash2 className="size-3" aria-hidden />
              Delete
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Value
                </Label>
                <span className={cn("font-mono text-xs", meta.accent)}>
                  {fmtValue(selectedKf.value, meta.unit)}
                </span>
              </div>
              <Slider
                min={meta.min}
                max={meta.max}
                step={meta.step}
                value={[selectedKf.value]}
                onValueChange={(v) =>
                  onUpdateSelected({ value: v[0] ?? selectedKf.value })
                }
                aria-label={`${meta.label} value`}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Time
                </Label>
                <span className="font-mono text-xs text-foreground">
                  {(selectedKf.time * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[selectedKf.time]}
                onValueChange={(v) =>
                  onUpdateSelected({ time: v[0] ?? selectedKf.time })
                }
                aria-label={`${meta.label} keyframe time`}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">
                Easing (applies to the segment from this keyframe)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {EASING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateSelected({ easing: opt.value })
                    }
                    aria-pressed={selectedKf.easing === opt.value}
                    className={cn(
                      "inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedKf.easing === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Click a keyframe dot to edit its value, time, and easing.
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════

export function RoyMotionStudio(): React.JSX.Element {
  const [tracks, setTracks] = React.useState<Tracks>(DEFAULT_TRACKS);
  const [duration, setDuration] = React.useState<number>(1.5);
  const [playhead, setPlayhead] = React.useState<number>(0);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<{
    property: PropertyName;
    id: string;
  } | null>({ property: "opacity", id: "def-o2" });
  const [exportOpen, setExportOpen] = React.useState<boolean>(false);
  const [copiedCss, setCopiedCss] = React.useState<boolean>(false);
  const [copiedFm, setCopiedFm] = React.useState<boolean>(false);

  const rafRef = React.useRef<number | null>(null);
  const lastTickRef = React.useRef<number | null>(null);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // ─── Playback loop ────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTickRef.current = null;
      return;
    }
    const tick = (now: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = now;
      }
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setPlayhead((prev) => {
        const next = prev + delta / duration;
        return next >= 1 ? next - 1 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTickRef.current = null;
    };
  }, [isPlaying, duration]);

  // ─── Cleanup clipboard timer ──────────────────────────────────────
  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // ─── Live preview style (memoised) ───────────────────────────────
  const previewState = React.useMemo(
    () => sampleAll(tracks, playhead),
    [tracks, playhead],
  );

  const previewStyle = React.useMemo<React.CSSProperties>(
    () => ({
      opacity: previewState.opacity,
      transform: `translate(${previewState.x}px, ${previewState.y}px) scale(${previewState.scale}) rotate(${previewState.rotate}deg)`,
    }),
    [previewState],
  );

  // ─── Track mutators ───────────────────────────────────────────────
  const updateTrack = React.useCallback(
    (property: PropertyName, updater: (prev: readonly Keyframe[]) => readonly Keyframe[]) => {
      setTracks((prev) => ({
        ...prev,
        [property]: updater(prev[property]),
      }));
    },
    [],
  );

  const handleSelectKeyframe = React.useCallback(
    (property: PropertyName, id: string) => {
      setSelected({ property, id });
    },
    [],
  );

  const handleMoveKeyframe = React.useCallback(
    (property: PropertyName, id: string, time: number) => {
      updateTrack(property, (prev) =>
        prev.map((k) => (k.id === id ? { ...k, time } : k)),
      );
    },
    [updateTrack],
  );

  const handleAddKeyframe = React.useCallback(
    (property: PropertyName) => {
      const value = sampleTrack(tracks[property], playhead);
      const id = freshId(`kf-${property}`);
      const newKf: Keyframe = {
        id,
        time: Math.round(playhead * 100) / 100,
        value,
        easing: "easeInOut",
      };
      updateTrack(property, (prev) => [...prev, newKf]);
      setSelected({ property, id });
    },
    [playhead, tracks, updateTrack],
  );

  const handleUpdateSelected = React.useCallback(
    (patch: Partial<Keyframe>) => {
      if (!selected) return;
      updateTrack(selected.property, (prev) =>
        prev.map((k) =>
          k.id === selected.id ? { ...k, ...patch } : k,
        ),
      );
    },
    [selected, updateTrack],
  );

  const handleDeleteSelected = React.useCallback(() => {
    if (!selected) return;
    updateTrack(selected.property, (prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((k) => k.id !== selected.id);
      const fallback = next[0];
      if (fallback) {
        setSelected({ property: selected.property, id: fallback.id });
      } else {
        setSelected(null);
      }
      return next;
    });
  }, [selected, updateTrack]);

  const handleApplyPreset = React.useCallback((preset: PresetSpec) => {
    // Deep clone so the studio can mutate without touching the preset.
    const cloned: Tracks = {
      opacity: preset.tracks.opacity.map((k) => ({ ...k })),
      translateX: preset.tracks.translateX.map((k) => ({ ...k })),
      translateY: preset.tracks.translateY.map((k) => ({ ...k })),
      scale: preset.tracks.scale.map((k) => ({ ...k })),
      rotate: preset.tracks.rotate.map((k) => ({ ...k })),
    };
    setTracks(cloned);
    setSelected({ property: "opacity", id: cloned.opacity[0]?.id ?? "" });
    setPlayhead(0);
    setIsPlaying(false);
  }, []);

  const handleReset = React.useCallback(() => {
    setTracks({
      opacity: DEFAULT_TRACKS.opacity.map((k) => ({ ...k })),
      translateX: DEFAULT_TRACKS.translateX.map((k) => ({ ...k })),
      translateY: DEFAULT_TRACKS.translateY.map((k) => ({ ...k })),
      scale: DEFAULT_TRACKS.scale.map((k) => ({ ...k })),
      rotate: DEFAULT_TRACKS.rotate.map((k) => ({ ...k })),
    });
    setSelected({ property: "opacity", id: "def-o2" });
    setPlayhead(0);
    setIsPlaying(false);
  }, []);

  const togglePlay = React.useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  // ─── Export strings ──────────────────────────────────────────────
  const cssExport = React.useMemo(
    () => buildKeyframesCss(tracks, duration),
    [tracks, duration],
  );
  const fmExport = React.useMemo(
    () => buildFramerSnippet(tracks, duration),
    [tracks, duration],
  );

  const handleCopyCss = React.useCallback(async () => {
    const ok = await copyToClipboard(cssExport);
    if (ok) {
      setCopiedCss(true);
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedCss(false);
        copyTimeoutRef.current = null;
      }, 1800);
    }
  }, [cssExport]);

  const handleCopyFm = React.useCallback(async () => {
    const ok = await copyToClipboard(fmExport);
    if (ok) {
      setCopiedFm(true);
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedFm(false);
        copyTimeoutRef.current = null;
      }, 1800);
    }
  }, [fmExport]);

  return (
    <section
      aria-label="Roy Motion Studio"
      className="mx-auto w-full max-w-6xl px-1 py-2"
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Roy Motion Studio
          </h2>
          <p className="text-sm text-muted-foreground">
            Visual keyframe animation builder · 5 tracks · 8 easings · live
            preview · CSS + framer-motion export.
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
            Export
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

      {/* ─── Live preview ─────────────────────────────────────────── */}
      <div className="mb-5 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/40 to-background">
        <div className="flex items-center justify-between border-b border-border bg-background/60 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Live preview
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            t = {(playhead * 100).toFixed(0)}% · {duration.toFixed(2)}s
          </span>
        </div>
        <div className="relative flex h-64 items-center justify-center overflow-hidden">
          {/* faint grid backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle, hsl(var(--border) / 0.4) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <motion.div
            className="relative flex h-32 w-44 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-xl"
            style={previewStyle}
            animate={false}
          >
            <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
              RoyCSS
            </span>
            <span className="text-lg font-bold">Motion</span>
            <span className="mt-0.5 text-[10px] opacity-70">
              {(previewState.opacity * 100).toFixed(0)}% opacity
            </span>
          </motion.div>
        </div>
      </div>

      {/* ─── Transport controls ──────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant={isPlaying ? "secondary" : "default"}
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="size-4" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
            </Button>
            <button
              type="button"
              onClick={() => {
                setPlayhead(0);
                setIsPlaying(false);
              }}
              className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Restart
            </button>
          </div>

          <div className="flex flex-1 items-center gap-3">
            <Label
              htmlFor="playhead-slider"
              className="text-xs text-muted-foreground"
            >
              Playhead
            </Label>
            <Slider
              id="playhead-slider"
              min={0}
              max={1}
              step={0.001}
              value={[playhead]}
              onValueChange={(v) => {
                setPlayhead(v[0] ?? 0);
                setIsPlaying(false);
              }}
              aria-label="Scrub playhead"
              className="flex-1"
            />
          </div>

          <div className="flex items-center gap-3 lg:w-56">
            <Label
              htmlFor="duration-slider"
              className="text-xs text-muted-foreground"
            >
              Duration
            </Label>
            <Slider
              id="duration-slider"
              min={0.5}
              max={5}
              step={0.1}
              value={[duration]}
              onValueChange={(v) => setDuration(v[0] ?? duration)}
              aria-label="Animation duration"
              className="flex-1"
            />
            <span className="w-12 text-right font-mono text-xs text-foreground">
              {duration.toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* ─── Tracks ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {TRACK_ORDER.map((property) => (
          <TrackRow
            key={property}
            property={property}
            keyframes={tracks[property]}
            selectedId={selected?.property === property ? selected.id : null}
            playhead={playhead}
            onSelectKeyframe={(id) => handleSelectKeyframe(property, id)}
            onMoveKeyframe={(id, time) =>
              handleMoveKeyframe(property, id, time)
            }
            onAddKeyframe={() => handleAddKeyframe(property)}
            onUpdateSelected={handleUpdateSelected}
            onDeleteSelected={handleDeleteSelected}
          />
        ))}
      </div>

      {/* ─── Export dialog ───────────────────────────────────────── */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Export animation</DialogTitle>
            <DialogDescription>
              Copy the generated CSS `@keyframes` or the equivalent
              framer-motion snippet. Both render the same animation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  @keyframes CSS
                </span>
                <Button
                  size="sm"
                  variant={copiedCss ? "secondary" : "outline"}
                  onClick={handleCopyCss}
                >
                  {copiedCss ? (
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
              <pre className="max-h-56 overflow-auto px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
                <code>{cssExport}</code>
              </pre>
            </div>

            <div className="rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Framer Motion
                </span>
                <Button
                  size="sm"
                  variant={copiedFm ? "secondary" : "outline"}
                  onClick={handleCopyFm}
                >
                  {copiedFm ? (
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
              <pre className="max-h-56 overflow-auto px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
                <code>{fmExport}</code>
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
