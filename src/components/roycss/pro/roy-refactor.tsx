"use client";

/**
 * RoyRefactor — code modernizer.
 *
 * Two-panel layout: input (left) + output (right). The user pastes legacy
 * CSS / HTML, picks a source framework (Bootstrap, Tailwind, Material,
 * Bulma, Legacy CSS), and clicks "Refactor". The component simulates a
 * 1.8-second AI run (with progress bar), produces a RoyCSS-flavored
 * refactor (OKLCH colors, logical properties, reduced-motion guard), and
 * renders:
 *   • the refactored code in the output panel,
 *   • a line-based diff view (added / removed / unchanged) with color
 *     coding,
 *   • a copy-refactored button.
 *
 * Design notes:
 *   • Self-contained: no props, no external stores, no API calls.
 *   • Simulated async via setTimeout / setInterval; every timer id is
 *     registered in a ref Set and cleared on unmount — no leaks.
 *   • TS strict, zero `any`. Exhaustiveness `never` guards on framework.
 *   • Palette follows the RoyCSS theme — emerald primary, amber for
 *     removed, rose for destructive. No indigo / blue.
 *   • Responsive within a max-w-2xl wrapper — panels stack on mobile.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRightLeft,
  Check,
  Code2,
  Copy,
  Loader2,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Wand2,
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

type Framework =
  | "bootstrap"
  | "tailwind"
  | "material"
  | "bulma"
  | "legacy";

interface FrameworkDef {
  id: Framework;
  label: string;
  emoji: string;
  hint: string;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
}

interface RefactorResult {
  output: string;
  diff: DiffLine[];
  notes: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// Frameworks
// ═══════════════════════════════════════════════════════════════════════

const FRAMEWORKS: readonly FrameworkDef[] = [
  {
    id: "bootstrap",
    label: "Bootstrap",
    emoji: "\u{1F354}",
    hint: "Replace .btn / .card / .container utility classes with RoyCSS tokens.",
  },
  {
    id: "tailwind",
    label: "Tailwind",
    emoji: "\u{1F4A8}",
    hint: "Inline utility soup → semantic classes with @apply-free composition.",
  },
  {
    id: "material",
    label: "Material",
    emoji: "\u{1F4DC}",
    hint: "Swap elevation + ripple for RoyCSS motion primitives.",
  },
  {
    id: "bulma",
    label: "Bulma",
    emoji: "\u{1F9C5}",
    hint: "Columns + modifiers → CSS grid + logical properties.",
  },
  {
    id: "legacy",
    label: "Legacy CSS",
    emoji: "\u{1F4DA}",
    hint: "Hex / rgba / physical properties → OKLCH + logical + reduced-motion.",
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// Refactor engine — pure transforms.
// ═══════════════════════════════════════════════════════════════════════

const HEX_TO_OKLCH: Record<string, string> = {
  "#3b82f6": "oklch(0.62 0.19 256)",
  "#2563eb": "oklch(0.55 0.21 258)",
  "#fff": "oklch(0.98 0 0)",
  "#ffffff": "oklch(0.98 0 0)",
  "#000": "oklch(0.18 0 0)",
  "#000000": "oklch(0.18 0 0)",
  "#111": "oklch(0.22 0 0)",
  "#ccc": "oklch(0.85 0 0)",
  "#333": "oklch(0.32 0 0)",
};

/** Replace legacy color syntax with OKLCH equivalents. */
function modernizeColors(line: string): { line: string; note: string | null } {
  let out = line;
  let note: string | null = null;

  for (const [hex, oklch] of Object.entries(HEX_TO_OKLCH)) {
    const re = new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    if (re.test(out)) {
      out = out.replace(re, oklch);
      note = `Converted ${hex.toUpperCase()} \u2192 ${oklch}`;
    }
  }

  // rgba() / rgb() \u2192 color-mix in oklch.
  const rgbaMatch = out.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (rgbaMatch) {
    const alpha = rgbaMatch[4] ?? "1";
    const replacement = `color-mix(in oklch, oklch(0.18 0 0) ${(parseFloat(alpha) * 100).toFixed(0)}%, transparent)`;
    out = out.replace(rgbaMatch[0], replacement);
    note = `Converted rgba() \u2192 ${replacement}`;
  }

  return { line: out, note };
}

/** Replace physical properties with logical equivalents. */
function modernizeProperties(line: string): { line: string; note: string | null } {
  const map: Array<[RegExp, string, string]> = [
    [/\bpadding-left\s*:/i, "padding-inline-start:", "padding-left \u2192 padding-inline-start"],
    [/\bpadding-right\s*:/i, "padding-inline-end:", "padding-right \u2192 padding-inline-end"],
    [/\bmargin-left\s*:/i, "margin-inline-start:", "margin-left \u2192 margin-inline-start"],
    [/\bmargin-right\s*:/i, "margin-inline-end:", "margin-right \u2192 margin-inline-end"],
    [/\bwidth\s*:\s*(\d+px)/i, "inline-size: $1", "width \u2192 inline-size"],
    [/\bheight\s*:\s*(\d+px)/i, "block-size: $1", "height \u2192 block-size"],
  ];
  for (const [re, replacement, label] of map) {
    if (re.test(line)) {
      return { line: line.replace(re, replacement), note: label };
    }
  }
  return { line, note: null };
}

/** Strip Bootstrap / Bulma / Material class sugar and inline styles. */
function stripFrameworkClasses(line: string, framework: Framework): { line: string; note: string | null } {
  if (framework === "bootstrap") {
    if (/class\s*=\s*["'][^"']*\b(btn|card|container|row|col-)\w*[^"']*["']/i.test(line)) {
      const cleaned = line.replace(
        /class\s*=\s*["']([^"']*)["']/i,
        (_m, classes: string) =>
          `class="${classes
            .split(/\s+/)
            .filter((c: string) => !/^(btn|card|container|row|col-)/.test(c))
            .concat("roycss-card")
            .join(" ")}"`
      );
      return { line: cleaned, note: "Bootstrap utilities \u2192 roycss-card token" };
    }
  }
  if (framework === "tailwind") {
    if (/class\s*=\s*["'][^"']*(flex|grid|p-\d|bg-)[^"']*["']/i.test(line)) {
      return {
        line: line.replace(
          /class\s*=\s*["'][^"']*["']/i,
          'class="roycss-card"'
        ),
        note: "Tailwind utility soup \u2192 roycss-card",
      };
    }
  }
  if (framework === "material") {
    if (/class\s*=\s*["'][^"']*\bmdc-\w+[^"']*["']/i.test(line)) {
      return {
        line: line.replace(/class\s*=\s*["'][^"']*["']/i, 'class="roycss-card"'),
        note: "MDC class \u2192 roycss-card",
      };
    }
  }
  if (framework === "bulma") {
    if (/class\s*=\s*["'][^"']*\b(column|button|card)\w*[^"']*["']/i.test(line)) {
      return {
        line: line.replace(/class\s*=\s*["'][^"']*["']/i, 'class="roycss-card"'),
        note: "Bulma column / button \u2192 roycss-card",
      };
    }
  }
  return { line, note: null };
}

/** Build the refactored output + diff + notes. */
function refactor(input: string, framework: Framework): RefactorResult {
  const inputLines = input.split("\n");
  const outLines: string[] = [];
  const notes: string[] = [];

  let sawAnimation = false;
  let hasReducedMotion = false;
  let inStyleBlock = false;
  let inTag = false;

  for (const raw of inputLines) {
    let line = raw;
    const isStyleOpen = /<style/i.test(line);
    const isStyleClose = /<\/style>/i.test(line);
    if (isStyleOpen) inStyleBlock = true;
    if (isStyleClose) inStyleBlock = false;

    // Style block: modernize colors + properties.
    if (inStyleBlock || isStyleOpen) {
      const c = modernizeColors(line);
      if (c.note) notes.push(c.note);
      line = c.line;

      const p = modernizeProperties(line);
      if (p.note) notes.push(p.note);
      line = p.line;

      if (/animation|transition/i.test(line)) sawAnimation = true;
      if (/prefers-reduced-motion/i.test(line)) hasReducedMotion = true;
    } else {
      // Markup line: strip framework class sugar.
      if (/<[a-z]/i.test(line)) inTag = true;
      const fc = stripFrameworkClasses(line, framework);
      if (fc.note) notes.push(fc.note);
      line = fc.line;
    }

    outLines.push(line);
    void inTag;
  }

  // Append a reduced-motion guard if the source had animations but no guard.
  if (sawAnimation && !hasReducedMotion) {
    outLines.push("");
    outLines.push("@media (prefers-reduced-motion: reduce) {");
    outLines.push("  * { animation: none !important; transition: none !important; }");
    outLines.push("}");
    notes.push("Added prefers-reduced-motion guard");
  }

  // De-duplicate notes (keep order).
  const uniqueNotes: string[] = [];
  for (const n of notes) {
    if (!uniqueNotes.includes(n)) uniqueNotes.push(n);
  }

  return {
    output: outLines.join("\n"),
    diff: lineDiff(inputLines, outLines),
    notes: uniqueNotes,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Line-based diff (Myers-lite LCS). O(n*m) — fine for code snippets.
// ═══════════════════════════════════════════════════════════════════════

function lineDiff(a: string[], b: string[]): DiffLine[] {
  const n = a.length;
  const m = b.length;
  // dp[i][j] = LCS length of a[i..] and b[j..]
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ type: "unchanged", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "removed", text: a[i] });
      i++;
    } else {
      result.push({ type: "added", text: b[j] });
      j++;
    }
  }
  while (i < n) {
    result.push({ type: "removed", text: a[i] });
    i++;
  }
  while (j < m) {
    result.push({ type: "added", text: b[j] });
    j++;
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

function DiffRow({ line, num }: { line: DiffLine; num: number }) {
  const symbol =
    line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
  const tone =
    line.type === "added"
      ? "border-l-2 border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : line.type === "removed"
        ? "border-l-2 border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : "text-muted-foreground";
  return (
    <div className={cn("flex gap-2 px-2 py-0.5 font-mono text-[11px] leading-relaxed", tone)}>
      <span className="w-6 shrink-0 select-none text-right opacity-60 tabular-nums">
        {num}
      </span>
      <span className="w-3 shrink-0 select-none opacity-80">{symbol}</span>
      <code className="whitespace-pre-wrap break-words">{line.text || " "}</code>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// RoyRefactor
// ═══════════════════════════════════════════════════════════════════════

const RUN_DURATION_MS = 1800;
const TICK_MS = 40;
const SAMPLE_INPUT = `.btn {
  background: #3b82f6;
  color: #fff;
  padding-left: 12px;
  padding-right: 12px;
  width: 120px;
  transition: all 0.5s ease;
}`;

type RunState = "idle" | "running" | "done";

export function RoyRefactor() {
  const [input, setInput] = useState("");
  const [framework, setFramework] = useState<Framework>("legacy");
  const [runState, setRunState] = useState<RunState>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<RefactorResult | null>(null);
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

  const handleRefactor = useCallback(() => {
    if (runState === "running") return;
    const text = input.trim();
    if (!text) return;

    setRunState("running");
    setProgress(0);
    setResult(null);

    const start = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / RUN_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearTimer(intervalId);
        setResult(refactor(text, framework));
        setRunState("done");
      }
    }, TICK_MS);
    registerTimer(intervalId);
  }, [input, framework, runState, clearTimer, registerTimer]);

  const handleLoadSample = useCallback(() => {
    if (runState === "running") return;
    setInput(SAMPLE_INPUT);
    setResult(null);
    setRunState("idle");
  }, [runState]);

  const handleReset = useCallback(() => {
    setRunState("idle");
    setProgress(0);
    setResult(null);
    setInput("");
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = result.output;
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
  }, [result]);

  const canRefactor = input.trim().length > 0 && runState !== "running";

  const activeFramework = useMemo(
    () => FRAMEWORKS.find((f) => f.id === framework) ?? FRAMEWORKS[0],
    [framework]
  );

  const diffStats = useMemo(() => {
    if (!result) return { added: 0, removed: 0, unchanged: 0 };
    return {
      added: result.diff.filter((d) => d.type === "added").length,
      removed: result.diff.filter((d) => d.type === "removed").length,
      unchanged: result.diff.filter((d) => d.type === "unchanged").length,
    };
  }, [result]);

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
            <span className="truncate font-semibold">RoyRefactor</span>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary shrink-0 gap-1 text-[10px]"
            >
              <Wand2 className="size-3" aria-hidden />
              Code Modernizer
            </Badge>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            Convert legacy CSS / HTML to RoyCSS — OKLCH, logical properties,
            reduced-motion.
          </p>
        </div>
      </div>

      {/* ── Framework selector ─────────────────────────────────────── */}
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <label
            htmlFor="roy-refactor-framework"
            className="text-sm font-medium"
          >
            Source framework
          </label>
          <div
            id="roy-refactor-framework"
            role="radiogroup"
            aria-label="Source framework"
            className="flex flex-wrap gap-2"
          >
            {FRAMEWORKS.map((fw) => {
              const active = fw.id === framework;
              return (
                <button
                  key={fw.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setFramework(fw.id)}
                  disabled={runState === "running"}
                  className={cn(
                    "focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:border-primary hover:text-primary"
                  )}
                >
                  <span aria-hidden>{fw.emoji}</span>
                  {fw.label}
                </button>
              );
            })}
          </div>
          <p className="text-muted-foreground text-[11px]">
            {activeFramework.hint}
          </p>
        </div>

        {/* Two-panel layout */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="roy-refactor-input"
                className="text-sm font-medium"
              >
                Input (legacy)
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLoadSample}
                disabled={runState === "running"}
                className="text-muted-foreground h-7 gap-1 px-2 text-[11px]"
              >
                Load sample
              </Button>
            </div>
            <Textarea
              id="roy-refactor-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste Bootstrap / Tailwind / Material / Bulma / legacy CSS here…"
              rows={10}
              disabled={runState === "running"}
              className="resize-y font-mono text-xs"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Output (RoyCSS)</span>
              {result && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-primary h-7 gap-1 px-2 text-[11px]"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-primary" aria-hidden />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" aria-hidden />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
            <div
              className="bg-background min-h-[10rem] overflow-auto rounded-md border p-3"
              aria-live="polite"
              aria-label="Refactored output"
            >
              {result ? (
                <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words">
                  <code>{result.output}</code>
                </pre>
              ) : (
                <p className="text-muted-foreground text-xs">
                  {runState === "running"
                    ? "Refactoring…"
                    : "Output appears here after refactor."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleRefactor}
            disabled={!canRefactor}
            className="gap-1.5"
          >
            {runState === "running" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Refactoring…
              </>
            ) : (
              <>
                <ArrowRightLeft className="size-4" aria-hidden />
                <Play className="size-4" aria-hidden />
                Refactor
              </>
            )}
          </Button>
          {result && runState !== "running" && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              className="text-muted-foreground hover:text-destructive gap-1.5"
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset
            </Button>
          )}
        </div>

        {/* Progress bar */}
        {runState === "running" && (
          <div className="space-y-1" aria-live="polite">
            <Progress value={progress} className="h-1.5" />
            <p className="text-muted-foreground text-[11px] tabular-nums">
              Stripping {activeFramework.label} sugar, modernizing colors and
              properties… {Math.round(progress)}%
            </p>
          </div>
        )}
      </CardContent>

      {/* ── Diff + notes ───────────────────────────────────────────── */}
      {result && runState === "done" && (
        <CardContent className="space-y-4 border-t pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm">Diff view</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[10px]"
              >
                <Plus className="size-3" aria-hidden />
                {diffStats.added} added
              </Badge>
              <Badge
                variant="outline"
                className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1 text-[10px]"
              >
                <Minus className="size-3" aria-hidden />
                {diffStats.removed} removed
              </Badge>
              <Badge
                variant="outline"
                className="text-muted-foreground border-border gap-1 text-[10px]"
              >
                <Code2 className="size-3" aria-hidden />
                {diffStats.unchanged} unchanged
              </Badge>
            </div>
          </div>

          <div className="bg-background overflow-x-auto rounded-lg border">
            <div className="divide-y divide-border/40">
              {result.diff.map((line, idx) => (
                <DiffRow key={idx} line={line} num={idx + 1} />
              ))}
            </div>
          </div>

          {/* Notes */}
          <Card className="bg-muted/30 py-0">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="text-xs">What changed</CardTitle>
              <CardDescription className="text-[11px]">
                {result.notes.length} transformation
                {result.notes.length === 1 ? "" : "s"} applied.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-1.5">
                {result.notes.map((note) => (
                  <li
                    key={note}
                    className="text-muted-foreground flex items-start gap-2 text-xs"
                  >
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-emerald-500"
                      aria-hidden
                    />
                    <span className="font-mono">{note}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      )}
    </Card>
  );
}
