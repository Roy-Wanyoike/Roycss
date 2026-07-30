"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  GitCompare,
  Plus,
  Minus,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Search,
  Sun,
  Moon,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";

const MAX_COMPARE = 4;
const MIN_COMPARE = 2;

interface ComparisonPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Effects to pre-populate the comparison with */
  initialEffects?: CSSEffect[];
  /** Called when user wants to view full details of an effect */
  onSelectEffect?: (effect: CSSEffect) => void;
}

/**
 * Parse CSS code into a map of property → value pairs for diffing.
 * Extracts the main selector's properties (not pseudo-elements/keyframes).
 */
function parseCSSProperties(cssCode: string): Record<string, string> {
  const props: Record<string, string> = {};
  // Match the first .roycss-X { ... } block (not ::before, ::after, > div)
  const mainMatch = cssCode.match(/^\.roycss-[a-z0-9-]+\s*\{([^}]+)\}/m);
  if (!mainMatch) return props;
  const body = mainMatch[1];
  const declarations = body.split(";").map((d) => d.trim()).filter(Boolean);
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) continue;
    const prop = decl.substring(0, colonIdx).trim();
    const value = decl.substring(colonIdx + 1).trim();
    if (prop && value) props[prop] = value;
  }
  return props;
}

/**
 * Compute which properties differ between effects.
 */
function computeDiff(effectList: CSSEffect[]): {
  allProps: string[];
  diffMap: Record<string, Record<string, string>>;
} {
  const propMaps = effectList.map((e) => parseCSSProperties(e.cssCode));
  const allPropsSet = new Set<string>();
  propMaps.forEach((m) => Object.keys(m).forEach((k) => allPropsSet.add(k)));
  const allProps = Array.from(allPropsSet).sort();
  const diffMap: Record<string, Record<string, string>> = {};
  for (const prop of allProps) {
    diffMap[prop] = {};
    effectList.forEach((e, i) => {
      diffMap[prop][`effect${i}`] = propMaps[i][prop] ?? "—";
    });
  }
  return { allProps, diffMap };
}

function EffectPicker({
  onPick,
  excludeIds,
}: {
  onPick: (effect: CSSEffect) => void;
  excludeIds: string[];
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = effects.filter((e) => !excludeIds.includes(e.id));
    if (!q) return base.slice(0, 30);
    return base
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)) ||
          e.category.includes(q),
      )
      .slice(0, 30);
  }, [search, excludeIds]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Search effects to compare..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10"
          autoFocus
        />
      </div>
      <div className="max-h-[50vh] overflow-y-auto scrollbar-thin space-y-1">
        {filtered.map((effect) => (
          <button
            key={effect.id}
            onClick={() => onPick(effect)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center justify-center size-10 rounded-lg bg-muted/40 border border-border/50 overflow-hidden shrink-0">
              <div className="scale-[0.45] origin-center">
                <LivePreview effect={effect} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{effect.name}</p>
              <p className="text-xs text-muted-foreground truncate">{effect.category} · {effect.tags.slice(0, 2).join(", ")}</p>
            </div>
            <Plus className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">No effects found</div>
        )}
      </div>
    </div>
  );
}

function ComparisonSlot({
  effect,
  onRemove,
  onReplace,
  onSelect,
  theme,
  isPlaying,
  speed,
  replayKey,
}: {
  effect: CSSEffect | null;
  onRemove: () => void;
  onReplace: () => void;
  onSelect: () => void;
  theme: "light" | "dark";
  isPlaying: boolean;
  speed: number;
  replayKey: number;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    if (!effect) return;
    try {
      await navigator.clipboard.writeText(`roycss-${effect.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }, [effect]);

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40 bg-muted/20">
        {effect ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{effect.name}</p>
              <p className="text-xs text-muted-foreground truncate">{effect.category}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                aria-label="Copy class name"
                title="Copy class name"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              </button>
              <button
                onClick={onReplace}
                className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
                aria-label="Replace effect"
                title="Replace"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                onClick={onRemove}
                className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-muted transition-all cursor-pointer"
                aria-label="Remove from comparison"
                title="Remove"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground flex-1">Empty slot</p>
            <button
              onClick={onReplace}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-all cursor-pointer"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </>
        )}
      </div>

      {/* Preview */}
      <div
        className="h-40 flex items-center justify-center overflow-hidden relative"
        style={{
          background: theme === "dark"
            ? "oklch(0.15 0.02 250)"
            : "oklch(0.96 0.01 250)",
        }}
      >
        {effect ? (
          <div
            key={`${effect.id}-${replayKey}`}
            style={{
              animationPlayState: isPlaying ? "running" : "paused",
              animationDuration: `${speed}s`,
            }}
          >
            <LivePreview effect={effect} />
          </div>
        ) : (
          <Plus className="size-8 text-muted-foreground/30" />
        )}
      </div>

      {/* Footer */}
      {effect && (
        <div className="px-3 py-2 border-t border-border/40 bg-muted/20">
          <button
            onClick={onSelect}
            className="w-full flex items-center justify-center gap-1 text-xs font-medium text-primary hover:gap-1.5 transition-all cursor-pointer"
          >
            View details <ArrowRight className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export function ComparisonPanel({ open, onOpenChange, initialEffects, onSelectEffect }: ComparisonPanelProps) {
  const [compareList, setCompareList] = useState<CSSEffect[]>([]);
  const [pickerOpen, setPickerOpen] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [replayKey, setReplayKey] = useState(0);
  const [showDiff, setShowDiff] = useState(false);

  // Track previous open state to sync initial effects on open (avoids useEffect + setState cascade)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (initialEffects && initialEffects.length > 0) {
        setCompareList(initialEffects.slice(0, MAX_COMPARE));
      }
    } else {
      setPickerOpen(null);
      setShowDiff(false);
    }
  }

  const handleAddEffect = useCallback((effect: CSSEffect) => {
    setCompareList((prev) => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.some((e) => e.id === effect.id)) return prev;
      return [...prev, effect];
    });
    setPickerOpen(null);
  }, []);

  const handleRemoveEffect = useCallback((index: number) => {
    setCompareList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleReplaceEffect = useCallback((index: number) => {
    setPickerOpen(index);
  }, []);

  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  const diff = useMemo(() => {
    if (compareList.length < MIN_COMPARE) return null;
    return computeDiff(compareList);
  }, [compareList]);

  const canCompare = compareList.length >= MIN_COMPARE;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
        <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <GitCompare className="size-5 text-primary" />
            Effect Comparison
          </SheetTitle>
          <SheetDescription>
            Compare up to {MAX_COMPARE} effects side-by-side with synchronized controls. See which one fits your design.
          </SheetDescription>
        </SheetHeader>

        <div className="p-5 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                onClick={handleReplay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-all cursor-pointer"
              >
                <RotateCcw className="size-3.5" /> Replay
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                <span className="text-xs font-medium text-muted-foreground">Speed</span>
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.5}
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-20 cursor-pointer"
                  aria-label="Animation speed"
                />
                <span className="text-xs font-mono text-primary w-8">{speed}s</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-all cursor-pointer"
              >
                {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              {canCompare && (
                <button
                  onClick={() => setShowDiff((d) => !d)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    showDiff ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <GitCompare className="size-3.5" /> CSS Diff
                </button>
              )}
            </div>
          </div>

          {/* Comparison slots */}
          <div className={`grid gap-3 ${compareList.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
            {Array.from({ length: MAX_COMPARE }).map((_, i) => (
              <ComparisonSlot
                key={i}
                effect={compareList[i] ?? null}
                onRemove={() => handleRemoveEffect(i)}
                onReplace={() => handleReplaceEffect(i)}
                onSelect={() => {
                  if (compareList[i] && onSelectEffect) {
                    onSelectEffect(compareList[i]);
                    onOpenChange(false);
                  }
                }}
                theme={theme}
                isPlaying={isPlaying}
                speed={speed}
                replayKey={replayKey}
              />
            ))}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {compareList.length} of {MAX_COMPARE} slots filled
              {!canCompare && ` (need at least ${MIN_COMPARE} to compare)`}
            </span>
            {compareList.length > 0 && (
              <button
                onClick={() => setCompareList([])}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-all cursor-pointer text-muted-foreground hover:text-rose-500"
              >
                <Trash2 className="size-3" /> Clear all
              </button>
            )}
          </div>

          {/* CSS Diff table */}
          <AnimatePresence>
            {showDiff && diff && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">CSS Properties Diff</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{diff.allProps.length} unique properties across {compareList.length} effects</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-thin">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Property</th>
                          {compareList.map((e, i) => (
                            <th key={i} className="text-left px-3 py-2 font-medium text-foreground truncate" title={e.name}>
                              {e.name.length > 15 ? e.name.substring(0, 13) + "…" : e.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {diff.allProps.map((prop) => {
                          const values = compareList.map((_, i) => diff.diffMap[prop][`effect${i}`]);
                          const isDifferent = values.length > 1 && !values.every((v) => v === values[0]);
                          return (
                            <tr key={prop} className={`border-t border-border/30 ${isDifferent ? "bg-amber-500/5" : ""}`}>
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">{prop}</td>
                              {values.map((val, i) => (
                                <td
                                  key={i}
                                  className={`px-3 py-1.5 font-mono ${
                                    isDifferent ? "text-amber-600 dark:text-amber-400" : "text-foreground/70"
                                  }`}
                                >
                                  {val.length > 30 ? val.substring(0, 28) + "…" : val}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state hint */}
          {compareList.length === 0 && !pickerOpen && (
            <div className="text-center py-12">
              <GitCompare className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-display text-base font-semibold text-foreground">Start comparing</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add {MIN_COMPARE}–{MAX_COMPARE} effects to see them side-by-side with synchronized controls.
              </p>
              <button
                onClick={() => setPickerOpen(0)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
              >
                <Plus className="size-4" /> Add first effect
              </button>
            </div>
          )}
        </div>

        {/* Effect picker overlay */}
        <AnimatePresence>
          {pickerOpen !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm p-5 overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">
                  {compareList[pickerOpen] ? "Replace effect" : "Add effect to comparison"}
                </h3>
                <button
                  onClick={() => setPickerOpen(null)}
                  className="flex items-center justify-center size-8 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  aria-label="Close picker"
                >
                  <X className="size-4" />
                </button>
              </div>
              <EffectPicker
                onPick={handleAddEffect}
                excludeIds={compareList.map((e) => e.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
