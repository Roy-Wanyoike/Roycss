"use client";

import { motion } from "framer-motion";
import {
  Users,
  FolderHeart,
  Activity,
  Star,
  Sparkles,
  Award,
  Zap,
  Flame,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/roycss/motion-primitives";

/* ═══════════════════════════════════════════════════════════════
   CommunitySpotlight
   ───────────────────────────────────────────────────────────────
   A self-contained section that celebrates the RoyCSS community:
     1. Featured Contributors — 4 power users with avatar initials,
        effect count, and a recognition badge.
     2. Top Collections — 3 community-curated effect bundles.
     3. Recent Activity — a live feed of the latest additions.

   All data is mock (no API). Styled as cards in a responsive grid
   using only semantic theme colors + the platform's accent palette.
   ═══════════════════════════════════════════════════════════════ */

type Accent = "emerald" | "amber" | "rose" | "violet" | "cyan" | "teal";

const ACCENT: Record<
  Accent,
  { text: string; bg: string; border: string; ring: string; gradient: string }
> = {
  emerald: {
    text: "text-emerald-500",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/20",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  amber: {
    text: "text-amber-500",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    ring: "ring-amber-500/20",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  rose: {
    text: "text-rose-500",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    ring: "ring-rose-500/20",
    gradient: "from-rose-500/20 to-rose-500/5",
  },
  violet: {
    text: "text-violet-500",
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
    ring: "ring-violet-500/20",
    gradient: "from-violet-500/20 to-violet-500/5",
  },
  cyan: {
    text: "text-cyan-500",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    ring: "ring-cyan-500/20",
    gradient: "from-cyan-500/20 to-cyan-500/5",
  },
  teal: {
    text: "text-teal-500",
    bg: "bg-teal-500/15",
    border: "border-teal-500/30",
    ring: "ring-teal-500/20",
    gradient: "from-teal-500/20 to-teal-500/5",
  },
};

/* ─── Mock data ─────────────────────────────────────────────── */

interface Contributor {
  name: string;
  handle: string;
  initials: string;
  effectsCount: number;
  stars: number;
  badge: string;
  badgeIcon: LucideIcon;
  accent: Accent;
}

const CONTRIBUTORS: Contributor[] = [
  {
    name: "Amara Okafor",
    handle: "@amara.css",
    initials: "AO",
    effectsCount: 142,
    stars: 9821,
    badge: "Top Contributor",
    badgeIcon: Crown,
    accent: "violet",
  },
  {
    name: "Liam Chen",
    handle: "@liam.fx",
    initials: "LC",
    effectsCount: 118,
    stars: 7654,
    badge: "Effect Pioneer",
    badgeIcon: Zap,
    accent: "amber",
  },
  {
    name: "Sofia Reyes",
    handle: "@sofia.glass",
    initials: "SR",
    effectsCount: 96,
    stars: 6210,
    badge: "Glass Master",
    badgeIcon: Sparkles,
    accent: "cyan",
  },
  {
    name: "Noah Bauer",
    handle: "@noah.motion",
    initials: "NB",
    effectsCount: 87,
    stars: 5987,
    badge: "Rising Star",
    badgeIcon: Flame,
    accent: "rose",
  },
];

interface Collection {
  name: string;
  curator: string;
  effectCount: number;
  description: string;
  accent: Accent;
  icon: LucideIcon;
}

const COLLECTIONS: Collection[] = [
  {
    name: "Glassmorphism Essentials",
    curator: "@sofia.glass",
    effectCount: 24,
    description: "Frosted surfaces, blur layers, and translucent cards for modern UIs.",
    accent: "cyan",
    icon: Sparkles,
  },
  {
    name: "Micro-interactions Pack",
    curator: "@noah.motion",
    effectCount: 38,
    description: "Tiny delights — button presses, icon shakes, and feedback animations.",
    accent: "rose",
    icon: Zap,
  },
  {
    name: "Hero Section Toolkit",
    curator: "@amara.css",
    effectCount: 52,
    description: "Everything you need to build a high-converting landing hero.",
    accent: "violet",
    icon: Flame,
  },
];

interface ActivityItem {
  user: string;
  initials: string;
  action: string;
  effect: string;
  collection: string;
  time: string;
  accent: Accent;
}

const ACTIVITY: ActivityItem[] = [
  {
    user: "@amara.css",
    initials: "AO",
    action: "added",
    effect: "text-aurora-gradient",
    collection: "Hero Section Toolkit",
    time: "2m ago",
    accent: "violet",
  },
  {
    user: "@noah.motion",
    initials: "NB",
    action: "added",
    effect: "micro-bell-shake",
    collection: "Micro-interactions Pack",
    time: "14m ago",
    accent: "rose",
  },
  {
    user: "@sofia.glass",
    initials: "SR",
    action: "added",
    effect: "glass-nav-bar",
    collection: "Glassmorphism Essentials",
    time: "38m ago",
    accent: "cyan",
  },
  {
    user: "@liam.fx",
    initials: "LC",
    action: "added",
    effect: "btn-shine-sweep",
    collection: "CTA Buttons",
    time: "1h ago",
    accent: "amber",
  },
  {
    user: "@noah.motion",
    initials: "NB",
    action: "added",
    effect: "hover-lift-glow",
    collection: "Micro-interactions Pack",
    time: "2h ago",
    accent: "teal",
  },
];

/* ─── Helpers ───────────────────────────────────────────────── */

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function Avatar({
  initials,
  accent,
  size = "md",
}: {
  initials: string;
  accent: Accent;
  size?: "sm" | "md" | "lg";
}) {
  const a = ACCENT[accent];
  const sizeClasses =
    size === "lg" ? "size-14 text-base" : size === "sm" ? "size-8 text-[11px]" : "size-11 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold ${a.bg} ${a.text} ring-2 ${a.ring} ${sizeClasses}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-section: Featured Contributors
   ═══════════════════════════════════════════════════════════════ */
function ContributorCard({ contributor, index }: { contributor: Contributor; index: number }) {
  const a = ACCENT[contributor.accent];
  const BadgeIcon = contributor.badgeIcon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={`group relative overflow-hidden rounded-2xl border ${a.border} bg-card p-5 transition-shadow hover:shadow-lg`}
    >
      <div
        className={`pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-gradient-to-br ${a.gradient} blur-2xl opacity-60`}
      />
      <div className="relative flex items-center gap-3">
        <Avatar initials={contributor.initials} accent={contributor.accent} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-foreground">
            {contributor.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{contributor.handle}</p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-2">
        <Badge variant="secondary" className={`gap-1 ${a.bg} ${a.text}`}>
          <BadgeIcon className="size-3" />
          {contributor.badge}
        </Badge>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-center">
        <div>
          <p className={`font-display text-lg font-bold ${a.text}`}>
            {formatCount(contributor.effectsCount)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Effects</p>
        </div>
        <div>
          <p className="font-display text-lg font-bold text-amber-500">
            {formatCount(contributor.stars)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stars</p>
        </div>
      </div>
    </motion.article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-section: Top Collections
   ═══════════════════════════════════════════════════════════════ */
function CollectionCard({ collection, index }: { collection: Collection; index: number }) {
  const a = ACCENT[collection.accent];
  const Icon = collection.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className={`flex size-10 items-center justify-center rounded-xl ${a.bg} ${a.text}`}>
          <Icon className="size-5" />
        </span>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {collection.effectCount} effects
        </Badge>
      </div>
      <h4 className="font-display text-base font-bold text-foreground">{collection.name}</h4>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
        {collection.description}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <span className="text-xs text-muted-foreground">
          by <span className="font-medium text-foreground/80">{collection.curator}</span>
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Browse
          <Star className="size-3" />
        </button>
      </div>
    </motion.article>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-section: Recent Activity feed
   ═══════════════════════════════════════════════════════════════ */
function ActivityRow({ item, index }: { item: ActivityItem; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-3 py-2.5 transition-colors hover:bg-card"
    >
      <Avatar initials={item.initials} accent={item.accent} size="sm" />
      <p className="min-w-0 flex-1 text-xs leading-snug text-muted-foreground">
        <span className="font-semibold text-foreground">{item.user}</span> {item.action}{" "}
        <code className="rounded bg-primary/10 px-1 py-0.5 font-mono text-[11px] text-primary">
          {item.effect}
        </code>{" "}
        to{" "}
        <span className="font-medium text-foreground/80">{item.collection}</span>
      </p>
      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{item.time}</span>
    </motion.li>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main section
   ═══════════════════════════════════════════════════════════════ */
export function CommunitySpotlight() {
  return (
    <section aria-label="Community spotlight" className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Heading */}
        <ScrollReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Users className="size-3" />
              Community
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built by the community, for the community
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              RoyCSS is shaped by hundreds of contributors. Meet the top authors, browse curated
              collections, and watch the latest activity roll in.
            </p>
          </div>
        </ScrollReveal>

        {/* Featured Contributors */}
        <ScrollReveal delay={0.05}>
          <div className="mb-4 flex items-center gap-2">
            <Award className="size-4 text-primary" />
            <h3 className="font-display text-lg font-bold text-foreground">
              Featured Contributors
            </h3>
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {CONTRIBUTORS.length} this month
            </Badge>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTRIBUTORS.map((c, i) => (
            <ContributorCard key={c.handle} contributor={c} index={i} />
          ))}
        </div>

        {/* Top Collections + Recent Activity */}
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Top Collections */}
          <div>
            <ScrollReveal delay={0.05}>
              <div className="mb-4 flex items-center gap-2">
                <FolderHeart className="size-4 text-primary" />
                <h3 className="font-display text-lg font-bold text-foreground">
                  Top Collections
                </h3>
              </div>
            </ScrollReveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {COLLECTIONS.map((c, i) => (
                <CollectionCard key={c.name} collection={c} index={i} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <ScrollReveal delay={0.05}>
              <div className="mb-4 flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                <h3 className="font-display text-lg font-bold text-foreground">
                  Recent Activity
                </h3>
                <span className="ml-1 inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </ScrollReveal>
            <ul className="flex flex-col gap-2">
              {ACTIVITY.map((item, i) => (
                <ActivityRow key={`${item.user}-${item.effect}-${i}`} item={item} index={i} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
