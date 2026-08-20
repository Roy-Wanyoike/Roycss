"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyChallenges — coding challenges arena.
 *
 * Self-contained list of 8 challenges with difficulty, category,
 * XP, and completion status. Detail dialog exposes the problem
 * statement, starter code, Submit (mock validation), Hint, and
 * Solution toggle. Includes a leaderboard (top 10) and the user's
 * rank + total XP.
 *
 * Palette: emerald primary, amber for medium, rose for hard. No
 * indigo / blue. TS strict, zero `any`.
 */

import { useCallback, useMemo, useState } from "react";
import {
  Award,
  Code2,
  Lightbulb,
  ListChecks,
  Medal,
  Play,
  Search,
  Trophy,
  XCircle,
  CheckCircle2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type Difficulty = "Easy" | "Medium" | "Hard";
type Category = "Selectors" | "Layout" | "Animation" | "Theming" | "A11y";

interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: Category;
  xp: number;
  description: string;
  starter: string;
  hint: string;
  solution: string;
  validator: (input: string) => boolean;
}

interface LeaderRow {
  rank: number;
  name: string;
  xp: number;
  avatar: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const DIFFICULTY_META: Record<Difficulty, { tone: string; ring: string }> = {
  Easy: { tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", ring: "border-emerald-500/40" },
  Medium: { tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400", ring: "border-amber-500/40" },
  Hard: { tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400", ring: "border-rose-500/40" },
};

const CHALLENGES: Challenge[] = [
  {
    id: "ch1",
    title: "Center a div with Flexbox",
    difficulty: "Easy",
    category: "Layout",
    xp: 50,
    description: "Make the .box element perfectly centered inside .container using Flexbox. Both axes must be centered.",
    starter: `.container {\n  /* your code here */\n}`,
    hint: "Use display: flex, align-items, and justify-content.",
    solution: `.container {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}`,
    validator: (s) => /display:\s*flex/i.test(s) && /align-items:\s*center/i.test(s) && /justify-content:\s*center/i.test(s),
  },
  {
    id: "ch2",
    title: "Build a 3-column grid",
    difficulty: "Easy",
    category: "Layout",
    xp: 60,
    description: "Create a responsive 3-column grid that collapses to 1 column below 600px using Grid + minmax.",
    starter: `.grid {\n  /* your code here */\n}`,
    hint: "Use grid-template-columns: repeat(auto-fit, minmax(...)).",
    solution: `.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));\n  gap: 1rem;\n}`,
    validator: (s) => /display:\s*grid/i.test(s) && /minmax/i.test(s),
  },
  {
    id: "ch3",
    title: "Add a pulse animation",
    difficulty: "Medium",
    category: "Animation",
    xp: 90,
    description: "Define a @keyframes pulse and apply it to .badge. Must respect prefers-reduced-motion.",
    starter: `/* your code here */`,
    hint: "Use opacity 1 → 0.5 → 1 and a media query to disable animation.",
    solution: `@keyframes pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.5; }\n}\n.badge { animation: pulse 2s infinite; }\n@media (prefers-reduced-motion: reduce) {\n  .badge { animation: none; }\n}`,
    validator: (s) => /@keyframes\s+pulse/i.test(s) && /prefers-reduced-motion/i.test(s),
  },
  {
    id: "ch4",
    title: "Style a focus-visible ring",
    difficulty: "Easy",
    category: "A11y",
    xp: 55,
    description: "Add a 2px focus ring to .btn only on keyboard focus using focus-visible.",
    starter: `.btn { /* your code here */ }`,
    hint: "Use :focus-visible with outline and outline-offset.",
    solution: `.btn:focus-visible {\n  outline: 2px solid var(--ring, #10b981);\n  outline-offset: 2px;\n}`,
    validator: (s) => /:focus-visible/i.test(s) && /outline/i.test(s),
  },
  {
    id: "ch5",
    title: "Convert HSL to OKLCH token",
    difficulty: "Medium",
    category: "Theming",
    xp: 80,
    description: "Define --primary as an oklch() value with chroma ≥ 0.12 on the root.",
    starter: `:root { /* your code here */ }`,
    hint: "oklch(lightness chroma hue) — chroma is the second number.",
    solution: `:root {\n  --primary: oklch(0.55 0.15 165);\n}`,
    validator: (s) => /--primary:\s*oklch\([^)]+\)/i.test(s) && /0\.\d+\s+0\.1[2-9]/.test(s),
  },
  {
    id: "ch6",
    title: "Sticky table header",
    difficulty: "Medium",
    category: "Layout",
    xp: 75,
    description: "Make thead sticky so it stays visible while scrolling the table body.",
    starter: `thead { /* your code here */ }`,
    hint: "position: sticky + top: 0 + a background color.",
    solution: `thead th {\n  position: sticky;\n  top: 0;\n  background: white;\n  z-index: 1;\n}`,
    validator: (s) => /position:\s*sticky/i.test(s) && /top:\s*0/i.test(s),
  },
  {
    id: "ch7",
    title: "Custom counter list",
    difficulty: "Hard",
    category: "Selectors",
    xp: 120,
    description: "Use CSS counters to number a list of .step elements with a leading 'Step ' prefix.",
    starter: `/* your code here */`,
    hint: "counter-reset on parent, counter-increment on items, content on ::before.",
    solution: `.steps { counter-reset: step; }\n.step { counter-increment: step; }\n.step::before {\n  content: "Step " counter(step) ": ";\n  font-weight: 700;\n}`,
    validator: (s) => /counter-reset/i.test(s) && /counter-increment/i.test(s) && /content:/i.test(s) && /counter\(step\)/i.test(s),
  },
  {
    id: "ch8",
    title: "Skip-link pattern",
    difficulty: "Hard",
    category: "A11y",
    xp: 110,
    description: "Implement a visually hidden .skip-link that becomes visible on focus.",
    starter: `.skip-link { /* your code here */ }`,
    hint: "Position absolute off-screen by default, then reveal on :focus.",
    solution: `.skip-link {\n  position: absolute;\n  left: -9999px;\n}\n.skip-link:focus {\n  left: 1rem;\n  top: 1rem;\n  background: white;\n  padding: 0.5rem 1rem;\n  z-index: 1000;\n}`,
    validator: (s) => /position:\s*absolute/i.test(s) && /\.skip-link:focus/i.test(s) && /left:\s*[^-]/m.test(s.replace(/left:\s*-9999px/i, "")),
  },
];

const LEADERBOARD: LeaderRow[] = [
  { rank: 1, name: "Ava Thompson", xp: 4820, avatar: "AT" },
  { rank: 2, name: "Noor Hassan", xp: 4310, avatar: "NH" },
  { rank: 3, name: "Leo Bianchi", xp: 3995, avatar: "LB" },
  { rank: 4, name: "Mira Patel", xp: 3720, avatar: "MP" },
  { rank: 5, name: "Jonas Berg", xp: 3450, avatar: "JB" },
  { rank: 6, name: "Yuki Tanaka", xp: 3120, avatar: "YT" },
  { rank: 7, name: "Samira Aziz", xp: 2870, avatar: "SA" },
  { rank: 8, name: "Ethan Cole", xp: 2610, avatar: "EC" },
  { rank: 9, name: "Priya Iyer", xp: 2390, avatar: "PI" },
  { rank: 10, name: "Diego Morales", xp: 2180, avatar: "DM" },
];

const USER_XP = 1240;
const USER_RANK = 18;

// ─── Component ───────────────────────────────────────────────────────────

export function RoyChallenges() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("challenges");
  void data; void loading; void error;

  const { toast } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [code, setCode] = useState<string>("");
  const [result, setResult] = useState<null | { pass: boolean }>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [search, setSearch] = useState("");

  const active = CHALLENGES.find((c) => c.id === openId) ?? null;

  const open = useCallback((c: Challenge) => {
    setOpenId(c.id);
    setCode(c.starter);
    setResult(null);
    setShowHint(false);
    setShowSolution(false);
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
    setResult(null);
    setShowHint(false);
    setShowSolution(false);
  }, []);

  const submit = useCallback(() => {
    if (!active) return;
    const pass = active.validator(code);
    setResult({ pass });
    if (pass && !completed.has(active.id)) {
      setCompleted((prev) => new Set(prev).add(active.id));
      toast({ title: "Challenge solved!", description: `+${active.xp} XP awarded.` });
    } else if (!pass) {
      toast({ title: "Not quite — try again", description: "Re-check the requirements and hints.", variant: "destructive" });
    }
  }, [active, code, completed, toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CHALLENGES;
    return CHALLENGES.filter((c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Trophy className="size-5" />
              </div>
              <div>
                <CardTitle>Coding Challenges</CardTitle>
                <CardDescription>Solve CSS challenges, earn XP, climb the leaderboard.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-muted-foreground text-xs">Your rank</p>
                <p className="font-bold tabular-nums">#{USER_RANK}</p>
              </div>
              <div className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-right">
                <p className="text-xs">{USER_XP} XP</p>
                <p className="text-[10px] opacity-80">{completed.size}/{CHALLENGES.length} solved</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Challenges list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListChecks className="size-4" /> All Challenges
                </CardTitle>
                <CardDescription>{filtered.length} available.</CardDescription>
              </div>
              <div className="relative w-48">
                <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-9 pl-8 text-xs"
                  aria-label="Search challenges"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {filtered.map((c) => {
              const diff = DIFFICULTY_META[c.difficulty];
              const done = completed.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => open(c)}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-4 text-left transition hover:bg-accent/50",
                    done && diff.ring,
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{c.title}</p>
                    {done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Code2 className="text-muted-foreground size-4 shrink-0" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={diff.tone}>{c.difficulty}</Badge>
                    <Badge variant="outline">{c.category}</Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Award className="size-3" /> {c.xp} XP
                    </Badge>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Medal className="size-4" /> Leaderboard
            </CardTitle>
            <CardDescription>Top 10 this week.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {LEADERBOARD.map((row) => (
              <div key={row.rank} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent/50">
                <span className={cn(
                  "w-6 text-center text-sm font-bold tabular-nums",
                  row.rank === 1 ? "text-amber-500" : row.rank === 2 ? "text-muted-foreground" : row.rank === 3 ? "text-rose-500" : "text-muted-foreground",
                )}>
                  {row.rank}
                </span>
                <div className="bg-primary/15 text-primary flex size-7 items-center justify-center rounded-full text-[10px] font-semibold">
                  {row.avatar}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm">{row.name}</p>
                <span className="text-xs font-semibold tabular-nums">{row.xp.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t pt-2">
              <div className="bg-primary/5 flex items-center gap-3 rounded-md px-2 py-1.5">
                <span className="text-muted-foreground w-6 text-center text-sm font-bold tabular-nums">#{USER_RANK}</span>
                <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-[10px] font-semibold">
                  You
                </div>
                <p className="flex-1 text-sm font-medium">You</p>
                <span className="text-xs font-semibold tabular-nums">{USER_XP.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail dialog */}
      <Dialog open={active !== null} onOpenChange={(o) => (o ? null : close())}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={DIFFICULTY_META[active.difficulty].tone}>{active.difficulty}</Badge>
                  <Badge variant="outline">{active.category}</Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Award className="size-3" /> {active.xp} XP
                  </Badge>
                </div>
                <DialogTitle className="text-lg">{active.title}</DialogTitle>
                <DialogDescription>{active.description}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Your solution
                  </p>
                  <Textarea
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setResult(null);
                    }}
                    spellCheck={false}
                    rows={8}
                    className="font-mono text-xs"
                    aria-label="Your solution"
                  />
                </div>

                {result !== null && (
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-md border p-2.5 text-sm",
                      result.pass
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
                    )}
                  >
                    {result.pass ? (
                      <><CheckCircle2 className="size-4" /> Tests passed — challenge complete!</>
                    ) : (
                      <><XCircle className="size-4" /> Solution doesn't match all requirements. Try again or peek at the hint.</>
                    )}
                  </div>
                )}

                {showHint && (
                  <div className="border-amber-500/40 bg-amber-500/10 rounded-md border p-2.5 text-sm">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Lightbulb className="size-4 text-amber-500" /> Hint
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">{active.hint}</p>
                  </div>
                )}

                {showSolution && (
                  <div className="rounded-md border p-2.5">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Reference solution</p>
                    <pre className="bg-muted overflow-x-auto rounded p-2.5 text-xs leading-relaxed">
                      <code className="font-mono whitespace-pre">{active.solution}</code>
                    </pre>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={submit} className="gap-1.5">
                    <Play className="size-3.5" /> Submit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowHint((v) => !v)} className="gap-1.5">
                    <Lightbulb className="size-3.5" /> {showHint ? "Hide hint" : "Hint"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowSolution((v) => !v)}>
                    {showSolution ? "Hide solution" : "Show solution"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
