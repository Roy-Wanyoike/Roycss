"use client";

/* ═══════════════════════════════════════════════════════════════
   FeaturedEffects — curated "best of" showcase
   ─────────────────────────────────────────────────────────────────
   Showing every effect on first scroll is overwhelming. This
   section surfaces 10 hand-picked effects across 10 categories, with
   a prominent CTA linking to the full /effects gallery and an SSR
   "Browse by category" link row (issue #205).
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  SectionHeading,
  ScrollReveal,
} from "@/components/roycss/motion-primitives";
import { EffectCard } from "@/components/roycss/effect-card";
import {
  effects,
  categoryMeta,
  categoryOrder,
} from "@/lib/roycss-effects";
import { EFFECT_COUNT_FORMATTED } from "@/lib/site-stats";
import type { CSSEffect } from "@/lib/roycss-types";

/* ─── Hand-picked featured effect IDs ─────────────────────────────
   10 exceptional effects across 10 different categories, chosen to
   showcase the visual range of the library (glow, glass, neon, 3D,
   gradient, shimmer, ripple-style motion, particles, etc.).
   ─────────────────────────────────────────────────────────────────── */
const FEATURED_IDS = [
  "pulse-glow", // animations     — smooth pulsing emerald glow
  "hover-tilt-3d", // hover           — 3D tilt on cursor hover
  "text-gradient", // text            — animated gradient text fill
  "bg-aurora-waves-b18", // backgrounds     — aurora waves gradient
  "ferrum-loader-dna", // loaders         — DNA double-helix spinner
  "card-hover-rotate", // 3d-transforms   — 3D rotate card on hover
  "btn-neon", // buttons         — neon glow button
  "card-glassmorphism", // cards           — frosted glass card
  "border-neon-pulse", // borders         — neon pulse animated border
  "ferrum-particles-confetti-burst", // particles       — confetti burst
] as const;

const FEATURED_EFFECTS: CSSEffect[] = FEATURED_IDS.map((id) =>
  effects.find((e) => e.id === id)
).filter((e): e is CSSEffect => Boolean(e));

const TOTAL_EFFECTS = effects.length;

/* Per-category effect counts for the crawlable category link row
   (issue #205 — home must contribute internal-link equity to the
   category landing pages, not just the in-page dialog explorer). */
const CATEGORY_COUNTS = new Map<string, number>();
for (const effect of effects) {
  CATEGORY_COUNTS.set(
    effect.category,
    (CATEGORY_COUNTS.get(effect.category) ?? 0) + 1,
  );
}

/* ─── Per-card stagger delay (caps so the last card doesn't lag) ─── */
const staggerDelay = (i: number) => Math.min(i * 0.07, 0.5);

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function FeaturedEffects({
  onSelectEffect,
}: {
  onSelectEffect: (effect: CSSEffect) => void;
}) {
  return (
    <section
      id="featured-effects"
      aria-label="Featured effects"
      className="relative py-16 sm:py-20 lg:py-24 scroll-mt-20"
    >
      {/* Soft ambient background — emerald/teal glow, no indigo/blue */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-72 w-[36rem] max-w-[90vw] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-72 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Heading */}
        <SectionHeading
          eyebrow={`Curated · 10 of ${EFFECT_COUNT_FORMATTED}`}
          title="Featured Effects"
          subtitle={`A taste of what RoyCSS can do — 10 of our strongest effects, hand-picked from ${EFFECT_COUNT_FORMATTED}.`}
        />

        {/* Responsive grid: 1 / 2 / 3 / 4 columns */}
        <div
          aria-label="Featured effects grid"
          className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
        >
          {FEATURED_EFFECTS.map((effect, index) => (
            <ScrollReveal
              key={effect.id}
              delay={staggerDelay(index)}
              className="h-full"
            >
              {/* Issue #216 item 9: the crawlable SSR anchor (issue #205)
                  moved INSIDE EffectCard as the full-card trigger link —
                  the previous wrapper anchor containing the card's
                  role="button" + nested buttons was invalid
                  nested-interactive markup. Plain click still opens the
                  quick-view dialog; modifier/middle-clicks and crawlers
                  follow the real href. */}
              <EffectCard
                effect={effect}
                index={index}
                href={`/effects/${effect.id}`}
                onClick={onSelectEffect}
              />
            </ScrollReveal>
          ))}
        </div>

        {/* CTA — Explore the full gallery */}
        <ScrollReveal delay={0.15} className="mt-12 sm:mt-16">
          <div className="flex flex-col items-center text-center">
            <p className="text-sm text-muted-foreground mb-5 max-w-md">
              That&apos;s just{" "}
              <span className="font-semibold text-foreground">
                10 of {TOTAL_EFFECTS.toLocaleString()}
              </span>
              . Open the full library to filter by category, search by
              name, and find your perfect effect.
            </p>

            {/* Real <Link> — crawlable route to /effects (issue #205) */}
            <Link
              href="/effects"
              className="group inline-flex items-center justify-center h-12 px-7 text-base font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              <Sparkles className="size-4 mr-2 shrink-0" />
              <span>Explore all {TOTAL_EFFECTS.toLocaleString()} Effects</span>
              <motion.span
                className="inline-flex ml-2"
                initial={false}
                whileHover={{ x: 0 }}
              >
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </motion.span>
            </Link>
          </div>
        </ScrollReveal>

        {/* Browse by category — SSR link row to all 29 category landing
            pages (issue #205: home previously contributed zero internal
            links to the catalog). */}
        <nav
          aria-label="Browse effects by category"
          className="mt-12 sm:mt-14 border-t border-border/40 pt-8"
        >
          <h2 className="text-center font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Browse by category
          </h2>
          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            {categoryOrder.map((category) => {
              const count = CATEGORY_COUNTS.get(category) ?? 0;
              return (
                <li key={category}>
                  <Link
                    href={`/effects/category/${category}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs sm:text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    {categoryMeta[category].label}
                    <span className="text-[11px] tabular-nums text-muted-foreground/70">
                      {count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
}

export default FeaturedEffects;
