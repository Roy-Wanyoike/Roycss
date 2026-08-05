"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, TrendingUp, Clock, Users, ArrowRight } from "lucide-react";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollReveal } from "@/components/roycss/motion-primitives";

/* ═══════════════════════════════════════════════════════════════
   EffectShowcaseGrid
   ───────────────────────────────────────────────────────────────
   A masonry-style showcase that surfaces curated effect combos:
     • "Effect of the Week" — a single hero card pinned on top
     • Three tabs: Trending · New · Community Picks
   Each card renders a live preview (reusing the same LivePreview used
   across the RoyCSS grid), plus the effect name, author, and a star
   count. Fully self-contained — mock data only, no API required.
   ═══════════════════════════════════════════════════════════════ */

/** Resolve an effect by id, defensively (returns undefined if missing). */
function useEffectMap(): Map<string, CSSEffect> {
  return useMemo(() => {
    const map = new Map<string, CSSEffect>();
    for (const e of effects) map.set(e.id, e);
    return map;
  }, []);
}

type ShowcaseCategory = "trending" | "new" | "community";

interface ShowcaseEntry {
  effectId: string;
  author: string;
  stars: number;
  /** Optional category accent — drives the subtle card border tint. */
  accent: "emerald" | "amber" | "rose" | "violet" | "cyan" | "teal";
  /** Optional "freshness" or highlight flag. */
  flag?: string;
}

/* ─── Mock curated data (effect IDs reference real effects) ─── */
const EFFECT_OF_THE_WEEK: ShowcaseEntry = {
  effectId: "text-aurora-gradient-b18",
  author: "@aurora.labs",
  stars: 2847,
  accent: "violet",
  flag: "Effect of the Week",
};

const TRENDING: ShowcaseEntry[] = [
  { effectId: "pulse-glow", author: "@roy.wanyoike", stars: 1942, accent: "emerald" },
  { effectId: "hover-lift-glow-b18", author: "@glassworks", stars: 1731, accent: "cyan" },
  { effectId: "card-glassmorphism", author: "@neon.studio", stars: 1688, accent: "teal" },
  { effectId: "btn-gradient-glow-b18", author: "@ux.aria", stars: 1502, accent: "rose" },
  { effectId: "anim-breathing-orb-b18", author: "@zen.ui", stars: 1420, accent: "amber" },
  { effectId: "text-aurora-gradient-b18", author: "@aurora.labs", stars: 1284, accent: "violet" },
];

const NEW_ENTRIES: ShowcaseEntry[] = [
  { effectId: "glass-nav-bar-b18", author: "@frame.kit", stars: 312, accent: "cyan", flag: "New" },
  { effectId: "vis-frosted-glass-v2-b18", author: "@frost.ui", stars: 268, accent: "teal", flag: "New" },
  { effectId: "micro-fade-up", author: "@motion.co", stars: 241, accent: "emerald", flag: "New" },
  { effectId: "loader-ring-spin", author: "@spinner.io", stars: 198, accent: "amber", flag: "New" },
  { effectId: "btn-shine-sweep", author: "@cta.lab", stars: 176, accent: "rose", flag: "New" },
  { effectId: "anim-pulse-ring-expand-b18", author: "@ping.dev", stars: 154, accent: "violet", flag: "New" },
];

const COMMUNITY: ShowcaseEntry[] = [
  { effectId: "text-gradient", author: "@maker.jane", stars: 982, accent: "rose" },
  { effectId: "hover-glow-border", author: "@border.fan", stars: 874, accent: "emerald" },
  { effectId: "glass-badge-pill-b18", author: "@pill.design", stars: 812, accent: "cyan" },
  { effectId: "card-glass-hover", author: "@hover.craft", stars: 765, accent: "teal" },
  { effectId: "hover-underline-slide", author: "@link.studio", stars: 698, accent: "amber" },
  { effectId: "micro-bell-shake-b18", author: "@notify.io", stars: 621, accent: "violet" },
];

const TAB_CONTENT: Record<ShowcaseCategory, ShowcaseEntry[]> = {
  trending: TRENDING,
  new: NEW_ENTRIES,
  community: COMMUNITY,
};

const ACCENT_CLASSES: Record<ShowcaseEntry["accent"], { text: string; border: string; bg: string; dot: string }> = {
  emerald: { text: "text-emerald-500", border: "hover:border-emerald-500/40", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  amber: { text: "text-amber-500", border: "hover:border-amber-500/40", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  rose: { text: "text-rose-500", border: "hover:border-rose-500/40", bg: "bg-rose-500/10", dot: "bg-rose-500" },
  violet: { text: "text-violet-500", border: "hover:border-violet-500/40", bg: "bg-violet-500/10", dot: "bg-violet-500" },
  cyan: { text: "text-cyan-500", border: "hover:border-cyan-500/40", bg: "bg-cyan-500/10", dot: "bg-cyan-500" },
  teal: { text: "text-teal-500", border: "hover:border-teal-500/40", bg: "bg-teal-500/10", dot: "bg-teal-500" },
};

const TAB_META: Record<ShowcaseCategory, { label: string; icon: typeof TrendingUp; description: string }> = {
  trending: {
    label: "Trending",
    icon: TrendingUp,
    description: "Most copied effects this week, ranked by community stars.",
  },
  new: {
    label: "New",
    icon: Clock,
    description: "Freshly added effects — be the first to ship them.",
  },
  community: {
    label: "Community",
    icon: Users,
    description: "Picks curated by RoyCSS contributors and power users.",
  },
};

/* ─── Format helper: 1234 → "1.2k" ─── */
function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ═══════════════════════════════════════════════════════════════
   Featured "Effect of the Week" card (full-width hero)
   ═══════════════════════════════════════════════════════════════ */
function FeaturedCard({ entry, effect }: { entry: ShowcaseEntry; effect: CSSEffect }) {
  const accent = ACCENT_CLASSES[entry.accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card ${accent.border} transition-all hover:shadow-xl hover:shadow-primary/10`}
    >
      {/* Aura */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[1.1fr_1fr] md:items-center">
        {/* Live preview */}
        <div className="flex h-44 items-center justify-center rounded-xl border border-border/60 bg-muted/40 overflow-hidden">
          <div className="scale-90 origin-center">
            <LivePreview effect={effect} />
          </div>
        </div>

        {/* Meta */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="gap-1 bg-primary/10 text-primary">
              <Sparkles className="size-2.5" />
              {entry.flag ?? "Featured"}
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {effect.category}
            </Badge>
          </div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {effect.name}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {effect.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-mono text-primary">{`.roycss-${effect.id}`}</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              by <span className="font-medium text-foreground/80">{entry.author}</span>
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="size-3 fill-amber-500" />
              <span className="font-semibold">{formatStars(entry.stars)}</span>
            </span>
          </div>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            View effect
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Masonry card
   ═══════════════════════════════════════════════════════════════ */
function ShowcaseCard({ entry, effect }: { entry: ShowcaseEntry; effect: CSSEffect }) {
  const accent = ACCENT_CLASSES[entry.accent];
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`group mb-4 break-inside-avoid rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${accent.border}`}
    >
      {/* Preview */}
      <div className="mb-3 flex h-28 items-center justify-center rounded-lg border border-border/50 bg-muted/40 overflow-hidden">
        <div className="scale-[0.7] origin-center">
          <LivePreview effect={effect} />
        </div>
      </div>

      {/* Meta row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <code className="truncate font-mono text-[11px] text-primary">{`.roycss-${effect.id}`}</code>
        {entry.flag && (
          <Badge variant="secondary" className={`shrink-0 text-[10px] ${accent.bg} ${accent.text}`}>
            {entry.flag}
          </Badge>
        )}
      </div>

      <h4 className="truncate font-display text-sm font-semibold text-foreground">
        {effect.name}
      </h4>
      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
        {effect.description}
      </p>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px]">
        <span className="text-muted-foreground">{entry.author}</span>
        <span className="flex items-center gap-1 text-amber-500">
          <Star className="size-3 fill-amber-500" />
          <span className="font-semibold">{formatStars(entry.stars)}</span>
        </span>
      </div>
    </motion.article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main section
   ═══════════════════════════════════════════════════════════════ */
export function EffectShowcaseGrid() {
  const effectMap = useEffectMap();
  const [tab, setTab] = useState<ShowcaseCategory>("trending");

  const featuredEffect = effectMap.get(EFFECT_OF_THE_WEEK.effectId);
  const entries = TAB_CONTENT[tab];

  // Resolve entries to (entry, effect) pairs, dropping any whose effect is missing.
  const resolved = useMemo(() => {
    const out: { entry: ShowcaseEntry; effect: CSSEffect }[] = [];
    for (const entry of entries) {
      const effect = effectMap.get(entry.effectId);
      if (effect) out.push({ entry, effect });
    }
    return out;
  }, [entries, effectMap]);

  const activeMeta = TAB_META[tab];
  const ActiveIcon = activeMeta.icon;

  return (
    <section
      aria-label="Effect showcase"
      className="py-12 sm:py-16"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Heading */}
        <ScrollReveal>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Showcase
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Curated effects, hand-picked weekly
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              A rotating gallery of the most-loved RoyCSS effects — trending, fresh, and
              community-curated. Every card is a live preview.
            </p>
          </div>
        </ScrollReveal>

        {/* Effect of the Week */}
        {featuredEffect && (
          <ScrollReveal delay={0.1}>
            <FeaturedCard entry={EFFECT_OF_THE_WEEK} effect={featuredEffect} />
          </ScrollReveal>
        )}

        {/* Tabs + masonry */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as ShowcaseCategory)} className="mt-10">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <TabsList className="bg-muted/60">
              {(Object.keys(TAB_CONTENT) as ShowcaseCategory[]).map((key) => {
                const meta = TAB_META[key];
                const Icon = meta.icon;
                return (
                  <TabsTrigger key={key} value={key} className="gap-1.5">
                    <Icon className="size-3.5" />
                    {meta.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <p className="text-center text-xs text-muted-foreground sm:text-right">
              <ActiveIcon className="mr-1 inline size-3 align-text-bottom" />
              {activeMeta.description}
            </p>
          </div>

          {(Object.keys(TAB_CONTENT) as ShowcaseCategory[]).map((key) => (
            <TabsContent key={key} value={key}>
              {key === tab && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    className="mt-6 gap-4 [column-gap:1rem] sm:columns-2 lg:columns-3"
                  >
                    {resolved.map(({ entry, effect }) => (
                      <ShowcaseCard key={`${tab}-${entry.effectId}-${entry.author}`} entry={entry} effect={effect} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
