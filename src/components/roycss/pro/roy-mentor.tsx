"use client";

/**
 * RoyMentor — AI tutor with a learning focus.
 *
 * Self-contained chat interface. Skill-level selector, topic chips,
 * starter questions, mock AI responses with explanation + code
 * example + "Try it" challenge, and a progress tracker showing
 * completed topics + XP points.
 *
 * Palette: emerald primary. No indigo / blue. TS strict, zero
 * `any`. Responses are precomputed per topic to stay self-contained
 * (no API calls).
 */

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Bot,
  Brain,
  Code2,
  GraduationCap,
  Lightbulb,
  Send,
  Sparkles,
  Target,
  Trophy,
  User,
  Zap,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────

type Level = "Beginner" | "Intermediate" | "Advanced";
type Topic =
  | "CSS Basics"
  | "Layout"
  | "Animations"
  | "Accessibility"
  | "RoyCSS CLI"
  | "Theming";

interface Message {
  id: string;
  role: "user" | "mentor";
  text: string;
  code?: string;
  challenge?: string;
}

// ─── Mock knowledge base ─────────────────────────────────────────────────

const TOPICS: { id: Topic; icon: typeof Code2 }[] = [
  { id: "CSS Basics", icon: Code2 },
  { id: "Layout", icon: Sparkles },
  { id: "Animations", icon: Zap },
  { id: "Accessibility", icon: Brain },
  { id: "RoyCSS CLI", icon: Target },
  { id: "Theming", icon: Trophy },
];

const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];

const STARTERS = [
  "What is the box model?",
  "How do I center a div?",
  "Explain Flexbox vs Grid",
  "How do CSS custom properties work?",
];

interface Lesson {
  text: string;
  code?: string;
  challenge: string;
  xp: number;
}

const LESSONS: Record<Topic, Lesson> = {
  "CSS Basics": {
    text: "Every element is a box with four layers: content, padding, border, margin. The `box-sizing` property decides whether width includes padding+border. Set `box-sizing: border-box` on every element so dimensions behave intuitively.",
    code: `*, *::before, *::after {\n  box-sizing: border-box;\n}`,
    challenge: "Add `box-sizing: border-box` to a card and verify its width stays at 240px when you add 16px padding.",
    xp: 50,
  },
  Layout: {
    text: "Flexbox is one-dimensional (row or column). Grid is two-dimensional. Use Flexbox for nav bars, button rows, and toolbars; reach for Grid when you need rows AND columns to align.",
    code: `.toolbar {\n  display: flex;\n  gap: 0.5rem;\n  align-items: center;\n}\n.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1rem;\n}`,
    challenge: "Convert a 3-card row from inline-block to Flexbox and add 1rem gap.",
    xp: 75,
  },
  Animations: {
    text: "Animations interpolate properties over time using `@keyframes`. Always respect `prefers-reduced-motion` so users with vestibular disorders aren't harmed by motion.",
    code: `@keyframes pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.5; }\n}\n.badge { animation: pulse 2s ease-in-out infinite; }\n@media (prefers-reduced-motion: reduce) {\n  .badge { animation: none; }\n}`,
    challenge: "Add a 1.5s spin animation to a loader and disable it under reduced-motion.",
    xp: 100,
  },
  Accessibility: {
    text: "Color contrast must meet 4.5:1 for normal text (WCAG AA). Use semantic HTML (`<button>`, not `<div onclick>`). Every interactive element needs a visible focus ring and a reachable tab order.",
    code: `:focus-visible {\n  outline: 2px solid var(--ring);\n  outline-offset: 2px;\n}`,
    challenge: "Audit one screen — find any `<div onclick>` and replace it with a real `<button>`.",
    xp: 90,
  },
  "RoyCSS CLI": {
    text: "The RoyCSS CLI scaffolds tokens, effects, and recipes. Run `npx roycss init` to create a `roycss.config.ts`. Use `roycss add effect <name>` to pull a curated effect into your project.",
    code: `npx roycss init\nnpx roycss add effect glass-card\nnpx roycss add recipe pricing-table`,
    challenge: "Initialize a RoyCSS project and add the `glass-card` effect.",
    xp: 60,
  },
  Theming: {
    text: "RoyCSS themes use OKLCH tokens for perceptual uniformity. Define `--primary` once and let scales derive from it. Toggle a `[data-theme]` attribute on `<html>` to switch themes at runtime.",
    code: `:root { --primary: oklch(0.55 0.15 165); }\n[data-theme=\"midnight\"] {\n  --primary: oklch(0.65 0.18 220);\n}`,
    challenge: "Add a `data-theme=\"midnight\"` variant and wire a toggle button.",
    xp: 85,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

function uid(): string {
  return `m-${Math.random().toString(36).slice(2, 8)}`;
}

function pickTopic(text: string): Topic {
  const lower = text.toLowerCase();
  if (lower.includes("box") || lower.includes("model")) return "CSS Basics";
  if (lower.includes("flex") || lower.includes("grid") || lower.includes("center")) return "Layout";
  if (lower.includes("animat") || lower.includes("keyframe")) return "Animations";
  if (lower.includes("a11y") || lower.includes("access") || lower.includes("contrast")) return "Accessibility";
  if (lower.includes("cli") || lower.includes("npx")) return "RoyCSS CLI";
  if (lower.includes("theme") || lower.includes("oklch") || lower.includes("token")) return "Theming";
  return "CSS Basics";
}

// ─── Component ───────────────────────────────────────────────────────────

export function RoyMentor() {
  const [level, setLevel] = useState<Level>("Beginner");
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "mentor",
      text: "Hi! I'm RoyMentor. Pick a topic or ask me anything about CSS, layout, or RoyCSS. Each lesson ends with a hands-on challenge.",
    },
  ]);
  const [input, setInput] = useState("");
  const [completed, setCompleted] = useState<Set<Topic>>(new Set());
  const [xp, setXp] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const respond = useCallback((prompt: string) => {
    const topic = pickTopic(prompt);
    setActiveTopic(topic);
    const lesson = LESSONS[topic];
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text: prompt },
      {
        id: uid(),
        role: "mentor",
        text: lesson.text,
        code: lesson.code,
        challenge: lesson.challenge,
      },
    ]);
  }, []);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      respond(trimmed);
      setInput("");
    },
    [respond],
  );

  const pickStarter = useCallback(
    (q: string) => {
      respond(q);
    },
    [respond],
  );

  const completeChallenge = useCallback(() => {
    if (!activeTopic) return;
    setCompleted((prev) => {
      if (prev.has(activeTopic)) return prev;
      const next = new Set(prev);
      next.add(activeTopic);
      return next;
    });
    setXp((prev) => prev + LESSONS[activeTopic].xp);
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "mentor",
        text: `Challenge complete. +${LESSONS[activeTopic].xp} XP awarded. Pick another topic to keep going!`,
      },
    ]);
  }, [activeTopic]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const levelLabel = useMemo(() => {
    if (xp >= 400) return "CSS Architect";
    if (xp >= 250) return "Practitioner";
    if (xp >= 100) return "Apprentice";
    return "Newcomer";
  }, [xp]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Sidebar: skill + topics + progress */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4" /> Learning Path
          </CardTitle>
          <CardDescription>Pick a level and a topic.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div>
            <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wide">Skill level</p>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    level === l
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent/50",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wide">Topics</p>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((t) => {
                const Icon = t.icon;
                const done = completed.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickStarter(`Teach me ${t.id}`)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                      activeTopic === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent/50",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {t.id}
                    {done && <span className="text-emerald-500">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Progress</p>
              <Badge className="bg-primary/15 text-primary">{levelLabel}</Badge>
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {xp} <span className="text-muted-foreground text-sm font-normal">XP</span>
            </p>
            <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${Math.min(100, (xp / 500) * 100)}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              {completed.size} / {TOPICS.length} topics completed · {level}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chat */}
      <Card className="flex h-[640px] max-h-[80vh] flex-col gap-0 py-0 lg:col-span-2">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full">
            <Bot className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">RoyMentor</p>
            <p className="text-muted-foreground truncate text-xs">
              CSS tutor · {level} mode
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="size-3 text-amber-500" /> {xp} XP
          </Badge>
        </div>

        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex w-full gap-2",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {m.role === "mentor" && (
                <div className="bg-primary/15 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
                  <Bot className="size-4" />
                </div>
              )}
              <div
                className={cn(
                  "flex max-w-[85%] flex-col gap-2 rounded-2xl px-3.5 py-2.5 text-sm shadow-xs",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                {m.code && (
                  <pre className="bg-background/80 overflow-x-auto rounded-md border p-2.5 text-xs leading-relaxed">
                    <code className="font-mono whitespace-pre">{m.code}</code>
                  </pre>
                )}
                {m.challenge && (
                  <div className="flex flex-col gap-2 rounded-md border border-dashed p-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <Lightbulb className="size-3.5 text-amber-500" /> Try it
                    </p>
                    <p className="text-xs">{m.challenge}</p>
                    <Button size="sm" variant="outline" onClick={completeChallenge} className="self-start gap-1.5">
                      <Trophy className="size-3.5" /> Mark complete
                    </Button>
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="bg-secondary text-secondary-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Starter questions */}
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {STARTERS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => pickStarter(q)}
              className="hover:border-primary hover:text-primary rounded-full border bg-transparent px-2.5 py-1 text-[11px] font-medium transition"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask RoyMentor a CSS question…"
              rows={1}
              className="min-h-11 max-h-32 flex-1 resize-none"
              aria-label="Message RoyMentor"
            />
            <Button
              type="button"
              size="icon"
              onClick={() => send(input)}
              disabled={!input.trim()}
              aria-label="Send message"
              className="size-11 shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
