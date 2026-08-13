"use client";

/* ═══════════════════════════════════════════════════════════════
   WhatIsRoyCSS — platform overview section
   ─────────────────────────────────────────────────────────────────
   Sits between the hero and the effects grid. Answers:
     • What is RoyCSS?  (a platform, not just an effects library)
     • Who is it for?   (developers, designers, teams, enterprise)
     • What can you do? (discover → customize → copy → ship)
     • What's different? (CSS-first, component system, AI-native, dev platform)
   ═══════════════════════════════════════════════════════════════ */

import { Fragment, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Component,
  Bot,
  Wrench,
  Search,
  Sliders,
  Copy,
  Rocket,
  Code,
  Palette,
  Users,
  Building2,
  ArrowRight,
  ArrowDown,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  SectionHeading,
  ScrollReveal,
  StaggerGroup,
  staggerItem,
} from "@/components/roycss/motion-primitives";
import { cn } from "@/lib/utils";

/* ─── Accent palette ───────────────────────────────────────────────
   Deliberately AVOIDS indigo/blue. Uses emerald / amber / rose / teal
   so each pillar gets a distinct hue while staying inside the OKLCH
   token system (text-primary, bg-card, border-border remain the spine).
   ─────────────────────────────────────────────────────────────────── */

type Accent = "emerald" | "amber" | "rose" | "teal";

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
    hoverBorder: "hover:border-emerald-500/40",
    glow: "hover:shadow-emerald-500/10",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/40",
    glow: "hover:shadow-amber-500/10",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    hoverBorder: "hover:border-rose-500/40",
    glow: "hover:shadow-rose-500/10",
  },
  teal: {
    text: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    hoverBorder: "hover:border-teal-500/40",
    glow: "hover:shadow-teal-500/10",
  },
};

/* ─── Content config ─────────────────────────────────────────────── */

interface Pillar {
  icon: LucideIcon;
  title: string;
  description: string;
  stat: string;
  accent: Accent;
}

const PILLARS: Pillar[] = [
  {
    icon: Sparkles,
    title: "CSS-First",
    description:
      "1,749 production-ready effects, animations, and interactions. Copy-paste CSS, zero dependencies.",
    stat: "1,749 effects",
    accent: "emerald",
  },
  {
    icon: Component,
    title: "Component System",
    description:
      "60+ pro components — data grids, kanbans, schedulers, charts, forms. Built on shadcn/ui.",
    stat: "60+ components",
    accent: "amber",
  },
  {
    icon: Bot,
    title: "AI-Native",
    description:
      "RoyAI assistant, Roy Architect, Roy Pair, Roy Review. AI that understands your CSS.",
    stat: "4 AI agents",
    accent: "rose",
  },
  {
    icon: Wrench,
    title: "Developer Platform",
    description:
      "64 developer tools, CLI, MCP server, inspector, sandbox. Everything from scaffolding to deployment.",
    stat: "64 tools",
    accent: "teal",
  },
];

interface Step {
  icon: LucideIcon;
  index: string;
  title: string;
  description: string;
  accent: Accent;
}

const STEPS: Step[] = [
  {
    icon: Search,
    index: "01",
    title: "Discover",
    description: "Browse 1,749 effects + 62 products",
    accent: "emerald",
  },
  {
    icon: Sliders,
    index: "02",
    title: "Customize",
    description: "Live preview, color controls, real-time updates",
    accent: "amber",
  },
  {
    icon: Copy,
    index: "03",
    title: "Copy",
    description: "One-click CSS copy, framework-ready",
    accent: "rose",
  },
  {
    icon: Rocket,
    index: "04",
    title: "Ship",
    description: "Production-ready, accessible, performant",
    accent: "teal",
  },
];

interface Stat {
  value: number;
  label: string;
  suffix?: string;
  format?: boolean;
}

const STATS: Stat[] = [
  { value: 1569, label: "CSS Effects", format: true },
  { value: 62, label: "Platform Products" },
  { value: 64, label: "Developer Tools" },
  { value: 22000, label: "Lines of CSS", suffix: "+", format: true },
];

interface Audience {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: Accent;
}

const AUDIENCES: Audience[] = [
  {
    icon: Code,
    title: "Developers",
    description: "Copy-paste CSS, zero dependencies, framework-agnostic",
    accent: "emerald",
  },
  {
    icon: Palette,
    title: "Designers",
    description: "Design tokens, theme system, 10 OKLCH presets",
    accent: "rose",
  },
  {
    icon: Users,
    title: "Teams",
    description: "Collaboration, governance, compliance, audit center",
    accent: "amber",
  },
  {
    icon: Building2,
    title: "Enterprise",
    description: "Cloud, CDN, edge, fleet management, SLAs",
    accent: "teal",
  },
];

/* ─── Local formatted counter ──────────────────────────────────────
   Mirrors AnimatedCounter from motion-primitives but adds optional
   toLocaleString() formatting so "22,000+" and "1,749" render with
   thousands separators exactly as the brief specifies. Kept local so
   we don't widen the shared component's API for a single use-case.
   ─────────────────────────────────────────────────────────────────── */

function FormattedCounter({
  value,
  duration = 2,
  prefix = "",
  suffix = "",
  format = false,
  className = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  format?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    let rafId: number;
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(value * ease(progress));
      setDisplay(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [started, value, duration]);

  const text = format ? display.toLocaleString("en-US") : display.toString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/* ─── Scroll helper (self-contained, no external dep) ───────────── */

function scrollToSection(selector: string) {
  if (typeof document === "undefined") return;
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─── Pillar card ───────────────────────────────────────────────── */

function PillarCard({ pillar }: { pillar: Pillar }) {
  const a = ACCENT[pillar.accent];
  const Icon = pillar.icon;
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={cn(
          "group h-full p-6 gap-4 transition-all duration-300",
          a.hoverBorder,
          "hover:shadow-xl",
          a.glow,
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center size-12 rounded-xl border",
            a.bg,
            a.border,
          )}
        >
          <Icon className={cn("size-6", a.text)} />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-foreground">
            {pillar.title}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {pillar.description}
          </p>
        </div>
        <div>
          <Badge
            variant="outline"
            className={cn("font-mono text-xs font-semibold", a.text, a.border)}
          >
            {pillar.stat}
          </Badge>
        </div>
      </Card>
    </motion.div>
  );
}

/* ─── Step card (for the discover → ship flow) ──────────────────── */

function StepCard({ step }: { step: Step }) {
  const a = ACCENT[step.accent];
  const Icon = step.icon;
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex-1"
    >
      <Card
        className={cn(
          "group h-full p-5 sm:p-6 gap-3 transition-all duration-300",
          a.hoverBorder,
          "hover:shadow-xl",
          a.glow,
        )}
      >
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex items-center justify-center size-11 rounded-xl border",
              a.bg,
              a.border,
            )}
          >
            <Icon className={cn("size-5", a.text)} />
          </div>
          <span className="font-display font-mono text-2xl font-bold text-muted-foreground/30">
            {step.index}
          </span>
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-foreground">
            {step.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

/* ─── Arrow connector between steps (desktop only) ──────────────── */

function StepArrow() {
  return (
    <div className="hidden lg:flex items-center justify-center shrink-0">
      <ArrowRight className="size-5 text-muted-foreground/50" />
    </div>
  );
}

/* ─── Audience card ─────────────────────────────────────────────── */

function AudienceCard({ audience }: { audience: Audience }) {
  const a = ACCENT[audience.accent];
  const Icon = audience.icon;
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={cn(
          "group h-full p-5 gap-3 transition-all duration-300",
          a.hoverBorder,
          "hover:shadow-xl",
          a.glow,
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center size-10 rounded-lg border",
            a.bg,
            a.border,
          )}
        >
          <Icon className={cn("size-5", a.text)} />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-foreground">
            {audience.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {audience.description}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN SECTION
   ═══════════════════════════════════════════════════════════════ */

export function WhatIsRoyCSS() {
  return (
    <section
      id="what-is-roycss"
      aria-label="What is RoyCSS?"
      className="py-16 sm:py-20 scroll-mt-20 relative overflow-hidden"
    >
      {/* Subtle grid backdrop — matches PlatformEcosystem */}
      <div className="absolute inset-0 -z-10 bg-grid opacity-10" />

      <div className="container mx-auto px-4 sm:px-6">
        {/* ─── Section heading ─────────────────────────────────── */}
        <SectionHeading
          eyebrow="Not just effects — a platform"
          title="What is RoyCSS?"
          subtitle="RoyCSS is a modern, AI-native frontend engineering platform — CSS effects, components, patterns, design systems, developer tools, and AI assistance in one cohesive ecosystem."
        />

        {/* ─── Value pillars (4 cards) ─────────────────────────── */}
        <StaggerGroup className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {PILLARS.map((pillar) => (
            <PillarCard key={pillar.title} pillar={pillar} />
          ))}
        </StaggerGroup>

        {/* ─── DISCOVER → CUSTOMIZE → COPY → SHIP flow ─────────── */}
        <ScrollReveal className="mt-16 sm:mt-20">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <Badge
              variant="secondary"
              className="mb-3 font-medium"
            >
              The RoyCSS workflow
            </Badge>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              From idea to production in four steps
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              A frictionless path from discovery to deployment — no build
              config, no lock-in, no JavaScript required.
            </p>
          </div>

          {/*
            Layout: vertical stack on mobile, 2-col grid on tablet,
            horizontal flex row with arrows on desktop. Arrows are
            hidden below lg so the 2x2 grid stays clean.
          */}
          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:gap-6 lg:flex lg:flex-row lg:items-stretch">
            {STEPS.map((step, i) => (
              <Fragment key={step.title}>
                <StepCard step={step} />
                {i < STEPS.length - 1 && <StepArrow />}
              </Fragment>
            ))}
          </div>

          {/* Mobile/tablet downward cue — replaces the hidden arrows */}
          <div className="flex justify-center mt-4 sm:mt-6 lg:hidden">
            <ArrowDown className="size-4 text-muted-foreground/40" />
          </div>
        </ScrollReveal>

        {/* ─── Platform stats (4 numbers) ─────────────────────── */}
        <ScrollReveal className="mt-16 sm:mt-20">
          <div className="rounded-3xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="p-6 sm:p-8 text-center flex flex-col items-center justify-center"
                >
                  <FormattedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    format={stat.format}
                    className="font-display text-3xl sm:text-4xl font-bold text-primary tabular-nums"
                  />
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ─── Who is it for? (4 audience cards) ──────────────── */}
        <ScrollReveal className="mt-16 sm:mt-20">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <Badge variant="secondary" className="mb-3 font-medium">
              Built for everyone
            </Badge>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Who is it for?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Whether you ship a single landing page or manage a fleet of
              enterprise apps, RoyCSS meets you where you are.
            </p>
          </div>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {AUDIENCES.map((audience) => (
              <AudienceCard key={audience.title} audience={audience} />
            ))}
          </StaggerGroup>
        </ScrollReveal>

        {/* ─── Closing CTA ─────────────────────────────────────── */}
        <ScrollReveal className="mt-12 sm:mt-16">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => scrollToSection("#platform")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-11 px-6 w-full sm:w-auto"
            >
              Explore the platform
              <ArrowRight className="size-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("#effects")}
              className="h-11 px-6 w-full sm:w-auto"
            >
              Browse 1,749 effects
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("#platform")}
              className="h-11 px-6 w-full sm:w-auto border-primary/40 text-primary hover:bg-primary/10"
            >
              <Radio className="size-4 mr-1 animate-pulse" />
              Try Roy Live
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
