"use client";

/**
 * CommunityHub — a RoyCSS community hub showcase.
 *
 * Self-contained (no props). All mock data lives at module scope for
 * referential stability across renders. Six community modules:
 *
 *   1. Stats bar — "12,847 members · 432 effects · 1,204 collections ·
 *      89 contributors" — four iconified stat cells.
 *   2. Featured contributors — six cards with avatar initials, name,
 *      title (e.g. "CSS Architect"), effects count, collections count,
 *      a tier badge (Gold / Silver / Bronze), and a Follow toggle.
 *   3. Tabs — Activity / Leaderboard / Discussions (Radix Tabs).
 *   4. Recent activity feed — ten mock items with avatar, action text,
 *      timestamp ("2h ago"), and like + comment counts.
 *   5. Leaderboard — top ten contributors ranked by points, with rank
 *      number, avatar, name, points, and an up / down / steady trend.
 *   6. Discussions — five mock threads with title, author, reply count,
 *      last activity time, and tag chips.
 *
 * Theme: only the approved RoyCSS palette — emerald, teal, cyan, amber,
 * rose, violet — NO indigo / blue. Follow toggle uses local React state
 * (memoized per-card). TS strict, zero `any`.
 */

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  ArrowDown,
  ArrowUp,
  Crown,
  FolderHeart,
  MessageSquare,
  Minus,
  Sparkles,
  Star,
  ThumbsUp,
  Trophy,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Tier = "gold" | "silver" | "bronze";

type TrendKind = "up" | "down" | "steady";

type ActivityKind =
  | "collection"
  | "effect"
  | "certification"
  | "recipe"
  | "follow";

interface CommunityStat {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
}

interface Contributor {
  id: string;
  name: string;
  handle: string;
  initials: string;
  title: string;
  effectsCount: number;
  collectionsCount: number;
  tier: Tier;
  accent: AccentKey;
}

interface ActivityItem {
  id: string;
  user: string;
  initials: string;
  accent: AccentKey;
  kind: ActivityKind;
  /** The quote-wrapped subject of the action, e.g. "Neon UI Kit". */
  subject: string;
  /** Humanized offset, e.g. "2h ago". */
  timestamp: string;
  likes: number;
  comments: number;
}

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  initials: string;
  accent: AccentKey;
  points: number;
  trend: TrendKind;
}

interface Discussion {
  id: string;
  title: string;
  author: string;
  initials: string;
  accent: AccentKey;
  replies: number;
  lastActivity: string;
  tags: readonly string[];
}

type AccentKey = "emerald" | "amber" | "rose" | "violet" | "teal" | "cyan";

type TabValue = "activity" | "leaderboard" | "discussions";

// ═══════════════════════════════════════════════════════════════════════
// Accent palette — emerald / amber / rose / violet / teal / cyan only
// (NO indigo / blue)
// ═══════════════════════════════════════════════════════════════════════

interface AccentTokens {
  /** Avatar fallback background. */
  avatarBg: string;
  /** Avatar fallback text color. */
  avatarText: string;
  /** Small accent text for highlights. */
  text: string;
  /** Soft tinted chip background for tags. */
  chip: string;
}

const ACCENTS: Record<AccentKey, AccentTokens> = {
  emerald: {
    avatarBg: "bg-emerald-500/15",
    avatarText: "text-emerald-700 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-400",
    chip:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    avatarBg: "bg-amber-500/15",
    avatarText: "text-amber-700 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-400",
    chip:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  rose: {
    avatarBg: "bg-rose-500/15",
    avatarText: "text-rose-700 dark:text-rose-300",
    text: "text-rose-600 dark:text-rose-400",
    chip: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  violet: {
    avatarBg: "bg-violet-500/15",
    avatarText: "text-violet-700 dark:text-violet-300",
    text: "text-violet-600 dark:text-violet-400",
    chip:
      "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  teal: {
    avatarBg: "bg-teal-500/15",
    avatarText: "text-teal-700 dark:text-teal-300",
    text: "text-teal-600 dark:text-teal-400",
    chip: "border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  },
  cyan: {
    avatarBg: "bg-cyan-500/15",
    avatarText: "text-cyan-700 dark:text-cyan-300",
    text: "text-cyan-600 dark:text-cyan-400",
    chip: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Tier badges (Gold / Silver / Bronze) — uses amber / slate-warm / orange
// ═══════════════════════════════════════════════════════════════════════

interface TierTokens {
  badge: string;
  icon: LucideIcon;
  label: string;
}

const TIER_META: Record<Tier, TierTokens> = {
  gold: {
    badge:
      "border-amber-400/40 bg-amber-400/15 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
    icon: Crown,
    label: "Gold",
  },
  silver: {
    badge:
      "border-slate-400/40 bg-slate-400/15 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300",
    icon: Trophy,
    label: "Silver",
  },
  bronze: {
    badge:
      "border-orange-400/40 bg-orange-400/15 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300",
    icon: Star,
    label: "Bronze",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Activity iconography + verbs
// ═══════════════════════════════════════════════════════════════════════

const ACTIVITY_META: Record<
  ActivityKind,
  { icon: LucideIcon; verb: string; tone: string }
> = {
  collection: {
    icon: FolderHeart,
    verb: "created collection",
    tone: "text-rose-600 dark:text-rose-400",
  },
  effect: {
    icon: Sparkles,
    verb: "shared effect",
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  certification: {
    icon: Trophy,
    verb: "earned certification",
    tone: "text-amber-600 dark:text-amber-400",
  },
  recipe: {
    icon: Star,
    verb: "published recipe",
    tone: "text-violet-600 dark:text-violet-400",
  },
  follow: {
    icon: UserCheck,
    verb: "started following",
    tone: "text-teal-600 dark:text-teal-400",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// Mock data (module-level for referential stability)
// ═══════════════════════════════════════════════════════════════════════

const STATS: readonly CommunityStat[] = [
  {
    id: "members",
    label: "members",
    value: "12,847",
    icon: Users,
  },
  {
    id: "effects",
    label: "effects shared",
    value: "432",
    icon: Sparkles,
  },
  {
    id: "collections",
    label: "collections",
    value: "1,204",
    icon: FolderHeart,
  },
  {
    id: "contributors",
    label: "contributors",
    value: "89",
    icon: UserCheck,
  },
] as const;

const CONTRIBUTORS: readonly Contributor[] = [
  {
    id: "c-amara",
    name: "Amara Okafor",
    handle: "@amara.css",
    initials: "AO",
    title: "CSS Architect",
    effectsCount: 142,
    collectionsCount: 28,
    tier: "gold",
    accent: "emerald",
  },
  {
    id: "c-leila",
    name: "Leila Maina",
    handle: "@leila.m",
    initials: "LM",
    title: "Design Engineer",
    effectsCount: 98,
    collectionsCount: 22,
    tier: "silver",
    accent: "violet",
  },
  {
    id: "c-hassan",
    name: "Hassan Otieno",
    handle: "@hassano",
    initials: "HO",
    title: "Motion Specialist",
    effectsCount: 87,
    collectionsCount: 15,
    tier: "silver",
    accent: "amber",
  },
  {
    id: "c-priya",
    name: "Priya Achieng",
    handle: "@priya.dev",
    initials: "PA",
    title: "Frontend Lead",
    effectsCount: 76,
    collectionsCount: 19,
    tier: "bronze",
    accent: "teal",
  },
  {
    id: "c-brian",
    name: "Brian Kiprop",
    handle: "@brian.k",
    initials: "BK",
    title: "CSS Architect",
    effectsCount: 64,
    collectionsCount: 11,
    tier: "bronze",
    accent: "cyan",
  },
  {
    id: "c-nadia",
    name: "Nadia Wanyoike",
    handle: "@nadia.w",
    initials: "NW",
    title: "Accessibility Lead",
    effectsCount: 58,
    collectionsCount: 14,
    tier: "bronze",
    accent: "rose",
  },
] as const;

const ACTIVITY_FEED: readonly ActivityItem[] = [
  {
    id: "a-1",
    user: "amara.css",
    initials: "AO",
    accent: "emerald",
    kind: "collection",
    subject: "Neon UI Kit",
    timestamp: "2h ago",
    likes: 42,
    comments: 8,
  },
  {
    id: "a-2",
    user: "leila.m",
    initials: "LM",
    accent: "violet",
    kind: "effect",
    subject: "Glassmorphism Card",
    timestamp: "3h ago",
    likes: 67,
    comments: 12,
  },
  {
    id: "a-3",
    user: "hassano",
    initials: "HO",
    accent: "amber",
    kind: "certification",
    subject: "Expert",
    timestamp: "5h ago",
    likes: 128,
    comments: 24,
  },
  {
    id: "a-4",
    user: "priya.dev",
    initials: "PA",
    accent: "teal",
    kind: "recipe",
    subject: "Dashboard Layout",
    timestamp: "7h ago",
    likes: 34,
    comments: 6,
  },
  {
    id: "a-5",
    user: "brian.k",
    initials: "BK",
    accent: "cyan",
    kind: "effect",
    subject: "Aurora Gradient",
    timestamp: "9h ago",
    likes: 51,
    comments: 9,
  },
  {
    id: "a-6",
    user: "nadia.w",
    initials: "NW",
    accent: "rose",
    kind: "collection",
    subject: "A11y Patterns",
    timestamp: "12h ago",
    likes: 88,
    comments: 17,
  },
  {
    id: "a-7",
    user: "oscar.m",
    initials: "OM",
    accent: "amber",
    kind: "follow",
    subject: "Leila Maina",
    timestamp: "14h ago",
    likes: 12,
    comments: 2,
  },
  {
    id: "a-8",
    user: "vera.c",
    initials: "VC",
    accent: "violet",
    kind: "recipe",
    subject: "Pricing Matrix",
    timestamp: "1d ago",
    likes: 45,
    comments: 7,
  },
  {
    id: "a-9",
    user: "umar.n",
    initials: "UN",
    accent: "cyan",
    kind: "effect",
    subject: "Skeuomorphic Toggle",
    timestamp: "1d ago",
    likes: 73,
    comments: 14,
  },
  {
    id: "a-10",
    user: "tina.w",
    initials: "TW",
    accent: "emerald",
    kind: "certification",
    subject: "Professional",
    timestamp: "2d ago",
    likes: 96,
    comments: 21,
  },
] as const;

const LEADERBOARD: readonly LeaderboardEntry[] = [
  {
    id: "lb-1",
    rank: 1,
    name: "Amara Okafor",
    initials: "AO",
    accent: "emerald",
    points: 18_240,
    trend: "steady",
  },
  {
    id: "lb-2",
    rank: 2,
    name: "Leila Maina",
    initials: "LM",
    accent: "violet",
    points: 16_905,
    trend: "up",
  },
  {
    id: "lb-3",
    rank: 3,
    name: "Hassan Otieno",
    initials: "HO",
    accent: "amber",
    points: 14_470,
    trend: "up",
  },
  {
    id: "lb-4",
    rank: 4,
    name: "Priya Achieng",
    initials: "PA",
    accent: "teal",
    points: 12_885,
    trend: "down",
  },
  {
    id: "lb-5",
    rank: 5,
    name: "Brian Kiprop",
    initials: "BK",
    accent: "cyan",
    points: 11_520,
    trend: "steady",
  },
  {
    id: "lb-6",
    rank: 6,
    name: "Nadia Wanyoike",
    initials: "NW",
    accent: "rose",
    points: 10_640,
    trend: "up",
  },
  {
    id: "lb-7",
    rank: 7,
    name: "Oscar Mwangi",
    initials: "OM",
    accent: "amber",
    points: 9_318,
    trend: "down",
  },
  {
    id: "lb-8",
    rank: 8,
    name: "Vera Chebet",
    initials: "VC",
    accent: "violet",
    points: 8_702,
    trend: "up",
  },
  {
    id: "lb-9",
    rank: 9,
    name: "Umar Njoroge",
    initials: "UN",
    accent: "cyan",
    points: 7_955,
    trend: "steady",
  },
  {
    id: "lb-10",
    rank: 10,
    name: "Tina Wekesa",
    initials: "TW",
    accent: "emerald",
    points: 7_184,
    trend: "down",
  },
] as const;

const DISCUSSIONS: readonly Discussion[] = [
  {
    id: "d-1",
    title: "Best approach for OKLCH color migration?",
    author: "amara.css",
    initials: "AO",
    accent: "emerald",
    replies: 34,
    lastActivity: "12m ago",
    tags: ["colors", "oklch", "migration"],
  },
  {
    id: "d-2",
    title: "View Transitions API — production experiences?",
    author: "hassano",
    initials: "HO",
    accent: "amber",
    replies: 28,
    lastActivity: "45m ago",
    tags: ["view-transitions", "animation"],
  },
  {
    id: "d-3",
    title: "Container queries vs media queries in 2025",
    author: "leila.m",
    initials: "LM",
    accent: "violet",
    replies: 51,
    lastActivity: "1h ago",
    tags: ["container-queries", "responsive"],
  },
  {
    id: "d-4",
    title: "Accessible focus rings that don't look ugly",
    author: "nadia.w",
    initials: "NW",
    accent: "rose",
    replies: 19,
    lastActivity: "3h ago",
    tags: ["a11y", "focus", "ux"],
  },
  {
    id: "d-5",
    title: "Shipping zero-JS islands with Next.js 16",
    author: "brian.k",
    initials: "BK",
    accent: "cyan",
    replies: 42,
    lastActivity: "5h ago",
    tags: ["nextjs", "performance", "islands"],
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** 18240 → "18,240". */
function formatPoints(value: number): string {
  return value.toLocaleString("en-US");
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

interface StatCellProps {
  stat: CommunityStat;
}

function StatCell({ stat }: StatCellProps): React.JSX.Element {
  const Icon = stat.icon;
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-none tabular-nums text-foreground">
          {stat.value}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {stat.label}
        </p>
      </div>
    </div>
  );
}

interface StatsBarProps {
  stats: readonly CommunityStat[];
}

function StatsBar({ stats }: StatsBarProps): React.JSX.Element {
  const cells = useMemo(
    () => stats.map((s) => <StatCell key={s.id} stat={s} />),
    [stats],
  );
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cells}</div>
  );
}

interface AvatarBadgeProps {
  initials: string;
  accent: AccentKey;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function AvatarBadge({
  initials,
  accent,
  size = "md",
  className,
}: AvatarBadgeProps): React.JSX.Element {
  const tokens = ACCENTS[accent];
  const sizeClass =
    size === "sm"
      ? "size-8 text-xs"
      : size === "lg"
        ? "size-12 text-base"
        : "size-10 text-sm";
  return (
    <Avatar className={cn(sizeClass, className)}>
      <AvatarFallback
        className={cn(
          "font-semibold tracking-tight",
          tokens.avatarBg,
          tokens.avatarText,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

interface ContributorCardProps {
  contributor: Contributor;
  isFollowing: boolean;
  onToggleFollow: (id: string) => void;
}

function ContributorCard({
  contributor,
  isFollowing,
  onToggleFollow,
}: ContributorCardProps): React.JSX.Element {
  const tier = TIER_META[contributor.tier];
  const TierIcon = tier.icon;
  const handleClick = useCallback(() => {
    onToggleFollow(contributor.id);
  }, [onToggleFollow, contributor.id]);

  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <AvatarBadge
            initials={contributor.initials}
            accent={contributor.accent}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold leading-tight text-foreground">
                  {contributor.name}
                </h3>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {contributor.handle}
                </p>
              </div>
              <Badge variant="outline" className={cn("gap-1 shrink-0", tier.badge)}>
                <TierIcon className="size-3" aria-hidden />
                {tier.label}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-foreground/80">
              {contributor.title}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 text-center">
          <div>
            <p className="text-base font-semibold tabular-nums text-foreground">
              {contributor.effectsCount}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              effects
            </p>
          </div>
          <div className="border-l">
            <p className="text-base font-semibold tabular-nums text-foreground">
              {contributor.collectionsCount}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              collections
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant={isFollowing ? "secondary" : "default"}
          size="sm"
          className="mt-4 w-full gap-1.5"
          onClick={handleClick}
          aria-pressed={isFollowing}
        >
          <UserCheck className="size-3.5" aria-hidden />
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface FeaturedContributorsProps {
  contributors: readonly Contributor[];
}

function FeaturedContributors({
  contributors,
}: FeaturedContributorsProps): React.JSX.Element {
  const [following, setFollowing] = useState<ReadonlySet<string>>(
    () => new Set<string>(["c-amara"]),
  );

  const handleToggleFollow = useCallback((id: string) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const cards = useMemo(
    () =>
      contributors.map((c) => (
        <ContributorCard
          key={c.id}
          contributor={c}
          isFollowing={following.has(c.id)}
          onToggleFollow={handleToggleFollow}
        />
      )),
    [contributors, following, handleToggleFollow],
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards}
    </div>
  );
}

interface ActivityRowProps {
  item: ActivityItem;
}

function ActivityRow({ item }: ActivityRowProps): React.JSX.Element {
  const meta = ACTIVITY_META[item.kind];
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/30">
      <AvatarBadge initials={item.initials} accent={item.accent} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-foreground">
          <span className="inline-flex items-center gap-1 font-medium">
            <Icon
              className={cn("size-3.5 shrink-0", meta.tone)}
              aria-hidden
            />
            {item.user}
          </span>{" "}
          <span className="text-muted-foreground">{meta.verb}</span>{" "}
          <span className="font-medium">&ldquo;{item.subject}&rdquo;</span>
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{item.timestamp}</span>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="size-3" aria-hidden />
            <span className="tabular-nums">{item.likes}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" aria-hidden />
            <span className="tabular-nums">{item.comments}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  items: readonly ActivityItem[];
}

function ActivityFeed({ items }: ActivityFeedProps): React.JSX.Element {
  const rows = useMemo(
    () => items.map((i) => <ActivityRow key={i.id} item={i} />),
    [items],
  );
  return <div className="space-y-2">{rows}</div>;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
}

function LeaderboardRow({ entry }: LeaderboardRowProps): React.JSX.Element {
  const isTopThree = entry.rank <= 3;
  const trendIcon =
    entry.trend === "up" ? ArrowUp : entry.trend === "down" ? ArrowDown : Minus;
  const TrendIcon = trendIcon;
  const trendClass =
    entry.trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : entry.trend === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-muted-foreground";
  const rankClass = isTopThree
    ? entry.rank === 1
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : entry.rank === 2
        ? "bg-slate-500/15 text-slate-600 dark:text-slate-300"
        : "bg-orange-500/15 text-orange-700 dark:text-orange-300"
    : "bg-muted text-muted-foreground";

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5 transition-colors hover:bg-accent/30">
      <span
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
          rankClass,
        )}
        aria-label={`Rank ${entry.rank}`}
      >
        {entry.rank}
      </span>
      <AvatarBadge initials={entry.initials} accent={entry.accent} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {entry.name}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatPoints(entry.points)} pts
        </p>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-xs font-medium",
          trendClass,
        )}
        title={`Trend: ${entry.trend}`}
      >
        <TrendIcon className="size-3.5" aria-hidden />
        <span className="sr-only">{entry.trend}</span>
      </span>
    </div>
  );
}

interface LeaderboardProps {
  entries: readonly LeaderboardEntry[];
}

function Leaderboard({ entries }: LeaderboardProps): React.JSX.Element {
  const rows = useMemo(
    () => entries.map((e) => <LeaderboardRow key={e.id} entry={e} />),
    [entries],
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Rank · Contributor</span>
        <span>Points · Trend</span>
      </div>
      {rows}
    </div>
  );
}

interface DiscussionRowProps {
  discussion: Discussion;
}

function DiscussionRow({ discussion }: DiscussionRowProps): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card px-4 py-3.5 transition-colors hover:bg-accent/30">
      <div className="flex items-start gap-3">
        <AvatarBadge
          initials={discussion.initials}
          accent={discussion.accent}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium leading-snug text-foreground">
            {discussion.title}
          </h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {discussion.author}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" aria-hidden />
              <span className="tabular-nums">{discussion.replies}</span> replies
            </span>
            <span>· last activity {discussion.lastActivity}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {discussion.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn("px-2 py-0 text-[11px]", ACCENTS[discussion.accent].chip)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DiscussionsProps {
  discussions: readonly Discussion[];
}

function Discussions({ discussions }: DiscussionsProps): React.JSX.Element {
  const rows = useMemo(
    () => discussions.map((d) => <DiscussionRow key={d.id} discussion={d} />),
    [discussions],
  );
  return <div className="space-y-2">{rows}</div>;
}

// ═══════════════════════════════════════════════════════════════════════
// CommunityHub — main exported component
// ═══════════════════════════════════════════════════════════════════════

export function CommunityHub(): React.JSX.Element {
  const [tab, setTab] = useState<TabValue>("activity");

  const handleTabChange = useCallback((value: string) => {
    setTab(value as TabValue);
  }, []);

  return (
    <Card className="gap-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Users className="size-5 text-primary" aria-hidden />
          Community Hub
        </CardTitle>
        <CardDescription>
          The RoyCSS community — members, contributors, activity, and
          discussions.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary" className="gap-1">
            <ActivityIcon className="size-3" aria-hidden />
            live
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        {/* ─── Stats bar ─────────────────────────────────────────── */}
        <section aria-label="Community stats">
          <StatsBar stats={STATS} />
        </section>

        {/* ─── Featured contributors ─────────────────────────────── */}
        <section aria-labelledby="contributors-heading">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2
              id="contributors-heading"
              className="flex items-center gap-2 text-base font-semibold text-foreground"
            >
              <Crown className="size-4 text-amber-500" aria-hidden />
              Featured contributors
            </h2>
            <Badge variant="outline" className="tabular-nums">
              {CONTRIBUTORS.length} featured
            </Badge>
          </div>
          <FeaturedContributors contributors={CONTRIBUTORS} />
        </section>

        {/* ─── Tabs: Activity / Leaderboard / Discussions ────────── */}
        <section aria-labelledby="hub-tabs-heading">
          <h2
            id="hub-tabs-heading"
            className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground"
          >
            <Sparkles className="size-4 text-primary" aria-hidden />
            Community pulse
          </h2>
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="h-9">
              <TabsTrigger value="activity" className="gap-1.5">
                <ActivityIcon className="size-3.5" aria-hidden />
                Activity
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-1.5">
                <Trophy className="size-3.5" aria-hidden />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="discussions" className="gap-1.5">
                <MessageSquare className="size-3.5" aria-hidden />
                Discussions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4">
              <ActivityFeed items={ACTIVITY_FEED} />
            </TabsContent>
            <TabsContent value="leaderboard" className="mt-4">
              <Leaderboard entries={LEADERBOARD} />
            </TabsContent>
            <TabsContent value="discussions" className="mt-4">
              <Discussions discussions={DISCUSSIONS} />
            </TabsContent>
          </Tabs>
        </section>
      </CardContent>
    </Card>
  );
}
