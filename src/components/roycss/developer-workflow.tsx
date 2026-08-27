"use client";

/* ═══════════════════════════════════════════════════════════════
   DeveloperWorkflow — 7-step visual lifecycle
   ─────────────────────────────────────────────────────────────────
   Horizontal flow on desktop (lg:flex-row with ArrowRight between
   steps), vertical on mobile (flex-col with ArrowDown). Each step
   has a numbered circle (1-7) containing an icon. Uses ScrollReveal
   for entrance. NO indigo/blue.
   ═══════════════════════════════════════════════════════════════ */

import type { LucideIcon } from "lucide-react";
import {
  Search,
  Package,
  Code2,
  Palette,
  BarChart3,
  ShieldCheck,
  Rocket,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import {
  SectionHeading,
  ScrollReveal,
} from "@/components/roycss/motion-primitives";
import { cn } from "@/lib/utils";

interface Step {
  icon: LucideIcon;
  number: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: Search,
    number: 1,
    title: "Discover",
    description: "Browse 1,749 effects, docs, and tools",
  },
  {
    icon: Package,
    number: 2,
    title: "Install",
    description: "npm install roycss",
  },
  {
    icon: Code2,
    number: 3,
    title: "Build",
    description: "Components, patterns, templates",
  },
  {
    icon: Palette,
    number: 4,
    title: "Customize",
    description: "Tokens, themes, OKLCH colors",
  },
  {
    icon: BarChart3,
    number: 5,
    title: "Analyze",
    description: "Bundle profiler, performance metrics",
  },
  {
    icon: ShieldCheck,
    number: 6,
    title: "Test",
    description: "Accessibility, visual regression",
  },
  {
    icon: Rocket,
    number: 7,
    title: "Ship",
    description: "Deploy via CLI, CDN, edge",
  },
];

export function DeveloperWorkflow() {
  return (
    <section
      aria-label="Developer workflow — from idea to production"
      className="border-b border-border/40 bg-background/40"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Workflow"
          title="From Idea to Production"
          subtitle="A complete developer workflow — not just a CSS library."
        />

        <ScrollReveal delay={0.2}>
          <ol
            className="mt-12 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-2"
            role="list"
          >
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isLast = idx === STEPS.length - 1;
              return (
                <li
                  key={step.title}
                  className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-2 flex-1"
                >
                  <div
                    className={cn(
                      "group flex-1 rounded-xl border border-border/60 bg-card/60 p-5",
                      "transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* numbered circle */}
                      <div className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                        <span
                          className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                          aria-hidden="true"
                        >
                          {step.number}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base leading-tight">
                          {step.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <span className="sr-only">
                      Step {step.number}: {step.title}. {step.description}.
                    </span>
                  </div>

                  {/* connector arrow */}
                  {!isLast && (
                    <div
                      className="flex items-center justify-center text-muted-foreground/50 shrink-0"
                      aria-hidden="true"
                    >
                      <ArrowDown className="size-4 lg:hidden" strokeWidth={2} />
                      <ArrowRight className="size-4 hidden lg:block rotate-0" strokeWidth={2} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </ScrollReveal>
      </div>
    </section>
  );
}
