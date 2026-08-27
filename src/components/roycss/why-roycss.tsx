"use client";

/* ═══════════════════════════════════════════════════════════════
   WhyRoyCSS — concise value proposition section
   ─────────────────────────────────────────────────────────────────
   6 value props (CSS-First, Framework Agnostic, Modern Standards,
   Accessible, AI-Native, Production-Ready). framer-motion stagger.
   NO comparison with competitors. NO unsupported claims. NO
   indigo/blue.
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Zap,
  Boxes,
  Sparkles,
  Accessibility,
  Bot,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  SectionHeading,
  StaggerGroup,
  staggerItem,
} from "@/components/roycss/motion-primitives";

interface ValueProp {
  icon: LucideIcon;
  title: string;
  description: string;
}

const VALUE_PROPS: ValueProp[] = [
  {
    icon: Zap,
    title: "CSS-First",
    description: "Zero JavaScript runtime for effects. Pure CSS, GPU-accelerated.",
  },
  {
    icon: Boxes,
    title: "Framework Agnostic",
    description: "Works with React, Vue, Svelte, Angular, Astro, vanilla HTML.",
  },
  {
    icon: Sparkles,
    title: "Modern Standards",
    description: "OKLCH colors, container queries, @property, scroll-driven animations.",
  },
  {
    icon: Accessibility,
    title: "Accessible",
    description: "WCAG 2.2 AA, prefers-reduced-motion, keyboard navigation built-in.",
  },
  {
    icon: Bot,
    title: "AI-Native",
    description: "RoyAI, MCP Server, AI code review, design-to-code workflows.",
  },
  {
    icon: ShieldCheck,
    title: "Production-Ready",
    description: "MIT licensed, tree-shakeable, battle-tested across 1,749 effects.",
  },
];

export function WhyRoyCSS() {
  return (
    <section
      aria-label="Why RoyCSS — value propositions"
      className="border-b border-border/40 bg-card/20"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Why RoyCSS"
          title="Why RoyCSS?"
          subtitle="Built for the modern web — fast, accessible, AI-native."
        />

        <StaggerGroup className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
            <motion.div key={title} variants={staggerItem}>
              <Card className="group h-full gap-0 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/40">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-6" strokeWidth={1.75} />
                </div>

                <div className="mt-5 space-y-2">
                  <h3 className="font-semibold text-base sm:text-lg leading-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
