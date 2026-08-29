"use client";

/* ═══════════════════════════════════════════════════════════════
   ExploreHub — 8-card exploration grid
   ─────────────────────────────────────────────────────────────────
   Sits immediately after the hero / platform preview. Each card is
   a `<button>` that calls `onNavigate("#section")` to scroll to the
   relevant part of the RoyCSS ecosystem. Uses shadcn Card, lucide
   icons, framer-motion stagger, NO indigo/blue.
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Boxes,
  LayoutGrid,
  FolderTree,
  BookOpen,
  Box,
  Bot,
  Store,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  SectionHeading,
  StaggerGroup,
  staggerItem,
} from "@/components/roycss/motion-primitives";

interface ExploreCard {
  icon: LucideIcon;
  title: string;
  description: string;
  target: string;
}

const CARDS: ExploreCard[] = [
  {
    icon: Sparkles,
    title: "Effects",
    description: "1,749+ production-ready CSS effects",
    target: "#effects",
  },
  {
    icon: Boxes,
    title: "Components",
    description: "Production UI building blocks",
    target: "#platform",
  },
  {
    icon: LayoutGrid,
    title: "Patterns",
    description: "Reusable interface patterns",
    target: "#patterns",
  },
  {
    icon: FolderTree,
    title: "Collections",
    description: "Curated effect bundles",
    target: "#collections",
  },
  {
    icon: BookOpen,
    title: "Recipes",
    description: "Copy-ready implementations",
    target: "#recipes",
  },
  {
    icon: Box,
    title: "Platform",
    description: "Frontend engineering tools",
    target: "#platform",
  },
  {
    icon: Bot,
    title: "AI",
    description: "AI-powered development",
    target: "#platform",
  },
  {
    icon: Store,
    title: "Marketplace",
    description: "Templates, themes, extensions",
    target: "#platform",
  },
];

export function ExploreHub({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <section
      aria-label="Explore RoyCSS — main areas of the ecosystem"
      className="border-b border-border/40 bg-background/40"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Explore"
          title="Explore RoyCSS"
          subtitle="Everything you need to design, build, and ship modern interfaces."
        />

        <StaggerGroup
          className="mt-10 sm:mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {CARDS.map(({ icon: Icon, title, description, target }) => (
            <motion.div key={title} variants={staggerItem}>
              <Card className="group h-full gap-0 p-0 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/40">
                <button
                  type="button"
                  onClick={() => onNavigate(target)}
                  aria-label={`Explore ${title} — ${description}`}
                  className="block text-left w-full h-full p-4 sm:p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <Icon className="size-6" strokeWidth={1.75} />
                    </div>
                    <ArrowUpRight
                      className="size-4 text-muted-foreground/60 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:text-primary -translate-x-1 group-hover:translate-x-0"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-4 space-y-1">
                    <h3 className="font-semibold text-sm sm:text-base leading-tight">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>
                </button>
              </Card>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
