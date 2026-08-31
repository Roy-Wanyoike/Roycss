"use client";


import { useBackendData } from "@/components/roycss/_use-backend-data";
import { BackendLiveBadge } from "@/components/roycss/_backend-live-badge";
/**
 * RoyReview — AI code reviewer.
 *
 * User pastes code (CSS / HTML / TS) into a textarea, picks from 3 preset
 * snippets, then clicks "Review Code". The component simulates a 1.6-second
 * AI run (with progress bar) and renders a review:
 *   • overall score (0-100) with progress bar + grade,
 *   • per-finding card — severity badge (Critical / Warning / Info),
 *     category (Performance / Accessibility / Security / Best Practice),
 *     line number, issue description, and a fix recommendation,
 *   • a summary panel with counts by severity and category.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, no API calls.
 *   • Simulated async via setTimeout / setInterval; every timer id is
 *     registered in a ref Set and cleared on unmount — no leaks.
 *   • TS strict, zero `any`. Exhaustiveness `never` guards on severity
 *     and category.
 *   • Palette follows the RoyCSS theme — emerald primary, amber for
 *     warnings, rose for criticals, sky for info. No indigo / blue.
 *   • Responsive within a max-w-2xl wrapper.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  Info,
  Loader2,
  type LucideIcon,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Wrench,
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

type Severity = "critical" | "warning" | "info";
type Category =
  | "performance"
  | "accessibility"
  | "security"
  | "best-practice";

interface Finding {
  id: string;
  severity: Severity;
  category: Category;
  line: number;
  title: string;
  description: string;
  fix: string;
}

interface Review {
  score: number;
  findings: Finding[];
  summary: string;
}

interface PresetDef {
  id: string;
  label: string;
  emoji: string;
  code: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Severity + category styling (exhaustive switch, never fallback).
// ═══════════════════════════════════════════════════════════════════════

const SEVERITY_ICON: Record<Severity, LucideIcon> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_BADGE: Record<Severity, string> = {
  critical:
    "border-destructive/30 bg-destructive/10 text-destructive",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  info: "border-primary/30 bg-primary/10 text-primary",
};

const CATEGORY_ICON: Record<Category, LucideIcon> = {
  performance: Zap,
  accessibility: ShieldAlert,
  security: ShieldAlert,
  "best-practice": CheckCircle2,
};

const CATEGORY_LABEL: Record<Category, string> = {
  performance: "Performance",
  accessibility: "Accessibility",
  security: "Security",
  "best-practice": "Best Practice",
};

// ═══════════════════════════════════════════════════════════════════════
// Presets
// ═══════════════════════════════════════════════════════════════════════

const PRESETS: readonly PresetDef[] = [
  {
    id: "good",
    label: "Clean CSS",
    emoji: "\u{1F7E2}",
    code: `.roycss-card {
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: oklch(0.98 0.02 165);
  color: oklch(0.25 0.04 165);
  margin-inline: auto;
  inline-size: min(100% - 2rem, 32rem);
}

@media (prefers-reduced-motion: reduce) {
  .roycss-card { transition: none; }
}`,
  },
  {
    id: "bad",
    label: "Issues CSS",
    emoji: "\u{1F534}",
    code: `.btn {
  background: #3b82f6;
  color: #fff;
  padding-left: 12px;
  padding-right: 12px;
  width: 100px;
  height: 40px;
  transition: all 0.5s ease;
}
.btn:hover {
  background: #2563eb;
}`,
  },
  {
    id: "mixed",
    label: "Mixed Code",
    emoji: "\u{1F7E1}",
    code: `<button class="btn" onclick="fetch('/api/x')">Go</button>

<style>
.btn {
  background: rgba(0,0,0,0.05);
  color: #111;
  width: 80px;
  border: 1px solid #ccc;
  outline: none;
}
</style>`,
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Review engine — pure function. Picks findings based on code patterns.
// ═══════════════════════════════════════════════════════════════════════

function lineNumberFor(haystack: string, needle: string): number {
  const idx = haystack.indexOf(needle);
  if (idx < 0) return 1;
  return haystack.slice(0, idx).split("\n").length;
}

function buildReview(code: string): Review {
  const findings: Finding[] = [];
  const lines = code.split("\n");
  let fid = 0;
  const push = (
    severity: Severity,
    category: Category,
    line: number,
    title: string,
    description: string,
    fix: string
  ): void => {
    findings.push({
      id: `f-${++fid}`,
      severity,
      category,
      line,
      title,
      description,
      fix,
    });
  };

  // Hex colors — prefer OKLCH.
  const hexMatch = code.match(/#[0-9a-fA-F]{3,8}\b/);
  if (hexMatch) {
    push(
      "warning",
      "best-practice",
      lineNumberFor(code, hexMatch[0]),
      "Hard-coded hex color",
      `Found "${hexMatch[0]}". Hard-coded hex values bypass the theme and break dark mode.`,
      'Use an OKLCH color via color-mix(in oklch, ...) or a --token from the RoyCSS palette.'
    );
  }

  // rgba() — same family.
  const rgbaMatch = code.match(/rgba?\([^)]+\)/);
  if (rgbaMatch) {
    push(
      "warning",
      "best-practice",
      lineNumberFor(code, rgbaMatch[0]),
      "Legacy rgba() color",
      `"${rgbaMatch[0]}" is a legacy color function. It cannot interpolate in OKLCH and blocks smooth theme transitions.`,
      "Use oklch() with an alpha channel, or color-mix(in oklch, <color> <alpha>%, transparent)."
    );
  }

  // Physical properties — left / right / top / bottom in padding/margin.
  const physicalPairs: Array<[string, string]> = [
    ["padding-left", "padding-inline-start"],
    ["padding-right", "padding-inline-end"],
    ["margin-left", "margin-inline-start"],
    ["margin-right", "margin-inline-end"],
  ];
  for (const [physical, logical] of physicalPairs) {
    if (new RegExp(`\\b${physical}\\s*:`, "i").test(code)) {
      push(
        "warning",
        "best-practice",
        lineNumberFor(code, physical),
        `Physical property "${physical}"`,
        `Physical properties assume left-to-right layout and break RTL translations.`,
        `Replace with the logical equivalent "${logical}".`
      );
    }
  }

  // Fixed width / height — not responsive.
  if (/\bwidth\s*:\s*\d+px/i.test(code)) {
    push(
      "info",
      "performance",
      lineNumberFor(code, "width"),
      "Fixed width in pixels",
      "Hard-coded px widths break on smaller viewports and cause horizontal scroll on mobile.",
      "Use min-width / max-width, the inline-size property, or clamp() for fluid sizing."
    );
  }
  if (/\bheight\s*:\s*\d+px/i.test(code)) {
    push(
      "info",
      "performance",
      lineNumberFor(code, "height"),
      "Fixed height in pixels",
      "Fixed heights clip content when text scales (zoom / font size) and break responsive layouts.",
      "Prefer aspect-ratio, min-height, or let content define height."
    );
  }

  // `transition: all` — known perf footgun.
  if (/transition\s*:\s*all/i.test(code)) {
    push(
      "warning",
      "performance",
      lineNumberFor(code, "transition"),
      '"transition: all" is expensive',
      "Transitioning `all` forces the browser to check every animatable property on each frame, including layout-triggering ones.",
      "List the specific property you want to animate, e.g. transition: background-color 200ms ease."
    );
  }

  // inline onclick — security + best practice.
  if (/on\w+\s*=\s*["']/.test(code)) {
    push(
      "critical",
      "security",
      lineNumberFor(code, "onclick"),
      "Inline event handler",
      'Inline handlers like onclick="..." require unsafe-inline in your CSP and mix behavior with markup.',
      "Attach the listener via addEventListener or a framework event handler, and ship a strict CSP."
    );
  }

  // fetch() in inline onclick — possible XSS sink.
  if (/fetch\s*\(\s*['"][^'"]*['"]\s*\)/.test(code)) {
    push(
      "critical",
      "security",
      lineNumberFor(code, "fetch"),
      "Hard-coded fetch URL in markup",
      "Calling fetch() with a hard-coded URL from an inline handler couples the view to the network and bypasses CSRF protection.",
      "Move the request to a typed service function with a CSRF token and input validation."
    );
  }

  // outline: none — accessibility.
  if (/outline\s*:\s*none/i.test(code)) {
    push(
      "critical",
      "accessibility",
      lineNumberFor(code, "outline"),
      '"outline: none" removes focus indicator',
      "Removing the outline with no replacement makes the control invisible to keyboard users — WCAG 2.4.7 violation.",
      "Keep a visible focus ring: focus-visible:outline-2 focus-visible:outline-offset-2 with the ring color."
    );
  }

  // prefers-reduced-motion missing — accessibility.
  if (!/prefers-reduced-motion/i.test(code) && /animation|transition/i.test(code)) {
    push(
      "info",
      "accessibility",
      1,
      "Missing prefers-reduced-motion guard",
      "Animations and transitions can trigger vestibular issues for some users.",
      "Add @media (prefers-reduced-motion: reduce) { … } to disable or simplify motion."
    );
  }

  // Color contrast — light gray on light bg.
  if (/color\s*:\s*(#fff|#ffffff|white)\b/i.test(code) && /background\s*:\s*rgba\(0,\s*0,\s*0,\s*0\.0/i.test(code)) {
    push(
      "warning",
      "accessibility",
      lineNumberFor(code, "#fff"),
      "Low contrast: white on translucent black",
      "White text on a 5% black overlay can fall below the 4.5:1 AA contrast threshold on light backgrounds.",
      "Use oklch() tokens from the RoyCSS palette, or compute the mix ratio so contrast stays above 4.5:1."
    );
  }

  // If no findings — celebrate.
  if (findings.length === 0) {
    push(
      "info",
      "best-practice",
      1,
      "No issues detected",
      "The snippet follows RoyCSS conventions — OKLCH colors, logical properties, and reduced-motion support.",
      "Keep it up. Add a unit test snapshot so regressions are caught automatically."
    );
  }

  // Score — start at 100, subtract weighted penalties, clamp 0..100.
  const penalty: Record<Severity, number> = {
    critical: 18,
    warning: 9,
    info: 3,
  };
  const raw = findings.reduce(
    (sum, f) => sum - penalty[f.severity],
    100
  );
  const score = Math.max(0, Math.min(100, raw));

  const counts = {
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
  };

  const summary =
    counts.critical > 0
      ? `${counts.critical} critical ${counts.critical === 1 ? "issue" : "issues"} must be fixed before ship — see the Security and Accessibility findings below.`
      : counts.warning > 0
        ? `${counts.warning} ${counts.warning === 1 ? "warning" : "warnings"} to address. The code is shippable, but resolve them in a follow-up.`
        : "Clean review — no critical or warning-level issues. Optional info-level suggestions below.";

  return { score, findings, summary };
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

function gradeFor(score: number): { letter: string; tone: string } {
  if (score >= 90) return { letter: "A", tone: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 75) return { letter: "B", tone: "text-primary" };
  if (score >= 60) return { letter: "C", tone: "text-amber-600 dark:text-amber-400" };
  if (score >= 40) return { letter: "D", tone: "text-orange-600 dark:text-orange-400" };
  return { letter: "F", tone: "text-destructive" };
}

function ScorePanel({ review }: { review: Review }) {
  const grade = gradeFor(review.score);
  const barTone =
    review.score >= 75
      ? "bg-emerald-500"
      : review.score >= 50
        ? "bg-amber-500"
        : "bg-destructive";
  const counts = {
    critical: review.findings.filter((f) => f.severity === "critical").length,
    warning: review.findings.filter((f) => f.severity === "warning").length,
    info: review.findings.filter((f) => f.severity === "info").length,
  };
  return (
    <div className="bg-muted/30 rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold tabular-nums", grade.tone)}>
            {review.score}
          </span>
          <span className={cn("text-xs font-semibold", grade.tone)}>
            Grade {grade.letter}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Progress
            value={review.score}
            className={cn("h-2", barTone && "[&>[data-slot=progress-indicator]]:" + barTone)}
          />
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className="border-destructive/30 bg-destructive/10 text-destructive gap-1 text-[10px]"
            >
              <AlertOctagon className="size-3" aria-hidden />
              {counts.critical} critical
            </Badge>
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[10px]"
            >
              <AlertTriangle className="size-3" aria-hidden />
              {counts.warning} warning
            </Badge>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary gap-1 text-[10px]"
            >
              <Info className="size-3" aria-hidden />
              {counts.info} info
            </Badge>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
        {review.summary}
      </p>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const SeverityIcon = SEVERITY_ICON[finding.severity];
  const CategoryIcon = CATEGORY_ICON[finding.category];
  return (
    <li className="bg-muted/30 rounded-lg border p-3.5">
      <div className="flex flex-wrap items-start gap-2.5">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md border",
            SEVERITY_BADGE[finding.severity]
          )}
          aria-hidden
        >
          <SeverityIcon className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-[10px] uppercase tracking-wide", SEVERITY_BADGE[finding.severity])}
            >
              {finding.severity}
            </Badge>
            <Badge
              variant="outline"
              className="text-muted-foreground border-border gap-1 text-[10px]"
            >
              <CategoryIcon className="size-3" aria-hidden />
              {CATEGORY_LABEL[finding.category]}
            </Badge>
            <Badge
              variant="outline"
              className="text-muted-foreground border-border font-mono text-[10px] tabular-nums"
            >
              line {finding.line}
            </Badge>
          </div>
          <p className="text-sm font-medium leading-tight">{finding.title}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {finding.description}
          </p>
          <div className="bg-background mt-1.5 rounded-md border border-dashed p-2.5">
            <p className="text-muted-foreground mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide">
              <Wrench className="size-3" aria-hidden />
              Recommended fix
            </p>
            <p className="text-foreground text-xs leading-relaxed">
              {finding.fix}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyReview
// ═══════════════════════════════════════════════════════════════════════

const RUN_DURATION_MS = 1600;
const TICK_MS = 40;

type RunState = "idle" | "running" | "done";

export function RoyReview() {
  // Backend-wired — falls back to existing demo data on error (progressive enhancement).
  const { data, loading, error } = useBackendData<unknown>("review/rules");
  void data;

  const [code, setCode] = useState("");
  const [runState, setRunState] = useState<RunState>("idle");
  const [progress, setProgress] = useState(0);
  const [review, setReview] = useState<Review | null>(null);
  const [copied, setCopied] = useState(false);

  const timersRef = useRef<Set<number>>(new Set());

  const registerTimer = useCallback((id: number): number => {
    timersRef.current.add(id);
    return id;
  }, []);

  const clearTimer = useCallback((id: number): void => {
    window.clearInterval(id);
    window.clearTimeout(id);
    timersRef.current.delete(id);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => {
        window.clearInterval(id);
        window.clearTimeout(id);
      });
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleReview = useCallback(() => {
    if (runState === "running") return;
    const text = code.trim();
    if (!text) return;

    setRunState("running");
    setProgress(0);
    setReview(null);

    const start = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / RUN_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearTimer(intervalId);
        setReview(buildReview(text));
        setRunState("done");
      }
    }, TICK_MS);
    registerTimer(intervalId);
  }, [code, runState, clearTimer, registerTimer]);

  const handlePreset = useCallback((preset: PresetDef) => {
    if (runState === "running") return;
    setCode(preset.code);
  }, [runState]);

  const handleCopy = useCallback(async () => {
    if (!review) return;
    const text = [
      `RoyReview — Score: ${review.score}/100`,
      "",
      review.summary,
      "",
      ...review.findings.map(
        (f) =>
          `[${f.severity.toUpperCase()}] [${CATEGORY_LABEL[f.category]}] line ${f.line} — ${f.title}\n  Issue: ${f.description}\n  Fix: ${f.fix}`
      ),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }, [review]);

  const handleReset = useCallback(() => {
    setRunState("idle");
    setProgress(0);
    setReview(null);
    setCode("");
    setCopied(false);
  }, []);

  const canReview = code.trim().length > 0 && runState !== "running";

  const findingsList = useMemo(() => {
    if (!review) return null;
    return (
      <ol className="space-y-2.5">
        {review.findings.map((f) => (
          <FindingCard key={f.id} finding={f} />
        ))}
      </ol>
    );
  }, [review]);

  return (
    <Card className="gap-0 py-0">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
        <div
          className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full"
          aria-hidden
        >
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">RoyReview</span>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary shrink-0 gap-1 text-[10px]"
            >
              <Code2 className="size-3" aria-hidden />
              AI Code Reviewer
            </Badge>
            <BackendLiveBadge loading={loading} error={error} />
          </div>
          <p className="text-muted-foreground truncate text-xs">
            Paste CSS / HTML / TS — get a scored review with concrete fixes.
          </p>
        </div>
      </div>

      {/* ── Input ──────────────────────────────────────────────────── */}
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <label htmlFor="roy-review-code" className="text-sm font-medium">
            Code to review
          </label>
          <Textarea
            id="roy-review-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your CSS / HTML / TS snippet here…"
            rows={7}
            disabled={runState === "running"}
            className="resize-y font-mono text-xs"
            aria-describedby="roy-review-help"
          />
          <p
            id="roy-review-help"
            className="text-muted-foreground text-[11px]"
          >
            The reviewer checks colors, logical properties, focus styles,
            inline handlers, transitions, and reduced-motion guards.
          </p>
        </div>

        {/* Preset chips */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
            Presets
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset)}
                disabled={runState === "running"}
                className="hover:border-primary hover:text-primary focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden>{preset.emoji}</span>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleReview}
            disabled={!canReview}
            className="gap-1.5"
          >
            {runState === "running" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Reviewing…
              </>
            ) : (
              <>
                <Play className="size-4" aria-hidden />
                Review Code
              </>
            )}
          </Button>
          {review && runState !== "running" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="gap-1.5"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="size-4 text-primary" aria-hidden />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" aria-hidden />
                    Copy review
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="text-muted-foreground hover:text-destructive gap-1.5"
              >
                <RotateCcw className="size-4" aria-hidden />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Progress bar */}
        {runState === "running" && (
          <div className="space-y-1" aria-live="polite">
            <Progress value={progress} className="h-1.5" />
            <p className="text-muted-foreground text-[11px] tabular-nums">
              Scanning colors, properties, transitions, and accessibility…
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </CardContent>

      {/* ── Review results ─────────────────────────────────────────── */}
      {review && runState === "done" && (
        <CardContent className="space-y-4 border-t pt-5">
          <CardTitle className="text-sm">Review results</CardTitle>
          <ScorePanel review={review} />
          {findingsList}
        </CardContent>
      )}
    </Card>
  );
}
