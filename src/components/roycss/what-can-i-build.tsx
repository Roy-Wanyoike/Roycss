"use client";

/* ═══════════════════════════════════════════════════════════════
   WhatCanIBuild — concrete outcomes developers can build
   ─────────────────────────────────────────────────────────────────
   6 use case cards mapping real-world apps to RoyCSS platform
   products. Each card has a colored icon circle (emerald/teal/amber/
   rose/violet/cyan — NO indigo/blue), a "Learn more →" link that
   scrolls to #platform. Uses framer-motion stagger.
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Wallet,
  Bot,
  Settings,
  ShoppingCart,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  SectionHeading,
  StaggerGroup,
  staggerItem,
} from "@/components/roycss/motion-primitives";
import { cn } from "@/lib/utils";

type Accent = "emerald" | "teal" | "amber" | "rose" | "violet" | "cyan";

interface AccentClasses {
  /** icon circle background + foreground */
  iconWrap: string;
  /** soft border tint on hover */
  hoverBorder: string;
  /** accent for the "Learn more" arrow */
  accentText: string;
}

const ACCENT: Record<Accent, AccentClasses> = {
  emerald: {
    iconWrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-500/40",
    accentText: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  },
  teal: {
    iconWrap: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
    hoverBorder: "hover:border-teal-500/40",
    accentText: "group-hover:text-teal-600 dark:group-hover:text-teal-400",
  },
  amber: {
    iconWrap: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    hoverBorder: "hover:border-amber-500/40",
    accentText: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
  },
  rose: {
    iconWrap: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    hoverBorder: "hover:border-rose-500/40",
    accentText: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
  },
  violet: {
    iconWrap: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    hoverBorder: "hover:border-violet-500/40",
    accentText: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
  },
  cyan: {
    iconWrap: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    hoverBorder: "hover:border-cyan-500/40",
    accentText: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
  },
};

interface UseCase {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: Accent;
}

const USE_CASES: UseCase[] = [
  {
    icon: Activity,
    title: "Healthcare Dashboard",
    description: "Patient dashboards, appointment UI, medical timelines",
    accent: "emerald",
  },
  {
    icon: Wallet,
    title: "Fintech App",
    description: "Transactions, wallets, payment flows, KYC",
    accent: "teal",
  },
  {
    icon: Bot,
    title: "AI SaaS",
    description: "Chat interfaces, streaming, model selectors, agent status",
    accent: "violet",
  },
  {
    icon: Settings,
    title: "Admin Portal",
    description: "Data grids, CRUD forms, RBAC, audit logs",
    accent: "amber",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce",
    description: "Product cards, cart, checkout, pricing",
    accent: "rose",
  },
  {
    icon: Rocket,
    title: "Landing Page",
    description: "Hero sections, feature grids, pricing tables, CTAs",
    accent: "cyan",
  },
];

export function WhatCanIBuild({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <section
      aria-label="What can I build — real-world use cases for RoyCSS"
      className="border-b border-border/40 bg-card/20"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Use Cases"
          title="What Can I Build?"
          subtitle="From dashboards to landing pages — RoyCSS scales with your project."
        />

        <StaggerGroup className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {USE_CASES.map(({ icon: Icon, title, description, accent }) => {
            const a = ACCENT[accent];
            return (
              <motion.div key={title} variants={staggerItem}>
                <Card
                  className={cn(
                    "group h-full gap-0 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
                    a.hoverBorder
                  )}
                >
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                      a.iconWrap
                    )}
                  >
                    <Icon className="size-6" strokeWidth={1.75} />
                  </div>

                  <div className="mt-5 space-y-2">
                    <h3 className="font-semibold text-lg leading-tight">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate("#platform")}
                    className={cn(
                      "mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors",
                      a.accentText
                    )}
                    aria-label={`Learn more about building ${title} with RoyCSS`}
                  >
                    Learn more
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                  </button>
                </Card>
              </motion.div>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
