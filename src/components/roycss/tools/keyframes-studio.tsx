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
  Copy,
  Check,
  Sparkles,
  Plus,
  Trash2,
  Play,
  Film,
  ArrowUp,
  Wind,
  HeartPulse,
  RefreshCw,
  Vibrate,
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
 * KeyframesStudio — visual `@keyframes` editor.
 *
 * Timeline model: a list of stops, each with an offset (0–100 %) and a
 * bundle of animatable CSS properties (opacity, translateX, translateY,
 * scale, rotate, background-color). Five stops ship by default at
 * 0/25/50/75/100 %; the user can add custom-percentage stops, drag the
 * offset slider to reposition them, and delete any stop.
 *
 * The live preview injects a `<style>` block with the generated
 * `@keyframes <name> { … }` rule and a div that uses the matching
 * `animation` shorthand. Replay re-mounts the div so single-shot runs
 * restart; "infinite" loops continuously.
 *
 * Six presets: Fade in, Slide up, Bounce, Pulse, Rotate, Shake.
 *
 * Constraints: TS strict, zero `any`, zero `console.log`. Semantic theme
 * tokens for chrome; the preview box uses user-chosen hex backgrounds
 * (presets ship with emerald / rose / amber — no indigo, no blue).
 */

// ─── Types ────────────────────────────────────────────────────────────────

interface KeyframeStop {
  id: string;
  offset: number; // 0–100
  opacity: number; // 0–1
  translateX: number; // px
  translateY: number; // px
  scale: number; // 0.1–3
  rotate: number; // deg, -360–360
  backgroundColor: string; // hex
}

type IterationCount = 1 | "infinite";

interface KeyframePreset {
  key: string;
  label: string;
  Icon: typeof Film;
  duration: number; // seconds
  timingFunction: string;
  iterationCount: IterationCount;
  stops: KeyframeStop[];
}

// ─── Constants ────────────────────────────────────────────────────────────

const TIMING_OPTIONS: string[] = [
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "step-start",
  "step-end",
];

const DEFAULT_NAME = "roycss-anim";
const DEFAULT_BG = "#10b981"; // emerald-500

const COPY_CONFIRM_MS = 1500;

let stopIdCounter = 0;
const makeStopId = (): string => {
  stopIdCounter += 1;
  return `stop-${stopIdCounter}`;
};

const buildStop = (
  offset: number,
  partial: Partial<Omit<KeyframeStop, "id" | "offset">> = {},
): KeyframeStop => ({
  id: makeStopId(),
  offset,
  opacity: partial.opacity ?? 1,
  translateX: partial.translateX ?? 0,
  translateY: partial.translateY ?? 0,
  scale: partial.scale ?? 1,
  rotate: partial.rotate ?? 0,
  backgroundColor: partial.backgroundColor ?? DEFAULT_BG,
});

const DEFAULT_STOPS: KeyframeStop[] = [
  buildStop(0, { opacity: 0, translateY: 12 }),
  buildStop(25, { opacity: 1, translateY: 0 }),
  buildStop(50, { opacity: 1, translateY: 0 }),
  buildStop(75, { opacity: 1, translateY: 0 }),
  buildStop(100, { opacity: 1, translateY: 0 }),
];

const PRESETS: KeyframePreset[] = [
  {
    key: "fadeIn",
    label: "Fade in",
    Icon: Sparkles,
    duration: 1,
    timingFunction: "ease",
    iterationCount: 1,
    stops: [
      buildStop(0, { opacity: 0 }),
      buildStop(100, { opacity: 1 }),
    ],
  },
  {
    key: "slideUp",
    label: "Slide up",
    Icon: ArrowUp,
    duration: 0.6,
    timingFunction: "ease-out",
    iterationCount: 1,
    stops: [
      buildStop(0, { opacity: 0, translateY: 24 }),
      buildStop(100, { opacity: 1, translateY: 0 }),
    ],
  },
  {
    key: "bounce",
    label: "Bounce",
    Icon: Wind,
    duration: 1,
    timingFunction: "ease",
    iterationCount: "infinite",
    stops: [
      buildStop(0, { translateY: 0 }),
      buildStop(30, { translateY: -32 }),
      buildStop(50, { translateY: 0 }),
      buildStop(70, { translateY: -16 }),
      buildStop(100, { translateY: 0 }),
    ],
  },
  {
    key: "pulse",
    label: "Pulse",
    Icon: HeartPulse,
    duration: 1.5,
    timingFunction: "ease-in-out",
    iterationCount: "infinite",
    stops: [
      buildStop(0, { scale: 1 }),
      buildStop(50, { scale: 1.12 }),
      buildStop(100, { scale: 1 }),
    ],
  },
  {
    key: "rotate",
    label: "Rotate",
    Icon: RefreshCw,
    duration: 2,
    timingFunction: "linear",
    iterationCount: "infinite",
    stops: [
      buildStop(0, { rotate: 0 }),
      buildStop(100, { rotate: 360 }),
    ],
  },
  {
    key: "shake",
    label: "Shake",
    Icon: Vibrate,
    duration: 0.5,
    timingFunction: "ease-in-out",
    iterationCount: "infinite",
    stops: [
      buildStop(0, { translateX: 0 }),
      buildStop(25, { translateX: -10 }),
      buildStop(50, { translateX: 10 }),
      buildStop(75, { translateX: -10 }),
      buildStop(100, { translateX: 0 }),
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

const formatOffset = (offset: number): string =>
  offset === 0 ? "0%" : offset === 100 ? "100%" : `${offset}%`;

const formatStopRule = (stop: KeyframeStop): string => {
  const lines: string[] = [
    `    opacity: ${stop.opacity};`,
    `    transform: translateX(${stop.translateX}px) translateY(${stop.translateY}px) scale(${stop.scale}) rotate(${stop.rotate}deg);`,
    `    background-color: ${stop.backgroundColor};`,
  ];
  return `  ${formatOffset(stop.offset)} {\n${lines.join("\n")}\n  }`;
};

const buildKeyframesBlock = (name: string, stops: KeyframeStop[]): string => {
  const sorted = [...stops].sort((a, b) => a.offset - b.offset);
  const body = sorted.map(formatStopRule).join("\n");
  return `@keyframes ${name} {\n${body}\n}`;
};

const buildAnimationShorthand = (
  name: string,
  duration: number,
  timing: string,
  iteration: IterationCount,
): string =>
  `animation: ${name} ${duration}s ${timing} ${iteration === "infinite" ? "infinite" : iteration};`;

const isHex = (v: string): boolean => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

// ─── Component ────────────────────────────────────────────────────────────

export function KeyframesStudio() {
  const [stops, setStops] = useState<KeyframeStop[]>(DEFAULT_STOPS);
  const [selectedStopId, setSelectedStopId] = useState<string>(
    DEFAULT_STOPS[0]!.id,
  );
  const [duration, setDuration] = useState<number>(1.5);
  const [timing, setTiming] = useState<string>("ease");
  const [iteration, setIteration] = useState<IterationCount>("infinite");
  const [animationName, setAnimationName] = useState<string>(DEFAULT_NAME);
  const [replayKey, setReplayKey] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const flashCopied = useCallback((key: string) => {
    setCopiedKey(key);
    if (copiedTimerRef.current !== null) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => {
      setCopiedKey(null);
      copiedTimerRef.current = null;
    }, COPY_CONFIRM_MS);
  }, []);

  const handleCopy = useCallback(
    async (text: string, key: string) => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
      } catch {
        /* clipboard may be unavailable */
      }
      flashCopied(key);
    },
    [flashCopied],
  );

  // Auto-replay when keyframes change so the user sees their edit live.
  // We derive a fingerprint string from the editable state and use it as
  // part of the preview element's `key` so React remounts (and thereby
  // restarts) the animation on every edit. The separate `replayKey` state
  // is bumped by the Replay button to allow manual restarts without edits.
  const animationFingerprint = useMemo(
    () =>
      JSON.stringify({
        s: stops.map(
          (s) =>
            `${s.offset}:${s.opacity}:${s.translateX}:${s.translateY}:${s.scale}:${s.rotate}:${s.backgroundColor}`,
        ),
        d: duration,
        t: timing,
        i: iteration,
        n: animationName,
      }),
    [stops, duration, timing, iteration, animationName],
  );

  const selectedStop = useMemo(
    () => stops.find((s) => s.id === selectedStopId) ?? stops[0]!,
    [stops, selectedStopId],
  );

  const applyPreset = useCallback((preset: KeyframePreset) => {
    // Deep-clone stops with fresh ids so React keys stay unique.
    const cloned = preset.stops.map((s) => ({ ...s, id: makeStopId() }));
    setStops(cloned);
    setSelectedStopId(cloned[0]!.id);
    setDuration(preset.duration);
    setTiming(preset.timingFunction);
    setIteration(preset.iterationCount);
  }, []);

  const updateStop = useCallback(
    (id: string, patch: Partial<Omit<KeyframeStop, "id">>) => {
      setStops((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
    },
    [],
  );

  const addStop = useCallback(() => {
    // Find the largest gap between consecutive offsets (after sorting) and
    // place the new stop in the middle of it. Falls back to 50%.
    const sorted = [...stops].sort((a, b) => a.offset - b.offset);
    let bestGap = 0;
    let bestMid = 50;
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const a = sorted[i]!.offset;
      const b = sorted[i + 1]!.offset;
      const gap = b - a;
      if (gap > bestGap) {
        bestGap = gap;
        bestMid = Math.round((a + b) / 2);
      }
    }
    const newStop = buildStop(bestMid, { opacity: 1 });
    setStops((prev) => [...prev, newStop]);
    setSelectedStopId(newStop.id);
  }, [stops]);

  const deleteStop = useCallback(
    (id: string) => {
      setStops((prev) => {
        if (prev.length <= 2) return prev; // keep at least 2 stops
        const next = prev.filter((s) => s.id !== id);
        if (id === selectedStopId && next.length > 0) {
          setSelectedStopId(next[0]!.id);
        }
        return next;
      });
    },
    [selectedStopId],
  );

  const keyframesBlock = useMemo(
    () => buildKeyframesBlock(animationName || DEFAULT_NAME, stops),
    [animationName, stops],
  );

  const animationShorthand = useMemo(
    () =>
      buildAnimationShorthand(
        animationName || DEFAULT_NAME,
        duration,
        timing,
        iteration,
      ),
    [animationName, duration, timing, iteration],
  );

  const fullCss = useMemo(
    () => `${keyframesBlock}\n\n.animated {\n  ${animationShorthand}\n}`,
    [keyframesBlock, animationShorthand],
  );

  // Sorted stops for the timeline UI.
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.offset - b.offset),
    [stops],
  );

  const previewStyle = useMemo<CSSProperties>(
    () => ({
      animation: `${animationName || DEFAULT_NAME} ${duration}s ${timing} ${
        iteration === "infinite" ? "infinite" : iteration
      }`,
    }),
    [animationName, duration, timing, iteration],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Film className="size-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            @keyframes Studio
          </h3>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {stops.length} stops · {duration.toFixed(1)}s · {iteration}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Sculpt <code className="font-mono">@keyframes</code> stop-by-stop with
        opacity, transform, and background-color. The preview below replays the
        real animation every time you edit.
      </p>

      {/* Presets */}
      <div>
        <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Presets
        </Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PRESETS.map((preset) => {
            const Icon = preset.Icon;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset)}
                className="flex flex-col items-center gap-1.5 rounded-md border border-border bg-card p-2.5 text-center transition-colors hover:border-primary/40"
              >
                <Icon className="size-4 text-primary" />
                <span className="text-[11px] font-medium text-foreground">
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview + global controls */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live preview
          </Label>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => setReplayKey((k) => k + 1)}
          >
            <Play className="size-3.5" />
            Replay
          </Button>
        </div>

        <div className="flex items-center justify-center rounded-md bg-muted/40 p-6">
          {/* The key forces the element to remount so the animation restarts. */}
          <div
            key={`${replayKey}-${animationFingerprint}`}
            className="size-20 rounded-md shadow-md"
            style={previewStyle}
          />
        </div>

        <style>{keyframesBlock}</style>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="kf-name" className="text-xs text-muted-foreground">
              animation name
            </Label>
            <Input
              id="kf-name"
              value={animationName}
              onChange={(e) =>
                setAnimationName(
                  e.target.value.replace(/[^a-zA-Z0-9_-]/g, "-"),
                )
              }
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              timing function
            </Label>
            <Select value={timing} onValueChange={setTiming}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMING_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <Label className="text-xs text-muted-foreground">duration</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {duration.toFixed(1)}s
              </span>
            </div>
            <Slider
              className="mt-2"
              value={[duration]}
              onValueChange={(v) => setDuration(v[0] ?? 1)}
              min={0.5}
              max={10}
              step={0.1}
              aria-label="duration in seconds"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              iteration count
            </Label>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setIteration(1)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                  iteration === 1
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/40",
                )}
              >
                Once
              </button>
              <button
                type="button"
                onClick={() => setIteration("infinite")}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                  iteration === "infinite"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/40",
                )}
              >
                Infinite
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Timeline · {stops.length} stops
          </Label>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={addStop}
          >
            <Plus className="size-3.5" />
            Add stop
          </Button>
        </div>

        {/* Timeline track */}
        <div className="relative h-12 w-full rounded-md border border-border bg-muted/30">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          {sortedStops.map((stop) => {
            const isSelected = stop.id === selectedStopId;
            return (
              <button
                key={stop.id}
                type="button"
                onClick={() => setSelectedStopId(stop.id)}
                className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
                style={{ left: `${stop.offset}%` }}
                aria-label={`Stop at ${stop.offset}%`}
              >
                <span
                  className={cn(
                    "size-3 rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-border bg-background hover:border-primary/60",
                  )}
                />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {stop.offset}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected stop editor */}
        <div className="mt-4 rounded-md border border-border bg-background p-3">
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">
              Stop @ {selectedStop.offset}%
            </Label>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={() => deleteStop(selectedStop.id)}
              disabled={stops.length <= 2}
              aria-label="Delete selected stop"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Offset slider */}
            <div className="sm:col-span-2">
              <div className="flex items-baseline justify-between">
                <Label className="text-xs text-muted-foreground">offset</Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedStop.offset}%
                </span>
              </div>
              <Slider
                className="mt-2"
                value={[selectedStop.offset]}
                onValueChange={(v) =>
                  updateStop(selectedStop.id, {
                    offset: Math.round(v[0] ?? 0),
                  })
                }
                min={0}
                max={100}
                step={1}
                aria-label="stop offset"
              />
            </div>

            {/* Opacity */}
            <div>
              <div className="flex items-baseline justify-between">
                <Label className="text-xs text-muted-foreground">opacity</Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedStop.opacity.toFixed(2)}
                </span>
              </div>
              <Slider
                className="mt-2"
                value={[selectedStop.opacity]}
                onValueChange={(v) =>
                  updateStop(selectedStop.id, {
                    opacity: Math.round((v[0] ?? 0) * 100) / 100,
                  })
                }
                min={0}
                max={1}
                step={0.05}
                aria-label="opacity"
              />
            </div>

            {/* Scale */}
            <div>
              <div className="flex items-baseline justify-between">
                <Label className="text-xs text-muted-foreground">scale</Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedStop.scale.toFixed(2)}
                </span>
              </div>
              <Slider
                className="mt-2"
                value={[selectedStop.scale]}
                onValueChange={(v) =>
                  updateStop(selectedStop.id, {
                    scale: Math.round((v[0] ?? 1) * 100) / 100,
                  })
                }
                min={0.1}
                max={3}
                step={0.05}
                aria-label="scale"
              />
            </div>

            {/* TranslateX */}
            <div>
              <div className="flex items-baseline justify-between">
                <Label className="text-xs text-muted-foreground">
                  translateX (px)
                </Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedStop.translateX}
                </span>
              </div>
              <Slider
                className="mt-2"
                value={[selectedStop.translateX]}
                onValueChange={(v) =>
                  updateStop(selectedStop.id, { translateX: v[0] ?? 0 })
                }
                min={-100}
                max={100}
                step={1}
                aria-label="translateX"
              />
            </div>

            {/* TranslateY */}
            <div>
              <div className="flex items-baseline justify-between">
                <Label className="text-xs text-muted-foreground">
                  translateY (px)
                </Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedStop.translateY}
                </span>
              </div>
              <Slider
                className="mt-2"
                value={[selectedStop.translateY]}
                onValueChange={(v) =>
                  updateStop(selectedStop.id, { translateY: v[0] ?? 0 })
                }
                min={-100}
                max={100}
                step={1}
                aria-label="translateY"
              />
            </div>

            {/* Rotate */}
            <div>
              <div className="flex items-baseline justify-between">
                <Label className="text-xs text-muted-foreground">
                  rotate (deg)
                </Label>
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedStop.rotate}
                </span>
              </div>
              <Slider
                className="mt-2"
                value={[selectedStop.rotate]}
                onValueChange={(v) =>
                  updateStop(selectedStop.id, { rotate: v[0] ?? 0 })
                }
                min={-360}
                max={360}
                step={5}
                aria-label="rotate"
              />
            </div>

            {/* Background color */}
            <div>
              <Label className="text-xs text-muted-foreground">
                background-color
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={
                    isHex(selectedStop.backgroundColor)
                      ? selectedStop.backgroundColor
                      : DEFAULT_BG
                  }
                  onChange={(e) =>
                    updateStop(selectedStop.id, {
                      backgroundColor: e.target.value,
                    })
                  }
                  className="size-8 shrink-0 cursor-pointer rounded border border-border bg-background p-0.5"
                  aria-label="background color picker"
                />
                <Input
                  value={selectedStop.backgroundColor}
                  onChange={(e) =>
                    updateStop(selectedStop.id, {
                      backgroundColor: e.target.value,
                    })
                  }
                  className="h-8 flex-1 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated CSS */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Generated CSS
          </Label>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => handleCopy(fullCss, "css")}
          >
            {copiedKey === "css" ? (
              <>
                <Check className="size-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" /> Copy CSS
              </>
            )}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-md bg-muted/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground">
          <code>{fullCss}</code>
        </pre>
      </div>
    </div>
  );
}

export default KeyframesStudio;
