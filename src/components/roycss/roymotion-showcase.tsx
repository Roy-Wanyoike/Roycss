"use client";

import { useState, useEffect, type ReactNode } from "react";
import {
  Sparkles,
  Heart,
  Check,
  AlertCircle,
  Bell,
  Accessibility,
} from "lucide-react";
import { ScrollReveal } from "@/components/roycss/motion-primitives";

/* ─── Section wrapper ──────────────────────────────────────── */
function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 sm:p-6">
      <div className="mb-4">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest">
          <Sparkles className="size-3" />
          {eyebrow}
        </p>
        <h3 className="mt-2 font-display text-lg font-semibold text-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/* ─── Demo tile (animated + replayable) ────────────────────── */
function DemoTile({
  label,
  className,
  onPlay,
  children,
}: {
  label: string;
  className?: string;
  onPlay?: () => void;
  children?: ReactNode;
}) {
  const [playKey, setPlayKey] = useState(0);

  const handleClick = () => {
    setPlayKey((k) => k + 1);
    if (onPlay) onPlay();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
      title={`Replay ${label}`}
    >
      <div className="flex items-center justify-center size-16 rounded-xl bg-background/60 border border-border/40 overflow-hidden">
        {/* key change forces the animation to restart */}
        <span
          key={playKey}
          className={`flex items-center justify-center size-full ${className ?? ""}`}
        >
          {children}
        </span>
      </div>
      <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </button>
  );
}

/* ─── Hover demo tile ──────────────────────────────────────── */
function HoverTile({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/40">
      <div className="flex items-center justify-center size-16 rounded-xl bg-background/60 border border-border/40 overflow-hidden">
        <div className={`size-10 rounded-lg bg-primary/80 ${className}`} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

/* ─── Reduced motion badge ─────────────────────────────────── */
function ReducedMotionBadge() {
  // Read the initial media-query value lazily to avoid setState-in-effect
  // cascading renders (and to stay SSR-safe).
  const [enabled, setEnabled] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        enabled
          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
          : "bg-muted text-muted-foreground border-border/60"
      }`}
    >
      <Accessibility className="size-3.5" />
      {enabled
        ? "prefers-reduced-motion: reduce is ON"
        : "prefers-reduced-motion: reduce is OFF"}
    </div>
  );
}

/* ─── Spring easing token chip ─────────────────────────────── */
function TokenChip({ name, value }: { name: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`--${name}: ${value};`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted border border-border/40 text-left transition-colors cursor-pointer"
      title="Click to copy"
    >
      <code className="text-[10px] font-mono text-primary">--{name}</code>
      <code className="text-[10px] font-mono text-muted-foreground truncate">
        {value}
      </code>
      {copied && <Check className="size-3 text-emerald-500" />}
    </button>
  );
}

/* ─── Main showcase ────────────────────────────────────────── */
export function RoyMotionShowcase() {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid opacity-15 roycss-fade-mask-b" />
      <div className="container mx-auto px-4 sm:px-6">
        {/* Heading */}
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-4">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Spring physics · OKLCH · scroll-driven
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              RoyMotion
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              A tiny, modern CSS animation system built into RoyCSS. Spring
              easing tokens, entrance & exit animations, hover effects,
              loaders, skeletons, and microinteractions — all in one stylesheet,
              all respecting reduced-motion preferences.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="flex justify-center mb-8">
            <ReducedMotionBadge />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Entrance animations */}
          <Section eyebrow="Entrance" title="Entrance Animations (10)">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <DemoTile label="roy-in-fade" className="roy-in-fade">
                <span className="text-xs font-semibold text-foreground">Fade</span>
              </DemoTile>
              <DemoTile label="roy-in-fade-up" className="roy-in-fade-up">
                <span className="text-xs font-semibold text-foreground">Up</span>
              </DemoTile>
              <DemoTile label="roy-in-fade-down" className="roy-in-fade-down">
                <span className="text-xs font-semibold text-foreground">Down</span>
              </DemoTile>
              <DemoTile label="roy-in-fade-left" className="roy-in-fade-left">
                <span className="text-xs font-semibold text-foreground">Left</span>
              </DemoTile>
              <DemoTile label="roy-in-fade-right" className="roy-in-fade-right">
                <span className="text-xs font-semibold text-foreground">Right</span>
              </DemoTile>
              <DemoTile label="roy-in-scale" className="roy-in-scale">
                <span className="text-xs font-semibold text-foreground">Scale</span>
              </DemoTile>
              <DemoTile label="roy-in-pop" className="roy-in-pop">
                <span className="text-xs font-semibold text-foreground">Pop</span>
              </DemoTile>
              <DemoTile label="roy-in-spring-up" className="roy-in-spring-up">
                <span className="text-xs font-semibold text-foreground">Spring</span>
              </DemoTile>
              <DemoTile label="roy-in-blur" className="roy-in-blur">
                <span className="text-xs font-semibold text-foreground">Blur</span>
              </DemoTile>
              <DemoTile label="roy-in-bounce" className="roy-in-bounce">
                <span className="text-xs font-semibold text-foreground">Bounce</span>
              </DemoTile>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Click any tile to replay the animation.
            </p>
          </Section>

          {/* Hover effects */}
          <Section eyebrow="Hover" title="Hover Effects (10)">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <HoverTile label="roy-hover-lift" className="roy-hover-lift" />
              <HoverTile label="roy-hover-scale" className="roy-hover-scale" />
              <HoverTile label="roy-hover-press" className="roy-hover-press" />
              <HoverTile label="roy-hover-glow" className="roy-hover-glow" />
              <HoverTile label="roy-hover-shake" className="roy-hover-shake" />
              <HoverTile label="roy-hover-pulse" className="roy-hover-pulse" />
              <HoverTile label="roy-hover-bounce" className="roy-hover-bounce" />
              <HoverTile label="roy-hover-tilt" className="roy-hover-tilt" />
              <HoverTile label="roy-hover-underline" className="roy-hover-underline" />
              <HoverTile label="roy-hover-overlay" className="roy-hover-overlay" />
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Hover the colored swatches to see each effect.
            </p>
          </Section>

          {/* Loading animations */}
          <Section eyebrow="Loaders" title="Loading Animations (5)">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DemoTile label="roy-load-spinner">
                <div className="roy-load-spinner" />
              </DemoTile>
              <DemoTile label="roy-load-dots">
                <div className="roy-load-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </DemoTile>
              <DemoTile label="roy-load-pulse">
                <div className="roy-load-pulse" />
              </DemoTile>
              <DemoTile label="roy-load-bar">
                <div className="roy-load-bar" />
              </DemoTile>
              <DemoTile label="roy-load-orbit">
                <div className="roy-load-orbit">
                  <span />
                  <span />
                </div>
              </DemoTile>
            </div>
          </Section>

          {/* Skeleton loaders */}
          <Section eyebrow="Skeletons" title="Skeleton Loaders">
            <div className="space-y-3">
              <div className="roy-skel-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="roy-skel-circle" />
                  <div className="flex-1">
                    <div className="roy-skel-text" />
                    <div className="roy-skel-text" />
                  </div>
                </div>
                <div className="roy-skel-rect" />
                <div className="roy-skel-text mt-3" />
              </div>
              <div className="flex flex-wrap gap-2">
                <code className="text-[10px] font-mono text-muted-foreground px-2 py-1 rounded bg-muted/40">
                  .roy-skel-text
                </code>
                <code className="text-[10px] font-mono text-muted-foreground px-2 py-1 rounded bg-muted/40">
                  .roy-skel-circle
                </code>
                <code className="text-[10px] font-mono text-muted-foreground px-2 py-1 rounded bg-muted/40">
                  .roy-skel-rect
                </code>
                <code className="text-[10px] font-mono text-muted-foreground px-2 py-1 rounded bg-muted/40">
                  .roy-skel-card
                </code>
              </div>
            </div>
          </Section>

          {/* Microinteractions */}
          <Section eyebrow="Micro" title="Microinteractions (5)">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <DemoTile
                label="roy-micro-like"
                onPlay={() => {}}
              >
                <Heart className="size-6 text-rose-500 fill-rose-500 roy-micro-like" />
              </DemoTile>
              <DemoTile label="roy-micro-check">
                <Check className="size-6 text-emerald-500 roy-micro-check" />
              </DemoTile>
              <DemoTile label="roy-micro-shake-error">
                <AlertCircle className="size-6 text-rose-500 roy-micro-shake-error" />
              </DemoTile>
              <DemoTile label="roy-micro-pulse-attention">
                <div className="roy-micro-pulse-attention rounded-full p-1 bg-amber-500/20">
                  <Bell className="size-6 text-amber-500" />
                </div>
              </DemoTile>
              <DemoTile label="roy-micro-bob">
                <Sparkles className="size-6 text-primary roy-micro-bob" />
              </DemoTile>
            </div>
          </Section>

          {/* Spring easing tokens */}
          <Section eyebrow="Tokens" title="Spring Easing Tokens">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <TokenChip
                name="roy-ease-spring"
                value="cubic-bezier(0.34, 1.56, 0.64, 1)"
              />
              <TokenChip
                name="roy-ease-spring-soft"
                value="cubic-bezier(0.25, 1.2, 0.5, 1)"
              />
              <TokenChip
                name="roy-ease-spring-snappy"
                value="cubic-bezier(0.5, 1.65, 0.5, 1)"
              />
              <TokenChip
                name="roy-ease-out-expo"
                value="cubic-bezier(0.16, 1, 0.3, 1)"
              />
              <TokenChip
                name="roy-ease-in-out"
                value="cubic-bezier(0.65, 0, 0.35, 1)"
              />
              <TokenChip
                name="roy-dur-instant"
                value="120ms"
              />
              <TokenChip
                name="roy-dur-fast"
                value="200ms"
              />
              <TokenChip
                name="roy-dur-normal"
                value="400ms"
              />
              <TokenChip
                name="roy-dur-slow"
                value="700ms"
              />
              <TokenChip
                name="roy-dur-slower"
                value="1100ms"
              />
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Click any chip to copy the CSS declaration. Use these tokens
              anywhere — they cascade from the <code>:root</code> block in{" "}
              <code>roymotion.css</code>.
            </p>
          </Section>
        </div>

        {/* Footer note */}
        <ScrollReveal delay={0.2}>
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Built on modern CSS — OKLCH color, <code>color-mix()</code>,
              logical properties, CSS Nesting, <code>@property</code>, and
              progressive-enhancement <code>@supports</code> for scroll-driven
              animations. Falls back gracefully when motion is reduced.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
