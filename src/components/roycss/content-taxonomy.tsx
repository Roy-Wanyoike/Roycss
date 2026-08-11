"use client";

/* ═══════════════════════════════════════════════════════════════
   ContentTaxonomy — homepage explainer section
   ─────────────────────────────────────────────────────────────────
   Sits near the top of the homepage and answers a frequent newcomer
   question: "What's the difference between a Component, an Effect, a
   Pattern, a Collection, a Template, and a Recipe?"

   Six cards in a responsive grid (1 → 2 → 3 cols). Each card has:
     • icon, title, description
     • "Explore →" link that smooth-scrolls to the relevant section.

   Design language:
     • shadcn Card (with consistent p-6 + gap-4)
     • lucide icons (Boxes / Sparkles / LayoutGrid / FolderTree /
       FileCode / BookOpen)
     • framer-motion stagger via StaggerGroup + staggerItem
     • Accent palette AVOIDS indigo/blue (uses emerald / amber /
       rose / teal / violet-warm / cyan — all within OKLCH token spine)
   ═══════════════════════════════════════════════════════════════ */

import { useCallback } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Sparkles,
  LayoutGrid,
  FolderTree,
  FileCode,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  SectionHeading,
  StaggerGroup,
  staggerItem,
} from "@/components/roycss/motion-primitives";
import { cn } from "@/lib/utils";

/* ─── Accent palette ───────────────────────────────────────────────
   Deliberately AVOIDS indigo/blue. Each accent exposes a text/bg/
   border/hover tuple consumed by the icon chip + card hover state.
   ─────────────────────────────────────────────────────────────────── */

type Accent = "emerald" | "amber" | "rose" | "teal" | "violet" | "cyan";

interface AccentClasses {
  text: string;
  bg: string;
  border: string;
  hoverBorder: string;
  glow: string;
}

const ACCENT: Record<Accent, AccentClasses> = {
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    hoverBorder: "group-hover:border-emerald-500/40",
    glow: "group-hover:shadow-emerald-500/10",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    hoverBorder: "group-hover:border-amber-500/40",
    glow: "group-hover:shadow-amber-500/10",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    hoverBorder: "group-hover:border-rose-500/40",
    glow: "group-hover:shadow-rose-500/10",
  },
  teal: {
    text: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    hoverBorder: "group-hover:border-teal-500/40",
    glow: "group-hover:shadow-teal-500/10",
  },
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    hoverBorder: "group-hover:border-violet-500/40",
    glow: "group-hover:shadow-violet-500/10",
  },
  cyan: {
    text: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    hoverBorder: "group-hover:border-cyan-500/40",
    glow: "group-hover:shadow-cyan-500/10",
  },
};

/* ─── Taxonomy entries ─────────────────────────────────────────── */

interface TaxonomyEntry {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: Accent;
  /** CSS selector for the section to scroll to. */
  href: string;
}

const TAXONOMY: TaxonomyEntry[] = [
  {
    title: "Component",
    description:
      "Reusable UI building blocks — buttons, cards, inputs, modals.",
    icon: Boxes,
    accent: "emerald",
    href: "#effects",
  },
  {
    title: "Effect",
    description:
      "Visual interactions and animations — hover states, transitions, motion.",
    icon: Sparkles,
    accent: "amber",
    href: "#effects",
  },
  {
    title: "Pattern",
    description:
      "Complete UI/UX solutions — auth flows, dashboards, settings panels.",
    icon: LayoutGrid,
    accent: "rose",
    href: "#patterns",
  },
  {
    title: "Collection",
    description:
      "Curated groups of related effects by theme or use case.",
    icon: FolderTree,
    accent: "teal",
    href: "#collections",
  },
  {
    title: "Template",
    description:
      "Full-page starting points — landing pages, admin layouts, marketing sites.",
    icon: FileCode,
    accent: "violet",
    href: "#platform",
  },
  {
    title: "Recipe",
    description:
      "Step-by-step implementation guidance with copy-ready code.",
    icon: BookOpen,
    accent: "cyan",
    href: "#recipes",
  },
];

/* ─── Smooth-scroll helper ─────────────────────────────────────── */

function scrollToSection(selector: string) {
  if (typeof window === "undefined") return;
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─── Card ─────────────────────────────────────────────────────── */

function TaxonomyCard({ entry }: { entry: TaxonomyEntry }) {
  const { icon: Icon, title, description, accent, href } = entry;
  const a = ACCENT[accent];

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      scrollToSection(href);
    },
    [href],
  );

  return (
    <motion.div variants={staggerItem} className="h-full">
      <Card
        className={cn(
          "group relative h-full gap-4 p-6 transition-all duration-300",
          "border-border hover:shadow-lg hover:-translate-y-1",
          a.hoverBorder,
          a.glow,
        )}
      >
        {/* Icon chip */}
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-xl border",
            a.bg,
            a.border,
            a.text,
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </div>

        {/* Title + description */}
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Explore link */}
        <a
          href={href}
          onClick={handleClick}
          className={cn(
            "mt-auto inline-flex items-center gap-1.5 text-sm font-medium",
            "transition-colors hover:gap-2.5",
            a.text,
          )}
          aria-label={`Explore ${title.toLowerCase()} section`}
        >
          Explore
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </Card>
    </motion.div>
  );
}

/* ─── Section ──────────────────────────────────────────────────── */

export function ContentTaxonomy() {
  return (
    <section
      id="content-taxonomy"
      aria-label="Understanding RoyCSS content taxonomy"
      className="py-16 sm:py-20 scroll-mt-20 relative overflow-hidden"
    >
      {/* Subtle grid backdrop — matches WhatIsRoyCSS */}
      <div className="absolute inset-0 -z-10 bg-grid opacity-10" />

      <div className="container mx-auto px-4 sm:px-6">
        {/* ─── Section heading ─────────────────────────────────── */}
        <SectionHeading
          eyebrow="Six types of assets, one cohesive platform"
          title="Understanding RoyCSS"
          subtitle="Six types of assets, one cohesive platform."
        />

        {/* ─── 6-card grid ───────────────────────────────────────
            Responsive: 1 col mobile → 2 col sm → 3 col lg.
            ─────────────────────────────────────────────────────── */}
        <StaggerGroup className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {TAXONOMY.map((entry) => (
            <TaxonomyCard key={entry.title} entry={entry} />
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

export default ContentTaxonomy;
