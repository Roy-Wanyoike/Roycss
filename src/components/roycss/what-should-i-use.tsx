"use client";

import { useState, useMemo, useCallback, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import type { CSSEffect } from "@/lib/roycss-types";
import { categoryMeta } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface Recommendation {
  effect: CSSEffect;
  /** 0–100 match score */
  matchScore: number;
  /** Human-readable explanation, e.g. "Matches: hover, button" */
  reason: string;
}

interface WhatShouldIUseProps {
  effects: CSSEffect[];
  onSelectEffect: (effect: CSSEffect) => void;
}

/* ═══════════════════════════════════════════════════════════════
   INTENT → CATEGORY/TAG MAP
   Each developer keyword maps to a set of effect categories (and
   tag-like tokens) that share the same design intent.
   ═══════════════════════════════════════════════════════════════ */

const INTENT_MAP: Record<string, string[]> = {
  attention: ["buttons", "hover", "microinteractions"],
  cta: ["buttons", "hover"],
  premium: ["glass-ui", "visual", "microinteractions"],
  loading: ["loaders"],
  loader: ["loaders"],
  spinner: ["loaders"],
  error: ["status-state", "microinteractions"],
  fail: ["status-state"],
  success: ["status-state"],
  celebration: ["particles", "status-state"],
  celebrate: ["particles", "status-state"],
  hover: ["hover"],
  card: ["cards", "hover"],
  button: ["buttons"],
  text: ["text", "advanced-text"],
  background: ["backgrounds", "immersive"],
  navigation: ["navigation"],
  menu: ["navigation"],
  scroll: ["scroll"],
  cursor: ["cursor"],
  mobile: ["hover", "microinteractions"],
  hero: ["backgrounds", "text", "visual"],
  dashboard: ["data-viz", "status-state"],
  fintech: ["glass-ui", "data-viz"],
  minimal: ["hover", "microinteractions"],
  neon: ["visual", "borders"],
  glass: ["glass-ui"],
  "3d": ["3d-transforms"],
  animation: ["animations", "physics"],
  animated: ["animations"],
  liquid: ["liquid"],
  fluid: ["liquid"],
  morph: ["morphing"],
  morphing: ["morphing"],
  retro: ["retro"],
  vintage: ["retro"],
  audio: ["audio"],
  music: ["audio"],
  particles: ["particles"],
  gradient: ["backgrounds", "visual"],
  skeleton: ["status-state"],
  transition: ["page-transitions"],
  page: ["page-transitions"],
  form: ["forms"],
  input: ["forms"],
  border: ["borders"],
  filter: ["filters"],
  gauge: ["data-viz"],
  chart: ["data-viz"],
  data: ["data-viz"],
  viz: ["data-viz"],
};

/* ═══════════════════════════════════════════════════════════════
   QUICK-PICK PILLS
   Each pill pre-fills the query with a realistic phrase so the
   intent matcher has multiple keywords to work with.
   ═══════════════════════════════════════════════════════════════ */

const QUICK_PICKS: ReadonlyArray<{ label: string; query: string }> = [
  { label: "Draw attention", query: "draw attention to a CTA button" },
  { label: "Premium feel", query: "premium feel for a SaaS landing page" },
  { label: "Loading state", query: "loading animation that isn't boring" },
  { label: "Error feedback", query: "error feedback state for a form" },
  { label: "Celebration", query: "celebration animation for a milestone" },
  { label: "Subtle hover", query: "subtle hover effect for a card" },
  { label: "Hero section", query: "hero section background animation" },
  { label: "Mobile-friendly", query: "mobile-friendly microinteraction" },
];

/* ═══════════════════════════════════════════════════════════════
   SCORING WEIGHTS
   Sum > 100 so multiple matches can saturate the score, but the
   final value is clamped to 100.
   ═══════════════════════════════════════════════════════════════ */

const WEIGHT_NAME = 18;
const WEIGHT_DESCRIPTION = 8;
const WEIGHT_CATEGORY_DIRECT = 16;
const WEIGHT_TAG_DIRECT = 22;
const WEIGHT_INTENT_CATEGORY = 28;
const WEIGHT_INTENT_TAG = 14;

const MIN_KEYWORD_LENGTH = 3;
const GOOD_MATCH_THRESHOLD = 30;
const MAX_RESULTS = 6;
const REASON_TERM_LIMIT = 3;

/* ═══════════════════════════════════════════════════════════════
   RECOMMENDATION ENGINE — pure, no React
   ═══════════════════════════════════════════════════════════════ */

/**
 * Score every effect against the query and return the top `limit`.
 *
 * Scoring combines two signals per keyword:
 *  1. Direct text match in the effect's name / description / category / tags.
 *  2. Semantic intent match via {@link INTENT_MAP} — e.g. "loading" boosts
 *     effects in the `loaders` category even if the word never appears in
 *     the effect's text fields.
 */
function recommendEffects(
  query: string,
  effects: CSSEffect[],
  limit = MAX_RESULTS,
): Recommendation[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // Split on any non-alphanumeric run (keeps hyphens so "3d-transforms"
  // survives as one token) and drop tokens shorter than MIN_KEYWORD_LENGTH.
  const keywords = q
    .split(/[^a-z0-9-]+/i)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= MIN_KEYWORD_LENGTH);
  if (keywords.length === 0) return [];

  const results: Recommendation[] = [];

  for (const effect of effects) {
    const name = effect.name.toLowerCase();
    const description = effect.description.toLowerCase();
    const category = effect.category.toLowerCase();
    const tags = effect.tags.map((t) => t.toLowerCase());

    let score = 0;
    const matchedTerms = new Set<string>();

    for (const keyword of keywords) {
      // 1) Direct keyword matches in effect fields
      if (name.includes(keyword)) {
        score += WEIGHT_NAME;
        matchedTerms.add(keyword);
      }
      if (description.includes(keyword)) {
        score += WEIGHT_DESCRIPTION;
        matchedTerms.add(keyword);
      }
      if (category.includes(keyword) || keyword.includes(category)) {
        score += WEIGHT_CATEGORY_DIRECT;
        matchedTerms.add(effect.category);
      }
      for (const tag of tags) {
        if (tag.includes(keyword) || keyword.includes(tag)) {
          score += WEIGHT_TAG_DIRECT;
          matchedTerms.add(tag);
          break;
        }
      }

      // 2) Intent map boost — semantic match (e.g. "loading" → loaders)
      const intents = INTENT_MAP[keyword];
      if (intents) {
        if (intents.includes(effect.category)) {
          score += WEIGHT_INTENT_CATEGORY;
          matchedTerms.add(keyword);
        }
        for (const intentTag of intents) {
          if (tags.includes(intentTag)) {
            score += WEIGHT_INTENT_TAG;
            matchedTerms.add(intentTag);
          }
        }
      }
    }

    if (score <= 0) continue;

    const matchScore = Math.min(100, Math.round(score));
    const terms = Array.from(matchedTerms).slice(0, REASON_TERM_LIMIT);
    const reason =
      terms.length > 0
        ? `Matches: ${terms.join(", ")}`
        : "Topical relevance";

    results.push({ effect, matchScore, reason });
  }

  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    // Stable tiebreaker: effect name A → Z
    return a.effect.name.localeCompare(b.effect.name);
  });

  return results.slice(0, limit);
}

/* ═══════════════════════════════════════════════════════════════
   SCORE TIER HELPERS
   ═══════════════════════════════════════════════════════════════ */

function scoreTierColor(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-primary";
  if (score >= 30) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

function scoreTierBarClass(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-primary";
  if (score >= 30) return "bg-amber-500";
  return "bg-muted-foreground";
}

function scoreTierLabel(score: number): string {
  if (score >= 75) return "Great match";
  if (score >= 50) return "Strong match";
  if (score >= 30) return "Possible match";
  return "Weak match";
}

function rankBadgeClass(index: number): string {
  if (index === 0) return "bg-emerald-500";
  if (index === 1) return "bg-primary";
  return "bg-muted-foreground";
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function WhatShouldIUse({ effects, onSelectEffect }: WhatShouldIUseProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [refine, setRefine] = useState("");

  const runSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setResults(recommendEffects(trimmed, effects, MAX_RESULTS));
      setSubmittedQuery(trimmed);
      setRefine("");
    },
    [effects],
  );

  const handleSubmit = useCallback(() => {
    runSearch(query);
  }, [query, runSearch]);

  const handlePickPill = useCallback(
    (pillQuery: string) => {
      setQuery(pillQuery);
      runSearch(pillQuery);
    },
    [runSearch],
  );

  const handleQueryKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter submits — matches common editor conventions.
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runSearch(query);
    }
  };

  const filteredResults = useMemo<Recommendation[] | null>(() => {
    if (!results) return null;
    const r = refine.toLowerCase().trim();
    if (!r) return results;
    return results.filter((rec) => {
      return (
        rec.effect.name.toLowerCase().includes(r) ||
        rec.effect.category.toLowerCase().includes(r) ||
        rec.effect.tags.some((t) => t.toLowerCase().includes(r)) ||
        rec.effect.description.toLowerCase().includes(r)
      );
    });
  }, [results, refine]);

  const hasSearched = results !== null;
  const topScore =
    results && results.length > 0 ? results[0].matchScore : 0;
  const hasGoodMatches =
    hasSearched && topScore >= GOOD_MATCH_THRESHOLD && (results?.length ?? 0) > 0;

  const visibleCount = filteredResults?.length ?? 0;
  const totalCount = results?.length ?? 0;

  return (
    <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <CardTitle className="font-display text-base text-foreground sm:text-lg">
              What Should I Use?
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs sm:text-sm">
              Describe what you want to achieve. We&apos;ll recommend the best
              effects.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Query textarea + submit */}
        <div className="space-y-2">
          <label htmlFor="what-should-i-use-query" className="sr-only">
            Describe what you want to achieve
          </label>
          <Textarea
            id="what-should-i-use-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleQueryKeyDown}
            placeholder="e.g., 'I need a subtle hover effect for a premium SaaS landing page button'"
            className="min-h-[88px] resize-y text-sm"
            spellCheck={false}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              Press{" "}
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                ⌘/Ctrl + ↵
              </kbd>{" "}
              to run
            </p>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!query.trim()}
              className="gap-1.5"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Get Recommendations
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Quick-pick pills */}
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Quick picks
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PICKS.map((pick) => (
              <Button
                key={pick.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePickPill(pick.query)}
                className="rounded-full px-3 text-xs font-medium"
              >
                {pick.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results region */}
        <div className="pt-1">
          {!hasSearched ? (
            <EmptyState />
          ) : !hasGoodMatches ? (
            <NoMatchesState query={submittedQuery} />
          ) : (
            <div className="space-y-3">
              {/* Refine row */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <strong className="font-medium text-foreground">
                    {visibleCount}
                  </strong>{" "}
                  of{" "}
                  <strong className="font-medium text-foreground">
                    {totalCount}
                  </strong>{" "}
                  recommendations
                  {submittedQuery ? (
                    <>
                      {" "}
                      for{" "}
                      <span className="italic text-foreground/80">
                        &ldquo;{submittedQuery}&rdquo;
                      </span>
                    </>
                  ) : null}
                </p>
                <div className="relative sm:w-56">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="text"
                    value={refine}
                    onChange={(event) => setRefine(event.target.value)}
                    placeholder="Refine results…"
                    className="h-8 pl-8 text-xs"
                    aria-label="Refine recommendations"
                    spellCheck={false}
                  />
                </div>
              </div>

              {visibleCount > 0 ? (
                <motion.div
                  layout
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredResults?.map((rec, index) => (
                      <ResultCard
                        key={rec.effect.id}
                        recommendation={rec}
                        rank={index}
                        onSelect={() => onSelectEffect(rec.effect)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No recommendations match &ldquo;{refine}&rdquo;. Clear the
                  refine box to see all.
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESULT CARD
   ═══════════════════════════════════════════════════════════════ */

interface ResultCardProps {
  recommendation: Recommendation;
  rank: number;
  onSelect: () => void;
}

function ResultCard({ recommendation, rank, onSelect }: ResultCardProps) {
  const { effect, matchScore, reason } = recommendation;
  const meta = categoryMeta[effect.category];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, delay: Math.min(rank * 0.03, 0.18) }}
      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-primary/40 hover:shadow-md"
    >
      {/* Row 1: rank + name + category */}
      <div className="flex items-start gap-2.5">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${rankBadgeClass(rank)}`}
          aria-hidden="true"
        >
          {rank + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="truncate text-sm font-medium text-foreground">
              {effect.name}
            </h4>
            {meta && (
              <Badge
                variant="secondary"
                className="shrink-0 bg-muted/70 px-1.5 py-0 text-[10px] font-normal capitalize text-muted-foreground"
              >
                {meta.label}
              </Badge>
            )}
          </div>
          <p
            className={`mt-0.5 text-[11px] font-medium ${scoreTierColor(matchScore)}`}
          >
            {scoreTierLabel(matchScore)} · {matchScore}%
          </p>
        </div>
      </div>

      {/* Score bar */}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${matchScore}% match`}
        aria-valuenow={matchScore}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className={`h-full rounded-full ${scoreTierBarClass(matchScore)}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(matchScore, 2)}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Mini live preview */}
      <div className="h-20 w-full overflow-hidden rounded-md border border-border/50 bg-muted/40">
        <LivePreview effect={effect} />
      </div>

      {/* Reason */}
      <p className="text-[11px] italic leading-relaxed text-muted-foreground">
        {reason}
      </p>

      {/* Action */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onSelect}
        className="mt-auto w-full gap-1.5 text-xs"
      >
        View Effect
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Button>
    </motion.article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Lightbulb className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">
        Tell us what you&apos;re building
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Describe a goal like &ldquo;draw attention to a CTA&rdquo; or pick a
        quick-pick above. We&apos;ll surface the best-matching RoyCSS effects
        instantly.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NO-MATCHES STATE
   ═══════════════════════════════════════════════════════════════ */

function NoMatchesState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Search className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">
        No close matches found
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        We couldn&apos;t find strong matches for{" "}
        <span className="italic text-foreground/80">
          &ldquo;{query}&rdquo;
        </span>
        . Try broader terms like{" "}
        <span className="font-mono text-foreground/70">hover</span> or{" "}
        <span className="font-mono text-foreground/70">loading</span>.
      </p>
    </div>
  );
}
