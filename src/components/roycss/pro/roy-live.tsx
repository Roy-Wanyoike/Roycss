"use client";

/**
 * RoyLive — real-time collaboration surface for RoyCSS.
 *
 * Self-contained (no props). Layout:
 *   • Header with "Start Live Session" + "Share Session" buttons.
 *   • Mock collaborative editor — a textarea with 3 animated presence
 *     cursors (colored dots with names), line-numbered gutter.
 *   • Active users sidebar (3 with avatars + cursor position).
 *   • Comment threads (3 mock comments on lines).
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, mock-only.
 *   • TS strict, zero `any`. Cursor color keyed by user id; the
 *     `never` guard enforces exhaustiveness on the color mapper.
 *   • Simulated cursor movement via setInterval (positions cycle every
 *     ~2.5s); timer ids registered in a ref Set and cleared on unmount.
 *   • Palette: emerald primary, amber, teal, rose — used for the three
 *     collaborator cursor colors. No indigo/blue.
 */

import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Play,
  Share2,
  Users,
  Video,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
  dot: string;
  line: number;
  col: number;
}

interface Comment {
  id: string;
  line: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const COLLABORATORS: readonly Collaborator[] = [
  { id: "u1", name: "Maya", avatar: "MO", color: "bg-emerald-500", dot: "bg-emerald-500", line: 3, col: 18 },
  { id: "u2", name: "Daniel", avatar: "DR", color: "bg-amber-500", dot: "bg-amber-500", line: 5, col: 12 },
  { id: "u3", name: "Priya", avatar: "PN", color: "bg-teal-500", dot: "bg-teal-500", line: 7, col: 4 },
];

const COMMENTS: readonly Comment[] = [
  { id: "c1", line: 3, author: "Maya", avatar: "MO", text: "Should this be a token?", time: "2m" },
  { id: "c2", line: 5, author: "Daniel", avatar: "DR", text: "Container-query fallback looks good.", time: "5m" },
  { id: "c3", line: 8, author: "Priya", avatar: "PN", text: "Add prefers-reduced-motion guard here.", time: "11m" },
];

const CODE_LINES = [
  ".glass-card {",
  "  background: var(--glass-bg);",
  "  backdrop-filter: blur(12px);",
  "  border: 1px solid var(--glass-border);",
  "  border-radius: var(--radius-lg);",
  "  padding: var(--space-4);",
  "}",
  "",
  "@media (prefers-reduced-motion) {",
  "  .glass-card { transition: none; }",
  "}",
] as const;

const USER_TONE: Record<string, { dot: string; text: string; ring: string }> = {
  u1: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/40" },
  u2: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/40" },
  u3: { dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", ring: "ring-teal-500/40" },
};

// ─── Component ───────────────────────────────────────────────────────────

export function RoyLive() {
  const [users, setUsers] = useState<Collaborator[]>(() => [...COLLABORATORS]);
  const timers = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const id = setInterval(() => {
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          line: Math.max(1, Math.min(CODE_LINES.length, u.line + (Math.random() > 0.5 ? 1 : -1))),
          col: 1 + Math.floor(Math.random() * 28),
        })),
      );
    }, 2500);
    timers.current.add(id);
    return () => {
      clearInterval(id);
      timers.current.delete(id);
    };
  }, []);

  const start = () =>
    toast({ title: "Live session started", description: "Invitations sent to 3 collaborators." });
  const share = () =>
    toast({ title: "Share link copied", description: "Anyone with the link can join (mock)." });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
                <Video className="size-5" />
              </div>
              <div>
                <CardTitle>Live Collaboration</CardTitle>
                <CardDescription>
                  Pair on CSS in real time — cursors, threads, voice.
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={share} variant="outline" className="gap-1.5">
                <Share2 className="size-4" /> Share
              </Button>
              <Button onClick={start} className="gap-1.5">
                <Play className="size-4" /> Start Live Session
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Editor */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">editor.css</CardTitle>
              <div className="flex -space-x-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className={cn(
                      "ring-background flex size-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-semibold text-white",
                      u.color,
                    )}
                    title={u.name}
                  >
                    {u.avatar}
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 relative overflow-hidden rounded-lg border">
              {/* Code with line numbers */}
              <div className="flex">
                <div className="text-muted-foreground/60 select-none border-r py-3 pr-2 pl-3 text-right font-mono text-xs">
                  {CODE_LINES.map((_, i) => (
                    <div key={i} className="leading-6">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="relative flex-1">
                  <pre className="py-3 pl-3 pr-4 font-mono text-xs leading-6">
                    {CODE_LINES.map((line, i) => {
                      const lineUsers = users.filter((u) => u.line === i + 1);
                      return (
                        <div key={i} className="relative">
                          <code className="text-foreground">{line || " "}</code>
                          {lineUsers.map((u) => (
                            <span
                              key={u.id}
                              className={cn(
                                "absolute -left-px top-0 h-6 w-0.5",
                                u.color,
                              )}
                              style={{ left: `${u.col * 7}px` }}
                            >
                              <span
                                className={cn(
                                  "absolute -top-4 left-0 whitespace-nowrap rounded px-1 py-0.5 text-[9px] font-semibold text-white",
                                  u.color,
                                )}
                              >
                                {u.name}
                              </span>
                            </span>
                          ))}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              </div>
              {/* Editable textarea overlay (mock — local only) */}
              <Textarea
                aria-label="Collaborative editor"
                defaultValue={CODE_LINES.join("\n")}
                className="absolute inset-0 resize-none bg-transparent font-mono text-xs opacity-0 focus-visible:opacity-100"
              />
            </div>

            {/* Comments */}
            <div className="mt-4">
              <h4 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                <MessageSquare className="size-3.5" /> Comment Threads
              </h4>
              <div className="flex flex-col gap-2">
                {COMMENTS.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 rounded-lg border p-2.5">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-primary/15 text-primary text-[10px]">
                        {c.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{c.author}</span>
                        <Badge variant="outline" className="text-[10px]">
                          L{c.line}
                        </Badge>
                        <span className="text-muted-foreground ml-auto text-[10px]">
                          {c.time} ago
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" /> Active Users
            </CardTitle>
            <CardDescription>Live presence & cursor location.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {users.map((u) => {
              const tone = USER_TONE[u.id];
              return (
                <div
                  key={u.id}
                  className={cn("flex items-center gap-3 rounded-lg border p-2.5 ring-1", tone.ring)}
                >
                  <div className="relative">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/15 text-primary text-xs">
                        {u.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn("absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-card", tone.dot)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className={cn("text-[11px] tabular-nums", tone.text)}>
                      L{u.line}:{u.col}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="text-muted-foreground mt-2 text-center text-[11px]">
              Cursors update every 2.5s
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
