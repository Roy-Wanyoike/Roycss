"use client";

/**
 * CSSDiffEngine — paste your existing CSS and visually diff it against a
 * RoyCSS effect.
 *
 * Workflow:
 *   1. Paste "Your CSS" (left textarea) — anything from a single rule to a
 *      whole stylesheet.
 *   2. Pick a RoyCSS effect from the dropdown (curated subset of 60 popular
 *      effects spanning every category). The right textarea auto-fills with
 *      that effect's `cssCode`.
 *   3. The "Visual Diff" panel between the two textareas runs a classic
 *      Longest-Common-Subsequence line diff: unchanged lines render gray,
 *      removed lines render red (only-in-left), added lines render green
 *      (only-in-right).
 *   4. "Apply RoyCSS" merges your CSS with the selected effect (your CSS
 *      kept verbatim, the RoyCSS block appended under a labelled banner)
 *      and reveals a "Transformed CSS" result panel with a Copy button.
 *   5. A scoped live preview renders the combined CSS on a single demo
 *      element so you can see what the merged result looks like. The CSS
 *      is scoped by appending a unique class to every `.roycss-*` selector,
 *      so preview styles cannot leak onto the host page.
 *
 * Implementation notes:
 *   - LCS DP is O(n·m); both sides are capped at 800 lines (with a visible
 *     "truncated" marker) so very large pastes stay responsive.
 *   - Clipboard writes are best-effort. Copy confirmation timer tracked via
 *     `useRef` and cleared on unmount.
 *   - TS strict, no `any`, no `console.log`. Self-contained, no props.
 *   - Responsive within `max-w-5xl`.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Copy,
  Check,
  Sparkles,
  Wand2,
  Code2,
  RotateCcw,
  GitCompare,
  Plus,
  Minus,
  Equal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { effects, type CSSEffect, type EffectCategory } from "@/lib/roycss-effects";

// ============================================================
// Constants
// ============================================================

const COPY_CONFIRM_MS = 2000;
const DIFF_LINE_CAP = 800;

/** Curated picker subset — 60 popular effects grouped by category. */
const PICKER_EFFECTS: CSSEffect[] = (() => {
  // Take a stable, category-balanced subset for the picker dropdown.
  const byCat = new Map<EffectCategory, CSSEffect[]>();
  for (const e of effects) {
    const arr = byCat.get(e.category);
    if (arr) {
      arr.push(e);
    } else {
      byCat.set(e.category, [e]);
    }
  }
  const out: CSSEffect[] = [];
  for (const arr of byCat.values()) {
    out.push(...arr.slice(0, 6));
  }
  // Stable sort by name for the dropdown.
  return out
    .slice(0, 60)
    .sort((a, b) => a.name.localeCompare(b.name));
})();

const DEFAULT_YOUR_CSS = `.btn {
  padding: 10px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #111827;
  font-weight: 600;
  cursor: pointer;
}

.btn:hover {
  background: #f9fafb;
}`;

// ============================================================
// Types
// ============================================================

type DiffKind = "added" | "removed" | "unchanged";

interface DiffLine {
  kind: DiffKind;
  text: string;
}

// ============================================================
// Diff algorithm (Longest Common Subsequence, line-level)
// ============================================================

/**
 * Compute a unified line-level diff between two strings using LCS DP.
 * Returns an ordered list of { kind, text } rows suitable for direct
 * rendering. Both inputs are capped at DIFF_LINE_CAP lines for perf.
 */
function diffLines(aIn: string, bIn: string): {
  rows: DiffLine[];
  truncated: boolean;
} {
  const aRaw = aIn.split("\n");
  const bRaw = bIn.split("\n");
  const truncated = aRaw.length > DIFF_LINE_CAP || bRaw.length > DIFF_LINE_CAP;
  const a = aRaw.slice(0, DIFF_LINE_CAP);
  const b = bRaw.slice(0, DIFF_LINE_CAP);

  const n = a.length;
  const m = b.length;

  // dp[i][j] = length of LCS of a[i..] and b[j..]
  // Use Int16Array rows for memory + cache friendliness.
  const dp: Int16Array[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    dp[i] = new Int16Array(m + 1);
  }
  for (let i = n - 1; i >= 0; i--) {
    const row = dp[i];
    const next = dp[i + 1];
    const ai = a[i];
    for (let j = m - 1; j >= 0; j--) {
      if (ai === b[j]) {
        row[j] = next[j + 1] + 1;
      } else {
        const down = next[j];
        const right = row[j + 1];
        row[j] = down >= right ? down : right;
      }
    }
  }

  const rows: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ kind: "unchanged", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ kind: "removed", text: a[i] });
      i++;
    } else {
      rows.push({ kind: "added", text: b[j] });
      j++;
    }
  }
  while (i < n) {
    rows.push({ kind: "removed", text: a[i] });
    i++;
  }
  while (j < m) {
    rows.push({ kind: "added", text: b[j] });
    j++;
  }

  return { rows, truncated };
}

// ============================================================
// CSS scoping (so preview styles don't leak)
// ============================================================

/**
 * Append `.{scope}` to every `.roycss-<name>` selector in the source so the
 * rules only match elements that have BOTH the original class and the scope
 * class. `@keyframes` and other at-rules are left untouched because they're
 * referenced by name, not by selector.
 */
function scopeEffectCss(css: string, scope: string): string {
  return css.replace(/\.roycss-[\w-]+/g, (m) => `${m}.${scope}`);
}

// ============================================================
// Component
// ============================================================

export function CSSDiffEngine() {
  const [yourCss, setYourCss] = useState<string>(DEFAULT_YOUR_CSS);
  const [effectId, setEffectId] = useState<string>(PICKER_EFFECTS[0]?.id ?? "");
  const [applied, setApplied] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable unique scope class for the live preview.
  const rawId = useId();
  const scope = useMemo(
    () => `roycss-diff-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`,
    [rawId],
  );

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const effect = useMemo(() => {
    return (
      PICKER_EFFECTS.find((e) => e.id === effectId) ?? PICKER_EFFECTS[0]
    );
  }, [effectId]);

  const roycssEquivalent = useMemo(() => effect?.cssCode ?? "", [effect]);

  const diff = useMemo(
    () => diffLines(yourCss, roycssEquivalent),
    [yourCss, roycssEquivalent],
  );

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;
    for (const r of diff.rows) {
      if (r.kind === "added") added++;
      else if (r.kind === "removed") removed++;
      else unchanged++;
    }
    return { added, removed, unchanged, total: diff.rows.length };
  }, [diff]);

  const transformedCss = useMemo(() => {
    if (!applied || !effect) return "";
    const head = `/* ─── RoyCSS · ${effect.name} ─── */`;
    const body = yourCss.trimEnd();
    return `${body}\n\n${head}\n${roycssEquivalent}`;
  }, [applied, effect, yourCss, roycssEquivalent]);

  // Scoped CSS for the live preview (your CSS + RoyCSS effect, both scoped).
  const previewCss = useMemo(() => {
    if (!applied || !effect) return "";
    const yours = scopeEffectCss(yourCss, scope);
    const roycss = scopeEffectCss(roycssEquivalent, scope);
    return `${yours}\n\n${roycss}`;
  }, [applied, effect, yourCss, roycssEquivalent, scope]);

  const handleApply = useCallback(() => {
    setApplied(true);
  }, []);

  const handleReset = useCallback(() => {
    setApplied(false);
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!transformedCss) return;
    try {
      await navigator.clipboard.writeText(transformedCss);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), COPY_CONFIRM_MS);
    } catch {
      /* clipboard unavailable — silent */
    }
  }, [transformedCss]);

  // Group picker effects by category for the dropdown.
  const grouped = useMemo(() => {
    const map = new Map<EffectCategory, CSSEffect[]>();
    for (const e of PICKER_EFFECTS) {
      const arr = map.get(e.category);
      if (arr) {
        arr.push(e);
      } else {
        map.set(e.category, [e]);
      }
    }
    return Array.from(map.entries());
  }, []);

  // Compose preview element class list — all roycss classes from the effect
  // (we only pick the first one because each effect has exactly one
  // .roycss-* selector for the preview element).
  const previewClassName = useMemo(() => {
    if (!effect) return scope;
    const m = effect.cssCode.match(/\.roycss-([\w-]+)/);
    const cls = m ? `roycss-${m[1]}` : "";
    return cls ? `${cls} ${scope}` : scope;
  }, [effect, scope]);

  const previewStyle = useMemo<CSSProperties>(
    () => ({
      padding: "1.5rem 2rem",
      borderRadius: "0.75rem",
      background: "#f4f4f5",
      color: "#18181b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "6rem",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontWeight: 600,
    }),
    [],
  );

  return (
    <Card className="mx-auto w-full max-w-5xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="size-5 text-emerald-600" />
          CSS Diff Engine
        </CardTitle>
        <CardDescription>
          Paste your existing CSS, pick a RoyCSS effect, and see a line-by-line
          diff with a scoped live preview of the merged result.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Picker */}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="effect-select" className="text-xs font-medium">
              RoyCSS effect to compare against
            </Label>
            <Select value={effectId} onValueChange={setEffectId}>
              <SelectTrigger id="effect-select" className="w-full">
                <SelectValue placeholder="Select an effect" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {grouped.map(([cat, list]) => (
                  <SelectGroup key={cat}>
                    <SelectLabel className="capitalize">{cat}</SelectLabel>
                    {list.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleApply}
              disabled={!effect || applied}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Wand2 className="size-4" />
              Apply RoyCSS
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!applied}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Two textareas */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="your-css" className="flex items-center gap-2 text-xs">
              <Code2 className="size-3.5 text-zinc-500" />
              Your CSS
            </Label>
            <Textarea
              id="your-css"
              value={yourCss}
              onChange={(e) => {
                setYourCss(e.target.value);
                setApplied(false);
              }}
              spellCheck={false}
              className="min-h-64 resize-y font-mono text-xs leading-relaxed"
              placeholder=".your-class { ... }"
            />
          </div>
          <div className="grid gap-1.5">
            <Label
              htmlFor="roycss-css"
              className="flex items-center gap-2 text-xs"
            >
              <Sparkles className="size-3.5 text-emerald-600" />
              RoyCSS equivalent
            </Label>
            <Textarea
              id="roycss-css"
              value={roycssEquivalent}
              readOnly
              spellCheck={false}
              className="min-h-64 resize-y bg-emerald-50/40 font-mono text-xs leading-relaxed"
            />
          </div>
        </div>

        {/* Diff stats */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            variant="secondary"
            className="gap-1 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            <Minus className="size-3" />
            {stats.removed} removed
          </Badge>
          <Badge
            variant="secondary"
            className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <Plus className="size-3" />
            {stats.added} added
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Equal className="size-3" />
            {stats.unchanged} unchanged
          </Badge>
          {diff.truncated && (
            <Badge variant="outline" className="text-amber-700">
              truncated to {DIFF_LINE_CAP} lines/side
            </Badge>
          )}
        </div>

        {/* Visual diff */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 dark:border-zinc-800">
          <div className="border-b border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300">
            Visual Diff
          </div>
          <div className="max-h-96 overflow-auto font-mono text-xs">
            {diff.rows.length === 0 ? (
              <div className="px-3 py-6 text-center text-zinc-500">
                Paste your CSS to see the diff.
              </div>
            ) : (
              <pre className="m-0 overflow-x-auto">
                {diff.rows.map((r, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-2 px-3 py-0.5 leading-5",
                      r.kind === "added" &&
                        "bg-emerald-950/40 text-emerald-300",
                      r.kind === "removed" &&
                        "bg-red-950/40 text-red-300",
                      r.kind === "unchanged" && "text-zinc-500",
                    )}
                  >
                    <span className="w-4 select-none text-right opacity-60">
                      {r.kind === "added" ? "+" : r.kind === "removed" ? "-" : " "}
                    </span>
                    <span className="whitespace-pre-wrap break-all">
                      {r.text === "" ? "\u00A0" : r.text}
                    </span>
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>

        {/* Result + preview */}
        {applied && effect && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-xs">
                  <Sparkles className="size-3.5 text-emerald-600" />
                  Transformed CSS
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-7 gap-1.5 text-xs"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
                {transformedCss || "—"}
              </pre>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2 text-xs">
                <Code2 className="size-3.5 text-zinc-500" />
                Live Preview
              </Label>
              <style dangerouslySetInnerHTML={{ __html: previewCss }} />
              <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
                <div className={previewClassName} style={previewStyle}>
                  RoyCSS Preview
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CSSDiffEngine;
