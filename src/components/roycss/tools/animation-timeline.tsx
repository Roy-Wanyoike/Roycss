"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  Gauge,
  AlertTriangle,
  ChevronDown,
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * AnimationTimelineVisualizer — a Gantt-style timeline showing multiple CSS
 * animations running in parallel.
 *
 * Scope distinction from `src/components/roycss/animation-timeline.tsx`:
 *  - The legacy component models a SINGLE animation's keyframes (offset /
 *    transform / opacity stops) and a single play/pause + duration/easing.
 *  - This tool is a MULTI-TRACK timeline: each track is one `animation:`
 *    declaration (name + duration + delay + iteration-count +
 *    timing-function), and the user sees them as parallel bars on a shared
 *    time axis. The RAF playhead scrubs across all tracks simultaneously,
 *    overlap detection flags tracks whose active windows intersect, and
 *    the generated CSS is one `.selector { animation: ...; }` rule per
 *    track.
 *
 * Features:
 *  - N tracks (default 3). Add / remove / edit per track: name, duration
 *    (0.1–10s), delay (0–5s), iteration-count (1–10), timing-function
 *    (linear / ease / ease-in / ease-out / ease-in-out / step-start /
 *    step-end / steps(4)).
 *  - Transport: Play / Pause (single RAF loop, looping at totalDuration),
 *    Restart, speed tabs (0.5× / 1× / 2×), scrubber slider, current-time /
 *    total-time readout.
 *  - Gantt visualization: per-track horizontal bar positioned by `delay`
 *    and sized by `duration × iterations`, with internal dividers showing
 *    iteration boundaries. Time axis at top. Vertical playhead line across
 *    all tracks (with a small triangle handle). Active track (playhead
 *    inside its window) gets a brighter ring.
 *  - Overlap detection: pairs of tracks whose active windows intersect are
 *    flagged with an amber badge; hovered/selected overlapping tracks are
 *    highlighted together.
 *  - Generated CSS: one `.selector { animation: ...; }` rule per track,
 *    plus a comment reminding the user to define the @keyframes. Copy
 *    button + 2s Check confirmation.
 *
 * All cleanup-safe: the RAF loop is cancelled on unmount, pause, speed
 * change, or track change. Copy timeout cleared on unmount. No console.log.
 * No `any`.
 */

// ============================================================
// Types
// ============================================================

interface Track {
  id: string;
  name: string;
  duration: number; // seconds, 0.1 - 10
  delay: number; // seconds, 0 - 5
  iterations: number; // 1 - 10
  timingFunction: string;
  color: string; // hex
}

type Speed = 0.5 | 1 | 2;

type TimingFunctionValue =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "step-start"
  | "step-end"
  | "steps(4)";

// ============================================================
// Constants
// ============================================================

const TRACK_COLORS = [
  "#0d9488", // teal-600
  "#f59e0b", // amber-500
  "#f43f5e", // rose-500
  "#84cc16", // lime-500
  "#10b981", // emerald-500
  "#f97316", // orange-500
];

const TIMING_FUNCTIONS: { value: TimingFunctionValue; label: string }[] = [
  { value: "linear", label: "linear" },
  { value: "ease", label: "ease" },
  { value: "ease-in", label: "ease-in" },
  { value: "ease-out", label: "ease-out" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "step-start", label: "step-start" },
  { value: "step-end", label: "step-end" },
  { value: "steps(4)", label: "steps(4)" },
];

const TIMING_LABELS: Record<TimingFunctionValue, string> = {
  linear: "linear",
  ease: "ease",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  "step-start": "step-start",
  "step-end": "step-end",
  "steps(4)": "steps(4, jump-end)",
};

// ============================================================
// Helpers
// ============================================================

let trackIdCounter = 1;
function makeTrackId(): string {
  return `atl-track-${trackIdCounter++}`;
}

function makeDefaultTrack(index: number): Track {
  const presets: Partial<Track>[] = [
    { name: "fade", duration: 1.5, delay: 0, iterations: 3, timingFunction: "ease-in-out" },
    { name: "slide", duration: 1.0, delay: 0.5, iterations: 2, timingFunction: "ease" },
    { name: "pulse", duration: 0.8, delay: 0.2, iterations: 5, timingFunction: "ease-out" },
  ];
  const preset = presets[index % presets.length] ?? presets[0];
  return {
    id: makeTrackId(),
    color: TRACK_COLORS[index % TRACK_COLORS.length],
    ...preset,
  } as Track;
}

function makeDefaultTracks(): Track[] {
  return [0, 1, 2].map(makeDefaultTrack);
}

function trackEnd(track: Track): number {
  return track.delay + track.duration * track.iterations;
}

function trackIsActive(track: Track, currentTime: number): boolean {
  const end = trackEnd(track);
  return currentTime >= track.delay && currentTime <= end;
}

/** Time axis ticks: 5 evenly spaced from 0 to total. */
function makeTicks(total: number): { pct: number; label: string }[] {
  const ticks: { pct: number; label: string }[] = [];
  const count = 5;
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * total;
    ticks.push({ pct: (i / (count - 1)) * 100, label: `${t.toFixed(1)}s` });
  }
  return ticks;
}

function fmtTime(seconds: number): string {
  return `${seconds.toFixed(2)}s`;
}

// ============================================================
// Sub-components
// ============================================================

interface TrackBarProps {
  track: Track;
  total: number;
  currentTime: number;
  overlaps: boolean;
}

function TrackBar({ track, total, currentTime, overlaps }: TrackBarProps) {
  const startPct = total > 0 ? (track.delay / total) * 100 : 0;
  const widthPct = total > 0 ? (track.duration * track.iterations / total) * 100 : 0;
  const active = trackIsActive(track, currentTime);
  const iterPct = track.iterations > 0 ? 100 / track.iterations : 100;

  return (
    <div
      className={cn(
        "relative h-6 overflow-hidden rounded border transition-all",
        active
          ? "border-foreground/40 bg-muted/40"
          : "border-border/40 bg-muted/20",
        overlaps && "ring-1 ring-amber-500/50",
      )}
      role="img"
      aria-label={`Track ${track.name}: ${track.duration}s × ${track.iterations}, delay ${track.delay}s`}
    >
      {/* Bar */}
      <div
        className="absolute top-0 bottom-0 rounded-sm"
        style={{
          left: `${startPct}%`,
          width: `${Math.max(widthPct, 1)}%`,
          backgroundColor: track.color,
          opacity: active ? 1 : 0.55,
          transition: "opacity 120ms linear",
        }}
      >
        {/* Iteration dividers */}
        {track.iterations > 1 &&
          Array.from({ length: track.iterations - 1 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-black/20"
              style={{ left: `${(i + 1) * iterPct}%` }}
            />
          ))}
      </div>
    </div>
  );
}

interface TrackCardProps {
  track: Track;
  index: number;
  total: number;
  overlaps: boolean;
  onChange: (id: string, patch: Partial<Track>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function TrackCard({
  track,
  index,
  total,
  overlaps,
  onChange,
  onRemove,
  canRemove,
}: TrackCardProps) {
  const update = <K extends keyof Track>(key: K, value: Track[K]) =>
    onChange(track.id, { [key]: value } as Partial<Track>);

  return (
    <div
      className={cn(
        "space-y-2.5 rounded-lg border border-border bg-card p-3",
        overlaps && "ring-1 ring-amber-500/40",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: track.color }}
          aria-hidden
        />
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <Input
          type="text"
          value={track.name}
          onChange={(e) => update("name", e.target.value)}
          maxLength={20}
          className="h-7 flex-1 font-mono text-xs"
          aria-label={`Track ${index + 1} name`}
        />
        {overlaps && (
          <Badge
            variant="secondary"
            className="gap-1 bg-amber-500/15 text-[10px] text-amber-600 dark:text-amber-400"
            title="This track's active window overlaps another track's"
          >
            <AlertTriangle className="size-3" />
            overlap
          </Badge>
        )}
        <input
          type="color"
          value={track.color}
          onChange={(e) => update("color", e.target.value)}
          className="size-7 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
          aria-label={`Track ${index + 1} color`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(track.id)}
          disabled={!canRemove}
          aria-label={`Remove track ${index + 1}`}
          title="Remove track"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Sliders: duration / delay / iterations */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { key: "duration", label: "Duration", min: 0.1, max: 10, step: 0.1, unit: "s" },
            { key: "delay", label: "Delay", min: 0, max: 5, step: 0.1, unit: "s" },
            { key: "iterations", label: "Iter", min: 1, max: 10, step: 1, unit: "×" },
          ] as const
        ).map(({ key, label, min, max, step, unit }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {label}
              </Label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {track[key]}
                {unit}
              </span>
            </div>
            <Slider
              value={[track[key]]}
              min={min}
              max={max}
              step={step}
              onValueChange={(v) => update(key, v[0] as Track[typeof key])}
              aria-label={`Track ${index + 1} ${label}`}
            />
          </div>
        ))}
      </div>

      {/* Timing function */}
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Timing function
        </Label>
        <Select
          value={track.timingFunction}
          onValueChange={(v) => update("timingFunction", v)}
        >
          <SelectTrigger className="h-8 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMING_FUNCTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value} className="font-mono text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inline summary */}
      <div className="rounded-md border border-border/50 bg-muted/40 px-2.5 py-1.5">
        <code className="block overflow-x-auto font-mono text-[10px] text-foreground/80">
          {track.name}: {track.duration}s {track.timingFunction} {track.delay}s {track.iterations}
          {total > 0 && (
            <span className="text-muted-foreground">
              {"  "}(ends @ {trackEnd(track).toFixed(2)}s)
            </span>
          )}
        </code>
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export function AnimationTimelineVisualizer() {
  // ── State ────────────────────────────────────────────────────────
  const [tracks, setTracks] = useState<Track[]>(() => makeDefaultTracks());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [cssOpen, setCssOpen] = useState(true);

  // ── Refs ────────────────────────────────────────────────────────
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived: total timeline duration ────────────────────────────
  const totalDuration = useMemo(
    () => Math.max(...tracks.map(trackEnd), 1),
    [tracks],
  );

  // ── Derived: overlap detection ──────────────────────────────────
  const overlappingIds = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < tracks.length; i++) {
      for (let j = i + 1; j < tracks.length; j++) {
        const a = tracks[i];
        const b = tracks[j];
        const aStart = a.delay;
        const aEnd = trackEnd(a);
        const bStart = b.delay;
        const bEnd = trackEnd(b);
        if (aStart < bEnd && bStart < aEnd) {
          set.add(a.id);
          set.add(b.id);
        }
      }
    }
    return set;
  }, [tracks]);

  const overlapCount = overlappingIds.size;

  // ── Derived: time axis ticks ────────────────────────────────────
  const ticks = useMemo(() => makeTicks(totalDuration), [totalDuration]);

  // ── Derived: playhead percentage (0–100) ────────────────────────
  // `displayTime` clamps currentTime to the current totalDuration so the
  // playhead never renders past the right edge if the user shrinks the
  // timeline (by removing tracks or shortening them) while paused. The
  // RAF tick already loops back to 0 on overflow during playback.
  const displayTime = Math.min(currentTime, totalDuration);
  const playheadPct = totalDuration > 0
    ? Math.min(100, (displayTime / totalDuration) * 100)
    : 0;

  // ── Derived: generated CSS ──────────────────────────────────────
  const generatedCss = useMemo(() => {
    const lines = tracks.map(
      (t) =>
        `.${t.name || "track"} {\n  animation: ${t.name || "track"} ${t.duration}s ${t.timingFunction} ${t.delay}s ${t.iterations};\n}`,
    );
    const note = `/* Define each @keyframes rule separately, e.g.\n   @keyframes ${tracks[0]?.name || "track"} { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }\n   Total timeline: ${totalDuration.toFixed(2)}s */`;
    return `${lines.join("\n\n")}\n\n${note}`;
  }, [tracks, totalDuration]);

  // ── RAF play loop ───────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return;
    lastTsRef.current = null;

    const tick = (now: number) => {
      if (lastTsRef.current === null) {
        lastTsRef.current = now;
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = (now - lastTsRef.current) / 1000;
      lastTsRef.current = now;
      setCurrentTime((prev) => {
        const next = prev + dt * speed;
        if (next >= totalDuration) {
          // Loop back to 0 for continuous playback.
          return 0;
        }
        return next;
      });
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastTsRef.current = null;
    };
  }, [playing, speed, totalDuration]);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────
  const addTrack = useCallback(() => {
    setTracks((prev) => [
      ...prev,
      {
        ...makeDefaultTrack(prev.length),
        id: makeTrackId(),
      },
    ]);
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => (prev.length > 1 ? prev.filter((t) => t.id !== id) : prev));
  }, []);

  const updateTrack = useCallback((id: string, patch: Partial<Track>) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const handlePlayToggle = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentTime(0);
    lastTsRef.current = null;
  }, []);

  const handleScrub = useCallback((value: number) => {
    setPlaying(false);
    setCurrentTime(Math.max(0, Math.min(totalDuration, value)));
  }, [totalDuration]);

  const handleReset = useCallback(() => {
    setTracks(makeDefaultTracks());
    setPlaying(false);
    setSpeed(1);
    setCurrentTime(0);
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

  // Clamp currentTime if it exceeds a shrunken total — handled inline
  // via `displayTime` (derived), so no effect is needed.

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Film className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">Animation Timeline</h3>
            <p className="text-xs text-muted-foreground">
              Multi-track <code className="font-mono">animation</code> visualizer with RAF playhead
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

      {/* ── Transport ──────────────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Gauge className="size-3.5" />
            Transport
          </span>
          <div className="flex items-center gap-2">
            <Tabs
              value={String(speed)}
              onValueChange={(v) => setSpeed(parseFloat(v) as Speed)}
            >
              <TabsList className="h-8">
                <TabsTrigger value="0.5" className="text-xs">0.5×</TabsTrigger>
                <TabsTrigger value="1" className="text-xs">1×</TabsTrigger>
                <TabsTrigger value="2" className="text-xs">2×</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Play / Restart + time readout */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={playing ? "default" : "outline"}
            size="sm"
            onClick={handlePlayToggle}
            className="h-8 gap-1.5 text-xs"
            aria-label={playing ? "Pause" : "Play"}
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRestart}
            className="h-8 gap-1.5 text-xs"
            aria-label="Restart from beginning"
          >
            <RotateCcw className="size-3.5" />
            Restart
          </Button>
          <div className="ml-auto flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="text-foreground">{fmtTime(displayTime)}</span>
            <span>/</span>
            <span>{fmtTime(totalDuration)}</span>
          </div>
        </div>

        {/* Scrubber */}
        <Slider
          value={[displayTime]}
          min={0}
          max={totalDuration}
          step={0.01}
          onValueChange={(v) => handleScrub(v[0])}
          aria-label="Timeline scrubber"
        />
      </div>

      {/* ── Timeline visualization ─────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Film className="size-3.5" />
            Timeline
          </span>
          {overlapCount > 0 && (
            <Badge
              variant="secondary"
              className="gap-1 bg-amber-500/15 text-[10px] text-amber-600 dark:text-amber-400"
              title={`${overlapCount} tracks have overlapping active windows`}
            >
              <AlertTriangle className="size-3" />
              {overlapCount} overlap{overlapCount === 1 ? "" : "s"}
            </Badge>
          )}
        </div>

        {/* Time axis */}
        <div className="flex gap-2">
          <div className="w-24 shrink-0" aria-hidden />
          <div className="relative h-4 flex-1">
            {ticks.map((t, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
                style={{ left: `${t.pct}%` }}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* Tracks + playhead overlay */}
        <div className="flex gap-2">
          {/* Label column */}
          <div className="w-24 shrink-0 space-y-1.5">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex h-6 items-center gap-1.5"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: track.color }}
                  aria-hidden
                />
                <span className="truncate font-mono text-[11px] text-foreground/80">
                  {track.name || "—"}
                </span>
              </div>
            ))}
          </div>
          {/* Bar area + playhead */}
          <div className="relative flex-1 space-y-1.5">
            {tracks.map((track) => (
              <TrackBar
                key={track.id}
                track={track}
                total={totalDuration}
                currentTime={displayTime}
                overlaps={overlappingIds.has(track.id)}
              />
            ))}
            {/* Playhead line spanning all track rows */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-primary"
              style={{ left: `${playheadPct}%` }}
              aria-hidden
            >
              <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tracks ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Film className="size-3.5" />
            Tracks
            <Badge variant="secondary" className="ml-1 font-mono text-[10px]">
              {tracks.length}
            </Badge>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTrack}
            className="h-7 gap-1 text-xs"
          >
            <Plus className="size-3.5" />
            Add track
          </Button>
        </div>
        <div className="space-y-2.5">
          {tracks.map((track, i) => (
            <TrackCard
              key={track.id}
              track={track}
              index={i}
              total={totalDuration}
              overlaps={overlappingIds.has(track.id)}
              onChange={updateTrack}
              onRemove={removeTrack}
              canRemove={tracks.length > 1}
            />
          ))}
        </div>
      </div>

      {/* ── Generated CSS ───────────────────────────────────────── */}
      <Collapsible
        open={cssOpen}
        onOpenChange={setCssOpen}
        className="rounded-xl border border-border bg-card"
      >
        <div className="flex items-center justify-between p-4">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              aria-expanded={cssOpen}
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  cssOpen && "rotate-180",
                )}
              />
              Generated CSS
            </button>
          </CollapsibleTrigger>
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
        <CollapsibleContent>
          <div className="border-t border-border p-4 pt-0">
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground/80">
              <code>{generatedCss}</code>
            </pre>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Each track&apos;s <code className="font-mono">animation</code> shorthand is{" "}
              <code className="font-mono">name duration timing-function delay iteration-count</code>.
              Define the matching <code className="font-mono">@keyframes</code> rule separately.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
