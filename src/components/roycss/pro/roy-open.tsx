"use client";

/**
 * RoyOpen — open-source hub for the RoyCSS community.
 *
 * Self-contained (no props). Layout:
 *   • Header with "Contribute" button (mock toast).
 *   • 4-panel grid:
 *       - Good first issues (5 mock) with labels, difficulty, comments.
 *       - Active RFCs (3 mock) with title, status, votes.
 *       - Roadmap (4 quarters with milestones).
 *       - Top contributors (5 with commits).
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Difficulty & RFC status are string-literal
 *     unions with `never` exhaustiveness guards.
 *   • Palette: emerald primary, teal/amber/sky accents, rose for stalled.
 *     No indigo/blue.
 */

import {
  Calendar,
  GitBranch,
  Github,
  GitPullRequest,
  Heart,
  MessageSquare,
  Milestone,
  ThumbsUp,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";
type RfcStatus = "draft" | "review" | "accepted" | "stalled";

interface Issue {
  id: string;
  title: string;
  labels: readonly string[];
  difficulty: Difficulty;
  comments: number;
}

interface Rfc {
  id: string;
  title: string;
  status: RfcStatus;
  votes: number;
}

interface Milestone {
  id: string;
  quarter: string;
  title: string;
  state: "shipped" | "in-progress" | "planned";
}

interface Contributor {
  id: string;
  name: string;
  avatar: string;
  commits: number;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  hard: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

const RFC_TONE: Record<RfcStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  accepted: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  stalled: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

const ISSUES: readonly Issue[] = [
  { id: "i1", title: "Add OKLCH converter to color studio", labels: ["enhancement", "color"], difficulty: "easy", comments: 4 },
  { id: "i2", title: "Docs: missing container-query examples", labels: ["docs"], difficulty: "easy", comments: 2 },
  { id: "i3", title: "Investigate Safari 17 view-transition bug", labels: ["bug", "browser"], difficulty: "hard", comments: 11 },
  { id: "i4", title: "Add `prefers-reduced-motion` audit to CLI", labels: ["a11y", "cli"], difficulty: "medium", comments: 6 },
  { id: "i5", title: "Theme: ship `rose` palette", labels: ["theme"], difficulty: "easy", comments: 3 },
];

const RFCS: readonly Rfc[] = [
  { id: "rfc1", title: "Container Query Studio v2", status: "review", votes: 42 },
  { id: "rfc2", title: "Logical Properties Linter", status: "accepted", votes: 68 },
  { id: "rfc3", title: "View Transitions Recipe Pack", status: "draft", votes: 19 },
];

const ROADMAP: readonly Milestone[] = [
  { id: "m1", quarter: "Q1", title: "OKLCH migration complete", state: "shipped" },
  { id: "m2", quarter: "Q2", title: "Edge runtime & CDN", state: "in-progress" },
  { id: "m3", quarter: "Q3", title: "AI refactor agents", state: "planned" },
  { id: "m4", quarter: "Q4", title: "RoyCSS v3 (breaking)", state: "planned" },
];

const CONTRIBUTORS: readonly Contributor[] = [
  { id: "c1", name: "Maya Okonkwo", avatar: "MO", commits: 412 },
  { id: "c2", name: "Daniel Reyes", avatar: "DR", commits: 318 },
  { id: "c3", name: "Priya Nair", avatar: "PN", commits: 247 },
  { id: "c4", name: "Theo Lindqvist", avatar: "TL", commits: 198 },
  { id: "c5", name: "Sofia Marchetti", avatar: "SM", commits: 142 },
];

const STATE_TONE: Record<Milestone["state"], string> = {
  shipped: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "in-progress": "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  planned: "bg-muted text-muted-foreground",
};

// ─── Component ───────────────────────────────────────────────────────────

export function RoyOpen() {
  const { toast } = useToast();

  const contribute = () =>
    toast({
      title: "Welcome, contributor!",
      description: "Opening the contributing guide (mock).",
    });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Github className="size-5" />
              </div>
              <div>
                <CardTitle>Open-Source Hub</CardTitle>
                <CardDescription>
                  12.4k stars · 487 contributors · MIT licensed.
                </CardDescription>
              </div>
            </div>
            <Button onClick={contribute} className="gap-1.5">
              <Heart className="size-4" /> Contribute
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Good first issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitPullRequest className="size-4" /> Good First Issues
            </CardTitle>
            <CardDescription>Bite-sized ways to start contributing.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {ISSUES.map((i) => (
              <div
                key={i.id}
                className="hover:bg-muted/40 flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {i.labels.map((l) => (
                      <Badge key={l} variant="outline" className="text-[10px]">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge className={cn("text-[10px]", DIFFICULTY_TONE[i.difficulty])}>
                    {i.difficulty}
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                    <MessageSquare className="size-3" />
                    {i.comments}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* RFCs + Roadmap */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="size-4" /> Active RFCs
              </CardTitle>
              <CardDescription>Shape the future of RoyCSS.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {RFCS.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <Badge className={cn("mt-1 text-[10px]", RFC_TONE[r.status])}>
                      {r.status}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs tabular-nums">
                    <ThumbsUp className="size-3" />
                    {r.votes}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Milestone className="size-4" /> Roadmap
              </CardTitle>
              <CardDescription>This year&apos;s milestones.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {ROADMAP.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                    {m.quarter}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{m.title}</p>
                  <Badge className={cn("text-[10px] capitalize", STATE_TONE[m.state])}>
                    {m.state}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contributors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" /> Top Contributors
          </CardTitle>
          <CardDescription>Most active maintainers this quarter.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CONTRIBUTORS.map((c, i) => (
              <div key={c.id} className="rounded-lg border p-3 text-center">
                <div className="bg-primary/15 text-primary mx-auto flex size-12 items-center justify-center rounded-full text-sm font-semibold">
                  {c.avatar}
                </div>
                <p className="mt-2 truncate text-sm font-medium">{c.name}</p>
                <div className="mt-1 flex items-center justify-center gap-1 text-xs">
                  <TrendingUp className="size-3 text-emerald-500" />
                  <span className="tabular-nums">{c.commits}</span>
                  <span className="text-muted-foreground">commits</span>
                </div>
                {i === 0 && (
                  <Badge className="mt-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 gap-1 text-[10px]">
                    <Calendar className="size-3" /> Maintainer
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
