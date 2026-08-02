"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanSearch,
  Search,
  Copy,
  Check,
  Sparkles,
  Tag,
  Code2,
  X,
} from "lucide-react";
import { effects } from "@/lib/roycss-effects";
import { categoryMeta, type CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════
   CSS PROPERTY EXTRACTION
   ═══════════════════════════════════════════════════════════════ */

/**
 * Extract the set of CSS property names used in a stylesheet string.
 *
 * - Strips C-style block comments first.
 * - Splits the source on `;`, `{`, `}` to get declaration tokens.
 * - Matches tokens that look like `property:` (lowercase letters + dashes).
 * - Skips selectors, at-rules, keyframe selectors (from/to/30%) and custom
 *   properties (CSS variables) since they don't start with a bare property name.
 * - Normalizes vendor prefixes (`-webkit-transform` → `transform`).
 *
 * Good enough for similarity scoring — not a full CSS parser.
 */
export function extractCssProperties(css: string): Set<string> {
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const props = new Set<string>();
  const tokens = cleaned.split(/[;{}]/);
  const propRegex = /^(-?[a-z][a-z-]*)\s*:/i;
  for (const raw of tokens) {
    const token = raw.trim();
    const match = token.match(propRegex);
    if (!match) continue;
    let prop = match[1].toLowerCase();
    // Skip custom properties (CSS variables like --foo)
    if (prop.startsWith("--")) continue;
    // Normalize vendor prefixes
    prop = prop.replace(/^-(?:webkit|moz|ms|o)-/, "");
    props.add(prop);
  }
  return props;
}

/* ═══════════════════════════════════════════════════════════════
   SCORING HELPERS
   ═══════════════════════════════════════════════════════════════ */

/** Jaccard similarity between two sets: |A∩B| / |A∪B|. Returns 0–1. */
function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let intersection = 0;
  for (const item of small) {
    if (large.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

interface EffectFeatures {
  effect: CSSEffect;
  tags: Set<string>;
  category: string;
  properties: Set<string>;
}

interface SimilarityResult {
  effect: CSSEffect;
  score: number;
  sharedTags: string[];
  sharedProperties: string[];
}

interface SimilarityStats {
  analyzed: number;
  topScore: number;
  topName: string;
  avg: number;
}

/** Background color tier for a 0–100 similarity score. */
function scoreTierClass(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-primary";
  if (score >= 30) return "bg-amber-500";
  return "bg-muted-foreground";
}

/** Human-readable label for a score tier. */
function scoreTierLabel(score: number): string {
  if (score >= 75) return "Very similar";
  if (score >= 50) return "Similar";
  if (score >= 30) return "Related";
  return "Loosely related";
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const TOP_N = 12;
const WEIGHT_TAGS = 50; // 50% weight — jaccard × 50 → 0–50
const WEIGHT_CATEGORY = 20; // 20% weight — same category → 20
const WEIGHT_PROPERTIES = 30; // 30% weight — jaccard × 30 → 0–30
const PICKER_MAX_OPTIONS = 50;

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

/**
 * SimilarityFinder — pick a seed effect, instantly see the top-12 most
 * similar effects in the library via a weighted blend of:
 *   • tag overlap (Jaccard × 50)
 *   • category match (20 if same, else 0)
 *   • CSS property overlap (Jaccard × 30)
 *
 * The feature index (tags + parsed properties per effect) is built ONCE
 * on mount, so per-seed scoring is just fast set intersections.
 */
export function SimilarityFinder() {
  const [seedId, setSeedId] = useState<string>(() => effects[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ─── Precompute feature index ONCE (empty deps) ─── */
  const effectIndex = useMemo<Map<string, EffectFeatures>>(() => {
    const map = new Map<string, EffectFeatures>();
    for (const effect of effects) {
      map.set(effect.id, {
        effect,
        tags: new Set(effect.tags),
        category: effect.category,
        properties: extractCssProperties(effect.cssCode),
      });
    }
    return map;
  }, []);

  /* ─── Debounce search input (200ms) ─── */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  /* ─── Compute scored results when seed changes ─── */
  const { results, stats } = useMemo<{ results: SimilarityResult[]; stats: SimilarityStats | null }>(() => {
    const seed = effectIndex.get(seedId) ?? effectIndex.get(effects[0]?.id ?? "");
    if (!seed) {
      return { results: [], stats: null };
    }

    const scored: SimilarityResult[] = [];
    for (const [id, feat] of effectIndex) {
      if (id === seed.effect.id) continue;

      const tagJaccard = jaccard(seed.tags, feat.tags);
      const categoryMatch = seed.category === feat.category ? 1 : 0;
      const propJaccard = jaccard(seed.properties, feat.properties);

      const score = Math.round(
        tagJaccard * WEIGHT_TAGS +
          categoryMatch * WEIGHT_CATEGORY +
          propJaccard * WEIGHT_PROPERTIES,
      );

      const sharedTags: string[] = [];
      for (const tag of seed.tags) {
        if (feat.tags.has(tag)) sharedTags.push(tag);
      }

      const sharedProperties: string[] = [];
      for (const prop of seed.properties) {
        if (feat.properties.has(prop)) sharedProperties.push(prop);
      }

      scored.push({ effect: feat.effect, score, sharedTags, sharedProperties });
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, TOP_N);
    const avg =
      top.length > 0
        ? Math.round(top.reduce((sum, r) => sum + r.score, 0) / top.length)
        : 0;
    const topMatch = top[0];

    return {
      results: top,
      stats: {
        analyzed: scored.length,
        topScore: topMatch?.score ?? 0,
        topName: topMatch?.effect.name ?? "—",
        avg,
      },
    };
  }, [seedId, effectIndex]);

  /* ─── Picker options (filtered by debounced search) ─── */
  const pickerOptions = useMemo<CSSEffect[]>(() => {
    const query = debouncedSearch.toLowerCase().trim();
    const list: CSSEffect[] = [];
    for (const effect of effects) {
      if (list.length >= PICKER_MAX_OPTIONS) break;
      if (!query) {
        list.push(effect);
        continue;
      }
      if (
        effect.name.toLowerCase().includes(query) ||
        effect.id.toLowerCase().includes(query) ||
        effect.category.toLowerCase().includes(query) ||
        effect.tags.some((tag) => tag.toLowerCase().includes(query))
      ) {
        list.push(effect);
      }
    }
    return list;
  }, [debouncedSearch]);

  /* ─── Clamp active idx so it always points at a valid option ─── */
  const safeActiveIdx =
    pickerOptions.length === 0
      ? 0
      : Math.min(activeIdx, pickerOptions.length - 1);

  /* ─── Close picker on outside click ─── */
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const pickEffect = useCallback((id: string) => {
    setSeedId(id);
    setSearch("");
    setPickerOpen(false);
  }, []);

  const handlePickerKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPickerOpen(true);
      setActiveIdx((idx) => {
        const current = pickerOptions.length === 0 ? 0 : Math.min(idx, pickerOptions.length - 1);
        return Math.min(current + 1, pickerOptions.length - 1);
      });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIdx((idx) => Math.max(idx - 1, 0));
    } else if (event.key === "Enter") {
      if (pickerOpen && pickerOptions[safeActiveIdx]) {
        event.preventDefault();
        pickEffect(pickerOptions[safeActiveIdx].id);
      }
    } else if (event.key === "Escape") {
      setPickerOpen(false);
    }
  };

  const handleCopy = useCallback(async (effect: CSSEffect) => {
    try {
      await navigator.clipboard.writeText(effect.cssCode);
      setCopiedId(effect.id);
      setTimeout(() => {
        setCopiedId((current) => (current === effect.id ? null : current));
      }, 1800);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }, []);

  /* ─── Derived seed info ─── */
  const seedFeatures = effectIndex.get(seedId);
  const seed = seedFeatures?.effect ?? effects[0];
  const seedMeta = seed ? categoryMeta[seed.category] : null;
  const seedLowSignal = seedFeatures
    ? seedFeatures.tags.size === 0 && seedFeatures.properties.size === 0
    : false;

  const activeOptionId =
    pickerOpen && pickerOptions[safeActiveIdx]
      ? `sim-opt-${pickerOptions[safeActiveIdx].id}`
      : undefined;

  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ScanSearch className="size-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-foreground leading-tight">
            Effect Similarity Finder
          </h3>
          <p className="text-xs text-muted-foreground">
            Pick an effect — instantly see the most similar ones by tag, category &amp; CSS property overlap.
          </p>
        </div>
      </div>

      {/* Picker (combobox) */}
      <div ref={containerRef} className="relative">
        <label htmlFor="similarity-picker" className="sr-only">
          Search and pick a seed effect
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            id="similarity-picker"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search effects by name, tag, category…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setActiveIdx(0);
              setPickerOpen(true);
            }}
            onFocus={() => setPickerOpen(true)}
            onKeyDown={handlePickerKeyDown}
            className="h-10 pl-9 pr-9"
            role="combobox"
            aria-expanded={pickerOpen}
            aria-controls="similarity-picker-listbox"
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              id="similarity-picker-listbox"
              role="listbox"
              aria-label="Similar effects"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-30 mt-1.5 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden"
            >
              <div className="max-h-72 overflow-y-auto scrollbar-thin p-1">
                {pickerOptions.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No effects match &ldquo;{search}&rdquo;.
                  </div>
                ) : (
                  pickerOptions.map((effect, idx) => {
                    const isActive = idx === safeActiveIdx;
                    const isSeed = effect.id === seedId;
                    const meta = categoryMeta[effect.category];
                    return (
                      <button
                        key={effect.id}
                        id={`sim-opt-${effect.id}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => pickEffect(effect.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                          isActive ? "bg-primary/10" : "hover:bg-muted/60"
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                          {effect.name}
                        </span>
                        {meta && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px] px-1.5 py-0 bg-muted/70 text-muted-foreground font-normal"
                          >
                            {meta.label}
                          </Badge>
                        )}
                        {isSeed && (
                          <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Seed display */}
      {seed && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
          <Sparkles className="size-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Seed:</span>
          <span className="font-medium text-sm text-foreground truncate max-w-full">
            {seed.name}
          </span>
          {seedMeta && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-primary/40 text-primary"
            >
              {seedMeta.label}
            </Badge>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground font-mono">
            {seed.id}
          </span>
        </div>
      )}

      {/* Low-signal note */}
      {seedLowSignal && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          <Sparkles className="size-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            This effect has no tags and no parseable CSS properties — similarity scores are approximate.
          </span>
        </div>
      )}

      {/* Stats footer */}
      {stats && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            Analyzed{" "}
            <strong className="text-foreground font-medium">{stats.analyzed}</strong>{" "}
            effects
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Top match:{" "}
            <strong className="text-foreground font-medium">{stats.topScore}%</strong>{" "}
            <span className="text-foreground/80">({stats.topName})</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Avg top-{TOP_N} similarity:{" "}
            <strong className="text-foreground font-medium">{stats.avg}%</strong>
          </span>
        </div>
      )}

      {/* Results */}
      <div className="mt-4 max-h-[480px] overflow-y-auto scrollbar-thin pr-1 -mr-1">
        {results.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No similar effects found.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {results.map((result, i) => {
              const tierClass = scoreTierClass(result.score);
              const meta = categoryMeta[result.effect.category];
              const isCopied = copiedId === result.effect.id;
              const rankBadgeClass =
                i === 0
                  ? "bg-emerald-500"
                  : i === 1
                    ? "bg-primary"
                    : "bg-muted-foreground";
              return (
                <div
                  key={result.effect.id}
                  onClick={() => pickEffect(result.effect.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      pickEffect(result.effect.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Rank ${i + 1}: ${result.effect.name}, ${result.score}% similar. Click to use as new seed.`}
                  className="group bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {/* Row 1: rank + name + copy */}
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${rankBadgeClass}`}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {result.effect.name}
                        </h4>
                        {meta && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px] px-1.5 py-0 bg-muted/70 text-muted-foreground font-normal"
                          >
                            {meta.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {scoreTierLabel(result.score)} · {result.score}% match
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCopy(result.effect);
                      }}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                      aria-label={isCopied ? "CSS copied" : "Copy CSS code"}
                    >
                      {isCopied ? (
                        <Check className="size-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Score bar */}
                  <div
                    className="mt-2.5 h-1.5 w-full rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-label={`${result.score}% similarity`}
                    aria-valuenow={result.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${tierClass}`}
                      style={{ width: `${Math.max(result.score, 2)}%` }}
                    />
                  </div>

                  {/* Tiny live preview */}
                  <div className="mt-2.5 h-20 w-full overflow-hidden rounded-md bg-muted/40 border border-border/50">
                    <LivePreview effect={result.effect} />
                  </div>

                  {/* Shared badges */}
                  {(result.sharedTags.length > 0 || result.sharedProperties.length > 0) && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {result.sharedTags.slice(0, 4).map((tag) => (
                        <Badge
                          key={`t-${tag}`}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/20 gap-0.5"
                        >
                          <Tag className="size-2.5" aria-hidden="true" />
                          {tag}
                        </Badge>
                      ))}
                      {result.sharedProperties.slice(0, 4).map((prop) => (
                        <Badge
                          key={`p-${prop}`}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 bg-muted/70 text-muted-foreground gap-0.5 font-mono"
                        >
                          <Code2 className="size-2.5" aria-hidden="true" />
                          {prop}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="mt-3 text-[11px] text-muted-foreground">
        Tip: click any result card to make it the new seed and re-run the similarity search.
      </p>
    </div>
  );
}
