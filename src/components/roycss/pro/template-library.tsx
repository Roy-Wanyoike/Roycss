"use client";

/**
 * TemplateLibrary — RoyCSS production template library with LIVE previews.
 *
 * Self-contained (no props). Eight hand-crafted templates, each rendered
 * for real (not screenshots) inside a scaled-down preview frame. Click a
 * card to open a Dialog with the full-size live preview + a Copy-able
 * JSX/HTML snippet.
 *
 * Templates (id → category):
 *   • hero-section      → Marketing      — gradient bg + animated heading + CTA
 *   • feature-grid      → Marketing      — 3-column feature cards with icons
 *   • pricing-table     → Marketing      — 3-tier pricing, highlighted middle
 *   • testimonial-card  → UI Components  — avatar + quote + star rating
 *   • stats-bar         → UI Components  — 4 stat cards with animated counters
 *   • footer            → Layouts        — multi-column footer with links
 *   • navbar            → Layouts        — glass navbar with logo + links + CTA
 *   • login-form        → Forms          — centered card + email/password + social
 *
 * Features:
 *   • Search bar — case-insensitive substring on template name.
 *   • Category filter chips — All / Marketing / UI Components / Layouts /
 *     Forms (single-select toggle, color-coded).
 *   • Card grid — each card shows the LIVE mini-preview (scaled down via
 *     CSS transform, measured with ResizeObserver) plus name + description
 *     + category badge. Hover lifts.
 *   • Click → Dialog with two tabs (shadcn Tabs):
 *       - Preview  : full-size live render with a "device frame" wrapper.
 *       - Code     : syntax-formatted JSX/HTML snippet + Copy button
 *                    (clipboard API + 2s ✓ feedback).
 *
 * Color discipline: only the approved RoyCSS palette (emerald, teal, cyan,
 * amber, rose, violet) plus semantic theme tokens (`primary`, `accent`,
 * `muted`, `card`, `border`, …). NO indigo / blue.
 *
 * TS strict, zero `any`. SSR-safe — all `window`/DOM access happens inside
 * effects or callbacks, never during render.
 */

import * as React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Copy,
  Github,
  LayoutGrid,
  Lock,
  Mail,
  Menu,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Star,
  Twitter,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Category = "marketing" | "ui" | "layouts" | "forms";
type CategoryFilter = "all" | Category;
type TemplateId =
  | "hero-section"
  | "feature-grid"
  | "pricing-table"
  | "testimonial-card"
  | "stats-bar"
  | "footer"
  | "navbar"
  | "login-form";

interface TemplateMeta {
  readonly id: TemplateId;
  readonly name: string;
  readonly description: string;
  readonly category: Category;
  /** JSX/HTML snippet shown in the Code tab. */
  readonly code: string;
}

interface CategoryMeta {
  readonly label: string;
  /** Badge classes for the small category label on cards. */
  readonly badge: string;
  /** Subtle background tint used on the active filter chip. */
  readonly chipActive: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Category metadata (approved palette — NO indigo / blue)
// ═══════════════════════════════════════════════════════════════════════

const CATEGORY_META: Record<Category, CategoryMeta> = {
  marketing: {
    label: "Marketing",
    badge:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
    chipActive:
      "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200",
  },
  ui: {
    label: "UI Components",
    badge:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
    chipActive:
      "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200",
  },
  layouts: {
    label: "Layouts",
    badge:
      "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
    chipActive:
      "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
  },
  forms: {
    label: "Forms",
    badge:
      "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
    chipActive:
      "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200",
  },
} as const;

const CATEGORY_ORDER: readonly CategoryFilter[] = [
  "all",
  "marketing",
  "ui",
  "layouts",
  "forms",
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Templates catalogue (metadata + code snippets)
// ═══════════════════════════════════════════════════════════════════════

const TEMPLATES: readonly TemplateMeta[] = [
  {
    id: "hero-section",
    name: "Hero Section",
    description:
      "Gradient backdrop with animated headline, sub-copy, and dual CTA buttons. The opening statement of any landing page.",
    category: "marketing",
    code: `<section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-8 py-20 text-center text-white">
  {/* Decorative blurred blobs */}
  <div className="absolute -top-24 -left-24 size-72 rounded-full bg-white/20 blur-3xl" aria-hidden />
  <div className="absolute -bottom-32 -right-16 size-80 rounded-full bg-cyan-300/30 blur-3xl" aria-hidden />

  <motion.h1
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    className="relative text-balance text-4xl font-bold tracking-tight sm:text-6xl"
  >
    Build interfaces that feel inevitable.
  </motion.h1>

  <p className="relative mx-auto mt-6 max-w-2xl text-pretty text-base text-white/90 sm:text-lg">
    RoyCSS ships 1.5k+ production-ready effects, tokens, and recipes.
    Zero runtime. OKLCH color. Logical properties. Container queries.
  </p>

  <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
    <button className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition hover:scale-[1.02] hover:shadow-xl">
      Get started free <ArrowRight className="size-4" />
    </button>
    <button className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
      View on GitHub
    </button>
  </div>
</section>`,
  },
  {
    id: "feature-grid",
    name: "Feature Grid",
    description:
      "Three feature cards with lucide icons, headline, and supporting copy. The classic value-proposition row.",
    category: "marketing",
    code: `<div className="grid gap-6 sm:grid-cols-3">
  {features.map((f) => (
    <div
      key={f.title}
      className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-110">
        <f.icon className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {f.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {f.body}
      </p>
    </div>
  ))}
</div>`,
  },
  {
    id: "pricing-table",
    name: "Pricing Table",
    description:
      "Three pricing tiers with the middle plan highlighted via a primary-colored ring + scale-up. Includes CTA + feature list.",
    category: "marketing",
    code: `<div className="grid items-stretch gap-6 sm:grid-cols-3">
  {tiers.map((tier) => {
    const featured = tier.id === "pro";
    return (
      <div
        key={tier.id}
        className={cn(
          "relative flex flex-col rounded-2xl border p-6",
          featured
            ? "border-primary bg-primary/5 shadow-lg sm:-translate-y-2 sm:scale-[1.03]"
            : "bg-card shadow-sm",
        )}
      >
        {featured && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Most popular
          </span>
        )}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {tier.name}
        </h3>
        <p className="mt-3 text-4xl font-bold tabular-nums text-foreground">
          \${tier.price}
          <span className="text-base font-normal text-muted-foreground">/mo</span>
        </p>
        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
          {tier.features.map((feat) => (
            <li key={feat} className="flex items-center gap-2">
              <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
              {feat}
            </li>
          ))}
        </ul>
        <button
          className={cn(
            "mt-6 w-full rounded-full px-4 py-2 text-sm font-semibold transition",
            featured
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "border border-border bg-background text-foreground hover:bg-accent",
          )}
        >
          Choose {tier.name}
        </button>
      </div>
    );
  })}
</div>`,
  },
  {
    id: "testimonial-card",
    name: "Testimonial Card",
    description:
      "Customer quote with avatar (initials fallback), 5-star rating, name + role. The trust signal.",
    category: "ui",
    code: `<figure className="mx-auto max-w-xl rounded-2xl border bg-card p-8 shadow-sm">
  <div className="flex gap-1 text-amber-500" aria-label="Rated 5 out of 5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="size-5 fill-current" />
    ))}
  </div>
  <blockquote className="mt-4 text-pretty text-lg font-medium leading-relaxed text-foreground">
    “RoyCSS cut our design-to-deploy time in half. The OKLCH tokens and
    logical properties mean we ship RTL-ready and dark-mode-perfect by
    default — no extra sprint.”
  </blockquote>
  <figcaption className="mt-6 flex items-center gap-3">
    <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white">
      AK
    </span>
    <span>
      <span className="block text-sm font-semibold text-foreground">
        Amara Kiptoo
      </span>
      <span className="block text-xs text-muted-foreground">
        Staff Engineer · FinTech
      </span>
    </span>
  </figcaption>
</figure>`,
  },
  {
    id: "stats-bar",
    name: "Stats Bar",
    description:
      "Four stat cards with animated count-up counters (rAF-driven, reduced-motion safe). The social-proof strip.",
    category: "ui",
    code: `function StatCard({ value, suffix, label }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setDisplay(value); return; }
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce]);

  return (
    <div ref={ref} className="rounded-2xl border bg-card p-5 text-center">
      <p className="text-3xl font-bold tabular-nums text-foreground">
        {display.toLocaleString()}{suffix}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}`,
  },
  {
    id: "footer",
    name: "Footer",
    description:
      "Four-column footer — brand blurb + three link groups + bottom bar with socials and copyright.",
    category: "layouts",
    code: `<footer className="rounded-2xl border bg-card px-8 py-12">
  <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
    <div>
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <Sparkles className="size-5 text-primary" />
        RoyCSS
      </div>
      <p className="mt-3 max-w-xs text-sm text-muted-foreground">
        Production-ready CSS effects, design tokens, and templates.
        Ship faster, look sharper.
      </p>
    </div>
    {columns.map((col) => (
      <nav key={col.title} aria-label={col.title}>
        <h4 className="text-sm font-semibold text-foreground">
          {col.title}
        </h4>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {col.links.map((l) => (
            <li key={l}>
              <a className="transition hover:text-foreground" href="#">{l}</a>
            </li>
          ))}
        </ul>
      </nav>
    ))}
  </div>
  <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
    <p className="text-xs text-muted-foreground">
      © {new Date().getFullYear()} RoyCSS. MIT licensed.
    </p>
    <div className="flex gap-3 text-muted-foreground">
      <a href="#" aria-label="GitHub"><Github className="size-5" /></a>
      <a href="#" aria-label="Twitter"><Twitter className="size-5" /></a>
    </div>
  </div>
</footer>`,
  },
  {
    id: "navbar",
    name: "Navbar",
    description:
      "Glass navbar — sticky, blurred backdrop, logo, nav links, and a primary CTA. Collapses to a menu icon on small screens.",
    category: "layouts",
    code: `<header className="sticky top-0 z-40 border-b border-white/20 bg-white/70 backdrop-blur-xl">
  <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
    <a href="#" className="flex items-center gap-2 font-semibold text-foreground">
      <Sparkles className="size-5 text-primary" />
      RoyCSS
    </a>
    <div className="hidden items-center gap-6 md:flex">
      {links.map((l) => (
        <a
          key={l}
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          href="#"
        >
          {l}
        </a>
      ))}
    </div>
    <div className="flex items-center gap-2">
      <button className="hidden text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex sm:px-3 sm:py-1.5">
        Sign in
      </button>
      <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
        Get started <ArrowRight className="size-4" />
      </button>
      <button className="md:hidden" aria-label="Open menu">
        <Menu className="size-5 text-foreground" />
      </button>
    </div>
  </nav>
</header>`,
  },
  {
    id: "login-form",
    name: "Login Form",
    description:
      "Centered auth card with email/password inputs, remember-me, divider, and two social sign-in buttons (Google-style).",
    category: "forms",
    code: `<div className="mx-auto max-w-md rounded-2xl border bg-card p-8 shadow-sm">
  <div className="text-center">
    <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Lock className="size-5" />
    </div>
    <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
      Welcome back
    </h2>
    <p className="mt-1 text-sm text-muted-foreground">
      Sign in to continue to your dashboard.
    </p>
  </div>

  <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
    <label className="block">
      <span className="text-sm font-medium text-foreground">Email</span>
      <div className="relative mt-1.5">
        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </label>

    <label className="block">
      <span className="text-sm font-medium text-foreground">Password</span>
      <div className="relative mt-1.5">
        <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </label>

    <div className="flex items-center justify-between text-sm">
      <label className="inline-flex items-center gap-2 text-muted-foreground">
        <input type="checkbox" className="size-4 rounded border-border accent-primary" />
        Remember me
      </label>
      <a className="font-medium text-primary hover:underline" href="#">
        Forgot password?
      </a>
    </div>

    <button
      type="submit"
      className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
    >
      Sign in
    </button>
  </form>

  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
    <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
  </div>

  <div className="grid grid-cols-2 gap-3">
    <button className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background py-2.5 text-sm font-medium transition hover:bg-accent">
      <Github className="size-4" /> GitHub
    </button>
    <button className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background py-2.5 text-sm font-medium transition hover:bg-accent">
      <Twitter className="size-4" /> Twitter
    </button>
  </div>
</div>`,
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Live preview components — one per template
// Each is a self-contained block using RoyCSS classes + semantic colors.
// ═══════════════════════════════════════════════════════════════════════

interface PreviewProps {
  /** When true, play entrance animations (used in the dialog full view).
   *  When false (mini-preview), keep things static so they fit cleanly. */
  animate?: boolean;
}

// ─── Hero Section ───────────────────────────────────────────────────────
function HeroPreview({ animate = true }: PreviewProps): ReactNode {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-8 py-14 text-center text-white sm:py-20">
      {/* Decorative blurred blobs */}
      <div
        className="absolute -top-24 -left-24 size-72 rounded-full bg-white/20 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -right-16 size-80 rounded-full bg-cyan-300/30 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      <motion.h1
        initial={animate ? { opacity: 0, y: 24 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative text-balance text-3xl font-bold tracking-tight sm:text-5xl"
      >
        Build interfaces that feel inevitable.
      </motion.h1>

      <p className="relative mx-auto mt-5 max-w-2xl text-pretty text-sm text-white/90 sm:text-lg">
        RoyCSS ships 1.5k+ production-ready effects, tokens, and recipes.
        Zero runtime. OKLCH color. Logical properties. Container queries.
      </p>

      <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
        >
          Get started free
          <ArrowRight className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
        >
          <Github className="size-4" aria-hidden />
          View on GitHub
        </button>
      </div>
    </section>
  );
}

// ─── Feature Grid ───────────────────────────────────────────────────────
const FEATURE_ITEMS: readonly {
  icon: typeof Zap;
  title: string;
  body: string;
}[] = [
  {
    icon: Zap,
    title: "Zero runtime",
    body: "Pure CSS classes — no JavaScript bundle cost. Ship effects without shipping JS.",
  },
  {
    icon: Shield,
    title: "Accessible by default",
    body: "WCAG-AA contrast, reduced-motion guards, and logical properties baked into every token.",
  },
  {
    icon: Rocket,
    title: "Container-ready",
    body: "Responsive via container queries. Components look right at any size, not just breakpoints.",
  },
] as const;

function FeatureGridPreview(): ReactNode {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {FEATURE_ITEMS.map((f) => {
        const Icon = f.icon;
        return (
          <div
            key={f.title}
            className="group rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:scale-110">
              <Icon className="size-5" aria-hidden />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">
              {f.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {f.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pricing Table ──────────────────────────────────────────────────────
interface Tier {
  id: string;
  name: string;
  price: number;
  features: readonly string[];
}

const TIERS: readonly Tier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    features: ["1 project", "Community support", "100 effects"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    features: [
      "Unlimited projects",
      "Priority support",
      "All 1.5k+ effects",
      "Pro templates",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: 49,
    features: [
      "Everything in Pro",
      "10 seats included",
      "SSO + audit log",
      "Custom themes",
    ],
  },
] as const;

function PricingPreview(): ReactNode {
  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-3">
      {TIERS.map((tier) => {
        const featured = tier.id === "pro";
        return (
          <div
            key={tier.id}
            className={cn(
              "relative flex flex-col rounded-2xl border p-5",
              featured
                ? "border-primary bg-primary/5 shadow-lg sm:-translate-y-2 sm:scale-[1.03]"
                : "bg-card shadow-sm",
            )}
          >
            {featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                Most popular
              </span>
            )}
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tier.name}
            </h3>
            <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
              ${tier.price}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              {tier.features.map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <Check
                    className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                  {feat}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={cn(
                "mt-5 w-full rounded-full px-4 py-2 text-xs font-semibold transition",
                featured
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "border border-border bg-background text-foreground hover:bg-accent",
              )}
            >
              Choose {tier.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Testimonial Card ───────────────────────────────────────────────────
function TestimonialPreview(): ReactNode {
  return (
    <figure className="mx-auto max-w-xl rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
      <div
        className="flex gap-1 text-amber-500"
        aria-label="Rated 5 out of 5"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="size-5 fill-current" aria-hidden />
        ))}
      </div>
      <blockquote className="mt-4 text-pretty text-base font-medium leading-relaxed text-foreground sm:text-lg">
        “RoyCSS cut our design-to-deploy time in half. The OKLCH tokens and
        logical properties mean we ship RTL-ready and dark-mode-perfect by
        default — no extra sprint.”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white">
          AK
        </span>
        <span>
          <span className="block text-sm font-semibold text-foreground">
            Amara Kiptoo
          </span>
          <span className="block text-xs text-muted-foreground">
            Staff Engineer · FinTech
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

// ─── Stats Bar (animated counters) ──────────────────────────────────────
interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

const STAT_ITEMS: readonly StatItem[] = [
  { value: 1749, suffix: "+", label: "CSS effects" },
  { value: 48, suffix: "K", label: "Weekly downloads" },
  { value: 99, suffix: "%", label: "Lighthouse a11y" },
  { value: 12, suffix: "ms", label: "Avg paint time" },
] as const;

function StatCard({ value, suffix, label }: StatItem): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  // `animated` only advances while the rAF loop is running. The render-time
  // `display` computation below decides between the animated value and the
  // final value (when reduced motion is preferred), so no synchronous
  // setState happens inside the effect body.
  const [animated, setAnimated] = useState<number>(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const start = performance.now();
    const duration = 1200;
    let raf = 0;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic — feels punchy without overshoot on numbers.
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce]);

  // Reduced motion → show the final value immediately (no rAF).
  // Not yet in view → animated is still 0, so we render 0 until the
  // element scrolls into the viewport and the loop kicks off.
  const display: number = reduce ? value : animated;

  return (
    <div ref={ref} className="rounded-2xl border bg-card p-4 text-center sm:p-5">
      <p className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
        {display.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function StatsBarPreview(): ReactNode {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {STAT_ITEMS.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────
const FOOTER_COLUMNS: readonly {
  title: string;
  links: readonly string[];
}[] = [
  {
    title: "Product",
    links: ["Effects", "Recipes", "Templates", "Tokens"],
  },
  {
    title: "Resources",
    links: ["Docs", "Guides", "Blog", "Changelog"],
  },
  {
    title: "Company",
    links: ["About", "Sponsors", "Contact", "License"],
  },
] as const;

function FooterPreview(): ReactNode {
  return (
    <footer className="rounded-2xl border bg-card px-6 py-10 sm:px-8">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="size-5 text-primary" aria-hidden />
            RoyCSS
          </div>
          <p className="mt-3 max-w-xs text-xs text-muted-foreground">
            Production-ready CSS effects, design tokens, and templates.
            Ship faster, look sharper.
          </p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h4 className="text-sm font-semibold text-foreground">
              {col.title}
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    className="transition hover:text-foreground"
                    href="#"
                    onClick={(e) => e.preventDefault()}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} RoyCSS. MIT licensed.
        </p>
        <div className="flex gap-3 text-muted-foreground">
          <a
            href="#"
            aria-label="GitHub"
            onClick={(e) => e.preventDefault()}
            className="transition hover:text-foreground"
          >
            <Github className="size-5" aria-hidden />
          </a>
          <a
            href="#"
            aria-label="Twitter"
            onClick={(e) => e.preventDefault()}
            className="transition hover:text-foreground"
          >
            <Twitter className="size-5" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Navbar (glass) ─────────────────────────────────────────────────────
const NAV_LINKS: readonly string[] = [
  "Effects",
  "Templates",
  "Docs",
  "Pricing",
] as const;

function NavbarPreview(): ReactNode {
  return (
    <header className="sticky top-0 z-40 rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl dark:bg-card/70">
      <nav className="flex items-center justify-between px-5 py-3">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <Sparkles className="size-5 text-primary" aria-hidden />
          RoyCSS
        </a>
        <div className="hidden items-center gap-5 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {l}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex sm:px-2 sm:py-1.5"
          >
            Sign in
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Get started
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="md:hidden inline-flex size-9 items-center justify-center rounded-md text-foreground transition hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </div>
      </nav>
    </header>
  );
}

// ─── Login Form ─────────────────────────────────────────────────────────
function LoginPreview(): ReactNode {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="size-5" aria-hidden />
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to continue to your dashboard.
        </p>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="block">
          <span className="text-sm font-medium text-foreground">Email</span>
          <div className="relative mt-1.5">
            <Mail
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full rounded-lg border border-border bg-background py-2.5 pr-3 pl-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">
            Password
          </span>
          <div className="relative mt-1.5">
            <Lock
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-background py-2.5 pr-3 pl-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </label>

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-primary"
            />
            Remember me
          </label>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="font-medium text-primary hover:underline"
          >
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Sign in
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden />
        OR
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
        >
          <Github className="size-4" aria-hidden />
          GitHub
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
        >
          <Twitter className="size-4" aria-hidden />
          Twitter
        </button>
      </div>
    </div>
  );
}

// ─── Dispatcher ─────────────────────────────────────────────────────────
function PreviewRenderer({
  id,
  animate,
}: { id: TemplateId } & PreviewProps): ReactNode {
  switch (id) {
    case "hero-section":
      return <HeroPreview animate={animate} />;
    case "feature-grid":
      return <FeatureGridPreview />;
    case "pricing-table":
      return <PricingPreview />;
    case "testimonial-card":
      return <TestimonialPreview />;
    case "stats-bar":
      return <StatsBarPreview />;
    case "footer":
      return <FooterPreview />;
    case "navbar":
      return <NavbarPreview />;
    case "login-form":
      return <LoginPreview />;
    default: {
      // Exhaustiveness guard — every TemplateId is handled above.
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MiniPreview — renders the live preview scaled to fit a small frame.
// Uses a ResizeObserver to compute the scale factor dynamically so the
// preview always fills the card width regardless of grid column count.
// ═══════════════════════════════════════════════════════════════════════

interface MiniPreviewProps {
  id: TemplateId;
  /** Source width (px) the preview is rendered at before scaling. */
  sourceWidth?: number;
  /** Target frame height (px). */
  frameHeight?: number;
}

function MiniPreview({
  id,
  sourceWidth = 1024,
  frameHeight = 220,
}: MiniPreviewProps): ReactNode {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.25);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = (): void => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / sourceWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sourceWidth]);

  return (
    <div
      ref={frameRef}
      className="relative w-full overflow-hidden rounded-xl border bg-muted/30"
      style={{ height: frameHeight }}
      aria-hidden
    >
      {/* Checker / dot grid backdrop so transparent templates read clearly */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.5 0 0 / 0.10) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: sourceWidth,
          transform: `scale(${scale})`,
        }}
      >
        {/* Render the preview WITHOUT entrance animations so the mini
            frame stays static and reads as a clean thumbnail. */}
        <div className="p-4">
          <PreviewRenderer id={id} animate={false} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Copy button (in-code-block, top-right)
// ═══════════════════════════════════════════════════════════════════════

function CopyButton({ code }: { code: string }): ReactNode {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — silently noop */
    }
  }, [code]);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="absolute right-2 top-2 h-7 gap-1.5 px-2 text-xs"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? (
        <>
          <Check
            className="size-3.5 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" aria-hidden />
          Copy
        </>
      )}
    </Button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TemplateCard — single card in the grid
// ═══════════════════════════════════════════════════════════════════════

interface TemplateCardProps {
  template: TemplateMeta;
  onOpen: (template: TemplateMeta) => void;
}

function TemplateCard({ template, onOpen }: TemplateCardProps): ReactNode {
  const meta = CATEGORY_META[template.category];
  return (
    <button
      type="button"
      onClick={() => onOpen(template)}
      className="group block h-full w-full cursor-pointer rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Open ${template.name} preview`}
    >
      {/* Mini live preview */}
      <MiniPreview id={template.id} />

      {/* Meta */}
      <div className="mt-3 px-1 pb-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight text-foreground">
            {template.name}
          </h3>
          <Badge
            variant="outline"
            className={cn("shrink-0 text-[10px]", meta.badge)}
          >
            {meta.label}
          </Badge>
        </div>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {template.description}
        </p>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TemplateDialog — full-size preview + code
// ═══════════════════════════════════════════════════════════════════════

interface TemplateDialogProps {
  template: TemplateMeta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TemplateDialog({
  template,
  open,
  onOpenChange,
}: TemplateDialogProps): ReactNode {
  // Render a closed placeholder when no template is active so the
  // close animation doesn't snap on stale data.
  if (!template) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl" />
      </Dialog>
    );
  }

  const meta = CATEGORY_META[template.category];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg">{template.name}</DialogTitle>
            <Badge variant="outline" className={cn("text-[10px]", meta.badge)}>
              {meta.label}
            </Badge>
          </div>
          <DialogDescription className="mt-1">
            {template.description}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-7rem)] overflow-y-auto">
          <Tabs defaultValue="preview" className="gap-0">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <TabsList className="bg-transparent p-0">
                <TabsTrigger
                  value="preview"
                  className="data-[state=active]:bg-accent"
                >
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="data-[state=active]:bg-accent"
                >
                  Code
                </TabsTrigger>
              </TabsList>
              <span className="font-mono text-[10px] text-muted-foreground">
                #{template.id}
              </span>
            </div>

            {/* Preview tab — full-size live render */}
            <TabsContent
              value="preview"
              className="m-0 bg-muted/30 p-6 outline-none"
            >
              <div className="mx-auto max-w-3xl">
                <PreviewRenderer id={template.id} animate />
              </div>
            </TabsContent>

            {/* Code tab — JSX snippet + copy */}
            <TabsContent
              value="code"
              className="m-0 bg-muted/30 p-6 outline-none"
            >
              <div className="relative mx-auto max-w-3xl">
                <pre className="max-h-[60vh] overflow-auto rounded-xl border bg-card p-4 text-xs leading-relaxed shadow-sm">
                  <code className="font-mono text-foreground/90 whitespace-pre">
                    {template.code}
                  </code>
                </pre>
                <CopyButton code={template.code} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Toolbar — search + category chips
// ═══════════════════════════════════════════════════════════════════════

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
  visibleCount: number;
  totalCount: number;
}

function Toolbar({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  visibleCount,
  totalCount,
}: ToolbarProps): ReactNode {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      {/* Search */}
      <div className="relative w-full lg:max-w-xs">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search templates by name…"
          className="pl-9"
          aria-label="Search templates"
        />
      </div>

      {/* Category chips */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Filter by category"
      >
        <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
          <LayoutGrid className="size-3.5" aria-hidden />
          Category
        </span>
        {CATEGORY_ORDER.map((cat) => {
          const isActive = activeFilter === cat;
          const meta = cat === "all" ? null : CATEGORY_META[cat];
          const label = cat === "all" ? "All" : CATEGORY_META[cat].label;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onFilterChange(cat)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? meta
                    ? meta.chipActive
                    : "border-foreground/30 bg-foreground/10 text-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <div className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
        <BarChart3 className="size-3.5" aria-hidden />
        <span className="tabular-nums">
          {visibleCount} / {totalCount}
        </span>
        <span className="sr-only">templates shown</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TemplateLibrary — main exported component
// ═══════════════════════════════════════════════════════════════════════

export function TemplateLibrary(): React.JSX.Element {
  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [active, setActive] = useState<TemplateMeta | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // ─── Filter pipeline (memoized on every input) ───────────────────────
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      if (filter !== "all" && t.category !== filter) return false;
      if (q.length > 0 && !t.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, filter]);

  const hasFilters = search.trim().length > 0 || filter !== "all";

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleOpen = useCallback((template: TemplateMeta) => {
    setActive(template);
    setDialogOpen(true);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Defer clearing so the close animation runs against the right data.
      window.setTimeout(() => setActive(null), 200);
    }
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setFilter("all");
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <LayoutGrid className="size-5 text-primary" aria-hidden />
          Template Library
        </CardTitle>
        <CardDescription>
          {TEMPLATES.length} production-ready templates · live previews ·
          copy-paste code. Built with RoyCSS semantic tokens.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" aria-hidden />
            {visible.length} shown
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        <Toolbar
          search={search}
          onSearchChange={setSearch}
          activeFilter={filter}
          onFilterChange={setFilter}
          visibleCount={visible.length}
          totalCount={TEMPLATES.length}
        />

        {/* ─── Grid ──────────────────────────────────────────────── */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onOpen={handleOpen}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Search className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">
                No templates found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <TemplateDialog
        template={active}
        open={dialogOpen}
        onOpenChange={handleClose}
      />
    </Card>
  );
}
